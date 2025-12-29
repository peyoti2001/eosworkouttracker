/* EoS Workout Tracker — single-file vanilla JS app
   Features:
   - 5-day program (editable/swap exercises)
   - per-set tracking (weight/reps/done)
   - rest timer + installable PWA
   - export/import JSON for moving between devices
*/

const STORAGE_KEY = "eos_workout_tracker_v1";

const DEFAULT_PROGRAM = {
  version: 1,
  createdAt: new Date().toISOString(),
  programName: "Lean 5-Day (EoS-friendly)",
  days: [
    {
      id: "d1",
      label: "Day 1",
      name: "Chest & Triceps",
      focus: "Heavy push + triceps + core",
      warmup: "5–7 min incline walk + 2 lighter bench ramp sets",
      finisher: "Optional: 10–15 min incline treadmill (easy–moderate)",
      exercises: [
        ex("Horizontal barbell bench press", "Chest", "Barbell/bench", {sets:4, reps:"6–8", rest:"120–180s"}, [
          "Feet planted, shoulder blades squeezed back, slight arch.",
          "Lower to mid-chest with control; press up and back.",
          "Stop 1–2 reps before failure unless spotting."
        ]),
        ex("Incline barbell bench press", "Upper chest", "Barbell/bench", {sets:3, reps:"8–10", rest:"120s"}, [
          "Incline ~30° (not too steep).",
          "Elbows ~45° from torso; controlled touch; drive up."
        ]),
        ex("Single-arm chest fly on the machine", "Chest", "Machine", {sets:3, reps:"10–12", rest:"60–90s"}, [
          "Soft elbow bend; big stretch; squeeze across midline.",
          "Keep shoulders down; avoid shrugging."
        ]),
        ex("Decline machine chest press", "Lower chest", "Machine", {sets:3, reps:"10–12", rest:"90s"}, [
          "Set seat so handles line up mid-chest.",
          "Control down; press without locking shoulders forward."
        ]),
        ex("Chest dips", "Chest/Triceps", "Dip station", {sets:3, reps:"6–12 (AMRAP)", rest:"90s"}, [
          "Lean slightly forward for chest emphasis.",
          "Stop if you feel shoulder pinching; keep reps smooth."
        ], {caution: "Shoulders: avoid excessive depth."}),
        ex("Triceps pushdown (rope attachment)", "Triceps", "Cable", {sets:3, reps:"10–15", rest:"60–75s"}, [
          "Elbows pinned; spread rope at bottom; full extension.",
          "No body swing."
        ]),
        ex("Cable rope overhead triceps extension", "Triceps (long head)", "Cable", {sets:3, reps:"12–15", rest:"60–75s"}, [
          "Ribs down; elbows point forward; stretch behind head.",
          "Finish with full extension without flaring elbows."
        ]),
        ex("Abdominal crunch (machine assisted)", "Abs", "Machine", {sets:3, reps:"12–20", rest:"45–60s"}, [
          "Exhale hard at the top; slow on the way down.",
          "Avoid pulling with arms/neck."
        ])
      ]
    },
    {
      id: "d2",
      label: "Day 2",
      name: "Back & Biceps",
      focus: "Pull thickness + lats + biceps + core",
      warmup: "5 min rower + 1–2 light warm-up sets on pulldown",
      finisher: "Optional: 10 min easy bike or incline walk",
      exercises: [
        ex("Deadlift", "Posterior chain", "Barbell", {sets:3, reps:"3–5", rest:"180s"}, [
          "Brace hard before lifting; bar stays close.",
          "Push the floor away; lockout with glutes, not lean-back.",
          "If fatigue is high, swap to Romanian deadlift."
        ], {caution:"Use great form. Stop sets if your back rounds."}),
        ex("Wide grip lat pulldown", "Lats", "Machine/cable", {sets:4, reps:"8–12", rest:"90s"}, [
          "Pull elbows down to your pockets; chest proud.",
          "Control the stretch; no swinging."
        ]),
        ex("Single-arm cable row", "Mid-back", "Cable", {sets:3, reps:"10–12/side", rest:"60–90s"}, [
          "Rotate slightly; pull elbow toward hip; pause/squeeze.",
          "Keep shoulders down; avoid shrugging."
        ]),
        ex("Reverse wide grip seated cable row", "Upper back", "Cable", {sets:3, reps:"10–12", rest:"75–90s"}, [
          "Wide overhand grip; pull to upper abs.",
          "Keep torso stable; squeeze shoulder blades."
        ]),
        ex("Bent over two arm T-bar row", "Back thickness", "T-bar", {sets:3, reps:"8–10", rest:"120s"}, [
          "Hips back, torso ~45°; pull to lower chest/upper abs.",
          "No jerking; control eccentric."
        ]),
        ex("Barbell curl", "Biceps", "Barbell", {sets:3, reps:"8–12", rest:"60–90s"}, [
          "Elbows stay near ribs; full range; no sway.",
          "Slow lower; big squeeze."
        ]),
        ex("Incline dumbbell twist curl", "Biceps", "Dumbbells/bench", {sets:3, reps:"10–12", rest:"60–75s"}, [
          "Start neutral; supinate as you curl; keep shoulders back.",
          "Control the stretch at the bottom."
        ]),
        ex("Elbow plank", "Core", "Mat", {sets:3, reps:"40–60s", rest:"45–60s"}, [
          "Ribs down; squeeze glutes; push forearms into floor.",
          "Stop when form breaks."
        ])
      ]
    },
    {
      id: "d3",
      label: "Day 3",
      name: "Full Body / Abs",
      focus: "Arms + core + one lower + one push (pump + burn)",
      warmup: "5–7 min incline walk + shoulder/hip mobility",
      finisher: "10–15 min steady cardio (Zone 2)",
      exercises: [
        ex("Seated leg press", "Quads/Glutes", "Machine", {sets:3, reps:"12–15", rest:"90s"}, [
          "Feet shoulder-width; control depth; no butt lift.",
          "Drive through mid-foot; don’t lock knees hard."
        ]),
        ex("Romanian deadlift", "Hamstrings/Glutes", "Barbell", {sets:3, reps:"8–10", rest:"120s"}, [
          "Soft knees; hips back; feel hamstring stretch.",
          "Bar stays close; neutral spine."
        ]),
        ex("Hammer strength seated dips", "Triceps/Chest", "Machine", {sets:3, reps:"8–12", rest:"90s"}, [
          "Shoulders down; elbows track; full lockout.",
          "Control down; don’t bounce."
        ]),
        ex("EZ-bar preacher curl", "Biceps", "EZ-bar/preacher", {sets:3, reps:"10–12", rest:"60–75s"}, [
          "Slow eccentric; stop 1 rep before losing form.",
          "Keep upper arm planted."
        ]),
        ex("Inside grip rope curl", "Biceps", "Cable", {sets:3, reps:"12–15", rest:"60s"}, [
          "Elbows slightly forward; curl to forehead height; squeeze.",
          "Keep tension; no swinging."
        ]),
        ex("EZ-Bar overhead inside-grip tricep extension", "Triceps", "EZ-bar", {sets:3, reps:"10–12", rest:"75s"}, [
          "Elbows in; deep stretch; extend fully.",
          "Ribs down; avoid flaring elbows."
        ]),
        ex("Crunches with legs on an exercise ball", "Abs", "Ball", {sets:3, reps:"15–20", rest:"45–60s"}, [
          "Exhale at the top; slow down; keep neck neutral.",
          "Small range but hard squeeze."
        ]),
        ex("Incline treadmill walk (finisher)", "Cardio", "Treadmill", {sets:1, reps:"10–15 min", rest:"—"}, [
          "Incline 8–12%, easy pace, nose breathing if possible.",
          "Goal: steady sweat without gasping."
        ], {isCardio:true})
      ]
    },
    {
      id: "d4",
      label: "Day 4",
      name: "Shoulders & Arms",
      focus: "Delts + traps + arm pump",
      warmup: "5 min bike + band pull-aparts + light lateral raises",
      finisher: "Optional: 8–12 min easy cardio",
      exercises: [
        ex("Standing military press", "Shoulders", "Barbell", {sets:4, reps:"6–8", rest:"120–150s"}, [
          "Squeeze glutes; ribs down; press straight up.",
          "Head moves slightly back then through at top."
        ]),
        ex("Seated barbell shoulder press", "Shoulders", "Barbell/bench", {sets:3, reps:"8–10", rest:"120s"}, [
          "Set bench upright-ish; don’t overarch.",
          "Stop 1–2 reps before failure; keep bar path vertical."
        ]),
        ex("Standing dumbbell lateral raises", "Side delts", "Dumbbells", {sets:3, reps:"12–15", rest:"60–75s"}, [
          "Lead with elbows; slight forward lean; stop at shoulder height.",
          "Control down; no swinging."
        ]),
        ex("Cable front raise", "Front delts", "Cable", {sets:2, reps:"12–15", rest:"60s"}, [
          "Raise to eye level; ribs down; no momentum.",
          "Keep shoulder packed (down/back)."
        ]),
        ex("Bent-over dumbbell lateral raise (parallel grip)", "Rear delts", "Dumbbells", {sets:3, reps:"12–15", rest:"60–75s"}, [
          "Hips back; neutral spine; sweep elbows out.",
          "Pause at top; slow lower."
        ]),
        ex("Crossed-cable rear delt fly", "Rear delts", "Cable", {sets:3, reps:"12–15", rest:"60–75s"}, [
          "Cross handles; slight lean forward; pull wide with soft elbows.",
          "Don’t shrug; squeeze rear delts."
        ]),
        ex("Front barbell shrugs", "Traps", "Barbell", {sets:3, reps:"10–12", rest:"75–90s"}, [
          "Shoulders straight up; 1-sec hold at top.",
          "No rolling; keep neck neutral."
        ]),
        ex("Barbell upright row", "Delts/Traps", "Barbell", {sets:2, reps:"10–12", rest:"75s"}, [
          "Hands just outside hips; pull elbows up/out to mid-chest.",
          "Stop if you feel shoulder pinching."
        ], {caution:"Some people don’t tolerate upright rows — swap if needed."})
      ]
    },
    {
      id: "d5",
      label: "Day 5",
      name: "Legs",
      focus: "Squat pattern + posterior chain + calves",
      warmup: "5–7 min bike + hip openers + 2 squat ramp sets",
      finisher: "Optional: 10 min incline walk (easy)",
      exercises: [
        ex("Barbell squats", "Quads/Glutes", "Barbell", {sets:4, reps:"6–8", rest:"150–180s"}, [
          "Brace; sit between hips; knees track toes.",
          "Depth: as low as you can without losing back position."
        ], {caution:"Use safeties/spotter if heavy."}),
        ex("Romanian deadlift", "Hamstrings/Glutes", "Barbell", {sets:3, reps:"8–10", rest:"120s"}, [
          "Soft knees; hips back; bar close; big stretch.",
          "Stop just below kneecap if mobility limited."
        ]),
        ex("Seated leg press", "Quads/Glutes", "Machine", {sets:4, reps:"10–12", rest:"90–120s"}, [
          "Control depth; don’t lock knees; drive through mid-foot."
        ]),
        ex("Seated leg extensions", "Quads", "Machine", {sets:3, reps:"12–15", rest:"60–75s"}, [
          "Pause at top; slow down; don’t slam the stack."
        ]),
        ex("Standing bent-over hamstring curl", "Hamstrings", "Machine", {sets:3, reps:"12–15", rest:"60–75s"}, [
          "Hips square; squeeze hard at top; slow lower."
        ]),
        ex("Seated calf raises", "Calves (soleus)", "Machine", {sets:4, reps:"12–20", rest:"45–60s"}, [
          "Full stretch at bottom; big squeeze at top (1 sec)."
        ]),
        ex("Machine calf raises", "Calves (gastrocnemius)", "Machine", {sets:3, reps:"10–15", rest:"45–60s"}, [
          "Full range; don’t bounce; control the bottom stretch."
        ])
      ]
    }
  ],
  // optional swap library (same-ish equipment you’ll find at EoS)
  swapLibrary: {
    "Chest": ["Dumbbell bench press", "Incline dumbbell press", "Cable fly (standing)", "Pec deck"],
    "Triceps": ["Skull crushers (EZ-bar)", "Cable single-arm pushdown", "Close-grip bench press"],
    "Back": ["Chest-supported row", "Assisted pull-up", "Straight-arm pulldown", "Dumbbell row"],
    "Biceps": ["Cable curl (bar)", "Hammer curls", "Spider curls"],
    "Legs": ["Hack squat", "Bulgarian split squat", "Walking lunges", "Leg curl (seated/lying)"],
    "Shoulders": ["Dumbbell shoulder press", "Machine shoulder press", "Face pulls"]
  }
};

