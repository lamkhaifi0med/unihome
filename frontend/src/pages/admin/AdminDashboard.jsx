import { useEffect, useState } from "react";
import { LayoutDashboard, Shield, Flag, Users, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import { adminApi } from "../../api/adminApi";

const sidebarLinks = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/moderation", label: "Modération", icon: Shield },
  { to: "/admin/signalements", label: "Signalements", icon: Flag },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

export default function AdminDashboard({ isDark, onToggleTheme }) {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getQueue()])
      .then(([statsRes, queueRes]) => {
        setStats(statsRes.data);
        setQueue(queueRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
        <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Chargement...
        </div>
      </DashboardLayout>
    );
  }

  const enAttente = queue.filter((a) => a.statut === "EN_ATTENTE");

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
          Tableau de bord Admin
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Vue d'ensemble de la plateforme UniHome
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Utilisateurs inscrits" value={stats?.totalUtilisateurs?.toLocaleString() ?? "..."} color="indigo" />
        <StatCard icon={Shield} label="Annonces totales" value={stats?.totalAnnonces?.toLocaleString() ?? "..."} color="green" />
        <StatCard icon={Clock} label="En attente" value={stats?.annoncesEnAttente ?? "..."} color="orange" />
        <StatCard icon={Flag} label="Signalements" value={stats?.signalements ?? "..."} color="red" />
        <StatCard icon={CheckCircle} label="Validées" value={stats?.annoncesValidees ?? "..."} color="green" />
        <StatCard icon={AlertTriangle} label="Suspendues" value={stats?.annoncesSuspendues ?? "..."} color="red" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-light rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Annonces à modérer</h2>
            <Link to="/admin/moderation" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {enAttente.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                {a.photos?.[0] ? (
                  <img src={a.photos[0]} alt={a.titre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.titre}</p>
                  <p className="text-xs text-gray-400">Score: {a.scoreConfiance ?? "?"}/100 - {a.ville}</p>
                </div>
                <Link to="/admin/moderation" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0">Gérer</Link>
              </div>
            ))}
            {enAttente.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune annonce en attente</p>
            )}
          </div>
        </div>
        <div className="glass-light rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Actions rapides</h2>
          <Link to="/admin/moderation" className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">{stats?.annoncesEnAttente ?? 0} annonce(s) en attente</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Modérer maintenant</p>
            </div>
          </Link>
          <Link to="/admin/signalements" className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
            <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">{stats?.signalements ?? 0} signalement(s)</p>
              <p className="text-xs text-red-600 dark:text-red-400">Traiter les signalements</p>
            </div>
          </Link>
          <Link to="/admin/utilisateurs" className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{stats?.totalUtilisateurs ?? 0} utilisateurs</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Gérer les comptes</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
