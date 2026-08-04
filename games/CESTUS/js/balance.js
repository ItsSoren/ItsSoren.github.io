// ============================================================
// CESTUS CONTROL — Player-facing balance controls
// ============================================================

const DEFAULT_BALANCE = {
  wavePopulation: 1,
  waveDuration: 4,
  frontIntensity: 1,
  spawnDistance: 1.25,
  economyGain: 1.15,
  moduleUpgradeCost: 0.70,
  globalUpgradeCost: 0.80,
  refundRate: 0.65,
  uiTextScale: 1.45,
  cardScale: 0.82,
  soundVolume: 1,
};

const BALANCE_CONTROLS = [
  {key:'wavePopulation',label:'Population des vagues',hint:'Nombre total d’ennemis',min:0.65,max:1.5,step:0.05},
  {key:'waveDuration',label:'Durée des vagues',hint:'Espacement des escouades',min:1,max:7,step:0.1},
  {key:'frontIntensity',label:'Intensité des fronts',hint:'Nombre de directions simultanées',min:0.5,max:1.5,step:0.05},
  {key:'spawnDistance',label:'Distance des failles',hint:'Marge autour de la base',min:0.7,max:1.5,step:0.05},
  {key:'economyGain',label:'Revenus de combat',hint:'Crédits et primes de vague',min:0.5,max:2.5,step:0.05},
  {key:'moduleUpgradeCost',label:'Coût niveaux modules',hint:'Prix des niveaux 1 à 33',min:0.45,max:1.5,step:0.05},
  {key:'globalUpgradeCost',label:'Coût améliorations globales',hint:'Onglet Améliorations',min:0.5,max:1.5,step:0.05},
  {key:'refundRate',label:'Taux de revente',hint:'Part du coût total récupérée',min:0.35,max:0.9,step:0.05},
  {key:'soundVolume',label:'Volume général',hint:'Musique, tirs et alertes',min:0,max:1.5,step:0.05},
  {key:'uiTextScale',label:'Taille des textes',hint:'Lisibilité de toute l’interface',min:0.8,max:2,step:0.05},
  {key:'cardScale',label:'Taille cartes tourelles',hint:'Compacité du catalogue',min:0.6,max:1.2,step:0.05},
];

function applyPlayerSettings() {
  const root = document.documentElement;
  root.style.setProperty('--ui-text-scale', String(BALANCE.uiTextScale || 1));
  root.style.setProperty('--card-scale', String(BALANCE.cardScale || 1));
  if (typeof setGameAudioVolume === 'function') setGameAudioVolume();
}

function loadBalanceSettings() {
  try {
    return Object.assign({}, DEFAULT_BALANCE, JSON.parse(localStorage.getItem('cestus_balance') || '{}'));
  } catch (_) {
    return Object.assign({}, DEFAULT_BALANCE);
  }
}

let BALANCE = loadBalanceSettings();

function saveBalanceSettings() {
  localStorage.setItem('cestus_balance', JSON.stringify(BALANCE));
}

function setBalanceValue(key, rawValue) {
  const control = BALANCE_CONTROLS.find(c => c.key === key);
  if (!control) return;
  const value = Number(rawValue);
  BALANCE[key] = Math.max(control.min, Math.min(control.max, Number.isFinite(value) ? value : DEFAULT_BALANCE[key]));
  saveBalanceSettings();
  applyPlayerSettings();
  const output = document.getElementById('balOut_' + key);
  if (output) output.textContent = BALANCE[key].toFixed(2).replace(/0$/, '');
  if (typeof updateWavePreview === 'function') updateWavePreview();
  if (typeof G !== 'undefined') G._tabsDirty = true;
}

function renderBalanceSettings() {
  const panel = document.getElementById('balanceSettingsGrid');
  if (!panel) return;
  panel.innerHTML = BALANCE_CONTROLS.map(control => {
    const value = Number(BALANCE[control.key]);
    return `<label class="gfx-control balance-control">
      <span><b>${control.label}</b><small>${control.hint}</small></span>
      <div class="gfx-range"><input type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" oninput="setBalanceValue('${control.key}',this.value)"><output id="balOut_${control.key}">${value.toFixed(2).replace(/0$/, '')}</output></div>
    </label>`;
  }).join('');
}

function resetBalanceSettings() {
  BALANCE = Object.assign({}, DEFAULT_BALANCE);
  saveBalanceSettings();
  applyPlayerSettings();
  renderBalanceSettings();
  if (typeof updateWavePreview === 'function') updateWavePreview();
}

window.addEventListener('load', applyPlayerSettings);
