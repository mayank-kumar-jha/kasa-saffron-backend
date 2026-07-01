import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function list() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: true }
  });
  console.log('--- RECENT ORDERS ---');
  orders.forEach(o => {
    console.log(`[${o.createdAt.toISOString()}] Order ${o.id.substring(0,8)} | User: ${o.user?.name} (${o.user?.email}) | Status: ${o.status} | Total: €${o.totalAmount}`);
  });
  process.exit(0);
}
list();
