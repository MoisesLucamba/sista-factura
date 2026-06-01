-- Ponto 1: Desconto decimal nas linhas
ALTER TABLE public.itens_fatura
  ALTER COLUMN desconto TYPE numeric(6,2),
  ALTER COLUMN desconto SET DEFAULT 0;

-- Ponto 2: NIF do cliente opcional
ALTER TABLE public.clientes ALTER COLUMN nif DROP NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN nif SET DEFAULT '';

-- Ponto 2b: system_entry_date sempre pelo servidor
ALTER TABLE public.faturas
  ALTER COLUMN system_entry_date SET DEFAULT NOW(),
  ALTER COLUMN system_entry_date SET NOT NULL;

CREATE OR REPLACE FUNCTION public.lock_system_entry_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.system_entry_date := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_system_entry_date ON public.faturas;
CREATE TRIGGER set_system_entry_date
  BEFORE INSERT ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.lock_system_entry_date();

-- Ponto 6: Certificação AGT configurável em agt_config
ALTER TABLE public.agt_config
  ADD COLUMN IF NOT EXISTS software_certificate_number text DEFAULT '31',
  ADD COLUMN IF NOT EXISTS product_company_tax_id text DEFAULT '5002964031',
  ADD COLUMN IF NOT EXISTS software_validation_number text DEFAULT 'n31.1/AGT20';