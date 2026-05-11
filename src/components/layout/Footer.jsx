import { Link } from 'react-router-dom'
import Logo from '../ui/Logo'
import { Github, Twitter, Instagram, Mail, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-dark-800 mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Logo size="md" />
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm">
              La plateforme marocaine de référence pour la recherche de logements étudiants. Sécurisée, centralisée, anti-fraude.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-gray-900 dark:text-white text-sm mb-4">Plateforme</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/annonces', label: 'Découvrir' },
                { to: '/search', label: 'Rechercher' },
                { to: '/chatbot', label: 'Assistant IA' },
                { to: '/login', label: 'Se connecter' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-gray-900 dark:text-white text-sm mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Mail className="w-4 h-4 text-primary-500" />
                contact@unihome.ma
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Phone className="w-4 h-4 text-primary-500" />
                +212 5 22 00 00 00
              </li>
            </ul>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 text-xs font-mono font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full">
                v1.0 · Bêta Publique
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 UniHome — Tous droits réservés</p>
          <div className="flex items-center gap-4">
            <Link to="#" className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Confidentialité</Link>
            <Link to="#" className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">CGU</Link>
            <Link to="#" className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">À propos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
