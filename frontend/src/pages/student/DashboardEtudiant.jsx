import { useEffect, useState } from "react";
import {
  Home,
  Heart,
  User,
  Search,
  MessageCircle,
  Sparkles,
  MapPin,
  TrendingUp,
  Loader2,
  Wallet,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import AnnonceCard from "../../components/listing/AnnonceCard";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../hooks/useAuth";
import { useFavoris } from "../../hooks/useFavoris";
import { usersApi } from "../../api/usersApi";
import { searchApi } from "../../api/searchApi";

const sidebarLinks = [
  { to: "/dashboard-etudiant", label: "Tableau de bord", icon: Home },
  { to: "/favoris", label: "Mes favoris", icon: Heart },
  { to: "/profil", label: "Mon profil", icon: User },
  { to: "/search", label: "Rechercher", icon: Search },
  { to: "/chatbot", label: "Assistant IA", icon: MessageCircle },
];

export default function DashboardEtudiant({ isDark, onToggleTheme }) {
  const { user } = useAuth();
  const { favoris } = useFavoris();
  const [recommandations, setRecommandations] = useState([]);
  const [loadingReco, setLoadingReco] = useState(true);
  const [stats, setStats] = useState({ nbConsultations: 0 });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      // Load recommendations: nearest validated listings near student's university
      try {
        if (user?.universiteId) {
          const recoRes = await searchApi.searchNearUniversity({
            universiteId: user.universiteId,
            rayon: 5000,
            page: 0,
            size: 3,
          });
          if (mounted) setRecommandations(recoRes.data?.content || []);
        }
      } catch {
        if (mounted) setRecommandations([]);
      } finally {
        if (mounted) setLoadingReco(false);
      }

      // Load student stats (consultations count)
      try {
        const statsRes = await usersApi.getStats();
        if (mounted) setStats(statsRes.data || {});
      } catch {
        // silently ignore — stats are non-critical
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.universiteId]);

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">
          Bonjour, {user?.prenom || user?.nom?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {user?.universiteNom || "Étudiant UniHome"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Heart}
          label="Favoris sauvegardés"
          value={favoris.length}
          color="red"
        />
        <StatCard
          icon={Eye}
          label="Annonces consultées"
          value={stats.nbConsultations ?? 0}
          color="indigo"
        />
        <StatCard
          icon={Wallet}
          label="Budget max"
          value={user?.budgetMax ? `${user.budgetMax} DH` : "—"}
          color="green"
        />
        <StatCard
          icon={MapPin}
          label="Ville de recherche"
          value={user?.villeRecherche || "—"}
          color="purple"
        />
      </div>

      {/* Recommandations IA */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
            Annonces près de votre campus
          </h2>
        </div>
        {loadingReco ? (
          <div className="glass-light flex h-48 items-center justify-center rounded-2xl text-gray-500 dark:text-gray-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement des annonces...
          </div>
        ) : recommandations.length === 0 ? (
          <div className="glass-light rounded-2xl p-10 text-center text-gray-400 dark:text-gray-500">
            <p>Aucune annonce trouvée à proximité de votre campus.</p>
            <Link to="/search" className="btn-primary mt-4 inline-block">
              Rechercher manuellement
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {recommandations.map((a) => (
              <AnnonceCard key={a.id} annonce={a} />
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            to: "/search",
            icon: Search,
            label: "Nouvelle recherche",
            desc: "Trouver un logement",
            color: "indigo",
          },
          {
            to: "/favoris",
            icon: Heart,
            label: "Mes favoris",
            desc: `${favoris.length} annonces sauvegardées`,
            color: "red",
          },
          {
            to: "/chatbot",
            icon: MessageCircle,
            label: "Assistant IA",
            desc: "Obtenir de l'aide",
            color: "purple",
          },
        ].map(({ to, icon: Icon, label, desc, color }) => {
          const colors = {
            indigo:
              "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
            red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
            purple:
              "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
          };
          return (
            <Link
              key={to}
              to={to}
              className="glass-light rounded-2xl p-5 card-hover flex items-center gap-4"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-semibold text-gray-900 dark:text-white text-sm">
                  {label}
                </p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
