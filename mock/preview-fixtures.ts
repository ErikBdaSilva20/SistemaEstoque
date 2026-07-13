// PROTEGIDO — usado pelo client.ts quando window.__MASI_PREVIEW__ === true
// (editor por IA / Sandpack do hub). RECONSTRUÍDO a partir da spec (§B5) — este
// ambiente não tem acesso ao editor Sandpack real para validar o formato exato
// das fixtures; a implementação abaixo é um mock local em memória equivalente.
//
// BRANCH MOCKUP: além do mock de auth/dados de sempre, este arquivo pré-popula
// o store com um dataset demo (produtos, fornecedores, pedidos, movimentações,
// contagens, lotes) — pra alguém abrir o link publicado e ver o app com cara
// de uso real, sem precisar de tenant-gateway/Neon. Datas são relativas ao
// momento do load (não hardcoded), então o dataset nunca "envelhece" visualmente.

type Row = Record<string, unknown> & { id?: string };

const store = new Map<string, Row[]>();

function seed(table: string): Row[] {
  if (!store.has(table)) store.set(table, []);
  return store.get(table)!;
}

function uuid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `preview-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// =========================================================================
// Dataset demo (branch mockup) — populado uma única vez, na primeira leitura.
// =========================================================================

function isoAt(daysOffset: number, hour = 9): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
}

function dateAt(daysOffset: number): string {
  return isoAt(daysOffset).slice(0, 10);
}

const SUP = {
  alfa: "10000000-0000-4000-8000-000000000001",
  beta: "10000000-0000-4000-8000-000000000002",
  sul: "10000000-0000-4000-8000-000000000003",
  nordeste: "10000000-0000-4000-8000-000000000004",
};

const LOC = {
  deposito: "20000000-0000-4000-8000-000000000001",
  loja: "20000000-0000-4000-8000-000000000002",
  veiculo: "20000000-0000-4000-8000-000000000003",
};

const PROD = {
  detergente: "30000000-0000-4000-8000-000000000001",
  luvas: "30000000-0000-4000-8000-000000000002",
  papelToalha: "30000000-0000-4000-8000-000000000003",
  alcool: "30000000-0000-4000-8000-000000000004",
  sabonete: "30000000-0000-4000-8000-000000000005",
  desinfetante: "30000000-0000-4000-8000-000000000006",
  copo: "30000000-0000-4000-8000-000000000007",
  sacoLixo: "30000000-0000-4000-8000-000000000008",
  aguaSanitaria: "30000000-0000-4000-8000-000000000009",
  esponja: "30000000-0000-4000-8000-000000000010",
  guardanapo: "30000000-0000-4000-8000-000000000011",
  mascara: "30000000-0000-4000-8000-000000000012",
};

const REASON = {
  quebra: "40000000-0000-4000-8000-000000000001",
  inventario: "40000000-0000-4000-8000-000000000002",
  vendaBalcao: "40000000-0000-4000-8000-000000000003",
  devolucao: "40000000-0000-4000-8000-000000000004",
  ajusteSistema: "40000000-0000-4000-8000-000000000005",
};

function buildSuppliers(): Row[] {
  return [
    {
      id: SUP.alfa,
      name: "Distribuidora Alfa",
      cnpj: "12.345.678/0001-90",
      email: "vendas@distribuidoraalfa.com.br",
      phone: "(11) 4002-8922",
      lead_time_days: 5,
      notes: null,
      active: true,
      created_at: isoAt(-120),
      updated_at: isoAt(-120),
    },
    {
      id: SUP.beta,
      name: "Fornecedor Beta Ltda",
      cnpj: "23.456.789/0001-01",
      email: "comercial@fornecedorbeta.com.br",
      phone: "(11) 3555-1020",
      lead_time_days: 10,
      notes: null,
      active: true,
      created_at: isoAt(-110),
      updated_at: isoAt(-110),
    },
    {
      id: SUP.sul,
      name: "Atacado Sul",
      cnpj: "34.567.890/0001-12",
      email: "pedidos@atacadosul.com.br",
      phone: "(51) 3212-4477",
      lead_time_days: 3,
      notes: "Entrega rápida, pedido mínimo R$ 500.",
      active: true,
      created_at: isoAt(-90),
      updated_at: isoAt(-90),
    },
    {
      id: SUP.nordeste,
      name: "Comércio Nordeste",
      cnpj: "45.678.901/0001-23",
      email: "contato@comercionordeste.com.br",
      phone: "(85) 3033-9090",
      lead_time_days: 7,
      notes: null,
      active: true,
      created_at: isoAt(-80),
      updated_at: isoAt(-80),
    },
  ];
}

function buildLocations(): Row[] {
  return [
    {
      id: LOC.deposito,
      name: "Depósito Central",
      code: "DEP-01",
      kind: "warehouse",
      address: "Rua das Indústrias, 450",
      notes: null,
      is_default: true,
      active: true,
      created_at: isoAt(-120),
      updated_at: isoAt(-120),
    },
    {
      id: LOC.loja,
      name: "Loja Centro",
      code: "LOJ-01",
      kind: "store",
      address: "Av. Principal, 1200",
      notes: null,
      is_default: false,
      active: true,
      created_at: isoAt(-100),
      updated_at: isoAt(-100),
    },
    {
      id: LOC.veiculo,
      name: "Veículo de Entrega 01",
      code: "VEI-01",
      kind: "vehicle",
      address: null,
      notes: "Van placa ABC-1234",
      is_default: false,
      active: true,
      created_at: isoAt(-60),
      updated_at: isoAt(-60),
    },
  ];
}

function buildProducts(): Row[] {
  const base = (
    id: string,
    sku: string,
    name: string,
    category: string,
    unit: string,
    costPrice: number,
    salePrice: number,
    currentStock: number,
    minStock: number,
    supplierId: string,
    trackBatches = false,
  ): Row => ({
    id,
    sku,
    name,
    description: null,
    category,
    brand: null,
    model: null,
    unit,
    cost_price: costPrice,
    sale_price: salePrice,
    current_stock: currentStock,
    min_stock: minStock,
    barcode: `789${sku.replace(/\D/g, "").padStart(9, "0")}`,
    ncm: null,
    cest: null,
    origin: null,
    weight_kg: null,
    dimensions: null,
    technical_spec: null,
    internal_notes: null,
    supplier_id: supplierId,
    track_batches: trackBatches,
    track_locations: false,
    active: true,
    created_at: isoAt(-90),
    updated_at: isoAt(-2),
  });

  return [
    base(PROD.detergente, "LIMP-001", "Detergente 5L", "Limpeza", "un", 18, 32, 3, 20, SUP.alfa),
    base(
      PROD.luvas,
      "EPI-001",
      "Luvas Descartáveis P (cx 100)",
      "EPI",
      "cx",
      22,
      39,
      8,
      50,
      SUP.beta,
    ),
    base(
      PROD.papelToalha,
      "LIMP-002",
      "Papel Toalha Interfolha",
      "Limpeza",
      "fardo",
      45,
      78,
      40,
      15,
      SUP.sul,
    ),
    base(PROD.alcool, "LIMP-003", "Álcool 70% 1L", "Limpeza", "un", 9, 16, 60, 30, SUP.alfa, true),
    base(
      PROD.sabonete,
      "HIG-001",
      "Sabonete Líquido 500ml",
      "Higiene",
      "un",
      7,
      13,
      25,
      10,
      SUP.nordeste,
    ),
    base(
      PROD.desinfetante,
      "LIMP-004",
      "Desinfetante Lavanda 2L",
      "Limpeza",
      "un",
      14,
      24,
      18,
      12,
      SUP.beta,
    ),
    base(
      PROD.copo,
      "DESC-001",
      "Copo Descartável 200ml (pct 100)",
      "Descartáveis",
      "pct",
      6,
      11,
      90,
      40,
      SUP.sul,
    ),
    base(
      PROD.sacoLixo,
      "DESC-002",
      "Saco de Lixo 100L (pct 20)",
      "Descartáveis",
      "pct",
      28,
      45,
      5,
      25,
      SUP.nordeste,
    ),
    base(
      PROD.aguaSanitaria,
      "LIMP-005",
      "Água Sanitária 1L",
      "Limpeza",
      "un",
      6,
      10,
      50,
      20,
      SUP.alfa,
      true,
    ),
    base(
      PROD.esponja,
      "LIMP-006",
      "Esponja Multiuso (pct 5)",
      "Limpeza",
      "pct",
      4,
      8,
      70,
      30,
      SUP.sul,
    ),
    base(
      PROD.guardanapo,
      "DESC-003",
      "Guardanapo de Papel (pct 50)",
      "Descartáveis",
      "pct",
      5,
      9,
      55,
      20,
      SUP.nordeste,
    ),
    base(
      PROD.mascara,
      "EPI-002",
      "Máscara Descartável (cx 50)",
      "EPI",
      "cx",
      19,
      34,
      6,
      15,
      SUP.beta,
      true,
    ),
  ];
}

function buildBatches(): Row[] {
  const batch = (
    id: string,
    productId: string,
    code: string,
    manufactureOffset: number,
    expirationOffset: number,
    quantity: number,
  ): Row => ({
    id,
    product_id: productId,
    location_id: LOC.deposito,
    batch_code: code,
    manufacture_date: dateAt(manufactureOffset),
    expiration_date: dateAt(expirationOffset),
    quantity,
    unit_cost: null,
    notes: null,
    created_at: isoAt(manufactureOffset),
    updated_at: isoAt(manufactureOffset),
  });

  return [
    batch(uuid(), PROD.alcool, "ALC-2410-A", -60, 12, 20),
    batch(uuid(), PROD.alcool, "ALC-2501-B", -20, 85, 40),
    batch(uuid(), PROD.aguaSanitaria, "AGS-2409-A", -90, -5, 10),
    batch(uuid(), PROD.aguaSanitaria, "AGS-2501-B", -15, 45, 40),
    batch(uuid(), PROD.mascara, "MSC-2410-A", -45, 6, 6),
  ];
}

function buildPurchaseOrders(): { orders: Row[]; items: Row[] } {
  const orders: Row[] = [];
  const items: Row[] = [];

  function addOrder(
    id: string,
    code: string,
    supplierId: string,
    supplierName: string,
    status: string,
    createdOffset: number,
    lines: {
      productId: string;
      productName: string;
      qty: number;
      received: number;
      cost: number;
    }[],
    extra: Partial<Row> = {},
  ) {
    const total = lines.reduce((acc, l) => acc + l.qty * l.cost, 0);
    orders.push({
      id,
      code,
      supplier_id: supplierId,
      supplier_name: supplierName,
      status,
      total_amount: total,
      notes: null,
      expected_date: dateAt(createdOffset + 7),
      sent_at: null,
      submitted_at: null,
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
      cancelled_at: null,
      received_at: null,
      created_at: isoAt(createdOffset),
      updated_at: isoAt(createdOffset),
      ...extra,
    });
    for (const l of lines) {
      items.push({
        id: uuid(),
        purchase_order_id: id,
        product_id: l.productId,
        product_name: l.productName,
        quantity_ordered: l.qty,
        quantity_received: l.received,
        unit_cost: l.cost,
        created_at: isoAt(createdOffset),
        updated_at: isoAt(createdOffset),
      });
    }
  }

  addOrder(uuid(), "PO-2024", SUP.alfa, "Distribuidora Alfa", "draft", -1, [
    { productId: PROD.detergente, productName: "Detergente 5L", qty: 40, received: 0, cost: 18 },
    {
      productId: PROD.sacoLixo,
      productName: "Saco de Lixo 100L (pct 20)",
      qty: 30,
      received: 0,
      cost: 28,
    },
  ]);

  addOrder(
    uuid(),
    "PO-2025",
    SUP.alfa,
    "Distribuidora Alfa",
    "sent",
    -3,
    [
      { productId: PROD.alcool, productName: "Álcool 70% 1L", qty: 100, received: 0, cost: 9 },
      {
        productId: PROD.aguaSanitaria,
        productName: "Água Sanitária 1L",
        qty: 100,
        received: 0,
        cost: 6,
      },
    ],
    { sent_at: isoAt(-3), submitted_at: isoAt(-3) },
  );

  addOrder(
    uuid(),
    "PO-2026",
    SUP.sul,
    "Atacado Sul",
    "pending_approval",
    -2,
    [
      {
        productId: PROD.papelToalha,
        productName: "Papel Toalha Interfolha",
        qty: 80,
        received: 0,
        cost: 45,
      },
      {
        productId: PROD.copo,
        productName: "Copo Descartável 200ml (pct 100)",
        qty: 60,
        received: 0,
        cost: 6,
      },
    ],
    { submitted_at: isoAt(-2) },
  );

  addOrder(
    uuid(),
    "PO-2027",
    SUP.nordeste,
    "Comércio Nordeste",
    "rejected",
    -8,
    [
      {
        productId: PROD.guardanapo,
        productName: "Guardanapo de Papel (pct 50)",
        qty: 200,
        received: 0,
        cost: 5,
      },
    ],
    {
      submitted_at: isoAt(-8),
      rejected_at: isoAt(-7),
      rejection_reason: "Valor acima do orçamento do mês.",
    },
  );

  addOrder(
    uuid(),
    "PO-2028",
    SUP.beta,
    "Fornecedor Beta Ltda",
    "partially_received",
    -10,
    [
      {
        productId: PROD.luvas,
        productName: "Luvas Descartáveis P (cx 100)",
        qty: 50,
        received: 20,
        cost: 22,
      },
      {
        productId: PROD.mascara,
        productName: "Máscara Descartável (cx 50)",
        qty: 40,
        received: 40,
        cost: 19,
      },
    ],
    { sent_at: isoAt(-10), submitted_at: isoAt(-10), received_at: isoAt(-4) },
  );

  addOrder(
    uuid(),
    "PO-2029",
    SUP.sul,
    "Atacado Sul",
    "fully_received",
    -15,
    [
      {
        productId: PROD.esponja,
        productName: "Esponja Multiuso (pct 5)",
        qty: 60,
        received: 60,
        cost: 4,
      },
    ],
    { sent_at: isoAt(-15), submitted_at: isoAt(-15), received_at: isoAt(-9) },
  );

  addOrder(
    uuid(),
    "PO-2030",
    SUP.nordeste,
    "Comércio Nordeste",
    "cancelled",
    -12,
    [
      {
        productId: PROD.sabonete,
        productName: "Sabonete Líquido 500ml",
        qty: 100,
        received: 0,
        cost: 7,
      },
    ],
    { cancelled_at: isoAt(-11) },
  );

  return { orders, items };
}

function buildMovements(): Row[] {
  const mv = (
    productId: string,
    productName: string,
    type: string,
    origin: string,
    quantity: number,
    daysOffset: number,
    reasonId: string | null = null,
  ): Row => ({
    id: uuid(),
    product_id: productId,
    product_name: productName,
    batch_id: null,
    location_id: LOC.deposito,
    destination_location_id: null,
    destination_id: null,
    type,
    origin,
    quantity,
    reason_id: reasonId,
    reference_id: null,
    notes: null,
    created_at: isoAt(-daysOffset, 8 + (daysOffset % 6)),
  });

  return [
    mv(PROD.detergente, "Detergente 5L", "out", "sale", 4, 0, REASON.vendaBalcao),
    mv(PROD.luvas, "Luvas Descartáveis P (cx 100)", "out", "sale", 2, 0, REASON.vendaBalcao),
    mv(PROD.alcool, "Álcool 70% 1L", "in", "purchase", 20, 1),
    mv(PROD.aguaSanitaria, "Água Sanitária 1L", "out", "manual", 5, 1, REASON.quebra),
    mv(PROD.copo, "Copo Descartável 200ml (pct 100)", "out", "sale", 10, 2, REASON.vendaBalcao),
    mv(
      PROD.papelToalha,
      "Papel Toalha Interfolha",
      "adjustment",
      "manual",
      -3,
      2,
      REASON.inventario,
    ),
    mv(PROD.esponja, "Esponja Multiuso (pct 5)", "in", "purchase", 60, 3),
    mv(PROD.sacoLixo, "Saco de Lixo 100L (pct 20)", "out", "sale", 6, 3, REASON.vendaBalcao),
    mv(PROD.desinfetante, "Desinfetante Lavanda 2L", "out", "manual", 1, 4, REASON.devolucao),
    mv(PROD.mascara, "Máscara Descartável (cx 50)", "in", "purchase", 40, 4),
    mv(PROD.guardanapo, "Guardanapo de Papel (pct 50)", "out", "sale", 15, 5, REASON.vendaBalcao),
    mv(PROD.sabonete, "Sabonete Líquido 500ml", "transfer", "manual", 10, 6),
    mv(PROD.alcool, "Álcool 70% 1L", "out", "sale", 8, 6, REASON.vendaBalcao),
    mv(
      PROD.aguaSanitaria,
      "Água Sanitária 1L",
      "adjustment",
      "manual",
      -2,
      7,
      REASON.ajusteSistema,
    ),
    mv(PROD.detergente, "Detergente 5L", "out", "sale", 3, 8, REASON.vendaBalcao),
  ];
}

function buildCountSessions(): { sessions: Row[]; items: Row[] } {
  const sessions: Row[] = [];
  const items: Row[] = [];

  function addSession(
    id: string,
    code: string,
    name: string,
    locationId: string,
    status: string,
    openedOffset: number,
    closedOffset: number | null,
    lines: { productId: string; expected: number; counted: number | null }[],
  ) {
    sessions.push({
      id,
      code,
      name,
      category: null,
      location_id: locationId,
      status,
      notes: null,
      opened_at: isoAt(openedOffset),
      closed_at: closedOffset !== null ? isoAt(closedOffset) : null,
      created_at: isoAt(openedOffset),
      updated_at: isoAt(closedOffset ?? openedOffset),
    });
    for (const l of lines) {
      items.push({
        id: uuid(),
        count_session_id: id,
        product_id: l.productId,
        batch_id: null,
        expected_quantity: l.expected,
        counted_quantity: l.counted,
        counted_by: l.counted !== null ? "preview-user" : null,
        counted_at: l.counted !== null ? isoAt(openedOffset) : null,
        notes: null,
        created_at: isoAt(openedOffset),
        updated_at: isoAt(openedOffset),
      });
    }
  }

  addSession(uuid(), "CONT-0091", "Contagem geral — Depósito", LOC.deposito, "open", -1, null, [
    { productId: PROD.detergente, expected: 3, counted: 3 },
    { productId: PROD.luvas, expected: 8, counted: 6 },
    { productId: PROD.alcool, expected: 60, counted: null },
    { productId: PROD.aguaSanitaria, expected: 50, counted: null },
  ]);

  addSession(uuid(), "CONT-0090", "Contagem mensal — Loja Centro", LOC.loja, "closed", -20, -19, [
    { productId: PROD.copo, expected: 90, counted: 88 },
    { productId: PROD.guardanapo, expected: 55, counted: 55 },
    { productId: PROD.sabonete, expected: 25, counted: 21 },
  ]);

  addSession(uuid(), "CONT-0089", "Contagem avulsa — EPIs", LOC.deposito, "cancelled", -30, null, [
    { productId: PROD.mascara, expected: 6, counted: null },
  ]);

  return { sessions, items };
}

function buildMovementReasons(): Row[] {
  const mk = (id: string, label: string, scope: string): Row => ({
    id,
    label,
    scope,
    active: true,
    created_at: isoAt(-100),
    updated_at: isoAt(-100),
  });
  return [
    mk(REASON.quebra, "Quebra", "out"),
    mk(REASON.inventario, "Inventário", "any"),
    mk(REASON.vendaBalcao, "Venda balcão", "out"),
    mk(REASON.devolucao, "Devolução", "in"),
    mk(REASON.ajusteSistema, "Ajuste de sistema", "adjustment"),
  ];
}

function buildStockDestinations(): Row[] {
  return [
    {
      id: uuid(),
      name: "Setor de Produção",
      kind: "sector",
      active: true,
      created_at: isoAt(-100),
      updated_at: isoAt(-100),
    },
    {
      id: uuid(),
      name: "Consumo Interno",
      kind: "consumer",
      active: true,
      created_at: isoAt(-100),
      updated_at: isoAt(-100),
    },
  ];
}

let seeded = false;

function ensureSeeded() {
  if (seeded) return;
  seeded = true;

  store.set("suppliers", buildSuppliers());
  store.set("locations", buildLocations());
  store.set("products", buildProducts());
  store.set("product_batches", buildBatches());

  const { orders, items: poItems } = buildPurchaseOrders();
  store.set("purchase_orders", orders);
  store.set("purchase_order_items", poItems);

  store.set("stock_movements", buildMovements());

  const { sessions, items: countItems } = buildCountSessions();
  store.set("count_sessions", sessions);
  store.set("count_items", countItems);

  store.set("movement_reasons", buildMovementReasons());
  store.set("stock_destinations", buildStockDestinations());
  store.set("purchase_rules", [
    {
      id: uuid(),
      approval_min_amount: 3000,
      active: true,
      created_at: isoAt(-100),
      updated_at: isoAt(-100),
    },
  ]);
}

export async function previewRequest<R>(method: string, path: string, body?: unknown): Promise<R> {
  ensureSeeded();
  const match = path.match(/^\/data\/([^/]+)(?:\/(.+))?$/);
  if (!match) throw new Error(`[preview] rota desconhecida: ${path}`);
  const [, table, id] = match;
  const rows = seed(table);

  switch (method) {
    case "GET":
      return rows as unknown as R;
    case "POST": {
      const row: Row = { id: uuid(), ...(body as Row) };
      rows.push(row);
      return row as unknown as R;
    }
    case "PATCH": {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`[preview] registro não encontrado: ${table}/${id}`);
      rows[idx] = { ...rows[idx], ...(body as Row) };
      return rows[idx] as unknown as R;
    }
    case "DELETE": {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx !== -1) rows.splice(idx, 1);
      return undefined as unknown as R;
    }
    default:
      throw new Error(`[preview] método desconhecido: ${method}`);
  }
}

const PREVIEW_USERS = {
  admin: { id: "preview-admin", name: "Ana (Admin)", email: "ana.admin@masia.cloud" },
  manager: { id: "preview-manager", name: "Marcos (Gerente)", email: "marcos.gerente@masia.cloud" },
  rep: { id: "preview-rep", name: "Rafa (Operador)", email: "rafa.operador@masia.cloud" },
};

/**
 * Papel simulado no preview: lido de `?previewRole=` na URL (link direto) ou
 * de `localStorage` (setado pelo seletor visível em `MockRoleSwitcher`).
 * URL tem prioridade — permite mandar um link já no papel certo.
 */
function previewRole(): "admin" | "manager" | "rep" {
  if (typeof window === "undefined") return "admin";
  const fromUrl = new URLSearchParams(window.location.search).get("previewRole");
  if (fromUrl === "rep" || fromUrl === "manager" || fromUrl === "admin") return fromUrl;
  const fromStorage = window.localStorage?.getItem("mockRole");
  if (fromStorage === "rep" || fromStorage === "manager" || fromStorage === "admin")
    return fromStorage;
  return "admin";
}

export async function previewAuthRequest<R>(path: string, _body?: unknown): Promise<R> {
  if (path === "/get-session") {
    const role = previewRole();
    return { user: PREVIEW_USERS[role], role } as unknown as R;
  }
  if (path === "/sign-in/email" || path === "/sign-up/email") {
    return { user: PREVIEW_USERS[previewRole()] } as unknown as R;
  }
  return undefined as unknown as R;
}
