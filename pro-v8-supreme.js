/* SORTEP NIAK — V8 SUPREMA
 * Camada final de polimento: lobby profissional, estilos de luta, mecânicas avançadas,
 * skins visíveis/funcionais, HUD técnico e estabilidade. Mantém o núcleo existente.
 */
(()=>{
  'use strict';
  if(window.LutadorV8?.version)return;
  const VERSION='8.0.0';
  const KEY='lutador-v8-supreme';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const game=()=>{try{return typeof fight!=='undefined'&&fight?fight:null}catch(_){return null}};
  const gs=()=>{try{return typeof state!=='undefined'&&state?state:null}catch(_){return null}};
  const chars=()=>{try{return typeof CHARACTERS!=='undefined'?CHARACTERS:[]}catch(_){return []}};
  const byId=id=>chars().find(c=>c.id===id);
  const exp=()=>window.LutadorExpansion?.data||null;
  const v6=()=>window.LutadorV6?.data||null;
  const complete=()=>window.LutadorComplete?.meta||null;
  const now=()=>performance.now();
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');

  const STYLES=Object.freeze({
    balanced:{name:'EQUILIBRADO',icon:'◆',tag:'VERSÁTIL',desc:'Sem fraquezas. Fôlego e defesa consistentes.',dmg:1,speed:1,hp:1,stamina:1,guard:100,accent:'#89a7ff'},
    rush:{name:'RUSHDOWN',icon:'⚡',tag:'PRESSÃO',desc:'Mais velocidade e pressão; defesa ligeiramente menor.',dmg:1.06,speed:1.09,hp:.96,stamina:1.12,guard:88,accent:'#ff5368'},
    guardian:{name:'GUARDIÃO',icon:'⬢',tag:'DEFESA',desc:'Mais vida, guarda forte e push-block eficiente.',dmg:.95,speed:.94,hp:1.09,stamina:.98,guard:130,accent:'#61e3b5'},
    counter:{name:'CONTRA-GOLPE',icon:'✦',tag:'PARRY',desc:'Janela de parry maior e counters mais perigosos.',dmg:1.02,speed:1.02,hp:.98,stamina:1.03,guard:100,accent:'#ffd166'},
    grappler:{name:'BRUTAMONTES',icon:'✹',tag:'IMPACTO',desc:'Gancho e golpes pesados derrubam por mais tempo.',dmg:1.08,speed:.93,hp:1.05,stamina:.92,guard:112,accent:'#ff934f'},
    zoner:{name:'CONTROLADOR',icon:'◈',tag:'DISTÂNCIA',desc:'Poderes e projéteis melhores; corpo a corpo moderado.',dmg:.98,speed:.99,hp:1,stamina:1.06,guard:96,accent:'#6ad8ff'}
  });

  const defaults=()=>({
    p1Style:'balanced',p2Style:'balanced',styleByChar:{},matches:0,objectivesDone:0,
    settings:{combatCallouts:true,skinFx:true,advancedHud:true},lastLobbyTip:0
  });
  let data=defaults();
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');data={...defaults(),...raw,settings:{...defaults().settings,...(raw.settings||{})},styleByChar:{...(raw.styleByChar||{})}}}catch(_){data=defaults()}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}};
  try{const c=complete();const map={facil:'easy',fácil:'easy',dificil:'hard','difícil':'hard',insano:'insane'};if(c&&map[String(c.aiDifficulty||'').toLowerCase()]){c.aiDifficulty=map[String(c.aiDifficulty).toLowerCase()];window.LutadorComplete?.save?.()}}catch(_){}

  function toast(text,tone='normal',ms=1700){
    try{if(window.LutadorV6?.toast){window.LutadorV6.toast(text,tone,ms);return}}catch(_){}
    let h=document.querySelector('.v8-toast-host');if(!h){h=document.createElement('div');h.className='v8-toast-host';document.body.appendChild(h)}
    const e=document.createElement('div');e.className='v8-toast '+tone;e.textContent=text;h.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.remove('show');setTimeout(()=>e.remove(),200)},ms);
  }
  function callout(text,tone=''){if(!data.settings.combatCallouts)return;let e=document.getElementById('v8-callout');if(!e){e=document.createElement('div');e.id='v8-callout';document.body.appendChild(e)}e.className='v8-callout '+tone;e.textContent=text;clearTimeout(e._t);requestAnimationFrame(()=>e.classList.add('show'));e._t=setTimeout(()=>e.classList.remove('show'),760)}

  function styleFor(p){return STYLES[p?.v8Style]||STYLES.balanced}
  function archetypeStyle(id){
    let a='';try{a=String(window.LutadorV6?.arch?.(id)?.[0]||'').toUpperCase()}catch(_){}
    if(a.includes('RUSH')||id==='rojo')return'rush';if(a.includes('TANQ')||a.includes('DEF'))return'guardian';if(a.includes('ZON')||a.includes('CONTROL')||id==='thuvaa')return'zoner';if(a.includes('ASSASS'))return'counter';
    const c=byId(id);if((c?.dmg||0)>=36)return'grappler';return'balanced';
  }
  function applyStyle(p,key){
    if(!p||p.v8StyleApplied)return;p.v8Style=STYLES[key]?key:'balanced';const s=styleFor(p);p.v8StyleApplied=true;
    p.dmg*=s.dmg;p.speed*=s.speed;p.maxHp=Math.round(p.maxHp*s.hp);p.hp=Math.min(p.maxHp,Math.round(p.hp*s.hp));
    p.v8Guard=s.guard;p.v8GuardMax=s.guard;p.v8Rage=0;p.v8RageActive=0;p.v8ParryT=0;p.v8ParryCd=0;p.v8AirDashCd=0;p.v8QuickRiseCd=0;p.v8PushCd=0;p.v8Comeback=false;p.v8WallBounceCd=0;p.v8ClashCd=0;p.v8FeintCd=0;
  }
  function bindFor(p,action){const e=exp()?.keybinds;const side=p?.playerSlot==='p2'?'p2':'p1';const defaults={p1:{guard:'KeyK',dodge:'KeyQ',power:'KeyJ',punch:'KeyI',kick:'KeyO',hook:'KeyG',ultimate:'KeyL',taunt:'KeyT'},p2:{guard:'Numpad2',dodge:'Numpad0',power:'Numpad1',punch:'Numpad5',kick:'Numpad6',hook:'Numpad4',ultimate:'Numpad3',taunt:'Numpad7'}};return e?.[side]?.[action]||defaults[side][action]}
  function kindOf(src,type){const raw=String(src?.proKind||src?.move?.kind||type||'special').toLowerCase();if(raw.includes('punch'))return'punch';if(raw.includes('kick'))return'kick';if(raw.includes('uppercut'))return'uppercut';if(raw.includes('hazard'))return'hazard';return raw}
  const melee=k=>['punch','kick','uppercut'].includes(k);
  const heavy=k=>['kick','uppercut','special','sword','hammer','ray','lightning','comet','crossrush','skyfall'].some(x=>String(k).includes(x));

  /* 1-6: estilos + parry + guarda + push-block + air dash + quick rise */
  function tryAirDash(p){const f=game();if(!f||p.onGround||p.v8AirDashCd>0||p.state==='ko'||(p.proStamina??100)<18)return false;const enemy=p===f.p1?f.p2:f.p1;const dir=p.facing||(enemy?.x>p.x?1:-1);p.proStamina=Math.max(0,(p.proStamina??100)-18);p.v8AirDashCd=.48;p.megaDodgeT=.16;p.megaDodgeInvuln=.11;p.vx=dir*610;p.vy=Math.max(p.vy||0,35);p.state='dodge';p.stateT=0;callout('AIR DASH','cyan');return true}
  function tryQuickRise(p){if(!p||!(p.proKnockdownT>0)||!p.onGround||p.v8QuickRiseCd>0||(p.proStamina??100)<22)return false;p.proStamina=Math.max(0,(p.proStamina??100)-22);p.proKnockdownT=.08;p.v8QuickRiseCd=1.8;p.vx=(p.facing||1)*-250;callout('RECUPERAÇÃO RÁPIDA','gold');return true}
  function tryPushBlock(p){const f=game(),enemy=p===f?.p1?f?.p2:f?.p1;if(!f||!enemy||!p.onGround||p.v8PushCd>0||(p.proStamina??100)<24||Math.abs(enemy.x-p.x)>175)return false;p.proStamina=Math.max(0,(p.proStamina??100)-24);p.v8PushCd=.8;enemy.vx=(enemy.x>p.x?1:-1)*520;enemy.attackDisabledT=Math.max(enemy.attackDisabledT||0,.16);f.megaHitStop=Math.max(f.megaHitStop||0,.045);if(typeof spark==='function')spark((p.x+enemy.x)/2,typeof bodyY==='function'?bodyY(p):650,'#7df7ff',18);callout('PUSH BLOCK','cyan');return true}
  function tryFeint(p){if(!p?.proMove||p.v8FeintCd>0||(p.proStamina??100)<8)return false;const m=p.proMove;if(m.time>Math.max(.11,m.start*.86))return false;p.proStamina=Math.max(0,(p.proStamina??100)-8);p.proMove=null;p.proBuffer=null;p.throwCd=.12;p.state=p.onGround?'idle':'air';p.stateT=0;p.v8FeintCd=.42;callout('FINTA','gold');return true}

  const basePlayerInput=window.playerInput;
  if(typeof basePlayerInput==='function')window.playerInput=function(p){
    const f=game();if(!f||!p)return basePlayerInput.apply(this,arguments);
    const dodge=bindFor(p,'dodge'),guard=bindFor(p,'guard'),power=bindFor(p,'power');
    if(window.justPressed?.[dodge]){
      if((p.proKnockdownT||0)>0&&tryQuickRise(p)){window.justPressed[dodge]=false;return}
      if(!p.onGround&&tryAirDash(p)){window.justPressed[dodge]=false;return}
    }
    if(window.justPressed?.[guard]&&p.proMove&&tryFeint(p)){window.justPressed[guard]=false;return}
    if(window.justPressed?.[power]&&controlDown?.(p,guard)&&tryPushBlock(p)){window.justPressed[power]=false;return}
    return basePlayerInput.apply(this,arguments);
  };

  const baseAiInput=window.aiInput;
  if(typeof baseAiInput==='function')window.aiInput=function(p,f,dt){
    if(p&&f&&!p.human){const diff=String(f.megaAiDifficulty||complete()?.aiDifficulty||'normal').toLowerCase(),enemy=p===f.p1?f.p2:f.p1,dist=Math.abs((enemy?.x||0)-(p.x||0));
      if((p.proKnockdownT||0)>0&&p.onGround&&['hard','dificil','insane','insano'].includes(diff)&&Math.random()<dt*3.5)tryQuickRise(p);
      if(enemy?.proMove&&dist<155&&p.v8ParryCd<=0&&['hard','dificil','insane','insano'].includes(diff)&&Math.random()<dt*(diff.startsWith('i')?4.5:2.5)){p.v8ParryT=.09;p.v8ParryCd=.34;p.defend=true;}
      if(dist<135&&p.defend&&p.v8PushCd<=0&&diff.startsWith('i')&&Math.random()<dt*1.6)tryPushBlock(p);
    }
    return baseAiInput.apply(this,arguments);
  };

  document.addEventListener('keydown',e=>{
    if(e.repeat)return;const f=game();if(!f||f.paused||f.over)return;
    for(const p of [f.p1,f.p2]){
      if(!p?.human)continue;
      if(e.code===bindFor(p,'guard')&&p.onGround&&p.v8ParryCd<=0&&!(p.proKnockdownT>0)){
        const style=styleFor(p);p.v8ParryT=p.v8Style==='counter'?.19:.115;p.v8ParryCd=.22;
        if(style.name==='GUARDIÃO')p.v8ParryT=.13;
      }
      if(e.code===bindFor(p,'taunt')&&p.v8Rage>=60&&p.v8RageActive<=0){p.v8Rage=Math.max(0,p.v8Rage-60);p.v8RageActive=4.2;callout('ADRENALINA ATIVA','red');e.preventDefault()}
    }
  },true);

  /* 7-15: guard break, dash strike, clash, wall bounce, scaling, rage, comeback, estilo e hit-stop extra */
  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){
    const f=game(),attacker=src?.owner||(src?.id&&src!==victim?src:null),kind=kindOf(src,type);let a=Number(amount)||0;
    if(!victim)return baseDamage.apply(this,arguments);
    if(attacker&&attacker!==victim&&victim.v8ParryT>0&&type!=='hazard'){
      victim.v8ParryT=0;victim.v8Parries=(victim.v8Parries||0)+1;victim.v8Guard=Math.min(victim.v8GuardMax||100,(victim.v8Guard||0)+12);attacker.attackDisabledT=Math.max(attacker.attackDisabledT||0,.34);attacker.vx=(attacker.x>victim.x?1:-1)*250;victim.megaCounterT=Math.max(victim.megaCounterT||0,.72);if(f)f.megaHitStop=Math.max(f.megaHitStop||0,.075);if(typeof spark==='function')spark(victim.x,typeof bodyY==='function'?bodyY(victim):650,'#fff4a8',24);callout('PARRY PERFEITO','gold');try{window.ProAudio?.play?.('guard',{volume:1})}catch(_){};return;
    }
    if(attacker&&attacker!==victim){
      const as=styleFor(attacker),vs=styleFor(victim);if(attacker.v8RageActive>0)a*=1.14;if(victim.v8RageActive>0)a*=.92;
      if(attacker.v8Style==='rush'&&melee(kind))a*=1.06;if(attacker.v8Style==='grappler'&&heavy(kind))a*=1.08;if(attacker.v8Style==='zoner'&&!melee(kind))a*=1.10;if(attacker.v8Style==='zoner'&&melee(kind))a*=.95;
      if(victim.v8Style==='guardian')a*=.93;
      if(attacker.megaSprintT>0&&melee(kind)){a*=1.13;attacker.v8DashStrikeT=.35;}
      const combo=Number(attacker.megaCombo||attacker.combo||0);if(combo>=11)a*=.72;else if(combo>=7)a*=.84;else if(combo>=4)a*=.93;
      if(victim.defend){const cost=Math.max(8,a*.20);victim.v8Guard=Math.max(0,(victim.v8Guard??victim.v8GuardMax??100)-cost);if(victim.v8Guard<=0){victim.defend=false;victim.guardBroken=true;victim.attackDisabledT=Math.max(victim.attackDisabledT||0,1.0);callout('GUARDA QUEBRADA','red')}}
    }
    const before=Number(victim.hp||0),result=baseDamage.call(this,victim,a,src,dir,type),dealt=Math.max(0,before-Number(victim.hp||0));
    if(dealt>0&&attacker&&attacker!==victim){
      victim.v8Rage=clamp((victim.v8Rage||0)+dealt/(victim.maxHp||1)*165,0,100);attacker.v8Rage=clamp((attacker.v8Rage||0)+dealt/(victim.maxHp||1)*58,0,100);
      if(attacker.v8Style==='rush'&&(attacker.megaCombo||0)>=3)attacker.proStamina=clamp((attacker.proStamina??100)+4,0,100);
      if(attacker.v8Style==='grappler'&&kind==='uppercut'&&victim.proKnockdownT>0)victim.proKnockdownT=Math.max(victim.proKnockdownT,2.65);
      if(heavy(kind)&&victim.state!=='ko'&&victim.v8WallBounceCd<=0&&(victim.x<58||victim.x>W-58)){
        victim.v8WallBounceCd=.7;victim.vx=(victim.x<W/2?1:-1)*460;victim.vy=Math.max(victim.vy||0,250);victim.onGround=false;victim.y=Math.max(5,victim.y||0);if(f)f.megaHitStop=Math.max(f.megaHitStop||0,.055);callout('WALL BOUNCE','red');
      }
    }
    return result;
  };

  function clashCheck(f){
    const a=f?.p1,b=f?.p2;if(!a||!b||a.v8ClashCd>0||b.v8ClashCd>0||!a.proMove||!b.proMove)return;
    const am=a.proMove,bm=b.proMove,active=m=>m.time>=m.start*.85&&m.time<=m.end+.02;if(!active(am)||!active(bm)||Math.abs(a.x-b.x)>135)return;
    if(!melee(am.kind)||!melee(bm.kind))return;
    a.proMove=null;b.proMove=null;a.throwCd=.22;b.throwCd=.22;a.v8ClashCd=b.v8ClashCd=.65;a.vx=-180;b.vx=180;f.megaHitStop=Math.max(f.megaHitStop||0,.09);if(typeof spark==='function')spark((a.x+b.x)/2,typeof bodyY==='function'?(bodyY(a)+bodyY(b))/2:620,'#ffffff',30);callout('CLASH!','gold');try{window.ProAudio?.play?.('guard',{volume:1})}catch(_){}
  }

  const OBJECTIVES=[
    {id:'combo5',label:'Faça combo 5x',check:f=>(f.megaStats?.p1?.maxCombo||0)>=5,reward:120},
    {id:'ultimate',label:'Use uma Ultimate',check:f=>(f.megaStats?.p1?.ultimates||0)>=1,reward:150},
    {id:'clean',label:'Vença com 45%+ de vida',check:f=>f.p1.hp/(f.p1.maxHp||1)>=.45,reward:180},
    {id:'parry',label:'Execute um Parry Perfeito',check:f=>(f.p1.v8Parries||0)>=1,reward:160},
    {id:'guard',label:'Termine com 50%+ de guarda',check:f=>(f.p1.v8Guard||0)>=(f.p1.v8GuardMax||100)*.5,reward:130}
  ];
  function initFightV8(f){
    if(!f||f.v8Init)return;f.v8Init=true;data.matches++;save();const p1Key=data.styleByChar[f.p1?.id]||data.p1Style||'balanced',p2Key=f.p2?.human?(data.styleByChar[f.p2?.id]||data.p2Style||'balanced'):archetypeStyle(f.p2?.id);applyStyle(f.p1,p1Key);applyStyle(f.p2,p2Key);f.v8Objective=OBJECTIVES[data.matches%OBJECTIVES.length];f.v8ObjectivePaid=false;f.v8SlowMo=0;f.v8LastAnnounce='';
  }
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){
    if(!f)return baseUpdate.apply(this,arguments);initFightV8(f);
    const scaled=f.v8SlowMo>0?dt*.32:dt;const r=baseUpdate.call(this,f,scaled);clashCheck(f);
    for(const p of [f.p1,f.p2]){
      if(!p)continue;const s=styleFor(p);p.v8ParryT=Math.max(0,(p.v8ParryT||0)-dt);p.v8ParryCd=Math.max(0,(p.v8ParryCd||0)-dt);p.v8AirDashCd=Math.max(0,(p.v8AirDashCd||0)-dt);p.v8QuickRiseCd=Math.max(0,(p.v8QuickRiseCd||0)-dt);p.v8PushCd=Math.max(0,(p.v8PushCd||0)-dt);p.v8FeintCd=Math.max(0,(p.v8FeintCd||0)-dt);p.v8WallBounceCd=Math.max(0,(p.v8WallBounceCd||0)-dt);p.v8ClashCd=Math.max(0,(p.v8ClashCd||0)-dt);p.v8RageActive=Math.max(0,(p.v8RageActive||0)-dt);p.v8DashStrikeT=Math.max(0,(p.v8DashStrikeT||0)-dt);
      const regen=(p.defend?4:12)*s.stamina*dt;p.proStamina=clamp((p.proStamina??100)+regen,0,100);p.v8Guard=clamp((p.v8Guard??s.guard)+(p.defend?5:16)*dt,0,p.v8GuardMax||s.guard);
      if(!p.v8Comeback&&p.hp>0&&p.hp/(p.maxHp||1)<=.25){p.v8Comeback=true;p.proStamina=clamp((p.proStamina??100)+28,0,100);p.v8Rage=clamp((p.v8Rage||0)+30,0,100);if(p.human)callout('COMEBACK · SEGUNDA CHANCE','red')}
      if(p.v8Rage>=100&&p.hp/(p.maxHp||1)<.35&&p.v8RageActive<=0){p.v8Rage=0;p.v8RageActive=5.0;if(p.human)callout('FÚRIA MÁXIMA','red')}
    }
    f.v8SlowMo=Math.max(0,(f.v8SlowMo||0)-dt);return r;
  };

  /* 16-18: slow motion de KO, objetivo dinâmico e callouts */
  const baseEndRound=window.endRound;
  if(typeof baseEndRound==='function')window.endRound=function(f,winner,loser){if(f&&!f.over){f.v8SlowMo=.24;if(winner===f.p1&&f.v8Objective?.check?.(f)&&!f.v8ObjectivePaid){f.v8ObjectivePaid=true;const s=gs();if(s){s.coins=(Number(s.coins)||0)+f.v8Objective.reward;try{persist?.()}catch(_){ }data.objectivesDone++;save();toast(`OBJETIVO SUPREMO · +${f.v8Objective.reward} GOLD`,'reward',2200)}}callout(loser?.hp<=0?'K.O.':'FIM DA RODADA',winner===f.p1?'gold':'red')}return baseEndRound.apply(this,arguments)};

  /* 19: skins funcionais de verdade — luta, aura, lobby e seleção. */
  const SKINS={
    'original':{filter:'none',aura:'transparent'},'Padrão':{filter:'none',aura:'transparent'},
    'Aura Carmesim':{filter:'saturate(1.35) hue-rotate(342deg) contrast(1.08)',aura:'#ff304e'},
    'Gelo Espectral':{filter:'hue-rotate(160deg) saturate(1.32) brightness(1.08)',aura:'#72dcff'},
    'Neon Primordial':{filter:'hue-rotate(278deg) saturate(1.65) brightness(1.16)',aura:'#c56cff'},
    'Ouro do Campeão':{filter:'sepia(.72) saturate(2.2) brightness(1.12)',aura:'#ffd76b'},
    'Rojo Ascendente':{filter:'saturate(1.55) contrast(1.12) brightness(1.05)',aura:'#ff2548'},
    'Primordial':{filter:'hue-rotate(286deg) saturate(1.7) contrast(1.12)',aura:'#ff54df'},
    'Eclipse Rubro':{filter:'saturate(1.55) contrast(1.18) brightness(.88) hue-rotate(350deg)',aura:'#ff203f'},
    'Aurora Glacial':{filter:'hue-rotate(152deg) saturate(1.5) brightness(1.18)',aura:'#83f4ff'},
    'Sombra Violeta':{filter:'hue-rotate(258deg) saturate(1.55) contrast(1.15) brightness(.9)',aura:'#9b63ff'},
    'Toxic Neon':{filter:'hue-rotate(78deg) saturate(1.9) brightness(1.08)',aura:'#91ff3d'},
    'Plasma Azul':{filter:'hue-rotate(184deg) saturate(1.7) contrast(1.1)',aura:'#3d9dff'},
    'Obsidiana':{filter:'grayscale(.65) contrast(1.55) brightness(.72)',aura:'#9ea5b2'},
    'Solar Dourado':{filter:'sepia(.9) saturate(2.6) hue-rotate(350deg) brightness(1.14)',aura:'#ffda59'},
    'Fantasma Branco':{filter:'grayscale(.88) brightness(1.35) contrast(.92)',aura:'#f4fbff'},
    'Matrix Esmeralda':{filter:'hue-rotate(82deg) saturate(1.8) contrast(1.1)',aura:'#32f59a'},
    'Inferno Magenta':{filter:'hue-rotate(305deg) saturate(1.9) contrast(1.16)',aura:'#ff4fc8'},
    'carmesim':{filter:'saturate(1.35) hue-rotate(342deg) contrast(1.08)',aura:'#ff304e'},
    'gelo':{filter:'hue-rotate(160deg) saturate(1.32) brightness(1.08)',aura:'#72dcff'},
    'neon':{filter:'hue-rotate(278deg) saturate(1.65) brightness(1.16)',aura:'#c56cff'},
    'ouro':{filter:'sepia(.72) saturate(2.2) brightness(1.12)',aura:'#ffd76b'}
  };
  function equippedSkin(p){
    if(!p)return'original';
    if(p.v16OnlineSkin)return p.v16OnlineSkin;
    if(p.playerSlot==='p1')return exp()?.equipped?.skin||complete()?.cosmetics?.equippedSkin||window.LutadorUltimate?.data?.cosmetics?.[p.id]?.skin||'original';
    return window.LutadorUltimate?.data?.cosmetics?.[p.id]?.skin||'original';
  }
  function skinSpec(p){const n=equippedSkin(p);return SKINS[n]||SKINS[String(n).toLowerCase()]||{filter:'none',aura:p?.color||'transparent'}}
  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){
    const spec=skinSpec(p),skin=equippedSkin(p);ctx.save();if(spec.filter&&spec.filter!=='none')ctx.filter=spec.filter;const r=baseDrawFighter.apply(this,arguments);ctx.restore();
    if(data.settings.skinFx&&spec.aura!=='transparent'&&p?.state!=='ko'){
      const y=typeof groundLevel==='function'?groundLevel(p):760;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.16+.05*Math.sin(performance.now()/110);ctx.strokeStyle=spec.aura;ctx.shadowColor=spec.aura;ctx.shadowBlur=24;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,y-70,42,76,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    p.v8SkinName=skin;return r;
  };

  /* 20: HUD técnico Supremo com estilo, guarda, fúria, objetivo e skin. */
  function drawV8Hud(ctx,f){if(!data.settings.advancedHud||!f?.p1||!f?.p2)return;ctx.save();const y=178,w=220;
    for(const [p,left] of [[f.p1,true],[f.p2,false]]){const x=left?50:W-50-w,s=styleFor(p),guard=clamp((p.v8Guard||0)/(p.v8GuardMax||100),0,1),rage=clamp((p.v8Rage||0)/100,0,1);ctx.globalAlpha=.92;ctx.fillStyle='rgba(5,9,18,.78)';ctx.fillRect(x,y,w,46);ctx.strokeStyle='rgba(255,255,255,.12)';ctx.strokeRect(x,y,w,46);ctx.font='800 10px system-ui';ctx.textAlign=left?'left':'right';ctx.fillStyle=s.accent;ctx.fillText(`${s.icon} ${s.name}`,left?x+8:x+w-8,y+13);ctx.fillStyle='#27334a';ctx.fillRect(x+8,y+20,w-16,6);ctx.fillStyle='#67e8f9';ctx.fillRect(x+8,y+20,(w-16)*guard,6);ctx.fillStyle='#321620';ctx.fillRect(x+8,y+31,w-16,6);ctx.fillStyle=p.v8RageActive>0?'#fff07a':'#ff5368';ctx.fillRect(x+8,y+31,(w-16)*rage,6);ctx.fillStyle='#90a0b8';ctx.font='700 8px system-ui';ctx.fillText(`GUARDA ${Math.round(guard*100)}  ·  FÚRIA ${Math.round(rage*100)}`,left?x+8:x+w-8,y+44)}
    if(f.v8Objective){ctx.textAlign='center';ctx.font='800 10px system-ui';ctx.fillStyle=f.v8Objective.check?.(f)?'#77f2b2':'#d7dfef';ctx.fillText(`DESAFIO: ${f.v8Objective.label} · +${f.v8Objective.reward} GOLD`,W/2,198)}ctx.restore()}
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const r=baseDraw.apply(this,arguments);if(f)drawV8Hud(canvas.getContext('2d'),f);return r};

  /* Lobby Supremo — um layout único, limpo e sem cartões sobrepostos. */
  function favoriteId(){return v6()?.lastSelected||v6()?.favorites?.[0]||'rojo'}
  function rankText(){return 'ARENA'}
  function skinName(){return exp()?.equipped?.skin||complete()?.cosmetics?.equippedSkin||'Original'}
  function lobbyTip(){const tips=['Parry perfeito: toque a defesa pouco antes do impacto.','Defesa + poder perto do rival executa Push Block.','No ar, esquiva vira Air Dash.','Esquiva no chão durante a queda executa recuperação rápida.','Defesa durante o começo de um golpe cancela com uma finta.','T provoca Adrenalina quando a Fúria estiver acima de 60.'];return tips[Math.floor(Date.now()/15000)%tips.length]}
  function decorateLobby(){
    const menu=document.querySelector('.menu.pro-lobby-ready');if(!menu)return;menu.classList.add('v8-supreme-lobby');
    const hero=menu.querySelector('.pro-lobby-hero'),combat=menu.querySelector('.pro-combat-menu');const id=favoriteId(),c=byId(id)||byId('rojo');
    if(hero){hero.style.setProperty('--v8-champ',`url('ai-assets/characters/${id}.png')`);let badge=hero.querySelector('.v8-hero-badge');if(!badge){badge=document.createElement('div');badge.className='v8-hero-badge';hero.appendChild(badge)}badge.innerHTML=`<small>V8 SUPREMA · CAMPEÃO EM DESTAQUE</small><strong>${esc(c?.name||'ROJO')}</strong><span>${esc(rankText())}</span><i>SKIN · ${esc(skinName())}</i>`}
    if(combat&&!combat.querySelector('.v8-command-center')){const box=document.createElement('section');box.className='v8-command-center';box.innerHTML=`<header><div><small>CENTRAL DA ARENA</small><h3>ENTRE NA ARENA</h3></div><span>V${VERSION}</span></header><div class="v8-quick-grid"><button data-v8-go="play">⚔<b>JOGAR</b><small>Modos e partidas</small></button><button data-v8-go="training">🥊<b>TREINO</b><small>Hitbox e frame data</small></button><button data-v8-go="story">📖<b>HISTÓRIA</b><small>Campanha narrativa</small></button><button data-v8-go="shop">🛒<b>LOJA</b><small>Campeões e itens</small></button><button data-v8-go="wardrobe">🎨<b>SKINS</b><small>Vestiário funcional</small></button><button data-v8-go="settings">⚙<b>CONFIG.</b><small>Vídeo, som e controles</small></button></div><div class="v8-mini-links"><button data-v8-go="codes">CÓDIGOS</button><button data-v8-go="news">NOTÍCIAS</button><button data-v8-go="hub">MAIS</button></div><div class="v8-lobby-tip"><span>💡 ${esc(lobbyTip())}</span><button data-v8-go="styles">ESTILOS DE LUTA</button></div>`;combat.prepend(box);box.querySelectorAll('[data-v8-go]').forEach(b=>b.onclick=()=>runLobbyAction(b.dataset.v8Go))}
    menu.querySelectorAll('.exp-premium-home').forEach(x=>x.classList.add('v8-legacy-hide'));menu.querySelectorAll('.v6-live-strip').forEach(x=>x.classList.add('v8-compact-live'));
  }
  function runLobbyAction(a){if(a==='play')return window.renderModes?.();if(a==='training')return window.ProCombat?.openGuide?.(true);if(a==='story')return window.renderStorySelect?.();if(a==='shop')return window.renderShop?.();if(a==='wardrobe')return window.LutadorV6?.openWardrobe?.();if(a==='settings')return window.LutadorUltimate?.openSettings?.();if(a==='ranking')return window.renderRanking?.();if(a==='codes')return window.renderCodes?.();if(a==='news')return window.renderNews?.();if(a==='hub'){const b=document.querySelector('.v7-hub-button');if(b)return b.click()}if(a==='styles')return openStyleDialog()}

  function openStyleDialog(){
    let d=document.getElementById('v8-style-dialog');if(!d){d=document.createElement('dialog');d.id='v8-style-dialog';d.className='v8-dialog';document.body.appendChild(d)}
    d.innerHTML=`<div class="v8-dialog-head"><div><small>SISTEMA DE COMBATE V8</small><h2>ESTILOS DE LUTA</h2></div><button>×</button></div><p class="v8-dialog-intro">O estilo do P1 fica salvo. Em CPU, o rival escolhe um estilo baseado no próprio arquétipo.</p><div class="v8-style-grid">${Object.entries(STYLES).map(([k,s])=>`<button data-style="${k}" class="${data.p1Style===k?'active':''}" style="--accent:${s.accent}"><span>${s.icon}</span><b>${s.name}</b><small>${s.tag}</small><p>${s.desc}</p></button>`).join('')}</div>`;d.querySelector('.v8-dialog-head button').onclick=()=>d.close();d.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{data.p1Style=b.dataset.style;save();d.querySelectorAll('[data-style]').forEach(x=>x.classList.toggle('active',x===b));toast('ESTILO EQUIPADO · '+STYLES[data.p1Style].name,'reward')});if(!d.open)d.showModal()
  }

  function decorateSelect(){
    const root=document.querySelector('.select.mk-arena');if(!root)return;root.classList.add('v8-select');
    if(!root.querySelector('.v8-style-selector')){const sec=document.createElement('section');sec.className='v8-style-selector';sec.innerHTML=`<div><small>ESTILO DE LUTA DO P1</small><b>${STYLES[data.p1Style]?.name||'EQUILIBRADO'}</b></div><div class="v8-style-pills">${Object.entries(STYLES).map(([k,s])=>`<button data-v8-style="${k}" class="${data.p1Style===k?'active':''}" title="${esc(s.desc)}">${s.icon} ${s.name}</button>`).join('')}</div><span>SKIN: <b>${esc(skinName())}</b></span>`;const tools=root.querySelector('.v6-select-tools');(tools||root.querySelector('.pick-status'))?.after(sec);sec.querySelectorAll('[data-v8-style]').forEach(b=>b.onclick=()=>{data.p1Style=b.dataset.v8Style;save();sec.querySelector('div>b').textContent=STYLES[data.p1Style].name;sec.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));toast('ESTILO · '+STYLES[data.p1Style].name,'speed')})}
    const filter=SKINS[skinName()]?.filter||'none';root.querySelectorAll('.mk-fighter[data-id]').forEach(card=>{const img=card.querySelector('.mk-portrait img,.pro-character-image,.pro-portrait img');if(img)img.style.filter=filter});const preview=document.querySelector('.v6-wardrobe-preview img');if(preview)preview.style.filter=filter;
  }

  /* Tela de modos e diálogos: acabamento visual sem alterar fluxo. */
  function decorateScreens(){const root=document.querySelector('#app>.card');if(root)root.classList.add('v8-screen');document.querySelectorAll('dialog').forEach(d=>d.classList.add('v8-dialog-surface'));const modes=document.querySelector('.modes-screen');if(modes&&!modes.querySelector('.v8-modes-note')){const n=document.createElement('div');n.className='v8-modes-note';n.innerHTML=`<b>V8 SUPREMA</b><span>Parry · Clash · Air Dash · Push Block · Wall Bounce · Fúria · 6 estilos</span>`;modes.querySelector('.mode-grid')?.before(n)}}

  const baseStartFight=window.startFight;
  if(typeof baseStartFight==='function')window.startFight=function(){const r=baseStartFight.apply(this,arguments);const f=game();if(f){f.v8Init=false;initFightV8(f);setTimeout(()=>callout(`${styleFor(f.p1).icon} ${styleFor(f.p1).name}`,'gold'),2050)}return r};
  const baseReset=window.resetRoundForNextMatch;
  if(typeof baseReset==='function')window.resetRoundForNextMatch=function(){const r=baseReset.apply(this,arguments),f=game();if(f){for(const p of[f.p1,f.p2]){p.v8Guard=p.v8GuardMax||100;p.v8Rage=Math.min(p.v8Rage||0,35);p.v8RageActive=0;p.v8ParryT=0;p.v8AirDashCd=0;p.v8PushCd=0;p.v8Comeback=false}}return r};

  /* Parries são contados diretamente no wrapper de dano para objetivos e estatísticas. */
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorateLobby();decorateSelect();decorateScreens()})});observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{decorateLobby();decorateSelect();decorateScreens()},80);
  window.addEventListener('pagehide',save);

  window.LutadorV8=Object.freeze({version:VERSION,data,save,styles:STYLES,openStyleDialog,skinSpec,equippedSkin});
})();


