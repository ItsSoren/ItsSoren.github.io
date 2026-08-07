// ============================================================
// CESTUS CONTROL — Module System
// Placement, stats, level-up, MK2, auras
// ============================================================

function placeModule(typeId, gx, gy) {
  const def = MODULE_TYPES[typeId];
  if (!def) return null;
  const wp = worldPos(gx, gy);
  const mod = {
    id: Date.now() + Math.random(),
    typeId, gx, gy,
    x: wp.x, y: wp.y,
    hp: def.hp, maxHp: def.hp,
    lastFire: 0, target: null, targetId: null,
    angle: 0, alive: true, flash: 0,
    level: 1, mk: 1, burstAnim: 0,
    rampDmgMult: 1.0,
    lastRampTarget: null,
    patrolSpawnTimer: 0,
  };
  G.modules.push(mod);
  invalidateAllModuleStats();
  recalcEnergy();
  return mod;
}

function getUpgradeMultipliers() {
  let dmg=0, hp=0, range=0, fireRate=0, xpGain=0, creditGain=0, regenAll=0, energyProd=0, accuracy=0;
  UPGRADE_DEFS.forEach(u => {
    const lv = upgradeLevels[u.id] || 0;
    if (!lv) return;
    const val = u.value * lv;
    switch(u.effect) {
      case 'dmg': dmg += val; break;
      case 'hp': hp += val; break;
      case 'range': range += val; break;
      case 'fireRate': fireRate += val; break;
      case 'xpGain': xpGain += val; break;
      case 'creditGain': creditGain += val; break;
      case 'regenAll': regenAll += val; break;
      case 'energyProd': energyProd += val; break;
      case 'accuracy': accuracy += val; break;
    }
  });
  return { dmg, hp, range, fireRate, xpGain, creditGain, regenAll, energyProd, accuracy };
}

