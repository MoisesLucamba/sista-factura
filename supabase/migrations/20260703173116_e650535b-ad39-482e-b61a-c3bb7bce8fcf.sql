CREATE TABLE IF NOT EXISTS public.waitlist_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text DEFAULT 'landing',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_leads_email_idx ON public.waitlist_leads (lower(email));
GRANT INSERT ON public.waitlist_leads TO anon, authenticated;
GRANT ALL ON public.waitlist_leads TO service_role;
ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_leads FOR INSERT TO anon, authenticated WITH CHECK (true);