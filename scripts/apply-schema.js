import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_PATH = path.join(process.cwd(), 'supabase', 'schema.sql');

async function main() {
  console.log('====================================================');
  console.log(' Stickle Supabase Schema Initializer');
  console.log('====================================================\n');

  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error('❌ Error: schema.sql file not found at:', SCHEMA_PATH);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const dbUrl = process.env.DATABASE_URL || '';

  if (dbUrl) {
    console.log('⚡ Attempting automatic direct PostgreSQL connection to apply schema...');
    try {
      // Dynamic import of pg if installed
      const { Client } = await import('pg');
      const client = new Client({ connectionString: dbUrl });
      await client.connect();
      await client.query(sqlContent);
      await client.end();
      console.log('✅ Successfully applied schema.sql directly via PostgreSQL!');
      process.exit(0);
    } catch (err) {
      console.warn('⚠️ Direct PG execution failed:', err.message);
    }
  }

  if (supabaseUrl && serviceKey) {
    console.log('⚡ Attempting execution via Supabase Management API...');
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: sqlContent }),
      });
      if (res.ok) {
        console.log('✅ Schema applied successfully via Supabase Management API!');
        process.exit(0);
      }
    } catch (err) {
      console.warn('⚠️ Supabase Management API execution notice:', err.message);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log('📋 MANUAL 1-CLICK INITIALIZATION & SEEDING:');
  console.log('----------------------------------------------------');
  console.log('1. Open your Supabase Dashboard:');
  console.log(`   ${supabaseUrl || 'https://supabase.com/dashboard'}`);
  console.log('2. Click on "SQL Editor" in the left sidebar.');
  console.log('3. Open file: supabase/schema.sql ➔ Paste & click "RUN" to create tables.');
  console.log('4. Open file: supabase/seed.sql   ➔ Paste & click "RUN" to populate sample data.');
  console.log('----------------------------------------------------');
  console.log('This will create and seed:');
  console.log('  • public.profiles (with auto-provision trigger on auth.users)');
  console.log('  • public.workspaces & public.workspace_members (Acme Engineering)');
  console.log('  • public.notes (Sample shared Wikipedia & Hacker News notes)');
  console.log('  • public.waitlist & public.api_keys\n');
}

main();
