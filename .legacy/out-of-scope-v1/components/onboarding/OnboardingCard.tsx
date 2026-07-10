import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Truck,
  Package,
  ShoppingCart,
  ArrowRight,
  Upload,
  KeyRound,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ProductsImportDialog } from "@/components/import/ProductsImportDialog";
import { SuppliersImportDialog } from "@/components/import/SuppliersImportDialog";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "onboarding_dismissed_v1";

interface Counts {
  products: number;
  suppliers: number;
  purchases: number;
  movements: number;
  hasAiKey: boolean;
}

export function OnboardingCard() {
  const { isAdmin } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [productsImportOpen, setProductsImportOpen] = useState(false);
  const [suppliersImportOpen, setSuppliersImportOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    }
  }, []);

  const { data: counts, isLoading } = useQuery({
    queryKey: ["onboarding-counts"],
    staleTime: 10_000,
    enabled: isAdmin,
    queryFn: async (): Promise<Counts> => {
      const [p, s, po, mv, ai] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("suppliers").select("*", { count: "exact", head: true }),
        supabase.from("purchase_orders").select("*", { count: "exact", head: true }),
        supabase.from("stock_movements").select("*", { count: "exact", head: true }),
        supabase.from("api_keys").select("provider").eq("provider", "anthropic").maybeSingle(),
      ]);
      return {
        products: p.count ?? 0,
        suppliers: s.count ?? 0,
        purchases: po.count ?? 0,
        movements: mv.count ?? 0,
        hasAiKey: !!ai.data,
      };
    },
  });

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  if (!isAdmin || isLoading || !counts || dismissed) return null;

  const totalProgress =
    (counts.suppliers > 0 ? 1 : 0) +
    (counts.products > 0 ? 1 : 0) +
    (counts.movements > 0 ? 1 : 0) +
    (counts.purchases > 0 ? 1 : 0) +
    (counts.hasAiKey ? 1 : 0);

  // Já tem dados suficientes — não mostra
  if (totalProgress >= 4) return null;

  const steps: Step[] = [
    {
      done: counts.suppliers > 0,
      icon: Truck,
      title: "Cadastre fornecedores",
      description: "Adicione ao menos um fornecedor para vincular aos produtos.",
      actions: [
        { label: "Novo fornecedor", to: "/suppliers" },
        { label: "Importar CSV", onClick: () => setSuppliersImportOpen(true), variant: "outline" },
      ],
    },
    {
      done: counts.products > 0,
      icon: Package,
      title: "Cadastre produtos",
      description: "Cadastre seu catálogo com SKU, código de barras e estoque mínimo.",
      actions: [
        { label: "Novo produto", to: "/products" },
        { label: "Importar CSV", onClick: () => setProductsImportOpen(true), variant: "outline" },
      ],
    },
    {
      done: counts.movements > 0,
      icon: Upload,
      title: "Registre entrada/saldo inicial",
      description: "Faça uma movimentação de ajuste ou importe saldo inicial junto aos produtos.",
      actions: [{ label: "Estoque", to: "/stock" }],
    },
    {
      done: counts.purchases > 0,
      icon: ShoppingCart,
      title: "Crie seu primeiro pedido de compra",
      description: "Monte um PO rascunho, envie ao fornecedor e depois dê entrada ao receber.",
      actions: [{ label: "Novo pedido", to: "/purchases/new" }],
    },
    {
      done: counts.hasAiKey,
      icon: KeyRound,
      title: "Ative a IA (opcional)",
      description: "Cadastre uma chave Anthropic para usar sugestões de reabastecimento.",
      actions: [{ label: "Configurar API Keys", to: "/settings/api-keys" }],
    },
  ];

  return (
    <>
      <Card className="rounded-2xl border-accent-primary/30 bg-accent-primary/5 shadow-elevation-1">
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-base">
              Bem-vindo! Vamos configurar seu estoque em 5 passos
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalProgress} de 5 concluído{totalProgress === 1 ? "" : "s"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} title="Dispensar">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
        </CardContent>
      </Card>

      <ProductsImportDialog open={productsImportOpen} onOpenChange={setProductsImportOpen} />
      <SuppliersImportDialog open={suppliersImportOpen} onOpenChange={setSuppliersImportOpen} />
    </>
  );
}

interface Step {
  done: boolean;
  icon: typeof Truck;
  title: string;
  description: string;
  actions: Array<{
    label: string;
    to?: string;
    onClick?: () => void;
    variant?: "default" | "outline";
  }>;
}

function StepRow({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
        step.done ? "border-accent-success/30 bg-accent-success/5" : "border-border bg-card"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {step.done ? (
          <CheckCircle2 className="h-5 w-5 text-accent-success" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <Icon
        className={`h-5 w-5 shrink-0 ${step.done ? "text-accent-success" : "text-accent-primary"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{step.title}</div>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>
      {!step.done && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {step.actions.map((a, i) =>
            a.to ? (
              <Button key={i} size="sm" variant={a.variant ?? "default"} asChild>
                <Link to={a.to}>
                  {a.label}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            ) : (
              <Button key={i} size="sm" variant={a.variant ?? "default"} onClick={a.onClick}>
                {a.label}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
