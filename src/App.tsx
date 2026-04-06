import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useLanguage } from './useLanguage'

function App() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {session ? <Home session={session} /> : <Login />}
    </div>
  )
}

function Login() {
  const t = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage(t.auth.checkEmail)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm border border-gray-100">
        <div className="mb-8">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white text-xl">⚽</span>
          </div>
          <h1 className="text-2xl font-medium text-gray-900">Matchit</h1>
          <p className="text-gray-500 text-sm mt-1">{t.auth.tagline}</p>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            placeholder={t.auth.email}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400"
          />
          <input
            type="password"
            placeholder={t.auth.password}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400"
          />
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
          >
            {loading ? t.common.loading : t.auth.login}
          </button>
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {t.auth.signup}
          </button>
        </div>
      </div>
    </div>
  )
}

function Home({ session }: { session: any }) {
  const t = useLanguage()
  const [team, setTeam] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('home')
  const [showCreateTeam, setShowCreateTeam] = useState(false)

  useEffect(() => {
    fetchTeam()
    fetchNotifications()
    fetchUpcomingMatches()
  }, [])

  const fetchTeam = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', session.user.id)
      .single()
    setTeam(data)
  }

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(3)
    setNotifications(data || [])
  }

  const fetchUpcomingMatches = async () => {
    if (!team) return
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('team_id', team?.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(3)
    setUpcomingMatches(data || [])
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      {showCreateTeam && (
  <CreateTeam
    session={session}
    onCreated={() => {
      setShowCreateTeam(false)
      fetchTeam()
    }}
  />
)}
      <div className="flex-1 overflow-y-auto pb-20">

        {/* Hero */}
        <div className="bg-green-500 p-5">
          <p className="text-green-100 text-sm">{t.home.greeting}</p>
          <h1 className="text-white text-xl font-medium mb-3">
            {session.user.email}
          </h1>
          {team ? (
            <div className="flex items-center gap-3 bg-white/15 rounded-xl p-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600 text-xs font-medium">
                {team.name.substring(0, 3).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{team.name}</p>
                <p className="text-green-100 text-xs">{team.region} · {team.age_group}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/15 rounded-xl p-3 flex items-center justify-between">
              <p className="text-white text-sm">{t.home.noTeam}</p>
              <button onClick={() => setShowCreateTeam(true)}
               className="bg-white text-green-600 text-xs font-medium px-3 py-1.5 rounded-lg">
               {t.home.createTeam}
              </button>
            </div>
          )}
        </div>

        {/* Snabbval */}
        <div className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.home.quickActions}</p>
          <div className="grid-2">
            {[
              { label: t.home.postMatch, sub: t.home.postMatchSub, bg: 'bg-green-50', icon: '➕', color: 'text-green-600' },
              { label: t.home.findMatch, sub: t.home.findMatchSub, bg: 'bg-blue-50', icon: '🔍', color: 'text-blue-600' },
              { label: t.home.findCup, sub: t.home.findCupSub, bg: 'bg-amber-50', icon: '🏆', color: 'text-amber-600' },
              { label: t.home.bookReferee, sub: t.home.bookRefereeSub, bg: 'bg-red-50', icon: '👤', color: 'text-red-600' },
            ].map((item, i) => (
              <button key={i} className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:border-gray-200 transition-colors">
                <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mb-2 text-sm`}>
                  {item.icon}
                </div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notiser */}
        <div className="px-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-700">{t.home.notifications}</p>
            <button className="text-xs text-green-500">{t.home.showAll}</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">{t.home.noNotifications}</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className="flex items-start gap-3 p-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kommande matcher */}
        <div className="px-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-700">{t.home.upcomingMatches}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {upcomingMatches.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">{t.home.noMatches}</p>
            ) : (
              upcomingMatches.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0">
                  <div className="text-center min-w-8">
                    <p className="text-lg font-medium text-green-500 leading-none">
                      {new Date(m.date).getDate()}
                    </p>
                    <p className="text-xs text-gray-400 uppercase">
                      {new Date(m.date).toLocaleDateString('sv-SE', { month: 'short' })}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{m.type}</p>
                    <p className="text-xs text-gray-400">{m.location} · {m.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    m.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {m.status === 'open' ? 'Öppen' : 'Bokad'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logga ut */}
        <div className="px-4">
          <button
            onClick={handleSignOut}
            className="w-full text-sm text-gray-400 py-2"
          >
            Logga ut
          </button>
        </div>

      </div>

      {/* Tab bar */}
      <div className="nav-bar">
        {[
          { id: 'home', label: t.nav.home, icon: '🏠' },
          { id: 'search', label: t.nav.search, icon: '🔍' },
          { id: 'post', label: t.nav.post, icon: '➕' },
          { id: 'notifications', label: t.nav.notifications, icon: '🔔' },
          { id: 'profile', label: t.nav.profile, icon: '👤' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
              activeTab === tab.id ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CreateTeam({ session, onCreated }: { session: any, onCreated: () => void }) {
  const t = useLanguage()
  const [loading, setLoading] = useState(false)
const [form, setForm] = useState({
  name: '',
  club: '',
  lan: 'Stockholm',
  kommun: '',
  age_group: '',
  gender: '',
  formation: '',
  levels: [] as string[],
})

  const stockholmKommuner = [
    'Botkyrka', 'Danderyd', 'Ekerö', 'Haninge', 'Huddinge',
    'Järfälla', 'Lidingö', 'Nacka', 'Norrtälje', 'Nykvarn',
    'Nynäshamn', 'Salem', 'Sigtuna', 'Sollentuna', 'Solna',
    'Stockholm', 'Sundbyberg', 'Södertälje', 'Tyresö', 'Täby',
    'Upplands-Bro', 'Upplands Väsby', 'Vallentuna', 'Vaxholm',
    'Värmdö', 'Österåker'
  ]

  const allAgeGroups: Record<string, string[]> = {
    'Pojkar': ['P2009','P2010','P2011','P2012','P2013','P2014','P2015','P2016','P2017','P2018'],
    'Flickor': ['F2009','F2010','F2011','F2012','F2013','F2014','F2015','F2016','F2017','F2018'],
    'Blandat': ['P2009','P2010','P2011','P2012','P2013','P2014','P2015','P2016','P2017','P2018',
                'F2009','F2010','F2011','F2012','F2013','F2014','F2015','F2016','F2017','F2018'],
  }
  
  const ageGroups = form.gender ? allAgeGroups[form.gender] : []
  

  const levels = ['Lätt', 'Lätt+', 'Medel-', 'Medel', 'Medel+', 'Svår', 'Svår+']
  const formations = ['5v5', '7v7', '9v9', '11v11']
  const genders = ['Pojkar', 'Flickor', 'Blandat']

  const update = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'gender' ? { age_group: '' } : {}),
    }))
  }

const toggleLevel = (level: string) => {
  setForm(prev => ({
    ...prev,
    levels: prev.levels.includes(level)
      ? prev.levels.filter(l => l !== level)
      : [...prev.levels, level],
  }))
}

  const handleSave = async () => {
    if (!form.name || !form.kommun || !form.age_group || !form.gender || !form.formation || form.levels.length === 0) {
      alert('Fyll i alla fält')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('teams').insert({
      owner_id: session.user.id,
      name: form.name,
      club: form.club,
      region: `${form.lan} – ${form.kommun}`,
      age_group: form.age_group,
      gender: form.gender,
      formation: form.formation,
      level: form.levels.join(', '),
    })
    if (error) {
      alert(error.message)
    } else {
      onCreated()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen flex flex-col">
      <div className="bg-green-500 p-5">
        <h1 className="text-white text-xl font-medium">Skapa lag</h1>
        <p className="text-green-100 text-sm mt-1">Fyll i uppgifter om ditt lag</p>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Lagnamn</label>
          <input
            type="text"
            placeholder="t.ex. AIK P15"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Klubb</label>
          <input
            type="text"
            placeholder="t.ex. AIK"
            value={form.club}
            onChange={e => update('club', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Län</label>
          <select
            value={form.lan}
            onChange={e => update('lan', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"
          >
            <option value="Stockholm">Stockholms län</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Kommun</label>
          <select
            value={form.kommun}
            onChange={e => update('kommun', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"
          >
            <option value="">Välj kommun</option>
            {stockholmKommuner.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Kön</label>
          <select
            value={form.gender}
            onChange={e => update('gender', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"
          >
            <option value="">Välj kön</option>
            {genders.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Åldersgrupp</label>
          <select
            value={form.age_group}
            onChange={e => update('age_group', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"
          >
            <option value="">Välj åldersgrupp</option>
            {ageGroups.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Uppställning</label>
          <select
            value={form.formation}
            onChange={e => update('formation', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"
          >
            <option value="">Välj uppställning</option>
            {formations.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
  <label className="text-sm text-gray-500 mb-1 block">Nivå (välj en eller flera)</label>
  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
    {levels.map(l => (
      <button
        key={l}
        type="button"
        onClick={() => toggleLevel(l)}
        style={{
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: form.levels.includes(l) ? '#22c55e' : '#e5e7eb',
          backgroundColor: form.levels.includes(l) ? '#22c55e' : 'white',
          color: form.levels.includes(l) ? 'white' : '#4b5563',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {l}
      </button>
    ))}
  </div>
</div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
        >
          {loading ? t.common.loading : t.common.save}
        </button>

      </div>
    </div>
  )
}

export default App