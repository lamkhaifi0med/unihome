import { Link } from 'react-router-dom'
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function ScoreRejet() {
  const raisons = [
    { label: 'Photos suspectes détectées', detail: 'Les images semblent correspondre à d\'autres annonces existantes (hash perceptuel pHash). Utilisez vos propres photos originales.', icon: '📷', score: 0 },
    { label: 'Description insuffisante', detail: 'La description est trop courte ou contient des mots suspects. Rédigez une description détaillée et authentique.', icon: '📝', score: -8 },
    { label: 'Prix incohérent', detail: 'Le loyer proposé est anormalement bas pour ce type de logement dans cette ville. Ajustez le prix à la réalité du marché.', icon: '💰', score: -12 },
  ]

  return (
    <div className="page-container py-12 max-w-2xl">
      <Link to="/mes-annonces" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 mb-8 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à mes annonces
      </Link>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Annonce Rejetée</h1>
        <p className="text-gray-500 dark:text-gray-400">Votre annonce a obtenu un score de confiance de <strong className="text-red-600 dark:text-red-400">28/100</strong>, inférieur au seuil minimum de 40.</p>
      </div>

      <div className="glass-light rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="font-display font-semibold text-gray-900 dark:text-white">Raisons du rejet</h2>
        </div>
        <div className="space-y-4">
          {raisons.map(({ label, detail, icon, score }) => (
            <div key={label} className="flex gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                  <span className="text-xs text-red-600 dark:text-red-400 font-mono">{score} pts</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-light rounded-2xl p-6 mb-6">
        <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Comment améliorer votre annonce ?</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {['Prenez de nouvelles photos originales de haute qualité', 'Rédigez une description complète et détaillée (min. 100 mots)', 'Vérifiez votre identité avec votre CIN (badge propriétaire vérifié)', 'Alignez votre prix avec les tarifs du marché local'].map(t => (
            <li key={t} className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">→</span> {t}
            </li>
          ))}
        </ul>
      </div>

      <Link to="/publier-annonce" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-display font-bold hover:from-primary-500 hover:to-accent-500 transition-all">
        <RefreshCw className="w-4 h-4" /> Republier avec corrections
      </Link>
    </div>
  )
}
