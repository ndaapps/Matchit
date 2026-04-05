import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://suwxlawzbcdiexicaoiz.supabase.co'
const supabaseKey = 'sb_publishable_eG67fJkHeSsTgeyrKsmJZg_6CM7QB9n'

export const supabase = createClient(supabaseUrl, supabaseKey)