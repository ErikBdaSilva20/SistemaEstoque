import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocations";
import { useCountSessionMutations } from "@/hooks/useCountSessions";
import { useProducts } from "@/hooks/useProducts";
import { mapGatewayError } from "@/lib/errors";

const schema = z.object({
  name: z.string().trim().min(1, "Descrição obrigatória").max(200),
  locationId: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewCountSessionDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { data: locations = [] } = useLocations(false);
  const { data: products = [] } = useProducts({ includeInactive: false });
  const { create } = useCountSessionMutations();

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[]),
  ).sort();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      locationId: "",
      category: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      const today = new Date().toLocaleDateString("pt-BR");
      form.reset({
        name: `Contagem ${today}`,
        locationId: "",
        category: "",
        notes: "",
      });
    }
  }, [open, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const session = await create.mutateAsync({
        name: values.name.trim(),
        locationId: values.locationId || null,
        category: values.category || null,
        notes: values.notes?.trim() || null,
      });
      toast.success(`Sessão ${session.code} criada.`);
      onOpenChange(false);
      navigate(`/counts/${session.id}`);
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova contagem cíclica</DialogTitle>
          <DialogDescription>
            Cria uma sessão de inventário com todos os produtos ativos (opcionalmente filtrados por
            categoria). Diferenças viram ajustes de estoque ao fechar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local (opcional)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__all__" ? "" : v)}
                      value={field.value || "__all__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {locations.map((l) => (
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
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (opcional)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__all__" ? "" : v)}
                      value={field.value || "__all__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={create.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Criando..." : "Criar e iniciar contagem"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
