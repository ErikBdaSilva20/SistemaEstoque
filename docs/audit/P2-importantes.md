# P2 — Importantes (adiáveis)

Features que agregam mas podem entrar depois do v1 estabilizar. Sem elas, o produto
já é utilizável.

---

### Import CSV de produtos

- **Onde:** `src/components/import/ProductsImportDialog.tsx`, `ImportDialog.tsx`, `src/lib/import-export.ts`.
- **Categoria:** MANTER (é 100% front).
- **Ação:** trocar `supabase.from().insert()` por loop de `createProduto()`.
- **Story vinculado:** `stories/v1/017-import-export-csv.md`.

---

### Impressão de etiquetas (barcode)

- **Onde:** `src/components/labels/LabelsPrintDialog.tsx`, `BarcodeSvg.tsx`.
- **Categoria:** MANTER.
- **Ação:** gera SVG no cliente. Sem mudanças de backend.
- **Story vinculado:** `stories/v1/018-impressao-etiquetas-po.md`.

---

### Impressão de PO (PDF/print)

- **Onde:** `src/components/purchases/PurchaseOrderPrint.tsx`.
- **Categoria:** MANTER.
- **Ação:** usa `window.print()`. Zero backend.
- **Story vinculado:** `stories/v1/018-impressao-etiquetas-po.md`.

---

### Locais de estoque

- **Onde:** `src/components/locations/LocationsPanel.tsx`, `LocationFormDialog.tsx`, `useLocations.ts`, `useStockDestinations.ts`.
- **Categoria:** REESCREVER (pequeno).
- **Ação:** tabela `locais_estoque` (com `owner_id` se rep cadastra, ou lookup se só admin).
- **Story vinculado:** `stories/v1/016-configuracoes-basicas.md`.

---

### Regras de compra (limites por papel)

- **Onde:** `src/components/settings/PurchaseRulesPanel.tsx`, `usePurchaseRules.ts`.
- **Categoria:** REESCREVER (pequeno). Regra de valor máximo vira lookup.
- **Ação:** `regras_compra` (lookup, escrita só admin). UI aplica esconder botão de aprovação se valor > limite do papel.
- **Story vinculado:** `stories/v1/011-purchase-orders.md` (usa) + `stories/v1/016-configuracoes-basicas.md` (edita).

---

### Aprovações centralizadas

- **Onde:** `src/pages/Approvals.tsx`.
- **Categoria:** MANTER conceito, REESCREVER queries.
- **Ação:** lista consolidada de PRs+POs pendentes, `list()` de cada tabela + filtro no front.
- **Story vinculado:** `stories/v1/011-purchase-orders.md`.

---

### Prestação de contas

- **Onde:** `src/pages/PurchaseAccountability.tsx`, `PurchaseAccountability.tsx` (component).
- **Categoria:** REESCREVER.
- **Ação:** cálculo no front por `list()` de POs + itens recebidos.
- **Story vinculado:** `stories/v1/012-recebimento-e-kardex.md`.

---

### Testes automatizados

- **Onde:** `scripts/smoke.mjs`, ausência de vitest.
- **Categoria:** MANTER + expandir.
- **Ação:** vitest para utils; Playwright para 1 fluxo E2E de smoke (login → criar produto → criar PO → receber).
- **Story vinculado:** `stories/v1/019-testes-qualidade.md`.
