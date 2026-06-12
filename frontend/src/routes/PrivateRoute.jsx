import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLE_HOME = {
  ETUDIANT: "/dashboard-etudiant",
  PROPRIETAIRE: "/dashboard-proprietaire",
  ADMIN: "/admin",
};

/**
 * Protects a route by requiring authentication and optionally a specific role.
 *
 * Usage:
 *   <PrivateRoute roles={['ETUDIANT']}>
 *     <MyPage />
 *   </PrivateRoute>
 *
 * - Not logged in → /login (with ?redirect= so Login can send them back)
 * - Wrong role → redirected to their own dashboard
 */
export default function PrivateRoute({ children, roles }) {
  const { isLoggedIn, role } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(role)) {
    const home = ROLE_HOME[role] || "/";
    return <Navigate to={home} replace />;
  }

  return children;
}
