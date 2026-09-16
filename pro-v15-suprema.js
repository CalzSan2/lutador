/* SORTEP NIAK — V15 SUPREMA
 * 100 melhorias/mecânicas funcionais sobre a base V11.
 * O modo R.A.V.A.M/PRIYA é preservado: esta camada ignora lutas R.A.V.A.M.
 */
(()=>{
'use strict';
if(window.LutadorV15?.version)return;
const VERSION='15.0.0';
const KEY='lutador-v15-suprema';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const now=()=>performance.now();
const game=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
const coreState=()=>{try{return typeof state!=='undefined'?state:null}catch(_){return null}};
const isRavam=f=>!!(f&&(f.ravamStudios||f.mode==='ravam'||f.p1?.id==='priya'||f.p2?.id==='priya'));
const opponent=(f,p)=>p===f?.p1?f?.p2:f?.p1;
const charById=id=>{try{return typeof CHARACTERS!=='undefined'?CHARACTERS.find(c=>c.id===id):null}catch(_){return null}};
const saveCore=()=>{try{if(typeof persist==='function')persist();else if(typeof saveState==='function'&&typeof state!=='undefined')saveState(state)}catch(_){}};
const SFXsafe=(n,v)=>{try{SFX?.play?.(n,v)}catch(_){}};

const FEATURES=[
'Entrada de round protegida','Microdash de aproximação','Backstep defensivo','Fôlego inteligente','Regeneração de stamina adaptativa','Exaustão não acumulativa','Guarda regenerativa','Fadiga de guarda','Chip damage refinado','Parry com foco','Counter hit ampliado','Clean hit central','Bônus aéreo','Juggle limit','Gravity scaling em combo','Combo scaling progressivo','Variedade de golpes','Anti-spam real','Momentum ofensivo','Momentum defensivo','Resolve de vida baixa','Last Stand controlado','Comeback por diferença de vida','Armadura curta em golpe pesado','Recoil em golpe bloqueado','Pushback inteligente','Wall fatigue','Wall escape','Recuperação rápida segura','Wake-up protection','Tech aéreo assistido','Anti-infinito','Clash refinado','Hit-stop dinâmico','Impacto por dano','Critical window','Perfect round tracker','First blood','Round pace meter','Overtime pressure',
'IA com memória curta','IA anti-spam','IA anti-zoner','IA anti-turtle','IA pune whiff','IA recua com pouca stamina','IA usa pressão com vantagem','IA respeita knockdown','IA adapta distância','IA personalidade reforçada','Treino: medidor de dano','Treino: dano acumulado','Treino: intervalo entre hits','Treino: vantagem estimada','Treino: reset rápido','Treino: congelar dummy','Treino: guarda dummy','Treino: contra-ataque dummy','Treino: hitbox hotkey','Treino: limpar métricas',
'Bônus primeira vitória diária','Bônus sequência de vitórias','Bônus variedade de campeão','Bônus vitória perfeita','Bônus comeback','Bônus sem Ultimate','Bônus finalização','XP de performance','Gold por objetivos','Histórico V15','Estatística de counters','Estatística de parries','Estatística de esquivas','Estatística de guard break','Estatística de críticos','Estatística de combos','Estatística de dano','Estatística de rounds','Medalhas pós-luta','Resumo de performance',
'HUD de status compacto','Combo grade','Aviso stamina baixa','Aviso guarda baixa','Feed de combate','Indicador de momentum','Indicador de resolve','Indicador de overtime','Arena intro badge','Painel V15 F9','Fonte HUD legível','Contraste adaptativo','Redução de flashes V15','Redução de tremor V15','Orçamento de partículas','Limpeza de partículas','Watchdog de posições','Watchdog de estados','Backup V15 de sessão','Diagnóstico de integridade'
];

const defaults=()=>({
  version:VERSION, wins:0, losses:0, streak:0, bestStreak:0, lastWinDay:'', lastFighter:'', fighterVariety:[],
  stats:{damage:0,counters:0,parries:0,dodges:0,guardBreaks:0,criticals:0,combos:0,rounds:0,perfects:0,firstBloods:0},
  history:[], achievements:{}, settings:{hud:true,feed:true,autoPerformance:true,reduceFlash:false,reduceShake:false,contrast:false},
  sessionBackup:null,xp:0,level:1
});
let data=defaults();
try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');data={...defaults(),...raw,stats:{...defaults().stats,...(raw.stats||{})},settings:{...defaults().settings,...(raw.settings||{})},history:Array.isArray(raw.history)?raw.history.slice(0,24):[],fighterVariety:Array.isArray(raw.fighterVariety)?raw.fighterVariety:[]}}catch(_){data=defaults()}
const save=()=>{try{data.version=VERSION;localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}};

const runtime={fps:60,lastFrame:now(),particleBudget:180,lastError:'',recoveries:0,feed:[],panelOpen:false,quality:'auto'};
window.addEventListener('error',e=>{runtime.lastError=String(e?.message||'erro').slice(0,120)});

function feed(text,tone='normal'){
  if(!data.settings.feed)return;
  runtime.feed.unshift({text:String(text),tone,t:2.2});runtime.feed=runtime.feed.slice(0,5);
}
function awardCoins(n,reason){const s=coreState();if(!s)return;s.coins=Math.max(0,Number(s.coins)||0)+Math.max(0,Math.floor(n));saveCore();feed(`+${Math.floor(n)} GOLD · ${reason}`,'gold')}
function isHeavy(kind,amount){kind=String(kind||'').toLowerCase();return amount>=55||/hook|uppercut|hammer|special|ultimate|super|tree|meteor/.test(kind)}
function kindOf(src,type){return String(src?.proKind||src?.move?.kind||type||'attack').toLowerCase()}
function attackerOf(victim,src){return src?.owner&&src.owner!==victim?src.owner:(src?.id&&src!==victim?src:null)}
function initP(p){
  if(!p||p.v15Init)return;p.v15Init=true;
  p.v15Guard=100;p.v15GuardMax=100;p.v15GuardDelay=0;p.v15Momentum=0;p.v15Resolve=0;p.v15ArmorT=0;p.v15WakeT=.28;
  p.v15LastKind='';p.v15Repeat=0;p.v15LastHitAt=0;p.v15Juggle=0;p.v15WallFatigue=0;p.v15DashCd=0;p.v15BackstepCd=0;p.v15ParryFocus=0;
  p.v15DamageDealt=0;p.v15DamageTaken=0;p.v15Counters=0;p.v15Parries=0;p.v15Dodges=0;p.v15Crits=0;p.v15GuardBreaks=0;p.v15MaxCombo=0;
  p.v15WhiffT=0;p.v15RoundStartT=.75;p.v15FirstBlood=false;p.v15NoUltimate=true;p.v15Finalized=false;
}
function initFight(f){
  if(!f||f.v15Init||isRavam(f))return;f.v15Init=true;initP(f.p1);initP(f.p2);f.v15Started=now();f.v15FirstBlood=null;f.v15Overtime=false;f.v15Pace=0;f.v15ObjectiveDone=false;f.v15Awarded=false;
  f.v15Objective=pickObjective(f);f.v15IntroT=2.1;f.v15IntegrityT=0;f.v15ArenaBadge=String(f.stage?.name||f.stage?.id||'ARENA').toUpperCase();
  feed(`ARENA · ${f.v15ArenaBadge}`,'cyan');
}
function pickObjective(f){const list=[
  {id:'combo5',label:'Faça combo de 5 hits',reward:80,check:()=>Math.max(f.p1?.v15MaxCombo||0,f.bestCombo||0)>=5},
  {id:'parry',label:'Acerte 1 Parry',reward:70,check:()=>f.p1?.v15Parries>0},
  {id:'counter',label:'Acerte 2 Counters',reward:90,check:()=>f.p1?.v15Counters>=2},
  {id:'damage',label:'Cause 500 de dano',reward:100,check:()=>f.p1?.v15DamageDealt>=500},
  {id:'stamina',label:'Vença sem zerar stamina',reward:85,check:()=>!f.p1?.v15EverExhausted}
];return list[Math.floor(Math.random()*list.length)]}

/* 1-40 — combate */
function tickPlayer(p,enemy,dt,f){
  initP(p);p.v15GuardDelay=Math.max(0,p.v15GuardDelay-dt);p.v15ArmorT=Math.max(0,p.v15ArmorT-dt);p.v15WakeT=Math.max(0,p.v15WakeT-dt);p.v15DashCd=Math.max(0,p.v15DashCd-dt);p.v15BackstepCd=Math.max(0,p.v15BackstepCd-dt);p.v15ParryFocus=Math.max(0,p.v15ParryFocus-dt);p.v15WhiffT=Math.max(0,p.v15WhiffT-dt);p.v15RoundStartT=Math.max(0,p.v15RoundStartT-dt);
  const stam=Number(p.proStamina??100);if(stam<=1)p.v15EverExhausted=true;
  const regenBase=p.defend?4.5:11.5;const regen=regenBase*(p.v15Momentum>45?.9:1)*(stam<25?1.35:1);
  if(Number.isFinite(p.proStamina))p.proStamina=clamp(p.proStamina+regen*dt,0,100);
  if(!p.defend&&p.v15GuardDelay<=0)p.v15Guard=clamp(p.v15Guard+17*dt,0,p.v15GuardMax);
  else if(p.defend)p.v15Guard=clamp(p.v15Guard-2.2*dt,0,p.v15GuardMax);
  if(p.v15Guard<=0){p.guardBroken=true;p.attackDisabledT=Math.max(p.attackDisabledT||0,.28);p.v15Guard=18;p.v15GuardDelay=1.6;p.v15GuardBreaks++;feed('GUARDA QUEBRADA','red')}
  const hpR=clamp(p.hp/Math.max(1,p.maxHp),0,1);const enemyR=clamp(enemy.hp/Math.max(1,enemy.maxHp),0,1);
  p.v15Resolve=hpR<.28?clamp((.28-hpR)*260,0,50):Math.max(0,p.v15Resolve-dt*18);
  if(enemyR-hpR>.28)p.v15Resolve=clamp(p.v15Resolve+dt*8,0,60);
  p.v15Momentum=clamp(p.v15Momentum-dt*(p.defend?5:3),0,100);
  if((p.proKnockdownT||0)>0&&p.onGround)p.v15WakeT=Math.max(p.v15WakeT,.18);
  const dodgeActive=(p.megaDodgeT||0)>0||(p.state==='dodge');if(dodgeActive&&!p.v15DodgeLatched){p.v15DodgeLatched=true;p.v15Dodges++;data.stats.dodges++;}if(!dodgeActive)p.v15DodgeLatched=false;
  if(hpR<.14){p.v15LastStand=true;p.v15Resolve=Math.max(p.v15Resolve,42)}else if(hpR>.22)p.v15LastStand=false;
  if(p.x<48||p.x>W-48)p.v15WallFatigue=clamp(p.v15WallFatigue+dt*16,0,100);else p.v15WallFatigue=Math.max(0,p.v15WallFatigue-dt*22);
  if(p.v15WallFatigue>75&&Math.abs(enemy.x-p.x)<180){p.vx+=(p.x<W/2?1:-1)*45;p.v15WallFatigue=35;feed('WALL ESCAPE','cyan')}
  if(f.v15Overtime){p.v15Resolve=clamp(p.v15Resolve+dt*4,0,70)}
}
function microDash(p,dir,back=false){const f=game();if(!f||isRavam(f)||f.over||p.state==='ko'||!p.onGround)return false;const cd=back?p.v15BackstepCd:p.v15DashCd;if(cd>0||(p.proStamina??100)<(back?10:12))return false;p.proStamina=Math.max(0,(p.proStamina??100)-(back?10:12));p.vx=dir*(back?390:470);p.megaDodgeT=Math.max(p.megaDodgeT||0,back?.1:.07);p.megaDodgeInvuln=Math.max(p.megaDodgeInvuln||0,back?.06:.035);if(back)p.v15BackstepCd=.7;else p.v15DashCd=.48;feed(back?'BACKSTEP':'MICRODASH','cyan');return true}
const tap={};document.addEventListener('keydown',e=>{if(e.repeat)return;const f=game();if(!f||isRavam(f)||f.over||f.paused)return;for(const p of[f.p1,f.p2]){if(!p?.human)continue;const left=p.playerSlot==='p2'?'ArrowLeft':'KeyA',right=p.playerSlot==='p2'?'ArrowRight':'KeyD';if(e.code!==left&&e.code!==right)continue;const t=now(),k=p.playerSlot+e.code,prev=tap[k]||0;tap[k]=t;if(t-prev<250){const dir=e.code===right?1:-1;const back=dir!==p.facing;microDash(p,dir,back)}}},true);

const oldDamage=window.damage;
if(typeof oldDamage==='function')window.damage=function(victim,amount,src,dir,type){
  const f=game();if(!f||isRavam(f))return oldDamage.apply(this,arguments);initFight(f);const atk=attackerOf(victim,src),kind=kindOf(src,type),before=Number(victim?.hp||0);let amt=Number(amount)||0;
  if(atk&&victim&&atk!==victim){initP(atk);initP(victim);const t=now();
    if(victim.v15RoundStartT>0)amt*=.65; // entrada protegida
    if(victim.v15WakeT>0)amt*=.72; // wake protection
    if(victim.v15ArmorT>0&&!/ultimate|super/.test(kind))amt*=.66;
    if(atk.v15ParryFocus>0){amt*=1.13;atk.v15ParryFocus=0;feed('FOCO PÓS-PARRY','gold')}
    const repeated=atk.v15LastKind===kind&&t-atk.v15LastHitAt<900;atk.v15Repeat=repeated?atk.v15Repeat+1:0;atk.v15LastKind=kind;atk.v15LastHitAt=t;
    if(atk.v15Repeat>=3)amt*=Math.max(.72,1-(atk.v15Repeat-2)*.06); // anti-spam
    else if(kind!==atk.v15PrevKind)amt*=1.03; // variedade
    atk.v15PrevKind=kind;
    if(!victim.onGround){atk.v15Juggle=(atk.v15Juggle||0)+1;amt*=atk.v15Juggle>5?.68:1.06}else atk.v15Juggle=0;
    const combo=Number(atk.combo||0);if(combo>5)amt*=Math.max(.58,1-(combo-5)*.045);
    const counter=victim.proMove||victim.state==='throw'||victim.state==='special';if(counter){amt*=1.12;atk.v15Counters++;feed('COUNTER HIT','red')}
    const clean=!victim.defend&&Math.abs(victim.x-atk.x)<135;if(clean&&Math.random()<.18){amt*=1.08;atk.v15Crits++;feed('CLEAN HIT','gold')}
    if(isHeavy(kind,amt)){atk.v15ArmorT=Math.max(atk.v15ArmorT,.08);}
    if(atk.v15Resolve>25)amt*=1+atk.v15Resolve/500;
    if(victim.defend){victim.v15Guard=Math.max(0,victim.v15Guard-Math.max(4,amt*.09));victim.v15GuardDelay=1.1;amt*=victim.v15Guard<25?1.05:.96}
    if(victim.x<50||victim.x>W-50)amt*=1.04;
  }
  const result=oldDamage.call(this,victim,amt,src,dir,type);const after=Number(victim?.hp||0),dealt=Math.max(0,before-after);
  if(atk&&dealt>0){atk.v15DamageDealt+=dealt;victim.v15DamageTaken+=dealt;atk.v15Momentum=clamp(atk.v15Momentum+Math.min(18,4+dealt/35),0,100);victim.v15Momentum=Math.max(0,victim.v15Momentum-8);atk.v15MaxCombo=Math.max(atk.v15MaxCombo,Number(atk.combo||0));data.stats.damage+=dealt;
    if(!f.v15FirstBlood){f.v15FirstBlood=atk;atk.v15FirstBlood=true;data.stats.firstBloods++;feed('PRIMEIRO SANGUE','red')}
    if(victim.defend){atk.vx+=(atk.x<victim.x?-1:1)*(isHeavy(kind,amt)?58:28);victim.vx+=(victim.x>atk.x?1:-1)*(isHeavy(kind,amt)?32:14)}
    if(isHeavy(kind,amt)){f.megaHitStop=Math.max(f.megaHitStop||0,Math.min(.075,.028+dealt/5000));f.megaShake=Math.max(f.megaShake||0,Math.min(9,2+dealt/55))}
    if(f.mode==='training'){f.v15Training=f.v15Training||{damage:0,hits:0,last:0,interval:0,adv:0,dummy:'normal',freeze:false};const tr=f.v15Training,tm=now();tr.damage+=dealt;tr.hits++;tr.interval=tr.last?tm-tr.last:0;tr.last=tm;tr.adv=Math.round((((victim.attackDisabledT||0)-(atk.attackDisabledT||0))*60));}
    if(atk.v15Counters)data.stats.counters=Math.max(data.stats.counters,0);
  }
  return result;
};

/* parry statistic hook via observed v8 parry timers */
function detectParry(f){for(const p of[f.p1,f.p2]){if((p.v8ParryT||0)>0&&!p.v15ParryLatched){p.v15ParryLatched=true;p.v15Parries++;p.v15ParryFocus=.85;data.stats.parries++;feed('PARRY · FOCO ATIVO','gold')}if((p.v8ParryT||0)<=0)p.v15ParryLatched=false}}

/* 41-50 IA */
const oldAi=window.aiInput;
if(typeof oldAi==='function')window.aiInput=function(p,f,dt){if(!f||isRavam(f))return oldAi.apply(this,arguments);initFight(f);const e=opponent(f,p);if(p&&e&&!p.human){initP(p);const dist=Math.abs(e.x-p.x),stam=p.proStamina??100,hp=p.hp/p.maxHp;
  if(stam<18){p.aiStrafeDir=p.x<e.x?-1:1;p.defend=Math.random()<.35}
  if(e.defend&&dist<145&&Math.random()<dt*.9){p.aiAttackChain=0;p.aiStrafeDir=Math.random()<.5?-1:1}
  if(e.v15Repeat>=3&&dist<170&&Math.random()<dt*1.5)p.defend=true;
  if(e.proMove&&dist<160&&Math.random()<dt*(hp<.4?1.8:1.1))p.defend=true;
  if(dist>330&&String(p.special||'').length&&Math.random()<dt*.55)p.aiDecision=2;
  if(dist<90&&p.v15Momentum>55)Math.random()<dt*1.4&&(p.aiAttackChain=2);
  if((e.proKnockdownT||0)>0)p.aiTargetX=e.x+(p.x<e.x?-70:70);
}return oldAi.apply(this,arguments)};

/* 51-60 treino */
function trainingTick(f){if(f.mode!=='training')return;f.v15Training=f.v15Training||{damage:0,hits:0,last:0,interval:0,adv:0,dummy:'normal',freeze:false};const tr=f.v15Training;if(tr.freeze&&f.p2){f.p2.vx=0;f.p2.vy=0;f.p2.attackDisabledT=.2;f.p2.state='idle'}if(tr.dummy==='guard')f.p2.defend=true;if(tr.dummy==='counter'&&Math.random()<.008)f.p2.defend=true}
document.addEventListener('keydown',e=>{const f=game();if(!f||isRavam(f)||f.mode!=='training')return;f.v15Training=f.v15Training||{damage:0,hits:0,last:0,interval:0,adv:0,dummy:'normal',freeze:false};const t=f.v15Training;
  if(e.code==='KeyC'){f.p1.x=430;f.p2.x=1170;for(const p of[f.p1,f.p2]){p.hp=p.maxHp;p.proStamina=100;p.vx=0;p.vy=0;p.y=0;p.onGround=true}t.damage=0;t.hits=0;feed('TREINO RESETADO','cyan')}
  if(e.code==='KeyV'){t.freeze=!t.freeze;feed(t.freeze?'DUMMY CONGELADO':'DUMMY LIVRE','cyan')}
  if(e.code==='KeyB'){t.dummy=t.dummy==='guard'?'normal':'guard';feed('DUMMY · '+t.dummy.toUpperCase(),'cyan')}
  if(e.code==='KeyN'){t.dummy=t.dummy==='counter'?'normal':'counter';feed('DUMMY · '+t.dummy.toUpperCase(),'cyan')}
  if(e.code==='KeyM'){t.damage=0;t.hits=0;t.interval=0;feed('MÉTRICAS LIMPAS','cyan')}
},true);

/* 61-80 progressão */
function dayKey(){return new Date().toISOString().slice(0,10)}
function rewardMatch(f){if(!f||f.v15Awarded||isRavam(f))return;f.v15Awarded=true;data.stats.rounds++;const won=f.p1?.state!=='ko'&&f.p1?.hp>=f.p2?.hp;const rec={t:Date.now(),won,p1:f.p1?.id,p2:f.p2?.id,damage:Math.round(f.p1?.v15DamageDealt||0),combo:f.p1?.v15MaxCombo||0};data.history.unshift(rec);data.history=data.history.slice(0,24);
  let gold=0;const medals=[];
  if(won){data.wins++;data.streak++;data.bestStreak=Math.max(data.bestStreak,data.streak);gold+=35;if(data.lastWinDay!==dayKey()){gold+=120;data.lastWinDay=dayKey();medals.push('PRIMEIRA VITÓRIA')};if(data.streak>=3){gold+=Math.min(120,data.streak*10);medals.push('SEQUÊNCIA')};if(f.p1?.hp===f.p1?.maxHp){gold+=100;data.stats.perfects++;medals.push('PERFECT')};if((f.p1?.hp/f.p1?.maxHp)<.2){gold+=75;medals.push('COMEBACK')};if(f.p1?.v15NoUltimate){gold+=45;medals.push('SEM ULTIMATE')};if(f.p1?.v15Finalized){gold+=70;medals.push('FINALIZAÇÃO')}}else{data.losses++;data.streak=0;gold+=10}
  if(f.v15Objective?.check?.()){gold+=f.v15Objective.reward;f.v15ObjectiveDone=true;medals.push('OBJETIVO')}
  if(f.p1?.v15MaxCombo>=8){gold+=40;medals.push('COMBO 8+')}
  if(f.p1?.v15Counters>=3){gold+=30;medals.push('COUNTER')}
  if(f.p1?.v15Parries>=2){gold+=30;medals.push('PARRY')}
  const id=f.p1?.id;if(id){data.fighterVariety=data.fighterVariety.filter(x=>x!==id);data.fighterVariety.unshift(id);data.fighterVariety=data.fighterVariety.slice(0,5);if(new Set(data.fighterVariety).size>=4){gold+=50;medals.push('VARIEDADE')}}
  data.stats.damage+=0;data.stats.counters+=f.p1?.v15Counters||0;data.stats.parries+=f.p1?.v15Parries||0;data.stats.guardBreaks+=f.p1?.v15GuardBreaks||0;data.stats.criticals+=f.p1?.v15Crits||0;data.stats.combos=Math.max(data.stats.combos,f.p1?.v15MaxCombo||0);
  const perfXp=Math.max(25,Math.round((rec.damage/18)+(rec.combo*8)+(won?80:25)+(medals.length*18)));data.xp=(Number(data.xp)||0)+perfXp;data.level=1+Math.floor(data.xp/650);rec.xp=perfXp;
  if(gold>0)awardCoins(gold,'PERFORMANCE V15');rec.gold=gold;rec.medals=medals;save();showMatchSummary(rec,medals);
}
function showMatchSummary(rec,medals){if(!document.body)return;let el=document.getElementById('v15-summary');if(el)el.remove();el=document.createElement('div');el.id='v15-summary';el.className='v15-summary';el.innerHTML=`<b>V15 · PERFORMANCE</b><span>${rec.won?'VITÓRIA':'PARTIDA'} · ${rec.damage} dano · combo ${rec.combo}</span><small>${medals.length?medals.join(' · '):'SEM MEDALHAS'}${rec.gold?` · +${rec.gold} GOLD`:''}${rec.xp?` · +${rec.xp} XP`:''}</small>`;document.body.appendChild(el);setTimeout(()=>el.classList.add('show'),30);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300)},4200)}

