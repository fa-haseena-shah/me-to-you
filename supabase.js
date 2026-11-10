import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ejojhrcdqfgsekxbtukb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_xmdTap4WXDrQArcRGTm4Tw_enKGWL44'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)