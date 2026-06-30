import { z } from 'zod';

const createProductSchema = z.object({
  body: z.object({
    name: z.any().optional(),
    tagline: z.any().optional(),
    description: z.any().optional(),
    spanishName: z.string().optional(),
    price500g: z.union([z.string(), z.number()]).optional(),
    price1kg: z.union([z.string(), z.number()]).optional(),
    stock: z.union([z.string(), z.number()]).optional(),
    sku: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.enum(['ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']).optional(),
    image: z.string().optional(),
  }),
});

export const productValidation = {
  createProductSchema,
};
