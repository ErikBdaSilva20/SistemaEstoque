# P0 — Bloqueadores

Nada de negócio pode começar antes que estes itens tenham story de execução aprovado.
Cada um viola o contrato do hub de forma que impede o template de rodar.

---

### `@supabase/supabase-js` no cliente

- **Onde:** `src/integrations/supabase/client.ts`, `src/integrations/supabase/client.server.ts`, `src/integrations/supabase/auth-attacher.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/integrations/supabase/types.ts`, `types.relaxed.ts`, e ~40 arquivos em `src/hooks/*` e `src/contexts/*` e `src/components/*` que importam de `@/integrations/supabase/client`.
- **Categoria:** DESCARTAR (arquivos de integração) + REESCREVER (todos os consumidores para `db`/`auth` do gateway).
- **Regra violada:** §B3 — "Proibido: Supabase, Firebase, ORM no browser". §B5 — dados só via `db`.
- **Ação:** apagar `src/integrations/supabase/`. Copiar `src/lib/data/client.ts` do scaffold `wiki`. Reescrever cada consumidor para usar `src/lib/data/*.repo.ts`.
- **Story vinculado:** `stories/v1/003-camada-dados-db.md` (introduz `db`), depois cada story de domínio migra seu hook.

---

### TanStack Start (framework de servidor)

- **Onde:** `src/main.tsx` (se importa `@tanstack/react-start`), `src/integrations/supabase/auth-attacher.ts` (`createMiddleware({ type: 'function' })`), `src/integrations/supabase/client.server.ts`, provavelmente `src/start.ts`, `vite.config.ts` (plugin), `package.json` deps.
- **Categoria:** DESCARTAR.
- **Regra violada:** §B3 — "Sem Next.js / SSR". §B1 — "SPA estático".
- **Ação:** trocar por Vite 6 + `react-router-dom` 7 + `BrowserRouter`. `main.tsx` puro React.
- **Story vinculado:** `stories/v1/001-bootstrap-stack.md`.

---

### Edge Functions (13 funções em `supabase/functions/`)

- **Onde:** `supabase/functions/{admin-api-keys, admin-audit, admin-delete-user, admin-integrations, ai-chat, ai-suggest-reorder, barcode-lookup, check-user-active, notify-low-stock, notify-purchase-flow, push-inventory, sale-webhook, send-quote-request, validate-signup}/index.ts`.
- **Categoria:** DESCARTAR (todas). 8 renascem como EXTENSÃO GATEWAY em Onda 2.
- **Regra violada:** §B1/§B3 — "NÃO existe backend por app".
- **Ação:** apagar `supabase/functions/`. Remover `invokeEdge`, `useBarcodeLookup`, `AiChatDrawer`, `AiReorderDialog`, `AiUsagePanel`, `IntegrationsPanel`, `HealthCheckPanel`, `SecuritySettings`, `ApiKeysSettings`, `AuditPanel` (v1).
- **Story vinculado v1:** `stories/v1/003-camada-dados-db.md` (remove `edge-fn.ts`). **Extensões:** ext-003 a ext-008.

---

### RLS e `auth.uid()` no schema

- **Onde:** todas as migrations em `supabase/migrations/*` que criam policies `USING (auth.uid() = ...)`.
- **Categoria:** DESCARTAR (as migrations inteiras) + REESCREVER (novo `0001_business_schema.sql` no Neon do tenant).
- **Regra violada:** §B4 — "SEM RLS, SEM `auth.uid()`, SEM `custom_access_token_hook`, SEM tabela `profiles`".
- **Ação:** apagar `supabase/`. Escrever única migration nova em `supabase/migrations/0001_business_schema.sql` seguindo §B4 (owner_id text, sem RLS).
- **Story vinculado:** `stories/v1/005-schema-migracao-inicial.md`.

---

### Tabelas `profiles`, `user_roles`, `user_stores`

