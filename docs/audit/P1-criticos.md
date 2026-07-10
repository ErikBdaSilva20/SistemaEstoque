# P1 — Críticos (core de negócio, reescrever)

Estes itens têm que existir no v1. Não bloqueiam infra, mas exigem reescrita significativa
para caber no modo genérico `db.table().list/create/update/remove`.

---

### Produtos — CRUD, kardex, lotes, fotos

- **Onde:** `src/pages/Products.tsx`, `ProductDetail.tsx`, `ProductsTable.tsx`, `ProductFormDialog.tsx`, `ProductKardex.tsx`, `ProductBatchesPanel.tsx`, `BatchFormDialog.tsx`, `useProducts.ts`, `useBatches.ts`, `useKardex.ts`.
- **Categoria:** REESCREVER.
- **Regra violada:** §B5 (sem get-by-id, sem join).
- **Ação:** `ProductDetail` faz `listProdutos()` + `.find()`. Kardex = `listMovimentacoes()` filtrado no front. Foto = URL externa (v1). Lotes = tabela filha `lotes_produto` com `owner_id`.
- **Story vinculado:** `stories/v1/006-produtos-crud.md`.

---

### Fornecedores — CRUD + import CSV

- **Onde:** `src/pages/Suppliers.tsx`, `SuppliersTable.tsx`, `SupplierFormDialog.tsx`, `SuppliersImportDialog.tsx`, `useSuppliers.ts`.
- **Categoria:** REESCREVER.
- **Ação:** tabela `fornecedores` com `owner_id`. Import CSV = lê arquivo no cliente, itera `create()`.
- **Story vinculado:** `stories/v1/007-fornecedores-crud.md`.

---

### Estoque — movimentações e motivos

- **Onde:** `src/pages/Stock.tsx`, `MovementsTable.tsx`, `MovementFormDialog.tsx`, `StockKpiCards.tsx`, `useMovements.ts`, `useMovementReasons.ts`, `MovementReasonsPanel.tsx`.
- **Categoria:** REESCREVER.
- **Regra violada:** §B5 (join com produto), §B4 (owner_id na filha).
- **Ação:** `movimentacoes_estoque` com `owner_id`, `produto_id`, `produto_nome` (denormalizado), `motivo_codigo`. Saldo calculado no front por soma no kardex. `motivos_movimento` é lookup (read-only ao rep).
- **Story vinculado:** `stories/v1/008-estoque-movimentacoes.md`.

---

### Pedidos de solicitação (PR)

- **Onde:** `src/pages/Requests.tsx`, `RequestDetail.tsx`, `NewRequest.tsx`, `PurchaseRequestForm.tsx`, `PurchaseRequestsTable.tsx`, `PurchaseRequestDetail.tsx`, `ConvertToRfqDialog.tsx`, `ConvertToPoDialog.tsx`, `usePurchaseRequests.ts`.
- **Categoria:** REESCREVER.
- **Ação:** `pedidos_solicitacao` + `pedidos_solicitacao_itens` (ambas com owner_id). Conversão PR→RFQ e PR→PO = 2 chamadas `create()` no front + `update({ status: 'convertido' })`.
- **Story vinculado:** `stories/v1/009-purchase-requests.md`.

---

### Cotações (RFQ)

- **Onde:** `src/pages/Quotes.tsx`, `QuoteDetail.tsx`, `NewQuote.tsx`, `QuoteRequestForm.tsx`, `QuotesTable.tsx`, `QuoteRequestDetail.tsx`, `useQuotes.ts`.
- **Categoria:** REESCREVER.
- **Regra violada:** §B5, §A3 (envio por WhatsApp/Email = extensão).
- **Ação:** `cotacoes`, `cotacoes_itens`, `respostas_cotacao` (owner_id em todas). Envio efetivo por WA/Email = **fora do v1**. V1 gera link/PDF imprimível para o comprador enviar manualmente.
- **Story vinculado:** `stories/v1/010-quotes-rfq.md` + `stories/gateway-extensions/ext-004-notificacoes-whatsapp-email.md`.

---

### Pedidos de compra (PO)

- **Onde:** `src/pages/Purchases.tsx`, `PurchaseDetail.tsx`, `NewPurchase.tsx`, `PurchaseOrderForm.tsx`, `PurchasesTable.tsx`, `PurchaseOrderDetail.tsx`, `PurchaseOrderPrint.tsx`, `PoCheckDialog.tsx`, `PurchaseChainBreadcrumb.tsx`, `PurchaseAccountability.tsx`, `usePurchases.ts`, `usePurchaseRules.ts`.
- **Categoria:** REESCREVER.
- **Ação:** `pedidos_compra` + `pedidos_compra_itens` + `regras_compra` (lookup). Código sequencial: contador front + `unique(codigo)` + retry (ADR-006). Fluxo de aprovação = `update({ status })` com `RoleGate` para esconder botões.
- **Story vinculado:** `stories/v1/011-purchase-orders.md`.

---

### Recebimento e kardex vinculado

- **Onde:** `src/components/purchases/ReceiveItemsDialog.tsx`, `useMovements.ts` (origem `compra`).
- **Categoria:** REESCREVER.
- **Ação:** recebimento gera `movimentacoes_estoque` uma por item + `update` no `pedidos_compra_itens.qtd_recebida`. Feito no front, sem RPC atômica (aceitável no volume).
- **Story vinculado:** `stories/v1/012-recebimento-e-kardex.md`.

---

### Contagens de inventário

- **Onde:** `src/pages/Counts.tsx`, `CountDetail.tsx`, `CountSessionsTable.tsx`, `CountSessionDetail.tsx`, `NewCountSessionDialog.tsx`, `AddCountItemDialog.tsx`, `useCountSessions.ts`.
- **Categoria:** REESCREVER.
- **Ação:** `contagens` + `contagens_itens` (owner_id). Ajuste ao fechar = gera movimentação de `ajuste`. Scanner de barcode = **fora do v1**.
- **Story vinculado:** `stories/v1/013-contagens-inventario.md`.

---

### Relatórios: ABC, giro, rupturas

- **Onde:** `src/pages/Reports.tsx`, `AbcReportTable.tsx`, `TurnoverReportTable.tsx`, `StockoutsReportTable.tsx`, `useReports.ts`.
- **Categoria:** MANTER conceito, REESCREVER queries.
- **Ação:** cálculo 100% no front a partir de `list()` das tabelas relevantes. Períodos: filtro por `created_at` no cliente.
- **Story vinculado:** `stories/v1/014-relatorios-abc-turnover.md`.

---

### Dashboard

- **Onde:** `src/pages/Dashboard.tsx`, `useDashboard.ts`, cards `AnomaliesCard`, `ExpiringBatchesCard`, `ForecastPreviewCard`.
- **Categoria:** REESCREVER (métricas), DESCARTAR forecast/anomalies IA no v1.
- **Ação:** KPIs simples calculados no front. Forecast (IA) e Anomalies (IA) saem no v1.
- **Story vinculado:** `stories/v1/015-dashboard.md`.

---

### Auth wrapper (`useAuth`)

- **Onde:** `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/pages/Auth.tsx`, `LoginForm.tsx`, `SignupForm.tsx`, `AnimatedAuthForm.tsx`, `RoleGate.tsx`.
- **Categoria:** REESCREVER.
- **Ação:** `useAuth` chama `auth.me()`. Papel vem do gateway. Sem `is_active`, sem `is_approved`, sem `onboarding_completed`. `RoleGate` continua igual (props `roles`).
- **Story vinculado:** `stories/v1/004-auth-tenant-gateway.md`.
