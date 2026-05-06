// ============================================================
// CESTUS CONTROL — Enemy System
// Spawning, AI, pathfinding, special abilities
// ============================================================

function spawnEnemy(typeKey, isBossOverride, spawnX, spawnY) {
  const cfg = ENEMY_TYPES[typeKey];
  if (!cfg) return null;
  const strength = 1 + (G.wave - 1) * 0.25;

  let ex, ey;
  if (spawnX !== undefined && spawnY !== undefined) {
    ex = spawnX + (Math.random() - 0.5) * G.CELL * 3;
    ey = spawnY + (Math.random() - 0.5) * G.CELL * 3;
  } else {
    const gz = G.glitchZones[Math.floor(Math.random() * G.glitchZones.length)];
    ex = gz.x + (Math.random() - 0.5) * G.CELL * 2;
    ey = gz.y + (Math.random() - 0.5) * G.CELL * 2;
  }

  const isBoss = isBossOverride || cfg.isBoss || false;
  const bs = isBoss && !cfg.isBoss ? 4 : 1;

  const e = {
    id: Date.now() + Math.random(),
    type: typeKey, isBoss,
    x: ex, y: ey,
    hp: cfg.hp * strength * bs,
    maxHp: cfg.hp * strength * bs,
    speed: cfg.speed * (isBoss && !cfg.isBoss ? 0.6 : 1),
    baseSpeed: cfg.speed * (isBoss && !cfg.isBoss ? 0.6 : 1),
    dmg: cfg.dmg * strength * (isBoss && !cfg.isBoss ? 5 : 1),
    reward: { ...cfg.reward },
    color: isBoss && !cfg.isBoss ? '#ff0066' : cfg.color,
    size: cfg.size * (isBoss && !cfg.isBoss ? 2.5 : 1),
    xpVal: cfg.reward.xp * (isBoss && !cfg.isBoss ? 8 : 1),
    shape: cfg.shape || 'circle',
    alive: true,
    target: null,
    attackTimer: 0,
    flash: 0,
    angle: 0,
    lastPathUpdate: 0,
    path: null,
    pathIndex: 0,
    damageReduction: cfg.damageReduction || 0,

    // Slow effect
    slowTimer: 0,
    slowFactor: 1,

    // DOT effect
    dots: [],

    // Glitch-Shifter
    teleportTimer: cfg.teleportInterval ? (G.now + cfg.teleportInterval * Math.random()) : 0,
    teleportInterval: cfg.teleportInterval || 0,
    teleportRange: cfg.teleportRange || 0,

    // Kamikaze
    isKamikaze: cfg.isKamikaze || false,
    explosionRadius: cfg.explosionRadius || 0,

    // Ranged enemy
    shootRange: cfg.shootRange || 0,
    shootRate: cfg.shootRate || 0,
    shootDmg: cfg.shootDmg || 0,
    lastShot: 0,

    // Protector
    isProtector: cfg.isProtector || false,
    auraRange: cfg.auraRange || 0,

    // Splitter
    isSplitter: cfg.isSplitter || false,
    splitCount: cfg.splitCount || 0,

    // Healer
    isHealer: cfg.isHealer || false,
    healAura: cfg.healAura || 0,
    healAmount: cfg.healAmount || 0,

    // Sniper
    isSniper: cfg.isSniper || false,

    // Mage
    isMage: cfg.isMage || false,
    summonRate: cfg.summonRate || 0,
    summonType: cfg.summonType || 'swarm',
  };

  return e;
}

function pickEnemyType() {
  let weights;
  if (G.wave <= 5) weights = WAVE_SPAWN_WEIGHTS.early;
  else if (G.wave <= 15) weights = WAVE_SPAWN_WEIGHTS.mid;
  else weights = WAVE_SPAWN_WEIGHTS.late;

  let r = Math.random(), acc = 0;
  for (const w of weights) {
    acc += w.w;
    if (r < acc) return w.type;
  }
  return 'basic';
}

