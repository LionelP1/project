import Stripe from 'stripe';

const stripeSecretKey = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_LIVE_SECRET_KEY
  : process.env.STRIPE_TEST_SECRET_KEY;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-08-16'
});

export default stripe;
