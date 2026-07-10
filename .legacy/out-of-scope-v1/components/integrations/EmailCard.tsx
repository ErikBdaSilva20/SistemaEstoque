import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { invokeEdge } from "@/lib/edge-fn";
import { mapSupabaseError } from "@/lib/errors";

interface IntegrationRow {
  id: string;
  type: string;
  is_active: boolean;
  config: unknown;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  updated_at: string;
}

interface Props {
  integration?: IntegrationRow;
  onSaved: () => void;
}

interface Config {
  from_email?: string;
  from_name?: string | null;
  recipients?: string[];
}

export function EmailCard({ integration, onSaved }: Props) {
  const cfg = (integration?.config as Config | undefined) ?? {};

  const [isActive, setIsActive] = useState(integration?.is_active ?? true);
  const [fromEmail, setFromEmail] = useState(cfg.from_email ?? "");
  const [fromName, setFromName] = useState(cfg.from_name ?? "");
  const [apikey, setApikey] = useState("");
  const [recipients, setRecipients] = useState<string[]>(cfg.recipients ?? []);
  const [newRecipient, setNewRecipient] = useState("");
  const [testTo, setTestTo] = useState("");

  const save = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "upsert",
        type: "email_resend",
        is_active: isActive,
        from_email: fromEmail,
        from_name: fromName.trim() || null,
        apikey: apikey.trim() || null,
        recipients,
      }),
    onSuccess: () => {
      toast.success("Configuração de email salva.");
      setApikey("");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const test = useMutation({
    mutationFn: async () =>
      invokeEdge<{ ok: boolean; message: string }>("admin-integrations", {
        action: "test_email",
        to: testTo.trim() || undefined,
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const remove = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "delete",
        type: "email_resend",
      }),
    onSuccess: () => {
      toast.success("Integração de email removida.");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const addRecipient = () => {
    const v = newRecipient.trim();
    if (!v.includes("@") || v.length < 5) {
      toast.error("Email inválido.");
      return;
    }
    if (recipients.includes(v)) return;
    setRecipients([...recipients, v]);
    setNewRecipient("");
  };

  const removeRecipient = (v: string) => {
    setRecipients(recipients.filter((r) => r !== v));
  };

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-accent-primary" />
            Email (Resend)
            {integration && (
              <Badge variant="secondary" className="ml-1">
                {integration.is_active ? "Ativo" : "Desativado"}
              </Badge>
            )}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Envia notificações por email como alternativa ao WhatsApp. Requer conta no Resend
            (resend.com).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label className="text-sm">Ativo</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">
              Email remetente (verificado no Resend)
            </Label>
            <Input
              type="email"
              placeholder="estoque@seudominio.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nome do remetente</Label>
            <Input
              placeholder="Compras & Estoque"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">API key do Resend</Label>
          <Input
            type="password"
            placeholder={integration ? "•••••••• (deixe vazio para manter)" : "re_..."}
            value={apikey}
            onChange={(e) => setApikey(e.target.value)}
            className="mt-1 font-mono text-sm"
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Destinatários (emails separados)</Label>
          <div className="mt-1 flex gap-2">
            <Input
              type="email"
              placeholder="equipe@seudominio.com"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient();
                }
              }}
              className="text-sm"
            />
            <Button type="button" variant="outline" onClick={addRecipient}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>
          {recipients.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {recipients.map((r) => (
                <Badge key={r} variant="secondary" className="gap-1 text-xs">
                  {r}
                  <button
                    type="button"
                    onClick={() => removeRecipient(r)}
                    className="ml-1 rounded-full hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {integration?.last_tested_at && (
          <div
            className={`rounded-md p-2 text-xs ${
              integration.last_test_ok
                ? "bg-accent-success/10 text-accent-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            Último teste: {new Date(integration.last_tested_at).toLocaleString("pt-BR")} —{" "}
            {integration.last_test_message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {integration ? "Salvar alterações" : "Ativar Email"}
          </Button>
          {integration && (
            <>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="testar p/ email específico"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  className="w-56 text-xs"
                />
                <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending}>
                  {test.isPending ? "Enviando..." : "Enviar teste"}
                </Button>
              </div>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remover
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
