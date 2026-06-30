import { Router } from 'express';
import { submitContact, getContacts, updateContactStatus } from '../controllers/contact.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';
import { contactValidation } from '../validations/contact.validation.js';
import { formSubmissionLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.route('/').post(formSubmissionLimiter, validate(contactValidation.contactSchema), submitContact);

router.use(verifyJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN', 'MANAGER'));
router.route('/').get(getContacts);
router.route('/:id/status').patch(updateContactStatus);

export default router;
