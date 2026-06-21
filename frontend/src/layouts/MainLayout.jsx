import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ChatbotWidget from "../components/chatbot/ChatbotWidget";

export default function MainLayout({ children, isDark, onToggleTheme }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isDark={isDark} onToggleTheme={onToggleTheme} />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
