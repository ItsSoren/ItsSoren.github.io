// ============================================================
// CESTUS CONTROL — Rift Directives
// One meaningful risk/reward decision before every wave.
// ============================================================

const RIFT_DIRECTIVES = [
  {
    id:'iron_liturgy', icon:'⬡', title:'LITURGIE DE FER', risk:2, color:'#ff9f43',
    riskText:'+70% PV, blindage renforcé', rewardText:'Crédits ×2.2 + prime',
    description:'Des coques rituelles absorbent les premiers impacts.',
    effects:{ hpMult:1.70, armor:0.14, creditsMult:2.20, clearCredits:90 }
  },
  {
    id:'red_shift', icon:'»', title:'DÉCALAGE ROUGE', risk:2, color:'#ff5d73',
    riskText:'+38% vitesse, +30% dégâts', rewardText:'XP ×2.2 + prime',
    description:'La faille accélère tout ce qu’elle recrache.',
    effects:{ speedMult:1.38, dmgMult:1.30, xpMult:2.20, clearCredits:65 }
  },
  {
    id:'hive_echo', icon:'✣', title:'ÉCHO DE RUCHE', risk:3, color:'#c084fc',
    riskText:'+65% ennemis, fronts multiples', rewardText:'Crédits ×2.4, échantillons',
    description:'Une même conscience attaque depuis plusieurs brèches.',
    effects:{ countMult:1.65, extraCones:2, spawnRateMult:0.74, creditsMult:2.40, clearSamples:0.35 }
  },
  {
    id:'glass_revenants', icon:'◇', title:'REVENANTS DE VERRE', risk:1, color:'#67e8f9',
    riskText:'Dégâts ×2.4, PV divisés par 2', rewardText:'Échantillons ×4 + garanti',
    description:'Fragiles, fulgurants, capables de pulvériser une ligne mal placée.',
    effects:{ hpMult:0.50, dmgMult:2.40, samplesMult:4, clearSamples:1, clearCredits:55 }
  },
  {
    id:'elite_signal', icon:'♛', title:'SIGNAL DOMINANT', risk:3, color:'#fbbf24',
    riskText:'45% d’élites dans la vague', rewardText:'Crédits et XP ×2.5',
    description:'Les signatures les plus dangereuses répondent à l’appel.',
    effects:{ eliteChance:0.45, creditsMult:2.5, xpMult:2.5, clearCredits:120, clearSamples:0.45 }
  },
  {
    id:'gravity_well', icon:'◉', title:'PUITS GRAVITIQUE', risk:2, color:'#818cf8',
    riskText:'+35% PV, ennemis compacts', rewardText:'+60% crédits, +35% XP',
    description:'Une masse compacte idéale pour l’aire… si elle ne traverse pas.',
    effects:{ hpMult:1.35, spawnTightness:0.45, creditsMult:1.60, xpMult:1.35 }
  },
  {
    id:'black_sun', icon:'✹', title:'SOLEIL NOIR', risk:4, color:'#fb7185',
    riskText:'MEGA-BOSS garanti, dégâts ×1.6', rewardText:'Jackpot de rupture',
    description:'Une présence colossale force le passage hors cycle.',
    effects:{ forceMega:true, dmgMult:1.60, hpMult:1.30, creditsMult:2.5, xpMult:2.2, clearCredits:450, clearSamples:2 }
  },
  {
    id:'fractured_front', icon:'⌁', title:'FRONT FRACTURÉ', risk:3, color:'#2dd4bf',
    riskText:'+3 routes, failles très instables', rewardText:'XP ×2.3, crédits ×1.8',
    description:'La défense doit pivoter sans cesse entre des angles opposés.',
    effects:{ extraCones:3, portalShiftMult:0.55, xpMult:2.30, creditsMult:1.80, clearCredits:80 }
  },
  {
    id:'void_tax', icon:'∅', title:'DÎME DU VIDE', risk:2, color:'#a78bfa',
    riskText:'Régénération rapide', rewardText:'Prime +260¢, crédits ×1.8',
    description:'La faille répare lentement ses créatures tant qu’elles respirent.',
    effects:{ regenMult:0.014, hpMult:1.25, clearCredits:260, creditsMult:1.80, clearSamples:0.3 }
  },
  {
    id:'storm_protocol', icon:'ϟ', title:'PROTOCOLE TEMPÊTE', risk:3, color:'#38bdf8',
    riskText:'Arrivée trois fois plus rapide', rewardText:'Crédits et XP ×3',
    description:'Aucun répit entre les escouades; la surcharge devient vitale.',
    effects:{ spawnRateMult:0.34, speedMult:1.18, creditsMult:3, xpMult:3, clearCredits:100 }
  },
  {
    id:'quantum_mirrors', icon:'⟐', title:'MIROIRS QUANTIQUES', risk:4, color:'#7dd3fc',
    riskText:'Téléportations et routes imprévisibles', rewardText:'Butin ×3.2 + échantillon',
    description:'Chaque unité saute dans l’espace. Le front n’existe plus, seulement des échos.',
    effects:{ teleportAll:true, portalShiftMult:0.45, speedMult:1.12, creditsMult:3.2, xpMult:2.8, clearSamples:1 }
  },
  {
    id:'volatile_carnival', icon:'✺', title:'CARNAVAL VOLATIL', risk:4, color:'#fb923c',
    riskText:'35% de kamikazes, essaim dense', rewardText:'Crédits ×3.5, prime explosive',
    description:'Une parade instable fonce sur le noyau et transforme chaque mort en feu d’artifice.',
    effects:{ kamikazeChance:0.35, countMult:1.25, spawnRateMult:0.72, creditsMult:3.5, clearCredits:180, clearSamples:0.65 }
  },
  {
    id:'frost_bite', icon:'❄', title:'MORSURE DE GLACE', risk:2, color:'#a5f3fc',
    riskText:'Ralentissement des tourelles, +25% PV', rewardText:'Crédits ×2.1, échantillons',
    description:'Le froid extrême fige les mécanismes de défense.',
    effects:{ hpMult:1.25, turretSlow:0.15, creditsMult:2.1, clearSamples:0.25, clearCredits:70 }
  },
  {
    id:'blood_frenzy', icon:'⚔', title:'FRÉNÉSIE SANGUINE', risk:3, color:'#fda4af',
    riskText:'+50% dégâts, dégâts en cascade', rewardText:'XP ×2.6, crédits ×2.2',
    description:'Chaque mort enrage les survivants, créant une chaîne de violence.',
    effects:{ dmgMult:1.50, deathRage:0.08, creditsMult:2.2, xpMult:2.6, clearCredits:95 }
  },
  {
    id:'shadow_step', icon:'◈', title:'PASSE D\'OMBRE', risk:3, color:'#94a3b8',
    riskText:'Invisibilité partielle, +40% vitesse', rewardText:'Échantillons ×2.5, crédits ×2',
    description:'Les ennemis deviennent insaisissables, apparaissant et disparaissant.',
    effects:{ speedMult:1.40, stealthChance:0.35, creditsMult:2, samplesMult:2.5, clearSamples:0.8 }
  },
  {
    id:'entropy_field', icon:'∞', title:'CHAMP D\'ENTROPIE', risk:4, color:'#c4b5fd',
    riskText:'Dégradation des projectiles, +60% PV', rewardText:'Jackpot d\'échantillons',
    description:'Le champ altère la physique, réduisant l\'efficacité des tirs.',
    effects:{ hpMult:1.60, projectileDecay:0.25, creditsMult:2.8, xpMult:2.4, clearSamples:1.5, clearCredits:150 }
  },
  {
    id:'neon_overload', icon:'⚡', title:'SURCHARGE NÉON', risk:2, color:'#fde047',
    riskText:'Éclairs aléatoires, +20% dégâts', rewardText:'Crédits ×1.9, XP ×2',
    description:'Des arcs électriques frappent aléatoirement le champ de bataille.',
    effects:{ dmgMult:1.20, lightningStrikes:true, creditsMult:1.9, xpMult:2, clearCredits:85 }
  },
  {
    id:'crimson_tide', icon:'🌊', title:'MARÉE CRAMOISI', risk:3, color:'#dc2626',
    riskText:'+40% ennemis, régénération collective', rewardText:'Crédits ×2.6, échantillons',
    description:'Une vague écarlate qui se soigne mutuellement.',
    effects:{ countMult:1.40, groupRegen:0.008, creditsMult:2.6, clearSamples:0.5, clearCredits:110 }
  },
  {
    id:'phantom_phase', icon:'👻', title:'PHASE SPECTRALE', risk:2, color:'#c084fc',
    riskText:'Invisibilité, +25% vitesse, -30% PV', rewardText:'XP ×2.4, crédits ×2',
    description:'Les ennemis deviennent intangibles par intermittence.',
    effects:{ speedMult:1.25, hpMult:0.70, stealthChance:0.5, creditsMult:2, xpMult:2.4, clearCredits:90 }
  },
  {
    id:'inferno_core', icon:'🔥', title:'CŒUR D\'ENFER', risk:4, color:'#f97316',
    riskText:'Feu persistant, +50% dégâts, +35% PV', rewardText:'Jackpot de crédits',
    description:'Chaque ennemi laisse une traînée de flammes éternelles.',
    effects:{ hpMult:1.35, dmgMult:1.50, fireTrail:true, creditsMult:3.0, xpMult:2.5, clearCredits:200, clearSamples:0.8 }
  },
  {
    id:'time_dilation', icon:'⏳', title:'DILATION TEMPORELLE', risk:3, color:'#06b6d4',
    riskText:'Vitesse variable, +30% dégâts', rewardText:'XP ×2.7, crédits ×2.3',
    description:'Le temps s\'accélère et ralentit de manière imprévisible.',
    effects:{ speedMult:1.30, dmgMult:1.30, timeFluctuation:true, creditsMult:2.3, xpMult:2.7, clearCredits:105 }
  },
  {
    id:'void_echoes', icon:'🌀', title:'ÉCHOS DU VIDE', risk:4, color:'#6366f1',
    riskText:'Clones holographiques, +80% ennemis', rewardText:'Échantillons ×3, XP ×2.8',
    description:'Chaque ennemi génère des échos illusoire à sa mort.',
    effects:{ countMult:1.80, cloneOnDeath:true, creditsMult:2.2, xpMult:2.8, clearSamples:1.2, clearCredits:130 }
  },
  {
    id:'solar_flare', icon:'☀', title:'ÉRUPTION SOLAIRE', risk:2, color:'#fbbf24',
    riskText:'Rayonnement aveuglant, +15% dégâts', rewardText:'Crédits ×2, échantillons',
    description:'Une tempête solaire aveugle les tourelles périodiquement.',
    effects:{ dmgMult:1.15, blindTurrets:true, creditsMult:2, clearSamples:0.3, clearCredits:75 }
  }
];

