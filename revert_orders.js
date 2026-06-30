import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const orders = await prisma.order.findMany({
    where: { status: 'PAID' },
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  
  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PENDING' }
    });
  }
  console.log('Reverted 3 orders to PENDING');
}
run().finally(() => prisma.$disconnect());
