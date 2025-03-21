import express from 'express';
import { placeOrderStripe, placeOrderPayPal } from '../controllers/payment.controller.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/place-order-stripe', isAuthenticated, placeOrderStripe);

router.post('/place-order-paypal', isAuthenticated, placeOrderPayPal);

export default router;
