import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, PlusCircle, List, User, Upload, X, ChevronRight, CheckCircle, MapPin, Phone, MessageCircle, Mail } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { villes, universites } from '../../data/mockData'

const sidebarLinks = [
  { to: '/dashboard-proprietaire', label: 'Tableau de bord', icon: Home },
  { to: '/publier-annonce', label: 'Publier une annonce', icon: PlusCircle },
  { to: '/mes-annonces', label: 'Mes annonces', icon: List },
  { to: '/profil-proprietaire', label: 'Mon profil', icon: User },
]

const steps = ['Logement', 'Photos', 'Équipements', 'Contacts']
const equipementsList = ['WiFi', 'Meublé', 'Cuisine équipée', 'Parking', 'Clim', 'Balcon', 'Terrasse', 'Gardien', 'Ascenseur', 'Laverie', 'Salle de sport', 'Piscine']

export default function PublierAnnonce({ isDark, onToggleTheme }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState([])
  const [selectedEq, setSelectedEq] = useState([])
  const [form, setForm] = useState({
    titre: '', type: '', ville: '', adresse: '', universite: '', superficie: '', loyer: '', description: '',
    telephone: '', whatsapp: '', email: '', facebook: '',
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleEq = (eq) => setSelectedEq(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq])

  const handlePhotos = (files) => {
    const arr = Array.from(files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }))
    setPhotos(prev => [...prev, ...arr].slice(0, 10))
  }

  const publish = () => {
    setAnalyzing(true)
    setTimeout(() => { setAnalyzing(false); setDone(true) }, 2000)
  }

  if (done) return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-3">Annonce soumise !</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Votre annonce est en cours d'analyse par notre IA. Vous serez notifié du résultat dans quelques minutes.</p>
          <button onClick={() => navigate('/mes-annonces')} className="btn-primary">Voir mes annonces</button>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Publier une annonce</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Remplissez les 4 étapes pour soumettre votre logement</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i + 1 < step ? 'bg-primary-600 text-white' : i + 1 === step ? 'border-2 border-primary-600 text-primary-600 dark:text-primary-400' : 'border-2 border-gray-300 dark:border-white/20 text-gray-400'}`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i + 1 < step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <div className="glass-light rounded-2xl p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Informations du logement</h2>
            <input type="text" placeholder="Titre de l'annonce" value={form.titre} onChange={set('titre')} className="input-field" />
            <div className="grid grid-cols-2 gap-4">
              <select value={form.type} onChange={set('type')} className="input-field">
                <option value="">Type de logement</option>
                {['STUDIO', 'CHAMBRE', 'COLOCATION', 'APPARTEMENT'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.ville} onChange={set('ville')} className="input-field">
                <option value="">Ville</option>
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Adresse complète" value={form.adresse} onChange={set('adresse')} className="input-field" />
            <select value={form.universite} onChange={set('universite')} className="input-field">
              <option value="">Université la plus proche</option>
              {universites.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Superficie (m²)" value={form.superficie} onChange={set('superficie')} className="input-field" />
              <input type="number" placeholder="Loyer mensuel (MAD)" value={form.loyer} onChange={set('loyer')} className="input-field" />
            </div>
            <textarea rows={4} placeholder="Description détaillée du logement (min. 100 mots recommandés)..." value={form.description} onChange={set('description')} className="input-field resize-none" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Photos du logement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Entre 2 et 10 photos. Photos originales uniquement — les photos volées sont détectées automatiquement.</p>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl p-10 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('photo-input').click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handlePhotos(e.dataTransfer.files) }}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Glissez vos photos ici</p>
              <p className="text-gray-400 text-xs">JPG, PNG — Max 10 photos</p>
              <input id="photo-input" type="file" multiple accept="image/*" className="hidden" onChange={e => handlePhotos(e.target.files)} />
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">{photos.length}/10 photos</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Équipements disponibles</h2>
            <div className="flex flex-wrap gap-2">
              {equipementsList.map(eq => (
                <button key={eq} onClick={() => toggleEq(eq)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedEq.includes(eq) ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'}`}>
                  {eq}
                </button>
              ))}
            </div>
            {selectedEq.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">{selectedEq.length} équipement{selectedEq.length > 1 ? 's' : ''} sélectionné{selectedEq.length > 1 ? 's' : ''}</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">Contacts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Au moins un moyen de contact est obligatoire.</p>
            <div className="space-y-3">
              {[
                { key: 'telephone', icon: Phone, label: 'Téléphone', placeholder: '+212 6 XX XX XX XX' },
                { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', placeholder: '+212 6 XX XX XX XX' },
                { key: 'email', icon: Mail, label: 'Email', placeholder: 'votre@email.com' },
                { key: 'facebook', icon: MapPin, label: 'Facebook / Instagram', placeholder: 'URL ou @pseudo' },
              ].map(({ key, icon: Icon, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input type="text" placeholder={placeholder} value={form[key]} onChange={set(key)} className="input-field flex-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn-ghost text-sm">← Étape précédente</button>
          ) : <span />}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-2">
              Étape suivante <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={publish} disabled={analyzing} className="btn-primary flex items-center gap-2">
              {analyzing ? 'Analyse en cours...' : 'Publier l\'annonce'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