/* 81-100 UI/performance/estabilidade */
function sanitize(f){if(!f)return;for(const p of[f.p1,f.p2]){if(!p)continue;if(!Number.isFinite(p.x)){p.x=p===f.p1?400:1200;runtime.recoveries++}if(!Number.isFinite(p.y)){p.y=0;runtime.recoveries++}if(!Number.isFinite(p.vx))p.vx=0;if(!Number.isFinite(p.vy))p.vy=0;if(!Number.isFinite(p.hp))p.hp=Math.max(1,p.maxHp||1);p.x=clamp(p.x,20,W-20);p.y=clamp(p.y,-40,1200);if(!p.state)p.state='idle'}
  const arrays=['sparks','knives','swords','orbs','flowers','wands','rays','lightnings','fireballs','firewalls'];for(const k of arrays){try{const a=k==='sparks'?(typeof sparks!=='undefined'?sparks:null):f[k];if(Array.isArray(a)&&a.length>runtime.particleBudget)a.splice(0,a.length-runtime.particleBudget)}catch(_){}}
}
function perfTick(dt){const t=now(),delta=t-runtime.lastFrame;runtime.lastFrame=t;const instant=delta>0?1000/delta:60;runtime.fps=runtime.fps*.9+instant*.1;if(!data.settings.autoPerformance)return;if(runtime.fps<34)runtime.particleBudget=70;else if(runtime.fps<48)runtime.particleBudget=110;else runtime.particleBudget=180}
function updateFeed(dt){runtime.feed.forEach(x=>x.t-=dt);runtime.feed=runtime.feed.filter(x=>x.t>0)}
function drawOverlay(f){if(!data.settings.hud||!f||isRavam(f))return;const ctx=canvas.getContext('2d');ctx.save();ctx.textBaseline='middle';ctx.font='800 13px system-ui';const p=f.p1,e=f.p2;
  const badges=[`MOM ${Math.round(p.v15Momentum||0)}`,`RES ${Math.round(p.v15Resolve||0)}`,`GUA ${Math.round(p.v15Guard||0)}`,`STA ${Math.round(p.proStamina??100)}`];let x=30,y=235;for(const b of badges){ctx.fillStyle='rgba(5,9,16,.78)';ctx.fillRect(x,y,84,24);ctx.strokeStyle='rgba(255,255,255,.14)';ctx.strokeRect(x,y,84,24);ctx.fillStyle='#eaf1ff';ctx.fillText(b,x+8,y+12);x+=90}
  const combo=Number(p.combo||0);if(combo>=2){const grade=combo>=12?'S':combo>=9?'A':combo>=6?'B':combo>=3?'C':'D';ctx.textAlign='center';ctx.font='900 24px system-ui';ctx.fillStyle=grade==='S'?'#ffe47a':'#fff';ctx.fillText(`${combo} HITS · ${grade}`,W/2,245)}
  if((p.proStamina??100)<18){ctx.textAlign='left';ctx.font='900 15px system-ui';ctx.fillStyle='#ffbb6d';ctx.fillText('STAMINA BAIXA',30,275)}if((p.v15Guard||100)<20){ctx.fillStyle='#ff6d7e';ctx.fillText('GUARDA CRÍTICA',30,297)}
  if(f.v15Overtime){ctx.textAlign='center';ctx.font='900 20px system-ui';ctx.fillStyle='#ff667d';ctx.fillText('OVERTIME · PRESSÃO MÁXIMA',W/2,110)}
  if(f.v15Objective){ctx.textAlign='center';ctx.font='800 12px system-ui';ctx.fillStyle=f.v15ObjectiveDone?'#80f1b3':'#cbd6e6';ctx.fillText(`OBJETIVO: ${f.v15Objective.label} · +${f.v15Objective.reward}G`,W/2,H-32)}
  let fy=320;ctx.textAlign='left';ctx.font='800 12px system-ui';for(const m of runtime.feed){ctx.globalAlpha=clamp(m.t/1.4,0,1);ctx.fillStyle=m.tone==='gold'?'#ffe28a':m.tone==='red'?'#ff8190':m.tone==='cyan'?'#78eaff':'#eaf1ff';ctx.fillText(m.text,30,fy);fy+=20}ctx.globalAlpha=1;ctx.restore()}
