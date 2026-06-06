
-- Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','grace','suspended','cancelled')),
  plan_fee numeric NOT NULL DEFAULT 8000,
  per_doc_fee numeric NOT NULL DEFAULT 1,
  current_period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  current_period_end date NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month - 1 day')::date,
  next_billing_at timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  auto_renew boolean NOT NULL DEFAULT true,
  payment_method text NOT NULL DEFAULT 'multicaixa' CHECK (payment_method IN ('multicaixa','wallet','transferencia')),
  multicaixa_token text,
  grace_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own subscription" ON public.subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins view all subscriptions" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update subscriptions" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Subscription invoices (monthly billing)
CREATE TABLE public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  plan_fee numeric NOT NULL DEFAULT 0,
  documents_count integer NOT NULL DEFAULT 0,
  documents_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','overdue','cancelled')),
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);
GRANT SELECT, INSERT, UPDATE ON public.subscription_invoices TO authenticated;
GRANT ALL ON public.subscription_invoices TO service_role;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own sub invoices" ON public.subscription_invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users update own sub invoices" ON public.subscription_invoices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage sub invoices" ON public.subscription_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_sub_inv_updated BEFORE UPDATE ON public.subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SAF-T submissions log
CREATE TABLE public.saft_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL, -- YYYY-MM
  xml_path text,
  xml_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','error')),
  agt_reference text,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  submitted_at timestamptz,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);
GRANT SELECT, INSERT, UPDATE ON public.saft_submissions TO authenticated;
GRANT ALL ON public.saft_submissions TO service_role;
ALTER TABLE public.saft_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own saft" ON public.saft_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users insert own saft" ON public.saft_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own saft" ON public.saft_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage saft" ON public.saft_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_saft_updated BEFORE UPDATE ON public.saft_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
