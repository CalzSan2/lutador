/* SORTEP NIAK — Competitive & Polish Pack 5.0
 * Treino, movelist, desafios, temporadas, VS profissional, rivalidade,
 * chefes por fases, finalizações, dano visual, câmera, rounds, pós-luta e otimização.
 * Também corrige retorno do teclado após desligar gamepad e reforça a hitbox do Ytiri.
 */
(()=>{
  'use strict';
  if(window.LutadorV5?.version) return;

  const VERSION='5.0.0';
  const KEY='lutador-v5-competitive';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const game=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const gs=()=>{try{return typeof state!=='undefined'?state:null}catch(_){return null}};
  const chars=()=>{try{return typeof CHARACTERS!=='undefined'?CHARACTERS:[]}catch(_){return []}};
  const byId=id=>chars().find(c=>c.id===id);
  const fmt=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString('pt-BR');
  const complete=()=>window.LutadorComplete?.meta||null;
  const exp=()=>window.LutadorExpansion?.data||null;
  const progression=()=>window.ProProgression?.getSnapshot?.()||null;
  const now=()=>Date.now();

  const defaultData=()=>({
    version:VERSION,
    rivalry:{rojo:0,thuvaa:0,streakFighter:'',streak:0,bestStreak:0,history:[]},
    challenges:{daily:null,weekly:null},
    season:{id:1,start:0,end:0,history:[]},
    perf:{auto:true,lastFps:60,lowFpsSeconds:0,qualityOverride:''},
    training:{dummy:'standing'},
    seen:{bossHub:false}
  });
  let data=defaultData();
  try{data={...defaultData(),...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){data=defaultData()}
  data.rivalry={...defaultData().rivalry,...(data.rivalry||{})};
  data.challenges={...defaultData().challenges,...(data.challenges||{})};
  data.season={...defaultData().season,...(data.season||{})};
  data.perf={...defaultData().perf,...(data.perf||{})};
  data.training={...defaultData().training,...(data.training||{})};
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}};

  function toast(text,tone='normal',duration=1900){
    let host=document.querySelector('.v5-toast-host');if(!host){host=document.createElement('div');host.className='v5-toast-host';document.body.appendChild(host)}
    const el=document.createElement('div');el.className='v5-toast '+tone;el.textContent=text;host.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220)},duration);
  }
  function dialog(id,title,body){
    let d=document.getElementById(id);if(!d){d=document.createElement('dialog');d.id=id;d.className='v5-dialog';document.body.appendChild(d)}
    d.innerHTML=`<div class="v5-dialog-shell"><header><div><small>SORTEP NIAK · V${VERSION}</small><h2>${title}</h2></div><button class="v5-close" aria-label="Fechar">×</button></header><div class="v5-dialog-body">${body}</div></div>`;
    d.querySelector('.v5-close').onclick=()=>d.close();d.onclick=e=>{if(e.target===d)d.close()};return d;
  }
  function persistGame(){try{typeof persist==='function'&&persist()}catch(_){}}
  function addCoins(n){const s=gs();if(s){s.coins=(Number(s.coins)||0)+n;persistGame()}}
  function addVandais(n){const s=gs();if(s){s.vandais=(Number(s.vandais)||0)+n;persistGame()}}
  function addXp(n,source='DESAFIO'){try{window.ProProgression?.addXp?.(n,{source,passAmount:Math.round(n*.35),silent:true})}catch(_){}}
  function masteryLevel(id){const m=exp()?.mastery?.[id];return clamp(1+Math.floor((Number(m?.xp)||0)/260),1,20)}
  function masteryXp(id,n){const e=exp();if(!e)return;const m=e.mastery[id]||(e.mastery[id]={xp:0,matches:0,wins:0,maxCombo:0,damage:0,ultimates:0,claimed:[]});m.xp=(Number(m.xp)||0)+n;try{window.LutadorExpansion?.save?.()}catch(_){}}
  function title(){return progression()?.profile?.displayTitle||'NOVO DESAFIANTE'}
  function skin(){return exp()?.equipped?.skin||complete()?.cosmetics?.equippedSkin||'Original'}
  function rankInfo(){return window.LutadorComplete?.division?.()||{name:'FERRO',icon:'⬟',min:0,next:null}}

  /* =========================================================
     4. DESAFIOS DIÁRIOS / SEMANAIS
     ========================================================= */
  const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  function weekKey(){const d=new Date(),x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));const w=Math.ceil((((x-y)/86400000)+1)/7);return `${x.getUTCFullYear()}-W${String(w).padStart(2,'0')}`}
  const DAILY=[
    {id:'play3',name:'AQUECIMENTO',desc:'Complete 3 partidas.',target:3,reward:{coins:350,xp:180}},
    {id:'win2',name:'DOMÍNIO',desc:'Vença 2 partidas.',target:2,reward:{coins:450,xp:220}},
    {id:'combo8',name:'CADEIA DE IMPACTO',desc:'Faça um combo de 8 golpes.',target:8,reward:{vandais:5,xp:260,mastery:180}}
  ];
  const WEEKLY=[
    {id:'win10',name:'SEMANA DO CAMPEÃO',desc:'Vença 10 partidas.',target:10,reward:{coins:1800,vandais:10,xp:700}},
    {id:'damage8k',name:'FORÇA TOTAL',desc:'Cause 8.000 de dano.',target:8000,reward:{coins:1200,xp:900}},
    {id:'fivefighters',name:'ARSENAL VERSÁTIL',desc:'Jogue com 5 campeões diferentes.',target:5,reward:{vandais:15,xp:800,cosmetic:'Moldura Semanal'}}
  ];
  const challengeState=(catalog,key)=>({key,items:Object.fromEntries(catalog.map(c=>[c.id,{progress:0,claimed:false}])),fighters:[]});
  function ensureChallenges(){
    if(!data.challenges.daily||data.challenges.daily.key!==dayKey())data.challenges.daily=challengeState(DAILY,dayKey());
    if(!data.challenges.weekly||data.challenges.weekly.key!==weekKey())data.challenges.weekly=challengeState(WEEKLY,weekKey());
    save();
  }
  function challengeReward(item){
    if(item.coins)addCoins(item.coins);if(item.vandais)addVandais(item.vandais);if(item.xp)addXp(item.xp,'DESAFIO');if(item.mastery)masteryXp(data.lastFighter||'rojo',item.mastery);if(item.cosmetic){const e=exp();if(e?.owned?.frames&&!e.owned.frames.includes(item.cosmetic))e.owned.frames.push(item.cosmetic);try{window.LutadorExpansion?.save?.()}catch(_){}}
  }
  function challengeProgress(f,won){
    if(!f||f.mode==='tutorial'||f.mode==='training'||f.v5ChallengesRecorded)return;f.v5ChallengesRecorded=true;ensureChallenges();
    const d=data.challenges.daily,w=data.challenges.weekly,s=f.megaStats?.p1||{};
    d.items.play3.progress++;if(won)d.items.win2.progress++;d.items.combo8.progress=Math.max(d.items.combo8.progress,Number(s.maxCombo)||0);
    if(won)w.items.win10.progress++;w.items.damage8k.progress+=Math.round(Number(s.damage)||0);
    data.lastFighter=f.p1?.id||data.lastFighter||'rojo';if(!w.fighters.includes(f.p1?.id))w.fighters.push(f.p1?.id);w.items.fivefighters.progress=w.fighters.length;
    save();
  }
  function claimChallenge(scope,id){ensureChallenges();const cat=scope==='daily'?DAILY:WEEKLY,st=data.challenges[scope],cfg=cat.find(x=>x.id===id),it=st?.items?.[id];if(!cfg||!it||it.claimed||it.progress<cfg.target)return false;it.claimed=true;challengeReward(cfg.reward);save();toast(`RECOMPENSA · ${cfg.name}`,'reward');return true}
  function openChallenges(){ensureChallenges();const render=()=>{const d=dialog('v5-challenges','DESAFIOS DIÁRIOS & SEMANAIS','<div id="v5-challenges-root"></div>');const root=d.querySelector('#v5-challenges-root');const section=(titleTxt,scope,cat,st)=>`<section class="v5-challenge-section"><h3>${titleTxt}</h3><div class="v5-challenge-grid">${cat.map(c=>{const x=st.items[c.id],pct=clamp(x.progress/c.target*100,0,100),ready=x.progress>=c.target&&!x.claimed;return `<article class="${x.claimed?'claimed':ready?'ready':''}"><div><small>${x.claimed?'CONCLUÍDO':ready?'RECOMPENSA PRONTA':'EM PROGRESSO'}</small><h4>${c.name}</h4><p>${c.desc}</p></div><div class="v5-challenge-progress"><i style="width:${pct}%"></i></div><span>${fmt(Math.min(x.progress,c.target))}/${fmt(c.target)}</span><b>${c.reward.coins?`🪙 ${fmt(c.reward.coins)} `:''}${c.reward.vandais?`🟪 ${fmt(c.reward.vandais)} `:''}${c.reward.xp?`✦ ${fmt(c.reward.xp)} XP `:''}${c.reward.mastery?`★ ${fmt(c.reward.mastery)} MAESTRIA `:''}${c.reward.cosmetic?`🎨 ${esc(c.reward.cosmetic)}`:''}</b><button class="btn" data-claim="${scope}:${c.id}" ${ready?'':'disabled'}>${x.claimed?'RESGATADO':ready?'RESGATAR':'BLOQUEADO'}</button></article>`}).join('')}</div></section>`;root.innerHTML=section('HOJE · '+dayKey(),'daily',DAILY,data.challenges.daily)+section('SEMANA · '+weekKey(),'weekly',WEEKLY,data.challenges.weekly);root.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{const [s,id]=b.dataset.claim.split(':');claimChallenge(s,id);render()});if(!d.open)d.showModal();};render()}

  /* =========================================================
     5. TEMPORADAS RANKED
     ========================================================= */
  const SEASON_MS=28*86400000;
  const seasonRewards={FERRO:{coins:300},BRONZE:{coins:500},PRATA:{coins:800},OURO:{coins:1200,vandais:5},PLATINA:{coins:1800,vandais:10},DIAMANTE:{coins:2500,vandais:15},MESTRE:{coins:3500,vandais:25},PRIMORDIAL:{coins:5000,vandais:40,title:'Lenda da Temporada'}};
  function seasonDivision(rp){const ranks=[['FERRO',0],['BRONZE',200],['PRATA',450],['OURO',750],['PLATINA',1100],['DIAMANTE',1500],['MESTRE',1950],['PRIMORDIAL',2500]];let out=ranks[0][0];for(const r of ranks)if(rp>=r[1])out=r[0];return out}
  function ensureSeason(){
    const t=now();if(!data.season.start||!data.season.end){data.season.start=t;data.season.end=t+SEASON_MS;save();return}
    if(t<data.season.end)return;
    const m=complete(),oldRp=Number(m?.rank?.rp)||0,div=seasonDivision(oldRp),rew=seasonRewards[div]||{};
    if(rew.coins)addCoins(rew.coins);if(rew.vandais)addVandais(rew.vandais);if(rew.title)try{window.ProProgression?.grantTitle?.(rew.title)}catch(_){ }
    data.season.history.unshift({id:data.season.id,endedAt:t,rank:div,rp:oldRp,reward:rew});data.season.history=data.season.history.slice(0,8);
    if(m?.rank){m.rank.rp=Math.min(1200,Math.floor(oldRp*.55));m.rank.streak=0;try{window.LutadorComplete?.save?.()}catch(_){}}
    data.season.id=(Number(data.season.id)||1)+1;data.season.start=t;data.season.end=t+SEASON_MS;save();toast(`TEMPORADA ENCERRADA · ${div} · RECOMPENSAS ENTREGUES`,'premium',3600);
  }
  function seasonText(){ensureSeason();const left=Math.max(0,data.season.end-now()),days=Math.ceil(left/86400000),r=rankInfo();return {days,rank:r.name,rp:Number(complete()?.rank?.rp)||0,id:data.season.id}}
  function injectSeasonPanel(){const card=document.querySelector('.mega-rank-panel')?.parentElement||document.querySelector('.card');if(!card||card.querySelector('.v5-season-panel')||!document.querySelector('.mega-rank-panel'))return;const s=seasonText(),p=document.createElement('section');p.className='v5-season-panel';p.innerHTML=`<div><small>TEMPORADA ${s.id}</small><h3>CAMINHO PRIMORDIAL</h3><span>${s.days} DIAS RESTANTES</span></div><div><b>${s.rank}</b><strong>${s.rp} RP</strong><span>Reset parcial no fim da temporada.</span></div>`;card.querySelector('.mega-rank-panel')?.after(p)}

  /* =========================================================
     7. RIVALIDADE ROJO × THUVAA
     ========================================================= */
  function recordRivalry(f,won){if(!f||f.v5RivalRecorded)return;const ids=[f.p1?.id,f.p2?.id];if(!(ids.includes('rojo')&&ids.includes('thuvaa')))return;f.v5RivalRecorded=true;const winner=won?f.p1:f.p2,wid=winner.id;data.rivalry[wid]=(Number(data.rivalry[wid])||0)+1;if(data.rivalry.streakFighter===wid)data.rivalry.streak++;else{data.rivalry.streakFighter=wid;data.rivalry.streak=1}data.rivalry.bestStreak=Math.max(data.rivalry.bestStreak,data.rivalry.streak);data.rivalry.history.unshift({at:now(),winner:wid,p1:f.p1.id,p2:f.p2.id,score:`${bestOfThree?.p1Wins||0}-${bestOfThree?.p2Wins||0}`});data.rivalry.history=data.rivalry.history.slice(0,20);save()}
  function openRivalry(){const r=data.rivalry,total=r.rojo+r.thuvaa,d=dialog('v5-rivalry','RIVALIDADE · ROJO × THUVAA',`<section class="v5-rival-hero"><div class="red"><img src="ai-assets/characters/rojo.png"><b>ROJO</b><strong>${r.rojo}</strong><span>VITÓRIAS</span></div><em>VS</em><div class="ice"><img src="ai-assets/characters/thuvaa.png"><b>THUVAA</b><strong>${r.thuvaa}</strong><span>VITÓRIAS</span></div></section><div class="v5-rival-stats"><span>CONFRONTOS <b>${total}</b></span><span>SEQUÊNCIA <b>${r.streak} · ${(r.streakFighter||'—').toUpperCase()}</b></span><span>RECORDE <b>${r.bestStreak}</b></span></div><section class="v5-rival-history"><h3>ÚLTIMOS CONFRONTOS</h3>${r.history.length?r.history.map(h=>`<div><time>${new Date(h.at).toLocaleString('pt-BR')}</time><b>${h.winner.toUpperCase()} VENCEU</b><span>${h.score}</span></div>`).join(''):'<p>A rivalidade começa quando Rojo e Thuvaa se enfrentarem.</p>'}</section>`);if(!d.open)d.showModal()}

  /* =========================================================
     1. MODO TREINO COMPLETO
     ========================================================= */
  let trainingHudTimer=0;
  function renderTrainingSelect(){
    try{screen='training-select';drawCanvas()}catch(_){ }
    const unlocked=chars().filter(c=>gs()?.roster?.includes(c.id)&&c.id!=='ztaaa');const first=unlocked[0]?.id||'rojo',dummy=unlocked.find(c=>c.id==='thuvaa')?.id||unlocked[1]?.id||first;
    const card=c=>`<button class="v5-training-char" data-id="${c.id}"><img src="ai-assets/characters/${c.id}.png"><b>${esc(c.name)}</b><small>MAESTRIA ${masteryLevel(c.id)}</small></button>`;
    document.getElementById('app').innerHTML=`<div class="card v5-training-select"><header><small>ACADEMIA AVANÇADA</small><h2>MODO <span>TREINO</span></h2><p>Vida e stamina infinitas, dummy configurável, dano e frame de combo em tempo real.</p></header><div class="v5-training-columns"><section><h3>SEU CAMPEÃO</h3><div class="v5-training-roster" id="v5-train-p1">${unlocked.map(card).join('')}</div></section><section><h3>DUMMY</h3><div class="v5-training-roster" id="v5-train-p2">${unlocked.map(card).join('')}</div></section></div><div class="v5-training-options"><label>COMPORTAMENTO <select id="v5-dummy-mode"><option value="standing">PARADO</option><option value="guard">DEFENDENDO</option><option value="attack">ATACANDO</option></select></label><label>ARENA <select id="v5-training-stage">${(typeof STAGES!=='undefined'?STAGES:[]).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label></div><div class="v5-training-actions"><button class="btn big" id="v5-training-start">▶ INICIAR TREINO</button><button class="btn" id="v5-training-moves">📖 LISTA DE GOLPES</button><button class="btn" id="v5-training-back">VOLTAR</button></div></div>`;
    let p1=first,p2=dummy;const select=(root,id)=>{root.querySelectorAll('[data-id]').forEach(b=>b.classList.toggle('selected',b.dataset.id===id))};const r1=document.getElementById('v5-train-p1'),r2=document.getElementById('v5-train-p2');select(r1,p1);select(r2,p2);r1.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{p1=b.dataset.id;select(r1,p1)});r2.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{p2=b.dataset.id;select(r2,p2)});document.getElementById('v5-dummy-mode').value=data.training.dummy||'standing';document.getElementById('v5-training-start').onclick=()=>{data.training.dummy=document.getElementById('v5-dummy-mode').value;save();startTraining(p1,p2,data.training.dummy,document.getElementById('v5-training-stage').value)};document.getElementById('v5-training-moves').onclick=()=>openMoveList(p1);document.getElementById('v5-training-back').onclick=()=>renderModes();
  }
  function startTraining(p1,p2,dummyMode='standing',stage='dojo'){
    startFight(p1,'training',p2,stage);const f=game();if(!f)return;f.v5Training={dummy:dummyMode,totalDamage:0,lastDamage:0,lastHitAt:0,intervalMs:0,hits:0,resetCount:0};f.timer=99999;f.p2.human=false;for(const p of [f.p1,f.p2]){p.maxHp=Math.max(10000000,p.maxHp);p.hp=p.maxHp;p.proStamina=100;p.superMeter=1;p.superReady=true;}document.querySelectorAll('.mega-vs,.v5-vs-pro').forEach(x=>x.remove());f.v5IntroLock=false;f.paused=false;createTrainingHud(f);toast('TREINO INICIADO · R RESETA POSIÇÕES','premium');
  }
  function createTrainingHud(f){document.getElementById('v5-training-hud')?.remove();const el=document.createElement('aside');el.id='v5-training-hud';el.innerHTML=`<header><b>ACADEMIA</b><span>R · RESET RÁPIDO</span></header><div class="v5-train-metrics"><div><small>DANO DO GOLPE</small><b id="v5-train-last">0</b></div><div><small>DANO TOTAL</small><b id="v5-train-total">0</b></div><div><small>COMBO</small><b id="v5-train-combo">0x</b></div><div><small>JANELA</small><b id="v5-train-frame">—</b></div></div><label>DUMMY <select id="v5-train-live"><option value="standing">PARADO</option><option value="guard">DEFENDENDO</option><option value="attack">ATACANDO</option></select></label><div class="v5-train-buttons"><button id="v5-train-reset">RESET</button><button id="v5-train-movelist">GOLPES</button><button id="v5-train-exit">SAIR</button></div>`;document.body.appendChild(el);el.querySelector('#v5-train-live').value=f.v5Training.dummy;el.querySelector('#v5-train-live').onchange=e=>{f.v5Training.dummy=e.target.value;data.training.dummy=e.target.value;save()};el.querySelector('#v5-train-reset').onclick=resetTraining;el.querySelector('#v5-train-movelist').onclick=()=>openMoveList(f.p1.id);el.querySelector('#v5-train-exit').onclick=exitTraining}
  function resetTraining(){const f=game();if(!f?.v5Training)return;const a=f.p1,b=f.p2;a.x=W*.32;b.x=W*.68;a.y=b.y=0;a.vx=a.vy=b.vx=b.vy=0;a.state=b.state='idle';a.hp=a.maxHp;b.hp=b.maxHp;a.proStamina=b.proStamina=100;a.megaCombo=0;a.megaComboT=0;a.megaSequence=[];b.proKnockdownT=0;b.freezeT=0;b.attackDisabledT=0;f.v5Training.totalDamage=0;f.v5Training.lastDamage=0;f.v5Training.hits=0;f.v5Training.intervalMs=0;for(const k of (typeof REQUIRED_FIGHT_ARRAYS!=='undefined'?REQUIRED_FIGHT_ARRAYS:[]))if(Array.isArray(f[k]))f[k].length=0;toast('TREINO RESETADO','normal',900)}
  function exitTraining(){document.getElementById('v5-training-hud')?.remove();try{fight=null;bestOfThree={p1Wins:0,p2Wins:0,round:1,active:false};window.keys={};window.justPressed={};renderModes()}catch(_){location.reload()}}
  function updateTrainingHud(f){if(!f?.v5Training)return;const t=performance.now();if(t-trainingHudTimer<70)return;trainingHudTimer=t;const q=id=>document.getElementById(id);q('v5-train-last')&&(q('v5-train-last').textContent=fmt(f.v5Training.lastDamage));q('v5-train-total')&&(q('v5-train-total').textContent=fmt(f.v5Training.totalDamage));q('v5-train-combo')&&(q('v5-train-combo').textContent=`${f.p1.megaCombo||0}x`);q('v5-train-frame')&&(q('v5-train-frame').textContent=f.v5Training.intervalMs?`${Math.round(f.v5Training.intervalMs)} ms · ${Math.max(1,Math.round(f.v5Training.intervalMs/16.67))}f`:'—')}

  /* =========================================================
     2. LISTA DE GOLPES
     ========================================================= */
  const EXTRA_MOVES={
    rojo:[['I','Soco rápido'],['O','Chute pesado'],['G','Gancho Demolidor'],['I · I · O','Corrente Rubra'],['I · O · I','Sangria Carmesim'],['L','Ultimate · Coroa Rubra']],
    thuvaa:[['I','Soco glacial'],['O','Chute congelante'],['G','Gancho Glacial'],['O · I · O','Prisão Glacial'],['L','Ultimate · Zero Absoluto']]
  };
  function movesFor(id){let base=[];try{base=(typeof MOVES!=='undefined'&&MOVES[id])?[...MOVES[id]]:[]}catch(_){}const common=[['Q / Num0','Esquiva perfeita e contra-ataque'],['G / Num4','Gancho Demolidor'],['I / Num5','Soco'],['O / Num6','Chute'],['O no chão','Finalização em rival derrubado']];return [...common,...base,...(EXTRA_MOVES[id]||[])]}
  function openMoveList(initial){const roster=chars().filter(c=>gs()?.roster?.includes(c.id)),id0=initial||roster[0]?.id||'rojo';const d=dialog('v5-movelist','LISTA DE GOLPES','<div id="v5-movelist-root"></div>');const render=id=>{const c=byId(id),a=typeof ABILITIES!=='undefined'?ABILITIES[id]:null,m=movesFor(id),root=d.querySelector('#v5-movelist-root');root.innerHTML=`<div class="v5-move-layout"><aside>${roster.map(x=>`<button data-char="${x.id}" class="${x.id===id?'active':''}"><img src="ai-assets/characters/${x.id}.png"><span>${esc(x.name)}</span></button>`).join('')}</aside><main><div class="v5-move-hero"><img src="ai-assets/characters/${id}.png"><div><small>${esc(a?.tag||'CAMPEÃO')}</small><h2>${esc(c?.name||id)}</h2><p>${esc(a?.desc||'Campeão da Arena.')}</p><b>MAESTRIA ${masteryLevel(id)}</b></div></div><div class="v5-move-table">${m.map(([k,v])=>`<div><kbd>${esc(k)}</kbd><span>${esc(v)}</span></div>`).join('')}</div><section class="v5-passive"><small>PASSIVA / IDENTIDADE</small><b>${id==='rojo'?'Pressão e sangramento':id==='thuvaa'?'Controle, defesa e congelamento':esc(a?.role||'Estilo versátil')}</b></section></main></div>`;root.querySelectorAll('[data-char]').forEach(b=>b.onclick=()=>render(b.dataset.char))};render(id0);if(!d.open)d.showModal()}

  /* =========================================================
     6. MATCHMAKING / VS PROFISSIONAL
     ========================================================= */
  function showProfessionalVs(f){if(!f||f.mode==='training'||f.mode==='tutorial'||f.v5VsShown)return;f.v5VsShown=true;f.v5IntroLock=true;f.paused=true;setTimeout(()=>document.querySelectorAll('.mega-vs').forEach(x=>x.remove()),30);const rank=rankInfo(),p=progression(),e=exp();const p1Master=masteryLevel(f.p1.id),p2Master=masteryLevel(f.p2.id);const el=document.createElement('div');el.className='v5-vs-pro';el.innerHTML=`<div class="v5-vs-bg"></div><section class="p1"><img src="ai-assets/characters/${f.p1.id}.png"><div><small>${esc(title())}</small><h2>${esc(f.p1.name)}</h2><span>${rank.icon||'⬟'} ${esc(rank.name)} · ${Number(complete()?.rank?.rp)||0} RP</span><b>MAESTRIA ${p1Master} · ${esc(skin())}</b><i>${fmt(e?.stats?.wins||0)} VITÓRIAS · COMBO ${fmt(e?.stats?.maxCombo||0)}x</i></div></section><div class="center"><small>${f.mode==='ranked'?'MATCHMAKING RANKED':'ARENA OFICIAL'}</small><strong>VS</strong><span>${esc(f.stage?.name||'ARENA')}</span></div><section class="p2"><img src="ai-assets/characters/${f.p2.id}.png"><div><small>${f.p2.human?'RIVAL LOCAL':`CPU · ${(complete()?.aiDifficulty||'normal').toUpperCase()}`}</small><h2>${esc(f.p2.name)}</h2><span>${f.p2.human?`${rank.icon||'⬟'} ${esc(rank.name)}`:'RIVAL DA ARENA'}</span><b>MAESTRIA ${p2Master}</b><i>${f.mode==='ranked'?'VALENDO RP':'MELHOR DE 3'}</i></div></section>`;document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),350);if(game()===f){f.v5IntroLock=false;f.paused=false;f.lastTime=performance.now();showRoundBanner(f,1)}},1950)}

  /* =========================================================
     8. CHEFES ESPECIAIS POR FASES
     ========================================================= */
  const BOSSES=[
    {id:'hock',key:'titan',name:'HOCK TITÃ',subtitle:'O QUEBRA-MUNDOS',stage:'vulcao',hp:2.25,dmg:1.30,speed:.92,accent:'#ff8a3d'},
    {id:'thuvaa',key:'absolute',name:'THUVAA ABSOLUTO',subtitle:'ZERO ETERNO',stage:'geleira',hp:2.05,dmg:1.25,speed:1.02,accent:'#67e8f9'},
    {id:'ztaaa',key:'void',name:'ZTAAA ABISSAL',subtitle:'ARQUITETO DO VAZIO',stage:'primordial',hp:2.55,dmg:1.38,speed:1.06,accent:'#ff334f'}
  ];
  function renderBossHub(){try{screen='v5-boss-hub';drawCanvas()}catch(_){ }const unlocked=chars().filter(c=>gs()?.roster?.includes(c.id)&&c.id!=='ztaaa'),first=unlocked[0]?.id||'rojo';document.getElementById('app').innerHTML=`<div class="card v5-boss-hub"><header><small>AMEAÇAS DA TEMPORADA</small><h2>CHEFES <span>LENDÁRIOS</span></h2><p>Chefes enormes, 3 fases e padrões que ficam mais agressivos conforme a vida cai.</p></header><div class="v5-boss-pick"><label>SEU CAMPEÃO<select id="v5-boss-player">${unlocked.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label></div><div class="v5-boss-grid">${BOSSES.map((b,i)=>`<article style="--boss:${b.accent}"><img src="ai-assets/characters/${b.id}.png"><small>CHEFE ${i+1} · 3 FASES</small><h3>${b.name}</h3><p>${b.subtitle}</p><div><span>FASE I · CONTROLE</span><span>FASE II · FÚRIA</span><span>FASE III · CATACLISMO</span></div><button class="btn big" data-boss="${b.key}">ENFRENTAR</button></article>`).join('')}</div><button class="btn" id="v5-boss-back">VOLTAR</button></div>`;document.getElementById('v5-boss-player').value=first;document.querySelectorAll('[data-boss]').forEach(b=>b.onclick=()=>startLegendBoss(document.getElementById('v5-boss-player').value,b.dataset.boss));document.getElementById('v5-boss-back').onclick=()=>renderModes()}
  function startLegendBoss(player,key){const cfg=BOSSES.find(b=>b.key===key);if(!cfg)return;startFight(player,'v5boss',cfg.id,cfg.stage);const f=game();if(!f)return;f.v5Boss={cfg,phase:1,timer:1.4};f.p2.name=cfg.name;f.p2.maxHp=Math.round(f.p2.maxHp*cfg.hp);f.p2.hp=f.p2.maxHp;f.p2.dmg*=cfg.dmg;f.p2.speed*=cfg.speed;f.p2.v5Boss=true;toast(`${cfg.name} · FASE I`,'boss',2400)}
  function updateLegendBoss(f,dt){if(!f?.v5Boss||f.over||f.paused)return;const b=f.p2,cfg=f.v5Boss.cfg,ratio=b.hp/b.maxHp;const phase=ratio>.66?1:ratio>.33?2:3;if(phase!==f.v5Boss.phase){f.v5Boss.phase=phase;showBossPhase(cfg,phase);cameraFX('boss');b.attackDisabledT=0;b.specialCd=0;b.throwCd=0}f.v5Boss.timer-=dt;if(f.v5Boss.timer>0||b.state==='ko'||b.freezeT>0)return;f.v5Boss.timer=phase===1?1.8:phase===2?1.15:.72;try{if(phase===1){Math.random()<.55?throwProjectile(b):castSpecial(b)}else if(phase===2){castSpecial(b);setTimeout(()=>{if(game()===f&&!f.over)throwProjectile(b)},220)}else{castSpecial(b);setTimeout(()=>{if(game()===f&&!f.over){b.throwCd=0;throwProjectile(b)}},160);setTimeout(()=>{if(game()===f&&!f.over){b.specialCd=0;castSpecial(b)}},440)}}catch(_){}}
  function showBossPhase(cfg,phase){const el=document.createElement('div');el.className='v5-boss-phase';el.style.setProperty('--boss',cfg.accent);el.innerHTML=`<small>${cfg.name}</small><h2>FASE ${['','I','II','III'][phase]}</h2><b>${phase===2?'FÚRIA DESPERTA':phase===3?'CATACLISMO FINAL':'AMEAÇA ATIVA'}</b>`;document.body.appendChild(el);setTimeout(()=>el.remove(),1500)}

  /* =========================================================
     9. FINALIZAÇÕES EXCLUSIVAS
     ========================================================= */
  const FINISHERS={rojo:'CORTE DA COROA RUBRA',thuvaa:'PRISÃO ZERO ABSOLUTO',hock:'MARTELO DO FIM',vlad:'ECLIPSE DE SANGUE',frogh:'SALTO PRIMORDIAL',ztaaa:'COLAPSO DO VAZIO',knunka:'RELÂMPAGO DO CAÇADOR',nine85:'SYSTEM CRASH FINAL',uiye:'MEMÓRIA DE PEDRA',rtess:'COLAPSO MAGNÉTICO',atizz:'CORTE FORA DO TEMPO',grizz:'MURALHA DA FEROCIDADE',ouip:'CHUVA DO FIM',jetde:'BOLHA DE IMPACTO',xillen:'SINAL ASTRAL',ytiri:'CORRENTE DO ESPECTRO',lkugh:'ECLIPSE LUNAR',grogh:'REFLEXO DO TITÃ',dart:'QUATRO ELEMENTOS',trefoh:'JARDIM ARCANO',yoi:'NOITE DO ECLIPSE',flame:'PAREDE INFERNAL',perry:'QUEDA DA FLORESTA',verry:'SEPULTURA DE LAMA',klo:'ÚLTIMA PROBABILIDADE',klopp:'ESPELHO FINAL',jimmy:'TROVÃO TERMINAL',default:'GOLPE DA LENDA'};
  function finisherName(p){return FINISHERS[p?.id]||`${FINISHERS.default} · ${(p?.name||'CAMPEÃO').toUpperCase()}`}
  const FINISHER_PHRASES={rojo:'A COROA NÃO SE PEDE. SE CONQUISTA.',thuvaa:'ATÉ O TEMPO CONGELA DIANTE DE MIM.',hock:'A ARENA TREME ANTES DO MEU MARTELO.',vlad:'TODA VITÓRIA TEM UM PREÇO.',frogh:'EU APRENDO. EU MUDO. EU VENÇO.',ztaaa:'O VAZIO SEMPRE COBRA O ÚLTIMO GOLPE.',knunka:'VOCÊ VIU O RAIO TARDE DEMAIS.',nine85:'SEU SISTEMA FOI ENCERRADO.',uiye:'PEDRA NÃO RECUA.',rtess:'A FORÇA PUXA. EU DECIDO ONDE CAI.',atizz:'SEU ÚLTIMO SEGUNDO JÁ PASSOU.',grizz:'NÃO EXISTE CAMINHO ATRAVÉS DE MIM.',ouip:'O CÉU TAMBÉM LUTA AO MEU LADO.',jetde:'TODO IMPACTO VOLTA PARA VOCÊ.',xillen:'O SINAL JÁ ESCOLHEU O VENCEDOR.',ytiri:'NA FUMAÇA, VOCÊ PERDEU MEU RASTRO.',lkugh:'A LUA NÃO PRECISA DE TESTEMUNHAS.',grogh:'SEU GOLPE FOI SUA DERROTA.',dart:'QUATRO ELEMENTOS. UM ÚNICO FIM.',trefoh:'ATÉ A ARENA CRIA RAÍZES.',yoi:'QUANDO A LUZ SOME, EU CONTINUO.',flame:'NÃO HÁ GELO PARA ESTE INFERNO.',perry:'A FLORESTA SEMPRE SE LEVANTA.',verry:'QUANTO MAIS LUTA, MAIS AFUNDA.',klo:'A PROBABILIDADE ESCOLHEU A MIM.',klopp:'EU JÁ APRENDI O SEU FINAL.',jimmy:'O TROVÃO NÃO AVISA DUAS VEZES.'};
  function shouldFinishMatch(winner){if(game()?.mode==='v5boss')return true;return winner===game()?.p1?(bestOfThree?.p1Wins||0)>=1:(bestOfThree?.p2Wins||0)>=1}
  function showFinisher(winner,loser,done){const f=game();if(!f||f.v5FinisherActive){done();return}f.v5FinisherActive=true;f.paused=true;cameraFX('ko');const seed=[...(winner.id||'x')].reduce((a,c)=>a+c.charCodeAt(0),0),el=document.createElement('div');el.className=`v5-finisher v6-specific-finisher fin-${winner.id}`;el.style.setProperty('--v6-fin-x',`${(seed%2?1:-1)*(7+seed%12)}vw`);el.style.setProperty('--v6-fin-r',`${(seed%9)-4}deg`);el.style.setProperty('--v6-fin-h',`${seed*17%360}deg`);el.innerHTML=`<div><img src="ai-assets/characters/${winner.id}.png"><section><small>FINALIZAÇÃO EXCLUSIVA · ${esc(winner.id.toUpperCase())}</small><h1>${esc(finisherName(winner))}</h1><h2>${esc(winner.name)}</h2><span>“${esc(FINISHER_PHRASES[winner.id]||'A ARENA JÁ ESCOLHEU SEU VENCEDOR.')}”</span></section></div>`;document.body.appendChild(el);window.ProAudio?.play?.('voice',{character:winner.id,volume:.8});requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.add('impact');window.ProAudio?.play?.('ko',{character:winner.id,volume:.9});cameraFX('ko')},610);setTimeout(()=>{el.classList.add('flash');setTimeout(()=>{el.remove();if(game()===f){f.paused=false;f.lastTime=performance.now()}done()},300)},1080)}

  /* =========================================================
     10. DANO VISUAL + 11. CÂMERA CINEMATOGRÁFICA
     ========================================================= */
  let camTimer=0;
  function cameraFX(kind='hit'){const cv=typeof canvas!=='undefined'?canvas:null;if(!cv)return;const cls=kind==='ultimate'||kind==='ko'||kind==='boss'?'v5-cam-strong':'v5-cam-hit';cv.classList.remove('v5-cam-hit','v5-cam-strong');void cv.offsetWidth;cv.classList.add(cls);clearTimeout(camTimer);camTimer=setTimeout(()=>cv.classList.remove('v5-cam-hit','v5-cam-strong'),kind==='ko'?650:kind==='boss'?520:300)}
  function drawDamageVisual(ctx,p){if(!p||p.state==='ko')return;const ratio=clamp(p.hp/p.maxHp,0,1);if(ratio>.72)return;const y=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-p.y;ctx.save();ctx.translate(p.x,y-92);ctx.globalAlpha=clamp((.72-ratio)*1.7,.08,.72);ctx.strokeStyle=ratio<.35?'#ff4455':'#ffe2c1';ctx.lineWidth=2;for(let i=0;i<(ratio<.35?5:3);i++){ctx.beginPath();ctx.moveTo(-24+i*10,-34+i*6);ctx.lineTo(-7+i*11,20-i*4);ctx.stroke()}if(ratio<.35){ctx.globalAlpha=.25+.15*Math.sin(performance.now()/90);ctx.strokeStyle='#ff334f';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,56,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.9;ctx.fillStyle='#ffbcc5';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText('ESTADO CRÍTICO',0,-68)}ctx.restore()}

  /* =========================================================
     12. ROUNDS MELHORADOS
     ========================================================= */
  function showRoundBanner(f,round){if(!f||f.mode==='training'||f.mode==='tutorial')return;f.v5Round=round;const p1=bestOfThree?.p1Wins||0,p2=bestOfThree?.p2Wins||0;let main=`RODADA ${round}`,sub='LUTE!';if(p1===1&&p2===1){main='RODADA FINAL';sub='MATCH POINT · TUDO OU NADA'}else if(p1===1||p2===1){sub=`MATCH POINT · ${p1===1?f.p1.name:f.p2.name}`};const el=document.createElement('div');el.className='v5-round-banner';el.innerHTML=`<small>${esc(sub)}</small><h1>${esc(main)}</h1><b>${p1} × ${p2}</b>`;document.body.appendChild(el);setTimeout(()=>el.remove(),1250);if(round>=3)cameraFX('boss')}
  function roundResultBanner(f,winner,loser){if(!f)return;const ratio=winner.hp/winner.maxHp,comeback=winner.v5MinHpRatio!==undefined&&winner.v5MinHpRatio<.22;let label=ratio>=.985?'PERFECT':comeback?'COMEBACK':'K.O.';const el=document.createElement('div');el.className='v5-round-result '+label.toLowerCase();el.innerHTML=`<small>${esc(winner.name)}</small><h2>${label}</h2>`;document.body.appendChild(el);setTimeout(()=>el.remove(),1150)}

  /* =========================================================
     13. PÓS-LUTA PREMIUM
     ========================================================= */
  function enhanceResult(f,won){setTimeout(()=>{const card=document.querySelector('#match-result-overlay .match-result-card');if(!card||card.querySelector('.v5-result-premium')||!f)return;const s=f.megaStats?.p1||{},rank=rankInfo(),xp=progression()?.data?.totalXp||0,master=masteryLevel(f.p1.id),dailyDone=Object.values(data.challenges.daily?.items||{}).filter(x=>x.claimed||x.progress>=1).length;const sec=document.createElement('section');sec.className='v5-result-premium';sec.innerHTML=`<header><small>RELATÓRIO DE CARREIRA</small><h3>${won?'PROGRESSO GARANTIDO':'ANÁLISE DA LUTA'}</h3></header><div class="v5-result-bars"><div><span>XP DA CONTA</span><b>${fmt(xp)} XP</b><i><em style="width:${clamp((xp%1000)/10,4,100)}%"></em></i></div><div><span>MAESTRIA · ${esc(f.p1.name)}</span><b>NÍVEL ${master}</b><i><em style="width:${clamp(((exp()?.mastery?.[f.p1.id]?.xp||0)%260)/2.6,4,100)}%"></em></i></div><div><span>RANKED</span><b>${rank.icon||'⬟'} ${esc(rank.name)} · ${Number(complete()?.rank?.rp)||0} RP</b><i><em style="width:${clamp((Number(complete()?.rank?.rp)||0)/25,4,100)}%"></em></i></div></div><div class="v5-result-rewards"><span>⚔ ${fmt(s.hits||0)} GOLPES</span><span>🔥 ${fmt(s.maxCombo||0)}x COMBO</span><span>🎯 ${fmt(s.crits||0)} CRÍTICOS</span><span>📋 ${dailyDone} DESAFIOS EM ANDAMENTO</span></div><button class="btn" id="v5-result-challenges">VER DESAFIOS</button>`;card.querySelector('.match-result-actions')?.before(sec);sec.querySelector('#v5-result-challenges').onclick=openChallenges;requestAnimationFrame(()=>sec.classList.add('animate'))},40)}

  /* =========================================================
     14. OTIMIZAÇÃO PESADA / ADAPTATIVA
     ========================================================= */
  let perfFrames=0,perfStart=performance.now(),perfLastToast=0;
  function performanceTick(){perfFrames++;const t=performance.now();if(t-perfStart<1000)return;const fps=Math.round(perfFrames*1000/(t-perfStart));perfFrames=0;perfStart=t;data.perf.lastFps=fps;if(!data.perf.auto)return;if(fps<42)data.perf.lowFpsSeconds++;else data.perf.lowFpsSeconds=Math.max(0,data.perf.lowFpsSeconds-1);if(data.perf.lowFpsSeconds>=4){const u=window.LutadorUltimate;if(u?.data?.settings&&u.data.settings.graphics!=='performance'){u.data.settings.graphics='performance';try{u.save?.()}catch(_){ }save();if(t-perfLastToast>10000){perfLastToast=t;toast('MODO DESEMPENHO ATIVADO AUTOMATICAMENTE','speed',2600)}}data.perf.lowFpsSeconds=0}}
  function trimEffects(f){if(!f)return;const q=window.LutadorUltimate?.data?.settings?.graphics||'balanced',limit=q==='performance'?32:q==='balanced'?70:130;for(const k of ['sparks','lkughEffects','dartEffects','ytiriCopyFx','knunkaDashTrails','hockMoonFx']){const a=k==='sparks'?(typeof sparks!=='undefined'?sparks:null):f[k];if(Array.isArray(a)&&a.length>limit)a.splice(0,a.length-limit)}}

  /* =========================================================
     CORREÇÕES: GAMEPAD + TECLADO / SELEÇÃO / YTIRI
     ========================================================= */
  let lastPadEnabled=window.LutadorExpansion?.data?.gamepad?.enabled!==false;
  function releasePadKeys(){const codes=['KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL','KeyI','KeyO','KeyG','KeyQ','KeyT','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Numpad0','Numpad1','Numpad2','Numpad3','Numpad4','Numpad5','Numpad6','Numpad7'];window.keys=window.keys||{};window.justPressed=window.justPressed||{};for(const c of codes){window.keys[c]=false;window.justPressed[c]=false}}
  function gamepadSafetyTick(){const enabled=window.LutadorExpansion?.data?.gamepad?.enabled!==false;if(lastPadEnabled&&!enabled)toast('GAMEPAD DESATIVADO · TECLADO REATIVADO','speed',2200);lastPadEnabled=enabled}
  function polishSelection(){const root=document.querySelector('.select.mk-arena');if(!root)return;root.classList.add('v5-select-polished');const detail=document.getElementById('mk-detail');if(detail&&!detail.querySelector('.v5-move-open')){const b=document.createElement('button');b.className='btn v5-move-open';b.textContent='📖 LISTA DE GOLPES';b.onclick=()=>{const id=document.querySelector('.mk-fighter:hover')?.dataset.id||document.querySelector('.mk-fighter[data-id]')?.dataset.id;openMoveList(id)};detail.appendChild(b)}document.querySelectorAll('.mk-fighter[data-id]').forEach(card=>{card.classList.add('v5-fighter-card');const id=card.dataset.id;if(!card.querySelector('.v5-card-rank')){const badge=document.createElement('span');badge.className='v5-card-rank';badge.textContent=`M${masteryLevel(id)}`;card.querySelector('.mk-portrait')?.appendChild(badge)}})}

  /* =========================================================
     HOOKS DE JOGO
     ========================================================= */
  const baseStartFight=window.startFight;
  if(typeof baseStartFight==='function')window.startFight=function(){const r=baseStartFight.apply(this,arguments),f=game();if(f){f.v5StartedAt=performance.now();f.v5Round=1;f.v5StartRank=Number(complete()?.rank?.rp)||0;for(const p of [f.p1,f.p2])p.v5MinHpRatio=1;if(f.p1?.id==='ytiri')f.p1.rect.w=Math.max(58,f.p1.rect?.w||0);if(f.p2?.id==='ytiri')f.p2.rect.w=Math.max(58,f.p2.rect?.w||0);if(f.mode!=='training'&&f.mode!=='tutorial')setTimeout(()=>showProfessionalVs(f),20)}return r};

  const baseAi=window.aiInput;
  if(typeof baseAi==='function')window.aiInput=function(p,f,dt){if(f?.mode==='training'&&p===f.p2&&f.v5Training){const mode=f.v5Training.dummy;p.vx=0;if(mode==='standing'){p.defend=false;p.attackDisabledT=Math.max(p.attackDisabledT||0,.1);if(p.state!=='hurt'&&p.state!=='ko')p.state='idle';return}if(mode==='guard'){p.defend=true;p.guardBroken=false;p.guardHits=0;p.attackDisabledT=Math.max(p.attackDisabledT||0,.1);if(p.state!=='hurt')p.state='defend';return}if(mode==='attack'){p.attackDisabledT=0;return baseAi.apply(this,arguments)}}return baseAi.apply(this,arguments)};

  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){const f=game(),attacker=src?.owner||(src?.id&&src!==victim?src:null),before=Number(victim?.hp||0),kind=String(src?.proKind||src?.move?.kind||type||'').toLowerCase();const r=baseDamage.apply(this,arguments),after=Number(victim?.hp||0),dealt=Math.max(0,before-after);if(f?.v5Training&&attacker===f.p1&&victim===f.p2&&dealt>0){const tr=f.v5Training,tm=performance.now();tr.lastDamage=dealt;tr.totalDamage+=dealt;tr.hits++;tr.intervalMs=tr.lastHitAt?tm-tr.lastHitAt:0;tr.lastHitAt=tm;victim.hp=victim.maxHp;victim.state=victim.state==='ko'?'hurt':victim.state;f.over=false;f.matchOver=false}if(dealt>0){if(kind.includes('uppercut')||kind.includes('hook')||dealt>60)cameraFX('hit');if(attacker?.megaUltimateBoostT>0)cameraFX('ultimate')}return r};

  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){performanceTick();gamepadSafetyTick();if(f?.v5IntroLock){f.paused=true;return}const r=baseUpdate.apply(this,arguments);if(!f)return r;for(const p of [f.p1,f.p2])p.v5MinHpRatio=Math.min(p.v5MinHpRatio??1,clamp((p.hp||0)/(p.maxHp||1),0,1));if(f.mode==='training'&&f.v5Training){f.timer=99999;for(const p of [f.p1,f.p2]){p.hp=p.maxHp;p.proStamina=100;p.superMeter=1;p.superReady=true}f.over=false;f.matchOver=false;updateTrainingHud(f)}updateLegendBoss(f,dt);trimEffects(f);return r};

  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){const r=baseDrawFighter.apply(this,arguments);drawDamageVisual(ctx,p);if(p?.v5Boss){const y=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-p.y;ctx.save();ctx.textAlign='center';ctx.fillStyle='#ffd7a8';ctx.font='900 15px system-ui';ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.fillText(`CHEFE · FASE ${game()?.v5Boss?.phase||1}`,p.x,y-215);ctx.restore()}return r};

  const baseReset=window.resetRoundForNextMatch;
  if(typeof baseReset==='function')window.resetRoundForNextMatch=function(){const f=game(),next=(f?.v5Round||1)+1,r=baseReset.apply(this,arguments);if(f){f.v5Round=next;setTimeout(()=>showRoundBanner(f,next),120)}return r};

  const baseEndRound=window.endRound;
  if(typeof baseEndRound==='function')window.endRound=function(f,winner,loser){if(!f||f.v5EndRoundBypass)return baseEndRound.apply(this,arguments);roundResultBanner(f,winner,loser);cameraFX('ko');if(f.mode==='v5boss'){if(winner===f.p1)bestOfThree.p1Wins=Math.max(1,bestOfThree.p1Wins||0);else bestOfThree.p2Wins=Math.max(1,bestOfThree.p2Wins||0)}if(shouldFinishMatch(winner)&&!f.v5FinisherDone){f.v5FinisherDone=true;showFinisher(winner,loser,()=>{if(game()!==f)return;f.v5EndRoundBypass=true;try{baseEndRound.call(this,f,winner,loser)}finally{f.v5EndRoundBypass=false}});return}return baseEndRound.apply(this,arguments)};

  const baseResult=window.showMatchResult;
  if(typeof baseResult==='function')window.showMatchResult=function(won,options={}){const f=game();if(f){challengeProgress(f,!!won);recordRivalry(f,!!won)}const r=baseResult.apply(this,arguments);if(f)enhanceResult(f,!!won);return r};

  /* =========================================================
     UI INJECTIONS
     ========================================================= */
  function injectModes(){const grid=document.querySelector('.modes-screen .mode-grid');if(!grid)return;if(!document.getElementById('mode-v5-training')){const b=document.createElement('button');b.id='mode-v5-training';b.className='mode-card mk-mode v5-mode-training';b.innerHTML='<div class="mode-icon">🎯</div><span class="mode-badge">DANO / FRAMES</span><h3>MODO TREINO</h3><p>Vida e stamina infinitas, dummy e reset rápido.</p>';b.onclick=renderTrainingSelect;grid.appendChild(b)}if(!document.getElementById('mode-v5-bosses')){const b=document.createElement('button');b.id='mode-v5-bosses';b.className='mode-card mk-mode v5-mode-boss';b.innerHTML='<div class="mode-icon">☠</div><span class="mode-badge">3 FASES</span><h3>CHEFES LENDÁRIOS</h3><p>Hock Titã, Thuvaa Absoluto e Ztaaa Abissal.</p>';b.onclick=renderBossHub;grid.appendChild(b)}
    const s=seasonText();let panel=document.querySelector('.v5-season-strip');if(!panel){panel=document.createElement('section');panel.className='v5-season-strip';grid.after(panel)}panel.innerHTML=`<span>TEMPORADA ${s.id}</span><b>${s.rank} · ${s.rp} RP</b><i>${s.days} dias restantes</i>`;
  }
  function injectLobby(){const actions=document.querySelector('.lobby-actions');if(!actions)return;const add=(id,text,fn)=>{if(document.getElementById(id))return;const b=document.createElement('button');b.id=id;b.className='btn';b.textContent=text;b.onclick=fn;actions.appendChild(b)};add('v5-challenges-btn','📋 DESAFIOS',openChallenges);add('v5-rival-btn','⚔ RIVALIDADE',openRivalry)}
  function injectRanking(){injectSeasonPanel()}
  const observer=new MutationObserver(()=>{requestAnimationFrame(()=>{injectLobby();injectModes();injectRanking();polishSelection()})});observer.observe(document.body,{childList:true,subtree:true});

  document.addEventListener('keydown',e=>{const f=game();if(f?.mode==='training'&&e.code==='KeyR'&&!e.repeat&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'')){e.preventDefault();resetTraining()}if(e.code==='F2'&&!e.repeat&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'')){e.preventDefault();openMoveList(f?.p1?.id)}},true);

  // pro-expansion libera somente entradas do controle ao desligá-lo e preserva teclas físicas pressionadas.

  ensureChallenges();ensureSeason();injectLobby();injectModes();injectRanking();polishSelection();

  window.LutadorV5=Object.freeze({version:VERSION,data,save,renderTrainingSelect,openMoveList,openChallenges,openRivalry,renderBossHub,releasePadKeys});
})();