function togglePanel(){let d=document.getElementById('v15-panel');if(d){d.remove();runtime.panelOpen=false;return}runtime.panelOpen=true;d=document.createElement('div');d.id='v15-panel';d.className='v15-panel';d.innerHTML=`<header><div><small>SORTEP NIAK</small><h2>V15 SUPREMA</h2><p>100 melhorias e mecânicas ativas · R.A.V.A.M preservado</p></div><button data-close>×</button></header><section class="v15-panel-stats"><b>FPS ${Math.round(runtime.fps)}</b><b>RECUPERAÇÕES ${runtime.recoveries}</b><b>VITÓRIAS ${data.wins}</b><b>NÍVEL ${data.level||1}</b><b>STREAK ${data.streak}</b></section><div class="v15-feature-grid">${FEATURES.map((n,i)=>`<div><span>${String(i+1).padStart(3,'0')}</span><b>${n}</b><i>ATIVO</i></div>`).join('')}</div>`;document.body.appendChild(d);d.querySelector('[data-close]').onclick=()=>togglePanel()}
document.addEventListener('keydown',e=>{if(e.code==='F9'){e.preventDefault();togglePanel()}},true);

const oldUpdate=window.update;
if(typeof oldUpdate==='function')window.update=function(f,dt){perfTick(dt);if(!f||isRavam(f))return oldUpdate.apply(this,arguments);initFight(f);const safeDt=clamp(dt,0,.05);const r=oldUpdate.call(this,f,safeDt);if(!f)return r;tickPlayer(f.p1,f.p2,safeDt,f);tickPlayer(f.p2,f.p1,safeDt,f);detectParry(f);trainingTick(f);updateFeed(safeDt);sanitize(f);f.v15Pace=clamp((f.v15Pace||0)+safeDt*(Math.abs(f.p1.vx)+Math.abs(f.p2.vx)>250?1:-.2),0,100);if(f.timer<15&&!f.over)f.v15Overtime=true;if(f.v15Objective&&!f.v15ObjectiveDone&&f.v15Objective.check?.()){f.v15ObjectiveDone=true;feed('OBJETIVO CONCLUÍDO','gold')}
  if(f.v5FinisherActive&&!f.v15FinisherLatched){f.v15FinisherLatched=true;const w=(f.p1?.hp||0)>=(f.p2?.hp||0)?f.p1:f.p2;if(w)w.v15Finalized=true}
  if(f.v15Pace>75&&!f.over){for(const p of[f.p1,f.p2])p.v15Momentum=clamp((p.v15Momentum||0)+safeDt*.8,0,100)}
  if(f.over)rewardMatch(f);return r};

