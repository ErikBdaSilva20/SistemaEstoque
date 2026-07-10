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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useProductMutations, type Product } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { ProductPhotoUpload } from "./ProductPhotoUpload";

const schema = z.object({
  sku: z.string().trim().min(1, "SKU é obrigatório").max(50),
  barcode: z.string().trim().max(50).optional().or(z.literal("")),
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  unit: z.string().trim().min(1).max(10),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  min_stock: z.coerce.number().min(0),
  supplier_id: z.string().optional().or(z.literal("")),
  initial_stock: z.coerce.number().min(0).optional(),
  track_batches: z.boolean(),
  track_locations: z.boolean(),
  // Campos ricos (todos opcionais)
  photo_url: z.string().optional().or(z.literal("")).nullable(),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  model: z.string().trim().max(100).optional().or(z.literal("")),
  ncm: z.string().trim().max(20).optional().or(z.literal("")),
  cest: z.string().trim().max(20).optional().or(z.literal("")),
  origin: z.string().optional().or(z.literal("")),
  weight_kg: z.coerce.number().min(0).optional().nullable(),
  length_cm: z.coerce.number().min(0).optional().nullable(),
  width_cm: z.coerce.number().min(0).optional().nullable(),
  height_cm: z.coerce.number().min(0).optional().nullable(),
  technical_spec: z.string().trim().max(2000).optional().or(z.literal("")),
  internal_notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const UNITS = ["un", "kg", "g", "L", "ml", "m", "cm", "cx", "pct"];

export interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  const { create, update } = useProductMutations();
  const { data: suppliers = [] } = useSuppliers();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    if (open) {
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
        form.reset({
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
        });
      }
    }
  }, [open, product, form]);

  const onSubmit = async (values: FormValues) => {
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
        toast.success("Produto atualizado.");
      } else {
        const created = await create.mutateAsync({
          ...payload,
          current_stock: values.initial_stock ?? 0,
        });
        toast.success(`Produto "${created.name}" criado.`);
      }
      onOpenChange(false);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("products_owner_id_sku_key")) {
        toast.error("Já existe um produto com este SKU.");
      } else {
        toast.error(msg);
      }
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize as informações do produto." : "Cadastre um produto no seu estoque."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="P-0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de barras (EAN)</FormLabel>
                    <FormControl>
                      <Input placeholder="7891234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bebidas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
                      value={field.value || "__none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">Nenhum</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
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
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
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
              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque mínimo</FormLabel>
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
            </div>

            {!isEdit && (
              <FormField
                control={form.control}
                name="initial_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque inicial</FormLabel>
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
            )}

            <div className="rounded-md border border-border bg-bg-base/40 p-3 space-y-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Rastreabilidade
              </div>
              <FormField
                control={form.control}
                name="track_batches"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        <span className="font-medium">Controlar por lote / validade</span>
                        <span className="block text-xs text-muted-foreground">
                          Recomendado para alimentos, medicamentos e cosméticos. Permite rastrear
                          lotes e alertar vencimentos (FEFO).
                        </span>
                      </span>
                    </label>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="track_locations"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        <span className="font-medium">Controlar por depósito / local</span>
                        <span className="block text-xs text-muted-foreground">
                          Obriga informar o local em cada movimentação.
                        </span>
                      </span>
                    </label>
                  </FormItem>
                )}
              />
            </div>

            <details className="group rounded-md border border-border bg-bg-base/40 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Detalhes técnicos, fiscal e logística
                <span className="ml-2 text-xs text-muted-foreground group-open:hidden">
                  (clique para expandir)
                </span>
              </summary>

              <div className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto do produto</FormLabel>
                      <FormControl>
                        <ProductPhotoUpload
                          value={field.value as string | null}
                          onChange={(v) => field.onChange(v)}
                          productSku={form.getValues("sku") || undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ncm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NCM</FormLabel>
                        <FormControl>
                          <Input placeholder="0000.00.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEST</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nacional">Nacional</SelectItem>
                            <SelectItem value="importado">Importado</SelectItem>
                            <SelectItem value="mercosul">Mercosul</SelectItem>
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
                    name="weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            {...field}
                            value={(field.value as number | string | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <Label className="text-xs">Dimensões (cm)</Label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="length_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Comp."
                                {...field}
                                value={(field.value as number | string | undefined) ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="width_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Larg."
                                {...field}
                                value={(field.value as number | string | undefined) ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="height_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Alt."
                                {...field}
                                value={(field.value as number | string | undefined) ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="technical_spec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ficha técnica</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Especificações, composição, aplicações..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internal_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações internas</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </details>

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
                {busy ? "Salvando..." : isEdit ? "Salvar" : "Criar produto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
