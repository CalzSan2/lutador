/* Directional techniques, timed melee, impact feedback and an isolated practice room. */
(()=>{
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const profiles={
    laranja:['Impacto Supersônico','wind'],
    rojo:['Lâmina Rubra','blade'],knunka:['Arco Voltaico','lightning'],nine85:['Falha Digital','pixel'],
    uiye:['Ruptura de Pedra','rock'],rtess:['Pulso Magnético','ring'],atizz:['Corte Glitch','blade'],
    grizz:['Raio Tático','laser'],ouip:['Maré Ácida','acid'],jetde:['Pressão Celeste','bubble'],
    xillen:['Garra Astral','claw'],thuvaa:['Cristal Polar','ice'],ytiri:['Corrente Espectral','chain'],
    lkugh:['Lua Cortante','moon'],grogh:['Carga Cósmica','ring'],dart:['Vento Arcano','wind'],
    trefoh:['Espinho Floral','leaf'],yoi:['Tempestade de Areia','sand'],flame:['Chama Carmesim','fire'],
    perry:['Raiz Selvagem','leaf'],verry:['Onda de Lama','rock'],hock:['Impacto de Aço','hammer'],
    vlad:['Presa de Sangue','blood'],klo:['Lança Quântica','spear'],klopp:['Eco Mímico','pixel'],
    frogh:['Garra Mutante','claw'],jimmy:['Ruptura Elétrica','lightning'],ztaaa:['Vazio Absoluto','void']
  };
  const specs=Object.freeze({
    punch:{duration:.29,start:.085,end:.15,range:102,damage:.78,cost:6,height:114},
    kick:{duration:.47,start:.16,end:.26,range:144,damage:1.22,cost:12,height:84},
    down:{duration:.42,start:.13,end:.20,range:620,damage:1.10,cost:18,height:35},
    forward:{duration:.48,start:.16,end:.29,range:128,damage:1.42,cost:23,height:103},
    diagonal:{duration:.59,start:.20,end:.32,range:116,damage:1.68,cost:29,height:125},
    doubleforward:{duration:.62,start:.18,end:.36,range:178,damage:1.92,cost:34,height:108},
    skyfall:{duration:.68,start:.25,end:.42,range:205,damage:2.05,cost:38,height:118},
    crossrush:{duration:.72,start:.20,end:.43,range:190,damage:2.25,cost:43,height:104},
    corewave:{duration:.76,start:.22,end:.45,range:720,damage:2.32,cost:48,height:42},
    comet:{duration:.78,start:.24,end:.48,range:760,damage:2.48,cost:52,height:112},
    astralrain:{duration:.86,start:.28,end:.56,range:260,damage:2.72,cost:58,height:120},
    uppercut:{duration:.64,start:.18,end:.34,range:126,damage:1.86,cost:32,height:92}
  });
  const counts={moves:0,hits:0,blocked:0};
  let inputDialog=null,returnFocus=null,pausedBeforeGuide=false;
  function game(){return typeof fight!=='undefined'?fight:null}
  function profile(p){const item=profiles[p.id]||profiles.rojo;return{name:item[0],shape:item[1],color:p.color||'#7ce7ff'}}
  function init(f){
    if(!f.proProjectiles)f.proProjectiles=[];
    if(!f.proImpacts)f.proImpacts=[];
    for(const p of [f.p1,f.p2])if(p.proStamina===undefined){p.proStamina=100;p.proMove=null;p.proBuffer=null;p.proChain=0;p.proChainT=0}
  }
  function announce(p,text){p.proLastMove=text;p.proLabelT=1.1}
  function directionalCombo(p){
    const h=(p.proDirHistory||[]).filter(x=>performance.now()-x.t<760);p.proDirHistory=h;
    if(h.length<2)return null;
    const a=h[h.length-2].dir,b=h[h.length-1].dir,forward=p.facing===-1?'left':'right',back=forward==='left'?'right':'left';
    if(a===forward&&b===forward)return'doubleforward';
    if(a==='up'&&b==='down')return'skyfall';
    if(a===back&&b===forward)return'crossrush';
    if(a==='down'&&b==='down')return'corewave';
    if(a==='up'&&b==='up')return'astralrain';
    if(h.length>=3){const x=h[h.length-3].dir,y=h[h.length-2].dir,z=h[h.length-1].dir;if(x===forward&&y==='down'&&z===forward)return'comet'}
    return null;
  }
  function requestedMove(p){
    const second=p.playerSlot==='p2',pressed=window.justPressed||{};
    const f=game(),enemy=p===f?.p1?f?.p2:f?.p1,towardRight=!!enemy&&enemy.x>p.x;
    const towardKey=second?(towardRight?'ArrowRight':'ArrowLeft'):(towardRight?'KeyD':'KeyA');
    if(pressed[second?'Numpad4':'KeyG'])return'uppercut';
    if(pressed[second?'Numpad5':'KeyI'])return'punch';
    if(pressed[second?'Numpad6':'KeyO'])return'kick';
    if(!pressed[second?'Numpad1':'KeyJ'])return null;
    const sequence=directionalCombo(p);if(sequence){p.proDirHistory=[];return sequence}
    const down=controlDown(p,second?'ArrowDown':'KeyS');
    const right=controlDown(p,second?'ArrowRight':'KeyD'),left=controlDown(p,second?'ArrowLeft':'KeyA');
    const forward=right!==left;
    return down&&forward?'diagonal':down?'down':forward?'forward':null;
  }
  function faceInput(p){
    const second=p.playerSlot==='p2',r=controlDown(p,second?'ArrowRight':'KeyD'),l=controlDown(p,second?'ArrowLeft':'KeyA');
    if(r!==l)p.manualFacing=p.facing=r?1:-1;
  }
  function canStart(p){return p&&p.state!=='ko'&&p.state!=='hurt'&&!(p.proKnockdownT>0)&&p.freezeT<=0&&p.attackDisabledT<=0&&!p.kloTrap&&!p.proMove}
  function begin(p,kind,f=game()){
    if(!f||f.over||f.paused||!specs[kind]||!canStart(p))return false;
    init(f);const s=specs[kind];
    if(p.proStamina<s.cost){announce(p,'RECUPERANDO FÔLEGO');return false}
    if(p.throwCd>0)return false;
    const theme=profile(p);
    const chained=p.proChainT>0&&p.proLastKind!==kind;
    p.proChain=chained?Math.min(3,p.proChain+1):0;
    p.proStamina-=s.cost;p.proLastKind=kind;p.proChainT=.85;
    p.proMove={kind,time:0,duration:s.duration,start:s.start,end:s.end,dir:p.facing||1,hit:false,spawned:false,theme,origin:p.x,chain:p.proChain};
    p.state='throw';p.stateT=0;p.defend=false;p.vx=0;p.throwCd=s.duration;
    const names={punch:'SOCO',kick:'CHUTE',down:theme.name+' · RASTEIRO',forward:theme.name+' · AVANÇO',diagonal:theme.name+' · ASCENDENTE',doubleforward:theme.name+' · ARRANCADA DUPLA',skyfall:theme.name+' · QUEDA CELESTE',crossrush:theme.name+' · RUPTURA CRUZADA',corewave:theme.name+' · ONDA DO NÚCLEO',comet:theme.name+' · COMETA PRISMÁTICO',astralrain:theme.name+' · CHUVA ASTRAL',uppercut:'GANCHO DEMOLIDOR'};
    announce(p,names[kind]);counts.moves++;
    window.ProAudio?.play(kind==='punch'||kind==='kick'?kind:'throw',{pan:clamp(p.x/800-1,-1,1),character:p.id});
    return true;
  }
  function impact(f,x,y,color,blocked=false){
    if(f.proImpacts.length>=6)f.proImpacts.shift();
    f.proImpacts.push({x,y,color,blocked,time:0,duration:blocked?.22:.30});
  }
  function targetHit(f,p,target,kind,move,x,y){
    const s=specs[kind],before=target.hp,wasBlocked=target.defend&&target.facing===Math.sign(p.x-target.x);
    damage(target,p.dmg*s.damage*(1+move.chain*.08),{owner:p,color:move.theme.color,proKind:kind},move.dir,'pro-'+kind);
    const dealt=Math.max(0,before-target.hp);
    const connected=dealt>0||wasBlocked;
    if(connected){
      impact(f,x,y,move.theme.color,wasBlocked);counts.hits++;if(wasBlocked)counts.blocked++;
      window.ProAudio?.play(wasBlocked?'guard':'hit',{pan:clamp(target.x/800-1,-1,1),volume:kind==='kick'?1:.8});
      p.proHitConfirm=.13;
      if(dealt>0&&kind==='diagonal'&&target.state!=='ko'){target.vy=490;target.onGround=false;target.y=Math.max(3,target.y);target.jumpT=0}
      if(dealt>0&&kind==='uppercut'&&target.state!=='ko'){
        // GANCHO DEMOLIDOR: lança, derruba e deixa o alvo vulnerável no chão.
        target.proKnockdownT=2.25;target.proKnockdownLanded=false;target.proKnockdownBy=p;
        target.proMove=null;target.proBuffer=null;target.defend=false;target.guardBroken=true;
        target.vy=650;target.vx=move.dir*210;target.onGround=false;target.y=Math.max(5,target.y);target.jumpT=0;
        target.state='hurt';target.stateT=0;target.hitFlash=Math.max(target.hitFlash||0,.13);
        announce(p,'GANCHO DEMOLIDOR · DERRUBOU');
      }
      if(dealt>0&&['forward','doubleforward','crossrush'].includes(kind))target.x=clamp(target.x+move.dir*(kind==='crossrush'?68:kind==='doubleforward'?45:25),26,W-26);
      if(dealt>0&&!f.proTraining)window.ProProgression?.recordCombat(kind==='punch'||kind==='kick'?kind:'special',{playerSlot:p.playerSlot,damage:dealt,variant:kind==='diagonal'?'diagonal':kind});
    }
    return connected;
  }
  function step(f,dt){
    if(!f||f.paused||dt<=0)return;
    init(f);
    for(const p of [f.p1,f.p2]){
      p.proStamina=clamp(p.proStamina+(f.proTraining?60:21)*dt,0,100);
      if((p.proKnockdownT||0)>0){
        p.proKnockdownT=Math.max(0,p.proKnockdownT-dt);
        p.defend=false;p.proMove=null;p.proBuffer=null;p.guardBroken=true;
        if(p.onGround){
          if(!p.proKnockdownLanded){p.proKnockdownLanded=true;p.proKnockdownT=Math.max(p.proKnockdownT,1.28);impact(f,p.x,GROUND_Y-22,p.color||'#ff5252',false)}
          p.vx=0;p.state='downed';p.stateT=0;
        }else{
          p.state='hurt';
        }
        if(p.proKnockdownT<=0&&p.onGround){p.proKnockdownLanded=false;p.proKnockdownBy=null;p.guardBroken=false;p.state='idle';p.stateT=0}
      }
      p.proChainT=Math.max(0,(p.proChainT||0)-dt);p.proLabelT=Math.max(0,(p.proLabelT||0)-dt);
      p.proHitConfirm=Math.max(0,(p.proHitConfirm||0)-dt);
      if(p.proBuffer){p.proBuffer.ttl-=dt;if(p.proBuffer.ttl<=0)p.proBuffer=null}
      const m=p.proMove;
      if(!m)continue;
      if(p.state==='hurt'||p.state==='ko'||p.freezeT>0){p.proMove=null;p.proBuffer=null;continue}
      m.time+=dt;
      p.state='throw';p.facing=m.dir;
      if(m.kind==='forward'&&m.time>=.07&&m.time<.26)p.x=clamp(p.x+m.dir*370*dt,26,W-26);
      if(m.kind==='doubleforward'&&m.time>=.06&&m.time<.37)p.x=clamp(p.x+m.dir*610*dt,26,W-26);
      if(m.kind==='crossrush'&&m.time>=.08&&m.time<.44)p.x=clamp(p.x+m.dir*530*dt,26,W-26);
      if(m.kind==='down'&&m.time>=m.start&&!m.spawned){
        m.spawned=true;
        f.proProjectiles.push({x:p.x+m.dir*45,y:GROUND_Y-p.y-34,previousX:p.x+m.dir*45,vx:m.dir*600,life:1.1,r:17,owner:p,move:{...m},kind:'down'});
      }
      if(['corewave','comet','astralrain'].includes(m.kind)&&m.time>=m.start&&!m.spawned){
        m.spawned=true;
        if(m.kind==='astralrain'){const enemy=p===f.p1?f.p2:f.p1;f.proProjectiles.push({x:enemy.x,y:70,vy:1400,life:1.0,r:28,owner:p,move:{...m},kind:'astralrain',falling:true});}
        else f.proProjectiles.push({x:p.x+m.dir*42,y:GROUND_Y-p.y-(m.kind==='comet'?112:38),previousX:p.x+m.dir*42,vx:m.dir*(m.kind==='comet'?850:530),life:1.35,r:m.kind==='comet'?24:31,owner:p,move:{...m},kind:m.kind});
      }
      const target=p===f.p1?f.p2:f.p1,s=specs[m.kind];
      if(!['down','corewave','comet','astralrain'].includes(m.kind)&&!m.hit&&m.time>=m.start&&m.time<=m.end&&target.state!=='ko'){
        const distance=(target.x-p.x)*m.dir,hitY=GROUND_Y-p.y-s.height;
        const targetTop=GROUND_Y-target.y-(target.defend?140:178),targetBottom=GROUND_Y-target.y+8;
        const groundedDown=!!(target.proKnockdownT>0&&target.onGround);
        // No chão, somente o CHUTE pode conectar. Socos, gancho e técnicas passam sem causar dano.
        const canConnect=groundedDown?m.kind==='kick':(hitY>=targetTop-20&&hitY<=targetBottom+20);
        if(distance>=-8&&distance<=s.range+23&&canConnect){
          m.hit=true;targetHit(f,p,target,m.kind,m,target.x,groundedDown?GROUND_Y-24:hitY);
        }
      }
      if(m.time>=m.duration){
        p.proMove=null;p.state=p.onGround?'idle':'air';p.stateT=0;p.throwCd=0;
        if(p.proBuffer){const kind=p.proBuffer.kind;p.proBuffer=null;begin(p,kind,f)}
      }
    }
    for(const shot of f.proProjectiles){
      const oldX=shot.x;if(shot.falling)shot.y+=shot.vy*dt;else shot.x+=shot.vx*dt;shot.life-=dt;
      const target=shot.owner===f.p1?f.p2:f.p1;
      const hitX=shot.falling?Math.abs(target.x-shot.x)<shot.r+48:target.x>=Math.min(oldX,shot.x)-40&&target.x<=Math.max(oldX,shot.x)+40;
      const bottom=GROUND_Y-target.y,top=bottom-(target.defend?140:178),groundedDown=!!(target.proKnockdownT>0&&target.onGround);
      // Campeão derrubado não é atingido por projéteis/técnicas: somente chute corpo a corpo causa dano.
      if(!shot.dead&&target.state!=='ko'&&!groundedDown&&hitX&&(shot.y+shot.r>=top&&shot.y-shot.r<=bottom)){
        shot.dead=true;targetHit(f,shot.owner,target,shot.kind,shot.move,shot.x,shot.y);
      }
      if(shot.life<=0||shot.x<-60||shot.x>W+60||shot.y>GROUND_Y+80)shot.dead=true;
    }
    f.proProjectiles=f.proProjectiles.filter(s=>!s.dead).slice(-5);
    for(const effect of f.proImpacts)effect.time+=dt;
    f.proImpacts=f.proImpacts.filter(e=>e.time<e.duration);
    if(f.proTraining){f.timer=360;f.p2.hp=f.p2.maxHp;f.p1.hp=f.p1.maxHp}
  }
  function glyph(c,theme,r,t){
    c.fillStyle=theme.color;c.strokeStyle='#eefaff';c.lineWidth=1.5;
    c.beginPath();
    if(['blade','spear','ice','claw'].includes(theme.shape)){
      c.moveTo(r*1.5,0);c.lineTo(-r,-r*.45);c.lineTo(-r*.55,0);c.lineTo(-r,r*.45);c.closePath();c.fill();c.stroke();
    }else if(['rock','hammer','pixel'].includes(theme.shape)){
      c.rect(-r*.65,-r*.6,r*1.3,r*1.2);c.fill();c.stroke();
      c.fillStyle='#ffffff99';c.fillRect(-r*.35,-r*.32,r*.3,r*.24);
    }else if(['lightning','laser','chain'].includes(theme.shape)){
      c.moveTo(-r*1.5,0);for(let i=0;i<6;i++)c.lineTo(-r+i*r*.5,(i%2?1:-1)*r*.38);c.lineWidth=5;c.strokeStyle=theme.color;c.stroke();c.lineWidth=1.3;c.strokeStyle='#fff';c.stroke();
    }else if(['leaf','wind','moon'].includes(theme.shape)){
      c.moveTo(-r,0);c.quadraticCurveTo(0,-r*1.2,r*1.2,0);c.quadraticCurveTo(0,r*.6,-r,0);c.fill();c.stroke();
    }else{
      c.ellipse(0,0,r,r*.72,0,0,Math.PI*2);c.fill();c.stroke();
      c.globalAlpha*=.55;c.beginPath();c.arc(0,0,r*1.35,0,Math.PI*2);c.stroke();
    }
  }
  function drawCombat(c,f){
    if(!f.proProjectiles)return;
    c.save();
    for(const shot of f.proProjectiles){
      c.save();c.translate(shot.x,shot.y);c.scale(shot.move.dir,1);
      c.strokeStyle=shot.move.theme.color;c.globalAlpha=.28;c.lineWidth=8;c.beginPath();c.moveTo(-42,0);c.lineTo(-10,0);c.stroke();c.globalAlpha=1;glyph(c,shot.move.theme,shot.r,shot.life);c.restore();
    }
    for(const p of [f.p1,f.p2]){
      const m=p.proMove;
      if(m&&m.time>=m.start*.8&&m.time<=m.end+.08){
        const s=specs[m.kind],progress=clamp((m.time-m.start)/(m.end-m.start),0,1);
        c.save();c.translate(p.x,GROUND_Y-p.y);c.scale(m.dir,1);c.strokeStyle=m.theme.color;c.lineWidth=m.kind==='kick'?5:3;c.globalAlpha=.8*(1-progress*.65);c.beginPath();
        if(m.kind==='diagonal'||m.kind==='skyfall'){c.arc(44,-86,m.kind==='skyfall'?112:84,-.1-progress*1.4,-1.7-progress*.3,true)}
        else if(m.kind==='crossrush'){c.moveTo(-48,-100);c.lineTo(s.range,-s.height+10);c.moveTo(-30,-34);c.lineTo(s.range,-s.height-35)}
        else {c.moveTo(36,-s.height+16);c.quadraticCurveTo(s.range*.75,-s.height-28,s.range,-s.height)}
        c.stroke();c.restore();
      }
      const x=p===f.p1?40:W-360,y=H-114;
      c.fillStyle='rgba(6,10,22,.87)';c.fillRect(x-10,y-20,330,86);
      c.font='600 14px system-ui';c.textAlign='left';c.fillStyle='#bccce3';c.fillText(p.playerSlot==='p2'?'P2 · 5 SOCO / 6 CHUTE / 4 GANCHO':'P1 · I SOCO / O CHUTE / G GANCHO',x,y);
      c.fillStyle='#222d42';c.fillRect(x,y+12,300,6);c.fillStyle=p.proStamina<29?'#ffb867':'#69dece';c.fillRect(x,y+12,3*p.proStamina,6);
      c.font='12px system-ui';c.fillStyle='#c7d5e8';c.fillText(p.proLabelT>0?p.proLastMove:'FÔLEGO  '+Math.round(p.proStamina)+'%  ·  alterne soco e chute',x,y+41);
      if((p.proKnockdownT||0)>0&&p.onGround){
        c.save();c.textAlign='center';c.font='800 13px system-ui';c.fillStyle='#ffd36a';
        c.fillText('NO CHÃO · SÓ CHUTE CAUSA DANO',p.x,GROUND_Y-54);c.restore();
      }
    }
    for(const e of f.proImpacts){
      const t=e.time/e.duration;c.save();c.translate(e.x,e.y);c.globalAlpha=1-t;c.strokeStyle=e.blocked?'#91dfff':e.color;c.lineWidth=e.blocked?3:4;
      for(let i=0;i<2;i++){const a=i*Math.PI,r=12+t*30;c.beginPath();c.moveTo(Math.cos(a)*r*.5,Math.sin(a)*r*.5);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke()}
      c.fillStyle='#fff';c.beginPath();c.arc(0,0,Math.max(1,9*(1-t)),0,Math.PI*2);c.fill();c.restore();
    }
    if(f.proTraining){c.textAlign='center';c.fillStyle='#b6fff0';c.font='700 17px system-ui';c.fillText('TREINO LIVRE · VIDA RESTAURADA · SEM RECOMPENSAS',W/2,170)}
    c.restore();
  }
  const baseInput=window.playerInput;
  window.playerInput=function(p){
    const f=game();if(!f)return baseInput(p);init(f);
    if(f.paused||window.ProAudio?.isOpen()||inputDialog?.open)return;
    if((p.proKnockdownT||0)>0){p.vx=0;p.defend=false;p.proMove=null;p.proBuffer=null;return;}
    const request=requestedMove(p);
    if(p.proMove){
      p.vx=0;p.defend=false;
      if(request&&p.proMove.time>p.proMove.end)p.proBuffer={kind:request,ttl:.16};
      return;
    }
    if(request&&canStart(p)&&p.throwCd<=0){
      faceInput(p);begin(p,request,f);
      const codes=p.playerSlot==='p2'?['Numpad1','Numpad5','Numpad6']:['KeyJ','KeyI','KeyO'];
      for(const code of codes)if(window.justPressed)window.justPressed[code]=false;
      return;
    }
    return baseInput(p);
  };
  const baseAi=window.aiInput;
  window.aiInput=function(p,f,dt){
    if((p.proKnockdownT||0)>0){p.vx=0;p.defend=false;p.proMove=null;return}
    if(f.proTraining){p.vx=0;p.defend=f.proTrainingGuard;p.state=p.defend?'defend':'idle';return}
    if(p.proMove){p.vx=0;return}
    if(canStart(p)&&p.throwCd<=0&&Math.abs(f.p1.x-p.x)<135&&Math.random()<dt*2){begin(p,Math.random()<.55?'punch':'kick',f);return}
    return baseAi(p,f,dt);
  };
  const baseBossAi=window.aiInputBoss;
  if(typeof baseBossAi==='function')window.aiInputBoss=function(p,f,dt){
    if((p?.proKnockdownT||0)>0){p.vx=0;p.defend=false;p.proMove=null;return}
    return baseBossAi.apply(this,arguments);
  };
  const baseUpdate=window.update;
  window.update=function(f,dt){const result=baseUpdate(f,dt);if(f&&!f.over)step(f,dt);return result};
  const baseDamage=window.damage;
  window.damage=function(victim,amount,source,dir,type){
    const before=victim?.hp,result=baseDamage.apply(this,arguments),f=game();
    const attacker=source?.owner||(source?.id?source:null),dealt=Math.max(0,(before||0)-(victim?.hp||0));
    if(dealt>0&&!f?.proTraining&&!String(type||'').startsWith('pro-')&&attacker?.playerSlot==='p1')window.ProProgression?.recordCombat('special',{playerSlot:'p1',damage:dealt,variant:'neutral'});
    return result;
  };
  const baseDraw=window.draw;
  window.draw=function(f){const result=baseDraw(f);if(f)drawCombat(canvas.getContext('2d'),f);return result};
  const baseReset=window.resetRoundForNextMatch;
  window.resetRoundForNextMatch=function(...args){const result=baseReset.apply(this,args),f=game();if(f){f.proProjectiles=[];f.proImpacts=[];for(const p of[f.p1,f.p2]){p.proMove=null;p.proBuffer=null;p.proStamina=100;p.proKnockdownT=0;p.proKnockdownLanded=false;p.proKnockdownBy=null}}return result};

  function startTraining(id){
    const character=CHARACTERS.find(c=>c.id===id)||CHARACTERS.find(c=>c.id==='rojo');
    startFight(character.id,'cpu',null,STAGES[0].id);
    const f=game();f.proTraining=true;f.proTrainingGuard=false;
    f.p2=makeFighter(character,W*.52,false,'p2');f.p1.x=W*.4;f.p2.facing=-1;
    init(f);bestOfThree.active=false;
    document.querySelector('#arena-pause')?.classList.remove('show');
  }
  function openGuide(training=false){
    if(inputDialog?.open)return;
    const f=game();pausedBeforeGuide=!!f?.paused;if(f)f.paused=true;
    returnFocus=document.activeElement;window.keys={};window.justPressed={};
    if(!inputDialog){inputDialog=document.createElement('dialog');inputDialog.className='pro-combat-guide';document.body.appendChild(inputDialog)}
    inputDialog.innerHTML=`<form method="dialog"><header><small>LABORATÓRIO DE COMBATE</small><button aria-label="Fechar comandos">×</button></header><h2>DOMINE SEU LUTADOR</h2><p>J mantém o poder original. Segure a direção e toque em J para executar uma técnica. Frente acompanha o lado para o qual você está andando.</p><div class="pro-move-table"><b>TÉCNICA</b><b>JOGADOR 1</b><b>JOGADOR 2</b><span>Poder original</span><kbd>J</kbd><kbd>Num 1</kbd><span>Rasteiro de alcance</span><kbd>S + J</kbd><kbd>↓ + Num 1</kbd><span>Golpe de avanço</span><kbd>A ou D + J</kbd><kbd>← ou → + Num 1</kbd><span>Golpe ascendente</span><kbd>S + A/D + J</kbd><kbd>↓ + ←/→ + Num 1</kbd><span>Arrancada dupla</span><kbd>→ → + J</kbd><kbd>→ → + Num 1</kbd><span>Queda celeste</span><kbd>W, S + J</kbd><kbd>↑, ↓ + Num 1</kbd><span>Ruptura cruzada</span><kbd>←, → + J</kbd><kbd>←, → + Num 1</kbd><span>Soco rápido</span><kbd>I</kbd><kbd>Num 5</kbd><span>Chute forte</span><kbd>O</kbd><kbd>Num 6</kbd><span>Gancho derrubador</span><kbd>G</kbd><kbd>Num 4</kbd><span>Defesa / Super</span><kbd>K / L</kbd><kbd>Num 2 / Num 3</kbd></div><p class="pro-combat-note">As técnicas especiais precisam ser digitadas em sequência e finalizadas com J em menos de 0,76s. Cada uma causa mais dano e gasta mais fôlego.</p><footer>Consulte esta tela pelo F1 durante o jogo. O Treino Livre foi removido.</footer></form>`;
    const table=inputDialog.querySelector('.pro-move-table');
    table?.insertAdjacentHTML('beforeend',`<span>Mover / virar</span><kbd>A / D</kbd><kbd>← / →</kbd><span>Pular</span><kbd>W</kbd><kbd>↑</kbd><span>Defesa</span><kbd>K</kbd><kbd>Num 2</kbd><span>Super</span><kbd>L</kbd><kbd>Num 3</kbd><span>Onda do núcleo</span><kbd>S, S + J</kbd><kbd>↓, ↓ + Num 1</kbd><span>Cometa prismático</span><kbd>→, S, → + J</kbd><kbd>→, ↓, → + Num 1</kbd><span>Chuva astral</span><kbd>W, W + J</kbd><kbd>↑, ↑ + Num 1</kbd>`);
    inputDialog.querySelector('.pro-combat-note').textContent='GANCHO: G no P1 ou Num 4 no P2. Causa dano, lança e derruba o inimigo. Durante a derrubada, SOMENTE CHUTES causam dano; socos, projéteis, especiais e outro gancho não ferem o campeão caído. Sequências especiais precisam ser digitadas rapidamente e finalizadas com J (ou Num 1).';
    inputDialog.onclose=()=>{const current=game();if(current&&current===f)current.paused=pausedBeforeGuide;window.keys={};window.justPressed={};returnFocus?.focus?.()};
    inputDialog.showModal();
  }
  function addButtons(){
    const controlBox=document.querySelector('.control-box');
    if(controlBox&&!controlBox.dataset.combatControls){controlBox.dataset.combatControls='1';controlBox.textContent='P1: A/D mover · W pular · J poder · I soco · O chute · G gancho · K defesa · L super.  P2: setas · Num 1 poder · Num 5 soco · Num 6 chute · Num 4 gancho · Num 2 defesa · Num 3 super.  F1: combinações e comandos.'}
    const actions=document.querySelector('.pro-legacy-actions');
    if(actions&&!actions.querySelector('[data-combat-guide]')){const b=document.createElement('button');b.className='btn';b.dataset.combatGuide='1';b.textContent='🥊 GOLPES & COMANDOS';b.onclick=()=>openGuide();actions.appendChild(b)}
    const modes=document.querySelector('.mode-grid');
    modes?.querySelectorAll('[data-combat-training]').forEach(el=>el.remove());
    const pause=document.querySelector('.pause-grid');
    if(pause&&!pause.querySelector('[data-combat-guide]')){const b=document.createElement('button');b.className='pause-btn';b.dataset.combatGuide='1';b.textContent='🥊 COMANDOS';b.onclick=()=>openGuide();pause.appendChild(b)}
  }
  let pending=false;
  const queue=()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;addButtons()})};
  new MutationObserver(queue).observe(document.getElementById('app'),{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.code==='F1'){e.preventDefault();openGuide()}},true);
  document.addEventListener('keydown',e=>{
    if(e.repeat)return;const map={KeyA:['p1','left'],KeyD:['p1','right'],KeyW:['p1','up'],KeyS:['p1','down'],ArrowLeft:['p2','left'],ArrowRight:['p2','right'],ArrowUp:['p2','up'],ArrowDown:['p2','down']},entry=map[e.code],f=game();
    if(!entry||!f)return;const p=entry[0]==='p1'?f.p1:f.p2;if(!p)return;(p.proDirHistory||(p.proDirHistory=[])).push({dir:entry[1],t:performance.now()});p.proDirHistory=p.proDirHistory.slice(-4);
  },true);
  addButtons();
  window.ProCombat=Object.freeze({begin,step,draw:drawCombat,requestedMove,profiles,specs,openGuide,startTraining,isGuideOpen:()=>!!inputDialog?.open,stats:()=>({...counts})});
})();
