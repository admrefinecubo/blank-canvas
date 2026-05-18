DO $$ 
DECLARE lead_correto uuid;
BEGIN
    SELECT id INTO lead_correto FROM leads WHERE telefone = '558591670420' ORDER BY created_at DESC LIMIT 1;
    IF lead_correto IS NOT NULL THEN
        UPDATE historico_mensagens SET lead_id = lead_correto WHERE telefone = '558591670420' AND lead_id != lead_correto;
        DELETE FROM leads WHERE telefone = '558591670420' AND id != lead_correto;
    END IF;
END $$;