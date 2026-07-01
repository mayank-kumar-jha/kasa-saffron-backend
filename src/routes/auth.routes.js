import { Router } from 'express';
import { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, oauthCallback, forgotPassword, resetPassword, verifyEmailOtp } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authValidation } from '../validations/auth.validation.js';
import passport from 'passport';

const router = Router();

router.route('/register').post(validate(authValidation.registerSchema), registerUser);
router.route('/login').post(validate(authValidation.loginSchema), loginUser);
router.route('/refresh-token').post(refreshAccessToken);

router.route('/forgot-password').post(validate(authValidation.forgotPasswordSchema), forgotPassword);
router.route('/reset-password').post(validate(authValidation.resetPasswordSchema), resetPassword);

router.route('/verify-registration-otp').post(validate(authValidation.verifyRegistrationOtpSchema), verifyEmailOtp);

// OAuth Google Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', (req, res, next) => {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  passport.authenticate('google', { failureRedirect: `${frontendUrl}/login?error=true` })(req, res, next);
}, oauthCallback);

// Secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/me').get(verifyJWT, getCurrentUser);

export default router;
