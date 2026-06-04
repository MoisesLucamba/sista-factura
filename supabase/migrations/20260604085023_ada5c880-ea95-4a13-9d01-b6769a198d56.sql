
-- Allow admins to update any profile (fixes silent approval revert)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-approve all new users; admin reviews documents later without blocking access
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_tipo text;
  new_faktura_id text;
  user_seller_subtype text;
  new_referral_code text;
  is_admin_email boolean;
  referrer_user_id uuid;
  referred_code text;
  meta_nif text;
  meta_tel text;
  meta_nome text;
BEGIN
  user_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo', 'vendedor');
  user_seller_subtype := NEW.raw_user_meta_data->>'seller_subtype';
  new_referral_code := public.generate_referral_code();
  referred_code := NEW.raw_user_meta_data->>'referral_code';
  meta_nif := NEW.raw_user_meta_data->>'nif';
  meta_tel := NEW.raw_user_meta_data->>'telefone';
  meta_nome := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email);
  new_faktura_id := public.generate_faktura_id();
  is_admin_email := NEW.email IN ('moiseslucamba2020@gmail.com', 'inforcambainfowork@gmail.com');

  IF referred_code IS NOT NULL AND referred_code != '' THEN
    SELECT user_id INTO referrer_user_id FROM public.profiles WHERE referral_code = referred_code LIMIT 1;
  END IF;

  -- Everyone approved on signup; admin reviews documents asynchronously without blocking access
  INSERT INTO public.profiles (user_id, nome, email, nif, telefone, tipo, faktura_id, seller_subtype, approval_status, approved_at, referral_code, referred_by)
  VALUES (
    NEW.id, meta_nome, NEW.email, meta_nif, meta_tel, user_tipo,
    new_faktura_id,
    CASE WHEN user_tipo = 'vendedor' THEN user_seller_subtype ELSE NULL END,
    'approved',
    now(),
    new_referral_code, referrer_user_id
  );

  IF is_admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF user_tipo = 'comprador' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'comprador');
    INSERT INTO public.buyer_wallets (user_id, faktura_id) VALUES (NEW.id, new_faktura_id);
  ELSIF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operador');
  END IF;

  IF referrer_user_id IS NOT NULL THEN
    DECLARE
      referrer_tipo text;
    BEGIN
      SELECT tipo INTO referrer_tipo FROM public.profiles WHERE user_id = referrer_user_id;
      IF referrer_tipo = 'comprador' AND user_tipo = 'comprador' THEN
        INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
        VALUES (referrer_user_id, NEW.id, 'comprador', 'cashback', 50);
        UPDATE public.buyer_wallets SET saldo = saldo + 50, pontos = pontos + 50, updated_at = now()
        WHERE user_id = referrer_user_id;
      ELSIF referrer_tipo = 'vendedor' AND user_tipo = 'vendedor' THEN
        DECLARE ref_count integer; discount_pct integer;
        BEGIN
          SELECT COUNT(*)+1 INTO ref_count FROM public.referrals WHERE referrer_id = referrer_user_id;
          IF ref_count >= 10 THEN discount_pct := 100;
          ELSIF ref_count >= 5 THEN discount_pct := 60;
          ELSIF ref_count >= 3 THEN discount_pct := 40;
          ELSE discount_pct := 20; END IF;
          INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
          VALUES (referrer_user_id, NEW.id, 'vendedor', 'desconto', discount_pct);
        END;
      ELSE
        INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
        VALUES (referrer_user_id, NEW.id, user_tipo, 'nenhum', 0);
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- Approve all existing pending users now (they confirmed email, just no admin review yet)
UPDATE public.profiles
SET approval_status = 'approved',
    approved_at = COALESCE(approved_at, now())
WHERE approval_status IN ('pending', 'rejected');