function ex(name, muscle, equipment, scheme, steps, opts={}){
  return {
    id: slug(name),
    name, muscle, equipment,
    sets: scheme.sets,
    reps: scheme.reps,
    rest: scheme.rest,
    steps,
    caution: opts.caution || "",
    isCardio: !!opts.isCardio,
    // videoUrl is optional; user can paste a link (YouTube share URL works)
    videoUrl: opts.videoUrl || "",
    // for convenience: an external search link
    searchQuery: encodeURIComponent(name + " proper form"),
  };
}

function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }

/** ---------- State ---------- **/
let state = loadState();
let activeDayId = state.activeDayId || DEFAULT_PROGRAM.days[0].id;
let workoutActive = false;

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return bootstrap();
    const parsed = JSON.parse(raw);
    // merge defaults if needed
    return mergeWithDefaults(parsed);
  }catch{
    return bootstrap();
  }
}
function bootstrap(){
  return {
    program: DEFAULT_PROGRAM,
    activeDayId: DEFAULT_PROGRAM.days[0].id,
    workouts: [],         // history entries
    dayProgress: {},      // per-day last inputs
    quickLog: { bw:"", steps:"", cardio:"", notes:"" }
  };
}
function mergeWithDefaults(s){
  const base = bootstrap();
  // keep user data but ensure required structure exists
  const program = s.program?.days?.length ? s.program : DEFAULT_PROGRAM;
  return {
    ...base,
    ...s,
    program,
    activeDayId: s.activeDayId || base.activeDayId,
    workouts: Array.isArray(s.workouts) ? s.workouts : [],
    dayProgress: s.dayProgress || {},
    quickLog: s.quickLog || base.quickLog
  };
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** ---------- Rendering ---------- **/
const dayTabs = document.getElementById("dayTabs");
const exerciseList = document.getElementById("exerciseList");
const dayMeta = document.getElementById("dayMeta");
const todayLabel = document.getElementById("todayLabel");
const workoutStatus = document.getElementById("workoutStatus");
const weekDone = document.getElementById("weekDone");
const beginBtn = document.getElementById("beginBtn");
const finishBtn = document.getElementById("finishBtn");
const restBtn = document.getElementById("restBtn");

const bwInput = document.getElementById("bwInput");
const stepsInput = document.getElementById("stepsInput");
const cardioInput = document.getElementById("cardioInput");
const notesInput = document.getElementById("notesInput");

function render(){
  const program = state.program;
  const days = program.days;
  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  // tabs
  dayTabs.innerHTML = "";
  days.forEach(d => {
    const b = document.createElement("button");
    b.className = "tab" + (d.id === activeDay.id ? " active" : "");
    b.textContent = d.label + " • " + d.name;
    b.onclick = () => { activeDayId = d.id; state.activeDayId = d.id; saveState(); workoutActive=false; syncButtons(); render(); };
    dayTabs.appendChild(b);
  });

  todayLabel.textContent = activeDay.label;
  dayMeta.innerHTML = `
    <div class="metaLeft">
      <div class="metaTitle">${escapeHtml(activeDay.name)}</div>
      <div class="metaHint"><b>Focus:</b> ${escapeHtml(activeDay.focus)} • <b>Warm-up:</b> ${escapeHtml(activeDay.warmup)} • <b>Finisher:</b> ${escapeHtml(activeDay.finisher)}</div>
    </div>
    <div class="metaRight">
      <span class="tag accent">${computeDayCompletion(activeDay.id)}% done</span>
      <button class="btn ghost smallBtn" id="shuffleBtn">Shuffle/swap</button>
    </div>
  `;

  document.getElementById("shuffleBtn").onclick = () => openShuffle(activeDay);

  // exercises
  exerciseList.innerHTML = "";
  activeDay.exercises.forEach((e, idx) => {
    exerciseList.appendChild(renderExerciseCard(activeDay, e, idx));
  });

  // quick log
  bwInput.value = state.quickLog.bw || "";
  stepsInput.value = state.quickLog.steps || "";
  cardioInput.value = state.quickLog.cardio || "";
  notesInput.value = state.quickLog.notes || "";

  // week progress
  weekDone.textContent = computeWeekDone();

  // history
  renderHistory();

  syncButtons();
}

function renderExerciseCard(day, e, idx){
  const wrapper = document.createElement("div");
  wrapper.className = "exercise";

  const prog = getProgress(day.id, e.id);
  const setsCount = e.sets;
  const tableRows = [];
  for(let i=0; i<setsCount; i++){
    const row = prog.sets?.[i] || { w:"", r:"", done:false };
    tableRows.push(`
      <tr>
        <td>Set ${i+1}</td>
        <td><input inputmode="decimal" placeholder="lb" data-k="w" data-i="${i}" value="${escapeAttr(row.w)}" ${workoutActive ? "" : "disabled"}></td>
        <td><input inputmode="numeric" placeholder="reps" data-k="r" data-i="${i}" value="${escapeAttr(row.r)}" ${workoutActive ? "" : "disabled"}></td>
        <td class="doneCell"><input type="checkbox" data-k="done" data-i="${i}" ${row.done ? "checked" : ""} ${workoutActive ? "" : "disabled"}></td>
      </tr>
    `);
  }

  const pct = computeExerciseCompletion(day.id, e.id, setsCount);

  wrapper.innerHTML = `
    <div class="exTop">
      <div>
        <div class="exName">${escapeHtml(e.name)}</div>
        <div class="exTags">
          <span class="tag accent">${pct}%</span>
          <span class="tag">${escapeHtml(e.muscle)}</span>
          <span class="tag">${escapeHtml(e.equipment)}</span>
          <span class="tag">Sets: <b>${e.sets}</b></span>
          <span class="tag">Reps: <b>${escapeHtml(e.reps)}</b></span>
          <span class="tag">Rest: <b>${escapeHtml(e.rest)}</b></span>
        </div>
      </div>
      <div class="exActions">
        <button class="btn ghost smallBtn" data-act="video">Video</button>
        <button class="btn ghost smallBtn" data-act="swap">Swap</button>
      </div>
    </div>

    <div class="exBody">
      <div>
        <details class="howto">
          <summary>How to do it (quick cues)</summary>
          ${e.caution ? `<div class="demoBox"><b>Heads up:</b> ${escapeHtml(e.caution)}</div>` : ""}
          <ul>${e.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
          <div class="demoBox">
            <div class="demoRow">
              <div class="demoHint">Mini “rep tempo” animation (not a full video). Tap <b>Video</b> to open a real demo.</div>
              <a class="btn ghost smallBtn" href="https://www.youtube.com/results?search_query=${e.searchQuery}" target="_blank" rel="noopener">Search demo</a>
            </div>
            <div class="demoAnim" aria-hidden="true">
              <div class="repLine"></div>
              <div class="repDot"></div>
            </div>
          </div>
        </details>
      </div>

      <div class="track">
        <div class="trackHead">
          <div>
            <div class="trackTitle">Track sets</div>
            <div class="trackSmall">Fill weight + reps, check done. (Only editable after “Begin workout”.)</div>
          </div>
          <div class="trackSmall">${pct}% complete</div>
        </div>
        <table class="setTable">
          <thead>
            <tr><th>Set</th><th>Weight</th><th>Reps</th><th>Done</th></tr>
          </thead>
          <tbody>${tableRows.join("")}</tbody>
        </table>
      </div>
    </div>
  `;

  // handlers
  wrapper.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", () => {
      const k = inp.dataset.k;
      const i = Number(inp.dataset.i);
      const p = getProgress(day.id, e.id);
      p.sets = p.sets || [];
      p.sets[i] = p.sets[i] || { w:"", r:"", done:false };
      if(k === "done") p.sets[i].done = inp.checked;
      if(k === "w") p.sets[i].w = inp.value;
      if(k === "r") p.sets[i].r = inp.value;
      setProgress(day.id, e.id, p);
      saveState();
      render(); // keep it simple
    });
    if(inp.type === "checkbox"){
      inp.addEventListener("change", () => inp.dispatchEvent(new Event("input")));
    }
  });

  wrapper.querySelector('[data-act="video"]').onclick = () => openVideoPrompt(day, e);
  wrapper.querySelector('[data-act="swap"]').onclick = () => swapExercisePrompt(day, e);

  return wrapper;
}

