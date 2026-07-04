
CREATE TABLE public.landing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  section TEXT,
  label TEXT,
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_landing_events_created_at ON public.landing_events(created_at DESC);
CREATE INDEX idx_landing_events_event_name  ON public.landing_events(event_name);
CREATE INDEX idx_landing_events_label       ON public.landing_events(label);

GRANT INSERT ON public.landing_events TO anon, authenticated;
GRANT SELECT ON public.landing_events TO authenticated;
GRANT ALL ON public.landing_events TO service_role;

ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert landing events"
  ON public.landing_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read landing events"
  ON public.landing_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
