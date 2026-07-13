import { useEffect } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDialog } from "@/components/forms/FormDialog";
import { TextField } from "@/components/forms/fields/TextField";
import { TextareaField } from "@/components/forms/fields/TextareaField";
import { NumberField } from "@/components/forms/fields/NumberField";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSupplierMutations, type Supplier } from "@/hooks/useSuppliers";
import { formatCnpj, isValidCnpj, onlyDigits } from "@/lib/cnpj";
import { toastSuccess, toastError } from "@/lib/toast";

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

/** CNPJ precisa de máscara própria, então não usa o TextField genérico. */
function CnpjField() {
  const { control } = useFormContext<FormInput>();
  return (
    <FormField
      control={control}
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
  );
}

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
        toastSuccess("Fornecedor atualizado.");
      } else {
        await create.mutateAsync(payload);
        toastSuccess("Fornecedor criado.");
      }
      onOpenChange(false);
    } catch (e) {
      toastError(e);
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={isEdit ? "Editar fornecedor" : "Novo fornecedor"}
      description={isEdit ? "Atualize os dados do fornecedor." : "Cadastre um novo fornecedor."}
      busy={busy}
      submitLabel={isEdit ? "Salvar" : "Criar fornecedor"}
      contentClassName="sm:max-w-xl"
    >
      <TextField name="name" label="Nome *" />
      <div className="grid grid-cols-2 gap-4">
        <CnpjField />
        <NumberField name="lead_time_days" label="Lead time (dias)" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField name="email" label="Email" type="email" />
        <TextField name="phone" label="Telefone" placeholder="(11) 99999-9999" />
      </div>
      <TextareaField name="notes" label="Observações" />
    </FormDialog>
  );
}
