// ============================================================
// CESTUS CONTROL — HELIOS expansion
// Twenty offensive modules and six enemy archetypes.
// ============================================================

Object.assign(MODULE_TYPES, {
  prism: {
    name: 'PRISME DÉSIGNATEUR', icon: '◇', color: '#62f6ff', energyConsumption: 14,
    hp: 105, dmg: 10, range: 6, fireRate: 850, isShooter: true,
    markPower: 0.08, markDuration: 5000, mechanic: 'MARQUAGE', visual: 'prism', group: 'energy',
    desc: 'Marque la cible : chaque attaque suivante inflige +8% de dégâts. (14 ⚡/s)',
    unlocked: false, cost: { credits: 230, samples: 1 }, category: 'offensive', unlockReq: { credits: 200, samples: 1 }
  },
  null_lance: {
    name: 'LANCE DU VIDE', icon: '↦', color: '#c4b5fd', energyConsumption: 28,
    hp: 95, dmg: 78, range: 8.5, fireRate: 3400, isShooter: true, isRailgun: true,
    pureDamage: true, mechanic: 'DÉGÂTS PURS', visual: 'blade', group: 'prototype',
    desc: 'Traverse les lignes et ignore blindage, protection et réduction. (28 ⚡/s)',
    unlocked: false, cost: { credits: 560, samples: 5 }, category: 'offensive', unlockReq: { samples: 6 }
  },
  executioner: {
    name: 'EXÉCUTEUR', icon: '⌁', color: '#ff6b7a', energyConsumption: 22,
    hp: 120, dmg: 46, range: 5.5, fireRate: 1900, isShooter: true,
    executeThreshold: 0.25, executeMult: 4, mechanic: 'EXÉCUTION', visual: 'blade', group: 'kinetic',
    desc: 'Inflige ×4 aux ennemis sous 25% de leurs points de vie. (22 ⚡/s)',
    unlocked: false, cost: { credits: 390, samples: 3 }, category: 'offensive', unlockReq: { samples: 4 }
  },
  acid_weaver: {
    name: 'TISSE-ACIDE', icon: '≋', color: '#b7f34a', energyConsumption: 17,
    hp: 135, dmg: 14, range: 4.8, fireRate: 700, isShooter: true,
    armorShred: 0.08, armorShredDuration: 6000, dotRatio: 0.22, dotDuration: 4000,
    mechanic: 'CORROSION', visual: 'ring', group: 'control',
    desc: 'Ronge 8% de blindage par impact et applique une corrosion persistante. (17 ⚡/s)',
    unlocked: false, cost: { credits: 310, samples: 2 }, category: 'offensive', unlockReq: { samples: 3 }
  },
  chrono_anchor: {
    name: 'ANCRE CHRONO', icon: '◷', color: '#72ddf7', energyConsumption: 32,
    hp: 110, dmg: 18, range: 4.2, fireRate: 4800, isShooter: true, isRadialPulse: true,
    stasisFactor: 0.14, stasisDuration: 1500, mechanic: 'STASE', visual: 'hourglass', group: 'control',
    desc: 'Une impulsion circulaire fige presque tous les ennemis proches. (32 ⚡/s)',
    unlocked: false, cost: { credits: 480, samples: 4 }, category: 'offensive', unlockReq: { samples: 5 }
  },
  emp_spire: {
    name: 'FLÈCHE EMP', icon: '⌁', color: '#69f0d1', energyConsumption: 24,
    hp: 100, dmg: 12, range: 6, fireRate: 2600, isShooter: true, multiTarget: 5,
    silenceDuration: 5000, mechanic: 'SILENCE', visual: 'spire', group: 'control',
    desc: 'Neutralise téléportation, soin, invocation et capacités de cinq cibles. (24 ⚡/s)',
    unlocked: false, cost: { credits: 420, samples: 3 }, category: 'offensive', unlockReq: { samples: 4 }
  },
  mine_architect: {
    name: 'ARCHITECTE MINIER', icon: '⌾', color: '#ffb84d', energyConsumption: 16,
    hp: 145, dmg: 85, range: 6, fireRate: 3600, isShooter: true, isMineLayer: true,
    mineTrigger: 55, mineSplash: 125, mechanic: 'MINES', visual: 'hex', group: 'kinetic',
    desc: 'Déploie des mines intelligentes persistantes sur les routes adverses. (16 ⚡/s)',
    unlocked: false, cost: { credits: 340, samples: 2 }, category: 'offensive', unlockReq: { credits: 320, samples: 2 }
  },
  cluster_bloom: {
    name: 'FLORA CLUSTER', icon: '✣', color: '#ff8b5c', energyConsumption: 26,
    hp: 125, dmg: 55, range: 7, fireRate: 3300, splash: 2.2, clusterCount: 5, isShooter: true,
    mechanic: 'SOUS-MUNITIONS', visual: 'flower', group: 'kinetic',
    desc: 'Chaque obus éclate en cinq sous-munitions cherchant des cibles proches. (26 ⚡/s)',
    unlocked: false, cost: { credits: 470, samples: 4 }, category: 'offensive', unlockReq: { samples: 5 }
  },
  helix_array: {
    name: 'RÉSEAU HÉLICE', icon: 'ψ', color: '#61dafb', energyConsumption: 23,
    hp: 115, dmg: 24, range: 5.8, fireRate: 1450, isShooter: true, multiTarget: 3,
    mechanic: 'TRI-CIBLE', visual: 'helix', group: 'energy',
    desc: 'Verrouille et frappe simultanément les trois cibles les plus proches. (23 ⚡/s)',
    unlocked: false, cost: { credits: 360, samples: 3 }, category: 'offensive', unlockReq: { samples: 3 }
  },
  pulse_ram: {
    name: 'BÉLIER PULSÉ', icon: '◎', color: '#7df9ff', energyConsumption: 21,
    hp: 185, dmg: 22, range: 3.8, fireRate: 2200, isShooter: true, isRadialPulse: true,
    knockback: 65, mechanic: 'REPULSION', visual: 'ring', group: 'control',
    desc: 'Repousse en cercle toute la première ligne et brise les formations. (21 ⚡/s)',
    unlocked: false, cost: { credits: 350, samples: 2 }, category: 'offensive', unlockReq: { credits: 350, samples: 2 }
  },
  leech_node: {
    name: 'NŒUD SANGSUE', icon: '∿', color: '#ff5ca8', energyConsumption: 20,
    hp: 165, dmg: 9, range: 5, fireRate: 160, isShooter: true, isBeam: true,
    lifeSteal: 0.35, mechanic: 'VOL DE VIE', visual: 'eye', group: 'energy',
    desc: 'Convertit 35% des dégâts du rayon en réparation pour lui-même. (20 ⚡/s)',
    unlocked: false, cost: { credits: 380, samples: 3 }, category: 'offensive', unlockReq: { samples: 4 }
  },
  bossbreaker: {
    name: 'BRISE-COLOSSE', icon: '⬡', color: '#ffd166', energyConsumption: 30,
    hp: 155, dmg: 68, range: 7.2, fireRate: 2800, isShooter: true,
    bossMult: 3.2, mechanic: 'ANTI-BOSS', visual: 'hex', group: 'kinetic',
    desc: 'Canon lourd infligeant quatre fois plus de dégâts aux boss. (30 ⚡/s)',
    unlocked: false, cost: { credits: 520, samples: 5 }, category: 'offensive', unlockReq: { samples: 6 }
  },
  entropy_needle: {
    name: 'AIGUILLE ENTROPIQUE', icon: '⌇', color: '#e9a8ff', energyConsumption: 25,
    hp: 90, dmg: 30, range: 6.5, fireRate: 1250, isShooter: true,
    missingHpMult: 2.2, mechanic: 'ENTROPIE', visual: 'spire', group: 'prototype',
    desc: 'Les dégâts augmentent avec les PV déjà perdus par la cible. (25 ⚡/s)',
    unlocked: false, cost: { credits: 430, samples: 4 }, category: 'offensive', unlockReq: { samples: 5 }
  },
  nova_seed: {
    name: 'GRAINE NOVA', icon: '✺', color: '#ffcf70', energyConsumption: 19,
    hp: 115, dmg: 28, range: 5.2, fireRate: 1700, isShooter: true,
    deathNova: 95, deathNovaRatio: 0.65, mechanic: 'NOVA MORTELLE', visual: 'flower', group: 'prototype',
    desc: 'Les ennemis éliminés explosent et propagent une onde létale. (19 ⚡/s)',
    unlocked: false, cost: { credits: 370, samples: 3 }, category: 'offensive', unlockReq: { samples: 4 }
  },
  kinetic_battery: {
    name: 'BATTERIE KINÉTIQUE', icon: '▰', color: '#f6d365', energyConsumption: 18,
    hp: 150, dmg: 18, range: 5.5, fireRate: 500, isShooter: true,
    chargeEvery: 6, chargeMult: 5, mechanic: 'TIR CHARGÉ', visual: 'battery', group: 'kinetic',
    desc: 'Accumule cinq tirs puis libère un sixième impact sept fois plus puissant. (18 ⚡/s)',
    unlocked: false, cost: { credits: 330, samples: 2 }, category: 'offensive', unlockReq: { credits: 300, samples: 2 }
  },
  shardstorm: {
    name: 'TEMPÊTE D\'ÉCLATS', icon: '≪', color: '#9ae6b4', energyConsumption: 27,
    hp: 130, dmg: 16, range: 5.5, fireRate: 1900, isShooter: true, isScatter: true,
    scatterCount: 7, scatterAngle: 0.85, mechanic: 'CÔNE PERFORANT', visual: 'fan', group: 'kinetic',
    desc: 'Projette sept éclats perforants dans un large cône. (27 ⚡/s)',
    unlocked: false, cost: { credits: 410, samples: 4 }, category: 'offensive', unlockReq: { samples: 5 }
  },
  aurora_array: {
    name: 'MATRICE AURORE', icon: '≋', color: '#7ee8fa', energyConsumption: 29,
    hp: 105, dmg: 26, range: 6, fireRate: 1150, isShooter: true, multiTarget: 2,
    elemental: true, mechanic: 'TRI-ÉLÉMENT', visual: 'aurora', group: 'energy',
    desc: 'Alterne feu corrosif, gel profond et surcharge électrique. (29 ⚡/s)',
    unlocked: false, cost: { credits: 490, samples: 5 }, category: 'offensive', unlockReq: { samples: 6 }
  },
  bounty_compiler: {
    name: 'COMPILATEUR PRIME', icon: '¢', color: '#ffe66d', energyConsumption: 15,
    hp: 100, dmg: 20, range: 5, fireRate: 900, isShooter: true,
    bountyMult: 2.5, mechanic: 'PRIME ×2.5', visual: 'diamond', group: 'prototype',
    desc: 'Les ennemis achevés par ce module rapportent 2,5 fois plus de crédits. (15 ⚡/s)',
    unlocked: false, cost: { credits: 450, samples: 4 }, category: 'offensive', unlockReq: { samples: 5 }
  },
  phase_repeater: {
    name: 'RÉPÉTEUR PHASE', icon: '∥', color: '#a5b4fc', energyConsumption: 34,
    hp: 85, dmg: 10, range: 6.2, fireRate: 180, isShooter: true, isBeam: true,
    pureDamage: true, mechanic: 'PHASE RAPIDE', visual: 'prism', group: 'prototype',
    desc: 'Flux rapide qui traverse toutes les défenses physiques. (34 ⚡/s)',
    unlocked: false, cost: { credits: 620, samples: 7 }, category: 'offensive', unlockReq: { samples: 8 }
  },
  gravity_hammer: {
    name: 'MARTEAU GRAVITON', icon: '◉', color: '#f0abfc', energyConsumption: 38,
    hp: 210, dmg: 95, range: 5.8, fireRate: 4400, splash: 3, isShooter: true,
    knockback: 90, mechanic: 'IMPACT GRAVITON', visual: 'hammer', group: 'control',
    desc: 'Impact de zone massif qui projette toute une escouade en arrière. (38 ⚡/s)',
    unlocked: false, cost: { credits: 680, samples: 7 }, category: 'offensive', unlockReq: { samples: 8 }
  },

  // HELIOS logistics wing — compact, specialized infrastructure.
  capacitor_bank: {
    name:'BANQUE CAPACITIVE', icon:'▥', color:'#ffe082', energyConsumption: 0, hp:190, isPassive:true,
    baseEnergy:55, mechanic:'RÉSERVE +55', shortDesc:'+55 capacité énergétique.',
    desc:'Ajoute une réserve énergétique fixe au réseau, idéale avant une grosse extension.',
    unlocked:false, cost:{credits:260,samples:2}, category:'support', unlockReq:{samples:2}
  },
  grid_relay: {
    name:'RELAIS DE GRILLE', icon:'⌬', color:'#67e8f9', energyConsumption: 4, hp:140, isPassive:true,isEnergyRelay:true,
    adjacencyEnergyDiscount:.22, mechanic:'ÉCO ADJACENTE', shortDesc:'-22% énergie adjacente.',
    desc:'Réduit de 22% la consommation énergétique de chaque module directement adjacent. (4 ⚡/s)',
    unlocked:false,cost:{credits:310,samples:3},category:'support',unlockReq:{samples:3}
  },
  repair_forge: {
    name:'FORGE NANO',icon:'✚',color:'#86efac',energyConsumption: 18,hp:180,isPassive:true,isRegen:true,healRate:5,
    mechanic:'RÉPARATION',shortDesc:'Réparation adjacente rapide.',
    desc:'Répare fortement les structures adjacentes et stabilise les lignes exposées. (18 ⚡/s)',
    unlocked:false,cost:{credits:340,samples:3},category:'support',unlockReq:{samples:3}
  },
  data_foundry: {
    name:'FONDERIE DE DONNÉES',icon:'¢',color:'#fde047',energyConsumption: 24,hp:95,isPassive:true,isHarvester:true,passiveCredits:12,
    mechanic:'RENDEMENT',shortDesc:'+12 crédits par seconde.',
    desc:'Transforme le surplus énergétique en crédits continus, sans dépendre des éliminations. (24 ⚡/s)',
    unlocked:false,cost:{credits:420,samples:4},category:'support',unlockReq:{samples:4}
  },
  sample_lab: {
    name:'LABORATOIRE RIFT',icon:'⚗',color:'#d8b4fe',energyConsumption: 42,hp:90,isPassive:true,isReplicator:true,replicatorBaseSec:28,
    mechanic:'SYNTHÈSE',shortDesc:'1 échantillon toutes les 28s.',
    desc:'Condense les résidus de faille et synthétise régulièrement un échantillon. (42 ⚡/s)',
    unlocked:false,cost:{credits:520,samples:5},category:'support',unlockReq:{samples:6}
  },
  targeting_matrix: {
    name:'MATRICE DE VISÉE',icon:'⌖',color:'#5eead4',energyConsumption: 20,hp:110,isPassive:true,isRangeBoost:true,
    aura:{range:.10,accuracy:.32},mechanic:'PRÉCISION',shortDesc:'Portée +10%, dispersion -32%.',
    desc:'Améliore la portée et resserre fortement la dispersion des tourelles adjacentes. (20 ⚡/s)',
    unlocked:false,cost:{credits:390,samples:4},category:'support',unlockReq:{samples:4}
  },
  coolant_loop: {
    name:'BOUCLE CRYO',icon:'❅',color:'#7dd3fc',energyConsumption: 16,hp:125,isPassive:true,isAmplifier:true,
    aura:{dmg:0,fireRate:.18},mechanic:'REFROIDISSEMENT',shortDesc:'Cadence adjacente +18%.',
    desc:'Dissipe la chaleur des armes adjacentes et améliore leur cadence sans augmenter les dégâts. (16 ⚡/s)',
    unlocked:false,cost:{credits:360,samples:3},category:'support',unlockReq:{samples:3}
  },
  fortress_node: {
    name:'NŒUD FORTERESSE',icon:'⬢',color:'#93c5fd',energyConsumption: 28,hp:420,isPassive:true,isShield:true,
    aura:{hp:.55},mechanic:'BASTION',shortDesc:'PV adjacents +55%.',
    desc:'Projette une enveloppe structurelle massive autour des modules adjacents. (28 ⚡/s)',
    unlocked:false,cost:{credits:480,samples:5},category:'support',unlockReq:{samples:5}
  },
  salvage_array: {
    name:'MATRICE DE RÉCUP',icon:'♲',color:'#f0abfc',energyConsumption: 25,hp:115,isPassive:true,isCollector:true,
    aura:{credits:.25,samples:.12},mechanic:'SALVAGE',shortDesc:'Butin adjacent amélioré.',
    desc:'Analyse les cibles détruites par les armes adjacentes et augmente leur butin. (25 ⚡/s)',
    unlocked:false,cost:{credits:450,samples:5},category:'support',unlockReq:{samples:5}
  }
});

