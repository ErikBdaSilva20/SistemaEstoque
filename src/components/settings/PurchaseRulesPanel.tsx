import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseRules, useUpdatePurchaseRules } from "@/hooks/usePurchaseRules";
import { mapGatewayError } from "@/lib/errors";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function PurchaseRulesPanel() {
  const { data: rules, isLoading } = usePurchaseRules();
  const update = useUpdatePurchaseRules();

  const [approvalThreshold, setApprovalThreshold] = useState<string>("");

  useEffect(() => {
    if (!rules) return;
    setApprovalThreshold(rules.approval_min_amount?.toString() ?? "");
  }, [rules]);

  const save = () => {
    const threshold = approvalThreshold.trim() ? Number(approvalThreshold) : null;
    if (threshold !== null && (isNaN(threshold) || threshold < 0)) {
      toast.error("Valor mínimo para aprovação inválido.");
      return;
    }
    update.mutate(
      { approval_min_amount: threshold },
      {
        onSuccess: () => toast.success("Regras salvas."),
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Regras de compra</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure quando um pedido de compra precisa de aprovação antes de ser enviado.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-accent-primary" />
            Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="approval-threshold">Exigir aprovação acima de (R$)</Label>
          <Input
            id="approval-threshold"
            type="number"
            step="0.01"
            min="0"
            placeholder="deixe vazio pra desabilitar"
            value={approvalThreshold}
            onChange={(e) => setApprovalThreshold(e.target.value)}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Pedidos acima desse valor vão pra fila de aprovação em vez de serem registrados
            diretamente no histórico.
          </p>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={update.isPending}>
        {update.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Salvar regras
      </Button>
    </div>
  );
}
