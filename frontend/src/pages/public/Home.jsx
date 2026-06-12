import { Link } from "react-router-dom";
import { Shield, Users, MapPin, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900" />
        <div className="orb orb-purple w-96 h-96 top-20 left-1/4" />
        <div className="orb orb-blue w-80 h-80 bottom-20 right-1/3" />
        <div className="orb orb-pink w-64 h-64 top-1/3 right-10" />

        <div className="relative page-container py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm mb-8 animate-fade-in">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>🔒 Plateforme anti-arnaque IA · Maroc</span>
            </div>

            <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight mb-6 animate-slide-up">
              Trouve ton logement étudiant{" "}
              <span className="gradient-text">en toute confiance</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed font-body">
              UniHome rend la recherche simple, rapide et sans arnaques. Compare
              des annonces verifiees, avec un score IA clair sur chaque
              logement.
            </p>

            <div
              className="mb-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link
                to="/search"
                className="bg-white text-indigo-700 font-display font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-white/20"
              >
                Commencer la recherche
              </Link>
              <a
                href="#how-it-works"
                className="border-2 border-white/40 text-white font-display font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all"
              >
                Comment ca marche
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm">
              {[
                ["1 200+", "annonces"],
                ["40+", "universites"],
                ["Score IA", "sur chaque annonce"],
              ].map(([value, label]) => (
                <div
                  key={value}
                  className="glass-light rounded-xl px-5 py-3 border border-white/15 bg-white/5 text-center"
                >
                  <div className="font-display font-bold text-white text-base">
                    {value}
                  </div>
                  <div className="text-white/60 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-dark-900 to-transparent" />
      </section>

      {/* How the score works */}
      <section className="py-24 relative">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Comment le score fonctionne</h2>
            <p className="section-subtitle">
              Un systeme clair pour eliminer les arnaques avant contact
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Identite verifiee",
                desc: "Chaque proprietaire est controle manuellement (CIN) avant publication.",
              },
              {
                icon: Brain,
                title: "Analyse IA automatique",
                desc: "4 couches de verification: texte, photos, prix, coherence globale.",
              },
              {
                icon: Users,
                title: "Signalement communautaire",
                desc: "3 signalements confirms = annonce suspendue automatiquement.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass-light rounded-2xl p-8 card-hover text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3">
                  {title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-violet-500 to-emerald-500 shadow-inner" />
            <div className="mt-3 grid grid-cols-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="text-left">Refuse</span>
              <span className="text-center">En revision</span>
              <span className="text-right">Publie automatiquement</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-dark-800 dark:to-dark-700"
      >
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">Comment ca marche</h2>
            <p className="section-subtitle">
              4 etapes simples pour trouver un logement fiable
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Cree ton compte",
                desc: "Inscris-toi et indique ton universite et ton budget.",
              },
              {
                step: "2",
                title: "Lance ta recherche",
                desc: "Filtre par ville, distance et type de logement.",
              },
              {
                step: "3",
                title: "Consulte les fiches",
                desc: "Compare les scores IA, photos et equipements.",
              },
              {
                step: "4",
                title: "Contacte le proprietaire",
                desc: "Demande une visite en toute securite.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="glass-light rounded-2xl p-6 text-center"
              >
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 p-0.5">
                  <div className="w-full h-full rounded-full bg-white dark:bg-dark-700 flex items-center justify-center">
                    <span className="font-display font-bold text-indigo-700 dark:text-white">
                      {step}
                    </span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured cities */}
      <section className="py-24">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">Villes en vedette</h2>
            <p className="section-subtitle">
              Des milliers d'annonces pres de votre campus
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Fes",
              "Casablanca",
              "Rabat",
              "Marrakech",
              "Meknes",
              "Kenitra",
            ].map((city) => (
              <div
                key={city}
                className="glass-light rounded-2xl p-6 card-hover"
              >
                <div className="flex items-center gap-2 text-indigo-300 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-wide">
                    {city}
                  </span>
                </div>
                <div className="text-gray-900 dark:text-white font-display font-bold text-xl mb-2">
                  {city}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  X annonces disponibles
                </div>
                <Link
                  to={`/search?ville=${encodeURIComponent(city)}`}
                  className="text-indigo-500 dark:text-indigo-300 font-semibold text-sm hover:opacity-80"
                >
                  Voir les annonces →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="orb orb-pink w-96 h-96 top-0 right-0 opacity-20" />
        <div className="relative page-container">
          <div className="glass-light rounded-3xl border border-white/20 bg-white/10 px-8 py-10 text-center">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
              Vous etes proprietaire ?
            </h2>
            <p className="text-white/80 text-lg mb-6">
              Publiez votre annonce gratuitement.
            </p>
            <Link
              to="/register?role=PROPRIETAIRE"
              className="bg-white text-indigo-700 font-display font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-white/20"
            >
              Deposer une annonce
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
