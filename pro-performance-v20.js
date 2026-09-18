/* SORTEP NIAK — V20.9.2 COMBAT PERFORMANCE GUARD
 * Reduz picos de frame e limita apenas efeitos visuais acumuláveis.
 * Não reduz dano, alcance, colisão nem velocidade dos golpes.
 */
(()=>{
  'use strict';
  if(window.SortepCombatPerformance?.version)return;
  const VERSION='20.9.3-low-fx';
  const limits={
    proProjectiles:5,proImpacts:6,
    joneShots:3,joneBombs:1,joneClouds:1,joneFx:4,
    laranjaTrails:4,laranjaImpacts:5,laranjaBursts:3,
    ktrakShots:3,ktrakRocks:2,ktrakTornadoes:1,ktrakInfernos:1,ktrakEarthCrushes:1,ktrakBursts:4,ktrakFx:4,
    knives:7,swords:6,orbs:6,flowers:6,rays:5,lightnings:5,smokeBombs:4,
    ytiriChains:4,ytiriCopyFx:4,uiyeCopyFx:4,grizzLaserFx:4,dartEffects:5,lkughEffects:5,
    knunkaDashTrails:4,fireballs:5,firewalls:2,healOrbs:4
  };
  const trim=(arr,max)=>{if(Array.isArray(arr)&&arr.length>max)arr.splice(0,arr.length-max)};
  function trimFight(f){
    if(!f)return;
    for(const [key,max] of Object.entries(limits))trim(f[key],max);
    try{trim(sparks,24)}catch(_){}
  }
  const priorSpark=window.spark;
  let lastSparkAt=0;
  if(typeof priorSpark==='function')window.spark=function(x,y,color,n){
    const now=performance.now();
    if(now-lastSparkAt<22)return;
    lastSparkAt=now;
    return priorSpark.call(this,x,y,color,Math.min(2,Math.max(0,Number(n)||0)));
  };
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
