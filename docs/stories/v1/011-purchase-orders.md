# Story 011 — Pedidos de Compra (PO) + Aprovações

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 007, 010

## Objetivo
CRUD de POs com fluxo de aprovação por papel/valor, incluindo `Approvals.tsx`
consolidado.

## Regras aplicáveis
- §B4.1 — itens têm `owner_id`.
- §B5 — código sequencial no front + retry (ADR-006).
- §B8 — `RoleGate` esconde botão "Aprovar" para quem não é admin/manager.

## Design
- Repos `pedidos_compra`, `pedidos_compra_itens`, `regras_compra` (lookup).
- Status: `rascunho | submetido | aprovado | rejeitado | recebido_parcial | recebido`.
- Regra de valor: `regras_compra` define `valor_max_aprovacao` por papel; front usa para
  esconder botão. Autz real fica no gateway (owner_id + role).
- Aprovações: `Approvals.tsx` = merge de PRs pendentes + POs pendentes, filtro no front.

## Tarefas
- [ ] Repos.
- [ ] Migrar `Purchases`, `PurchaseDetail`, `NewPurchase`, `PurchaseOrderForm`,
      `PurchasesTable`, `PurchaseOrderDetail`, `PoCheckDialog`, `PurchaseChainBreadcrumb`,
      `Approvals.tsx`.
- [ ] Remover `submit/approve/reject_purchase_order` RPCs → `update({ status })`.
- [ ] Painel `PurchaseRulesPanel` só edita se admin.

## DoD
- [ ] DoD padrão.
- [ ] Aprovação/rejeição atualiza status e reflete na lista sem reload.
- [ ] Colisão de código PO tratada com retry.

## Gancho
- Notificação a comprador/aprovador — `ext-004`.
