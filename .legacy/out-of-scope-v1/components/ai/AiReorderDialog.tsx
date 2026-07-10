import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bot, Loader2, Sparkles, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { invokeEdge } from "@/lib/edge-fn";
import { usePurchaseMutations } from "@/hooks/usePurchases";

export interface ReorderSuggestion {
  product_id: string;
  sku: string;
  name: string;
  current_stock: number;
  min_stock: number;
  suggested_quantity: number;
  suggested_supplier_id: string | null;
  estimated_cost: number;
  urgency: "high" | "medium" | "low";
  reason: string;
}

export interface ReorderResponse {
  summary: string;
  suggestions: ReorderSuggestion[];
}
import { useProducts } from "@/hooks/useProducts";
import { formatBRL, formatNumber } from "@/lib/formatters";
import { mapSupabaseError } from "@/lib/errors";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UrgencyLevel = ReorderSuggestion["urgency"];

const URGENCY_META: Record<UrgencyLevel, { label: string; className: string }> = {
  high: {
    label: "Alta urgência",
    className: "bg-destructive/15 text-destructive",
  },
  medium: {
    label: "Média",
    className: "bg-warning/15 text-warning",
  },
  low: {
    label: "Baixa",
    className: "bg-accent-success/15 text-accent-success",
  },
};

export function AiReorderDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts({ includeInactive: false });
  const { create: createPO } = usePurchaseMutations();
  const [result, setResult] = useState<ReorderResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const suggest = useMutation({
    mutationFn: async () =>
      invokeEdge<ReorderResponse & { fromCache: boolean }>("ai-suggest-reorder"),
    onSuccess: (data) => {
      setResult(data);
      setSelected(new Set(data.suggestions.map((s) => s.product_id)));
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const handleRun = () => {
    setResult(null);
    suggest.mutate();
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setResult(null);
      setSelected(new Set());
    }
    onOpenChange(next);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedSuggestions = result?.suggestions.filter((s) => selected.has(s.product_id)) ?? [];

  const selectedBySupplier = selectedSuggestions.reduce(
    (acc, s) => {
      const sid = s.suggested_supplier_id ?? "__none__";
      if (!acc[sid]) acc[sid] = [];
      acc[sid].push(s);
      return acc;
    },
    {} as Record<string, ReorderSuggestion[]>,
  );

  const selectedTotal = selectedSuggestions.reduce((acc, s) => acc + s.estimated_cost, 0);

  const handleCreateOrders = async () => {
    const entries = Object.entries(selectedBySupplier);
    const noSupplier = entries.find(([sid]) => sid === "__none__");
    if (noSupplier) {
      toast.error(
        `${noSupplier[1].length} item(s) sem fornecedor. Vincule um fornecedor ao produto antes.`,
      );
      return;
    }

    try {
      let firstId: string | null = null;
      for (const [supplierId, items] of entries) {
        const order = await createPO.mutateAsync({
          supplier_id: supplierId,
          notes: "Gerado por IA a partir de sugestão de reabastecimento.",
          ai_generated: true,
          ai_justification: result?.summary ?? null,
          items: items.map((s) => {
            const product = products.find((p) => p.id === s.product_id);
            return {
              product_id: s.product_id,
              quantity_ordered: s.suggested_quantity,
              unit_cost: Number(product?.cost ?? 0),
            };
          }),
        });
        if (!firstId) firstId = order.id;
      }
      toast.success(`${entries.length} pedido(s) criado(s) como rascunho. Revise e envie.`);
      handleClose(false);
      if (firstId) {
        navigate(`/purchases/${firstId}`);
      } else {
        navigate("/purchases");
      }
    } catch (e) {
      toast.error(mapSupabaseError(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-primary" />
            Sugestão de reabastecimento por IA
          </DialogTitle>
          <DialogDescription>
            A IA analisa saídas recentes, estoque mínimo e lead time para sugerir quantidades de
            compra.
          </DialogDescription>
        </DialogHeader>

        {!result && !suggest.isPending && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Bot className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Clique em <strong>Analisar</strong> para gerar sugestões com base nos produtos abaixo
              do estoque mínimo.
            </p>
            <Button onClick={handleRun}>
              <Sparkles className="mr-2 h-4 w-4" />
              Analisar agora
            </Button>
          </div>
        )}

        {suggest.isPending && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
            <p className="text-sm text-muted-foreground">
              Consultando a IA... isso pode levar alguns segundos.
            </p>
          </div>
        )}

        {result && result.suggestions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <TrendingUp className="h-10 w-10 text-accent-success" />
            <p className="text-sm font-medium">Tudo sob controle!</p>
            <p className="max-w-md text-sm text-muted-foreground">{result.summary}</p>
          </div>
        )}

        {result && result.suggestions.length > 0 && (
          <>
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <strong>Resumo: </strong>
              {result.summary}
            </div>

            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-2">
                {result.suggestions.map((s) => {
                  const meta = URGENCY_META[s.urgency];
                  const checked = selected.has(s.product_id);
                  return (
                    <label
                      key={s.product_id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        checked
                          ? "border-accent-primary/40 bg-accent-primary/5"
                          : "border-border bg-bg-base/40"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(s.product_id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{s.sku}</span>
                          <Badge className={meta.className} variant="secondary">
                            {s.urgency === "high" && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {meta.label}
                          </Badge>
                          {!s.suggested_supplier_id && (
                            <Badge variant="outline" className="text-xs">
                              sem fornecedor
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Estoque: </span>
                            <span className="font-medium">
                              {formatNumber(s.current_stock)} / min {formatNumber(s.min_stock)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Comprar: </span>
                            <span className="font-medium">
                              {formatNumber(s.suggested_quantity)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground">Custo est.: </span>
                            <span className="font-medium tabular-nums">
                              {formatBRL(s.estimated_cost)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <div>
                <strong>{selectedSuggestions.length}</strong> item(s) selecionado(s) ·{" "}
                {Object.keys(selectedBySupplier).length} pedido(s) ·{" "}
                <span className="font-semibold">{formatBRL(selectedTotal)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRun}>
                <Sparkles className="mr-1 h-3 w-3" />
                Recalcular
              </Button>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Fechar
          </Button>
          {result && result.suggestions.length > 0 && (
            <Button
              onClick={handleCreateOrders}
              disabled={selectedSuggestions.length === 0 || createPO.isPending}
            >
              {createPO.isPending
                ? "Criando pedidos..."
                : `Criar ${Object.keys(selectedBySupplier).length} pedido(s) (rascunho)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
