// ============================================================
// CESTUS CONTROL — Grid System
// Circular grid, coordinate helpers, placement validation
// ============================================================

function worldPos(gx, gy) {
  return { x: gx * G.CELL + G.CELL * 0.5, y: gy * G.CELL + G.CELL * 0.5 };
}

function screenToGrid(sx, sy) {
  const wx = (sx - W / 2) / G.cam.zoom + G.cam.x;
  const wy = (sy - H / 2) / G.cam.zoom + G.cam.y;
  const gx = Math.floor(wx / G.CELL);
  const gy = Math.floor(wy / G.CELL);
  return { gx, gy, wx, wy };
}

function screenToWorld(sx, sy) {
  return {
    x: (sx - W / 2) / G.cam.zoom + G.cam.x,
    y: (sy - H / 2) / G.cam.zoom + G.cam.y,
  };
}

function isInsideCircle(gx, gy) {
  const cx = gx + 0.5, cy = gy + 0.5;
  return Math.hypot(cx, cy) <= G.GRID_R;
}

function isAdjacent(a, b) {
  const dx = Math.abs(a.gx - b.gx);
  const dy = Math.abs(a.gy - b.gy);
  return dx + dy === 1; // 4-directional adjacency
}

function canPlaceModule(gx, gy) {
  if (!isInsideCircle(gx, gy)) return false;
  if (G.modules.some(m => m.gx === gx && m.gy === gy && m.alive)) return false;
  return G.modules.some(m => m.alive && isAdjacent({ gx, gy }, m));
}

function getModuleAt(gx, gy) {
  return G.modules.find(m => m.gx === gx && m.gy === gy && m.alive) || null;
}

function generateGlitchZones() {
  G.glitchZones = [];
  const outerR = G.GRID_R + 2;
  const count = 52;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.25;
    const r = outerR + Math.random() * 5;
    G.glitchZones.push({
      x: Math.cos(angle) * r * G.CELL,
      y: Math.sin(angle) * r * G.CELL,
      worldR: (Math.random() * 2.5 + 1.5) * G.CELL,
      t: Math.random() * 1000,
      angle,
    });
  }
}

// ============================================================
// A* PATHFINDING (simplified grid-based)
// ============================================================
function findPath(startGx, startGy, endGx, endGy) {
  const key = (x, y) => x + ',' + y;
  const open = [];
  const closed = new Set();
  const gScore = {};
  const fScore = {};
  const cameFrom = {};

  const sk = key(startGx, startGy);
  gScore[sk] = 0;
  fScore[sk] = Math.hypot(endGx - startGx, endGy - startGy);
  open.push({ gx: startGx, gy: startGy, f: fScore[sk] });

  const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
  let iterations = 0;
  const maxIter = 400;

  while (open.length > 0 && iterations < maxIter) {
    iterations++;
    // Find lowest f
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const current = open.splice(bestIdx, 1)[0];
    const ck = key(current.gx, current.gy);

    if (current.gx === endGx && current.gy === endGy) {
      // Reconstruct path
      const path = [];
      let k = ck;
      while (k) {
        const [px, py] = k.split(',').map(Number);
        path.unshift({ gx: px, gy: py });
        k = cameFrom[k];
      }
      return path;
    }

    closed.add(ck);

    for (const [dx, dy] of dirs) {
      const nx = current.gx + dx;
      const ny = current.gy + dy;
      const nk = key(nx, ny);

      if (closed.has(nk)) continue;
      if (!isInsideCircle(nx, ny)) continue;

      // Check if blocked by a module (except destination)
      const blocker = getModuleAt(nx, ny);
      if (blocker && !(nx === endGx && ny === endGy)) continue;

      const tentG = (gScore[ck] || 0) + 1;
      if (tentG < (gScore[nk] || Infinity)) {
        cameFrom[nk] = ck;
        gScore[nk] = tentG;
        fScore[nk] = tentG + Math.hypot(endGx - nx, endGy - ny);
        if (!open.some(o => o.gx === nx && o.gy === ny)) {
          open.push({ gx: nx, gy: ny, f: fScore[nk] });
        }
      }
    }
  }

  return null; // No path found
}

// Get core grid position
function getCorePos() {
  const core = G.modules.find(m => m.typeId === 'core' && m.alive);
  return core ? { gx: core.gx, gy: core.gy } : { gx: 0, gy: 0 };
}
