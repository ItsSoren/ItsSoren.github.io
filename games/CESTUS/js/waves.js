// ============================================================
// CESTUS CONTROL — Wave System
// ============================================================

function startWave() {
  G.wave++;
  G.bossWave = (G.wave % 5 === 0);

  const hudWave = document.getElementById('hudWave');
  if (hudWave) hudWave.textContent = G.wave;
  const waveAlert = document.getElementById('waveAlert');
  if (waveAlert) waveAlert.style.display = 'inline';

  const count = 5 + G.wave * 3;

  // Choose spawn cones — more cones for harder waves
  const numCones = G.wave <= 5 ? 1 : G.wave <= 15 ? Math.min(2, 1 + Math.floor(Math.random()*2)) : Math.min(3, 1 + Math.floor(Math.random()*3));
  const coneAngles = [];
  const baseAngle = Math.random() * Math.PI * 2;
  for (let c = 0; c < numCones; c++) {
    coneAngles.push(baseAngle + (c / numCones) * Math.PI * 2 + (Math.random() - 0.5) * 0.5);
  }

  // Compute spawn positions from cones on the outer edge
  const outerR = (G.GRID_R + 3) * G.CELL;
  const coneSpawns = coneAngles.map(a => ({
    x: Math.cos(a) * outerR,
    y: Math.sin(a) * outerR
  }));

  const newWave = {
    enemies: [],
    spawnIndex: 0,
    startTime: G.now
  };

  let currentDelay = 0;
  for (let i = 0; i < count; ) {
    const isBoss = G.bossWave && i === 0;
    // Pick a strong type for boss (bossRanged doesn't exist)
    const bossTypes = ['tank', 'armored', 'protector', 'mage'];
    const type = isBoss ? bossTypes[Math.floor(Math.random() * bossTypes.length)] : pickEnemyType();
    const cfg = ENEMY_TYPES[type];
    
    const squadSize = isBoss ? 1 : Math.min(count - i, Math.floor(Math.random() * 4) + 3);
    const cone = coneSpawns[Math.floor(Math.random() * coneSpawns.length)];
    
    for (let s = 0; s < squadSize; s++) {
      let delay = currentDelay + Math.random() * 400;
      if (cfg && cfg.spawnCount) delay += s * 100;
      newWave.enemies.push({ delay, type, isBoss: isBoss && s === 0, sx: cone.x, sy: cone.y });
    }
    currentDelay += 2000 + Math.random() * 1500;
    i += squadSize;
  }
  
  newWave.enemies.sort((a, b) => a.delay - b.delay);

  G.activeWaves = G.activeWaves || [];
  G.activeWaves.push(newWave);

  if (G.bossWave) showNotif('⚠ BOSS EN APPROCHE — VAGUE ' + G.wave, 'notif-boss');
  else showNotif('VAGUE ' + G.wave + ' — ' + newWave.enemies.length + ' ennemis' + (numCones > 1 ? ' (' + numCones + ' fronts)' : ''), 'notif-warn');
  updateWavePreview();
}

function updateWaveLogic(now) {
  G.activeWaves = G.activeWaves || [];
  
  if (G.activeWaves.length === 0 && G.enemies.filter(e => e.alive).length === 0 && now >= G.waveTimer) {
     startWave();
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
        const enemy = spawnEnemy(next.type, next.isBoss, next.sx, next.sy);
        if (enemy) G.enemies.push(enemy);
        w.spawnIndex++;
      } else break;
    }
    if (w.spawnIndex >= w.enemies.length) {
      G.activeWaves.splice(i, 1);
    }
  }

  const liveEnemies = G.enemies.filter(e => e.alive).length;
  
  if (G.activeWaves.length === 0 && liveEnemies === 0) {
    const waveAlert = document.getElementById('waveAlert');
    if (waveAlert && waveAlert.style.display !== 'none') {
      waveAlert.style.display = 'none';
      G.waveTimer = now + G.waveInterval;
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
  const next = G.wave + (G.activeWaves.length > 0 || G.enemies.filter(e => e.alive).length > 0 ? 1 : 0);
  const wpWave = document.getElementById('wpWave');
  if (wpWave) wpWave.textContent = 'Vague ' + next;
  const count = 8 + next * 3;
  const isBoss = next % 5 === 0;
  const wpInfo = document.getElementById('wpInfo');
  if (wpInfo) wpInfo.textContent = count + ' ennemis' + (isBoss ? ' + BOSS' : '');
}

function triggerNextWave() {
  if (!G || G.over) return;
  startWave();
}
