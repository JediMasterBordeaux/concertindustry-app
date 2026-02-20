import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// This route handles Stripe webhooks to update subscription status
// Must be raw body — Next.js App Router reads body via req.text()
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as 'pro_monthly' | 'pro_annual';

        if (!userId || !plan) break;

        // Create or update subscription record
        await adminClient.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (plan === 'pro_annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' });

        console.log(`Subscription created for user ${userId}, plan: ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) break;

        const planId = subscription.items.data[0]?.price?.id;
        const plan = planId === process.env.STRIPE_PRICE_ANNUAL ? 'pro_annual' : 'pro_monthly';
        const status = subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing';

        await adminClient.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          plan,
          status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'user_id' });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) break;

        await adminClient.from('subscriptions').upsert({
          user_id: userId,
          plan: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
        }, { onConflict: 'user_id' });

        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: sub } = await adminClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub) {
          await adminClient
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('user_id', sub.user_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
