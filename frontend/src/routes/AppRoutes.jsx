import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { setNavigateToLogin } from "../api/axios";
import PrivateRoute from "./PrivateRoute";

// Public pages
import HomePreview from "../pages/public/HomePreview";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import Listing from "../pages/public/Listing";
import AnnonceDetail from "../pages/public/AnnonceDetail";
import Search from "../pages/public/Search";
import Chatbot from "../pages/public/Chatbot";
import ConfirmEmail from "../pages/public/ConfirmEmail";
import ScoreRejet from "../pages/public/ScoreRejet";
import ForgotPassword from "../pages/public/ForgotPassword";
import ResetPassword from "../pages/public/ResetPassword";
import NotFound from "../pages/public/NotFound";

// Student pages
import DashboardEtudiant from "../pages/student/DashboardEtudiant";
import Favoris from "../pages/student/Favoris";
import ProfilEtudiant from "../pages/student/ProfilEtudiant";

// Owner pages
import DashboardProprietaire from "../pages/owner/DashboardProprietaire";
import PublierAnnonce from "../pages/owner/PublierAnnonce";
import MesAnnonces from "../pages/owner/MesAnnonces";
import ProfilProprietaire from "../pages/owner/ProfilProprietaire";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminModeration from "../pages/admin/AdminModeration";
import AdminSignalements from "../pages/admin/AdminSignalements";
import AdminUtilisateurs from "../pages/admin/AdminUtilisateurs";

// Pages with full-screen layouts (no navbar/footer)
const fullScreenPages = ["/login", "/register", "/confirm-email"];

export default function AppRoutes({ isDark, onToggleTheme }) {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigateToLogin(() => navigate("/login"));
  }, [navigate]);

  return (
    <Routes>
      {/* Auth - full screen */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public with layout */}
      <Route
        path="/"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <HomePreview />
          </MainLayout>
        }
      />
      <Route
        path="/home-preview"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <HomePreview />
          </MainLayout>
        }
      />
      <Route
        path="/annonces"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <Listing />
          </MainLayout>
        }
      />
      <Route
        path="/annonces/:id"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <AnnonceDetail />
          </MainLayout>
        }
      />
      <Route
        path="/search"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <Search />
          </MainLayout>
        }
      />
      <Route
        path="/chatbot"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <Chatbot />
          </MainLayout>
        }
      />
      <Route
        path="/score-rejet"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <ScoreRejet />
          </MainLayout>
        }
      />

      {/* Student dashboard — ETUDIANT only */}
      <Route
        path="/dashboard-etudiant"
        element={
          <PrivateRoute roles={["ETUDIANT"]}>
            <DashboardEtudiant isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />
      <Route
        path="/favoris"
        element={
          <PrivateRoute roles={["ETUDIANT"]}>
            <Favoris isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <PrivateRoute roles={["ETUDIANT"]}>
            <ProfilEtudiant isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />

      {/* Owner dashboard — PROPRIETAIRE only */}
      <Route
        path="/dashboard-proprietaire"
        element={
          <PrivateRoute roles={["PROPRIETAIRE"]}>
            <DashboardProprietaire
              isDark={isDark}
              onToggleTheme={onToggleTheme}
            />
          </PrivateRoute>
        }
      />
      <Route
        path="/publier-annonce"
        element={
          <PrivateRoute roles={["PROPRIETAIRE"]}>
            <PublierAnnonce isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />
      <Route
        path="/mes-annonces"
        element={
          <PrivateRoute roles={["PROPRIETAIRE"]}>
            <MesAnnonces isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />
      <Route
        path="/mes-annonces/:annonceId/modifier"
        element={
          <PrivateRoute roles={["PROPRIETAIRE"]}>
            <PublierAnnonce
              mode="edit"
              isDark={isDark}
              onToggleTheme={onToggleTheme}
            />
          </PrivateRoute>
        }
      />
      <Route
        path="/profil-proprietaire"
        element={
          <PrivateRoute roles={["PROPRIETAIRE"]}>
            <ProfilProprietaire isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />

      {/* Admin — ADMIN only */}
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={["ADMIN"]}>
            <AdminDashboard isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/moderation"
        element={
          <PrivateRoute roles={["ADMIN"]}>
            <AdminModeration isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/signalements"
        element={
          <PrivateRoute roles={["ADMIN"]}>
            <AdminSignalements isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/utilisateurs"
        element={
          <PrivateRoute roles={["ADMIN"]}>
            <AdminUtilisateurs isDark={isDark} onToggleTheme={onToggleTheme} />
          </PrivateRoute>
        }
      />

      {/* 404 - toute URL inconnue */}
      <Route
        path="*"
        element={
          <MainLayout isDark={isDark} onToggleTheme={onToggleTheme}>
            <NotFound />
          </MainLayout>
        }
      />
    </Routes>
  );
}
