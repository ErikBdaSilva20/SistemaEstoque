-- Business schema v1 -- Purchasing & Inventory
-- Runs on the tenant's Neon database, AFTER the Better-Auth tables (user/session/account/...).
-- Contract: docs/reference/Importantdoc.md SS B4/B4.1, docs/architecture/04-modelo-dominio.md
-- No RLS, no auth.uid(), no policies -- authorization is the gateway's responsibility.

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =========================================================================
-- Lookups (no owner_id -- free read, write restricted to admin/manager in the gateway)
-- =========================================================================

create table if not exists movement_reasons (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  scope       text not null default 'any' check (scope in ('in','out','adjustment','any')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger touch_movement_reasons_updated_at
  before update on movement_reasons
  for each row execute function touch_updated_at();

create table if not exists stock_destinations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null default 'other' check (kind in ('sector','consumer','other')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger touch_stock_destinations_updated_at
  before update on stock_destinations
  for each row execute function touch_updated_at();

create table if not exists purchase_rules (
  id                                   uuid primary key default gen_random_uuid(),
  min_quotes_required                 int not null default 3,
  approval_min_amount                 numeric(12,2),
  requires_delivery_check             boolean not null default false,
  delivery_check_min_amount           numeric(12,2),
  requires_justification_below_min_quotes boolean not null default true,
  requires_request_for_order          boolean not null default false,
  requires_winner_approval            boolean not null default false,
  approver_roles                      text[] not null default '{admin,manager}',
  active                               boolean not null default true,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now()
);
create trigger touch_purchase_rules_updated_at
  before update on purchase_rules
  for each row execute function touch_updated_at();

-- =========================================================================
-- Base registries (with owner_id)
-- =========================================================================

create table if not exists suppliers (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            text not null references "user"(id) on delete cascade,
  name                text not null,
  cnpj                text,
  email               text,
  phone               text,
  lead_time_days      int not null default 0,
  notes               text,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_suppliers_owner on suppliers(owner_id);
create trigger touch_suppliers_updated_at
  before update on suppliers
  for each row execute function touch_updated_at();

-- Suggested pattern from stories/v1/016: locations carries owner_id (rep registers their own location).
create table if not exists locations (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null references "user"(id) on delete cascade,
  name        text not null,
  code        text,
  kind        text not null default 'warehouse',
  address     text,
  notes       text,
  is_default  boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_locations_owner on locations(owner_id);
create trigger touch_locations_updated_at
  before update on locations
  for each row execute function touch_updated_at();

create table if not exists products (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              text not null references "user"(id) on delete cascade,
  sku                   text not null,
  name                  text not null,
  description           text,
  category              text,
  brand                 text,
  model                 text,
  unit                  text not null default 'un',
  cost_price            numeric(12,2) not null default 0,
  sale_price            numeric(12,2) not null default 0,
  current_stock         numeric(14,3) not null default 0,
  min_stock             numeric(14,3) not null default 0,
  barcode               text,
  ncm                   text,
  cest                  text,
  origin                text,
  weight_kg             numeric(10,3),
  dimensions            jsonb,
  technical_spec        text,
  internal_notes        text,
  photo_url             text,
  supplier_id           uuid references suppliers(id) on delete set null,
  track_batches         boolean not null default false,
  track_locations       boolean not null default false,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (owner_id, sku)
);
create index if not exists idx_products_owner on products(owner_id);
create index if not exists idx_products_supplier on products(supplier_id);
create trigger touch_products_updated_at
  before update on products
  for each row execute function touch_updated_at();

create table if not exists product_batches (
  id                uuid primary key default gen_random_uuid(),
  owner_id          text not null references "user"(id) on delete cascade,
  product_id        uuid not null references products(id) on delete cascade,
  location_id       uuid references locations(id) on delete set null,
  batch_code        text not null,
  manufacture_date  date,
  expiration_date   date,
  quantity          numeric(14,3) not null default 0,
  unit_cost         numeric(12,2),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_product_batches_owner on product_batches(owner_id);
create index if not exists idx_product_batches_product on product_batches(product_id);
create trigger touch_product_batches_updated_at
  before update on product_batches
  for each row execute function touch_updated_at();

-- =========================================================================
-- Stock movement
-- =========================================================================

create table if not exists stock_movements (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              text not null references "user"(id) on delete cascade,
  product_id            uuid not null references products(id) on delete restrict,
  product_name          text not null,
  batch_id              uuid references product_batches(id) on delete set null,
  location_id           uuid references locations(id) on delete set null,
  destination_location_id uuid references locations(id) on delete set null,
  destination_id        uuid references stock_destinations(id) on delete set null,
  type                  text not null check (type in ('in','out','adjustment','transfer')),
  origin                text not null default 'manual' check (origin in ('manual','purchase','sale','other')),
  quantity              numeric(14,3) not null,
  reason_id             uuid references movement_reasons(id) on delete set null,
  reference_id          uuid,
  notes                 text,
  created_at            timestamptz not null default now()
);
create index if not exists idx_stock_movements_owner on stock_movements(owner_id);
create index if not exists idx_stock_movements_product on stock_movements(product_id);

-- =========================================================================
-- Purchasing flow
-- =========================================================================

create table if not exists purchase_requests (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              text not null references "user"(id) on delete cascade,
  code                  text not null unique,
  title                 text not null,
  justification         text,
  priority              text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status                text not null default 'draft'
    check (status in ('draft','pending_approval','approved','rejected','converted','cancelled')),
  expected_date         date,
  approved_by           text,
  approved_at           timestamptz,
  rejected_by           text,
  rejected_at           timestamptz,
  rejection_reason      text,
  converted_to_order_id uuid,
  converted_to_quote_id uuid,
  submitted_at          timestamptz,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_purchase_requests_owner on purchase_requests(owner_id);
create trigger touch_purchase_requests_updated_at
  before update on purchase_requests
  for each row execute function touch_updated_at();

create table if not exists purchase_request_items (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  text not null references "user"(id) on delete cascade,
  purchase_request_id       uuid not null references purchase_requests(id) on delete cascade,
  product_id                uuid not null references products(id) on delete restrict,
  quantity                  numeric(14,3) not null,
  estimated_unit_cost       numeric(12,2),
  notes                     text,
  created_at                timestamptz not null default now()
);
create index if not exists idx_purchase_request_items_owner on purchase_request_items(owner_id);
create index if not exists idx_purchase_request_items_request on purchase_request_items(purchase_request_id);

create table if not exists quotes (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              text not null references "user"(id) on delete cascade,
  code                  text not null unique,
  title                 text not null,
  purchase_request_id   uuid references purchase_requests(id) on delete set null,
  status                text not null default 'draft'
    check (status in ('draft','sent','receiving','closed','cancelled','winner_pending_approval')),
  deadline              timestamptz,
  sent_at               timestamptz,
  closed_at             timestamptz,
  winning_response_id   uuid,
  converted_to_order_id uuid,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_quotes_owner on quotes(owner_id);
create trigger touch_quotes_updated_at
  before update on quotes
  for each row execute function touch_updated_at();

create table if not exists quote_items (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null references "user"(id) on delete cascade,
  quote_id    uuid not null references quotes(id) on delete cascade,
  product_id  uuid not null references products(id) on delete restrict,
  quantity    numeric(14,3) not null,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_quote_items_owner on quote_items(owner_id);
create index if not exists idx_quote_items_quote on quote_items(quote_id);

create table if not exists quote_suppliers (
  id              uuid primary key default gen_random_uuid(),
  owner_id        text not null references "user"(id) on delete cascade,
  quote_id        uuid not null references quotes(id) on delete cascade,
  supplier_id     uuid not null references suppliers(id) on delete restrict,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_quote_suppliers_owner on quote_suppliers(owner_id);
create index if not exists idx_quote_suppliers_quote on quote_suppliers(quote_id);

create table if not exists quote_responses (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                text not null references "user"(id) on delete cascade,
  quote_id                uuid not null references quotes(id) on delete cascade,
  supplier_id             uuid not null references suppliers(id) on delete restrict,
  supplier_name           text not null,
  items                   jsonb not null default '[]',
  total_amount            numeric(12,2) not null default 0,
  delivery_days           int,
  payment_terms           text,
  notes                   text,
  received_at             timestamptz not null default now(),
  created_at              timestamptz not null default now()
);
create index if not exists idx_quote_responses_owner on quote_responses(owner_id);
create index if not exists idx_quote_responses_quote on quote_responses(quote_id);

create table if not exists purchase_orders (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              text not null references "user"(id) on delete cascade,
  code                  text not null unique,
  supplier_id           uuid not null references suppliers(id) on delete restrict,
  supplier_name         text not null,
  purchase_request_id   uuid references purchase_requests(id) on delete set null,
  status                text not null default 'draft' check (status in (
    'draft','sent','pending_approval','approved','rejected','cancelled',
    'delivered_pending_check','partially_received','fully_received'
  )),
  total_amount          numeric(12,2) not null default 0,
  quotes_count          int not null default 0,
  justification         text,
  notes                 text,
  expected_date         date,
  sent_at               timestamptz,
  submitted_at          timestamptz,
  approved_by           text,
  approved_at           timestamptz,
  rejected_by           text,
  rejected_at           timestamptz,
  rejection_reason      text,
  cancelled_at          timestamptz,
  delivered_at          timestamptz,
  check_completed_by    text,
  check_completed_at    timestamptz,
  received_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_purchase_orders_owner on purchase_orders(owner_id);
create index if not exists idx_purchase_orders_supplier on purchase_orders(supplier_id);
create trigger touch_purchase_orders_updated_at
  before update on purchase_orders
  for each row execute function touch_updated_at();

create table if not exists purchase_order_items (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              text not null references "user"(id) on delete cascade,
  purchase_order_id     uuid not null references purchase_orders(id) on delete cascade,
  product_id            uuid not null references products(id) on delete restrict,
  product_name          text not null,
  quantity_ordered      numeric(14,3) not null,
  quantity_received     numeric(14,3) not null default 0,
  unit_cost             numeric(12,2) not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_purchase_order_items_owner on purchase_order_items(owner_id);
create index if not exists idx_purchase_order_items_order on purchase_order_items(purchase_order_id);
create trigger touch_purchase_order_items_updated_at
  before update on purchase_order_items
  for each row execute function touch_updated_at();

create table if not exists purchase_approvals (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            text not null references "user"(id) on delete cascade,
  purchase_order_id   uuid not null references purchase_orders(id) on delete cascade,
  approver_id         text,
  decision            text not null default 'pending' check (decision in ('pending','approved','rejected')),
  comment             text,
  justification       text,
  decided_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists idx_purchase_approvals_owner on purchase_approvals(owner_id);
create index if not exists idx_purchase_approvals_order on purchase_approvals(purchase_order_id);

-- =========================================================================
-- Inventory counts
-- =========================================================================

create table if not exists count_sessions (
  id            uuid primary key default gen_random_uuid(),
  owner_id      text not null references "user"(id) on delete cascade,
  code          text not null unique,
  name          text not null,
  category      text,
  location_id   uuid references locations(id) on delete set null,
  status        text not null default 'open' check (status in ('open','closed','cancelled')),
  notes         text,
  opened_at     timestamptz not null default now(),
  closed_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_count_sessions_owner on count_sessions(owner_id);
create trigger touch_count_sessions_updated_at
  before update on count_sessions
  for each row execute function touch_updated_at();

create table if not exists count_items (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              text not null references "user"(id) on delete cascade,
  count_session_id      uuid not null references count_sessions(id) on delete cascade,
  product_id            uuid not null references products(id) on delete restrict,
  batch_id              uuid references product_batches(id) on delete set null,
  expected_quantity     numeric(14,3) not null default 0,
  counted_quantity      numeric(14,3),
  counted_by            text,
  counted_at            timestamptz,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_count_items_owner on count_items(owner_id);
create index if not exists idx_count_items_session on count_items(count_session_id);
create trigger touch_count_items_updated_at
  before update on count_items
  for each row execute function touch_updated_at();
