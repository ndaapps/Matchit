import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useLanguage } from './useLanguage'
import { CupsView, CupDetail } from './Cups'

function App() {
  const [session, setSession] = useState<any>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
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
          <input type="email" placeholder={t.auth.email} value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
          <input type="password" placeholder={t.auth.password} value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
            {loading ? t.common.loading : t.auth.login}
          </button>
          <button onClick={handleSignup} disabled={loading}
            className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [confirmedMatches, setConfirmedMatches] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('home')
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateActivity, setShowCreateActivity] = useState(false)
  const [showFindMatch, setShowFindMatch] = useState(false)
  const [showIncoming, setShowIncoming] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMyMatches, setShowMyMatches] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [showBookingConfirmed, setShowBookingConfirmed] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showCups, setShowCups] = useState(false)
  const [pendingBookings, setPendingBookings] = useState<any[]>([])

  useEffect(() => { fetchTeam(); fetchNotifications() }, [])
  useEffect(() => { if (team) { fetchConfirmedMatches(); fetchPendingBookings() } }, [team])

  const fetchTeam = async () => {
    const { data } = await supabase.from('teams').select('*').eq('owner_id', session.user.id).single()
    setTeam(data)
  }

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', session.user.id).eq('read', false)
      .order('created_at', { ascending: false })
    setNotifications(data || [])
    setUnreadCount(data?.length || 0)
  }

  const fetchConfirmedMatches = async () => {
    if (!team) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.rpc('get_confirmed_matches', { p_team_id: team.id })
    const upcoming = (data || []).filter((m: any) => m.date >= today)
    setConfirmedMatches(upcoming)
  }

  const fetchPendingBookings = async () => {
    if (!team) return
    const { data: myActs } = await supabase.from('activities').select('id').eq('team_id', team.id)
    const actIds = myActs?.map((a: any) => a.id) || []
    if (actIds.length === 0) { setPendingBookings([]); return }
    const { data } = await supabase.from('bookings')
      .select('*, teams(name, club, level, formation), activities(type, date, formation, level)')
      .eq('status', 'pending').in('activity_id', actIds)
      .order('created_at', { ascending: false })
    setPendingBookings(data || [])
  }

  const handleNotificationClick = async (n: any) => {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    setNotifications(prev => prev.filter(x => x.id !== n.id))
    setUnreadCount(prev => Math.max(0, prev - 1))
    setShowNotifications(false)
    if (n.type === 'interest') setShowIncoming(true)
    if (n.type === 'accepted') {
      const { data } = await supabase.from('bookings')
        .select('*, activities(*, teams(name)), teams(name)')
        .eq('team_id', team?.id).eq('status', 'confirmed')
        .order('confirmed_at', { ascending: false }).limit(1).single()
      if (data) setShowBookingConfirmed(data)
    }
    if (n.type === 'republish') {
      // Open activity detail for republishing
      setShowMyMatches('mine')
    }
  }

  const handleSignOut = async () => { await supabase.auth.signOut() }

  return (
    <div className="max-w-sm mx-auto min-h-screen flex flex-col relative">
      {showCreateTeam && <CreateTeam session={session} onCreated={() => { setShowCreateTeam(false); fetchTeam() }} />}
      {showCreateActivity && team && (
        <CreateActivity team={team}
          onCreated={() => { setShowCreateActivity(false); fetchConfirmedMatches() }}
          onBack={() => setShowCreateActivity(false)} />
      )}
      {showFindMatch && team && <FindMatch team={team} session={session} onBack={() => setShowFindMatch(false)} />}
      {showIncoming && team && (
        <IncomingRequests team={team}
          onConfirmed={() => { fetchConfirmedMatches(); fetchPendingBookings() }}
          onBack={() => { setShowIncoming(false); fetchNotifications(); fetchConfirmedMatches(); fetchPendingBookings() }} />
      )}
      {showMyMatches && team && (
        <MyMatches team={team} session={session} initialTab={showMyMatches}
          onBack={() => { setShowMyMatches(null); fetchConfirmedMatches() }} />
      )}
      {showCalendar && team && (
        <CalendarView matches={confirmedMatches}
          onBack={() => setShowCalendar(false)}
          onMatchClick={(m: any) => { setShowCalendar(false); setSelectedMatch(m) }} />
      )}
      {showNotifications && (
        <NotificationsView notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onBack={() => setShowNotifications(false)} />
      )}
      {selectedMatch && team && (
        <MatchCard match={selectedMatch} team={team} session={session}
          onBack={() => { setSelectedMatch(null); fetchConfirmedMatches() }}
          onCancelled={() => { setSelectedMatch(null); fetchConfirmedMatches(); fetchNotifications() }} />
      )}
      {showBookingConfirmed && (
        <ConfirmedScreen booking={showBookingConfirmed} isRequester={true}
          onBack={() => { setShowBookingConfirmed(null); fetchConfirmedMatches() }} />
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="bg-green-500 p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-green-100 text-sm">{t.home.greeting}</p>
              <h1 className="text-white text-xl font-medium">{session.user.email}</h1>
            </div>
            <button onClick={() => setShowNotifications(true)}
              style={{ position: 'relative', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
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

        <div className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.home.quickActions}</p>
          <div className="grid-2">
            {[
              { label: t.home.postMatch, sub: t.home.postMatchSub, icon: '➕', action: () => setShowCreateActivity(true) },
              { label: t.home.findMatch, sub: t.home.findMatchSub, icon: '🔍', action: () => setShowFindMatch(true) },
              { label: 'Mina matcher', sub: 'Annonser & anmälningar', icon: '📋', action: () => setShowMyMatches('mine') },
              { label: 'Intresseanmälningar', sub: 'Inkomna förfrågningar', icon: '📬', action: () => setShowIncoming(true) },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:border-gray-200 transition-colors">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mb-2 text-sm">{item.icon}</div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {pendingBookings.length > 0 && (
          <div className="px-4 mb-4">
            <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-amber-50">
                <span>📬</span>
                <p className="text-sm font-medium text-gray-800">{pendingBookings.length} inkomna intresseanmälningar</p>
              </div>
              {pendingBookings.slice(0, 3).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.teams?.name}{b.teams?.club ? ` · ${b.teams.club}` : ''}</p>
                    <p className="text-xs text-gray-400">
                      {b.activities?.type} · {new Date(b.activities?.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                      {b.activities?.formation ? ` · ${b.activities.formation}` : ''}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">Väntar</span>
                </div>
              ))}
              <button onClick={() => setShowIncoming(true)}
                className="w-full p-3 text-sm text-green-600 font-medium text-center hover:bg-green-50 transition-colors">
                Hantera anmälningar →
              </button>
            </div>
          </div>
        )}

        <div className="px-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-700">Kommande matcher</p>
            <button onClick={() => setShowCalendar(true)} className="text-xs text-green-500">Kalender</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {confirmedMatches.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">Inga kommande bekräftade matcher</p>
            ) : (
              confirmedMatches.slice(0, 4).map(m => {
                const opponent = m.opponent_name
                return (
                  <div key={m.id} onClick={() => setSelectedMatch(m)}
                    className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50">
                    <div className="text-center min-w-8">
                      <p className="text-lg font-medium text-green-500 leading-none">{new Date(m.date).getDate()}</p>
                      <p className="text-xs text-gray-400 uppercase">{new Date(m.date).toLocaleDateString('sv-SE', { month: 'short' })}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">vs {opponent}</p>
                      <p className="text-xs text-gray-400">{m.location} · {m.time?.substring(0, 5)}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">Bokad</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="px-4">
          <button onClick={handleSignOut} className="w-full text-sm text-gray-400 py-2">Logga ut</button>
        </div>
      </div>

      {showProfile && (
        <ProfileView session={session} onBack={() => setShowProfile(false)} />
      )}
      {showCups && (
        <CupsView session={session} onBack={() => setShowCups(false)} />
      )}

      <div className="nav-bar">
        {[
          { id: 'home', label: t.nav.home, icon: '🏠', action: () => {} },
          { id: 'search', label: t.nav.search, icon: '🔍', action: () => setShowFindMatch(true) },
          { id: 'post', label: t.nav.post, icon: '➕', action: () => setShowCreateActivity(true) },
          { id: 'cups', label: 'Cuper', icon: '🏆', action: () => setShowCups(true) },
          { id: 'profile', label: t.nav.profile, icon: '👤', action: () => setShowProfile(true) },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); tab.action() }}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${activeTab === tab.id ? 'text-green-500' : 'text-gray-400'}`}>
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function MatchCard({ match, team, session, onBack, onCancelled }: { match: any, team: any, session: any, onBack: () => void, onCancelled: () => void }) {
  const [showCancel, setShowCancel] = useState(false)
  const isOrganizer = match.role === 'organizer'
  const opponent = match.opponent_name
  const hoursUntil = Math.floor((new Date(match.date).getTime() - Date.now()) / 3600000)
  const isShortNotice = hoursUntil < 48

  if (showCancel) {
    return <CancelMatch match={match} team={team} session={session} isOrganizer={isOrganizer} isShortNotice={isShortNotice}
      onBack={() => setShowCancel(false)} onCancelled={onCancelled} />
  }

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-medium">Matchdetaljer</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600 font-medium">✅ Bekräftad match</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Matchinfo</p>
          <div className="text-xs text-gray-500 space-y-1.5">
            <p>🏆 Motståndare: <strong className="text-gray-700">{opponent}</strong></p>
            <p>📅 {new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} · {match.time?.substring(0, 5)}</p>
            <p>📍 {match.location}{match.kommun ? `, ${match.kommun}` : ''}</p>
            {match.formation && <p>⚽ {match.formation}</p>}
            {match.level && <p>📊 {match.level}</p>}
            {match.duration && <p>⏱ {match.duration}</p>}
            {match.surface && <p>🌱 {match.surface}</p>}
          </div>
        </div>

        {!isOrganizer && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Kontakta arrangören</p>
            <ContactButton activity={match} teamName={team.name} />
          </div>
        )}
        {isOrganizer && (
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
            <p className="text-sm text-gray-600">Motståndarlaget kontaktar dig via <strong>
              {match.contact_method === 'whatsapp' && 'WhatsApp'}
              {match.contact_method === 'phone' && 'telefon'}
              {match.contact_method === 'sms' && 'SMS'}
              {match.contact_method === 'email' && 'email'}
            </strong></p>
          </div>
        )}

        <button onClick={() => setShowCancel(true)}
          className="w-full border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
          Avboka match
        </button>
      </div>
    </div>
  )
}

function CancelMatch({ match, team, session, isOrganizer, isShortNotice, onBack, onCancelled }: {
  match: any, team: any, session: any, isOrganizer: boolean, isShortNotice: boolean, onBack: () => void, onCancelled: () => void
}) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const contactMethodLabel = () => {
    const m = match.contact_method
    if (m === 'whatsapp') return 'WhatsApp'
    if (m === 'phone') return 'telefon'
    if (m === 'sms') return 'SMS'
    if (m === 'email') return 'email'
    return 'er kommunikationskanal'
  }

  const reasons = ['Skada/sjukdom i laget', 'Planproblem', 'Sportsliga skäl', 'Felaktigt datum/tid bokad', 'Annat']

  const handleCancel = async () => {
    const finalReason = reason === 'Annat' ? customReason : reason
    if (!finalReason) { alert('Ange en anledning'); return }
    setLoading(true)

    await supabase.from('bookings').update({ status: 'cancelled', rejection_reason: finalReason }).eq('id', match.id)

    if (isOrganizer) {
      // Notify requester
      const { data: requesterTeam } = await supabase.from('teams').select('owner_id').eq('id', match.team_id).single()
      if (requesterTeam?.owner_id) {
        await supabase.from('notifications').insert({
          user_id: requesterTeam.owner_id, type: 'cancelled',
          message: `${team.name} har avbokat matchen ${match.type} ${new Date(match.date).toLocaleDateString('sv-SE')}. Anledning: ${finalReason}`,
          read: false,
        })
      }
      // Notify organizer about republishing
      await supabase.from('notifications').insert({
        user_id: session.user.id, type: 'republish',
        message: `Din match ${match.type} ${new Date(match.date).toLocaleDateString('sv-SE')} är avbokad. Vill du publicera den igen?`,
        read: false,
      })
    } else {
      // Requester cancels – reopen activity
      await supabase.from('activities').update({ status: 'open' }).eq('id', match.activity_id)
      const { data: organizerTeam } = await supabase.from('teams').select('owner_id').eq('id', match.organizer_team_id).single()
      if (organizerTeam?.owner_id) {
        await supabase.from('notifications').insert({
          user_id: organizerTeam.owner_id, type: 'cancelled',
          message: `${team.name} har avbokat matchen ${match.type} ${new Date(match.date).toLocaleDateString('sv-SE')}. Anledning: ${finalReason}. Matchen är nu öppen igen.`,
          read: false,
        })
      }
    }
    onCancelled()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-red-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-medium">Avboka match</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {isShortNotice && (
          <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '12px', border: '1px solid #fecaca' }}>
            <p className="text-sm font-medium text-red-700">⚠️ Kort varsel</p>
            <p className="text-xs text-red-600 mt-1">Du avbokar med mindre än 48 timmar kvar – detta påverkar motståndarlaget negativt.</p>
          </div>
        )}
        <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '12px', border: '1px solid #fed7aa' }}>
          <p className="text-sm text-amber-800">
            ⚠️ Säkerställ att du kommunicerat med motståndaren via <strong>{contactMethodLabel()}</strong> innan du avbokar.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-1">
          <p className="text-xs text-gray-400">Match som avbokas</p>
          <p className="text-sm font-medium text-gray-800">{match.type} · {new Date(match.date).toLocaleDateString('sv-SE')} · {match.time?.substring(0, 5)}</p>
          <p className="text-xs text-gray-500">{match.location}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Anledning till avbokning *</p>
          {reasons.map(r => (
            <label key={r} className="flex items-center gap-3 cursor-pointer py-1.5">
              <input type="radio" name="cancel-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-red-500" />
              <span className="text-sm text-gray-700">{r}</span>
            </label>
          ))}
          {reason === 'Annat' && (
            <textarea value={customReason} onChange={e => setCustomReason(e.target.value)}
              placeholder="Beskriv anledningen..." rows={3}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400 resize-none" />
          )}
        </div>
        {isOrganizer && (
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
            <p className="text-xs text-gray-600">Du kommer att få en notis med möjlighet att publicera matchen igen efter avbokning.</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onBack} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">Avbryt</button>
          <button onClick={handleCancel} disabled={loading}
            className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
            {loading ? 'Avbokar...' : 'Bekräfta avbokning'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CalendarView({ matches, onBack, onMatchClick }: { matches: any[], onBack: () => void, onMatchClick: (m: any) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December']
  const dayNames = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = lastDay.getDate()

  const matchDates = matches.reduce((acc: Record<string, any[]>, m) => {
    const date = m.date
    if (date) {
      const key = date
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
    }
    return acc
  }, {})

  const today = new Date().toISOString().split('T')[0]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-medium">Kalender</h1>
      </div>

      <div className="bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="text-gray-500 text-lg px-2">‹</button>
          <p className="text-sm font-medium text-gray-800">{monthNames[month]} {year}</p>
          <button onClick={nextMonth} className="text-gray-500 text-lg px-2">›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
          {dayNames.map(d => <p key={d} className="text-center text-xs text-gray-400 py-1">{d}</p>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasMatch = matchDates[dateStr]
            const isToday = dateStr === today
            return (
              <div key={day} onClick={() => hasMatch && onMatchClick(hasMatch[0])}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 2px',
                  borderRadius: '8px', cursor: hasMatch ? 'pointer' : 'default',
                  background: isToday ? '#dcfce7' : hasMatch ? '#f0fdf4' : 'transparent',
                }}>
                <p style={{ fontSize: '13px', fontWeight: isToday ? '500' : '400', color: isToday ? '#15803d' : hasMatch ? '#166534' : '#374151' }}>{day}</p>
                {hasMatch && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', marginTop: '2px' }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <p className="text-xs text-gray-400 px-1">Bekräftade matcher denna månad</p>
        {Object.entries(matchDates)
          .filter(([date]) => date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
          .sort(([a], [b]) => a > b ? 1 : -1)
          .map(([date, ms]) => (ms as any[]).map((m, i) => {
            const opponent = m.opponent_name
            return (
              <div key={`${date}-${i}`} onClick={() => onMatchClick(m)}
                className="bg-white rounded-xl border border-gray-100 p-3 cursor-pointer hover:border-green-200 flex items-center gap-3">
                <div className="text-center min-w-10">
                  <p className="text-lg font-medium text-green-500 leading-none">{new Date(date).getDate()}</p>
                  <p className="text-xs text-gray-400">{new Date(date).toLocaleDateString('sv-SE', { month: 'short' })}</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">vs {opponent}</p>
                  <p className="text-xs text-gray-400">{m.location} · {m.time?.substring(0, 5)}</p>
                </div>
              </div>
            )
          }))}
        {!Object.keys(matchDates).some(d => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) && (
          <p className="text-sm text-gray-400 text-center py-4">Inga matcher denna månad</p>
        )}
      </div>
    </div>
  )
}

function NotificationsView({ notifications, onNotificationClick, onBack }: { notifications: any[], onNotificationClick: (n: any) => void, onBack: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-medium">Notiser</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">🔔</p>
            <p className="text-sm font-medium text-gray-600">Inga olästa notiser</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => onNotificationClick(n)}
              className="flex items-start gap-3 p-4 border-b border-gray-100 cursor-pointer hover:bg-white bg-gray-50">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className="text-xs text-green-500 mt-1">→</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MyMatches({ team, session, initialTab, onBack }: { team: any, session: any, initialTab: string, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState(initialTab === 'confirmed' ? 'confirmed' : 'mine')
  const [myActivities, setMyActivities] = useState<any[]>([])
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [confirmedMatches, setConfirmedMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showOldMine, setShowOldMine] = useState(false)
  const [showOldConfirmed, setShowOldConfirmed] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    // My activities (ads)
    const { data: acts } = await supabase.from('activities')
      .select('*, bookings(id, status, message, rejection_reason, teams(name, age_group))')
      .eq('team_id', team.id).order('date', { ascending: true })
    setMyActivities(acts || [])

    // My pending bookings (sent interest, waiting)
    const { data: books } = await supabase.from('bookings')
      .select('*, activities(*, teams(name, contact_method, contact_phone, contact_email))')
      .eq('team_id', team.id).eq('status', 'pending')
      .order('created_at', { ascending: false })
    setMyBookings(books || [])

    // All confirmed matches
    const { data: asReq } = await supabase.from('bookings')
      .select('*, activities(*, teams(name, contact_method, contact_phone, contact_email))')
      .eq('team_id', team.id).eq('status', 'confirmed')
    const { data: myActs } = await supabase.from('activities').select('id').eq('team_id', team.id)
    const actIds = myActs?.map((a: any) => a.id) || []
    let asOrg: any[] = []
    if (actIds.length > 0) {
      const { data } = await supabase.from('bookings')
        .select('*, activities(*, teams(name)), teams(name, contact_method, contact_phone, contact_email)')
        .in('activity_id', actIds).eq('status', 'confirmed')
      asOrg = (data || []).map((b: any) => ({ ...b, role: 'organizer' }))
    }
    const allConfirmed = [
      ...(asReq || []).map((b: any) => ({ ...b, role: 'requester' })),
      ...asOrg,
    ].sort((a, b) => (a.activities?.date || '') > (b.activities?.date || '') ? 1 : -1)
    setConfirmedMatches(allConfirmed)
    setLoading(false)
  }

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Är du säker?')) return
    await supabase.from('bookings').delete().eq('activity_id', id)
    await supabase.from('activities').delete().eq('id', id)
    setSelectedActivity(null)
    fetchAll()
  }

  const upcomingActs = myActivities.filter(a => a.date >= today)
  const pastActs = myActivities.filter(a => a.date < today)
  const upcomingConfirmed = confirmedMatches.filter(m => (m.activities?.date || '') >= today)
  const pastConfirmed = confirmedMatches.filter(m => (m.activities?.date || '') < today)

  if (selectedMatch) {
    return <MatchCard match={selectedMatch} team={team} session={session}
      onBack={() => { setSelectedMatch(null); fetchAll() }}
      onCancelled={() => { setSelectedMatch(null); fetchAll(); onBack() }} />
  }

  const tabs = [
    { id: 'mine', label: 'Mina annonser' },
    { id: 'bookings', label: 'Mina anmälningar' },
    { id: 'confirmed', label: 'Bekräftade' },
  ]

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-medium">Mina matcher</h1>
      </div>

      <div className="flex bg-white border-b border-gray-100">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? <p className="text-sm text-gray-400 text-center py-8">Laddar...</p> : (

          <>
            {/* MINA ANNONSER */}
            {activeTab === 'mine' && (
              <>
                {upcomingActs.length === 0 && pastActs.length === 0 && (
                  <div className="text-center py-12"><p className="text-2xl mb-2">📋</p><p className="text-sm text-gray-500">Inga annonser</p></div>
                )}
                {upcomingActs.map(a => {
                  const confirmed = a.bookings?.find((b: any) => b.status === 'confirmed')
                  const pending = a.bookings?.filter((b: any) => b.status === 'pending') || []
                  const isExpanded = expandedId === a.id
                  const isBooked = a.status === 'booked'
                  if (isBooked) {
                    return (
                      <div key={a.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{a.type} · {new Date(a.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</p>
                            <p className="text-xs text-gray-400">Bokad med {confirmed?.teams?.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600">Bokad</span>
                            <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-1 border-t border-gray-50 pt-2">
                            <p className="text-xs text-gray-500">📅 {new Date(a.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} · {a.time?.substring(0, 5)}</p>
                            <p className="text-xs text-gray-500">📍 {a.location}{a.kommun ? `, ${a.kommun}` : ''}</p>
                            {a.formation && <p className="text-xs text-gray-500">⚽ {a.formation}</p>}
                            {a.level && <p className="text-xs text-gray-500">📊 {a.level}</p>}
                          </div>
                        )}
                      </div>
                    )
                  }
                  return (
                    <div key={a.id} onClick={() => setSelectedActivity(a)}
                      className="bg-white rounded-xl border border-gray-100 p-3 cursor-pointer hover:border-gray-200">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-gray-800">{a.type}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">Öppen</span>
                      </div>
                      <p className="text-xs text-gray-500">📅 {new Date(a.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })} · {a.time?.substring(0, 5)}</p>
                      <p className="text-xs text-gray-500">📍 {a.location}</p>
                      {pending.length > 0 && <p className="text-xs text-green-600 mt-1">📬 {pending.length} intresseanmälningar</p>}
                    </div>
                  )
                })}
                {pastActs.length > 0 && (
                  <>
                    <button onClick={() => setShowOldMine(!showOldMine)}
                      className="w-full text-xs text-gray-400 py-2 flex items-center justify-center gap-1">
                      {showOldMine ? '▲' : '▼'} Tidigare annonser ({pastActs.length})
                    </button>
                    {showOldMine && pastActs.map(a => (
                      <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-3 opacity-60">
                        <p className="text-sm text-gray-700">{a.type} · {new Date(a.date).toLocaleDateString('sv-SE')}</p>
                        <p className="text-xs text-gray-400">{a.location}</p>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* MINA ANMÄLNINGAR (pending only) */}
            {activeTab === 'bookings' && (
              <>
                {myBookings.length === 0 && (
                  <div className="text-center py-12"><p className="text-2xl mb-2">📩</p><p className="text-sm text-gray-500">Inga väntande anmälningar</p></div>
                )}
                {myBookings.map(b => {
                  const activity = b.activities
                  const isExpanded = expandedId === b.id
                  return (
                    <div key={b.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div onClick={() => setExpandedId(isExpanded ? null : b.id)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{activity?.type} · {new Date(activity?.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-xs text-gray-400">{activity?.teams?.name}{activity?.formation ? ` · ${activity.formation}` : ''}{activity?.level ? ` · ${activity.level}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600">Väntar</span>
                          <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-1 border-t border-gray-50 pt-2">
                          <p className="text-xs text-gray-500">📅 {new Date(activity?.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} · {activity?.time?.substring(0, 5)}</p>
                          <p className="text-xs text-gray-500">📍 {activity?.location}{activity?.kommun ? `, ${activity?.kommun}` : ''}</p>
                          {activity?.formation && <p className="text-xs text-gray-500">⚽ {activity?.formation}</p>}
                          {activity?.level && <p className="text-xs text-gray-500">📊 {activity?.level}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}

            {/* BEKRÄFTADE */}
            {activeTab === 'confirmed' && (
              <>
                {upcomingConfirmed.length === 0 && pastConfirmed.length === 0 && (
                  <div className="text-center py-12"><p className="text-2xl mb-2">✅</p><p className="text-sm text-gray-500">Inga bekräftade matcher</p></div>
                )}
                {upcomingConfirmed.map(m => {
                  const activity = m.activities
                  const isOrganizer = m.role === 'organizer'
                  const opponent = isOrganizer ? m.teams?.name : activity?.teams?.name
                  const isExpanded = expandedId === m.id
                  return (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div onClick={() => setExpandedId(isExpanded ? null : m.id)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-700">vs {opponent}</p>
                          <p className="text-xs text-gray-400">{activity?.type} · {new Date(activity?.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} · {activity?.time?.substring(0, 5)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">Bokad</span>
                          <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-50 pt-2">
                          <p className="text-xs text-gray-500">📅 {new Date(activity?.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} · {activity?.time?.substring(0, 5)}</p>
                          <p className="text-xs text-gray-500">📍 {activity?.location}{activity?.kommun ? `, ${activity?.kommun}` : ''}</p>
                          {activity?.formation && <p className="text-xs text-gray-500">⚽ {activity?.formation}</p>}
                          {!isOrganizer && <ContactButton activity={activity} teamName={team.name} />}
                          {isOrganizer && <p className="text-xs text-gray-400">Motståndaren kontaktar dig via {activity?.contact_method === 'whatsapp' ? 'WhatsApp' : activity?.contact_method}</p>}
                          <button onClick={() => setSelectedMatch(m)}
                            className="w-full border border-red-200 text-red-600 py-2 rounded-xl text-xs font-medium mt-1">
                            Avboka match
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {pastConfirmed.length > 0 && (
                  <>
                    <button onClick={() => setShowOldConfirmed(!showOldConfirmed)}
                      className="w-full text-xs text-gray-400 py-2 flex items-center justify-center gap-1">
                      {showOldConfirmed ? '▲' : '▼'} Tidigare bekräftade ({pastConfirmed.length})
                    </button>
                    {showOldConfirmed && pastConfirmed.map(m => {
                      const activity = m.activities
                      const isOrganizer = m.role === 'organizer'
                      const opponent = isOrganizer ? m.teams?.name : activity?.teams?.name
                      return (
                        <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-3 opacity-60">
                          <p className="text-sm text-gray-700">vs {opponent}</p>
                          <p className="text-xs text-gray-400">{new Date(activity?.date).toLocaleDateString('sv-SE')} · {activity?.location}</p>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {selectedActivity && (
        <ActivityDetail activity={selectedActivity}
          onBack={() => setSelectedActivity(null)}
          onDelete={handleDeleteActivity} />
      )}
    </div>
  )
}

function ActivityDetail({ activity, onBack, onDelete }: { activity: any, onBack: () => void, onDelete: (id: string) => void }) {
  const pending = activity.bookings?.filter((b: any) => b.status === 'pending') || []
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-medium">Annonsdetaljer</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between">
            <p className="text-base font-medium text-gray-800">{activity.type}</p>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">Öppen</span>
          </div>
          <div className="text-xs text-gray-500 space-y-1 pt-1">
            <p>📅 {new Date(activity.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} · {activity.time?.substring(0, 5)}</p>
            <p>📍 {activity.location}{activity.kommun ? `, ${activity.kommun}` : ''}</p>
            {activity.formation && <p>⚽ {activity.formation}</p>}
            {activity.level && <p>📊 {activity.level}</p>}
            {activity.duration && <p>⏱ {activity.duration}</p>}
            {activity.cost > 0 && <p>💰 {activity.cost} kr/lag</p>}
          </div>
        </div>
        {pending.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Intresseanmälningar ({pending.length})</p>
            {pending.map((b: any) => (
              <div key={b.id} className="py-1 border-b border-gray-50 last:border-0">
                <p className="text-xs font-medium text-gray-700">{b.teams?.name}</p>
                {b.message && <p className="text-xs text-gray-400 italic">"{b.message}"</p>}
              </div>
            ))}
          </div>
        )}
        <button onClick={() => onDelete(activity.id)}
          className="w-full border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50">
          Ta bort annons
        </button>
      </div>
    </div>
  )
}

function ContactButton({ activity, teamName }: { activity: any, teamName: string }) {
  const method = activity?.contact_method
  const phone = activity?.contact_phone?.replace(/^0/, '46').replace(/\s/g, '')
  const email = activity?.contact_email
  const msg = encodeURIComponent(`Hej! Vi är ${teamName} och ser fram emot vår match ${new Date(activity?.date).toLocaleDateString('sv-SE')} kl ${activity?.time?.substring(0, 5)} på ${activity?.location}!`)
  if (method === 'whatsapp' && phone) return <a href={`https://wa.me/${phone}?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#25D366', color: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>📱 Kontakta via WhatsApp</a>
  if (method === 'phone' && phone) return <a href={`tel:${activity?.contact_phone}`} style={{ display: 'block', background: '#22c55e', color: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>📞 Ring {activity?.contact_phone}</a>
  if (method === 'sms' && phone) return <a href={`sms:${activity?.contact_phone}`} style={{ display: 'block', background: '#22c55e', color: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>💬 SMS till {activity?.contact_phone}</a>
  if (method === 'email' && email) return <a href={`mailto:${email}`} style={{ display: 'block', background: '#22c55e', color: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>✉️ Mail till {email}</a>
  return null
}

function CreateTeam({ session, onCreated }: { session: any, onCreated: () => void }) {
  const t = useLanguage()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', club: '', lan: 'Stockholm', kommun: '', age_group: '', gender: '', formation: '', levels: [] as string[] })
  const stockholmKommuner = ['Botkyrka', 'Danderyd', 'Ekerö', 'Haninge', 'Huddinge', 'Järfälla', 'Lidingö', 'Nacka', 'Norrtälje', 'Nykvarn', 'Nynäshamn', 'Salem', 'Sigtuna', 'Sollentuna', 'Solna', 'Stockholm', 'Sundbyberg', 'Södertälje', 'Tyresö', 'Täby', 'Upplands-Bro', 'Upplands Väsby', 'Vallentuna', 'Vaxholm', 'Värmdö', 'Österåker']
  const allAgeGroups: Record<string, string[]> = { 'Pojkar': ['P2009', 'P2010', 'P2011', 'P2012', 'P2013', 'P2014', 'P2015', 'P2016', 'P2017', 'P2018'], 'Flickor': ['F2009', 'F2010', 'F2011', 'F2012', 'F2013', 'F2014', 'F2015', 'F2016', 'F2017', 'F2018'], 'Blandat': ['P2009', 'P2010', 'P2011', 'P2012', 'P2013', 'P2014', 'P2015', 'P2016', 'P2017', 'P2018', 'F2009', 'F2010', 'F2011', 'F2012', 'F2013', 'F2014', 'F2015', 'F2016', 'F2017', 'F2018'] }
  const ageGroups = form.gender ? allAgeGroups[form.gender] : []
  const levels = ['Lätt', 'Lätt+', 'Medel-', 'Medel', 'Medel+', 'Svår', 'Svår+']
  const formations = ['5v5', '7v7', '9v9', '11v11']
  const genders = ['Pojkar', 'Flickor', 'Blandat']
  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value, ...(key === 'gender' ? { age_group: '' } : {}) }))
  const toggleLevel = (level: string) => setForm(prev => ({ ...prev, levels: prev.levels.includes(level) ? prev.levels.filter(l => l !== level) : [...prev.levels, level] }))
  const handleSave = async () => {
    if (!form.name || !form.kommun || !form.age_group || !form.gender || !form.formation || form.levels.length === 0) { alert('Fyll i alla fält'); return }
    setLoading(true)
    const { error } = await supabase.from('teams').insert({ owner_id: session.user.id, name: form.name, club: form.club, region: `${form.lan} – ${form.kommun}`, age_group: form.age_group, gender: form.gender, formation: form.formation, level: form.levels.join(', ') })
    if (error) alert(error.message)
    else onCreated()
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5"><h1 className="text-white text-xl font-medium">Skapa lag</h1></div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        {[{ label: 'Lagnamn', key: 'name', ph: 't.ex. AIK P15' }, { label: 'Klubb', key: 'club', ph: 't.ex. AIK' }].map(f => (
          <div key={f.key}><label className="text-sm text-gray-500 mb-1 block">{f.label}</label>
            <input type="text" placeholder={f.ph} value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>
        ))}
        <div><label className="text-sm text-gray-500 mb-1 block">Län</label><select value={form.lan} onChange={e => update('lan', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="Stockholm">Stockholms län</option></select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Kommun</label><select value={form.kommun} onChange={e => update('kommun', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj kommun</option>{stockholmKommuner.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Kön</label><select value={form.gender} onChange={e => update('gender', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj kön</option>{genders.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Åldersgrupp</label><select value={form.age_group} onChange={e => update('age_group', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj åldersgrupp</option>{ageGroups.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Uppställning</label><select value={form.formation} onChange={e => update('formation', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj uppställning</option>{formations.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Nivå (välj en eller flera)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{levels.map(l => <button key={l} type="button" onClick={() => toggleLevel(l)} style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid', borderColor: form.levels.includes(l) ? '#22c55e' : '#e5e7eb', backgroundColor: form.levels.includes(l) ? '#22c55e' : 'white', color: form.levels.includes(l) ? 'white' : '#4b5563', cursor: 'pointer', fontSize: '14px' }}>{l}</button>)}</div></div>
        <button onClick={handleSave} disabled={loading} className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">{loading ? t.common.loading : t.common.save}</button>
      </div>
    </div>
  )
}

function CreateActivity({ team, onCreated, onBack }: { team: any, onCreated: () => void, onBack: () => void }) {
  const t = useLanguage()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<Record<string, any[]>>({})
  const [form, setForm] = useState({ type: '', hour: '10', minute: '00', date: '', location: '', kommun: '', formation: '', duration: '', customPeriods: '2', customMinutes: '20', levels: [] as string[], surface: '', referee_available: false, opponent_referee: false, parent_referee_ok: false, cost: '', contact_phone: '', contact_email: '', contact_method: 'whatsapp' })
  const hours = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']
  const stockholmKommuner = ['Botkyrka', 'Danderyd', 'Ekerö', 'Haninge', 'Huddinge', 'Järfälla', 'Lidingö', 'Nacka', 'Norrtälje', 'Nykvarn', 'Nynäshamn', 'Salem', 'Sigtuna', 'Sollentuna', 'Solna', 'Stockholm', 'Sundbyberg', 'Södertälje', 'Tyresö', 'Täby', 'Upplands-Bro', 'Upplands Väsby', 'Vallentuna', 'Vaxholm', 'Värmdö', 'Österåker']
  useEffect(() => { fetchConfig() }, [])
  const fetchConfig = async () => {
    const { data } = await supabase.from('config').select('*').eq('active', true).order('sort_order')
    if (data) { const grouped = data.reduce((acc: Record<string, any[]>, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {}); setConfig(grouped) }
  }
  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))
  const toggleLevel = (level: string) => setForm(prev => ({ ...prev, levels: prev.levels.includes(level) ? prev.levels.filter(l => l !== level) : [...prev.levels, level] }))
  const handleSave = async () => {
    if (!form.type || !form.date || !form.location || !form.formation || !form.kommun) { alert('Fyll i alla obligatoriska fält'); return }
    if (!form.contact_phone && !form.contact_email) { alert('Ange minst ett kontaktalternativ'); return }
    const time = `${form.hour}:${form.minute}`
    const duration = form.duration === 'custom' ? `${form.customPeriods}×${form.customMinutes} min` : form.duration
    const selectedType = (config.activity_type || []).find((c: any) => c.value === form.type)
    const typeLabel = selectedType ? selectedType.label : form.type
    setLoading(true)
    const { error } = await supabase.from('activities').insert({ team_id: team.id, type: typeLabel, date: form.date, time, location: form.location, kommun: form.kommun, formation: form.formation, duration, level: form.levels.join(', '), surface: form.surface, gender: team.gender, age_group: team.age_group, referee_available: form.referee_available, referee_needed: form.opponent_referee, cost: form.cost ? parseInt(form.cost) : 0, status: 'open', contact_phone: form.contact_phone, contact_email: form.contact_email, contact_method: form.contact_method })
    if (error) alert(error.message)
    else onCreated()
    setLoading(false)
  }
  const levels = (config.level || []).map((c: any) => c.label)
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <div><h1 className="text-white text-xl font-medium">Lägg upp aktivitet</h1><p className="text-green-100 text-sm">{team?.name}</p></div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        <div><label className="text-sm text-gray-500 mb-1 block">Typ av aktivitet *</label><select value={form.type} onChange={e => update('type', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj typ</option>{(config.activity_type || []).filter((c: any) => !['Cup','Läger','Turnering','Matchcamp'].includes(c.label)).map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Datum *</label><input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Tid *</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={form.hour} onChange={e => update('hour', e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
            <span className="text-gray-400 font-medium">:</span>
            <select value={form.minute} onChange={e => update('minute', e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
          </div></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Plats *</label><input type="text" placeholder="t.ex. Grimsta IP" value={form.location} onChange={e => update('location', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Kommun *</label><select value={form.kommun} onChange={e => update('kommun', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj kommun</option>{stockholmKommuner.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Uppställning *</label><select value={form.formation} onChange={e => update('formation', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj uppställning</option>{(config.formation || []).map((c: any) => <option key={c.value} value={c.label}>{c.label}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Matchlängd</label><select value={form.duration} onChange={e => update('duration', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj matchlängd</option>{(config.duration || []).map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}<option value="custom">Anpassat</option></select>
          {form.duration === 'custom' && <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}><select value={form.customPeriods} onChange={e => update('customPeriods', e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">{['1', '2', '3', '4'].map(p => <option key={p} value={p}>{p} perioder</option>)}</select><span className="text-gray-400 text-sm">×</span><select value={form.customMinutes} onChange={e => update('customMinutes', e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">{['10', '15', '20', '25', '30', '35', '40', '45'].map(m => <option key={m} value={m}>{m} min</option>)}</select></div>}</div>
        <div><label className="text-sm text-gray-500 mb-1 block">Underlag</label><select value={form.surface} onChange={e => update('surface', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Välj underlag</option>{(config.surface || []).map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Nivå (välj en eller flera)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{levels.map((l: string) => <button key={l} type="button" onClick={() => toggleLevel(l)} style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid', borderColor: form.levels.includes(l) ? '#22c55e' : '#e5e7eb', backgroundColor: form.levels.includes(l) ? '#22c55e' : 'white', color: form.levels.includes(l) ? 'white' : '#4b5563', cursor: 'pointer', fontSize: '14px' }}>{l}</button>)}</div></div>
        <div><label className="text-sm text-gray-500 mb-1 block">Eventuell kostnad (kr/lag)</label><input type="number" placeholder="Lämna tomt om gratis" value={form.cost} onChange={e => update('cost', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>
        <div><label className="text-sm text-gray-500 mb-2 block">Domare</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.referee_available} onChange={e => update('referee_available', e.target.checked)} className="w-4 h-4 accent-green-500" /><span className="text-sm text-gray-700">Domare finns</span></label>
            <div><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.opponent_referee} onChange={e => update('opponent_referee', e.target.checked)} className="w-4 h-4 accent-green-500" /><span className="text-sm text-gray-700">Motståndare fixar domare</span></label>
              {form.opponent_referee && <label className="flex items-center gap-3 cursor-pointer mt-2 ml-7"><input type="checkbox" checked={form.parent_referee_ok} onChange={e => update('parent_referee_ok', e.target.checked)} className="w-4 h-4 accent-green-500" /><span className="text-sm text-gray-400">Förälder/ledare funkar</span></label>}</div>
          </div></div>
        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
          <label className="text-sm font-medium text-gray-700 mb-3 block">Kontaktinformation</label>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Hur vill du bli kontaktad? *</label>
              <select value={form.contact_method} onChange={e => update('contact_method', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="whatsapp">WhatsApp</option><option value="phone">Telefon (samtal)</option><option value="sms">SMS</option><option value="email">Email</option></select></div>
            {(form.contact_method === 'whatsapp' || form.contact_method === 'phone' || form.contact_method === 'sms') && <div><label className="text-xs text-gray-500 mb-1 block">Telefonnummer *</label><input type="tel" placeholder="t.ex. 0701234567" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>}
            {form.contact_method === 'email' && <div><label className="text-xs text-gray-500 mb-1 block">Email *</label><input type="email" placeholder="din@email.com" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>}
            <p className="text-xs text-gray-400">Kontaktinfo visas bara när en match är bekräftad</p>
          </div></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onBack} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Avbryt</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">{loading ? t.common.loading : 'Publicera'}</button>
        </div>
      </div>
    </div>
  )
}

function FindMatch({ team, session, onBack }: { team: any, session: any, onBack: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<Record<string, any[]>>({})
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [selectedCup, setSelectedCup] = useState<any>(null)
  const [filters, setFilters] = useState({ type: '', formation: '', level: '', kommun: '', dateFrom: '', dateTo: '' })
  const [saveWatch, setSaveWatch] = useState(false)
  const [watchName, setWatchName] = useState('')
  const [watchLevels, setWatchLevels] = useState<string[]>([])
  const stockholmKommuner = ['Botkyrka', 'Danderyd', 'Ekerö', 'Haninge', 'Huddinge', 'Järfälla', 'Lidingö', 'Nacka', 'Norrtälje', 'Nykvarn', 'Nynäshamn', 'Salem', 'Sigtuna', 'Sollentuna', 'Solna', 'Stockholm', 'Sundbyberg', 'Södertälje', 'Tyresö', 'Täby', 'Upplands-Bro', 'Upplands Väsby', 'Vallentuna', 'Vaxholm', 'Värmdö', 'Österåker']
  useEffect(() => { fetchConfig(); fetchAll() }, [])
  useEffect(() => { fetchAll() }, [filters])
  const fetchConfig = async () => {
    const { data } = await supabase.from('config').select('*').eq('active', true).order('sort_order')
    if (data) { const grouped = data.reduce((acc: Record<string, any[]>, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {}); setConfig(grouped) }
  }
  const fetchAll = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Activities
    const { data: existingBookings } = await supabase.from('bookings').select('activity_id').eq('team_id', team.id).in('status', ['pending', 'confirmed'])
    const bookedIds = existingBookings?.map((b: any) => b.activity_id) || []
    let actQuery = supabase.from('activities').select('*, teams(name, club, owner_id)').eq('status', 'open').neq('team_id', team.id).not('type', 'in', '("Cup","Läger","Turnering","Matchcamp")').gte('date', filters.dateFrom || today).lte('date', filters.dateTo || '2099-12-31').order('date', { ascending: true })
    if (filters.type) actQuery = actQuery.eq('type', filters.type)
    if (filters.formation) actQuery = actQuery.eq('formation', filters.formation)
    if (filters.level) actQuery = actQuery.ilike('level', `%${filters.level}%`)
    if (filters.kommun) actQuery = actQuery.eq('kommun', filters.kommun)
    const { data: actData } = await actQuery

    // Cups — skipped when an activity-type filter is active (types are different categories)
    let cupsData: any[] = []
    if (!filters.type) {
      let cupQuery = supabase.from('cups').select('*, teams(name)').eq('status', 'active').gte('date_to', filters.dateFrom || today)
      if (filters.dateTo) cupQuery = cupQuery.lte('date_from', filters.dateTo)
      if (filters.formation) cupQuery = cupQuery.contains('formations', [filters.formation])
      if (filters.level) cupQuery = cupQuery.contains('levels', [filters.level])
      if (filters.kommun) cupQuery = cupQuery.eq('kommun', filters.kommun)
      const { data: rawCups } = await cupQuery
      cupsData = rawCups ?? []
    }

    const activities = (actData ?? []).map((a: any) => ({ ...a, _type: 'activity', alreadyApplied: bookedIds.includes(a.id) }))
    const cups = cupsData.map((c: any) => ({ ...c, _type: 'cup' }))
    const merged = [...activities, ...cups].sort((a, b) => {
      const da = a._type === 'cup' ? a.date_from : a.date
      const db = b._type === 'cup' ? b.date_from : b.date
      return da.localeCompare(db)
    })
    setItems(merged)
    setLoading(false)
  }
  const updateFilter = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value }))

  if (selectedCup) return <CupDetail cup={selectedCup} session={session} onBack={() => setSelectedCup(null)} onDeleted={() => setSelectedCup(null)} />

  if (selectedActivity) return <InterestForm activity={selectedActivity} team={team} onBack={() => setSelectedActivity(null)} onSent={() => { setSelectedActivity(null); fetchAll() }} />

  if (saveWatch) {
    return (
      <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
        <div className="bg-green-500 p-5 flex items-center gap-3">
          <button onClick={() => setSaveWatch(false)} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-medium">Spara bevakning</h1>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
            <p className="text-xs text-gray-600">Dina nuvarande filter sparas och du får ett mail när en ny match matchar.</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Namn på bevakning *</label>
            <input type="text" placeholder="t.ex. P15 7v7 Stockholm" value={watchName}
              onChange={e => setWatchName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
            <p className="text-xs text-gray-500 font-medium mb-2">Aktiva filter:</p>
            {filters.type && <p className="text-xs text-gray-600">Typ: {filters.type}</p>}
            {filters.formation && <p className="text-xs text-gray-600">Uppställning: {filters.formation}</p>}
            {filters.kommun && <p className="text-xs text-gray-600">Kommun: {filters.kommun}</p>}
            {watchLevels.length > 0 && <p className="text-xs text-gray-600">Nivå: {watchLevels.join(', ')}</p>}
            {!filters.type && !filters.formation && !filters.kommun && watchLevels.length === 0 && (
              <p className="text-xs text-gray-400">Inga filter – bevakar alla matcher</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Nivå (valfritt, välj flera)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(config.level || []).map((c: any) => (
                <button key={c.value} type="button"
                  onClick={() => setWatchLevels(prev => prev.includes(c.label) ? prev.filter(l => l !== c.label) : [...prev, c.label])}
                  style={{
                    padding: '8px 12px', borderRadius: '12px', border: '1px solid',
                    borderColor: watchLevels.includes(c.label) ? '#22c55e' : '#e5e7eb',
                    backgroundColor: watchLevels.includes(c.label) ? '#22c55e' : 'white',
                    color: watchLevels.includes(c.label) ? 'white' : '#4b5563',
                    cursor: 'pointer', fontSize: '14px',
                  }}>{c.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setSaveWatch(false)}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium">Avbryt</button>
            <button onClick={async () => {
              if (!watchName) { alert('Ange ett namn'); return }
              const { error } = await supabase.from('watches').insert({
                user_id: session.user.id,
                team_id: team.id,
                name: watchName,
                filter_type: filters.type || null,
                filter_formation: filters.formation || null,
                filter_levels: watchLevels.length > 0 ? watchLevels.join(', ') : null,
                filter_kommun: filters.kommun || null,
              })
              if (error) { alert('Kunde inte spara: ' + error.message); return }
              setSaveWatch(false)
              setWatchName('')
              setWatchLevels([])
              alert('Bevakning sparad!')
            }}
              className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600">
              Spara
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <div><h1 className="text-white text-xl font-medium">Hitta träningsmatch</h1><p className="text-green-100 text-sm">{items.length} träffar</p></div>
      </div>
      <div className="bg-white border-b border-gray-100 p-3 space-y-2">
        <div className="grid-2">
          <select value={filters.type} onChange={e => updateFilter('type', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Alla typer</option>{(config.activity_type || []).filter((c: any) => !['Cup','Läger','Turnering','Matchcamp'].includes(c.label)).map((c: any) => <option key={c.value} value={c.label}>{c.label}</option>)}</select>
          <select value={filters.formation} onChange={e => updateFilter('formation', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Alla uppställningar</option>{(config.formation || []).map((c: any) => <option key={c.value} value={c.label}>{c.label}</option>)}</select>
        </div>
        <div className="grid-2">
          <select value={filters.level} onChange={e => updateFilter('level', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Alla nivåer</option>{(config.level || []).map((c: any) => <option key={c.value} value={c.label}>{c.label}</option>)}</select>
          <select value={filters.kommun} onChange={e => updateFilter('kommun', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"><option value="">Alla kommuner</option>{stockholmKommuner.map(k => <option key={k} value={k}>{k}</option>)}</select>
        </div>
        <div className="grid-2">
          <div><label className="text-xs text-gray-400 mb-1 block">Från datum</label><input type="date" value={filters.dateFrom} onChange={e => updateFilter('dateFrom', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Till datum</label><input type="date" value={filters.dateTo} onChange={e => updateFilter('dateTo', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" /></div>
        </div>
        <div className="flex justify-end">
          <button onClick={() => { setWatchLevels(filters.level ? [filters.level] : []); setSaveWatch(true) }} className="text-xs text-green-600 font-medium">🔔 Spara som bevakning</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? <p className="text-sm text-gray-400 text-center py-8">Laddar...</p> : items.length === 0 ? (
          <div className="text-center py-12"><p className="text-2xl mb-2">🔍</p><p className="text-sm font-medium text-gray-600">Inga träffar hittades</p></div>
        ) : items.map(a => a._type === 'cup' ? (
          <div key={`cup-${a.id}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-amber-200 transition-colors" onClick={() => setSelectedCup(a)}>
            {a.image_url && <img src={a.image_url} alt={a.name} style={{ width: '100%', display: 'block', maxHeight: '120px', objectFit: 'cover' }} />}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div><p className="text-sm font-medium text-gray-800">{a.name}</p><p className="text-xs text-gray-400">{a.teams?.name}</p></div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">🏆 {a.type}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500"><span>📅</span><span>{new Date(a.date_from).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}{a.date_from !== a.date_to ? ` – ${new Date(a.date_to).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}` : ''}</span></div>
                {(a.locations?.length > 0 || a.kommun) && <div className="flex items-center gap-2 text-xs text-gray-500"><span>📍</span><span>{a.locations?.[0]}{a.kommun ? `, ${a.kommun}` : ''}</span></div>}
                <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                  {a.formations?.length > 0 && <span>⚽ {a.formations.join(', ')}</span>}
                  {a.levels?.length > 0 && <span>📊 {a.levels.join(', ')}</span>}
                </div>
                {a.price > 0 && <div className="text-xs text-amber-600">💰 {a.price} kr {a.price_type === 'Per lag' ? '/lag' : '/spelare'}</div>}
              </div>
            </div>
          </div>
        ) : (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex justify-between items-start mb-2">
              <div><p className="text-sm font-medium text-gray-800">{a.type}</p><p className="text-xs text-gray-400">{a.teams?.name}</p></div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">Öppen</span>
            </div>
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-500"><span>📅</span><span>{new Date(a.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })} · {a.time?.substring(0, 5)}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><span>📍</span><span>{a.location}{a.kommun ? `, ${a.kommun}` : ''}</span></div>
              <div className="flex gap-3 text-xs text-gray-500">{a.formation && <span>⚽ {a.formation}</span>}{a.level && <span>📊 {a.level}</span>}{a.duration && <span>⏱ {a.duration}</span>}</div>
              {a.cost > 0 && <div className="text-xs text-amber-600">💰 {a.cost} kr/lag</div>}
            </div>
            {a.alreadyApplied ? (
              <div className="w-full bg-gray-100 text-gray-500 py-2 rounded-xl text-sm font-medium text-center">✓ Anmälan skickad</div>
            ) : (
              <button onClick={() => setSelectedActivity(a)} className="w-full bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">Anmäl intresse</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function InterestForm({ activity, team, onBack, onSent }: { activity: any, team: any, onBack: () => void, onSent: () => void }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSend = async () => {
    setLoading(true)
    const { data: teamData } = await supabase.from('teams').select('owner_id').eq('id', activity.team_id).single()
    const { error } = await supabase.from('bookings').insert({ activity_id: activity.id, team_id: team.id, status: 'pending', message })
    if (error) { alert(error.message) }
    else if (teamData?.owner_id) {
      await supabase.from('notifications').insert({ user_id: teamData.owner_id, type: 'interest', message: `${team.name} är intresserade av din ${activity.type} ${new Date(activity.date).toLocaleDateString('sv-SE')}`, read: false })
      alert('Intresseanmälan skickad!')
      onSent()
    } else { alert('Intresseanmälan skickad!'); onSent() }
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <div><h1 className="text-white text-xl font-medium">Anmäl intresse</h1><p className="text-green-100 text-sm">{activity.teams?.name}</p></div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <p className="text-sm font-medium text-gray-800">{activity.type}</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>📅 {new Date(activity.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} · {activity.time?.substring(0, 5)}</p>
            <p>📍 {activity.location}{activity.kommun ? `, ${activity.kommun}` : ''}</p>
            {activity.formation && <p>⚽ {activity.formation}</p>}
          </div>
        </div>
        <div><label className="text-sm text-gray-500 mb-1 block">Meddelande (valfritt)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Presentera ert lag..." rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 resize-none" /></div>
        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
          <p className="text-xs text-gray-600"><strong>Ditt lag:</strong> {team.name} · {team.age_group} · {team.formation}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onBack} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Avbryt</button>
          <button onClick={handleSend} disabled={loading} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">{loading ? 'Skickar...' : 'Skicka intresseanmälan'}</button>
        </div>
      </div>
    </div>
  )
}

function IncomingRequests({ team, onBack, onConfirmed }: { team: any, onBack: () => void, onConfirmed?: () => void }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [showConfirmed, setShowConfirmed] = useState<any>(null)
  useEffect(() => { fetchBookings() }, [])
  const fetchBookings = async () => {
    setLoading(true)
    const { data: myActivities } = await supabase.from('activities').select('id').eq('team_id', team.id)
    const activityIds = myActivities?.map((a: any) => a.id) || []
    if (activityIds.length === 0) { setBookings([]); setLoading(false); return }
    const { data } = await supabase.from('bookings').select('*, teams(name, club, age_group, formation, level, owner_id), activities(type, date, time, location, formation, level, contact_method, contact_phone, contact_email)').eq('status', 'pending').in('activity_id', activityIds).order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }
  if (showConfirmed) return <ConfirmedScreen booking={showConfirmed} isRequester={false} onBack={onBack} />
  if (selectedBooking) return <RespondToBooking booking={selectedBooking} team={team} onBack={() => setSelectedBooking(null)} onResponded={(confirmed: any) => { setSelectedBooking(null); if (confirmed) { setShowConfirmed(confirmed); onConfirmed?.() } else fetchBookings() }} />
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <div><h1 className="text-white text-xl font-medium">Intresseanmälningar</h1><p className="text-green-100 text-sm">{bookings.length} inkomna</p></div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? <p className="text-sm text-gray-400 text-center py-8">Laddar...</p> : bookings.length === 0 ? (
          <div className="text-center py-12"><p className="text-2xl mb-2">📬</p><p className="text-sm font-medium text-gray-600">Inga intresseanmälningar än</p></div>
        ) : bookings.map(b => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{b.teams?.name}{b.teams?.club ? ` · ${b.teams.club}` : ''}</p>
                <p className="text-xs text-gray-400">{b.teams?.age_group}{b.teams?.formation ? ` · ${b.teams.formation}` : ''}{b.teams?.level ? ` · ${b.teams.level}` : ''}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">Väntar</span>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              <p>📅 {b.activities?.type} · {new Date(b.activities?.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })} · {b.activities?.time?.substring(0, 5)}</p>
              {b.activities?.formation && <p>⚽ {b.activities.formation}{b.activities?.level ? ` · ${b.activities.level}` : ''}</p>}
              <p>📍 {b.activities?.location}</p>
              {b.message && <p className="mt-1 italic">"{b.message}"</p>}
            </div>
            <button onClick={() => setSelectedBooking(b)} className="w-full bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">Svara</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function RespondToBooking({ booking, team, onBack, onResponded }: { booking: any, team: any, onBack: () => void, onResponded: (confirmed: any) => void }) {
  const [action, setAction] = useState<'accept' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const rejectionReasons = ['Vi har redan hittat motståndare', 'Nivån passar inte', 'Datumet passar inte längre', 'För långt avstånd', 'Annat']
  const getContactMethodLabel = () => { const m = booking.activities?.contact_method; if (m === 'whatsapp') return 'WhatsApp'; if (m === 'phone') return 'telefon'; if (m === 'sms') return 'SMS'; if (m === 'email') return 'email'; return 'den angivna kontaktmetoden' }
  const handleAccept = async () => {
    setLoading(true)
    await supabase.from('bookings').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', booking.id)
    await supabase.from('activities').update({ status: 'booked' }).eq('id', booking.activity_id)
    const { data: activityData } = await supabase.from('activities').select('*, teams(name)').eq('id', booking.activity_id).single()
    const { data: otherBookings } = await supabase.from('bookings').select('*, teams(owner_id, name)').eq('activity_id', booking.activity_id).eq('status', 'pending').neq('id', booking.id)
    if (otherBookings && otherBookings.length > 0) {
      for (const other of otherBookings) {
        await supabase.from('bookings').update({ status: 'rejected', rejection_reason: 'Vi har redan hittat motståndare' }).eq('id', other.id)
        if (other.teams?.owner_id) await supabase.from('notifications').insert({ user_id: other.teams.owner_id, type: 'rejected', message: `Tyvärr har ${team.name} redan hittat en motståndare för ${activityData?.type} ${new Date(activityData?.date).toLocaleDateString('sv-SE')}`, read: false })
      }
    }
    const { data: bookerTeam } = await supabase.from('teams').select('owner_id').eq('id', booking.team_id).single()
    if (bookerTeam?.owner_id) await supabase.from('notifications').insert({ user_id: bookerTeam.owner_id, type: 'accepted', message: `${team.name} har bekräftat matchen! ${activityData?.type} ${new Date(activityData?.date).toLocaleDateString('sv-SE')} kl ${activityData?.time?.substring(0, 5)} på ${activityData?.location}`, read: false })
    onResponded({ booking, activity: activityData })
    setLoading(false)
  }
  const handleReject = async () => {
    const reason = rejectionReason === 'Annat' ? customReason : rejectionReason
    if (!reason) { alert('Ange en anledning'); return }
    setLoading(true)
    await supabase.from('bookings').update({ status: 'rejected', rejection_reason: reason }).eq('id', booking.id)
    const { data: bookerTeam } = await supabase.from('teams').select('owner_id').eq('id', booking.team_id).single()
    if (bookerTeam?.owner_id) await supabase.from('notifications').insert({ user_id: bookerTeam.owner_id, type: 'rejected', message: `${team.name} har tyvärr avvisat er intresseanmälan. Anledning: ${reason}`, read: false })
    onResponded(null)
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <div><h1 className="text-white text-xl font-medium">Svara på förfrågan</h1><p className="text-green-100 text-sm">{booking.teams?.name}</p></div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <p className="text-sm font-medium text-gray-800">{booking.teams?.name}</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>🏆 {booking.teams?.age_group} · {booking.teams?.formation}</p>
            <p>📅 {booking.activities?.type} · {new Date(booking.activities?.date).toLocaleDateString('sv-SE')} · {booking.activities?.time?.substring(0, 5)}</p>
            {booking.message && <p className="mt-2 italic text-gray-600">"{booking.message}"</p>}
          </div>
        </div>
        {!action && <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setAction('reject')} className="flex-1 border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">Avvisa</button>
          <button onClick={() => setAction('accept')} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">Acceptera</button>
        </div>}
        {action === 'reject' && <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Välj anledning *</p>
          {rejectionReasons.map(r => <label key={r} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="reason" value={r} checked={rejectionReason === r} onChange={() => setRejectionReason(r)} className="accent-green-500" /><span className="text-sm text-gray-700">{r}</span></label>)}
          {rejectionReason === 'Annat' && <textarea value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Beskriv anledningen..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 resize-none" />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setAction(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium">Tillbaka</button>
            <button onClick={handleReject} disabled={loading} className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">{loading ? 'Skickar...' : 'Skicka avvisning'}</button>
          </div>
        </div>}
        {action === 'accept' && <div className="space-y-3">
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
            <p className="text-sm text-gray-700">När du bekräftar matchen kommer du att be motståndaren att kontakta dig via <strong>{getContactMethodLabel()}</strong>.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setAction(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium">Tillbaka</button>
            <button onClick={handleAccept} disabled={loading} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">{loading ? 'Bekräftar...' : 'Bekräfta match!'}</button>
          </div>
        </div>}
      </div>
    </div>
  )
}

function ConfirmedScreen({ booking, isRequester, onBack }: { booking: any, isRequester: boolean, onBack: () => void }) {
  const activity = booking.activity || booking.activities
  const contactMethod = activity?.contact_method
  const opponentName = isRequester ? activity?.teams?.name : booking.booking?.teams?.name || booking.teams?.name
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5"><h1 className="text-white text-xl font-medium">Match bekräftad! 🎉</h1></div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '28px' }}>✅</div>
          <p className="text-lg font-medium text-gray-800">Matchen är bekräftad!</p>
          <p className="text-sm text-gray-500 mt-1">{isRequester ? 'Kontakta motståndarlaget för att stämma av detaljer' : 'Vänta på att motståndarlaget kontaktar dig'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Matchinfo</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>📅 {new Date(activity?.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} · {activity?.time?.substring(0, 5)}</p>
            <p>📍 {activity?.location}{activity?.kommun ? `, ${activity?.kommun}` : ''}</p>
            {activity?.formation && <p>⚽ {activity?.formation}</p>}
            <p>🏆 Motståndare: {opponentName}</p>
          </div>
        </div>
        {isRequester && activity && <div className="space-y-2"><p className="text-sm font-medium text-gray-700">Nästa steg</p><ContactButton activity={activity} teamName={opponentName || 'ditt lag'} /></div>}
        {!isRequester && <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
          <p className="text-sm text-gray-600">Motståndarlaget kommer att kontakta dig via <strong>{contactMethod === 'whatsapp' ? 'WhatsApp' : contactMethod === 'phone' ? 'telefon' : contactMethod === 'sms' ? 'SMS' : 'email'}</strong> för att stämma av detaljer.</p>
        </div>}
        <button onClick={onBack} className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Tillbaka till startsidan</button>
      </div>
    </div>
  )
}

function ProfileView({ session, onBack }: { session: any, onBack: () => void }) {
  const [profile, setProfile] = useState<any>({})
  const [watches, setWatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProfile(); fetchWatches() }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data || {})
    setLoading(false)
  }

  const fetchWatches = async () => {
    const { data } = await supabase.from('watches').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setWatches(data || [])
  }

  const saveProfile = async () => {
    setSaving(true)
    await supabase.from('profiles').upsert({ id: session.user.id, ...profile })
    setSaving(false)
    alert('Sparat!')
  }

  const deleteWatch = async (id: string) => {
    if (!confirm('Ta bort bevakningen?')) return
    await supabase.from('watches').delete().eq('id', id)
    fetchWatches()
  }

  const toggle = (key: string) => setProfile((prev: any) => ({ ...prev, [key]: !prev[key] }))

  const notifySettings = [
    { key: 'notify_interest', label: 'Ny intresseanmälan på min annons' },
    { key: 'notify_accepted', label: 'Min anmälan bekräftad' },
    { key: 'notify_rejected', label: 'Min anmälan avvisad' },
    { key: 'notify_cancelled', label: 'Match avbokad' },
    { key: 'notify_watch', label: 'Ny match matchar min bevakning' },
  ]

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-medium">Profil</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Laddar...</p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">

          {/* Kontaktinfo */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Min profil</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <p className="text-sm text-gray-400 px-4 py-3 bg-gray-50 rounded-xl">{session.user.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Namn</label>
              <input type="text" placeholder="Ditt namn" value={profile.full_name || ''}
                onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Telefonnummer</label>
              <input type="tel" placeholder="t.ex. 0701234567" value={profile.phone || ''}
                onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
              {saving ? 'Sparar...' : 'Spara'}
            </button>
          </div>

          {/* Notifieringsinställningar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Email-notifieringar</p>
            {notifySettings.map(s => (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.label}</span>
                <button onClick={() => toggle(s.key)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: profile[s.key] !== false ? '#22c55e' : '#e5e7eb',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                  <span style={{
                    position: 'absolute', top: '2px',
                    left: profile[s.key] !== false ? '22px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'white', transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            ))}
            <button onClick={saveProfile} disabled={saving}
              className="w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              {saving ? 'Sparar...' : 'Spara inställningar'}
            </button>
          </div>

          {/* Bevakningar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Bevakningar</p>
              <p className="text-xs text-gray-400">Skapa i "Hitta match"</p>
            </div>
            {watches.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">Inga bevakningar än</p>
            ) : (
              watches.map(w => (
                <div key={w.id} className="flex items-start justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{w.name}</p>
                    <p className="text-xs text-gray-400">
                      {[w.filter_type, w.filter_formation, w.filter_levels, w.filter_kommun].filter(Boolean).join(' · ') || 'Alla matcher'}
                    </p>
                  </div>
                  <button onClick={() => deleteWatch(w.id)} className="text-xs text-red-400 ml-2 flex-shrink-0">Ta bort</button>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default App
