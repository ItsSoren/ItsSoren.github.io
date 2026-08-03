// ============================================================
// CESTUS CONTROL — Renderer
// All Canvas drawing: grid, modules, enemies, projectiles, FX
// ============================================================

let cachedVignetteGradient = null;
let cachedVignetteKey = '';
let cachedGridGradient = null;
let cachedGridGradientKey = '';

function render(now) {
  const renderLoad = G.enemies.length + G.projectiles.length * 1.5 + G.particles.length * 0.35 + G.modules.length * 0.5;
  G._metricTick = (G._metricTick || 0) + 1;
  if (G._metricTick % 30 === 0) {
    C.dataset.modules = String(G.modules.filter(m => m.alive).length);
    C.dataset.camera = [Math.round(G.cam.x),Math.round(G.cam.y),Number(G.cam.zoom).toFixed(2)].join(',');
    C.dataset.grid = [G.GRID_R,G.CELL].join(',');
    C.dataset.rendering = '1';
  }
  if (GRAPHICS.autoQuality) {
    let desiredTier = 0;
    if (renderLoad > 1050 || G.fpsDisplay < 42) desiredTier = 2;
    else if (renderLoad > 620 || G.fpsDisplay < 52) desiredTier = 1;
    G._fxTier = G._fxTier || 0;
    if (desiredTier > G._fxTier) {
      G._fxTier = desiredTier;
      G._fxRecoveryFrames = 0;
    } else if (desiredTier < G._fxTier && renderLoad < 480 && G.fpsDisplay > 55) {
      G._fxRecoveryFrames = (G._fxRecoveryFrames || 0) + 1;
      if (G._fxRecoveryFrames > 75) { G._fxTier--; G._fxRecoveryFrames = 0; }
    } else {
      G._fxRecoveryFrames = 0;
    }
    G._reducedFx = G._fxTier >= 2;
  } else {
    G._fxTier = 0;
    G._reducedFx = false;
  }

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  const shake = (G.screenShake || 0) * GRAPHICS.screenShake;
  const shakeX = shake > 0.05 ? (Math.random() - 0.5) * shake : 0;
  const shakeY = shake > 0.05 ? (Math.random() - 0.5) * shake : 0;
  G.screenShake = Math.max(0, (G.screenShake || 0) * 0.86 - 0.03);
  ctx.translate(W / 2 - G.cam.x * G.cam.zoom + shakeX, H / 2 - G.cam.y * G.cam.zoom + shakeY);
  ctx.scale(G.cam.zoom, G.cam.zoom);

  // Compute viewport bounds in world coords for culling
  const vpLeft = G.cam.x - W / (2 * G.cam.zoom) - 100;
  const vpTop = G.cam.y - H / (2 * G.cam.zoom) - 100;
  const vpRight = G.cam.x + W / (2 * G.cam.zoom) + 100;
  const vpBottom = G.cam.y + H / (2 * G.cam.zoom) + 100;
  const vp = G._vp || (G._vp = {});
  vp.left = vpLeft;
  vp.top = vpTop;
  vp.right = vpRight;
  vp.bottom = vpBottom;

  drawGrid(now);
  drawRiftLanes(now);
  drawGlitchStorm(now);
  drawModules(now);
  drawPatrolUnits();
  drawEnemies();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
  drawPlacementPreview(now);

  ctx.restore();
  drawScreenEffects(now);

  // FPS counter (drawn outside world transform)
  if (G.fpsDisplay !== undefined) {
    const fpsNow = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!G.fpsRealLast) G.fpsRealLast = fpsNow;
    G.fpsFrames++;
    if (fpsNow - G.fpsRealLast >= 1000) {
      const fpsWindow = Math.max(1, fpsNow - G.fpsRealLast);
      G.fpsDisplay = Math.round(G.fpsFrames * 1000 / fpsWindow);
      G.fpsFrames = 0;
      G.fpsRealLast = fpsNow;
      C.dataset.fps = String(G.fpsDisplay);
      C.dataset.entities = String(G.enemies.length + G.projectiles.length + G.particles.length);
      C.dataset.modules = String(G.modules.filter(m => m.alive).length);
      C.dataset.enemies = String(G.enemies.length);
      C.dataset.projectiles = String(G.projectiles.length);
      C.dataset.particles = String(G.particles.length);
      C.dataset.preset = GRAPHICS.preset;
      C.dataset.renderScale = String(GRAPHICS.renderScale);
      C.dataset.reducedFx = G._reducedFx ? '1' : '0';
      C.dataset.fxTier = String(G._fxTier || 0);
    }
    if (GRAPHICS.fpsCounter) {
      ctx.save();
      ctx.font = '12px Share Tech Mono, monospace';
      ctx.fillStyle = G.fpsDisplay < 30 ? '#ff667a' : G.fpsDisplay < 50 ? '#ffd166' : '#63e6d2aa';
      ctx.textAlign = 'left';
      ctx.fillText('FPS: ' + G.fpsDisplay, 230, 78);
      ctx.restore();
    }
  }
}

// ============================================================
// RIFT LANES — persistent, readable invasion fronts
// ============================================================
function drawRiftLanes(now) {
  const portals = G.riftPortals;
  if (!portals || !portals.length) return;
  const core = G.modules.find(m => m.alive && m.typeId === 'core') || { x:G.CELL*.5, y:G.CELL*.5 };
  const reduced = G._reducedFx;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < portals.length; i++) {
    const p = portals[i];
    const color = p.color || '#63e6d2';
    const dx = core.x - p.x, dy = core.y - p.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const bend = ((i % 2) ? 1 : -1) * Math.min(90, len * .12);
    const cx = (p.x + core.x) * .5 - dy / len * bend;
    const cy = (p.y + core.y) * .5 + dx / len * bend;

    ctx.globalAlpha = reduced ? .11 : .16;
    ctx.strokeStyle = color;
    ctx.lineWidth = reduced ? 5 : 9;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(cx, cy, core.x, core.y);
    ctx.stroke();

    ctx.globalAlpha = reduced ? .32 : .55;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([9, 16]);
    ctx.lineDashOffset = -(now * .045 + i * 17);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(cx, cy, core.x, core.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!reduced) {
      for (let k = 0; k < 4; k++) {
        const t = (now * .00013 + k / 4 + i * .17) % 1;
        const mt = 1 - t;
        const x = mt*mt*p.x + 2*mt*t*cx + t*t*core.x;
        const y = mt*mt*p.y + 2*mt*t*cy + t*t*core.y;
        ctx.globalAlpha = .35 + t * .45;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 1.5 + t * 2.2, 0, Math.PI*2); ctx.fill();
      }
    }

    if (p.x < G._vp.left - 80 || p.x > G._vp.right + 80 || p.y < G._vp.top - 80 || p.y > G._vp.bottom + 80) continue;
    const pulse = 1 + Math.sin(now * .004 + i) * .08;
    const radius = (reduced ? 20 : 27) * pulse;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(now * .00045 * (i % 2 ? 1 : -1));
    ctx.globalAlpha = .72;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    for (let a = 0; a < 3; a++) {
      ctx.beginPath();
      ctx.arc(0, 0, radius + a * 7, a * 2.05, a * 2.05 + 1.18);
      ctx.stroke();
    }
    ctx.rotate(-now * .0012);
    ctx.globalAlpha = .26;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0,0,radius*.72,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = .92;
    ctx.strokeRect(-5,-5,10,10);
    ctx.restore();
  }
  ctx.restore();
}

