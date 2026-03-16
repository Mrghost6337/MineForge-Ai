import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://czxcuodsiictwnfsazvv.supabase.co';
const supabaseAnonKey = 'sb_publishable_wUBcWnG7jOAtkxwIyBQ8bQ_x978A_V4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
