/* SORTEP NIAK — R.A.V.A.M V17
 * Loja de Lendas, Leo Vesper, animações fluidas e retorno correto à seleção.
 */
(()=>{
  'use strict';
  if(window.RavamV17?.version)return;
  const VERSION='18.0.0';
  const SHOP_VERSION=17;
  const ACCESS_COST=Number(window.RavamStudios?.cost)||2500;
  const BASE=window.RavamStudios||{};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');
  const save=()=>{try{typeof persist==='function'?persist():saveState?.(state)}catch(_){}};
  const appNode=()=>{try{return app}catch(_){return document.getElementById('app')}};
  const hasAccess=()=>{try{return !!state?.ravamModeUnlocked}catch(_){return false}};
  const oldPriya=BASE.priya||{id:'priya',name:'Alana Sorelle',color:'#d85b42',hp:1940,dmg:32,speed:82,price:0,weapon:'ravamRifle',special:'tripleBombRavam',portrait:'ai-assets/characters/priya.png',secret:true,ravamOnly:true};
  const oldKain=BASE.kain||{id:'kain',name:'Kain',color:'#8d93a1',hp:2180,dmg:35,speed:88,price:0,weapon:'kainChaos',special:'kainMirror',portrait:'ai-assets/characters/kain.png',secret:true,ravamOnly:true};
  const oldAria=BASE.aria||{id:'aria',name:'Aria Valfleur',color:'#2f9d69',hp:1920,dmg:31,speed:86,price:0,weapon:'ariaBloom',special:'ariaVine',portrait:'ai-assets/characters/aria.png',secret:true,ravamOnly:true};
  const LEO=Object.freeze({
    id:'leo',name:'Leo Vesper',color:'#14865f',hp:2050,dmg:34,speed:87,price:0,
    weapon:'vesperPortal',special:'vesperRain',portrait:'ai-assets/characters/leo.png',secret:true,ravamOnly:true
  });
  const ALL=Object.freeze([oldPriya,oldKain,oldAria,LEO]);
  const ALL_IDS=Object.freeze(ALL.map(c=>c.id));
  const COSTS=Object.freeze({priya:0,kain:700,aria:650,leo:800});
  const ABILITY={
    priya:BASE.ability||{flag:'RAVAM',role:'Atiradora Tática',tag:'PRECISÃO',desc:'J dispara com o rifle. L lança a Tríade Demolidora.'},
    kain:BASE.kainAbility||{flag:'RAVAM',role:'Mímico do Caos',tag:'CAOS',desc:'J usa o poder atual. H troca o poder. L ativa o Espelho Abissal.'},
    aria:BASE.ariaAbility||{flag:'RAVAM',role:'Feiticeira Botânica',tag:'NATUREZA',desc:'J lança duas flores venenosas. L prende o rival com cipós.'},
    leo:Object.freeze({flag:'RAVAM',role:'Arquiteto de Portais',tag:'PORTAIS',desc:'J lança duas pedras retas para a frente, sem perseguir o rival. L abre o CÉU VESPER e faz cair 2 facas, 2 espadas e 2 pedras.'})
  };
  const META={
    priya:{name:'ALANA SORELLE',tag:'PRECISÃO',accent:'#ff765e',portrait:'ai-assets/characters/priya.png',stats:[32,82,1940],moves:[['J','RIFLE'],['I','SOCO'],['O','CHUTE'],['L','3 BOMBAS']]},
    kain:{name:'KAIN',tag:'CAOS',accent:'#c0c7ff',portrait:'ai-assets/characters/kain.png',stats:[35,88,2180],moves:[['J','USAR PODER'],['H / P2 9','TROCAR PODER'],['I','SOCO'],['O','CHUTE'],['L','ESPELHO']]},
    aria:{name:'ARIA VALFLEUR',tag:'NATUREZA',accent:'#82efa5',portrait:'ai-assets/characters/aria.png',stats:[31,86,1920],moves:[['J','2 FLORES'],['I','SOCO'],['O','CHUTE'],['L','CIPÓ']]},
    leo:{name:'LEO VESPER',tag:'PORTAIS',accent:'#67f3b8',portrait:'ai-assets/characters/leo.png',stats:[34,87,2050],moves:[['J','2 PEDRAS RETAS'],['I','SOCO'],['O','CHUTE'],['L','CHUVA VESPER']]}
  };

  function toast(text,tone='normal',ms=2200){
    try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(text,tone,ms)}catch(_){}
    try{typeof mixToast==='function'&&mixToast(text)}catch(_){}
  }
  function ensureEconomy(){
    try{
      if(typeof state==='undefined')return;
      let changed=false;
      if(!Array.isArray(state.ravamRoster)){state.ravamRoster=[];changed=true}
      if(state.ravamModeUnlocked && Number(state.ravamStoreVersion||0)<SHOP_VERSION){
        // Migração da V16: o modo continua adquirido, mas a loja passa a controlar as Lendas.
        state.ravamRoster=['priya'];
        state.ravamStoreVersion=SHOP_VERSION;
        state.ravamLegendPurchases=[];
        changed=true;
      }
      state.ravamRoster=[...new Set(state.ravamRoster.filter(id=>ALL_IDS.includes(id)))];
      if(state.ravamModeUnlocked&&!state.ravamRoster.includes('priya')){state.ravamRoster.unshift('priya');changed=true}
      if(changed)save();
    }catch(_){}
  }
  function isOwned(id){
    ensureEconomy();
    try{return !!state?.ravamModeUnlocked&&Array.isArray(state.ravamRoster)&&state.ravamRoster.includes(id)}catch(_){return false}
  }
  function unlockedIds(){ensureEconomy();try{return state.ravamRoster.filter(id=>ALL_IDS.includes(id))}catch(_){return ['priya']}}
  function charOf(id){return ALL.find(c=>c.id===id)||oldPriya}
  function displayName(id){return META[id]?.name||String(id||'AGUARDANDO').toUpperCase()}
  function randomRival(id){const pool=ALL_IDS.filter(x=>x!==id);return pool[Math.floor(Math.random()*pool.length)]||'kain'}
  function storyRival(id){return ({priya:'aria',aria:'kain',kain:'leo',leo:'priya'})[id]||'kain'}

  // API V17: online enxerga todas as Lendas para resolver nomes, mas a seleção filtra pelo isOwned().
  try{
    const api={...BASE,version:VERSION,cost:ACCESS_COST,priya:oldPriya,kain:oldKain,aria:oldAria,leo:LEO,allCharacters:ALL,isOwned,unlockedIds,displayName};
    delete api.characters;
    Object.defineProperty(api,'characters',{enumerable:true,get:()=>ALL});
    api.render=()=>window.renderRavamMode?.();
    api.openShop=()=>renderShop();
    window.RavamStudios=Object.freeze(api);
  }catch(_){}

  // Leo fica disponível ao motor somente durante a criação da luta para não vazar aos modos normais.
  function registerLeo(){
    const added=[];
    try{
      if(typeof CHARACTERS!=='undefined'&&!CHARACTERS.some(c=>c.id==='leo')){CHARACTERS.push(LEO);added.push('char')}
      if(typeof ABILITIES!=='undefined'&&!ABILITIES.leo)ABILITIES.leo=ABILITY.leo;
      if(typeof MOVES!=='undefined'&&!MOVES.leo)MOVES.leo=[['J','2 PEDRAS RETAS · sem perseguição'],['I','Soco Vesper'],['O','Chute Vesper'],['L','CÉU VESPER · 2 facas + 2 espadas + 2 pedras']];
    }catch(_){}
    return ()=>{try{if(added.includes('char')&&typeof CHARACTERS!=='undefined'){const i=CHARACTERS.findIndex(c=>c.id==='leo');if(i>=0)CHARACTERS.splice(i,1)}}catch(_){}};
  }
  const baseStartFight=window.startFight;
  if(typeof baseStartFight==='function')window.startFight=function(playerId,mode,player2Id,stageId,chaos){
    const needsLeo=playerId==='leo'||player2Id==='leo',undo=needsLeo?registerLeo():()=>{};
    let r;
    try{r=baseStartFight.apply(this,arguments)}finally{undo()}
    try{
      if(typeof fight!=='undefined'&&fight&&(ALL_IDS.includes(fight.p1?.id)||ALL_IDS.includes(fight.p2?.id))){
        fight.ravamStudios=true;fight.ravamVersion=VERSION;
        fight.leoRocks=Array.isArray(fight.leoRocks)?fight.leoRocks:[];
        fight.leoRain=Array.isArray(fight.leoRain)?fight.leoRain:[];
        fight.leoPortals=Array.isArray(fight.leoPortals)?fight.leoPortals:[];
        fight.leoFx=Array.isArray(fight.leoFx)?fight.leoFx:[];
        for(const q of [fight.p1,fight.p2])if(q?.id==='leo'){q.leoCastT=0;q.leoSuperT=0;}
      }
    }catch(_){}
    return r;
  };

  /* =========================
     LOJA + SELEÇÃO R.A.V.A.M
     ========================= */
  let pickP1='',pickP2='',pendingMode='cpu';
  function modeCopy(mode){
    if(mode==='pvp')return {eyebrow:'DUELO LOCAL',desc:'Escolha a Lenda do Jogador 1 e depois a Lenda do Jogador 2.'};
    if(mode==='story')return {eyebrow:'CAPÍTULO R.A.V.A.M',desc:'Escolha o protagonista. O rival faz parte do capítulo.'};
    return {eyebrow:'COMBATE SOLO',desc:'Escolha sua Lenda. A CPU entra com outro personagem R.A.V.A.M.'};
  }
  function legendCard(id,selected=false,slot=''){
    const m=META[id],owned=isOwned(id),cost=COSTS[id]||0;
    const moves=m.moves.map(([k,t])=>`<span><kbd>${k}</kbd>${t}</span>`).join('');
    return `<button class="ravam-legend-card ${id} ${selected?'selected':''} ${owned?'owned':'locked'}" data-r17-char="${id}" aria-pressed="${selected}">
      <div class="ravam-priya-art"><img src="${m.portrait}" alt="${m.name}">${owned?'':`<div class="r17-lock"><b>🔒 BLOQUEADA</b><span>🟪 ${fmt(cost)} VANDAIS</span><em>ABRIR LOJA</em></div>`}</div>
      <div class="ravam-priya-info"><small>LENDA R.A.V.A.M · ${m.tag}</small><h3>${m.name}</h3><p>${ABILITY[id].desc}</p><div class="ravam-stats"><span><b>${m.stats[0]}</b>DANO</span><span><b>${m.stats[1]}</b>AGILIDADE</span><span><b>${m.stats[2]}</b>VIDA</span></div><div class="ravam-moves">${moves}</div></div>
      ${owned?`<span class="ravam-selected-mark">${slot||'SELECIONADO'}</span>`:''}
    </button>`;
  }
  function renderLocked(){
    const a=appNode();if(!a)return;
    const can=(Number(state?.vandais)||0)>=ACCESS_COST;
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen r17-screen">
      <section class="ravam-pro-hero locked"><div class="ravam-copy"><small>UNIVERSO PREMIUM</small><h2>R.A.V.A.M <span>STUDIOS</span></h2><p>Adquira o acesso permanente. A primeira Lenda, Alana Sorelle, vem liberada; Kain, Aria e Leo ficam na Loja R.A.V.A.M.</p><div class="ravam-price">🟪 ${fmt(ACCESS_COST)} VANDAIS</div><div class="ravam-wallet-line">SALDO · 🟪 ${fmt(state?.vandais||0)}</div></div><img src="ai-assets/characters/leo.png" alt="Leo Vesper"></section>
      <section class="ravam-unlock-card"><div><small>ACESSO + 1 LENDA INICIAL</small><h3>ALANA SORELLE</h3><p>Depois da compra, desbloqueie Kain, Aria Valfleur e Leo Vesper individualmente na Loja R.A.V.A.M.</p></div><button id="r17-buy-access" class="btn big" ${can?'':'disabled'}>${can?'🟪 ADQUIRIR R.A.V.A.M':'VANDAIS INSUFICIENTES'}</button></section>
      <button id="r17-back" class="btn">← VOLTAR AOS MODOS</button>
    </div>`;
    const b=document.getElementById('r17-buy-access');if(b&&can)b.onclick=()=>{state.vandais=Math.max(0,(Number(state.vandais)||0)-ACCESS_COST);state.ravamModeUnlocked=true;state.ravamStoreVersion=SHOP_VERSION;state.ravamRoster=['priya'];state.ravamPurchasedAt=Date.now();save();toast('R.A.V.A.M LIBERADO · ALANA SORELLE DISPONÍVEL','reward',2800);renderHub()};
    document.getElementById('r17-back').onclick=()=>window.renderModes?.();
  }
  function renderHub(){
    ensureEconomy();const a=appNode();if(!a)return;
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen ravam-v15 r17-screen">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>R.A.V.A.M STUDIOS · V17</small><h2>ESCOLHA O <span>MODO</span></h2><p>Monte a luta, compre novas Lendas e entre na arena.</p></div><div class="ravam-head-wallet"><span>CARTEIRA</span><b>🟪 ${fmt(state?.vandais||0)}</b><small>VANDAIS</small></div></section>
      <section class="r17-showcase"><div><small>4 LENDAS · ${unlockedIds().length} DESBLOQUEADA(S)</small><h3>ALANA · KAIN · ARIA · <b>LEO</b></h3><p>Precisão, caos, natureza e portais. Lendas bloqueadas precisam ser compradas na Loja R.A.V.A.M.</p></div><div class="r17-art-stack"><img src="ai-assets/characters/priya.png" alt="Alana"><img src="ai-assets/characters/kain.png" alt="Kain"><img src="ai-assets/characters/aria.png" alt="Aria"><img src="ai-assets/characters/leo.png" alt="Leo"></div></section>
      <div class="ravam-section-title battle"><span>01</span><div><small>PASSO UM</small><h3>ESCOLHA COMO LUTAR</h3></div></div>
      <section class="ravam-battle-grid r17-mode-grid">
        <button id="r17-cpu" class="ravam-battle-card cpu"><span class="ravam-battle-icon">◈</span><small>COMBATE SOLO</small><h3>1P <b>× CPU</b></h3><p>Escolha sua Lenda e enfrente a CPU.</p><em>SELECIONAR →</em></button>
        <button id="r17-pvp" class="ravam-battle-card pvp"><span class="ravam-battle-icon">⚔</span><small>DUELO LOCAL</small><h3>1P <b>× 2P</b></h3><p>Dois jogadores no mesmo computador.</p><em>SELECIONAR →</em></button>
        <button id="r17-story" class="ravam-battle-card story"><span class="ravam-battle-icon">◇</span><small>CAPÍTULO R.A.V.A.M</small><h3>MODO <b>HISTÓRIA</b></h3><p>Capítulo próprio para cada Lenda.</p><em>SELECIONAR →</em></button>
        <button id="r17-online" class="ravam-battle-card online"><span class="ravam-battle-icon">◎</span><small>2 JOGADORES · INTERNET</small><h3>ONLINE <b>2P2</b></h3><p>P1 × P2 pela internet, com seleção R.A.V.A.M em cada PC.</p><em>CRIAR / ENTRAR →</em></button>
      </section>
      <div class="r17-hub-actions"><button id="r17-shop" class="btn big r17-shop-btn">🛒 LOJA R.A.V.A.M</button><button id="r17-back" class="btn">← VOLTAR AOS MODOS</button></div>
    </div>`;
    document.getElementById('r17-cpu').onclick=()=>renderSelect('cpu');
    document.getElementById('r17-pvp').onclick=()=>renderSelect('pvp');
    document.getElementById('r17-story').onclick=()=>renderSelect('story');
    document.getElementById('r17-shop').onclick=renderShop;
    document.getElementById('r17-online').onclick=()=>{const net=window.LutadorOnlineV16;SFX?.play?.('menu_confirm');if(net?.openRavam)net.openRavam();else toast('ONLINE indisponível. Recarregue a página.','danger')};
    document.getElementById('r17-back').onclick=()=>window.renderModes?.();
  }
  function renderShop(){
    ensureEconomy();const a=appNode();if(!a)return;screen='ravam';drawCanvas?.();
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen r17-screen r17-shop-screen">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>COLEÇÃO R.A.V.A.M</small><h2>LOJA DE <span>LENDAS</span></h2><p>Compre a Lenda uma vez e ela fica disponível nos modos local, história e online.</p></div><div class="ravam-head-wallet"><span>SALDO</span><b>🟪 ${fmt(state?.vandais||0)}</b><small>VANDAIS</small></div></section>
      <div class="r17-shop-grid">${ALL_IDS.map(id=>{const m=META[id],owned=isOwned(id),cost=COSTS[id]||0;return `<article class="r17-shop-card ${id} ${owned?'owned':'locked'}"><div class="r17-shop-art"><img src="${m.portrait}" alt="${m.name}"><span>${owned?'✓ SUA LENDA':'🔒 BLOQUEADA'}</span></div><div class="r17-shop-body"><small>${m.tag}</small><h3>${m.name}</h3><p>${ABILITY[id].desc}</p><div class="r17-shop-stats"><span><b>${m.stats[0]}</b>DANO</span><span><b>${m.stats[1]}</b>AGIL</span><span><b>${m.stats[2]}</b>VIDA</span></div>${id==='priya'?'<button class="btn" disabled>LENDA INICIAL</button>':owned?'<button class="btn" disabled>✓ DESBLOQUEADA</button>':`<button class="btn big r17-buy-legend" data-id="${id}" ${Number(state?.vandais||0)>=cost?'':'disabled'}>🟪 COMPRAR · ${fmt(cost)}</button>`}</div></article>`}).join('')}</div>
      <div class="r17-hub-actions"><button id="r17-shop-back" class="btn big">← VOLTAR AO R.A.V.A.M</button></div>
    </div>`;
    document.querySelectorAll('.r17-buy-legend').forEach(b=>b.onclick=()=>{
      const id=b.dataset.id,cost=COSTS[id]||0;if(isOwned(id))return;
      if((Number(state.vandais)||0)<cost){toast('VANDAIS INSUFICIENTES','danger');return}
      state.vandais=Math.max(0,(Number(state.vandais)||0)-cost);state.ravamRoster.push(id);state.ravamRoster=[...new Set(state.ravamRoster)];if(!Array.isArray(state.ravamLegendPurchases))state.ravamLegendPurchases=[];state.ravamLegendPurchases.push({id,at:Date.now(),cost});save();toast(`${displayName(id)} DESBLOQUEADO!`,'reward',2600);renderShop();
    });
    document.getElementById('r17-shop-back').onclick=renderHub;
  }
  function renderSelect(mode='cpu'){
    ensureEconomy();pendingMode=mode;window.__ravamPendingMode=mode;const a=appNode();if(!a)return;screen='ravam';drawCanvas?.();
    const copy=modeCopy(mode),p1=pickP1,p2=pickP2,pickingP2=mode==='pvp'&&!!p1&&!p2,ready=mode==='pvp'?!!(p1&&p2):!!p1;
    const opponent=mode==='cpu'&&p1?randomRival(p1):mode==='story'&&p1?storyRival(p1):'';
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen ravam-v15 r17-screen select-mode-${mode}">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>${copy.eyebrow}</small><h2>SELEÇÃO DE <span>LENDAS</span></h2><p>${copy.desc}</p></div><button id="r17-change-mode" class="ravam-mini-back">← TROCAR MODO</button></section>
      <section class="ravam-match-slots ${mode}"><div class="ravam-slot p1 ${p1?'filled':''} ${!p1||(!pickingP2&&mode!=='pvp')?'active':''}"><small>${mode==='story'?'PROTAGONISTA':'JOGADOR 1'}</small><b>${p1?displayName(p1):'AGUARDANDO'}</b><span>${p1?'PRONTO':'ESCOLHA UMA LENDA'}</span></div><div class="ravam-versus">VS</div><div class="ravam-slot p2 ${p2||opponent?'filled':''} ${pickingP2?'active':''}"><small>${mode==='pvp'?'JOGADOR 2':mode==='story'?'RIVAL DO CAPÍTULO':'CPU'}</small><b>${mode==='pvp'?(p2?displayName(p2):'AGUARDANDO'):(opponent?displayName(opponent):'AGUARDANDO')}</b><span>${mode==='pvp'?(p2?'PRONTO':'ESCOLHA UMA LENDA'):(p1?'DEFINIDO AUTOMATICAMENTE':'AGUARDANDO')}</span></div></section>
      <div class="ravam-section-title"><span>02</span><div><small>PASSO DOIS</small><h3>${pickingP2?'P2 · ESCOLHA SUA LENDA':'ESCOLHA SUA LENDA'}</h3></div></div>
      <section class="ravam-roster-grid ravam-pick-grid r17-pick-grid">${ALL_IDS.map(id=>legendCard(id,mode==='pvp'?(p1===id||p2===id):p1===id,mode==='pvp'?(p1===id?'P1':p2===id?'P2':''):(p1===id?'P1':''))).join('')}</section>
      <div class="ravam-selection-help">Lendas com cadeado precisam ser adquiridas na Loja R.A.V.A.M. ${mode==='pvp'?'Escolha primeiro P1 e depois P2.':''}</div>
      <div class="ravam-footer-actions"><button id="r17-confirm" class="btn big" ${ready?'':'disabled'}>${mode==='story'?'INICIAR HISTÓRIA':mode==='pvp'?'INICIAR 1P × 2P':'INICIAR 1P × CPU'}</button><button id="r17-open-shop" class="btn">🛒 LOJA R.A.V.A.M</button></div>
    </div>`;
    document.querySelectorAll('[data-r17-char]').forEach(el=>el.onclick=()=>{
      const id=el.dataset.r17Char;if(!isOwned(id)){renderShop();return}SFX?.play?.('menu_select');
      if(mode==='pvp'){
        if(!pickP1||pickP2){pickP1=id;pickP2=''}
        else if(id===pickP1){toast('P1 e P2 precisam usar Lendas diferentes.','normal');return}
        else pickP2=id;
      }else pickP1=id;
      renderSelect(mode);
    });
    document.getElementById('r17-change-mode').onclick=()=>{pickP1='';pickP2='';renderHub()};
    document.getElementById('r17-open-shop').onclick=renderShop;
    const c=document.getElementById('r17-confirm');if(c&&!c.disabled)c.onclick=()=>startSelected(mode);
  }
  function startSelected(mode){
    const a=pickP1;if(!a||!isOwned(a))return;
    const b=mode==='pvp'?pickP2:mode==='story'?storyRival(a):randomRival(a);if(!b)return;
    SFX?.play?.('menu_confirm');
    window.startFight(a,mode==='pvp'?'pvp':'ravam',b);
    try{if(fight){fight.ravamStudios=true;fight.ravamSelectionMode=mode;fight.ravamStory=mode==='story';fight.ravamStoryHero=a;fight.ravamStoryRival=b;fight.ravamStoryTitle=a==='leo'?'PORTAIS SOBRE O CREPÚSCULO':a==='kain'?'O ESPELHO SEM ROSTO':a==='aria'?'O JARDIM QUE NÃO DORME':'A CAÇADORA E O JARDIM'}}catch(_){}
  }
  window.renderRavamMode=function(){screen='ravam';drawCanvas?.();ensureEconomy();pickP1='';pickP2='';if(!hasAccess())renderLocked();else renderHub()};

  // Atualiza o cartão do menu principal sem desfazer wrappers anteriores.
  const baseModes=window.renderModes;
  if(typeof baseModes==='function')window.renderModes=function(){const r=baseModes.apply(this,arguments);setTimeout(()=>{const card=document.getElementById('mode-ravam');if(!card)return;const p=card.querySelector('p');if(p)p.textContent=hasAccess()?`Loja própria · ${unlockedIds().length}/4 Lendas desbloqueadas · Online 2P2.`:'Adquira o modo. Alana vem inclusa; Kain, Aria e Leo são comprados na Loja R.A.V.A.M.';const badge=card.querySelector('.mode-badge');if(badge)badge.textContent=hasAccess()?'R.A.V.A.M · LOJA DE LENDAS':`🟪 ${fmt(ACCESS_COST)} VANDAIS`;},0);return r};

  /* =========================
     LEO VESPER — PODERES
     ========================= */
  function opp(p,f=typeof fight!=='undefined'?fight:null){return f?(p===f.p1?f.p2:f.p1):null}
  function fighterBySlot(f,slot){return slot==='p2'?f?.p2:f?.p1}
  function leoFx(p,text,color='#7dffc6',life=.9){const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;f.leoFx=f.leoFx||[];f.leoFx.push({x:p.x,y:(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-80)-58,text,color,life,maxLife:life})}
  function leoStone(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;const target=opp(p,f);if(!target)return;
    f.leoRocks=f.leoRocks||[];f.leoPortals=f.leoPortals||[];
    const sy=(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-82)-12,dir=p.facing||1;
    const rocks=[{dy:-10,speed:760,dmg:.88},{dy:15,speed:900,dmg:.78}];
    for(let i=0;i<rocks.length;i++){
      const r=rocks[i];f.leoRocks.push({ownerSlot:p.playerSlot,targetSlot:target.playerSlot,t:0,life:1.28,phase:'straight',x:p.x+dir*(52+i*10),y:sy+r.dy,vx:dir*r.speed,vy:(i?14:-18),spin:(i?1:-1)*6.5,dmg:p.dmg*r.dmg,dead:false});
    }
    f.leoPortals.push({kind:'entry',ownerSlot:p.playerSlot,targetSlot:target.playerSlot,x:p.x+dir*62,y:sy,life:.40,maxLife:.40,color:'#53e8ad'});
    p.throwCd=p.human?.60:.78;p.leoCastT=.30;setState?.(p,'throw');leoFx(p,'PEDRAS VESPER ×2','#72f4ba',.62);try{SFX?.play?.('attack_light',.76)}catch(_){}
  }
  function leoSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;const target=opp(p,f);if(!target)return;
    f.leoRain=f.leoRain||[];f.leoPortals=f.leoPortals||[];
    const kinds=['knife','sword','rock','knife','sword','rock'];
    const offsets=[-82,-38,0,42,84,14];
    for(let i=0;i<6;i++)f.leoRain.push({ownerSlot:p.playerSlot,targetSlot:target.playerSlot,kind:kinds[i],delay:.28+i*.16,life:2.8,x:target.x+offsets[i],y:52-i*6,vy:0,offset:offsets[i],dead:false,hit:false,dmg:p.dmg*(kinds[i]==='sword'?.72:kinds[i]==='rock'?.66:.58)});
    f.leoPortals.push({kind:'sky',ownerSlot:p.playerSlot,targetSlot:target.playerSlot,x:target.x,y:64,life:2.1,maxLife:2.1,color:'#78f5c0'});
    p.specialCd=6.7;p.leoSuperT=1.25;setState?.(p,'special');leoFx(p,'CÉU VESPER','#9dffd2',1.05);try{spark(target.x,58,'#71f3bc',34)}catch(_){}
  }
  const baseThrow=window.throwProjectile;
  if(typeof baseThrow==='function')window.throwProjectile=function(p){if(p?.id==='leo'){leoStone(p);return}return baseThrow.apply(this,arguments)};
  const baseSpecial=window.castSpecial;
  if(typeof baseSpecial==='function')window.castSpecial=function(p){if(p?.id==='leo'){leoSuper(p);return}return baseSpecial.apply(this,arguments)};
  function hit(victim,amount,src,dir,type){try{return typeof damage==='function'?damage(victim,amount,src,dir,type):undefined}catch(_){}}
  function updateLeo(f,dt){
    if(!f||(!ALL_IDS.includes(f.p1?.id)&&!ALL_IDS.includes(f.p2?.id)))return;
    f.leoRocks=f.leoRocks||[];f.leoRain=f.leoRain||[];f.leoPortals=f.leoPortals||[];f.leoFx=f.leoFx||[];
    for(const q of [f.p1,f.p2])if(q?.id==='leo'){q.leoCastT=Math.max(0,(q.leoCastT||0)-dt);q.leoSuperT=Math.max(0,(q.leoSuperT||0)-dt)}
    for(const z of f.leoRocks){
      if(z.dead)continue;z.t+=dt;z.life-=dt;const owner=fighterBySlot(f,z.ownerSlot),target=fighterBySlot(f,z.targetSlot);
      z.x+=(z.vx||0)*dt;z.y+=(z.vy||0)*dt;
      if(target&&target.state!=='ko'&&Math.abs(z.x-target.x)<47&&hitboxY(target,z.y,20)){
        z.dead=true;hit(target,z.dmg,{owner,leoStone:true},(z.vx||1)>0?1:-1,'leo-stone');target.vx+=((z.vx||1)>0?1:-1)*125;try{spark(z.x,z.y,'#7dffc5',22)}catch(_){}
      }
      if(z.life<=0||z.x<-90||z.x>W+90)z.dead=true;
    }
    f.leoRocks=f.leoRocks.filter(z=>!z.dead);
    for(const d of f.leoRain){
      if(d.dead)continue;d.life-=dt;const owner=fighterBySlot(f,d.ownerSlot),target=fighterBySlot(f,d.targetSlot);if(!target||target.state==='ko'){d.dead=true;continue}d.delay-=dt;
      if(d.delay>0){d.x=target.x+d.offset;continue}
      if(!d.started){d.started=true;d.x=target.x+d.offset;d.y=62;d.vy=190}
      d.vy+=1180*dt;d.y+=d.vy*dt;
      const ty=typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-70;
      if(!d.hit&&d.y>=ty-12){d.hit=true;if(Math.abs(d.x-target.x)<58){hit(target,d.dmg,{owner,leoRain:true},target.x>=owner.x?1:-1,`leo-${d.kind}`);try{spark(d.x,ty,d.kind==='rock'?'#b9c4b5':'#b8ffe3',18)}catch(_){}}}
      if(d.y>GROUND_Y+30){d.dead=true;try{spark(d.x,GROUND_Y-3,'#5fe6ad',10)}catch(_){}}
      if(d.life<=0)d.dead=true;
    }
    f.leoRain=f.leoRain.filter(d=>!d.dead);
    for(const p of f.leoPortals){p.life-=dt;const target=fighterBySlot(f,p.targetSlot);if((p.kind==='exit'||p.kind==='sky')&&target)p.x=target.x;if(p.life<=0)p.dead=true}
    f.leoPortals=f.leoPortals.filter(p=>!p.dead);
    for(const e of f.leoFx){e.life-=dt;e.y-=20*dt}f.leoFx=f.leoFx.filter(e=>e.life>0);
  }
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){const r=baseUpdate.apply(this,arguments);if(!f?.paused)updateLeo(f,dt);return r};

  /* =========================
     ANIMAÇÃO R.A.V.A.M V17
     ========================= */
  const loadImgs=paths=>paths.map(src=>{const i=new Image();i.decoding='async';i.src=src;return i});
  const SPRITES={
    priya:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/priya/poses-v17-clean/priya-${i}.png`)),ref:654,guard:5,air:5,punch:3,kick:2,special:3},
    kain:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/kain/poses-v17-clean/kain-${i}.png`)),ref:520,guard:4,air:5,punch:3,kick:5,special:3},
    aria:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/aria/poses-v17-clean/aria-${i}.png`)),ref:132,guard:4,air:5,punch:3,kick:2,special:3},
    leo:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/leo/poses-v17-clean/leo-${i}.png`)),ref:482,guard:4,air:5,punch:3,kick:5,special:3}
  };
  function strikeInfo(p){
    const kind=p?.proMove?.kind;if(kind!=='punch'&&kind!=='kick'&&kind!=='uppercut')return null;
    const duration=Math.max(.12,Number(p.proMove?.duration)||.34),n=clamp((Number(p.proMove?.time)||0)/duration,0,1);
    if(n<.24)return {kind,phase:'windup',t:smooth(n/.24)};
    if(n<.67)return {kind,phase:'impact',t:easeOut((n-.24)/.43)};
    return {kind,phase:'recover',t:smooth((n-.67)/.33)};
  }
  function poseFor(p,s){
    const strike=strikeInfo(p);if(strike)return {frame:strike.kind==='kick'?s.kick:s.punch,strike};
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround))return {frame:s.air,ko:true};
    if(p.defend||p.state==='defend'||p.state==='crouch')return {frame:s.guard,guard:true};
    if(p.state==='special'||p.state==='throw'||(p.id==='leo'&&((p.leoCastT||0)>0||(p.leoSuperT||0)>0)))return {frame:s.special,cast:true};
    if(p.state==='hurt'||p.hitFlash>.035)return {frame:s.guard,hurt:true};
    if(!p.onGround)return {frame:s.air,air:true};
    if(Math.abs(p.vx||0)>7){
      const dist=Number(p.walkDistance||p.ravamWalkDist||0),raw=dist/28,step=Math.floor(raw)%4,frames=[1,0,2,0];
      return {frame:frames[step],walk:true,phase:raw*Math.PI*.5,step,frac:raw-Math.floor(raw)};
    }
    return {frame:0,idle:true};
  }
  function drawFixed(ctx,img,scale,alpha=1){if(!img?.complete||!img.naturalWidth)return false;ctx.globalAlpha*=alpha;const w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,-w/2,-h,w,h);return true}
  function drawR17Fighter(ctx,p){
    const s=SPRITES[p?.id];if(!s)return false;const pose=poseFor(p,s),img=s.imgs[pose.frame];if(!img?.complete||!img.naturalWidth)return false;
    const H=226,scale=H/s.ref,floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0),time=performance.now()/1000;
    const air=Math.max(0,Number(p.y)||0),sh=Math.max(.32,1-air/420);
    ctx.save();ctx.globalAlpha=.32*sh;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,GROUND_Y+4,41*sh,8*sh,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(p.x,floor);ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Mesma base de animação dos campeões: ProMotion deforma a arte em vários quadros
    // intermediários. Isso elimina a troca seca entre sprites ao andar/pular/parar.
    const motion=window.ProMotion?.motionFor?.(p);
    const locomotion=motion&&['idle','walk','jump','land'].includes(motion.kind)&&!pose.strike&&!pose.cast&&!pose.guard&&!pose.hurt&&!pose.ko;
    if(locomotion){
      const base=s.imgs[0];
      if(base?.complete&&base.naturalWidth){
        const box={sx:0,sy:0,sw:base.naturalWidth,sh:base.naturalHeight};
        try{window.ProMotion.paint(ctx,`r17-${p.id}`,base,box,motion,H);ctx.restore();return true}catch(_){}
      }
    }
    if(pose.idle){const b=Math.sin(time*2.8+(p.playerSlot==='p2'?1.2:0));ctx.translate(0,-1.8-1.2*b);ctx.scale(1+.004*b,1-.004*b)}
    if(pose.walk){const ph=pose.phase||0;ctx.translate(Math.sin(ph)*2.1,-Math.abs(Math.sin(ph))*3.0);ctx.rotate(Math.sin(ph)*.018);const push=.006*Math.cos(ph);ctx.scale(1+push,1-push)}
    if(pose.air){const vy=Number(p.vy)||0;ctx.translate(2,-4);ctx.rotate(clamp(-vy/1050,-.07,.07));const stretch=clamp(Math.abs(vy)/1800,0,.025);ctx.scale(1-stretch,1+stretch)}
    if(pose.cast){const t=clamp(Number(p.stateT)||0,0,.55)/.55,e=easeOut(t);ctx.translate(7*e,-3*e);ctx.rotate(-.03*e)}
    if(pose.strike){const {kind,phase,t}=pose.strike;if(phase==='windup'){ctx.translate(-10*t,2*t);ctx.rotate(.045*t)}else if(phase==='impact'){const amt=kind==='kick'?25:20;ctx.translate(10+amt*t,-(kind==='kick'?8:4)*t);ctx.rotate((kind==='kick'?-.11:-.075)*(1-.28*t))}else{const e=1-t;ctx.translate(9*e,-3*e);ctx.rotate(-.035*e)}}
    if(pose.guard)ctx.translate(-2,1);
    if(pose.hurt){ctx.translate(-7,1);ctx.rotate(.035)}
    if(pose.ko){ctx.translate(-12,-10);ctx.rotate(-Math.PI/2);ctx.translate(0,H*.34)}
    drawFixed(ctx,img,scale,1);
    ctx.restore();
    // Ataques ficam fluidos por transformações contínuas, sem aumentar a escala corporal.
    if(pose.strike?.phase==='impact'){
      const t=pose.strike.t||0,dir=p.facing||1;ctx.save();ctx.translate(p.x,floor-H*.48);ctx.scale(dir,1);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.65*(1-.35*t);ctx.strokeStyle=META[p.id]?.accent||'#fff';ctx.shadowColor=META[p.id]?.accent||'#fff';ctx.shadowBlur=20;ctx.lineWidth=4;
      if(pose.strike.kind==='kick'){ctx.beginPath();ctx.arc(20,20,72+18*t,-1.0,.18);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(105+24*t,0);ctx.stroke()}
      ctx.restore();
    }
    if(p.hitFlash>.035){ctx.save();ctx.strokeStyle='#fff';ctx.globalAlpha=.72;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-20,floor-H*.62-10);ctx.lineTo(p.x+20,floor-H*.62+10);ctx.stroke();ctx.restore()}
    return true;
  }
  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){if(ALL_IDS.includes(p?.id)&&drawR17Fighter(ctx,p))return;return baseDrawFighter.apply(this,arguments)};

  function drawPortal(ctx,p){
    const a=clamp(p.life/(p.maxLife||1),0,1),pulse=1+Math.sin(performance.now()/75+p.x)*.08;ctx.save();ctx.translate(p.x,p.y);ctx.scale(pulse,1);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,a*1.35);ctx.strokeStyle=p.color||'#6ff0bb';ctx.shadowColor=p.color||'#6ff0bb';ctx.shadowBlur=24;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,p.kind==='sky'?60:34,p.kind==='sky'?16:11,0,0,Math.PI*2);ctx.stroke();ctx.lineWidth=2;ctx.globalAlpha*=.7;ctx.beginPath();ctx.ellipse(0,0,p.kind==='sky'?46:24,p.kind==='sky'?11:7,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function drawLeoFx(ctx,f){
    if(!f)return;
    for(const p of (f.leoPortals||[]))drawPortal(ctx,p);
    for(const z of (f.leoRocks||[]))if(z.phase!=='portal'){
      ctx.save();ctx.translate(z.x,z.y);ctx.rotate(performance.now()/1000*(z.spin||7));ctx.fillStyle='#6f756f';ctx.strokeStyle='#b7c5b7';ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor='#67f0b6';ctx.beginPath();ctx.moveTo(-10,-8);ctx.lineTo(8,-11);ctx.lineTo(13,3);ctx.lineTo(5,11);ctx.lineTo(-11,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    for(const d of (f.leoRain||[]))if(d.delay<=0){
      ctx.save();ctx.translate(d.x,d.y);ctx.shadowBlur=16;ctx.shadowColor='#76f1ba';ctx.strokeStyle='#dfffee';ctx.fillStyle=d.kind==='rock'?'#707971':'#d8eee4';ctx.lineWidth=2;
      if(d.kind==='rock'){ctx.rotate(performance.now()/100+d.x);ctx.beginPath();ctx.moveTo(-9,-8);ctx.lineTo(8,-10);ctx.lineTo(12,5);ctx.lineTo(1,12);ctx.lineTo(-10,6);ctx.closePath();ctx.fill();ctx.stroke()}
      else if(d.kind==='knife'){ctx.beginPath();ctx.moveTo(0,14);ctx.lineTo(-5,-10);ctx.lineTo(0,-17);ctx.lineTo(5,-10);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#267a59';ctx.fillRect(-3,-22,6,7)}
      else{ctx.beginPath();ctx.moveTo(0,20);ctx.lineTo(-6,-14);ctx.lineTo(0,-24);ctx.lineTo(6,-14);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#267a59';ctx.fillRect(-4,-31,8,9)}
      ctx.restore();
    }
    for(const e of (f.leoFx||[])){const a=clamp(e.life/(e.maxLife||1),0,1);ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.font='900 13px Oxanium,Arial';ctx.fillStyle=e.color||'#7dffc6';ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillText(e.text,e.x,e.y);ctx.restore()}
  }
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const r=baseDraw.apply(this,arguments);try{drawLeoFx(canvas.getContext('2d'),f)}catch(_){}return r};

  // Kain: P1 troca no H; P2 troca no 9 (Numpad9), inclusive no online.
  // O listener antigo cobre o P1; este wrapper cobre P2 sem alterar os demais lutadores.
  const KAIN_V17_POWERS=['flight','ice','heal','shock','repel','swap','fire','teleport','drain','gravity'];
  const KAIN_V17_LABELS={flight:'VOO',ice:'GELO',heal:'RECUPERAR VIDA',shock:'CHOQUE',repel:'REPELIR ATAQUE',swap:'TROCAR CONTROLES',fire:'FOGO',teleport:'TELEPORTE',drain:'ROUBO DE VIDA',gravity:'GRAVIDADE'};
  const r17PlayerInput=window.playerInput;
  if(typeof r17PlayerInput==='function')window.playerInput=function(p){
    if(p?.id==='kain'&&p.human&&p.playerSlot==='p2'&&(window.justPressed?.Numpad9||window.justPressed?.Digit9)){
      if(window.justPressed){window.justPressed.Numpad9=false;window.justPressed.Digit9=false;}
      if(p.state!=='ko'&&(p.kainPowerSwitchCd||0)<=0){
        let i=KAIN_V17_POWERS.indexOf(p.kainSelectedPower);if(i<0)i=Number(p.kainPowerIndex)||0;
        i=(i+1)%KAIN_V17_POWERS.length;p.kainPowerIndex=i;p.kainSelectedPower=KAIN_V17_POWERS[i];p.kainPowerSwitchCd=.16;p.kainPowerFxT=Math.max(p.kainPowerFxT||0,.28);
        try{if(typeof fight!=='undefined'&&fight){fight.kainFx=fight.kainFx||[];fight.kainFx.push({x:p.x,y:(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-80)-62,text:`PODER · ${KAIN_V17_LABELS[p.kainSelectedPower]}`,color:'#d8dcff',life:.62,maxLife:.62})}}catch(_){}
      }
    }
    return r17PlayerInput.apply(this,arguments);
  };

  /* =========================
     ONLINE — CINEMÁTICA NO P2
     ========================= */
  const onlineUltActive={p1:false,p2:false};
  const ULT_NAMES={
    priya:['TRÍADE TÁTICA','TRÍADE DEMOLIDORA'],kain:['ESPELHO ABISSAL','REFLEXO DO CAOS'],aria:['JARDIM VALFLEUR','PRISÃO VERDANTE'],leo:['CÉU VESPER','CHUVA ENTRE PORTAIS']
  };
  function remoteUltimate(p,side){
    if(!p)return;const names=ULT_NAMES[p.id]||[String(p.name||'LENDA').toUpperCase(),'ULTIMATE SUPREMA'];
    const el=document.createElement('div');el.className='mega-ultimate-cine '+(side==='p2'?'right':'left')+' r17-online-ultimate';
    el.innerHTML=`<img src="ai-assets/characters/${p.id}.png" alt="${p.name||p.id}" onerror="this.style.opacity=.12"><div><small>ULTIMATE ONLINE · ${side.toUpperCase()}</small><h1>${names[0]}</h1><h2>${names[1]}</h2><span>${p.name||displayName(p.id)}</span><em>SINCRONIZADO PELO HOST</em></div>`;
    document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),180)},820);
  }
  function syncOnlineUltimate(f){
    if(!f||window.__lan?.role!=='guest')return;
    for(const side of ['p1','p2']){const p=f[side],active=!!(p?.megaUltimateCineLock||p?.megaUltimatePending);if(active&&!onlineUltActive[side])remoteUltimate(p,side);onlineUltActive[side]=active;}
  }

  // ESC -> seleção correta, preservando o modo atual. ONLINE pede ao HOST para voltar com os dois jogadores.
  const pauseSelect=document.getElementById('pause-select');
  if(pauseSelect){
    const oldPauseSelect=pauseSelect.onclick;
    pauseSelect.onclick=()=>{
      const f=typeof fight!=='undefined'?fight:null;
      document.getElementById('arena-pause')?.classList.remove('show');if(f)f.paused=false;
      if(f?.mode==='lan'&&window.LutadorOnlineV16?.backToSelect){window.LutadorOnlineV16.backToSelect();return}
      if(f&&(f.ravamStudios||ALL_IDS.includes(f.p1?.id)||ALL_IDS.includes(f.p2?.id))){
        const mode=f.ravamSelectionMode||(f.ravamStory?'story':f.mode==='pvp'?'pvp':'cpu');pickP1=f.p1?.id&&isOwned(f.p1.id)?f.p1.id:'';pickP2=mode==='pvp'&&f.p2?.id&&isOwned(f.p2.id)?f.p2.id:'';try{fight=null}catch(_){};renderSelect(mode);return;
      }
      oldPauseSelect?.();
    };
  }

  ensureEconomy();
  window.RavamV17=Object.freeze({version:VERSION,leo:LEO,renderHub,renderShop,renderSelect,isOwned,all:ALL,syncOnlineUltimate});
})();
