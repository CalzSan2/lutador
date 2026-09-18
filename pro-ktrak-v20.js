/* SORTEP NIAK — KTRAK CALZSAN V20.9.1 — AVATAR SUPREMO
 * Personagem secreto disponível no modo Normal e R.A.V.A.M pelo código 96051.
 * J = poder elemental atual | H / P2 9 = alternar Água > Terra > Fogo > Ar
 * L = Modo Avatar por 8s, dano x2 e versões supremas do J.
 * Avatar + J: Água congela 4s; Terra cria paredes + rocha esmagadora; Fogo incendeia o mapa; Ar cria tornado com queda.
 */
(()=>{
  'use strict';
  if(window.KtrakV20?.version)return;
  const VERSION='20.10.3-avatar-lava-7s';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const ELEMENTS=Object.freeze(['water','earth','fire','air','lightning','lava','heal']);
  const LABELS=Object.freeze({water:'ÁGUA',earth:'TERRA',fire:'FOGO',air:'AR',lightning:'RAIO AZUL',lava:'LAVA',heal:'CURA'});
  const MOVE_NAMES=Object.freeze({water:'ONDA ATÉ A CINTURA',earth:'ROCHA ERGUIDA',fire:'JATO DE CHAMAS',air:'CORTE DE VENTO',lightning:'RAIO HORIZONTAL',lava:'FENDA DE LAVA',heal:'DOBRA DE CURA'});
  const COLORS=Object.freeze({water:'#4bdcff',earth:'#d7a85f',fire:'#ff6a2d',air:'#d8f7ff',lightning:'#5ab7ff',lava:'#ff7431',heal:'#7ff0c8'});
  const POSE_PATHS=Array.from({length:6},(_,i)=>`ai-assets/ravam/ktrak/poses/ktrak-${i}.png`);
  const POSES=POSE_PATHS.map(src=>{const i=new Image();i.decoding='async';i.src=src;return i});
  const EYE_POS=[
    [.50,.105],[.64,.095],[.525,.115],[.72,.12],[.49,.13],[.72,.115]
  ];

  const getFight=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const opp=(p,f=getFight())=>f?(p===f.p1?f.p2:f.p1):null;
  const slotOf=(f,slot)=>slot==='p2'?f?.p2:f?.p1;
  const body=(p)=>{try{return typeof bodyY==='function'?bodyY(p):GROUND_Y-(p?.y||0)-72}catch(_){return 420}};
  const hitY=(p,y,pad=26)=>{try{return hitboxY(p,y,pad)}catch(_){return Math.abs(body(p)-y)<pad+50}};
  const setPState=(p,s)=>{try{setState?.(p,s)}catch(_){}};
  const sparkFx=(x,y,c,n=3)=>{try{spark?.(x,y,c,Math.min(2,Math.max(0,n||0)))}catch(_){}};
  const sound=(n='attack_light',v=.72)=>{try{SFX?.play?.(n,v)}catch(_){}};
  const toast=t=>{try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(t,'normal',1650);mixToast?.(t)}catch(_){}};

  function ensure(f){
    if(!f)return;
    for(const k of ['ktrakShots','ktrakRocks','ktrakBursts','ktrakFx','ktrakTornadoes','ktrakInfernos','ktrakEarthCrushes','ktrakLavaPools','ktrakHealColumns'])if(!Array.isArray(f[k]))f[k]=[];
  }
  function initFighter(p){
    if(!p||p.id!=='ktrak')return;
    if(!ELEMENTS.includes(p.ktrakElement))p.ktrakElement='water';
    p.ktrakElementIndex=Math.max(0,ELEMENTS.indexOf(p.ktrakElement));
    if(!Number.isFinite(p.ktrakSwitchCd))p.ktrakSwitchCd=0;
    if(!Number.isFinite(p.ktrakAvatarT))p.ktrakAvatarT=0;
    if(!Number.isFinite(p.ktrakCastT))p.ktrakCastT=0;
    if(!Number.isFinite(p.ktrakWetT))p.ktrakWetT=0;
    if(!Number.isFinite(p.ktrakGustT))p.ktrakGustT=0;
    if(!Number.isFinite(p.ktrakLastDamageTaken))p.ktrakLastDamageTaken=0;
    if(!Number.isFinite(p.ktrakLastDamageDealt))p.ktrakLastDamageDealt=0;
    if(!Number.isFinite(p.ktrakAvatarHealT))p.ktrakAvatarHealT=0;
    if(!Number.isFinite(p.ktrakAvatarHealTick))p.ktrakAvatarHealTick=0;
    if(!Number.isFinite(p.ktrakAvatarHealAmount))p.ktrakAvatarHealAmount=0;
  }
  function textFx(f,p,text,color='#fff',life=.72){
    if(!f||!p)return;ensure(f);if(f.ktrakFx.length>=4)f.ktrakFx.shift();f.ktrakFx.push({x:p.x,y:body(p)-72,text,color,life,maxLife:life});
  }
  function burst(f,kind,x,y,color,life=.55,size=54,dir=1){
    if(!f)return;ensure(f);if(f.ktrakBursts.length>=4)f.ktrakBursts.shift();f.ktrakBursts.push({kind,x,y,color,life,maxLife:life,size,dir,t:0,seed:Math.random()*1000});
  }
  function currentElement(p){initFighter(p);return p.ktrakElement||'water'}
  function setElement(p,index,announce=true){
    initFighter(p);index=(Number(index)||0)%ELEMENTS.length;if(index<0)index+=ELEMENTS.length;
    p.ktrakElementIndex=index;p.ktrakElement=ELEMENTS[index];p.ktrakSwitchCd=.14;
    const f=getFight();if(announce){textFx(f,p,`ELEMENTO · ${LABELS[p.ktrakElement]}`,COLORS[p.ktrakElement],.66);sparkFx(p.x,body(p),COLORS[p.ktrakElement],16);sound('menu_select',.48)}
  }
  function cycleElement(p){setElement(p,(p.ktrakElementIndex||0)+1,true)}

  function avatarElementalAttack(p){
    const f=getFight();if(!f||!p||p.state==='ko')return false;ensure(f);initFighter(p);
    const t=opp(p,f);if(!t||t.state==='ko')return false;
    const type=currentElement(p),dir=t.x!==p.x?(t.x>p.x?1:-1):(p.facing||1);p.facing=dir;
    if(type==='water'){
      if(f.ktrakShots.length>=6)f.ktrakShots.shift();
      const startX=clamp(p.x+dir*78,42,W-42);
      f.ktrakShots.push({kind:'water',avatarSupreme:true,groundBorn:true,emergeT:.22,emergeMax:.22,startX,x:startX,y:GROUND_Y+24,baseY:GROUND_Y-62,vx:dir*940,life:2.0,maxLife:2.0,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||36)*1.36,dead:false,r:52,phase:Math.random()*6.28,trail:[],dir,waveHeight:108});
      textFx(f,p,'AVATAR · MARÉ GLACIAL ATÉ A CINTURA · 4s',COLORS.water,.90);sparkFx(startX,GROUND_Y-8,'#bff8ff',16);p.throwCd=.48;
    }else if(type==='air'){
      if(f.ktrakTornadoes.length>=2)f.ktrakTornadoes.shift();
      f.ktrakTornadoes.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,t:0,life:4.2,maxLife:4.2,released:false,fallPending:false,hit:false,phase:Math.random()*6.28,dir});
      textFx(f,p,'AVATAR · TORNADO CELESTE',COLORS.air,.92);sparkFx(t.x,GROUND_Y-8,'#e9ffff',42);p.throwCd=.72;
    }else if(type==='fire'){
      f.ktrakInfernos.length=0;
      f.ktrakInfernos.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,t:0,life:4.8,maxLife:4.8,tick:.05,phase:Math.random()*6.28});
      textFx(f,p,'AVATAR · MAPA EM CHAMAS',COLORS.fire,.96);sparkFx(p.x,GROUND_Y-8,'#ff7b31',44);sparkFx(t.x,GROUND_Y-8,'#ffb14f',44);p.throwCd=.78;
    }else if(type==='earth'){
      if(f.ktrakEarthCrushes.length>=2)f.ktrakEarthCrushes.shift();
      const center=clamp(t.x,190,W-190),gap=112;
      f.ktrakEarthCrushes.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,center,left:center-gap,right:center+gap,rockStart:center-dir*190,rockX:center-dir*190,rockY:GROUND_Y+58,t:0,life:2.3,maxLife:2.3,dir,hit:false,farWallBroken:false,phase:Math.random()*6.28});
      textFx(f,p,'AVATAR · CORREDOR TITÂNICO',COLORS.earth,.96);sparkFx(center-gap,GROUND_Y-8,COLORS.earth,34);sparkFx(center+gap,GROUND_Y-8,COLORS.earth,34);p.throwCd=.88;
    }else if(type==='lightning'){
      if(f.ktrakShots.length>=6)f.ktrakShots.shift();
      const startX=clamp(p.x+dir*64,36,W-36),targetX=clamp(t.x+dir*18,42,W-42);
      f.ktrakShots.push({kind:'lightning',avatarSupreme:true,beam:true,anchorToOwner:true,x:startX,y:GROUND_Y-118,baseY:GROUND_Y-118,vx:0,life:.58,maxLife:.58,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||36)*.42,dead:false,r:26,phase:Math.random()*6.28,dir,length:Math.max(220,Math.min(620,Math.abs(targetX-startX)+96)),tick:.05,hitTick:0,hitCount:0});
      textFx(f,p,'AVATAR · RAIO AZUL CONTÍNUO',COLORS.lightning,.88);sparkFx(startX,GROUND_Y-84,COLORS.lightning,26);p.throwCd=.60;
    }else if(type==='lava'){
      if(f.ktrakLavaPools.length>=2)f.ktrakLavaPools.shift();
      const x=clamp(t.x,128,W-128);
      f.ktrakLavaPools.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x,radius:102,holeRadius:56,life:7,maxLife:7,openT:.60,maxOpen:.60,tick:.10,avatarSupreme:true,pit:true,persistent:false,riseT:1.28,maxRise:1.28,coreBurn:.18});
      textFx(f,p,'AVATAR · ABISMO DE LAVA · 7s',COLORS.lava,.92);sparkFx(x,GROUND_Y-6,COLORS.lava,30);p.throwCd=.92;
    }else if(type==='heal'){
      const heal=Math.max(1,Math.round(p.ktrakLastDamageTaken||0));
      const bonus=Math.max(2,Math.round((p.ktrakLastDamageDealt||0)*.45));
      p.hp=Math.min(p.maxHp,p.hp+heal+bonus);
      p.ktrakAvatarHealT=3.2;p.ktrakAvatarHealTick=.18;p.ktrakAvatarHealAmount=Math.max(2,Math.round((heal+bonus)*.20));
      p.ktrakBurnT=0;p.ktrakBurnTick=0;p.ktrakBurnDamage=0;p.ktrakBurnOwner=null;
      if(f.ktrakHealColumns.length>=2)f.ktrakHealColumns.shift();
      f.ktrakHealColumns.push({x:p.x,life:3.2,maxLife:3.2,heal:heal+bonus,ownerSlot:p.playerSlot,avatarSupreme:true,blessing:true});
      textFx(f,p,'AVATAR · NASCENTE DE CURA +' + (heal+bonus),COLORS.heal,.92);sparkFx(p.x,body(p)-18,COLORS.heal,28);p.throwCd=.78;
    }
    p.ktrakCastT=.46;setPState(p,'throw');sound(type==='earth'||type==='fire'||type==='lava'?'attack_heavy':'attack_light',.96);return true;
  }

  function elementalAttack(p){
    const f=getFight();if(!f||!p||p.state==='ko')return;ensure(f);initFighter(p);
    if(!p.human&&Math.random()<.42)setElement(p,Math.floor(Math.random()*ELEMENTS.length),false);
    if((p.ktrakAvatarT||0)>0&&avatarElementalAttack(p))return;
    const t=opp(p,f);if(!t)return;
    const type=currentElement(p),dir=t.x!==p.x?(t.x>p.x?1:-1):(p.facing||1),y=body(p)-16;
    p.facing=dir;

    if(type==='earth'){
      if(f.ktrakRocks.length>=3)f.ktrakRocks.shift();
      const startX=clamp(p.x+dir*86,62,W-62);
      f.ktrakRocks.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,mode:'ground-launch',phaseName:'rise',t:0,riseDur:.24,x:startX,startX,y:GROUND_Y+66,baseY:GROUND_Y-72,vx:dir*760,life:2.0,maxLife:2.0,r:54,dmg:(p.dmg||36)*1.42,dead:false,spin:0,dir});
      p.throwCd=p.human?.88:1.02;
      textFx(f,p,'TERRA · ROCHA ERGUIDA DO SOLO',COLORS.earth,.78);sparkFx(startX,GROUND_Y-7,COLORS.earth,16);sound('attack_heavy',.72);
    }else if(type==='lava'){
      if(f.ktrakLavaPools.length>=2)f.ktrakLavaPools.shift();
      const x=clamp(t.x,110,W-110);
      f.ktrakLavaPools.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x,radius:84,holeRadius:44,life:9999,maxLife:9999,openT:.52,maxOpen:.52,tick:.14,avatarSupreme:false,pit:true,persistent:true,riseT:1.05,maxRise:1.05,coreBurn:.12});
      p.throwCd=p.human?1.08:1.20;
      textFx(f,p,'LAVA · BURACO INCANDESCENTE',COLORS.lava,.80);sparkFx(x,GROUND_Y-6,COLORS.lava,18);sound('attack_heavy',.76);
    }else if(type==='heal'){
      const heal=Math.max(1,Math.round(p.ktrakLastDamageTaken||0));
      p.hp=Math.min(p.maxHp,p.hp+heal);
      if(f.ktrakHealColumns.length>=2)f.ktrakHealColumns.shift();
      f.ktrakHealColumns.push({x:p.x,life:.92,maxLife:.92,heal,ownerSlot:p.playerSlot,avatarSupreme:false});
      p.throwCd=p.human?1.05:1.18;
      textFx(f,p,'CURA · +' + heal + ' VIDA',COLORS.heal,.76);sparkFx(p.x,body(p)-18,COLORS.heal,18);sound('attack_light',.66);
    }else{
      const cfg={water:{speed:810,dmg:1.00,r:34,cd:.60},fire:{speed:890,dmg:.62,r:18,cd:.64},air:{speed:1030,dmg:1.02,r:34,cd:.68},lightning:{speed:1250,dmg:1.10,r:18,cd:.72}}[type];
      if(f.ktrakShots.length>=5)f.ktrakShots.shift();
      const groundBorn=type==='water';
      const groundSweep=type==='air';
      const startX=clamp(p.x+dir*(groundBorn?72:54),36,W-36);
      const startY=groundBorn?GROUND_Y+20:(groundSweep?GROUND_Y-78:(type==='lightning'?GROUND_Y-116:y));
      const baseY=groundBorn?GROUND_Y-60:(groundSweep?GROUND_Y-92:(type==='lightning'?GROUND_Y-116:y));
      if(type==='lightning'){
        const targetX=clamp(t.x+dir*10,42,W-42);
        f.ktrakShots.push({kind:type,beam:true,avatarSupreme:false,x:startX,y:GROUND_Y-118,baseY:GROUND_Y-118,vx:0,life:.24,maxLife:.24,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||36)*cfg.dmg,dead:false,r:cfg.r,phase:Math.random()*6.28,dir,length:Math.max(200,Math.min(520,Math.abs(targetX-startX)+72)),hasHit:false});
      }else{
        f.ktrakShots.push({kind:type,groundBorn,groundSweep,emergeT:groundBorn?.18:0,emergeMax:groundBorn?.18:0,startX,x:startX,y:startY,baseY,vx:dir*cfg.speed,life:1.62,maxLife:1.62,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||36)*cfg.dmg,dead:false,r:cfg.r,phase:Math.random()*6.28,trail:[],dir,waveHeight:groundBorn?96:0});
      }
      p.throwCd=p.human?cfg.cd:cfg.cd+.16;
      textFx(f,p,LABELS[type] + ' · ' + MOVE_NAMES[type],COLORS[type],.62);sparkFx(startX,groundBorn?GROUND_Y-6:baseY,COLORS[type],12);
    }
    p.ktrakCastT=.34;setPState(p,'throw');sound(type==='earth'||type==='lava'?'attack_heavy':'attack_light',type==='earth'||type==='lava'?.82:.76);
  }

  function avatarMode(p){
    const f=getFight();if(!f||!p||p.state==='ko')return;ensure(f);initFighter(p);
    p.ktrakAvatarT=8;p.ktrakAvatarMax=8;p.ktrakCastT=.72;p.specialCd=7.2;setPState(p,'special');
    textFx(f,p,'MODO AVATAR SUPREMO · DANO ×2','#75e9ff',1.18);sparkFx(p.x,body(p),'#59dfff',48);sound('attack_heavy',1);toast('KTRAK · AVATAR SUPREMO 8s · J LIBERA PODERES ELEMENTAIS EXTREMOS');
  }

  /* J e L */
  const oldThrow=window.throwProjectile;
  if(typeof oldThrow==='function')window.throwProjectile=function(p){if(p?.id==='ktrak'){elementalAttack(p);return}return oldThrow.apply(this,arguments)};
  const oldSpecial=window.castSpecial;
  if(typeof oldSpecial==='function')window.castSpecial=function(p){if(p?.id==='ktrak'){avatarMode(p);return}return oldSpecial.apply(this,arguments)};

  /* H / P2 9 alterna o elemento. */
  const oldPlayerInput=window.playerInput;
  if(typeof oldPlayerInput==='function')window.playerInput=function(p){
    if(p?.id==='ktrak'&&p.human&&p.state!=='ko'){
      initFighter(p);const key=p.playerSlot==='p2'?'Numpad9':'KeyH';
      if(window.justPressed?.[key]&&(p.ktrakSwitchCd||0)<=0&&p.state!=='hurt'&&p.state!=='throw'&&p.state!=='special'){
        cycleElement(p);window.justPressed[key]=false;
      }
    }
    return oldPlayerInput.apply(this,arguments);
  };

  /* Todo dano causado por Ktrak é dobrado enquanto o Avatar estiver ativo — inclui golpes, elementos e queimadura. */
  const oldDamage=window.damage;
  if(typeof oldDamage==='function')window.damage=function(victim,amount,src,dir,type){
    let attacker=null;
    try{attacker=src?.owner||(src?.id&&src!==victim?src:null)}catch(_){ }
    let value=Number(amount)||0;
    if(attacker?.id==='ktrak'&&(attacker.ktrakAvatarT||0)>0&&value>0&&type!=='hazard')value*=2;
    const beforeVictim=Number(victim?.hp||0);
    const result=oldDamage.call(this,victim,value,src,dir,type);
    const afterVictim=Number(victim?.hp||0);
    const dealt=Math.max(0,beforeVictim-afterVictim);
    if(dealt>0){
      if(victim)victim.ktrakLastDamageTaken=dealt;
      if(attacker)attacker.ktrakLastDamageDealt=dealt;
    }
    return result;
  };

  const oldStartFight=window.startFight;
  if(typeof oldStartFight==='function')window.startFight=function(){
    const r=oldStartFight.apply(this,arguments);const f=getFight();if(f){ensure(f);for(const p of [f.p1,f.p2])initFighter(p)}return r;
  };

  function applyHit(target,damageAmount,owner,dir,type){
    if(!target||target.state==='ko')return;
    try{window.damage?.(target,damageAmount,{owner,ktrakV20:true},dir,type)}catch(_){}
  }
  function applyBurnTick(target,amount,owner){
    if(!target||target.state==='ko')return;
    const x=target.x,vx=target.vx,state=target.state,stateT=target.stateT,defend=target.defend;
    applyHit(target,amount,owner,0,'ktrak-fire-dot');
    // A queimadura tira vida, mas não deve prender o adversário em hit-stun a cada tick.
    if(target.state!=='ko'){
      target.x=x;target.vx=vx;target.defend=defend;
      if(state&&state!=='ko'){target.state=state;target.stateT=stateT}
    }
  }

  function updateKtrak(f,dt){
    if(!f)return;ensure(f);
    for(const p of [f.p1,f.p2])if(p){
      if(p.id==='ktrak'){
        initFighter(p);p.ktrakSwitchCd=Math.max(0,(p.ktrakSwitchCd||0)-dt);p.ktrakCastT=Math.max(0,(p.ktrakCastT||0)-dt);
        const before=p.ktrakAvatarT||0;p.ktrakAvatarT=Math.max(0,before-dt);
        if(before>0&&p.ktrakAvatarT<=0)textFx(f,p,'AVATAR ENCERRADO','#bcecff',.72);
      }
      p.ktrakWetT=Math.max(0,(p.ktrakWetT||0)-dt);
      if((p.ktrakGustT||0)>0&&p.state!=='ko'){
        p.ktrakGustT=Math.max(0,p.ktrakGustT-dt);
        p.x=clamp(p.x+(p.ktrakGustDir||1)*560*dt,26,W-26);
      }
      if((p.ktrakBurnT||0)>0&&p.state!=='ko'){
        p.ktrakBurnT=Math.max(0,p.ktrakBurnT-dt);p.ktrakBurnTick=(p.ktrakBurnTick||0)-dt;
        while(p.ktrakBurnT>0&&p.ktrakBurnTick<=0&&p.state!=='ko'){
          p.ktrakBurnTick+=.20;const owner=p.ktrakBurnOwner;
          applyBurnTick(p,Math.max(3,Number(p.ktrakBurnDamage)||4),owner);sparkFx(p.x,body(p),'#ff6a2d',2);
        }
        if(p.ktrakBurnT<=0){p.ktrakBurnTick=0;p.ktrakBurnDamage=0;p.ktrakBurnOwner=null}
      }
      if((p.ktrakAvatarHealT||0)>0&&p.state!=='ko'){
        p.ktrakAvatarHealT=Math.max(0,p.ktrakAvatarHealT-dt);p.ktrakAvatarHealTick=(p.ktrakAvatarHealTick||0)-dt;
        while(p.ktrakAvatarHealT>0&&p.ktrakAvatarHealTick<=0){
          p.ktrakAvatarHealTick+=.34;
          const before=p.hp||0,add=Math.max(1,Number(p.ktrakAvatarHealAmount)||2);
          p.hp=Math.min(p.maxHp,p.hp+add);
          if((p.hp||0)>before)sparkFx(p.x,body(p)-16,COLORS.heal,2);
        }
        if(p.ktrakAvatarHealT<=0){p.ktrakAvatarHealTick=0;p.ktrakAvatarHealAmount=0}
      }
    }

    for(const z of f.ktrakShots){
      if(z.dead)continue;
      z.life-=dt;z.phase=(z.phase||0)+dt*(z.kind==='air'?13:z.kind==='fire'?11:8.5);z.hitTick=(z.hitTick||0)-dt;
      z.trail=[];
      const owner=slotOf(f,z.ownerSlot),target=slotOf(f,z.targetSlot);
      if(z.beam){
        if(owner){z.dir=owner.facing||z.dir||1;z.x=clamp(owner.x+z.dir*64,36,W-36);z.baseY=GROUND_Y-118;z.y=z.baseY;}
        if(target)z.length=Math.max(220,Math.min(620,Math.abs(target.x-z.x)+96));
      // Água: primeiro emerge verticalmente do piso; durante essa fase não atravessa o cenário nem acerta.
      }else if((z.emergeT||0)>0){
        z.emergeT=Math.max(0,z.emergeT-dt);
        const n=1-z.emergeT/Math.max(.001,z.emergeMax||.15),e=n*n*(3-2*n);
        z.x=z.startX||z.x;z.y=(GROUND_Y+20)+((z.baseY||GROUND_Y-42)-(GROUND_Y+20))*e;
      }else{
        z.x+=(z.vx||0)*dt;
        if(z.kind==='water')z.y=(z.baseY||z.y)+Math.sin(z.phase)*2.2;
        else if(z.kind==='fire')z.y=(z.baseY||z.y)+Math.sin(z.phase*.72)*2.5;
        else if(z.kind==='air'&&z.groundSweep)z.y=(z.baseY||z.y)+Math.sin(z.phase*.55)*4;
        else if(z.kind==='lightning')z.y=(z.baseY||z.y)+Math.sin(z.phase*2.2)*2.5;
      }
      const hitPad=z.kind==='air'?52:z.kind==='water'?88:z.kind==='lightning'?(z.beam?46:34):27;
      const hitX=z.kind==='air'?82:z.kind==='water'?86:z.kind==='lightning'?(z.beam?0:78):50;
      if(z.beam&&target&&target.state!=='ko'){
        const left=Math.min(z.x,z.x+(z.dir||1)*(z.length||0))-18,right=Math.max(z.x,z.x+(z.dir||1)*(z.length||0))+18;
        const beamCanHit=z.avatarSupreme?((z.hitTick||0)<=0):(!z.hasHit);
        if(target.x>=left&&target.x<=right&&hitY(target,z.y,hitPad)&&beamCanHit){
          if(z.avatarSupreme){z.hitTick=.11;z.hitCount=(z.hitCount||0)+1;}else{z.hasHit=true;z.hitCount=1;}
          const dir=z.dir||1;applyHit(target,z.dmg,owner,dir,'ktrak-lightning-beam');
          target.attackDisabledT=Math.max(target.attackDisabledT||0,z.avatarSupreme?.24:.18);target.vx=dir*(z.avatarSupreme?110:120);
          burst(f,'air-impact',target.x,body(target)-18,COLORS.lightning,.44,92,dir);sparkFx(target.x,body(target),COLORS.lightning,12);
          if(z.hitCount===1)textFx(f,target,z.avatarSupreme?'RAIO AZUL · PARALISIA':'RAIO AZUL',COLORS.lightning,.58);
        }
      }else if((z.emergeT||0)<=0&&target&&target.state!=='ko'&&Math.abs(z.x-target.x)<hitX&&hitY(target,z.y,hitPad)){
        z.dead=true;const dir=(z.vx||1)>0?1:-1;applyHit(target,z.dmg,owner,dir,`ktrak-${z.kind}`);
        if(z.kind==='water'){
          target.ktrakWetT=z.avatarSupreme?4:.72;target.x=clamp(target.x+dir*(z.avatarSupreme?10:18),26,W-26);
          if(z.avatarSupreme){target.freezeT=Math.max(target.freezeT||0,4);target.vx=0;target.vy=0;textFx(f,target,'CONGELADO · 4s','#d9fbff',.92);burst(f,'water-splash',target.x,body(target)-8,'#b8f7ff',.92,128,dir);sparkFx(target.x,body(target),'#d9fbff',48)}
          else{burst(f,'water-splash',target.x,body(target)-8,COLORS.water,.62,78,dir);sparkFx(target.x,body(target),'#69e5ff',34);textFx(f,target,'IMPACTO DE MARÉ','#9cf2ff',.56)}
        }else if(z.kind==='fire'){
          target.ktrakBurnT=1.0;target.ktrakBurnTick=.14;target.ktrakBurnOwner=owner;target.ktrakBurnDamage=Math.max(3,(owner?.dmg||36)*.11);
          burst(f,'fire-impact',target.x,body(target)-10,COLORS.fire,.60,66,dir);sparkFx(target.x,body(target),'#ff6a2d',30);textFx(f,target,'QUEIMANDO · 1s','#ff9c67',.62);
        }else if(z.kind==='air'){
          target.ktrakGustT=.18;target.ktrakGustDir=dir;target.x=clamp(target.x+dir*30,26,W-26);
          burst(f,'air-impact',target.x,body(target)-12,COLORS.air,.48,86,dir);sparkFx(target.x,body(target),'#d8f7ff',38);textFx(f,target,'RAJADA · EMPURRÃO','#d8f7ff',.58);
        }else if(z.kind==='lightning'){
          target.attackDisabledT=Math.max(target.attackDisabledT||0,z.avatarSupreme?.48:.34);
          target.vx=dir*(z.avatarSupreme?280:220);
          burst(f,'air-impact',target.x,body(target)-18,COLORS.lightning,.56,96,dir);sparkFx(target.x,body(target),COLORS.lightning,44);textFx(f,target,z.avatarSupreme?'RAIO AZUL · PARALISIA':'RAIO AZUL',COLORS.lightning,.64);
        }
      }
      if(z.life<=0||(!z.beam&&(z.x<-140||z.x>W+140)))z.dead=true;
    }
    f.ktrakShots=f.ktrakShots.filter(z=>!z.dead);

    for(const r of f.ktrakRocks){
      if(r.dead)continue;r.life-=dt;const owner=slotOf(f,r.ownerSlot),target=slotOf(f,r.targetSlot);
      if(r.mode==='ground-launch'){
        r.t=(r.t||0)+dt;
        if(r.phaseName==='rise'){
          const n=clamp(r.t/Math.max(.01,r.riseDur||.24),0,1),e=1-Math.pow(1-n,3);
          r.x=r.startX;r.y=(GROUND_Y+66)+((r.baseY||GROUND_Y-72)-(GROUND_Y+66))*e;r.spin=(r.spin||0)+dt*1.6;
          if(n>=1){r.phaseName='launch';r.t=0;burst(f,'earth-impact',r.x,GROUND_Y-8,COLORS.earth,.34,64,r.dir||1)}
        }else{
          r.x+=(r.vx||0)*dt;r.y=(r.baseY||GROUND_Y-72)+Math.sin((r.spin||0)*1.4)*3;r.spin=(r.spin||0)+dt*5.4;
          const dir=(r.vx||1)>=0?1:-1;
          if(target&&target.state!=='ko'&&Math.abs(r.x-target.x)<86&&hitY(target,r.y,56)){
            r.dead=true;applyHit(target,r.dmg,owner,dir,'ktrak-earth-rock');target.x=clamp(target.x+dir*48,26,W-26);
            burst(f,'earth-impact',r.x,body(target),COLORS.earth,.64,104,dir);sparkFx(r.x,body(target),COLORS.earth,16);textFx(f,target,'ROCHA DO SOLO',COLORS.earth,.60);
          }
          if(r.x<-100||r.x>W+100)r.dead=true;
        }
      }else{
        // Compatibilidade com objetos de versões anteriores já presentes em uma luta salva.
        if(r.delay>0){r.delay-=dt;continue}
        r.vy=(r.vy||0)+1580*dt;r.y+=(r.vy||0)*dt;r.spin=(r.spin||0)+dt*3.2;
        if(r.y>=GROUND_Y-10)r.dead=true;
      }
      if(r.life<=0)r.dead=true;
    }
    f.ktrakRocks=f.ktrakRocks.filter(r=>!r.dead);

    for(const tw of f.ktrakTornadoes){
      if(tw.dead)continue;tw.life-=dt;tw.t+=dt;tw.phase+=dt*9;
      const owner=slotOf(f,tw.ownerSlot),target=slotOf(f,tw.targetSlot);if(!target||target.state==='ko'){tw.dead=true;continue}
      if(tw.t<1.18){tw.x=target.x;target.onGround=false;target.vx=0;target.vy=0;target.y=clamp(70+tw.t*185+Math.sin(tw.phase)*9,70,292);target.attackDisabledT=Math.max(target.attackDisabledT||0,.16);}
      else if(!tw.released){tw.released=true;tw.fallPending=true;target.onGround=false;target.y=Math.max(target.y||0,278);target.vy=-1180;target.vx=tw.dir*90;applyHit(target,(owner?.dmg||36)*1.10,owner,tw.dir,'ktrak-air-tornado');burst(f,'air-impact',target.x,body(target),COLORS.air,.78,122,tw.dir);textFx(f,target,'LANÇADO PELO TORNADO',COLORS.air,.72);}
      else if(tw.fallPending&&target.onGround){tw.fallPending=false;applyHit(target,(owner?.dmg||36)*1.45,owner,tw.dir,'ktrak-air-fall');target.vx=tw.dir*360;burst(f,'earth-impact',target.x,GROUND_Y-8,'#dffcff',.78,132,tw.dir);sparkFx(target.x,GROUND_Y-8,'#efffff',52);textFx(f,target,'DANO DE QUEDA',COLORS.air,.78);tw.dead=true;}
      if(tw.life<=0)tw.dead=true;
    }
    f.ktrakTornadoes=f.ktrakTornadoes.filter(x=>!x.dead);

    for(const inf of f.ktrakInfernos){
      inf.life-=dt;inf.t+=dt;inf.phase+=dt*5;inf.tick-=dt;const owner=slotOf(f,inf.ownerSlot),target=slotOf(f,inf.targetSlot);
      if(inf.tick<=0){inf.tick+=.22;if(target&&target.state!=='ko'&&(target.y||0)<155){applyBurnTick(target,(owner?.dmg||36)*.18,owner);target.ktrakBurnT=Math.max(target.ktrakBurnT||0,.45);target.ktrakBurnOwner=owner;target.ktrakBurnDamage=Math.max(3,(owner?.dmg||36)*.08);sparkFx(target.x,GROUND_Y-(target.y||0)-18,'#ff7a2b',2)}}
    }
    f.ktrakInfernos=f.ktrakInfernos.filter(x=>x.life>0);

    for(const pool of f.ktrakLavaPools){
      if(!pool.persistent)pool.life-=dt;pool.tick-=dt;pool.openT=Math.max(0,(pool.openT||0)-dt);pool.riseT=Math.max(0,(pool.riseT||0)-dt);
      const owner=slotOf(f,pool.ownerSlot),target=slotOf(f,pool.targetSlot);
      if(target&&target.state!=='ko'){
        const dx=target.x-pool.x;
        const inHole=Math.abs(dx)<pool.holeRadius&&target.onGround;
        if(inHole&&pool.tick<=0){
          pool.tick+=pool.avatarSupreme?.10:.14;
          applyBurnTick(target,(owner?.dmg||36)*(pool.coreBurn||.12),owner);
          target.ktrakBurnT=Math.max(target.ktrakBurnT||0,pool.avatarSupreme?.70:.40);
          target.ktrakBurnOwner=owner;target.ktrakBurnDamage=Math.max(3,(owner?.dmg||36)*(pool.avatarSupreme?.10:.06));
          target.attackDisabledT=Math.max(target.attackDisabledT||0,pool.avatarSupreme?.16:.09);
          target.x=clamp(target.x,pool.x-pool.holeRadius*.55,pool.x+pool.holeRadius*.55);
        }
      }
    }
    f.ktrakLavaPools=f.ktrakLavaPools.filter(x=>x.persistent||x.life>0);

    for(const col of f.ktrakHealColumns){col.life-=dt;}
    f.ktrakHealColumns=f.ktrakHealColumns.filter(x=>x.life>0);

    for(const c of f.ktrakEarthCrushes){
      if(c.dead)continue;c.life-=dt;c.t+=dt;const owner=slotOf(f,c.ownerSlot),target=slotOf(f,c.targetSlot);if(!target||target.state==='ko'){c.dead=true;continue}
      if(c.t<.46){const n=clamp(c.t/.46,0,1);c.rockX=c.rockStart;c.rockY=GROUND_Y+58-n*122;target.x=clamp(target.x,c.left+30,c.right-30);target.vx=0;target.attackDisabledT=Math.max(target.attackDisabledT||0,.12);}
      else{const n=clamp((c.t-.46)/.72,0,1);c.rockX=c.rockStart+(c.center+c.dir*190-c.rockStart)*(n*n*(3-2*n));c.rockY=GROUND_Y-64-Math.sin(n*Math.PI)*14;target.x=clamp(target.x,c.left+28,c.right-28);if(!c.hit&&n>=.40){c.hit=true;applyHit(target,(owner?.dmg||36)*2.0,owner,c.dir,'ktrak-earth-avatar-crush');target.vx=c.dir*480;target.vy=Math.max(target.vy||0,260);target.onGround=false;burst(f,'earth-impact',target.x,body(target),COLORS.earth,.92,148,c.dir);sparkFx(target.x,body(target),COLORS.earth,54);textFx(f,target,'IMPACTO ×2',COLORS.earth,.84)}if(!c.farWallBroken&&n>=.88){c.farWallBroken=true;const wx=c.dir>0?c.right:c.left;burst(f,'earth-impact',wx,GROUND_Y-62,'#f0c981',.82,126,c.dir);sparkFx(wx,GROUND_Y-70,'#e1b86d',50)}}
      if(c.t>=1.32||c.life<=0)c.dead=true;
    }
    f.ktrakEarthCrushes=f.ktrakEarthCrushes.filter(x=>!x.dead);

    for(const b of f.ktrakBursts){b.life-=dt;b.t=(b.t||0)+dt}f.ktrakBursts=f.ktrakBursts.filter(b=>b.life>0);
    for(const e of f.ktrakFx){e.life-=dt;e.y-=19*dt}f.ktrakFx=f.ktrakFx.filter(e=>e.life>0);
  }

  const oldUpdate=window.update;
  if(typeof oldUpdate==='function')window.update=function(f,dt){const r=oldUpdate.apply(this,arguments);if(!f?.paused)updateKtrak(f,dt);return r};

  const MOTION_COUNTS=Object.freeze({walk:24,kick:16});
  const easeInOut=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const windowBell=(t,a,b,c,d)=>easeInOut((t-a)/(b-a))*(1-easeInOut((t-c)/(d-c)));
  function authoredMotion(kind,phase){
    const count=MOTION_COUNTS[kind]||12,loop=kind==='walk';
    let p=Number(phase)||0;p=loop?((p%1)+1)%1:clamp(p,0,1);
    const frame=Math.min(count-1,Math.floor(p*(loop?count:count-1)));
    return {kind,frame,phase:frame/(loop?count:Math.max(1,count-1))};
  }
  function poseIndex(p){
    const kind=p?.proMove?.kind;
    if(p?.state==='ko')return 5;
    if(p?.proKnockdownT>0&&p?.onGround)return 3;
    if(kind==='uppercut')return 5;
    if(kind==='punch')return 2;
    if(p?.defend||p?.state==='defend')return 4;
    if(p?.state==='crouch')return 3;
    if(p?.state==='special')return 4;
    if(p?.state==='throw'||(p?.ktrakCastT||0)>0)return 2;
    if(p?.state==='hurt'||(p?.hitFlash||0)>.035)return 1;
    if(!p?.onGround||p?.state==='air')return 5;
    if(Math.abs(p?.vx||0)>7)return 1;
    return 0;
  }
  function drawAvatarEyes(ctx,p,frame,w,h,alpha=1){
    if((p.ktrakAvatarT||0)<=0||alpha<=0)return;const [rx,ry]=EYE_POS[frame]||EYE_POS[0];
    const cx=-w/2+w*rx,cy=-h+h*ry,sep=4.6;
    ctx.save();ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='lighter';ctx.fillStyle='#bff6ff';ctx.shadowColor='#28c8ff';ctx.shadowBlur=20;
    for(const dx of [-sep,sep]){ctx.beginPath();ctx.arc(cx+dx,cy,2.4,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha*=.32+.10*Math.sin(performance.now()/70);ctx.fillStyle='#43d8ff';ctx.beginPath();ctx.arc(cx,cy,17,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function imageMetrics(img,H=226){const ref=580,scale=H/ref;return {w:img.naturalWidth*scale,h:img.naturalHeight*scale}}
  function drawRawPose(ctx,img,H=226,alpha=1){
    if(!img?.complete||!img.naturalWidth||alpha<=0)return null;const {w,h}=imageMetrics(img,H);ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();return {w,h};
  }
  function drawWalkMotion(ctx,p,H,time){
    // Passos reais leves: apoio -> impulso -> balanço -> contato, com pe de apoio compensado no chao.
    // Mantem apenas 3 drawImage por frame e nao adiciona particulas nem blur.
    const img=POSES[0];if(!img?.complete||!img.naturalWidth)return false;
    const speed=clamp(Math.abs(Number(p.vx)||0)/Math.max(1,Number(p.speed)||210),.30,1.26);
    const cadence=2.70+speed*1.75,cycle=((time*cadence)%1+1)%1,dir=Math.sign(Number(p.vx)||p.facing||1)||1;
    const sw=img.naturalWidth,sh=img.naturalHeight,{w}=imageMetrics(img,H),srcY=sh*.49,srcH=sh-srcY,hipY=-H*.51,legH=H*.52;
    const gait=t=>{
      t=((t%1)+1)%1;
      if(t<.60){
        const u=easeInOut(t/.60);
        return {angle:(-.068+.136*u)*speed,lift:0,reach:(2.1-4.2*u)*speed,stance:true};
      }
      const u=easeInOut((t-.60)/.40),arc=Math.sin(Math.PI*u);
      return {angle:(.080-.160*u)*speed,lift:arc*(3.6+.8*speed),reach:(-2.1+4.2*u)*speed,stance:false};
    };
    const left=gait(cycle),right=gait(cycle+.5),bodyWave=Math.sin(cycle*Math.PI*2),bob=Math.abs(bodyWave)*.85*speed;
    ctx.save();ctx.translate(dir*.55,-bob);ctx.rotate(dir*(.004+.002*speed)-bodyWave*.0022);
    const drawLeg=(leftSide,g)=>{
      const sx=leftSide?18:150,srcW=leftSide?142:137,pivotSrcX=leftSide?101:205;
      const hipX=(pivotSrcX-sw/2)*(w/sw),groundFix=legH*(1-Math.cos(g.angle));
      ctx.save();ctx.translate(hipX+g.reach,hipY+groundFix-g.lift);ctx.rotate(g.angle);
      ctx.drawImage(img,sx,srcY,srcW,srcH,(sx-pivotSrcX)*(w/sw),0,srcW*(w/sw),legH);
      ctx.restore();
    };
    const legs=[{left:true,g:left},{left:false,g:right}].sort((a,b)=>a.g.reach-b.g.reach);
    for(const leg of legs)drawLeg(leg.left,leg.g);
    const weightShift=(right.reach-left.reach)*.10;
    ctx.save();ctx.translate(weightShift,Math.cos(cycle*Math.PI*4)*.18);ctx.rotate(-bodyWave*.0036*speed);ctx.drawImage(img,0,0,sw,sh*.70,-w/2,-H,w,H*.70);ctx.restore();
    drawAvatarEyes(ctx,p,0,w,H,1);
    ctx.restore();return true;
  }
  function drawKickTrail(ctx,p,floor,H,n){
    const img=POSES[5];if(!img?.complete||!img.naturalWidth)return;
    const impact=windowBell(n,.25,.42,.66,.84);if(impact<=.02)return;
    const {w,h}=imageMetrics(img,H);
    ctx.save();ctx.translate(p.x,floor);ctx.scale(p.facing||1,1);ctx.globalCompositeOperation='lighter';
    for(let i=1;i>=1;i--){ctx.save();ctx.globalAlpha=.09*impact;ctx.translate(-i*9*impact,-i*.6);ctx.rotate(.012*i*impact);ctx.drawImage(img,-w/2,-h,w,h);ctx.restore()}
    ctx.strokeStyle=(p.ktrakAvatarT||0)>0?'#83efff':'#ffd5a4';ctx.shadowColor=(p.ktrakAvatarT||0)>0?'#3fd9ff':'#ff8a42';ctx.shadowBlur=11;ctx.lineWidth=4;ctx.globalAlpha=.16+.32*impact;ctx.beginPath();ctx.arc(H*.16,-H*.40,H*.36,-1.05,.52);ctx.stroke();ctx.restore();
  }
  function drawKickMotion(ctx,p,H,time){
    const prep=POSES[1],strike=POSES[5];if(!prep?.complete||!prep.naturalWidth)return false;
    const duration=Math.max(.001,Number(p.proMove?.duration)||.47),n=clamp((Number(p.proMove?.time)||0)/duration,0,1);
    const hit=easeInOut((n-.14)/.22)*(1-easeInOut((n-.66)/.24));
    ctx.save();ctx.translate(hit*9,-hit*2.5);ctx.rotate(-hit*.028);
    const img=hit>.22&&strike?.complete&&strike.naturalWidth?strike:prep,frame=img===strike?5:1,met=drawRawPose(ctx,img,H,1);
    if(met)drawAvatarEyes(ctx,p,frame,met.w,met.h,1);
    ctx.restore();return true;
  }
  function drawKtrakFighter(ctx,p){
    const kick=p?.proMove?.kind==='kick',frame=poseIndex(p),img=POSES[frame];if(!img?.complete||!img.naturalWidth)return false;
    const floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0),H=226,{w,h}=imageMetrics(img,H),time=performance.now()/1000;
    const air=Math.max(0,Number(p.y)||0),shadow=Math.max(.28,1-air/430);
    ctx.save();ctx.globalAlpha=.32*shadow;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,GROUND_Y+4,kick?48:42*shadow,kick?9:8*shadow,0,0,Math.PI*2);ctx.fill();ctx.restore();
    if((p.ktrakAvatarT||0)>0){ctx.save();ctx.globalAlpha=.12+.04*Math.sin(time*8);ctx.fillStyle='#3ed9ff';ctx.beginPath();ctx.ellipse(p.x,floor-h*.47,44,88,0,0,Math.PI*2);ctx.fill();ctx.restore()}
    if(kick)drawKickTrail(ctx,p,floor,H,clamp((Number(p.proMove?.time)||0)/Math.max(.001,Number(p.proMove?.duration)||.47),0,1));
    ctx.save();ctx.translate(p.x,floor+(p.onGround&&p.state==='idle'?Math.sin(time*3.2+p.x*.01)*1.5:0));ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.shadowBlur=0;
    const downed=(p.proKnockdownT||0)>0&&p.onGround&&p.state!=='ko';
    const walking=p.onGround&&!downed&&!kick&&p.state!=='hurt'&&p.state!=='ko'&&!p.defend&&p.state!=='defend'&&p.state!=='crouch'&&p.state!=='throw'&&p.state!=='special'&&Math.abs(p.vx||0)>7;
    if(downed){const dimg=POSES[3]||img;ctx.translate(-10,-10);ctx.rotate(-Math.PI/2);ctx.translate(0,70);drawRawPose(ctx,dimg,194,.92)}
    else if(kick){drawKickMotion(ctx,p,H,time)}
    else if(walking){drawWalkMotion(ctx,p,H,time)}
    else{
      if(p.state==='ko'){ctx.translate(-8,-7);ctx.rotate(-Math.PI/2);ctx.translate(0,h*.34)}
      ctx.drawImage(img,-w/2,-h,w,h);drawAvatarEyes(ctx,p,frame,w,h,1);
    }
    ctx.restore();
    if(kick&&(p.proHitConfirm||0)>0){ctx.save();ctx.strokeStyle='#fff4d8';ctx.globalAlpha=clamp((p.proHitConfirm||0)/.13,.15,1);ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x+(p.facing||1)*72,floor-H*.38,22,0,Math.PI*2);ctx.stroke();ctx.restore()}
    
    return true;
  }
  const oldDrawFighter=window.drawFighter;
  if(typeof oldDrawFighter==='function')window.drawFighter=function(ctx,p){if(p?.id==='ktrak'&&drawKtrakFighter(ctx,p))return;return oldDrawFighter.apply(this,arguments)};

  function drawShot(ctx,z){
    const col=COLORS[z.kind]||'#fff',dir=(z.vx||1)>=0?1:-1;ctx.save();ctx.translate(z.x,z.y);ctx.scale(dir,1);ctx.globalAlpha=.92;
    if(z.kind==='water'){
      if((z.emergeT||0)>0){
        const n=1-z.emergeT/Math.max(.001,z.emergeMax||.15),h=(z.waveHeight||96)*n;
        ctx.fillStyle='rgba(76,220,255,.76)';ctx.beginPath();ctx.moveTo(-22,24);ctx.quadraticCurveTo(-14,-h*.34,-5,-h*.62);ctx.quadraticCurveTo(4,-h*.96,15,-h*.72);ctx.quadraticCurveTo(26,-h*.40,24,22);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#ecfeff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-h*.34);ctx.quadraticCurveTo(5,-h*.98,18,-h*.54);ctx.stroke();
      }else{
        const h=z.waveHeight||96;
        ctx.fillStyle='#51d8f7';ctx.beginPath();ctx.moveTo(-54,18);ctx.quadraticCurveTo(-34,-10,-12,-36);ctx.quadraticCurveTo(5,-h*.98,22,-56);ctx.quadraticCurveTo(42,-28,58,14);ctx.quadraticCurveTo(18,6,-54,18);ctx.fill();
        ctx.fillStyle='rgba(180,249,255,.86)';ctx.beginPath();ctx.moveTo(-6,-28);ctx.quadraticCurveTo(12,-h*.88,30,-42);ctx.quadraticCurveTo(14,-36,-6,-28);ctx.fill();
        ctx.strokeStyle='#f5ffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-28);ctx.quadraticCurveTo(10,-h*.92,28,-40);ctx.stroke();
      }
    }else if(z.kind==='fire'){
      ctx.fillStyle='#ff8a2b';ctx.beginPath();ctx.moveTo(-34,7);ctx.quadraticCurveTo(-4,-23,30,-3);ctx.quadraticCurveTo(4,18,-34,7);ctx.fill();ctx.fillStyle='rgba(255,224,112,.72)';ctx.beginPath();ctx.moveTo(-25,4);ctx.quadraticCurveTo(-1,-12,19,-2);ctx.quadraticCurveTo(0,9,-25,4);ctx.fill();
    }else if(z.kind==='lightning'){
      const drawBolt=(lw,col,alpha=1,spread=1)=>{ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();const len=z.beam?(z.length||260):68;ctx.moveTo(-22,-2);const steps=z.beam?8:4;for(let i=1;i<=steps;i++){const t=i/steps,x=-22+t*len;let y=((i%2)?-1:1)*(z.beam?14:10)*spread+Math.sin((z.phase||0)*1.6+i*1.7)*(z.beam?5:3);if(i===steps)y=0;ctx.lineTo(x,y);}ctx.stroke();if(z.beam){for(const bp of [.26,.53,.78]){const bx=-22+len*bp,by=((Math.round(bp*10)%2)?-1:1)*10*spread;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+22,-24*spread);ctx.lineTo(bx+14,-2*spread);ctx.stroke();}}ctx.restore();};
      ctx.shadowColor='#5ab7ff';ctx.shadowBlur=z.beam?16:12;drawBolt(z.beam?10:8,'rgba(90,183,255,.34)',.70,1.2);drawBolt(z.beam?5.5:4,'#5ab7ff',1,1);drawBolt(z.beam?2.3:2.4,'#f7fdff',1,.72);
    }else{
      ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,30,-1.2,1.2);ctx.stroke();ctx.globalAlpha=.42;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-9,4,20,-1.15,1.15);ctx.stroke();
    }ctx.restore();
  }

  function drawBurst(ctx,b){const n=clamp(b.life/(b.maxLife||1),0,1),t=1-n,s=b.size||60;ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha=.55*n;ctx.strokeStyle=b.color||'#fff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,2,s*(.18+.48*t),s*(.06+.12*t),0,0,Math.PI*2);ctx.stroke();ctx.restore();}

  function drawAvatarTornado(ctx,tw){const a=clamp(tw.life/(tw.maxLife||1),0,1),tm=performance.now()/1000;ctx.save();ctx.translate(tw.x,GROUND_Y-6);ctx.globalAlpha=.42*a;ctx.strokeStyle='#dffcff';ctx.lineWidth=3;for(let i=0;i<3;i++){const y=-i*70,rx=34+i*16;ctx.beginPath();ctx.ellipse(Math.sin(tm*4+i)*4,y,rx,11,0,0,Math.PI*2);ctx.stroke()}ctx.restore();}
  function drawAvatarInferno(ctx,inf){const a=clamp(inf.life/(inf.maxLife||1),0,1),tm=performance.now()/1000;ctx.save();ctx.globalAlpha=.22*a;ctx.fillStyle='#ff4a16';ctx.fillRect(0,GROUND_Y-18,W,20);for(let x=50;x<W;x+=180){const hh=30+14*Math.abs(Math.sin(tm*3+x*.02));ctx.globalAlpha=.34*a;ctx.fillStyle='#ff8a2b';ctx.beginPath();ctx.moveTo(x-14,GROUND_Y-4);ctx.quadraticCurveTo(x,GROUND_Y-hh,x+14,GROUND_Y-4);ctx.fill()}ctx.restore();}
  function drawLavaPool(ctx,pool){
    const a=clamp(pool.life/(pool.maxLife||1),0,1),open=1-clamp((pool.openT||0)/Math.max(.001,pool.maxOpen||.4),0,1),rise=1-clamp((pool.riseT||0)/Math.max(.001,pool.maxRise||1.2),0,1),tm=performance.now()/1000;
    ctx.save();ctx.translate(pool.x,GROUND_Y);ctx.globalAlpha=.96*a;
    ctx.strokeStyle='#592316';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(-pool.radius,-1);ctx.lineTo(-pool.holeRadius-20,-10-open*8);ctx.lineTo(-pool.holeRadius*0.45,-4-open*5);ctx.lineTo(0,-18*open);ctx.lineTo(pool.holeRadius*0.45,-5-open*4);ctx.lineTo(pool.holeRadius+22,-11-open*8);ctx.lineTo(pool.radius,-1);ctx.stroke();
    // rachaduras no chao partindo
    ctx.strokeStyle='rgba(130,78,42,.72)';ctx.lineWidth=2;
    for(const sx of [-1,1]){ctx.beginPath();ctx.moveTo(sx*(pool.holeRadius+8),-6);ctx.lineTo(sx*(pool.holeRadius+28),-16-open*5);ctx.lineTo(sx*(pool.holeRadius+46),-10);ctx.stroke();ctx.beginPath();ctx.moveTo(sx*(pool.holeRadius-4),-3);ctx.lineTo(sx*(pool.holeRadius+15),8);ctx.lineTo(sx*(pool.holeRadius+30),3);ctx.stroke();}
    // cavidade escura
    ctx.fillStyle='rgba(32,10,7,.92)';ctx.beginPath();ctx.ellipse(0,4,pool.holeRadius*open,14+10*open,0,0,Math.PI*2);ctx.fill();
    // lava subindo de dentro, sem derramar para fora
    const lavaTop=-2-(12+18*Math.abs(Math.sin(tm*3.6)))*rise*open;
    ctx.fillStyle='rgba(255,92,34,.86)';ctx.beginPath();ctx.ellipse(0,3,pool.holeRadius*.88*open,9+8*open,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,178,76,.55)';ctx.beginPath();ctx.ellipse(Math.sin(tm*5)*4,0,pool.holeRadius*.50*open,4+3*Math.abs(Math.sin(tm*7)),0,0,Math.PI*2);ctx.fill();
    for(let i=-1;i<=1;i++){
      const off=i*14;ctx.fillStyle='rgba(255,108,40,.50)';ctx.beginPath();ctx.moveTo(off,2);ctx.quadraticCurveTo(off+3,lavaTop-(i===0?8:0),off+8,0);ctx.quadraticCurveTo(off+4,-2,off,2);ctx.fill();
      ctx.fillStyle='rgba(255,214,120,.28)';ctx.beginPath();ctx.arc(off+3,lavaTop+6*Math.sin(tm*4+i),2.5+1.5*rise,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function drawHealColumn(ctx,col){
    const a=clamp(col.life/(col.maxLife||1),0,1),tm=performance.now()/1000;ctx.save();ctx.translate(col.x,GROUND_Y-4);ctx.globalAlpha=(col.blessing?.78:.68)*a;
    ctx.fillStyle=col.blessing?'rgba(127,240,200,.26)':'rgba(127,240,200,.36)';ctx.beginPath();ctx.moveTo(-18,4);ctx.quadraticCurveTo(-12,-76-Math.sin(tm*4)*10,0,-130);ctx.quadraticCurveTo(12,-76+Math.sin(tm*4)*10,18,4);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#d9fff0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,-108);ctx.quadraticCurveTo(0,-132,6,-107);ctx.stroke();
    if(col.blessing){ctx.globalAlpha=.42*a;ctx.strokeStyle='rgba(217,255,240,.95)';ctx.beginPath();ctx.arc(0,-36,20+Math.sin(tm*4)*2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,-78,14+Math.cos(tm*4.5)*1.5,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function drawAvatarEarth(ctx,c){
    const tm=performance.now()/1000;ctx.save();ctx.shadowColor='#b27b42';ctx.shadowBlur=16;for(const [side,x] of [['left',c.left],['right',c.right]]){if(c.farWallBroken&&((c.dir>0&&side==='right')||(c.dir<0&&side==='left')))continue;ctx.save();ctx.translate(x,GROUND_Y);ctx.fillStyle='#6e4a2c';ctx.strokeStyle='#d9ad69';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(-36,-116);ctx.lineTo(-18,-152);ctx.lineTo(6,-142);ctx.lineTo(31,-158);ctx.lineTo(36,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(248,210,145,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18,-128);ctx.lineTo(4,-92);ctx.lineTo(-7,-54);ctx.moveTo(22,-116);ctx.lineTo(4,-82);ctx.lineTo(18,-42);ctx.stroke();ctx.restore()}ctx.translate(c.rockX,c.rockY);ctx.rotate(tm*5*c.dir);ctx.fillStyle='#76502d';ctx.strokeStyle='#f0c67d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-46,-32);ctx.lineTo(-12,-52);ctx.lineTo(34,-40);ctx.lineTo(54,-5);ctx.lineTo(39,38);ctx.lineTo(0,51);ctx.lineTo(-42,35);ctx.lineTo(-55,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }

  function drawKtrakFx(ctx,f){
    if(!ctx||!f)return;
    for(const inf of (f.ktrakInfernos||[]))drawAvatarInferno(ctx,inf);
    for(const pool of (f.ktrakLavaPools||[]))drawLavaPool(ctx,pool);
    for(const col of (f.ktrakHealColumns||[]))drawHealColumn(ctx,col);
    for(const c of (f.ktrakEarthCrushes||[]))drawAvatarEarth(ctx,c);
    for(const tw of (f.ktrakTornadoes||[]))drawAvatarTornado(ctx,tw);
    for(const z of (f.ktrakShots||[]))drawShot(ctx,z);
    for(const r of (f.ktrakRocks||[])){
      ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.spin||0);
      ctx.fillStyle='#76502d';ctx.strokeStyle='#e5bd77';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(-48,-28);ctx.lineTo(-15,-48);ctx.lineTo(29,-38);ctx.lineTo(51,-8);ctx.lineTo(40,29);ctx.lineTo(5,47);ctx.lineTo(-37,36);ctx.lineTo(-52,6);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='rgba(255,220,155,.46)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-16,-31);ctx.lineTo(-5,-5);ctx.lineTo(15,9);ctx.moveTo(28,-21);ctx.lineTo(11,-6);ctx.stroke();ctx.restore();
      // Fenda no chão durante a fase em que a rocha está sendo erguida.
      if(r.mode==='ground-launch'&&r.phaseName==='rise'){ctx.save();ctx.globalAlpha=.68;ctx.strokeStyle='#d3a35f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r.startX-46,GROUND_Y-3);ctx.lineTo(r.startX-20,GROUND_Y-11);ctx.lineTo(r.startX,GROUND_Y-4);ctx.lineTo(r.startX+22,GROUND_Y-13);ctx.lineTo(r.startX+47,GROUND_Y-4);ctx.stroke();ctx.restore()}
    }
    for(const b of (f.ktrakBursts||[]))drawBurst(ctx,b);

    for(const p of [f.p1,f.p2])if((p?.ktrakBurnT||0)>0){ctx.save();ctx.translate(p.x,body(p));ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ff6a2d';ctx.shadowColor='#ff6a2d';ctx.shadowBlur=20;ctx.globalAlpha=.42+.14*Math.sin(performance.now()/85);for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*12,-4);ctx.quadraticCurveTo(i*12-8,-22,i*12+2,-42);ctx.quadraticCurveTo(i*12+11,-22,i*12+8,-3);ctx.closePath();ctx.fill()}ctx.restore()}
    for(const p of [f.p1,f.p2])if((p?.ktrakWetT||0)>0){const a=clamp(p.ktrakWetT/.72,0,1);ctx.save();ctx.translate(p.x,body(p));ctx.globalCompositeOperation='lighter';ctx.fillStyle='#7de9ff';ctx.shadowColor='#4bdcff';ctx.shadowBlur=13;ctx.globalAlpha=.34*a;for(let i=0;i<4;i++){const ang=performance.now()*.004+i*1.57;ctx.beginPath();ctx.arc(Math.cos(ang)*20,-12-Math.abs(Math.sin(ang*1.3))*36,2+(i%2),0,Math.PI*2);ctx.fill()}ctx.restore()}

    for(const e of (f.ktrakFx||[])){const a=clamp(e.life/(e.maxLife||1),0,1);ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.font='900 13px Oxanium,Arial';ctx.fillStyle=e.color||'#fff';ctx.fillText(e.text,e.x,e.y);ctx.restore()}
    for(const [idx,p] of [f.p1,f.p2].entries())if(p?.id==='ktrak'&&p.human){
      initFighter(p);const x=idx===0?34:W-294,y=142,w=260,h=55,el=currentElement(p);ctx.save();ctx.fillStyle='rgba(3,9,15,.76)';ctx.strokeStyle=COLORS[el];ctx.lineWidth=2;ctx.shadowColor=COLORS[el];ctx.shadowBlur=10;ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.textAlign='left';ctx.fillStyle='#dff8ff';ctx.font='800 10px Oxanium,Arial';ctx.fillText(`KTRAK · H / 9 ALTERNA`,x+12,y+16);ctx.fillStyle=COLORS[el];ctx.font='900 14px Oxanium,Arial';ctx.fillText(`J · ${LABELS[el]} · ${MOVE_NAMES[el]}`,x+12,y+36);ctx.font='800 9px Oxanium,Arial';ctx.fillStyle='rgba(225,249,255,.75)';const desc=(p.ktrakAvatarT||0)>0?(el==='water'?'AVATAR · ONDA CONGELA 4s':el==='earth'?'AVATAR · PAREDES + ROCHA ×2':el==='fire'?'AVATAR · FOGO NO MAPA TODO':el==='air'?'AVATAR · TORNADO + QUEDA':el==='lightning'?'AVATAR · FEIXE DE RAIO AZUL':el==='lava'?'AVATAR · ABISMO DE LAVA · 7s':'AVATAR · NASCENTE DE CURA'):(el==='water'?'ÁGUA SAI DO CHÃO E VIRA ONDA ALTA':el==='earth'?'ROCHA SAI DO SOLO E É LANÇADA':el==='fire'?'JATO DE FOGO PELAS MÃOS':el==='air'?'CORTE DE AR RASTEIRO + EMPURRÃO':el==='lightning'?'RAIO AZUL HORIZONTAL · VISUAL AVATAR':el==='lava'?'BURACO DE LAVA PERSISTENTE':'ÁGUA SOBE E CURA');ctx.fillText(desc,x+12,y+50);if((p.ktrakAvatarT||0)>0){ctx.textAlign='right';ctx.fillStyle='#72e6ff';ctx.font='900 12px Oxanium,Arial';ctx.fillText(`AVATAR ${p.ktrakAvatarT.toFixed(1)}s`,x+w-12,y+18)}ctx.restore();
    }
  }
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){const r=oldDraw.apply(this,arguments);try{drawKtrakFx(canvas.getContext('2d'),f)}catch(_){}return r};

  /* API pública / online R.A.V.A.M */
  try{
    if(window.RavamStudios){
      const old=window.RavamStudios,ability={flag:'RAVAM',role:'Mestre dos Elementos',tag:'AVATAR PLUS',desc:'J alterna entre Água, Terra, Fogo, Ar, Raio Azul, Lava e Cura. Água sai do chão e vira uma onda até a cintura do inimigo; Terra rompe o solo e lança rocha; Fogo sai em jato frontal; Ar vira corte rasteiro; Raio Azul cruza na horizontal; Lava abre uma fenda persistente; Cura faz a água subir sobre o próprio Ktrak e recuperar o último dano sofrido. L ativa o Avatar por 8s com dano dobrado e versões supremas.'};
      window.RavamStudios={...old,version:VERSION,ktrak:old.ktrak||((typeof CHARACTERS!=='undefined'&&CHARACTERS.find(c=>c.id==='ktrak'))||null),ktrakAbility:ability,r19Abilities:{...(old.r19Abilities||{}),ktrak:ability}};
    }
  }catch(_){}

  window.KtrakV20=Object.freeze({version:VERSION,elements:ELEMENTS.slice(),labels:{...LABELS},moves:{...MOVE_NAMES},cycle:cycleElement,attack:elementalAttack,avatar:avatarMode});
})();
