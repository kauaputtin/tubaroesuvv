# Tubarões UVV — e-commerce oficial

Loja virtual full-stack da Atlética Tubarões UVV. O projeto combina uma vitrine mobile-first com checkout sem cadastro, pagamentos via Mercado Pago, reserva transacional de estoque e um painel administrativo protegido pelo Supabase Auth.

## O que está implementado

### Loja pública

- Página inicial responsiva com hero, categorias, destaques, promoções, benefícios, FAQ e newsletter.
- Catálogo dinâmico, busca, filtros, ordenação, categorias e páginas individuais de produto.
- Produtos com galeria, preço promocional, SKU, estoque e opções obrigatórias.
- Carrinho persistido no `localStorage`, com limite de estoque, alteração de quantidade, remoção e cupom.
- Checkout sem conta com React Hook Form + Zod, validação de CPF, telefone, curso, consentimento e endereço condicional.
- Retirada na UVV, entrega local e envio para endereço, configuráveis no painel.
- PIX com QR Code, copia e cola, validade e consulta automática de status.
- Cartão tokenizado pelo Card Payment Brick oficial do Mercado Pago. Número e CVV não passam pelo servidor da loja.
- Acompanhamento por token aleatório de 256 bits + e-mail; nunca por número sequencial isolado.
- Páginas de pagamento pendente, aprovado e recusado, além das políticas institucionais.
- Sitemap, robots, metadados sociais, estados de loading, erro e 404.

### Painel `/admin`

- Login com Supabase Auth e autorização por papéis/permissões.
- Visão geral com faturamento, pedidos, ticket médio, pendências, gráficos e estoque baixo.
- Busca, filtros, detalhe, atendimento, rastreamento, observações, cancelamento, reembolso total e exportação CSV de pedidos.
- Produtos: criar, editar, duplicar, arquivar, importar/exportar CSV, galeria de até dez imagens, opções e variações.
- Estoque: saldo físico, reservado, disponível, ajustes com motivo e histórico de movimentações.
- Categorias, cupons, cursos, modalidades de entrega, contato, aparência e seções da home.
- Perfis: Administrador geral, Gerente, Atendimento, Estoque e Financeiro.
- Auditoria das ações administrativas mais sensíveis.
- Botão “Visualizar loja” abre a vitrine em nova aba.

### Banco e segurança

- Migration PostgreSQL com todas as tabelas, enums, índices, constraints, triggers, views e seeds.
- RLS em todas as tabelas e políticas públicas restritas ao catálogo publicado.
- `service_role` usada somente em Route Handlers do servidor.
- CPF armazenado apenas como hash SHA-256 + quatro últimos dígitos. O CPF completo é usado na memória da requisição para o gateway e não é persistido.
- Preços, cupons, frete e estoque recalculados no banco; valores enviados pelo navegador são ignorados.
- Reserva de estoque com `SELECT ... FOR UPDATE`, prazo configurável, baixa no pagamento aprovado e liberação em cancelamento/expiração.
- Webhook Mercado Pago com HMAC, janela de cinco minutos, consulta do pagamento no provedor e evento idempotente.
- Chaves únicas impedem baixa duplicada de estoque, pagamento duplicado e movimentação repetida.
- Rate limit em login, checkout, newsletter e consulta de pedido.
- Job Vercel a cada dez minutos para liberar reservas expiradas.

## Stack

- Next.js 16 com App Router, React 19 e TypeScript strict
- Tailwind CSS 4
- Supabase PostgreSQL, Auth e Storage
- Mercado Pago Node SDK + React SDK/Bricks
- React Hook Form, Zod, Recharts e Lucide
- Vitest e pgTAP

## Requisitos

- Node.js 20.9 ou mais recente — o projeto foi validado com Node 24.
- npm 10 ou mais recente.
- Um projeto Supabase.
- Uma aplicação Mercado Pago com credenciais de teste.
- Supabase CLI + Docker apenas para executar o banco local e os testes pgTAP.

## Instalação local

```bash
npm install
```

Copie o arquivo de ambiente:

