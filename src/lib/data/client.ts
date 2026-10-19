// PROTEGIDO — contrato com o tenant-gateway. Não editar por story de feature.
//
// RECONSTRUÍDO A PARTIR DA SPEC (docs/reference/Importantdoc.md §B5, §B8), NÃO copiado
// do scaffold `wiki` real: este ambiente de trabalho não tem acesso ao repositório
// `masi-ai-orquestration/clone-templates/wiki` nem a um `tenant-gateway` rodando.
// Sem um gateway real para validar contra, os endpoints de auth abaixo
// (`/api/auth/*`) são uma suposição razoável seguindo a convenção do Better-Auth —
// se o gateway real usar outro caminho, ajuste só esta função `authApi`.
//
// API pública (não muda):
//   db.table(nome).list/create/update/remove()
//   auth.signIn/signUp/signOut/me()

type GatewayConfig = {
  url: string;
  tenantId: string;
};

declare global {
  interface Window {
    __MASI_GW__?: string;
    __MASI_TENANT__?: string;
  }
}

function readConfig(): GatewayConfig {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

  const url =
    params?.get("gw") ||
    window.__MASI_GW__ ||
    (import.meta.env.VITE_GATEWAY_URL as string | undefined) ||
    "";

  const tenantId = params?.get("t") || window.__MASI_TENANT__ || "";

  return { url, tenantId };
}

export class GatewayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
  }
}

// MODO MOCK — pra rodar o app sem tenant-gateway (ex.: portfólio/prints em
// acervoPrints/). Ligado via VITE_MOCK_PREVIEW=true no .env. Com a flag
// desligada, api()/authApi() seguem batendo no gateway real como sempre.
const MOCK = import.meta.env.VITE_MOCK_PREVIEW === "true";

const now = new Date().toISOString();

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Histórico espalhado por ~6 meses (não só "hoje"), pra alimentar o gráfico
// do Dashboard com tendência real em vez de um ponto só.
const movementSeed: Array<{
  day: number;
  product: string;
  name: string;
  type: "in" | "out" | "adjustment";
  qty: number;
}> = [
  { day: 175, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "in", qty: 300 },
  { day: 168, product: "prod-2", name: "Luva de Proteção Nitrílica", type: "out", qty: 40 },
  { day: 160, product: "prod-4", name: "Fita Isolante 20m", type: "in", qty: 150 },
  { day: 151, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "out", qty: 60 },
  { day: 143, product: "prod-3", name: "Óleo Lubrificante 1L", type: "in", qty: 80 },
  { day: 134, product: "prod-2", name: "Luva de Proteção Nitrílica", type: "out", qty: 35 },
  { day: 126, product: "prod-4", name: "Fita Isolante 20m", type: "out", qty: 70 },
  { day: 117, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "in", qty: 400 },
  { day: 109, product: "prod-3", name: "Óleo Lubrificante 1L", type: "out", qty: 25 },
  { day: 100, product: "prod-2", name: "Luva de Proteção Nitrílica", type: "in", qty: 100 },
  { day: 92, product: "prod-4", name: "Fita Isolante 20m", type: "in", qty: 120 },
  { day: 83, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "out", qty: 90 },
  { day: 75, product: "prod-3", name: "Óleo Lubrificante 1L", type: "adjustment", qty: -4 },
  { day: 66, product: "prod-2", name: "Luva de Proteção Nitrílica", type: "out", qty: 55 },
  { day: 58, product: "prod-4", name: "Fita Isolante 20m", type: "in", qty: 200 },
  { day: 49, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "in", qty: 250 },
  { day: 41, product: "prod-3", name: "Óleo Lubrificante 1L", type: "in", qty: 60 },
  { day: 32, product: "prod-2", name: "Luva de Proteção Nitrílica", type: "out", qty: 48 },
  { day: 24, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "out", qty: 70 },
  { day: 15, product: "prod-4", name: "Fita Isolante 20m", type: "out", qty: 85 },
  { day: 7, product: "prod-3", name: "Óleo Lubrificante 1L", type: "in", qty: 40 },
  { day: 2, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "in", qty: 500 },
  { day: 1, product: "prod-1", name: "Parafuso Sextavado 1/4\"", type: "out", qty: 80 },
  { day: 0, product: "prod-3", name: "Óleo Lubrificante 1L", type: "adjustment", qty: -2 },
];

