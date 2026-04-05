
-- Stock movements history table
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'adjustment',
  quantity_change integer NOT NULL DEFAULT 0,
  quantity_before integer NOT NULL DEFAULT 0,
  quantity_after integer NOT NULL DEFAULT 0,
  reference text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_produto ON public.stock_movements(produto_id);
CREATE INDEX idx_stock_movements_user ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(type);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock movements"
ON public.stock_movements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock movements"
ON public.stock_movements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock movements"
ON public.stock_movements FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
