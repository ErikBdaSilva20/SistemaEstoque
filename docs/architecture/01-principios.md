# Princípios não-negociáveis

Fonte: [`../reference/Importantdoc.md`](../reference/Importantdoc.md) §B1–B4, B8, checklist final.

Estes princípios são **absolutos**. Toda decisão de arquitetura, todo story, toda linha
de código do remix deve poder ser justificada por um deles. Quando um princípio conflitar
com uma feature existente do projeto atual, **o princípio vence** — a feature vira
extensão de gateway ou é descartada.

## P1. O app é um SPA estático (Vite + React 19)

> "Um template é um SPA estático (Vite + React). NÃO existe backend por app." — §B1

- Sem Next.js, sem SSR/SSG, sem servidor por app.
- Build de produção: `tsc && vite build`. Zero warnings de imports não usados
  (TS strict com `noUnusedLocals`).
- Rotas com `react-router-dom` 7 e `BrowserRouter`.

## P2. O único backend é o `tenant-gateway`

> "O backend de TODOS os apps é o tenant-gateway (serviço Hono compartilhado)." — §B1

- O app **só** fala com o gateway via `db` e `auth` (importados de `src/lib/data/client.ts`).
- **Proibido:** `@supabase/*`, Firebase, `fetch` direto ao banco, driver SQL no browser,
  auth próprio.
- `client.ts` é **protegido** (contrato com o gateway) — copiado do scaffold, nunca editado.

## P3. Autorização é no gateway. Não existe RLS.

> "A autorização é no gateway (app-layer), não no banco — sem RLS." — §B1
>
> "SEM RLS, SEM `auth.uid()`, SEM `custom_access_token_hook`, SEM tabela `profiles`." — §B4

- Não escrever policies. Não usar `auth.uid()`. Não criar tabela `profiles`, `user_roles`,
  `user_stores`.
- Papéis vêm do Better-Auth (`admin` / `manager` / `rep`, + `owner` = criador da linha).
- Papel no front serve **só pra UI** (esconder botões). A segurança real está no gateway.

## P4. Toda tabela escrita pelo `rep` tem `owner_id`

> "TODA tabela que o `rep` cria/edita precisa de `owner_id` — inclusive tabelas-filhas
> (subtasks, task_comments, itens_pedido, anexos…). Esqueceu → 403 ao salvar." — §B4.1

- Formato exato: `owner_id text not null references "user"(id) on delete cascade`.
- É **`text`** (id do Better-Auth), não `uuid`, **não** `references auth.users`.
- `"user"` **entre aspas** — é palavra reservada no Postgres.
- Índice: `create index if not exists idx_<tabela>_owner on <tabela>(owner_id)`.
- **O front NUNCA envia `owner_id`.** O gateway seta a partir da sessão.
- Exceção única: tabelas puramente lookup (status, categorias, temas). Read-only para `rep`.

## P5. Convenções de schema

> "`snake_case` minúsculo. Regex: `^[a-z_][a-z0-9_]*$`." — §B4

- Nomes de tabela e coluna: `snake_case`, minúsculo, começa com letra ou `_`.
- **Proibidos** (reservados ao auth): `user, session, account, verification, organization,
  member, invitation`.
- `id uuid primary key default gen_random_uuid()`.
- `created_at timestamptz not null default now()` + `updated_at timestamptz` com trigger
  `touch_updated_at`.

## P6. API de dados é plana e genérica

> "Só `list/create/update/remove`. As telas fazem list-then-find/filter no front.
> Não desenhe telas que dependam de `GET /data/:table/:id`. Joins ricos não existem." — §B5

- Endpoints do gateway: `GET/POST/PATCH/DELETE /data/:table`.
- **Não há** get-by-id, filtro por query, ordenação servidor-side, paginação nativa,
  joins.
- Padrão: `list()` → cache no React Query → `.find()` / `.filter()` no cliente.
- Para relação (ex: nome do fornecedor num pedido): **modele plano** (denormalize o texto)
  ou faça 2 queries no front.

## P7. Página pública sem login é extensão do gateway

> "O `/data/:table` exige sessão. Rotas públicas são rota explícita no gateway." — §B6

- v1 do remix não terá superfície pública. Toda tela exige sessão Better-Auth.

## P8. Realtime, webhook, cron, IA, storage, integração externa → extensão

> "Se você precisa de um servidor que faça X quando o usuário não está olhando,
> é extensão de fundação, não template." — §A3

- Ver `stories/gateway-extensions/` para cada caso mapeado (webhook de vendas, WhatsApp,
  Email, IA, cron, storage, barcode lookup, push inventory).
- Nada disso entra no v1.

## P9. Manifest e arquivos protegidos

> "engine sempre `vite-react-gateway`; envContract sempre `[\"VITE_GATEWAY_URL\"]`." — §B7

Protegidos (nunca editáveis pela IA nem por refatoração manual):

- `src/lib/data/client.ts`
- `src/lib/data/types.gen.ts`
- `src/components/registry.tsx`
- `src/main.tsx`
- `supabase/migrations/**` (migrations do Neon do tenant)
- No scaffold **wiki**: adicionalmente `src/components/ui/**`, `src/lib/utils.ts`,
  `vite.config.ts`, `components.json`, `preview-fixtures.ts`.

## P10. Licença e crédito

- Se copiar markup de OSS de terceiros, licença deve ser permissiva (MIT/Apache/BSD/MPL)
  e crédito vai em `THIRD_PARTY.md`.
- No caso deste remix, o "OSS" é o próprio projeto atual (do usuário) → sem obrigação de
  crédito, mas manter a nota histórica ajuda auditoria.
