import stripe from '../config/stripe.js';
import Order from '../models/order.model.js';
import { reduceProductStock } from '../utils/productUtils.js';

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
    : process.env.STRIPE_TEST_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('Payment received:', paymentIntent.id);

    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();

      for (const item of order.products) {
        await reduceProductStock(item.product, item.purchaseAmount);
      }

      console.log('Order confirmed and stock updated:', order._id);
    }
  }

  res.status(200).send('Webhook received and processed');
};

export const handlePayPalWebhook = async (req, res) => {

  console.log('Received PayPal webhook event:', req.body);

  const event = req.body;
  if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
    const orderId = event.resource.id;
    const order = await Order.findOne({ paymentIntentId: orderId });
    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();

      for (const item of order.products) {
        await reduceProductStock(item.product, item.purchaseAmount);
      }

      console.log('Order confirmed and stock updated:', order._id);
    }
  }

  res.status(200).send('PayPal Webhook received and processed');
};

