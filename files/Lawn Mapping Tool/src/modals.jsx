/* ═══════════════════════════════════════════════════════════════════════════
   PATCH · MODALS
   AutoIrrigateModal, PlotImportModal, YardSetupModal, MaterialsModal
═══════════════════════════════════════════════════════════════════════════ */

const { useState: useStateMod, useEffect: useEffectMod, useMemo: useMemoMod, useRef: useRefMod } = React;

/* ─── COMMON MODAL CHROME ──────────────────────────────────────────────── */
function ModalShell({title, subtitle, ico, onClose, width=560, children, footer, T}) {
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(20,25,15,.55)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:24,overflow:"auto"
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.bg,borderRadius:20,width,maxWidth:"96vw",maxHeight:"90vh",
        display:"flex",flexDirection:"column",border:`1px solid ${T.border}`,color:T.text,
        boxShadow:"0 24px 60px rgba(0,0,0,.25)",overflow:"hidden",
      }}>
        <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${T.border}`,flexShrink:0,
                     display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
            {ico && (
              <div style={{width:36,height:36,borderRadius:11,background:T.primaryBg,
                           display:"flex",alignItems:"center",justifyContent:"center",
                           color:T.primary,flexShrink:0}}>
                <Icon name={ico} size={20}/>
              </div>
            )}
            <div style={{minWidth:0}}>
              <div style={{fontFamily:"var(--font-serif)",fontSize:22,lineHeight:1.1,letterSpacing:".3px"}}>{title}</div>
              {subtitle && <div style={{fontSize:12.5,color:T.text2,marginTop:3,lineHeight:1.45}}>{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.text2,padding:6,borderRadius:8,lineHeight:0,flexShrink:0}}>
            <Icon name="close" size={18}/>
          </button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>{children}</div>
        {footer && <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10,flexShrink:0,background:T.bg}}>{footer}</div>}
      </div>
    </div>
  );
}

function ModalBtn({children, onClick, primary, danger, ghost, T, disabled, style={}, flex=1}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex, padding:"10px 16px",
      background: disabled ? T.borderSoft : primary ? T.primary : danger ? T.danger : ghost ? "transparent" : T.bgAlt,
      color: disabled ? T.text3 : (primary||danger) ? "#fff" : T.text,
      border: (primary||danger) ? "none" : `1px solid ${T.border}`,
      borderRadius:12, cursor: disabled?"default":"pointer", fontSize:13.5, fontWeight:600,
      fontFamily:"var(--font-sans)", transition:"all .12s",
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
      ...style,
    }}>{children}</button>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   1.  AUTO IRRIGATE MODAL
   ════════════════════════════════════════════════════════════════════════ */
function AutoIrrigateModal({
  T, metric, cellM, autoMode, setAutoMode, autoSprinklerType, setAutoSprinklerType,
  autoRadius, setAutoRadius, autoPreview, onClose, onApply,
}) {
  const st = SPRINKLER_TYPES.find(t=>t.id===autoSprinklerType) || SPRINKLER_TYPES[1];
  const radiusCells = autoPreview?.radiusCells ?? Math.max(1, Math.round(autoRadius / (cellM * 3.28084)));
  const displayRadius = metric ? `${(autoRadius*0.3048).toFixed(1)} m` : `${autoRadius} ft`;

  return (
    <ModalShell
      T={T} ico="sparkle"
      title="Auto Irrigate"
      subtitle="Smart-place sprinklers across all grass and connect them back to your Water Source."
      onClose={onClose}
      width={600}
      footer={<>
        <ModalBtn T={T} ghost flex={0} style={{flex:"0 0 auto"}} onClick={onClose}>Cancel</ModalBtn>
        <div style={{flex:1}}/>
        <ModalBtn T={T} primary flex={0} style={{flex:"0 0 auto",minWidth:200}} onClick={onApply}>
          <Icon name="sparkle" size={16}/>
          Place {autoPreview?.sprinklers.length || 0} {(autoPreview?.sprinklers.length||0)===1?"sprinkler":"sprinklers"}
        </ModalBtn>
      </>}
    >
      <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:18}}>

        {/* Sprinkler type cards */}
        <div>
          <SectionLabel T={T}>Sprinkler Type</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {SPRINKLER_TYPES.map(s=>{
              const active = autoSprinklerType===s.id;
              return (
                <button key={s.id} onClick={()=>{
                  setAutoSprinklerType(s.id);
                  setAutoRadius(s.defaultRadiusFt);
                }} style={{
                  textAlign:"left",padding:"12px 14px",
                  border:`1.5px solid ${active?s.color:T.border}`,
                  borderRadius:14,cursor:"pointer",
                  background:active?s.color+"14":T.bgAlt,
                  color:T.text,transition:"all .12s",
                  fontFamily:"var(--font-sans)",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    <span style={{fontSize:13,fontWeight:700,color:active?s.color:T.text}}>{s.name}</span>
                  </div>
                  <div style={{fontSize:11.5,color:T.text2,lineHeight:1.5,marginBottom:6}}>{s.description}</div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:"var(--font-mono)"}}>
                    <span style={{color:s.color,fontWeight:600}}>
                      {metric?`${Math.round(s.minRadiusFt*0.3048)}–${Math.round(s.maxRadiusFt*0.3048)}m`:`${s.minRadiusFt}–${s.maxRadiusFt}ft`}
                    </span>
                    <span style={{color:T.text2}}>{s.flow}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Radius slider */}
        <div style={{background:T.bgAlt,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.borderSoft}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <SectionLabel T={T} style={{marginBottom:2}}>Spray Radius</SectionLabel>
              <div style={{fontSize:18,fontWeight:700,color:T.text,fontFamily:"var(--font-mono)"}}>
                {displayRadius} <span style={{color:T.text3,fontSize:13,fontWeight:500}}>· {radiusCells} {radiusCells===1?"cell":"cells"}</span>
              </div>
            </div>
            {autoPreview && (
              <div style={{
                fontSize:14,fontWeight:700,padding:"5px 13px",borderRadius:999,
                background:T.bg,
                color:autoPreview.coverage.pct>=90?T.success:autoPreview.coverage.pct>=70?T.warning:T.danger,
                border:`1.5px solid ${autoPreview.coverage.pct>=90?T.success:autoPreview.coverage.pct>=70?T.warning:T.danger}`,
              }}>
                {autoPreview.coverage.pct}% covered
              </div>
            )}
          </div>
          <input type="range" min={st.minRadiusFt} max={st.maxRadiusFt} value={autoRadius} step={1}
            onChange={e=>setAutoRadius(+e.target.value)}
            style={{width:"100%",accentColor:st.color}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.text2,marginTop:6,fontFamily:"var(--font-mono)"}}>
            <span>{metric?`${(st.minRadiusFt*0.3048).toFixed(0)} m`:`${st.minRadiusFt} ft`} · precise</span>
            <span>wider reach · {metric?`${(st.maxRadiusFt*0.3048).toFixed(0)} m`:`${st.maxRadiusFt} ft`}</span>
          </div>
        </div>

        {/* Strategy */}
        <div>
          <SectionLabel T={T}>Placement Strategy</SectionLabel>
          <div style={{display:"flex",gap:10}}>
            {[
              ["full","Full Coverage","Triangular grid — best for any shape","grid"],
              ["perimeter","Perimeter Only","Around the edges — best for simple lawns","rect"],
            ].map(([v,l,d,ico])=>(
              <button key={v} onClick={()=>setAutoMode(v)} style={{
                flex:1,padding:"12px 14px",textAlign:"left",
                border:`1.5px solid ${autoMode===v?T.primary:T.border}`,
                borderRadius:14,cursor:"pointer",
                background:autoMode===v?T.primaryBg:T.bgAlt,
                color:T.text,
                fontFamily:"var(--font-sans)",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <Icon name={ico} size={16} color={autoMode===v?T.primary:T.text2}/>
                  <div style={{fontSize:13.5,fontWeight:700,color:autoMode===v?T.primary:T.text}}>{l}</div>
                </div>
                <div style={{fontSize:11.5,color:T.text2,marginTop:2,lineHeight:1.45}}>{d}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live preview stats */}
        {autoPreview ? (
          <div style={{background:T.bgAlt,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.borderSoft}`}}>
            <SectionLabel T={T}>Live Preview</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              {[
                ["Heads needed", autoPreview.sprinklers.length, st.color],
                ["Grass cells", autoPreview.coverage.totalGrass, T.text],
                ["Covered cells", autoPreview.coverage.coveredGrass, T.success],
              ].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center",padding:"10px",background:T.bg,borderRadius:10,border:`1px solid ${T.borderSoft}`}}>
                  <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:"var(--font-mono)"}}>{v}</div>
                  <div style={{fontSize:11,color:T.text2,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:5,display:"flex",justifyContent:"space-between",fontSize:11.5}}>
              <span style={{color:T.text2,fontWeight:600}}>Coverage</span>
              <span style={{fontWeight:700,fontFamily:"var(--font-mono)",
                color:autoPreview.coverage.pct>=90?T.success:autoPreview.coverage.pct>=70?T.warning:T.danger}}>
                {autoPreview.coverage.pct}%
              </span>
            </div>
            <div style={{height:8,borderRadius:4,background:T.borderSoft,overflow:"hidden"}}>
              <div style={{
                height:"100%",borderRadius:4,transition:"width .3s ease",
                width:`${autoPreview.coverage.pct}%`,
                background:autoPreview.coverage.pct>=90?T.success:autoPreview.coverage.pct>=70?T.warning:T.danger,
              }}/>
            </div>
            {autoPreview.coverage.pct < 85 && (
              <div style={{marginTop:9,fontSize:12,color:T.warning,display:"flex",gap:6,alignItems:"flex-start",lineHeight:1.5}}>
                <span style={{flexShrink:0}}>·</span>
                <span>Coverage below 85%. Try a larger spray radius or switch to Full Coverage.</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{background:T.bgAlt,borderRadius:14,padding:"22px 16px",border:`1px dashed ${T.border}`,fontSize:13,color:T.text2,textAlign:"center",lineHeight:1.6}}>
            Paint some grass on the canvas to see a live coverage preview.
          </div>
        )}

      </div>
    </ModalShell>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   2.  PLOT PLAN IMPORT MODAL
   ════════════════════════════════════════════════════════════════════════ */
