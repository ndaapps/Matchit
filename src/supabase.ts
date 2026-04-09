import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://suwxlawzbcdiexicaoiz.supabase.co'
const supabaseKey = 'sb_publishable_eG67fJkHeSsTgeyrKsmJZg_6CM7QB9n'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const sendEmail = async (type: string, to_email: string, to_name: string, data: Record<string, any>) => {
  try {
    console.log('sendEmail called:', type, new Date().toISOString())
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('https://suwxlawzbcdiexicaoiz.supabase.co/functions/v1/send-notification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ type, to_email, to_name, data }),
    })
    const result = await response.json()
    console.log('Email result:', result)
  } catch (err) {
    console.error('Email error:', err)
  }
}