import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mikrcsxkyggxjeaqyfaw.supabase.co';
// IMPORTANT: Replace this with your actual Supabase anon/public key from:
// Supabase Dashboard -> Settings -> API -> "anon public" key (starts with eyJ...)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pa3Jjc3hreWdneGplYXF5ZmF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjQ1OCwiZXhwIjoyMDg2MDAyNDU4fQ.pX3hcJJUQwJa0YC88iy8NUhORDZbB44fgTojvbZZO7A';  // ← Replace this!

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
