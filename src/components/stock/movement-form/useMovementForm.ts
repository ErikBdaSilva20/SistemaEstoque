// Hook de formulário de movimentação de estoque.
// Gerencia: instância do react-hook-form, reset ao abrir, valores derivados observados.
// Regras: schema §B4 (type/quantity), validação de transferência (origem ≠ destino).
// O onSubmit NÃO é responsabilidade deste hook — fica no componente que conhece os dados externos
// (reasons, selectedProduct) no momento do submit.

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const movementSchema = z
  .object({
    product_id: z.string().uuid("Selecione um produto"),
    type: z.enum(["in", "out", "adjustment", "transfer"]),
    quantity: z.coerce.number().refine((n) => n !== 0, "Quantidade não pode ser zero"),
    location_id: z.string().uuid().optional().or(z.literal("")),
    destination_location_id: z.string().uuid().optional().or(z.literal("")),
    destination_id: z.string().uuid().optional().or(z.literal("")),
    batch_id: z.string().uuid().optional().or(z.literal("")),
    reason: z.string().trim().max(200).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      d.type !== "transfer" ||
      (d.location_id && d.destination_location_id && d.location_id !== d.destination_location_id),
    {
      path: ["destination_location_id"],
      message: "Transferência exige local de origem e destino diferentes.",
    },
  );

export type MovementFormInput = z.input<typeof movementSchema>;
export type MovementFormValues = z.output<typeof movementSchema>;

export interface MovementFormProduct {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  current_stock: number;
  min_stock: number;
  unit: string;
  track_batches?: boolean;
}

interface UseMovementFormOptions {
  /** Pre-fill the product picker when opening from a product detail page. */
  defaultProductId?: string;
  /** Pre-fill the location picker with the default warehouse location. */
  defaultLocationId?: string;
  /** Full product list, used to derive `selectedProduct` reactively. */
  products: MovementFormProduct[];
}

export function useMovementForm({
  defaultProductId,
  defaultLocationId,
  products,
}: UseMovementFormOptions) {
  const form = useForm<MovementFormInput, unknown, MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: buildDefaults(defaultProductId, defaultLocationId),
  });

  const type = form.watch("type");
  const selectedProductId = form.watch("product_id");
  const sourceLocationId = form.watch("location_id");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

  // Reset the form every time the dialog is re-opened with a (potentially new) product/location.
  useEffect(() => {
    form.reset(buildDefaults(defaultProductId, defaultLocationId));
  }, [defaultProductId, defaultLocationId, form]);

  const predictedStock = useMemo(() => {
    if (!selectedProduct) return null;
    const current = Number(selectedProduct.current_stock);
    const qty = Number(form.watch("quantity")) || 0;
    if (type === "in") return current + Math.abs(qty);
    if (type === "out") return current - Math.abs(qty);
    // adjustment: signed delta
    return current + qty;
  }, [selectedProduct, type, form]);

  return {
    form,
    type,
    selectedProduct,
    sourceLocationId,
    predictedStock,
  };
}

function buildDefaults(defaultProductId?: string, defaultLocationId?: string): MovementFormInput {
  return {
    product_id: defaultProductId ?? "",
    type: "out",
    quantity: 1,
    location_id: defaultLocationId ?? "",
    destination_location_id: "",
    destination_id: "",
    batch_id: "",
    reason: "",
    notes: "",
  };
}
