import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getStripe, STRIPE_PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();
    
    if (!plan || !STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });

    if (existingSubscription && existingSubscription.stripeStatus === 'active') {
      return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 });
    }

    const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
    
    if (plan === 'FREE' || !('stripePriceId' in planConfig) || !planConfig.stripePriceId) {
      return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 });
    }

    // Create or get Stripe customer
    let customer;
    if (existingSubscription?.stripeCustomerId) {
      customer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
