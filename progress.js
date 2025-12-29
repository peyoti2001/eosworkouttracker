// Progress graphs (LocalStorage only)
// Reads workout history saved by app.js and renders simple canvas charts.
// No external libraries needed.

const STORAGE_KEY = "eos_workout_tracker_v1";

const refreshBtn = document.getElementById("refreshBtn");
refreshBtn?.addEventListener("click", () => location.reload());

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
  // keep digits, dot, minus
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

function niceRange(min, max){
  if(min === max){
    const pad = Math.abs(min) * 0.1 + 1;
    return [min - pad, max + pad];
  }
  const span = max - min;
  const pad = span * 0.08;
  return [min - pad, max + pad];
}

function drawChart(canvasId, labels, data, opts){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  // HiDPI for iPhone
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.scale(dpr, dpr);

  const padL = 44, padR = 12, padT = 12, padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Background
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = opts.bg || "rgba(255,255,255,0.0)";
  ctx.fillRect(0,0,w,h);

  // Extract numeric points
  const points = data.map((v, i) => ({v, i})).filter(p => typeof p.v === "number" && Number.isFinite(p.v));
  if(points.length < 2){
    // Draw "not enough data"
    ctx.fillStyle = opts.text || "#52627B";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText("Not enough data yet", padL, padT + 18);
    return;
  }

  let min = Math.min(...points.map(p => p.v));
  let max = Math.max(...points.map(p => p.v));
  [min, max] = niceRange(min, max);

  // Grid + axes
  const gridLines = 4;
  ctx.strokeStyle = opts.grid || "rgba(13,19,33,.10)";
  ctx.lineWidth = 1;

  for(let g=0; g<=gridLines; g++){
    const y = padT + (plotH * g / gridLines);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
  }

  // Y labels
  ctx.fillStyle = opts.muted || "#52627B";
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  for(let g=0; g<=gridLines; g++){
    const value = max - (max - min) * (g / gridLines);
    const y = padT + (plotH * g / gridLines);
    ctx.fillText(formatValue(value, opts), 6, y + 4);
  }

  // X labels (every ~3-5 points)
  const step = Math.max(1, Math.round(labels.length / 5));
  for(let i=0; i<labels.length; i+=step){
    const x = padL + (plotW * (i / (labels.length - 1)));
    ctx.fillText(labels[i], x - 10, h - 10);
  }

  // Line
  const color = opts.color || "#3B82F6";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  let started = false;

  for(let i=0; i<data.length; i++){
    const v = data[i];
    if(!(typeof v === "number" && Number.isFinite(v))) continue;

    const x = padL + (plotW * (i / (labels.length - 1)));
    const t = (v - min) / (max - min);
    const y = padT + plotH - (t * plotH);

    if(!started){
      ctx.moveTo(x, y);
      started = true;
    }else{
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Fill under line (subtle)
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.lineTo(padL, padT + plotH);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, 0.12);
  ctx.fill();

  // Points
  ctx.fillStyle = color;
  for(let i=0; i<data.length; i++){
    const v = data[i];
    if(!(typeof v === "number" && Number.isFinite(v))) continue;

    const x = padL + (plotW * (i / (labels.length - 1)));
    const t = (v - min) / (max - min);
    const y = padT + plotH - (t * plotH);

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function formatValue(v, opts){
  if(opts.kind === "int") return String(Math.round(v));
  if(opts.kind === "pct") return String(Math.round(v)) + "%";
  if(opts.kind === "tonnage") return compact(Math.round(v));
  if(opts.kind === "lb") return (Math.round(v * 10) / 10).toFixed(1);
  return (Math.round(v * 10) / 10).toFixed(1);
}

function compact(n){
  if(!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if(abs >= 1_000_000) return (n/1_000_000).toFixed(1) + "M";
  if(abs >= 1_000) return (n/1_000).toFixed(1) + "k";
  return String(n);
}

function hexToRgba(hex, a){
  const h = hex.replace("#","");
  const full = h.length === 3 ? h.split("").map(ch => ch+ch).join("") : h;
  const r = parseInt(full.slice(0,2), 16);
  const g = parseInt(full.slice(2,4), 16);
  const b = parseInt(full.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function run(){
  const state = loadState();
  if(!state || !Array.isArray(state.workouts) || state.workouts.length === 0){
    setText("summaryPill", "No saved workouts yet. Do a workout → Finish & save.");
    setText("workoutsPill", "Workouts: 0");
    setText("lastPill", "Last: —");
    setText("bwHint", "Add bodyweight in Quick log → BW, then Finish & save.");
    setText("stepsHint", "Add steps in Quick log → Steps, then Finish & save.");
    setText("cardioHint", "Add cardio minutes in Quick log → Cardio, then Finish & save.");
    setText("completionHint", "Completion is based on checked sets.");
    setText("repsHint", "Reps are summed from your tracked sets (best if you check Done).");
    setText("tonnageHint", "Tonnage = weight × reps (only when weight is entered).");
    // Draw empty charts with message
    drawChart("bwChart", ["—"], [null], {color:"#0AA6A6", kind:"lb"});
    drawChart("completionChart", ["—"], [null], {color:"#3B82F6", kind:"pct"});
    drawChart("cardioChart", ["—"], [null], {color:"#F59E0B", kind:"int"});
    drawChart("stepsChart", ["—"], [null], {color:"#8B5CF6", kind:"int"});
    drawChart("repsChart", ["—"], [null], {color:"#10B981", kind:"int"});
    drawChart("tonnageChart", ["—"], [null], {color:"#EF4444", kind:"tonnage"});
    return;
  }

  // oldest -> newest
  const workouts = [...state.workouts].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const labels = workouts.map(w => fmtDate(w.date));

  const bw = workouts.map(w => toNumber(w.quickLog?.bw));
  const steps = workouts.map(w => toNumber(w.quickLog?.steps));
  const cardio = workouts.map(w => toNumber(w.quickLog?.cardio));
  const completion = workouts.map(w => toNumber(w.completion));
  const reps = workouts.map(w => toNumber(w.volume?.totalReps ?? w.totalReps));
  const tonnage = workouts.map(w => toNumber(w.volume?.tonnage ?? w.tonnage));

  const bwAvg = avg(bw);
  const compAvg = avg(completion);
  const stepsAvg = avg(steps);
  const cardioAvg = avg(cardio);
  const repsAvg = avg(reps);
  const tonnageAvg = avg(tonnage);

  const lastW = last(workouts);
  setText("workoutsPill", `Workouts: ${workouts.length}`);
  setText("lastPill", `Last: ${fmtDate(lastW.date)} • ${lastW.dayName || ""}`);

  const parts = [];
  if(bwAvg != null) parts.push(`Avg BW: ${bwAvg.toFixed(1)} lb`);
  if(compAvg != null) parts.push(`Avg completion: ${compAvg.toFixed(0)}%`);
  if(repsAvg != null) parts.push(`Avg reps: ${Math.round(repsAvg)}`);
  if(tonnageAvg != null) parts.push(`Avg tonnage: ${compact(Math.round(tonnageAvg))}`);
  setText("summaryPill", parts.length ? parts.join(" • ") : "Progress loaded");

  drawChart("bwChart", labels, bw, {color:"#0AA6A6", kind:"lb"});
  drawChart("completionChart", labels, completion, {color:"#3B82F6", kind:"pct"});
  drawChart("cardioChart", labels, cardio, {color:"#F59E0B", kind:"int"});
  drawChart("stepsChart", labels, steps, {color:"#8B5CF6", kind:"int"});
  drawChart("repsChart", labels, reps, {color:"#10B981", kind:"int"});
  drawChart("tonnageChart", labels, tonnage, {color:"#EF4444", kind:"tonnage"});

  setText("bwHint", bwAvg != null ? `Goal: ~0.5–1.0 lb/week loss for a lean cut.` : `No BW entries yet.`);
  setText("completionHint", compAvg != null ? `Higher completion + consistency = faster progress.` : `No completion data yet.`);
  setText("stepsHint", stepsAvg != null ? `Steps drive fat loss when consistent.` : `No steps entries yet.`);
  setText("cardioHint", cardioAvg != null ? `2–4 cardio sessions/week is a great start.` : `No cardio entries yet.`);
  setText("repsHint", repsAvg != null ? `More reps (with good form) usually = more total work.` : `No rep volume saved yet.`);
  setText("tonnageHint", tonnageAvg != null ? `Tonnage rises as weights & reps improve.` : `No tonnage saved yet.`);
}

run();
