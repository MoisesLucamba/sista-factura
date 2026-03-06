ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS seller_subtype text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS id_doc_nif_url text DEFAULT NULL;