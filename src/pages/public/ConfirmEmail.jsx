import { Link } from 'react-router-dom'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'
import Logo from '../../components/ui/Logo'

export default function ConfirmEmail() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
      <div className="orb orb-purple w-80 h-80 top-20 left-20 opacity-20" />
      <div className="orb orb-blue w-64 h-64 bottom-10 right-10 opacity-20" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="glass border border-white/15 rounded-3xl p-10 shadow-2xl">
          <div className="flex justify-center mb-6"><Logo /></div>
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-9 h-9 text-emerald-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-3">Vérifiez votre email</h1>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Un lien de confirmation a été envoyé à votre adresse email. Cliquez sur le lien pour activer votre compte UniHome.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
            {['Vérifiez votre dossier spam', 'Le lien expire dans 24h', 'Un seul compte par email'].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {t}
              </div>
            ))}
          </div>
          <Link to="/login" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-display font-bold hover:from-indigo-500 hover:to-purple-500 transition-all">
            Aller à la connexion <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
