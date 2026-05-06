// ============================================================
// CESTUS CONTROL — Game Configuration
// All static data: modules, enemies, upgrades, SP bonuses
// ============================================================

const CONFIG = {
  CELL: 60,
  GRID_R: 52,
  MAX_LEVEL: 33,
  MK2_SAMPLE_COST: 1,
  BASE_XP: 10,
  XP_SCALE: 1.1,
  WAVE_INTERVAL: 30000,
  STARTING_CREDITS: 500,
  PATROL_SPAWN_INTERVAL: 5000,
  PATROL_MAX_PER_MODULE: 5,
};

// ============================================================
// MODULE TYPES
// ============================================================
const MODULE_TYPES = {
  // --- CORE ---
  core: {
    name: 'NOYAU CESTUS', icon: '◈', color: '#00f5ff', energy: 0,
    hp: 1000, dmg: 5, range: 4, fireRate: 1000, isCore: true,
    desc: 'Le coeur de votre base. Ne le laissez pas être détruit.',
    unlocked: true, cost: { credits: 0, samples: 0 }, category: 'support'
  },

  // --- OFFENSIVE ---
  turret: {
    name: 'GATLING ALPHA', icon: '⊕', color: '#00ff88', energy: 10,
    hp: 160, dmg: 15, range: 4, fireRate: 200, isShooter: true,
    desc: 'Mitrailleuse standard. Bon équilibre. (-10%⚡)',
    unlocked: true, cost: { credits: 120, samples: 0 }, category: 'offensive'
  },
  laser: {
    name: 'LASER PULSE', icon: '▷', color: '#ff6600', energy: 20,
    hp: 120, dmg: 28, range: 5, fireRate: 1800, isShooter: true,
    desc: 'Dégâts élevés, grande portée. (-20%⚡)',
    unlocked: false, cost: { credits: 0, samples: 3 }, category: 'offensive',
    unlockReq: { samples: 3 }
  },
  missile: {
    name: 'LANCE-MISSILES', icon: '⊗', color: '#ff2244', energy: 20,
    hp: 150, dmg: 42, range: 6, fireRate: 2800, isShooter: true, splash: 1.8, isMissile: true,
    desc: 'Missiles à tête chercheuse lents. (-20%⚡)',
    unlocked: false, cost: { credits: 350, samples: 2 }, category: 'offensive',
    unlockReq: { samples: 4 }
  },
  beam: {
    name: 'LASER CONTINU', icon: '═', color: '#00ffdd', energy: 25,
    hp: 110, dmg: 6, range: 5.5, fireRate: 80, isShooter: true, isBeam: true,
    desc: 'DPS constant par faisceau. (-25%⚡)',
    unlocked: false, cost: { credits: 0, samples: 5 }, category: 'offensive',
    unlockReq: { samples: 5 }
  },
  railgun: {
    name: 'RAILGUN', icon: '⊳', color: '#aa88ff', energy: 30,
    hp: 100, dmg: 90, range: 8, fireRate: 4000, isShooter: true, isRailgun: true,
    desc: 'Rayon surpuissant instantané, knockback massif. (-30%⚡)',
    unlocked: false, cost: { credits: 500, samples: 3 }, category: 'offensive',
    unlockReq: { credits: 500, samples: 3 }
  },
  mortar: {
    name: 'MORTIER ZONE', icon: '◎', color: '#ff8844', energy: 15,
    hp: 140, dmg: 35, range: 7, fireRate: 3200, isShooter: true, splash: 2.5, isMortar: true,
    desc: 'Laisse une zone de flammes ardentes persistante. (-15%⚡)',
    unlocked: false, cost: { credits: 280, samples: 2 }, category: 'offensive',
    unlockReq: { samples: 3 }
  },
  frost: {
    name: 'TOURELLE CRYO', icon: '❄', color: '#88ddff', energy: 10,
    hp: 130, dmg: 8, range: 4, fireRate: 1200, isShooter: true, slowFactor: 0.4, slowDuration: 3000,
    desc: 'Multi-cibles. Ralentit les ennemis de 40% (3s). (-10%⚡)',
    unlocked: false, cost: { credits: 200, samples: 1 }, category: 'offensive',
    unlockReq: { credits: 200, samples: 1 }
  },
  flame: {
    name: 'LANCE-FLAMMES', icon: '♨', color: '#ff5500', energy: 15,
    hp: 170, dmg: 15, range: 3.5, fireRate: 100, isShooter:true, isFlamethrower: true,
    desc: 'Cone de feu destructeur à courte portée. (-15%⚡)',
    unlocked: false, cost: { credits: 250, samples: 2 }, category: 'offensive',
    unlockReq: { samples: 2 }
  },
  sonic: {
    name: 'ONDE SONIQUE', icon: '(((', color: '#00aaff', energy: 18,
    hp: 120, dmg: 12, range: 5, fireRate: 2500, isShooter:true, isSonic: true,
    burstCount: 3, burstDelay: 200,
    desc: 'Rafale d\'ondes de choc traversantes. (-18%⚡)',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'offensive',
    unlockReq: { samples: 3 }
  },
  bolt: {
    name: 'LASER RICOCHET', icon: '⚡', color: '#ffff00', energy: 22,
    hp: 110, dmg: 18, range: 5, fireRate: 1200, isShooter:true, isLaserBolt: true,
    desc: 'Rayon qui rebondit entre les ennemis. (-22%⚡)',
    unlocked: false, cost: { credits: 380, samples: 3 }, category: 'offensive',
    unlockReq: { samples: 4 }
  },
  gamma: {
    name: 'RAYON GAMMA', icon: '☢', color: '#88ff00', energy: 30,
    hp: 100, dmg: 22, range: 5, fireRate: 2800, isShooter:true, isGamma: true,
    desc: 'Irradie les cibles, explosion gamma à la mort. (-30%⚡)',
    unlocked: false, cost: { credits: 450, samples: 4 }, category: 'offensive',
    unlockReq: { samples: 5 }
  },
  orbital: {
    name: 'FRAPPE ORBITALE', icon: '☄', color: '#ffffff', energy: 40,
    hp: 80, dmg: 500, range: 999, fireRate: 5000, isShooter:true, isOrbital: true,
    desc: 'Frappe surpuissante sur l\'ennemi le plus fort. (-40%⚡)',
    unlocked: false, cost: { credits: 800, samples: 8 }, category: 'offensive',
    unlockReq: { samples: 10 }
  },
  blackhole: {
    name: 'TROU NOIR', icon: '🕳', color: '#4400aa', energy: 35,
    hp: 80, dmg: 5, range: 6, fireRate: 8000, isShooter:true, isBlackhole: true,
    desc: 'Génère un puits gravitationnel. (-35%⚡)',
    unlocked: false, cost: { credits: 600, samples: 5 }, category: 'offensive',
    unlockReq: { samples: 6 }
  },
  poison: {
    name: 'AURA TOXIQUE', icon: '☣', color: '#88ff44', energy: 12,
    hp: 120, dmg: 12, range: 3.5, fireRate: 1000, isShooter: true, isPoisonAura: true,
    desc: 'Zone toxique qui attaque tous les ennemis proches. (-12%⚡)',
    unlocked: false, cost: { credits: 220, samples: 2 }, category: 'offensive',
    unlockReq: { samples: 2, credits: 220 }
  },
  tesla: {
    name: 'TOURELLE TESLA', icon: '⚡', color: '#ddaaff', energy: 18,
    hp: 110, dmg: 20, range: 4.5, fireRate: 1600, isShooter: true,
    chainCount: 3, chainRange: 2,
    desc: 'Éclair en chaîne (3 cibles). (-18%⚡)',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'offensive',
    unlockReq: { credits: 300, samples: 2 }
  },
  plasma: {
    name: 'LASER PLASMA', icon: '◆', color: '#ff44aa', energy: 22,
    hp: 120, dmg: 55, range: 6, fireRate: 2500, isShooter: true,
    isSuperBeam: true,
    desc: 'Tir laser traversant la carte. (-22%⚡)',
    unlocked: false, cost: { credits: 400, samples: 4 }, category: 'offensive',
    unlockReq: { samples: 4 }
  },

  // --- SUPPORT ---
  reactor: {
    name: 'RÉACTEUR', icon: '☢', color: '#ffcc00', energy: -15,
    hp: 100, isReactor: true, desc: 'Produit de l\'énergie. (+15%⚡)',
    unlocked: true, cost: { credits: 150, samples: 0 }, category: 'support'
  },
  shield: {
    name: 'BOUCLIER', icon: '⊚', color: '#00ccff', energy: 10,
    hp: 300, isShield: true, aura: { hp: 100 },
    desc: 'Augmente les HP des modules adjacents. (-15%⚡)',
    unlocked: false, cost: { credits: 200, samples: 1 }, category: 'support',
    unlockReq: { samples: 1 }
  },
  amplifier: {
    name: 'AMPLIFICATEUR', icon: '▲', color: '#ff3300', energy: 20,
    hp: 50, isAmplifier: true, aura: { dmg: 0.15, fireRate: 0.1 },
    desc: 'Buff les dégâts/cadence des adjacents. (-20%⚡)',
    unlocked: false, cost: { credits: 250, samples: 2 }, category: 'support',
    unlockReq: { samples: 2 }
  },
  harvester: {
    name: 'HARVESTER', icon: '$', color: '#ffee00', energy: 15,
    hp: 40, isHarvester: true, passiveCredits: 5,
    desc: 'Génère des crédits passivement. (-15%⚡)',
    unlocked: false, cost: { credits: 180, samples: 2 }, category: 'support',
    unlockReq: { credits: 180, samples: 2 }
  },
  collector: {
    name: 'COLLECTEUR', icon: '🔬', color: '#cc66ff', energy: 20,
    hp: 60, isCollector: true, aura: { credits: 1, samples: 0.5 },
    desc: 'Boost le loot des ennemis proches. (-20%⚡)',
    unlocked: false, cost: { credits: 300, samples: 3 }, category: 'support',
    unlockReq: { samples: 3 }
  },
  regen: {
    name: 'NANO-REGEN', icon: '✚', color: '#00ff66', energy: 12,
    hp: 60, isRegen: true, healRate: 2.0,
    desc: 'Répare les modules adjacents. (-12%⚡)',
    unlocked: false, cost: { credits: 220, samples: 2 }, category: 'support',
    unlockReq: { samples: 2 }
  },
  radar: {
    name: 'RADAR', icon: '📡', color: '#00ffff', energy: 15,
    hp: 60, isRangeBoost: true, aura: { range: 0.16 },
    desc: 'Augmente la portée des adjacents (+16%). (-15%⚡)',
    unlocked: false, cost: { credits: 250, samples: 2 }, category: 'support',
    unlockReq: { samples: 2 }
  },
  replicator: {
    name: 'RÉPLICATEUR', icon: '⌘', color: '#ffffff', energy: 30,
    hp: 60, isReplicator: true,
    desc: 'Génère 1 échantillon toutes les 45s. (-30%⚡)',
    unlocked: false, cost: { credits: 300, samples: 1 }, category: 'support',
    unlockReq: { samples: 1 }
  },
  patrol_small: {
    name: 'HANGAR ALPHA', icon: '✈', color: '#00ffaa', energy: 25,
    hp: 100, isPatrol: true, patrolType: 'basic',
    desc: 'Génère des intercepteurs rapides. (-25%⚡)',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'support',
    unlockReq: { samples: 2 }
  },
  patrol_heavy: {
    name: 'HANGAR DELTA', icon: '🚁', color: '#ff3333', energy: 35,
    hp: 150, isPatrol: true, patrolType: 'heavy',
    desc: 'Génère des drones de choc lourds. (-35%⚡)',
    unlocked: false, cost: { credits: 500, samples: 4 }, category: 'support',
    unlockReq: { samples: 5 }
  },
  patrol_repair: {
    name: 'HANGAR REPEN', icon: '🛠', color: '#33ffaa', energy: 30,
    hp: 120, isPatrol: true, patrolType: 'support',
    desc: 'Génère des unités de réparation. (-30%⚡)',
    unlocked: false, cost: { credits: 350, samples: 3 }, category: 'support',
    unlockReq: { samples: 3 }
  }
};

