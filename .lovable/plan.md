
Objetivo: alterar apenas `vite.config.ts` para que o PWA deixe de recarregar automaticamente a aplicação quando detectar nova versão.

Plano de implementação:
1. Abrir `vite.config.ts` e localizar a configuração do plugin `VitePWA`.
2. Substituir somente:
   ```ts
   registerType: "autoUpdate"
   ```
   por:
   ```ts
   registerType: "prompt"
   ```
3. Não modificar mais nada no arquivo: manter `includeAssets`, `workbox`, `manifest`, `server`, `plugins` e `resolve` exatamente como estão.
4. Resultado esperado:
   - o service worker não forçará mais reload automático;
   - o app passará a sinalizar atualização disponível para o usuário, em vez de recarregar sozinho ao trocar de aba.

Detalhe técnico:
- `autoUpdate` aplica atualização automaticamente assim que o novo service worker fica pronto.
- `prompt` muda a estratégia para atualização controlada por interação do usuário, evitando reload inesperado.

Arquivo afetado:
- `vite.config.ts`
