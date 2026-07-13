## Branch correta

- **`deploy`** — é o código de verdade. Trate como se já fosse a `main`
  (é pra onde ela vai virar PR). Zero mock, só funciona com um
  `tenant-gateway` real configurado (`VITE_GATEWAY_URL`). **É esta que
  importa.**
- **`mockup`** — só uma vitrine visual (login e dados fake, sem backend
  nenhum), pra publicar rápido e mostrar a tela. Não é referência de
  código, não é candidata a virar `main`.

Repo: `ErikBdaSilva20/SistemaEstoque`.

## Sobre a pasta `.legacy/`

Ela **não existe mais no código atual** (foi tirada da `deploy` de
propósito, pra não subir pro cliente coisa que não funciona). Mas o
conteúdo continua no histórico do git, então dá pra recuperar quando quiser:

```bash
git checkout dc4d669 -- .legacy
```

Era um conjunto de telas/componentes de uma versão mais completa do
sistema (arquitetura antiga, Supabase + Edge Functions) que **nunca foi
portada** pra arquitetura atual (gateway + Neon). Não é lixo por ser ruim —
é lixo porque não roda no jeito atual do projeto. Se a equipe tiver
interesse em algum desses recursos, dá pra usar como **referência de UX e
regra de negócio** pra reconstruir do zero na arquitetura nova (mesma
lógica do que já fizemos com Pedido de Compra, Estoque, etc.).

O que tinha lá, por área:

- **Assistente de IA** (`components/ai/`: `AiChatDrawer`, `AiReorderDialog`,
  `AiUsagePanel`) — chat de IA dentro do app e sugestão automática de
  reposição de estoque (provavelmente via Claude/Anthropic).
- **Multi-loja** (`StoreContext`, `StoreSwitcher`, `StoresPanel`,
  `settings/SettingsStores`) — suporte a várias lojas/filiais dentro do
  mesmo tenant, com troca de loja ativa.
- **Previsão de demanda** (`ForecastPreviewCard`, `pages/Forecast`) — card
  e tela dedicada de previsão de vendas/estoque futuro.
- **Detecção de anomalias** (`AnomaliesCard`) — card no dashboard
  sinalizando padrões fora do comum (também com IA).
- **Integrações externas** (`components/integrations/`:
  `IntegrationsPanel`, `BlingCard`, `ShopifyCard`, `WhatsappCard`,
  `EmailCard`, `SaleWebhookCard`, `settings/SettingsIntegrations`) — sync
  com ERP (Bling/Shopify), notificação por WhatsApp/Email, webhook de
  vendas de terceiros.
- **Scanner de câmera** (`BarcodeScanner`, `pages/Scan`) — leitura de
  código de barras pela câmera do celular (hoje o app só lê via leitor
  USB/Bluetooth em modo teclado).
- **Chaves de API / segurança / auditoria** (`ApiKeysSettings`,
  `SecuritySettings`, `AuditPanel` + telas de settings correspondentes) —
  gestão de credenciais de integração, configurações de segurança, log de
  auditoria de ações.
- **Onboarding guiado** (`OnboardingCard`, `OnboardingWizard`,
  `ApiKeyHowTo`, `settings/SettingsOnboarding`) — assistente passo a passo
  pro admin configurar integrações na primeira vez.
- **Health check** (`HealthCheckPanel`, `settings/SettingsHealth`) —
  painel visual de diagnóstico (testava conexões/credenciais).
