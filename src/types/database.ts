//src/types/database.ts
export interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    role?: string;
    display_name?: string;
  };
}

export interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_type: 'preset' | 'uploaded';
  avatar_preset_id: number;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}