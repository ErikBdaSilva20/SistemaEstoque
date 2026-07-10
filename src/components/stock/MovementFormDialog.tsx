import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useMovementMutations } from "@/hooks/useMovements";
import { useLocations } from "@/hooks/useLocations";
import { useProductBatches } from "@/hooks/useBatches";
import {
  useStockDestinations,
  useStockDestinationMutations,
  type DestinationKind,
} from "@/hooks/useStockDestinations";
import {
  useMovementReasons,
  useMovementReasonMutations,
  type MovementReasonScope,
} from "@/hooks/useMovementReasons";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/formatters";
import { toastSuccess, toastError } from "@/lib/toast";

const REASON_FREEFORM = "__custom__";

const schema = z
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

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

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
  const { data: products = [] } = useProducts({ includeInactive: false });
  const { data: locations = [] } = useLocations(false);
  const { data: destinations = [] } = useStockDestinations();
  const { create: createDestination } = useStockDestinationMutations();
  const { create } = useMovementMutations();
  const { create: createReason } = useMovementReasonMutations();
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [reasonMode, setReasonMode] = useState<string>("");

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: defaultProductId ?? "",
      type: "out",
      quantity: 1,
      location_id: "",
      destination_location_id: "",
      destination_id: "",
      batch_id: "",
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      const defaultLoc = locations.find((l) => l.is_default);
      form.reset({
        product_id: defaultProductId ?? "",
        type: "out",
        quantity: 1,
        location_id: defaultLoc?.id ?? "",
        destination_location_id: "",
        destination_id: "",
        batch_id: "",
        reason: "",
        notes: "",
      });
      setReasonMode("");
    }
  }, [open, defaultProductId, form, locations]);

  const selectedProductId = form.watch("product_id");
  const type = form.watch("type");
  const sourceLocationId = form.watch("location_id");
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

  const { data: batches = [] } = useProductBatches(
    selectedProduct?.track_batches ? selectedProduct.id : undefined,
    sourceLocationId || undefined,
  );

  const reasonScope: MovementReasonScope | undefined =
    type === "in" || type === "out" || type === "adjustment" ? type : undefined;
  const { data: reasons = [] } = useMovementReasons(reasonScope);
  const availableBatches = batches.filter((b) => Number(b.quantity) > 0);

  // When the type changes, the reason scope changes too -- clear the previous
  // selection so we don't send a "weird" reason for the current type.
  useEffect(() => {
    setReasonMode("");
    form.setValue("reason", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const onSubmit = async (values: FormValues) => {
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

      await create.mutateAsync({
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

  const predictedStock = useMemo(() => {
    if (!selectedProduct) return null;
    const current = Number(selectedProduct.current_stock);
    const qty = Number(form.watch("quantity")) || 0;
    if (type === "in") return current + Math.abs(qty);
    if (type === "out") return current - Math.abs(qty);
    return current + qty;
  }, [selectedProduct, type, form]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title="Registrar movimentação"
      description="Entrada, saída ou ajuste de estoque."
      busy={create.isPending}
      submitLabel="Registrar"
      busyLabel="Registrando..."
    >
      <FormField
        control={form.control}
        name="product_id"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Produto *</FormLabel>
            <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {selectedProduct
                      ? `${selectedProduct.name} (${selectedProduct.sku})`
                      : "Selecione um produto"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar produto..." />
                  <CommandList>
                    <CommandEmpty>Nenhum produto.</CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.name} ${p.sku} ${p.barcode ?? ""}`}
                          onSelect={() => {
                            form.setValue("product_id", p.id);
                            setProductPickerOpen(false);
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
        <FormField
          control={form.control}
          name="destination_id"
          render={({ field }) => {
            const selectedDestination = destinations.find((d) => d.id === field.value);
            const searchTrimmed = destinationSearch.trim();
            const nameAlreadyExists = destinations.some(
              (d) => d.name.toLowerCase() === searchTrimmed.toLowerCase(),
            );
            const handleCreate = async (kind: DestinationKind) => {
              if (!searchTrimmed) return;
              try {
                const created = await createDestination.mutateAsync({
                  name: searchTrimmed,
                  kind,
                });
                field.onChange(created.id);
                setDestinationSearch("");
                setDestinationPickerOpen(false);
                toastSuccess("Destino cadastrado.");
              } catch (e) {
                toastError(e);
              }
            };
            return (
              <FormItem className="flex flex-col">
                <FormLabel>Destino *</FormLabel>
                <Popover open={destinationPickerOpen} onOpenChange={setDestinationPickerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {selectedDestination
                          ? `${selectedDestination.name} (${selectedDestination.kind})`
                          : "Selecione ou cadastre um destino"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter>
                      <CommandInput
                        placeholder="Buscar ou digitar novo..."
                        value={destinationSearch}
                        onValueChange={setDestinationSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchTrimmed ? (
                            <div className="space-y-2 p-2 text-left">
                              <p className="text-xs text-muted-foreground">
                                Cadastrar "{searchTrimmed}" como:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  type="button"
                                  disabled={createDestination.isPending}
                                  onClick={() => handleCreate("sector")}
                                >
                                  Setor
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  type="button"
                                  disabled={createDestination.isPending}
                                  onClick={() => handleCreate("consumer")}
                                >
                                  Consumidor
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  type="button"
                                  disabled={createDestination.isPending}
                                  onClick={() => handleCreate("other")}
                                >
                                  Outro
                                </Button>
                              </div>
                            </div>
                          ) : (
                            "Digite para buscar ou cadastrar."
                          )}
                        </CommandEmpty>
                        {destinations.length > 0 && (
                          <CommandGroup>
                            {destinations.map((d) => (
                              <CommandItem
                                key={d.id}
                                value={`${d.name} ${d.kind}`}
                                onSelect={() => {
                                  field.onChange(d.id);
                                  setDestinationPickerOpen(false);
                                  setDestinationSearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === d.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span className="flex-1">{d.name}</span>
                                <span className="text-xs text-muted-foreground">{d.kind}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {searchTrimmed && !nameAlreadyExists && destinations.length > 0 && (
                          <CommandGroup heading="Cadastrar novo">
                            <CommandItem
                              value={`__create_sector__${searchTrimmed}`}
                              onSelect={() => handleCreate("sector")}
                            >
                              + Cadastrar "{searchTrimmed}" como Setor
                            </CommandItem>
                            <CommandItem
                              value={`__create_consumer__${searchTrimmed}`}
                              onSelect={() => handleCreate("consumer")}
                            >
                              + Cadastrar "{searchTrimmed}" como Consumidor
                            </CommandItem>
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}

      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Motivo</FormLabel>
            {reasons.length > 0 ? (
              <div className="space-y-2">
                <Select
                  value={reasonMode}
                  onValueChange={(value) => {
                    setReasonMode(value);
                    if (value === REASON_FREEFORM) {
                      field.onChange("");
                    } else if (value === "") {
                      field.onChange("");
                    } else {
                      field.onChange(value);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um motivo cadastrado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {reasons.map((r) => (
                      <SelectItem key={r.id} value={r.label}>
                        {r.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={REASON_FREEFORM}>✏️ Outro motivo (digitar)</SelectItem>
                  </SelectContent>
                </Select>
                {reasonMode === REASON_FREEFORM && (
                  <FormControl>
                    <Input
                      placeholder="Digite o motivo"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                )}
              </div>
            ) : (
              <FormControl>
                <Input placeholder="Ex: Venda balcão, Contagem, Quebra..." {...field} />
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
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
  );
}
