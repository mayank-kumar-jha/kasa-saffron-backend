import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';
import Stripe from 'stripe';
import { sendPaymentConfirmationEmail } from '../utils/email.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingAddressId, billingAddressId, items, notes } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // Validate items structure
  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      throw new ApiError(400, 'Invalid cart item: productId and quantity are required');
    }
    if (!item.size || !['500g', '1kg'].includes(item.size)) {
      throw new ApiError(400, `Invalid size "${item.size}" for product. Must be 500g or 1kg`);
    }
  }

  // Handle missing address for Store Pickup
  let addressId = shippingAddressId;
  if (!addressId) {
    const existingAddress = await prisma.address.findFirst({
      where: { userId }
    });
    if (existingAddress) {
      addressId = existingAddress.id;
    } else {
      const newAddress = await prisma.address.create({
        data: {
          userId,
          street: "Gran Via Corts Catalanes 162",
          city: "Barcelona",
          state: "Barcelona",
          zip: "08038",
          country: "Spain",
          isDefault: true
        }
      });
      addressId = newAddress.id;
    }
  }

  let totalAmount = 0;
  const orderItemsList = [];

  for (const item of items) {
    // Strict product lookup — no fallback, no guessing
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    if (!product) {
      throw new ApiError(404, `Product not found: ${item.productId}`);
    }

    if (product.deletedAt) {
      throw new ApiError(400, `Product is no longer available`);
    }

    if (product.status !== 'ACTIVE') {
      throw new ApiError(400, `Product "${item.productId}" is currently unavailable`);
    }

    // Stock validation intentionally disabled — customers can order even if stock is low
    // if (product.stock < item.quantity) {
    //   throw new ApiError(400, `Not enough stock available. Only ${product.stock} unit(s) left.`);
    // }

    // Determine correct price based on size (server-side, never trust client price)
    const itemPrice = item.size === '500g' ? product.price500g : product.price1kg;

    if (itemPrice <= 0) {
      throw new ApiError(400, `Product price is not configured for size ${item.size}`);
    }

    totalAmount += itemPrice * item.quantity;

    orderItemsList.push({
      productId: product.id,
      quantity: item.quantity,
      price: itemPrice,
      size: item.size, // persist the size chosen by customer
    });
  }

  // Apply 10% VAT
  totalAmount = totalAmount * 1.10;

  // Create Order in DB
  const order = await prisma.order.create({
    data: {
      userId,
      totalAmount,
      shippingAddressId: addressId,
      billingAddressId: billingAddressId || addressId,
      status: 'PENDING',
      notes,
      orderItems: {
        create: orderItemsList
      },
    },
  });

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100), // Stripe takes amount in cents
    currency: 'eur',
    description: `Order ${order.id} for Kasa Saffron`,
    shipping: {
      name: req.user?.name || 'Customer',
      address: {
        line1: 'Gran Via Corts Catalanes 162',
        city: 'Barcelona',
        postal_code: '08038',
        country: 'ES',
      },
    },
    metadata: { orderId: order.id },
  }, {
    idempotencyKey: `pi_${order.id}`
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentIntentId: paymentIntent.id },
  });

  return res.status(200).json(new ApiResponse(200, { clientSecret: paymentIntent.client_secret, orderId: order.id }, 'Checkout session created'));
});


const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // req.body must be raw buffer for Stripe Webhook verification.
    // Ensure Express app.use is configured correctly to pass raw body to this route.
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new ApiError(400, `Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
      include: { orderItems: true },
    });

    await prisma.payment.create({
      data: {
        orderId,
        stripePaymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: 'SUCCEEDED',
      },
    });

    // Deduct Inventory inside a transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product && product.stock >= item.quantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: { productId: item.productId, quantityChanged: -item.quantity, reason: `Order ${orderId} placed` },
          });
        }
      }
      
      // Clear cart
      await tx.cart.deleteMany({ where: { userId: order.userId } });
    });

    // Send confirmation email — fire-and-forget, do not block the webhook response
    const userToEmail = await prisma.user.findUnique({ where: { id: order.userId } });
    if (userToEmail && userToEmail.email) {
      sendPaymentConfirmationEmail(userToEmail.email, userToEmail.name, order.id, order.totalAmount)
        .catch(err => console.error('Failed to send payment confirmation email:', err));
    }
  }

  return res.status(200).json({ received: true });
});

// Explicit confirmation endpoint to prevent "pending" status if webhooks fail or are unconfigured
const confirmPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;
  if (!paymentIntentId || !orderId) {
    throw new ApiError(400, "Missing payment intent or order ID");
  }

  // Verify directly with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json(new ApiResponse(400, null, "Payment not succeeded in Stripe"));
  }

  // Check if already paid
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
  if (existingOrder && existingOrder.status !== 'PENDING') {
    return res.status(200).json(new ApiResponse(200, existingOrder, "Order already processed"));
  }

  // Process payment
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID' },
    include: { orderItems: true },
  });

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

  await prisma.$transaction(async (tx) => {
    for (const item of order.orderItems) {
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
    await tx.cart.deleteMany({ where: { userId: order.userId } });
  });

  // Send email — fire-and-forget, do not block the confirm response
  const userToEmail = await prisma.user.findUnique({ where: { id: order.userId } });
  if (userToEmail && userToEmail.email) {
    sendPaymentConfirmationEmail(userToEmail.email, userToEmail.name, order.id, order.totalAmount)
      .catch(err => console.error('Failed to send payment confirmation email:', err));
  }

  return res.status(200).json(new ApiResponse(200, order, "Payment confirmed successfully"));
});

export { createCheckoutSession, stripeWebhook, confirmPaymentStatus };