- **Onde:** tabelas + `src/contexts/AuthContext.tsx` (`loadProfileAndRole`), `useAuth`.
- **Categoria:** DESCARTAR.
- **Regra violada:** §B4 — "SEM tabela `profiles`". §B8 — Better-Auth cuida de user/role.
- **Ação:** substituir `AuthContext` por wrapper de `auth.me()` do gateway. Papel vem no `me()`.
- **Story vinculado:** `stories/v1/004-auth-tenant-gateway.md`.

---

### `useRealtimeSync` e `supabase.channel(...)`

- **Onde:** `src/hooks/useRealtimeSync.ts`.
- **Categoria:** DESCARTAR (v1). **EXTENSÃO GATEWAY** (Onda 2).
- **Regra violada:** §A3 — realtime é extensão da fundação.
- **Ação:** apagar hook. Trocar por `staleTime` + invalidação manual + `refetchOnWindowFocus`.
- **Story vinculado:** `stories/v1/003-camada-dados-db.md` (contra-medida no cache) + `stories/gateway-extensions/ext-001-realtime.md`.

---

### `supabase.storage` (buckets `product-photos`, `purchase-documents`)

- **Onde:** `src/components/products/ProductPhotoUpload.tsx`, `src/lib/product-photo.ts`, `src/lib/image-compress.ts`, `src/hooks/usePurchaseDocuments.ts`.
- **Categoria:** DESCARTAR upload no v1. **EXTENSÃO GATEWAY** (Onda 2).
- **Regra violada:** §A3 — storage pesado é extensão.
- **Ação:** substituir por campo `foto_url text` (URL externa colada pelo usuário). Documentos de compra idem: `documento_url text`.
- **Story vinculado v1:** `stories/v1/006-produtos-crud.md` (usa URL), `stories/v1/011-purchase-orders.md`. **Extensão:** `ext-002-storage-uploads.md`.

---

### `supabase.rpc(...)` (funções SQL server-side)

- **Onde:** `next_purchase_order_code`, `submit_purchase_order`, `approve_purchase_order`, `reject_purchase_order`, `convert_quote_to_purchase_order`, `receive_purchase_order_items`, e outras chamadas via `supabase.rpc()` no código de compras.
- **Categoria:** REESCREVER como lógica no front (transições de estado, cálculos) OU EXTENSÃO GATEWAY (atomicidade real).
- **Regra violada:** §B5 — modo genérico só tem `list/create/update/remove`.
- **Ação:** transições de status viram `update({ status: 'aprovado' })`. Geração de código sequencial vira contador front + `unique(codigo)` + retry (ver ADR-006). Conversão RFQ→PO vira operação composta de `list()` + `create()` no front.
- **Story vinculado:** `stories/v1/010-quotes-rfq.md`, `stories/v1/011-purchase-orders.md`, `stories/v1/012-recebimento-e-kardex.md`.

---

### Vault (secrets)

- **Onde:** referências a `vault.decrypted_secrets` nas edge functions (`admin-integrations`, `sale-webhook`, `push-inventory`, `ai-chat`).
- **Categoria:** DESCARTAR.
- **Regra violada:** §B1 — sem backend por app; secrets vivem no gateway/Composio.
- **Ação:** remover. Toda integração que precisa de secret vira extensão de gateway.
- **Story vinculado:** as extensões `ext-003` a `ext-007`.

---

### Nome de tabela reservado

- **Onde:** o projeto atual não usa `user/session/account/verification/organization/member/invitation` como tabela de negócio hoje (usa `profiles`), então **não há colisão direta**. Manter alerta ao renomear.
- **Categoria:** MANTER (só validar no story 005).
- **Regra violada:** §B4 (nomes proibidos).
- **Ação:** revisar a nova migration antes de aplicar. Nenhum rename para `member` ou `organization`.
- **Story vinculado:** `stories/v1/005-schema-migracao-inicial.md`.
