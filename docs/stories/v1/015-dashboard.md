# Story 015 — Dashboard

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 006, 008, 011

## Objetivo
Tela inicial com KPIs simples: total de produtos, ruptura, POs em aberto, valor de
estoque, lotes vencendo.

## Fora de escopo
- Forecast IA (ext-006).
- Anomalias IA (ext-006).

## Design
- Cards: TotalProdutos, ProdutosRuptura, POsAbertos, ValorEstoque, LotesVencendo.
- `ExpiringBatchesCard` MANTER (calcula sobre `lotes_produto`).
- Empty state amigável quando cliente ainda não tem dados.

## Tarefas
- [ ] Reescrever `useDashboard` para agregar `list()` das tabelas relevantes.
- [ ] Remover `ForecastPreviewCard`, `AnomaliesCard`.
- [ ] Empty states.

## DoD
- [ ] DoD padrão.
- [ ] Dashboard carrega < 1s com dataset pequeno (dev).

## Gancho
- `ext-006-ai-chat-reorder.md` reintroduz Forecast/Anomalias.
