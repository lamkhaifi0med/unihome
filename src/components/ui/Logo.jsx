import { Link } from 'react-router-dom'

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
  }

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${sizes[size].icon} relative`}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
          <path d="M16 6L26 14v12H20v-7h-8v7H6V14L16 6z" fill="white" />
          <circle cx="16" cy="14" r="2.5" fill="white" fillOpacity="0.7" />
        </svg>
      </div>
      <span className={`font-display font-bold ${sizes[size].text} text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors`}>
        Uni<span className="gradient-text">Home</span>
      </span>
    </Link>
  )
}
