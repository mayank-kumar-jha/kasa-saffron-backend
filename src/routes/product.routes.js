import { Router } from 'express';
import { createProduct, getAllProducts, getProductBySlug, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { productValidation } from '../validations/product.validation.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.route('/').get(getAllProducts);
router.route('/:slug').get(getProductBySlug);

// Admin only routes
router.use(verifyJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN', 'MANAGER'));
router.route('/')
  .post(
    upload.array('images', 5),
    validate(productValidation.createProductSchema),
    createProduct
  );
  
router.route('/:id')
  .patch(upload.array('images', 5), updateProduct)
  .delete(deleteProduct);

export default router;
