import { BrowserRouter } from 'react-router-dom'
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  const { isDark, toggleTheme } = useTheme()
  const auth = useAuthProvider()

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <AppRoutes isDark={isDark} onToggleTheme={toggleTheme} />
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