function computeModuleStats(mod) {
  const def = MODULE_TYPES[mod.typeId];
  const upg = getUpgradeMultipliers();
  const sp = G.bonus;
  const overclock = getOverclockBonus();

  let aura_dmg=0, aura_fire=0, aura_hp=0, aura_credits=0, aura_samples=0, aura_range=0, aura_accuracy=0, aura_projectileSize=0, aura_projectileDmg=0, aura_projectileAoE=0;
  
  // Check all modules for aura effects within their MK-based range
  for (const m2 of G.modules) {
    if (!m2.alive || m2 === mod) continue;
    
    const def2 = MODULE_TYPES[m2.typeId];
    if (!def2.aura) continue;
    
    // Calculate aura range based on MK: base range + (MK - 1)
    const baseAuraRange = def2.range || 1.5;
    const auraRangeInCells = baseAuraRange + (m2.mk - 1);
    
    // Check if mod is >90% within m2's aura range
    // Module must be mostly inside: distance <= auraRangeInCells - 0.5
    const dx = Math.abs(mod.gx - m2.gx);
    const dy = Math.abs(mod.gy - m2.gy);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= auraRangeInCells - 0.5) {
      const mkMult2 = m2.mk >= 2 ? (1 + (m2.mk-1)*0.5) : 1;
      const adjLvMult = (1 + (m2.level - 1) * 0.15) * mkMult2;

      if (def2.aura.dmg) aura_dmg += (def2.aura.dmg || 0) * adjLvMult;
      if (def2.aura.fireRate) aura_fire += (def2.aura.fireRate || 0) * adjLvMult;
      if (def2.aura.credits) aura_credits += (def2.aura.credits || 0) * adjLvMult;
      if (def2.aura.samples) aura_samples += (def2.aura.samples || 0) * adjLvMult;
      if (def2.aura.hp) {
        const hpAura = def2.aura.hp;
        aura_hp += (hpAura > 5 ? hpAura / 100 : hpAura) * adjLvMult;
      }
      if (def2.aura.range) aura_range += (def2.aura.range || 0) * adjLvMult;
      if (def2.aura.accuracy) aura_accuracy += (def2.aura.accuracy || 0) * adjLvMult;
      if (def2.aura.projectileSize) aura_projectileSize += (def2.aura.projectileSize || 0) * adjLvMult;
      if (def2.aura.projectileDmg) aura_projectileDmg += (def2.aura.projectileDmg || 0) * adjLvMult;
      if (def2.aura.projectileAoE) aura_projectileAoE += (def2.aura.projectileAoE || 0) * adjLvMult;
    }
  }

  // Every adjacent support contributes. Accuracy remains naturally bounded by
  // the minimum projectile spread in the final stat calculation below.

  const lvlMult = 1 + (mod.level - 1) * 0.055;
  const mkMults = { 1: 1, 2: 1.4, 3: 1.9, 4: 2.6, 5: 3.5 };
  const mkMult = mkMults[mod.mk] || 1;
  
  // New energy system: production vs consumption
  const energyRatio = G.energyRatio || 1; // production / consumption
  let penaltyMult = 1;
  if (energyRatio < 1) {
    // Consumption > production: apply debuff from 1% to 99%
    // At ratio 0.5 (50% deficit), penalty is ~50%
    const deficitPercent = 1 - energyRatio;
    penaltyMult = Math.max(0.01, 1 - deficitPercent * 0.99);
  }
  
  // Oil system: similar penalty for oil deficit
  const oilRatio = G.totalOilProduction > 0 ? G.totalOilProduction / Math.max(1, G.totalOilConsumption) : 1;
  let oilPenaltyMult = 1;
  if (oilRatio < 1 && def.oilConsumption) {
    // Oil deficit: apply debuff for modules that consume oil
    const oilDeficitPercent = 1 - oilRatio;
    oilPenaltyMult = Math.max(0.01, 1 - oilDeficitPercent * 0.99);
  }
  
  // Combine penalties (multiply them)
  const combinedPenalty = penaltyMult * oilPenaltyMult;

  const policyPower = G.energyPolicy === 'assault' ? 1.10 : G.energyPolicy === 'eco' ? .90 : 1;

  const dmgMult = lvlMult * mkMult * (1 + upg.dmg + aura_dmg + overclock * 0.5) * (1 + sp.dmg * 0.01) * policyPower * combinedPenalty;
  const fireLvlMult = 1 + (mod.level - 1) * 0.02;
  const fireMult = fireLvlMult * (1 + upg.fireRate + aura_fire + overclock) * (1 + sp.speed * 0.01) * policyPower * combinedPenalty;
  const hpMult   = lvlMult * mkMult * (1 + upg.hp + aura_hp) * (1 + sp.hp * 0.01);
  const rangeLvlMult = 1 + (mod.level - 1) * 0.01;
  const rangeMult = rangeLvlMult * (1 + upg.range * 0.1 + aura_range + overclock * 0.2);

  // Support Scaling
  // Harvester gets 20% per level to be profitable
  const harvestLvMult = 1 + (mod.level - 1) * 0.20;
  // Other support gets 15% per level
  const supportLvMult = 1 + (mod.level - 1) * 0.15;
  const supportMkMult = mkMult; // Use same MK scale as offensive

  // Support modules are boosted by fire rate aura (Amplifier/Overclock)
  const supportSpeedMult = (1 + aura_fire + overclock);

  const isSupportModule = def.category === 'support' || def.isAmplifier || def.isShield || def.isCollector || def.isRangeBoost || def.isRegen || def.isPoisonAura || !def.isShooter;
  const baseSupportRange = def.range || 1.5;
  const rangeInCells = isSupportModule ? (baseSupportRange + (mod.mk - 1)) : (def.range || 4);
  const calculatedRange = isSupportModule ? (rangeInCells * G.CELL * (1 + aura_range)) : (def.range * rangeMult * G.CELL);

  return {
    dmg:        def.dmg * dmgMult,
    fireRate:   def.fireRate / fireMult,
    range:      calculatedRange,
    maxHp:      Math.floor(def.hp * hpMult),
    aura_credits,
    aura_samples,
    spread: Math.max(0, (def.spread === undefined ? (def.isMissile || def.isMortar ? .055 : def.isRailgun ? .018 : def.isShooter && !def.isBeam ? .035 : 0) : def.spread) *
      Math.max(.12, 1 - (mod.level - 1) * .018 - (mod.mk - 1) * .12 - (upg.accuracy || 0) - aura_accuracy)),
    accuracy: 1 - Math.max(0, (def.spread || .035) * Math.max(.12, 1 - (upg.accuracy || 0) - aura_accuracy)),
    
    // Projectile booster stats (for projectile_booster module)
    // Size/AoE: 10% at level 1 MK1 to 200% at level 33 MK5, +20% per MK
    // Dmg: 1% at level 1 MK1 to 20% at level 33 MK5
    projectileSize: def.isProjectileBooster ? (0.10 + (mod.level - 1) * 0.058 + (mod.mk - 1) * 0.20) * aura_projectileSize : 0,
    projectileDmg: def.isProjectileBooster ? (0.01 + (mod.level - 1) * 0.006) * aura_projectileDmg : 0,
    projectileAoE: def.isProjectileBooster ? (0.10 + (mod.level - 1) * 0.058 + (mod.mk - 1) * 0.20) * aura_projectileAoE : 0,
    
    // Multipliers received from projectile_boosters (applied to projectiles)
    projectileSizeMult: 1 + aura_projectileSize,
    projectileDmgMult: 1 + aura_projectileDmg,
    projectileAoEMult: 1 + aura_projectileAoE,
    
    // Cryo Slow: 30% reduction (0.7 factor) at MK1, up to 95% reduction (0.05 factor) at MK5
    slowFactor: def.slowFactor ? (0.7 - (0.65 * ((mod.mk - 1) / 4))) : 1,
    slowDuration: def.slowDuration || 3000,
    
    // Support Stats
    creditsPerSec: (def.passiveCredits || 0) * harvestLvMult * supportMkMult * supportSpeedMult,
    healRate:      (def.healRate || 0) * supportLvMult * supportMkMult * supportSpeedMult,
    energyProd:    (def.isReactor ? Math.min(150, Math.abs(def.energy) * supportLvMult * supportMkMult) : 0),
    oilProd:       (def.isOilProducer ? (def.oilProduction || 0) * supportLvMult * supportMkMult : 0),
    replicatorSec: def.isReplicator ? ((def.replicatorBaseSec || 45) / (supportLvMult * supportMkMult * supportSpeedMult)) : 0,
    patrolRate:    CONFIG.PATROL_SPAWN_INTERVAL / supportSpeedMult,
  };
}

