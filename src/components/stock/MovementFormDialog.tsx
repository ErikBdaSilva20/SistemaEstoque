// MovementFormDialog — dialog de registro de movimentação de estoque.
// Camada de composição: monta os subcomponentes de campo + hook de form + mutações.
// Toda lógica de I/O (onSubmit, reason lookup/create) fica aqui porque este componente
// é o único que possui todos os dados necessários ao mesmo tempo (form values + reasons + selectedProduct).

import { FormDialog } from "@/components/forms/FormDialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormProvider } from "react-hook-form";

import { useProducts } from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import { useProductBatches } from "@/hooks/useBatches";
import { useStockDestinations, useStockDestinationMutations } from "@/hooks/useStockDestinations";
import { useMovementReasons, type MovementReasonScope } from "@/hooks/useMovementReasons";
import { useMovementMutations } from "@/hooks/useMovements";
import { useMovementReasonMutations } from "@/hooks/useMovementReasons";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/formatters";
import { toastSuccess, toastError } from "@/lib/toast";

import { useMovementForm, type MovementFormValues } from "./movement-form/useMovementForm";
import { MovementProductField } from "./movement-form/MovementProductField";
import { MovementDestinationField } from "./movement-form/MovementDestinationField";
import { MovementReasonField } from "./movement-form/MovementReasonField";

export interface MovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProductId?: string;
}

export function MovementFormDialog({
  open,
  onOpenChange,
  defaultProductId,
}: MovementFormDialogProps) {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: products = [] } = useProducts({ includeInactive: false });
  const { data: locations = [] } = useLocations(false);
  const { data: destinations = [] } = useStockDestinations();
  const { create: createDestination } = useStockDestinationMutations();
  const { create: createMovement } = useMovementMutations();
  const { create: createReason } = useMovementReasonMutations();

  const defaultLocationId = locations.find((l) => l.is_default)?.id;

  // ── Form state (pure — no side-effects, no I/O) ───────────────────────────
  const { form, type, selectedProduct, sourceLocationId, predictedStock } = useMovementForm({
    defaultProductId,
    defaultLocationId,
    products,
  });

  // ── Derived async data that depends on form state ─────────────────────────
  const { data: batches = [] } = useProductBatches(
    selectedProduct?.track_batches ? selectedProduct.id : undefined,
    sourceLocationId || undefined,
  );

  const reasonScope: MovementReasonScope | undefined =
    type === "in" || type === "out" || type === "adjustment" ? type : undefined;
  const { data: reasons = [] } = useMovementReasons(reasonScope);

  const availableBatches = batches.filter((b) => Number(b.quantity) > 0);

  // ── Submit (orchestrates I/O: reason upsert → movement create) ────────────
  const onSubmit = async (values: MovementFormValues) => {
    const qty = values.type === "adjustment" ? values.quantity : Math.abs(values.quantity);

    try {
      let reasonId: string | null = null;
      const reasonText = values.reason?.trim();
      if (reasonText) {
        const existing = reasons.find((r) => r.label === reasonText);
        reasonId = existing
          ? existing.id
          : (await createReason.mutateAsync({ label: reasonText, scope: reasonScope ?? "any" })).id;
      }

      await createMovement.mutateAsync({
        product_id: values.product_id,
        product_name: selectedProduct?.name ?? "",
        type: values.type,
        quantity: qty,
        location_id: values.location_id || null,
        destination_location_id:
          values.type === "transfer" ? values.destination_location_id || null : null,
        destination_id: values.type === "out" ? values.destination_id || null : null,
        batch_id: values.batch_id || null,
        reason_id: reasonId,
        notes: values.notes?.trim() || null,
        origin: "manual",
      });

      toastSuccess("Movimentação registrada.");
      onOpenChange(false);
    } catch (e) {
      toastError(e);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <FormProvider {...form}>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        form={form}
        onSubmit={onSubmit}
        title="Registrar movimentação"
        description="Entrada, saída ou ajuste de estoque."
        busy={createMovement.isPending}
        submitLabel="Registrar"
        busyLabel="Registrando..."
      >
        <MovementProductField products={products} selectedProduct={selectedProduct} />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
                    <SelectItem value="adjustment">Ajuste (+/-)</SelectItem>
                    <SelectItem value="transfer">Transferência entre locais</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade {type === "adjustment" && "(+/-)"}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    {...field}
                    value={field.value as number | string | undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {locations.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === "transfer" ? "Origem" : "Local"}</FormLabel>
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
                          {l.is_default ? " (padrão)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === "transfer" && (
              <FormField
                control={form.control}
                name="destination_location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations
                          .filter((l) => l.id !== sourceLocationId)
                          .map((l) => (
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
            )}
          </div>
        )}

        {selectedProduct?.track_batches && availableBatches.length > 0 && (
          <FormField
            control={form.control}
            name="batch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Lote{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (FEFO — vencimento mais próximo primeiro)
                  </span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem lote específico" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableBatches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.batch_code} · {formatNumber(b.quantity)} {selectedProduct.unit}
                        {b.expiration_date ? ` · venc ${formatDate(b.expiration_date)}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedProduct && predictedStock !== null && type !== "transfer" && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Estoque após movimentação: </span>
            <span
              className={cn(
                "font-semibold",
                predictedStock < 0 && "text-destructive",
                predictedStock < Number(selectedProduct.min_stock) &&
                  predictedStock >= 0 &&
                  "text-warning",
              )}
            >
              {formatNumber(predictedStock)} {selectedProduct.unit}
            </span>
            {predictedStock < 0 && (
              <span className="ml-2 text-xs text-destructive">⚠ estoque ficará negativo</span>
            )}
          </div>
        )}

        {type === "out" && (
          <MovementDestinationField
            destinations={destinations}
            createDestinationPending={createDestination.isPending}
            onCreateDestination={(name, kind) => createDestination.mutateAsync({ name, kind })}
          />
        )}

        <MovementReasonField reasons={reasons} type={type} />

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
      </FormDialog>
    </FormProvider>
  );
}
