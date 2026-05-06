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
  recalcEnergy();
  return mod;
}

function getUpgradeMultipliers() {
  let dmg=0, hp=0, range=0, fireRate=0, xpGain=0, creditGain=0, regenAll=0, energyProd=0;
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
    }
  });
  return { dmg, hp, range, fireRate, xpGain, creditGain, regenAll, energyProd };
}

function computeModuleStats(mod) {
  const def = MODULE_TYPES[mod.typeId];
  const upg = getUpgradeMultipliers();
  const sp = G.bonus;
  const overclock = getOverclockBonus();

  let aura_dmg=0, aura_fire=0, aura_hp=0, aura_credits=0, aura_samples=0, aura_range=0;
  G.modules.forEach(m2 => {
    if (!m2.alive || m2 === mod) return;
    if (!isAdjacent(mod, m2)) return;
    const def2 = MODULE_TYPES[m2.typeId];
    const mkMult2 = m2.mk >= 2 ? (1 + (m2.mk-1)*0.5) : 1;
    const adjLvMult = (1 + (m2.level - 1) * 0.15) * mkMult2;

    if (def2.isAmplifier) {
      aura_dmg  += (def2.aura?.dmg     || 0) * adjLvMult;
      aura_fire += (def2.aura?.fireRate || 0) * adjLvMult;
    }
    if (def2.isCollector) {
      aura_credits += (def2.aura?.credits || 0) * adjLvMult;
      aura_samples += (def2.aura?.samples || 0) * adjLvMult;
    }
    if (def2.isShield) {
      aura_hp += (def2.aura?.hp || 0) * adjLvMult;
    }
    if (def2.isRangeBoost) {
      aura_range += (def2.aura?.range || 0) * adjLvMult;
    }
  });

  const lvlMult = 1 + (mod.level - 1) * 0.08;
  const mkMults = { 1: 1, 2: 1.5, 3: 2.2, 4: 3.2, 5: 4.5 };
  const mkMult = mkMults[mod.mk] || 1;
  
  const energyRatio = G.totalEnergy > 0 ? G.usedEnergy / G.totalEnergy : 1;
  const energyFactor = Math.min(1, 0.5 + 0.5 * energyRatio);
  let penaltyMult = 1;
  if (energyRatio > 1) {
    const penaltyPercent = energyRatio - 1;
    penaltyMult = Math.max(0.1, 1 - penaltyPercent);
  }

  const dmgMult = lvlMult * mkMult * (1 + upg.dmg + aura_dmg + overclock * 0.5) * (1 + sp.dmg * 0.01) * energyFactor;
  const fireLvlMult = 1 + (mod.level - 1) * 0.02;
  const fireMult = fireLvlMult * (1 + upg.fireRate + aura_fire + overclock) * (1 + sp.speed * 0.01) * energyFactor * penaltyMult;
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

  return {
    dmg:        def.dmg * dmgMult,
    fireRate:   def.fireRate / fireMult,
    range:      def.range * rangeMult * G.CELL,
    maxHp:      Math.floor(def.hp * hpMult),
    aura_credits,
    aura_samples,
    
    // Cryo Slow: 30% reduction (0.7 factor) at MK1, up to 95% reduction (0.05 factor) at MK5
    slowFactor: def.slowFactor ? (0.7 - (0.65 * ((mod.mk - 1) / 4))) : 1,
    slowDuration: def.slowDuration || 3000,
    
    // Support Stats
    creditsPerSec: (def.passiveCredits || 0) * harvestLvMult * supportMkMult * supportSpeedMult,
    healRate:      (def.healRate || 0) * supportLvMult * supportMkMult * supportSpeedMult,
    energyProd:    (def.isReactor ? Math.min(150, Math.abs(def.energy) * supportLvMult * supportMkMult) : 0),
    replicatorSec: def.isReplicator ? (45 / (supportLvMult * supportMkMult * supportSpeedMult)) : 0,
    patrolRate:    CONFIG.PATROL_SPAWN_INTERVAL / supportSpeedMult,
  };
}

function getModuleStats(mod) {
  if (!mod.cachedStats) mod.cachedStats = computeModuleStats(mod);
  return mod.cachedStats;
}

function invalidateAllModuleStats() {
  if (!G || !G.modules) return;
  G.modules.forEach(m => m.cachedStats = null);
}

function getModuleLevelUpCost(mod) {
  const base = 50 + (mod.mk - 1) * 30;
  // Reduced scaling to make max level achievable.
  const mult = 1.15 + (mod.mk - 1) * 0.03;
  return Math.floor(base * Math.pow(mult, mod.level - 1));
}

function getMKUpgradeCost(mk) {
  const costs = { 1: 5, 2: 15, 3: 35, 4: 75 };
  return costs[mk] || 999;
}

function getModuleTotalCost(mod) {
  const def = MODULE_TYPES[mod.typeId];
  let creds = def.cost.credits || 0;
  let samps = def.cost.samples || 0;
  
  const baseC = 50 + (mod.mk - 1) * 30;
  const multC = 1.3 + (mod.mk - 1) * 0.1;
  for (let l = 1; l < mod.level; l++) {
    creds += Math.floor(baseC * Math.pow(multC, l - 1));
  }
  
  for (let m = 1; m < mod.mk; m++) {
    samps += getMKUpgradeCost(m);
    const mBase = 50 + (m - 1) * 30;
    const mMult = 1.3 + (m - 1) * 0.1;
    for (let l = 1; l < CONFIG.MAX_LEVEL; l++) {
      creds += Math.floor(mBase * Math.pow(mMult, l - 1));
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
  const refundC = Math.floor(cost.credits * 0.5);
  const refundS = Math.floor(cost.samples * 0.5);
  
  G.credits += refundC;
  G.samples += refundS;
  
  if (typeof spawnExplosion === 'function') spawnExplosion(mod.x, mod.y, '#ffffff');
  G.modules.splice(idx, 1);
  recalcEnergy();
  if (typeof hideModuleInfo === 'function') hideModuleInfo();
  showNotif(`Module vendu (+¢${refundC} 🔬${refundS})`, 'notif-xp');
  if (typeof updateHUD === 'function') updateHUD();
}

function levelUpModule(id) {
  const mod = G.modules.find(m => m.id == id);
  if (!mod || !mod.alive) return;
  if (mod.level >= CONFIG.MAX_LEVEL) {
    showNotif('Niveau maximum ! Passez en MK2.', 'notif-warn');
    return;
  }
  const cost = getModuleLevelUpCost(mod);
  if (G.credits < cost) { showNotif('Crédits insuffisants !', 'notif-warn'); return; }
  G.credits -= cost;
  mod.level++;
  invalidateAllModuleStats();
  const stats = getModuleStats(mod);
  mod.hp = Math.min(stats.maxHp, mod.hp + stats.maxHp * 0.1);
  mod.maxHp = stats.maxHp;
  recalcEnergy();
  showNotif(`${MODULE_TYPES[mod.typeId].name} → Nv.${mod.level}`, 'notif-xp');
  updateModuleInfo(mod);
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

  // Regen: heal adjacent modules
  if (now - G.lastRegenTick > 1000) {
    G.lastRegenTick = now;
    const upgRegen = (upgradeLevels['u_regen'] || 0) * 0.2;

    G.modules.forEach(m => {
      if (!m.alive) return;
      const stats = getModuleStats(m);
      if (stats.healRate > 0) {
        let totalHeal = stats.healRate + upgRegen;
        G.modules.forEach(m2 => {
          if (!m2.alive || !isAdjacent(m, m2)) return;
          m2.hp = Math.min(m2.maxHp, m2.hp + totalHeal);
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
