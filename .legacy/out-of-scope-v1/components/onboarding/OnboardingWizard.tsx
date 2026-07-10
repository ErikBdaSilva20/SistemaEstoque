import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Copy,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MinusCircle,
  Package,
  Rocket,
  ScanLine,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { invokeEdge } from "@/lib/edge-fn";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
import { ApiKeyHowToButton, type HowToProvider } from "./ApiKeyHowTo";
import { mapSupabaseError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onComplete: () => void;
}

type StepId =
  | "welcome"
  | "ai"
  | "barcode"
  | "whatsapp"
  | "email"
  | "webhook"
  | "shopify"
  | "bling"
  | "locations"
  | "done";

type StepStatus = "pending" | "configured" | "skipped";

interface StepMeta {
  id: StepId;
  icon: typeof Rocket;
  label: string;
  group: "begin" | "essential" | "notif" | "commerce" | "operations" | "end";
  /** Se true, aparece no stepper lateral. Welcome/done são ocultos. */
  stepper: boolean;
}

const STEPS: StepMeta[] = [
  { id: "welcome", icon: Rocket, label: "Boas-vindas", group: "begin", stepper: false },
  { id: "ai", icon: Bot, label: "IA (Claude)", group: "essential", stepper: true },
  { id: "barcode", icon: ScanLine, label: "Código de barras", group: "essential", stepper: true },
  { id: "whatsapp", icon: MessageCircle, label: "WhatsApp", group: "notif", stepper: true },
  { id: "email", icon: Mail, label: "Email", group: "notif", stepper: true },
  { id: "webhook", icon: ShoppingBag, label: "Webhook vendas", group: "commerce", stepper: true },
  { id: "shopify", icon: ShoppingBag, label: "Shopify", group: "commerce", stepper: true },
  { id: "bling", icon: Box, label: "Bling ERP", group: "commerce", stepper: true },
  { id: "locations", icon: MapPin, label: "Depósito", group: "operations", stepper: true },
  { id: "done", icon: CheckCircle2, label: "Concluído", group: "end", stepper: false },
];

const GROUP_LABELS: Record<StepMeta["group"], string> = {
  begin: "",
  essential: "Essenciais",
  notif: "Notificações",
  commerce: "E-commerce & ERP",
  operations: "Operações",
  end: "",
};

