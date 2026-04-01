
Objetivo: corrigir os 2 problemas juntos:
1. a dashboard mostra uma “loja” mas `/admin/lojas` fica vazia
2. o usuário `teste@gmail.com` entra, mas o app cliente trata como sem acesso/liberação

Diagnóstico confirmado
- Hoje existem dados em `public.clinics`:
  - `Conforto` com `owner_email = teste@gmail.com`
- Mas não existe registro correspondente em `public.lojas`.
- O admin dashboard está chamando isso de “loja”, porém na prática ele lista `clinics`, não `lojas`.
- A página `/admin/lojas` consulta `public.lojas`, por isso aparece vazia.
- No auth, `admin@gmail.com` tem `platform_admin`, mas `teste@gmail.com` não tem linha em `public.user_roles`.
- Sem `user_roles.clinic_id`, o app não resolve `activeClinicId`; por isso cai na tela de “Conta sem acesso liberado”.
- Mesmo quando existir clínica, as páginas do app cliente dependem de `activeLojaId`; se não houver loja vinculada à clínica, o usuário entra e continua sem operação real.

O que vou ajustar
1. Corrigir a origem dos dados no admin
- Parar de misturar “clínica/conta” com “loja operacional”.
- Ajustar o `AdminDashboard` para rotular corretamente o que vem de `clinics`.
- Se houver resumo de operação, separar visualmente:
  - Contas/tenants (`clinics`)
  - Lojas operacionais (`lojas`)

2. Corrigir `/admin/lojas`
- Fazer a página refletir a realidade do banco:
  - mostrar lojas reais de `public.lojas`
  - deixar explícito quando uma conta existe mas ainda não tem loja operacional
- Opcionalmente cruzar `clinics` + `lojas` para exibir “Conta sem loja criada” em vez de parecer que sumiu tudo.

3. Corrigir o provisionamento de acesso do cliente
- Revisar o fluxo de criação no admin para garantir que, ao criar uma conta:
  - exista `user_roles` para o owner
  - exista `clinic_id` vinculado corretamente
- Revisar o edge function `manage-team` no fluxo atual para evitar conta criada sem role.

4. Backfill dos dados já quebrados
- Criar plano de reparo para os registros existentes:
  - vincular `teste@gmail.com` à clínica `Conforto` em `user_roles`
  - criar a `loja` operacional ausente para essa clínica, se esse for o comportamento esperado do produto
- Isso corrige o estado atual sem depender só de novos cadastros.

5. Endurecer o acesso no frontend
- Ajustar `AuthContext` e guards para separar claramente:
  - usuário autenticado
  - usuário com clínica vinculada
  - usuário com loja operacional ativa
- Evitar mensagem genérica de “sem login” quando na verdade falta vínculo de role/loja.
- Gatilhar queries do app cliente somente quando auth e contexto operacional estiverem prontos.

Resultado esperado
- `/admin` não vai mais sugerir que existe “loja” quando só existe `clinic`.
- `/admin/lojas` vai mostrar corretamente a loja criada, ou indicar claramente que a conta ainda não tem loja operacional.
- `teste@gmail.com` vai entrar no sistema com vínculo válido.
- O app cliente vai deixar de parecer “deslogado” quando o problema real for ausência de vínculo operacional.

Arquivos e áreas a revisar
- `src/pages/AdminDashboard.tsx`
- `src/pages/AdminLojas.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `supabase/functions/manage-team/index.ts`
- banco:
  - `public.user_roles`
  - `public.clinics`
  - `public.lojas`

Detalhes técnicos
```text
Estado atual:
clinics: 1 registro (Conforto)
lojas: 0 registros
user_roles:
- admin@gmail.com -> platform_admin
- teste@gmail.com -> sem role

Efeito:
AdminDashboard lê clinics -> parece haver "loja"
AdminLojas lê lojas -> vazio
Auth do cliente depende de role + clinic_id -> falha
Páginas operacionais dependem de activeLojaId -> falham também
```

Implementação proposta
1. alinhar nomenclatura e fonte de dados no dashboard admin
2. corrigir a modelagem exibida em `/admin/lojas`
3. reparar o provisionamento de owner/role
4. aplicar backfill dos registros existentes
5. reforçar os guards de auth/contexto operacional

Validação
- Logar com `admin@gmail.com`
- Verificar `/admin` e `/admin/lojas` com dados consistentes
- Logar com `teste@gmail.com`
- Confirmar que não cai mais em “Conta sem acesso liberado”
- Abrir dashboard, leads, catálogo e follow-ups do app cliente
- Confirmar que o contexto operacional da loja está resolvido sem parecer logout
