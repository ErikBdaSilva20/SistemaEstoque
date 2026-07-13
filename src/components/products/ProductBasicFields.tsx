import type { Control } from "react-hook-form";
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
import type { Supplier } from "@/hooks/useSuppliers";
import { PRODUCT_UNITS, type ProductFormInput, type ProductFormValues } from "./productFormSchema";

export interface ProductBasicFieldsProps {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  suppliers: Supplier[];
  isEdit: boolean;
  /** Esconde o campo de custo (dado financeiro/gerencial) de quem não é admin/manager. */
  showCost?: boolean;
}

/** Identificação, categorização, preços e rastreabilidade — a metade "sempre visível" do form de produto. */
export function ProductBasicFields({
  control,
  suppliers,
  isEdit,
  showCost = true,
}: ProductBasicFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
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
          control={control}
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
        control={control}
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
        control={control}
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
          control={control}
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
          control={control}
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
                  {PRODUCT_UNITS.map((u) => (
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
          control={control}
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

      <div className={showCost ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-4"}>
        {showCost && (
          <FormField
            control={control}
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
        )}
        <FormField
          control={control}
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
          control={control}
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
          control={control}
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
        <div className="text-xs font-medium uppercase text-muted-foreground">Rastreabilidade</div>
        <FormField
          control={control}
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
                    Recomendado para alimentos, medicamentos e cosméticos. Permite rastrear lotes e
                    alertar vencimentos (FEFO).
                  </span>
                </span>
              </label>
            </FormItem>
          )}
        />
        <FormField
          control={control}
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
    </>
  );
}
