import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmin() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@kasasaffron.com' } });
  console.log('Admin user:', admin);
  process.exit(0);
}
checkAdmin();
