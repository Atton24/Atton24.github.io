/* ═══════════════════════════════════════════════════════════════════════════
   PATCH · CORE
   Constants, unit helpers, theme, ground patterns, object/line draw,
   algorithms, sprinkler types, tool definitions, history reducer.
═══════════════════════════════════════════════════════════════════════════ */

/* ─── CONSTANTS ────────────────────────────────────────────────────────── */
const BASE_CS = 40;
const MAX_UNDO = 30;
const D_COLS = 20, D_ROWS = 15;

/* ─── THEME ────────────────────────────────────────────────────────────── */
const THEME_LIGHT = {
  bg:        "#FBF9F4",
  bgAlt:     "#F6F2E8",
  sidebar:   "#F3EEE3",
  panel:     "#FFFFFF",
  border:    "#E5DFD0",
  borderSoft:"#EFE9DC",
  text:      "#2A2E25",
  text2:     "#7A7866",
  text3:     "#A6A493",
  input:     "#FFFFFF",
  canvas:    "#E8E1CF",
  canvasInk: "#D4CBB3",
  primary:   "#5A8C3F",
  primaryDk: "#3F6029",
  primaryBg: "rgba(90,140,63,.14)",
  accent:    "#C76E3D",
  accentBg:  "rgba(199,110,61,.14)",
  success:   "#5A8C3F",
  warning:   "#C9911E",
  danger:    "#C45A4C",
  shadow:    "0 4px 24px rgba(90, 70, 30, .08)",
};
const THEME_DARK = {
  bg:        "#1A1F17",
  bgAlt:     "#222820",
  sidebar:   "#222820",
  panel:     "#2A3127",
  border:    "#3A4034",
  borderSoft:"#323832",
  text:      "#EAE6D8",
  text2:     "#9A9888",
  text3:     "#6C6A5C",
  input:     "#2F3529",
  canvas:    "#14180F",
  canvasInk: "#0F1209",
  primary:   "#86C25C",
  primaryDk: "#A8DC7E",
  primaryBg: "rgba(134,194,92,.16)",
  accent:    "#E08956",
  accentBg:  "rgba(224,137,86,.16)",
  success:   "#86C25C",
  warning:   "#E5B85A",
  danger:    "#E07A6B",
  shadow:    "0 4px 24px rgba(0,0,0,.4)",
};

/* ─── UNIT HELPERS ─────────────────────────────────────────────────────── */
function fmt(cells, cellM, metric) {
  const m = cells * cellM;
  if (metric) return m >= 10 ? `${Math.round(m)}m` : `${m.toFixed(1)}m`;
  const ft = m * 3.28084;
  return ft >= 10 ? `${Math.round(ft)}ft` : `${ft.toFixed(1)}ft`;
}
function fmtArea(cells, cellM, metric) {
  const m2 = cells * cellM * cellM;
  if (metric) return `${Math.round(m2)} m²`;
  return `${Math.round(m2 * 10.7639)} ft²`;
}

