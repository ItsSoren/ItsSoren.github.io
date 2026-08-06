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
  WAVE_INTERVAL: 45000,
  STARTING_CREDITS: 750,
  PATROL_SPAWN_INTERVAL: 5000,
  PATROL_MAX_PER_MODULE: 5,
};

// ============================================================
// MODULE TYPES
// ============================================================
const MODULE_TYPES = {
  // --- CORE ---
  core: {
    name: 'NOYAU CESTUS', icon: '◈', color: '#00f5ff', energyProduction: 10,
    hp: 1000, dmg: 5, range: 4, fireRate: 1000, isCore: true,
    desc: 'Le coeur de votre base. Produit 10 énergie/seconde (×1.3 par MK, ×1.08 par niveau). Améliorable. Ne le laissez pas être détruit.',
    unlocked: true, cost: { credits: 0, samples: 0 }, category: 'support'
  },

  // --- OFFENSIVE ---
  turret: {
    name: 'GATLING ALPHA', icon: '⊕', color: '#00ff88', energyConsumption: 8,
    hp: 160, dmg: 15, range: 4, fireRate: 200, isShooter: true,
    desc: 'Mitrailleuse standard. Bon équilibre. (8 ⚡/s)',
    unlocked: true, cost: { credits: 120, samples: 0 }, category: 'offensive',
    unlockReq: { wave: 1 }
  },
  laser: {
    name: 'LASER PULSE', icon: '▷', color: '#ff6600', energyConsumption: 12,
    hp: 120, dmg: 28, range: 5, fireRate: 1800, isShooter: true,
    desc: 'Dégâts élevés, grande portée. (12 ⚡/s)',
    unlocked: false, cost: { credits: 250, samples: 1 }, category: 'offensive',
    unlockReq: { wave: 2 }
  },
  missile: {
    name: 'LANCE-MISSILES', icon: '⊗', color: '#ff2244', energyConsumption: 10, oilConsumption: 3,
    hp: 150, dmg: 42, range: 6, fireRate: 2800, isShooter: true, splash: 1.8, isMissile: true,
    desc: 'Missiles à tête chercheuse lents. (10 ⚡/s + 3 🛢/s)',
    unlocked: false, cost: { credits: 350, samples: 2 }, category: 'offensive',
    unlockReq: { wave: 3 }
  },
  beam: {
    name: 'LASER CONTINU', icon: '═', color: '#00ffdd', energyConsumption: 15, oilConsumption: 2,
    hp: 110, dmg: 6, range: 5.5, fireRate: 80, isShooter: true, isBeam: true,
    desc: 'DPS constant par faisceau. (15 ⚡/s + 2 🛢/s)',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'offensive',
    unlockReq: { wave: 4 }
  },
  railgun: {
    name: 'RAILGUN', icon: '⊳', color: '#aa88ff', energyConsumption: 18, oilConsumption: 4,
    hp: 100, dmg: 90, range: 8, fireRate: 4000, isShooter: true, isRailgun: true,
    desc: 'Rayon surpuissant instantané, knockback massif. (18 ⚡/s + 4 🛢/s)',
    unlocked: false, cost: { credits: 500, samples: 4 }, category: 'offensive',
    unlockReq: { wave: 6 }
  },
  mortar: {
    name: 'MORTIER ZONE', icon: '◎', color: '#ff8844', energyConsumption: 10,
    hp: 140, dmg: 35, range: 7, fireRate: 3200, isShooter: true, splash: 2.5, isMortar: true,
    desc: 'Laisse une zone de flammes ardentes persistante. (10 ⚡/s)',
    unlocked: false, cost: { credits: 280, samples: 2 }, category: 'offensive',
    unlockReq: { wave: 3 }
  },
  frost: {
    name: 'TOURELLE CRYO', icon: '❄', color: '#88ddff', energyConsumption: 8,
    hp: 130, dmg: 8, range: 4, fireRate: 1200, isShooter: true, slowFactor: 0.4, slowDuration: 3000,
    desc: 'Multi-cibles. Ralentit les ennemis de 40% (3s). (8 ⚡/s)',
    unlocked: false, cost: { credits: 200, samples: 1 }, category: 'offensive',
    unlockReq: { wave: 2 }
  },
  flame: {
    name: 'LANCE-FLAMMES', icon: '♨', color: '#ff5500', energyConsumption: 12,
    hp: 170, dmg: 15, range: 3.5, fireRate: 100, isShooter:true, isFlamethrower: true,
    desc: 'Cone de feu destructeur à courte portée. (12 ⚡/s)',
    unlocked: false, cost: { credits: 250, samples: 2 }, category: 'offensive',
    unlockReq: { wave: 3 }
  },
  sonic: {
    name: 'ONDE SONIQUE', icon: '(((', color: '#00aaff', energyConsumption: 14,
    hp: 120, dmg: 12, range: 5, fireRate: 2500, isShooter:true, isSonic: true,
    burstCount: 3, burstDelay: 200,
    desc: 'Rafale d\'ondes de choc traversantes. (14 ⚡/s)',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'offensive',
    unlockReq: { wave: 4 }
  },
  bolt: {
    name: 'LASER RICOCHET', icon: '⚡', color: '#ffff00', energyConsumption: 16,
    hp: 110, dmg: 18, range: 5, fireRate: 1200, isShooter:true, isLaserBolt: true,
    desc: 'Rayon qui rebondit entre les ennemis. (16 ⚡/s)',
    unlocked: false, cost: { credits: 380, samples: 3 }, category: 'offensive',
    unlockReq: { wave: 5 }
  },
  gamma: {
    name: 'RAYON GAMMA', icon: '☢', color: '#88ff00', energyConsumption: 22,
    hp: 100, dmg: 22, range: 5, fireRate: 2800, isShooter:true, isGamma: true,
    desc: 'Irradie les cibles, explosion gamma à la mort. (22 ⚡/s)',
    unlocked: false, cost: { credits: 450, samples: 4 }, category: 'offensive',
    unlockReq: { wave: 6 }
  },
  orbital: {
    name: 'FRAPPE ORBITALE', icon: '☄', color: '#ffffff', energyConsumption: 35,
    hp: 80, dmg: 500, range: 999, fireRate: 5000, isShooter:true, isOrbital: true,
    desc: 'Frappe surpuissante sur l\'ennemi le plus fort. (35 ⚡/s)',
    unlocked: false, cost: { credits: 800, samples: 8 }, category: 'offensive',
    unlockReq: { wave: 10 }
  },
  blackhole: {
    name: 'SINGULARITÉ', icon: '🕳', color: '#4400aa', energyConsumption: 30,
    hp: 80, dmg: 500, range: 111, fireRate: 15000, isShooter:true, isBlackhole: true,
    splash: 1, isPiercing: true, piercingCount: 999,
    desc: 'Projectile perçant traverse tous les ennemis sur 150 cases en 5s. Dégâts monstrueux. (30 ⚡/s)',
    unlocked: false, cost: { credits: 600, samples: 6 }, category: 'offensive',
    unlockReq: { wave: 9 }
  },
  poison: {
    name: 'AURA TOXIQUE', icon: '☣', color: '#88ff44', energyConsumption: 10,
    hp: 120, dmg: 12, range: 3.5, fireRate: 1000, isShooter: true, isPoisonAura: true,
    desc: 'Zone toxique qui attaque tous les ennemis proches. (10 ⚡/s)',
    unlocked: false, cost: { credits: 220, samples: 1 }, category: 'offensive',
    unlockReq: { wave: 3 }
  },
  tesla: {
    name: 'TOURELLE TESLA', icon: '⚡', color: '#ddaaff', energyConsumption: 14,
    hp: 110, dmg: 20, range: 4.5, fireRate: 1600, isShooter: true,
    chainCount: 3, chainRange: 2,
    desc: 'Éclair en chaîne (3 cibles). (14 ⚡/s)',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'offensive',
    unlockReq: { wave: 4 }
  },
  plasma: {
    name: 'LASER PLASMA', icon: '◆', color: '#ff44aa', energyConsumption: 18,
    hp: 120, dmg: 55, range: 6, fireRate: 2500, isShooter: true,
    isSuperBeam: true,
    desc: 'Tir laser traversant la carte. (18 ⚡/s)',
    unlocked: false, cost: { credits: 400, samples: 4 }, category: 'offensive',
    unlockReq: { wave: 6 }
  },
  swarm_missile: {
    name: 'NUÉE MICRO-MISSILES', icon: '✥', color: '#ff4488', energyConsumption: 18,
    hp: 130, dmg: 20, range: 6.5, fireRate: 1500, isShooter: true, isMissile: true, isSwarmMissile: true, splash: 1.2,
    desc: 'Tire une véritable nuée de micro-missiles à tête chercheuse (3 × MK missiles par salve). (18 ⚡/s)',
    unlocked: false, cost: { credits: 380, samples: 3 }, category: 'offensive',
    unlockReq: { wave: 5 }
  },
  hyper_missile: {
    name: 'MISSILE TORPILLE', icon: '⤇', color: '#ffaa00', energyConsumption: 24,
    hp: 160, dmg: 130, range: 7.5, fireRate: 3500, isShooter: true, isMissile: true, isHyperMissile: true, splash: 2.8,
    desc: 'Torpilles guidées dévastatrices à zone d\'impact lourde (+1 missile par MK). (24 ⚡/s)',
    unlocked: false, cost: { credits: 520, samples: 5 }, category: 'offensive',
    unlockReq: { wave: 7 }
  },
  cone_laser: {
    name: 'LASER ÉVENTAIL', icon: '🪭', color: '#00ffaa', energyConsumption: 20,
    hp: 120, dmg: 16, range: 5, fireRate: 1400, isShooter: true, isConeLaser: true,
    desc: 'Balaye les ennemis avec des mini-lasers simultanés en cône (+1 faisceau par MK). (20 ⚡/s)',
    unlocked: false, cost: { credits: 420, samples: 3 }, category: 'offensive',
    unlockReq: { wave: 5 }
  },
  // --- PÉTROLE UNIQUEMENT ---
  oil_cannon: {
    name: 'GATLING PÉTROLIER', icon: '⛟', color: '#8b4513', oilConsumption: 8,
    hp: 180, dmg: 18, range: 5, fireRate: 120, isShooter: true,
    visual: 'hex', projectileStyle: 'heavy',
    desc: 'Mitrailleuse lourde à balles pétroliers incandescentes. Tir rapide. (8 🛢/s)',
    unlocked: false, cost: { credits: 280, samples: 2 }, category: 'offensive',
    unlockReq: { wave: 4 }
  },
  oil_flame: {
    name: 'INFERNO PÉTROLE', icon: '🔥', color: '#ff4400', oilConsumption: 10,
    hp: 200, dmg: 8, range: 4, fireRate: 80, isShooter: true, isFlamethrower: true,
    dotRatio: 0.15, dotDuration: 4000,
    visual: 'flower', projectileStyle: 'ember',
    desc: 'Flamme napalm persistante qui brûle les ennemis sur 4s. (10 🛢/s)',
    unlocked: false, cost: { credits: 320, samples: 3 }, category: 'offensive',
    unlockReq: { wave: 5 }
  },
  oil_mortar: {
    name: 'VOLCAN PÉTROLIER', icon: '⚱', color: '#aa6622', oilConsumption: 12,
    hp: 160, dmg: 45, range: 7, fireRate: 3500, isShooter: true, splash: 3.5, isMortar: true,
    visual: 'hourglass', projectileStyle: 'shell',
    desc: 'Laisse un lac de lave pétrolière qui brûle pendant 5s. (12 🛢/s)',
    unlocked: false, cost: { credits: 450, samples: 4 }, category: 'offensive',
    unlockReq: { wave: 6 }
  },
  oil_sniper: {
    name: 'PERCEUR PÉTROLE', icon: '🎯', color: '#cc8844', oilConsumption: 6,
    hp: 140, dmg: 120, range: 10, fireRate: 3000, isShooter: true, isRailgun: true, isPiercing: true,
    knockback: 3,
    visual: 'prism', projectileStyle: 'phase',
    desc: 'Tir perçant traverse 3 ennemis avec knockback massif. (6 🛢/s)',
    unlocked: false, cost: { credits: 380, samples: 4 }, category: 'offensive',
    unlockReq: { wave: 7 }
  },
  oil_cluster: {
    name: 'FRAGMENTATION PÉTROLE', icon: '💥', color: '#dd6633', oilConsumption: 15,
    hp: 150, dmg: 30, range: 6, fireRate: 2500, isShooter: true, splash: 2, isScatter: true, scatterCount: 9, scatterAngle: 1.2,
    deathNova: 80, deathNovaRatio: 0.4,
    visual: 'cluster', projectileStyle: 'debris',
    desc: 'Explosion secondaire à chaque impact. 9 projectiles en éventail large. (15 🛢/s)',
    unlocked: false, cost: { credits: 500, samples: 5 }, category: 'offensive',
    unlockReq: { wave: 8 }
  },
  // --- MIXTES (ÉNERGIE + PÉTROLE) ---
  hybrid_plasma: {
    name: 'FUSION PLASMA', icon: '⚛', color: '#ff88cc', energyConsumption: 12, oilConsumption: 5,
    hp: 130, dmg: 35, range: 7, fireRate: 2200, isShooter: true, isSuperBeam: true, isPiercing: true,
    visual: 'battery', projectileStyle: 'prism',
    desc: 'Faisceau plasma traversant toute la carte. Perce 2 ennemis. (12 ⚡/s + 5 🛢/s)',
    unlocked: false, cost: { credits: 400, samples: 4 }, category: 'offensive',
    unlockReq: { wave: 6 }
  },
  hybrid_tesla: {
    name: 'ORAGE TESLA', icon: '⚡', color: '#eebbff', energyConsumption: 10, oilConsumption: 4,
    hp: 120, dmg: 20, range: 4.5, fireRate: 1200, isShooter: true, chainCount: 5, chainRange: 3,
    slowFactor: 0.25, slowDuration: 2000,
    visual: 'spire', projectileStyle: 'electric',
    desc: 'Éclair en chaîne (5 cibles) qui ralentit 25%. (10 ⚡/s + 4 🛢/s)',
    unlocked: false, cost: { credits: 350, samples: 3 }, category: 'offensive',
    unlockReq: { wave: 5 }
  },
  hybrid_sonic: {
    name: 'TEMPÊTE SONIQUE', icon: '🔊', color: '#88ccff', energyConsumption: 8, oilConsumption: 6,
    hp: 140, dmg: 15, range: 6.5, fireRate: 1800, isShooter: true, isSonic: true, burstCount: 5, burstDelay: 150,
    knockback: 2,
    visual: 'ring', projectileStyle: 'pulse',
    desc: 'Rafale de 5 ondes avec knockback. Portée étendue. (8 ⚡/s + 6 🛢/s)',
    unlocked: false, cost: { credits: 320, samples: 3 }, category: 'offensive',
    unlockReq: { wave: 5 }
  },
  hybrid_riot: {
    name: 'HÉLICE TRONÇONNEUSE', icon: '🔫', color: '#ffaa44', energyConsumption: 14, oilConsumption: 7,
    hp: 170, dmg: 22, range: 4, fireRate: 300, isShooter: true, isConeLaser: true,
    multiTarget: 3,
    visual: 'blade', projectileStyle: 'shard',
    desc: 'Cône de projectiles qui touche 3 cibles simultanées. Cadence ultra-rapide. (14 ⚡/s + 7 🛢/s)',
    unlocked: false, cost: { credits: 380, samples: 4 }, category: 'offensive',
    unlockReq: { wave: 6 }
  },

  // --- SUPPORT ---
  shield_wall: {
    name: 'BOUCLIER LOURD', icon: '🛡', color: '#0ea5e9', energyConsumption: 2,
    hp: 10000, isWall: true,
    desc: 'Barrière défensive ultra-résistante. Possède 10 000 PV de structure. (2 ⚡/s)',
    unlocked: true, cost: { credits: 35, samples: 0 }, category: 'support',
    unlockReq: { wave: 1 }
  },
  secondary_core: {
    name: 'BASE SECONDAIRE', icon: '◈', color: '#38bdf8', energyConsumption: 3,
    hp: 2500, isCore: false, isSecondaryCore: true, canPlaceAnywhere: true,
    desc: 'Noyau secondaire (2500 PV). Se pose n\'importe où sur la carte pour étendre le réseau de tourelles. (+2 portails max) (3 ⚡/s)',
    unlocked: false, cost: { credits: 0, samples: 10 }, category: 'support',
    unlockReq: { wave: 5 }
  },
  // --- ÉNERGIE (Production) ---
  solar_basic: {
    name: 'PANNEAU SOLAIRE', icon: '☀', color: '#ffcc00',
    hp: 80, isEnergyProducer: true, energyProduction: 5,
    desc: 'Produit 5 énergie/seconde. Basique mais fiable.',
    unlocked: true, cost: { credits: 100, samples: 0 }, category: 'support',
    unlockReq: { wave: 1 }
  },
  solar_advanced: {
    name: 'PANNEAU SOLAIRE MK2', icon: '☀', color: '#ffdd44',
    hp: 100, isEnergyProducer: true, energyProduction: 12,
    desc: 'Produit 12 énergie/seconde. Technologie avancée.',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'support',
    unlockReq: { wave: 3 }
  },
  fusion_reactor: {
    name: 'RÉACTEUR FUSION', icon: '⚛', color: '#00ff88',
    hp: 150, isEnergyProducer: true, energyProduction: 25,
    desc: 'Produit 25 énergie/seconde. Puissance nucléaire.',
    unlocked: false, cost: { credits: 600, samples: 4 }, category: 'support',
    unlockReq: { wave: 6 }
  },
  quantum_core: {
    name: 'CŒUR QUANTIQUE', icon: '◇', color: '#00ffff',
    hp: 200, isEnergyProducer: true, energyProduction: 50,
    desc: 'Produit 50 énergie/seconde. Technologie de pointe.',
    unlocked: false, cost: { credits: 1200, samples: 8 }, category: 'support',
    unlockReq: { wave: 9 }
  },
  // --- PÉTROLE (Extraction) ---
  oil_pump_basic: {
    name: 'EXTRACTEUR PÉTROLE', icon: '●', color: '#8b4513',
    hp: 100, isOilProducer: true, oilProduction: 3,
    desc: 'Extrait 3 unités de pétrole/seconde. Ressource rare pour les modules puissants.',
    unlocked: true, cost: { credits: 150, samples: 0 }, category: 'support',
    unlockReq: { wave: 2 }
  },
  oil_pump_advanced: {
    name: 'EXTRACTEUR PÉTROLE MK2', icon: '●', color: '#a0522d',
    hp: 120, isOilProducer: true, oilProduction: 7,
    desc: 'Extrait 7 unités de pétrole/seconde. Forage profond.',
    unlocked: false, cost: { credits: 400, samples: 2 }, category: 'support',
    unlockReq: { wave: 4 }
  },
  oil_rig: {
    name: 'PLATEFORME PÉTROLIÈRE', icon: '●', color: '#cd853f',
    hp: 150, isOilProducer: true, oilProduction: 15,
    desc: 'Extrait 15 unités de pétrole/seconde. Installation industrielle.',
    unlocked: false, cost: { credits: 800, samples: 5 }, category: 'support',
    unlockReq: { wave: 7 }
  },
  // --- ÉNERGIE (Gestion) ---
  capacitor: {
    name: 'CONDENSATEUR', icon: '⏻', color: '#ff6600',
    hp: 70, isEnergyCapacitor: true, energyBoost: 0.15,
    desc: 'Booste la production d\'énergie de 15% pour les modules adjacents.',
    unlocked: false, cost: { credits: 200, samples: 1 }, category: 'support',
    unlockReq: { wave: 3 }
  },

  // --- SUPPORT (Suite) ---
  shield: {
    name: 'BOUCLIER', icon: '⊚', color: '#00ccff', energyConsumption: 8, range: 1.5,
    hp: 300, isShield: true, aura: { hp: 100 },
    desc: 'Augmente les HP des modules adjacents (+1 case de rayon par MK). (8 ⚡/s)',
    unlocked: true, cost: { credits: 200, samples: 0 }, category: 'support',
    unlockReq: { wave: 1 }
  },
  amplifier: {
    name: 'AMPLIFICATEUR', icon: '▲', color: '#ff3300', energyConsumption: 12, range: 1.5,
    hp: 50, isAmplifier: true, aura: { dmg: 0.15, fireRate: 0.1 },
    desc: 'Buff les dégâts/cadence des adjacents (+1 case de rayon par MK). (12 ⚡/s)',
    unlocked: true, cost: { credits: 250, samples: 0 }, category: 'support',
    unlockReq: { wave: 2 }
  },
  harvester: {
    name: 'HARVESTER', icon: '$', color: '#ffee00', energyConsumption: 10,
    hp: 40, isHarvester: true, passiveCredits: 5,
    desc: 'Génère des crédits passivement. (10 ⚡/s)',
    unlocked: false, cost: { credits: 180, samples: 2 }, category: 'support',
    unlockReq: { wave: 3 }
  },
  collector: {
    name: 'COLLECTEUR', icon: '🔬', color: '#cc66ff', energyConsumption: 12, range: 1.5,
    hp: 60, isCollector: true, aura: { credits: 0.35, samples: 0.15 },
    desc: 'Boost le loot des ennemis proches (+1 case de rayon par MK). (12 ⚡/s)',
    unlocked: false, cost: { credits: 300, samples: 3 }, category: 'support',
    unlockReq: { wave: 4 }
  },
  regen: {
    name: 'NANO-REGEN', icon: '✚', color: '#00ff66', energyConsumption: 8, range: 1.5,
    hp: 60, isRegen: true, healRate: 2.0,
    desc: 'Répare les modules adjacents (+1 case de rayon par MK). (8 ⚡/s)',
    unlocked: false, cost: { credits: 220, samples: 2 }, category: 'support',
    unlockReq: { wave: 4 }
  },
  radar: {
    name: 'RADAR', icon: '📡', color: '#00ffff', energyConsumption: 10, range: 1.5,
    hp: 60, isRangeBoost: true, aura: { range: 0.16 },
    desc: 'Augmente la portée des adjacents (+1 case de rayon par MK). (10 ⚡/s)',
    unlocked: false, cost: { credits: 250, samples: 2 }, category: 'support',
    unlockReq: { wave: 3 }
  },
  projectile_booster: {
    name: 'AMPLIFICATEUR PROJECTILE', icon: '⬡', color: '#ff00ff', energyConsumption: 15, range: 1.5,
    hp: 80, isProjectileBooster: true, aura: { projectileSize: 0.10, projectileDmg: 0.01, projectileAoE: 0.10 },
    desc: 'Augmente taille/dégâts/AoE des projectiles (+1 case de rayon par MK). (15 ⚡/s)',
    unlocked: false, cost: { credits: 350, samples: 4 }, category: 'support',
    unlockReq: { wave: 6 }
  },
  replicator: {
    name: 'RÉPLICATEUR', icon: '⌘', color: '#ffffff', energyConsumption: 18,
    hp: 60, isReplicator: true,
    desc: 'Génère 1 échantillon toutes les 45s. (18 ⚡/s)',
    unlocked: false, cost: { credits: 300, samples: 1 }, category: 'support',
    unlockReq: { wave: 5 }
  },
  patrol_small: {
    name: 'HANGAR ALPHA', icon: '✈', color: '#00ffaa', energyConsumption: 15,
    hp: 100, isPatrol: true, patrolType: 'basic',
    desc: 'Génère des intercepteurs rapides. (15 ⚡/s)',
    unlocked: false, cost: { credits: 300, samples: 2 }, category: 'support',
    unlockReq: { wave: 4 }
  },
  patrol_heavy: {
    name: 'HANGAR DELTA', icon: '🚁', color: '#ff3333', energyConsumption: 22,
    hp: 150, isPatrol: true, patrolType: 'heavy',
    desc: 'Génère des drones de choc lourds. (22 ⚡/s)',
    unlocked: false, cost: { credits: 500, samples: 4 }, category: 'support',
    unlockReq: { wave: 7 }
  },
  patrol_repair: {
    name: 'HANGAR REPEN', icon: '🛠', color: '#33ffaa', energyConsumption: 18,
    hp: 120, isPatrol: true, patrolType: 'support',
    desc: 'Génère des unités de réparation. (18 ⚡/s)',
    unlocked: false, cost: { credits: 350, samples: 3 }, category: 'support',
    unlockReq: { wave: 6 }
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
  { id: 'u_regen', name: 'NANO-RÉPARATION', desc: '+0.2 HP/s tous modules', maxLevel: 24, baseCost: { credits: 75, samples: 0 }, costScale: 1.5, effect: 'regenAll', value: 0.2 },
  { id: 'u_energy', name: 'FLUX CAPACITOR', desc: '+10% production énergie', maxLevel: 6, baseCost: { credits: 130, samples: 0 }, costScale: 1.6, effect: 'energyProd', value: 0.10 },
  { id: 'u_accuracy', name: 'CALIBRATION BALISTIQUE', desc: '-12% dispersion des projectiles', maxLevel: 6, baseCost: { credits: 150, samples: 1 }, costScale: 1.55, effect: 'accuracy', value: 0.12 },
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
