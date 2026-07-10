# Extensão 004 — Notificações WhatsApp + Email

**Substitui:** `notify-low-stock`, `notify-purchase-flow`, `send-quote-request`.

## Motivação
- Alertar comprador quando produto entra em ruptura.
- Notificar aprovador quando PO é submetido.
- Enviar RFQ ao fornecedor por WhatsApp/email.

## Por que é extensão (§A3)
Fanout, template rendering, provedor externo, secrets.

## Superfície proposta no gateway
- `POST /notify/whatsapp` `{ to, template_id, vars }` — canal Evolution API ou Twilio.
- `POST /notify/email` `{ to, template_id, vars }` — Resend/SES.
- `POST /notify/quote-request/:cotacao_id` — server monta payload a partir do Neon do tenant.
- Cron (via ext-008) roda diariamente para alertas de ruptura.

## Impacto no schema
- `templates_notificacao` (lookup: id, canal, corpo, ativo).
- `envios_notificacao` (log com owner_id do disparador, status, provider_id).

## Impacto no template
- Botões "Enviar por WhatsApp" / "Enviar por email" nos detalhes de RFQ, PO, ruptura.
- Fallback: se extensão ausente → botões escondidos.

## Secrets/config
`RESEND_API_KEY`, `EVOLUTION_URL`, `EVOLUTION_TOKEN` — no gateway.

## Riscos
- Custo por mensagem.
- Compliance (LGPD/opt-in do fornecedor).

## Critério de aceite
- Enviar RFQ → fornecedor recebe email com link do RFQ imprimível.
