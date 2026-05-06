// ============================================================
// CESTUS CONTROL — Game State
// Centralized state management
// ============================================================

function createGameState() {
  return {
    credits: CONFIG.STARTING_CREDITS,
    samples: 0,
    xp: 0,
    xpNeeded: CONFIG.BASE_XP,
    level: 1,
    superPoints: 0,
    totalSP: 0,
    kills: 0,
    enemyKills: {},
    bonus: { dmg:0, credits:0, samples:0, xp:0, hp:0, speed:0, ocDuration: 0, ocPower: 0 },

    // Camera
    cam: { x:0, y:0, zoom:1 },
    isDragging: false,
    lastMouse: { x:0, y:0 },
    _mouseDown: false,
    _mouseDownPos: { x:0, y:0 },
    mouseWorld: { x:0, y:0 },

    // Waves
    wave: 0,
    waveActive: false,
    waveTimer: 5000,
    waveInterval: CONFIG.WAVE_INTERVAL,
    waveEnemies: [],
    enemySpawnIndex: 0,
    bossWave: false,

    // Entity arrays
    modules: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    patrolUnits: [],

    // Grid
    CELL: CONFIG.CELL,
    GRID_R: CONFIG.GRID_R,

    // Selection / Placement
    selectedModule: null,
    placingModule: null,

    // Timing
    now: 0,
    lastTime: 0,
    over: false,
    paused: false,

    // Map
    glitchZones: [],
    centerGX: 0,
    centerGY: 0,

    // Energy & Overclock
    totalEnergy: 100,
    usedEnergy: 0,
    overclockActive: false,
    overclockHeat: 0,
    overclockPenalty: 0,
    overclockCooldown: 0,
    overclockPhase: 'idle', // idle, active, discharge, cooldown
    overclockDischarge: 0,

    // Module tracking
    moduleLevels: {},
    moduleMK: {},

    // Harvester timer
    lastHarvestTick: 0,

    // Regen timer
    lastRegenTick: 0,

    // Corpses
    corpses: [],

    // FPS
    fpsFrames: 0,
    fpsLast: 0,
    fpsDisplay: 60,
  };
}

let G = {};
let gameSpeed = 1;
let gameStarted = false;
let upgradeLevels = {};

// ============================================================
// PERSISTENCE (LocalStorage)
// ============================================================
function saveGame() {
  if (!G || G.over || !gameStarted) return;
  
  // Track which modules are unlocked
  const unlockedModules = {};
  Object.entries(MODULE_TYPES).forEach(([k, v]) => {
    if (v.unlocked) unlockedModules[k] = true;
  });

  // Create a clean copy of G — only exclude transient properties at the root level
  const cleanG = JSON.parse(JSON.stringify(G, function(key, value) {
    if (this === G) {
      const transient = ['target', 'lastRampTarget', 'enemies', 'projectiles', 'particles', 'floatingTexts', 'patrolUnits', 'corpses', '_hudCache', 'cachedStats'];
      if (transient.includes(key)) return undefined;
    }
    return value;
  }));

  const saveData = {
    G: cleanG,
    upgradeLevels: upgradeLevels,
    unlockedModules: unlockedModules,
    timestamp: Date.now()
  };
  
  localStorage.setItem('cestus_save', JSON.stringify(saveData));
}

function deleteSave() {
  localStorage.removeItem('cestus_save');
}

function hasSave() {
  return localStorage.getItem('cestus_save') !== null;
}

function getHighScore() {
  return parseInt(localStorage.getItem('cestus_highscore')) || 0;
}

function saveHighScore() {
  if (!G) return;
  const currentHigh = getHighScore();
  if (G.kills > currentHigh) {
    localStorage.setItem('cestus_highscore', G.kills);
  }
}
