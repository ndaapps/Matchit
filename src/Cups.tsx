import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const stockholmKommuner = ['Botkyrka','Danderyd','Ekerö','Haninge','Huddinge','Järfälla','Lidingö','Nacka','Norrtälje','Nykvarn','Nynäshamn','Salem','Sigtuna','Sollentuna','Solna','Stockholm','Sundbyberg','Södertälje','Tyresö','Täby','Upplands-Bro','Upplands Väsby','Vallentuna','Vaxholm','Värmdö','Österåker']
const allLevels = ['Lätt','Lätt+','Medel-','Medel','Medel+','Svår','Svår+','Extra svår']
const allFormations = ['5v5','7v7','9v9','11v11']
const matchGuaranteeOptions = ['N/A','2 matcher','3 matcher','4 matcher','5 matcher','6+ matcher']
const priceTypes = ['Per lag','Per spelare','Gratis']
const registrationTypes = ['Extern länk','Email','Kontakta arrangören']
const ageGroupOptions = ['P2009','P2010','P2011','P2012','P2013','P2014','P2015','P2016','P2017','P2018','F2009','F2010','F2011','F2012','F2013','F2014','F2015','F2016','F2017','F2018']

function MultiSelect({ options, selected, onToggle, label }: { options: string[], selected: string[], onToggle: (v: string) => void, label: string }) {
  return (
    <div>
      <label className="text-sm text-gray-500 mb-2 block">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map(o => (
          <button key={o} type="button" onClick={() => onToggle(o)} style={{
            padding: '6px 12px', borderRadius: '12px', border: '1px solid',
            borderColor: selected.includes(o) ? '#22c55e' : '#e5e7eb',
            backgroundColor: selected.includes(o) ? '#22c55e' : 'white',
            color: selected.includes(o) ? 'white' : '#4b5563',
            cursor: 'pointer', fontSize: '13px',
          }}>{o}</button>
        ))}
      </div>
    </div>
  )
}

