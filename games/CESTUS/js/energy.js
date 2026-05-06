// ============================================================
// CESTUS CONTROL — Energy System
// ============================================================

function recalcEnergy() {
  let base = 100;
  let used = 0;
  const upgEnergyBonus = 1 + (upgradeLevels['u_energy'] || 0) * 0.10;

  G.modules.forEach(m => {
    if (!m.alive) return;
    const stats = getModuleStats(m);
    if (stats.energyProd > 0) base += stats.energyProd * upgEnergyBonus;
    else {
      const def = MODULE_TYPES[m.typeId];
      if (def.energy > 0) used += def.energy;
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

  if (typeof invalidateAllModuleStats === 'function') invalidateAllModuleStats();
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
