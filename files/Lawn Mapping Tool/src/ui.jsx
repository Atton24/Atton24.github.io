/* ═══════════════════════════════════════════════════════════════════════════
   PATCH · UI PRIMITIVES
   Tooltip, Icon, swatches, glyphs, HelpModal.
═══════════════════════════════════════════════════════════════════════════ */

const { useState: useStateUI, useRef: useRefUI, useEffect: useEffectUI } = React;

/* ─── ICON SET (line SVG) ──────────────────────────────────────────────── */
const ICONS = {
  leaf:  <path d="M3 21c0-8 6-15 18-18-2 11-9 18-18 18zM3 21c4-4 8-7 13-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  paint: <path d="M4 14l8-8 6 6-8 8H4v-6zm10-10l3-3 4 4-3 3M6 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  rect:  <><rect x="3.5" y="6" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" strokeDasharray="3 2" fill="none"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor"/><circle cx="20.5" cy="19" r="1.5" fill="currentColor"/></>,
  rect_erase: <><rect x="3.5" y="6" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" strokeDasharray="3 2" fill="none"/><path d="M8 10l8 5M16 10l-8 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></>,
  erase: <><path d="M16 7l-9 9 4 4h4l5-5-4-4M3 20h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  select:<><path d="M5 4l5 16 3-7 7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/></>,
  pan:   <><path d="M9 11V5a2 2 0 0 1 4 0v8M13 8a2 2 0 0 1 4 0v5M17 10a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.5-3.6L5 14a2 2 0 1 1 3.4-2L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  tree:  <><path d="M12 3l5 8h-3l4 6h-4l3 4H7l3-4H6l4-6H7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/><path d="M11 21h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  shrub: <><path d="M5 17c-2 0-3-2-2-4 0-2 2-3 3-3 0-2 2-4 4-4s4 2 4 4c2 0 4 1 4 3s-1 4-3 4M5 17h14M9 17v3M15 17v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  flower:<><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7c2 0 3 1 3 3M12 17c2 0 3-1 3-3M12 7c-2 0-3 1-3 3M12 17c-2 0-3-1-3-3M7 12c0-2 1-3 3-3M17 12c0-2-1-3-3-3M7 12c0 2 1 3 3 3M17 12c0 2-1 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  bed:   <><rect x="3" y="9" width="18" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M7 9V6h10v3M3 13h18M9 13v6M15 13v6" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  spray: <><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 8v-3M12 16v3M16 12h3M5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  drip:  <><circle cx="12" cy="14" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/><path d="M12 4c2 4 3 6 3 8a3 3 0 0 1-6 0c0-2 1-4 3-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  tap:   <><rect x="6" y="8" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M9 8V6c0-1 1-2 2-2h2c1 0 2 1 2 2v2M11 12h2M12 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  hose:  <><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  pump:  <><rect x="5" y="8" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 8V6h8v2" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  light: <><path d="M9 18h6M10 21h4M12 3a5 5 0 0 0-3 9c1 1 1 2 1 3h4c0-1 0-2 1-3a5 5 0 0 0-3-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  bench: <><path d="M3 10h18M5 10v6M19 10v6M3 14h18M7 17l-1 3M17 17l1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  fire:  <><path d="M12 3c1 3 4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 0-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></>,
  gazebo:<><path d="M4 10l8-6 8 6M6 10v9M18 10v9M4 19h16M9 19v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></>,
  shed:  <><path d="M4 12l8-6 8 6v8H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/><path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  house: <><path d="M3 11l9-7 9 7v9H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/><path d="M10 20v-6h4v6M14 8v-3h3v5" stroke="currentColor" strokeWidth="1.4" fill="none"/></>,
  pool:  <><ellipse cx="12" cy="14" rx="8" ry="5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M6 11s1-1 2-1 2 1 4 1 3-1 4-1 2 1 2 1" stroke="currentColor" strokeWidth="1.3" fill="none"/></>,
  compost:<><rect x="4" y="6" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M4 11h16M4 16h16M9 6v14M15 6v14" stroke="currentColor" strokeWidth="1.2" fill="none"/></>,
  fence: <><path d="M4 9l2-3 2 3v11H4zM10 9l2-3 2 3v11h-4zM16 9l2-3 2 3v11h-4zM2 14h20M2 17h20" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/></>,
  gate:  <><path d="M4 9v11M20 9v11M4 12c4 0 8 1.5 12 5l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M4 8h3M17 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  path:  <><path d="M5 4c0 4 14 4 14 8s-14 4-14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="1 4"/></>,
  wall:  <><path d="M3 6h18M3 12h18M3 18h18M9 6v6M15 6v6M6 12v6M12 12v6M18 12v6" stroke="currentColor" strokeWidth="1.4" fill="none"/></>,
  hedge: <><path d="M3 18c0-4 3-6 5-6 0-3 2-5 4-5s4 2 4 5c3 0 5 2 5 6H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/></>,
  power: <><path d="M4 20l4-8h-3l4-9-1 7h3l-4 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></>,
  ruler: <><path d="M3 12l12-12 6 6-12 12zM7 5l2 2M5 7l3 3M9 3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  pipe:  <><path d="M3 12h6a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeDasharray="5 3"/></>,
  drip2: <><path d="M3 7h18M3 17h18M8 7v10M16 7v10M12 11l1 2-1 1-1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></>,
  undo:  <><path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  redo:  <><path d="M15 7l5 5-5 5M20 12H9a5 5 0 0 0 0 10h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  trash: <><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  help:  <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M9.5 9c0-1.5 1.1-2.5 2.5-2.5s2.5 1 2.5 2.4c0 1.6-2 2.1-2.5 3.6M12 16.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
  sun:   <><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
  moon:  <><path d="M21 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/></>,
  full:  <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
  unfull:<><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
  upload:<><path d="M12 16V4M7 9l5-5 5 5M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  download:<><path d="M12 4v12M7 11l5 5 5-5M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  grid:  <><path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="3" y="3" width="18" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  map:   <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v16M15 6v16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></>,
  sparkle:<><path d="M12 3l1.5 6 6 1.5-6 1.5L12 18l-1.5-6-6-1.5 6-1.5zM19 4l.7 2.3L22 7l-2.3.7L19 10l-.7-2.3L16 7l2.3-.7zM5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/></>,
  shop:  <><path d="M3 6h2l2 11a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1.5-7H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="9" cy="22" r="1" fill="currentColor"/><circle cx="17" cy="22" r="1" fill="currentColor"/></>,
  stats: <><path d="M4 20h16M7 20V11M12 20V5M17 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/></>,
  size:  <><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  close: <><path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
  chevron:<><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  check: <><path d="M5 13l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  plus:  <><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
};

