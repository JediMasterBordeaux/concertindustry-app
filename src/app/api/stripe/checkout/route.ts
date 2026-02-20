import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLANS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json() as { plan: 'monthly' | 'annual' };
    const planConfig = plan === 'annual' ? PLANS.pro_annual : PLANS.pro_monthly;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/chat?upgraded=true`,
      cancel_url: `${appUrl}/chat`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan: plan === 'annual' ? 'pro_annual' : 'pro_monthly',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan === 'annual' ? 'pro_annual' : 'pro_monthly',
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
