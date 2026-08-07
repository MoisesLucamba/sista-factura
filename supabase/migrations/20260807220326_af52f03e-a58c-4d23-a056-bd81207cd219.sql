
-- EMPRESAS
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nif text NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  endereco text,
  software_certificado text,
  software_cert_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nif)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own empresas" ON public.empresas FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SAFT UPLOADS
CREATE TABLE public.saft_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text,
  file_size integer,
  periodo_inicio date,
  periodo_fim date,
  periodo_label text,
  nif_ficheiro text,
  hash_control text,
  software_cert_number text,
  total_vendas numeric NOT NULL DEFAULT 0,
  num_documentos integer NOT NULL DEFAULT 0,
  vendas_por_mes jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saft_uploads TO authenticated;
GRANT ALL ON public.saft_uploads TO service_role;
ALTER TABLE public.saft_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saft uploads" ON public.saft_uploads FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_saft_uploads_updated BEFORE UPDATE ON public.saft_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VALIDACOES
CREATE TABLE public.validacoes_saft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES public.saft_uploads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  formato_ok boolean NOT NULL DEFAULT false,
  certificado_ok boolean NOT NULL DEFAULT false,
  hash_control_ok boolean NOT NULL DEFAULT false,
  nif_ok boolean NOT NULL DEFAULT false,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  mensagem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.validacoes_saft TO authenticated;
GRANT ALL ON public.validacoes_saft TO service_role;
ALTER TABLE public.validacoes_saft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own validacoes select" ON public.validacoes_saft FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own validacoes insert" ON public.validacoes_saft FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SCORE
CREATE TABLE public.score_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  score integer NOT NULL,
  nivel text NOT NULL DEFAULT 'medio',
  fatores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.score_historico TO authenticated;
GRANT ALL ON public.score_historico TO service_role;
ALTER TABLE public.score_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own score select" ON public.score_historico FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own score write" ON public.score_historico FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own score update" ON public.score_historico FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- BANCOS
CREATE TABLE public.bancos_parceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  sigla text,
  logo_url text,
  contacto_analista text,
  email_analista text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bancos_parceiros TO authenticated;
GRANT ALL ON public.bancos_parceiros TO service_role;
ALTER TABLE public.bancos_parceiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bancos visiveis" ON public.bancos_parceiros FOR SELECT TO authenticated USING (ativo = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bancos admin" ON public.bancos_parceiros FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bancos_updated BEFORE UPDATE ON public.bancos_parceiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PEDIDOS DE CREDITO
CREATE TABLE public.pedidos_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  banco_id uuid REFERENCES public.bancos_parceiros(id),
  valor_solicitado numeric NOT NULL,
  valor_sugerido numeric,
  finalidade text,
  score_no_pedido integer,
  estado text NOT NULL DEFAULT 'pendente',
  dossier jsonb NOT NULL DEFAULT '{}'::jsonb,
  notas_analista text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pedidos_credito TO authenticated;
GRANT UPDATE, DELETE ON public.pedidos_credito TO authenticated;
GRANT ALL ON public.pedidos_credito TO service_role;
ALTER TABLE public.pedidos_credito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pedidos select" ON public.pedidos_credito FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own pedidos insert" ON public.pedidos_credito FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin pedidos update" ON public.pedidos_credito FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos_credito
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