// ============================================================
// ENEMIES
// ============================================================
const ENEMY_TYPES = {
  basic: {
    name: 'Basic', hp: 45, speed: 1.0, dmg: 4, size: 10,
    reward: { credits: 8, xp: 10, samples: 0.01 },
    color: '#aaaaaa', shape: 'circle'
  },
  fast: {
    name: 'Fast', hp: 20, speed: 1.8, dmg: 2, size: 8,
    reward: { credits: 10, xp: 12, samples: 0.01 },
    color: '#00ffff', shape: 'triangle'
  },
  tank: {
    name: 'Tank', hp: 150, speed: 0.6, dmg: 8, size: 14,
    reward: { credits: 25, xp: 35, samples: 0.05 },
    color: '#ff0044', shape: 'square'
  },
  ranged: {
    name: 'Ranged', hp: 35, speed: 0.8, dmg: 3, size: 9,
    reward: { credits: 15, xp: 20, samples: 0.02 },
    color: '#ffff00', shape: 'hexagon',
    shootRange: 220, shootRate: 2500, shootDmg: 15
  },
  glitchShifter: {
    name: 'Shifter', hp: 60, speed: 1.2, dmg: 5, size: 11,
    reward: { credits: 30, xp: 40, samples: 0.08 },
    color: '#ff00ff', shape: 'glitch',
    isShifter: true
  },
  kamikaze: {
    name: 'Bumper', hp: 40, speed: 2.2, dmg: 25, size: 10,
    reward: { credits: 20, xp: 25, samples: 0.03 },
    color: '#ff6600', shape: 'square',
    isKamikaze: true, explosionRadius: 120
  },
  armored: {
    name: 'Brute', hp: 300, speed: 0.4, dmg: 12, size: 16,
    reward: { credits: 50, xp: 60, samples: 0.10 },
    color: '#888888', shape: 'square',
    isArmored: true
  },
  swarm: {
    name: 'Swarm', hp: 12, speed: 1.5, dmg: 1, size: 6,
    reward: { credits: 3, xp: 5, samples: 0 },
    color: '#ffffff', shape: 'circle',
    isSwarm: true
  },
  protector: {
    name: 'Protector', hp: 200, speed: 0.5, dmg: 5, size: 14,
    reward: { credits: 45, xp: 55, samples: 0.12 },
    color: '#0088ff', shape: 'hexagon',
    isProtector: true, protectRange: 100
  },
  splitter: {
    name: 'Diviseur', hp: 35, speed: 1.2, dmg: 8, size: 11,
    reward: { credits: 15, xp: 20, samples: 0.05 },
    color: '#ff8800', shape: 'diamond',
    isSplitter: true, splitCount: 2
  },
  splitterMini: {
    name: 'Rejeton', hp: 15, speed: 2.5, dmg: 4, size: 7,
    reward: { credits: 5, xp: 5, samples: 0 },
    color: '#ffaa00', shape: 'triangle',
    isMini: true
  },
  healer: {
    name: 'Guérisseur', hp: 80, speed: 0.6, dmg: 5, size: 10,
    reward: { credits: 25, xp: 30, samples: 0.08 },
    color: '#00ff00', shape: 'hexagon',
    isHealer: true, healAura: 150, healAmount: 15
  },
  sniper: {
    name: 'Sniper', hp: 25, speed: 0.8, dmg: 8, size: 9,
    reward: { credits: 20, xp: 30, samples: 0.06 },
    color: '#0000ff', shape: 'diamond',
    isSniper: true, shootRange: 400, shootRate: 3000, shootDmg: 30
  },
  mage: {
    name: 'Mage', hp: 60, speed: 0.5, dmg: 5, size: 13,
    reward: { credits: 40, xp: 50, samples: 0.15 },
    color: '#9900ff', shape: 'circle',
    isMage: true, summonRate: 4000, summonType: 'swarm'
  }
};

