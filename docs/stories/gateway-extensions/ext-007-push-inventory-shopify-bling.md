# Extensão 007 — Sync Shopify / Bling

**Substitui:** `push-inventory`, `admin-integrations` (parte Shopify/Bling),
`external_product_mappings`.

## Motivação
Empurrar saldo de estoque local para lojas Shopify/Bling e receber vendas via webhook
(cruza com `ext-003`).

## Superfície proposta no gateway
- `POST /integrations/shopify/connect` — OAuth flow.
- `POST /integrations/shopify/push-inventory` — jobs em background empurram saldo.
- `POST /integrations/bling/connect` — API key.
- `POST /integrations/bling/push-inventory`.

## Impacto no schema
- `integracoes_ativas` (lookup admin: tipo, credencial_ref no gateway, ativo).
- `produtos_mapeamento_externo` (owner_id? — provavelmente admin only, tipo, produto_id, external_id).

## Impacto no template
- `IntegrationsPanel` reintroduzido (só admin).
- Cards Shopify/Bling com status de última sync.

## Secrets/config
Tokens vivem no gateway/Composio.

## Riscos
- Rate limits Shopify.
- Divergência de estoque entre canais.

## Critério de aceite
- Alterar saldo local → aparece no Shopify em <5min.