// Classify the original arsenal for the new doctrine filters.
const ORIGINAL_GROUPS = {
  turret:'kinetic', laser:'energy', missile:'kinetic', beam:'energy', railgun:'kinetic',
  mortar:'kinetic', frost:'control', flame:'energy', sonic:'control', bolt:'energy',
  gamma:'prototype', orbital:'prototype', blackhole:'control', poison:'control',
  tesla:'energy', plasma:'prototype'
};
Object.entries(ORIGINAL_GROUPS).forEach(([id, group]) => { if (MODULE_TYPES[id]) MODULE_TYPES[id].group = group; });

// Strong silhouettes: each weapon family gets its own chassis and emitter.
const MODULE_VISUAL_IDENTITIES = {
  core:['hex','pulse'],
  turret:['hex','gatling'], laser:['diamond','laser'], missile:['battery','missile'], beam:['prism','beam'],
  railgun:['spire','railgun'], mortar:['ring','mortar'], frost:['flower','cryo'], flame:['battery','flame'],
  sonic:['fan','sonic'], bolt:['spire','electric'], gamma:['ring','gamma'], orbital:['eye','orbital'],
  blackhole:['ring','vortex'], poison:['flower','toxic'], tesla:['helix','electric'], plasma:['prism','plasma'],
  prism:['prism','laser'], null_lance:['blade','railgun'], executioner:['blade','heavy'], acid_weaver:['ring','toxic'],
  chrono_anchor:['hourglass','pulse'], emp_spire:['spire','electric'], mine_architect:['hex','mine'],
  cluster_bloom:['flower','mortar'], helix_array:['helix','helix'], pulse_ram:['ring','pulse'],
  leech_node:['eye','beam'], bossbreaker:['hex','heavy'], entropy_needle:['spire','railgun'],
  nova_seed:['flower','plasma'], kinetic_battery:['battery','gatling'], shardstorm:['fan','scatter'],
  aurora_array:['aurora','prism'], bounty_compiler:['diamond','scanner'], phase_repeater:['prism','beam'],
  gravity_hammer:['hammer','heavy'], capacitor_bank:['battery','scanner'], grid_relay:['helix','pulse'],
  repair_forge:['flower','scanner'], data_foundry:['diamond','scanner'], sample_lab:['prism','scanner'],
  targeting_matrix:['eye','scanner'], coolant_loop:['ring','cryo'], fortress_node:['hex','heavy'], salvage_array:['ring','scanner']
};
Object.entries(MODULE_VISUAL_IDENTITIES).forEach(([id, identity]) => {
  if (!MODULE_TYPES[id]) return;
  MODULE_TYPES[id].visual = identity[0];
  MODULE_TYPES[id].weaponModel = identity[1];
});

