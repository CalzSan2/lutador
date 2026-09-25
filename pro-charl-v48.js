/* Charl e Charlito V50: passos interpolados, antecipação de golpe e transformação fluida. */
(()=>{
  'use strict';
  if(window.CharlV50)return;
  const cyan='#56dfff',silver='#d9e5ef';
  const normal=new Image(),mega=new Image(),normalPoses=new Image(),megaPoses=new Image();
  normal.src='ai-assets/characters/charl.png';
  mega.src='ai-assets/characters/charlito.png';
  normalPoses.src='ai-assets/characters/charl-poses-v49.png';
  megaPoses.src='ai-assets/characters/charlito-poses-v49.png';
  const activeFight=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const body=p=>typeof bodyY==='function'?bodyY(p):840-(p.y||0)-75;
  function shots(f){if(!Array.isArray(f.charlShots))f.charlShots=[];return f.charlShots}
  function fire(p){
    const f=activeFight();if(!f||!p||p.state==='ko')return false;
    const giant=(p.charlitoT||0)>0,dir=p.facing||1,y=body(p)-12;
    p.throwCd=giant?.48:.62;
    try{setState(p,'throw')}catch(_){p.state='throw';p.stateT=0}
    const batch=giant
      ?[{kind:'rocket',x:p.x+dir*42,y:y-5,vx:dir*680,damage:Math.max(80,(p.dmg||34)*2.5),r:23,life:1.6}]
      :[{kind:'screw',x:p.x+dir*32,y:y-18,vx:dir*850,damage:Math.max(23,(p.dmg||34)*.78),r:8,life:1.35},
        {kind:'plate',x:p.x+dir*30,y:y+12,vx:dir*620,damage:Math.max(31,(p.dmg||34)*1.05),r:18,life:1.45}];
    for(const q of batch)shots(f).push({...q,ownerSlot:p.playerSlot,spin:0,dead:false});
    if(shots(f).length>24)shots(f).splice(0,shots(f).length-24);
    try{SFX.play(giant?'attack_heavy':'attack_light',.55)}catch(_){}
    return true;
  }
  function transform(p){
    if(!p||p.state==='ko')return false;
    p.charlitoT=6;p.specialCd=Math.max(p.specialCd||0,8.5);
    try{setState(p,'special')}catch(_){p.state='special';p.stateT=0}
    try{spark(p.x,body(p),cyan,40);mixToast('CHARLITO · MEGATRON ATIVO POR 6s')}catch(_){}
    try{SFX.play('super',.75)}catch(_){}
    return true;
  }
  const oldThrow=window.throwProjectile;
  if(typeof oldThrow==='function')window.throwProjectile=function(p){if(p?.id==='charl')return fire(p);return oldThrow.apply(this,arguments)};
  const oldSpecial=window.castSpecial;
  if(typeof oldSpecial==='function')window.castSpecial=function(p){if(p?.id==='charl')return transform(p);return oldSpecial.apply(this,arguments)};
  const oldUpdate=window.update;
  if(typeof oldUpdate==='function')window.update=function(f,dt){
    const result=oldUpdate.apply(this,arguments);
    if(!f||f.paused||f.over||!Number.isFinite(dt))return result;
    for(const p of [f.p1,f.p2])if(p?.id==='charl'&&p.charlitoT>0)p.charlitoT=Math.max(0,p.charlitoT-dt);
    if(f.mode==='lan'&&window.__lan?.role==='guest')return result;
    const list=shots(f);
    for(const q of list){
      if(q.dead)continue;q.life-=dt;q.x+=q.vx*dt;q.spin+=dt*(q.kind==='plate'?13:7);
      const owner=q.ownerSlot==='p2'?f.p2:f.p1,target=q.ownerSlot==='p2'?f.p1:f.p2;
      if(!owner||!target||target.state==='ko'||q.life<=0||q.x<-80||q.x>1680){q.dead=true;continue}
      if(Math.abs(q.x-target.x)<q.r+27&&Math.abs(q.y-body(target))<q.r+58){
        q.dead=true;try{damage(target,q.damage,{owner,proKind:q.kind},Math.sign(q.vx)||1,'charl-'+q.kind)}catch(err){console.warn('[CHARL]',err)}
        if(q.kind==='rocket')try{spark(q.x,q.y,'#ffb45e',32)}catch(_){}
      }
    }
    f.charlShots=list.filter(q=>!q.dead).slice(-24);
    return result;
  };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  function drawPose(ctx,img,sheet,frame,h){
    const useSheet=sheet.complete&&sheet.naturalWidth&&(frame>=0||!img.complete||!img.naturalWidth);
    const source=useSheet?sheet:img,drawFrame=Math.max(0,frame);
    if(!source.complete||!source.naturalWidth)return false;
    const sw=useSheet?source.naturalWidth/2:source.naturalWidth;
    const sh=useSheet?source.naturalHeight/2:source.naturalHeight;
    const sx=useSheet?(drawFrame%2)*sw:0,sy=useSheet?Math.floor(drawFrame/2)*sh:0;
    const w=h*sw/sh;
    ctx.drawImage(source,sx,sy,sw,sh,-w/2,-h,w,h);
    return true;
  }
  function drawRobot(ctx,p,giant){
    const img=giant?mega:normal,sheet=giant?megaPoses:normalPoses;
    if((!img.complete||!img.naturalWidth)&&(!sheet.complete||!sheet.naturalWidth))return false;
    const f=activeFight(),isIsland=!!p.__islandDummyFight&&f===p.__islandDummyFight;
    const h=giant?(isIsland?150:300):(isIsland?116:232),floor=typeof groundLevel==='function'?groundLevel(p):840-(p.y||0),time=performance.now()/1000;
    const move=p.proMove,kind=String(move?.kind||''),duration=Math.max(.1,Number(move?.duration)||.48);
    const islandPowerLength=(p.charlitoT||0)>5.4?.62:(p.charlitoT||0)>0?.42:.38;
    const progress=move?clamp((move.time||0)/duration,0,1):isIsland&&p.charlAttackT>0?clamp(1-p.charlAttackT/islandPowerLength,0,1):clamp((p.stateT||0)/.5,0,1);
    const walking=Math.abs(p.vx||0)>9&&p.onGround,guard=p.defend||p.state==='defend';
    const attacking=!!move||['throw','attack','special'].includes(p.state),hurt=p.state==='hurt',ko=p.state==='ko',air=!p.onGround||p.state==='air';
    const speed=clamp(Math.abs(p.vx||0)/300,0,1.8),elapsed=clamp(time-(p.charlGaitAt??time),0,.05);
    p.charlGaitAt=time;
    if(walking)p.charlGaitPhase=((p.charlGaitPhase||0)+elapsed*(1.12+speed*.56))%1;
    else p.charlGaitPhase=0;
    const gait=p.charlGaitPhase||0,gaitSin=Math.sin(gait*Math.PI*2),stepA=gait<.5;
    const blend=walking?(stepA?clamp((gait-.43)/.07,0,1):clamp((gait-.93)/.07,0,1)):0;
    const wave=Math.sin(Math.PI*progress),bob=walking?Math.abs(gaitSin)*(isIsland?2:3.5):Math.sin(time*2.6)*1.35;
    const shift=giant&&p.charlitoT>5.48?clamp((6-p.charlitoT)/.52,0,1):1;
    if(p.charlLastForm&&!giant)p.charlRevertAt=time;
    p.charlLastForm=giant;
    const revert=giant?1:clamp((time-(p.charlRevertAt??-99))/.4,0,1);
    ctx.save();ctx.translate(p.x+(attacking?wave*(isIsland?6:13):0),floor-bob);ctx.scale(p.facing||1,1);
    const inheritedAlpha=ctx.globalAlpha;
    ctx.globalAlpha=inheritedAlpha*.24;ctx.fillStyle='#020711';ctx.beginPath();ctx.ellipse(0,bob+3,h*(giant?.3:.24),isIsland?4:7,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=inheritedAlpha;
    if(giant){ctx.shadowColor=cyan;ctx.shadowBlur=17}
    const paint=(target,poses,frame,height,alpha=1)=>{if(alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;drawPose(ctx,target,poses,frame,height);ctx.restore()};
    if(walking){ctx.save();ctx.globalAlpha=inheritedAlpha*(.14+.18*Math.pow(Math.abs(Math.cos(gait*Math.PI*2)),8));ctx.fillStyle=cyan;ctx.shadowColor=cyan;ctx.shadowBlur=isIsland?7:13;ctx.beginPath();ctx.ellipse(stepA?-h*.18:h*.18,0,h*.12,isIsland?2:4,0,0,Math.PI*2);ctx.fill();ctx.restore()}
    ctx.save();
    if(giant&&shift<1){paint(normal,normalPoses,-1,isIsland?116:232,1-shift);ctx.scale(.72+.28*shift,.72+.28*shift);ctx.globalAlpha*=Math.max(.01,shift)}
    if(!giant&&revert<1){paint(mega,megaPoses,-1,isIsland?150:300,(1-revert)*.68);ctx.scale(.87+.13*revert,.87+.13*revert)}
    if(ko){ctx.translate(-h*.12,h*.02);ctx.rotate(-1.1)}
    else if(hurt)ctx.rotate(-.08);
    else if(walking)ctx.rotate(gaitSin*.034);
    else if(air)ctx.rotate((p.vy||0)>80?-.065:.07);
    else if(attacking)ctx.rotate(-wave*.035);
    if(p.state==='crouch')ctx.scale(1,.78);
    if(guard||hurt||ko||p.state==='crouch')paint(img,sheet,2,h);
    else if(attacking){
      const kick=/kick|sweep|flyingkick|airdown/.test(kind),strike=clamp(progress/.18,0,1)*clamp((1-progress)/.23,0,1);
      paint(img,sheet,kick?(stepA?0:1):-1,h,1-strike);
      paint(img,sheet,kick?(stepA?1:0):3,h,strike);
    }else if(air)paint(img,sheet,(p.vy||0)>80?0:1,h);
    else if(walking){paint(img,sheet,stepA?0:1,h,1-blend);paint(img,sheet,stepA?1:0,h,blend)}
    else paint(img,sheet,-1,h);
    ctx.restore();
    if(giant){ctx.globalAlpha=inheritedAlpha*(.38+.15*Math.sin(time*8));ctx.strokeStyle=cyan;ctx.lineWidth=isIsland?1.5:3;ctx.beginPath();ctx.ellipse(0,-h*.52,h*.38,h*.54,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=inheritedAlpha}
    if(giant&&shift<1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=cyan;ctx.shadowColor=cyan;ctx.shadowBlur=25;ctx.lineWidth=isIsland?3:6;ctx.globalAlpha=inheritedAlpha*(1-shift);ctx.beginPath();ctx.ellipse(0,-h*.5,h*(.2+.36*shift),h*(.3+.4*shift),0,0,Math.PI*2);ctx.stroke();ctx.restore()}
    if(!giant&&revert<1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=cyan;ctx.shadowColor=cyan;ctx.shadowBlur=20;ctx.lineWidth=isIsland?2:4;ctx.globalAlpha=inheritedAlpha*(1-revert);ctx.beginPath();ctx.ellipse(0,-h*.52,h*(.48-.2*revert),h*(.66-.2*revert),0,0,Math.PI*2);ctx.stroke();ctx.restore()}
    if(attacking){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=giant?'#ffae54':silver;ctx.shadowColor=giant?'#ff7a35':cyan;ctx.shadowBlur=22;ctx.globalAlpha=inheritedAlpha*(.65+.3*wave);ctx.beginPath();ctx.arc(h*(giant?.36:.32),-h*.59,giant?(isIsland?5:10):(isIsland?3:6),0,Math.PI*2);ctx.fill();ctx.restore()}
    ctx.restore();return true;
  }
  const oldDrawFighter=window.drawFighter;
  if(typeof oldDrawFighter==='function')window.drawFighter=function(ctx,p){
    if(p?.id==='charl'&&drawRobot(ctx,p,(p.charlitoT||0)>0))return;
    return oldDrawFighter.apply(this,arguments);
  };
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){
    const result=oldDraw.apply(this,arguments);
    if(!f?.charlShots?.length)return result;
    const ctx=canvas.getContext('2d');
    for(const q of f.charlShots){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.spin);ctx.shadowBlur=18;ctx.shadowColor=q.kind==='rocket'?'#ff914a':cyan;
      if(q.kind==='screw'){ctx.fillStyle=silver;ctx.fillRect(-11,-3,22,6);ctx.fillRect(3,-7,4,14)}
      else if(q.kind==='plate'){ctx.fillStyle='#849cad';ctx.strokeStyle=cyan;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*18,y=Math.sin(a)*18;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke()}
      else{ctx.fillStyle='#8799a9';ctx.fillRect(-20,-8,39,16);ctx.fillStyle='#ff9e48';ctx.beginPath();ctx.moveTo(-20,-6);ctx.lineTo(-37,0);ctx.lineTo(-20,6);ctx.fill();ctx.fillStyle=cyan;ctx.fillRect(7,-7,8,14)}ctx.restore()}
    return result;
  };
  window.CharlV50=Object.freeze({version:'50.0.0',duration:6,normal:'ai-assets/characters/charl.png',transformed:'ai-assets/characters/charlito.png',normalPoses:'ai-assets/characters/charl-poses-v49.png',transformedPoses:'ai-assets/characters/charlito-poses-v49.png'});
})();
