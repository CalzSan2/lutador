/* SORTEP NIAK — QUALITY PACK 6.0
 * Foco: combate consistente, seleção definitiva, treino avançado, narrativa,
 * HUD, chefes, perfil, eventos, acessibilidade, áudio e estabilidade.
 */
(()=>{
  'use strict';
  if(window.LutadorV6?.version)return;
  const VERSION='6.0.0';
  const KEY='lutador-v6-quality';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const game=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const gs=()=>{try{return typeof state!=='undefined'?state:null}catch(_){return null}};
  const chars=()=>{try{return typeof CHARACTERS!=='undefined'?CHARACTERS:[]}catch(_){return []}};
  const byId=id=>chars().find(c=>c.id===id);
  const exp=()=>window.LutadorExpansion?.data||null;
  const complete=()=>window.LutadorComplete?.meta||null;
  const progression=()=>window.ProProgression?.getSnapshot?.()||null;
  const fmt=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString('pt-BR');
  const defaults=()=>({
    favorites:['rojo','thuvaa'],
    recent:[],
    selectedFilter:'todos',
    profileBanner:'Arena Primordial',
    settings:{autoQuality:true,ultra:false,reduceFlash:false,reduceMotion:false,highContrast:false,largeUi:false,showHitboxes:false},
    events:{},
    perf:{fps:60,low:0,high:0,quality:'balanced'},
    watchdog:{recoveries:0},
    storySeen:{},
    lastSelected:'rojo'
  });
  let data=defaults();
  try{data={...defaults(),...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){data=defaults()}
  data.settings={...defaults().settings,...(data.settings||{})};
  data.perf={...defaults().perf,...(data.perf||{})};
  data.watchdog={...defaults().watchdog,...(data.watchdog||{})};
  if(!Array.isArray(data.favorites))data.favorites=[];
  if(!Array.isArray(data.recent))data.recent=[];
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}};

  function toast(text,tone='normal',time=1900){
    let host=document.querySelector('.v5-toast-host');
    if(!host){host=document.createElement('div');host.className='v5-toast-host';document.body.appendChild(host)}
    const el=document.createElement('div');el.className='v5-toast '+tone;el.textContent=text;host.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220)},time);
  }
  function dialog(id,title,body=''){
    let d=document.getElementById(id);if(!d){d=document.createElement('dialog');d.id=id;d.className='v6-dialog';document.body.appendChild(d)}
    d.innerHTML=`<header><div><small>SORTEP NIAK · QUALITY ${VERSION}</small><h2>${esc(title)}</h2></div><button class="v6-close" aria-label="Fechar">×</button></header><div class="v6-dialog-body">${body}</div>`;
    d.querySelector('.v6-close').onclick=()=>d.close();d.onclick=e=>{if(e.target===d)d.close()};return d;
  }

  /* ---------- REPLAY REMOVIDO ---------- */
  try{
    const raw=JSON.parse(localStorage.getItem('lutador-v5-competitive')||'{}');
    if(raw&&Object.prototype.hasOwnProperty.call(raw,'replays')){delete raw.replays;localStorage.setItem('lutador-v5-competitive',JSON.stringify(raw));}
  }catch(_){}
  const clearReplayUi=()=>{document.getElementById('v5-replays-btn')?.remove();document.getElementById('v5-replay-viewer')?.remove();document.getElementById('v5-replays')?.remove()};

  /* ---------- ARQUÉTIPOS / BALANCEAMENTO ---------- */
  const ARCH={
    rojo:['RUSHDOWN','Pressão, velocidade e sangramento'],thuvaa:['CONTROLE','Gelo, defesa e espaço'],hock:['TANQUE','Vida alta e impacto'],rtess:['TANQUE','Controle magnético'],grizz:['TANQUE','Resistência e clones'],
    knunka:['ASSASSINO','Mobilidade explosiva'],atizz:['ASSASSINO','Cortes e tempo'],klo:['TRAPACEIRO','Mobilidade e probabilidade'],klopp:['MÍMICO','Adaptação'],frogh:['MÍMICO','Cópia e transformação'],
    xillen:['ZONER','Energia à distância'],nine85:['ZONER','Controle digital'],ouip:['ZONER','Chuva e meteoros'],dart:['VERSÁTIL','Elementos imprevisíveis'],lkugh:['ZONER','Controle lunar'],jetde:['DEFENSOR','Bolhas e absorção'],
    uiye:['BRUISER','Pedra e cópia'],grogh:['COUNTER','Reflexão'],yoi:['CONTROLE','Eclipse'],vlad:['BRUISER','Dreno de vida'],perry:['CONTROLE','Folhas e árvores'],verry:['CONTROLE','Lama e lentidão'],
    flame:['ZONER','Fogo e paredes'],trefoh:['VERSÁTIL','Arcano vegetal'],jimmy:['ASSASSINO','Raios e voo'],ytiri:['TRAPACEIRO','Fumaça e cópia'],ztaaa:['BOSS','Poder de todos']
  };
  function arch(id){return ARCH[id]||['VERSÁTIL','Estilo equilibrado']}
  const BAL={RUSHDOWN:{hp:.96,dmg:1.03,speed:1.08},CONTROLE:{hp:1.03,dmg:.98,speed:.98},TANQUE:{hp:1.10,dmg:1.03,speed:.90},ASSASSINO:{hp:.93,dmg:1.07,speed:1.10},ZONER:{hp:.97,dmg:1.02,speed:.98},TRAPACEIRO:{hp:.96,dmg:1,speed:1.06},MÍMICO:{hp:1,dmg:1,speed:1.02},DEFENSOR:{hp:1.08,dmg:.94,speed:.92},BRUISER:{hp:1.05,dmg:1.04,speed:.96},COUNTER:{hp:1.03,dmg:1.01,speed:.97},VERSÁTIL:{hp:1,dmg:1,speed:1},BOSS:{hp:1,dmg:1,speed:1}};
  function applyBalance(f){
    if(!f||f.v6Balanced)return;f.v6Balanced=true;
    for(const p of [f.p1,f.p2]){
      if(!p)continue;const a=arch(p.id)[0],b=BAL[a]||BAL.VERSÁTIL;p.v6Archetype=a;
      if(f.mode!=='v5boss'&&!p.boss){const oldMax=Number(p.maxHp||p.hp)||1;p.maxHp=Math.max(1,Math.round(oldMax*b.hp));p.hp=p.maxHp;p.dmg=(Number(p.dmg)||1)*b.dmg;p.speed=(Number(p.speed)||1)*b.speed;}
      p.v6HitStun=0;p.v6Recovery=0;p.v6LastDamageAt=0;p.v6RenderX=p.x;p.v6RenderY=p.y;
    }
  }

  /* ---------- COMBAT ARBITER: anti-hit fantasma, stun, prioridade ---------- */
  const hitRegistry=new Map();
  function hitKey(attacker,victim,kind){return `${attacker?.playerSlot||attacker?.id||'x'}>${victim?.playerSlot||victim?.id||'y'}:${kind}`}
  function kindOf(src,type){return String(src?.proKind||src?.move?.kind||type||src?.weapon||'hit').toLowerCase()}
  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){
    const f=game(),attacker=src?.owner||(src?.id&&src!==victim?src:null),kind=kindOf(src,type),t=performance.now();
    if(victim?.megaDodgeInvuln>0&&attacker&&attacker!==victim)return baseDamage.apply(this,arguments);
    if(attacker&&victim&&attacker!==victim){
      const key=hitKey(attacker,victim,kind),last=hitRegistry.get(key)||0;
      const multi=/bleed|burn|poison|mud|acid/.test(kind);
      if(!multi&&t-last<72)return false;
      hitRegistry.set(key,t);
      if(hitRegistry.size>120){for(const [k,v] of hitRegistry)if(t-v>1500)hitRegistry.delete(k)}
      // Um golpe corpo a corpo não acerta de costas a uma distância absurda.
      const melee=/punch|kick|uppercut|hook|pro-|hammer|blade/.test(kind)&&!(/projectile|ray|fire|ice|orb|spear|shot|throw/.test(kind));
      if(melee&&Number.isFinite(attacker.x)&&Number.isFinite(victim.x)&&Math.abs(attacker.x-victim.x)>225)return false;
      // Rival no chão mantém a regra: somente chute corpo a corpo causa dano.
      if(victim.proKnockdownT>0&&victim.onGround&&!/kick|chute/.test(kind))return false;
    }
    let a=Number(amount)||0;
    // Mecânica de escudo dos chefes lendários.
    if(victim?.v6BossShield>0&&attacker&&attacker!==victim){const absorbed=Math.min(victim.v6BossShield,a*.72);victim.v6BossShield-=absorbed;a-=absorbed;victim.hitFlash=Math.max(victim.hitFlash||0,.06);if(a<=.01){window.ProAudio?.play?.('guard',{character:victim.id});return false;}}
    const before=Number(victim?.hp||0);const r=baseDamage.call(this,victim,a,src,dir,type);const dealt=Math.max(0,before-Number(victim?.hp||0));
    if(dealt>0&&victim){
      const heavy=dealt>55||/uppercut|hook|kick|hammer|special|ultimate/.test(kind);
      victim.attackDisabledT=Math.max(victim.attackDisabledT||0,heavy?.24:.12);victim.v6HitStun=Math.max(victim.v6HitStun||0,heavy?.22:.10);victim.v6LastDamageAt=t;
      if(f){f.megaHitStop=Math.max(f.megaHitStop||0,heavy?.072:.035);f.v6LastImpact={at:t,heavy};}
      if(attacker){attacker.v6Recovery=Math.max(attacker.v6Recovery||0,heavy?.10:.05);f&&(f.v6LastKind=kind);}
      if(attacker?.id==='rojo'&&heavy)window.ProAudio?.tone?.(82,.10,'sawtooth',.035);
      if(attacker?.id==='thuvaa'&&heavy){window.ProAudio?.tone?.(980,.08,'triangle',.022);window.ProAudio?.tone?.(1320,.11,'sine',.017,.025);}
    }
    return r;
  };

  /* ---------- HUD ---------- */
  function titleText(){return progression()?.profile?.displayTitle||'NOVO DESAFIANTE'}
  function rankText(){return 'ARENA'}
  function hudCreate(f){
    document.getElementById('v6-fight-hud')?.remove();document.querySelectorAll('.v6-combo').forEach(x=>x.remove());
    if(!f||f.mode==='tutorial')return;
    const h=document.createElement('div');h.id='v6-fight-hud';h.innerHTML=`
      <section class="v6-hud-fighter p1"><img src="ai-assets/characters/${f.p1.id}.png"><div class="v6-hud-meta"><div class="v6-hud-name"><b>${esc(f.p1.name)}</b><small>${esc(titleText())}</small></div><div class="v6-bar v6-hp"><i></i></div><div class="v6-hud-small"><div class="v6-bar v6-st"><i></i></div><div class="v6-bar v6-ult"><i></i></div></div><div class="v6-status-row"></div></div></section>
      <div class="v6-hud-center"><small>${f.mode==='ranked'?'RANKED':'ARENA'}</small><b data-v6-timer>∞</b><span data-v6-round>RODADA 1</span></div>
      <section class="v6-hud-fighter p2"><div class="v6-hud-meta"><div class="v6-hud-name"><b>${esc(f.p2.name)}</b><small>${f.p2.human?'RIVAL LOCAL':'CPU · '+String(complete()?.aiDifficulty||'normal').toUpperCase()}</small></div><div class="v6-bar v6-hp"><i></i></div><div class="v6-hud-small"><div class="v6-bar v6-st"><i></i></div><div class="v6-bar v6-ult"><i></i></div></div><div class="v6-status-row"></div></div><img src="ai-assets/characters/${f.p2.id}.png"></section>`;
    document.body.appendChild(h);
    for(const side of ['p1','p2']){const c=document.createElement('div');c.className='v6-combo '+side;c.dataset.side=side;document.body.appendChild(c)}
  }
  function statusHtml(p){const a=[];if(p.megaBleedT>0)a.push('<span class="v6-status bleed">SANGRAMENTO</span>');if(p.freezeT>0||p.megaFreezeSlowT>0)a.push('<span class="v6-status freeze">CONGELADO</span>');if(p.megaCounterT>0)a.push('<span class="v6-status counter">COUNTER</span>');if(p.proKnockdownT>0&&p.onGround)a.push('<span class="v6-status down">NO CHÃO</span>');if(p.v6BossEnrage)a.push('<span class="v6-status bleed">ENFURECIDO</span>');return a.join('')}
  let hudStamp=0;
  function hudUpdate(f){
    if(!f||performance.now()-hudStamp<45)return;hudStamp=performance.now();const h=document.getElementById('v6-fight-hud');if(!h)return;
    [['p1',f.p1],['p2',f.p2]].forEach(([side,p])=>{const root=h.querySelector('.'+side);if(!root||!p)return;const hp=clamp((p.hp||0)/(p.maxHp||1)*100,0,100),st=clamp(p.proStamina??100,0,100),ult=clamp((p.superMeter||0)*100,0,100);root.querySelector('.v6-hp i')?.style.setProperty('--pct',hp+'%');root.querySelector('.v6-st i')?.style.setProperty('--pct',st+'%');root.querySelector('.v6-ult i')?.style.setProperty('--pct',ult+'%');const sr=root.querySelector('.v6-status-row');if(sr)sr.innerHTML=statusHtml(p);const combo=document.querySelector('.v6-combo.'+side);if(combo){const n=p.megaCombo||0;combo.textContent=n>1?`${n}x COMBO`:'';combo.classList.toggle('show',n>1)}});
    const tm=h.querySelector('[data-v6-timer]');if(tm)tm.textContent=f.mode==='training'?'∞':String(Math.max(0,Math.ceil(f.timer||0)));const rd=h.querySelector('[data-v6-round]');if(rd)rd.textContent=`RODADA ${f.v5Round||bestOfThree?.round||1}`;
  }
  function hudRemove(){document.getElementById('v6-fight-hud')?.remove();document.querySelectorAll('.v6-combo,.v6-boss-shield').forEach(x=>x.remove())}

  /* ---------- START / UPDATE / DRAW HOOKS ---------- */
  const baseStart=window.startFight;
  if(typeof baseStart==='function')window.startFight=function(){
    const r=baseStart.apply(this,arguments),f=game();if(f){applyBalance(f);f.v6StartedAt=performance.now();f.v6LastHealthyAt=performance.now();data.lastSelected=f.p1?.id||data.lastSelected;save();setTimeout(()=>hudCreate(f),60)}return r;
  };
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){
    if(f){for(const p of [f.p1,f.p2]){if(!p)continue;p.v6HitStun=Math.max(0,(p.v6HitStun||0)-dt);p.v6Recovery=Math.max(0,(p.v6Recovery||0)-dt);if(p.v6HitStun>0)p.attackDisabledT=Math.max(p.attackDisabledT||0,p.v6HitStun)}}
    const r=baseUpdate.apply(this,arguments);if(!f)return r;hudUpdate(f);trainingTick(f,dt);bossMechanics(f,dt);adaptiveQualityTick();return r;
  };
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const r=baseDraw.apply(this,arguments);if(f?.mode==='training'&&data.settings.showHitboxes)drawTrainingBoxes(f);return r};
  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){
    if(!p)return baseDrawFighter.apply(this,arguments);const lx=p.x,ly=p.y;const alpha=(p.state==='hurt'||p.state==='downed') ? .52 : .30;p.v6RenderX=Number.isFinite(p.v6RenderX)?p.v6RenderX:lx;p.v6RenderY=Number.isFinite(p.v6RenderY)?p.v6RenderY:ly;p.v6RenderX+=(lx-p.v6RenderX)*alpha;p.v6RenderY+=(ly-p.v6RenderY)*alpha;
    // Nunca suaviza teleporte real acima de 280px: evita sprite “viajando” pela tela.
    if(Math.abs(lx-p.v6RenderX)>280)p.v6RenderX=lx;if(Math.abs(ly-p.v6RenderY)>220)p.v6RenderY=ly;
    p.x=p.v6RenderX;p.y=p.v6RenderY;const r=baseDrawFighter.apply(this,arguments);p.x=lx;p.y=ly;return r;
  };

  /* ---------- AI DIFERENCIADA ---------- */
  const baseAi=window.aiInput;
  if(typeof baseAi==='function')window.aiInput=function(p,f,dt){
    if(!p||!f)return baseAi.apply(this,arguments);const diff=String(f.megaAiDifficulty||complete()?.aiDifficulty||'normal');
    if(diff==='easy'&&Math.random()<dt*2.2){p.vx=0;p.defend=false;return;}
    const enemy=p===f.p1?f.p2:f.p1,dist=Math.abs((enemy?.x||0)-(p.x||0));
    if(diff==='insane'&&enemy&&dist<185&&enemy.proMove&&Math.random()<dt*8){p.defend=true;p.vx=0;if(p.megaDodgeCd<=0&&Math.random()<.32)window.justPressed[p.playerSlot==='p2'?'Numpad0':'KeyQ']=true;}
    const r=baseAi.apply(this,arguments);
    if(diff==='hard'){p.throwCd=Math.max(0,(p.throwCd||0)-dt*.10);p.specialCd=Math.max(0,(p.specialCd||0)-dt*.06)}
    if(diff==='insane'){p.throwCd=Math.max(0,(p.throwCd||0)-dt*.22);p.specialCd=Math.max(0,(p.specialCd||0)-dt*.14);if(enemy&&enemy.hp/(enemy.maxHp||1)<.28&&p.superReady)p.aiDecision=0;}
    return r;
  };

  /* ---------- TRAINING ADVANCED ---------- */
  function enhanceTrainingHud(){
    const hud=document.getElementById('v5-training-hud');if(!hud||hud.querySelector('.v6-training-extra'))return;
    const sec=document.createElement('section');sec.className='v6-training-extra';sec.innerHTML=`<button id="v6-hitboxes">▣ HITBOXES</button><button id="v6-dummy-record">● GRAVAR DUMMY</button><button id="v6-dummy-play">▶ REPRODUZIR</button><button id="v6-frame-data">FRAME DATA</button><span class="v6-train-note">Gravar Dummy: use os controles do P2 por até 4 segundos. O treino salva posição/estado e reproduz a sequência.</span>`;hud.appendChild(sec);
    sec.querySelector('#v6-hitboxes').classList.toggle('active',data.settings.showHitboxes);sec.querySelector('#v6-hitboxes').onclick=e=>{data.settings.showHitboxes=!data.settings.showHitboxes;save();e.currentTarget.classList.toggle('active',data.settings.showHitboxes)};
    sec.querySelector('#v6-dummy-record').onclick=startDummyRecord;sec.querySelector('#v6-dummy-play').onclick=startDummyPlayback;sec.querySelector('#v6-frame-data').onclick=()=>toast('FRAME DATA · vantagem estimada aparece após cada golpe','speed',1800);
  }
  function startDummyRecord(){const f=game();if(!f?.v5Training)return;f.v6DummyFrames=[];f.v6DummyRecording=true;f.v6DummyRecordAt=performance.now();f.p2.human=true;f.v5Training.dummy='record';toast('GRAVANDO DUMMY · CONTROLE O P2 POR 4s','premium',2100)}
  function startDummyPlayback(){const f=game();if(!f?.v5Training||!f.v6DummyFrames?.length){toast('GRAVE UMA SEQUÊNCIA PRIMEIRO','danger');return}f.p2.human=false;f.v6DummyPlayback=true;f.v6DummyPlayIndex=0;f.v6DummyPlayAt=performance.now();f.v5Training.dummy='playback';toast('REPRODUZINDO DUMMY','speed',1200)}
  function trainingTick(f,dt){
    if(f?.mode!=='training'||!f.v5Training)return;enhanceTrainingHud();
    const tr=f.v5Training,p=f.p2,t=performance.now();
    if(f.v6DummyRecording){f.v6DummyFrames.push({t:t-f.v6DummyRecordAt,x:p.x,y:p.y,vx:p.vx,vy:p.vy,state:p.state,facing:p.facing,defend:p.defend});if(t-f.v6DummyRecordAt>=4000){f.v6DummyRecording=false;p.human=false;tr.dummy='standing';toast(`DUMMY GRAVADO · ${f.v6DummyFrames.length} QUADROS`,'reward')}}
    if(f.v6DummyPlayback&&f.v6DummyFrames?.length){const elapsed=t-f.v6DummyPlayAt;while(f.v6DummyPlayIndex<f.v6DummyFrames.length-1&&f.v6DummyFrames[f.v6DummyPlayIndex+1].t<=elapsed)f.v6DummyPlayIndex++;const q=f.v6DummyFrames[f.v6DummyPlayIndex];if(q){p.x=q.x;p.y=q.y;p.vx=q.vx;p.vy=q.vy;p.state=q.state;p.facing=q.facing;p.defend=q.defend}if(elapsed>=f.v6DummyFrames.at(-1).t){f.v6DummyPlayback=false;tr.dummy='standing';p.state='idle'}}
    const last=Number(tr.intervalMs)||0;tr.v6FrameAdv=last?Math.round((250-last)/16.67):0;
    let note=document.getElementById('v6-training-frame-note');if(!note){note=document.createElement('div');note.id='v6-training-frame-note';note.className='v6-train-note';document.querySelector('.v6-training-extra')?.appendChild(note)}if(note)note.textContent=`VANTAGEM EST.: ${tr.v6FrameAdv>=0?'+':''}${tr.v6FrameAdv}f · RECUPERAÇÃO P1 ${Math.round((f.p1.v6Recovery||0)*60)}f · HITSTUN P2 ${Math.round((p.v6HitStun||0)*60)}f`;
  }
  function drawTrainingBoxes(f){
    try{const c=canvas.getContext('2d');c.save();c.lineWidth=2;for(const p of [f.p1,f.p2]){const floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-p.y,crouch=p.state==='crouch',down=p.proKnockdownT>0&&p.onGround,w=down?112:58,h=down?45:crouch?112:178,x=p.x-w/2,y=down?floor-42:floor-h;c.strokeStyle=p===f.p1?'#ff405c':'#67e8f9';c.fillStyle=p===f.p1?'#ff405c18':'#67e8f918';c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);if(p.proMove){const range={punch:102,kick:144,uppercut:126,forward:128,diagonal:116,doubleforward:178,crossrush:190}[p.proMove.kind]||100;c.strokeStyle='#ffe57a';const left=p.facing>0?p.x:p.x-range;c.strokeRect(left,floor-140,range,95)}}c.restore()}catch(_){ }
  }

  /* ---------- BOSS MECHANICS ---------- */
  function bossMechanics(f,dt){
    if(!f?.v5Boss||!f.p2)return;const b=f.p2,phase=f.v5Boss.phase||1;
    if(b.v6BossPhase!==phase){
      b.v6BossPhase=phase;b.v6BossShield=phase===2?Math.round(b.maxHp*.10):phase===3?Math.round(b.maxHp*.07):0;b.v6BossShieldMax=b.v6BossShield;b.v6BossEnrage=phase===3;
      // Cada fase muda também o palco do chefe, sem recarregar a luta.
      try{const map={hock:['vulcao','ruinas','primordial'],thuvaa:['geleira','cidade','primordial'],ztaaa:['espaco','ruas','primordial']},sid=(map[b.id]||[])[phase-1],next=(typeof STAGES!=='undefined'&&sid)?STAGES.find(s=>s.id===sid):null;if(next&&f.stage?.id!==next.id){f.stage=next;f.v6ArenaShiftT=1.2;const fx=document.createElement('div');fx.className='v6-arena-shift';fx.innerHTML=`<small>FASE ${phase}</small><b>${esc(next.name)}</b><span>ARENA TRANSFORMADA</span>`;document.body.appendChild(fx);requestAnimationFrame(()=>fx.classList.add('show'));setTimeout(()=>fx.remove(),1300);toast('ARENA TRANSFORMADA · '+next.name,'boss',1800)}}catch(_){ }
      bossShieldUi(b,phase);if(phase===2)toast('CHEFE · ESCUDO ATIVADO','boss',1800);if(phase===3)toast('CHEFE · ENFURECIDO · ARENA INSTÁVEL','boss',2000)
    }
    if(b.v6BossEnrage){b.speed=Math.min((b.v6BaseSpeed||(b.v6BaseSpeed=b.speed))*1.18,b.v6BaseSpeed*1.18);b.dmg=Math.min((b.v6BaseDmg||(b.v6BaseDmg=b.dmg))*1.12,b.v6BaseDmg*1.12)}
    bossShieldUi(b,phase);
  }
  function bossShieldUi(b,phase){let el=document.querySelector('.v6-boss-shield');if(!b||!game()?.v5Boss){el?.remove();return}if(!el){el=document.createElement('div');el.className='v6-boss-shield';document.body.appendChild(el)}const pct=b.v6BossShieldMax?clamp(b.v6BossShield/b.v6BossShieldMax*100,0,100):0;el.style.setProperty('--shield',pct+'%');el.innerHTML=`CHEFE · FASE ${phase} · ${b.v6BossEnrage?'ENFURECIDO':'PADRÃO ATIVO'}${b.v6BossShieldMax?` · ESCUDO ${Math.ceil(pct)}%`:''}<i></i>`}

  /* ---------- MATCH HISTORY / PREMIUM RESULT ---------- */
  const baseResult=window.showMatchResult;
  if(typeof baseResult==='function')window.showMatchResult=function(won,options={}){
    const f=game();if(f&&f.mode!=='training'&&f.mode!=='tutorial'&&!f.v6HistorySaved){f.v6HistorySaved=true;data.recent.unshift({at:Date.now(),won:!!won,p1:f.p1?.id,p2:f.p2?.id,p1n:f.p1?.name,p2n:f.p2?.name,mode:f.mode,stage:f.stage?.name||'',damage:Math.round(f.megaStats?.p1?.damage||0),combo:f.megaStats?.p1?.maxCombo||0});data.recent=data.recent.slice(0,10);save()}
    const r=baseResult.apply(this,arguments);setTimeout(()=>{hudRemove();const card=document.querySelector('#match-result-overlay .match-result-card');if(card&&!card.querySelector('.v6-result-stamp')){const stamp=document.createElement('div');stamp.className='v6-result-stamp';stamp.innerHTML=`<small>QUALITY 6.0</small><b>${won?'VITÓRIA REGISTRADA':'RELATÓRIO SALVO'}</b><span>${esc(titleText())}</span>`;card.querySelector('.match-result-actions')?.before(stamp)}},25);return r;
  };

  /* ---------- SELEÇÃO DEFINITIVA ---------- */
  function buildSelection(){
    const root=document.querySelector('.select.mk-arena');if(!root)return;root.classList.add('v6-select');
    if(!root.querySelector('.v6-select-tools')){const tools=document.createElement('section');tools.className='v6-select-tools';tools.innerHTML=`<input class="v6-select-search" placeholder="Buscar campeão, arquétipo ou função..." aria-label="Buscar campeão"><div class="v6-filter-row"><button data-v6-filter="todos">TODOS</button><button data-v6-filter="favoritos">★ FAVORITOS</button><button data-v6-filter="RUSHDOWN">RUSHDOWN</button><button data-v6-filter="CONTROLE">CONTROLE</button><button data-v6-filter="TANQUE">TANQUE</button><button data-v6-filter="ASSASSINO">ASSASSINO</button><button data-v6-filter="ZONER">ZONER</button></div><button class="v6-random">🎲 ALEATÓRIO</button>`;root.querySelector('.select-subtitle')?.after(tools);
      tools.querySelector('.v6-select-search').oninput=applySelectionFilter;tools.querySelectorAll('[data-v6-filter]').forEach(b=>b.onclick=()=>{data.selectedFilter=b.dataset.v6Filter;save();applySelectionFilter()});tools.querySelector('.v6-random').onclick=()=>{const visible=[...root.querySelectorAll('.mk-fighter[data-id]:not(.v6-hidden)')];const c=visible[Math.floor(Math.random()*visible.length)];c?.scrollIntoView({block:'center',behavior:data.settings.reduceMotion?'auto':'smooth'});c?.dispatchEvent(new Event('mouseenter'));setTimeout(()=>c?.click(),220)}}
    root.querySelectorAll('.mk-fighter[data-id]').forEach(card=>{const id=card.dataset.id,portrait=card.querySelector('.mk-portrait');if(!portrait)return;if(!portrait.querySelector('.v6-archetype')){const tag=document.createElement('span');tag.className='v6-archetype';tag.textContent=arch(id)[0];portrait.appendChild(tag)}if(!portrait.querySelector('.v6-fav')){const fav=document.createElement('button');fav.type='button';fav.className='v6-fav';fav.textContent='★';fav.title='Favoritar';fav.classList.toggle('active',data.favorites.includes(id));fav.onclick=e=>{e.preventDefault();e.stopPropagation();const i=data.favorites.indexOf(id);if(i>=0)data.favorites.splice(i,1);else data.favorites.push(id);save();fav.classList.toggle('active',data.favorites.includes(id));applySelectionFilter()};portrait.appendChild(fav)}});
    applySelectionFilter();
  }
  function applySelectionFilter(){const root=document.querySelector('.v6-select');if(!root)return;const q=(root.querySelector('.v6-select-search')?.value||'').trim().toLowerCase(),filter=data.selectedFilter||'todos';root.querySelectorAll('[data-v6-filter]').forEach(b=>b.classList.toggle('active',b.dataset.v6Filter===filter));let count=0;root.querySelectorAll('.mk-fighter[data-id]').forEach(card=>{const id=card.dataset.id,c=byId(id),a=arch(id),text=`${c?.name||id} ${a.join(' ')} ${typeof ABILITIES!=='undefined'?(ABILITIES[id]?.role||''):''}`.toLowerCase();const fOK=filter==='todos'||(filter==='favoritos'&&data.favorites.includes(id))||a[0]===filter;const ok=fOK&&(!q||text.includes(q));card.classList.toggle('v6-hidden',!ok);if(ok)count++});let empty=root.querySelector('.v6-select-empty');if(!count){if(!empty){empty=document.createElement('div');empty.className='v6-select-empty';empty.textContent='Nenhum campeão encontrado com este filtro.';root.querySelector('.mk-roster')?.appendChild(empty)}}else empty?.remove()}
  const baseSelect=window.renderSelect;if(typeof baseSelect==='function')window.renderSelect=function(){const r=baseSelect.apply(this,arguments);setTimeout(buildSelection,10);return r};
  const baseDetail=window.renderCharacterDetail||window.showCharacterDetail;if(typeof baseDetail==='function'){const name=window.renderCharacterDetail?'renderCharacterDetail':'showCharacterDetail';window[name]=function(id){data.lastSelected=id||data.lastSelected;save();const r=baseDetail.apply(this,arguments);setTimeout(buildSelection,0);return r}}

  /* ---------- PROFILE ---------- */
  function favoriteId(){const stats=exp()?.stats?.byFighter||{};const top=Object.entries(stats).sort((a,b)=>(b[1]?.matches||0)-(a[1]?.matches||0))[0]?.[0];return top||data.lastSelected||data.favorites[0]||'rojo'}
  function masteryLevel(id){const m=exp()?.mastery?.[id];return Math.max(1,Math.min(20,1+Math.floor((Number(m?.xp)||0)/260)))}
  function openProfile(){const id=favoriteId(),c=byId(id)||byId('rojo'),e=exp(),st=e?.stats||{},p=progression();const body=`<section class="v6-profile-hero" style="--pc:${c?.color||'#ff304e'}"><img src="ai-assets/characters/${c?.id||'rojo'}.png"><div><small>${esc(p?.profile?.displayTitle||'NOVO DESAFIANTE')}</small><h3>${esc(c?.name||'ROJO')} · FAVORITO</h3><p>${esc(arch(c?.id)[1])} · Maestria ${masteryLevel(c?.id)}</p></div></section><div class="v6-profile-grid"><div><small>NÍVEL</small><b>${p?.profile?.level||1}</b></div><div><small>PARTIDAS</small><b>${fmt(st.matches||0)}</b></div><div><small>VITÓRIAS</small><b>${fmt(st.wins||0)}</b></div><div><small>DERROTAS</small><b>${fmt(st.losses||0)}</b></div><div><small>MAIOR COMBO</small><b>${fmt(st.maxCombo||0)}x</b></div><div><small>DANO TOTAL</small><b>${fmt(st.totalDamage||0)}</b></div><div><small>ULTIMATES</small><b>${fmt(st.ultimates||0)}</b></div><div><small>MAESTRIA</small><b>${masteryLevel(c?.id)}</b></div></div><section class="v6-history"><h3>HISTÓRICO RECENTE · SEM REPLAY</h3>${data.recent.length?data.recent.map(x=>`<div class="v6-history-row"><span>${new Date(x.at).toLocaleString('pt-BR')} · ${esc(x.p1n)} vs ${esc(x.p2n)}</span><b class="${x.won?'win':'loss'}">${x.won?'VITÓRIA':'DERROTA'}</b><span>${fmt(x.damage)} dano · ${x.combo}x</span></div>`).join(''):'<p>Nenhuma partida registrada nesta versão.</p>'}</section>`;const d=dialog('v6-profile','PERFIL DO JOGADOR',body);if(!d.open)d.showModal()}

  /* ---------- WARDROBE ---------- */
  const equipMap={skins:'skin',titles:'title',frames:'frame',entrances:'entrance',victories:'victory',finishers:'finisher'};
  function openWardrobe(){const e=exp();if(!e){toast('COLEÇÃO AINDA NÃO CARREGOU','danger');return}const id=data.lastSelected||favoriteId(),c=byId(id)||byId('rojo');const cats=[['skins','SKINS'],['titles','TÍTULOS'],['frames','MOLDURAS'],['entrances','ENTRADAS'],['victories','POSES'],['finishers','FINALIZAÇÕES']];const list=(key)=>{const arr=Array.from(new Set(['Padrão',...(e.owned?.[key]||[])]));const eq=e.equipped?.[equipMap[key]];return arr.map((v,i)=>`<button data-v6-equip="${key}" data-value="${esc(v)}" class="${eq===v?'active':''}">${esc(v)}<span class="v6-rarity">${i===0?'BASE':i>4?'LENDÁRIO':'RARO'}</span></button>`).join('')};const body=`<div class="v6-wardrobe"><aside class="v6-wardrobe-preview"><img src="ai-assets/characters/${c.id}.png"><small>PREVIEW ANIMADO</small><h3>${esc(c.name)}</h3><p>${esc(arch(c.id)[0])} · ${esc(arch(c.id)[1])}</p></aside><main class="v6-wardrobe-cats">${cats.map(([k,n])=>`<section><h4>${n}</h4><div class="v6-cos-list">${list(k)}</div></section>`).join('')}</main></div>`;const d=dialog('v6-wardrobe','VESTIÁRIO & COSMÉTICOS',body);d.querySelectorAll('[data-v6-equip]').forEach(b=>b.onclick=()=>{const k=b.dataset.v6Equip,val=b.dataset.value;e.equipped[equipMap[k]]=val;window.LutadorExpansion?.save?.();toast('EQUIPADO · '+val,'premium');d.close();setTimeout(openWardrobe,0)});if(!d.open)d.showModal()}

  /* ---------- TEMPORARY EVENTS ---------- */
  function currentEvent(){const week=Math.floor(Date.now()/(7*86400000))%3;return [
    {id:'rojo-week',name:'SEMANA DO ROJO',color:'#ff304e',desc:'Pressão total. Vença partidas com Rojo e faça combos.',tasks:[['win-rojo','Vença 3 vezes com Rojo',3,'wins',650,8],['combo-rojo','Faça combo de 8+',8,'combo',450,5],['dmg-rojo','Cause 2.500 de dano com Rojo',2500,'damage',900,10]]},
    {id:'ice-war',name:'GUERRA DE GELO',color:'#67e8f9',desc:'Thuvaa assume a Arena. Congele, controle e vença.',tasks:[['win-thuvaa','Vença 3 vezes com Thuvaa',3,'wins',650,8],['combo-ice','Faça combo de 7+',7,'combo',450,5],['dmg-ice','Cause 2.000 de dano com Thuvaa',2000,'damage',900,10]]},
    {id:'primordial-cup',name:'COPA PRIMORDIAL',color:'#f5cf77',desc:'Qualquer campeão. O foco é vencer e dominar a Arena.',tasks:[['wins-any','Vença 5 partidas',5,'wins',1000,12],['combo-any','Faça combo de 10+',10,'combo',800,8],['damage-any','Cause 5.000 de dano',5000,'damage',1500,15]]}
  ][week]}
  function eventState(ev){return data.events[ev.id]||(data.events[ev.id]={wins:0,combo:0,damage:0,claimed:[]})}
  function openEvents(){const ev=currentEvent(),st=eventState(ev),end=(Math.floor(Date.now()/(7*86400000))+1)*7*86400000,days=Math.max(1,Math.ceil((end-Date.now())/86400000));const body=`<section class="v6-event-hero" style="--event:${ev.color}"><div><small>EVENTO TEMPORÁRIO</small><h3>${esc(ev.name)}</h3><p>${esc(ev.desc)}</p></div><div class="v6-event-timer">${days} DIAS</div></section><div class="v6-event-grid">${ev.tasks.map(([id,label,target,key,gold,vand])=>{const prog=Math.min(target,st[key]||0),done=st.claimed.includes(id),ready=prog>=target;return `<article class="v6-event-card ${done?'done':''}"><small>${prog}/${target}</small><h4>${esc(label)}</h4><p>Recompensa: ${fmt(gold)} Gold · ${vand} Vandais</p><button class="btn" data-event-claim="${id}" ${ready&&!done?'':'disabled'}>${done?'RESGATADO':ready?'RESGATAR':'EM PROGRESSO'}</button></article>`}).join('')}</div>`;const d=dialog('v6-events','EVENTOS DA ARENA',body);d.querySelectorAll('[data-event-claim]').forEach(b=>b.onclick=()=>{const task=ev.tasks.find(t=>t[0]===b.dataset.eventClaim);if(!task)return;const [id,,,,gold,vand]=task;if(st.claimed.includes(id))return;st.claimed.push(id);const s=gs();if(s){s.coins=(Number(s.coins)||0)+gold;s.vandais=(Number(s.vandais)||0)+vand;try{persist()}catch(_){}}save();toast(`EVENTO · +${gold} GOLD · +${vand} VANDAIS`,'reward');d.close();setTimeout(openEvents,0)});if(!d.open)d.showModal()}
  function recordEvent(f,won){if(!f||f.v6EventSaved||f.mode==='training'||f.mode==='tutorial')return;f.v6EventSaved=true;const ev=currentEvent(),st=eventState(ev),id=f.p1?.id,allowed=ev.id==='rojo-week'?id==='rojo':ev.id==='ice-war'?id==='thuvaa':true;if(!allowed)return;if(won)st.wins++;st.combo=Math.max(st.combo,Number(f.megaStats?.p1?.maxCombo)||0);st.damage+=Math.round(Number(f.megaStats?.p1?.damage)||0);save()}
  // recordEvent precisa ocorrer antes de fight ser descartada; usa segundo wrapper de resultado.
  const resultForEvent=window.showMatchResult;if(typeof resultForEvent==='function')window.showMatchResult=function(won){recordEvent(game(),!!won);return resultForEvent.apply(this,arguments)};

  /* ---------- STORY: CENAS CONTADAS ANTES E DEPOIS ---------- */
  const STORY={
    nine85:{title:'A FALHA',intro:['Uma transmissão invade a Arena. Nomes, vitórias e memórias começam a desaparecer do placar.','Nine85 surge dentro do próprio código e aponta uma lança de dados para Rojo.'],dialog:['NINE85','Você luta para ser lembrado. Eu luto para provar que nada merece durar.'],after:'A derrota de Nine85 revela um mapa quebrado. Cada fragmento aponta para um Refúgio e para alguém que não confia em Rojo.'},
    knunka:{title:'CAÇADOR DE RELÂMPAGOS',intro:['O mapa leva ao Distrito Neon, onde a energia salta entre os prédios como relâmpagos presos.','Knunka protege o primeiro Refúgio e confunde Rojo com um invasor.'],dialog:['KNUNKA','Se veio pelo núcleo, vai ter que passar por mim.'],after:'Knunka entende que a ameaça é maior que a rivalidade e entrega a primeira coordenada.'},
    uiye:{title:'A PEDRA QUE LEMBRA',intro:['Nas ruínas, as paredes repetem vozes de campeões esquecidos.','Uiye segura um fragmento capaz de fechar um portal, mas exige prova de controle.'],dialog:['UIYE','Força sem memória vira destruição. Mostre que sabe o que carrega.'],after:'O fragmento reage à Chave Rubra de Rojo e revela que ele já esteve ali antes.'},
    thuvaa:{title:'INVERNO PRIMORDIAL',intro:['A temperatura cai. Um caminho inteiro congela antes que Rojo consiga atravessar.','Thuvaa não é inimigo: ele está congelando o portal para impedir que algo escape.'],dialog:['THUVAA','Se quebrar meu selo, eu congelo você junto com o vazio.'],after:'O gelo preserva uma mensagem antiga: a Arena foi construída sobre um núcleo que nunca deveria ser aberto.'},
    ztaaa:{title:'O ARQUITETO DO VAZIO',intro:['Os Refúgios se alinham e o céu se abre sobre a Arena Primordial.','Ztaaa revela que provocou a crise para obrigar Rojo a reunir todas as chaves.'],dialog:['ZTAAA','Eu não quero destruir sua história. Quero ser o único capaz de escrevê-la.'],after:'Com Ztaaa derrotado, Rojo escolhe selar o núcleo. A Arena volta a pertencer aos lutadores.'},
    frogh:{title:'A ÚLTIMA MUTAÇÃO',intro:['O núcleo fechado ainda pulsa. Uma criatura absorve resíduos de todos os poderes usados na guerra.','Frogh é a consequência viva de cada batalha da campanha.'],dialog:['FROGH','Toda força deixa uma marca. Eu sou a marca que vocês criaram.'],after:'Rojo vence sem destruir Frogh. O novo guardião decide que a Arena protegerá até aquilo que nasceu dos seus erros.'}
  };
  function storyData(id,index){const base=STORY[id];if(base)return base;const c=byId(id),a=typeof ABILITIES!=='undefined'?ABILITIES[id]:null;return{title:`CAPÍTULO ${index+1}`,intro:[`Rojo chega ao território de ${c?.name||id}. O caminho para o próximo Refúgio está bloqueado.`,`${c?.name||id} carrega uma pista sobre o núcleo, mas não pretende entregá-la sem um duelo.`],dialog:[String(c?.name||id).toUpperCase(),a?.desc||'A Arena escolhe seus guardiões através da batalha.'],after:`Com ${c?.name||id} derrotado, uma nova rota é aberta e outro pedaço da verdade sobre a Chave Rubra aparece.`}}
  function launchStoryFight(playerId,index,bossId){try{playerId='rojo';if(!gs().roster.includes('rojo'))gs().roster.unshift('rojo');storyBattle={playerId,bossId,index};startFight(playerId,'story',bossId)}catch(e){console.error('[V6 STORY]',e);toast('ERRO AO INICIAR CAPÍTULO','danger')}}
  window.startStory=function(playerId){const s=gs();if(!s)return;playerId='rojo';if(!s.storyComplete&&(s.storyProgress||0)>=STORY_SEQUENCE.length)s.storyProgress=0;const index=s.storyComplete?0:(s.storyProgress||0),bossId=STORY_SEQUENCE[index];if(!bossId)return renderStorySelect();const scene=storyData(bossId,index),c=byId(bossId);showStoryPages(scene,c,index,()=>launchStoryFight(playerId,index,bossId))};
  function showStoryPages(scene,c,index,onFight){let page=0;const pages=[scene.intro[0],scene.intro[1],scene.dialog[1]],overlay=document.createElement('div');overlay.id='v6-story-cinematic';overlay.style.setProperty('--story-color',c?.color||'#ff304e');document.body.appendChild(overlay);const render=()=>{const isDialog=page===2;overlay.innerHTML=`<div class="v6-story-card"><section class="v6-story-copy"><small>CAPÍTULO ${index+1} · ${esc(scene.title)}</small><h1>${esc(c?.name||'ARENA')}</h1><p>${esc(pages[page])}</p>${isDialog?`<div class="v6-story-dialogue"><b>${esc(scene.dialog[0])}</b><span>“${esc(scene.dialog[1])}”</span></div>`:''}<div class="v6-story-progress">${pages.map((_,i)=>`<i class="${i===page?'active':''}"></i>`).join('')}</div><div class="v6-story-actions"><button class="btn" id="v6-story-back">${page?'← VOLTAR':'SAIR'}</button><button class="btn big" id="v6-story-next">${page===pages.length-1?'⚔ LUTAR':'CONTINUAR →'}</button></div></section><aside class="v6-story-art"><img src="ai-assets/characters/${c?.id||'rojo'}.png"></aside></div>`;overlay.querySelector('#v6-story-back').onclick=()=>{if(page){page--;render()}else{overlay.remove();renderStorySelect()}};overlay.querySelector('#v6-story-next').onclick=()=>{if(page<pages.length-1){page++;render()}else{overlay.classList.remove('show');setTimeout(()=>{overlay.remove();onFight()},220)}}};render();requestAnimationFrame(()=>overlay.classList.add('show'))}
  window.advanceStoryAfterWin=function(){
    if(typeof storyBattle==='undefined'||!storyBattle)return;
    const sb=storyBattle,index=sb.index||0,id=STORY_SEQUENCE[index],scene=storyData(id,index);
    try{storyOffer(id)}catch(_){}
    const s=gs();if(!s)return;
    s.storyProgress=index+1;
    if(s.storyProgress>=STORY_SEQUENCE.length){s.storyComplete=true;s.storyProgress=STORY_SEQUENCE.length;}
    try{persist()}catch(_){}
    storyBattle=null;
    setTimeout(()=>showStoryAfter(scene,id,index),620);
  };
  function showStoryAfter(scene,id,index){const d=dialog('v6-story-after','HISTÓRIA · APÓS A BATALHA',`<section class="v6-story-summary"><small>CAPÍTULO ${index+1} CONCLUÍDO</small><h3>${esc(scene.title)}</h3><p>${esc(scene.after)}</p><p><b>${esc(byId(id)?.name||id)}</b> agora pode aparecer como recompensa/compra conforme o progresso da campanha.</p><button class="btn big" id="v6-story-map">CONTINUAR NO MAPA</button></section>`);d.querySelector('#v6-story-map').onclick=()=>{d.close();renderStorySelect()};if(!d.open)d.showModal()}

  /* ---------- ACCESSIBILITY / PERFORMANCE ---------- */
  function applySettings(){const b=document.body;b.classList.toggle('v6-reduce-flash',!!data.settings.reduceFlash);b.classList.toggle('v6-reduce-motion',!!data.settings.reduceMotion);b.classList.toggle('v6-high-contrast',!!data.settings.highContrast);b.classList.toggle('v6-large-ui',!!data.settings.largeUi);b.classList.toggle('v6-ultra-performance',!!data.settings.ultra)}
  let perfFrames=0,perfAt=performance.now();function adaptiveQualityTick(){perfFrames++;const t=performance.now();if(t-perfAt<1200)return;const fps=Math.round(perfFrames*1000/(t-perfAt));perfFrames=0;perfAt=t;data.perf.fps=fps;if(!data.settings.autoQuality)return;if(fps<38){data.perf.low++;data.perf.high=0}else if(fps>57){data.perf.high++;data.perf.low=Math.max(0,data.perf.low-1)}else{data.perf.low=Math.max(0,data.perf.low-1);data.perf.high=Math.max(0,data.perf.high-1)}if(data.perf.low>=3&&!data.settings.ultra){data.settings.ultra=true;data.perf.quality='ultra';data.perf.low=0;applySettings();save();toast('ULTRA PERFORMANCE ATIVADO AUTOMATICAMENTE','speed',2600)}else if(data.perf.high>=10&&data.settings.ultra){data.settings.ultra=false;data.perf.quality='balanced';data.perf.high=0;applySettings();save();toast('QUALIDADE EQUILIBRADA RESTAURADA','speed',2200)}}
  function enhanceSettings(){const grid=document.querySelector('.ultimate-settings.settings-grid');if(!grid||grid.querySelector('.v6-access-panel'))return;const p=document.createElement('section');p.className='v6-access-panel';p.innerHTML=`<h4>ACESSIBILIDADE & PERFORMANCE</h4><div class="v6-access-grid"><label>Qualidade automática <input type="checkbox" data-v6-setting="autoQuality" ${data.settings.autoQuality?'checked':''}></label><label>Ultra Performance <input type="checkbox" data-v6-setting="ultra" ${data.settings.ultra?'checked':''}></label><label>Reduzir flashes <input type="checkbox" data-v6-setting="reduceFlash" ${data.settings.reduceFlash?'checked':''}></label><label>Reduzir movimento <input type="checkbox" data-v6-setting="reduceMotion" ${data.settings.reduceMotion?'checked':''}></label><label>Alto contraste <input type="checkbox" data-v6-setting="highContrast" ${data.settings.highContrast?'checked':''}></label><label>Interface maior <input type="checkbox" data-v6-setting="largeUi" ${data.settings.largeUi?'checked':''}></label><label>Preset de controle <select data-v6-preset><option value="">PERSONALIZADO</option><option value="classic">CLÁSSICO</option><option value="arrows">SETAS / NUMPAD</option></select></label><label>FPS atual <b>${data.perf.fps||60}</b></label><label>Modo <b>${data.settings.ultra?'ULTRA PERFORMANCE':'EQUILIBRADO'}</b></label></div>`;grid.appendChild(p);p.querySelectorAll('[data-v6-setting]').forEach(i=>i.onchange=()=>{data.settings[i.dataset.v6Setting]=i.checked;save();applySettings()});p.querySelector('[data-v6-preset]').onchange=e=>applyControlPreset(e.target.value)}
  function applyControlPreset(name){const e=exp();if(!e||!name)return;if(name==='classic'){Object.assign(e.keybinds.p1,{left:'KeyA',right:'KeyD',jump:'KeyW',crouch:'KeyS',power:'KeyJ',punch:'KeyI',kick:'KeyO',hook:'KeyG',guard:'KeyK',ultimate:'KeyL',dodge:'KeyQ'});}if(name==='arrows'){Object.assign(e.keybinds.p2,{left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',crouch:'ArrowDown',power:'Numpad1',punch:'Numpad5',kick:'Numpad6',hook:'Numpad4',guard:'Numpad2',ultimate:'Numpad3',dodge:'Numpad0'});}window.LutadorExpansion?.save?.();toast('PRESET DE CONTROLE APLICADO','reward')}

  /* ---------- LOBBY POLISH ---------- */
  function lobbyPolish(){const menu=document.querySelector('.menu');if(!menu)return;menu.classList.add('v6-lobby');const id=favoriteId();menu.style.setProperty('--v6-lobby-art',`url('ai-assets/characters/${id}.png')`);const actions=menu.querySelector('.lobby-actions');if(actions&&!document.querySelector('.v6-lobby-actions')){const box=document.createElement('div');box.className='v6-lobby-actions';box.innerHTML='<button class="btn" id="v6-profile-btn">👤 PERFIL</button><button class="btn" id="v6-wardrobe-btn">🎨 VESTIÁRIO</button><button class="btn" id="v6-events-btn">⚡ EVENTOS</button>';actions.after(box);box.querySelector('#v6-profile-btn').onclick=openProfile;box.querySelector('#v6-wardrobe-btn').onclick=openWardrobe;box.querySelector('#v6-events-btn').onclick=openEvents}if(!menu.querySelector('.v6-live-strip')){const ev=currentEvent(),strip=document.createElement('section');strip.className='v6-live-strip';strip.innerHTML=`<b>AO VIVO · ${esc(ev.name)}</b><span>${esc(ev.desc)}</span><i>${fmt(gs()?.vandais||0)} VANDAIS</i>`;menu.querySelector('.lobby-actions')?.before(strip)}}

  /* ---------- WATCHDOG ---------- */
  let watchdogTimer=setInterval(()=>{try{clearReplayUi();applySettings();const f=game();if(!f||typeof screen==='undefined'||screen!=='fight')return;for(const p of [f.p1,f.p2]){if(!p)continue;if(!Number.isFinite(p.x)){p.x=p===f.p1?W*.3:W*.7;data.watchdog.recoveries++}if(!Number.isFinite(p.y))p.y=0;if(!Number.isFinite(p.hp))p.hp=Math.max(1,p.maxHp||100);p.x=clamp(p.x,18,(typeof W!=='undefined'?W:1600)-18);p.y=clamp(p.y,-20,900);if(p.state==='ko'&&p.hp>0&&!(f.over||f.matchOver))p.state='idle'}const lists=['sparks','proProjectiles','proImpacts','knives','swords','orbs','flowers','rays','lightnings','smokeBombs','ytiriCopyFx','grizzLaserFx','dartEffects','lkughEffects','hockMoonFx'];for(const k of lists){const a=k==='sparks'?(typeof sparks!=='undefined'?sparks:null):f[k];if(Array.isArray(a)&&a.length>(data.settings.ultra?45:160))a.splice(0,a.length-(data.settings.ultra?45:160))}if(!f.paused&&performance.now()-(f.lastTime||performance.now())>1600){data.watchdog.recoveries++;f.lastTime=performance.now();requestAnimationFrame(loop);toast('WATCHDOG · LOOP DE COMBATE RECUPERADO','speed',1800)}save()}catch(e){console.warn('[V6 watchdog]',e)}},1000);

  /* ---------- DOM OBSERVER ---------- */
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clearReplayUi();buildSelection();enhanceTrainingHud();enhanceSettings();lobbyPolish()})});observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.code==='F3'&&game()?.mode==='training'){data.settings.showHitboxes=!data.settings.showHitboxes;save();toast('HITBOXES '+(data.settings.showHitboxes?'ATIVADAS':'DESATIVADAS'),'speed')}} ,true);
  window.addEventListener('beforeunload',()=>save());
  applySettings();clearReplayUi();setTimeout(()=>{lobbyPolish();buildSelection();enhanceSettings()},80);

  window.LutadorV6=Object.freeze({version:VERSION,data,save,openProfile,openWardrobe,openEvents,applySettings,arch});
})();
