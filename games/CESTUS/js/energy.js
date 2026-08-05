// ============================================================
// CESTUS CONTROL — Energy System
// ============================================================

function recalcEnergy() {
  let base = 100;
  let used = 0;
  const previousRatio = G.totalEnergy > 0 ? G.usedEnergy / G.totalEnergy : 0;
  const upgEnergyBonus = 1 + (upgradeLevels['u_energy'] || 0) * 0.10;

  // Pre-index relay influence once. This used to scan the full base for every
  // module, which became extremely expensive on the giant late-game layouts.
  const relayFactorByCell = new Map();
  for (const relay of G.modules) {
    if (!relay.alive) continue;
    const relayDef = MODULE_TYPES[relay.typeId];
    if (!relayDef?.isEnergyRelay) continue;
    const discount = Math.min(.9, (relayDef.adjacencyEnergyDiscount || 0) * (1 + (relay.level - 1) * .025));
    const relayFactor = Math.max(.1, 1 - discount);
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const key = (relay.gx + dx) + ',' + (relay.gy + dy);
      relayFactorByCell.set(key, (relayFactorByCell.get(key) ?? 1) * relayFactor);
    }
  }

  G.modules.forEach(m => {
    if (!m.alive) return;
    const def = MODULE_TYPES[m.typeId];
    if (def.isReactor) {
      const supportLvMult = 1 + (m.level - 1) * .15;
      const mkMult = ({1:1,2:1.4,3:1.9,4:2.6,5:3.5})[m.mk] || 1;
      base += Math.abs(def.energy) * supportLvMult * mkMult * upgEnergyBonus;
    }
    if (def.baseEnergy) base += def.baseEnergy * (1 + (m.level - 1) * .08) * (1 + (m.mk - 1) * .25);
    if (def.energy > 0) {
      const relayFactor = relayFactorByCell.get(m.gx + ',' + m.gy) ?? 1;
      const policyUse = G.energyPolicy === 'eco' ? .82 : G.energyPolicy === 'assault' ? 1.18 : 1;
      used += def.energy * Math.max(.08, relayFactor) * policyUse;
    }
  });

  // PENALTY PHASE: Reduce max energy by 80% during discharge
  if (G.overclockPhase === 'discharge') {
    base *= 0.2;
  }

  G.totalEnergy = base;
  G.usedEnergy = used;

  const ratio = used > 0 ? base / used : 2;
  const energyWarn = document.getElementById('energyWarn');
  const overclockInfo = document.getElementById('overclockInfo');

  if (energyWarn) energyWarn.style.display = (ratio < 1.0 && used > 0) ? 'block' : 'none';

  const fill = document.getElementById('hudEnergyFill');
  if (fill) {
    fill.style.width = Math.min(100, used / Math.max(1, base) * 100) + '%';
    fill.dataset.state = used > base ? 'critical' : used > base * .82 ? 'warning' : 'stable';
  }
  const gridState = document.getElementById('energyGridState');
  const gridDetail = document.getElementById('energyGridDetail');
  if (gridState) {
    gridState.textContent = used > base ? 'SURCHARGE' : used > base * .82 ? 'SOUS TENSION' : 'STABLE';
    gridState.dataset.state = used > base ? 'critical' : used > base * .82 ? 'warning' : 'stable';
  }
  if (gridDetail) gridDetail.textContent = `${Math.round(base)} réserve · ${Math.round(used)} charge · ${Math.max(0, Math.round(base-used))} libre`;
  const policyBtn = document.getElementById('energyPolicyBtn');
  if (policyBtn) policyBtn.textContent = G.energyPolicy === 'eco' ? 'MODE ÉCO' : G.energyPolicy === 'assault' ? 'MODE ASSAUT' : 'MODE ÉQUILIBRÉ';

  if (overclockInfo) {
    if (ratio > 1.0 && used > 0) {
      const overPct = (ratio - 1) * 100;
      const overclockBonus = Math.floor(overPct / 5);
      if (overclockBonus > 0) {
        overclockInfo.style.display = 'block';
        const valEl = document.getElementById('overclockVal');
        if (valEl) valEl.textContent = '+' + overclockBonus + '%';
      } else {
        overclockInfo.style.display = 'none';
      }
    } else {
      overclockInfo.style.display = 'none';
    }
  }

  // Update button state
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
        btn.style.opacity = '1';
        btn.textContent = '⚡ SURCHARGE';
    }
  }

  const nextRatio = base > 0 ? used / base : 0;
  if (Math.abs(nextRatio - previousRatio) > .002 && typeof invalidateAllModuleStats === 'function') invalidateAllModuleStats();
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
  
  if (G.overclockPhase === 'idle') {
    G.overclockPhase = 'active';
    G.overclockActive = true;
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
    showNotif("⚠ DÉCHARGE ÉNERGÉTIQUE — SYSTÈME INSTABLE", "notif-boss");
    recalcEnergy();
}

function updateEnergy(dt) {
  if (!G) return;
  
  if (G.overclockPhase === 'active') {
    const ratio = getEnergyRatio();
    const durBonus = 1 + (G.bonus.ocDuration || 0) * 0.01;
    const heatGain = ((ratio < 1.0 ? 0.2 : 0.075) / durBonus) * (dt / 16);
    G.overclockHeat = Math.min(100, G.overclockHeat + heatGain);
    
    if (G.overclockHeat >= 100) {
      startDischarge();
    }
  } else if (G.overclockPhase === 'discharge') {
    G.overclockDischarge -= dt;
    if (G.overclockDischarge <= 0) {
        G.overclockPhase = 'cooldown';
        G.overclockCooldown = (G.overclockHeat / 100) * 30000;
        showNotif("RECHARGE DU SYSTÈME", "notif-info");
        recalcEnergy();
    } else {
        if (Math.floor(G.now / 500) !== Math.floor((G.now - dt) / 500)) recalcEnergy();
    }
  } else if (G.overclockPhase === 'cooldown') {
    G.overclockCooldown -= dt;
    if (G.overclockCooldown <= 0) {
      G.overclockPhase = 'idle';
      G.overclockHeat = 0;
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
        pct = (G.overclockCooldown / 30000) * 100;
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
