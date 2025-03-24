
import { createClient } from '@supabase/supabase-js';

// Use the values from the Supabase client settings
const supabaseUrl = "https://nugerdxawqqxpfjrtikh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTkwMDcsImV4cCI6MjA1ODQzNTAwN30.sSFyTG_RZo2ojgcDnFBLtZ2uQN8pCsD5SHfW3e-1ojE";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ou chave anônima não configuradas.');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