function getModuleStats(mod) {
  if (!mod.cachedStats) mod.cachedStats = computeModuleStats(mod);
  return mod.cachedStats;
}

function invalidateAllModuleStats() {
  if (!G || !G.modules) return;
  if (!(G._moduleCellIndex instanceof Map)) G._moduleCellIndex = new Map();
  else G._moduleCellIndex.clear();
  G.modules.forEach(m => {
    m.cachedStats = null;
    if (m.alive) G._moduleCellIndex.set(m.gx + ',' + m.gy, m);
  });
}

function getModuleLevelCostAt(mk, level) {
  const base = 42 + (mk - 1) * 24;
  const mult = 1.105 + (mk - 1) * 0.018;
  return Math.max(1, Math.floor(base * Math.pow(mult, level - 1) * (BALANCE.moduleUpgradeCost || 1)));
}

function getModuleLevelUpCost(mod) {
  return getModuleLevelCostAt(mod.mk, mod.level);
}

function getModuleBatchQuote(mod, requested) {
  if (!mod || !mod.alive) return { count:0, total:0, affordable:0, affordableTotal:0 };
  const limit = Math.min(CONFIG.MAX_LEVEL, mod.level + Math.max(1, requested || 1));
  let level = mod.level, total = 0, count = 0, affordable = 0, affordableTotal = 0;
  while (level < limit) {
    const cost = getModuleLevelCostAt(mod.mk, level);
    total += cost;
    count++;
    if (affordableTotal + cost <= G.credits) {
      affordableTotal += cost;
      affordable++;
    }
    level++;
  }
  return { count, total, affordable, affordableTotal };
}

function getMKUpgradeCost(mk) {
  const costs = { 1: 5, 2: 15, 3: 35, 4: 75 };
  return costs[mk] || 999;
}

