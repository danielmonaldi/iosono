import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whvafphwpkastjkcjrzs.supabase.co';
const supabaseKey = 'sb_publishable_Cv54UnrSd6dQgQN7FYrPqA_fuUj77A5';

export const supabase = createClient(supabaseUrl, supabaseKey);
