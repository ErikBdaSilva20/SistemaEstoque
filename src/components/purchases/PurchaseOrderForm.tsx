import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { usePurchaseMutations } from "@/hooks/usePurchases";
import { cn } from "@/lib/utils";
import { formatBRL, formatNumber } from "@/lib/formatters";
import { toastSuccess, toastError } from "@/lib/toast";

const itemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  quantityOrdered: z.coerce.number().positive("Qtd. deve ser > 0"),
  unitCost: z.coerce.number().min(0, "Custo deve ser >= 0"),
});

const schema = z.object({
  supplier_id: z.string().uuid("Selecione um fornecedor"),
  expected_date: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Adicione ao menos um item"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { data: suppliers = [] } = useSuppliers(false);
  const { data: products = [] } = useProducts({ includeInactive: false });
  const { create } = usePurchaseMutations();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplier_id: "",
      expected_date: "",
      notes: "",
      items: [{ product_id: "", quantityOrdered: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number(it.quantityOrdered) || 0) * (Number(it.unitCost) || 0),
        0,
      ),
    [items],
  );

  const onSubmit = async (values: FormValues) => {
    try {
      const order = await create.mutateAsync({
        supplierId: values.supplier_id,
        expectedDate: values.expected_date || null,
        notes: values.notes?.trim() || null,
        items: values.items.map((it) => ({
          productId: it.product_id,
          quantityOrdered: it.quantityOrdered,
          unitCost: it.unitCost,
        })),
      });
      toastSuccess(`Pedido ${order.code} criado.`);
      navigate(`/purchases/${order.id}`);
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-elevation-1">
          <h2 className="mb-4 text-base font-semibold">Cabeçalho</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                          {s.lead_time_days ? ` (lead ${s.lead_time_days}d)` : ""}
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
              name="expected_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previsão de entrega</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
              <FormItem className="mt-4">
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-elevation-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Itens</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: "", quantityOrdered: 1, unitCost: 0 })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <ItemRow
                key={field.id}
                index={index}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
                products={products}
                form={form}
              />
            ))}
          </div>

          {form.formState.errors.items?.message && (
            <p className="mt-3 text-sm text-destructive">{form.formState.errors.items.message}</p>
          )}

          <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total do pedido</div>
              <div className="text-2xl font-semibold tabular-nums">{formatBRL(total)}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/purchases")}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Criando..." : "Criar pedido (rascunho)"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface ItemRowProps {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    barcode?: string | null;
  }>;
  form: ReturnType<typeof useForm<FormInput, unknown, FormValues>>;
}

function ItemRow({ index, onRemove, canRemove, products, form }: ItemRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const productId = form.watch(`items.${index}.product_id`);
  const qty = form.watch(`items.${index}.quantityOrdered`);
  const cost = form.watch(`items.${index}.unitCost`);
  const subtotal = (Number(qty) || 0) * (Number(cost) || 0);
  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div className="grid grid-cols-12 items-start gap-2 rounded-lg border border-border/50 bg-bg-base/40 p-3">
      <div className="col-span-12 md:col-span-5">
        <FormField
          control={form.control}
          name={`items.${index}.product_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Produto</FormLabel>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {selectedProduct
                        ? `${selectedProduct.name} (${selectedProduct.sku})`
                        : "Selecione..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar..." />
                    <CommandList>
                      <CommandEmpty>Nenhum produto.</CommandEmpty>
                      <CommandGroup>
                        {products.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.sku} ${p.barcode ?? ""}`}
                            onSelect={() => {
                              form.setValue(`items.${index}.product_id`, p.id, {
                                shouldValidate: true,
                              });
                              setPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                p.id === field.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.sku} · estoque {formatNumber(p.current_stock)} {p.unit}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-5 md:col-span-2">
        <FormField
          control={form.control}
          name={`items.${index}.quantityOrdered`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                Qtd.{selectedProduct ? ` (${selectedProduct.unit})` : ""}
              </FormLabel>
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

      <div className="col-span-7 md:col-span-2">
        <FormField
          control={form.control}
          name={`items.${index}.unitCost`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Custo unit. (R$)</FormLabel>
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
      </div>

      <div className="col-span-10 md:col-span-2 self-end">
        <div className="text-xs text-muted-foreground">Subtotal</div>
        <div className="font-medium tabular-nums">{formatBRL(subtotal)}</div>
      </div>

      <div className="col-span-2 md:col-span-1 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          className="mt-5 text-muted-foreground hover:text-destructive"
          title="Remover item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