function ensureDirectiveState() {
  if (!G.directiveChoices) G.directiveChoices = [];
  if (!G.directiveHistory) G.directiveHistory = [];
  if (!G.riftPortals) G.riftPortals = [];
  if (!Number.isFinite(G.directiveLastCleared)) G.directiveLastCleared = G.wave || 0;
  if (!Number.isFinite(G.riftStreak)) G.riftStreak = 0;
  if (!Number.isFinite(G.riftScore)) G.riftScore = 0;
  if (![1,2,3,5,10].includes(G.directiveBatchSize)) G.directiveBatchSize = 1;
}

function setDirectiveBatchSize(size) {
  ensureDirectiveState();
  G.directiveBatchSize = [1,2,3,5,10].includes(Number(size)) ? Number(size) : 1;
  document.querySelectorAll('#raidMultiplierButtons button').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === '×' + G.directiveBatchSize);
  });
  const info = document.getElementById('raidSelectorInfo');
  if (info) info.textContent = `×${G.directiveBatchSize} · risque, densité et gains ×${G.directiveBatchSize}`;
}

function generateDirectiveChoices() {
  ensureDirectiveState();
  const lastId = G.directiveHistory.length ? G.directiveHistory[G.directiveHistory.length - 1].id : '';
  const wave = G.wave + 1;
  
  // Progressive difficulty: filter anomalies based on wave number
  // Wave 1-5: only risk 1-2
  // Wave 6-15: risk 1-3
  // Wave 16+: all risks
  let maxRisk = 1;
  if (wave >= 5) maxRisk = 2;
  if (wave >= 15) maxRisk = 3;
  if (wave >= 25) maxRisk = 4;
  
  // Filter pool based on difficulty and avoid repeating the last one
  const pool = RIFT_DIRECTIVES.filter(d => d.id !== lastId && d.risk <= maxRisk);
  
  // If pool is too small (early game), include slightly higher risk with lower probability
  const fallbackPool = pool.length < 3 ? 
    RIFT_DIRECTIVES.filter(d => d.id !== lastId && d.risk <= maxRisk + 1) : [];
  
  const choices = [];
  let seed = ((wave * 9301 + (G.kills || 0) * 97 + 49297) >>> 0);
  
  while (choices.length < 3) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    
    // Weighted selection: prefer lower risk in early waves
    const usePool = pool.length >= 3 || fallbackPool.length === 0 ? pool : fallbackPool;
    const index = seed % usePool.length;
    const directive = usePool[index];
    
    // Check if already selected
    if (!choices.find(c => c.id === directive.id)) {
      choices.push(directive);
    }
    
    // Remove from pool to avoid duplicates
    const poolIndex = usePool.indexOf(directive);
    if (poolIndex !== -1) usePool.splice(poolIndex, 1);
  }
  
  return choices;
}

