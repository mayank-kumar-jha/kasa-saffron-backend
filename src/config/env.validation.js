import { z } from 'zod';
import logger from './logger.js';

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL' }),
  ACCESS_TOKEN_SECRET: z.string().min(16, { message: 'ACCESS_TOKEN_SECRET must be at least 16 characters' }),
  ACCESS_TOKEN_EXPIRY: z.string().default('1d'),
  REFRESH_TOKEN_SECRET: z.string().min(16, { message: 'REFRESH_TOKEN_SECRET must be at least 16 characters' }),
  REFRESH_TOKEN_EXPIRY: z.string().default('10d'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().default('eur'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export const validateEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    logger.error('❌ Environment validation failed:');
    result.error.errors.forEach((err) => {
      logger.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  logger.info('✅ Environment variables successfully validated');
};
