
-- Add WhatsApp consent fields to clientes
ALTER TABLE public.clientes 
ADD COLUMN whatsapp_consent boolean NOT NULL DEFAULT false,
ADD COLUMN whatsapp_enabled boolean NOT NULL DEFAULT true;

-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

-- Storage policies for invoice PDFs
CREATE POLICY "Users can upload their own invoice PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own invoice PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view invoice PDFs via signed URLs"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices');

CREATE POLICY "Users can delete their own invoice PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add retry_count and fallback_channel to invoice_sends
ALTER TABLE public.invoice_sends
ADD COLUMN retry_count integer NOT NULL DEFAULT 0,
ADD COLUMN max_retries integer NOT NULL DEFAULT 3,
ADD COLUMN fallback_used boolean NOT NULL DEFAULT false,
ADD COLUMN pdf_url text;
