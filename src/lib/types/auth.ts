// src/lib/types/auth.ts
export interface AuthConfig {
  id: number;
  password_min_length: number;
  password_require_letters: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
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

export interface MfaVerification {
  id: string;
  user_id: string;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
  created_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    membership_type: 'free' | 'premium';
  };
  profile?: {
    display_name?: string;
    avatar_url?: string;
    avatar_type: 'preset' | 'uploaded';
    avatar_preset_id: number;
    is_admin: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  display_name?: string;
  terms_accepted: boolean;
}

export interface PasswordReset {
  email: string;
  token: string;
  new_password: string;
}