/* ===== V8.2 PATCH — LOBBY PROFISSIONAL / ONBOARDING / RESET ===== */
(()=>{
  'use strict';
  const APP_VER='8.2.0';
  const lobbyActions={
    play(){ return window.renderModes?.(); },
    training(){ return window.ProCombat?.openGuide?.(true); },
    story(){ return window.renderStorySelect?.(); },
    shop(){ return window.renderShop?.(); },
    wardrobe(){ return window.LutadorV6?.openWardrobe?.(); },
    settings(){ return window.LutadorUltimate?.openSettings?.(); },
    ranking(){ return window.renderRanking?.(); },
    codes(){ return window.renderCodes?.(); },
    news(){ return window.renderNews?.(); },
    hub(){ const b=document.querySelector('.v7-hub-button'); if(b) b.click(); },
    styles(){ return window.LutadorV8?.openStyleDialog?.(); }
  };
  const safePersist=()=>{ try{ if(typeof persist==='function') persist(); else if(typeof saveState==='function' && typeof state!=='undefined') saveState(state); }catch(_){} };
  const wipeAccount=()=>{
    try{
      const keys=[];
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(/^lutador|^LUTADOR|^v8-|^v7-|^v6-|^v5-|^pro-/i.test(k||'')) keys.push(k); }
      keys.forEach(k=>localStorage.removeItem(k));
      localStorage.removeItem('lutador-state');localStorage.removeItem('lutador-state-backup');localStorage.removeItem('lutador-save-v2');
      localStorage.removeItem('lutador-v8-supreme');
    }catch(_){}
    try{sessionStorage.clear()}catch(_){ }
    if(typeof defaultPlayer==='function' && typeof state!=='undefined'){
      const fresh=defaultPlayer();
      Object.keys(state).forEach(k=>delete state[k]);
      Object.assign(state,fresh,{playerName:'',tutorialSeen:false,profileCreatedAt:Date.now()});
      safePersist();
    }
  };
  function rebuildArenaCenter(){
    const box=document.querySelector('.v8-command-center');
    if(!box || box.classList.contains('v82-polished')) return;
    box.classList.add('v82-polished');
    const player=(typeof state!=='undefined' && state?.playerName)?state.playerName:'JOGADOR';
    box.innerHTML=`
      <div class="v82-head">
        <div>
          <small class="v82-kicker">CENTRAL DA ARENA</small>
          <h3 class="v82-title">ENTRE NA ARENA</h3>
          <p class="v82-sub">Acesse os modos principais, configure seu estilo de luta e avance no universo de SORTEP NIAK sem menus apertados ou espaço perdido.</p>
        </div>
        <span class="v82-version">V${APP_VER}</span>
      </div>
      <div class="v82-grid">
        <button class="v82-card" data-v82-go="play"><span class="ico">⚔</span><b>JOGAR</b><small>Modos de luta, Ranked e partidas rápidas.</small></button>
        <button class="v82-card" data-v82-go="training"><span class="ico">🥊</span><b>TREINO</b><small>Hitbox, frame data e prática avançada.</small></button>
        <button class="v82-card" data-v82-go="story"><span class="ico">📖</span><b>HISTÓRIA</b><small>Campanha narrativa com cenas e chefes.</small></button>
        <button class="v82-card" data-v82-go="shop"><span class="ico">🛒</span><b>LOJA</b><small>Campeões, itens e progressão.</small></button>
        <button class="v82-card" data-v82-go="wardrobe"><span class="ico">🎨</span><b>SKINS</b><small>Vestiário funcional e visuais equipáveis.</small></button>
        <button class="v82-card" data-v82-go="settings"><span class="ico">⚙</span><b>CONFIGURAÇÕES</b><small>Vídeo, áudio, controles e desempenho.</small></button>
      </div>
      <div class="v82-mini-links">
        
        <button data-v82-go="codes">CÓDIGOS</button>
        <button data-v82-go="news">NOTÍCIAS</button>
        <button data-v82-go="hub">MAIS</button>
      </div>
      <div class="v82-foot">
        <p><strong>DICA RÁPIDA</strong>Esquive no ar para executar <b>Air Dash</b>, use defesa na hora exata para um <b>Parry</b> e segure pressão até encontrar o momento certo para seu <b>Super</b>.</p>
        <button class="v82-style-btn" data-v82-go="styles"><span>ESTILO ATUAL</span><b>${(window.LutadorV8?.styles?.[window.LutadorV8?.data?.p1Style||'balanced']?.name)||'EQUILIBRADO'}</b></button>
      </div>`;
    box.querySelectorAll('[data-v82-go]').forEach(btn=>btn.onclick=()=>lobbyActions[btn.dataset.v82Go]?.());
    const heroBadge=document.querySelector('.v8-hero-badge strong');
    if(heroBadge && player){
      const tag=document.querySelector('.v8-hero-badge i');
      if(tag && !/JOGADOR:/i.test(tag.textContent)) tag.textContent += ` · JOGADOR: ${player}`;
    }
  }

  const rawRenderCodes=window.renderCodes;
  if(typeof rawRenderCodes==='function' && !window.__v82CodesPatched){
    window.renderCodes=function(){
      const r=rawRenderCodes.apply(this,arguments);
      const hint=document.querySelector('.v6-code-hint');
      if(hint && !hint.querySelector('[data-reset-code]')){
        const extra=document.createElement('span');
        extra.dataset.resetCode='1';
        extra.textContent='REDEFINIR · apagar conta e começar do zero';
        hint.appendChild(extra);
      }
      const subtitle=document.querySelector('.codes-screen .select-subtitle');
      if(subtitle) subtitle.textContent='Use apenas códigos oficiais. REDEFINIR limpa a conta, apaga progresso e reabre o tutorial.';
      const input=document.getElementById('code-input'),btn=document.getElementById('btn-code-submit'),status=document.getElementById('code-status');
      if(input && btn){
        const doSubmit=()=>{
          const code=(input.value||'').trim().toUpperCase();
          if(code==='REDEFINIR'){
            wipeAccount();
            if(status){ status.textContent='♻️ CONTA REDEFINIDA. RECARREGANDO...'; status.style.color='#93f5b1'; }
            setTimeout(()=>location.reload(),700);
            return;
          }
          btn.__origClick ? btn.__origClick() : btn.click();
        };
        if(!btn.__origClick && typeof btn.onclick==='function') btn.__origClick=btn.onclick.bind(btn);
        btn.onclick=(e)=>{ e?.preventDefault?.(); doSubmit(); };
        input.onkeydown=(e)=>{ if(e.key==='Enter'){ e.preventDefault(); doSubmit(); } };
      }
      return r;
    };
    window.__v82CodesPatched=true;
  }

  function closeOverlay(){ document.querySelectorAll('.v82-backdrop,.v82-modal').forEach(n=>n.remove()); }
  function stepDots(cur,total){ return `<div class="v82-steps">${Array.from({length:total},(_,i)=>`<span class="v82-step ${i===cur?'active':''}"></span>`).join('')}</div>`; }
  function overlayShell(title,eyebrow,desc,body,actions,step,total){
    closeOverlay();
    const backdrop=document.createElement('div'); backdrop.className='v82-backdrop';
    const modal=document.createElement('div'); modal.className='v82-modal';
    modal.innerHTML=`<div class="v82-modal-head"><div><small>${eyebrow}</small><h2>${title}</h2><p>${desc}</p>${stepDots(step,total)}</div><button class="v82-modal-close" aria-label="Fechar">×</button></div>${body}<div class="v82-modal-actions">${actions}</div>`;
    document.body.append(backdrop,modal);
    modal.querySelector('.v82-modal-close').onclick=()=>{ if(typeof state!=='undefined'&&state?.playerName){ state.tutorialSeen=true; safePersist(); } closeOverlay(); };
    return modal;
  }
  function showTutorial(step=0){
    const steps=[
      {title:'BEM-VINDO À ARENA', eyebrow:'TUTORIAL OFICIAL', desc:'Entenda rapidamente como navegar por todo o jogo e começar forte.', body:`<div class="v82-tutorial-grid"><div class="v82-tut-card"><h3>Lobby</h3><p>A Central da Arena reúne os atalhos principais: Jogar, Treino, História, Loja, Skins e Configurações. No lado direito ficam passe, missões e progresso.</p></div><div class="v82-tut-card"><h3>Seu Perfil</h3><p>Seu nome aparece no jogo, no lobby e em futuras estatísticas. Gold, Vandais, passe, rank e campeões ficam salvos automaticamente.</p></div></div>`},
      {title:'COMO LUTAR', eyebrow:'COMBATE', desc:'Os fundamentos do sistema de luta.', body:`<div class="v82-tutorial-grid"><div class="v82-tut-card"><h3>Comandos Básicos</h3><ul><li>P1: mover, socar, chutar, defender, gancho e Ultimate.</li><li>P2: teclas numéricas equivalentes.</li><li>Esquiva perfeita pode abrir contra-ataque.</li></ul></div><div class="v82-tut-card"><h3>Mecânicas</h3><ul><li>Combos aumentam dano e pressão.</li><li>No chão, o rival derrubado só leva dano de chute.</li><li>Parry, Push Block, Air Dash e estilos de luta fazem parte do meta.</li></ul></div></div>`},
      {title:'PROGRESSÃO E MODOS', eyebrow:'CONTEÚDO', desc:'Como avançar e aproveitar tudo que o jogo oferece.', body:`<div class="v82-tutorial-grid"><div class="v82-tut-card"><h3>Modos</h3><ul><li>Jogar: partidas contra CPU e versus.</li><li>Treino: hitbox, frame data e prática.</li><li>História: campanha com narrativa.</li></ul></div><div class="v82-tut-card"><h3>Economia</h3><ul><li>Gold compra conteúdo.</li><li>Vandais servem para itens premium.</li><li>Skins, títulos e recompensas ficam no perfil.</li></ul></div></div>`}
    ];
    const item=steps[step];
    const isLast=step===steps.length-1;
    const modal=overlayShell(item.title,item.eyebrow,item.desc,item.body,
      `${step>0?'<button class="v82-secondary" data-prev>VOLTAR</button>':''}${!isLast?'<button class="v82-primary" data-next>PRÓXIMO</button>':'<button class="v82-primary" data-done>ENTRAR NA ARENA</button>'}`,
      step,steps.length);
    modal.querySelector('[data-prev]')?.addEventListener('click',()=>showTutorial(step-1));
    modal.querySelector('[data-next]')?.addEventListener('click',()=>showTutorial(step+1));
    modal.querySelector('[data-done]')?.addEventListener('click',()=>{ if(typeof state!=='undefined'){ state.tutorialSeen=true; safePersist(); } closeOverlay(); });
  }
  function askName(){
    const current=(typeof state!=='undefined' && state?.playerName) ? state.playerName : '';
    const body=`<div class="v82-tut-card"><h3>Crie seu nome de jogador</h3><p>Antes de começar, defina como você quer aparecer no jogo. Você poderá continuar com esse perfil salvo e usar o código <b>REDEFINIR</b> se quiser apagar a conta mais tarde.</p><div class="v82-name-box"><input id="v82-player-name" class="v82-input" maxlength="18" placeholder="Digite seu nome" value="${current.replace(/"/g,'&quot;')}"><button class="v82-primary" id="v82-save-name">CONTINUAR</button></div></div>`;
    const modal=overlayShell('ESCOLHA SEU NOME','PRIMEIRO ACESSO','Seu perfil começa aqui. Escolha um nome curto e forte para entrar na arena.',body,'',0,2);
    modal.querySelector('.v82-modal-actions').style.display='none';
    const input=modal.querySelector('#v82-player-name');
    const saveBtn=modal.querySelector('#v82-save-name');
    const confirm=()=>{
      const val=(input.value||'').trim().replace(/\s+/g,' ');
      if(val.length<2){ input.focus(); input.style.borderColor='#d04d61'; return; }
      if(typeof state!=='undefined'){
        state.playerName=val; state.profileCreatedAt=state.profileCreatedAt||Date.now(); safePersist();
      }
      showTutorial(0);
      setTimeout(rebuildArenaCenter,50);
    };
    saveBtn.onclick=confirm; input.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); confirm(); } };
    setTimeout(()=>input.focus(),30);
  }
  function maybeOnboard(){
    const menu=document.querySelector('.menu.pro-lobby-ready,.v8-supreme-lobby');
    if(!menu || document.querySelector('.v82-modal')) return;
    if(typeof state==='undefined') return;
    if(!state.playerName) askName();
    else if(!state.tutorialSeen) showTutorial(0);
  }
  const obs=new MutationObserver(()=>{ rebuildArenaCenter(); maybeOnboard(); });
  obs.observe(document.body,{subtree:true,childList:true});
  window.addEventListener('load',()=>setTimeout(()=>{ rebuildArenaCenter(); maybeOnboard(); },120));
  setTimeout(()=>{ rebuildArenaCenter(); maybeOnboard(); },200);
})();


