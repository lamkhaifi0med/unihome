import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import {
  Github,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Search,
  MessageCircle,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-indigo-100 bg-gradient-to-b from-white to-indigo-50/70 dark:border-white/10 dark:from-dark-900 dark:to-dark-800">
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-600/10" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-600/10" />

      <div className="page-container relative py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.35fr_0.75fr_0.75fr]">
          <div>
            <Logo size="md" />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              UniHome aide les étudiants marocains à chercher près de leur
              campus, avec des annonces contrôlées, un score de confiance et un
              contact direct.
            </p>

            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
              <FooterSignal icon={Search} label="Campus first" />
              <FooterSignal icon={ShieldCheck} label="Annonces contrôlées" />
              <FooterSignal icon={MapPin} label="Maroc" />
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em] text-gray-900 dark:text-white">
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
                    className="inline-flex text-sm font-medium text-gray-500 transition hover:translate-x-1 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em] text-gray-900 dark:text-white">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@unihome.ma"
                  className="flex items-center gap-3 text-sm text-gray-500 transition hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-300">
                    <Mail className="h-4 w-4" />
                  </span>
                  contact@unihome.ma
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-300">
                  <Phone className="h-4 w-4" />
                </span>
                +212 5 22 00 00 00
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-mono font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Bêta publique
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-indigo-100 pt-6 dark:border-white/10 sm:flex-row">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2026 UniHome — Logements étudiants au Maroc
          </p>
          <div className="flex items-center gap-3">
            {[Twitter, Instagram, Github].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm transition hover:-translate-y-0.5 hover:text-primary-600 hover:shadow-md dark:bg-white/10 dark:text-gray-500 dark:hover:text-primary-300"
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

function FooterSignal({ icon: Icon, label }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 text-xs font-semibold text-gray-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300">
      <Icon className="mb-2 h-4 w-4 text-primary-600 dark:text-primary-300" />
      {label}
    </div>
  );
}
