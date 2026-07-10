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
import { useProducts } from "@/hooks/useProducts";
import { usePurchaseRequestMutations } from "@/hooks/usePurchaseRequests";
import { cn } from "@/lib/utils";
import { formatBRL, formatNumber } from "@/lib/formatters";
import { mapGatewayError } from "@/lib/errors";

const itemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  quantity: z.coerce.number().positive("Qtd. > 0"),
  estimated_unit_cost: z.coerce.number().min(0).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

const schema = z.object({
  title: z.string().trim().min(3, "Título muito curto").max(120),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  expected_date: z.string().optional().or(z.literal("")),
  justification: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Adicione ao menos um item"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function PurchaseRequestForm() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts({ includeInactive: false });
  const { create, submit } = usePurchaseRequestMutations();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      priority: "normal",
      expected_date: "",
      justification: "",
      notes: "",
      items: [{ product_id: "", quantity: 1, estimated_unit_cost: "", notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const total = useMemo(() => {
    return items.reduce((acc, it) => {
      const q = Number(it.quantity) || 0;
      const c = Number(it.estimated_unit_cost) || 0;
      return acc + q * c;
    }, 0);
  }, [items]);

  const onSubmitDraft = async (values: FormValues) => {
    try {
      const pr = await create.mutateAsync({
        title: values.title,
        priority: values.priority,
        expectedDate: values.expected_date || null,
        justification: values.justification || null,
        notes: values.notes || null,
        items: values.items.map((i) => ({
          productId: i.product_id,
          quantity: Number(i.quantity),
          estimatedUnitCost: i.estimated_unit_cost === "" ? null : Number(i.estimated_unit_cost),
          notes: (i.notes as string) || null,
        })),
      });
      toast.success(`Solicitação ${pr.code} salva como rascunho.`);
      navigate(`/requests/${pr.id}`);
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  const onSubmitAndSend = async (values: FormValues) => {
    try {
      const pr = await create.mutateAsync({
        title: values.title,
        priority: values.priority,
        expectedDate: values.expected_date || null,
        justification: values.justification || null,
        notes: values.notes || null,
        items: values.items.map((i) => ({
          productId: i.product_id,
          quantity: Number(i.quantity),
          estimatedUnitCost: i.estimated_unit_cost === "" ? null : Number(i.estimated_unit_cost),
          notes: (i.notes as string) || null,
        })),
      });
      await submit.mutateAsync({ id: pr.id, justification: values.justification || null });
      toast.success(`Solicitação ${pr.code} enviada para aprovação.`);
      navigate(`/requests/${pr.id}`);
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Reposição de filtros mensal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
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
                <FormLabel>Data desejada</FormLabel>
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
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificativa</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Por que essa compra é necessária?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Itens solicitados</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ product_id: "", quantity: 1, estimated_unit_cost: "", notes: "" })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
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

          <div className="flex justify-end rounded-md border border-dashed border-border bg-bg-base/40 p-3 text-sm">
            Estimativa total:&nbsp;<strong className="tabular-nums">{formatBRL(total)}</strong>
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Notas internas (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/requests")}
            disabled={create.isPending || submit.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit(onSubmitDraft)}
            disabled={create.isPending || submit.isPending}
          >
            Salvar rascunho
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmitAndSend)}
            disabled={create.isPending || submit.isPending}
          >
            Enviar para aprovação
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
    sku: string;
    name: string;
    unit: string;
    cost_price: number;
    current_stock: number;
    min_stock: number;
  }>;
  form: ReturnType<typeof useForm<FormInput, unknown, FormValues>>;
}

function ItemRow({ index, onRemove, canRemove, products, form }: ItemRowProps) {
  const [open, setOpen] = useState(false);
  const productId = form.watch(`items.${index}.product_id`);
  const quantity = Number(form.watch(`items.${index}.quantity`)) || 0;
  const cost = Number(form.watch(`items.${index}.estimated_unit_cost`)) || 0;
  const subtotal = quantity * cost;
  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div className="rounded-md border border-border bg-bg-base/40 p-3">
      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
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
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {selectedProduct
                          ? `${selectedProduct.sku} · ${selectedProduct.name}`
                          : "Selecione"}
                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por SKU ou nome..." />
                      <CommandList>
                        <CommandEmpty>Nenhum produto.</CommandEmpty>
                        <CommandGroup>
                          {products.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.sku} ${p.name}`}
                              onSelect={() => {
                                field.onChange(p.id);
                                if (
                                  !form.getValues(`items.${index}.estimated_unit_cost`) ||
                                  form.getValues(`items.${index}.estimated_unit_cost`) === ""
                                ) {
                                  form.setValue(
                                    `items.${index}.estimated_unit_cost`,
                                    p.cost_price ? String(p.cost_price) : "",
                                  );
                                }
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  field.value === p.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="min-w-0">
                                <div className="truncate text-sm">{p.name}</div>
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

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Quantidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...field}
                    value={(field.value as string | number | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name={`items.${index}.estimated_unit_cost`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Custo est. (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...field}
                    value={(field.value as string | number | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2 flex items-end">
          <div className="w-full text-right text-sm">
            <div className="text-xs text-muted-foreground">Subtotal</div>
            <div className="font-medium tabular-nums">{formatBRL(subtotal)}</div>
          </div>
        </div>

        <div className="md:col-span-1 flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={!canRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
