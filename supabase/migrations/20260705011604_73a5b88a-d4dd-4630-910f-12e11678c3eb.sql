
CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id uuid,
  endpoint text NOT NULL,
  method text NOT NULL,
  status integer NOT NULL,
  latency_ms integer,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_logs_user ON public.api_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_key ON public.api_usage_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_created ON public.api_usage_logs(created_at DESC);

GRANT SELECT ON public.api_usage_logs TO authenticated;
GRANT ALL ON public.api_usage_logs TO service_role;

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all api usage logs"
  ON public.api_usage_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own api usage logs"
  ON public.api_usage_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to see all API keys (usage overview)
CREATE POLICY "Admins can view all api keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
