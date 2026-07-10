import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, Truck, FileCheck, ClipboardCheck } from "lucide-react";
import { usePurchaseRules, useUpdatePurchaseRules } from "@/hooks/usePurchaseRules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { mapGatewayError } from "@/lib/errors";

const ROLES: Array<{ value: "admin" | "manager" | "rep"; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Gestor de Compras" },
  { value: "rep", label: "Operador" },
];

export function PurchaseRulesPanel() {
  const { data: rules, isLoading } = usePurchaseRules();
  const update = useUpdatePurchaseRules();

  const [minQuotes, setMinQuotes] = useState(0);
  const [approvalThreshold, setApprovalThreshold] = useState<string>("");
  const [requiresJustification, setRequiresJustification] = useState(true);
  const [approverRoles, setApproverRoles] = useState<string[]>(["admin"]);
  const [requiresPrForPo, setRequiresPrForPo] = useState(false);
  const [requiresWinnerApproval, setRequiresWinnerApproval] = useState(false);
  const [requiresDeliveryCheck, setRequiresDeliveryCheck] = useState(false);
  const [deliveryCheckOver, setDeliveryCheckOver] = useState<string>("");

  useEffect(() => {
    if (!rules) return;
    setMinQuotes(rules.min_quotes_required);
    setApprovalThreshold(rules.approval_min_amount?.toString() ?? "");
    setRequiresJustification(rules.requires_justification_below_min_quotes);
    setApproverRoles(rules.approver_roles);
    setRequiresPrForPo(rules.requires_request_for_order);
    setRequiresWinnerApproval(rules.requires_winner_approval);
    setRequiresDeliveryCheck(rules.requires_delivery_check);
    setDeliveryCheckOver(rules.delivery_check_min_amount?.toString() ?? "");
  }, [rules]);

  const save = () => {
    const threshold = approvalThreshold.trim() ? Number(approvalThreshold) : null;
    if (threshold !== null && (isNaN(threshold) || threshold < 0)) {
      toast.error("Valor mínimo para aprovação inválido.");
      return;
    }
    const checkOver = deliveryCheckOver.trim() ? Number(deliveryCheckOver) : null;
    if (checkOver !== null && (isNaN(checkOver) || checkOver < 0)) {
      toast.error("Valor mínimo de conferência inválido.");
      return;
    }
    if (approverRoles.length === 0) {
      toast.error("Selecione ao menos um role que pode aprovar.");
      return;
    }
    update.mutate(
      {
        min_quotes_required: Math.max(0, minQuotes),
        approval_min_amount: threshold,
        approver_roles: approverRoles,
        requires_justification_below_min_quotes: requiresJustification,
        requires_request_for_order: requiresPrForPo,
        requires_winner_approval: requiresWinnerApproval,
        requires_delivery_check: requiresDeliveryCheck,
        delivery_check_min_amount: checkOver,
      },
      {
        onSuccess: () => toast.success("Regras salvas."),
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  const toggleRole = (role: string) => {
    setApproverRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Regras de compra</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure o fluxo de Solicitação → Cotação → Pedido → Conferência → Estoque.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-accent-primary" />
            Cotações e aprovações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="min-quotes">Mínimo de cotações por pedido</Label>
              <Input
                id="min-quotes"
                type="number"
                min="0"
                max="10"
                value={minQuotes}
                onChange={(e) => setMinQuotes(Number(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                0 = sem exigência. Ex: 3 = cada pedido deve ter 3 cotações comparadas.
              </p>
            </div>

            <div>
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
                Pedidos acima desse valor vão pra fila de aprovação em vez de ir direto pro
                fornecedor.
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm">Quem pode aprovar?</Label>
            <div className="mt-2 space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-base/40 p-3"
                >
                  <Checkbox
                    checked={approverRoles.includes(r.value)}
                    onCheckedChange={() => toggleRole(r.value)}
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-border bg-bg-base/40 p-3">
            <Switch checked={requiresJustification} onCheckedChange={setRequiresJustification} />
            <div>
              <Label className="text-sm">
                Exigir justificativa quando houver menos cotações que o mínimo
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Se o comprador não conseguiu o mínimo de cotações (por ex: urgência, fornecedor
                único), deve escrever uma justificativa e passa por aprovação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4 text-accent-primary" />
            Solicitação de compra (PR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-border bg-bg-base/40 p-3">
            <Switch checked={requiresPrForPo} onCheckedChange={setRequiresPrForPo} />
            <div>
              <Label className="text-sm">Exigir Solicitação aprovada antes de criar Pedido</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Compradores não conseguem criar PO direto — precisam partir de uma PR aprovada.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-border bg-bg-base/40 p-3">
            <Switch checked={requiresWinnerApproval} onCheckedChange={setRequiresWinnerApproval} />
            <div>
              <Label className="text-sm">
                Exigir aprovação do vencedor da cotação antes de virar Pedido
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Após escolher fornecedor vencedor de uma RFQ, a cotação fica em{" "}
                <em>aguardando aprovação</em> antes de gerar o PO.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4 text-accent-primary" />
            Conferência de entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-border bg-bg-base/40 p-3">
            <Switch checked={requiresDeliveryCheck} onCheckedChange={setRequiresDeliveryCheck} />
            <div>
              <Label className="text-sm">
                Sempre exigir conferência antes de dar entrada no estoque
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ao marcar pedido como entregue, fica em <em>aguardando conferência</em> e só vira
                estoque após validação item a item.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="delivery-check-over" className="flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Exigir conferência acima de (R$)
            </Label>
            <Input
              id="delivery-check-over"
              type="number"
              step="0.01"
              min="0"
              placeholder="deixe vazio pra desabilitar"
              value={deliveryCheckOver}
              onChange={(e) => setDeliveryCheckOver(e.target.value)}
              className="mt-1"
              disabled={requiresDeliveryCheck}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {requiresDeliveryCheck
                ? "Desativado — conferência sempre exigida acima."
                : "Pedidos com total acima desse valor exigem conferência."}
            </p>
          </div>
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
