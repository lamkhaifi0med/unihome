import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, MessageCircle, Moon, Sun } from "lucide-react";
import Logo from "../ui/Logo";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ links, isDark, onToggleTheme }) {
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

  const itemClass = (active) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }`;

  return (
    <aside className="sticky top-0 flex h-screen min-h-screen w-64 flex-col border-r border-zinc-200 bg-white px-4 py-6 font-geist dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-8 px-2">
        <Logo />
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]">
          {user?.nom?.[0] ?? "U"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {user?.nom}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {roleLabel}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-current={location.pathname === to ? "page" : undefined}
            className={itemClass(location.pathname === to)}
          >
            <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
            {label}
          </Link>
        ))}

        {isOwner && (
          <Link
            to="/chatbot?intent=owner-dashboard"
            className={`mt-2 ${itemClass(location.pathname === "/chatbot")}`}
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
            Assistant UniBot
          </Link>
        )}
      </nav>

      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Mode clair" : "Mode sombre"}
        </button>
      )}

      <button
        onClick={handleLogout}
        className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </button>
    </aside>
  );
}
