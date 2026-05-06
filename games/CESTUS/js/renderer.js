// ============================================================
// CESTUS CONTROL — Renderer
// All Canvas drawing: grid, modules, enemies, projectiles, FX
// ============================================================

function render(now) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2 - G.cam.x * G.cam.zoom, H / 2 - G.cam.y * G.cam.zoom);
  ctx.scale(G.cam.zoom, G.cam.zoom);

  // Compute viewport bounds in world coords for culling
  const vpLeft = G.cam.x - W / (2 * G.cam.zoom) - 100;
  const vpTop = G.cam.y - H / (2 * G.cam.zoom) - 100;
  const vpRight = G.cam.x + W / (2 * G.cam.zoom) + 100;
  const vpBottom = G.cam.y + H / (2 * G.cam.zoom) + 100;
  G._vp = { left: vpLeft, top: vpTop, right: vpRight, bottom: vpBottom };

  drawGrid(now);
  drawGlitchStorm(now);
  drawModules(now);
  drawPatrolUnits();
  drawEnemies();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
  drawPlacementPreview(now);

  ctx.restore();

  // FPS counter (drawn outside world transform)
  if (G.fpsDisplay !== undefined) {
    G.fpsFrames++;
    if (now - G.fpsLast >= 1000) {
      G.fpsDisplay = G.fpsFrames;
      G.fpsFrames = 0;
      G.fpsLast = now;
    }
    ctx.save();
    ctx.font = '12px Share Tech Mono, monospace';
    ctx.fillStyle = G.fpsDisplay < 30 ? '#ff2244' : G.fpsDisplay < 50 ? '#ffdd00' : '#00ff8866';
    ctx.textAlign = 'left';
    ctx.fillText('FPS: ' + G.fpsDisplay, 230, 78);
    ctx.restore();
  }
}

