// ============================================================
// CESTUS CONTROL — Rift Directives
// One meaningful risk/reward decision before every wave.
// ============================================================

const RIFT_DIRECTIVES = [
  {
    id:'iron_liturgy', icon:'⬡', title:'LITURGIE DE FER', risk:2, color:'#ff9f43',
    riskText:'+55% PV, blindage renforcé', rewardText:'+85% crédits',
    description:'Des coques rituelles absorbent les premiers impacts.',
    effects:{ hpMult:1.55, armor:0.12, creditsMult:1.85, clearCredits:35 }
  },
  {
    id:'red_shift', icon:'»', title:'DÉCALAGE ROUGE', risk:2, color:'#ff5d73',
    riskText:'+32% vitesse, +20% dégâts', rewardText:'+70% XP',
    description:'La faille accélère tout ce qu’elle recrache.',
    effects:{ speedMult:1.32, dmgMult:1.20, xpMult:1.70, clearCredits:20 }
  },
  {
    id:'hive_echo', icon:'✣', title:'ÉCHO DE RUCHE', risk:3, color:'#c084fc',
    riskText:'+55% ennemis, fronts multiples', rewardText:'+95% crédits',
    description:'Une même conscience attaque depuis plusieurs brèches.',
    effects:{ countMult:1.55, extraCones:1, spawnRateMult:0.78, creditsMult:1.95 }
  },
  {
    id:'glass_revenants', icon:'◇', title:'REVENANTS DE VERRE', risk:1, color:'#67e8f9',
    riskText:'+65% dégâts, -28% PV', rewardText:'Échantillons ×2.5',
    description:'Fragiles, fulgurants, capables de pulvériser une ligne mal placée.',
    effects:{ hpMult:0.72, dmgMult:1.65, samplesMult:2.5, clearSamples:0.18 }
  },
  {
    id:'elite_signal', icon:'♛', title:'SIGNAL DOMINANT', risk:3, color:'#fbbf24',
    riskText:'28% d’élites dans la vague', rewardText:'Butin élite ×2',
    description:'Les signatures les plus dangereuses répondent à l’appel.',
    effects:{ eliteChance:0.28, creditsMult:1.35, xpMult:1.35, clearCredits:60 }
  },
  {
    id:'gravity_well', icon:'◉', title:'PUITS GRAVITIQUE', risk:2, color:'#818cf8',
    riskText:'+35% PV, ennemis compacts', rewardText:'+60% crédits, +35% XP',
    description:'Une masse compacte idéale pour l’aire… si elle ne traverse pas.',
    effects:{ hpMult:1.35, spawnTightness:0.45, creditsMult:1.60, xpMult:1.35 }
  },
  {
    id:'black_sun', icon:'✹', title:'SOLEIL NOIR', risk:4, color:'#fb7185',
    riskText:'Mini-boss garanti, dégâts ×1.35', rewardText:'Prime de rupture massive',
    description:'Une présence colossale force le passage hors cycle.',
    effects:{ forceBoss:true, dmgMult:1.35, hpMult:1.20, creditsMult:1.50, clearCredits:130, clearSamples:0.55 }
  },
  {
    id:'fractured_front', icon:'⌁', title:'FRONT FRACTURÉ', risk:3, color:'#2dd4bf',
    riskText:'+2 routes d’invasion', rewardText:'+75% XP, +40% crédits',
    description:'La défense doit pivoter sans cesse entre des angles opposés.',
    effects:{ extraCones:2, xpMult:1.75, creditsMult:1.40 }
  },
  {
    id:'void_tax', icon:'∅', title:'DÎME DU VIDE', risk:2, color:'#a78bfa',
    riskText:'Ennemis régénérants', rewardText:'+110% crédits de fin',
    description:'La faille répare lentement ses créatures tant qu’elles respirent.',
    effects:{ regenMult:0.008, hpMult:1.15, clearCredits:95, creditsMult:1.25 }
  },
  {
    id:'storm_protocol', icon:'ϟ', title:'PROTOCOLE TEMPÊTE', risk:3, color:'#38bdf8',
    riskText:'Arrivée deux fois plus rapide', rewardText:'+80% crédits et XP',
    description:'Aucun répit entre les escouades; la surcharge devient vitale.',
    effects:{ spawnRateMult:0.48, speedMult:1.12, creditsMult:1.80, xpMult:1.80 }
  }
];

function ensureDirectiveState() {
  if (!G.directiveChoices) G.directiveChoices = [];
  if (!G.directiveHistory) G.directiveHistory = [];
  if (!G.riftPortals) G.riftPortals = [];
  if (!Number.isFinite(G.directiveLastCleared)) G.directiveLastCleared = G.wave || 0;
  if (!Number.isFinite(G.riftStreak)) G.riftStreak = 0;
  if (!Number.isFinite(G.riftScore)) G.riftScore = 0;
}

function generateDirectiveChoices() {
  ensureDirectiveState();
  const lastId = G.directiveHistory.length ? G.directiveHistory[G.directiveHistory.length - 1].id : '';
  const pool = RIFT_DIRECTIVES.filter(d => d.id !== lastId);
  const choices = [];
  let seed = ((G.wave + 1) * 9301 + (G.kills || 0) * 97 + 49297) >>> 0;
  while (choices.length < 3 && pool.length) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    choices.push(pool.splice(seed % pool.length, 1)[0]);
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
  G.activeDirective = { ...def, effects:{...def.effects}, wave:G.wave + 1 };
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
    badge.innerHTML = `<span>${d.icon}</span><div><small>DIRECTIVE ACTIVE</small><b>${d.title}</b></div><em>RÉSONANCE ${G.riftStreak || 0}</em>`;
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
  const credits = Math.floor((e.clearCredits || 18) + G.wave * (4 + d.risk));
  G.credits += credits;
  let sample = 0;
  if (e.clearSamples && Math.random() < e.clearSamples) { G.samples++; sample = 1; }
  G.riftStreak++;
  G.riftScore += d.risk * 100 + G.wave * 15;
  G.directiveLastCleared = G.wave;
  G.directiveHistory.push({ id:d.id, wave:G.wave, risk:d.risk });
  if (G.directiveHistory.length > 30) G.directiveHistory.shift();
  showNotif(`RÉSONANCE ×${G.riftStreak}  +${credits}¢${sample ? '  +1 ÉCH' : ''}`, 'notif-xp');
  playGameSfx('clear');
  updateDirectiveBadge(true);
  G.activeDirective = null;
  G._tabsDirty = true;
}

function showBossStaging(wave) {
  const el = document.getElementById('bossStaging');
  if (!el) return;
  const title = document.getElementById('bossStagingTitle');
  if (title) title.textContent = `COLOSSE // VAGUE ${wave}`;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 2300);
  playGameSfx('boss');
}
