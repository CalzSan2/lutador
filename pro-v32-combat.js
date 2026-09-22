/* V32: local input reliability, committed Supers and a measurable training lab.
 * Online simulation and the island's separate combat engine are deliberately excluded.
 */
(()=>{
  'use strict';
  if(window.NiakV32Combat)return;
  const VERSION='32.0.0',KEY='niak-v32-combat';
  const features=Object.freeze([
    ['super-commit','Super confirmado','A cinemática confirma o golpe uma vez, preserva o poder original e consome a barra; callbacks de rounds antigos são descartados.'],
    ['focus-pause','Pausa ao perder foco','Lutas locais pausam ao trocar de janela, impedindo derrotas enquanto o jogo está oculto.'],
    ['pause-fence','Retorno da pausa seguro','Comandos de combate apertados durante a pausa não disparam ao continuar.'],
    ['recovery-buffer','Tolerância na recuperação','Um comando de ataque pode aguardar até 140 ms pelo fim de um bloqueio curto, sem repetir golpes.'],
    ['landing-buffer','Pulo ao aterrissar','Um toque de pulo até 100 ms antes de tocar o chão é executado na aterrissagem.'],
    ['jump-lock','Pulo respeita imobilização','O atalho direto de pulo deixa de escapar de congelamento, queda, armadilha e cinemática.'],
    ['typing-fence','Digitação sem golpes','Campos editáveis, caixas de texto e diálogos não enviam teclas à luta local.'],
    ['combat-ledger','Registro de combate','Os últimos 60 eventos registram golpes, dano, bloqueios e Supers sem crescimento ilimitado de memória.'],
    ['whiff-study','Análise de golpes no vazio','O treino distingue golpes corpo a corpo concluídos sem contato de golpes interrompidos.'],
    ['accuracy-study','Precisão por técnica','O laboratório mede tentativas, contatos e interrupções separadamente para cada técnica corpo a corpo.'],
    ['frame-phases','Fases do golpe','O treino mostra preparação, janela ativa e recuperação a partir dos tempos reais do motor.'],
    ['range-ruler','Régua de alcance','O treino desenha o alcance frontal real da técnica e informa a distância até o alvo.'],
    ['input-history','Histórico de comandos','Os últimos 12 toques do jogador ficam visíveis no treino para conferir a execução.'],
    ['side-switch','Treino dos dois lados','F7 troca os lados e orienta os lutadores para praticar comandos espelhados.'],
    ['position-bookmark','Marca de posição','F6 memoriza as posições de treino; Shift+F6 restaura a distância para repetir um exercício.'],
    ['cooldown-readout','Recarga legível','J e L exibem segundos de recarga e disponibilidade junto ao lutador controlado.'],
    ['crossup-feedback','Defesa pelo lado correto','Golpes recebidos pelas costas exibem um aviso claro para explicar por que a guarda falhou.'],
    ['status-countdown','Tempos de efeitos','Congelamento, silêncio, lentidão, queda e parada temporal recebem nome e tempo restante.'],
    ['resource-reason','Motivo do comando bloqueado','A tentativa mostra exatamente quanta stamina falta, se o Super está carregando ou quanto resta de recarga.'],
    ['training-slow','Treino em câmera lenta','F8 alterna treino a 50% e 100%, mantendo a física no mesmo passo proporcional.']
  ].map(([id,name,description])=>Object.freeze({id:`combat-${id}`,name,description})));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const now=()=>performance.now();
  const game=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const width=()=>typeof W==='number'?W:1600;
  const training=f=>!!(f?.proTraining||f?.mode==='training'||f?.v5Training);
  function supports(f){
    return !!(f?.p1&&f?.p2&&['cpu','pvp','training','ravam','story','survival','boss','chaos','mix','v32-trial'].includes(f.mode)
      &&!f.online&&!f.isOnline&&!f.networked&&!f.islandClash&&!f.ruins&&!f.ruinsMode
      &&!window.__lan?.connected&&!window.__lan?.conn?.open);
  }
  const defaults={cues:true,trainingHud:true,autoPause:true};
  let settings={...defaults};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k of Object.keys(defaults))if(typeof saved[k]==='boolean')settings[k]=saved[k]}catch(_){}
  const runtime={events:[],history:[],bookmark:null,stats:{},lastFight:null};
  const queue=new WeakMap(),jumpQueue=new WeakMap(),moves=new WeakMap();
  let sequence=0;
  function init(f){
    if(runtime.lastFight!==f){runtime.lastFight=f;runtime.events=[];runtime.history=[];runtime.stats={};runtime.bookmark=null;}
    if(!Number.isFinite(f.niakV32Epoch))f.niakV32Epoch=++sequence;
    if(typeof f.niakV32WasPaused!=='boolean')f.niakV32WasPaused=!!f.paused;
    if(!Number.isFinite(f.niakV32TrainingSpeed))f.niakV32TrainingSpeed=1;
  }
  function record(type,p,extra={}){
    const f=game();if(!supports(f))return;init(f);
    runtime.events.push({type,at:Math.round(now()),slot:p?.playerSlot||'',fighter:p?.id||'',...extra});
    if(runtime.events.length>60)runtime.events.splice(0,runtime.events.length-60);
  }
  function controls(p){return p.playerSlot==='p2'?{jump:'ArrowUp',punch:'Numpad5',kick:'Numpad6',uppercut:'Numpad4',power:'Numpad1',super:'Numpad3',left:'ArrowLeft',right:'ArrowRight',down:'ArrowDown'}:{jump:'KeyW',punch:'KeyI',kick:'KeyO',uppercut:'KeyG',power:'KeyJ',super:'KeyL',left:'KeyA',right:'KeyD',down:'KeyS'}}
  const disabled=p=>p.state==='ko'||p.state==='hurt'||p.freezeT>0||p.proKnockdownT>0||p.legendTimeStopT>0||p.kloTrap||p.megaUltimatePending;
  const ready=(p,action)=>!disabled(p)&&!p.proMove&&!(p.attackDisabledT>0)&&!(action==='super'?p.specialCd>0:p.throwCd>0);
  const textTarget=e=>!!e.target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')||!!e.target?.closest?.('[contenteditable="true"],[role="textbox"],dialog[open]');
  function clearInput(f=game()){
    window.keys={};window.justPressed={};
    for(const p of [f?.p1,f?.p2])if(p){queue.delete(p);jumpQueue.delete(p);p.proBuffer=null;p.proDirHistory=[];p.megaLastDirTap={};}
  }
  function cancelUltimate(p){
    if(!p?.v32Ultimate)return;
    p.proStamina=clamp((p.proStamina??0)+(p.v32Ultimate.cost||0),0,100);
    p.v32Ultimate=null;p.megaUltimatePending=false;p.megaUltimateCineDone=false;p.megaUltimateCineLock=false;p.megaUltimateBypass=false;
    // Blindness already incurred belongs to this round; cancellation never restores it.
  }
  function pauseOnFocus(){
    const f=game();if(!supports(f)||!settings.autoPause||f.over||f.matchOver)return;
    clearInput(f);f.paused=true;f.niakV32WasPaused=true;
    document.getElementById('arena-pause')?.classList.add('show');
  }
  window.addEventListener('blur',pauseOnFocus);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOnFocus()});
  const label=code=>code.replace('Key','').replace('Numpad','N').replace('Arrow','');
  function blockedReason(p,action){
    if(p.megaUltimatePending)return 'SUPER EM PREPARAÇÃO';
    if(p.freezeT>0||p.legendTimeStopT>0)return 'IMOBILIZADO';
    if(p.proKnockdownT>0)return 'DERRUBADO';
    const cost=action==='super'?28:(window.ProCombat?.specs?.[action]?.cost||0);
    if(cost>(p.proStamina??100))return `FALTAM ${Math.ceil(cost-p.proStamina)} DE STAMINA`;
    if(action==='super'&&!p.superReady)return `SUPER ${Math.round(clamp(p.superMeter,0,1)*100)}%`;
    if(action==='super'&&p.superDisabled)return 'SUPER SILENCIADO';
    const cooldown=action==='super'?p.specialCd:p.throwCd;
    return cooldown>0?`RECARGA ${cooldown.toFixed(1)} s`:'';
  }
  window.addEventListener('keydown',e=>{
    const f=game();if(!supports(f))return;init(f);
    if(textTarget(e)){clearInput(f);e.stopImmediatePropagation();return;}
    if(e.code==='Escape'){clearInput(f);return;}
    if(f.paused){clearInput(f);if(e.code!=='Escape')e.stopImmediatePropagation();return;}
    if(f.over||e.repeat)return;
    if(training(f)&&['F6','F7','F8'].includes(e.code)){
      e.preventDefault();e.stopImmediatePropagation();
      trainingAction(e.code==='F7'?'swap':e.code==='F8'?'slow':e.shiftKey?'restore':'bookmark');return;
    }
    for(const p of [f.p1,f.p2]){
      if(!p?.human)continue;
      const c=controls(p),action=Object.keys(c).find(k=>c[k]===e.code);if(!action)continue;
      if(training(f)){runtime.history.push({key:label(e.code),at:now(),slot:p.playerSlot});runtime.history=runtime.history.slice(-12);}
      if(action==='jump'){
        if(disabled(p)||p.jumpDisabled||p.mudJumpDisabledT>0){jumpQueue.delete(p);e.preventDefault();e.stopImmediatePropagation();return;}
        if(!p.onGround)jumpQueue.set(p,now()+100);
      }
      if(['power','punch','kick','uppercut','super'].includes(action)){
        const reason=blockedReason(p,action);
        if(reason){p.niakV32Hint=reason;p.niakV32HintUntil=now()+900;}
        // The old engine already buffers the end of an active melee move.
        // This slot covers short hit/cooldown recovery only, not another combo queue.
        if(!p.proMove&&!p.megaUltimatePending&&!ready(p,action)&&p.state!=='ko'){
          queue.set(p,{code:e.code,action,until:now()+140,direction:{[c.left]:!!window.keys?.[c.left],[c.right]:!!window.keys?.[c.right],[c.down]:!!window.keys?.[c.down]}});
        }
      }
    }
  },true);
  const baseInput=window.playerInput;
  if(typeof baseInput==='function')window.playerInput=function(p){
    const f=game();if(!supports(f)||!p?.human)return baseInput.apply(this,arguments);init(f);
    if(f.paused)return;
    const c=controls(p),pending=queue.get(p),jumpUntil=jumpQueue.get(p),saved={};
    if(jumpUntil){
      if(now()>jumpUntil||disabled(p))jumpQueue.delete(p);
      else if(p.onGround&&!p.jumpDisabled&&!(p.mudJumpDisabledT>0)){
        p.vy=typeof JUMP_V==='number'?JUMP_V:700;p.y=0;p.onGround=false;p.jumpLock=true;p.jumpT=0;
        if(typeof setState==='function')setState(p,'air');else p.state='air';
        if(typeof charSound==='function')charSound(p,'jump');jumpQueue.delete(p);
      }
    }
    if(pending){
      if(now()>pending.until||f.over)queue.delete(p);
      else if(ready(p,pending.action)){
        window.justPressed=window.justPressed||{};window.justPressed[pending.code]=true;
        window.keys=window.keys||{};
        for(const [key,value] of Object.entries(pending.direction)){saved[key]=window.keys[key];window.keys[key]=value;}
        queue.delete(p);
      }
    }
    try{return baseInput.apply(this,arguments)}finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete window.keys[key];else window.keys[key]=value;}}
  };
  function study(p){
    const m=p.proMove,tracked=moves.get(p),melee=x=>x&&!['down','corewave','comet','astralrain'].includes(x.kind);
    if(tracked&&tracked.move!==m){
      const s=runtime.stats[tracked.kind];
      if(s){if(tracked.move.hit)s.contacts++;else if(tracked.move.time>=tracked.move.duration){s.whiffs++;record('whiff',p,{move:tracked.kind});}else s.interrupted++;}
      moves.delete(p);
    }
    if(melee(m)&&moves.get(p)?.move!==m){
      const s=runtime.stats[m.kind]||(runtime.stats[m.kind]={attempts:0,contacts:0,whiffs:0,interrupted:0});s.attempts++;
      moves.set(p,{move:m,kind:m.kind});
    }
  }
  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){
    const f=game();if(!supports(f))return baseDamage.apply(this,arguments);
    const hp=victim?.hp,attacker=src?.owner||(src?.id&&src!==victim?src:null);
    const wasGuard=!!victim?.defend,behind=wasGuard&&attacker&&Math.sign(attacker.x-victim.x)!==victim.facing;
    const result=baseDamage.apply(this,arguments),dealt=Math.max(0,(hp||0)-(victim?.hp||0));
    if(dealt>0){
      record('hit',attacker,{target:victim?.id,damage:Math.round(dealt),move:String(src?.proKind||type||'hit'),guard:wasGuard});
      if(behind){victim.niakV32Hint='ATAQUE PELAS COSTAS · VIRE A GUARDA';victim.niakV32HintUntil=now()+1100;}
    }
    return result;
  };
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){
    if(!supports(f))return baseUpdate.apply(this,arguments);init(f);
    const paused=!!f.paused;
    if(paused!==f.niakV32WasPaused){clearInput(f);f.niakV32WasPaused=paused;}
    if(paused)return;
    if(f.over){for(const p of [f.p1,f.p2]){cancelUltimate(p);queue.delete(p);jumpQueue.delete(p);}}
    const step=training(f)?dt*f.niakV32TrainingSpeed:dt;
    if(training(f))for(const p of [f.p1,f.p2])study(p);
    const result=baseUpdate.call(this,f,step);
    if(training(f))for(const p of [f.p1,f.p2])study(p);
    return result;
  };
  const baseReset=window.resetRoundForNextMatch;
  if(typeof baseReset==='function')window.resetRoundForNextMatch=function(){
    const f=game();if(supports(f)){
      init(f);for(const p of [f.p1,f.p2]){cancelUltimate(p);moves.delete(p);}clearInput(f);f.niakV32Epoch=++sequence;
      document.querySelectorAll('.mega-ultimate-cine:not(.r17-online-ultimate)').forEach(el=>el.remove());
    }
    return baseReset.apply(this,arguments);
  };
  const STATUS=[['freezeT','GELO'],['legendTimeStopT','TEMPO PARADO'],['proKnockdownT','CAÍDO'],['mudSlowT','LAMA'],['vladSlowT','LENTO'],['megaFreezeSlowT','FRIO'],['attackDisabledT','RECUPERAÇÃO']];
  function statuses(p){const list=STATUS.filter(([key])=>Number(p[key])>.08).map(([key,name])=>`${name} ${p[key].toFixed(1)}s`);if(p.superDisabled)list.push('SUPER SILENCIADO');return list;}
  function phase(p){const m=p?.proMove;if(!m)return null;return {kind:m.kind,name:m.time<m.start?'PREPARAÇÃO':m.time<=m.end?'ATIVO':'RECUPERAÇÃO',elapsed:Math.round(m.time*60),startup:Math.ceil(m.start*60),active:Math.ceil((m.end-m.start)*60),recovery:Math.ceil((m.duration-m.end)*60),progress:clamp(m.time/m.duration,0,1)};}
  function snapshot(){
    const f=game();
    return {version:VERSION,supported:supports(f),training:training(f),settings:{...settings},speed:f?.niakV32TrainingSpeed||1,bookmark:!!runtime.bookmark,
      distance:supports(f)?Math.round(Math.abs(f.p1.x-f.p2.x)):null,
      phase:phase(f?.p1),events:runtime.events.map(e=>({...e})),inputs:runtime.history.map(e=>({...e})),
      accuracy:Object.fromEntries(Object.entries(runtime.stats).map(([k,s])=>[k,{...s,percent:s.contacts+s.whiffs?Math.round(s.contacts/(s.contacts+s.whiffs)*100):0}])),
      fighters:supports(f)?[f.p1,f.p2].map(p=>({id:p.id,slot:p.playerSlot,statuses:statuses(p),powerCooldown:Math.max(0,p.throwCd||0),superReady:!!p.superReady})):[]};
  }
  function trainingAction(action){
    const f=game();if(!supports(f)||!training(f)||f.over)return false;init(f);
    if([f.p1,f.p2].some(p=>p.megaUltimatePending))return false;
    if(action==='slow'){f.niakV32TrainingSpeed=f.niakV32TrainingSpeed===1?.5:1;return true;}
    if(action==='bookmark'){runtime.bookmark=[f.p1,f.p2].map(p=>({id:p.id,x:p.x,y:p.y,onGround:p.onGround,facing:p.facing}));return true;}
    if(action==='clear'){runtime.stats={};runtime.events=[];runtime.history=[];for(const p of [f.p1,f.p2])moves.delete(p);return true;}
    if(action==='restore'&&(!runtime.bookmark||runtime.bookmark.some((p,i)=>p.id!==[f.p1,f.p2][i].id)))return false;
    if(!['swap','restore'].includes(action))return false;
    clearInput(f);
    if(action==='swap'){const x=f.p1.x;f.p1.x=f.p2.x;f.p2.x=x;f.p1.facing=Math.sign(f.p2.x-f.p1.x)||1;f.p2.facing=-f.p1.facing;}
    for(const [i,p] of [f.p1,f.p2].entries()){
      if(action==='restore')Object.assign(p,runtime.bookmark[i]);
      p.manualFacing=p.facing;p.vx=p.vy=0;p.proMove=null;p.proBuffer=null;p.throwCd=0;p.attackDisabledT=0;p.proKnockdownT=0;p.freezeT=0;p.state=p.onGround?'idle':'air';p.stateT=0;moves.delete(p);
    }
    return true;
  }
  function updateSettings(patch={}){for(const k of Object.keys(defaults))if(typeof patch[k]==='boolean')settings[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){}return {...settings};}
  function drawCues(f){
    if(!supports(f))return;
    const cv=typeof canvas!=='undefined'?canvas:null,c=cv?.getContext?.('2d');if(!c)return;
    c.save();c.textAlign='center';c.textBaseline='middle';c.font='bold 12px system-ui';
    if(settings.cues)for(const p of [f.p1,f.p2]){
      const ground=typeof GROUND_Y==='number'?GROUND_Y:900,y=ground-(p.y||0)-214,x=clamp(p.x,200,width()-200);
      const status=statuses(p).slice(0,2).join(' · ');
      const hint=now()<(p.niakV32HintUntil||0)?p.niakV32Hint:'';
      const cooldown=p.human?`J ${p.throwCd>.05?p.throwCd.toFixed(1)+'s':'PRONTO'} · L ${p.superDisabled?'SILENCIADO':p.superReady?'PRONTO':Math.round(clamp(p.superMeter,0,1)*100)+'%'}`:'';
      const lines=[cooldown,status,hint].filter(Boolean);
      if(lines.length){
        c.save();
        c.shadowColor='rgba(0,0,0,.8)';
        c.shadowBlur=8;
        c.shadowOffsetX=0;
        c.shadowOffsetY=2;
        lines.forEach((line,i)=>{c.fillStyle=i===lines.length-1&&hint?'#fde68a':'#e2e8f0';c.fillText(line,x,y+i*18,366)});
        c.restore();
      }
    }
    if(training(f)&&settings.trainingHud){
      const p=f.p1,other=f.p2,ph=phase(p),m=p.proMove,spec=window.ProCombat?.specs?.[m?.kind||'punch'];
      const ground=typeof GROUND_Y==='number'?GROUND_Y:900;
      if(spec){c.strokeStyle='#f8fafc';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.moveTo(p.x,ground-14);c.lineTo(p.x+(p.facing||1)*(spec.range+23),ground-14);c.stroke();c.setLineDash([]);}
      c.fillStyle='rgba(3,8,17,.90)';c.fillRect(width()/2-310,184,620,106);c.fillStyle='#c4f1ff';
      c.fillText(`LABORATÓRIO · ${Math.round(f.niakV32TrainingSpeed*100)}% · DISTÂNCIA ${Math.round(Math.abs(p.x-other.x))} px`,width()/2,200);
      c.fillStyle='#fff';c.fillText(ph?`${ph.kind.toUpperCase()} · ${ph.name} · ${ph.startup}/${ph.active}/${ph.recovery} QUADROS (60 Hz)`:'Golpe: preparação / ativo / recuperação · F8 muda a velocidade',width()/2,221);
      if(ph){c.fillStyle='#1e293b';c.fillRect(width()/2-285,234,570,5);c.fillStyle=ph.name==='ATIVO'?'#86efac':'#fbbf24';c.fillRect(width()/2-285,234,570*ph.progress,5);}
      c.fillStyle='#cbd5e1';c.fillText(runtime.history.filter(e=>e.slot==='p1').map(e=>e.key).join('  →  ')||'Seus comandos aparecem aqui',width()/2,255,594);
      c.fillText('F6 marcar · Shift+F6 voltar · F7 trocar lados · F8 câmera lenta',width()/2,277);
    }
    c.restore();
  }
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const result=baseDraw.apply(this,arguments);drawCues(f);return result;};
  window.NiakV32Combat=Object.freeze({version:VERSION,features,supports,snapshot,trainingAction,updateSettings,cancelUltimate,record});
})();