const mockData: Record<string, Record<string, unknown>[]> = {
  movement_reasons: [
    { id: "mr-1", label: "Venda balcão", scope: "out", active: true, created_at: now, updated_at: now },
    { id: "mr-2", label: "Recebimento de compra", scope: "in", active: true, created_at: now, updated_at: now },
    { id: "mr-3", label: "Ajuste de contagem", scope: "adjustment", active: true, created_at: now, updated_at: now },
    { id: "mr-4", label: "Avaria/perda", scope: "out", active: true, created_at: now, updated_at: now },
  ],
  stock_destinations: [
    { id: "sd-1", name: "Produção", kind: "sector", active: true, created_at: now, updated_at: now },
    { id: "sd-2", name: "Manutenção", kind: "sector", active: true, created_at: now, updated_at: now },
    { id: "sd-3", name: "Cliente final", kind: "consumer", active: true, created_at: now, updated_at: now },
  ],
  purchase_rules: [
    { id: "pr-1", approval_min_amount: 2000, active: true, created_at: now, updated_at: now },
  ],
  suppliers: [
    { id: "sup-1", name: "Distribuidora Vitória", cnpj: "12.345.678/0001-90", email: "contato@vitoria.com.br", phone: "(11) 4002-8922", lead_time_days: 5, notes: null, active: true, created_at: now, updated_at: now },
    { id: "sup-2", name: "Ferragens Norte", cnpj: "98.765.432/0001-10", email: "vendas@ferragensnorte.com.br", phone: "(21) 3003-1234", lead_time_days: 10, notes: null, active: true, created_at: now, updated_at: now },
    { id: "sup-3", name: "Comercial Brasil Peças", cnpj: "45.678.912/0001-55", email: "sac@brasilpecas.com.br", phone: "(31) 3222-7788", lead_time_days: 7, notes: null, active: true, created_at: now, updated_at: now },
  ],
  locations: [
    { id: "loc-1", name: "Depósito Central", code: "DEP-01", kind: "warehouse", address: "Av. Industrial, 1200", notes: null, is_default: true, active: true, created_at: now, updated_at: now },
    { id: "loc-2", name: "Loja Centro", code: "LOJ-01", kind: "store", address: "Rua das Flores, 45", notes: null, is_default: false, active: true, created_at: now, updated_at: now },
  ],
  products: [
    { id: "prod-1", sku: "PRD-0001", name: "Parafuso Sextavado 1/4\"", description: "Caixa com 100 unidades", category: "Fixadores", brand: "Fixtec", model: null, unit: "cx", cost_price: 18.5, sale_price: 32.9, current_stock: 420, min_stock: 100, barcode: "7891234560012", ncm: null, cest: null, origin: null, weight_kg: 2.1, dimensions: null, technical_spec: null, internal_notes: null, supplier_id: "sup-1", track_batches: false, track_locations: true, active: true, created_at: now, updated_at: now },
    { id: "prod-2", sku: "PRD-0002", name: "Luva de Proteção Nitrílica", description: "Par, tamanho M", category: "EPI", brand: "SafeMax", model: null, unit: "par", cost_price: 6.2, sale_price: 14.9, current_stock: 65, min_stock: 50, barcode: "7891234560029", ncm: null, cest: null, origin: null, weight_kg: 0.1, dimensions: null, technical_spec: null, internal_notes: null, supplier_id: "sup-2", track_batches: true, track_locations: true, active: true, created_at: now, updated_at: now },
    { id: "prod-3", sku: "PRD-0003", name: "Óleo Lubrificante 1L", description: "Multiuso industrial", category: "Lubrificantes", brand: "LubriMax", model: null, unit: "un", cost_price: 22.0, sale_price: 39.9, current_stock: 18, min_stock: 30, barcode: "7891234560036", ncm: null, cest: null, origin: null, weight_kg: 1.0, dimensions: null, technical_spec: null, internal_notes: null, supplier_id: "sup-3", track_batches: true, track_locations: false, active: true, created_at: now, updated_at: now },
    { id: "prod-4", sku: "PRD-0004", name: "Fita Isolante 20m", description: null, category: "Elétrica", brand: "Voltplus", model: null, unit: "un", cost_price: 3.4, sale_price: 8.5, current_stock: 210, min_stock: 80, barcode: "7891234560043", ncm: null, cest: null, origin: null, weight_kg: 0.05, dimensions: null, technical_spec: null, internal_notes: null, supplier_id: "sup-1", track_batches: false, track_locations: false, active: true, created_at: now, updated_at: now },
  ],
  product_batches: [
    { id: "pb-1", product_id: "prod-2", location_id: "loc-1", batch_code: "L2024-08", manufacture_date: "2024-08-01", expiration_date: "2026-11-15", quantity: 40, unit_cost: 6.0, notes: null, created_at: now, updated_at: now },
    { id: "pb-2", product_id: "prod-3", location_id: "loc-1", batch_code: "L2024-11", manufacture_date: "2024-11-10", expiration_date: "2026-12-01", quantity: 18, unit_cost: 21.5, notes: null, created_at: now, updated_at: now },
  ],
  stock_movements: movementSeed.map((m, i) => ({
    id: `sm-${i + 1}`,
    product_id: m.product,
    product_name: m.name,
    batch_id: null,
    location_id: "loc-1",
    destination_location_id: null,
    destination_id: m.type === "out" ? "sd-1" : null,
    type: m.type,
    origin: m.type === "in" ? "purchase" : m.type === "out" ? "sale" : "other",
    quantity: m.qty,
    reason_id: m.type === "in" ? "mr-2" : m.type === "out" ? "mr-1" : "mr-3",
    reference_id: null,
    notes: m.type === "adjustment" ? "Ajuste de contagem" : null,
    created_at: daysAgo(m.day),
  })),
  purchase_orders: [
    { id: "po-1", code: "PC-0001", supplier_id: "sup-1", supplier_name: "Distribuidora Vitória", status: "fully_received", total_amount: 1850.0, notes: null, expected_date: "2026-09-10", sent_at: now, submitted_at: now, approved_by: "Ana Martins", approved_at: now, rejected_by: null, rejected_at: null, rejection_reason: null, cancelled_at: null, received_at: now, created_at: now, updated_at: now },
    { id: "po-2", code: "PC-0002", supplier_id: "sup-3", supplier_name: "Comercial Brasil Peças", status: "pending_approval", total_amount: 790.0, notes: null, expected_date: "2026-11-05", sent_at: null, submitted_at: now, approved_by: null, approved_at: null, rejected_by: null, rejected_at: null, rejection_reason: null, cancelled_at: null, received_at: null, created_at: now, updated_at: now },
  ],
  purchase_order_items: [
    { id: "poi-1", purchase_order_id: "po-1", product_id: "prod-1", product_name: "Parafuso Sextavado 1/4\"", quantity_ordered: 100, quantity_received: 100, unit_cost: 18.5, created_at: now, updated_at: now },
    { id: "poi-2", purchase_order_id: "po-2", product_id: "prod-3", product_name: "Óleo Lubrificante 1L", quantity_ordered: 36, quantity_received: 0, unit_cost: 21.95, created_at: now, updated_at: now },
  ],
  count_sessions: [
    { id: "cs-1", code: "CT-0001", name: "Contagem geral setembro", category: null, location_id: "loc-1", status: "closed", notes: null, opened_at: now, closed_at: now, created_at: now, updated_at: now },
    { id: "cs-2", code: "CT-0002", name: "Contagem EPI", category: "EPI", location_id: "loc-1", status: "open", notes: null, opened_at: now, closed_at: null, created_at: now, updated_at: now },
  ],
  count_items: [
    { id: "ci-1", count_session_id: "cs-2", product_id: "prod-2", batch_id: "pb-1", expected_quantity: 65, counted_quantity: 62, counted_by: "Ana Martins", counted_at: now, notes: null, created_at: now, updated_at: now },
  ],
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

async function api<R>(method: string, path: string, body?: unknown): Promise<R> {
  const { url, tenantId } = readConfig();
  if (!url) {
    throw new GatewayError(
      "VITE_GATEWAY_URL não configurado — sem gateway real, este client não tem para onde apontar.",
      0,
    );
  }

  const res = await fetch(`${url}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GatewayError(text || res.statusText, res.status);
  }

  if (res.status === 204) return undefined as R;
  return (await res.json()) as R;
}

export const db = {
  table<R = unknown>(name: string) {
    if (MOCK) {
      const store = (mockData[name] ??= []);
      return {
        list: async () => clone(store) as R[],
        create: async (input: Partial<R>) => {
          const row = { id: crypto.randomUUID(), created_at: now, updated_at: now, ...input };
          store.push(row);
          return clone(row) as R;
        },
        update: async (id: string, patch: Partial<R>) => {
          const idx = store.findIndex((r) => r.id === id);
          if (idx === -1) throw new GatewayError("Registro não encontrado.", 404);
          store[idx] = { ...store[idx], ...patch, updated_at: new Date().toISOString() };
          return clone(store[idx]) as R;
        },
        remove: async (id: string) => {
          mockData[name] = store.filter((r) => r.id !== id);
        },
      };
    }

    return {
      list: () => api<R[]>("GET", `/data/${name}`),
      create: (input: Partial<R>) => api<R>("POST", `/data/${name}`, input),
      update: (id: string, patch: Partial<R>) => api<R>("PATCH", `/data/${name}/${id}`, patch),
      remove: (id: string) => api<void>("DELETE", `/data/${name}/${id}`),
    };
  },
};

export type AppRole = "admin" | "manager" | "rep";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  role: AppRole;
}

async function authApi<R>(method: string, path: string, body?: unknown): Promise<R> {
  const { url, tenantId } = readConfig();
  if (!url) {
    throw new GatewayError("VITE_GATEWAY_URL não configurado.", 0);
  }

  const res = await fetch(`${url}/api/auth${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GatewayError(text || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as R;
  return (await res.json()) as R;
}

const mockUsers: Record<AppRole, AuthUser> = {
  admin: { id: "usr-1", name: "Ana Martins", email: "ana@empresa.com" },
  manager: { id: "usr-2", name: "Carlos Souza", email: "carlos@empresa.com" },
  rep: { id: "usr-3", name: "Bruno Lima", email: "bruno@empresa.com" },
};

// Troca de papel no modo mock, sem login de verdade: abra qualquer rota com
// ?role=admin|manager|rep na URL (ex.: /dashboard?role=rep). Fica salvo no
// navegador até trocar de novo.
function getMockRole(): AppRole {
  if (typeof window === "undefined") return "admin";
  const fromUrl = new URLSearchParams(window.location.search).get("role");
  if (fromUrl === "admin" || fromUrl === "manager" || fromUrl === "rep") {
    localStorage.setItem("mockRole", fromUrl);
  }
  const stored = localStorage.getItem("mockRole");
  return stored === "admin" || stored === "manager" || stored === "rep" ? stored : "admin";
}

export const auth = MOCK
  ? {
      signIn: async () => ({ user: mockUsers[getMockRole()] }),
      signUp: async (name: string, email: string) => ({
        user: { ...mockUsers[getMockRole()], name, email },
      }),
      signOut: async () => undefined,
      me: async () => {
        const role = getMockRole();
        return { user: mockUsers[role], role };
      },
    }
  : {
      signIn: (email: string, password: string) =>
        authApi<{ user: AuthUser }>("POST", "/sign-in/email", { email, password }),
      signUp: (name: string, email: string, password: string) =>
        authApi<{ user: AuthUser }>("POST", "/sign-up/email", { name, email, password }),
      signOut: () => authApi<void>("POST", "/sign-out"),
      me: () => authApi<AuthSession | null>("GET", "/get-session"),
    };
