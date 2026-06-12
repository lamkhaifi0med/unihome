import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bike,
  Car,
  Footprints,
  Loader2,
  MapPin,
  Navigation2,
  Sparkles,
  X,
} from "lucide-react";

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

const TRAVEL_MODES = [
  { id: "foot", label: "À pied", icon: Footprints, speed: 5, osrm: "foot" },
  { id: "bike", label: "Vélo", icon: Bike, speed: 15, osrm: "bike" },
  { id: "car", label: "Voiture", icon: Car, speed: 35, osrm: "driving" },
];

const RING_LEVELS = [
  { radius: 1000, color: "#10b981", label: "1 km" },
  { radius: 3000, color: "#8b5cf6", label: "3 km" },
  { radius: 5000, color: "#f97316", label: "5 km" },
];

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(
      `script[src="${LEAFLET_JS}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L), {
        once: true,
      });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function markerColor(score) {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#8b5cf6";
  return "#ef4444";
}

function haversineMeters(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(m) {
  if (!Number.isFinite(m)) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

function formatDuration(min) {
  if (!Number.isFinite(min) || min <= 0) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const r = Math.round(min % 60);
  return r ? `${h} h ${r}` : `${h} h`;
}

function createDivIcon(
  L,
  { color, label, campus = false, selected = false, best = false },
) {
  const size = campus ? 56 : selected ? 52 : 42;
  const inner = campus ? 40 : selected ? 38 : 30;
  const pin = campus ? "🎓" : label;
  const ring = selected
    ? `<div style="position:absolute;inset:-6px;border-radius:999px;border:3px solid ${color};opacity:.55;animation:unihome-pulse 1.6s ease-out infinite;"></div>`
    : "";
  const crown = best
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#facc15,#f97316);color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;box-shadow:0 6px 14px rgba(249,115,22,.45);white-space:nowrap;">★ TOP</div>`
    : "";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;transform:translateY(-8px);">
        ${ring}
        <div style="position:absolute;inset:0;border-radius:${campus ? 18 : 999}px;background:${color};opacity:.18;filter:blur(2px);"></div>
        <div style="
          position:absolute;left:50%;top:50%;width:${inner}px;height:${inner}px;
          transform:translate(-50%,-58%);
          border-radius:${campus ? 14 : 999}px;
          display:flex;align-items:center;justify-content:center;
          background:linear-gradient(145deg, ${color}, #0f172a);
          color:white;border:3px solid white;
          box-shadow:0 16px 30px rgba(15,23,42,.28), inset 0 1px 0 rgba(255,255,255,.35);
          font-weight:900;font-size:${campus ? 18 : 11}px;
        ">${pin}</div>
        <div style="
          position:absolute;left:50%;bottom:4px;width:12px;height:12px;
          transform:translateX(-50%) rotate(45deg);
          background:${color};border-right:3px solid white;border-bottom:3px solid white;
          box-shadow:5px 6px 12px rgba(15,23,42,.18);
        "></div>
        ${crown}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 4],
  });
}

function ensurePulseStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById("unihome-map-style")) return;
  const style = document.createElement("style");
  style.id = "unihome-map-style";
  style.textContent = `
    @keyframes unihome-pulse {
      0%   { transform: scale(.85); opacity: .7; }
      70%  { transform: scale(1.4);  opacity: 0;  }
      100% { transform: scale(1.4);  opacity: 0;  }
    }
    .leaflet-container { font-family: inherit; }
  `;
  document.head.appendChild(style);
}

