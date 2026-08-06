// ============================================================
// CESTUS CONTROL — Wave System
// ============================================================

function getWaveEnemyCount(wave, effects) {
  const earlyCurve = Math.min(wave, 10);
  const base = (10 + wave * 6 + earlyCurve * earlyCurve * 0.25 + Math.max(0, wave - 10) * 2) / 1.6;
  return Math.max(5, Math.round(base * (BALANCE.wavePopulation || 1) * ((effects && effects.countMult) || 1)));
}

function getWaveFrontCount(wave, effects) {
  const secondaryCores = (G && G.modules) ? G.modules.filter(m => m.alive && (m.typeId === 'secondary_core' || (typeof MODULE_TYPES !== 'undefined' && MODULE_TYPES[m.typeId]?.isSecondaryCore))).length : 0;
  const maxPortals = 15 + 2 * secondaryCores;
  const milestones = wave <= 2 ? 1 : wave <= 5 ? 2 : wave <= 8 ? 4 : wave <= 12 ? 6 :
    wave <= 16 ? 8 : wave <= 21 ? 10 : wave <= 27 ? 12 : wave <= 34 ? 14 : 15;
  return Math.max(1, Math.min(maxPortals, Math.round(milestones * (BALANCE.frontIntensity || 1)) + ((effects && effects.extraCones) || 0)));
}

function getBaseRadius(core) {
  let radius = 0;
  for (let i = 0; i < G.modules.length; i++) {
    const mod = G.modules[i];
    if (!mod.alive || mod.typeId === 'core') continue;
    radius = Math.max(radius, Math.hypot(mod.x - core.x, mod.y - core.y));
  }
  return radius;
}

function getWaveSpawnRadius(wave, core) {
  const gridLimit = (G.GRID_R - 2) * G.CELL;
  const viewportSpan = typeof W === 'number' ? Math.min(W, H) / Math.max(0.5, G.cam.zoom) : 720;
  const visibleMinimum = Math.max(G.CELL * 9, viewportSpan * 0.68);
  const progressionRadius = G.CELL * (9 + Math.min(27, wave * 0.5));
  const basePadding = G.CELL * (7.5 + Math.min(9, wave * 0.14));
  const outsideBase = getBaseRadius(core) + basePadding;
  return Math.min(gridLimit, Math.max(visibleMinimum, progressionRadius, outsideBase) * (BALANCE.spawnDistance || 1));
}

function createPortalSet(numCones, radius, core, phase, wave, color) {
  const portals = [];
  const rotation = Math.random() * Math.PI * 2 + phase * 1.17;
  const sector = Math.PI * 2 / Math.max(1, numCones);
  for (let c = 0; c < numCones; c++) {
    // Wide angular and radial variance breaks the old perfect star/flower layout.
    const jitter = (Math.random() - 0.5) * sector * 0.86;
    const angle = rotation + c / numCones * Math.PI * 2 + jitter;
    const localRadius = radius * (0.70 + Math.random() * 0.30);
    portals.push({
      x:core.x + Math.cos(angle) * localRadius,
      y:core.y + Math.sin(angle) * localRadius,
      angle, index:c, phase, waveId:wave, color,
      bend:(Math.random() - 0.5) * 2,
      bend2:(Math.random() - 0.5) * 2,
      wobble:0.8 + Math.random() * 1.8,
      seed:Math.random() * 1000,
      createdAt:G.now
    });
  }
  return portals;
}

function beginPortalRelocation(w, now) {
  if (!w.currentPortals?.length || !w.portalPhases?.length) return;
  const portalIndex = w.relocationCursor % w.currentPortals.length;
  const phaseIndex = 1 + Math.floor(w.relocationCursor / w.currentPortals.length) % Math.max(1, w.portalPhases.length - 1);
  const portal = w.currentPortals[portalIndex];
  const target = w.portalPhases[phaseIndex]?.[portalIndex];
  if (!portal || !target) return;
  portal.fromX = portal.x; portal.fromY = portal.y;
  portal.fromBend = portal.bend; portal.fromBend2 = portal.bend2;
  portal.targetX = target.x; portal.targetY = target.y;
  portal.targetBend = target.bend; portal.targetBend2 = target.bend2;
  portal.transitionStart = now;
  portal.transitionDuration = 1800 + Math.random() * 1600;
  portal.relocating = true;
  w.relocationCursor++;
  playGameSfx('portal');
}

