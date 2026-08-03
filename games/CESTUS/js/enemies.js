// ============================================================
// CESTUS CONTROL — Enemy System
// Spawning, AI, pathfinding, special abilities
// ============================================================

function spawnEnemy(typeKey, isBossOverride, spawnX, spawnY, riftDirective, waveId) {
  const cfg = ENEMY_TYPES[typeKey];
  if (!cfg) return null;
  const strength = 1 + (G.wave - 1) * 0.25;
  const riftFx = riftDirective?.effects || {};

  let ex, ey;
  if (spawnX !== undefined && spawnY !== undefined) {
    const spread = G.CELL * 1.2 * (riftFx.spawnTightness || 1);
    ex = spawnX + (Math.random() - 0.5) * spread;
    ey = spawnY + (Math.random() - 0.5) * spread;
  } else {
    const gz = G.glitchZones[Math.floor(Math.random() * G.glitchZones.length)];
    ex = gz.x + (Math.random() - 0.5) * G.CELL * 2;
    ey = gz.y + (Math.random() - 0.5) * G.CELL * 2;
  }

  const isBoss = isBossOverride || cfg.isBoss || false;
  const bs = isBoss && !cfg.isBoss ? 4 : 1;

  const e = {
    id: Date.now() + Math.random(),
    type: typeKey, isBoss, waveId:waveId || G.wave,
    riftDirective: riftDirective || null,
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
    slowResist: cfg.slowResist || 0,

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
    auraRange: cfg.auraRange || cfg.protectRange || 0,

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

    // HELIOS expansion abilities
    regenPerSec: cfg.regenPerSec || 0,
    phaseInterval: cfg.phaseInterval || 0,
    phaseDuration: cfg.phaseDuration || 0,
    phaseTimer: cfg.phaseInterval ? G.now + cfg.phaseInterval * Math.random() : 0,
    phased: false,
    isCommander: cfg.isCommander || false,
    commandAura: cfg.commandAura || 0,
    isSiphon: cfg.isSiphon || false,
    creditSteal: cfg.creditSteal || 0,
    isBerserker: cfg.isBerserker || false,
    silencedUntil: 0,
  };

  // Apply the chosen contract once at spawn; no extra per-frame calculations.
  const hpMult = riftFx.hpMult || 1;
  const speedMult = riftFx.speedMult || 1;
  const dmgMult = riftFx.dmgMult || 1;
  e.hp *= hpMult;
  e.maxHp *= hpMult;
  e.speed *= speedMult;
  e.baseSpeed *= speedMult;
  e.dmg *= dmgMult;
  e.damageReduction = Math.min(0.72, e.damageReduction + (riftFx.armor || 0));
  e.reward.credits = Math.max(0, Math.round((e.reward.credits || 0) * (riftFx.creditsMult || 1)));
  e.reward.samples = (e.reward.samples || 0) * (riftFx.samplesMult || 1);
  e.xpVal = Math.max(0, Math.round(e.xpVal * (riftFx.xpMult || 1)));
  if (riftFx.regenMult) e.regenPerSec = Math.max(e.regenPerSec, e.maxHp * riftFx.regenMult);

  if (!isBoss && riftFx.eliteChance && Math.random() < riftFx.eliteChance) {
    e.isElite = true;
    e.hp *= 1.8;
    e.maxHp *= 1.8;
    e.dmg *= 1.35;
    e.size *= 1.28;
    e.damageReduction = Math.min(0.72, e.damageReduction + 0.08);
    e.reward.credits = Math.round(e.reward.credits * 2);
    e.xpVal = Math.round(e.xpVal * 2);
    e.color = riftDirective?.color || '#fbbf24';
  }

  return e;
}

