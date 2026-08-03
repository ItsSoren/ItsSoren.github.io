// ============================================================
// CESTUS CONTROL — Wave System
// ============================================================

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
  G.wave++;
  G.bossWave = (G.wave % 5 === 0) || !!effects.forceBoss;

  const hudWave = document.getElementById('hudWave');
  if (hudWave) hudWave.textContent = G.wave;
  const waveAlert = document.getElementById('waveAlert');
  if (waveAlert) waveAlert.style.display = 'inline';

  const count = Math.max(4, Math.round((5 + G.wave * 3) * (effects.countMult || 1)));

  // More fronts increase tactical pressure without increasing pathfinding cost.
  const normalCones = G.wave <= 5 ? 1 : G.wave <= 15 ? Math.min(2, 1 + Math.floor(Math.random() * 2)) : Math.min(3, 1 + Math.floor(Math.random() * 3));
  const numCones = Math.min(4, normalCones + (effects.extraCones || 0));
  const coneAngles = [];
  // The lower HUD masks a large part of the canvas, so invasion gates favor
  // the upper arc and side flanks where the player can actually read them.
  const safeAngles = [-2.88, -2.22, -1.57, -0.92, -0.26];
  const angleOffset = Math.floor(Math.random() * safeAngles.length);
  for (let c = 0; c < numCones; c++) {
    const slot = (angleOffset + Math.floor(c * safeAngles.length / numCones)) % safeAngles.length;
    coneAngles.push(safeAngles[slot] + (Math.random() - 0.5) * 0.18);
  }

  // Spawn at the actual visible battlefront, not kilometers outside the camera.
  const viewportSpan = typeof W === 'number' ? Math.min(W, H) / Math.max(0.5, G.cam.zoom) : 720;
  const outerR = Math.min((G.GRID_R - 2) * G.CELL, Math.max(G.CELL * 3.7, Math.min(G.CELL * 6.6, viewportSpan * 0.52)));
  const core = G.modules.find(m => m.alive && m.typeId === 'core') || { x:G.CELL * 0.5, y:G.CELL * 0.5 };
  const coneSpawns = coneAngles.map((a, index) => ({
    x: core.x + Math.cos(a) * outerR,
    y: core.y + Math.sin(a) * outerR,
    angle: a,
    index
  }));

  const waveDirective = directive ? { ...directive, effects:{...effects} } : null;
  const newWave = {
    id: G.wave,
    enemies: [],
    spawnIndex: 0,
    startTime: G.now,
    directive: waveDirective
  };

  let currentDelay = 0;
  for (let i = 0; i < count; ) {
    const isBoss = G.bossWave && i === 0;
    const bossTypes = ['tank', 'armored', 'protector', 'mage'];
    const type = isBoss ? bossTypes[Math.floor(Math.random() * bossTypes.length)] : pickEnemyType();
    const cfg = ENEMY_TYPES[type];
    const squadSize = isBoss ? 1 : Math.min(count - i, Math.floor(Math.random() * 4) + 3);
    const cone = coneSpawns[Math.floor(Math.random() * coneSpawns.length)];

    for (let s = 0; s < squadSize; s++) {
      let delay = currentDelay + Math.random() * 320;
      if (cfg && cfg.spawnCount) delay += s * 80;
      newWave.enemies.push({
        delay: delay * (effects.spawnRateMult || 1),
        type,
        isBoss: isBoss && s === 0,
        sx: cone.x,
        sy: cone.y,
        waveId: G.wave,
        directive: waveDirective
      });
    }
    currentDelay += 1450 + Math.random() * 950;
    i += squadSize;
  }

  newWave.enemies.sort((a, b) => a.delay - b.delay);
  G.activeWaves = G.activeWaves || [];
  G.activeWaves.push(newWave);
  const startBtn = document.getElementById('startWaveBtn');
  if (startBtn) startBtn.disabled = true;
  G.riftPortals = coneSpawns.map(p => ({
    x:p.x, y:p.y, angle:p.angle, waveId:G.wave,
    color:directive?.color || '#63e6d2', createdAt:G.now
  }));

  if (G.bossWave) {
    showNotif('⚠ RUPTURE COLOSSALE — VAGUE ' + G.wave, 'notif-boss');
    showBossStaging(G.wave);
  } else {
    showNotif('VAGUE ' + G.wave + ' — ' + newWave.enemies.length + ' ennemis' + (numCones > 1 ? ' (' + numCones + ' fronts)' : ''), 'notif-warn');
    playGameSfx('wave');
  }
  updateDirectiveBadge();
  updateWavePreview();
  return true;
}

function updateWaveLogic(now) {
  G.activeWaves = G.activeWaves || [];

  if (G.activeWaves.length === 0 && G.liveEnemyCount === 0 && now >= G.waveTimer && !G.directiveOpen) {
    requestDirectiveForNextWave();
  }

  for (let i = G.activeWaves.length - 1; i >= 0; i--) {
    const w = G.activeWaves[i];
    if (!w || !w.enemies) {
      G.activeWaves.splice(i, 1);
      continue;
    }
    while (w.spawnIndex < w.enemies.length) {
      const next = w.enemies[w.spawnIndex];
      if (now - w.startTime >= next.delay / Math.max(gameSpeed, 0.5)) {
        const enemy = spawnEnemy(next.type, next.isBoss, next.sx, next.sy, next.directive, next.waveId);
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
  const count = 5 + next * 3;
  const isBoss = next % 5 === 0;
  const wpInfo = document.getElementById('wpInfo');
  if (wpInfo) wpInfo.textContent = G.directiveOpen ? 'Choix de faille en cours' : count + ' ennemis' + (isBoss ? ' + BOSS' : ' · directive à choisir');
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
