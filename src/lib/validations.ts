import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(100, "Nome muito longo"),
    email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
    password: z
      .string()
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(128, "Senha muito longa")
      .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), {
        message: "Senha deve conter ao menos uma letra e um número",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, "Domínio inválido (ex: empresa.com.br)");

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