function updatePortalTransitions(w, now) {
  if (!w.currentPortals) return;
  for (const portal of w.currentPortals) {
    if (!portal.relocating) continue;
    const raw = Math.min(1, (now - portal.transitionStart) / portal.transitionDuration);
    const t = raw * raw * (3 - 2 * raw);
    portal.x = portal.fromX + (portal.targetX - portal.fromX) * t;
    portal.y = portal.fromY + (portal.targetY - portal.fromY) * t;
    portal.bend = portal.fromBend + (portal.targetBend - portal.fromBend) * t;
    portal.bend2 = portal.fromBend2 + (portal.targetBend2 - portal.fromBend2) * t;
    portal.transitionAlpha = Math.sin(raw * Math.PI);
    if (raw >= 1) { portal.relocating = false; portal.transitionAlpha = 0; }
  }
}

function startWave(directiveConfirmed) {
  if (!G || G.over) return false;
  if (!directiveConfirmed) {
    if (G.activeWaves?.length || G.liveEnemyCount > 0) {
      showNotif('Une vague est déjà en cours', 'notif-warn');
      return false;
    }
    return requestDirectiveForNextWave();
  }

  const directive = G.activeDirective;
  const effects = directive?.effects || {};
  const batchSize = Math.max(1, Math.min(10, directive?.batchSize || 1));
  const startWaveNumber = G.wave + 1;
  const endWaveNumber = G.wave + batchSize;
  const raidWaves = Array.from({length:batchSize}, (_, i) => startWaveNumber + i);
  G.wave = endWaveNumber;
  const bossMilestones = raidWaves.filter(w => w % 5 === 0);
  const megaMilestones = raidWaves.filter(w => w % 20 === 0);
  G.bossWave = bossMilestones.length > 0 || megaMilestones.length > 0 || !!effects.forceBoss || !!effects.forceMega;

  const hudWave = document.getElementById('hudWave');
  if (hudWave) hudWave.textContent = G.wave;
  const waveAlert = document.getElementById('waveAlert');
  if (waveAlert) waveAlert.style.display = 'inline';

  const count = raidWaves.reduce((sum, wave) => sum + getWaveEnemyCount(wave, effects), 0);

  // Deterministic progression: no more single-front wave 10+, up to ten fronts.
  const numCones = getWaveFrontCount(endWaveNumber, effects);

  const core = G.modules.find(m => m.alive && m.typeId === 'core') || { x:G.CELL * 0.5, y:G.CELL * 0.5 };
  const outerR = getWaveSpawnRadius(endWaveNumber, core);
  const relocationEvery = Math.max(28, Math.round((58 - Math.min(22, endWaveNumber * .35)) * (effects.portalShiftMult || 1)));
  const phaseCount = Math.max(2, Math.min(12, Math.ceil(count / relocationEvery)));
  const portalPhases = Array.from({length:phaseCount}, (_, phase) =>
    createPortalSet(numCones, outerR, core, phase, endWaveNumber, directive?.color || '#63e6d2'));

  const waveDirective = directive ? { ...directive, effects:{...effects} } : null;
  const newWave = {
    id: endWaveNumber,
    startWave:startWaveNumber,
    endWave:endWaveNumber,
    batchSize,
    enemies: [],
    spawnIndex: 0,
    startTime: G.now,
    directive: waveDirective,
    portalPhases,
    currentPortals:portalPhases[0].map(p => ({...p})),
    relocationEvery,
    nextRelocation:relocationEvery,
    relocationCursor:0
  };

  const bossTypes = ['tank', 'armored', 'protector', 'mage', 'fortress'];
  raidWaves.forEach((waveNumber, raidIndex) => {
    const waveCount = getWaveEnemyCount(waveNumber, effects);
    let currentDelay = raidIndex * 180;
    let spawned = 0;
    let forcedRank = effects.forceMega && raidIndex === 0 ? 'mega' : effects.forceBoss && raidIndex === 0 ? 'boss' : null;
    if (waveNumber % 20 === 0) forcedRank = 'mega';
    else if (waveNumber % 5 === 0) forcedRank = 'boss';
    while (spawned < waveCount) {
      const bossRank = spawned === 0 ? forcedRank : null;
      const type = bossRank ? bossTypes[Math.floor(Math.random() * bossTypes.length)] : pickEnemyType();
      const cfg = ENEMY_TYPES[type];
      const squadSize = bossRank ? 1 : Math.min(waveCount - spawned, Math.floor(Math.random() * 5) + 4);
      const coneIndex = Math.floor(Math.random() * numCones);
      for (let s = 0; s < squadSize; s++) {
        let delay = currentDelay + Math.random() * 460;
        if (cfg && cfg.spawnCount) delay += s * 80;
        newWave.enemies.push({
          delay:delay * (effects.spawnRateMult || 1), type,
          isBoss:!!bossRank && s === 0, bossRank:s === 0 ? bossRank : null,
          coneIndex, waveId:waveNumber, directive:waveDirective
        });
      }
      currentDelay += (1250 + Math.random() * 700) * (BALANCE.waveDuration || 4);
      spawned += squadSize;
    }
  });

  newWave.enemies.sort((a, b) => a.delay - b.delay);
  G.activeWaves = G.activeWaves || [];
  G.activeWaves.push(newWave);
  const startBtn = document.getElementById('startWaveBtn');
  if (startBtn) startBtn.disabled = true;
  G.riftPortals = newWave.currentPortals;

  if (G.bossWave) {
    const mega = megaMilestones.length > 0 || !!effects.forceMega;
    showNotif(`⚠ ${mega ? 'MEGA-' : ''}RUPTURE — RAID ×${batchSize}`, 'notif-boss');
    showBossStaging(endWaveNumber, mega ? 'mega' : 'boss');
  } else {
    showNotif(`RAID ×${batchSize} — ${newWave.enemies.length} ennemis · ${numCones} fronts`, 'notif-warn');
    playGameSfx('wave');
  }
  updateDirectiveBadge();
  updateWavePreview();
  return true;
}

