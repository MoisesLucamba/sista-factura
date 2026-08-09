ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS iban text, ADD COLUMN IF NOT EXISTS banco text;

CREATE TABLE IF NOT EXISTS public.seguros_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  valor_seguro numeric NOT NULL DEFAULT 0,
  num_trabalhadores integer NOT NULL DEFAULT 0,
  actividade text,
  contacto text,
  notas text,
  estado text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.seguros_pedidos TO authenticated;
GRANT ALL ON public.seguros_pedidos TO service_role;

ALTER TABLE public.seguros_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own seguros select" ON public.seguros_pedidos FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own seguros insert" ON public.seguros_pedidos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own seguros update" ON public.seguros_pedidos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_seguros_pedidos_updated_at BEFORE UPDATE ON public.seguros_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();