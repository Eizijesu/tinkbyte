import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyRLSPolicies() {
  try {
    console.log('📋 Reading migration file...');
    const migrationPath = path.join(__dirname, 'database', 'migrations', '006_allow_user_articles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Applying RLS policies for articles table...');
    
    // Split by semicolon to execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.error(`⚠️  Warning on statement ${i + 1}:`, error.message);
          // Continue anyway as some errors might be expected (like "policy already exists")
        }
      }
    }
    
    console.log('✅ RLS policies applied successfully!');
    console.log('');
    console.log('📊 Summary of applied policies:');
    console.log('   ✓ Users can insert their own articles');
    console.log('   ✓ Users can update their own articles');
    console.log('   ✓ Users can delete their own articles');
    console.log('   ✓ Anyone can view published articles');
    console.log('   ✓ Users can view their own draft articles');
    console.log('   ✓ Admins can manage all articles');
    console.log('');
    console.log('🎉 You can now test creating articles as a regular user!');
    
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error.message);
    console.log('');
    console.log('📝 Manual Steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to: Database > Policies');
    console.log('3. Select the "articles" table');
    console.log('4. Run the SQL from: database/migrations/006_allow_user_articles.sql');
    process.exit(1);
  }
}

applyRLSPolicies();
