import { Router } from 'express';
import { submitB2BLead, getB2BLeads, updateB2BLeadStatus } from '../controllers/b2b.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { b2bValidation } from '../validations/b2b.validation.js';
import { formSubmissionLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.route('/').post(formSubmissionLimiter, validate(b2bValidation.b2bSchema), submitB2BLead);

// Protected routes (Admin only)
router.use(verifyJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN', 'MANAGER'));
router.route('/').get(getB2BLeads);
router.route('/:id/status').patch(updateB2BLeadStatus);

export default router;
