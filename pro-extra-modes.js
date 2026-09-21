(function installProExtraModes(){
  'use strict';

  if (window.__LUTADOR_PRO_EXTRA_MODES__) return;
  window.__LUTADOR_PRO_EXTRA_MODES__ = true;

  const STORAGE_KEY = 'lutador.pro.extra-modes.v1';
  const MODE_IDS = new Set(['pro-survival', 'pro-blitz', 'pro-bossrush']);
  const MODE_META = {
    'pro-survival': {
      icon: '∞',
      badge: 'INFINITO',
      title: 'SOBREVIVÊNCIA',
      accent: 'SEM DESCANSO',
      description: 'Enfrente ondas cada vez mais fortes. A vida continua entre os combates.',
      selectHint: 'Escolha seu sobrevivente. Cada vitória cura 18% da vida e fortalece o próximo rival.'
    },
    'pro-blitz': {
      icon: '⏱',
      badge: '60 SEGUNDOS',
      title: 'BLITZ',
      accent: 'ATAQUE TOTAL',
      description: 'Uma rodada explosiva de 60 segundos. Dano, combos e tempo restante valem pontos.',
      selectHint: 'Escolha seu campeão. Você tem 60 segundos para construir o maior placar possível.'
    },
    'pro-bossrush': {
      icon: '💀',
      badge: 'DESAFIO DIÁRIO',
      title: 'BOSS RUSH',
      accent: '3 CHEFES',
      description: 'Três chefes diários, modificadores crescentes e vida compartilhada entre as lutas.',
      selectHint: 'Escolha seu campeão. A sequência de três chefes muda todos os dias.'
    }
  };

  const native = {
    renderMenu: window.renderMenu,
    renderModes: window.renderModes,
    renderSelect: window.renderSelect,
    chooseCharacterForMode: window.chooseCharacterForMode,
    startFight: window.startFight,
    registerRoundWin: window.registerRoundWin,
    update: window.update,
    draw: window.draw
  };

  if (Object.values(native).some(fn => typeof fn !== 'function')) {
    window.__LUTADOR_PRO_EXTRA_MODES__ = false;
    console.warn('[Lutador Pro] Os modos extras aguardam as APIs principais do jogo.');
    return;
  }

  let activeRun = null;
  let runSerial = 0;

  function blankRecords(){
    return {
      credits: 0,
      survival: { runs: 0, totalWins: 0, bestWave: 0 },
      blitz: { runs: 0, bestScore: 0, bestDamage: 0, bestCombo: 0 },
      bossRush: { runs: 0, clears: 0, bestBoss: 0, dailyDate: '', dailyBest: 0 }
    };
  }

  function number(value, fallback = 0){
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function loadRecords(){
    const base = blankRecords();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      base.credits = Math.max(0, number(saved.credits));
      for (const section of ['survival', 'blitz', 'bossRush']) {
        if (saved[section] && typeof saved[section] === 'object') {
          Object.assign(base[section], saved[section]);
        }
      }
    } catch (error) {
      console.warn('[Lutador Pro] Não foi possível ler os recordes extras.', error);
    }
    return base;
  }

  let records = loadRecords();

  function saveRecords(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
    catch (error) { console.warn('[Lutador Pro] Não foi possível salvar os recordes extras.', error); }
  }

  function todayKey(){
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  }

  function hashText(text){
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function seededRandom(seed){
    let value = seed >>> 0;
    return function random(){
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ result >>> 15, result | 1);
      result ^= result + Math.imul(result ^ result >>> 7, result | 61);
      return ((result ^ result >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffled(list, seed){
    const result = list.slice();
    const random = seededRandom(seed);
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function unlockedCharacters(){
    const rosterIds = Array.isArray(state?.roster) ? state.roster : [];
    const unlocked = CHARACTERS.filter(char => rosterIds.includes(char.id));
    return unlocked.length > 1 ? unlocked : CHARACTERS.slice();
  }

  function modeRecord(mode){
    if (mode === 'pro-survival') return `RECORDE: ONDA ${Math.max(0, number(records.survival.bestWave))}`;
    if (mode === 'pro-blitz') return `RECORDE: ${Math.max(0, number(records.blitz.bestScore)).toLocaleString('pt-BR')} PTS`;
    const date = todayKey();
    const daily = records.bossRush.dailyDate === date ? number(records.bossRush.dailyBest) : 0;
    return `HOJE: ${daily}/3 CHEFES`;
  }

  function modeCardsMarkup(){
    return Object.entries(MODE_META).map(([id, meta]) => `
      <button id="mode-${id}" class="mode-card mk-mode pro-extra-mode-card ${id}" data-pro-mode="${id}">
        <div class="pro-mode-glow" aria-hidden="true"></div>
        <div class="mode-icon">${meta.icon}</div>
        <span class="mode-badge">${meta.badge}</span>
        <h3>${meta.title} <span>${meta.accent}</span></h3>
        <p>${meta.description}</p>
        <small class="pro-mode-record">${modeRecord(id)}</small>
      </button>`).join('');
  }

  function decorateModes(){
    const grid = document.querySelector('.mode-grid');
    if (!grid || grid.querySelector('[data-pro-mode]')) return;
    grid.insertAdjacentHTML('beforeend', modeCardsMarkup());
    grid.querySelectorAll('[data-pro-mode]').forEach(button => {
      button.addEventListener('click', () => {
        try { SFX.play('menu_confirm'); } catch (_) {}
        window.renderSelect(button.dataset.proMode);
      });
    });

    const title = document.querySelector('.modes-screen .select-title');
    if (title && !document.querySelector('.pro-modes-divider')) {
      const divider = document.createElement('div');
      divider.className = 'pro-modes-divider';
      divider.innerHTML = `<span>ARENA PRO</span><b>${records.credits.toLocaleString('pt-BR')} CRÉDITOS</b>`;
      grid.parentNode.insertBefore(divider, grid);
    }
  }

  function decorateSelect(mode){
    if (!MODE_IDS.has(mode)) return;
    const meta = MODE_META[mode];
    const card = document.querySelector('.select.mk-card, .card.select');
    const title = card?.querySelector('.select-title');
    if (card) card.classList.add('pro-extra-select');
    if (title && !card.querySelector('.pro-select-banner')) {
      title.insertAdjacentHTML('beforebegin', `
        <div class="pro-select-banner ${mode}">
          <span class="pro-select-icon">${meta.icon}</span>
          <div><small>${meta.badge}</small><strong>${meta.title}</strong><p>${meta.selectHint}</p></div>
        </div>`);
    }
    const subtitle = card?.querySelector('.select-subtitle');
    if (subtitle) subtitle.textContent = meta.selectHint;
    const p2Status = document.getElementById('p2-status');
    if (p2Status) p2Status.textContent = mode === 'pro-bossrush' ? 'CPU · sequência diária de chefes' : 'CPU · adversário automático';
    const back = document.getElementById('btn-back');
    if (back) back.onclick = window.renderModes;
  }

  function cancelActiveRun(){
    if (!activeRun) return;
    activeRun.cancelled = true;
    clearTimeout(activeRun.transitionTimer);
    clearTimeout(activeRun.finishTimer);
    activeRun = null;
  }

  window.renderMenu = function proRenderMenu(){
    cancelActiveRun();
    return native.renderMenu.apply(this, arguments);
  };

  window.renderModes = function proRenderModes(){
    cancelActiveRun();
    const result = native.renderModes.apply(this, arguments);
    decorateModes();
    return result;
  };

  window.renderSelect = function proRenderSelect(mode){
    const result = native.renderSelect.apply(this, arguments);
    decorateSelect(mode);
    return result;
  };

  window.chooseCharacterForMode = function proChooseCharacter(id){
    if (MODE_IDS.has(selectedMode)) {
      if (!Array.isArray(state?.roster) || !state.roster.includes(id)) return;
      try { SFX.play('menu_confirm'); } catch (_) {}
      return renderStageSelect(id, selectedMode);
    }
    return native.chooseCharacterForMode.apply(this, arguments);
  };

  function randomOpponent(playerId, previousId){
    let pool = unlockedCharacters().filter(char => char.id !== playerId && char.id !== previousId);
    if (!pool.length) pool = CHARACTERS.filter(char => char.id !== playerId);
    return pool[Math.floor(Math.random() * pool.length)] || CHARACTERS[0];
  }

  function dailyBosses(playerId){
    const pool = CHARACTERS
      .filter(char => char.id !== playerId)
      .sort((a, b) => ((b.hp || 0) + (b.dmg || 0) * 20) - ((a.hp || 0) + (a.dmg || 0) * 20));
    const elite = pool.slice(0, Math.max(6, Math.min(12, pool.length)));
    return shuffled(elite, hashText(todayKey() + ':' + playerId)).slice(0, 3);
  }

  function createRun(mode, playerId, stageId){
    const run = {
      id: ++runSerial,
      mode,
      playerId,
      stageId,
      wave: 1,
      wins: 0,
      bossIndex: 0,
      bosses: mode === 'pro-bossrush' ? dailyBosses(playerId) : [],
      carryRatio: 1,
      damageDealt: 0,
      damageTaken: 0,
      bestCombo: 0,
      score: 0,
      lastOpponentId: null,
      startedAt: performance.now(),
      finished: false,
      cancelled: false,
      transitionTimer: 0,
      finishTimer: 0
    };
    return run;
  }

  function opponentFor(run){
    if (run.mode === 'pro-bossrush') return run.bosses[run.bossIndex] || randomOpponent(run.playerId, run.lastOpponentId);
    return randomOpponent(run.playerId, run.lastOpponentId);
  }

  function configureFight(run, currentFight, opponent){
    currentFight.mode = run.mode;
    currentFight.proMode = run.mode;
    currentFight.proRunId = run.id;
    currentFight.proWave = run.mode === 'pro-bossrush' ? run.bossIndex + 1 : run.wave;
    currentFight.proModeTitle = MODE_META[run.mode].title;
    currentFight.earned = 0;
    currentFight.timer = run.mode === 'pro-blitz' ? 60 : run.mode === 'pro-survival' ? 82 : 105;

    const p1 = currentFight.p1;
    const p2 = currentFight.p2;
    if (run.carryRatio < 1) p1.hp = Math.max(1, Math.min(p1.maxHp, p1.maxHp * run.carryRatio));

    if (run.mode === 'pro-survival') {
      const tier = Math.max(0, run.wave - 1);
      const hpScale = 1 + Math.min(1.35, tier * 0.09);
      p2.maxHp = Math.round(p2.maxHp * hpScale);
      p2.hp = p2.maxHp;
      p2.dmg *= 1 + Math.min(0.72, tier * 0.055);
      p2.speed *= 1 + Math.min(0.32, tier * 0.025);
      currentFight.announce = `ONDA ${run.wave}`;
    } else if (run.mode === 'pro-blitz') {
      p1.dmg *= 1.12;
      p2.dmg *= 1.08;
      p1.speed *= 1.08;
      p2.speed *= 1.08;
      currentFight.announce = 'BLITZ · 60 SEGUNDOS';
    } else {
      const rank = run.bossIndex + 1;
      p2.maxHp = Math.round(p2.maxHp * (1.18 + rank * 0.18));
      p2.hp = p2.maxHp;
      p2.dmg *= 1.08 + rank * 0.10;
      p2.speed *= 1.02 + rank * 0.04;
      p2.proBossRank = rank;
      currentFight.announce = `CHEFE ${rank}/3 · ${opponent.name}`;
    }

    try {
      bestOfThree = { p1Wins: 0, p2Wins: 0, round: 1, active: false };
    } catch (_) {}
  }

  function launchFight(run){
    if (!run || run.cancelled || run.finished || activeRun !== run) return;
    const opponent = opponentFor(run);
    if (!opponent) return finishRun(run, false, 'Nenhum adversário disponível.');
    run.lastOpponentId = opponent.id;

    // O modo tournament permite escolher a CPU por id sem ativar nenhuma regra de torneio,
    // pois o estado tournament do jogo permanece nulo. Em seguida marcamos a luta com o modo Pro.
    native.startFight(run.playerId, 'tournament', opponent.id, run.stageId);
    if (typeof fight === 'undefined' || !fight) return;
    configureFight(run, fight, opponent);
    // startFight foi capturado antes do pacote completo; prepara explicitamente
    // estatísticas, dificuldade e apresentação VS também nos modos extras.
    try { window.LutadorComplete?.prepareFight?.(fight); } catch (e) {
      console.warn('[SORTEP NIAK] apresentação do modo extra ignorada:', e);
    }
  }

  function beginRun(mode, playerId, stageId){
    cancelActiveRun();
    const run = createRun(mode, playerId, stageId);
    activeRun = run;
    launchFight(run);
  }

  window.startFight = function proStartFight(playerId, mode, player2Id, stageId){
    if (!MODE_IDS.has(mode)) return native.startFight.apply(this, arguments);
    return beginRun(mode, playerId, stageId);
  };

  function transitionToNext(run, delay){
    if (!run || run.cancelled || run.finished) return;
    run.transitionTimer = setTimeout(() => {
      if (activeRun !== run || run.cancelled || run.finished) return;
      // Faz o loop da luta anterior encerrar antes de iniciar o próximo.
      screen = 'pro-extra-transition';
      setTimeout(() => launchFight(run), 70);
    }, delay);
  }

  function addReward(run, won){
    let credits = 0;
    let xp = 0;
    if (run.mode === 'pro-survival') {
      credits = 35 + run.wins * 28;
      xp = 80 + run.wins * 45;
    } else if (run.mode === 'pro-blitz') {
      credits = Math.max(30, Math.min(280, Math.round(run.score / 70)));
      xp = Math.max(70, Math.min(550, Math.round(run.score / 28)));
    } else {
      credits = won ? 420 : 60 + run.wins * 85;
      xp = won ? 900 : 140 + run.wins * 180;
    }
    records.credits += credits;
    saveRecords();
    window.dispatchEvent(new CustomEvent('lutador:mode-reward', {
      detail: { source: 'extra-modes', mode: run.mode, credits, xp, won, score: run.score, wins: run.wins }
    }));
    return { credits, xp };
  }

  function updateRecords(run, won){
    if (run.mode === 'pro-survival') {
      records.survival.runs = number(records.survival.runs) + 1;
      records.survival.totalWins = number(records.survival.totalWins) + run.wins;
      records.survival.bestWave = Math.max(number(records.survival.bestWave), run.wins);
    } else if (run.mode === 'pro-blitz') {
      records.blitz.runs = number(records.blitz.runs) + 1;
      records.blitz.bestScore = Math.max(number(records.blitz.bestScore), run.score);
      records.blitz.bestDamage = Math.max(number(records.blitz.bestDamage), Math.round(run.damageDealt));
      records.blitz.bestCombo = Math.max(number(records.blitz.bestCombo), run.bestCombo);
    } else {
      const beaten = run.wins;
      records.bossRush.runs = number(records.bossRush.runs) + 1;
      records.bossRush.bestBoss = Math.max(number(records.bossRush.bestBoss), beaten);
      if (won) records.bossRush.clears = number(records.bossRush.clears) + 1;
      const date = todayKey();
      if (records.bossRush.dailyDate !== date) {
        records.bossRush.dailyDate = date;
        records.bossRush.dailyBest = 0;
      }
      records.bossRush.dailyBest = Math.max(number(records.bossRush.dailyBest), beaten);
    }
    saveRecords();
  }

  function summaryStats(run){
    if (run.mode === 'pro-survival') return [
      ['ONDAS VENCIDAS', run.wins],
      ['RECORDE', `ONDA ${records.survival.bestWave}`],
      ['DANO CAUSADO', Math.round(run.damageDealt).toLocaleString('pt-BR')]
    ];
    if (run.mode === 'pro-blitz') return [
      ['PLACAR', run.score.toLocaleString('pt-BR')],
      ['DANO', Math.round(run.damageDealt).toLocaleString('pt-BR')],
      ['MELHOR COMBO', `${run.bestCombo} HITS`]
    ];
    return [
      ['CHEFES VENCIDOS', `${run.wins}/3`],
      ['MELHOR DE HOJE', `${records.bossRush.dailyBest}/3`],
      ['DANO CAUSADO', Math.round(run.damageDealt).toLocaleString('pt-BR')]
    ];
  }

  function showSummary(run, won, reason, reward){
    if (activeRun !== run || run.cancelled) return;
    screen = 'pro-extra-summary';
    fight = null;
    const meta = MODE_META[run.mode];
    const stats = summaryStats(run);
    app.innerHTML = `
      <section class="card mk-card mk-arena pro-mode-summary ${run.mode} ${won ? 'is-win' : 'is-loss'}">
        <div class="pro-summary-kicker">${meta.badge}</div>
        <div class="pro-summary-emblem">${won ? '🏆' : meta.icon}</div>
        <h2>${won ? 'DESAFIO CONCLUÍDO' : 'CORRIDA ENCERRADA'}</h2>
        <p class="pro-summary-mode">${meta.title}</p>
        <p class="pro-summary-reason">${reason}</p>
        <div class="pro-summary-stats">
          ${stats.map(([label, value]) => `<div><small>${label}</small><strong>${value}</strong></div>`).join('')}
        </div>
        <div class="pro-summary-reward">
          <span>RECOMPENSA DA ARENA</span>
          <b>+${reward.credits} CRÉDITOS</b>
          <small>+${reward.xp} XP enviado ao sistema de progressão</small>
        </div>
        <div class="pro-summary-actions">
          <button id="pro-mode-retry" class="btn big">↻ JOGAR NOVAMENTE</button>
          <button id="pro-mode-list" class="btn">← VOLTAR AOS MODOS</button>
        </div>
      </section>`;

    document.getElementById('pro-mode-retry').onclick = () => beginRun(run.mode, run.playerId, run.stageId);
    document.getElementById('pro-mode-list').onclick = () => window.renderModes();
  }

  function finishRun(run, won, reason){
    if (!run || run.finished || run.cancelled) return;
    run.finished = true;
    updateRecords(run, won);
    const reward = addReward(run, won);
    run.finishTimer = setTimeout(() => showSummary(run, won, reason, reward), 950);
  }

  function handleSurvivalRound(run, currentFight, playerWon){
    if (!playerWon) {
      finishRun(run, false, `Você resistiu a ${run.wins} ${run.wins === 1 ? 'onda' : 'ondas'}.`);
      return;
    }
    run.wins += 1;
    const hpRatio = currentFight.p1.hp / Math.max(1, currentFight.p1.maxHp);
    run.carryRatio = Math.min(1, hpRatio + 0.18);
    currentFight.announce = `ONDA ${run.wave} VENCIDA · +18% VIDA`;
    currentFight.earned = 0;
    run.wave += 1;
    transitionToNext(run, 1250);
  }

  function handleBlitzRound(run, currentFight, playerWon){
    const hpRatio = Math.max(0, currentFight.p1.hp / Math.max(1, currentFight.p1.maxHp));
    const timeBonus = Math.max(0, currentFight.timer) * 24;
    const comboBonus = run.bestCombo * 180;
    run.score = Math.max(0, Math.round(run.damageDealt * 4 + hpRatio * 1100 + timeBonus + comboBonus));
    if (!playerWon) run.score = Math.round(run.score * 0.65);
    currentFight.announce = playerWon ? `BLITZ COMPLETO · ${run.score.toLocaleString('pt-BR')} PTS` : `TEMPO ESGOTADO · ${run.score.toLocaleString('pt-BR')} PTS`;
    currentFight.earned = 0;
    finishRun(run, playerWon, playerWon ? 'Vitória antes do cronômetro zerar.' : 'A CPU venceu a rodada Blitz.');
  }

  function handleBossRound(run, currentFight, playerWon){
    if (!playerWon) {
      finishRun(run, false, `O chefe ${run.bossIndex + 1} interrompeu sua sequência.`);
      return;
    }
    run.wins += 1;
    if (run.bossIndex >= 2) {
      currentFight.announce = 'BOSS RUSH CONCLUÍDO!';
      currentFight.earned = 0;
      finishRun(run, true, 'Os três chefes diários foram derrotados.');
      return;
    }
    const hpRatio = currentFight.p1.hp / Math.max(1, currentFight.p1.maxHp);
    run.carryRatio = Math.min(1, hpRatio + 0.14);
    run.bossIndex += 1;
    currentFight.announce = `CHEFE VENCIDO · PRÓXIMO ${run.bossIndex + 1}/3`;
    currentFight.earned = 0;
    transitionToNext(run, 1450);
  }

  window.registerRoundWin = function proRegisterRoundWin(winner){
    const currentFight = typeof fight !== 'undefined' ? fight : null;
    const run = activeRun;
    if (!run || !currentFight || currentFight.proRunId !== run.id || !MODE_IDS.has(currentFight.mode)) {
      return native.registerRoundWin.apply(this, arguments);
    }
    if (run.finished || run.cancelled) return;

    try { bestOfThree.active = false; } catch (_) {}
    currentFight.matchOver = true;
    const playerWon = winner === currentFight.p1;
    if (run.mode === 'pro-survival') handleSurvivalRound(run, currentFight, playerWon);
    else if (run.mode === 'pro-blitz') handleBlitzRound(run, currentFight, playerWon);
    else handleBossRound(run, currentFight, playerWon);
  };

  window.update = function proExtraUpdate(currentFight, dt){
    const run = activeRun;
    const tracked = run && currentFight && currentFight.proRunId === run.id && MODE_IDS.has(currentFight.mode);
    let p1Before = 0;
    let p2Before = 0;
    if (tracked) {
      p1Before = currentFight.p1.hp;
      p2Before = currentFight.p2.hp;
    }
    const result = native.update.apply(this, arguments);
    if (tracked && !run.cancelled) {
      run.damageDealt += Math.max(0, p2Before - currentFight.p2.hp);
      run.damageTaken += Math.max(0, p1Before - currentFight.p1.hp);
      run.bestCombo = Math.max(run.bestCombo, number(currentFight.bestCombo), number(currentFight.p1.combo));
    }
    return result;
  };

  function drawProHud(currentFight){
    const run = activeRun;
    if (!run || run.cancelled || currentFight.proRunId !== run.id) return;
    const context = canvas.getContext('2d');
    const meta = MODE_META[run.mode];
    const line = run.mode === 'pro-survival'
      ? `ONDA ${run.wave}  •  ${run.wins} VITÓRIAS`
      : run.mode === 'pro-blitz'
        ? `${Math.round(run.damageDealt * 4 + run.bestCombo * 180).toLocaleString('pt-BR')} PTS  •  ${run.bestCombo} HIT COMBO`
        : `CHEFE ${run.bossIndex + 1}/3  •  ${run.wins} DERROTADOS`;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.textAlign = 'center';
    const width = 286;
    const x = canvas.width / 2 - width / 2;
    const y = 60;
    const gradient = context.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, 'rgba(5,8,18,.92)');
    gradient.addColorStop(.5, 'rgba(40,12,25,.96)');
    gradient.addColorStop(1, 'rgba(5,8,18,.92)');
    context.fillStyle = gradient;
    context.strokeStyle = run.mode === 'pro-survival' ? '#34d399' : run.mode === 'pro-blitz' ? '#fbbf24' : '#f43f5e';
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(x, y, width, 52, 10);
    context.fill();
    context.stroke();
    context.fillStyle = '#ffffff';
    context.font = '900 15px Arial';
    context.fillText(`${meta.icon} ${meta.title}`, canvas.width / 2, y + 21);
    context.fillStyle = '#cbd5e1';
    context.font = '700 11px Arial';
    context.fillText(line, canvas.width / 2, y + 40);
    context.restore();
  }

  window.draw = function proExtraDraw(currentFight){
    const result = native.draw.apply(this, arguments);
    if (currentFight && MODE_IDS.has(currentFight.mode)) drawProHud(currentFight);
    return result;
  };

  // Evita que ESPAÇO abandone uma sequência no breve intervalo entre duas lutas.
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || !activeRun || activeRun.cancelled) return;
    const currentFight = typeof fight !== 'undefined' ? fight : null;
    if (currentFight && currentFight.proRunId === activeRun.id && currentFight.over) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.LutadorExtraModes = Object.freeze({
    version: '1.0.0',
    storageKey: STORAGE_KEY,
    getRecords: () => JSON.parse(JSON.stringify(records)),
    start: (mode, playerId, stageId) => {
      if (!MODE_IDS.has(mode)) throw new Error('Modo Pro desconhecido.');
      beginRun(mode, playerId, stageId);
    }
  });
})();
