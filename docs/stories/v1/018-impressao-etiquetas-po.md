# Story 018 — Impressão: etiquetas e PO

**Prioridade:** P2 · **Escopo:** v1 · **Depende de:** 006, 011

## Objetivo
Impressão de etiquetas com código de barras (SVG) e impressão de PO (PDF via
`window.print`).

## Design
- `LabelsPrintDialog` + `BarcodeSvg` — MANTER (100% front).
- `PurchaseOrderPrint` — MANTER (CSS `@media print`).
- Também: `QuoteRequestPrint` (novo, story 010).

## Tarefas
- [ ] Ajustar imports para novos repos.
- [ ] CSS de print revisto para novo design system.

## DoD
- [ ] DoD padrão.
- [ ] Preview de impressão fica legível A4.
