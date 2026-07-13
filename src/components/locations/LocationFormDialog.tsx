import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDialog } from "@/components/forms/FormDialog";
import { TextField } from "@/components/forms/fields/TextField";
import { TextareaField } from "@/components/forms/fields/TextareaField";
import { SelectField } from "@/components/forms/fields/SelectField";
import { CheckboxField } from "@/components/forms/fields/CheckboxField";
import { useLocationMutations, type Location } from "@/hooks/useLocations";
import { toastSuccess, toastError } from "@/lib/toast";

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

const TYPE_OPTIONS = [
  { value: "warehouse", label: "Depósito" },
  { value: "store", label: "Loja" },
  { value: "vehicle", label: "Veículo" },
  { value: "other", label: "Outro" },
];

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
        toastSuccess("Local atualizado.");
      } else {
        await create.mutateAsync(payload);
        toastSuccess("Local criado.");
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
      title={isEdit ? "Editar local" : "Novo local"}
      description="Depósitos, lojas ou outros pontos de armazenamento."
      busy={busy}
      submitLabel={isEdit ? "Salvar" : "Criar local"}
    >
      <TextField name="name" label="Nome *" />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="code" label="Código" placeholder="MAIN" />
        <SelectField name="type" label="Tipo" options={TYPE_OPTIONS} />
      </div>
      <TextField name="address" label="Endereço" />
      <TextareaField name="notes" label="Observações" />
      <CheckboxField
        name="is_default"
        label="Definir como local padrão (substitui o atual)"
        className="rounded-md border border-border bg-bg-base/40 p-3"
      />
    </FormDialog>
  );
}
