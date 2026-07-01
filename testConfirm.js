import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testConfirm() {
  const paymentIntentId = 'pi_3ToAdsGTRIpgqdaA0lAI0kAk';
  const orderId = 'bec80f80-b65f-4d81-bbb4-1dd1c89988c8';

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Stripe Intent Status:', paymentIntent.status);
    
    if (paymentIntent.status !== 'succeeded') {
      console.log('Payment not succeeded in Stripe');
      process.exit(1);
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId }, include: { orderItems: true } });
    if (existingOrder && existingOrder.status !== 'PENDING') {
      console.log('Order already processed');
      process.exit(0);
    }

    await prisma.$transaction(async (tx) => {
      // Simulate inventory deduction
      for (const item of existingOrder.orderItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product && product.stock >= item.quantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: { productId: item.productId, quantityChanged: -item.quantity, reason: `Order ${orderId} placed (Explicit Confirmation)` },
          });
        }
      }
      await tx.cart.deleteMany({ where: { userId: existingOrder.userId } });
      console.log('Transaction complete');
    });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
      include: { orderItems: true },
    });

    console.log('Order updated:', order.status);

    await prisma.payment.upsert({
      where: { stripePaymentId: paymentIntent.id },
      update: {},
      create: {
        orderId,
        stripePaymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: 'SUCCEEDED',
      },
    });

    console.log('Payment inserted!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
testConfirm();
