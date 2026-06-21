import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, MessageCircle } from "lucide-react";
import Logo from "../ui/Logo";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ links }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isOwner = user?.role === "PROPRIETAIRE";
  const roleLabel =
    {
      ETUDIANT: "Étudiant",
      PROPRIETAIRE: "Propriétaire",
      ADMIN: "Administrateur",
    }[user?.role] || user?.role;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="w-64 min-h-screen glass-light border-r border-gray-200 dark:border-white/10 flex flex-col py-6 px-4 sticky top-0 h-screen">
      <div className="mb-8 px-2">
        <Logo />
      </div>

      <div className="flex items-center gap-3 px-3 py-3 mb-6 rounded-xl bg-gray-50 dark:bg-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.nom?.[0] ?? "U"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {user?.nom}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {roleLabel}
          </p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${
                location.pathname === to
                  ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        {isOwner && (
          <Link
            to="/chatbot?intent=owner-dashboard"
            className={`mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${
                location.pathname === "/chatbot"
                  ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            Assistant UniBot
          </Link>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mt-4"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </aside>
  );
}
