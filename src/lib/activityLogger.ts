// src/lib/activityLogger.ts
import { supabase } from './supabase.js';

export class ActivityLogger {
  static async logActivity({
    userId,
    type,
    description,
    metadata = {}
  }: {
    userId: string;
    type: string;
    description: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await supabase.from("user_activities").insert({
        user_id: userId,
        activity_type: type,
        description: description,
        metadata: metadata,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }
}