// Map tool IDs to icons
const TOOL_ICON = {
  select:"select", pan:"pan", paint:"paint", rect:"rect", erase:"erase", rect_erase:"rect_erase",
  tree:"tree", shrub:"shrub", flowerbed:"flower", raised_bed:"bed",
  sprinkler:"spray", drip_emitter:"drip", watersource:"tap",
  hose_reel:"hose", pump:"pump", light:"light", bench:"bench",
  firepit:"fire", gazebo:"gazebo", shed:"shed", pool:"pool",
  compost:"compost", house:"house",
  irrigation:"pipe", drip_line:"drip2", fence:"fence", gate:"gate", path:"path",
  wall:"wall", hedge:"hedge", powerline:"power", measure:"ruler",
};

function Icon({ name, size=18, color="currentColor", style={} }) {
  const path = ICONS[name];
  if (!path) return <span style={{fontSize:size}}>·</span>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:"inline-block", flexShrink:0, color, ...style}}>{path}</svg>
  );
}

/* ─── TOOLTIP ──────────────────────────────────────────────────────────── */
function Tip({text, children, side="bottom"}) {
  const [vis, setVis] = useStateUI(false);
  const [pos, setPos] = useStateUI({x:0, y:0});
  const timer = useRefUI(null);
  return (
    <span style={{display:"contents"}}
      onMouseEnter={e=>{const p={x:e.clientX+12,y:e.clientY+8};setPos(p);timer.current=setTimeout(()=>setVis(true),350);}}
      onMouseMove={e=>setPos({x:e.clientX+12,y:e.clientY+8})}
      onMouseLeave={()=>{clearTimeout(timer.current);setVis(false);}}>
      {children}
      {vis && (
        <div style={{
          position:"fixed", left:Math.min(pos.x, window.innerWidth-230), top:pos.y,
          zIndex:9999, background:"#2A2E25", color:"#FBF9F4",
          border:"1px solid rgba(255,255,255,.1)", borderRadius:8,
          padding:"7px 11px", fontSize:12.5, maxWidth:220, lineHeight:1.55,
          pointerEvents:"none", boxShadow:"0 6px 22px rgba(0,0,0,.25)",
          fontFamily:"var(--font-sans)",
        }}>{text}</div>
      )}
    </span>
  );
}

