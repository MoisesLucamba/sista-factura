
-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  nif TEXT NOT NULL,
  endereco TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  tipo TEXT NOT NULL DEFAULT 'geral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own suppliers" ON public.fornecedores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own suppliers" ON public.fornecedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own suppliers" ON public.fornecedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own suppliers" ON public.fornecedores FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_fornecedores_updated_at
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add empresa fields to agt_config
ALTER TABLE public.agt_config
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS actividade_comercial TEXT,
  ADD COLUMN IF NOT EXISTS alvara_comercial TEXT,
  ADD COLUMN IF NOT EXISTS morada TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS provincia TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
