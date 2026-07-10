> **SUPERSEDIDO.** RFQ foi fundido com PR (story 009) num único "Pedido de Compra" (story 011) —
> ver `docs/README.md` §3/§5 (Bloco D). Sem comparação de cotações de múltiplos fornecedores como
> entidade separada; mantido aqui só como histórico de decisão.

# Story 010 — Cotações (RFQ)

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 007, 009

## Objetivo
Criar RFQ (a partir de PR ou standalone), registrar respostas por fornecedor,
selecionar melhor resposta e converter em PO.

## Fora de escopo
- **Envio automático** para fornecedores via WhatsApp/Email (`ext-004`).
- V1 gera link imprimível/PDF do RFQ que o comprador envia manualmente.

## Regras aplicáveis
- §B4.1 — itens têm `owner_id`.
- §B5 — sem join; `fornecedor_nome` denormalizado nas respostas.

## Design
- Repos `cotacoes`, `cotacoes_itens`, `respostas_cotacao`.
- Tela de detalhe: tabela matriz produtos × fornecedores.
- Botão "Converter em PO" = seleção de resposta → `createPedidoCompra` + loop itens.

## Tarefas
- [ ] Repos.
- [ ] Migrar `Quotes`, `QuoteDetail`, `NewQuote`, forms e tabelas.
- [ ] Remover `send-quote-request` do fluxo (botão de enviar vira "Imprimir/Copiar link").
- [ ] Página impressa reutiliza `PurchaseOrderPrint` estilo → adaptar como `QuoteRequestPrint`.

## DoD
- [ ] DoD padrão.
- [ ] Fluxo PR→RFQ→PO fecha ponta a ponta sem edge function.

## Gancho
- `ext-004-notificacoes-whatsapp-email.md`.
