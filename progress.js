const STORAGE_KEY = "eos_workout_tracker_v1";

document.getElementById("refreshBtn")?.addEventListener("click", () => location.reload());

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;
  }
}

function toNumber(x){
  if(x == null) return null;
  const s = String(x).trim();
  if(!s) return null;
  const cleaned = s.replace(/[^0-9.\-]/g,"");
  if(!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {month:"short", day:"numeric"});
}

function avg(arr){
  const xs = arr.filter(v => typeof v === "number" && Number.isFinite(v));
  if(!xs.length) return null;
  return xs.reduce((a,b)=>a+b,0)/xs.length;
}

function last(arr){ return arr.length ? arr[arr.length-1] : null; }

function setText(id, text){
  const el = document.getElementById(id);
  if(el) el.textContent = text;
}

/* Simple offline line chart renderer (no libraries) */
function drawLineChart(canvasId, labels, values, opts={}){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext("2d");

  // handle retina
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.height;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.scale(dpr, dpr);

  const W = cssW, H = cssH;
  ctx.clearRect(0,0,W,H);

  // Background
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(0,0,W,H);

  const pad = 28;
  const plotW = W - pad*2;
  const plotH = H - pad*2;

  const xs = values
    .map((v,i)=>({v, i}))
    .filter(p => typeof p.v === "number" && Number.isFinite(p.v));

  // No data
  if(xs.length === 0){
    ctx.fillStyle = "rgba(13,19,33,0.55)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("No data yet", pad, H/2);
    return;
  }

  let minV = Math.min(...xs.map(p=>p.v));
  let maxV = Math.max(...xs.map(p=>p.v));
  if(minV === maxV){ minV -= 1; maxV += 1; }

  const color = opts.color || "#3B82F6";
  const grid = "rgba(13,19,33,0.08)";
  const text = "rgba(13,19,33,0.55)";

  function xAt(i){
    if(labels.length <= 1) return pad + plotW/2;
    return pad + (i/(labels.length-1))*plotW;
  }
  function yAt(v){
    const t = (v - minV) / (maxV - minV);
    return pad + (1 - t) * plotH;
  }

  // Grid lines (3)
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for(let k=0;k<=2;k++){
    const y = pad + (k/2)*plotH;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(pad+plotW, y);
    ctx.stroke();
  }

  // Axes labels (min/max)
  ctx.fillStyle = text;
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(String(maxV.toFixed(0)), 6, pad+4);
  ctx.fillText(String(minV.toFixed(0)), 6, pad+plotH);

  // Line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  let started = false;
  for(let i=0;i<labels.length;i++){
    const v = values[i];
    if(typeof v !== "number" || !Number.isFinite(v)) continue;
    const x = xAt(i);
    const y = yAt(v);
    if(!started){
      ctx.moveTo(x,y);
      started = true;
    }else{
      ctx.lineTo(x,y);
    }
  }
  ctx.stroke();

  // Points
  ctx.fillStyle = color;
  for(let i=0;i<labels.length;i++){
    const v = values[i];
    if(typeof v !== "number" || !Number.isFinite(v)) continue;
    const x = xAt(i);
    const y = yAt(v);
    ctx.beginPath();
    ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fill();
  }

  // Last label
  const lastIndex = [...values].map((v,i)=>({v,i})).filter(p=>typeof p.v==="number" && Number.isFinite(p.v)).slice(-1)[0]?.i;
  if(lastIndex != null){
    ctx.fillStyle = text;
    const l = labels[lastIndex] || "";
    ctx.fillText(l, Math.max(pad, xAt(lastIndex)-12), H-8);
  }
}

function run(){
  const state = loadState();
  if(!state || !Array.isArray(state.workouts) || state.workouts.length === 0){
    setText("summaryPill", "No saved workouts yet. Begin workout → Finish & save.");
    setText("workoutsPill", "Workouts: 0");
    setText("lastPill", "Last: —");
    setText("bwHint", "Add BW in Quick log, then Finish & save.");
    setText("stepsHint", "Add steps in Quick log, then Finish & save.");
    setText("cardioHint", "Add cardio minutes, then Finish & save.");
    setText("completionHint", "Completion uses checked sets.");
    setText("repsHint", "Volume appears after you log sets (reps).");
    setText("tonnageHint", "Tonnage appears after you log weights + reps.");
    return;
  }

  const workouts = [...state.workouts].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const labels = workouts.map(w => fmtDate(w.date));

  const bw = workouts.map(w => toNumber(w.quickLog?.bw));
  const steps = workouts.map(w => toNumber(w.quickLog?.steps));
  const cardio = workouts.map(w => toNumber(w.quickLog?.cardio));
  const completion = workouts.map(w => toNumber(w.completion));

  // These exist for new workouts; older ones may not have them
  const totalReps = workouts.map(w => toNumber(w.totalReps));
  const tonnage = workouts.map(w => toNumber(w.tonnage));

  const lastW = last(workouts);
  setText("workoutsPill", `Workouts: ${workouts.length}`);
  setText("lastPill", `Last: ${fmtDate(lastW.date)} • ${lastW.dayName || ""}`);

  const parts = [];
  const bwAvg = avg(bw); if(bwAvg != null) parts.push(`Avg BW: ${bwAvg.toFixed(1)} lb`);
  const compAvg = avg(completion); if(compAvg != null) parts.push(`Avg completion: ${compAvg.toFixed(0)}%`);
  const stepsAvg = avg(steps); if(stepsAvg != null) parts.push(`Avg steps: ${stepsAvg.toFixed(0)}`);
  const cardioAvg = avg(cardio); if(cardioAvg != null) parts.push(`Avg cardio: ${cardioAvg.toFixed(0)} min`);
  setText("summaryPill", parts.length ? parts.join(" • ") : "Progress loaded");

  drawLineChart("bwChart", labels, bw, {color:"#0AA6A6"});
  drawLineChart("completionChart", labels, completion, {color:"#3B82F6"});
  drawLineChart("stepsChart", labels, steps, {color:"#8B5CF6"});
  drawLineChart("cardioChart", labels, cardio, {color:"#F59E0B"});
  drawLineChart("repsChart", labels, totalReps, {color:"#16A34A"});
  drawLineChart("tonnageChart", labels, tonnage, {color:"#EF4444"});

  setText("bwHint", bwAvg != null ? "Aim ~0.5–1.0 lb/week loss." : "No BW entries yet.");
  setText("completionHint", compAvg != null ? "Higher completion + consistency wins." : "No completion data yet.");
  setText("stepsHint", stepsAvg != null ? "Keep steps consistent for faster fat loss." : "No steps entries yet.");
  setText("cardioHint", cardioAvg != null ? "2–4 sessions/week is a great start." : "No cardio entries yet.");
  setText("repsHint", avg(totalReps) != null ? "Total reps per workout." : "Log reps/mark sets to see this.");
  setText("tonnageHint", avg(tonnage) != null ? "Total (weight×reps) per workout." : "Enter weights + reps to see this.");
}

run();
