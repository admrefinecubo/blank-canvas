-- Create storage bucket for clinic logos
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for clinic assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload clinic assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update clinic assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete clinic assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated');