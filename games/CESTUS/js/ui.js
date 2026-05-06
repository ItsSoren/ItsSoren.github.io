// ============================================================
// CESTUS CONTROL — UI System
// HUD, tabs, shop, upgrades, module info panel, notifications
// ============================================================

// Cached DOM refs
let _hudCache = {};
function hudEl(id) {
  if (!_hudCache[id]) _hudCache[id] = document.getElementById(id);
  return _hudCache[id];
}

function updateHUD() {
  hudEl('hudCredits').textContent = G.credits;
  hudEl('hudSamples').textContent = G.samples;
  hudEl('hudXP').textContent = G.xp + '/' + G.xpNeeded;
  hudEl('hudSP').textContent = G.superPoints;
  hudEl('hudKills').textContent = G.kills;
  hudEl('hudWave').textContent = G.wave;

  const el = hudEl('hudEnergy');
  el.textContent = `${Math.round(G.usedEnergy)} / ${Math.round(G.totalEnergy)}`;
  el.style.color = G.usedEnergy > G.totalEnergy ? 'var(--neon-red)' : G.usedEnergy >= G.totalEnergy * 0.9 ? 'var(--neon-orange)' : 'var(--neon-yellow)';

  if (G.selectedModule && G.selectedModule.alive) updateModuleInfo(G.selectedModule);
}

// ============================================================
// TAB SYSTEM
// ============================================================
function renderTabs() {
  const active = document.querySelector('.tab.active')?.dataset.tab || 'shop';
  renderTab(active);
}

