// Lumipod v2: mobile-first, evolving creature, explicit daily reward & boosts
const KEY = 'lumipod-save-v2';
const nowISO = () => new Date().toISOString();
const todayStr = () => nowISO().slice(0,10);

// Explicit daily reward contents
const DAILY_REWARD_NAME = 'LumiSeed';
const DAILY_REWARD = { hunger:+15, hygiene:+15, fun:+15, energy:+15, boosts:+1 };

// Boost definition (power-up)
const BOOST_NAME = 'Glow Burst';
const BOOST = { durationMs: 60_000, // 60s
  multipliers: { feed: 1.8, clean: 1.6, play: 1.7, rest: 1.5 },
  decayFactor: 0.4 // during boost, decay is reduced to 40%
};

const defaultState = {
  hunger: 50, hygiene: 50, fun: 50, energy: 50,
  lastTick: Date.now(),
  day: 1,
  score: 0,
  lastLoginDate: todayStr(),
  rewardClaimedDate: null,
  boostsOwned: 0,
  activeBoostUntil: 0
};

function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if(!raw) return { ...defaultState };
    const s = JSON.parse(raw);
    return { ...defaultState, ...s };
  } catch { return { ...defaultState }; }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
let state = load();

// UI elements
const logEl = document.getElementById('log');
const dayEl = document.getElementById('day');
const scoreEl = document.getElementById('score');
const dailyEl = document.getElementById('daily');
const boostCountEl = document.getElementById('boostCount');
const useBoostBtn = document.getElementById('useBoost');
const claimDailyBtn = document.getElementById('claimDaily');
const statusBadges = document.getElementById('statusBadges');
const barsWrap = document.getElementById('bars');

// Creature elements
const bodyPath = document.getElementById('body');
const face = document.getElementById('face');
const eyeL = document.getElementById('eyeL');
const eyeR = document.getElementById('eyeR');
const mouth = document.getElementById('mouth');
const aura = document.getElementById('aura');

function log(msg){ logEl.textContent = msg; }
const clamp = (v) => Math.max(0, Math.min(100, v));
const health = () => (state.hunger + state.hygiene + state.fun + state.energy) / 4;
const boosted = () => Date.now() < state.activeBoostUntil;

// Progress bars
function ensureBars(){
  if (barsWrap.children.length) return;
  ['hunger','hygiene','fun','energy'].forEach(k=>{
    const row = document.createElement('div');
    row.style.display='grid'; row.style.gridTemplateColumns='100px 1fr'; row.style.alignItems='center'; row.style.gap='8px';
    const label = document.createElement('div'); label.textContent = k;
    const bar = document.createElement('div'); bar.style.height='10px'; bar.style.border='1px solid #2b2b45'; bar.style.borderRadius='999px'; bar.style.overflow='hidden';
    const fill = document.createElement('div'); fill.style.height='100%'; fill.style.background='#7c3aed'; fill.style.width='50%'; fill.dataset.key = k;
    bar.appendChild(fill); row.appendChild(label); row.appendChild(bar); barsWrap.appendChild(row);
  });
}

function updateBars(){
  [...barsWrap.querySelectorAll('[data-key]')].forEach(el=>{
    const k = el.dataset.key;
    const val = Math.round(state[k]);
    el.style.width = Math.max(4, val) + '%';
  });
}

// Creature morphs across 4 stages based on health
// stage 1 (0-25): small teardrop; stage 2 (25-50): oval; stage 3 (50-75): rounded blob; stage 4 (75-100): big glowing creature
function pathForHealth(h){
  if (h < 25)  return "M100,40 C70,50 60,80 70,110 C80,140 120,140 130,110 C140,80 130,50 100,40 Z";
  if (h < 50)  return "M100,35 C65,50 55,90 70,120 C85,150 115,150 130,120 C145,90 135,50 100,35 Z";
  if (h < 75)  return "M100,30 C60,50 55,105 85,135 C115,165 145,145 155,110 C165,75 140,40 100,30 Z";
  return           "M100,28 C58,46 54,110 92,145 C130,180 164,150 172,108 C180,66 142,36 100,28 Z";
}

function updateCreature(){
  const h = health();
  bodyPath.setAttribute('d', pathForHealth(h));
  const b = 0.5 + h/100; // aura brightness
  aura.setAttribute('opacity', 0.20 + h/250);
  aura.setAttribute('r', 60 + h/2);

  // face mood & animations
  const blink = (t) => (Math.sin(t/350)+1)/2; // 0..1
  const t = performance.now();
  const eSize = 6 + (h/25) + (boosted()?2:0);
  eyeL.setAttribute('r', eSize * (0.9 + 0.1*blink(t)));
  eyeR.setAttribute('r', eSize * (0.9 + 0.1*blink(t)));
  // mouth curve
  const smile = Math.max(-12, Math.min(14, (h-50)/3));
  mouth.setAttribute('d', `M80,120 Q100,${120+smile} 120,120`);

  // subtle hover / breathing
  const bob = Math.sin(t/900) * (2 + h/80);
  const baseY = 98 + bob;
  aura.setAttribute('cy', baseY);
  eyeL.setAttribute('cy', 95 + bob);
  eyeR.setAttribute('cy', 95 + bob);
  mouth.setAttribute('transform', `translate(0, ${bob})`);

  // when boosted, add vibing aura
  aura.style.filter = boosted() ? 'url(#glow)' : 'none';
  face.style.opacity = h < 8 ? 0.7 : 1;
}

