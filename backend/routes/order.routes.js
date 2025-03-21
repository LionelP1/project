import express from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrdersForMyProducts,
  updateOrderStatus,
  cancelOrder,
  addProductToOrder,
  removeProductFromOrder
} from '../controllers/orderController.js';

import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.middleware.js'; // Import role-based middleware

const router = express.Router();

router.post('/', protect, authorizeRoles('buyer'), placeOrder);

router.get('/my-orders', protect, authorizeRoles('buyer'), getMyOrders);

router.delete('/:id', protect, authorizeRoles('buyer'), cancelOrder);

router.get('/my-products', protect, authorizeRoles('farmer'), getOrdersForMyProducts);

router.put('/:id', protect, authorizeRoles('farmer'), updateOrderStatus);

router.put('/:orderId/add-product', protect, authorizeRoles('buyer'), addProductToOrder);

router.put('/:orderId/remove-product/:productId', protect, authorizeRoles('buyer'), removeProductFromOrder);

export default router;

