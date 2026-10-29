import { z } from "zod";

const emailSchema = z
  .email("Enter a valid email address.")
  .transform((email) => email.trim().toLowerCase());
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

export const loginCredentialsSchema = z.object({
  email: z.string().trim().pipe(emailSchema),
  password: passwordSchema,
});

export const registrationCredentialsSchema = loginCredentialsSchema
  .extend({ confirmPassword: z.string() })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type RegistrationCredentials = z.infer<
  typeof registrationCredentialsSchema
>;
