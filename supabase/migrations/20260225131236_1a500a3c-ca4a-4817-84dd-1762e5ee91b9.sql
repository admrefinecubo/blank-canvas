
-- Fix: discount is stored as absolute R$ value, NOT percentage
-- The trigger was treating it as percentage (dividing by 100)
CREATE OR REPLACE FUNCTION public.generate_installments_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  i integer;
  installment_amount numeric;
  base_date date;
  net_total numeric;
BEGIN
  -- Só gera se status mudou para 'aprovado'
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
    -- Remove parcelas anteriores (caso reaprovação)
    DELETE FROM public.financial_installments WHERE budget_id = NEW.id;
    
    -- discount is absolute R$ value, not percentage
    net_total := GREATEST(COALESCE(NEW.total, 0) - COALESCE(NEW.discount, 0), 0);
    installment_amount := ROUND(net_total / GREATEST(COALESCE(NEW.installments, 1), 1), 2);
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
$function$;
