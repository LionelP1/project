import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/', getAllProducts);

router.get('/:id', getProductById);

router.post('/', protect, authorizeRoles('farmer'), createProduct);

router.put('/:id', protect, authorizeRoles('farmer'), updateProduct);

router.delete('/:id', protect, authorizeRoles('farmer'), deleteProduct);

export default router;

