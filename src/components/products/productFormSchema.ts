import { z } from "zod";

export const productFormSchema = z.object({
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

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

export const PRODUCT_UNITS = ["un", "kg", "g", "L", "ml", "m", "cm", "cx", "pct"];
