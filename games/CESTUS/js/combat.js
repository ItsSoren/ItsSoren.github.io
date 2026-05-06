// ============================================================
// CESTUS CONTROL — Combat System
// Module shooting, projectiles, special weapon mechanics
// ============================================================

function moduleShoot(mod, now) {
  const def = MODULE_TYPES[mod.typeId];
  if (!def.isShooter && !def.isCore && !def.isAttractor && !def.isReplicator) return;
  if (G.overclockPenalty > 0) return;
  const stats = getModuleStats(mod);

  if (def.isAttractor) {
     if (now - (mod.lastTick||0) > 100) {
        mod.lastTick = now;
        G.enemies.forEach(e => {
           if (!e.alive) return;
           const d = Math.hypot(e.x - mod.x, e.y - mod.y);
           if (d < stats.range) {
              e.x += (mod.x - e.x) / d * 0.5;
              e.y += (mod.y - e.y) / d * 0.5;
              e.slowFactor = 0.3;
              e.slowTimer = now + 500;
           }
        });
     }
     return;
  }

  if (def.isReplicator) {
     if (now - (mod.lastTick||0) > 45000) {
        if (!mod.lastTick) { mod.lastTick = now; return; }
        mod.lastTick = now;
        G.samples += 1;
        showFloatingText(mod.x, mod.y - 20, '+1 🔬', '#ffffff');
     }
     return;
  }

  // Burst handling
  const isBursting = (mod.burstLeft > 0);
  if (isBursting) {
    if (now - (mod.lastBurstFire || 0) < (def.burstDelay || 100)) return;
  } else {
    if (now - (mod.lastFire || 0) < stats.fireRate) return;
  }

  if (def.isPoisonAura) {
    let fired = false;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (Math.hypot(e.x - mod.x, e.y - mod.y) < stats.range) {
        damageEnemy(e, stats.dmg, { aura_credits: stats.aura_credits, aura_samples: stats.aura_samples });
        fired = true;
      }
    }
    if (fired) {
      if (isBursting) {
        mod.burstLeft--;
        mod.lastBurstFire = now;
      } else if (def.burstCount > 1) {
        mod.burstLeft = def.burstCount - 1;
        mod.lastBurstFire = now;
        mod.lastFire = now;
      } else {
        mod.lastFire = now;
      }
      mod.burstAnim = 10;
      spawnParticle(mod.x, mod.y, def.color, 8);
    }
    return;
  }

  // Orbital Strike — targets strongest enemy on ENTIRE map (no range limit)
  if (def.isOrbital) {
    let strongest = null, maxHp = 0;
    G.enemies.forEach(e => {
       if (e.alive && e.hp > maxHp) { maxHp = e.hp; strongest = e; }
    });
    if (strongest) {
      if (isBursting) {
        mod.burstLeft--;
        mod.lastBurstFire = now;
      } else if (def.burstCount > 1) {
        mod.burstLeft = def.burstCount - 1;
        mod.lastBurstFire = now;
        mod.lastFire = now;
      } else {
        mod.lastFire = now;
      }
      mod.angle = Math.atan2(strongest.y - mod.y, strongest.x - mod.x);
      mod.burstAnim = 5;
      G.projectiles.push({
        x: strongest.x, y: strongest.y, tx: strongest.x, ty: strongest.y,
        speed: 0, dmg: stats.dmg * (1 + getOverclockBonus() * 0.5), color: '#ffcc00', size: 0,
        alive: true, isOrbitalDrop: true, timer: 60, splash: 150, sourceId: mod.id
      });
    }
    return;
  }

  // Find closest enemy in range
  let target = null, minD = Infinity;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i];
    if (!e.alive) continue;
    const d = Math.hypot(e.x - mod.x, e.y - mod.y);
    if (d < stats.range && d < minD) { minD = d; target = e; }
  }
  if (!target) {
    // Reset ramp-up if no target
    if (def.rampUp) { mod.rampDmgMult = 1.0; mod.lastRampTarget = null; }
    return;
  }

  if (isBursting) {
    mod.burstLeft--;
    mod.lastBurstFire = now;
  } else if (def.burstCount > 1) {
    mod.burstLeft = def.burstCount - 1;
    mod.lastBurstFire = now;
    mod.lastFire = now;
  } else {
    mod.lastFire = now;
  }
  
  mod.angle = Math.atan2(target.y - mod.y, target.x - mod.x);
  mod.burstAnim = 5;

  // Ramp-up damage (Plasma cannon)
  let dmgMult = 1;
  if (def.rampUp) {
    if (mod.lastRampTarget === target.id) {
      mod.rampDmgMult = Math.min(def.rampMax || 3.0, mod.rampDmgMult + 0.1);
    } else {
      mod.rampDmgMult = 1.0;
      mod.lastRampTarget = target.id;
    }
    dmgMult = mod.rampDmgMult;
  }

  // Super Beam (Plasma) — distance-based damage falloff
  if (def.isSuperBeam) {
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const maxDist = G.GRID_R * G.CELL * 2;
    const farX = mod.x + Math.cos(angle) * maxDist;
    const farY = mod.y + Math.sin(angle) * maxDist;
    
    const hitEnemies = [];
    G.enemies.forEach(e => {
       if (!e.alive) return;
       const l2 = maxDist * maxDist;
       let t = ((e.x - mod.x) * (farX - mod.x) + (e.y - mod.y) * (farY - mod.y)) / l2;
       t = Math.max(0, Math.min(1, t));
       const px = mod.x + t * (farX - mod.x);
       const py = mod.y + t * (farY - mod.y);
       if (Math.hypot(e.x - px, e.y - py) < e.size + 15) {
          hitEnemies.push({e, dist: Math.hypot(e.x - mod.x, e.y - mod.y)});
       }
    });

    hitEnemies.sort((a,b) => a.dist - b.dist);
    const beamRange = stats.range * 3; // effective damage range
    hitEnemies.forEach(hit => {
       // Distance-based falloff: full damage at close range, 20% at max range
       const distRatio = Math.min(1, hit.dist / beamRange);
       const falloff = Math.max(0.2, 1 - distRatio * 0.8);
       damageEnemy(hit.e, stats.dmg * dmgMult * falloff, {
          aura_credits: stats.aura_credits,
          aura_samples: stats.aura_samples,
       });
       spawnParticle(hit.e.x, hit.e.y, def.color, 3);
    });

    G.projectiles.push({
      x: mod.x, y: mod.y, tx: farX, ty: farY,
      speed: 0, dmg: 0, color: def.color, size: 8,
      alive: true, isBeam: true, beamLife: 15, sourceId: mod.id
    });
    return;
  }

  // Beam weapon (continuous laser) — instant hit
  if (def.isBeam) {
    damageEnemy(target, stats.dmg * dmgMult, {
      aura_credits: stats.aura_credits,
      aura_samples: stats.aura_samples,
    });
    // Visual beam line stored for rendering
    G.projectiles.push({
      x: mod.x, y: mod.y,
      tx: target.x, ty: target.y,
      targetId: target.id,
      speed: 0, dmg: 0, color: def.color,
      splash: 0, size: 2, alive: true,
      isBeam: true, beamLife: 6, sourceId: mod.id,
    });
    return;
  }

  // Tesla chain lightning
  if (def.chainCount) {
    // Hit primary target
    damageEnemy(target, stats.dmg * dmgMult, {
      aura_credits: stats.aura_credits,
      aura_samples: stats.aura_samples,
    });

    // Chain to nearby enemies
    const hit = new Set([target.id]);
    let current = target;
    const chainRange = (def.chainRange || 2) * G.CELL;
    for (let c = 0; c < def.chainCount - 1; c++) {
      let next = null, nextD = Infinity;
      for (const e of G.enemies) {
        if (!e.alive || hit.has(e.id)) continue;
        const cd = Math.hypot(e.x - current.x, e.y - current.y);
        if (cd < chainRange && cd < nextD) { nextD = cd; next = e; }
      }
      if (!next) break;
      hit.add(next.id);
      damageEnemy(next, stats.dmg * 0.6, null);
      // Chain visual
      G.projectiles.push({
        x: current.x, y: current.y,
        tx: next.x, ty: next.y,
        targetId: next.id, speed: 0, dmg: 0,
        color: '#ddaaff', splash: 0, size: 1.5,
        alive: true, isBeam: true, beamLife: 5, sourceId: mod.id,
      });
      current = next;
    }

    // Primary beam visual
    G.projectiles.push({
      x: mod.x, y: mod.y,
      tx: target.x, ty: target.y,
      targetId: target.id, speed: 0, dmg: 0,
      color: def.color, splash: 0, size: 2,
      alive: true, isBeam: true, beamLife: 6, sourceId: mod.id,
    });
    return;
  }

  // Sonic (Multiple piercing waves — keep wide, reduce count)
  if (def.isSonic) {
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const farX = mod.x + Math.cos(angle) * stats.range;
    const farY = mod.y + Math.sin(angle) * stats.range;
    const waveSize = 25 + mod.mk * 5; 
    
    // Now fires ONE wave per burst tick instead of 2 waves at once
    G.projectiles.push({
      x: mod.x, y: mod.y, tx: farX, ty: farY, targetId: target.id,
      speed: 8, dmg: stats.dmg * dmgMult, color: def.color, splash: 0, size: waveSize,
      alive: true, isPiercing: true, isSonicWave: true, piercedIds: new Set(), sourceId: mod.id, angle: angle
    });
    return;
  }

  // Laser Bolt (Ricochet) — animated bouncing projectiles, max 5 bounces
  if (def.isLaserBolt) {
    const maxBounces = Math.min(5, 2 + Math.floor(mod.mk * 0.8) + Math.floor(mod.level / 10));
    
    // First hit is instant beam to primary target
    damageEnemy(target, stats.dmg * dmgMult, null);
    G.projectiles.push({
      x: mod.x, y: mod.y, tx: target.x, ty: target.y, speed: 0, dmg: 0, color: def.color,
      size: 3, alive: true, isBeam: true, beamLife: 8, sourceId: mod.id
    });
    
    // Subsequent bounces are animated projectiles with a delay
    const hitIds = new Set([target.id]);
    let fromX = target.x, fromY = target.y;
    let bouncesLeft = maxBounces;
    
    while (bouncesLeft > 0) {
      let next = null, nextD = Infinity;
      for (const e of G.enemies) {
        if (!e.alive || hitIds.has(e.id)) continue;
        const d = Math.hypot(e.x - fromX, e.y - fromY);
        if (d < stats.range * 0.7 && d < nextD) { nextD = d; next = e; }
      }
      if (!next) break;
      
      hitIds.add(next.id);
      // Create animated ricochet projectile with incremental delay
      const delay = (maxBounces - bouncesLeft + 1) * 200;
      G.projectiles.push({
        x: fromX, y: fromY, tx: next.x, ty: next.y, targetId: next.id,
        speed: 3, dmg: stats.dmg * dmgMult * (0.8 - bouncesLeft * 0.05), color: def.color,
        size: 3, alive: true, sourceId: mod.id, isRicochetBounce: true,
        delay: delay
      });
      
      fromX = next.x;
      fromY = next.y;
      bouncesLeft--;
    }
    return;
  }

  // Gamma Irradiation — cap charges
  if (def.isGamma) {
    damageEnemy(target, stats.dmg * dmgMult, null);
    target.gammaCharge = Math.min(8, (target.gammaCharge || 0) + 1);
    target.gammaModLvl = Math.min(30, mod.level * mod.mk); // capped
    G.projectiles.push({
      x: mod.x, y: mod.y, tx: target.x, ty: target.y, speed: 0, dmg: 0, color: def.color,
      size: 2, alive: true, isBeam: true, beamLife: 6, sourceId: mod.id
    });
    return;
  }

  // Cryo Multi-Target
  if (def.slowFactor) {
    const targets = [];
    G.enemies.forEach(e => {
      if (e.alive && Math.hypot(e.x - mod.x, e.y - mod.y) < stats.range) targets.push(e);
    });
    targets.sort((a,b) => Math.hypot(a.x-mod.x, a.y-mod.y) - Math.hypot(b.x-mod.x, b.y-mod.y));
    const maxTargets = 2 + mod.mk + Math.floor(mod.level / 4);
    for (let i = 0; i < Math.min(targets.length, maxTargets); i++) {
       const t = targets[i];
       G.projectiles.push({
          x: mod.x, y: mod.y, tx: t.x, ty: t.y, targetId: t.id,
          speed: 12, dmg: stats.dmg * dmgMult, color: def.color,
          splash: 0, size: 4, alive: true, sourceId: mod.id,
          slowFactor: stats.slowFactor, slowDuration: stats.slowDuration || 3000
       });
    }
    return;
  }

  // Railgun
  if (def.isRailgun) {
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const farX = mod.x + Math.cos(angle) * stats.range;
    const farY = mod.y + Math.sin(angle) * stats.range;
    
    // Hyper-velocity kinetic slug
    G.projectiles.push({
      x: mod.x, y: mod.y, tx: farX, ty: farY, targetId: null, speed: 25, dmg: stats.dmg * dmgMult,
      color: def.color, splash: 0, size: 6 + mod.level * 0.2, alive: true,
      isRailgunProj: true, piercedIds: new Set(), sourceId: mod.id, angle: angle
    });
    return;
  }

  // Flamethrower — real fire particle stream
  if (def.isFlamethrower) {
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const coneAngle = (Math.PI / 4) / (1 + (mod.level - 1) * 0.05);
    G.enemies.forEach(e => {
       if (!e.alive) return;
       const d = Math.hypot(e.x - mod.x, e.y - mod.y);
       if (d < stats.range) {
          const ea = Math.atan2(e.y - mod.y, e.x - mod.x);
          let diff = Math.abs(ea - angle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < coneAngle) {
             damageEnemy(e, stats.dmg * dmgMult, {aura_credits: stats.aura_credits, aura_samples: stats.aura_samples});
          }
       }
    });
    // Dense fire particle stream
    for (let i = 0; i < 12; i++) {
       const fa = angle + (Math.random() - 0.5) * coneAngle * 2;
       const d = Math.random() * stats.range * 0.9;
       const px = mod.x + Math.cos(fa) * d;
       const py = mod.y + Math.sin(fa) * d;
       const colors = ['#ff2200', '#ff5500', '#ff8800', '#ffcc00', '#ffee44'];
       const ci = Math.floor(Math.random() * colors.length);
       G.particles.push({
         x: px, y: py,
         vx: Math.cos(fa) * (1 + Math.random() * 2),
         vy: Math.sin(fa) * (1 + Math.random() * 2) - Math.random() * 0.5,
         life: 12 + Math.random() * 10,
         maxLife: 22,
         color: colors[ci],
         size: 2 + Math.random() * 4,
       });
    }
    return;
  }

  // Blackhole
  if (def.isBlackhole) {
    G.projectiles.push({
      x: mod.x, y: mod.y, tx: target.x, ty: target.y,
      speed: 3, dmg: stats.dmg * dmgMult, color: '#330066', size: 8,
      alive: true, isBlackholeProj: true, life: 180, sourceId: mod.id
    });
    return;
  }

  // Flamethrower
  if (def.isFlamethrower) {
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    for (let i = 0; i < 4; i++) {
      const pAngle = angle + (Math.random() - 0.5) * 0.45;
      const speed = 4 + Math.random() * 4;
      const dist = 60 + Math.random() * (stats.range * 0.8);
      G.projectiles.push({
        x: mod.x, y: mod.y, tx: mod.x + Math.cos(pAngle) * dist, ty: mod.y + Math.sin(pAngle) * dist,
        targetId: null, speed: speed, dmg: (stats.dmg * dmgMult) / 4, color: '#ff5500',
        size: 12 + Math.random() * 12, alive: true, isFire: true, life: 25 + Math.random() * 15, maxLife: 40, sourceId: mod.id,
        pAngle: pAngle
      });
    }
    return;
  }

  // Standard projectile
  const proj = {
    x: mod.x, y: mod.y,
    tx: target.x, ty: target.y,
    targetId: target.id,
    speed: def.splash ? 6 : 9,
    dmg: stats.dmg * dmgMult,
    color: def.color,
    splash: def.splash || 0,
    size: def.splash ? 5 : 3,
    alive: true, sourceId: mod.id,
    aura_credits: stats.aura_credits,
    aura_samples: stats.aura_samples,
  };

  // Missile logic
  if (def.isMissile) {
    proj.isMissile = true;
    proj.speed = 4; // slow moving
    proj.angle = Math.atan2(target.y - mod.y, target.x - mod.x);
  }

  // Mortar: slower, arcing
  if (def.isMortar) {
    proj.isMortar = true;
    proj.speed = 3.5;
    proj.startPoint = {x: mod.x, y: mod.y};
    proj.totalDist = Math.hypot(target.x - mod.x, target.y - mod.y);
    proj.mortarLvl = mod.level;
  }

  G.projectiles.push(proj);
}

