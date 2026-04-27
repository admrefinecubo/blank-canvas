ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE historico_mensagens;
ALTER TABLE leads REPLICA IDENTITY FULL;
ALTER TABLE historico_mensagens REPLICA IDENTITY FULL;