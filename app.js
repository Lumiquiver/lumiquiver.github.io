
const bootOverlay = document.getElementById('bootOverlay');
const bootLogs = document.getElementById('bootLogs');
const bootEnter = document.getElementById('bootEnter');
const app = document.getElementById('app');
const worldName = document.getElementById('worldName');
const systemStatus = document.getElementById('systemStatus');
const taskPhrase = document.getElementById('taskPhrase');
const processList = document.getElementById('processList');
const audioToggle = document.getElementById('audioToggle');
const clock = document.getElementById('clock');
const viewport = document.getElementById('viewport');
const camera = document.getElementById('camera');
const fxCanvas = document.getElementById('fxCanvas');
const fpsReadout = document.getElementById('fpsReadout');
const enterFocus = document.getElementById('enterFocus');

const worlds = [
  {
    name: 'DARK CYBERPUNK DISTRICT',
    phrase: 'Forged in Kali Linux • Tempered in Sanskrit',
    accent: '#7cffc8',
    tint: 0,
    processes: ['threat-mesh', 'deercard-core', 'ai-infra', 'signal-guards', 'neon-fog'],
    metrics: [84, 71, 1, '99.8%'],
    botLines: {
      archivist: ['Archives breathe here. I preserve signal inside the rain.', 'DeerCard is a living identity beacon.'],
      humorous: ['I would hack the neon, but I respect the architecture.', 'This alley has better uptime than most conference talks.']
    }
  },
  {
    name: 'MINIMAL WHITE VOID',
    phrase: 'Turn imagination into infrastructure',
    accent: '#10141b',
    tint: 42,
    processes: ['clarity-shell', 'philosophy-grid', 'glass-ui', 'void-lattices', 'elegance-mode'],
    metrics: [53, 22, 2, '100%'],
    botLines: {
      analytical: ['Identity is a system. Simplicity is a form of power.', 'The void is not empty. It is intentional space.']
    }
  },
  {
    name: 'RETRO ARCHIVE',
    phrase: 'Machines • Intellect • Victory',
    accent: '#f6c95f',
    tint: 84,
    processes: ['crt-echo', 'vhs-memory', 'floppy-node', 'legacy-parser', 'pixel-cache'],
    metrics: [67, 46, 3, '98.1%'],
    botLines: {
      corrupted: ['...signal missing... but the intent remains.', 'BOOT SECTOR REMAINS CURIOUS.']
    }
  },
  {
    name: 'RESEARCH LAB',
    phrase: 'AI modules loaded',
    accent: '#69f0ff',
    tint: 128,
    processes: ['quadinary-core', 'rag-lattice', 'model-routing', 'lab-sim', 'orbit-control'],
    metrics: [91, 58, 4, '99.9%'],
    botLines: {
      assistant: ['Welcome to the lab. I can explain any chamber.', 'Quadinary systems are online. Experiments continue.']
    }
  },
  {
    name: 'LOST MEMORY SPACE',
    phrase: 'Controlled Chaos',
    accent: '#c7aaff',
    tint: 170,
    processes: ['memory-fragment', 'ruin-render', 'dream-cache', 'ghost-signals', 'soft-corruption'],
    metrics: [38, 83, 5, '97.2%'],
    botLines: {
      archivist: ['Some ideas are not finished. They are waiting.', 'Even ruins carry a blueprint.']
    }
  }
];

let currentWorld = 0;
let introDone = false;
let audio = null;
let muted = true;
let pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
let bots = [];
let procSeed = 0;
let lastBurst = 0;

const bootLines = [
  ['[kernal]', 'LUMIOS neural shell awakening...'],
  ['[locale]', 'Sanskrit glyph tables mounted'],
  ['[boot]', 'initializing civilization…'],
  ['[boot]', 'systems online'],
  ['[boot]', 'AI modules loaded'],
  ['[world]', 'mood lattice calibrated'],
  ['[signal]', 'orbital archives unlocked'],
  ['[render]', 'megastructure reveal: active']
];

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour12: false });
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function setBootLines() {
  bootLogs.innerHTML = '';
  bootLines.forEach(([tag, text], i) => {
    const line = document.createElement('div');
    line.className = 'boot-line';
    line.innerHTML = `<span class="tag">${tag}</span> ${text}`;
    bootLogs.appendChild(line);
    setTimeout(() => line.classList.add('show'), 240 + i * 350);
  });
}

