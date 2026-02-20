import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/tours — list user's tours
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify Pro subscription
    const adminClient = createAdminClient();
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const isPro = (sub?.plan === 'pro_monthly' || sub?.plan === 'pro_annual') && sub?.status === 'active';
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required', code: 'PRO_REQUIRED' }, { status: 403 });
    }

    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (toursError) throw toursError;
    return NextResponse.json({ tours });
  } catch (err) {
    console.error('Tours GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}

// POST /api/tours — create tour
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const isPro = (sub?.plan === 'pro_monthly' || sub?.plan === 'pro_annual') && sub?.status === 'active';
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required', code: 'PRO_REQUIRED' }, { status: 403 });
    }

    const body = await req.json();
    const { name, artist_name, tour_scale, tour_type, start_date, end_date, regions, currency, num_shows, avg_capacity, avg_guarantee, notes } = body;

    if (!name || !artist_name) {
      return NextResponse.json({ error: 'Tour name and artist name are required' }, { status: 400 });
    }

    const { data: tour, error: insertError } = await supabase
      .from('tours')
      .insert({
        user_id: user.id,
        name,
        artist_name,
        tour_scale: tour_scale || 'theater',
        tour_type: tour_type || 'headline',
        start_date: start_date || null,
        end_date: end_date || null,
        regions: regions || ['US'],
        currency: currency || 'USD',
        num_shows: num_shows || null,
        avg_capacity: avg_capacity || null,
        avg_guarantee: avg_guarantee || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json({ tour }, { status: 201 });
  } catch (err) {
    console.error('Tours POST error:', err);
    return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 });
  }
}
