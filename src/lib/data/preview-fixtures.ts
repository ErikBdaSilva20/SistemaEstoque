// PROTEGIDO — usado pelo client.ts quando window.__MASI_PREVIEW__ === true
// (editor por IA / Sandpack do hub). RECONSTRUÍDO a partir da spec (§B5) — este
// ambiente não tem acesso ao editor Sandpack real para validar o formato exato
// das fixtures; a implementação abaixo é um mock local em memória equivalente.

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

export async function previewRequest<R>(method: string, path: string, body?: unknown): Promise<R> {
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

const PREVIEW_USER = { id: "preview-user", name: "Usuário Preview", email: "preview@masia.cloud" };

export async function previewAuthRequest<R>(path: string, _body?: unknown): Promise<R> {
  if (path === "/get-session") {
    return { user: PREVIEW_USER, role: "admin" } as unknown as R;
  }
  if (path === "/sign-in/email" || path === "/sign-up/email") {
    return { user: PREVIEW_USER } as unknown as R;
  }
  return undefined as unknown as R;
}
