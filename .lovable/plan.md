
## Plano: Adicionar campos E-commerce & Checkout na aba Agente de IA

Vou fazer 4 alterações no arquivo `src/pages/Settings.tsx`:

1. **SELECT query (linha 558)**: Adicionar `checkout_base_url, dias_funcionamento, desconto_followup_orcamento, plataforma_ecommerce`
2. **storeForm state (linhas 515-531)**: Adicionar os 4 campos novos com valores padrão
3. **useEffect de carregamento (linhas 573-589)**: Mapear os novos campos do `activeLoja`
4. **UPDATE mutation (linhas 647-662)**: Incluir os 4 campos no update com parsing adequado
5. **UI (após linha 819)**: Novo Card "E-commerce & Checkout" com 4 campos (plataforma, URL checkout, desconto follow-up, dias funcionamento)

Todas as colunas já existem na tabela `lojas` — não precisa de migração.
