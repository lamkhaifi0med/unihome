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
  const initialPrompt = searchParams.get("q");

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
    <div className="page-container max-w-3xl py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-blue-500 opacity-25 blur-lg" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_32px_-8px_rgba(37,99,235,0.6)] dark:bg-blue-500">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-white">
              Assistant UniHome
            </h1>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              propulsé par gemini · 24h/24 · fr · عربية · darija
            </p>
            {currentAnnonceId && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30">
                Contexte annonce actif · UniBot peut répondre sur cette annonce
              </p>
            )}
            {intentHint === "owner-dashboard" && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30">
                Mode propriétaire actif · aide sur{" "}
                {ownerAnnonceId ? "cette annonce" : "vos annonces"}
              </p>
            )}
          </div>
        </div>
      </div>

      {ownerAnnonceContext && (
        <div className="mb-5 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-0 sm:grid-cols-[240px_1fr]">
            <div className="relative min-h-[190px] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {ownerAnnonceContext.photo ? (
                <img
                  src={ownerAnnonceContext.photo}
                  alt={ownerAnnonceLabel}
                  className="h-full min-h-[190px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[190px] w-full flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-900">
                    {ownerAnnonceLoading ? (
                      <Sparkles className="h-8 w-8 animate-pulse text-blue-500" />
                    ) : (
                      <ImageIcon className="h-8 w-8" />
                    )}
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
                    {ownerAnnonceLoading
                      ? "chargement de l'annonce"
                      : "photo non disponible"}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700 shadow-lg dark:bg-zinc-950/90 dark:text-blue-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  annonce ciblée
                </span>
              </div>
              {formattedOwnerRent && (
                <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-zinc-950 shadow-lg dark:bg-zinc-950/90 dark:text-white">
                  {formattedOwnerRent}
                </div>
              )}
            </div>

            <div className="min-w-0 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                    unibot répond sur cette annonce
                  </p>
                  <h2 className="mt-1 line-clamp-2 font-geist text-xl font-bold leading-snug tracking-[-0.01em] text-zinc-950 dark:text-white">
                    {ownerAnnonceLabel}
                  </h2>
                </div>
                <div className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 sm:flex">
                  <Home className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                {ownerAnnonceContext.status && (
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                    {ownerStatusLabels[ownerAnnonceContext.status] ||
                      ownerAnnonceContext.status}
                  </span>
                )}
                {ownerAnnonceContext.city && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <MapPin className="h-3.5 w-3.5" />
                    {ownerAnnonceContext.city}
                  </span>
                )}
                {ownerAnnonceContext.type && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {ownerAnnonceContext.type}
                  </span>
                )}
                {ownerAnnonceContext.surface && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1.5 font-mono tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {ownerAnnonceContext.surface} m²
                  </span>
                )}
                {ownerAnnonceContext.score !== null && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-mono tabular-nums text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                    score {ownerAnnonceContext.score}/100
                  </span>
                )}
                {!ownerAnnonceContext.photo && formattedOwnerRent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 font-mono tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <WalletCards className="h-3.5 w-3.5" />
                    {formattedOwnerRent}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
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
        initialPrompt={initialPrompt}
      />
    </div>
  );
}