/** ---------- Progress helpers ---------- **/
function getProgress(dayId, exId){
  const day = state.dayProgress[dayId] || {};
  return day[exId] || { sets: [] };
}
function setProgress(dayId, exId, progress){
  state.dayProgress[dayId] = state.dayProgress[dayId] || {};
  state.dayProgress[dayId][exId] = progress;
}
function computeExerciseCompletion(dayId, exId, setsCount){
  const p = getProgress(dayId, exId);
  const done = (p.sets || []).filter(s => s?.done).length;
  return Math.round((done / setsCount) * 100);
}
function computeDayCompletion(dayId){
  const day = state.program.days.find(d => d.id === dayId);
  if(!day) return 0;
  const totals = day.exercises.reduce((acc, e) => {
    const pct = computeExerciseCompletion(dayId, e.id, e.sets);
    acc.sum += pct;
    acc.n += 1;
    return acc;
  }, {sum:0, n:0});
  return totals.n ? Math.round(totals.sum / totals.n) : 0;
}
function computeWeekDone(){
  // consider a day “done” at >= 85%
  const days = state.program.days;
  return days.filter(d => computeDayCompletion(d.id) >= 85).length;
}

/** ---------- Workflow buttons ---------- **/
function syncButtons(){
  workoutStatus.textContent = workoutActive ? "In progress" : "Not started";
  beginBtn.disabled = workoutActive;
  finishBtn.disabled = !workoutActive;
  restBtn.disabled = !workoutActive;
}

