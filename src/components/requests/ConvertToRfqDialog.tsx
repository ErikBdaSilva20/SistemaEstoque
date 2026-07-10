import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseRequestMutations } from "@/hooks/usePurchaseRequests";
import { useNavigate } from "react-router-dom";
import { mapGatewayError } from "@/lib/errors";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  requestId: string;
  defaultTitle: string;
}

export function ConvertToRfqDialog({ open, onOpenChange, requestId, defaultTitle }: Props) {
  const { data: suppliers = [] } = useSuppliers(false);
  const { convertToRfq } = usePurchaseRequestMutations();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [title, setTitle] = useState(defaultTitle);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleConfirm = () => {
    if (selected.length === 0) {
      toast.error("Selecione ao menos um fornecedor.");
      return;
    }
    convertToRfq.mutate(
      {
        id: requestId,
        supplierIds: selected,
        deadline: deadline || null,
        title: title || null,
      },
      {
        onSuccess: (quote) => {
          toast.success("Cotação criada a partir da solicitação.");
          onOpenChange(false);
          navigate(`/quotes/${quote.id}`);
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Converter em cotação (RFQ)</DialogTitle>
          <DialogDescription>
            Selecione os fornecedores que receberão pedido de orçamento. Os itens da solicitação
            serão copiados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="rfq-title" className="text-xs">
              Título da RFQ
            </Label>
            <Input
              id="rfq-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="(usa o título da solicitação)"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="rfq-deadline" className="text-xs">
              Prazo para retorno
            </Label>
            <Input
              id="rfq-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Fornecedores ({selected.length} selecionados)</Label>
            <SuppliersMultiselect suppliers={suppliers} selected={selected} onToggle={toggle} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={convertToRfq.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={convertToRfq.isPending}>
            {convertToRfq.isPending ? "Convertendo..." : "Confirmar conversão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuppliersMultiselect({
  suppliers,
  selected,
  onToggle,
}: {
  suppliers: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="mt-1 w-full justify-between">
          {selected.length === 0 ? "Selecione fornecedores" : `${selected.length} selecionado(s)`}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar fornecedor..." />
          <CommandList>
            <CommandEmpty>Nenhum fornecedor.</CommandEmpty>
            <CommandGroup>
              {suppliers.map((s) => (
                <CommandItem key={s.id} value={s.name} onSelect={() => onToggle(s.id)}>
                  <Checkbox
                    checked={selected.includes(s.id)}
                    onCheckedChange={() => onToggle(s.id)}
                    className="mr-2"
                  />
                  <span>{s.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-3 w-3",
                      selected.includes(s.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