/* ===== V8.3 PATCH — LOBBY TRÊS COLUNAS / LOJA PRO ===== */
(()=>{
  'use strict';
  if(window.__LutadorV83Lobby) return;
  window.__LutadorV83Lobby=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const action=(id)=>{
    const map={
      play:()=>window.renderModes?.(),
      training:()=>window.ProCombat?.openGuide?.(true),
      story:()=>window.renderStorySelect?.(),
      shop:()=>window.renderShop?.(),
      roulette:()=>window.renderShopRoulette?.(),
      cosmetics:()=>window.LutadorExpansion?.openCosmeticShop?.(),
      mastery:()=>window.LutadorExpansion?.openMastery?.(),
      profile:()=>window.LutadorV6?.openProfile?window.LutadorV6.openProfile():window.LutadorExpansion?.openProfile?.(),
      wardrobe:()=>window.LutadorV6?.openWardrobe?.(),
      events:()=>window.LutadorV6?.openEvents?.(),
      challenges:()=>window.LutadorV5?.openChallenges?.(),
      ranking:()=>window.renderRanking?.(),
      codes:()=>window.renderCodes?.(),
      news:()=>window.renderNews?.(),
      settings:()=>window.LutadorUltimate?.openSettings?.(),
      styles:()=>window.LutadorV8?.openStyleDialog?.()
    };
    try{return map[id]?.()}catch(e){console.warn('[V8.3] action',id,e)}
  };
  const items=[
    ['play','⚔','JOGAR','Modos e partidas'],['training','🥊','TREINO','Prática avançada'],
    ['story','📖','HISTÓRIA','Campanha narrativa'],['shop','🛒','LOJA','Central da loja'],
    ['roulette','🎰','TESTE DE SORTE','Caça-níquel por 2 PSY'],['cosmetics','✨','COSMÉTICOS','Skins e finalizações'],
    ['mastery','★','MAESTRIA','Evolução por campeão'],['profile','👤','PERFIL','Conta e estatísticas'],
    ['wardrobe','🎨','VESTIÁRIO','Equipar coleção'],['events','⚡','EVENTOS','Recompensas temporárias'],
    ['challenges','📋','DESAFIOS','Diários e semanais'],['ranking','🏆','RANKING','Classificação da arena'],
    ['codes','🔐','CÓDIGOS','Códigos oficiais'],['news','📰','NOTÍCIAS','Novidades do jogo'],
    ['settings','⚙','CONFIG.','Vídeo, áudio e controles'],['styles','◆','ESTILOS','Estilo de luta']
  ];
  function decorateLobby(){
    const menu=document.querySelector('.menu.pro-lobby-ready.v8-supreme-lobby');
    if(!menu)return;
    menu.classList.add('v83-lobby');
    const combat=menu.querySelector('.pro-combat-menu'),hero=menu.querySelector('.pro-lobby-hero'),dash=menu.querySelector('.pro-lobby-dashboard');
    if(combat) combat.style.order='1'; if(hero) hero.style.order='2'; if(dash) dash.style.order='3';
    const box=combat?.querySelector('.v8-command-center');
    if(box&&!box.classList.contains('v83-center')){
      box.classList.add('v83-center');
      const player=(typeof state!=='undefined'&&state?.playerName)||'JOGADOR';
      box.innerHTML=`<div class="v83-center-head"><div><small>CENTRAL DA ARENA</small><h3>ACESSO RÁPIDO</h3><p>${esc(player)}, escolha uma área do jogo.</p></div><span>V8.3</span></div><div class="v83-action-grid">${items.map(x=>`<button data-v83="${x[0]}"><i>${x[1]}</i><span><b>${x[2]}</b><small>${x[3]}</small></span></button>`).join('')}</div>`;
      box.querySelectorAll('[data-v83]').forEach(b=>b.onclick=()=>action(b.dataset.v83));
    }
    const heroCopy=hero?.querySelector('.pro-hero-copy');
    if(heroCopy&&!heroCopy.querySelector('.v83-hero-label')){
      const label=document.createElement('div');label.className='v83-hero-label';label.innerHTML='<small>CAMPEÃO EM DESTAQUE</small><b>ARENA PRINCIPAL</b>';
      heroCopy.prepend(label);
    }
    const prof=menu.querySelector('.pro-profile-bar'); if(prof) prof.classList.add('v83-profile-bar');
  }
  const shopCards={
    'shop-champions':['🥊','CAMPEÕES','Desbloqueie e compre lutadores para sua coleção.'],
    'shop-resources':['💠','RECURSOS','Gold, PSY e Vandais para sua progressão.'],
    'shop-roulette':['🎰','TESTE DE SORTE','Pague 2 PSY e teste sua sorte no caça-níquel.'],
    'exp-cosmetic-shop-btn':['✨','COSMÉTICOS','Skins, entradas, poses e finalizações equipáveis.'],
    'shop-help':['❓','AJUDA DA LOJA','Entenda moedas, recursos e compras do jogo.']
  };
  function decorateShop(){
    const root=document.querySelector('#app>.shop, #app .shop');
    if(!root||!root.querySelector('#shop-roulette'))return;
    root.classList.add('v83-shop-hub');
    const actions=root.querySelector('.lobby-actions'); if(!actions)return;
    actions.classList.add('v83-shop-grid');
    Object.entries(shopCards).forEach(([id,meta])=>{
      const b=actions.querySelector('#'+id); if(!b)return;
      b.classList.add('v83-shop-card');
      if(!b.querySelector('.v83-shop-card-copy')) b.innerHTML=`<i>${meta[0]}</i><span class="v83-shop-card-copy"><b>${meta[1]}</b><small>${meta[2]}</small></span><em>ABRIR →</em>`;
    });
    if(!root.querySelector('.v83-shop-title')){
      const sub=root.querySelector('.select-subtitle');
      const n=document.createElement('section');n.className='v83-shop-title';n.innerHTML='<small>MERCADO DA ARENA</small><b>TUDO EM UM SÓ LUGAR</b><span>Campeões, recursos, Teste de Sorte e cosméticos com navegação clara e sem sobreposição.</span>';
      sub?.after(n);
    }
  }
  function decorateCosmeticDialog(){
    const d=document.getElementById('exp-shop'); if(!d)return;
    d.classList.add('v83-cos-shop');
    const body=d.querySelector('.exp-dialog-body');
    if(body&&!body.querySelector('.v83-cos-head')){
      const head=document.createElement('div');head.className='v83-cos-head';head.innerHTML='<div><small>COLEÇÃO OFICIAL</small><b>PERSONALIZE SEU CAMPEÃO</b><span>Todos os itens abaixo podem ser comprados e equipados.</span></div><strong>+20 NOVOS</strong>';
      body.prepend(head);
    }
  }
  function fixProfileName(){
    const name=(typeof state!=='undefined'&&state?.playerName)||''; if(!name)return;
    document.querySelectorAll('#exp-profile .exp-profile-hero h2').forEach(h=>{if(h.textContent.trim()==='JOGADOR 1')h.textContent=name});
  }
  let queued=false;
  const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorateLobby();decorateShop();decorateCosmeticDialog();fixProfileName()})});
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{decorateLobby();decorateShop();decorateCosmeticDialog();fixProfileName()},100);
})();


