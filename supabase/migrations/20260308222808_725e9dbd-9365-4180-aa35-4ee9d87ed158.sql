
-- 1. Trigger to decrement stock when invoice is emitted
CREATE OR REPLACE FUNCTION public.decrement_stock_on_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item RECORD;
  produto_record RECORD;
BEGIN
  -- Only when transitioning to 'emitida'
  IF NEW.estado = 'emitida' AND (OLD.estado IS NULL OR OLD.estado = 'rascunho') THEN
    FOR item IN
      SELECT produto_id, quantidade FROM public.itens_fatura WHERE fatura_id = NEW.id
    LOOP
      -- Decrement stock
      UPDATE public.produtos
      SET stock = GREATEST(0, COALESCE(stock, 0) - item.quantidade::int)
      WHERE id = item.produto_id AND tipo = 'produto' AND stock IS NOT NULL;

      -- Check if stock is at or below minimum
      SELECT nome, stock, stock_minimo INTO produto_record
      FROM public.produtos
      WHERE id = item.produto_id AND tipo = 'produto' AND stock IS NOT NULL AND stock_minimo IS NOT NULL;

      IF FOUND AND (COALESCE(produto_record.stock, 0) - item.quantidade::int) <= COALESCE(produto_record.stock_minimo, 0) THEN
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (NEW.user_id, 'warning', 'Stock Baixo ⚠️',
          'O produto "' || produto_record.nome || '" atingiu o stock mínimo (' || produto_record.stock_minimo || ' unidades). Reponha o inventário.');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock_on_invoice
  AFTER UPDATE ON public.faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_invoice();

-- 2. Function to mark overdue invoices and notify
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  overdue_count integer;
  f RECORD;
BEGIN
  overdue_count := 0;
  FOR f IN
    SELECT id, numero FROM public.faturas
    WHERE user_id = _user_id
      AND estado = 'emitida'
      AND data_vencimento < CURRENT_DATE
  LOOP
    UPDATE public.faturas SET estado = 'vencida' WHERE id = f.id;
    overdue_count := overdue_count + 1;
  END LOOP;

  IF overdue_count > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (_user_id, 'warning', 'Faturas Vencidas ⏰',
      overdue_count || ' fatura(s) foram marcadas como vencidas. Verifique e tome acção.');
  END IF;

  RETURN overdue_count;
END;
$$;
