import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import Logo from "../components/ui/Logo";
import ThemeToggle from "../components/ui/ThemeToggle";
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
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar links={sidebarLinks} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64">
            <Sidebar links={sidebarLinks} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 glass-light border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 h-14">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
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
