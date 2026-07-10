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
import { useSupplierMutations, type Supplier } from "@/hooks/useSuppliers";
import { formatCnpj, isValidCnpj, onlyDigits } from "@/lib/cnpj";
import { mapGatewayError } from "@/lib/errors";

const schema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  cnpj: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidCnpj(v), {
      message: "CNPJ inválido (verifique os dígitos).",
    }),
  email: z.string().trim().max(200).email("Email inválido").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  lead_time_days: z.coerce.number().int().min(0).max(365),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
  const isEdit = !!supplier;
  const { create, update } = useSupplierMutations();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      lead_time_days: 7,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (supplier) {
        form.reset({
          name: supplier.name,
          cnpj: supplier.cnpj ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          lead_time_days: supplier.lead_time_days,
          notes: supplier.notes ?? "",
        });
      } else {
        form.reset({
          name: "",
          cnpj: "",
          email: "",
          phone: "",
          lead_time_days: 7,
          notes: "",
        });
      }
    }
  }, [open, supplier, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name.trim(),
      cnpj: values.cnpj ? onlyDigits(values.cnpj) || null : null,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      lead_time_days: values.lead_time_days,
      notes: values.notes?.trim() || null,
    };
    try {
      if (isEdit && supplier) {
        await update.mutateAsync({ id: supplier.id, patch: payload });
        toast.success("Fornecedor atualizado.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Fornecedor criado.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do fornecedor." : "Cadastre um novo fornecedor."}
          </DialogDescription>
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
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00.000.000/0001-00"
                        value={formatCnpj(String(field.value ?? ""))}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lead_time_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead time (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
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
                {busy ? "Salvando..." : isEdit ? "Salvar" : "Criar fornecedor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
