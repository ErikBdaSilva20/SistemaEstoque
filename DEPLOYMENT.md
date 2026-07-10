# Deploy — Compras & Estoque

Guia operacional pra provisionar um **novo tenant** (cada cliente tem seu próprio Supabase). Vai do zero à primeira tela em ~20 minutos.

---

## 1. Pré-requisitos

- Conta [Supabase](https://supabase.com) com organização criada
- Conta [Lovable](https://lovable.dev) (pra Remix do frontend) — ou ambiente de build próprio (`npm ci && npm run build` + qualquer static host)
- Node 20+ localmente pra rodar migrações via CLI (opcional; a MCP do Supabase também aplica)

---

## 2. Criar projeto Supabase

1. Dashboard → New project → região `sa-east-1` (São Paulo) → plano Pro.
2. Anote `project_ref` e a **anon public key** — ela é pública (vai no bundle).
3. Em **Auth → Providers → Email**: ative, desative "Confirm email" se quiser onboarding mais rápido (pode reativar depois).
4. Em **Auth → URL Configuration**: adicione o domínio final em "Site URL" e "Redirect URLs".

---

## 3. Aplicar o schema

Do repo:

```bash
# opção A — CLI Supabase
supabase link --project-ref <project_ref>
supabase db push

# opção B — pelo dashboard (SQL Editor)
# execute cada arquivo de supabase/migrations/ em ordem alfabética
```

As migrações já criam:

- Enums: `app_role`, `integration_type`, `movement_origin`, `movement_type`, `purchase_order_status`, `purchase_document_type`, `quote_request_status`, `approval_decision`
- Tabelas: profiles, user_roles, project_config, products, suppliers, purchase_orders/items, stock_movements, locations, product_batches, quote_requests/items/responses/suppliers, purchase_approvals, purchase_rules, purchase_documents, webhook_events, api_keys, integrations, external_product_mappings, ai_audit_log, notification_log
- Vault RPCs: `vault_insert_api_key`, `vault_read_api_key`, `vault_delete_api_key`
- Buckets Storage: `product-photos` (privado), `purchase-documents` (privado)
- RPCs de negócio: `next_purchase_order_code` (sequence), `submit/approve/reject_purchase_order`, `convert_quote_to_purchase_order`, `low_stock_products`, `handle_new_user`

---

## 4. Configurar env vars do frontend

`src/integrations/supabase/client.ts` lê de `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Copie `.env.example` pra `.env` e preencha com os valores do projeto Supabase do tenant. Ambas são seguras pro bundle (anon key é pública por design).

---

## 5. Deploy das Edge Functions

São 13 funções. A forma canônica é `supabase functions deploy` pra cada uma, OU usar a MCP do Supabase:

```
admin-api-keys       admin-audit          admin-delete-user
admin-integrations   ai-chat              ai-suggest-reorder
barcode-lookup       check-user-active    notify-low-stock
push-inventory       sale-webhook         send-quote-request
validate-signup
```

**`verify_jwt=false`** em duas funções (públicas por design): `sale-webhook` (autentica via `X-Webhook-Secret`) e `validate-signup` (chamada antes do usuário existir no Auth). Todas as outras têm `verify_jwt=true`.

Deploy canônico deste projeto é **pelo Lovable Cloud** — peça via prompt ("deploy edge function X") ou use o CLI:

```bash
for f in supabase/functions/*/; do
  name=$(basename "$f")
  if [ "$name" = "sale-webhook" ] || [ "$name" = "validate-signup" ]; then
    supabase functions deploy "$name" --no-verify-jwt
  else
    supabase functions deploy "$name"
  fi
done
```

---

## 6. Secrets de Edge Functions (obrigatórias)

Supabase Dashboard → Edge Functions → Secrets. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já vêm automáticos. Nenhuma outra secret é obrigatória **pra subir a aplicação** — todas as integrações usam o Vault via `admin-integrations` e são configuradas pelo admin da conta no onboarding.

**Opcional** (atalhos pra dev/debug):

| Secret              | Pra quê                                                 |
| ------------------- | ------------------------------------------------------- |
| `COSMOS_TOKEN`      | Fallback caso o admin ainda não tenha cadastrado via UI |
| `COSMOS_USER_AGENT` | Customiza User-Agent enviado ao Cosmos                  |
| `OFF_USER_AGENT`    | Customiza User-Agent pro Open Food Facts                |

---

## 7. Build + host do frontend

```bash
npm ci
npm run build
# dist/ pronto; suba em Lovable, Vercel, Netlify, Cloudflare Pages etc.
```

Lovable Remix: fork → publicar no domínio final. PWA já configurado (`manifest.webmanifest`, service worker).

---

## 8. Primeiro login

1. Abra `/auth?tab=signup` e crie a primeira conta. **O primeiro usuário vira `admin` automaticamente + `is_approved=true`** (trigger `handle_new_user`).
2. Logue → vai cair no onboarding modal (9 passos, todas opcionais). Cada step tem botão "Como obter?" com guia passo-a-passo pra quem nunca configurou o provider.
3. Configure apenas o que o cliente usa.

---

## 9. Integrações (configuradas pelo admin no app, não aqui)

| Integração          | Onde                          | Provider                                     |
| ------------------- | ----------------------------- | -------------------------------------------- |
| IA (reorder + chat) | Configurações → API keys      | Anthropic Claude                             |
| Scan de barras      | Onboarding / Integrações      | Cosmos Bluesoft + Open Food Facts            |
| Webhook de vendas   | Integrações → Webhook         | Shopify-compatible (Stripe, Hotmart, custom) |
| WhatsApp            | Integrações → WhatsApp        | Evolution API (self-host ou SaaS)            |
| Email               | Integrações → Email           | Resend                                       |
| Sync ERP            | Integrações → Shopify / Bling | Shopify Admin / Bling v3                     |

---

## 10. Checklist final antes de entregar pro cliente

- [ ] Migrations aplicadas (olhe `supabase/migrations/` count vs dashboard → Database → Migrations)
- [ ] 13 edge functions ACTIVE (Dashboard → Edge Functions)
- [ ] Buckets `product-photos` e `purchase-documents` criados, ambos `public=false`
- [ ] `client.ts` aponta pro projeto correto
- [ ] CORS liberado no dashboard pra domínio do frontend
- [ ] Primeiro usuário criado (vira admin)
- [ ] Onboarding percorrido até "Tudo pronto!"
- [ ] Domínio custom configurado no host do frontend

---

## 11. Backups e DR

Supabase Pro tem PITR de 7 dias automático. Pra cliente crítico:

- Dump semanal: `pg_dump` via GitHub Action scheduled (use `DATABASE_URL` como secret no workflow).
- Fotos e documentos: buckets Storage não estão no `pg_dump` — rode `supabase storage cp` pra S3 separado se precisar.

---

## 12. Monitoring / troubleshooting rápido

- **Logs**: Dashboard → Logs → filter por function name.
- **Erros recorrentes**: `ai_audit_log`, `notification_log`, `webhook_events.errors` — três tabelas que já coletam falhas.
- **Estoque zerou sozinho?** `SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 20;`
- **Webhook duplicado?** `SELECT * FROM webhook_events WHERE external_order_id = ?;` — idempotência já trata, mas dá pra inspecionar.

---

## 13. Limites conhecidos (não bloqueiam piloto)

- Dashboard/Reports puxam tabela inteira de produtos+movimentos pro browser — começa a travar >1k SKUs. Fix planejado: views materializadas.
- "Scan offline" só cacheia assets do PWA; leituras sem rede não enfileiram (IndexedDB queue planejada).
- LGPD: sem export/exclusão automáticos de dados, sem política pública. Adicionar antes de comercializar pra PMEs que exigem conformidade ANPD.
- Testes automatizados: só smoke manual em `scripts/smoke.mjs`. Sem regressão gate.
