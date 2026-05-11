import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, CreditCard, ChevronRight, Check, Shield } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { useAuth } from '../../hooks/useAuth'

const steps = ['Informations', 'Vérification', 'Mot de passe', 'Confirmation']

export default function RegisterProprietaire() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', cin: '', password: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleOtp = (i, val) => {
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus()
  }

  const finish = () => {
    login(form.email, form.password, 'PROPRIETAIRE')
    navigate('/dashboard-proprietaire')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950" />
      <div className="orb orb-purple w-80 h-80 top-20 right-20 opacity-15" />
      <div className="orb orb-pink w-64 h-64 bottom-10 left-10 opacity-15" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass border border-white/15 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6"><Logo size="sm" /></div>
          <h1 className="font-display font-bold text-2xl text-white text-center mb-2">Inscription Propriétaire</h1>
          <p className="text-white/50 text-sm text-center mb-8">Publiez vos logements et trouvez des étudiants fiables</p>

          {/* Progress */}
          <div className="flex gap-1.5 mb-8">
            {steps.map((s, i) => (
              <div key={s} className={`h-1 rounded-full flex-1 transition-all duration-500 ${i + 1 <= step ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-white/15'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Prénom" value={form.prenom} onChange={set('prenom')} className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
                <input type="text" placeholder="Nom" value={form.nom} onChange={set('nom')} className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="tel" placeholder="Téléphone (+212...)" value={form.telephone} onChange={set('telephone')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
              </div>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="text" placeholder="Numéro CIN" value={form.cin} onChange={set('cin')} className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-start gap-3">
                <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-purple-300/80 text-xs">Votre CIN sera vérifiée par notre équipe pour vous attribuer le badge « Propriétaire Vérifié ».</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
                <Phone className="w-8 h-8 text-purple-300" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Vérification par SMS</h3>
              <p className="text-white/50 text-sm mb-6">Entrez le code à 6 chiffres envoyé au <strong className="text-white">{form.telephone || '+212 6XX XXX XXX'}</strong></p>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((v, i) => (
                  <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={v} onChange={e => handleOtp(i, e.target.value)} className="w-12 h-12 bg-white/8 border border-white/20 rounded-xl text-center text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all" />
                ))}
              </div>
              <button className="text-purple-400 hover:text-purple-300 text-sm transition-colors">Renvoyer le code</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-white text-lg mb-4">Créez votre mot de passe</h3>
              <input type="password" placeholder="Mot de passe" value={form.password} onChange={set('password')} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
              <input type="password" placeholder="Confirmer le mot de passe" className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">Compte créé !</h3>
              <p className="text-white/60 text-sm mb-6">Votre compte propriétaire a été créé. La vérification de votre CIN est en cours (24-48h). En attendant, vous pouvez publier des annonces en modération manuelle.</p>
              <button onClick={finish} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display font-bold hover:from-purple-500 hover:to-indigo-500 transition-all">
                Accéder à mon espace
              </button>
            </div>
          )}

          {step < 4 && (
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)} className="text-white/50 hover:text-white text-sm">← Retour</button>
              ) : <span />}
              <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-semibold px-7 py-3 rounded-xl transition-all">
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