/* ─── GROUND PATTERNS ──────────────────────────────────────────────────── */
const GP = {
  grass:   (c,x,y,s)=>{ c.fillStyle="#86A85A";c.fillRect(x,y,s,s);c.strokeStyle="#6F9244";c.lineWidth=0.7;for(let i=0;i<7;i++){const px=x+4+i*(s/7);c.beginPath();c.moveTo(px,y+s*.8);c.quadraticCurveTo(px+2,y+s*.45,px+1,y+s*.2);c.stroke();} },
  dirt:    (c,x,y,s)=>{ c.fillStyle="#8B6340";c.fillRect(x,y,s,s);c.fillStyle="#7a5530";for(let i=0;i<9;i++){const px=x+(Math.sin(i*2.3+x*.05)*.4+.5)*s,py=y+(Math.cos(i*1.7+y*.05)*.4+.5)*s;c.beginPath();c.ellipse(px,py,2.5,1.2,i,0,Math.PI*2);c.fill();} },
  concrete:(c,x,y,s)=>{ c.fillStyle="#CFC9BB";c.fillRect(x,y,s,s);c.strokeStyle="#B5AE9D";c.lineWidth=0.5;c.strokeRect(x+3,y+3,s-6,s-6);c.strokeRect(x+1,y+1,s-2,s-2); },
  gravel:  (c,x,y,s)=>{ c.fillStyle="#A8A285";c.fillRect(x,y,s,s);c.fillStyle="#827C5F";for(let i=0;i<14;i++){const px=x+(Math.sin(i*1.9+x*.1)*.4+.5)*s,py=y+(Math.cos(i*2.5+y*.1)*.4+.5)*s;c.beginPath();c.ellipse(px,py,2.5,1.8,i*.7,0,Math.PI*2);c.fill();} },
  mulch:   (c,x,y,s)=>{ c.fillStyle="#6b3a1f";c.fillRect(x,y,s,s);c.strokeStyle="#824825";c.lineWidth=1.5;for(let i=0;i<6;i++){const a=(i/6)*Math.PI+Math.sin(i+x*.1)*.5,px=x+s*.5+Math.cos(a)*s*.3,py=y+s*.5+Math.sin(a)*s*.25;c.beginPath();c.moveTo(px-Math.cos(a+1)*6,py-Math.sin(a+1)*4);c.lineTo(px+Math.cos(a+1)*6,py+Math.sin(a+1)*4);c.stroke();} },
  water:   (c,x,y,s)=>{ c.fillStyle="#3a7ab8";c.fillRect(x,y,s,s);c.strokeStyle="rgba(160,220,255,.55)";c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+3,y+s*.25+i*(s/3.5));c.quadraticCurveTo(x+s*.5,y+s*.1+i*(s/3.5),x+s-3,y+s*.25+i*(s/3.5));c.stroke();} },
  sand:    (c,x,y,s)=>{ c.fillStyle="#E4C97A";c.fillRect(x,y,s,s);c.fillStyle="#CCAF60";for(let i=0;i<20;i++){const px=x+(Math.sin(i*3.1+x*.2)*.45+.5)*s,py=y+(Math.cos(i*2.7+y*.2)*.45+.5)*s;c.beginPath();c.arc(px,py,1,0,Math.PI*2);c.fill();} },
  pavers:  (c,x,y,s)=>{ c.fillStyle="#C88060";c.fillRect(x,y,s,s);c.strokeStyle="#A05030";c.lineWidth=1;[[0,0,s/2,s/2],[s/2,0,s/2,s/2],[0,s/2,s/2,s/2],[s/2,s/2,s/2,s/2]].forEach(([rx,ry,rw,rh])=>c.strokeRect(x+rx+1,y+ry+1,rw-2,rh-2)); },
  decking: (c,x,y,s)=>{ c.fillStyle="#C88E58";c.fillRect(x,y,s,s);c.strokeStyle="#A06030";c.lineWidth=1;for(let i=0;i<=4;i++){const bx=x+(i/4)*s;c.beginPath();c.moveTo(bx,y);c.lineTo(bx,y+s);c.stroke();}c.strokeStyle="#B8753A";c.lineWidth=.5;for(let j=0;j<4;j++){const bx=x+(j/4)*s+s/8;c.beginPath();c.moveTo(bx,y+3);c.lineTo(bx,y+s-3);c.stroke();} },
  turf:    (c,x,y,s)=>{ c.fillStyle="#8FCE5F";c.fillRect(x,y,s,s);c.strokeStyle="#6BA840";c.lineWidth=.5;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x,y+i*(s/4));c.lineTo(x+s,y+i*(s/4));c.stroke();}for(let j=0;j<5;j++){c.beginPath();c.moveTo(x+j*(s/4),y);c.lineTo(x+j*(s/4),y+s);c.stroke();} },
  pebbles: (c,x,y,s)=>{ c.fillStyle="#B8B2A0";c.fillRect(x,y,s,s);c.fillStyle="#928C7A";for(let i=0;i<10;i++){const px=x+(Math.sin(i*2.7+x*.1)*.4+.5)*s,py=y+(Math.cos(i*1.9+y*.1)*.4+.5)*s;c.beginPath();c.arc(px,py,s*.08,0,Math.PI*2);c.fill();} },
};
const GROUND_IDS = Object.keys(GP);
const GROUND_COLORS = {
  grass:"#86A85A", dirt:"#8B6340", concrete:"#CFC9BB", gravel:"#A8A285",
  mulch:"#6B3A1F", water:"#3A7AB8", sand:"#E4C97A", pavers:"#C88060",
  decking:"#C88E58", turf:"#8FCE5F", pebbles:"#B8B2A0",
};

