-- ============================================
-- GESTÃO FINANCEIRA - Tabelas e configurações
-- ============================================

-- 1. CRÉDITOS
CREATE TABLE IF NOT EXISTS public.credit_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custo_por_fatura numeric NOT NULL DEFAULT 1,
  custo_mora_por_fatura numeric NOT NULL DEFAULT 3,
  faturas_gratis_challenge integer NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.credit_settings (custo_por_fatura, custo_mora_por_fatura, faturas_gratis_challenge)
SELECT 1, 3, 100
WHERE NOT EXISTS (SELECT 1 FROM public.credit_settings);

CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  credits_used integer NOT NULL DEFAULT 0,
  credits_remaining integer NOT NULL DEFAULT 0,
  free_credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- add, deduct, manual_adjust
  amount integer NOT NULL,
  reason text,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. COBRANÇAS SEMANAIS
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_cobranca text NOT NULL DEFAULT 'sexta',
  hora_fecho text NOT NULL DEFAULT '23:59',
  aviso_quinta text NOT NULL DEFAULT '22:00',
  lembrete_sexta text NOT NULL DEFAULT '08:00',
  taxa_normal numeric NOT NULL DEFAULT 1,
  taxa_mora numeric NOT NULL DEFAULT 3,
  dia1_acao text NOT NULL DEFAULT 'alerta',
  dia3_acao text NOT NULL DEFAULT 'acesso_limitado',
  dia7_acao text NOT NULL DEFAULT 'suspensao',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.billing_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;

INSERT INTO public.billing_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.billing_settings);

CREATE TABLE IF NOT EXISTS public.weekly_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  invoices_count integer NOT NULL DEFAULT 0,
  amount_normal numeric NOT NULL DEFAULT 0,
  amount_mora numeric NOT NULL DEFAULT 0,
  amount_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente', -- pendente, pago, mora, perdoado, bloqueado
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- 3. SUBSCRIÇÕES
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  preco_mensal numeric NOT NULL DEFAULT 0,
  faturas_max integer, -- null = ilimitado
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  marca_dagua boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans (nome, preco_mensal, faturas_max, marca_dagua, features)
SELECT 'Gratuito', 0, 30, true, '{"funcionalidades_avancadas": false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE nome = 'Gratuito');

INSERT INTO public.subscription_plans (nome, preco_mensal, faturas_max, marca_dagua, features)
SELECT 'Base', 2000, NULL, false, '{"funcionalidades_avancadas": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE nome = 'Base');

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  inicio date NOT NULL DEFAULT CURRENT_DATE,
  expira date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  estado text NOT NULL DEFAULT 'ativa', -- ativa, expirada, cancelada
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_automation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notificar_7_dias boolean NOT NULL DEFAULT true,
  notificar_3_dias boolean NOT NULL DEFAULT true,
  notificar_no_dia boolean NOT NULL DEFAULT true,
  downgrade_automatico boolean NOT NULL DEFAULT true,
  graca_7_dias boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_automation DEFAULT VALUES
ON CONFLICT DO NOTHING;
INSERT INTO public.subscription_automation (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_automation);

-- 4. FK-244 CHALLENGE
CREATE TABLE IF NOT EXISTS public.fk244_challenge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_vagas integer NOT NULL DEFAULT 244,
  duracao_horas integer NOT NULL DEFAULT 244,
  faturas_gratis integer NOT NULL DEFAULT 100,
  ativo boolean NOT NULL DEFAULT true,
  inicio timestamptz NOT NULL DEFAULT now(),
  fim timestamptz NOT NULL DEFAULT (now() + INTERVAL '244 hours'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.fk244_challenge (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.fk244_challenge);

CREATE TABLE IF NOT EXISTS public.fk244_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  posicao integer NOT NULL,
  data_registo timestamptz NOT NULL DEFAULT now(),
  faturas_usadas integer NOT NULL DEFAULT 0
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.credit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fk244_challenge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fk244_participants ENABLE ROW LEVEL SECURITY;

-- Admin-only management for settings
CREATE POLICY "Admins manage credit_settings" ON public.credit_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read credit_settings" ON public.credit_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage all user_credits" ON public.user_credits FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own credits" ON public.user_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage credit_movements" ON public.credit_movements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own movements" ON public.credit_movements FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage billing_settings" ON public.billing_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read billing_settings" ON public.billing_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage weekly_charges" ON public.weekly_charges FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own charges" ON public.weekly_charges FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage subscription_plans" ON public.subscription_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage user_subscriptions" ON public.user_subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own subscription" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage automation" ON public.subscription_automation FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read automation" ON public.subscription_automation FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage challenge" ON public.fk244_challenge FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read challenge" ON public.fk244_challenge FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage participants" ON public.fk244_participants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone read participants" ON public.fk244_participants FOR SELECT TO authenticated USING (true);

-- Triggers updated_at
CREATE TRIGGER trg_credit_settings_updated BEFORE UPDATE ON public.credit_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_credits_updated BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_billing_settings_updated BEFORE UPDATE ON public.billing_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_weekly_charges_updated BEFORE UPDATE ON public.weekly_charges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subscription_plans_updated BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_subscriptions_updated BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_automation_updated BEFORE UPDATE ON public.subscription_automation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_challenge_updated BEFORE UPDATE ON public.fk244_challenge FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();