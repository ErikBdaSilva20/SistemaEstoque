# Extensão 008 — Cron + rotas transacionais

**Motiva:** jobs periódicos e operações atômicas que o modo genérico não cobre.

## Motivação
- Verificação diária de ruptura (dispara `ext-004`).
- Geração atômica de código sequencial de PO (substitui ADR-006).
- Recebimento transacional (garante update do item + inserção da movimentação num único COMMIT).
- Purga de logs antigos.

## Superfície proposta no gateway
- Scheduler (Fly Machines, ou node-cron dentro do gateway) rodando por tenant ativo.
- `POST /tx/next-code/:tabela` — retorna próximo código sequencial atômico.
- `POST /tx/receive-po-items` — recebe payload, executa em transação SQL.

## Impacto no schema
- Nenhum novo além de `sequencias` (opcional: `{ tabela, ano, contador }` com update atômico).

## Impacto no template
- Se `VITE_TX_URL` presente, `usePedidosCompra` chama `/tx/next-code/pedidos_compra`
  em vez do fallback de contar `list().length`.

## Secrets/config
Nenhum novo.

## Riscos
- Cron por tenant escala com número de tenants → precisa orquestração.

## Critério de aceite
- 100 requisições simultâneas de novo PO retornam 100 códigos únicos consecutivos.
- Recebimento com erro no meio faz rollback (nenhuma mov criada).
