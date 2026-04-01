
Objetivo: te mostrar exatamente o que você acessa hoje como dev para gerenciar um cliente como `teste@gmail.com`, o que já dá para fazer agora, e o que ainda precisa ser ajustado para o fluxo ficar realmente profissional.

1. O que você acessa hoje como dev
- Painel principal de admin: `/admin`
  - aqui você cria e edita a “conta” do cliente na tabela `clinics`
  - apesar do nome técnico ainda ser `clinics`, na prática isso já é a conta/tenant do cliente
- Detalhe da conta: `/admin/clinic/:id`
  - aqui você vê os dados da conta e tem o botão “Entrar no CRM”
  - esse botão ativa a impersonação, então você passa a enxergar o CRM como se fosse aquela conta
- Módulo de lojas: `/admin/lojas`
  - isso é separado da conta principal
  - serve para o módulo comercial/WhatsApp/catálogo

2. Resposta direta: como gerenciar o perfil `teste@gmail.com`
Hoje, dentro do app, você não tem uma tela global de “buscar usuário por e-mail” e abrir o perfil dele diretamente.

O que existe hoje é:
- gestão de usuários por conta em `/settings` > aba `Equipe`
- essa aba usa a edge function `manage-team`
- nela você consegue:
  - listar usuários da conta selecionada
  - criar usuário
  - trocar cargo
  - remover vínculo

Então, para gerenciar `teste@gmail.com` hoje, o fluxo correto é:
```text
1. Você cria ou escolhe a conta do cliente
2. Vai em Configurações
3. Seleciona a conta
4. Abre Equipe
5. Cria ou gerencia o login dele nessa conta
```

3. Você pode criar a loja dele e definir tudo?
Sim, parcialmente.

Você já consegue hoje:
- criar a conta principal do cliente em `/admin`
- definir branding/white label em `/settings` > `White Label`
- definir dados da conta em `/settings` > `Conta`
- criar o login dele em `/settings` > `Equipe`
- entrar no CRM dele via impersonação e validar como ficou

Mas existe um ponto importante:
- a “conta do cliente” hoje está em `clinics`
- a “loja” do módulo WhatsApp está em `lojas`
- a tela `/admin/lojas` atualmente cria a loja sem vincular `clinic_id`
- então criar a loja por ali hoje não garante o vínculo correto com a conta do cliente

Conclusão:
- sim, você já pode configurar o CRM do cliente
- mas o cadastro de `lojas` ainda precisa ser ajustado para nascer vinculado à conta certa

4. O que acontece com o CRM dele depois que você configura
Hoje o branding do CRM vem da tabela `clinics` via `WhiteLabelContext`.

Isso significa:
- se você configurar nome, subtítulo, cor, logo e favicon da conta dele
- o CRM dele passa a consumir esses dados
- quando ele fizer login na conta dele, ele verá a identidade visual que você definiu

Em outras palavras:
```text
Você configura a conta -> grava em clinics -> o CRM dele lê dessa conta -> ele vê atualizado
```

5. O que está profissional hoje
- somente `platform_admin` acessa `/admin`
- somente `platform_admin` vê aba de White Label e Equipe
- o cliente não deveria mais editar branding
- você consegue impersonar a conta e validar o CRM antes de entregar
- o login do cliente pode ser criado por você com papel adequado

6. O que ainda está inconsistente
- o nome técnico `clinics` ainda aparece na arquitetura
- o módulo `lojas` está separado e mal acoplado à conta principal
- não existe uma tela de admin centrada em “usuário do cliente por e-mail”
- o fluxo ideal “criar conta -> criar loja -> criar usuário -> vincular tudo” ainda não está fechado numa única experiência

7. Plano revisado para o fluxo profissional que você quer
Fase 1 — fluxo operacional imediato
- usar `/admin` para criar a conta do cliente
- usar `/settings` para configurar branding e dados da conta
- usar `/settings` > `Equipe` para criar o login de `teste@gmail.com`
- usar `/admin/clinic/:id` > “Entrar no CRM” para validar tudo

Fase 2 — corrigir a modelagem prática
- fazer `AdminLojas` exigir e salvar `clinic_id`
- tratar `lojas` como submódulo da conta
- impedir loja órfã sem vínculo com tenant

Fase 3 — deixar o fluxo profissional
- criar um onboarding admin único:
  - criar conta
  - criar loja vinculada
  - criar usuário dono
  - definir branding
  - definir integrações
- no final, você entrega login e senha ao cliente

8. Como eu recomendo você operar a partir de agora
Fluxo ideal com a estrutura atual:
```text
1. /admin
   criar a conta do cliente

2. /settings
   selecionar a conta
   configurar:
   - nome da marca
   - subtítulo
   - logo
   - favicon
   - cor
   - dados da conta

3. /settings > Equipe
   criar o usuário teste@gmail.com
   papel recomendado: clinic_owner

4. /admin/clinic/:id
   clicar em "Entrar no CRM"
   conferir se tudo ficou certo

5. depois disso
   entregar o login para o cliente
```

9. Decisão recomendada
- Sim: você deve configurar tudo primeiro
- Sim: o cliente deve receber o CRM já pronto
- Sim: o que você configurar na conta dele deve refletir no CRM dele
- Não: o cliente não deveria acessar white label
- Não: você não deveria depender de `/admin/lojas` do jeito que está hoje para vincular a conta dele sem antes corrigir o `clinic_id`

10. Próxima implementação recomendada
Vou considerar como prioridade a seguinte revisão:
- fechar o fluxo admin de onboarding do cliente
- vincular `lojas` corretamente à conta (`clinic_id`)
- criar uma visão clara de usuários por conta
- manter `clinics` como nome interno técnico, mas expor tudo como “Conta” ou “Loja” na interface

Detalhes técnicos
- `/admin` opera sobre `clinics`
- `/settings` já permite white label por conta quando o usuário é `platform_admin`
- `WhiteLabelContext` lê branding diretamente de `clinics`
- `manage-team` só permite ação de `platform_admin`
- `/admin/lojas` hoje cria registros em `lojas`, mas sem vínculo garantido com `clinic_id`
- a impersonação funciona via `impersonatedClinicId` no `AuthContext`, então você já consegue validar o CRM do cliente antes de liberar acesso
