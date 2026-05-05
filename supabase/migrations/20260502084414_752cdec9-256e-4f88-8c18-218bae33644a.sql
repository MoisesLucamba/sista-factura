-- ============================================================
-- AGT Compliance — Decreto Presidencial 312/18
-- ============================================================

-- REGRA 1, 9 — Hash chain + SystemEntryDate + Período contabilístico
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS hash_doc TEXT;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS hash_extracto VARCHAR(4);
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS hash_anterior TEXT DEFAULT '0';
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS periodo_contabilistico VARCHAR(7);
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS system_entry_date TIMESTAMPTZ DEFAULT NOW();

-- REGRA 5 — Desconto global ao documento
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS desconto_global NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS desconto_global_valor NUMERIC(15,2) DEFAULT 0;

-- REGRA 6 — Moeda estrangeira
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS moeda VARCHAR(3) DEFAULT 'AOA';
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS taxa_cambio NUMERIC(15,6) DEFAULT 1.000000;

-- REGRA 8 — OrderReference
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS order_reference_id UUID;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS order_reference_numero TEXT;

-- REGRA 11 — Guia de Remessa
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS guia_morada_carga TEXT;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS guia_morada_descarga TEXT;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS guia_matricula_viatura TEXT;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS guia_data_transporte DATE;

-- REGRA 12 — Fatura Global (período)
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS periodo_global_inicio DATE;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS periodo_global_fim DATE;

-- REGRA 2 — Flag para excluir do SAF-T (proforma/orcamento)
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS incluir_saft BOOLEAN DEFAULT TRUE;

-- REGRA 3 — Códigos de isenção de IVA por linha
ALTER TABLE public.itens_fatura ADD COLUMN IF NOT EXISTS tax_exemption_code VARCHAR(4);
ALTER TABLE public.itens_fatura ADD COLUMN IF NOT EXISTS tax_exemption_reason TEXT;

-- Índice para busca rápida de hash chain por série
CREATE INDEX IF NOT EXISTS idx_faturas_serie_created
  ON public.faturas (user_id, serie, created_at DESC);

-- Índice para OrderReference
CREATE INDEX IF NOT EXISTS idx_faturas_order_ref
  ON public.faturas (order_reference_id);