function openApp() {
  if (introDone) return;
  introDone = true;
  bootOverlay.classList.add('hidden');
  app.classList.add('ready');
  app.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    bootOverlay.remove();
  }, 1300);
}

bootEnter.addEventListener('click', openApp);
window.addEventListener('keydown', (e) => {
  if (!introDone && (e.key === 'Enter' || e.key === ' ')) openApp();
});

setBootLines();
setTimeout(() => {
  bootEnter.textContent = 'ENTER LUMIOS';
}, 3300);

const worldEls = Array.from(document.querySelectorAll('.world'));
const dockItems = Array.from(document.querySelectorAll('.dock-item'));
const navCards = Array.from(document.querySelectorAll('.nav-card'));

function flashWorld(idx) {
  const world = worlds[idx];
  document.body.style.setProperty('--worldTint', `${world.tint}deg`);
  worldName.textContent = world.name;
  systemStatus.textContent = world.phrase;
  taskPhrase.textContent = world.phrase;
  setTimeout(() => {
    systemStatus.style.color = world.accent;
    worldName.style.color = world.accent;
  }, 0);
}

function activateWorld(idx) {
  currentWorld = idx;
  worldEls.forEach((el, i) => el.classList.toggle('active', i === idx));
  dockItems.forEach((btn) => btn.classList.toggle('active', Number(btn.dataset.world) === idx));
  navCards.forEach((btn) => btn.classList.toggle('active', Number(btn.dataset.world) === idx));
  flashWorld(idx);
  if (audio) audio.burst(idx);
  procSeed = 0;
  rebuildProcesses();
  auralTick();
}

dockItems.forEach((btn) => btn.addEventListener('click', () => activateWorld(Number(btn.dataset.world))));
navCards.forEach((btn) => btn.addEventListener('click', () => activateWorld(Number(btn.dataset.world))));
document.querySelectorAll('[data-jump]').forEach((btn) => {
  btn.addEventListener('click', () => activateWorld(Number(btn.dataset.jump)));
});

function rebuildProcesses() {
  const world = worlds[currentWorld];
  processList.innerHTML = '';
  world.processes.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'proc';
    row.innerHTML = `
      <div class="proc-name">${name}</div>
      <div class="proc-bar"><span style="width:${30 + ((i + 1) * 13) % 65}%"></span></div>
      <div class="proc-val">${String(Math.round(60 + ((i * 11) % 40))).padStart(2, '0')}%</div>
    `;
    processList.appendChild(row);
  });
}

function updateMetrics() {
  const world = worlds[currentWorld];
  document.getElementById('metricA').textContent = `${world.metrics[0]}%`;
  document.getElementById('metricB').textContent = `${world.metrics[1]}%`;
  document.getElementById('metricC').textContent = String(world.metrics[2]).padStart(2, '0');
  document.getElementById('metricD').textContent = world.metrics[3];
}

function initBots() {
  bots = Array.from(document.querySelectorAll('.scriptbot')).map((el, index) => ({
    el,
    type: el.dataset.bot,
    index,
    x: parseFloat(el.style.left) / 100,
    y: parseFloat(el.style.top) / 100,
    vx: 0,
    vy: 0,
    baseX: parseFloat(el.style.left) / 100,
    baseY: parseFloat(el.style.top) / 100,
    nextTalk: 0,
    lines: Array.from(worlds.map(w => w.botLines[el.dataset.bot] || []).flat()).filter(Boolean)
  }));
}

function speak(bot, text, reveal = true) {
  const bubble = bot.el.querySelector('.bot-speech');
  if (!text) {
    bubble.classList.add('empty');
    bubble.textContent = '';
    return;
  }
  bubble.classList.remove('empty');
  if (!reveal) {
    bubble.textContent = text;
    return;
  }
  bubble.textContent = '';
  let i = 0;
  const speed = 18 + Math.random() * 20;
  const id = setInterval(() => {
    bubble.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(id);
  }, speed);
}

