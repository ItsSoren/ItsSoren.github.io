// ============================================================
// CESTUS CONTROL — Camera System
// ============================================================

function initCamera() {
  G.cam = { x: G.CELL * 0.5, y: G.CELL * 0.5, zoom: 1 };
}

function clampCamera() {
  const maxExtent = (G.GRID_R + 5) * G.CELL;
  G.cam.x = Math.max(-maxExtent, Math.min(maxExtent, G.cam.x));
  G.cam.y = Math.max(-maxExtent, Math.min(maxExtent, G.cam.y));
  G.cam.zoom = Math.max(0.2, Math.min(3, G.cam.zoom));
}