function pickEnemyType() {
  let weights;
  if (G.wave <= 5) weights = WAVE_SPAWN_WEIGHTS.early;
  else if (G.wave <= 15) weights = WAVE_SPAWN_WEIGHTS.mid;
  else weights = WAVE_SPAWN_WEIGHTS.late;

  let total = 0;
  for (const w of weights) total += w.w;
  let r = Math.random() * total, acc = 0;
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
    const silenced = e.silencedUntil > now;

    if (e.regenPerSec > 0 && !silenced && now - (e.lastRegen || 0) > 1000) {
      e.lastRegen = now;
      e.hp = Math.min(e.maxHp, e.hp + e.regenPerSec);
      spawnParticle(e.x, e.y, '#52d273', 2);
    }

    if (e.phaseInterval > 0) {
      if (silenced && e.phased) e.phased = false;
      if (!silenced && !e.phased && now >= e.phaseTimer) {
        e.phased = true;
        e.phaseEnds = now + e.phaseDuration;
        spawnParticle(e.x, e.y, '#a78bfa', 8);
      } else if (e.phased && now >= e.phaseEnds) {
        e.phased = false;
        e.phaseTimer = now + e.phaseInterval;
      }
    }

    if (e.isCommander && !silenced && now - (e.lastCommand || 0) > 1500) {
      e.lastCommand = now;
      forEachEnemyInRange(e.x, e.y, e.commandAura, other => {
        if (other !== e) other.hasteUntil = now + 2200;
      });
      spawnParticle(e.x, e.y, '#fb7185', 6);
    }

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
    if (!silenced && e.teleportInterval > 0 && now > e.teleportTimer) {
      const angle = Math.random() * Math.PI * 2;
      e.x += Math.cos(angle) * e.teleportRange;
      e.y += Math.sin(angle) * e.teleportRange;
      e.teleportTimer = now + e.teleportInterval;
      spawnParticle(e.x, e.y, '#ff00ff', 8);
    }

    // Find target (pathfinding)
    if (now - e.lastPathUpdate > 1200 || !e.target || !e.target.alive) {
      e.target = findClosestModule(e.x, e.y);
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
    if (!silenced && e.isHealer && now - (e.lastHeal || 0) > 2000) {
      e.lastHeal = now;
      let healed = false;
      forEachEnemyInRange(e.x, e.y, e.healAura, other => {
        if (other.alive && other !== e) {
          other.hp = Math.min(other.maxHp, other.hp + e.healAmount);
          spawnParticle(other.x, other.y, '#00ff00', 3);
          healed = true;
        }
      });
      if (healed) spawnParticle(e.x, e.y, '#00ff00', 10);
    }

    // Mage summoning
    if (!silenced && e.isMage && now - (e.lastSummon || 0) > e.summonRate) {
      e.lastSummon = now;
      spawnParticle(e.x, e.y, '#9900ff', 15);
      for (let i = 0; i < 3; i++) {
        const spawned = spawnEnemy(e.summonType, false, e.x + (Math.random()-0.5)*30, e.y + (Math.random()-0.5)*30, e.riftDirective, e.waveId);
        if (spawned) G.enemies.push(spawned);
      }
    }

    const dx = e.target.x - e.x;
    const dy = e.target.y - e.y;
    const d = Math.hypot(dx, dy);
    e.angle = Math.atan2(dy, dx);

    if (d > attackRange) {
      let currentSpeed = e.baseSpeed * e.slowFactor;
      if (e.hasteUntil > now) currentSpeed *= 1.35;
      if (e.phased) currentSpeed *= 1.2;
      if (e.isBerserker) currentSpeed *= 1 + (1 - e.hp / e.maxHp) * 1.4;
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
        const rage = e.isBerserker ? 1 + (1 - e.hp / e.maxHp) * 2 : 1;
        damageModule(e.target, e.dmg * rage);
        if (e.isSiphon && !silenced) {
          const stolen = Math.min(G.credits, e.creditSteal || 0);
          G.credits -= stolen;
          if (stolen > 0) showFloatingText(e.x, e.y - 18, '-' + stolen + '¢', '#f472b6');
        }
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
  playGameSfx('kill', e.isBoss ? 1.8 : e.isElite ? 1.35 : 1);
  if (e.isSplitter) {
    for (let i = 0; i < e.splitCount; i++) {
      const spawned = spawnEnemy('splitterMini', false, e.x + (Math.random()-0.5)*20, e.y + (Math.random()-0.5)*20, e.riftDirective, e.waveId);
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

  // Nova Seed: killed targets become short-range chain reactions.
  if (proj && proj.deathNova > 0) {
    const novaDamage = proj.dmg * (proj.deathNovaRatio || 0.5);
    forEachEnemyInRange(e.x, e.y, proj.deathNova, other => {
      if (other !== e && other.alive) damageEnemy(other, novaDamage, null);
    });
    spawnExplosion(e.x, e.y, '#ffcf70');
    G.projectiles.push({
      x:e.x, y:e.y, tx:e.x, ty:e.y, alive:true, speed:0, dmg:0,
      color:'#ffcf70', size:2, isShockwave:true, shockRadius:0,
      maxShockRadius:proj.deathNova, shockLife:18
    });
  }
  G.kills++;
  G.enemyKills[e.type] = (G.enemyKills[e.type] || 0) + 1;
  const hudKills = document.getElementById('hudKills');
  if (hudKills) hudKills.textContent = G.kills;
  awardKill(e, proj);
  spawnDeathExplosion(e.x, e.y, e.color);

  if (GRAPHICS.corpses) {
    G.corpses.push({
      x: e.x, y: e.y, shape: e.shape, size: e.size, color: e.color,
      angle: e.angle, life: 3000, maxLife: 3000
    });
    if (G.corpses.length > 80) G.corpses.shift();
  }
}

function damageEnemy(e, dmg, proj) {
  if (!e || !e.alive) return;
  const now = G.now;
  const hpRatio = e.hp / Math.max(1, e.maxHp);

  if (e.markUntil > now) dmg *= 1 + (e.markPower || 0);
  if (proj?.executeThreshold && hpRatio <= proj.executeThreshold) dmg *= proj.executeMult || 1;
  if (proj?.bossMult && e.isBoss) dmg *= proj.bossMult;
  if (proj?.missingHpMult) dmg *= 1 + (1 - hpRatio) * proj.missingHpMult;

  let dmgReduction = e.damageReduction || 0;
  
  if (!e.isProtector) {
    const protectors = G._protectors || [];
    for (let i = 0; i < protectors.length; i++) {
      const p = protectors[i];
      if (p.alive && p.isProtector && p.id !== e.id) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        if (dx * dx + dy * dy < p.auraRange * p.auraRange) {
          dmgReduction = Math.max(dmgReduction, 0.5); // 50% reduction
          break;
        }
      }
    }
  }

  if (e.armorShredUntil > now) dmgReduction = Math.max(0, dmgReduction - (e.armorShred || 0));
  if (proj?.pureDamage) dmgReduction = 0;
  if (e.phased) dmgReduction = Math.max(dmgReduction, 0.85);

  const actualDmg = dmg * (1 - dmgReduction);
  e.hp -= actualDmg;
  e.flash = 5;
  spawnParticle(e.x, e.y, e.color, 3);

  // Apply slow
  if (proj && proj.slowFactor) {
    const resist = e.slowResist || 0;
    e.slowFactor = 1 - (1 - proj.slowFactor) * (1 - resist);
    e.slowTimer = G.now + (proj.slowDuration || 3000);
  }

  if (proj?.markPower) {
    e.markPower = Math.max(e.markPower || 0, proj.markPower);
    e.markUntil = now + (proj.markDuration || 4000);
  }
  if (proj?.armorShred) {
    const current = e.armorShredUntil > now ? (e.armorShred || 0) : 0;
    e.armorShred = Math.min(0.65, current + proj.armorShred);
    e.armorShredUntil = now + (proj.armorShredDuration || 5000);
  }
  if (proj?.silenceDuration) e.silencedUntil = now + proj.silenceDuration;

  // Apply DOT
  if (proj && proj.dotDmg && e.dots.length < 6) {
    e.dots.push({
      dmg: proj.dotDmg,
      tickRate: proj.dotTick || 500,
      nextTick: G.now + (proj.dotTick || 500),
      remaining: proj.dotDuration || 5000,
    });
  }


  // Aurora tri-element cycle: solar burn, cryo lock, then ionized exposure.
  if (proj?.elemental === 1 && e.dots.length < 6) {
    e.dots.push({dmg:actualDmg * 0.18, tickRate:500, nextTick:now + 500, remaining:2500});
  } else if (proj?.elemental === 2) {
    e.slowFactor = Math.min(e.slowFactor, 0.35);
    e.slowTimer = now + 2200;
  } else if (proj?.elemental === 3) {
    e.markPower = Math.max(e.markPower || 0, 0.18);
    e.markUntil = now + 3000;
  }

  if (proj?.knockback && !e.isBoss) {
    const source = getModuleById(proj.sourceId);
    if (source) {
      const dx = e.x - source.x;
      const dy = e.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      e.x += dx / dist * proj.knockback;
      e.y += dy / dist * proj.knockback;
    }
  }

  if (proj?.lifeSteal && proj.sourceId) {
    const source = getModuleById(proj.sourceId);
    if (source) source.hp = Math.min(source.maxHp, source.hp + actualDmg * proj.lifeSteal);
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
  const creditMult = (1 + upg.creditGain) * (1 + sp.credits * 0.01) * (1 + (proj?.aura_credits || 0)) * (proj?.bountyMult || 1);
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
    G._tabsDirty = true;
  }
  // HUD is already refreshed at a fixed cadence by the main loop.
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
