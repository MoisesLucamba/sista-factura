
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS periodo text NOT NULL DEFAULT 'mensal',
  ADD COLUMN IF NOT EXISTS dias_gratis integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descricao text;

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at date,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS granted_by uuid;
