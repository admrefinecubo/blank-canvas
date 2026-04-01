
-- Tabela de parcelas financeiras geradas a partir de orçamentos aprovados
CREATE TABLE public.financial_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  installment_number integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pendente', -- pendente, pago, atrasado
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view installments of their clinic"
ON public.financial_installments FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = financial_installments.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE POLICY "Users can insert installments in their clinic"
ON public.financial_installments FOR INSERT
WITH CHECK (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = financial_installments.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE POLICY "Users can update installments in their clinic"
ON public.financial_installments FOR UPDATE
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = financial_installments.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE POLICY "Users can delete installments in their clinic"
ON public.financial_installments FOR DELETE
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = financial_installments.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE TRIGGER update_financial_installments_updated_at
BEFORE UPDATE ON public.financial_installments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de termos de consentimento LGPD da clínica
CREATE TABLE public.consent_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Termo de Consentimento',
  content text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consent terms of their clinic"
ON public.consent_terms FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = consent_terms.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE POLICY "Users can manage consent terms in their clinic"
ON public.consent_terms FOR ALL
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = consent_terms.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

-- Tabela de registros de consentimento do paciente
CREATE TABLE public.patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consent_term_id uuid REFERENCES public.consent_terms(id),
  consented boolean NOT NULL DEFAULT false,
  consent_type text NOT NULL DEFAULT 'treatment', -- treatment, marketing, data_sharing
  ip_address text,
  consented_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone
);

ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consents of their clinic"
ON public.patient_consents FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = patient_consents.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE POLICY "Users can manage consents in their clinic"
ON public.patient_consents FOR ALL
USING (
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.clinic_id = patient_consents.clinic_id))
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

-- Função para gerar parcelas automaticamente quando orçamento é aprovado
CREATE OR REPLACE FUNCTION public.generate_installments_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
  installment_amount numeric;
  base_date date;
BEGIN
  -- Só gera se status mudou para 'aprovado'
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
    -- Remove parcelas anteriores (caso reaprovação)
    DELETE FROM public.financial_installments WHERE budget_id = NEW.id;
    
    installment_amount := ROUND((COALESCE(NEW.total, 0) * (1 - COALESCE(NEW.discount, 0) / 100.0)) / GREATEST(COALESCE(NEW.installments, 1), 1), 2);
    base_date := CURRENT_DATE;
    
    FOR i IN 1..GREATEST(COALESCE(NEW.installments, 1), 1) LOOP
      INSERT INTO public.financial_installments (
        clinic_id, budget_id, patient_id, installment_number, total_installments,
        amount, due_date, status, payment_method
      ) VALUES (
        NEW.clinic_id, NEW.id, NEW.patient_id, i, COALESCE(NEW.installments, 1),
        installment_amount, base_date + ((i - 1) * 30), 'pendente', NEW.payment_method
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_installments_trigger
AFTER UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.generate_installments_on_approval();

-- Também gerar ao inserir já como aprovado
CREATE TRIGGER generate_installments_on_insert_trigger
AFTER INSERT ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.generate_installments_on_approval();