/* ─── OBJECT DRAW ──────────────────────────────────────────────────────── */
function drawObj(ctx, obj, cs, sel, dark) {
  // ── HOUSE (rectangular footprint with width/depth in cells) ───────────
  if (obj.type === "house") {
    const w = (obj.width || 8) * cs;
    const h = (obj.depth || 6) * cs;
    const x = obj.x * cs, y = obj.y * cs;
    if (sel) { ctx.save(); ctx.shadowColor = dark?"#86C25C":"#5A8C3F"; ctx.shadowBlur = 14; }
    // Body
    ctx.fillStyle   = dark ? "rgba(148,163,184,.28)" : "rgba(120,130,140,.22)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = dark ? "rgba(200,210,220,.85)" : "rgba(70,80,90,.9)";
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(x, y, w, h);
    // Inset detail line
    ctx.strokeStyle = dark ? "rgba(148,163,184,.4)" : "rgba(70,80,90,.35)";
    ctx.lineWidth   = 1;
    ctx.strokeRect(x+5, y+5, w-10, h-10);
    // Label
    const fontSize = Math.max(11, Math.min(22, Math.min(w, h)/4));
    ctx.fillStyle = dark ? "rgba(230,235,240,.95)" : "rgba(50,60,70,.95)";
    ctx.font = `700 ${fontSize}px var(--font-sans, sans-serif)`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("HOUSE", x+w/2, y+h/2 - fontSize*0.35);
    // Door indicator (south face)
    const doorW = Math.min(w * 0.18, 30);
    ctx.strokeStyle = dark ? "rgba(200,210,220,.7)" : "rgba(60,70,80,.65)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + w*0.4, y + h);
    ctx.lineTo(x + w*0.4 + doorW, y + h);
    ctx.stroke();
    if (sel) ctx.restore();
    return;
  }
  const cx = obj.x*cs+cs/2, cy = obj.y*cs+cs/2, r = (obj.size||1)*cs*.44;
  if (sel) { ctx.save(); ctx.shadowColor=dark?"#86C25C":"#5A8C3F"; ctx.shadowBlur=14; }
  switch (obj.type) {
    case "tree":
      ctx.fillStyle="#264F1F"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#3A7A2F"; ctx.beginPath(); ctx.arc(cx,cy,r*.85,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#52A040"; ctx.beginPath(); ctx.arc(cx-r*.15,cy-r*.2,r*.55,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#6FBD56"; ctx.beginPath(); ctx.arc(cx+r*.18,cy+r*.18,r*.38,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#1A3A1A"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke(); break;
    case "shrub":
      ctx.fillStyle="#4A7A2A"; ctx.beginPath(); ctx.arc(cx,cy,r*.9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#5A8C3A"; ctx.beginPath(); ctx.arc(cx-r*.2,cy-r*.15,r*.65,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#6AAA4A"; ctx.beginPath(); ctx.arc(cx+r*.15,cy-r*.25,r*.45,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#3A6A1A"; ctx.lineWidth=.8; ctx.beginPath(); ctx.arc(cx,cy,r*.9,0,Math.PI*2); ctx.stroke(); break;
    case "flowerbed": {
      ctx.fillStyle="#7B3A0A"; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.75,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#5A2A05"; ctx.lineWidth=.8; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.75,0,0,Math.PI*2); ctx.stroke();
      const fc=["#ED6F8C","#F4C13B","#F08850","#B96EE0","#F4928A","#5BC6E8"];
      for(let i=0;i<7;i++){const a=(i/7)*Math.PI*2,fx=cx+Math.cos(a)*r*.6,fy=cy+Math.sin(a)*r*.5;ctx.fillStyle=fc[i%fc.length];ctx.beginPath();ctx.arc(fx,fy,r*.18,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="#FFD84A"; ctx.beginPath(); ctx.arc(cx,cy,r*.12,0,Math.PI*2); ctx.fill(); break;
    }
    case "sprinkler": {
      const rp=(obj.radius||3)*cs;
      // Custom color by sprinkler type, otherwise zone color
      const baseColor = obj.sprinklerColor || ZONE_COLORS[(obj.zone||1)-1];
      ctx.beginPath(); ctx.arc(cx,cy,rp,0,Math.PI*2);
      ctx.fillStyle = hexToRgba(baseColor, .12); ctx.fill();
      ctx.strokeStyle = hexToRgba(baseColor, .55); ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=baseColor; ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=hexToRgba(baseColor, .9); ctx.lineWidth=2;
      for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*13,cy+Math.sin(a)*13);ctx.stroke();}
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
      if(obj.zone){ctx.fillStyle=dark?"#fff":"#222";ctx.font="bold 10px var(--font-mono, monospace)";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Z"+obj.zone,cx,cy-11);}
      break;
    }
    case "watersource":
      ctx.fillStyle="#0F4470"; ctx.beginPath(); ctx.roundRect(cx-12,cy-12,24,24,6); ctx.fill();
      ctx.strokeStyle="#3A95DC"; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(cx-12,cy-12,24,24,6); ctx.stroke();
      ctx.fillStyle="#82D4FF"; ctx.font=`bold ${Math.max(11,cs*.28)}px var(--font-sans, sans-serif)`;
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("W",cx,cy+1);
      ctx.fillStyle="rgba(60,170,255,.18)"; ctx.beginPath(); ctx.arc(cx,cy,cs*.55,0,Math.PI*2); ctx.fill(); break;
    case "raised_bed":
      ctx.fillStyle="#8B4513"; ctx.strokeStyle="#5C2D0A"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(cx-r*.9,cy-r*.6,r*1.8,r*1.2,4); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#5A8C3F"; ctx.beginPath(); ctx.roundRect(cx-r*.8,cy-r*.5,r*1.6,r,3); ctx.fill(); break;
    case "gazebo":
      ctx.fillStyle="rgba(180,140,80,.5)"; ctx.strokeStyle="#8B6030"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle="#6A4820"; ctx.lineWidth=1.5;
      for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();}
      ctx.fillStyle="#8B6030"; ctx.beginPath(); ctx.arc(cx,cy,r*.15,0,Math.PI*2); ctx.fill(); break;
    case "shed": {
      const sw=r*1.8, sh=r*1.4;
      ctx.fillStyle="#8B5530"; ctx.strokeStyle="#5A3010"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.rect(cx-sw/2,cy-sh/2,sw,sh); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#6A3A10"; ctx.beginPath(); ctx.moveTo(cx-sw/2-3,cy-sh/2); ctx.lineTo(cx,cy-sh/2-r*.5); ctx.lineTo(cx+sw/2+3,cy-sh/2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#AA7040"; ctx.fillRect(cx-sw*.1,cy,sw*.2,sh*.45); break;
    }
    case "bench":
      ctx.fillStyle="#C8904A"; ctx.strokeStyle="#8A5A20"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(cx-r*.9,cy-r*.25,r*1.8,r*.5,4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(cx-r*.8,cy-r*.55,r*1.6,r*.25,3); ctx.fill(); ctx.stroke(); break;
    case "firepit":
      ctx.fillStyle="#555"; ctx.beginPath(); ctx.arc(cx,cy,r*.75,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#888"; ctx.beginPath(); ctx.arc(cx,cy,r*.6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#FF6F2C"; ctx.beginPath(); ctx.arc(cx,cy,r*.38,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#FFA94A"; ctx.beginPath(); ctx.arc(cx,cy,r*.22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#FFE48A"; ctx.beginPath(); ctx.arc(cx,cy,r*.1,0,Math.PI*2); ctx.fill(); break;
    case "pool":
      ctx.fillStyle="#0F5798"; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.65,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#5BB5F0"; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.65,0,0,Math.PI*2); ctx.stroke(); break;
    case "compost":
      ctx.fillStyle="#5A3A10"; ctx.strokeStyle="#3A2008"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(cx-r*.7,cy-r*.7,r*1.4,r*1.4,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#5A8C3F";
      for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*.38,cy+Math.sin(a)*r*.38,r*.15,0,Math.PI*2);ctx.fill();} break;
    case "light":
      ctx.fillStyle="#C0A040"; ctx.strokeStyle="#806800"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,cy,r*.5,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle="rgba(255,230,100,.22)"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#FFF4A8"; ctx.beginPath(); ctx.arc(cx,cy,r*.25,0,Math.PI*2); ctx.fill(); break;
    case "drip_emitter": {
      const rp2=(obj.radius||1.5)*cs;
      ctx.beginPath(); ctx.arc(cx,cy,rp2,0,Math.PI*2); ctx.fillStyle="rgba(90,140,63,.12)"; ctx.fill();
      ctx.strokeStyle="rgba(90,140,63,.5)"; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle="#3F6029"; ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fill(); break;
    }
    case "pump":
      ctx.fillStyle="#888"; ctx.strokeStyle="#555"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(cx-r*.6,cy-r*.5,r*1.2,r,4); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#AAA"; ctx.beginPath(); ctx.arc(cx,cy,r*.3,0,Math.PI*2); ctx.fill(); break;
    case "hose_reel":
      ctx.fillStyle="#3A7A3A"; ctx.strokeStyle="#2A5A2A"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,cy,r*.7,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#5AB05A"; ctx.beginPath(); ctx.arc(cx,cy,r*.45,0,Math.PI*2); ctx.fill(); break;
    default: break;
  }
  if (sel) ctx.restore();
}

function hexToRgba(hex, a) {
  const h = hex.replace("#","");
  const n = parseInt(h.length===3 ? h.split("").map(c=>c+c).join("") : h, 16);
  return `rgba(${(n>>16)&255}, ${(n>>8)&255}, ${n&255}, ${a})`;
}

function drawLine(ctx, line, cs, sel, dark) {
  if (line.points.length < 2) return;
  ctx.save();
  if (sel) { ctx.shadowColor=dark?"#86C25C":"#5A8C3F"; ctx.shadowBlur=10; }
  ctx.beginPath();
  ctx.moveTo(line.points[0].x*cs+cs/2, line.points[0].y*cs+cs/2);
  for (let i=1; i<line.points.length; i++) ctx.lineTo(line.points[i].x*cs+cs/2, line.points[i].y*cs+cs/2);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  switch (line.type) {
    case "irrigation": ctx.strokeStyle="#2280D8"; ctx.lineWidth=3; ctx.setLineDash([8,5]); break;
    case "drip_line":  ctx.strokeStyle="#3F8A4A"; ctx.lineWidth=2; ctx.setLineDash([4,4]); break;
    case "fence":      ctx.strokeStyle="#8B6030"; ctx.lineWidth=5; ctx.setLineDash([]); break;
    case "path":       ctx.strokeStyle="#D2B281"; ctx.lineWidth=12; ctx.setLineDash([]); break;
    case "wall":       ctx.strokeStyle="#928C7A"; ctx.lineWidth=7; ctx.setLineDash([]); break;
    case "hedge":      ctx.strokeStyle="#3A7A2A"; ctx.lineWidth=9; ctx.setLineDash([]); break;
    case "powerline":  ctx.strokeStyle="#E08856"; ctx.lineWidth=2; ctx.setLineDash([3,3]); break;
    case "measure":    ctx.strokeStyle="#C45A4C"; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); break;
    default: break;
  }
  ctx.stroke(); ctx.setLineDash([]);
  if (line.type === "measure" && line.measureLabel) {
    const p0=line.points[0], p1=line.points[line.points.length-1];
    const mx=(p0.x+p1.x)/2*cs+cs/2, my=(p0.y+p1.y)/2*cs+cs/2;
    ctx.fillStyle = dark ? "#1A1F17" : "#FBF9F4";
    ctx.strokeStyle = "#C45A4C"; ctx.lineWidth=1;
    const w = ctx.measureText(line.measureLabel).width + 16;
    ctx.beginPath(); ctx.roundRect(mx-w/2, my-22, w, 18, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle="#C45A4C"; ctx.font="bold 11px var(--font-mono, monospace)";
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(line.measureLabel, mx, my-13);
  }
  ctx.restore();
}

/* ─── ALGORITHMS ───────────────────────────────────────────────────────── */
function primMST(nodes) {
  if (nodes.length < 2) return [];
  const inT = new Set([0]), edges = [];
  while (inT.size < nodes.length) {
    let best=Infinity, a=-1, b=-1;
    for (const ai of inT) for (let bi=0; bi<nodes.length; bi++) {
      if (inT.has(bi)) continue;
      const d = Math.abs(nodes[ai].x-nodes[bi].x)+Math.abs(nodes[ai].y-nodes[bi].y);
      if (d < best) { best=d; a=ai; b=bi; }
    }
    if (b < 0) break;
    edges.push([a,b]); inT.add(b);
  }
  return edges;
}
function lPath(a, b) {
  const pts=[]; let cx=a.x; const sx=b.x>a.x?1:-1, sy=b.y>a.y?1:-1;
  while (cx !== b.x) { pts.push({x:cx,y:a.y}); cx+=sx; }
  let cy=a.y; while (cy !== b.y) { pts.push({x:b.x,y:cy}); cy+=sy; }
  pts.push({x:b.x,y:b.y}); return pts;
}
function grassComponents(ground, cols, rows) {
  const vis=new Set(), comps=[], gs=new Set(Object.entries(ground).filter(([,v])=>v==="grass").map(([k])=>k));
  for (const key of gs) {
    if (vis.has(key)) continue;
    const comp=[], q=[key];
    while (q.length) {
      const k=q.shift(); if (vis.has(k)) continue; vis.add(k); comp.push(k);
      const [cx,cy]=k.split(",").map(Number);
      [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx,dy])=>{ const nk=`${cx+dx},${cy+dy}`; if (!vis.has(nk)&&gs.has(nk)) q.push(nk); });
    }
    comps.push(comp.map(k=>{ const [x,y]=k.split(",").map(Number); return {x,y}; }));
  }
  return comps;
}

