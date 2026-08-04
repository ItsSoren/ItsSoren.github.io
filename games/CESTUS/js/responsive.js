// ============================================================
// CESTUS CONTROL — Responsive viewport director
// Keeps the combat UI readable across desktop, short screens and touch devices.
// ============================================================

let responsiveFrame = 0;
let mobilePanelExpanded = false;
let mobilePanelInitialized = false;

function updateMobilePanelState() {
  const root = document.documentElement;
  const panel = document.getElementById('bottomPanel');
  const grip = document.getElementById('mobilePanelGrip');
  const phone = root.dataset.mobileDevice === 'true';
  if (!panel) return;
  panel.classList.toggle('mobile-collapsed', phone && !mobilePanelExpanded);
  root.dataset.mobilePanel = !phone ? 'desktop' : mobilePanelExpanded ? 'open' : 'closed';
  if (grip) {
    grip.setAttribute('aria-expanded', String(phone && mobilePanelExpanded));
    grip.querySelector('b').textContent = mobilePanelExpanded ? '⌄' : '⌃';
    grip.querySelector('span').textContent = mobilePanelExpanded ? 'FERMER' : 'BUILD';
  }
}

function setMobilePanelExpanded(expanded) {
  if (document.documentElement.dataset.mobileDevice !== 'true') return;
  mobilePanelExpanded = !!expanded;
  syncResponsiveLayout();
}

function toggleMobilePanel() {
  setMobilePanelExpanded(!mobilePanelExpanded);
}

function syncResponsiveLayout() {
  const root = document.documentElement;
  const width = Math.max(320, window.innerWidth || 320);
  const height = Math.max(320, Math.round(window.visualViewport?.height || window.innerHeight || 320));
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const portrait = height >= width;
  const mobileDevice = width <= 620 || (coarse && Math.min(width,height) <= 620);

  let layout = 'desktop';
  if (width <= 620) layout = 'phone';
  else if (height <= 520) layout = 'short';
  else if (width <= 1100) layout = 'tablet';
  else if (height <= 680) layout = 'short';

  // Desktop UI can grow on large displays, but it never shrinks below 100%.
  const uiScale = Math.min(1.28, Math.max(1, Math.sqrt((width * height) / (1366 * 768))));
  let panelHeight;
  if (layout === 'phone') {
    panelHeight = portrait
      ? Math.min(400, Math.max(300, height * 0.44))
      : Math.min(220, Math.max(155, height * 0.34));
  } else if (layout === 'tablet') {
    panelHeight = Math.min(330, Math.max(220, height * 0.32));
  } else if (layout === 'short') {
    panelHeight = height <= 520
      ? Math.min(210, Math.max(160, height * 0.42))
      : Math.min(260, Math.max(195, height * 0.34));
  } else {
    panelHeight = Math.min(330, Math.max(230, height * 0.27));
  }
  if (mobileDevice && !portrait) panelHeight = Math.min(240, Math.max(205, height * 0.62));

  root.dataset.layout = layout;
  root.dataset.orientation = portrait ? 'portrait' : 'landscape';
  root.dataset.touch = coarse ? 'true' : 'false';
  root.dataset.mobileDevice = mobileDevice ? 'true' : 'false';
  root.style.setProperty('--ui-scale', uiScale.toFixed(3));
  root.style.setProperty('--bottom-panel-open-h', Math.round(panelHeight) + 'px');
  root.style.setProperty('--bottom-panel-h', Math.round(mobileDevice && !mobilePanelExpanded ? (portrait ? 58 : 52) : panelHeight) + 'px');
  root.style.setProperty('--viewport-h', height + 'px');
  if (mobileDevice && !mobilePanelInitialized) {
    mobilePanelExpanded = false;
    mobilePanelInitialized = true;
  }
  updateMobilePanelState();
}

function queueResponsiveLayout() {
  cancelAnimationFrame(responsiveFrame);
  responsiveFrame = requestAnimationFrame(() => {
    syncResponsiveLayout();
    if (typeof resizeCanvas === 'function') resizeCanvas();
  });
}

syncResponsiveLayout();
window.addEventListener('resize', queueResponsiveLayout, { passive: true });
window.addEventListener('orientationchange', queueResponsiveLayout, { passive: true });
window.visualViewport?.addEventListener('resize', queueResponsiveLayout, { passive: true });
