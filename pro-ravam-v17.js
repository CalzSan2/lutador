/* SORTEP NIAK — R.A.V.A.M V17
 * Loja de Lendas, Leo Vesper, animações fluidas e retorno correto à seleção.
 */
(()=>{
  'use strict';
  if(window.RavamV17?.version)return;
  const VERSION='18.2.0-tharoth';
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
  const THAROTH=Object.freeze({
    id:'tharoth',name:'Tharoth Umbra',color:'#8d121f',hp:2120,dmg:35,speed:84,price:0,
    weapon:'umbraSand',special:'umbraClone',portrait:'ai-assets/characters/tharoth.png',secret:true,ravamOnly:true
  });
  const ALL=Object.freeze([oldPriya,oldKain,oldAria,LEO,THAROTH]);
  const ALL_IDS=Object.freeze(ALL.map(c=>c.id));
  const COSTS=Object.freeze({priya:0,kain:700,aria:650,leo:800,tharoth:900});
  const ABILITY={
    priya:BASE.ability||{flag:'RAVAM',role:'Atiradora Tática',tag:'PRECISÃO',desc:'J dispara com o rifle. L lança a Tríade Demolidora.'},
    kain:BASE.kainAbility||{flag:'RAVAM',role:'Mímico do Caos',tag:'CAOS',desc:'J usa o poder atual. H troca o poder. L ativa o Espelho Abissal.'},
    aria:BASE.ariaAbility||{flag:'RAVAM',role:'Feiticeira Botânica',tag:'NATUREZA',desc:'J lança duas flores venenosas. L prende o rival com cipós.'},
    leo:Object.freeze({flag:'RAVAM',role:'Arquiteto de Portais',tag:'PORTAIS',desc:'J lança 2 pedras: a primeira vai reta e a segunda entra num portal e sai por trás do inimigo para acertá-lo direto. L abre o CÉU VESPER e faz cair 2 facas, 2 espadas e 2 pedras.'}),
    tharoth:Object.freeze({flag:'RAVAM',role:'Avatar da Umbra',tag:'SOMBRAS',desc:'J arremessa areia negra no inimigo. L cria 1 clone de sombra invulnerável por 3 segundos; ele surge em campo, ataca e desaparece quando o tempo acaba.'})
  };
  const META={
    priya:{name:'ALANA SORELLE',tag:'PRECISÃO',accent:'#ff765e',portrait:'ai-assets/characters/priya.png',stats:[32,82,1940],moves:[['J','RIFLE'],['I','SOCO'],['O','CHUTE'],['L','3 BOMBAS']]},
    kain:{name:'KAIN',tag:'CAOS',accent:'#c0c7ff',portrait:'ai-assets/characters/kain.png',stats:[35,88,2180],moves:[['J','USAR PODER'],['H / P2 9','TROCAR PODER'],['I','SOCO'],['O','CHUTE'],['L','ESPELHO']]},
    aria:{name:'ARIA VALFLEUR',tag:'NATUREZA',accent:'#82efa5',portrait:'ai-assets/characters/aria.png',stats:[31,86,1920],moves:[['J','2 FLORES'],['I','SOCO'],['O','CHUTE'],['L','CIPÓ']]},
    leo:{name:'LEO VESPER',tag:'PORTAIS',accent:'#67f3b8',portrait:'ai-assets/characters/leo.png',stats:[34,87,2050],moves:[['J','PEDRA + PORTAL'],['I','SOCO'],['O','CHUTE'],['L','CHUVA VESPER']]},
    tharoth:{name:'THAROTH UMBRA',tag:'SOMBRAS',accent:'#ff4d62',portrait:'ai-assets/characters/tharoth.png',stats:[35,84,2120],moves:[['J','AREIA NEGRA'],['I','SOCO'],['O','CHUTE'],['L','CLONE DE SOMBRA']]}
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
  function storyRival(id){return ({priya:'aria',aria:'kain',kain:'leo',leo:'tharoth',tharoth:'priya'})[id]||'kain'}

  // API V17: online enxerga todas as Lendas para resolver nomes, mas a seleção filtra pelo isOwned().
  try{
    const api={...BASE,version:VERSION,cost:ACCESS_COST,priya:oldPriya,kain:oldKain,aria:oldAria,leo:LEO,tharoth:THAROTH,allCharacters:ALL,isOwned,unlockedIds,displayName};
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
      if(typeof MOVES!=='undefined'&&!MOVES.leo)MOVES.leo=[['J','1 pedra reta + 1 pedra via portal'],['I','Soco Vesper'],['O','Chute Vesper'],['L','CÉU VESPER · 2 facas + 2 espadas + 2 pedras']];
    }catch(_){}
    return ()=>{try{if(added.includes('char')&&typeof CHARACTERS!=='undefined'){const i=CHARACTERS.findIndex(c=>c.id==='leo');if(i>=0)CHARACTERS.splice(i,1)}}catch(_){}};
  }
  function registerTharoth(){
    const added=[];
    try{
      if(typeof CHARACTERS!=='undefined'&&!CHARACTERS.some(c=>c.id==='tharoth')){CHARACTERS.push(THAROTH);added.push('char')}
      if(typeof ABILITIES!=='undefined'&&!ABILITIES.tharoth)ABILITIES.tharoth=ABILITY.tharoth;
      if(typeof MOVES!=='undefined'&&!MOVES.tharoth)MOVES.tharoth=[['J','AREIA NEGRA'],['I','Soco Umbra'],['O','Chute Umbra'],['L','CLONE DE SOMBRA · 3s invulnerável']];
    }catch(_){}
    return ()=>{try{if(added.includes('char')&&typeof CHARACTERS!=='undefined'){const i=CHARACTERS.findIndex(c=>c.id==='tharoth');if(i>=0)CHARACTERS.splice(i,1)}}catch(_){}};
  }
  const baseStartFight=window.startFight;
  if(typeof baseStartFight==='function')window.startFight=function(playerId,mode,player2Id,stageId,chaos){
    const needsLeo=playerId==='leo'||player2Id==='leo',needsTharoth=playerId==='tharoth'||player2Id==='tharoth',undoLeo=needsLeo?registerLeo():()=>{},undoTharoth=needsTharoth?registerTharoth():()=>{};
    let r;
    try{r=baseStartFight.apply(this,arguments)}finally{undoTharoth();undoLeo()}
    try{
      if(typeof fight!=='undefined'&&fight&&(ALL_IDS.includes(fight.p1?.id)||ALL_IDS.includes(fight.p2?.id))){
        fight.ravamStudios=true;fight.ravamVersion=VERSION;
        fight.leoRocks=Array.isArray(fight.leoRocks)?fight.leoRocks:[];
        fight.leoRain=Array.isArray(fight.leoRain)?fight.leoRain:[];
        fight.leoPortals=Array.isArray(fight.leoPortals)?fight.leoPortals:[];
        fight.leoFx=Array.isArray(fight.leoFx)?fight.leoFx:[];
        fight.tharothSands=Array.isArray(fight.tharothSands)?fight.tharothSands:[];
        fight.tharothClones=Array.isArray(fight.tharothClones)?fight.tharothClones:[];
        fight.tharothFx=Array.isArray(fight.tharothFx)?fight.tharothFx:[];
        for(const q of [fight.p1,fight.p2]){
          if(q?.id==='leo'){q.leoCastT=0;q.leoSuperT=0;}
          if(q?.id==='tharoth'){q.tharothCastT=0;q.tharothSuperT=0;}
        }
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
      <section class="ravam-pro-hero locked"><div class="ravam-copy"><small>UNIVERSO PREMIUM</small><h2>R.A.V.A.M <span>STUDIOS</span></h2><p>Adquira o acesso permanente. A primeira Lenda, Alana Sorelle, vem liberada; Kain, Aria, Leo e Tharoth ficam na Loja R.A.V.A.M.</p><div class="ravam-price">🟪 ${fmt(ACCESS_COST)} VANDAIS</div><div class="ravam-wallet-line">SALDO · 🟪 ${fmt(state?.vandais||0)}</div></div><img src="ai-assets/characters/leo.png" alt="Leo Vesper"></section>
      <section class="ravam-unlock-card"><div><small>ACESSO + 1 LENDA INICIAL</small><h3>ALANA SORELLE</h3><p>Depois da compra, desbloqueie Kain, Aria Valfleur, Leo Vesper e Tharoth Umbra individualmente na Loja R.A.V.A.M.</p></div><button id="r17-buy-access" class="btn big" ${can?'':'disabled'}>${can?'🟪 ADQUIRIR R.A.V.A.M':'VANDAIS INSUFICIENTES'}</button></section>
      <button id="r17-back" class="btn">← VOLTAR AOS MODOS</button>
    </div>`;
    const b=document.getElementById('r17-buy-access');if(b&&can)b.onclick=()=>{state.vandais=Math.max(0,(Number(state.vandais)||0)-ACCESS_COST);state.ravamModeUnlocked=true;state.ravamStoreVersion=SHOP_VERSION;state.ravamRoster=['priya'];state.ravamPurchasedAt=Date.now();save();toast('R.A.V.A.M LIBERADO · ALANA SORELLE DISPONÍVEL','reward',2800);renderHub()};
    document.getElementById('r17-back').onclick=()=>window.renderModes?.();
  }
  function renderHub(){
    ensureEconomy();const a=appNode();if(!a)return;
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen ravam-v15 r17-screen">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>R.A.V.A.M STUDIOS · V17</small><h2>ESCOLHA O <span>MODO</span></h2><p>Monte a luta, compre novas Lendas e entre na arena.</p></div><div class="ravam-head-wallet"><span>CARTEIRA</span><b>🟪 ${fmt(state?.vandais||0)}</b><small>VANDAIS</small></div></section>
      <section class="r17-showcase"><div><small>5 LENDAS · ${unlockedIds().length} DESBLOQUEADA(S)</small><h3>ALANA · KAIN · ARIA · LEO · <b>THAROTH</b></h3><p>Precisão, caos, natureza, portais e sombras. Lendas bloqueadas precisam ser compradas na Loja R.A.V.A.M.</p></div><div class="r17-art-stack"><img src="ai-assets/characters/priya.png" alt="Alana"><img src="ai-assets/characters/kain.png" alt="Kain"><img src="ai-assets/characters/aria.png" alt="Aria"><img src="ai-assets/characters/leo.png" alt="Leo"></div></section>
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
    try{if(fight){fight.ravamStudios=true;fight.ravamSelectionMode=mode;fight.ravamStory=mode==='story';fight.ravamStoryHero=a;fight.ravamStoryRival=b;fight.ravamStoryTitle=a==='leo'?'PORTAIS SOBRE O CREPÚSCULO':a==='kain'?'O ESPELHO SEM ROSTO':a==='aria'?'O JARDIM QUE NÃO DORME':a==='tharoth'?'ECO DA SOMBRA IMORTAL':'A CAÇADORA E O JARDIM'}}catch(_){}
  }
  window.renderRavamMode=function(){screen='ravam';drawCanvas?.();ensureEconomy();pickP1='';pickP2='';if(!hasAccess())renderLocked();else renderHub()};

  // Atualiza o cartão do menu principal sem desfazer wrappers anteriores.
  const baseModes=window.renderModes;
  if(typeof baseModes==='function')window.renderModes=function(){const r=baseModes.apply(this,arguments);setTimeout(()=>{const card=document.getElementById('mode-ravam');if(!card)return;const p=card.querySelector('p');if(p)p.textContent=hasAccess()?`Loja própria · ${unlockedIds().length}/5 Lendas desbloqueadas · Online 2P2 + 5ª Lenda.`:'Adquira o modo. Alana e Tharoth vêm inclusos; Kain, Aria, Leo e Tharoth são comprados na Loja R.A.V.A.M.';const badge=card.querySelector('.mode-badge');if(badge)badge.textContent=hasAccess()?'R.A.V.A.M · LOJA DE LENDAS':`🟪 ${fmt(ACCESS_COST)} VANDAIS`;},0);return r};

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
    // Pedra 1: projétil normal, sempre em linha reta.
    f.leoRocks.push({ownerSlot:p.playerSlot,targetSlot:target.playerSlot,t:0,life:1.45,phase:'straight',x:p.x+dir*56,y:sy-10,vx:dir*820,vy:-10,spin:-6.5,dmg:p.dmg*.88,hitDir:dir,dead:false});

    // Pedra 2: entra no portal à frente do Leo e sai por trás do inimigo
    // usando a posição travada do rival no momento do disparo para pegar direto.
    const entryX=p.x+dir*154;
    const lockedTargetX=clamp(target.x,42,W-42);
    const targetBody=(typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-70);
    const exitX=clamp(lockedTargetX+dir*94,42,W-42);
    const exitY=Math.max(84,targetBody-18);
    f.leoPortals.push({kind:'entry',ownerSlot:p.playerSlot,targetSlot:target.playerSlot,x:entryX,y:sy+14,life:.62,maxLife:.62,color:'#53e8ad',trackTarget:false});
    f.leoRocks.push({ownerSlot:p.playerSlot,targetSlot:target.playerSlot,t:0,life:2.1,phase:'toPortal',x:p.x+dir*64,y:sy+14,vx:dir*760,vy:0,spin:6.8,dmg:p.dmg*.86,hitDir:-dir,entryX,lockedTargetX,exitX,exitY,dashDir:-dir,portalDelay:0,dead:false});

    p.throwCd=p.human?.60:.78;p.leoCastT=.34;setState?.(p,'throw');leoFx(p,'PEDRA RETA + PORTAL','#72f4ba',.72);try{SFX?.play?.('attack_light',.76)}catch(_){}
  }
  function leoSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;const target=opp(p,f);if(!target)return;
    f.leoRain=f.leoRain||[];f.leoPortals=f.leoPortals||[];
    const kinds=['knife','sword','rock','knife','sword','rock'];
    const offsets=[-82,-38,0,42,84,14];
    for(let i=0;i<6;i++)f.leoRain.push({ownerSlot:p.playerSlot,targetSlot:target.playerSlot,kind:kinds[i],delay:.28+i*.16,life:2.8,x:target.x+offsets[i],y:52-i*6,vy:0,offset:offsets[i],dead:false,hit:false,dmg:p.dmg*(kinds[i]==='sword'?.72:kinds[i]==='rock'?.66:.58)});
    f.leoPortals.push({kind:'sky',ownerSlot:p.playerSlot,targetSlot:target.playerSlot,x:target.x,y:64,life:2.1,maxLife:2.1,color:'#78f5c0',trackTarget:true});
    p.specialCd=6.7;p.leoSuperT=1.25;setState?.(p,'special');leoFx(p,'CÉU VESPER','#9dffd2',1.05);try{spark(target.x,58,'#71f3bc',34)}catch(_){}
  }
  function tharothFx(p,text,color='#ff5a6a',life=.92){const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;f.tharothFx=f.tharothFx||[];f.tharothFx.push({x:p.x,y:(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-80)-60,text,color,life,maxLife:life})}
  function tharothSand(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;const target=opp(p,f);if(!target)return;
    f.tharothSands=f.tharothSands||[];
    const sy=(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-82)-10,dir=p.facing||1;
    const tx=target.x,ty=(typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-72)-4;
    const startX=p.x+dir*52,dx=tx-startX,dy=ty-sy,len=Math.max(1,Math.hypot(dx,dy));
    f.tharothSands.push({ownerSlot:p.playerSlot,targetSlot:target.playerSlot,x:startX,y:sy,vx:dx/len*760,vy:dy/len*760,life:1.0,dmg:p.dmg*.84,spin:0,dead:false});
    p.throwCd=p.human?.58:.72;p.tharothCastT=.26;setState?.(p,'throw');tharothFx(p,'AREIA NEGRA','#ff6b79',.78);try{SFX?.play?.('attack_light',.72)}catch(_){ }
  }
  function tharothClone(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;const target=opp(p,f);if(!target)return;
    f.tharothClones=f.tharothClones||[];
    const dir=(target.x>=p.x?1:-1),cloneX=clamp(target.x+dir*86,32,W-32);
    f.tharothClones.push({ownerSlot:p.playerSlot,targetSlot:target.playerSlot,x:cloneX,life:3,maxLife:3,delay:.36,pulse:0,struck:false,dead:false,dir:-dir});
    p.specialCd=6.6;p.tharothSuperT=1.05;setState?.(p,'special');tharothFx(p,'CLONE DE SOMBRA','#ff7d88',.96);try{spark(cloneX,GROUND_Y-8,'#ff4f62',26)}catch(_){ }
  }

  const baseThrow=window.throwProjectile;
  if(typeof baseThrow==='function')window.throwProjectile=function(p){if(p?.id==='leo'){leoStone(p);return}if(p?.id==='tharoth'){tharothSand(p);return}return baseThrow.apply(this,arguments)};
  const baseSpecial=window.castSpecial;
  if(typeof baseSpecial==='function')window.castSpecial=function(p){if(p?.id==='leo'){leoSuper(p);return}if(p?.id==='tharoth'){tharothClone(p);return}return baseSpecial.apply(this,arguments)};
  function hit(victim,amount,src,dir,type){try{return typeof damage==='function'?damage(victim,amount,src,dir,type):undefined}catch(_){}}
  function updateLeo(f,dt){
    if(!f||(!ALL_IDS.includes(f.p1?.id)&&!ALL_IDS.includes(f.p2?.id)))return;
    f.leoRocks=f.leoRocks||[];f.leoRain=f.leoRain||[];f.leoPortals=f.leoPortals||[];f.leoFx=f.leoFx||[];
    f.tharothSands=f.tharothSands||[];f.tharothClones=f.tharothClones||[];f.tharothFx=f.tharothFx||[];
    for(const q of [f.p1,f.p2]){
      if(q?.id==='leo'){q.leoCastT=Math.max(0,(q.leoCastT||0)-dt);q.leoSuperT=Math.max(0,(q.leoSuperT||0)-dt)}
      if(q?.id==='tharoth'){q.tharothCastT=Math.max(0,(q.tharothCastT||0)-dt);q.tharothSuperT=Math.max(0,(q.tharothSuperT||0)-dt)}
    }
    for(const z of f.leoRocks){
      if(z.dead)continue;z.t+=dt;z.life-=dt;const owner=fighterBySlot(f,z.ownerSlot),target=fighterBySlot(f,z.targetSlot);
      if(z.phase==='toPortal'){
        z.x+=(z.vx||0)*dt;
        const reached=(z.vx>=0&&z.x>=z.entryX)||(z.vx<0&&z.x<=z.entryX);
        if(reached){z.x=z.entryX;z.vx=0;z.vy=0;z.phase='portal';z.portalDelay=.085;f.leoPortals.push({kind:'exit',ownerSlot:z.ownerSlot,targetSlot:z.targetSlot,x:z.exitX,y:z.exitY,life:.64,maxLife:.64,color:'#74f6bd',trackTarget:false});try{spark(z.entryX,z.y,'#6ff0bb',14);spark(z.exitX,z.exitY,'#86ffd0',16)}catch(_){ }}
      }else if(z.phase==='portal'){
        z.portalDelay-=dt;if(z.portalDelay<=0){z.phase='dash';z.x=z.exitX;z.y=z.exitY;z.vx=(z.dashDir||1)*960;z.vy=0;z.spin=8.2;}
      }else{z.x+=(z.vx||0)*dt;z.y+=(z.vy||0)*dt;}
      if(z.phase!=='portal'&&target&&target.state!=='ko'&&Math.abs(z.x-target.x)<47&&hitboxY(target,z.y,20)){const hdir=z.hitDir||((z.vx||1)>0?1:-1);z.dead=true;hit(target,z.dmg,{owner,leoStone:true,fromPortal:z.phase==='dash'},hdir,'leo-stone');target.vx+=hdir*(z.phase==='dash'?145:125);try{spark(z.x,z.y,'#7dffc5',22)}catch(_){ }}
      if(z.life<=0)z.dead=true;if(z.phase!=='portal'&&(z.x<-90||z.x>W+90))z.dead=true;
    }
    f.leoRocks=f.leoRocks.filter(z=>!z.dead);
    for(const d of f.leoRain){if(d.dead)continue;d.life-=dt;const owner=fighterBySlot(f,d.ownerSlot),target=fighterBySlot(f,d.targetSlot);if(!target||target.state==='ko'){d.dead=true;continue}d.delay-=dt;if(d.delay>0){d.x=target.x+d.offset;continue}if(!d.started){d.started=true;d.x=target.x+d.offset;d.y=62;d.vy=190}d.vy+=1180*dt;d.y+=d.vy*dt;const ty=typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-70;if(!d.hit&&d.y>=ty-12){d.hit=true;if(Math.abs(d.x-target.x)<58){hit(target,d.dmg,{owner,leoRain:true},target.x>=owner.x?1:-1,`leo-${d.kind}`);try{spark(d.x,ty,d.kind==='rock'?'#b9c4b5':'#b8ffe3',18)}catch(_){}}}if(d.y>GROUND_Y+30){d.dead=true;try{spark(d.x,GROUND_Y-3,'#5fe6ad',10)}catch(_){}}if(d.life<=0)d.dead=true;}
    f.leoRain=f.leoRain.filter(d=>!d.dead);
    for(const p of f.leoPortals){p.life-=dt;const target=fighterBySlot(f,p.targetSlot);if(p.trackTarget&&(p.kind==='exit'||p.kind==='sky')&&target)p.x=target.x;if(p.life<=0)p.dead=true}
    f.leoPortals=f.leoPortals.filter(p=>!p.dead);
    for(const e of f.leoFx){e.life-=dt;e.y-=20*dt}f.leoFx=f.leoFx.filter(e=>e.life>0);
    for(const s of f.tharothSands){
      if(s.dead)continue;s.life-=dt;s.x+=(s.vx||0)*dt;s.y+=(s.vy||0)*dt;s.spin=(s.spin||0)+dt*8;
      const owner=fighterBySlot(f,s.ownerSlot),target=fighterBySlot(f,s.targetSlot);
      if(target&&target.state!=='ko'&&Math.abs(s.x-target.x)<48&&hitboxY(target,s.y,20)){s.dead=true;hit(target,s.dmg,{owner,tharothSand:true},(s.vx||1)>0?1:-1,'tharoth-sand');target.vx+=((s.vx||1)>0?1:-1)*95;try{spark(s.x,s.y,'#ff596b',18)}catch(_){ }}
      if(s.life<=0||s.x<-90||s.x>W+90||s.y<20||s.y>GROUND_Y+40)s.dead=true;
    }
    f.tharothSands=f.tharothSands.filter(s=>!s.dead);
    for(const c of f.tharothClones){
      if(c.dead)continue;c.life-=dt;c.pulse=(c.pulse||0)+dt;c.delay-=dt;const owner=fighterBySlot(f,c.ownerSlot),target=fighterBySlot(f,c.targetSlot);
      if(target&&target.state!=='ko'){c.targetX=target.x;c.dir=-(target.x>=owner?.x?1:-1);}if(!c.struck&&c.delay<=0&&target&&target.state!=='ko'){c.struck=true;if(Math.abs(c.x-target.x)<132){hit(target,(owner?.dmg||35)*1.08,{owner,tharothClone:true},c.dir,'tharoth-clone');target.vx+=c.dir*160;try{spark(target.x,(typeof bodyY==='function'?bodyY(target):GROUND_Y-target.y-70)-8,'#ff4f62',24)}catch(_){ }}}if(c.life<=0)c.dead=true;
    }
    f.tharothClones=f.tharothClones.filter(c=>!c.dead);
    for(const e of f.tharothFx){e.life-=dt;e.y-=18*dt}f.tharothFx=f.tharothFx.filter(e=>e.life>0);
  }
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){const r=baseUpdate.apply(this,arguments);if(!f?.paused){updateLeo(f,dt);}return r};
  /* =========================
     ANIMAÇÃO R.A.V.A.M V17
     ========================= */
  const loadImgs=paths=>paths.map(src=>{const i=new Image();i.decoding='async';i.src=src;return i});
  const SPRITES={
    priya:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/priya/poses-v17-clean/priya-${i}.png`)),ref:654,guard:5,air:5,punch:3,kick:2,special:3},
    kain:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/kain/poses-v17-clean/kain-${i}.png`)),ref:520,guard:4,air:5,punch:3,kick:5,special:3},
    aria:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/aria/poses-v17-clean/aria-${i}.png`)),ref:132,guard:4,air:5,punch:3,kick:2,special:3},
    leo:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/leo/poses-v17-clean/leo-${i}.png`)),ref:482,guard:4,air:5,punch:3,kick:5,special:3},
    tharoth:{imgs:loadImgs(Array.from({length:6},(_,i)=>`ai-assets/ravam/tharoth/poses-v17-clean/tharoth-${i}.png`)),ref:512,guard:4,air:5,punch:3,kick:5,special:3}
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
    if(p.state==='special'||p.state==='throw'||(p.id==='leo'&&((p.leoCastT||0)>0||(p.leoSuperT||0)>0))||(p.id==='tharoth'&&((p.tharothCastT||0)>0||(p.tharothSuperT||0)>0)))return {frame:s.special,cast:true};
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
  function drawTharothClone(ctx,c){
    const s=SPRITES.tharoth;if(!s)return;const img=s.imgs[c.struck?3:0];if(!img?.complete||!img.naturalWidth)return;
    const H=226,scale=H/s.ref,floor=GROUND_Y,pulse=1+Math.sin(performance.now()/120+(c.pulse||0))*0.035;
    ctx.save();ctx.translate(c.x,floor);ctx.scale(c.dir||1,1);ctx.globalAlpha=(c.life<.4?c.life/.4:.38)+.10*Math.sin(performance.now()/170);ctx.globalCompositeOperation='lighter';ctx.shadowBlur=26;ctx.shadowColor='#ff4f62';ctx.filter='brightness(1.08) saturate(0.6)';ctx.scale(pulse,pulse);drawFixed(ctx,img,scale,.78);ctx.restore();
  }
  function drawTharothFx(ctx,f){
    if(!f)return;
    for(const s of (f.tharothSands||[])){
      ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.spin||0);ctx.globalCompositeOperation='lighter';ctx.shadowBlur=18;ctx.shadowColor='#ff4f62';ctx.fillStyle='#19080d';ctx.strokeStyle='#ff6776';ctx.lineWidth=2;
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*8,Math.sin(a)*5,4.2,0,Math.PI*2);ctx.fill();}
      ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
    }
    for(const c of (f.tharothClones||[]))drawTharothClone(ctx,c);
    for(const e of (f.tharothFx||[])){const a=clamp(e.life/(e.maxLife||1),0,1);ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.font='900 13px Oxanium,Arial';ctx.fillStyle=e.color||'#ff596b';ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillText(e.text,e.x,e.y);ctx.restore();}
  }
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const r=baseDraw.apply(this,arguments);try{const ctx=canvas.getContext('2d');drawLeoFx(ctx,f);drawTharothFx(ctx,f)}catch(_){}return r};

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
    priya:['TRÍADE TÁTICA','TRÍADE DEMOLIDORA'],kain:['ESPELHO ABISSAL','REFLEXO DO CAOS'],aria:['JARDIM VALFLEUR','PRISÃO VERDANTE'],leo:['CÉU VESPER','CHUVA ENTRE PORTAIS'],tharoth:['UMBRA ETERNA','CLONE DE SOMBRA']
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
  window.RavamV17=Object.freeze({version:VERSION,leo:LEO,tharoth:THAROTH,renderHub,renderShop,renderSelect,isOwned,all:ALL,syncOnlineUltimate});
})();


/* ===== KTRAK CALZSAN / AVATAR PATCH ===== */
(()=>{
  'use strict';
  const KTRAK = Object.freeze({
    id:'ktrak',name:'Ktrak Calzsan',color:'#ff7d28',hp:2060,dmg:33,speed:85,price:0,
    weapon:'ktrakElement',special:'ktrakAvatarMode',portrait:'ai-assets/characters/ktrak.png',secret:true
  });
  const KTRAK_META = Object.freeze({
    name:'KTRAK CALZSAN',tag:'AVATAR',accent:'#61bcff',portrait:'ai-assets/characters/ktrak.png',
    stats:[33,85,2060],
    moves:[['J','PODER ELEMENTAL'],['H / P2 9','ALTERNA ÁGUA · TERRA · FOGO · AR'],['I','SOCO'],['O','CHUTE'],['L','MODO AVATAR · 5s']]
  });
  const oldRenderRavamMode = window.renderRavamMode;
  const KTRAK_ABILITY = Object.freeze({
    flag:'ELM',role:'Mestre dos 4 Elementos',tag:'AVATAR',
    desc:'J lança o elemento atual. H alterna entre Água, Terra, Fogo e Ar. Água congela por 1 segundo, Terra derruba uma grande rocha por cima, Fogo causa queimadura progressiva por 1 segundo e Ar empurra causando dano. L ativa o Modo Avatar por 5 segundos, dobrando o dano dos ataques e deixando os olhos azuis brilhantes.'
  });
  const ELS=[
    {id:'water',name:'ÁGUA',accent:'#5ecbff'},
    {id:'earth',name:'TERRA',accent:'#d8a46a'},
    {id:'fire',name:'FOGO',accent:'#ff7f32'},
    {id:'air',name:'AR',accent:'#d6f1ff'}
  ];
  const KSPR={
    imgs:Array.from({length:6},(_,i)=>{const im=new Image();im.decoding='async';im.src=`ai-assets/ravam/ktrak/poses-v17-clean/ktrak-${i}.png`;return im}),
    ref:590,guard:4,air:5,punch:2,kick:5,special:2
  };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const save=()=>{try{typeof persist==='function'?persist():saveState?.(state)}catch(_){}};
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');
  function ensureRegistered(){
    try{ if(typeof CHARACTERS!=='undefined' && !CHARACTERS.some(c=>c.id==='ktrak')) CHARACTERS.push({...KTRAK}); }catch(_){}
    try{ if(typeof ABILITIES!=='undefined') ABILITIES.ktrak = KTRAK_ABILITY; }catch(_){}
    try{ if(typeof MOVES!=='undefined') MOVES.ktrak = KTRAK_META.moves.map(x=>[x[0],x[1]]); }catch(_){}
    try{ if(typeof state!=='undefined' && !Array.isArray(state.ravamRoster)) state.ravamRoster=[]; }catch(_){}
  }
  ensureRegistered();

  function ktrakElementIndex(p){
    if(typeof p.ktrakElementIndex!=='number') p.ktrakElementIndex=0;
    return p.ktrakElementIndex;
  }
  function ktrakElement(p){ return ELS[ktrakElementIndex(p)%ELS.length]; }
  function ktrakFx(p,text,color,life=.9){
    try{
      const f=typeof fight!=='undefined'?fight:null; if(!f||!p) return;
      f.ktrakFx=f.ktrakFx||[];
      f.ktrakFx.push({x:p.x,y:(typeof bodyY==='function'?bodyY(p):GROUND_Y-(p.y||0)-76)-58,text,color,life,maxLife:life});
    }catch(_){}
  }
  function toggleKtrakElement(p){
    if(!p || p.id!=='ktrak') return;
    p.ktrakElementIndex=(ktrakElementIndex(p)+1)%ELS.length;
    const el=ktrakElement(p);
    p.ktrakSwapCd=.18;
    ktrakFx(p,el.name,el.accent,.82);
    try{SFX?.play?.('menu_select',.84)}catch(_){ }
  }

  // ===== códigos =====
  const oldRenderCodes = typeof renderCodes==='function' ? renderCodes : null;
  renderCodes = function(){
    screen = 'codes';
    try{ drawCanvas(); }catch(_){}
    app.innerHTML = `
      <div class="card mk-card mk-arena codes-screen">
        <div class="emblem"><span>🔐</span></div>
        <h2 class="select-title mk-title">CÓDIGOS <span class="mk-accent">SECRETOS</span></h2>
        <p class="select-subtitle">Digite um código para liberar recursos e personagens especiais.</p>
        <div style="max-width:470px;margin:24px auto">
          <input id="code-input" class="code-input" maxlength="24" autocomplete="off" placeholder="Digite o código...">
          <button id="btn-code-submit" class="btn big" style="margin-top:12px">DESBLOQUEAR</button>
          <div id="code-status" style="margin-top:14px;min-height:24px;font-weight:700"></div>
        </div>
        <div class="v6-code-hint"><b>CÓDIGOS ATIVOS</b><span>00011 · liberar todos os campeões</span><span>121200 · 99.999 Gold</span><span>01010101 · 99.999 Vandais</span><span>96051 · liberar KTRAK CALZSAN (Normal + R.A.V.A.M)</span></div>
        <button id="btn-back" class="btn">Voltar</button>
      </div>`;
    const input=document.getElementById('code-input'), status=document.getElementById('code-status');
    const submit=()=>{
      const code=input.value.trim();
      if(!code){status.textContent='❌ Digite um código.';status.style.color='#f87171';return;}
      if(code==='00011'){
        CHARACTERS.forEach(c=>{if(c.ravamOnly)return;if(!state.roster.includes(c.id))state.roster.push(c.id);});
        state.ztaaaUnlocked=true;state.froghUnlocked=true;state.kloppUnlocked=true;
        status.textContent='🔓 TODOS OS CAMPEÕES FORAM LIBERADOS!';status.style.color='#7dd3fc';
      }else if(code==='121200'){
        state.coins=Math.max(Number(state.coins)||0,99999);
        status.textContent='💰 99.999 GOLD LIBERADO!';status.style.color='#facc15';
      }else if(code==='01010101'){
        state.vandais=Math.max(Number(state.vandais)||0,99999);
        status.textContent='🟪 99.999 VANDAIS LIBERADOS!';status.style.color='#d8b4fe';
      }else if(code==='96051'){
        ensureRegistered();
        if(!Array.isArray(state.roster)) state.roster=[];
        if(!Array.isArray(state.ravamRoster)) state.ravamRoster=[];
        if(!state.roster.includes('ktrak')) state.roster.push('ktrak');
        if(!state.ravamRoster.includes('ktrak')) state.ravamRoster.push('ktrak');
        status.textContent='🌊⛰🔥💨 KTRAK CALZSAN LIBERADO NO MODO NORMAL E NO R.A.V.A.M!';status.style.color='#7dd3fc';
      }else{
        status.textContent='❌ Código inválido.';status.style.color='#f87171';try{SFX.play('menu_select');}catch(_){} return;
      }
      if(!Array.isArray(state.redeemedCodes))state.redeemedCodes=[];
      if(!state.redeemedCodes.includes(code))state.redeemedCodes.push(code);
      save(); try{SFX.play('menu_confirm');}catch(_){}
    };
    document.getElementById('btn-code-submit').onclick=submit;
    input.addEventListener('keydown',e=>{if(e.key==='Enter')submit();});
    document.getElementById('btn-back').onclick=renderMenu; input.focus();
  };

  // ===== UI RAVAM custom =====
  function ravamCharList(){
    const base=window.RavamStudios||{};
    const ids=['priya','kain','aria','leo','tharoth'];
    const arr=[];
    for(const id of ids){ if(base[id]) arr.push(base[id]); }
    if(!arr.some(c=>c.id==='ktrak')) arr.push({...KTRAK,ravamOnly:true});
    return arr;
  }
  function ravamMetaMap(){
    const base=window.RavamStudios||{};
    return {
      priya:{name:'ALANA SORELLE',tag:'PRECISÃO',accent:'#ff765e',portrait:'ai-assets/characters/priya.png',stats:[32,82,1940],moves:[['J','RIFLE'],['I','SOCO'],['O','CHUTE'],['L','3 BOMBAS']]},
      kain:{name:'KAIN',tag:'CAOS',accent:'#c0c7ff',portrait:'ai-assets/characters/kain.png',stats:[35,88,2180],moves:[['J','USAR PODER'],['H / P2 9','TROCAR PODER'],['I','SOCO'],['O','CHUTE'],['L','ESPELHO']]},
      aria:{name:'ARIA VALFLEUR',tag:'NATUREZA',accent:'#82efa5',portrait:'ai-assets/characters/aria.png',stats:[31,86,1920],moves:[['J','NATUREZA'],['I','SOCO'],['O','CHUTE'],['L','CIPÓS']]},
      leo:{name:'LEO VESPER',tag:'PORTAIS',accent:'#67f3b8',portrait:'ai-assets/characters/leo.png',stats:[34,87,2050],moves:[['J','PEDRAS + PORTAL'],['I','SOCO'],['O','CHUTE'],['L','CHUVA DE ARMAS']]},
      tharoth:{name:'THAROTH UMBRA',tag:'SOMBRAS',accent:'#ff4d62',portrait:'ai-assets/characters/tharoth.png',stats:[35,84,2120],moves:[['J','AREIA NEGRA'],['I','SOCO'],['O','CHUTE'],['L','CLONE DE SOMBRA']]},
      ktrak:KTRAK_META
    };
  }
  function ensureRavamEconomy(){
    try{
      if(typeof state==='undefined') return;
      if(!Array.isArray(state.ravamRoster)) state.ravamRoster=[];
      if(state.ravamModeUnlocked && !state.ravamRoster.includes('priya')) state.ravamRoster.unshift('priya');
      state.ravamRoster=[...new Set(state.ravamRoster)];
    }catch(_){ }
  }
  function rHasAccess(){ try{return !!state?.ravamModeUnlocked}catch(_){return false} }
  function rIsOwned(id){ ensureRavamEconomy(); try{return !!state?.ravamModeUnlocked && state.ravamRoster.includes(id)}catch(_){return false} }
  function rDisplay(id){ const m=ravamMetaMap()[id]; return m?.name || String(id||'').toUpperCase(); }
  function rRandomRival(id){ const pool=ravamCharList().map(c=>c.id).filter(x=>x!==id); return pool[Math.floor(Math.random()*pool.length)]||'kain'; }
  function rStoryRival(id){ return ({priya:'aria',aria:'kain',kain:'leo',leo:'tharoth',tharoth:'ktrak',ktrak:'priya'})[id] || 'kain'; }
  let rPick1='', rPick2='', rMode='cpu';
  function rLegendCard(id, selected=false, slot=''){
    const meta=ravamMetaMap()[id]||KTRAK_META; const owned=rIsOwned(id); const char=ravamCharList().find(c=>c.id===id)||KTRAK;
    const moves=(meta.moves||[]).slice(0,5).map(([k,t])=>`<span><kbd>${k}</kbd>${t}</span>`).join('');
    const badge = owned ? (slot?`<b class="r17-slot-badge">${slot}</b>`:'<b class="r17-slot-badge">✓</b>') : '<b class="r17-slot-badge">🔒</b>';
    return `<button class="ravam-legend-card ${id} ${selected?'selected':''} ${owned?'owned':'locked'}" data-r18-char="${id}" aria-pressed="${selected}">
      <div class="ravam-portrait"><img src="${meta.portrait}" alt="${meta.name}">${badge}</div>
      <div class="ravam-legend-meta"><small>${meta.tag}</small><h3>${meta.name}</h3><p>${(ABILITIES[id]?.desc)||(window.RavamStudios?.[id+'Ability']?.desc)||KTRAK_ABILITY.desc}</p></div>
      <div class="ravam-legend-stats"><span><b>${meta.stats[0]}</b>DANO</span><span><b>${meta.stats[1]}</b>AGIL</span><span><b>${meta.stats[2]}</b>VIDA</span></div>
      <div class="ravam-legend-moves">${moves}</div>
      <div class="ravam-legend-foot">${owned?'PRONTO PARA LUTAR':'LENDA BLOQUEADA'}</div>
    </button>`;
  }
  function patchRavamObject(){
    const prev=window.RavamStudios||{};
    const chars=ravamCharList();
    const lookup=Object.fromEntries(chars.map(c=>[c.id,c]));
    const api={...prev,...lookup,version:(prev.version||'18.2.0')+'-ktrak',allCharacters:chars,all:chars,cost:prev.cost||2500,
      isOwned:rIsOwned,unlockedIds:()=>{ensureRavamEconomy(); return (state?.ravamRoster||[]).filter(id=>chars.some(c=>c.id===id));},
      displayName:rDisplay,
      render:()=>window.renderRavamMode?.(),
      openShop:()=>renderKtrakRavamShop()};
    Object.defineProperty(api,'characters',{enumerable:true,get:()=>chars});
    window.RavamStudios=api;
    window.RavamV17={...(window.RavamV17||{}),ktrak:KTRAK,all:chars,renderHub:renderKtrakRavamHub,renderShop:renderKtrakRavamShop,renderSelect:renderKtrakRavamSelect};
  }
  function renderKtrakRavamHub(){
    patchRavamObject(); ensureRavamEconomy(); screen='ravam'; try{drawCanvas();}catch(_){}
    const a=document.getElementById('app'); if(!a) return;
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen r17-screen ravam-panel">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>R.A.V.A.M STUDIOS</small><h2>ESCOLHA O <span>MODO</span></h2><p>Agora com Ktrak Calzsan no elenco e código 96051 para desbloqueio.</p></div><div class="ravam-head-wallet"><span>LENDA(S)</span><b>${(state?.ravamRoster||[]).length}/6</b><small>DESBLOQUEADAS</small></div></section>
      <section class="r17-battle-grid">
        <button id="r18-cpu" class="ravam-battle-card cpu"><span class="ravam-battle-icon">⚔</span><small>SOLO</small><h3>1P<b>×CPU</b></h3><p>Escolha sua Lenda e enfrente a CPU.</p><em>SELECIONAR →</em></button>
        <button id="r18-pvp" class="ravam-battle-card pvp"><span class="ravam-battle-icon">◎</span><small>DUELO LOCAL</small><h3>1P<b>×2P</b></h3><p>Escolha P1 e depois P2.</p><em>SELECIONAR →</em></button>
        <button id="r18-story" class="ravam-battle-card story"><span class="ravam-battle-icon">✦</span><small>CAPÍTULO</small><h3>MODO <b>HISTÓRIA</b></h3><p>Escolha um protagonista e lute num capítulo próprio.</p><em>SELECIONAR →</em></button>
        <button id="r18-online" class="ravam-battle-card online"><span class="ravam-battle-icon">◎</span><small>INTERNET</small><h3>ONLINE <b>2P2</b></h3><p>Crie ou entre numa sala online com a seleção R.A.V.A.M.</p><em>CRIAR / ENTRAR →</em></button>
      </section>
      <div class="r17-hub-actions"><button id="r18-shop" class="btn big r17-shop-btn">🛒 LOJA R.A.V.A.M</button><button id="r18-back" class="btn">← VOLTAR AOS MODOS</button></div>
    </div>`;
    document.getElementById('r18-cpu').onclick=()=>renderKtrakRavamSelect('cpu');
    document.getElementById('r18-pvp').onclick=()=>renderKtrakRavamSelect('pvp');
    document.getElementById('r18-story').onclick=()=>renderKtrakRavamSelect('story');
    document.getElementById('r18-shop').onclick=renderKtrakRavamShop;
    document.getElementById('r18-online').onclick=()=>{const net=window.LutadorOnlineV16; try{SFX?.play?.('menu_confirm')}catch(_){} if(net?.openRavam)net.openRavam(); else alert('Modo online indisponível.');};
    document.getElementById('r18-back').onclick=()=>window.renderModes?.();
  }
  function renderKtrakRavamShop(){
    patchRavamObject(); ensureRavamEconomy(); screen='ravam'; try{drawCanvas();}catch(_){}
    const a=document.getElementById('app'); if(!a) return;
    const chars=ravamCharList(), meta=ravamMetaMap();
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen r17-screen r17-shop-screen">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>COLEÇÃO R.A.V.A.M</small><h2>LOJA DE <span>LENDAS</span></h2><p>Ktrak Calzsan é liberado com o código <b>96051</b>.</p></div><div class="ravam-head-wallet"><span>SALDO</span><b>🟪 ${fmt(state?.vandais||0)}</b><small>VANDAIS</small></div></section>
      <div class="r17-shop-grid">${chars.map(c=>{const id=c.id,m=meta[id]||KTRAK_META,owned=rIsOwned(id),cost=id==='priya'?0:(id==='ktrak'?96051:({kain:700,aria:650,leo:800,tharoth:900}[id]||0));
        let btn='';
        if(id==='priya') btn='<button class="btn" disabled>LENDA INICIAL</button>';
        else if(id==='ktrak' && !owned) btn='<button class="btn" disabled>🔐 USE O CÓDIGO 96051</button>';
        else if(owned) btn='<button class="btn" disabled>✓ DESBLOQUEADA</button>';
        else btn=`<button class="btn big r18-buy-legend" data-id="${id}" ${Number(state?.vandais||0)>=cost?'':'disabled'}>🟪 COMPRAR · ${fmt(cost)}</button>`;
        return `<article class="r17-shop-card ${id} ${owned?'owned':'locked'}"><div class="r17-shop-art"><img src="${m.portrait}" alt="${m.name}"><span>${owned?'✓ SUA LENDA':'🔒 BLOQUEADA'}</span></div><div class="r17-shop-body"><small>${m.tag}</small><h3>${m.name}</h3><p>${(ABILITIES[id]?.desc)||KTRAK_ABILITY.desc}</p><div class="r17-shop-stats"><span><b>${m.stats[0]}</b>DANO</span><span><b>${m.stats[1]}</b>AGIL</span><span><b>${m.stats[2]}</b>VIDA</span></div>${btn}</div></article>`;}).join('')}</div>
      <div class="r17-hub-actions"><button id="r18-shop-back" class="btn big">← VOLTAR AO R.A.V.A.M</button></div>
    </div>`;
    document.querySelectorAll('.r18-buy-legend').forEach(b=>b.onclick=()=>{
      const id=b.dataset.id,cost=({kain:700,aria:650,leo:800,tharoth:900}[id]||0); if(rIsOwned(id)) return;
      if((Number(state.vandais)||0)<cost){ alert('VANDAIS INSUFICIENTES'); return; }
      state.vandais=Math.max(0,(Number(state.vandais)||0)-cost); state.ravamRoster.push(id); state.ravamRoster=[...new Set(state.ravamRoster)]; save(); renderKtrakRavamShop();
    });
    document.getElementById('r18-shop-back').onclick=renderKtrakRavamHub;
  }
  function renderKtrakRavamSelect(mode='cpu'){
    patchRavamObject(); ensureRavamEconomy(); rMode=mode; screen='ravam'; try{drawCanvas();}catch(_){}
    const a=document.getElementById('app'); if(!a) return;
    const p1=rPick1,p2=rPick2,pickingP2=mode==='pvp'&&!!p1&&!p2,ready=mode==='pvp'?!!(p1&&p2):!!p1;
    const opponent=mode==='cpu'&&p1?rRandomRival(p1):mode==='story'&&p1?rStoryRival(p1):'';
    a.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen ravam-v15 r17-screen select-mode-${mode}">
      <section class="ravam-selection-head"><div class="ravam-brand-lockup"><small>${mode==='pvp'?'DUELO LOCAL':mode==='story'?'CAPÍTULO R.A.V.A.M':'COMBATE SOLO'}</small><h2>SELEÇÃO DE <span>LENDAS</span></h2><p>${mode==='pvp'?'Escolha primeiro o P1 e depois o P2.':mode==='story'?'Escolha o protagonista do capítulo.':'Escolha sua Lenda para enfrentar a CPU.'}</p></div><button id="r18-change-mode" class="ravam-mini-back">← TROCAR MODO</button></section>
      <section class="ravam-match-slots ${mode}"><div class="ravam-slot p1 ${p1?'filled':''} ${!p1||(!pickingP2&&mode!=='pvp')?'active':''}"><small>${mode==='story'?'PROTAGONISTA':'JOGADOR 1'}</small><b>${p1?rDisplay(p1):'AGUARDANDO'}</b><span>${p1?'PRONTO':'ESCOLHA UMA LENDA'}</span></div><div class="ravam-versus">VS</div><div class="ravam-slot p2 ${(p2||opponent)?'filled':''} ${pickingP2?'active':''}"><small>${mode==='pvp'?'JOGADOR 2':mode==='story'?'RIVAL DO CAPÍTULO':'CPU'}</small><b>${mode==='pvp'?(p2?rDisplay(p2):'AGUARDANDO'):(opponent?rDisplay(opponent):'AGUARDANDO')}</b><span>${mode==='pvp'?(p2?'PRONTO':'ESCOLHA UMA LENDA'):(p1?'DEFINIDO AUTOMATICAMENTE':'AGUARDANDO')}</span></div></section>
      <div class="ravam-section-title"><span>02</span><div><small>PASSO DOIS</small><h3>${pickingP2?'P2 · ESCOLHA SUA LENDA':'ESCOLHA SUA LENDA'}</h3></div></div>
      <section class="ravam-roster-grid ravam-pick-grid r17-pick-grid">${ravamCharList().map(c=>rLegendCard(c.id,mode==='pvp'?(p1===c.id||p2===c.id):p1===c.id,mode==='pvp'?(p1===c.id?'P1':p2===c.id?'P2':''):(p1===c.id?'P1':''))).join('')}</section>
      <div class="ravam-selection-help">Lendas com cadeado precisam ser adquiridas na Loja R.A.V.A.M. Ktrak é desbloqueado com o código 96051.</div>
      <div class="ravam-footer-actions"><button id="r18-confirm" class="btn big" ${ready?'':'disabled'}>${mode==='story'?'INICIAR HISTÓRIA':mode==='pvp'?'INICIAR 1P × 2P':'INICIAR 1P × CPU'}</button><button id="r18-open-shop" class="btn">🛒 LOJA R.A.V.A.M</button></div>
    </div>`;
    document.querySelectorAll('[data-r18-char]').forEach(el=>el.onclick=()=>{
      const id=el.dataset.r18Char; if(!rIsOwned(id)){ renderKtrakRavamShop(); return; }
      try{SFX?.play?.('menu_select')}catch(_){}
      if(mode==='pvp'){
        if(!rPick1 || rPick2){ rPick1=id; rPick2=''; }
        else if(id===rPick1){ return; }
        else rPick2=id;
      } else rPick1=id;
      renderKtrakRavamSelect(mode);
    });
    document.getElementById('r18-change-mode').onclick=()=>{rPick1='';rPick2='';renderKtrakRavamHub();};
    document.getElementById('r18-open-shop').onclick=renderKtrakRavamShop;
    const c=document.getElementById('r18-confirm'); if(c&&!c.disabled) c.onclick=()=>{
      const a=rPick1; if(!a||!rIsOwned(a)) return;
      const b=mode==='pvp'?rPick2:mode==='story'?rStoryRival(a):rRandomRival(a); if(!b) return;
      try{SFX?.play?.('menu_confirm')}catch(_){}
      window.startFight(a,mode==='pvp'?'pvp':'ravam',b);
      try{ if(fight){ fight.ravamStudios=true; fight.ravamSelectionMode=mode; } }catch(_){}
    };
  }
  window.renderRavamMode=function(){ patchRavamObject(); ensureRavamEconomy(); rPick1=''; rPick2=''; if(!rHasAccess()){ if(typeof oldRenderRavamMode==='function') return oldRenderRavamMode.apply(this,arguments); return renderKtrakRavamHub(); } renderKtrakRavamHub(); };
  patchRavamObject();

  const oldRenderModes = typeof window.renderModes==='function' ? window.renderModes : null;
  if(oldRenderModes){
    window.renderModes=function(){
      const r=oldRenderModes.apply(this,arguments);
      setTimeout(()=>{const card=document.getElementById('mode-ravam'); if(!card)return; const p=card.querySelector('p'); if(p)p.textContent=rHasAccess()?`Loja própria · ${(state?.ravamRoster||[]).length}/6 Lendas desbloqueadas · Ktrak via código 96051.`:'Adquira o modo. Ktrak é desbloqueado com o código 96051 e pode ser usado também no normal.';},0);
      return r;
    }
  }

  // ===== combate / input =====
  function opp(p,f=typeof fight!=='undefined'?fight:null){return f?(p===f.p1?f.p2:f.p1):null}
  function baseDmg(p,m=1){ return (Number(p?.dmg)||33) * (p?.ktrakAvatarT>0 ? 2 : 1) * m; }
  function addBurn(victim,owner,dur=1){ victim.ktrakBurnT=Math.max(victim.ktrakBurnT||0,dur); victim.ktrakBurnTick=0.2; victim.ktrakBurnOwner=owner; }
  function ktrakAttack(p){
    const f=typeof fight!=='undefined'?fight:null; if(!f||!p||p.state==='ko') return; const t=opp(p,f); if(!t) return;
    f.ktrakShots=f.ktrakShots||[]; f.ktrakRocks=f.ktrakRocks||[]; f.ktrakFx=f.ktrakFx||[];
    const el=ktrakElement(p), dir=p.facing||1, sy=(typeof bodyY==='function'?bodyY(p):GROUND_Y-(p.y||0)-82)-10;
    const avatar= p.ktrakAvatarT>0;
    if(el.id==='earth'){
      f.ktrakRocks.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,y:66,vy:0,life:1.5,dmg:baseDmg(p,.95),dead:false,owner:p});
      ktrakFx(p,'TERRA',el.accent,.85);
    }else{
      const speed=el.id==='air'?940:el.id==='water'?760:810;
      f.ktrakShots.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:p.x+dir*58,y:sy,vx:dir*speed,vy:0,life:1.25,el:el.id,dmg:baseDmg(p,el.id==='air'?.72:el.id==='water'?.76:el.id==='fire'?.74:.8),dir,dead:false});
      ktrakFx(p,el.name,el.accent,.8);
    }
    p.throwCd=p.human?.56:.7; p.ktrakCastT=.28; try{setState?.(p,'throw')}catch(_){}; try{SFX?.play?.('attack_light',.78)}catch(_){}
  }
  function ktrakAvatar(p){
    if(!p||p.state==='ko') return;
    p.ktrakAvatarT=5; p.ktrakAvatarCastT=.95; p.specialCd=7.2;
    try{setState?.(p,'special')}catch(_){};
    ktrakFx(p,'MODO AVATAR','#6bc6ff',1.05); try{spark?.(p.x,(typeof bodyY==='function'?bodyY(p):GROUND_Y-(p.y||0)-80)-6,'#6bc6ff',28)}catch(_){}
  }
  const oldPlayerInput = typeof playerInput==='function' ? playerInput : null;
  if(oldPlayerInput) playerInput=function(p){
    oldPlayerInput.apply(this,arguments);
    if(!p||p.id!=='ktrak'||p.state==='ko') return;
    const isP2=p.playerSlot==='p2', alt=isP2?'Numpad9':'KeyH';
    if(window.justPressed && window.justPressed[alt] && (p.ktrakSwapCd||0)<=0){ toggleKtrakElement(p); window.justPressed[alt]=false; }
  };
  const oldThrow = typeof throwProjectile==='function' ? throwProjectile : null;
  if(oldThrow) throwProjectile=function(p){ if(p?.id==='ktrak'){ktrakAttack(p); return;} return oldThrow.apply(this,arguments); };
  const oldSpecial = typeof castSpecial==='function' ? castSpecial : null;
  if(oldSpecial) castSpecial=function(p){ if(p?.id==='ktrak'){ktrakAvatar(p); return;} return oldSpecial.apply(this,arguments); };

  function strikeInfo(p){
    const kind=p?.proMove?.kind;if(kind!=='punch'&&kind!=='kick'&&kind!=='uppercut')return null;
    const duration=Math.max(.12,Number(p.proMove?.duration)||.34),n=clamp((Number(p.proMove?.time)||0)/duration,0,1);
    if(n<.24)return {kind,phase:'windup',t:smooth(n/.24)};
    if(n<.67)return {kind,phase:'impact',t:easeOut((n-.24)/.43)};
    return {kind,phase:'recover',t:smooth((n-.67)/.33)};
  }
  function ktrakPose(p){
    const strike=strikeInfo(p); if(strike) return {frame:strike.kind==='kick'?KSPR.kick:KSPR.punch,strike};
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround)) return {frame:KSPR.air,ko:true};
    if(p.defend||p.state==='defend'||p.state==='crouch') return {frame:KSPR.guard,guard:true};
    if(p.state==='special'||p.state==='throw'||(p.ktrakCastT||0)>0||(p.ktrakAvatarCastT||0)>0) return {frame:KSPR.special,cast:true};
    if(p.state==='hurt'||p.hitFlash>.035) return {frame:KSPR.guard,hurt:true};
    if(!p.onGround) return {frame:KSPR.air,air:true};
    if(Math.abs(p.vx||0)>7){ const dist=Number(p.walkDistance||p.ravamWalkDist||0),raw=dist/28,step=Math.floor(raw)%4,frames=[1,0,2,0]; return {frame:frames[step],walk:true,phase:raw*Math.PI*.5}; }
    return {frame:0,idle:true};
  }
  function drawFixed(ctx,img,scale,alpha=1){ if(!img?.complete||!img.naturalWidth) return false; ctx.globalAlpha*=alpha; const w=img.naturalWidth*scale,h=img.naturalHeight*scale; ctx.drawImage(img,-w/2,-h,w,h); return true; }
  function drawKtrak(ctx,p){
    const pose=ktrakPose(p), img=KSPR.imgs[pose.frame]; if(!img?.complete||!img.naturalWidth) return false;
    const H=230, scale=H/KSPR.ref, floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0), time=performance.now()/1000;
    const air=Math.max(0,Number(p.y)||0), sh=Math.max(.32,1-air/420);
    ctx.save(); ctx.globalAlpha=.32*sh; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(p.x,GROUND_Y+4,41*sh,8*sh,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(p.x,floor); ctx.scale(p.facing||1,1); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    if(pose.idle){ const b=Math.sin(time*2.8+(p.playerSlot==='p2'?1.2:0)); ctx.translate(0,-1.8-1.2*b); ctx.scale(1+.004*b,1-.004*b); }
    if(pose.walk){ const ph=pose.phase||0; ctx.translate(Math.sin(ph)*2.1,-Math.abs(Math.sin(ph))*3.0); ctx.rotate(Math.sin(ph)*.018); const push=.006*Math.cos(ph); ctx.scale(1+push,1-push); }
    if(pose.air){ const vy=Number(p.vy)||0; ctx.translate(2,-4); ctx.rotate(clamp(-vy/1050,-.07,.07)); const stretch=clamp(Math.abs(vy)/1800,0,.025); ctx.scale(1-stretch,1+stretch); }
    if(pose.cast){ const t=clamp(Number(p.stateT)||0,0,.55)/.55,e=easeOut(t); ctx.translate(7*e,-3*e); ctx.rotate(-.03*e); }
    if(pose.strike){ const {kind,phase,t}=pose.strike; if(phase==='windup'){ctx.translate(-10*t,2*t);ctx.rotate(.045*t)} else if(phase==='impact'){ const amt=kind==='kick'?25:20; ctx.translate(10+amt*t,-(kind==='kick'?8:4)*t); ctx.rotate((kind==='kick'?-.11:-.075)*(1-.28*t)); } else { const e=1-t; ctx.translate(9*e,-3*e); ctx.rotate(-.035*e);} }
    if(pose.guard) ctx.translate(-2,1); if(pose.hurt){ctx.translate(-7,1);ctx.rotate(.035)} if(pose.ko){ctx.translate(-12,-10);ctx.rotate(-Math.PI/2);ctx.translate(0,H*.34)}
    drawFixed(ctx,img,scale,1);
    if((p.ktrakAvatarT||0)>0){
      const glow=.82+.18*Math.sin(performance.now()/90);
      ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.92*glow;
      ctx.fillStyle='#7fd6ff'; ctx.shadowColor='#7fd6ff'; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.arc(-8,-195,5.2,0,Math.PI*2); ctx.arc(8,-195,5.2,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    return true;
  }
  const oldDrawFighter = typeof drawFighter==='function' ? drawFighter : null;
  if(oldDrawFighter) drawFighter=function(ctx,p){ if(p?.id==='ktrak'&&drawKtrak(ctx,p)) return; return oldDrawFighter.apply(this,arguments); };

  function hit(victim,amount,src,dir,type){ try{return typeof damage==='function'?damage(victim,amount,src,dir,type):undefined}catch(_){} }
  function ktrakHitboxY(target,y,margin){ try{return hitboxY(target,y,margin)}catch(_){ const ty=(typeof bodyY==='function'?bodyY(target):GROUND_Y-(target.y||0)-70); return Math.abs(ty-y)<margin; } }
  function updateKtrak(f,dt){
    if(!f) return;
    f.ktrakShots=f.ktrakShots||[]; f.ktrakRocks=f.ktrakRocks||[]; f.ktrakFx=f.ktrakFx||[];
    for(const p of [f.p1,f.p2]){
      if(!p) continue;
      p.ktrakSwapCd=Math.max(0,(p.ktrakSwapCd||0)-dt);
      p.ktrakCastT=Math.max(0,(p.ktrakCastT||0)-dt);
      p.ktrakAvatarCastT=Math.max(0,(p.ktrakAvatarCastT||0)-dt);
      p.ktrakAvatarT=Math.max(0,(p.ktrakAvatarT||0)-dt);
      if(p.ktrakBurnT>0){ p.ktrakBurnT-=dt; p.ktrakBurnTick=(p.ktrakBurnTick||0)-dt; if(p.ktrakBurnTick<=0 && p.ktrakBurnT>0){ p.ktrakBurnTick=.25; const owner=p.ktrakBurnOwner || (p===f.p1?f.p2:f.p1); hit(p,4,owner,0,'ktrak-burn'); try{spark?.(p.x,(typeof bodyY==='function'?bodyY(p):GROUND_Y-(p.y||0)-70),'#ff8b3d',8)}catch(_){} } }
    }
    for(const s of f.ktrakShots){
      if(s.dead) continue; s.life-=dt; s.x+=(s.vx||0)*dt; s.y+=(s.vy||0)*dt;
      const owner=s.owner|| (s.ownerSlot==='p2'?f.p2:f.p1), target=s.target|| (s.targetSlot==='p2'?f.p2:f.p1);
      if(target&&target.state!=='ko'&&Math.abs(s.x-target.x)<54&&ktrakHitboxY(target,s.y,26)){
        s.dead=true; const dir=s.dir||((s.vx||1)>0?1:-1);
        hit(target,s.dmg,owner,dir,'ktrak-'+s.el);
        if(s.el==='water'){ target.freezeT=Math.max(target.freezeT||0,1.0); target.vx=0; target.vy=0; }
        else if(s.el==='fire'){ addBurn(target,owner,1.0); }
        else if(s.el==='air'){ target.vx += dir*235; }
        try{spark?.(s.x,s.y,s.el==='water'?'#7dd9ff':s.el==='fire'?'#ff8332':s.el==='air'?'#e8f8ff':'#d6aa6b',18)}catch(_){}
      }
      if(s.life<=0||s.x<-100||s.x>W+100) s.dead=true;
    }
    f.ktrakShots=f.ktrakShots.filter(s=>!s.dead);
    for(const r of f.ktrakRocks){
      if(r.dead) continue; r.life-=dt; r.vy=(r.vy||0)+1200*dt; r.y+=(r.vy||0)*dt;
      const owner=r.owner || (r.ownerSlot==='p2'?f.p2:f.p1), target=r.target || (r.targetSlot==='p2'?f.p2:f.p1);
      const ty=target?(typeof bodyY==='function'?bodyY(target):GROUND_Y-(target.y||0)-70):GROUND_Y-70;
      if(target&&target.state!=='ko' && r.y>=ty-10){ r.dead=true; if(Math.abs(r.x-target.x)<78){ hit(target,r.dmg,owner,target.x>=owner.x?1:-1,'ktrak-earth'); target.vx += (target.x>=owner.x?1:-1)*120; } try{spark?.(r.x,ty,'#d8a46a',28)}catch(_){} }
      if(r.y>GROUND_Y+40||r.life<=0) r.dead=true;
    }
    f.ktrakRocks=f.ktrakRocks.filter(r=>!r.dead);
    for(const fx of f.ktrakFx){ fx.life-=dt; fx.y-=18*dt; } f.ktrakFx=f.ktrakFx.filter(fx=>fx.life>0);
  }
  const oldUpdate = typeof update==='function' ? update : null;
  if(oldUpdate) update=function(f,dt){ const r=oldUpdate.apply(this,arguments); if(!f?.paused) updateKtrak(f,dt); return r; };

  function drawKtrakFx(ctx,f){
    if(!f) return;
    for(const s of (f.ktrakShots||[])){
      ctx.save(); ctx.translate(s.x,s.y); ctx.globalCompositeOperation='lighter';
      if(s.el==='water'){
        ctx.fillStyle='#71d2ff'; ctx.shadowColor='#71d2ff'; ctx.shadowBlur=16; ctx.beginPath(); ctx.ellipse(0,0,16,8,0,0,Math.PI*2); ctx.fill();
      }else if(s.el==='fire'){
        ctx.fillStyle='#ff7f2f'; ctx.shadowColor='#ff7f2f'; ctx.shadowBlur=18; ctx.beginPath(); ctx.ellipse(0,0,14,10,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffd37a'; ctx.beginPath(); ctx.ellipse(0,-1,7,5,0,0,Math.PI*2); ctx.fill();
      }else if(s.el==='air'){
        ctx.strokeStyle='#e7f8ff'; ctx.shadowColor='#d4f4ff'; ctx.shadowBlur=15; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-18,0); ctx.lineTo(18,0); ctx.stroke(); ctx.beginPath(); ctx.arc(12,0,8,-.8,.8); ctx.stroke();
      }
      ctx.restore();
    }
    for(const r of (f.ktrakRocks||[])){
      ctx.save(); ctx.translate(r.x,r.y); ctx.rotate(performance.now()/500); ctx.fillStyle='#7a5a3a'; ctx.strokeStyle='#d6ae77'; ctx.lineWidth=2; ctx.shadowBlur=10; ctx.shadowColor='#d6ae77'; ctx.beginPath(); ctx.moveTo(-18,-16); ctx.lineTo(10,-20); ctx.lineTo(21,0); ctx.lineTo(8,20); ctx.lineTo(-20,12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    for(const e of (f.ktrakFx||[])){
      const a=clamp(e.life/(e.maxLife||1),0,1); ctx.save(); ctx.translate(e.x,e.y); ctx.globalAlpha=a; ctx.fillStyle=e.color||'#fff'; ctx.shadowColor=e.color||'#fff'; ctx.shadowBlur=14; ctx.font='900 16px Oxanium, sans-serif'; ctx.textAlign='center'; ctx.fillText(e.text,0,0); ctx.restore();
    }
    // indicador do elemento / avatar acima dos lutadores
    for(const p of [f.p1,f.p2]){
      if(!p||p.id!=='ktrak'||p.state==='ko') continue;
      const el=ktrakElement(p);
      const y=(typeof bodyY==='function'?bodyY(p):GROUND_Y-(p.y||0)-80)-118;
      ctx.save(); ctx.globalAlpha=.96; ctx.textAlign='center'; ctx.font='900 12px Oxanium, sans-serif';
      ctx.fillStyle='rgba(2,6,16,.76)'; ctx.fillRect(p.x-42,y-12,84,18);
      ctx.fillStyle=el.accent; ctx.fillText(el.name,p.x,y+1);
      if((p.ktrakAvatarT||0)>0){ ctx.fillStyle='#6bc6ff'; ctx.fillText('AVATAR '+(p.ktrakAvatarT||0).toFixed(1)+'s',p.x,y-16); }
      ctx.restore();
    }
  }
  const oldDraw = typeof draw==='function' ? draw : null;
  if(oldDraw) draw=function(f){ const r=oldDraw.apply(this,arguments); try{ const ctx=canvas.getContext('2d'); drawKtrakFx(ctx,f); }catch(_){} return r; };
})();
