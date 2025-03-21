import express from 'express';
import {
  acceptDelivery,
  getMyActiveDelivery,
  updateDeliveryStatus,
  cancelDelivery
} from '../controllers/deliveryController.js';

import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/accept', protect, authorizeRoles('delivery_agent'), acceptDelivery);

router.get('/my-active', protect, authorizeRoles('delivery_agent'), getMyActiveDelivery);

router.put('/:id', protect, authorizeRoles('delivery_agent'), updateDeliveryStatus);

router.delete('/:id', protect, authorizeRoles('delivery_agent'), cancelDelivery);

export default router;