CREATE OR REPLACE FUNCTION public.lookup_profile_by_faktura_id(_faktura_id text)
RETURNS TABLE(user_id uuid, nome text, nif text, telefone text, email text, tipo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.nome, COALESCE(p.nif, '') as nif, COALESCE(p.telefone, '') as telefone, p.email, COALESCE(p.tipo, 'comprador') as tipo
  FROM public.profiles p
  WHERE p.faktura_id = _faktura_id
  LIMIT 1;
$$;