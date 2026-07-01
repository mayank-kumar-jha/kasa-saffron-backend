import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOrders() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { payment: true }
  });
  console.log('Latest Order:', latestOrder);
  process.exit(0);
}
checkOrders();
