CREATE POLICY "docs adicionais dono select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-adicionais' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.tem_papel(auth.uid(), 'admin')));

CREATE POLICY "docs adicionais dono insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-adicionais' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "docs adicionais dono delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-adicionais' AND auth.uid()::text = (storage.foldername(name))[1]);