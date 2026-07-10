# Story 009 — Pedidos de Solicitação (PR)

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 006

## Objetivo
CRUD de PRs. Fluxo: rascunho → submetido → aprovado/rejeitado → convertido (em RFQ ou PO).

## Regras aplicáveis
- §B4.1 — `pedidos_solicitacao_itens` tem `owner_id`.
- §B5 — código sequencial gerado no front (ver ADR-006).

## Design
- Repos `pedidos_solicitacao.repo.ts` e `pedidos_solicitacao_itens.repo.ts`.
- Código: `PR-YYYY-NNNN` gerado como `PR-2026-${String((await list()).length+1).padStart(4,'0')}`.
- Status como coluna text livre com check constraint.
- Conversão PR→RFQ = criar cotação + itens; PR→PO = criar pedido de compra + itens.

## Tarefas
- [ ] Repos.
- [ ] Migrar `Requests.tsx`, `RequestDetail`, `NewRequest`, `PurchaseRequestForm`,
      `PurchaseRequestsTable`, `PurchaseRequestDetail`.
- [ ] Migrar `ConvertToRfqDialog`, `ConvertToPoDialog` para operações compostas no front.
- [ ] `RoleGate` nos botões de aprovar/rejeitar.

## DoD
- [ ] DoD padrão.
- [ ] Colisão de código: unique(owner_id, codigo) + retry no erro.
- [ ] Conversão gera IDs corretos.

## Gancho
- Notificação de aprovação — `ext-004`.
