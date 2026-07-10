# Modelo de domínio (multi-tenant, plano)

Fonte: [`../reference/Importantdoc.md`](../reference/Importantdoc.md) §B4, §B4.1, §B8.

## Tenancy

- **1 Neon por tenant.** Isolamento físico. Não existe coluna `tenant_id`.
- **Autorização por `owner_id`** dentro do Neon (aplicada pelo gateway).
- Papéis:
  - `admin` — 1º usuário do tenant. Vê tudo. Escreve em lookups.
  - `manager` — Vê tudo. Escreve em lookups.
  - `rep` — Vê **só as linhas onde `owner_id = seu id`**. Leitura em lookups.
  - `owner` — implícito: criador de uma linha específica.

## Template canônico de tabela

```sql
create table if not exists produtos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     text not null references "user"(id) on delete cascade,
  sku          text not null,
  nome         text not null,
  unidade      text not null default 'un',
  preco_venda  numeric(12,2),
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_produtos_owner on produtos(owner_id);
create trigger touch_produtos_updated_at
  before update on produtos
  for each row execute function touch_updated_at();
```

## Tabelas-filhas (o gotcha do §B4.1)

Se `rep` cria/edita, **inclui `owner_id`**. Sempre.

```sql
create table if not exists pedido_compra_itens (
  id                uuid primary key default gen_random_uuid(),
  owner_id          text not null references "user"(id) on delete cascade,  -- ⚠️ obrigatório
  pedido_compra_id  uuid not null references pedidos_compra(id) on delete cascade,
  produto_id        uuid not null references produtos(id) on delete restrict,
  quantidade        numeric(12,3) not null,
  preco_unitario    numeric(12,2) not null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_pedido_compra_itens_owner  on pedido_compra_itens(owner_id);
create index if not exists idx_pedido_compra_itens_pedido on pedido_compra_itens(pedido_compra_id);
```

Esqueceu `owner_id` na filha → `rep` toma **403 ao salvar**.

## Tabelas lookup (sem `owner_id`)

Somente para dados semente compartilhados: status, categorias, motivos de movimento
padronizados, temas. Escrita só admin/manager. Leitura livre.

```sql
create table if not exists motivos_movimento (
  id       uuid primary key default gen_random_uuid(),
  codigo   text not null unique,
  rotulo   text not null,
  escopo   text not null check (escopo in ('entrada','saida','ajuste','qualquer')),
  ativo    boolean not null default true
);
```

## Nomes proibidos

`user`, `session`, `account`, `verification`, `organization`, `member`, `invitation` —
reservados ao Better-Auth. **Não use nem no singular nem no plural exato.**
Prefira: `pessoa`, `perfil_ext` (se for algo diferente de auth), `equipe`, `convite_ext`.

## Trigger utilitário

```sql
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
```

Vive no início da migration. Reutilizado por todas as tabelas com `updated_at`.

## Mapeamento (esboço) das tabelas do projeto atual

Detalhe completo em [`../audit/by-area/schema-tabelas.md`](../audit/by-area/schema-tabelas.md).

- `stores` → **descartar**. Tenancy é 1 Neon por cliente; multi-PDV interno vira `pdvs`
  como lookup opcional.
- `profiles`, `user_roles`, `user_stores` → **descartar** (auth é Better-Auth).
- `products` → `produtos` (com `owner_id`).
- `suppliers` → `fornecedores`.
- `stock_movements` → `movimentacoes_estoque`.
- `purchase_requests` / `_items` → `pedidos_solicitacao` / `_itens`.
- `quote_requests` / `_items` / `quotes` → `cotacoes` / `_itens` / `respostas_cotacao`.
- `purchase_orders` / `_items` → `pedidos_compra` / `_itens`.
- `count_sessions` / `_items` → `contagens` / `_itens`.
- `product_batches` → `lotes_produto`.
- `locations` → `locais_estoque` (lookup? talvez com owner_id se rep cadastra).
- `movement_reasons` → `motivos_movimento` (lookup).
- `notification_log`, `ai_audit_log`, `integrations`, `api_keys`,
  `external_product_mappings` → **descartar** (todas viram extensão ou some).
