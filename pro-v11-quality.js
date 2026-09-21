/* SORTEP NIAK — V11 QUALITY
 * Polimento de combate, identidade de campeões, seleção, história, perfil,
 * ranked, passe, loja, áudio, otimização e testes internos.
 * IMPORTANTE: não altera o modo R.A.V.A.M Studios nem a Priya.
 */
(()=>{
  'use strict';
  if(window.LutadorV11?.version)return;
  const VERSION='11.0.0';
  const KEY='lutador-v11-quality';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');
  const game=()=>{try{return typeof fight!=='undefined'&&fight?fight:null}catch(_){return null}};
  const chars=()=>{try{return typeof CHARACTERS!=='undefined'?CHARACTERS:[]}catch(_){return[]}};
  const stateRef=()=>{try{return typeof state!=='undefined'?state:null}catch(_){return null}};
  const exp=()=>window.LutadorExpansion?.data||null;
  const comp=()=>window.LutadorComplete?.meta||null;
  const prog=()=>window.ProProgression?.getSnapshot?.()||null;
  const isRavamFight=f=>!!(f?.ravamStudios||f?.mode==='ravam'||f?.p1?.id==='priya'||f?.p2?.id==='priya');

  const ULT={
    rojo:'EXECUÇÃO RUBRA',thuvaa:'ZERO ABSOLUTO',ztaaa:'FIM DE TODAS AS FORMAS',knunka:'RAIO DO ABISMO',nine85:'FALHA TERMINAL',uiye:'ESPELHO TITÂNICO',rtess:'COLAPSO MAGNÉTICO',atizz:'FRATURA DO TEMPO',grizz:'MURALHA DO ALFA',ouip:'EXTINÇÃO ÁCIDA',jetde:'RETORNO ABSOLUTO',xillen:'TEMPESTADE ALIEN',ytiri:'CORRENTES DO VAZIO',lkugh:'BURACO NEGRO',grogh:'RETORNO COLOSSAL',dart:'CAOS PRIMORDIAL',trefoh:'FLORA SUPREMA',yoi:'NOITE SEM FIM',flame:'MURALHA DO SOL',perry:'QUEDA DAS TRÊS ÁRVORES',verry:'MUNDO DE LAMA',hock:'CHUVA LUNAR',vlad:'ECLIPSE DE SANGUE',klo:'PROBABILIDADE ZERO',klopp:'FORMA IMPOSSÍVEL',frogh:'MIL FACES',jimmy:'JULGAMENTO CELESTE'
  };
  const SPEC={
    rojo:{role:'RUSHDOWN',passive:'PRESSÃO RUBRA',desc:'Velocidade, sangramento e pressão constante.',hp:1,dmg:1.02,spd:1.05,guard:.96,ai:'aggressive',moves:['I · Punho Rubro','O · Chute Carmesim','G · Gancho Demolidor','I I O · Corrente Rubra','L · '+ULT.rojo]},
    thuvaa:{role:'CONTROLADOR',passive:'FRIO CRESCENTE',desc:'Congelamento, defesa e domínio de distância.',hp:1.04,dmg:.98,spd:.98,guard:1.08,ai:'zoning',moves:['I · Impacto Glacial','O · Chute Congelante','G · Gancho de Gelo','K · Barreira Fria','L · '+ULT.thuvaa]},
    ztaaa:{role:'CHEFE HÍBRIDO',passive:'DOMÍNIO ABSOLUTO',desc:'Poder extremo com troca de técnicas.',hp:1,dmg:.92,spd:.96,guard:1,ai:'adaptive',moves:['J · Forma Aleatória','O · Ruptura Suprema','G · Gancho Ômega','K · Guarda Absoluta','L · '+ULT.ztaaa]},
    knunka:{role:'ASSASSINO',passive:'CAÇADA AZUL',desc:'Dash veloz e queimadura de fogo negro.',hp:.98,dmg:1.03,spd:1.06,guard:.94,ai:'aggressive',moves:['J · Dash Relâmpago','O · Chute Azul','G · Gancho Caçador','Especial · Fogo Negro','L · '+ULT.knunka]},
    nine85:{role:'EXECUTOR',passive:'CÓDIGO ZERO',desc:'Golpes de dados, alcance médio e punição.',hp:1,dmg:1.03,spd:1,guard:1,ai:'counter',moves:['J · Lança de Dados','O · Chute Binário','G · Gancho Kernel','Especial · Falha de Sistema','L · '+ULT.nine85]},
    uiye:{role:'MÍMICO',passive:'PELE DE PEDRA',desc:'Resistência alta e cópia temporária.',hp:1.05,dmg:.98,spd:.96,guard:1.08,ai:'defensive',moves:['J · Pedra Rápida','O · Chute Granito','G · Gancho Rochoso','K · Cópia Mineral','L · '+ULT.uiye]},
    rtess:{role:'TANQUE',passive:'POLARIDADE',desc:'Puxa o rival e domina o centro da arena.',hp:1.07,dmg:1.02,spd:.93,guard:1.1,ai:'grappler',moves:['J · Punho Magnético','O · Chute Polar','G · Gancho de Atração','Especial · Campo Magnético','L · '+ULT.rtess]},
    atizz:{role:'ASSASSINO',passive:'GLITCH',desc:'Cortes rápidos com janelas de evasão.',hp:.97,dmg:1.03,spd:1.07,guard:.94,ai:'counter',moves:['J · Corte Glitch','O · Chute Corrompido','G · Gancho de Falha','Especial · Corte Temporal','L · '+ULT.atizz]},
    grizz:{role:'TANQUE',passive:'ALFA',desc:'Corpo resistente, lasers e parede defensiva.',hp:1.08,dmg:1,spd:.94,guard:1.1,ai:'defensive',moves:['J · Laser Ocular','O · Patada Pesada','G · Gancho Urso','K · Parede do Grizz','L · '+ULT.grizz]},
    ouip:{role:'ARTILHARIA',passive:'CORROSÃO',desc:'Pressão vertical com ácido e meteoros.',hp:1,dmg:1.02,spd:.98,guard:.98,ai:'zoning',moves:['J · Chuva Ácida','O · Chute Corrosivo','G · Gancho Tóxico','Especial · Meteoro Ácido','L · '+ULT.ouip]},
    jetde:{role:'DEFENSOR',passive:'BOLHA REATIVA',desc:'Repele e absorve ataques antes de retaliar.',hp:1.04,dmg:.97,spd:1,guard:1.12,ai:'defensive',moves:['J · Bolha Repulsora','O · Chute de Pressão','G · Gancho Esférico','K · Absorção','L · '+ULT.jetde]},
    xillen:{role:'ZONER',passive:'ENERGIA ALIEN',desc:'Raios lineares e ataques celestes.',hp:.99,dmg:1.01,spd:1.01,guard:.98,ai:'zoning',moves:['J · Raio Alien','O · Chute Energético','G · Gancho Estelar','Especial · Raio Celeste','L · '+ULT.xillen]},
    ytiri:{role:'TRAPACEIRO',passive:'NÉVOA',desc:'Fumaça, correntes e cópia com invulnerabilidade.',hp:1,dmg:.99,spd:1.03,guard:.98,ai:'counter',moves:['J · Corrente Espectral','O · Chute de Fumaça','G · Gancho Sombrio','K · Cópia Espectral','L · '+ULT.ytiri]},
    lkugh:{role:'ZONER',passive:'ÓRBITA LUNAR',desc:'Bombas, lua perseguidora e controle de espaço.',hp:1,dmg:1.01,spd:.99,guard:1,ai:'zoning',moves:['J · Bomba Tripla','O · Chute Lunar','G · Gancho Orbital','Especial · Lua Perseguidora','L · '+ULT.lkugh]},
    grogh:{role:'CONTRA-GOLPE',passive:'REFLEXO TITÂNICO',desc:'Devolve pressão e pune ataques previsíveis.',hp:1.04,dmg:1.01,spd:.97,guard:1.06,ai:'counter',moves:['J · Pulso de Energia','O · Chute Reflexo','G · Gancho Titânico','K · Reflexão','L · '+ULT.grogh]},
    dart:{role:'VERSÁTIL',passive:'QUATRO ELEMENTOS',desc:'Alterna elementos e adapta o ritmo.',hp:1,dmg:1,spd:1.01,guard:1,ai:'adaptive',moves:['J · Elemento Aleatório','O · Chute Elemental','G · Gancho Arcano','Especial · Quatro Formas','L · '+ULT.dart]},
    trefoh:{role:'ZONER',passive:'FLORA ARCANA',desc:'Flores, magia e projéteis buscadores.',hp:1,dmg:1,spd:1,guard:.98,ai:'zoning',moves:['J · Espinho Floral','O · Chute de Vinhas','G · Gancho Arcano','Especial · Mister Adamant','L · '+ULT.trefoh]},
    yoi:{role:'CONTROLADOR',passive:'ECLIPSE',desc:'Sombra, luz e controle de visão.',hp:1.03,dmg:.99,spd:.97,guard:1.05,ai:'zoning',moves:['J · Leque Lunar','O · Chute Eclipse','G · Gancho Sombrio','Especial · Apagão','L · '+ULT.yoi]},
    flame:{role:'RUSHDOWN',passive:'CALOR ASCENDENTE',desc:'Fogo direto e pressão de parede.',hp:1,dmg:1.03,spd:1.02,guard:.97,ai:'aggressive',moves:['J · Bola de Fogo','O · Chute Incendiário','G · Gancho Flamejante','Especial · Parede de Fogo','L · '+ULT.flame]},
    perry:{role:'CONTROLADOR',passive:'FOLHAS VIVAS',desc:'Três alturas de projétil e controle aéreo.',hp:1.02,dmg:1,spd:1.01,guard:1,ai:'zoning',moves:['J · Três Folhas','O · Chute Verde','G · Gancho de Raiz','Especial · Tempestade Verde','L · '+ULT.perry]},
    verry:{role:'CONTROLADOR',passive:'LAMA PESADA',desc:'Lentidão, bloqueio de ações e chão hostil.',hp:1.03,dmg:.99,spd:.98,guard:1.02,ai:'zoning',moves:['J · Lama Direta','O · Chute Lodoso','G · Gancho de Barro','Especial · Pântano','L · '+ULT.verry]},
    hock:{role:'BRUTAMONTES',passive:'MARTELO COLOSSAL',desc:'Dano alto, empurrão e pressão pesada.',hp:1.07,dmg:1.04,spd:.93,guard:1.06,ai:'grappler',moves:['J · Martelo Frontal','O · Chute Pesado','G · Gancho de Impacto','Especial · Quebra-Chão','L · '+ULT.hock]},
    vlad:{role:'DRENADOR',passive:'SEDE RUBRA',desc:'Drena vida e enfraquece o rival.',hp:1.03,dmg:1.01,spd:1.01,guard:1,ai:'adaptive',moves:['J · Sangue Pressurizado','O · Chute Vampírico','G · Gancho Carmesim','Especial · Sifão','L · '+ULT.vlad]},
    klo:{role:'TRAPACEIRO',passive:'PROBABILIDADE',desc:'Mudanças imprevisíveis e mobilidade alta.',hp:.96,dmg:.98,spd:1.08,guard:.94,ai:'adaptive',moves:['J · Carta Quântica','O · Chute Improvável','G · Gancho Caótico','Especial · Troca Quântica','L · '+ULT.klo]},
    klopp:{role:'MÍMICO',passive:'FORMA ALEATÓRIA',desc:'Assume formas e ataques de outros campeões.',hp:1,dmg:1,spd:1.02,guard:1,ai:'adaptive',moves:['J · Metamorfose','O · Chute Copiado','G · Gancho Mímico','K · Ataque Copiado','L · '+ULT.klopp]},
    frogh:{role:'MÍMICO',passive:'MUTAÇÃO',desc:'Copia poderes e transforma o próprio corpo.',hp:1.04,dmg:1.02,spd:1.03,guard:1.02,ai:'adaptive',moves:['J · Ataque Mimético','O · Chute Anfíbio','G · Gancho Mutante','Especial · Cópia Total','L · '+ULT.frogh]},
    jimmy:{role:'ZONER',passive:'TROVÃO',desc:'Raios precisos e controle vertical.',hp:1.02,dmg:1.01,spd:1.02,guard:1,ai:'zoning',moves:['J · Raio Marcado','O · Chute Elétrico','G · Gancho Trovejante','Especial · Voo Elétrico','L · '+ULT.jimmy]}
  };

  const ACH=[
    ['first','PRIMEIRA MARCA','Vença uma partida.',250],['combo8','SEQUÊNCIA VIVA','Faça um combo de 8 golpes.',400],['combo12','SEM RESPIRAR','Faça um combo de 12 golpes.',700],['parry','LEITURA PERFEITA','Execute um Parry.',300],['perfect','INTACTO','Vença um round com 98%+ de vida.',700],['story','CRÔNICA DA ARENA','Vença uma luta de História.',500],['veteran25','VETERANO DA ARENA','Vença 25 partidas.',800],['mastery','ESPECIALISTA','Alcance maestria 10 com um campeão.',900],['variety','ELENCO VIVO','Vença com 5 campeões diferentes.',1000],['ultimate','ASSINATURA','Finalize uma luta usando Ultimate.',600],['shop','COLECIONADOR','Tenha 5 cosméticos.',500],['season','GUERREIRO DA TEMPORADA','Jogue 20 partidas na temporada.',1200]
  ];
  const defaults=()=>({history:[],winsByChar:{},ach:{},claimed:{},seasonMatches:0,rankSeasonNumber:0,lastRankSeasonReward:0,quality:'auto',fps:60,lowFps:false,testRuns:0,lastTest:null});
  let data=defaults();
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');data={...defaults(),...raw,history:Array.isArray(raw.history)?raw.history.slice(0,12):[],winsByChar:{...(raw.winsByChar||{})},ach:{...(raw.ach||{})},claimed:{...(raw.claimed||{})}}}catch(_){data=defaults()}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){}};
  function toast(text,tone='normal',ms=1500){
    try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(text,tone,ms)}catch(_){}
    let host=document.querySelector('.v11-toast-host');if(!host){host=document.createElement('div');host.className='v11-toast-host';document.body.appendChild(host)}
    const e=document.createElement('div');e.className='v11-toast '+tone;e.textContent=text;host.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.remove('show');setTimeout(()=>e.remove(),180)},ms);
  }
  function grantGold(amount){const s=stateRef();if(!s)return;s.coins=Math.max(0,(Number(s.coins)||0)+amount);try{persist?.()}catch(_){} }
  function unlockAch(id){if(data.ach[id])return;data.ach[id]=Date.now();save();const a=ACH.find(x=>x[0]===id);if(a){toast(`CONQUISTA · ${a[1]}`,'reward',2100);window.ProAudio?.play?.('confirm',{volume:.55})}}
  function checkAchievements(f,won){
    if(won)unlockAch('first');
    const st=f?.megaStats?.p1||{};if((st.maxCombo||0)>=8)unlockAch('combo8');if((st.maxCombo||0)>=12)unlockAch('combo12');if(won&&f?.p1?.hp/(f?.p1?.maxHp||1)>=.98)unlockAch('perfect');if(f?.mode==='story'&&won||f?.mode==='storyx'&&won)unlockAch('story');if((data.history||[]).filter(h=>h.won).length>=25)unlockAch('veteran25');if((st.ultimates||0)>0&&won)unlockAch('ultimate');
    const m=exp()?.mastery||{};if(Object.values(m).some(v=>Number(v?.xp||0)>=2340))unlockAch('mastery');
    const cos=exp()?.owned||[];if(Array.isArray(cos)&&cos.length>=5)unlockAch('shop');
    if(Object.keys(data.winsByChar).filter(k=>data.winsByChar[k]>0).length>=5)unlockAch('variety');if(data.seasonMatches>=20)unlockAch('season');
  }

  function specOf(id){return SPEC[id]||{role:'VERSÁTIL',passive:'TÉCNICA PRÓPRIA',desc:'Estilo equilibrado e recursos únicos.',hp:1,dmg:1,spd:1,guard:1,ai:'adaptive',moves:['I · Soco','O · Chute','G · Gancho','K · Defesa',`L · ${ULT[id]||'ULTIMATE SUPREMA'}`]}}
  function initFighter(p){
    if(!p||p.id==='priya'||p.v11Init)return;p.v11Init=true;const s=specOf(p.id);p.v11Spec=s;p.v11Visual={x:0,y:0,scaleX:1,scaleY:1,lean:0};
    p.maxHp=Math.max(1,Math.round((p.maxHp||p.hp||100)*s.hp));p.hp=Math.min(p.maxHp,Math.round((p.hp||p.maxHp)*s.hp));p.dmg=(p.dmg||30)*s.dmg;p.speed=(p.speed||70)*s.spd;
    if(Number.isFinite(p.v8GuardMax)){p.v8GuardMax*=s.guard;p.v8Guard=Math.min(p.v8GuardMax,(p.v8Guard||p.v8GuardMax)*s.guard)}
    p.v11Ai=s.ai;p.v11Role=s.role;p.v11InputGrace=.075;p.v11HitConfirm=0;p.v11LastMove='';
  }
  function initFight(f){if(!f||isRavamFight(f)||f.v11Init)return;f.v11Init=true;initFighter(f.p1);initFighter(f.p2);f.v11StartedAt=Date.now();f.v11StageCue=false;showFightIntro(f)}

  function showFightIntro(f){
    if(!f||isRavamFight(f))return;const a=specOf(f.p1?.id),b=specOf(f.p2?.id);const rivalry=(f.p1?.id==='rojo'&&f.p2?.id==='thuvaa')||(f.p1?.id==='thuvaa'&&f.p2?.id==='rojo');
    const el=document.createElement('div');el.className='v11-fight-intro';el.innerHTML=`<div><small>${esc(f.stage?.name||'ARENA')}</small><h2>${esc(f.p1?.name||'P1')} <i>VS</i> ${esc(f.p2?.name||'P2')}</h2><p>${rivalry?'“Fogo e gelo não dividem o mesmo trono.”':`${a.role} contra ${b.role}`}</p></div>`;document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},1450)
  }

  const baseStart=window.startFight;
  if(typeof baseStart==='function')window.startFight=function(){const r=baseStart.apply(this,arguments);const f=game();if(f&&!isRavamFight(f)){f.v11Init=false;setTimeout(()=>initFight(f),0)}return r};

  /* Combate responsivo: tolerância de buffer, recuperação limpa e hit-stop curto. */
  const baseInput=window.playerInput;
  if(typeof baseInput==='function')window.playerInput=function(p){const f=game();if(!f||isRavamFight(f)||p?.id==='priya')return baseInput.apply(this,arguments);initFighter(p);if((p.attackDisabledT||0)>0&&p.state==='idle'&&(p.attackDisabledT||0)<.09)p.attackDisabledT=0;return baseInput.apply(this,arguments)};

  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){
    const f=game();if(!f||isRavamFight(f)||victim?.id==='priya')return baseDamage.apply(this,arguments);const attacker=src?.owner||(src?.id&&src!==victim?src:null);initFighter(victim);if(attacker)initFighter(attacker);const before=Number(victim?.hp||0);const r=baseDamage.apply(this,arguments);const dealt=Math.max(0,before-Number(victim?.hp||0));if(dealt>0){
      const kind=String(src?.proKind||src?.move?.kind||type||'hit').toLowerCase(),ultimate=attacker?.megaUltimateBoostT>0||/ultimate|super/.test(kind),heavy=ultimate||/kick|uppercut|hook|hammer|meteor|lightning|special/.test(kind)||dealt>55;
      if(f){const desired=ultimate?.085:heavy?.038:.014;f.megaHitStop=Math.min(Math.max(f.megaHitStop||0,desired),ultimate?.11:.05)}
      if(attacker){attacker.v11HitConfirm=.15;attacker.v11LastMove=kind}
      window.ProAudio?.play?.(victim.defend?'guard':heavy?'kick':'hit',{character:attacker?.id||'',volume:heavy?.75:.55,pan:clamp(((victim.x||800)-800)/800,-.65,.65)});
      if(heavy&&attacker?.id==='rojo'){window.ProAudio?.tone?.(118,.11,'sawtooth',.04);window.ProAudio?.tone?.(72,.16,'sine',.035,.025)}
      if(heavy&&attacker?.id==='thuvaa'){window.ProAudio?.tone?.(880,.12,'triangle',.025);window.ProAudio?.tone?.(1320,.17,'sine',.018,.035)}
      if(victim.defend)unlockAch('parry');
    }return r;
  };

  /* Personalidade de IA sem substituir o núcleo. */
  const baseAi=window.aiInput;
  if(typeof baseAi==='function')window.aiInput=function(p,f,dt){if(!f||isRavamFight(f)||p?.id==='priya')return baseAi.apply(this,arguments);initFighter(p);const r=baseAi.apply(this,arguments);const enemy=p===f.p1?f.p2:f.p1,dist=Math.abs((enemy?.x||0)-(p.x||0)),ai=p.v11Ai;
    if(ai==='aggressive'&&dist>150){p.vx=(enemy.x>p.x?1:-1)*Math.max(Math.abs(p.vx||0),p.speed*3.1)}
    else if(ai==='zoning'&&dist<170&&p.onGround){p.vx=(enemy.x>p.x?-1:1)*Math.max(Math.abs(p.vx||0),p.speed*2.15)}
    else if(ai==='defensive'&&enemy?.proMove&&dist<170){p.defend=true}
    else if(ai==='counter'&&enemy?.proMove&&dist<145&&Math.random()<dt*3){p.defend=true;p.v8ParryT=Math.max(p.v8ParryT||0,.1)}
    else if(ai==='grappler'&&dist<120){p.vx*=.45}
    return r;
  };

  /* Transições visuais procedurais para todos os campeões normais. */
  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){if(!p||p.id==='priya'||isRavamFight(game()))return baseDrawFighter.apply(this,arguments);initFighter(p);const v=p.v11Visual||{x:0,y:0,scaleX:1,scaleY:1,lean:0},t=performance.now()/1000;let tx=0,ty=0,sx=1,sy=1,lean=0;const moving=Math.abs(p.vx||0)>25;
    if(!p.onGround){ty=-3;lean=clamp((p.vx||0)/900,-.08,.08);sx=.97;sy=1.035}else if(p.state==='hurt'){tx=-(p.facing||1)*4;sx=1.04;sy=.96}else if(p.state==='defend'){tx=-(p.facing||1)*2;sx=1.035;sy=.97}else if(p.state==='throw'||p.state==='special'){tx=(p.facing||1)*3;lean=(p.facing||1)*.045}else if(moving){ty=Math.sin(t*12)*1.6;lean=clamp((p.vx||0)/1400,-.045,.045)}else{ty=Math.sin(t*3.3)*1.2;sy=1+Math.sin(t*3.3)*.006}
    const lerp=(a,b,k)=>a+(b-a)*k;v.x=lerp(v.x,tx,.24);v.y=lerp(v.y,ty,.24);v.scaleX=lerp(v.scaleX,sx,.22);v.scaleY=lerp(v.scaleY,sy,.22);v.lean=lerp(v.lean,lean,.2);
    ctx.save();ctx.translate(p.x||0,(typeof groundLevel==='function'?groundLevel(p):760)-70);ctx.rotate(v.lean);ctx.scale(v.scaleX,v.scaleY);ctx.translate(-(p.x||0),-((typeof groundLevel==='function'?groundLevel(p):760)-70));ctx.translate(v.x,v.y);const r=baseDrawFighter.apply(this,arguments);ctx.restore();return r;
  };

  /* Otimização adaptativa: corta apenas decoração, nunca regras. */
  let fpsFrames=0,fpsLast=performance.now(),fpsValue=60;
  function perfTick(){fpsFrames++;const n=performance.now();if(n-fpsLast>=1000){fpsValue=Math.round(fpsFrames*1000/(n-fpsLast));fpsFrames=0;fpsLast=n;data.fps=fpsValue;const low=fpsValue<42;if(low!==data.lowFps){data.lowFps=low;document.body.classList.toggle('v11-low-fps',low);save()} }}
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){perfTick();if(f&&!isRavamFight(f)){initFight(f);for(const p of[f.p1,f.p2]){if(!p)continue;if(p.v11HitConfirm>0)p.v11HitConfirm=Math.max(0,p.v11HitConfirm-dt);if(!Number.isFinite(p.vx))p.vx=0;if(!Number.isFinite(p.vy))p.vy=0;if(p.state==='idle'&&Math.abs(p.vx||0)<2)p.vx=0}if(data.lowFps){const lists=['proProjectiles','proImpacts','knives','orbs','rays','lightnings'];for(const k of lists){const a=f[k];if(Array.isArray(a)&&a.length>55)a.splice(0,a.length-55)}try{if(typeof sparks!=='undefined'&&sparks.length>65)sparks.splice(0,sparks.length-65)}catch(_){}}}return baseUpdate.apply(this,arguments)};

  /* Lista de golpes exclusiva por campeão. */
  function moveDialog(id){const c=chars().find(x=>x.id===id);if(!c||id==='priya')return;const s=specOf(id);let d=document.getElementById('v11-moves-dialog');if(!d){d=document.createElement('dialog');d.id='v11-moves-dialog';d.className='v11-dialog';document.body.appendChild(d)}d.innerHTML=`<header><div><small>${esc(s.role)} · ${esc(s.passive)}</small><h2>${esc(c.name)}</h2><p>${esc(s.desc)}</p></div><button data-close>×</button></header><div class="v11-move-list">${s.moves.map((m,i)=>`<article><span>${String(i+1).padStart(2,'0')}</span><b>${esc(m.split(' · ')[0])}</b><p>${esc(m.split(' · ').slice(1).join(' · '))}</p></article>`).join('')}</div><footer>Ultimate: <b>${esc(ULT[id]||'ULTIMATE SUPREMA')}</b> · Passiva: <b>${esc(s.passive)}</b></footer>`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal()}

  function enhanceSelect(){const root=document.querySelector('.select.mk-arena');if(!root||root.dataset.v11==='1')return;root.dataset.v11='1';root.classList.add('v11-select');const status=root.querySelector('.pick-status')||root.querySelector('.v6-select-tools');const bar=document.createElement('section');bar.className='v11-select-bar';bar.innerHTML=`<div><small>V11 · ELENCO COMPETITIVO</small><b>ESCOLHA POR ESTILO</b></div><div class="v11-role-filters"><button data-role="all" class="active">TODOS</button>${['RUSHDOWN','CONTROLADOR','TANQUE','ZONER','ASSASSINO','MÍMICO','VERSÁTIL'].map(x=>`<button data-role="${x}">${x}</button>`).join('')}</div><button class="v11-moves-current">LISTA DE GOLPES</button>`;(status||root.firstElementChild)?.after(bar);
    let active='all';const apply=()=>{root.querySelectorAll('.mk-fighter[data-id]').forEach(card=>{const s=specOf(card.dataset.id),show=active==='all'||s.role===active||s.role.includes(active);card.hidden=!show;card.dataset.v11Role=s.role;let tag=card.querySelector('.v11-role-tag');if(!tag){tag=document.createElement('span');tag.className='v11-role-tag';card.appendChild(tag)}tag.textContent=s.role})};bar.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{active=b.dataset.role;bar.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('active',x===b));apply()});bar.querySelector('.v11-moves-current').onclick=()=>{const selected=root.querySelector('.mk-fighter.selected,[aria-selected="true"],.v7-keyfocus')?.dataset?.id||root.querySelector('.mk-fighter[data-id]:not([hidden])')?.dataset?.id||'rojo';moveDialog(selected)};apply();
    root.addEventListener('dblclick',e=>{const card=e.target.closest('.mk-fighter[data-id]');if(card)moveDialog(card.dataset.id)});
  }

  function enhanceLobby(){const menu=document.querySelector('.menu.pro-lobby-ready,.v8-supreme-lobby');if(!menu)return;menu.classList.add('v11-lobby');const center=menu.querySelector('.pro-lobby-hero');if(center&&!center.querySelector('.v11-featured-label')){const s=document.createElement('div');s.className='v11-featured-label';s.innerHTML='<small>CAMPEÃO EM DESTAQUE</small><b>SELEÇÃO DINÂMICA</b><span>Maestria · Skin · Rank · Título</span>';center.appendChild(s)}const central=menu.querySelector('.v8-command-center,.v82-polished');if(central)central.classList.add('v11-central');}

  function enhancePass(){const host=document.querySelector('.pro-pass-screen');if(!host||host.querySelector('.v11-pass-focus'))return;const snap=prog(),p=snap?.pass||{};const season=p.seasonName||'TEMPORADA ATUAL',pass=p.passName||'PASSE DE BATALHA';const sec=document.createElement('section');sec.className='v11-pass-focus';sec.innerHTML=`<div><small>TEMPORADA DE 28 DIAS</small><h3>${esc(season)}</h3><b>PASSE ${esc(pass)}</b></div><div><span>PATAMAR</span><strong>${p.tier||1}/70</strong><em>${Math.round((p.ratio||0)*100)}% DO PRÓXIMO</em></div>`;host.querySelector('.pp-pass-header')?.after(sec)}

  function rankInfo(){const rp=Number(comp()?.rank?.rp)||0;const ranks=[['FERRO',0,'⬟'],['BRONZE',200,'⬢'],['PRATA',450,'◆'],['OURO',750,'✦'],['PLATINA',1100,'✧'],['DIAMANTE',1500,'◇'],['MESTRE',1950,'♛'],['PRIMORDIAL',2500,'✹']];let out=ranks[0];for(const r of ranks)if(rp>=r[1])out=r;return{name:out[0],rp,icon:out[2]}}
  function enhanceRanking(){const card=document.querySelector('.ranking-screen,.card');if(!card||!document.querySelector('.ranking-screen')||card.querySelector('.v11-ranked-season'))return;const r=rankInfo(),sec=document.createElement('section');sec.className='v11-ranked-season';sec.innerHTML=`<div><small>RANKED V11</small><h3>${r.icon} ${r.name}</h3><p>${fmt(r.rp)} RP · sequência atual ${fmt(comp()?.rank?.streak||0)}</p></div><div><b>RECOMPENSA DE TEMPORADA</b><span>Quanto maior o rank, maior o bônus de encerramento. A temporada acompanha o ciclo de 28 dias.</span></div>`;card.querySelector('.select-subtitle')?.after(sec)}

  const STORY_CONTEXT=[
    ['SANGUE NA ARENA','Rojo entra para provar que velocidade não basta: cada vitória deixa uma marca.'],['O PRIMEIRO SINAL','Uma falha nos registros antigos revela lutadores apagados da história.'],['GELO CONTRA SANGUE','Thuvaa desafia Rojo e transforma rivalidade em disputa pelo centro da Arena.'],['ECO DO SISTEMA','Nine85 aparece entre dados corrompidos e ameaça reescrever o placar.'],['CAÇADORES DO SUBMUNDO','Knunka segue rastros que levam aos campeões secretos.'],['A COROA NÃO DORME','A temporada chega ao ponto em que cada combate muda o destino do elenco.']
  ];
  const baseStory=window.startStory;
  if(typeof baseStory==='function')window.startStory=function(id){if(id==='priya')return baseStory.apply(this,arguments);const progress=Number(stateRef()?.storyProgress)||0,scene=STORY_CONTEXT[Math.min(STORY_CONTEXT.length-1,Math.floor(progress/3))];let d=document.getElementById('v11-story-dialog');if(!d){d=document.createElement('dialog');d.id='v11-story-dialog';d.className='v11-dialog v11-story';document.body.appendChild(d)}d.innerHTML=`<header><div><small>CRÔNICAS DE SORTEP NIAK · CAPÍTULO ${progress+1}</small><h2>${scene[0]}</h2><p>${scene[1]}</p></div><button data-close>×</button></header><div class="v11-story-map"><span>ATO ${Math.floor(progress/5)+1}</span><b>${esc(chars().find(c=>c.id===id)?.name||'CAMPEÃO')}</b><p>Prepare o confronto. A vida será restaurada totalmente entre as etapas da campanha.</p></div><button class="btn big" data-enter>CONTINUAR A HISTÓRIA</button>`;d.querySelector('[data-close]').onclick=()=>d.close();d.querySelector('[data-enter]').onclick=()=>{d.close();baseStory.apply(this,arguments)};d.showModal()};

  /* Loja premium: busca + filtros + cards sem duplicar Passe. */
  function enhanceShop(){const shop=document.querySelector('.shop,.shop-ultimate');if(!shop||shop.querySelector('.v11-shop-tools'))return;shop.classList.add('v11-shop');const grid=shop.querySelector('.shop-grid,.lobby-actions');if(!grid)return;const tools=document.createElement('section');tools.className='v11-shop-tools';tools.innerHTML=`<label>⌕ <input placeholder="Buscar na loja..." maxlength="30"></label><div><button class="active" data-q="">TODOS</button><button data-q="campe">CAMPEÕES</button><button data-q="roleta">ROLETA</button><button data-q="cosm">COSMÉTICOS</button><button data-q="recurso">RECURSOS</button></div>`;grid.before(tools);const input=tools.querySelector('input'),buttons=[...tools.querySelectorAll('[data-q]')];const apply=()=>{const q=(input.value+' '+(buttons.find(b=>b.classList.contains('active'))?.dataset.q||'')).trim().toLowerCase();shop.querySelectorAll('.shop-card,.v83-shop-card,.btn').forEach(el=>{if(el.closest('.v11-shop-tools'))return;const txt=el.textContent.toLowerCase();if(el.id==='btn-back'||el.id==='shop-ultimate-back')return;el.classList.toggle('v11-filter-hidden',!!q&&!txt.includes(q))})};input.oninput=apply;buttons.forEach(b=>b.onclick=()=>{buttons.forEach(x=>x.classList.toggle('active',x===b));apply()})}

  /* Perfil completo + histórico recente. */
  function enhanceProfile(){const d=document.querySelector('#exp-profile,.ultimate-dialog[data-kind="profile"]');if(!d||d.querySelector('.v11-profile-extra'))return;const s=stateRef(),r=rankInfo(),fav=Object.entries(data.winsByChar).sort((a,b)=>b[1]-a[1])[0]?.[0]||'rojo',fc=chars().find(c=>c.id===fav);const sec=document.createElement('section');sec.className='v11-profile-extra';sec.innerHTML=`<div class="v11-profile-banner"><div><small>${esc(s?.playerName||'JOGADOR')}</small><h3>${esc(fc?.name||'ROJO')} · CAMPEÃO FAVORITO</h3><span>${esc(specOf(fav).passive)} · ${fmt(data.winsByChar[fav]||0)} vitórias</span></div><button data-moves>GOLPES</button></div><h4>HISTÓRICO RECENTE</h4><div class="v11-history">${data.history.length?data.history.slice(0,6).map(h=>`<div class="${h.won?'win':'loss'}"><b>${h.won?'VITÓRIA':'DERROTA'}</b><span>${esc(h.p1)} × ${esc(h.p2)}</span><small>${new Date(h.at).toLocaleDateString('pt-BR')} · ${fmt(h.damage)} dano · ${h.combo}x combo</small></div>`).join(''):'<p>Nenhuma partida registrada nesta versão.</p>'}</div><button class="btn" data-ach>🏆 CONQUISTAS V11</button>`;d.querySelector('.ultimate-body,.exp-profile-actions')?.before(sec);sec.querySelector('[data-moves]').onclick=()=>moveDialog(fav);sec.querySelector('[data-ach]').onclick=openAchievements}
  function openAchievements(){let d=document.getElementById('v11-ach-dialog');if(!d){d=document.createElement('dialog');d.id='v11-ach-dialog';d.className='v11-dialog';document.body.appendChild(d)}d.innerHTML=`<header><div><small>CARREIRA V11</small><h2>CONQUISTAS</h2><p>Objetivos raros com recompensa real em Gold.</p></div><button data-close>×</button></header><div class="v11-ach-grid">${ACH.map(a=>{const done=!!data.ach[a[0]],claimed=!!data.claimed[a[0]];return `<article class="${done?'done':''}"><span>${done?'✓':'◇'}</span><div><b>${a[1]}</b><p>${a[2]}</p><small>+${fmt(a[3])} GOLD</small></div><button data-claim="${a[0]}" ${!done||claimed?'disabled':''}>${claimed?'RESGATADO':done?'RESGATAR':'BLOQUEADO'}</button></article>`}).join('')}</div>`;d.querySelector('[data-close]').onclick=()=>d.close();d.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{const id=b.dataset.claim,a=ACH.find(x=>x[0]===id);if(!a||!data.ach[id]||data.claimed[id])return;data.claimed[id]=true;grantGold(a[3]);save();toast(`+${fmt(a[3])} GOLD · ${a[1]}`,'reward');openAchievements()});d.showModal()}

  /* Pós-luta único: carreira, precisão aproximada, rank e progresso. */
  const baseResult=window.showMatchResult;
  if(typeof baseResult==='function')window.showMatchResult=function(won,options={}){const f=game();if(f&&!isRavamFight(f)){const s=f.megaStats?.p1||{};data.seasonMatches++;if(won)data.winsByChar[f.p1?.id]=(data.winsByChar[f.p1?.id]||0)+1;data.history.unshift({at:Date.now(),won:!!won,p1:f.p1?.name||'P1',p2:f.p2?.name||'P2',p1id:f.p1?.id,p2id:f.p2?.id,damage:Math.round(s.damage||0),combo:s.maxCombo||0,hits:s.hits||0,crits:s.crits||0});data.history=data.history.slice(0,12);checkAchievements(f,!!won);save()}const r=baseResult.apply(this,arguments);if(f&&!isRavamFight(f))setTimeout(()=>{const card=document.querySelector('#match-result-overlay .match-result-card');if(!card||card.querySelector('.v11-result'))return;const s=f.megaStats?.p1||{},accuracy=s.hits?Math.round(clamp((s.hits/(s.hits+Math.max(1,s.dodges||0)))*100,25,100)):0,rank=rankInfo();const sec=document.createElement('section');sec.className='v11-result';sec.innerHTML=`<header><small>RELATÓRIO V11</small><h3>${won?'VITÓRIA CONSOLIDADA':'ANÁLISE DA DERROTA'}</h3></header><div><span>DANO<b>${fmt(s.damage||0)}</b></span><span>COMBO<b>${s.maxCombo||0}x</b></span><span>PRECISÃO<b>${accuracy}%</b></span></div><footer>${esc(specOf(f.p1?.id).role)} · ${esc(specOf(f.p1?.id).passive)} · ${data.seasonMatches} partidas nesta temporada</footer>`;card.querySelector('.match-result-actions')?.before(sec)},30);return r};

  /* Arenas mais legíveis / identidade própria, sem mexer nas regras existentes. */
  function arenaCue(){const f=game();if(!f||isRavamFight(f)||f.v11StageCue)return;f.v11StageCue=true;const e=document.createElement('div');e.className='v11-stage-cue';e.innerHTML=`<small>ARENA SELECIONADA</small><b>${esc(f.stage?.name||'ARENA')}</b><span>${esc(f.stage?.desc||'Adapte sua estratégia ao cenário.')}</span>`;document.body.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.remove('show');setTimeout(()=>e.remove(),180)},1800)}


  /* V16.2: sistema ranqueado removido. A temporada do Passe continua independente. */
  function syncRankSeason(){
    const num=Number(prog()?.pass?.seasonNumber||prog()?.season?.number||0);if(!num)return;
    if(data.rankSeasonNumber!==num){data.rankSeasonNumber=num;data.lastRankSeasonReward=0;save();}
  }
  setTimeout(syncRankSeason,180);

  /* Diagnóstico interno F10. */
  function runTests(){const tests=[];const add=(name,ok,detail='')=>tests.push({name,ok:!!ok,detail});const fns=['startFight','damage','playerInput','aiInput','renderSelect','renderShop','renderMenu'];fns.forEach(n=>add('FUNÇÃO '+n,typeof window[n]==='function'));add('ELENCO',chars().filter(c=>c.id!=='priya').length>=27,`${chars().length} registros`);add('PASSE 28 DIAS',!!prog()?.pass?.seasonName);add('CONFIGURAÇÕES',typeof window.LutadorUltimate?.openSettings==='function');add('R.A.V.A.M PRESERVADO',!!window.LutadorRavam||!!document.querySelector('script[src*="ravam"]'));add('SEM ARENA PRO',!document.body.textContent.includes('ARENA PRO'));data.testRuns++;data.lastTest={at:Date.now(),ok:tests.every(t=>t.ok),tests};save();return tests}
  function testPanel(){const tests=runTests();let d=document.getElementById('v11-test-dialog');if(!d){d=document.createElement('dialog');d.id='v11-test-dialog';d.className='v11-dialog';document.body.appendChild(d)}d.innerHTML=`<header><div><small>PAINEL INTERNO · F10</small><h2>DIAGNÓSTICO V11</h2><p>FPS ${data.fps} · ${tests.filter(t=>t.ok).length}/${tests.length} verificações aprovadas.</p></div><button data-close>×</button></header><div class="v11-test-list">${tests.map(t=>`<div class="${t.ok?'ok':'bad'}"><b>${t.ok?'✓':'×'} ${t.name}</b><span>${esc(t.detail||'')}</span></div>`).join('')}</div>`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal()}
  document.addEventListener('keydown',e=>{if(e.code==='F10'){e.preventDefault();testPanel()}},true);

  /* Decoração única via observer agendado. */
  let queued=false;function decorate(){queued=false;enhanceLobby();enhanceSelect();enhancePass();enhanceRanking();enhanceShop();enhanceProfile();arenaCue()}
  const observer=new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(decorate)}});observer.observe(document.getElementById('app')||document.body,{subtree:true,childList:true});
  setTimeout(decorate,100);

  window.LutadorV11=Object.freeze({version:VERSION,data,save,specOf,moveDialog,openAchievements,runTests});
})();
