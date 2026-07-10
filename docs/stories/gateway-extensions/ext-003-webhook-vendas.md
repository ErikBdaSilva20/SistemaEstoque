# Extensão 003 — Webhook público de vendas

**Substitui:** edge function `sale-webhook`.

## Motivação
Receber webhooks de e-commerce (Shopify, WooCommerce, checkout próprio) para deduzir
estoque automaticamente.

## Por que é extensão (§A3, §B6)
Endpoint público (sem sessão Better-Auth) exige rota explícita no gateway.

## Superfície proposta no gateway
- `POST /public/webhooks/sale/:tenant_slug` (sem auth de sessão, com HMAC signature).
- Body: `{ external_id, items: [{ sku, quantidade, preco }], meta }`.
- Server:
  1. Resolve `owner_id` de sistema (usuário técnico do tenant).
  2. Para cada item: gera `movimentacoes_estoque` (`origem: 'saida', motivo_codigo: 'saida_venda'`).
  3. Registra em `webhook_recebidos` (idempotência por `external_id`).

## Impacto no schema
- `webhook_recebidos` (owner_id do usuário técnico, external_id unique, payload jsonb, status).

## Impacto no template
- Tela `SettingsWebhooks` para gerar URL + segredo HMAC.

## Secrets/config
`WEBHOOK_HMAC_SECRET` por tenant (armazenado no gateway).

## Riscos
- Race entre webhooks simultâneos → idempotência.
- Payload malformado.

## Critério de aceite
- POST assinado → movimentação criada; POST duplicado → 200 idempotente sem gerar segunda mov.
