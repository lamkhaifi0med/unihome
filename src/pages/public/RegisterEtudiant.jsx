import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Calendar, Building2, Upload, X, ChevronRight, Check, Bed, Monitor, Lamp, Archive } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { universites } from '../../data/mockData'
import { useAuth } from '../../hooks/useAuth'

const steps = [
  { label: 'Informations personnelles', id: 1 },
  { label: 'Université & préférences', id: 2 },
  { label: 'Documents', id: 3 },
  { label: 'Confirmation', id: 4 },
]

export default function RegisterEtudiant() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState([])
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', dateNaissance: '', password: '',
    universite: '', ville: '', budgetMax: '',
  })
  const [dragging, setDragging] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleFiles = (newFiles) => {
    const arr = Array.from(newFiles).map(f => ({ name: f.name, size: (f.size / (1024 * 1024)).toFixed(2) }))
    setFiles(prev => [...prev, ...arr])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const finish = () => {
    login(form.email, form.password, 'ETUDIANT')
    navigate('/dashboard-etudiant')
  }

  const equipements = [
    { icon: Bed, label: 'Lit', desc: 'Chambre avec lit pour université.' },
    { icon: Monitor, label: 'Bureau', desc: 'Bureau pour travailler.' },
    { icon: Lamp, label: 'Lampe', desc: 'Éclairage professionnel.' },
    { icon: Archive, label: 'Armoire', desc: 'Rangement vêtements.' },
  ]

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950" />
      <div className="orb orb-purple w-80 h-80 top-10 left-10 opacity-15" />
      <div className="orb orb-blue w-64 h-64 bottom-10 right-10 opacity-15" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="glass border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-[1fr_auto] min-h-[600px]">
            {/* Main form */}
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <Logo size="sm" />
              </div>

              {/* Progress */}
              <div className="mb-8">
                <div className="flex gap-2 mb-3">
                  {steps.map((s, i) => (
                    <div key={s.id} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${s.id <= step ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/15'}`} />
                  ))}
                </div>
                <div className="grid grid-cols-4 text-xs text-white/40 gap-2">
                  {steps.map((s) => (
                    <span key={s.id} className={s.id === step ? 'text-white/90' : ''}>{s.label}</span>
                  ))}
                </div>
              </div>

              {/* Step content */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-2xl text-white mb-6">Informations personnelles</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input type="text" placeholder="Prénom" value={form.prenom} onChange={set('prenom')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input type="text" placeholder="Nom de famille" value={form.nom} onChange={set('nom')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
                    </div>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="date" placeholder="Date de naissance" value={form.dateNaissance} onChange={set('dateNaissance')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <select value={form.universite} onChange={set('universite')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm">
                      <option value="" className="bg-gray-900">Université</option>
                      {universites.map(u => <option key={u} value={u} className="bg-gray-900">{u}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-2xl text-white mb-6">Préférences de logement</h2>
                  <div className="relative">
                    <input type="number" placeholder="Budget maximum (MAD/mois)" value={form.budgetMax} onChange={set('budgetMax')} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
                  </div>
                  <input type="password" placeholder="Créer un mot de passe" value={form.password} onChange={set('password')} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
                  <p className="text-white/50 text-sm">En continuant, vous acceptez nos <a href="#" className="text-indigo-400">CGU</a> et notre <a href="#" className="text-indigo-400">politique de confidentialité</a>.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-2xl text-white mb-6">Documents</h2>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 hover:border-white/40'}`}
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex justify-center gap-3 mb-3">
                      <Upload className="w-10 h-10 text-indigo-400" />
                    </div>
                    <p className="text-white/60 text-sm mb-3">Glissez vos documents ici ou</p>
                    <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                      <span>Parcourir les fichiers</span>
                      <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                    </label>
                    <p className="text-white/30 text-xs mt-2">Carte étudiant, attestation d'inscription (PDF, JPG, PNG)</p>
                  </div>
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <Upload className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white/80 text-xs truncate">{f.name}</p>
                            <p className="text-white/40 text-xs">{f.size} MB</p>
                          </div>
                          <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-white mb-3">Presque terminé !</h2>
                  <p className="text-white/60 text-sm mb-6">Un email de confirmation a été envoyé à <strong className="text-white">{form.email || 'votre@email.com'}</strong>. Vérifiez votre boîte mail pour activer votre compte.</p>
                  <button onClick={finish} className="btn-primary w-full text-center py-3.5">Accéder à mon dashboard</button>
                </div>
              )}

              {step < 4 && (
                <div className="flex items-center justify-between mt-8">
                  {step > 1 ? (
                    <button onClick={() => setStep(s => s - 1)} className="text-white/50 hover:text-white text-sm transition-colors">← Retour</button>
                  ) : <span />}
                  <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-display font-semibold px-8 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/30">
                    Étape suivante <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="hidden md:block w-56 border-l border-white/10 bg-white/3 p-6">
              <p className="text-white/50 text-xs uppercase tracking-wider font-display mb-4">Équipements populaires</p>
              <div className="space-y-3">
                {equipements.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{label}</p>
                      <p className="text-white/40 text-xs leading-tight">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
