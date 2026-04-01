CREATE OR REPLACE FUNCTION public.has_loja_access(_user_id uuid, _loja_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'platform_admin')
    OR EXISTS (
      SELECT 1
      FROM public.lojas l
      JOIN public.user_roles ur ON ur.clinic_id = l.clinic_id
      WHERE l.id = _loja_id
        AND ur.user_id = _user_id
    );
$$;

DROP POLICY IF EXISTS "lojas access" ON public.lojas;

CREATE POLICY "lojas select access"
ON public.lojas
FOR SELECT
TO authenticated
USING (public.has_loja_access(auth.uid(), id));

CREATE POLICY "lojas insert access"
ON public.lojas
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "lojas update access"
ON public.lojas
FOR UPDATE
TO authenticated
USING (public.has_loja_access(auth.uid(), id))
WITH CHECK (public.has_loja_access(auth.uid(), id));

CREATE POLICY "lojas delete access"
ON public.lojas
FOR DELETE
TO authenticated
USING (public.has_loja_access(auth.uid(), id));