function updateProjectiles(dt) {
  for (let i = G.projectiles.length - 1; i >= 0; i--) {
    const p = G.projectiles[i];
    if (!p.alive) {
      const last = G.projectiles.pop();
      if (i < G.projectiles.length) G.projectiles[i] = last;
      continue;
    }

    if (p.delay > 0) {
      p.delay -= dt;
      continue;
    }

    // Fire particles (Flamethrower) - Expand and fade
    if (p.isFire) {
      p.life--;
      const ratio = p.life / p.maxLife;
      p.size += 0.8; // Expanding fire
      p.x += Math.cos(p.pAngle) * p.speed;
      p.y += Math.sin(p.pAngle) * p.speed;
      p.speed *= 0.96; // Slow down
      
      // Damage check
      if (p.life % 4 === 0) {
        G.enemies.forEach(e => {
          if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < p.size + e.size) {
            damageEnemy(e, p.dmg, p);
          }
        });
      }

      if (p.life <= 0) p.alive = false;
      continue;
    }

    // Beam visuals just decay
    if (p.isBeam) {
      p.beamLife--;
      if (p.beamLife <= 0) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
      }
      continue;
    }

    // Shockwave ring expands then fades
    if (p.isShockwave) {
      p.shockRadius += p.maxShockRadius / p.shockLife;
      p.shockLife--;
      if (p.shockLife <= 0) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
      }
      continue;
    }

    // Orbital Drop logic
    if (p.isOrbitalDrop) {
      p.timer--;
      // Warning zone particles
      spawnParticle(p.x + (Math.random()-0.5)*p.splash, p.y + (Math.random()-0.5)*p.splash, '#ffcc00', 1);
      // Beam from sky at impact
      if (p.timer === 20) {
        G.projectiles.push({
          x: p.x, y: p.y - 2000, tx: p.x, ty: p.y,
          speed: 0, dmg: 0, color: '#ffcc00', size: 12,
          alive: true, isBeam: true, beamLife: 25, sourceId: p.sourceId
        });
      }
      if (p.timer <= 0) {
        // Massive shockwave
        for(let j=0; j<10; j++) spawnExplosion(p.x + (Math.random()-0.5)*80, p.y + (Math.random()-0.5)*80, '#ffcc00');
        spawnExplosion(p.x, p.y, '#ffffff');
        spawnExplosion(p.x, p.y, '#ff6600');
        // Shockwave ring visual
        G.projectiles.push({
          x: p.x, y: p.y, tx: p.x, ty: p.y,
          speed: 0, dmg: 0, color: '#ffcc00', size: 1,
          alive: true, isShockwave: true, shockRadius: 0, maxShockRadius: p.splash * 1.5, shockLife: 30
        });
        // Damage + falloff
        G.enemies.forEach(e => {
           if (!e.alive) return;
           const d = Math.hypot(e.x - p.x, e.y - p.y);
           if (d < p.splash) {
             const falloff = 1 - (d / p.splash) * 0.5;
             damageEnemy(e, p.dmg * falloff);
           }
        });
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
      }
      continue;
    }

    // Fire zone logic
    if (p.isFireZone) {
      p.life -= (dt / 16);
      if (p.life <= 0) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
      } else {
        // Continuous damage
        G.enemies.forEach(e => {
          if (!e.alive) return;
          if (Math.hypot(e.x - p.x, e.y - p.y) < p.size) {
            damageEnemy(e, p.dmg * (dt/16) * 0.1, p);
          }
        });
        if (Math.random() < 0.3) {
           spawnParticle(p.x + (Math.random()-0.5)*p.size, p.y + (Math.random()-0.5)*p.size, Math.random() > 0.5 ? '#ff3300' : '#ffaa00', 1);
        }
      }
      continue;
    }

    // Blackhole logic
    if (p.isBlackholeProj) {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      if (d > p.speed) {
        p.x += dx / d * p.speed * (dt / 16);
        p.y += dy / d * p.speed * (dt / 16);
      } else {
        p.life--;
        spawnParticle(p.x, p.y, '#aa00ff', 2);
        G.enemies.forEach(e => {
           if (!e.alive) return;
           const ed = Math.hypot(e.x - p.x, e.y - p.y);
           if (ed < 200) {
             const pullSpeed = 2;
             e.x += (p.x - e.x) / ed * pullSpeed * (dt/16);
             e.y += (p.y - e.y) / ed * pullSpeed * (dt/16);
           }
        });
        if (p.life <= 0) {
           spawnExplosion(p.x, p.y, '#330066');
           G.enemies.forEach(e => {
             if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < 200) damageEnemy(e, p.dmg);
           });
           p.alive = false;
           const last = G.projectiles.pop();
           if (i < G.projectiles.length) G.projectiles[i] = last;
        }
      }
      continue;
    }

    // Enemy projectiles target modules
    if (p.isEnemyProjectile) {
      const tgt = G.modules.find(m => m.id === p.targetModuleId && m.alive);
      if (tgt) { p.tx = tgt.x; p.ty = tgt.y; }
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      if (d < p.speed + 4) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
        if (tgt) damageModule(tgt, p.dmg);
        spawnParticle(p.tx, p.ty, p.color, 3);
      } else {
        p.x += dx / d * p.speed * (dt / 16);
        p.y += dy / d * p.speed * (dt / 16);
      }
      continue;
    }

    // Track living target for homing / standard (NOT ricochet bounces)
    const target = G.enemies.find(e => e.id === p.targetId && e.alive);
    if (target && !p.isPiercing && !p.isMissile && !p.isRicochetBounce) { p.tx = target.x; p.ty = target.y; }

    // Ricochet bounce trail
    if (p.isRicochetBounce && Math.random() < 0.5) {
      spawnParticle(p.x, p.y, p.color, 1);
    }

    // Missile Homing
    if (p.isMissile) {
      if (target) {
        p.tx = target.x; p.ty = target.y;
        const targetAngle = Math.atan2(p.ty - p.y, p.tx - p.x);
        // Smooth rotation
        let diff = targetAngle - p.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        p.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.08 * (dt / 16));
        p.speed = Math.min(p.speed + 0.1 * (dt / 16), 10); // Accelerates
      }
      p.x += Math.cos(p.angle) * p.speed * (dt / 16);
      p.y += Math.sin(p.angle) * p.speed * (dt / 16);
      spawnParticle(p.x - Math.cos(p.angle)*5, p.y - Math.sin(p.angle)*5, '#ff8800', 1);

      if (Math.hypot(p.tx - p.x, p.ty - p.y) < p.speed + 2) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
        spawnExplosion(p.tx, p.ty, p.color);
        G.enemies.forEach(e => {
          if (e.alive && Math.hypot(e.x - p.tx, e.y - p.ty) < p.splash * G.CELL) {
            damageEnemy(e, p.dmg, p);
          }
        });
      }
      continue;
    }

    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);

    // Piercing projectile or Railgun slug
    if (p.isPiercing || p.isRailgunProj) {
      G.enemies.forEach(e => {
        if (!e.alive || p.piercedIds.has(e.id)) return;
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        // Sonic waves and Railgun are wider
        const hitRad = (p.isSonicWave || p.isRailgunProj) ? e.size + p.size + 15 : e.size + p.size + 5;
        if (dist < hitRad) {
          p.piercedIds.add(e.id);
          damageEnemy(e, p.dmg, p);
          spawnParticle(e.x, e.y, p.color, 4);
          
          if (p.isRailgunProj && !e.isBoss) {
            e.x += Math.cos(p.angle) * 20;
            e.y += Math.sin(p.angle) * 20;
          }
        }
      });

      if (d <= p.speed * (dt / 16) + 2) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
      } else {
        p.x += dx / d * p.speed * (dt / 16);
        p.y += dy / d * p.speed * (dt / 16);
      }
      continue;
    }

    // Standard hit detection
    if (d <= p.speed * (dt / 16) + 4) {
      p.alive = false;
      const last = G.projectiles.pop();
      if (i < G.projectiles.length) G.projectiles[i] = last;
      
      if (p.splash > 0) {
        const splashR = p.splash * G.CELL * 0.5;
        G.enemies.forEach(e => {
          if (!e.alive) return;
          const sd = Math.hypot(e.x - p.tx, e.y - p.ty);
          if (sd < splashR) {
            damageEnemy(e, p.dmg * (1 - sd / (splashR + 1)), p);
          }
        });
        spawnExplosion(p.tx, p.ty, p.color);
        
        if (p.isMortar) {
          G.projectiles.push({
            x: p.tx, y: p.ty, tx: p.tx, ty: p.ty, targetId: null,
            speed: 0, dmg: p.dmg * 0.2, color: '#ff6600', size: splashR,
            alive: true, isFireZone: true, life: 180 + (p.mortarLvl || 1) * 20, sourceId: p.sourceId
          });
        }
      } else if (target) {
        damageEnemy(target, p.dmg, p);
      }
    } else {
      p.x += dx / d * p.speed * (dt / 16);
      p.y += dy / d * p.speed * (dt / 16);
    }
  }
}
