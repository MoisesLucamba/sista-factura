-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  nif TEXT NOT NULL,
  endereco TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('particular', 'empresa')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create produtos table
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('produto', 'servico')),
  preco_unitario DECIMAL(15,2) NOT NULL,
  unidade TEXT NOT NULL,
  iva_incluido BOOLEAN NOT NULL DEFAULT false,
  taxa_iva DECIMAL(5,2) NOT NULL DEFAULT 14,
  stock INTEGER,
  stock_minimo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faturas table
CREATE TABLE public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  serie TEXT NOT NULL DEFAULT 'FT',
  tipo TEXT NOT NULL CHECK (tipo IN ('fatura', 'fatura-recibo', 'recibo', 'nota-credito')),
  estado TEXT NOT NULL CHECK (estado IN ('rascunho', 'emitida', 'paga', 'anulada', 'vencida')) DEFAULT 'rascunho',
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_iva DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  metodo_pagamento TEXT,
  referencia_pagamento TEXT,
  qr_code TEXT,
  assinatura_digital TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itens_fatura table
CREATE TABLE public.itens_fatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID REFERENCES public.faturas(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE RESTRICT NOT NULL,
  quantidade DECIMAL(15,3) NOT NULL,
  preco_unitario DECIMAL(15,2) NOT NULL,
  desconto DECIMAL(5,2) NOT NULL DEFAULT 0,
  taxa_iva DECIMAL(5,2) NOT NULL DEFAULT 14,
  subtotal DECIMAL(15,2) NOT NULL,
  valor_iva DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_fatura ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clientes
CREATE POLICY "Users can view their own clients"
ON public.clientes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
ON public.clientes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clientes FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clientes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for produtos
CREATE POLICY "Users can view their own products"
ON public.produtos FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
ON public.produtos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON public.produtos FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
ON public.produtos FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for faturas
CREATE POLICY "Users can view their own invoices"
ON public.faturas FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
ON public.faturas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON public.faturas FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON public.faturas FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for itens_fatura (based on fatura ownership)
CREATE POLICY "Users can view items of their invoices"
ON public.itens_fatura FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.faturas WHERE faturas.id = itens_fatura.fatura_id AND faturas.user_id = auth.uid()
));

CREATE POLICY "Users can create items for their invoices"
ON public.itens_fatura FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.faturas WHERE faturas.id = itens_fatura.fatura_id AND faturas.user_id = auth.uid()
));

CREATE POLICY "Users can update items of their invoices"
ON public.itens_fatura FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.faturas WHERE faturas.id = itens_fatura.fatura_id AND faturas.user_id = auth.uid()
));

CREATE POLICY "Users can delete items of their invoices"
ON public.itens_fatura FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.faturas WHERE faturas.id = itens_fatura.fatura_id AND faturas.user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faturas_updated_at
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(_user_id UUID, _serie TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(SPLIT_PART(numero, '/', 3), ' ', 1) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM public.faturas
  WHERE user_id = _user_id
    AND serie = _serie
    AND numero LIKE _serie || '/' || current_year || '/%';
  
  invoice_number := _serie || '/' || current_year || '/' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_number;
END;
$$;