
-- Allow anonymous users to view products by user_id for public storefront
CREATE POLICY "Anyone can view products on public storefront"
ON public.produtos
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to view merchant agt_config for storefront
CREATE POLICY "Anyone can view merchant config on public storefront"
ON public.agt_config
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to lookup buyer by faktura_id (for scan)
-- Already handled by the SECURITY DEFINER function lookup_buyer_by_faktura_id
