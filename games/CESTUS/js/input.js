// ============================================================
// CESTUS CONTROL — Input System
// Mouse, keyboard, cheat codes
// ============================================================

// ============================================================
// DEBUG CHEAT (accessible via Ctrl+Alt+S ou bouton paramètres)
// ============================================================
function activateDebugCheat() {
  if (!G || G.over) return;
  G.credits = 9999999;
  G.samples = 99999;
  G.xp = 0;
  G.level = 50;
  G.superPoints += 100;
  G.xpNeeded = Math.floor(CONFIG.BASE_XP * Math.pow(CONFIG.XP_SCALE, 49));
  const debugBonusKeys = Object.keys(G.bonus);
  debugBonusKeys.forEach(k => { G.bonus[k] = (G.bonus[k] || 0) + 100; });
  G.totalSP += 100 + debugBonusKeys.length * 20;
  UPGRADE_DEFS.forEach(u => { upgradeLevels[u.id] = u.maxLevel; });
  Object.keys(MODULE_TYPES).forEach(k => { MODULE_TYPES[k].unlocked = true; });
  G.modules.forEach(m => {
    m.level = CONFIG.MAX_LEVEL;
    m.mk = 5;
    invalidateAllModuleStats();
    const stats = getModuleStats(m);
    m.hp = stats.maxHp;
    m.maxHp = stats.maxHp;
  });
  const spd4 = document.getElementById('spd4');
  if (spd4) spd4.classList.remove('locked');
  recalcEnergy();
  renderTabs();
  updateHUD();
  showNotif('DEBUG — +100 DANS CHAQUE BONUS, PROGRESSION CONSERVEE', 'notif-levelup');
}

// ============================================================
// MULTI-PLACEMENT MOBILE (long press sur carte module)
// ============================================================
let _multiPlaceLongPressTimer = null;
const LONG_PRESS_DURATION = 500; // ms

function startMultiPlacement(typeId) {
  const def = MODULE_TYPES[typeId];
  if (!def || !def.unlocked) return;
  if (G.credits < def.cost.credits || G.samples < (def.cost.samples || 0)) {
    showNotif('Ressources insuffisantes !', 'notif-warn');
    return;
  }
  G.placingModule = typeId;
  G._multiPlaceMode = true;
  if (typeof setMobilePanelExpanded === 'function') setMobilePanelExpanded(false);
  renderTabs();
  updateMultiPlaceStopBtn();
  showNotif('Appui prolonge pour placer — X pour arreter', 'notif-xp');
}

function stopMultiPlacement() {
  G._multiPlaceMode = false;
  G.placingModule = null;
  renderTabs();
  updateMultiPlaceStopBtn();
}

function updateMultiPlaceStopBtn() {
  const btn = document.getElementById('multiPlaceStopBtn');
  if (!btn) return;
  const isPhone = document.documentElement.dataset.mobileDevice === 'true';
  btn.style.display = (isPhone && G._multiPlaceMode) ? 'flex' : 'none';
}

// Attache les listeners long press sur une shop-card DOM
function attachShopCardLongPress(card, typeId) {
  card.addEventListener('touchstart', e => {
    _multiPlaceLongPressTimer = setTimeout(() => {
      _multiPlaceLongPressTimer = null;
      startMultiPlacement(typeId);
    }, LONG_PRESS_DURATION);
  }, { passive: true });
  card.addEventListener('touchend', () => {
    if (_multiPlaceLongPressTimer) {
      clearTimeout(_multiPlaceLongPressTimer);
      _multiPlaceLongPressTimer = null;
    }
  }, { passive: true });
  card.addEventListener('touchmove', () => {
    if (_multiPlaceLongPressTimer) {
      clearTimeout(_multiPlaceLongPressTimer);
      _multiPlaceLongPressTimer = null;
    }
  }, { passive: true });
}


