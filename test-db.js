import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, image: true } });
  console.log('PRODUCTS:', JSON.stringify(products, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
