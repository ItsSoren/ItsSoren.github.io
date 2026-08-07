// ============================================================
// CESTUS CONTROL — Energy System
// ============================================================

function recalcEnergy() {
  let production = 0;
  let consumption = 0;
  let capacitorBoost = 1;
  
  let oilProduction = 0;
  let oilConsumption = 0;

  // Calculate capacitor boost first (affects production)
  const capacitorBoostByCell = new Map();
  for (const mod of G.modules) {
    if (!mod.alive) continue;
    const def = MODULE_TYPES[mod.typeId];
    if (!def?.isEnergyCapacitor) continue;
    const boost = def.energyBoost || 0.15;
    const mkMult = ({1:1,2:1.2,3:1.4,4:1.6,5:1.8})[mod.mk] || 1;
    const levelMult = 1 + (mod.level - 1) * 0.05;
    const totalBoost = boost * mkMult * levelMult;
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const key = (mod.gx + dx) + ',' + (mod.gy + dy);
      capacitorBoostByCell.set(key, (capacitorBoostByCell.get(key) ?? 1) * (1 + totalBoost));
    }
  }

  // Calculate production and consumption
  G.modules.forEach(m => {
    if (!m.alive) return;
    const def = MODULE_TYPES[m.typeId];
    
    // Energy Production
    if (def.isEnergyProducer || def.isCore) {
      const baseProd = def.energyProduction || 0;
      const mkMult = ({1:1,2:1.3,3:1.7,4:2.2,5:2.8})[m.mk] || 1;
      const levelMult = 1 + (m.level - 1) * 0.08;
      const capBoost = capacitorBoostByCell.get(m.gx + ',' + m.gy) ?? 1;
      production += baseProd * mkMult * levelMult * capBoost;
    }
    
    // Energy Consumption
    if (def.energyConsumption) {
      const baseCons = def.energyConsumption || 0;
      const mkMult = ({1:1,2:1.15,3:1.3,4:1.5,5:1.7})[m.mk] || 1;
      const levelMult = 1 + (m.level - 1) * 0.05;
      consumption += baseCons * mkMult * levelMult;
    }
    
    // Oil Production - use computed stats for proper scaling
    if (def.isOilProducer) {
      const stats = getModuleStats(m);
      oilProduction += stats.oilProd || 0;
    }
    
    // Oil Consumption
    if (def.oilConsumption) {
      const baseOilCons = def.oilConsumption || 0;
      const mkMult = ({1:1,2:1.15,3:1.3,4:1.5,5:1.7})[m.mk] || 1;
      const levelMult = 1 + (m.level - 1) * 0.05;
      oilConsumption += baseOilCons * mkMult * levelMult;
    }
  });

  // Apply upgrade bonus
  const upgEnergyBonus = 1 + (upgradeLevels['u_energy'] || 0) * 0.10;
  production *= upgEnergyBonus;

  G.totalEnergyProduction = production;
  G.totalEnergyConsumption = consumption;
  G.energySurplus = production - consumption;
  G.energyRatio = consumption > 0 ? production / consumption : 2;
  
  G.totalOilProduction = oilProduction;
  G.totalOilConsumption = oilConsumption;
  G.oilSurplus = oilProduction - oilConsumption;

  // Update UI
  const energyWarn = document.getElementById('energyWarn');
  if (energyWarn) energyWarn.style.display = (production < consumption && consumption > 0) ? 'block' : 'none';

  const fill = document.getElementById('hudEnergyFill');
  if (fill) {
    const pct = consumption > 0 ? Math.min(100, production / consumption * 100) : 100;
    fill.style.width = pct + '%';
    fill.dataset.state = production < consumption ? 'critical' : production < consumption * 1.2 ? 'warning' : 'stable';
  }

  const gridState = document.getElementById('energyGridState');
  const gridDetail = document.getElementById('energyGridDetail');
  if (gridState) {
    gridState.textContent = production < consumption ? 'DÉFICIT' : production < consumption * 1.2 ? 'STABLE' : 'SURPLUS';
    gridState.dataset.state = production < consumption ? 'critical' : production < consumption * 1.2 ? 'warning' : 'stable';
  }
  if (gridDetail) gridDetail.textContent = `${Math.round(production)} prod · ${Math.round(consumption)} cons · ${Math.max(0, Math.round(production-consumption))} surplus`;

  // Update overclock button
  const btn = document.getElementById('overclockBtn');
  if (btn) {
    if (G.overclockPhase === 'active') {
        btn.classList.add('active');
        btn.classList.remove('penalty');
        btn.style.opacity = '1';
        btn.textContent = '⚠ SURCHARGE ⚠';
    } else if (G.overclockPhase === 'discharge') {
        btn.classList.remove('active');
        btn.classList.add('penalty');
        btn.style.opacity = '0.8';
        btn.textContent = `DÉCHARGE (${Math.ceil(G.overclockDischarge / 1000)}s)`;
    } else if (G.overclockPhase === 'cooldown') {
        btn.classList.remove('active');
        btn.classList.remove('penalty');
        btn.style.opacity = '0.5';
        btn.textContent = `RECHARGE (${Math.ceil(G.overclockCooldown / 1000)}s)`;
    } else {
        btn.classList.remove('active');
        btn.classList.remove('penalty');
        btn.style.opacity = production > consumption ? '1' : '0.5';
        btn.textContent = production > consumption ? '⚡ SURCHARGE' : '⚡ SURCHARGE (DÉFICIT)';
    }
  }

  // Invalidate module stats to apply debuffs
  if (typeof invalidateAllModuleStats === 'function') invalidateAllModuleStats();
}

