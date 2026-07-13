// Populates the local Dockerized Postgres with realistic data so every
// screen (Dashboard, Products, Stock, Purchases, Counts, Reports, Suppliers,
// Settings) has something to show. Safe to re-run: truncates business tables
// (never touches "user") before inserting.
import pg from "pg";
import { randomUUID } from "node:crypto";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://dev:dev@localhost:5432/compras_estoque",
});

const OWNER = "dev-admin";
const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86_400_000).toISOString();
const uuid = () => randomUUID();

async function main() {
  const client = await pool.connect();
  try {
    await client.query("begin");

    await client.query(`
      truncate table
        count_items, count_sessions,
        purchase_order_items, purchase_orders,
        stock_movements,
        product_batches, products,
        locations, suppliers,
        purchase_rules, stock_destinations, movement_reasons
      restart identity cascade
    `);

    // ---- Lookups -------------------------------------------------------
    const reasons = {
      compra: uuid(),
      venda: uuid(),
      ajuste: uuid(),
      perda: uuid(),
    };
    await client.query(
      `insert into movement_reasons (id, label, scope, active) values
        ($1,'Compra','in',true),
        ($2,'Venda','out',true),
        ($3,'Ajuste de inventário','adjustment',true),
        ($4,'Perda/Avaria','out',true)`,
      [reasons.compra, reasons.venda, reasons.ajuste, reasons.perda],
    );

    const destinations = { producao: uuid(), manutencao: uuid(), outro: uuid() };
    await client.query(
      `insert into stock_destinations (id, name, kind, active) values
        ($1,'Produção','sector',true),
        ($2,'Manutenção','sector',true),
        ($3,'Outro','other',true)`,
      [destinations.producao, destinations.manutencao, destinations.outro],
    );

    await client.query(
      `insert into purchase_rules (id, approval_min_amount, active) values ($1, 5000, true)`,
      [uuid()],
    );

    // ---- Suppliers -------------------------------------------------------
    const suppliers = [
      { id: uuid(), name: "Distribuidora Alfa Ltda", cnpj: "11222333000181", lead: 5 },
      { id: uuid(), name: "Comercial Beta S.A.", cnpj: "12345678000195", lead: 10 },
      { id: uuid(), name: "Insumos Gama EIRELI", cnpj: "00000001000136", lead: 3 },
      { id: uuid(), name: "Fornecedora Delta", cnpj: null, lead: 7 },
    ];
    for (const s of suppliers) {
      await client.query(
        `insert into suppliers (id, owner_id, name, cnpj, email, phone, lead_time_days, active)
         values ($1,$2,$3,$4,$5,$6,$7,true)`,
        [
          s.id,
          OWNER,
          s.name,
          s.cnpj,
          `contato@${s.name.split(" ")[0].toLowerCase()}.com.br`,
          "(11) 4000-0000",
          s.lead,
        ],
      );
    }

    // ---- Locations ---------------------------------------------------
    const locations = [
      { id: uuid(), name: "Depósito Principal", code: "DEP-01", isDefault: true },
      { id: uuid(), name: "Loja Centro", code: "LOJ-01", isDefault: false },
      { id: uuid(), name: "Filial Zona Sul", code: "FIL-02", isDefault: false },
    ];
    for (const l of locations) {
      await client.query(
        `insert into locations (id, owner_id, name, code, kind, is_default, active)
         values ($1,$2,$3,$4,'warehouse',$5,true)`,
        [l.id, OWNER, l.name, l.code, l.isDefault],
      );
    }
    const mainLocation = locations[0].id;

    // ---- Products ------------------------------------------------------
    const catalog = [
      {
        name: "Arroz Branco Tipo 1 5kg",
        cat: "Alimentos",
        unit: "un",
        cost: 18,
        price: 27,
        stock: 120,
        min: 30,
        batches: true,
      },
      {
        name: "Feijão Carioca 1kg",
        cat: "Alimentos",
        unit: "un",
        cost: 6,
        price: 9.5,
        stock: 8,
        min: 40,
        batches: true,
      },
      {
        name: "Óleo de Soja 900ml",
        cat: "Alimentos",
        unit: "un",
        cost: 5.5,
        price: 8.9,
        stock: 60,
        min: 20,
        batches: true,
      },
      {
        name: "Detergente Neutro 500ml",
        cat: "Limpeza",
        unit: "un",
        cost: 2.2,
        price: 4.5,
        stock: 200,
        min: 50,
        batches: false,
      },
      {
        name: "Sabão em Pó 1kg",
        cat: "Limpeza",
        unit: "un",
        cost: 8,
        price: 14,
        stock: 0,
        min: 25,
        batches: false,
      },
      {
        name: "Álcool em Gel 500ml",
        cat: "Higiene",
        unit: "un",
        cost: 6,
        price: 11,
        stock: 45,
        min: 20,
        batches: true,
      },
      {
        name: "Papel Higiênico 12 rolos",
        cat: "Higiene",
        unit: "pct",
        cost: 12,
        price: 19.9,
        stock: 90,
        min: 30,
        batches: false,
      },
      {
        name: "Refrigerante Cola 2L",
        cat: "Bebidas",
        unit: "un",
        cost: 4.5,
        price: 7.9,
        stock: 150,
        min: 40,
        batches: true,
      },
      {
        name: "Água Mineral 1.5L",
        cat: "Bebidas",
        unit: "un",
        cost: 1.8,
        price: 3.5,
        stock: 300,
        min: 60,
        batches: false,
      },
      {
        name: "Café Torrado e Moído 500g",
        cat: "Alimentos",
        unit: "un",
        cost: 9,
        price: 15.9,
        stock: 15,
        min: 25,
        batches: true,
      },
      {
        name: "Luvas Descartáveis (cx 100)",
        cat: "EPI",
        unit: "cx",
        cost: 22,
        price: 34,
        stock: 25,
        min: 10,
        batches: false,
        locations: true,
      },
      {
        name: "Máscara Descartável (cx 50)",
        cat: "EPI",
        unit: "cx",
        cost: 15,
        price: 24,
        stock: 5,
        min: 15,
        batches: false,
        locations: true,
      },
    ];

    const products = [];
    for (let i = 0; i < catalog.length; i++) {
      const p = catalog[i];
      const id = uuid();
      const supplier = suppliers[i % suppliers.length];
      await client.query(
        `insert into products
          (id, owner_id, sku, name, category, unit, cost_price, sale_price, current_stock,
           min_stock, supplier_id, track_batches, track_locations, active)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)`,
        [
          id,
          OWNER,
          `SKU-${String(i + 1).padStart(4, "0")}`,
          p.name,
          p.cat,
          p.unit,
          p.cost,
          p.price,
          p.stock,
          p.min,
          supplier.id,
          p.batches,
          !!p.locations,
        ],
      );
      products.push({ ...p, id, supplierId: supplier.id });
    }

    // ---- Batches (for track_batches products) --------------------------
    for (const p of products.filter((x) => x.batches)) {
      const soon = uuid();
      const later = uuid();
      await client.query(
        `insert into product_batches
          (id, owner_id, product_id, location_id, batch_code, manufacture_date, expiration_date, quantity, unit_cost)
         values
          ($1,$2,$3,$4,'L-A',$6,$7,$8,$9),
          ($5,$2,$3,$4,'L-B',$6,$10,$11,$9)`,
        [
          soon,
          OWNER,
          p.id,
          mainLocation,
          later,
          daysAgo(60).slice(0, 10),
          daysAgo(-12).slice(0, 10), // expires in 12 days -> shows on ExpiringBatchesCard
          Math.max(1, Math.round(p.stock * 0.4)),
          p.cost,
          daysAgo(-90).slice(0, 10), // expires later
          Math.max(1, p.stock - Math.round(p.stock * 0.4)),
        ],
      );
    }

    // ---- Stock movements (last ~45 days, for kardex + reports) --------
    for (const p of products) {
      const movements = [];
      // initial stock-in ~40 days ago
      movements.push({ type: "in", origin: "purchase", qty: p.stock + 20, days: 40, reason: null });
      // a handful of sales spread across the period
      const sales = 3 + Math.floor(Math.random() * 4);
      for (let s = 0; s < sales; s++) {
        movements.push({
          type: "out",
          origin: "sale",
          qty: Math.max(1, Math.round((20 / sales) * (0.6 + Math.random()))),
          days: Math.floor(Math.random() * 35) + 1,
          reason: reasons.venda,
        });
      }
      if (p.stock === 0) {
        movements.push({ type: "out", origin: "sale", qty: 5, days: 2, reason: reasons.venda });
      }
      movements.sort((a, b) => b.days - a.days);
      for (const m of movements) {
        await client.query(
          `insert into stock_movements
            (id, owner_id, product_id, product_name, type, origin, quantity, reason_id,
             destination_id, created_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            uuid(),
            OWNER,
            p.id,
            p.name,
            m.type,
            m.origin,
            m.qty,
            m.reason,
            m.type === "out" ? destinations.outro : null,
            daysAgo(m.days),
          ],
        );
      }
    }

    // ---- Purchase orders -------------------------------------------------
    const poDefs = [
      { status: "draft", days: 1 },
      { status: "sent", days: 5 },
      { status: "pending_approval", days: 2 },
      { status: "partially_received", days: 10 },
      { status: "fully_received", days: 20 },
      { status: "cancelled", days: 15 },
      { status: "rejected", days: 8 },
    ];
    let poSeq = 1;
    for (const def of poDefs) {
      const supplier = suppliers[poSeq % suppliers.length];
      const items = products.slice(0, 3 + (poSeq % 3));
      const totalAmount = items.reduce((acc, p) => acc + p.cost * 10, 0);
      const poId = uuid();
      const code = `PO-2026-${String(poSeq).padStart(4, "0")}`;
      const createdAt = daysAgo(def.days);

      const extra = {};
      if (def.status !== "draft") extra.sent_at = daysAgo(Math.max(0, def.days - 1));
      if (def.status === "pending_approval")
        extra.submitted_at = daysAgo(Math.max(0, def.days - 1));
      if (def.status === "cancelled") extra.cancelled_at = daysAgo(Math.max(0, def.days - 1));
      if (def.status === "rejected") {
        extra.rejected_by = OWNER;
        extra.rejected_at = daysAgo(Math.max(0, def.days - 1));
        extra.rejection_reason = "Preço acima do praticado no mercado.";
      }
      if (def.status === "partially_received" || def.status === "fully_received") {
        extra.received_at = daysAgo(Math.max(0, def.days - 3));
      }

      const cols = [
        "id",
        "owner_id",
        "code",
        "supplier_id",
        "supplier_name",
        "status",
        "total_amount",
        "created_at",
        ...Object.keys(extra),
      ];
      const vals = [
        poId,
        OWNER,
        code,
        supplier.id,
        supplier.name,
        def.status,
        totalAmount,
        createdAt,
        ...Object.values(extra),
      ];
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(",");
      await client.query(
        `insert into purchase_orders (${cols.map((c) => `"${c}"`).join(",")}) values (${placeholders})`,
        vals,
      );

      for (const p of items) {
        const ordered = 10;
        const received =
          def.status === "fully_received"
            ? ordered
            : def.status === "partially_received"
              ? Math.floor(ordered / 2)
              : 0;
        await client.query(
          `insert into purchase_order_items
            (id, owner_id, purchase_order_id, product_id, product_name, quantity_ordered, quantity_received, unit_cost)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [uuid(), OWNER, poId, p.id, p.name, ordered, received, p.cost],
        );
      }
      poSeq++;
    }

    // ---- Count sessions --------------------------------------------------
    const openSession = uuid();
    await client.query(
      `insert into count_sessions (id, owner_id, code, name, location_id, status, opened_at)
       values ($1,$2,'CNT-2026-0001','Contagem geral - Depósito Principal',$3,'open',$4)`,
      [openSession, OWNER, mainLocation, daysAgo(1)],
    );
    const closedSession = uuid();
    await client.query(
      `insert into count_sessions (id, owner_id, code, name, location_id, status, opened_at, closed_at)
       values ($1,$2,'CNT-2026-0000','Contagem mensal anterior',$3,'closed',$4,$5)`,
      [closedSession, OWNER, mainLocation, daysAgo(30), daysAgo(29)],
    );
    for (const p of products.slice(0, 6)) {
      await client.query(
        `insert into count_items (id, owner_id, count_session_id, product_id, expected_quantity, counted_quantity, counted_at)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [
          uuid(),
          OWNER,
          closedSession,
          p.id,
          p.stock,
          p.stock - (Math.random() > 0.7 ? 1 : 0),
          daysAgo(29),
        ],
      );
    }
    for (const p of products.slice(0, 4)) {
      await client.query(
        `insert into count_items (id, owner_id, count_session_id, product_id, expected_quantity)
         values ($1,$2,$3,$4,$5)`,
        [uuid(), OWNER, openSession, p.id, p.stock],
      );
    }

    await client.query("commit");
    console.log(
      `Seed OK: ${suppliers.length} suppliers, ${locations.length} locations, ${products.length} products, ${poDefs.length} purchase orders, 2 count sessions.`,
    );
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
