
-- 1) Backfill missing/invalid faktura_id on profiles
DO $$
DECLARE
  r RECORD;
  new_id text;
BEGIN
  FOR r IN
    SELECT user_id FROM public.profiles
    WHERE faktura_id IS NULL OR faktura_id !~ '^FK-244-[0-9]{6}$'
  LOOP
    new_id := public.generate_faktura_id();
    UPDATE public.profiles SET faktura_id = new_id WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- 2) Update handle_new_user to ALWAYS assign a Faktura ID (sellers + buyers + admins)
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
  initial_status text;
  referrer_user_id uuid;
  referred_code text;
  meta_nif text;
  meta_tel text;
  meta_nome text;
  basic_valid boolean;
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

  basic_valid := meta_nome IS NOT NULL AND length(trim(meta_nome)) >= 3
                 AND meta_nif IS NOT NULL AND length(trim(meta_nif)) >= 9
                 AND meta_tel IS NOT NULL AND length(regexp_replace(meta_tel, '\D', '', 'g')) >= 9;

  IF is_admin_email OR user_tipo = 'comprador' OR basic_valid THEN
    initial_status := 'approved';
  ELSE
    initial_status := 'pending';
  END IF;

  IF referred_code IS NOT NULL AND referred_code != '' THEN
    SELECT user_id INTO referrer_user_id FROM public.profiles WHERE referral_code = referred_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, nome, email, nif, telefone, tipo, faktura_id, seller_subtype, approval_status, approved_at, referral_code, referred_by)
  VALUES (
    NEW.id, meta_nome, NEW.email, meta_nif, meta_tel, user_tipo,
    new_faktura_id,
    CASE WHEN user_tipo = 'vendedor' THEN user_seller_subtype ELSE NULL END,
    initial_status,
    CASE WHEN initial_status = 'approved' THEN now() ELSE NULL END,
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
      referrer_nome text;
    BEGIN
      SELECT tipo, nome INTO referrer_tipo, referrer_nome FROM public.profiles WHERE user_id = referrer_user_id;
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

-- 3) Helper: lookup faktura_id by email (security definer, bypasses RLS)
CREATE OR REPLACE FUNCTION public.lookup_faktura_id_by_email(_email text)
 RETURNS TABLE(faktura_id text, nome text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.faktura_id, p.nome
  FROM public.profiles p
  WHERE lower(p.email) = lower(_email)
  LIMIT 1;
$$;

-- 4) Helper: lookup any user by Faktura ID (for team invites)
CREATE OR REPLACE FUNCTION public.lookup_user_by_faktura_id(_faktura_id text)
 RETURNS TABLE(user_id uuid, nome text, email text, tipo text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.nome, p.email, p.tipo
  FROM public.profiles p
  WHERE p.faktura_id = _faktura_id
  LIMIT 1;
$$;
