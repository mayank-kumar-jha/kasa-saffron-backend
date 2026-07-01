import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function check() {
  const latestOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { payment: true, user: true }
  });
  console.log(JSON.stringify(latestOrders, null, 2));
  process.exit(0);
}
check();