```powershell
Copy-Item .env.example .env.local
```

Preencha `.env.local` e inicie:

```bash
npm run dev
```

A loja abre em `http://localhost:3000` e o painel em `http://localhost:3000/admin`.

Sem credenciais, a vitrine usa o catálogo demonstrativo local. Por segurança, o botão de pagamento retorna uma mensagem clara de configuração pendente e nunca simula aprovação.

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Copie a URL, chave `anon` e chave `service_role` para `.env.local`.
3. Vincule o projeto e aplique a migration:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

São duas migrations, aplicadas nesta ordem:

| Arquivo | O que faz |
|---|---|
| [202608150001_initial_schema.sql](supabase/migrations/202608150001_initial_schema.sql) | schema, RLS, bucket `product-images`, funções transacionais e dados iniciais |
| [202608160001_cpf_sem_texto_puro.sql](supabase/migrations/202608160001_cpf_sem_texto_puro.sql) | `create_pending_order` passa a receber `cpf_hash` + `cpf_last4` prontos; o CPF cru nunca chega ao banco |
| [202608160002_view_e_funcoes_expostas.sql](supabase/migrations/202608160002_view_e_funcoes_expostas.sql) | `admin_dashboard_summary` com `security_invoker`; funções auxiliares fora do alcance do `anon` |

> **RLS ligada na tabela não cobre a view.** `admin_dashboard_summary` rodava
> com os privilégios do dono (`postgres`) e entregava o faturamento a qualquer
> visitante com a chave publicável, mesmo com `orders` protegida. Ao criar view
> nova sobre tabela com RLS, use `with (security_invoker = on)`.
>
> **Revoke de função:** no Postgres o EXECUTE nasce concedido a `PUBLIC`, e
> `anon`/`authenticated` herdam. `revoke ... from anon` sozinho não fecha nada;
> é preciso `revoke ... from public` e devolver o grant a quem precisa.

> **`CPF_HASH_KEY` é obrigatória.** O hash do CPF é um HMAC calculado no servidor
> com essa chave. SHA-256 sem segredo não protegeria nada aqui: o CPF tem cerca
> de 10⁹ valores válidos, e uma tabela com todos eles se gera em minutos. Se a
> chave mudar, os hashes antigos deixam de casar — trate como segredo
> permanente e guarde uma cópia.

### Primeiro administrador

Crie o usuário em **Supabase Dashboard → Authentication → Users → Add user**. Copie o UUID e execute no SQL Editor, substituindo os valores:

```sql
insert into public.profiles (id, full_name)
values ('UUID_DO_USUARIO', 'Nome do administrador');

insert into public.admin_users (user_id, role_id)
select 'UUID_DO_USUARIO', id
from public.roles
where name = 'Administrador geral';
```

O usuário já pode entrar em `/admin/login` com o e-mail e a senha definidos no Auth.

### Teste local do banco

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

O arquivo [database.test.sql](supabase/tests/database.test.sql) verifica schema, funções de pedido, estoque e chaves de idempotência.

## Configuração do Mercado Pago

1. Em **Suas integrações**, crie ou abra uma aplicação de Checkout Transparente/Bricks.
2. Comece pelas credenciais de teste:
   - `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`: chave pública usada exclusivamente pelo Brick no navegador.
   - `MERCADO_PAGO_ACCESS_TOKEN`: token privado usado apenas no servidor.
3. Cadastre a URL de webhook:

```text
https://SEU-DOMINIO/api/webhooks/mercado-pago
```

4. Ative notificações de **Pagamentos** e copie a chave secreta para `MERCADO_PAGO_WEBHOOK_SECRET`.
5. Use usuários e cartões de teste do Mercado Pago. Não use dados reais no sandbox.
6. Antes de produção, troque todas as credenciais `TEST-` pelas credenciais produtivas, confirme o domínio e faça uma compra real de baixo valor.

O backend cria a cobrança com uma chave de idempotência própria. Para PIX, salva somente os identificadores e dados operacionais da cobrança. Para cartão, recebe somente o token gerado pelo Brick.

