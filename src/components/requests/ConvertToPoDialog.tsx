import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseRequestMutations } from "@/hooks/usePurchaseRequests";
import { useNavigate } from "react-router-dom";
import { mapGatewayError } from "@/lib/errors";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  requestId: string;
}

export function ConvertToPoDialog({ open, onOpenChange, requestId }: Props) {
  const { data: suppliers = [] } = useSuppliers(false);
  const { convertToPo } = usePurchaseRequestMutations();
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");

  const handleConfirm = () => {
    if (!supplierId) {
      toast.error("Selecione o fornecedor.");
      return;
    }
    convertToPo.mutate(
      { id: requestId, supplierId, expectedDate: expectedDate || null },
      {
        onSuccess: (order) => {
          toast.success("Pedido criado a partir da solicitação.");
          onOpenChange(false);
          navigate(`/purchases/${order.id}`);
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Converter direto em pedido (PO)</DialogTitle>
          <DialogDescription>
            Pula a etapa de cotação e cria pedido em rascunho. Custos vêm da estimativa da
            solicitação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Fornecedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="po-expected" className="text-xs">
              Previsão de entrega
            </Label>
            <Input
              id="po-expected"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={convertToPo.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={convertToPo.isPending}>
            {convertToPo.isPending ? "Convertendo..." : "Criar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