/* ─── SPRINKLER TYPES ──────────────────────────────────────────────────── */
const SPRINKLER_TYPES = [
  { id:"strip_spray",       name:"Strip Spray",         defaultRadiusFt:4,  minRadiusFt:2,  maxRadiusFt:5,  color:"#7C68F0", overlap:true,  description:"Narrow strips, borders, beds.", flow:"~0.5–1.5 GPM", glyph:"strip" },
  { id:"popup_spray",       name:"Pop-up Spray",        defaultRadiusFt:12, minRadiusFt:8,  maxRadiusFt:15, color:"#3B82F6", overlap:true,  description:"The standard residential head.",                       flow:"~1–3 GPM",   glyph:"popup" },
  { id:"rotary_nozzle",     name:"Rotary Nozzle",       defaultRadiusFt:12, minRadiusFt:8,  maxRadiusFt:15, color:"#0EA5C5", overlap:false, description:"Multi-stream rotating; uses ~30% less water.",         flow:"~0.4–1 GPM", glyph:"rotary" },
  { id:"gear_rotor_small",  name:"Gear Rotor · Small",  defaultRadiusFt:20, minRadiusFt:15, maxRadiusFt:30, color:"#5A8C3F", overlap:true,  description:"Slow rotating arc; medium lawns.",                     flow:"~1–3 GPM",   glyph:"rotor" },
  { id:"gear_rotor_large",  name:"Gear Rotor · Large",  defaultRadiusFt:35, minRadiusFt:24, maxRadiusFt:50, color:"#C76E3D", overlap:true,  description:"Big open lawns; most ground per head.",                flow:"~2–8 GPM",   glyph:"rotor" },
  { id:"impact_rotor",      name:"Impact Sprinkler",    defaultRadiusFt:30, minRadiusFt:20, maxRadiusFt:40, color:"#9A55C9", overlap:true,  description:"Above-ground impulse; robust, long-range.",            flow:"~2–6 GPM",   glyph:"impact" },
];

