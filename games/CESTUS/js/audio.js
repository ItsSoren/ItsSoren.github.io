// ============================================================
// CESTUS CONTROL — Lightweight procedural audio
// No downloaded assets and a strict voice budget keep it cheap.
// ============================================================

const GAME_AUDIO = {
  ctx: null,
  master: null,
  music: null,
  initialized: false,
  muted: localStorage.getItem('cestus_audio_muted') === '1',
  lastSfx: Object.create(null),
  voices: 0,
  maxVoices: 12,
  drones: [],
};

function initGameAudio() {
  if (GAME_AUDIO.initialized) {
    if (GAME_AUDIO.ctx && GAME_AUDIO.ctx.state === 'suspended') GAME_AUDIO.ctx.resume();
    updateAudioButton();
    return;
  }
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  try {
    const ac = new AudioCtor();
    const master = ac.createGain();
    const music = ac.createGain();
    master.gain.value = GAME_AUDIO.muted ? 0 : 0.28;
    music.gain.value = 0.055;
    music.connect(master);
    master.connect(ac.destination);
    GAME_AUDIO.ctx = ac;
    GAME_AUDIO.master = master;
    GAME_AUDIO.music = music;
    GAME_AUDIO.initialized = true;

    // A restrained, evolving reactor drone. Two nodes only.
    [46.25, 69.3].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = i ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.value = i ? 0.18 : 0.25;
      osc.connect(gain);
      gain.connect(music);
      osc.start();
      GAME_AUDIO.drones.push({ osc, gain });
    });
    updateAudioButton();
  } catch (_) {
    GAME_AUDIO.initialized = false;
  }
}

function updateAudioButton() {
  const btn = document.getElementById('audioToggleBtn');
  if (!btn) return;
  btn.textContent = GAME_AUDIO.muted ? '×' : '♪';
  btn.classList.toggle('muted', GAME_AUDIO.muted);
  btn.title = GAME_AUDIO.muted ? 'Activer le son' : 'Couper le son';
}

function toggleGameAudio() {
  initGameAudio();
  GAME_AUDIO.muted = !GAME_AUDIO.muted;
  localStorage.setItem('cestus_audio_muted', GAME_AUDIO.muted ? '1' : '0');
  if (GAME_AUDIO.master && GAME_AUDIO.ctx) {
    GAME_AUDIO.master.gain.cancelScheduledValues(GAME_AUDIO.ctx.currentTime);
    GAME_AUDIO.master.gain.setTargetAtTime(GAME_AUDIO.muted ? 0 : 0.28, GAME_AUDIO.ctx.currentTime, 0.03);
  }
  updateAudioButton();
  if (!GAME_AUDIO.muted) playGameSfx('select');
}

function audioTone(freq, duration, type, volume, sweep) {
  const ac = GAME_AUDIO.ctx;
  if (!ac || GAME_AUDIO.muted || GAME_AUDIO.voices >= GAME_AUDIO.maxVoices) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;
  GAME_AUDIO.voices++;
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(Math.max(20, freq), now);
  if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweep), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume || 0.05), now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(GAME_AUDIO.master);
  osc.start(now);
  osc.stop(now + duration + 0.02);
  osc.onended = () => { GAME_AUDIO.voices = Math.max(0, GAME_AUDIO.voices - 1); };
}

function playGameSfx(name, power) {
  if (!GAME_AUDIO.initialized || GAME_AUDIO.muted) return;
  const t = performance.now();
  const cooldowns = { impact:55, kill:95, spawn:180, select:80 };
  if (t - (GAME_AUDIO.lastSfx[name] || 0) < (cooldowns[name] || 0)) return;
  GAME_AUDIO.lastSfx[name] = t;
  const p = Math.max(0.5, Math.min(2, power || 1));
  if (name === 'directive') {
    audioTone(138, .34, 'triangle', .035, 207);
    setTimeout(() => audioTone(277, .28, 'sine', .028, 415), 90);
  } else if (name === 'select') {
    audioTone(330, .13, 'triangle', .035, 660);
  } else if (name === 'wave') {
    audioTone(92, .52, 'sawtooth', .045, 184);
    setTimeout(() => audioTone(276, .28, 'triangle', .03, 414), 120);
  } else if (name === 'boss') {
    audioTone(58, 1.15, 'sawtooth', .07, 116);
    setTimeout(() => audioTone(46, .85, 'square', .035, 92), 160);
  } else if (name === 'clear') {
    [220,277,330,440].forEach((f, i) => setTimeout(() => audioTone(f, .32, 'sine', .028), i * 75));
  } else if (name === 'impact') {
    audioTone(105 * p, .055, 'square', .012, 65);
  } else if (name === 'kill') {
    audioTone(155 * p, .08, 'triangle', .016, 78);
  }
}

window.addEventListener('pointerdown', initGameAudio, { once:true, passive:true });
window.addEventListener('keydown', initGameAudio, { once:true });
window.addEventListener('load', updateAudioButton);
