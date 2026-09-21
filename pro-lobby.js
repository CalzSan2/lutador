/* LUTADOR — professional lobby presentation layer.
   This module only decorates existing screens and keeps the original game flow intact. */
(()=>{
  'use strict';

  const MODULE='proLobby';
  const app=()=>document.getElementById('app');
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const firstNumber=(values,fallback=0)=>{
    for(const value of values){if(value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value)))return Number(value)}
    return fallback;
  };
  const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const format=value=>Math.max(0,Math.floor(number(value))).toLocaleString('pt-BR');

  function gameState(){
    try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:{}}catch(_){return {}}
  }

  function readStats(){
    try{
      if(typeof featureStats==='function')return featureStats()||{};
      return JSON.parse(localStorage.getItem('lutador_arena_stats')||'{}')||{};
    }catch(_){return {}}
  }

  function providerState(){
    const providers=[window.LutadorProgression,window.ProProgression,window.LUTADOR_PROGRESSION,window.BattlePass];
    for(const provider of providers){
      if(!provider)continue;
      try{
        const value=typeof provider.getSnapshot==='function'?provider.getSnapshot():
          typeof provider.getState==='function'?provider.getState():
          typeof provider.getProfile==='function'?provider.getProfile():
          typeof provider.snapshot==='function'?provider.snapshot():provider.state;
        if(value&&typeof value==='object')return value;
      }catch(_){}
    }
    return {};
  }

  function normalizeMission(item,index){
    const titles=['Vença 3 lutas','Complete 5 partidas','Amplie seu elenco'];
    const target=Math.max(1,firstNumber([item?.target,item?.goal,item?.total],index===2?6:index===1?5:3));
    const progress=clamp(firstNumber([item?.progress,item?.current,item?.value],0),0,target);
    return {
      title:escapeHtml(item?.title||item?.name||item?.label||titles[index]||`Missão ${index+1}`),
      progress,
      target,
      reward:escapeHtml(item?.rewardLabel||item?.reward||`${150+index*100} XP`),
      done:Boolean(item?.done||item?.completed||progress>=target)
    };
  }

  function snapshot(){
    const saved=gameState(),provider=providerState(),progress=provider.profile||provider.progression||saved.progression||saved.progress||provider;
    const stats=provider.data?.stats||readStats();
    const level=Math.max(1,Math.floor(firstNumber([
      progress.level,progress.playerLevel,progress.currentLevel,saved.level,saved.playerLevel,saved.profile?.level
    ],1)));
    const xp=Math.max(0,firstNumber([
      progress.current,progress.xpInLevel,progress.currentXp,progress.xp,saved.xpInLevel,saved.currentXp,saved.xp
    ],0));
    const xpTarget=Math.max(1,firstNumber([
      progress.needed,progress.xpToNextLevel,progress.nextLevelXp,progress.xpTarget,saved.xpToNextLevel,saved.nextLevelXp
    ],500+level*150));
    const profileRatio=firstNumber([progress.ratio,progress.percent,progress.xpPercent],Number.NaN);
    const xpPercent=Number.isFinite(profileRatio)
      ?clamp(profileRatio<=1?profileRatio*100:profileRatio,0,100)
      :clamp((xp/xpTarget)*100,0,100);
    const passTier=Math.max(1,Math.floor(firstNumber([
      provider.pass?.tier,progress.passTier,progress.battlePassTier,progress.tier,saved.passTier,saved.battlePass?.tier
    ],1)));
    const passProgress=clamp(firstNumber([
      provider.pass?.ratio!==undefined?provider.pass.ratio*100:undefined,progress.passProgress,progress.battlePassProgress,progress.tierProgress,saved.passProgress,saved.battlePass?.progress
    ],(xp/xpTarget)*100),0,100);
    const sourceMissions=progress.missions||progress.dailyMissions||saved.missions||saved.dailyMissions;
    const defaults=[
      {title:'Vença 3 lutas',progress:number(stats.wins),target:3,reward:'EM ANDAMENTO'},
      {title:'Complete 5 partidas',progress:number(stats.matches),target:5,reward:'EM ANDAMENTO'},
      {title:'Amplie seu elenco',progress:Array.isArray(saved.roster)?saved.roster.length:1,target:6,reward:'EM ANDAMENTO'},
      {title:'Alcance combo 8x',progress:number(stats.bestCombo),target:8,reward:'250 XP'},
      {title:'Faça 10 KOs',progress:number(stats.kos),target:10,reward:'300 XP'},
      {title:'Vença 3 seguidas',progress:number(stats.streak),target:3,reward:'350 XP'}
    ];
    const provided=Array.isArray(sourceMissions)&&sourceMissions.length?sourceMissions:[];
    const missionSource=[...provided,...defaults.slice(provided.length)].slice(0,6);
    const missions=missionSource.map(normalizeMission);
    return {
      level,xp,xpTarget,xpPercent,
      passTier,passProgress,
      title:escapeHtml(provider.data?.equippedTitle||'NOVO DESAFIANTE'),
      coins:number(saved.coins),
      roster:Array.isArray(saved.roster)?saved.roster.length:1,
      wins:number(stats.wins),matches:number(stats.matches),bestStreak:number(stats.bestStreak),
      season:escapeHtml(provider.pass?.seasonName||progress.seasonName||saved.seasonName||'TEMPORADA 01'),
      passName:escapeHtml(provider.pass?.passName||progress.passName||'PASSE DE BATALHA'),
      seasonRemaining:escapeHtml(provider.pass?.remainingLabel||progress.seasonRemainingLabel||'28D 00H 00M'),
      missions
    };
  }

  function profileBar(data,full=false){
    const levelId=document.getElementById('pro-profile-level')?'':' id="pro-profile-level"';
    return `<header class="pro-profile-bar${full?' pro-profile-full':''}" data-pro-lobby-block="profile">
      <div class="pro-profile-identity">
        <span class="pro-profile-avatar" aria-hidden="true"><b>P1</b><i></i></span>
        <span class="pro-profile-copy"><small>JOGADOR 1 · PERFIL LOCAL</small><strong>${data.title}</strong></span>
      </div>
      <div class="pro-profile-progress">
        <span class="pro-level-row"><b${levelId}>NÍVEL ${data.level}</b><span data-pro-xp-label>${format(data.xp)} / ${format(data.xpTarget)} XP</span></span>
        <span class="pro-progress-track" role="progressbar" aria-label="Progresso do nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(data.xpPercent)}"><i data-pro-xp-bar style="--progress:${data.xpPercent}%"></i></span>
      </div>
      <div class="pro-profile-wallet" aria-label="Saldo de moedas"><small>SALDO</small><strong><span aria-hidden="true">◈</span> <span data-pro-coins>${format(data.coins)}</span></strong></div>
    </header>`;
  }

  function missionRows(data){
    return data.missions.map((mission,index)=>{
      const percent=clamp((mission.progress/mission.target)*100,0,100);
      return `<li class="pro-mission${mission.done?' is-complete':''}">
        <span class="pro-mission-index">0${index+1}</span>
        <span class="pro-mission-copy"><strong>${mission.title}</strong><span class="pro-mini-track"><i style="--progress:${percent}%"></i></span></span>
        <span class="pro-mission-score"><b>${format(mission.progress)}/${format(mission.target)}</b><small>${mission.done?'CONCLUÍDA':mission.reward}</small></span>
      </li>`;
    }).join('');
  }

  function dashboard(data){
    return `<section class="pro-lobby-dashboard" data-pro-lobby-block="dashboard" aria-label="Central do jogador">
      <aside class="pro-side-stack">
        <article class="pro-season-panel" id="pro-season-panel">
          <div class="pro-panel-kicker pro-season-highlight"><span data-pro-season-name>${data.season}</span><b data-pro-season-countdown>${data.seasonRemaining}</b></div>
          <div class="pro-pass-tier"><span><small class="pro-pass-highlight" data-pro-pass-name>${data.passName}</small><strong data-pro-pass-tier>PATAMAR ${String(data.passTier).padStart(2,'0')}</strong></span><span class="pro-tier-emblem" data-pro-pass-emblem>${String(data.passTier).padStart(2,'0')}</span></div>
          <span class="pro-pass-track" role="progressbar" aria-label="Progresso do passe de batalha" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(data.passProgress)}"><i data-pro-pass-bar style="--progress:${data.passProgress}%"></i></span>
          <button type="button" class="pro-text-action" data-pro-action="pass">ABRIR PASSE <span>→</span></button>
        </article>
        <article class="pro-missions-panel" id="pro-mission-panel">
          <div class="pro-panel-title"><span><small>SUA JORNADA</small><strong>METAS DE CARREIRA</strong></span><span class="pro-career-wins">${format(data.wins)} VITÓRIAS</span></div>
          <ul class="pro-mission-list">${missionRows(data)}</ul>
        </article>
      </aside>
    </section>`;
  }

  function screenBar(data,label,detail,aside){
    return `<div class="pro-screen-bar" data-pro-lobby-block="screenbar">
      <span class="pro-screen-mark" aria-hidden="true">L</span>
      <span class="pro-screen-copy"><small>${escapeHtml(detail)}</small><strong>${escapeHtml(label)}</strong></span>
      <span class="pro-screen-aside"><small>${escapeHtml(data.season)}</small><b>${escapeHtml(aside||`NÍVEL ${data.level}`)}</b></span>
    </div>`;
  }

  function enhanceMenu(){
    const root=app()?.querySelector('.menu');
    if(!root)return false;
    const data=snapshot();
    root.classList.add('pro-ui-shell','pro-lobby-ready');
    document.body.classList.add('pro-lobby-surface');
    if(!root.querySelector('[data-pro-lobby-block="profile"]'))root.insertAdjacentHTML('beforeend',profileBar(data,true));
    if(!root.querySelector('.pro-lobby-content')){
      const content=document.createElement('div');content.className='pro-lobby-content';
      const hero=document.createElement('section');hero.className='pro-lobby-hero';hero.setAttribute('aria-label','Lutador — Batalha');
      const intro=document.createElement('div');intro.className='pro-hero-copy';
      ['.lutador-brand','.logo','.mk-tagline'].forEach(selector=>{const node=root.querySelector(selector);if(node)intro.appendChild(node)});
      hero.appendChild(intro);
      const sponsors=root.querySelector('.sponsor-strip');if(sponsors)hero.appendChild(sponsors);
      const combat=document.createElement('section');combat.className='pro-combat-menu';combat.setAttribute('aria-label','Comandos da arena');
      combat.insertAdjacentHTML('afterbegin','<span class="pro-combat-eyebrow">CENTRAL DE COMBATE</span>');
      ['.select-title','.select-subtitle','.lobby-actions','.lobby-feature'].forEach(selector=>{const node=root.querySelector(selector);if(node)combat.appendChild(node)});
      const controls=root.querySelector('.control-box');
      content.append(hero,combat);content.insertAdjacentHTML('beforeend',dashboard(data));
      const profile=root.querySelector('[data-pro-lobby-block="profile"]');
      root.appendChild(content);if(controls)root.appendChild(controls);if(profile)root.appendChild(profile);
    }
    const profile=root.querySelector('[data-pro-lobby-block="profile"]');
    if(profile&&profile!==root.lastElementChild)root.appendChild(profile);
    const actions=root.querySelector('.lobby-actions');if(actions)actions.classList.add('pro-legacy-actions');
    refresh();
    return true;
  }

  const modeMeta={
    'mode-cpu':['SOLO','IA ADAPTATIVA'],'mode-pvp':['LOCAL','VERSUS'],'mode-tournament':['COMPETITIVO','CHAVE DE 8'],
    'mode-story':['CAMPANHA','17 BATALHAS'],'mode-boss':['DESAFIO','CHEFE FINAL'],'mode-chaos':['ARCADE','REGRAS CAÓTICAS'],
    'mode-mix':['ARCADE','PODERES MISTOS'],'mode-lan':['REDE','MULTIPLAYER LAN']
  };

  function enhanceModes(){
    const root=app()?.querySelector('.modes-screen');
    if(!root)return false;
    const data=snapshot();
    root.classList.add('pro-ui-shell','pro-modes-ready');
    if(!root.querySelector('[data-pro-lobby-block="screenbar"]'))root.insertAdjacentHTML('afterbegin',screenBar(data,'MODOS DE JOGO','CENTRAL DE COMBATE',`${data.roster} CAMPEÕES`));
    root.querySelectorAll('.mode-grid > button').forEach((card,index)=>{
      card.classList.add('pro-mode-card');card.style.setProperty('--pro-order',index);
      if(card.querySelector('.pro-mode-meta'))return;
      const meta=modeMeta[card.id]||['ESPECIAL','ARENA'];
      card.insertAdjacentHTML('beforeend',`<span class="pro-mode-meta"><b>${meta[0]}</b><small>${meta[1]}</small></span>`);
    });
    return true;
  }

  function enhanceShop(){
    const root=app()?.querySelector('.shop');
    if(!root)return false;
    const data=snapshot();
    root.classList.add('pro-ui-shell','pro-shop-ready');
    if(!root.querySelector('[data-pro-lobby-block="screenbar"]'))root.insertAdjacentHTML('afterbegin',screenBar(data,'MERCADO DA ARENA','ARSENAL E RECOMPENSAS',`◈ ${format(data.coins)}`));
    const actions=root.querySelector('.lobby-actions');if(actions)actions.classList.add('pro-shop-actions');
    return true;
  }

  function enhanceSelect(){
    const root=app()?.querySelector('.select');
    if(!root)return false;
    const data=snapshot();
    root.classList.add('pro-ui-shell','pro-select-ready');
    if(!root.querySelector('[data-pro-lobby-block="screenbar"]'))root.insertAdjacentHTML('afterbegin',screenBar(data,'ESCOLHA SEU CAMPEÃO','PREPARAÇÃO DA PARTIDA',`${data.roster} LIBERADOS`));
    return true;
  }

  function updateText(selector,text){const element=document.querySelector(selector);if(element&&element.textContent!==text)element.textContent=text}
  function refresh(){
    const data=snapshot();
    updateText('#pro-profile-level',`NÍVEL ${data.level}`);
    updateText('[data-pro-coins]',format(data.coins));
    updateText('[data-pro-xp-label]',`${format(data.xp)} / ${format(data.xpTarget)} XP`);
    updateText('[data-pro-pass-tier]',`PATAMAR ${String(data.passTier).padStart(2,'0')}`);
    updateText('[data-pro-pass-emblem]',String(data.passTier).padStart(2,'0'));
    updateText('[data-pro-season-name]',data.season);
    updateText('[data-pro-season-countdown]',data.seasonRemaining);
    updateText('[data-pro-pass-name]',data.passName);
    const xp=document.querySelector('[data-pro-xp-bar]');if(xp){xp.style.setProperty('--progress',`${data.xpPercent}%`);xp.parentElement?.setAttribute('aria-valuenow',String(Math.round(data.xpPercent)))}
    const pass=document.querySelector('[data-pro-pass-bar]');if(pass){pass.style.setProperty('--progress',`${data.passProgress}%`);pass.parentElement?.setAttribute('aria-valuenow',String(Math.round(data.passProgress)))}
  }

  function enhanceCurrent(){
    const host=app();if(!host)return;
    document.body.classList.toggle('pro-lobby-surface',Boolean(host.querySelector('.card,.pro-screen')));
    enhanceMenu()||enhanceModes()||enhanceShop()||enhanceSelect();
  }

  function callFirst(names){
    for(const name of names){const fn=window[name];if(typeof fn==='function'){fn();return true}}
    return false;
  }

  function focusPanel(selector){
    const panel=document.querySelector(selector);if(!panel)return;
    panel.classList.remove('pro-attention');void panel.offsetWidth;panel.classList.add('pro-attention');
    panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  }

  function runAction(action){
    if(action==='play'){callFirst(['renderModes']);return}
    if(action==='shop'){callFirst(['renderShop']);return}
    if(action==='ranking'){callFirst(['renderRanking']);return}
    if(action==='pass'){
      if(typeof window.ProProgression?.showBattlePass==='function'){window.ProProgression.showBattlePass('menu');return}
      if(!callFirst(['renderBattlePass','renderPass','openBattlePass'])){
        window.dispatchEvent(new CustomEvent('pro:open-battle-pass',{detail:{source:MODULE}}));focusPanel('#pro-season-panel');
      }
      return;
    }
    if(action==='missions'){
      if(!callFirst(['renderMissions','renderMissionCenter','openMissions'])){
        window.dispatchEvent(new CustomEvent('pro:open-missions',{detail:{source:MODULE}}));focusPanel('#pro-mission-panel');
      }
    }
  }

  function wrap(name){
    const base=window[name];
    if(typeof base!=='function'||base.__proLobbyWrapped)return;
    const wrapped=function(...args){const result=base.apply(this,args);queueMicrotask(enhanceCurrent);return result};
    wrapped.__proLobbyWrapped=true;wrapped.__proLobbyBase=base;window[name]=wrapped;
  }
  function installWrappers(){['renderMenu','renderModes','renderShop','renderShopChampions','renderSelect'].forEach(wrap)}

  let frame=0;
  function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;installWrappers();enhanceCurrent()})}
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-pro-action]');if(!button)return;
    event.preventDefault();runAction(button.dataset.proAction);
  });
  ['pro:progress-changed','lutador:progress-changed','lutador:progression','battlepass:updated'].forEach(name=>window.addEventListener(name,()=>{refresh();schedule()}));
  window.addEventListener('storage',event=>{if(!event.key||/lutador|battle|progress/i.test(event.key))schedule()});

  function boot(){
    installWrappers();enhanceCurrent();
    const host=app()||document.body;
    new MutationObserver(schedule).observe(host,{childList:true,subtree:true});
    let attempts=0;const late=setInterval(()=>{installWrappers();if(++attempts>12)clearInterval(late)},500);
    window.ProLobbyUI=Object.freeze({refresh:()=>{refresh();schedule()},upgrade:schedule,getSnapshot:snapshot});
    window.dispatchEvent(new CustomEvent('pro:lobby-ready',{detail:{module:MODULE}}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* SORTEP NIAK — lobby layout and settings integration */
(()=>{
  const oldEnhance=window.ProLobbyUI;
  function injectSettings(){
    const root=document.querySelector('.pro-audio-dialog,.settings-dialog,.settings-panel');
    if(!root||root.querySelector('.sortep-settings-brand'))return;
    const brand=document.createElement('div');brand.className='sortep-settings-brand';
    brand.innerHTML='<span>⚙</span><div><small>SORTEP NIAK</small><b>CONFIGURAÇÕES PROFISSIONAIS</b></div>';
    root.querySelector('.pro-audio-panel,.settings-content')?.prepend(brand);
  }
  document.addEventListener('click',()=>setTimeout(injectSettings,0));
})();
