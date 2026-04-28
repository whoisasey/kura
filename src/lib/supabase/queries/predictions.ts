import type { SupabaseClient } from '@supabase/supabase-js'
import type { CycleInsight } from '@/types/index'

export const getTodayCycleInsight = async (
  supabase: SupabaseClient,
  userId: string
): Promise<CycleInsight | null> => {
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('predictions')
    .select('hormone_note')
    .eq('user_id', userId)
    .eq('prediction_date', today)
    .eq('call_type', 'cycle_insight')
    .single()

  if (!data?.hormone_note) return null

  try {
    return JSON.parse(data.hormone_note) as CycleInsight
  } catch {
    return null
  }
}

export const getLatestCachedInsight = async (
  supabase: SupabaseClient,
  userId: string
): Promise<CycleInsight | null> => {
  const { data } = await supabase
    .from('predictions')
    .select('hormone_note')
    .eq('user_id', userId)
    .eq('call_type', 'cycle_insight')
    .order('prediction_date', { ascending: false })
    .limit(1)
    .single()

  if (!data?.hormone_note) return null

  try {
    return JSON.parse(data.hormone_note) as CycleInsight
  } catch {
    return null
  }
}
