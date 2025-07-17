// src/lib/types/subscriptions.ts - Subscription and payment types

export interface Subscription {
  id: string;
  user_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan_type: 'monthly' | 'annual';
  amount_cents: number;
  currency: string;
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
  paystack_subscription_code?: string;
  payment_provider: 'paystack' | 'stripe';
}

export interface Payment {
  id: string;
  user_id?: string;
  subscription_id?: string;
  stripe_payment_intent_id?: string;
  amount_cents: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  created_at: string;
  paystack_reference?: string;
  payment_provider: 'paystack' | 'stripe';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  limits: {
    articles_per_month?: number;
    premium_content: boolean;
    early_access: boolean;
    ad_free: boolean;
  };
  is_active: boolean;
  sort_order: number;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  provider: 'stripe' | 'paystack';
  provider_id: string;
  type: 'card' | 'bank_account';
  last_four: string;
  brand?: string;
  expires_at?: string;
  is_default: boolean;
  created_at: string;
}
