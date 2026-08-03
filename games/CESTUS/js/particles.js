// ============================================================
// CESTUS CONTROL — Particles & Visual Effects
// ============================================================

function getParticleLimit() {
  if (typeof GRAPHICS === 'undefined') return 1000;
  const layout = document.documentElement.dataset.layout || 'desktop';
  const deviceCap = layout === 'phone' ? 650 : layout === 'tablet' ? 1100 : layout === 'short' ? 1400 : 2200;
  const tierCap = G._fxTier >= 2 ? 420 : G._fxTier === 1 ? 900 : deviceCap;
  return Math.min(GRAPHICS.particleLimit, tierCap);
}

function getParticleDensityScale() {
  if (typeof GRAPHICS === 'undefined') return 1;
  let scale = 0.35 + GRAPHICS.particleDensity * 0.16;
  if (G._fxTier === 1) scale *= 0.62;
  if (G._fxTier >= 2) scale *= 0.32;
  return scale;
}

function pushParticle(data) {
  if (G.particles.length >= getParticleLimit()) return;
  const pool = G._particlePool || (G._particlePool = []);
  const particle = pool.pop() || {};
  Object.assign(particle, data);
  G.particles.push(particle);
}

function spawnParticle(x, y, color, count) {
  if (G.particles.length >= getParticleLimit()) return;
  count = count || 5;
  const density = getParticleDensityScale();
  count = Math.min(36, Math.max(1, Math.round(count * density)));
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 3.8 + 0.8;
    pushParticle({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 18 + Math.random() * 24,
      maxLife: 42,
      color,
      size: Math.random() * 3.5 + 1,
      kind: i % 5 === 0 ? 'shard' : i % 2 ? 'streak' : 'spark',
      drag: 0.965,
      gravity: 0.025 + Math.random() * 0.035,
    });
  }
}

function spawnImpactEffect(x, y, color, style) {
  if (G.particles.length >= getParticleLimit()) return;
  const density = getParticleDensityScale();
  const count = Math.min(12, Math.max(3, Math.round(3 + density * 3)));
  const kindByStyle = {
    acid:'droplet', toxic:'droplet', electric:'fork', chrono:'glyph', prism:'shard',
    phase:'shard', blade:'shard', shard:'shard', cluster:'petal', ember:'ember',
    cryo:'crystal', helix:'orb', leech:'orb', heavy:'debris', charged:'square'
  };
  const kind = kindByStyle[style] || 'spark';
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2 + Math.random() * 0.3;
    const speed = 1.2 + Math.random() * 3.2;
    pushParticle({
      x, y, vx:Math.cos(a)*speed, vy:Math.sin(a)*speed,
      life:14 + Math.random()*16, maxLife:30, color,
      size:1.4 + Math.random()*2.7, kind,
      drag:style === 'acid' ? 0.94 : 0.9,
      gravity:style === 'acid' || style === 'ember' ? 0.08 : 0.015,
      spin:(Math.random()-.5)*0.3,
    });
  }
  if (GRAPHICS.impactRings && G._fxTier < 2) {
    pushParticle({x,y,vx:0,vy:0,life:12,maxLife:12,color,size:5,kind:'ring',drag:1,gravity:0});
  }
}

function spawnExplosion(x, y, color, style) {
  if (G.particles.length >= getParticleLimit()) return;
  const density = getParticleDensityScale();
  const count = Math.min(24, Math.max(7, Math.round(7 + density * 6)));
  G.screenShake = Math.min(18, (G.screenShake || 0) + 3 + density * 0.45);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const s = Math.random() * 3.5 + 2;
    pushParticle({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 24 + Math.random() * 16,
      maxLife: 40,
      color,
      size: Math.random() * 3.5 + 1,
      kind: i % 4 === 0 ? 'shard' : i % 2 ? 'streak' : (style === 'ember' ? 'ember' : 'spark'),
      drag:0.93, gravity:style === 'cryo' ? 0.01 : 0.035,
      spin:(Math.random()-.5)*0.25,
    });
  }
  if (GRAPHICS.impactRings && G._fxTier < 2) pushParticle({x,y,vx:0,vy:0,life:16,maxLife:16,color,size:8,kind:'ring',drag:1,gravity:0});
  pushParticle({x,y,vx:0,vy:0,life:7,maxLife:7,color:'#ffffff',size:10,kind:'flash',drag:1,gravity:0});
}

function spawnDeathExplosion(x, y, color) {
  if (G.particles.length >= getParticleLimit()) return;
  
  // Core burst (fast, bright)
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 5 + 3;
    pushParticle({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 20, maxLife: 20, color: '#ffffff', size: Math.random() * 2 + 2, kind:'streak', drag:0.95, gravity:0.02,
    });
  }
  
  // Main color burst (slower, larger)
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 3 + 1;
    pushParticle({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 35 + Math.random() * 15, maxLife: 50, color: color, size: Math.random() * 4 + 2, kind:'spark', drag:0.97, gravity:0.035,
    });
  }
  
  // Debris (darker, falls faster)
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 4 + 2;
    pushParticle({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, // jump up slightly
      life: 40, maxLife: 40, color: '#445566', size: Math.random() * 3 + 2, kind:'streak', drag:0.96, gravity:0.08,
    });
  }
}

function showFloatingText(x, y, text, color) {
  if (typeof GRAPHICS !== 'undefined' && !GRAPHICS.damageNumbers) return;
  if (G.floatingTexts.length > 30) G.floatingTexts.shift();
  G.floatingTexts.push({ x, y, text, color, life: 60, maxLife: 60, vy: -0.7 });
}

function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.x += p.vx * (dt / 16);
    p.y += p.vy * (dt / 16);
    p.vx *= p.drag || 1;
    p.vy *= p.drag || 1;
    p.vy += p.gravity === undefined ? 0.04 : p.gravity;
    p.rotation = (p.rotation || 0) + (p.spin || 0);
    p.life -= dt / 16;
    if (p.life <= 0) {
      const dead = p;
      const last = G.particles.pop();
      if (i < G.particles.length) {
        G.particles[i] = last;
      }
      const pool = G._particlePool || (G._particlePool = []);
      if (pool.length < 2400) pool.push(dead);
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
