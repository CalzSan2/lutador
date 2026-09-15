/* LUTADOR — local audio mixer. No remote assets or per-frame audio work. */
(() => {
  'use strict';
  const SAVE_KEY = 'lutador-audio-v1';
  const DEFAULTS = Object.freeze({ master: .72, effects: .85, music: .28, interface: .78, crowd: .68, voice: .82, muted: false, ambience: false });
  const MAX_VOICES = 28;
  const voices = new Set();
  const cooldowns = new Map();
  let context = null, masterBus = null, effectsBus = null, musicBus = null;
  let noise = null, ambient = null, unlocked = false, dialog = null, previousFocus = null, pausedFight = null;
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  let settings = readSettings();

  function clean(input) {
    const item = input && typeof input === 'object' ? input : {};
    return {
      master: clamp(finite(item.master, DEFAULTS.master), 0, 1),
      effects: clamp(finite(item.effects, DEFAULTS.effects), 0, 1),
      music: clamp(finite(item.music, DEFAULTS.music), 0, 1),
      interface: clamp(finite(item.interface, DEFAULTS.interface), 0, 1),
      crowd: clamp(finite(item.crowd, DEFAULTS.crowd), 0, 1),
      voice: clamp(finite(item.voice, DEFAULTS.voice), 0, 1),
      muted: item.muted === true,
      ambience: item.ambience === true
    };
  }
  function readSettings() {
    try { return clean(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); }
    catch (_) { return { ...DEFAULTS }; }
  }
  function smooth(param, value, seconds = .035) {
    if (!context || !param) return;
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, seconds);
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(settings)); } catch (_) {}
  }
  function createContext() {
    if (context) return true;
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return false;
    try {
      context = new AudioEngine({ latencyHint: 'interactive' });
      masterBus = context.createGain(); effectsBus = context.createGain(); musicBus = context.createGain();
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -12; limiter.knee.value = 8; limiter.ratio.value = 8;
      limiter.attack.value = .002; limiter.release.value = .1;
      effectsBus.connect(masterBus); musicBus.connect(masterBus); masterBus.connect(limiter); limiter.connect(context.destination);
      masterBus.gain.value = settings.muted ? 0 : settings.master;
      effectsBus.gain.value = settings.effects;
      musicBus.gain.value = settings.music;
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * .8), context.sampleRate);
      const data = noise.getChannelData(0);
      let seed = 48271, previous = 0;
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 16807) % 2147483647;
        const white = seed / 1073741824 - 1;
        previous = .72 * previous + .28 * white;
        data[i] = (white * .58 + previous * .42) * .8;
      }
      return true;
    } catch (_) { context = null; return false; }
  }
  function unlock() {
    if (document.hidden || !createContext()) return Promise.resolve(false);
    unlocked = true;
    const ready = context.state === 'suspended' ? context.resume() : Promise.resolve();
    return Promise.resolve(ready).then(() => { syncAmbience(); return true; }).catch(() => false);
  }
  function setSettings(patch) {
    settings = clean({ ...settings, ...patch });
    persist();
    if (context) {
      smooth(masterBus.gain, settings.muted ? 0 : settings.master);
      smooth(effectsBus.gain, settings.effects); smooth(musicBus.gain, settings.music);
      syncAmbience();
    }
    syncUI();
    window.dispatchEvent(new CustomEvent('pro:audio-changed', { detail: { ...settings } }));
    return { ...settings };
  }

  function clearVoices() {
    for (const voice of [...voices]) {
      try { voice.source.stop(); } catch (_) {}
      voice.dispose();
    }
    cooldowns.clear();
  }
  function sourceVoice(spec, volume, pan, pitch, delay) {
    if (voices.size >= MAX_VOICES || !context || context.state !== 'running') return false;
    const time = context.currentTime + delay + (spec.delay || 0);
    const duration = spec.duration || .12;
    const source = spec.noise ? context.createBufferSource() : context.createOscillator();
    const envelope = context.createGain();
    const filter = spec.noise ? context.createBiquadFilter() : null;
    const panner = context.createStereoPanner ? context.createStereoPanner() : null;
    if (spec.noise) {
      source.buffer = noise;
      filter.type = spec.filter || 'lowpass'; filter.frequency.setValueAtTime(spec.frequency || 1300, time);
      filter.Q.value = spec.q || .7;
      if (spec.end) filter.frequency.exponentialRampToValueAtTime(Math.max(20, spec.end), time + duration);
      source.connect(filter); filter.connect(envelope);
    } else {
      source.type = spec.type || 'sine';
      source.frequency.setValueAtTime(Math.max(20, (spec.frequency || 180) * pitch), time);
      source.frequency.exponentialRampToValueAtTime(Math.max(20, (spec.end || spec.frequency || 90) * pitch), time + duration);
      source.connect(envelope);
    }
    const peak = Math.max(.0001, (spec.gain || .1) * volume);
    envelope.gain.setValueAtTime(.0001, time);
    envelope.gain.exponentialRampToValueAtTime(peak, time + Math.min(.009, duration / 5));
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    if (panner) { panner.pan.value = pan; envelope.connect(panner); panner.connect(effectsBus); }
    else envelope.connect(effectsBus);
    let removed = false;
    const voice = { source, dispose() {
      if (removed) return; removed = true; voices.delete(voice);
      for (const node of [source, filter, envelope, panner]) { try { node?.disconnect(); } catch (_) {} }
      source.onended = null;
    } };
    voices.add(voice); source.onended = voice.dispose;
    try { source.start(time); source.stop(time + duration + .015); return true; }
    catch (_) { voice.dispose(); return false; }
  }
  const SOUNDS = Object.freeze({
    punch: [{ noise: true, frequency: 1500, end: 520, duration: .095, gain: .4 }, { frequency: 160, end: 58, duration: .12, gain: .35 }],
    kick: [{ noise: true, frequency: 2200, end: 340, duration: .16, gain: .37 }, { frequency: 115, end: 42, duration: .2, gain: .42 }],
    hit: [{ noise: true, frequency: 1700, end: 680, duration: .11, gain: .45 }, { frequency: 98, end: 37, duration: .17, gain: .36 }],
    guard: [{ noise: true, filter: 'bandpass', frequency: 1900, q: 2.2, duration: .105, gain: .3 }, { type: 'triangle', frequency: 560, end: 330, duration: .12, gain: .11 }],
    throw: [{ noise: true, filter: 'bandpass', frequency: 900, end: 2900, duration: .14, gain: .23 }, { type: 'triangle', frequency: 280, end: 660, duration: .12, gain: .075 }],
    special: [{ noise: true, filter: 'bandpass', frequency: 430, end: 2200, duration: .32, gain: .27 }, { type: 'triangle', frequency: 105, end: 450, duration: .29, gain: .15 }],
    jump: [{ noise: true, filter: 'bandpass', frequency: 580, end: 1700, duration: .17, gain: .16 }],
    land: [{ noise: true, frequency: 530, duration: .12, gain: .24 }, { frequency: 80, end: 36, duration: .12, gain: .2 }],
    menu: [{ type: 'sine', frequency: 650, end: 480, duration: .055, gain: .16 }],
    back: [{ type: 'sine', frequency: 400, end: 260, duration: .08, gain: .15 }],
    confirm: [{ type: 'sine', frequency: 440, duration: .1, gain: .14 }, { type: 'sine', frequency: 660, duration: .15, delay: .06, gain: .13 }],
    start: [{ frequency: 130, end: 65, duration: .25, gain: .22 }, { type: 'triangle', frequency: 440, end: 880, duration: .19, delay: .13, gain: .1 }],
    win: [{ type: 'triangle', frequency: 440, duration: .22, gain: .1 }, { type: 'triangle', frequency: 554.37, duration: .22, delay: .13, gain: .1 }, { type: 'triangle', frequency: 659.25, duration: .4, delay: .26, gain: .1 }],
    ko: [{ type: 'sine', frequency: 220, end: 110, duration: .6, gain: .2 }, { noise: true, frequency: 700, duration: .22, gain: .2 }],
    crowd: [{ noise: true, filter: 'bandpass', frequency: 720, end: 980, duration: .72, gain: .13 }, { noise: true, filter: 'lowpass', frequency: 420, duration: .9, gain: .08 }],
    voice: [{ type: 'sawtooth', frequency: 155, end: 120, duration: .18, gain: .07 }, { type: 'triangle', frequency: 310, end: 245, duration: .22, gain: .07 }]
  });
  function normalizeKind(value) {
    const kind = String(value || 'menu').toLowerCase();
    if (SOUNDS[kind]) return kind;
    if (/crowd|publico|público|arena_cheer|cheer/.test(kind)) return 'crowd';
    if (/voice|voz|announcer|narrator/.test(kind)) return 'voice';
    if (/menu_confirm|reward|claim/.test(kind)) return 'confirm';
    if (/menu_back/.test(kind)) return 'back';
    if (/menu/.test(kind)) return 'menu';
    if (/fight_start/.test(kind)) return 'start';
    if (/win/.test(kind)) return 'win';
    if (/ko/.test(kind)) return 'ko';
    if (/guard|block|defen/.test(kind)) return 'guard';
    if (/kick|chute/.test(kind)) return 'kick';
    if (/punch|soco/.test(kind)) return 'punch';
    if (/hit|impact/.test(kind)) return 'hit';
    if (/jump/.test(kind)) return 'jump';
    if (/land/.test(kind)) return 'land';
    if (/special|star|super/.test(kind)) return 'special';
    if (/throw|shot|attack/.test(kind)) return 'throw';
    return 'throw';
  }
  function play(kind, options = {}) {
    if (!unlocked || document.hidden || settings.muted || settings.master <= 0 || settings.effects <= 0 || !context || context.state !== 'running') return false;
    const normalized = normalizeKind(kind);
    const character = String(options.character || '').slice(0, 40);
    const key = `${normalized}:${character}`;
    const now = context.currentTime;
    if (now - (cooldowns.get(key) ?? -1) < .025) return false;
    cooldowns.set(key, now);
    if (cooldowns.size > 128) for (const [name, time] of cooldowns) { if (now - time > 2) cooldowns.delete(name); }
    let hash = 0; for (let i = 0; i < character.length; i++) hash = (hash + character.charCodeAt(i) * (i + 1)) % 97;
    const pitch = character ? .94 + (hash / 97) * .12 : 1;
    const requestedVolume = clamp(finite(options.volume, 1), 0, 1);
    const categoryGain = normalized === 'crowd' ? settings.crowd : normalized === 'voice' ? settings.voice : ['menu','back','confirm'].includes(normalized) ? settings.interface : 1;
    const volume = requestedVolume * categoryGain;
    if (volume <= 0) return false;
    const pan = clamp(finite(options.pan, 0), -1, 1);
    const delay = clamp(finite(options.delay, 0), 0, 2);
    let played = false;
    for (const spec of SOUNDS[normalized]) played = sourceVoice(spec, volume, pan, pitch, delay) || played;
    // Camadas dedicadas: o público reage em KO/vitória e a voz acompanha a abertura da luta.
    if ((normalized === 'win' || normalized === 'ko') && settings.crowd > 0) {
      for (const spec of SOUNDS.crowd) played = sourceVoice(spec, requestedVolume * settings.crowd, pan * .25, 1, delay + .05) || played;
    }
    if (normalized === 'start' && settings.voice > 0) {
      for (const spec of SOUNDS.voice) played = sourceVoice(spec, requestedVolume * settings.voice, 0, 1, delay + .08) || played;
    }
    return played;
  }
  function stopAmbience() {
    if (!ambient || !context) return;
    const current = ambient; ambient = null;
    smooth(current.gain.gain, 0, .025);
    for (const source of current.sources) { try { source.stop(context.currentTime + .15); } catch (_) {} }
  }
  function syncAmbience() {
    const active = context && context.state === 'running' && unlocked && settings.ambience && !settings.muted && settings.master > 0 && settings.music > 0 && !document.hidden;
    if (!active) { stopAmbience(); return; }
    if (ambient) return;
    const gain = context.createGain(); gain.gain.value = 0; gain.connect(musicBus);
    const sources = [55, 82.4069, 110.08].map(frequency => {
      const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      oscillator.connect(gain); oscillator.start(); return oscillator;
    });
    let remaining = sources.length;
    sources.forEach(source => { source.onended = () => { source.disconnect(); if (--remaining === 0) gain.disconnect(); }; });
    ambient = { gain, sources }; smooth(gain.gain, .035, .4);
  }
  function tone(frequency, duration = .08, type = 'sine', volume = .035, delay = 0) {
    if (!unlocked || !context || context.state !== 'running' || document.hidden || settings.muted || settings.master <= 0 || settings.effects <= 0) return false;
    return sourceVoice({ frequency: clamp(finite(frequency, 440), 35, 6000), type: ['sine','square','triangle','sawtooth'].includes(type) ? type : 'sine', duration: clamp(finite(duration, .08), .025, 3), gain: clamp(finite(volume, .035), 0, .15) }, 1, 0, 1, clamp(finite(delay, 0), 0, 3));
  }

  function installGameAudio() {
    try {
      if (typeof SFX !== 'undefined') {
        SFX.play = (name, volume) => play(name, { volume: finite(volume, .9) });
        SFX.el = name => ({ volume: .9, pause() {}, cloneNode() { return this; }, play() { play(name, { volume: this.volume }); return Promise.resolve(); } });
      }
      if (typeof charSound === 'function') charSound = (fighter, slot) => play(slot, {
        character: fighter?.id,
        pan: clamp((finite(fighter?.x, 800) / 1600 * 2 - 1) * .65, -.65, .65)
      });
      if (typeof chaosTone === 'function') chaosTone = tone;
      if (typeof chaosSpinSound === 'function') chaosSpinSound = (duration = 3.2) => {
        if (!unlocked || !context || settings.muted || document.hidden) return;
        sourceVoice({ type: 'triangle', frequency: 95, end: 520, duration: clamp(finite(duration, 3.2), .2, 3.5), gain: .04 }, 1, 0, 1, 0);
      };
      if (window.__chaosAC) { window.__chaosAC.close().catch(() => {}); window.__chaosAC = null; }
    } catch (_) {}
  }
  function volumeRow(key, title, description) {
    return `<label class="pro-audio-row" for="pro-audio-${key}"><span class="pro-audio-label"><strong>${title}</strong><small>${description}</small></span><span class="pro-audio-slider"><input id="pro-audio-${key}" type="range" min="0" max="100" step="1" data-audio-setting="${key}"><output for="pro-audio-${key}" data-audio-value="${key}"></output></span></label>`;
  }
  function createDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog'); dialog.id = 'pro-audio-dialog'; dialog.className = 'pro-audio-dialog';
    dialog.setAttribute('aria-labelledby', 'pro-audio-title');
    dialog.innerHTML = `<div class="pro-audio-panel"><header class="pro-audio-header"><span><small>CONFIGURAÇÕES DA ARENA</small><h2 id="pro-audio-title">SOM & AMBIENTE</h2></span><button type="button" class="pro-audio-close" data-audio-close aria-label="Fechar configurações de som">×</button></header><p class="pro-audio-intro">Ajuste o impacto de cada golpe e o clima da arena.</p><div class="pro-audio-mixer">${volumeRow('master', 'Volume geral', 'Controla todos os sons do jogo')}${volumeRow('effects', 'Efeitos de combate', 'Golpes, defesas, impactos e especiais')}${volumeRow('interface', 'Interface', 'Menus, confirmações e navegação')}${volumeRow('crowd', 'Público', 'Reações e clima da arena')}${volumeRow('voice', 'Voz', 'Narrador, chamadas e cenas')}${volumeRow('music', 'Música / ambiente', 'Camada musical da arena')}</div><div class="pro-audio-toggles"><label class="pro-audio-toggle"><span><strong>Ativar ambiente musical</strong><small>Opcional. Desligado por padrão.</small></span><input type="checkbox" data-audio-setting="ambience" role="switch"></label><label class="pro-audio-toggle"><span><strong>Silenciar tudo</strong><small>Mantém seus volumes salvos.</small></span><input type="checkbox" data-audio-setting="muted" role="switch"></label></div><div class="pro-audio-test"><span class="pro-audio-status" role="status" aria-live="polite">Preferências salvas automaticamente.</span><button type="button" class="pro-audio-button" data-audio-test>▶ TESTAR SOM</button></div><footer class="pro-audio-footer"><button type="button" class="pro-audio-reset" data-audio-reset>Restaurar padrão</button><button type="button" class="pro-audio-button pro-audio-done" data-audio-close>CONCLUÍDO</button></footer></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('input', event => {
      const input = event.target.closest('[data-audio-setting]'); if (!input) return;
      unlock(); setSettings({ [input.dataset.audioSetting]: input.type === 'checkbox' ? input.checked : Number(input.value) / 100 });
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog || event.target.closest('[data-audio-close]')) { closeSettings(); return; }
      if (event.target.closest('[data-audio-reset]')) { setSettings(DEFAULTS); return; }
      if (event.target.closest('[data-audio-test]')) {
        unlock().then(ok => {
          const status = dialog.querySelector('.pro-audio-status');
          if (!ok) { status.textContent = 'O navegador não disponibilizou áudio.'; return; }
          if (settings.muted || settings.master === 0 || settings.effects === 0) { status.textContent = 'Aumente o volume ou desative “Silenciar tudo”.'; return; }
          play('punch'); play('guard', { delay: .22 }); play('kick', { delay: .44 }); play('crowd', { delay: .68 }); play('voice', { delay: .92 });
          status.textContent = 'Teste: combate → público → voz.';
        });
      }
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeSettings(); });
    dialog.addEventListener('close', restoreFight);
  }
  function syncUI() {
    if (!dialog) return;
    for (const key of ['master', 'effects', 'interface', 'crowd', 'voice', 'music']) {
      const percent = Math.round(settings[key] * 100), input = dialog.querySelector(`[data-audio-setting="${key}"]`);
      input.value = String(percent); input.style.setProperty('--audio-fill', `${percent}%`);
      input.setAttribute('aria-valuetext', `${percent} por cento`);
      dialog.querySelector(`[data-audio-value="${key}"]`).textContent = `${percent}%`;
    }
    for (const key of ['ambience', 'muted']) dialog.querySelector(`[data-audio-setting="${key}"]`).checked = settings[key];
  }
  function restoreFight() {
    if (pausedFight) {
      try { if (typeof fight !== 'undefined' && fight === pausedFight.fighter) fight.paused = pausedFight.wasPaused; } catch (_) {}
      pausedFight = null;
    }
    window.keys = {}; window.justPressed = {};
    if (previousFocus?.isConnected) previousFocus.focus(); previousFocus = null;
  }
  function openSettings() {
    createDialog(); if (dialog.open) return;
    previousFocus = document.activeElement;
    try {
      if (typeof fight !== 'undefined' && fight && typeof screen !== 'undefined' && screen === 'fight') {
        pausedFight = { fighter: fight, wasPaused: fight.paused }; fight.paused = true;
      }
    } catch (_) {}
    window.keys = {}; window.justPressed = {}; syncUI(); unlock(); dialog.showModal();
    dialog.querySelector('[data-audio-setting="master"]').focus();
  }
  function closeSettings() { if (dialog?.open) dialog.close(); }
  function injectButtons() {
    // O som continua disponível em CONFIGURAÇÕES e no menu de pausa,
    // mas não ocupa mais um botão próprio no lobby principal.
    document.querySelectorAll('#app .menu [data-open-audio]').forEach(button => button.remove());
    const pause = document.querySelector('#arena-pause .pause-grid');
    if (pause && !pause.querySelector('[data-open-audio]')) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'pause-btn';
      button.dataset.openAudio = ''; button.textContent = '♫ CONFIGURAÇÕES DE SOM'; button.setAttribute('aria-haspopup', 'dialog'); pause.appendChild(button);
    }
  }
  function boot() {
    installGameAudio(); injectButtons();
    const host = document.getElementById('app');
    if (host) {
      let scheduled = false;
      const observer = new MutationObserver(records => {
        if (scheduled || !records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && !node.matches?.('[data-open-audio]')))) return;
        scheduled = true; queueMicrotask(() => { scheduled = false; injectButtons(); });
      });
      observer.observe(host, { childList: true, subtree: true });
    }
    document.addEventListener('click', event => { if (event.target.closest('[data-open-audio]')) { event.preventDefault(); openSettings(); } });
  }
  window.addEventListener('pointerdown', () => { if (!unlocked || context?.state === 'suspended') unlock(); }, { capture: true, passive: true });
  window.addEventListener('keydown', event => {
    if (event.isTrusted && (!unlocked || context?.state === 'suspended')) unlock();
    if (dialog?.open && event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeSettings(); }
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) { stopAmbience(); clearVoices(); context.suspend().catch(() => {}); }
    else if (unlocked) unlock();
  });
  window.addEventListener('storage', event => {
    if (event.key !== SAVE_KEY) return;
    settings = readSettings();
    if (context) { smooth(masterBus.gain, settings.muted ? 0 : settings.master); smooth(effectsBus.gain, settings.effects); smooth(musicBus.gain, settings.music); syncAmbience(); }
    syncUI();
  });
  window.ProAudio = Object.freeze({
    play, tone, unlock, openSettings, closeSettings,
    isOpen: () => Boolean(dialog?.open),
    getSettings: () => ({ ...settings }), setSettings,
    getStatus: () => ({ supported: Boolean(window.AudioContext || window.webkitAudioContext), state: context?.state || 'locked', voices: voices.size, ambience: Boolean(ambient) })
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
