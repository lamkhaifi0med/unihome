import { Link } from "react-router-dom";
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ScoreRejet() {
  const raisons = [
    {
      label: "Photos suspectes détectées",
      detail:
        "Les images semblent correspondre à d'autres annonces existantes (analyse pHash). Utilisez vos propres photos originales.",
      icon: "📷",
      score: 0,
    },
    {
      label: "Description insuffisante",
      detail:
        "La description est trop courte ou contient des mots suspects. Rédigez une description détaillée et authentique.",
      icon: "📝",
      score: -8,
    },
    {
      label: "Prix incohérent",
      detail:
        "Le loyer proposé est anormalement bas pour ce type de logement dans cette ville. Ajustez le prix à la réalité du marché.",
      icon: "💰",
      score: -12,
    },
  ];

  return (
    <div className="page-container py-12 max-w-2xl">
      <Link
        to="/mes-annonces"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à mes annonces
      </Link>

      <div className="text-center mb-8">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-red-500">
          verdict ia · sous le seuil
        </p>
        <h1 className="mb-3 font-geist text-3xl font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
          Annonce rejetée
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Votre annonce n'a pas atteint le score minimum de 40 : score obtenu{" "}
          <strong className="font-mono tabular-nums text-red-600 dark:text-red-400">
            28/100
          </strong>
          .
        </p>
      </div>

      <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="font-geist font-semibold text-zinc-950 dark:text-white">
            Raisons du rejet
          </h2>
        </div>
        <div className="space-y-4">
          {raisons.map(({ label, detail, icon, score }) => (
            <div
              key={label}
              className="flex gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10"
            >
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-geist text-sm font-semibold text-zinc-950 dark:text-white">
                    {label}
                  </p>
                  <span className="font-mono text-xs tabular-nums text-red-600 dark:text-red-400">
                    {score} pts
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 font-geist font-semibold text-zinc-950 dark:text-white">
          Comment améliorer votre annonce ?
        </h3>
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          {[
            "Prenez de nouvelles photos originales de haute qualité",
            "Rédigez une description détaillée et authentique (minimum 100 mots)",
            "Vérifiez votre identité avec votre CIN pour obtenir le badge de propriétaire vérifié",
            "Alignez votre prix avec les tarifs du marché local",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-500">→</span> {t}
            </li>
          ))}
        </ul>
      </div>

      <Link
        to="/publier-annonce"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
      >
        <RefreshCw className="w-4 h-4" /> Republier avec corrections
      </Link>
    </div>
  );
}
