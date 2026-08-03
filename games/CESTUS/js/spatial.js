// ============================================================
// CESTUS CONTROL — Spatial indexes
// Rebuilt once per frame to avoid full entity scans per tower/projectile.
// ============================================================

const SPATIAL_BUCKET_SIZE = CONFIG.CELL * 2;
const SPATIAL_KEY_OFFSET = 32768;
const SPATIAL_KEY_STRIDE = 65536;

function spatialKey(bx, by) {
  return (bx + SPATIAL_KEY_OFFSET) * SPATIAL_KEY_STRIDE + by + SPATIAL_KEY_OFFSET;
}

function rebuildSpatialIndexes() {
  if (!(G._enemyGrid instanceof Map)) G._enemyGrid = new Map();
  if (!(G._enemyById instanceof Map)) G._enemyById = new Map();
  if (!(G._moduleById instanceof Map)) G._moduleById = new Map();
  if (!(G._moduleGrid instanceof Map)) G._moduleGrid = new Map();

  G._enemyGrid.clear();
  G._enemyById.clear();
  G._moduleById.clear();
  G._moduleGrid.clear();
  if (!Array.isArray(G._protectors)) G._protectors = [];
  G._protectors.length = 0;

  let liveEnemies = 0;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i];
    if (!e.alive) continue;
    liveEnemies++;
    if (e.isProtector) G._protectors.push(e);
    G._enemyById.set(e.id, e);
    const bx = Math.floor(e.x / SPATIAL_BUCKET_SIZE);
    const by = Math.floor(e.y / SPATIAL_BUCKET_SIZE);
    const key = spatialKey(bx, by);
    let bucket = G._enemyGrid.get(key);
    if (!bucket) {
      bucket = [];
      G._enemyGrid.set(key, bucket);
    }
    bucket.push(e);
  }

  for (let i = 0; i < G.modules.length; i++) {
    const mod = G.modules[i];
    if (!mod.alive) continue;
    G._moduleById.set(mod.id, mod);
    const bx = Math.floor(mod.x / SPATIAL_BUCKET_SIZE);
    const by = Math.floor(mod.y / SPATIAL_BUCKET_SIZE);
    const key = spatialKey(bx, by);
    let bucket = G._moduleGrid.get(key);
    if (!bucket) {
      bucket = [];
      G._moduleGrid.set(key, bucket);
    }
    bucket.push(mod);
  }
  G.liveEnemyCount = liveEnemies;
}

function forEachEnemyInRange(x, y, radius, callback) {
  const grid = G._enemyGrid;
  if (!(grid instanceof Map)) return;
  const radiusSq = radius * radius;
  const minBx = Math.floor((x - radius) / SPATIAL_BUCKET_SIZE);
  const maxBx = Math.floor((x + radius) / SPATIAL_BUCKET_SIZE);
  const minBy = Math.floor((y - radius) / SPATIAL_BUCKET_SIZE);
  const maxBy = Math.floor((y + radius) / SPATIAL_BUCKET_SIZE);

  for (let bx = minBx; bx <= maxBx; bx++) {
    for (let by = minBy; by <= maxBy; by++) {
      const bucket = grid.get(spatialKey(bx, by));
      if (!bucket) continue;
      for (let i = 0; i < bucket.length; i++) {
        const e = bucket[i];
        if (!e.alive) continue;
        const dx = e.x - x;
        const dy = e.y - y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= radiusSq && callback(e, distSq) === false) return;
      }
    }
  }
}

function findClosestEnemy(x, y, radius, excludeIds) {
  let closest = null;
  let closestDistSq = radius * radius;
  forEachEnemyInRange(x, y, radius, (e, distSq) => {
    if ((!excludeIds || !excludeIds.has(e.id)) && distSq < closestDistSq) {
      closest = e;
      closestDistSq = distSq;
    }
  });
  return closest;
}

function forEachModuleInRange(x, y, radius, callback) {
  const grid = G._moduleGrid;
  if (!(grid instanceof Map)) return;
  const radiusSq = radius * radius;
  const minBx = Math.floor((x - radius) / SPATIAL_BUCKET_SIZE);
  const maxBx = Math.floor((x + radius) / SPATIAL_BUCKET_SIZE);
  const minBy = Math.floor((y - radius) / SPATIAL_BUCKET_SIZE);
  const maxBy = Math.floor((y + radius) / SPATIAL_BUCKET_SIZE);

  for (let bx = minBx; bx <= maxBx; bx++) {
    for (let by = minBy; by <= maxBy; by++) {
      const bucket = grid.get(spatialKey(bx, by));
      if (!bucket) continue;
      for (let i = 0; i < bucket.length; i++) {
        const mod = bucket[i];
        if (!mod.alive) continue;
        const dx = mod.x - x;
        const dy = mod.y - y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= radiusSq && callback(mod, distSq) === false) return;
      }
    }
  }
}

function findClosestModule(x, y) {
  const grid = G._moduleGrid;
  if (!(grid instanceof Map) || grid.size === 0) return null;
  const originBx = Math.floor(x / SPATIAL_BUCKET_SIZE);
  const originBy = Math.floor(y / SPATIAL_BUCKET_SIZE);
  const maxRing = Math.ceil((G.GRID_R * G.CELL * 2) / SPATIAL_BUCKET_SIZE) + 2;
  let closest = null;
  let closestDistSq = Infinity;

  for (let ring = 0; ring <= maxRing; ring++) {
    const minBx = originBx - ring;
    const maxBx = originBx + ring;
    const minBy = originBy - ring;
    const maxBy = originBy + ring;
    for (let bx = minBx; bx <= maxBx; bx++) {
      for (let by = minBy; by <= maxBy; by++) {
        if (ring > 0 && bx !== minBx && bx !== maxBx && by !== minBy && by !== maxBy) continue;
        const bucket = grid.get(spatialKey(bx, by));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const mod = bucket[i];
          if (!mod.alive) continue;
          const dx = mod.x - x;
          const dy = mod.y - y;
          const distSq = dx * dx + dy * dy;
          if (distSq < closestDistSq) {
            closest = mod;
            closestDistSq = distSq;
          }
        }
      }
    }

    if (closest) {
      const left = minBx * SPATIAL_BUCKET_SIZE;
      const right = (maxBx + 1) * SPATIAL_BUCKET_SIZE;
      const top = minBy * SPATIAL_BUCKET_SIZE;
      const bottom = (maxBy + 1) * SPATIAL_BUCKET_SIZE;
      const minOutside = Math.min(x - left, right - x, y - top, bottom - y);
      if (closestDistSq <= minOutside * minOutside) return closest;
    }
  }
  return closest;
}

function getEnemyById(id) {
  const e = G._enemyById instanceof Map ? G._enemyById.get(id) : null;
  return e && e.alive ? e : null;
}

function getModuleById(id) {
  const mod = G._moduleById instanceof Map ? G._moduleById.get(id) : null;
  return mod && mod.alive ? mod : null;
}