/* ─── SECTION LABEL (sidebar headings) ─────────────────────────────────── */
function SectionLabel({children, T, style={}}) {
  return (
    <div style={{
      fontSize:10.5, fontWeight:700, color:T.text3,
      textTransform:"uppercase", letterSpacing:".09em",
      marginBottom:8, ...style,
    }}>{children}</div>
  );
}

/* ─── PILL BUTTON ──────────────────────────────────────────────────────── */
function Pill({active, onClick, children, T, color, style={}, title}) {
  return (
    <button onClick={onClick} title={title} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"5px 11px", fontSize:11.5, fontWeight:600,
      borderRadius:999, cursor:"pointer",
      border:`1px solid ${active ? (color||T.primary) : T.border}`,
      background: active ? (color ? color+"1F" : T.primaryBg) : "transparent",
      color: active ? (color||T.primaryDk) : T.text2,
      transition:"all .12s",
      fontFamily:"var(--font-sans)",
      ...style,
    }}>{children}</button>
  );
}

/* ─── HELP MODAL ───────────────────────────────────────────────────────── */
const HELP_ITEMS = [
  {ico:"sparkle",h:"Quick start",b:"1. Open Yard Setup → pick a preset size or import a plot plan.\n2. Paint your ground (Ground tab) — grass, concrete, decking…\n3. Place a Water Source (tap), then run Auto Irrigate.\n4. Add objects: trees, sprinklers, beds (Objects tab).\n5. Draw lines: fences, paths, pipes (Lines tab)."},
  {ico:"paint", h:"Paint vs. Rect Fill",b:"Paint = freehand. Click-drag to paint cells one by one.\nRect Fill = drag a rectangle. The preview shows live dimensions and area while you drag — best for lawns and patios."},
  {ico:"spray", h:"Sprinklers & Auto Irrigate",b:"Place a Water Source first, then run ✨ Auto Irrigate. Choose a sprinkler type (strip / pop-up / rotary / rotor / impact), tune the radius, and watch live coverage update. Assign heads to zones for separate watering schedules."},
  {ico:"ruler", h:"Measure tool",b:"Drag the Measure line across any part of the plan. The label shows real-world length. Toggle between metric / imperial with the m·ft pill at top right."},
  {ico:"select",h:"Select & delete",b:"Switch to Select, click anything to highlight it (sage glow). Edit properties in the side panel. Press Delete to remove. Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo."},
  {ico:"map",   h:"Plot plan import",b:"Upload a PDF or image of your plot plan. Patch reads the scale notation, traces the house footprint, and configures the grid automatically — leaving the yard clear for you to design."},
  {ico:"download",h:"Save & load",b:"Export saves your full design (ground, objects, lines, scale, units) to a JSON file. Import loads it back. Use Materials List to generate a shopping list of pipe, fittings, sprinkler heads, and ground cover."},
];

function HelpModal({onClose, dark, T}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000,padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg,borderRadius:20,width:560,maxHeight:"82vh",display:"flex",flexDirection:"column",overflow:"hidden",border:`1px solid ${T.border}`,color:T.text,boxShadow:T.shadow}}>
        <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:T.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",color:T.primary}}>
              <Icon name="help" size={20}/>
            </div>
            <div>
              <div style={{fontFamily:"var(--font-serif)",fontSize:22,lineHeight:1,letterSpacing:".5px"}}>How to use Patch</div>
              <div style={{fontSize:11.5,color:T.text2,marginTop:2}}>A two-minute tour of the planner</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.text2,padding:6,borderRadius:8,lineHeight:0}}>
            <Icon name="close" size={18}/>
          </button>
        </div>
        <div style={{overflowY:"auto",padding:"14px 22px 22px",display:"flex",flexDirection:"column",gap:10}}>
          {HELP_ITEMS.map(s=>(
            <div key={s.h} style={{background:T.bgAlt,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.borderSoft}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,color:T.primary,fontWeight:700,fontSize:13.5}}>
                <Icon name={s.ico} size={17} color={T.primary}/>
                <span style={{color:T.text}}>{s.h}</span>
              </div>
              <div style={{fontSize:12.5,color:T.text2,lineHeight:1.7,whiteSpace:"pre-line"}}>{s.b}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── EXPORTS ──────────────────────────────────────────────────────────── */
Object.assign(window, {
  Icon, ICONS, TOOL_ICON,
  Tip, SectionLabel, Pill,
  HelpModal,
});
