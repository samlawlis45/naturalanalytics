import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export const STRIPE_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    queries: 20,
    apiCalls: 1000,
    features: ['Natural language queries', 'Basic visualizations', 'Community support'],
  },
  PRO: {
    name: 'Pro',
    price: 99,
    queries: 1000,
    apiCalls: 10000,
    features: ['Unlimited queries', 'Advanced visualizations', 'API access', 'Priority support'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 499,
    queries: -1, // Unlimited
    apiCalls: -1, // Unlimited
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA'],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;
