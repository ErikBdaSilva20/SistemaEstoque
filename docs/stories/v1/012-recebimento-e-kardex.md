# Story 012 — Recebimento + Prestação de contas

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 008, 011

## Objetivo
Registrar recebimento de itens de PO, gerar movimentações de estoque correspondentes,
consolidar prestação de contas.

## Regras aplicáveis
- §B5 — sem RPC atômica. Loop no front. Erros parciais são visíveis ao usuário.

## Design
- `ReceiveItemsDialog` = para cada item recebido:
  1. `updatePedidoCompraItem(id, { qtd_recebida })`
  2. `createMovimentacao({ origem: 'entrada', motivo_codigo: 'entrada_compra', ... })`
- `PurchaseAccountability.tsx` = `list()` POs + itens + movs, agrega no front.
- Se todos os itens têm `qtd_recebida >= quantidade`, muda PO para `recebido`;
  se algum < quantidade e > 0, `recebido_parcial`.

## Tarefas
- [ ] Reescrever `ReceiveItemsDialog`.
- [ ] Reescrever `PurchaseAccountability` component + page.
- [ ] Helper `atualizarStatusPoAposRecebimento(pedido, itens)`.

## DoD
- [ ] DoD padrão.
- [ ] Recebimento gera movimentações vinculadas.
- [ ] Falha parcial exibe erro claro e permite retry item a item.

## Riscos
- Falha entre `update` e `createMovimentacao` deixa estado inconsistente → mitigar com
  UI de reconciliação em `PurchaseAccountability`.

## Gancho
- Atomicidade real via `ext-008-cron-jobs.md` (rota transacional).
