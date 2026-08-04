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

function setTextIfChanged(el, value) {
  if (!el) return;
  const text = String(value);
  if (el.textContent !== text) el.textContent = text;
}

function setHTMLIfChanged(el, html) {
  if (el && el.innerHTML !== html) el.innerHTML = html;
}

function updateHUD() {
  setTextIfChanged(hudEl('hudCredits'), G.credits);
  setTextIfChanged(hudEl('hudSamples'), G.samples);
  setTextIfChanged(hudEl('hudXP'), G.xp + '/' + G.xpNeeded);
  setTextIfChanged(hudEl('hudSP'), G.superPoints);
  setTextIfChanged(hudEl('hudKills'), G.kills);
  setTextIfChanged(hudEl('hudWave'), G.wave);

  const el = hudEl('hudEnergy');
  setTextIfChanged(el, `${Math.round(G.usedEnergy)} / ${Math.round(G.totalEnergy)}`);
  el.style.color = G.usedEnergy > G.totalEnergy ? 'var(--neon-red)' : G.usedEnergy >= G.totalEnergy * 0.9 ? 'var(--neon-orange)' : 'var(--neon-yellow)';

  if (G.selectedModule && G.selectedModule.alive) updateModuleInfo(G.selectedModule);
}

// ============================================================
// TAB SYSTEM
// ============================================================
const TAB_SCROLL_MEMORY = { shop:0, upgrades:0, superpoints:0 };

function activateMainTab(element, tab) {
  document.querySelectorAll('#tabBar .tab').forEach(x => x.classList.remove('active'));
  element?.classList.add('active');
  renderTab(tab);
}

function rememberTabScroll(content) {
  if (!content) return;
  const scroller = content.querySelector('.card-grid, .upgrade-list, .sp-grid');
  if (!scroller) return;
  const currentTab = scroller.classList.contains('upgrade-list') ? 'upgrades' : scroller.classList.contains('sp-grid') ? 'superpoints' : 'shop';
  TAB_SCROLL_MEMORY[currentTab] = scroller.scrollLeft;
}

function restoreTabScroll(tab, content) {
  const scroller = content?.querySelector('.card-grid, .upgrade-list, .sp-grid');
  if (scroller) scroller.scrollLeft = TAB_SCROLL_MEMORY[tab] || 0;
}

function getCardDescription(def) {
  if (def.shortDesc) return def.shortDesc;
  const clean = (def.desc || '').replace(/\s*\([^)]*⚡\)\.?/g,'').trim();
  const first = clean.split(/[.!?]/)[0];
  return (first.length > 68 ? first.slice(0,65) + '…' : first) + (first ? '.' : '');
}

function setShopSort(value) { G.shopSort = value; renderTabs(); }
function toggleShopDensity() { G.shopCompact = !G.shopCompact; renderTabs(); }
function filterShopCards(value) {
  G.shopSearch = String(value || '').toLowerCase();
  let visible = 0;
  document.querySelectorAll('.shop-card[data-search]').forEach(card => {
    const show = card.dataset.search.includes(G.shopSearch);
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const count = document.getElementById('shopVisibleCount');
  if (count) count.textContent = visible + ' AFFICHÉS';
}

const UPGRADE_ICONS = {
  u_dmg:'◆', u_fire:'≋', u_range:'◎', u_hp:'✚', u_energy:'ϟ',
  u_accuracy:'⌖', u_credit:'¢', u_sample:'⌬', u_loot:'◇'
};

function selectModuleSibling(id, direction) {
  const current = G.modules.find(m => m.id == id);
  if (!current) return;
  const family = G.modules.filter(m => m.alive && m.typeId === current.typeId).sort((a,b) => a.id - b.id);
  if (family.length < 2) return;
  const index = family.indexOf(current);
  const next = family[(index + direction + family.length) % family.length];
  showModuleInfo(next);
  if (G.cam) {
    G.cam.x = next.x; G.cam.y = next.y;
    if (typeof clampCamera === 'function') clampCamera();
  }
}

function renderTabs() {
  const active = document.querySelector('.tab.active')?.dataset.tab || 'shop';
  renderTab(active);
}

function renderTab(tab) {
  const content = hudEl('tabContent');
  if (!content) return;
  rememberTabScroll(content);

  if (tab === 'shop') {
    G.activeShopTab = G.activeShopTab || 'offensive';
    G.activeShopGroup = G.activeShopGroup || 'all';
    G.shopSort = G.shopSort || 'name';
    
    let html = `<div id="shopTabBar" style="display:flex;gap:4px;margin-bottom:5px;border-bottom:1px solid rgba(0,200,255,0.1);padding-bottom:4px;">
      <div class="tab ${G.activeShopTab === 'offensive' ? 'active' : ''}" style="font-size:10px;padding:4px 10px;" onclick="G.activeShopTab='offensive'; renderTabs()">ARMEMENT</div>
      <div class="tab ${G.activeShopTab === 'support' ? 'active' : ''}" style="font-size:10px;padding:4px 10px;" onclick="G.activeShopTab='support'; renderTabs()">SUPPORT & LOGISTIQUE</div>
    </div>`;

    html += `<div class="build-toolbar">
      <label>⌕ <input value="${G.shopSearch || ''}" oninput="filterShopCards(this.value)" placeholder="Rechercher…"></label>
      <select onchange="setShopSort(this.value)"><option value="name" ${G.shopSort==='name'?'selected':''}>NOM</option><option value="cost" ${G.shopSort==='cost'?'selected':''}>PRIX</option><option value="energy" ${G.shopSort==='energy'?'selected':''}>ÉNERGIE</option><option value="placed" ${G.shopSort==='placed'?'selected':''}>PLACÉES</option></select>
      <button onclick="toggleShopDensity()">${G.shopCompact ? '▦ DÉTAILLÉ' : '▤ COMPACT'}</button><span id="shopVisibleCount"></span>
    </div>`;

    if (G.activeShopTab === 'offensive') {
      const doctrines = [['all','TOUT'],['kinetic','CINÉTIQUE'],['energy','PHOTONIQUE'],['control','CONTRÔLE'],['prototype','PROTOCOLES']];
      html += '<div class="doctrine-bar">';
      doctrines.forEach(([id,label]) => {
        html += `<button class="doctrine-pill ${G.activeShopGroup === id ? 'active' : ''}" onclick="G.activeShopGroup='${id}'; renderTabs()">${label}</button>`;
      });
      html += '</div>';
    }
    html += `<div class="card-grid ${G.activeShopTab === 'offensive' ? 'with-doctrines' : ''} ${G.shopCompact ? 'compact' : ''}">`;
    
    const shopEntries = Object.entries(MODULE_TYPES).filter(([typeId,def]) => def.category === G.activeShopTab && typeId !== 'core' && (G.activeShopTab !== 'offensive' || G.activeShopGroup === 'all' || def.group === G.activeShopGroup));
    const placedByType = {};
    G.modules.forEach(m => { if (m.alive) placedByType[m.typeId] = (placedByType[m.typeId] || 0) + 1; });
    shopEntries.sort((a,b) => G.shopSort === 'cost' ? (a[1].cost.credits||0)-(b[1].cost.credits||0) : G.shopSort === 'energy' ? (a[1].energy||0)-(b[1].energy||0) : G.shopSort === 'placed' ? (placedByType[b[0]]||0)-(placedByType[a[0]]||0) : a[1].name.localeCompare(b[1].name,'fr'));
    shopEntries.forEach(([typeId, def]) => {
      const canAfford = G.credits >= def.cost.credits && G.samples >= (def.cost.samples || 0);
      const locked = !def.unlocked;
      const isPlacing = G.placingModule === typeId;
      const cls = locked ? 'locked' : isPlacing ? 'selected' : canAfford ? 'affordable' : '';
      const energyStr = def.energy > 0 ? `-${def.energy}⚡` : def.energy < 0 ? `+${Math.abs(def.energy)}⚡` : '';
      const placedCount = placedByType[typeId] || 0;

      const creditsStr = def.cost.credits > 0 ? `<span class="cost-credits">¢${def.cost.credits}</span>` : '';
      const samplesStr = (def.cost.samples || 0) > 0 ? `<span class="cost-samples">🔬${def.cost.samples}</span>` : '';
      const freeStr = def.cost.credits === 0 && (def.cost.samples || 0) === 0 ? '<span style="color:var(--neon-green)">GRATUIT</span>' : '';
      const costHtml = `<span style="font-weight:bold;margin-left:4px;white-space:nowrap;">[${creditsStr}${creditsStr&&samplesStr?' ':''}${samplesStr}${freeStr}]</span>`;

      const searchText = `${def.name} ${def.mechanic || ''} ${def.desc || ''}`.toLowerCase().replace(/"/g,'&quot;');
      html += `<div class="shop-card ${cls}" data-search="${searchText}" onclick="handleShopClick('${typeId}')">
        <div class="card-name" style="color:${locked ? 'var(--text-dim)' : def.color}">${def.name}</div>
        ${def.mechanic ? `<div class="mechanic-chip" style="--chip:${def.color}">${def.mechanic}</div>` : ''}
        <span class="card-icon">${def.icon}</span>
        <div class="card-desc">${getCardDescription(def)}</div>
        <div class="card-meta"><span>${energyStr || '0⚡'}</span><span>×${placedCount}</span></div>
        <div class="card-price">${costHtml}</div>
        ${locked ? '<div class="locked-overlay"><span style="font-size: 24px; margin-bottom: 4px;">🔒</span><br>VERROUILLÉ</div>' : ''}
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
    
    restoreTabScroll('shop', content);
    filterShopCards(G.shopSearch || '');
  }

  else if (tab === 'upgrades') {
    let html = `<div class="upgrade-intro"><div><b>RECHERCHE GLOBALE</b><span>Chaque niveau affecte instantanément tout le réseau.</span></div><strong>${UPGRADE_DEFS.reduce((sum,u)=>sum+(upgradeLevels[u.id]||0),0)} NIVEAUX</strong></div><div class="upgrade-list">`;
    UPGRADE_DEFS.forEach(u => {
      const lv = upgradeLevels[u.id] || 0;
      const cost = Math.floor((u.baseCost.credits || 0) * Math.pow(u.costScale, lv) * (BALANCE.globalUpgradeCost || 1));
      const sc = u.baseCost.samples || 0;
      const maxed = lv >= u.maxLevel;
      const canAfford = G.credits >= cost && G.samples >= sc;
      html += `<div class="upgrade-card ${maxed || !canAfford ? 'locked' : ''}" onclick="buyUpgrade('${u.id}')">
        <div class="upg-head"><i>${UPGRADE_ICONS[u.id] || '✦'}</i><div><div class="upg-name">${u.name}</div><small>NIVEAU ${lv} → ${maxed ? 'MAX' : lv + 1}</small></div></div>
        <div class="upg-desc">${u.desc}</div>
        <div class="upg-progress"><div class="upg-bar" style="width:${lv / u.maxLevel * 100}%"></div></div>
        <div class="upg-level"><span>${lv}/${u.maxLevel}</span><b>${maxed ? 'MAXIMUM' : `AMÉLIORER · ¢${cost}${sc > 0 ? ' 🔬' + sc : ''}`}</b></div>
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
    restoreTabScroll('upgrades', content);
  }

  else if (tab === 'superpoints') {
    let html = `<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
      <div style="font-family:Orbitron,sans-serif;font-size:14px;color:var(--neon-purple)">★ SUPER POINTS: <span style="font-size:20px;">${G.superPoints}</span>
      <span style="font-size:11px;color:var(--text-dim);margin-left:14px;">Total dépensé: ${G.totalSP - G.superPoints}</span></div>
    </div><div class="sp-grid">`;
    SP_BONUSES.forEach(sp => {
      const count = G.bonus[sp.effect] || 0;
      html += `<div class="sp-card" onclick="buySP('${sp.effect}')">
        <div class="sp-name">${sp.name}</div>
        <div class="sp-desc">${sp.desc}</div>
        <div class="sp-count">×${count} (+${count}%)</div>
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
    restoreTabScroll('superpoints', content);
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
  const cost = Math.floor((u.baseCost.credits || 0) * Math.pow(u.costScale, lv) * (BALANCE.globalUpgradeCost || 1));
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
  if (it) it.textContent = def.isCore ? 'Noyau' : def.category === 'support' ? 'Support & logistique' : def.isShooter ? 'Armement' : 'Module';
  const il = hudEl('infoLevel');
  if (il) il.textContent = `${mod.level}/${CONFIG.MAX_LEVEL}`;
  const im = hudEl('infoMK');
  if (im) im.textContent = `MK${mod.mk}`;
  const ihb = hudEl('infoHpBar');
  if (ihb) ihb.style.width = (mod.hp / stats.maxHp * 100) + '%';
  const ih = hudEl('infoHp');
  if (ih) ih.textContent = `${Math.ceil(mod.hp)}/${stats.maxHp}`;

  let extra = `<div class="info-description">${def.desc || 'Aucune donnée tactique.'}</div>`;
  if (def.mechanic) {
    extra += `<div class="info-stat"><span class="info-stat-label">Protocole</span><span class="info-stat-value" style="color:${def.color}">${def.mechanic}</span></div>`;
  }
  if (def.isShooter || def.isCore) {
    extra += `<div class="info-stat"><span class="info-stat-label">Dégâts</span><span class="info-stat-value">${stats.dmg.toFixed(1)}</span></div>`;
    extra += `<div class="info-stat"><span class="info-stat-label">DPS théorique</span><span class="info-stat-value">${(stats.dmg * 1000 / Math.max(1,stats.fireRate)).toFixed(1)}</span></div>`;
    extra += `<div class="info-stat"><span class="info-stat-label">Portée</span><span class="info-stat-value">${(stats.range / G.CELL).toFixed(1)} cases</span></div>`;
    extra += `<div class="info-stat"><span class="info-stat-label">Cadence</span><span class="info-stat-value">${(1000 / stats.fireRate).toFixed(2)}/s</span></div>`;
    const spreadDeg = (Math.max(0, stats.spread || 0) * 180 / Math.PI).toFixed(1);
    extra += `<div class="info-stat"><span class="info-stat-label">Dispersion</span><span class="info-stat-value" style="color:var(--neon-cyan)">${spreadDeg}°</span></div>`;
  }
  if (def.energy !== 0) {
    const energyVal = stats.energyProd > 0 ? stats.energyProd : def.energy;
    extra += `<div class="info-stat"><span class="info-stat-label">Énergie</span><span class="info-stat-value" style="color:${energyVal < 0 || stats.energyProd > 0 ? 'var(--neon-green)' : 'var(--neon-orange)'}">${energyVal > 0 && stats.energyProd === 0 ? '-' : '+'}${Math.abs(energyVal).toFixed(1)} ⚡</span></div>`;
  }
  if (def.baseEnergy) extra += `<div class="info-stat"><span class="info-stat-label">Réserve réseau</span><span class="info-stat-value" style="color:var(--neon-yellow)">+${def.baseEnergy} ⚡</span></div>`;
  if (def.adjacencyEnergyDiscount) extra += `<div class="info-stat"><span class="info-stat-label">Économie adjacente</span><span class="info-stat-value" style="color:var(--neon-green)">-${Math.round(def.adjacencyEnergyDiscount * 100)}%</span></div>`;
  if (def.aura) {
    const auraParts = Object.entries(def.aura).filter(([,v])=>v).map(([k,v]) => `${k.toUpperCase()} +${Math.round(v*100)}%`);
    if (auraParts.length) extra += `<div class="info-aura">ZONE ADJACENTE<br><b>${auraParts.join(' · ')}</b></div>`;
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
  setHTMLIfChanged(ies, extra);

  // Actions
  const lvCost = getModuleLevelUpCost(mod);
  const canLvl = G.credits >= lvCost && mod.level < CONFIG.MAX_LEVEL;
  const familyCount = G.modules.filter(m => m.alive && m.typeId === mod.typeId).length;

  let actions = familyCount > 1
    ? `<div class="module-family-nav"><button onclick="selectModuleSibling('${mod.id}',-1)">‹ PRÉC.</button><span>${familyCount}× CONSTRUITES</span><button onclick="selectModuleSibling('${mod.id}',1)">SUIV. ›</button></div>`
    : '<div class="module-family-nav solo"><span>MODULE UNIQUE</span></div>';
  if (mod.level < CONFIG.MAX_LEVEL) {
    const typeQuote = getTypeLevelUpCost(mod.typeId);
    const quote5 = getModuleBatchQuote(mod, 5);
    const quoteMax = getModuleBatchQuote(mod, CONFIG.MAX_LEVEL);
    actions += `<div class="module-upgrade-grid">
      <div class="info-action-btn ${canLvl ? 'can-afford' : 'cannot-afford'}" onclick="levelUpModule('${mod.id}')">⬆ +1<br><small>¢${lvCost}</small></div>
      <div class="info-action-btn ${quote5.affordable ? 'can-afford' : 'cannot-afford'}" onclick="levelUpModuleBatch('${mod.id}',5)">⬆ +${quote5.count}<br><small>¢${quote5.total}</small></div>
      <div class="info-action-btn ${quoteMax.affordable ? 'can-afford' : 'cannot-afford'}" onclick="levelUpModuleMax('${mod.id}')">MAX ACHETABLE<br><small>+${quoteMax.affordable} · ¢${quoteMax.affordableTotal}</small></div>
    </div>`;
    if (mod.typeId !== 'core' && typeQuote.count > 1) {
      const canType = G.credits >= typeQuote.total;
      actions += `<div class="info-action-btn type-upgrade ${canType ? 'can-afford' : 'cannot-afford'}" onclick="levelUpSameType('${mod.typeId}')">↑ ${typeQuote.count} MODULES DE CE TYPE +1 <small>¢${typeQuote.total}</small></div>`;
    }
  } else if (mod.mk < 5) {
    const mkCost = typeof getMKUpgradeCost === 'function' ? getMKUpgradeCost(mod.mk) : 5;
    const canMK = G.samples >= mkCost;
    actions += `<div class="info-action-btn mk2" style="${canMK ? '' : 'opacity:0.5'}" onclick="upgradeMK('${mod.id}')">★ PASSER MK${mod.mk + 1} (🔬${mkCost})</div>`;
  } else {
    actions += '<div class="module-max-state">★ MK5 · NIVEAU MAXIMUM</div>';
  }

  if (mod.typeId !== 'core') {
    const sellCost = typeof getModuleTotalCost === 'function' ? getModuleTotalCost(mod) : {credits:0, samples:0};
    const refundC = Math.floor(sellCost.credits * (BALANCE.refundRate || 0.65));
    const refundS = Math.floor(sellCost.samples * (BALANCE.refundRate || 0.65));
    actions += `<div class="info-action-btn" style="border-color:var(--neon-red);color:var(--neon-red);margin-top:10px;" onclick="sellModule('${mod.id}')">REVENTE (+¢${refundC} 🔬${refundS})</div>`;
  }

  const ia = hudEl('infoActions');
  setHTMLIfChanged(ia, actions);
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
  if (container.children.length > 3) {
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
  if (cfg.regenPerSec) return 'RÉGÉNÉRATEUR';
  if (cfg.phaseInterval) return 'PHASEUR';
  if (cfg.isCommander) return 'COMMANDEUR';
  if (cfg.isSiphon) return 'SIPHON';
  if (cfg.isBerserker) return 'BERSERKER';
  if (cfg.slowResist) return 'JUGGERNAUT';
  if (cfg.shootRange) return 'DISTANCE';
  if (cfg.speed > 1.5) return 'RAPIDE';
  return 'STANDARD';
}
