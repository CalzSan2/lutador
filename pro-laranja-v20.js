/* SORTEP NIAK — LARANJA V20.8
 * J = combo de 4 socos rápidos.
 * L = backstep + corridas-relâmpago frente/trás/frente + retorno à posição inicial.
 */
(()=>{
  'use strict';
  if(window.LaranjaV20?.version)return;
  const VERSION='20.9.4-prime-motion';
  const ID='laranja';
  const ORANGE='#ff6a2f', GOLD='#ffbf57', PALE='#fff6ec', WIND='#f4fbff', WIND2='#d9ecf7';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const bell=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
  const worldW=()=>typeof W!=='undefined'?W:1600;
  const ground=()=>typeof GROUND_Y!=='undefined'?GROUND_Y:840;
  const GRAV=()=>typeof GRAVITY!=='undefined'?GRAVITY:-1900;
  const getFight=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const body=p=>{try{return typeof bodyY==='function'?bodyY(p):ground()-(p?.y||0)-82}catch(_){return ground()-82}};
  const floorY=p=>{try{return typeof groundLevel==='function'?groundLevel(p):ground()-(p?.y||0)}catch(_){return ground()-(p?.y||0)}};
  const opponent=(p,f=getFight())=>f?(p===f.p1?f.p2:f.p1):null;
  const slot=(f,name)=>name==='p2'?f?.p2:f?.p1;
  const setPState=(p,s)=>{try{if(typeof setState==='function')setState(p,s);else{p.state=s;p.stateT=0}}catch(_){p.state=s;p.stateT=0}};
  const hitFx=(x,y,c=ORANGE,n=3)=>{try{spark?.(x,y,c,Math.min(2,n))}catch(_){}};
  const sound=(name='attack_light',v=.72)=>{try{SFX?.play?.(name,v)}catch(_){}};
  const toast=t=>{try{window.LutadorV6?.toast?.(t,'normal',1600)||mixToast?.(t)}catch(_){}};

  const POSE_FILES=[
    'ai-assets/characters/laranja/poses/laranja-0-idle.png',
    'ai-assets/characters/laranja/poses/laranja-1-run.png',
    'ai-assets/characters/laranja/poses/laranja-2-punch.png',
    'ai-assets/characters/laranja/poses/laranja-3-crouch.png',
    'ai-assets/characters/laranja/poses/laranja-4-guard.png',
    'ai-assets/characters/laranja/poses/laranja-5-kick.png'
  ];
  const POSES=POSE_FILES.map(src=>{const i=new Image();i.decoding='async';i.src=src;return i});
  const BASE_SCALES=[0.86,0.85,0.84,0.84,0.84,0.86];
  // Todos os sprites têm 38px transparentes abaixo dos pés. Compensar isso ancora o pé no piso real.
  const BOTTOM_PAD=[38,38,38,38,38,38];

  function ensureFight(f){
    if(!f)return;
    if(!Array.isArray(f.laranjaBursts))f.laranjaBursts=[];
    if(!Array.isArray(f.laranjaImpacts))f.laranjaImpacts=[];
    if(!Array.isArray(f.laranjaTrails))f.laranjaTrails=[];
  }
  function init(p){
    if(!p||p.id!==ID)return;
    if(!p.laranjaBoosted){const base=Math.max(Number(p.speed)||0,170);p.laranjaBaseSpeed=base;p.speed=base*3;p.laranjaBoosted=true}
    if(!Number.isFinite(p.laranjaTrailCd))p.laranjaTrailCd=0;
    if(!Number.isFinite(p.laranjaHitFlash))p.laranjaHitFlash=0;
    if(!Number.isFinite(p.laranjaMoveAura))p.laranjaMoveAura=0;
    if(p.laranjaCombo===undefined)p.laranjaCombo=null;
    if(p.laranjaFlash===undefined)p.laranjaFlash=null;
  }
  function addTrail(f,p,frame=1,life=.14,alpha=.18){ensureFight(f);if(f.laranjaTrails.length>=4)f.laranjaTrails.splice(0,f.laranjaTrails.length-3);f.laranjaTrails.push({x:p.x,floor:floorY(p)-3,frame,facing:p.facing||1,life,maxLife:life,alpha});}
  function addImpact(f,x,y,strong=false,color=null){ensureFight(f);if(f.laranjaImpacts.length>=5)f.laranjaImpacts.shift();f.laranjaImpacts.push({x,y,strong,color,life:strong?.36:.22,maxLife:strong?.36:.22});}
  function addBurst(f,x,y,r=80,life=.34,dir=1){ensureFight(f);if(f.laranjaBursts.length>=3)f.laranjaBursts.shift();f.laranjaBursts.push({x,y,r,life,maxLife:life,phase:Math.random()*6.28,dir});}
  function applyDamage(target,amount,owner,dir,type){if(!target||target.state==='ko')return;try{damage(target,amount,{owner,laranjaV20:true},dir,type)}catch(_){try{window.damage?.(target,amount,{owner},dir,type)}catch(__){}}}

  function speedCombo(p){
    const f=getFight();if(!f||!p||p.state==='ko')return false;ensureFight(f);init(p);
    if(p.laranjaCombo||p.laranjaFlash||p.throwCd>0||p.attackDisabledT>0)return false;
    const target=opponent(p,f);if(!target||target.state==='ko')return false;
    const dir=Math.sign(target.x-p.x)||p.facing||1;p.facing=p.manualFacing=dir;
    const fromX=p.x,toX=clamp(target.x-dir*82,28,worldW()-28);
    p.laranjaCombo={t:0,duration:.56,targetSlot:target.playerSlot,fromX,toX,hitMask:0,lastTrail:0};
    p.throwCd=.68;p.vx=0;setPState(p,'throw');addTrail(f,p,1,.18,.24);hitFx(fromX,body(p),ORANGE,8);sound('attack_light',.80);return true;
  }
  function flashSpecial(p){
    const f=getFight();if(!f||!p||p.state==='ko')return false;ensureFight(f);init(p);
    if(p.laranjaCombo||p.laranjaFlash||p.specialCd>0||p.attackDisabledT>0)return false;
    const target=opponent(p,f);if(!target||target.state==='ko')return false;
    const dir=Math.sign(target.x-p.x)||p.facing||1;
    p.facing=p.manualFacing=dir;p.vx=0;
    p.laranjaFlash={
      phase:0,time:0,lastTrail:0,targetSlot:target.playerSlot,startX:p.x,dir,
      hits:0,doneMask:0,
      segs:[0.085,0.075,0.075,0.075,0.095],finisher:false
    };
    p.specialCd=Math.max(p.specialCd||0,6.2);setPState(p,'special');
    addBurst(f,p.x,body(p)-12,92,.28,dir);hitFx(p.x,body(p),PALE,12);sound('attack_heavy',.94);toast('LARANJA · CADEIA RELÂMPAGO');
    return true;
  }

  const oldPlayerInput=window.playerInput;
  if(typeof oldPlayerInput==='function')window.playerInput=function(p){
    if(p?.id===ID&&p.human&&p.state!=='ko'){
      init(p);const key=p.playerSlot==='p2'?'Numpad1':'KeyJ';
      if(window.justPressed?.[key]&&p.throwCd<=0&&p.attackDisabledT<=0&&!p.laranjaCombo&&!p.laranjaFlash&&p.state!=='hurt'&&p.state!=='special'){
        if(speedCombo(p)){window.justPressed[key]=false;return;}
      }
    }
    return oldPlayerInput.apply(this,arguments);
  };
  const oldThrow=window.throwProjectile;
  if(typeof oldThrow==='function')window.throwProjectile=function(p){if(p?.id===ID){speedCombo(p);return}return oldThrow.apply(this,arguments)};
  const oldSpecial=window.castSpecial;
  if(typeof oldSpecial==='function')window.castSpecial=function(p){if(p?.id===ID){flashSpecial(p);return}return oldSpecial.apply(this,arguments)};

  const HIT_TIMES=[.105,.195,.285,.405];
  function stepCombo(f,p,dt){
    const c=p.laranjaCombo;if(!c)return;const target=slot(f,c.targetSlot);
    c.t+=dt;p.vx=0;p.state='throw';p.stateT=Math.min(p.stateT||0,.25);
    const dashN=smooth(c.t/.09);
    if(target&&target.state!=='ko')c.toX=clamp(target.x-(p.facing||1)*82,28,worldW()-28);
    if(c.t<.11)p.x=lerp(c.fromX,c.toX,dashN);
    else if(target&&target.state!=='ko')p.x=lerp(p.x,clamp(target.x-(p.facing||1)*80,28,worldW()-28),clamp(dt*10,0,1));
    c.lastTrail-=dt;if(c.lastTrail<=0&&c.t<.50){c.lastTrail=.07;addTrail(f,p,c.t<.08?1:2,.11,.16)}
    for(let i=0;i<HIT_TIMES.length;i++){
      const bit=1<<i;if((c.hitMask&bit)||c.t<HIT_TIMES[i])continue;c.hitMask|=bit;
      if(!target||target.state==='ko')continue;
      const dir=Math.sign(target.x-p.x)||p.facing||1;p.facing=p.manualFacing=dir;
      const close=Math.abs(target.x-p.x)<160&&Math.abs((target.y||0)-(p.y||0))<115;if(!close)continue;
      const last=i===3,amount=(p.dmg||45)*(last?.46:.28);
      applyDamage(target,amount,p,dir,'laranja-speed-punch');
      if(target.state!=='ko')target.x=clamp(target.x+dir*(last?56:8),28,worldW()-28);
      p.laranjaHitFlash=.10;addImpact(f,target.x,body(target)-(i%2?20:40),last,last?PALE:GOLD);hitFx(target.x,body(target)-(i%2?18:40),last?PALE:ORANGE,last?12:8);sound(last?'attack_heavy':'attack_light',last?.80:.55);
    }
    if(c.t>=c.duration){p.laranjaCombo=null;p.laranjaHitFlash=0;if(p.state!=='hurt'&&p.state!=='ko')setPState(p,p.onGround?'idle':'air')}
  }

  function doPhaseHit(f,p,target,phase,dir){
    const bit=1<<phase;if((p.laranjaFlash.doneMask&bit)||!target||target.state==='ko')return;
    p.laranjaFlash.doneMask|=bit;
    const amounts=[0,1.05,1.25,1.60,0]; // super aprimorado: três impactos muito mais fortes
    const dmg=(p.dmg||45)*amounts[phase];
    if(dmg>0){
      applyDamage(target,dmg,p,dir,'laranja-flash-chain');
      if(target.state!=='ko'){
        target.x=clamp(target.x+dir*(phase===3?82:48),28,worldW()-28);
        if(phase===3){target.vy=Math.max(target.vy||0,240);target.onGround=false;target.y=Math.max(10,target.y||0)}
      }
      addImpact(f,target.x,body(target)-24,phase===3,PALE);addBurst(f,target.x,body(target)-20,phase===3?122:86,.26,dir);hitFx(target.x,body(target)-18,PALE,phase===3?18:12);
      sound(phase===3?'attack_heavy':'attack_light',phase===3?.88:.70);
    }
  }
  function stepFlash(f,p,dt){
    const s=p.laranjaFlash;if(!s)return;const target=slot(f,s.targetSlot);
    p.state='special';p.stateT=Math.min(p.stateT||0,.42);p.vx=0;p.laranjaMoveAura=.18;
    s.time+=dt;s.lastTrail-=dt;
    const dir=s.dir;
    const targetX=target&&target.state!=='ko'?target.x:s.startX+dir*140;
    const frontX=clamp(targetX-dir*86,36,worldW()-36);
    const backX=clamp(targetX+dir*86,36,worldW()-36);
    const seq=[
      {from:s.startX,to:clamp(s.startX-dir*170,36,worldW()-36),face:dir,hit:false},       // recua
      {from:clamp(s.startX-dir*170,36,worldW()-36),to:frontX,face:dir,hit:true},           // frente
      {from:frontX,to:backX,face:-dir,hit:true},                                             // trás
      {from:backX,to:frontX,face:dir,hit:true},                                              // frente
      {from:frontX,to:s.startX,face:-dir,hit:false}                                          // volta origem
    ];
    while(s.phase<seq.length){
      const dur=s.segs[s.phase],n=s.time/dur,seg=seq[s.phase];
      if(n<1){
        const k=smooth(n);p.x=lerp(seg.from,seg.to,k);p.facing=p.manualFacing=seg.face;
        if(s.lastTrail<=0){s.lastTrail=.055;addTrail(f,p,1,.11,.15)}
        if(Math.random()<.10)addBurst(f,p.x,body(p)-24,42,.12,p.facing);
        break;
      }
      // finalize current phase
      p.x=seg.to;p.facing=p.manualFacing=seg.face;addBurst(f,p.x,body(p)-26,s.phase===0?94:76,.20,p.facing);
      if(seg.hit&&target&&target.state!=='ko')doPhaseHit(f,p,target,s.phase,Math.sign(target.x-p.x)||p.facing||1);
      s.time-=dur;s.phase++;
      if(s.phase>=seq.length){
        if(!s.finisher&&target&&target.state!=='ko'){
          s.finisher=true;const hitDir=Math.sign(target.x-p.x)||dir||1;
          applyDamage(target,(p.dmg||45)*1.05,p,hitDir,'laranja-flash-finisher');
          target.vx=hitDir*520;target.vy=Math.max(target.vy||0,410);target.onGround=false;target.y=Math.max(12,target.y||0);target.attackDisabledT=Math.max(target.attackDisabledT||0,.32);
          addImpact(f,target.x,body(target)-28,true,'#fff8cf');addBurst(f,target.x,body(target)-24,178,.52,hitDir);hitFx(target.x,body(target)-24,PALE,18);sound('attack_heavy',1);
        }
        p.laranjaFlash=null;if(p.state!=='hurt'&&p.state!=='ko')setPState(p,p.onGround?'idle':'air');break
      }
    }
  }

  function updateLaranja(f,dt){
    if(!f||dt<=0)return;ensureFight(f);
    for(const p of [f.p1,f.p2])if(p){
      if(p.id!==ID)continue;init(p);
      p.x=clamp(p.x,96,worldW()-96);
      p.laranjaHitFlash=Math.max(0,(p.laranjaHitFlash||0)-dt);
      p.laranjaMoveAura=Math.max(0,(p.laranjaMoveAura||0)-dt);
      stepCombo(f,p,dt);stepFlash(f,p,dt);
      p.laranjaTrailCd=Math.max(-.1,(p.laranjaTrailCd||0)-dt);
      const moving=Math.abs(p.vx||0)>12&&p.state!=='hurt'&&p.state!=='ko'&&!p.laranjaCombo&&!p.laranjaFlash;
      if(moving&&p.laranjaTrailCd<=0){p.laranjaTrailCd=.085;addTrail(f,p,1,.10,p.onGround?.10:.08)}
    }
    for(const e of f.laranjaImpacts)e.life-=dt;f.laranjaImpacts=f.laranjaImpacts.filter(e=>e.life>0).slice(-5);
    for(const t of f.laranjaTrails)t.life-=dt;f.laranjaTrails=f.laranjaTrails.filter(t=>t.life>0).slice(-4);
    for(const e of f.laranjaBursts){e.life-=dt;e.phase+=dt*9}f.laranjaBursts=f.laranjaBursts.filter(e=>e.life>0).slice(-3);
  }

  const oldUpdate=window.update;
  if(typeof oldUpdate==='function')window.update=function(f,dt){const r=oldUpdate.apply(this,arguments);if(f&&!f.paused&&!f.over)updateLaranja(f,Math.min(.034,Math.max(0,dt||0)));return r};
  const oldStart=window.startFight;
  if(typeof oldStart==='function')window.startFight=function(){const r=oldStart.apply(this,arguments);const f=getFight();if(f){f.laranjaBursts=[];f.laranjaImpacts=[];f.laranjaTrails=[];init(f.p1);init(f.p2);if(f.p1?.id===ID)f.p1.laranjaFlash=f.p1.laranjaCombo=null;if(f.p2?.id===ID)f.p2.laranjaFlash=f.p2.laranjaCombo=null}return r};

  function poseReady(i){const img=POSES[i];return img?.complete&&img.naturalWidth?img:null}
  function drawPose(ctx,index,scale=1,alpha=1,dx=0,dy=0,rotation=0,flip=1){
    const img=poseReady(index)||poseReady(0);if(!img||alpha<=0)return null;const finalScale=scale*(BASE_SCALES[index]||.84),w=img.naturalWidth*finalScale,h=img.naturalHeight*finalScale,foot=(BOTTOM_PAD[index]||38)*finalScale;ctx.save();ctx.globalAlpha*=alpha;ctx.translate(dx,dy);ctx.rotate(rotation);ctx.scale(flip,1);ctx.drawImage(img,-w/2,-h+foot,w,h);ctx.restore();return {w,h,foot};
  }
  const comboProgress=p=>p.laranjaCombo?clamp(p.laranjaCombo.t/p.laranjaCombo.duration,0,1):0;
  function drawCombo(ctx,p){const c=p.laranjaCombo,n=comboProgress(p),pulse=Math.sin(n*Math.PI*8),hit=Math.min(3,Math.max(0,Math.floor(c.t/.105))),side=hit%2===0?1:-1;ctx.save();ctx.translate(side*3.2,-Math.abs(pulse)*2.2);ctx.rotate(side*.026*pulse);drawPose(ctx,2,1,1);ctx.restore();ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=hit===3?PALE:GOLD;ctx.lineWidth=hit===3?6:4;ctx.globalAlpha=.24+.22*Math.abs(pulse);ctx.beginPath();const cy=-96+(hit%2)*20,cx=side*18;ctx.moveTo(cx-12,cy);ctx.quadraticCurveTo(58,cy-14,112,cy+side*5);ctx.stroke();ctx.restore();}
  function drawKick(ctx,p){const m=p.proMove,d=Math.max(.001,m?.duration||.47),n=clamp((m?.time||0)/d,0,1),strike=bell(n,.10,.34,.66,.90);ctx.save();ctx.translate(strike*9,-strike*2);ctx.rotate(-.022*strike);drawPose(ctx,5,1,1);ctx.restore();if(strike>.05){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=GOLD;ctx.lineWidth=5;ctx.globalAlpha=.18+.38*strike;ctx.beginPath();ctx.arc(48,-76,58,-1.14,.62);ctx.stroke();ctx.restore()}}
  function drawWalk(ctx,p){const phase=((p.walkDistance||0)/92)%1,a=phase*Math.PI*2,speed=clamp(Math.abs(p.vx||0)/Math.max(1,p.speed||170),.65,1.95),bob=Math.abs(Math.sin(a))*4.2,lean=.018*Math.sign(p.vx||p.facing||1)+Math.sin(a)*.012*speed,sway=Math.sin(a)*6.2*speed;ctx.save();ctx.translate(sway*.14,-bob);ctx.rotate(-lean);drawPose(ctx,1,1,1);ctx.restore();}
  function drawFlash(ctx,p){const s=p.laranjaFlash,ph=s?.phase||0;if(ph===0){ctx.save();ctx.translate(0,-2);ctx.rotate(-s.dir*.04);drawPose(ctx,1,1,1);ctx.restore()}else{ctx.save();ctx.translate(0,-2);ctx.rotate(-(p.facing||1)*.03);drawPose(ctx,2,1,1);ctx.restore()}}
  function drawLaranjaFighter(ctx,p){
    const idle=poseReady(0);if(!idle)return false;init(p);const floor=floorY(p)-3,time=performance.now()/1000,kick=p.proMove?.kind==='kick',punch=p.proMove?.kind==='punch';
    ctx.save();ctx.globalAlpha=.28;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,ground()+4,kick?48:40,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(p.x,floor);ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(p.laranjaFlash)drawFlash(ctx,p);
    else if(p.laranjaCombo)drawCombo(ctx,p);
    else if(kick)drawKick(ctx,p);
    else if(punch)drawPose(ctx,2,1,1,2,-1,-.01,1);
    else if(p.defend||p.state==='defend')drawPose(ctx,4,1,1);
    else if(p.state==='crouch')drawPose(ctx,3,1,1);
    else if((p.proKnockdownT||0)>0&&p.onGround&&p.state!=='ko'){ctx.translate(-8,-13);ctx.rotate(-Math.PI/2);drawPose(ctx,3,.98,.90,0,60,0,1)}
    else if(p.state==='hurt')drawPose(ctx,1,.98,.92,-3,0,.025,1);
    else if(p.state==='ko'){ctx.translate(-8,-14);ctx.rotate(-Math.PI/2);drawPose(ctx,3,.98,.72,0,58,0,1)}
    else if(!p.onGround||p.state==='air')drawPose(ctx,1,.98,1,0,-6,-.03,1);
    else if(Math.abs(p.vx||0)>7)drawWalk(ctx,p);
    else{const bob=Math.sin(time*3.4+p.x*.012)*1.1;drawPose(ctx,0,1,1,0,-bob,Math.sin(time*2.2)*.004,1)}
    ctx.restore();
    if((p.laranjaHitFlash||0)>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(p.laranjaHitFlash/.1,0,1);ctx.strokeStyle=PALE;ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x+(p.facing||1)*68,floor-96,22,0,Math.PI*2);ctx.stroke();ctx.restore()}
    return true;
  }
  const oldDrawFighter=window.drawFighter;
  if(typeof oldDrawFighter==='function')window.drawFighter=function(ctx,p){if(p?.id===ID&&drawLaranjaFighter(ctx,p))return;return oldDrawFighter.apply(this,arguments)};

  function drawTrail(ctx,t){const img=poseReady(t.frame)||poseReady(1);if(!img)return;const a=clamp(t.life/t.maxLife,0,1)*t.alpha;ctx.save();ctx.globalAlpha=a;ctx.translate(t.x,t.floor);ctx.scale(t.facing||1,1);drawPose(ctx,t.frame,1,1);ctx.restore()}
  function drawImpact(ctx,e){const n=clamp(e.life/e.maxLife,0,1),t=1-n,r=(e.strong?18:9)+t*(e.strong?48:22),col=e.color||(e.strong?PALE:GOLD);ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=n*.72;ctx.strokeStyle=col;ctx.lineWidth=e.strong?4:2.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();if(e.strong){ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke()}ctx.restore()}
  function drawBurst(ctx,e){const n=clamp(e.life/e.maxLife,0,1),r=e.r*(1+(1-n)*.18);ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=.28*n;ctx.strokeStyle=GOLD;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,r*.58,18,e.phase,0,Math.PI*2);ctx.stroke();ctx.restore()}
  function drawLaranjaFx(ctx,f){if(!ctx||!f)return;ensureFight(f);for(const t of f.laranjaTrails)drawTrail(ctx,t);for(const e of f.laranjaBursts)drawBurst(ctx,e);for(const e of f.laranjaImpacts)drawImpact(ctx,e);for(const p of [f.p1,f.p2])if(p?.id===ID&&p.human){const x=p===f.p1?34:worldW()-344,y=142;ctx.save();ctx.fillStyle='rgba(13,7,4,.76)';ctx.strokeStyle=ORANGE;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,312,48,10);ctx.fill();ctx.stroke();ctx.fillStyle='#fff4e8';ctx.font='900 11px Oxanium,Arial';ctx.textAlign='left';ctx.fillText('LARANJA · VELOCIDADE ×3',x+12,y+17);ctx.fillStyle=GOLD;ctx.font='800 12px Oxanium,Arial';ctx.fillText('J · 4 SOCOS   |   L · CADEIA RELÂMPAGO SUPREMA',x+12,y+36);ctx.restore()}}
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){const r=oldDraw.apply(this,arguments);try{drawLaranjaFx(canvas.getContext('2d'),f)}catch(_){}return r};

  window.LaranjaV20=Object.freeze({version:VERSION,combo:speedCombo,special:flashSpecial});
})();