function getModuleTotalCost(mod) {
  const def = MODULE_TYPES[mod.typeId];
  let creds = def.cost.credits || 0;
  let samps = def.cost.samples || 0;
  
  for (let l = 1; l < mod.level; l++) {
    creds += getModuleLevelCostAt(mod.mk, l);
  }
  
  for (let m = 1; m < mod.mk; m++) {
    samps += getMKUpgradeCost(m);
    for (let l = 1; l < CONFIG.MAX_LEVEL; l++) {
      creds += getModuleLevelCostAt(m, l);
    }
  }
  
  return { credits: creds, samples: samps };
}

function sellModule(id) {
  const idx = G.modules.findIndex(m => m.id == id);
  if (idx === -1) return;
  const mod = G.modules[idx];
  if (mod.typeId === 'core') { showNotif('Impossible de vendre le noyau !', 'notif-warn'); return; }
  
  const cost = getModuleTotalCost(mod);
  const refundC = Math.floor(cost.credits * (BALANCE.refundRate || 0.65));
  const refundS = Math.floor(cost.samples * (BALANCE.refundRate || 0.65));
  
  G.credits += refundC;
  G.samples += refundS;
  
  if (typeof spawnExplosion === 'function') spawnExplosion(mod.x, mod.y, '#ffffff');
  G.modules.splice(idx, 1);
  invalidateAllModuleStats();
  recalcEnergy();
  if (typeof hideModuleInfo === 'function') hideModuleInfo();
  showNotif(`Module vendu (+¢${refundC} 🔬${refundS})`, 'notif-xp');
  if (typeof updateHUD === 'function') updateHUD();
}

function finalizeModuleLevelUp(mod, bought) {
  if (!bought) return;
  invalidateAllModuleStats();
  const stats = getModuleStats(mod);
  mod.hp = Math.min(stats.maxHp, mod.hp + stats.maxHp * Math.min(0.35, bought * 0.06));
  mod.maxHp = stats.maxHp;
  recalcEnergy();
  showNotif(`${MODULE_TYPES[mod.typeId].name} → Nv.${mod.level}${bought > 1 ? ' (+' + bought + ')' : ''}`, 'notif-xp');
  updateModuleInfo(mod);
  updateHUD();
  renderTabs();
}

function levelUpModuleBatch(id, requested) {
  const mod = G.modules.find(m => m.id == id);
  if (!mod || !mod.alive) return;
  if (mod.level >= CONFIG.MAX_LEVEL) {
    showNotif('Niveau maximum ! Passez en MK2.', 'notif-warn');
    return;
  }
  let bought = 0;
  const limit = Math.min(CONFIG.MAX_LEVEL, mod.level + Math.max(1, requested || 1));
  while (mod.level < limit) {
    const cost = getModuleLevelUpCost(mod);
    if (G.credits < cost) break;
    G.credits -= cost;
    mod.level++;
    bought++;
  }
  if (!bought) { showNotif('Crédits insuffisants !', 'notif-warn'); return; }
  finalizeModuleLevelUp(mod, bought);
}

function levelUpModule(id) {
  levelUpModuleBatch(id, 1);
}

function levelUpModuleMax(id) {
  levelUpModuleBatch(id, CONFIG.MAX_LEVEL);
}

function getTypeLevelUpCost(typeId) {
  let total = 0, count = 0;
  for (const mod of G.modules) {
    if (!mod.alive || mod.typeId !== typeId || mod.level >= CONFIG.MAX_LEVEL) continue;
    total += getModuleLevelUpCost(mod);
    count++;
  }
  return { total, count };
}

function levelUpSameType(typeId) {
  const quote = getTypeLevelUpCost(typeId);
  if (!quote.count) { showNotif('Tous ces modules sont au niveau maximum.', 'notif-warn'); return; }
  if (G.credits < quote.total) { showNotif(`Il faut ${quote.total} crédits pour améliorer les ${quote.count} modules.`, 'notif-warn'); return; }
  let first = null;
  for (const mod of G.modules) {
    if (!mod.alive || mod.typeId !== typeId || mod.level >= CONFIG.MAX_LEVEL) continue;
    G.credits -= getModuleLevelUpCost(mod);
    mod.level++;
    mod.cachedStats = null;
    first = first || mod;
  }
  invalidateAllModuleStats();
  recalcEnergy();
  showNotif(`${quote.count}× ${MODULE_TYPES[typeId].name} améliorés`, 'notif-xp');
  if (first) updateModuleInfo(G.selectedModule && G.selectedModule.alive ? G.selectedModule : first);
  updateHUD();
  renderTabs();
}

