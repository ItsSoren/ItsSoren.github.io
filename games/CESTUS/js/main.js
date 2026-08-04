// ============================================================
// CESTUS CONTROL — Main Entry Point
// Game loop, initialization
// ============================================================

const C = document.getElementById('gameCanvas');
const ctx = C.getContext('2d');
let W, H, PIXEL_RATIO = 1;

function resizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  const renderScale = typeof GRAPHICS !== 'undefined' ? GRAPHICS.renderScale : 1;
  const layout = document.documentElement.dataset.layout || 'desktop';
  const deviceCap = layout === 'phone' ? 1.35 : layout === 'tablet' ? 1.55 : layout === 'short' ? 1.6 : 2;
  PIXEL_RATIO = Math.min(deviceCap, Math.max(0.5, (window.devicePixelRatio || 1) * renderScale));
  C.width = Math.round(W * PIXEL_RATIO);
  C.height = Math.round(H * PIXEL_RATIO);
  C.style.width = W + 'px';
  C.style.height = H + 'px';
  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
}

window.addEventListener('load', () => {
  resizeCanvas();
  const menuBtnContainer = document.getElementById('startButtons');
  const maxKillsVal = document.getElementById('maxKillsValue');
  if (maxKillsVal) maxKillsVal.textContent = getHighScore();
  
  if (hasSave()) {
    const saveData = JSON.parse(localStorage.getItem('cestus_save'));
    const wave = saveData.G.wave;
    menuBtnContainer.innerHTML = `
      <button class="btn-start" onclick="continueGame()">▶ REPRENDRE · VAGUE ${wave}</button>
      <button class="btn-restart menu-secondary" onclick="startGame()">↺ NOUVELLE PARTIE</button>
    `;
  } else {
    menuBtnContainer.innerHTML = `<button class="btn-start" onclick="startGame()">▶ INITIALISER SYSTÈME</button>`;
  }
});

function startGame() {
  initGameAudio();
  deleteSave();
  document.getElementById('startScreen').style.display = 'none';
  gameStarted = true;
  initGame();
}

