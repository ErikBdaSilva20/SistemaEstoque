import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocations";
import { useBatchMutations, type ProductBatch } from "@/hooks/useBatches";

const schema = z.object({
  batch_code: z.string().trim().min(1, "Código do lote obrigatório").max(60),
  location_id: z.string().uuid("Local obrigatório"),
  manufacture_date: z.string().optional().or(z.literal("")),
  expiration_date: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0, "Quantidade deve ser >= 0"),
  unit_cost: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  batch?: ProductBatch | null;
  onSaved?: () => void;
}

export function BatchFormDialog({ open, onOpenChange, productId, batch, onSaved }: Props) {
  const isEdit = !!batch;
  const { data: locations = [] } = useLocations(false);
  const { create, update } = useBatchMutations();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      batch_code: "",
      location_id: "",
      manufacture_date: "",
      expiration_date: "",
      quantity: 0,
      unit_cost: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (batch) {
      form.reset({
        batch_code: batch.batch_code,
        location_id: batch.location_id ?? "",
        manufacture_date: batch.manufacture_date ?? "",
        expiration_date: batch.expiration_date ?? "",
        quantity: Number(batch.quantity),
        unit_cost: batch.unit_cost != null ? Number(batch.unit_cost) : undefined,
        notes: batch.notes ?? "",
      });
    } else {
      const defaultLoc = locations.find((l) => l.is_default);
      form.reset({
        batch_code: "",
        location_id: defaultLoc?.id ?? "",
        manufacture_date: "",
        expiration_date: "",
        quantity: 0,
        unit_cost: undefined,
        notes: "",
      });
    }
  }, [open, batch, locations, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      product_id: productId,
      batch_code: values.batch_code.trim(),
      location_id: values.location_id,
      manufacture_date: values.manufacture_date || null,
      expiration_date: values.expiration_date || null,
      quantity: values.quantity,
      unit_cost: values.unit_cost ?? null,
      notes: values.notes?.trim() || null,
    };
    try {
      if (isEdit && batch) {
        await update.mutateAsync({ id: batch.id, patch: payload });
        toast.success("Lote atualizado.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Lote cadastrado.");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lote" : "Novo lote"}</DialogTitle>
          <DialogDescription>
            Lotes permitem rastrear validade (FEFO) e custos por entrada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batch_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do lote *</FormLabel>
                    <FormControl>
                      <Input placeholder="LOT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacture_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade {!isEdit && "(inicial)"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        {...field}
                        value={field.value as number | string | undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo unitário (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value as number | string | undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Salvando..." : isEdit ? "Salvar" : "Criar lote"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
