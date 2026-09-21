/* SORTEP NIAK — PETROS + KAI DRACONIS · ANIMAÇÃO V25
 * Sprites reais extraídos das folhas aprovadas pelo usuário.
 * Idle, passos por distância (sem patinar), pulo, defesa, soco, chute e ataque/poder.
 */
(()=>{
  'use strict';
  if(window.PetrosKaiAnimationV25?.version)return;
  const VERSION='25.0.0-petros-kai-sprite-motion';
  const IDS=new Set(['petros','kai_draconis']);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
  const load=(src)=>{const i=new Image();i.decoding='async';i.src=src;return i};
  const CONFIG={
    petros:{accent:'#43b7ff',folder:'petros',height:252,step:24,afterimages:3},
    kai_draconis:{accent:'#b04cff',folder:'kai_draconis',height:252,step:28,afterimages:0}
  };
  const SPRITES={};
  for(const [id,c] of Object.entries(CONFIG)){
    SPRITES[id]={...c,imgs:Array.from({length:6},(_,n)=>load(`ai-assets/ravam/legends/animation/${c.folder}/${c.folder}-${n}.png`))};
  }

  function strikeInfo(p){
    const kind=p?.proMove?.kind;
    if(!['punch','kick','uppercut'].includes(kind))return null;
    const duration=Math.max(.12,Number(p.proMove?.duration)||.34);
    const n=clamp((Number(p.proMove?.time)||0)/duration,0,1);
    if(n<.22)return {kind,phase:'windup',t:smooth(n/.22),n};
    if(n<.66)return {kind,phase:'impact',t:easeOut((n-.22)/.44),n};
    return {kind,phase:'recover',t:smooth((n-.66)/.34),n};
  }
  function choosePose(p,s){
    const strike=strikeInfo(p);
    if(strike){
      if(strike.kind==='punch')return {frame:4,strike};
      if(strike.kind==='kick')return {frame:2,strike};
      return {frame:3,strike};
    }
    if(p?.state==='ko'||((p?.proKnockdownT||0)>0&&p?.onGround))return {frame:5,ko:true};
    if(p?.defend||p?.state==='defend'||p?.state==='crouch')return {frame:5,guard:true};
    if(p?.state==='hurt'||(p?.hitFlash||0)>.035)return {frame:5,hurt:true};
    if(p?.state==='throw'||p?.state==='special'||(p?.legendCastT||0)>0)return {frame:3,cast:true};
    if(!p?.onGround){
      const jt=Number(p?.jumpT)||0;
      return {frame:jt<.11?3:2,air:true};
    }
    if(Math.abs(Number(p?.vx)||0)>7){
      const dist=Number(p?.ravamWalkDist||p?.walkDistance||0);
      const raw=dist/Math.max(18,s.step);
      const seq=[1,0,2,0];
      return {frame:seq[Math.floor(raw)%seq.length],walk:true,phase:raw*Math.PI/2,raw};
    }
    return {frame:0,idle:true};
  }
  function good(img){return !!(img?.complete&&img.naturalWidth&&img.naturalHeight)}
  function drawSprite(ctx,img,height,alpha=1){
    if(!good(img))return false;
    const scale=height/img.naturalHeight,w=img.naturalWidth*scale,h=img.naturalHeight*scale;
    ctx.globalAlpha*=alpha;ctx.drawImage(img,-w/2,-h,w,h);return true;
  }
  function floorY(p){try{return typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0)}catch(_){return 610-(p?.y||0)}}
  function drawShadow(ctx,p,height){
    const air=Math.max(0,Number(p?.y)||0),sh=Math.max(.28,1-air/440);
    ctx.save();ctx.globalAlpha=.27*sh;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,(typeof GROUND_Y!=='undefined'?GROUND_Y:610)+4,48*sh,8*sh,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawAfterimages(ctx,p,s,img,floor,pose){
    if(!s.afterimages||!good(img)||!pose.walk||Math.abs(p.vx||0)<220)return;
    const dir=p.facing||1,speed=clamp(Math.abs(p.vx||0)/900,.25,1.2);
    for(let i=s.afterimages;i>=1;i--){
      ctx.save();ctx.translate(p.x-dir*(18+i*17)*speed,floor+1+i*.5);ctx.scale(dir,1);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.05+i*.025;ctx.filter=`saturate(1.35) brightness(${1.02+i*.04})`;drawSprite(ctx,img,s.height*(1-.01*i),1);ctx.restore();
    }
  }
  function attackFx(ctx,p,s,pose,floor){
    const st=pose.strike;if(!st||st.phase!=='impact')return;
    const t=st.t||0,dir=p.facing||1;
    ctx.save();ctx.translate(p.x,floor-s.height*.49);ctx.scale(dir,1);ctx.globalCompositeOperation='lighter';ctx.strokeStyle=s.accent;ctx.shadowColor=s.accent;ctx.shadowBlur=24;ctx.globalAlpha=.78*(1-.28*t);
    if(st.kind==='kick'){
      ctx.lineWidth=7;ctx.beginPath();ctx.arc(24,18,78+20*t,-1.28,.25);ctx.stroke();
      ctx.lineWidth=2;ctx.globalAlpha*=.65;ctx.beginPath();ctx.arc(22,18,93+18*t,-1.18,.13);ctx.stroke();
    }else if(st.kind==='uppercut'){
      ctx.lineWidth=6;ctx.beginPath();ctx.arc(18,25,62+17*t,.55,-1.55,true);ctx.stroke();
    }else{
      ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(38,0);ctx.lineTo(130+32*t,-2);ctx.stroke();
      ctx.lineWidth=2;ctx.globalAlpha*=.55;ctx.beginPath();ctx.moveTo(30,12);ctx.lineTo(116+28*t,8);ctx.stroke();
    }
    ctx.restore();
  }
  function castFx(ctx,p,s,floor){
    const time=performance.now()/1000;
    ctx.save();ctx.translate(p.x,floor-s.height*.53);ctx.globalCompositeOperation='lighter';ctx.strokeStyle=s.accent;ctx.shadowColor=s.accent;ctx.shadowBlur=28;ctx.lineWidth=3;ctx.globalAlpha=.42+.16*Math.sin(time*13);ctx.beginPath();ctx.arc(0,0,52+5*Math.sin(time*10),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(0,0,70+7*Math.cos(time*9),0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function drawAnimated(ctx,p){
    const s=SPRITES[p?.id];if(!s)return false;
    const pose=choosePose(p,s),img=s.imgs[pose.frame];if(!good(img))return false;
    const floor=floorY(p),time=performance.now()/1000,dir=p.facing||1;
    drawShadow(ctx,p,s.height);
    drawAfterimages(ctx,p,s,img,floor,pose);
    ctx.save();ctx.translate(p.x,floor);ctx.scale(dir,1);ctx.imageSmoothingEnabled=true;try{ctx.imageSmoothingQuality='high'}catch(_){}
    if((p.legendInvulnT||0)>0)ctx.globalAlpha=.62+.30*Math.sin(time*25);
    if(pose.idle){const b=Math.sin(time*2.65+(p.playerSlot==='p2'?1.1:0));ctx.translate(0,-2.2-1.4*b);ctx.rotate(.006*b);ctx.scale(1+.004*b,1-.006*b)}
    if(pose.walk){const ph=pose.phase||0,run=clamp(Math.abs(p.vx||0)/Math.max(1,p.speed||100),0,1.35);ctx.translate(4*run,-2.1-Math.abs(Math.sin(ph))*3.2);ctx.rotate(-.012-.025*run+Math.sin(ph)*.01);const squash=.006*Math.cos(ph);ctx.scale(1+squash,1-squash)}
    if(pose.air){const vy=Number(p.vy)||0;ctx.translate(4,-7);ctx.rotate(clamp(-vy/6500,-.11,.11));const stretch=clamp(Math.abs(vy)/2600,0,.04);ctx.scale(1-stretch*.55,1+stretch)}
    if(pose.guard){ctx.translate(-3,-1);ctx.scale(.99,1.01)}
    if(pose.hurt){ctx.translate(-10,-2);ctx.rotate(.055)}
    if(pose.cast){const cast=clamp((p.stateT||0)*4.5,0,1),e=easeOut(cast);ctx.translate(6*e,-4*e);ctx.rotate(-.025*e);ctx.scale(1+.012*e,1-.006*e)}
    if(pose.strike){const st=pose.strike;if(st.phase==='windup'){ctx.translate(-12*st.t,2*st.t);ctx.rotate(.05*st.t)}else if(st.phase==='impact'){const kick=st.kind==='kick';ctx.translate((kick?25:22)*st.t,-(kick?8:4)*st.t);ctx.rotate((kick?-.09:-.045)*(1-.22*st.t));if(kick)ctx.scale(1.04,1)}else{const e=1-st.t;ctx.translate(10*e,-3*e);ctx.rotate(-.03*e)}}
    if(pose.ko){ctx.translate(-15,-12);ctx.rotate(-Math.PI/2);ctx.translate(0,s.height*.35)}
    drawSprite(ctx,img,s.height,1);
    ctx.restore();
    if(pose.cast)castFx(ctx,p,s,floor);
    attackFx(ctx,p,s,pose,floor);
    return true;
  }

  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function'){
    window.drawFighter=function(ctx,p){
      if(IDS.has(p?.id)&&drawAnimated(ctx,p))return;
      return baseDrawFighter.apply(this,arguments);
    };
  }
  window.PetrosKaiAnimationV25=Object.freeze({version:VERSION,ids:[...IDS],frames:6});
})();
