/**
 * CommandMap — the Control Room map for "La Ligne de Commande".
 * Signature: the campus radius ring is a draggable instrument — grab its
 * handle, the rayon token rewrites live, release re-dispatches the search.
 * Pins are verdict-colored dots; a mono HUD reads the machine state.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation2,
  Scan,
  X,
} from "lucide-react";
import { verdictColor } from "../ui/instruments";

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
/* official leaflet 1.9.4 SRI hashes (leafletjs.com) — supply-chain pin */
const LEAFLET_JS_SRI = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
const LEAFLET_CSS_SRI = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.integrity = LEAFLET_CSS_SRI;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L), {
        once: true,
      });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.integrity = LEAFLET_JS_SRI;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function haversineMeters(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a[0])) * Math.cos(toRad(b[0]));
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** destination point at bearing 90° (east) — where the drag handle sits */
function destEast([lat, lng], meters) {
  const dLng =
    (meters / (6371000 * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return [lat, lng + dLng];
}

function pinIcon(L, { score, selected = false }) {
  const color = verdictColor(score);
  const size = selected ? 34 : 26;
  const ring = selected
    ? `<div style="position:absolute;inset:-5px;border-radius:999px;border:2px solid ${color};opacity:.5;animation:uh-map-pulse 1.6s ease-out infinite;"></div>`
    : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      ${ring}
      <div style="position:absolute;inset:0;border-radius:999px;background:${color};border:2.5px solid white;box-shadow:0 4px 12px rgba(9,9,11,.3);display:flex;align-items:center;justify-content:center;color:white;font:600 ${selected ? 12 : 10}px 'JetBrains Mono',monospace;">${Math.max(0, Math.round(score))}</div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function campusIcon(L) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:44px;height:44px;">
      <div style="position:absolute;inset:0;border-radius:12px;background:#2563eb;opacity:.15;filter:blur(4px);"></div>
      <div style="position:absolute;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%);border-radius:10px;background:#2563eb;border:2.5px solid white;box-shadow:0 8px 20px rgba(37,99,235,.4);display:flex;align-items:center;justify-content:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      </div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function handleIcon(L, dragging) {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:999px;background:white;border:3px solid #2563eb;box-shadow:0 4px 14px rgba(37,99,235,.45);cursor:${dragging ? "grabbing" : "grab"};display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"><path d="M8 6l-4 6 4 6M16 6l4 6-4 6"/></svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function ensureStyle() {
  if (document.getElementById("uh-cmdmap-style")) return;
  const style = document.createElement("style");
  style.id = "uh-cmdmap-style";
  style.textContent = `
    @keyframes uh-map-pulse { 0% { transform: scale(.85); opacity: .7; } 70%,100% { transform: scale(1.45); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { @keyframes uh-map-pulse { 0%,100% { transform: none; opacity: .3; } } }
    .leaflet-container { font-family: Geist, system-ui, sans-serif; background: #fafafa; }
    .dark .leaflet-container { background: #18181b; }
    .dark .leaflet-tile { filter: brightness(0.7) contrast(1.1) saturate(0.7); }
    .dark .leaflet-control-zoom a { background: #18181b; color: #e4e4e7; border-color: #3f3f46; }
    .dark .leaflet-control-zoom a:hover { background: #27272a; }
    .dark .leaflet-control-scale-line { background: rgba(24,24,27,.7); color: #d4d4d8; border-color: #52525b; }
    .uh-pin-tip { font-family: 'JetBrains Mono', monospace; font-size: 11px; border-radius: 8px; border: 1px solid #e4e4e7; box-shadow: 0 8px 24px -12px rgba(9,9,11,.3); }
    .dark .uh-pin-tip { background: #18181b; color: #e4e4e7; border-color: #3f3f46; }
    .dark .uh-pin-tip::before { border-top-color: #18181b; }
  `;
  document.head.appendChild(style);
}

export default function CommandMap({
  annonces = [],
  campus,
  rayon = 5000,
  selectedId,
  onSelect,
  onRayonCommit,
  searching = false,
}) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markersLayer = useRef(null);
  const ringLayer = useRef(null);
  const routeLayer = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // live radius while dragging (meters); null = not dragging
  const [liveRayon, setLiveRayon] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isFull, setIsFull] = useState(false);
  const wrapRef = useRef(null);

  const selected = useMemo(
    () => annonces.find((a) => a.id === selectedId) || null,
    [annonces, selectedId],
  );
  const shownRayon = liveRayon ?? Number(rayon);

  /* init */
  useEffect(() => {
    let cancelled = false;
    ensureStyle();
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapNode.current || mapRef.current) return;
        const center =
          campus?.latitude != null
            ? [Number(campus.latitude), Number(campus.longitude)]
            : [31.7917, -7.0926];
        mapRef.current = L.map(mapNode.current, { zoomControl: false }).setView(
          center,
          campus ? 13 : 6,
        );
        L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
        L.control
          .scale({ imperial: false, position: "bottomleft" })
          .addTo(mapRef.current);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
        ringLayer.current = L.layerGroup().addTo(mapRef.current);
        routeLayer.current = L.layerGroup().addTo(mapRef.current);
        markersLayer.current = L.layerGroup().addTo(mapRef.current);
        setReady(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  /* markers */
  useEffect(() => {
    if (!ready || !window.L) return;
    const L = window.L;
    const layer = markersLayer.current;
    layer.clearLayers();
    const bounds = [];

    if (campus?.latitude != null) {
      const ll = [Number(campus.latitude), Number(campus.longitude)];
      bounds.push(ll);
      L.marker(ll, { icon: campusIcon(L), zIndexOffset: 1000 })
        .bindTooltip(campus.sigle || campus.nom, {
          direction: "top",
          offset: [0, -20],
        })
        .addTo(layer);
    }

    annonces
      .filter((a) => a.latitude && a.longitude)
      .forEach((a) => {
        const ll = [Number(a.latitude), Number(a.longitude)];
        bounds.push(ll);
        L.marker(ll, {
          icon: pinIcon(L, {
            score: Number(a.scoreConfiance || 0),
            selected: a.id === selectedId,
          }),
          zIndexOffset: a.id === selectedId ? 800 : 0,
        })
          .bindTooltip(
            `<span style="font-weight:600;">${Number(a.loyer || 0).toLocaleString("fr-FR")} DH</span> · ${(a.titre || "").slice(0, 34)}${(a.titre || "").length > 34 ? "…" : ""}`,
            { direction: "top", offset: [0, -16], className: "uh-pin-tip" },
          )
          .on("click", () => onSelect?.(a.id))
          .addTo(layer);
      });

    if (!selectedId && bounds.length > 0) {
      /* include the radius ring so the draggable instrument is visible on load */
      let fit = L.latLngBounds(bounds);
      if (campus?.latitude && rayon > 0) {
        fit = fit.extend(
          L.latLng(Number(campus.latitude), Number(campus.longitude)).toBounds(
            rayon * 2,
          ),
        );
      }
      mapRef.current.fitBounds(fit, { padding: [40, 40], maxZoom: 14 });
    } else if (!selectedId && bounds.length === 1) {
      mapRef.current.setView(bounds[0], campus ? 13 : 11);
    }
  }, [ready, annonces, campus, rayon, selectedId, onSelect]);

  /* radius commander: circle + draggable east handle */
  useEffect(() => {
    if (!ready || !window.L || !ringLayer.current) return;
    const L = window.L;
    ringLayer.current.clearLayers();
    if (!campus?.latitude) return;

    const center = [Number(campus.latitude), Number(campus.longitude)];
    const circle = L.circle(center, {
      radius: shownRayon,
      color: "#2563eb",
      weight: 2,
      opacity: liveRayon != null ? 0.9 : 0.55,
      fillColor: "#2563eb",
      fillOpacity: liveRayon != null ? 0.08 : 0.04,
      dashArray: liveRayon != null ? null : "6 8",
      interactive: false,
    }).addTo(ringLayer.current);

    const handle = L.marker(destEast(center, shownRayon), {
      icon: handleIcon(L, liveRayon != null),
      draggable: true,
      zIndexOffset: 1200,
      keyboard: false,
    }).addTo(ringLayer.current);
    handle.bindTooltip(
      `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;">rayon ${(shownRayon / 1000).toFixed(1)} km — glisser pour ajuster</span>`,
      { direction: "top", offset: [0, -14] },
    );

    handle.on("drag", (e) => {
      const pos = e.target.getLatLng();
      const d = Math.round(
        Math.min(
          Math.max(haversineMeters(center, [pos.lat, pos.lng]), 500),
          15000,
        ),
      );
      circle.setRadius(d);
      setLiveRayon(d);
    });
    handle.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      const d = Math.round(
        Math.min(
          Math.max(haversineMeters(center, [pos.lat, pos.lng]), 500),
          15000,
        ),
      );
      setLiveRayon(null);
      onRayonCommit?.(d);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, campus, shownRayon, liveRayon != null]);

  /* route campus → selected (OSRM foot, straight-line fallback) */
  useEffect(() => {
    if (!ready || !window.L || !routeLayer.current) return;
    const L = window.L;
    routeLayer.current.clearLayers();
    setRouteInfo(null);
    if (!selected?.latitude || !campus?.latitude) return;

    const from = [Number(campus.latitude), Number(campus.longitude)];
    const to = [Number(selected.latitude), Number(selected.longitude)];
    const straight = haversineMeters(from, to);

    const fallback = L.polyline([from, to], {
      color: "#2563eb",
      weight: 3,
      opacity: 0.5,
      dashArray: "6 8",
    }).addTo(routeLayer.current);
    setRouteInfo({
      distance: straight,
      duration: (straight / 1000 / 5) * 60,
      est: true,
    });
    mapRef.current.fitBounds([from, to], { padding: [70, 70], maxZoom: 15 });

    const ctrl = new AbortController();
    fetch(
      `https://router.project-osrm.org/route/v1/foot/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,
      { signal: ctrl.signal },
    )
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
          color: "#2563eb",
          weight: 4,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(routeLayer.current);
        setRouteInfo({
          distance: route.distance,
          duration: route.duration / 60,
          est: false,
        });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [ready, selected, campus]);

  /* fullscreen: use the native API on the wrapper; Leaflet re-measures */
  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === wrapRef.current;
      setIsFull(active);
      setTimeout(() => mapRef.current?.invalidateSize(), 150);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  };

  const recenterCampus = () => {
    if (!mapRef.current || !campus?.latitude || !window.L) return;
    const c = window.L.latLng(
      Number(campus.latitude),
      Number(campus.longitude),
    );
    mapRef.current.fitBounds(c.toBounds(Number(shownRayon) * 2), {
      padding: [40, 40],
      maxZoom: 15,
    });
  };

  const fitAll = () => {
    if (!mapRef.current || !window.L) return;
    const pts = annonces
      .filter((a) => a.latitude && a.longitude)
      .map((a) => [Number(a.latitude), Number(a.longitude)]);
    if (campus?.latitude)
      pts.push([Number(campus.latitude), Number(campus.longitude)]);
    if (pts.length === 0) return;
    mapRef.current.fitBounds(window.L.latLngBounds(pts), {
      padding: [50, 50],
      maxZoom: 15,
    });
  };

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <MapPin className="h-8 w-8 text-zinc-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Carte indisponible
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Les résultats restent disponibles en liste.
        </p>
      </div>
    );
  }

  const fmtKm = (m) =>
    m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  const fmtMin = (min) =>
    min < 60
      ? `${Math.round(min)} min`
      : `${Math.floor(min / 60)} h ${Math.round(min % 60)}`;

  const ctrlBtn =
    "flex h-9 w-9 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

  return (
    <div
      ref={wrapRef}
      className="relative h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        ref={mapNode}
        className="h-full w-full [&_.leaflet-control-zoom]:overflow-hidden [&_.leaflet-control-zoom]:rounded-lg [&_.leaflet-control-zoom]:border [&_.leaflet-control-zoom]:border-zinc-200 [&_.leaflet-control-zoom]:shadow-sm"
      />

      {!ready && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Chargement de la carte…
          </span>
        </div>
      )}

      {/* HUD — machine state readout */}
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg border border-zinc-200 bg-white/95 px-3 py-2 font-mono text-[11px] shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
        {campus ? (
          <>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {campus.sigle || campus.nom}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <span>
                rayon{" "}
                <span
                  className={`font-semibold tabular-nums ${liveRayon != null ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"}`}
                >
                  {(shownRayon / 1000).toFixed(1)} km
                </span>
              </span>
              {searching && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              )}
            </p>
          </>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">
            choisissez un campus pour le rayon
          </p>
        )}
      </div>

      {/* Control cluster — the instrument's physical switches */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 shadow-sm backdrop-blur dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/95">
        <button
          type="button"
          onClick={toggleFull}
          title={isFull ? "Quitter le plein écran" : "Plein écran"}
          aria-label={isFull ? "Quitter le plein écran" : "Plein écran"}
          className={ctrlBtn}
        >
          {isFull ? (
            <Minimize2 className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Maximize2 className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
        {campus && (
          <button
            type="button"
            onClick={recenterCampus}
            title="Recentrer sur le campus"
            aria-label="Recentrer sur le campus"
            className={ctrlBtn}
          >
            <Crosshair className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={fitAll}
          title="Voir tous les résultats"
          aria-label="Voir tous les résultats"
          className={ctrlBtn}
        >
          <Scan className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Verdict legend — what the pin colors mean */}
      {annonces.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 right-14 z-[1000] hidden items-center gap-3 rounded-lg border border-zinc-200 bg-white/95 px-3 py-1.5 font-mono text-[10px] text-zinc-500 shadow-sm backdrop-blur sm:flex dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#059669" }}
            />
            ≥70
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#d97706" }}
            />
            40–69
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#ef4444" }}
            />
            &lt;40
          </span>
        </div>
      )}

      {/* Selected listing readout */}
      {selected && (
        <div className="absolute bottom-3 left-3 right-14 z-[1000] rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-[0_16px_48px_-24px_rgba(9,9,11,0.3)] backdrop-blur sm:right-auto sm:w-80 dark:border-zinc-700 dark:bg-zinc-900/95">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {selected.titre}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                  {Number(selected.loyer || 0).toLocaleString("fr-FR")}
                </span>{" "}
                DH/mois
                {routeInfo && (
                  <>
                    {" · "}
                    <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                      {fmtKm(routeInfo.distance)}
                    </span>
                    {" · "}
                    <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                      {fmtMin(routeInfo.duration)}
                    </span>{" "}
                    à pied{routeInfo.est ? " (est.)" : ""}
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelect?.(null)}
              aria-label="Fermer"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <a
            href={`/annonces/${selected.id}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
          >
            <Navigation2 className="h-3 w-3" />
            Voir l'annonce
          </a>
        </div>
      )}
    </div>
  );
}