// Wave spawn weights by wave tier
const WAVE_SPAWN_WEIGHTS = {
  early: [{ type: 'basic', w: 0.55 }, { type: 'fast', w: 0.25 }, { type: 'ranged', w: 0.20 }],
  mid: [{ type: 'basic', w: 0.20 }, { type: 'fast', w: 0.15 }, { type: 'tank', w: 0.12 }, { type: 'ranged', w: 0.12 }, { type: 'glitchShifter', w: 0.08 }, { type: 'kamikaze', w: 0.08 }, { type: 'swarm', w: 0.05 }, { type: 'splitter', w: 0.08 }, { type: 'healer', w: 0.06 }, { type: 'sniper', w: 0.06 }],
  late: [{ type: 'basic', w: 0.06 }, { type: 'fast', w: 0.08 }, { type: 'tank', w: 0.10 }, { type: 'ranged', w: 0.08 }, { type: 'glitchShifter', w: 0.10 }, { type: 'kamikaze', w: 0.08 }, { type: 'armored', w: 0.08 }, { type: 'swarm', w: 0.06 }, { type: 'protector', w: 0.08 }, { type: 'splitter', w: 0.08 }, { type: 'healer', w: 0.06 }, { type: 'sniper', w: 0.06 }, { type: 'mage', w: 0.08 }],
};