Object.assign(ENEMY_TYPES, {
  regenerator: {
    name:'Régénérateur', hp:180, speed:0.75, dmg:7, size:13,
    reward:{credits:38,xp:48,samples:0.09}, color:'#52d273', shape:'hexagon',
    regenPerSec:12
  },
  phaser: {
    name:'Phaseur', hp:95, speed:1.25, dmg:6, size:11,
    reward:{credits:42,xp:52,samples:0.12}, color:'#a78bfa', shape:'diamond',
    phaseInterval:4200, phaseDuration:1200
  },
  commander: {
    name:'Commandeur', hp:240, speed:0.55, dmg:9, size:15,
    reward:{credits:58,xp:72,samples:0.16}, color:'#fb7185', shape:'hexagon',
    isCommander:true, commandAura:190
  },
  siphon: {
    name:'Siphon', hp:110, speed:1.0, dmg:5, size:11,
    reward:{credits:35,xp:45,samples:0.10}, color:'#f472b6', shape:'triangle',
    isSiphon:true, creditSteal:8
  },
  berserker: {
    name:'Berserker', hp:210, speed:0.8, dmg:10, size:14,
    reward:{credits:45,xp:58,samples:0.12}, color:'#ff7849', shape:'square',
    isBerserker:true
  },
  juggernaut: {
    name:'Juggernaut', hp:650, speed:0.32, dmg:20, size:18,
    reward:{credits:95,xp:120,samples:0.24}, color:'#94a3b8', shape:'hexagon',
    damageReduction:0.35, slowResist:0.65
  },
  siegeCrawler: {
    name:'Artilleur de siège',hp:260,speed:.48,dmg:8,size:15,
    reward:{credits:62,xp:78,samples:.16},color:'#f59e0b',shape:'hexagon',
    shootRange:520,shootRate:1800,shootDmg:34,siegeCapable:true,siegeMinRange:200
  },
  fortress: {
    name:'La Forteresse', hp:3500, speed:0.28, dmg:50, size:36,
    reward:{credits:380,xp:500,samples:1.5}, color:'#ff2a5f', shape:'octagon',
    isBoss:true, isFortress:true, shootRange:600, shootRate:900, shootDmg:70,
    siegeCapable:true, siegeMinRange:150
  }
});

