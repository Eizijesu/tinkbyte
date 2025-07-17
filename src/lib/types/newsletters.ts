// src/lib/types/newsletters.ts - Newsletter and email types

export interface Newsletter {
  id: string;
  name: string;
  slug: string;
  description?: string;
  frequency: string;
  day_of_week?: string;
  image_url?: string;
  code?: string;
  type?: string;
  is_active: boolean;
  sort_order: number;
  subscriber_count: number;
  created_at: string;
}

export interface NewsletterSubscription {
  id: string;
  user_id?: string;
  email: string;
  convertkit_subscriber_id?: string;
  newsletter_type: 'weekly' | 'daily' | 'monthly';
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
}

export interface UserNewsletterSubscription {
  id: string;
  user_id?: string;
  newsletter_id: string;
  is_subscribed: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
  created_at: string;
  preferences: Record<string, any>;
  frequency: 'daily' | 'weekly' | 'monthly';
  last_sent_at?: string;
}

export interface NewsletterPreferences {
  id: string;
  user_id?: string;
  newsletter_id: string;
  topics: string[];
  frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailVerification {
  id: string;
  user_id?: string;
  email: string;
  otp_code: string;
  expires_at: string;
  verified_at?: string;
  attempts: number;
  created_at: string;
}