// status badges
function renderBadges(){
  statusBadges.innerHTML = '';
  if (boosted()) {
    const s = document.createElement('span');
    s.className = 'badge'; s.textContent = `${BOOST_NAME} (active)`;
    statusBadges.appendChild(s);
  }
}

// UI numbers
function renderTopline(){
  dayEl.textContent = state.day;
  scoreEl.textContent = state.score;
  dailyEl.textContent = (state.rewardClaimedDate === todayStr()) ? 'claimed' : `${DAILY_REWARD_NAME}`;
  boostCountEl.textContent = state.boostsOwned;
  useBoostBtn.disabled = !(state.boostsOwned > 0) || boosted();
}

function tick(){
  const now = Date.now();
  const dt = Math.max(1, Math.round((now - state.lastTick)/1000));
  state.lastTick = now;

  const decayScale = boosted()? BOOST.decayFactor : 1;
  state.hunger = clamp(state.hunger - 0.02*dt*decayScale);
  state.hygiene = clamp(state.hygiene - 0.015*dt*decayScale);
  state.fun    = clamp(state.fun    - 0.018*dt*decayScale);
  state.energy = clamp(state.energy - 0.012*dt*decayScale);

  state.score += Math.round(health()/50);

  // day rollover
  const was = state.lastLoginDate;
  const nowDay = todayStr();
  if (was !== nowDay){
    state.day += 1;
    state.lastLoginDate = nowDay;
    state.rewardClaimedDate = null;
    log(`Day ${state.day} begins. A soft glow fills the room.`);
  }

  // expire boost
  if (boosted() && Date.now() >= state.activeBoostUntil){
    state.activeBoostUntil = 0;
    log(`${BOOST_NAME} has faded.`);
  }

  updateBars();
  updateCreature();
  renderBadges();
  renderTopline();
  save();
}

const actions = {
  feed(mult=1){
    const m = boosted()? BOOST.multipliers.feed: 1;
    state.hunger = clamp(state.hunger + 18*m*mult);
    state.score += 6;
    log('You serve a steamy bowl of noodles. Yum!');
  },
  clean(mult=1){
    const m = boosted()? BOOST.multipliers.clean: 1;
    state.hygiene = clamp(state.hygiene + 16*m*mult);
    state.score += 5;
    log('Squeaky clean! Sparkles everywhere.');
  },
  play(mult=1){
    const m = boosted()? BOOST.multipliers.play: 1;
    state.fun = clamp(state.fun + 20*m*mult);
    state.energy = clamp(state.energy - 6);
    state.score += 7;
    log('High-score! Your lumipod loved that.');
  },
  rest(mult=1){
    const m = boosted()? BOOST.multipliers.rest: 1;
    state.energy = clamp(state.energy + 24*m*mult);
    state.hunger = clamp(state.hunger - 5);
    state.score += 4;
    log('A cozy nap restores the glow.');
  },
  claimDaily(){
    if (state.rewardClaimedDate === todayStr()){
      log('Daily already claimed.');
      return;
    }
    state.rewardClaimedDate = todayStr();
    state.hunger = clamp(state.hunger + DAILY_REWARD.hunger);
    state.hygiene = clamp(state.hygiene + DAILY_REWARD.hygiene);
    state.fun = clamp(state.fun + DAILY_REWARD.fun);
    state.energy = clamp(state.energy + DAILY_REWARD.energy);
    state.boostsOwned += DAILY_REWARD.boosts;
    log(`You claimed a ${DAILY_REWARD_NAME}: +15 to all stats and +1 ${BOOST_NAME}!`);
  },
  useBoost(){
    if (boosted()) { log('A boost is already active.'); return; }
    if (state.boostsOwned <= 0){ log('No boosts available.'); return; }
    state.boostsOwned -= 1;
    state.activeBoostUntil = Date.now() + BOOST.durationMs;
    log(`${BOOST_NAME} activated for 60 seconds! Gains up, decay down.`);
  }
};

// Hook up controls
document.querySelectorAll('button[data-action]').forEach(b=>{
  b.addEventListener('click', ()=>{ actions[b.dataset.action](); updateBars(); updateCreature(); renderTopline(); save(); });
});
document.getElementById('claimDaily').addEventListener('click', ()=>{ actions.claimDaily(); renderTopline(); save(); });
document.getElementById('useBoost').addEventListener('click', ()=>{ actions.useBoost(); renderBadges(); renderTopline(); save(); });

// Bars & initial render
ensureBars();
updateBars();
updateCreature();
renderBadges();
renderTopline();
setInterval(tick, 1000);
save();
