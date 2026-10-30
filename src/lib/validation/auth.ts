import { z } from "zod";
import { passwordErrorMessage } from "./password-strength";

export const loginSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(1, { error: "Şifre gerekli." }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, { error: "Ad soyad en az 2 karakter olmalı." }),
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(1, { error: "Şifre gerekli." }),
}).superRefine((val, ctx) => {
  const msg = passwordErrorMessage(val.password, val.email);
  if (msg) ctx.addIssue({ code: "custom", path: ["password"], message: msg });
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(1, { error: "Şifre gerekli." }),
}).superRefine((val, ctx) => {
  const msg = passwordErrorMessage(val.password);
  if (msg) ctx.addIssue({ code: "custom", path: ["password"], message: msg });
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
