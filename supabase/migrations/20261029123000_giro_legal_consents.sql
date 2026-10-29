CREATE TABLE public.consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('terms_privacy', 'saft_analysis', 'bank_share')),
  granted boolean NOT NULL,
  document_version text NOT NULL,
  bank_id uuid REFERENCES public.bancos_parceiros(id) ON DELETE SET NULL,
  request_id uuid,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (consent_type <> 'bank_share' OR (bank_id IS NOT NULL AND request_id IS NOT NULL))
);

CREATE INDEX consent_events_user_type_created_idx
  ON public.consent_events (user_id, consent_type, created_at DESC);
CREATE INDEX consent_events_request_created_idx
  ON public.consent_events (request_id, created_at DESC)
  WHERE consent_type = 'bank_share';

ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.consent_events TO authenticated;
GRANT ALL ON public.consent_events TO service_role;

CREATE POLICY "Users can read their own consent events"
  ON public.consent_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.pending_registration_consents (
  nonce uuid PRIMARY KEY,
  email text NOT NULL,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  ip_address text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes'
);
ALTER TABLE public.pending_registration_consents ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.pending_registration_consents TO service_role;

CREATE OR REPLACE FUNCTION public.record_giro_legal_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending public.pending_registration_consents%ROWTYPE;
  consent_nonce uuid;
BEGIN
  BEGIN
    consent_nonce := (NEW.raw_user_meta_data->>'giro_consent_nonce')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Legal consent is required before account creation';
  END;

  SELECT * INTO pending
  FROM public.pending_registration_consents
  WHERE nonce = consent_nonce
    AND lower(email) = lower(NEW.email)
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Legal consent is missing or expired';
  END IF;

  INSERT INTO public.consent_events (user_id, consent_type, granted, document_version, accepted_at, ip_address, user_agent)
  VALUES (
    NEW.id,
    'terms_privacy',
    true,
    pending.terms_version || '/' || pending.privacy_version,
    pending.accepted_at,
    pending.ip_address,
    pending.user_agent
  );

  DELETE FROM public.pending_registration_consents WHERE nonce = consent_nonce;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_legal_acceptance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.record_giro_legal_acceptance();

CREATE OR REPLACE FUNCTION public.has_active_bank_consent(
  _user_id uuid,
  _bank_id uuid,
  _request_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT granted
    FROM public.consent_events
    WHERE user_id = _user_id
      AND consent_type = 'bank_share'
      AND bank_id = _bank_id
      AND request_id = _request_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  ), false)
$$;

DROP POLICY IF EXISTS "Banco ve pedidos dirigidos" ON public.pedidos_credito;
CREATE POLICY "Banco ve pedidos com consentimento activo"
  ON public.pedidos_credito FOR SELECT TO authenticated
  USING (
    banco_id = public.banco_do_utilizador(auth.uid())
    AND public.has_active_bank_consent(user_id, banco_id, id)
  );
