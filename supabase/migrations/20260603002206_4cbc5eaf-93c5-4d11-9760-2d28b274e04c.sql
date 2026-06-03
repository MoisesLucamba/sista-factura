ALTER TABLE public.faturas DROP CONSTRAINT faturas_tipo_check;
ALTER TABLE public.faturas ADD CONSTRAINT faturas_tipo_check CHECK (tipo = ANY (ARRAY[
  'fatura','fatura-recibo','recibo','nota-credito','nota-debito',
  'proforma','orcamento','guia-remessa',
  'fatura-global','fatura-generica','auto-faturacao','consulta'
]));