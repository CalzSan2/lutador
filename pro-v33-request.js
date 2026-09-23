/* SORTEP NIAK V33 — acabamento solicitado: treino confiável, cards reais e combate sem contador de combo. */
(()=>{
  'use strict';
  if(window.LutadorV33?.version)return;
  const VERSION='33.0.0';
  const game=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};

  // O atalho TREINO do lobby agora abre a seleção completa de lutador/dummy.
  document.addEventListener('click',e=>{
    const button=e.target?.closest?.('[data-v8-go="training"],[data-v82-go="training"],[data-v7="training"],[data-v84="training"]');
    if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();
    window.LutadorV5?.renderTrainingSelect?.();
  },true);

  // Escape sempre oferece uma saída do seletor e da luta de treino.
  window.addEventListener('keydown',e=>{
    if(e.code!=='Escape'||e.repeat)return;
    const f=game();
    if(f?.mode==='training'&&document.getElementById('v5-training-hud')){
      e.preventDefault();e.stopImmediatePropagation();document.getElementById('v5-train-exit')?.click();return;
    }
    if(typeof screen!=='undefined'&&screen==='training-select'){
      e.preventDefault();e.stopImmediatePropagation();window.renderModes?.();
    }
  },true);

  // O pedido remove o sistema antigo de pontuação/cadeia de combos. As sequências
  // I+I e O+O são golpes próprios e não reativam multiplicadores ou medidores.
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){
    const r=baseUpdate.apply(this,arguments);
    if(f){f.bestCombo=0;for(const p of[f.p1,f.p2])if(p){p.combo=0;p.comboT=0;p.megaCombo=0;p.megaComboT=0;p.proChain=0;p.proChainT=0}}
    return r;
  };

  // O renderizador da Ilha reutiliza a arte do modo normal; esta transformação
  // reduz apenas os avatares da Ilha em 50%, mantendo o pé preso à plataforma.
  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){
    if(!p?.__islandDummyFight)return baseDrawFighter.apply(this,arguments);
    const floor=typeof GROUND_Y!=='undefined'?GROUND_Y:840;ctx.save();ctx.translate(0,floor);ctx.scale(.5,.5);ctx.translate(0,-floor);
    try{return baseDrawFighter.apply(this,arguments)}finally{ctx.restore()}
  };

  function cleanRemovedContent(){
    document.getElementById('mode-duo-event')?.remove();
    document.querySelectorAll('[data-mode="ruins"],#mode-ruins,.ruins-mode-card').forEach(el=>el.remove());
    document.querySelectorAll('option').forEach(el=>{if(/ruínas perdidas/i.test(el.textContent||''))el.remove()});
    try{if(typeof STAGES!=='undefined'){for(let i=STAGES.length-1;i>=0;i--)if(STAGES[i]?.id==='ruinas')STAGES.splice(i,1)}}catch(_){ }
    const top=[...document.querySelectorAll('.island-topbar span')].find(el=>/ARENA 3×/.test(el.textContent||''));if(top)top.textContent='ARENA COMPACTA · PULO DUPLO ALTO';
    document.querySelectorAll('.island-banner small').forEach(el=>{if(/ARENA 3×|CÂMERA DINÂMICA/.test(el.textContent||''))el.textContent='ARENA COMPACTA · GRAVIDADE · ATAQUE EM MOVIMENTO'});
    document.querySelectorAll('.island-player-row em,#island-result-copy b').forEach(el=>{const old=el.textContent||'',next=old.replace(/DUPLA/g,'TRIO').replace(/Evento em Duplas/gi,'Torneio em Trio');if(next!==old)el.textContent=next});
    document.querySelectorAll('.exp-premium-copy p,.exp-featured small').forEach(el=>{const old=el.textContent||'',next=old.replace(/combos?/gi,'ataques');if(next!==old)el.textContent=next});
  }
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;cleanRemovedContent()})}).observe(document.body,{childList:true,subtree:true});cleanRemovedContent();
  window.LutadorV33=Object.freeze({version:VERSION});
})();
