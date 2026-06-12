import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Check,
  Flag,
  Heart,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Star,
} from "lucide-react";
import ScoreBadge from "../../components/ui/ScoreBadge";
import { annoncesApi } from "../../api/annoncesApi";
import { signalerAnnonce } from "../../api/adminApi";
import { useFavoris } from "../../hooks/useFavoris";
import { useAuth } from "../../hooks/useAuth";

const contactIcons = {
  TELEPHONE: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  FACEBOOK: MessageCircle,
  INSTAGRAM: MessageCircle,
};

function formatContactHref(contact) {
  if (contact.plateforme === "TELEPHONE") return `tel:${contact.valeur}`;
  if (contact.plateforme === "EMAIL") return `mailto:${contact.valeur}`;
  if (contact.plateforme === "WHATSAPP")
    return `https://wa.me/${contact.valeur.replace(/\D/g, "")}`;
  return contact.valeur;
}

function MiniMap({ annonce }) {
  if (!annonce.latitude || !annonce.longitude) return null;
  const lat = Number(annonce.latitude);
  const lng = Number(annonce.longitude);
  const zoom = 15;
  const x = Math.floor(((lng + 180) / 360) * 2 ** zoom);
  const y = Math.floor(
    (0.5 -
      Math.log(
        (1 + Math.sin((lat * Math.PI) / 180)) /
          (1 - Math.sin((lat * Math.PI) / 180)),
      ) /
        (4 * Math.PI)) *
      2 ** zoom,
  );

  return (
    <div className="relative h-52 overflow-hidden rounded-3xl border border-white/70 bg-slate-100 shadow-lg shadow-slate-900/5 dark:border-white/10">
      <img
        src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
        alt=""
        className="h-full w-full scale-150 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent" />
      <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-full items-center justify-center rounded-2xl border-2 border-white bg-indigo-600 text-white shadow-xl shadow-indigo-900/30">
        <Home className="h-5 w-5" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow backdrop-blur dark:bg-dark-900/90 dark:text-gray-200">
        {annonce.ville} - {annonce.adresse}
      </div>
    </div>
  );
}

