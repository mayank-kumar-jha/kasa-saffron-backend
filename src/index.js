import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './config/env.validation.js';
validateEnv();

import { app } from './app.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // We would typically connect to DB explicitly here, but Prisma connects automatically on first query.
    // However, it's good practice to test the connection.
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
