import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { type, to_email, to_name, data } = await req.json()

  const subjects: Record<string, string> = {
    interest: `Ny intresseanmälan – ${data.activity_type} ${data.date}`,
    accepted: `Match bekräftad! ${data.activity_type} ${data.date}`,
    rejected: `Intresseanmälan avvisad – ${data.activity_type} ${data.date}`,
    cancelled: `Match avbokad – ${data.activity_type} ${data.date}`,
    watch: `Ny match matchar din bevakning – ${data.activity_type} ${data.date}`,
  }

  const bodies: Record<string, string> = {
    interest: `
      <h2>Ny intresseanmälan på Matchit!</h2>
      <p>Hej ${to_name},</p>
      <p><strong>${data.team_name}</strong> är intresserade av din ${data.activity_type} den ${data.date} kl ${data.time} på ${data.location}.</p>
      ${data.message ? `<p>Meddelande: <em>"${data.message}"</em></p>` : ''}
      <p>Logga in på Matchit för att svara på anmälan.</p>
    `,
    accepted: `
      <h2>Din match är bekräftad!</h2>
      <p>Hej ${to_name},</p>
      <p><strong>${data.team_name}</strong> har bekräftat er match!</p>
      <p>📅 ${data.date} kl ${data.time}<br>📍 ${data.location}</p>
      <p>Kontakta arrangören via ${data.contact_method} för att stämma av detaljer.</p>
    `,
    rejected: `
      <h2>Intresseanmälan avvisad</h2>
      <p>Hej ${to_name},</p>
      <p><strong>${data.team_name}</strong> har tyvärr avvisat er intresseanmälan.</p>
      ${data.reason ? `<p>Anledning: ${data.reason}</p>` : ''}
      <p>Fortsätt söka på Matchit – det finns fler matcher!</p>
    `,
    cancelled: `
      <h2>Match avbokad</h2>
      <p>Hej ${to_name},</p>
      <p><strong>${data.team_name}</strong> har avbokat matchen ${data.date} kl ${data.time}.</p>
      ${data.reason ? `<p>Anledning: ${data.reason}</p>` : ''}
      <p>Logga in på Matchit för att hitta en ny match.</p>
    `,
    watch: `
      <h2>Ny match matchar din bevakning!</h2>
      <p>Hej ${to_name},</p>
      <p>En ny ${data.activity_type} har lagts upp som matchar din bevakning <strong>"${data.watch_name}"</strong>.</p>
      <p>📅 ${data.date} kl ${data.time}<br>📍 ${data.location}<br>⚽ ${data.formation}</p>
      <p>Logga in på Matchit för att anmäla intresse!</p>
    `,
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Matchit <onboarding@resend.dev>',
      to: [to_email],
      subject: subjects[type],
      html: bodies[type],
    }),
  })

  const responseData = await res.json()
  return new Response(JSON.stringify(responseData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: res.ok ? 200 : 400,
  })
})