## Reserva de estoque

Ao criar o pedido, a função `create_pending_order`:

1. bloqueia as linhas dos produtos;
2. revalida estoque, preço, cupom e frete;
3. cria cliente, endereço, pedido e snapshots dos itens;
4. aumenta `reserved_stock`;
5. registra a movimentação e a validade da reserva.

O webhook aprovado converte a reserva em venda. Cancelamentos e recusas liberam a reserva. O Cron chama `release_expired_reservations` para pedidos vencidos.

Na Vercel, defina `CRON_SECRET`. A plataforma envia automaticamente `Authorization: Bearer <CRON_SECRET>` ao job configurado em [vercel.json](vercel.json).

## Deploy na Vercel

1. Importe este repositório na Vercel.
2. Cadastre todas as variáveis de `.env.example` em **Project Settings → Environment Variables**.
3. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final, sem barra no fim.
4. Faça o deploy.
5. Atualize a URL do webhook no Mercado Pago.
6. Confirme no Supabase que a URL do site e as Redirect URLs incluem o domínio da Vercel.
7. Execute uma compra PIX e uma compra por cartão no sandbox antes de ativar produção.

O build padrão é:

```bash
npm run build
npm run start
```

## Administração diária

- **Produtos:** `/admin/produtos` — catálogo, preços, publicação, opções e variações.
- **Estoque:** `/admin/estoque` — ajustes sempre exigem um motivo.
- **Pedidos:** `/admin/pedidos` — status de pagamento e atendimento são separados.
- **Cupons:** `/admin/cupons` — percentual, valor fixo, limites, datas e frete grátis.
- **Aparência:** `/admin/aparencia` — rascunho e publicação de identidade/seções.
- **Configurações:** `/admin/configuracoes` — contato, cursos e recebimento.
- **Usuários:** `/admin/usuarios` — associe um usuário já criado no Supabase Auth a um papel.

Os preços dos seeds são demonstrativos e devem ser revisados antes da produção. Atualize também WhatsApp, e-mail, horários, políticas e taxas.

## CSV de produtos

O importador aceita até 500 linhas e 2 MB. Colunas mínimas:

```csv
name,slug,sku,price,stock,cost,minimum_stock,main_image_url,active
```

Campos que contêm vírgula devem ser evitados no importador simples ou normalizados antes do envio. A exportação gera UTF-8 com BOM, compatível com Excel.

## Scripts de qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Validação local mais recente:

- ESLint: aprovado sem erros.
- TypeScript strict: aprovado.
- Vitest: 3 arquivos e 13 testes aprovados.
- Next.js production build: aprovado; 39 rotas geradas.

## Estrutura principal

```text
src/
  app/
    (store)/                 loja pública
    (auth)/admin/login/      autenticação administrativa
    (dashboard)/admin/       painel protegido
    api/                     checkout, status, webhook, cron e CSV
  components/                UI pública e administrativa
  lib/                       catálogo, validação, checkout e integrações
supabase/
  migrations/                schema, RLS, funções e seeds
  tests/                     testes pgTAP
public/
  assets/                    logo oficial e hero original
  products/                  imagens de demonstração
```

## Segredos e produção

- Nunca envie `.env.local` ao Git.
- Nunca use `SUPABASE_SERVICE_ROLE_KEY` ou `MERCADO_PAGO_ACCESS_TOKEN` em componentes client.
- Nunca registre payloads de checkout com CPF, token de cartão ou segredos.
- Configure alertas e retenção de logs na plataforma de hospedagem.
- Para rate limit distribuído em alto volume, substitua o mecanismo em memória por Redis/KV mantendo a mesma interface.
- Configure backup, PITR e políticas de retenção no Supabase conforme a operação.

## Identidade e assets

A logo em `public/assets/logo-tubaroes.png` foi obtida da loja oficial indicada como referência e não foi redesenhada. O hero `public/assets/hero-ocean.png` é uma arte original gerada especificamente para este projeto, sem texto ou marca incorporada.
