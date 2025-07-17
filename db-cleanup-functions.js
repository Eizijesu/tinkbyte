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

const cleanupCommands = [
  // Remove ALL versions of the functions
  `DO $$
  BEGIN
    EXECUTE (
      SELECT 'DROP FUNCTION IF EXISTS ' || string_agg(oid::regprocedure::text, ', ')
      FROM pg_proc
      WHERE proname IN ('insert_comment_safe', 'insert_comment_with_config')
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    );
  END $$;`,
  
  // Recreate insert_comment_with_config
  `CREATE FUNCTION public.insert_comment_with_config(
     p_article_id text,
     p_user_id uuid,
     p_content text,
     p_parent_id uuid DEFAULT NULL
   )
   RETURNS uuid
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_catalog
   AS $func$
   DECLARE
     new_comment_id uuid;
     thread_level_val integer := 0;
   BEGIN
     IF p_parent_id IS NOT NULL THEN
       SELECT COALESCE(thread_level + 1, 0) INTO thread_level_val
       FROM comments WHERE id = p_parent_id;
     END IF;
     
     INSERT INTO comments (
       article_id, 
       user_id, 
       content, 
       parent_id, 
       thread_level,
       moderation_status
     ) VALUES (
       p_article_id,
       p_user_id,
       p_content,
       p_parent_id,
       thread_level_val,
       'pending'
     ) RETURNING id INTO new_comment_id;
     
     RETURN new_comment_id;
   END
   $func$;`,
   
  // Recreate insert_comment_safe
  `CREATE FUNCTION public.insert_comment_safe(
     p_article_id text,
     p_user_id uuid,
     p_content text,
     p_parent_id uuid DEFAULT NULL
   )
   RETURNS uuid
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_catalog
   AS $func$
   DECLARE
     new_comment_id uuid;
     user_blocked boolean;
   BEGIN
     SELECT is_blocked INTO user_blocked
     FROM profiles WHERE id = p_user_id;
     
     IF user_blocked THEN
       RAISE EXCEPTION 'User is blocked from commenting';
     END IF;
     
     SELECT public.insert_comment_with_config(
       p_article_id, p_user_id, p_content, p_parent_id
     ) INTO new_comment_id;
     
     RETURN new_comment_id;
   END
   $func$;`,
   
  // Create missing policy
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_policies 
       WHERE policyname = 'User access to own activities' 
         AND tablename = 'user_activities_2025_01'
     ) THEN
       CREATE POLICY "User access to own activities" 
       ON public.user_activities_2025_01 
       FOR ALL 
       USING (user_id = auth.uid());
     END IF;
   END $$;`
];

async function runCleanup() {
  try {
    for (const sql of cleanupCommands) {
      console.log(`Executing command...`);
      
      const { data, error } = await supabase.rpc('execute_sql', { sql });
      
      if (error) {
        console.error(`❌ Error:`, error.message);
        continue;
      }
      
      if (data?.status === 'error') {
        if (data.code === '42710') {
          console.log('ℹ️ Object already exists. Skipping...');
          continue;
        }
        console.error(`❌ SQL error [${data.code}]: ${data.message}`);
        continue;
      }
      
      console.log('✓ Command executed successfully');
    }
    
    console.log('✅ Function cleanup completed');
    
    // VERIFICATION - FIXED SECTION
    try {
      console.log('Verifying functions...');
      
      // Get public namespace OID
      const { data: namespaceData, error: namespaceError } = await supabase
        .from('pg_namespace')
        .select('oid')
        .eq('nspname', 'public')
        .single();
        
      if (namespaceError || !namespaceData) {
        throw new Error(namespaceError?.message || 'Public namespace not found');
      }
      
      const publicOid = namespaceData.oid;
      
      // Get functions
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname, proargtypes, proconfig')
        .in('proname', ['insert_comment_safe', 'insert_comment_with_config'])
        .eq('pronamespace', publicOid);
        
      if (funcError) {
        console.error('❌ Function query error:', funcError.message);
      } else if (functions && functions.length > 0) {
        console.log('✅ Functions found:');
        functions.forEach(f => {
          console.log(`- ${f.proname}:`, 
            f.proconfig ? `Search path: ${f.proconfig.join(',')}` : 'No search path');
        });
        
        if (functions.length !== 2) {
          console.warn(`⚠️ Expected 2 functions but found ${functions.length}`);
        }
      } else {
        console.log('ℹ️ No functions found after cleanup');
      }
    } catch (verificationError) {
      console.error('❌ Verification failed:', verificationError.message);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

runCleanup();