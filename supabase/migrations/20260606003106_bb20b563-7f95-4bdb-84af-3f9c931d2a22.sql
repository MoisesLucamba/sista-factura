
CREATE POLICY "users read own saft files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'saft' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users upload own saft files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'saft' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "service role full saft access" ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'saft') WITH CHECK (bucket_id = 'saft');
CREATE POLICY "admins read all saft" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'saft' AND public.has_role(auth.uid(),'admin'));
