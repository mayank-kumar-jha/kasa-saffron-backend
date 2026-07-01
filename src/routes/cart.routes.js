import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, mergeCart } from '../controllers/cart.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Optional JWT verification - allows guest carts
const optionalAuth = (req, res, next) => {
  if (req.cookies?.accessToken || req.header('Authorization')) {
    return verifyJWT(req, res, next);
  }
  next();
};

router.use(optionalAuth);

router.route('/').get(getCart).post(addToCart);
router.route('/merge').post(verifyJWT, mergeCart);
router.route('/:cartItemId').patch(updateCartItem).delete(removeCartItem);

export default router;
