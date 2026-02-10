import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mikrcsxkyggxjeaqyfaw.supabase.co';
const supabaseAnonKey = 'sb_publishable_5EcQ8cft4O7mHiG3Ys3IMg__nGdt5_T';
// Note: We use the publishable/anon key for client-side operations. 
// For server-side, the secret key would be used.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
