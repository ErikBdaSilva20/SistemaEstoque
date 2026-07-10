import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useQuoteMutations } from "@/hooks/useQuotes";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatters";
import { mapGatewayError } from "@/lib/errors";

const itemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  quantity_requested: z.coerce.number().positive("Qtd. deve ser > 0"),
  notes: z.string().trim().max(200).optional().or(z.literal("")),
});

const schema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  deadline: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Adicione ao menos um item"),
  supplier_ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um fornecedor"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function QuoteRequestForm() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts({ includeInactive: false });
  const { data: suppliers = [] } = useSuppliers(false);
  const { create, markSent } = useQuoteMutations();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      deadline: "",
      notes: "",
      items: [{ product_id: "", quantity_requested: 1, notes: "" }],
      supplier_ids: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedSuppliers = form.watch("supplier_ids");

  const toggleSupplier = (id: string) => {
    const current = form.getValues("supplier_ids");
    if (current.includes(id)) {
      form.setValue(
        "supplier_ids",
        current.filter((x) => x !== id),
        { shouldValidate: true },
      );
    } else {
      form.setValue("supplier_ids", [...current, id], { shouldValidate: true });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const request = await create.mutateAsync({
        title: values.title,
        deadline: values.deadline || null,
        notes: values.notes?.trim() || null,
        items: values.items.map((i) => ({
          productId: i.product_id,
          quantity: i.quantity_requested,
          notes: i.notes?.trim() || null,
        })),
        supplierIds: values.supplier_ids,
      });
      toast.success(`Solicitação ${request.code} criada como rascunho.`);
      navigate(`/quotes/${request.id}`);
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  const onSubmitAndSend = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    const values = form.getValues() as unknown as FormValues;
    try {
      const request = await create.mutateAsync({
        title: values.title,
        deadline: values.deadline || null,
        notes: values.notes?.trim() || null,
        items: values.items.map((i) => ({
          productId: i.product_id,
          quantity: i.quantity_requested,
          notes: i.notes?.trim() || null,
        })),
        supplierIds: values.supplier_ids,
      });
      await markSent.mutateAsync(request.id);
      toast.success(`${request.code} criada e marcada como enviada.`);
      navigate(`/quotes/${request.id}`);
    } catch (e) {
      toast.error(mapGatewayError(e));
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Compra de insumos - Abril" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo pra resposta</FormLabel>
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
                <FormLabel>Instruções aos fornecedores</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Ex: Informe melhor prazo, condições de pagamento e frete CIF/FOB."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-elevation-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Itens solicitados</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: "", quantity_requested: 1, notes: "" })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar item
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((f, idx) => (
              <ItemRow
                key={f.id}
                index={idx}
                form={form}
                products={products}
                onRemove={() => remove(idx)}
                canRemove={fields.length > 1}
              />
            ))}
          </div>
          {form.formState.errors.items?.message && (
            <p className="mt-3 text-sm text-destructive">{form.formState.errors.items.message}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-elevation-1">
          <h2 className="mb-4 text-base font-semibold">
            Fornecedores para cotar ({selectedSuppliers.length} selecionados)
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 max-h-[320px] overflow-y-auto">
            {suppliers.map((s) => (
              <label
                key={s.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-md border p-3",
                  selectedSuppliers.includes(s.id)
                    ? "border-accent-primary/40 bg-accent-primary/5"
                    : "border-border bg-bg-base/40",
                )}
              >
                <Checkbox
                  checked={selectedSuppliers.includes(s.id)}
                  onCheckedChange={() => toggleSupplier(s.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {s.email && <span className="truncate">{s.email}</span>}
                    {s.phone && <span className="shrink-0">{s.phone}</span>}
                  </div>
                  {!s.email && !s.phone && (
                    <div className="text-xs text-destructive">
                      Sem contato — não poderá ser enviado automaticamente
                    </div>
                  )}
                </div>
              </label>
            ))}
            {suppliers.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                Nenhum fornecedor cadastrado. Vá em Fornecedores primeiro.
              </p>
            )}
          </div>
          {form.formState.errors.supplier_ids?.message && (
            <p className="mt-3 text-sm text-destructive">
              {form.formState.errors.supplier_ids.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/quotes")}
            disabled={create.isPending || markSent.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="outline" disabled={create.isPending}>
            Salvar rascunho
          </Button>
          <Button
            type="button"
            onClick={onSubmitAndSend}
            disabled={create.isPending || markSent.isPending}
          >
            {markSent.isPending
              ? "Enviando..."
              : create.isPending
                ? "Salvando..."
                : "Salvar e enviar aos fornecedores"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface ItemRowProps {
  index: number;
  form: ReturnType<typeof useForm<FormInput, unknown, FormValues>>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    unit: string;
    current_stock: number;
    barcode: string | null;
  }>;
  onRemove: () => void;
  canRemove: boolean;
}

function ItemRow({ index, form, products, onRemove, canRemove }: ItemRowProps) {
  const [open, setOpen] = useState(false);
  const productId = form.watch(`items.${index}.product_id`);
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  return (
    <div className="grid grid-cols-12 items-start gap-2 rounded-lg border border-border/50 bg-bg-base/40 p-3">
      <div className="col-span-12 md:col-span-6">
        <FormField
          control={form.control}
          name={`items.${index}.product_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Produto</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
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
                              setOpen(false);
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
          name={`items.${index}.quantity_requested`}
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

      <div className="col-span-5 md:col-span-3">
        <FormField
          control={form.control}
          name={`items.${index}.notes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Observação</FormLabel>
              <FormControl>
                <Input placeholder="Ex: marca X, modelo Y..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-2 md:col-span-1 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          className="mt-5 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
