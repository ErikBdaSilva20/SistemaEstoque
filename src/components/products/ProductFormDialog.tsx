import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/forms/FormDialog";
import { useProductMutations, type Product } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { toastSuccess, toastError } from "@/lib/toast";
import { ProductBasicFields } from "./ProductBasicFields";
import { ProductAdvancedFields } from "./ProductAdvancedFields";
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "./productFormSchema";

export interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

const emptyDefaults: ProductFormInput = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  category: "",
  unit: "un",
  cost: 0,
  price: 0,
  min_stock: 0,
  supplier_id: "",
  initial_stock: 0,
  track_batches: false,
  track_locations: false,
  photo_url: null,
  brand: "",
  model: "",
  ncm: "",
  cest: "",
  origin: "",
  weight_kg: null,
  length_cm: null,
  width_cm: null,
  height_cm: null,
  technical_spec: "",
  internal_notes: "",
};

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  const { create, update } = useProductMutations();
  const { data: suppliers = [] } = useSuppliers();

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (product) {
      const dims =
        (product.dimensions as {
          length_cm?: number;
          width_cm?: number;
          height_cm?: number;
        } | null) ?? null;
      form.reset({
        sku: product.sku,
        barcode: product.barcode ?? "",
        name: product.name,
        description: product.description ?? "",
        category: product.category ?? "",
        unit: product.unit,
        cost: Number(product.cost_price),
        price: Number(product.sale_price),
        min_stock: Number(product.min_stock),
        supplier_id: product.supplier_id ?? "",
        initial_stock: 0,
        track_batches: product.track_batches,
        track_locations: product.track_locations,
        photo_url: product.photo_url ?? null,
        brand: product.brand ?? "",
        model: product.model ?? "",
        ncm: product.ncm ?? "",
        cest: product.cest ?? "",
        origin: product.origin ?? "",
        weight_kg: product.weight_kg ?? null,
        length_cm: dims?.length_cm ?? null,
        width_cm: dims?.width_cm ?? null,
        height_cm: dims?.height_cm ?? null,
        technical_spec: product.technical_spec ?? "",
        internal_notes: product.internal_notes ?? "",
      });
    } else {
      form.reset(emptyDefaults);
    }
  }, [open, product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    const hasDims = values.length_cm != null || values.width_cm != null || values.height_cm != null;
    const dimensions = hasDims
      ? {
          length_cm: values.length_cm ?? null,
          width_cm: values.width_cm ?? null,
          height_cm: values.height_cm ?? null,
        }
      : null;

    const payload = {
      sku: values.sku.trim(),
      barcode: values.barcode?.trim() || null,
      name: values.name.trim(),
      description: values.description?.trim() || null,
      category: values.category?.trim() || null,
      unit: values.unit,
      cost_price: values.cost,
      sale_price: values.price,
      min_stock: values.min_stock,
      supplier_id: values.supplier_id || null,
      track_batches: values.track_batches,
      track_locations: values.track_locations,
      photo_url: values.photo_url || null,
      brand: values.brand?.trim() || null,
      model: values.model?.trim() || null,
      ncm: values.ncm?.trim() || null,
      cest: values.cest?.trim() || null,
      origin: values.origin || null,
      weight_kg: values.weight_kg ?? null,
      dimensions,
      technical_spec: values.technical_spec?.trim() || null,
      internal_notes: values.internal_notes?.trim() || null,
    };

    try {
      if (isEdit && product) {
        await update.mutateAsync({ id: product.id, patch: payload });
        toastSuccess("Produto atualizado.");
      } else {
        const created = await create.mutateAsync({
          ...payload,
          current_stock: values.initial_stock ?? 0,
        });
        toastSuccess(`Produto "${created.name}" criado.`);
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
      title={isEdit ? "Editar produto" : "Novo produto"}
      description={
        isEdit ? "Atualize as informações do produto." : "Cadastre um produto no seu estoque."
      }
      busy={busy}
      submitLabel={isEdit ? "Salvar" : "Criar produto"}
      contentClassName="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
    >
      <ProductBasicFields control={form.control} suppliers={suppliers} isEdit={isEdit} />
      <ProductAdvancedFields control={form.control} />
    </FormDialog>
  );
}