ENEMY_TYPES.ranged.siegeCapable = true;
ENEMY_TYPES.ranged.siegeMinRange = 120;
ENEMY_TYPES.sniper.siegeCapable = true;
ENEMY_TYPES.sniper.siegeMinRange = 200;
ENEMY_TYPES.juggernaut.siegeCapable = true;
ENEMY_TYPES.juggernaut.shootRange = 450;
ENEMY_TYPES.juggernaut.shootRate = 2000;
ENEMY_TYPES.juggernaut.shootDmg = 40;
ENEMY_TYPES.commander.siegeCapable = true;
ENEMY_TYPES.commander.shootRange = 480;
ENEMY_TYPES.commander.shootRate = 2200;
ENEMY_TYPES.commander.shootDmg = 30;

WAVE_SPAWN_WEIGHTS.mid.push(
  {type:'regenerator',w:0.06}, {type:'phaser',w:0.05}, {type:'siphon',w:0.04}, {type:'siegeCrawler',w:0.08}
);
WAVE_SPAWN_WEIGHTS.late.push(
  {type:'regenerator',w:0.09}, {type:'phaser',w:0.08}, {type:'commander',w:0.07},
  {type:'siphon',w:0.06}, {type:'berserker',w:0.08}, {type:'juggernaut',w:0.07}, {type:'siegeCrawler',w:0.10}
);