function updateWaveLogic(now) {
  G.activeWaves = G.activeWaves || [];

  // Wave 0 never auto-starts; waits for the player to click LANCER VAGUE
  if (G.wave > 0 && G.activeWaves.length === 0 && G.liveEnemyCount === 0 && now >= G.waveTimer && !G.directiveOpen) {
    requestDirectiveForNextWave();
  }

  for (let i = G.activeWaves.length - 1; i >= 0; i--) {
    const w = G.activeWaves[i];
    if (!w || !w.enemies) {
      G.activeWaves.splice(i, 1);
      continue;
    }
    updatePortalTransitions(w, now);
    while (w.spawnIndex < w.enemies.length) {
      const next = w.enemies[w.spawnIndex];
      // G.now is already scaled by gameSpeed; dividing again made ×2 behave like ×4.
      if (now - w.startTime >= next.delay) {
        if (w.spawnIndex >= w.nextRelocation) {
          beginPortalRelocation(w, now);
          w.nextRelocation += w.relocationEvery;
          if (w.relocationCursor % Math.max(1, w.currentPortals.length) === 1) {
            showNotif('⟐ UNE FAILLE MIGRE VERS UN NOUVEAU SECTEUR', 'notif-warn');
          }
        }
        const portal = w.currentPortals[next.coneIndex % w.currentPortals.length];
        const enemy = spawnEnemy(next.type, next.isBoss, portal.x, portal.y, next.directive, next.waveId, next.bossRank);
        if (enemy) G.enemies.push(enemy);
        w.spawnIndex++;
      } else break;
    }
    if (w.spawnIndex >= w.enemies.length) G.activeWaves.splice(i, 1);
  }

  let liveEnemies = 0;
  for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) liveEnemies++;
  G.liveEnemyCount = liveEnemies;

  if (G.activeWaves.length === 0 && liveEnemies === 0) {
    const waveAlert = document.getElementById('waveAlert');
    if (waveAlert && waveAlert.style.display !== 'none') {
      waveAlert.style.display = 'none';
      G.riftPortals = [];
      completeDirectiveWave();
      G.waveTimer = now + G.waveInterval;
      const startBtn = document.getElementById('startWaveBtn');
      if (startBtn) startBtn.disabled = false;
      updateWavePreview();
      showNotif('✓ VAGUE NEUTRALISÉE', 'notif-xp');
    }
  } else {
    const waveAlert = document.getElementById('waveAlert');
    if (waveAlert) waveAlert.style.display = 'inline';
  }
}

function updateWavePreview() {
  G.activeWaves = G.activeWaves || [];
  const next = G.wave + 1;
  const wpWave = document.getElementById('wpWave');
  if (wpWave) wpWave.textContent = 'Vague ' + next;
  const count = getWaveEnemyCount(next, null);
  const fronts = getWaveFrontCount(next, null);
  const isBoss = next % 5 === 0;
  const wpInfo = document.getElementById('wpInfo');
  if (wpInfo) wpInfo.textContent = G.directiveOpen ? 'Choix anomalie + raid ×1 à ×10' : count + ' ennemis · ' + fronts + ' front' + (fronts > 1 ? 's' : '') + (isBoss ? ' + BOSS' : '');
}

function triggerNextWave() {
  if (!G || G.over) return;
  initGameAudio();
  if (G.activeWaves?.length || G.liveEnemyCount > 0) {
    showNotif('Une vague est déjà en cours', 'notif-warn');
    return;
  }
  requestDirectiveForNextWave();
}
