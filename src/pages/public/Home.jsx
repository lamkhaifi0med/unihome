import { Link } from 'react-router-dom'
import { Shield, Zap, Users, Star, ArrowRight, MapPin, TrendingUp, CheckCircle } from 'lucide-react'
import SearchBar from '../../components/forms/SearchBar'
import AnnonceCard from '../../components/listing/AnnonceCard'
import { annonces } from '../../data/mockData'

export default function Home() {
  const featured = annonces.filter(a => a.scoreConfiance >= 70).slice(0, 3)

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900" />
        <div className="orb orb-purple w-96 h-96 top-20 left-1/4" />
        <div className="orb orb-blue w-80 h-80 bottom-20 right-1/3" />
        <div className="orb orb-pink w-64 h-64 top-1/3 right-10" />

        <div className="relative page-container py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm mb-8 animate-fade-in">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Plateforme anti-fraude propulsée par IA</span>
            </div>

            <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight mb-6 animate-slide-up">
              Trouvez votre{' '}
              <span className="gradient-text">logement idéal</span>{' '}
              en toute sécurité
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed font-body">
              UniHome centralise les offres de logements étudiants au Maroc avec un système de score de confiance anti-fraude. Fini les arnaques Facebook et WhatsApp.
            </p>

            <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <SearchBar />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> 1 200+ annonces vérifiées</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> 15 villes marocaines</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Score IA en temps réel</span>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-dark-900 to-transparent" />
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Pourquoi UniHome ?</h2>
            <p className="section-subtitle">La seule plateforme conçue spécifiquement pour les étudiants marocains</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                color: 'emerald',
                title: 'Anti-Fraude par IA',
                desc: 'Chaque annonce est analysée automatiquement : vérification des photos, du texte, du prix et de l\'identité du propriétaire. Score visible publiquement.',
              },
              {
                icon: Zap,
                color: 'indigo',
                title: 'Recommandations Personnalisées',
                desc: 'Notre moteur IA Gemini analyse votre profil et vous suggère les logements les plus adaptés à votre budget, université et préférences.',
              },
              {
                icon: Users,
                color: 'purple',
                title: 'Communauté Étudiante',
                desc: 'Avis vérifiés par de vrais étudiants, signalement collaboratif des arnaques, et assistant chatbot multilingue disponible 24h/24.',
              },
            ].map(({ icon: Icon, color, title, desc }) => {
              const colorMap = {
                emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
              }
              return (
                <div key={title} className="glass-light rounded-2xl p-8 card-hover text-center">
                  <div className={`w-14 h-14 rounded-2xl ${colorMap[color]} flex items-center justify-center mx-auto mb-5`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Score explication */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-dark-800 dark:to-dark-700">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-5">Le Score de Confiance UniHome</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">Notre IA analyse 4 dimensions pour calculer un score sur 100, affiché sur chaque annonce sous forme de badge coloré.</p>
              <div className="space-y-4">
                {[
                  { label: 'Identité propriétaire', pts: 30, color: 'bg-indigo-500' },
                  { label: 'Analyse textuelle ', pts: 25, color: 'bg-purple-500' },
                  { label: 'Analyse photographique', pts: 25, color: 'bg-emerald-500' },
                  { label: 'Cohérence du prix', pts: 20, color: 'bg-amber-500' },
                ].map(({ label, pts, color }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-500 dark:text-gray-400 text-right flex-shrink-0">{pts} pts</div>
                    <div className="flex-1 h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pts}%` }} />
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-shrink-0 w-44">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { score: 92, bg: 'from-emerald-500/20 to-emerald-600/10 border-emerald-200 dark:border-emerald-500/30', label: '≥ 70 — Publication automatique' },
                { score: 55, bg: 'from-amber-500/20 to-amber-600/10 border-amber-200 dark:border-amber-500/30', label: '40–69 — Modération manuelle' },
                { score: 28, bg: 'from-red-500/20 to-red-600/10 border-red-200 dark:border-red-500/30', label: '< 40 — Rejet automatique' },
              ].map(({ score, bg, label }) => (
                <div key={score} className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r border ${bg}`}>
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-dark-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="font-display font-bold text-xl text-gray-900 dark:text-white">{score}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="py-24">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Annonces Recommandées</h2>
              <p className="section-subtitle">Logements avec le meilleur score de confiance</p>
            </div>
            <Link to="/annonces" className="hidden md:flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-medium hover:gap-3 transition-all text-sm">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featured.map(a => <AnnonceCard key={a.id} annonce={a} />)}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link to="/annonces" className="btn-secondary">Voir toutes les annonces</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="orb orb-pink w-96 h-96 top-0 right-0 opacity-20" />
        <div className="relative page-container text-center">
          <h2 className="font-display font-bold text-4xl text-white mb-4">Prêt à trouver votre logement ?</h2>
          <p className="text-white/80 text-lg mb-8">Rejoignez +4 800 étudiants qui font confiance à UniHome</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="bg-white text-indigo-700 font-display font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-white/20">
              Créer un compte gratuit
            </Link>
            <Link to="/annonces" className="border-2 border-white/40 text-white font-display font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all">
              Explorer les annonces
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