beginBtn.onclick = () => { workoutActive = true; syncButtons(); render(); };
finishBtn.onclick = () => {
  const day = state.program.days.find(d => d.id === activeDayId);
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: new Date().toISOString(),
    dayId: day.id,
    dayName: day.name,
    completion: computeDayCompletion(day.id),
    quickLog: {...state.quickLog}
  };
  // Update quickLog from inputs
  state.quickLog.bw = bwInput.value.trim();
  state.quickLog.steps = stepsInput.value.trim();
  state.quickLog.cardio = cardioInput.value.trim();
  state.quickLog.notes = notesInput.value.trim();
  entry.quickLog = {...state.quickLog};
  // Snapshot training volume (reps + tonnage) and set log for graphs/records
  entry.volume = computeVolumeForDay(day.id);
  entry.totalReps = entry.volume.totalReps; // backward-friendly fields
  entry.tonnage = entry.volume.tonnage;
  entry.setLog = snapshotSetLogForDay(day.id);


  state.workouts.unshift(entry);
  state.workouts = state.workouts.slice(0, 30);
  workoutActive = false;
  saveState();
  render();
};

bwInput.oninput = () => { state.quickLog.bw = bwInput.value.trim(); saveState(); };
stepsInput.oninput = () => { state.quickLog.steps = stepsInput.value.trim(); saveState(); };
cardioInput.oninput = () => { state.quickLog.cardio = cardioInput.value.trim(); saveState(); };
notesInput.oninput = () => { state.quickLog.notes = notesInput.value.trim(); saveState(); };