// ─── CupsView ────────────────────────────────────────────────────────────────
export function CupsView({ session, onBack }: { session: any, onBack: () => void }) {
  const [cups, setCups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCup, setSelectedCup] = useState<any>(null)
  const [filters, setFilters] = useState({ type: '', formation: '', level: '', kommun: '' })

  useEffect(() => { fetchCups() }, [filters])

  const fetchCups = async () => {
    setLoading(true)
    let query = supabase.from('cups').select('*, teams(name)')
      .eq('status', 'active')
      .gte('date_to', new Date().toISOString().split('T')[0])
      .order('date_from', { ascending: true })
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.formation) query = query.contains('formations', [filters.formation])
    if (filters.level) query = query.contains('levels', [filters.level])
    if (filters.kommun) query = query.eq('kommun', filters.kommun)
    const { data } = await query
    setCups(data || [])
    setLoading(false)
  }

  if (showCreate) return <CreateCup session={session} onBack={() => { setShowCreate(false); fetchCups() }} />
  if (selectedCup) return (
    <CupDetail
      cup={selectedCup}
      session={session}
      onBack={() => setSelectedCup(null)}
      onDeleted={() => { setSelectedCup(null); fetchCups() }}
    />
  )

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white text-xl">←</button>
            <div>
              <h1 className="text-white text-xl font-medium">Cuper & Matchcamp</h1>
              <p className="text-green-100 text-sm">{cups.length} kommande evenemang</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 12px',
            border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: '500'
          }}>+ Lägg upp</button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 p-3 space-y-2">
        <div className="grid-2">
          <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">
            <option value="">Alla typer</option>
            <option value="Cup">Cup</option>
            <option value="Matchcamp">Matchcamp</option>
            <option value="Turnering">Turnering</option>
          </select>
          <select value={filters.formation} onChange={e => setFilters(p => ({ ...p, formation: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">
            <option value="">Alla format</option>
            {allFormations.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="grid-2">
          <select value={filters.level} onChange={e => setFilters(p => ({ ...p, level: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">
            <option value="">Alla nivåer</option>
            {allLevels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.kommun} onChange={e => setFilters(p => ({ ...p, kommun: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">
            <option value="">Alla kommuner</option>
            {stockholmKommuner.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Laddar...</p>
        ) : cups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">🏆</p>
            <p className="text-sm font-medium text-gray-600">Inga evenemang hittades</p>
            <p className="text-xs text-gray-400 mt-1">Prova att ändra filtren</p>
          </div>
        ) : cups.map(cup => <CupCard key={cup.id} cup={cup} onClick={() => setSelectedCup(cup)} />)}
      </div>
    </div>
  )
}

// ─── CupCard ─────────────────────────────────────────────────────────────────
function CupCard({ cup, onClick }: { cup: any, onClick: () => void }) {
  const dateFrom = new Date(cup.date_from).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  const dateTo = new Date(cup.date_to).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  const isSameDay = cup.date_from === cup.date_to

  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-green-200 transition-colors">
      {cup.image_url && (
        <img src={cup.image_url} alt={cup.name} style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '180px' }} />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{cup.type}</span>
          {cup.is_sanctioned && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">✓ Sanktionerad</span>}
        </div>
        <p className="text-sm font-medium text-gray-800 mb-0.5">{cup.name}</p>
        <p className="text-xs text-gray-400 mb-2">{cup.teams?.name}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>📅</span><span>{isSameDay ? dateFrom : `${dateFrom} – ${dateTo}`}</span>
          </div>
          {cup.locations?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>📍</span>
              <span>{cup.locations.slice(0, 2).join(', ')}{cup.locations.length > 2 ? ` +${cup.locations.length - 2} till` : ''}{cup.kommun ? `, ${cup.kommun}` : ''}</span>
            </div>
          )}
          <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
            {cup.age_groups?.length > 0 && <span>👦 {cup.age_groups.join(', ')}</span>}
            {cup.formations?.length > 0 && <span>⚽ {cup.formations.join(', ')}</span>}
            {cup.levels?.length > 0 && <span>📊 {cup.levels.join(', ')}</span>}
          </div>
          {cup.price > 0 && <div className="text-xs text-amber-600">💰 {cup.price} kr {cup.price_type === 'Per lag' ? '/lag' : '/spelare'}</div>}
          {cup.price === 0 && <div className="text-xs text-green-600">💰 Gratis</div>}
        </div>
      </div>
    </div>
  )
}

// ─── CupDetail ────────────────────────────────────────────────────────────────
function CupDetail({ cup, session, onBack, onDeleted }: { cup: any, session: any, onBack: () => void, onDeleted: () => void }) {
  const [activeTab, setActiveTab] = useState('info')
  const [deleting, setDeleting] = useState(false)
  const isOwner = cup.owner_id === session?.user?.id

  const dateFrom = new Date(cup.date_from).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateTo = new Date(cup.date_to).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
  const isSameDay = cup.date_from === cup.date_to
  const deadline = cup.registration_deadline
    ? new Date(cup.registration_deadline).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
    : null

  const hasRegButton =
    (cup.registration_type === 'Extern länk' && cup.registration_url) ||
    (cup.registration_type === 'Email' && cup.registration_email) ||
    cup.registration_type === 'Kontakta arrangören'

  const handleRegister = () => {
    if (cup.registration_type === 'Extern länk' && cup.registration_url) {
      window.open(cup.registration_url, '_blank')
    } else if (cup.registration_type === 'Email' && cup.registration_email) {
      window.open(`mailto:${cup.registration_email}?subject=Anmälan till ${cup.name}`)
    } else if (cup.registration_info) {
      alert(cup.registration_info)
    }
  }

  const regButtonLabel = () => {
    if (cup.registration_type === 'Extern länk') return '🔗 Anmäl via extern sida'
    if (cup.registration_type === 'Email') return '✉️ Anmäl via email'
    return '📞 Kontakta arrangören'
  }

  const handleDelete = async () => {
    if (!confirm(`Ta bort "${cup.name}"? Detta kan inte ångras.`)) return
    setDeleting(true)
    await supabase.from('cups').delete().eq('id', cup.id)
    setDeleting(false)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      {/* Header med bild */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {cup.image_url ? (
          <>
            <img src={cup.image_url} alt={cup.name} style={{ width: '100%', display: 'block', maxHeight: '220px', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)' }} />
          </>
        ) : (
          <div style={{ height: '120px', background: '#22c55e' }} />
        )}
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} className="text-white text-xl">←</button>
          {isOwner && (
            <button onClick={handleDelete} disabled={deleting} style={{
              background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '12px', padding: '6px 12px', cursor: 'pointer'
            }}>{deleting ? '...' : '🗑 Ta bort'}</button>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '999px' }}>{cup.type}</span>
            {cup.is_sanctioned && <span style={{ background: 'rgba(59,130,246,0.35)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '999px' }}>✓ Sanktionerad</span>}
          </div>
          <p className="text-white text-lg font-medium">{cup.name}</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{cup.teams?.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100" style={{ flexShrink: 0 }}>
        {[{ id: 'info', label: 'Info' }, { id: 'details', label: 'Detaljer' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: hasRegButton ? '88px' : '24px' }}>

        {/* INFO-FLIK */}
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            {/* Datum & plats */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span>📅</span>
                <div>
                  <p className="text-sm text-gray-800 font-medium">{isSameDay ? dateFrom : `${dateFrom} – ${dateTo}`}</p>
                  {deadline && <p className="text-xs text-red-500 mt-0.5">Sista anmälningsdag: {deadline}</p>}
                </div>
              </div>
              {cup.locations?.length > 0 && (
                <div className="flex items-start gap-3">
                  <span>📍</span>
                  <div>
                    {cup.locations.map((loc: string, i: number) => (
                      <p key={i} className="text-sm text-gray-700">{loc}</p>
                    ))}
                    {cup.kommun && <p className="text-xs text-gray-400 mt-0.5">{cup.kommun}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Format-info – åldrar, spelform, nivå, garanti, pris */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              {cup.age_groups?.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Åldersgrupper</span>
                  <span className="text-gray-800 font-medium text-right">{cup.age_groups.join(', ')}</span>
                </div>
              )}
              {cup.formations?.length > 0 && (
                <div className="flex justify-between text-sm border-t border-gray-50 pt-2">
                  <span className="text-gray-500">Spelform</span>
                  <span className="text-gray-800 font-medium">{cup.formations.join(', ')}</span>
                </div>
              )}
              {cup.levels?.length > 0 && (
                <div className="flex justify-between text-sm border-t border-gray-50 pt-2">
                  <span className="text-gray-500">Nivåer</span>
                  <span className="text-gray-800 font-medium text-right">{cup.levels.join(', ')}</span>
                </div>
              )}
              {cup.match_guarantee && cup.match_guarantee !== 'N/A' && (
                <div className="flex justify-between text-sm border-t border-gray-50 pt-2">
                  <span className="text-gray-500">Matchgaranti</span>
                  <span className="text-gray-800 font-medium">Min {cup.match_guarantee}</span>
                </div>
              )}
              {cup.price !== null && cup.price !== undefined && (
                <div className="flex justify-between text-sm border-t border-gray-50 pt-2">
                  <span className="text-gray-500">Pris</span>
                  <span className={`font-medium ${cup.price === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {cup.price === 0 ? 'Gratis' : `${cup.price} kr ${cup.price_type === 'Per lag' ? '/lag' : '/spelare'}`}
                  </span>
                </div>
              )}
            </div>

            {/* Beskrivning */}
            {cup.description && (
              <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', border: '1px solid #bbf7d0' }}>
                <p className="text-sm font-medium text-green-800 mb-2">Om evenemanget</p>
                <p className="text-sm text-green-700 leading-relaxed whitespace-pre-wrap">{cup.description}</p>
              </div>
            )}

            {/* Faciliteter */}
            {(cup.has_kiosk || cup.has_changing_rooms || cup.has_parking) && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Faciliteter</p>
                <div className="flex gap-2 flex-wrap">
                  {cup.has_kiosk && <span className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-100">🍔 Kiosk</span>}
                  {cup.has_changing_rooms && <span className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-100">🚿 Omklädningsrum</span>}
                  {cup.has_parking && <span className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-100">🅿️ Parkering</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETALJER-FLIK */}
        {activeTab === 'details' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              {cup.max_teams && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Max antal lag</span>
                  <span className="text-gray-800 font-medium">{cup.max_teams}</span>
                </div>
              )}
              {cup.registration_type && (
                <div className="flex justify-between text-sm border-t border-gray-50 pt-2">
                  <span className="text-gray-500">Anmälningssätt</span>
                  <span className="text-gray-800 font-medium">{cup.registration_type}</span>
                </div>
              )}
            </div>

            {cup.registration_info && (
              <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '16px', border: '1px solid #fed7aa' }}>
                <p className="text-sm font-medium text-amber-800 mb-1">Anmälningsinformation</p>
                <p className="text-sm text-amber-700 whitespace-pre-wrap">{cup.registration_info}</p>
              </div>
            )}

            {isOwner && (
              <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '16px', border: '1px solid #fecaca' }}>
                <p className="text-sm font-medium text-red-700 mb-3">Du är arrangör</p>
                <button onClick={handleDelete} disabled={deleting}
                  className="w-full border border-red-200 text-red-600 py-2 rounded-xl text-sm font-medium">
                  {deleting ? 'Tar bort...' : '🗑 Ta bort evenemang'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Anmälningsknapp */}
      {hasRegButton && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'white', borderTop: '0.5px solid #e5e7eb' }}>
          <button onClick={handleRegister}
            className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
            {regButtonLabel()}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── CreateCup ───────────────────────────────────────────────────────────────
export function CreateCup({ session, onBack }: { session: any, onBack: () => void }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [team, setTeam] = useState<any>(null)
  const [locationInput, setLocationInput] = useState('')
  const [form, setForm] = useState({
    name: '', type: 'Cup', description: '',
    date_from: '', date_to: '', registration_deadline: '',
    locations: [] as string[], kommun: '',
    formations: [] as string[], levels: [] as string[], age_groups: [] as string[],
    match_guarantee: 'N/A', max_teams: '', price: '', price_type: 'Per lag',
    registration_type: 'Extern länk', registration_url: '', registration_email: '', registration_info: '',
    has_kiosk: false, has_changing_rooms: false, has_parking: false, is_sanctioned: false,
  })

  useEffect(() => {
    supabase.from('teams').select('*').eq('owner_id', session.user.id).single().then(({ data }) => setTeam(data))
  }, [])

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))
  const toggleArr = (key: string, val: string) => setForm(prev => {
    const arr = (prev as any)[key] as string[]
    return { ...prev, [key]: arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val] }
  })

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const addLocation = () => {
    const loc = locationInput.trim()
    if (loc && !form.locations.includes(loc)) {
      update('locations', [...form.locations, loc])
      setLocationInput('')
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.date_from || !form.date_to) { alert('Fyll i namn och datum'); return }
    setLoading(true)

    let image_url = ''
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${session.user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('cup-images').upload(path, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('cup-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('cups').insert({
      owner_id: session.user.id,
      team_id: team?.id || null,
      name: form.name, type: form.type,
      description: form.description || null,
      image_url: image_url || null,
      date_from: form.date_from, date_to: form.date_to,
      registration_deadline: form.registration_deadline || null,
      locations: form.locations.length > 0 ? form.locations : null,
      kommun: form.kommun || null,
      formations: form.formations.length > 0 ? form.formations : null,
      levels: form.levels.length > 0 ? form.levels : null,
      age_groups: form.age_groups.length > 0 ? form.age_groups : null,
      match_guarantee: form.match_guarantee,
      max_teams: form.max_teams ? parseInt(form.max_teams) : null,
      price: form.price !== '' ? parseInt(form.price) : 0,
      price_type: form.price_type,
      registration_type: form.registration_type,
      registration_url: form.registration_url || null,
      registration_email: form.registration_email || null,
      registration_info: form.registration_info || null,
      has_kiosk: form.has_kiosk, has_changing_rooms: form.has_changing_rooms,
      has_parking: form.has_parking, is_sanctioned: form.is_sanctioned,
      status: 'active',
    })

    setLoading(false)
    if (error) { alert(error.message); return }
    onBack()
  }

  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto flex flex-col z-50">
      <div className="bg-green-500 p-5 flex items-center gap-3" style={{ flexShrink: 0 }}>
        <button onClick={onBack} className="text-white text-xl">←</button>
        <div>
          <h1 className="text-white text-xl font-medium">Lägg upp evenemang</h1>
          <p className="text-green-100 text-sm">Steg {step} av 3</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
        {['Grundinfo', 'Format & nivå', 'Anmälan'].map((s, i) => (
          <button key={i} onClick={() => setStep(i + 1)} style={{
            flex: 1, padding: '10px 4px', fontSize: '11px',
            fontWeight: step === i + 1 ? '500' : '400',
            color: step === i + 1 ? '#22c55e' : '#9ca3af',
            borderBottom: `2px solid ${step === i + 1 ? '#22c55e' : 'transparent'}`,
            background: 'none', border: 'none', cursor: 'pointer',
          } as React.CSSProperties}>{s}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: '88px' }}>

        {/* STEG 1 */}
        {step === 1 && (
          <>
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Marknadsföringsbild</label>
              <div onClick={() => fileInputRef.current?.click()} style={{
                border: '2px dashed #e5e7eb', borderRadius: '12px', cursor: 'pointer',
                overflow: 'hidden', background: '#f9fafb',
                minHeight: imagePreview ? 'auto' : '120px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {imagePreview
                  ? <img src={imagePreview} alt="preview" style={{ width: '100%', display: 'block' }} />
                  : <div style={{ textAlign: 'center', padding: '24px' }}>
                      <p style={{ fontSize: '28px', marginBottom: '6px' }}>📸</p>
                      <p className="text-sm text-gray-400">Tryck för att ladda upp bild</p>
                      <p className="text-xs text-gray-300 mt-1">Visas i naturlig storlek</p>
                    </div>
                }
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
              {imagePreview && <button onClick={() => { setImageFile(null); setImagePreview('') }} className="text-xs text-red-400 mt-1">Ta bort bild</button>}
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-2 block">Typ *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Cup', 'Matchcamp', 'Turnering'].map(t => (
                  <button key={t} type="button" onClick={() => update('type', t)} style={{
                    flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid',
                    borderColor: form.type === t ? '#22c55e' : '#e5e7eb',
                    backgroundColor: form.type === t ? '#22c55e' : 'white',
                    color: form.type === t ? 'white' : '#4b5563',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Namn *</label>
              <input type="text" placeholder="t.ex. Vasalund April Cupen 2026" value={form.name}
                onChange={e => update('name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Datum *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="date" value={form.date_from} onChange={e => update('date_from', e.target.value)}
                  className="flex-1 px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
                <span className="text-gray-400 text-sm">–</span>
                <input type="date" value={form.date_to} onChange={e => update('date_to', e.target.value)}
                  className="flex-1 px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Samma datum = endagsevenemang</p>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Sista anmälningsdag</label>
              <input type="date" value={form.registration_deadline} onChange={e => update('registration_deadline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Plats(er)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="t.ex. Järvastadens IP" value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLocation()}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
                <button onClick={addLocation} className="bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium">+</button>
              </div>
              {form.locations.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {form.locations.map(loc => (
                    <span key={loc} style={{ background: '#f0fdf4', color: '#166534', fontSize: '12px', padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {loc}
                      <button onClick={() => update('locations', form.locations.filter(l => l !== loc))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Kommun</label>
              <select value={form.kommun} onChange={e => update('kommun', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">
                <option value="">Välj kommun</option>
                {stockholmKommuner.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Beskrivning</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Berätta om evenemanget – format, vad som ingår, varför lag ska delta..."
                rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 resize-none" />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-2 block">Faciliteter</label>
              <div className="space-y-2">
                {[
                  { key: 'has_kiosk', label: '🍔 Kiosk/grill' },
                  { key: 'has_changing_rooms', label: '🚿 Omklädningsrum' },
                  { key: 'has_parking', label: '🅿️ Parkering' },
                  { key: 'is_sanctioned', label: '✓ Sanktionerad av STFF' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[item.key]}
                      onChange={e => update(item.key, e.target.checked)} className="w-4 h-4 accent-green-500" />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STEG 2 – åldersgrupp FÖRE spelform */}
        {step === 2 && (
          <>
            <MultiSelect options={ageGroupOptions} selected={form.age_groups}
              onToggle={v => toggleArr('age_groups', v)} label="Åldersgrupper (välj en eller flera)" />

            <MultiSelect options={allFormations} selected={form.formations}
              onToggle={v => toggleArr('formations', v)} label="Spelform (välj en eller flera)" />

            <MultiSelect options={allLevels} selected={form.levels}
              onToggle={v => toggleArr('levels', v)} label="Nivåer (välj en eller flera)" />

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Matchgaranti per lag</label>
              <select value={form.match_guarantee} onChange={e => update('match_guarantee', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">
                {matchGuaranteeOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Max antal lag</label>
              <input type="number" placeholder="t.ex. 24" value={form.max_teams}
                onChange={e => update('max_teams', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
              <p className="text-xs text-gray-400 mt-1">Lämna tomt om obegränsat</p>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Pris</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" placeholder="0 = gratis" value={form.price}
                  onChange={e => update('price', e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
                <select value={form.price_type} onChange={e => update('price_type', e.target.value)}
                  className="flex-1 px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white">
                  {priceTypes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {/* STEG 3 */}
        {step === 3 && (
          <>
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Hur anmäler man sig? *</label>
              <div className="space-y-2">
                {registrationTypes.map(rt => (
                  <label key={rt} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors"
                    style={{ borderColor: form.registration_type === rt ? '#22c55e' : '#e5e7eb' }}>
                    <input type="radio" name="reg_type" value={rt} checked={form.registration_type === rt}
                      onChange={() => update('registration_type', rt)} className="accent-green-500" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">{rt}</p>
                      <p className="text-xs text-gray-400">
                        {rt === 'Extern länk' && 'Lag skickas till din anmälningssida (ProCup, CupManager etc)'}
                        {rt === 'Email' && 'Lag öppnar sin email-app och kontaktar dig direkt'}
                        {rt === 'Kontakta arrangören' && 'Visa instruktioner om hur lag ska ta kontakt'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {form.registration_type === 'Extern länk' && (
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Anmälningslänk *</label>
                <input type="url" placeholder="https://procup.se/..." value={form.registration_url}
                  onChange={e => update('registration_url', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
              </div>
            )}

            {form.registration_type === 'Email' && (
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Email för anmälan *</label>
                <input type="email" placeholder="din@email.com" value={form.registration_email}
                  onChange={e => update('registration_email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400" />
              </div>
            )}

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Ytterligare information</label>
              <textarea value={form.registration_info} onChange={e => update('registration_info', e.target.value)}
                placeholder="t.ex. Ange lagnamn, kontaktperson och telefon i anmälan..."
                rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 resize-none" />
            </div>

            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
              <p className="text-xs font-medium text-green-800 mb-2">Förhandsgranskning</p>
              <div style={{ width: '100%', background: '#22c55e', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
                {form.registration_type === 'Extern länk' && '🔗 Anmäl via extern sida'}
                {form.registration_type === 'Email' && '✉️ Anmäl via email'}
                {form.registration_type === 'Kontakta arrangören' && '📞 Kontakta arrangören'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigering */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'white', borderTop: '0.5px solid #e5e7eb', display: 'flex', gap: '8px' }}>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">
            ← Tillbaka
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600">
            Nästa →
          </button>
        ) : (
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600">
            {loading ? 'Publicerar...' : '🏆 Publicera'}
          </button>
        )}
      </div>
    </div>
  )
}
