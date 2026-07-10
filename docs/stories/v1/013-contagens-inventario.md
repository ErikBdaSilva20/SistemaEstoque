# Story 013 — Contagens de inventário

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 008

## Objetivo
Sessão de contagem: criar, adicionar itens, fechar gerando ajustes de estoque.

## Fora de escopo
- Scanner de barcode (`ext-005`).

## Design
- Repos `contagens`, `contagens_itens`.
- Ao fechar contagem: para cada item com `quantidade_contada ≠ quantidade_sistema`,
  gerar movimentação `origem: 'ajuste'`, `motivo_codigo: 'ajuste_inventario'`,
  quantidade = diferença.
- `AddCountItemDialog` sem scanner (input manual de SKU/nome).

## Tarefas
- [ ] Repos.
- [ ] Migrar `Counts`, `CountDetail`, `CountSessionsTable`, `CountSessionDetail`,
      `NewCountSessionDialog`, `AddCountItemDialog`.
- [ ] Helper `fecharContagem(sessao, itens)` — loop no front.

## DoD
- [ ] DoD padrão.
- [ ] Fechar contagem gera N movimentações corretas.
- [ ] Sessão marcada como `fechada` só quando todas as movs foram criadas.

## Gancho
- `ext-005-barcode-lookup.md`.