export function OnboardingWizard({ open, onComplete }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [statuses, setStatuses] = useState<Record<StepId, StepStatus>>(
    () => Object.fromEntries(STEPS.map((s) => [s.id, "pending"])) as Record<StepId, StepStatus>,
  );

  const current = STEPS[stepIdx];
  const stepperSteps = STEPS.filter((s) => s.stepper);
  const totalStepper = stepperSteps.length;
  const configuredCount = useMemo(
    () => stepperSteps.filter((s) => statuses[s.id] === "configured").length,
    [statuses, stepperSteps],
  );
  const skippedCount = useMemo(
    () => stepperSteps.filter((s) => statuses[s.id] === "skipped").length,
    [statuses, stepperSteps],
  );
  const progress = Math.round(((configuredCount + skippedCount) / totalStepper) * 100);

  const goTo = (id: StepId) => {
    const idx = STEPS.findIndex((s) => s.id === id);
    if (idx >= 0) setStepIdx(idx);
  };

  const markAndAdvance = (id: StepId, status: StepStatus) => {
    setStatuses((p) => ({ ...p, [id]: status }));
    // Avança pra próxima pendente; se não houver, vai pro done.
    // O step recém-marcado não entra porque filtramos i > stepIdx.
    const nextPending = STEPS.findIndex(
      (s, i) => i > stepIdx && s.stepper && statuses[s.id] === "pending",
    );
    if (nextPending >= 0) setStepIdx(nextPending);
    else goTo("done");
  };

  const handleSkip = () => markAndAdvance(current.id, "skipped");
  const handleConfigured = () => markAndAdvance(current.id, "configured");

  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="flex h-[720px] max-h-[92vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-border bg-bg-base/40 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-accent-primary" />
            Onboarding da plataforma — configuração inicial
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-4">
            <span>
              {configuredCount} configurada{configuredCount === 1 ? "" : "s"} · {skippedCount}{" "}
              pulada{skippedCount === 1 ? "" : "s"} ·{" "}
              {totalStepper - configuredCount - skippedCount} pendente
              {totalStepper - configuredCount - skippedCount === 1 ? "" : "s"}
            </span>
            <span className="text-xs text-muted-foreground">
              Siga o roteiro, configure o essencial e pule o que não usar agora
            </span>
          </DialogDescription>
          <div className="mt-2">
            <Progress value={progress} className="h-1" />
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          {/* Stepper lateral — oculto em mobile */}
          <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-bg-base/20 px-3 py-4 md:block">
            <StepperList currentId={current.id} statuses={statuses} onJump={goTo} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {current.id === "welcome" && <WelcomeStep />}
              {current.id === "ai" && <AiStep onConfigured={handleConfigured} />}
              {current.id === "barcode" && <BarcodeStep onConfigured={handleConfigured} />}
              {current.id === "whatsapp" && <WhatsappStep onConfigured={handleConfigured} />}
              {current.id === "email" && <EmailStep onConfigured={handleConfigured} />}
              {current.id === "webhook" && (
                <WebhookStep onConfigured={handleConfigured} copy={copy} />
              )}
              {current.id === "shopify" && <ShopifyStep onConfigured={handleConfigured} />}
              {current.id === "bling" && <BlingStep onConfigured={handleConfigured} />}
              {current.id === "locations" && <LocationsStep onConfigured={handleConfigured} />}
              {current.id === "done" && (
                <DoneStep
                  configured={configuredCount}
                  total={totalStepper}
                  skipped={skippedCount}
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-3">
              {stepIdx > 0 && current.id !== "done" ? (
                <Button variant="ghost" size="sm" onClick={back}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {current.id === "welcome" && (
                  <>
                    <Button variant="ghost" onClick={onComplete}>
                      Pular tudo
                    </Button>
                    <Button onClick={() => goTo("ai")}>
                      Começar
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </>
                )}
                {current.stepper && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleSkip}>
                      Pular este passo
                    </Button>
                  </>
                )}
                {current.id === "done" && (
                  <Button onClick={onComplete}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Começar a usar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Stepper lateral                                                            */
/* -------------------------------------------------------------------------- */

function StepperList({
  currentId,
  statuses,
  onJump,
}: {
  currentId: StepId;
  statuses: Record<StepId, StepStatus>;
  onJump: (id: StepId) => void;
}) {
  const groups: StepMeta["group"][] = ["essential", "notif", "commerce", "operations"];
  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const items = STEPS.filter((s) => s.group === g && s.stepper);
        if (items.length === 0) return null;
        return (
          <div key={g}>
            <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {GROUP_LABELS[g]}
            </div>
            <ul className="space-y-0.5">
              {items.map((s) => {
                const st = statuses[s.id];
                const active = s.id === currentId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onJump(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        active
                          ? "bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/30"
                          : "text-text-primary hover:bg-muted/60",
                      )}
                    >
                      <StatusIcon status={st} />
                      <s.icon className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="flex-1 truncate">{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "configured") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-success text-white">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "skipped") {
    return <MinusCircle className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

/* -------------------------------------------------------------------------- */
/* STEPS                                                                      */
/* -------------------------------------------------------------------------- */

function WelcomeStep() {
  const setupPlan = [
    "Comece pelas integrações essenciais: IA e leitura de código de barras.",
    "Ative canais de aviso, como WhatsApp e Email, para alertas operacionais.",
    "Conecte e-commerce/ERP apenas se já vende por Shopify, Bling ou webhook.",
    "Finalize entendendo o depósito padrão; depois cadastre produtos e fornecedores.",
  ];

  const highlights = [
    {
      icon: Bot,
      label: "IA pra sugerir compras",
      hint: "Claude analisa consumo e sugere o quê, quanto e de quem comprar",
    },
    {
      icon: ScanLine,
      label: "Scan de código de barras",
      hint: "EAN/UPC vira cadastro quase automático via Cosmos + Open Food Facts",
    },
    {
      icon: MessageCircle,
      label: "Notificações e orçamentos",
      hint: "WhatsApp + Email — alertas de estoque e RFQ pros fornecedores",
    },
    {
      icon: LinkIcon,
      label: "Integrações e-commerce",
      hint: "Shopify, Bling ERP e webhook genérico pra vendas automáticas",
    },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10">
          <Rocket className="h-8 w-8 text-accent-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Bem-vindo ao Compras &amp; Estoque
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este modal aparece para novos usuários e guia a configuração inicial em poucos minutos.
          Cada etapa explica o objetivo, o custo, quais dados preencher e onde obter as credenciais.
          O que não fizer sentido agora pode ser pulado e configurado depois.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg-base/40 p-4 text-left">
        <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
          Roteiro recomendado
        </div>
        <ol className="space-y-2">
          {setupPlan.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-semibold text-accent-primary">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {highlights.map(({ icon: Icon, label, hint }) => (
          <li key={label} className="rounded-xl border border-border bg-bg-base/40 p-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-accent-primary" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </li>
        ))}
      </ul>

      <div className="rounded-md border border-border bg-bg-base/40 p-3 text-xs text-muted-foreground">
        <strong className="text-text-primary">Segurança:</strong> as chaves são guardadas em um
        cofre seguro e nunca ficam expostas no frontend. Apenas rotinas protegidas da própria
        plataforma acessam essas credenciais.
      </div>
    </div>
  );
}

function AdminOnlyConfigGate({
  children,
  onConfigured,
}: {
  children: ReactNode;
  onConfigured: () => void;
}) {
  const { isAdmin } = useAuth();

  if (isAdmin) return <>{children}</>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-bg-base/40 p-4 text-sm text-muted-foreground">
        Somente administradores podem salvar credenciais e integrações da plataforma. Peça para um
        administrador concluir este passo em{" "}
        <strong className="text-text-primary">Configurações</strong>.
      </div>
      <PrimaryButton onClick={onConfigured} variant="outline">
        Entendi, continuar
      </PrimaryButton>
    </div>
  );
}

function AiStep({ onConfigured }: { onConfigured: () => void }) {
  const [key, setKey] = useState("");
  const save = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-api-keys", {
        action: "upsert",
        provider: "anthropic",
        api_key: key,
        label: "Configurada no onboarding",
      }),
    onSuccess: () => {
      toast.success("Chave Anthropic validada e salva.");
      onConfigured();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  return (
    <StepShell
      icon={Bot}
      title="IA — Anthropic Claude"
      description="A IA analisa histórico de vendas e sugere compras com urgência, custo e fornecedor. Também responde perguntas em linguagem natural sobre o estoque."
      benefit="Sugestões de reabastecimento automáticas + chat que consulta o banco de dados."
      howTo="anthropic"
      pricing="Pago por uso (~US$ 1/mês pra PMEs típicas). Validamos a chave com uma chamada real."
    >
      <AdminOnlyConfigGate onConfigured={onConfigured}>
        <FormField label="API key Anthropic" hint="Começa com sk-ant-…">
          <Input
            type="password"
            placeholder="sk-ant-api03-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="font-mono text-sm"
          />
        </FormField>
        <PrimaryButton
          onClick={() => save.mutate()}
          disabled={key.length < 20 || save.isPending}
          loading={save.isPending}
          icon={KeyRound}
        >
          Validar e salvar
        </PrimaryButton>
      </AdminOnlyConfigGate>
    </StepShell>
  );
}

function BarcodeStep({ onConfigured }: { onConfigured: () => void }) {
  const [token, setToken] = useState("");
  const [userAgent, setUserAgent] = useState("");

  const save = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "upsert",
        type: "cosmos_bluesoft",
        is_active: true,
        apikey: token,
        user_agent: userAgent.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Token Cosmos/Bluesoft salvo.");
      onConfigured();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  return (
    <StepShell
      icon={ScanLine}
      title="Código de barras — catálogo de produtos"
      description="Ao escanear um GTIN no cadastro, buscamos nome, marca, NCM, categoria, imagem e peso automaticamente. Cascata: Cosmos (~26M produtos BR) → Open Food Facts (alimentos, grátis)."
      benefit="Cadastro de 1 clique. Sem Cosmos, só Open Food Facts — cobertura limitada a alimentos/bebidas."
      howTo="cosmos"
      pricing="Cosmos tem plano gratuito com limite diário baixo; planos pagos a partir de ~R$ 50/mês."
    >
      <AdminOnlyConfigGate onConfigured={onConfigured}>
        <FormField label="Token Cosmos (opcional)" hint="Pule pra usar só Open Food Facts">
          <Input
            type="password"
            placeholder="Cole o token do cosmos.bluesoft.com.br"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-sm"
          />
        </FormField>
        <FormField label="User-Agent (opcional)" hint="Identificador enviado à Cosmos">
          <Input
            placeholder="minhaloja/1.0"
            value={userAgent}
            onChange={(e) => setUserAgent(e.target.value)}
            className="font-mono text-sm"
          />
        </FormField>
        <PrimaryButton
          onClick={() => save.mutate()}
          disabled={token.length < 10 || save.isPending}
          loading={save.isPending}
          icon={KeyRound}
        >
          Salvar token
        </PrimaryButton>
      </AdminOnlyConfigGate>
    </StepShell>
  );
}

function WhatsappStep({ onConfigured }: { onConfigured: () => void }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [apikey, setApikey] = useState("");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [view, setView] = useState<"setup" | "qr" | "connected">("setup");

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
      toast.success("Instância criada. Escaneie o QR Code no WhatsApp.");
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
          setView("connected");
          onConfigured();
        }
      } catch {
        // silencia erros de polling
      }
    };
    pollingRef.current = window.setInterval(tick, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [view, onConfigured]);

  return (
    <StepShell
      icon={MessageCircle}
      title="WhatsApp — Evolution API"
      description="Notificações de estoque crítico, aprovações de compra e orçamentos pros fornecedores, via gateway open-source (sem depender da API oficial da Meta)."
      benefit="Avisos em tempo real. Self-hosted gratuito; SaaS gerenciado R$ 50–150/mês."
      howTo="evolution"
      pricing="VPS self-hosted: ~R$ 30/mês. SaaS gerenciado: R$ 50–150/mês."
    >
      <AdminOnlyConfigGate onConfigured={onConfigured}>
        {view === "setup" && (
          <>
            <FormField label="Base URL">
              <Input
                placeholder="https://evolution.seudominio.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="font-mono text-xs"
              />
            </FormField>
            <FormField label="API key">
              <Input
                type="password"
                placeholder="sua-apikey-aqui"
                value={apikey}
                onChange={(e) => setApikey(e.target.value)}
                className="font-mono text-xs"
                autoComplete="new-password"
              />
            </FormField>
            <PrimaryButton
              onClick={() => createInstance.mutate()}
              disabled={!baseUrl.trim() || !apikey.trim() || createInstance.isPending}
              loading={createInstance.isPending}
            >
              Conectar WhatsApp
            </PrimaryButton>
            <p className="mt-1 text-xs text-muted-foreground">
              A instância é criada automaticamente no Evolution, com grupos ignorados e recebendo
              apenas eventos de mensagem nova.
            </p>
          </>
        )}

        {view === "qr" && (
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6">
              {qrBase64 ? (
                <img
                  src={qrBase64}
                  alt="QR Code WhatsApp"
                  className="h-64 w-64 rounded-md bg-white p-2 shadow-sm"
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => refreshQr.mutate()}
              disabled={refreshQr.isPending}
            >
              {refreshQr.isPending ? "Atualizando..." : "Atualizar QR"}
            </Button>
          </div>
        )}

        {view === "connected" && (
          <div className="rounded-md bg-accent-success/10 p-3 text-sm">
            <p className="font-medium text-accent-success">
              WhatsApp conectado. Você pode seguir pro próximo passo.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Destinatários e mensagens de teste ficam em Configurações → Integrações.
            </p>
          </div>
        )}
      </AdminOnlyConfigGate>
    </StepShell>
  );
}

function EmailStep({ onConfigured }: { onConfigured: () => void }) {
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [apikey, setApikey] = useState("");
  const [recipient, setRecipient] = useState("");

  const save = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "upsert",
        type: "email_resend",
        is_active: true,
        from_email: fromEmail,
        from_name: fromName || null,
        apikey,
        recipients: recipient ? [recipient] : [],
      }),
    onSuccess: () => {
      toast.success("Email configurado.");
      onConfigured();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  return (
    <StepShell
      icon={Mail}
      title="Email — Resend"
      description="Canal de notificação alternativo/complementar ao WhatsApp. Precisa de conta Resend com domínio verificado."
      benefit="Backup de WhatsApp — se o gateway cair, alertas continuam chegando."
      howTo="resend"
      pricing="Gratuito até 3.000 emails/mês e 100/dia. Acima: US$ 20/mês."
    >
      <AdminOnlyConfigGate onConfigured={onConfigured}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="From" hint="Verificado no Resend">
            <Input
              type="email"
              placeholder="estoque@seudominio.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="text-xs"
            />
          </FormField>
          <FormField label="Nome remetente">
            <Input
              placeholder="Compras & Estoque"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="text-xs"
            />
          </FormField>
        </div>
        <FormField label="API key Resend" hint="Começa com re_…">
          <Input
            type="password"
            placeholder="re_..."
            value={apikey}
            onChange={(e) => setApikey(e.target.value)}
            className="font-mono text-xs"
          />
        </FormField>
        <FormField label="Email para teste">
          <Input
            type="email"
            placeholder="equipe@seudominio.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="text-xs"
          />
        </FormField>
        <PrimaryButton
          onClick={() => save.mutate()}
          disabled={!fromEmail || !apikey || save.isPending}
          loading={save.isPending}
        >
          Salvar Email
        </PrimaryButton>
      </AdminOnlyConfigGate>
    </StepShell>
  );
}

function WebhookStep({
  onConfigured,
  copy,
}: {
  onConfigured: () => void;
  copy: (t: string) => void;
}) {
  const [secret, setSecret] = useState<string | null>(null);
  const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/sale-webhook`;

  const create = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean; secret: string }>("admin-integrations", {
        action: "upsert",
        type: "sale_webhook",
        is_active: true,
      }),
    onSuccess: (r) => {
      if (r.secret) setSecret(r.secret);
      toast.success("Webhook ativado.");
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  return (
    <StepShell
      icon={ShoppingBag}
      title="Webhook de vendas (Shopify-compatible)"
      description="Endpoint público pra receber eventos de venda de e-commerces. Cada evento decrementa estoque automaticamente (idempotente via ID externo)."
      benefit="Integração em 1 clique: cole o endpoint + secret na plataforma de origem."
      pricing="Sem custo. Rate-limit 60 req/min por origem pra proteger o DB."
    >
      <AdminOnlyConfigGate onConfigured={onConfigured}>
        {!secret ? (
          <PrimaryButton
            onClick={() => create.mutate()}
            disabled={create.isPending}
            loading={create.isPending}
            icon={LinkIcon}
          >
            Gerar endpoint e secret
          </PrimaryButton>
        ) : (
          <div className="space-y-3">
            <FormField label="Endpoint (POST)">
              <div className="flex gap-2">
                <Input value={endpoint} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" type="button" onClick={() => copy(endpoint)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </FormField>
            <FormField label="Header X-Webhook-Secret">
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" type="button" onClick={() => copy(secret)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </FormField>
            <div className="rounded-md border border-accent-success/30 bg-accent-success/5 p-3 text-xs text-accent-success">
              ✓ Webhook ativo. Cole essas credenciais na plataforma de origem (ex: Shopify →
              Settings → Notifications → Create webhook).
            </div>
            <PrimaryButton onClick={onConfigured} variant="outline">
              Confirmei, continuar
            </PrimaryButton>
          </div>
        )}
      </AdminOnlyConfigGate>
    </StepShell>
  );
}

function ShopifyStep({ onConfigured }: { onConfigured: () => void }) {
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");

  const save = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "upsert",
        type: "shopify",
        is_active: true,
        shop_domain: domain,
        push_inventory: true,
        access_token: token,
      }),
    onSuccess: () => {
      toast.success("Shopify conectado. Depois vá em Integrações pra sincronizar.");
      onConfigured();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  return (
    <StepShell
      icon={ShoppingBag}
      title="Shopify"
      description="Sincroniza produtos por SKU e empurra estoque de volta pra Shopify. Vendas caem automaticamente via o webhook do passo anterior."
      benefit="Estoque sempre alinhado entre Shopify e ERP local."
      howTo="shopify"
      pricing="Sem custo adicional — usa a Admin API grátis de todas contas."
    >
      <AdminOnlyConfigGate onConfigured={onConfigured}>
        <FormField label="Shop domain">
          <Input
            placeholder="minha-loja.myshopify.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="font-mono text-xs"
          />
        </FormField>
        <FormField
          label="Admin API access token"
          hint="Começa com shpat_. Scopes: read_products, read_inventory, write_inventory"
        >
          <Input
            type="password"
            placeholder="shpat_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-xs"
          />
        </FormField>
        <PrimaryButton
          onClick={() => save.mutate()}
          disabled={!domain || !token || save.isPending}
          loading={save.isPending}
        >
          Conectar Shopify
        </PrimaryButton>
      </AdminOnlyConfigGate>
    </StepShell>
  );
}

function BlingStep({ onConfigured }: { onConfigured: () => void }) {
  const [token, setToken] = useState("");

  const save = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "upsert",
        type: "bling",
        is_active: true,
        push_inventory: true,
        access_token: token,
      }),
    onSuccess: () => {
      toast.success("Bling conectado.");
      onConfigured();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  return (
    <StepShell
      icon={Box}
      title="Bling ERP"
      description="Sincroniza produtos pelo código (SKU) e atualiza estoque de volta. Ideal se Bling é seu ERP fiscal principal."
      benefit="Bling continua como fonte da verdade fiscal; Compras & Estoque cobre compras + IA."
      howTo="bling"
      pricing="Sem custo adicional — API v3 incluída em qualquer plano pago do Bling."
    >
      <AdminOnlyConfigGate onConfigured={onConfigured}>
        <FormField
          label="Access token (OAuth Bling)"
          hint="Bling → Preferências → Aplicativos → crie um app e gere o token"
        >
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-xs"
          />
        </FormField>
        <PrimaryButton
          onClick={() => save.mutate()}
          disabled={!token || save.isPending}
          loading={save.isPending}
        >
          Conectar Bling
        </PrimaryButton>
      </AdminOnlyConfigGate>
    </StepShell>
  );
}

function LocationsStep({ onConfigured }: { onConfigured: () => void }) {
  return (
    <StepShell
      icon={MapPin}
      title="Depósito padrão"
      description="Sua conta já tem um Depósito principal criado automaticamente. Se opera com mais de um local físico (lojas, CDs, veículos), adicione depois em Configurações → Locais."
      benefit="Movimente estoque entre locais e veja saldo separado por depósito."
      pricing="Sem custo. Ativa na plataforma por padrão."
    >
      <div className="rounded-md border border-border bg-bg-base/40 p-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent-primary" />
          <span className="text-sm font-medium">Depósito principal</span>
          <Badge variant="secondary" className="text-xs">
            padrão
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Usado em qualquer movimentação que não especifique outro local.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        💡 Multi-depósito só é útil se você tem mais de um ponto físico.
      </p>
      <PrimaryButton onClick={onConfigured} variant="outline">
        Entendi, continuar
      </PrimaryButton>
    </StepShell>
  );
}

function DoneStep({
  configured,
  total,
  skipped,
}: {
  configured: number;
  total: number;
  skipped: number;
}) {
  const pending = total - configured - skipped;
  const nextActions = [
    { icon: Truck, label: "Cadastrar fornecedores", path: "/suppliers" },
    { icon: Package, label: "Importar produtos (CSV)", path: "/products" },
    {
      icon: ShoppingBag,
      label: "Criar primeiro pedido de compra",
      path: "/purchases/new",
    },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-success/10">
        <CheckCircle2 className="h-8 w-8 text-accent-success" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Plataforma pronta!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong className="text-accent-success">{configured}</strong> integrações configuradas ·{" "}
          <strong>{skipped}</strong> puladas · <strong>{pending}</strong> pendentes. Você pode
          ativar o que faltou a qualquer momento em <strong>Configurações → Integrações</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg-base/40 p-4 text-left">
        <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Próximos passos sugeridos
        </div>
        <ul className="space-y-2">
          {nextActions.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-accent-primary" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SHELL + helpers                                                            */
/* -------------------------------------------------------------------------- */

function StepShell({
  icon: Icon,
  title,
  description,
  benefit,
  howTo,
  pricing,
  children,
}: {
  icon: typeof Rocket;
  title: string;
  description: string;
  benefit: string;
  howTo?: HowToProvider;
  pricing?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
          <Icon className="h-5 w-5 text-accent-primary" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">{title}</h3>
            {howTo && <ApiKeyHowToButton provider={howTo} />}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="rounded-md bg-accent-primary/5 p-3 text-xs text-accent-primary">
        ✨ {benefit}
      </div>
      {pricing && (
        <div className="rounded-md border border-border bg-bg-base/40 p-3 text-xs text-muted-foreground">
          <strong className="text-text-primary">Custo:</strong> {pricing}
        </div>
      )}
      <div className="space-y-3 pt-1">{children}</div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  icon: Icon,
  variant,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: typeof KeyRound;
  variant?: "default" | "outline";
  children: React.ReactNode;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant ?? "default"}
      className="w-full"
      type="button"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}
