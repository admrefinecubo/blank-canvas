import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ptwchorxhfhreodekgfn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0d2Nob3J4aGZocmVvZGVrZ2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjA3NTksImV4cCI6MjA4NzUzNjc1OX0.poKgY8-7goknb2cyh8c9H08PfM5R3U_uU2s_b0H4qoM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