function renderTab(tab) {
  const content = hudEl('tabContent');
  if (!content) return;

  if (tab === 'shop') {
    G.activeShopTab = G.activeShopTab || 'offensive';
    
    // Save scroll position (horizontal scroll)
    const grid = content.querySelector('.card-grid');
    const scrollX = grid ? grid.scrollLeft : 0;
    
    let html = `<div id="shopTabBar" style="display:flex;gap:4px;margin-bottom:8px;border-bottom:1px solid rgba(0,200,255,0.1);padding-bottom:4px;">
      <div class="tab ${G.activeShopTab === 'offensive' ? 'active' : ''}" style="font-size:10px;padding:4px 10px;" onmousedown="G.activeShopTab='offensive'; renderTabs()">ARMEMENT</div>
      <div class="tab ${G.activeShopTab === 'support' ? 'active' : ''}" style="font-size:10px;padding:4px 10px;" onmousedown="G.activeShopTab='support'; renderTabs()">SUPPORT & LOGISTIQUE</div>
    </div><div class="card-grid" style="height: calc(100% - 34px);">`;
    
    Object.entries(MODULE_TYPES).forEach(([typeId, def]) => {
      if (def.category !== G.activeShopTab || typeId === 'core') return;
      const canAfford = G.credits >= def.cost.credits && G.samples >= (def.cost.samples || 0);
      const locked = !def.unlocked;
      const isPlacing = G.placingModule === typeId;
      const cls = locked ? 'locked' : isPlacing ? 'selected' : canAfford ? 'affordable' : '';
      const energyStr = def.energy > 0 ? `-${def.energy}⚡` : def.energy < 0 ? `+${Math.abs(def.energy)}⚡` : '';

      const creditsStr = def.cost.credits > 0 ? `<span class="cost-credits">¢${def.cost.credits}</span>` : '';
      const samplesStr = (def.cost.samples || 0) > 0 ? `<span class="cost-samples">🔬${def.cost.samples}</span>` : '';
      const freeStr = def.cost.credits === 0 && (def.cost.samples || 0) === 0 ? '<span style="color:var(--neon-green)">GRATUIT</span>' : '';
      const costHtml = `<span style="font-weight:bold;margin-left:4px;white-space:nowrap;">[${creditsStr}${creditsStr&&samplesStr?' ':''}${samplesStr}${freeStr}]</span>`;

      html += `<div class="shop-card ${cls}" onmousedown="handleShopClick('${typeId}')">
        <div class="card-name" style="color:${locked ? 'var(--text-dim)' : def.color}">${def.name}</div>
        <span class="card-icon">${def.icon}</span>
        <div class="card-desc">${def.desc}${costHtml}</div>
        ${locked ? '<div class="locked-overlay"><span style="font-size: 24px; margin-bottom: 4px;">🔒</span><br>VERROUILLÉ</div>' : ''}
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
    
    // Restore scroll position (horizontal)
    const newGrid = content.querySelector('.card-grid');
    if (newGrid) newGrid.scrollLeft = scrollX;
  }

  else if (tab === 'upgrades') {
    let html = '<div class="upgrade-list">';
    UPGRADE_DEFS.forEach(u => {
      const lv = upgradeLevels[u.id] || 0;
      const cost = Math.floor((u.baseCost.credits || 0) * Math.pow(u.costScale, lv));
      const sc = u.baseCost.samples || 0;
      const maxed = lv >= u.maxLevel;
      const canAfford = G.credits >= cost && G.samples >= sc;
      html += `<div class="upgrade-card ${maxed || !canAfford ? 'locked' : ''}" onmousedown="buyUpgrade('${u.id}')">
        <div class="upg-name">${u.name}</div>
        <div class="upg-desc">${u.desc}</div>
        <div class="upg-progress"><div class="upg-bar" style="width:${lv / u.maxLevel * 100}%"></div></div>
        <div class="upg-level">${maxed ? 'MAX' : lv + '/' + u.maxLevel}${maxed ? '' : ` — ¢${cost}${sc > 0 ? ' 🔬' + sc : ''}`}</div>
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
  }

  else if (tab === 'superpoints') {
    let html = `<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
      <div style="font-family:Orbitron,sans-serif;font-size:14px;color:var(--neon-purple)">★ SUPER POINTS: <span style="font-size:20px;">${G.superPoints}</span>
      <span style="font-size:11px;color:var(--text-dim);margin-left:14px;">Total dépensé: ${G.totalSP - G.superPoints}</span></div>
    </div><div class="sp-grid">`;
    SP_BONUSES.forEach(sp => {
      const count = G.bonus[sp.effect] || 0;
      html += `<div class="sp-card" onmousedown="buySP('${sp.effect}')">
        <div class="sp-name">${sp.name}</div>
        <div class="sp-desc">${sp.desc}</div>
        <div class="sp-count">×${count} (+${count}%)</div>
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
  }
}

// ============================================================
// SHOP
// ============================================================
function handleShopClick(typeId) {
  const def = MODULE_TYPES[typeId];
  if (!def.unlocked) { showNotif('Module verrouillé — acquérez des ressources !', 'notif-warn'); return; }
  if (G.credits < def.cost.credits || G.samples < (def.cost.samples || 0)) { showNotif('Ressources insuffisantes !', 'notif-warn'); return; }
  G.placingModule = typeId;
  showNotif('Cliquez sur une case adjacente pour placer', 'notif-xp');
  renderTabs();
}

function buyUpgrade(id) {
  const u = UPGRADE_DEFS.find(u => u.id === id);
  if (!u) return;
  const lv = upgradeLevels[id] || 0;
  if (lv >= u.maxLevel) { showNotif('Déjà au niveau maximum !', 'notif-warn'); return; }
  const cost = Math.floor((u.baseCost.credits || 0) * Math.pow(u.costScale, lv));
  const sc = u.baseCost.samples || 0;
  if (G.credits < cost || G.samples < sc) { showNotif('Ressources insuffisantes !', 'notif-warn'); return; }
  G.credits -= cost;
  G.samples -= sc;
  upgradeLevels[id] = lv + 1;
  invalidateAllModuleStats();
  showNotif(`${u.name} → Nv.${lv + 1}`, 'notif-xp');
  renderTabs();
  updateHUD();
}

function buySP(effect) {
  if (G.superPoints <= 0) { showNotif('Aucun Super Point disponible !', 'notif-warn'); return; }
  G.superPoints--;
  G.bonus[effect] = (G.bonus[effect] || 0) + 5;
  invalidateAllModuleStats();
  showNotif(`★ BONUS +5% ${effect.toUpperCase()}`, 'notif-levelup');
  renderTabs();
  updateHUD();
}

function checkUnlocks() {
  Object.entries(MODULE_TYPES).forEach(([key, def]) => {
    if (def.unlocked || !def.unlockReq) return;
    const req = def.unlockReq;
    let met = true;
    if (req.credits && G.credits < req.credits) met = false;
    if (req.samples && G.samples < req.samples) met = false;
    if (met) {
      def.unlocked = true;
      showNotif('🔓 ' + def.name + ' DÉBLOQUÉ !', 'notif-samples');
      renderTabs();
    }
  });
}

// ============================================================
// MODULE INFO PANEL
// ============================================================
function showModuleInfo(mod) {
  G.selectedModule = mod;
  const panel = document.getElementById('moduleInfo');
  if (panel) panel.classList.add('visible');
  updateModuleInfo(mod);
}

function updateModuleInfo(mod) {
  if (!mod || !mod.alive) { hideModuleInfo(); return; }
  const def = MODULE_TYPES[mod.typeId];
  const stats = getModuleStats(mod);
  const ti = hudEl('infoTitle');
  if (ti) ti.textContent = def.name;
  const it = hudEl('infoType');
  if (it) it.textContent = def.isCore ? 'Noyau' : def.isShooter ? 'Offensif' : def.isPassive ? 'Support' : 'Module';
  const il = hudEl('infoLevel');
  if (il) il.textContent = `${mod.level}/${CONFIG.MAX_LEVEL}`;
  const im = hudEl('infoMK');
  if (im) im.textContent = `MK${mod.mk}`;
  const ihb = hudEl('infoHpBar');
  if (ihb) ihb.style.width = (mod.hp / stats.maxHp * 100) + '%';
  const ih = hudEl('infoHp');
  if (ih) ih.textContent = `${Math.ceil(mod.hp)}/${stats.maxHp}`;

  let extra = '';
  if (def.isShooter || def.isCore) {
    extra += `<div class="info-stat"><span class="info-stat-label">Dégâts</span><span class="info-stat-value">${stats.dmg.toFixed(1)}</span></div>`;
    extra += `<div class="info-stat"><span class="info-stat-label">Portée</span><span class="info-stat-value">${(stats.range / G.CELL).toFixed(1)} cases</span></div>`;
    extra += `<div class="info-stat"><span class="info-stat-label">Cadence</span><span class="info-stat-value">${(1000 / stats.fireRate).toFixed(2)}/s</span></div>`;
  }
  if (def.energy !== 0) {
    const energyVal = stats.energyProd > 0 ? stats.energyProd : def.energy;
    extra += `<div class="info-stat"><span class="info-stat-label">Énergie</span><span class="info-stat-value" style="color:${energyVal < 0 || stats.energyProd > 0 ? 'var(--neon-green)' : 'var(--neon-orange)'}">${energyVal > 0 && stats.energyProd === 0 ? '-' : '+'}${Math.abs(energyVal).toFixed(1)}%</span></div>`;
  }
  if (def.isPatrol) {
    const units = G.patrolUnits.filter(u => u.ownerId === mod.id && u.alive).length;
    const max = 5 + Math.floor((mod.level - 1) / 5) * (mod.mk >= 2 ? 1.5 : 1);
    extra += `<div class="info-stat"><span class="info-stat-label">Unités</span><span class="info-stat-value" style="color:var(--neon-green)">${units}/${Math.floor(max)}</span></div>`;
    
    // Calculate patrol unit stats based on patrol.js logic
    const lvMult = 1 + (mod.level - 1) * 0.06;
    const mkMult = mod.mk >= 2 ? 1.5 : 1;
    const type = def.patrolType || 'basic';
    let uHp, uDmg;
    if (type === 'heavy') { uHp = 150; uDmg = 75; }
    else if (type === 'support') { uHp = 80; uDmg = 5; }
    else { uHp = 50; uDmg = 25; }
    
    extra += `<div style="margin-top:8px;font-size:10px;color:var(--text-dim);border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;letter-spacing:1px;">STATS PATROUILLEUR</div>`;
    extra += `<div class="info-stat"><span class="info-stat-label">PV Unité</span><span class="info-stat-value">${(uHp * lvMult * mkMult).toFixed(0)}</span></div>`;
    extra += `<div class="info-stat"><span class="info-stat-label">Dégâts Unité</span><span class="info-stat-value">${(uDmg * lvMult * mkMult).toFixed(1)}</span></div>`;
  }
  if (stats.creditsPerSec > 0) {
    extra += `<div class="info-stat"><span class="info-stat-label">Crédits/s</span><span class="info-stat-value" style="color:var(--neon-yellow)">${stats.creditsPerSec.toFixed(1)}</span></div>`;
  }
  if (stats.healRate > 0) {
    extra += `<div class="info-stat"><span class="info-stat-label">Réparation</span><span class="info-stat-value" style="color:var(--neon-green)">${stats.healRate.toFixed(1)} HP/s</span></div>`;
  }
  if (stats.replicatorSec > 0) {
    extra += `<div class="info-stat"><span class="info-stat-label">Génération</span><span class="info-stat-value" style="color:var(--neon-purple)">1 / ${stats.replicatorSec.toFixed(0)}s</span></div>`;
  }
  const ies = hudEl('infoExtraStats');
  if (ies) ies.innerHTML = extra;

  // Actions
  const lvCost = getModuleLevelUpCost(mod);
  const canLvl = G.credits >= lvCost && mod.level < CONFIG.MAX_LEVEL;
  const canMK2 = mod.level >= CONFIG.MAX_LEVEL && mod.mk === 1;

  let actions = '';
  if (mod.level < CONFIG.MAX_LEVEL) {
    actions += `<div class="info-action-btn ${canLvl ? 'can-afford' : 'cannot-afford'}" onmousedown="levelUpModule('${mod.id}')">⬆ AMÉLIORER (¢${lvCost})</div>`;
  } else if (mod.mk < 5) {
    const mkCost = typeof getMKUpgradeCost === 'function' ? getMKUpgradeCost(mod.mk) : 5;
    const canMK = G.samples >= mkCost;
    actions += `<div class="info-action-btn mk2" style="${canMK ? '' : 'opacity:0.5'}" onmousedown="upgradeMK('${mod.id}')">★ PASSER MK${mod.mk + 1} (🔬${mkCost})</div>`;
  } else {
    actions += '<div style="color:var(--neon-purple);font-size:12px;font-family:Orbitron,monospace;text-align:center;">★ MK5 NIVEAU MAX</div>';
  }

  if (mod.typeId !== 'core') {
    const sellCost = typeof getModuleTotalCost === 'function' ? getModuleTotalCost(mod) : {credits:0, samples:0};
    const refundC = Math.floor(sellCost.credits * 0.5);
    const refundS = Math.floor(sellCost.samples * 0.5);
    actions += `<div class="info-action-btn" style="border-color:var(--neon-red);color:var(--neon-red);margin-top:10px;" onmousedown="sellModule('${mod.id}')">REVENTE (+¢${refundC} 🔬${refundS})</div>`;
  }

  const ia = hudEl('infoActions');
  if (ia) ia.innerHTML = actions;
}

function hideModuleInfo() {
  G.selectedModule = null;
  const panel = document.getElementById('moduleInfo');
  if (panel) panel.classList.remove('visible');
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function showNotif(msg, cls) {
  const container = document.getElementById('notifContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `notif ${cls}`;
  el.textContent = msg;
  container.appendChild(el);
  if (container.children.length > 5) {
    container.children[0].remove();
  }
  setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
}

// ============================================================
// BESTIARY (ENEMY CATALOG)
// ============================================================
let bestiaryOpen = false;
function toggleBestiary() {
  const overlay = document.getElementById('bestiaryOverlay');
  if (!overlay) return;
  bestiaryOpen = !bestiaryOpen;
  
  if (bestiaryOpen) {
    overlay.classList.add('active');
    renderBestiary();
  } else {
    overlay.classList.remove('active');
  }
}

function renderBestiary() {
  const grid = document.getElementById('bestiaryGrid');
  if (!grid) return;
  let html = '';
  
  Object.entries(ENEMY_TYPES).forEach(([type, cfg]) => {
    // If enemy was killed at least once, we show it. Otherwise, it's unknown.
    const kills = (G && G.enemyKills && G.enemyKills[type]) ? G.enemyKills[type] : 0;
    const isKnown = kills > 0;
    
    html += `
      <div class="bestiary-card ${isKnown ? '' : 'unknown'}">
        <div class="bestiary-icon" style="background-color: ${isKnown ? cfg.color : '#555'}; border-radius: ${cfg.shape === 'circle' ? '50%' : '4px'}; transform: ${cfg.shape === 'diamond' ? 'rotate(45deg) scale(0.8)' : 'none'}"></div>
        <div class="bestiary-name" style="color: ${isKnown ? cfg.color : 'var(--text-dim)'}">${isKnown ? type.toUpperCase() : 'INCONNU'}</div>
        <div class="bestiary-stats">
          <div class="bestiary-stat"><span>Kills</span> <span>${kills}</span></div>
          <div class="bestiary-stat"><span>PV Base</span> <span style="color:var(--neon-green)">${isKnown ? cfg.hp : '???'}</span></div>
          <div class="bestiary-stat"><span>Dégâts</span> <span style="color:var(--neon-orange)">${isKnown ? cfg.dmg : '???'}</span></div>
          <div class="bestiary-stat"><span>Vitesse</span> <span>${isKnown ? cfg.speed : '???'}</span></div>
          <div class="bestiary-stat"><span>Type</span> <span style="color:var(--neon-purple)">${isKnown ? getEnemyRole(cfg) : '???'}</span></div>
        </div>
      </div>
    `;
  });
  
  grid.innerHTML = html;
}

function getEnemyRole(cfg) {
  if (cfg.isBoss) return 'BOSS';
  if (cfg.isKamikaze) return 'KAMIKAZE';
  if (cfg.isHealer) return 'GUÉRISSEUR';
  if (cfg.isSplitter) return 'DIVISEUR';
  if (cfg.isProtector) return 'PROTECTEUR';
  if (cfg.isShifter) return 'GLITCHER';
  if (cfg.isSniper) return 'SNIPER';
  if (cfg.shootRange) return 'DISTANCE';
  if (cfg.speed > 1.5) return 'RAPIDE';
  return 'STANDARD';
}