function talk(bot, force=false) {
  const world = worlds[currentWorld];
  const bank = world.botLines[bot.type] || bot.lines || [];
  if (!bank.length) return;
  const now = performance.now();
  if (bot.nextTalk > now) return;
  const line = bank[Math.floor(Math.random() * bank.length)];
  bot.nextTalk = now + (force ? 1600 : 5200) + Math.random() * (force ? 1800 : 5500);
  speak(bot, line, true);
}

function initWorldBotVisibility() {
  bots.forEach(bot => {
    const visible = bot.el.closest('.world').classList.contains('active');
    bot.el.style.opacity = visible ? '1' : '0';
  });
}

document.addEventListener('pointermove', (e) => {
  pointer.tx = e.clientX / innerWidth;
  pointer.ty = e.clientY / innerHeight;
});

document.addEventListener('pointerdown', (e) => {
  pointer.tx = e.clientX / innerWidth;
  pointer.ty = e.clientY / innerHeight;
});

function updateBots(dt) {
  const worldActive = worldEls[currentWorld];
  const rect = viewport.getBoundingClientRect();
  const px = pointer.tx;
  const py = pointer.ty;
  bots.forEach((bot) => {
    const inActive = bot.el.closest('.world') === worldActive;
    const t = performance.now() * 0.0002 + bot.index * 8;
    const base = worldActive ? 0.005 : 0.002;
    bot.x = bot.baseX + Math.sin(t + bot.index) * base;
    bot.y = bot.baseY + Math.cos(t * 1.3 + bot.index) * base;
    const screenX = bot.x * rect.width;
    const screenY = bot.y * rect.height;
    const dx = px * rect.width - screenX;
    const dy = py * rect.height - screenY;
    const dist = Math.hypot(dx, dy);
    const bump = inActive && dist < 220 ? 1 : 0;
    bot.el.style.left = `${clamp(bot.x * 100, 1, 92)}%`;
    bot.el.style.top = `${clamp(bot.y * 100, 1, 88)}%`;
    bot.el.style.transform = `translate3d(${Math.sin(t * 6) * 4 + bump * 6}px, ${Math.cos(t * 5) * 3 - bump * 4}px, 0) scale(${1 + bump * 0.05})`;
    if (inActive) {
      if (dist < 180) {
        talk(bot);
      } else if (Math.random() < 0.004) {
        talk(bot, false);
      }
    }
  });
}

