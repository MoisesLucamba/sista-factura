
-- 1. Update generate_faktura_id to produce 6-digit IDs
CREATE OR REPLACE FUNCTION public.generate_faktura_id()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id text;
  exists_already boolean;
BEGIN
  LOOP
    new_id := 'FK-244-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::text, 6, '0');
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE faktura_id = new_id
      UNION ALL
      SELECT 1 FROM public.buyer_wallets WHERE faktura_id = new_id
    ) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_id;
END;
$function$;

-- 2. Migrate existing 5-digit IDs to 6-digit format in profiles
UPDATE public.profiles
SET faktura_id = 'FK-244-0' || SUBSTRING(faktura_id FROM 8)
WHERE faktura_id IS NOT NULL
  AND faktura_id LIKE 'FK-244-%'
  AND LENGTH(faktura_id) = 12;

-- 3. Migrate existing 5-digit IDs in buyer_wallets
UPDATE public.buyer_wallets
SET faktura_id = 'FK-244-0' || SUBSTRING(faktura_id FROM 8)
WHERE faktura_id LIKE 'FK-244-%'
  AND LENGTH(faktura_id) = 12;

-- 4. Migrate existing 5-digit IDs in faturas buyer_faktura_id
UPDATE public.faturas
SET buyer_faktura_id = 'FK-244-0' || SUBSTRING(buyer_faktura_id FROM 8)
WHERE buyer_faktura_id IS NOT NULL
  AND buyer_faktura_id LIKE 'FK-244-%'
  AND LENGTH(buyer_faktura_id) = 12;

-- 5. Notify affected users about their new ID
INSERT INTO public.notifications (user_id, type, title, message)
SELECT p.user_id, 'info', 'Novo formato do seu Faktura ID 🆔',
  'O seu Faktura ID foi atualizado de 5 para 6 dígitos. O seu novo ID é: ' || p.faktura_id || '. Guarde este número para aceder à sua conta.'
FROM public.profiles p
WHERE p.faktura_id IS NOT NULL
  AND p.faktura_id LIKE 'FK-244-%';
