/* SORTEP NIAK — R.A.V.A.M. LENDAS · ANIMAÇÃO V31
 * Aurora Valerian, Petros, Kai Draconis e Rifana desenhados pelo mesmo motor visual dos campeões (ProMotion).
 * Atlas transparentes limpos com recorte corrigido, passos por distância e poses de campeão.
 * Mantém todas as mecânicas, poderes e supers da Crônica V24.
 */
(()=>{
  'use strict';
  if(window.RavamLegendsChampionAnimationV31?.version)return;
  const VERSION='31.0.0-ravam-champion-motion';
  const COLS=6;
  const ROOT='ai-assets/ravam/legends/animation-pro/';
  const CONFIG=Object.freeze({
    aurora:{file:'aurora-pro-atlas.png',height:340,accent:'#f2c96d',cacheId:'v31-aurora'},
    petros:{file:'petros-pro-atlas.png',height:270,accent:'#43b7ff',cacheId:'v31-petros'},
    kai_draconis:{file:'kai_draconis-pro-atlas.png',height:270,accent:'#b04cff',cacheId:'v31-kai-draconis'},
    rifana:{file:'rifana-pro-atlas.png',height:270,accent:'#5eead4',cacheId:'v31-rifana'}
  });
  const sources=new Map();
  function load(id,cfg){const image=new Image();image.decoding='async';image.src=ROOT+cfg.file;const info={...cfg,image};sources.set(id,info);return info}
  Object.entries(CONFIG).forEach(([id,cfg])=>load(id,cfg));
  const ready=info=>!!(info?.image?.complete&&info.image.naturalWidth&&info.image.naturalHeight);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  function cell(info,frame){const w=info.image.naturalWidth/COLS,h=info.image.naturalHeight;return{sx:w*clamp(frame,0,COLS-1),sy:0,sw:w,sh:h}}
  function floorY(p){try{return typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0)}catch(_){return 610-(p?.y||0)}}
  function groundY(){try{return GROUND_Y}catch(_){return 610}}
  function motionFor(p){
    if(!window.ProMotion?.motionFor)return null;
    const dist=Number.isFinite(p?.ravamWalkDist)?p.ravamWalkDist:(Number(p?.walkDistance)||0);
    return window.ProMotion.motionFor(Object.assign({},p,{walkDistance:dist}));
  }
  function drawShadow(ctx,p,height){
    const lift=Math.min(.64,Math.max(0,Number(p.y)||0)/450);
    ctx.save();ctx.globalAlpha=(p.state==='ko'?.2:.38)*(1-lift);ctx.fillStyle='#02030a';
    ctx.beginPath();ctx.ellipse(p.x,groundY()+3,height*.24*(1-lift*.4),height*.047*(1-lift*.4),0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawGlow(ctx,p,height){
    const accent=CONFIG[p.id]?.accent||p.color||'#67e8f9';
    ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle=accent;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(p.x,groundY()+2,height*.24,height*.042,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function drawGuard(ctx,p,floor,height){
    ctx.save();ctx.translate(p.x,floor-height*.55);ctx.scale(p.facing||1,1);
    const accent=CONFIG[p.id]?.accent||p.color||'#67e8f9';
    ctx.strokeStyle=p.id==='aurora'?'#fff6d8':'#eafcff';ctx.fillStyle=accent;
    ctx.lineWidth=2;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(8,-height*.39);
    ctx.quadraticCurveTo(height*.47,-height*.23,height*.42,height*.18);
    ctx.quadraticCurveTo(height*.16,height*.34,-5,height*.14);ctx.closePath();ctx.stroke();ctx.globalAlpha=.07;ctx.fill();ctx.restore();
  }
  function drawAttackFx(ctx,p,floor,height,motion){
    if(!motion||!['attack','punch','kick','low','rush','uppercut','special'].includes(motion.kind))return;
    const t=motion.phase||0,impact=Math.sin(clamp((t-.16)/.72,0,1)*Math.PI);if(impact<=.03)return;
    const c=CONFIG[p.id]?.accent||p.color||'#fff';
    ctx.save();ctx.translate(p.x,floor-height*.56);ctx.scale(p.facing||1,1);ctx.globalCompositeOperation='lighter';ctx.strokeStyle=c;ctx.shadowColor=c;ctx.shadowBlur=22;ctx.globalAlpha=.22+.42*impact;
    if(p.id==='rifana'){
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(height*.18,-height*.08,height*(.22+.08*impact),-.8,2.2);ctx.stroke();
      ctx.beginPath();ctx.arc(height*.30,-height*.12,height*(.10+.05*impact),0,Math.PI*2);ctx.stroke();
    }else if(p.id==='aurora'){
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,height*(.30+.06*impact),-.55,2.3);ctx.stroke();
      ctx.beginPath();ctx.arc(height*.16,-height*.1,height*(.15+.04*impact),0,Math.PI*2);ctx.stroke();
    }else if(motion.kind==='kick'||motion.kind==='low'){
      ctx.lineWidth=5;ctx.beginPath();ctx.arc(height*.10,height*.08,height*.34+impact*12,-1.25,.55);ctx.stroke();
    }else if(motion.kind==='uppercut'){
      ctx.lineWidth=5;ctx.beginPath();ctx.arc(height*.10,height*.09,height*.30+impact*10,.65,-1.55,true);ctx.stroke();
    }else if(motion.kind==='special'){
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,height*(.36+.05*impact),0,Math.PI*2);ctx.stroke();
    }else{
      ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(height*.12,0);ctx.lineTo(height*(.48+.12*impact),0);ctx.stroke();
    }
    ctx.restore();
  }
  function drawHitFlash(ctx,p,floor,height){
    if((p.hitFlash||0)<=.035)return;ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha=Math.min(.8,(p.hitFlash||0)*3);
    ctx.beginPath();ctx.moveTo(p.x-18,floor-height*.60-10);ctx.lineTo(p.x+18,floor-height*.60+10);ctx.moveTo(p.x+18,floor-height*.60-10);ctx.lineTo(p.x-18,floor-height*.60+10);ctx.stroke();ctx.restore();
  }
  function drawLegend(ctx,p){
    const info=sources.get(p?.id); if(!p||!info||!ready(info)||!window.ProMotion)return false;
    const motion=motionFor(p); if(!motion)return false;
    const frame=window.ProMotion.sourceFrame(motion), box=cell(info,frame), floor=floorY(p), height=info.height;
    const downed=!!((p.proKnockdownT||0)>0&&p.onGround&&p.state!=='ko');
    drawShadow(ctx,p,height); drawGlow(ctx,p,height);
    ctx.save();ctx.translate(p.x,floor);ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;try{ctx.imageSmoothingQuality='high'}catch(_){ }
    if((p.legendInvulnT||0)>0)ctx.globalAlpha=.68+.25*Math.sin(performance.now()/40);
    if(downed){ctx.translate(-height*.12,-10);ctx.rotate(-Math.PI/2);ctx.translate(0,height*.40)}
    else if(p.state==='ko'){const fall=Math.min(1,(Number(p.stateT)||0)*3.2);ctx.translate(-height*.15,-4);ctx.rotate(-1.12*fall);ctx.globalAlpha*=.42+.4*(1-fall)}
    try{window.ProMotion.paint(ctx,info.cacheId,info.image,box,motion,height)}catch(_){ctx.restore();return false}
    ctx.restore();
    if(p.defend||p.state==='defend'||p.state==='crouch')drawGuard(ctx,p,floor,height);
    drawAttackFx(ctx,p,floor,height,motion);drawHitFlash(ctx,p,floor,height);
    return true;
  }
  const previousDraw=window.drawFighter;
  if(typeof previousDraw==='function')window.drawFighter=function(ctx,p){
    if((p?.id==='aurora'||p?.id==='petros'||p?.id==='kai_draconis'||p?.id==='rifana')&&drawLegend(ctx,p))return;
    return previousDraw.apply(this,arguments);
  };
  function warm(id){const info=sources.get(id);if(!ready(info)||!window.ProMotion?.warm)return;try{window.ProMotion.warm(info.cacheId,info.image,frame=>cell(info,frame))}catch(_){}}
  const oldStart=window.startFight;
  if(typeof oldStart==='function'&&!oldStart.__ravamLegendV31){
    const wrapped=function(){const r=oldStart.apply(this,arguments);setTimeout(()=>{try{if(typeof fight!=='undefined'&&fight){if(fight.p1)warm(fight.p1.id);if(fight.p2)warm(fight.p2.id)}}catch(_){ }},0);return r};
    wrapped.__ravamLegendV31=true;window.startFight=wrapped;
  }
  Object.values(sources).forEach(info=>{info.image.addEventListener('load',()=>{try{if(typeof fight!=='undefined'&&fight){warm(fight.p1?.id);warm(fight.p2?.id)}}catch(_){ }},{once:true})});
  window.RavamLegendsChampionAnimationV31=Object.freeze({version:VERSION,ids:['aurora','petros','kai_draconis','rifana'],engine:'ProMotion'});
})();
