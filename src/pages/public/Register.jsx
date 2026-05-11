import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Building2, Check } from 'lucide-react'
import Logo from '../../components/ui/Logo'

export default function Register() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
      <div className="orb orb-purple w-96 h-96 top-0 left-20 opacity-20" />
      <div className="orb orb-blue w-80 h-80 bottom-0 right-10 opacity-20" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <h1 className="font-display font-bold text-4xl text-white mb-3">
          Choisissez votre profil
        </h1>
        <p className="text-white/60 mb-10">Rejoignez UniHome en tant qu'étudiant ou propriétaire</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Étudiant */}
          <button
            onClick={() => navigate('/register-etudiant')}
            className="glass border border-white/15 rounded-3xl p-8 text-left hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 group-hover:bg-indigo-500/30 transition-colors">
              <GraduationCap className="w-8 h-8 text-indigo-300" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-3">Étudiant</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Trouvez votre logement idéal près de votre campus, consultez les ressources universitaires et connectez-vous avec d'autres étudiants.
            </p>
            <div className="space-y-2">
              {['Recherche personnalisée par IA', 'Score de confiance anti-fraude', 'Assistant chatbot 24h/24'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-indigo-400 font-semibold text-sm group-hover:text-indigo-300 transition-colors">Commencer →</span>
              <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white/40 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          </button>

          {/* Propriétaire */}
          <button
            onClick={() => navigate('/register-proprietaire')}
            className="glass border border-white/15 rounded-3xl p-8 text-left hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
              <Building2 className="w-8 h-8 text-purple-300" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-3">Propriétaire</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Publiez vos logements, gérez vos annonces et connectez-vous avec des étudiants vérifiés à la recherche d'un logement fiable.
            </p>
            <div className="space-y-2">
              {['Publication gratuite', 'Locataires étudiants vérifiés', 'Badge propriétaire vérifié'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-purple-400 font-semibold text-sm group-hover:text-purple-300 transition-colors">Commencer →</span>
              <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white/40 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
          </button>
        </div>

        <p className="mt-8 text-white/40 text-sm">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Se connecter
          </Link>
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-white/30 text-xs">
          <Link to="#" className="hover:text-white/50">À propos</Link>
          <span>·</span>
          <Link to="#" className="hover:text-white/50">Contact</Link>
          <span>·</span>
          <Link to="#" className="hover:text-white/50">Confidentialité</Link>
        </div>
      </div>
    </div>
  )
}