function upgradeMK(id) {
  const mod = G.modules.find(m => m.id == id);
  if (!mod || !mod.alive) return;
  if (mod.level < CONFIG.MAX_LEVEL) return;
  if (mod.mk >= 5) { showNotif('Niveau MK maximum atteint !', 'notif-warn'); return; }
  
  const cost = getMKUpgradeCost(mod.mk);
  if (G.samples < cost) { showNotif(`Échantillons insuffisants (Requis: ${cost})`, 'notif-warn'); return; }
  
  G.samples -= cost;
  mod.mk++;
  mod.level = 1;
  G.moduleLevels[id] = 1;
  G.moduleMK[id] = mod.mk;
  
  invalidateAllModuleStats();
  spawnExplosion(mod.x, mod.y, '#cc66ff');
  showNotif(`Module amélioré au MK${mod.mk} !`, 'notif-samples');
  if (G.selectedModule === mod) updateModuleInfo(mod);
  updateHUD();
}

function updateModulePassives(dt, now) {
  // Harvester: generate passive credits
  if (now - G.lastHarvestTick > 1000) {
    G.lastHarvestTick = now;
    let earned = 0;
    G.modules.forEach(m => {
      if (!m.alive) return;
      const stats = getModuleStats(m);
      if (stats.creditsPerSec > 0) {
        earned += stats.creditsPerSec;
      }
    });
    if (earned > 0) {
      G.credits += Math.floor(earned);
    }
  }

  // Regen: heal modules within MK-based range
  // Interval reduces by 20% every 2 levels of u_regen
  const regenLevel = upgradeLevels['u_regen'] || 0;
  const regenTier = Math.floor(regenLevel / 2);
  const regenInterval = 1000 * Math.pow(0.8, regenTier);
  
  if (now - G.lastRegenTick > regenInterval) {
    G.lastRegenTick = now;
    const upgRegen = regenLevel * 0.2;

    // Apply global regen upgrade to all modules
    if (upgRegen > 0) {
      G.modules.forEach(m => {
        if (!m.alive) return;
        m.hp = Math.min(m.maxHp, m.hp + upgRegen);
        if (m.hp < m.maxHp && Math.random() > 0.8) spawnParticle(m.x, m.y, '#00ff66', 1);
      });
    }

    // Apply module-specific regen (from regen modules)
    G.modules.forEach(m => {
      if (!m.alive) return;
      const stats = getModuleStats(m);
      if (stats.healRate > 0) {
        // Use MK-based range: base range + (MK - 1) cells
        // Module must be >90% within range: distance <= rangeInCells - 0.5
        const def = MODULE_TYPES[m.typeId];
        const baseRange = def.range || 1.5;
        const rangeInCells = baseRange + (m.mk - 1);
        const healRange = (rangeInCells - 0.5) * G.CELL;
        forEachModuleInRange(m.x, m.y, healRange, m2 => {
          if (!m2.alive || m2 === m) return;
          m2.hp = Math.min(m2.maxHp, m2.hp + stats.healRate);
          if (m2.hp < m2.maxHp && Math.random() > 0.8) spawnParticle(m2.x, m2.y, '#00ff66', 1);
        });
      }
    });
  }

  // Replicator: generate samples
  G.modules.forEach(m => {
    if (!m.alive) return;
    const stats = getModuleStats(m);
    if (stats.replicatorSec > 0) {
      if (!m.replicatorTimer) m.replicatorTimer = 0;
      m.replicatorTimer += dt / 1000;
      if (m.replicatorTimer >= stats.replicatorSec) {
        m.replicatorTimer = 0;
        G.samples += 1;
        showFloatingText(m.x, m.y - 40, '+1 ÉCHANTILLON', '#cc66ff');
      }
    }
  });
}
