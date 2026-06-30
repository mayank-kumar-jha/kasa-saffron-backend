import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const orders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });
  console.log(JSON.stringify(orders, null, 2));
}
run().finally(() => prisma.$disconnect());
