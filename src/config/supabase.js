const { createClient } = require('@supabase/supabase-js');

let supabase;

try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('✅ Supabase client initialized');
  } else {
    console.log('⚠️  Supabase environment variables not found. Using localStorage fallback for data.');
  }
} catch (error) {
  console.log('⚠️  Supabase initialization failed. Using localStorage fallback:', error.message);
}

module.exports = supabase;
