
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow service role inserts (for triggers)
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT TO service_role WITH CHECK (true);

-- Update handle_new_user to create notification on referral reward
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

  is_admin_email := NEW.email IN ('moiseslucamba2020@gmail.com', 'inforcambainfowork@gmail.com');
  
  IF is_admin_email THEN
    initial_status := 'approved';
  ELSE
    initial_status := 'pending';
  END IF;

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
      referrer_nome text;
      new_user_nome text;
    BEGIN
      SELECT tipo, nome INTO referrer_tipo, referrer_nome FROM public.profiles WHERE user_id = referrer_user_id;
      new_user_nome := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email);
      
      IF referrer_tipo = 'comprador' AND user_tipo = 'comprador' THEN
        INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
        VALUES (referrer_user_id, NEW.id, 'comprador', 'cashback', 50);
        
        UPDATE public.buyer_wallets SET saldo = saldo + 50, pontos = pontos + 50, updated_at = now()
        WHERE user_id = referrer_user_id;

        -- Notify referrer
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (referrer_user_id, 'success', 'Recompensa de Indicação! 🎉', 
          new_user_nome || ' criou conta usando o seu código de indicação. Recebeu 50 Kz de cashback na sua carteira!');

        -- Notify new user
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (NEW.id, 'info', 'Indicação Registada', 
          'Você foi indicado por ' || referrer_nome || '. Bem-vindo à Faktura!');

      ELSIF referrer_tipo = 'vendedor' AND user_tipo = 'vendedor' THEN
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

          -- Notify referrer
          INSERT INTO public.notifications (user_id, type, title, message)
          VALUES (referrer_user_id, 'success', 'Recompensa de Indicação! 🎉', 
            new_user_nome || ' registou-se com o seu código. Agora tem ' || discount_pct || '% de desconto na mensalidade! (' || ref_count || ' indicações no total)');

          -- Notify new user
          INSERT INTO public.notifications (user_id, type, title, message)
          VALUES (NEW.id, 'info', 'Indicação Registada', 
            'Você foi indicado por ' || referrer_nome || '. Bem-vindo à Faktura!');
        END;
      ELSE
        INSERT INTO public.referrals (referrer_id, referred_user_id, user_type, reward_type, reward_value)
        VALUES (referrer_user_id, NEW.id, user_tipo, 'nenhum', 0);

        -- Notify both
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (referrer_user_id, 'info', 'Nova Indicação', 
          new_user_nome || ' criou conta usando o seu código de indicação.');
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$;