function renderDirectiveChoices() {
  const host = document.getElementById('directiveChoices');
  if (!host) return;
  host.innerHTML = G.directiveChoices.map(d => {
    const danger = Array.from({length:4}, (_, i) => `<i class="${i < d.risk ? 'on' : ''}"></i>`).join('');
    return `<button class="directive-card" style="--directive:${d.color}" onclick="chooseDirective('${d.id}')">
      <span class="directive-icon">${d.icon}</span>
      <span class="directive-threat">MENACE ${danger}</span>
      <strong>${d.title}</strong>
      <span class="directive-description">${d.description}</span>
      <span class="directive-risk"><b>RISQUE</b>${d.riskText}</span>
      <span class="directive-reward"><b>GAIN</b>${d.rewardText}</span>
      <span class="directive-accept">SCELLER LE CONTRAT →</span>
    </button>`;
  }).join('');
}

function requestDirectiveForNextWave() {
  if (!G || G.over || G.directiveOpen || G.activeWaves?.length || G.liveEnemyCount > 0) return false;
  ensureDirectiveState();
  G.directiveChoices = generateDirectiveChoices();
  G.directiveOpen = true;
  G._resumeAfterDirective = !G.paused;
  G.paused = true;
  renderDirectiveChoices();
  setDirectiveBatchSize(G.directiveBatchSize || 1);
  document.getElementById('directiveOverlay')?.classList.add('active');
  const btn = document.getElementById('startWaveBtn');
  if (btn) btn.disabled = true;
  playGameSfx('directive');
  return true;
}

