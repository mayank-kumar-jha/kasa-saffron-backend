import { Router } from 'express';
import { createCategory, getAllCategories, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { categoryValidation } from '../validations/category.validation.js';

const router = Router();

router.route('/').get(getAllCategories);

// Admin only routes
router.use(verifyJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'));
router.route('/').post(validate(categoryValidation.createCategorySchema), createCategory);
router.route('/:id')
  .patch(updateCategory)
  .delete(deleteCategory);

export default router;
