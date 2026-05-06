// ============================================================
// CESTUS CONTROL — Input System
// Mouse, keyboard, cheat codes
// ============================================================

function initInput() {
  const C = document.getElementById('gameCanvas');
  G.mouseScreen = { x: 0, y: 0 };

  C.addEventListener('mousedown', e => {
    if (e.button === 2) { G.placingModule = null; renderTabs(); return; }
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
        if (mod) showNotif(`${def.name} placé !`, 'notif-xp');
        checkUnlocks();
        if (!e.ctrlKey) {
          G.placingModule = null;
        }
        renderTabs();
        updateHUD();
      } else {
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
      if (!G || G.over) return;
      G.credits = 9999999;
      G.samples = 99999;
      G.xp = 0;
      G.level = 50;
      G.superPoints = 9999;
      G.totalSP = 9999;
      G.xpNeeded = Math.floor(CONFIG.BASE_XP * Math.pow(CONFIG.XP_SCALE, 49));
      Object.keys(G.bonus).forEach(k => { G.bonus[k] = 100; });
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
      showNotif('🔧 MODE DEBUG ACTIVÉ — MK5 + Crédits infinis !', 'notif-levelup');
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

  // Tab clicks
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      renderTab(t.dataset.tab);
    });
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
