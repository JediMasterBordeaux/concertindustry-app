import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: 'Pro Monthly',
    price: 9,
    interval: 'month' as const,
  },
  pro_annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL!,
    name: 'Pro Annual',
    price: 79,
    interval: 'year' as const,
  },
};
