/**
 * Converte erros crus do gateway/Postgres/Zod em mensagens curtas em
 * PT-BR adequadas a usuários finais — sem vazar stack traces ou texto
 * interno de erro do banco.
 *
 * Uso:
 *   toast.error(mapGatewayError(e));
 *
 * Também expõe `toastError(e, toast.error)` que loga o erro cru em
 * console + mostra a mensagem mapeada, útil quando se quer preservar
 * o diagnóstico pro dev sem expor ao usuário.
 */

const PG_CODE_MESSAGES: Record<string, string> = {
  "23505": "Registro duplicado. Verifique campos únicos.",
  "23503": "Operação bloqueada: há vínculos em outras tabelas.",
  "23502": "Campo obrigatório não preenchido.",
  "23514": "Valor inválido para uma das regras (CHECK constraint).",
  "22P02": "Formato de dado inválido.",
  "22001": "Texto maior do que o permitido.",
  "22003": "Número fora do intervalo permitido.",
  "40001": "Conflito de concorrência — tente novamente.",
  "40P01": "Deadlock — tente novamente em instantes.",
  "42501": "Sem permissão pra executar esta operação.",
  "42P01": "Recurso não encontrado.",
  "42703": "Campo inexistente.",
  PGRST116: "Registro não encontrado.",
  PGRST301: "Sem permissão ou o registro não existe.",
  PGRST302: "Não autenticado.",
};

const TEXT_PATTERNS: Array<[RegExp, string]> = [
  [/violates row-level security/i, "Sem permissão para esta operação."],
  [/row-level security/i, "Sem permissão para esta operação."],
  [/duplicate key value/i, "Já existe um registro com esses dados."],
  [/foreign key constraint/i, "Operação bloqueada: há vínculos em outras tabelas."],
  [/check constraint/i, "Valor inválido."],
  [/invalid input syntax for type uuid/i, "Identificador inválido."],
  [/invalid input syntax/i, "Formato de dado inválido."],
  [/new row for relation .* violates/i, "Valor inválido para esta tabela."],
  [/JWT expired/i, "Sessão expirada. Faça login novamente."],
  [/Invalid JWT/i, "Sessão inválida. Faça login novamente."],
  [/Invalid login credentials/i, "Email ou senha incorretos."],
  [/Email not confirmed/i, "Confirme seu email antes de fazer login."],
  [/User already registered/i, "Este email já está cadastrado."],
  [/too many requests/i, "Muitas tentativas. Aguarde um minuto."],
  [/rate limit/i, "Limite de requisições atingido. Aguarde um instante."],
  [/network|fetch failed|ENOTFOUND/i, "Falha de rede. Verifique sua conexão."],
  [/timeout/i, "A operação demorou demais. Tente novamente."],
  [/Method not allowed/i, "Operação não permitida."],
  [/Method Not Allowed/i, "Operação não permitida."],
  [/Unauthorized|Invalid token|401/i, "Sessão inválida. Faça login novamente."],
  [/Acesso negado/i, "Acesso negado."],
];

interface MaybeSupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  name?: string;
}

export function mapGatewayError(
  err: unknown,
  fallback = "Não foi possível concluir a operação.",
): string {
  if (err == null) return fallback;

  const e = (typeof err === "object" ? err : {}) as MaybeSupabaseError;
  const raw =
    (typeof err === "string" ? err : e.message) ??
    (err as { toString?: () => string })?.toString?.() ??
    "";
  const code = e.code;

  if (code && PG_CODE_MESSAGES[code]) return PG_CODE_MESSAGES[code];

  for (const [re, msg] of TEXT_PATTERNS) {
    if (re.test(raw)) return msg;
  }

  if (e.status === 401) return "Sessão inválida. Faça login novamente.";
  if (e.status === 403) return "Sem permissão pra esta operação.";
  if (e.status === 404) return "Registro não encontrado.";
  if (e.status === 429) return "Muitas requisições. Aguarde um instante.";
  if (e.status && e.status >= 500) return "Erro interno do servidor. Tente novamente.";

  if (raw && raw.length > 0 && raw.length < 120 && !/\bat\s+.*\(.*:\d+:\d+\)/.test(raw)) {
    return raw;
  }

  return fallback;
}

/**
 * Mapeia pra mensagem amigável E loga o original no console (apenas em dev,
 * pra não poluir produção).
 */
export function toastError(err: unknown, toast: (msg: string) => void, fallback?: string): void {
  if (import.meta.env.DEV) {
    console.error("[toastError]", err);
  }
  toast(mapGatewayError(err, fallback));
}
