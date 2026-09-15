/* LUTADOR — Arena Complete 15
 * Camada de combate/progressao: combos, esquiva, stamina, finalizacao no chao,
 * criticos, ultimate cinematografica, identidade Rojo/Thuvaa, selecao avançada,
 * titulos no HUD, recompensas cosmeticas, ranked, pos-luta, IA por dificuldade,
 * arena viva e intro VS.
 */
(()=>{
  'use strict';
  if(window.LutadorComplete?.version)return;
  const KEY='lutador-complete-15-v1';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const now=()=>performance.now();
  const game=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const defaults=()=>({
    aiDifficulty:'normal', rank:{rp:0,wins:0,losses:0,streak:0,best:0},
    cosmetics:{frames:[],entrances:[],skins:[],equippedFrame:'',equippedEntrance:'',equippedSkin:''},
    rankedMatches:0
  });
  let meta=defaults();
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');meta={...defaults(),...raw,rank:{...defaults().rank,...(raw.rank||{})},cosmetics:{...defaults().cosmetics,...(raw.cosmetics||{})}}}catch(_){ }
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(meta))}catch(_){}};

  const DIFF={
    easy:{label:'FÁCIL',dmg:.78,speed:.90,hp:.92,think:.28,color:'#6ee7b7'},
    normal:{label:'NORMAL',dmg:1,speed:1,hp:1,think:.12,color:'#7dd3fc'},
    hard:{label:'DIFÍCIL',dmg:1.08,speed:1.07,hp:1.05,think:.075,color:'#fbbf24'},
    insane:{label:'INSANO',dmg:1.18,speed:1.13,hp:1.10,think:.045,color:'#fb7185'}
  };
  const RANKS=[
    ['FERRO',0,'⬟'],['BRONZE',200,'⬢'],['PRATA',450,'◆'],['OURO',750,'✦'],
    ['PLATINA',1100,'✧'],['DIAMANTE',1500,'◇'],['MESTRE',1950,'♛'],['PRIMORDIAL',2500,'✹']
  ];
  const division=(rp=meta.rank.rp)=>{let out=RANKS[0];for(const r of RANKS)if(rp>=r[1])out=r;return {name:out[0],min:out[1],icon:out[2],next:RANKS[RANKS.indexOf(out)+1]||null}};

  const IDENTITIES={
    rojo:{title:'PRESSÃO RUBRA',desc:'Agressivo e veloz. Combos ampliam sangramento e recuperam fôlego.',damage:86,life:72,speed:95,defense:68,difficulty:2,accent:'#ff3b4f'},
    thuvaa:{title:'CONTROLE GLACIAL',desc:'Defesa alta. Combos congelam, desaceleram e controlam a distância.',damage:78,life:88,speed:72,defense:94,difficulty:3,accent:'#71d7ff'}
  };
  function genericIdentity(c){
    const dmg=clamp(Math.round((Number(c?.dmg||28)-18)*4),45,96), sp=clamp(Math.round(Number(c?.speed||100)*.62),48,96), hp=clamp(Math.round(Number(c?.hp||1200)/17),50,96);
    return {title:'ESTILO ÚNICO',desc:'Campeão versátil com poder próprio, técnicas direcionais e super exclusivo.',damage:dmg,life:hp,speed:sp,defense:clamp(Math.round((hp+dmg)/2),48,94),difficulty:clamp(1+Math.round((dmg+sp)%4),1,5),accent:c?.color||'#7dd3fc'};
  }
  const identity=p=>IDENTITIES[p?.id]||genericIdentity((typeof CHARACTERS!=='undefined'?CHARACTERS:[]).find(c=>c.id===p?.id)||p);

  const PASS_BONUS={
    10:{type:'frame',value:'Moldura Carmesim',icon:'▣'},
    20:{type:'entrance',value:'Fenda Rubra',icon:'✦'},
    30:{type:'vandais',value:'30 Vandais',icon:'🟪'},
    40:{type:'skin',value:'Rojo Ascendente',icon:'◈'},
    50:{type:'frame',value:'Moldura Glacial',icon:'❄'},
    60:{type:'entrance',value:'Tempestade Polar',icon:'✧'},
    70:{type:'skin',value:'Primordial',icon:'♛'}
  };
  function grantPassBonus(tier,quiet=false){
    const b=PASS_BONUS[tier];if(!b||b.type==='vandais')return;
    const key=b.type==='frame'?'frames':b.type==='entrance'?'entrances':'skins';
    if(!meta.cosmetics[key].includes(b.value))meta.cosmetics[key].push(b.value);
    const eq=b.type==='frame'?'equippedFrame':b.type==='entrance'?'equippedEntrance':'equippedSkin';
    if(!meta.cosmetics[eq])meta.cosmetics[eq]=b.value;
    save();
    if(!quiet)toast(`BÔNUS PREMIUM • ${b.value}`,'premium');
  }
  function backfillPassBonuses(){
    const claimed=window.ProProgression?.getSnapshot?.()?.data?.battlePass?.claimed||[];
    Object.keys(PASS_BONUS).forEach(t=>{if(claimed.includes(`premium:${t}`))grantPassBonus(Number(t),true)});
  }

  function toast(text,tone='normal'){
    let host=document.querySelector('.mega-toast-host');if(!host){host=document.createElement('div');host.className='mega-toast-host';document.body.appendChild(host)}
    const el=document.createElement('div');el.className='mega-toast '+tone;el.textContent=text;host.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),240)},1800);
  }

  function title(){return window.ProProgression?.getSnapshot?.()?.profile?.displayTitle||'NOVO DESAFIANTE'}
  function initStats(f){
    if(!f)return;
    if(!f.megaStats)f.megaStats={p1:{damage:0,hits:0,dodges:0,crits:0,ultimates:0,maxCombo:0},p2:{damage:0,hits:0,dodges:0,crits:0,ultimates:0,maxCombo:0},startedAt:Date.now()};
    for(const p of [f.p1,f.p2]){
      if(!p||p.megaInit)continue;p.megaInit=true;
      p.megaSequence=[];p.megaCombo=0;p.megaComboT=0;p.megaDodgeT=0;p.megaDodgeInvuln=0;p.megaDodgeCd=0;p.megaCounterT=0;p.megaSprintT=0;p.megaBleedT=0;p.megaBleedTick=0;p.megaBleedOwner=null;p.megaFreezeSlowT=0;p.megaUltimateBoostT=0;p.megaCriticalT=0;p.megaGroundFinisherT=0;p.megaLastDirTap={};
      if(p.id==='rojo'){p.speed*=1.08;p.megaRojo=true;}
      if(p.id==='thuvaa'){p.megaThuvaa=true;}
    }
  }
  function fightStat(p){const f=game();if(!f||!p)return null;initStats(f);return f.megaStats[p.playerSlot==='p2'?'p2':'p1']}

  function startDodge(p,dir){
    const f=game();if(!f||!p||f.over||f.paused||p.state==='ko'||(p.proKnockdownT||0)>0||p.megaDodgeCd>0)return false;
    const stamina=Number(p.proStamina??100);if(stamina<22){if(p.human)toast('FÔLEGO INSUFICIENTE PARA ESQUIVAR');return false}
    p.proStamina=Math.max(0,stamina-22);p.megaDodgeT=.24;p.megaDodgeInvuln=.18;p.megaDodgeCd=.42;p.defend=false;p.proMove=null;
    const enemy=p===f.p1?f.p2:f.p1;const away=dir||(enemy&&enemy.x>p.x?-1:1);p.vx=away*620;p.state='dodge';p.stateT=0;
    if(typeof spark==='function')spark(p.x,typeof bodyY==='function'?bodyY(p):700,p.color||'#fff',10);
    return true;
  }
  function registerDirectionTap(p,dir){
    if(!p)return;const t=now(),last=p.megaLastDirTap?.[dir]||0;
    p.megaLastDirTap=p.megaLastDirTap||{};
    if(t-last<270 && Number(p.proStamina??100)>=14){p.megaSprintT=.62;p.proStamina=Math.max(0,(p.proStamina??100)-8);if(p.human)toast('CORRIDA TÁTICA','speed')}
    p.megaLastDirTap[dir]=t;
  }

  function normalizeKind(src,type){
    const raw=String(src?.proKind||src?.move?.kind||type||'special').toLowerCase();
    if(raw.includes('punch'))return'punch';if(raw.includes('kick'))return'kick';if(raw.includes('uppercut'))return'uppercut';
    if(['down','forward','diagonal','doubleforward','skyfall','crossrush','corewave','comet','astralrain'].some(k=>raw.includes(k)))return'special';
    if(raw.includes('hazard')||raw.includes('poison')||raw.includes('burn'))return raw;
    return raw==='special'?'special':raw;
  }
  function comboName(seq,p){
    const s=seq.slice(-4).map(x=>x.kind).join('>');
    if(s.endsWith('punch>punch>kick'))return {name:p.id==='rojo'?'CORRENTE RUBRA':'TRINCA BRUTAL',bonus:.28};
    if(s.endsWith('uppercut>kick'))return {name:'GANCHO + FINALIZAÇÃO',bonus:.34};
    if(p.id==='rojo'&&s.endsWith('punch>kick>punch'))return {name:'SANGRIA CARMESIM',bonus:.32,bleed:true};
    if(p.id==='thuvaa'&&s.endsWith('kick>punch>kick'))return {name:'PRISÃO GLACIAL',bonus:.24,freeze:true};
    return null;
  }
  function recordSequence(attacker,victim,kind,dealt){
    if(!attacker||!victim||dealt<=0||['hazard','poison','burn','bleed'].includes(kind))return;
    const t=now();attacker.megaSequence=(attacker.megaSequence||[]).filter(x=>t-x.t<1100);attacker.megaSequence.push({kind,t});attacker.megaSequence=attacker.megaSequence.slice(-5);
    attacker.megaCombo=(attacker.megaComboT>0?(attacker.megaCombo||0):0)+1;attacker.megaComboT=1.2;
    const st=fightStat(attacker);if(st){st.hits++;st.damage+=dealt;st.maxCombo=Math.max(st.maxCombo,attacker.megaCombo)}
    const combo=comboName(attacker.megaSequence,attacker);
    if(combo && attacker.megaLastComboAt!==t){
      attacker.megaLastComboAt=t;attacker.megaComboName=combo.name;attacker.megaComboLabelT=1.25;
      const bonus=Math.max(4,dealt*combo.bonus);victim.hp=Math.max(0,victim.hp-bonus);
      const st2=fightStat(attacker);if(st2)st2.damage+=bonus;
      if(combo.bleed||attacker.id==='rojo'){victim.megaBleedT=Math.max(victim.megaBleedT||0,2.4);victim.megaBleedTick=.45;victim.megaBleedOwner=attacker}
      if(combo.freeze||attacker.id==='thuvaa'){victim.freezeT=Math.max(victim.freezeT||0,.58);victim.megaFreezeSlowT=2.2}
      impactFX(attacker,victim,'COMBO · '+combo.name,true);toast(`${attacker.name} • ${combo.name}`,'combo');
      if(victim.hp<=0&&victim.state!=='ko'&&typeof endRound==='function'){victim.hp=0;victim.state='ko';endRound(game(),attacker,victim)}
    }
  }

  function impactFX(attacker,victim,label,heavy=false){
    const f=game();if(!f)return;f.megaHitStop=Math.max(f.megaHitStop||0,heavy?.055:.025);f.megaImpactLabel=label;f.megaImpactLabelT=heavy?.55:.32;
    if(typeof spark==='function')spark(victim.x,typeof bodyY==='function'?bodyY(victim):700,heavy?'#fff3a8':attacker?.color||'#fff',heavy?26:12);
    const cv=typeof canvas!=='undefined'?canvas:null;if(cv){cv.classList.remove('mega-impact-pulse');void cv.offsetWidth;cv.classList.add('mega-impact-pulse');setTimeout(()=>cv.classList.remove('mega-impact-pulse'),180)}
  }

  const oldDamage=window.damage;
  if(typeof oldDamage==='function')window.damage=function(victim,amount,src,dir,type){
    const f=game(),attacker=src?.owner||(src?.id&&src!==victim?src:null);if(f)initStats(f);
    if(victim?.megaDodgeInvuln>0 && attacker && attacker!==victim){
      victim.megaDodgeInvuln=0;victim.megaCounterT=.62;victim.megaCounterTarget=attacker;attacker.attackDisabledT=Math.max(attacker.attackDisabledT||0,.16);
      const st=fightStat(victim);if(st)st.dodges++;
      impactFX(victim,attacker,'ESQUIVA PERFEITA · CONTRA-ATAQUE',true);toast('ESQUIVA PERFEITA! CONTRA-ATAQUE ABERTO','counter');return;
    }
    let a=Number(amount)||0;const kind=normalizeKind(src,type);const grounded=!!(victim?.proKnockdownT>0&&victim?.onGround);
    if(grounded&&kind==='kick'){a*=1.72;if(attacker){attacker.megaGroundFinisherT=.55;attacker.megaComboName='FINALIZAÇÃO NO CHÃO';attacker.megaComboLabelT=.95}impactFX(attacker,victim,'CHUTE DE FINALIZAÇÃO',true)}
    if(victim?.id==='thuvaa'&&!grounded)a*=.90;
    let critical=false,counter=false;
    if(attacker?.megaCounterT>0){a*=1.32;critical=counter=true;attacker.megaCounterT=0;}
    const heavy=['kick','uppercut','special','sword','hammer','ray','lightning'].some(k=>kind.includes(k));
    if(attacker&&heavy&&Math.random()<(attacker.id==='rojo'?.17:.12)){a*=1.26;critical=true;}
    if(attacker?.megaUltimateBoostT>0 && !['punch','kick','uppercut'].includes(kind)){a*=attacker.id==='rojo'?1.24:attacker.id==='thuvaa'?1.18:1.15;}
    const before=victim?.hp;const result=oldDamage.call(this,victim,a,src,dir,type);const dealt=Math.max(0,(before||0)-(victim?.hp||0));
    if(dealt>0&&attacker&&attacker!==victim){
      recordSequence(attacker,victim,kind,dealt);
      if(critical){const st=fightStat(attacker);if(st)st.crits++;impactFX(attacker,victim,counter?'CONTRA-ATAQUE CRÍTICO':'ACERTO CRÍTICO',true)}
      if(attacker.id==='rojo' && !grounded && Math.random()<.30 && kind!=='bleed'){victim.megaBleedT=Math.max(victim.megaBleedT||0,1.8);victim.megaBleedTick=.5;victim.megaBleedOwner=attacker}
      if(attacker.id==='thuvaa' && attacker.megaUltimateBoostT>0){victim.freezeT=Math.max(victim.freezeT||0,.72);victim.megaFreezeSlowT=2.5}
    }
    return result;
  };

  function showUltimate(p){
    if(!p||p.megaUltimateCineLock)return false;
    p.megaUltimateCineLock=true;
    const f=game();
    if(f){initStats(f);const st=fightStat(p);if(st)st.ultimates++;f.megaHitStop=Math.max(f.megaHitStop||0,.94);f.v6UltimateOwner=p;}
    const ULTIMATE_NAMES={
      rojo:['CARMESIM','EXECUÇÃO RUBRA'],thuvaa:['INVERNO PRIMORDIAL','ZERO ABSOLUTO'],
      ztaaa:['DOMÍNIO ABSOLUTO','FIM DE TODAS AS FORMAS'],knunka:['CAÇADA AZUL','RAIO DO ABISMO'],
      nine85:['CÓDIGO ZERO','FALHA TERMINAL'],uiye:['TRONO DE PEDRA','ESPELHO TITÂNICO'],
      rtess:['POLARIDADE ÔMEGA','COLAPSO MAGNÉTICO'],atizz:['CORTE CORROMPIDO','FRATURA DO TEMPO'],
      grizz:['FÚRIA URSINA','MURALHA DO ALFA'],ouip:['CÉU CORROSIVO','EXTINÇÃO ÁCIDA'],
      jetde:['PRISMA DE BOLHA','RETORNO ABSOLUTO'],xillen:['RUÍNA ESTELAR','TEMPESTADE ALIEN'],
      ytiri:['NÉVOA ESPECTRAL','CORRENTES DO VAZIO'],lkugh:['ECLIPSE LUNAR','BURACO NEGRO'],
      grogh:['REFLEXO TITÂNICO','RETORNO COLOSSAL'],dart:['QUATRO ELEMENTOS','CAOS PRIMORDIAL'],
      trefoh:['JARDIM ARCANO','FLORA SUPREMA'],yoi:['ECLIPSE IMPERIAL','NOITE SEM FIM'],
      flame:['INFERNO CARMESIM','MURALHA DO SOL'],perry:['TEMPESTADE VERDE','QUEDA DAS TRÊS ÁRVORES'],
      verry:['PÂNTANO SOBERANO','MUNDO DE LAMA'],hock:['QUEBRA-LUAS','CHUVA LUNAR'],
      vlad:['BANQUETE RUBRO','ECLIPSE DE SANGUE'],klo:['CIRCO QUÂNTICO','PROBABILIDADE ZERO'],
      klopp:['ROSTO DO CAOS','FORMA IMPOSSÍVEL'],frogh:['MUTAÇÃO SUPREMA','MIL FACES'],
      jimmy:['TRONO DO TROVÃO','JULGAMENTO CELESTE'],
      priya:['TRÍADE TÁTICA','TRÍADE DEMOLIDORA']
    };
    const names=ULTIMATE_NAMES[p.id]||[String(p.name||'CAMPEÃO').toUpperCase(),'ULTIMATE SUPREMA'];
    const el=document.createElement('div');el.className='mega-ultimate-cine '+(p.playerSlot==='p2'?'right':'left');
    el.innerHTML=`<img src="ai-assets/characters/${p.id}.png" alt="${p.name}" onerror="this.style.opacity=.12;this.removeAttribute('src')"><div><small>ULTIMATE CINEMATOGRÁFICA</small><h1>${names[0]}</h1><h2>${names[1]}</h2><span>${p.name}</span><em>O GOLPE SÓ É LIBERADO QUANDO ESTA TELA TERMINAR</em></div>`;
    document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),180);p.megaUltimateCineLock=false;p.megaUltimateCineDone=true;},820);
    impactFX(p,p,'ULTIMATE',true);
    return true;
  }

  const oldPlayerInput=window.playerInput;
  if(typeof oldPlayerInput==='function')window.playerInput=function(p){
    const f=game();if(f)initStats(f);if(!p)return oldPlayerInput?.apply(this,arguments);
    const second=p.playerSlot==='p2',dodge=second?'Numpad0':'KeyQ',superKey=second?'Numpad3':'KeyL';
    if(window.justPressed?.[dodge]){window.justPressed[dodge]=false;if(startDodge(p))return;}

    // A Ultimate agora tem duas etapas: apresentação -> execução. O comando é consumido
    // antes do motor original para impedir que o dano saia por baixo da cinematográfica.
    if(p.megaUltimatePending){
      window.justPressed[superKey]=false;
      p.vx=0;p.defend=false;
      if(p.megaUltimateCineDone){
        // A cinematica usa hit-stop. Durante esse freeze, attackDisabledT nao cai,
        // entao o motor antigo bloqueava o SUPER mesmo com stamina/barra cheias.
        // Ao terminar a tela, liberamos explicitamente a execucao do golpe.
        p.megaUltimatePending=false;p.megaUltimateCineDone=false;p.megaUltimateBypass=true;
        p.megaUltimateBoostT=1.6;
        p.attackDisabledT=0;
        p.specialCd=0;
        p.defend=false;
        window.justPressed[superKey]=true;
      }else return;
    }else if(window.justPressed?.[superKey]&&p.superReady&&!p.superDisabled&&!p.megaUltimateBypass){
      window.justPressed[superKey]=false;
      if(p.proStamina!==undefined&&p.proStamina<28){toast('ULTIMATE EXIGE 28 DE STAMINA','danger');return;}
      if(p.proStamina!==undefined)p.proStamina=Math.max(0,p.proStamina-28);
      p.megaUltimatePending=true;p.megaUltimateCineDone=false;p.attackDisabledT=Math.max(p.attackDisabledT||0,1.05);p.vx=0;p.defend=false;
      if(!showUltimate(p)){p.megaUltimatePending=false;}
      return;
    }

    const bypass=!!p.megaUltimateBypass;
    if(p.megaDodgeT>0){p.defend=false;return;}
    const r=oldPlayerInput.apply(this,arguments);
    if(bypass)p.megaUltimateBypass=false;
    if(p.megaSprintT>0&&Math.abs(p.vx)>5){p.vx*=1.48;p.proStamina=Math.max(0,(p.proStamina??100)-(.48*(window.__fightDt||.016)*30));if((p.proStamina??0)<3)p.megaSprintT=0;}
    if(p.defend){const drain=(window.__fightDt||.016)*13;p.proStamina=Math.max(0,(p.proStamina??100)-drain);if(p.proStamina<=1){p.defend=false;p.guardBroken=true;toast('GUARDA QUEBRADA · SEM FÔLEGO','danger');}}
    return r;
  };

  const oldAi=window.aiInput;
  if(typeof oldAi==='function')window.aiInput=function(p,f,dt){
    initStats(f);const diff=DIFF[f?.megaAiDifficulty||meta.aiDifficulty]||DIFF.normal,enemy=p===f?.p1?f?.p2:f?.p1;
    if(!p||!enemy)return oldAi.apply(this,arguments);
    if((enemy.proKnockdownT||0)>0&&enemy.onGround&&Math.abs(enemy.x-p.x)<155&&window.ProCombat?.begin?.(p,'kick',f))return;
    if(['hard','insane'].includes(f.megaAiDifficulty||meta.aiDifficulty) && p.megaDodgeCd<=0 && enemy.proMove && Math.abs(enemy.x-p.x)<175 && Math.random()<dt*(diff===DIFF.insane?7:4)){if(startDodge(p,enemy.x>p.x?-1:1))return;}
    if((f.megaAiDifficulty||meta.aiDifficulty)==='easy'&&Math.random()<dt*4.8){p.vx=0;p.defend=false;return;}
    if(['hard','insane'].includes(f.megaAiDifficulty||meta.aiDifficulty)&&Math.abs(enemy.x-p.x)<125&&Math.random()<dt*(diff===DIFF.insane?2.6:1.4)){if(window.ProCombat?.begin?.(p,'uppercut',f))return;}
    const r=oldAi.apply(this,arguments);
    if(p.megaSprintT>0&&Math.abs(p.vx)>5)p.vx*=1.35;
    return r;
  };

  const oldUpdate=window.update;
  if(typeof oldUpdate==='function')window.update=function(f,dt){
    if(!f)return oldUpdate.apply(this,arguments);initStats(f);
    if((f.megaHitStop||0)>0){f.megaHitStop=Math.max(0,f.megaHitStop-dt);f.megaImpactLabelT=Math.max(0,(f.megaImpactLabelT||0)-dt);return;}
    const result=oldUpdate.call(this,f,dt);
    for(const p of [f.p1,f.p2]){
      p.megaComboT=Math.max(0,(p.megaComboT||0)-dt);if(p.megaComboT<=0)p.megaCombo=0;
      p.megaComboLabelT=Math.max(0,(p.megaComboLabelT||0)-dt);p.megaDodgeT=Math.max(0,(p.megaDodgeT||0)-dt);p.megaDodgeInvuln=Math.max(0,(p.megaDodgeInvuln||0)-dt);p.megaDodgeCd=Math.max(0,(p.megaDodgeCd||0)-dt);p.megaCounterT=Math.max(0,(p.megaCounterT||0)-dt);p.megaSprintT=Math.max(0,(p.megaSprintT||0)-dt);p.megaUltimateBoostT=Math.max(0,(p.megaUltimateBoostT||0)-dt);p.megaGroundFinisherT=Math.max(0,(p.megaGroundFinisherT||0)-dt);p.megaFreezeSlowT=Math.max(0,(p.megaFreezeSlowT||0)-dt);
      if(p.megaDodgeT>0){p.state='dodge';p.defend=false;}
      if(p.megaFreezeSlowT>0&&Math.abs(p.vx)>0)p.vx*=.62;
      if(p.id==='rojo'&&p.proStamina!==undefined)p.proStamina=clamp(p.proStamina+7*dt,0,100);
      if((p.megaBleedT||0)>0){p.megaBleedT=Math.max(0,p.megaBleedT-dt);if(!(p.proKnockdownT>0&&p.onGround)){p.megaBleedTick-=dt;if(p.megaBleedTick<=0&&p.state!=='ko'){p.megaBleedTick=.52;const own=p.megaBleedOwner;if(own&&own!==p){const tick=Math.max(2,(own.dmg||30)*.07);p.hp=Math.max(0,p.hp-tick);const st=fightStat(own);if(st)st.damage+=tick;if(typeof spark==='function')spark(p.x,typeof bodyY==='function'?bodyY(p):700,'#ff304f',5);if(p.hp<=0&&typeof endRound==='function')endRound(f,own,p)}}}}
    }
    f.megaImpactLabelT=Math.max(0,(f.megaImpactLabelT||0)-dt);
    return result;
  };

  function drawArenaLife(ctx,f){
    const t=performance.now()/1000,quality=window.LutadorUltimate?.data?.settings?.graphics||'balanced';ctx.save();
    const performanceMode=quality==='performance',balanced=quality==='balanced';
    // holofotes: quantidade menor em modos de desempenho para preservar FPS.
    if(!performanceMode){
      ctx.globalCompositeOperation='screen';ctx.globalAlpha=.07;
      const lights=balanced?2:4;
      for(let i=0;i<lights;i++){const step=balanced?720:410,x=180+i*step+Math.sin(t*.55+i)*90;const g=ctx.createLinearGradient(x,80,x+Math.sin(t+i)*160,820);g.addColorStop(0,f.stage?.accent||'#fff');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-45,40);ctx.lineTo(x+45,40);ctx.lineTo(x+190,850);ctx.lineTo(x-190,850);ctx.closePath();ctx.fill()}
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.52;ctx.fillStyle='#070913';
    // público
    const crowd=performanceMode?24:(balanced?36:54),crowdStep=W/Math.max(1,crowd-1);
    for(let i=0;i<crowd;i++){const x=i*crowdStep+(i%2)*5,y=944+(i%4)*9;ctx.beginPath();ctx.arc(x,y-24-(i%3)*4,8,0,Math.PI*2);ctx.fill();ctx.fillRect(x-6,y-18,12,30)}
    // bandeiras
    const flags=performanceMode?3:(balanced?5:7),flagStep=W/flags;
    for(let i=0;i<flags;i++){const x=65+i*flagStep,base=952;ctx.strokeStyle='#232941';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,base-85);ctx.stroke();ctx.fillStyle=i%2?(f.p1.color||'#e63946'):(f.p2.color||'#67e8f9');ctx.beginPath();ctx.moveTo(x,base-84);ctx.lineTo(x+45+Math.sin(t*3+i)*8,base-72);ctx.lineTo(x,base-50);ctx.closePath();ctx.fill()}
    if(f.over||f.matchOver){ctx.globalAlpha=.8;const confetti=performanceMode?12:(balanced?24:44);for(let i=0;i<confetti;i++){const xx=(i*137+t*120*(1+i%3))%W,yy=(i*83+t*170*(1+i%2))%760;ctx.save();ctx.translate(xx,yy);ctx.rotate(t*3+i);ctx.fillStyle=i%3===0?'#f7d46a':i%3===1?(f.p1.color||'#ef334d'):(f.p2.color||'#67e8f9');ctx.fillRect(-3,-8,6,16);ctx.restore()}}
    ctx.restore();
  }
  function drawOverlay(ctx,f){
    const st1=f.megaStats?.p1,st2=f.megaStats?.p2;const equipTitle=title();ctx.save();
    drawArenaLife(ctx,f);
    for(const p of [f.p1,f.p2]){
      const left=p===f.p1,x=left?48:W-48;ctx.textAlign=left?'left':'right';
      if(p.megaCombo>1&&p.megaComboT>0){ctx.font='900 34px system-ui';ctx.fillStyle=p.color||'#fff';ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillText(`${p.megaCombo}x COMBO`,x,215)}
      if(p.megaComboLabelT>0){ctx.font='800 17px system-ui';ctx.fillStyle='#fff4b5';ctx.fillText(p.megaComboName||'COMBO',x,241)}
      if(p.megaCounterT>0){ctx.font='800 16px system-ui';ctx.fillStyle='#74f7d1';ctx.fillText('CONTRA-ATAQUE!',x,266)}
      if(p.megaDodgeT>0){ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=p.color||'#fff';ctx.lineWidth=7;for(let j=1;j<=3;j++){ctx.beginPath();ctx.moveTo(p.x-p.facing*j*28,GROUND_Y-p.y-135);ctx.lineTo(p.x-p.facing*j*44,GROUND_Y-p.y-34);ctx.stroke()}ctx.restore()}
      if(p.megaGroundFinisherT>0){ctx.save();ctx.translate(p.x,GROUND_Y-p.y-15);ctx.scale(p.facing||1,1);ctx.strokeStyle='#ffd56a';ctx.shadowColor='#ef334d';ctx.shadowBlur=18;ctx.lineWidth=8;ctx.beginPath();ctx.arc(38,-28,72,-1.8,.2);ctx.stroke();ctx.restore()}
      // stamina dedicada e estado
      const bw=280,bx=left?48:W-48-bw,by=150;ctx.globalAlpha=.92;ctx.fillStyle='rgba(5,8,18,.8)';ctx.fillRect(bx,by,bw,13);ctx.fillStyle=(p.proStamina??100)<25?'#ff8c69':'#58e3bd';ctx.fillRect(bx,by,bw*clamp((p.proStamina??100)/100,0,1),13);ctx.strokeStyle='#ffffff26';ctx.strokeRect(bx,by,bw,13);ctx.font='700 11px system-ui';ctx.fillStyle='#dbeafe';ctx.textAlign=left?'left':'right';ctx.fillText('STAMINA',left?bx:bx+bw,by-5);
    }
    ctx.textAlign='left';ctx.font='700 13px system-ui';ctx.fillStyle='#f8d777';ctx.fillText(equipTitle,42,117);
    if(f.megaImpactLabelT>0){ctx.textAlign='center';ctx.font='900 31px system-ui';ctx.fillStyle='#fff2ae';ctx.shadowColor='#ef4444';ctx.shadowBlur=18;ctx.fillText(f.megaImpactLabel,W/2,330);}
    if(f.p1?.id==='rojo'&&f.p1.megaBleedT>0){ctx.fillStyle='#ff3150';ctx.font='700 12px system-ui';ctx.textAlign='left';ctx.fillText('SANGRAMENTO ATIVO',48,292)}
    ctx.restore();
  }
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){const r=oldDraw.apply(this,arguments);if(f)drawOverlay(canvas.getContext('2d'),f);return r};

  function showVsIntro(f){
    if(!f||f.megaVsShown)return;f.megaVsShown=true;f.paused=true;const t=title(),entry=meta.cosmetics.equippedEntrance||'';
    const el=document.createElement('div');el.className='mega-vs '+(entry.includes('Polar')?'polar':entry.includes('Rubra')?'rubra':'');
    el.innerHTML=`<div class="mega-vs-side p1"><img src="ai-assets/characters/${f.p1.id}.png" alt="${f.p1.name}" onerror="this.style.opacity=.12;this.removeAttribute(\'src\')"><small>${t}</small><h2>${f.p1.name}</h2><span>${identity(f.p1).title}</span></div><div class="mega-vs-center"><b>VS</b><i>${f.mode==='ranked'?'RANKED · '+division().name:'ARENA'}</i></div><div class="mega-vs-side p2"><img src="ai-assets/characters/${f.p2.id}.png" alt="${f.p2.name}" onerror="this.style.opacity=.12;this.removeAttribute(\'src\')"><small>${(f.p2.human?'RIVAL LOCAL':(DIFF[f.megaAiDifficulty]?.label||'CPU'))}</small><h2>${f.p2.name}</h2><span>${identity(f.p2).title}</span></div>`;
    document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),340);if(game()===f){f.paused=false;f.lastTime=performance.now()}},1450);
  }

  function applyDifficulty(f){
    if(!f||f.p2?.human)return;let d=meta.aiDifficulty;if(f.mode==='ranked'){const rp=meta.rank.rp;d=rp>=1500?'insane':rp>=750?'hard':'normal'}f.megaAiDifficulty=d;const spec=DIFF[d]||DIFF.normal;
    if(!f.p2.megaDifficultyApplied){f.p2.megaDifficultyApplied=true;f.p2.dmg*=spec.dmg;f.p2.speed*=spec.speed;const ratio=f.p2.hp/f.p2.maxHp;f.p2.maxHp=Math.round(f.p2.maxHp*spec.hp);f.p2.hp=Math.round(f.p2.maxHp*ratio)}
  }
  let rankedPending=false;
  function prepareFight(f){
    if(!f||f.megaCompletePrepared)return f;
    f.megaCompletePrepared=true;
    initStats(f);
    applyDifficulty(f);
    f.megaRankStartRp=meta.rank.rp;
    if(meta.cosmetics.equippedSkin&&f.p1)f.p1.megaEquippedSkin=meta.cosmetics.equippedSkin;
    showVsIntro(f);
    return f;
  }
  const oldStartFight=window.startFight;
  if(typeof oldStartFight==='function')window.startFight=function(playerId,mode='cpu',player2Id=null,stageId=null,chaosPenalties=null){
    if(rankedPending&&mode==='cpu'){mode='ranked';rankedPending=false}
    const r=oldStartFight.call(this,playerId,mode,player2Id,stageId,chaosPenalties);
    prepareFight(game());
    return r;
  };

  const oldReset=window.resetRoundForNextMatch;
  if(typeof oldReset==='function')window.resetRoundForNextMatch=function(){const r=oldReset.apply(this,arguments),f=game();if(f){for(const p of[f.p1,f.p2]){p.megaSequence=[];p.megaCombo=0;p.megaComboT=0;p.megaDodgeT=0;p.megaDodgeInvuln=0;p.megaCounterT=0;p.megaBleedT=0;p.megaUltimateBoostT=0;}f.megaHitStop=0;}return r};

  function settleRanked(f,won){
    if(!f||f.mode!=='ranked'||f.megaRankSettled)return 0;f.megaRankSettled=true;meta.rankedMatches++;
    const before=meta.rank.rp;let delta=won?(26+Math.min(8,meta.rank.streak*2)):-18;
    if(won){meta.rank.wins++;meta.rank.streak++;}else{meta.rank.losses++;meta.rank.streak=0;}meta.rank.rp=Math.max(0,meta.rank.rp+delta);meta.rank.best=Math.max(meta.rank.best,meta.rank.rp);save();return meta.rank.rp-before;
  }
  const oldResult=window.showMatchResult;
  if(typeof oldResult==='function')window.showMatchResult=function(playerWon,options={}){
    const f=game();if(f&&f.megaResultEnhanced)return oldResult.apply(this,arguments);if(f)f.megaResultEnhanced=true;
    const rankDelta=f?settleRanked(f,!!playerWon):0;
    if(f&&!f.megaPerformanceXp){f.megaPerformanceXp=true;const s=f.megaStats?.p1||{},xp=Math.min(160,40+(s.hits||0)*3+(s.maxCombo||0)*5+(playerWon?30:0));window.ProProgression?.addXp?.(xp,{source:'DESEMPENHO DE COMBATE',passAmount:Math.round(xp*.45),silent:true});f.megaPerformanceXpValue=xp;}
    const r=oldResult.call(this,playerWon,options);setTimeout(()=>{
      const card=document.querySelector('#match-result-overlay .match-result-card');if(!card||card.querySelector('.mega-result-stats')||!f)return;const s=f.megaStats?.p1||{};
      const rank=division();const box=document.createElement('section');box.className='mega-result-stats';box.innerHTML=`<div><span>DANO CAUSADO</span><b>${Math.round(s.damage||0)}</b></div><div><span>MAIOR COMBO</span><b>${s.maxCombo||0}x</b></div><div><span>GOLPES</span><b>${s.hits||0}</b></div><div><span>ESQUIVAS</span><b>${s.dodges||0}</b></div><div><span>CRÍTICOS</span><b>${s.crits||0}</b></div><div><span>ULTIMATES</span><b>${s.ultimates||0}</b></div><footer>+${f.megaPerformanceXpValue||0} XP DE DESEMPENHO ${f.mode==='ranked'?`· ${rankDelta>=0?'+':''}${rankDelta} RP · ${rank.icon} ${rank.name}`:''}</footer>`;
      card.querySelector('.match-result-actions')?.before(box);
    },0);return r;
  };

  function barsHtml(info){return `<div class="mega-char-bars">${[['DANO',info.damage],['VIDA',info.life],['VELOCIDADE',info.speed],['DEFESA',info.defense]].map(([n,v])=>`<div><span>${n}</span><i><b style="width:${v}%"></b></i><em>${v}</em></div>`).join('')}<div class="mega-diff"><span>DIFICULDADE</span><b>${'◆'.repeat(info.difficulty)}${'◇'.repeat(5-info.difficulty)}</b></div></div>`}
  function enhanceSelection(){
    document.querySelectorAll('.mk-fighter[data-id]').forEach(card=>{if(card.querySelector('.mega-card-identity'))return;const c=(typeof CHARACTERS!=='undefined'?CHARACTERS:[]).find(x=>x.id===card.dataset.id),inf=IDENTITIES[card.dataset.id]||genericIdentity(c);const e=document.createElement('div');e.className='mega-card-identity';e.innerHTML=`<b>${inf.title}</b><span>${inf.desc}</span>${barsHtml(inf)}`;card.querySelector('.mk-body')?.insertBefore(e,card.querySelector('.pick,.mk-lock'));});
    const detail=document.getElementById('mk-detail');if(detail&&!detail.dataset.megaDetail){detail.dataset.megaDetail='1';const active=document.querySelector('.mk-fighter[data-id]')?.dataset.id,c=(typeof CHARACTERS!=='undefined'?CHARACTERS:[]).find(x=>x.id===active),inf=IDENTITIES[active]||genericIdentity(c);detail.insertAdjacentHTML('beforeend',`<div class="mega-detail-style"><small>IDENTIDADE DE COMBATE</small><strong>${inf.title}</strong><p>${inf.desc}</p>${barsHtml(inf)}</div>`)}
  }
  const oldSelect=window.renderSelect;
  if(typeof oldSelect==='function')window.renderSelect=function(mode){
    if(mode==='ranked'){rankedPending=true;const args=[...arguments];args[0]='cpu';const r=oldSelect.apply(this,args);setTimeout(enhanceSelection,0);return r;}
    const r=oldSelect.apply(this,arguments);setTimeout(enhanceSelection,0);return r;
  };
  const oldCharDetail=window.renderCharacterDetail;
  if(typeof oldCharDetail==='function')window.renderCharacterDetail=function(id){const r=oldCharDetail.apply(this,arguments);setTimeout(()=>{const el=document.getElementById('mk-detail'),c=(typeof CHARACTERS!=='undefined'?CHARACTERS:[]).find(x=>x.id===id),inf=IDENTITIES[id]||genericIdentity(c);if(el&&!el.querySelector('.mega-detail-style'))el.insertAdjacentHTML('beforeend',`<div class="mega-detail-style"><small>IDENTIDADE DE COMBATE</small><strong>${inf.title}</strong><p>${inf.desc}</p>${barsHtml(inf)}</div>`)},0);return r};

  function difficultyPanel(){
    const host=document.querySelector('.modes-screen .mode-grid');if(!host||document.querySelector('.mega-difficulty'))return;
    const panel=document.createElement('section');panel.className='mega-difficulty';panel.innerHTML=`<header><b>IA · DIFICULDADE</b><span>A dificuldade altera agressividade, defesa, esquiva e atributos da CPU.</span></header><div>${Object.entries(DIFF).map(([k,v])=>`<button data-ai="${k}" class="${meta.aiDifficulty===k?'active':''}"><i style="background:${v.color}"></i>${v.label}</button>`).join('')}</div>`;host.after(panel);panel.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{meta.aiDifficulty=b.dataset.ai;save();panel.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));toast('IA: '+DIFF[meta.aiDifficulty].label)});
  }
  const oldModes=window.renderModes;
  if(typeof oldModes==='function')window.renderModes=function(){rankedPending=false;const r=oldModes.apply(this,arguments);const grid=document.querySelector('.mode-grid');if(grid&&!document.getElementById('mode-ranked')){const d=division();const b=document.createElement('button');b.id='mode-ranked';b.className='mode-card mk-mode mega-ranked-mode';b.innerHTML=`<div class="mode-icon">♛</div><span class="mode-badge">${d.icon} ${d.name}</span><h3>RANKED <span class="mk-gold">${meta.rank.rp} RP</span></h3><p>Suba de Ferro até Primordial. Vitória dá RP; derrota remove RP.</p>`;grid.insertBefore(b,grid.firstChild);b.onclick=()=>{rankedPending=true;SFX?.play?.('menu_confirm');renderSelect('cpu')}}difficultyPanel();return r};

  const oldRank=window.renderRanking;
  if(typeof oldRank==='function')window.renderRanking=function(){const r=oldRank.apply(this,arguments);setTimeout(()=>{const card=document.querySelector('.card'),d=division(),next=d.next;if(!card||card.querySelector('.mega-rank-panel'))return;const p=document.createElement('section');p.className='mega-rank-panel';const pct=next?clamp((meta.rank.rp-d.min)/(next[1]-d.min)*100,0,100):100;p.innerHTML=`<div class="mega-rank-emblem">${d.icon}</div><div><small>RANKED ARENA</small><h3>${d.name}</h3><b>${meta.rank.rp} RP</b><div class="mega-rank-progress"><i style="width:${pct}%"></i></div><span>${next?`${next[1]-meta.rank.rp} RP para ${next[0]}`:'RANK MÁXIMO ALCANÇADO'}</span></div><div class="mega-rank-record"><b>${meta.rank.wins}</b><span>VITÓRIAS</span><b>${meta.rank.losses}</b><span>DERROTAS</span><b>${meta.rank.best}</b><span>MELHOR RP</span></div>`;card.querySelector('.select-subtitle')?.after(p)},0);return r};

  function openCollection(){
    let d=document.querySelector('#mega-collection');if(!d){d=document.createElement('dialog');d.id='mega-collection';d.className='mega-collection';document.body.appendChild(d)}
    const opts=(arr,eq,key)=>arr.length?arr.map(v=>`<button data-equip="${key}" data-value="${v}" class="${eq===v?'active':''}">${v}</button>`).join(''):'<span class="empty">Nenhum item desbloqueado no Passe Premium.</span>';
    d.innerHTML=`<form method="dialog"><header><div><small>COLEÇÃO DO PASSE</small><h2>COSMÉTICOS EQUIPÁVEIS</h2></div><button class="mega-close">×</button></header><section><h3>MOLDURAS</h3><div class="mega-cos-grid">${opts(meta.cosmetics.frames,meta.cosmetics.equippedFrame,'frame')}</div></section><section><h3>EFEITOS DE ENTRADA</h3><div class="mega-cos-grid">${opts(meta.cosmetics.entrances,meta.cosmetics.equippedEntrance,'entrance')}</div></section><section><h3>SKINS / AURAS</h3><div class="mega-cos-grid">${opts(meta.cosmetics.skins,meta.cosmetics.equippedSkin,'skin')}</div></section><footer>Itens especiais são liberados nos patamares Premium 10, 20, 40, 50, 60 e 70.</footer></form>`;
    d.querySelectorAll('[data-equip]').forEach(b=>b.onclick=e=>{e.preventDefault();const map={frame:'equippedFrame',entrance:'equippedEntrance',skin:'equippedSkin'};meta.cosmetics[map[b.dataset.equip]]=b.dataset.value;save();toast('EQUIPADO • '+b.dataset.value,'premium');d.close();setTimeout(openCollection,0)});if(!d.open)d.showModal();
  }
  function injectLobbyCollection(){const actions=document.querySelector('.lobby-actions');if(actions&&!document.getElementById('mega-collection-btn')){const b=document.createElement('button');b.id='mega-collection-btn';b.className='btn';b.textContent='🎨 COLEÇÃO';b.onclick=openCollection;actions.appendChild(b)}const profile=document.querySelector('.pro-profile-card,.pro-profile');if(profile){profile.classList.toggle('mega-frame-carmim',meta.cosmetics.equippedFrame.includes('Carmesim'));profile.classList.toggle('mega-frame-gelo',meta.cosmetics.equippedFrame.includes('Glacial'))}}

  function enhancePass(){
    document.querySelectorAll('.pp-tier-card').forEach(card=>{const m=card.getAttribute('aria-label')?.match(/(\d+)/);if(!m)return;const tier=Number(m[1]),b=PASS_BONUS[tier];if(!b||card.querySelector('.mega-pass-bonus'))return;const premium=card.querySelector('.pro-track.premium');if(premium){const x=document.createElement('span');x.className='mega-pass-bonus';x.textContent=`${b.icon} BÔNUS: ${b.value}`;premium.appendChild(x)}});
  }
  window.addEventListener('lutador:progression',e=>{const d=e.detail||{};if(d.kind==='reward'&&d.track==='premium')grantPassBonus(Number(d.tier));setTimeout(()=>{enhancePass();injectLobbyCollection()},30)});

  document.addEventListener('keydown',e=>{
    const f=game();if(!f||f.paused||f.over||e.repeat)return;
    const map={KeyA:['p1','left'],KeyD:['p1','right'],ArrowLeft:['p2','left'],ArrowRight:['p2','right']};const ent=map[e.code];if(ent){const p=ent[0]==='p1'?f.p1:f.p2;if(p?.human)registerDirectionTap(p,ent[1])}
    if(e.code==='KeyQ'||e.code==='Numpad0')e.preventDefault();
  },true);

  // Atualiza guia de comandos criado pelo sistema de combate.
  const obs=new MutationObserver(()=>{
    enhanceSelection();enhancePass();injectLobbyCollection();
    const guide=document.querySelector('.pro-combat-guide[open] .pro-move-table');if(guide&&!guide.querySelector('[data-mega-controls]')){const x=document.createElement('span');x.dataset.megaControls='1';x.textContent='Esquiva / contra';guide.append(x);const a=document.createElement('kbd');a.textContent='Q';guide.append(a);const b=document.createElement('kbd');b.textContent='Num 0';guide.append(b);guide.insertAdjacentHTML('beforeend','<span>Corrida tática</span><kbd>A/A ou D/D</kbd><kbd>←/← ou →/→</kbd><span>Finalização no chão</span><kbd>O no inimigo caído</kbd><kbd>Num 6 no inimigo caído</kbd>')}
    const controls=document.querySelector('.control-box');if(controls&&screen==='menu'&&!controls.dataset.mega){controls.dataset.mega='1';controls.innerHTML='<b>P1:</b> A/D mover · A/A ou D/D correr · W pular · <b>Q esquiva</b> · J poder · I soco · O chute · G gancho · K defesa · L ultimate<br><b>P2:</b> SETAS · duplo toque corre · <b>Num 0 esquiva</b> · Num 1 poder · Num 5 soco · Num 6 chute · Num 4 gancho · Num 2 defesa · Num 3 ultimate<br><b>COMBOS:</b> I + I + O · G + O no chão · cada campeão possui sequências próprias.'}
  });
  obs.observe(document.body,{childList:true,subtree:true});

  backfillPassBonuses();injectLobbyCollection();enhancePass();
  window.LutadorComplete=Object.freeze({version:'15.1-stable',meta,division,startDodge,openCollection,prepareFight,save});
})();
