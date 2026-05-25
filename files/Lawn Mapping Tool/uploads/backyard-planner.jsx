import { useState, useRef, useEffect, useCallback, useReducer } from "react";

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const BASE_CS = 40;
const MAX_UNDO = 30;
const D_COLS = 20, D_ROWS = 15;

/* ─── UNIT HELPERS ───────────────────────────────────────────────────────── */
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

/* ─── GROUND PATTERNS ────────────────────────────────────────────────────── */
const GP = {
  grass:   (c,x,y,s)=>{ c.fillStyle="#4a9e4a";c.fillRect(x,y,s,s);c.strokeStyle="#3a8a3a";c.lineWidth=0.7;for(let i=0;i<7;i++){const px=x+4+i*(s/7);c.beginPath();c.moveTo(px,y+s*.8);c.quadraticCurveTo(px+2,y+s*.45,px+1,y+s*.2);c.stroke();} },
  dirt:    (c,x,y,s)=>{ c.fillStyle="#8B6340";c.fillRect(x,y,s,s);c.fillStyle="#7a5530";for(let i=0;i<9;i++){const px=x+(Math.sin(i*2.3+x*.05)*.4+.5)*s,py=y+(Math.cos(i*1.7+y*.05)*.4+.5)*s;c.beginPath();c.ellipse(px,py,2.5,1.2,i,0,Math.PI*2);c.fill();} },
  concrete:(c,x,y,s)=>{ c.fillStyle="#c0c0c0";c.fillRect(x,y,s,s);c.strokeStyle="#a0a0a0";c.lineWidth=0.5;c.strokeRect(x+3,y+3,s-6,s-6);c.strokeRect(x+1,y+1,s-2,s-2); },
  gravel:  (c,x,y,s)=>{ c.fillStyle="#9e9e80";c.fillRect(x,y,s,s);c.fillStyle="#7a7a60";for(let i=0;i<14;i++){const px=x+(Math.sin(i*1.9+x*.1)*.4+.5)*s,py=y+(Math.cos(i*2.5+y*.1)*.4+.5)*s;c.beginPath();c.ellipse(px,py,2.5,1.8,i*.7,0,Math.PI*2);c.fill();} },
  mulch:   (c,x,y,s)=>{ c.fillStyle="#6b3a1f";c.fillRect(x,y,s,s);c.strokeStyle="#824825";c.lineWidth=1.5;for(let i=0;i<6;i++){const a=(i/6)*Math.PI+Math.sin(i+x*.1)*.5,px=x+s*.5+Math.cos(a)*s*.3,py=y+s*.5+Math.sin(a)*s*.25;c.beginPath();c.moveTo(px-Math.cos(a+1)*6,py-Math.sin(a+1)*4);c.lineTo(px+Math.cos(a+1)*6,py+Math.sin(a+1)*4);c.stroke();} },
  water:   (c,x,y,s)=>{ c.fillStyle="#2a6aaf";c.fillRect(x,y,s,s);c.strokeStyle="rgba(120,200,255,.6)";c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+3,y+s*.25+i*(s/3.5));c.quadraticCurveTo(x+s*.5,y+s*.1+i*(s/3.5),x+s-3,y+s*.25+i*(s/3.5));c.stroke();} },
  sand:    (c,x,y,s)=>{ c.fillStyle="#d4b96e";c.fillRect(x,y,s,s);c.fillStyle="#c4a85e";for(let i=0;i<20;i++){const px=x+(Math.sin(i*3.1+x*.2)*.45+.5)*s,py=y+(Math.cos(i*2.7+y*.2)*.45+.5)*s;c.beginPath();c.arc(px,py,1,0,Math.PI*2);c.fill();} },
  pavers:  (c,x,y,s)=>{ c.fillStyle="#d08060";c.fillRect(x,y,s,s);c.strokeStyle="#a05030";c.lineWidth=1;[[0,0,s/2,s/2],[s/2,0,s/2,s/2],[0,s/2,s/2,s/2],[s/2,s/2,s/2,s/2]].forEach(([rx,ry,rw,rh])=>c.strokeRect(x+rx+1,y+ry+1,rw-2,rh-2)); },
  decking: (c,x,y,s)=>{ c.fillStyle="#c8864a";c.fillRect(x,y,s,s);c.strokeStyle="#a06030";c.lineWidth=1;for(let i=0;i<=4;i++){const bx=x+(i/4)*s;c.beginPath();c.moveTo(bx,y);c.lineTo(bx,y+s);c.stroke();}c.strokeStyle="#b8753a";c.lineWidth=.5;for(let j=0;j<4;j++){const bx=x+(j/4)*s+s/8;c.beginPath();c.moveTo(bx,y+3);c.lineTo(bx,y+s-3);c.stroke();} },
  turf:    (c,x,y,s)=>{ c.fillStyle="#7ac45a";c.fillRect(x,y,s,s);c.strokeStyle="#5a9a3a";c.lineWidth=.5;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x,y+i*(s/4));c.lineTo(x+s,y+i*(s/4));c.stroke();}for(let j=0;j<5;j++){c.beginPath();c.moveTo(x+j*(s/4),y);c.lineTo(x+j*(s/4),y+s);c.stroke();} },
  pebbles: (c,x,y,s)=>{ c.fillStyle="#b0b0a0";c.fillRect(x,y,s,s);c.fillStyle="#909088";for(let i=0;i<10;i++){const px=x+(Math.sin(i*2.7+x*.1)*.4+.5)*s,py=y+(Math.cos(i*1.9+y*.1)*.4+.5)*s;c.beginPath();c.arc(px,py,s*.08,0,Math.PI*2);c.fill();} },
};
const GROUND_IDS = Object.keys(GP);

