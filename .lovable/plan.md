
Objetivo: reorganizar o CRM para um modelo profissional de SaaS por cliente, onde você configura a conta do cliente, define login/acessos, controla white label, e o cliente só vê e edita o que for permitido.

1. Diagnóstico do que existe hoje
- Hoje o sistema tem 2 conceitos misturados:
  - `clinics`: virou o tenant principal do CRM inteiro.
  - `lojas`: virou um módulo paralelo para WhatsApp/catalogo/leads.
- Na prática, `clinics` está sendo usado como “empresa/conta do cliente”, mesmo com nome errado.
- Por isso aparecem `clinicId`, `clinics`, `clinic_owner` etc. em quase todas as telas, permissões e RLS.
- O white label hoje lê da tabela `clinics`, mas também grava parte em `localStorage`, o que não é profissional nem seguro.
- A página de Configurações hoje expõe a aba White Label para usuários comuns, então o cliente pode mexer em algo que deveria ser só seu.

2. Conclusão arquitetural
Não vale sair renomeando tudo agora de forma brusca no banco inteiro. Profissionalmente, o melhor é:
- assumir `clinics` como a entidade interna do tenant atual;
- tratar semanticamente isso como “Conta/Empresa/Loja do cliente” na interface;
- remover a exposição do termo “clínica” no app;
- centralizar white label e setup da conta no banco, com permissão só de `platform_admin`;
- deixar o cliente entrar apenas no CRM da própria conta, já com tudo configurado por você.

3. Como isso funciona num SaaS profissional hoje
Modelo recomendado:
```text
Platform Admin
  -> cria conta do cliente
  -> configura branding
  -> configura integrações
  -> cria usuário(s) do cliente
  -> vincula usuários à conta

Cliente
  -> faz login
  -> acessa somente sua conta
  -> vê marca, logo, cores e dados já configurados
  -> edita apenas dados operacionais permitidos
```

4. Plano de implementação
Fase 1 — Corrigir o conceito sem quebrar o sistema
- Padronizar a linguagem da UI:
  - trocar textos “clínica” por “loja”, “empresa” ou “conta”;
  - manter `clinics` no banco apenas como nome técnico interno por enquanto.
- Revisar telas admin e CRM para usar o mesmo conceito visual.
- Resultado: o sistema para de parecer “adaptado de clínica”.

Fase 2 — Separar o que é configuração do dono da plataforma vs do cliente
- Dividir Configurações em 2 níveis:
  - Configurações da Conta/Tenant: somente `platform_admin`
  - Configurações Operacionais: cliente pode acessar
- Mover White Label para uma área exclusiva do admin.
- Bloquear completamente a aba White Label para usuários do cliente.
- Bloquear criação/edição de equipe para perfis sem permissão adequada.

Fase 3 — Persistência profissional do white label
- Parar de usar `localStorage` como fonte de verdade do branding.
- Salvar tudo no banco ligado ao tenant (`clinics` ou uma nova tabela dedicada de branding).
- Manter no front apenas cache temporário de leitura, nunca autoridade de gravação.
- Itens persistidos:
  - nome da marca
  - subtítulo
  - logo
  - favicon
  - cor primária
- Resultado: quando você alterar, o CRM do cliente atualiza para todos os usuários daquela conta.

Fase 4 — Modelo de acesso profissional
- Manter login por usuário no Supabase Auth.
- Cada usuário continua ligado à conta via `user_roles`.
- Regras:
  - `platform_admin`: administra tudo
  - `clinic_owner`: dono/gestor da conta do cliente
  - `clinic_staff`: equipe
  - `clinic_receptionist`: operacional
- Ajustar UI para o cliente nunca “escolher tenant” se ele só tem uma conta.
- Se você impersonar uma conta no admin, vê exatamente o CRM daquele cliente.

Fase 5 — Organizar a relação entre CRM principal e módulo `lojas`
Há 2 caminhos, e eu recomendo o A:
- A) Profissional e incremental:
  - `clinics` continua sendo a conta do cliente
  - `lojas` vira submódulo/unidade/canal comercial dentro da conta
  - ex.: cliente pode ter uma loja/canal WhatsApp vinculado à conta
- B) Refatoração pesada:
  - renomear tudo no banco de `clinics` para `accounts`/`tenants`
  - mais limpo, porém mais arriscado agora
Recomendação: implementar A primeiro, porque resolve o produto sem quebrar a base.

5. O que vai mudar na experiência real
Para você:
- entra como admin
- cria a conta do cliente
- configura logo, cor, nome e integrações
- cria o login do cliente
- vincula o cliente à conta correta

Para o cliente:
- recebe login e senha
- entra no CRM
- já vê o sistema com a identidade que você configurou
- não vê a área sensível de white label
- só altera o que for operacional

6. Resposta direta às suas perguntas
- “Da onde vem clinics?”
  - do modelo original do sistema. Hoje é a tabela-mãe do tenant.
- “Ele deveria ver essas configs?”
  - não. White label e setup da conta devem ficar só com você/admin.
- “Se eu configurar, atualiza no CRM dele?”
  - sim, desde que a configuração saia do `localStorage` e fique centralizada no banco como fonte oficial.
- “Precisa repensar tudo?”
  - sim, mas sem reescrever tudo do zero. O caminho profissional é reorganizar a arquitetura atual em camadas claras.

7. Entregáveis que eu implementaria
- Bloqueio de White Label para não-admin
- Separação entre “Configuração da Conta” e “Configuração Operacional”
- Persistência real de branding no banco
- Padronização de nomenclatura da interface
- Revisão do fluxo admin -> criar conta -> criar usuário -> vincular acesso
- Ajuste das permissões para o cliente nunca mexer no que é estratégico da plataforma

8. Detalhes técnicos
Arquitetura alvo:
```text
auth.users
  -> profiles
  -> user_roles (user_id, role, clinic_id)

clinics
  -> tenant principal da conta do cliente
  -> guarda identidade e configurações da conta

lojas
  -> módulo/unidade/canal ligado a clinic_id
  -> usado para catálogo, leads, WhatsApp, visitas
```

Problemas atuais identificados no código:
- `WhiteLabelContext` lê `clinics`, mas também salva em `localStorage`
- `Settings.tsx` mostra aba White Label para qualquer usuário autenticado
- várias telas dependem de `clinicId`, provando que `clinics` é o tenant real
- `manage-team` só permite `platform_admin`, então falta uma política de gestão mais refinada para donos da conta

9. Ordem recomendada de execução
1. Corrigir permissões do White Label
2. Centralizar branding no banco
3. Renomear textos da UI para “loja/conta”
4. Separar settings admin vs settings do cliente
5. Revisar fluxo de criação de conta e usuários
6. Depois decidir se vale renomear `clinics` tecnicamente no banco

Resultado esperado
- produto com aparência e arquitetura de SaaS profissional
- você controla setup e identidade do cliente
- cliente acessa apenas o CRM dele
- mudanças feitas por você refletem automaticamente na conta dele
- sem confusão entre admin da plataforma e usuário do cliente
