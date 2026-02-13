
-- Update faturas tipo constraint to include proforma
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'faturas_tipo_check') THEN
    ALTER TABLE public.faturas DROP CONSTRAINT faturas_tipo_check;
  END IF;
END $$;

ALTER TABLE public.faturas ADD CONSTRAINT faturas_tipo_check 
  CHECK (tipo = ANY (ARRAY['fatura'::text, 'fatura-recibo'::text, 'recibo'::text, 'nota-credito'::text, 'proforma'::text]));

-- Create proforma conversions table
CREATE TABLE IF NOT EXISTS public.proforma_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proforma_id UUID NOT NULL REFERENCES public.faturas(id),
  fatura_id UUID NOT NULL REFERENCES public.faturas(id),
  user_id UUID NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.proforma_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversions"
  ON public.proforma_conversions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversions"
  ON public.proforma_conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
