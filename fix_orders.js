import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function fix() {
  const pendingOrders = await prisma.order.findMany({ where: { status: 'PENDING' } });
  for (const order of pendingOrders) {
    if (order.totalAmount > 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' }
      });
      console.log('Fixed:', order.id);
    }
  }
  process.exit(0);
}
fix();
