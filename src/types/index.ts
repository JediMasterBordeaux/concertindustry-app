// ============================================================
// ConcertIndustry.com — Core TypeScript Types
// ============================================================

export type UserRole = 'tm' | 'pm' | 'pa';
export type TourScale = 'club' | 'theater' | 'arena' | 'stadium';
export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual';
export type ChatMode = 'chat' | 'knowledge' | 'budget' | 'settlement' | 'crisis';
export type TourType = 'headline' | 'support' | 'festival';

export const ROLE_LABELS: Record<UserRole, string> = {
  tm: 'Tour Manager',
  pm: 'Production Manager',
  pa: 'Production Assistant',
};

export const SCALE_LABELS: Record<TourScale, string> = {
  club: 'Club',
  theater: 'Theater',
  arena: 'Arena',
  stadium: 'Stadium',
};

export const FREE_TIER_LIMIT = 75;
export const FREE_TIER_WARN_SOFT_1 = 60;
export const FREE_TIER_WARN_SOFT_2 = 70;

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  tour_scale: TourScale;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_role: UserRole | null;
  default_tour_scale: TourScale | null;
  default_currency: string;
  crisis_mode_enabled: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
}

export interface UsageMetrics {
  id: string;
  user_id: string;
  total_queries: number;
  queries_this_month: number;
  last_query_at: string | null;
}

export interface Tour {
  id: string;
  user_id: string;
  name: string;
  artist_name: string;
  tour_scale: TourScale;
  tour_type: TourType;
  start_date: string | null;
  end_date: string | null;
  regions: string[];
  currency: string;
  num_shows: number | null;
  avg_capacity: number | null;
  avg_guarantee: number | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationLog {
  id: string;
  user_id: string;
  tour_id: string | null;
  role: UserRole;
  tour_scale: TourScale;
  mode: ChatMode;
  user_message: string;
  assistant_message: string;
  is_starred: boolean;
  user_feedback: 'helpful' | 'not_helpful' | null;
  tags: string[] | null;
  created_at: string;
}

export interface BudgetTemplate {
  id: string;
  user_id: string;
  tour_id: string | null;
  name: string;
  budget_data: BudgetData;
  ai_summary: string | null;
  estimated_margin_low: number | null;
  estimated_margin_high: number | null;
  currency: string;
  created_at: string;
}

export interface BudgetData {
  travel: number;
  hotels: number;
  per_diems: number;
  crew_wages: number;
  production: number;
  buses: number;
  trucks: number;
  insurance: number;
  merch_costs: number;
  contingency: number;
  other: number;
  notes?: string;
}

export interface Settlement {
  id: string;
  user_id: string;
  tour_id: string | null;
  show_name: string;
  show_date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  gross_tickets: number;
  total_taxes: number;
  total_fees: number;
  venue_rent: number;
  marketing_costs: number;
  production_reimbursements: number;
  artist_guarantee: number;
  overage_percentage: number;
  settlement_data: SettlementData;
  ai_breakdown: string | null;
  ai_watchouts: string | null;
  currency: string;
  created_at: string;
}

export interface SettlementData {
  gross_potential: number;
  adjusted_gross: number;
  house_nut: number;
  net_receipts: number;
  overage_pool: number;
  artist_overage: number;
  total_artist_payment: number;
  venue_share: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStarred?: boolean;
  feedback?: 'helpful' | 'not_helpful';
}

export interface AIRequestBody {
  message: string;
  role: UserRole;
  tourScale: TourScale;
  mode: ChatMode;
  tourId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AIResponseBody {
  message: string;
  remainingQueries?: number;
  conversationLogId?: string;
}

export interface DocChunk {
  id: string;
  doc_id: string;
  chunk_text: string;
  chunk_index: number;
  file_name: string;
  doc_type: string;
  similarity: number;
}
