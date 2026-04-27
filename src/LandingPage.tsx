import { useState } from 'react'
import { supabase } from './supabase'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await supabase.from('beta_signups').insert({ email })
    setSubmitted(true)
    setLoading(false)
  }

  const EmailForm = ({ dark = false }: { dark?: boolean }) => (
    submitted ? (
      <p style={{ color: dark ? '#22c55e' : '#166534', fontSize: '15px', fontWeight: 500 }}>
        Tack! Vi hör av oss när det är dags.
      </p>
    ) : (
      <form onSubmit={handleSignup} style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
        <input
          type="email"
          placeholder="Din e-postadress"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            flex: 1, padding: '12px 16px',
            border: `0.5px solid ${dark ? '#374151' : '#d1d5db'}`,
            borderRadius: '10px', fontSize: '14px', outline: 'none',
            background: dark ? '#1f2937' : 'white',
            color: dark ? 'white' : '#1f2937',
          }}
        />
        <button type="submit" disabled={loading} style={{
          background: '#22c55e', color: 'white', border: 'none',
          padding: '12px 20px', borderRadius: '10px', fontSize: '14px',
          fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {loading ? '...' : 'Få tidig tillgång'}
        </button>
      </form>
    )
  )

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937', maxWidth: '100%' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '0.5px solid #e5e7eb', background: 'white' }}>
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e', letterSpacing: '-0.5px' }}>Kickly</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#hur" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Hur det fungerar</a>
          <a href="#cuper" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Cuper</a>
          <a href="#funktioner" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Funktioner</a>
          <a href="/app" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>Kom igång</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: '#f0fdf4', padding: '5rem 2rem 4rem', textAlign: 'center', borderBottom: '0.5px solid #bbf7d0' }}>
        <div style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: 500, padding: '4px 14px', borderRadius: '999px', marginBottom: '1.5rem', letterSpacing: '0.02em' }}>
          Beta — gratis för lagledare
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, lineHeight: 1.15, color: '#111827', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
          Boka match enklare.<br />
          <span style={{ color: '#22c55e' }}>Mer tid till fotboll.</span>
        </h1>
        <p style={{ fontSize: '17px', color: '#4b5563', lineHeight: 1.75, maxWidth: '520px', margin: '0 auto 2rem' }}>
          Kickly är plattformen för ungdomslagsfotboll. Hitta motståndare, se tillgängliga cuper och hantera allt på ett ställe.
        </p>
        <EmailForm />
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>Gratis under beta · Ingen bindningstid</p>
      </div>

      {/* PROBLEM */}
      <div style={{ padding: '4rem 2rem', background: 'white', maxWidth: '860px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Problemet</p>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>
          Det saknas en samlad plattform för matchbokning
        </h2>
        <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.75 }}>
          Idag sker matchbokning via WhatsApp-grupper, Facebook och direktmeddelanden i sociala medier. Det är ostrukturerat, tidskrävande och saknar spårbarhet — ingen bekräftelse, ingen historik, ingen översikt.
        </p>
        <div style={{ background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: '12px', padding: '1.25rem 1.5rem', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '14px', color: '#92400e', lineHeight: 1.7 }}>
            Lagledare lägger idag massor med tid på att hitta motståndare, koordinera datum och bekräfta. Med Kickly tar det under en minut att lägga upp en match — och med bevakningar kan du automatisera hela sökningen så att rätt match kommer till dig.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '1.75rem' }}>
          {[
            { num: '283', label: 'Aktiva lagledare i en enda WhatsApp-grupp', note: 'Exempeldata från en grupp' },
            { num: '539', label: 'Matchförfrågningar på 3 månader — att gå igenom manuellt tar timmar', note: 'Exempeldata från en grupp' },
            { num: '21%', label: 'Av inläggen raderas — matcher bokade utan spårning eller bekräftelse', note: 'Exempeldata från en grupp' },
          ].map(s => (
            <div key={s.num} style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#22c55e', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', lineHeight: 1.4 }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HUR DET FUNGERAR */}
      <div id="hur" style={{ padding: '4rem 2rem', background: '#f9fafb', borderTop: '0.5px solid #e5e7eb', borderBottom: '0.5px solid #e5e7eb' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Hur det fungerar</p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: '#111827', marginBottom: '1.75rem', letterSpacing: '-0.3px' }}>Tre steg till en bokad match</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { n: '1', title: 'Lägg upp eller hitta match', desc: 'Publicera en ledig tid eller sök bland tillgängliga matcher — filtrera på nivå, format, datum och ort.' },
              { n: '2', title: 'Anmäl intresse', desc: 'Skicka en intresseanmälan med ett klick. Arrangören ser alla anmälningar och väljer motståndare.' },
              { n: '3', title: 'Bekräftat — klart!', desc: 'Båda lag får bekräftelse med kontaktuppgifter. Övriga anmälningar avvisas automatiskt.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ width: '34px', height: '34px', background: '#dcfce7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, marginBottom: '0.75rem' }}>{s.n}</div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FUNKTIONER */}
      <div id="funktioner" style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Funktioner</p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: '#111827', marginBottom: '1.75rem', letterSpacing: '-0.3px' }}>Allt du behöver som lagledare</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {[
              { title: 'Hitta träningsmatch', desc: 'Filtrera på nivå, spelform, datum och ort. Se lediga matcher direkt.' },
              { title: 'Bekräftelseflöde', desc: 'Strukturerat flöde med automatiska notiser — från intresse till bekräftad match.' },
              { title: 'Cuper & matchcamp', desc: 'Hitta och anmäl dig till cuper. Arrangörer marknadsför med bild och all info.' },
              { title: 'Bevakningar', desc: 'Spara filter och få email direkt när en ny match matchar dina kriterier.' },
              { title: 'Kalender & historik', desc: 'Se alla bekräftade matcher i kalendervy. Full historik över säsongen.' },
              { title: 'Flera lagledare', desc: 'Bjud in fler ledare till ditt lag med rollsystem. Kommer snart.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{f.title}</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#111827', padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>Redo att testa Kickly?</h2>
        <p style={{ fontSize: '15px', color: '#9ca3af', marginBottom: '1.75rem' }}>Gå med i beta och få tillgång direkt. Gratis för lagledare.</p>
        <EmailForm dark />
        <p style={{ marginTop: '1.25rem', fontSize: '13px', color: '#6b7280' }}>
          Redan registrerad?{' '}
          <a href="/app" style={{ color: '#22c55e', textDecoration: 'none' }}>Gå till appen →</a>
        </p>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '1.5rem 2rem', borderTop: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'white' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>Kickly</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/integritetspolicy" style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'none' }}>Integritetspolicy</a>
          <a href="/anvandarvillkor" style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'none' }}>Användarvillkor</a>
          <a href="mailto:info@kickly.se" style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'none' }}>info@kickly.se</a>
        </div>
      </div>

    </div>
  )
}
