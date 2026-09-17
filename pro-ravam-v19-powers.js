/* SORTEP NIAK — R.A.V.A.M V19 POWER & MECHANIC OVERHAUL
 * Mantém o elenco e a progressão da versão base e melhora a identidade de combate:
 * Leo = Portais | Aria = Natureza | Alana = Armas | Tharoth = Sombra/Escuridão | Kain = 10 poderes.
 */
(()=>{
  'use strict';
  if(window.RavamV19Powers?.version)return;
  const VERSION='19.0.0-ravam-powers';
  const IDS=new Set(['priya','kain','aria','leo','tharoth']);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const now=()=>performance.now()/1000;
  const opponent=(p,f=typeof fight!=='undefined'?fight:null)=>f?(p===f.p1?f.p2:f.p1):null;
  const slotOf=(f,s)=>s==='p2'?f?.p2:f?.p1;
  const by=(p)=>typeof bodyY==='function'?bodyY(p):GROUND_Y-(p?.y||0)-72;
  const hitY=(p,y,m=24)=>{try{return hitboxY(p,y,m)}catch(_){return Math.abs(by(p)-y)<m}};
  const hurt=(v,n,src,dir=0,type='ravam-v19')=>{try{return typeof damage==='function'?damage(v,n,src,dir,type):undefined}catch(_){}};
  const state=(p,s)=>{try{setState?.(p,s)}catch(_){}};
  const fx=(x,y,color='#fff',count=14)=>{try{spark?.(x,y,color,count)}catch(_){}};
  const snd=(name='attack_light',vol=.72)=>{try{SFX?.play?.(name,vol)}catch(_){}};
  const toast=(t,tone='normal')=>{try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(t,tone,1500);mixToast?.(t)}catch(_){}};

  function ensure(f){
    if(!f)return;
    for(const k of ['r19Bullets','r19Nature','r19Gardens','r19Portals','r19PortalShots','r19Shadows','r19Clones','r19KainShots','r19KainWells','r19Text']) if(!Array.isArray(f[k]))f[k]=[];
  }
  function textFx(f,p,text,color='#fff',life=.72){
    if(!f||!p)return;ensure(f);f.r19Text.push({x:p.x,y:by(p)-72,text,color,life,maxLife:life});
  }

  /* ========================= ALANA — ARMAS ========================= */
  function alanaShot(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);
    const t=opponent(p,f),dir=p.facing||1,dist=t?Math.abs(t.x-p.x):0;
    p.r19AlanaCount=((p.r19AlanaCount||0)%3)+1;
    const explosive=p.r19AlanaCount===3;
    const precision=dist>360;
    const y=by(p)-15;
    const dmg=(p.dmg||32)*(explosive?1.72:precision?1.27:1.16);
    f.r19Bullets.push({kind:'alana',x:p.x+dir*54,y,vx:dir*(explosive?1440:1320),life:1.05,ownerSlot:p.playerSlot,targetSlot:t?.playerSlot,dmg,explosive,precision,dead:false,tracer:0});
    p.vx-=dir*(explosive?34:15);p.throwCd=p.human?(explosive?.40:.30):.46;state(p,'throw');
    fx(p.x+dir*58,y,explosive?'#ffe890':'#ffd7a8',explosive?24:13);snd('attack_light',explosive?.92:.72);
    if(explosive)textFx(f,p,'3º TIRO · EXPLOSIVO','#ffe06d',.62);
  }
  function alanaSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);
    const t=opponent(p,f);if(!t)return;
    // Rajada tática: 6 disparos de rifle, o último é explosivo. Tudo ainda é "arma".
    for(let i=0;i<6;i++)f.r19Bullets.push({kind:'alanaBurst',x:p.x+(p.facing||1)*55,y:by(p)-15,vx:0,delay:.10+i*.105,life:1.55,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||32)*(i===5?1.85:.76),explosive:i===5,dead:false,serial:i});
    p.specialCd=6.6;p.r19AlanaSuperT=1.05;state(p,'special');textFx(f,p,'RAJADA TÁTICA','#ffdc83',1.0);snd('attack_heavy',.9);
  }

  /* ========================= ARIA — NATUREZA ========================= */
  function ariaAttack(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);
    const t=opponent(p,f),dir=t&&t.x!==p.x?(t.x>p.x?1:-1):(p.facing||1),mode=(p.r19NatureMode||0)%3;
    p.r19NatureMode=(mode+1)%3;const y=by(p)-10;
    if(mode===0){
      // folhas cortantes
      for(let i=0;i<3;i++)f.r19Nature.push({kind:'leaf',x:p.x+dir*(42+i*4),y:y+(i-1)*12,vx:dir*(760+i*60),vy:(i-1)*-9,life:1.2,ownerSlot:p.playerSlot,dmg:(p.dmg||31)*.48,dead:false,spin:(i-1)*4.5});
      textFx(f,p,'LÂMINAS DE FOLHA','#8cff9d',.62);
    }else if(mode===1){
      // semente venenosa que floresce no impacto
      f.r19Nature.push({kind:'seed',x:p.x+dir*48,y,vx:dir*720,vy:-18,life:1.35,ownerSlot:p.playerSlot,dmg:(p.dmg||31)*.72,dead:false,spin:4.8});
      textFx(f,p,'SEMENTE VENENOSA','#b8ff8c',.62);
    }else{
      // raiz corre pelo chão e desacelera
      f.r19Nature.push({kind:'root',x:p.x+dir*35,y:GROUND_Y-15,vx:dir*610,vy:0,life:1.15,ownerSlot:p.playerSlot,dmg:(p.dmg||31)*.82,dead:false});
      textFx(f,p,'RAIZ SELVAGEM','#62e879',.62);
    }
    p.throwCd=p.human?.46:.61;p.r19AriaCastT=.25;state(p,'throw');fx(p.x+dir*45,GROUND_Y-8,'#75ef8a',14);snd('attack_light',.67);
  }
  function ariaSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);const t=opponent(p,f);if(!t)return;
    f.r19Gardens.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,life:3.0,maxLife:3.0,pulse:.18,hitPulse:0,healPulse:0,activated:false,dead:false});
    p.specialCd=7.0;p.r19AriaSuperT=1.15;state(p,'special');textFx(f,p,'JARDIM VIVO','#a5ff9c',1.05);fx(t.x,GROUND_Y-4,'#66ed80',28);snd('attack_heavy',.82);
  }

  /* ========================= LEO — PORTAIS ========================= */
  function portal(f,x,y,kind='gate',life=.72,color='#66f0ba',ownerSlot='',targetSlot=''){ensure(f);const o={x,y,kind,life,maxLife:life,color,ownerSlot,targetSlot,dead:false};f.r19Portals.push(o);return o}
  function leoAttack(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);const t=opponent(p,f);if(!t)return;
    const dir=p.facing||1,sy=by(p)-10,entryX=clamp(p.x+dir*145,38,W-38),exitX=clamp(t.x+dir*92,38,W-38),exitY=by(t)-12;
    // Primeira pedra normal; segunda viaja até um portal e reaparece atrás do rival.
    f.r19PortalShots.push({kind:'rock',phase:'straight',x:p.x+dir*54,y:sy,vx:dir*830,vy:0,life:1.35,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||34)*.88,dead:false,spin:6});
    portal(f,entryX,sy,'entry',.62,'#65efb7',p.playerSlot,t.playerSlot);
    f.r19PortalShots.push({kind:'rock',phase:'toPortal',x:p.x+dir*62,y:sy,vx:dir*760,vy:0,life:2.0,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||34)*.92,dead:false,spin:-7,entryX,exitX,exitY,dashDir:-dir,wait:0});
    p.r19LeoCombo=((p.r19LeoCombo||0)+1)%3;
    if(p.r19LeoCombo===0){
      // a cada terceiro J, um terceiro portal cria um ataque cruzado.
      const side=t.x>W/2?42:W-42,sideDir=side<t.x?1:-1;portal(f,side,by(t),'side',.8,'#8bffd2',p.playerSlot,t.playerSlot);
      f.r19PortalShots.push({kind:'shard',phase:'delay',delay:.22,x:side,y:by(t),vx:sideDir*920,vy:0,life:1.4,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||34)*.64,dead:false,spin:9});
      textFx(f,p,'PORTAL CRUZADO','#85ffd0',.68);
    }
    p.throwCd=p.human?.52:.68;p.r19LeoCastT=.33;state(p,'throw');snd('attack_light',.73);
  }
  function leoSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);const t=opponent(p,f);if(!t)return;
    // Tempestade 100% baseada em portais: 3 no céu + 2 laterais.
    for(let i=0;i<3;i++)portal(f,t.x+(i-1)*72,66+i*6,'sky',2.0,'#75f4bf',p.playerSlot,t.playerSlot);
    portal(f,42,by(t),'side',1.85,'#75f4bf',p.playerSlot,t.playerSlot);portal(f,W-42,by(t),'side',1.85,'#75f4bf',p.playerSlot,t.playerSlot);
    const seq=['rock','blade','rock','blade','rock','blade','rock','blade'];
    for(let i=0;i<seq.length;i++)f.r19PortalShots.push({kind:seq[i],phase:'superDelay',delay:.20+i*.14,x:0,y:0,vx:0,vy:0,life:2.6,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||34)*(seq[i]==='rock'?.62:.54),dead:false,serial:i});
    p.specialCd=7.2;p.r19LeoSuperT=1.3;state(p,'special');textFx(f,p,'COLAPSO DE PORTAIS','#92ffd4',1.1);snd('attack_heavy',.88);
  }

  /* ========================= THAROTH — SOMBRA / ESCURIDÃO ========================= */
  function tharothAttack(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);const t=opponent(p,f);if(!t)return;
    const dir=p.facing||1,sy=by(p)-10,tx=t.x,ty=by(t)-4,dx=tx-(p.x+dir*48),dy=ty-sy,len=Math.max(1,Math.hypot(dx,dy));
    f.r19Shadows.push({kind:'orb',x:p.x+dir*48,y:sy,vx:dx/len*760,vy:dy/len*760,life:1.1,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||35)*.88,dead:false,spin:0});
    p.throwCd=p.human?.55:.70;p.r19TharothCastT=.30;state(p,'throw');textFx(f,p,'AREIA SOMBRIA','#5c5266',.55);snd('attack_light',.67);
  }
  function tharothSuper(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);const t=opponent(p,f);if(!t)return;
    f.r19Clones.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:clamp(t.x+(t.x>=p.x?1:-1)*82,32,W-32),life:3,maxLife:3,hitCd:.18,pulse:0,dead:false});
    t.r19DarkT=Math.max(t.r19DarkT||0,3.0);p.specialCd=7.0;p.r19TharothSuperT=1.1;state(p,'special');textFx(f,p,'ECO DA ESCURIDÃO','#b65b7b',1.0);fx(t.x,GROUND_Y-8,'#331829',28);snd('attack_heavy',.84);
  }

  /* ========================= KAIN — 10 PODERES ========================= */
  const KAIN=['flight','ice','heal','shock','repel','swap','fire','teleport','drain','gravity'];
  const KL={flight:'VOO',ice:'GELO',heal:'CURA',shock:'CHOQUE',repel:'REPULSÃO',swap:'TROCA DE CONTROLES',fire:'FOGO',teleport:'TELEPORTE',drain:'ROUBO DE VIDA',gravity:'GRAVIDADE'};
  function kainType(p){let t=p?.kainSelectedPower;if(!KAIN.includes(t)){let i=Number(p?.kainPowerIndex)||0;t=KAIN[((i%10)+10)%10];if(p){p.kainSelectedPower=t;p.kainPowerIndex=KAIN.indexOf(t)}}return t}
  function kainAttack(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p||p.state==='ko')return;ensure(f);const t=opponent(p,f),type=kainType(p),dir=p.facing||1,y=by(p)-8;
    p.kainPowerFxT=.6;
    if(type==='flight'){
      p.kainFlightT=Math.max(p.kainFlightT||0,3.7);p.kainFlightY=clamp(Math.max(150,p.y||0),95,300);p.onGround=false;p.vy=0;p.y=p.kainFlightY;p.throwCd=2.4;state(p,'special');fx(p.x,GROUND_Y-p.y-45,'#c7d0df',25);
    }else if(type==='ice'){
      f.r19KainShots.push({kind:'ice',x:p.x+dir*48,y,vx:dir*820,vy:0,life:1.5,ownerSlot:p.playerSlot,targetSlot:t?.playerSlot,dmg:(p.dmg||35)*1.10,dead:false});p.throwCd=.88;state(p,'throw');
    }else if(type==='heal'){
      const n=Math.round((p.maxHp||2180)*.13);p.hp=Math.min(p.maxHp,p.hp+n);p.throwCd=2.7;state(p,'special');textFx(f,p,`+${n} VIDA`,'#73ffae',.85);fx(p.x,by(p),'#73ffae',28);
    }else if(type==='shock'){
      if(t)f.r19KainShots.push({kind:'shock',x:t.x,y:44,delay:.16,life:.8,ownerSlot:p.playerSlot,targetSlot:t.playerSlot,dmg:(p.dmg||35)*1.36,dead:false});p.throwCd=1.25;state(p,'throw');
    }else if(type==='repel'){
      p.kainRepelT=Math.max(p.kainRepelT||0,1.75);p.throwCd=2.2;state(p,'special');fx(p.x,by(p),'#dce2ff',30);
    }else if(type==='swap'){
      if(t)t.kainControlSwapT=Math.max(t.kainControlSwapT||0,3.5);p.throwCd=3.0;state(p,'special');if(t)fx(t.x,by(t),'#d58cff',30);
    }else if(type==='fire'){
      f.r19KainShots.push({kind:'fire',x:p.x+dir*48,y,vx:dir*900,vy:0,life:1.45,ownerSlot:p.playerSlot,targetSlot:t?.playerSlot,dmg:(p.dmg||35)*1.12,dead:false});p.throwCd=.96;state(p,'throw');
    }else if(type==='teleport'){
      if(t){const side=t.x>=p.x?1:-1;p.x=clamp(t.x+side*86,30,W-30);p.facing=t.x>=p.x?1:-1;hurt(t,(p.dmg||35)*.82,{owner:p},t.x>=p.x?1:-1,'kain-teleport-v19');t.vx+=(t.x>=p.x?1:-1)*190;fx(p.x,by(p),'#aa8cff',32)}p.throwCd=1.65;state(p,'special');
    }else if(type==='drain'){
      if(t){const before=t.hp;hurt(t,(p.dmg||35)*.98,{owner:p},t.x>=p.x?1:-1,'kain-drain-v19');const dealt=Math.max(0,before-t.hp),heal=Math.round(Math.min((p.maxHp||2180)*.08,dealt*.72));p.hp=Math.min(p.maxHp,p.hp+heal);textFx(f,p,`+${heal} VIDA`,'#79ffae',.8);fx(t.x,by(t),'#935cff',26)}p.throwCd=2.05;state(p,'special');
    }else if(type==='gravity'){
      if(t)f.r19KainWells.push({ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,life:1.25,maxLife:1.25,pulse:0,hit:false,dead:false});p.throwCd=2.0;state(p,'special');
    }
    textFx(f,p,KL[type]||type.toUpperCase(), type==='ice'?'#bdeaff':type==='heal'?'#73ffae':type==='shock'?'#fff079':type==='fire'?'#ff8a54':type==='teleport'?'#ad8cff':type==='drain'?'#7cffb0':type==='gravity'?'#727cff':'#dce2ff',.62);snd('attack_light',.7);
  }

  /* ========================= INTERCEPTA J / L ========================= */
  const oldThrow=window.throwProjectile;
  if(typeof oldThrow==='function')window.throwProjectile=function(p){
    if(p?.id==='priya'){alanaShot(p);return}
    if(p?.id==='aria'){ariaAttack(p);return}
    if(p?.id==='leo'){leoAttack(p);return}
    if(p?.id==='tharoth'){tharothAttack(p);return}
    if(p?.id==='kain'){kainAttack(p);return}
    return oldThrow.apply(this,arguments);
  };
  const oldSpecial=window.castSpecial;
  if(typeof oldSpecial==='function')window.castSpecial=function(p){
    if(p?.id==='priya'){alanaSuper(p);return}
    if(p?.id==='aria'){ariaSuper(p);return}
    if(p?.id==='leo'){leoSuper(p);return}
    if(p?.id==='tharoth'){tharothSuper(p);return}
    // Kain mantém o Espelho Abissal original: 1 dos 10 poderes + super do rival.
    if(p?.id==='kain')return oldSpecial.apply(this,arguments);
    return oldSpecial.apply(this,arguments);
  };

  /* ========================= UPDATE ========================= */
  const oldUpdate=window.update;
  if(typeof oldUpdate==='function')window.update=function(f,dt){
    const r=oldUpdate.apply(this,arguments);if(!f||f.paused)return r;ensure(f);
    for(const p of [f.p1,f.p2])if(p){
      p.r19AlanaSuperT=Math.max(0,(p.r19AlanaSuperT||0)-dt);p.r19AriaCastT=Math.max(0,(p.r19AriaCastT||0)-dt);p.r19AriaSuperT=Math.max(0,(p.r19AriaSuperT||0)-dt);p.r19LeoCastT=Math.max(0,(p.r19LeoCastT||0)-dt);p.r19LeoSuperT=Math.max(0,(p.r19LeoSuperT||0)-dt);p.r19TharothCastT=Math.max(0,(p.r19TharothCastT||0)-dt);p.r19TharothSuperT=Math.max(0,(p.r19TharothSuperT||0)-dt);
      if(p.r19RootSlowT>0){p.r19RootSlowT=Math.max(0,p.r19RootSlowT-dt);p.vx*=.42}
      if(p.r19DarkT>0){p.r19DarkT=Math.max(0,p.r19DarkT-dt);p.vx*=.82}
      if(p.r19PoisonT>0){p.r19PoisonT=Math.max(0,p.r19PoisonT-dt);p.r19PoisonTick=(p.r19PoisonTick||0)-dt;if(p.r19PoisonTick<=0&&p.r19PoisonT>0){p.r19PoisonTick=.25;hurt(p,3,p.r19PoisonOwner||opponent(p,f),0,'aria-poison-v19')}}
      if(p.r19BurnT>0){p.r19BurnT=Math.max(0,p.r19BurnT-dt);p.r19BurnTick=(p.r19BurnTick||0)-dt;if(p.r19BurnTick<=0&&p.r19BurnT>0){p.r19BurnTick=.25;hurt(p,4,p.r19BurnOwner||opponent(p,f),0,'kain-fire-v19');fx(p.x,by(p),'#ff783d',4)}}
    }
    for(const b of f.r19Bullets){
      if(b.dead)continue;b.life-=dt;const owner=slotOf(f,b.ownerSlot),target=slotOf(f,b.targetSlot);
      if(b.kind==='alanaBurst'){
        b.delay-=dt;if(b.delay>0)continue;if(!b.started){b.started=true;b.x=owner?.x+(owner?.facing||1)*55;b.y=by(owner)-15;const dir=target&&target.x!==b.x?(target.x>b.x?1:-1):(owner?.facing||1);b.vx=dir*(b.explosive?1450:1360);fx(b.x,b.y,b.explosive?'#ffe88c':'#ffd7a8',b.explosive?20:10)}
      }
      b.x+=(b.vx||0)*dt;b.tracer=(b.tracer||0)+dt;
      if(target&&target.state!=='ko'&&Math.abs(b.x-target.x)<46&&hitY(target,b.y,b.explosive?22:15)){
        b.dead=true;hurt(target,b.dmg,{owner,alanaV19:true},(b.vx||1)>0?1:-1,b.explosive?'alana-explosive':'alana-rifle');
        if(b.explosive){target.vx+=((b.vx||1)>0?1:-1)*230;fx(b.x,b.y,'#ffe278',38);for(const other of [f.p1,f.p2])if(other&&other!==target&&other!==owner&&Math.abs(other.x-b.x)<95)hurt(other,b.dmg*.35,{owner},other.x>=b.x?1:-1,'alana-splash')}
        else fx(b.x,b.y,'#ffd7a8',12);
      }
      if(b.life<=0||b.x<-100||b.x>W+100)b.dead=true;
    }f.r19Bullets=f.r19Bullets.filter(x=>!x.dead);

    for(const z of f.r19Nature){
      if(z.dead)continue;z.life-=dt;z.x+=(z.vx||0)*dt;z.y+=(z.vy||0)*dt;z.spin=(z.spin||0)+dt*8;const owner=slotOf(f,z.ownerSlot),target=opponent(owner,f);
      if(target&&target.state!=='ko'&&Math.abs(z.x-target.x)<52&&hitY(target,z.y,z.kind==='root'?26:20)){
        z.dead=true;hurt(target,z.dmg,{owner,ariaV19:true},(z.vx||1)>0?1:-1,'aria-'+z.kind+'-v19');
        if(z.kind==='seed'){target.r19PoisonT=Math.max(target.r19PoisonT||0,1.6);target.r19PoisonOwner=owner;target.r19PoisonTick=.1;fx(z.x,z.y,'#b4ff83',28)}
        if(z.kind==='root'){target.r19RootSlowT=Math.max(target.r19RootSlowT||0,1.15);target.vx*=.2;fx(z.x,GROUND_Y-8,'#68dc76',26)}
        if(z.kind==='leaf'){target.vx+=((z.vx||1)>0?1:-1)*70;fx(z.x,z.y,'#8cff9d',13)}
      }
      if(z.life<=0||z.x<-100||z.x>W+100)z.dead=true;
    }f.r19Nature=f.r19Nature.filter(x=>!x.dead);

    for(const g of f.r19Gardens){
      if(g.dead)continue;g.life-=dt;g.pulse+=dt;g.hitPulse-=dt;g.healPulse-=dt;const owner=slotOf(f,g.ownerSlot),target=slotOf(f,g.targetSlot);if(target&&target.state!=='ko')g.x=target.x;
      if(!g.activated&&g.pulse>=.28){g.activated=true;if(target&&target.state!=='ko'){target.freezeT=Math.max(target.freezeT||0,1.15);target.attackDisabledT=Math.max(target.attackDisabledT||0,1.15);hurt(target,(owner?.dmg||31)*1.0,{owner},target.x>=owner.x?1:-1,'aria-overgrowth');fx(target.x,GROUND_Y-8,'#76ef89',32)}}
      if(g.activated&&target&&target.state!=='ko'&&g.hitPulse<=0){g.hitPulse=.50;if(Math.abs(target.x-g.x)<120)hurt(target,8,{owner},target.x>=owner.x?1:-1,'aria-garden-pulse')}
      if(owner&&owner.state!=='ko'&&g.healPulse<=0){g.healPulse=.50;if(Math.abs(owner.x-g.x)<310)owner.hp=Math.min(owner.maxHp,owner.hp+5)}
      if(g.life<=0)g.dead=true;
    }f.r19Gardens=f.r19Gardens.filter(x=>!x.dead);

    for(const p of f.r19Portals){p.life-=dt;if(p.life<=0)p.dead=true}f.r19Portals=f.r19Portals.filter(x=>!x.dead);
    for(const z of f.r19PortalShots){
      if(z.dead)continue;z.life-=dt;const owner=slotOf(f,z.ownerSlot),target=slotOf(f,z.targetSlot);
      if(z.phase==='delay'){z.delay-=dt;if(z.delay>0)continue;z.phase='straight'}
      if(z.phase==='superDelay'){
        z.delay-=dt;if(z.delay>0)continue;const serial=z.serial||0;if(serial<4){z.x=target.x+(serial-1.5)*70;z.y=65;z.vx=0;z.vy=serial%2?840:760;z.phase='fall'}else{z.x=serial%2?42:W-42;z.y=by(target);z.vx=(z.x<target.x?1:-1)*900;z.vy=0;z.phase='straight'}
      }else if(z.phase==='toPortal'){
        z.x+=(z.vx||0)*dt;if(((z.vx||0)>=0&&z.x>=z.entryX)||((z.vx||0)<0&&z.x<=z.entryX)){z.phase='portal';z.wait=.075;z.x=z.entryX;portal(f,z.exitX,z.exitY,'exit',.58,'#8affd0',z.ownerSlot,z.targetSlot);fx(z.x,z.y,'#64eeb7',12)}
      }else if(z.phase==='portal'){z.wait-=dt;if(z.wait<=0){z.phase='straight';z.x=z.exitX;z.y=z.exitY;z.vx=(z.dashDir||1)*980;z.vy=0;fx(z.x,z.y,'#8affd0',15)}}
      else{z.x+=(z.vx||0)*dt;z.y+=(z.vy||0)*dt}
      if(target&&target.state!=='ko'&&z.phase!=='portal'&&Math.abs(z.x-target.x)<52&&hitY(target,z.y,24)){z.dead=true;const dir=(z.vx||1)>0?1:-1;hurt(target,z.dmg,{owner,leoPortal:true},dir,'leo-portal-v19');target.vx+=dir*(z.kind==='rock'?130:80);fx(z.x,z.y,'#8affd0',18)}
      if(z.life<=0||z.x<-120||z.x>W+120||z.y>GROUND_Y+60)z.dead=true;
    }f.r19PortalShots=f.r19PortalShots.filter(x=>!x.dead);

    for(const s of f.r19Shadows){
      if(s.dead)continue;s.life-=dt;s.x+=(s.vx||0)*dt;s.y+=(s.vy||0)*dt;s.spin+=dt*9;const owner=slotOf(f,s.ownerSlot),target=slotOf(f,s.targetSlot);
      if(target&&target.state!=='ko'&&Math.abs(s.x-target.x)<50&&hitY(target,s.y,24)){s.dead=true;hurt(target,s.dmg,{owner,tharothV19:true},(s.vx||1)>0?1:-1,'tharoth-dark-sand');target.r19DarkT=Math.max(target.r19DarkT||0,2.4);fx(s.x,s.y,'#3d2035',24)}
      if(s.life<=0||s.x<-100||s.x>W+100)s.dead=true;
    }f.r19Shadows=f.r19Shadows.filter(x=>!x.dead);
    for(const c of f.r19Clones){
      if(c.dead)continue;c.life-=dt;c.pulse+=dt;c.hitCd-=dt;const owner=slotOf(f,c.ownerSlot),target=slotOf(f,c.targetSlot);if(target&&target.state!=='ko'){const dir=target.x>=c.x?1:-1;c.x+=clamp((target.x-dir*58)-c.x,-270*dt,270*dt);if(c.hitCd<=0&&Math.abs(c.x-target.x)<118){c.hitCd=.50;hurt(target,20,{owner,tharothCloneV19:true},dir,'tharoth-clone-v19');target.r19DarkT=Math.max(target.r19DarkT||0,.65);fx(target.x,by(target),'#6f304d',14)}}if(c.life<=0)c.dead=true;
    }f.r19Clones=f.r19Clones.filter(x=>!x.dead);

    for(const z of f.r19KainShots){
      if(z.dead)continue;z.life-=dt;const owner=slotOf(f,z.ownerSlot),target=slotOf(f,z.targetSlot);
      if(z.kind==='shock'){z.delay-=dt;if(z.delay<=0&&!z.hit&&target&&target.state!=='ko'){z.hit=true;hurt(target,z.dmg,{owner},target.x>=owner.x?1:-1,'kain-shock-v19');target.freezeT=Math.max(target.freezeT||0,.62);fx(target.x,by(target),'#fff17b',34)}if(z.hit)z.dead=true;continue}
      z.x+=(z.vx||0)*dt;z.y+=(z.vy||0)*dt;
      if(target&&target.state!=='ko'&&Math.abs(z.x-target.x)<50&&hitY(target,z.y,22)){z.dead=true;hurt(target,z.dmg,{owner},(z.vx||1)>0?1:-1,'kain-'+z.kind+'-v19');if(z.kind==='ice'){target.freezeT=Math.max(target.freezeT||0,1.25);target.vx=0;target.vy=0;fx(z.x,z.y,'#bcecff',24)}if(z.kind==='fire'){target.r19BurnT=Math.max(target.r19BurnT||0,1.5);target.r19BurnOwner=owner;target.r19BurnTick=.1;fx(z.x,z.y,'#ff8350',24)}}
      if(z.life<=0||z.x<-100||z.x>W+100)z.dead=true;
    }f.r19KainShots=f.r19KainShots.filter(x=>!x.dead);
    for(const w of f.r19KainWells){
      if(w.dead)continue;w.life-=dt;w.pulse+=dt;const owner=slotOf(f,w.ownerSlot),target=slotOf(f,w.targetSlot);if(target&&target.state!=='ko'){w.x=target.x;target.vx*=.38;target.attackDisabledT=Math.max(target.attackDisabledT||0,.08);if(w.life<.35&&!w.hit){w.hit=true;hurt(target,(owner?.dmg||35)*1.15,{owner},target.x>=owner.x?1:-1,'kain-gravity-v19');target.vy=-360;target.onGround=false;fx(target.x,by(target),'#727cff',34)}}if(w.life<=0)w.dead=true;
    }f.r19KainWells=f.r19KainWells.filter(x=>!x.dead);
    for(const e of f.r19Text){e.life-=dt;e.y-=20*dt}f.r19Text=f.r19Text.filter(x=>x.life>0);
    return r;
  };

  /* ========================= VISUAL ========================= */
  function drawPortal(ctx,p){const a=clamp(p.life/(p.maxLife||1),0,1),pulse=1+Math.sin(performance.now()/82+p.x)*.07;ctx.save();ctx.translate(p.x,p.y);ctx.scale(pulse,1);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,a*1.4);ctx.strokeStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=26;ctx.lineWidth=p.kind==='sky'?5:4;ctx.beginPath();ctx.ellipse(0,0,p.kind==='sky'?58:34,p.kind==='sky'?14:12,0,0,Math.PI*2);ctx.stroke();ctx.lineWidth=2;ctx.globalAlpha*=.65;ctx.beginPath();ctx.ellipse(0,0,p.kind==='sky'?43:24,p.kind==='sky'?9:7,0,0,Math.PI*2);ctx.stroke();ctx.restore()}
  function drawEffects(ctx,f){
    if(!ctx||!f)return;
    for(const b of (f.r19Bullets||[]))if(b.started!==false&&(!b.delay||b.delay<=0)){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=b.explosive?'#ffe78c':'#ffd8ac';ctx.shadowColor=b.explosive?'#ffb332':'#ffd8ac';ctx.shadowBlur=b.explosive?18:8;ctx.globalAlpha=.88;ctx.lineWidth=b.explosive?4:2;ctx.beginPath();ctx.moveTo(b.x-Math.sign(b.vx||1)*(b.explosive?40:28),b.y);ctx.lineTo(b.x+Math.sign(b.vx||1)*8,b.y);ctx.stroke();ctx.restore();
    }
    for(const z of (f.r19Nature||[])){
      ctx.save();ctx.translate(z.x,z.y);ctx.rotate(z.spin||0);ctx.globalCompositeOperation='lighter';if(z.kind==='leaf'){ctx.fillStyle='#83f29b';ctx.shadowColor='#62e879';ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(0,0,11,4,.45,0,Math.PI*2);ctx.fill()}else if(z.kind==='seed'){ctx.fillStyle='#c9ff8d';ctx.shadowColor='#90ff63';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#75d85e';ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.stroke()}else{ctx.strokeStyle='#62e879';ctx.lineWidth=5;ctx.shadowColor='#62e879';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(-18,8);ctx.quadraticCurveTo(0,-14,20,0);ctx.stroke()}ctx.restore();
    }
    for(const g of (f.r19Gardens||[])){
      const a=clamp(g.life/g.maxLife,0,1);ctx.save();ctx.globalAlpha=.30+.18*Math.sin(now()*6);ctx.strokeStyle='#76ef89';ctx.shadowColor='#76ef89';ctx.shadowBlur=18;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(g.x,GROUND_Y-6,105,20,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<7;i++){const x=g.x-78+i*26;ctx.beginPath();ctx.moveTo(x,GROUND_Y-5);ctx.quadraticCurveTo(x+(i%2?10:-10),GROUND_Y-58,x+(i%2?18:-18),GROUND_Y-78);ctx.stroke()}ctx.restore();
    }
    for(const p of (f.r19Portals||[]))drawPortal(ctx,p);
    for(const z of (f.r19PortalShots||[]))if(z.phase!=='portal'&&z.phase!=='superDelay'&&z.phase!=='delay'){
      ctx.save();ctx.translate(z.x,z.y);ctx.rotate(now()*(z.spin||7));ctx.shadowColor='#78f5c0';ctx.shadowBlur=12;ctx.fillStyle=z.kind==='blade'?'#d7fff0':'#717a72';ctx.strokeStyle='#a9ffd5';ctx.lineWidth=2;if(z.kind==='blade'){ctx.beginPath();ctx.moveTo(-13,-3);ctx.lineTo(13,0);ctx.lineTo(-13,3);ctx.closePath()}else{ctx.beginPath();ctx.moveTo(-10,-9);ctx.lineTo(9,-11);ctx.lineTo(13,4);ctx.lineTo(4,11);ctx.lineTo(-12,7);ctx.closePath()}ctx.fill();ctx.stroke();ctx.restore();
    }
    for(const s of (f.r19Shadows||[])){
      ctx.save();ctx.translate(s.x,s.y);ctx.globalCompositeOperation='source-over';ctx.shadowColor='#000';ctx.shadowBlur=16;for(let i=0;i<10;i++){const a=i*Math.PI*2/10+s.spin,r=5+(i%3)*3;ctx.globalAlpha=.32+.04*i;ctx.fillStyle=i%2?'#09080a':'#21121c';ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.55,2+(i%2),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=.9;ctx.fillStyle='#080708';ctx.beginPath();ctx.ellipse(0,0,12,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(const c of (f.r19Clones||[])){
      const owner=slotOf(f,c.ownerSlot);if(!owner)continue;const alpha=(c.life<.35?c.life/.35:.50)+.08*Math.sin(now()*9);ctx.save();ctx.globalAlpha=alpha;ctx.translate(c.x,GROUND_Y);ctx.scale((opponent(owner,f)?.x||0)>=c.x?1:-1,1);ctx.globalCompositeOperation='lighter';ctx.shadowColor='#742c51';ctx.shadowBlur=28;ctx.fillStyle='#1a0a13';ctx.beginPath();ctx.ellipse(0,-88,31,82,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff4f78';ctx.shadowColor='#ff4f78';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(-7,-128,3.2,0,Math.PI*2);ctx.arc(7,-128,3.2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(const z of (f.r19KainShots||[])){
      const col=z.kind==='ice'?'#bdeaff':z.kind==='fire'?'#ff8050':'#fff17a';ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor=col;ctx.shadowBlur=18;ctx.strokeStyle=col;ctx.fillStyle=col;if(z.kind==='shock'){ctx.globalAlpha=.7;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(z.x,22);ctx.lineTo(z.x-8,58);ctx.lineTo(z.x+6,90);ctx.lineTo(z.x,by(slotOf(f,z.targetSlot)));ctx.stroke()}else{ctx.beginPath();ctx.arc(z.x,z.y,z.kind==='ice'?9:10,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.28;ctx.beginPath();ctx.ellipse(z.x-Math.sign(z.vx||1)*14,z.y,18,6,0,0,Math.PI*2);ctx.fill()}ctx.restore();
    }
    for(const w of (f.r19KainWells||[])){
      const a=clamp(w.life/w.maxLife,0,1);ctx.save();ctx.translate(w.x,GROUND_Y-70);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45*a;ctx.strokeStyle='#737cff';ctx.shadowColor='#737cff';ctx.shadowBlur=25;for(let i=0;i<3;i++){ctx.lineWidth=4-i;ctx.beginPath();ctx.ellipse(0,0,55-i*13,23-i*5,now()*(i%2?1:-1),0,Math.PI*2);ctx.stroke()}ctx.restore();
    }
    for(const p of [f.p1,f.p2])if((p?.r19DarkT||0)>0){const a=clamp(p.r19DarkT/2.4,0,1);ctx.save();ctx.globalAlpha=.16*a;const grd=ctx.createRadialGradient(p.x,by(p),20,p.x,by(p),230);grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(1,'rgba(0,0,0,1)');ctx.fillStyle=grd;ctx.fillRect(0,0,W,GROUND_Y);ctx.restore()}
    for(const e of (f.r19Text||[])){const a=clamp(e.life/e.maxLife,0,1);ctx.save();ctx.globalAlpha=a;ctx.font='900 13px Oxanium,Arial';ctx.textAlign='center';ctx.fillStyle=e.color;ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillText(e.text,e.x,e.y);ctx.restore()}
  }
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){const r=oldDraw.apply(this,arguments);try{drawEffects(canvas.getContext('2d'),f)}catch(_){}return r};

  // Mantém a identidade na interface.
  try{
    if(window.RavamStudios){
      const old=window.RavamStudios;
      const abilities={
        priya:{flag:'RAVAM',role:'Atiradora Tática',tag:'ARMAS',desc:'J usa rifle tático com 3º tiro explosivo. L dispara uma rajada de 6 tiros, terminando em munição explosiva.'},
        kain:{flag:'RAVAM',role:'Mímico do Caos',tag:'10 PODERES',desc:'J usa o poder atual. H / P2 9 alterna entre Voo, Gelo, Cura, Choque, Repulsão, Troca de Controles, Fogo, Teleporte, Roubo de Vida e Gravidade. L mantém o Espelho Abissal.'},
        aria:{flag:'RAVAM',role:'Feiticeira Botânica',tag:'NATUREZA',desc:'J alterna Lâminas de Folha, Semente Venenosa e Raiz Selvagem. L cria um Jardim Vivo que prende, pulsa dano e cura Aria.'},
        leo:{flag:'RAVAM',role:'Arquiteto de Portais',tag:'PORTAIS',desc:'J usa pedras que entram e saem de portais; a cada 3º ataque surge um portal cruzado. L cria uma tempestade de portais no céu e nas laterais.'},
        tharoth:{flag:'RAVAM',role:'Avatar da Umbra',tag:'ESCURIDÃO',desc:'J lança areia sombria que escurece e desacelera o alvo. L invoca clone invulnerável por 3s que ataca a cada 0,50s.'}
      };
      const api={...old,version:VERSION,r19Abilities:abilities};
      window.RavamStudios=api;
    }
  }catch(_){}
  window.RavamV19Powers=Object.freeze({version:VERSION,kainPowers:KAIN.slice()});
})();
