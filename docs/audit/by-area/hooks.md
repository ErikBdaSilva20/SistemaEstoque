# Auditoria por área — Hooks

Todo hook em `src/hooks/*` que importa `@/integrations/supabase/client` é
**REESCREVER** para usar o repo correspondente em `src/lib/data/`.

| Hook | Categoria | Ação |
| --- | --- | --- |
| `useAuth.ts` | REESCREVER | Wrapper de `auth.me()`. Ver story 004. |
| `useStore.ts` | DESCARTAR | ADR-003. |
| `useStores.ts` | DESCARTAR | idem. |
| `useProducts.ts` | REESCREVER | `listProdutos`, `createProduto`, `updateProduto`, `deleteProduto`. |
| `useBatches.ts` | REESCREVER | Repo `lotes_produto.repo.ts`. |
| `useKardex.ts` | REESCREVER | `listMovimentacoes()` + filtro por `produto_id` no front. |
| `useSuppliers.ts` | REESCREVER | idem. |
| `useMovements.ts` | REESCREVER | Join com produto → denormalize `produto_nome`. |
| `useMovementReasons.ts` | REESCREVER | Lookup; escrita só admin. |
| `usePurchaseRequests.ts` | REESCREVER | idem. |
| `useQuotes.ts` | REESCREVER | idem. |
| `usePurchases.ts` | REESCREVER | Código sequencial no front. |
| `usePurchaseRules.ts` | REESCREVER | Lookup. |
| `usePurchaseDocuments.ts` | DESCARTAR v1 | Storage = extensão. |
| `useCountSessions.ts` | REESCREVER | idem. |
| `useLocations.ts` | REESCREVER | idem. |
| `useStockDestinations.ts` | REESCREVER (ou merge com `useLocations`) | idem. |
| `useDashboard.ts` | REESCREVER | Cálculo no front. |
| `useReports.ts` | REESCREVER | idem. |
| `useForecast.ts` | DESCARTAR v1 | IA = extensão. |
| `useAnomalies.ts` | DESCARTAR v1 | IA = extensão. |
| `useBarcodeLookup.ts` | DESCARTAR v1 | EXTENSÃO. |
| `useRealtimeSync.ts` | DESCARTAR v1 | EXTENSÃO ext-001. |
| `useTeamManagement.ts` | REESCREVER (mínimo) | V1: só lista membros do `auth`. Convite = feature gateway. |
| `useOnboardingWizard.ts` | DESCARTAR | Sem wizard. |
| `use-mobile.tsx` | MANTER | Zero backend. |

## Padrão da reescrita

Antes:

```ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}
```

Depois:

```ts
export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: listProdutos,
    staleTime: 30_000,
  });
}
```

Ordenação/filtro migra para o consumidor (memo com `sort`/`filter`).