/** ---------- Swap / Shuffle ---------- **/
function swapExercisePrompt(day, e){
  const lib = state.program.swapLibrary || DEFAULT_PROGRAM.swapLibrary;
  const buckets = Object.keys(lib);
  // try to pick a bucket based on muscle name
  const guessBucket = buckets.find(b => e.muscle.toLowerCase().includes(b.toLowerCase())) ||
                      buckets.find(b => e.name.toLowerCase().includes(b.toLowerCase())) ||
                      "Shoulders";
  const choices = (lib[guessBucket] || []).slice();
  if(!choices.length){
    alert("No swap options available for this category yet. You can edit the code/library to add more.");
    return;
  }
  const pick = prompt(
    `Swap “${e.name}”\nCategory: ${guessBucket}\n\nType one of these options exactly:\n- ${choices.join("\n- ")}`,
    choices[0]
  );
  if(!pick) return;
  const chosen = choices.find(c => c.toLowerCase() === pick.toLowerCase());
  if(!chosen){
    alert("Didn’t match an option. Try again.");
    return;
  }
  // replace exercise name but keep scheme (sets/reps/rest). Steps become generic.
  const newEx = {
    ...e,
    id: slug(chosen),
    name: chosen,
    steps: [
      "Use controlled reps and full range of motion.",
      "Keep core braced and avoid swinging.",
      "Stop 1–2 reps before form breaks."
    ],
    searchQuery: encodeURIComponent(chosen + " proper form")
  };

  const idx = day.exercises.findIndex(x => x.id === e.id);
  if(idx >= 0){
    day.exercises[idx] = newEx;
    // move progress if user wants (we'll just reset for the swapped movement)
    state.dayProgress[day.id] = state.dayProgress[day.id] || {};
    state.dayProgress[day.id][newEx.id] = { sets: [] };
    saveState();
    render();
  }
}

