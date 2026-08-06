// ============================================================
// CESTUS CONTROL — Combat System
// Module shooting, projectiles, special weapon mechanics
// ============================================================

function getProjectileStyle(def, elemental, typeId) {
  if (!def) return 'pulse';
  if (elemental === 1) return 'ember';
  if (elemental === 2) return 'cryo';
  if (elemental === 3) return 'electric';
  const exactStyles = {
    turret:'tracer', laser:'prism', missile:'missile', beam:'pulse', railgun:'phase', mortar:'shell',
    frost:'cryo', flame:'ember', sonic:'pulse', bolt:'electric', gamma:'toxic', orbital:'charged',
    blackhole:'phase', poison:'acid', tesla:'electric', plasma:'prism', prism:'prism',
    null_lance:'phase', executioner:'blade', acid_weaver:'acid', chrono_anchor:'chrono', emp_spire:'electric',
    mine_architect:'heavy', cluster_bloom:'cluster', helix_array:'helix', pulse_ram:'pulse', leech_node:'leech',
    bossbreaker:'heavy', entropy_needle:'phase', nova_seed:'cluster', kinetic_battery:'charged',
    shardstorm:'shard', aurora_array:'ember', bounty_compiler:'tracer', phase_repeater:'phase', gravity_hammer:'heavy'
  };
  if (exactStyles[typeId]) return exactStyles[typeId];
  const name = (def.name || '').toLowerCase();
  if (def.isMissile) return 'missile';
  if (def.isMortar || def.splash) return 'shell';
  if (def.isRailgun || name.includes('vide') || name.includes('phase')) return 'phase';
  if (def.isScatter) return 'shard';
  if (def.isGamma) return 'toxic';
  if (def.elemental) return 'ember';
  const visual = def.visual || '';
  const styles = {
    prism:'prism', blade:'blade', ring:'pulse', hourglass:'chrono', spire:'electric',
    hex:'heavy', flower:'cluster', helix:'helix', battery:'charged', shard:'shard'
  };
  if (styles[visual]) return styles[visual];
  if (def.lifeSteal) return 'leech';
  if (def.dotRatio || def.armorShred) return 'acid';
  if (def.deathNova) return 'cluster';
  if (def.chargeEvery) return 'charged';
  if (def.bossMult) return 'heavy';
  return def.group === 'kinetic' ? 'tracer' : def.group === 'control' ? 'chrono' : 'pulse';
}

function buildAdvancedPayload(def, mod, stats) {
  const payload = {
    sourceId: mod.id,
    markPower: def.markPower || 0,
    markDuration: def.markDuration || 0,
    armorShred: def.armorShred || 0,
    armorShredDuration: def.armorShredDuration || 0,
    dotDmg: def.dotRatio ? stats.dmg * def.dotRatio : 0,
    dotDuration: def.dotDuration || 0,
    dotTick: 500,
    slowFactor: def.stasisFactor || 0,
    slowDuration: def.stasisDuration || 0,
    silenceDuration: def.silenceDuration || 0,
    pureDamage: !!def.pureDamage,
    executeThreshold: def.executeThreshold || 0,
    executeMult: def.executeMult || 1,
    bossMult: def.bossMult || 1,
    missingHpMult: def.missingHpMult || 0,
    lifeSteal: def.lifeSteal || 0,
    deathNova: def.deathNova || 0,
    deathNovaRatio: def.deathNovaRatio || 0,
    bountyMult: def.bountyMult || 1,
    knockback: def.knockback || 0,
    elemental: def.elemental ? (mod.shotCounter % 3) + 1 : 0,
  };
  payload.weaponType = mod.typeId;
  payload.projectileStyle = getProjectileStyle(def, payload.elemental, mod.typeId);
  return payload;
}

function getSpreadAim(mod, target, stats, multiplier) {
  const baseAngle = Math.atan2(target.y - mod.y, target.x - mod.x);
  const spread = (stats.spread || 0) * (multiplier || 1);
  const angle = baseAngle + (Math.random() + Math.random() - 1) * spread;
  const distance = Math.hypot(target.x - mod.x, target.y - mod.y);
  return {angle, x:mod.x + Math.cos(angle) * distance, y:mod.y + Math.sin(angle) * distance};
}

// Helper to apply projectile booster multipliers (must be defined before use)
function applyProjectileBoosters(projectile, stats) {
  if (!stats) return projectile;
  if (stats.projectileSizeMult && projectile.size !== undefined) {
    projectile.size *= stats.projectileSizeMult;
  }
  if (stats.projectileDmgMult && stats.projectileDmgMult > 1 && projectile.dmg !== undefined) {
    projectile.dmg *= stats.projectileDmgMult;
  }
  if (stats.projectileAoEMult && stats.projectileAoEMult > 1 && projectile.splash !== undefined) {
    projectile.splash *= stats.projectileAoEMult;
  }
  return projectile;
}

function spawnWeaponSignature(mod, def, payload, now) {
  if (G._fxTier >= 2 || now - (mod.lastSignatureFx || 0) < 95) return;
  mod.lastSignatureFx = now;
  const style = payload.projectileStyle || 'pulse';
  const kinds = {electric:'fork',acid:'droplet',toxic:'droplet',chrono:'glyph',prism:'shard',phase:'shard',ember:'ember',cryo:'crystal',cluster:'petal',charged:'square',heavy:'debris'};
  const mx = mod.x + Math.cos(mod.angle || 0) * G.CELL * .32;
  const my = mod.y + Math.sin(mod.angle || 0) * G.CELL * .32;
  pushParticle({x:mx,y:my,vx:Math.cos(mod.angle||0)*1.8,vy:Math.sin(mod.angle||0)*1.8,life:10,maxLife:10,color:def.color,size:4,kind:kinds[style]||'ring',drag:.9,gravity:0});
  if (G._fxTier === 0) pushParticle({x:mx,y:my,vx:0,vy:0,life:8,maxLife:8,color:'#ffffff',size:3,kind:'flash',drag:1,gravity:0});
}

