import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId || !plan) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Create or update subscription using unique key
        await prisma.subscription.upsert({
          where: {
            stripeSubscriptionId: session.subscription as string,
          },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: session.line_items?.data[0]?.price?.id,
            stripeStatus: 'active',
            stripeCurrentPeriodEnd: new Date(session.expires_at * 1000),
          },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: session.line_items?.data[0]?.price?.id,
            stripeStatus: 'active',
            stripeCurrentPeriodEnd: new Date(session.expires_at * 1000),
          },
        });

        console.log(`Subscription created for user ${userId} with plan ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeStatus: subscription.status,
            // Note: current_period_end is not available in the subscription object
            // It would need to be fetched separately if needed
          },
        });

        console.log(`Subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeStatus: 'canceled',
          },
        });

        console.log(`Subscription canceled: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription;
        
        if (subscriptionId && typeof subscriptionId === 'string') {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              stripeStatus: 'active',
            },
          });
        }

        console.log(`Payment succeeded for subscription: ${subscriptionId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription;
        
        if (subscriptionId && typeof subscriptionId === 'string') {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              stripeStatus: 'past_due',
            },
          });
        }

        console.log(`Payment failed for subscription: ${subscriptionId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