// ============================================================
// UPGRADES
// ============================================================
const UPGRADE_DEFS = [
  { id: 'u_dmg', name: 'SURCHARGE CINÉTIQUE', desc: '+20% dégâts globaux', maxLevel: 10, baseCost: { credits: 80, samples: 0 }, costScale: 1.5, effect: 'dmg', value: 0.20 },
  { id: 'u_hp', name: 'NANO-BLINDAGE', desc: '+25% HP globaux', maxLevel: 10, baseCost: { credits: 100, samples: 0 }, costScale: 1.6, effect: 'hp', value: 0.25 },
  { id: 'u_range', name: 'SENSEURS ÉTENDUS', desc: '+0.5 portée globale', maxLevel: 8, baseCost: { credits: 90, samples: 0 }, costScale: 1.5, effect: 'range', value: 0.5 },
  { id: 'u_fire', name: 'OVERCLOCK SYSTÈME', desc: '+15% cadence globale', maxLevel: 8, baseCost: { credits: 120, samples: 0 }, costScale: 1.7, effect: 'fireRate', value: 0.15 },
  { id: 'u_xp', name: 'ANALYSEUR XP', desc: '+30% XP par kill', maxLevel: 5, baseCost: { credits: 0, samples: 2 }, costScale: 1.0, effect: 'xpGain', value: 0.30 },
  { id: 'u_cred', name: 'EXTRACTEUR CRÉDITS', desc: '+20% crédits par kill', maxLevel: 8, baseCost: { credits: 60, samples: 0 }, costScale: 1.4, effect: 'creditGain', value: 0.20 },
  { id: 'u_regen', name: 'NANO-RÉPARATION', desc: '+0.2 HP/s tous modules', maxLevel: 6, baseCost: { credits: 150, samples: 1 }, costScale: 1.5, effect: 'regenAll', value: 0.2 },
  { id: 'u_energy', name: 'FLUX CAPACITOR', desc: '+10% production énergie', maxLevel: 6, baseCost: { credits: 130, samples: 0 }, costScale: 1.6, effect: 'energyProd', value: 0.10 },
];