function cycleEnergyPolicy() {
  if (!G || G.over) return;
  const modes = ['eco','balanced','assault'];
  G.energyPolicy = modes[(modes.indexOf(G.energyPolicy) + 1) % modes.length];
  invalidateAllModuleStats();
  recalcEnergy();
  showNotif(G.energyPolicy === 'eco' ? 'RÉSEAU ÉCO — consommation -18%, puissance -10%' : G.energyPolicy === 'assault' ? 'RÉSEAU ASSAUT — puissance +10%, consommation +18%' : 'RÉSEAU ÉQUILIBRÉ', 'notif-xp');
}

function getEnergyRatio() {
  if (G.usedEnergy === 0) return 2;
  return G.totalEnergy / G.usedEnergy;
}

function toggleOverclock() {
  if (G.overclockPhase === 'cooldown' || G.overclockPhase === 'discharge') return;
  
  // Only allow overclock if production > consumption
  if (G.totalEnergyProduction <= G.totalEnergyConsumption) {
    showNotif("SURCHARGE IMPOSSIBLE — DÉFICIT ÉNERGÉTIQUE", "notif-boss");
    return;
  }
  
  if (G.overclockPhase === 'idle') {
    G.overclockPhase = 'active';
    G.overclockActive = true;
    if (typeof invalidateAllModuleStats === 'function') invalidateAllModuleStats();
    showNotif("SURCHARGE ÉNERGÉTIQUE ACTIVÉE !", "notif-warn");
  } else if (G.overclockPhase === 'active') {
    startDischarge();
  }
  recalcEnergy();
}

function startDischarge() {
    G.overclockActive = false;
    G.overclockPhase = 'discharge';
    // Duration: up to 10s depending on heat
    G.overclockDischarge = Math.max(1000, (G.overclockHeat / 100) * 10000);
    if (typeof invalidateAllModuleStats === 'function') invalidateAllModuleStats();
    showNotif("⚠ DÉCHARGE ÉNERGÉTIQUE — SYSTÈME INSTABLE", "notif-boss");
    recalcEnergy();
}

