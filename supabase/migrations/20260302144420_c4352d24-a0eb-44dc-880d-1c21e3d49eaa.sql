
-- Add 'comprador' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comprador';

-- Add nif and telefone to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nif text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'vendedor';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faktura_id text;

-- Create buyer_wallets table for points/cashback
CREATE TABLE IF NOT EXISTS public.buyer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  faktura_id text NOT NULL UNIQUE,
  pontos integer NOT NULL DEFAULT 0,
  saldo numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON public.buyer_wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
ON public.buyer_wallets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
ON public.buyer_wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create buyer_purchases table for purchase history
CREATE TABLE IF NOT EXISTS public.buyer_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL,
  fatura_id uuid REFERENCES public.faturas(id),
  vendor_name text,
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  pontos_ganhos integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own purchases"
ON public.buyer_purchases FOR SELECT
USING (auth.uid() = buyer_user_id);

CREATE POLICY "Authenticated users can insert purchases"
ON public.buyer_purchases FOR INSERT
WITH CHECK (auth.uid() = buyer_user_id);

-- Function to generate unique Faktura ID
CREATE OR REPLACE FUNCTION public.generate_faktura_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id text;
  exists_already boolean;
BEGIN
  LOOP
    new_id := 'FK-' || LPAD(FLOOR(RANDOM() * 99999 + 10000)::text, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.buyer_wallets WHERE faktura_id = new_id) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Update handle_new_user to support buyer registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_tipo text;
  new_faktura_id text;
BEGIN
  user_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo', 'vendedor');

  -- Create profile
  INSERT INTO public.profiles (user_id, nome, email, nif, telefone, tipo, faktura_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'nif',
    NEW.raw_user_meta_data->>'telefone',
    user_tipo,
    CASE WHEN user_tipo = 'comprador' THEN public.generate_faktura_id() ELSE NULL END
  );

  -- Assign role
  IF user_tipo = 'comprador' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'comprador');
    -- Create wallet
    new_faktura_id := (SELECT faktura_id FROM public.profiles WHERE user_id = NEW.id);
    INSERT INTO public.buyer_wallets (user_id, faktura_id)
    VALUES (NEW.id, new_faktura_id);
  ELSIF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operador');
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at on buyer_wallets
CREATE TRIGGER update_buyer_wallets_updated_at
  BEFORE UPDATE ON public.buyer_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
