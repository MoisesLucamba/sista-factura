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
BEGIN
  user_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo', 'vendedor');
  user_seller_subtype := NEW.raw_user_meta_data->>'seller_subtype';

  INSERT INTO public.profiles (user_id, nome, email, nif, telefone, tipo, faktura_id, seller_subtype, approval_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'nif',
    NEW.raw_user_meta_data->>'telefone',
    user_tipo,
    CASE WHEN user_tipo = 'comprador' THEN public.generate_faktura_id() ELSE NULL END,
    CASE WHEN user_tipo = 'vendedor' THEN user_seller_subtype ELSE NULL END,
    'pending'
  );

  IF user_tipo = 'comprador' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'comprador');
    new_faktura_id := (SELECT faktura_id FROM public.profiles WHERE user_id = NEW.id);
    INSERT INTO public.buyer_wallets (user_id, faktura_id) VALUES (NEW.id, new_faktura_id);
  ELSIF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operador');
  END IF;

  RETURN NEW;
END;
$function$;