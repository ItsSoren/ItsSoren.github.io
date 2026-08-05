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
    G.projectiles.push({
      x:target.x, y:target.y, tx:target.x, ty:target.y, alive:true, speed:0,
      dmg:stats.dmg * dmgMult, color:def.color, size:10, isMine:true,
      armTime:450, life:18000, triggerRadius:def.mineTrigger || 55,
      splash:def.mineSplash || 120, ...payload
    });
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
      G.projectiles.push({
        x:mod.x, y:mod.y,
        tx:mod.x + Math.cos(angle) * stats.range,
        ty:mod.y + Math.sin(angle) * stats.range,
        targetId:null, speed:13, dmg:stats.dmg * dmgMult, color:def.color,
        splash:0, size:3, alive:true, isPiercing:true, piercedIds:new Set(),
        angle, ...payload
      });
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
      G.projectiles.push({
        x:mod.x, y:mod.y, tx:t.x, ty:t.y, targetId:t.id,
        speed:11, dmg:stats.dmg * dmgMult, color:def.color, splash:0,
        size:4, alive:true, ...payload
      });
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
      G.projectiles.push({
        x: strongest.x, y: strongest.y, tx: strongest.x, ty: strongest.y,
        speed: 0, dmg: stats.dmg * (1 + getOverclockBonus() * 0.5), color: '#ffcc00', size: 0,
        alive: true, isOrbitalDrop: true, timer: 60, splash: 150, sourceId: mod.id
      });
    }
    return;
  }

  // Find closest enemy in range
  const target = findClosestEnemy(mod.x, mod.y, stats.range);
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

  mod.shotCounter = (mod.shotCounter || 0) + 1;
  if (def.chargeEvery && mod.shotCounter % def.chargeEvery === 0) {
    dmgMult *= def.chargeMult || 4;
    spawnParticle(mod.x, mod.y, '#ffffff', 18);
  }
  const advancedPayload = buildAdvancedPayload(def, mod, stats);
  spawnWeaponSignature(mod, def, advancedPayload, now);
  if (fireAdvancedWeapon(def, mod, target, stats, dmgMult, advancedPayload)) return;

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
      ...advancedPayload,
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
      const next = findClosestEnemy(current.x, current.y, chainRange, hit);
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
      const next = findClosestEnemy(fromX, fromY, stats.range * 0.7, hitIds);
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
    
    // Hyper-velocity kinetic slug
    G.projectiles.push({
      x: mod.x, y: mod.y, tx: farX, ty: farY, targetId: null, speed: 25, dmg: stats.dmg * dmgMult,
      color: def.color, splash: 0, size: 6 + mod.level * 0.2, alive: true,
      isRailgunProj: true, piercedIds: new Set(), sourceId: mod.id, angle: angle
      , ...advancedPayload
    });
    return;
  }

  // Flamethrower — one bounded cone, no duplicate projectile stream.
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
    G.projectiles.push({
      x:mod.x, y:mod.y,
      tx:mod.x + Math.cos(angle) * stats.range,
      ty:mod.y + Math.sin(angle) * stats.range,
      angle, coneAngle, range:stats.range, color:def.color,
      size:5, alive:true, isBeam:true, isFlameJet:true, beamLife:5,
      sourceId:mod.id, projectileStyle:'ember'
    });
    const sparks = G._fxTier >= 2 ? 1 : G._fxTier === 1 ? 2 : 4;
    for (let i = 0; i < sparks; i++) {
      const fa = angle + (Math.random() - 0.5) * coneAngle * 1.5;
      const d = stats.range * (0.25 + Math.random() * 0.65);
      spawnImpactEffect(mod.x + Math.cos(fa) * d, mod.y + Math.sin(fa) * d, i % 2 ? '#ff6a1a' : '#ffd166', 'ember');
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

  // Missile logic
  if (def.isMissile) {
    const launchSide = mod._nextMissileSide === -1 ? -1 : 1;
    mod._nextMissileSide = -launchSide;
    const directAngle = getSpreadAim(mod,target,stats,1.1).angle;
    const launchAngle = directAngle + launchSide * (Math.PI * 0.55 + (Math.random() - .5) * .12);
    const muzzleOffset = Math.max(12, G.CELL * .22);
    proj.isMissile = true;
    proj.x = mod.x + Math.cos(launchAngle) * muzzleOffset;
    proj.y = mod.y + Math.sin(launchAngle) * muzzleOffset;
    proj.speed = 1.8;
    proj.maxSpeed = 4.2;
    proj.turnRate = 0.013;
    proj.launchSide = launchSide;
    proj.age = 0;
    proj.life = 10000;
    proj.trailClock = 0;
    proj.trail = [{x:mod.x,y:mod.y}];
    proj.targetId = target.id;
    proj.tx = target.x; proj.ty = target.y;
    proj.angle = launchAngle;
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

    // Blackhole logic
    if (p.isBlackholeProj) {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      if (d > p.speed) {
        p.x += dx / d * p.speed * (dt / 16);
        p.y += dy / d * p.speed * (dt / 16);
      } else {
        p.life--;
        spawnParticle(p.x, p.y, '#aa00ff', 2);
        forEachEnemyInRange(p.x, p.y, 200, (e, distSq) => {
           const ed = Math.sqrt(distSq) || 1;
           if (ed < 200) {
             const pullSpeed = 2;
             e.x += (p.x - e.x) / ed * pullSpeed * (dt/16);
             e.y += (p.y - e.y) / ed * pullSpeed * (dt/16);
           }
        });
        if (p.life <= 0) {
           spawnExplosion(p.x, p.y, '#330066');
           forEachEnemyInRange(p.x, p.y, 200, e => {
             if (e.alive) damageEnemy(e, p.dmg);
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
        // Wide cinematic arc: leave sideways, then progressively acquire target with gentle turn rate.
        const acquire = Math.min(1, Math.max(0, (p.age - 120) / 1400));
        const desiredAngle = targetAngle + (p.launchSide || 1) * (1 - acquire) * 0.45;
        let diff = desiredAngle - p.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const maxTurn = (p.turnRate || 0.013) * (0.3 + acquire * 0.7) * (dt / 16);
        p.angle += Math.sign(diff) * Math.min(Math.abs(diff), maxTurn);
        p.speed = Math.min(p.speed + 0.022 * (dt / 16), p.maxSpeed || 4.2);
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
        spawnExplosion(p.tx, p.ty, p.color, p.projectileStyle || 'missile');
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
      forEachEnemyInRange(p.x, p.y, p.size + 63, (e, distSq) => {
        if (!e.alive || p.piercedIds.has(e.id)) return;
        // Sonic waves and Railgun are wider
        const hitRad = (p.isSonicWave || p.isRailgunProj) ? e.size + p.size + 15 : e.size + p.size + 5;
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
    if (d <= p.speed * (dt / 16) + 4) {
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