function updateEnemies(dt, now) {
  const attackRange = G.CELL * 0.65;

  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    e.flash = Math.max(0, e.flash - 1);
    if (!e.alive) continue;

    // Process DOTs
    for (let d = e.dots.length - 1; d >= 0; d--) {
      const dot = e.dots[d];
      if (now >= dot.nextTick) {
        e.hp -= dot.dmg;
        e.flash = 3;
        spawnParticle(e.x, e.y, '#88ff44', 2);
        dot.nextTick = now + dot.tickRate;
        dot.remaining -= dot.tickRate;
        if (dot.remaining <= 0) e.dots.splice(d, 1);
      }
      if (e.hp <= 0) {
        killEnemy(e, null);
        break;
      }
    }
    if (!e.alive) continue;

    // Slow effect decay
    if (e.slowTimer > 0 && now > e.slowTimer) {
      e.slowFactor = 1;
      e.slowTimer = 0;
    }

    // Glitch-Shifter teleport
    if (e.teleportInterval > 0 && now > e.teleportTimer) {
      const angle = Math.random() * Math.PI * 2;
      e.x += Math.cos(angle) * e.teleportRange;
      e.y += Math.sin(angle) * e.teleportRange;
      e.teleportTimer = now + e.teleportInterval;
      spawnParticle(e.x, e.y, '#ff00ff', 8);
    }

    // Find target (pathfinding)
    if (now - e.lastPathUpdate > 1200 || !e.target || !e.target.alive) {
      let closest = null, minDist = Infinity;
      G.modules.forEach(m => {
        if (!m.alive) return;
        const d = Math.hypot(e.x - m.x, e.y - m.y);
        if (d < minDist) { minDist = d; closest = m; }
      });
      e.target = closest;
      e.lastPathUpdate = now;
    }

    if (!e.target) continue;

    // Ranged enemy shooting
    if (e.shootRange > 0 && e.target) {
      const distToTarget = Math.hypot(e.target.x - e.x, e.target.y - e.y);
      if (distToTarget < e.shootRange && now - e.lastShot > e.shootRate) {
        e.lastShot = now;
        G.projectiles.push({
          x: e.x, y: e.y,
          tx: e.target.x, ty: e.target.y,
          targetModuleId: e.target.id,
          speed: 5, dmg: e.shootDmg * (1 + (G.wave - 1) * 0.15),
          color: e.color, splash: 0, size: e.isSniper ? 6 : 4,
          alive: true, isEnemyProjectile: true,
        });
      }
      if (e.isSniper && distToTarget < e.shootRange * 0.9) {
        e.speed = 0.1;
      } else {
        e.speed = e.baseSpeed;
      }
    }

    // Healer aura
    if (e.isHealer && now - (e.lastHeal || 0) > 2000) {
      e.lastHeal = now;
      let healed = false;
      G.enemies.forEach(other => {
        if (other.alive && other !== e && Math.hypot(other.x - e.x, other.y - e.y) < e.healAura) {
          other.hp = Math.min(other.maxHp, other.hp + e.healAmount);
          spawnParticle(other.x, other.y, '#00ff00', 3);
          healed = true;
        }
      });
      if (healed) spawnParticle(e.x, e.y, '#00ff00', 10);
    }

    // Mage summoning
    if (e.isMage && now - (e.lastSummon || 0) > e.summonRate) {
      e.lastSummon = now;
      spawnParticle(e.x, e.y, '#9900ff', 15);
      for (let i = 0; i < 3; i++) {
        const spawned = spawnEnemy(e.summonType, false, e.x + (Math.random()-0.5)*30, e.y + (Math.random()-0.5)*30);
        if (spawned) G.enemies.push(spawned);
      }
    }

    const dx = e.target.x - e.x;
    const dy = e.target.y - e.y;
    const d = Math.hypot(dx, dy);
    e.angle = Math.atan2(dy, dx);

    if (d > attackRange) {
      const currentSpeed = e.baseSpeed * e.slowFactor;
      e.x += dx / d * currentSpeed * (dt / 16);
      e.y += dy / d * currentSpeed * (dt / 16);
    } else {
      // Kamikaze: explode on contact
      if (e.isKamikaze) {
        // Damage all modules in radius
        G.modules.forEach(m => {
          if (!m.alive) return;
          const dist = Math.hypot(m.x - e.x, m.y - e.y);
          if (dist < e.explosionRadius) {
            const falloff = 1 - dist / e.explosionRadius;
            damageModule(m, e.dmg * falloff);
          }
        });
        spawnExplosion(e.x, e.y, '#ff6600');
        spawnExplosion(e.x, e.y, '#ffaa00');
        e.alive = false;
        continue;
      }

      // Melee attack
      if (now - e.attackTimer > 1200) {
        e.attackTimer = now;
        damageModule(e.target, e.dmg);
      }
    }
  }

  // Inline cleanup of dead enemies (no filter allocation)
  let writeIdx = 0;
  for (let i = 0; i < G.enemies.length; i++) {
    if (G.enemies[i].alive || G.enemies[i].flash > 0) {
      G.enemies[writeIdx++] = G.enemies[i];
    }
  }
  G.enemies.length = writeIdx;

  // Decay corpses (time-based in ms)
  for (let i = G.corpses.length - 1; i >= 0; i--) {
    G.corpses[i].life -= dt;
    if (G.corpses[i].life <= 0) {
      const last = G.corpses.pop();
      if (i < G.corpses.length) G.corpses[i] = last;
    }
  }
}