function updateEnergy(dt) {
  if (!G) return;
  
  // Oil accumulation
  if (G.oilSurplus > 0) {
    G.oil = Math.min(G.maxOil, G.oil + G.oilSurplus * (dt / 1000));
  } else if (G.oilSurplus < 0 && G.oil > 0) {
    G.oil = Math.max(0, G.oil + G.oilSurplus * (dt / 1000));
  }
  
  if (G.overclockPhase === 'active') {
    const ratio = G.energyRatio || 1;
    const durBonus = 1 + (G.bonus.ocDuration || 0) * 0.01;
    // Heat gain depends on energy surplus - more surplus = slower heat gain
    const surplusFactor = Math.max(0.5, Math.min(1.5, ratio));
    const heatGain = (0.075 / surplusFactor / durBonus) * (dt / 16);
    G.overclockHeat = Math.min(100, G.overclockHeat + heatGain);
    
    if (G.overclockHeat >= 100) {
      startDischarge();
    }
  } else if (G.overclockPhase === 'discharge') {
    G.overclockDischarge -= dt;
    if (G.overclockDischarge <= 0) {
        G.overclockPhase = 'cooldown';
        // Cooldown duration depends on energy surplus - more surplus = faster cooldown
        const surplusFactor = Math.max(0.3, Math.min(1.5, G.energyRatio || 1));
        G.overclockCooldown = (G.overclockHeat / 100) * 30000 / surplusFactor;
        showNotif("RECHARGE DU SYSTÈME", "notif-info");
        recalcEnergy();
    } else {
        if (Math.floor(G.now / 500) !== Math.floor((G.now - dt) / 500)) recalcEnergy();
    }
  } else if (G.overclockPhase === 'cooldown') {
    // Cooldown speed depends on energy surplus - more surplus = faster cooldown
    const surplusFactor = Math.max(0.5, Math.min(2.0, G.energyRatio || 1));
    G.overclockCooldown -= dt * surplusFactor;
    if (G.overclockCooldown <= 0) {
      G.overclockPhase = 'idle';
      G.overclockHeat = 0;
      if (typeof invalidateAllModuleStats === 'function') invalidateAllModuleStats();
      showNotif("SURCHARGE PRÊTE !", "notif-levelup");
      recalcEnergy();
    } else {
        if (Math.floor(G.now / 1000) !== Math.floor((G.now - dt) / 1000)) recalcEnergy();
    }
  }

  const heatBar = document.getElementById('overclockHeatBar');
  if (heatBar) {
    let pct = 0;
    if (G.overclockPhase === 'active') {
        pct = G.overclockHeat;
        heatBar.style.backgroundColor = (G.overclockHeat > 75) ? '#ff6600' : (G.overclockHeat > 40 ? '#ffcc00' : '#00f5ff');
    } else if (G.overclockPhase === 'discharge') {
        pct = (G.overclockDischarge / 10000) * 100;
        heatBar.style.backgroundColor = '#ff0044';
    } else if (G.overclockPhase === 'cooldown') {
        pct = Math.min(100, (G.overclockCooldown / 30000) * 100);
        heatBar.style.backgroundColor = '#00ff88';
    }
    heatBar.style.width = pct + '%';
  }

  updateOverclockTooltip();
}

function updateOverclockTooltip() {
  const tt = document.getElementById('overclockTooltip');
  if (!tt) return;

  const pwrMult = 1 + (G.bonus.ocPower || 0) * 0.01;
  const durBonus = 1 + (G.bonus.ocDuration || 0) * 0.01;
  
  let html = `<div class="tooltip-title">Système de Surcharge</div>`;
  
  if (G.overclockPhase === 'active') {
    html += `<div style="color:var(--neon-orange);margin-bottom:8px;">ÉTAT: SURCHARGE ACTIVE</div>`;
  } else if (G.overclockPhase === 'discharge') {
    html += `<div style="color:var(--neon-red);margin-bottom:8px;">ÉTAT: DÉCHARGE (PÉNALITÉ)</div>`;
  } else if (G.overclockPhase === 'cooldown') {
    html += `<div style="color:var(--neon-green);margin-bottom:8px;">ÉTAT: RÉCUPÉRATION</div>`;
  } else {
    html += `<div style="color:var(--text-dim);margin-bottom:8px;">ÉTAT: PRÊT</div>`;
  }

  html += `<div class="tooltip-row"><span>Bonus Cadence</span><span class="tooltip-val">+${(100 * pwrMult).toFixed(0)}%</span></div>`;
  html += `<div class="tooltip-row"><span>Bonus Dégâts</span><span class="tooltip-val">+${(50 * pwrMult).toFixed(0)}%</span></div>`;
  html += `<div class="tooltip-row"><span>Bonus Portée</span><span class="tooltip-val">+${(20 * pwrMult).toFixed(0)}%</span></div>`;
  html += `<div class="tooltip-row"><span>Efficacité Durée</span><span class="tooltip-val">x${durBonus.toFixed(2)}</span></div>`;
  
  if (G.overclockPhase === 'discharge') {
    html += `<div class="tooltip-row" style="margin-top:8px;border-top:1px solid rgba(255,0,0,0.2);padding-top:4px;">
      <span style="color:var(--neon-red)">ÉNERGIE MAX</span><span class="tooltip-val negative">-80%</span>
    </div>`;
  }

  tt.innerHTML = html;
}

function getOverclockBonus() {
  let bonus = 0;
  
  const ratio = getEnergyRatio();
  if (ratio > 1.0) {
    bonus += (ratio - 1) * 0.2; 
  }
  
  if (G.overclockPhase === 'active') {
    // Power bonus: base 1.0 is increased
    const pwrMult = 1 + (G.bonus.ocPower || 0) * 0.01;
    bonus += 1.0 * pwrMult; 
  }
  
  return bonus;
}
