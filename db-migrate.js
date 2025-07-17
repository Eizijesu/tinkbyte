import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const migrations = [
  `CREATE OR REPLACE VIEW public.comments_with_profiles AS
   SELECT 
     c.id,
     c.article_id,
     c.user_id,
     c.parent_id,
     c.content,
     c.is_edited,
     c.like_count,
     c.created_at,
     c.updated_at,
     c.is_deleted,
     c.guest_name,
     c.guest_email,
     c.reply_to_content,
     c.moderation_status,
     c.auto_approved_reason,
     c.mention_users,
     c.reaction_counts,
     c.is_pinned,
     c.quality_score,
     c.thread_level,
     c.reply_to_user_id,
     c.moderation_reason,
     c.deleted_at,
     c.deleted_by,
     c.edit_reason,
     c.reply_count,
     p.display_name,
     p.avatar_url,
     p.avatar_type,
     p.avatar_preset_id,
     p.is_admin
   FROM comments c
   LEFT JOIN profiles p ON c.user_id = p.id
   WHERE c.is_deleted = false;`,
   
  `ALTER TABLE public.query_performance ENABLE ROW LEVEL SECURITY;`,
  
  `CREATE POLICY "Admin only access" 
   ON public.query_performance 
   FOR ALL 
   USING (EXISTS (
     SELECT 1 FROM profiles 
     WHERE id = auth.uid() AND is_admin = true
   ));`,
   
  `ALTER TABLE public.user_activities_partitioned ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.user_activities_2025_01 ENABLE ROW LEVEL SECURITY;`,
  
  `CREATE POLICY "User access to own activities" 
   ON public.user_activities_partitioned 
   FOR ALL 
   USING (user_id = auth.uid());`
];

async function runMigration() {
  try {
    // Check if execute_sql function exists
    const { data: funcExists } = await supabase
      .rpc('fn_exists', { function_name: 'execute_sql' });
    
    if (!funcExists) {
      console.log('ℹ️ Creating execute_sql function...');
      const createFuncSql = `
        CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          EXECUTE sql;
          RETURN json_build_object('status', 'success');
        EXCEPTION WHEN others THEN
          RETURN json_build_object(
            'status', 'error',
            'code', SQLSTATE,
            'message', SQLERRM
          );
        END;

        $$;
        
        GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;
        GRANT EXECUTE ON FUNCTION public.execute_sql TO service_role;
      `;
      
      const { error: funcError } = await supabase
        .query(createFuncSql);
      
      if (funcError) throw new Error(`Failed to create execute_sql: ${funcError.message}`);
      
      console.log('✅ execute_sql function created');
    }

    // Run migrations
    for (const sql of migrations) {
      console.log(`Executing:\n${sql.substring(0, 100)}...`);
      
      const { data, error } = await supabase.rpc('execute_sql', { sql });
      
      if (error) {
        throw new Error(`Migration failed: ${error.message}`);
      }
      
      if (data?.status === 'error') {
        throw new Error(`SQL error [${data.code}]: ${data.message}`);
      }
      
      console.log('✓ Success\n');
    }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();