

# Debug Completo: WF-01 — "no unique or exclusion constraint matching the ON CONFLICT specification"

## Causa Raiz

O node **"Supabase - Buscar ou Criar Lead (Upsert)"** (id: `feae6b5a`) na linha 247 do JSON faz POST para:

```
/rest/v1/leads?on_conflict=loja_id,telefone
```

Com header `Prefer: resolution=merge-duplicates`.

Porém no banco, a tabela `leads` tem apenas estas constraints únicas:
- `leads_pkey` → `(id)` 
- `leads_telefone_instance_unique` → `(telefone, instance)`

**NÃO existe** constraint unique em `(loja_id, telefone)`. O PostgREST rejeita com "no unique or exclusion constraint matching the ON CONFLICT specification".

## Solução: 2 passos

### Passo 1 — Criar unique constraint no banco

Executar migration SQL:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS leads_loja_telefone_uidx 
  ON leads(loja_id, telefone);
```

Isso cria o índice único que o WF-01 espera. O índice antigo `(telefone, instance)` pode coexistir — não conflita.

### Passo 2 — Gerar prompt atualizado para Claude

Atualizar o arquivo `PROMPT-FIX-WF01-v2.md` adicionando este bug e a informação de que a migration já foi aplicada, para que o Claude saiba que o `on_conflict=loja_id,telefone` agora está correto e não precisa ser alterado.

### Verificação adicional: node `mensagens_processadas`

O node "Marcar MessageId como Processado" (id: `1d3aad0a`, linha 206) faz POST para `/rest/v1/mensagens_processadas` **sem** `?on_conflict=message_id` na URL. O PostgREST infere o PK automaticamente quando há `Prefer: resolution=merge-duplicates`, então isso funciona. Mas para ser explícito e robusto, vamos adicionar `?on_conflict=message_id` na URL também.

## Resumo das mudanças

| O quê | Onde | Ação |
|-------|------|------|
| Criar `leads_loja_telefone_uidx` | Supabase (migration) | `CREATE UNIQUE INDEX` |
| Adicionar `?on_conflict=message_id` | WF-01 node `Marcar MessageId` (URL linha 206) | Prompt para Claude |
| Documentar no prompt | `/mnt/documents/PROMPT-FIX-WF01-v3.md` | Gerar arquivo atualizado |

## Nota técnica

O `on_conflict=loja_id,telefone` no node de leads está correto para a lógica de negócio (um lead por loja+telefone). O problema é apenas que o índice correspondente não existia no banco. Após a migration, o upsert vai funcionar.

