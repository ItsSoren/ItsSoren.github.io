// ============================================================
// CESTUS CONTROL — Patrol Unit System
// Mobile defense units spawned by Patrol modules
// ============================================================

function updatePatrolUnits(dt, now) {
  const unitCounts = new Map();
  for (let i = 0; i < G.patrolUnits.length; i++) {
    const unit = G.patrolUnits[i];
    if (unit.alive) unitCounts.set(unit.ownerId, (unitCounts.get(unit.ownerId) || 0) + 1);
  }

  // Spawn patrol units from patrol modules
  G.modules.forEach(mod => {
    if (!mod.alive) return;
    const def = MODULE_TYPES[mod.typeId];
    if (!def.isPatrol) return;

    const type = def.patrolType || 'basic';
    const maxUnits = type === 'heavy' ? 5 : 10;
    const myUnitCount = unitCounts.get(mod.id) || 0;

    if (myUnitCount < maxUnits && now - mod.patrolSpawnTimer > CONFIG.PATROL_SPAWN_INTERVAL) {
      mod.patrolSpawnTimer = now;
      const lvMult = 1 + (mod.level - 1) * 0.06;
      const mkMult = mod.mk >= 2 ? 1.5 : 1;
      
      let uHp, uDmg, uSpd, uRng, uAtk, uCol;
      if (type === 'heavy') {
        uHp = 150; uDmg = 75; uSpd = 1.0; uRng = 3.0 * G.CELL; uAtk = 800; uCol = '#ff3333';
      } else if (type === 'support') {
        uHp = 80; uDmg = 5; uSpd = 2.0; uRng = 4.0 * G.CELL; uAtk = 1000; uCol = '#33ffaa';
      } else {
        uHp = 50; uDmg = 25; uSpd = 2.5; uRng = 4.5 * G.CELL; uAtk = 400; uCol = '#00ffaa';
      }

      G.patrolUnits.push({
        id: Date.now() + Math.random(),
        ownerId: mod.id,
        type: type,
        color: uCol,
        x: mod.x, y: mod.y,
        hp: uHp * lvMult * mkMult,
        maxHp: uHp * lvMult * mkMult,
        dmg: uDmg * lvMult * mkMult,
        speed: uSpd,
        range: uRng,
        attackRate: uAtk,
        lastAttack: 0,
        alive: true,
        angle: Math.random() * Math.PI * 2,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolRadius: (2 + Math.random() * 3) * G.CELL,
        target: null,
        flash: 0,
        trail: [],
      });
      showFloatingText(mod.x, mod.y - 30, '+UNITÉ', uCol);
    }
  });

  // Build owner cache once per frame
  const ownerMap = new Map();
  G.modules.forEach(m => { if (m.alive) ownerMap.set(m.id, m); });

  // Update each patrol unit
  for (let i = G.patrolUnits.length - 1; i >= 0; i--) {
    const u = G.patrolUnits[i];
    if (!u.alive) continue;
    u.flash = Math.max(0, u.flash - 1);

    // Check if owner still alive (cached lookup)
    const owner = ownerMap.get(u.ownerId);
    if (!owner) { u.alive = false; continue; }

    // Find nearby enemy
    const closestEnemy = findClosestEnemy(u.x, u.y, u.range);

    if (u.type === 'support') {
      // Find nearby damaged module to heal
      let closestMod = null, minD = Infinity;
      for (const m of G.modules) {
        if (!m.alive || m.hp >= m.maxHp) continue;
        const d = Math.hypot(m.x - u.x, m.y - u.y);
        if (d < u.range && d < minD) { minD = d; closestMod = m; }
      }

      if (G._mouseDown && G.mouseWorld) {
        u.patrolAngle += 0.015 * (dt / 16);
        const targetX = G.mouseWorld.x + Math.cos(u.patrolAngle) * u.patrolRadius;
        const targetY = G.mouseWorld.y + Math.sin(u.patrolAngle) * u.patrolRadius;
        const dx = targetX - u.x;
        const dy = targetY - u.y;
        const d = Math.hypot(dx, dy);
        if (d > 5) {
          u.x += dx / d * u.speed * 1.5 * (dt / 16);
          u.y += dy / d * u.speed * 1.5 * (dt / 16);
          u.angle = Math.atan2(dy, dx);
        }
        if (closestMod && Math.hypot(closestMod.x - u.x, closestMod.y - u.y) < u.range) {
           if (now - u.lastAttack > u.attackRate) {
             u.lastAttack = now;
             closestMod.hp = Math.min(closestMod.maxHp, closestMod.hp + u.dmg * 5); // Heal amount
             spawnParticle(closestMod.x, closestMod.y, u.color, 2);
             u.flash = 4;
           }
        }
      } else if (closestMod) {
        // Chase and heal
        const dx = closestMod.x - u.x;
        const dy = closestMod.y - u.y;
        const d = Math.hypot(dx, dy);
        u.angle = Math.atan2(dy, dx);

        if (d > G.CELL * 0.5) {
          u.x += dx / d * u.speed * 1.5 * (dt / 16);
          u.y += dy / d * u.speed * 1.5 * (dt / 16);
        }

        if (d < G.CELL * 0.8 && now - u.lastAttack > u.attackRate) {
          u.lastAttack = now;
          closestMod.hp = Math.min(closestMod.maxHp, closestMod.hp + u.dmg * 5);
          spawnParticle(closestMod.x, closestMod.y, u.color, 2);
          u.flash = 4;
        }
      } else {
        // Patrol around owner
        u.patrolAngle += 0.008 * (dt / 16);
        const targetX = owner.x + Math.cos(u.patrolAngle) * u.patrolRadius;
        const targetY = owner.y + Math.sin(u.patrolAngle) * u.patrolRadius;
        const dx = targetX - u.x;
        const dy = targetY - u.y;
        const d = Math.hypot(dx, dy);
        if (d > 5) {
          u.x += dx / d * u.speed * (dt / 16);
          u.y += dy / d * u.speed * (dt / 16);
          u.angle = Math.atan2(dy, dx);
        }
      }
    } else {
      // Offensive patrol drones (basic, heavy)
      if (G._mouseDown && G.mouseWorld) {
        u.patrolAngle += 0.015 * (dt / 16);
        const targetX = G.mouseWorld.x + Math.cos(u.patrolAngle) * u.patrolRadius;
        const targetY = G.mouseWorld.y + Math.sin(u.patrolAngle) * u.patrolRadius;
        const dx = targetX - u.x;
        const dy = targetY - u.y;
        const d = Math.hypot(dx, dy);
        if (d > 5) {
          u.x += dx / d * u.speed * 1.5 * (dt / 16);
          u.y += dy / d * u.speed * 1.5 * (dt / 16);
          u.angle = Math.atan2(dy, dx);
        }
        if (closestEnemy && Math.hypot(closestEnemy.x - u.x, closestEnemy.y - u.y) < u.range) {
           if (now - u.lastAttack > u.attackRate) {
             u.lastAttack = now;
             damageEnemy(closestEnemy, u.dmg, null);
             spawnParticle(closestEnemy.x, closestEnemy.y, u.color, 2);
             u.flash = 4;
           }
        }
      } else if (closestEnemy) {
        // Chase and attack
        const dx = closestEnemy.x - u.x;
        const dy = closestEnemy.y - u.y;
        const d = Math.hypot(dx, dy);
        u.angle = Math.atan2(dy, dx);

        if (d > G.CELL * 0.5) {
          u.x += dx / d * u.speed * 1.5 * (dt / 16);
          u.y += dy / d * u.speed * 1.5 * (dt / 16);
        }

        if (d < G.CELL * 0.8 && now - u.lastAttack > u.attackRate) {
          u.lastAttack = now;
          damageEnemy(closestEnemy, u.dmg, null);
          spawnParticle(closestEnemy.x, closestEnemy.y, u.color, 2);
          u.flash = 4;
        }
      } else {
        // Patrol around owner
        u.patrolAngle += 0.008 * (dt / 16);
        const targetX = owner.x + Math.cos(u.patrolAngle) * u.patrolRadius;
        const targetY = owner.y + Math.sin(u.patrolAngle) * u.patrolRadius;
        const dx = targetX - u.x;
        const dy = targetY - u.y;
        const d = Math.hypot(dx, dy);
        if (d > 5) {
          u.x += dx / d * u.speed * (dt / 16);
          u.y += dy / d * u.speed * (dt / 16);
          u.angle = Math.atan2(dy, dx);
        }
      }
    }

    // Trail
    u.trail.push({ x: u.x, y: u.y, life: 15 });
    if (u.trail.length > 8) u.trail.shift();
    let trailWrite = 0;
    for (let t = 0; t < u.trail.length; t++) {
      const point = u.trail[t];
      point.life--;
      if (point.life > 0) u.trail[trailWrite++] = point;
    }
    u.trail.length = trailWrite;

    // Check if hit by enemies (enemies can damage patrol units)
    const collisionR = G.CELL * 0.4;
    forEachEnemyInRange(u.x, u.y, collisionR, e => {
      if (e.alive) {
        u.hp -= e.dmg * 0.1 * (dt / 16);
        if (u.hp <= 0) {
          u.alive = false;
          spawnExplosion(u.x, u.y, '#00ffaa');
        }
      }
    });
  }

  let unitWrite = 0;
  for (let i = 0; i < G.patrolUnits.length; i++) {
    if (G.patrolUnits[i].alive) G.patrolUnits[unitWrite++] = G.patrolUnits[i];
  }
  G.patrolUnits.length = unitWrite;
}
