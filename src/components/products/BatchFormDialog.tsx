import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDialog } from "@/components/forms/FormDialog";
import { TextField } from "@/components/forms/fields/TextField";
import { TextareaField } from "@/components/forms/fields/TextareaField";
import { NumberField } from "@/components/forms/fields/NumberField";
import { SelectField } from "@/components/forms/fields/SelectField";
import { DateField } from "@/components/forms/fields/DateField";
import { useLocations } from "@/hooks/useLocations";
import { useBatchMutations, type ProductBatch } from "@/hooks/useBatches";
import { toastSuccess, toastError } from "@/lib/toast";

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
        toastSuccess("Lote atualizado.");
      } else {
        await create.mutateAsync(payload);
        toastSuccess("Lote cadastrado.");
      }
      onSaved?.();
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
      title={isEdit ? "Editar lote" : "Novo lote"}
      description="Lotes permitem rastrear validade (FEFO) e custos por entrada."
      busy={busy}
      submitLabel={isEdit ? "Salvar" : "Criar lote"}
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField name="batch_code" label="Código do lote *" placeholder="LOT-001" />
        <SelectField
          name="location_id"
          label="Local *"
          placeholder="Selecione"
          options={locations.map((l) => ({ value: l.id, label: l.name }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DateField name="manufacture_date" label="Fabricação" />
        <DateField name="expiration_date" label="Validade" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          name="quantity"
          label={`Quantidade ${!isEdit ? "(inicial)" : ""}`}
          step="0.001"
        />
        <NumberField name="unit_cost" label="Custo unitário (R$)" step="0.01" />
      </div>
      <TextareaField name="notes" label="Observações" />
    </FormDialog>
  );
}
