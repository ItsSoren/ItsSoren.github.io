// ============================================================
// CESTUS CONTROL — Graphics settings and quality presets
// ============================================================

const DEFAULT_GRAPHICS = {
  preset: 'ultra',
  renderScale: 1,
  particleDensity: 6,
  particleLimit: 1750,
  bloom: 1.15,
  trailStrength: 1,
  screenShake: 0.8,
  ambientIntensity: 1,
  gridIntensity: 1,
  spriteDetail: 1,
  effectsSpeed: 1,
  autoQuality: true,
  shadows: true,
  healthBars: true,
  damageNumbers: true,
  corpses: true,
  vignette: true,
  scanlines: false,
  impactRings: true,
  chromatic: true,
  fpsCounter: true,
  palette: 'solar'
};

const GRAPHICS_PRESETS = {
  performance: {renderScale:0.7,particleDensity:1,particleLimit:250,bloom:0.25,trailStrength:0.35,screenShake:0.2,ambientIntensity:0.15,gridIntensity:0.7,spriteDetail:0.35,effectsSpeed:0.85,autoQuality:true,shadows:false,healthBars:true,damageNumbers:false,corpses:false,vignette:false,scanlines:false,impactRings:false,chromatic:false,fpsCounter:true},
  balanced: {renderScale:0.9,particleDensity:3,particleLimit:1000,bloom:0.7,trailStrength:0.7,screenShake:0.5,ambientIntensity:0.55,gridIntensity:0.9,spriteDetail:0.7,effectsSpeed:1,autoQuality:true,shadows:true,healthBars:true,damageNumbers:true,corpses:true,vignette:true,scanlines:false,impactRings:true,chromatic:false,fpsCounter:true},
  ultra: {renderScale:1,particleDensity:6,particleLimit:1750,bloom:1.15,trailStrength:1,screenShake:0.8,ambientIntensity:1,gridIntensity:1,spriteDetail:1,effectsSpeed:1,autoQuality:true,shadows:true,healthBars:true,damageNumbers:true,corpses:true,vignette:true,scanlines:false,impactRings:true,chromatic:true,fpsCounter:true},
  cinematic: {renderScale:1.15,particleDensity:10,particleLimit:2500,bloom:1.8,trailStrength:1.5,screenShake:1.25,ambientIntensity:1.6,gridIntensity:1.15,spriteDetail:1.5,effectsSpeed:1.1,autoQuality:true,shadows:true,healthBars:true,damageNumbers:true,corpses:true,vignette:true,scanlines:true,impactRings:true,chromatic:true,fpsCounter:true}
};

const GRAPHICS_CONTROLS = [
  {key:'renderScale',label:'Résolution interne',type:'range',min:0.5,max:1.5,step:0.05},
  {key:'particleDensity',label:'Densité de particules',type:'range',min:0,max:10,step:1},
  {key:'particleLimit',label:'Limite de particules',type:'range',min:250,max:5000,step:250},
  {key:'bloom',label:'Bloom lumineux',type:'range',min:0,max:2,step:0.05},
  {key:'trailStrength',label:'Longueur des traînées',type:'range',min:0,max:2,step:0.05},
  {key:'screenShake',label:'Secousses caméra',type:'range',min:0,max:2,step:0.05},
  {key:'ambientIntensity',label:'Ambiance vivante',type:'range',min:0,max:2,step:0.05},
  {key:'gridIntensity',label:'Intensité de la grille',type:'range',min:0,max:1.5,step:0.05},
  {key:'spriteDetail',label:'Détail des sprites',type:'range',min:0,max:1.5,step:0.05},
  {key:'effectsSpeed',label:'Vitesse des animations',type:'range',min:0.5,max:1.5,step:0.05},
  {key:'autoQuality',label:'Qualité adaptative',type:'toggle'},
  {key:'shadows',label:'Ombres et halos',type:'toggle'},
  {key:'healthBars',label:'Barres de vie',type:'toggle'},
  {key:'damageNumbers',label:'Textes flottants',type:'toggle'},
  {key:'corpses',label:'Traces des ennemis',type:'toggle'},
  {key:'vignette',label:'Vignette cinématique',type:'toggle'},
  {key:'scanlines',label:'Lignes holographiques',type:'toggle'},
  {key:'impactRings',label:'Anneaux d’impact',type:'toggle'},
  {key:'chromatic',label:'Franges chromatiques',type:'toggle'},
  {key:'fpsCounter',label:'Compteur FPS',type:'toggle'},
  {key:'palette',label:'Palette',type:'select',options:[
    ['solar','Solar Cartography'],
    ['contrast','Contraste maximal'],
    ['mint','Menthe monochrome'],
    ['crimson','Crimson Void'],
    ['nebula','Nébuleuse cosmique'],
    ['toxic','Toxic Wasteland'],
    ['frost','Glacier Arctique'],
    ['cyber','Cyberpunk Neon'],
    ['sunset','Sunset Horizon']
  ]}
];

function loadGraphicsSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('cestus_graphics') || '{}');
    if (stored.preset === 'ultra' && stored.particleLimit > 1750) stored.particleLimit = 1750;
    if (stored.preset === 'cinematic' && stored.particleLimit > 2500) stored.particleLimit = 2500;
    if (stored.preset === 'cinematic' && stored.renderScale > 1.15) stored.renderScale = 1.15;
    if (stored.preset === 'cinematic') stored.autoQuality = true;
    return Object.assign({}, DEFAULT_GRAPHICS, stored);
  } catch (_) {
    return Object.assign({}, DEFAULT_GRAPHICS);
  }
}

let GRAPHICS = loadGraphicsSettings();

function saveGraphicsSettings() {
  localStorage.setItem('cestus_graphics', JSON.stringify(GRAPHICS));
}

function applyGraphicsSettings(resize) {
  document.documentElement.dataset.palette = GRAPHICS.palette;
  document.documentElement.style.setProperty('--fx-bloom', GRAPHICS.bloom);
  if (resize && typeof resizeCanvas === 'function') resizeCanvas();
  saveGraphicsSettings();
  updateGraphicsReadouts();
}

function setGraphicsPreset(name) {
  const preset = GRAPHICS_PRESETS[name];
  if (!preset) return;
  GRAPHICS = Object.assign({}, GRAPHICS, preset, {preset:name});
  applyGraphicsSettings(true);
  renderGraphicsSettings();
}

function setGraphicsValue(key, rawValue, type) {
  if (!(key in DEFAULT_GRAPHICS)) return;
  GRAPHICS[key] = type === 'toggle' ? !!rawValue : type === 'range' ? Number(rawValue) : rawValue;
  GRAPHICS.preset = 'custom';
  applyGraphicsSettings(key === 'renderScale');
  const preset = document.getElementById('graphicsPreset');
  if (preset) preset.value = 'custom';
}

function updateGraphicsReadouts() {
  GRAPHICS_CONTROLS.forEach(control => {
    const out = document.getElementById('gfxOut_' + control.key);
    if (out) out.textContent = control.type === 'range' ? String(GRAPHICS[control.key]) : '';
  });
}

function renderGraphicsSettings() {
  const panel = document.getElementById('graphicsSettingsGrid');
  if (!panel) return;
  let html = '';
  GRAPHICS_CONTROLS.forEach(control => {
    const value = GRAPHICS[control.key];
    html += `<label class="gfx-control ${control.type}"><span>${control.label}</span>`;
    if (control.type === 'range') {
      html += `<div class="gfx-range"><input type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" oninput="setGraphicsValue('${control.key}',this.value,'range')"><output id="gfxOut_${control.key}">${value}</output></div>`;
    } else if (control.type === 'toggle') {
      html += `<input type="checkbox" ${value ? 'checked' : ''} onchange="setGraphicsValue('${control.key}',this.checked,'toggle')"><i></i>`;
    } else {
      html += `<select onchange="setGraphicsValue('${control.key}',this.value,'select')">${control.options.map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${label}</option>`).join('')}</select>`;
    }
    html += '</label>';
  });
  panel.innerHTML = html;
  const preset = document.getElementById('graphicsPreset');
  if (preset) preset.value = GRAPHICS.preset in GRAPHICS_PRESETS ? GRAPHICS.preset : 'custom';
}

function showSettingsPane(name) {
  const pausePane = document.getElementById('settingsPanePause');
  const renderPane = document.getElementById('settingsPaneRender');
  const balancePane = document.getElementById('settingsPaneBalance');
  if (pausePane) pausePane.classList.toggle('active', name === 'pause');
  if (renderPane) renderPane.classList.toggle('active', name === 'render');
  if (balancePane) balancePane.classList.toggle('active', name === 'balance');
  document.querySelectorAll('.settings-mode-tabs button').forEach(button => button.classList.toggle('active', button.dataset.pane === name));
  if (name === 'balance') renderBalanceSettings();
  if (name === 'render') renderGraphicsSettings();
}

function toggleGraphicsSettings(force, defaultPane) {
  if (typeof togglePause === 'function') {
    togglePause(force, defaultPane || 'render');
  }
}

function resetGraphicsSettings() {
  GRAPHICS = Object.assign({}, DEFAULT_GRAPHICS);
  applyGraphicsSettings(true);
  renderGraphicsSettings();
}

function initGraphicsSettingsUI() {
  let btn = document.getElementById('graphicsSettingsBtn');
  if (!btn) {
    document.body.insertAdjacentHTML('beforeend', `<button id="graphicsSettingsBtn" onclick="togglePause()" title="Réglages graphiques & Pause">⚙</button>`);
  }
  applyGraphicsSettings(false);
  renderGraphicsSettings();
}

initGraphicsSettingsUI();
