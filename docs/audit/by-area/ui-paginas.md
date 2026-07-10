# Auditoria por área — UI (páginas e componentes)

Regra geral: qualquer arquivo que importa `@/integrations/supabase/*` ou
`@/lib/edge-fn` é REESCREVER (troca de camada de dados) ou DESCARTAR (feature morre).

## Páginas

| Página | Categoria | Nota |
| --- | --- | --- |
| `src/pages/AppShell.tsx` | REESCREVER | Sem `StoreSwitcher`, sem `useRealtimeSync`. Menu simplificado. |
| `src/pages/Auth.tsx` | REESCREVER | Usa `auth.signIn/signUp`. |
| `src/pages/Dashboard.tsx` | REESCREVER | Cards de IA saem no v1. |
| `src/pages/Products.tsx` | REESCREVER | list-then-filter. |
| `src/pages/ProductDetail.tsx` | REESCREVER | `list().find()`. |
| `src/pages/Suppliers.tsx` | REESCREVER | idem. |
| `src/pages/Stock.tsx` | REESCREVER | idem. |
| `src/pages/Requests.tsx` + `RequestDetail.tsx` + `NewRequest.tsx` | REESCREVER | idem. |
| `src/pages/Quotes.tsx` + `QuoteDetail.tsx` + `NewQuote.tsx` | REESCREVER | Envio por WA/Email = extensão. |
| `src/pages/Purchases.tsx` + `PurchaseDetail.tsx` + `NewPurchase.tsx` | REESCREVER | Código sequencial no front. |
| `src/pages/PurchaseAccountability.tsx` | REESCREVER | Cálculo no front. |
| `src/pages/Approvals.tsx` | REESCREVER | Lista consolidada no front. |
| `src/pages/Counts.tsx` + `CountDetail.tsx` | REESCREVER | Sem scanner v1. |
| `src/pages/Reports.tsx` | REESCREVER | Cálculo no front. |
| `src/pages/Forecast.tsx` | DESCARTAR v1 | IA = extensão. |
| `src/pages/Scan.tsx` | DESCARTAR v1 | Barcode = extensão. |
| `src/pages/NotFound.tsx` | MANTER | — |
| `src/pages/settings/SettingsLayout.tsx` | MANTER | — |
| `src/pages/settings/SettingsIndex.tsx` | REESCREVER | Menu enxuto (só o que fica). |
| `src/pages/settings/SettingsStores.tsx` | DESCARTAR | Sem stores. |
| `src/pages/settings/SettingsTeam.tsx` | REESCREVER | Convite = feature do gateway. V1: só lista membros. |
| `src/pages/settings/SettingsLocations.tsx` | MANTER (reescrita interna) | — |
| `src/pages/settings/SettingsMovementReasons.tsx` | MANTER (reescrita interna) | Lookup, escrita só admin. |
| `src/pages/settings/SettingsPurchaseRules.tsx` | MANTER (reescrita interna) | Lookup. |
| `src/pages/settings/SettingsOnboarding.tsx` | DESCARTAR | Sem wizard. |
| `src/pages/settings/SettingsIntegrations.tsx` | DESCARTAR | Extensão. |
| `src/pages/settings/SettingsHealth.tsx` | DESCARTAR | Gateway monitora. |
| `src/pages/settings/SettingsApiKeys.tsx` | DESCARTAR | Gateway. |
| `src/pages/settings/SettingsAudit.tsx` | DESCARTAR | Plataforma. |
| `src/pages/settings/SettingsSecurity.tsx` | DESCARTAR | Better-Auth. |

## Componentes que **saem** no v1

- `src/components/ai/*` (AiChatDrawer, AiReorderDialog, AiUsagePanel)
- `src/components/integrations/*`
- `src/components/health/HealthCheckPanel.tsx`
- `src/components/audit/AuditPanel.tsx`
- `src/components/api-keys/ApiKeysSettings.tsx`
- `src/components/security/SecuritySettings.tsx`
- `src/components/onboarding/*`
- `src/components/scan/BarcodeScanner.tsx`
- `src/components/stores/*` (StoreSwitcher, StoresPanel)
- `src/components/dashboard/ForecastPreviewCard.tsx`
- `src/components/dashboard/AnomaliesCard.tsx` (IA)
- `src/components/products/ProductPhotoUpload.tsx`

## Componentes que **ficam** (com reescrita da camada de dados)

- `src/components/auth/*` (LoginForm, SignupForm, AnimatedAuthForm, RoleGate)
- `src/components/products/*` menos `ProductPhotoUpload`
- `src/components/suppliers/*`
- `src/components/stock/*`
- `src/components/purchases/*`
- `src/components/quotes/*`
- `src/components/requests/*`
- `src/components/counts/*`
- `src/components/labels/*`
- `src/components/locations/*`
- `src/components/settings/{MovementReasonsPanel,PurchaseRulesPanel}.tsx`
- `src/components/team/MembersTable.tsx`
- `src/components/import/{ImportDialog,ProductsImportDialog,SuppliersImportDialog}.tsx`
- `src/components/reports/*`
- `src/components/dashboard/ExpiringBatchesCard.tsx`
- `src/components/ui/**` (shadcn — cópia do scaffold `wiki`, protegido)
- `src/components/lp/ScrollReveal.tsx`
