/* SORTEP NIAK — R.A.V.A.M STUDIOS / ALANA SORELLE + KAIN + ARIA VALFLEUR
 * Modo premium adquirido com Vandais. Elenco exclusivo, habilidades próprias e ONLINE P2P.
 */
(()=>{
  'use strict';
  if(window.RavamStudios?.version)return;
  const VERSION='1.8.0-ravam-combat';
  const ACCESS_COST=2500;
  const PRIYA=Object.freeze({
    id:'priya',name:'Alana Sorelle',color:'#d85b42',hp:1940,dmg:32,speed:82,price:0,
    weapon:'ravamRifle',special:'tripleBombRavam',portrait:'ai-assets/characters/priya.png',secret:true,ravamOnly:true
  });
  const KAIN=Object.freeze({
    id:'kain',name:'Kain',color:'#8d93a1',hp:2180,dmg:35,speed:88,price:0,
    weapon:'kainChaos',special:'kainMirror',portrait:'ai-assets/characters/kain.png',secret:true,ravamOnly:true
  });
  const ARIA=Object.freeze({
    id:'aria',name:'Aria Valfleur',color:'#2f9d69',hp:1920,dmg:31,speed:86,price:0,
    weapon:'ariaBloom',special:'ariaVine',portrait:'ai-assets/characters/aria.png',secret:true,ravamOnly:true
  });
  const RAVAM_IDS=Object.freeze(['priya','kain','aria']);
  const ABILITY=Object.freeze({flag:'RAVAM',role:'Atiradora Tática',tag:'PRECISÃO',desc:'J dispara tiros rápidos com o rifle. O executa o Chute Tático. L ativa o super TRÍADE DEMOLIDORA e lança 3 bombas guiadas exatamente sobre a posição do rival.'});
  const KAIN_ABILITY=Object.freeze({flag:'RAVAM',role:'Mímico do Caos',tag:'PODER ATIVO',desc:'J usa o poder selecionado. H no P1 / 9 no P2 alterna entre 10 poderes: Voo, Gelo, Cura, Choque, Repulsão, Troca de Controles, Fogo, Teleporte, Roubo de Vida e Gravidade. L ativa ESPELHO ABISSAL: usa um dos poderes e devolve o super do rival contra ele.'});
  const ARIA_ABILITY=Object.freeze({flag:'RAVAM',role:'Feiticeira Botânica',tag:'VENENO',desc:'J alterna entre duas Flores Valfleur venenosas e uma trilha de grama com espinhos por 2 segundos. L invoca PRISÃO VERDANTE: um cipó nasce sob o rival, causa impacto e o mantém preso por um curto período.'});
  const PORTRAIT='ai-assets/characters/priya.png';
  const KAIN_PORTRAIT='ai-assets/characters/kain.png';
  const ARIA_PORTRAIT='ai-assets/characters/aria.png';
  const PREVIEW_SHEET='ai-assets/ravam/priya-animation-sheet-v2.png';
  const KAIN_PREVIEW_SHEET='ai-assets/ravam/kain-animation-sheet.png';
  const ARIA_PREVIEW_SHEET='ai-assets/ravam/aria/aria-animation-sheet-clean.png';
  const POSE_PATHS=Array.from({length:6},(_,i)=>`ai-assets/ravam/poses/priya-${i}.png`);
  const KAIN_POSE_PATHS=Array.from({length:6},(_,i)=>`ai-assets/ravam/kain/poses/kain-${i}.png`);
  const ARIA_POSE_PATHS=Array.from({length:6},(_,i)=>`ai-assets/ravam/aria/poses/aria-${i}.png`);
  const poseImages=POSE_PATHS.map(src=>{const im=new Image();im.decoding='async';im.src=src;return im;});
  const kainPoseImages=KAIN_POSE_PATHS.map(src=>{const im=new Image();im.decoding='async';im.src=src;return im;});
  const ariaPoseImages=ARIA_POSE_PATHS.map(src=>{const im=new Image();im.decoding='async';im.src=src;return im;});
  const KAIN_POWER_LABELS=Object.freeze({flight:'VOO',ice:'GELO',heal:'RECUPERAR VIDA',shock:'CHOQUE',repel:'REPELIR ATAQUE',swap:'TROCAR CONTROLES',fire:'FOGO',teleport:'TELEPORTE',drain:'ROUBO DE VIDA',gravity:'GRAVIDADE'});
  const KAIN_POWER_POOL=Object.freeze(Object.keys(KAIN_POWER_LABELS));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');
  const save=()=>{try{typeof persist==='function'?persist():saveState?.(state)}catch(_){}};
  const hasAccess=()=>!!(typeof state!=='undefined'&&state?.ravamModeUnlocked);
  const ensureState=()=>{
    if(typeof state==='undefined')return;
    if(!Array.isArray(state.ravamRoster))state.ravamRoster=[];
    if(state.ravamModeUnlocked){
      if(!state.ravamRoster.includes('priya'))state.ravamRoster.unshift('priya');
      // Compatibilidade com saves anteriores à Loja V17. A partir da V17,
      // Kain/Aria/Leo só entram no roster quando comprados na Loja R.A.V.A.M.
      if(Number(state.ravamStoreVersion||0)<17){
        if(!state.ravamRoster.includes('kain'))state.ravamRoster.push('kain');
        if(!state.ravamRoster.includes('aria'))state.ravamRoster.push('aria');
      }
    }
  };
  ensureState();

  function toast(msg,tone='normal'){
    try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(msg,tone,1900)}catch(_){}
    try{typeof mixToast==='function'&&mixToast(msg)}catch(_){}
  }
  function temporarilyRegister(fn){
    const added=[];
    try{
      if(typeof CHARACTERS!=='undefined'){
        if(!CHARACTERS.some(c=>c.id==='priya')){CHARACTERS.push(PRIYA);added.push('priya');}
        if(!CHARACTERS.some(c=>c.id==='kain')){CHARACTERS.push(KAIN);added.push('kain');}
        if(!CHARACTERS.some(c=>c.id==='aria')){CHARACTERS.push(ARIA);added.push('aria');}
      }
      if(typeof ABILITIES!=='undefined'){
        if(!ABILITIES.priya)ABILITIES.priya=ABILITY;
        if(!ABILITIES.kain)ABILITIES.kain=KAIN_ABILITY;
        if(!ABILITIES.aria)ABILITIES.aria=ARIA_ABILITY;
      }
      if(typeof MOVES!=='undefined'){
        if(!MOVES.priya)MOVES.priya=[['J','Tiro de precisão com rifle'],['O','Chute Tático'],['L','TRÍADE DEMOLIDORA · 3 bombas guiadas no rival']];
        if(!MOVES.kain)MOVES.kain=[['J','Usar poder selecionado'],['H / P2 9','Trocar entre 10 poderes'],['I','Soco Sombrio'],['O','Chute Sombrio'],['L','ESPELHO ABISSAL · poder + super do rival']];
        if(!MOVES.aria)MOVES.aria=[['J','Alterna: 2 Flores / Trilha de Espinhos'],['I','Soco'],['O','Chute'],['L','PRISÃO VERDANTE · cipó prende o rival']];
      }
      return fn();
    }finally{
      if(added.length&&typeof CHARACTERS!=='undefined'){
        for(const id of added){const i=CHARACTERS.findIndex(c=>c.id===id);if(i>=0)CHARACTERS.splice(i,1);}
      }
    }
  }

  const baseStartFight=window.startFight;
  if(typeof baseStartFight==='function')window.startFight=function(playerId,mode,player2Id,stageId,chaos){
    if(RAVAM_IDS.includes(playerId)||RAVAM_IDS.includes(player2Id)){
      return temporarilyRegister(()=>{
        const r=baseStartFight.call(this,playerId,mode,player2Id,stageId,chaos);
        try{
          if(typeof fight!=='undefined'&&fight){
            fight.ravamStudios=true;fight.priyaBullets=[];fight.priyaBombs=[];
            fight.kainIceShots=[];fight.kainFireShots=[];fight.kainBolts=[];fight.kainMirrorCasts=[];fight.kainFx=[];
            fight.ariaFlowers=[];fight.ariaGrass=[];fight.ariaVines=[];fight.ariaFx=[];fight.priyaExplosions=[];fight.ravamVersion=VERSION;
            for(const q of [fight.p1,fight.p2]){
              if(q?.id==='kain')q.kainFlightT=0,q.kainRepelT=0,q.kainControlSwapT=0,q.kainPowerFxT=0,q.kainSuperT=0,q.kainLastRandomPower='',q.kainPowerIndex=0,q.kainSelectedPower=KAIN_POWER_POOL[0],q.kainPowerSwitchCd=0;
              if(q?.id==='aria')q.ariaCastT=0,q.ariaSuperT=0,q.ariaAttackAlt=0;
              if(q){q.ariaPoisonT=0;q.ariaVineT=0;if(q.id==='priya')q.alanaShotCounter=0;}
            }
          }
        }catch(_){}
        return r;
      });
    }
    return baseStartFight.apply(this,arguments);
  };

  function renderLocked(){
    const can=(Number(state.vandais)||0)>=ACCESS_COST;
    app.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen">
      <section class="ravam-pro-hero locked">
        <div class="ravam-copy"><small>UNIVERSO PREMIUM</small><h2>R.A.V.A.M <span>STUDIOS</span></h2><p>Um elenco separado dos campeões tradicionais, com identidade e progressão próprias. O acesso é permanente depois da compra.</p><div class="ravam-price">🟪 ${fmt(ACCESS_COST)} VANDAIS</div><div class="ravam-wallet-line">SALDO ATUAL · 🟪 ${fmt(state.vandais||0)} VANDAIS</div></div>
        <img src="${ARIA_PORTRAIT}" alt="Aria Valfleur">
      </section>
      <section class="ravam-unlock-card"><div><small>3 LENDAS INCLUÍDAS</small><h3>ALANA SORELLE + KAIN + ARIA VALFLEUR</h3><p>Alana domina a precisão, Kain controla poderes do caos e Aria usa flores venenosas e cipós para controlar a arena.</p></div><button id="ravam-buy-access" class="btn big" ${can?'':'disabled'}>${can?'🟪 ADQUIRIR MODO R.A.V.A.M':'VANDAIS INSUFICIENTES'}</button></section>
      <button id="ravam-back" class="btn">← VOLTAR AOS MODOS</button>
    </div>`;
    const buy=document.getElementById('ravam-buy-access');
    if(buy&&can)buy.onclick=()=>{
      state.vandais=Math.max(0,(Number(state.vandais)||0)-ACCESS_COST);
      state.ravamModeUnlocked=true;state.ravamRoster=['priya','kain','aria'];state.ravamPurchasedAt=Date.now();save();
      toast('R.A.V.A.M STUDIOS DESBLOQUEADO · ALANA + KAIN + ARIA','reward');renderRavamMode();
    };
    document.getElementById('ravam-back').onclick=()=>window.renderModes?.();
  }


  const displayName=id=>id==='kain'?'KAIN':id==='aria'?'ARIA VALFLEUR':id==='priya'?'ALANA SORELLE':'AGUARDANDO';
  const storyRival=id=>({priya:'aria',aria:'kain',kain:'priya'}[id]||'kain');
  const cpuRival=id=>RAVAM_IDS.find(x=>x!==id)||'kain';

  function startRavamStory(heroId){
    const rival=storyRival(heroId);
    SFX?.play?.('menu_confirm');
    window.startFight(heroId,'ravam',rival);
    try{
      if(typeof fight!=='undefined'&&fight){
        fight.ravamStudios=true;
        fight.ravamStory=true;
        fight.ravamStoryHero=heroId;
        fight.ravamStoryRival=rival;
        fight.ravamStoryTitle=heroId==='kain'?'O ESPELHO SEM ROSTO':heroId==='aria'?'O JARDIM QUE NÃO DORME':'A CAÇADORA E O JARDIM';
      }
    }catch(_){}
    toast(`MODO HISTÓRIA · ${displayName(heroId)}`,'reward');
  }

  function modeCopy(mode){
    if(mode==='pvp')return {title:'1P × 2P',eyebrow:'DUELO LOCAL',desc:'Escolha a Lenda do Jogador 1 e depois a Lenda do Jogador 2.',accent:'cyan'};
    if(mode==='story')return {title:'MODO HISTÓRIA',eyebrow:'CAPÍTULO R.A.V.A.M',desc:'Escolha a Lenda protagonista. O rival é definido pelo capítulo.',accent:'violet'};
    return {title:'1P × CPU',eyebrow:'COMBATE SOLO',desc:'Escolha sua Lenda. A CPU entra com a outra Lenda do elenco.',accent:'red'};
  }
  function legendCard(id,selected=false,slot=''){
    const isKain=id==='kain',isAria=id==='aria';
    const name=displayName(id),portrait=isKain?KAIN_PORTRAIT:isAria?ARIA_PORTRAIT:PORTRAIT;
    const ability=isKain?KAIN_ABILITY:isAria?ARIA_ABILITY:ABILITY;
    const stats=isKain?['35','88','2180']:isAria?['31','86','1920']:['32','82','1940'];
    const moves=isKain
      ? '<span><kbd>J</kbd> USAR PODER</span><span><kbd>H</kbd> TROCAR PODER</span><span><kbd>I</kbd> SOCO</span><span><kbd>O</kbd> CHUTE</span><span><kbd>L</kbd> ESPELHO</span>'
      : isAria
        ? '<span><kbd>J</kbd> 2 FLORES</span><span><kbd>I</kbd> SOCO</span><span><kbd>O</kbd> CHUTE</span><span><kbd>L</kbd> CIPÓ</span>'
        : '<span><kbd>J</kbd> RIFLE</span><span><kbd>I</kbd> SOCO</span><span><kbd>O</kbd> CHUTE</span><span><kbd>L</kbd> 3 BOMBAS</span>';
    const cls=isKain?'kain':isAria?'aria':'alana';
    const tag=isKain?'CAOS':isAria?'NATUREZA':'PRECISÃO';
    return `<button class="ravam-legend-card ${cls} ${selected?'selected':''}" data-ravam-char="${id}" aria-pressed="${selected}">
      <div class="ravam-priya-art"><img src="${portrait}" alt="${name}"></div>
      <div class="ravam-priya-info"><small>LENDA R.A.V.A.M · ${tag}</small><h3>${name}</h3><p>${ability.desc}</p><div class="ravam-stats"><span><b>${stats[0]}</b>DANO</span><span><b>${stats[1]}</b>AGILIDADE</span><span><b>${stats[2]}</b>VIDA</span></div><div class="ravam-moves">${moves}</div></div>
      <span class="ravam-selected-mark">${slot||'SELECIONADO'}</span>
    </button>`;
  }

  function renderModeHub(){
    app.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen ravam-v14 ravam-v15">
      <section class="ravam-selection-head">
        <div class="ravam-brand-lockup"><small>R.A.V.A.M STUDIOS · ACESSO ATIVO</small><h2>ESCOLHA O <span>MODO</span></h2><p>Primeiro defina a batalha. A seleção das Lendas vem na tela seguinte.</p></div>
        <div class="ravam-head-wallet"><span>CARTEIRA R.A.V.A.M</span><b>🟪 ${fmt(state.vandais||0)}</b><small>VANDAIS</small></div>
      </section>
      <section class="ravam-mode-showcase"><div><small>ELENCO ATUAL · 3 LENDAS</small><h3>ALANA <i>·</i> KAIN <i>·</i> ARIA</h3><p>Precisão, caos e natureza. Escolha o formato da luta e depois monte o confronto.</p></div><div class="ravam-dual-art ravam-triple-art"><img src="${PORTRAIT}" alt="Alana Sorelle"><img src="${KAIN_PORTRAIT}" alt="Kain"><img src="${ARIA_PORTRAIT}" alt="Aria Valfleur"></div></section>
      <div class="ravam-section-title battle"><span>01</span><div><small>PASSO UM</small><h3>ESCOLHA COMO LUTAR</h3></div></div>
      <section class="ravam-battle-grid">
        <button id="ravam-cpu" class="ravam-battle-card cpu"><span class="ravam-battle-icon">◈</span><small>COMBATE SOLO</small><h3>1P <b>× CPU</b></h3><p>Escolha sua Lenda na próxima tela. A CPU joga com a outra.</p><em>ESCOLHER LUTADOR →</em></button>
        <button id="ravam-pvp" class="ravam-battle-card pvp"><span class="ravam-battle-icon">⚔</span><small>DUELO LOCAL</small><h3>1P <b>× 2P</b></h3><p>Escolha separadamente a Lenda do Jogador 1 e do Jogador 2.</p><em>ESCOLHER LUTADORES →</em></button>
        <button id="ravam-story" class="ravam-battle-card story"><span class="ravam-battle-icon">◇</span><small>CAPÍTULO R.A.V.A.M</small><h3>MODO <b>HISTÓRIA</b></h3><p>Escolha o protagonista e entre no capítulo exclusivo da Lenda.</p><em>ESCOLHER PROTAGONISTA →</em></button>
        <button id="ravam-online" class="ravam-battle-card online"><span class="ravam-battle-icon">◎</span><small>2 JOGADORES · INTERNET</small><h3>ONLINE <b>P2P</b></h3><p>Crie uma sala ou entre pelo código NIAK. Cada jogador escolhe uma Lenda R.A.V.A.M no próprio PC.</p><em>ABRIR SALA ONLINE →</em></button>
      </section>
      <div class="ravam-footer-actions"><button id="ravam-preview-kain" class="btn">🎞️ ANIMAÇÕES KAIN</button><button id="ravam-back" class="btn">← VOLTAR AOS MODOS</button></div>
    </div>`;
    document.getElementById('ravam-cpu').onclick=()=>renderRavamCharacterSelect('cpu');
    document.getElementById('ravam-pvp').onclick=()=>renderRavamCharacterSelect('pvp');
    document.getElementById('ravam-story').onclick=()=>renderRavamCharacterSelect('story');
    document.getElementById('ravam-online').onclick=()=>{
      SFX?.play?.('menu_confirm');
      const net=window.LutadorOnlineV16;
      if(net?.openRavam)net.openRavam();else if(net?.open)net.open('ravam');else toast('Módulo ONLINE indisponível. Recarregue a página.','danger');
    };
    document.getElementById('ravam-preview-kain').onclick=()=>openAnimationPreview('kain');
    document.getElementById('ravam-back').onclick=()=>window.renderModes?.();
  }

  function renderRavamCharacterSelect(mode='cpu'){
    ensureState();
    window.__ravamPendingMode=mode;
    const copy=modeCopy(mode);
    const p1=window.__ravamP1Pick||'';
    const p2=window.__ravamP2Pick||'';
    const pickingP2=mode==='pvp'&&!!p1&&!p2;
    const readyPvp=mode==='pvp'&&!!p1&&!!p2;
    const active=pickingP2?'':p1;
    const pickedName=id=>displayName(id);
    const opponent=mode==='cpu'&&p1?cpuRival(p1):'';
    app.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen ravam-v14 ravam-v15 select-mode-${mode}">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>${copy.eyebrow}</small><h2>SELEÇÃO DE <span>LENDAS</span></h2><p>${copy.desc}</p></div><button id="ravam-change-mode" class="ravam-mini-back">← TROCAR MODO</button></section>
      <section class="ravam-match-slots ${mode}">
        <div class="ravam-slot p1 ${p1?'filled':''} ${!p1||(!pickingP2&&mode!=='pvp')?'active':''}"><small>${mode==='story'?'PROTAGONISTA':'JOGADOR 1'}</small><b>${pickedName(p1)}</b><span>${p1?'PRONTO':'ESCOLHA UMA LENDA'}</span></div>
        <div class="ravam-versus">VS</div>
        <div class="ravam-slot p2 ${p2||opponent?'filled':''} ${pickingP2?'active':''}"><small>${mode==='pvp'?'JOGADOR 2':mode==='story'?'RIVAL DO CAPÍTULO':'CPU'}</small><b>${mode==='pvp'?pickedName(p2):mode==='story'?(p1?pickedName(storyRival(p1)):'AGUARDANDO'):pickedName(opponent)}</b><span>${mode==='pvp'?(p2?'PRONTO':'ESCOLHA UMA LENDA'):(p1?'DEFINIDO AUTOMATICAMENTE':'AGUARDANDO')}</span></div>
      </section>
      <div class="ravam-section-title"><span>02</span><div><small>PASSO DOIS</small><h3>${mode==='pvp'?(readyPvp?'CONFRONTO PRONTO':pickingP2?'JOGADOR 2 · ESCOLHA SUA LENDA':'JOGADOR 1 · ESCOLHA SUA LENDA'):'ESCOLHA SUA LENDA'}</h3></div></div>
      <section class="ravam-roster-grid ravam-pick-grid">${RAVAM_IDS.map(id=>legendCard(id,mode==='pvp'?(p1===id||p2===id):active===id,mode==='pvp'?(p1===id?'P1':p2===id?'P2':''):(active===id?'P1':''))).join('')}</section>
      <div class="ravam-selection-help">${mode==='pvp'?'Escolha primeiro o P1 e depois o P2. As duas Lendas precisam ser diferentes.':'Clique em uma Lenda. Depois confirme para entrar na arena.'}</div>
      <div class="ravam-footer-actions"><button id="ravam-confirm-fight" class="btn big" ${(mode==='pvp'?!(p1&&p2):!p1)?'disabled':''}>${mode==='story'?'INICIAR HISTÓRIA':mode==='pvp'?'INICIAR 1P × 2P':'INICIAR 1P × CPU'}</button><button id="ravam-preview" class="btn">🎞️ VER ANIMAÇÕES</button></div>
    </div>`;
    document.querySelectorAll('[data-ravam-char]').forEach(el=>el.onclick=()=>{
      const id=el.dataset.ravamChar;SFX?.play?.('menu_select');
      if(mode==='pvp'){
        if(!window.__ravamP1Pick||window.__ravamP2Pick){window.__ravamP1Pick=id;window.__ravamP2Pick='';}
        else if(id===window.__ravamP1Pick){toast('P1 e P2 precisam usar Lendas diferentes.','normal');return;}
        else window.__ravamP2Pick=id;
      }else window.__ravamP1Pick=id;
      window.__ravamSelectedLegend=id;renderRavamCharacterSelect(mode);
    });
    document.getElementById('ravam-change-mode').onclick=()=>{window.__ravamP1Pick='';window.__ravamP2Pick='';renderModeHub();};
    document.getElementById('ravam-preview').onclick=()=>openAnimationPreview(window.__ravamP2Pick||window.__ravamP1Pick||'kain');
    const confirm=document.getElementById('ravam-confirm-fight');
    if(confirm&&!confirm.disabled)confirm.onclick=()=>{
      const a=window.__ravamP1Pick,b=mode==='pvp'?window.__ravamP2Pick:(mode==='story'?storyRival(a):cpuRival(a));
      SFX?.play?.('menu_confirm');
      if(mode==='story'){startRavamStory(a);return;}
      window.startFight(a,mode==='pvp'?'pvp':'ravam',b);
      try{if(typeof fight!=='undefined'&&fight)fight.ravamStudios=true}catch(_){}
    };
  }

  function renderUnlocked(){
    ensureState();window.__ravamP1Pick='';window.__ravamP2Pick='';renderModeHub();
  }

  window.renderRavamMode=function(){
    screen='ravam';drawCanvas();ensureState();
    if(!hasAccess())renderLocked();else renderUnlocked();
  };


  function openAnimationPreview(id='priya'){
    const isKain=id==='kain',isAria=id==='aria';
    let d=document.getElementById('ravam-animation-dialog');
    if(!d){d=document.createElement('dialog');d.id='ravam-animation-dialog';d.className='ravam-animation-dialog';document.body.appendChild(d)}
    const preview=isKain
      ? `<div class="ravam-pose-preview">${KAIN_POSE_PATHS.map((src,i)=>`<figure><img src="${src}" alt="Kain animação ${i+1}"><figcaption>${['IDLE','PASSO A','PASSO B','SOCO','GUARDA','CHUTE / AR'][i]}</figcaption></figure>`).join('')}</div>`
      : isAria
        ? `<div class="ravam-pose-preview">${ARIA_POSE_PATHS.map((src,i)=>`<figure><img src="${src}" alt="Aria Valfleur animação ${i+1}"><figcaption>${['IDLE','PASSO A','PASSO B','FLORES','GUARDA','SALTO'][i]}</figcaption></figure>`).join('')}</div>`
        : `<img src="${PREVIEW_SHEET}" alt="Animações de Alana Sorelle">`;
    const note=isKain
      ? 'Idle · caminhada em 8 tempos · soco com preparação/impacto/recuperação · chute com arco de impacto · guarda · salto. Todas as poses usam a mesma escala corporal.'
      : isAria
        ? 'Idle · dois passos de caminhada · conjuração das Flores Valfleur · guarda · salto. Os quadros preservam a escala original do sprite para Aria não mudar de tamanho durante a luta.'
        : 'Idle · caminhada corrigida · pulo completo · preparação · tiro · guarda · chute tático. A caminhada usa passos por distância e o pulo possui impulso, subida, ápice, queda e aterrissagem.';
    d.innerHTML=`<header><div><small>${displayName(id)}</small><h2>ANIMAÇÕES DE COMBATE</h2></div><button>×</button></header>${preview}<p>${note}</p>`;
    d.querySelector('header button').onclick=()=>d.close();d.showModal();
  }


  const baseModes=window.renderModes;
  if(typeof baseModes==='function')window.renderModes=function(){
    const r=baseModes.apply(this,arguments);
    setTimeout(()=>{
      const card=document.getElementById('mode-ravam');if(!card)return;
      const active=hasAccess();card.classList.toggle('ravam-owned',active);
      const badge=card.querySelector('.mode-badge');if(badge)badge.textContent=active?'R.A.V.A.M · ADQUIRIDO':`🟪 ${fmt(ACCESS_COST)} VANDAIS`;
      const h=card.querySelector('h3');if(h)h.innerHTML=active?'R.A.V.A.M <span class="mk-gold">STUDIOS</span>':'R.A.V.A.M <span class="mode-danger">STUDIOS</span>';
      const p=card.querySelector('p');if(p)p.textContent=active?'Alana Sorelle, Kain e Aria Valfleur disponíveis. Entre na Arena das Lendas.':'Adquira o modo com Vandais. Alana, Kain e Aria vêm desbloqueados.';
    },0);
    return r;
  };

  function priyaShoot(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;
    if(!Array.isArray(f.priyaBullets))f.priyaBullets=[];
    if(!Array.isArray(f.priyaExplosions))f.priyaExplosions=[];
    p.alanaShotCounter=((Number(p.alanaShotCounter)||0)%3)+1;
    const superShot=p.alanaShotCounter===3;
    const y=(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-82)-18;
    f.priyaBullets.push({x:p.x+p.facing*56,y,vx:p.facing*(superShot?1320:1180),owner:p,life:1.35,dead:false,superShot,dmg:p.dmg*(superShot?2.05:1.22)});
    p.throwCd=p.human?(superShot?.42:.34):.48;setState(p,'throw');
    try{spark(p.x+p.facing*58,y,superShot?'#fff0a6':'#ffd49b',superShot?22:13)}catch(_){}
    if(superShot)try{ariaFx(p,'SUPER TIRO · 3º DISPARO','#ffd86a',.72)}catch(_){}
    try{SFX?.play?.('attack_light',superShot?.9:.7)}catch(_){}
  }
  function priyaTripleBomb(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;
    if(!Array.isArray(f.priyaBombs))f.priyaBombs=[];
    const target=p===f.p1?f.p2:f.p1;
    const baseX=p.x+p.facing*38,baseY=GROUND_Y-p.y-100;
    // As três bombas seguem uma trajetória paramétrica e recalculam o ponto final
    // a cada frame. Assim o L realmente cai em cima de onde o rival está.
    const offsets=[0,-42,42];
    for(let i=0;i<3;i++){
      f.priyaBombs.push({
        x:baseX,y:baseY,startX:baseX,startY:baseY,owner:p,target,offset:offsets[i],
        elapsed:-i*.11,duration:.72+i*.06,arc:230+28*i,life:2.4,dead:false,exploded:false,
        r:12,dmg:p.dmg*1.82,serial:i
      });
    }
    p.specialCd=5.1;setState(p,'special');
    p.ravamBombCastT=.62;
    try{spark(baseX,baseY,'#ff6b45',25)}catch(_){}
  }

  function ariaFx(p,text,color='#7dffad',life=.85){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;
    if(!Array.isArray(f.ariaFx))f.ariaFx=[];
    if(!Array.isArray(f.priyaExplosions))f.priyaExplosions=[];
    f.ariaFx.push({x:p.x,y:(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-80)-58,text,color,life,maxLife:life});
  }
  function ariaGrassTrail(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;
    if(!Array.isArray(f.ariaGrass))f.ariaGrass=[];
    const target=p===f.p1?f.p2:f.p1;
    const dir=target&&target.x!==p.x?(target.x>p.x?1:-1):(p.facing||1);
    const startX=p.x+dir*28;
    const dist=target?Math.abs(target.x-p.x)+58:330;
    const length=clamp(dist,190,440);
    f.ariaGrass.push({owner:p,x1:startX,x2:clamp(startX+dir*length,8,W-8),dir,age:0,life:2.0,maxLife:2.0,tick:0,dead:false});
    p.throwCd=p.human?.50:.66;p.ariaCastT=.20;setState(p,'throw');
    ariaFx(p,'TRILHA DE ESPINHOS · 2s','#83ff9c',.75);
    try{spark(startX,GROUND_Y-5,'#62e879',12)}catch(_){}
  }
  function ariaFlowerShot(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;
    p.ariaAttackAlt=((Number(p.ariaAttackAlt)||0)+1)%2;
    if(p.ariaAttackAlt===0){ariaGrassTrail(p);return;}
    if(!Array.isArray(f.ariaFlowers))f.ariaFlowers=[];
    if(!Array.isArray(f.ariaGrass))f.ariaGrass=[];
    const y=(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-82)-12;
    for(let i=0;i<2;i++){
      f.ariaFlowers.push({
        x:p.x+p.facing*(48+i*9),y:y+(i?8:-7),vx:p.facing*(900+i*80),
        owner:p,life:1.25,dead:false,dmg:p.dmg*.62,poison:1.0,spin:(i?1:-1)*4.2
      });
    }
    p.throwCd=p.human?.48:.62;p.ariaCastT=.20;setState(p,'throw');
    try{spark(p.x+p.facing*48,y,'#8cffad',11)}catch(_){}
    try{SFX?.play?.('attack_light',.68)}catch(_){}
  }
  function ariaVineSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;
    const target=p===f.p1?f.p2:f.p1;if(!target||target.state==='ko')return;
    if(!Array.isArray(f.ariaVines))f.ariaVines=[];
    f.ariaVines.push({owner:p,target,delay:.34,hold:2.05,life:2.65,active:false,dead:false,x:target.x});
    p.specialCd=6.2;p.ariaSuperT=.82;setState(p,'special');
    ariaFx(p,'PRISÃO VERDANTE','#9dff9f',1.0);
    try{spark(target.x,GROUND_Y-4,'#65e88b',24)}catch(_){}
  }

  function ravamOpponent(p){
    const f=typeof fight!=='undefined'?fight:null;
    return f?(p===f.p1?f.p2:f.p1):null;
  }
  function kainFx(p,text,color='#b7c1d3',life=.85){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;
    if(!Array.isArray(f.kainFx))f.kainFx=[];
    f.kainFx.push({x:p.x,y:(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-80)-62,text,color,life,maxLife:life});
  }
  function ensureKainPower(p){
    if(!p)return KAIN_POWER_POOL[0];
    let i=Number.isFinite(p.kainPowerIndex)?Math.floor(p.kainPowerIndex):0;
    i=((i%KAIN_POWER_POOL.length)+KAIN_POWER_POOL.length)%KAIN_POWER_POOL.length;
    if(!KAIN_POWER_POOL.includes(p.kainSelectedPower))p.kainSelectedPower=KAIN_POWER_POOL[i];
    p.kainPowerIndex=KAIN_POWER_POOL.indexOf(p.kainSelectedPower);
    return p.kainSelectedPower;
  }
  function cycleKainPower(p,step=1){
    if(!p||p.state==='ko'||(p.kainPowerSwitchCd||0)>0)return ensureKainPower(p);
    const current=ensureKainPower(p),i=KAIN_POWER_POOL.indexOf(current);
    p.kainPowerIndex=(i+step+KAIN_POWER_POOL.length)%KAIN_POWER_POOL.length;
    p.kainSelectedPower=KAIN_POWER_POOL[p.kainPowerIndex];p.kainPowerSwitchCd=.16;p.kainPowerFxT=Math.max(p.kainPowerFxT||0,.28);
    const label=KAIN_POWER_LABELS[p.kainSelectedPower];kainFx(p,`PODER · ${label}`,'#d8dcff',.62);toast(`KAIN · PODER: ${label}`,'normal');
    try{SFX?.play?.('menu_select',.55)}catch(_){}
    return p.kainSelectedPower;
  }
  function pickKainPower(p){
    let pool=KAIN_POWER_POOL.filter(x=>x!==p?.kainLastRandomPower);if(!pool.length)pool=[...KAIN_POWER_POOL];
    const type=pool[Math.floor(Math.random()*pool.length)];if(p)p.kainLastRandomPower=type;return type;
  }
  function kainUsePower(p,type,opts={}){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return type;
    const target=ravamOpponent(p),fromSuper=!!opts.fromSuper;
    if(!Array.isArray(f.kainIceShots))f.kainIceShots=[];
    if(!Array.isArray(f.kainFireShots))f.kainFireShots=[];
    if(!Array.isArray(f.kainBolts))f.kainBolts=[];
    p.kainPowerFxT=.78;
    const label=KAIN_POWER_LABELS[type]||String(type).toUpperCase();
    if(type==='flight'){
      p.kainFlightT=Math.max(p.kainFlightT||0,fromSuper?4.0:3.0);
      p.kainFlightY=clamp(Math.max(150,p.y||0),90,300);p.onGround=false;p.vy=0;p.y=p.kainFlightY;setState(p,'special');
      if(!fromSuper)p.throwCd=2.3;
      try{spark(p.x,GROUND_Y-p.y-55,'#b7c1d3',28)}catch(_){}
    }else if(type==='ice'){
      const y=(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-82)-10;
      f.kainIceShots.push({x:p.x+p.facing*48,y,vx:p.facing*760,owner:p,life:1.7,dead:false,dmg:p.dmg*(fromSuper?1.30:1.12),freeze:fromSuper?1.8:1.25});
      setState(p,fromSuper?'special':'throw');if(!fromSuper)p.throwCd=.95;
      try{spark(p.x+p.facing*48,y,'#bfe9ff',18)}catch(_){}
    }else if(type==='heal'){
      const heal=Math.round(p.maxHp*(fromSuper?.22:.14));
      p.hp=Math.min(p.maxHp,p.hp+heal);setState(p,'special');if(!fromSuper)p.throwCd=2.7;
      try{spark(p.x,typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-70,'#7dffb2',34)}catch(_){}
      kainFx(p,`+${heal} VIDA`,'#7dffb2',1.0);
    }else if(type==='shock'){
      if(target&&target.state!=='ko')f.kainBolts.push({x:target.x,target,owner:p,delay:fromSuper?.08:.16,life:.72,dead:false,hit:false,dmg:p.dmg*(fromSuper?1.62:1.38),stun:fromSuper?1.05:.65,serial:Math.random()});
      setState(p,fromSuper?'special':'throw');if(!fromSuper)p.throwCd=1.3;
    }else if(type==='repel'){
      p.kainRepelT=Math.max(p.kainRepelT||0,fromSuper?2.4:1.5);setState(p,'special');if(!fromSuper)p.throwCd=2.3;
      try{spark(p.x,typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-70,'#d7dcff',30)}catch(_){}
    }else if(type==='swap'){
      if(target&&target.state!=='ko'){
        target.kainControlSwapT=Math.max(target.kainControlSwapT||0,fromSuper?5.0:3.6);
        try{spark(target.x,typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-70,'#d47cff',30)}catch(_){}
      }
      setState(p,'special');if(!fromSuper)p.throwCd=3.0;
    }else if(type==='fire'){
      const y=(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-82)-10;
      f.kainFireShots.push({x:p.x+p.facing*50,y,vx:p.facing*(fromSuper?1020:880),owner:p,life:1.55,dead:false,dmg:p.dmg*(fromSuper?1.48:1.18),burn:fromSuper?2.0:1.3});
      setState(p,fromSuper?'special':'throw');if(!fromSuper)p.throwCd=1.05;
      try{spark(p.x+p.facing*50,y,'#ff884f',20)}catch(_){}
    }else if(type==='teleport'){
      if(target&&target.state!=='ko'){
        const side=(target.facing||1);p.x=clamp(target.x+side*82,30,W-30);p.facing=target.x>=p.x?1:-1;
        damageTarget(target,p.dmg*(fromSuper?1.18:.72),p,target.x>=p.x?1:-1,'kain-teleport');
        target.vx+=(target.x>=p.x?1:-1)*(fromSuper?260:170);
        try{spark(p.x,typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-70,'#a88cff',34)}catch(_){}
      }
      setState(p,'special');if(!fromSuper)p.throwCd=1.75;
    }else if(type==='drain'){
      if(target&&target.state!=='ko'){
        const dmg=p.dmg*(fromSuper?1.42:.92),before=target.hp;damageTarget(target,dmg,p,target.x>=p.x?1:-1,'kain-drain');
        const dealt=Math.max(0,before-target.hp),heal=Math.min(Math.round(p.maxHp*(fromSuper?.12:.07)),Math.round(dealt*.70));p.hp=Math.min(p.maxHp,p.hp+heal);
        kainFx(p,`+${heal} VIDA`,'#80ffb5',.8);try{spark(target.x,typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-70,'#9b65ff',28)}catch(_){}
      }
      setState(p,'special');if(!fromSuper)p.throwCd=2.15;
    }else if(type==='gravity'){
      if(target&&target.state!=='ko'){
        const dir=p.x>=target.x?1:-1;damageTarget(target,p.dmg*(fromSuper?1.18:.78),p,dir,'kain-gravity');target.vx+=dir*(fromSuper?520:360);target.attackDisabledT=Math.max(target.attackDisabledT||0,fromSuper?.72:.42);
        try{spark(target.x,typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-70,'#6f78ff',36)}catch(_){}
      }
      setState(p,'special');if(!fromSuper)p.throwCd=1.9;
    }
    kainFx(p,label,type==='ice'?'#bfe9ff':type==='heal'?'#7dffb2':type==='shock'?'#ffe66b':type==='swap'?'#d47cff':type==='fire'?'#ff884f':type==='teleport'?'#a88cff':type==='drain'?'#80ffb5':type==='gravity'?'#6f78ff':'#d7dcff');
    try{toast(`KAIN · ${label}`,fromSuper?'reward':'normal')}catch(_){}
    return type;
  }
  function kainRandomPower(p,opts={}){return kainUsePower(p,pickKainPower(p),opts)}
  function kainMirrorBurst(p,target){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!target)return;
    if(!Array.isArray(f.kainBolts))f.kainBolts=[];
    for(let i=0;i<3;i++)f.kainBolts.push({x:target.x,target,owner:p,delay:.08+i*.18,life:.8+i*.18,dead:false,hit:false,dmg:p.dmg*1.05,stun:.35,serial:i+.5,mirror:true});
  }
  function kainCopyEnemySuper(p,target){
    if(!p||!target||p.state==='ko'||target.state==='ko')return;
    try{
      if(target.id==='priya'){
        priyaTripleBomb(p);
      }else if(target.id==='aria'){
        ariaVineSuper(p);
      }else if(target.id==='kain'){
        kainMirrorBurst(p,target);
      }else{
        let src=null;try{src=typeof CHARACTERS!=='undefined'?CHARACTERS.find(c=>c.id===target.id):null}catch(_){}
        if(src&&typeof baseSpecial==='function'){
          const old={id:p.id,name:p.name,color:p.color,weapon:p.weapon,special:p.special,specialCd:p.specialCd};
          p.id=src.id;p.name=src.name;p.color=src.color;p.weapon=src.weapon||'knife';p.special=src.special||'rain';p.specialCd=0;
          try{baseSpecial.call(window,p)}finally{p.id=old.id;p.name=old.name;p.color=old.color;p.weapon=old.weapon;p.special=old.special;p.specialCd=old.specialCd;}
        }else kainMirrorBurst(p,target);
      }
      kainFx(p,`SUPER DE ${String(target.name||target.id||'RIVAL').toUpperCase()}`,'#ff9df0',1.15);
      try{toast(`ESPELHO ABISSAL · SUPER DE ${String(target.name||'RIVAL').toUpperCase()}`,'reward')}catch(_){}
    }catch(_){kainMirrorBurst(p,target)}
  }
  function kainSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;
    if(!Array.isArray(f.kainMirrorCasts))f.kainMirrorCasts=[];
    const target=ravamOpponent(p),power=kainRandomPower(p,{fromSuper:true});
    p.kainSuperT=1.25;p.specialCd=7.1;setState(p,'special');
    if(target)f.kainMirrorCasts.push({owner:p,target,delay:.34,dead:false});
    try{spark(p.x,typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-70,'#ff9df0',48)}catch(_){}
    try{toast(`KAIN SUPER · ${KAIN_POWER_LABELS[power]} + SUPER DO RIVAL`,'reward')}catch(_){}
  }

  const baseThrow=window.throwProjectile;
  if(typeof baseThrow==='function')window.throwProjectile=function(p){if(p?.id==='priya'){priyaShoot(p);return;}if(p?.id==='kain'){p.human?kainUsePower(p,ensureKainPower(p)):kainRandomPower(p);return;}if(p?.id==='aria'){ariaFlowerShot(p);return;}return baseThrow.apply(this,arguments)};
  const baseSpecial=window.castSpecial;
  if(typeof baseSpecial==='function')window.castSpecial=function(p){if(p?.id==='priya'){priyaTripleBomb(p);return;}if(p?.id==='kain'){kainSuper(p);return;}if(p?.id==='aria'){ariaVineSuper(p);return;}return baseSpecial.apply(this,arguments)};
  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){
    if(victim?.id==='kain'&&(victim.kainRepelT||0)>0&&Number(amount)>0&&type!=='hazard'){
      const attacker=src?.owner&&src.owner!==victim?src.owner:(src?.id&&src!==victim?src:null);
      if(attacker&&attacker.state!=='ko'){
        const reflected=Math.max(8,Number(amount)*.70);
        try{baseDamage.call(this,attacker,reflected,{owner:victim,kainReflected:true},attacker.x>=victim.x?1:-1,'kain-repel')}catch(_){}
        attacker.vx+=(attacker.x>=victim.x?1:-1)*220;
        try{spark(victim.x,typeof bodyY==='function'?bodyY(victim):GROUND_Y-victim.y-70,'#d7dcff',34)}catch(_){}
        kainFx(victim,'REPELIDO','#d7dcff',.72);
        return;
      }
    }
    return baseDamage.apply(this,arguments);
  };

  document.addEventListener('keydown',e=>{
    if(e.code!=='KeyH'||e.repeat)return;
    const f=typeof fight!=='undefined'?fight:null;if(!f||f.over||f.paused)return;
    const kain=f.p1;
    if(!kain||kain.id!=='kain'||!kain.human||kain.state==='ko')return;
    cycleKainPower(kain,1);e.preventDefault();
  },true);

  const basePlayerInput=window.playerInput;
  if(typeof basePlayerInput==='function')window.playerInput=function(p){
    if(p?.id==='kain'&&p.human){
      const powerKey=p.playerSlot==='p2'?'Numpad1':'KeyJ';
      if(window.justPressed?.[powerKey]){
        window.justPressed[powerKey]=false;
        if(!p.proMove&&p.state!=='ko'&&p.state!=='hurt'&&(p.freezeT||0)<=0&&(p.attackDisabledT||0)<=0&&(p.throwCd||0)<=0){kainUsePower(p,ensureKainPower(p));return;}
      }
    }
    if(!p?.human||!(p.kainControlSwapT>0))return basePlayerInput.apply(this,arguments);
    const isP2=p.playerSlot==='p2';
    const map=isP2?{
      ArrowLeft:'ArrowRight',ArrowRight:'ArrowLeft',ArrowUp:'ArrowDown',ArrowDown:'ArrowUp',
      Numpad1:'Numpad3',Numpad3:'Numpad1',Numpad5:'Numpad6',Numpad6:'Numpad4',Numpad4:'Numpad5',Numpad2:'Numpad0',Numpad0:'Numpad2'
    }:{
      KeyA:'KeyD',KeyD:'KeyA',KeyW:'KeyS',KeyS:'KeyW',
      KeyJ:'KeyL',KeyL:'KeyJ',KeyI:'KeyO',KeyO:'KeyG',KeyG:'KeyI',KeyK:'KeyQ',KeyQ:'KeyK'
    };
    const keys=window.keys||(window.keys={}),just=window.justPressed||(window.justPressed={});
    const codes=[...new Set([...Object.keys(map),...Object.values(map)])];
    const savedKeys={},savedJust={},originalKeys={},originalJust={};
    for(const c of codes){savedKeys[c]=keys[c];savedJust[c]=just[c];originalKeys[c]=!!keys[c];originalJust[c]=!!just[c];}
    for(const [dest,src] of Object.entries(map)){keys[dest]=originalKeys[src];just[dest]=originalJust[src];}
    try{return basePlayerInput.apply(this,arguments)}finally{
      for(const c of codes){if(savedKeys[c]===undefined)delete keys[c];else keys[c]=savedKeys[c];if(savedJust[c]===undefined)delete just[c];else just[c]=savedJust[c];}
    }
  };

  function damageTarget(victim,amount,src,dir,type){
    try{return typeof damage==='function'?damage(victim,amount,src,dir,type):undefined}catch(_){}
  }
  function updateRavam(f,dt){
    if(!f?.ravamStudios&&!RAVAM_IDS.includes(f?.p1?.id)&&!RAVAM_IDS.includes(f?.p2?.id))return;
    if(!Array.isArray(f.priyaBullets))f.priyaBullets=[];
    if(!Array.isArray(f.priyaBombs))f.priyaBombs=[];
    if(!Array.isArray(f.kainIceShots))f.kainIceShots=[];
    if(!Array.isArray(f.kainFireShots))f.kainFireShots=[];
    if(!Array.isArray(f.kainBolts))f.kainBolts=[];
    if(!Array.isArray(f.kainMirrorCasts))f.kainMirrorCasts=[];
    if(!Array.isArray(f.kainFx))f.kainFx=[];
    if(!Array.isArray(f.ariaFlowers))f.ariaFlowers=[];
    if(!Array.isArray(f.ariaGrass))f.ariaGrass=[];
    if(!Array.isArray(f.ariaVines))f.ariaVines=[];
    if(!Array.isArray(f.ariaFx))f.ariaFx=[];
    if(!Array.isArray(f.priyaExplosions))f.priyaExplosions=[];
    for(const q of [f.p1,f.p2])if(q?.id==='priya'){
      if(q.ravamBombCastT>0)q.ravamBombCastT=Math.max(0,q.ravamBombCastT-dt);
      // Ciclo de caminhada baseado na distância real percorrida. Isso elimina o
      // efeito de "patinar" e a imagem dupla que existia no blend antigo.
      const lastX=Number.isFinite(q.ravamAnimLastX)?q.ravamAnimLastX:q.x;
      const dx=Math.abs((q.x||0)-lastX);
      if(q.onGround&&Math.abs(q.vx||0)>7&&q.state!=='hurt'&&q.state!=='ko'){
        q.ravamWalkDist=(q.ravamWalkDist||0)+Math.min(dx,28);
      }else if(q.onGround){
        q.ravamWalkDist=(q.ravamWalkDist||0)*Math.max(0,1-dt*12);
      }
      q.ravamAnimLastX=q.x;

      // Detecta saída do chão / aterrissagem para dar uma animação própria ao pulo.
      if(q.ravamWasGrounded===undefined)q.ravamWasGrounded=!!q.onGround;
      if(q.ravamWasGrounded&&!q.onGround){
        q.ravamJumpT=0;
        q.ravamLandT=0;
        try{spark(q.x,GROUND_Y-6,'#d8b08a',7)}catch(_){}
      }
      if(!q.ravamWasGrounded&&q.onGround){
        q.ravamLandT=.13;
        try{spark(q.x,GROUND_Y-5,'#d8b08a',10)}catch(_){}
      }
      if(!q.onGround)q.ravamJumpT=(q.ravamJumpT||0)+dt;
      if(q.ravamLandT>0)q.ravamLandT=Math.max(0,q.ravamLandT-dt);
      q.ravamWasGrounded=!!q.onGround;
    }
    for(const q of [f.p1,f.p2])if(q){
      if(q.kainControlSwapT>0){
        q.kainControlSwapT=Math.max(0,q.kainControlSwapT-dt);
        if(!q.human){q.x=clamp(q.x-2*(q.vx||0)*dt,26,W-26);q.vx=-(q.vx||0);}
        if(q.kainControlSwapT<=0)kainFx(q,'CONTROLES NORMALIZADOS','#aeb8c8',.72);
      }
    }
    for(const q of [f.p1,f.p2])if(q?.id==='kain'){
      if(q.kainPowerFxT>0)q.kainPowerFxT=Math.max(0,q.kainPowerFxT-dt);
      if(q.kainPowerSwitchCd>0)q.kainPowerSwitchCd=Math.max(0,q.kainPowerSwitchCd-dt);
      ensureKainPower(q);
      if(q.kainSuperT>0)q.kainSuperT=Math.max(0,q.kainSuperT-dt);
      if(q.kainRepelT>0)q.kainRepelT=Math.max(0,q.kainRepelT-dt);
      if(q.kainFlightT>0){
        q.kainFlightT=Math.max(0,q.kainFlightT-dt);
        if(q.kainFlightT>0){
          if(!Number.isFinite(q.kainFlightY))q.kainFlightY=clamp(Math.max(150,q.y||0),90,300);
          if(q.human){
            const up=q.playerSlot==='p2'?'ArrowUp':'KeyW',down=q.playerSlot==='p2'?'ArrowDown':'KeyS';
            let lift=((window.keys&&window.keys[up])?1:0)-((window.keys&&window.keys[down])?1:0);
            if(q.kainControlSwapT>0)lift=-lift;
            q.kainFlightY=clamp(q.kainFlightY+lift*205*dt,85,305);
          }
          q.onGround=false;q.vy=0;q.y=q.kainFlightY+Math.sin(performance.now()/180+(q.playerSlot==='p2'?1.8:0))*8;
          if(q.state!=='hurt'&&q.state!=='ko'&&q.state!=='special')setState(q,'air');
        }else{q.kainFlightY=undefined;q.onGround=false;q.vy=-120;setState(q,'air');}
      }
      const lastX=Number.isFinite(q.ravamAnimLastX)?q.ravamAnimLastX:q.x;
      const dx=Math.abs((q.x||0)-lastX);
      if(q.onGround&&Math.abs(q.vx||0)>7&&q.state!=='hurt'&&q.state!=='ko')q.ravamWalkDist=(q.ravamWalkDist||0)+Math.min(dx,30);
      else if(q.onGround)q.ravamWalkDist=(q.ravamWalkDist||0)*Math.max(0,1-dt*12);
      q.ravamAnimLastX=q.x;
    }
    for(const q of [f.p1,f.p2])if(q){
      if(q.ariaPoisonT>0){
        q.ariaPoisonT=Math.max(0,q.ariaPoisonT-dt);q.ariaPoisonTick=(q.ariaPoisonTick||0)+dt;
        while(q.ariaPoisonTick>=.20&&q.state!=='ko'){
          q.ariaPoisonTick-=.20;
          const dot=Math.max(2,Number(q.ariaPoisonDamage)||3.6);
          q.hp-=dot;q.hitFlash=Math.max(q.hitFlash||0,.035);
          try{spark(q.x+(Math.random()-.5)*20,(typeof bodyY==='function'?bodyY(q):GROUND_Y-q.y-70)+(Math.random()-.5)*36,'#6fff8f',3)}catch(_){}
          if(q.hp<=0){
            q.hp=0;q.state='ko';q.stateT=0;
            try{endRound(f,q.ariaPoisonOwner&&q.ariaPoisonOwner.state!=='ko'?q.ariaPoisonOwner:(q===f.p1?f.p2:f.p1),q)}catch(_){}
            break;
          }
        }
        if(q.ariaPoisonT<=0){q.ariaPoisonTick=0;q.ariaPoisonDamage=0;q.ariaPoisonOwner=null;}
      }
      if(q.ariaVineT>0&&q.state!=='ko'){
        q.ariaVineT=Math.max(0,q.ariaVineT-dt);q.vx=0;q.attackDisabledT=Math.max(q.attackDisabledT||0,.09);q.freezeT=Math.max(q.freezeT||0,.09);
      }
    }
    for(const q of [f.p1,f.p2])if(q?.id==='aria'){
      if(q.ariaCastT>0)q.ariaCastT=Math.max(0,q.ariaCastT-dt);
      if(q.ariaSuperT>0)q.ariaSuperT=Math.max(0,q.ariaSuperT-dt);
      const lastX=Number.isFinite(q.ravamAnimLastX)?q.ravamAnimLastX:q.x;
      const dx=Math.abs((q.x||0)-lastX);
      if(q.onGround&&Math.abs(q.vx||0)>7&&q.state!=='hurt'&&q.state!=='ko')q.ravamWalkDist=(q.ravamWalkDist||0)+Math.min(dx,28);
      else if(q.onGround)q.ravamWalkDist=(q.ravamWalkDist||0)*Math.max(0,1-dt*12);
      q.ravamAnimLastX=q.x;
    }

    for(const z of f.ariaFlowers){
      if(z.dead)continue;z.x+=z.vx*dt;z.life-=dt;
      const victim=z.owner===f.p1?f.p2:f.p1;
      if(victim&&victim.state!=='ko'&&Math.abs(z.x-victim.x)<46&&hitboxY(victim,z.y,17)){
        damageTarget(victim,z.dmg,z,z.vx>0?1:-1,'aria-flower');
        victim.ariaPoisonT=Math.max(victim.ariaPoisonT||0,z.poison||1);
        victim.ariaPoisonOwner=z.owner;victim.ariaPoisonDamage=Math.max(victim.ariaPoisonDamage||0,(z.owner?.dmg||31)*.115);
        ariaFx(victim,'VENENO · 1s','#7dff9f',.72);z.dead=true;
        try{spark(z.x,z.y,'#7dff9f',18)}catch(_){}
      }
      if(z.life<=0||z.x<-90||z.x>W+90)z.dead=true;
    }
    f.ariaFlowers=f.ariaFlowers.filter(z=>!z.dead);

    for(const g of f.ariaGrass){
      if(g.dead)continue;g.life-=dt;g.age=(g.age||0)+dt;g.tick=(g.tick||0)+dt;
      const victim=g.owner===f.p1?f.p2:f.p1;
      const grow=clamp(g.age/.28,0,1),end=g.x1+(g.x2-g.x1)*(grow*grow*(3-2*grow));
      g.currentEnd=end;
      if(victim&&victim.state!=='ko'){
        const lo=Math.min(g.x1,end)-22,hi=Math.max(g.x1,end)+22;
        if(victim.x>=lo&&victim.x<=hi&&(victim.y||0)<70){
          while(g.tick>=.25&&victim.state!=='ko'){
            g.tick-=.25;const dot=2.5;victim.hp-=dot;victim.hitFlash=Math.max(victim.hitFlash||0,.018);
            if(victim.hp<=0){victim.hp=0;victim.state='ko';victim.stateT=0;try{endRound(f,g.owner&&g.owner.state!=='ko'?g.owner:(victim===f.p1?f.p2:f.p1),victim)}catch(_){}break;}
          }
        }else g.tick=Math.min(g.tick,.25);
      }
      if(g.life<=0)g.dead=true;
    }
    f.ariaGrass=f.ariaGrass.filter(g=>!g.dead);

    for(const v of f.ariaVines){
      if(v.dead)continue;v.life-=dt;v.delay-=dt;
      if(v.target&&v.target.state!=='ko')v.x=v.target.x;
      if(!v.active&&v.delay<=0){
        v.active=true;
        if(v.target&&v.target.state!=='ko'){
          v.target.ariaVineT=Math.max(v.target.ariaVineT||0,v.hold||2.0);
          v.target.attackDisabledT=Math.max(v.target.attackDisabledT||0,v.hold||2.0);
          v.target.freezeT=Math.max(v.target.freezeT||0,.12);
          damageTarget(v.target,(v.owner?.dmg||31)*1.08,v.owner,v.target.x>=v.owner.x?1:-1,'aria-vine');
          ariaFx(v.target,'PRESA PELO CIPÓ','#a7ffae',.9);
          try{spark(v.target.x,GROUND_Y-8,'#61e879',32)}catch(_){}
        }
      }
      if(v.active&&(!v.target||v.target.state==='ko'||(v.target.ariaVineT||0)<=0))v.dead=true;
      if(v.life<=0)v.dead=true;
    }
    f.ariaVines=f.ariaVines.filter(v=>!v.dead);
    for(const e of f.ariaFx){e.life-=dt;e.y-=19*dt;}
    f.ariaFx=f.ariaFx.filter(e=>e.life>0);

    for(const b of f.priyaBullets){
      if(b.dead)continue;b.x+=b.vx*dt;b.life-=dt;
      const enemy=b.owner===f.p1?f.p2:f.p1;
      if(enemy&&enemy.state!=='ko'&&Math.abs(b.x-enemy.x)<44&&hitboxY(enemy,b.y,b.superShot?22:14)){
        damageTarget(enemy,b.dmg,b,b.vx>0?1:-1,b.superShot?'rifle-super':'rifle');b.dead=true;
        if(b.superShot){
          enemy.vx+=(b.vx>0?1:-1)*230;f.priyaExplosions.push({x:b.x,y:b.y,life:.34,maxLife:.34,r:18});f.megaHitStop=Math.max(f.megaHitStop||0,.055);
          try{spark(b.x,b.y,'#ffe36e',42)}catch(_){}
        }else try{spark(b.x,b.y,'#ffd49b',16)}catch(_){}
      }
      if(b.life<=0||b.x<-80||b.x>W+80)b.dead=true;
    }
    f.priyaBullets=f.priyaBullets.filter(b=>!b.dead);
    for(const x of f.priyaExplosions){x.life-=dt;if(x.life<=0)x.dead=true;}f.priyaExplosions=f.priyaExplosions.filter(x=>!x.dead);
    for(const b of f.priyaBombs){
      if(b.dead)continue;
      b.life-=dt;b.elapsed+=dt;
      if(b.elapsed<0)continue;
      const enemy=b.target&&b.target.state!=='ko'?b.target:(b.owner===f.p1?f.p2:f.p1);
      const liveTargetX=enemy?enemy.x:(b.startX+(b.owner?.facing||1)*360);
      const endX=clamp(liveTargetX+(b.offset||0),28,W-28),endY=GROUND_Y-14;
      const u=clamp(b.elapsed/b.duration,0,1);
      const smooth=u*u*(3-2*u);
      b.x=b.startX+(endX-b.startX)*smooth;
      b.y=b.startY+(endY-b.startY)*u-Math.sin(Math.PI*u)*b.arc;
      b.lockX=endX;
      if(u>=1){
        b.x=endX;b.y=endY;b.dead=true;b.exploded=true;
        const victim=b.owner===f.p1?f.p2:f.p1;
        if(victim&&victim.state!=='ko'){
          const dx=victim.x-b.x,dy=(typeof bodyY==='function'?bodyY(victim):GROUND_Y-80)-b.y;
          if(Math.abs(dx)<138)damageTarget(victim,b.dmg,b,dx>=0?1:-1,'bomb');
        }
        try{spark(b.x,b.y,'#ff5c3c',48)}catch(_){}
        f.megaHitStop=Math.max(f.megaHitStop||0,.065);
      }
      if(b.life<=0)b.dead=true;
    }
    f.priyaBombs=f.priyaBombs.filter(b=>!b.dead);

    for(const z of f.kainIceShots){
      if(z.dead)continue;z.x+=z.vx*dt;z.life-=dt;
      const victim=z.owner===f.p1?f.p2:f.p1;
      if(victim&&victim.state!=='ko'&&Math.abs(z.x-victim.x)<48&&hitboxY(victim,z.y,18)){
        damageTarget(victim,z.dmg,z,z.vx>0?1:-1,'kain-ice');victim.freezeT=Math.max(victim.freezeT||0,z.freeze||1.5);z.dead=true;
        try{spark(z.x,z.y,'#bfe9ff',30)}catch(_){}
      }
      if(z.life<=0||z.x<-100||z.x>W+100)z.dead=true;
    }
    f.kainIceShots=f.kainIceShots.filter(z=>!z.dead);

    for(const z of f.kainFireShots){
      if(z.dead)continue;z.x+=z.vx*dt;z.life-=dt;const victim=z.owner===f.p1?f.p2:f.p1;
      if(victim&&victim.state!=='ko'&&Math.abs(z.x-victim.x)<50&&hitboxY(victim,z.y,20)){
        damageTarget(victim,z.dmg,z,z.vx>0?1:-1,'kain-fire');victim.kainBurnT=Math.max(victim.kainBurnT||0,z.burn||1.3);victim.kainBurnOwner=z.owner;z.dead=true;try{spark(z.x,z.y,'#ff7a45',30)}catch(_){}
      }
      if(z.life<=0||z.x<-100||z.x>W+100)z.dead=true;
    }
    f.kainFireShots=f.kainFireShots.filter(z=>!z.dead);
    for(const q of [f.p1,f.p2])if(q?.kainBurnT>0&&q.state!=='ko'){
      q.kainBurnT=Math.max(0,q.kainBurnT-dt);q.kainBurnTick=(q.kainBurnTick||0)+dt;
      while(q.kainBurnTick>=.25&&q.state!=='ko'){q.kainBurnTick-=.25;q.hp-=2.25;q.hitFlash=Math.max(q.hitFlash||0,.018);if(q.hp<=0){q.hp=0;q.state='ko';q.stateT=0;try{endRound(f,q.kainBurnOwner&&q.kainBurnOwner.state!=='ko'?q.kainBurnOwner:(q===f.p1?f.p2:f.p1),q)}catch(_){}break;}}
      if(q.kainBurnT<=0){q.kainBurnTick=0;q.kainBurnOwner=null;}
    }

    for(const z of f.kainBolts){
      if(z.dead)continue;z.life-=dt;z.delay-=dt;
      if(z.target&&z.target.state!=='ko')z.x=z.target.x;
      if(!z.hit&&z.delay<=0&&z.target&&z.target.state!=='ko'){
        z.hit=true;damageTarget(z.target,z.dmg,z.owner,z.target.x>=z.owner.x?1:-1,z.mirror?'kain-mirror':'kain-shock');
        z.target.attackDisabledT=Math.max(z.target.attackDisabledT||0,z.stun||.7);
        try{spark(z.target.x,typeof bodyY==='function'?bodyY(z.target):GROUND_Y-z.target.y-70,z.mirror?'#ff9df0':'#ffe66b',34)}catch(_){}
      }
      if(z.life<=0)z.dead=true;
    }
    f.kainBolts=f.kainBolts.filter(z=>!z.dead);

    for(const m of f.kainMirrorCasts){
      if(m.dead)continue;m.delay-=dt;
      if(m.delay<=0){m.dead=true;if(m.owner?.state!=='ko'&&m.target?.state!=='ko'){kainCopyEnemySuper(m.owner,m.target);m.owner.specialCd=Math.max(m.owner.specialCd||0,7.1);}}
    }
    f.kainMirrorCasts=f.kainMirrorCasts.filter(m=>!m.dead);
    for(const e of f.kainFx){e.life-=dt;e.y-=22*dt;}
    f.kainFx=f.kainFx.filter(e=>e.life>0);
  }
  let kainHudStamp=0;
  function syncKainPowerHud(f){
    if(!f||performance.now()-kainHudStamp<55)return;kainHudStamp=performance.now();
    const hud=document.getElementById('v6-fight-hud');if(!hud)return;
    [['p1',f.p1],['p2',f.p2]].forEach(([side,p])=>{
      const root=hud.querySelector('.'+side);if(!root)return;
      let el=root.querySelector('.ravam-kain-power-indicator');
      if(p?.id!=='kain'||!p.human){el?.remove();return;}
      if(!el){el=document.createElement('div');el.className='ravam-kain-power-indicator';root.querySelector('.v6-hp')?.after(el);}
      const type=ensureKainPower(p),label=KAIN_POWER_LABELS[type]||type.toUpperCase(),ready=(p.throwCd||0)<=.02;
      el.dataset.power=type;el.classList.toggle('cooldown',!ready);
      el.innerHTML=`<small>${side==='p2'?'9':'H'} · TROCAR</small><b>${label}</b><span>${ready?(side==='p2'?'1 · USAR':'J · USAR'):'RECARGA'}</span>`;
    });
  }
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){const r=baseUpdate.apply(this,arguments);updateRavam(f,dt);syncKainPowerHud(f);return r};

  function drawRavamFx(ctx,f){
    if(!f)return;
    for(const b of (f.priyaBullets||[])){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=b.superShot?'#ffe66f':'#ffd59b';ctx.lineWidth=b.superShot?6:3;ctx.shadowBlur=b.superShot?28:16;ctx.shadowColor=b.superShot?'#ffc83d':'#ff9e62';ctx.beginPath();ctx.moveTo(b.x-b.vx*(b.superShot?.028:.018),b.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle='#fff7dd';ctx.beginPath();ctx.arc(b.x,b.y,b.superShot?6:3.2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(const x of (f.priyaExplosions||[])){const t=1-clamp(x.life/(x.maxLife||1),0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-t;ctx.strokeStyle='#ffe56d';ctx.shadowBlur=28;ctx.shadowColor='#ff9f43';ctx.lineWidth=6*(1-t)+1;ctx.beginPath();ctx.arc(x.x,x.y,18+70*t,0,Math.PI*2);ctx.stroke();ctx.restore();}
    for(const b of (f.priyaBombs||[])){
      if(b.elapsed>=0&&Number.isFinite(b.lockX)){
        ctx.save();ctx.globalAlpha=.26+.14*Math.sin(performance.now()/120+b.serial);ctx.strokeStyle='#ff745e';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.lockX,GROUND_Y-4,28,8,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(b.lockX-8,GROUND_Y-4);ctx.lineTo(b.lockX+8,GROUND_Y-4);ctx.stroke();ctx.restore();
      }
      if(b.elapsed<0)continue;
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate((performance.now()/110)+(b.x*.01));ctx.fillStyle='#171b22';ctx.strokeStyle='#ff664a';ctx.lineWidth=3;ctx.shadowBlur=13;ctx.shadowColor='#ff3f2f';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ff6b45';ctx.fillRect(-10,-2,20,4);ctx.strokeStyle='#c9d1de';ctx.lineWidth=2;ctx.beginPath();ctx.arc(7,-11,6,0,Math.PI*1.4);ctx.stroke();ctx.restore();
    }
    for(const z of (f.ariaFlowers||[])){
      ctx.save();ctx.translate(z.x,z.y);ctx.rotate(performance.now()/210*(z.spin||1));ctx.globalCompositeOperation='lighter';
      ctx.shadowBlur=16;ctx.shadowColor='#70ff9a';ctx.fillStyle='#d9ffe2';
      for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);ctx.beginPath();ctx.ellipse(0,-7,3.5,7,0,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#f4d968';ctx.beginPath();ctx.arc(0,0,3.5,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(const g of (f.ariaGrass||[])){
      const end=Number.isFinite(g.currentEnd)?g.currentEnd:g.x1,lo=Math.min(g.x1,end),hi=Math.max(g.x1,end),len=Math.max(1,hi-lo),fade=clamp(g.life/(g.maxLife||1),0,1);
      ctx.save();ctx.globalAlpha=Math.min(1,fade*1.35);ctx.strokeStyle='#51d96f';ctx.fillStyle='#79f38f';ctx.shadowBlur=10;ctx.shadowColor='#62ef80';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(lo,GROUND_Y-3);ctx.lineTo(hi,GROUND_Y-3);ctx.stroke();
      const n=Math.min(16,Math.max(3,Math.floor(len/28)));for(let i=0;i<=n;i++){const x=lo+len*i/n,h=9+((i*7)%11);ctx.beginPath();ctx.moveTo(x-5,GROUND_Y-3);ctx.lineTo(x,GROUND_Y-3-h);ctx.lineTo(x+4,GROUND_Y-3);ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    for(const v of (f.ariaVines||[])){
      if(!v.active&&v.delay>0){
        ctx.save();ctx.globalAlpha=.28+.12*Math.sin(performance.now()/90);ctx.strokeStyle='#78f08d';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(v.x,GROUND_Y-3,34,9,0,0,Math.PI*2);ctx.stroke();ctx.restore();continue;
      }
      const t=v.target;if(!t)continue;const cy=typeof bodyY==='function'?bodyY(t):GROUND_Y-t.y-70;
      ctx.save();ctx.strokeStyle='#4bd66c';ctx.shadowBlur=15;ctx.shadowColor='#58e978';ctx.lineWidth=7;ctx.lineCap='round';
      for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(t.x+i*15,GROUND_Y+5);ctx.bezierCurveTo(t.x-24+i*10,cy+45,t.x+30-i*8,cy+10,t.x+i*10,cy-26);ctx.stroke();}
      ctx.fillStyle='#8cff9c';for(let i=0;i<5;i++){const yy=GROUND_Y-28-i*28;ctx.beginPath();ctx.ellipse(t.x+(i%2?18:-18),yy,8,3,(i%2?-.5:.5),0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
    for(const q of [f.p1,f.p2])if((q?.ariaPoisonT||0)>0&&q.state!=='ko'){
      const cy=typeof bodyY==='function'?bodyY(q):GROUND_Y-q.y-70;
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.25+.1*Math.sin(performance.now()/100);ctx.fillStyle='#65ff84';ctx.shadowBlur=14;ctx.shadowColor='#65ff84';
      for(let i=0;i<4;i++){const a=performance.now()/500+i*1.7;ctx.beginPath();ctx.arc(q.x+Math.cos(a)*28,cy+Math.sin(a*1.3)*38,3.5,0,Math.PI*2);ctx.fill();}ctx.restore();
    }
    for(const e of (f.ariaFx||[])){
      const a=Math.max(0,Math.min(1,e.life/(e.maxLife||1)));ctx.save();ctx.globalAlpha=a;ctx.font='900 13px Oxanium,Arial';ctx.textAlign='center';ctx.fillStyle=e.color||'#9dffad';ctx.shadowBlur=8;ctx.shadowColor='#000';ctx.fillText(e.text,e.x,e.y);ctx.restore();
    }
    for(const z of (f.kainIceShots||[])){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowBlur=22;ctx.shadowColor='#9edfff';ctx.fillStyle='#dff7ff';ctx.strokeStyle='#7fcfff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(z.x-z.vx*.026,z.y);ctx.lineTo(z.x,z.y);ctx.stroke();ctx.beginPath();ctx.moveTo(z.x,z.y-10);ctx.lineTo(z.x+8,z.y);ctx.lineTo(z.x,z.y+10);ctx.lineTo(z.x-8,z.y);ctx.closePath();ctx.fill();ctx.restore();
    }
    for(const z of (f.kainFireShots||[])){
      ctx.save();ctx.translate(z.x,z.y);ctx.globalCompositeOperation='lighter';ctx.shadowBlur=24;ctx.shadowColor='#ff6a3d';ctx.fillStyle='#ffb15d';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ff5a38';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-Math.sign(z.vx||1)*34,0);ctx.lineTo(0,0);ctx.stroke();ctx.restore();
    }
    for(const z of (f.kainBolts||[])){
      if((z.delay||0)>0)continue;
      const ty=z.target?(typeof bodyY==='function'?bodyY(z.target):GROUND_Y-z.target.y-70):GROUND_Y-80;
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.max(.2,Math.min(1,(z.life||0)*2));ctx.strokeStyle=z.mirror?'#ff9df0':'#ffe66b';ctx.shadowBlur=24;ctx.shadowColor=z.mirror?'#d85cff':'#ffe66b';ctx.lineWidth=z.mirror?6:5;ctx.beginPath();ctx.moveTo(z.x,22);for(let i=1;i<=7;i++)ctx.lineTo(z.x+(Math.random()-.5)*26,22+(ty-22)*i/7);ctx.stroke();ctx.restore();
    }
    for(const q of [f.p1,f.p2])if(q?.id==='kain'){
      const cy=typeof bodyY==='function'?bodyY(q):GROUND_Y-q.y-70;
      if((q.kainRepelT||0)>0){ctx.save();ctx.globalAlpha=.48+.12*Math.sin(performance.now()/90);ctx.strokeStyle='#d7dcff';ctx.shadowBlur=28;ctx.shadowColor='#aab2ff';ctx.lineWidth=4;ctx.setLineDash([9,6]);ctx.beginPath();ctx.arc(q.x,cy,52,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
      if((q.kainFlightT||0)>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.36;ctx.fillStyle='#afb8c9';ctx.beginPath();ctx.ellipse(q.x,GROUND_Y-3,54,12,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      if((q.kainControlSwapT||0)>0){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#d47cff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,cy,62+Math.sin(performance.now()/120)*4,0,Math.PI*2);ctx.stroke();ctx.restore();}
      if((q.kainSuperT||0)>0){ctx.save();ctx.globalAlpha=Math.min(1,q.kainSuperT);ctx.strokeStyle='#ff9df0';ctx.shadowBlur=28;ctx.shadowColor='#ff5edb';ctx.lineWidth=5;ctx.beginPath();ctx.arc(q.x,cy,72+Math.sin(performance.now()/70)*7,0,Math.PI*2);ctx.stroke();ctx.restore();}
    }
    for(const e of (f.kainFx||[])){
      const a=Math.max(0,Math.min(1,e.life/(e.maxLife||1)));ctx.save();ctx.globalAlpha=a;ctx.font='900 13px Oxanium,Arial';ctx.textAlign='center';ctx.fillStyle=e.color||'#fff';ctx.shadowBlur=8;ctx.shadowColor='#000';ctx.fillText(e.text,e.x,e.y);ctx.restore();
    }
  }
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const r=baseDraw.apply(this,arguments);try{drawRavamFx(canvas.getContext('2d'),f)}catch(_){}return r};

  function priyaPose(p){
    const move=p?.proMove?.kind;
    if(move==='kick'){
      const t=p.proMove?.time||0;
      if(t<.11)return {frame:5,kick:'windup'};
      if(t<.31)return {frame:2,kick:'impact'};
      return {frame:5,kick:'recover'};
    }
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround))return {frame:5};
    if(p.defend||p.state==='defend'||p.state==='crouch')return {frame:5};
    if(p.state==='special'||p.ravamBombCastT>0)return {frame:(p.stateT||0)<.18?1:2,bomb:true};
    if(p.state==='throw'||p.state==='attack'||p.proMove)return {frame:(p.stateT||0)<.10?3:4,shot:true};
    if(p.state==='hurt'||p.hitFlash>.035)return {frame:0};

    // Pulo completo: impulso, subida, ápice, queda e aterrissagem.
    if(!p.onGround){
      const vy=Number(p.vy)||0;
      if(vy>470)return {frame:5,jump:'takeoff'};
      if(vy>140)return {frame:1,jump:'rise'};
      if(vy>-160)return {frame:2,jump:'apex'};
      if(vy>-520)return {frame:1,jump:'fall'};
      return {frame:5,jump:'fastfall'};
    }
    if((p.ravamLandT||0)>0)return {frame:5,jump:'land'};

    // Caminhada sem crossfade: 4 tempos de passada usando poses limpas.
    if(Math.abs(p.vx||0)>7){
      const dist=Math.max(0,p.ravamWalkDist||0);
      const cycle=Math.floor(dist/13)%4;
      const frames=[1,0,2,0];
      return {frame:frames[cycle],walk:true,walkCycle:cycle,walkWave:(dist/13)%1};
    }
    return {frame:0};
  }
  function drawPoseImage(ctx,img,height){
    if(!img?.complete||!img.naturalWidth)return false;
    const width=height*(img.naturalWidth/img.naturalHeight);
    ctx.drawImage(img,-width/2,-height,width,height);
    return true;
  }
  function drawPriyaKickFx(ctx,p,floor,height,phase){
    if(!phase)return;
    const dir=p.facing||1;
    ctx.save();ctx.translate(p.x,floor-height*.38);ctx.scale(dir,1);ctx.globalCompositeOperation='lighter';
    const power=phase==='impact'?1:.5;
    ctx.strokeStyle='rgba(255,190,120,.92)';ctx.shadowColor='#ff6b45';ctx.shadowBlur=18;ctx.lineWidth=5*power;ctx.globalAlpha=.72*power;
    ctx.beginPath();ctx.arc(22,18,height*.44,-.7,.45);ctx.stroke();
    if(phase==='impact'){ctx.fillStyle='#fff2c2';ctx.globalAlpha=.88;ctx.beginPath();ctx.ellipse(height*.47,22,10,5,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawPriya(ctx,p){
    const pose=priyaPose(p),img=poseImages[pose.frame];
    if(!img?.complete||!img.naturalWidth)return false;
    const floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0),height=218;

    // Sombra reage à altura, diminuindo no pulo para dar melhor leitura de profundidade.
    const air=Math.max(0,Number(p.y)||0);
    const shadowScale=Math.max(.35,1-air/420);
    ctx.save();ctx.globalAlpha=.34*shadowScale;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,GROUND_Y+4,39*shadowScale,8*shadowScale,0,0,Math.PI*2);ctx.fill();ctx.restore();

    ctx.save();ctx.translate(p.x,floor);ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';

    // Caminhada: balanço leve de tronco e "bob" sincronizado à distância percorrida.
    if(pose.walk){
      const step=((p.ravamWalkDist||0)/13)*Math.PI*.5;
      const bob=Math.abs(Math.sin(step))*3.2;
      const sway=Math.sin(step)*.018;
      ctx.translate(Math.sin(step)*1.7,-bob);
      ctx.rotate(sway);
      if(pose.walkCycle===1||pose.walkCycle===3)ctx.scale(1.005,.995);
    }

    // Pulo em cinco momentos. As poses mudam com a velocidade vertical e recebem
    // squash/stretch discreto para parecer uma animação real, não um sprite flutuando.
    if(pose.jump==='takeoff'){ctx.translate(-3,2);ctx.rotate(-.035);ctx.scale(1.03,.96);}
    if(pose.jump==='rise'){ctx.translate(2,-3);ctx.rotate(.022);ctx.scale(.99,1.025);}
    if(pose.jump==='apex'){ctx.translate(0,-6);ctx.rotate(-.012);ctx.scale(1.015,.985);}
    if(pose.jump==='fall'){ctx.translate(-1,-1);ctx.rotate(.028);ctx.scale(.995,1.012);}
    if(pose.jump==='fastfall'){ctx.translate(2,2);ctx.rotate(.05);ctx.scale(1.025,.975);}
    if(pose.jump==='land'){
      const t=Math.max(0,Math.min(1,(p.ravamLandT||0)/.13));
      ctx.translate(0,4*(1-t));ctx.scale(1.045-.025*t,.945+.055*t);
    }

    if(pose.kick==='windup'){ctx.translate(-10,-3);ctx.rotate(-.045);}
    if(pose.kick==='impact'){ctx.translate(13,-7);ctx.rotate(-.075);ctx.scale(1.055,.985);}
    if(pose.kick==='recover'){ctx.translate(-3,-2);}
    if(pose.shot&&pose.frame===4){ctx.translate(-6,0);}
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround)){ctx.translate(-14,-10);ctx.rotate(-Math.PI/2);ctx.translate(0,height*.38)}

    // Sem blend entre imagens: evita "fantasma" na caminhada.
    drawPoseImage(ctx,img,height);
    ctx.restore();

    drawPriyaKickFx(ctx,p,floor,height,pose.kick);
    if(pose.shot&&pose.frame===4){
      ctx.save();ctx.translate(p.x+(p.facing||1)*96,floor-height*.66);ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffd69f';ctx.shadowColor='#ff9a55';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(0,0,5.5,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if(p.hitFlash>.035){ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha=.75;ctx.beginPath();ctx.moveTo(p.x-22,floor-height*.6-12);ctx.lineTo(p.x+22,floor-height*.6+12);ctx.stroke();ctx.restore()}
    return true;
  }

  function ariaPose(p){
    const move=p?.proMove?.kind;
    if(move==='kick')return {frame:2,strike:'kick'};
    if(move==='punch')return {frame:3,strike:'punch'};
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround))return {frame:4,ko:true};
    if(p.defend||p.state==='defend'||p.state==='crouch')return {frame:4,guard:true};
    if((p.ariaSuperT||0)>0||p.state==='special')return {frame:3,cast:true,super:true};
    if((p.ariaCastT||0)>0||p.state==='throw'||p.state==='attack')return {frame:3,cast:true};
    if(p.state==='hurt'||p.hitFlash>.035)return {frame:4,hurt:true};
    if(!p.onGround)return {frame:5,air:true};
    if(Math.abs(p.vx||0)>7){
      const raw=Math.max(0,p.ravamWalkDist||0)/15;
      const cycle=Math.floor(raw)%4,frames=[1,0,2,0];
      return {frame:frames[cycle],walk:true,phase:raw*Math.PI*.5};
    }
    return {frame:0,idle:true};
  }
  function drawAria(ctx,p){
    const pose=ariaPose(p),img=ariaPoseImages[pose.frame];if(!img?.complete||!img.naturalWidth)return false;
    const floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0),height=238;
    const baselineOffset=height*(20/222);
    ctx.save();ctx.globalAlpha=.34;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,GROUND_Y+4,38,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(p.x,floor+baselineOffset);ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(pose.walk){ctx.translate(Math.sin(pose.phase||0)*1.8,-Math.abs(Math.sin(pose.phase||0))*2.2);ctx.rotate(Math.sin(pose.phase||0)*.012);}
    if(pose.cast){ctx.translate((p.facing||1)*2,-2);}
    if(pose.strike==='punch'){ctx.translate(5,-2);ctx.rotate(-.025);}
    if(pose.strike==='kick'){ctx.translate(7,-3);ctx.rotate(-.035);}
    if(pose.hurt){ctx.translate(-5,1);ctx.rotate(.025);}
    if(pose.ko){ctx.translate(-12,-8);ctx.rotate(-Math.PI/2);ctx.translate(0,height*.32);}
    const width=height*(img.naturalWidth/img.naturalHeight);ctx.drawImage(img,-width/2,-height,width,height);ctx.restore();
    if(pose.cast){
      ctx.save();ctx.translate(p.x+(p.facing||1)*62,floor-height*.60);ctx.globalCompositeOperation='lighter';ctx.fillStyle=pose.super?'#b6ff9d':'#7dff9f';ctx.shadowBlur=20;ctx.shadowColor='#63ef85';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    return true;
  }

  function kainPose(p){
    const move=p?.proMove?.kind;
    if(move==='punch'||move==='kick'){
      const duration=Math.max(.001,Number(p.proMove?.duration)||.3);
      const n=clamp((Number(p.proMove?.time)||0)/duration,0,1);
      if(move==='punch'){
        if(n<.20)return {frame:4,strike:'punch',phase:'windup',phaseT:n/.20};
        if(n<.64)return {frame:3,strike:'punch',phase:'impact',phaseT:(n-.20)/.44};
        return {frame:4,strike:'punch',phase:'recover',phaseT:(n-.64)/.36};
      }
      if(n<.22)return {frame:4,strike:'kick',phase:'windup',phaseT:n/.22};
      if(n<.68)return {frame:5,strike:'kick',phase:'impact',phaseT:(n-.22)/.46};
      return {frame:1,strike:'kick',phase:'recover',phaseT:(n-.68)/.32};
    }
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround))return {frame:5,ko:true};
    if(p.defend||p.state==='defend'||p.state==='crouch')return {frame:4,guard:true};
    if((p.kainSuperT||0)>0||p.state==='special')return {frame:3,power:true};
    if(p.state==='throw'||(p.kainPowerFxT||0)>0)return {frame:3,power:true};
    if(p.state==='hurt'||p.hitFlash>.035)return {frame:4,hurt:true};
    if((p.kainFlightT||0)>0||!p.onGround)return {frame:5,air:true};
    if(Math.abs(p.vx||0)>7){
      const dist=Math.max(0,p.ravamWalkDist||0);
      const raw=dist/15.5;
      const cycle=Math.floor(raw)%8;
      const frames=[1,1,0,0,2,2,0,0];
      return {frame:frames[cycle],walk:true,cycle,walkT:raw-Math.floor(raw),walkPhase:(raw/8)*Math.PI*2};
    }
    return {frame:0,idle:true};
  }

  function drawKainStrikeFx(ctx,p,floor,height,pose){
    if(!pose?.strike)return;
    const dir=p.facing||1;
    const t=clamp(Number(pose.phaseT)||0,0,1);
    ctx.save();
    ctx.translate(p.x,floor);
    ctx.scale(dir,1);
    ctx.globalCompositeOperation='lighter';
    if(pose.strike==='punch'){
      if(pose.phase==='impact'){
        const e=1-Math.pow(1-t,3);
        ctx.globalAlpha=.8*(1-t*.28);
        ctx.strokeStyle='#e9ecff';
        ctx.shadowColor='#aab4ff';
        ctx.shadowBlur=22;
        ctx.lineWidth=5;
        for(let i=0;i<3;i++){
          ctx.beginPath();
          ctx.moveTo(34-i*7,-height*.58+i*8);
          ctx.lineTo(105+e*24+i*11,-height*.58+i*4);
          ctx.stroke();
        }
        ctx.fillStyle='#ffffff';
        ctx.globalAlpha=.9*(1-t*.5);
        ctx.beginPath();
        ctx.ellipse(103+e*18,-height*.58,8+8*(1-t),4+3*(1-t),0,0,Math.PI*2);
        ctx.fill();
      }
    }else if(pose.strike==='kick'){
      if(pose.phase==='impact'){
        const e=1-Math.pow(1-t,3);
        ctx.globalAlpha=.74*(1-t*.2);
        ctx.strokeStyle='#cfd5ff';
        ctx.shadowColor='#7c89ff';
        ctx.shadowBlur=24;
        ctx.lineWidth=6;
        ctx.beginPath();
        ctx.arc(16,-height*.38,76+e*18,-1.12,.16);
        ctx.stroke();
        ctx.lineWidth=2;
        ctx.globalAlpha=.5;
        ctx.beginPath();
        ctx.arc(22,-height*.38,90+e*10,-1.02,.08);
        ctx.stroke();
        ctx.fillStyle='#ffffff';
        ctx.globalAlpha=.85*(1-t*.5);
        ctx.beginPath();
        ctx.ellipse(102+e*10,-height*.28,11,5,-.12,0,Math.PI*2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawKainPoseImage(ctx,img,referenceHeight=226){
    // Todas as poses usam a MESMA escala de pixels do frame idle (540px de referência).
    // Assim soco/chute não aumentam o personagem só porque o recorte da pose é mais baixo.
    const scale=referenceHeight/540;
    const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
    ctx.drawImage(img,-w/2,-h,w,h);
  }

  function drawKain(ctx,p){
    const pose=kainPose(p),img=kainPoseImages[pose.frame];
    if(!img?.complete||!img.naturalWidth)return false;
    const floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0),height=226;
    const air=Math.max(0,Number(p.y)||0),shadowScale=Math.max(.3,1-air/390);

    // Sombra mais firme no chão e comprimida durante golpes.
    let shadowW=43*shadowScale,shadowA=.34*shadowScale;
    if(pose.strike==='punch'){shadowW*=1.08;shadowA*=1.08}
    if(pose.strike==='kick'){shadowW*=1.16;shadowA*=.92}
    ctx.save();
    ctx.globalAlpha=shadowA;
    ctx.fillStyle='#000';
    ctx.beginPath();
    ctx.ellipse(p.x,GROUND_Y+4,shadowW,9*shadowScale,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(p.x,floor);
    ctx.scale(p.facing||1,1);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    // Caminhada em 8 tempos: contato, apoio, passagem e troca de perna.
    if(pose.walk){
      const phase=pose.walkPhase||0;
      const foot=Math.sin(phase);
      const bob=Math.abs(Math.sin(phase))*3.8;
      const push=Math.sin(phase)*2.4;
      ctx.translate(push,-bob);
      ctx.rotate(Math.sin(phase)*.020);
      if(pose.cycle===0||pose.cycle===3)ctx.translate(1.4,0);
    }

    if(pose.air){
      const vy=Number(p.vy)||0;
      const lean=clamp(-vy/900,-.08,.08);
      ctx.translate(2,-5);
      ctx.rotate(lean);
    }

    if(pose.power){
      const t=Math.min(1,(p.stateT||0)*5);
      const e=1-Math.pow(1-t,3);
      ctx.translate(10*e,-4*e);
      ctx.rotate(-.035*e);
    }

    if(pose.strike==='punch'){
      const t=clamp(pose.phaseT||0,0,1);
      if(pose.phase==='windup'){
        const e=t*t;
        ctx.translate(-13*e,2*e);
        ctx.rotate(.045*e);
      }else if(pose.phase==='impact'){
        const e=1-Math.pow(1-t,3);
        ctx.translate(14+22*e,-3-4*e);
        ctx.rotate(-.085+.032*t);
      }else{
        const e=1-t;
        ctx.translate(11*e,-2*e);
        ctx.rotate(-.035*e);
      }
    }

    if(pose.strike==='kick'){
      const t=clamp(pose.phaseT||0,0,1);
      if(pose.phase==='windup'){
        const e=t*t;
        ctx.translate(-10*e,4*e);
        ctx.rotate(.055*e);
      }else if(pose.phase==='impact'){
        const e=1-Math.pow(1-t,3);
        ctx.translate(16+24*e,-10-9*e);
        ctx.rotate(-.135+.045*t);
      }else{
        const e=1-t;
        ctx.translate(10*e,-5*e);
        ctx.rotate(-.045*e);
      }
    }

    if(pose.guard){
      ctx.translate(-2,1);
    }
    if(pose.hurt){
      ctx.translate(-7,1);
      ctx.rotate(.035);
    }
    if(pose.ko){
      ctx.translate(-12,-10);
      ctx.rotate(-Math.PI/2);
      ctx.translate(0,height*.34);
    }

    drawKainPoseImage(ctx,img,height);
    ctx.restore();

    drawKainStrikeFx(ctx,p,floor,height,pose);

    if((p.kainPowerFxT||0)>0){
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=Math.min(1,p.kainPowerFxT*1.4);
      ctx.fillStyle='#d9deeb';
      ctx.shadowBlur=18;
      ctx.shadowColor='#c5c9ff';
      ctx.beginPath();
      ctx.arc(p.x+(p.facing||1)*68,floor-height*.58,7,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    if(p.hitFlash>.035){
      ctx.save();
      ctx.strokeStyle='#fff';
      ctx.lineWidth=2;
      ctx.globalAlpha=.75;
      ctx.beginPath();
      ctx.moveTo(p.x-22,floor-height*.6-12);
      ctx.lineTo(p.x+22,floor-height*.6+12);
      ctx.stroke();
      ctx.restore();
    }
    return true;
  }

  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){if(p?.id==='priya'&&drawPriya(ctx,p))return;if(p?.id==='kain'&&drawKain(ctx,p))return;if(p?.id==='aria'&&drawAria(ctx,p))return;return baseDrawFighter.apply(this,arguments)};


  // Mantém o fluxo pós-luta dentro do universo R.A.V.A.M.
  const baseShowMatchResult=window.showMatchResult;
  if(typeof baseShowMatchResult==='function')window.showMatchResult=function(playerWon,options={}){
    const current=typeof fight!=='undefined'?fight:null;
    if(current?.mode==='lan')return baseShowMatchResult.apply(this,arguments);
    const isRavam=!!(current&&(current.ravamStudios||RAVAM_IDS.includes(current.p1?.id)||RAVAM_IDS.includes(current.p2?.id)));
    if(!isRavam)return baseShowMatchResult.apply(this,arguments);
    const snapshot={
      p1:current.p1?.id||'kain',
      p2:current.p2?.id||'priya',
      mode:current.mode||'ravam',
      story:!!current.ravamStory,
      storyTitle:current.ravamStoryTitle||'CAPÍTULO R.A.V.A.M'
    };
    const merged=snapshot.story?{
      ...options,
      headline:'R.A.V.A.M · MODO HISTÓRIA',
      detail:playerWon
        ? `${snapshot.storyTitle} concluído. ${String(current.p1?.name||'A Lenda')} venceu o confronto.`
        : `${snapshot.storyTitle} interrompido. Tente novamente quando estiver pronto.`
    }:options;
    const result=baseShowMatchResult.call(this,playerWon,merged);
    setTimeout(()=>{
      const resetRavam=()=>{
        try{window.removeMatchResult?.()}catch(_){try{document.getElementById('match-result-overlay')?.remove()}catch(__){}}
        try{fight=null}catch(_){}
        try{bestOfThree={p1Wins:0,p2Wins:0,round:1,active:false}}catch(_){}
      };
      const back=document.getElementById('result-select');
      if(back)back.onclick=()=>{resetRavam();window.renderRavamMode?.();};
      const replay=document.getElementById('result-replay');
      if(replay)replay.onclick=()=>{
        resetRavam();
        if(snapshot.story){startRavamStory(snapshot.p1);return;}
        window.startFight(snapshot.p1,snapshot.mode,snapshot.p2);
        try{if(typeof fight!=='undefined'&&fight)fight.ravamStudios=true}catch(_){}
      };
    },0);
    return result;
  };

  window.RavamStudios=Object.freeze({version:VERSION,cost:ACCESS_COST,priya:PRIYA,kain:KAIN,aria:ARIA,characters:Object.freeze([PRIYA,KAIN,ARIA]),ability:ABILITY,kainAbility:KAIN_ABILITY,ariaAbility:ARIA_ABILITY,displayName,render:()=>window.renderRavamMode?.()});
})();
