import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getRoomChannel(supabaseClient, roomId) {
  return supabaseClient.channel(`snake-room-${roomId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: '' },
    },
  })
}