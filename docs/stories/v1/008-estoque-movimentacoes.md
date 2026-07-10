# Story 008 — Estoque: movimentações e motivos

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 005, 006

## Objetivo
Registrar entradas, saídas e ajustes de estoque. Consultar movimentações com filtros
(produto, origem, período). Saldo por produto = soma no front.

## Fora de escopo
- Realtime nas movimentações (ver `ext-001-realtime.md`).
- Scanner de código de barras (ver `ext-005`).

## Regras aplicáveis
- §B4.1 — `movimentacoes_estoque` tem `owner_id`.
- §B5 — sem join com `produtos` → guardar `produto_nome` denormalizado.

## Design
- Repo `movimentacoes.repo.ts`.
- `motivos_movimento` é lookup (read-only pro rep); escrita em SettingsMovementReasons (admin).
- Form ao criar movimentação: escolhe produto → copia `produto_nome` no insert.
- Saldo do produto: `movs.filter(m => m.produto_id === id).reduce((acc, m) => acc + sign(m.origem)*m.quantidade, 0)`.

## Exemplo (registrar entrada)
```ts
await createMovimentacao({
  produto_id: produto.id,
  produto_nome: produto.nome,
  quantidade: 10,
  origem: 'entrada',
  motivo_codigo: 'entrada_compra',
});
// owner_id vem do gateway
```

## Tarefas
- [ ] Repos `movimentacoes.repo.ts`, `motivos_movimento.repo.ts`.
- [ ] Reescrever `useMovements`, `useMovementReasons`.
- [ ] Migrar `Stock.tsx`, `MovementsTable`, `MovementFormDialog`, `StockKpiCards`.
- [ ] Migrar `MovementReasonsPanel` (escrita só admin via `RoleGate`).
- [ ] Helper `calcularSaldo(movs, produtoId)` em `src/lib/estoque.ts`.

## DoD
- [ ] DoD padrão.
- [ ] Filtros de tabela funcionam client-side.
- [ ] Kardex do story 006 consome as mesmas movimentações.

## Gancho de extensão
- `ext-001-realtime.md`, `ext-005-barcode-lookup.md`.
