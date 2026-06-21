import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  MessageCircle,
  LogOut,
  UserRound,
} from "lucide-react";
import Logo from "../ui/Logo";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar({ isDark, onToggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  const navLinks = [
    { to: "/search", label: "Rechercher", icon: Search },
    { to: "/chatbot", label: "Assistant IA", icon: MessageCircle },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 shadow-sm shadow-indigo-500/5 backdrop-blur-2xl dark:border-white/10 dark:bg-dark-900/70">
      <div className="page-container">
        <div className="flex h-[4.5rem] items-center justify-between py-3">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 rounded-2xl border border-gray-200/70 bg-white/70 p-1 shadow-inner shadow-indigo-500/5 backdrop-blur-xl md:flex dark:border-white/10 dark:bg-white/[0.04]">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 font-body
                  ${
                    isActive(link.to)
                      ? "bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/25"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to={
                    user.role === "ETUDIANT"
                      ? "/dashboard-etudiant"
                      : user.role === "PROPRIETAIRE"
                        ? "/dashboard-proprietaire"
                        : "/admin"
                  }
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.nom[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.nom.split(" ")[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <UserRound className="h-4 w-4" />
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:shadow-primary-500/35"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-dark-800/95">
          <div className="page-container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
              >
                <link.icon className="h-4 w-4 text-primary-500" />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 dark:border-white/10 mt-2 pt-2 flex flex-col gap-1">
              {user ? (
                <>
                  <Link
                    to={
                      user.role === "ETUDIANT"
                        ? "/dashboard-etudiant"
                        : "/dashboard-proprietaire"
                    }
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Mon tableau de bord
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-left transition-colors"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary text-sm text-center mx-0"
                  >
                    S'inscrire gratuitement
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
