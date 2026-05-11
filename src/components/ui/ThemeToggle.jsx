import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
