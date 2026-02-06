-- ============================================
-- AGT Compliance Tables for Angola Invoicing
-- ============================================

-- Enum for send status
CREATE TYPE public.send_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE public.send_channel AS ENUM ('whatsapp', 'sms', 'email');

-- ============================================
-- AGT Configuration Table
-- Stores company AGT certification details
-- ============================================
CREATE TABLE public.agt_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- AGT Certificate Details
  certificate_number text,
  certificate_valid_until date,
  certificate_status text DEFAULT 'pending' CHECK (certificate_status IN ('pending', 'active', 'expired', 'revoked')),
  -- Company Legal Info
  nif_produtor text,
  nome_empresa text,
  endereco_empresa text,
  -- RSA Keys (public key stored, private key should be managed securely)
  public_key text,
  -- AGT Documentation References
  modelo_8_reference text,
  memoria_descritiva_reference text,
  declaracao_conformidade_reference text,
  -- Settings
  auto_send_invoice boolean DEFAULT false,
  default_send_channel send_channel DEFAULT 'whatsapp',
  invoice_language text DEFAULT 'pt-AO',
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Ensure one config per user
  UNIQUE(user_id)
);

-- ============================================
-- Invoice Send History Table
-- Tracks all invoice send attempts
-- ============================================
CREATE TABLE public.invoice_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  -- Send Details
  channel send_channel NOT NULL,
  recipient text NOT NULL, -- phone number or email
  status send_status DEFAULT 'pending',
  -- MessageBird Details
  external_message_id text,
  -- Timestamps
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Audit Log Table
-- Complete action logging for AGT compliance
-- ============================================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Action Details
  action text NOT NULL,
  entity_type text NOT NULL, -- 'fatura', 'cliente', 'produto', etc.
  entity_id uuid,
  -- Data Snapshot
  old_data jsonb,
  new_data jsonb,
  -- Context
  ip_address text,
  user_agent text,
  -- Timestamp
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Document Signatures Table
-- Stores digital signatures for each document
-- ============================================
CREATE TABLE public.document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  -- Signature Details
  signature_hash text NOT NULL,
  signature_algorithm text DEFAULT 'RSA-SHA256',
  certificate_number text,
  -- Verification
  document_hash text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  -- Uniqueness
  UNIQUE(fatura_id)
);

-- ============================================
-- Enable RLS on all new tables
-- ============================================
ALTER TABLE public.agt_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for agt_config
-- ============================================
CREATE POLICY "Users can view their own AGT config"
  ON public.agt_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AGT config"
  ON public.agt_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AGT config"
  ON public.agt_config FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for invoice_sends
-- ============================================
CREATE POLICY "Users can view their own sends"
  ON public.invoice_sends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sends"
  ON public.invoice_sends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sends"
  ON public.invoice_sends FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for audit_logs
-- ============================================
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Audit logs cannot be updated or deleted (immutability)

-- ============================================
-- RLS Policies for document_signatures
-- ============================================
CREATE POLICY "Users can view signatures of their invoices"
  ON public.document_signatures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.faturas
    WHERE faturas.id = document_signatures.fatura_id
    AND faturas.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert signatures for their invoices"
  ON public.document_signatures FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.faturas
    WHERE faturas.id = document_signatures.fatura_id
    AND faturas.user_id = auth.uid()
  ));

-- Signatures cannot be updated or deleted (immutability)

-- ============================================
-- Add AGT fields to faturas table
-- ============================================
ALTER TABLE public.faturas
  ADD COLUMN IF NOT EXISTS certificate_number text,
  ADD COLUMN IF NOT EXISTS signature_hash text,
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_agt_config_updated_at
  BEFORE UPDATE ON public.agt_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_sends_updated_at
  BEFORE UPDATE ON public.invoice_sends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Function to lock invoice after emission
-- Prevents modifications to emitted invoices
-- ============================================
CREATE OR REPLACE FUNCTION public.lock_emitted_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Lock the invoice when it transitions to 'emitida' status
  IF NEW.estado = 'emitida' AND OLD.estado = 'rascunho' THEN
    NEW.is_locked := true;
  END IF;
  
  -- Prevent changes to locked invoices (except estado changes for payment/cancellation)
  IF OLD.is_locked = true THEN
    -- Only allow specific estado changes
    IF NEW.estado NOT IN ('paga', 'anulada') OR 
       OLD.numero <> NEW.numero OR
       OLD.cliente_id <> NEW.cliente_id OR
       OLD.subtotal <> NEW.subtotal OR
       OLD.total <> NEW.total THEN
      -- Allow only estado changes
      IF OLD.estado = NEW.estado THEN
        RAISE EXCEPTION 'Fatura bloqueada: não é possível modificar após emissão';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_invoice_lock
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_emitted_invoice();

-- ============================================
-- Function to create audit log entry
-- ============================================
CREATE OR REPLACE FUNCTION public.create_audit_log(
  _user_id uuid,
  _action text,
  _entity_type text,
  _entity_id uuid,
  _old_data jsonb DEFAULT NULL,
  _new_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (_user_id, _action, _entity_type, _entity_id, _old_data, _new_data)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;