function continueGame() {
  initGameAudio();
  const saveData = JSON.parse(localStorage.getItem('cestus_save'));
  if (!saveData) return;
  
  document.getElementById('startScreen').style.display = 'none';
  gameStarted = true;
  
  // Restore state structure
  G = createGameState();
  Object.assign(G, saveData.G);
  upgradeLevels = saveData.upgradeLevels || {};
  
  // Restore unlocked status
  if (saveData.unlockedModules) {
    Object.keys(MODULE_TYPES).forEach(k => {
      MODULE_TYPES[k].unlocked = !!saveData.unlockedModules[k];
    });
  }

  // Essential init
  _hudCache = {};
  resizeCanvas();
  
  // Reset transient arrays that weren't saved
  G.enemies = [];
  G.projectiles = [];
  G.particles = [];
  G.patrolUnits = [];
  G.corpses = [];
  G.floatingTexts = [];
  G.liveEnemyCount = 0;
  G.activeWaves = [];
  G.riftPortals = [];
  G.directiveOpen = false;
  G.directiveChoices = [];
  G.activeDirective = null;
  G._gridGradient = null;
  G._gridGradientKey = '';
  G._vignetteGradient = null;
  G._vignetteGradientKey = '';
  G._particlePool = [];
  G._fxTier = 0;
  G._fxRecoveryFrames = 0;
  G.fpsRealLast = 0;
  
  // Reset specific flags
  G.paused = false;
  G.over = false;
  document.getElementById('directiveOverlay')?.classList.remove('active');
  ensureDirectiveState();
  updateDirectiveBadge(true);
  invalidateAllModuleStats();
  recalcEnergy();

  // UI & Controls
  if (!window._inputInit) { initInput(); window._inputInit = true; }
  renderTabs();
  updateHUD();
  updateWavePreview();
  
  G.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function setSpeed(s) {
  if (s === 4 && G.level < 50) {
    showNotif('×4 débloqué au niveau 50 !', 'notif-warn');
    return;
  }
  gameSpeed = s;
  ['spd05', 'spd1', 'spd2', 'spd4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const map = { 0.5: 'spd05', 1: 'spd1', 2: 'spd2', 4: 'spd4' };
  const el = document.getElementById(map[s]);
  if (el) el.classList.add('active');
}

function initGame() {
  // Reset state
  G = createGameState();
  _hudCache = {};
  upgradeLevels = {};
  UPGRADE_DEFS.forEach(u => { upgradeLevels[u.id] = 0; });

  // Reset module unlocks
  Object.keys(MODULE_TYPES).forEach(k => {
    if (k !== 'core' && k !== 'turret') MODULE_TYPES[k].unlocked = false;
  });
  MODULE_TYPES.turret.unlocked = true;

  resizeCanvas();
  generateGlitchZones();

  // Place core at grid (0,0)
  placeModule('core', 0, 0);

  // Center camera on core
  initCamera();

  // Reset UI
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('active');
  const waveAlert = document.getElementById('waveAlert');
  if (waveAlert) waveAlert.style.display = 'none';
  const startBtn = document.getElementById('startWaveBtn');
  if (startBtn) startBtn.disabled = false;
  document.getElementById('directiveOverlay')?.classList.remove('active');
  updateDirectiveBadge();

  gameSpeed = 1;
  setSpeed(1);

  // Init input on first run
  if (!window._inputInit) {
    initInput();
    window._inputInit = true;
  }

  renderTabs();
  updateHUD();
  updateWavePreview();

  G.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// ============================================================
// PAUSE SYSTEM
// ============================================================
function togglePause() {
  if (!G || G.over || !gameStarted) return;
  if (G.directiveOpen) return;
  G.paused = !G.paused;
  const overlay = document.getElementById('pauseOverlay');
  if (overlay) {
    if (G.paused) overlay.classList.add('active');
    else overlay.classList.remove('active');
  }
  if (!G.paused) {
    G.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(ts) {
  if (!G || G.over) return;
  if (G.paused) return; // Stop updating when paused

  const rawDt = Math.min(ts - G.lastTime, 50);
  G.lastTime = ts;
  const dt = rawDt * gameSpeed;
  G.now += dt;

  // Energy logic
  updateEnergy(dt);

  // Wave logic
  updateWaveLogic(G.now);

  // Shared lookup structures for combat, AI and projectiles.
  rebuildSpatialIndexes();

  // Module shooting
  for (let i = 0; i < G.modules.length; i++) {
    if (G.modules[i].alive) moduleShoot(G.modules[i], G.now);
  }

  // Update systems
  updateProjectiles(dt);
  updateEnemies(dt, G.now);
  updatePatrolUnits(dt, G.now);
  updateModulePassives(dt, G.now);
  updateParticles(dt);

  // Sync max HP
  for (let i = 0; i < G.modules.length; i++) {
    const m = G.modules[i];
    if (!m.alive) continue;
    const stats = getModuleStats(m);
    if (m.maxHp !== stats.maxHp) {
      m.hp = Math.min(m.hp * (stats.maxHp / Math.max(1, m.maxHp)), stats.maxHp);
      m.maxHp = stats.maxHp;
    }
  }

  // Render
  render(G.now);

  // HUD update (throttled)
  if (Math.floor(G.now / 200) !== Math.floor((G.now - dt) / 200)) {
    updateHUD();
  }
  if (G._tabsDirty && Math.floor(G.now / 500) !== Math.floor((G.now - dt) / 500)) {
    G._tabsDirty = false;
    renderTabs();
  }

  if (!G.over) requestAnimationFrame(gameLoop);
}

// ============================================================
// PERIODIC CHECKS
// ============================================================
window.addEventListener('resize', resizeCanvas);
setInterval(() => { 
  if (G && !G.over && gameStarted) {
    checkUnlocks();
    saveGame();
  }
}, 10000);
setInterval(() => { if (G && !G.over && gameStarted) checkUnlocks(); }, 2000);
