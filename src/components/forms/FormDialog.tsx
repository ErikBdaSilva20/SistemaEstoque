import type { ReactNode } from "react";
import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export interface FormDialogProps<TIn extends FieldValues, TOut extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: SubmitHandler<TOut>;
  title: ReactNode;
  description?: ReactNode;
  busy?: boolean;
  submitLabel: string;
  busyLabel?: string;
  cancelLabel?: string;
  /** Defaults to `sm:max-w-lg`; pass a wider class for richer forms. */
  contentClassName?: string;
  children: ReactNode;
}

/**
 * Wrapper padrão de dialog+form (§1.3 do docs/README.md). Cobre o boilerplate
 * repetido em cada *FormDialog.tsx: header, Form provider, footer com
 * Cancelar/Salvar e estado de "salvando". O corpo do formulário (campos)
 * continua livre via `children`.
 */
export function FormDialog<TIn extends FieldValues, TOut extends FieldValues>({
  open,
  onOpenChange,
  form,
  onSubmit,
  title,
  description,
  busy = false,
  submitLabel,
  busyLabel = "Salvando...",
  cancelLabel = "Cancelar",
  contentClassName = "sm:max-w-lg",
  children,
}: FormDialogProps<TIn, TOut>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {children}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? busyLabel : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
