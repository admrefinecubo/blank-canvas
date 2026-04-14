

# Plano: Página pública de Roadmap

## Resumo
Criar uma página `/roadmap` pública (sem login) que mostra o progresso do projeto com base no checklist .txt e nos workflows .json extraídos do zip.

## O que será feito

### 1. Extrair e processar os dados dos arquivos
- Copiar o .txt e o .zip para o projeto
- Parsear o CSV do checklist (109 itens, 17 blocos) — extrair: número, bloco, funcionalidade, status, prioridade
- Extrair o .zip e listar os workflows n8n — extrair: nome do workflow e nodes principais

### 2. Criar arquivo de dados estático
- `src/data/roadmap-data.ts` com:
  - Array tipado dos 109 itens do checklist, agrupados por bloco
  - Array dos workflows n8n encontrados no zip
  - Status de cada item mapeado para: `done`, `in_progress`, `pending`

### 3. Criar página `src/pages/Roadmap.tsx`
- Página pública, visual limpo
- Header com título "LojaADS — Roadmap do Projeto" e barra de progresso geral (X/109)
- Seção **Checklist por Bloco**: accordion/cards colapsáveis, cada bloco mostra seus itens com ícone de status (✅ feito, 🔄 em progresso, ⬚ pendente) e badge de prioridade
- Seção **Workflows N8N**: lista dos workflows extraídos do zip com nome e nodes
- Filtros rápidos: Todos / Feitos / Pendentes / Alta prioridade

### 4. Rota pública no App.tsx
- Adicionar `<Route path="/roadmap" element={<Roadmap />} />` **fora** dos blocos `ProtectedRoute`
- Acessível sem login por qualquer pessoa com o link

## Arquivos envolvidos
- `src/data/roadmap-data.ts` — dados estáticos parseados dos arquivos
- `src/pages/Roadmap.tsx` — página do roadmap
- `src/App.tsx` — nova rota pública

## Observação sobre atualização
Para atualizar o roadmap, basta editar o `roadmap-data.ts` com os novos status. Quando você quiser atualizar, me manda o checklist atualizado e eu altero os dados.

## Detalhes técnicos
- Sem banco de dados — dados hardcoded a partir dos arquivos enviados
- Sem autenticação necessária — rota fora do ProtectedRoute
- Componentes: Card, Badge, Progress, Accordion do shadcn/ui
- Responsivo para mobile (patrão pode ver no celular)

