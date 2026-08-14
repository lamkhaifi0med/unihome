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
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-[#fafafa]/85 font-geist backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between py-3">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200
                  ${
                    isActive(link.to)
                      ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100"
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
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {user.nom[0]}
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {user.nom.split(" ")[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100"
                >
                  <UserRound className="h-4 w-4" />
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-blue-600 px-[18px] py-2 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.55)] transition hover:bg-blue-700"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
        <div className="md:hidden border-t border-zinc-200 bg-[#fafafa]/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="page-container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <link.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-zinc-200 dark:border-zinc-800 mt-2 pt-2 flex flex-col gap-1">
              {user ? (
                <>
                  <Link
                    to={
                      user.role === "ETUDIANT"
                        ? "/dashboard-etudiant"
                        : "/dashboard-proprietaire"
                    }
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                    className="px-4 py-3 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
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
