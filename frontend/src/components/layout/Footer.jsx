import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import { Github, Twitter, Instagram, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white font-geist dark:border-zinc-800 dark:bg-zinc-950">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <Logo size="md" />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              UniHome aide les étudiants marocains à chercher près de leur
              campus, avec des annonces contrôlées, un score de confiance et
              un contact direct. Pas d'agence, pas de commission, pas
              d'intermédiaire.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-white">
              Plateforme
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/search", label: "Rechercher" },
                { to: "/chatbot", label: "Assistant IA" },
                { to: "/publier-annonce", label: "Publier un logement" },
                { to: "/login", label: "Se connecter" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-white">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@unihome.ma"
                  className="flex items-center gap-2.5 text-sm text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  <Mail className="h-4 w-4" />
                  contact@unihome.ma
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                <Phone className="h-4 w-4" />
                +212 5 22 00 00 00
              </li>
              <li className="pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
                  Bêta publique
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 sm:flex-row dark:border-zinc-800">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            © 2026 UniHome — Logements étudiants au Maroc
          </p>
          <div className="flex items-center gap-1">
            {[
              { Icon: Twitter, label: "Twitter" },
              { Icon: Instagram, label: "Instagram" },
              { Icon: Github, label: "GitHub" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
