# Gateway Extensions — Onda 2

> ⚠️ **Não entra no v1.** A fonte de verdade sobre escopo, ordem e progresso é
> [`../../README.md`](../../README.md) (o "cérebro"). Este diretório é memória
> técnica de capacidades que vivem no repositório `tenant-gateway`, **não**
> neste projeto.

## O que é uma extensão

Capacidade que **não** roda 100% no front chamando `db`/`auth` genéricos.
Requer trabalho no `tenant-gateway`: rota HTTP dedicada, worker, secret,
webhook receiver, provider de IA, cron, storage, realtime, etc.

## Regra dura

- Nenhum story v1 implementa nada daqui.
- Nenhum arquivo daqui vira código deste repositório sem antes:
  1. discussão com o dono do `tenant-gateway`,
  2. contrato de endpoint aprovado,
  3. story próprio (fora dos 19 do v1) criado.

## Catálogo

- `ext-001-realtime.md` — substituto de `refetchOnWindowFocus` quando fizer falta.
- `ext-002-storage-uploads.md` — foto de produto, anexos de PO.
- `ext-003-webhook-vendas.md` — receber venda de canal externo e dar baixa.
- `ext-004-notificacoes-whatsapp-email.md` — envio de RFQ, alertas.
- `ext-005-barcode-lookup.md` — lookup de EAN por API externa.
- `ext-006-ai-chat-reorder.md` — assistente de reposição.
- `ext-007-push-inventory-shopify-bling.md` — sync outbound de estoque.
- `ext-008-cron-jobs.md` — jobs recorrentes (baixa estoque, relatórios).

## Como um story v1 se conecta a uma extensão

Story v1 pode ter a seção **"Gancho de extensão"** apontando para o arquivo
correspondente aqui — **só como referência**, sem descrever a implementação.
Exemplo: story 010 (RFQ) referencia `ext-004` para "envio automático", mas o
v1 entrega só um link/print manual.
