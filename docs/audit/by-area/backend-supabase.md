# Auditoria por área — Backend Supabase

Todo o diretório `src/integrations/supabase/` é **DESCARTAR**. Substituído por `src/lib/data/`.

## Arquivos e destinos

| Arquivo | Categoria | Substituto |
| --- | --- | --- |
| `src/integrations/supabase/client.ts` | DESCARTAR | `src/lib/data/client.ts` (do scaffold `wiki`, PROTEGIDO) |
| `src/integrations/supabase/client.server.ts` | DESCARTAR | — (sem SSR) |
| `src/integrations/supabase/auth-attacher.ts` | DESCARTAR | — (Better-Auth do gateway usa cookie) |
| `src/integrations/supabase/auth-middleware.ts` | DESCARTAR | — |
| `src/integrations/supabase/types.ts` | DESCARTAR | `src/lib/data/types.gen.ts` (gerado do schema Neon) |
| `src/integrations/supabase/types.relaxed.ts` | DESCARTAR | — |
| `supabase/config.toml` | DESCARTAR | — (não há config do Neon aqui; provisionamento é do gateway) |
| `supabase/functions/**` | DESCARTAR | ver `edge-functions.md` |
| `supabase/migrations/**` | DESCARTAR | `supabase/migrations/0001_business_schema.sql` novo, único, sem RLS |
| `src/lib/edge-fn.ts` | DESCARTAR | — |
| `.env.example` (com `VITE_SUPABASE_*`) | REESCREVER | só `VITE_GATEWAY_URL` |

## `AuthContext`

`src/contexts/AuthContext.tsx` importa 4 vezes de `@/integrations/supabase/client` e chama
`supabase.auth.onAuthStateChange`, `signInWithPassword`, `signUp`, `signOut`,
`getSession`, além de `functions.invoke('check-user-active')` e `from('profiles').update()`.

**Tudo isso é reescrito** como wrapper de `auth` do gateway:

```ts
// src/lib/auth.tsx (adaptado do scaffold)
const me = await auth.me();  // { user, role }
await auth.signIn({ email, password });
await auth.signUp({ email, password, name });
await auth.signOut();
```

- Sem `is_active`, `is_approved`, `onboarding_completed` — Better-Auth resolve.
- Sem status "online/offline/away/busy" — some.
- Sem `beforeunload` marcando `offline` no profile — some.

## `StoreContext`

`src/contexts/StoreContext.tsx` inteiro **DESCARTAR** (ver ADR-003).

## `types.gen.ts` (novo)

Gerado a partir do schema Neon após rodar a migration. É PROTEGIDO. Nunca editar à mão.
No scaffold do hub, um script `pnpm gen:types` cuida disso.
