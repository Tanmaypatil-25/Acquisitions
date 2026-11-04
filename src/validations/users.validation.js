import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive({ message: 'User ID must be a positive integer' }),
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255)
      .trim()
      .optional(),
    email: z
      .string()
      .email('Invalid email address')
      .max(255)
      .toLowerCase()
      .trim()
      .optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(128)
      .optional(),
    role: z
      .enum(['user', 'admin'], {
        errorMap: () => ({ message: 'Role must be user or admin' }),
      })
      .optional(),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
