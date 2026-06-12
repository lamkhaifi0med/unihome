import { useState, useEffect } from "react";

/* ─── Global keyframe styles injected once ─────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', system-ui, sans-serif; }

  @keyframes floatOrb {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-28px) scale(1.04); }
  }
  @keyframes floatOrb2 {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(22px) scale(0.96); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 3px rgba(52,211,153,0.3); }
    50%       { opacity: 0.6; box-shadow: 0 0 0 6px rgba(52,211,153,0.1); }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .anim-badge  { animation: fadeUp 0.55s 0.05s ease both; }
  .anim-title  { animation: fadeUp 0.55s 0.14s ease both; }
  .anim-sub    { animation: fadeUp 0.55s 0.22s ease both; }
  .anim-search { animation: fadeUp 0.55s 0.30s ease both; }
  .anim-stats  { animation: fadeUp 0.55s 0.40s ease both; }

  .nav-link {
    color: #6b7280; text-decoration: none;
    font-size: 14px; font-weight: 500;
    transition: color 0.15s;
  }
  .nav-link:hover { color: #111827; }

  .btn-ghost {
    padding: 9px 18px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    background: transparent; color: #374151;
    font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, background 0.15s;
  }
  .btn-ghost:hover { border-color: #6366f1; background: #f5f3ff; }

  .btn-primary {
    padding: 9px 18px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #fff; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: 'Inter', sans-serif;
    transition: opacity 0.15s, transform 0.12s;
    box-shadow: 0 4px 12px rgba(99,102,241,0.35);
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

  .listing-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: transform 0.22s ease, box-shadow 0.22s ease;
  }
  .listing-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 18px 44px rgba(99,102,241,0.16);
  }

  .heart-btn {
    position: absolute; top: 10px; right: 10px;
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.92); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    transition: background 0.15s, transform 0.15s;
    backdrop-filter: blur(4px);
  }
  .heart-btn:hover { transform: scale(1.18); background: #fff; }

  .amenity-tag {
    font-size: 11px; font-weight: 500;
    color: #6366f1; background: #eef2ff;
    padding: 3px 8px; border-radius: 6px;
  }

  .see-link {
    font-size: 13px; font-weight: 600; color: #6366f1;
    text-decoration: none;
    transition: opacity 0.15s;
  }
  .see-link:hover { opacity: 0.7; }

  .search-field-wrap { transition: background 0.15s; border-radius: 12px; }
  .search-field-wrap:hover { background: rgba(99,102,241,0.04); }

  input[type=range] {
    -webkit-appearance: none; width: 100%; height: 4px;
    border-radius: 4px; outline: none; cursor: pointer;
    background: linear-gradient(
      to right,
      #6366f1 var(--p, 50%),
      #e5e7eb var(--p, 50%)
    );
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: #6366f1; border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(99,102,241,0.45);
  }

  .step-card {
    padding: 32px 26px; border-radius: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    background: #fff;
    transition: transform 0.2s;
  }
  .step-card:hover { transform: translateY(-4px); }
  .step-card.featured {
    background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
    border: none;
    box-shadow: 0 16px 40px rgba(99,102,241,0.38);
  }

  .footer-link {
    display: block; font-size: 13px; color: #94a3b8;
    text-decoration: none; margin-bottom: 10px;
    transition: color 0.15s;
  }
  .footer-link:hover { color: #c7d2fe; }
`;

/* ─── Colour tokens ─────────────────────────────────────────────── */
const C = {
  heroBg: "linear-gradient(150deg, #160c50 0%, #2a1580 28%, #1a3a8a 65%, #1d4ed8 100%)",
  primary: "#6366f1",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  sectionBg: "#f7f8ff",
};

