import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Link as LinkIcon, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { invokeEdge } from "@/lib/edge-fn";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
import { mapSupabaseError } from "@/lib/errors";

interface IntegrationRow {
  id: string;
  type: string;
  is_active: boolean;
  config: unknown;
  updated_at: string;
}

interface Props {
  integration?: IntegrationRow;
  onSaved: () => void;
}

export function SaleWebhookCard({ integration, onSaved }: Props) {
  const [isActive, setIsActive] = useState(integration?.is_active ?? true);
  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/sale-webhook`;

  const save = useMutation({
    mutationFn: async (regenerate: boolean) =>
      invokeEdge<{ success: boolean; secret?: string }>("admin-integrations", {
        action: "upsert",
        type: "sale_webhook",
        is_active: isActive,
        secret: regenerate ? null : undefined,
      }),
    onSuccess: (r) => {
      if (r.secret) setSecret(r.secret);
      setShowSecret(true);
      toast.success("Webhook atualizado.");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const reveal = useMutation({
    mutationFn: async () =>
      invokeEdge<{ secret: string }>("admin-integrations", {
        action: "get_webhook_secret",
      }),
    onSuccess: (r) => {
      setSecret(r.secret);
      setShowSecret(true);
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const remove = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "delete",
        type: "sale_webhook",
      }),
    onSuccess: () => {
      toast.success("Webhook removido.");
      setSecret(null);
      setDeleteOpen(false);
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência.");
  };

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="h-4 w-4 text-accent-primary" />
            Webhook de vendas
            {integration && (
              <Badge variant="secondary" className="ml-1">
                {integration.is_active ? "Ativo" : "Desativado"}
              </Badge>
            )}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Receba eventos de venda de lojas compatíveis (Shopify, custom). A cada venda, o estoque
            é decrementado automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label className="text-sm">Ativo</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Endpoint (POST)</Label>
          <div className="mt-1 flex gap-2">
            <Input value={endpoint} readOnly className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={() => copy(endpoint)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">X-Webhook-Secret (header)</Label>
          <div className="mt-1 flex gap-2">
            <Input
              value={
                secret
                  ? showSecret
                    ? secret
                    : "•".repeat(Math.min(secret.length, 32))
                  : integration
                    ? "••••••••••••••••••••"
                    : "Ainda não configurado"
              }
              readOnly
              className="font-mono text-xs"
            />
            {secret && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowSecret((v) => !v)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            {secret ? (
              <Button type="button" variant="outline" size="icon" onClick={() => copy(secret)}>
                <Copy className="h-4 w-4" />
              </Button>
            ) : integration ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => reveal.mutate()}
                disabled={reveal.isPending}
              >
                {reveal.isPending ? "..." : "Revelar"}
              </Button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Envie este valor no header <code>X-Webhook-Secret</code> em cada requisição.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate(false)} disabled={save.isPending}>
            {integration ? "Salvar alterações" : "Ativar webhook"}
          </Button>
          {integration && (
            <>
              <Button variant="outline" onClick={() => save.mutate(true)} disabled={save.isPending}>
                Gerar novo secret
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remover
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso invalida o secret atual. Integrações externas deixarão de funcionar
              imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
