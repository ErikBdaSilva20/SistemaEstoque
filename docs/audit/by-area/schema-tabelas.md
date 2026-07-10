# Auditoria por área — Schema / Tabelas

Mapeamento tabela-a-tabela do schema Supabase atual → schema Neon do template.

## Regras aplicadas em todas

- `id uuid pk default gen_random_uuid()`.
- `owner_id text not null references "user"(id) on delete cascade` se `rep` escreve.
- `snake_case` minúsculo, pt-BR.
- `created_at timestamptz not null default now()` + `updated_at timestamptz` + trigger.
- **Sem RLS**, **sem policies**, **sem `auth.uid()`**.

## Tabela por tabela

| Hoje (Supabase) | Novo (Neon) | Categoria | Notas |
| --- | --- | --- | --- |
| `profiles` | — | DESCARTAR | Better-Auth. |
| `user_roles` | — | DESCARTAR | Papel vem no `auth.me()`. |
| `user_stores` | — | DESCARTAR | Sem `stores`. |
| `stores` | — | DESCARTAR | 1 Neon por tenant (ADR-003). |
| `products` | `produtos` | REESCREVER | +`owner_id`. Remove `store_id`, `foto` (bucket) → `foto_url text`. |
| `product_batches` | `lotes_produto` | REESCREVER | +`owner_id`. FK `produto_id`. |
| `suppliers` | `fornecedores` | REESCREVER | +`owner_id`. |
| `stock_movements` | `movimentacoes_estoque` | REESCREVER | +`owner_id`, +`produto_nome` (denorm), `origem` como text. |
| `movement_reasons` | `motivos_movimento` | REESCREVER como **lookup** | Sem owner_id. Read-only pro rep. |
| `locations` | `locais_estoque` | REESCREVER | Se rep cadastra, +`owner_id`. Se só admin, lookup. Escolha do story 016. |
| `purchase_requests` | `pedidos_solicitacao` | REESCREVER | +`owner_id`. |
| `purchase_request_items` | `pedidos_solicitacao_itens` | REESCREVER | +`owner_id` (§B4.1). |
| `quote_requests` | `cotacoes` | REESCREVER | +`owner_id`. |
| `quote_request_items` | `cotacoes_itens` | REESCREVER | +`owner_id`. |
| `quotes` (respostas) | `respostas_cotacao` | REESCREVER | +`owner_id`. |
| `purchase_orders` | `pedidos_compra` | REESCREVER | +`owner_id`. `codigo` com `unique`. |
| `purchase_order_items` | `pedidos_compra_itens` | REESCREVER | +`owner_id`, +`produto_nome` (denorm), +`fornecedor_nome`. |
| `count_sessions` | `contagens` | REESCREVER | +`owner_id`. |
| `count_session_items` | `contagens_itens` | REESCREVER | +`owner_id`. |
| `purchase_rules` | `regras_compra` | REESCREVER como **lookup** | Escrita só admin. |
| `notification_log` | — | DESCARTAR | Notificação = extensão. |
| `ai_audit_log` | — | DESCARTAR | IA = extensão. |
| `ai_usage_log` | — | DESCARTAR | IA = extensão. |
| `integrations` | — | DESCARTAR | Config vive no gateway. |
| `api_keys` | — | DESCARTAR | Gateway. |
| `external_product_mappings` | — | DESCARTAR | Sync = extensão. |
| `purchase_documents` | — | DESCARTAR v1 | Vira URL ou extensão de storage. |
| `audit_logs` | — | DESCARTAR | Feature de plataforma. |

## Colunas removidas de tabelas mantidas

- Todas as `store_id` → removidas.
- Todos os campos `is_deleted`/`deleted_at` → removidos (sem soft-delete no v1; se necessário, coluna `arquivado boolean`).
- Campos de arquivo em bucket (`foto_path`, `documento_path`) → viram `_url text`.