function initInput() {
  const C = document.getElementById('gameCanvas');
  G.mouseScreen = { x: 0, y: 0 };

  C.addEventListener('mousedown', e => {
    if (e.button === 2) { G.placingModule = null; G._multiPlaceMode = false; if (typeof updateMultiPlaceStopBtn === 'function') updateMultiPlaceStopBtn(); renderTabs(); return; }
    G.isDragging = false;
    G.lastMouse = { x: e.clientX, y: e.clientY };
    G._mouseDownPos = { x: e.clientX, y: e.clientY };
    G._mouseDown = true;
  });

  C.addEventListener('mousemove', e => {
    G.mouseScreen = { x: e.clientX, y: e.clientY };
    // Always track world position for patrol unit control
    G.mouseWorld = screenToWorld(e.clientX, e.clientY);

    if (!G._mouseDown) return;
    const dx = e.clientX - G.lastMouse.x;
    const dy = e.clientY - G.lastMouse.y;
    if (Math.abs(e.clientX - G._mouseDownPos.x) > 5 || Math.abs(e.clientY - G._mouseDownPos.y) > 5) {
      G.isDragging = true;
    }
    if (G.isDragging) {
      G.cam.x -= dx / G.cam.zoom;
      G.cam.y -= dy / G.cam.zoom;
      clampCamera();
    }
    G.lastMouse = { x: e.clientX, y: e.clientY };
  });

  C.addEventListener('mouseup', e => {
    G._mouseDown = false;
    if (G.isDragging) { G.isDragging = false; return; }

    const { gx, gy, wx, wy } = screenToGrid(e.clientX, e.clientY);
    C.dataset.lastGrid = gx + ',' + gy;

    // Placing a module
    if (G.placingModule) {
      const def = MODULE_TYPES[G.placingModule];
      if (canPlaceModule(gx, gy)) {
        if (G.credits < def.cost.credits || G.samples < (def.cost.samples || 0)) {
          showNotif('Ressources insuffisantes !', 'notif-warn');
          G.placingModule = null;
          renderTabs();
          return;
        }
        G.credits -= def.cost.credits;
        G.samples -= (def.cost.samples || 0);
        const mod = placeModule(G.placingModule, gx, gy);
        C.dataset.lastPlacement = mod ? G.placingModule + '@' + gx + ',' + gy : 'failed';
        if (mod) showNotif(`${def.name} placé !`, 'notif-xp');
        checkUnlocks();
        if (!e.ctrlKey && !G._multiPlaceMode) {
          G.placingModule = null;
        }
        if (G._multiPlaceMode) updateMultiPlaceStopBtn();
        renderTabs();
        updateHUD();
      } else {
        C.dataset.lastPlacement = 'invalid@' + gx + ',' + gy;
        showNotif('Placement invalide — adjacence requise !', 'notif-warn');
      }
      return;
    }

    // Click on module
    const clicked = G.modules.find(m =>
      m.alive && Math.hypot(m.x - wx, m.y - wy) < G.CELL * 0.45
    );
    if (clicked) showModuleInfo(clicked);
    else hideModuleInfo();
  });

  C.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    G.cam.zoom = Math.max(0.2, Math.min(3, G.cam.zoom * factor));
  }, { passive: false });

  C.addEventListener('contextmenu', e => e.preventDefault());

  // Native touch controls: one finger pans/taps, two fingers pinch to zoom.
  let touchMode = null;
  let lastTouch = null;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  C.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length >= 2) {
      const a = e.touches[0], b = e.touches[1];
      pinchStartDistance = Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY));
      pinchStartZoom = G.cam.zoom;
      touchMode = 'pinch';
      G._mouseDown = false;
      return;
    }
    const t = e.touches[0];
    if (!t) return;
    touchMode = 'pointer';
    lastTouch = { x: t.clientX, y: t.clientY };
    C.dispatchEvent(new MouseEvent('mousedown', { clientX:t.clientX, clientY:t.clientY, button:0, bubbles:true }));
  }, { passive:false });

  C.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length >= 2) {
      const a = e.touches[0], b = e.touches[1];
      const distance = Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY));
      G.cam.zoom = Math.max(0.35, Math.min(2.5, pinchStartZoom * distance / pinchStartDistance));
      clampCamera();
      touchMode = 'pinch';
      return;
    }
    if (touchMode !== 'pointer' || !e.touches[0]) return;
    const t = e.touches[0];
    lastTouch = { x:t.clientX, y:t.clientY };
    C.dispatchEvent(new MouseEvent('mousemove', { clientX:t.clientX, clientY:t.clientY, button:0, bubbles:true }));
  }, { passive:false });

  C.addEventListener('touchend', e => {
    e.preventDefault();
    if (touchMode === 'pointer' && lastTouch) {
      C.dispatchEvent(new MouseEvent('mouseup', { clientX:lastTouch.x, clientY:lastTouch.y, button:0, bubbles:true }));
    }
    if (!e.touches.length) {
      touchMode = null;
      lastTouch = null;
      G._mouseDown = false;
    }
  }, { passive:false });

  C.addEventListener('touchcancel', () => {
    touchMode = null;
    lastTouch = null;
    G._mouseDown = false;
  }, { passive:true });

  // Keyboard
  document.addEventListener('keydown', e => {
    // Pause toggle (P or Escape when not placing)
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (e.key === 'Escape') {
      if (typeof bestiaryOpen !== 'undefined' && bestiaryOpen) {
        toggleBestiary();
        return;
      }
      if (G.placingModule) {
        G.placingModule = null;
        G._multiPlaceMode = false;
        if (typeof updateMultiPlaceStopBtn === 'function') updateMultiPlaceStopBtn();
        hideModuleInfo();
        renderTabs();
      } else {
        togglePause();
      }
      return;
    }

    // Block all other inputs while paused
    if (G.paused) return;

    // CTRL+ALT+S = debug cheat
    if (e.ctrlKey && e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      activateDebugCheat();
    }

    // Keyboard shortcuts
    if (e.key === ' ') {
      e.preventDefault();
      toggleOverclock();
    }
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      triggerNextWave();
    }
    if (e.key === '1') setSpeed(1);
    if (e.key === '2') setSpeed(2);
    if (e.key === '3') { if (G.level >= 10) setSpeed(3); }
    if (e.key === '4') setSpeed(4);
    if (e.key === 'r' || e.key === 'R') {
      if (G.selectedModule && G.selectedModule.alive) {
        sellModule(G.selectedModule.id);
      }
    }
  });

  // Close info panel
  const closeBtn = document.getElementById('closeInfo');
  if (closeBtn) closeBtn.addEventListener('click', hideModuleInfo);

  // Horizontal scroll with mousewheel on bottom panel grids
  const bottomPanel = document.getElementById('bottomPanel');
  if (bottomPanel) {
    bottomPanel.addEventListener('wheel', e => {
      const scrollable = bottomPanel.querySelector('.card-grid, .upgrade-list, .sp-grid');
      if (scrollable) {
        e.preventDefault();
        scrollable.scrollLeft += e.deltaY * 2.5;
      }
    }, { passive: false });
  }
}