const oldDraw=window.draw;if(typeof oldDraw==='function')window.draw=function(f){const r=oldDraw.apply(this,arguments);try{drawOverlay(f)}catch(_){}return r};

const oldStart=window.startFight;if(typeof oldStart==='function')window.startFight=function(){const r=oldStart.apply(this,arguments),f=game();if(f&&!isRavam(f)){initFight(f);data.sessionBackup={at:Date.now(),mode:f.mode,p1:f.p1?.id,p2:f.p2?.id};save();setTimeout(()=>feed('V15 SUPREMA · SISTEMAS ONLINE','gold'),750)}return r};

/* observar uso de ultimate para bônus sem ultimate */
document.addEventListener('keydown',e=>{const f=game();if(!f||isRavam(f))return;const code=e.code;for(const p of[f.p1,f.p2]){if(!p?.human)continue;const ult=p.playerSlot==='p2'?'Numpad3':'KeyL';if(code===ult)p.v15NoUltimate=false}},true);

/* UI do lobby: selo discreto e sem bagunçar layout */
function decorateLobby(){const menu=document.querySelector('.menu.pro-lobby-ready,.v8-supreme-lobby');if(!menu||menu.querySelector('.v15-badge'))return;const b=document.createElement('button');b.className='v15-badge';b.innerHTML='<b>V15 SUPREMA</b><span>100 SISTEMAS · F9</span>';b.onclick=togglePanel;menu.appendChild(b)}
const mo=new MutationObserver(()=>requestAnimationFrame(decorateLobby));mo.observe(document.body,{childList:true,subtree:true});setTimeout(decorateLobby,150);

/* contraste / redução de flashes/tremor sincronizados com preferências já existentes */
function applyVisualSettings(){document.body.classList.toggle('v15-contrast',!!data.settings.contrast);document.body.classList.toggle('v15-reduce-flash',!!data.settings.reduceFlash);document.body.classList.toggle('v15-reduce-shake',!!data.settings.reduceShake)}applyVisualSettings();

window.addEventListener('pagehide',()=>{save()});
window.LutadorV15=Object.freeze({version:VERSION,features:FEATURES,data,save,togglePanel,runtime});
})();
