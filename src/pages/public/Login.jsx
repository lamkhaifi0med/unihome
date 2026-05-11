import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [role, setRole] = useState('ETUDIANT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true)
    setTimeout(() => {
      const user = login(email, password, role)
      setLoading(false)
      if (role === 'ADMIN') navigate('/admin')
      else if (role === 'PROPRIETAIRE') navigate('/dashboard-proprietaire')
      else navigate('/dashboard-etudiant')
    }, 800)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
      <div className="orb orb-purple w-96 h-96 top-10 left-10 opacity-20" />
      <div className="orb orb-blue w-80 h-80 bottom-10 right-20 opacity-20" />
      <div className="orb orb-pink w-64 h-64 top-1/2 right-10 opacity-15" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-3xl p-8 border border-white/15 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <p className="text-white/60 text-sm">Connectez-vous à votre espace</p>
          </div>

          {/* Role selector */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6 border border-white/10">
            {[
              { val: 'ETUDIANT', label: 'Étudiant' },
              { val: 'PROPRIETAIRE', label: 'Propriétaire' },
              { val: 'ADMIN', label: 'Admin' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setRole(val)}
                className={`flex-1 py-2 text-sm font-display font-medium rounded-lg transition-all duration-200 ${role === val ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-display font-bold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link to="#" className="text-white/50 hover:text-white/80 text-sm transition-colors block">
              Mot de passe oublié ?
            </Link>
            <p className="text-white/50 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                S'inscrire
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-4 text-white/30 text-xs">
            <Link to="#" className="hover:text-white/60 transition-colors">À propos</Link>
            <span>·</span>
            <Link to="#" className="hover:text-white/60 transition-colors">Contact</Link>
            <span>·</span>
            <Link to="#" className="hover:text-white/60 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