function perimCells(comp) {
  const gs = new Set(comp.map(c=>`${c.x},${c.y}`));
  return comp.filter(c => [[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy]) => !gs.has(`${c.x+dx},${c.y+dy}`)));
}
function cornerCells(comp) {
  const gs = new Set(comp.map(c=>`${c.x},${c.y}`));
  return comp.filter(c => {
    const outside = [[0,1],[0,-1],[1,0],[-1,0]].filter(([dx,dy]) => !gs.has(`${c.x+dx},${c.y+dy}`)).length;
    return outside >= 2;
  });
}
function scoreCell(cx, cy, radius, gs, covered) {
  let n = 0;
  for (let dy=-radius; dy<=radius; dy++)
    for (let dx=-radius; dx<=radius; dx++)
      if (dx*dx+dy*dy <= radius*radius) {
        const k = `${cx+dx},${cy+dy}`;
        if (gs.has(k) && !covered.has(k)) n++;
      }
  return n;
}
function markCovered(cx, cy, radius, covered) {
  for (let dy=-radius; dy<=radius; dy++)
    for (let dx=-radius; dx<=radius; dx++)
      if (dx*dx+dy*dy <= radius*radius)
        covered.add(`${cx+dx},${cy+dy}`);
}

function placeSprinklers(comp, radius, perimOnly, overlapFactor = 0.5) {
  if (!comp.length) return [];
  const spacing = Math.max(1, Math.round(radius * overlapFactor * 2));
  const gs = new Set(comp.map(c => `${c.x},${c.y}`));
  const covered = new Set();
  const placed = [];
  const totalGrass = comp.length;
  const minGain = Math.max(1, Math.floor(totalGrass * 0.04));

  const tooClose = (cx, cy) =>
    placed.some(p => Math.hypot(p.x-cx, p.y-cy) < spacing);

  const tryPlace = (cx, cy) => {
    if (!gs.has(`${cx},${cy}`)) return false;
    if (tooClose(cx, cy)) return false;
    const gain = scoreCell(cx, cy, radius, gs, covered);
    if (gain < minGain) return false;
    placed.push({x:cx, y:cy, radius});
    markCovered(cx, cy, radius, covered);
    return true;
  };

  const corners = cornerCells(comp)
    .map(c => ({...c, s: scoreCell(c.x, c.y, radius, gs, covered)}))
    .sort((a,b) => b.s - a.s);
  for (const c of corners) tryPlace(c.x, c.y);

  const perim = perimCells(comp);
  const cx0 = comp.reduce((s,c)=>s+c.x,0)/comp.length;
  const cy0 = comp.reduce((s,c)=>s+c.y,0)/comp.length;
  perim.sort((a,b) => Math.atan2(a.y-cy0,a.x-cx0) - Math.atan2(b.y-cy0,b.x-cx0));
  for (const c of perim) tryPlace(c.x, c.y);

  if (perimOnly) return placed;

  const xs = comp.map(c=>c.x), ys = comp.map(c=>c.y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const x1 = Math.max(...xs), y1 = Math.max(...ys);
  const rowH = Math.max(1, Math.round(spacing * 0.866));

  for (let row=0; ; row++) {
    const gy = y0 + row * rowH;
    if (gy > y1 + radius) break;
    const offset = (row % 2 === 1) ? Math.round(spacing / 2) : 0;
    for (let col=0; ; col++) {
      const gx = x0 + offset + col * spacing;
      if (gx > x1 + radius) break;
      tryPlace(Math.round(gx), Math.round(gy));
    }
  }
  return placed;
}

function computeCoverage(sprinklerPositions, radius, grassSet) {
  const covered = new Set();
  sprinklerPositions.forEach(({x, y}) => {
    for (let dy=-radius; dy<=radius; dy++)
      for (let dx=-radius; dx<=radius; dx++)
        if (dx*dx+dy*dy <= radius*radius) covered.add(`${x+dx},${y+dy}`);
  });
  const coveredGrass = [...covered].filter(k => grassSet.has(k)).length;
  return { coveredGrass, totalGrass: grassSet.size, pct: grassSet.size > 0 ? Math.round(coveredGrass/grassSet.size*100) : 0 };
}

/* ─── HISTORY REDUCER ──────────────────────────────────────────────────── */
function snap(s) { return { ground:{...s.ground}, objects:[...s.objects], lines:[...s.lines] }; }
function histReducer(s, a) {
  switch (a.type) {
    case "PUSH": return {...s, ...a.p, past:[...s.past, snap(s)].slice(-MAX_UNDO), future:[]};
    case "UNDO": if (!s.past.length) return s; { const prev=s.past[s.past.length-1]; return {...s,...prev,past:s.past.slice(0,-1),future:[snap(s),...s.future].slice(0,MAX_UNDO)}; }
    case "REDO": if (!s.future.length) return s; { const next=s.future[0]; return {...s,...next,past:[...s.past,snap(s)].slice(-MAX_UNDO),future:s.future.slice(1)}; }
    case "RESET": return {ground:{},objects:[],lines:[],past:[],future:[]};
    case "LOAD":  return {...s, ...a.p, past:[], future:[]};
    default: return s;
  }
}

/* ─── TOOL DEFINITIONS ─────────────────────────────────────────────────── */
const GT = [
  {id:"grass",   label:"Lawn Grass",  tip:"Living grass — needs irrigation. Paint or rectangle-fill.", swatch:"#86A85A"},
  {id:"turf",    label:"Artif. Turf", tip:"Synthetic turf — no watering needed.",                       swatch:"#8FCE5F"},
  {id:"dirt",    label:"Bare Soil",   tip:"Bare soil — good under planting beds.",                     swatch:"#8B6340"},
  {id:"mulch",   label:"Mulch",       tip:"Organic mulch around trees and beds.",                      swatch:"#6B3A1F"},
  {id:"concrete",label:"Concrete",    tip:"Concrete slab — driveways, patios.",                        swatch:"#CFC9BB"},
  {id:"pavers",  label:"Pavers",      tip:"Paving stones or brick pavers.",                            swatch:"#C88060"},
  {id:"decking", label:"Decking",     tip:"Timber decking boards.",                                    swatch:"#C88E58"},
  {id:"gravel",  label:"Gravel",      tip:"Loose gravel or crushed stone.",                            swatch:"#A8A285"},
  {id:"pebbles", label:"Pebbles",     tip:"Decorative pebbles or river stones.",                       swatch:"#B8B2A0"},
  {id:"sand",    label:"Sand",        tip:"Sand — play areas, beach-style edging.",                    swatch:"#E4C97A"},
  {id:"water",   label:"Pond",        tip:"Water feature or pond area.",                               swatch:"#3A7AB8"},
];

const OT = [
  {id:"house",       label:"House",        tip:"Place a house outline. Resize via the properties panel."},
  {id:"tree",        label:"Tree",         tip:"Shade or ornamental tree."},
  {id:"shrub",       label:"Shrub",        tip:"Ornamental shrub or bush."},
  {id:"flowerbed",   label:"Flower Bed",   tip:"Annual or perennial flower bed."},
  {id:"raised_bed",  label:"Raised Bed",   tip:"Raised vegetable or herb garden bed."},
  {id:"sprinkler",   label:"Sprinkler",    tip:"Pop-up sprinkler head. Dashed ring shows spray radius."},
  {id:"drip_emitter",label:"Drip Emitter", tip:"Low-flow drip emitter — precise watering."},
  {id:"watersource", label:"Water Source", tip:"Water tap. One per garden — Auto Irrigate links back here."},
  {id:"hose_reel",   label:"Hose Reel",    tip:"Garden hose reel location."},
  {id:"pump",        label:"Pump",         tip:"Booster pump (pool, tank, or pressure)."},
  {id:"light",       label:"Garden Light", tip:"Pathway or feature lighting."},
  {id:"bench",       label:"Bench",        tip:"Garden bench or seat."},
  {id:"firepit",     label:"Fire Pit",     tip:"Fire pit with stone surround."},
  {id:"gazebo",      label:"Gazebo",       tip:"Gazebo, pergola or shade sail."},
  {id:"shed",        label:"Shed",         tip:"Garden tool shed."},
  {id:"pool",        label:"Pool",         tip:"Swimming pool."},
  {id:"compost",     label:"Compost",      tip:"Compost bin."},
];
const LT = [
  {id:"irrigation", label:"Irrigation Pipe", tip:"Main supply pipe. Connects sprinklers to the water source."},
  {id:"drip_line",  label:"Drip Line",       tip:"Drip hose for emitters and raised beds."},
  {id:"fence",      label:"Fence",           tip:"Garden fence or boundary."},
  {id:"path",       label:"Path",            tip:"Walking path or stepping stone trail."},
  {id:"wall",       label:"Wall",            tip:"Retaining or boundary wall."},
  {id:"hedge",      label:"Hedge Row",       tip:"Living hedge — closely planted shrubs."},
  {id:"powerline",  label:"Power Cable",     tip:"Underground electrical cable route."},
  {id:"measure",    label:"Measure",         tip:"Draw a distance measurement. Label shows real-world length."},
];
const UT = [
  {id:"select", label:"Select", tip:"Click objects or lines to select. Delete key removes."},
  {id:"pan",    label:"Pan",    tip:"Click and drag to move the view around. Useful when zoomed in."},
  {id:"paint",  label:"Paint",  tip:"Freehand-paint ground type."},
  {id:"rect",   label:"Rect Fill", tip:"Drag a rectangle to fill an area."},
  {id:"erase",  label:"Erase",  tip:"Erase ground, objects, lines."},
];
const ALL_TOOLS = [...UT, ...GT, ...OT, ...LT];
const TOOL_MAP = Object.fromEntries(ALL_TOOLS.map(t=>[t.id,t]));

const ZONE_COLORS = ["#5A8C3F", "#C76E3D", "#3B82F6"];
const ZONE_NAMES = ["Sage", "Terra", "Sky"];

/* ─── YARD PRESETS ─────────────────────────────────────────────────────── */
const YARD_PRESETS = [
  { id:"small",  name:"Small Yard",  subtitle:"5 × 5 m · ~270 ft²",         cols:10, rows:10, cellM:0.5, hint:"Townhouse · courtyard" },
  { id:"medium", name:"Medium Yard", subtitle:"10 × 7.5 m · ~800 ft²",      cols:20, rows:15, cellM:0.5, hint:"Typical suburban" },
  { id:"large",  name:"Large Yard",  subtitle:"20 × 15 m · ~3,200 ft²",     cols:20, rows:15, cellM:1.0, hint:"Generous suburban" },
  { id:"acreage",name:"Acreage",     subtitle:"40 × 30 m · ~13,000 ft²",    cols:20, rows:15, cellM:2.0, hint:"Rural · estate" },
];

/* ─── STARTER YARD ─────────────────────────────────────────────────────── */
// A pleasing pre-filled yard: house at top, patio, lawn area, a couple trees, water source.
function makeStarterYard(cols, rows) {
  const ground = {};
  // Concrete patio behind house (top strip)
  for (let r=0; r<2; r++) for (let c=0; c<cols; c++) ground[`${c},${r}`] = "concrete";
  // Decking patio center-left
  for (let r=2; r<4; r++) for (let c=2; c<8; c++) ground[`${c},${r}`] = "decking";
  // Big lawn block
  for (let r=4; r<rows-1; r++) for (let c=1; c<cols-1; c++) ground[`${c},${r}`] = "grass";
  // Mulch strip along right edge
  for (let r=4; r<rows-1; r++) ground[`${cols-1},${r}`] = "mulch";
  // Mulch border along bottom
  for (let c=1; c<cols-1; c++) ground[`${c},${rows-1}`] = "mulch";
  // Flower bed mulch patches
  ground[`${cols-2},5`] = "mulch";
  ground[`${cols-2},6`] = "mulch";
  ground[`${cols-3},5`] = "mulch";
  // Gravel path leading from patio down the side
  for (let r=4; r<8; r++) ground[`9,${r}`] = "gravel";

  const objects = [
    {x:0, y:0, type:"watersource", size:1},
    {x:3, y:6, type:"tree", size:2},
    {x:14, y:9, type:"tree", size:2},
    {x:cols-2, y:5, type:"flowerbed", size:1},
    {x:cols-3, y:5, type:"flowerbed", size:1},
    {x:5, y:3, type:"bench", size:1},
    {x:11, y:3, type:"firepit", size:1},
    {x:cols-2, y:rows-2, type:"shed", size:2},
  ];

  return { ground, objects, lines: [] };
}

/* ─── DESIGN RESCALE ───────────────────────────────────────────────────── */
// When cellM changes, remap ground/objects/lines so they stay at the same
// real-world position. Returns the rescaled design state.
function rescaleDesign({ground, objects, lines}, oldCellM, newCellM) {
  const ratio = oldCellM / newCellM; // new_cells = old_cells * ratio
  if (Math.abs(ratio - 1) < 0.001) return {ground, objects, lines};
  const newGround = {};
  Object.entries(ground).forEach(([key, type]) => {
    const [c, r] = key.split(',').map(Number);
    if (ratio >= 1) {
      // Cells get bigger in new grid: each old cell fills a block
      const x0 = Math.floor(c * ratio);
      const x1 = Math.max(x0+1, Math.floor((c+1) * ratio));
      const y0 = Math.floor(r * ratio);
      const y1 = Math.max(y0+1, Math.floor((r+1) * ratio));
      for (let yy = y0; yy < y1; yy++)
        for (let xx = x0; xx < x1; xx++)
          newGround[`${xx},${yy}`] = type;
    } else {
      // Cells shrink: round to nearest new cell
      const nc = Math.round(c * ratio);
      const nr = Math.round(r * ratio);
      newGround[`${nc},${nr}`] = type;
    }
  });
  const remap = (x, y) => ({ x: Math.round(x * ratio), y: Math.round(y * ratio) });
  const newObjects = objects.map(o => ({
    ...o,
    ...remap(o.x, o.y),
    ...(o.radius !== undefined ? { radius: Math.max(1, Math.round(o.radius * ratio)) } : {}),
  }));
  const newLines = lines.map(l => ({
    ...l,
    points: l.points.map(p => remap(p.x, p.y)),
  }));
  return { ground: newGround, objects: newObjects, lines: newLines };
}

/* ─── LOT POLYGON → FENCE LINE ─────────────────────────────────────────── */
// Builds a Patch line in cell coords for a fence around the lot edges.
// `sides` is an array of side names from {front, rear, left, right}.
function lotFenceLines(lotPlan, cellM, sides = ["rear", "left", "right"], gates = [], insetCells = 0) {
  if (!lotPlan?.lotWidthFt || !lotPlan?.lotDepthFt) return [];
  const ftPerCell = cellM * 3.28084;
  // Coordinate system:
  //   Lot polygon (in ft) is rendered with a 1-cell visual padding around it.
  //   Lines are drawn at "cell center" (x*cs + cs/2), so to land at the lot's
  //   real-world edge we offset by (1 - 0.5) = 0.5 cells.
  const PAD = 1;
  const ox = PAD - 0.5;
  const oy = PAD - 0.5;
  const W  = lotPlan.lotWidthFt / ftPerCell;
  const D  = lotPlan.lotDepthFt / ftPerCell;
  const inset = Math.max(0, insetCells); // float, no rounding
  const xL = ox + inset;
  const xR = ox + W - inset;
  const yT = oy + inset;
  const yB = oy + D - inset;
  const lines = [];
  // Gate: ~4 ft wide opening — keep as floats so the gap matches the real spec.
  const gateGapCells = 4 / ftPerCell;
  const makeSide = (side, a, b) => {
    if (!gates.includes(side)) {
      lines.push({type:"fence", points:[a, b], auto:true, source:"plot", side});
      return;
    }
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const halfGap = Math.min(gateGapCells / 2, len / 3);
    if (halfGap < 0.5) {
      lines.push({type:"fence", points:[a, b], auto:true, source:"plot", side});
      return;
    }
    const ux = dx / len, uy = dy / len;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const g1 = { x: mid.x - ux * halfGap, y: mid.y - uy * halfGap };
    const g2 = { x: mid.x + ux * halfGap, y: mid.y + uy * halfGap };
    lines.push({type:"fence", points:[a, g1], auto:true, source:"plot", side});
    lines.push({type:"fence", points:[g2, b], auto:true, source:"plot", side});
    lines.push({type:"measure", points:[g1, g2], auto:true, source:"plot", side, measureLabel:"gate"});
  };
  const tl = {x: xL, y: yT};
  const tr = {x: xR, y: yT};
  const bl = {x: xL, y: yB};
  const br = {x: xR, y: yB};
  if (sides.includes("rear"))  makeSide("rear",  tl, tr);
  if (sides.includes("left"))  makeSide("left",  tl, bl);
  if (sides.includes("right")) makeSide("right", tr, br);
  if (sides.includes("front")) makeSide("front", bl, br);
  return lines;
}

/* ─── EXPORTS ──────────────────────────────────────────────────────────── */
Object.assign(window, {
  BASE_CS, MAX_UNDO, D_COLS, D_ROWS,
  THEME_LIGHT, THEME_DARK,
  fmt, fmtArea, hexToRgba,
  GP, GROUND_IDS, GROUND_COLORS,
  drawObj, drawLine,
  primMST, lPath, grassComponents,
  SPRINKLER_TYPES,
  perimCells, cornerCells, scoreCell, markCovered,
  placeSprinklers, computeCoverage,
  histReducer, snap,
  GT, OT, LT, UT, ALL_TOOLS, TOOL_MAP,
  ZONE_COLORS, ZONE_NAMES,
  YARD_PRESETS, makeStarterYard,
  rescaleDesign, lotFenceLines,
});
