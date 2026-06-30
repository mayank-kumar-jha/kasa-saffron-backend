import { z } from 'zod';

const contactSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name is too long').trim(),
    email: z.string().email('Invalid email format').trim().toLowerCase(),
    phone: z.string().max(20, 'Phone is too long').trim().optional(),
    message: z.string().min(5, 'Message must be at least 5 characters long').max(2000, 'Message is too long').trim(),
    subject: z.string().max(100, 'Subject is too long').trim().optional(),
  }),
});

export const contactValidation = {
  contactSchema,
};
