# Auditoria por área — RPCs e Triggers

O modo genérico do gateway **não expõe RPCs**. Toda função SQL server-side do projeto
atual precisa virar (a) lógica no front, (b) trigger local no Neon, ou (c) extensão do
gateway.

## RPCs identificadas

| RPC | Uso | Novo destino |
| --- | --- | --- |
| `next_purchase_order_code(prefix)` | Gera `PO-2026-0001` atômico. | Front: `list().length + 1` com `unique(codigo)` + retry no erro de conflito. Se virar problema, EXTENSÃO. |
| `submit_purchase_order(id)` | Muda status pra `submetido` + valida. | Front: `updatePedidoCompra(id, { status: 'submetido' })`. Validação já roda no form. |
| `approve_purchase_order(id)` | Muda pra `aprovado`, checa papel. | Front: idem, com `RoleGate`. Papel real é checado no gateway (autz). |
| `reject_purchase_order(id, motivo)` | Idem, pra `rejeitado`. | Front: `update({ status: 'rejeitado', motivo_rejeicao })`. |
| `convert_quote_to_purchase_order(cotacao_id, ...)` | Cria PO a partir de RFQ, com itens. | Front: `listRespostasCotacao()` → filtra a escolhida → `createPedidoCompra()` + loop `createPedidoCompraItem()`. **Sem atomicidade**: se falhar no meio, deixa PO parcial e o comprador refaz. Aceitável no volume. |
| `receive_purchase_order_items(items[])` | Registra recebimento e gera movimentações. | Front: loop no cliente. Cada item = `update(item, { qtd_recebida })` + `createMovimentacao({ origem: 'compra', ... })`. |
| `convert_request_to_rfq(request_id, fornecedores[])` | Cria N cotações. | Front: `createCotacao()` em loop. |

## Triggers que sobrevivem (locais no Neon)

Só triggers de utilidade, sem lógica de negócio:

```sql
-- Atualiza updated_at (obrigatório em toda tabela com updated_at)
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
```

Um `create trigger touch_<tabela>_updated_at` por tabela.

## Triggers que **saem**

- Trigger de auditoria (`audit_trigger`) → some junto com `audit_logs`.
- Trigger que popula `profiles` a partir de `auth.users` → some (§B4).
- Trigger que dispara webhook em INSERT → some (webhook = extensão).
- Trigger que valida `store_id` → some.

## Views materializadas / views normais

Se o projeto tem alguma `create view` no Supabase, ela **DESCARTAR**. O modo genérico
não lê views. Cálculos derivados = React Query + memo no front.
