

# Bug Fix: "No path back to referenced node" no WF-01

## Diagnóstico

O node **"Supabase - Buscar ou Criar Lead (Upsert)"** (linha 271 do JSON) usa esta expressão:

```
"loja_id": "{{ ($('Supabase - Carregar Config da Loja (Tenant)').item.json[0] || {}).id }}"
```

Porém, na cadeia de conexões atual, o fluxo é:

```text
Marcar MessageId → Buscar/Criar Lead → Redis → IF Pausado? → Carregar Config Loja → Histórico → ...
```

Ou seja, **"Buscar ou Criar Lead" executa ANTES de "Carregar Config da Loja"**, mas referencia dados dele. O n8n detecta que não há caminho de volta e mostra o erro.

## Solução — Prompt para Claude

Gerar um arquivo `.md` com o prompt preciso para o Claude corrigir o JSON do WF-01, reordenando as conexões para que "Carregar Config da Loja" execute ANTES de "Buscar ou Criar Lead".

### A correção no fluxo deve ser:

```text
ANTES:
  Marcar MessageId → Buscar/Criar Lead → Redis → IF Pausado → Carregar Config Loja

DEPOIS:
  Marcar MessageId → Carregar Config Loja → Buscar/Criar Lead → Redis → IF Pausado
```

Isso resolve porque "Buscar/Criar Lead" precisa do `loja_id` que vem de "Carregar Config da Loja".

### Mudanças no JSON `connections`:

1. **"Supabase - Marcar MessageId como Processado"** → output muda de `Buscar ou Criar Lead` para `Carregar Config da Loja (Tenant)`
2. **"Supabase - Carregar Config da Loja (Tenant)"** → output muda de `Carregar Histórico` para `Buscar ou Criar Lead (Upsert)`
3. **"Supabase - Buscar ou Criar Lead (Upsert)"** → output continua apontando para `Redis GET - Checar Pausa` (sem mudança)
4. **"IF - Agente Está Pausado?"** → output false muda de `Carregar Config da Loja` para `Carregar Histórico de Conversa`

### Entregável

Um arquivo markdown em `/mnt/documents/` com o prompt completo, incluindo os 4 blocos JSON exatos de `connections` a serem alterados, IDs dos nodes envolvidos, e instrução para NÃO alterar nenhum outro node.

