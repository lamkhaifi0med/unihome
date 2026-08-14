import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import Logo from "../components/ui/Logo";
import ChatbotWidget from "../components/chatbot/ChatbotWidget";

export default function DashboardLayout({
  children,
  sidebarLinks,
  isDark,
  onToggleTheme,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const showOwnerChatbot = [
    "/dashboard-proprietaire",
    "/publier-annonce",
    "/mes-annonces",
    "/profil-proprietaire",
  ].some((path) => location.pathname.startsWith(path));

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-geist text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          links={sidebarLinks}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64">
            <Sidebar
              links={sidebarLinks}
              isDark={isDark}
              onToggleTheme={onToggleTheme}
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
            className="relative z-10 mt-4 ml-3 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
          <Logo size="sm" />
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-5 sm:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      {showOwnerChatbot && (
        <ChatbotWidget
          contextLabel="Aide propriétaire : statut, score et amélioration"
          intentHint="owner-dashboard"
        />
      )}
    </div>
  );
}
