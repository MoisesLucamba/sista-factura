
-- Shared product database that grows with merchant usage
CREATE TABLE public.shared_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text NOT NULL UNIQUE,
  nome text NOT NULL,
  marca text,
  categoria text,
  imagem_url text,
  merchant_count integer NOT NULL DEFAULT 1,
  avg_price numeric NOT NULL DEFAULT 0,
  min_price numeric NOT NULL DEFAULT 0,
  max_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared products" ON public.shared_products FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert shared products" ON public.shared_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update shared products" ON public.shared_products FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_shared_products_barcode ON public.shared_products (barcode);
CREATE INDEX idx_shared_products_categoria ON public.shared_products (categoria);

-- Trigger to update updated_at
CREATE TRIGGER update_shared_products_updated_at
  BEFORE UPDATE ON public.shared_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Buyer expense records for self-invoicing
CREATE TABLE public.buyer_expense_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL,
  barcode text,
  produto_nome text NOT NULL,
  marca text,
  categoria text,
  preco numeric NOT NULL DEFAULT 0,
  quantidade integer NOT NULL DEFAULT 1,
  total numeric NOT NULL DEFAULT 0,
  merchant_name text,
  is_faktura_merchant boolean NOT NULL DEFAULT false,
  faktura_merchant_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_expense_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own expenses" ON public.buyer_expense_records FOR SELECT TO authenticated USING (auth.uid() = buyer_user_id);
CREATE POLICY "Buyers can insert own expenses" ON public.buyer_expense_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_user_id);
CREATE POLICY "Buyers can delete own expenses" ON public.buyer_expense_records FOR DELETE TO authenticated USING (auth.uid() = buyer_user_id);

CREATE INDEX idx_buyer_expenses_user ON public.buyer_expense_records (buyer_user_id);

-- Function to upsert shared product when merchant saves a product with barcode
CREATE OR REPLACE FUNCTION public.sync_shared_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.barcode IS NOT NULL AND NEW.barcode != '' THEN
    INSERT INTO public.shared_products (barcode, nome, marca, categoria, imagem_url, merchant_count, avg_price, min_price, max_price)
    VALUES (NEW.barcode, NEW.nome, NEW.marca, NEW.categoria, NEW.imagem_url, 1, NEW.preco_unitario, NEW.preco_unitario, NEW.preco_unitario)
    ON CONFLICT (barcode) DO UPDATE SET
      nome = COALESCE(EXCLUDED.nome, shared_products.nome),
      marca = COALESCE(EXCLUDED.marca, shared_products.marca),
      categoria = COALESCE(EXCLUDED.categoria, shared_products.categoria),
      imagem_url = COALESCE(EXCLUDED.imagem_url, shared_products.imagem_url),
      merchant_count = (SELECT COUNT(DISTINCT user_id) FROM public.produtos WHERE barcode = NEW.barcode),
      avg_price = (SELECT COALESCE(AVG(preco_unitario), 0) FROM public.produtos WHERE barcode = NEW.barcode),
      min_price = (SELECT COALESCE(MIN(preco_unitario), 0) FROM public.produtos WHERE barcode = NEW.barcode),
      max_price = (SELECT COALESCE(MAX(preco_unitario), 0) FROM public.produtos WHERE barcode = NEW.barcode),
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_shared_product_on_produto
  AFTER INSERT OR UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.sync_shared_product();