function drawScreenEffects(now) {
  const ambient = GRAPHICS.ambientIntensity * (G._reducedFx ? 0.25 : 1);
  if (ambient > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const count = Math.floor(26 * ambient);
    for (let i = 0; i < count; i++) {
      const seed = i * 97.13;
      const x = (seed * 17 + now * (0.006 + (i % 5) * 0.001)) % (W + 80) - 40;
      const y = (seed * 29 + Math.sin(now * 0.00035 + i) * 90 + H * 2) % H;
      const alpha = 0.08 + (i % 4) * 0.025;
      ctx.globalAlpha = alpha * ambient;
      ctx.fillStyle = i % 3 === 0 ? '#ffb26b' : '#63e6d2';
      ctx.beginPath(); ctx.arc(x,y,0.8 + (i%3)*0.45,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  if (GRAPHICS.chromatic && !G._reducedFx) {
    ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=0.045 * GRAPHICS.bloom;
    ctx.fillStyle='#ff6b7a'; ctx.fillRect(0,0,2,H);
    ctx.fillStyle='#63e6d2'; ctx.fillRect(W-2,0,2,H); ctx.restore();
  }

  if (GRAPHICS.vignette) {
    ctx.save();
    const vignetteKey = W + 'x' + H;
    if (!cachedVignetteGradient || cachedVignetteKey !== vignetteKey) {
      const gradient = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.18,W/2,H/2,Math.max(W,H)*0.72);
      gradient.addColorStop(0,'rgba(1,12,18,0)');
      gradient.addColorStop(0.72,'rgba(1,12,18,0.04)');
      gradient.addColorStop(1,'rgba(1,9,15,0.38)');
      cachedVignetteGradient = gradient;
      cachedVignetteKey = vignetteKey;
    }
    ctx.fillStyle=cachedVignetteGradient; ctx.fillRect(0,0,W,H); ctx.restore();
  }

  if (GRAPHICS.scanlines && !G._reducedFx) {
    ctx.save(); ctx.globalAlpha=0.045; ctx.fillStyle='#bfffee';
    for(let y=0;y<H;y+=5) ctx.fillRect(0,y,W,1);
    ctx.restore();
  }
}

// ============================================================
// GRID
// ============================================================
function drawGrid(now) {
  ctx.save();
  ctx.globalAlpha = GRAPHICS.gridIntensity;
  const CELL = G.CELL;
  const R = G.GRID_R;
  const camLeft = G.cam.x - W / (2 * G.cam.zoom);
  const camTop = G.cam.y - H / (2 * G.cam.zoom);
  const camRight = camLeft + W / G.cam.zoom;
  const camBottom = camTop + H / G.cam.zoom;
  const startX = Math.max(-R - 1, Math.floor(camLeft / CELL));
  const startY = Math.max(-R - 1, Math.floor(camTop / CELL));
  const endX = Math.min(R + 1, Math.ceil(camRight / CELL));
  const endY = Math.min(R + 1, Math.ceil(camBottom / CELL));

  // Circular play area background — centered at world (0,0)
  ctx.save();
  const gridGradientKey = R + ':' + CELL;
  if (!cachedGridGradient || cachedGridGradientKey !== gridGradientKey) {
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * CELL);
    grad.addColorStop(0, 'rgba(18, 61, 72, 0.98)');
    grad.addColorStop(0.55, 'rgba(9, 39, 53, 0.96)');
    grad.addColorStop(1, 'rgba(4, 20, 31, 0.98)');
    cachedGridGradient = grad;
    cachedGridGradientKey = gridGradientKey;
  }
  ctx.fillStyle = cachedGridGradient;
  ctx.beginPath();
  ctx.arc(0, 0, R * CELL, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle checker texture, batched into a single canvas fill.
  ctx.beginPath();
  for (let gx = startX; gx < endX; gx++) {
    for (let gy = startY; gy < endY; gy++) {
      if (!isInsideCircle(gx, gy)) continue;
      if ((gx + gy) & 1) ctx.rect(gx * CELL, gy * CELL, CELL, CELL);
    }
  }
  ctx.fillStyle = 'rgba(93,230,205,0.035)';
  ctx.fill();

  // Grid lines clipped to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, R * CELL, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(99, 230, 210, 0.13)';
  ctx.lineWidth = 1; // Slightly thicker
  ctx.beginPath();
  for (let gx = startX; gx <= endX; gx++) {
    ctx.moveTo(gx * CELL, startY * CELL);
    ctx.lineTo(gx * CELL, endY * CELL);
  }
  for (let gy = startY; gy <= endY; gy++) {
    ctx.moveTo(startX * CELL, gy * CELL);
    ctx.lineTo(endX * CELL, gy * CELL);
  }
  ctx.stroke();
  ctx.restore();

  // Circle border
  ctx.strokeStyle = 'rgba(0,180,255,0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * CELL, 0, Math.PI * 2);
  ctx.stroke();

  // Placement highlights
  if (G.placingModule) {
    for (let gx = startX; gx < endX; gx++) {
      for (let gy = startY; gy < endY; gy++) {
        if (canPlaceModule(gx, gy)) {
          const wx = gx * CELL;
          const wy = gy * CELL;
          ctx.fillStyle = 'rgba(0,255,136,0.06)';
          ctx.strokeStyle = 'rgba(0,255,136,0.25)';
          ctx.lineWidth = 1;
          ctx.fillRect(wx + 1, wy + 1, CELL - 2, CELL - 2);
          ctx.strokeRect(wx + 1, wy + 1, CELL - 2, CELL - 2);
        }
      }
    }
  }
  ctx.restore();
}

// ============================================================
// GLITCH STORM
// ============================================================
function drawGlitchStorm(now) {
  const CELL = G.CELL;
  const R = G.GRID_R;
  const t = now * 0.001;

  // Outer storm ring — centered at world (0,0)
  ctx.save();
  const stormInnerR = R * CELL * 0.95;
  const stormOuterR = (R + 10) * CELL;
  const stormGrad = ctx.createRadialGradient(0, 0, stormInnerR, 0, 0, stormOuterR);
  stormGrad.addColorStop(0, 'rgba(255,177,102,0.0)');
  stormGrad.addColorStop(0.08, 'rgba(255,177,102,0.12)');
  stormGrad.addColorStop(0.2, 'rgba(255,112,93,0.28)');
  stormGrad.addColorStop(0.45, 'rgba(48,190,180,0.42)');
  stormGrad.addColorStop(0.7, 'rgba(13,86,97,0.68)');
  stormGrad.addColorStop(0.9, 'rgba(5,35,46,0.88)');
  stormGrad.addColorStop(1, 'rgba(3,18,27,0.98)');
  ctx.fillStyle = stormGrad;
  ctx.fillRect(-stormOuterR, -stormOuterR, stormOuterR * 2, stormOuterR * 2);

  // Inner edge glow ring (pulsing)
  const pulseAlpha = 0.15 + Math.sin(t * 2) * 0.08;
  ctx.strokeStyle = `rgba(255, 190, 105, ${pulseAlpha})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffb26b';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, stormInnerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Glitch zones — nebula clouds with lightning
  for (let idx = 0; idx < G.glitchZones.length; idx++) {
    const gz = G.glitchZones[idx];
    gz.t += 0.03 + (idx % 5) * 0.005;
    const cullR = gz.worldR * 2;
    const vp = G._vp;
    if (gz.x + cullR < vp.left || gz.x - cullR > vp.right || gz.y + cullR < vp.top || gz.y - cullR > vp.bottom) continue;
    const alpha = 0.3 + Math.sin(gz.t) * 0.12 + Math.sin(gz.t * 1.7) * 0.08;

    // Soft outer nebula glow
    const outerR = gz.worldR * 2;
    const gradOut = ctx.createRadialGradient(gz.x, gz.y, 0, gz.x, gz.y, outerR);
    const hue = (idx % 3 === 0 ? 24 : 174) + Math.sin(gz.t * 0.5) * 12;
    gradOut.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha * 0.4})`);
    gradOut.addColorStop(0.4, `hsla(${hue + 20}, 80%, 50%, ${alpha * 0.2})`);
    gradOut.addColorStop(1, 'transparent');
    ctx.fillStyle = gradOut;
    ctx.beginPath();
    ctx.arc(gz.x, gz.y, outerR, 0, Math.PI * 2);
    ctx.fill();

    // Core glow
    if (!G._reducedFx) {
      const gradIn = ctx.createRadialGradient(gz.x, gz.y, 0, gz.x, gz.y, gz.worldR);
      gradIn.addColorStop(0, `hsla(${hue - 10}, 100%, 75%, ${alpha * 0.7})`);
      gradIn.addColorStop(0.6, `hsla(${hue}, 90%, 45%, ${alpha * 0.3})`);
      gradIn.addColorStop(1, `hsla(${hue + 30}, 70%, 25%, ${alpha * 0.05})`);
      ctx.fillStyle = gradIn;
      ctx.beginPath();
      ctx.arc(gz.x, gz.y, gz.worldR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lightning arcs (more frequent, forked)
    if (!G._reducedFx && Math.random() < 0.15) {
      const a = Math.random() * Math.PI * 2;
      const len = gz.worldR * (0.4 + Math.random() * 0.8);
      const sx = gz.x + Math.cos(a) * len * 0.15;
      const sy = gz.y + Math.sin(a) * len * 0.15;
      const ex = gz.x + Math.cos(a) * len;
      const ey = gz.y + Math.sin(a) * len;
      
      ctx.strokeStyle = `rgba(220, 255, 244, ${alpha * 1.5})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.shadowColor = '#63e6d2';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      // Jagged lightning path
      const mx = (sx + ex) / 2 + (Math.random() - 0.5) * len * 0.3;
      const my = (sy + ey) / 2 + (Math.random() - 0.5) * len * 0.3;
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

// ============================================================
// MODULES
// ============================================================
function drawModules(now) {
  const CELL = G.CELL;
  const vp = G._vp;
  G.modules.forEach(mod => {
    if (!mod.alive) return;
    if (mod.x < vp.left || mod.x > vp.right || mod.y < vp.top || mod.y > vp.bottom) return;
    const def = MODULE_TYPES[mod.typeId];
    const stats = getModuleStats(mod);
    const x = mod.x, y = mod.y;
    const isSelected = G.selectedModule === mod;
    mod.flash = Math.max(0, mod.flash - 1);

    if (def.isPoisonAura) {
      ctx.beginPath();
      ctx.arc(x, y, stats.range, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(136, 255, 68, 0.08)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(136, 255, 68, 0.2)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Range circle for shooters when selected
    if (isSelected && (def.isShooter || def.isCore)) {
      ctx.beginPath();
      ctx.arc(x, y, stats.range, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,200,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,200,255,0.02)';
      ctx.fill();
    }

    ctx.shadowColor = def.color;
    // Blur increases with MK level
    const baseBlur = isSelected ? 24 : 8 + Math.sin(now * 0.003) * 3;
    ctx.shadowBlur = (G._reducedFx || !GRAPHICS.shadows) ? 0 : baseBlur * (1 + (mod.mk - 1) * 0.2) * GRAPHICS.bloom;

    const size = CELL * 0.38;
    ctx.fillStyle = mod.flash > 0 ? '#ffffff' : def.color + '33';
    ctx.strokeStyle = mod.flash > 0 ? '#ffffff' : def.color;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    // Apply color tint & brightness based on MK level
    if (mod.mk > 1 && !G._reducedFx) {
      ctx.filter = `hue-rotate(${(mod.mk - 1) * 15}deg) brightness(${1 + (mod.mk - 1) * 0.15})`;
    }

    ctx.beginPath();
    if (def.isCore) {
      drawHexagon(ctx, x, y, size * 1.15);
    } else if (def.isPassive) {
      ctx.rect(x - size * 0.85, y - size * 0.85, size * 1.7, size * 1.7);
    } else {
      drawModuleBody(ctx, def.visual, x, y, size);
    }
    ctx.fill();
    ctx.stroke();
    drawModuleDetails(mod, def, x, y, size, now);

    // MK Visuals (Classic style, optimized)
    if (mod.mk >= 2) {
      const mkSpeed = now * 0.001 * (1 + (mod.mk - 1) * 0.2);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(mkSpeed);
      
      const glowStr = def.color;
      ctx.strokeStyle = glowStr;
      ctx.globalAlpha = 0.6;
      
      if (mod.mk === 2) {
        ctx.lineWidth = 1.5;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mod.mk === 3) {
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8, 2, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.rotate(-mkSpeed * 2);
        ctx.setLineDash([4, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.1, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mod.mk === 4) {
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 12]);
        drawHexagon(ctx, 0, 0, size * 1.5);
        ctx.stroke();
        ctx.rotate(-mkSpeed * 1.5);
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.25, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mod.mk === 5) {
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 10, 5, 10]);
        drawHexagon(ctx, 0, 0, size * 1.7);
        ctx.stroke();
        ctx.rotate(-mkSpeed * 2);
        ctx.beginPath();
        drawHexagon(ctx, 0, 0, size * 1.4);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    ctx.filter = 'none';
    ctx.shadowBlur = 0;

    // Burst animation (muzzle flash)
    if ((def.isShooter || def.isCore) && mod.burstAnim > 0) {
      mod.burstAnim--;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(mod.angle);
      ctx.fillStyle = def.color;
      ctx.globalAlpha = mod.burstAnim / 5;
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(size * 2, size * 0.35);
      ctx.lineTo(size * 2, -size * 0.35);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Icon
    ctx.font = `${CELL * 0.3}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = mod.flash > 0 ? '#000' : def.color;
    ctx.fillText(def.icon, x, y);

    // HP bar
    if (GRAPHICS.healthBars) {
      const hpRatio = mod.hp / stats.maxHp;
      const bw = CELL * 0.7, bx = x - bw / 2, by = y + size + 6;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = hpRatio > 0.5 ? '#63e6d2' : hpRatio > 0.25 ? '#ffd166' : '#ff667a';
      ctx.fillRect(bx, by, bw * Math.max(0, hpRatio), 4);
    }

    // Level badge
    ctx.font = '10px Orbitron, sans-serif';
    const lvlText = `L${mod.level}${mod.mk > 1 ? `/MK${mod.mk}` : ''}`;
    if (mod._levelLabel !== lvlText) {
      mod._levelLabel = lvlText;
      mod._levelLabelWidth = ctx.measureText(lvlText).width;
    }
    const tw = mod._levelLabelWidth;
    const badgeX = x + CELL * 0.5 - tw;
    const badgeY = y - CELL * 0.5;
    
    ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
    ctx.beginPath();
    ctx.roundRect(badgeX - 4, badgeY - 6, tw + 8, 14, 4);
    ctx.fill();
    
    ctx.fillStyle = def.color;
    ctx.textAlign = 'left';
    ctx.fillText(lvlText, badgeX, badgeY + 1);
    ctx.textAlign = 'center';

    // Aura indicator when selected
    if ((def.isAmplifier || def.isShield || def.isCollector || def.isRangeBoost || def.isRegen) && isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, CELL * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = def.color + '44';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  ctx.textBaseline = 'alphabetic';
}

function drawHexagon(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 - Math.PI / 6;
    if (i === 0) c.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
    else c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
  }
  c.closePath();
}

function drawModuleBody(c, visual, x, y, r) {
  switch (visual) {
    case 'prism':
    case 'diamond':
      c.moveTo(x, y-r); c.lineTo(x+r*0.78,y); c.lineTo(x,y+r); c.lineTo(x-r*0.78,y); c.closePath();
      break;
    case 'blade':
    case 'spire':
      c.moveTo(x+r,y); c.lineTo(x-r*0.7,y+r*0.55); c.lineTo(x-r*0.35,y); c.lineTo(x-r*0.7,y-r*0.55); c.closePath();
      break;
    case 'hex':
    case 'hammer':
      for (let i=0;i<6;i++) { const a=i*Math.PI/3; if(i===0)c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r); else c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } c.closePath();
      break;
    case 'flower':
      for (let i=0;i<12;i++) { const a=i*Math.PI/6; const rr=i%2===0?r:r*0.58; if(i===0)c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); else c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } c.closePath();
      break;
    case 'fan':
      c.moveTo(x+r,y); c.arc(x,y,r,-0.7,0.7); c.lineTo(x-r*0.55,y); c.closePath();
      break;
    case 'battery':
      c.roundRect(x-r*0.85,y-r*0.65,r*1.7,r*1.3,4); c.rect(x+r*0.85,y-r*0.25,r*0.22,r*0.5);
      break;
    case 'hourglass':
      c.moveTo(x-r,y-r); c.lineTo(x+r,y-r); c.lineTo(x-r*0.55,y); c.lineTo(x+r,y+r); c.lineTo(x-r,y+r); c.lineTo(x+r*0.55,y); c.closePath();
      break;
    case 'ring':
    case 'eye':
    case 'aurora':
      c.arc(x,y,r,0,Math.PI*2); c.moveTo(x+r*0.58,y); c.arc(x,y,r*0.58,0,Math.PI*2,true);
      break;
    case 'helix':
      c.moveTo(x-r,y-r*0.55); c.bezierCurveTo(x,y-r*1.1,x,y+r*1.1,x+r,y+r*0.55); c.lineTo(x+r,y-r*0.55); c.bezierCurveTo(x,y-r*0.05,x,y+r*0.05,x-r,y+r*0.55); c.closePath();
      break;
    default:
      c.arc(x, y, r, 0, Math.PI * 2);
  }
}

function drawModuleDetails(mod, def, x, y, size, now) {
  const detail = GRAPHICS.spriteDetail * (G._reducedFx ? 0.4 : 1);
  if (detail <= 0.08) return;
  const t = now * 0.001 * GRAPHICS.effectsSpeed;
  ctx.save();
  ctx.translate(x,y);

  // Mechanical barrel or sensor arm follows the actual target angle.
  if (def.isShooter || def.isCore) {
    ctx.save(); ctx.rotate(mod.angle || 0);
    ctx.strokeStyle = mod.flash > 0 ? '#fff' : def.color;
    ctx.lineWidth = 2 + Math.min(2,detail);
    ctx.beginPath(); ctx.moveTo(size*.15,0); ctx.lineTo(size*1.35,0); ctx.stroke();
    ctx.fillStyle = '#dffff8';
    ctx.beginPath(); ctx.moveTo(size*1.48,0);ctx.lineTo(size*1.14,size*.16);ctx.lineTo(size*1.14,-size*.16);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  // Luminous reactor core and an inner counter-rotating reticle.
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(.85,.38 + detail*.24);
  ctx.fillStyle = '#eaffff';
  ctx.beginPath(); ctx.arc(0,0,size*(.12 + Math.sin(t*3 + mod.id)*.025),0,Math.PI*2);ctx.fill();
  ctx.strokeStyle = def.color;
  ctx.lineWidth = Math.max(.6,detail);
  ctx.rotate(-t * (0.5 + (mod.mk||1)*.08));
  ctx.setLineDash([size*.35,size*.24]);
  ctx.beginPath();ctx.arc(0,0,size*.62,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);

  if (detail > .65) {
    const satellites = def.visual === 'flower' ? 6 : def.visual === 'prism' ? 4 : 3;
    ctx.rotate(t*1.7);
    for(let i=0;i<satellites;i++){
      const a=i*Math.PI*2/satellites;
      ctx.fillStyle=i%2?'#ffcf70':def.color;
      ctx.beginPath();ctx.arc(Math.cos(a)*size*.82,Math.sin(a)*size*.82,1.2+detail*.45,0,Math.PI*2);ctx.fill();
    }
  }

  if (detail > 1.15) {
    ctx.globalAlpha=.23;
    ctx.strokeStyle='#ffffff';ctx.lineWidth=.7;
    ctx.beginPath();ctx.arc(0,0,size*1.22 + Math.sin(t*2)*2,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
// PATROL UNITS
// ============================================================
function drawPatrolUnits() {
  const vp = G._vp;
  G.patrolUnits.forEach(u => {
    if (!u.alive) return;
    if (u.x < vp.left || u.x > vp.right || u.y < vp.top || u.y > vp.bottom) return;

    // Trail
    u.trail.forEach(t => {
      const a = t.life / 15;
      ctx.globalAlpha = a * 0.3;
      ctx.fillStyle = u.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3 * a, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Unit body
    ctx.shadowColor = u.color;
    ctx.shadowBlur = G._reducedFx ? 0 : (u.flash > 0 ? 15 : 6);
    ctx.fillStyle = u.flash > 0 ? '#ffffff' : u.color + '88';
    ctx.strokeStyle = u.flash > 0 ? '#ffffff' : u.color;
    ctx.lineWidth = 1.5;
    
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate(u.angle);
    ctx.beginPath();
    
    if (u.type === 'heavy') {
      // Square/Diamond
      ctx.rect(-6, -6, 12, 12);
    } else if (u.type === 'support') {
      // Cross
      ctx.moveTo(-6, -2); ctx.lineTo(-2, -2);
      ctx.lineTo(-2, -6); ctx.lineTo(2, -6);
      ctx.lineTo(2, -2); ctx.lineTo(6, -2);
      ctx.lineTo(6, 2); ctx.lineTo(2, 2);
      ctx.lineTo(2, 6); ctx.lineTo(-2, 6);
      ctx.lineTo(-2, 2); ctx.lineTo(-6, 2);
      ctx.closePath();
    } else {
      // Circle
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
    }
    
    ctx.fill();
    ctx.stroke();
    
    // Direction indicator
    ctx.fillStyle = u.color;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(4, 3);
    ctx.lineTo(4, -3);
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Mini HP bar
    if (GRAPHICS.healthBars) {
      const hpR = u.hp / u.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(u.x - 8, u.y - 12, 16, 2);
      ctx.fillStyle = u.color;
      ctx.fillRect(u.x - 8, u.y - 12, 16 * hpR, 2);
    }
  });
}

// ============================================================
// ENEMIES
// ============================================================
function drawEnemyShape(ctx, shape, size) {
  ctx.beginPath();
  switch (shape) {
    case 'square':
      ctx.rect(-size, -size, size * 2, size * 2);
      break;
    case 'triangle':
      ctx.moveTo(size, 0);
      ctx.lineTo(-size, size * 0.7);
      ctx.lineTo(-size, -size * 0.7);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.7, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.7, 0);
      ctx.closePath();
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        if (i === 0) ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size);
        else ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
      }
      ctx.closePath();
      break;
    default:
      ctx.arc(0, 0, size, 0, Math.PI * 2);
  }
}

function drawEnemies() {
  const vp = G._vp;

  // Draw corpses as colored splatters that fade out
  if (GRAPHICS.corpses && G.corpses && G.corpses.length > 0) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    for (let i = 0; i < G.corpses.length; i++) {
      const c = G.corpses[i];
      if (c.x < vp.left || c.x > vp.right || c.y < vp.top || c.y > vp.bottom) continue;
      const alpha = Math.max(0, c.life / c.maxLife);
      // Colored splatter circle using enemy color
      if (G._reducedFx) {
        ctx.fillStyle = c.color + Math.floor(alpha * 45).toString(16).padStart(2, '0');
      } else {
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 1.8);
        grad.addColorStop(0, c.color + Math.floor(alpha * 60).toString(16).padStart(2, '0'));
        grad.addColorStop(0.5, c.color + Math.floor(alpha * 30).toString(16).padStart(2, '0'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
      }
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i];
    if (!e.alive && e.flash === 0) continue;
    if (e.x < vp.left || e.x > vp.right || e.y < vp.top || e.y > vp.bottom) continue;
    const x = e.x, y = e.y;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = (G._reducedFx || !GRAPHICS.shadows) ? 0 : 8 * GRAPHICS.bloom;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(e.angle);
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color + '88';
    ctx.strokeStyle = e.flash > 0 ? '#ffffff' : e.color;
    ctx.lineWidth = e.isBoss ? 2.5 : 1.5;

    drawEnemyShape(ctx, e.shape, e.size);
    ctx.fill();
    ctx.stroke();
    drawEnemyDetails(e);
    ctx.restore();
    ctx.shadowBlur = 0;

    // Slow effect indicator
    if (e.slowFactor < 1) {
      ctx.strokeStyle = '#88ddff66';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, e.size + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (e.markUntil > G.now) {
      ctx.strokeStyle = '#ffe66d'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x,y,e.size+9,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle = '#ffe66d'; ctx.fillRect(x-1,y-e.size-13,2,5);
    }
    if (e.armorShredUntil > G.now) {
      ctx.strokeStyle = '#b7f34a99'; ctx.setLineDash([1,4]);
      ctx.beginPath(); ctx.arc(x,y,e.size+11,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (e.silencedUntil > G.now) {
      ctx.fillStyle = '#69f0d1'; ctx.font = '9px Orbitron, monospace'; ctx.textAlign='center';
      ctx.fillText('EMP',x,y+e.size+17);
    }
    if (e.phased) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x,y,e.size+5,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // DOT indicator
    if (e.dots.length > 0) {
      ctx.strokeStyle = '#88ff4466';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(x, y, e.size + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Gamma charge indicator
    if (e.gammaCharge > 0) {
      ctx.strokeStyle = `rgba(136, 255, 0, ${0.3 + e.gammaCharge * 0.08})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, e.size + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Charge count
      ctx.font = '8px Orbitron, monospace';
      ctx.fillStyle = '#88ff00';
      ctx.textAlign = 'center';
      ctx.fillText('☢' + e.gammaCharge, x, y + e.size + 16);
    }

    // HP bar
    if (GRAPHICS.healthBars) {
      const hpR = e.hp / e.maxHp;
      const bw = e.size * 2.5, bx = x - bw / 2, by = y - e.size - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, bw, 3);
      ctx.fillStyle = e.color;
      ctx.fillRect(bx, by, bw * Math.max(0, hpR), 3);
    }

    if (e.isBoss) {
      ctx.font = '10px Orbitron, monospace';
      ctx.fillStyle = '#ff0066';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', x, y - e.size - 13);
    } else if (e.isElite) {
      ctx.font = '8px Orbitron, monospace';
      ctx.fillStyle = '#ffe89a';
      ctx.textAlign = 'center';
      ctx.fillText('ÉLITE', x, y - e.size - 12);
      ctx.strokeStyle = '#ffe89a88';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, e.size + 6 + Math.sin(G.now * .006) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Protector aura
    if (e.isProtector) {
      ctx.beginPath();
      ctx.arc(x, y, e.auraRange, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawEnemyDetails(e) {
  const detail = GRAPHICS.spriteDetail * (G._reducedFx ? .35 : 1);
  if (detail < .12) return;
  const s=e.size,t=G.now*.001*GRAPHICS.effectsSpeed;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.55;
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,Math.max(1.3,s*.16),0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=e.color;ctx.lineWidth=Math.max(.6,detail);
  ctx.beginPath();ctx.moveTo(s*.25,0);ctx.lineTo(s*.78,0);ctx.stroke();

  if(e.damageReduction>0 || e.slowResist>0){
    ctx.globalAlpha=.42;
    for(let i=-1;i<=1;i+=2){ctx.strokeRect(-s*.5,i*s*.38,s*.65,s*.17);}
  }
  if(e.isCommander){
    ctx.globalAlpha=.75;ctx.rotate(-e.angle+t);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ctx.fillStyle='#ffcf70';ctx.beginPath();ctx.arc(Math.cos(a)*s*1.05,Math.sin(a)*s*1.05,1.8,0,Math.PI*2);ctx.fill();}
  }
  if(e.isHealer || e.regenPerSec){
    ctx.strokeStyle='#9dffb0';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-s*.35,0);ctx.lineTo(s*.35,0);ctx.moveTo(0,-s*.35);ctx.lineTo(0,s*.35);ctx.stroke();
  }
  if(e.isBoss && detail>.7){
    ctx.globalAlpha=.3;ctx.rotate(t*.7);ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,0,s*1.28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.restore();
}

// ============================================================
// PROJECTILES
// ============================================================
function resolveProjectileStyle(p) {
  if (p.projectileStyle) return p.projectileStyle;
  const source = G._moduleById && G._moduleById.get ? G._moduleById.get(p.sourceId) : null;
  return source ? getProjectileStyle(MODULE_TYPES[source.typeId], p.elemental, source.typeId) : 'pulse';
}

function drawProjectileBeam(p, style) {
  const alpha = Math.max(0, Math.min(1, p.beamLife / 8));
  const dx=p.tx-p.x,dy=p.ty-p.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.lineCap='round';

  const line = (offset,width,color,lineAlpha) => {
    ctx.globalAlpha=alpha*lineAlpha;ctx.strokeStyle=color;ctx.lineWidth=width;
    ctx.beginPath();ctx.moveTo(p.x+nx*offset,p.y+ny*offset);ctx.lineTo(p.tx+nx*offset,p.ty+ny*offset);ctx.stroke();
  };

  if(style==='electric'){
    ctx.globalAlpha=alpha;ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(1.2,p.size);
    ctx.beginPath();ctx.moveTo(p.x,p.y);
    for(let i=1;i<7;i++){const t=i/7;const jitter=(i%2?1:-1)*(3+p.size);ctx.lineTo(p.x+dx*t+nx*jitter,p.y+dy*t+ny*jitter);}
    ctx.lineTo(p.tx,p.ty);ctx.stroke();
    line(0,Math.max(.7,p.size*.3),'#ffffff',.9);
  }else if(style==='helix'){
    line(-3,p.size,p.color,.7);line(3,p.size,p.color,.7);line(0,Math.max(.8,p.size*.35),'#ffffff',.85);
  }else if(style==='leech'){
    ctx.globalAlpha=alpha;ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(1.2,p.size);
    ctx.beginPath();ctx.moveTo(p.x,p.y);
    for(let i=1;i<=10;i++){const t=i/10;const wave=Math.sin(t*Math.PI*4+G.now*.02)*4;ctx.lineTo(p.x+dx*t+nx*wave,p.y+dy*t+ny*wave);}ctx.stroke();
  }else{
    line(0,p.size*3.2,p.color,.16);line(0,p.size+1,p.color,.9);line(0,Math.max(.7,p.size*.28),'#ffffff',.88);
  }
  ctx.restore();
}

function drawProjectileTrail(p, style, angle, size) {
  if (GRAPHICS.trailStrength <= 0 || G._fxTier >= 2) return;
  const length=(style==='phase'?34:style==='tracer'?24:18)*GRAPHICS.trailStrength;
  const backX=p.x-Math.cos(angle)*length,backY=p.y-Math.sin(angle)*length;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  if(style==='helix'){
    const nx=-Math.sin(angle)*2.8,ny=Math.cos(angle)*2.8;
    ctx.globalAlpha=.45;ctx.strokeStyle=p.color;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(p.x+nx,p.y+ny);ctx.lineTo(backX-nx,backY-ny);ctx.moveTo(p.x-nx,p.y-ny);ctx.lineTo(backX+nx,backY+ny);ctx.stroke();
  }else if(style==='acid'){
    ctx.fillStyle=p.color;ctx.globalAlpha=.4;
    for(let i=1;i<=3;i++){const t=i/4;ctx.beginPath();ctx.arc(p.x+(backX-p.x)*t,p.y+(backY-p.y)*t,Math.max(.7,size*(1-t)*.45),0,Math.PI*2);ctx.fill();}
  }else{
    ctx.globalAlpha=.18;ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(2,size*1.8);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(backX,backY);ctx.stroke();
    ctx.globalAlpha=.65;ctx.lineWidth=Math.max(.7,size*.3);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(backX,backY);ctx.stroke();
  }
  ctx.restore();
}

function drawProjectileGlyph(p, style, angle, size) {
  const t=G.now*.012*GRAPHICS.effectsSpeed;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.globalCompositeOperation='lighter';
  if(G._fxTier===0){ctx.globalAlpha=.16;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,size*2.4,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;ctx.fillStyle=p.color;ctx.strokeStyle=p.color;ctx.lineWidth=1.2;
  if(style==='tracer'){
    ctx.fillRect(-size*2.3,-size*.55,size*4.6,size*1.1);ctx.fillStyle='#fff';ctx.fillRect(size*.2,-size*.2,size*1.8,size*.4);
  }else if(style==='prism'){
    ctx.rotate(t*.08);ctx.beginPath();ctx.moveTo(size*1.8,0);ctx.lineTo(0,size);ctx.lineTo(-size*1.2,0);ctx.lineTo(0,-size);ctx.closePath();ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(-1,-1,2,2);
  }else if(style==='phase'){
    ctx.globalCompositeOperation='source-over';ctx.fillStyle='#061018';ctx.beginPath();ctx.moveTo(size*2.6,0);ctx.lineTo(-size*1.8,size*.72);ctx.lineTo(-size*.8,0);ctx.lineTo(-size*1.8,-size*.72);ctx.closePath();ctx.fill();ctx.strokeStyle=p.color;ctx.stroke();
  }else if(style==='blade'||style==='shard'){
    ctx.beginPath();ctx.moveTo(size*2.2,0);ctx.lineTo(-size*.9,size*.75);ctx.lineTo(-size*.35,0);ctx.lineTo(-size*.9,-size*.75);ctx.closePath();ctx.fill();
  }else if(style==='acid'||style==='toxic'){
    ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,-size*1.8);ctx.quadraticCurveTo(size*1.3,size*.3,0,size*1.25);ctx.quadraticCurveTo(-size*1.3,size*.3,0,-size*1.8);ctx.fill();ctx.fillStyle='#eaff9a';ctx.beginPath();ctx.arc(0,size*.15,size*.28,0,Math.PI*2);ctx.fill();
  }else if(style==='chrono'){
    ctx.rotate(-angle+t*.05);ctx.beginPath();ctx.arc(0,0,size*1.15,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-size*.8);ctx.moveTo(0,0);ctx.lineTo(size*.65,0);ctx.stroke();
  }else if(style==='electric'){
    ctx.beginPath();ctx.moveTo(-size*1.7,-size*.5);ctx.lineTo(-size*.25,size*.2);ctx.lineTo(size*.15,-size*.7);ctx.lineTo(size*1.7,size*.45);ctx.stroke();
  }else if(style==='cluster'){
    for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.ellipse(size*.7,0,size*.75,size*.32,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,size*.3,0,Math.PI*2);ctx.fill();
  }else if(style==='helix'){
    ctx.strokeStyle=p.color;ctx.beginPath();ctx.moveTo(-size*1.6,0);ctx.lineTo(size*1.6,0);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(Math.sin(t)*size,Math.cos(t)*size*.75,size*.38,0,Math.PI*2);ctx.arc(-Math.sin(t)*size,-Math.cos(t)*size*.75,size*.38,0,Math.PI*2);ctx.fill();
  }else if(style==='charged'){
    ctx.rotate(t*.04);ctx.strokeRect(-size,-size,size*2,size*2);ctx.rotate(-t*.08);ctx.fillRect(-size*.45,-size*.45,size*.9,size*.9);
  }else if(style==='cryo'){
    for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(-size*1.4,0);ctx.lineTo(size*1.4,0);ctx.stroke();}
  }else if(style==='ember'){
    ctx.beginPath();ctx.moveTo(size*1.8,0);ctx.lineTo(-size,size*.9);ctx.lineTo(-size*.35,0);ctx.lineTo(-size,-size*.9);ctx.closePath();ctx.fill();ctx.fillStyle='#fff4b0';ctx.beginPath();ctx.arc(size*.3,0,size*.28,0,Math.PI*2);ctx.fill();
  }else if(style==='heavy'){
    ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;if(!i)ctx.moveTo(Math.cos(a)*size*1.25,Math.sin(a)*size*1.25);else ctx.lineTo(Math.cos(a)*size*1.25,Math.sin(a)*size*1.25);}ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(0,-size*.2,size*1.25,size*.4);
  }else{
    ctx.beginPath();ctx.arc(0,0,size,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(size*.2,-size*.2,Math.max(.8,size*.3),0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawProjectiles() {
  const vp = G._vp;
  G.projectiles.forEach(p => {
    if (!p.alive) return;
    const margin = p.isBeam ? 0 : Math.max(30, p.size || 0);
    if (!p.isBeam && (p.x + margin < vp.left || p.x - margin > vp.right || p.y + margin < vp.top || p.y - margin > vp.bottom)) return;

    if (p.isMine) {
      const pulse = 1 + Math.sin(G.now * 0.012 + p.x) * 0.18;
      ctx.save(); ctx.translate(p.x,p.y);
      ctx.strokeStyle = p.armTime > 0 ? '#ffffff88' : p.color;
      ctx.fillStyle = p.color + '22'; ctx.lineWidth = 2;
      ctx.rotate(G.now * 0.0015);
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=i*Math.PI/3;if(i===0)ctx.moveTo(Math.cos(a)*p.size*pulse,Math.sin(a)*p.size*pulse);else ctx.lineTo(Math.cos(a)*p.size*pulse,Math.sin(a)*p.size*pulse);}ctx.closePath();
      ctx.fill();ctx.stroke();ctx.restore();
      return;
    }

    if (p.isBeam) {
      drawProjectileBeam(p, resolveProjectileStyle(p));
      return;
    }

    if (p.isShockwave) {
      const alpha = p.shockLife / 30;
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4 * alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.shockRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    if (p.isOrbitalDrop) {
      const alpha = Math.min(1, (120 - p.timer) / 60) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.splash, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 204, 0, 0.05)';
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    if (p.isSonicWave) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Draw an arc facing the movement direction
      ctx.arc(p.x, p.y, p.size, p.angle - 1.2, p.angle + 1.2);
      ctx.stroke();
      return;
    }

    if (p.isMissile) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalCompositeOperation='lighter';
      ctx.beginPath();
      ctx.moveTo(p.size * 2, 0);
      ctx.lineTo(-p.size, p.size);
      ctx.lineTo(-p.size, -p.size);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha=.55;ctx.fillStyle='#ffb15c';ctx.beginPath();ctx.moveTo(-p.size,0);ctx.lineTo(-p.size*3,p.size*.7);ctx.lineTo(-p.size*3,-p.size*.7);ctx.closePath();ctx.fill();
      ctx.restore();
      return;
    }

    if (p.isRailgunProj) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      
      ctx.fillStyle = '#ffffff';
      // Draw a long sleek bolt
      ctx.beginPath();
      ctx.moveTo(p.size * 3, 0);
      ctx.lineTo(0, p.size * 0.5);
      ctx.lineTo(-p.size * 6, 0);
      ctx.lineTo(0, -p.size * 0.5);
      ctx.closePath();
      ctx.fill();
      
      // Energy core
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      return;
    }

    if (p.isFireZone) {
      const alpha = Math.min(1, p.life / 60);
      const now = Date.now();
      const pId = p.id || p.x; // Use x as fallback seed if id missing
      const pulse = 1 + Math.sin(now * 0.005 + pId) * 0.05;
      const r = p.size * pulse;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = alpha;

      // Outer glow gradient
      if (G._reducedFx) {
        ctx.fillStyle = 'rgba(255, 80, 0, 0.28)';
      } else {
        const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
        grad.addColorStop(0, 'rgba(255, 200, 50, 0.7)');
        grad.addColorStop(0.5, 'rgba(255, 80, 0, 0.4)');
        grad.addColorStop(1, 'rgba(200, 0, 0, 0)');
        ctx.fillStyle = grad;
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Jagged rotating inner fire core
      ctx.rotate(now * 0.002 * (pId % 2 === 0 ? 1 : -1));
      ctx.fillStyle = 'rgba(255, 120, 0, 0.4)';
      ctx.beginPath();
      const points = 12;
      for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2;
        const flicker = Math.sin(now * 0.01 + i * 2.5 + pId) * 0.15;
        const dist = r * (0.6 + flicker);
        if (i === 0) ctx.moveTo(Math.cos(a) * dist, Math.sin(a) * dist);
        else ctx.lineTo(Math.cos(a) * dist, Math.sin(a) * dist);
      }
      ctx.closePath();
      ctx.fill();

      // Very bright hot center (additive blending)
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 220, 100, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      return;
    }

    let drawSize = p.size;
    if (p.isMortar) {
      const d = Math.hypot(p.tx - p.x, p.ty - p.y);
      const progress = 1 - (d / p.totalDist);
      // Arc formula: height increases up to midway, then decreases
      const heightOffset = Math.sin(progress * Math.PI) * 12; 
      drawSize = p.size + heightOffset;
      // Draw shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(p.x, p.y + heightOffset + 5, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    const style=resolveProjectileStyle(p);
    const angle=p.angle === undefined ? Math.atan2(p.ty-p.y,p.tx-p.x) : p.angle;
    const glyphSize=Math.max(2,Math.min(9,drawSize));
    if(!p.isMortar) drawProjectileTrail(p,style,angle,glyphSize);
    drawProjectileGlyph(p,style,angle,glyphSize);
  });
}

// ============================================================
// PARTICLES & FLOATING TEXT
// ============================================================
function drawParticles() {
  const vp = G._vp;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const step = G._reducedFx ? 2 : 1;
  for (let i = 0; i < G.particles.length; i += step) {
    const p = G.particles[i];
    if (p.x < vp.left || p.x > vp.right || p.y < vp.top || p.y > vp.bottom) continue;
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(0.5, 2 * alpha);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size + (1-alpha)*28,0,Math.PI*2); ctx.stroke();
    } else if (p.kind === 'streak' || p.kind === 'fork') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(0.5,p.size*alpha*0.55);
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*3.5,p.y-p.vy*3.5);
      if(p.kind==='fork'){ctx.moveTo(p.x-p.vx*1.4,p.y-p.vy*1.4);ctx.lineTo(p.x-p.vy*1.3,p.y+p.vx*1.3);}
      ctx.stroke();
    } else if (p.kind === 'shard' || p.kind === 'crystal') {
      const s=p.size*alpha,rx=(p.rotation||0)+p.vx*.12,cs=Math.cos(rx),sn=Math.sin(rx);
      ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(p.x+cs*s*1.8,p.y+sn*s*1.8);ctx.lineTo(p.x-sn*s*.65,p.y+cs*s*.65);ctx.lineTo(p.x-cs*s,p.y-sn*s);ctx.lineTo(p.x+sn*s*.65,p.y-cs*s*.65);ctx.closePath();ctx.fill();
    } else if (p.kind === 'petal') {
      ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(p.x,p.y,p.size*alpha*1.5,p.size*alpha*.6,p.rotation||0,0,Math.PI*2);ctx.fill();
    } else if (p.kind === 'glyph') {
      ctx.strokeStyle=p.color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*1.55);ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.size*alpha,p.y);ctx.stroke();
    } else if (p.kind === 'droplet' || p.kind === 'ember') {
      const s=p.size*alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(p.x,p.y-s*1.7);ctx.quadraticCurveTo(p.x+s,p.y,p.x,p.y+s);ctx.quadraticCurveTo(p.x-s,p.y,p.x,p.y-s*1.7);ctx.fill();
    } else if (p.kind === 'square' || p.kind === 'debris') {
      const s=p.size*alpha;ctx.fillStyle=p.color;ctx.fillRect(p.x-s,p.y-s,s*2,s*2);
    } else if (p.kind === 'flash') {
      const s=p.size*(.5+alpha);ctx.fillStyle=p.color;ctx.globalAlpha=alpha*.75;ctx.fillRect(p.x-s*1.8,p.y-1,s*3.6,2);ctx.fillRect(p.x-1,p.y-s*1.8,2,s*3.6);
    } else if (p.kind === 'orb') {
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(p.x-1,p.y-1,2,2);
    } else {
      ctx.fillStyle = p.color;
      const s=Math.max(.7,p.size*alpha);ctx.fillRect(p.x-s*.5,p.y-s*.5,s,s);
    }
  }
  ctx.restore();
}

function drawFloatingTexts() {
  const vp = G._vp;
  for (let i = 0; i < G.floatingTexts.length; i++) {
    const f = G.floatingTexts[i];
    if (f.x < vp.left || f.x > vp.right || f.y < vp.top || f.y > vp.bottom) continue;
    const alpha = f.life / f.maxLife;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 13px Orbitron, monospace';
    ctx.fillStyle = f.color;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ============================================================
// PLACEMENT PREVIEW (ghost module on grid)
// ============================================================
function drawPlacementPreview(now) {
  if (!G.placingModule) return;
  const def = MODULE_TYPES[G.placingModule];
  if (!def) return;

  const { gx, gy } = screenToGrid(G.mouseScreen?.x || 0, G.mouseScreen?.y || 0);
  if (!canPlaceModule(gx, gy)) return;

  const wp = worldPos(gx, gy);
  const size = G.CELL * 0.38;
  const pulse = Math.sin(now * 0.005) * 0.15 + 0.5;

  ctx.globalAlpha = pulse;
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 2;
  ctx.fillStyle = def.color + '22';

  ctx.beginPath();
  if (def.isCore) {
    drawHexagon(ctx, wp.x, wp.y, size * 1.15);
  } else if (def.isPassive) {
    ctx.rect(wp.x - size * 0.85, wp.y - size * 0.85, size * 1.7, size * 1.7);
  } else {
    ctx.arc(wp.x, wp.y, size, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Icon
  ctx.font = `${G.CELL * 0.3}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = def.color;
  ctx.fillText(def.icon, wp.x, wp.y);
  ctx.textBaseline = 'alphabetic';

  ctx.globalAlpha = 1;
}
