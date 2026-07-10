# Smoke test

Valida end-to-end se o Supabase do cliente está correto:
migrations aplicadas, edge functions deployadas, RLS ok, triggers
funcionando, integrações configuradas.

## CLI

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_ANON_KEY=eyJ... \
TEST_EMAIL=admin@empresa.com \
TEST_PASSWORD='senha123' \
npm run smoke
```

Ou com um arquivo `.env.test` (não commitar):

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
TEST_EMAIL=admin@empresa.com
TEST_PASSWORD=senha123
```

```bash
node --env-file=.env.test scripts/smoke.mjs
```

## In-app

Como alternativa (ou pro cliente final validar), há uma versão visual em
**`/settings/health`** (admin only). Clica em "Rodar todos" e vê o resultado
de cada check em tempo real.

## O que o teste cobre

- ✅ Auth (login, profile, role admin)
- ✅ Schema: 19 tabelas + view `v_expiring_batches`
- ✅ RPC: `next_purchase_order_code`, `has_role`
- ✅ CRUD: supplier + product + movement (valida trigger `recalc_stock_on_movement` + `stock_by_location`)
- ✅ Edge functions: `admin-audit`, `admin-integrations`, `admin-api-keys`, `ai-chat`, `ai-suggest-reorder`
- ✅ Integrações: lista ativas

Testes de AI são `skipped` automaticamente se não houver chave Anthropic
configurada. Testes de integração externa (WhatsApp/Email/Shopify/Bling)
não são rodados pelo smoke — pra isso, usar o botão "Testar" dentro da UI
em `/settings/integrations`.

## Exit codes

- `0` — todos os checks passaram (ou foram skipped)
- `1` — ao menos 1 check falhou
- `2` — erro fatal (ex: credenciais inválidas)
