
-- Host stores table
CREATE TABLE public.host_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  raio_metros INTEGER NOT NULL DEFAULT 100,
  descricao TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.host_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own host stores" ON public.host_stores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view active host stores" ON public.host_stores FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated can view active host stores" ON public.host_stores FOR SELECT TO authenticated USING (is_active = true);

CREATE TRIGGER update_host_stores_updated_at BEFORE UPDATE ON public.host_stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sub stores table
CREATE TABLE public.sub_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  host_store_id UUID NOT NULL REFERENCES public.host_stores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  logo_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sub stores" ON public.sub_stores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Host can view their sub stores" ON public.sub_stores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.host_stores WHERE id = sub_stores.host_store_id AND user_id = auth.uid()));
CREATE POLICY "Host can update sub store approval" ON public.sub_stores FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.host_stores WHERE id = sub_stores.host_store_id AND user_id = auth.uid()));
CREATE POLICY "Anyone can view active approved sub stores" ON public.sub_stores FOR SELECT TO anon USING (is_active = true AND approved = true);
CREATE POLICY "Authenticated can view active approved sub stores" ON public.sub_stores FOR SELECT TO authenticated USING (is_active = true AND approved = true);

CREATE TRIGGER update_sub_stores_updated_at BEFORE UPDATE ON public.sub_stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Revenue splits configuration
CREATE TABLE public.revenue_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_store_id UUID NOT NULL REFERENCES public.host_stores(id) ON DELETE CASCADE,
  sub_store_id UUID NOT NULL REFERENCES public.sub_stores(id) ON DELETE CASCADE,
  host_percentage NUMERIC NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (host_store_id, sub_store_id)
);

ALTER TABLE public.revenue_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host can manage revenue splits" ON public.revenue_splits FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.host_stores WHERE id = revenue_splits.host_store_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.host_stores WHERE id = revenue_splits.host_store_id AND user_id = auth.uid()));
CREATE POLICY "Sub store can view their revenue split" ON public.revenue_splits FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.sub_stores WHERE id = revenue_splits.sub_store_id AND user_id = auth.uid()));

CREATE TRIGGER update_revenue_splits_updated_at BEFORE UPDATE ON public.revenue_splits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