function updateCamera() {
  pointer.x = lerp(pointer.x, pointer.tx, 0.06);
  pointer.y = lerp(pointer.y, pointer.ty, 0.06);
  const x = (pointer.x - 0.5) * 18;
  const y = (pointer.y - 0.5) * 14;
  camera.style.setProperty('--drift-x', `${x}px`);
  camera.style.setProperty('--drift-y', `${y}px`);
  camera.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.05)`;
}

function worldPulse() {
  const t = performance.now() * 0.0015;
  const world = worlds[currentWorld];
  const base = 60 + Math.sin(t * 0.7 + currentWorld) * 20;
  document.documentElement.style.setProperty('--worldTint', `${world.tint}deg`);
  document.querySelectorAll('.world.active .world-label strong').forEach((el) => {
    el.style.textShadow = `0 0 ${18 + base * 0.2}px rgba(124,255,200,.1)`;
  });
}

function animateClock() {
  clock.textContent = nowTime();
}

let particles = [];
function resize() {
  fxCanvas.width = Math.floor(innerWidth * devicePixelRatio);
  fxCanvas.height = Math.floor(innerHeight * devicePixelRatio);
  fxCanvas.style.width = innerWidth + 'px';
  fxCanvas.style.height = innerHeight + 'px';
  const count = Math.floor((innerWidth * innerHeight) / 18000);
  particles = Array.from({ length: clamp(count, 60, 180) }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    s: 0.2 + Math.random() * 0.8,
    w: Math.random() * Math.PI * 2
  }));
}
window.addEventListener('resize', resize);

function drawFx() {
  const ctx = fxCanvas.getContext('2d');
  const w = fxCanvas.width;
  const h = fxCanvas.height;
  ctx.clearRect(0,0,w,h);
  const world = worlds[currentWorld];
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.5, Math.max(w,h) * 0.7);
  grad.addColorStop(0, hexToRgba(world.accent, 0.13));
  grad.addColorStop(0.5, 'rgba(0,0,0,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w,h);

  const time = performance.now() * 0.0005;
  particles.forEach((p, i) => {
    const px = (p.x + Math.sin(time * 0.7 + p.w) * 0.001 * (i % 5)) * w;
    const py = ((p.y + (time * (0.018 + p.s * 0.018))) % 1) * h;
    const radius = (1.1 + p.s * 1.7) * devicePixelRatio;
    ctx.beginPath();
    ctx.fillStyle = hexToRgba(world.accent, 0.36 + p.s * 0.2);
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // trails / rain
  if (currentWorld === 0) {
    ctx.strokeStyle = 'rgba(107,231,255,.12)';
    ctx.lineWidth = 1 * devicePixelRatio;
    for (let i = 0; i < 65; i++) {
      const x = (i / 65) * w + Math.sin(time * 2 + i) * 12 * devicePixelRatio;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 30 * devicePixelRatio, h);
      ctx.stroke();
    }
  }

  requestAnimationFrame(drawFx);
}

function hexToRgba(hex, alpha) {
  const c = hex.replace('#', '');
  const bigint = parseInt(c.length === 3 ? c.split('').map(s=>s+s).join('') : c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function updateProcesses() {
  const items = processList.querySelectorAll('.proc');
  items.forEach((row, i) => {
    const bar = row.querySelector('.proc-bar span');
    const val = row.querySelector('.proc-val');
    const wobble = Math.sin(performance.now() * 0.001 + i * 1.7 + currentWorld) * 12;
    const pct = clamp(45 + wobble + i * 6, 16, 99);
    bar.style.width = `${pct}%`;
    val.textContent = `${String(Math.round(pct)).padStart(2, '0')}%`;
  });
}

function auralTick() {
  if (!audio) return;
  audio.setWorld(currentWorld);
}

class AudioEngine {
  constructor(){
    this.ctx = null;
    this.master = null;
    this.layers = [];
    this.noise = null;
    this.active = false;
    this.timers = [];
  }
  init(){
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.9;
    filter.connect(this.master);

    const hum = this.ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 46;

    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 132;

    const pulse = this.ctx.createOscillator();
    pulse.type = 'sawtooth';
    pulse.frequency.value = 27;

    const humGain = this.ctx.createGain(); humGain.gain.value = 0.18;
    const shimmerGain = this.ctx.createGain(); shimmerGain.gain.value = 0.04;
    const pulseGain = this.ctx.createGain(); pulseGain.gain.value = 0.07;

    hum.connect(humGain); humGain.connect(filter);
    shimmer.connect(shimmerGain); shimmerGain.connect(filter);
    pulse.connect(pulseGain); pulseGain.connect(filter);

    hum.start(); shimmer.start(); pulse.start();

    this.layers = [
      { osc: hum, gain: humGain },
      { osc: shimmer, gain: shimmerGain },
      { osc: pulse, gain: pulseGain },
    ];

    this.filter = filter;
    this.setWorld(0);
    this.fade(true);
  }
  fade(on){
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(on ? 0.22 : 0.0, this.ctx.currentTime + 0.35);
    this.active = on;
  }
  setMuted(m) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    muted = m;
    audioToggle.textContent = muted ? 'AUDIO OFF' : 'AUDIO ON';
    this.fade(!muted);
  }
  setWorld(idx){
    if (!this.ctx) return;
    const world = worlds[idx];
    const t = this.ctx.currentTime;
    const freqs = [
      [46, 138, 27],
      [32, 98, 18],
      [55, 111, 30],
      [38, 160, 22],
      [40, 72, 15]
    ][idx];
    this.layers.forEach((layer, i) => {
      layer.osc.frequency.cancelScheduledValues(t);
      layer.osc.frequency.linearRampToValueAtTime(freqs[i], t + 0.4);
    });
    this.filter.frequency.cancelScheduledValues(t);
    this.filter.frequency.linearRampToValueAtTime(idx === 1 ? 1600 : idx === 3 ? 2200 : 900, t + 0.4);
    this.filter.Q.cancelScheduledValues(t);
    this.filter.Q.linearRampToValueAtTime(idx === 2 ? 4 : 1.1, t + 0.4);
    if (!muted) this.fade(true);
  }
  burst(idx){
    if (!this.ctx || muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 180 + idx * 54;
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    o.connect(g); g.connect(this.master);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.stop(t + 0.2);
  }
}
audio = new AudioEngine();

audioToggle.addEventListener('click', async () => {
  audio.init();
  if (audio.ctx.state === 'suspended') await audio.ctx.resume();
  audio.setMuted(!muted);
});

enterFocus.addEventListener('click', () => {
  document.querySelector('.centerpiece').scrollIntoView({behavior:'smooth', block:'center'});
  if (audio && !muted) audio.burst(currentWorld);
});

function setupDraggables() {
  const windows = document.querySelectorAll('.draggable');
  windows.forEach((win) => {
    const bar = win.querySelector('.window-bar');
    let dragging = false;
    let startX = 0, startY = 0, baseX = 0, baseY = 0;
    let offset = { x: 0, y: 0 };
    const apply = () => {
      win.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
    };
    win.addEventListener('pointerdown', () => {
      windows.forEach(w => w.style.zIndex = '1');
      win.style.zIndex = '10';
    });
    bar.addEventListener('pointerdown', (e) => {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      startX = e.clientX; startY = e.clientY;
      const m = win.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
      baseX = m ? parseFloat(m[1]) : 0;
      baseY = m ? parseFloat(m[2]) : 0;
      bar.style.cursor = 'grabbing';
    });
    bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      offset.x = baseX + (e.clientX - startX);
      offset.y = baseY + (e.clientY - startY);
      apply();
    });
    bar.addEventListener('pointerup', () => {
      dragging = false;
      bar.style.cursor = 'grab';
    });
    bar.addEventListener('pointercancel', () => {
      dragging = false;
      bar.style.cursor = 'grab';
    });
    win.querySelector('.close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      win.style.display = 'none';
    });
    win.querySelector('.minimize')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = win.querySelector(':scope > :not(.window-bar)');
      if (!content) return;
      const hidden = content.style.display === 'none';
      content.style.display = hidden ? '' : 'none';
      win.classList.toggle('minimized', !hidden);
    });
  });
}

function restoreWindows() {
  document.querySelectorAll('.draggable').forEach((win) => {
    const content = win.querySelector(':scope > :not(.window-bar)');
    if (content) content.style.display = '';
    win.style.display = '';
    win.style.transform = '';
  });
}

function loop() {
  updateCamera();
  worldPulse();
  animateClock();
  updateMetrics();
  updateProcesses();
  updateBots();
  drawFrameHint();
  requestAnimationFrame(loop);
}

let lastFrame = performance.now();
let fpsSmoothed = 60;
function drawFrameHint(){
  const now = performance.now();
  const delta = now - lastFrame;
  lastFrame = now;
  const fps = 1000 / Math.max(16, delta);
  fpsSmoothed = fpsSmoothed * 0.92 + fps * 0.08;
  fpsReadout.textContent = `NEURAL FPS ${Math.round(fpsSmoothed)}`;
}

resize();
rebuildProcesses();
initBots();
setupDraggables();
flashWorld(0);
updateMetrics();
loop();
requestAnimationFrame(drawFx);

// intro motion
let bootPulse = 0;
setInterval(() => {
  bootPulse++;
  if (!introDone) {
    if (bootPulse % 2 === 0) bootOverlay.style.filter = `hue-rotate(${bootPulse * 12}deg)`;
  }
}, 500);

setInterval(() => {
  const world = worlds[currentWorld];
  document.body.style.setProperty('--worldTint', `${world.tint}deg`);
}, 1200);

// entry reveal after log sequence
setTimeout(() => {
  if (!introDone) bootEnter.classList.add('btn-primary');
}, 4400);

// ambient world-triggered bot chatter
setInterval(() => {
  bots.forEach(bot => {
    if (bot.el.closest('.world').classList.contains('active')) {
      if (Math.random() < 0.5) talk(bot);
    }
  });
}, 7000);

// start in muted mode, but prepare audio on first user gesture
window.addEventListener('pointerdown', () => {
  if (audio && audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
}, { once: true });

// direct initial focus
setTimeout(() => { if (!introDone) bootEnter.focus(); }, 800);
