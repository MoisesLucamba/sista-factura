
-- Enum de papéis dentro da empresa
DO $$ BEGIN
  CREATE TYPE public.empresa_role AS ENUM ('gestor', 'operador', 'contador', 'visualizador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela principal
CREATE TABLE IF NOT EXISTS public.empresa_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_user_id uuid NOT NULL,
  membro_user_id uuid,
  membro_email text NOT NULL,
  membro_nome text,
  role public.empresa_role NOT NULL DEFAULT 'operador',
  status text NOT NULL DEFAULT 'pending', -- pending | active | removed
  invite_token text UNIQUE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_user_id, membro_email)
);

CREATE INDEX IF NOT EXISTS idx_empresa_membros_empresa ON public.empresa_membros(empresa_user_id);
CREATE INDEX IF NOT EXISTS idx_empresa_membros_membro ON public.empresa_membros(membro_user_id);
CREATE INDEX IF NOT EXISTS idx_empresa_membros_email ON public.empresa_membros(lower(membro_email));

ALTER TABLE public.empresa_membros ENABLE ROW LEVEL SECURITY;

-- Função: empresas que o utilizador pode aceder
CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
RETURNS TABLE (
  empresa_user_id uuid,
  nome text,
  email text,
  faktura_id text,
  role text,
  is_owner boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Conta própria
  SELECT p.user_id, p.nome, p.email, p.faktura_id, 'owner'::text, true
  FROM public.profiles p
  WHERE p.user_id = _user_id
  UNION ALL
  -- Empresas onde é membro activo
  SELECT em.empresa_user_id, p.nome, p.email, p.faktura_id, em.role::text, false
  FROM public.empresa_membros em
  JOIN public.profiles p ON p.user_id = em.empresa_user_id
  WHERE em.membro_user_id = _user_id
    AND em.status = 'active';
$$;

-- Função: validar acesso à empresa
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _empresa_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = _empresa_user_id
  OR EXISTS (
    SELECT 1 FROM public.empresa_membros
    WHERE empresa_user_id = _empresa_user_id
      AND membro_user_id = _user_id
      AND status = 'active'
  );
$$;

-- RLS: dono da empresa gere
CREATE POLICY "Dono gere membros"
  ON public.empresa_membros FOR ALL
  TO authenticated
  USING (auth.uid() = empresa_user_id)
  WITH CHECK (auth.uid() = empresa_user_id);

-- RLS: membro vê o seu registo
CREATE POLICY "Membro vê seu registo"
  ON public.empresa_membros FOR SELECT
  TO authenticated
  USING (auth.uid() = membro_user_id);

-- RLS: membro pode aceitar (atualizar status para active e fixar membro_user_id)
CREATE POLICY "Membro aceita convite"
  ON public.empresa_membros FOR UPDATE
  TO authenticated
  USING (
    membro_user_id = auth.uid()
    OR (membro_user_id IS NULL AND lower(membro_email) = lower((auth.jwt() ->> 'email')))
  );

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_empresa_membros_updated ON public.empresa_membros;
CREATE TRIGGER trg_empresa_membros_updated
  BEFORE UPDATE ON public.empresa_membros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
