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
  const { productId, quantity } = req.body;
  const userId = req.user?.id;
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  if (!userId && !sessionId) {
    throw new ApiError(400, 'User ID or Session ID is required');
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found');
  // if (product.stock < quantity) throw new ApiError(400, 'Not enough stock available');

  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { sessionId },
    });
  }

  // Check if item exists in cart
  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  let cartItem;
  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    // if (newQuantity > product.stock) throw new ApiError(400, 'Cannot add more than available stock');

    cartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  return res.status(200).json(new ApiResponse(200, cartItem, 'Item added to cart'));
});

// Update Cart Item
const updateCartItem = asyncHandler(async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: true },
  });

  if (!cartItem) throw new ApiError(404, 'Cart item not found');
  // if (quantity > cartItem.product.stock) throw new ApiError(400, 'Not enough stock available');

  const updatedCartItem = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return res.status(200).json(new ApiResponse(200, updatedCartItem, 'Cart item updated'));
});

// Remove Cart Item
const removeCartItem = asyncHandler(async (req, res) => {
  const { cartItemId } = req.params;

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return res.status(200).json(new ApiResponse(200, null, 'Item removed from cart'));
});

export { getCart, addToCart, updateCartItem, removeCartItem };
