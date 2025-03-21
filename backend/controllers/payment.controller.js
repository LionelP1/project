import stripe from '../config/stripe.js';
import payPalClient from '../config/paypal.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import paypal from '@paypal/checkout-server-sdk';

export const placeOrderStripe = async (req, res) => {
  try {
    const { products } = req.body;

    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can place orders.' });
    }

    let totalPrice = 0;
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ error: `Product not found: ${item.product}` });
      if (product.stock < item.purchaseAmount) return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      totalPrice += product.price * item.purchaseAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100,
      currency: 'usd',
      metadata: { integration_check: 'accept_a_payment' }
    });

    const order = new Order({
      buyer: req.user._id,
      products,
      totalPrice,
      paymentMethod: 'stripe',
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'pending'
    });
    await order.save();

    res.status(200).json({ clientSecret: paymentIntent.client_secret, orderId: order._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to initiate Stripe payment.' });
  }
};

export const placeOrderPayPal = async (req, res) => {
  try {
    const { products } = req.body;

    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can place orders.' });
    }

    let totalPrice = 0;
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ error: `Product not found: ${item.product}` });
      if (product.stock < item.purchaseAmount) return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      totalPrice += product.price * item.purchaseAmount;
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: totalPrice.toFixed(2) }
      }],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/paypal-success`,
        cancel_url: `${process.env.CLIENT_URL}/paypal-cancel`
      }
    });

    const orderResponse = await payPalClient.execute(request);

    const order = new Order({
      buyer: req.user._id,
      products,
      totalPrice,
      paymentMethod: 'paypal',
      paymentIntentId: orderResponse.result.id,
      paymentStatus: 'pending'
    });
    await order.save();

    const approvalUrl = orderResponse.result.links.find(link => link.rel === 'approve').href;

    res.status(200).json({ approvalUrl, orderId: order._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to initiate PayPal payment.' });
  }
};

