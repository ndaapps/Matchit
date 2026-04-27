import { useState } from 'react'
import { supabase } from './supabase'

function EmailForm({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    const { error } = await supabase.from('beta_signups').insert({ email })
    if (!error) {
      setStatus('success')
      setEmail('')
    } else if (error.code === '23505') {
      setStatus('duplicate')
    } else {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className={`text-green-400 font-medium ${className}`}>
        Tack! Vi hör av oss snart.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="din@email.se"
        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white text-gray-900"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {status === 'loading' ? 'Skickar...' : 'Få tidig tillgång'}
      </button>
      {status === 'duplicate' && (
        <p className="text-sm text-yellow-600 sm:absolute sm:mt-14">Du är redan registrerad!</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-500 sm:absolute sm:mt-14">Något gick fel, försök igen.</p>
      )}
    </form>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⚽</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Kickly</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hur det fungerar</a>
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">För arrangörer</a>
            <a href="#cta" className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors">
              Kom igång
            </a>
          </div>
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Meny"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-4 flex flex-col gap-4 bg-white">
            <a href="#how-it-works" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Hur det fungerar</a>
            <a href="#features" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>För arrangörer</a>
            <a href="#cta" className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>
              Kom igång
            </a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-6 uppercase tracking-wide">
            Beta – begränsat antal platser
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Hitta motståndare.<br className="hidden sm:block" /> Boka match. Direkt.
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto mb-10">
            Ungdomsfotboll saknar en strukturerad plattform för matchbokning. Kickly samlar lag, förfrågningar och bekräftelser på ett och samma ställe.
          </p>
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <EmailForm />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Kostnadsfritt under beta. Inget kreditkort krävs.</p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Matchbokning saknar en strukturerad plattform
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Idag sker det via WhatsApp-grupper, Facebook och Instagram DM. Det är ostrukturerat, saknar bekräftelse och lämnar inget spår.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '💬', title: 'WhatsApp-grupper', desc: 'Förfrågningar dränks i chattbrus. Ingen vet vem som svarar.' },
              { icon: '📘', title: 'Facebook & Instagram', desc: 'Offentliga inlägg och DMs – varken snabbt eller tillförlitligt.' },
              { icon: '❌', title: 'Inget spår', desc: 'Matcherna bokas muntligt. Inga bekräftelser, inget historik.' },
            ].map(item => (
              <div key={item.title} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 bg-green-500">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 text-center text-white">
            {[
              { value: '283', label: 'Aktiva lagledare i en enda grupp' },
              { value: '539', label: 'Matchförfrågningar på 3 månader' },
              { value: '21%', label: 'Av meddelandena raderade – matcher bokade utan spårbarhet' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-5xl font-extrabold mb-2">{stat.value}</div>
                <div className="text-green-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Hur det fungerar</h2>
            <p className="text-gray-500 text-lg">Tre steg från idé till bekräftad match.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Lägg upp eller hitta',
                desc: 'Skapa en matchförfrågan med datum, plats och åldersklass – eller bläddra bland öppna förfrågningar.',
              },
              {
                step: '02',
                title: 'Anmäl intresse',
                desc: 'Skicka ett matchintresse direkt till laget du vill möta. Snabbt, tydligt och spårbart.',
              },
              {
                step: '03',
                title: 'Bekräftat – klart',
                desc: 'Båda parter bekräftar. Ni får ett matchkort med all info samlad på ett ställe.',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-6 left-full w-full h-0.5 bg-green-100 z-0" style={{ width: 'calc(100% - 3rem)', left: '100%', transform: 'translateX(-50%)' }} />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Allt du behöver</h2>
            <p className="text-gray-500 text-lg">Byggt för lagledare som vill fokusera på fotboll, inte administration.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: 'Sök matcher', desc: 'Filtrera på åldersklass, datum och geografi.' },
              { icon: '📩', title: 'Inkorgen', desc: 'Se alla inkommande och utgående matchförfrågningar på ett ställe.' },
              { icon: '✅', title: 'Bekräftelsesystem', desc: 'Båda parter bekräftar – inga missförstånd.' },
              { icon: '📅', title: 'Matchhistorik', desc: 'Håll koll på spelade och planerade matcher.' },
              { icon: '🏟️', title: 'Platsinfo', desc: 'Lägg till planuppgifter och adress direkt i förfrågan.' },
              { icon: '🔔', title: 'Notifieringar', desc: 'Få besked när någon svarar på din förfrågan.' },
            ].map(f => (
              <div key={f.title} className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-green-200 transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Redo att testa?</h2>
          <p className="text-gray-500 text-lg mb-8">
            Registrera dig för tidig tillgång och var med och forma hur framtidens matchbokning ser ut.
          </p>
          <div className="relative">
            <EmailForm />
          </div>
          <div className="mt-6">
            <a
              href="/app"
              className="text-sm text-gray-400 hover:text-green-500 transition-colors"
            >
              Gå direkt till appen →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">⚽</span>
            </div>
            <span className="font-semibold text-gray-700">Kickly</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href="#" className="hover:text-gray-700 transition-colors">Integritetspolicy</a>
            <span>·</span>
            <a href="#" className="hover:text-gray-700 transition-colors">Användarvillkor</a>
            <span>·</span>
            <a href="mailto:info@kickly.se" className="hover:text-gray-700 transition-colors">info@kickly.se</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
