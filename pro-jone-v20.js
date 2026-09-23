/* SORTEP NIAK — JONE PIKES V20.9.1
 * Correções:
 * - sem dano sozinho entre lutas
 * - caminhada própria mais fluida
 * - salto com pose correta
 * - sprite menos cortado nas bordas
 */
(()=>{
  'use strict';
  if(window.JonePikesV20?.version)return;
  const VERSION='33.0.0-scythe-hera';
  const ID='jone';
  const TAN='#d7c7ae', GREEN='#7ddc56', PALE='#ecffe4';
  const POISON_TYPES=Object.freeze({
    corrosive:{label:'CORROSIVO',color:'#72e85a',duration:4.4,tick:.30,dot:.34,impact:1.00,marks:1},
    acid:{label:'ÁCIDO',color:'#c7f34b',duration:3.5,tick:.24,dot:.38,impact:1.08,marks:1},
    deep:{label:'TOXINA PROFUNDA',color:'#52e6ad',duration:5.4,tick:.36,dot:.28,impact:.88,marks:2},
    plague:{label:'PRAGA TÓXICA',color:'#86ff58',duration:6.8,tick:.27,dot:.44,impact:1.35,marks:3}
  });
  const POISON_ORDER=Object.freeze(['corrosive','acid','deep']);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const worldW=()=>typeof W!=='undefined'?W:1600;
  const ground=()=>typeof GROUND_Y!=='undefined'?GROUND_Y:840;
  const getFight=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const floorY=p=>{try{return typeof groundLevel==='function'?groundLevel(p):ground()-(p?.y||0)}catch(_){return ground()-(p?.y||0)}};
  const body=p=>{try{return typeof bodyY==='function'?bodyY(p):ground()-(p?.y||0)-82}catch(_){return ground()-82}};
  const opponent=(p,f=getFight())=>f?(p===f.p1?f.p2:f.p1):null;
  const slot=(f,name)=>name==='p2'?f?.p2:f?.p1;
  const setPState=(p,s)=>{try{if(typeof setState==='function')setState(p,s);else{p.state=s;p.stateT=0}}catch(_){p.state=s;p.stateT=0}};
  const hitFx=(x,y,c=GREEN,n=3)=>{try{spark?.(x,y,c,Math.min(2,n))}catch(_){}};
  const sound=(name='attack_light',v=.72)=>{try{SFX?.play?.(name,v)}catch(_){}};
  const toast=t=>{try{window.LutadorV6?.toast?.(t,'normal',1600)||mixToast?.(t)}catch(_){}};

  const FILES=[
    'ai-assets/characters/jone/poses/jone-0-idle.png',
    'ai-assets/characters/jone/poses/jone-1-punch.png',
    'ai-assets/characters/jone/poses/jone-2-kick.png',
    'ai-assets/characters/jone/poses/jone-3-crouch.png',
    'ai-assets/characters/jone/poses/jone-4-guard.png',
    'ai-assets/characters/jone/poses/jone-5-run.png'
  ];
  const POSES=FILES.map(src=>{const i=new Image();i.decoding='async';i.src=src;return i});
  // Escala visual normalizada para a altura de combate (~220px), igual às demais Lendas.
  const SCALE=[1.18,1.30,1.08,1.18,1.28,1.42];
  const BOTTOM_PAD=[30,29,36,31,39,37];

  function ensureFight(f){
    if(!f)return;
    if(!Array.isArray(f.joneShots))f.joneShots=[];
    if(!Array.isArray(f.joneBombs))f.joneBombs=[];
    if(!Array.isArray(f.joneClouds))f.joneClouds=[];
    if(!Array.isArray(f.joneFx))f.joneFx=[];
  }
  function resetPoison(p){
    if(!p)return;
    p.jonePoisonT=0;
    p.jonePoisonTick=0;
    p.jonePoisonOwner=null;
    p.jonePoisonDir=0;
    p.jonePoisonKind='corrosive';
    p.joneMarkStacks=0;p.joneMarkT=0;
    p.joneFlashT=0;
  }
  function init(p){if(p?.id===ID){if(!Number.isFinite(p.joneFlashT))p.joneFlashT=0;if(!Number.isFinite(p.jonePowerIndex))p.jonePowerIndex=0;if(!Number.isFinite(p.joneHealTick))p.joneHealTick=0;}}
  function addFx(f,x,y,type='ring',life=.32,r=40,col=GREEN){
    ensureFight(f);if(f.joneFx.length>=4)f.joneFx.shift();f.joneFx.push({x,y,type,life,maxLife:life,r,col,phase:Math.random()*6.28});
  }
  function applyDamage(target,amount,owner,dir,type){
    if(!target||target.state==='ko')return;
    try{damage(target,amount,{owner,joneV20:true},dir,type)}catch(_){try{window.damage?.(target,amount,{owner},dir,type)}catch(__){}}
  }
  // Veneno causa dano continuo sem transformar cada tick em hit-stun.
  // O adversario continua andando, pulando, defendendo e atacando normalmente.
  function applyPoisonDamage(target,amount,owner,dir,type='jone-poison'){
    if(!target||target.state==='ko')return;
    const keep={
      x:target.x,y:target.y,vx:target.vx,vy:target.vy,onGround:target.onGround,
      state:target.state,stateT:target.stateT,defend:target.defend,
      attackDisabledT:target.attackDisabledT,throwCd:target.throwCd,specialCd:target.specialCd
    };
    applyDamage(target,amount,owner,dir,type);
    if(target.state==='ko')return;
    target.x=keep.x;target.y=keep.y;target.vx=keep.vx;target.vy=keep.vy;target.onGround=keep.onGround;
    target.state=keep.state;target.stateT=keep.stateT;target.defend=keep.defend;
    target.attackDisabledT=keep.attackDisabledT;target.throwCd=keep.throwCd;target.specialCd=keep.specialCd;
  }
  function poisonConfig(kind){return POISON_TYPES[kind]||POISON_TYPES.corrosive}
  function applyPoison(target,owner,dir,kind='corrosive',duration=null,forceMarks=0){
    if(!target||target.state==='ko')return;const cfg=poisonConfig(kind);
    target.jonePoisonKind=kind;target.jonePoisonT=Math.max(target.jonePoisonT||0,duration??cfg.duration);target.jonePoisonTick=Math.min(Number.isFinite(target.jonePoisonTick)?target.jonePoisonTick:.08,.08);
    target.jonePoisonOwner=owner;target.jonePoisonDir=dir||1;
    const add=Math.max(cfg.marks||1,forceMarks||0);target.joneMarkStacks=clamp((target.joneMarkStacks||0)+add,1,3);target.joneMarkT=8;
  }
  function heraKiss(p){
    const f=getFight();if(!f||!p||p.state==='ko')return false;ensureFight(f);init(p);
    const target=opponent(p,f);if(!target)return false;
    const dir=Math.sign(target.x-p.x)||p.facing||1;p.facing=p.manualFacing=dir;
    const kind='deep',cfg=poisonConfig(kind);
    f.joneShots.push({x:p.x+dir*42,y:body(p)-42,vx:dir*650,vy:24,life:1.35,targetSlot:target.playerSlot,ownerSlot:p.playerSlot,dead:false,kind,color:cfg.color});
    p.throwCd=Math.max(p.throwCd||0,.48);setPState(p,'throw');p.joneFlashT=.16;sound('attack_light',.74);addFx(f,p.x+dir*40,body(p)-42,'ring',.20,26,cfg.color);toast('JONE · BEIJO DA HERA');return true;
  }
  function deathScythe(p){
    const f=getFight();if(!f||!p||p.state==='ko')return false;ensureFight(f);init(p);
    const target=opponent(p,f);if(!target)return false;const dir=Math.sign(target.x-p.x)||p.facing||1;p.facing=p.manualFacing=dir;
    p.throwCd=Math.max(p.throwCd||0,.54);setPState(p,'throw');p.joneFlashT=.24;sound('attack_heavy',.84);
    const close=Math.abs(target.x-p.x)<=154&&Math.abs((target.y||0)-(p.y||0))<105;
    if(close){applyDamage(target,Math.max(72,(p.dmg||34)*2.15),p,dir,'jone-death-scythe');target.vx=dir*310;hitFx(target.x,body(target)-48,TAN,8);addFx(f,target.x,body(target)-50,'burst',.32,74,TAN)}
    else addFx(f,p.x+dir*86,body(p)-54,'ring',.26,58,TAN);
    toast('JONE · CORTE DA MORTE');return true;
  }
  function activePower(p){init(p);return(p.jonePowerIndex||0)%2===0?'scythe':'hera'}
  function togglePower(p){
    if(!p||p.id!==ID||p.state==='ko')return;p.jonePowerIndex=((p.jonePowerIndex||0)+1)%2;p.joneFlashT=.22;
    const mode=activePower(p);addFx(getFight(),p.x,body(p)-42,'ring',.25,42,mode==='scythe'?TAN:GREEN);sound('menu_select',.55);toast(`JONE · ${mode==='scythe'?'CORTE DA MORTE':'BEIJO DA HERA'}`);
  }
  function smokeBomb(p){
    const f=getFight();if(!f||!p||p.state==='ko')return false;ensureFight(f);init(p);
    const target=opponent(p,f);if(!target)return false;
    const dir=Math.sign(target.x-p.x)||p.facing||1;p.facing=p.manualFacing=dir;
    const tx=clamp(target.x,120,worldW()-120);
    f.joneBombs.push({x:p.x+dir*34,y:body(p)-58,vx:dir*420,vy:360,targetX:tx,ownerSlot:p.playerSlot,targetSlot:target.playerSlot,life:1.15,dead:false,kind:'plague'});
    p.specialCd=Math.max(p.specialCd||0,6.6);setPState(p,'special');p.joneFlashT=.26;sound('attack_heavy',.82);toast('JONE PIKES · PRAGA TÓXICA SUPREMA');addFx(f,p.x+dir*32,body(p)-54,'burst',.26,36,TAN);return true;
  }

  const oldThrow=window.throwProjectile;
  if(typeof oldThrow==='function')window.throwProjectile=function(p){if(p?.id===ID){return activePower(p)==='scythe'?deathScythe(p):heraKiss(p)}return oldThrow.apply(this,arguments)};
  const oldSpecial=window.castSpecial;
  if(typeof oldSpecial==='function')window.castSpecial=function(p){if(p?.id===ID){smokeBomb(p);return}return oldSpecial.apply(this,arguments)};

  // O P2 online envia Numpad9 como entrada de rede, sem evento de teclado no HOST.
  // Tratar H no mesmo fluxo de playerInput mantém P1, P2 local e P2 remoto iguais.
  const oldPlayerInput=window.playerInput;
  if(typeof oldPlayerInput==='function')window.playerInput=function(p){
    if(p?.id===ID&&p.human){const f=getFight(),key=p.playerSlot==='p2'?'Numpad9':'KeyH';if(f&&!f.paused&&!f.over&&window.justPressed?.[key]){window.justPressed[key]=false;togglePower(p)}}
    return oldPlayerInput.apply(this,arguments)
  };

  function updatePoison(target,dt){
    if(!target)return;
    target.joneMarkT=Math.max(0,(target.joneMarkT||0)-dt);if(target.joneMarkT<=0)target.joneMarkStacks=0;
    if(!Number.isFinite(target.jonePoisonT)||target.jonePoisonT<=0)return;
    target.jonePoisonT=Math.max(0,target.jonePoisonT-dt);
    if(target.jonePoisonT<=0){target.jonePoisonTick=0;target.jonePoisonOwner=null;return;}
    const cfg=poisonConfig(target.jonePoisonKind),marks=clamp(target.joneMarkStacks||1,1,3);
    target.jonePoisonTick=(Number.isFinite(target.jonePoisonTick)?target.jonePoisonTick:0)-dt;
    if(target.jonePoisonTick<=0){
      target.jonePoisonTick=cfg.tick;
      const owner=target.jonePoisonOwner||null,dir=target.jonePoisonDir||1,scale=1+(marks-1)*.14;
      applyPoisonDamage(target,Math.max(8,(owner?.dmg||34)*cfg.dot*scale),owner,dir,'jone-poison-'+target.jonePoisonKind);
    }
  }
  function updateShots(f,dt){
    for(const s of f.joneShots){
      if(s.dead)continue;
      s.life-=dt;s.x+=s.vx*dt;s.y-=s.vy*dt;s.vy-=420*dt;
      const target=slot(f,s.targetSlot),owner=slot(f,s.ownerSlot);
      if(target&&target.state!=='ko'&&Math.abs(s.x-target.x)<68&&Math.abs(s.y-body(target))<96){
        const cfg=poisonConfig(s.kind),dir=Math.sign(s.vx)||1;s.dead=true;applyDamage(target,(owner?.dmg||34)*.95*cfg.impact,owner,dir,'jone-poison-shot-'+s.kind);
        applyPoison(target,owner,dir,s.kind,cfg.duration,0);
        addFx(f,target.x,body(target)-36,'burst',.26,38,cfg.color);hitFx(target.x,body(target)-30,cfg.color,6);sound('attack_light',.76);
      }
      if(s.life<=0||s.x<-80||s.x>worldW()+80)s.dead=true;
    }
    f.joneShots=f.joneShots.filter(s=>!s.dead).slice(-4);
  }
  function updateBombs(f,dt){
    for(const b of f.joneBombs){
      if(b.dead)continue;
      b.life-=dt;b.x+=b.vx*dt;b.y-=b.vy*dt;b.vy-=900*dt;
      if((((Math.sign(b.vx)||1)>0)&&b.x>=b.targetX) || (((Math.sign(b.vx)||1)<0)&&b.x<=b.targetX) || b.y>=ground()-8 || b.life<=0){
        b.dead=true;
        const x=clamp(b.x,120,worldW()-120), y=ground()-24;
        if(f.joneClouds.length>=2)f.joneClouds.shift();f.joneClouds.push({x,y,r:280,life:7.4,maxLife:7.4,ownerSlot:b.ownerSlot,targetSlot:b.targetSlot,tick:.06,phase:Math.random()*6.28,kind:'plague',supreme:true});
        const owner=slot(f,b.ownerSlot),target=slot(f,b.targetSlot);
        if(target&&target.state!=='ko'&&Math.abs(target.x-x)<320){const dir=Math.sign(target.x-x)||1,cfg=poisonConfig('plague');applyPoisonDamage(target,(owner?.dmg||34)*1.75,owner,dir,'jone-smoke-blast');applyPoison(target,owner,dir,'plague',cfg.duration,3);}
        addFx(f,x,y-34,'burst',.46,148,PALE);hitFx(x,y-34,PALE,7);sound('attack_heavy',.98);
      }
    }
    f.joneBombs=f.joneBombs.filter(b=>!b.dead).slice(-2);
  }
  function updateClouds(f,dt){
    for(const c of f.joneClouds){
      c.life-=dt;c.phase+=dt*2.8;c.tick-=dt;
      const owner=slot(f,c.ownerSlot),target=slot(f,c.targetSlot);
      if(c.tick<=0){
        c.tick=.28;
        if(owner&&owner.state!=='ko'&&Math.abs(owner.x-c.x)<c.r&&Math.abs(body(owner)-c.y)<135){
          const heal=Math.max(14,(owner.maxHp||2190)*.010);owner.hp=Math.min(owner.maxHp,owner.hp+heal);addFx(f,owner.x,body(owner)-38,'ring',.20,30,PALE);
        }
        if(target&&target.state!=='ko'&&Math.abs(target.x-c.x)<c.r&&Math.abs(body(target)-c.y)<120){
          const dir=Math.sign(target.x-c.x)||1,cfg=poisonConfig(c.kind||'plague');applyPoisonDamage(target,(owner?.dmg||34)*.34,owner,dir,'jone-smoke');
          applyPoison(target,owner,dir,c.kind||'plague',Math.max(2.4,cfg.duration*.55),c.supreme?3:1);
        }
      }
    }
    f.joneClouds=f.joneClouds.filter(c=>c.life>0).slice(-2);
  }
  function updateJone(f,dt){
    if(!f||dt<=0)return;ensureFight(f);
    for(const p of [f.p1,f.p2]){
      if(!p)continue;
      updatePoison(p,dt);
      if(p.id===ID){
        init(p);
        p.joneFlashT=Math.max(0,(p.joneFlashT||0)-dt);
        // evita sprite cortado nas bordas da arena
        p.x=clamp(p.x,96,worldW()-96);
      }
    }
    updateShots(f,dt);updateBombs(f,dt);updateClouds(f,dt);
    for(const e of f.joneFx){e.life-=dt;e.phase+=dt*8}
    f.joneFx=f.joneFx.filter(e=>e.life>0).slice(-4);
  }
  const oldUpdate=window.update;
  if(typeof oldUpdate==='function')window.update=function(f,dt){const r=oldUpdate.apply(this,arguments);if(f&&!f.paused&&!f.over)updateJone(f,Math.min(.034,Math.max(0,dt||0)));return r};
  const oldStart=window.startFight;
  if(typeof oldStart==='function')window.startFight=function(){
    const r=oldStart.apply(this,arguments);const f=getFight();if(f){
      f.joneShots=[];f.joneBombs=[];f.joneClouds=[];f.joneFx=[];
      resetPoison(f.p1);resetPoison(f.p2);init(f.p1);init(f.p2);
    }return r
  };

  function poseReady(i){const img=POSES[i];return img?.complete&&img.naturalWidth?img:null}
  function drawPose(ctx,index,scale=1,alpha=1,dx=0,dy=0,rot=0){
    const img=poseReady(index)||poseReady(0);if(!img)return false;
    const s=scale*(SCALE[index]||1.18),w=img.naturalWidth*s,h=img.naturalHeight*s,foot=(BOTTOM_PAD[index]||30)*s;
    ctx.save();ctx.globalAlpha*=alpha;ctx.translate(dx,dy);ctx.rotate(rot);ctx.drawImage(img,-w/2,-h+foot,w,h);ctx.restore();return {w,h,foot};
  }
  function drawWalk(ctx,p){
    // Passos reais leves: cada perna passa por apoio -> impulso -> balanço -> contato.
    // O pe de apoio fica compensado no chao e a perna livre sobe; continua em apenas 3 drawImage.
    const img=poseReady(0);if(!img){drawPose(ctx,0,1,1);return}
    const s=SCALE[0]||1.18,sw=img.naturalWidth,sh=img.naturalHeight,w=sw*s,h=sh*s,foot=(BOTTOM_PAD[0]||30)*s;
    const speed=clamp(Math.abs(Number(p.vx)||0)/Math.max(1,Number(p.speed)||238),.30,1.28),time=performance.now()/1000;
    const cadence=2.85+speed*1.95,cycle=((time*cadence)%1+1)%1,dir=Math.sign(Number(p.vx)||p.facing||1)||1;
    const baseY=-h+foot,hipSrcY=128,legSrcH=Math.max(1,sh-hipSrcY),legDstH=legSrcH*s;
    const gait=t=>{
      t=((t%1)+1)%1;
      if(t<.58){
        const u=smooth(t/.58);
        return {angle:(-.090+.180*u)*speed,lift:0,reach:(2.7-5.4*u)*speed,stance:true};
      }
      const u=smooth((t-.58)/.42),arc=Math.sin(Math.PI*u);
      return {angle:(.105-.210*u)*speed,lift:arc*(4.8+1.1*speed),reach:(-2.7+5.4*u)*speed,stance:false};
    };
    const left=gait(cycle),right=gait(cycle+.5);
    const bodyWave=Math.sin(cycle*Math.PI*2),bob=Math.abs(Math.sin(cycle*Math.PI*2))*1.05*speed;
    ctx.save();ctx.translate(dir*.65,-bob);ctx.rotate(dir*(.005+.0025*speed)-bodyWave*.0025);
    const drawLeg=(leftSide,g)=>{
      const sx=leftSide?20:78,srcW=leftSide?66:61,pivotSrcX=leftSide?61:101;
      const hipX=(pivotSrcX-sw/2)*s,hipY=baseY+hipSrcY*s;
      // Compensa a subida causada pela rotacao para o pe de apoio nao flutuar.
      const groundFix=legDstH*(1-Math.cos(g.angle));
      ctx.save();ctx.translate(hipX+g.reach,hipY+groundFix-g.lift);ctx.rotate(g.angle);
      ctx.drawImage(img,sx,hipSrcY,srcW,legSrcH,(sx-pivotSrcX)*s,0,srcW*s,legDstH);
      ctx.restore();
    };
    // A perna que esta mais atras e desenhada primeiro, melhorando a leitura de profundidade.
    const legs=[{left:true,g:left},{left:false,g:right}].sort((a,b)=>a.g.reach-b.g.reach);
    for(const leg of legs)drawLeg(leg.left,leg.g);
    // Torso acompanha a transferencia de peso sem deslizar junto com os pes.
    const torsoSrcH=154,weightShift=(right.reach-left.reach)*.12;
    ctx.save();ctx.translate(weightShift,Math.cos(cycle*Math.PI*4)*.22);ctx.rotate(-bodyWave*.0042*speed);ctx.drawImage(img,0,0,sw,torsoSrcH,-w/2,baseY,w,torsoSrcH*s);ctx.restore();
    ctx.restore();
  }
  function drawAir(ctx,p,time){
    // Pulo com escala corporal fixa: muda posição/rotação, nunca "infla" o sprite durante o salto.
    // A correção horizontal compensa a pose aérea mais larga, mantendo o corpo próximo do tamanho do idle.
    const vy=Number(p.vy)||0,dir=p.facing||1,height=clamp((Number(p.y)||0)/180,0,1);
    const rising=vy>150,apex=Math.abs(vy)<=150,falling=vy<-150;
    let dx=0,dy=-5,rot=0;
    if(rising){const e=smooth(clamp(vy/860,0,1));dx=-dir*(2+2.5*e);dy-=2+height*2.5;rot=-dir*(.018+.020*e);}
    else if(apex){dx=dir*1.5;dy-=5+height*1.5;rot=dir*.010;}
    else if(falling){const e=smooth(clamp((-vy)/860,0,1));dx=dir*(1.5+2.2*e);dy-=1.5;rot=dir*(.018+.024*e);}
    ctx.save();ctx.translate(dx,dy);ctx.rotate(rot);ctx.scale(.82,1);drawPose(ctx,5,1.04,1,0,0,0);ctx.restore();
  }
  function drawKickMotion(ctx,p){
    // O chute usa escala corporal fixa. So posicao e rotacao mudam durante o golpe,
    // impedindo o Jone de "crescer" quando a pose de chute entra ou sai.
    const m=p.proMove,d=Math.max(.001,Number(m?.duration)||.47),n=clamp((Number(m?.time)||0)/d,0,1),dir=p.facing||1;
    let dx=0,dy=-2,rot=0;
    if(n<.28){const e=smooth(n/.28);dx=-6*e;dy=1.5*e;rot=dir*.045*e;}
    else if(n<.62){const e=smooth((n-.28)/.34);dx=-6+(22*e);dy=1.5-(6.5*e);rot=dir*(.045-.145*e);}
    else{const e=smooth((n-.62)/.38),r=1-e;dx=16*r;dy=-5*r;rot=-dir*.10*r;}
    ctx.save();ctx.translate(dx,dy);ctx.rotate(rot);drawPose(ctx,2,1,1,0,0,0);ctx.restore();
  }

  function drawAttackVisual(ctx,p){
    const dir=p.facing||1,tm=performance.now()/1000;
    const slash=(kind,n=1)=>{
      const col=kind==='kick'?'rgba(236,255,228,.95)':'rgba(125,220,86,.92)',glow=kind==='kick'?'rgba(125,220,86,.34)':'rgba(236,255,228,.30)';
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle=col;ctx.shadowColor='#8cff73';ctx.shadowBlur=10;
      for(let i=0;i<n;i++){
        const off=i*8,phase=tm*8+i*.8;ctx.globalAlpha=.55-(i*.10);ctx.lineWidth=(kind==='kick'?4.5:3.5)-i*.6;
        ctx.beginPath();
        if(kind==='kick'){
          ctx.moveTo(18*dir,-108+off*.2);ctx.quadraticCurveTo(44*dir,-126+Math.sin(phase)*3,84*dir,-88+off*.15);ctx.quadraticCurveTo(58*dir,-74,26*dir,-70+off*.1);
        }else{
          ctx.moveTo(8*dir,-118+off*.1);ctx.quadraticCurveTo(28*dir,-138+Math.sin(phase)*2.5,56*dir,-116+off*.1);ctx.quadraticCurveTo(36*dir,-102,14*dir,-98+off*.1);
        }
        ctx.stroke();
      }
      ctx.shadowBlur=0;ctx.globalAlpha=.24;ctx.strokeStyle=glow;ctx.lineWidth=8;ctx.beginPath();
      if(kind==='kick'){ctx.moveTo(18*dir,-108);ctx.quadraticCurveTo(46*dir,-128,84*dir,-88);}
      else{ctx.moveTo(8*dir,-118);ctx.quadraticCurveTo(28*dir,-140,56*dir,-116);}
      ctx.stroke();ctx.restore();
    };
    if(p.proMove?.kind==='kick')slash('kick',2);
    else if(p.proMove?.kind==='punch'||p.state==='throw')slash('punch',2);
  }
  function drawJone(ctx,p){
    const idle=poseReady(0);if(!idle)return false;init(p);const floor=floorY(p)-3,time=performance.now()/1000;
    ctx.save();ctx.globalAlpha=.28;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,ground()+4,40,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(p.x,floor);ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Golpes específicos têm prioridade sobre o estado genérico 'throw'.
    // Isso garante que O / Num 6 mostre realmente a pose de CHUTE do Jone.
    if(p.proMove?.kind==='kick')drawKickMotion(ctx,p);
    else if(p.proMove?.kind==='punch')drawPose(ctx,1,1,1,0,-1,-.02);
    else if(p.state==='special')drawPose(ctx,4,.98,1,0,-1,0);
    else if(p.state==='throw')drawPose(ctx,1,1,1,0,-1,-.02);
    else if(p.defend||p.state==='defend')drawPose(ctx,4,.98,1,0,0,0);
    else if(p.state==='crouch')drawPose(ctx,3,.98,1,0,0,0);
    else if((p.proKnockdownT||0)>0&&p.onGround&&p.state!=='ko'){ctx.translate(-10,-13);ctx.rotate(-Math.PI/2);drawPose(ctx,3,.94,.90,0,58,0)}
    else if(p.state==='hurt')drawPose(ctx,1,.98,.92,-4,0,.025);
    else if(p.state==='ko'){ctx.translate(-10,-14);ctx.rotate(-Math.PI/2);drawPose(ctx,3,.92,.72,0,56,0)}
    else if(!p.onGround||p.state==='air')drawAir(ctx,p,time)
    else if(Math.abs(p.vx||0)>7)drawWalk(ctx,p);
    else{const bob=Math.sin(time*2.8+p.x*.011)*1.1;drawPose(ctx,0,1,1,0,-bob,Math.sin(time*2)*.004)}
    drawAttackVisual(ctx,p);
    ctx.restore();
    return true;
  }
  const oldDrawFighter=window.drawFighter;
  if(typeof oldDrawFighter==='function')window.drawFighter=function(ctx,p){if(p?.id===ID&&drawJone(ctx,p))return;return oldDrawFighter.apply(this,arguments)};

  function drawShot(ctx,s){const cfg=poisonConfig(s.kind),tm=performance.now()/1000;ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle=cfg.color;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle=PALE;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.48;for(let i=0;i<2;i++){ctx.fillStyle=cfg.color;ctx.beginPath();ctx.arc(-10-i*7,Math.sin(tm*8+i)*4,2.5-i*.5,0,Math.PI*2);ctx.fill()}ctx.restore()}
  function drawBomb(ctx,b){const tm=performance.now()/1000;ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='rgba(38,55,34,.98)';ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a6ff78';ctx.lineWidth=2.5;ctx.stroke();ctx.globalAlpha=.72;ctx.fillStyle='#7dff58';ctx.beginPath();ctx.arc(-5,-4,4+Math.sin(tm*8)*1.2,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawCloud(ctx,c){
    const n=clamp(c.life/c.maxLife,0,1),tm=performance.now()/1000,breath=.94+.06*Math.sin(tm*2.7+c.phase);
    ctx.save();ctx.translate(c.x,c.y);
    // Nuvem principal: verde tóxico mais visível, sem blur pesado.
    ctx.globalAlpha=.28*n;ctx.fillStyle='rgba(70,210,55,.62)';ctx.beginPath();ctx.ellipse(0,-40,c.r*.80*breath,50,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.22*n;ctx.fillStyle='rgba(145,255,105,.58)';
    for(let i=0;i<3;i++){const ang=tm*(.45+i*.08)+i*2.1;const x=Math.cos(ang)*c.r*(.18+i*.04),y=-48-Math.sin(ang*1.35)*14-i*7;ctx.beginPath();ctx.ellipse(x,y,c.r*(.22-i*.025),22-i*2,0,0,Math.PI*2);ctx.fill()}
    // Vapores subindo para deixar claro que é VENENO.
    ctx.globalAlpha=.30*n;ctx.strokeStyle='rgba(190,255,145,.88)';ctx.lineWidth=3;ctx.lineCap='round';
    for(let i=-1;i<=1;i++){const x=i*42+Math.sin(tm*2+i)*7;ctx.beginPath();ctx.moveTo(x,-54);ctx.bezierCurveTo(x-12,-74,x+14,-91,x+Math.sin(tm*3+i)*8,-112);ctx.stroke()}
    // Gotas/bolhas tóxicas discretas.
    ctx.globalAlpha=.42*n;ctx.fillStyle='rgba(210,255,175,.92)';
    for(let i=0;i<4;i++){const x=-72+i*48+Math.sin(tm*1.8+i)*5,y=-26-((tm*22+i*17)%48);ctx.beginPath();ctx.arc(x,y,2.4+(i%2),0,Math.PI*2);ctx.fill()}
    if(c.supreme){ctx.globalAlpha=.34*n;ctx.strokeStyle='rgba(156,255,92,.92)';ctx.lineWidth=3;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(0,-35,c.r*(.46+i*.18)*(1+.04*Math.sin(tm*3+i)),18+i*7,0,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=.16*n;ctx.fillStyle='rgba(75,255,65,.65)';ctx.beginPath();ctx.ellipse(0,-34,c.r*.58,72,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawFx(ctx,e){const n=clamp(e.life/e.maxLife,0,1);ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=n*.55;ctx.strokeStyle=e.col;ctx.lineWidth=e.type==='burst'?3:2;ctx.beginPath();ctx.arc(0,0,e.r*(1+(1-n)*.18),0,Math.PI*2);ctx.stroke();ctx.restore()}
  function drawStatus(ctx,p){if((p?.jonePoisonT||0)<=0&&(p?.joneMarkT||0)<=0)return;const cfg=poisonConfig(p.jonePoisonKind),marks=clamp(p.joneMarkStacks||0,0,3),y=floorY(p)-208,tm=performance.now()/1000;ctx.save();ctx.translate(p.x,y);ctx.globalAlpha=.78;ctx.fillStyle=cfg.color;ctx.font='800 13px Oxanium,Arial';ctx.textAlign='center';ctx.fillText((p.jonePoisonT||0)>0?`${cfg.label}${marks?` · MARCA ×${marks}`:''}`:`MARCA TÓXICA ×${marks}`,0,0);if(marks){ctx.translate(0,166);ctx.globalAlpha=.20+.05*Math.sin(tm*5);ctx.strokeStyle=cfg.color;ctx.lineWidth=2;for(let i=0;i<marks;i++){ctx.beginPath();ctx.arc(0,0,25+i*6,0,Math.PI*2);ctx.stroke()}}ctx.restore()}
  function drawJoneFx(ctx,f){
    if(!ctx||!f)return;ensureFight(f);
    for(const s of f.joneShots)drawShot(ctx,s);
    for(const b of f.joneBombs)drawBomb(ctx,b);
    for(const c of f.joneClouds)drawCloud(ctx,c);
    for(const e of f.joneFx)drawFx(ctx,e);
    drawStatus(ctx,f.p1);drawStatus(ctx,f.p2);
    for(const p of [f.p1,f.p2])if(p?.id===ID&&p.human){const x=p===f.p1?34:worldW()-326,y=192,mode=activePower(p),cfg=mode==='scythe'?{color:TAN,label:'CORTE DA MORTE · FOICE CURTA'}:{color:GREEN,label:'BEIJO DA HERA · VENENO LONGO'};ctx.save();ctx.fillStyle='rgba(18,15,12,.82)';ctx.strokeStyle=cfg.color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,292,58,10);ctx.fill();ctx.stroke();ctx.fillStyle='#f8efdf';ctx.font='900 11px Oxanium,Arial';ctx.fillText('JONE PIKES · H ALTERNA O PODER',x+12,y+17);ctx.fillStyle=cfg.color;ctx.font='800 10px Oxanium,Arial';ctx.fillText(`J · ${cfg.label}`,x+12,y+36);ctx.fillStyle=PALE;ctx.font='800 9px Oxanium,Arial';ctx.fillText('L · JARDIM MORTAL · DANO + CURA NA ÁREA',x+12,y+51);ctx.restore()}
  }
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){const r=oldDraw.apply(this,arguments);try{drawJoneFx(canvas.getContext('2d'),f)}catch(_){}return r};
  window.JonePikesV20=Object.freeze({version:VERSION,shot:poisonProjectile,super:smokeBomb,poisons:Object.keys(POISON_TYPES)});
})();
