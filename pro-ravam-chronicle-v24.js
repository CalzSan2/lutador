/* SORTEP NIAK — R.A.V.A.M: LENDAS DA CRÔNICA V24
 * Loja individual, golpes nomeados, animação procedural e Petros Hiperveloz.
 */
(()=>{
  'use strict';
  if(window.RavamChronicleV24?.version)return;
  const VERSION='24.0.0-chronicle-legends';
  const IDS=Object.freeze(['aurora','kai_draconis','priya_aranya','nutoa','rifana','petros']);
  const LEGENDS=Object.freeze([
    {id:'aurora',name:'Aurora Valerian',color:'#f2c96d',hp:1980,dmg:34,speed:96,price:1050,weapon:'chronoAnchor',special:'brokenEra',portrait:'ai-assets/ravam/legends/aurora-valerian.png',secret:true,ravamOnly:true,ravamLegendExclusive:true},
    {id:'kai_draconis',name:'Kai Draconis',color:'#b04cff',hp:2200,dmg:37,speed:86,price:1200,weapon:'orbitClamp',special:'eventHorizon',portrait:'ai-assets/ravam/legends/kai-draconis.png',secret:true,ravamOnly:true,ravamLegendExclusive:true},
    {id:'priya_aranya',name:'Priya Aranya',color:'#73f08f',hp:2040,dmg:31,speed:94,price:1000,weapon:'healingSeed',special:'livingSanctuary',portrait:'ai-assets/ravam/legends/priya-aranya.png',secret:true,ravamOnly:true,ravamLegendExclusive:true},
    {id:'nutoa',name:'Nutoa Umbra',color:'#d8b4fe',hp:2070,dmg:37,speed:97,price:1250,weapon:'eclipseBlades',special:'zeroEclipse',portrait:'ai-assets/ravam/legends/nutoa-umbra.png',secret:true,ravamOnly:true,ravamLegendExclusive:true},
    {id:'rifana',name:'Rifana',color:'#5eead4',hp:1960,dmg:35,speed:95,price:1100,weapon:'soulThread',special:'soulProcession',portrait:'ai-assets/ravam/legends/rifana.png',secret:true,ravamOnly:true,ravamLegendExclusive:true},
    {id:'petros',name:'Petros',color:'#43b7ff',hp:1870,dmg:39,speed:210,price:1450,weapon:'overclockRush',special:'blindSpot',portrait:'ai-assets/ravam/legends/petros.png',secret:true,ravamOnly:true,ravamLegendExclusive:true}
  ]);
  const ABILITY=Object.freeze({
    aurora:{flag:'RAVAM',role:'Regente do Instante',tag:'GUARDIÕES DO TEMPO',desc:'J marca um instante do rival e o faz voltar para cobrar posição e dano. L quebra uma era e paralisa o tempo.'},
    kai_draconis:{flag:'RAVAM',role:'Arquiteto da Gravidade',tag:'GUARDIÕES DO TEMPO',desc:'J cria uma singularidade; pressione J novamente para detoná-la. L abre um Horizonte de Eventos.'},
    priya_aranya:{flag:'RAVAM',role:'Guardiã da Cura Viva',tag:'GUARDIÕES DO TEMPO',desc:'J fere e planta uma flor de cura. L converte parte do dano recebido em recuperação atrasada.'},
    nutoa:{flag:'RAVAM',role:'Herdeiro do Eclipse',tag:'SOMBRA + LUZ',desc:'J alterna sombra e luz; a lâmina de luz detona a marca sombria. L produz uma convergência total.'},
    rifana:{flag:'RAVAM',role:'Tecelã de Almas',tag:'ALMAS',desc:'J rouba energia de Super e captura almas. L transforma as almas acumuladas em um cortejo espectral.'},
    petros:{flag:'RAVAM',role:'Velocista do Ponto Cego',tag:'VELOCIDADE PROIBIDA',desc:'J usa a Ruptura Fantasma e deixa uma cegueira leve permanente no round. L aumenta a cegueira e desfere o Ponto Cego Supremo.'}
  });
  const LEGEND_MOVES=Object.freeze({
    aurora:[['J','ÂNCORA DO INSTANTE'],['I','Soco Cronal'],['O','Chute Pêndulo'],['L','ERA QUEBRADA']],
    kai_draconis:[['J','ÓRBITA / DETONAR'],['I','Soco de Massa'],['O','Chute Vetorial'],['L','HORIZONTE DE EVENTOS']],
    priya_aranya:[['J','SEMENTE DE RETORNO'],['I','Soco Restaurador'],['O','Chute Vital'],['L','SANTUÁRIO DAS TRÊS VIDAS']],
    nutoa:[['J','LÂMINAS DO ECLIPSE'],['I','Soco Sombrio'],['O','Chute Solar'],['L','ECLIPSE ZERO']],
    rifana:[['J','FIO DA PENITÊNCIA'],['I','Soco Espectral'],['O','Chute Fúnebre'],['L','CORTEJO DOS NOMES']],
    petros:[['J','RUPTURA FANTASMA'],['I','Soco Vetor'],['O','Chute de Rastro'],['L','PONTO CEGO SUPREMO']]
  });
  const SPEC=Object.freeze({
    aurora:{main:'#f5f1e8',dark:'#29214d',accent:'#f5ca69',hair:'#eee7dc',motif:'clock'},
    kai_draconis:{main:'#222640',dark:'#070812',accent:'#b04cff',hair:'#151423',motif:'gravity'},
    priya_aranya:{main:'#f5f2e8',dark:'#17563a',accent:'#73f08f',hair:'#172b25',motif:'heal'},
    nutoa:{main:'#f6e9cf',dark:'#171022',accent:'#d8b4fe',hair:'#201927',motif:'eclipse'},
    rifana:{main:'#174b50',dark:'#07181f',accent:'#5eead4',hair:'#102b31',motif:'soul'},
    petros:{main:'#143f73',dark:'#061325',accent:'#43b7ff',hair:'#e6edf7',motif:'speed'}
  });
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const legend=id=>LEGENDS.find(c=>c.id===id);
  const currentFight=()=>{try{return fight}catch(_){return null}};
  const opponent=(p,f=currentFight())=>f?(p===f.p1?f.p2:f.p1):null;
  const bySlot=(f,slot)=>slot==='p2'?f?.p2:f?.p1;
  const body=(p)=>{try{return typeof bodyY==='function'?bodyY(p):GROUND_Y-(p.y||0)-78}catch(_){return 530}};
  const floorY=(p)=>{try{return typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0)}catch(_){return 610}};
  const insideY=(p,y,r=18)=>{try{return typeof hitboxY==='function'?hitboxY(p,y,r):Math.abs(body(p)-y)<85}catch(_){return false}};
  const deal=(victim,amount,owner,dir,type)=>{try{return typeof damage==='function'?damage(victim,amount,{owner,chronicle:true},dir,type):undefined}catch(_){}};
  const sfx=(name,vol=.7)=>{try{SFX?.play?.(name,vol)}catch(_){}};
  const toast=(text,tone='normal')=>{try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(text,tone,1900);if(typeof mixToast==='function')mixToast(text)}catch(_){}};
  function ensureArrays(f){
    if(!f)return;
    if(!Array.isArray(f.chronicleProjectiles))f.chronicleProjectiles=[];
    if(!Array.isArray(f.chronicleFields))f.chronicleFields=[];
    if(!Array.isArray(f.chronicleFx))f.chronicleFx=[];
    if(!Array.isArray(f.chronicleTrails))f.chronicleTrails=[];
  }
  function fx(f,p,text,color=p?.color||'#fff',life=.85){
    ensureArrays(f);if(!f||!p)return;
    f.chronicleFx.push({x:p.x,y:body(p)-64,text,color,life,maxLife:life});
  }
  function setCast(p,state='throw',cool=.62,kind='power'){
    if(!p)return;p.legendCastT=state==='special'?.9:.38;p.legendCastKind=kind;
    if(state==='special')p.specialCd=Math.max(p.specialCd||0,6.2);else p.throwCd=Math.max(p.throwCd||0,cool);
    try{setState(p,state)}catch(_){p.state=state;p.stateT=0}
  }
  function pushProjectile(f,p,kind,options={}){
    ensureArrays(f);const target=opponent(p,f),dir=p.facing||1;
    f.chronicleProjectiles.push({kind,ownerSlot:p.playerSlot,targetSlot:target?.playerSlot,x:p.x+dir*(options.ox||54),y:body(p)+(options.oy||-6),vx:dir*(options.speed||760),vy:options.vy||0,life:options.life||1.5,maxLife:options.life||1.5,r:options.r||16,spin:0,dead:false,phase:options.phase||0});
  }

  function auroraPower(p){const f=currentFight();if(!f)return;pushProjectile(f,p,'chrono',{speed:790,r:17,life:1.55});setCast(p,'throw',.66,'chrono');fx(f,p,'ÂNCORA DO INSTANTE','#ffe29a');sfx('attack_light',.72)}
  function auroraSuper(p){const f=currentFight(),t=opponent(p,f);if(!f||!t)return;ensureArrays(f);f.chronicleFields.push({kind:'timeCage',ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,life:2.05,maxLife:2.05,pulse:.08,hits:0,dead:false});p.legendInvulnT=.8;setCast(p,'special',0,'brokenEra');fx(f,p,'ERA QUEBRADA','#fff0a8',1.15);toast('AURORA · O TEMPO PAROU','reward');sfx('super',.9)}
  function kaiPower(p){const f=currentFight(),t=opponent(p,f);if(!f||!t)return;ensureArrays(f);const old=f.chronicleFields.find(z=>z.kind==='singularity'&&z.ownerSlot===p.playerSlot&&!z.dead);if(old){old.detonate=true;old.x=t.x;setCast(p,'throw',.34,'gravityDetonate');fx(f,p,'COLAPSO ORBITAL','#cf7dff');sfx('hit_heavy',.75);return}f.chronicleFields.push({kind:'singularity',ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:p.x+(t.x-p.x)*.62,y:body(t),life:1.8,maxLife:1.8,pulse:.18,dead:false,detonate:false});setCast(p,'throw',.72,'gravity');fx(f,p,'ÓRBITA APRISIONADA','#c984ff');sfx('attack_heavy',.75)}
  function kaiSuper(p){const f=currentFight(),t=opponent(p,f);if(!f||!t)return;ensureArrays(f);f.chronicleFields.push({kind:'eventHorizon',ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,y:body(t),life:2.55,maxLife:2.55,pulse:.1,hits:0,dead:false});setCast(p,'special',0,'eventHorizon');fx(f,p,'HORIZONTE DE EVENTOS','#d99cff',1.15);toast('KAI DRACONIS · GRAVIDADE ABSOLUTA','reward');sfx('super',.92)}
  function priyaPower(p){const f=currentFight();if(!f)return;pushProjectile(f,p,'healingSeed',{speed:680,vy:-24,r:15,life:1.75});setCast(p,'throw',.70,'healingSeed');fx(f,p,'SEMENTE DE RETORNO','#9bffae');sfx('attack_light',.66)}
  function priyaSuper(p){const f=currentFight();if(!f)return;ensureArrays(f);f.chronicleFields.push({kind:'sanctuary',ownerSlot:p.playerSlot,targetSlot:opponent(p,f)?.playerSlot,x:p.x,life:4.6,maxLife:4.6,pulse:.12,stored:0,dead:false});p.priyaSanctuaryT=4.6;setCast(p,'special',0,'sanctuary');fx(f,p,'SANTUÁRIO DAS TRÊS VIDAS','#b9ffc4',1.2);toast('PRIYA ARANYA · DANO VIRARÁ CURA','reward');sfx('super',.88)}
  function nutoaPower(p){const f=currentFight();if(!f)return;p.nutoaPhase=(Number(p.nutoaPhase)||0)%2;const shadow=p.nutoaPhase===0;p.nutoaPhase=shadow?1:0;pushProjectile(f,p,shadow?'shadowBlade':'lightBlade',{speed:shadow?760:880,r:19,life:1.45});setCast(p,'throw',.61,shadow?'shadow':'light');fx(f,p,shadow?'LÂMINA DA SOMBRA':'LÂMINA DA LUZ',shadow?'#8b5cf6':'#fff0a8');sfx('attack_light',.72)}
  function nutoaSuper(p){const f=currentFight(),t=opponent(p,f);if(!f||!t)return;ensureArrays(f);f.chronicleFields.push({kind:'eclipseZero',ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,life:1.9,maxLife:1.9,pulse:.05,hits:0,dead:false});setCast(p,'special',0,'eclipseZero');fx(f,p,'ECLIPSE ZERO','#f5e8ff',1.2);toast('NUTOA · SOMBRA E LUZ CONVERGIRAM','reward');sfx('super',.9)}
  function rifanaPower(p){const f=currentFight();if(!f)return;pushProjectile(f,p,'soulThread',{speed:720,r:14,life:1.65});setCast(p,'throw',.69,'soulThread');fx(f,p,'FIO DA PENITÊNCIA','#7fffe9');sfx('attack_light',.68)}
  function rifanaSuper(p){const f=currentFight(),t=opponent(p,f);if(!f||!t)return;ensureArrays(f);const souls=clamp(p.rifanaSouls||0,0,3),hits=3+souls;p.rifanaSouls=0;f.chronicleFields.push({kind:'soulProcession',ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,life:.55+hits*.19,maxLife:.55+hits*.19,pulse:.06,hits:0,total:hits,dead:false});setCast(p,'special',0,'soulProcession');fx(f,p,`CORTEJO · ${hits} ALMAS`,'#91fff0',1.15);toast(`RIFANA · ${hits} ESPÍRITOS CONVOCADOS`,'reward');sfx('super',.88)}
  function petrosPower(p){
    const f=currentFight(),t=opponent(p,f);if(!f||!t)return;ensureArrays(f);
    const stack=clamp((p.petrosStack||0)+1,1,8);p.petrosStack=stack;
    // A cegueira cresce pouco por J e não decai durante o round.
    p.petrosBlindness=clamp((p.petrosBlindness||0)+.028,0,.78);
    const dir=t.x>=p.x?1:-1,before=p.x,dash=190+stack*38;p.facing=dir;p.x=clamp(p.x+dir*dash,28,W-28);p.vx=dir*(160+stack*34);
    for(let i=0;i<6;i++)f.chronicleTrails.push({kind:'speed',x:before+(p.x-before)*i/6,y:floorY(p),dir,color:i%2?'#d9f5ff':'#43b7ff',life:.24+i*.025,maxLife:.40});
    const crossed=t.x>=Math.min(before,p.x)-72&&t.x<=Math.max(before,p.x)+72;
    if(crossed&&Math.abs((t.y||0)-(p.y||0))<145){
      deal(t,p.dmg*(.78+stack*.13),p,dir,'petros-phantom-break');t.vx+=dir*(190+stack*54);
      f.chronicleFields.push({kind:'speedEcho',ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,life:.16,maxLife:.16,dead:false});
      try{spark(t.x,body(t),'#8de5ff',24+stack*4)}catch(_){ }
    }
    setCast(p,'throw',Math.max(.22,.40-stack*.018),'overclock');fx(f,p,`RUPTURA FANTASMA · ${stack}/8`,'#70d7ff');sfx('dodge',.72+.025*stack);
  }
  function petrosSuper(p){
    const f=currentFight(),t=opponent(p,f);if(!f||!t)return;ensureArrays(f);
    const stack=clamp(p.petrosStack||0,0,8),hits=5+stack;p.petrosStack=0;
    // A cinemática já cobra o preço visual; o fallback cobre execuções diretas.
    if(p.petrosBlindnessFromCine)p.petrosBlindnessFromCine=false;
    else p.petrosBlindness=clamp((p.petrosBlindness||0)+.16,0,.78);
    p.petrosBlindnessChargedForCurrentSuper=false;
    f.chronicleFields.push({kind:'blindSpot',ownerSlot:p.playerSlot,targetSlot:t.playerSlot,x:t.x,life:.52+hits*.14,maxLife:.52+hits*.14,pulse:.04,hits:0,total:hits,dead:false});
    p.legendInvulnT=1.55;setCast(p,'special',0,'blindSpot');fx(f,p,`PONTO CEGO SUPREMO · ${hits} IMPACTOS`,'#a8e8ff',1.2);toast('PETROS · A CEGUEIRA FICA ATÉ O PRÓXIMO ROUND','reward');sfx('super',.96);
  }

  const POWER={aurora:auroraPower,kai_draconis:kaiPower,priya_aranya:priyaPower,nutoa:nutoaPower,rifana:rifanaPower,petros:petrosPower};
  const SUPER={aurora:auroraSuper,kai_draconis:kaiSuper,priya_aranya:priyaSuper,nutoa:nutoaSuper,rifana:rifanaSuper,petros:petrosSuper};

  const baseStart=window.startFight;
  if(typeof baseStart==='function')window.startFight=function(playerId,mode,player2Id,stageId,chaos){
    const wanted=[playerId,player2Id].filter(id=>IDS.includes(id)),added=[];
    try{
      if(wanted.length&&typeof CHARACTERS!=='undefined')for(const id of wanted){const c=legend(id);if(c&&!CHARACTERS.some(x=>x.id===id)){CHARACTERS.push(c);added.push(id)}if(typeof ABILITIES!=='undefined'&&!ABILITIES[id])ABILITIES[id]=ABILITY[id];if(typeof MOVES!=='undefined'&&!MOVES[id])MOVES[id]=MOVES_MAP(id)}
      const result=baseStart.apply(this,arguments);
      const f=currentFight();if(f&&wanted.length){f.ravamStudios=true;f.ravamChronicle=true;f.ravamVersion=VERSION;ensureArrays(f);for(const p of [f.p1,f.p2])if(p&&IDS.includes(p.id)){p.legendCastT=0;p.legendCastKind='';p.legendInvulnT=0;p.nutoaPhase=0;p.nutoaMarkT=0;p.rifanaSouls=0;p.petrosStack=0;p.petrosBlindness=0;p.petrosUltimateWasPending=false;p.petrosBlindnessFromCine=false;p.petrosBlindnessChargedForCurrentSuper=false;p.priyaSanctuaryT=0;p.ravamWalkDist=0;p.ravamAnimLastX=p.x;p.ravamMoveLabelArmed=false;if(p.id==='petros'){p.petrosBaseSpeed=p.speed;p.speed=Math.max(Number(p.speed)||0,1080);p.dmg=Math.max(Number(p.dmg)||0,62)}}}
      return result;
    }finally{if(added.length&&typeof CHARACTERS!=='undefined')for(const id of added){const i=CHARACTERS.findIndex(c=>c.id===id);if(i>=0)CHARACTERS.splice(i,1)}}
  };
  function MOVES_MAP(id){return LEGEND_MOVES[id]||[['J','Poder'],['L','Super']]}

  const baseThrow=window.throwProjectile;
  if(typeof baseThrow==='function')window.throwProjectile=function(p){const fn=POWER[p?.id];if(fn){fn(p);return}return baseThrow.apply(this,arguments)};
  const baseSpecial=window.castSpecial;
  if(typeof baseSpecial==='function')window.castSpecial=function(p){const fn=SUPER[p?.id];if(fn){fn(p);return}return baseSpecial.apply(this,arguments)};
  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){
    const f=currentFight();if(victim?.id==='priya_aranya'&&(victim.priyaSanctuaryT||0)>0&&Number(amount)>0&&type!=='hazard'){
      ensureArrays(f);const field=f?.chronicleFields?.find(z=>z.kind==='sanctuary'&&z.ownerSlot===victim.playerSlot&&!z.dead);if(field)field.stored=Math.min(victim.maxHp*.24,(field.stored||0)+Number(amount)*.42);
    }
    return baseDamage.apply(this,arguments);
  };

  function preUpdate(f){
    if(!f?.ravamChronicle)return;
    for(const p of [f.p1,f.p2])if(p){
      if((p.legendTimeStopT||0)>0){p.vx=0;p.vy=0;p.attackDisabledT=Math.max(p.attackDisabledT||0,.12);p.freezeT=Math.max(p.freezeT||0,.10)}
      if((p.legendInvulnT||0)>0)p.invuln=Math.max(p.invuln||0,.08);
    }
  }
  function updateChronicle(f,dt){
    if(!f?.ravamChronicle){try{canvas.style.filter=''}catch(_){ }return}ensureArrays(f);
    for(const p of [f.p1,f.p2])if(p){
      p.legendCastT=Math.max(0,(p.legendCastT||0)-dt);p.legendInvulnT=Math.max(0,(p.legendInvulnT||0)-dt);p.legendTimeStopT=Math.max(0,(p.legendTimeStopT||0)-dt);p.nutoaMarkT=Math.max(0,(p.nutoaMarkT||0)-dt);p.priyaSanctuaryT=Math.max(0,(p.priyaSanctuaryT||0)-dt);
      if(IDS.includes(p.id)){
        if(p.id==='petros'){
          const pending=!!p.megaUltimatePending;
          if(pending&&!p.petrosUltimateWasPending&&!p.petrosBlindnessChargedForCurrentSuper){p.petrosBlindness=clamp((p.petrosBlindness||0)+.16,0,.78);p.petrosBlindnessFromCine=true;p.petrosBlindnessChargedForCurrentSuper=true}
          if(!p.superReady&&!pending)p.petrosBlindnessChargedForCurrentSuper=false;
          p.petrosUltimateWasPending=pending;
        }
        const last=Number.isFinite(p.ravamAnimLastX)?p.ravamAnimLastX:p.x,dx=Math.abs((p.x||0)-last);
        if(p.onGround&&Math.abs(p.vx||0)>7&&p.state!=='hurt'&&p.state!=='ko')p.ravamWalkDist=(p.ravamWalkDist||0)+Math.min(dx,40);else if(p.onGround)p.ravamWalkDist=(p.ravamWalkDist||0)*Math.max(0,1-dt*10);
        p.ravamAnimLastX=p.x;
        const kind=p.proMove?.kind;
        if((kind==='punch'||kind==='kick')&&!p.ravamMoveLabelArmed){const names=LEGEND_MOVES[p.id]||[];fx(f,p,kind==='punch'?(names.find(x=>x[0]==='I')?.[1]||'SOCO'):((names.find(x=>x[0]==='O')?.[1])||'CHUTE'),SPEC[p.id]?.accent||p.color,.72);p.ravamMoveLabelArmed=true}
        if(!kind)p.ravamMoveLabelArmed=false;
      }
    }
    for(const q of f.chronicleProjectiles){
      if(q.dead)continue;q.life-=dt;q.spin+=dt*8;q.x+=(q.vx||0)*dt;q.y+=(q.vy||0)*dt;const owner=bySlot(f,q.ownerSlot),target=bySlot(f,q.targetSlot);if(!owner||!target||target.state==='ko'){q.dead=true;continue}
      if(Math.abs(q.x-target.x)<50+(q.r||12)&&insideY(target,q.y,q.r||16)){
        const dir=(q.vx||1)>0?1:-1;q.dead=true;
        if(q.kind==='chrono'){
          deal(target,owner.dmg*.62,owner,dir,'aurora-anchor');f.chronicleFields.push({kind:'chronoEcho',ownerSlot:q.ownerSlot,targetSlot:q.targetSlot,x:target.x,y:target.y,life:1.08,maxLife:1.08,dead:false});target.legendTimeStopT=Math.max(target.legendTimeStopT||0,.18);fx(f,target,'INSTANTE MARCADO','#ffe29a');
        }else if(q.kind==='healingSeed'){
          deal(target,owner.dmg*.52,owner,dir,'aranya-seed');f.chronicleFields.push({kind:'healingBloom',ownerSlot:q.ownerSlot,targetSlot:q.targetSlot,x:target.x,life:3.6,maxLife:3.6,pulse:.05,dead:false});fx(f,owner,'FLOR DE CURA','#8dffa6');
        }else if(q.kind==='shadowBlade'){
          deal(target,owner.dmg*.72,owner,dir,'nutoa-shadow');target.nutoaMarkT=4.2;target.nutoaMarkOwner=q.ownerSlot;fx(f,target,'MARCA UMBRA','#a76cff');
        }else if(q.kind==='lightBlade'){
          const marked=(target.nutoaMarkT||0)>0&&target.nutoaMarkOwner===q.ownerSlot;deal(target,owner.dmg*(marked?1.34:.78),owner,dir,marked?'nutoa-eclipse':'nutoa-light');if(marked){target.nutoaMarkT=0;target.vx+=dir*260;try{spark(target.x,body(target),'#fff0a8',38)}catch(_){}}fx(f,target,marked?'ECLIPSE DETONADO':'LUZ CORTANTE','#fff0a8');
        }else if(q.kind==='soulThread'){
          deal(target,owner.dmg*.56,owner,dir,'rifana-thread');const stolen=Math.min(.09,Math.max(0,target.superMeter||0));target.superMeter=Math.max(0,(target.superMeter||0)-stolen);target.superReady=target.superMeter>=1;owner.rifanaSouls=clamp((owner.rifanaSouls||0)+1,0,3);owner.superMeter=clamp((owner.superMeter||0)+stolen*.45,0,1);owner.superReady=owner.superMeter>=1;fx(f,owner,`ALMA ${owner.rifanaSouls}/3`,'#7fffe9');
        }
        try{spark(q.x,q.y,owner.color||'#fff',24)}catch(_){ }
      }
      if(q.life<=0||q.x<-110||q.x>W+110||q.y<10||q.y>GROUND_Y+80)q.dead=true;
    }
    f.chronicleProjectiles=f.chronicleProjectiles.filter(q=>!q.dead);

    for(const z of f.chronicleFields){
      if(z.dead)continue;z.life-=dt;z.pulse=(z.pulse||0)-dt;const owner=bySlot(f,z.ownerSlot),target=bySlot(f,z.targetSlot);if(!owner){z.dead=true;continue}
      if(z.kind==='speedEcho'){
        if(z.life<=0&&target&&target.state!=='ko'){const dir=target.x>=owner.x?1:-1;deal(target,owner.dmg*.46,owner,dir,'petros-phantom-echo');target.vx+=dir*150;try{spark(target.x,body(target),'#d9f5ff',28)}catch(_){ }fx(f,target,'ECO HIPERVELOZ','#a8e8ff',.62);z.dead=true}
      }else if(z.kind==='chronoEcho'){
        if(z.life<=0&&target&&target.state!=='ko'){target.x=clamp(z.x,28,W-28);target.y=Math.max(0,z.y||0);deal(target,owner.dmg*.43,owner,target.x>=owner.x?1:-1,'aurora-rewind');target.vx*=.25;try{spark(target.x,body(target),'#ffe29a',34)}catch(_){ }fx(f,target,'REBOBINADO','#fff0b5');z.dead=true}
      }else if(z.kind==='timeCage'){
        if(!target||target.state==='ko'){z.dead=true;continue}z.x=target.x;target.legendTimeStopT=Math.max(target.legendTimeStopT||0,.14);if(z.pulse<=0&&z.hits<5){z.pulse=.31;z.hits++;deal(target,owner.dmg*(z.hits===5?.34:.18),owner,z.hits%2?1:-1,'aurora-time-stop');try{spark(target.x+(z.hits%2?35:-35),body(target),'#ffe9a3',12)}catch(_){}}
      }else if(z.kind==='singularity'){
        if(!target||target.state==='ko'){z.dead=true;continue}z.y=body(target);const pull=clamp((z.x-target.x)*dt*7,-95,95);target.vx+=pull;target.y=Math.max(0,(target.y||0)+35*dt);if(z.pulse<=0){z.pulse=.28;deal(target,owner.dmg*.13,owner,z.x>=target.x?1:-1,'kai-orbit')}if(z.detonate||z.life<=0){const dir=target.x>=owner.x?1:-1;deal(target,owner.dmg*1.06,owner,dir,'kai-collapse');target.vx+=dir*390;target.vy=390;try{spark(z.x,z.y,'#c05cff',46)}catch(_){ }z.dead=true}
      }else if(z.kind==='eventHorizon'){
        if(!target||target.state==='ko'){z.dead=true;continue}z.x+=(target.x-z.x)*Math.min(1,dt*5);z.y=body(target);target.vx+=(z.x-target.x)*dt*8;target.y=Math.max(0,(target.y||0)+75*dt);target.vy*=.55;if(z.pulse<=0&&z.hits<6){z.pulse=.34;z.hits++;deal(target,owner.dmg*.23,owner,z.hits%2?1:-1,'kai-horizon')}if(z.life<=0){deal(target,owner.dmg*1.05,owner,target.x>=owner.x?1:-1,'kai-horizon-release');target.vy=610;target.vx+=(target.x>=owner.x?1:-1)*240;z.dead=true}
      }else if(z.kind==='healingBloom'){
        if(z.pulse<=0){z.pulse=.72;const near=Math.abs(owner.x-z.x)<290;if(near&&owner.state!=='ko'){const heal=Math.round(owner.maxHp*.027);owner.hp=Math.min(owner.maxHp,owner.hp+heal);fx(f,owner,`+${heal} VIDA`,'#9bffae',.65)}if(target&&target.state!=='ko'&&Math.abs(target.x-z.x)<125)deal(target,owner.dmg*.12,owner,target.x>=owner.x?1:-1,'aranya-bloom')}
      }else if(z.kind==='sanctuary'){
        z.x=owner.x;owner.priyaSanctuaryT=Math.max(owner.priyaSanctuaryT||0,.12);if(z.pulse<=0){z.pulse=.72;const fixed=owner.maxHp*.018,stored=Math.min(z.stored||0,owner.maxHp*.045);z.stored=Math.max(0,(z.stored||0)-stored);const heal=Math.round(fixed+stored);owner.hp=Math.min(owner.maxHp,owner.hp+heal);fx(f,owner,`+${heal} VIDA DEVOLVIDA`,'#b9ffc4',.62)}
      }else if(z.kind==='eclipseZero'){
        if(!target||target.state==='ko'){z.dead=true;continue}z.x=target.x;if(z.pulse<=0&&z.hits<6){z.pulse=.25;z.hits++;const dir=z.hits%2?1:-1;deal(target,owner.dmg*(z.hits===6?.52:.24),owner,dir,z.hits===6?'nutoa-zero':'nutoa-convergence');target.vx+=dir*(z.hits===6?240:55);try{spark(target.x+dir*44,body(target),z.hits%2?'#1d102f':'#fff0a8',15)}catch(_){}}
      }else if(z.kind==='soulProcession'){
        if(!target||target.state==='ko'){z.dead=true;continue}z.x=target.x;if(z.pulse<=0&&z.hits<z.total){z.pulse=.17;z.hits++;const dir=z.hits%2?1:-1;deal(target,owner.dmg*(z.hits===z.total?.47:.24),owner,dir,'rifana-procession');target.vx+=dir*70;const heal=Math.round(owner.maxHp*.008);owner.hp=Math.min(owner.maxHp,owner.hp+heal);try{spark(target.x+dir*34,body(target)-20+z.hits*5,'#64f5df',13)}catch(_){}}
      }else if(z.kind==='blindSpot'){
        if(!target||target.state==='ko'){z.dead=true;continue}z.x=target.x;if(z.pulse<=0&&z.hits<z.total){z.pulse=.118;z.hits++;const dir=z.hits%2?1:-1;owner.x=clamp(target.x+dir*(82+z.hits*4),28,W-28);owner.facing=-dir;deal(target,owner.dmg*(z.hits===z.total?.88:.32),owner,-dir,'petros-blind-spot');target.vx-=dir*(z.hits===z.total?360:78);f.chronicleTrails.push({kind:'speed',x:owner.x,y:floorY(owner),dir:owner.facing,color:'#a8e8ff',life:.34,maxLife:.34});try{spark(target.x,body(target),'#8de0ff',15+z.hits)}catch(_){}}
      }
      if(z.life<=0)z.dead=true;
    }
    f.chronicleFields=f.chronicleFields.filter(z=>!z.dead);
    for(const e of f.chronicleFx){e.life-=dt;e.y-=19*dt}f.chronicleFx=f.chronicleFx.filter(e=>e.life>0);
    for(const t of f.chronicleTrails)t.life-=dt;f.chronicleTrails=f.chronicleTrails.filter(t=>t.life>0);
  }
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){preUpdate(f);const result=baseUpdate.apply(this,arguments);if(!f?.paused)updateChronicle(f,dt);return result};

  function lineLimb(ctx,x1,y1,len,angle,width,color){ctx.save();ctx.translate(x1,y1);ctx.rotate(angle);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,len);ctx.stroke();ctx.restore()}
  function drawMotif(ctx,p,s,time){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=s.accent;ctx.fillStyle=s.accent;ctx.shadowColor=s.accent;ctx.shadowBlur=16;
    if(s.motif==='clock'){ctx.globalAlpha=.58;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-143,48,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4+time*.08;ctx.beginPath();ctx.moveTo(Math.cos(a)*43,-143+Math.sin(a)*43);ctx.lineTo(Math.cos(a)*52,-143+Math.sin(a)*52);ctx.stroke()}}
    if(s.motif==='gravity'){ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(0,-112,10+Math.sin(time*5)*2,0,Math.PI*2);ctx.fill();for(let i=0;i<4;i++){const a=time*(i%2?1:-1)+i*1.7;ctx.globalAlpha=.42;ctx.beginPath();ctx.arc(Math.cos(a)*(30+i*4),-112+Math.sin(a)*15,3+i,0,Math.PI*2);ctx.fill()}}
    if(s.motif==='heal'){ctx.globalAlpha=.55;ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2+time*.15);ctx.beginPath();ctx.ellipse(0,-42,9,22,0,0,Math.PI*2);ctx.stroke();ctx.restore()}}
    if(s.motif==='eclipse'){ctx.globalAlpha=.72;ctx.fillStyle='#170d26';ctx.beginPath();ctx.arc(-13,-126,20,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0ba';ctx.beginPath();ctx.arc(7,-126,17,0,Math.PI*2);ctx.fill()}
    if(s.motif==='soul'){for(let i=0;i<3;i++){const a=time*1.6+i*2.1;ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(Math.cos(a)*42,-108+Math.sin(a)*28,5,0,Math.PI*2);ctx.fill()}}
    if(s.motif==='speed'){ctx.globalAlpha=.55;ctx.lineWidth=4;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-54-i*17,-130+i*28);ctx.lineTo(-12,-130+i*28);ctx.stroke()}}
    ctx.restore();
  }
  function drawChronicleFighter(ctx,p){
    const s=SPEC[p?.id];if(!s)return false;const floor=floorY(p),time=performance.now()/1000,walk=(p.ravamWalkDist||p.walkDistance||0)/22,move=p.proMove?.kind||'',dur=Math.max(.1,p.proMove?.duration||.34),attack=clamp((p.proMove?.time||0)/dur,0,1),casting=p.state==='throw'||p.state==='special'||(p.legendCastT||0)>0,idle=p.onGround&&Math.abs(p.vx||0)<=7&&!move&&!casting&&p.state!=='hurt';let armFront=-.18,armBack=.24,legFront=.05,legBack=-.05,bob=idle?Math.sin(time*2.8+(p.playerSlot==='p2'?1.4:0))*2:0,lean=0;
    if(p.onGround&&Math.abs(p.vx||0)>7){armFront=Math.sin(walk)*.55;armBack=-armFront;legFront=-armFront*.7;legBack=-legFront;bob=Math.abs(Math.sin(walk))*3}
    if(move==='punch'){const k=Math.sin(attack*Math.PI);armFront=-1.1*k;lean=-.09*k}
    if(move==='kick'){const k=Math.sin(attack*Math.PI);legFront=-1.28*k;lean=.08*k}
    if(casting){const k=Math.sin(clamp((p.stateT||0)*5,0,1)*Math.PI*.5);armFront=-1.12*k;armBack=-.78*k;lean=-.04*k;if(p.id==='aurora'){armFront=-1.55*k;armBack=.35*k}else if(p.id==='kai_draconis'){armFront=-1.35*k;armBack=1.35*k}else if(p.id==='priya_aranya'){armFront=-.82*k;armBack=-.82*k}else if(p.id==='nutoa'){armFront=-1.32*k;armBack=1.05*k}else if(p.id==='rifana'){armFront=-1.48*k;armBack=-.25*k}else if(p.id==='petros'){armFront=-.72*k;armBack=.85*k;lean=-.18*k}}
    if(!p.onGround){legFront=.38;legBack=-.44;armFront=-.32;armBack=.36;lean=clamp(-(p.vy||0)/1300,-.09,.09)}
    if(p.state==='hurt'){lean=.12;armFront=.55;armBack=-.45}
    ctx.save();ctx.globalAlpha=.32;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,GROUND_Y+4,39*Math.max(.35,1-(p.y||0)/430),8,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(p.x,floor-bob);ctx.scale(p.facing||1,idle?1+Math.sin(time*2.8)*.006:1);if(p.state==='ko'){ctx.translate(-18,-18);ctx.rotate(-Math.PI/2);ctx.translate(0,72)}else ctx.rotate(lean);
    if(p.legendInvulnT>0)ctx.globalAlpha=.62+.28*Math.sin(time*24);
    drawMotif(ctx,p,s,time);
    ctx.fillStyle=s.dark;ctx.strokeStyle=s.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-28,-142);ctx.quadraticCurveTo(-48,-76,-34,-12);ctx.lineTo(0,-30);ctx.lineTo(34,-12);ctx.quadraticCurveTo(49,-76,28,-142);ctx.closePath();ctx.fill();ctx.stroke();
    lineLimb(ctx,-14,-90,58,legBack,15,s.dark);lineLimb(ctx,14,-90,58,legFront,15,s.main);
    lineLimb(ctx,-22,-136,57,armBack,13,s.dark);lineLimb(ctx,22,-136,62,armFront,13,s.main);
    ctx.fillStyle=s.main;ctx.strokeStyle=s.accent;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-27,-151,54,72,17);ctx.fill();ctx.stroke();
    ctx.fillStyle='#c98f68';ctx.beginPath();ctx.arc(0,-174,20,0,Math.PI*2);ctx.fill();ctx.fillStyle=s.hair;ctx.beginPath();ctx.arc(0,-182,21,Math.PI,Math.PI*2);ctx.lineTo(20,-169);ctx.quadraticCurveTo(4,-177,-19,-168);ctx.closePath();ctx.fill();
    ctx.strokeStyle=s.accent;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-112);ctx.lineTo(18,-112);ctx.stroke();ctx.fillStyle=s.accent;ctx.beginPath();ctx.arc(0,-112,5,0,Math.PI*2);ctx.fill();
    if(casting){ctx.save();ctx.translate(48,-135);ctx.globalCompositeOperation='lighter';ctx.fillStyle=s.accent;ctx.shadowColor=s.accent;ctx.shadowBlur=22;ctx.beginPath();ctx.arc(0,0,8+Math.sin(time*12)*3,0,Math.PI*2);ctx.fill();ctx.restore()}
    if(move==='punch'||move==='kick'){const k=Math.sin(attack*Math.PI);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.75*k;ctx.strokeStyle=s.accent;ctx.shadowColor=s.accent;ctx.shadowBlur=18;ctx.lineWidth=move==='kick'?7:5;ctx.beginPath();if(move==='kick')ctx.arc(24,-70,78,-1.25,.45);else{ctx.moveTo(26,-137);ctx.lineTo(122,-137)}ctx.stroke();ctx.restore()}
    if(p.id==='nutoa'){ctx.strokeStyle='#fff0ae';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(26,-138);ctx.lineTo(64,-84);ctx.stroke();ctx.strokeStyle='#8b5cf6';ctx.beginPath();ctx.moveTo(-26,-138);ctx.lineTo(-64,-84);ctx.stroke()}
    if(p.id==='rifana'&&(p.rifanaSouls||0)>0){for(let i=0;i<p.rifanaSouls;i++){const a=time*2+i*2.1;ctx.fillStyle='#8fffea';ctx.shadowBlur=14;ctx.shadowColor='#5eead4';ctx.beginPath();ctx.arc(Math.cos(a)*48,-130+Math.sin(a)*30,5,0,Math.PI*2);ctx.fill()}}
    ctx.restore();return true;
  }
  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){if(IDS.includes(p?.id)&&drawChronicleFighter(ctx,p))return;return baseDrawFighter.apply(this,arguments)};

  function drawProjectile(ctx,q){
    ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.spin||0);ctx.globalCompositeOperation='lighter';
    const col=q.kind==='chrono'?'#ffe29a':q.kind==='healingSeed'?'#82f79d':q.kind==='shadowBlade'?'#8b5cf6':q.kind==='lightBlade'?'#fff0a8':'#66f5df';ctx.strokeStyle=col;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=20;ctx.lineWidth=4;
    if(q.kind==='chrono'){ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-10);ctx.moveTo(0,0);ctx.lineTo(8,4);ctx.stroke()}
    else if(q.kind==='healingSeed'){ctx.beginPath();ctx.ellipse(0,0,12,7,.4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.stroke()}
    else if(q.kind==='shadowBlade'||q.kind==='lightBlade'){ctx.beginPath();ctx.arc(0,0,20,-1.2,1.2);ctx.stroke();ctx.beginPath();ctx.arc(4,0,12,-1.2,1.2);ctx.stroke()}
    else{ctx.beginPath();ctx.moveTo(-18,0);ctx.quadraticCurveTo(0,-13,20,0);ctx.quadraticCurveTo(0,13,-18,0);ctx.stroke()}
    ctx.restore();
  }
  function drawField(ctx,f,z){
    const owner=bySlot(f,z.ownerSlot),target=bySlot(f,z.targetSlot),a=clamp(z.life/(z.maxLife||1),0,1),time=performance.now()/1000;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35+.32*a;
    if(z.kind==='speedEcho'){ctx.translate(z.x,body(target||owner));ctx.strokeStyle='#d9f5ff';ctx.shadowColor='#43b7ff';ctx.shadowBlur=24;ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.globalAlpha=.22+i*.16;ctx.beginPath();ctx.moveTo(-90-i*18,-30+i*24);ctx.lineTo(52,-30+i*24);ctx.stroke()}}
    else if(z.kind==='chronoEcho'){ctx.strokeStyle='#ffe29a';ctx.shadowColor='#ffe29a';ctx.shadowBlur=18;ctx.lineWidth=3;ctx.beginPath();ctx.arc(z.x,body(target||owner),32+Math.sin(time*8)*4,0,Math.PI*2);ctx.stroke()}
    else if(z.kind==='timeCage'){ctx.translate(z.x,body(target));ctx.strokeStyle='#fff0a8';ctx.shadowColor='#ffe29a';ctx.shadowBlur=25;ctx.lineWidth=4;for(let i=0;i<3;i++){ctx.rotate(time*(i%2?-.7:.7));ctx.beginPath();ctx.ellipse(0,0,58-i*13,86-i*16,0,0,Math.PI*2);ctx.stroke()}}
    else if(z.kind==='singularity'||z.kind==='eventHorizon'){ctx.translate(z.x,z.y||body(target));ctx.fillStyle='#12051f';ctx.strokeStyle='#c05cff';ctx.shadowColor='#b04cff';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(0,0,z.kind==='eventHorizon'?34:23,0,Math.PI*2);ctx.fill();ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.rotate(time*(i%2?-.9:.9));ctx.beginPath();ctx.ellipse(0,0,(z.kind==='eventHorizon'?82:54)-i*13,18-i*3,0,0,Math.PI*2);ctx.stroke()}}
    else if(z.kind==='healingBloom'||z.kind==='sanctuary'){const x=z.kind==='sanctuary'?(owner?.x||z.x):z.x;ctx.translate(x,GROUND_Y-5);ctx.strokeStyle='#82f79d';ctx.fillStyle='rgba(90,255,130,.12)';ctx.shadowColor='#73f08f';ctx.shadowBlur=22;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,z.kind==='sanctuary'?118:72,z.kind==='sanctuary'?26:17,0,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<6;i++){const ang=i*Math.PI/3+time*.18;ctx.beginPath();ctx.ellipse(Math.cos(ang)*48,-16-Math.abs(Math.sin(ang))*30,7,17,ang,0,Math.PI*2);ctx.stroke()}}
    else if(z.kind==='eclipseZero'){ctx.translate(z.x,body(target));ctx.lineWidth=8;ctx.strokeStyle='#8b5cf6';ctx.shadowColor='#8b5cf6';ctx.shadowBlur=25;ctx.beginPath();ctx.arc(0,0,72,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.strokeStyle='#fff0a8';ctx.shadowColor='#fff0a8';ctx.beginPath();ctx.arc(0,0,72,Math.PI/2,Math.PI*1.5);ctx.stroke()}
    else if(z.kind==='soulProcession'){ctx.translate(z.x,body(target));for(let i=0;i<(z.total||3);i++){const ang=time*2+i*Math.PI*2/(z.total||3),r=48+i*4;ctx.fillStyle='#72f5e1';ctx.shadowColor='#5eead4';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(Math.cos(ang)*r,Math.sin(ang)*r*.65,6,0,Math.PI*2);ctx.fill()}}
    else if(z.kind==='blindSpot'){ctx.translate(z.x,body(target));ctx.strokeStyle='#70d7ff';ctx.shadowColor='#43b7ff';ctx.shadowBlur=22;ctx.lineWidth=5;for(let i=0;i<4;i++){ctx.globalAlpha=.16+.12*i;ctx.beginPath();ctx.arc(0,0,38+i*19,time+i*.8,time+2.3+i*.8);ctx.stroke()}}
    ctx.restore();
  }
  function drawMoveHud(ctx,p,side){
    if(!p||!IDS.includes(p.id))return;const moves=LEGEND_MOVES[p.id]||[],j=moves.find(x=>x[0]==='J')?.[1]||'PODER',i=moves.find(x=>x[0]==='I')?.[1]||'SOCO',o=moves.find(x=>x[0]==='O')?.[1]||'CHUTE',l=moves.find(x=>x[0]==='L')?.[1]||'SUPER',accent=SPEC[p.id]?.accent||p.color||'#fff',boxW=410,x=side==='p2'?W-boxW-28:28,y=(typeof H!=='undefined'?H:1024)-185;
    ctx.save();ctx.fillStyle='rgba(3,8,18,.78)';ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,boxW,82,12);ctx.fill();ctx.stroke();ctx.textAlign=side==='p2'?'right':'left';const tx=side==='p2'?x+boxW-16:x+16;ctx.font='900 12px Oxanium,Arial';ctx.fillStyle=accent;ctx.fillText(`${p.name.toUpperCase()} · GOLPES NOMEADOS`,tx,y+20);ctx.font='800 11px Oxanium,Arial';ctx.fillStyle='#f6f8ff';ctx.fillText(`I · ${i}     O · ${o}`,tx,y+43);ctx.fillStyle='#c9e9ff';ctx.fillText(`J · ${j}     L · ${l}`,tx,y+65);ctx.restore();
  }
  function drawChronicleFx(ctx,f){
    if(!f?.ravamChronicle)return;ensureArrays(f);
    for(const t of f.chronicleTrails){const a=clamp(t.life/(t.maxLife||1),0,1);ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.dir||1,1);ctx.globalAlpha=.24*a;ctx.strokeStyle=t.color||'#43b7ff';ctx.shadowColor=t.color||'#43b7ff';ctx.shadowBlur=16;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-95,-110);ctx.lineTo(5,-110);ctx.moveTo(-75,-75);ctx.lineTo(8,-75);ctx.stroke();ctx.restore()}
    for(const q of f.chronicleProjectiles)drawProjectile(ctx,q);
    for(const z of f.chronicleFields)drawField(ctx,f,z);
    for(const e of f.chronicleFx){const a=clamp(e.life/(e.maxLife||1),0,1);ctx.save();ctx.globalAlpha=a;ctx.font='900 13px Oxanium,Arial';ctx.textAlign='center';ctx.fillStyle=e.color;ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillText(e.text,e.x,e.y);ctx.restore()}
    drawMoveHud(ctx,f.p1,'p1');drawMoveHud(ctx,f.p2,'p2');
    const level=clamp(Math.max(...[f.p1,f.p2].filter(p=>p?.id==='petros').map(p=>Number(p.petrosBlindness)||0),0),0,.78);
    try{canvas.style.filter=level>0?`blur(${(level*2.2).toFixed(1)}px) brightness(${(1-level*.42).toFixed(2)}) saturate(${(1-level*.12).toFixed(2)})`:''}catch(_){ }
    if(level>0){ctx.save();const g=ctx.createRadialGradient(W/2,GROUND_Y*.48,95,W/2,GROUND_Y*.48,W*.72);g.addColorStop(0,`rgba(0,6,18,${.025+level*.08})`);g.addColorStop(1,`rgba(0,0,5,${level*.55})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,typeof H!=='undefined'?H:720);ctx.fillStyle=`rgba(100,205,255,${.045+.045*level})`;ctx.font='900 12px Oxanium,Arial';ctx.textAlign='center';ctx.fillText(`PETROS · CEGUEIRA DO ROUND ${Math.round(level*100)}%`,W/2,118);ctx.restore()}
  }
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const result=baseDraw.apply(this,arguments);try{drawChronicleFx(canvas.getContext('2d'),f)}catch(_){ }return result};
  const baseDrawCanvas=window.drawCanvas;
  if(typeof baseDrawCanvas==='function')window.drawCanvas=function(){try{canvas.style.filter=''}catch(_){ }return baseDrawCanvas.apply(this,arguments)};

  const baseRoundReset=window.resetRoundForNextMatch;
  if(typeof baseRoundReset==='function')window.resetRoundForNextMatch=function(){
    const result=baseRoundReset.apply(this,arguments),f=currentFight();
    if(f?.ravamChronicle){ensureArrays(f);for(const list of [f.chronicleProjectiles,f.chronicleFields,f.chronicleFx,f.chronicleTrails])list.length=0;for(const p of [f.p1,f.p2])if(p?.id==='petros'){p.petrosStack=0;p.petrosBlindness=0;p.petrosUltimateWasPending=false;p.petrosBlindnessFromCine=false;p.petrosBlindnessChargedForCurrentSuper=false}try{canvas.style.filter=''}catch(_){ }}
    return result;
  };

  try{
    const old=window.RavamStudios||{},api={...old,version:VERSION,aurora:LEGENDS[0],kaiDraconis:LEGENDS[1],priyaAranya:LEGENDS[2],nutoa:LEGENDS[3],rifana:LEGENDS[4],petros:LEGENDS[5],r24Abilities:ABILITY};
    delete api.characters;delete api.allCharacters;
    Object.defineProperty(api,'characters',{enumerable:true,get:()=>Array.from(window.RavamV17?.all||old.allCharacters||old.characters||[])});
    Object.defineProperty(api,'allCharacters',{enumerable:true,get:()=>Array.from(window.RavamV17?.all||old.allCharacters||old.characters||[])});
    window.RavamStudios=Object.freeze(api);
  }catch(_){ }
  window.RavamChronicleV24=Object.freeze({version:VERSION,ids:IDS.slice(),characters:LEGENDS.slice(),abilities:ABILITY});
})();
