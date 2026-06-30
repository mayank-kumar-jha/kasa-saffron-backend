import { z } from 'zod';

const b2bSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name is required').max(100, 'Company name is too long').trim(),
    contactPerson: z.string().min(2, 'Contact person name is required').max(100, 'Name is too long').trim(),
    email: z.string().email('Invalid email format').trim().toLowerCase(),
    phone: z.string().min(5, 'Phone number is required').max(20, 'Phone is too long').trim(),
    businessType: z.string().min(2, 'Business type is required').max(50, 'Business type is too long').trim(),
    estimatedVolume: z.string().min(1, 'Estimated volume is required').max(50, 'Estimated volume is too long').trim(),
    notes: z.string().max(2000, 'Notes are too long').trim().optional(),
  }),
});

export const b2bValidation = {
  b2bSchema,
};
