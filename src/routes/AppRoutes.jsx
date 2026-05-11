import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'

// Public pages
import Home from '../pages/public/Home'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import RegisterEtudiant from '../pages/public/RegisterEtudiant'
import RegisterProprietaire from '../pages/public/RegisterProprietaire'
import Listing from '../pages/public/Listing'
import AnnonceDetail from '../pages/public/AnnonceDetail'
import Search from '../pages/public/Search'
import Chatbot from '../pages/public/Chatbot'
import ConfirmEmail from '../pages/public/ConfirmEmail'
import ScoreRejet from '../pages/public/ScoreRejet'

// Student pages
import DashboardEtudiant from '../pages/student/DashboardEtudiant'
import Favoris from '../pages/student/Favoris'
import ProfilEtudiant from '../pages/student/ProfilEtudiant'

// Owner pages
import DashboardProprietaire from '../pages/owner/DashboardProprietaire'
import PublierAnnonce from '../pages/owner/PublierAnnonce'
import MesAnnonces from '../pages/owner/MesAnnonces'
import ProfilProprietaire from '../pages/owner/ProfilProprietaire'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminModeration from '../pages/admin/AdminModeration'
import AdminSignalements from '../pages/admin/AdminSignalements'
import AdminUtilisateurs from '../pages/admin/AdminUtilisateurs'

// Pages with full-screen layouts (no navbar/footer)
const fullScreenPages = ['/login', '/register', '/register-etudiant', '/register-proprietaire', '/confirm-email']

export default function AppRoutes({ isDark, onToggleTheme }) {
  return (
    <Routes>
      {/* Auth - full screen */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-etudiant" element={<RegisterEtudiant />} />
      <Route path="/register-proprietaire" element={<RegisterProprietaire />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />

      {/* Public with layout */}
      <Route path="/" element={<MainLayout isDark={isDark} onToggleTheme={onToggleTheme}><Home /></MainLayout>} />
      <Route path="/annonces" element={<MainLayout isDark={isDark} onToggleTheme={onToggleTheme}><Listing /></MainLayout>} />
      <Route path="/annonces/:id" element={<MainLayout isDark={isDark} onToggleTheme={onToggleTheme}><AnnonceDetail /></MainLayout>} />
      <Route path="/search" element={<MainLayout isDark={isDark} onToggleTheme={onToggleTheme}><Search /></MainLayout>} />
      <Route path="/chatbot" element={<MainLayout isDark={isDark} onToggleTheme={onToggleTheme}><Chatbot /></MainLayout>} />
      <Route path="/score-rejet" element={<MainLayout isDark={isDark} onToggleTheme={onToggleTheme}><ScoreRejet /></MainLayout>} />

      {/* Student dashboard */}
      <Route path="/dashboard-etudiant" element={<DashboardEtudiant isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/favoris" element={<Favoris isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/profil" element={<ProfilEtudiant isDark={isDark} onToggleTheme={onToggleTheme} />} />

      {/* Owner dashboard */}
      <Route path="/dashboard-proprietaire" element={<DashboardProprietaire isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/publier-annonce" element={<PublierAnnonce isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/mes-annonces" element={<MesAnnonces isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/profil-proprietaire" element={<ProfilProprietaire isDark={isDark} onToggleTheme={onToggleTheme} />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/admin/moderation" element={<AdminModeration isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/admin/signalements" element={<AdminSignalements isDark={isDark} onToggleTheme={onToggleTheme} />} />
      <Route path="/admin/utilisateurs" element={<AdminUtilisateurs isDark={isDark} onToggleTheme={onToggleTheme} />} />
    </Routes>
  )
}
