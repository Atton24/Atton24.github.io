/* ═══════════════════════════════════════════════════════════════════════════
   PATCH · MAIN PLANNER
   The BackyardPlanner React component — sidebar, canvas, toolbar, status bar.
═══════════════════════════════════════════════════════════════════════════ */

const { useState, useRef, useEffect, useCallback, useReducer, useMemo } = React;

function BackyardPlanner() {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);

  // ── Starter content ──
  const STARTER = useMemo(() => makeStarterYard(20, 15), []);
  const [hist, dispatch] = useReducer(histReducer, {
    ground: STARTER.ground, objects: STARTER.objects, lines: STARTER.lines,
    past: [], future: [],
  });
  const { ground, objects, lines } = hist;

  // ── Yard config ──
  const [cols, setCols]     = useState(D_COLS);
  const [rows, setRows]     = useState(D_ROWS);
  const [cellM, setCellM]   = useState(0.5);
  const [metric, setMetric] = useState(true);
  const [dark, setDark]     = useState(false);

  // ── Tooling ──
  const [activeTool, setActiveTool]     = useState("paint");
  const [activeGround, setActiveGround] = useState("grass");
  const [sel, setSel] = useState(null);

  // Line drawing
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [currentLine, setCurrentLine]     = useState(null);

  // Rect fill
  const [rectStart, setRectStart] = useState(null);
  const [rectEnd, setRectEnd]     = useState(null);
  const [rectDragging, setRectDragging] = useState(false);

  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Modal state
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showHelp, setShowHelp]           = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPlotImport, setShowPlotImport] = useState(false);

  const [yardName, setYardName] = useState("My Garden");

  // Tool params
  const [sprinklerR, setSprinklerR] = useState(3);
  const [sprinklerType, setSprinklerType] = useState("popup_spray");
  const [objSize, setObjSize]       = useState(1);
  const [activeZone, setActiveZone] = useState(1);
  const [hoverCell, setHoverCell]   = useState(null);
  const [isFS, setIsFS] = useState(false);

  // Auto irrigate state
  const [autoResult, setAutoResult] = useState(null);
  const [autoMode, setAutoMode]     = useState("full");
  const [autoSprinklerType, setAutoSprinklerType] = useState("popup_spray");
  const [autoRadius, setAutoRadius] = useState(12);
  const [autoPreview, setAutoPreview] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("ground");

  // Lot overlay
  const [lotPlan, setLotPlan] = useState(null);
  const [showLot, setShowLot] = useState(true);

  // Toast
  const [toast, setToast] = useState(null);
  useEffect(() => { if (toast) { const t = setTimeout(()=>setToast(null), 3200); return ()=>clearTimeout(t); } }, [toast]);

  const isDragging = useRef(false);
  const lastCell   = useRef(null);

  const push = useCallback(p => dispatch({type:"PUSH", p}), []);
  const undo = () => dispatch({type:"UNDO"});
  const redo = () => dispatch({type:"REDO"});

  const cs = BASE_CS * zoom;
  const T = dark ? THEME_DARK : THEME_LIGHT;

  // Apply theme class to body for scrollbars
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    document.body.style.background = T.bg;
  }, [dark]);

  /* ─── CANVAS DRAW ──────────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = cols * cs;
    canvas.height = rows * cs;

    ctx.fillStyle = T.canvasInk;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Ground tiles
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const g = ground[`${c},${r}`];
      if (g && GP[g]) GP[g](ctx, c*cs, r*cs, cs);
    }

    // Grid
    if (showGrid) {
      ctx.strokeStyle = dark ? "rgba(255,255,255,.06)" : "rgba(40,30,10,.10)";
      ctx.lineWidth = 0.5;
      for (let c=0; c<=cols; c++) { ctx.beginPath(); ctx.moveTo(c*cs,0); ctx.lineTo(c*cs,rows*cs); ctx.stroke(); }
      for (let r=0; r<=rows; r++) { ctx.beginPath(); ctx.moveTo(0,r*cs); ctx.lineTo(cols*cs,r*cs); ctx.stroke(); }

      // Distance labels every 5 cells
      ctx.fillStyle = dark ? "rgba(255,255,255,.35)" : "rgba(40,30,10,.4)";
      ctx.font = `${Math.max(9, 10*zoom)}px var(--font-mono, monospace)`;
      ctx.textAlign = "left";
      for (let c=5; c<cols; c+=5) ctx.fillText(fmt(c,cellM,metric), c*cs+4, 12);
      for (let r=5; r<rows; r+=5) ctx.fillText(fmt(r,cellM,metric), 4, r*cs+12);
    }

    // Lines
    lines.forEach((l,i) => drawLine(ctx, l, cs, sel?.kind==="line" && sel?.idx===i, dark));
    if (currentLine && currentLine.points.length > 0) drawLine(ctx, currentLine, cs, false, dark);

    // Objects
    objects.forEach((o,i) => drawObj(ctx, o, cs, sel?.kind==="object" && sel?.idx===i, dark));

    // Hover highlight
    if (hoverCell && (activeTool==="paint" || activeTool==="erase")) {
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(hoverCell.x*cs, hoverCell.y*cs, cs, cs);
      ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hoverCell.x*cs+1, hoverCell.y*cs+1, cs-2, cs-2);
    }

    // Rect preview
    if (activeTool==="rect" && rectStart && rectEnd) {
      const x1=Math.min(rectStart.x,rectEnd.x), y1=Math.min(rectStart.y,rectEnd.y);
      const x2=Math.max(rectStart.x,rectEnd.x), y2=Math.max(rectStart.y,rectEnd.y);
      const c = GROUND_COLORS[activeGround] || "#88aaff";
      ctx.fillStyle = c + "55";
      ctx.fillRect(x1*cs, y1*cs, (x2-x1+1)*cs, (y2-y1+1)*cs);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.setLineDash([6,4]);
      ctx.strokeRect(x1*cs+1, y1*cs+1, (x2-x1+1)*cs-2, (y2-y1+1)*cs-2);
      ctx.setLineDash([]);
      const w=x2-x1+1, h=y2-y1+1;
      const txt = `${w}×${h}  ·  ${fmtArea(w*h, cellM, metric)}`;
      ctx.font = "bold 11.5px var(--font-mono, monospace)";
      const tw = ctx.measureText(txt).width + 16;
      const tx = (x1+x2+1)/2*cs;
      const ty = (y1+y2+1)/2*cs;
      ctx.fillStyle = dark ? "rgba(0,0,0,.78)" : "rgba(0,0,0,.7)";
      ctx.beginPath(); ctx.roundRect(tx-tw/2, ty-10, tw, 22, 11); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, tx, ty+1);
    }

    // Selection ring on objects
    if (sel?.kind==="object") {
      const o = objects[sel.idx];
      if (o) {
        ctx.strokeStyle = T.primary;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5,3]);
        ctx.beginPath();
        ctx.roundRect(o.x*cs-3, o.y*cs-3, cs+6, cs+6, 6);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Lot overlay
    if (lotPlan && showLot) {
      const ftPerCell = cellM * 3.28084;
      const ptC = (fx, fy) => [fx / ftPerCell * cs, fy / ftPerCell * cs];

      if (lotPlan.polygon && lotPlan.polygon.length >= 3) {
        ctx.beginPath();
        const [px0, py0] = ptC(lotPlan.polygon[0][0], lotPlan.polygon[0][1]);
        ctx.moveTo(px0, py0);
        lotPlan.polygon.slice(1).forEach(([fx, fy]) => {
          const [px, py] = ptC(fx, fy); ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.strokeStyle = T.accent;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = hexToRgba(T.accent, 0.04);
        ctx.fill();
      }
      if (lotPlan.house) {
        const h = lotPlan.house;
        const [hx, hy] = ptC(h.x, h.y);
        const hw = h.w / ftPerCell * cs;
        const hh = h.h / ftPerCell * cs;
        ctx.fillStyle = dark ? "rgba(148,163,184,.28)" : "rgba(120,130,140,.22)";
        ctx.fillRect(hx, hy, hw, hh);
        ctx.strokeStyle = dark ? "rgba(180,200,220,.85)" : "rgba(80,90,100,.9)";
        ctx.lineWidth = 2;
        ctx.strokeRect(hx, hy, hw, hh);
        ctx.fillStyle = dark ? "rgba(230,235,240,.95)" : "rgba(60,70,80,.95)";
        ctx.font = `700 ${Math.max(10, Math.min(15, hw/6))}px var(--font-sans, sans-serif)`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("HOUSE", hx + hw/2, hy + hh/2 - 7);
        if (lotPlan.livingAreaSF) {
          ctx.font = `500 ${Math.max(9, Math.min(12, hw/8))}px var(--font-mono, monospace)`;
          ctx.fillText(`${lotPlan.livingAreaSF.toLocaleString()} ft²`, hx + hw/2, hy + hh/2 + 9);
        }
      }
    }
  }, [cols, rows, ground, objects, lines, currentLine, showGrid, cs, sel, hoverCell, dark, cellM, metric, zoom, activeTool, activeGround, rectStart, rectEnd, lotPlan, showLot, T]);

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

    if (LT.find(t=>t.id===activeTool)) {
      setIsDrawingLine(true);
      setCurrentLine({type:activeTool, points:[cell]});
      return;
    }
    if (activeTool === "rect") {
      setRectStart(cell); setRectEnd(cell); setRectDragging(true);
      isDragging.current = true;
      return;
    }
    if (OT.find(t=>t.id===activeTool)) {
      if (objects.find(o=>o.x===cell.x&&o.y===cell.y&&o.type===activeTool)) return;
      if (activeTool==="watersource" && objects.some(o=>o.type==="watersource")) {
        setToast({type:"warn", msg:"Only one Water Source allowed — delete the existing one first."});
        return;
      }
      push({ground, objects:[...objects,{
        x:cell.x, y:cell.y, type:activeTool, size:objSize,
        ...(activeTool==="sprinkler"?{
          radius:sprinklerR, zone:activeZone,
          sprinklerType,
          sprinklerColor: SPRINKLER_TYPES.find(t=>t.id===sprinklerType)?.color,
        }:{}),
        ...(activeTool==="drip_emitter"?{radius:1.5}:{}),
        ...(activeTool==="house"?{width:Math.min(10, cols-cell.x-1), depth:Math.min(8, rows-cell.y-1)}:{}),
      }], lines});
      if (activeTool==="house") setToast({type:"info", msg:"House placed. Switch to Select to resize via the properties panel."});
      return;
    }
    if (activeTool === "select") {
      // Try exact-cell hit first
      let oi = objects.findIndex(o=>o.x===cell.x&&o.y===cell.y);
      // For house objects, allow clicking anywhere inside the footprint
      if (oi < 0) {
        oi = objects.findIndex(o => o.type==="house"
          && cell.x >= o.x && cell.x < o.x + (o.width||8)
          && cell.y >= o.y && cell.y < o.y + (o.depth||6));
      }
      if (oi>=0) { setSel({kind:"object",idx:oi}); return; }
      const li = lines.findIndex(l=>l.points.some(p=>Math.abs(p.x-cell.x)<=1&&Math.abs(p.y-cell.y)<=1));
      setSel(li>=0 ? {kind:"line",idx:li} : null);
      return;
    }
    isDragging.current = true;
    lastCell.current = cell;
    applyCell(cell, ground, objects, lines);
  };

  const handleMouseMove = e => {
    const cell = getCell(e);
    setHoverCell(cell);
    if (!cell) return;
    if (activeTool==="rect" && rectDragging) { setRectEnd(cell); return; }
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

  const handleMouseUp = () => {
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
      // Ignore keys when user is typing in an input/textarea
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key==="Delete"||e.key==="Backspace") && sel) { e.preventDefault(); delSelected(); }
      if (e.key==="z"&&(e.ctrlKey||e.metaKey)&&!e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key==="z"&&e.shiftKey&&(e.ctrlKey||e.metaKey))||(e.key==="y"&&(e.ctrlKey||e.metaKey))) { e.preventDefault(); redo(); }
      if (e.key==="Escape") setSel(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sel, delSelected]);

  /* ─── AUTO IRRIGATE ─── */
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

  useEffect(() => {
    if (showAutoModal) computeAutoPreview(autoMode, autoRadius, autoSprinklerType);
  }, [showAutoModal, autoMode, autoRadius, autoSprinklerType, computeAutoPreview]);

  const runAuto = () => {
    const ws = objects.find(o=>o.type==="watersource");
    if (!ws) {
      setToast({type:"warn", msg:"Place a Water Source (tap) first — it's the start point for pipes."});
      return;
    }
    const comps = grassComponents(ground, cols, rows);
    if (!comps.length) {
      setToast({type:"warn", msg:"No grass found. Paint some lawn, then run Auto Irrigate."});
      return;
    }
    const st = SPRINKLER_TYPES.find(t=>t.id===autoSprinklerType) || SPRINKLER_TYPES[1];
    const radiusCells = Math.max(1, Math.round(autoRadius / (cellM * 3.28084)));
    const overlapFactor = st.overlap ? 0.5 : 0.9;
    const allS = [];
    comps.forEach((comp, ci) => {
      const usePerim = autoMode==="perimeter" || comp.length<=16;
      placeSprinklers(comp, radiusCells, usePerim, overlapFactor).forEach(s => allS.push({...s, zone:(ci%3)+1}));
    });
    const manualObjs  = objects.filter(o=>!(o.type==="sprinkler"&&o.auto));
    const manualLines = lines.filter(l=>!l.auto);
    const newObjs  = [...manualObjs, ...allS.map(s=>({
      x:s.x, y:s.y, type:"sprinkler", size:1, radius:radiusCells, auto:true, zone:s.zone,
      sprinklerType:autoSprinklerType, sprinklerColor: st.color,
    }))];
    const nodes = [ws, ...allS];
    const edges = primMST(nodes);
    const newLines = [...manualLines, ...edges.map(([a,b])=>({type:"irrigation",points:lPath(nodes[a],nodes[b]),auto:true}))];
    const grassSet = new Set(Object.entries(ground).filter(([,v])=>v==="grass").map(([k])=>k));
    const coverage = computeCoverage(allS, radiusCells, grassSet);
    push({ground, objects:newObjs, lines:newLines});
    setAutoResult({count:allS.length, lineCount:edges.length, pct:coverage.pct});
    setToast({type:"success", msg:`Placed ${allS.length} sprinklers · ${coverage.pct}% coverage · ${edges.length} pipes drawn.`});
    setAutoPreview(null);
    setShowAutoModal(false);
  };

  /* ─── YARD SETUP / RESIZE ─── */
  const applyYardSetup = ({cols:nc, rows:nr, cellM:ncm, preserveLot, preserveDesign}) => {
    const oldCellM = cellM;
    setCols(nc); setRows(nr); setCellM(ncm);
    if (preserveDesign) {
      // Rescale ground/objects/lines to remain at the same real-world positions
      const rescaled = rescaleDesign({ground, objects, lines}, oldCellM, ncm);
      dispatch({type:"LOAD", p: rescaled});
    } else {
      dispatch({type:"RESET"});
    }
    setSel(null);
    if (!preserveLot) setLotPlan(null);
    setShowSizeModal(false);
    setToast({type:"info",
      msg: preserveDesign
        ? `Grid rescaled to ${nc}×${nr} at ${(ncm*3.28084).toFixed(2)} ft/cell. Design preserved.`
        : preserveLot
          ? `Grid rescaled to ${nc}×${nr}. Lot preserved, design cleared.`
          : `Yard resized to ${nc}×${nr} · ${fmtArea(nc*nr, ncm, metric)}. Canvas cleared.`,
    });
  };

  /* ─── PLOT PLAN APPLY ─── */
  const applyPlotPlan = (plan) => {
    const lW = plan.lotWidthFt, lD = plan.lotDepthFt;
    const niceCellFt = [1,2,3,4,5,6,8,10].reduce((b,v) =>
      Math.abs(v - Math.max(lW,lD)/28) < Math.abs(b - Math.max(lW,lD)/28) ? v : b);
    const niceCellM = niceCellFt * 0.3048;
    const newC = Math.ceil(lW/niceCellFt) + 2;
    const newR = Math.ceil(lD/niceCellFt) + 2;
    setCols(newC); setRows(newR); setCellM(niceCellM); setMetric(false);
    setYardName(plan.yardName || plan.address || "My Lot");
    // Generate fence lines for chosen sides
    const fences = plan.fenceSides && plan.fenceSides.length
      ? lotFenceLines(plan, niceCellM, plan.fenceSides)
      : [];
    dispatch({type:"LOAD", p:{ground:{}, objects:[], lines:fences}});
    setSel(null);
    setLotPlan(plan);
    setShowLot(true);
    setShowPlotImport(false);
    setToast({type:"success", msg:`Lot loaded: ${plan.lotWidthFt}×${plan.lotDepthFt}ft · ${plan.lotAreaSF.toLocaleString()} ft²${fences.length?` · ${fences.length} fence sides`:""}.`});
  };

  /* ─── EXPORT / IMPORT ─── */
  const exportDesign = () => {
    const d = {yardName, cols, rows, cellM, metric, ground, objects, lines, lotPlan, version:5};
    const json = JSON.stringify(d, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.href = dataUri; a.download = `${yardName.replace(/\s+/g,"_") || "garden"}.json`;
    a.style.display = "none"; document.body.appendChild(a); a.click();
    setTimeout(()=>document.body.removeChild(a), 500);
    setToast({type:"success", msg:`Exported ${a.download}.`});
  };
  const importDesign = () => {
    const i = document.createElement("input"); i.type="file"; i.accept=".json";
    i.onchange = e => {
      const f=e.target.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload = ev => {
        try {
          const d=JSON.parse(ev.target.result);
          setYardName(d.yardName||"My Garden");
          setCols(d.cols||D_COLS); setRows(d.rows||D_ROWS); setCellM(d.cellM||0.5);
          if(d.metric!==undefined) setMetric(d.metric);
          dispatch({type:"LOAD", p:{ground:d.ground||{}, objects:d.objects||[], lines:d.lines||[]}});
          if(d.lotPlan){setLotPlan(d.lotPlan);setShowLot(true);} else setLotPlan(null);
          setSel(null);
          setToast({type:"success", msg:`Imported ${f.name}.`});
        } catch { setToast({type:"warn", msg:"Invalid file format."}); }
      };
      r.readAsText(f);
    };
    i.click();
  };
  const clearAll = () => {
    if (!confirm("Clear the entire design? This can't be undone.")) return;
    dispatch({type:"RESET"}); setSel(null); setLotPlan(null);
  };
  const loadStarter = () => {
    const s = makeStarterYard(cols, rows);
    dispatch({type:"LOAD", p:s});
    setSel(null);
    setToast({type:"info", msg:"Loaded the sample yard."});
  };

  /* ─── STATS ─── */
  const grassCount = Object.values(ground).filter(g=>g==="grass").length;
  const hardCount  = Object.values(ground).filter(g=>["concrete","pavers","decking"].includes(g)).length;

  /* ─── SELECTED ─── */
  const selObj  = sel?.kind==="object" ? objects[sel.idx]  : null;
  const selLine = sel?.kind==="line"   ? lines[sel.idx]    : null;

  /* ─── TOOL BUTTON ─── */
  const ToolBtn = ({id, label, tip}) => {
    const active = activeTool===id;
    const iconName = TOOL_ICON[id] || "leaf";
    return (
      <Tip text={tip||label}>
        <button onClick={()=>{
          setActiveTool(id);
          if (GROUND_IDS.includes(id)) setActiveGround(id);
        }} style={{
          display:"flex", alignItems:"center", gap:10, padding:"8px 11px",
          width:"100%", textAlign:"left", cursor:"pointer",
          background: active ? T.primary : "transparent",
          color: active ? "#fff" : T.text,
          border: `1px solid ${active ? T.primary : "transparent"}`,
          borderRadius:10, fontSize:13, fontFamily:"var(--font-sans)",
          transition:"all .12s", fontWeight: active?600:500,
        }}>
          <Icon name={iconName} size={17} color={active?"#fff":T.text2}/>
          <span>{label}</span>
        </button>
      </Tip>
    );
  };

  const sizeToolSet = ["sprinkler","tree","shrub","flowerbed","raised_bed","gazebo","shed","pool","drip_emitter"];
  const isLineActive = LT.find(t=>t.id===activeTool);

  const inputStyle = {
    background: T.input, color: T.text,
    border: `1px solid ${T.border}`,
    borderRadius: 9, padding:"7px 10px",
    fontFamily:"var(--font-sans)", fontSize:13,
    width:"100%", boxSizing:"border-box", outline:"none",
  };

  /* ─── RENDER ──────────────────────────────────────────────────────── */
  return (
    <div ref={containerRef} style={{
      display:"flex", height:"100vh", minHeight:520, overflow:"hidden",
      fontFamily:"var(--font-sans)", background:T.bg, color:T.text,
    }}>

      {/* ════════════════════ SIDEBAR ════════════════════ */}
      <aside style={{
        width:248, minWidth:248, background:T.sidebar,
        borderRight:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0,
      }}>
        {/* Brand header */}
        <div style={{padding:"16px 16px 12px", borderBottom:`1px solid ${T.borderSoft}`, flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{
              width:34,height:34,borderRadius:11,
              background:`linear-gradient(135deg, ${T.primary}, ${T.primaryDk})`,
              display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
              boxShadow:`0 2px 8px ${hexToRgba(T.primary,.3)}`,
            }}>
              <Icon name="leaf" size={20}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"var(--font-serif)",fontSize:22,letterSpacing:".4px",lineHeight:1,color:T.text}}>Patch</div>
              <div style={{fontSize:10.5,color:T.text3,letterSpacing:".1em",textTransform:"uppercase",fontWeight:600,marginTop:2}}>Backyard Planner</div>
            </div>
            <Tip text={dark?"Light mode":"Dark mode"}>
              <button onClick={()=>setDark(d=>!d)} style={{
                background:"transparent", border:`1px solid ${T.border}`, borderRadius:9,
                cursor:"pointer", padding:"5px 7px", color:T.text2, lineHeight:0,
              }}>
                <Icon name={dark?"sun":"moon"} size={15}/>
              </button>
            </Tip>
          </div>
          <input value={yardName} onChange={e=>setYardName(e.target.value)}
            placeholder="Garden name…"
            style={{...inputStyle, fontWeight:600, fontSize:13.5}}/>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",padding:"6px 8px 0",gap:2,borderBottom:`1px solid ${T.borderSoft}`,flexShrink:0,background:T.sidebar}}>
          {[
            ["ground",  "leaf",  "Ground"],
            ["objects", "tree",  "Objects"],
            ["lines",   "pipe",  "Lines"],
            ["tools",   "select","Tools"],
          ].map(([tab,ico,label])=>{
            const active = activeTab===tab;
            return (
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{
                flex:1, padding:"8px 6px 9px", border:"none", cursor:"pointer",
                background:"transparent",
                borderBottom: `2px solid ${active ? T.primary : "transparent"}`,
                color: active ? T.primary : T.text2,
                display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                fontFamily:"var(--font-sans)",
                transition:"all .12s",
              }}>
                <Icon name={ico} size={17} color={active?T.primary:T.text2}/>
                <span style={{fontSize:10.5,fontWeight:active?700:500,letterSpacing:".03em"}}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tool list */}
        <div style={{flex:1, overflowY:"auto", padding:"12px 12px"}}>

          {/* GROUND TAB */}
          {activeTab==="ground" && (<>
            <SectionLabel T={T}>Paint Mode</SectionLabel>
            <div style={{display:"flex", gap:4, marginBottom:14, padding:4, background:T.bg, borderRadius:11, border:`1px solid ${T.borderSoft}`}}>
              {[
                ["paint","paint","Freehand", "Click and drag freehand"],
                ["rect","rect","Rectangle", "Drag a rectangle to fill an area"],
              ].map(([id,ic,lb,tip])=>{
                const active = activeTool===id;
                return (
                  <Tip key={id} text={tip}>
                    <button onClick={()=>setActiveTool(id)} style={{
                      flex:1, padding:"7px 6px", fontSize:12, fontWeight:600, border:"none",
                      borderRadius:8, cursor:"pointer", fontFamily:"var(--font-sans)",
                      background: active ? T.primary : "transparent",
                      color: active ? "#fff" : T.text2,
                      display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
                      boxShadow: active ? `0 1px 4px ${hexToRgba(T.primary,.35)}` : "none",
                      transition:"all .12s",
                    }}>
                      <Icon name={ic} size={14}/> {lb}
                    </button>
                  </Tip>
                );
              })}
            </div>

            <SectionLabel T={T}>Ground Type</SectionLabel>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
              {GT.map(t=>{
                const active = activeGround===t.id && (activeTool==="paint"||activeTool==="rect");
                return (
                  <Tip key={t.id} text={t.tip}>
                    <button onClick={()=>{ setActiveGround(t.id); if(activeTool!=="rect")setActiveTool("paint"); }}
                      style={{
                        display:"flex", alignItems:"center", gap:7, padding:"7px 9px",
                        border:`1.5px solid ${active ? T.primary : T.border}`,
                        borderRadius:10, cursor:"pointer",
                        background: active ? T.primaryBg : T.bg,
                        color: T.text, fontSize:12, fontFamily:"var(--font-sans)",
                        transition:"all .12s",
                      }}>
                      <div style={{width:16,height:16,borderRadius:5,background:t.swatch,flexShrink:0,
                                   boxShadow:`inset 0 0 0 1px ${hexToRgba("#000", .1)}`}}/>
                      <span style={{fontWeight:active?700:500,fontSize:11.5,color:active?T.primary:T.text}}>{t.label}</span>
                    </button>
                  </Tip>
                );
              })}
            </div>
          </>)}

          {/* OBJECTS TAB */}
          {activeTab==="objects" && (<>
            <SectionLabel T={T}>Irrigation Zone</SectionLabel>
            <div style={{display:"flex", gap:4, marginBottom:14, padding:4, background:T.bg, borderRadius:11, border:`1px solid ${T.borderSoft}`}}>
              {[1,2,3].map(z=>{
                const c = ZONE_COLORS[z-1];
                const active = activeZone===z;
                return (
                  <Tip key={z} text={`Zone ${z} — ${ZONE_NAMES[z-1]} · separate timer schedule`}>
                    <button onClick={()=>setActiveZone(z)} style={{
                      flex:1, padding:"7px 6px", fontSize:12.5, fontWeight:700,
                      border:"none", borderRadius:8,
                      background: active ? c : "transparent",
                      color: active ? "#fff" : c,
                      cursor:"pointer", fontFamily:"var(--font-sans)",
                      display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
                      transition:"all .12s",
                    }}>
                      <span style={{width:9,height:9,borderRadius:"50%",background:active?"#fff":c}}/>
                      Z{z}
                    </button>
                  </Tip>
                );
              })}
            </div>

            <SectionLabel T={T}>Place Object</SectionLabel>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {OT.map(t=><ToolBtn key={t.id} {...t}/>)}
            </div>
          </>)}

          {/* LINES TAB */}
          {activeTab==="lines" && (<>
            <SectionLabel T={T}>Draw Line</SectionLabel>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {LT.map(t=><ToolBtn key={t.id} {...t}/>)}
            </div>
            <div style={{marginTop:14, padding:"11px 13px", background:T.bg, borderRadius:11, border:`1px solid ${T.borderSoft}`, fontSize:11.5, color:T.text2, lineHeight:1.65}}>
              Drag to draw. Release or double-click to finish. Switch to <strong style={{color:T.text}}>Select</strong>, click a line, then <kbd>Del</kbd> to remove.
            </div>
          </>)}

          {/* TOOLS TAB */}
          {activeTab==="tools" && (<>
            <SectionLabel T={T}>Edit</SectionLabel>
            <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:14}}>
              {UT.map(t=><ToolBtn key={t.id} {...t}/>)}
            </div>

            <SectionLabel T={T}>Smart Tools</SectionLabel>
            <Tip text="Automatically place sprinklers across grass and connect them to your Water Source.">
              <button onClick={()=>setShowAutoModal(true)} style={{
                display:"flex", alignItems:"center", gap:9, padding:"10px 12px",
                width:"100%", color:"#fff",
                background:`linear-gradient(135deg, ${T.primary}, ${T.primaryDk})`,
                border:"none", borderRadius:11, cursor:"pointer",
                fontSize:13, fontFamily:"var(--font-sans)", fontWeight:600,
                boxShadow:`0 2px 10px ${hexToRgba(T.primary,.3)}`,
                marginBottom:6,
              }}>
                <Icon name="sparkle" size={17}/> Auto Irrigate
              </button>
            </Tip>
            <Tip text="Generate a shopping list of pipe, fittings, sprinklers, and ground cover.">
              <button onClick={()=>setShowMaterials(true)} style={{
                display:"flex", alignItems:"center", gap:9, padding:"9px 12px",
                width:"100%", color:T.text, background:"transparent",
                border:`1px solid ${T.border}`, borderRadius:11, cursor:"pointer",
                fontSize:13, fontFamily:"var(--font-sans)", fontWeight:500,
              }}>
                <Icon name="shop" size={16} color={T.text2}/> Materials List
              </button>
            </Tip>

            <div style={{height:1,background:T.borderSoft,margin:"14px 0"}}/>
            <SectionLabel T={T}>Yard</SectionLabel>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <button onClick={()=>setShowSizeModal(true)} style={btnGhost(T)}>
                <Icon name="size" size={16} color={T.text2}/> Yard Setup
              </button>
              <button onClick={()=>setShowPlotImport(true)} style={btnGhost(T)}>
                <Icon name="map" size={16} color={T.text2}/> Import Plot Plan
              </button>
              <button onClick={loadStarter} style={btnGhost(T)}>
                <Icon name="leaf" size={16} color={T.text2}/> Load Sample Yard
              </button>
            </div>

            <div style={{height:1,background:T.borderSoft,margin:"14px 0"}}/>
            <div style={{display:"flex", gap:5}}>
              <Tip text="Undo (Cmd/Ctrl+Z)">
                <button onClick={undo} disabled={!hist.past.length} style={btnGhost(T, !hist.past.length, true)}>
                  <Icon name="undo" size={15}/> {hist.past.length || ""}
                </button>
              </Tip>
              <Tip text="Redo (Cmd/Ctrl+Shift+Z)">
                <button onClick={redo} disabled={!hist.future.length} style={btnGhost(T, !hist.future.length, true)}>
                  <Icon name="redo" size={15}/>
                </button>
              </Tip>
            </div>
            <button onClick={clearAll} style={{
              marginTop:6,display:"flex",alignItems:"center",gap:9,padding:"9px 12px",
              width:"100%",color:T.danger,background:"transparent",
              border:`1px solid ${hexToRgba(T.danger,.35)}`, borderRadius:11,
              cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"var(--font-sans)",
            }}>
              <Icon name="trash" size={15}/> Clear All
            </button>
          </>)}
        </div>

        {/* Tool options (radius / size) */}
        {sizeToolSet.includes(activeTool) && (
          <div style={{padding:"11px 14px", borderTop:`1px solid ${T.borderSoft}`, flexShrink:0, background:T.bg}}>
            {activeTool==="sprinkler" && (() => {
              const ftPerCell = cellM * 3.28084;
              const stype = SPRINKLER_TYPES.find(t=>t.id===sprinklerType) || SPRINKLER_TYPES[1];
              const minCells = Math.max(1, Math.round(stype.minRadiusFt / ftPerCell));
              const maxCells = Math.max(minCells+1, Math.round(stype.maxRadiusFt / ftPerCell));
              const safeR = Math.min(Math.max(sprinklerR, minCells), maxCells);
              return (
                <>
                  <div style={{fontSize:10.5,color:T.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Sprinkler Type</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
                    {SPRINKLER_TYPES.map(s=>{
                      const active = sprinklerType===s.id;
                      return (
                        <Tip key={s.id} text={`${s.name} — ${s.description} (${s.flow})`}>
                          <button onClick={()=>{
                            setSprinklerType(s.id);
                            // Re-snap radius to type's default if outside new range
                            const defCells = Math.max(1, Math.round(s.defaultRadiusFt / ftPerCell));
                            setSprinklerR(defCells);
                          }} style={{
                            display:"flex",alignItems:"center",gap:5,padding:"5px 7px",
                            border:`1.5px solid ${active?s.color:T.border}`,
                            borderRadius:7,cursor:"pointer",
                            background:active?s.color+"1F":"transparent",
                            color:active?s.color:T.text2,
                            fontFamily:"var(--font-sans)",
                            fontSize:10.5,fontWeight:active?700:500,
                            minWidth:0,overflow:"hidden",
                          }}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name.replace("Gear Rotor · ","Rotor ")}</span>
                          </button>
                        </Tip>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:10.5,color:T.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em"}}>Spray Radius</span>
                    <span style={{fontSize:11,fontFamily:"var(--font-mono)",fontWeight:600,color:T.text}}>{fmt(safeR,cellM,metric)} · {safeR}c</span>
                  </div>
                  <input type="range" min={minCells} max={maxCells} value={safeR} step={1}
                    onChange={e=>setSprinklerR(+e.target.value)}
                    style={{width:"100%",marginBottom:4,accentColor:stype.color}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.text3,marginBottom:10,fontFamily:"var(--font-mono)"}}>
                    <span>{metric?`${(stype.minRadiusFt*0.3048).toFixed(1)}m`:`${stype.minRadiusFt}ft`}</span>
                    <span>{metric?`${(stype.maxRadiusFt*0.3048).toFixed(1)}m`:`${stype.maxRadiusFt}ft`}</span>
                  </div>
                </>
              );
            })()}
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:10.5,color:T.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em"}}>Size</span>
              <span style={{fontSize:11,fontFamily:"var(--font-mono)",fontWeight:600,color:T.text}}>{objSize}×</span>
            </div>
            <input type="range" min={1} max={3} value={objSize} step={1} onChange={e=>setObjSize(+e.target.value)} style={{width:"100%"}}/>
          </div>
        )}

        {/* Properties panel */}
        {(selObj||selLine) && (
          <div style={{padding:"12px 14px", borderTop:`1px solid ${T.borderSoft}`, flexShrink:0, background:T.bg}}>
            <SectionLabel T={T}>Selected</SectionLabel>
            {selObj && (<>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:30,height:30,borderRadius:9,background:T.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",color:T.primary}}>
                  <Icon name={TOOL_ICON[selObj.type] || "leaf"} size={17}/>
                </div>
                <div>
                  <div style={{fontSize:13.5,fontWeight:600,color:T.text}}>{TOOL_MAP[selObj.type]?.label||selObj.type}</div>
                  <div style={{fontSize:11,color:T.text2,fontFamily:"var(--font-mono)"}}>{fmt(selObj.x,cellM,metric)}, {fmt(selObj.y,cellM,metric)}</div>
                </div>
              </div>
              {selObj.type==="sprinkler" && (() => {
                const stype = SPRINKLER_TYPES.find(t=>t.id===selObj.sprinklerType) || SPRINKLER_TYPES[1];
                const minFt = stype.minRadiusFt;
                const maxFt = stype.maxRadiusFt;
                const ftPerCell = cellM * 3.28084;
                const minCells = Math.max(1, Math.round(minFt / ftPerCell));
                const maxCells = Math.max(minCells+1, Math.round(maxFt / ftPerCell));
                const r = selObj.radius || 3;
                const radiusFt = (r * ftPerCell).toFixed(1);
                const switchType = (newId) => {
                  const ns = SPRINKLER_TYPES.find(s=>s.id===newId);
                  if (!ns) return;
                  const defCells = Math.max(1, Math.round(ns.defaultRadiusFt / ftPerCell));
                  push({ground, objects:objects.map((o,i)=>i===sel.idx?{
                    ...o, sprinklerType:newId, sprinklerColor:ns.color, radius:defCells,
                  }:o), lines});
                };
                return (
                  <>
                    <div style={{fontSize:10.5,color:T.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Sprinkler Type</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
                      {SPRINKLER_TYPES.map(s=>{
                        const active = (selObj.sprinklerType||"popup_spray")===s.id;
                        return (
                          <Tip key={s.id} text={`${s.name} — ${s.description} (${s.flow})`}>
                            <button onClick={()=>switchType(s.id)} style={{
                              display:"flex",alignItems:"center",gap:5,padding:"5px 7px",
                              border:`1.5px solid ${active?s.color:T.border}`,
                              borderRadius:7,cursor:"pointer",
                              background:active?s.color+"1F":"transparent",
                              color:active?s.color:T.text2,
                              fontFamily:"var(--font-sans)",
                              fontSize:10.5,fontWeight:active?700:500,
                              minWidth:0,overflow:"hidden",
                            }}>
                              <span style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name.replace("Gear Rotor · ","Rotor ")}</span>
                            </button>
                          </Tip>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                      <span style={{color:T.text2,fontWeight:500}}>Spray Radius</span>
                      <span style={{fontFamily:"var(--font-mono)",color:T.text,fontWeight:600}}>
                        {metric ? `${(r*cellM).toFixed(1)} m` : `${radiusFt} ft`} · {r}c
                      </span>
                    </div>
                    <input type="range" min={minCells} max={maxCells} value={Math.min(r, maxCells)} step={1}
                      onChange={e=>push({ground,objects:objects.map((o,i)=>i===sel.idx?{...o,radius:+e.target.value}:o),lines})}
                      style={{width:"100%",marginBottom:4,accentColor:stype.color}}/>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.text3,marginBottom:10,fontFamily:"var(--font-mono)"}}>
                      <span>{metric?`${(minFt*0.3048).toFixed(1)}m`:`${minFt}ft`}</span>
                      <span style={{color:stype.color,fontWeight:600,letterSpacing:".02em"}}>{stype.flow}</span>
                      <span>{metric?`${(maxFt*0.3048).toFixed(1)}m`:`${maxFt}ft`}</span>
                    </div>
                <div style={{display:"flex",gap:4,marginBottom:6}}>
                  {[1,2,3].map(z=>(
                    <button key={z} onClick={()=>push({ground,objects:objects.map((o,i)=>i===sel.idx?{...o,zone:z}:o),lines})}
                      style={{flex:1,padding:"5px 6px",fontSize:11,fontWeight:700,
                        border:`1.5px solid ${(selObj.zone||1)===z?ZONE_COLORS[z-1]:T.border}`,
                        borderRadius:7,background:(selObj.zone||1)===z?ZONE_COLORS[z-1]+"22":"transparent",
                        cursor:"pointer",color:(selObj.zone||1)===z?ZONE_COLORS[z-1]:T.text2,
                        fontFamily:"var(--font-sans)"}}>Z{z}</button>
                  ))}
                </div>
                  </>
                );
              })()}
              {selObj.type==="house" && (<>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                  <span style={{color:T.text2,fontWeight:500}}>Width</span>
                  <span style={{fontFamily:"var(--font-mono)",color:T.text,fontWeight:600}}>
                    {selObj.width||8} cells · {fmt(selObj.width||8, cellM, metric)}
                  </span>
                </div>
                <input type="range" min={2} max={Math.max(4, cols-(selObj.x||0)-1)} value={selObj.width||8} step={1}
                  onChange={e=>push({ground,objects:objects.map((o,i)=>i===sel.idx?{...o,width:+e.target.value}:o),lines})}
                  style={{width:"100%",marginBottom:10}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                  <span style={{color:T.text2,fontWeight:500}}>Depth</span>
                  <span style={{fontFamily:"var(--font-mono)",color:T.text,fontWeight:600}}>
                    {selObj.depth||6} cells · {fmt(selObj.depth||6, cellM, metric)}
                  </span>
                </div>
                <input type="range" min={2} max={Math.max(4, rows-(selObj.y||0)-1)} value={selObj.depth||6} step={1}
                  onChange={e=>push({ground,objects:objects.map((o,i)=>i===sel.idx?{...o,depth:+e.target.value}:o),lines})}
                  style={{width:"100%",marginBottom:10}}/>
                <div style={{fontSize:10.5,color:T.text3,marginBottom:6,fontFamily:"var(--font-mono)",textAlign:"center"}}>
                  Footprint: {fmtArea((selObj.width||8)*(selObj.depth||6), cellM, metric)}
                </div>
              </>)}
            </>)}
            {selLine && (<>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:30,height:30,borderRadius:9,background:T.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",color:T.primary}}>
                  <Icon name={TOOL_ICON[selLine.type] || "pipe"} size={17}/>
                </div>
                <div>
                  <div style={{fontSize:13.5,fontWeight:600,color:T.text}}>{LT.find(l=>l.id===selLine.type)?.label||selLine.type}</div>
                  <div style={{fontSize:11,color:T.text2}}>{selLine.points.length} points{selLine.auto?" · Auto":""}</div>
                </div>
              </div>
            </>)}
            <button onClick={delSelected} style={{
              width:"100%",padding:"8px 12px",background:T.danger,border:"none",
              borderRadius:9,color:"#fff",cursor:"pointer",fontSize:12.5,
              fontFamily:"var(--font-sans)",fontWeight:600,
              display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
            }}>
              <Icon name="trash" size={14}/> Delete
            </button>
          </div>
        )}
      </aside>

      {/* ════════════════════ MAIN AREA ════════════════════ */}
      <main style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0, background:T.bg}}>

        {/* TOP TOOLBAR */}
        <div style={{
          display:"flex",alignItems:"center",gap:10,padding:"10px 18px",
          borderBottom:`1px solid ${T.border}`,background:T.bg,flexShrink:0,flexWrap:"wrap",
        }}>
          {/* Yard size stat */}
          <button onClick={()=>setShowSizeModal(true)} style={{
            display:"inline-flex",alignItems:"center",gap:7,padding:"5px 10px 5px 8px",
            background:"transparent",border:`1px solid ${T.borderSoft}`,borderRadius:9,
            cursor:"pointer",color:T.text2,fontSize:12,fontFamily:"var(--font-sans)",fontWeight:500,
          }}>
            <Icon name="size" size={14}/>
            <span style={{fontFamily:"var(--font-mono)",color:T.text,fontWeight:600}}>{cols}×{rows}</span>
            <span style={{color:T.text3}}>·</span>
            <span style={{fontFamily:"var(--font-mono)"}}>{fmtArea(cols*rows,cellM,metric)}</span>
          </button>

          <div style={{flex:1}}/>

          {/* m/ft toggle */}
          <div style={{display:"flex",border:`1px solid ${T.border}`,borderRadius:9,overflow:"hidden",background:T.bg}}>
            {[["m",true],["ft",false]].map(([lb,val])=>(
              <button key={lb} onClick={()=>setMetric(val)} style={{
                padding:"5px 13px",fontSize:11.5,border:"none",fontWeight:700,
                background:metric===val?T.primary:"transparent",
                color:metric===val?"#fff":T.text2,cursor:"pointer",
                fontFamily:"var(--font-mono)",letterSpacing:".05em",transition:"all .12s",
              }}>{lb}</button>
            ))}
          </div>

          {/* Grid toggle */}
          <Tip text="Show / hide grid lines">
            <button onClick={()=>setShowGrid(g=>!g)} style={pillBtn(T, showGrid)}>
              <Icon name="grid" size={14}/> Grid
            </button>
          </Tip>

          {lotPlan && (
            <Tip text="Show / hide imported lot overlay">
              <button onClick={()=>setShowLot(v=>!v)} style={pillBtn(T, showLot, T.accent)}>
                <Icon name="map" size={14}/> Lot
              </button>
            </Tip>
          )}

          {/* Zoom */}
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"3px 11px 3px 9px",border:`1px solid ${T.border}`,borderRadius:9,background:T.bg}}>
            <span style={{fontSize:11,color:T.text2,fontWeight:600}}>Zoom</span>
            <input type="range" min={0.1} max={3} step={0.05} value={zoom} onChange={e=>setZoom(+e.target.value)} style={{width:80}}/>
            <span style={{fontSize:11,color:T.text2,minWidth:36,fontFamily:"var(--font-mono)",fontWeight:600}}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(1)} title="Reset zoom to 100%"
              style={{marginLeft:2,background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:11,fontFamily:"var(--font-mono)",fontWeight:600,padding:0}}>↻</button>
          </div>

          {/* Help / FS */}
          <Tip text="Help & tour">
            <button onClick={()=>setShowHelp(true)} style={iconBtn(T)}><Icon name="help" size={15}/></button>
          </Tip>
          <Tip text={isFS?"Exit fullscreen":"Fullscreen"}>
            <button onClick={toggleFS} style={iconBtn(T)}><Icon name={isFS?"unfull":"full"} size={15}/></button>
          </Tip>

          {/* Import / export */}
          <button onClick={importDesign} style={{
            ...iconBtn(T), padding:"6px 12px", gap:6, fontSize:12, fontWeight:500,
          }}>
            <Icon name="upload" size={14}/> Import
          </button>
          <button onClick={exportDesign} style={{
            padding:"6px 13px",fontSize:12.5,fontWeight:600,
            background:T.primary,color:"#fff",border:"none",borderRadius:9,
            cursor:"pointer",fontFamily:"var(--font-sans)",
            display:"inline-flex",alignItems:"center",gap:6,
            boxShadow:`0 1px 4px ${hexToRgba(T.primary,.25)}`,
          }}>
            <Icon name="download" size={14}/> Export
          </button>
        </div>

        {/* CANVAS AREA */}
        <div style={{
          flex:1, overflow:"auto", padding:24, background:T.canvas,
          position:"relative",
          backgroundImage: dark
            ? "radial-gradient(circle at 0 0, rgba(255,255,255,.02), transparent 40%)"
            : "radial-gradient(circle at 0 0, rgba(255,255,255,.4), transparent 40%)",
        }}>
          {hoverCell && (
            <div style={{
              position:"absolute",top:14,right:18,fontSize:11.5,fontWeight:600,
              color:T.text,background:T.bg,padding:"5px 12px",borderRadius:8,
              border:`1px solid ${T.border}`,zIndex:10,pointerEvents:"none",
              fontFamily:"var(--font-mono)", boxShadow:T.shadow,
            }}>
              {fmt(hoverCell.x,cellM,metric)} · {fmt(hoverCell.y,cellM,metric)}
            </div>
          )}
          <div style={{
            display:"inline-block",
            borderRadius:8,overflow:"hidden",
            boxShadow:"0 8px 32px rgba(0,0,0,.16), 0 0 0 1px rgba(255,255,255,.05)",
          }}>
            <canvas ref={canvasRef}
              style={{display:"block",
                cursor: activeTool==="select"?"pointer":activeTool==="rect"?"crosshair":activeTool==="erase"?"cell":"crosshair",
              }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
              onDoubleClick={()=>{ if(isDrawingLine)finishLine(); }}/>
          </div>
        </div>

        {/* STATUS BAR */}
        <div style={{
          padding:"7px 18px",background:T.bg,borderTop:`1px solid ${T.border}`,
          display:"flex",gap:18,fontSize:11.5,color:T.text2,flexShrink:0,alignItems:"center",
        }}>
          <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
            <Icon name={TOOL_ICON[activeTool] || "select"} size={13} color={T.primary}/>
            <span style={{color:T.text2}}>Tool</span>
            <strong style={{color:T.text,fontWeight:600}}>{TOOL_MAP[activeTool]?.label||activeTool}</strong>
            {(activeTool==="paint"||activeTool==="rect") && (
              <>
                <span style={{color:T.text3}}>·</span>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,color:T.text}}>
                  <span style={{width:11,height:11,borderRadius:3,background:GROUND_COLORS[activeGround]}}/>
                  {GT.find(g=>g.id===activeGround)?.label}
                </span>
              </>
            )}
          </span>
          <span style={{color:T.text3}}>·</span>
          <span style={{fontFamily:"var(--font-mono)"}}>
            <strong style={{color:T.text}}>{objects.length}</strong>
            <span style={{color:T.text3}}> obj </span>
            <strong style={{color:T.text}}>{lines.length}</strong>
            <span style={{color:T.text3}}> lines </span>
            <strong style={{color:T.text}}>{grassCount}</strong>
            <span style={{color:T.text3}}> grass</span>
          </span>
          {isLineActive && <span style={{color:T.primary,fontWeight:500}}>Drag to draw · Double-click to finish</span>}
          {activeTool==="rect" && <span style={{color:T.primary,fontWeight:500}}>Drag a rectangle to fill</span>}
          {activeTool==="select" && sel && <span style={{color:T.primary,fontWeight:500}}><kbd>Del</kbd> remove · <kbd>Esc</kbd> deselect</span>}
          <div style={{flex:1}}/>
          <span style={{color:T.text3}}><kbd>⌘Z</kbd> undo · <kbd>⌘⇧Z</kbd> redo</span>
        </div>
      </main>

      {/* MODALS */}
      {showAutoModal && (
        <AutoIrrigateModal
          T={T} metric={metric} cellM={cellM}
          autoMode={autoMode} setAutoMode={setAutoMode}
          autoSprinklerType={autoSprinklerType} setAutoSprinklerType={setAutoSprinklerType}
          autoRadius={autoRadius} setAutoRadius={setAutoRadius}
          autoPreview={autoPreview}
          onClose={()=>{setShowAutoModal(false);setAutoPreview(null);}}
          onApply={runAuto}
        />
      )}
      {showPlotImport && (
        <PlotImportModal T={T} metric={metric}
          onClose={()=>setShowPlotImport(false)}
          onApply={applyPlotPlan}
        />
      )}
      {showSizeModal && (
        <YardSetupModal T={T}
          currentCols={cols} currentRows={rows} currentCellM={cellM} metric={metric}
          lotPlan={lotPlan}
          onClose={()=>setShowSizeModal(false)}
          onApply={applyYardSetup}
        />
      )}
      {showMaterials && (
        <MaterialsModal T={T} yardName={yardName}
          objects={objects} ground={ground} lines={lines}
          metric={metric} cellM={cellM}
          onClose={()=>setShowMaterials(false)}
        />
      )}
      {showHelp && <HelpModal T={T} dark={dark} onClose={()=>setShowHelp(false)}/>}

      {/* TOAST */}
      {toast && (
        <div style={{
          position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",
          background:T.text, color:T.bg,
          padding:"10px 18px",borderRadius:11,fontSize:13,fontWeight:600,
          boxShadow:"0 12px 32px rgba(0,0,0,.24)",
          zIndex:5000,display:"flex",alignItems:"center",gap:9,
          animation:"slidein .25s ease-out",
        }}>
          <Icon name={toast.type==="success"?"check":toast.type==="warn"?"help":"sparkle"} size={16}/>
          {toast.msg}
        </div>
      )}
      <style>{`
        @keyframes slidein { from { opacity:0; transform: translate(-50%, 16px); } to { opacity:1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
}

function btnGhost(T, disabled, equalFlex) {
  return {
    display:"flex",alignItems:"center",gap:9,padding:"8px 11px",
    width: equalFlex ? "auto" : "100%",
    flex: equalFlex ? 1 : "initial",
    justifyContent: equalFlex ? "center" : "flex-start",
    textAlign:"left",cursor:disabled?"default":"pointer",
    background:"transparent",color:disabled?T.text3:T.text,
    border:`1px solid ${T.border}`, borderRadius:10,
    fontSize:12.5,fontFamily:"var(--font-sans)",fontWeight:500,
    opacity: disabled ? 0.5 : 1,
  };
}
function pillBtn(T, active, accent) {
  const c = accent || T.primary;
  return {
    display:"inline-flex",alignItems:"center",gap:6,
    padding:"5px 11px",fontSize:11.5,border:`1px solid ${active?c:T.border}`,
    borderRadius:9,cursor:"pointer",
    background:active?hexToRgba(c, 0.14):"transparent",
    color:active?c:T.text2,
    fontFamily:"var(--font-sans)",fontWeight:600,
  };
}
function iconBtn(T) {
  return {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    padding:"6px 9px",border:`1px solid ${T.border}`,borderRadius:9,
    cursor:"pointer",background:"transparent",color:T.text2,
    fontFamily:"var(--font-sans)",
  };
}

window.BackyardPlanner = BackyardPlanner;
