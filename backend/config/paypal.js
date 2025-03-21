import paypal from '@paypal/checkout-server-sdk';

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_LIVE_CLIENT_ID,
      process.env.PAYPAL_LIVE_CLIENT_SECRET
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_SANDBOX_CLIENT_ID,
      process.env.PAYPAL_SANDBOX_CLIENT_SECRET
    );

const payPalClient = new paypal.core.PayPalHttpClient(environment);

export default payPalClient;