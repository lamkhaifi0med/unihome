import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Home,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  WalletCards,
} from "lucide-react";
import ChatbotPanel from "../../components/chatbot/ChatbotPanel";
import { ownerApi } from "../../api/ownerApi";
import { useAuth } from "../../hooks/useAuth";

const ownerStatusLabels = {
  VALIDEE: "Publiée",
  EN_ATTENTE: "En vérification",
  REJETEE: "Rejetée",
  SUSPENDUE: "Suspendue",
  ARCHIVEE: "Archivée",
};

export default function Chatbot() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedOwnerAnnonce, setSelectedOwnerAnnonce] = useState(null);
  const [ownerAnnonceLoading, setOwnerAnnonceLoading] = useState(false);
  const currentAnnonceId = searchParams.get("annonceId");
  const ownerAnnonceId = searchParams.get("ownerAnnonceId");
  const ownerAnnonceTitle = searchParams.get("ownerAnnonceTitle");
  const ownerAnnonceStatus = searchParams.get("ownerAnnonceStatus");
  const ownerAnnonceCity = searchParams.get("ownerAnnonceCity");
  const ownerAnnonceType = searchParams.get("ownerAnnonceType");
  const ownerAnnonceRent = searchParams.get("ownerAnnonceRent");
  const ownerAnnoncePhoto = searchParams.get("ownerAnnoncePhoto");
  const intentHint = searchParams.get("intent");

  useEffect(() => {
    if (!ownerAnnonceId || !user?.id || user?.role !== "PROPRIETAIRE") {
      setSelectedOwnerAnnonce(null);
      return;
    }

    let mounted = true;
    setOwnerAnnonceLoading(true);
    ownerApi
      .getOwnerAnnonces(user.id)
      .then((response) => {
        if (!mounted) return;
        const match = (response.data || []).find(
          (annonce) => annonce.id === ownerAnnonceId,
        );
        setSelectedOwnerAnnonce(match || null);
      })
      .catch(() => {
        if (mounted) setSelectedOwnerAnnonce(null);
      })
      .finally(() => {
        if (mounted) setOwnerAnnonceLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [ownerAnnonceId, user?.id, user?.role]);

  const ownerAnnonceContext = useMemo(() => {
    if (!ownerAnnonceId) return null;
    const source = selectedOwnerAnnonce || {};
    return {
      title: source.titre || ownerAnnonceTitle || "Annonce sélectionnée",
      status: source.statut || ownerAnnonceStatus || null,
      city: source.ville || ownerAnnonceCity || null,
      type: source.typeLogement || ownerAnnonceType || null,
      rent:
        source.loyer !== null && source.loyer !== undefined
          ? source.loyer
          : ownerAnnonceRent,
      photo: source.photos?.[0] || ownerAnnoncePhoto || null,
      surface: source.superficie || null,
      score: source.scoreConfiance ?? null,
    };
  }, [
    ownerAnnonceId,
    selectedOwnerAnnonce,
    ownerAnnonceTitle,
    ownerAnnonceStatus,
    ownerAnnonceCity,
    ownerAnnonceType,
    ownerAnnonceRent,
    ownerAnnoncePhoto,
  ]);

  const ownerAnnonceLabel = ownerAnnonceContext?.title || null;
  const formattedOwnerRent = ownerAnnonceContext?.rent
    ? `${Number(ownerAnnonceContext.rent).toLocaleString("fr-FR")} DH/mois`
    : null;
  const ownerContextMessage = ownerAnnonceId
    ? `Mode propriétaire actif. Je réponds sur « ${ownerAnnonceLabel} ». Vous pouvez me demander pourquoi elle est en attente/rejetée, comment améliorer son score ou quelles informations ajouter.`
    : null;

  return (
    <div className="page-container py-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
              Assistant UniHome
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Propulsé par Gemini · Disponible 24h/24
            </p>
            {currentAnnonceId && (
              <p className="mt-1 text-xs font-semibold text-primary-600 dark:text-primary-300">
                Contexte annonce actif · UniBot peut répondre sur cette annonce.
              </p>
            )}
            {intentHint === "owner-dashboard" && (
              <p className="mt-1 text-xs font-semibold text-primary-600 dark:text-primary-300">
                Mode propriétaire actif · UniBot peut aider sur{" "}
                {ownerAnnonceId ? "cette annonce" : "vos annonces"}.
              </p>
            )}
          </div>
        </div>
      </div>

      {ownerAnnonceContext && (
        <div className="mb-5 overflow-hidden rounded-[34px] border border-primary-200 bg-white shadow-2xl shadow-primary-950/10 dark:border-primary-500/20 dark:bg-slate-950/80">
          <div className="grid gap-0 sm:grid-cols-[240px_1fr]">
            <div className="relative min-h-[190px] overflow-hidden bg-gradient-to-br from-slate-200 via-primary-100 to-accent-100 dark:from-slate-800 dark:via-primary-950/60 dark:to-accent-950/60">
              {ownerAnnonceContext.photo ? (
                <img
                  src={ownerAnnonceContext.photo}
                  alt={ownerAnnonceLabel}
                  className="h-full min-h-[190px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[190px] w-full flex-col items-center justify-center gap-3 text-primary-500 dark:text-primary-200">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/70 shadow-lg dark:bg-white/10">
                    {ownerAnnonceLoading ? (
                      <Sparkles className="h-8 w-8 animate-pulse" />
                    ) : (
                      <ImageIcon className="h-8 w-8" />
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {ownerAnnonceLoading
                      ? "Chargement de l'annonce"
                      : "Photo non disponible"}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-700 shadow-lg dark:bg-slate-950/90 dark:text-primary-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Annonce ciblée par UniBot
                </span>
              </div>
              {formattedOwnerRent && (
                <div className="absolute right-3 top-3 rounded-2xl bg-white/95 px-3 py-2 text-sm font-black text-slate-950 shadow-lg dark:bg-slate-950/90 dark:text-white">
                  {formattedOwnerRent}
                </div>
              )}
            </div>

            <div className="min-w-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 dark:from-primary-500/10 dark:via-white/5 dark:to-accent-500/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary-600 dark:text-primary-300">
                    UniBot répond sur cette annonce
                  </p>
                  <h2 className="mt-1 line-clamp-2 font-display text-2xl font-bold leading-snug text-gray-950 dark:text-white">
                    {ownerAnnonceLabel}
                  </h2>
                </div>
                <div className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-200 sm:flex">
                  <Home className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                {ownerAnnonceContext.status && (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800 shadow-sm dark:bg-amber-500/15 dark:text-amber-200">
                    {ownerStatusLabels[ownerAnnonceContext.status] ||
                      ownerAnnonceContext.status}
                  </span>
                )}
                {ownerAnnonceContext.city && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 shadow-sm dark:bg-white/10">
                    <MapPin className="h-3.5 w-3.5" />
                    {ownerAnnonceContext.city}
                  </span>
                )}
                {ownerAnnonceContext.type && (
                  <span className="rounded-full bg-white/85 px-3 py-1.5 shadow-sm dark:bg-white/10">
                    {ownerAnnonceContext.type}
                  </span>
                )}
                {ownerAnnonceContext.surface && (
                  <span className="rounded-full bg-white/85 px-3 py-1.5 shadow-sm dark:bg-white/10">
                    {ownerAnnonceContext.surface} m²
                  </span>
                )}
                {ownerAnnonceContext.score !== null && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-200">
                    Score {ownerAnnonceContext.score}/100
                  </span>
                )}
                {!ownerAnnonceContext.photo && formattedOwnerRent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 shadow-sm dark:bg-white/10">
                    <WalletCards className="h-3.5 w-3.5" />
                    {formattedOwnerRent}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                UniBot répondra en priorité sur cette annonce : statut, score de
                confiance, informations manquantes et améliorations possibles.
              </p>
            </div>
          </div>
        </div>
      )}

      <ChatbotPanel
        currentAnnonceId={currentAnnonceId}
        ownerAnnonceId={ownerAnnonceId}
        intentHint={intentHint}
        initialContextMessage={ownerContextMessage}
      />
    </div>
  );
}
