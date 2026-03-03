
-- Function to lookup buyer profile by faktura_id (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.lookup_buyer_by_faktura_id(_faktura_id text)
RETURNS TABLE(user_id uuid, nome text, nif text, telefone text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.nome, p.nif, p.telefone, p.email
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE p.faktura_id = _faktura_id
    AND ur.role = 'comprador'
  LIMIT 1;
$$;

-- Add buyer_user_id column to faturas to link invoices to buyers
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS buyer_user_id uuid;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS buyer_faktura_id text;

-- Allow buyers to view invoices linked to them
CREATE POLICY "Buyers can view their linked invoices"
  ON public.faturas FOR SELECT
  USING (auth.uid() = buyer_user_id);

-- Function to auto-create buyer_purchase when invoice is emitted with a buyer
CREATE OR REPLACE FUNCTION public.create_buyer_purchase_on_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_empresa text;
BEGIN
  -- Only trigger when invoice has a buyer and transitions to emitida
  IF NEW.buyer_user_id IS NOT NULL AND NEW.estado = 'emitida' AND (OLD.estado IS NULL OR OLD.estado = 'rascunho') THEN
    -- Get vendor name
    SELECT nome_empresa INTO vendor_empresa FROM public.agt_config WHERE user_id = NEW.user_id LIMIT 1;
    
    -- Create purchase record
    INSERT INTO public.buyer_purchases (buyer_user_id, fatura_id, valor, pontos_ganhos, vendor_name, descricao)
    VALUES (
      NEW.buyer_user_id,
      NEW.id,
      NEW.total,
      CASE WHEN NEW.total >= 1500 THEN 50 ELSE 0 END,
      COALESCE(vendor_empresa, 'Vendedor'),
      'Fatura ' || NEW.numero
    );

    -- Update wallet points and saldo
    UPDATE public.buyer_wallets
    SET pontos = pontos + CASE WHEN NEW.total >= 1500 THEN 50 ELSE 0 END,
        saldo = saldo + CASE WHEN NEW.total >= 1500 THEN 50 ELSE 0 END,
        updated_at = now()
    WHERE user_id = NEW.buyer_user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_buyer_purchase
  AFTER INSERT OR UPDATE ON public.faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.create_buyer_purchase_on_invoice();

-- Allow buyers to view invoice items for their linked invoices
CREATE POLICY "Buyers can view items of their linked invoices"
  ON public.itens_fatura FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.faturas
    WHERE faturas.id = itens_fatura.fatura_id
      AND faturas.buyer_user_id = auth.uid()
  ));
