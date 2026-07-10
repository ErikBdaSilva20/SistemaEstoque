import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, KeyRound, CheckCircle2, XCircle, Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { invokeEdge } from "@/lib/edge-fn";
import { mapSupabaseError } from "@/lib/errors";

interface ApiKeyRow {
  id: string;
  provider: "openai" | "anthropic";
  label: string | null;
  last_four: string;
  is_valid: boolean;
  last_validated_at: string | null;
  updated_at: string;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Provider = "openai" | "anthropic";

const PROVIDER_META: Record<Provider, { name: string; placeholder: string; help: string }> = {
  openai: {
    name: "OpenAI",
    placeholder: "sk-...",
    help: "Crie em platform.openai.com → API keys",
  },
  anthropic: {
    name: "Anthropic",
    placeholder: "sk-ant-...",
    help: "Crie em console.anthropic.com → API keys",
  },
};

export function ApiKeysSettings() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => invokeEdge<{ keys: ApiKeyRow[] }>("admin-api-keys", { action: "list" }),
    retry: false,
  });

  const [editing, setEditing] = useState<Provider | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [labelInput, setLabelInput] = useState("");

  const upsertMut = useMutation({
    mutationFn: (vars: { provider: Provider; apiKey: string; label: string }) =>
      invokeEdge<{ success: boolean; last_four: string }>("admin-api-keys", {
        action: "upsert",
        provider: vars.provider,
        api_key: vars.apiKey,
        label: vars.label || null,
      }),
    onSuccess: () => {
      toast.success("Chave salva e validada.");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setEditing(null);
      setKeyInput("");
      setLabelInput("");
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (provider: Provider) =>
      invokeEdge<{ success: boolean }>("admin-api-keys", {
        action: "delete",
        provider,
      }),
    onSuccess: () => {
      toast.success("Chave removida.");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const testMut = useMutation({
    mutationFn: (provider: Provider) =>
      invokeEdge<{ ok: boolean; message: string }>("admin-api-keys", {
        action: "test",
        provider,
      }),
    onSuccess: (res) => {
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const keys = data?.keys ?? [];
  const getKey = (p: Provider) => keys.find((k) => k.provider === p);
  const accessDenied =
    error instanceof Error && error.message.toLowerCase().includes("somente administradores");

  const openEdit = (p: Provider) => {
    setEditing(p);
    setKeyInput("");
    const existing = getKey(p);
    setLabelInput(existing?.label ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    upsertMut.mutate({ provider: editing, apiKey: keyInput, label: labelInput });
  };

  if (accessDenied) {
    return (
      <Alert>
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>
          Apenas administradores podem gerenciar API Keys e consumo de IA.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {(["openai", "anthropic"] as const).map((provider) => {
        const meta = PROVIDER_META[provider];
        const k = getKey(provider);
        return (
          <Card key={provider} className="rounded-2xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{meta.name}</CardTitle>
                    <CardDescription>{meta.help}</CardDescription>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : k ? (
                  k.is_valid ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Válida
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Inválida
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline">Não configurada</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : k ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-foreground">••••••••••••{k.last_four}</p>
                    {k.label && <p className="text-xs text-muted-foreground">{k.label}</p>}
                    {k.last_validated_at && (
                      <p className="text-xs text-muted-foreground">
                        Última validação: {new Date(k.last_validated_at).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testMut.mutate(provider)}
                      disabled={testMut.isPending}
                    >
                      {testMut.isPending && testMut.variables === provider ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Testar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(provider)}>
                      Substituir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Remover a chave ${meta.name}?`)) {
                          deleteMut.mutate(provider);
                        }
                      }}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => openEdit(provider)} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                  Adicionar chave
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing && `Configurar chave ${PROVIDER_META[editing].name}`}
              </DialogTitle>
              <DialogDescription>
                A chave será validada com uma chamada real à API antes de ser salva no Supabase
                Vault.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  autoComplete="off"
                  placeholder={editing ? PROVIDER_META[editing].placeholder : ""}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  required
                  minLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Rótulo (opcional)</Label>
                <Input
                  id="label"
                  placeholder="Ex: Conta principal"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertMut.isPending}>
                {upsertMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Validar e salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
