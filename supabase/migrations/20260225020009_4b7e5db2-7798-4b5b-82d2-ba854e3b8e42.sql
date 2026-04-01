
-- Fix: Replace the overly permissive INSERT policy with a more restrictive one
-- The audit trigger runs as SECURITY DEFINER so it bypasses RLS.
-- Regular users should NOT be able to insert audit logs directly.
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
