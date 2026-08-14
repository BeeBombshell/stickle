import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://hipwwiftfdthbdwtmvky.supabase.co';

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function clearWaitlist() {
  console.log('====================================================');
  console.log(' Stickle Supabase Waitlist Cleaner');
  console.log('====================================================\n');

  if (!serviceKey) {
    console.warn('⚠️ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    console.log('\nTo clear the waitlist table automatically:');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=<your_key> npm run db:clear-waitlist\n');
    console.log('Or manually clear in Supabase Dashboard SQL Editor:');
    console.log('  TRUNCATE TABLE public.waitlist;');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('⚡ Purging all entries from public.waitlist...');
  const { data, error } = await supabase
    .from('waitlist')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('❌ Failed to clear waitlist table:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Successfully cleared all entries from public.waitlist database table!');
  }
}

clearWaitlist();
