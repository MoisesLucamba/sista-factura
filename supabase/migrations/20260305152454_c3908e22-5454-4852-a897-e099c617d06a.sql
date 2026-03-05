
-- Add approval status and ID document fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS id_doc_front_url text,
  ADD COLUMN IF NOT EXISTS id_doc_back_url text,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for id-documents bucket: users can upload their own docs
CREATE POLICY "Users can upload their own ID docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own ID docs
CREATE POLICY "Users can view their own ID docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all ID docs
CREATE POLICY "Admins can view all ID docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'id-documents' AND public.has_role(auth.uid(), 'admin'));

-- Set default approval_status for sellers to 'approved' (they don't need approval)
-- Buyers default to 'pending'
