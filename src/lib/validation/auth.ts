import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(1, { error: "Şifre gerekli." }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, { error: "Ad soyad en az 2 karakter olmalı." }),
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(8, { error: "Şifre en az 8 karakter olmalı." }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, { error: "Şifre en az 8 karakter olmalı." }),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
