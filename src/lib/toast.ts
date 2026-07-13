/**
 * Ponto único de disparo de toast do app — sempre passa erros por
 * `mapGatewayError` antes de exibir, então nunca vaza mensagem crua do
 * gateway/Postgres pro usuário. Substitui o padrão repetido
 * `toast.error(mapGatewayError(e))` espalhado pelos componentes.
 */
import { toast } from "sonner";
import { mapGatewayError } from "./errors";

export function toastSuccess(message: string): void {
  toast.success(message);
}

export function toastError(err: unknown, fallback?: string): void {
  if (import.meta.env.DEV) {
    console.error("[toastError]", err);
  }
  toast.error(mapGatewayError(err, fallback));
}