// ============================================================
// GRID
// ============================================================
function drawGrid(now) {
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
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * CELL);
  grad.addColorStop(0, 'rgba(25, 45, 80, 0.95)');   // Brighter center for daylight visibility
  grad.addColorStop(0.6, 'rgba(15, 30, 60, 0.9)');
  grad.addColorStop(1, 'rgba(5, 10, 25, 0.95)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, R * CELL, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Grid cells
  for (let gx = startX; gx < endX; gx++) {
    for (let gy = startY; gy < endY; gy++) {
      if (!isInsideCircle(gx, gy)) continue;
      const wx = gx * CELL;
      const wy = gy * CELL;
      const noise = (Math.sin(gx * 3.7 + gy * 2.1 + now * 0.0002) * 0.5 + 0.5) * 0.06;
      ctx.fillStyle = `rgba(10,${20 + noise * 20 | 0},${40 + noise * 30 | 0},${0.5 + noise})`;
      ctx.fillRect(wx, wy, CELL, CELL);
    }
  }

  // Grid lines clipped to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, R * CELL, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)'; // Brighter grid lines
  ctx.lineWidth = 1; // Slightly thicker
  for (let gx = startX; gx <= endX; gx++) {
    ctx.beginPath();
    ctx.moveTo(gx * CELL, startY * CELL);
    ctx.lineTo(gx * CELL, endY * CELL);
    ctx.stroke();
  }
  for (let gy = startY; gy <= endY; gy++) {
    ctx.beginPath();
    ctx.moveTo(startX * CELL, gy * CELL);
    ctx.lineTo(endX * CELL, gy * CELL);
    ctx.stroke();
  }
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
  stormGrad.addColorStop(0, 'rgba(80,0,160,0.0)');
  stormGrad.addColorStop(0.08, 'rgba(100,20,200,0.15)');
  stormGrad.addColorStop(0.2, 'rgba(120,0,220,0.35)');
  stormGrad.addColorStop(0.45, 'rgba(160,0,255,0.5)');
  stormGrad.addColorStop(0.7, 'rgba(80,0,180,0.7)');
  stormGrad.addColorStop(0.9, 'rgba(30,0,80,0.85)');
  stormGrad.addColorStop(1, 'rgba(10,0,30,0.95)');
  ctx.fillStyle = stormGrad;
  ctx.fillRect(-stormOuterR, -stormOuterR, stormOuterR * 2, stormOuterR * 2);

  // Inner edge glow ring (pulsing)
  const pulseAlpha = 0.15 + Math.sin(t * 2) * 0.08;
  ctx.strokeStyle = `rgba(180, 80, 255, ${pulseAlpha})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#aa44ff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, stormInnerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Glitch zones — nebula clouds with lightning
  G.glitchZones.forEach((gz, idx) => {
    gz.t += 0.03 + (idx % 5) * 0.005;
    const alpha = 0.3 + Math.sin(gz.t) * 0.12 + Math.sin(gz.t * 1.7) * 0.08;

    // Soft outer nebula glow
    const outerR = gz.worldR * 2;
    const gradOut = ctx.createRadialGradient(gz.x, gz.y, 0, gz.x, gz.y, outerR);
    const hue = 260 + Math.sin(gz.t * 0.5) * 20;
    gradOut.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha * 0.4})`);
    gradOut.addColorStop(0.4, `hsla(${hue + 20}, 80%, 50%, ${alpha * 0.2})`);
    gradOut.addColorStop(1, 'transparent');
    ctx.fillStyle = gradOut;
    ctx.beginPath();
    ctx.arc(gz.x, gz.y, outerR, 0, Math.PI * 2);
    ctx.fill();

    // Core glow
    const gradIn = ctx.createRadialGradient(gz.x, gz.y, 0, gz.x, gz.y, gz.worldR);
    gradIn.addColorStop(0, `hsla(${hue - 10}, 100%, 75%, ${alpha * 0.7})`);
    gradIn.addColorStop(0.6, `hsla(${hue}, 90%, 45%, ${alpha * 0.3})`);
    gradIn.addColorStop(1, `hsla(${hue + 30}, 70%, 25%, ${alpha * 0.05})`);
    ctx.fillStyle = gradIn;
    ctx.beginPath();
    ctx.arc(gz.x, gz.y, gz.worldR, 0, Math.PI * 2);
    ctx.fill();

    // Lightning arcs (more frequent, forked)
    if (Math.random() < 0.15) {
      const a = Math.random() * Math.PI * 2;
      const len = gz.worldR * (0.4 + Math.random() * 0.8);
      const sx = gz.x + Math.cos(a) * len * 0.15;
      const sy = gz.y + Math.sin(a) * len * 0.15;
      const ex = gz.x + Math.cos(a) * len;
      const ey = gz.y + Math.sin(a) * len;
      
      ctx.strokeStyle = `rgba(200, 150, 255, ${alpha * 1.5})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.shadowColor = '#cc88ff';
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
  });
}

// ============================================================
// MODULES
// ============================================================
function drawModules(now) {
  const CELL = G.CELL;
  G.modules.forEach(mod => {
    if (!mod.alive) return;
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
    ctx.shadowBlur = baseBlur * (1 + (mod.mk - 1) * 0.2);

    const size = CELL * 0.38;
    ctx.fillStyle = mod.flash > 0 ? '#ffffff' : def.color + '33';
    ctx.strokeStyle = mod.flash > 0 ? '#ffffff' : def.color;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    // Apply color tint & brightness based on MK level
    if (mod.mk > 1) {
      ctx.filter = `hue-rotate(${(mod.mk - 1) * 15}deg) brightness(${1 + (mod.mk - 1) * 0.15})`;
    }

    ctx.beginPath();
    if (def.isCore) {
      drawHexagon(ctx, x, y, size * 1.15);
    } else if (def.isPassive) {
      ctx.rect(x - size * 0.85, y - size * 0.85, size * 1.7, size * 1.7);
    } else {
      ctx.arc(x, y, size, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

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
    const hpRatio = mod.hp / stats.maxHp;
    const bw = CELL * 0.7, bx = x - bw / 2, by = y + size + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx, by, bw, 4);
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffdd00' : '#ff2244';
    ctx.fillRect(bx, by, bw * Math.max(0, hpRatio), 4);

    // Level badge
    ctx.font = '10px Orbitron, sans-serif';
    const lvlText = `L${mod.level}${mod.mk > 1 ? `/MK${mod.mk}` : ''}`;
    const tw = ctx.measureText(lvlText).width;
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

// ============================================================
// PATROL UNITS
// ============================================================
function drawPatrolUnits() {
  G.patrolUnits.forEach(u => {
    if (!u.alive) return;

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
    ctx.shadowBlur = u.flash > 0 ? 15 : 6;
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
    const hpR = u.hp / u.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(u.x - 8, u.y - 12, 16, 2);
    ctx.fillStyle = u.color;
    ctx.fillRect(u.x - 8, u.y - 12, 16 * hpR, 2);
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
  if (G.corpses && G.corpses.length > 0) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    for (let i = 0; i < G.corpses.length; i++) {
      const c = G.corpses[i];
      if (c.x < vp.left || c.x > vp.right || c.y < vp.top || c.y > vp.bottom) continue;
      const alpha = Math.max(0, c.life / c.maxLife);
      // Colored splatter circle using enemy color
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 1.8);
      grad.addColorStop(0, c.color + Math.floor(alpha * 60).toString(16).padStart(2, '0'));
      grad.addColorStop(0.5, c.color + Math.floor(alpha * 30).toString(16).padStart(2, '0'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
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
    ctx.shadowBlur = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(e.angle);
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color + '88';
    ctx.strokeStyle = e.flash > 0 ? '#ffffff' : e.color;
    ctx.lineWidth = e.isBoss ? 2.5 : 1.5;

    drawEnemyShape(ctx, e.shape, e.size);
    ctx.fill();
    ctx.stroke();
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
    const hpR = e.hp / e.maxHp;
    const bw = e.size * 2.5, bx = x - bw / 2, by = y - e.size - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx, by, bw, 3);
    ctx.fillStyle = e.color;
    ctx.fillRect(bx, by, bw * Math.max(0, hpR), 3);

    if (e.isBoss) {
      ctx.font = '10px Orbitron, monospace';
      ctx.fillStyle = '#ff0066';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', x, y - e.size - 13);
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

// ============================================================
// PROJECTILES
// ============================================================
function drawProjectiles() {
  G.projectiles.forEach(p => {
    if (!p.alive) return;

    if (p.isBeam) {
      const alpha = p.beamLife / 6;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size + 1;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.tx, p.ty);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      return;
    }

    if (p.isShockwave) {
      const alpha = p.shockLife / 30;
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4 * alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.shockRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
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
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Draw an arc facing the movement direction
      ctx.arc(p.x, p.y, p.size, p.angle - 1.2, p.angle + 1.2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      return;
    }

    if (p.isMissile) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(p.size * 2, 0);
      ctx.lineTo(-p.size, p.size);
      ctx.lineTo(-p.size, -p.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    if (p.isRailgunProj) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 20;
      
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
      const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      grad.addColorStop(0, 'rgba(255, 200, 50, 0.7)');
      grad.addColorStop(0.5, 'rgba(255, 80, 0, 0.4)');
      grad.addColorStop(1, 'rgba(200, 0, 0, 0)');
      
      ctx.fillStyle = grad;
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

    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
    if (d > 0 && !p.isMortar) {
      ctx.strokeStyle = p.color + '55';
      ctx.lineWidth = drawSize * 0.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - dx / d * 16, p.y - dy / d * 16);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  });
}

// ============================================================
// PARTICLES & FLOATING TEXT
// ============================================================
function drawParticles() {
  const vp = G._vp;
  for (let i = 0; i < G.particles.length; i++) {
    const p = G.particles[i];
    if (p.x < vp.left || p.x > vp.right || p.y < vp.top || p.y > vp.bottom) continue;
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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
