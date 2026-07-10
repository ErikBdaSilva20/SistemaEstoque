# Camada de dados: `db` do gateway

Fonte: [`../reference/Importantdoc.md`](../reference/Importantdoc.md) §B5.

## API pública

```ts
// src/lib/data/client.ts (PROTEGIDO — copiado do scaffold, não editar)
export const db = {
  table<R = any>(name: string) {
    return {
      list:   () => api<R[]>('GET',    `/data/${name}`),
      create: (input: Partial<R>) => api<R>('POST',   `/data/${name}`, input),
      update: (id: string, patch: Partial<R>) => api<R>('PATCH',  `/data/${name}/${id}`, patch),
      remove: (id: string) => api('DELETE', `/data/${name}/${id}`),
    };
  },
};
```

**É só isso.** Não existe: filtro por query, get-by-id, ordenação server-side, paginação
server-side, join, `select` de colunas, RPC, storage, realtime.

## Padrão canônico dos repos

```ts
// src/lib/data/produtos.repo.ts
import { db } from './client';
import type { Database } from './types.gen';

export type Produto = Database['public']['Tables']['produtos']['Row'];

export const listProdutos     = () => db.table<Produto>('produtos').list();
export const createProduto    = (input: Partial<Produto>) => db.table<Produto>('produtos').create(input);
export const updateProduto    = (id: string, patch: Partial<Produto>) => db.table<Produto>('produtos').update(id, patch);
export const deleteProduto    = (id: string) => db.table<Produto>('produtos').remove(id);
```

Regras:

- Um repo por tabela em `src/lib/data/*.repo.ts`.
- Repos são **editáveis pela IA** (ficam no `editable.allow`).
- Nunca importe `db` fora de `*.repo.ts`. Telas usam os repos, não o `db`.

## Padrão canônico das telas: list-then-filter

```ts
// src/screens/ProdutoDetail.tsx
const { data: produtos = [] } = useQuery({
  queryKey: ['produtos'],
  queryFn: listProdutos,
});
const produto = produtos.find(p => p.id === id);
if (!produto) return <NotFound />;
```

Justificativa: o modo genérico **não tem** get-by-id (§B5).

## Relações sem join

Duas opções, escolha caso a caso:

1. **Denormalize (padrão)**: guarde `fornecedor_nome text` na linha de compra junto com
   `fornecedor_id text`. Preenche na criação; atualiza via edit se quiser fresh data.
   Vantagem: 1 request. Desvantagem: dado defasado.
2. **2 queries no front**: `useQuery(['produtos'])` + `useQuery(['fornecedores'])`, monte
   o mapa `id → nome` no cliente. Vantagem: sempre fresh. Desvantagem: mais dados na rede.

Nunca peça endpoint custom sem antes tentar essas duas.

## Cache

- React Query com `staleTime` generoso (30s–5min) para listas estáveis.
- Invalidar por `queryClient.invalidateQueries({ queryKey: ['<tabela>'] })` após
  mutations.

## `owner_id`

- **Nunca** envie `owner_id` nem em `create` nem em `update`. O gateway seta pela sessão.
- Se enviar por engano, o gateway ignora silenciosamente.
- Tipos gerados em `types.gen.ts` marcam `owner_id` como opcional em `Insert`.

## O que **desaparece** do projeto atual

| Hoje                                                      | Vira |
| --------------------------------------------------------- | ---- |
| `supabase.from('x').select().eq().order()`                | `db.table('x').list()` + `.filter().sort()` no front |
| `.select('*, fornecedor:fornecedores(nome)')`             | denormalize ou 2 queries |
| `.rpc('next_purchase_order_code')`                        | contador front + retry em conflito de unique, ou extensão |
| `.from('x').upsert(...)`                                  | `list().find()` → `create` ou `update` |
| `supabase.channel(...).on('postgres_changes', ...)`       | ❌ v1 não tem realtime. Ver extensão. |
| `supabase.storage.from(...).upload(...)`                  | ❌ v1 não tem storage. Ver extensão. |
| `supabase.functions.invoke('foo')`                        | ❌ v1 não tem edge functions. Ver extensão. |
