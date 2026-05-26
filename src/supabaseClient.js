import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbuhmxzbddaqigazacov.supabase.co';
const supabaseKey = 'sb_publishable__AfgPvXVyvdKK9TwyykVZQ_5JJTp_G_';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;