/* ─── Animated orb layer ────────────────────────────────────────── */
function Orbs() {
  return (
    <>
      <div style={{ position:"absolute", top:"-5%", left:"-10%", width:450, height:450, borderRadius:"50%", background:"radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 68%)", animation:"floatOrb 8s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"0%", right:"-8%", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle, rgba(59,130,246,0.42) 0%, transparent 68%)", animation:"floatOrb2 10s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-12%", left:"38%", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 68%)", animation:"floatOrb 12s ease-in-out infinite 2s", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
    </>
  );
}

/* ─── Navbar ────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position:"sticky", top:0, zIndex:200,
      background:"rgba(255,255,255,0.98)",
      borderBottom:`1px solid ${C.border}`,
      backdropFilter:"blur(14px)",
      boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.07)" : "none",
      transition:"box-shadow 0.2s",
      padding:"0 2rem",
    }}>
      <div style={{ maxWidth:1280, margin:"0 auto", height:66, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

        {/* Logo */}
        <a href="#" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#4338ca)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(99,102,241,0.38)" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="white" fillOpacity=".95"/>
              <rect x="9" y="13" width="6" height="8" rx="1" fill="white" fillOpacity=".55"/>
            </svg>
          </div>
          <span style={{ fontSize:19, fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>
            Uni<span style={{ color:C.primary }}>Home</span>
          </span>
        </a>

        {/* Nav links */}
        <ul style={{ display:"flex", gap:34, listStyle:"none" }}>
          {["Discover","How it Works","Map View","About"].map(l => (
            <li key={l}><a href="#" className="nav-link">{l}</a></li>
          ))}
        </ul>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-ghost">Log In / Sign Up</button>
          <button className="btn-primary">List Your Property</button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero search bar ───────────────────────────────────────────── */
const ROOM_TYPES = ["Studio","Shared Room","Apartment","Private Room"];

function SearchBar() {
  const [where, setWhere]   = useState("");
  const [budget, setBudget] = useState(2500);
  const [type, setType]     = useState("");
  const pct = Math.round(((budget - 500) / 5500) * 100);

  return (
    <div className="anim-search" style={{
      background:"rgba(255,255,255,0.98)",
      borderRadius:20,
      maxWidth:870,
      margin:"0 auto",
      display:"grid",
      gridTemplateColumns:"1fr 1px 1fr 1px 1fr auto",
      alignItems:"center",
      boxShadow:"0 24px 68px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.25)",
      padding:"6px 6px 6px 0",
    }}>
      {/* Where */}
      <div className="search-field-wrap" style={{ padding:"13px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <svg width="13" height="13" fill={C.primary} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
          <span style={{ fontSize:10, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em" }}>Where?</span>
        </div>
        <input value={where} onChange={e=>setWhere(e.target.value)} placeholder="Campus or City"
          style={{ border:"none", outline:"none", fontSize:13, color:C.muted, width:"100%", background:"transparent", fontFamily:"'Inter',sans-serif" }} />
      </div>

      <div style={{ width:1, height:38, background:C.border }} />

      {/* Budget */}
      <div className="search-field-wrap" style={{ padding:"13px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
          <svg width="13" height="13" fill={C.primary} viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
          <span style={{ fontSize:10, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em" }}>How Much?</span>
        </div>
        <input type="range" min={500} max={6000} step={100} value={budget}
          style={{"--p":`${pct}%`}} onChange={e=>setBudget(Number(e.target.value))} />
        <div style={{ fontSize:12, color:C.primary, fontWeight:600, marginTop:4 }}>MAD {budget.toLocaleString()}/m</div>
      </div>

      <div style={{ width:1, height:38, background:C.border }} />

      {/* Type */}
      <div className="search-field-wrap" style={{ padding:"13px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <svg width="13" height="13" fill={C.primary} viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          <span style={{ fontSize:10, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em" }}>Type?</span>
        </div>
        <select value={type} onChange={e=>setType(e.target.value)}
          style={{ border:"none", outline:"none", fontSize:13, color:type?C.text:C.muted, background:"transparent", width:"100%", fontFamily:"'Inter',sans-serif", cursor:"pointer" }}>
          <option value="">Any type</option>
          {ROOM_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Discover btn */}
      <button className="btn-primary" style={{ margin:6, padding:"14px 26px", borderRadius:14, fontSize:15, display:"flex", alignItems:"center", gap:8 }}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        Discover
      </button>
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ background:C.heroBg, padding:"76px 2rem 88px", textAlign:"center", position:"relative", overflow:"hidden" }}>
      <Orbs />

      {/* Verified pill */}
      <div className="anim-badge" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.11)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:999, padding:"7px 18px", color:"#c7d2fe", fontSize:13, fontWeight:600, marginBottom:22, backdropFilter:"blur(8px)", position:"relative" }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:"#34d399", display:"inline-block", animation:"pulse 2s ease infinite" }} />
        99% Verified listings
      </div>

      {/* Heading */}
      <h1 className="anim-title" style={{ fontSize:"clamp(2.3rem,5.5vw,3.7rem)", fontWeight:900, color:"#fff", lineHeight:1.1, letterSpacing:"-2px", margin:"0 0 18px", position:"relative" }}>
        Find Your Perfect<br />
        <span style={{ color:"#a5b4fc" }}>Student Haven</span>
      </h1>

      <p className="anim-sub" style={{ fontSize:17, color:"rgba(199,210,254,0.78)", maxWidth:470, margin:"0 auto 46px", lineHeight:1.75, position:"relative" }}>
        Thousands of verified student rooms across Morocco — near your campus, within your budget.
      </p>

      <div style={{ position:"relative" }}><SearchBar /></div>

      {/* Stat chips */}
      <div className="anim-stats" style={{ display:"flex", justifyContent:"center", gap:14, marginTop:34, position:"relative" }}>
        {[["4,200+","Verified Listings"],["12","Cities"],["MAD 1,500","Avg. Price/mo"]].map(([n,l])=>(
          <div key={l} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.16)", borderRadius:14, padding:"11px 22px", backdropFilter:"blur(8px)", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{n}</div>
            <div style={{ fontSize:11, color:"rgba(199,210,254,0.65)", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Room image placeholder ────────────────────────────────────── */
const GRADS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)",
  "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
  "linear-gradient(135deg,#d4fc79,#96e6a1)",
];

function RoomImg({ id, h = 180 }) {
  return (
    <div style={{ height:h, background:GRADS[id % GRADS.length], position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" style={{ opacity:0.3 }}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="white"/>
        <rect x="9" y="13" width="6" height="8" rx="1" fill="white" fillOpacity=".6"/>
      </svg>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.38) 0%,transparent 55%)" }} />
    </div>
  );
}

/* ─── Listing card ──────────────────────────────────────────────── */
function ListingCard({ listing, delay = 0 }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="listing-card" style={{ animation:`cardIn 0.5s ${delay}s ease both` }}>
      <div style={{ position:"relative" }}>
        <RoomImg id={listing.id} h={listing.featured ? 195 : 172} />
        <button className="heart-btn" style={{ color:liked?"#ef4444":"#9ca3af" }}
          onClick={e=>{ e.stopPropagation(); setLiked(!liked); }}>
          {liked?"♥":"♡"}
        </button>
        <span style={{
          position:"absolute", bottom:10, left:10,
          background: listing.verified >= 99
            ? "linear-gradient(135deg,#34d399,#059669)"
            : "linear-gradient(135deg,#818cf8,#6366f1)",
          color:"#fff", fontSize:11, fontWeight:700,
          padding:"3px 10px", borderRadius:999,
          boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
        }}>
          {listing.verified}% Verified
        </span>
      </div>

      <div style={{ padding:"13px 14px 15px" }}>
        <div style={{ marginBottom:5 }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:500, marginBottom:1 }}>From</div>
          <div style={{ fontSize:17, fontWeight:800, color:C.text, letterSpacing:"-0.4px" }}>
            MAD {listing.price.toLocaleString()}
            <span style={{ fontSize:12, fontWeight:500, color:C.muted }}>/m</span>
          </div>
        </div>

        <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {listing.title}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.muted, marginBottom:9 }}>
          <svg width="11" height="11" fill={C.primary} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
          {listing.location}
        </div>

        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {listing.amenities.map(a => <span key={a} className="amenity-tag">{a}</span>)}
        </div>

        {listing.reason && (
          <div style={{ marginTop:9, paddingTop:9, borderTop:`1px solid ${C.border}`, fontSize:11, color:C.muted, display:"flex", gap:4 }}>
            <span style={{ color:C.primary, fontWeight:700 }}>Smart Reason:</span>
            {listing.reason}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Data ──────────────────────────────────────────────────────── */
const AI_LISTINGS = [
  { id:1, title:"Modern Studio near University of Rabat",     location:"University of Rabat", price:2500, verified:99, amenities:["Wi-Fi","Laundry","Near campus"], reason:"Close to Engineering School." },
  { id:2, title:"Riad Room in Tangier, in Tangier",           location:"on Tangier",           price:2500, verified:99, amenities:["Wi-Fi","Furnished","Near campus"], reason:"Close to Engineering School." },
  { id:3, title:"Shared Flat near Hassan II campus In Rabat", location:"Rabat",                price:2500, verified:99, amenities:["Wi-Fi","Laundry","Near campus"],   reason:"Close to Engineering School." },
];

const FEATURED_LISTINGS = [
  { id:4,  title:"Premium Student Space",  location:"University of Rabat", price:1800, verified:98, amenities:["Wi-Fi","Laundry","Near campus"], featured:true },
  { id:5,  title:"Stunium Student Space",  location:"on Tangier",          price:1800, verified:98, amenities:["Wi-Fi","Laundry","Near campus"], featured:true },
  { id:6,  title:"Shared Student Space",   location:"University of Rabat", price:1800, verified:98, amenities:["Wi-Fi","Laundry","Near campus"], featured:true },
  { id:7,  title:"Shared Student Space",   location:"University of Rabat", price:1800, verified:98, amenities:["Wi-Fi","Laundry","Near campus"], featured:true },
  { id:8,  title:"Shared Student Space",   location:"on Tangier",          price:1800, verified:98, amenities:["Wi-Fi","Laundry","Near campus"], featured:true },
  { id:9,  title:"Shared Student Space",   location:"University of Tangier",price:1500, verified:98, amenities:["Wi-Fi","Laundry","Near campus"], featured:true },
];

/* ─── Split listings section ────────────────────────────────────── */
function ListingsSection() {
  return (
    <section style={{ background:C.sectionBg, padding:"68px 2rem" }}>
      <div style={{ maxWidth:1280, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:56, alignItems:"start" }}>

        {/* LEFT – AI recs */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:C.primary, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>
            AI Recommendations (Top 3)
          </p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <h2 style={{ fontSize:"1.5rem", fontWeight:800, color:C.text, letterSpacing:"-0.5px", lineHeight:1.25 }}>
              AI-Curated Recommendations<br/>for You
            </h2>
            <a href="#" className="see-link">See all →</a>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {AI_LISTINGS.map((l,i) => <ListingCard key={l.id} listing={l} delay={i*0.08} />)}
          </div>
        </div>

        {/* RIGHT – Featured */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <h2 style={{ fontSize:"1.5rem", fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>
              Featured Listings
            </h2>
            <a href="#" className="see-link">View all →</a>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {FEATURED_LISTINGS.map((l,i) => <ListingCard key={l.id} listing={l} delay={i*0.06} />)}
          </div>
        </div>

      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────────────── */
const STEPS = [
  { icon:"🔍", num:"01", title:"Search & Filter",       desc:"Browse thousands of verified listings by city, campus, budget, and room type." },
  { icon:"📅", num:"02", title:"Book a Viewing",         desc:"Schedule in-person or virtual tours directly from the listing page."          },
  { icon:"✅", num:"03", title:"Move In Confidently",    desc:"Every listing is verified. Sign digitally and move in stress-free."            },
];

function HowItWorks() {
  return (
    <section style={{ background:"#fff", padding:"72px 2rem" }}>
      <div style={{ maxWidth:1280, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.primary, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Simple Process</p>
          <h2 style={{ fontSize:"2rem", fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>How UniHome Works</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28 }}>
          {STEPS.map((step,i) => (
            <div key={step.num} className={`step-card${i===1?" featured":""}`}>
              <div style={{ fontSize:38, marginBottom:18 }}>{step.icon}</div>
              <div style={{ fontSize:10, fontWeight:700, color:i===1?"rgba(255,255,255,0.65)":C.primary, letterSpacing:"0.08em", marginBottom:8 }}>STEP {step.num}</div>
              <h3 style={{ fontSize:16, fontWeight:700, color:i===1?"#fff":C.text, margin:"0 0 10px" }}>{step.title}</h3>
              <p style={{ fontSize:14, color:i===1?"rgba(255,255,255,0.78)":C.muted, lineHeight:1.75, margin:0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background:"#0f172a", color:"#94a3b8", padding:"56px 2rem 32px" }}>
      <div style={{ maxWidth:1280, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr 1fr 1fr", gap:44, marginBottom:48 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#6366f1,#4338ca)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
              </div>
              <span style={{ color:"#fff", fontWeight:800, fontSize:18, letterSpacing:"-0.5px" }}>
                Uni<span style={{ color:"#818cf8" }}>Home</span>
              </span>
            </div>
            <p style={{ fontSize:13, lineHeight:1.85, maxWidth:230 }}>Verified student housing across Morocco — simple, safe, affordable.</p>
          </div>
          {[
            { h:"Explore",  links:["Discover","Map View","How it Works"] },
            { h:"Company",  links:["About","Blog","Careers"] },
            { h:"Support",  links:["Help Center","Contact Us","Trust & Safety"] },
          ].map(col => (
            <div key={col.h}>
              <h4 style={{ color:"#fff", fontSize:11, fontWeight:700, margin:"0 0 16px", textTransform:"uppercase", letterSpacing:"0.07em" }}>{col.h}</h4>
              {col.links.map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop:"1px solid #1e293b", paddingTop:24, display:"flex", justifyContent:"space-between", fontSize:12, flexWrap:"wrap", gap:8 }}>
          <span>© 2025 UniHome. All rights reserved.</span>
          <span>Made with ♥ for Moroccan students</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root page ─────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <style>{STYLES}</style>
      <div style={{ fontFamily:"'Inter',system-ui,sans-serif", color:C.text, background:"#fff", minHeight:"100vh" }}>
        <Navbar />
        <Hero />
        <ListingsSection />
        <HowItWorks />
        <Footer />
      </div>
    </>
  );
}