/* ===== V8.4 PATCH — LOBBY LIMPO / RESET TOTAL / MARCA SORTEP NIAK ===== */
(()=>{
  'use strict';
  if(window.__LutadorV84CleanLobby)return;
  window.__LutadorV84CleanLobby=true;

  const V='8.4';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const actions={
    play:()=>window.renderModes?.(),
    training:()=>window.ProCombat?.openGuide?.(true),
    story:()=>window.renderStorySelect?.(),
    shop:()=>window.renderShop?.(),
    mastery:()=>window.LutadorExpansion?.openMastery?.(),
    profile:()=>window.LutadorV6?.openProfile?window.LutadorV6.openProfile():window.LutadorExpansion?.openProfile?.(),
    wardrobe:()=>window.LutadorV6?.openWardrobe?.(),
    events:()=>window.LutadorV6?.openEvents?.(),
    challenges:()=>window.LutadorV5?.openChallenges?.(),
    ranking:()=>window.renderRanking?.(),
    codes:()=>window.renderCodes?.(),
    news:()=>window.renderNews?.(),
    settings:()=>window.LutadorUltimate?.openSettings?.(),
    styles:()=>window.LutadorV8?.openStyleDialog?.()
  };
  const menuItems=[
    ['play','⚔','JOGAR','Modos e partidas'],
    ['training','🥊','TREINO','Prática e frame data'],
    ['story','📖','HISTÓRIA','Campanha narrativa'],
    ['shop','🛒','LOJA','Campeões, recursos e sorte'],
    ['mastery','★','MAESTRIA','Evolução por campeão'],
    ['profile','👤','PERFIL','Conta e estatísticas'],
    ['wardrobe','🎨','VESTIÁRIO','Equipar itens comprados'],
    ['events','⚡','EVENTOS','Recompensas temporárias'],
    ['challenges','📋','DESAFIOS','Diários e semanais'],
    
    ['codes','🔐','CÓDIGOS','Códigos oficiais'],
    ['news','📰','NOTÍCIAS','Atualizações do jogo'],
    ['settings','⚙','CONFIGURAÇÕES','Vídeo, áudio e controles'],
    ['styles','◆','ESTILOS DE LUTA','Escolha seu arquétipo']
  ];

  function buildTopBrand(menu){
    let bar=menu.querySelector('.v84-top-brand');
    if(!bar){
      bar=document.createElement('header');
      bar.className='v84-top-brand';
      const content=menu.querySelector('.pro-lobby-content');
      menu.insertBefore(bar,content||menu.firstChild);
    }
    const player=(typeof state!=='undefined'&&state?.playerName)||'JOGADOR';
    const sig=player+'|'+V; if(bar.dataset.sig!==sig){bar.dataset.sig=sig;bar.innerHTML=`<span class="v84-top-player">${esc(player)}</span><div class="v84-wordmark"><b>SORTEP</b><strong>NIAK</strong></div><span class="v84-top-version">V${V}</span>`;}
  }

  function cleanHero(menu){
    const hero=menu.querySelector('.pro-lobby-hero');
    if(!hero)return;
    hero.querySelectorAll('.lutador-brand,.pro-hero-copy>.logo,.pro-hero-copy>.mk-tagline').forEach(x=>x.remove());
    hero.setAttribute('aria-label','Campeão em destaque');
    const badge=hero.querySelector('.v8-hero-badge');
    if(badge){
      const small=badge.querySelector('small');
      if(small)small.textContent='CAMPEÃO EM DESTAQUE';
    }
  }

  function rebuildCenter(menu){
    const box=menu.querySelector('.v8-command-center');
    if(!box)return;
    box.classList.add('v84-center');
    const player=(typeof state!=='undefined'&&state?.playerName)||'JOGADOR';
    box.innerHTML=`<div class="v84-center-head"><div><small>CENTRAL</small><h3>MENU PRINCIPAL</h3><p>${esc(player)}, escolha onde quer entrar.</p></div></div><div class="v84-menu-grid">${menuItems.map(([id,ico,title,sub])=>`<button data-v84="${id}"><i>${ico}</i><span><b>${title}</b><small>${sub}</small></span></button>`).join('')}</div>`;
    box.querySelectorAll('[data-v84]').forEach(b=>b.onclick=()=>{try{actions[b.dataset.v84]?.()}catch(e){console.warn('[V8.4]',e)}});
  }

  function polishLobby(){
    const menu=document.querySelector('.menu.pro-lobby-ready.v8-supreme-lobby');
    if(!menu)return;
    menu.classList.add('v84-lobby');
    buildTopBrand(menu);
    cleanHero(menu);
    const box=menu.querySelector('.v8-command-center');
    if(box && !box.classList.contains('v84-center')) rebuildCenter(menu);
  }

  async function hardReset(){
    try{sessionStorage.clear()}catch(_){}
    try{sessionStorage.setItem('sortep-hard-reset','1')}catch(_){}
    try{localStorage.clear()}catch(_){}
    try{document.cookie.split(';').forEach(c=>{const n=c.split('=')[0].trim();if(n)document.cookie=`${n}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`})}catch(_){}
    try{if(window.caches?.keys){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(_){}
    try{if(indexedDB?.databases){const ds=await indexedDB.databases();ds.forEach(d=>d.name&&indexedDB.deleteDatabase(d.name))}}catch(_){}
    try{
      if(typeof state!=='undefined'){
        for(const k of Object.keys(state))delete state[k];
        Object.assign(state,{coins:0,psy:0,vandais:0,roster:['rojo'],storyShopAvailable:[],ztaaaUnlocked:false,froghUnlocked:false,kloppUnlocked:false,storyProgress:0,storyComplete:false,playerName:'',tutorialSeen:false});
      }
    }catch(_){}
    setTimeout(()=>location.reload(),80);
  }

  const previousCodes=window.renderCodes;
  if(typeof previousCodes==='function'&&!window.__v84CodesPatched){
    window.renderCodes=function(){
      const out=previousCodes.apply(this,arguments);
      const input=document.getElementById('code-input');
      const btn=document.getElementById('btn-code-submit');
      const status=document.getElementById('code-status');
      const hint=document.querySelector('.v6-code-hint');
      if(hint){
        let resetLine=hint.querySelector('[data-v84-reset]');
        if(!resetLine){resetLine=document.createElement('span');resetLine.dataset.v84Reset='1';hint.appendChild(resetLine)}
        resetLine.innerHTML='<b>REDEFINIR</b> · apaga conta, passe, moedas, Vandais, campeões, maestria, rank, cosméticos, configurações e progresso.';
      }
      if(input&&btn){
        const oldClick=btn.onclick;
        const submit=async()=>{
          if((input.value||'').trim().toUpperCase()==='REDEFINIR'){
            btn.disabled=true;
            if(status){status.textContent='♻ APAGANDO TODA A CONTA...';status.style.color='#a7f3d0'}
            await hardReset();
            return;
          }
          if(typeof oldClick==='function')oldClick.call(btn,new Event('click'));
        };
        btn.onclick=e=>{e?.preventDefault?.();submit()};
        input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submit()}};
      }
      return out;
    };
    window.__v84CodesPatched=true;
  }

  let queued=false;
  const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polishLobby()})});
  obs.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(polishLobby,100));
  setTimeout(polishLobby,150);
})();