function fireAdvancedWeapon(def, mod, target, stats, dmgMult, payload) {
  if (def.isRadialPulse) {
    forEachEnemyInRange(mod.x, mod.y, stats.range, e => {
      damageEnemy(e, stats.dmg * dmgMult, payload);
    });
    G.projectiles.push({
      x:mod.x, y:mod.y, tx:mod.x, ty:mod.y, alive:true, speed:0, dmg:0,
      color:def.color, size:2, isShockwave:true, shockRadius:0,
      maxShockRadius:stats.range, shockLife:30, ...payload
    });
    spawnParticle(mod.x, mod.y, def.color, 16);
    return true;
  }

  if (def.isMineLayer) {
    G.projectiles.push(applyProjectileBoosters({
      x:target.x, y:target.y, tx:target.x, ty:target.y, alive:true, speed:0,
      dmg:stats.dmg * dmgMult, color:def.color, size:10, isMine:true,
      armTime:450, life:18000, triggerRadius:def.mineTrigger || 55,
      splash:def.mineSplash || 120, sourceId:mod.id
    }, stats));
    spawnParticle(target.x, target.y, def.color, 8);
    return true;
  }

  if (def.isScatter) {
    const count = def.scatterCount || 5;
    const baseAngle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const spread = def.scatterAngle || 0.7;
    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread;
      const angle = baseAngle + offset;
      G.projectiles.push(applyProjectileBoosters({
        x:mod.x, y:mod.y,
        tx:mod.x + Math.cos(angle) * stats.range,
        ty:mod.y + Math.sin(angle) * stats.range,
        speed:9, dmg:stats.dmg * dmgMult, color:def.color,
        splash:def.splash || 0, size:5, alive:true, sourceId:mod.id
      }, stats));
    }
    spawnParticle(mod.x, mod.y, def.color, count * 2);
    return true;
  }

  if (def.multiTarget) {
    const targets = [];
    forEachEnemyInRange(mod.x, mod.y, stats.range, (e, distSq) => targets.push({e, distSq}));
    targets.sort((a,b) => a.distSq - b.distSq);
    const count = Math.min(def.multiTarget, targets.length);
    for (let i = 0; i < count; i++) {
      const t = targets[i].e;
      G.projectiles.push(applyProjectileBoosters({
        x:mod.x, y:mod.y, tx:t.x, ty:t.y, targetId:t.id,
        speed:11, dmg:stats.dmg * dmgMult, color:def.color, splash:0,
        size:4, alive:true, ...payload
      }, stats));
    }
    return true;
  }
  return false;
}