function killEnemy(e, proj) {
  e.alive = false;
  if (e.isSplitter) {
    for (let i = 0; i < e.splitCount; i++) {
      const spawned = spawnEnemy('splitterMini', false, e.x + (Math.random()-0.5)*20, e.y + (Math.random()-0.5)*20);
      if (spawned) G.enemies.push(spawned);
    }
  }  // Gamma Implosion — Now spawning piercing green projectiles in all directions
  if (e.gammaCharge && e.gammaCharge > 0) {
    const charges = Math.min(8, e.gammaCharge);
    const beamsCount = 6 + charges; // More projectiles
    const dmg = 20 * Math.min(30, (e.gammaModLvl || 1)) * (1 + charges * 0.1);
    
    for (let i = 0; i < beamsCount; i++) {
      const angle = (i / beamsCount) * Math.PI * 2;
      const farX = e.x + Math.cos(angle) * 300;
      const farY = e.y + Math.sin(angle) * 300;
      
      G.projectiles.push({
        x: e.x, y: e.y, tx: farX, ty: farY, targetId: null, speed: 10, dmg: dmg,
        color: '#88ff00', splash: 0, size: 3 + charges * 0.5, alive: true,
        isPiercing: true, isSonicWave: true, piercedIds: new Set(), sourceId: null, angle: angle
      });
    }
    // Big green explosion at center
    spawnExplosion(e.x, e.y, '#88ff00');
    spawnExplosion(e.x, e.y, '#ccff00');
  }

  // Poison Death Nova
  if (e.dots && e.dots.length > 0) {
    // Check if it was poisoned (color is usually #88ff44 for toxic aura, or we can just check if any dot exists)
    // To be safe, we just spawn poison projectiles in 8 directions if it had DOTs
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tx = e.x + Math.cos(angle) * 100;
      const ty = e.y + Math.sin(angle) * 100;
      G.projectiles.push({
        x: e.x, y: e.y, tx: tx, ty: ty, targetId: null, speed: 5, dmg: 5,
        color: '#88ff44', splash: 0, size: 4, alive: true, isPiercing: true, piercedIds: new Set(),
        sourceId: null, // no specific module source
      });
    }
  }
  G.kills++;
  G.enemyKills[e.type] = (G.enemyKills[e.type] || 0) + 1;
  const hudKills = document.getElementById('hudKills');
  if (hudKills) hudKills.textContent = G.kills;
  awardKill(e, proj);
  spawnDeathExplosion(e.x, e.y, e.color);

  G.corpses.push({
    x: e.x, y: e.y, shape: e.shape, size: e.size, color: e.color,
    angle: e.angle, life: 3000, maxLife: 3000
  });
  if (G.corpses.length > 50) G.corpses.shift();
}

