# UniHome — Frontend Bible
## The Complete React Developer Guide · A to Z

> This is your single reference for building the UniHome frontend.
> Read the whole thing before writing a single component.
> Every page, every component, every rule, every API call is specified here.
> When something is not in this document, ask before inventing.

---

## Table of Contents

1. [Your Job in One Paragraph](#1-your-job-in-one-paragraph)
2. [Tech Stack — What You Use and Why](#2-tech-stack--what-you-use-and-why)
3. [Project Setup — From Zero to Running](#3-project-setup--from-zero-to-running)
4. [Folder Structure — Every File Explained](#4-folder-structure--every-file-explained)
5. [Design System — Colors, Glass, Typography](#5-design-system--colors-glass-typography)
6. [Routing — All Pages and Who Can See Them](#6-routing--all-pages-and-who-can-see-them)
7. [Authentication — How It Works in React](#7-authentication--how-it-works-in-react)
8. [API Layer — How to Talk to the Backend](#8-api-layer--how-to-talk-to-the-backend)
9. [Shared Components — Build Once, Use Everywhere](#9-shared-components--build-once-use-everywhere)
10. [Page: Landing Page](#10-page-landing-page)
11. [Page: Register](#11-page-register)
12. [Page: Login](#12-page-login)
13. [Page: Email Confirmation](#13-page-email-confirmation)
14. [Page: Search](#14-page-search)
15. [Page: Listing Detail](#15-page-listing-detail)
16. [Page: Publish Listing (4 steps)](#16-page-publish-listing-4-steps)
17. [Page: My Listings (Owner)](#17-page-my-listings-owner)
18. [Page: Favorites (Student)](#18-page-favorites-student)
19. [Page: Profile](#19-page-profile)
20. [Component: Chatbot Widget](#20-component-chatbot-widget)
21. [Admin Pages](#21-admin-pages)
22. [State Management Rules](#22-state-management-rules)
23. [Error Handling — Every Case](#23-error-handling--every-case)
24. [Loading & Empty States](#24-loading--empty-states)
25. [Responsive Design Rules](#25-responsive-design-rules)
26. [Performance Rules](#26-performance-rules)
27. [How to Mock the Backend During Dev](#27-how-to-mock-the-backend-during-dev)
28. [Environment Variables](#28-environment-variables)
29. [Git Rules for Frontend](#29-git-rules-for-frontend)
30. [Final Checklist Before Handoff](#30-final-checklist-before-handoff)

---

## 1. Your Job in One Paragraph

You are building the React frontend for UniHome — a student housing platform for Morocco. Students use it to find apartments near their university. Owners use it to publish listings. An admin uses it to moderate fraud. Your frontend talks exclusively to the Spring Boot backend via REST API. You never call the Python AI microservice directly — that is the backend's job. Your primary goal is to make the experience fast, beautiful, trustworthy, and simple enough that a Moroccan student on a phone can find and contact a landlord in under 3 minutes.

---

## 2. Tech Stack — What You Use and Why

| Tool | Version | Why |
|------|---------|-----|
| React | 18 | UI framework |
| Vite | 5 | Build tool — faster than CRA |
| React Router DOM | v6 | Client-side routing |
| Axios | latest | HTTP calls to backend |
| React Hook Form | latest | All forms — no manual state for fields |
| Tailwind CSS | v3 | Utility-first styling |
| Leaflet + React Leaflet | latest | Maps — free, no API key |
| React Hot Toast | latest | Toast notifications |
| React Dropzone | latest | Photo upload drag & drop |

**Do NOT add:**
- Redux (overkill — React Context is enough)
- MUI or Ant Design (conflicts with custom glass design)
- Moment.js (use native `Intl.DateTimeFormat`)
- Any charting library unless admin stats are confirmed in scope

---

## 3. Project Setup — From Zero to Running

### Step 1 — Create the project

```bash
npm create vite@latest unihome-frontend -- --template react
cd unihome-frontend
```

### Step 2 — Install all dependencies at once

```bash
npm install react-router-dom axios react-hook-form
npm install leaflet react-leaflet
npm install react-hot-toast react-dropzone
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3 — Configure Tailwind

Open `tailwind.config.js` and replace its content:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#1E0A4E',
          800: '#2D1266',
          700: '#3D1A80',
          600: '#5B2D9E',
          500: '#7C3FBD',
          400: '#9D5FD4',
          300: '#B88AE8',
          200: '#D4B8F0',
          100: '#EEE0FA',
        },
        accent: {
          500: '#00D4FF',
          400: '#33DDFF',
          300: '#80EAFF',
        },
        bg: {
          base:     '#0A0A1A',
          surface:  '#0F0F2E',
          elevated: '#141432',
        },
      },
      fontFamily: {
        sans:     ['Inter', 'sans-serif'],
        heading:  ['Space Grotesk', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
```

### Step 4 — Configure global CSS

Replace `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS Variables — use these everywhere, never hardcode colors */
:root {
  --bg-base:          #0A0A1A;
  --bg-surface:       #0F0F2E;
  --bg-elevated:      #141432;

  --glass-white:      rgba(255, 255, 255, 0.06);
  --glass-white-md:   rgba(255, 255, 255, 0.10);
  --glass-white-lg:   rgba(255, 255, 255, 0.15);
  --glass-border:     rgba(255, 255, 255, 0.12);
  --glass-border-md:  rgba(255, 255, 255, 0.20);

  --primary-500:      #7C3FBD;
  --primary-400:      #9D5FD4;
  --accent-500:       #00D4FF;
  --accent-glow:      rgba(0, 212, 255, 0.3);

  --status-valid:     #10B981;
  --status-pending:   #7C3FBD;
  --status-danger:    #EF4444;
  --status-gold:      #F59E0B;

  --status-valid-bg:    rgba(16, 185, 129, 0.12);
  --status-pending-bg:  rgba(124, 63, 189, 0.12);
  --status-danger-bg:   rgba(239, 68, 68, 0.12);

  --text-primary:     #F0EEFF;
  --text-secondary:   #A89BC4;
  --text-muted:       #6B5F80;

  --grad-primary: linear-gradient(135deg, #3D1A80 0%, #7C3FBD 50%, #00D4FF 100%);
  --grad-card:    linear-gradient(135deg, rgba(61,26,128,0.4) 0%, rgba(0,212,255,0.1) 100%);
}

/* Apply everywhere */
body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

/* Reusable utility classes */
.glass-card {
  background: var(--glass-white);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

.glass-card-hover {
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.glass-card-hover:hover {
  background: var(--glass-white-md);
  border-color: var(--glass-border-md);
  box-shadow: 0 8px 32px rgba(124, 63, 189, 0.2);
}

.glass-input {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-primary);
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.glass-input:focus {
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(124, 63, 189, 0.25);
}
.glass-input::placeholder {
  color: var(--text-muted);
}

.btn-primary {
  background: var(--grad-primary);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-ghost {
  background: var(--glass-white);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border-md);
  border-radius: 12px;
  color: var(--text-primary);
  padding: 12px 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s, border-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-ghost:hover {
  background: var(--glass-white-md);
  border-color: var(--primary-400);
}

.text-gradient {
  background: var(--grad-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Leaflet map fix */
.leaflet-container { border-radius: 12px; }
```

### Step 5 — Fix Leaflet marker icons (Vite breaks them by default)

Create `src/utils/fixLeafletIcons.js`:

```js
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
})
```

Then import this once in `src/main.jsx`:

```jsx
import './utils/fixLeafletIcons'
import 'leaflet/dist/leaflet.css'
```

### Step 6 — Create `.env` file (never commit this)

```env
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=UniHome
```

### Step 7 — Create `.env.example` (commit this)

```env
VITE_API_URL=
VITE_APP_NAME=UniHome
```

### Step 8 — Verify it runs

```bash
npm run dev
# Should open at http://localhost:5173
```

---

## 4. Folder Structure — Every File Explained

```
src/
│
├── main.jsx                  ← Entry point. Import fixLeafletIcons + CSS here.
├── App.jsx                   ← React Router setup. All routes defined here.
│
├── api/                      ← EVERY backend call lives here. Nowhere else.
│   ├── axios.js              ← Axios instance + JWT interceptor + 401 handler
│   ├── authApi.js            ← register, login, confirmEmail
│   ├── annoncesApi.js        ← create, get, update, delete, edit annonce
│   ├── searchApi.js          ← search with filters, get recommendations
│   ├── consultationApi.js    ← create consultation, show contacts
│   ├── favoriApi.js          ← add/remove/list favorites
│   ├── avisApi.js            ← submit review, get reviews for annonce
│   ├── signalementApi.js     ← report a listing
│   ├── chatbotApi.js         ← send message to chatbot
│   ├── universiteApi.js      ← get list of universities (for dropdowns)
│   ├── photoApi.js           ← upload photo, delete photo
│   └── adminApi.js           ← moderation, user management
│
├── context/
│   └── AuthContext.jsx       ← Global auth state: user, token, role, login, logout
│
├── hooks/                    ← Reusable logic extracted from components
│   ├── useAuth.js            ← shortcut: useContext(AuthContext)
│   ├── useSearch.js          ← search state + debounce logic
│   ├── useAnnonce.js         ← fetch single annonce by id
│   └── useToast.js           ← wrapper for react-hot-toast
│
├── components/               ← Reusable UI blocks. No page-level logic here.
│   ├── common/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── ProtectedRoute.jsx      ← Redirects if not logged in
│   │   ├── RoleRoute.jsx           ← Redirects if wrong role
│   │   ├── ConfidenceBadge.jsx     ← Green/violet/red score badge
│   │   ├── LoadingSpinner.jsx      ← Centered spinner for page loads
│   │   ├── SkeletonCard.jsx        ← Pulsing placeholder for cards
│   │   └── Modal.jsx               ← Reusable modal wrapper
│   │
│   ├── annonce/
│   │   ├── AnnonceCard.jsx         ← Card shown in search results
│   │   ├── PhotoGallery.jsx        ← Swipeable photo gallery
│   │   ├── ContactSection.jsx      ← Shows contacts or "log in" gate
│   │   ├── EquipementList.jsx      ← Chips: WiFi, meublé, etc.
│   │   ├── AvisSection.jsx         ← Reviews list + submit form
│   │   ├── ScoreDetail.jsx         ← Circular score + 4-bar breakdown
│   │   └── ReportModal.jsx         ← Report reason selector modal
│   │
│   ├── search/
│   │   ├── SearchBar.jsx           ← University selector + main inputs
│   │   ├── FilterPanel.jsx         ← Budget slider, type pills, distance
│   │   ├── ResultsList.jsx         ← Scrollable list of AnnonceCards
│   │   ├── MapView.jsx             ← Leaflet map with markers
│   │   └── RecommendationsBlock.jsx ← "Pour toi" section at top of results
│   │
│   ├── publish/
│   │   ├── StepIndicator.jsx       ← Step 1-2-3-4 progress bar
│   │   ├── Step1Infos.jsx          ← Title, type, price, address, GPS
│   │   ├── Step2Photos.jsx         ← Drag & drop + preview + reorder
│   │   ├── Step3Equipements.jsx    ← Checkbox grid of equipment
│   │   └── Step4Contacts.jsx       ← Dynamic contact rows
│   │
│   └── chatbot/
│       └── ChatbotWidget.jsx       ← Floating button + chat window
│
├── pages/                    ← One file per route. Composes components.
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── EmailConfirmPage.jsx
│   ├── SearchPage.jsx
│   ├── AnnonceDetailPage.jsx
│   ├── PublishPage.jsx
│   ├── MesAnnoncesPage.jsx
│   ├── FavoritesPage.jsx
│   ├── ProfilePage.jsx
│   └── admin/
│       ├── AdminLayout.jsx         ← Sidebar + outlet for admin pages
│       ├── AdminDashboard.jsx
│       ├── ModerationQueue.jsx
│       ├── SignalementsPage.jsx
│       └── UtilisateursPage.jsx
│
└── utils/
    ├── constants.js          ← API URL, enums, city list, equipment list
    ├── formatters.js         ← formatPrice, formatDate, formatDistance
    ├── validators.js         ← Moroccan phone regex, email, etc.
    └── fixLeafletIcons.js    ← Fix Leaflet marker icons for Vite
```

---

## 5. Design System — Colors, Glass, Typography

### The visual philosophy

The entire UI uses **Glassmorphism Premium** — every panel looks like frosted glass floating over a deep purple-black background. Think high-end fintech app. Not flat, not material, not neumorphic. Glass.

**Every card, modal, input, and panel must use these properties:**
```css
background: rgba(255, 255, 255, 0.06);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.12);
border-radius: 16px;
```

### Color rules — never hardcode colors

Always use CSS variables (from `index.css`) or Tailwind config colors.

| Use case | Variable / Class |
|----------|-----------------|
| Page background | `bg-bg-base` or `var(--bg-base)` |
| Card background | `glass-card` class |
| Primary button | `btn-primary` class |
| Ghost button | `btn-ghost` class |
| Text — main | `var(--text-primary)` or `text-[#F0EEFF]` |
| Text — secondary | `var(--text-secondary)` or `text-[#A89BC4]` |
| Text — muted | `var(--text-muted)` |
| Gradient text | `text-gradient` class |
| Score badge ≥ 70 | `var(--status-valid)` green |
| Score badge 40-69 | `var(--status-pending)` violet |
| Score badge < 40 | `var(--status-danger)` red |

### Typography rules

- **Headings (h1, h2, h3):** `font-family: 'Space Grotesk'` — use Tailwind class `font-heading`
- **Body text:** `font-family: 'Inter'` — default, no class needed
- **Numbers and code:** `font-family: 'JetBrains Mono'` — use `font-mono`

### Spacing system

Use Tailwind's default spacing. The most common values:
- Card padding: `p-6` (24px)
- Section gap: `gap-6` or `gap-8`
- Between elements in a card: `gap-3` or `gap-4`
- Page max-width: `max-w-7xl mx-auto px-4`

### Shadows and glows

```css
/* Subtle card hover */
box-shadow: 0 8px 32px rgba(124, 63, 189, 0.2);

/* Active/selected element */
box-shadow: 0 0 0 3px rgba(124, 63, 189, 0.25);

/* Accent glow (cyan) */
box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
```

---

## 6. Routing — All Pages and Who Can See Them

### `src/App.jsx` — full route setup

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { lazy, Suspense } from 'react'

import ProtectedRoute from './components/common/ProtectedRoute'
import RoleRoute from './components/common/RoleRoute'
import LoadingSpinner from './components/common/LoadingSpinner'
import Navbar from './components/common/Navbar'
import ChatbotWidget from './components/chatbot/ChatbotWidget'

// Lazy load all pages
const LandingPage         = lazy(() => import('./pages/LandingPage'))
const LoginPage           = lazy(() => import('./pages/LoginPage'))
const RegisterPage        = lazy(() => import('./pages/RegisterPage'))
const EmailConfirmPage    = lazy(() => import('./pages/EmailConfirmPage'))
const SearchPage          = lazy(() => import('./pages/SearchPage'))
const AnnonceDetailPage   = lazy(() => import('./pages/AnnonceDetailPage'))
const PublishPage         = lazy(() => import('./pages/PublishPage'))
const MesAnnoncesPage     = lazy(() => import('./pages/MesAnnoncesPage'))
const FavoritesPage       = lazy(() => import('./pages/FavoritesPage'))
const ProfilePage         = lazy(() => import('./pages/ProfilePage'))
const AdminLayout         = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'))
const ModerationQueue     = lazy(() => import('./pages/admin/ModerationQueue'))
const SignalementsPage    = lazy(() => import('./pages/admin/SignalementsPage'))
const UtilisateursPage    = lazy(() => import('./pages/admin/UtilisateursPage'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
          }
        }} />
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            {/* Public routes */}
            <Route path="/"               element={<><Navbar /><LandingPage /></>} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/register"       element={<RegisterPage />} />
            <Route path="/confirm-email"  element={<EmailConfirmPage />} />
            <Route path="/search"         element={<><Navbar /><SearchPage /><ChatbotWidget /></>} />
            <Route path="/annonces/:id"   element={<><Navbar /><AnnonceDetailPage /><ChatbotWidget /></>} />

            {/* Student only */}
            <Route path="/mes-favoris" element={
              <ProtectedRoute><RoleRoute role="ETUDIANT">
                <><Navbar /><FavoritesPage /><ChatbotWidget /></>
              </RoleRoute></ProtectedRoute>
            } />

            {/* Owner only */}
            <Route path="/publier" element={
              <ProtectedRoute><RoleRoute role="PROPRIETAIRE">
                <><Navbar /><PublishPage /></>
              </RoleRoute></ProtectedRoute>
            } />
            <Route path="/publier/edit/:id" element={
              <ProtectedRoute><RoleRoute role="PROPRIETAIRE">
                <><Navbar /><PublishPage editMode /></>
              </RoleRoute></ProtectedRoute>
            } />
            <Route path="/mes-annonces" element={
              <ProtectedRoute><RoleRoute role="PROPRIETAIRE">
                <><Navbar /><MesAnnoncesPage /></>
              </RoleRoute></ProtectedRoute>
            } />

            {/* Any logged-in user */}
            <Route path="/profil" element={
              <ProtectedRoute><><Navbar /><ProfilePage /></></ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute><RoleRoute role="ADMIN"><AdminLayout /></RoleRoute></ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="moderation"   element={<ModerationQueue />} />
              <Route path="signalements" element={<SignalementsPage />} />
              <Route path="utilisateurs" element={<UtilisateursPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

---

## 7. Authentication — How It Works in React

### The golden rule

**The JWT token is NEVER stored in `localStorage` or `sessionStorage`.** Store it in React memory only (useState). If the user refreshes the page, they are logged out. This is correct behavior.

### `src/context/AuthContext.jsx` — build this first

```jsx
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  // user shape: { userId, prenom, email, role }
  const [token, setToken] = useState(null)

  const login = (tokenFromServer, userData) => {
    setToken(tokenFromServer)
    setUser(userData)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const isLoggedIn = !!token
  const role = user?.role || null

  return (
    <AuthContext.Provider value={{ user, token, role, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

### `src/components/common/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}
```

### `src/components/common/RoleRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RoleRoute({ role, children }) {
  const { role: userRole } = useAuth()
  if (userRole !== role) return <Navigate to="/" replace />
  return children
}
```

---

## 8. API Layer — How to Talk to the Backend

### The rule

Every single API call goes through a function in `src/api/`. No component ever calls axios directly. No `fetch()`. Only functions from `src/api/`.

### `src/api/axios.js` — configure this first

```js
import axios from 'axios'

// Create instance with base URL from .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// We need to inject the token from AuthContext into every request
// Because we can't use hooks here, we use a ref-based approach

let authToken = null

// Call this from AuthContext whenever token changes
export function setAxiosToken(token) {
  authToken = token
}

// Request interceptor — attach JWT to every request
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// Response interceptor — handle 401 globally
let logoutCallback = null
export function setAxiosLogout(fn) { logoutCallback = fn }

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && logoutCallback) {
      logoutCallback()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

Then update `AuthContext.jsx` to connect it:

```jsx
import { setAxiosToken, setAxiosLogout } from '../api/axios'

// Inside AuthProvider, add this useEffect:
useEffect(() => {
  setAxiosToken(token)
}, [token])

useEffect(() => {
  setAxiosLogout(logout)
}, [])
```

### `src/api/authApi.js`

```js
import api from './axios'

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  // data = { prenom, nom, email, motDePasse, role, universiteId?, budgetMax?, villeRecherche? }

  registerProprietaire: (formData) =>
    api.post('/api/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  // formData: user (JSON) + cinFile (file)

  login: (email, motDePasse) =>
    api.post('/api/auth/login', { email, motDePasse }),
  // Returns: { token, confirmationToken }

  confirmEmail: (token) =>
    api.get(`/api/auth/confirm?token=${token}`),

  resendConfirmation: (email) =>
    api.post('/api/auth/resend-confirmation', { email }),

  forgotPassword: (email) =>
    api.post('/api/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    api.post('/api/auth/reset-password', { token, newPassword }),
}
```

#### `src/api/logementsApi.js`

```js
import api from './axios'

export const logementsApi = {
  create: (formData) =>
    api.post('/api/logements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  // formData: logement (JSON) + justificatifFile (optional file)
}
```

#### `src/api/annoncesApi.js`

```js
import api from './axios'

export const annoncesApi = {
  publier: (logementId, formData) =>
    api.post(`/api/annonces/publier?logementId=${logementId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  rechercher: (params) =>
    api.get('/api/annonces/recherche', { params }),
  // params optionnels: universiteId, rayon, page, size
}
```

#### `src/api/avisApi.js`

```js
import api from './axios'

export const avisApi = {
  submit: (data) => api.post('/api/avis', data),
  // data = { etudiantId, annonceId, consultationId, note, commentaire }
}
```

#### `src/api/usersApi.js`

```js
import api from './axios'

export const usersApi = {
  getMe: () => api.get('/api/users/me'),
  updateMe: (data) => api.put('/api/users/me', data),
}
```

### Endpoints non disponibles dans le backend actuel (à mocker ou à attendre)

- `GET /api/annonces/:id`
- `GET /api/universites`
- `POST /api/consultations` et `PATCH /api/consultations/:id/show-contacts`
- `POST/DELETE /api/favoris`
- `POST /api/signalements`
- `POST /api/chatbot`
- Endpoints admin (`/api/admin/*`)
- Upload photos dédié (`/api/photos/*`)

---

## 9. Shared Components — Build Once, Use Everywhere

### `ConfidenceBadge.jsx`

```jsx
// Props: score (number or null), size ('sm' | 'md' | 'lg')
export default function ConfidenceBadge({ score, size = 'md' }) {
  if (score === null || score === undefined) {
    return <span className="badge badge-gray">Analyse en cours</span>
  }
  if (score >= 70) return (
    <span style={{
      background: 'var(--status-valid-bg)',
      color: 'var(--status-valid)',
      border: '1px solid var(--status-valid)',
      borderRadius: '20px', padding: '3px 10px',
      fontSize: size === 'sm' ? '11px' : '13px', fontWeight: 600
    }}>
      ✓ {score}/100
    </span>
  )
  if (score >= 40) return (
    <span style={{
      background: 'var(--status-pending-bg)',
      color: 'var(--status-pending)',
      border: '1px solid var(--status-pending)',
      borderRadius: '20px', padding: '3px 10px',
      fontSize: size === 'sm' ? '11px' : '13px', fontWeight: 600
    }}>
      ⏳ {score}/100
    </span>
  )
  return (
    <span style={{
      background: 'var(--status-danger-bg)',
      color: 'var(--status-danger)',
      border: '1px solid var(--status-danger)',
      borderRadius: '20px', padding: '3px 10px',
      fontSize: size === 'sm' ? '11px' : '13px', fontWeight: 600
    }}>
      ✗ {score}/100
    </span>
  )
}
```

### `LoadingSpinner.jsx`

```jsx
export default function LoadingSpinner({ fullPage = false }) {
  const spinner = (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: '3px solid var(--glass-border)',
      borderTop: '3px solid var(--primary-400)',
      animation: 'spin 0.8s linear infinite'
    }} />
  )
  if (fullPage) return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)'
    }}>
      {spinner}
    </div>
  )
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      {spinner}
    </div>
  )
}
```

Add to `index.css`:
```css
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
```

### `SkeletonCard.jsx` — for loading states

```jsx
export default function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 16, display: 'flex', gap: 12 }}>
      <div style={{
        width: 120, height: 120, borderRadius: 12,
        background: 'var(--glass-white-md)',
        animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0
      }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[80, 60, 100, 50].map((w, i) => (
          <div key={i} style={{
            height: 12, width: `${w}%`, borderRadius: 6,
            background: 'var(--glass-white-md)',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`
          }} />
        ))}
      </div>
    </div>
  )
}
```

### `Modal.jsx`

```jsx
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16
    }} onClick={onClose}>
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: 480, padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 20
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

---

## 10. Page: Landing Page

**File:** `src/pages/LandingPage.jsx`
**Who sees it:** Everyone (public)
**Purpose:** Explain what UniHome is and convert visitors to registered users

### Section 1 — Hero (full viewport height)

What it contains:
- Background: dark base color with a slow animated radial gradient (CSS animation only, no JS)
- Small pill badge at the top: `"🔒 Plateforme anti-arnaque IA · Maroc"`
- Big headline using `text-gradient` class: `"Trouve ton logement étudiant en toute confiance"`
- Subtitle in secondary text color
- Two buttons side by side: "Commencer la recherche" (primary, goes to `/search`) and "Comment ça marche" (ghost, scrolls down to section 3)
- Three mini stats below buttons in small glass cards: "1 200+ annonces" / "40+ universités" / "Score IA sur chaque annonce"

How to build the animated background:
```css
.hero-bg {
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
}
.hero-bg::before {
  content: '';
  position: absolute;
  top: -30%;
  left: 20%;
  width: 60%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(124,63,189,0.25) 0%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}
.hero-bg::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: 10%;
  width: 40%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(0,212,255,0.12) 0%, transparent 70%);
  animation: float 10s ease-in-out infinite reverse;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, -30px); }
}
```

### Section 2 — How the score works (3 glass cards)

Three cards in a row (on mobile: stack vertically):
1. Shield icon + "Identité vérifiée" — describe CIN manual review
2. Brain icon + "Analyse IA automatique" — describe 4 layers
3. Users icon + "Signalement communautaire" — describe 3 reports = auto-suspend

Below the 3 cards: a visual horizontal bar going from red (0) → violet (50) → green (100) with three labels below: "Refusé", "En révision", "Publié automatiquement"

### Section 3 — How it works (4 steps)

Horizontal timeline on desktop, vertical on mobile:
1. "Crée ton compte" 2. "Lance ta recherche" 3. "Consulte les fiches" 4. "Contacte le propriétaire"

Each step: a numbered circle with gradient border, a short title, a short description.

### Section 4 — Featured cities

A grid of 6 glass cards, one per city:
`Fès · Casablanca · Rabat · Marrakech · Meknès · Kénitra`
Each has: city name + "X annonces disponibles" + a "Voir les annonces →" link that goes to `/search?ville=xxx`

### Section 5 — Owner CTA

A full-width glass panel with:
- "Vous êtes propriétaire ?"
- "Publiez votre annonce gratuitement."
- A button "Déposer une annonce" → `/register?role=PROPRIETAIRE`

---

## 11. Page: Register

**File:** `src/pages/RegisterPage.jsx`
**Who sees it:** Everyone (if logged in, redirect to home)

### Step 1 — Role selector

Before showing any form, show two big glass cards:
- Card 1: graduation cap icon + "Je suis étudiant" + "Je cherche un logement" — clicking selects ETUDIANT
- Card 2: house icon + "Je suis propriétaire" + "Je propose un logement" — clicking selects PROPRIETAIRE

Selected card gets: accent cyan border + slight glow. The other card fades slightly.

After selecting, the form below animates in (smooth height transition).

### Step 2 — The form

Use `react-hook-form`. One form for both roles, some fields hidden based on role selection.

**Common fields (both roles):**
- Prénom (required)
- Nom (required)
- Email (required, email validation)
- Mot de passe (required, min 8 chars, show/hide toggle)
- Confirmer le mot de passe (must match)

**Student-only fields** (shown if role = ETUDIANT):
- Université (dropdown — backend `/api/universites` pas encore dispo, utiliser une liste locale temporaire)
- Budget maximum (number, suffix "DH/mois")
- Ville de recherche (text input)

**Owner-only fields** (shown if role = PROPRIETAIRE):
- Numéro de téléphone (required, Moroccan phone validation)
- Numéro CIN (required)
- Photo de la CIN (required — drag & drop zone):
  - Shows preview after file selected
  - Shows message: "Votre CIN sera vérifiée sous 24h par notre équipe"

**Submit button:** "Créer mon compte" (full width, primary)

**Below form:** "Déjà inscrit ? Se connecter" link

### Post-submit success state

Replace the form with:
- Big checkmark icon (animated, green)
- "Compte créé ! Vérifiez votre email."
- "Un lien de confirmation a été envoyé à [email]"
- Small link: "Pas reçu ? Renvoyer l'email"

### Field-level error messages

Show errors below each field in red (`var(--status-danger)`), small text (12px).

---

## 12. Page: Login

**File:** `src/pages/LoginPage.jsx`
**Who sees it:** Everyone (if logged in, redirect to home)

### Form

- Email field
- Mot de passe field (with show/hide toggle)
- "Mot de passe oublié ?" small link (non-functional — just UI)
- "Se connecter" button (full width, primary)

### What happens on submit

1. Show loading state on button ("Connexion en cours...")
2. Call `authApi.login(email, password)`
3. On success: save `token` in AuthContext, then call `usersApi.getMe()` to fetch user data
4. Redirect based on role from `/api/users/me`:
   - ETUDIANT → `/search`
   - PROPRIETAIRE → `/mes-annonces`
   - ADMIN → `/admin`
5. On error 401: show error "Email ou mot de passe incorrect"
6. On error "email not confirmed": show banner "Votre email n'est pas confirmé. " + "Renvoyer un lien" button

### Layout

Centered card (max-width 440px) floating on the dark background. Same ambient glow behind the card as register page.

---

## 13. Page: Email Confirmation

**File:** `src/pages/EmailConfirmPage.jsx`
**Accessed via:** link in confirmation email, URL: `/confirm-email?token=xxx`

### States

1. **Loading** — while calling `authApi.confirmEmail(token)`: show spinner
2. **Success** — show checkmark + "Email confirmé ! Vous pouvez vous connecter." + "Se connecter" button → `/login`
3. **Error** (expired or invalid token) — show ✗ icon + "Ce lien a expiré ou est invalide." + "Renvoyer un lien" button

Get the token from URL: `const [searchParams] = useSearchParams(); const token = searchParams.get('token')`

---

## 14. Page: Search

**File:** `src/pages/SearchPage.jsx`
**Who sees it:** Everyone (contacts hidden if not logged in)

This is the most important page. Build it carefully.

### Backend actuel (limites)

- Endpoint disponible: `GET /api/annonces/recherche`
- Parametres pris en charge: `universiteId` + `rayon` (+ pagination)
- Les autres filtres (budget, equipements, type, tri) ne sont pas encore servis par l'API.
  Pour les tests, creer des donnees dans la base pour couvrir ces cas.

### Layout — Two panels

**Desktop:** Fixed left panel (420px) + right panel fills the rest (map)
**Mobile:** Top filters + scrollable results + "Voir la carte" button that opens map in a bottom sheet overlay

### Left panel — top: Search & filters

**University selector:**
- Searchable dropdown of all universities
- Groups them by city (Fès, Casablanca, Rabat, etc.)
- Selecting a university sets the search center coordinates
- This is how all geographic search works — NOT by typing a city name
- Backend `/api/universites` pas encore dispo → liste locale temporaire

**Filter controls:**
- Type pills: "Tous" · "Studio" · "Chambre" · "Colocation" · "Appartement" — clicking toggles selection (can select one at a time)
- Budget slider: range 300–5000 DH, shows live value label above thumb
- Distance slider: range 500m–10km, shows live value "≤ X km"
- "Plus de filtres" accordion that opens:
  - Surface min (number input, "m²")
  - Equipment checkboxes (WiFi, Meublé, etc.)
  - Charges incluses toggle

**Sync filters to URL params:**
```jsx
const [searchParams, setSearchParams] = useSearchParams()
// When any filter changes:
setSearchParams({ universiteId, budget, rayon, type, ...etc })
// On mount, read from URL to restore state (back button works)
```

**Sort bar:** "X annonces" count + sort dropdown right-aligned

### Left panel — bottom: Results

**Recommendations block** (only if logged in as ETUDIANT):
```jsx
// Small section header pill: "✨ Pour toi"
// 1-3 AnnonceCards with a special accent border
// Each shows the 'raison' text from Gemini below the price
```

**Regular results:**
Scrollable list of `AnnonceCard` components. Call `annoncesApi.rechercher(params)` when filters change (debounced 300ms).

**Hovering a card highlights its map marker (and vice versa):**
```jsx
const [hoveredId, setHoveredId] = useState(null)
// Pass setHoveredId to ResultsList, pass hoveredId to MapView
// MapView uses this to scale up the hovered marker
```

### `AnnonceCard` component spec

Build this in `src/components/annonce/AnnonceCard.jsx`

**Layout:** horizontal card — thumbnail left (120×120px), content right

**Content:**
- Top right of thumbnail: `ConfidenceBadge` with score
- Title (bold, 1 line, truncate with ellipsis)
- Location line: 📍 + address + "· X km de [Université]"
- Price: "1 200 DH / mois" in large primary-300 color + "Charges incluses" chip if applicable
- Equipment chips: show max 3, then "+X" if more
- Bottom row: owner initials circle + name + verified badge if CIN verified + heart icon

**Heart icon behavior:**
- If not logged in: clicking shows toast "Connectez-vous pour sauvegarder"
- If logged in: clicking calls `favoriApi.add()` or `favoriApi.remove()`, updates icon state immediately (optimistic update)

### Right panel — Map

Build `MapView` in `src/components/search/MapView.jsx`

**Critical:** wrap Leaflet import in a try-catch. Leaflet doesn't work with SSR.

```jsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Custom colored circle marker
const createMarker = (score) => L.divIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: ${score >= 70 ? '#10B981' : score >= 40 ? '#7C3FBD' : '#EF4444'};
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: white; font-weight: bold;
  ">${score}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})
```

Map markers:
- One per annonce, colored by score
- University campus marker: use a graduation cap emoji as a div icon
- Clicking a marker: select that annonce, scroll list to that card

---

## 15. Page: Listing Detail

**File:** `src/pages/AnnonceDetailPage.jsx`
**Who sees it:** Everyone (contacts hidden if not logged in)

**Note backend actuel:** `GET /api/annonces/:id` n'existe pas encore. Attendre l'endpoint.

Get annonce id from URL: `const { id } = useParams()`
On mount (quand l'endpoint existe): call `annoncesApi.getById(id)` and `consultationApi.create(id)` (if logged in)

### Layout

Max-width 1200px, two columns on desktop:
- Left: photos + info + description + equipment + location map + reviews
- Right: sticky sidebar

### Left column contents

**1. Photo gallery** (`PhotoGallery` component):
- Large main photo (full width, max height 480px, object-fit cover)
- Thumbnail row below (horizontal scroll, clickable to swap main)
- Counter badge on main photo: "3 / 7"

**2. Title + location:**
- H1 title of the listing
- "📍 [adresse]" link to Google Maps
- "X km de [université]" — distance from the student's selected university

**3. Key info row (4 glass micro-cards):**
Studio · 28 m² · 1 200 DH/mois · Charges incluses

**4. Description:**
- Show first 200 chars
- "Voir plus" button expands the rest (no page reload — just useState)

**5. Equipment:** chips grid using `EquipementList` component

**6. Location mini-map:**
- Small Leaflet map (height 200px, non-interactive: `dragging={false} zoomControl={false}`)
- Single pin at listing coordinates
- Below map: "X mètres · X min à pied de [Université]"

**7. Reviews section** (`AvisSection` component):
- List of reviews (glass cards, compact)
- Each: stars + comment + student first name + date
- If `valide_par_ia = false`: show "En attente de validation" and hide comment text
- If `contacts_affiches = true` AND no review yet: show review form (stars + textarea + submit)
- If `contacts_affiches = false`: gray banner "Consultez les coordonnées du propriétaire pour laisser un avis"
- "Signaler cette annonce" link at bottom → opens `ReportModal`

### Right column — sticky sidebar

**1. Owner info:**
- Avatar (initials circle)
- Name + "Propriétaire vérifié ✓" if `est_verifie_cin = true`
- Star rating + "(X avis)"
- "Membre depuis [date]"

**2. Confidence score circular display** (`ScoreDetail` component):
- SVG circle progress bar colored by score range
- Center: big number + "/100"
- Label: "Score de confiance"
- Collapsible breakdown: 4 mini bars showing Identité/Texte/Photos/Prix each with X/30, X/25, X/25, X/20

**3. Contact section** (`ContactSection` component):

```jsx
// Logic:
// 1. On mount: check if consultation with contacts_affiches=true exists
// 2. If yes: show contacts directly
// 3. If no: show "Afficher les coordonnées" button
//    - Clicking sets loading, calls consultationApi.showContacts(consultationId)
//    - On success: reveal contacts with animation
// 4. If not logged in: show "Connectez-vous pour voir les contacts" + login button
```

Contact rows once revealed:
- 📞 phone number → `tel:` link
- 💬 WhatsApp → `https://wa.me/` link (opens WhatsApp directly)
- ✉️ email → `mailto:` link
- f Facebook → opens in new tab
- 📷 Instagram → opens in new tab

**4. Favorite button:**
- Full width ghost button with heart icon
- "Sauvegarder" / "Sauvegardé ❤️"
- Optimistic toggle (update UI immediately, then call API)

**5. Share button:**
- "Copier le lien" → `navigator.clipboard.writeText(window.location.href)` → toast "Lien copié !"

---

## 16. Page: Publish Listing (4 steps)

**File:** `src/pages/PublishPage.jsx`
**Who can access:** PROPRIETAIRE only (RoleRoute enforces this)
**Props:** `editMode` (boolean) — if true, pre-fill with existing data

### Backend actuel (flow obligatoire)

Le backend demande un `logementId` pour publier une annonce.
Le flow actuel est:
1) `POST /api/logements` (multipart) → recuperer `logementId`
2) `POST /api/annonces/publier?logementId=...` (multipart) pour creer l'annonce

### Step management

```jsx
const [currentStep, setCurrentStep] = useState(1)
const [formData, setFormData] = useState({
  // step 1
  titre: '', description: '', type: '', loyer: '', chargesIncluses: false,
  adresse: '', ville: '', superficie: '', universiteProche: '',
  latitude: null, longitude: null,
  // step 2
  photos: [],   // [{ photoId, url, estPrincipale, ordre }]
  // step 3
  equipements: [],   // [equipementId, ...]
  // step 4
  contacts: [{ plateforme: 'TELEPHONE', valeur: '' }]
})
```

### `StepIndicator` component

```
[1 Infos de base] → [2 Photos] → [3 Équipements] → [4 Contacts]
```
- Completed steps: filled circle with checkmark
- Current step: filled gradient circle with number
- Future steps: empty circle with border

### Step 1 — Informations de base

Use `react-hook-form`. Fields:

- Titre (text, required, max 200 chars, character counter shown)
- Type (4 pill buttons: Studio / Chambre / Colocation / Appartement — required, select one)
- Description (textarea, required, min 50 chars, character counter)
- Loyer en DH (number, required) + "Charges incluses" toggle next to it
- Superficie en m² (number)
- Adresse complète (text, required)
- Ville (dropdown: Fès, Casablanca, Rabat, Marrakech, Meknès, Kénitra, Autre)
- Université la plus proche (dropdown, from API)

**GPS map picker:**
- Small Leaflet map (height 250px, draggable)
- Default center: coordinates of selected university
- User drags a pin to the exact property location
- Below map: show live coordinates "34.0531, -5.0033"
- On pin drag, update `formData.latitude` and `formData.longitude`

**Validation before going to Step 2:**
Check all required fields. Show inline errors. Don't navigate if errors exist.

### Step 2 — Photos

**Dropzone** (react-dropzone):
```jsx
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: { 'image/jpeg': [], 'image/png': [] },
  maxSize: 5 * 1024 * 1024,  // 5MB
  onDrop: handleDrop,
})
```

On drop:
1. Validate min 2, max 10 photos
2. Store files in state (no upload yet)
3. Upload happens only on submit via `annoncesApi.publier(...)` (backend expects photos in multipart)

**Preview grid:**
- Draggable (can reorder — use simple index swap, not a heavy drag library)
- Each photo: thumbnail + trash button + star button (mark as main)
- Main photo shows a star badge

**Counter:** "3 / 10 photos ajoutées"

**Validation before Step 3:** minimum 2 photos required

### Step 3 — Équipements

Grid of clickable chips. Clicking toggles selection.

**Equipment list** (from `src/utils/constants.js`):
```js
export const EQUIPEMENTS = [
  { id: 'wifi',     nom: 'WiFi',          icone: '📶' },
  { id: 'meuble',   nom: 'Meublé',        icone: '🛋️' },
  { id: 'cuisine',  nom: 'Cuisine équip.', icone: '🍳' },
  { id: 'parking',  nom: 'Parking',       icone: '🅿️' },
  { id: 'clim',     nom: 'Climatisation', icone: '❄️' },
  { id: 'chauffage',nom: 'Chauffage',     icone: '🔥' },
  { id: 'ascenseur',nom: 'Ascenseur',     icone: '🛗' },
  { id: 'gardien',  nom: 'Gardien 24h',   icone: '👮' },
  { id: 'balcon',   nom: 'Balcon / Terrasse', icone: '🏗️' },
  { id: 'lavelinge',nom: 'Lave-linge',    icone: '🫧' },
  { id: 'eauchaude',nom: 'Eau chaude',    icone: '🚿' },
  { id: 'charges',  nom: 'Charges incl.', icone: '💡' },
]
```

No minimum — step 3 is optional. Click "Suivant" to go to step 4.

### Step 4 — Contacts + Submit

**Dynamic contact rows:**
```jsx
// Each row:
// [Dropdown: Téléphone | WhatsApp | Email | Facebook | Instagram] [Value input] [Trash button]
// "+" button adds a new row
// Max 5 rows, one per platform (hide platforms already used)
```

**Validation:**
- At least 1 contact required
- At least one of: Téléphone ou WhatsApp
- Phone/WhatsApp: regex `/^(\+212|0)[67]\d{8}$/`
- Email: standard email regex

**Summary panel (collapsed by default, "Voir le résumé" expands it):**
Shows key data from all 4 steps.

**Submit button:** "Soumettre l'annonce" — calls `logementsApi.create()` puis `annoncesApi.publier(logementId, formData)`

### Post-submit states

**Score ≥ 70 — VALIDEE:**
```
✅ (big green checkmark animation)
"Votre annonce est publiée !"
"Score de confiance : 87/100"
[Voir mon annonce] button
```

**Score 40–69 — EN_ATTENTE:**
```
⏳ (clock animation)
"Votre annonce est en cours d'analyse"
"Notre équipe la vérifiera dans les prochaines heures."
```

**Score < 40 — REJETEE:**
```
❌ (red X animation)
"Votre annonce n'a pas pu être publiée"
4-bar breakdown showing what failed
[Modifier et réessayer] button
```

---

## 17. Page: My Listings (Owner)

**File:** `src/pages/MesAnnoncesPage.jsx`
**Who can access:** PROPRIETAIRE only

**Note backend actuel:** `GET /api/annonces/mes-annonces` n'existe pas encore. Attendre l'endpoint.

### Header

"Mes annonces" H1 + "Nouvelle annonce" button (primary, top right) → `/publier`

### Stats row — 4 glass micro-cards

Fetched from `annoncesApi.getMesAnnonces()`:
- Total annonces actives
- Total consultations (sum of views)
- Note moyenne (stars display)
- Annonces en attente

### Tabs

"Actives" · "En attente" · "Archivées" · "Rejetées"

Each tab shows filtered listings. Count badge on each tab label.

### Each listing card

Horizontal glass card:
- Thumbnail (80×80px, rounded)
- Title + city + address
- `ConfidenceBadge` with score
- Status badge (VALIDEE=green / EN_ATTENTE=violet / SUSPENDUE=red / ARCHIVEE=gray)
- "X vues · X favoris"
- "Publiée le X · Expire le X"
- Three-dots menu with: "Modifier" → `/publier/edit/:id` / "Archiver" (confirm modal) / "Voir l'annonce" → `/annonces/:id`

---

## 18. Page: Favorites

**File:** `src/pages/FavoritesPage.jsx`
**Who can access:** ETUDIANT only

**Note backend actuel:** endpoints favoris non disponibles. Attendre l'endpoint.

### Header

"Mes annonces sauvegardées" + count badge

### Content

Grid, 2 columns on desktop / 1 on mobile.

Fetch: `favoriApi.getAll()`

Each is an `AnnonceCard` but with:
- Filled heart icon (always)
- "Retirer" button appears on hover (calls `favoriApi.remove()`)

**If annonce has expired or been suspended:**
- Show card with 40% opacity overlay
- Badge: "Annonce expirée" or "Annonce suspendue"
- "Voir des annonces similaires" small link

**Empty state:**
Heart illustration + "Vous n'avez pas encore sauvegardé d'annonce" + "Commencer la recherche" button

---

## 19. Page: Profile

**File:** `src/pages/ProfilePage.jsx`
**Who can access:** Any logged-in user

### Layout

Sidebar (240px, sticky) + main area

### Sidebar

- Avatar circle (big, shows initials or photo)
- Name
- Role badge (Étudiant / Propriétaire)
- University badge (if student)
- "Modifier la photo" small link

### Main area — Student profile

Sections:

**"Informations personnelles":**
Form fields (pre-filled, editable):
- Prénom, Nom
- Email (read-only — cannot change email)
- Université (dropdown)
- Budget maximum
- Ville de recherche
- Save button → `PUT /api/users/me`

**"Sécurité":**
- Current password
- New password
- Confirm new password
- Save button

### Main area — Owner profile

Same structure but:
- Téléphone (editable)
- Numéro CIN (read-only after first entry)
- CIN status display:
  - If verified: "✅ CIN vérifiée" in green
  - If pending: "⏳ En attente de vérification" in violet + "Notre équipe vérifiera votre identité sous 24h"
  - Re-upload CIN button if not verified

---

## 20. Component: Chatbot Widget

**File:** `src/components/chatbot/ChatbotWidget.jsx`
**Where it appears:** On SearchPage, AnnonceDetailPage, FavoritesPage (all non-auth pages)

**Note backend actuel:** `POST /api/chatbot` n'existe pas encore. Attendre l'endpoint.

### Trigger button

Fixed position, bottom-right:
```css
position: fixed;
bottom: 24px;
right: 24px;
z-index: 999;
```
56×56px circle, gradient background, chat bubble icon.
On first load: show a pulsing ring animation (3 pulses then stops).

### Chat window

Appears above the button when clicked. Animates in from bottom.

Dimensions: 360px wide × 500px tall (desktop), full-screen on mobile.

**Structure:**
```
Header: "UniBot 🤖" + close button
───────────────────────────────────
Message area (scrollable)
  - Bot messages: left, glass card style, violet avatar icon
  - User messages: right, gradient background
───────────────────────────────────
Quick action chips (shown initially):
  "Logements à Fès" | "Comment ça marche ?" | "Signaler une arnaque"
───────────────────────────────────
Input: text field + send button
```

**Session ID management:**
```jsx
const [sessionId] = useState(() => crypto.randomUUID())
// This persists for the lifetime of the component (as long as page is open)
```

**API call:**
```jsx
const sendMessage = async (message) => {
  // 1. Add user message to chat immediately
  setMessages(prev => [...prev, { role: 'user', content: message }])
  setInput('')
  setIsLoading(true)

  // 2. Call API
  const { data } = await chatbotApi.send(message, sessionId)

  // 3. Add bot reply
  setMessages(prev => [...prev, { role: 'bot', content: data.reply }])
  setIsLoading(false)
}
```

**Welcome message** (auto-shown on first open):
"Bonjour 👋 Je suis UniBot, votre assistant UniHome. Comment puis-je vous aider ?"

---

## 21. Admin Pages

**Note backend actuel:** endpoints admin (`/api/admin/*`) non disponibles. Attendre l'endpoint.

### `AdminLayout.jsx`

Left sidebar (200px) + main content (`<Outlet />` from React Router)

Sidebar links:
- "Dashboard" → `/admin`
- "File d'attente" → `/admin/moderation` + count badge (fetch on mount)
- "Signalements" → `/admin/signalements` + count badge
- "Utilisateurs" → `/admin/utilisateurs`

### `AdminDashboard.jsx`

4 KPI glass cards in a 2×2 grid:
- Annonces actives (green border)
- En attente (violet border)
- Signalements ouverts (red border)
- Nouveaux utilisateurs ce mois (cyan border)

### `ModerationQueue.jsx`

Tabs: "En attente (X)" · "Suspendues (X)"

Each listing card:
- Thumbnail (left)
- Title + address + owner name
- Score breakdown: 4 mini progress bars (Identité / Texte / Photos / Prix)
- Date submitted
- 3 action buttons:
  - "Valider ✓" — green — `adminApi.validerAnnonce(id)` → removes from list
  - "Rejeter ✗" — red — opens modal asking for rejection reason → `adminApi.rejeterAnnonce(id, raison)`
  - "Correction" — ghost — opens modal to write a message to owner

### `SignalementsPage.jsx`

Table with columns:
- Annonce title
- Reporter (student name)
- Reason
- Date
- Status chip
- "Voir l'annonce" link (opens in new tab)
- "Traiter" button → modal with options: Suspendre / Rejeter le signalement / Valider

### `UtilisateursPage.jsx`

Search bar at top (searches by name or email).

Table with columns:
- Name + email
- Role badge
- Status (Actif / Suspendu)
- Date inscription
- Actions:
  - For owners with unverified CIN: "Valider CIN" button
  - "Suspendre" button (with confirm modal)

---

## 22. State Management Rules

### What goes in AuthContext (global)

Only: `user`, `token`, `role`, `isLoggedIn`, `login()`, `logout()`

Nothing else goes in a global context. No search filters, no cart, no favorites count. Keep it simple.

### What goes in component state (useState)

- Form data
- Loading states (`isLoading`)
- Error messages
- Toggle states (is dropdown open, is modal open)
- List data fetched for that component

### What goes in URL params (useSearchParams)

- Search filters on the search page
- Tab selection on multi-tab pages

Always sync filters to URL. This makes:
- Sharing search URLs possible
- Browser back button work correctly
- Page refresh restore the same state

### When to use useEffect

Only for:
- Fetching data on mount
- Reacting to prop/state changes that need a side effect
- Cleaning up subscriptions

Never use useEffect to update state that could be computed during render.

---

## 23. Error Handling — Every Case

### API errors — what to show

| HTTP Code | What happened | What to show |
|-----------|--------------|--------------|
| 400 | Bad request / validation error | Show field-level error messages from response body |
| 401 | Not authenticated | Auto-logout + redirect to `/login` (handled in axios interceptor) |
| 403 | Wrong role | Toast "Accès non autorisé" + redirect to home |
| 404 | Resource not found | Show "Introuvable" state on the page |
| 409 | Conflict (duplicate) | Show specific message (e.g., "Email déjà utilisé") |
| 500 | Server error | Toast "Une erreur est survenue. Réessayez." |
| Network error | No response | Toast "Impossible de contacter le serveur. Vérifiez votre connexion." |

### How to handle in components

```jsx
const [error, setError] = useState(null)
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async (data) => {
  setIsLoading(true)
  setError(null)
  try {
    await someApi.doSomething(data)
    // success handling
  } catch (err) {
    const message = err.response?.data?.message || 'Une erreur est survenue'
    setError(message)
    // or: toast.error(message)
  } finally {
    setIsLoading(false)
  }
}
```

### Form errors (react-hook-form)

```jsx
const { register, handleSubmit, formState: { errors } } = useForm()

// Inline error below each field:
{errors.email && (
  <span style={{ color: 'var(--status-danger)', fontSize: 12, marginTop: 4 }}>
    {errors.email.message}
  </span>
)}
```

---

## 24. Loading & Empty States

**Every component that fetches data must handle 3 states:**
1. Loading — show skeleton or spinner
2. Empty — show helpful empty state
3. Data — show the actual content

### Loading — use SkeletonCard

```jsx
if (isLoading) return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[1,2,3].map(i => <SkeletonCard key={i} />)}
  </div>
)
```

### Empty states — always give an action

```jsx
if (data.length === 0) return (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20 }}>
      Aucune annonce trouvée
    </h3>
    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
      Essayez d'élargir votre rayon de recherche ou de modifier votre budget.
    </p>
    <button className="btn-primary">Modifier les filtres</button>
  </div>
)
```

### Button loading state

```jsx
<button className="btn-primary" disabled={isLoading}>
  {isLoading ? (
    <>
      <LoadingSpinner size="sm" />
      Chargement...
    </>
  ) : 'Se connecter'}
</button>
```

---

## 25. Responsive Design Rules

### Breakpoints

```
Mobile:  < 768px  — phone, single column, simplified
Tablet:  768–1024px — can show 2 columns
Desktop: > 1024px — full layout
```

### Key responsive decisions

**Search page:**
- Desktop: side-by-side left panel + map
- Mobile: top bar + results list + "Voir la carte" button → map as bottom sheet modal

**Listing detail:**
- Desktop: two columns (content left, sticky sidebar right)
- Mobile: single column, sidebar content moved to bottom of page

**Publish form:**
- Same on all sizes — centered max-width 720px

**Admin:**
- Sidebar collapses to a hamburger menu on mobile
- Tables scroll horizontally on mobile

**Navbar:**
- Desktop: full links visible
- Mobile: hamburger → slide-in drawer

### Tailwind responsive classes

Always mobile-first:
```jsx
// Wrong: desktop first
<div className="flex md:block">

// Correct: mobile first
<div className="block md:flex">

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 26. Performance Rules

### Lazy load all pages

Already set up in `App.jsx` using `React.lazy + Suspense`. Every page is lazy loaded.

### Images

Always use `loading="lazy"` on every `<img>` tag:
```jsx
<img src={photoUrl} loading="lazy" alt="Photo du logement" />
```

### Search debouncing

Never fire a search API call on every keystroke:
```jsx
import { useState, useEffect, useCallback } from 'react'

const [filters, setFilters] = useState({})
const [debouncedFilters, setDebouncedFilters] = useState({})

useEffect(() => {
  const timer = setTimeout(() => setDebouncedFilters(filters), 300)
  return () => clearTimeout(timer)
}, [filters])

// useEffect that calls API uses debouncedFilters, not filters
```

### Map — only render when visible

```jsx
const [mapVisible, setMapVisible] = useState(false)

// Only render MapContainer after user clicks "Voir la carte" on mobile
{mapVisible && <MapContainer ...>}
```

### Don't fetch data you don't need

On the search page, the list result includes enough data for the card.
Only call `annoncesApi.getById(id)` when the student navigates to the detail page.
Never pre-fetch all listing details.

---

## 27. How to Mock the Backend During Dev

Section retiree: on privilegie des donnees reales dans la base (seed) pendant les tests.

---

## 28. Environment Variables

### `.env` (never committed)

```env
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=UniHome
```

### `.env.example` (committed — shows what's needed)

```env
VITE_API_URL=
VITE_APP_NAME=UniHome
```

### How to use in code

```js
const apiUrl = import.meta.env.VITE_API_URL
const appName = import.meta.env.VITE_APP_NAME
```

**Rules:**
- Every variable MUST start with `VITE_` to be accessible in React code
- Never put secret keys in `.env` for a frontend — they are visible to anyone who opens the browser devtools
- The only variable that needs to be set is `VITE_API_URL` — it changes per environment (local vs production)

---

## 29. Git Rules for Frontend

### Branching

```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/search-page

# After finishing
git add .
git commit -m "feat: build search page with filters and map"
git push origin feature/search-page
# Open Pull Request to develop on GitHub
```

### Branch naming

```
feature/landing-page
feature/auth-login
feature/auth-register
feature/search-page
feature/listing-detail
feature/publish-form
feature/chatbot-widget
feature/admin-dashboard
fix/leaflet-marker-icon
fix/auth-redirect
```

### Commit messages

```
feat: add ConfidenceBadge component
feat: implement search page with leaflet map
fix: correct photo upload multipart headers
fix: handle 401 in axios interceptor
style: apply glass morphism to navbar
refactor: extract AnnonceCard to its own file
docs: update README with setup instructions
```

### What NOT to commit

- `.env` (API URLs, secrets)
- `node_modules/` (100MB, gitignored)
- `dist/` (build output)
- `.DS_Store` (Mac OS garbage)

---

## 30. Final Checklist Before Handoff

Go through this line by line before saying the frontend is done.

### Functionality

- [ ] Register works for both student and owner roles
- [ ] Owner CIN upload works (file sent as multipart)
- [ ] Email confirmation page handles success and error states
- [ ] Login redirects correctly based on role (student→search, owner→mes-annonces, admin→admin)
- [ ] Search filters work and sync to URL params
- [ ] Changing a filter triggers a new API call (debounced)
- [ ] Map markers are colored correctly by score
- [ ] Clicking a map marker scrolls to the corresponding card
- [ ] Hovering a card highlights the corresponding marker
- [ ] Listing detail page creates a Consultation on mount (if logged in)
- [ ] "Afficher les coordonnées" button works and reveals contacts
- [ ] Contacts are NOT visible to non-logged-in users
- [ ] Favorite button works (add/remove) with optimistic update
- [ ] Review form only shows if `contacts_affiches = true`
- [ ] Report modal sends signal with correct reason
- [ ] Publish form validates each step before proceeding
- [ ] Photo upload shows per-photo progress
- [ ] Photos can be reordered and one marked as main
- [ ] Post-publish shows correct state based on score (VALIDEE/EN_ATTENTE/REJETEE)
- [ ] Owner can edit their listing (form pre-filled)
- [ ] Chatbot widget opens, sends messages, shows replies
- [ ] Admin moderation queue shows score breakdown per listing
- [ ] Admin can validate/reject listings with the right API calls

### Design

- [ ] All backgrounds use `var(--bg-base)` — no white or light backgrounds anywhere
- [ ] All cards use `glass-card` class (backdrop-filter blur)
- [ ] No hardcoded colors — only CSS variables or Tailwind config colors
- [ ] ConfidenceBadge correctly shows green/violet/red based on score thresholds
- [ ] All buttons use `btn-primary` or `btn-ghost` class
- [ ] All inputs use `glass-input` class
- [ ] Headings use `font-heading` (Space Grotesk)
- [ ] Gradient text used on hero headings

### Responsive

- [ ] Tested on 375px mobile width — no horizontal scroll
- [ ] Tested on 768px tablet — layout switches correctly
- [ ] Tested on 1440px desktop — full layout visible
- [ ] Search page: map is hidden on mobile with "Voir la carte" button
- [ ] Navbar collapses to hamburger menu on mobile

### State & Data

- [ ] JWT is NEVER in localStorage (verify: open devtools → Application → Local Storage → should be empty)
- [ ] All API calls go through `src/api/` functions — no direct axios in components
- [ ] Every data-fetching component has loading + empty + error states
- [ ] Loading states use SkeletonCard or LoadingSpinner (not blank screens)
- [ ] Toasts used for success/error feedback (not alerts or console.log)

### Performance

- [ ] All pages lazy-loaded with `React.lazy`
- [ ] All images have `loading="lazy"`
- [ ] Search API calls are debounced (300ms)
- [ ] Map not rendered until visible (on mobile)

### Code Quality

- [ ] No `console.log` left in production code
- [ ] No commented-out blocks of code
- [ ] No TODO comments unless they're genuine known issues
- [ ] `.env` is not committed (check `.gitignore`)
- [ ] Mock data removed or disabled

---

## Appendix: `src/utils/constants.js`

```js
export const API_URL = import.meta.env.VITE_API_URL

export const ROLES = {
  ETUDIANT:     'ETUDIANT',
  PROPRIETAIRE: 'PROPRIETAIRE',
  ADMIN:        'ADMIN',
}

export const STATUT_ANNONCE = {
  EN_ATTENTE: 'EN_ATTENTE',
  VALIDEE:    'VALIDEE',
  REJETEE:    'REJETEE',
  SUSPENDUE:  'SUSPENDUE',
  ARCHIVEE:   'ARCHIVEE',
}

export const TYPE_LOGEMENT = ['STUDIO', 'CHAMBRE', 'COLOCATION', 'APPARTEMENT']

export const TYPE_CONTACT = ['TELEPHONE', 'WHATSAPP', 'EMAIL', 'FACEBOOK', 'INSTAGRAM']

export const CITIES = ['Fès', 'Casablanca', 'Rabat', 'Marrakech', 'Meknès', 'Kénitra', 'Autre']

export const RAISON_SIGNALEMENT = [
  'Prix suspect',
  'Fausses photos',
  'Propriétaire introuvable',
  'Adresse incorrecte',
  'Arnaque confirmée',
  'Autre',
]

export const EQUIPEMENTS = [
  { id: 'wifi',      nom: 'WiFi',              icone: '📶' },
  { id: 'meuble',    nom: 'Meublé',            icone: '🛋️' },
  { id: 'cuisine',   nom: 'Cuisine équipée',   icone: '🍳' },
  { id: 'parking',   nom: 'Parking',           icone: '🅿️' },
  { id: 'clim',      nom: 'Climatisation',     icone: '❄️' },
  { id: 'chauffage', nom: 'Chauffage',         icone: '🔥' },
  { id: 'ascenseur', nom: 'Ascenseur',         icone: '🛗' },
  { id: 'gardien',   nom: 'Gardien 24h',       icone: '👮' },
  { id: 'balcon',    nom: 'Balcon / Terrasse', icone: '🏗️' },
  { id: 'lavelinge', nom: 'Lave-linge',        icone: '🫧' },
  { id: 'eauchaude', nom: 'Eau chaude',        icone: '🚿' },
  { id: 'charges',   nom: 'Charges incluses',  icone: '💡' },
]

// Moroccan phone number validation
export const PHONE_REGEX = /^(\+212|0)[67]\d{8}$/
```

## Appendix: `src/utils/formatters.js`

```js
// "1200" → "1 200 DH"
export const formatPrice = (price) =>
  `${Number(price).toLocaleString('fr-MA')} DH`

// "2024-09-15T10:30:00Z" → "15 sept. 2024"
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-MA', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

// 1250 metres → "1.2 km"  |  800 metres → "800 m"
export const formatDistance = (metres) =>
  metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${Math.round(metres)} m`

// "PROPRIETAIRE" → "Propriétaire"
export const formatRole = (role) => ({
  ETUDIANT:     'Étudiant',
  PROPRIETAIRE: 'Propriétaire',
  ADMIN:        'Administrateur',
})[role] || role

// 4.5 → "★★★★½" (or just use a star component)
export const formatStars = (note) =>
  '★'.repeat(Math.floor(note)) + (note % 1 >= 0.5 ? '½' : '')
```
