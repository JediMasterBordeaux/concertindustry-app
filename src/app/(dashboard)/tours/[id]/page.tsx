import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/components/chat/ChatInterface';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

export default async function TourDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single();

  const isPro = (sub?.plan === 'pro_monthly' || sub?.plan === 'pro_annual') && sub?.status === 'active';
  if (!isPro) redirect('/tours');

  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!tour) notFound();

  const [profileResult, usageResult] = await Promise.all([
    supabase.from('profiles').select('role, tour_scale').eq('id', user.id).single(),
    supabase.from('usage_metrics').select('total_queries').eq('user_id', user.id).single(),
  ]);

  const defaultRole = profileResult.data?.role || 'tm';
  const totalQueries = usageResult.data?.total_queries || 0;
  const remainingQueries = null; // Pro users have unlimited

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Tour context bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-4 bg-muted/20">
        <Link href="/tours" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Tours
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{tour.name}</span>
          <span className="text-xs text-muted-foreground">{tour.artist_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
            tour.tour_scale === 'arena' ? 'bg-purple-100 text-purple-700' :
            tour.tour_scale === 'stadium' ? 'bg-amber-100 text-amber-700' :
            tour.tour_scale === 'theater' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {tour.tour_scale}
          </span>
        </div>
        {(tour.start_date || tour.end_date) && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Calendar className="w-3 h-3" />
            {formatDate(tour.start_date)} – {formatDate(tour.end_date)}
          </span>
        )}
        {tour.regions && tour.regions.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {tour.regions.join(', ')}
          </span>
        )}
      </div>

      <ChatInterface
        userId={user.id}
        defaultRole={defaultRole as any}
        defaultScale={tour.tour_scale as any}
        isPro={isPro}
        remainingQueries={remainingQueries}
        plan={sub?.plan as any || 'pro_monthly'}
        tourId={tour.id}
        tourName={tour.name}
      />
    </div>
  );
}
