CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  acct text;
  new_faktura_id text;
  new_referral_code text;
  is_admin_email boolean;
  meta jsonb;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  acct := COALESCE(meta->>'account_type', 'particular');
  new_referral_code := public.generate_referral_code();
  new_faktura_id := public.generate_faktura_id();
  is_admin_email := NEW.email IN ('moiseslucamba2020@gmail.com', 'inforcambainfowork@gmail.com');

  INSERT INTO public.profiles (
    user_id, nome, email, nif, telefone, tipo, faktura_id, approval_status, approved_at,
    referral_code, account_type, bi_numero, data_nascimento, morada, sector_actividade,
    responsavel_nome, responsavel_cargo, instituicao_nome, registo_numero, licenca_numero,
    iban_institucional, integracao_contacto, produtos_seguro
  ) VALUES (
    NEW.id,
    COALESCE(meta->>'nome', NEW.email),
    NEW.email,
    NULLIF(meta->>'nif',''),
    NULLIF(meta->>'telefone',''),
    CASE WHEN acct = 'particular' THEN 'particular' ELSE acct END,
    new_faktura_id,
    'approved', now(), new_referral_code,
    acct,
    NULLIF(meta->>'bi_numero',''),
    NULLIF(meta->>'data_nascimento','')::date,
    NULLIF(meta->>'morada',''),
    NULLIF(meta->>'sector_actividade',''),
    NULLIF(meta->>'responsavel_nome',''),
    NULLIF(meta->>'responsavel_cargo',''),
    NULLIF(meta->>'instituicao_nome',''),
    NULLIF(meta->>'registo_numero',''),
    NULLIF(meta->>'licenca_numero',''),
    NULLIF(meta->>'iban_institucional',''),
    NULLIF(meta->>'integracao_contacto',''),
    CASE WHEN meta->>'produtos_seguro' IS NULL OR meta->>'produtos_seguro' = '' THEN NULL
         ELSE string_to_array(meta->>'produtos_seguro', ',') END
  );

  IF is_admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF acct = 'banco' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'banco');
    INSERT INTO public.bancos_parceiros (nome, email_analista, contacto_analista, ativo, owner_user_id)
    VALUES (COALESCE(NULLIF(meta->>'instituicao_nome',''), NEW.email), NEW.email, NULLIF(meta->>'telefone',''), true, NEW.id);
  ELSIF acct = 'seguradora' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seguradora');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operador');
  END IF;

  RETURN NEW;
END;
$function$;