function openShuffle(day){
  const ok = confirm(
    "Quick shuffle idea:\n\n1) Keep your main lift first (bench / deadlift / squat / press).\n2) Swap 1–2 accessory moves for variety.\n\nTap OK to auto-swap ONE accessory (random) from the library."
  );
  if(!ok) return;

  // pick an accessory (not the first exercise), swap if we can
  const startIndex = Math.min(1, day.exercises.length-1);
  const candidates = day.exercises.slice(startIndex).filter(x => !x.isCardio);
  if(!candidates.length) return;

  const target = candidates[Math.floor(Math.random()*candidates.length)];
  const lib = state.program.swapLibrary || DEFAULT_PROGRAM.swapLibrary;
  const allOptions = Object.values(lib).flat();
  const choice = allOptions[Math.floor(Math.random()*allOptions.length)];
  const newEx = {
    ...target,
    id: slug(choice),
    name: choice,
    steps: [
      "Use controlled reps and full range of motion.",
      "Keep core braced and avoid swinging.",
      "Stop 1–2 reps before form breaks."
    ],
    searchQuery: encodeURIComponent(choice + " proper form")
  };

  const idx = day.exercises.findIndex(x => x.id === target.id);
  day.exercises[idx] = newEx;
  state.dayProgress[day.id] = state.dayProgress[day.id] || {};
  state.dayProgress[day.id][newEx.id] = { sets: [] };
  saveState();
  render();
}