/* ===== V8.5 PATCH — LOJA ORGANIZADA / ESC / 10 MECÂNICAS EXTRAS ===== */
(()=>{
  'use strict';
  if(window.__LutadorV85)return;
  window.__LutadorV85=true;
  const VERSION='8.5';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const game=()=>{try{return typeof fight!=='undefined'&&fight?fight:null}catch(_){return null}};
  const playerState=()=>{try{return typeof state!=='undefined'?state:null}catch(_){return null}};
  const bind=(p,action)=>{
    const side=p?.playerSlot==='p2'?'p2':'p1';
    const d={p1:{guard:'KeyK',dodge:'KeyQ'},p2:{guard:'Numpad2',dodge:'Numpad0'}};
    return window.LutadorExpansion?.data?.keybinds?.[side]?.[action]||d[side][action];
  };
  const notify=(text,tone='')=>{
    let el=document.getElementById('v85-combat-note');
    if(!el){el=document.createElement('div');el.id='v85-combat-note';document.body.appendChild(el)}
    el.className='v85-combat-note '+tone;el.textContent=text;clearTimeout(el._t);
    requestAnimationFrame(()=>el.classList.add('show'));el._t=setTimeout(()=>el.classList.remove('show'),720);
  };
  const attackKind=(src,type)=>String(src?.proKind||src?.move?.kind||type||'special').toLowerCase();
  const opponent=(f,p)=>p===f?.p1?f?.p2:f?.p1;

  /* Loja V8.5: hub enxuto, sem Passe duplicado. */
  const shopOriginal=window.renderShop;
  window.renderShop=function(){
    const s=playerState();if(!s||typeof app==='undefined')return shopOriginal?.apply(this,arguments);
    screen='shop';drawCanvas();
    app.innerHTML=`<div class="card shop mk-card mk-arena v85-shop">
      <header class="v85-shop-head"><div><small>MERCADO OFICIAL · SORTEP NIAK</small><h2>CENTRAL DA LOJA</h2><p>Compre campeões, recursos e cosméticos ou arrisque no Teste de Sorte. O Passe continua disponível somente pelo Lobby.</p></div><div class="v85-wallet"><span>🪙 <b>${Number(s.coins||0).toLocaleString('pt-BR')}</b> GOLD</span><span>💠 <b>${Number(s.psy||0).toLocaleString('pt-BR')}</b> PSY</span><span>🟪 <b>${Number(s.vandais||0).toLocaleString('pt-BR')}</b> VANDAIS</span></div></header>
      <div class="v85-shop-grid">
        <button id="shop-champions" class="v85-shop-card champ"><i>🥊</i><b>CAMPEÕES</b><small>Desbloqueie lutadores e aumente seu elenco.</small><em>ABRIR →</em></button>
        <button id="shop-resources" class="v85-shop-card resource"><i>💠</i><b>RECURSOS</b><small>Converta Gold em PSY e confira sua carteira.</small><em>ABRIR →</em></button>
        <button id="shop-roulette" class="v85-shop-card roulette"><i>🎰</i><b>TESTE DE SORTE</b><small>Caça-níquel por 2 PSY com prêmios raros.</small><em>JOGAR →</em></button>
        <button id="shop-cosmetics" class="v85-shop-card cosmetic"><i>✨</i><b>COSMÉTICOS</b><small>Skins, entradas, poses e finalizações funcionais.</small><em>VER COLEÇÃO →</em></button>
        <button id="shop-upgrades" class="v85-shop-card upgrade"><i>⬆</i><b>MELHORIAS</b><small>Evolua atributos e progressão permanente.</small><em>EVOLUIR →</em></button>
        <button id="shop-help" class="v85-shop-card help"><i>?</i><b>AJUDA</b><small>Moedas, compras, recursos e suporte.</small><em>ABRIR →</em></button>
      </div>
      <footer class="v85-shop-foot"><span>ESC · voltar ao Lobby</span><button id="btn-back" class="btn">← VOLTAR AO LOBBY</button></footer>
    </div>`;
    document.getElementById('shop-champions').onclick=()=>window.renderShopChampions?.();
    document.getElementById('shop-resources').onclick=()=>window.renderShopResources?.();
    document.getElementById('shop-roulette').onclick=()=>window.renderShopRoulette?.();
    document.getElementById('shop-cosmetics').onclick=()=>window.LutadorExpansion?.openCosmeticShop?.();
    document.getElementById('shop-upgrades').onclick=()=>window.ProProgression?.showUpgrades?.('shop');
    document.getElementById('shop-help').onclick=()=>window.renderShopHelp?.();
    document.getElementById('btn-back').onclick=()=>window.renderMenu?.();
  };

  function cleanShopInjectedPass(){
    document.querySelectorAll('.shop [data-pro-open="pass"],.shop .pro-shop-entry').forEach(el=>el.remove());
    const shop=document.querySelector('#app .v85-shop');
    if(shop){document.querySelectorAll('#app #exp-cosmetic-shop-btn').forEach(el=>el.remove())}
  }

  /* MECÂNICAS 1–5: precisão pós-parry, primeiro sangue, momentum, fadiga anti-spam e counter-hit. */
  const damageBefore=window.damage;
  if(typeof damageBefore==='function')window.damage=function(victim,amount,src,dir,type){
    const f=game(),attacker=src?.owner||(src?.id&&src!==victim?src:null),kind=attackKind(src,type),t=performance.now();
    const wasParry=!!(attacker&&victim&&attacker!==victim&&victim.v8ParryT>0&&type!=='hazard');
    let a=Number(amount)||0;
    if(attacker&&victim&&attacker!==victim){
      if((attacker.v85PrecisionT||0)>0){a*=1.18;attacker.v85PrecisionT=0;notify('GOLPE DE PRECISÃO','gold')}
      const m=clamp(attacker.v85Momentum||0,0,3);if(m>0)a*=1+m*.025;
      if(attacker.v85LastKind===kind&&t-(attacker.v85LastKindAt||0)<1250)attacker.v85Repeat=(attacker.v85Repeat||1)+1;else attacker.v85Repeat=1;
      attacker.v85LastKind=kind;attacker.v85LastKindAt=t;
      if(attacker.v85Repeat>=4){a*=.90;attacker.proStamina=Math.max(0,(attacker.proStamina??100)-3);if(attacker.human&&attacker.v85Repeat===4)notify('FADIGA DE REPETIÇÃO','red')}
      if(!victim.defend&&victim.proMove&&victim.proMove.time>=(victim.proMove.start||.08)*.7){a*=1.08;attacker.v85CounterT=.5;}
    }
    const before=Number(victim?.hp||0),r=damageBefore.call(this,victim,a,src,dir,type),after=Number(victim?.hp||0),dealt=Math.max(0,before-after);
    if(wasParry&&victim){victim.v85PrecisionT=1.65;notify('FOCO DE CONTRA-ATAQUE','gold')}
    if(dealt>0&&attacker&&victim&&attacker!==victim){
      victim.v85LastDamageAt=t;
      attacker.v85Momentum=clamp((attacker.v85Momentum||0)+1,0,3);attacker.v85MomentumT=1.45;
      if(f&&!f.v85FirstBlood){f.v85FirstBlood=true;attacker.proStamina=clamp((attacker.proStamina??100)+10,0,100);attacker.superMeter=clamp((attacker.superMeter||0)+.06,0,1);if(attacker.human)notify('PRIMEIRO SANGUE · +FOCO','gold')}
      if(attacker.v85CounterT>0&&attacker.human)notify('COUNTER HIT','cyan');
    }
    return r;
  };

  /* MECÂNICAS 6–8: Combo Breaker, Air Tech e Exaustão. */
  function comboBreaker(p){
    const f=game(),e=opponent(f,p);if(!f||!e||p.v85BreakerUsed||(p.proStamina??100)<50)return false;
    if(!(p.state==='hurt'||p.proKnockdownT>0||(e.megaCombo||e.combo||0)>=4))return false;
    p.v85BreakerUsed=true;p.proStamina=Math.max(0,(p.proStamina??100)-50);p.proKnockdownT=0;p.attackDisabledT=0;p.freezeT=0;p.vx=(p.x<e.x?-1:1)*300;p.vy=Math.max(p.vy||0,100);p.state=p.onGround?'idle':'air';
    e.megaCombo=0;e.combo=0;e.megaSequence=[];e.attackDisabledT=Math.max(e.attackDisabledT||0,.38);e.vx=(e.x>p.x?1:-1)*420;
    if(f)f.megaHitStop=Math.max(f.megaHitStop||0,.065);notify('COMBO BREAKER','cyan');return true;
  }
  function airTech(p){
    if(!p||p.onGround||p.state!=='hurt'||(p.proStamina??100)<20||(p.v85AirTechCd||0)>0)return false;
    p.proStamina=Math.max(0,(p.proStamina??100)-20);p.v85AirTechCd=1.4;p.attackDisabledT=0;p.state='air';p.vx*=.35;p.vy=Math.max(p.vy||0,170);p.megaDodgeInvuln=Math.max(p.megaDodgeInvuln||0,.13);notify('AIR TECH','cyan');return true;
  }
  document.addEventListener('keydown',e=>{
    if(e.repeat)return;const f=game();if(!f||f.paused||f.over)return;
    for(const p of [f.p1,f.p2]){
      if(!p?.human)continue;const dodge=bind(p,'dodge'),guard=bind(p,'guard');
      if(e.code===dodge){
        if(typeof controlDown==='function'&&controlDown(p,guard)&&comboBreaker(p)){if(window.justPressed)window.justPressed[dodge]=false;e.preventDefault();return}
        if(airTech(p)){if(window.justPressed)window.justPressed[dodge]=false;e.preventDefault();return}
      }
      if(e.code===guard&&typeof controlDown==='function'&&controlDown(p,dodge)&&comboBreaker(p)){if(window.justPressed)window.justPressed[guard]=false;e.preventDefault();return}
    }
  },true);

  /* MECÂNICAS 9–10 + manutenção: Last Stand e Resolve da Rodada Final. */
  const updateBefore=window.update;
  if(typeof updateBefore==='function')window.update=function(f,dt){
    const r=updateBefore.apply(this,arguments);if(!f)return r;
    for(const p of [f.p1,f.p2]){
      if(!p)continue;
      p.v85PrecisionT=Math.max(0,(p.v85PrecisionT||0)-dt);p.v85MomentumT=Math.max(0,(p.v85MomentumT||0)-dt);p.v85AirTechCd=Math.max(0,(p.v85AirTechCd||0)-dt);p.v85CounterT=Math.max(0,(p.v85CounterT||0)-dt);p.v85ExhaustedT=Math.max(0,(p.v85ExhaustedT||0)-dt);
      if(p.v85MomentumT<=0)p.v85Momentum=0;
      if((p.proStamina??100)<=.5&&p.v85ExhaustedT<=0){p.v85ExhaustedT=.9;if(p.human)notify('EXAUSTÃO','red')}
      if(p.v85ExhaustedT>0){p.vx*=.94;p.defend=false}
      if(performance.now()-(p.v85LastDamageAt||0)>2200&&!p.defend&&p.v8Guard!=null)p.v8Guard=clamp(p.v8Guard+dt*7,0,p.v8GuardMax||100);
      if(!p.v85LastStand&&p.hp>0&&p.hp/(p.maxHp||1)<=.12){p.v85LastStand=true;p.proStamina=clamp((p.proStamina??100)+25,0,100);p.v8Guard=clamp((p.v8Guard||0)+25,0,p.v8GuardMax||100);p.superMeter=clamp((p.superMeter||0)+.08,0,1);if(p.human)notify('LAST STAND','gold')}
    }
    return r;
  };
  const resetBefore=window.resetRoundForNextMatch;
  if(typeof resetBefore==='function')window.resetRoundForNextMatch=function(){
    const r=resetBefore.apply(this,arguments),f=game();if(!f)return r;f.v85FirstBlood=false;
    for(const p of [f.p1,f.p2]){p.v85BreakerUsed=false;p.v85Momentum=0;p.v85MomentumT=0;p.v85PrecisionT=0;p.v85LastStand=false;p.v85Repeat=0;}
    try{if(typeof bestOfThree!=='undefined'&&bestOfThree.active&&bestOfThree.p1Wins===1&&bestOfThree.p2Wins===1){for(const p of [f.p1,f.p2]){p.proStamina=100;p.v8Guard=p.v8GuardMax||100;p.superMeter=clamp((p.superMeter||0)+.12,0,1)}notify('RODADA FINAL · RESOLVE','gold')}}catch(_){}
    return r;
  };

  /* Limpeza visual e versão. */
  function polish(){
    cleanShopInjectedPass();
    document.querySelectorAll('.v84-top-version').forEach(x=>x.textContent='V'+VERSION);
    const shop=document.querySelector('#app .shop');if(shop&&!shop.classList.contains('v85-shop'))shop.classList.add('v85-shop-sub');
  }
  let q=false;const obs=new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;polish()})});obs.observe(document.body,{subtree:true,childList:true});
  setTimeout(polish,80);
  window.LutadorV85=Object.freeze({version:VERSION});
})();