function moduleShoot(mod, now) {
  const def = MODULE_TYPES[mod.typeId];
  if (!def.isShooter && !def.isCore && !def.isAttractor && !def.isReplicator) return;
  if (G.overclockPenalty > 0) return;
  const stats = getModuleStats(mod);

  if (def.isAttractor) {
     if (now - (mod.lastTick||0) > 100) {
        mod.lastTick = now;
        forEachEnemyInRange(mod.x, mod.y, stats.range, (e, distSq) => {
           const d = Math.sqrt(distSq) || 1;
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
    forEachEnemyInRange(mod.x, mod.y, stats.range, e => {
      if (e.alive) {
        damageEnemy(e, stats.dmg, { aura_credits: stats.aura_credits, aura_samples: stats.aura_samples });
        fired = true;
      }
    });
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
      const orbitalSplash = (def.splash || 150) * (1 + (mod.mk - 1) * 0.25);
      G.projectiles.push(applyProjectileBoosters({
        x: strongest.x, y: strongest.y, tx: strongest.x, ty: strongest.y,
        speed: 0, dmg: stats.dmg * (1 + getOverclockBonus() * 0.5), color: '#ffcc00', size: 0,
        alive: true, isOrbitalDrop: true, timer: 60, splash: orbitalSplash, sourceId: mod.id
      }, stats));
    }
    return;
  }

  // Find closest enemy in range
  const target = findClosestEnemy(mod.x, mod.y, stats.range);
  if (!target) {
    // Reset ramp-up if no target
    if (def.rampUp) { mod.rampDmgMult = 1.0; mod.lastRampTarget = null; }
    if (mod.gammaTargetId) { mod.gammaFocus = 1.0; mod.gammaTargetId = null; }
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

  mod.shotCounter = (mod.shotCounter || 0) + 1;
  if (def.chargeEvery && mod.shotCounter % def.chargeEvery === 0) {
    dmgMult *= def.chargeMult || 4;
    spawnParticle(mod.x, mod.y, '#ffffff', 18);
  }
  const advancedPayload = buildAdvancedPayload(def, mod, stats);
  spawnWeaponSignature(mod, def, advancedPayload, now);
  if (fireAdvancedWeapon(def, mod, target, stats, dmgMult, advancedPayload)) return;

  // Super Beam (Plasma) — width scales with MK
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
       if (Math.hypot(e.x - px, e.y - py) < e.size + 15 + mod.mk * 2) {
          hitEnemies.push({e, dist: Math.hypot(e.x - mod.x, e.y - mod.y)});
       }
    });

    hitEnemies.sort((a,b) => a.dist - b.dist);
    const beamRange = stats.range * 3;
    hitEnemies.forEach(hit => {
       const distRatio = Math.min(1, hit.dist / beamRange);
       const falloff = Math.max(0.2, 1 - distRatio * 0.8);
       damageEnemy(hit.e, stats.dmg * dmgMult * falloff, {
          aura_credits: stats.aura_credits,
          aura_samples: stats.aura_samples,
       });
       spawnParticle(hit.e.x, hit.e.y, def.color, 3 + mod.mk);
    });

    // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
    const laserSpeed = 12000 / (1000 / 16); // pixels per frame at 60fps
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y, tx: farX, ty: farY,
      speed: laserSpeed, dmg: 0, color: def.color, size: beamWidth,
      alive: true, isBeam: true, beamLife: 15, sourceId: mod.id, mk: mod.mk
    }, stats));
    return;
  }

  // Beam weapon (continuous laser) — width scales with MK
  if (def.isBeam) {
    damageEnemy(target, stats.dmg * dmgMult, {
      aura_credits: stats.aura_credits,
      aura_samples: stats.aura_samples,
      ...advancedPayload,
    });
    // Laser width increases with MK (+10% per MK)
    const beamWidth = 3 * (1 + (mod.mk - 1) * 0.12);
    // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
    const laserSpeed = 12000 / (1000 / 16);
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y,
      tx: target.x, ty: target.y,
      targetId: target.id,
      speed: laserSpeed, dmg: 0, color: def.color,
      splash: 0, size: beamWidth, alive: true,
      isBeam: true, beamLife: 8, sourceId: mod.id, mk: mod.mk
    }, stats));
    if (G._fxTier < 2) {
      spawnImpactEffect(target.x, target.y, def.color, 'prism');
      for (let p = 0; p < Math.min(6, mod.mk + 1); p++) {
        pushParticle({x:target.x,y:target.y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:6,maxLife:6,color:def.color,size:3,kind:'flash',drag:.88,gravity:0});
      }
    }
    return;
  }

  // Cone Laser (Éventail) — mini-lasers simultaneous in a cone angle
  if (def.isConeLaser) {
    const laserCount = mod.mk; // 1 to 5 beams based on MK
    const baseAngle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const coneSpread = Math.PI * 0.28; // 50-degree cone
    const hitEnemies = new Set();

    for (let l = 0; l < laserCount; l++) {
      const angleOffset = laserCount === 1 ? 0 : (l / (laserCount - 1) - 0.5) * coneSpread;
      const beamAngle = baseAngle + angleOffset;
      const farX = mod.x + Math.cos(beamAngle) * stats.range;
      const farY = mod.y + Math.sin(beamAngle) * stats.range;

      // Damage closest enemy in this beam line
      forEachEnemyInRange(mod.x, mod.y, stats.range, (e, distSq) => {
        if (hitEnemies.has(e.id)) return;
        const eAngle = Math.atan2(e.y - mod.y, e.x - mod.x);
        let diff = Math.abs(eAngle - beamAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < 0.12) {
          hitEnemies.add(e.id);
          damageEnemy(e, stats.dmg * dmgMult * 0.8, { aura_credits: stats.aura_credits, aura_samples: stats.aura_samples });
          spawnParticle(e.x, e.y, def.color, 3);
        }
      });

      // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
      const laserSpeed = 12000 / (1000 / 16);
      G.projectiles.push(applyProjectileBoosters({
        x: mod.x, y: mod.y, tx: farX, ty: farY,
        speed: laserSpeed, dmg: 0, color: def.color, size: 2.2,
        alive: true, isBeam: true, beamLife: 7, sourceId: mod.id, projectileStyle: 'prism'
      }, stats));
    }
    return;
  }

  // Tesla chain lightning — chain targets scale with MK
  if (def.chainCount) {
    const totalChains = (def.chainCount || 3) + (mod.mk - 1);
    damageEnemy(target, stats.dmg * dmgMult, {
      aura_credits: stats.aura_credits,
      aura_samples: stats.aura_samples,
    });

    const hit = new Set([target.id]);
    let current = target;
    const chainRange = (def.chainRange || 2) * G.CELL;
    for (let c = 0; c < totalChains - 1; c++) {
      const next = findClosestEnemy(current.x, current.y, chainRange, hit);
      if (!next) break;
      hit.add(next.id);
      damageEnemy(next, stats.dmg * 0.65, null);
      // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
      const laserSpeed = 12000 / (1000 / 16);
      G.projectiles.push(applyProjectileBoosters({
        x: current.x, y: current.y,
        tx: next.x, ty: next.y,
        targetId: next.id, speed: laserSpeed, dmg: 0,
        color: '#ddaaff', splash: 0, size: 2.5 + mod.mk * 0.3,
        alive: true, isBeam: true, beamLife: 7, sourceId: mod.id,
        projectileStyle: 'electric',
      }, stats));
      if (G._fxTier < 2) {
        spawnImpactEffect(next.x, next.y, '#ddaaff', 'electric');
        for (let sp = 0; sp < mod.mk; sp++) {
          pushParticle({x:next.x,y:next.y,vx:(Math.random()-.5)*(4+mod.mk),vy:(Math.random()-.5)*(4+mod.mk),life:7,maxLife:7,color:'#ffffff',size:3.5,kind:'flash',drag:.85,gravity:0});
        }
      }
      current = next;
    }

    // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
    const laserSpeed = 12000 / (1000 / 16);
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y,
      tx: target.x, ty: target.y,
      targetId: target.id, speed: laserSpeed, dmg: 0,
      color: def.color, splash: 0, size: 3.5 + mod.mk * 0.4,
      alive: true, isBeam: true, beamLife: 9, sourceId: mod.id,
      projectileStyle: 'electric',
    }, stats));
    if (G._fxTier < 2) {
      spawnImpactEffect(target.x, target.y, def.color, 'electric');
      pushParticle({x:target.x,y:target.y,vx:0,vy:0,life:10,maxLife:10,color:'#ffffff',size:5,kind:'flash',drag:.92,gravity:0});
    }
    return;
  }

  // Sonic (Multiple piercing waves)
  if (def.isSonic) {
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const farX = mod.x + Math.cos(angle) * stats.range;
    const farY = mod.y + Math.sin(angle) * stats.range;
    const waveSize = 25 + mod.mk * 6; 
    
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y, tx: farX, ty: farY, targetId: target.id,
      speed: 8, dmg: stats.dmg * dmgMult, color: def.color, splash: 0, size: waveSize,
      alive: true, isPiercing: true, isSonicWave: true, piercedIds: new Set(), sourceId: mod.id, angle: angle, mk: mod.mk
    }, stats));
    return;
  }

  // Laser Bolt (Ricochet) — actual laser beams jumping between targets (bounces = 1 + MK)
  if (def.isLaserBolt) {
    const maxBounces = 1 + mod.mk; // MK1 = 2, MK5 = 6 bounces
    damageEnemy(target, stats.dmg * dmgMult, null);
    // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
    const laserSpeed = 12000 / (1000 / 16);
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y, tx: target.x, ty: target.y, speed: laserSpeed, dmg: 0, color: def.color,
      size: 3 + mod.mk * 0.4, alive: true, isBeam: true, beamLife: 8, sourceId: mod.id, projectileStyle: 'prism'
    }, stats));
    
    const hitIds = new Set([target.id]);
    let fromX = target.x, fromY = target.y;
    let bouncesLeft = maxBounces - 1;
    let bounceCount = 0;
    
    while (bouncesLeft > 0) {
      const next = findClosestEnemy(fromX, fromY, stats.range * 0.85, hitIds);
      if (!next) break;
      
      hitIds.add(next.id);
      bounceCount++;
      const bounceDmg = stats.dmg * dmgMult * (0.85 - bounceCount * 0.05);
      const bx = fromX, by = fromY, nx = next.x, ny = next.y;
      
      // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
      const laserSpeed = 12000 / (1000 / 16);
      // Laser beam bounce stored
      G.projectiles.push(applyProjectileBoosters({
        x: bx, y: by, tx: nx, ty: ny, targetId: next.id,
        speed: laserSpeed, dmg: 0, color: def.color,
        size: Math.max(1.8, 3 - bounceCount * 0.3), alive: true, isBeam: true, beamLife: 7 + bounceCount,
        sourceId: mod.id, projectileStyle: 'prism'
      }, stats));
      damageEnemy(next, bounceDmg, null);
      if (G._fxTier < 2) spawnImpactEffect(nx, ny, def.color, 'prism');
      
      fromX = next.x;
      fromY = next.y;
      bouncesLeft--;
    }
    return;
  }

  // Rayon Gamma — Laser normal qui marque l'ennemi, explosion en lasers à sa mort
  if (def.isGamma) {
    // Tirer un laser normal vers la cible
    const laserSpeed = (12000 / (1000 / 16)) / 2; // Vitesse divisée par 2
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y, tx: target.x, ty: target.y,
      speed: laserSpeed, dmg: stats.dmg * dmgMult, color: def.color,
      size: 2.5, alive: true, isBeam: true, beamLife: 8,
      sourceId: mod.id, targetId: target.id, projectileStyle: 'toxic', isGammaLaser: true
    }, stats));
    
    // Marquer l'ennemi pour l'explosion à sa mort
    target.gammaCharge = Math.min(10, (target.gammaCharge || 0) + 1);
    target.gammaModLvl = Math.min(35, mod.level * mod.mk);
    target.gammaSourceId = mod.id;
    
    return;
  }

  // Cryo Multi-Target
  if (def.slowFactor) {
    const targets = [];
    forEachEnemyInRange(mod.x, mod.y, stats.range, (e, distSq) => {
      if (e.alive) targets.push({ e, distSq });
    });
    targets.sort((a,b) => a.distSq - b.distSq);
    const maxTargets = 2 + mod.mk + Math.floor(mod.level / 4);
    for (let i = 0; i < Math.min(targets.length, maxTargets); i++) {
       const t = targets[i].e;
       const aim = getSpreadAim(mod, t, stats, .65);
       G.projectiles.push({
          x: mod.x, y: mod.y, tx: aim.x, ty: aim.y, targetId: t.id, ballistic:true,
          speed: 12, dmg: stats.dmg * dmgMult, color: def.color,
          splash: 0, size: 4, alive: true, sourceId: mod.id,
          slowFactor: stats.slowFactor, slowDuration: stats.slowDuration || 3000
       });
    }
    return;
  }

  // Railgun
  if (def.isRailgun) {
    const angle = getSpreadAim(mod, target, stats, .5).angle;
    const farX = mod.x + Math.cos(angle) * stats.range;
    const farY = mod.y + Math.sin(angle) * stats.range;
    
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y, tx: farX, ty: farY, targetId: null, speed: 25, dmg: stats.dmg * dmgMult,
      color: def.color, splash: 0, size: 6 + mod.level * 0.2 + mod.mk * 0.8, alive: true,
      isRailgunProj: true, piercedIds: new Set(), sourceId: mod.id, angle: angle, mk: mod.mk
    }, stats));
    return;
  }

  // Flamethrower
  if (def.isFlamethrower) {
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const coneAngle = (Math.PI / 4) / (1 + (mod.level - 1) * 0.05);
    forEachEnemyInRange(mod.x, mod.y, stats.range, (e, distSq) => {
       const d = Math.sqrt(distSq);
       if (d < stats.range) {
          const ea = Math.atan2(e.y - mod.y, e.x - mod.x);
          let diff = Math.abs(ea - angle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < coneAngle) {
             damageEnemy(e, stats.dmg * dmgMult, {aura_credits: stats.aura_credits, aura_samples: stats.aura_samples});
          }
       }
    });
    // Laser speed: 2 seconds for 400 cells = 12000 pixels/sec
    const laserSpeed = 12000 / (1000 / 16);
    G.projectiles.push(applyProjectileBoosters({
      x:mod.x, y:mod.y,
      tx:mod.x + Math.cos(angle) * stats.range,
      ty:mod.y + Math.sin(angle) * stats.range,
      angle, coneAngle, range:stats.range, color:def.color,
      speed: laserSpeed, size:5 + mod.mk, alive:true, isBeam:true, isFlameJet:true, beamLife:5,
      sourceId:mod.id, projectileStyle:'ember'
    }, stats));
    const sparks = G._fxTier >= 2 ? 1 : G._fxTier === 1 ? 2 : 4 + mod.mk;
    for (let i = 0; i < sparks; i++) {
      const fa = angle + (Math.random() - 0.5) * coneAngle * 1.5;
      const d = stats.range * (0.25 + Math.random() * 0.65);
      spawnImpactEffect(mod.x + Math.cos(fa) * d, mod.y + Math.sin(fa) * d, i % 2 ? '#ff6a1a' : '#ffd166', 'ember');
    }
    return;
  }

  // Blackhole / Singularité
  if (def.isBlackhole) {
    // Projectile perçant traverse 150 cases (9000px) en 5 secondes (312.5 frames)
    const travelDistance = 150 * G.CELL; // 150 cases
    const travelTime = 5000; // 5 secondes
    const speed = travelDistance / (travelTime / 16); // pixels per frame (16ms)
    const lifeFrames = travelTime / 16; // frames
    
    const angle = Math.atan2(target.y - mod.y, target.x - mod.x);
    const farX = mod.x + Math.cos(angle) * travelDistance;
    const farY = mod.y + Math.sin(angle) * travelDistance;
    
    G.projectiles.push(applyProjectileBoosters({
      x: mod.x, y: mod.y, tx: farX, ty: farY,
      speed: speed, dmg: stats.dmg * dmgMult, color: '#000000', size: 40 + mod.mk * 5,
      alive: true, isBlackholeProj: true, life: lifeFrames, sourceId: mod.id,
      isPiercing: true, piercingCount: 999, maxLife: lifeFrames, piercedIds: new Set(),
      projectileStyle: 'blackhole', haloColor: '#4400aa', haloSize: 35 + mod.mk * 5
    }, stats));
    return;
  }

  // Missile logic (ALL missile turrets fire salvo scaled by mod.mk)
  if (def.isMissile) {
    const isSwarm = def.isSwarmMissile;
    const isHyper = def.isHyperMissile;

    // Nuée de missiles : salves avec cooldown
    if (isSwarm) {
      const markCount = target.gammaCharge || 0;
      const totalMissiles = 12 + markCount * 6; // 12 par défaut, +6 par mark
      const missilesPerSide = totalMissiles / 2; // 6 de chaque côté par défaut
      const burstDuration = 3000; // 3 secondes pour la salve
      const cooldownDuration = 8000; // 8 secondes de cooldown

      // Vérifier le cooldown
      if (mod.swarmCooldown && now - mod.swarmCooldown < cooldownDuration) {
        return;
      }

      // Initialiser la salve si nécessaire
      if (!mod.swarmBurstStart || now - mod.swarmBurstStart > burstDuration + cooldownDuration) {
        mod.swarmBurstStart = now;
        mod.swarmMissilesFired = 0;
      }

      // Calculer combien de missiles tirer cette frame
      const timeInBurst = now - mod.swarmBurstStart;
      const missilesToFire = Math.min(totalMissiles, Math.floor(timeInBurst / (burstDuration / totalMissiles)) - mod.swarmMissilesFired);

      if (missilesToFire <= 0) {
        // Fin de la salve, démarrer le cooldown
        if (mod.swarmMissilesFired >= totalMissiles && !mod.swarmCooldown) {
          mod.swarmCooldown = now;
        }
        return;
      }

      for (let m = 0; m < missilesToFire; m++) {
        const side = mod.swarmMissilesFired % 2 === 0 ? 1 : -1;
        const directAngle = getSpreadAim(mod, target, stats, 1.1).angle;
        const launchAngle = directAngle + side * (Math.PI * 0.35 + (Math.random() - .5) * .22);
        const muzzleOffset = Math.max(10, G.CELL * .22);

        const mProj = {
          x: mod.x + Math.cos(launchAngle) * muzzleOffset,
          y: mod.y + Math.sin(launchAngle) * muzzleOffset,
          tx: target.x, ty: target.y,
          targetId: target.id, ballistic: true,
          speed: 3.5, maxSpeed: 7.5, turnRate: 0.055,
          dmg: (stats.dmg * dmgMult) / totalMissiles,
          color: def.color,
          splash: def.splash || 0,
          size: 3,
          alive: true, sourceId: mod.id,
          isMissile: true, isSwarmMissile: true,
          launchSide: side, age: 0, life: 10000,
          trailClock: 0, trail: [{x:mod.x, y:mod.y}],
          angle: launchAngle,
          aura_credits: stats.aura_credits,
          aura_samples: stats.aura_samples,
          ...advancedPayload,
        };
        G.projectiles.push(applyProjectileBoosters(mProj, stats));
        mod.swarmMissilesFired++;
      }
      return;
    }

    // Torpille : tir direct, 1 par 1 avec délai
    if (isHyper) {
      const markCount = target.gammaCharge || 0;
      const torpedoCount = 1 + markCount; // 1 par défaut, +1 par mark
      const delayBetween = 3000; // 3 secondes entre chaque torpille

      // MK5 = rangée cône 30°
      if (mod.mk === 5) {
        const coneAngle = Math.PI / 6; // 30 degrés
        const baseAngle = Math.atan2(target.y - mod.y, target.x - mod.x);
        
        for (let i = 0; i < torpedoCount; i++) {
          const offset = torpedoCount === 1 ? 0 : (i / (torpedoCount - 1) - 0.5) * coneAngle;
          const angle = baseAngle + offset;
          const muzzleOffset = Math.max(10, G.CELL * .22);

          const mProj = {
            x: mod.x + Math.cos(angle) * muzzleOffset,
            y: mod.y + Math.sin(angle) * muzzleOffset,
            tx: mod.x + Math.cos(angle) * stats.range,
            ty: mod.y + Math.sin(angle) * stats.range,
            ballistic: false, // Tir direct, pas de tracking
            speed: 1.8,
            dmg: stats.dmg * dmgMult,
            color: def.color,
            splash: def.splash || 0,
            size: 7 + mod.mk, // Taille augmentée
            alive: true, sourceId: mod.id,
            isMissile: true, isHyperMissile: true,
            age: 0, life: 10000,
            angle: angle,
            aura_credits: stats.aura_credits,
            aura_samples: stats.aura_samples,
            ...advancedPayload,
          };
          G.projectiles.push(applyProjectileBoosters(mProj, stats));
        }
        return;
      }

      // Normal hyper missile (MK1-4) : tir direct vers cible, 1 par 1
      if (!mod.hyperLastFire || now - mod.hyperLastFire >= delayBetween) {
        mod.hyperLastFire = now;
        mod.hyperFiredCount = (mod.hyperFiredCount || 0) + 1;
        
        if (mod.hyperFiredCount > torpedoCount) {
          mod.hyperFiredCount = 1; // Reset après avoir tiré toutes les torpilles
        }

        const directAngle = Math.atan2(target.y - mod.y, target.x - mod.x);
        const muzzleOffset = Math.max(10, G.CELL * .22);

        const mProj = {
          x: mod.x + Math.cos(directAngle) * muzzleOffset,
          y: mod.y + Math.sin(directAngle) * muzzleOffset,
          tx: target.x, ty: target.y,
          ballistic: false, // Tir direct
          speed: 1.8,
          dmg: stats.dmg * dmgMult,
          color: def.color,
          splash: def.splash || 0,
          size: 7 + mod.mk,
          alive: true, sourceId: mod.id,
          isMissile: true, isHyperMissile: true,
          age: 0, life: 10000,
          angle: directAngle,
          aura_credits: stats.aura_credits,
          aura_samples: stats.aura_samples,
          ...advancedPayload,
        };
        G.projectiles.push(applyProjectileBoosters(mProj, stats));
      }
      return;
    }

    // Standard missile (non-swarm, non-hyper)
    const baseCount = 1;
    const missileCount = baseCount * mod.mk;
    for (let m = 0; m < missileCount; m++) {
      const launchSide = (m % 2 === 0 ? 1 : -1) * (1 + Math.floor(m / 2) * 0.3);
      const directAngle = getSpreadAim(mod, target, stats, 1.1).angle;
      const launchAngle = directAngle + launchSide * (Math.PI * 0.35 + (Math.random() - .5) * .22);
      const muzzleOffset = Math.max(10, G.CELL * .22);

      const pSize = def.splash ? 5 : 3;
      const pSpeed = 2.2;
      const maxSpd = 5.5;
      const tRate = 0.034;

      const mProj = {
        x: mod.x + Math.cos(launchAngle) * muzzleOffset,
        y: mod.y + Math.sin(launchAngle) * muzzleOffset,
        tx: target.x, ty: target.y,
        targetId: target.id, ballistic: true,
        speed: pSpeed, maxSpeed: maxSpd, turnRate: tRate,
        dmg: (stats.dmg * dmgMult) / (1 + (missileCount - 1) * 0.15),
        color: def.color,
        splash: def.splash || 0,
        size: pSize,
        alive: true, sourceId: mod.id,
        isMissile: true,
        launchSide: launchSide, age: 0, life: 10000,
        trailClock: 0, trail: [{x:mod.x, y:mod.y}],
        angle: launchAngle,
        aura_credits: stats.aura_credits,
        aura_samples: stats.aura_samples,
        ...advancedPayload,
      };
      G.projectiles.push(applyProjectileBoosters(mProj, stats));
    }
    return;
  }

  // Standard projectile
  const standardAim = getSpreadAim(mod,target,stats);
  const proj = {
    x: mod.x, y: mod.y,
    tx: standardAim.x, ty: standardAim.y,
    targetId: target.id, ballistic:true,
    speed: def.splash ? 6 : 9,
    dmg: stats.dmg * dmgMult,
    color: def.color,
    splash: def.splash || 0,
    size: def.splash ? 5 : 3,
    alive: true, sourceId: mod.id,
    aura_credits: stats.aura_credits,
    aura_samples: stats.aura_samples,
    clusterCount: def.clusterCount || 0,
    ...advancedPayload,
  };

  // Mortar: slower, arcing
  if (def.isMortar) {
    proj.isMortar = true;
    proj.speed = 3.5;
    proj.startPoint = {x: mod.x, y: mod.y};
    proj.totalDist = Math.hypot(target.x - mod.x, target.y - mod.y);
    proj.mortarLvl = mod.level;
  }

  G.projectiles.push(applyProjectileBoosters(proj));
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

    // Smart mines persist in the world until a target crosses their trigger.
    if (p.isMine) {
      p.life -= dt;
      p.armTime -= dt;
      if (p.life <= 0) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
        continue;
      }
      const victim = p.armTime <= 0 ? findClosestEnemy(p.x, p.y, p.triggerRadius) : null;
      if (victim) {
        forEachEnemyInRange(p.x, p.y, p.splash, (e, distSq) => {
          const falloff = Math.max(0.25, 1 - Math.sqrt(distSq) / p.splash);
          damageEnemy(e, p.dmg * falloff, p);
        });
        spawnExplosion(p.x, p.y, p.color);
        spawnParticle(p.x, p.y, '#ffffff', 20);
        G.projectiles.push({
          x:p.x, y:p.y, tx:p.x, ty:p.y, alive:true, speed:0, dmg:0,
          color:p.color, size:2, isShockwave:true, shockRadius:0,
          maxShockRadius:p.splash, shockLife:24
        });
        p.alive = false;
      }
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
        forEachEnemyInRange(p.x, p.y, p.size + 48, (e, distSq) => {
          const hitRadius = p.size + e.size;
          if (e.alive && distSq < hitRadius * hitRadius) {
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
        forEachEnemyInRange(p.x, p.y, p.splash, (e, distSq) => {
           const d = Math.sqrt(distSq);
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
        forEachEnemyInRange(p.x, p.y, p.size, e => {
          if (e.alive) {
            damageEnemy(e, p.dmg * (dt/16) * 0.1, p);
          }
        });
        if (Math.random() < 0.3) {
           spawnParticle(p.x + (Math.random()-0.5)*p.size, p.y + (Math.random()-0.5)*p.size, Math.random() > 0.5 ? '#ff3300' : '#ffaa00', 1);
        }
      }
      continue;
    }

    // Blackhole / Singularité logic - Projectile perçant massif
    if (p.isBlackholeProj) {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      
      // Décrémenter la vie à chaque frame
      p.life--;
      
      // Avancer vers la cible
      if (d > p.speed) {
        p.x += dx / d * p.speed * (dt / 16);
        p.y += dy / d * p.speed * (dt / 16);
      }
      
      // Disparition si vie écoulée ou arrivé à destination
      if (p.life <= 0 || d <= p.speed) {
        spawnExplosion(p.x, p.y, '#330066');
        spawnExplosion(p.x, p.y, '#aa00ff');
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
        continue;
      }
      
      // Dégâts perçants sur tous les ennemis traversés
      const hitRadius = p.size || 30; // Hitbox proportionnelle à la taille visuelle
      forEachEnemyInRange(p.x, p.y, hitRadius, (e, distSq) => {
        if (e.alive && !p.piercedIds.has(e.id)) {
          const dist = Math.sqrt(distSq);
          if (dist < hitRadius) {
            damageEnemy(e, p.dmg, p);
            p.piercedIds.add(e.id);
            spawnParticle(e.x, e.y, '#aa00ff', 4);
          }
        }
      });
      
      // Effet visuel halo (réduit pour lag)
      if (Math.random() < 0.05) {
        spawnParticle(p.x, p.y, '#330066', 3);
      }
      
      continue;
    }

    // Enemy projectiles target modules
    if (p.isEnemyProjectile) {
      const tgt = getModuleById(p.targetModuleId);
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
    const target = getEnemyById(p.targetId);
    if (target && !p.ballistic && !p.isPiercing && !p.isMissile && !p.isRicochetBounce) { p.tx = target.x; p.ty = target.y; }

    // Ricochet bounce trail
    if (p.isRicochetBounce && Math.random() < 0.5) {
      spawnParticle(p.x, p.y, p.color, 1);
    }

    // Missile Homing
    if (p.isMissile) {
      p.age = (p.age || 0) + dt;
      p.life = (p.life || 10000) - dt;
      if (p.life <= 0) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
        continue;
      }
      let activeTarget = target;
      if (!activeTarget || !activeTarget.alive) {
        const retgt = findClosestEnemy(p.x, p.y, 450);
        if (retgt) { p.targetId = retgt.id; activeTarget = retgt; }
      }
      if (activeTarget && activeTarget.alive) {
        p.tx = activeTarget.x; p.ty = activeTarget.y;
        const targetAngle = Math.atan2(p.ty - p.y, p.tx - p.x);
        // Fast responsive homing arc: acquire target quickly with tight turn rate
        const acquire = Math.min(1, Math.max(0, (p.age - 30) / 400));
        const desiredAngle = targetAngle + (p.launchSide || 1) * (1 - acquire) * 0.25;
        let diff = desiredAngle - p.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const maxTurn = (p.turnRate || 0.034) * (0.6 + acquire * 0.8) * (dt / 16);
        p.angle += Math.sign(diff) * Math.min(Math.abs(diff), maxTurn);
        p.speed = Math.min(p.speed + 0.035 * (dt / 16), p.maxSpeed || 5.5);
      }
      p.x += Math.cos(p.angle) * p.speed * (dt / 16);
      p.y += Math.sin(p.angle) * p.speed * (dt / 16);
      p.trailClock = (p.trailClock || 0) + dt;
      if (p.trailClock >= 42) {
        p.trailClock = 0;
        if (!p.trail) p.trail = [];
        p.trail.push({x:p.x,y:p.y});
        if (p.trail.length > 18) p.trail.shift();
      }
      if (Math.random() < (G._fxTier >= 2 ? 0.08 : G._fxTier === 1 ? 0.18 : 0.34)) {
        spawnParticle(p.x - Math.cos(p.angle)*5, p.y - Math.sin(p.angle)*5, '#ff8800', 1);
      }

      if (Math.hypot(p.tx - p.x, p.ty - p.y) < p.speed + 2) {
        p.alive = false;
        const last = G.projectiles.pop();
        if (i < G.projectiles.length) G.projectiles[i] = last;
        
        // Grosse explosion avec particules pour les missiles
        const explosionSize = p.isHyperMissile ? 2 : 1.5;
        const particleCount = p.isHyperMissile ? 18 : 12;
        
        // Explosion principale
        spawnExplosion(p.tx, p.ty, p.color, 'missile');
        
        // Explosions secondaires pour effet plus impressionnant
        for(let j = 0; j < 3; j++) {
          const offsetX = (Math.random() - 0.5) * 30 * explosionSize;
          const offsetY = (Math.random() - 0.5) * 30 * explosionSize;
          spawnExplosion(p.tx + offsetX, p.ty + offsetY, p.color);
        }
        
        // Particules supplémentaires
        for(let k = 0; k < particleCount; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          pushParticle({
            x: p.tx, y: p.ty,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 25 + Math.random() * 20,
            maxLife: 45,
            color: k % 2 === 0 ? p.color : '#ff8800',
            size: 3 + Math.random() * 4,
            kind: k % 3 === 0 ? 'shard' : 'spark',
            drag: 0.92,
            gravity: 0.02
          });
        }
        
        // Shockwave pour les gros missiles
        if (p.isHyperMissile || p.splash > 0) {
          G.projectiles.push({
            x: p.tx, y: p.ty, tx: p.tx, ty: p.ty,
            speed: 0, dmg: 0, color: p.color, size: 1,
            alive: true, isShockwave: true, shockRadius: 0,
            maxShockRadius: (p.splash || 80) * 1.2, shockLife: 25
          });
        }
        
        const missileSplashR = p.splash * G.CELL;
        forEachEnemyInRange(p.tx, p.ty, missileSplashR, e => {
          if (e.alive) {
            damageEnemy(e, p.dmg, p);
          }
        });
      }
      continue;
    }

    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);

    // Piercing projectile or Railgun slug
    if (p.isPiercing || p.isRailgunProj) {
      const hitRadius = p.size * 2 + 40; // Hitbox proportionnelle à la taille visuelle
      forEachEnemyInRange(p.x, p.y, hitRadius, (e, distSq) => {
        if (!e.alive || p.piercedIds.has(e.id)) return;
        // Sonic waves and Railgun sont plus larges
        const hitRad = (p.isSonicWave || p.isRailgunProj) ? e.size + p.size * 1.5 : e.size + p.size;
        if (distSq < hitRad * hitRad) {
          p.piercedIds.add(e.id);
          damageEnemy(e, p.dmg, p);
          spawnImpactEffect(e.x, e.y, p.color, p.projectileStyle || 'shard');
          
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
    const hitDistance = p.speed * (dt / 16) + p.size * 0.5; // Hitbox proportionnelle à la taille
    if (d <= hitDistance) {
      p.alive = false;
      const last = G.projectiles.pop();
      if (i < G.projectiles.length) G.projectiles[i] = last;
      
      if (p.splash > 0) {
        const splashR = p.splash * G.CELL * 0.5;
        forEachEnemyInRange(p.tx, p.ty, splashR, (e, distSq) => {
          const sd = Math.sqrt(distSq);
          if (sd < splashR) {
            damageEnemy(e, p.dmg * (1 - sd / (splashR + 1)), p);
          }
        });
        spawnExplosion(p.tx, p.ty, p.color, p.projectileStyle);

        if (p.clusterCount > 0) {
          const clusterTargets = [];
          forEachEnemyInRange(p.tx, p.ty, splashR * 2.2, (e, distSq) => clusterTargets.push({e, distSq}));
          clusterTargets.sort((a,b) => a.distSq - b.distSq);
          for (let c = 0; c < Math.min(p.clusterCount, clusterTargets.length); c++) {
            const hit = clusterTargets[c].e;
            damageEnemy(hit, p.dmg * 0.38, p);
            spawnExplosion(hit.x, hit.y, p.color);
          }
        }
        
        if (p.isMortar) {
          G.projectiles.push({
            x: p.tx, y: p.ty, tx: p.tx, ty: p.ty, targetId: null,
            speed: 0, dmg: p.dmg * 0.2, color: '#ff6600', size: splashR,
            alive: true, isFireZone: true, life: 180 + (p.mortarLvl || 1) * 20, sourceId: p.sourceId
          });
        }
      } else if (target) {
        damageEnemy(target, p.dmg, p);
        spawnImpactEffect(p.tx, p.ty, p.color, p.projectileStyle || 'pulse');
      }
    } else {
      p.x += dx / d * p.speed * (dt / 16);
      p.y += dy / d * p.speed * (dt / 16);
    }
  }
}