function chooseDirective(id) {
  if (!G || !G.directiveOpen) return;
  const def = RIFT_DIRECTIVES.find(d => d.id === id);
  if (!def) return;
  const batchSize = G.directiveBatchSize || 1;
  G.activeDirective = { ...def, effects:{...def.effects}, wave:G.wave + 1, batchSize };
  G.directiveOpen = false;
  document.getElementById('directiveOverlay')?.classList.remove('active');
  const btn = document.getElementById('startWaveBtn');
  if (btn) btn.disabled = false;
  updateDirectiveBadge();
  playGameSfx('select');
  startWave(true);
  if (G._resumeAfterDirective) {
    G.paused = false;
    G.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
  G._resumeAfterDirective = false;
}

function updateDirectiveBadge(cleared) {
  const badge = document.getElementById('directiveBadge');
  if (!badge) return;
  const d = G.activeDirective;
  if (d && !cleared) {
    badge.style.setProperty('--directive', d.color);
    badge.innerHTML = `<span>${d.icon}</span><div><small>RAID ×${d.batchSize || 1} // DIRECTIVE ACTIVE</small><b>${d.title}</b></div><em>RISQUE & BUTIN ×${d.batchSize || 1}</em>`;
    badge.classList.add('active');
  } else if (G.riftStreak > 0) {
    badge.style.setProperty('--directive', '#63e6d2');
    badge.innerHTML = `<span>✓</span><div><small>FAILLE STABILISÉE</small><b>CHAÎNE ×${G.riftStreak}</b></div><em>${G.riftScore} pts</em>`;
    badge.classList.add('active','cleared');
  } else {
    badge.className = '';
    badge.innerHTML = '';
  }
}

function completeDirectiveWave() {
  ensureDirectiveState();
  const d = G.activeDirective;
  if (!d || G.directiveLastCleared >= G.wave) return;
  const e = d.effects || {};
  const batch = d.batchSize || 1;
  const credits = Math.floor(((e.clearCredits || 65) + G.wave * (8 + d.risk * 2)) * batch * (BALANCE.economyGain || 1));
  G.credits += credits;
  let sample = 0;
  const sampleBudget = (e.clearSamples || 0.12) * batch;
  sample = Math.floor(sampleBudget) + (Math.random() < sampleBudget % 1 ? 1 : 0);
  if (sample) G.samples += sample;
  G.riftStreak += batch;
  G.riftScore += (d.risk * 150 + G.wave * 20) * batch;
  G.directiveLastCleared = G.wave;
  G.directiveHistory.push({ id:d.id, wave:G.wave, risk:d.risk });
  if (G.directiveHistory.length > 30) G.directiveHistory.shift();
  showNotif(`RAID ×${batch} STABILISÉ  +${credits}¢${sample ? `  +${sample} ÉCH` : ''}`, 'notif-xp');
  playGameSfx('clear');
  updateDirectiveBadge(true);
  G.activeDirective = null;
  G._tabsDirty = true;
}

function showBossStaging(wave, rank) {
  const el = document.getElementById('bossStaging');
  if (!el) return;
  const title = document.getElementById('bossStagingTitle');
  if (title) title.textContent = rank === 'mega' ? `MEGA-COLOSSE // VAGUE ${wave}` : `COLOSSE // VAGUE ${wave}`;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 2300);
  playGameSfx('boss');
}