function PlotImportModal({T, onClose, onApply, metric}) {
  const [stage, setStage] = useStateMod("upload"); // upload | analyzing | review | manual
  const [error, setError] = useStateMod("");
  const [plan, setPlan] = useStateMod(null);
  const [fileName, setFileName] = useStateMod("");
  const [analyzeStep, setAnalyzeStep] = useStateMod(0); // 0..3 staged messages
  const fileInputRef = useRefMod(null);

  // Manual entry state (always available)
  const [m_lotW, setM_lotW] = useStateMod(56);
  const [m_lotD, setM_lotD] = useStateMod(148);
  const [m_houseW, setM_houseW] = useStateMod(43);
  const [m_houseH, setM_houseH] = useStateMod(40);
  const [m_setbackFront, setM_setbackFront] = useStateMod(20);
  const [m_addr, setM_addr] = useStateMod("");
  const [m_fenceSides, setM_fenceSides] = useStateMod({rear:true, left:true, right:true, front:false});
  const [m_fenceGates, setM_fenceGates] = useStateMod({rear:false, left:false, right:false, front:false});
  const [m_fenceInsetFt, setM_fenceInsetFt] = useStateMod(0); // 0 = on property line
  // Initial cell scale (in ft per cell). Default to 1ft for fence-aligned imports.
  const [m_cellFt, setM_cellFt] = useStateMod(1);

  useEffectMod(() => {
    if (stage !== "analyzing") return;
    const steps = [
      "Reading dimensions and scale notation…",
      "Tracing the lot boundary…",
      "Locating the house footprint…",
      "Calibrating the grid…",
    ];
    let i = 0;
    const t = setInterval(()=>{ i = Math.min(i+1, steps.length-1); setAnalyzeStep(i); }, 1100);
    return ()=>clearInterval(t);
  }, [stage]);

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setError("");
    setStage("analyzing");
    setAnalyzeStep(0);

    try {
      // Convert file to base64 (kept for future image-aware models)
      await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res();
        reader.onerror = () => rej(new Error("Could not read file."));
        reader.readAsDataURL(file);
      });

      // Ask Claude to estimate dimensions based on the filename. The Haiku
      // model used here is text-only, so we can't OCR the drawing — but we
      // give it the filename and any embedded location hint so it can
      // produce a reasonable starting guess. The user reviews it next.
      const prompt = `A user uploaded a residential plot plan named "${file.name}".

Generate a plausible plot-plan estimate as a JSON object with these fields. Use typical US suburban lot proportions (~7,000–10,000 sq ft) unless the filename hints otherwise. Return ONLY the JSON object, no prose, no markdown fence.

{
  "yardName": "short name (use filename if useful)",
  "address": "fabricated address or empty string",
  "lotWidthFt": 56,
  "lotDepthFt": 148,
  "lotAreaSF": 8288,
  "houseWidthFt": 43,
  "houseDepthFt": 40,
  "setbackFrontFt": 20,
  "setbackRearFt": 60,
  "livingAreaSF": 1700,
  "scale": "1 inch = 20 feet"
}`;

      let raw = "";
      try {
        raw = await window.claude.complete(prompt);
      } catch (e) {
        // Fall through to manual review with defaults
        raw = "";
      }

      let est = {};
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) est = JSON.parse(m[0]);
      } catch {}

      const lotW = +est.lotWidthFt || 56;
      const lotD = +est.lotDepthFt || 148;
      const houseW = +est.houseWidthFt || Math.round(lotW * 0.75);
      const houseH = +est.houseDepthFt || 40;
      const setbackFront = +est.setbackFrontFt || 20;
      const setbackRear = +est.setbackRearFt || (lotD - houseH - setbackFront);

      const detected = {
        yardName: est.yardName || file.name.replace(/\.(pdf|png|jpe?g|gif|webp)$/i, ""),
        address: est.address || "",
        lotWidthFt: lotW,
        lotDepthFt: lotD,
        houseWidthFt: houseW,
        houseDepthFt: houseH,
        setbackFrontFt: setbackFront,
        setbackRearFt: setbackRear,
        lotAreaSF: est.lotAreaSF || lotW*lotD,
        livingAreaSF: est.livingAreaSF || Math.round(houseW*houseH*0.85),
        scale: est.scale || "1\" = 20'",
        sourceFile: file.name,
        confidence: raw ? "estimated" : "default",
      };

      setM_lotW(detected.lotWidthFt);
      setM_lotD(detected.lotDepthFt);
      setM_houseW(detected.houseWidthFt);
      setM_houseH(detected.houseDepthFt);
      setM_setbackFront(detected.setbackFrontFt);
      setM_addr(detected.address || detected.yardName);
      setPlan(detected);

      setTimeout(()=>setStage("review"), 1400);
    } catch (e) {
      setError(`Couldn't analyse that file: ${e.message}. Try manual entry below.`);
      setStage("manual");
    }
  };

  const apply = () => {
    const lW = +m_lotW || 56;
    const lD = +m_lotD || 148;
    const hW = Math.min(+m_houseW || 43, lW - 4);
    const hH = +m_houseH || 40;
    const sb = +m_setbackFront || 20;
    const houseX = (lW - hW) / 2;
    const houseY = lD - hH - sb;
    const fenceSidesArr = Object.entries(m_fenceSides).filter(([,v])=>v).map(([k])=>k);
    const fenceGatesArr = Object.entries(m_fenceGates).filter(([k,v])=>v && fenceSidesArr.includes(k)).map(([k])=>k);
    const finalPlan = {
      yardName: m_addr || plan?.yardName || "My Lot",
      address: m_addr,
      lotAreaSF: Math.round(lW*lD),
      rearYardSF: Math.round(lW*sb + (lW - hW) * hH),
      footprintSF: Math.round(hW*hH),
      livingAreaSF: plan?.livingAreaSF || Math.round(hW*hH*0.85),
      polygon: [[0,0],[lW,0],[lW,lD],[0,lD]],
      house: { x:houseX, y:houseY, w:hW, h:hH },
      setbackFrontFt: sb,
      lotWidthFt: lW,
      lotDepthFt: lD,
      scale: plan?.scale,
      sourceFile: plan?.sourceFile,
      fenceSides: fenceSidesArr,
      fenceGates: fenceGatesArr,
      fenceInsetFt: +m_fenceInsetFt || 0,
      cellFt: +m_cellFt || 1,
    };
    onApply(finalPlan);
  };

  // ── STAGE: UPLOAD ──────────────────────────────────────────────────────
  if (stage === "upload") {
    return (
      <ModalShell T={T} ico="map" title="Import Plot Plan"
        subtitle="Drop a plot plan PDF or image and we'll set up your grid, lot boundary, and house footprint."
        onClose={onClose} width={580}>
        <div style={{padding:"18px 22px 22px"}}>
          <label
            onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.primary;e.currentTarget.style.background=T.primaryBg;}}
            onDragLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.bgAlt;}}
            onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.bgAlt;const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
            style={{
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:14,padding:"36px 24px",border:`2px dashed ${T.border}`,borderRadius:18,cursor:"pointer",
              background:T.bgAlt,transition:"all .15s",
            }}>
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{display:"none"}}
              onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value="";}}/>
            <div style={{width:64,height:64,borderRadius:18,background:T.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",color:T.primary}}>
              <Icon name="upload" size={28}/>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:3}}>Drop your plot plan here</div>
              <div style={{fontSize:12.5,color:T.text2}}>or click to browse · PDF, PNG, JPG</div>
            </div>
          </label>

          <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0 14px"}}>
            <div style={{flex:1,height:1,background:T.border}}/>
            <span style={{fontSize:11,color:T.text3,textTransform:"uppercase",letterSpacing:".1em",fontWeight:600}}>or</span>
            <div style={{flex:1,height:1,background:T.border}}/>
          </div>

          <button onClick={()=>setStage("manual")} style={{
            width:"100%",padding:"12px 14px",
            background:"transparent",border:`1.5px solid ${T.border}`,
            borderRadius:12,cursor:"pointer",color:T.text,
            fontSize:13.5,fontWeight:600,fontFamily:"var(--font-sans)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          }}>
            <Icon name="size" size={16}/> Enter dimensions manually
          </button>

          <div style={{marginTop:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              ["map","Reads the scale","Detects '1\"=20'' notation and converts to feet/metres"],
              ["size","Sizes the grid","Auto-picks cell scale so the lot fits comfortably"],
              ["shed","Places the house","Locks the footprint into the canvas as an overlay"],
              ["leaf","Yard stays open","Paint and design freely in the remaining space"],
            ].map(([ic,t,d])=>(
              <div key={t} style={{display:"flex",gap:9,padding:"10px 12px",background:T.bgAlt,borderRadius:12,border:`1px solid ${T.borderSoft}`}}>
                <Icon name={ic} size={18} color={T.primary} style={{flexShrink:0,marginTop:1}}/>
                <div>
                  <div style={{fontSize:12.5,fontWeight:600,color:T.text}}>{t}</div>
                  <div style={{fontSize:11.5,color:T.text2,marginTop:1,lineHeight:1.45}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ModalShell>
    );
  }

  // ── STAGE: ANALYZING ───────────────────────────────────────────────────
  if (stage === "analyzing") {
    const steps = [
      "Reading dimensions and scale notation",
      "Tracing the lot boundary",
      "Locating the house footprint",
      "Calibrating the grid",
    ];
    return (
      <ModalShell T={T} ico="sparkle" title="Analysing plot plan"
        subtitle={fileName} onClose={onClose} width={500}>
        <div style={{padding:"24px 28px 28px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {steps.map((s,i)=>{
              const done = i < analyzeStep;
              const active = i === analyzeStep;
              return (
                <div key={s} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                  background:active?T.primaryBg:T.bgAlt,borderRadius:11,
                  border:`1px solid ${active?T.primary:T.borderSoft}`,
                  transition:"all .25s",
                  opacity: i > analyzeStep ? 0.5 : 1,
                }}>
                  <div style={{
                    width:24,height:24,borderRadius:"50%",
                    background: done?T.success:active?T.primary:T.borderSoft,
                    color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,
                  }}>
                    {done
                      ? <Icon name="check" size={14}/>
                      : active
                        ? <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"pulse 1.1s ease-in-out infinite"}}/>
                        : <span style={{fontSize:11,color:T.text3,fontFamily:"var(--font-mono)"}}>{i+1}</span>}
                  </div>
                  <span style={{fontSize:13.5,fontWeight:active?600:500,color:active?T.primary:done?T.text:T.text2}}>{s}</span>
                </div>
              );
            })}
          </div>
          <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(.7);} }`}</style>
        </div>
      </ModalShell>
    );
  }

  // ── STAGE: REVIEW / MANUAL (shared form) ───────────────────────────────
  const fW = metric ? +m_lotW*0.3048 : +m_lotW;
  const fD = metric ? +m_lotD*0.3048 : +m_lotD;
  const unit = metric ? "m" : "ft";
  // Live SVG preview
  const previewSize = 260;
  const scale = Math.min(previewSize / (+m_lotW || 50), previewSize / (+m_lotD || 50)) * 0.86;
  const lotPxW = +m_lotW * scale, lotPxD = +m_lotD * scale;
  const housePxW = +m_houseW * scale, housePxD = +m_houseH * scale;
  const houseX = (lotPxW - housePxW) / 2;
  const houseY = lotPxD - housePxD - (+m_setbackFront * scale);
  const cx = (previewSize - lotPxW) / 2;
  const cy = (previewSize - lotPxD) / 2;

  return (
    <ModalShell T={T} ico="map"
      title={stage==="review" ? "Review detected dimensions" : "Enter your lot dimensions"}
      subtitle={stage==="review"
        ? "We've made a starting estimate — fine-tune the numbers below before applying."
        : "Tell us your lot dimensions and we'll set up the grid + house overlay."}
      onClose={onClose} width={680}
      footer={<>
        <ModalBtn T={T} ghost flex={0} style={{flex:"0 0 auto"}} onClick={onClose}>Cancel</ModalBtn>
        {stage==="review" && <ModalBtn T={T} ghost flex={0} style={{flex:"0 0 auto"}} onClick={()=>setStage("upload")}>← Re-upload</ModalBtn>}
        <div style={{flex:1}}/>
        <ModalBtn T={T} primary flex={0} style={{flex:"0 0 auto",minWidth:180}} onClick={apply}>
          <Icon name="check" size={16}/> Apply to canvas
        </ModalBtn>
      </>}
    >
      <div style={{padding:"18px 22px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>
        {/* Left: form */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {stage==="review" && plan?.confidence==="estimated" && (
            <div style={{padding:"10px 12px",background:T.accentBg,borderRadius:11,border:`1px solid ${T.accent}`,fontSize:12.5,color:T.text,lineHeight:1.5}}>
              <strong style={{color:T.accent}}>Heads up:</strong> These are starting estimates. Adjust them to match your plan before applying.
            </div>
          )}

          <div>
            <SectionLabel T={T}>Project Name</SectionLabel>
            <input type="text" value={m_addr} onChange={e=>setM_addr(e.target.value)}
              placeholder="e.g. 42 Oak Street"
              style={{width:"100%",padding:"9px 12px",background:T.input,color:T.text,
                      border:`1px solid ${T.border}`,borderRadius:10,fontSize:13,
                      fontFamily:"var(--font-sans)",boxSizing:"border-box"}}/>
          </div>

          <div>
            <SectionLabel T={T}>Lot Dimensions ({unit})</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                ["Width", m_lotW, setM_lotW, 10, 500],
                ["Depth", m_lotD, setM_lotD, 10, 800],
              ].map(([l,v,s,mn,mx])=>(
                <NumberField key={l} label={l} value={v} onChange={s} min={mn} max={mx} unit="ft" T={T}/>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel T={T}>House Footprint (ft)</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <NumberField label="Width"  value={m_houseW} onChange={setM_houseW} min={6} max={+m_lotW-2} unit="ft" T={T}/>
              <NumberField label="Depth"  value={m_houseH} onChange={setM_houseH} min={6} max={+m_lotD-2} unit="ft" T={T}/>
            </div>
          </div>

          <div>
            <SectionLabel T={T}>Front Setback (ft)</SectionLabel>
            <NumberField label="Distance from house to street" value={m_setbackFront} onChange={setM_setbackFront} min={0} max={+m_lotD-(+m_houseH)} unit="ft" T={T}/>
          </div>

          <div>
            <SectionLabel T={T}>Perimeter Fence</SectionLabel>
            <div style={{fontSize:11.5,color:T.text2,marginBottom:7,lineHeight:1.5}}>Toggle sides; click “Gate” on a fenced side to add a 4-ft opening.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
              {[["rear","Rear"],["left","Left side"],["right","Right side"],["front","Front (street)"]].map(([k,l])=>{
                const on = m_fenceSides[k];
                const gate = m_fenceGates[k];
                return (
                  <div key={k} style={{
                    display:"flex",alignItems:"stretch",
                    border:`1.5px solid ${on?T.primary:T.border}`,borderRadius:9,
                    background:on?T.primaryBg:T.bg,overflow:"hidden",
                  }}>
                    <button onClick={()=>setM_fenceSides(s=>({...s,[k]:!s[k]}))} style={{
                      flex:1,display:"flex",alignItems:"center",gap:7,padding:"7px 10px",
                      border:"none",background:"transparent",cursor:"pointer",
                      color:T.text,fontFamily:"var(--font-sans)",
                      fontSize:12,fontWeight:on?600:500,textAlign:"left",
                    }}>
                      <span style={{
                        width:14,height:14,borderRadius:4,border:`1.5px solid ${on?T.primary:T.text3}`,
                        background:on?T.primary:"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0,
                      }}>{on && <Icon name="check" size={10}/>}</span>
                      {l}
                    </button>
                    {on && (
                      <button onClick={()=>setM_fenceGates(g=>({...g,[k]:!g[k]}))} title="Toggle gate" style={{
                        padding:"4px 9px",fontSize:10,fontWeight:700,letterSpacing:".05em",
                        borderTopRightRadius:7,borderBottomRightRadius:7,
                        border:"none",cursor:"pointer",
                        background:gate ? T.accent : "transparent",
                        color:gate ? "#fff" : T.text3,
                        borderLeft:`1px solid ${on?T.primary:T.border}`,
                        fontFamily:"var(--font-sans)",textTransform:"uppercase",
                      }}>{gate?"✓ gate":"+ gate"}</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11.5,marginBottom:3}}>
                <span style={{color:T.text2,fontWeight:500}}>Inset from property line</span>
                <span style={{fontFamily:"var(--font-mono)",fontWeight:600,color:T.text}}>{m_fenceInsetFt} ft</span>
              </div>
              <input type="range" min={0} max={6} step={0.5} value={m_fenceInsetFt}
                onChange={e=>setM_fenceInsetFt(+e.target.value)}
                style={{width:"100%",accentColor:T.primary}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.text3,fontFamily:"var(--font-mono)"}}>
                <span>on the line</span>
                <span>well inside</span>
              </div>
            </div>
          </div>

          <div>
            <SectionLabel T={T}>Initial Cell Scale</SectionLabel>
            {(() => {
              const lotMax = Math.max(+m_lotW || 0, +m_lotD || 0);
              const hasFineWork = (+m_fenceInsetFt > 0 && +m_fenceInsetFt < 2)
                || Object.values(m_fenceGates).some(v=>v);
              const rec = hasFineWork ? 1 : lotMax > 200 ? 5 : lotMax > 100 ? 2 : 1;
              const recCols = Math.ceil((+m_lotW||56)/rec) + 2;
              const recRows = Math.ceil((+m_lotD||148)/rec) + 2;
              return (
                <div style={{padding:"9px 12px",background:T.primaryBg,borderRadius:10,border:`1px solid ${T.primary}`,fontSize:11.5,color:T.text,marginBottom:9,display:"flex",alignItems:"center",gap:9,lineHeight:1.45}}>
                  <Icon name="sparkle" size={14} color={T.primary}/>
                  <div style={{flex:1}}>
                    <strong style={{color:T.primary}}>Recommended:</strong> {rec} ft / cell
                    <span style={{color:T.text2}}> · {recCols}×{recRows} grid · {hasFineWork ? "matches your fence detail" : "good balance of speed + precision"}</span>
                  </div>
                  {Math.abs(m_cellFt - rec) > 0.05 && (
                    <button onClick={()=>setM_cellFt(rec)} style={{
                      padding:"4px 10px",fontSize:11,fontWeight:700,border:"none",borderRadius:7,
                      background:T.primary,color:"#fff",cursor:"pointer",fontFamily:"var(--font-sans)",flexShrink:0,
                    }}>Use {rec} ft</button>
                  )}
                </div>
              );
            })()}
            <div style={{fontSize:11.5,color:T.text2,marginBottom:7,lineHeight:1.5}}>How much real-world area each grid cell covers. Fence positions use exact ft regardless of cell size, but smaller cells let you paint and place objects more precisely.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:5}}>
              {[
                {v:0.5, l:"½ ft"},
                {v:1,   l:"1 ft"},
                {v:2,   l:"2 ft"},
                {v:3,   l:"3 ft"},
                {v:5,   l:"5 ft"},
                {v:8,   l:"8 ft"},
                {v:10,  l:"10 ft"},
                {v:15,  l:"15 ft"},
              ].map(o=>{
                const active = Math.abs(m_cellFt - o.v) < 0.05;
                const lotW = +m_lotW || 56, lotD = +m_lotD || 148;
                const cols = Math.ceil(lotW/o.v) + 2;
                const rs = Math.ceil(lotD/o.v) + 2;
                return (
                  <button key={o.v} onClick={()=>setM_cellFt(o.v)} style={{
                    padding:"7px 4px",borderRadius:8,cursor:"pointer",
                    border:`1.5px solid ${active?T.primary:T.border}`,
                    background:active?T.primaryBg:T.bg,color:T.text,
                    fontFamily:"var(--font-sans)",textAlign:"center",
                  }}>
                    <div style={{fontSize:12.5,fontWeight:700,color:active?T.primary:T.text}}>{o.l}</div>
                    <div style={{fontSize:9.5,color:active?T.primary:T.text3,fontFamily:"var(--font-mono)",marginTop:1,fontWeight:600}}>{cols}×{rs}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div style={{padding:"9px 12px",background:T.accentBg,border:`1px solid ${T.accent}`,borderRadius:10,fontSize:12,color:T.accent}}>{error}</div>}
        </div>

        {/* Right: live preview */}
        <div>
          <SectionLabel T={T}>Live Preview</SectionLabel>
          <div style={{
            background:T.bgAlt,borderRadius:14,border:`1px solid ${T.borderSoft}`,
            padding:14,display:"flex",flexDirection:"column",alignItems:"center",
          }}>
            <svg width={previewSize} height={previewSize} style={{display:"block"}}>
              {/* Street label area */}
              <text x={previewSize/2} y={previewSize-4} textAnchor="middle" fontSize="9"
                fill={T.text3} fontFamily="var(--font-mono)" style={{textTransform:"uppercase",letterSpacing:".15em"}}>street</text>
              {/* Lot */}
              <rect x={cx} y={cy} width={lotPxW} height={lotPxD}
                fill={hexToRgba(T.primary, .08)} stroke={T.primary} strokeWidth={1.5} strokeDasharray="5 3"/>
              {/* Fence sides (with inset + optional gate gap) */}
              {(() => {
                const insetPx = (+m_fenceInsetFt || 0) * scale;
                const xL = cx + insetPx, xR = cx + lotPxW - insetPx;
                const yT = cy + insetPx, yB = cy + lotPxD - insetPx;
                const gateGapPx = Math.max(6, 4 * scale);
                const drawSide = (side, x1, y1, x2, y2) => {
                  if (!m_fenceSides[side]) return null;
                  if (!m_fenceGates[side]) {
                    return <line key={side} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B6030" strokeWidth={2.5} strokeLinecap="round"/>;
                  }
                  // Compute midpoint, split with gate gap
                  const mx = (x1+x2)/2, my = (y1+y2)/2;
                  const dx = x2-x1, dy = y2-y1;
                  const len = Math.sqrt(dx*dx + dy*dy);
                  const halfGap = Math.min(gateGapPx/2, len/3);
                  const ux = dx/len, uy = dy/len;
                  const g1 = {x: mx - ux*halfGap, y: my - uy*halfGap};
                  const g2 = {x: mx + ux*halfGap, y: my + uy*halfGap};
                  return <g key={side}>
                    <line x1={x1} y1={y1} x2={g1.x} y2={g1.y} stroke="#8B6030" strokeWidth={2.5} strokeLinecap="round"/>
                    <line x1={g2.x} y1={g2.y} x2={x2} y2={y2} stroke="#8B6030" strokeWidth={2.5} strokeLinecap="round"/>
                    <line x1={g1.x} y1={g1.y} x2={g2.x} y2={g2.y} stroke={T.accent} strokeWidth={1.5} strokeDasharray="2 2" strokeLinecap="round"/>
                  </g>;
                };
                return <>
                  {drawSide("rear",  xL, yT, xR, yT)}
                  {drawSide("left",  xL, yT, xL, yB)}
                  {drawSide("right", xR, yT, xR, yB)}
                  {drawSide("front", xL, yB, xR, yB)}
                </>;
              })()}
              {/* House */}
              <rect x={cx+houseX} y={cy+houseY} width={housePxW} height={housePxD}
                fill={hexToRgba(T.text2, .25)} stroke={T.text} strokeWidth={1.5}/>
              <text x={cx+houseX+housePxW/2} y={cy+houseY+housePxD/2+3} textAnchor="middle"
                fontSize="9" fill={T.text} fontFamily="var(--font-sans)" fontWeight="700">HOUSE</text>
              {/* Yard label */}
              <text x={cx+lotPxW/2} y={cy+houseY-6} textAnchor="middle"
                fontSize="9" fill={T.success} fontFamily="var(--font-sans)" fontWeight="600">YARD</text>
              {/* Dimensions */}
              <text x={cx+lotPxW/2} y={cy-6} textAnchor="middle"
                fontSize="9" fill={T.text2} fontFamily="var(--font-mono)">{(+m_lotW).toFixed(0)} ft</text>
              <text x={cx-6} y={cy+lotPxD/2} textAnchor="end"
                fontSize="9" fill={T.text2} fontFamily="var(--font-mono)"
                transform={`rotate(-90 ${cx-6} ${cy+lotPxD/2})`}>{(+m_lotD).toFixed(0)} ft</text>
            </svg>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",marginTop:14}}>
              {[
                ["Lot Area", `${Math.round((+m_lotW)*(+m_lotD)).toLocaleString()} ft²`],
                ["House", `${Math.round((+m_houseW)*(+m_houseH)).toLocaleString()} ft²`],
                ["Yard Area", `${Math.round((+m_lotW)*(+m_lotD) - (+m_houseW)*(+m_houseH)).toLocaleString()} ft²`],
                ["Setback", `${+m_setbackFront} ft`],
              ].map(([l,v])=>(
                <div key={l} style={{padding:"7px 10px",background:T.bg,borderRadius:9,border:`1px solid ${T.borderSoft}`}}>
                  <div style={{fontSize:10,color:T.text3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"var(--font-mono)",marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function NumberField({label, value, onChange, min, max, unit, T}) {
  return (
    <div>
      <div style={{fontSize:11.5,color:T.text2,marginBottom:4,fontWeight:500}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",border:`1px solid ${T.border}`,borderRadius:10,background:T.input,overflow:"hidden"}}>
        <input type="number" value={value} min={min} max={max}
          onChange={e=>onChange(e.target.value)}
          style={{flex:1,padding:"9px 12px",border:"none",outline:"none",background:"transparent",color:T.text,fontSize:13,fontFamily:"var(--font-mono)",fontWeight:600,minWidth:0,boxSizing:"border-box"}}/>
        <span style={{padding:"0 12px",fontSize:11,color:T.text3,fontFamily:"var(--font-mono)",letterSpacing:".05em"}}>{unit}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   3.  YARD SETUP MODAL (size + scale + units, with presets + preview)
   ════════════════════════════════════════════════════════════════════════ */
function YardSetupModal({T, currentCols, currentRows, currentCellM, metric, lotPlan, onApply, onClose}) {
  const hasLot = !!lotPlan;
  const [mode, setMode] = useStateMod(hasLot ? "lot" : "preset"); // lot | preset | custom
  const [presetId, setPresetId] = useStateMod(() => {
    const match = YARD_PRESETS.find(p => p.cols===currentCols && p.rows===currentRows && Math.abs(p.cellM-currentCellM)<.01);
    return match?.id || "medium";
  });
  const [cCols, setCCols]   = useStateMod(currentCols);
  const [cRows, setCRows]   = useStateMod(currentRows);
  const [cCellM, setCCellM] = useStateMod(currentCellM);
  const [lotCellM, setLotCellM] = useStateMod(currentCellM);
  const [preserveDesign, setPreserveDesign] = useStateMod(true);

  const preset = YARD_PRESETS.find(p=>p.id===presetId) || YARD_PRESETS[1];
  // Compute cols/rows for lot mode based on chosen cellM
  let lotCols = currentCols, lotRows = currentRows;
  if (hasLot) {
    const niceCellFt = lotCellM * 3.28084;
    lotCols = Math.ceil(lotPlan.lotWidthFt / niceCellFt) + 2;
    lotRows = Math.ceil(lotPlan.lotDepthFt / niceCellFt) + 2;
  }
  const cols  = mode==="lot" ? lotCols : mode==="preset" ? preset.cols  : cCols;
  const rows  = mode==="lot" ? lotRows : mode==="preset" ? preset.rows  : cRows;
  const cellM = mode==="lot" ? lotCellM : mode==="preset" ? preset.cellM : cCellM;

  const totalW = cols * cellM, totalD = rows * cellM;
  const previewW = 280, previewH = 200;
  const pad = 16;
  const cellPx = Math.min((previewW - pad*2) / cols, (previewH - pad*2) / rows);
  const gridPxW = cellPx * cols, gridPxH = cellPx * rows;
  const ox = (previewW - gridPxW) / 2, oy = (previewH - gridPxH) / 2;

  return (
    <ModalShell T={T} ico="size" title="Yard Setup"
      subtitle={hasLot
        ? "Adjust the cell scale for your imported lot. Your design can be rescaled to fit."
        : "Set your yard size, real-world scale, and units."}
      onClose={onClose} width={680}
      footer={<>
        <ModalBtn T={T} ghost flex={0} style={{flex:"0 0 auto"}} onClick={onClose}>Cancel</ModalBtn>
        <div style={{flex:1}}/>
        <ModalBtn T={T} primary flex={0} style={{flex:"0 0 auto",minWidth:200}}
          onClick={()=>onApply({cols, rows, cellM, preserveLot: mode==="lot", preserveDesign})}>
          <Icon name="check" size={16}/> Apply
        </ModalBtn>
      </>}>
      <div style={{padding:"18px 22px 22px"}}>
        {/* Mode toggle */}
        <div style={{display:"flex",gap:4,padding:4,background:T.bgAlt,borderRadius:11,marginBottom:18,border:`1px solid ${T.borderSoft}`,maxWidth:hasLot?420:280}}>
          {[
            ...(hasLot ? [["lot","Fit to Lot"]] : []),
            ["preset","Presets"],
            ["custom","Custom"],
          ].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)} style={{
              flex:1,padding:"7px 12px",fontSize:12.5,fontWeight:600,border:"none",
              borderRadius:8,cursor:"pointer",fontFamily:"var(--font-sans)",
              background: mode===v ? T.bg : "transparent",
              color: mode===v ? T.primary : T.text2,
              boxShadow: mode===v ? "0 1px 4px rgba(0,0,0,.05)" : "none",
              transition:"all .12s",
            }}>{l}</button>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:22}}>
          {/* LEFT: presets or custom controls */}
          <div>
            {mode==="lot" ? (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{padding:"11px 13px",background:T.accentBg,borderRadius:12,border:`1px solid ${T.accent}`,fontSize:12.5,color:T.text,lineHeight:1.5}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,fontWeight:700,color:T.accent}}>
                    <Icon name="map" size={15} color={T.accent}/> Lot loaded: {lotPlan.yardName||lotPlan.address||"Imported lot"}
                  </div>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:11.5,color:T.text2}}>
                    {lotPlan.lotWidthFt}ft × {lotPlan.lotDepthFt}ft  ·  {lotPlan.lotAreaSF?.toLocaleString()} ft²
                  </div>
                </div>
                <div>
                  <SectionLabel T={T}>Cell Scale</SectionLabel>
                  <div style={{fontSize:11.5,color:T.text2,marginBottom:9,lineHeight:1.5}}>
                    Choose how much real-world area each grid cell represents. The grid will resize to fit your lot.
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[
                      {v:0.25, l:"0.25 m", s:"10 in"},
                      {v:0.305,l:"~1 ft",  s:"30.5 cm"},
                      {v:0.5,  l:"0.5 m",  s:"1.6 ft"},
                      {v:0.61, l:"~2 ft",  s:"61 cm"},
                      {v:1.0,  l:"1 m",    s:"3.3 ft"},
                      {v:1.524,l:"~5 ft",  s:"1.5 m"},
                      {v:2.0,  l:"2 m",    s:"6.6 ft"},
                      {v:3.048,l:"~10 ft", s:"3 m"},
                      {v:5.0,  l:"5 m",    s:"16 ft"},
                    ].map(o=>{
                      const active = Math.abs(lotCellM-o.v)<.005;
                      // Live preview cell counts for THIS option
                      const niceCellFt = o.v * 3.28084;
                      const pCols = Math.ceil(lotPlan.lotWidthFt / niceCellFt) + 2;
                      const pRows = Math.ceil(lotPlan.lotDepthFt / niceCellFt) + 2;
                      return (
                        <button key={o.v} onClick={()=>setLotCellM(o.v)} style={{
                          padding:"9px 8px",borderRadius:10,cursor:"pointer",
                          border:`1.5px solid ${active?T.primary:T.border}`,
                          background:active?T.primaryBg:T.bgAlt,color:T.text,
                          fontFamily:"var(--font-sans)",textAlign:"center",
                        }}>
                          <div style={{fontSize:13,fontWeight:700,color:active?T.primary:T.text}}>{o.l}</div>
                          <div style={{fontSize:10,color:T.text2,fontFamily:"var(--font-mono)",marginTop:1}}>{o.s}</div>
                          <div style={{fontSize:10,color:active?T.primary:T.text3,fontFamily:"var(--font-mono)",marginTop:4,fontWeight:600}}>{pCols}×{pRows}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{marginTop:14}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,color:T.text2,fontWeight:600}}>Or fine-tune</span>
                      <span style={{fontSize:11.5,fontFamily:"var(--font-mono)",color:T.text,fontWeight:600}}>
                        {(lotCellM*3.28084).toFixed(2)} ft / cell  ·  {lotCols}×{lotRows}
                      </span>
                    </div>
                    <input type="range" min={0.15} max={6} step={0.05} value={lotCellM}
                      onChange={e=>setLotCellM(+e.target.value)}
                      style={{width:"100%",accentColor:T.primary}}/>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:T.text3,marginTop:2,fontFamily:"var(--font-mono)"}}>
                      <span>fine detail</span>
                      <span>macro overview</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : mode==="preset" ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {YARD_PRESETS.map(p=>{
                  const active = presetId===p.id;
                  return (
                    <button key={p.id} onClick={()=>setPresetId(p.id)} style={{
                      textAlign:"left",padding:"13px 15px",
                      border:`1.5px solid ${active?T.primary:T.border}`,
                      borderRadius:13,cursor:"pointer",
                      background:active?T.primaryBg:T.bg,
                      color:T.text,transition:"all .12s",
                      fontFamily:"var(--font-sans)",display:"flex",alignItems:"center",gap:14,
                    }}>
                      {/* Mini visual preview */}
                      <svg width={42} height={32} viewBox="0 0 42 32" style={{flexShrink:0}}>
                        <rect x="2" y="2" width="38" height="28" rx="3"
                          fill={hexToRgba(p.id==="small"?T.success:p.id==="medium"?T.success:p.id==="large"?T.warning:T.accent, .25)}
                          stroke={active?T.primary:T.border} strokeWidth="1"/>
                        {/* Grid hint */}
                        {p.id==="small" && <><line x1="14" y1="2" x2="14" y2="30" stroke={T.border}/><line x1="28" y1="2" x2="28" y2="30" stroke={T.border}/><line x1="2" y1="16" x2="40" y2="16" stroke={T.border}/></>}
                        {p.id==="medium" && <><line x1="11" y1="2" x2="11" y2="30" stroke={T.border}/><line x1="21" y1="2" x2="21" y2="30" stroke={T.border}/><line x1="31" y1="2" x2="31" y2="30" stroke={T.border}/></>}
                      </svg>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:active?T.primary:T.text}}>{p.name}</div>
                        <div style={{fontSize:11.5,color:T.text2,marginTop:1,fontFamily:"var(--font-mono)"}}>{p.subtitle}</div>
                      </div>
                      <div style={{fontSize:11,color:T.text3,textAlign:"right",fontStyle:"italic"}}>{p.hint}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div>
                  <SectionLabel T={T}>Grid Size (cells)</SectionLabel>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <NumberField label="Width" value={cCols} onChange={v=>setCCols(Math.max(5,Math.min(80,+v||0)))} min={5} max={80} unit="cells" T={T}/>
                    <NumberField label="Depth" value={cRows} onChange={v=>setCRows(Math.max(5,Math.min(80,+v||0)))} min={5} max={80} unit="cells" T={T}/>
                  </div>
                </div>
                <div>
                  <SectionLabel T={T}>Real-world Scale per Cell</SectionLabel>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[
                      {v:0.1,  l:"0.1 m", s:"4 in"},
                      {v:0.25, l:"0.25 m", s:"10 in"},
                      {v:0.5,  l:"0.5 m", s:"1.6 ft"},
                      {v:1.0,  l:"1 m",   s:"3.3 ft"},
                      {v:2.0,  l:"2 m",   s:"6.6 ft"},
                      {v:5.0,  l:"5 m",   s:"16 ft"},
                    ].map(o=>{
                      const active = Math.abs(cCellM-o.v)<.01;
                      return (
                        <button key={o.v} onClick={()=>setCCellM(o.v)} style={{
                          padding:"9px 8px",borderRadius:9,cursor:"pointer",
                          border:`1.5px solid ${active?T.primary:T.border}`,
                          background:active?T.primaryBg:T.bgAlt,color:T.text,
                          fontFamily:"var(--font-sans)",
                        }}>
                          <div style={{fontSize:12.5,fontWeight:700,color:active?T.primary:T.text}}>{o.l}</div>
                          <div style={{fontSize:10.5,color:T.text2,fontFamily:"var(--font-mono)"}}>{o.s}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: live preview */}
          <div>
            <SectionLabel T={T}>Preview</SectionLabel>
            <div style={{background:T.bgAlt,borderRadius:13,border:`1px solid ${T.borderSoft}`,padding:14}}>
              <svg width={previewW} height={previewH}>
                {/* outer grid backdrop */}
                <rect x={ox-2} y={oy-2} width={gridPxW+4} height={gridPxH+4} rx="3"
                  fill={T.canvas} stroke={T.border} strokeWidth="1"/>
                {/* grid cells */}
                {Array.from({length:cols+1}).map((_,i)=>(
                  <line key={"v"+i} x1={ox+i*cellPx} y1={oy} x2={ox+i*cellPx} y2={oy+gridPxH} stroke={hexToRgba(T.text, .14)} strokeWidth="0.4"/>
                ))}
                {Array.from({length:rows+1}).map((_,i)=>(
                  <line key={"h"+i} x1={ox} y1={oy+i*cellPx} x2={ox+gridPxW} y2={oy+i*cellPx} stroke={hexToRgba(T.text, .14)} strokeWidth="0.4"/>
                ))}
                {mode==="lot" && lotPlan ? (() => {
                  // Draw the lot in grid coords. ftPerCell tells us how to map.
                  const ftPerCell = cellM * 3.28084;
                  const lotW_px = (lotPlan.lotWidthFt / ftPerCell) * cellPx;
                  const lotH_px = (lotPlan.lotDepthFt / ftPerCell) * cellPx;
                  const lx = ox + cellPx; // 1 cell padding
                  const ly = oy + cellPx;
                  let house = null;
                  if (lotPlan.house) {
                    const h = lotPlan.house;
                    const hx = lx + (h.x/ftPerCell)*cellPx;
                    const hy = ly + (h.y/ftPerCell)*cellPx;
                    const hw = (h.w/ftPerCell)*cellPx;
                    const hh = (h.h/ftPerCell)*cellPx;
                    house = <>
                      <rect x={hx} y={hy} width={hw} height={hh}
                        fill={hexToRgba(T.text2, .3)} stroke={T.text} strokeWidth="1.2"/>
                      {hw>26 && <text x={hx+hw/2} y={hy+hh/2+3} textAnchor="middle" fontSize="8.5" fill={T.text} fontWeight="700">HOUSE</text>}
                    </>;
                  }
                  return (
                    <>
                      <rect x={lx} y={ly} width={lotW_px} height={lotH_px}
                        fill={hexToRgba(T.accent, .08)}
                        stroke={T.accent} strokeWidth="1.5" strokeDasharray="5 3"/>
                      {house}
                    </>
                  );
                })() : (
                  <rect x={ox+cellPx*2} y={oy+cellPx*2} width={gridPxW-cellPx*4} height={gridPxH-cellPx*4}
                    fill={hexToRgba(T.primary, .18)} stroke={T.primary} strokeWidth="0.6" strokeDasharray="2 2"/>
                )}
              </svg>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
                <Stat T={T} label="Grid" value={`${cols} × ${rows}`} mono/>
                <Stat T={T} label="Cell" value={metric?`${cellM.toFixed(2)}m`:`${(cellM*3.28084).toFixed(2)}ft`} mono/>
                <Stat T={T} label="Width" value={metric?`${totalW.toFixed(1)}m`:`${(totalW*3.28084).toFixed(0)}ft`} mono/>
                <Stat T={T} label="Depth" value={metric?`${totalD.toFixed(1)}m`:`${(totalD*3.28084).toFixed(0)}ft`} mono/>
                <Stat T={T} label="Total Area" value={metric?`${Math.round(totalW*totalD)}m²`:`${Math.round(totalW*totalD*10.7639)}ft²`} mono span={2}/>
              </div>
            </div>
          </div>
        </div>

        {/* Preserve-design toggle */}
        <div style={{marginTop:16,padding:"12px 14px",background:T.bgAlt,borderRadius:12,border:`1px solid ${T.borderSoft}`,display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setPreserveDesign(v=>!v)}
            role="switch" aria-checked={preserveDesign}
            style={{
              flexShrink:0,width:38,height:22,padding:2,border:"none",borderRadius:999,
              background: preserveDesign ? T.primary : T.border,
              cursor:"pointer",position:"relative",transition:"background .15s",
            }}>
            <span style={{
              position:"absolute",top:2,left: preserveDesign ? 18 : 2,
              width:18,height:18,borderRadius:"50%",background:"#fff",
              transition:"left .15s", boxShadow:"0 1px 3px rgba(0,0,0,.25)",
            }}/>
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text}}>Keep my existing design</div>
            <div style={{fontSize:11.5,color:T.text2,marginTop:1,lineHeight:1.45}}>
              {preserveDesign
                ? "Ground, objects, and lines will rescale to keep their real-world positions."
                : "Canvas will be cleared. Existing painting and objects will be lost."}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function Stat({label, value, T, mono, span=1}) {
  return (
    <div style={{padding:"8px 11px",background:T.bg,borderRadius:9,border:`1px solid ${T.borderSoft}`,gridColumn:`span ${span}`}}>
      <div style={{fontSize:10,color:T.text3,textTransform:"uppercase",letterSpacing:".07em",fontWeight:600}}>{label}</div>
      <div style={{fontSize:13.5,fontWeight:700,color:T.text,fontFamily:mono?"var(--font-mono)":"var(--font-sans)",marginTop:2}}>{value}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   4.  MATERIALS MODAL
   ════════════════════════════════════════════════════════════════════════ */
function MaterialsModal({T, yardName, objects, ground, lines, metric, cellM, onClose}) {
  // Track excluded items separately so we can surface a hint in the modal
  const excludedObjects = objects.filter(o => o.excludeFromMaterials);
  const excludedLines   = lines.filter(l => l.excludeFromMaterials);
  const M = useMemoMod(() => {
    const incObjects = objects.filter(o => !o.excludeFromMaterials);
    const incLines   = lines.filter(l => !l.excludeFromMaterials);
    const sprinklers = incObjects.filter(o => o.type === "sprinkler");
    const sprinklerCount = sprinklers.length;
    const sprinklersByZone = [1,2,3].map(z => sprinklers.filter(s => s.zone === z).length);
    const emitters = incObjects.filter(o => o.type === "drip_emitter").length;
    let irrigPipeM = 0, dripPipeM = 0, fenceM = 0, wallM = 0, hedgeM = 0, pathM = 0;
    incLines.forEach(line => {
      if (line.points.length < 2) return;
      let len = 0;
      for (let i = 1; i < line.points.length; i++) {
        const dx = line.points[i].x - line.points[i-1].x;
        const dy = line.points[i].y - line.points[i-1].y;
        len += Math.sqrt(dx*dx + dy*dy);
      }
      const m = len * cellM;
      if (line.type === "irrigation") irrigPipeM += m;
      if (line.type === "drip_line")  dripPipeM  += m;
      if (line.type === "fence")      fenceM     += m;
      if (line.type === "wall")       wallM      += m;
      if (line.type === "hedge")      hedgeM     += m;
      if (line.type === "path")       pathM      += m;
    });
    const irrigPipe = irrigPipeM * 1.15;
    const dripPipe  = dripPipeM  * 1.15;
    const elbows   = Math.ceil(irrigPipe / 2.5);
    const tees     = Math.max(sprinklerCount - 1, 0);
    const endcaps  = Math.max(1, incLines.filter(l=>l.type==="irrigation").length);
    const hasWS    = incObjects.some(o => o.type === "watersource");
    const zones    = Math.max(1, sprinklersByZone.filter(n=>n>0).length);
    const groundCounts = {};
    Object.values(ground).forEach(g => { groundCounts[g] = (groundCounts[g]||0) + 1; });
    const hedgePlants = Math.ceil(hedgeM / 0.5);
    return { sprinklerCount, sprinklersByZone, emitters, irrigPipe, dripPipe,
             elbows, tees, endcaps, fenceM, wallM, hedgeM, hedgePlants, pathM,
             groundCounts, hasWS, zones };
  }, [objects, ground, lines, cellM]);

  const fmtL = (m) => metric ? `${m.toFixed(1)} m` : `${(m*3.28084).toFixed(1)} ft`;
  const fmtA = (cells) => metric ? `${Math.round(cells*cellM*cellM)} m²` : `${Math.round(cells*cellM*cellM*10.7639)} ft²`;
  const gLabel = {grass:"Lawn Grass",dirt:"Bare Soil",concrete:"Concrete",gravel:"Gravel",mulch:"Mulch",sand:"Sand",pavers:"Pavers",decking:"Decking",turf:"Artif. Turf",pebbles:"Pebbles",water:"Pond"};

  const Row = ({ico,label,value,note,highlight}) => (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.borderSoft}`}}>
      <div style={{width:28,height:28,borderRadius:9,background:highlight?T.primaryBg:T.bgAlt,
                   display:"flex",alignItems:"center",justifyContent:"center",color:highlight?T.primary:T.text2,flexShrink:0}}>
        <Icon name={ico} size={15}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13.5,fontWeight:600,color:highlight?T.primary:T.text}}>{label}</div>
        {note && <div style={{fontSize:11.5,color:T.text2,marginTop:1,lineHeight:1.45}}>{note}</div>}
      </div>
      <div style={{fontSize:14,fontWeight:700,color:highlight?T.primary:T.text,minWidth:90,textAlign:"right",fontFamily:"var(--font-mono)"}}>{value}</div>
    </div>
  );
  const Sect = ({title}) => (
    <div style={{fontFamily:"var(--font-serif)",fontSize:17,color:T.primary,letterSpacing:".3px",marginTop:18,marginBottom:2}}>{title}</div>
  );

  const exportTxt = () => {
    const lns=["GARDEN MATERIALS LIST","Generated by Patch · Backyard Planner","",`Project: ${yardName}`,`Date: ${new Date().toLocaleDateString()}`,""];
    if(M.sprinklerCount>0){lns.push("── IRRIGATION ──");if(M.hasWS)lns.push("Water source: 1 unit");lns.push(`Sprinkler heads: ${M.sprinklerCount}`);if(M.irrigPipe>0)lns.push(`PVC pipe: ${fmtL(M.irrigPipe)} (incl. 15% waste)`);if(M.elbows)lns.push(`Elbows: ~${M.elbows}`);if(M.tees)lns.push(`Tees: ~${M.tees}`);if(M.endcaps)lns.push(`End caps: ~${M.endcaps}`);}
    if(Object.keys(M.groundCounts).length){lns.push("");lns.push("── GROUND SURFACES ──");Object.entries(M.groundCounts).forEach(([g,c])=>lns.push(`${gLabel[g]||g}: ${fmtA(c)}`));}
    if(M.fenceM>0){lns.push("");lns.push("── STRUCTURES ──");lns.push(`Fencing: ${fmtL(M.fenceM)}`);}
    if(M.wallM>0)lns.push(`Wall: ${fmtL(M.wallM)}`);
    if(M.hedgePlants>0)lns.push(`Hedge plants: ~${M.hedgePlants}`);
    lns.push("");lns.push("Note: Estimates only. Verify before purchasing.");
    const blob=new Blob([lns.join("\n")],{type:"text/plain"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${yardName.replace(/\s+/g,"_")}_materials.txt`;document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},400);
  };

  return (
    <ModalShell T={T} ico="shop" title="Materials List"
      subtitle="Estimated quantities for your current design. Add a ~10% buffer for on-site adjustments."
      onClose={onClose} width={620}
      footer={<>
        <ModalBtn T={T} ghost flex={0} style={{flex:"0 0 auto"}} onClick={exportTxt}>
          <Icon name="download" size={15}/> Export as Text
        </ModalBtn>
        <div style={{flex:1}}/>
        <ModalBtn T={T} primary flex={0} style={{flex:"0 0 auto",minWidth:120}} onClick={onClose}>Done</ModalBtn>
      </>}>
      {(excludedObjects.length + excludedLines.length) > 0 && (
        <div style={{margin:"14px 22px 0",padding:"9px 12px",background:T.accentBg,borderRadius:10,border:`1px solid ${T.accent}`,fontSize:11.5,color:T.text,display:"flex",gap:8,alignItems:"center"}}>
          <Icon name="sparkle" size={14} color={T.accent}/>
          <span><strong style={{color:T.accent}}>{excludedObjects.length + excludedLines.length} item{excludedObjects.length + excludedLines.length>1?"s":""} excluded</strong> from this estimate (toggle them back via Select → properties panel).</span>
        </div>
      )}
      <div style={{padding:"4px 22px 22px"}}>
        {(M.sprinklerCount>0||M.irrigPipe>0||M.dripPipe>0) && <>
          <Sect title="Irrigation"/>
          {M.hasWS && <Row ico="tap" label="Water source · tap connection" value="1 unit" note="Backflow preventer + timer recommended"/>}
          {M.zones>0 && <Row ico="size" label="Zone valve manifold" value={`${M.zones} zone${M.zones>1?"s":""}`} note="One solenoid valve per irrigation zone"/>}
          {M.sprinklerCount>0 && <>
            <Row highlight ico="spray" label="Sprinkler heads" value={`${M.sprinklerCount} heads`}
              note={M.sprinklersByZone.map((n,i)=>n>0?`Z${i+1}: ${n}`:"").filter(Boolean).join("  ·  ")}/>
            {M.emitters>0 && <Row ico="drip" label="Drip emitters" value={`${M.emitters} units`} note="Low-flow precision emitters"/>}
            {M.irrigPipe>0 && <>
              <Row highlight ico="pipe" label={`PVC supply pipe (${metric?"18mm":"¾\""})`} value={fmtL(M.irrigPipe)} note="Includes 15% for bends & fittings"/>
              <Row ico="size" label="Elbow fittings" value={`≈ ${M.elbows}`} note="90° elbows for direction changes"/>
              <Row ico="size" label="Tee fittings" value={`≈ ${M.tees}`} note="Branching to sprinkler heads"/>
              <Row ico="size" label="End caps" value={`≈ ${M.endcaps}`} note="One per pipe run end"/>
              <Row ico="size" label="Risers + head adapters" value={`${M.sprinklerCount} sets`} note="One riser + threaded adapter per head"/>
            </>}
            {M.dripPipe>0 && <Row ico="drip2" label="Drip tubing" value={fmtL(M.dripPipe)} note="Includes 15% for routing"/>}
          </>}
        </>}

        {Object.keys(M.groundCounts).length>0 && <>
          <Sect title="Ground Surfaces"/>
          {Object.entries(M.groundCounts).map(([g,cells])=>{
            const hints = {
              grass:"Turf seed or sod",concrete:"Ready-mix or pre-pour slabs",pavers:"Paving stones + levelling sand",
              decking:"Decking boards + joists + fixings",gravel:"Decorative gravel (~50mm deep)",
              mulch:"Organic mulch (~75mm deep)",sand:"Sand (~50mm deep)",
              turf:"Artificial turf roll + adhesive/pins",pebbles:"Decorative pebbles",water:"Pond liner or shell",dirt:""
            };
            return <Row key={g} ico="leaf" label={gLabel[g]||g} value={fmtA(cells)} note={hints[g]}/>;
          })}
        </>}

        {(M.fenceM>0||M.wallM>0||M.hedgeM>0||M.pathM>0) && <>
          <Sect title="Structures & Boundaries"/>
          {M.fenceM>0 && <Row ico="fence" label="Fencing" value={fmtL(M.fenceM)} note="Timber, composite, or metal panels + posts"/>}
          {M.wallM>0  && <Row ico="wall" label="Wall material" value={fmtL(M.wallM)} note="Blocks, brick, or poured concrete"/>}
          {M.hedgeM>0 && <Row ico="hedge" label="Hedge plants" value={`≈ ${M.hedgePlants} plants`} note={`${fmtL(M.hedgeM)} at 0.5 m spacing`}/>}
          {M.pathM>0  && <Row ico="path" label="Path material" value={fmtL(M.pathM)} note="Pavers, gravel, or stepping stones"/>}
        </>}

        {objects.length>0 && <>
          <Sect title="Garden Objects"/>
          {[
            ["tree","tree","Trees"],["shrub","shrub","Shrubs"],["flowerbed","flower","Flower beds"],
            ["raised_bed","bed","Raised beds"],["light","light","Garden lights"],
            ["bench","bench","Benches"],["firepit","fire","Fire pits"],
            ["gazebo","gazebo","Gazebos / pergolas"],["shed","shed","Sheds"],
            ["pool","pool","Pools"],["compost","compost","Compost bins"],
          ].map(([type,ico,label])=>{
            const n = objects.filter(o=>o.type===type && !o.excludeFromMaterials).length;
            if (!n) return null;
            return <Row key={type} ico={ico} label={label} value={`${n} unit${n>1?"s":""}`}/>;
          })}
        </>}

        <div style={{marginTop:16,padding:"11px 14px",background:T.bgAlt,borderRadius:11,border:`1px solid ${T.borderSoft}`,fontSize:11.5,color:T.text2,lineHeight:1.65}}>
          <strong style={{color:T.text}}>Planning estimates only.</strong> Verify quantities with your installer or supplier before purchasing. Pipe sizing, pressure requirements, and local code compliance should be confirmed by a licensed irrigator.
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── EXPORTS ──────────────────────────────────────────────────────────── */
Object.assign(window, {
  ModalShell, ModalBtn, NumberField, Stat,
  AutoIrrigateModal, PlotImportModal, YardSetupModal, MaterialsModal,
});
