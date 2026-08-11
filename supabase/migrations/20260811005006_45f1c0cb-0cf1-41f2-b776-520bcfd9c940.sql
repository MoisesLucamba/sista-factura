CREATE TABLE public.documentos_adicionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_adicionais TO authenticated;
GRANT ALL ON public.documentos_adicionais TO service_role;

ALTER TABLE public.documentos_adicionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gere documentos" ON public.documentos_adicionais
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin e banco veem documentos" ON public.documentos_adicionais
  FOR SELECT TO authenticated
  USING (
    public.tem_papel(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.pedidos_credito p
      WHERE p.user_id = documentos_adicionais.user_id
        AND p.banco_id = public.banco_do_utilizador(auth.uid())
    )
  );

CREATE TRIGGER trg_documentos_adicionais_updated
  BEFORE UPDATE ON public.documentos_adicionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_documentos_adicionais_user ON public.documentos_adicionais(user_id);