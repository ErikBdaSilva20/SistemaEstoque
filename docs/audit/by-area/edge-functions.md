# Auditoria por área — Edge Functions

Todas as 13 funções em `supabase/functions/*` são **DESCARTAR**. O quadro abaixo diz o
que renasce como extensão de gateway (Onda 2) e o que morre de vez.

| Função | Categoria v1 | Destino Onda 2 | Story |
| --- | --- | --- | --- |
| `admin-api-keys` | DESCARTAR | — | (gerenciamento de API keys de terceiros: fora do template) |
| `admin-audit` | DESCARTAR | — | (auditoria é feature de plataforma; se cliente pedir, extensão dedicada) |
| `admin-delete-user` | DESCARTAR | — | (Better-Auth resolve; admin pode via UI do gateway) |
| `admin-integrations` | DESCARTAR | — | (integrações agora são endpoints dedicados no gateway, não CRUD) |
| `ai-chat` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-006-ai-chat-reorder.md` |
| `ai-suggest-reorder` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-006-ai-chat-reorder.md` |
| `barcode-lookup` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-005-barcode-lookup.md` |
| `check-user-active` | DESCARTAR | — | (Better-Auth: sessão expira sozinha) |
| `notify-low-stock` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-004-notificacoes-whatsapp-email.md` |
| `notify-purchase-flow` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-004-notificacoes-whatsapp-email.md` |
| `push-inventory` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-007-push-inventory-shopify-bling.md` |
| `sale-webhook` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-003-webhook-vendas.md` |
| `send-quote-request` | DESCARTAR | EXTENSÃO | `stories/gateway-extensions/ext-004-notificacoes-whatsapp-email.md` |
| `validate-signup` | DESCARTAR | — | Better-Auth já valida email/domínio |

## Consumidores no front (também descartar/reescrever)

- `src/lib/edge-fn.ts` — DESCARTAR.
- `src/hooks/useBarcodeLookup.ts` — DESCARTAR (v1) / renasce com extensão.
- `src/components/ai/*` (AiChatDrawer, AiReorderDialog, AiUsagePanel) — DESCARTAR v1.
- `src/components/integrations/*` (SaleWebhookCard, WhatsappCard, EmailCard, ShopifyCard, BlingCard, IntegrationsPanel) — DESCARTAR.
- `src/components/health/HealthCheckPanel.tsx` — DESCARTAR.
- `src/components/security/SecuritySettings.tsx` — DESCARTAR.
- `src/components/api-keys/ApiKeysSettings.tsx` — DESCARTAR.
- `src/components/audit/AuditPanel.tsx` — DESCARTAR.
- `src/pages/settings/{SettingsHealth,SettingsIntegrations,SettingsApiKeys,SettingsAudit,SettingsSecurity}.tsx` — DESCARTAR.
- `src/components/scan/BarcodeScanner.tsx`, `src/pages/Scan.tsx` — DESCARTAR v1.
