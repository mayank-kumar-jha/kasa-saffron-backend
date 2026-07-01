import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';

// Get or Create Cart
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  if (!userId && !sessionId) {
    throw new ApiError(400, 'User ID or Session ID is required to fetch cart');
  }

  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionId },
    include: {
      cartItems: {
        include: { product: true },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { sessionId },
      include: { cartItems: true },
    });
  }

  return res.status(200).json(new ApiResponse(200, cart, 'Cart fetched successfully'));
});

// Add to Cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, size = '500g' } = req.body;
  const userId = req.user?.id;
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  if (!userId && !sessionId) {
    throw new ApiError(400, 'User ID or Session ID is required');
  }

  if (!quantity || quantity < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  if (!['500g', '1kg'].includes(size)) {
    throw new ApiError(400, 'Invalid size. Must be 500g or 1kg');
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.deletedAt) throw new ApiError(400, 'Product is no longer available');
  if (product.status !== 'ACTIVE') throw new ApiError(400, 'Product is currently unavailable');

  if (product.stock < quantity) {
    throw new ApiError(400, `Not enough stock. Only ${product.stock} unit(s) available.`);
  }

  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { sessionId },
    });
  }

  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_size: {
        cartId: cart.id,
        productId,
        size,
      },
    },
  });

  let cartItem;
  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    if (newQuantity > product.stock) {
      throw new ApiError(400, `Cannot add more than available stock (${product.stock} unit(s)).`);
    }
    cartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    cartItem = await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, size },
    });
  }

  return res.status(200).json(new ApiResponse(200, cartItem, 'Item added to cart'));
});

// Update Cart Item
const updateCartItem = asyncHandler(async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: true },
  });

  if (!cartItem) throw new ApiError(404, 'Cart item not found');

  if (quantity > cartItem.product.stock) {
    throw new ApiError(400, `Not enough stock. Only ${cartItem.product.stock} unit(s) available.`);
  }

  const updatedCartItem = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return res.status(200).json(new ApiResponse(200, updatedCartItem, 'Cart item updated'));
});

// Remove Cart Item
const removeCartItem = asyncHandler(async (req, res) => {
  const { cartItemId } = req.params;
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  return res.status(200).json(new ApiResponse(200, null, 'Item removed from cart'));
});

// Merge guest sessionId cart into authenticated user cart (called on login)
const mergeCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.body.sessionId || req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(200).json(new ApiResponse(200, null, 'No guest cart to merge'));
  }

  const guestCart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { cartItems: true },
  });

  if (!guestCart || guestCart.cartItems.length === 0) {
    return res.status(200).json(new ApiResponse(200, null, 'Guest cart is empty'));
  }

  let userCart = await prisma.cart.findUnique({ where: { userId } });
  if (!userCart) {
    userCart = await prisma.cart.create({ data: { userId } });
  }

  for (const guestItem of guestCart.cartItems) {
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_size: {
          cartId: userCart.id,
          productId: guestItem.productId,
          size: guestItem.size,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + guestItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: guestItem.productId,
          quantity: guestItem.quantity,
          size: guestItem.size,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });

  const mergedCart = await prisma.cart.findUnique({
    where: { userId },
    include: { cartItems: { include: { product: true } } },
  });

  return res.status(200).json(new ApiResponse(200, mergedCart, 'Cart merged successfully'));
});

export { getCart, addToCart, updateCartItem, removeCartItem, mergeCart };
