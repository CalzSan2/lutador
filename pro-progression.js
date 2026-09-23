/*
 * LUTADOR — Progressao profissional
 * Modulo isolado: perfil, melhorias permanentes e passe de batalha.
 * Depende apenas das APIs globais ja existentes no jogo e falha de forma segura.
 */
(function progressionModule(){
  'use strict';

  if (window.ProProgression && window.ProProgression.version) return;

  const STORAGE_KEY = 'lutador-progression-v1';
  const STORAGE_BACKUP_KEY = 'lutador-progression-v1-backup';
  const VERSION = 4;
  const MAX_PROFILE_LEVEL = 100;
  const PASS_TIERS = 70;
  const PASS_XP_PER_TIER = 250;
  const PREMIUM_PSY_PRICE = 170;
  const MAX_UPGRADE_LEVEL = 7;
  const UPGRADE_COSTS = [450, 800, 1250, 1850, 2600, 3400, 4300];
  const processedMatches = new WeakSet();
  const processedTournaments = new WeakSet();
  const processedModeRewards = new WeakSet();
  let modeRewardInstalled = false;
  let combatSaveTimer = 0;
  const combatKinds = ['punch', 'kick', 'special'];
  const dailyCatalog = [
    {id:'matches', title:'Entre no ringue', description:'Complete 3 partidas, vencendo ou perdendo.', target:3, xp:180, coins:120, icon:'VS'},
    {id:'wins', title:'Sequência de conquistas', description:'Vença 2 partidas em qualquer modo.', target:2, xp:220, coins:180, icon:'★'},
    {id:'styles', title:'Lutador completo', description:'Acerte um soco, um chute e um especial com P1.', target:3, xp:250, coins:150, icon:'✦'}
  ];

  const SEASON_DURATION_MS = 28 * 24 * 60 * 60 * 1000;
  // Temporadas globais: todos os jogadores usam o mesmo ciclo de 28 dias.
  // Temporada 1: 16/09/2026 01:00:00 no horario de Sao Paulo (UTC-3).
  // Equivale a 16/09/2026 04:00:00 UTC.
  const GLOBAL_SEASON_EPOCH_MS = Date.UTC(2026, 8, 16, 4, 0, 0);
  let serverClockOffsetMs = 0;
  let serverClockReady = false;

  function seasonNow(){ return Date.now() + serverClockOffsetMs; }

  function globalSeasonWindow(now = seasonNow()){
    const safeNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
    const elapsed = Math.max(0, safeNow - GLOBAL_SEASON_EPOCH_MS);
    const index = Math.floor(elapsed / SEASON_DURATION_MS);
    const number = index + 1;
    const startedAt = GLOBAL_SEASON_EPOCH_MS + index * SEASON_DURATION_MS;
    return {number, startedAt, endAt: startedAt + SEASON_DURATION_MS};
  }

  async function syncServerClock(){
    // GitHub Pages e outros hosts HTTP enviam o cabecalho Date. Como a requisicao
    // e same-origin, podemos usa-lo como referencia para nao depender so do relogio do PC.
    try {
      const sentAt = Date.now();
      const response = await fetch(window.location.href, {method:'HEAD', cache:'no-store'});
      const receivedAt = Date.now();
      const header = response.headers.get('date');
      const serverMs = header ? Date.parse(header) : NaN;
      if (Number.isFinite(serverMs)) {
        serverClockOffsetMs = serverMs - Math.round((sentAt + receivedAt) / 2);
        serverClockReady = true;
      }
    } catch (_) {
      // Offline/host sem Date: mantem Date.now() como fallback.
    }
    return serverClockReady;
  }
  const SEASON_THEMES = [
    {key:'carmim', name:'SANGUE PRIMORDIAL', passName:'COROA CARMESIM', finalTitle:'PRIMORDIAL CARMESIM', coin:1.00, xp:1.00, freeTitles:['Sangue Novo','Sentinela Carmesim','Punho Rubro','Guardião do Sangue','Lenda Carmesim'], premiumTitles:['Elite Rubra','Carrasco Carmesim','Coroado de Sangue','Soberano Rubro','Primordial Carmesim']},
    {key:'gelo', name:'GUERRA GLACIAL', passName:'TRONO DE GELO', finalTitle:'SOBERANO GLACIAL', coin:1.04, xp:1.03, freeTitles:['Batedor Glacial','Punho de Gelo','Sentinela Polar','Guardião Invernal','Lenda Glacial'], premiumTitles:['Elite Polar','Caçador do Inverno','Coroa Congelada','Soberano do Gelo','Soberano Glacial']},
    {key:'eclipse', name:'ECLIPSE NEON', passName:'ECLIPSE NIAK', finalTitle:'ÍDOLO DO ECLIPSE', coin:1.07, xp:1.05, freeTitles:['Faísca Neon','Vigia do Eclipse','Combatente Neon','Guardião Noturno','Lenda do Eclipse'], premiumTitles:['Elite Neon','Predador do Eclipse','Coroa Neon','Soberano Noturno','Ídolo do Eclipse']},
    {key:'tita', name:'ASCENSÃO TITÂNICA', passName:'TITÃS DA ARENA', finalTitle:'TITÃ SUPREMO', coin:1.10, xp:1.07, freeTitles:['Discípulo Titânico','Quebra-Aço','Sentinela Titã','Guardião Colossal','Lenda Titânica'], premiumTitles:['Elite Titã','Caçador de Colossos','Coroa Titânica','Soberano Colossal','Titã Supremo']},
    {key:'violeta', name:'RUPTURA VIOLETA', passName:'VÉU VIOLETA', finalTitle:'ARCONTE VIOLETA', coin:1.12, xp:1.09, freeTitles:['Eco Violeta','Vigia da Ruptura','Punho Violeta','Guardião do Véu','Lenda Violeta'], premiumTitles:['Elite Violeta','Ruptor Supremo','Coroa Violeta','Soberano do Véu','Arconte Violeta']},
    {key:'inferno', name:'CHAMAS DA COROA', passName:'COROA INFERNAL', finalTitle:'REI INFERNAL', coin:1.15, xp:1.11, freeTitles:['Brasa da Arena','Punho Flamejante','Sentinela Infernal','Guardião da Coroa','Lenda das Chamas'], premiumTitles:['Elite Infernal','Executor de Cinzas','Coroa em Chamas','Soberano Infernal','Rei Infernal']}
  ];

  function seasonTheme(number){ return SEASON_THEMES[(Math.max(1, Number(number)||1)-1) % SEASON_THEMES.length]; }
  function padSeason(number){ return String(Math.max(1, Number(number)||1)).padStart(2,'0'); }
  function formatSeasonRemaining(ms){
    ms=Math.max(0, Number(ms)||0);
    const days=Math.floor(ms/86400000); ms-=days*86400000;
    const hours=Math.floor(ms/3600000); ms-=hours*3600000;
    const minutes=Math.floor(ms/60000);
    return `${days}D ${String(hours).padStart(2,'0')}H ${String(minutes).padStart(2,'0')}M`;
  }

  function localDay(){
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function defaultDaily(){ return {day:localDay(), matches:0, wins:0, hits:0, styles:[], claimed:[]}; }
  function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c])); }
  function titleLabel(value){ return value === 'Mito Sony Level' ? 'Lenda Suprema' : String(value || 'NOVO DESAFIANTE'); }

  const upgradeCatalog = {
    damage: {
      icon: '⚔️',
      name: 'Poder de Ataque',
      description: '+2,5% de dano por nível',
      bonusPerLevel: 0.025,
      stat: 'DANO'
    },
    health: {
      icon: '❤️',
      name: 'Condicionamento',
      description: '+3% de vida máxima por nível',
      bonusPerLevel: 0.03,
      stat: 'VIDA'
    },
    agility: {
      icon: '⚡',
      name: 'Agilidade',
      description: '+2% de velocidade por nível',
      bonusPerLevel: 0.02,
      stat: 'VELOCIDADE'
    }
  };

  const freeRewards = [
    {type:'coins', amount:150}, {type:'xp', amount:120}, {type:'coins', amount:200},
    {type:'title', value:'Desafiante'}, {type:'coins', amount:250}, {type:'xp', amount:180},
    {type:'coins', amount:300}, {type:'title', value:'Punho de Ferro'}, {type:'coins', amount:350},
    {type:'xp', amount:240}, {type:'coins', amount:400}, {type:'title', value:'Veterano da Arena'},
    {type:'coins', amount:450}, {type:'xp', amount:300}, {type:'coins', amount:500},
    {type:'title', value:'Mestre do Combate'}, {type:'coins', amount:600}, {type:'xp', amount:400},
    {type:'coins', amount:750}, {type:'title', value:'Lenda da Temporada'},
    {type:'coins', amount:850}, {type:'xp', amount:520}, {type:'coins', amount:950},
    {type:'title', value:'Executor Supremo'}, {type:'coins', amount:1100}, {type:'xp', amount:650},
    {type:'coins', amount:1300}, {type:'title', value:'Rei do Ringue'}, {type:'coins', amount:1600},
    {type:'title', value:'Lenda Suprema'}
  ];

  const premiumRewards = [
    {type:'coins', amount:250}, {type:'xp', amount:180}, {type:'coins', amount:350},
    {type:'title', value:'Elite Carmesim'}, {type:'coins', amount:450}, {type:'xp', amount:260},
    {type:'coins', amount:550}, {type:'title', value:'Caçador de Titãs'}, {type:'coins', amount:650},
    {type:'xp', amount:360}, {type:'coins', amount:750}, {type:'title', value:'Campeão Dourado'},
    {type:'coins', amount:900}, {type:'xp', amount:480}, {type:'coins', amount:1050},
    {type:'title', value:'Imortal da Arena'}, {type:'coins', amount:1200}, {type:'xp', amount:650},
    {type:'coins', amount:1500}, {type:'title', value:'Soberano do Kombate'},
    {type:'coins', amount:1800}, {type:'xp', amount:820}, {type:'coins', amount:2100},
    {type:'title', value:'Elite Neon'}, {type:'coins', amount:2400}, {type:'xp', amount:1000},
    {type:'coins', amount:2800}, {type:'title', value:'Deus da Temporada'}, {type:'coins', amount:3500},
    {type:'title', value:'Campeão Absoluto'}
  ];

  const extraFreeTitles = ['Guardião dos Refúgios','Voz de Rojo','Sentinela Carmesim','Mestre das Sete Arenas','Herói do Submundo'];
  const extraPremiumTitles = ['Oráculo PSY','Conquistador Sombrio','Soberano dos Refúgios','Ícone da Temporada','Segredo de Rojo'];
  while (freeRewards.length < PASS_TIERS) {
    const tier=freeRewards.length+1;
    freeRewards.push(tier%8===0 ? {type:'title',value:extraFreeTitles[(tier/8-4)%extraFreeTitles.length]} : tier%3===0 ? {type:'xp',amount:500+tier*18} : {type:'coins',amount:900+tier*45});
  }
  while (premiumRewards.length < PASS_TIERS) {
    const tier=premiumRewards.length+1;
    premiumRewards.push(tier%8===0 ? {type:'title',value:extraPremiumTitles[(tier/8-4)%extraPremiumTitles.length]} : tier%3===0 ? {type:'xp',amount:800+tier*24} : {type:'coins',amount:1500+tier*70});
  }

  // Recompensas exclusivas do PASSE PAGO. Vandais continuam sendo um recurso de
  // roleta/R.A.V.A.M, mas agora também aparecem em marcos altos da trilha premium.
  const premiumVandaisByTier = {25:8, 30:30, 35:10, 45:15, 55:20, 65:25};
  for (const [tier, amount] of Object.entries(premiumVandaisByTier)) {
    premiumRewards[Number(tier) - 1] = {type:'vandais', amount};
  }
  // Último patamar: título exclusivo apenas da trilha paga.
  premiumRewards[PASS_TIERS - 1] = {type:'title', value:'PRIMORDIAL'};

  const baseFreeRewards = freeRewards.map(reward => ({...reward}));
  const basePremiumRewards = premiumRewards.map(reward => ({...reward}));
  function applySeasonRewards(seasonNumber){
    const theme=seasonTheme(seasonNumber);
    const number=Math.max(1,Number(seasonNumber)||1);
    const titleOffset=(number-1)%theme.freeTitles.length;
    for(let i=0;i<PASS_TIERS;i++){
      const tier=i+1;
      const free={...baseFreeRewards[i]}, premium={...basePremiumRewards[i]};
      if(free.type==='coins') free.amount=Math.max(50,Math.round((free.amount*theme.coin + (number-1)*12)/25)*25);
      else if(free.type==='xp') free.amount=Math.max(50,Math.round((free.amount*theme.xp + (number-1)*8)/10)*10);
      else if(free.type==='title') free.value=theme.freeTitles[(tier+titleOffset)%theme.freeTitles.length];
      if(premium.type==='coins') premium.amount=Math.max(75,Math.round((premium.amount*theme.coin + (number-1)*20)/25)*25);
      else if(premium.type==='xp') premium.amount=Math.max(75,Math.round((premium.amount*theme.xp + (number-1)*12)/10)*10);
      else if(premium.type==='title') premium.value=theme.premiumTitles[(tier+titleOffset)%theme.premiumTitles.length];
      else if(premium.type==='vandais') premium.amount=Math.max(1,(Number(premium.amount)||0)+((number-1)%4)*2);
      freeRewards[i]=free; premiumRewards[i]=premium;
    }
    premiumRewards[PASS_TIERS-1]={type:'title',value:theme.finalTitle};
  }

  function defaultData(){
    return {
      version: VERSION,
      totalXp: 0,
      upgrades: {damage:0, health:0, agility:0},
      battlePass: {xp:0, premium:false, claimed:[]},
      season: (()=>{ const s=globalSeasonWindow(); return {number:s.number, startedAt:s.startedAt}; })(),
      titles: [],
      equippedTitle: '',
      daily: defaultDaily(),
      stats: {matches:0, wins:0, losses:0, tournaments:0, rounds:0, lastMatchAt:0},
      history: [],
      updatedAt: Date.now()
    };
  }

  function finiteInt(value, fallback, min, max){
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function sanitize(raw){
    const base = defaultData();
    if (!raw || typeof raw !== 'object') return base;
    const bp = raw.battlePass && typeof raw.battlePass === 'object' ? raw.battlePass : {};
    const up = raw.upgrades && typeof raw.upgrades === 'object' ? raw.upgrades : {};
    const stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
    const season = raw.season && typeof raw.season === 'object' ? raw.season : {};
    const titles = Array.isArray(raw.titles) ? Array.from(new Set(raw.titles.filter(x => typeof x === 'string'))).slice(0, 100) : [];
    const equipped = typeof raw.equippedTitle === 'string' && titles.includes(raw.equippedTitle) ? raw.equippedTitle : '';
    const daily = raw.daily && raw.daily.day === localDay() ? raw.daily : defaultDaily();
    return {
      version: VERSION,
      totalXp: finiteInt(raw.totalXp, 0, 0, 999999999),
      upgrades: {
        damage: finiteInt(up.damage, 0, 0, MAX_UPGRADE_LEVEL),
        health: finiteInt(up.health, 0, 0, MAX_UPGRADE_LEVEL),
        agility: finiteInt(up.agility, 0, 0, MAX_UPGRADE_LEVEL)
      },
      battlePass: {
        xp: finiteInt(bp.xp, 0, 0, 999999999),
        premium: bp.premium === true,
        claimed: Array.from(new Set(Array.isArray(bp.claimed) ? bp.claimed.filter(x => /^(free|premium):([1-9]|[1-6][0-9]|70)$/.test(String(x))) : []))
      },
      season: {
        number: finiteInt(season.number, 1, 1, 9999),
        startedAt: finiteInt(season.startedAt, base.season.startedAt, 0, Number.MAX_SAFE_INTEGER)
      },
      titles,
      equippedTitle: equipped,
      daily: {
        day:localDay(),
        matches:finiteInt(daily.matches, 0, 0, 999999),
        wins:finiteInt(daily.wins, 0, 0, 999999),
        hits:finiteInt(daily.hits, 0, 0, 999999),
        styles:Array.from(new Set(Array.isArray(daily.styles) ? daily.styles.filter(x => combatKinds.includes(x)) : [])),
        claimed:Array.from(new Set(Array.isArray(daily.claimed) ? daily.claimed.filter(x => dailyCatalog.some(m => m.id === x)) : []))
      },
      stats: {
        matches: finiteInt(stats.matches, 0, 0, 99999999),
        wins: finiteInt(stats.wins, 0, 0, 99999999),
        losses: finiteInt(stats.losses, 0, 0, 99999999),
        tournaments: finiteInt(stats.tournaments, 0, 0, 99999999),
        rounds: finiteInt(stats.rounds, 0, 0, 99999999),
        lastMatchAt: finiteInt(stats.lastMatchAt, 0, 0, Number.MAX_SAFE_INTEGER)
      },
      history: Array.isArray(raw.history) ? raw.history.filter(x => x && typeof x === 'object').slice(-30) : [],
      updatedAt: finiteInt(raw.updatedAt, Date.now(), 0, Number.MAX_SAFE_INTEGER)
    };
  }

  function load(){
    for (const key of [STORAGE_KEY, STORAGE_BACKUP_KEY]) {
      try {
        const text = localStorage.getItem(key);
        if (text) return sanitize(JSON.parse(text));
      } catch (_) {}
    }
    return defaultData();
  }

  let data = load();

  function currentSeasonInfo(){
    const now=seasonNow();
    const windowInfo=globalSeasonWindow(now);
    const number=windowInfo.number;
    const startedAt=windowInfo.startedAt;
    const endAt=windowInfo.endAt;
    const theme=seasonTheme(number);
    const remainingMs=Math.max(0,endAt-now);
    return {
      number, key:theme.key, theme:theme.name, passName:theme.passName,
      name:`TEMPORADA ${padSeason(number)} · ${theme.name}`,
      startedAt,endAt,remainingMs,remainingLabel:formatSeasonRemaining(remainingMs),
      endDate:new Date(endAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}),
      durationDays:28, finalTitle:theme.finalTitle
    };
  }

  function advanceSeasonIfNeeded(){
    const target=globalSeasonWindow();
    const oldNumber=Math.max(1,Number(data.season?.number)||1);
    const changed=oldNumber!==target.number;

    // O numero e o inicio da temporada nunca mais dependem do localStorage de cada PC.
    data.season={number:target.number, startedAt:target.startedAt};

    if(changed){
      data.battlePass={xp:0,premium:false,claimed:[]};
      data.daily=defaultDaily();
    }
    applySeasonRewards(target.number);
    return changed;
  }

  advanceSeasonIfNeeded();

  function save(){
    if (combatSaveTimer) { clearTimeout(combatSaveTimer); combatSaveTimer = 0; }
    advanceSeasonIfNeeded();
    data.version = VERSION;
    data.updatedAt = Date.now();
    try {
      const payload = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, payload);
      localStorage.setItem(STORAGE_BACKUP_KEY, payload);
      return true;
    } catch (_) {
      return false;
    }
  }

  function getGameState(){
    try { return typeof state !== 'undefined' && state ? state : null; }
    catch (_) { return null; }
  }

  function gameCoins(){
    const s = getGameState();
    return s ? Math.max(0, Number(s.coins) || 0) : 0;
  }

  function gamePsy(){
    const s = getGameState();
    return s ? Math.max(0, Math.floor(Number(s.psy) || 0)) : 0;
  }

  function saveGameState(){
    try {
      if (typeof persist === 'function') persist();
      else if (typeof saveState === 'function') saveState(getGameState());
    } catch (_) {}
  }

  function playSfx(name){
    try { if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') SFX.play(name); }
    catch (_) {}
  }

  function emit(kind, detail){
    try { window.dispatchEvent(new CustomEvent('lutador:progression', {detail:{kind, ...detail}})); }
    catch (_) {}
  }

  function xpNeededForLevel(level){
    return 400 + Math.max(0, level - 1) * 140;
  }

  function profileInfo(totalXp = data.totalXp){
    let level = 1;
    let remaining = Math.max(0, Math.floor(totalXp));
    let needed = xpNeededForLevel(level);
    while (level < MAX_PROFILE_LEVEL && remaining >= needed) {
      remaining -= needed;
      level++;
      needed = xpNeededForLevel(level);
    }
    if (level >= MAX_PROFILE_LEVEL) return {level, current:needed, needed, ratio:1, max:true};
    return {level, current:remaining, needed, ratio:Math.max(0, Math.min(1, remaining / needed)), max:false};
  }

  function passInfo(){
    if (advanceSeasonIfNeeded()) save();
    const season=currentSeasonInfo();
    const tier = Math.max(1, Math.min(PASS_TIERS, 1 + Math.floor(data.battlePass.xp / PASS_XP_PER_TIER)));
    const atMax = tier >= PASS_TIERS;
    const current = atMax ? PASS_XP_PER_TIER : data.battlePass.xp % PASS_XP_PER_TIER;
    return {
      tier,
      current,
      needed: PASS_XP_PER_TIER,
      ratio: atMax ? 1 : current / PASS_XP_PER_TIER,
      max: atMax,
      totalXp:data.battlePass.xp,
      totalNeeded:(PASS_TIERS - 1) * PASS_XP_PER_TIER,
      season,
      seasonNumber:season.number,
      seasonName:season.name,
      passName:season.passName,
      remainingMs:season.remainingMs,
      remainingLabel:season.remainingLabel,
      endAt:season.endAt,
      endDate:season.endDate
    };
  }

  function ensureDaily(){
    if (data.daily.day !== localDay()) { data.daily = defaultDaily(); save(); }
    return data.daily;
  }

  function dailyMissions(){
    const daily = ensureDaily();
    return dailyCatalog.map(mission => {
      const progress = Math.min(mission.target, mission.id === 'styles' ? daily.styles.length : daily[mission.id]);
      return {...mission, progress, completed:progress >= mission.target, claimed:daily.claimed.includes(mission.id), rewardLabel:`+${mission.xp} XP · ${mission.coins} GOLD`};
    });
  }

  // Call once per successful hit by P1; repeated damage ticks only affect the cosmetic hit counter.
  function recordCombat(kind, detail = {}){
    if (!combatKinds.includes(kind) || detail.playerSlot !== 'p1' || !(Number(detail.damage) > 0)) return false;
    const daily = ensureDaily();
    daily.hits++;
    const first = !daily.styles.includes(kind);
    if (first) daily.styles.push(kind);
    // Save only on style milestones, then batch repetitive hit updates away from the render loop.
    if (first) save();
    else if (!combatSaveTimer) combatSaveTimer = setTimeout(save, 900);
    return true;
  }

  function claimMission(id, silent = false){
    const mission = dailyMissions().find(item => item.id === id);
    const s = getGameState();
    if (!mission || !mission.completed || mission.claimed || !s) return false;
    data.daily.claimed.push(id);
    s.coins = Math.max(0, Number(s.coins) || 0) + mission.coins;
    saveGameState();
    addXp(mission.xp, {source:'MISSÃO DIÁRIA', passAmount:mission.xp, silent:true});
    save();
    if (!silent) { showToast(`${mission.title} • +${mission.xp} XP • +${mission.coins} GOLD`, 'reward'); playSfx('menu_confirm'); }
    emit('mission', {id, xp:mission.xp, coins:mission.coins});
    return true;
  }

  function equipTitle(value){
    if (value !== '' && !data.titles.includes(value)) return false;
    data.equippedTitle = value;
    save();
    emit('title', {title:titleLabel(value)});
    refreshVisibleProgress();
    return true;
  }

  function grantTitle(value){
    if (!value || typeof value !== 'string') return false;
    if (!data.titles.includes(value)) data.titles.push(value);
    if (!data.equippedTitle) data.equippedTitle = value;
    save();
    emit('title', {title:titleLabel(value)});
    refreshVisibleProgress();
    return true;
  }

  function buyTitle(value, cost){
    const s = getGameState();
    cost = Math.max(0, Math.floor(Number(cost) || 0));
    if (!s || !value || data.titles.includes(value) || (Number(s.coins) || 0) < cost) return false;
    s.coins -= cost;
    saveGameState();
    grantTitle(value);
    showToast(`TÍTULO ADQUIRIDO • ${titleLabel(value)}`, 'reward');
    return true;
  }

  function showToast(message, tone = 'normal'){
    let host = document.getElementById('pro-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'pro-toast-host';
      host.className = 'pro-toast-host';
      document.body.appendChild(host);
    }
    const toast = document.createElement('div');
    toast.className = `pro-toast ${tone}`;
    toast.textContent = message;
    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function addXp(amount, options = {}){
    amount = finiteInt(amount, 0, 0, 1000000);
    if (!amount) return profileInfo();
    const before = profileInfo();
    data.totalXp += amount;
    if (options.pass !== false) data.battlePass.xp += finiteInt(options.passAmount == null ? amount : options.passAmount, amount, 0, 1000000);
    const after = profileInfo();
    save();
    if (after.level > before.level) {
      showToast(`NÍVEL ${after.level} ALCANÇADO!`, 'level');
      playSfx('menu_confirm');
    } else if (!options.silent) {
      showToast(`+${amount} XP • ${options.source || 'PROGRESSÃO'}`, 'xp');
    }
    emit('xp', {amount, source:options.source || '', level:after.level});
    refreshVisibleProgress();
    return after;
  }

  function recordMatch(activeFight, won){
    if (!activeFight || typeof activeFight !== 'object' || activeFight.proTraining || processedMatches.has(activeFight)) return false;
    processedMatches.add(activeFight);
    const mode = String(activeFight.mode || 'cpu');
    const modeBonus = {story:35, tournament:45, boss:80, chaos:30, mix:30, lan:25, pvp:20}[mode] || 0;
    const xp = (won ? 125 : 50) + modeBonus;
    data.stats.matches++;
    data.stats[won ? 'wins' : 'losses']++;
    data.stats.lastMatchAt = Date.now();
    const daily = ensureDaily();
    daily.matches++;
    if (won) daily.wins++;
    data.history.push({at:Date.now(), won:!!won, mode, xp});
    data.history = data.history.slice(-30);
    addXp(xp, {source:won ? 'VITÓRIA' : 'PARTIDA', passAmount:xp, silent:false});
    save();
    return true;
  }

  function recordRound(){
    data.stats.rounds++;
    save();
  }

  function installModeRewards(){ /* Arena Pro removida: sem créditos/modos extras. */ }

  function rewardLabel(reward){
    if (!reward) return '—';
    if (reward.type === 'coins') return `🪙 ${reward.amount} GOLD`;
    if (reward.type === 'xp') return `✨ ${reward.amount} XP`;
    if (reward.type === 'title') return `🏷️ ${escapeHtml(titleLabel(reward.value))}`;
    if (reward.type === 'vandais') return `🟪 ${reward.amount} VANDAIS`;
    return '🎁 RECOMPENSA';
  }

  function tierUnlocked(tier){
    return tier <= passInfo().tier;
  }

  function rewardKey(track, tier){ return `${track}:${tier}`; }

  function isClaimed(track, tier){
    return data.battlePass.claimed.includes(rewardKey(track, tier));
  }

  function applyReward(reward){
    if (!reward || !['coins','xp','title','vandais'].includes(reward.type)) return false;
    const s = getGameState();
    if (reward.type === 'coins') {
      if (!s) return false;
      s.coins = Math.max(0, Number(s.coins) || 0) + reward.amount;
      saveGameState();
    } else if (reward.type === 'xp') {
      addXp(reward.amount, {source:'PASSE DE BATALHA', pass:false, silent:true});
    } else if (reward.type === 'title') {
      if (!data.titles.includes(reward.value)) data.titles.push(reward.value);
      if (!data.equippedTitle) data.equippedTitle = reward.value;
    } else if (reward.type === 'vandais') {
      if (!s) return false;
      s.vandais = Math.max(0, Math.floor(Number(s.vandais) || 0)) + Math.max(0, Math.floor(Number(reward.amount) || 0));
      saveGameState();
    }
    return true;
  }

  function claimReward(track, tier, silent = false){
    if (!['free','premium'].includes(track) || !Number.isInteger(Number(tier)) || Number(tier) < 1 || Number(tier) > PASS_TIERS) return false;
    tier = Number(tier);
    if (!tierUnlocked(tier) || isClaimed(track, tier)) return false;
    if (track === 'premium' && !data.battlePass.premium) return false;
    const reward = track === 'premium' ? premiumRewards[tier - 1] : freeRewards[tier - 1];
    const key = rewardKey(track, tier);
    data.battlePass.claimed.push(key);
    if (!applyReward(reward)) { data.battlePass.claimed = data.battlePass.claimed.filter(item => item !== key); return false; }
    save();
    if (!silent) {
      showToast(`RESGATADO • ${rewardLabel(reward)}`, 'reward');
      playSfx('menu_confirm');
    }
    emit('reward', {track, tier, reward});
    return true;
  }

  function claimAll(){
    let count = 0;
    dailyCatalog.forEach(mission => { if (claimMission(mission.id, true)) count++; });
    for (let tier = 1; tier <= passInfo().tier; tier++) {
      if (claimReward('free', tier, true)) count++;
      if (data.battlePass.premium && claimReward('premium', tier, true)) count++;
    }
    if (count) {
      showToast(`${count} RECOMPENSA${count > 1 ? 'S' : ''} RESGATADA${count > 1 ? 'S' : ''}!`, 'reward');
      playSfx('menu_confirm');
      showBattlePass(lastPassOrigin);
    } else showToast('Nenhuma recompensa disponível.', 'normal');
    return count;
  }

  function unlockPremium(){
    if (data.battlePass.premium) return true;
    const s = getGameState();
    // Preserva ativações já conquistadas em versões anteriores, sem manter o modo removido.
    if (s && Number(s.griawPassActivations) > 0){
      s.griawPassActivations = Math.max(0, Math.floor(Number(s.griawPassActivations)) - 1);
      data.battlePass.premium = true;
      saveGameState();
      save();
      showToast('PASSE PREMIUM ATIVADO!', 'level');
      playSfx('menu_confirm');
      emit('premium', {price:0, currency:'activation'});
      showBattlePass(lastPassOrigin);
      return true;
    }
    if (!s || gamePsy() < PREMIUM_PSY_PRICE) {
      showToast(`Você precisa de ${PREMIUM_PSY_PRICE.toLocaleString('pt-BR')} PSY.`, 'error');
      playSfx('menu_back');
      return false;
    }
    s.psy = gamePsy() - PREMIUM_PSY_PRICE;
    data.battlePass.premium = true;
    saveGameState();
    save();
    showToast('PASSE PREMIUM DESBLOQUEADO!', 'level');
    playSfx('menu_confirm');
    emit('premium', {price:PREMIUM_PSY_PRICE, currency:'PSY'});
    showBattlePass(lastPassOrigin);
    return true;
  }

  function buyUpgrade(id){
    const catalog = upgradeCatalog[id];
    if (!catalog) return false;
    const level = data.upgrades[id];
    if (level >= MAX_UPGRADE_LEVEL) return false;
    const cost = UPGRADE_COSTS[level];
    const s = getGameState();
    if (!s || gameCoins() < cost) {
      showToast(`Gold insuficiente: faltam ${Math.max(0, cost - gameCoins()).toLocaleString('pt-BR')}.`, 'error');
      playSfx('menu_back');
      return false;
    }
    s.coins -= cost;
    data.upgrades[id]++;
    saveGameState();
    save();
    showToast(`${catalog.name} • NÍVEL ${data.upgrades[id]}`, 'reward');
    playSfx('menu_confirm');
    emit('upgrade', {id, level:data.upgrades[id], cost});
    showUpgrades(lastUpgradeOrigin);
    return true;
  }

  function applyUpgrades(fighter, human, playerSlot){
    if (!fighter || !human || (playerSlot || 'p1') !== 'p1' || fighter.__proProgressionApplied) return fighter;
    const healthMultiplier = 1 + data.upgrades.health * upgradeCatalog.health.bonusPerLevel;
    const damageMultiplier = 1 + data.upgrades.damage * upgradeCatalog.damage.bonusPerLevel;
    const agilityMultiplier = 1 + data.upgrades.agility * upgradeCatalog.agility.bonusPerLevel;
    fighter.maxHp = Math.round((Number(fighter.maxHp) || Number(fighter.hp) || 1) * healthMultiplier);
    fighter.hp = fighter.maxHp;
    fighter.dmg = Math.round((Number(fighter.dmg) || 1) * damageMultiplier * 10) / 10;
    fighter.speed = Math.round((Number(fighter.speed) || 1) * agilityMultiplier);
    fighter.progressionBonuses = {
      health:healthMultiplier,
      damage:damageMultiplier,
      agility:agilityMultiplier
    };
    try { Object.defineProperty(fighter, '__proProgressionApplied', {value:true, configurable:true}); }
    catch (_) { fighter.__proProgressionApplied = true; }
    return fighter;
  }

  function levelPips(level){
    return Array.from({length:MAX_UPGRADE_LEVEL}, (_, index) => `<i class="${index < level ? 'on' : ''}"></i>`).join('');
  }

  function setProgressionScreen(name){
    try { if (typeof screen !== 'undefined') screen = name; } catch (_) {}
    try { if (typeof drawCanvas === 'function') drawCanvas(); } catch (_) {}
  }

  function appElement(){ return document.getElementById('app'); }

  let lastUpgradeOrigin = 'menu';
  let lastPassOrigin = 'menu';

  function backTo(origin){
    if (origin === 'shop' && typeof window.renderShop === 'function') window.renderShop();
    else if (typeof window.renderMenu === 'function') window.renderMenu();
  }

  function showUpgrades(origin = 'menu'){
    lastUpgradeOrigin = origin;
    const host = appElement();
    if (!host) return;
    setProgressionScreen('progression');
    const info = profileInfo();
    const cards = Object.entries(upgradeCatalog).map(([id, item]) => {
      const level = data.upgrades[id];
      const maxed = level >= MAX_UPGRADE_LEVEL;
      const cost = maxed ? 0 : UPGRADE_COSTS[level];
      const totalBonus = Math.round(level * item.bonusPerLevel * 1000) / 10;
      return `<article class="pro-upgrade-card" data-kind="${id}">
        <div class="pro-upgrade-icon">${item.icon}</div>
        <div class="pro-upgrade-content">
          <span class="pro-eyebrow">MELHORIA PERMANENTE</span>
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <div class="pro-upgrade-pips">${levelPips(level)}</div>
          <div class="pro-upgrade-summary"><b>NÍVEL ${level}/${MAX_UPGRADE_LEVEL}</b><span>+${totalBonus}% ${item.stat}</span></div>
          <button class="btn pro-buy-upgrade" data-upgrade="${id}" ${maxed ? 'disabled' : ''}>${maxed ? '✓ MELHORIA MÁXIMA' : `MELHORAR • ${cost.toLocaleString('pt-BR')} 🪙`}</button>
        </div>
      </article>`;
    }).join('');
    host.innerHTML = `<section class="pro-screen pro-upgrades-screen">
      <header class="pro-screen-header">
        <div><span class="pro-kicker">LUTADOR • CENTRO DE TREINAMENTO</span><h2>MELHORIAS <em>DO PERFIL</em></h2><p>Bônus equilibrados aplicados ao P1 em todas as arenas.</p></div>
        <div class="pro-wallet"><span>NÍVEL ${info.level}</span><b>🪙 ${gameCoins().toLocaleString('pt-BR')}</b></div>
      </header>
      <div class="pro-balance-note">BÔNUS MÁXIMOS DO PERFIL · DANO +17,5% · VIDA +21% · AGILIDADE +14%</div>
      <div class="pro-upgrades-grid">${cards}</div>
      <footer class="pro-screen-footer"><button id="pro-upgrade-back" class="btn">← VOLTAR</button><button id="pro-open-pass-from-upgrades" class="btn pro-accent-btn">🎫 PASSE DE BATALHA</button></footer>
    </section>`;
    host.querySelectorAll('.pro-buy-upgrade').forEach(button => button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade)));
    document.getElementById('pro-upgrade-back')?.addEventListener('click', () => backTo(lastUpgradeOrigin));
    document.getElementById('pro-open-pass-from-upgrades')?.addEventListener('click', () => showBattlePass(lastUpgradeOrigin));
  }

  function rewardButton(track, tier){
    const claimed = isClaimed(track, tier);
    const unlocked = tierUnlocked(tier) && (track === 'free' || data.battlePass.premium);
    if (claimed) return '<button class="pro-claim claimed" disabled>✓ RESGATADO</button>';
    if (!unlocked) return `<button class="pro-claim" disabled>${track === 'premium' && !data.battlePass.premium ? '🔒 PREMIUM' : '🔒 BLOQUEADO'}</button>`;
    return `<button class="pro-claim ready" data-claim-track="${track}" data-claim-tier="${tier}">RESGATAR</button>`;
  }

  function showBattlePass(origin = 'menu'){
    lastPassOrigin = origin;
    const host = appElement();
    if (!host) return;
    setProgressionScreen('battle-pass');
    const info = passInfo();
    const missions = dailyMissions();
    let readyCount = missions.filter(m => m.completed && !m.claimed).length;
    for (let tier=1; tier<=info.tier; tier++) {
      if (!isClaimed('free', tier)) readyCount++;
      if (data.battlePass.premium && !isClaimed('premium', tier)) readyCount++;
    }
    const nextTier = info.max ? PASS_TIERS : info.tier + 1;
    const nextReward = freeRewards[nextTier - 1];
    const tiers = Array.from({length:PASS_TIERS}, (_, index) => {
      const tier = index + 1;
      const unlocked = tierUnlocked(tier);
      const premiumReward = premiumRewards[index];
      const specialClass = premiumReward?.type === 'vandais' ? 'vandal-tier' : (tier === PASS_TIERS ? 'primordial-tier' : '');
      return `<article class="pp-tier-card ${unlocked ? 'unlocked' : 'locked'} ${tier === info.tier ? 'current' : ''} ${specialClass}" aria-label="Patamar ${tier}">
        <div class="pro-tier-number"><span>PATAMAR</span><b>${String(tier).padStart(2, '0')}</b></div>
        <div class="pro-track free"><span class="pro-track-name">TRILHA GRÁTIS</span><strong>${rewardLabel(freeRewards[index])}</strong>${rewardButton('free', tier)}</div>
        <div class="pro-track premium"><span class="pro-track-name">TRILHA PREMIUM</span><strong>${rewardLabel(premiumRewards[index])}</strong>${rewardButton('premium', tier)}</div>
      </article>`;
    }).join('');
    host.innerHTML = `<section class="pro-screen pro-pass-screen">
      <header class="pro-screen-header pro-pass-header">
        <div><span class="pro-kicker pp-season-name" data-season-name>${escapeHtml(info.season.name)}</span><h2 class="pp-pass-name">PASSE <em data-pass-name>${escapeHtml(info.season.passName)}</em></h2><p>Temporada de 28 dias · 70 patamares · recompensas renovadas a cada ciclo.</p></div>
        <div class="pro-wallet"><span>SUA CARTEIRA</span><b>◈ ${gameCoins().toLocaleString('pt-BR')} GOLD</b><b>💠 ${gamePsy().toLocaleString('pt-BR')} PSY</b><div class="pp-season-clock"><small>TERMINA EM</small><strong data-season-countdown>${escapeHtml(info.season.remainingLabel)}</strong><i>até ${escapeHtml(info.season.endDate)}</i></div><button id="pro-pass-back" class="pp-back" type="button">← VOLTAR AO ${origin === 'shop' ? 'ARSENAL' : 'LOBBY'}</button></div>
      </header>
      <div class="pp-season-overview">
        <div class="pp-level-medal"><small>PATAMAR</small><b>${String(info.tier).padStart(2,'0')}</b><span>DE ${PASS_TIERS}</span></div>
        <div class="pp-season-progress"><div><strong>${info.max ? 'TRILHA CONCLUÍDA' : `RUMO AO PATAMAR ${String(nextTier).padStart(2,'0')}`}</strong><span>${info.max ? `${info.totalNeeded.toLocaleString('pt-BR')} XP DE PASSE ALCANÇADOS` : `${info.current} / ${info.needed} XP`}</span></div><div class="pro-progress" role="progressbar" aria-label="Progresso do patamar" aria-valuenow="${info.current}" aria-valuemin="0" aria-valuemax="${info.needed}"><i style="width:${Math.round(info.ratio*100)}%"></i></div><small>Vitória: 125 XP · Derrota: 50 XP · Bônus por modo + missões diárias.<br>XP das recompensas sobe o perfil; XP de partidas e missões também avança o passe.</small></div>
        <div class="pp-next-reward"><small>${info.max ? 'RECOMPENSA FINAL' : 'PRÓXIMA RECOMPENSA GRÁTIS'}</small><strong>${rewardLabel(nextReward)}</strong><span>${info.max ? 'Título exclusivo da temporada' : `Faltam ${info.needed-info.current} XP`}</span></div>
      </div>
      <section class="pp-daily-section" aria-labelledby="pp-daily-heading"><div class="pp-section-caption"><h3 id="pp-daily-heading">MISSÕES DIÁRIAS</h3><span>Renovam à meia-noite local · ${missions.filter(m=>m.claimed).length}/3 resgatadas</span></div><div class="pp-daily-grid">${missions.map(mission => `<article class="pp-mission-card ${mission.claimed ? 'claimed' : mission.completed ? 'ready' : ''}"><div class="pp-mission-symbol">${mission.icon}</div><div class="pp-mission-body"><div><h4>${mission.title}</h4><b>${mission.progress}/${mission.target}</b></div><p>${mission.description}</p><div class="pro-progress"><i style="width:${mission.progress/mission.target*100}%"></i></div><footer><span>+${mission.xp} XP · ${mission.coins} GOLD</span><button class="pro-claim ${mission.completed && !mission.claimed ? 'ready' : ''}" data-claim-mission="${mission.id}" ${!mission.completed || mission.claimed ? 'disabled' : ''}>${mission.claimed ? '✓ RESGATADA' : mission.completed ? 'RESGATAR' : 'EM ANDAMENTO'}</button></footer></div></article>`).join('')}</div></section>
      <div class="pp-track-toolbar"><div><h3>TRILHA DE RECOMPENSAS</h3><small>Patamar 1 é um presente de boas-vindas. Resgate o restante ao avançar.</small></div><button id="pro-claim-all" class="btn pro-accent-btn" ${readyCount ? '' : 'disabled'}>RESGATAR DISPONÍVEIS (${readyCount})</button><div class="pp-track-nav"><button type="button" data-track-step="-1" aria-label="Patamares anteriores">←</button><button type="button" data-track-step="1" aria-label="Próximos patamares">→</button></div></div>
      <div class="pp-track-grid" tabindex="0" aria-label="Recompensas do passe; use as setas para navegar">${tiers}</div>
      <footer class="pp-pass-bottom"><div><strong>${data.battlePass.premium ? '◆ PREMIUM ATIVO' : '◆ COMPLETE A SUA COLEÇÃO'}</strong><span>O Premium é válido apenas nesta temporada. No fim dos 28 dias o Passe reinicia e chega uma nova coleção; recompensa final atual: <b>${escapeHtml(info.season.finalTitle)}</b>.</span></div>${data.battlePass.premium ? '<span class="pro-premium-owned">70 RECOMPENSAS EXTRAS</span>' : `<button id="pro-unlock-premium" class="btn pro-premium-buy">${Number(getGameState()?.griawPassActivations)>0?'USAR ATIVAÇÃO DISPONÍVEL':`DESBLOQUEAR • ${PREMIUM_PSY_PRICE.toLocaleString('pt-BR')} PSY`}</button>`}</footer>
      <div class="pp-title-locker"><label for="pp-title-select">SEU TÍTULO NO LOBBY</label><select id="pp-title-select"><option value="">NOVO DESAFIANTE</option>${data.titles.map(value=>`<option value="${escapeHtml(value)}" ${value===data.equippedTitle ? 'selected' : ''}>${escapeHtml(titleLabel(value))}</option>`).join('')}</select><button id="pp-equip-title" class="btn">EQUIPAR TÍTULO</button><button id="pro-open-upgrades-from-pass" class="btn">MELHORIAS DO PERFIL →</button></div>
    </section>`;
    host.querySelectorAll('[data-claim-track]').forEach(button => button.addEventListener('click', () => {
      if (claimReward(button.dataset.claimTrack, Number(button.dataset.claimTier))) showBattlePass(lastPassOrigin);
    }));
    document.getElementById('pro-unlock-premium')?.addEventListener('click', unlockPremium);
    document.getElementById('pro-claim-all')?.addEventListener('click', claimAll);
    document.getElementById('pro-pass-back')?.addEventListener('click', () => backTo(lastPassOrigin));
    document.getElementById('pro-open-upgrades-from-pass')?.addEventListener('click', () => showUpgrades(lastPassOrigin));
    host.querySelectorAll('[data-claim-mission]').forEach(button => button.addEventListener('click', () => { if (claimMission(button.dataset.claimMission)) showBattlePass(lastPassOrigin); }));
    document.getElementById('pp-equip-title')?.addEventListener('click', () => { if (equipTitle(document.getElementById('pp-title-select').value)) showToast(`TÍTULO EQUIPADO • ${titleLabel(data.equippedTitle)}`, 'reward'); });
    const track = host.querySelector('.pp-track-grid');
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    host.querySelectorAll('[data-track-step]').forEach(button => button.addEventListener('click', () => track.scrollBy({left:Math.max(220,track.clientWidth*.8)*Number(button.dataset.trackStep), behavior:reducedMotion ? 'auto' : 'smooth'})));
    requestAnimationFrame(() => {
      const current = track?.querySelector('.current');
      if (current) track.scrollLeft = Math.max(0,current.offsetLeft-track.offsetLeft-12);
    });
  }

  function lobbyProfileMarkup(){
    const info = profileInfo();
    const pass = passInfo();
    const winRate = data.stats.matches ? Math.round(data.stats.wins / data.stats.matches * 100) : 0;
    return `<section class="pro-profile-panel" aria-label="Progresso do jogador">
      <div class="pro-level-seal"><span>NÍVEL</span><b>${info.level}</b></div>
      <div class="pro-profile-main">
        <div class="pro-profile-line"><strong>${escapeHtml(titleLabel(data.equippedTitle))}</strong><span>${data.stats.wins} VITÓRIAS · ${winRate}% APROVEITAMENTO</span></div>
        <div class="pro-progress"><i style="width:${Math.round(info.ratio * 100)}%"></i></div>
        <div class="pro-profile-line minor"><span>${info.max ? 'NÍVEL MÁXIMO' : `${info.current} / ${info.needed} XP`}</span><span>PASSE • PATAMAR ${pass.tier}/${PASS_TIERS}</span></div>
      </div>
    </section>`;
  }

  function bindOpenButtons(root){
    root.querySelectorAll('[data-pro-open="upgrades"]').forEach(button => {
      button.onclick = () => { playSfx('menu_select'); showUpgrades(button.dataset.origin || 'menu'); };
    });
    root.querySelectorAll('[data-pro-open="pass"]').forEach(button => {
      button.onclick = () => { playSfx('menu_select'); showBattlePass(button.dataset.origin || 'menu'); };
    });
  }

  function injectLobby(){
    const host = appElement();
    const menu = host?.querySelector('.menu');
    if (!menu || menu.querySelector('.pro-profile-panel')) return;
    const coins = menu.querySelector('.coins');
    if (coins) coins.insertAdjacentHTML('afterend', lobbyProfileMarkup());
    else menu.insertAdjacentHTML('afterbegin', lobbyProfileMarkup());
    const actions = menu.querySelector('.lobby-actions');
    if (actions && !actions.querySelector('[data-pro-open]')) {
      actions.insertAdjacentHTML('beforeend', `<button class="btn pro-lobby-btn" data-pro-open="upgrades" data-origin="menu">⚙️ NÍVEL & MELHORIAS</button><button class="btn pro-lobby-btn premium" data-pro-open="pass" data-origin="menu">🎫 PASSE DE BATALHA</button>`);
    }
    bindOpenButtons(menu);
  }

  function injectShop(){
    const host = appElement();
    const shop = host?.querySelector('.shop');
    if (!shop || shop.querySelector('.pro-shop-entry')) return;
    const actions = shop.querySelector('.lobby-actions');
    if (!actions) return;
    actions.insertAdjacentHTML('beforeend', `<div class="pro-shop-entry"><button class="btn" data-pro-open="upgrades" data-origin="shop">⚙️ MELHORIAS PERMANENTES</button><button class="btn" data-pro-open="pass" data-origin="shop">🎫 PASSE DE BATALHA</button></div>`);
    bindOpenButtons(shop);
  }

  function refreshVisibleProgress(){
    const panel = appElement()?.querySelector('.pro-profile-panel');
    if (panel) panel.outerHTML = lobbyProfileMarkup();
    else if (appElement()?.querySelector('.menu')) injectLobby();
  }

  function wrapFunction(name, factory){
    const original = window[name];
    if (typeof original !== 'function' || original.__proProgressionWrapped) return false;
    const wrapped = factory(original);
    try { Object.defineProperty(wrapped, '__proProgressionWrapped', {value:true}); }
    catch (_) { wrapped.__proProgressionWrapped = true; }
    window[name] = wrapped;
    return true;
  }

  function installWrappers(){
    wrapFunction('renderMenu', original => function wrappedRenderMenu(){
      const result = original.apply(this, arguments);
      queueMicrotask(injectLobby);
      return result;
    });

    wrapFunction('renderShop', original => function wrappedRenderShop(){
      const result = original.apply(this, arguments);
      queueMicrotask(injectShop);
      return result;
    });

    wrapFunction('makeFighter', original => function wrappedMakeFighter(){
      const fighter = original.apply(this, arguments);
      return applyUpgrades(fighter, arguments[2] === true, arguments[3] || 'p1');
    });

    wrapFunction('endRound', original => function wrappedEndRound(){
      const wasOver = arguments[0]?.over;
      const result = original.apply(this, arguments);
      if (!wasOver && !arguments[0]?.proTraining) recordRound();
      return result;
    });

    wrapFunction('registerRoundWin', original => function wrappedRegisterRoundWin(){
      let activeFight = null;
      try { activeFight = typeof fight !== 'undefined' ? fight : null; } catch (_) {}
      const winner = arguments[0];
      const result = original.apply(this, arguments);
      queueMicrotask(() => {
        if (!activeFight || processedMatches.has(activeFight)) return;
        let finished = !!activeFight.matchOver;
        try { finished = finished || (typeof bestOfThree !== 'undefined' && bestOfThree && bestOfThree.active === false); } catch (_) {}
        if (finished) recordMatch(activeFight, winner === activeFight.p1);
      });
      return result;
    });

    wrapFunction('finishTournament', original => function wrappedFinishTournament(won){
      let activeTournament = null;
      try { activeTournament = typeof tournament !== 'undefined' ? tournament : null; } catch (_) {}
      const result = original.apply(this, arguments);
      if (activeTournament && !processedTournaments.has(activeTournament)) {
        processedTournaments.add(activeTournament);
        data.stats.tournaments++;
        addXp(won ? 300 : 80, {source:won ? 'TÍTULO DO TORNEIO' : 'TORNEIO', passAmount:won ? 300 : 80});
      }
      return result;
    });
  }

  let observerQueued = false;
  const observer = new MutationObserver(() => {
    if (observerQueued) return;
    observerQueued = true;
    queueMicrotask(() => {
      observerQueued = false;
      injectLobby();
      injectShop();
    });
  });

  function install(){
    // Sincroniza a referencia de tempo com o host. O jogo continua funcionando
    // normalmente se a requisicao falhar (fallback para o relogio local).
    syncServerClock().then(()=>{
      const changed=advanceSeasonIfNeeded();
      save();
      const season=currentSeasonInfo();
      document.querySelectorAll('[data-season-countdown]').forEach(el=>el.textContent=season.remainingLabel);
      document.querySelectorAll('[data-season-name]').forEach(el=>el.textContent=season.name);
      document.querySelectorAll('[data-pass-name]').forEach(el=>el.textContent=season.passName);
      if(changed && document.querySelector('.pro-pass-screen')) showBattlePass(lastPassOrigin);
    });
    setInterval(syncServerClock, 15 * 60 * 1000);
    installWrappers();
    installModeRewards();
    if (document.body) observer.observe(document.body, {childList:true, subtree:true});
    injectLobby();
    injectShop();
    window.addEventListener('beforeunload', save);
    window.addEventListener('pagehide', save);
    window.addEventListener('pro:open-missions', () => { showBattlePass('menu'); appElement()?.querySelector('.pp-daily-section')?.scrollIntoView({block:'nearest'}); });
    let lastSeasonNumber=data.season.number;
    setInterval(()=>{
      const changed=advanceSeasonIfNeeded();
      const season=currentSeasonInfo();
      document.querySelectorAll('[data-season-countdown]').forEach(el=>el.textContent=season.remainingLabel);
      document.querySelectorAll('[data-season-name]').forEach(el=>el.textContent=season.name);
      document.querySelectorAll('[data-pass-name]').forEach(el=>el.textContent=season.passName);
      if(changed||lastSeasonNumber!==season.number){
        lastSeasonNumber=season.number; save(); emit('season',{season});
        showToast(`NOVA ${season.name} • PASSE ${season.passName}`,'level');
        if(document.querySelector('.pro-pass-screen')) showBattlePass(lastPassOrigin);
      }
    },1000);
  }

  function getSnapshot(){
    const missions = dailyMissions();
    const pass=passInfo();
    return JSON.parse(JSON.stringify({data, profile:{...profileInfo(), missions, displayTitle:titleLabel(data.equippedTitle), seasonName:pass.seasonName, passName:pass.passName, seasonRemainingLabel:pass.remainingLabel}, pass, season:pass.season, coins:gameCoins(), psy:gamePsy()}));
  }

  window.ProProgression = Object.freeze({
    version: VERSION,
    install,
    getSnapshot,
    addXp,
    recordCombat,
    recordMatch,
    claimMission,
    equipTitle,
    grantTitle,
    buyTitle,
    buyUpgrade,
    claimReward,
    claimAll,
    unlockPremium,
    showUpgrades,
    showBattlePass,
    applyUpgrades,
    getSeasonInfo:()=>({...currentSeasonInfo()}),
    save
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