// ============================================================
// SUPER POINTS
// ============================================================
const SP_BONUSES = [
  { id: 'sp_dmg', name: 'PÉNÉTRATION +5%', desc: '+5% dégâts permanents', cost: 1, effect: 'dmg' },
  { id: 'sp_credits', name: 'RECYCLAGE +5%', desc: '+5% crédits permanents', cost: 1, effect: 'credits' },
  { id: 'sp_samples', name: 'BIOSCAN +5%', desc: '+5% échantillons permanents', cost: 1, effect: 'samples' },
  { id: 'sp_xp', name: 'SYNAPSES +5%', desc: '+5% XP permanents', cost: 1, effect: 'xp' },
  { id: 'sp_hp', name: 'CARAPACE +5%', desc: '+5% PV permanents', cost: 1, effect: 'hp' },
  { id: 'sp_speed', name: 'TURBO +5%', desc: '+5% cadence permanente', cost: 1, effect: 'speed' },
  { id: 'sp_oc_dur', name: 'BATTERIE OC +5%', desc: '+5% durée surcharge', cost: 1, effect: 'ocDuration' },
  { id: 'sp_oc_pwr', name: 'VOLTAGE OC +5%', desc: '+5% puissance surcharge', cost: 1, effect: 'ocPower' },
];