/* ─── OBJECT DRAW ────────────────────────────────────────────────────────── */
function drawObj(ctx, obj, cs, sel, dark) {
  const cx = obj.x*cs+cs/2, cy = obj.y*cs+cs/2, r = (obj.size||1)*cs*.44;
  if (sel) { ctx.save(); ctx.shadowColor="#3b82f6"; ctx.shadowBlur=14; }
  switch (obj.type) {
    case "tree":
      ctx.fillStyle="#1e4e1e"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#2d7a2d"; ctx.beginPath(); ctx.arc(cx,cy,r*.85,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#3a9a3a"; ctx.beginPath(); ctx.arc(cx-r*.15,cy-r*.2,r*.55,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#4ab04a"; ctx.beginPath(); ctx.arc(cx+r*.18,cy+r*.18,r*.38,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#1a3a1a"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke(); break;
    case "shrub":
      ctx.fillStyle="#4a7a2a"; ctx.beginPath(); ctx.arc(cx,cy,r*.9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#5a8c3a"; ctx.beginPath(); ctx.arc(cx-r*.2,cy-r*.15,r*.65,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#6aaa4a"; ctx.beginPath(); ctx.arc(cx+r*.15,cy-r*.25,r*.45,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#3a6a1a"; ctx.lineWidth=.8; ctx.beginPath(); ctx.arc(cx,cy,r*.9,0,Math.PI*2); ctx.stroke(); break;
    case "flowerbed": {
      ctx.fillStyle="#7B3A0A"; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.75,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#5a2a05"; ctx.lineWidth=.8; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.75,0,0,Math.PI*2); ctx.stroke();
      const fc=["#ff5577","#ffcc00","#ff8844","#cc44ff","#ff9988","#44ddff"];
      for(let i=0;i<7;i++){const a=(i/7)*Math.PI*2,fx=cx+Math.cos(a)*r*.6,fy=cy+Math.sin(a)*r*.5;ctx.fillStyle=fc[i%fc.length];ctx.beginPath();ctx.arc(fx,fy,r*.18,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="#ffff44"; ctx.beginPath(); ctx.arc(cx,cy,r*.12,0,Math.PI*2); ctx.fill(); break;
    }
    case "sprinkler": {
      const rp=(obj.radius||3)*cs;
      const zc=["rgba(80,160,255,.13)","rgba(80,220,120,.13)","rgba(255,160,80,.13)"][(obj.zone||1)-1];
      const zs=["rgba(80,160,255,.55)","rgba(80,220,120,.55)","rgba(255,160,80,.55)"][(obj.zone||1)-1];
      ctx.beginPath(); ctx.arc(cx,cy,rp,0,Math.PI*2); ctx.fillStyle=zc; ctx.fill();
      ctx.strokeStyle=zs; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle="#1060af"; ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#60c0ff"; ctx.lineWidth=2;
      for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*13,cy+Math.sin(a)*13);ctx.stroke();}
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
      if(obj.zone){ctx.fillStyle=dark?"#fff":"#222";ctx.font="bold 9px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Z"+obj.zone,cx,cy-11);}
      break;
    }
    case "watersource":
      ctx.fillStyle="#0a4a8a"; ctx.beginPath(); ctx.roundRect(cx-10,cy-10,20,20,4); ctx.fill();
      ctx.strokeStyle="#2288dd"; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(cx-10,cy-10,20,20,4); ctx.stroke();
      ctx.fillStyle="#60d0ff"; ctx.font=`bold ${Math.max(11,cs*.28)}px sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("W",cx,cy+1);
      ctx.fillStyle="rgba(0,150,255,.15)"; ctx.beginPath(); ctx.arc(cx,cy,cs*.48,0,Math.PI*2); ctx.fill(); break;
    case "raised_bed":
      ctx.fillStyle="#8B4513"; ctx.strokeStyle="#5c2d0a"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(cx-r*.9,cy-r*.6,r*1.8,r*1.2,4); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#4a9e4a"; ctx.beginPath(); ctx.roundRect(cx-r*.8,cy-r*.5,r*1.6,r,3); ctx.fill(); break;
    case "gazebo":
      ctx.fillStyle="rgba(180,140,80,.5)"; ctx.strokeStyle="#8B6030"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle="#6a4820"; ctx.lineWidth=1.5;
      for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();}
      ctx.fillStyle="#8B6030"; ctx.beginPath(); ctx.arc(cx,cy,r*.15,0,Math.PI*2); ctx.fill(); break;
    case "shed": {
      const sw=r*1.8, sh=r*1.4;
      ctx.fillStyle="#8B5530"; ctx.strokeStyle="#5a3010"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.rect(cx-sw/2,cy-sh/2,sw,sh); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#6a3a10"; ctx.beginPath(); ctx.moveTo(cx-sw/2-3,cy-sh/2); ctx.lineTo(cx,cy-sh/2-r*.5); ctx.lineTo(cx+sw/2+3,cy-sh/2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#aa7040"; ctx.fillRect(cx-sw*.1,cy,sw*.2,sh*.45); break;
    }
    case "bench":
      ctx.fillStyle="#c8904a"; ctx.strokeStyle="#8a5a20"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(cx-r*.9,cy-r*.25,r*1.8,r*.5,4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(cx-r*.8,cy-r*.55,r*1.6,r*.25,3); ctx.fill(); ctx.stroke(); break;
    case "firepit":
      ctx.fillStyle="#555"; ctx.beginPath(); ctx.arc(cx,cy,r*.75,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#888"; ctx.beginPath(); ctx.arc(cx,cy,r*.6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ff6600"; ctx.beginPath(); ctx.arc(cx,cy,r*.38,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffaa00"; ctx.beginPath(); ctx.arc(cx,cy,r*.22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffff88"; ctx.beginPath(); ctx.arc(cx,cy,r*.1,0,Math.PI*2); ctx.fill(); break;
    case "pool":
      ctx.fillStyle="#0a5a9a"; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.65,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#4aafff"; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.65,0,0,Math.PI*2); ctx.stroke(); break;
    case "compost":
      ctx.fillStyle="#5a3a10"; ctx.strokeStyle="#3a2008"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(cx-r*.7,cy-r*.7,r*1.4,r*1.4,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#4a8a2a";
      for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*.38,cy+Math.sin(a)*r*.38,r*.15,0,Math.PI*2);ctx.fill();} break;
    case "light":
      ctx.fillStyle="#c0a040"; ctx.strokeStyle="#806800"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,cy,r*.5,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle="rgba(255,230,100,.22)"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff8aa"; ctx.beginPath(); ctx.arc(cx,cy,r*.25,0,Math.PI*2); ctx.fill(); break;
    case "drip_emitter": {
      const rp2=(obj.radius||1.5)*cs;
      ctx.beginPath(); ctx.arc(cx,cy,rp2,0,Math.PI*2); ctx.fillStyle="rgba(30,180,80,.1)"; ctx.fill();
      ctx.strokeStyle="rgba(30,180,80,.45)"; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle="#1a8a3a"; ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fill(); break;
    }
    case "pump":
      ctx.fillStyle="#888"; ctx.strokeStyle="#555"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(cx-r*.6,cy-r*.5,r*1.2,r,4); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#aaa"; ctx.beginPath(); ctx.arc(cx,cy,r*.3,0,Math.PI*2); ctx.fill(); break;
    case "hose_reel":
      ctx.fillStyle="#3a7a3a"; ctx.strokeStyle="#2a5a2a"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,cy,r*.7,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#5ab05a"; ctx.beginPath(); ctx.arc(cx,cy,r*.45,0,Math.PI*2); ctx.fill(); break;
    default: break;
  }
  if (sel) ctx.restore();
}

function drawLine(ctx, line, cs, sel) {
  if (line.points.length < 2) return;
  ctx.save();
  if (sel) { ctx.shadowColor="#3b82f6"; ctx.shadowBlur=10; }
  ctx.beginPath();
  ctx.moveTo(line.points[0].x*cs+cs/2, line.points[0].y*cs+cs/2);
  for (let i=1; i<line.points.length; i++) ctx.lineTo(line.points[i].x*cs+cs/2, line.points[i].y*cs+cs/2);
  switch (line.type) {
    case "irrigation": ctx.strokeStyle="#1a7ad4"; ctx.lineWidth=3; ctx.setLineDash([8,5]); break;
    case "drip_line":  ctx.strokeStyle="#1aaa5a"; ctx.lineWidth=2; ctx.setLineDash([4,4]); break;
    case "fence":      ctx.strokeStyle="#8B6030"; ctx.lineWidth=5; ctx.setLineDash([]); break;
    case "path":       ctx.strokeStyle="#c8aa70"; ctx.lineWidth=11; ctx.setLineDash([]); break;
    case "wall":       ctx.strokeStyle="#888080"; ctx.lineWidth=7; ctx.setLineDash([]); break;
    case "hedge":      ctx.strokeStyle="#2a7a2a"; ctx.lineWidth=9; ctx.setLineDash([]); break;
    case "powerline":  ctx.strokeStyle="#e08800"; ctx.lineWidth=2; ctx.setLineDash([3,3]); break;
    case "measure":    ctx.strokeStyle="#e03030"; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); break;
    default: break;
  }
  ctx.stroke(); ctx.setLineDash([]);
  if (line.type === "measure" && line.measureLabel) {
    const p0=line.points[0], p1=line.points[line.points.length-1];
    const mx=(p0.x+p1.x)/2*cs+cs/2, my=(p0.y+p1.y)/2*cs+cs/2;
    ctx.fillStyle="#e03030"; ctx.font="bold 11px sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="bottom"; ctx.fillText(line.measureLabel, mx, my-2);
  }
  ctx.restore();
}

/* ─── ALGORITHMS ─────────────────────────────────────────────────────────── */
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
/* ─── SPRINKLER TYPE DEFINITIONS ─────────────────────────────────────────── */
// Radii are in feet (real-world); converted to cells in the UI.
// Based on common garden sprinkler categories available at hardware stores.
const SPRINKLER_TYPES = [
  {
    id: "strip_spray",
    name: "Strip Spray Head",
    icon: "💧",
    defaultRadiusFt: 4,
    minRadiusFt: 2, maxRadiusFt: 5,
    color: "#6366f1",
    overlap: true,
    description: "Fixed spray head for narrow strips, borders, and beds. Short radius, precise coverage. Typical spray: 2–5 ft.",
    flow: "Low · ~0.5–1.5 GPM",
  },
  {
    id: "popup_spray",
    name: "Pop-up Spray Head",
    icon: "💦",
    defaultRadiusFt: 12,
    minRadiusFt: 8, maxRadiusFt: 15,
    color: "#3b82f6",
    overlap: true,
    description: "Standard adjustable pop-up spray. The most common head for residential lawns. Typical spray: 8–15 ft.",
    flow: "Medium · ~1–3 GPM",
  },
  {
    id: "rotary_nozzle",
    name: "Rotary Stream Nozzle",
    icon: "🌀",
    defaultRadiusFt: 12,
    minRadiusFt: 8, maxRadiusFt: 15,
    color: "#0ea5e9",
    overlap: false,
    description: "Multi-stream rotating nozzle on a pop-up body. Low precipitation rate reduces runoff. Same range as spray heads but uses ~30% less water.",
    flow: "Low · ~0.4–1 GPM",
  },
  {
    id: "gear_rotor_small",
    name: "Gear-Drive Rotor (Small)",
    icon: "⚙",
    defaultRadiusFt: 20,
    minRadiusFt: 15, maxRadiusFt: 30,
    color: "#22c55e",
    overlap: true,
    description: "Small gear-drive rotor for medium lawns. Slow rotating arc covers large areas efficiently. Typical throw: 15–30 ft.",
    flow: "Medium · ~1–3 GPM",
  },
  {
    id: "gear_rotor_large",
    name: "Gear-Drive Rotor (Large)",
    icon: "🌊",
    defaultRadiusFt: 35,
    minRadiusFt: 24, maxRadiusFt: 50,
    color: "#f97316",
    overlap: true,
    description: "Large gear-drive rotor for big open lawns. Covers the most ground per head. Typical throw: 24–50 ft.",
    flow: "High · ~2–8 GPM",
  },
  {
    id: "impact_rotor",
    name: "Impact Sprinkler",
    icon: "💥",
    defaultRadiusFt: 30,
    minRadiusFt: 20, maxRadiusFt: 40,
    color: "#a855f7",
    overlap: true,
    description: "Classic above-ground impact/impulse sprinkler. Robust and long-range. Best for large open areas. Typical throw: 20–40 ft.",
    flow: "High · ~2–6 GPM",
  },
];

function perimCells(comp) {
  const gs = new Set(comp.map(c=>`${c.x},${c.y}`));
  return comp.filter(c => [[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy]) => !gs.has(`${c.x+dx},${c.y+dy}`)));
}

// Find corners of a grass component: perimeter cells with the most "outside" neighbours
function cornerCells(comp) {
  const gs = new Set(comp.map(c=>`${c.x},${c.y}`));
  return comp.filter(c => {
    const outside = [[0,1],[0,-1],[1,0],[-1,0]].filter(([dx,dy]) => !gs.has(`${c.x+dx},${c.y+dy}`)).length;
    return outside >= 2; // at least two exposed sides = corner-like cell
  });
}

// Count uncovered grass cells within radius of (cx, cy)
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

// Mark cells covered by a sprinkler at (cx, cy)
function markCovered(cx, cy, radius, covered) {
  for (let dy=-radius; dy<=radius; dy++)
    for (let dx=-radius; dx<=radius; dx++)
      if (dx*dx+dy*dy <= radius*radius)
        covered.add(`${cx+dx},${cy+dy}`);
}

/**
 * Professional sprinkler placement using best-practice rules:
 *
 * 1. Head-to-head spacing: distance between heads ≤ radius (not diameter).
 *    This means minSpacing = radius for standard overlap, radius*1.73 for triangular.
 *    We use radius as the minimum allowed distance between any two heads.
 *
 * 2. Corners first: place at corner cells before anywhere else.
 *
 * 3. Perimeter before interior: walk the perimeter placing evenly spaced heads,
 *    then fill the interior with a triangular grid pattern.
 *
 * 4. Efficiency gate: only place a new head if it covers at least
 *    minCoverageGain % of uncovered grass. This prevents placing heads
 *    for marginal gains (1 extra cell of coverage).
 */
function placeSprinklers(comp, radius, perimOnly, overlapFactor = 0.5) {
  if (!comp.length) return [];

  // Head-to-head principle: spacing between heads should equal the radius.
  // overlapFactor=0.5 → standard 100% diameter head-to-head overlap
  // overlapFactor=0.9 → near-edge (no overlap) for precision nozzles
  const spacing = Math.max(1, Math.round(radius * overlapFactor * 2));

  const gs = new Set(comp.map(c => `${c.x},${c.y}`));
  const covered = new Set();
  const placed = [];
  const totalGrass = comp.length;

  // Minimum new cells a head must cover to be worth placing.
  // ~5% of total grass, but at least 1 cell. Prevents marginal placements.
  const minGain = Math.max(1, Math.floor(totalGrass * 0.04));

  const tooClose = (cx, cy) =>
    placed.some(p => {
      const dx = p.x-cx, dy = p.y-cy;
      return Math.sqrt(dx*dx+dy*dy) < spacing;
    });

  const tryPlace = (cx, cy) => {
    if (!gs.has(`${cx},${cy}`)) return false;
    if (tooClose(cx, cy)) return false;
    const gain = scoreCell(cx, cy, radius, gs, covered);
    if (gain < minGain) return false;
    placed.push({x:cx, y:cy, radius});
    markCovered(cx, cy, radius, covered);
    return true;
  };

  // ── PHASE 1: CORNERS ──────────────────────────────────────────────────────
  // Place a head at each corner-like cell (cells with 2+ exposed sides).
  // Sort by score descending to pick best corner first.
  const corners = cornerCells(comp)
    .map(c => ({...c, s: scoreCell(c.x, c.y, radius, gs, covered)}))
    .sort((a,b) => b.s - a.s);

  for (const c of corners) tryPlace(c.x, c.y);

  // ── PHASE 2: PERIMETER ───────────────────────────────────────────────────
  // Walk the perimeter cells and place heads spaced `spacing` apart.
  const perim = perimCells(comp);
  // Sort perimeter by angle from centroid for consistent walk order
  const cx0 = comp.reduce((s,c)=>s+c.x,0)/comp.length;
  const cy0 = comp.reduce((s,c)=>s+c.y,0)/comp.length;
  perim.sort((a,b) => Math.atan2(a.y-cy0,a.x-cx0) - Math.atan2(b.y-cy0,b.x-cx0));
  for (const c of perim) tryPlace(c.x, c.y);

  if (perimOnly) return placed;

  // ── PHASE 3: INTERIOR — triangular grid ───────────────────────────────────
  // Row-staggered triangular grid: even rows at col=0,spacing,2*spacing...
  // odd rows offset by spacing/2 and shifted vertically by spacing*0.866
  const xs = comp.map(c=>c.x), ys = comp.map(c=>c.y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const x1 = Math.max(...xs), y1 = Math.max(...ys);
  const rowH = Math.max(1, Math.round(spacing * 0.866)); // triangle row height

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

// Compute live coverage stats for a given set of sprinkler positions + radius over a grass set
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

/* ─── UNDO REDUCER ───────────────────────────────────────────────────────── */
function snap(s) { return { ground:{...s.ground}, objects:[...s.objects], lines:[...s.lines] }; }
function histReducer(s, a) {
  switch (a.type) {
    case "PUSH": return {...s, ...a.p, past:[...s.past, snap(s)].slice(-MAX_UNDO), future:[]};
    case "UNDO": if (!s.past.length) return s; { const prev=s.past[s.past.length-1]; return {...s,...prev,past:s.past.slice(0,-1),future:[snap(s),...s.future].slice(0,MAX_UNDO)}; }
    case "REDO": if (!s.future.length) return s; { const next=s.future[0]; return {...s,...next,past:[...s.past,snap(s)].slice(-MAX_UNDO),future:s.future.slice(1)}; }
    case "RESET": return {ground:{},objects:[],lines:[],past:[],future:[]};
    default: return s;
  }
}

/* ─── TOOL DEFINITIONS ───────────────────────────────────────────────────── */
const GT = [
  {id:"grass",   icon:"🟩",label:"Grass",      tip:"Lawn grass. Paint by clicking/dragging, or use Rectangle Fill to paint a box."},
  {id:"dirt",    icon:"🟫",label:"Bare Soil",   tip:"Bare soil — good under planting beds."},
  {id:"concrete",icon:"⬜",label:"Concrete",    tip:"Concrete slab — driveways, patios."},
  {id:"gravel",  icon:"🪨",label:"Gravel",      tip:"Loose gravel or crushed stone."},
  {id:"mulch",   icon:"🟤",label:"Mulch",       tip:"Organic mulch around trees and beds."},
  {id:"sand",    icon:"🟡",label:"Sand",        tip:"Sand — play areas or beach-style edging."},
  {id:"pavers",  icon:"🧱",label:"Pavers",      tip:"Paving stones or brick pavers."},
  {id:"decking", icon:"🪵",label:"Decking",     tip:"Timber decking boards."},
  {id:"turf",    icon:"🌿",label:"Artif. Turf", tip:"Synthetic/artificial turf — no irrigation required."},
  {id:"pebbles", icon:"⚪",label:"Pebbles",     tip:"Decorative pebbles or river stones."},
  {id:"water",   icon:"🔵",label:"Pond",        tip:"Water feature or pond area."},
];
const GROUND_COLORS = {grass:"#4a9e4a",dirt:"#8B6340",concrete:"#c0c0c0",gravel:"#9e9e80",mulch:"#6b3a1f",water:"#2a6aaf",sand:"#d4b96e",pavers:"#d08060",decking:"#c8864a",turf:"#7ac45a",pebbles:"#b0b0a0"};

const OT = [
  {id:"tree",       icon:"🌲",label:"Tree",        tip:"Place a tree. Adjust size with the slider below."},
  {id:"shrub",      icon:"🌿",label:"Shrub",        tip:"Ornamental shrub or bush."},
  {id:"flowerbed",  icon:"🌸",label:"Flower Bed",   tip:"Annual or perennial flower bed."},
  {id:"raised_bed", icon:"🥬",label:"Raised Bed",   tip:"Raised vegetable or herb garden bed."},
  {id:"sprinkler",  icon:"💧",label:"Sprinkler",    tip:"Pop-up sprinkler head. Dashed circle shows spray radius. Assign to zones with the zone selector."},
  {id:"drip_emitter",icon:"💦",label:"Drip Emitter",tip:"Low-flow drip emitter — precise watering for beds."},
  {id:"watersource",icon:"🚰",label:"Water Source", tip:"Water inlet/tap. One per garden. Auto Irrigate connects all pipes back to this."},
  {id:"hose_reel",  icon:"🟢",label:"Hose Reel",    tip:"Garden hose reel location."},
  {id:"pump",       icon:"⚙",label:"Pump",          tip:"Water pump (pool, tank, or booster)."},
  {id:"light",      icon:"💡",label:"Garden Light",  tip:"Outdoor garden or pathway light."},
  {id:"bench",      icon:"🪑",label:"Bench",         tip:"Garden bench or seating area."},
  {id:"firepit",    icon:"🔥",label:"Fire Pit",      tip:"Fire pit with stone surround."},
  {id:"gazebo",     icon:"⛺",label:"Gazebo",        tip:"Gazebo, pergola, or shade sail."},
  {id:"shed",       icon:"🏚",label:"Shed",          tip:"Garden tool shed."},
  {id:"pool",       icon:"🏊",label:"Pool",          tip:"Swimming pool."},
  {id:"compost",    icon:"♻",label:"Compost",        tip:"Compost bin."},
];
const LT = [
  {id:"irrigation",icon:"💦",label:"Irrigation Pipe",tip:"Main supply pipe. Drag to draw. Connects sprinklers to the water source."},
  {id:"drip_line", icon:"🟢",label:"Drip Line",      tip:"Drip hose — runs to emitters and raised beds."},
  {id:"fence",     icon:"🪵",label:"Fence",           tip:"Garden fence or boundary."},
  {id:"path",      icon:"🛤",label:"Path",            tip:"Walking path or stepping stone trail."},
  {id:"wall",      icon:"🧱",label:"Wall",            tip:"Retaining or boundary wall."},
  {id:"hedge",     icon:"🌳",label:"Hedge Row",       tip:"Living hedge — closely planted shrubs."},
  {id:"powerline", icon:"⚡",label:"Power Cable",     tip:"Underground electrical cable route."},
  {id:"measure",   icon:"📏",label:"Measure",         tip:"Draw a distance measurement. Label shows real-world length in your chosen units."},
];
const UT = [
  {id:"select",  icon:"↖",label:"Select",   tip:"Click objects or lines to select them. Inspect and edit in the properties panel. Delete key removes."},
  {id:"paint",   icon:"✏️",label:"Paint",    tip:"Click and drag to paint ground type onto cells. Hold mouse and drag for freehand painting."},
  {id:"rect",    icon:"⬛",label:"Rect Fill", tip:"Click and drag a rectangle to fill an area with the selected ground type. Great for large zones."},
  {id:"erase",   icon:"🗑",label:"Erase",    tip:"Click or drag to erase ground paint, objects, and lines."},
];
const ALL_TOOLS = [...UT, ...GT, ...OT, ...LT];
const TOOL_MAP = Object.fromEntries(ALL_TOOLS.map(t=>[t.id,t]));
const ZONE_COLORS = ["#3b82f6","#22c55e","#f97316"];

/* ─── TOOLTIP ─────────────────────────────────────────────────────────────── */
function Tip({text, children}) {
  const [vis, setVis] = useState(false);
  const [pos, setPos] = useState({x:0, y:0});
  const timer = useRef(null);
  return (
    <span style={{display:"contents"}}
      onMouseEnter={e=>{const p={x:e.clientX+14,y:e.clientY+6};setPos(p);timer.current=setTimeout(()=>setVis(true),350);}}
      onMouseMove={e=>setPos({x:e.clientX+14,y:e.clientY+6})}
      onMouseLeave={()=>{clearTimeout(timer.current);setVis(false);}}>
      {children}
      {vis && (
        <div style={{
          position:"fixed", left:Math.min(pos.x, window.innerWidth-220), top:pos.y,
          zIndex:9999, background:"#1a1a1a", color:"#f0f0f0",
          border:"1px solid #444", borderRadius:7,
          padding:"7px 11px", fontSize:12.5, maxWidth:210, lineHeight:1.55,
          pointerEvents:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
          fontFamily:"system-ui, sans-serif",
        }}>{text}</div>
      )}
    </span>
  );
}

/* ─── HELP MODAL ─────────────────────────────────────────────────────────── */
const HELP_ITEMS = [
  {icon:"🚀",h:"Quick Start",b:"1. Set your yard size: Tools tab → Set Yard Size. Each cell = your chosen real-world scale.\n2. Paint ground (Ground tab) — paint or rect-fill grass, concrete, etc.\n3. Add objects: trees, sprinklers, water source (Objects tab).\n4. Draw lines: fences, paths, irrigation (Lines tab).\n5. Run Auto Irrigate from the Tools tab for automatic sprinkler layout."},
  {icon:"✏️",h:"Paint vs Rect Fill",b:"Paint: click and drag freehand — great for irregular shapes.\n\nRect Fill: drag a rectangle to fill a custom-sized rectangular area — ideal for lawns and patios. The rectangle preview shows while you drag."},
  {icon:"💧",h:"Irrigation & Auto Irrigate",b:"Place a Water Source (🚰) first. Place Sprinklers (💧) — blue dashed circle shows coverage. Run ✨ Auto Irrigate (Tools tab) to automatically place sprinklers on grass and draw supply pipes back to the water source. Assign sprinklers to zones (Z1/Z2/Z3) for timed schedules."},
  {icon:"📏",h:"Measure tool",b:"Draw a Measure line (Lines tab) across any part of your plan. The real-world distance appears as a label. Switches between metres and feet with the m/ft toggle in the toolbar."},
  {icon:"↖",h:"Select & delete",b:"Select tool → click any object or line (blue glow = selected). Edit properties in the sidebar. Press Delete/Backspace to remove. Ctrl+Z undoes, Ctrl+Shift+Z redoes (up to 30 steps)."},
  {icon:"⚙",h:"Scale & units",b:"Use the Grid dropdown in the toolbar to change how much real-world area each cell represents (0.1m to 5m). Toggle m/ft for metric or imperial display."},
  {icon:"💾",h:"Save & load",b:"Export saves your design as a .json file you can keep and share. Import loads it back. All settings (scale, units, project name) are saved too."},
];

function HelpModal({onClose, dark}) {
  const bg = dark?"#1e1e1e":"#fff";
  const tc = dark?"#e8e8e8":"#111";
  const tc2 = dark?"#aaaaaa":"#555";
  const bd = dark?"#333":"#e0e0e0";
  const sbg = dark?"#2a2a2a":"#f7f7f5";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000}}>
      <div style={{background:bg,borderRadius:14,width:520,maxHeight:"84vh",display:"flex",flexDirection:"column",overflow:"hidden",border:`1px solid ${bd}`,color:tc}}>
        <div style={{padding:"15px 20px 11px",borderBottom:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontSize:16,fontWeight:600}}>📖 How to use</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:tc2,lineHeight:1,padding:"0 4px"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"14px 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
          {HELP_ITEMS.map(s=>(
            <div key={s.h} style={{background:sbg,borderRadius:9,padding:"11px 14px",border:`1px solid ${bd}`}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:4,color:tc}}>{s.icon} {s.h}</div>
              <div style={{fontSize:12.5,color:tc2,lineHeight:1.65,whiteSpace:"pre-line"}}>{s.b}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function BackyardPlanner() {
  const canvasRef   = useRef(null);
  const containerRef= useRef(null);

  const [hist, dispatch] = useReducer(histReducer, {ground:{}, objects:[], lines:[], past:[], future:[]});
  const {ground, objects, lines} = hist;

  const [cols, setCols]         = useState(D_COLS);
  const [rows, setRows]         = useState(D_ROWS);
  const [cellM, setCellM]       = useState(0.5);
  const [metric, setMetric]     = useState(true);
  const [dark, setDark]         = useState(false);

  // Active tool + ground type (separate so switching tools doesn't lose ground choice)
  const [activeTool, setActiveTool]   = useState("paint");
  const [activeGround, setActiveGround] = useState("grass"); // which ground type is armed

  const [sel, setSel]           = useState(null); // {kind, idx}
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [currentLine, setCurrentLine]     = useState(null);

  // Rect fill drag state
  const [rectStart, setRectStart]   = useState(null);
  const [rectEnd,   setRectEnd]     = useState(null);
  const [rectDragging, setRectDragging] = useState(false);

  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom]         = useState(1);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showHelp, setShowHelp]           = useState(false);
  const [showStats, setShowStats]         = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [newCols, setNewCols]   = useState(D_COLS);
  const [newRows, setNewRows]   = useState(D_ROWS);
  const [newCellM,setNewCellM]  = useState(0.5);
  const [yardName, setYardName] = useState("My Garden");
  const [sprinklerR, setSprinklerR] = useState(3);
  const [objSize,    setObjSize]    = useState(1);
  const [activeZone, setActiveZone] = useState(1);
  const [hoverCell,  setHoverCell]  = useState(null);
  const [isFS, setIsFS]             = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [autoMode,   setAutoMode]   = useState("full"); // "full" | "perimeter"
  const [autoSprinklerType, setAutoSprinklerType] = useState("popup_spray");
  const [autoRadius, setAutoRadius] = useState(12); // in feet
  const [autoPreview, setAutoPreview] = useState(null); // {sprinklers:[], coverage:{}}
  const [activeTab,  setActiveTab]  = useState("ground"); // ground|objects|lines|tools
  // Plot plan / lot overlay
  const [lotPlan, setLotPlan]       = useState(null);   // {polygon, house, ...}
  const [showLot, setShowLot]       = useState(true);   // toggle lot overlay
  const [showPlotImport, setShowPlotImport] = useState(false);
  const [plotImporting, setPlotImporting]   = useState(false);
  const [plotImportError, setPlotImportError] = useState("");

  const isDragging = useRef(false);
  const lastCell   = useRef(null);

  const push = useCallback(p => dispatch({type:"PUSH",p}), []);
  const undo = () => dispatch({type:"UNDO"});
  const redo = () => dispatch({type:"REDO"});

  const cs = BASE_CS * zoom;

  /* ── Theme tokens ── */
  const T = dark ? {
    bg:"#18181b", sidebar:"#1e1e22", border:"#333340",
    text:"#e8e8f0", text2:"#9090a0", input:"#28282e",
    activeBtnBg:"#2563eb", canvas:"#141418",
    card:"#242428", cardBorder:"#333340",
  } : {
    bg:"#ffffff", sidebar:"#f4f4f6", border:"#dddde0",
    text:"#111118", text2:"#666672", input:"#ffffff",
    activeBtnBg:"#2563eb", canvas:"#cac2b2",
    card:"#ffffff", cardBorder:"#dddde0",
  };

  /* ─── CANVAS DRAW ─── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = cols * cs;
    canvas.height = rows * cs;

    ctx.fillStyle = dark ? "#232328" : "#d8cfc0";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Ground tiles
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const g = ground[`${c},${r}`];
      if (g && GP[g]) GP[g](ctx, c*cs, r*cs, cs);
    }

    // Grid
    if (showGrid) {
      ctx.strokeStyle = dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.09)";
      ctx.lineWidth = 0.5;
      for (let c=0; c<=cols; c++) { ctx.beginPath(); ctx.moveTo(c*cs,0); ctx.lineTo(c*cs,rows*cs); ctx.stroke(); }
      for (let r=0; r<=rows; r++) { ctx.beginPath(); ctx.moveTo(0,r*cs); ctx.lineTo(cols*cs,r*cs); ctx.stroke(); }
      ctx.fillStyle = dark ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.25)";
      ctx.font = `${Math.max(8, 10*zoom)}px monospace`;
      for (let c=5; c<cols; c+=5) { ctx.textAlign="left"; ctx.fillText(fmt(c,cellM,metric), c*cs+3, 12); }
      for (let r=5; r<rows; r+=5) { ctx.textAlign="left"; ctx.fillText(fmt(r,cellM,metric), 3, r*cs+12); }
    }

    // Lines
    lines.forEach((l,i) => drawLine(ctx, l, cs, sel?.kind==="line" && sel?.idx===i));
    if (currentLine && currentLine.points.length > 0) drawLine(ctx, currentLine, cs, false);

    // Objects
    objects.forEach((o,i) => drawObj(ctx, o, cs, sel?.kind==="object" && sel?.idx===i, dark));

    // Hover highlight (paint/erase only)
    if (hoverCell && (activeTool==="paint" || activeTool==="erase")) {
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(hoverCell.x*cs, hoverCell.y*cs, cs, cs);
      ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hoverCell.x*cs+1, hoverCell.y*cs+1, cs-2, cs-2);
    }

    // Rect fill preview
    if (activeTool==="rect" && rectStart && rectEnd) {
      const x1=Math.min(rectStart.x,rectEnd.x), y1=Math.min(rectStart.y,rectEnd.y);
      const x2=Math.max(rectStart.x,rectEnd.x), y2=Math.max(rectStart.y,rectEnd.y);
      const c = GROUND_COLORS[activeGround] || "#88aaff";
      ctx.fillStyle = c+"44";
      ctx.fillRect(x1*cs, y1*cs, (x2-x1+1)*cs, (y2-y1+1)*cs);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.setLineDash([6,4]);
      ctx.strokeRect(x1*cs+1, y1*cs+1, (x2-x1+1)*cs-2, (y2-y1+1)*cs-2);
      ctx.setLineDash([]);
      // Size label
      const w=x2-x1+1, h=y2-y1+1;
      ctx.fillStyle = dark?"rgba(255,255,255,.85)":"rgba(0,0,0,.75)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(`${w}×${h} cells · ${fmtArea(w*h,cellM,metric)}`,
        (x1+x2+1)/2*cs, (y1+y2+1)/2*cs);
    }

    // Selection ring
    if (sel?.kind==="object") {
      const o=objects[sel.idx];
      if (o) { ctx.strokeStyle="#3b82f6"; ctx.lineWidth=2.5; ctx.setLineDash([5,3]); ctx.strokeRect(o.x*cs-3,o.y*cs-3,cs+6,cs+6); ctx.setLineDash([]); }
    }

    // ── LOT PLAN OVERLAY ────────────────────────────────────────────────────
    if (lotPlan && showLot) {
      const ftPerCell = cellM * 3.28084; // feet per cell
      const ptToCanvas = (fx, fy) => [fx / ftPerCell * cs, fy / ftPerCell * cs];

      // Lot boundary polygon
      if (lotPlan.polygon && lotPlan.polygon.length >= 3) {
        ctx.beginPath();
        const [px0, py0] = ptToCanvas(lotPlan.polygon[0][0], lotPlan.polygon[0][1]);
        ctx.moveTo(px0, py0);
        lotPlan.polygon.slice(1).forEach(([fx, fy]) => {
          const [px, py] = ptToCanvas(fx, fy);
          ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.strokeStyle = dark ? "rgba(251,191,36,.8)" : "rgba(180,120,0,.85)";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Semi-transparent lot fill (only outside boundary clearly marked)
        ctx.fillStyle = dark ? "rgba(251,191,36,.04)" : "rgba(180,120,0,.04)";
        ctx.fill();
      }

      // House footprint
      if (lotPlan.house) {
        const h = lotPlan.house;
        const [hx, hy] = ptToCanvas(h.x, h.y);
        const hw = h.w / ftPerCell * cs;
        const hh = h.h / ftPerCell * cs;
        ctx.fillStyle = dark ? "rgba(148,163,184,.25)" : "rgba(100,116,139,.2)";
        ctx.fillRect(hx, hy, hw, hh);
        ctx.strokeStyle = dark ? "rgba(148,163,184,.8)" : "rgba(71,85,105,.9)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.strokeRect(hx, hy, hw, hh);
        // Garage split indicator
        if (lotPlan.garageX != null) {
          const gx = lotPlan.garageX / ftPerCell * cs;
          ctx.strokeStyle = dark ? "rgba(148,163,184,.5)" : "rgba(71,85,105,.5)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(gx, hy); ctx.lineTo(gx, hy + hh); ctx.stroke();
          ctx.setLineDash([]);
        }
        // House label
        ctx.fillStyle = dark ? "rgba(148,163,184,.95)" : "rgba(30,41,59,.9)";
        ctx.font = `bold ${Math.max(10, Math.min(14, hw/6))}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("HOUSE", hx + hw/2, hy + hh/2 - 8);
        if (lotPlan.livingAreaSF) {
          ctx.font = `${Math.max(9, Math.min(12, hw/7))}px sans-serif`;
          ctx.fillText(`${lotPlan.livingAreaSF} SF`, hx + hw/2, hy + hh/2 + 8);
        }
      }

      // Lot info label (bottom-left corner area)
      if (lotPlan.address) {
        ctx.fillStyle = dark ? "rgba(0,0,0,.7)" : "rgba(0,0,0,.65)";
        const labelW = 160, labelH = 36;
        ctx.fillRect(4, 4, labelW, labelH);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText("📐 " + (lotPlan.yardName || lotPlan.address || "Plot Plan"), 8, 7);
        ctx.fillStyle = "rgba(255,255,255,.8)";
        ctx.font = "9px sans-serif";
        ctx.fillText(`Lot: ${lotPlan.lotAreaSF?.toLocaleString()} SF · Rear: ${lotPlan.rearYardSF?.toLocaleString()} SF`, 8, 22);
      }
    }
  }, [cols, rows, ground, objects, lines, currentLine, showGrid, cs, sel, hoverCell, dark, cellM, metric, zoom, activeTool, activeGround, rectStart, rectEnd, lotPlan, showLot]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const h = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFS = () => { const el=containerRef.current; if(!document.fullscreenElement)el?.requestFullscreen?.(); else document.exitFullscreen?.(); };

  /* ─── INPUT ─── */
  const getCell = e => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const x = Math.floor((e.clientX-rect.left)/cs);
    const y = Math.floor((e.clientY-rect.top)/cs);
    if (x<0||x>=cols||y<0||y>=rows) return null;
    return {x, y};
  };

  // Apply a single paint/erase cell
  const applyCell = useCallback((cell, g, o, l) => {
    const key = `${cell.x},${cell.y}`;
    if (activeTool === "paint") {
      push({ground:{...g,[key]:activeGround}, objects:o, lines:l});
    } else if (activeTool === "erase") {
      const ng = {...g}; delete ng[key];
      push({ground:ng, objects:o.filter(ob=>!(ob.x===cell.x&&ob.y===cell.y)), lines:l.filter(ln=>!ln.points.some(p=>p.x===cell.x&&p.y===cell.y))});
    }
  }, [activeTool, activeGround, push]);

  const handleMouseDown = e => {
    const cell = getCell(e);
    if (!cell) return;
    const tool = TOOL_MAP[activeTool];

    // Line drawing
    if (tool && LT.find(t=>t.id===activeTool)) {
      setIsDrawingLine(true);
      setCurrentLine({type:activeTool, points:[cell]});
      return;
    }

    // Rect fill start
    if (activeTool === "rect") {
      setRectStart(cell); setRectEnd(cell); setRectDragging(true);
      isDragging.current = true;
      return;
    }

    // Object placement
    if (OT.find(t=>t.id===activeTool)) {
      if (objects.find(o=>o.x===cell.x&&o.y===cell.y&&o.type===activeTool)) return;
      if (activeTool==="watersource"&&objects.some(o=>o.type==="watersource")) return;
      push({ground, objects:[...objects,{x:cell.x,y:cell.y,type:activeTool,size:objSize,
        ...(activeTool==="sprinkler"?{radius:sprinklerR,zone:activeZone}:{}),
        ...(activeTool==="drip_emitter"?{radius:1.5}:{}),
      }], lines});
      return;
    }

    // Select
    if (activeTool === "select") {
      const oi = objects.findIndex(o=>o.x===cell.x&&o.y===cell.y);
      if (oi>=0) { setSel({kind:"object",idx:oi}); return; }
      const li = lines.findIndex(l=>l.points.some(p=>Math.abs(p.x-cell.x)<=1&&Math.abs(p.y-cell.y)<=1));
      setSel(li>=0 ? {kind:"line",idx:li} : null);
      return;
    }

    // Paint / erase
    isDragging.current = true;
    lastCell.current = cell;
    applyCell(cell, ground, objects, lines);
  };

  const handleMouseMove = e => {
    const cell = getCell(e);
    setHoverCell(cell);

    if (!cell) return;

    // Rect fill drag
    if (activeTool==="rect" && rectDragging) {
      setRectEnd(cell);
      return;
    }

    // Line drawing
    if (LT.find(t=>t.id===activeTool) && isDrawingLine) {
      setCurrentLine(prev => {
        if (!prev) return null;
        const last = prev.points[prev.points.length-1];
        if (last.x===cell.x && last.y===cell.y) return prev;
        return {...prev, points:[...prev.points, cell]};
      });
      return;
    }

    if (!isDragging.current) return;
    if (lastCell.current?.x===cell.x && lastCell.current?.y===cell.y) return;
    lastCell.current = cell;

    if (activeTool==="paint" || activeTool==="erase") applyCell(cell, ground, objects, lines);
  };

  const finishLine = () => {
    if (isDrawingLine && currentLine?.points.length >= 2) {
      let line = {...currentLine};
      if (line.type === "measure") {
        const p0=line.points[0], p1=line.points[line.points.length-1];
        const dist = Math.sqrt(Math.pow(p1.x-p0.x,2)+Math.pow(p1.y-p0.y,2));
        line.measureLabel = fmt(dist, cellM, metric);
      }
      push({ground, objects, lines:[...lines, line]});
    }
    setIsDrawingLine(false); setCurrentLine(null);
  };

  const handleMouseUp = e => {
    // Rect fill commit
    if (activeTool==="rect" && rectDragging && rectStart && rectEnd) {
      const x1=Math.min(rectStart.x,rectEnd.x), y1=Math.min(rectStart.y,rectEnd.y);
      const x2=Math.max(rectStart.x,rectEnd.x), y2=Math.max(rectStart.y,rectEnd.y);
      const ng = {...ground};
      for (let r=y1; r<=y2; r++) for (let c=x1; c<=x2; c++) ng[`${c},${r}`] = activeGround;
      push({ground:ng, objects, lines});
    }
    isDragging.current = false;
    setRectDragging(false); setRectStart(null); setRectEnd(null);
    finishLine();
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    setHoverCell(null);
    setRectDragging(false); setRectStart(null); setRectEnd(null);
    finishLine();
  };

  const delSelected = useCallback(() => {
    if (!sel) return;
    if (sel.kind==="object") push({ground, objects:objects.filter((_,i)=>i!==sel.idx), lines});
    if (sel.kind==="line")   push({ground, objects, lines:lines.filter((_,i)=>i!==sel.idx)});
    setSel(null);
  }, [sel, ground, objects, lines, push]);

  useEffect(() => {
    const h = e => {
      if ((e.key==="Delete"||e.key==="Backspace") && sel) { e.preventDefault(); delSelected(); }
      if (e.key==="z"&&(e.ctrlKey||e.metaKey)&&!e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key==="z"&&e.shiftKey&&(e.ctrlKey||e.metaKey))||(e.key==="y"&&(e.ctrlKey||e.metaKey))) { e.preventDefault(); redo(); }
      if (e.key==="Escape") setSel(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sel, delSelected]);

  /* ─── AUTO IRRIGATE ─── */
  // Convert real-world feet to grid cells
  const ftToCells = (ft) => Math.max(1, Math.round(ft / (cellM * 3.28084)));

  // Compute preview without committing — called whenever modal params change
  const computeAutoPreview = useCallback((mode, radiusFt, sType) => {
    const comps = grassComponents(ground, cols, rows);
    if (!comps.length) { setAutoPreview(null); return; }
    const st = SPRINKLER_TYPES.find(t=>t.id===sType) || SPRINKLER_TYPES[1];
    const radiusCells = Math.max(1, Math.round(radiusFt / (cellM * 3.28084)));
    const overlapFactor = st.overlap ? 0.5 : 0.9;
    const allS = [];
    comps.forEach((comp, ci) => {
      const usePerim = mode==="perimeter" || comp.length<=16;
      placeSprinklers(comp, radiusCells, usePerim, overlapFactor).forEach(s => allS.push({...s, zone:(ci%3)+1}));
    });
    const grassSet = new Set(Object.entries(ground).filter(([,v])=>v==="grass").map(([k])=>k));
    const coverage = computeCoverage(allS, radiusCells, grassSet);
    setAutoPreview({ sprinklers: allS, coverage, radiusCells });
  }, [ground, cols, rows, cellM]);

  // Recompute preview whenever modal params change
  useEffect(() => {
    if (showAutoModal) computeAutoPreview(autoMode, autoRadius, autoSprinklerType);
  }, [showAutoModal, autoMode, autoRadius, autoSprinklerType, computeAutoPreview]);

  const runAuto = (mode, radiusFt, sType) => {
    const ws = objects.find(o=>o.type==="watersource");
    if (!ws) { alert("Place a Water Source (🚰) first — it's the starting point for all irrigation pipes."); return; }
    const comps = grassComponents(ground, cols, rows);
    if (!comps.length) { alert("No grass found. Paint some grass first, then run Auto Irrigate."); return; }
    const st = SPRINKLER_TYPES.find(t=>t.id===sType) || SPRINKLER_TYPES[1];
    const radiusCells = Math.max(1, Math.round(radiusFt / (cellM * 3.28084)));
    const overlapFactor = st.overlap ? 0.5 : 0.9;
    const allS = [];
    comps.forEach((comp, ci) => {
      const usePerim = mode==="perimeter" || comp.length<=16;
      placeSprinklers(comp, radiusCells, usePerim, overlapFactor).forEach(s => allS.push({...s, zone:(ci%3)+1}));
    });
    const manualObjs  = objects.filter(o=>!(o.type==="sprinkler"&&o.auto));
    const manualLines = lines.filter(l=>!l.auto);
    const newObjs  = [...manualObjs, ...allS.map(s=>({
      x:s.x, y:s.y, type:"sprinkler", size:1, radius:radiusCells, auto:true, zone:s.zone,
      sprinklerType:sType, sprinklerColor: st.color,
    }))];
    const nodes = [ws, ...allS];
    const edges = primMST(nodes);
    const newLines = [...manualLines, ...edges.map(([a,b])=>({type:"irrigation",points:lPath(nodes[a],nodes[b]),auto:true}))];
    const grassSet = new Set(Object.entries(ground).filter(([,v])=>v==="grass").map(([k])=>k));
    const coverage = computeCoverage(allS, radiusCells, grassSet);
    push({ground, objects:newObjs, lines:newLines});
    setAutoResult({count:allS.length, grassCells:grassSet.size, covG:coverage.coveredGrass, lineCount:edges.length, sType, radiusFt});
    setAutoPreview(null);
    setShowAutoModal(false);
  };

  /* ─── RESIZE ─── */
  const handleResize = () => {
    setCols(newCols); setRows(newRows); setCellM(newCellM);
    dispatch({type:"RESET"}); setSel(null); setShowSizeModal(false);
  };

  /* ─── EXPORT / IMPORT ─── */
  const [exportLink, setExportLink] = useState(null); // {url, filename}

  const exportDesign = () => {
    const d = {yardName, cols, rows, cellM, metric, ground, objects, lines, lotPlan, version:5};
    const json = JSON.stringify(d, null, 2);
    // Use data URI to avoid triggering navigation in sandboxed iframe environments
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const filename = `${yardName.replace(/\s+/g,"_") || "garden"}.json`;
    // Try programmatic download; fall back to showing a visible link
    try {
      const a = document.createElement("a");
      a.href = dataUri;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      // Delay removal to give browser time to register the click
      setTimeout(() => { document.body.removeChild(a); }, 500);
    } catch(e) {
      // Fallback: show a clickable link the user can right-click → Save As
      setExportLink({url: dataUri, filename});
    }
  };
  const importDesign = () => {
    const i = document.createElement("input"); i.type="file"; i.accept=".json";
    i.onchange = e => {
      const f=e.target.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload = ev => {
        try {
          const d=JSON.parse(ev.target.result);
          setYardName(d.yardName||"My Garden"); setCols(d.cols||D_COLS); setRows(d.rows||D_ROWS);
          setCellM(d.cellM||0.5); if(d.metric!==undefined)setMetric(d.metric);
          dispatch({type:"PUSH", p:{ground:d.ground||{}, objects:d.objects||[], lines:d.lines||[]}});
          if(d.lotPlan){setLotPlan(d.lotPlan);setShowLot(true);}
          setSel(null);
        } catch { alert("Invalid file format."); }
      };
      r.readAsText(f);
    };
    i.click();
  };
  const clearAll = () => { if (!confirm("Clear the entire design?")) return; dispatch({type:"RESET"}); setSel(null); };

  /* ─── PLOT PLAN IMPORT ─── */
  const importPlotPlan = async (file) => {
    if (!file) return;
    setPlotImporting(true);
    setPlotImportError("");
    try {
      // Convert file to base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result.split(",")[1]);
        reader.onerror = () => rej(new Error("Read failed"));
        reader.readAsDataURL(file);
      });

      const isPDF = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      const contentBlock = isPDF
        ? { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } }
        : { type:"image",    source:{ type:"base64", media_type:file.type, data:base64 } };

      const prompt = `You are analyzing a residential plot plan / site plan drawing.

Extract the following information and return ONLY a valid JSON object (no markdown, no explanation):

{
  "yardName": "street address or lot ID from the plan",
  "lotAreaSF": (lot area in square feet as number, or null),
  "rearYardSF": (rear yard area SF as number, or null),
  "footprintSF": (house footprint SF as number, or null),
  "livingAreaSF": (living area SF as number, or null),
  "garageAreaSF": (garage area SF as number, or null),
  "address": "full address from the plan",
  "scale": "scale notation eg '1 inch = 20 feet'",
  "scaleInchToFt": (numeric feet per inch from scale, eg 20),
  "lotWidthFt": (lot width in feet as number),
  "lotDepthFt": (lot depth/length in feet as number, use the longer dimension),
  "lotDepthLeftFt": (left side depth in feet if different from right),
  "lotDepthRightFt": (right side depth in feet if different from left),
  "lotFrontFt": (front dimension facing street in feet),
  "lotRearFt": (rear dimension in feet),
  "isRectangular": (true/false - is it a simple rectangle?),
  "polygon": [[x,y],[x,y],...] (lot polygon corners in feet from top-left, clockwise, 4+ points for irregular lots),
  "house": {
    "x": (feet from lot left edge),
    "y": (feet from lot top/rear edge),
    "w": (width in feet),
    "h": (depth in feet)
  },
  "garageX": (feet from lot left where garage splits from living area, or null),
  "setbackFrontFt": (front setback in feet or null),
  "setbackRearFt": (rear setback in feet or null),
  "setbackLeftFt": (left side setback in feet or null),
  "setbackRightFt": (right side setback in feet or null),
  "notes": "any other relevant notes"
}

For the polygon: origin [0,0] = top-left corner of lot (rear/back), x goes right, y goes down toward the street. If the lot is rectangular with lotWidthFt W and sides D_left and D_right, the polygon is [[0,0],[W,0],[W,D_right],[-offset,D_left]] where offset accounts for angled front.

Look carefully at all dimension annotations on the drawing. The scale is critical — use it to verify dimensions.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role:"user", content:[contentBlock, { type:"text", text:prompt }] }]
        })
      });

      if (!resp.ok) throw new Error(`API error ${resp.status}`);
      const data = await resp.json();
      const raw = data.content?.map(b => b.text||"").join("").trim();
      const clean = raw.replace(/```json|```/g,"").trim();
      const plan = JSON.parse(clean);

      // Build polygon if not provided but we have dimensions
      if (!plan.polygon || plan.polygon.length < 3) {
        const W = plan.lotFrontFt || plan.lotWidthFt || 60;
        const DL = plan.lotDepthLeftFt || plan.lotDepthFt || 120;
        const DR = plan.lotDepthRightFt || plan.lotDepthFt || 120;
        plan.polygon = [[0,0],[W,0],[W,DR],[0,DL]];
      }

      // Build house if not provided
      if (!plan.house && plan.footprintSF && plan.lotFrontFt) {
        const W = plan.lotFrontFt || 56;
        const houseW = W * 0.75;
        const houseH = (plan.footprintSF || 1298) / houseW;
        const houseX = (W - houseW) / 2;
        const lotD = plan.lotDepthLeftFt || plan.lotDepthFt || 120;
        const houseY = lotD - houseH - (plan.setbackFrontFt || 20);
        plan.house = { x:houseX, y:houseY, w:houseW, h:houseH };
      }

      // Auto-configure grid to match the lot
      const lotW = plan.lotFrontFt || plan.lotWidthFt || 56;
      const lotD = Math.max(plan.lotDepthLeftFt||0, plan.lotDepthRightFt||0, plan.lotDepthFt||0) || 148;
      // Pick cell size so grid roughly matches lot (aim for 20-40 cells per dimension)
      const targetCells = 28;
      const idealCellFt = Math.max(lotW, lotD) / targetCells;
      // Snap to nearest nice value
      const niceCellFt = [1,2,3,4,5,6,8,10].reduce((best,v) => Math.abs(v-idealCellFt)<Math.abs(best-idealCellFt)?v:best);
      const niceCellM = niceCellFt * 0.3048;
      const newC = Math.ceil(lotW / niceCellFt) + 2;
      const newR = Math.ceil(lotD / niceCellFt) + 2;

      setCols(newC); setRows(newR); setCellM(niceCellM); setMetric(false);
      setYardName(plan.yardName || plan.address || "Imported Lot");
      dispatch({type:"RESET"});
      setSel(null);
      setLotPlan(plan);
      setShowLot(true);
      setShowPlotImport(false);

    } catch(e) {
      setPlotImportError(`Could not read plot plan: ${e.message}. Try a clearer scan or enter dimensions manually.`);
    } finally {
      setPlotImporting(false);
    }
  };

  /* ─── STATS ─── */
  const grassCount = Object.values(ground).filter(g=>g==="grass").length;
  const hardCount  = Object.values(ground).filter(g=>["concrete","pavers","decking"].includes(g)).length;

  /* ─── SELECTED OBJ/LINE ─── */
  const selObj  = sel?.kind==="object" ? objects[sel.idx]  : null;
  const selLine = sel?.kind==="line"   ? lines[sel.idx]    : null;

  /* ─── SIDEBAR TOOL BUTTON ─── */
  const isActiveTool = id => activeTool===id;
  const isActiveGround = id => GROUND_IDS.includes(id) && activeGround===id && (activeTool==="paint"||activeTool==="rect");

  const SBtn = ({id, icon, label, tip, onClick}) => {
    const active = isActiveTool(id) || isActiveGround(id);
    return (
      <Tip text={tip||label}>
        <button onClick={onClick||(() => {
          setActiveTool(id);
          if (GROUND_IDS.includes(id)) setActiveGround(id);
          if (OT.find(t=>t.id===id)) { /* keep */ }
          if (LT.find(t=>t.id===id)) { /* keep */ }
        })}
        style={{
          display:"flex", alignItems:"center", gap:8, padding:"6px 10px",
          width:"100%", textAlign:"left", cursor:"pointer",
          background: active ? "#2563eb" : "transparent",
          color: active ? "#fff" : T.text,
          border: `1px solid ${active ? "#2563eb" : T.border}`,
          borderRadius:8, fontSize:13, fontFamily:"var(--font-sans)",
          transition:"all .1s",
        }}>
          <span style={{fontSize:16, minWidth:20, textAlign:"center"}}>{icon}</span>
          <span style={{fontWeight: active?600:400}}>{label}</span>
        </button>
      </Tip>
    );
  };

  const sizeToolSet = ["sprinkler","tree","shrub","flowerbed","raised_bed","gazebo","shed","pool","drip_emitter"];
  const isLineActive = LT.find(t=>t.id===activeTool);

  const inputStyle = {
    background: T.input, color: T.text,
    border: `1px solid ${T.border}`,
    borderRadius: 6, padding:"5px 8px",
    fontFamily:"var(--font-sans)", fontSize:13,
    width:"100%", boxSizing:"border-box",
  };

  const modalBtn = (label, onClick, primary=false, danger=false) => (
    <button onClick={onClick} style={{
      flex:1, padding:"9px 12px",
      background: primary?"#2563eb":danger?"#dc2626":"transparent",
      color: primary||danger?"#fff":T.text,
      border: primary||danger?"none":`1px solid ${T.border}`,
      borderRadius:8, cursor:"pointer", fontSize:13,
      fontFamily:"var(--font-sans)", fontWeight: primary||danger?600:400,
    }}>{label}</button>
  );

  /* ─── MATERIALS ESTIMATOR ─── */
  const computeMaterials = () => {
    const cellMeters = cellM;
    const sprinklers = objects.filter(o => o.type === "sprinkler");
    const sprinklerCount = sprinklers.length;
    const sprinklersByZone = [1,2,3].map(z => sprinklers.filter(s => s.zone === z).length);
    const emitters = objects.filter(o => o.type === "drip_emitter").length;

    // Pipe lengths in meters from drawn lines
    let irrigPipeM = 0, dripPipeM = 0, fenceM = 0, wallM = 0, hedgeM = 0, pathM = 0;
    lines.forEach(line => {
      if (line.points.length < 2) return;
      let len = 0;
      for (let i = 1; i < line.points.length; i++) {
        const dx = line.points[i].x - line.points[i-1].x;
        const dy = line.points[i].y - line.points[i-1].y;
        len += Math.sqrt(dx*dx + dy*dy);
      }
      const m = len * cellMeters;
      if (line.type === "irrigation") irrigPipeM += m;
      if (line.type === "drip_line")  dripPipeM  += m;
      if (line.type === "fence")      fenceM     += m;
      if (line.type === "wall")       wallM      += m;
      if (line.type === "hedge")      hedgeM     += m;
      if (line.type === "path")       pathM      += m;
    });

    // Add 15% waste/overlap for pipe
    const irrigPipe = irrigPipeM * 1.15;
    const dripPipe  = dripPipeM  * 1.15;
    // Fittings: elbows ~1 per 2.5m pipe, tees ~0.6 per sprinkler head, endcaps 1 per zone run
    const elbows   = Math.ceil(irrigPipe / 2.5);
    const tees     = Math.max(sprinklerCount - 1, 0);
    const endcaps  = Math.max(1, lines.filter(l=>l.type==="irrigation").length);
    const hasWS    = objects.some(o => o.type === "watersource");
    const zones    = Math.max(1, sprinklersByZone.filter(n=>n>0).length);
    const groundCounts = {};
    Object.values(ground).forEach(g => { groundCounts[g] = (groundCounts[g]||0) + 1; });

    // Hedge plants: 1 plant per 0.5m of hedge row
    const hedgePlants = Math.ceil(hedgeM / 0.5);

    return { sprinklerCount, sprinklersByZone, emitters, irrigPipe, dripPipe,
             elbows, tees, endcaps, fenceM, wallM, hedgeM, hedgePlants, pathM,
             groundCounts, hasWS, zones, cellMeters };
  };

  return (
    <div ref={containerRef} style={{
      display:"flex", height:isFS?"100vh":"92vh", minHeight:520,
      fontFamily:"var(--font-sans)", overflow:"hidden",
      borderRadius:isFS?0:12, border:`1px solid ${T.border}`,
      background:T.bg, color:T.text,
    }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <div style={{
        width:210, minWidth:210, background:T.sidebar,
        borderRight:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0,
      }}>
        {/* Header */}
        <div style={{padding:"12px 12px 10px", borderBottom:`1px solid ${T.border}`, flexShrink:0}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
            <span style={{fontSize:11, fontWeight:600, color:T.text2, textTransform:"uppercase", letterSpacing:".07em"}}>Project</span>
            <Tip text={dark?"Switch to light mode":"Switch to dark mode"}>
              <button onClick={()=>setDark(d=>!d)} style={{
                background:"none", border:`1px solid ${T.border}`, borderRadius:6,
                cursor:"pointer", fontSize:15, padding:"2px 7px", color:T.text, lineHeight:1.4,
              }}>{dark?"☀️":"🌙"}</button>
            </Tip>
          </div>
          <input value={yardName} onChange={e=>setYardName(e.target.value)}
            style={{...inputStyle, fontSize:14, fontWeight:500}} placeholder="Garden name…"/>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex", borderBottom:`1px solid ${T.border}`, flexShrink:0, background:T.bg}}>
          {[["ground","🌱","Ground"],["objects","🌲","Objects"],["lines","〰","Lines"],["tools","🛠","Tools"]].map(([tab,icon,label])=>(
            <Tip key={tab} text={label}>
              <button onClick={()=>setActiveTab(tab)} style={{
                flex:1, padding:"8px 2px", border:"none", cursor:"pointer", fontSize:18,
                background: activeTab===tab ? T.sidebar : "transparent",
                borderBottom: activeTab===tab ? `2px solid #2563eb` : "2px solid transparent",
                color: activeTab===tab ? "#2563eb" : T.text2,
                transition:"all .12s",
              }}>{icon}</button>
            </Tip>
          ))}
        </div>

        {/* Tool list — scrollable */}
        <div style={{flexGrow:1, overflowY:"auto", padding:"8px"}}>

          {/* ── GROUND TAB ── */}
          {activeTab==="ground" && (<>
            {/* Paint mode selector */}
            <div style={{display:"flex", gap:4, marginBottom:8, padding:"4px", background:T.bg, borderRadius:8, border:`1px solid ${T.border}`}}>
              {[["paint","✏️","Paint","Freehand paint by clicking and dragging"],["rect","⬛","Rect","Drag a rectangle to fill a custom area"]].map(([id,ic,lb,tip])=>(
                <Tip key={id} text={tip}>
                  <button onClick={()=>setActiveTool(id)} style={{
                    flex:1, padding:"5px 4px", fontSize:11.5, border:"none", borderRadius:6,
                    cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:600,
                    background: activeTool===id ? "#2563eb" : "transparent",
                    color: activeTool===id ? "#fff" : T.text2,
                  }}>{ic} {lb}</button>
                </Tip>
              ))}
            </div>
            {/* Ground type swatches */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:4}}>
              {GT.map(t=>{
                const active = activeGround===t.id && (activeTool==="paint"||activeTool==="rect");
                return (
                  <Tip key={t.id} text={t.tip}>
                    <button onClick={()=>{ setActiveGround(t.id); if(activeTool!=="rect")setActiveTool("paint"); }}
                      style={{
                        display:"flex", alignItems:"center", gap:6, padding:"5px 8px",
                        border:`2px solid ${active ? "#2563eb" : T.border}`,
                        borderRadius:7, cursor:"pointer",
                        background: active ? "#2563eb18" : T.bg,
                        color: T.text, fontSize:12, fontFamily:"var(--font-sans)",
                        transition:"all .1s",
                      }}>
                      <div style={{width:14,height:14,borderRadius:3,background:GROUND_COLORS[t.id]||"#999",flexShrink:0,border:`1px solid rgba(0,0,0,.2)`}}/>
                      <span style={{fontWeight:active?600:400, fontSize:11.5}}>{t.label}</span>
                    </button>
                  </Tip>
                );
              })}
            </div>
          </>)}

          {/* ── OBJECTS TAB ── */}
          {activeTab==="objects" && (<>
            {/* Zone selector */}
            <div style={{padding:"8px", background:T.bg, borderRadius:8, border:`1px solid ${T.border}`, marginBottom:8}}>
              <div style={{fontSize:11, color:T.text2, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em"}}>Irrigation Zone</div>
              <div style={{display:"flex", gap:4}}>
                {[1,2,3].map(z=>(
                  <button key={z} onClick={()=>setActiveZone(z)} style={{
                    flex:1, padding:"5px", fontSize:12, fontWeight:600,
                    border:`2px solid ${activeZone===z ? ZONE_COLORS[z-1] : T.border}`,
                    borderRadius:6, background: activeZone===z ? ZONE_COLORS[z-1]+"22" : "transparent",
                    cursor:"pointer", color:T.text, fontFamily:"var(--font-sans)",
                  }}>Z{z}</button>
                ))}
              </div>
            </div>
            {OT.map(t=><SBtn key={t.id} {...t}/>)}
          </>)}

          {/* ── LINES TAB ── */}
          {activeTab==="lines" && (<>
            {LT.map(t=><SBtn key={t.id} {...t}/>)}
            <div style={{marginTop:8, padding:"10px", background:T.bg, borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, color:T.text2, lineHeight:1.6}}>
              Drag to draw. Double-click or release to finish.<br/>
              Switch to <strong style={{color:T.text}}>Select</strong> (Tools tab), click a line, then press <kbd style={{background:T.border,borderRadius:3,padding:"1px 4px",fontSize:11}}>Del</kbd> to remove it.
            </div>
          </>)}

          {/* ── TOOLS TAB ── */}
          {activeTab==="tools" && (<>
            <div style={{display:"flex", flexDirection:"column", gap:4}}>
              {UT.map(t=><SBtn key={t.id} {...t}/>)}
            </div>
            <div style={{height:1,background:T.border,margin:"10px 0"}}/>
            <Tip text="Automatically place sprinklers on all grass areas and connect to your Water Source with irrigation pipes.">
              <button onClick={()=>setShowAutoModal(true)} style={{
                display:"flex", alignItems:"center", gap:8, padding:"9px 12px",
                width:"100%", background:"#064e3b", color:"#6ee7b7",
                border:"none", borderRadius:8, cursor:"pointer",
                fontSize:13, fontFamily:"var(--font-sans)", fontWeight:600,
              }}>✨ Auto Irrigate</button>
            </Tip>
            <div style={{height:1,background:T.border,margin:"10px 0"}}/>
            <div style={{display:"flex", flexDirection:"column", gap:4}}>
              <button onClick={()=>setShowSizeModal(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",width:"100%",textAlign:"left",cursor:"pointer",background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:"var(--font-sans)"}}>📐 Set Yard Size</button>
              <button onClick={()=>setShowStats(p=>!p)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",width:"100%",textAlign:"left",cursor:"pointer",background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:"var(--font-sans)"}}>📊 {showStats?"Hide":"Show"} Stats</button>
              <Tip text="Generate a shopping list: PVC pipe lengths, sprinkler heads, fittings, and more — based on your current design.">
                <button onClick={()=>setShowMaterials(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",width:"100%",textAlign:"left",cursor:"pointer",background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:"var(--font-sans)"}}>🛒 Materials List</button>
              </Tip>
              {showStats&&(
                <div style={{padding:"10px",background:T.bg,borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,color:T.text2,lineHeight:1.75}}>
                  <div style={{fontWeight:600,color:T.text,marginBottom:2}}>Yard stats</div>
                  <div>Size: {fmtArea(cols*rows,cellM,metric)}</div>
                  <div>Grass: {fmtArea(grassCount,cellM,metric)}</div>
                  <div>Hard: {fmtArea(hardCount,cellM,metric)}</div>
                  <div>Trees: {objects.filter(o=>o.type==="tree").length} · Shrubs: {objects.filter(o=>o.type==="shrub").length}</div>
                  <div>Sprinklers: {objects.filter(o=>o.type==="sprinkler").length}</div>
                  <div>Lines: {lines.length}</div>
                </div>
              )}
              <div style={{display:"flex", gap:4}}>
                <Tip text="Undo (Ctrl+Z)">
                  <button onClick={undo} disabled={!hist.past.length} style={{flex:1,padding:"6px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,cursor:hist.past.length?"pointer":"default",opacity:hist.past.length?1:.4,color:T.text,fontSize:12,fontFamily:"var(--font-sans)"}}>↩ Undo{hist.past.length?` (${hist.past.length})`:""}</button>
                </Tip>
                <Tip text="Redo (Ctrl+Shift+Z)">
                  <button onClick={redo} disabled={!hist.future.length} style={{flex:1,padding:"6px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,cursor:hist.future.length?"pointer":"default",opacity:hist.future.length?1:.4,color:T.text,fontSize:12,fontFamily:"var(--font-sans)"}}>↪ Redo</button>
                </Tip>
              </div>
              <button onClick={clearAll} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",width:"100%",textAlign:"left",cursor:"pointer",background:"#dc2626",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontFamily:"var(--font-sans)",fontWeight:600}}>🗑 Clear All</button>
            </div>
          </>)}
        </div>

        {/* Tool options (sprinkler radius, object size) */}
        {sizeToolSet.includes(activeTool) && (
          <div style={{padding:"10px 12px", borderTop:`1px solid ${T.border}`, flexShrink:0, background:T.bg}}>
            {activeTool==="sprinkler" && (<>
              <div style={{fontSize:11,color:T.text2,marginBottom:3,fontWeight:600}}>SPRAY RADIUS: {sprinklerR} cells · {fmt(sprinklerR,cellM,metric)}</div>
              <input type="range" min={1} max={8} value={sprinklerR} step={1} onChange={e=>setSprinklerR(+e.target.value)} style={{width:"100%",marginBottom:8}}/>
            </>)}
            <div style={{fontSize:11,color:T.text2,marginBottom:3,fontWeight:600}}>SIZE: {objSize}×</div>
            <input type="range" min={1} max={3} value={objSize} step={1} onChange={e=>setObjSize(+e.target.value)} style={{width:"100%"}}/>
          </div>
        )}

        {/* Properties panel */}
        {(selObj||selLine) && (
          <div style={{padding:"10px 12px", borderTop:`1px solid ${T.border}`, flexShrink:0, background:T.bg}}>
            <div style={{fontSize:11,fontWeight:600,color:T.text2,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Properties</div>
            {selObj && (<>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2,color:T.text}}>{TOOL_MAP[selObj.type]?.icon} {TOOL_MAP[selObj.type]?.label||selObj.type}</div>
              <div style={{fontSize:11,color:T.text2,marginBottom:6}}>{fmt(selObj.x,cellM,metric)}, {fmt(selObj.y,cellM,metric)}</div>
              {selObj.type==="sprinkler" && (<>
                <div style={{fontSize:11,color:T.text2,marginBottom:3}}>Radius: {selObj.radius||3} cells</div>
                <input type="range" min={1} max={8} value={selObj.radius||3} step={1}
                  onChange={e=>push({ground,objects:objects.map((o,i)=>i===sel.idx?{...o,radius:+e.target.value}:o),lines})}
                  style={{width:"100%",marginBottom:6}}/>
                <div style={{fontSize:11,color:T.text2,marginBottom:4,fontWeight:600}}>Zone</div>
                <div style={{display:"flex",gap:4,marginBottom:8}}>
                  {[1,2,3].map(z=>(
                    <button key={z} onClick={()=>push({ground,objects:objects.map((o,i)=>i===sel.idx?{...o,zone:z}:o),lines})}
                      style={{flex:1,padding:"4px",fontSize:12,fontWeight:600,
                        border:`2px solid ${(selObj.zone||1)===z?ZONE_COLORS[z-1]:T.border}`,
                        borderRadius:6,background:(selObj.zone||1)===z?ZONE_COLORS[z-1]+"22":"transparent",
                        cursor:"pointer",color:T.text,fontFamily:"var(--font-sans)"}}>Z{z}</button>
                  ))}
                </div>
              </>)}
            </>)}
            {selLine && (<>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2,color:T.text}}>{LT.find(l=>l.id===selLine.type)?.icon} {LT.find(l=>l.id===selLine.type)?.label||selLine.type}</div>
              <div style={{fontSize:11,color:T.text2,marginBottom:6}}>{selLine.points.length} segments{selLine.auto?" · Auto-generated":""}</div>
            </>)}
            <button onClick={delSelected} style={{width:"100%",padding:"7px",background:"#dc2626",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"var(--font-sans)",fontWeight:600}}>🗑 Delete</button>
          </div>
        )}
      </div>

      {/* ══════════ MAIN AREA ══════════ */}
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0, background:T.bg}}>

        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderBottom:`1px solid ${T.border}`,background:T.bg,flexShrink:0,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:T.text2,fontWeight:500}}>{cols}×{rows} · {fmtArea(cols*rows,cellM,metric)}</span>
          <div style={{flex:1}}/>

          {/* Grid scale */}
          <Tip text="Real-world size per cell. Smaller = more detail, larger = macro overview.">
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:11,color:T.text2,fontWeight:500}}>Grid</span>
              <select value={cellM} onChange={e=>setCellM(+e.target.value)} style={{...inputStyle,width:"auto",padding:"3px 7px",fontSize:11.5}}>
                <option value={0.1}>0.1m / 4in</option>
                <option value={0.25}>0.25m / 10in</option>
                <option value={0.5}>0.5m / 1.6ft</option>
                <option value={1}>1m / 3.3ft</option>
                <option value={2}>2m / 6.6ft</option>
                <option value={5}>5m / 16ft</option>
              </select>
            </div>
          </Tip>

          {/* m/ft toggle */}
          <div style={{display:"flex",border:`1px solid ${T.border}`,borderRadius:6,overflow:"hidden"}}>
            {[["m",true],["ft",false]].map(([lb,val])=>(
              <button key={lb} onClick={()=>setMetric(val)} style={{padding:"4px 10px",fontSize:12,border:"none",fontWeight:600,
                background:metric===val?"#2563eb":"transparent",
                color:metric===val?"#fff":T.text2,cursor:"pointer",fontFamily:"var(--font-sans)"}}>
                {lb}
              </button>
            ))}
          </div>

          {/* Grid toggle */}
          <Tip text="Show/hide grid lines">
            <button onClick={()=>setShowGrid(g=>!g)} style={{padding:"4px 10px",fontSize:12,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",background:showGrid?"#2563eb22":"transparent",color:showGrid?"#2563eb":T.text2,fontFamily:"var(--font-sans)",fontWeight:600}}>Grid</button>
          </Tip>
          {lotPlan && (
            <Tip text="Toggle lot boundary and house overlay from imported plot plan">
              <button onClick={()=>setShowLot(v=>!v)} style={{padding:"4px 10px",fontSize:12,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",background:showLot?"#ca8a0422":"transparent",color:showLot?"#ca8a04":T.text2,fontFamily:"var(--font-sans)",fontWeight:600}}>🗺 Lot</button>
            </Tip>
          )}

          {/* Zoom */}
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:11,color:T.text2,fontWeight:500}}>Zoom</span>
            <input type="range" min={0.3} max={3} step={0.1} value={zoom} onChange={e=>setZoom(+e.target.value)} style={{width:70}}/>
            <span style={{fontSize:11,color:T.text2,minWidth:32}}>{Math.round(zoom*100)}%</span>
          </div>

          <Tip text="Open the help guide">
            <button onClick={()=>setShowHelp(true)} style={{padding:"4px 10px",fontSize:12,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",background:"transparent",color:T.text,fontFamily:"var(--font-sans)"}}>Help</button>
          </Tip>
          <Tip text={isFS?"Exit fullscreen":"Enter fullscreen"}>
            <button onClick={toggleFS} style={{padding:"4px 10px",fontSize:12,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",background:"transparent",color:T.text,fontFamily:"var(--font-sans)"}}>{isFS?"⊡ Exit":"⛶ Full"}</button>
          </Tip>
          <button onClick={importDesign} style={{padding:"4px 10px",fontSize:12,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",background:"transparent",color:T.text,fontFamily:"var(--font-sans)"}}>📂 Import</button>
          <button onClick={()=>setShowPlotImport(true)} style={{padding:"4px 10px",fontSize:12,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",background:"transparent",color:T.text,fontFamily:"var(--font-sans)"}}>🗺 Plot Plan</button>
          <button onClick={exportDesign} style={{padding:"4px 12px",fontSize:12,border:"none",borderRadius:6,cursor:"pointer",background:"#2563eb",color:"#fff",fontFamily:"var(--font-sans)",fontWeight:600}}>💾 Export</button>
        </div>

        {/* Export fallback link — shown if programmatic download fails in sandboxed env */}
        {exportLink && (
          <div style={{padding:"6px 14px",background:"#1d4ed820",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <span style={{fontSize:12,color:T.text}}>Right-click and save:</span>
            <a href={exportLink.url} download={exportLink.filename}
              style={{fontSize:12,color:"#2563eb",fontWeight:600,textDecoration:"underline"}}>
              {exportLink.filename}
            </a>
            <button onClick={()=>setExportLink(null)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.text2}}>✕</button>
          </div>
        )}

        {/* Canvas area */}
        <div style={{flex:1,overflow:"auto",padding:20,background:T.canvas,position:"relative"}}>
          {hoverCell && (
            <div style={{position:"absolute",top:10,right:16,fontSize:11,color:T.text2,background:T.bg,padding:"3px 10px",borderRadius:5,border:`1px solid ${T.border}`,zIndex:10,pointerEvents:"none",fontWeight:500}}>
              {fmt(hoverCell.x,cellM,metric)}, {fmt(hoverCell.y,cellM,metric)}
            </div>
          )}
          <canvas ref={canvasRef}
            style={{display:"block", cursor: activeTool==="select"?"pointer":activeTool==="rect"?"crosshair":activeTool==="erase"?"cell":"crosshair", borderRadius:4}}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
            onDoubleClick={()=>{ if(isDrawingLine)finishLine(); }}/>
        </div>

        {/* Status bar */}
        <div style={{padding:"4px 14px",background:T.bg,borderTop:`1px solid ${T.border}`,display:"flex",gap:14,fontSize:11.5,color:T.text2,flexShrink:0,alignItems:"center"}}>
          <span>Tool: <strong style={{color:T.text}}>{TOOL_MAP[activeTool]?.label||activeTool}</strong>{(activeTool==="paint"||activeTool==="rect")&&<> · <span style={{color:T.text}}>{activeGround}</span></>}</span>
          <span>Objects: {objects.length} · Lines: {lines.length}</span>
          {isLineActive && <span style={{color:"#3b82f6"}}>Drag to draw · Double-click to finish · Select → click → Del to remove</span>}
          {activeTool==="rect" && <span style={{color:"#3b82f6"}}>Drag a rectangle to fill with <strong>{activeGround}</strong></span>}
          {activeTool==="select" && sel && <span style={{color:"#3b82f6"}}>Del removes selection · Esc deselects</span>}
          <div style={{flex:1}}/>
          <span style={{opacity:.5}}>Ctrl+Z · Ctrl+⇧+Z redo</span>
        </div>
      </div>

      {/* ══ AUTO IRRIGATE MODAL ══ */}
      {showAutoModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,overflow:"auto",padding:"20px 0"}}>
          <div style={{background:T.bg,borderRadius:16,width:560,maxWidth:"96vw",border:`1px solid ${T.border}`,color:T.text,boxShadow:"0 12px 48px rgba(0,0,0,.4)",display:"flex",flexDirection:"column",maxHeight:"90vh"}}>

            {/* Header */}
            <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${T.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:18,fontWeight:700}}>✨ Auto Irrigate</div>
                <div style={{fontSize:12.5,color:T.text2,marginTop:2}}>Automatically place sprinklers and draw irrigation pipes. Place a 🚰 Water Source first.</div>
              </div>
              <button onClick={()=>{setShowAutoModal(false);setAutoPreview(null);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.text2,padding:"2px 6px"}}>✕</button>
            </div>

            <div style={{overflowY:"auto",padding:"16px 22px",display:"flex",flexDirection:"column",gap:16}}>

              {/* ── Sprinkler Type Cards ── */}
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Sprinkler Type</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {SPRINKLER_TYPES.map(st=>{
                    const active = autoSprinklerType===st.id;
                    return (
                      <button key={st.id} onClick={()=>{
                        setAutoSprinklerType(st.id);
                        setAutoRadius(st.defaultRadiusFt);
                      }} style={{
                        textAlign:"left",padding:"12px 14px",
                        border:`2px solid ${active?st.color:T.border}`,
                        borderRadius:10,cursor:"pointer",
                        background:active?st.color+"18":T.sidebar,
                        color:T.text,transition:"all .15s",
                      }}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{width:12,height:12,borderRadius:"50%",background:st.color,flexShrink:0}}/>
                          <span style={{fontSize:13,fontWeight:700,color:active?st.color:T.text}}>{st.name}</span>
                        </div>
                        <div style={{fontSize:11.5,color:T.text2,lineHeight:1.5}}>{st.description}</div>
                        <div style={{marginTop:6,display:"flex",justifyContent:"space-between",fontSize:11}}>
                          <span style={{color:st.color,fontWeight:600}}>{metric?`${Math.round(st.minRadiusFt*0.3048)}–${Math.round(st.maxRadiusFt*0.3048)}m`:`${st.minRadiusFt}–${st.maxRadiusFt}ft`}</span>
                          <span style={{color:T.text2}}>{st.flow}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Radius slider with live coverage ── */}
              {(() => {
                const st = SPRINKLER_TYPES.find(t=>t.id===autoSprinklerType) || SPRINKLER_TYPES[1];
                const radiusCells = autoPreview?.radiusCells ?? Math.max(1, Math.round(autoRadius / (cellM * 3.28084)));
                const displayRadius = metric ? `${(autoRadius*0.3048).toFixed(1)}m` : `${autoRadius}ft`;
                return (
                  <div style={{background:T.sidebar,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text}}>
                        Spray Radius: {displayRadius} · {radiusCells} {radiusCells===1?"cell":"cells"}
                      </div>
                      {autoPreview && (
                        <div style={{
                          fontSize:13,fontWeight:700,padding:"3px 10px",borderRadius:20,
                          background: autoPreview.coverage.pct>=90?"#16a34a22":autoPreview.coverage.pct>=70?"#ca8a0422":"#dc262622",
                          color: autoPreview.coverage.pct>=90?"#16a34a":autoPreview.coverage.pct>=70?"#ca8a04":"#dc2626",
                          border:`1px solid ${autoPreview.coverage.pct>=90?"#16a34a":autoPreview.coverage.pct>=70?"#ca8a04":"#dc2626"}`,
                        }}>
                          {autoPreview.coverage.pct}% covered
                        </div>
                      )}
                    </div>
                    <input type="range"
                      min={st.minRadiusFt} max={st.maxRadiusFt} value={autoRadius} step={1}
                      onChange={e=>setAutoRadius(+e.target.value)}
                      style={{width:"100%",accentColor:st.color}}/>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.text2,marginTop:4}}>
                      <span>{metric?`${(st.minRadiusFt*0.3048).toFixed(0)}m`:`${st.minRadiusFt}ft`} — more heads, precise</span>
                      <span>fewer heads, wider reach — {metric?`${(st.maxRadiusFt*0.3048).toFixed(0)}m`:`${st.maxRadiusFt}ft`}</span>
                    </div>
                  </div>
                );
              })()}

              {/* ── Strategy ── */}
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Placement Strategy</div>
                <div style={{display:"flex",gap:8}}>
                  {[["full","⬛ Full Coverage","Optimal for any shape"],["perimeter","⬜ Perimeter Only","Efficient for simple lawns"]].map(([v,l,d])=>(
                    <button key={v} onClick={()=>setAutoMode(v)} style={{
                      flex:1,padding:"10px 12px",textAlign:"left",
                      border:`2px solid ${autoMode===v?"#2563eb":T.border}`,
                      borderRadius:9,cursor:"pointer",
                      background:autoMode===v?"#2563eb18":T.sidebar,
                      color:T.text,
                    }}>
                      <div style={{fontSize:13,fontWeight:600,color:autoMode===v?"#2563eb":T.text}}>{l}</div>
                      <div style={{fontSize:11.5,color:T.text2,marginTop:2}}>{d}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Live Preview Stats ── */}
              {autoPreview ? (
                <div style={{background:T.sidebar,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Live Preview</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
                    {[
                      ["Heads needed", autoPreview.sprinklers.length, SPRINKLER_TYPES.find(t=>t.id===autoSprinklerType)?.color||"#3b82f6"],
                      ["Grass cells", autoPreview.coverage.totalGrass, T.text],
                      ["Covered cells", autoPreview.coverage.coveredGrass, "#16a34a"],
                    ].map(([l,v,c])=>(
                      <div key={l} style={{textAlign:"center",padding:"8px",background:T.bg,borderRadius:7,border:`1px solid ${T.border}`}}>
                        <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
                        <div style={{fontSize:11,color:T.text2,marginTop:1}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Coverage bar */}
                  <div style={{marginBottom:4,display:"flex",justifyContent:"space-between",fontSize:12}}>
                    <span style={{color:T.text2}}>Coverage</span>
                    <span style={{fontWeight:700,color:autoPreview.coverage.pct>=90?"#16a34a":autoPreview.coverage.pct>=70?"#ca8a04":"#dc2626"}}>
                      {autoPreview.coverage.pct}%
                    </span>
                  </div>
                  <div style={{height:8,borderRadius:4,background:T.border,overflow:"hidden"}}>
                    <div style={{
                      height:"100%",borderRadius:4,transition:"width .3s",
                      width:`${autoPreview.coverage.pct}%`,
                      background:autoPreview.coverage.pct>=90?"#16a34a":autoPreview.coverage.pct>=70?"#ca8a04":"#dc2626",
                    }}/>
                  </div>
                  {autoPreview.coverage.pct < 85 && (
                    <div style={{marginTop:8,fontSize:12,color:"#ca8a04",display:"flex",gap:6,alignItems:"flex-start"}}>
                      <span>⚠️</span>
                      <span>Coverage below 85%. Try a larger spray radius or switch to Full Coverage strategy.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{background:T.sidebar,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`,fontSize:13,color:T.text2,textAlign:"center"}}>
                  Paint some grass on the canvas to see a live preview here.
                </div>
              )}

              {/* Last run result */}
              {autoResult && !autoPreview && (
                <div style={{background:T.sidebar,borderRadius:9,padding:"12px 14px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:".06em",marginBottom:7}}>Last Run</div>
                  {[["Sprinklers",autoResult.count],["Lines",autoResult.lineCount],["Coverage",`${autoResult.grassCells>0?Math.round(autoResult.covG/autoResult.grassCells*100):0}%`]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:2}}>
                      <span style={{color:T.text2}}>{l}</span>
                      <strong style={{color:T.text}}>{v}</strong>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,flexShrink:0}}>
              {modalBtn("Cancel", ()=>{setShowAutoModal(false);setAutoPreview(null);})}
              {modalBtn(`✨ Place ${autoPreview?autoPreview.sprinklers.length+" ":""}Sprinklers`, ()=>runAuto(autoMode,autoRadius,autoSprinklerType), true)}
            </div>
          </div>
        </div>
      )}

      {/* ══ PLOT PLAN IMPORT MODAL ══ */}
      {showPlotImport && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
          <div style={{background:T.bg,borderRadius:16,width:500,maxWidth:"96vw",border:`1px solid ${T.border}`,color:T.text,boxShadow:"0 12px 48px rgba(0,0,0,.4)"}}>
            <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:17,fontWeight:700}}>🗺 Import Plot Plan</div>
                <div style={{fontSize:12,color:T.text2,marginTop:2}}>Upload a PDF or image of your plot plan / site plan to auto-scale the grid and overlay your lot boundary and house footprint.</div>
              </div>
              <button onClick={()=>{setShowPlotImport(false);setPlotImportError("");}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.text2}}>✕</button>
            </div>
            <div style={{padding:"16px 20px 20px"}}>

              {/* Upload drop zone */}
              <label style={{
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:10,padding:"28px",border:`2px dashed ${T.border}`,borderRadius:12,cursor:"pointer",
                background:T.sidebar,transition:"border-color .15s",
              }}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#2563eb";}}
              onDragLeave={e=>{e.currentTarget.style.borderColor=T.border;}}
              onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.border;const f=e.dataTransfer.files[0];if(f)importPlotPlan(f);}}>
                <input type="file" accept=".pdf,image/*" style={{display:"none"}}
                  onChange={e=>{const f=e.target.files?.[0];if(f)importPlotPlan(f);e.target.value="";}}/>
                {plotImporting ? (
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:28,marginBottom:8}}>⏳</div>
                    <div style={{fontSize:14,fontWeight:600,color:T.text}}>Analysing plot plan…</div>
                    <div style={{fontSize:12,color:T.text2,marginTop:4}}>Claude is reading dimensions, scale, and lot shape</div>
                  </div>
                ) : (
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:8}}>📄</div>
                    <div style={{fontSize:14,fontWeight:600,color:T.text}}>Drop PDF or image here, or click to browse</div>
                    <div style={{fontSize:12,color:T.text2,marginTop:4}}>Supports PDF, PNG, JPG — plot plans from civil engineers, builders</div>
                  </div>
                )}
              </label>

              {plotImportError && (
                <div style={{marginTop:12,padding:"10px 14px",background:"#fee2e2",borderRadius:8,border:"1px solid #fca5a5",fontSize:12.5,color:"#991b1b",lineHeight:1.5}}>
                  ⚠️ {plotImportError}
                </div>
              )}

              {/* What it does */}
              <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
                {[
                  ["📐","Reads the scale notation","e.g. 1\"=20' and converts all dimensions to real feet or metres"],
                  ["🏠","Traces the house footprint","Places the house on your canvas as a locked overlay"],
                  ["🔲","Sets the grid to match the lot","Auto-configures grid size and cell scale for the exact lot dimensions"],
                  ["🌿","Leaves the yard area clear","You paint grass, concrete, and place sprinklers in the open space"],
                ].map(([icon,title,desc])=>(
                  <div key={title} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:18,minWidth:24,marginTop:1}}>{icon}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:T.text}}>{title}</div>
                      <div style={{fontSize:11.5,color:T.text2,lineHeight:1.4}}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Manual entry option */}
              <div style={{marginTop:16,padding:"12px 14px",background:T.sidebar,borderRadius:9,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:8}}>📝 Or enter dimensions manually</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["Lot width (ft)","lotW",56],["Lot depth (ft)","lotD",148],["House width (ft)","houseW",43],["House depth (ft)","houseH",44]].map(([label,key,def])=>(
                    <div key={key}>
                      <div style={{fontSize:11,color:T.text2,marginBottom:2}}>{label}</div>
                      <input type="number" defaultValue={def} id={`manual_${key}`}
                        style={{width:"100%",boxSizing:"border-box",padding:"4px 7px",border:`1px solid ${T.border}`,borderRadius:5,background:T.input,color:T.text,fontSize:12,fontFamily:"var(--font-sans)"}}/>
                    </div>
                  ))}
                </div>
                <button style={{marginTop:10,padding:"7px 14px",background:"#2563eb",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:12.5,fontFamily:"var(--font-sans)",fontWeight:600}}
                  onClick={()=>{
                    const g=id=>+document.getElementById(`manual_${id}`)?.value||0;
                    const lW=g("lotW")||56, lD=g("lotD")||148, hW=g("houseW")||43, hH=g("houseH")||44;
                    const plan={
                      yardName:"My Lot",lotAreaSF:Math.round(lW*lD),rearYardSF:Math.round(lW*(lD-hH-20)),
                      polygon:[[0,0],[lW,0],[lW,lD],[0,lD]],
                      house:{x:(lW-hW)/2, y:lD-hH-20, w:hW, h:hH},
                      footprintSF:Math.round(hW*hH),livingAreaSF:Math.round(hW*hH*0.75),
                      garageAreaSF:Math.round(hW*hH*0.25),
                    };
                    const niceCellFt=[1,2,3,4,5,6,8,10].reduce((b,v)=>Math.abs(v-Math.max(lW,lD)/28)<Math.abs(b-Math.max(lW,lD)/28)?v:b);
                    setCols(Math.ceil(lW/niceCellFt)+2);setRows(Math.ceil(lD/niceCellFt)+2);
                    setCellM(niceCellFt*0.3048);setMetric(false);
                    setYardName("My Lot");dispatch({type:"RESET"});setSel(null);
                    setLotPlan(plan);setShowLot(true);setShowPlotImport(false);
                  }}>
                  Apply Manual Dimensions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ SIZE MODAL ══ */}
      {showSizeModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
          <div style={{background:T.bg,borderRadius:14,padding:24,width:350,border:`1px solid ${T.border}`,color:T.text,boxShadow:"0 8px 40px rgba(0,0,0,.35)"}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>Set Yard Size</div>
            <p style={{fontSize:13,color:T.text2,margin:"0 0 16px",lineHeight:1.6}}>Choose dimensions and real-world scale. Applying this resets your design.</p>
            <div style={{display:"flex",gap:12,marginBottom:14}}>
              {[["Width (cols)",newCols,setNewCols],["Depth (rows)",newRows,setNewRows]].map(([label,val,setter])=>(
                <div key={label} style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.text2,marginBottom:4}}>{label}</div>
                  <input type="number" min={5} max={80} value={val} onChange={e=>setter(+e.target.value)} style={{...inputStyle}}/>
                  <div style={{fontSize:11,color:T.text2,marginTop:3}}>{fmt(val,newCellM,metric)}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text2,marginBottom:4}}>Cell size</div>
              <select value={newCellM} onChange={e=>setNewCellM(+e.target.value)} style={{...inputStyle}}>
                <option value={0.1}>0.1 m — micro detail</option>
                <option value={0.25}>0.25 m — fine detail</option>
                <option value={0.5}>0.5 m — standard</option>
                <option value={1}>1 m — large yard</option>
                <option value={2}>2 m — estate</option>
                <option value={5}>5 m — macro</option>
              </select>
              <div style={{fontSize:11.5,color:T.text2,marginTop:4}}>Total: {fmt(newCols,newCellM,metric)} × {fmt(newRows,newCellM,metric)} = {fmtArea(newCols*newRows,newCellM,metric)}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {modalBtn("Cancel",()=>setShowSizeModal(false))}
              {modalBtn("Apply",handleResize,true)}
            </div>
          </div>
        </div>
      )}

      {showHelp && <HelpModal onClose={()=>setShowHelp(false)} dark={dark}/>}

      {/* ══ MATERIALS MODAL ══ */}
      {showMaterials && (() => {
        const M = computeMaterials();
        const fmtL = (m) => metric ? `${m.toFixed(1)} m` : `${(m*3.28084).toFixed(1)} ft`;
        const fmtA = (cells) => metric ? `${Math.round(cells*M.cellMeters*M.cellMeters)} m²` : `${Math.round(cells*M.cellMeters*M.cellMeters*10.7639)} ft²`;
        const groundLabels = {grass:"Grass",dirt:"Bare Soil",concrete:"Concrete",gravel:"Gravel",mulch:"Mulch",sand:"Sand",pavers:"Pavers",decking:"Decking",turf:"Artif. Turf",pebbles:"Pebbles",water:"Pond"};
        const Row = ({icon,label,value,note,highlight}) => (
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:18,minWidth:24}}>{icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:highlight?"#2563eb":T.text}}>{label}</div>
              {note && <div style={{fontSize:11,color:T.text2,marginTop:1}}>{note}</div>}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:highlight?"#2563eb":T.text,minWidth:80,textAlign:"right"}}>{value}</div>
          </div>
        );
        const Sect = ({title}) => (
          <div style={{fontSize:11,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:".08em",marginTop:14,marginBottom:4}}>{title}</div>
        );
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
            <div style={{background:T.bg,borderRadius:16,width:520,maxWidth:"96vw",maxHeight:"90vh",display:"flex",flexDirection:"column",border:`1px solid ${T.border}`,boxShadow:"0 12px 48px rgba(0,0,0,.35)"}}>
              {/* Header */}
              <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <div>
                  <div style={{fontSize:17,fontWeight:700}}>🛒 Materials List</div>
                  <div style={{fontSize:12,color:T.text2,marginTop:2}}>Estimated quantities based on your current design. Add ~10% buffer for on-site adjustments.</div>
                </div>
                <button onClick={()=>setShowMaterials(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.text2}}>✕</button>
              </div>

              <div style={{overflowY:"auto",padding:"12px 20px 20px"}}>

                {/* ── Irrigation ── */}
                {(M.sprinklerCount > 0 || M.irrigPipe > 0 || M.dripPipe > 0) && <>
                  <Sect title="Irrigation"/>
                  {M.hasWS && <Row icon="🚰" label="Water source / tap connection" value="1 unit" note="Backflow preventer + timer recommended"/>}
                  {M.zones > 0 && <Row icon="🔧" label="Zone valve manifold" value={`${M.zones} zone${M.zones>1?"s":""}`} note="1 solenoid valve per irrigation zone"/>}
                  {M.sprinklerCount > 0 && <>
                    <Row icon="💧" label="Sprinkler heads" value={`${M.sprinklerCount} heads`}
                      note={M.sprinklersByZone.map((n,i)=>n>0?`Z${i+1}: ${n}`:"").filter(Boolean).join("  ·  ")} highlight/>
                    {M.emitters > 0 && <Row icon="💦" label="Drip emitters" value={`${M.emitters} emitters`} note="Low-flow precision emitters"/>}
                    {M.irrigPipe > 0 && <>
                      <Row icon="🔵" label={`PVC supply pipe (${metric?"18mm":"¾\""})`} value={fmtL(M.irrigPipe)} note="Includes 15% for bends & fittings" highlight/>
                      <Row icon="🔩" label="Elbow fittings" value={`≈${M.elbows}`} note="90° elbows for direction changes"/>
                      <Row icon="🔩" label="Tee fittings" value={`≈${M.tees}`} note="For branching to sprinkler heads"/>
                      <Row icon="🔩" label="End caps" value={`≈${M.endcaps}`} note="One per pipe run end"/>
                      <Row icon="🔩" label="Risers + head adapters" value={`${M.sprinklerCount} sets`} note="One riser + threaded adapter per head"/>
                    </>}
                    {M.dripPipe > 0 && <Row icon="🟢" label="Drip tubing" value={fmtL(M.dripPipe)} note="Includes 15% for routing + connections"/>}
                  </>}
                </>}

                {/* ── Ground surfaces ── */}
                {Object.keys(M.groundCounts).length > 0 && <>
                  <Sect title="Ground Surfaces (area to cover)"/>
                  {Object.entries(M.groundCounts).map(([g, cells]) => {
                    const areaStr = fmtA(cells);
                    const hints = {
                      grass:"Turf seed or sod",concrete:"Ready-mix concrete or pre-pour slabs",pavers:"Paving stones + levelling sand",
                      decking:"Decking boards + joists + fixings",gravel:"Decorative gravel (approx. 50mm deep)",
                      mulch:"Organic mulch (approx. 75mm deep)",sand:"Sand (approx. 50mm deep)",
                      turf:"Artificial turf roll + adhesive/pins",pebbles:"Decorative pebbles",water:"Pond liner or pool shell",dirt:""
                    };
                    if (!hints[g] && hints[g]!=="") return null;
                    return <Row key={g} icon={GT.find(t=>t.id===g)?.icon||"⬜"} label={groundLabels[g]||g} value={areaStr} note={hints[g]}/>;
                  })}
                </>}

                {/* ── Structures & boundaries ── */}
                {(M.fenceM > 0 || M.wallM > 0 || M.hedgeM > 0 || M.pathM > 0) && <>
                  <Sect title="Structures & Boundaries"/>
                  {M.fenceM > 0 && <Row icon="🪵" label="Fencing" value={fmtL(M.fenceM)} note="Timber, composite, or metal panels + posts"/>}
                  {M.wallM  > 0 && <Row icon="🧱" label="Wall material (retaining/boundary)" value={fmtL(M.wallM)} note="Blocks, bricks, or poured concrete"/>}
                  {M.hedgeM > 0 && <Row icon="🌳" label="Hedge plants" value={`≈${M.hedgePlants} plants`} note={`${fmtL(M.hedgeM)} of hedge at 0.5m spacing`}/>}
                  {M.pathM  > 0 && <Row icon="🛤" label="Path material" value={fmtL(M.pathM)} note="Pavers, gravel, or stepping stones"/>}
                </>}

                {/* ── Objects ── */}
                {objects.length > 0 && <>
                  <Sect title="Garden Objects"/>
                  {[["tree","🌲","Trees"],["shrub","🌿","Shrubs"],["flowerbed","🌸","Flower beds"],
                    ["raised_bed","🥬","Raised beds"],["light","💡","Garden lights"],
                    ["bench","🪑","Benches"],["firepit","🔥","Fire pits"],
                    ["gazebo","⛺","Gazebos/pergolas"],["shed","🏚","Sheds"],
                    ["pool","🏊","Pools"],["compost","♻","Compost bins"]
                  ].map(([type,icon,label])=>{
                    const n = objects.filter(o=>o.type===type).length;
                    if (!n) return null;
                    return <Row key={type} icon={icon} label={label} value={`${n} unit${n>1?"s":""}`}/>;
                  })}
                </>}

                {/* ── Disclaimer ── */}
                <div style={{marginTop:14,padding:"10px 12px",background:T.sidebar,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11.5,color:T.text2,lineHeight:1.6}}>
                  ⚠️ These are planning estimates only. Verify quantities with your installer or supplier before purchasing. Pipe sizing, pressure requirements, and local code compliance should be confirmed by a licensed irrigator.
                </div>
              </div>

              {/* Footer */}
              <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,flexShrink:0}}>
                <button onClick={()=>{
                  const M2=computeMaterials();
                  const fmtL2=(m)=>metric?`${m.toFixed(1)} m`:`${(m*3.28084).toFixed(1)} ft`;
                  const fmtA2=(c)=>metric?`${Math.round(c*M2.cellMeters*M2.cellMeters)} m²`:`${Math.round(c*M2.cellMeters*M2.cellMeters*10.7639)} ft²`;
                  const lines2=["GARDEN MATERIALS LIST","Generated by Backyard Planner","",`Project: ${yardName}`,`Date: ${new Date().toLocaleDateString()}`,""];
                  if(M2.sprinklerCount>0){lines2.push("── IRRIGATION ──");if(M2.hasWS)lines2.push("Water source: 1 unit");lines2.push(`Sprinkler heads: ${M2.sprinklerCount}`);if(M2.irrigPipe>0)lines2.push(`PVC pipe: ${fmtL2(M2.irrigPipe)} (incl. 15% waste)`);if(M2.elbows)lines2.push(`Elbows: ~${M2.elbows}`);if(M2.tees)lines2.push(`Tees: ~${M2.tees}`);if(M2.endcaps)lines2.push(`End caps: ~${M2.endcaps}`);}
                  const gl={grass:"Grass",dirt:"Bare Soil",concrete:"Concrete",gravel:"Gravel",mulch:"Mulch",sand:"Sand",pavers:"Pavers",decking:"Decking",turf:"Artif. Turf",pebbles:"Pebbles",water:"Pond"};
                  if(Object.keys(M2.groundCounts).length>0){lines2.push("");lines2.push("── GROUND SURFACES ──");Object.entries(M2.groundCounts).forEach(([g,c])=>lines2.push(`${gl[g]||g}: ${fmtA2(c)}`));}
                  if(M2.fenceM>0){lines2.push("");lines2.push("── STRUCTURES ──");lines2.push(`Fencing: ${fmtL2(M2.fenceM)}`)}
                  if(M2.wallM>0)lines2.push(`Wall: ${fmtL2(M2.wallM)}`);
                  if(M2.hedgePlants>0)lines2.push(`Hedge plants: ~${M2.hedgePlants}`);
                  lines2.push("");lines2.push("Note: Estimates only. Verify before purchasing.");
                  const blob=new Blob([lines2.join("\n")],{type:"text/plain"});
                  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${yardName.replace(/\s+/g,"_")}_materials.txt`;document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},400);
                }} style={{padding:"9px 16px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",fontSize:13,color:T.text,fontFamily:"var(--font-sans)"}}>
                  📄 Export as Text
                </button>
                <div style={{flex:1}}/>
                {modalBtn("Close", ()=>setShowMaterials(false), true)}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
