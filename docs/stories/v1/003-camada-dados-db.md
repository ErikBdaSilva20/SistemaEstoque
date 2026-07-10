# Story 003 — Camada de dados: `db` do gateway + React Query

**Prioridade:** P0
**Escopo:** v1
**Depende de:** 001

## Contexto
Substituir toda a camada `@/integrations/supabase/*` (client, edge invoker, realtime)
pela camada oficial do template: `src/lib/data/client.ts` do scaffold `wiki`
(que expõe `db` e `auth`).

Ver [`../../architecture/03-camada-dados.md`](../../architecture/03-camada-dados.md).

## Objetivo
Deixar o app pronto para os repos de negócio: `db` disponível, React Query configurado
com política de cache adequada à ausência de realtime.

## Fora de escopo
- Criar repos de negócio (stories 006+).
- Auth (story 004).
- Realtime (extensão).

## Regras aplicáveis (Importantdoc)
- §B5 — API de dados = `list/create/update/remove`. Sem get-by-id.
- §B5 — `client.ts` é PROTEGIDO.

## Design / Arquitetura
- `src/lib/data/client.ts` — cópia do scaffold, PROTEGIDO.
- `src/lib/data/types.gen.ts` — placeholder gerado (vazio até story 005).
- `src/lib/data/preview-fixtures.ts` — do scaffold, PROTEGIDO.
- `src/lib/query.ts` — instância do React Query:
  ```ts
  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,     // compensa ausência de realtime
        retry: 1,
      },
      mutations: { retry: 0 },
    },
  });
  ```
- `src/App.tsx` — `<QueryClientProvider client={queryClient}>` no root.

## Exemplo (antes → depois)

**Antes:**
```ts
import { supabase } from '@/integrations/supabase/client';
const { data } = await supabase.from('products').select('*');
```

**Depois:**
```ts
import { db } from '@/lib/data/client';
const data = await db.table<Produto>('produtos').list();
```

## Tarefas
- [ ] Confirmar que `src/lib/data/client.ts` vem intacto do scaffold.
- [ ] Criar `src/lib/query.ts`.
- [ ] Envolver o app com `QueryClientProvider`.
- [ ] Apagar `src/integrations/supabase/`, `src/lib/edge-fn.ts`.
- [ ] Remover deps `@supabase/*` do `package.json`.

## Definition of Done
- [ ] DoD padrão cumprido.
- [ ] `grep -r "supabase" src/` retorna 0 resultados (fora de `.legacy/`).
- [ ] `refetchOnWindowFocus: true` documentado como substituto de realtime (ADR-004).

## Riscos
- Sem realtime, dashboards defasam. Mitigar com `staleTime` curto em queries críticas
  e invalidação agressiva pós-mutation.

## Gancho de extensão
- `stories/gateway-extensions/ext-001-realtime.md` (Onda 2).
