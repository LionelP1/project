import express from 'express';
import { handleStripeWebhook, handlePayPalWebhook } from '../controllers/webhook.controller.js';
import bodyParser from 'body-parser';

const router = express.Router();

router.post('/stripe', bodyParser.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/paypal', express.json(), handlePayPalWebhook);

export default router;
