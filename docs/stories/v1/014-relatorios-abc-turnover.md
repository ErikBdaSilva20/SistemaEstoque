# Story 014 — Relatórios: ABC, Giro, Rupturas

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 006, 008, 011

## Objetivo
Três relatórios calculados 100% no front a partir de `list()` de produtos, movimentações
e pedidos de compra.

## Design
- `useReports.ts` retorna dados brutos (queries React Query paralelas).
- Cálculos em `src/lib/reports/{abc,turnover,stockouts}.ts` (puros, testáveis).
- ABC: ordena produtos por `valor_venda_periodo`, classifica A (top 80%), B (95%), C.
- Giro: `saidas_periodo / estoque_medio`.
- Rupturas: produtos com `saldo <= estoque_min` OU com `saldo=0` no período.

## Tarefas
- [ ] Utilities puros com testes (vitest).
- [ ] Migrar `Reports.tsx`, `AbcReportTable`, `TurnoverReportTable`, `StockoutsReportTable`.
- [ ] Filtro de período no front.

## DoD
- [ ] DoD padrão.
- [ ] `npm test` cobre os 3 cálculos com fixtures.

## Riscos
- Performance com muitos produtos + movimentações — mitigar com `useMemo` e limitar período.
