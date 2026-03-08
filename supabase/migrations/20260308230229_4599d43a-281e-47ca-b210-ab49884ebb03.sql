
-- 1. Create trigger for locking emitted invoices (attach existing function)
CREATE TRIGGER lock_emitted_invoice_trigger
BEFORE UPDATE ON public.faturas
FOR EACH ROW
EXECUTE FUNCTION public.lock_emitted_invoice();

-- 2. Create trigger for automatic audit logging on faturas
CREATE OR REPLACE FUNCTION public.audit_fatura_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
    VALUES (NEW.user_id, 'create', 'fatura', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (NEW.user_id, 
      CASE 
        WHEN NEW.estado = 'paga' AND OLD.estado != 'paga' THEN 'payment'
        WHEN NEW.estado = 'anulada' AND OLD.estado != 'anulada' THEN 'cancel'
        ELSE 'update'
      END,
      'fatura', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER audit_fatura_trigger
AFTER INSERT OR UPDATE ON public.faturas
FOR EACH ROW
EXECUTE FUNCTION public.audit_fatura_changes();

-- 3. Create ATCUD generation function
CREATE OR REPLACE FUNCTION public.generate_atcud(_serie text, _numero text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  seq_part text;
BEGIN
  -- Extract the sequential number from the invoice number (e.g. FT/2026/000001 -> 000001)
  seq_part := SPLIT_PART(_numero, '/', 3);
  RETURN _serie || '-' || seq_part;
END;
$function$;
