import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function MainLayout({ children, isDark, onToggleTheme }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isDark={isDark} onToggleTheme={onToggleTheme} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