function damageEnemy(e, dmg, proj) {
  let dmgReduction = e.damageReduction || 0;
  
  if (!e.isProtector) {
    for (let i = 0; i < G.enemies.length; i++) {
      const p = G.enemies[i];
      if (p.alive && p.isProtector && p.id !== e.id) {
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.auraRange) {
          dmgReduction = Math.max(dmgReduction, 0.5); // 50% reduction
          break;
        }
      }
    }
  }

  const actualDmg = dmg * (1 - dmgReduction);
  e.hp -= actualDmg;
  e.flash = 5;
  spawnParticle(e.x, e.y, e.color, 3);

  // Apply slow
  if (proj && proj.slowFactor) {
    e.slowFactor = proj.slowFactor;
    e.slowTimer = G.now + (proj.slowDuration || 3000);
  }

  // Apply DOT
  if (proj && proj.dotDmg) {
    e.dots.push({
      dmg: proj.dotDmg,
      tickRate: proj.dotTick || 500,
      nextTick: G.now + (proj.dotTick || 500),
      remaining: proj.dotDuration || 5000,
    });
  }

  if (e.hp <= 0) {
    killEnemy(e, proj);
  }
}

function damageModule(mod, dmg) {
  mod.hp -= dmg;
  mod.flash = 8;
  spawnParticle(mod.x, mod.y, '#ff2244', 5);
  if (mod.hp <= 0) {
    if (mod.typeId === 'core') {
      gameOver();
    } else {
      mod.alive = false;
      mod.hp = 0;
      showNotif('⚠ MODULE DÉTRUIT !', 'notif-warn');
      G.modules = G.modules.filter(m => m.alive);
      recalcEnergy();
      updateHUD();
    }
  }
}

function awardKill(e, proj) {
  const upg = getUpgradeMultipliers();
  const sp = G.bonus;
  const creditMult = (1 + upg.creditGain) * (1 + sp.credits * 0.01) * (1 + (proj?.aura_credits || 0));
  const sampleMult = (1 + sp.samples * 0.01) * (1 + (proj?.aura_samples || 0));
  const xpMult = (1 + upg.xpGain) * (1 + sp.xp * 0.01);
  const credits = Math.floor(e.reward.credits * creditMult);
  const xpGain = Math.floor(e.xpVal * xpMult);
  const sampleRoll = e.reward.samples * sampleMult;

  G.credits += credits;
  addXP(xpGain);

  if (credits > 0) showFloatingText(e.x, e.y, '+' + credits + '¢', '#ffdd00');
  if (xpGain > 0)  showFloatingText(e.x, e.y - 22, '+' + xpGain + 'xp', '#00f5ff');

  if (Math.random() < sampleRoll) {
    G.samples++;
    showFloatingText(e.x, e.y - 44, '+1 ÉCH', '#cc66ff');
    showNotif('+1 Échantillon', 'notif-samples');
    renderTabs();
  }
  updateHUD();
}

function addXP(amount) {
  G.xp += amount;
  while (G.xp >= G.xpNeeded) {
    G.xp -= G.xpNeeded;
    G.level++;
    G.superPoints++;
    G.totalSP++;
    G.xpNeeded = Math.floor(CONFIG.BASE_XP * Math.pow(CONFIG.XP_SCALE, G.level - 1));
    showNotif('✦ NIVEAU ' + G.level + ' — +1 Super Point !', 'notif-levelup');
    if (G.level >= 50) {
      const spd4 = document.getElementById('spd4');
      if (spd4) spd4.classList.remove('locked');
    }
    renderTabs();
  }
}

function gameOver() {
  G.over = true;
  saveHighScore();
  deleteSave();
  
  const mkVal = document.getElementById('maxKillsValue');
  if (mkVal) mkVal.textContent = getHighScore();
  
  const ov = document.getElementById('overlay');
  if (ov) ov.classList.add('active');
  const title = document.getElementById('overlayTitle');
  if (title) { title.textContent = 'SYSTÈME DÉTRUIT'; title.style.color = 'var(--neon-red)'; }
  const sub = document.getElementById('overlaySub');
  if (sub) sub.textContent = 'Votre noyau principal a été anéanti.';
  const stats = document.getElementById('overlayStats');
  if (stats) stats.textContent = `Vague ${G.wave} | ${G.kills} kills | ${G.credits}¢ | Niveau ${G.level}`;
}