/** ---------- Video prompt (optional) ---------- **/
function openVideoPrompt(day, e){
  const current = e.videoUrl || "";
  const url = prompt(
    `Paste a video URL for:\n${e.name}\n\nTip: YouTube share links work.\nLeave empty to keep none.`,
    current
  );
  if(url === null) return;
  e.videoUrl = url.trim();

  if(e.videoUrl){
    window.open(e.videoUrl, "_blank", "noopener");
  }else{
    window.open(`https://www.youtube.com/results?search_query=${e.searchQuery}`, "_blank", "noopener");
  }
  saveState();
}

/** ---------- History ---------- **/
function renderHistory(){
  const wrap = document.getElementById("history");
  wrap.innerHTML = "";
  const items = state.workouts || [];
  if(!items.length){
    wrap.innerHTML = `<div class="small muted">No workouts saved yet. Hit “Begin workout”, track sets, then “Finish & save”.</div>`;
    return;
  }
  items.slice(0,8).forEach(w => {
    const el = document.createElement("div");
    el.className = "histItem";
    const dt = new Date(w.date);
    el.innerHTML = `
      <div class="histTop">
        <div class="histTitle">${escapeHtml(w.dayName)}</div>
        <div class="small muted">${dt.toLocaleString()}</div>
      </div>
      <div class="small muted">Completion: <b>${w.completion}%</b> • BW: ${escapeHtml(w.quickLog?.bw || "—")} • Steps: ${escapeHtml(w.quickLog?.steps || "—")} • Cardio: ${escapeHtml(w.quickLog?.cardio || "—")} min</div>
      ${w.quickLog?.notes ? `<div class="small muted">Notes: ${escapeHtml(w.quickLog.notes)}</div>` : ""}
    `;
    wrap.appendChild(el);
  });
}

/** ---------- Export/Import ---------- **/
const exportBtn = document.getElementById("exportBtn");
const exportDialog = document.getElementById("exportDialog");
const exportText = document.getElementById("exportText");
const downloadExportBtn = document.getElementById("downloadExportBtn");
const importFile = document.getElementById("importFile");
const resetAllBtn = document.getElementById("resetAllBtn");

exportBtn.onclick = () => {
  exportText.value = JSON.stringify(state, null, 2);
  exportDialog.showModal();
};

