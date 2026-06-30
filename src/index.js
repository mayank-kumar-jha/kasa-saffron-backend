import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './config/env.validation.js';
validateEnv();

import { app } from './app.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Only listen on port if not in Vercel environment (Vercel uses serverless exports)
    if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
      app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export the app for Vercel serverless environment
export default app;
