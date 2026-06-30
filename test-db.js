import prisma from './src/config/db.js';

(async () => {
  console.log('Testing connection to Neon database...');
  try {
    const user = await prisma.user.findFirst();
    console.log('Successfully connected to the database. First user:', user);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
  process.exit(0);
})();