downloadExportBtn.onclick = (e) => {
  e.preventDefault();
  const blob = new Blob([exportText.value], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "eos-workout-tracker-export.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

importFile.onchange = async () => {
  const file = importFile.files?.[0];
  if(!file) return;
  const text = await file.text();
  try{
    const parsed = JSON.parse(text);
    state = mergeWithDefaults(parsed);
    activeDayId = state.activeDayId;
    saveState();
    render();
    alert("Import successful!");
  }catch{
    alert("Could not import. Make sure it’s a valid JSON export from this app.");
  }finally{
    importFile.value = "";
  }
};

resetAllBtn.onclick = () => {
  const ok = confirm("Reset EVERYTHING (program edits + set logs + history)?");
  if(!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state = bootstrap();
  activeDayId = state.activeDayId;
  workoutActive = false;
  saveState();
  render();
};

/** ---------- Rest Timer ---------- **/
let timer = { remaining: 0, running: false, interval: null };
const timerValue = document.getElementById("timerValue");
const timerValue2 = document.getElementById("timerValue2");
const restDialog = document.getElementById("restDialog");

document.getElementById("t60").onclick = () => startTimer(60);
document.getElementById("t90").onclick = () => startTimer(90);
document.getElementById("t120").onclick = () => startTimer(120);
document.getElementById("tStop").onclick = () => stopTimer();

document.getElementById("t60b").onclick = (e) => { e.preventDefault(); startTimer(60); };
document.getElementById("t90b").onclick = (e) => { e.preventDefault(); startTimer(90); };
document.getElementById("t120b").onclick = (e) => { e.preventDefault(); startTimer(120); };
document.getElementById("tStopb").onclick = (e) => { e.preventDefault(); stopTimer(); };

restBtn.onclick = () => restDialog.showModal();

function startTimer(seconds){
  stopTimer();
  timer.remaining = seconds;
  timer.running = true;
  tick();
  timer.interval = setInterval(() => {
    timer.remaining -= 1;
    tick();
    if(timer.remaining <= 0){
      stopTimer();
      buzz();
    }
  }, 1000);
}

function stopTimer(){
  timer.running = false;
  if(timer.interval) clearInterval(timer.interval);
  timer.interval = null;
  timer.remaining = 0;
  tick();
}

function tick(){
  const mm = String(Math.floor(timer.remaining/60)).padStart(2,"0");
  const ss = String(timer.remaining%60).padStart(2,"0");
  timerValue.textContent = `${mm}:${ss}`;
  timerValue2.textContent = `${mm}:${ss}`;
}

function buzz(){
  try{ navigator.vibrate?.([200, 100, 200]); }catch{}
  // simple beep
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 180);
  }catch{}
  alert("Rest over — go!");
}

/** ---------- PWA: service worker + install ---------- **/
if("serviceWorker" in navigator){
  window.addEventListener("load", async () => {
    try{ await navigator.serviceWorker.register("./sw.js"); }catch{}
  });
}

let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.onclick = async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
};

/** ---------- Utils ---------- **/

function toNumber(x){
  if(x == null) return null;
  const s = String(x).trim();
  if(!s) return null;
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if(!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function computeVolumeForDay(dayId){
  const day = state.program.days.find(d => d.id === dayId);
  if(!day) return { totalReps: 0, tonnage: 0, perExercise: [] };

  let totalReps = 0;
  let tonnage = 0;
  const perExercise = [];

  day.exercises.forEach(ex => {
    const p = getProgress(dayId, ex.id);
    const sets = Array.isArray(p.sets) ? p.sets : [];
    let exReps = 0;
    let exTonnage = 0;

    sets.forEach(s => {
      if(!s) return;

      const reps = toNumber(s.r);
      const weight = toNumber(s.w);

      // If user forgets to check "Done", still count reps if entered.
      const countThis = (s.done === true) || (reps != null && reps > 0);

      if(!countThis) return;
      if(reps != null && reps > 0){
        exReps += reps;
        totalReps += reps;
        if(weight != null && weight > 0){
          exTonnage += reps * weight;
          tonnage += reps * weight;
        }
      }
    });

    perExercise.push({
      id: ex.id,
      name: ex.name,
      reps: Math.round(exReps),
      tonnage: Math.round(exTonnage)
    });
  });

  return { totalReps: Math.round(totalReps), tonnage: Math.round(tonnage), perExercise };
}

function snapshotSetLogForDay(dayId){
  const day = state.program.days.find(d => d.id === dayId);
  if(!day) return [];
  return day.exercises.map(ex => {
    const p = getProgress(dayId, ex.id);
    const sets = Array.isArray(p.sets) ? p.sets : [];
    const cleanedSets = sets.map(s => ({
      w: (s?.w ?? ""),
      r: (s?.r ?? ""),
      done: !!(s?.done)
    }));
    return { id: ex.id, name: ex.name, sets: cleanedSets };
  });
}

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function escapeAttr(s){ return escapeHtml(s).replace(/"/g, "&quot;"); }

/** ---------- Init ---------- **/
render();
