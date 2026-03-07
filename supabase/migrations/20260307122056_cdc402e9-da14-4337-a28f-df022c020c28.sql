
-- Add referral columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  user_type text NOT NULL,
  reward_type text NOT NULL,
  reward_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS: users can view their own referrals (as referrer)
CREATE POLICY "Users can view referrals they made" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referral" ON public.referrals
FOR SELECT USING (auth.uid() = referred_user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  exists_already boolean;
BEGIN
  LOOP
    new_code := 'REF-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Update handle_new_user to auto-approve admins and generate referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_tipo text;
  new_faktura_id text;
  user_seller_subtype text;
  new_referral_code text;
  is_admin_email boolean;
  initial_status text;
  referrer_user_id uuid;
  referred_code text;
BEGIN
  user_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo', 'vendedor');
  user_seller_subtype := NEW.raw_user_meta_data->>'seller_subtype';
  new_referral_code := public.generate_referral_code();
  referred_code := NEW.raw_user_meta_data->>'referral_code';

  -- Check if admin email
  is_admin_email := NEW.email IN ('moiseslucamba2020@gmail.com', 'inforcambainfowork@gmail.com');
  
  IF is_admin_email THEN
    initial_status := 'approved';
  ELSE
    initial_status := 'pending';
  END IF;

  -- Look up referrer if referral code provided
  IF referred_code IS NOT NULL AND referred_code != '' THEN
    SELECT user_id INTO referrer_user_id FROM public.profiles WHERE referral_code = referred_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, nome, email, nif, telefone, tipo, faktura_id, seller_subtype, approval_status, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'nif',
    NEW.raw_user_meta_data->>'telefone',
    user_tipo,
    CASE WHEN user_tipo = 'comprador' THEN public.generate_faktura_id() ELSE NULL END,
    CASE WHEN user_tipo = 'vendedor' THEN user_seller_subtype ELSE NULL END,
    initial_status,
    new_referral_code,
    referrer_user_id
  );

  IF is_admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF user_tipo = 'comprador' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'comprador');
    new_faktura_id := (SELECT faktura_id FROM public.profiles WHERE user_id = NEW.id);
    INSERT INTO public.buyer_wallets (user_id, faktura_id) VALUES (NEW.id, new_faktura_id);
  ELSIF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operador');
  END IF;

  -- Process referral reward
  IF referrer_user_id IS NOT NULL THEN
    DECLARE
      referrer_tipo text;
    BEGIN
      SELECT tipo INTO referrer_tipo FROM public.profiles WHERE user_id = referrer_user_id;
      
      IF referrer_tipo = 'comprador' AND user_tipo = 'comprador' THEN
        -- Buyer referring buyer: 50 Kz cashback
        INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
        VALUES (referrer_user_id, NEW.id, 'comprador', 'cashback', 50);
        
        UPDATE public.buyer_wallets SET saldo = saldo + 50, pontos = pontos + 50, updated_at = now()
        WHERE user_id = referrer_user_id;
      ELSIF referrer_tipo = 'vendedor' AND user_tipo = 'vendedor' THEN
        -- Seller referring seller: discount
        DECLARE
          ref_count integer;
          discount_pct integer;
        BEGIN
          SELECT COUNT(*) INTO ref_count FROM public.referrals WHERE referrer_id = referrer_user_id;
          ref_count := ref_count + 1;
          
          IF ref_count >= 10 THEN discount_pct := 100;
          ELSIF ref_count >= 5 THEN discount_pct := 60;
          ELSIF ref_count >= 3 THEN discount_pct := 40;
          ELSE discount_pct := 20;
          END IF;
          
          INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
          VALUES (referrer_user_id, NEW.id, 'vendedor', 'desconto', discount_pct);
        END;
      ELSE
        -- Cross-type referral, still record it
        INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
        VALUES (referrer_user_id, NEW.id, user_tipo, 'nenhum', 0);
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Auto-approve existing admin users
UPDATE public.profiles SET approval_status = 'approved' WHERE email IN ('moiseslucamba2020@gmail.com', 'inforcambainfowork@gmail.com');

-- Generate referral codes for existing users who don't have one
UPDATE public.profiles SET referral_code = 'REF-' || UPPER(SUBSTRING(md5(random()::text || id::text) FROM 1 FOR 6)) WHERE referral_code IS NULL;
