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
import { useLocationMutations, type Location } from "@/hooks/useLocations";
import { mapGatewayError } from "@/lib/errors";

const schema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  type: z.enum(["warehouse", "store", "vehicle", "other"]),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  is_default: z.boolean(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
}

export function LocationFormDialog({ open, onOpenChange, location }: Props) {
  const isEdit = !!location;
  const { create, update } = useLocationMutations();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      type: "warehouse",
      address: "",
      notes: "",
      is_default: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (location) {
        form.reset({
          name: location.name,
          code: location.code ?? "",
          type: (location.kind as FormValues["type"]) ?? "warehouse",
          address: location.address ?? "",
          notes: location.notes ?? "",
          is_default: location.is_default,
        });
      } else {
        form.reset({
          name: "",
          code: "",
          type: "warehouse",
          address: "",
          notes: "",
          is_default: false,
        });
      }
    }
  }, [open, location, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name.trim(),
      code: values.code?.trim() || null,
      kind: values.type,
      address: values.address?.trim() || null,
      notes: values.notes?.trim() || null,
      is_default: values.is_default,
    };
    try {
      if (isEdit && location) {
        await update.mutateAsync({ id: location.id, patch: payload });
        toast.success("Local atualizado.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Local criado.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar local" : "Novo local"}</DialogTitle>
          <DialogDescription>Depósitos, lojas ou outros pontos de armazenamento.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="MAIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="warehouse">Depósito</SelectItem>
                        <SelectItem value="store">Loja</SelectItem>
                        <SelectItem value="vehicle">Veículo</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-base/40 p-3">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Definir como local padrão (substitui o atual)</span>
                  </label>
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
                {busy ? "Salvando..." : isEdit ? "Salvar" : "Criar local"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
