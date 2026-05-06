// ============================================================
// CESTUS CONTROL — Particles & Visual Effects
// ============================================================

function spawnParticle(x, y, color, count) {
  if (G.particles.length > 300) return;
  count = count || 5;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 2.5 + 1;
    G.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      color,
      size: Math.random() * 4 + 2,
    });
  }
}

function spawnExplosion(x, y, color) {
  if (G.particles.length > 300) return;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = Math.random() * 3.5 + 2;
    G.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 30,
      maxLife: 30,
      color,
      size: Math.random() * 3.5 + 1,
    });
  }
}

function spawnDeathExplosion(x, y, color) {
  if (G.particles.length > 280) return; // leave room
  
  // Core burst (fast, bright)
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 5 + 3;
    G.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 20, maxLife: 20, color: '#ffffff', size: Math.random() * 2 + 2,
    });
  }
  
  // Main color burst (slower, larger)
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 3 + 1;
    G.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 35 + Math.random() * 15, maxLife: 50, color: color, size: Math.random() * 4 + 2,
    });
  }
  
  // Debris (darker, falls faster)
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 4 + 2;
    G.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, // jump up slightly
      life: 40, maxLife: 40, color: '#445566', size: Math.random() * 3 + 2,
    });
  }
}

function showFloatingText(x, y, text, color) {
  if (G.floatingTexts.length > 30) G.floatingTexts.shift();
  G.floatingTexts.push({ x, y, text, color, life: 60, maxLife: 60, vy: -0.7 });
}

function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.x += p.vx * (dt / 16);
    p.y += p.vy * (dt / 16);
    p.vy += 0.04;
    p.life--;
    if (p.life <= 0) {
      const last = G.particles.pop();
      if (i < G.particles.length) {
        G.particles[i] = last;
      }
    }
  }

  for (let i = G.floatingTexts.length - 1; i >= 0; i--) {
    const f = G.floatingTexts[i];
    f.y += f.vy * (dt / 16);
    f.life--;
    if (f.life <= 0) {
      const last = G.floatingTexts.pop();
      if (i < G.floatingTexts.length) {
        G.floatingTexts[i] = last;
      }
    }
  }
}
