
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('platform_admin', 'clinic_owner', 'clinic_staff', 'clinic_receptionist');

-- Tabela de clínicas
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  state text,
  phone text,
  email text,
  owner_name text NOT NULL,
  owner_email text NOT NULL,
  primary_color text DEFAULT '24 95% 53%',
  logo_url text,
  notes text,
  status text DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'cancelada')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Tabela de papéis de usuários
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  UNIQUE (user_id, role, clinic_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função helper para verificar papel (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: clinics
CREATE POLICY "Platform admins can do everything on clinics"
  ON public.clinics FOR ALL
  USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Clinic owners can view their own clinic"
  ON public.clinics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'clinic_owner'
        AND clinic_id = clinics.id
    )
  );

-- RLS: user_roles (somente admins podem gerenciar)
CREATE POLICY "Platform admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);
