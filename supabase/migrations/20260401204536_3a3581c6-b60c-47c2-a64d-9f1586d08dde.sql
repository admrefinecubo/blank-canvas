ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS clinic_subtitle text,
ADD COLUMN IF NOT EXISTS favicon_url text;

DROP POLICY IF EXISTS "platform admins can manage clinics" ON public.clinics;

CREATE POLICY "platform admins can manage clinics"
ON public.clinics
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "users can view own clinic branding"
ON public.clinics
FOR SELECT
TO authenticated
USING (public.has_clinic_access(auth.uid(), id));