export default function AnnonceDetail() {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const { toggleFavori, isFavori } = useFavoris();
  const [annonce, setAnnonce] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);
  const [signalerOpen, setSignalerOpen] = useState(false);
  const [signalerRaison, setSignalerRaison] = useState("ARNAQUE");
  const [signalerDesc, setSignalerDesc] = useState("");
  const [signalerSubmitting, setSignalerSubmitting] = useState(false);
  const [signalerDone, setSignalerDone] = useState(false);

  const loadDetail = async (includeContacts = false) => {
    const response = await annoncesApi.getDetail(id, includeContacts);
    setAnnonce(response.data);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await annoncesApi.getDetail(id, false);
        if (mounted) setAnnonce(response.data);
      } catch (err) {
        if (mounted)
          setError(err?.response?.data?.detail || "Annonce introuvable.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const images = annonce?.photos || [];
  const fav = annonce ? isFavori(annonce.id) || annonce.favori : false;
  const scoreRows = useMemo(() => {
    const detail = annonce?.detailScore || {};
    return [
      { label: "Description", value: detail.description ?? detail.texte ?? 0 },
      { label: "Prix", value: detail.prix ?? 0 },
      { label: "Photos", value: detail.photos ?? 0 },
      { label: "Justificatif", value: detail.justificatif ?? 0 },
    ];
  }, [annonce]);

  const handleToggleFavori = async () => {
    setFavoriteError(null);
    try {
      await toggleFavori(annonce.id);
      setAnnonce((current) =>
        current ? { ...current, favori: !fav } : current,
      );
    } catch {
      setFavoriteError(
        "Connectez-vous avec un compte etudiant pour sauvegarder cette annonce.",
      );
    }
  };

  const handleSignaler = async () => {
    if (!isLoggedIn) {
      setError(
        "Connectez-vous avec un compte etudiant pour signaler cette annonce.",
      );
      setSignalerOpen(false);
      return;
    }
    setSignalerSubmitting(true);
    try {
      await signalerAnnonce(annonce.id, {
        raison: signalerRaison,
        description: signalerDesc,
      });
      setSignalerDone(true);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Impossible d'envoyer le signalement.",
      );
    } finally {
      setSignalerSubmitting(false);
    }
  };

  const revealContacts = async () => {
    if (!isLoggedIn) {
      setError("Connectez-vous pour voir les contacts du proprietaire.");
      return;
    }
    try {
      setContactsLoading(true);
      await loadDetail(true);
    } catch {
      setError("Impossible de charger les contacts.");
    } finally {
      setContactsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex min-h-[60vh] items-center justify-center py-20 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Chargement de l'annonce...
      </div>
    );
  }

  if (error && !annonce) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="mb-4 font-display text-2xl font-bold text-gray-900 dark:text-white">
          {error}
        </h2>
        <Link to="/annonces" className="btn-primary">
          Retour aux annonces
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <Link
        to="/annonces"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux annonces
      </Link>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/80 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="relative aspect-[16/9] bg-slate-100 dark:bg-dark-800">
              {images[activeImg] ? (
                <img
                  src={images[activeImg]}
                  alt={annonce.titre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <Home className="h-12 w-12" />
                </div>
              )}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
              <div className="absolute left-4 top-4">
                <ScoreBadge score={annonce.scoreConfiance || 0} />
              </div>
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleFavori}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg backdrop-blur transition-all ${
                    fav
                      ? "bg-red-500 text-white"
                      : "bg-white/90 text-gray-500 hover:text-red-500"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${fav ? "fill-current" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSignalerOpen(true);
                    setSignalerDone(false);
                    setSignalerDesc("");
                  }}
                  title="Signaler cette annonce"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-gray-500 shadow-lg backdrop-blur hover:text-red-500"
                >
                  <Flag className="h-5 w-5" />
                </button>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto p-4">
                {images.map((img, index) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImg(index)}
                    className={`h-20 w-28 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                      activeImg === index
                        ? "border-indigo-500 opacity-100"
                        : "border-transparent opacity-60 hover:opacity-90"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-xl shadow-indigo-950/8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-bold leading-tight text-slate-950 dark:text-white">
                  {annonce.titre}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {annonce.ville} - {annonce.adresse}
                  </span>
                </p>
              </div>
              <div className="rounded-3xl border border-indigo-100 bg-white/80 px-5 py-4 text-indigo-700 shadow-lg shadow-indigo-900/5 dark:border-white/10 dark:bg-white/8 dark:text-indigo-300">
                <p className="font-display text-3xl font-bold leading-none">
                  {Number(annonce.loyer || 0).toLocaleString("fr-FR")} MAD
                </p>
                <p className="mt-1 text-xs font-bold uppercase text-slate-400">
                  par mois
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Type", value: annonce.typeLogement },
                { label: "Surface", value: `${annonce.superficie || "-"} m2` },
                {
                  label: "Charges",
                  value: annonce.chargesIncluses ? "Incluses" : "Non incluses",
                },
                {
                  label: "Score IA",
                  value: `${annonce.scoreConfiance || 0}/100`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/70 bg-white/62 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-xs font-bold uppercase text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 truncate font-display text-sm font-bold text-slate-900 dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm leading-7 text-gray-600 dark:text-gray-300">
              {annonce.description}
            </p>

            <div className="mt-6">
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Equipements
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(annonce.equipements || []).map((equipement) => (
                  <span
                    key={equipement}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                    {equipement}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="sticky top-24 space-y-5">
            <div className="rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-xl shadow-indigo-950/8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 font-display text-xl font-bold text-white shadow-lg shadow-indigo-600/20">
                  {
                    (annonce.proprietairePrenom ||
                      annonce.proprietaireNom ||
                      "P")[0]
                  }
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-display font-bold text-slate-950 dark:text-white">
                      {[annonce.proprietairePrenom, annonce.proprietaireNom]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    {annonce.proprietaireVerifie && (
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Star className="h-4 w-4 fill-current text-amber-400" />
                    {annonce.proprietaireNote ?? "-"} (
                    {annonce.proprietaireAvis || 0} avis)
                  </p>
                </div>
              </div>

              {favoriteError && (
                <p className="mt-4 text-sm text-red-600">{favoriteError}</p>
              )}

              {!annonce.contactsDisponibles ? (
                <button
                  type="button"
                  onClick={revealContacts}
                  disabled={contactsLoading}
                  className="btn-primary mt-5 flex w-full items-center justify-center gap-2"
                >
                  {contactsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                  Afficher les contacts
                </button>
              ) : (
                <div className="mt-5 space-y-2">
                  {(annonce.contacts || []).map((contact) => {
                    const Icon = contactIcons[contact.plateforme] || Phone;
                    return (
                      <a
                        key={`${contact.plateforme}-${contact.valeur}`}
                        href={formatContactHref(contact)}
                        className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                      >
                        <Icon className="h-4 w-4" />
                        <span>
                          {contact.plateforme}: {contact.valeur}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-xl shadow-indigo-950/8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <h3 className="flex items-center gap-2 font-display font-bold text-slate-950 dark:text-white">
                <Shield className="h-5 w-5 text-indigo-600" />
                Analyse IA
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {annonce.raisonStatut || "Annonce validee."}
              </p>
              <div className="mt-4 space-y-3">
                {scoreRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-gray-500">
                      <span>{row.label}</span>
                      <span>{row.value}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${Math.min(row.value, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <MiniMap annonce={annonce} />
          </section>
        </aside>
      </div>

      {signalerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            {signalerDone ? (
              <div className="py-4 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                    <Flag className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                  Signalement envoyé
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Notre équipe examinera cette annonce. Merci.
                </p>
                <button
                  onClick={() => setSignalerOpen(false)}
                  className="btn-primary mt-5 w-full"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                  Signaler cette annonce
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Pourquoi souhaitez-vous signaler{" "}
                  <strong>{annonce.titre}</strong> ?
                </p>
                <div className="mt-4 space-y-3">
                  <select
                    value={signalerRaison}
                    onChange={(e) => setSignalerRaison(e.target.value)}
                    className="input-field"
                  >
                    <option value="ARNAQUE">Arnaque / Fraude</option>
                    <option value="FAUSSES_INFOS">Fausses informations</option>
                    <option value="PHOTOS_TROMPEUSES">Photos trompeuses</option>
                    <option value="PRIX_ABUSIF">Prix abusif</option>
                    <option value="ANNONCE_DOUBLON">Annonce en doublon</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                  <textarea
                    value={signalerDesc}
                    onChange={(e) => setSignalerDesc(e.target.value)}
                    placeholder="Décrivez le problème (optionnel)..."
                    className="input-field h-24 resize-none"
                  />
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setSignalerOpen(false)}
                    className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSignaler}
                    disabled={signalerSubmitting}
                    className="flex-1 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {signalerSubmitting ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