export default function SearchMap({ annonces, campus, selectedId, onSelect }) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markersLayer = useRef(null);
  const routeLayer = useRef(null);
  const ringsLayer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [travelMode, setTravelMode] = useState("foot");
  const [showRings, setShowRings] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  // Annonce currently displayed by the route line. Persists when the card is closed.
  const [routeAnnonce, setRouteAnnonce] = useState(null);
  // Whether the floating card overlay is visible (closes independently of the route).
  const [cardOpen, setCardOpen] = useState(false);

  const selectedAnnonce = useMemo(
    () => annonces.find((a) => a.id === selectedId) || null,
    [annonces, selectedId],
  );

  // When a new logement is selected, refresh route + show card.
  useEffect(() => {
    if (selectedAnnonce) {
      setRouteAnnonce(selectedAnnonce);
      setCardOpen(true);
    }
  }, [selectedAnnonce]);

  const bestIds = useMemo(() => {
    const geo = annonces.filter((a) => a.latitude && a.longitude);
    if (!geo.length) return {};
    const closest = campus?.latitude
      ? geo.reduce((best, a) => {
          const d = haversineMeters(
            [Number(campus.latitude), Number(campus.longitude)],
            [Number(a.latitude), Number(a.longitude)],
          );
          return !best || d < best.d ? { id: a.id, d } : best;
        }, null)
      : null;
    const cheapest = geo.reduce((best, a) => {
      const p = Number(a.loyer || 0);
      if (p <= 0) return best;
      return !best || p < best.p ? { id: a.id, p } : best;
    }, null);
    const topScore = geo.reduce((best, a) => {
      const s = Number(a.scoreConfiance || 0);
      return !best || s > best.s ? { id: a.id, s } : best;
    }, null);
    const out = {};
    if (closest) out[closest.id] = true;
    if (cheapest) out[cheapest.id] = true;
    if (topScore) out[topScore.id] = true;
    return out;
  }, [annonces, campus]);

  // init map
  useEffect(() => {
    let cancelled = false;
    ensurePulseStyle();

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapNode.current || mapRef.current) return;

        const initialCenter =
          campus?.latitude && campus?.longitude
            ? [Number(campus.latitude), Number(campus.longitude)]
            : [31.7917, -7.0926];

        mapRef.current = L.map(mapNode.current, {
          zoomControl: false,
          scrollWheelZoom: true,
        }).setView(initialCenter, campus ? 13 : 6);

        L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);

        ringsLayer.current = L.layerGroup().addTo(mapRef.current);
        routeLayer.current = L.layerGroup().addTo(mapRef.current);
        markersLayer.current = L.layerGroup().addTo(mapRef.current);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // markers
  useEffect(() => {
    if (!mapRef.current || !markersLayer.current || !window.L) return;
    const L = window.L;
    const layer = markersLayer.current;
    layer.clearLayers();
    const bounds = [];

    if (campus?.latitude && campus?.longitude) {
      const latLng = [Number(campus.latitude), Number(campus.longitude)];
      bounds.push(latLng);
      L.marker(latLng, {
        icon: createDivIcon(L, { color: "#4f46e5", label: "U", campus: true }),
        zIndexOffset: 1000,
      })
        .bindPopup(`<strong>${campus.nom}</strong><br>${campus.ville}`)
        .addTo(layer);
    }

    annonces
      .filter((a) => a.latitude && a.longitude)
      .forEach((annonce) => {
        const latLng = [Number(annonce.latitude), Number(annonce.longitude)];
        bounds.push(latLng);
        const isSelected = selectedId === annonce.id;
        const isBest = Boolean(bestIds[annonce.id]);
        L.marker(latLng, {
          icon: createDivIcon(L, {
            color: markerColor(Number(annonce.scoreConfiance || 0)),
            label: Math.max(0, Number(annonce.scoreConfiance || 0)),
            selected: isSelected,
            best: isBest && !isSelected,
          }),
          zIndexOffset: isSelected ? 800 : isBest ? 400 : 0,
        })
          .on("click", () => onSelect?.(annonce.id))
          .addTo(layer);
      });

    if (!selectedId && bounds.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: [38, 38], maxZoom: 14 });
    } else if (!selectedId && bounds.length === 1) {
      mapRef.current.setView(bounds[0], campus ? 13 : 11);
    }
  }, [annonces, campus, selectedId, onSelect, bestIds]);

  // campus rings
  useEffect(() => {
    if (!mapRef.current || !ringsLayer.current || !window.L) return;
    const L = window.L;
    ringsLayer.current.clearLayers();
    if (!showRings || !campus?.latitude || !campus?.longitude) return;
    const center = [Number(campus.latitude), Number(campus.longitude)];
    RING_LEVELS.forEach(({ radius, color, label }) => {
      L.circle(center, {
        radius,
        color,
        weight: 1.5,
        opacity: 0.45,
        fillColor: color,
        fillOpacity: 0.05,
        dashArray: "4 6",
        interactive: false,
      })
        .bindTooltip(label, { permanent: false, direction: "top" })
        .addTo(ringsLayer.current);
    });
  }, [campus, showRings]);

  // route campus -> routeAnnonce (persists even when card is closed)
  useEffect(() => {
    if (!mapRef.current || !routeLayer.current || !window.L) return;
    const L = window.L;
    routeLayer.current.clearLayers();
    setRouteInfo(null);

    if (!routeAnnonce?.latitude || !routeAnnonce?.longitude) return;
    if (!campus?.latitude || !campus?.longitude) return;

    const from = [Number(campus.latitude), Number(campus.longitude)];
    const to = [Number(routeAnnonce.latitude), Number(routeAnnonce.longitude)];
    const straight = haversineMeters(from, to);
    const mode =
      TRAVEL_MODES.find((m) => m.id === travelMode) || TRAVEL_MODES[0];

    const fallback = L.polyline([from, to], {
      color: "#4f46e5",
      weight: 4,
      opacity: 0.55,
      dashArray: "8 8",
    }).addTo(routeLayer.current);

    setRouteInfo({
      distance: straight,
      duration: (straight / 1000 / mode.speed) * 60,
      source: "estimation",
    });

    mapRef.current.fitBounds([from, to], { padding: [80, 80], maxZoom: 15 });

    const ctrl = new AbortController();
    setRouteLoading(true);
    const url = `https://router.project-osrm.org/route/v1/${mode.osrm}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("osrm"))))
      .then((data) => {
        const route = data?.routes?.[0];
        if (!route?.geometry?.coordinates) return;
        routeLayer.current.removeLayer(fallback);
        const coords = route.geometry.coordinates.map(([lng, lat]) => [
          lat,
          lng,
        ]);
        L.polyline(coords, {
          color: "#a5b4fc",
          weight: 10,
          opacity: 0.25,
          lineCap: "round",
        }).addTo(routeLayer.current);
        L.polyline(coords, {
          color: "#4f46e5",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(routeLayer.current);
        setRouteInfo({
          distance: route.distance,
          duration: route.duration / 60,
          source: "route",
        });
      })
      .catch(() => {})
      .finally(() => setRouteLoading(false));

    return () => ctrl.abort();
  }, [routeAnnonce, campus, travelMode]);

  if (failed) {
    return (
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] rounded-3xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/5 xl:block">
        <MapPin className="h-8 w-8 text-gray-400" />
        <h3 className="mt-3 font-display font-semibold text-gray-900 dark:text-white">
          Carte indisponible
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Leaflet n'a pas pu etre charge. Les resultats restent disponibles en
          liste.
        </p>
      </aside>
    );
  }

  const geoCount = annonces.filter((a) => a.latitude && a.longitude).length;

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-dark-800 xl:block">
      <div
        ref={mapNode}
        className="h-full w-full [&_.leaflet-popup-content-wrapper]:rounded-2xl [&_.leaflet-popup-content-wrapper]:shadow-xl [&_.leaflet-popup-content]:font-body [&_.leaflet-control-zoom]:overflow-hidden [&_.leaflet-control-zoom]:rounded-xl [&_.leaflet-control-zoom]:border-0 [&_.leaflet-control-zoom]:shadow-lg"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-gray-500 backdrop-blur dark:bg-dark-900/80 dark:text-gray-300">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement de la carte...
        </div>
      )}

      {/* TOP header */}
      <div className="pointer-events-none absolute left-4 right-4 top-4 z-[1000] rounded-3xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/90">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-gray-900 dark:text-white">
              Carte campus
            </p>
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
              {campus
                ? `${campus.nom} - ${campus.ville}`
                : "Selectionnez une universite pour centrer la recherche."}
            </p>
          </div>
          {campus && (
            <button
              type="button"
              onClick={() => setShowRings((v) => !v)}
              className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                showRings
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
              }`}
              title="Afficher les rayons 1/3/5 km"
            >
              <Sparkles className="h-3 w-3" />
              Rayons
            </button>
          )}
        </div>
      </div>

      {/* Selected logement card — glassmorphism, anchored bottom-left, compact */}
      {cardOpen && routeAnnonce && (
        <div
          className="pointer-events-auto absolute bottom-20 left-4 z-[1001] w-[340px] max-w-[calc(100%-2rem)] overflow-hidden rounded-[28px] border border-white/40 bg-white/40 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.45)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 ease-out dark:border-white/10 dark:bg-white/[0.06]"
          style={{
            WebkitBackdropFilter: "blur(22px) saturate(160%)",
            backdropFilter: "blur(22px) saturate(160%)",
          }}
        >
          {/* glossy top highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />
          <div className="flex items-start gap-3 p-4">
            <div
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{
                background: `linear-gradient(135deg, ${markerColor(Number(routeAnnonce.scoreConfiance || 0))}, #0f172a)`,
                boxShadow: `0 12px 28px ${markerColor(Number(routeAnnonce.scoreConfiance || 0))}55, inset 0 1px 0 rgba(255,255,255,.35)`,
              }}
            >
              <Navigation2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="truncate font-display text-sm font-bold text-gray-900 dark:text-white">
                  {routeAnnonce.titre}
                </h4>
                <button
                  type="button"
                  onClick={() => setCardOpen(false)}
                  className="rounded-full bg-white/40 p-1 text-gray-500 backdrop-blur transition hover:bg-white/70 hover:text-gray-900 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                  aria-label="Fermer"
                  title="Fermer (le trajet reste affiché)"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                {Number(routeAnnonce.loyer || 0).toLocaleString("fr-FR")}{" "}
                MAD/mois
                {routeAnnonce.ville ? ` · ${routeAnnonce.ville}` : ""}
              </p>

              {campus && (
                <div className="mt-3 inline-flex rounded-full border border-white/40 bg-white/40 p-0.5 text-[11px] font-semibold shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
                  {TRAVEL_MODES.map((m) => {
                    const Icon = m.icon;
                    const active = travelMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setTravelMode(m.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition ${
                          active
                            ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-600/30"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {campus && routeInfo && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl border border-white/40 bg-white/50 p-2 backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                      Distance
                    </p>
                    <p className="mt-0.5 font-display text-sm font-bold text-gray-900 dark:text-white">
                      {formatDistance(routeInfo.distance)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/40 bg-white/50 p-2 backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                      Trajet
                    </p>
                    <p className="mt-0.5 font-display text-sm font-bold text-gray-900 dark:text-white">
                      {formatDuration(routeInfo.duration)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/40 bg-white/50 p-2 backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                      Score
                    </p>
                    <p className="mt-0.5 font-display text-sm font-bold text-gray-900 dark:text-white">
                      {Math.max(0, Number(routeAnnonce.scoreConfiance || 0))}
                    </p>
                  </div>
                </div>
              )}

              {campus && routeInfo?.source === "estimation" && (
                <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                  {routeLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Calcul
                      d'itinéraire...
                    </>
                  ) : (
                    <>· estimation à vol d'oiseau</>
                  )}
                </p>
              )}

              <a
                href={`/annonces/${routeAnnonce.id}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-600 hover:to-indigo-800"
              >
                Voir l'annonce →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Reopen card / clear route pill — when route is shown but card is closed */}
      {!cardOpen && routeAnnonce && (
        <div className="pointer-events-auto absolute bottom-20 left-4 z-[1001] flex items-center gap-1 rounded-full border border-white/40 bg-white/50 p-1 pl-3 text-[11px] font-semibold text-gray-700 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
          <Navigation2 className="h-3 w-3 text-indigo-500" />
          <span className="max-w-[160px] truncate">{routeAnnonce.titre}</span>
          <button
            type="button"
            onClick={() => setCardOpen(true)}
            className="ml-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] text-indigo-600 transition hover:bg-white dark:bg-white/10 dark:text-indigo-300 dark:hover:bg-white/20"
          >
            Détails
          </button>
          <button
            type="button"
            onClick={() => {
              setRouteAnnonce(null);
              onSelect?.(null);
            }}
            className="rounded-full p-1 text-gray-400 transition hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20"
            aria-label="Effacer le trajet"
            title="Effacer le trajet"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Bottom legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[1000] rounded-3xl border border-white/80 bg-white/90 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/90">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              ≥70
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
              ≥40
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              &lt;40
            </span>
          </div>
          <span>{geoCount} marqueur(s)</span>
        </div>
      </div>
    </aside>
  );
}
