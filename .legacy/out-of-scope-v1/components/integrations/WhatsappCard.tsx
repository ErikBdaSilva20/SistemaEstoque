import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  base_url?: string;
  instance?: string;
  recipients?: string[];
  status?: "qr_pending" | "connecting" | "open" | "close" | "unknown";
}

type ViewState = "setup" | "qr" | "connected";

function HowToObtain() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
          <HelpCircle className="h-3.5 w-3.5" />
          Como obter?
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 text-sm" align="end">
        <div className="space-y-2">
          <p className="font-medium">Servidor Evolution API</p>
          <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
            <li>
              Suba o Evolution API em uma VPS via Docker (~R$30/mês) ou contrate um SaaS gerenciado.
            </li>
            <li>
              Copie a <strong>URL pública</strong> (ex.:{" "}
              <code>https://evolution.seudominio.com</code>).
            </li>
            <li>
              Copie a <strong>AUTHENTICATION_API_KEY</strong> definida no <code>.env</code> do
              servidor.
            </li>
            <li>Cole aqui, clique em "Criar instância" e escaneie o QR. Pronto.</li>
          </ol>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function WhatsappCard({ integration, onSaved }: Props) {
  const cfg = (integration?.config as Config | undefined) ?? {};

  // Determina o estado a partir da integração existente
  const initialState: ViewState = !integration
    ? "setup"
    : cfg.status === "open" || (integration.is_active && !cfg.status)
      ? "connected"
      : "qr";

  const [view, setView] = useState<ViewState>(initialState);
  const [baseUrl, setBaseUrl] = useState(cfg.base_url ?? "");
  const [apikey, setApikey] = useState("");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<string[]>(cfg.recipients ?? []);
  const [newRecipient, setNewRecipient] = useState("");
  const [testTo, setTestTo] = useState("");

  // Sincroniza quando a integração muda (refetch externo)
  useEffect(() => {
    setRecipients(cfg.recipients ?? []);
    if (cfg.base_url) setBaseUrl(cfg.base_url);
    if (!integration) {
      setView("setup");
    } else if (cfg.status === "open" || (integration.is_active && !cfg.status)) {
      setView("connected");
    } else {
      setView("qr");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integration?.id, integration?.is_active, cfg.status]);

  // ============ MUTATIONS ============
  const createInstance = useMutation({
    mutationFn: async () =>
      invokeEdge<{ instance: string; qrcode_base64: string | null }>("admin-integrations", {
        action: "whatsapp_create_instance",
        base_url: baseUrl.trim(),
        apikey: apikey.trim(),
      }),
    onSuccess: (r) => {
      setQrBase64(r.qrcode_base64);
      setApikey("");
      setView("qr");
      toast.success("Instância criada. Escaneie o QR Code.");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const refreshQr = useMutation({
    mutationFn: async () =>
      invokeEdge<{ qrcode_base64: string | null }>("admin-integrations", {
        action: "whatsapp_get_qr",
      }),
    onSuccess: (r) => {
      setQrBase64(r.qrcode_base64);
      toast.success("QR Code atualizado.");
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const disconnect = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "whatsapp_disconnect",
      }),
    onSuccess: () => {
      toast.success("WhatsApp desconectado.");
      setQrBase64(null);
      setView("setup");
      setBaseUrl("");
      setApikey("");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const saveRecipients = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "upsert",
        type: "whatsapp_evolution",
        is_active: true,
        base_url: cfg.base_url,
        instance: cfg.instance,
        recipients,
      }),
    onSuccess: () => {
      toast.success("Destinatários salvos.");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const test = useMutation({
    mutationFn: async () =>
      invokeEdge<{ ok: boolean; message: string }>("admin-integrations", {
        action: "test_whatsapp",
        to: testTo.trim() || undefined,
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  // ============ POLLING DE STATUS (estado QR) ============
  const pollingRef = useRef<number | null>(null);
  useEffect(() => {
    if (view !== "qr") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const tick = async () => {
      try {
        const r = await invokeEdge<{ status: string }>("admin-integrations", {
          action: "whatsapp_status",
        });
        if (r.status === "open") {
          toast.success("WhatsApp conectado!");
          onSaved();
          setView("connected");
        }
      } catch {
        // silencia erros de polling
      }
    };

    pollingRef.current = window.setInterval(tick, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [view, onSaved]);

  // ============ HANDLERS ============
  const addRecipient = () => {
    const v = newRecipient.replace(/\D/g, "");
    if (v.length < 10) {
      toast.error("Número inválido. Use formato com DDI: 5511988887777");
      return;
    }
    if (recipients.includes(v)) return;
    setRecipients([...recipients, v]);
    setNewRecipient("");
  };

  const removeRecipient = (v: string) => {
    setRecipients(recipients.filter((r) => r !== v));
  };

  // ============ RENDER ============
  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-accent-success" />
            WhatsApp (Evolution API)
            {view === "connected" && (
              <Badge className="ml-1 gap-1 bg-accent-success/15 text-accent-success hover:bg-accent-success/20">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </Badge>
            )}
            {view === "qr" && (
              <Badge variant="secondary" className="ml-1 gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando QR
              </Badge>
            )}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Notificações de estoque crítico e pedidos via Evolution API self-hosted.
          </p>
        </div>
        <HowToObtain />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ============ ESTADO A: SETUP ============ */}
        {view === "setup" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">URL do servidor Evolution</Label>
              <Input
                placeholder="https://evolution.seudominio.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                API key (AUTHENTICATION_API_KEY)
              </Label>
              <Input
                type="password"
                placeholder="sua-apikey-aqui"
                value={apikey}
                onChange={(e) => setApikey(e.target.value)}
                className="mt-1 font-mono text-sm"
                autoComplete="new-password"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => createInstance.mutate()}
              disabled={createInstance.isPending || !baseUrl.trim() || !apikey.trim()}
            >
              {createInstance.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando instância...
                </>
              ) : (
                "Criar instância e gerar QR Code"
              )}
            </Button>
          </>
        )}

        {/* ============ ESTADO B: QR CODE ============ */}
        {view === "qr" && (
          <>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6">
              {qrBase64 ? (
                <img
                  src={qrBase64}
                  alt="QR Code WhatsApp"
                  className="h-64 w-64 rounded-md bg-white p-2 shadow-elevation-1"
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-md border bg-white">
                  <div className="text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Carregando QR...
                  </div>
                </div>
              )}
              <div className="text-center text-sm">
                <p className="font-medium">Abra o WhatsApp no celular</p>
                <p className="text-muted-foreground">
                  Menu → <strong>Aparelhos conectados</strong> → Conectar um aparelho
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando conexão...
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => refreshQr.mutate()}
                disabled={refreshQr.isPending}
              >
                <RefreshCw
                  className={`mr-1 h-4 w-4 ${refreshQr.isPending ? "animate-spin" : ""}`}
                />
                Atualizar QR
              </Button>
              <Button
                variant="ghost"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                <X className="mr-1 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </>
        )}

        {/* ============ ESTADO C: CONECTADO ============ */}
        {view === "connected" && (
          <>
            <div className="rounded-md bg-accent-success/10 p-3 text-sm">
              <p className="font-medium text-accent-success">
                WhatsApp conectado e pronto para enviar notificações.
              </p>
              {cfg.instance && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Instância: <code className="font-mono">{cfg.instance}</code>
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                Destinatários (DDI + número, ex: 5511988887777)
              </Label>
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="5511988887777"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  className="font-mono text-sm"
                />
                <Button type="button" variant="outline" onClick={addRecipient}>
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {recipients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {recipients.map((r) => (
                    <Badge key={r} variant="secondary" className="gap-1 font-mono text-xs">
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
              <Button onClick={() => saveRecipients.mutate()} disabled={saveRecipients.isPending}>
                {saveRecipients.isPending ? "Salvando..." : "Salvar destinatários"}
              </Button>

              <div className="ml-auto flex items-center gap-2">
                <Input
                  placeholder="testar para nº específico"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  className="w-56 font-mono text-xs"
                />
                <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending}>
                  {test.isPending ? "Enviando..." : "Enviar teste"}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Desconectar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
