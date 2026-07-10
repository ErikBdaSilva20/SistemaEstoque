# Story 005 — Schema inicial no Neon do tenant

**Prioridade:** P0
**Escopo:** v1
**Depende de:** 001

## Contexto
Todo o schema atual (`supabase/migrations/*`) tem RLS, `auth.uid()`, referências a
`auth.users`, tabela `profiles`, `user_roles`, `stores` etc. Substituído por **uma única
migration** que roda no Neon do tenant após o Better-Auth criar as tabelas de auth.

Ver [`../../architecture/04-modelo-dominio.md`](../../architecture/04-modelo-dominio.md) e
`../../audit/by-area/schema-tabelas.md`.

## Objetivo
Escrever `supabase/migrations/0001_business_schema.sql` cobrindo todo o domínio v1, seguindo
§B4 e §B4.1 à risca.

## Fora de escopo
- Tabelas de features Onda 2 (webhook, ai, notificação — não existem no schema).
- Seeds de dados (fica em `0002_seed_lookups.sql` opcional).

## Regras aplicáveis (Importantdoc)
- §B4 — `owner_id text not null references "user"(id) on delete cascade` em toda tabela escrita pelo `rep`. Sem RLS. Sem `auth.uid()`. Sem `profiles`.
- §B4 — `snake_case`, `id uuid pk`, `created_at`/`updated_at`, trigger `touch_updated_at`.
- §B4 — Nomes proibidos: `user, session, account, verification, organization, member, invitation`.
- §B4.1 — Tabela-filha **também** tem `owner_id`.

## Design / Arquitetura

Tabelas (todas com `id uuid pk`, `created_at`, `updated_at`, `owner_id` exceto lookups):

**Cadastros:**
- `produtos` (sku unique, nome, unidade, preco_venda, ativo, foto_url, ean, ncm, estoque_min, estoque_max)
- `lotes_produto` (produto_id, lote, validade, quantidade)
- `fornecedores` (razao_social, nome_fantasia, cnpj unique, email, telefone, ativo)
- `locais_estoque` (nome, descricao) — decisão do story 016 sobre owner_id.

**Estoque:**
- `movimentacoes_estoque` (produto_id, produto_nome, quantidade, origem, motivo_codigo, local_id, observacao)

**Compras:**
- `pedidos_solicitacao` (codigo, solicitante, status, observacao)
- `pedidos_solicitacao_itens` (pedido_id, produto_id, produto_nome, quantidade, justificativa)
- `cotacoes` (codigo, pedido_solicitacao_id, prazo_resposta, status)
- `cotacoes_itens` (cotacao_id, produto_id, produto_nome, quantidade)
- `respostas_cotacao` (cotacao_id, fornecedor_id, fornecedor_nome, valor_total, prazo_entrega, observacao)
- `pedidos_compra` (codigo unique, fornecedor_id, fornecedor_nome, valor_total, status, data_previsao, cotacao_id nullable)
- `pedidos_compra_itens` (pedido_id, produto_id, produto_nome, quantidade, preco_unitario, qtd_recebida)

**Inventário:**
- `contagens` (codigo, data_contagem, status, local_id, observacao)
- `contagens_itens` (contagem_id, produto_id, produto_nome, quantidade_contada, quantidade_sistema)

**Lookups (sem owner_id):**
- `motivos_movimento` (codigo unique, rotulo, escopo, ativo)
- `regras_compra` (papel, valor_max_aprovacao, ativo)

## Exemplo (canônico, um por tipo)

```sql
-- Trigger utilitário (topo do arquivo)
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Tabela com owner_id (rep escreve)
create table if not exists produtos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     text not null references "user"(id) on delete cascade,
  sku          text not null,
  nome         text not null,
  unidade      text not null default 'un',
  preco_venda  numeric(12,2),
  foto_url     text,
  ean          text,
  ncm          text,
  estoque_min  numeric(12,3) not null default 0,
  estoque_max  numeric(12,3),
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (owner_id, sku)  -- SKU único por usuário
);
create index if not exists idx_produtos_owner on produtos(owner_id);
create trigger touch_produtos_updated_at
  before update on produtos
  for each row execute function touch_updated_at();

-- Tabela-filha (rep escreve — owner_id OBRIGATÓRIO)
create table if not exists pedidos_compra_itens (
  id                uuid primary key default gen_random_uuid(),
  owner_id          text not null references "user"(id) on delete cascade,  -- §B4.1
  pedido_compra_id  uuid not null references pedidos_compra(id) on delete cascade,
  produto_id        uuid not null references produtos(id) on delete restrict,
  produto_nome      text not null,   -- denormalizado (§B5, sem join)
  quantidade        numeric(12,3) not null check (quantidade > 0),
  preco_unitario    numeric(12,2) not null check (preco_unitario >= 0),
  qtd_recebida      numeric(12,3) not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_pci_owner  on pedidos_compra_itens(owner_id);
create index if not exists idx_pci_pedido on pedidos_compra_itens(pedido_compra_id);
create trigger touch_pci_updated_at
  before update on pedidos_compra_itens
  for each row execute function touch_updated_at();

-- Lookup (sem owner_id)
create table if not exists motivos_movimento (
  id       uuid primary key default gen_random_uuid(),
  codigo   text not null unique,
  rotulo   text not null,
  escopo   text not null check (escopo in ('entrada','saida','ajuste','qualquer')),
  ativo    boolean not null default true
);
```

## Tarefas
- [ ] Apagar `supabase/migrations/*` legado (mover pra `.legacy/`).
- [ ] Escrever `supabase/migrations/0001_business_schema.sql` completo.
- [ ] Escrever `supabase/migrations/0002_seed_lookups.sql` com motivos padrão (`entrada_compra`, `saida_venda`, `ajuste_inventario`, `perda`, `transferencia`) e regras padrão (`admin: null`, `manager: 5000`, `rep: 0`).
- [ ] Rodar contra Neon local; gerar `src/lib/data/types.gen.ts`.
- [ ] Validar: `psql -c "\dt"` mostra só as tabelas esperadas + Better-Auth.
- [ ] Validar: nenhuma tabela sem `owner_id` (fora das lookups explicitamente listadas).

## Definition of Done
- [ ] DoD padrão cumprido.
- [ ] `types.gen.ts` regenerado.
- [ ] `grep -i "auth.uid\|policy\|rls\|references auth.users\|profiles" 0001_business_schema.sql` retorna 0.
- [ ] Todo `create table` que não é lookup tem `owner_id text not null references "user"(id) on delete cascade`.
- [ ] Toda tabela com `updated_at` tem trigger `touch_<x>_updated_at`.
- [ ] Nenhum nome de tabela na lista proibida.

## Riscos
- Provisionamento no Neon depende do gateway ter criado Better-Auth antes. Se rodar
  fora de ordem: `references "user"(id)` falha. Validar sequência com o dono do gateway.
