/* SORTEP NIAK — V20.9.2 COMBAT PERFORMANCE GUARD
 * Reduz picos de frame e limita apenas efeitos visuais acumuláveis.
 * Não reduz dano, alcance, colisão nem velocidade dos golpes.
 */
(()=>{
  'use strict';
  if(window.SortepCombatPerformance?.version)return;
  const VERSION='20.9.2-zero-lag-pass';
  const limits={
    proProjectiles:8,proImpacts:14,
    joneShots:4,joneBombs:2,joneClouds:2,joneFx:10,
    laranjaTrails:12,laranjaImpacts:10,laranjaBursts:8,
    ktrakShots:5,ktrakRocks:3,ktrakTornadoes:2,ktrakInfernos:1,ktrakEarthCrushes:2,ktrakBursts:10,ktrakFx:10,
    knives:14,swords:10,orbs:12,flowers:12,rays:10,lightnings:10,smokeBombs:8,
    ytiriChains:8,ytiriCopyFx:8,uiyeCopyFx:8,grizzLaserFx:8,dartEffects:10,lkughEffects:10,
    knunkaDashTrails:10,fireballs:10,firewalls:4,healOrbs:8
  };
  const trim=(arr,max)=>{if(Array.isArray(arr)&&arr.length>max)arr.splice(0,arr.length-max)};
  function trimFight(f){
    if(!f)return;
    for(const [key,max] of Object.entries(limits))trim(f[key],max);
    try{trim(sparks,72)}catch(_){}
  }
  const priorSpark=window.spark;
  if(typeof priorSpark==='function')window.spark=function(x,y,color,n){return priorSpark.call(this,x,y,color,Math.min(7,Math.max(0,Number(n)||0)))};
  const priorUpdate=window.update;
  let tick=0;
  if(typeof priorUpdate==='function')window.update=function(f,dt){
    // Evita que uma queda de FPS tente simular um frame gigante e provoque uma segunda queda.
    const safeDt=Math.min(.034,Math.max(0,Number(dt)||0));
    const r=priorUpdate.call(this,f,safeDt);
    if(f&&((++tick&1)===0))trimFight(f);
    return r;
  };
  const priorStart=window.startFight;
  if(typeof priorStart==='function')window.startFight=function(){const r=priorStart.apply(this,arguments);try{trimFight(typeof fight!=='undefined'?fight:null)}catch(_){}return r};
  window.SortepCombatPerformance=Object.freeze({version:VERSION,trimFight,limits:Object.freeze({...limits})});
})();
