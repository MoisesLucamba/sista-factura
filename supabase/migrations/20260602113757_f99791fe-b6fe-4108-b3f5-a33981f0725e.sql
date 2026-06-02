CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);

GRANT SELECT, INSERT, UPDATE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own api keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create their own api keys"
  ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update (revoke) their own api keys"
  ON public.api_keys FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);