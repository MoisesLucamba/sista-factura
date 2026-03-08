
-- Payment transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'payment', -- payment, transfer, deposit, withdrawal, refund
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  description TEXT,
  reference TEXT,
  fatura_id UUID REFERENCES public.faturas(id),
  payment_method TEXT, -- multicaixa, transfer, wallet, link
  sender_wallet_id UUID,
  receiver_wallet_id UUID,
  external_reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment links table
CREATE TABLE public.payment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fatura_id UUID REFERENCES public.faturas(id),
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, paid, expired, cancelled
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES public.transactions(id),
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bank reconciliation table
CREATE TABLE public.bank_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fatura_id UUID REFERENCES public.faturas(id),
  transaction_id UUID REFERENCES public.transactions(id),
  bank_reference TEXT,
  bank_amount NUMERIC NOT NULL DEFAULT 0,
  invoice_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, matched, partial, unmatched
  matched_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payment_links
CREATE POLICY "Users can view their own payment links" ON public.payment_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payment links" ON public.payment_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment links" ON public.payment_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active payment links by code" ON public.payment_links FOR SELECT USING (status = 'active');

-- RLS Policies for bank_reconciliations
CREATE POLICY "Users can view their own reconciliations" ON public.bank_reconciliations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reconciliations" ON public.bank_reconciliations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reconciliations" ON public.bank_reconciliations FOR UPDATE USING (auth.uid() = user_id);

-- Add balance fields to buyer_wallets for vendor wallets too
-- We'll use buyer_wallets as a general wallet system

-- Generate unique payment link code
CREATE OR REPLACE FUNCTION public.generate_payment_link_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_code := 'PAY-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.payment_links WHERE code = new_code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_code;
END;
$$;
