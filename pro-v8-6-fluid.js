/* SORTEP NIAK — V8.6 FLUIDIDADE / RESET TOTAL / GRÁFICOS FUNCIONAIS */
(()=>{
  'use strict';
  if(window.__LutadorV86)return;
  window.__LutadorV86=true;
  const VERSION='8.6.1';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const game=()=>{try{return typeof fight!=='undefined'&&fight?fight:null}catch(_){return null}};
  const q=()=>String(window.LutadorUltimate?.data?.settings?.graphics||document.documentElement.dataset.graphics||'balanced');
  const quality=()=>['high','balanced','performance'].includes(q())?q():'balanced';
  const fxScale=()=>quality()==='high'?1:quality()==='performance'?.34:.68;
  const effectLimit=()=>quality()==='high'?180:quality()==='performance'?42:92;

  function applyGraphicsProfile(){
    const mode=quality();
    document.documentElement.dataset.graphics=mode;
    document.body?.classList.toggle('v86-performance',mode==='performance');
    document.body?.classList.toggle('v86-high',mode==='high');
    try{
      const v6=window.LutadorV6?.data;
      if(v6?.settings){v6.settings.ultra=mode==='performance';}
      document.body?.classList.toggle('v6-ultra-performance',mode==='performance');
    }catch(_){}
    const canvas=document.getElementById('game');
    if(canvas){
      const ctx=canvas.getContext?.('2d');
      if(ctx)ctx.imageSmoothingEnabled=mode!=='performance';
      canvas.style.imageRendering=mode==='performance'?'auto':'auto';
    }
    window.__SORTEP_GRAPHICS_PROFILE=mode;
    window.__SORTEP_FX_SCALE=fxScale();
    return mode;
  }

  /* Faz as opções Alto / Equilibrado / Desempenho alterarem o render imediatamente. */
  document.addEventListener('change',e=>{
    if(e.target?.id==='ult-graphics')requestAnimationFrame(()=>{applyGraphicsProfile();showGraphicsState();});
  },true);
  let lastMode='';
  const syncTimer=setInterval(()=>{const m=quality();if(m!==lastMode){lastMode=m;applyGraphicsProfile();showGraphicsState()}},500);
  window.addEventListener('pagehide',()=>clearInterval(syncTimer),{once:true});

  function showGraphicsState(){
    const grid=document.querySelector('.ultimate-settings.settings-grid');
    if(!grid)return;
    let row=grid.querySelector('.v86-graphics-state');
    if(!row){
      row=document.createElement('div');
      row.className='v86-graphics-state';
      row.innerHTML='<span><i class="v86-graphics-dot"></i><b>Perfil aplicado</b></span><span data-v86-label></span>';
      grid.appendChild(row);
    }
    const m=quality(),labels={high:'ALTO · MAIS EFEITOS',balanced:'EQUILIBRADO · RECOMENDADO',performance:'DESEMPENHO · FPS PRIORITÁRIO'};
    const label=row.querySelector('[data-v86-label]');
    if(label&&label.textContent!==labels[m])label.textContent=labels[m];
    if(row.dataset.mode!==m)row.dataset.mode=m;
  }

  /* Reduz geração de partículas antes de elas existirem. */
  const baseSpark=window.spark;
  if(typeof baseSpark==='function')window.spark=function(x,y,color,n){
    const scaled=Math.max(1,Math.round((Number(n)||1)*fxScale()));
    return baseSpark.call(this,x,y,color,scaled);
  };

  function trimEffects(f){
    const limit=effectLimit();
    const globalLists={sparks:(typeof sparks!=='undefined'?sparks:null)};
    const keys=['proProjectiles','proImpacts','knives','swords','orbs','flowers','rays','lightnings','smokeBombs','ytiriCopyFx','grizzLaserFx','dartEffects','lkughEffects','hockMoonFx','knunkaDashTrails','ytiriChains'];
    const trim=a=>{if(Array.isArray(a)&&a.length>limit)a.splice(0,a.length-limit)};
    trim(globalLists.sparks);
    keys.forEach(k=>trim(f?.[k]));
  }

  /* Movimento ligeiramente mais responsivo para ambos os lados, sem mudar dano ou alcance. */
  const oldStart=window.startFight;
  if(typeof oldStart==='function')window.startFight=function(){
    const r=oldStart.apply(this,arguments),f=game();
    if(f){for(const p of[f.p1,f.p2])if(p&&!p.v86FluidApplied){p.v86FluidApplied=true;p.speed*=1.075;}}
    applyGraphicsProfile();
    return r;
  };

  /* Hit-stop normal mais curto; cinematográfica/Ultimate continua intacta. */
  const oldUpdate=window.update;
  let trimTick=0;
  if(typeof oldUpdate==='function')window.update=function(f,dt){
    const step=Math.max(0,Number(dt)||0);
    if(f&&(f.megaHitStop||0)>0&&(f.megaHitStop||0)<.28){
      f.megaHitStop=Math.max(0,f.megaHitStop-step*.38);
    }
    const r=oldUpdate.apply(this,arguments);
    if(f){
      for(const p of[f.p1,f.p2]){
        if(!p)continue;
        /* V8.5 usava multiplicação por frame na exaustão. Converte para redução fixa e previsível. */
        if((p.v85ExhaustedT||0)>0&&Math.abs(p.vx||0)>0){p.vx=(p.vx/.94)*.90;}
      }
      if((++trimTick%3)===0)trimEffects(f);
    }
    return r;
  };

  /* RESET realmente limpo: após o reload impede saves antigos de sobreviverem ao pagehide. */
  if(window.__SORTEP_RESET_BOOT){
    try{
      localStorage.clear();
      if(typeof state!=='undefined'&&typeof defaultPlayer==='function'){
        const fresh=defaultPlayer();
        Object.keys(state).forEach(k=>delete state[k]);
        Object.assign(state,fresh,{coins:0,psy:0,vandais:0,roster:['rojo'],playerName:'',tutorialSeen:false,redeemedCodes:[],storyProgress:0,storyComplete:false});
        if(typeof saveState==='function')saveState(state);
      }
    }catch(_){}
    setTimeout(()=>{try{sessionStorage.removeItem('sortep-hard-reset')}catch(_){}},1800);
  }

  /* Hard reset adicional exposto para o código REDEFINIR e diagnósticos. */
  async function totalReset(){
    try{sessionStorage.clear();sessionStorage.setItem('sortep-hard-reset','1')}catch(_){}
    try{localStorage.clear()}catch(_){}
    try{document.cookie.split(';').forEach(c=>{const n=c.split('=')[0].trim();if(n)document.cookie=`${n}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`})}catch(_){}
    try{if(window.caches?.keys){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(_){}
    try{if(navigator.serviceWorker?.getRegistrations){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}}catch(_){}
    try{if(indexedDB?.databases){const ds=await indexedDB.databases();await Promise.all(ds.filter(d=>d.name).map(d=>new Promise(res=>{try{const req=indexedDB.deleteDatabase(d.name);req.onsuccess=req.onerror=req.onblocked=()=>res()}catch(_){res()}})))}}catch(_){}
    location.reload();
  }

  /* Garante que REDEFINIR use a rotina V8.6 mesmo se outra camada recriar a tela de códigos. */
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#btn-code-submit');if(!btn)return;
    const input=document.getElementById('code-input');
    if((input?.value||'').trim().toUpperCase()!=='REDEFINIR')return;
    e.preventDefault();e.stopImmediatePropagation();btn.disabled=true;
    const status=document.getElementById('code-status');if(status){status.textContent='♻ APAGANDO LITERALMENTE TODO O PROGRESSO...';status.style.color='#a7f3d0'}
    totalReset();
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||e.target?.id!=='code-input')return;
    if((e.target.value||'').trim().toUpperCase()!=='REDEFINIR')return;
    e.preventDefault();e.stopImmediatePropagation();document.getElementById('btn-code-submit')?.click();
  },true);

  applyGraphicsProfile();
  setTimeout(showGraphicsState,100);
  let settingsUiQueued=false;
  const obs=new MutationObserver((mutations)=>{
    // Evita o loop de MutationObserver que travava o jogo depois de abrir Configurações.
    // Só sincroniza quando a janela de configurações realmente existe e agrupa mudanças no próximo frame.
    if(settingsUiQueued||!document.querySelector('.ultimate-settings.settings-grid'))return;
    const relevant=mutations.some(m=>m.type==='childList');
    if(!relevant)return;
    settingsUiQueued=true;
    requestAnimationFrame(()=>{settingsUiQueued=false;showGraphicsState();applyGraphicsProfile()});
  });
  obs.observe(document.body,{subtree:true,childList:true});
  window.LutadorV86=Object.freeze({version:VERSION,applyGraphicsProfile,totalReset,quality});
})();
