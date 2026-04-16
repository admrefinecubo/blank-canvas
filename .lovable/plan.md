

## Plano: Corrigir último resquício de `nome_assistente`

Todos os 5 prompts Lovable já foram executados. O roadmap, changelog, migrations, onboarding wizard, gerar_cobranca — tudo está implementado.

Único detalhe encontrado: `AdminLojaDetail.tsx` linha 310 ainda usa `form.nome_assistente` no preview do prompt. Deveria ser `form.nome_assistente_ia`.

### Alteração

**Arquivo:** `src/pages/AdminLojaDetail.tsx`, linha 310

Trocar:
```
${form.nome_assistente || "[Nome da IA]"}
```
Por:
```
${form.nome_assistente_ia || "[Nome da IA]"}
```

Isso é um fix de 1 linha. Nenhuma outra alteração necessária.

### Status final dos prompts

| # | Prompt | Status |
|---|--------|--------|
| Lovable #1 | Migration external_id + plataforma | ✅ |
| Lovable #2 | Unificar nome_assistente | ✅ (fix 1 linha) |
| Lovable #3 | Onboarding Wizard | ✅ |
| Lovable #4 | gerar_cobranca funcional | ✅ |
| Lovable #5 | Atualizar roadmap | ✅ |

