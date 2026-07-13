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
    __MASI_PREVIEW__?: boolean;
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

function isPreview(): boolean {
  return typeof window !== "undefined" && window.__MASI_PREVIEW__ === true;
}

export class GatewayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
  }
}

async function api<R>(method: string, path: string, body?: unknown): Promise<R> {
  if (isPreview()) {
    const { previewRequest } = await import("@mock/preview-fixtures");
    return previewRequest<R>(method, path, body);
  }

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
  if (isPreview()) {
    const { previewAuthRequest } = await import("@mock/preview-fixtures");
    return previewAuthRequest<R>(path, body);
  }

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

export const auth = {
  signIn: (email: string, password: string) =>
    authApi<{ user: AuthUser }>("POST", "/sign-in/email", { email, password }),
  signUp: (name: string, email: string, password: string) =>
    authApi<{ user: AuthUser }>("POST", "/sign-up/email", { name, email, password }),
  signOut: () => authApi<void>("POST", "/sign-out"),
  me: () => authApi<AuthSession | null>("GET", "/get-session"),
};
