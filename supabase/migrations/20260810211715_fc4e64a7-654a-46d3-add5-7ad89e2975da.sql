ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'particular',
  ADD COLUMN IF NOT EXISTS bi_numero text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS morada text,
  ADD COLUMN IF NOT EXISTS sector_actividade text,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS responsavel_cargo text,
  ADD COLUMN IF NOT EXISTS instituicao_nome text,
  ADD COLUMN IF NOT EXISTS registo_numero text,
  ADD COLUMN IF NOT EXISTS licenca_numero text,
  ADD COLUMN IF NOT EXISTS iban_institucional text,
  ADD COLUMN IF NOT EXISTS integracao_contacto text,
  ADD COLUMN IF NOT EXISTS produtos_seguro text[];

ALTER TABLE public.bancos_parceiros
  ADD COLUMN IF NOT EXISTS owner_user_id uuid;

CREATE OR REPLACE FUNCTION public.banco_do_utilizador(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.bancos_parceiros WHERE owner_user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tem_papel(_user_id uuid, _papel text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = _papel);
$$;

CREATE TABLE IF NOT EXISTS public.credito_decisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos_credito(id) ON DELETE CASCADE,
  banco_id uuid REFERENCES public.bancos_parceiros(id),
  decidido_por uuid NOT NULL,
  decisao text NOT NULL CHECK (decisao IN ('aprovado','rejeitado','mais_info')),
  observacoes text,
  valor_aprovado numeric,
  prazo_meses integer,
  taxa_juro numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.credito_decisoes TO authenticated;
GRANT ALL ON public.credito_decisoes TO service_role;
ALTER TABLE public.credito_decisoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banco insere decisoes" ON public.credito_decisoes
  FOR INSERT TO authenticated
  WITH CHECK (decidido_por = auth.uid() AND (public.tem_papel(auth.uid(),'banco') OR public.tem_papel(auth.uid(),'admin')));

CREATE POLICY "Ver decisoes relacionadas" ON public.credito_decisoes
  FOR SELECT TO authenticated
  USING (
    decidido_por = auth.uid()
    OR public.tem_papel(auth.uid(),'admin')
    OR banco_id = public.banco_do_utilizador(auth.uid())
    OR EXISTS (SELECT 1 FROM public.pedidos_credito p WHERE p.id = pedido_id AND p.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.desembolsos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos_credito(id) ON DELETE CASCADE,
  decisao_id uuid REFERENCES public.credito_decisoes(id) ON DELETE SET NULL,
  banco_id uuid REFERENCES public.bancos_parceiros(id),
  beneficiario_user_id uuid NOT NULL,
  iban_destino text,
  banco_destino text,
  valor numeric NOT NULL,
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','em_curso','pago','incumprido','cancelado')),
  referencia text,
  pago_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.desembolsos TO authenticated;
GRANT ALL ON public.desembolsos TO service_role;
ALTER TABLE public.desembolsos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver desembolsos relacionados" ON public.desembolsos
  FOR SELECT TO authenticated
  USING (
    beneficiario_user_id = auth.uid()
    OR public.tem_papel(auth.uid(),'admin')
    OR banco_id = public.banco_do_utilizador(auth.uid())
  );
CREATE POLICY "Banco cria desembolsos" ON public.desembolsos
  FOR INSERT TO authenticated
  WITH CHECK (public.tem_papel(auth.uid(),'banco') OR public.tem_papel(auth.uid(),'admin'));
CREATE POLICY "Banco actualiza desembolsos" ON public.desembolsos
  FOR UPDATE TO authenticated
  USING (banco_id = public.banco_do_utilizador(auth.uid()) OR public.tem_papel(auth.uid(),'admin'));

CREATE TRIGGER trg_desembolsos_updated BEFORE UPDATE ON public.desembolsos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.papel_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  actor_user_id uuid,
  pedido_id uuid REFERENCES public.pedidos_credito(id) ON DELETE SET NULL,
  banco_id uuid REFERENCES public.bancos_parceiros(id),
  empresa_user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.papel_eventos TO authenticated;
GRANT ALL ON public.papel_eventos TO service_role;
ALTER TABLE public.papel_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver eventos relacionados" ON public.papel_eventos
  FOR SELECT TO authenticated
  USING (
    public.tem_papel(auth.uid(),'admin')
    OR actor_user_id = auth.uid()
    OR empresa_user_id = auth.uid()
    OR banco_id = public.banco_do_utilizador(auth.uid())
  );
CREATE POLICY "Registar eventos autenticado" ON public.papel_eventos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_decisao_evento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _empresa_user uuid;
BEGIN
  SELECT user_id INTO _empresa_user FROM public.pedidos_credito WHERE id = NEW.pedido_id;
  INSERT INTO public.papel_eventos (tipo, actor_user_id, pedido_id, banco_id, empresa_user_id, payload)
  VALUES ('decisao_credito', NEW.decidido_por, NEW.pedido_id, NEW.banco_id, _empresa_user,
          jsonb_build_object('decisao', NEW.decisao, 'valor_aprovado', NEW.valor_aprovado, 'observacoes', NEW.observacoes));

  UPDATE public.pedidos_credito
     SET estado = CASE NEW.decisao WHEN 'aprovado' THEN 'aprovado' WHEN 'rejeitado' THEN 'rejeitado' ELSE 'mais_info' END,
         notas_analista = COALESCE(NEW.observacoes, notas_analista)
   WHERE id = NEW.pedido_id;

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (_empresa_user,
          CASE NEW.decisao WHEN 'aprovado' THEN 'success' WHEN 'rejeitado' THEN 'error' ELSE 'info' END,
          'Decisao sobre o teu pedido de credito',
          'O banco tomou uma decisao: ' || NEW.decisao || COALESCE('. ' || NEW.observacoes, ''));
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_log_decisao AFTER INSERT ON public.credito_decisoes
  FOR EACH ROW EXECUTE FUNCTION public.log_decisao_evento();

CREATE OR REPLACE FUNCTION public.log_desembolso_evento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.papel_eventos (tipo, actor_user_id, pedido_id, banco_id, empresa_user_id, payload)
    VALUES ('desembolso_' || NEW.estado, auth.uid(), NEW.pedido_id, NEW.banco_id, NEW.beneficiario_user_id,
            jsonb_build_object('valor', NEW.valor, 'iban', NEW.iban_destino, 'estado', NEW.estado));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_log_desembolso AFTER INSERT OR UPDATE ON public.desembolsos
  FOR EACH ROW EXECUTE FUNCTION public.log_desembolso_evento();

CREATE POLICY "Banco ve pedidos dirigidos" ON public.pedidos_credito
  FOR SELECT TO authenticated
  USING (banco_id = public.banco_do_utilizador(auth.uid()));