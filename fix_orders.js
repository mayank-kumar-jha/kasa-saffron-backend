import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const result = await prisma.order.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'PAID' }
  });
  console.log('Updated orders:', result.count);
}
run().finally(() => prisma.$disconnect());
