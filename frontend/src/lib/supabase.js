import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mikrcsxkyggxjeaqyfaw.supabase.co';
// WARNING: The key below looks like a Clerk key, not a Supabase key.
// Please replace this with your Supabase "anon / public" key from Settings -> API.
const supabaseAnonKey = 'sb_publishable_5EcQ8cft4O7mHiG3Ys3IMg__nGdt5_T';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
