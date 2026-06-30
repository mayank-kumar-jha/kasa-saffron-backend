import express, { Router } from 'express';
import { createCheckoutSession, stripeWebhook } from '../controllers/order.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/checkout').post(verifyJWT, express.json({ limit: '10mb' }), createCheckoutSession);

// Webhook requires raw body parsing, usually configured in app.js before express.json()
router.post('/webhook', express.raw({ type: '*/*' }), stripeWebhook);

export default router;
