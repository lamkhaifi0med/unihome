import { useEffect, useRef } from "react";

/*
  Storyset-style ("Rafiki / Amico" family) inline illustration scenes for the
  homepage. Same DNA as design-assets/login_signin/*-amico.svg — dark
  #263238 ink, flat skin tones, opacity shading, floor ellipses — recolored
  to the electric-blue world (#2563EB) and rigged for motion:
  cursor-tracking pupils, idle waves, blinks, swings. All loops are
  disabled under prefers-reduced-motion (see PageStyles in HomePreview).
  Purely decorative: every svg is aria-hidden.
*/

const INK = "#263238";
const SKIN = "#FFC3BD";
const BLUSH = "#F7A9A0";
const BLUE = "#2563EB";
const BLUE_DEEP = "#1D4ED8";

/** Pupils gently follow the cursor (fine pointers only, reduced-motion off). */
function useEyeTrack(max = 2.4) {
  const rootRef = useRef(null);
  const eyesRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return undefined;
    if (!window.matchMedia("(pointer: fine)").matches) return undefined;

    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const root = rootRef.current;
        const eyes = eyesRef.current;
        if (!root || !eyes) return;
        const r = root.getBoundingClientRect();
        if (!r.width) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 260);
        eyes.style.transform = `translate(${((dx / d) * max * k).toFixed(2)}px, ${((dy / d) * max * k).toFixed(2)}px)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [max]);

  return { rootRef, eyesRef };
}

const pivot = (x, y) => ({
  transformBox: "view-box",
  transformOrigin: `${x}px ${y}px`,
});

/* ------------------------------------------------------------------ */
/* Hero buddy — student in a blue hoodie, phone in hand, waving.       */
/* Eyes follow the cursor; the free arm waves every few seconds.       */
/* ------------------------------------------------------------------ */

export function HeroBuddy({ className = "" }) {
  const { rootRef, eyesRef } = useEyeTrack(2.6);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 190 250"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* ground shadow */}
      <ellipse
        cx="95"
        cy="238"
        rx="52"
        ry="8"
        className="fill-zinc-200/70 dark:fill-zinc-800"
      />
      {/* legs */}
      <path
        d="M86,176 L82,222"
        stroke={INK}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M104,176 L110,222"
        stroke={INK}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="66" y="222" width="30" height="12" rx="6" fill={INK} />
      <rect x="98" y="222" width="30" height="12" rx="6" fill={INK} />
      {/* waving arm (behind torso) */}
      <g className="uh-wave-arm" style={pivot(70, 128)}>
        <path
          d="M70,128 C58,124 50,108 54,92"
          stroke={BLUE}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="55" cy="88" r="7" fill={SKIN} />
      </g>
      {/* torso hoodie */}
      <rect x="66" y="112" width="58" height="70" rx="20" fill={BLUE} />
      <rect
        x="102"
        y="112"
        width="22"
        height="70"
        rx="11"
        fill="#000"
        opacity="0.12"
      />
      <path d="M78,112 q17,13 34,0 v9 q-17,12 -34,0 z" fill={BLUE_DEEP} />
      {/* backpack straps */}
      <path
        d="M78,120 L83,152"
        stroke={BLUE_DEEP}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M112,120 L107,152"
        stroke={BLUE_DEEP}
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* phone arm */}
      <path
        d="M118,126 C132,134 134,148 124,158"
        stroke={BLUE}
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <g transform="rotate(-8 108 160)">
        <rect x="94" y="138" width="28" height="44" rx="6" fill={INK} />
        <rect
          x="97"
          y="142"
          width="22"
          height="36"
          rx="3"
          className="fill-white"
        />
        <path
          d="M101,153 l7,-6 7,6 v7 a1,1 0 0 1 -1,1 h-12 a1,1 0 0 1 -1,-1 z"
          fill={BLUE}
        />
        <circle cx="108" cy="169" r="4.5" fill={BLUE} />
        <path
          d="M105.8,169 l1.6,1.6 3,-3.2"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <circle cx="122" cy="160" r="7" fill={SKIN} />
      {/* neck + head */}
      <rect x="88" y="98" width="14" height="16" rx="5" fill={SKIN} />
      <circle cx="67" cy="78" r="5" fill={SKIN} />
      <circle cx="123" cy="78" r="5" fill={SKIN} />
      <circle cx="95" cy="74" r="28" fill={SKIN} />
      <path
        d="M66,74 C66,46 80,38 95,38 C110,38 124,46 124,74 C122,60 116,52 110,54 C102,57 86,57 80,52 C72,48 67,60 66,74 Z"
        fill={INK}
      />
      {/* face */}
      <path
        d="M77,66 q5,-3 10,-1"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M103,65 q5,-2 10,1"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <g className="uh-blink" style={pivot(95, 75)}>
        <circle cx="84" cy="75" r="5" fill="#fff" />
        <circle cx="106" cy="75" r="5" fill="#fff" />
        <g ref={eyesRef} style={{ transition: "transform 120ms ease-out" }}>
          <circle cx="84" cy="75" r="2.4" fill={INK} />
          <circle cx="106" cy="75" r="2.4" fill={INK} />
        </g>
      </g>
      <circle cx="75" cy="85" r="3.5" fill={BLUSH} opacity="0.8" />
      <circle cx="115" cy="85" r="3.5" fill={BLUSH} opacity="0.8" />
      <path
        d="M87,88 Q95,95 103,88"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Pain strip — student sitting on a suitcase, phone showing a fishy   */
/* listing, floating question marks. The "before UniHome" feeling.     */
/* ------------------------------------------------------------------ */

export function StressedSearch({ className = "" }) {
  return (
    <svg
      viewBox="0 0 260 210"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx="130"
        cy="196"
        rx="92"
        ry="9"
        className="fill-zinc-100 dark:fill-zinc-800"
      />
      {/* question marks + sweat */}
      <text
        x="76"
        y="42"
        fontSize="26"
        fontWeight="700"
        fill={BLUE}
        className="uh-float"
        opacity="0.9"
      >
        ?
      </text>
      <text
        x="192"
        y="34"
        fontSize="34"
        fontWeight="700"
        fill={BLUE}
        className="uh-float"
        style={{ animationDelay: "0.7s" }}
      >
        ?
      </text>
      <text
        x="216"
        y="72"
        fontSize="19"
        fontWeight="700"
        fill="#93C5FD"
        className="uh-float"
        style={{ animationDelay: "1.3s" }}
      >
        ?
      </text>
      {/* suitcase */}
      <path
        d="M118,130 v-8 a6,6 0 0 1 6,-6 h12 a6,6 0 0 1 6,6 v8"
        stroke={BLUE_DEEP}
        strokeWidth="5"
        fill="none"
      />
      <rect x="92" y="138" width="76" height="48" rx="10" fill={BLUE} />
      <rect x="92" y="156" width="76" height="9" fill={BLUE_DEEP} />
      <rect x="100" y="184" width="11" height="7" rx="3.5" fill={INK} />
      <rect x="149" y="184" width="11" height="7" rx="3.5" fill={INK} />
      {/* legs */}
      <path
        d="M116,134 L98,144 L98,178"
        stroke={INK}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M144,134 L162,144 L162,178"
        stroke={INK}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="86" y="178" width="26" height="10" rx="5" fill={INK} />
      <rect x="150" y="178" width="26" height="10" rx="5" fill={INK} />
      {/* torso */}
      <rect x="106" y="84" width="48" height="54" rx="16" fill="#DBEAFE" />
      <rect
        x="136"
        y="84"
        width="18"
        height="54"
        rx="9"
        fill="#000"
        opacity="0.06"
      />
      {/* arms to phone */}
      <path
        d="M112,98 C106,112 112,120 121,124"
        stroke={SKIN}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M148,98 C154,112 148,120 139,124"
        stroke={SKIN}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* phone with a suspicious listing */}
      <g transform="rotate(5 130 112)">
        <rect x="119" y="94" width="22" height="34" rx="5" fill={INK} />
        <rect
          x="122"
          y="98"
          width="16"
          height="26"
          rx="2"
          className="fill-white"
        />
        <rect x="124.5" y="101" width="11" height="3" rx="1.5" fill="#E4E4E7" />
        <rect
          x="124.5"
          y="106.5"
          width="8"
          height="3"
          rx="1.5"
          fill="#E4E4E7"
        />
        <circle cx="130" cy="117.5" r="4.5" fill="#FEE2E2" />
        <path
          d="M128.2,115.7 l3.6,3.6 M131.8,115.7 l-3.6,3.6"
          stroke="#EF4444"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <circle cx="121" cy="124" r="5.5" fill={SKIN} />
      <circle cx="139" cy="124" r="5.5" fill={SKIN} />
      {/* neck + head */}
      <rect x="124" y="70" width="12" height="14" rx="4" fill={SKIN} />
      <circle cx="152" cy="30" r="8" fill={INK} />
      <circle cx="106" cy="52" r="4.5" fill={SKIN} />
      <circle cx="154" cy="52" r="4.5" fill={SKIN} />
      <circle cx="130" cy="50" r="24" fill={SKIN} />
      <path
        d="M106,50 C106,26 118,18 130,18 C142,18 154,26 154,50 C152,38 146,32 138,34 C128,37 112,38 108,46 Z"
        fill={INK}
      />
      {/* worried face */}
      <path
        d="M113,44 q5,-3 9,-1"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M138,43 q4,-2 9,1"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <g className="uh-blink" style={pivot(130, 51)}>
        <circle cx="121" cy="51" r="2.2" fill={INK} />
        <circle cx="139" cy="51" r="2.2" fill={INK} />
      </g>
      <path
        d="M123,63 Q130,59 137,63"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M156,36 q5,7 0,9 q-5,-2 0,-9 z" fill="#60A5FA" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* UniBot mascot — blinking robot, pupils follow the cursor.           */
/* ------------------------------------------------------------------ */

export function BotMascot({ className = "" }) {
  const { rootRef, eyesRef } = useEyeTrack(2);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 90 90"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="43" y="6" width="4" height="14" rx="2" fill={INK} />
      <circle cx="45" cy="7" r="4.5" fill="#60A5FA" className="uh-pulse-dot" />
      <rect x="4" y="38" width="8" height="16" rx="4" fill={BLUE_DEEP} />
      <rect x="78" y="38" width="8" height="16" rx="4" fill={BLUE_DEEP} />
      <rect x="12" y="18" width="66" height="54" rx="18" fill={BLUE} />
      <rect
        x="21"
        y="30"
        width="48"
        height="32"
        rx="12"
        className="fill-white"
      />
      <g className="uh-blink" style={pivot(45, 44)}>
        <g ref={eyesRef} style={{ transition: "transform 120ms ease-out" }}>
          <circle cx="36" cy="44" r="4" fill={INK} />
          <circle cx="54" cy="44" r="4" fill={INK} />
        </g>
      </g>
      <circle cx="28" cy="51" r="2.2" fill="#93C5FD" />
      <circle cx="62" cy="51" r="2.2" fill="#93C5FD" />
      <path
        d="M39,54 Q45,59 51,54"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Audience minis — wave when their panel is hovered (.group parent).  */
/* ------------------------------------------------------------------ */

export function StudentMini({ className = "" }) {
  return (
    <svg
      viewBox="0 0 100 130"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx="50"
        cy="124"
        rx="30"
        ry="5"
        className="fill-zinc-200/70 dark:fill-zinc-800"
      />
      <path
        d="M45,92 L42,114"
        stroke={INK}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M55,92 L59,114"
        stroke={INK}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="30" y="114" width="20" height="9" rx="4.5" fill={INK} />
      <rect x="51" y="114" width="20" height="9" rx="4.5" fill={INK} />
      {/* waving arm */}
      <g className="uh-wave-hover" style={pivot(66, 64)}>
        <path
          d="M66,64 C76,60 82,50 80,40"
          stroke={BLUE}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="79" cy="38" r="5" fill={SKIN} />
      </g>
      <rect x="32" y="58" width="36" height="40" rx="13" fill={BLUE} />
      <rect
        x="54"
        y="58"
        width="14"
        height="40"
        rx="7"
        fill="#000"
        opacity="0.12"
      />
      <path
        d="M34,66 C28,74 28,82 34,88"
        stroke={BLUE}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="35" cy="89" r="5" fill={SKIN} />
      <rect x="45" y="48" width="10" height="12" rx="3.5" fill={SKIN} />
      <circle cx="33" cy="38" r="3.5" fill={SKIN} />
      <circle cx="67" cy="38" r="3.5" fill={SKIN} />
      <circle cx="50" cy="36" r="17" fill={SKIN} />
      <path
        d="M33,34 C33,20 40,14 50,14 C60,14 67,20 67,34 C65,26 60,23 55,25 C48,27 38,28 35,32 Z"
        fill={INK}
      />
      {/* graduation cap */}
      <polygon points="50,6 78,15 50,24 22,15" fill={INK} />
      <path
        d="M78,15 v12"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="78" cy="29" r="2.5" fill="#60A5FA" />
      {/* face */}
      <path
        d="M40,32 q4,-2 7,0"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M53,32 q4,-2 7,0"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <g className="uh-blink" style={pivot(50, 37)}>
        <circle cx="44" cy="37" r="2" fill={INK} />
        <circle cx="56" cy="37" r="2" fill={INK} />
      </g>
      <path
        d="M44,44 Q50,49 56,44"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="38" cy="42" r="2.5" fill={BLUSH} opacity="0.8" />
      <circle cx="62" cy="42" r="2.5" fill={BLUSH} opacity="0.8" />
    </svg>
  );
}

export function OwnerMini({ className = "" }) {
  return (
    <svg
      viewBox="0 0 100 130"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx="50"
        cy="124"
        rx="30"
        ry="5"
        className="fill-zinc-200/70 dark:fill-zinc-800"
      />
      <path
        d="M45,92 L42,114"
        stroke="#3F3F46"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M55,92 L59,114"
        stroke="#3F3F46"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="30" y="114" width="20" height="9" rx="4.5" fill={INK} />
      <rect x="51" y="114" width="20" height="9" rx="4.5" fill={INK} />
      {/* arm raised with key */}
      <g className="uh-wave-hover" style={pivot(66, 64)}>
        <path
          d="M66,64 C76,58 82,48 80,38"
          stroke={INK}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="79" cy="36" r="5" fill={SKIN} />
        <circle
          cx="79"
          cy="23"
          r="5.5"
          stroke={BLUE}
          strokeWidth="3.5"
          fill="none"
        />
        <path
          d="M79,28.5 v11 m0,-2.5 h4.5 m-4.5,-4.5 h3.5"
          stroke={BLUE}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
      <rect x="32" y="58" width="36" height="40" rx="13" fill={INK} />
      <path d="M50,58 l-7,0 7,13 7,-13 z" fill="#fff" />
      <path
        d="M34,66 C28,74 28,82 34,88"
        stroke={INK}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="35" cy="89" r="5" fill={SKIN} />
      <rect x="45" y="48" width="10" height="12" rx="3.5" fill={SKIN} />
      <circle cx="33" cy="38" r="3.5" fill={SKIN} />
      <circle cx="67" cy="38" r="3.5" fill={SKIN} />
      <circle cx="50" cy="36" r="17" fill={SKIN} />
      <path
        d="M33,32 C33,18 42,13 50,13 C58,13 67,18 67,32 C64,23 58,21 52,23 C46,25 38,26 35,30 Z"
        fill={INK}
      />
      <path
        d="M40,31 q4,-2 7,0"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M53,31 q4,-2 7,0"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <g className="uh-blink" style={pivot(50, 37)}>
        <circle cx="44" cy="37" r="2" fill={INK} />
        <circle cx="56" cy="37" r="2" fill={INK} />
      </g>
      <path
        d="M44,44 Q50,48 56,44"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA — mid-air celebration with the keys, door behind,         */
/* blue confetti. The "found it" moment.                               */
/* ------------------------------------------------------------------ */

export function CelebrateMoveIn({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 210"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* door */}
      <rect
        x="138"
        y="30"
        width="74"
        height="150"
        rx="8"
        className="fill-white stroke-zinc-200 dark:fill-zinc-900 dark:stroke-zinc-700"
        strokeWidth="2"
      />
      <rect x="146" y="40" width="58" height="140" rx="6" fill={BLUE} />
      <rect
        x="154"
        y="52"
        width="42"
        height="46"
        rx="4"
        fill="#000"
        opacity="0.12"
      />
      <rect
        x="154"
        y="108"
        width="42"
        height="60"
        rx="4"
        fill="#000"
        opacity="0.12"
      />
      <circle cx="196" cy="104" r="3.5" fill="#fff" />
      <ellipse
        cx="120"
        cy="196"
        rx="100"
        ry="9"
        className="fill-zinc-100 dark:fill-zinc-800"
      />
      {/* confetti */}
      <circle cx="30" cy="42" r="3" fill="#60A5FA" className="uh-float" />
      <circle
        cx="118"
        cy="22"
        r="2.5"
        fill={BLUE}
        className="uh-float"
        style={{ animationDelay: "0.5s" }}
      />
      <rect
        x="52"
        y="88"
        width="5"
        height="5"
        rx="1"
        fill="#93C5FD"
        transform="rotate(24 54 90)"
        className="uh-float"
        style={{ animationDelay: "0.9s" }}
      />
      <rect
        x="128"
        y="52"
        width="5"
        height="5"
        rx="1"
        fill="#BFDBFE"
        transform="rotate(-18 130 54)"
        className="uh-float"
        style={{ animationDelay: "1.4s" }}
      />
      <circle
        cx="222"
        cy="26"
        r="2.5"
        fill="#A1A1AA"
        className="uh-float"
        style={{ animationDelay: "1.8s" }}
      />
      {/* character (hops; shadow stays put) */}
      <ellipse
        cx="76"
        cy="192"
        rx="24"
        ry="4.5"
        className="fill-zinc-200/80 dark:fill-zinc-800"
      />
      <g className="uh-hop">
        {/* legs mid-jump */}
        <path
          d="M66,150 L58,164 L64,176"
          stroke={INK}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M86,150 L94,162 L88,174"
          stroke={INK}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect x="56" y="174" width="21" height="9" rx="4.5" fill={INK} />
        <rect x="80" y="172" width="21" height="9" rx="4.5" fill={INK} />
        {/* arms up */}
        <path
          d="M58,106 C46,98 40,84 44,70"
          stroke={BLUE}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="45" cy="68" r="6" fill={SKIN} />
        <path
          d="M88,104 C100,92 104,74 100,58"
          stroke={BLUE}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="99" cy="56" r="6" fill={SKIN} />
        {/* key ring in raised hand */}
        <circle
          cx="99"
          cy="45"
          r="6.5"
          stroke={INK}
          strokeWidth="2.5"
          fill="none"
        />
        <g className="uh-swing" style={pivot(99, 51)}>
          <path
            d="M99,51 v13 m0,-3 h4.5 m-4.5,-4.5 h3.5"
            stroke={BLUE}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle
            cx="99"
            cy="53"
            r="3"
            stroke={BLUE}
            strokeWidth="2"
            fill="none"
          />
        </g>
        {/* torso */}
        <rect x="56" y="96" width="40" height="58" rx="15" fill={BLUE} />
        <rect
          x="80"
          y="96"
          width="16"
          height="58"
          rx="8"
          fill="#000"
          opacity="0.12"
        />
        {/* neck + head */}
        <rect x="70" y="82" width="12" height="16" rx="4" fill={SKIN} />
        <circle cx="55" cy="62" r="4" fill={SKIN} />
        <circle cx="97" cy="62" r="4" fill={SKIN} />
        <circle cx="76" cy="60" r="22" fill={SKIN} />
        <path
          d="M54,58 C54,36 64,30 76,30 C88,30 98,36 98,58 C95,46 90,42 84,44 C76,46 62,47 57,53 Z"
          fill={INK}
        />
        {/* happy closed eyes + open smile */}
        <path
          d="M64,58 q4,-4 8,0"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M80,58 q4,-4 8,0"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M67,66 Q76,76 85,66 Q76,71 67,66 Z" fill={INK} />
        <circle cx="60" cy="66" r="3" fill={BLUSH} opacity="0.8" />
        <circle cx="92" cy="66" r="3" fill={BLUSH} opacity="0.8" />
      </g>
    </svg>
  );
}

export function PlantPot({ className = "" }) {
  return (
    <svg
      viewBox="0 0 90 110"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g className="uh-sway" style={pivot(45, 76)}>
        <path
          d="M45,74 C45,52 40,42 29,33"
          stroke={BLUE}
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M45,74 C45,50 52,40 62,30"
          stroke={BLUE}
          strokeWidth="2.5"
          fill="none"
        />
        <path d="M45,74 V34" stroke={BLUE} strokeWidth="2.5" fill="none" />
        <ellipse
          cx="28"
          cy="28"
          rx="8"
          ry="14"
          fill="#60A5FA"
          transform="rotate(-32 28 28)"
        />
        <ellipse
          cx="63"
          cy="25"
          rx="8"
          ry="14"
          fill={BLUE}
          transform="rotate(26 63 25)"
        />
        <ellipse cx="45" cy="27" rx="7" ry="13" fill="#93C5FD" />
      </g>
      <rect x="22" y="70" width="46" height="9" rx="4.5" fill={BLUE} />
      <path d="M26,79 h38 l-5,26 h-28 z" fill={BLUE_DEEP} />
      <ellipse
        cx="45"
        cy="106"
        rx="26"
        ry="4"
        className="fill-zinc-200/70 dark:fill-zinc-800"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Shared keyframes for pages that don't render HomePreview's          */
/* PageStyles (login / register). Same uh-* classes.                   */
/* ------------------------------------------------------------------ */

export function SceneStyles() {
  return (
    <style>{`
      @keyframes uh-eyelid {
        0%, 94%, 100% { transform: scaleY(1); }
        97% { transform: scaleY(0.08); }
      }
      .uh-blink { animation: uh-eyelid 4.6s ease-in-out infinite; }
      @keyframes uh-wave {
        0%, 74%, 100% { transform: rotate(0deg); }
        80% { transform: rotate(-14deg); }
        86% { transform: rotate(10deg); }
        92% { transform: rotate(-10deg); }
      }
      .uh-wave-arm { animation: uh-wave 5.4s ease-in-out infinite; }
      @keyframes uh-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
      }
      .uh-float { animation: uh-float 3.4s ease-in-out infinite; }
      @keyframes uh-swingkey {
        0%, 100% { transform: rotate(-8deg); }
        50% { transform: rotate(8deg); }
      }
      .uh-swing { animation: uh-swingkey 2.4s ease-in-out infinite; }
      @keyframes uh-sway {
        0%, 100% { transform: rotate(-2.5deg); }
        50% { transform: rotate(2.5deg); }
      }
      .uh-sway { animation: uh-sway 4.2s ease-in-out infinite; }
      .uh-dotgrid {
        background-image: radial-gradient(circle, rgba(9,9,11,0.10) 1px, transparent 1px);
        background-size: 22px 22px;
      }
      .dark .uh-dotgrid {
        background-image: radial-gradient(circle, rgba(250,250,250,0.09) 1px, transparent 1px);
      }
      @media (prefers-reduced-motion: reduce) {
        .uh-blink, .uh-wave-arm, .uh-float, .uh-swing, .uh-sway { animation: none; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Login — back at the front door, key in hand, plant by the step.     */
/* Eyes follow the cursor, free arm waves, key ring swings.            */
/* ------------------------------------------------------------------ */

export function WelcomeHome({ className = "" }) {
  const { rootRef, eyesRef } = useEyeTrack(2.6);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 340 320"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* door + frame */}
      <rect
        x="188"
        y="34"
        width="106"
        height="240"
        rx="10"
        className="fill-white stroke-zinc-200 dark:fill-zinc-900 dark:stroke-zinc-700"
        strokeWidth="2"
      />
      <rect x="198" y="46" width="86" height="228" rx="7" fill={BLUE} />
      <rect
        x="208"
        y="62"
        width="66"
        height="72"
        rx="5"
        fill="#000"
        opacity="0.12"
      />
      <rect
        x="208"
        y="148"
        width="66"
        height="96"
        rx="5"
        fill="#000"
        opacity="0.12"
      />
      <circle cx="272" cy="160" r="4.5" fill="#fff" />
      {/* wall lamp glow */}
      <circle cx="241" cy="16" r="6" fill="#60A5FA" className="uh-float" />
      <ellipse
        cx="170"
        cy="300"
        rx="140"
        ry="12"
        className="fill-zinc-100 dark:fill-zinc-800"
      />
      {/* doormat */}
      <rect
        x="196"
        y="282"
        width="90"
        height="12"
        rx="6"
        className="fill-zinc-200 dark:fill-zinc-700"
      />
      {/* plant by the step */}
      <g transform="translate(288 200) scale(0.9)">
        <g className="uh-sway" style={pivot(45, 76)}>
          <path
            d="M45,74 C45,52 40,42 29,33"
            stroke={BLUE}
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M45,74 C45,50 52,40 62,30"
            stroke={BLUE}
            strokeWidth="2.5"
            fill="none"
          />
          <path d="M45,74 V34" stroke={BLUE} strokeWidth="2.5" fill="none" />
          <ellipse
            cx="28"
            cy="28"
            rx="8"
            ry="14"
            fill="#60A5FA"
            transform="rotate(-32 28 28)"
          />
          <ellipse
            cx="63"
            cy="25"
            rx="8"
            ry="14"
            fill={BLUE}
            transform="rotate(26 63 25)"
          />
          <ellipse cx="45" cy="27" rx="7" ry="13" fill="#93C5FD" />
        </g>
        <rect x="22" y="70" width="46" height="9" rx="4.5" fill={BLUE} />
        <path d="M26,79 h38 l-5,26 h-28 z" fill={BLUE_DEEP} />
      </g>

      {/* character */}
      <g>
        {/* legs */}
        <path
          d="M96,232 L92,282"
          stroke={INK}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M116,232 L124,282"
          stroke={INK}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="74" y="282" width="33" height="13" rx="6.5" fill={INK} />
        <rect x="110" y="282" width="33" height="13" rx="6.5" fill={INK} />
        {/* waving arm */}
        <g className="uh-wave-arm" style={pivot(78, 172)}>
          <path
            d="M78,172 C64,166 56,148 60,130"
            stroke={BLUE}
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="61" cy="125" r="8" fill={SKIN} />
        </g>
        {/* torso */}
        <rect x="72" y="152" width="66" height="84" rx="22" fill={BLUE} />
        <rect
          x="112"
          y="152"
          width="26"
          height="84"
          rx="13"
          fill="#000"
          opacity="0.12"
        />
        <path d="M86,152 q20,15 38,0 v10 q-19,13 -38,0 z" fill={BLUE_DEEP} />
        {/* arm holding the key toward the door */}
        <path
          d="M134,168 C154,172 166,184 168,200"
          stroke={BLUE}
          strokeWidth="13"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="169" cy="204" r="8" fill={SKIN} />
        {/* key ring, swinging */}
        <circle
          cx="172"
          cy="212"
          r="7"
          stroke={INK}
          strokeWidth="2.5"
          fill="none"
        />
        <g className="uh-swing" style={pivot(172, 219)}>
          <path
            d="M172,219 v15 m0,-3.5 h5.5 m-5.5,-5.5 h4.5"
            stroke={BLUE}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle
            cx="172"
            cy="222"
            r="3.5"
            stroke={BLUE}
            strokeWidth="2.5"
            fill="none"
          />
        </g>
        {/* neck + head */}
        <rect x="97" y="136" width="16" height="18" rx="6" fill={SKIN} />
        <circle cx="73" cy="112" r="5.5" fill={SKIN} />
        <circle cx="137" cy="112" r="5.5" fill={SKIN} />
        <circle cx="105" cy="108" r="32" fill={SKIN} />
        <path
          d="M73,108 C73,76 89,68 105,68 C121,68 137,76 137,108 C135,92 128,84 121,86 C112,89 94,89 87,84 C78,80 74,92 73,108 Z"
          fill={INK}
        />
        {/* face */}
        <path
          d="M85,99 q6,-3 11,-1"
          stroke={INK}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M114,98 q6,-2 11,1"
          stroke={INK}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <g className="uh-blink" style={pivot(105, 109)}>
          <circle cx="93" cy="109" r="5.5" fill="#fff" />
          <circle cx="117" cy="109" r="5.5" fill="#fff" />
          <g ref={eyesRef} style={{ transition: "transform 120ms ease-out" }}>
            <circle cx="93" cy="109" r="2.6" fill={INK} />
            <circle cx="117" cy="109" r="2.6" fill={INK} />
          </g>
        </g>
        <circle cx="83" cy="120" r="4" fill={BLUSH} opacity="0.8" />
        <circle cx="127" cy="120" r="4" fill={BLUSH} opacity="0.8" />
        <path
          d="M96,123 Q105,131 114,123"
          stroke={INK}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Register — student & owner on either side of a big profile card     */
/* getting its verified badge. The "join the platform" moment.         */
/* ------------------------------------------------------------------ */

export function JoinUs({ className = "" }) {
  const { rootRef, eyesRef } = useEyeTrack(2.2);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 340 320"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx="170"
        cy="302"
        rx="140"
        ry="12"
        className="fill-zinc-100 dark:fill-zinc-800"
      />
      {/* big profile card */}
      <g className="uh-float" style={{ animationDuration: "5.2s" }}>
        <rect
          x="112"
          y="52"
          width="116"
          height="150"
          rx="12"
          className="fill-white stroke-zinc-200 dark:fill-zinc-900 dark:stroke-zinc-700"
          strokeWidth="2"
        />
        <circle
          cx="170"
          cy="96"
          r="22"
          className="fill-zinc-100 dark:fill-zinc-800"
        />
        <circle cx="170" cy="89" r="8" fill={BLUE} opacity="0.35" />
        <path d="M156,108 a14,11 0 0 1 28,0" fill={BLUE} opacity="0.35" />
        <rect
          x="134"
          y="130"
          width="72"
          height="7"
          rx="3.5"
          className="fill-zinc-200 dark:fill-zinc-700"
        />
        <rect
          x="146"
          y="144"
          width="48"
          height="6"
          rx="3"
          className="fill-zinc-100 dark:fill-zinc-800"
        />
        {/* verified badge stamping in */}
        <g>
          <circle cx="170" cy="176" r="13" fill="#ECFDF5" />
          <circle
            cx="170"
            cy="176"
            r="13"
            stroke="#059669"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M164,176 l4.5,4.5 8,-9"
            stroke="#059669"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </g>
      {/* sparkles */}
      <path
        d="M116,36 l2.5,6 6,2.5 -6,2.5 -2.5,6 -2.5,-6 -6,-2.5 6,-2.5 z"
        fill="#60A5FA"
        className="uh-float"
        style={{ animationDelay: "0.6s" }}
      />
      <circle
        cx="240"
        cy="40"
        r="3.5"
        fill={BLUE}
        className="uh-float"
        style={{ animationDelay: "1.2s" }}
      />

      {/* student (left) — eyes track */}
      <g>
        <path
          d="M62,238 L58,286"
          stroke={INK}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M80,238 L86,286"
          stroke={INK}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="42" y="286" width="29" height="11" rx="5.5" fill={INK} />
        <rect x="73" y="286" width="29" height="11" rx="5.5" fill={INK} />
        {/* arm pointing at the card */}
        <path
          d="M96,178 C110,172 120,162 126,150"
          stroke={BLUE}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="128" cy="146" r="7" fill={SKIN} />
        <rect x="44" y="162" width="54" height="80" rx="19" fill={BLUE} />
        <rect
          x="76"
          y="162"
          width="22"
          height="80"
          rx="11"
          fill="#000"
          opacity="0.12"
        />
        <path
          d="M46,174 C38,184 38,196 46,204"
          stroke={BLUE}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="47" cy="206" r="7" fill={SKIN} />
        <rect x="63" y="148" width="14" height="16" rx="5" fill={SKIN} />
        <circle cx="46" cy="124" r="5" fill={SKIN} />
        <circle cx="94" cy="124" r="5" fill={SKIN} />
        <circle cx="70" cy="121" r="26" fill={SKIN} />
        <path
          d="M44,118 C44,94 56,86 70,86 C84,86 96,94 96,118 C93,104 86,100 78,103 C68,106 52,106 47,112 Z"
          fill={INK}
        />
        {/* graduation cap */}
        <polygon points="70,74 112,88 70,102 28,88" fill={INK} />
        <path
          d="M112,88 v18"
          stroke="#60A5FA"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="112" cy="109" r="3" fill="#60A5FA" />
        <path
          d="M56,114 q5,-2 9,0"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M75,114 q5,-2 9,0"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <g className="uh-blink" style={pivot(70, 122)}>
          <circle cx="61" cy="122" r="4.5" fill="#fff" />
          <circle cx="79" cy="122" r="4.5" fill="#fff" />
          <g ref={eyesRef} style={{ transition: "transform 120ms ease-out" }}>
            <circle cx="61" cy="122" r="2.2" fill={INK} />
            <circle cx="79" cy="122" r="2.2" fill={INK} />
          </g>
        </g>
        <path
          d="M62,131 Q70,137 78,131"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="53" cy="128" r="3" fill={BLUSH} opacity="0.8" />
        <circle cx="87" cy="128" r="3" fill={BLUSH} opacity="0.8" />
      </g>

      {/* owner (right) — waves, holds key */}
      <g>
        <path
          d="M258,238 L254,286"
          stroke="#3F3F46"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M276,238 L282,286"
          stroke="#3F3F46"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="238" y="286" width="29" height="11" rx="5.5" fill={INK} />
        <rect x="269" y="286" width="29" height="11" rx="5.5" fill={INK} />
        {/* raised arm with key */}
        <g className="uh-wave-arm" style={pivot(240, 178)}>
          <path
            d="M240,178 C226,170 218,156 220,142"
            stroke={INK}
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="219" cy="138" r="7" fill={SKIN} />
          <circle
            cx="219"
            cy="124"
            r="6"
            stroke={BLUE}
            strokeWidth="3.5"
            fill="none"
          />
          <path
            d="M219,130 v12 m0,-3 h5 m-5,-5 h4"
            stroke={BLUE}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
        <rect x="240" y="162" width="54" height="80" rx="19" fill={INK} />
        <path d="M267,162 l-9,0 9,17 9,-17 z" fill="#fff" />
        <path
          d="M292,174 C300,184 300,196 292,204"
          stroke={INK}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="291" cy="206" r="7" fill={SKIN} />
        <rect x="260" y="148" width="14" height="16" rx="5" fill={SKIN} />
        <circle cx="243" cy="124" r="5" fill={SKIN} />
        <circle cx="291" cy="124" r="5" fill={SKIN} />
        <circle cx="267" cy="121" r="26" fill={SKIN} />
        <path
          d="M241,114 C241,92 254,85 267,85 C280,85 293,92 293,114 C289,100 281,98 273,101 C264,104 249,104 244,110 Z"
          fill={INK}
        />
        <path
          d="M253,114 q5,-2 9,0"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M272,114 q5,-2 9,0"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <g className="uh-blink" style={pivot(267, 122)}>
          <circle cx="258" cy="122" r="2.2" fill={INK} />
          <circle cx="276" cy="122" r="2.2" fill={INK} />
        </g>
        <path
          d="M259,131 Q267,136 275,131"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
