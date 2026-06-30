import { z } from 'zod';

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    slug: z.string().min(2, 'Slug is required'),
    description: z.string().optional(),
  }),
});

export const categoryValidation = {
  createCategorySchema,
};
