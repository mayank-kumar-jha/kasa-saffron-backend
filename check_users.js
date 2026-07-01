import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    include: { _count: { select: { orders: true } } }
  });
  console.log('--- ALL USERS ---');
  users.forEach(u => {
    console.log(`User: ${u.name} | Email: ${u.email} | Role: ${u.role} | Orders: ${u._count.orders}`);
  });
  process.exit(0);
}
checkUsers();
