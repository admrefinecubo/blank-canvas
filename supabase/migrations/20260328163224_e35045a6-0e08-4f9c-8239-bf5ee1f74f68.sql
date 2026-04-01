
-- Policies para as tabelas do agente WhatsApp
-- Como o n8n usa service_role_key, ele bypassa RLS automaticamente.
-- Estas policies permitem que platform_admins também acessem via frontend.

CREATE POLICY "Platform admins full access on lojas" ON lojas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins full access on produtos" ON produtos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins full access on leads" ON leads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins full access on historico_mensagens" ON historico_mensagens FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins full access on follow_ups" ON follow_ups FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins full access on visitas" ON visitas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins full access on mensagens_processadas" ON mensagens_processadas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));
