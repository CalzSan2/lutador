/* V32: isolated, single-round CPU trials and optional arena rules.
 * No roster unlocks, global difficulty changes, or online protocol changes.
 */
(() => {
  'use strict';
  if (window.NiakV32Trials) return;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const game = () => typeof fight !== 'undefined' ? fight : null;
  const width = () => typeof W !== 'undefined' ? W : 1600;
  const ground = () => typeof GROUND_Y !== 'undefined' ? GROUND_Y : 850;
  const chars = () => typeof CHARACTERS !== 'undefined' ? CHARACTERS : [];
  const regular = c => c && !c.ravamOnly && !c.ravamLegendExclusive && !['priya','alana','aria','leo','tharoth','aurora','kai_draconis','priya_aranya','nutoa','rifana','petros'].includes(c.id);
  let active = null, lastResult = null, configured = { modifierIds: [], maxSeconds: 90, difficulty: 'normal' };
  const definitions = [
    ['fortitude','Pulso Vital','Ambos começam com 30% mais vida máxima.','life'],
    ['glass','Vidro Vivo','Ambos começam com 30% menos vida máxima.','life'],
    ['heavyhands','Punhos de Ferro','Todos os ataques causam 22% mais dano.',''],
    ['precision','Oficina Marcial','Socos, chutes e ganchos causam 20% mais dano.',''],
    ['ranged','Arsenal Energizado','Projéteis e poderes não corporais causam 18% mais dano.',''],
    ['haste','Pista Veloz','Velocidade de movimento dos dois lutadores aumenta 14%.','speed'],
    ['heavyboots','Botas de Basalto','Velocidade de movimento dos dois lutadores cai 15%.','speed'],
    ['lowgrav','Gravidade Lunar','Gravidade reduzida a 70%; saltos duram mais.','gravity'],
    ['heavygrav','Núcleo Denso','Gravidade aumentada a 123%; aterrissagens chegam antes.','gravity'],
    ['highjump','Impulso Celeste','Impulso inicial de cada salto aumenta 18%.',''],
    ['featherfall','Queda de Pluma','Gravidade durante a descida cai 38%.',''],
    ['tailwind','Vento Cruzado','Uma corrente lateral alterna de direção a cada seis segundos.',''],
    ['superflow','Reator de Super','Ambos recebem 2% de carga de Super por segundo.','super'],
    ['superleak','Reator Instável','Ambos perdem 1,2% de carga de Super por segundo.','super'],
    ['staminaflow','Respiração Profunda','Ambos recuperam 12 pontos extras de fôlego por segundo.','stamina'],
    ['staminatax','Ar Rarefeito','Ambos perdem 8 pontos de fôlego por segundo.','stamina'],
    ['medkit','Entrega Médica','A cada oito segundos surge uma cápsula que cura 9% da vida.',''],
    ['energycell','Célula de Energia','A cada onze segundos surge uma cápsula de 22% de Super.',''],
    ['coolant','Névoa Refrigerante','A cada treze segundos surge uma cápsula que reduz recargas em 1,5s.',''],
    ['vampire','Sangue Renovado','5% do dano efetivo causado retorna como vida ao atacante.',''],
    ['recoil','Espinhos de Retorno','Atacantes recebem de volta 6% do dano efetivo, sem nocaute por reflexão.',''],
    ['laststand','Última Chama','Abaixo de 25% de vida, seus ataques causam 28% mais dano.',''],
    ['anchor','Postura de Pedra','No chão e quase parado, receba 12% menos dano.',''],
    ['aerial','Vantagem Aérea','Ataques iniciados no ar causam 20% mais dano.','position'],
    ['grounded','Raízes de Combate','Ataques iniciados no chão causam 15% mais dano.','position'],
    ['comboheal','Combo Restaurador','Cada terceiro acerto numa sequência cura 2% da vida máxima.',''],
    ['combocharge','Combo Condutor','Cada terceiro acerto numa sequência recebe 5% de Super.',''],
    ['variety','Repertório Vivo','Alternar a família do golpe aumenta o dano do próximo acerto em 15%.',''],
    ['rhythm','Ritmo de Aço','Nas primeiras duas de cada seis segundos, recargas andam 40% mais rápido.',''],
    ['movingzone','Trilha de Fôlego','Um círculo móvel no chão recupera 24 de fôlego por segundo.',''],
    ['centerheal','Fonte Central','O círculo central cura 0,6% de vida por segundo a quem ficar nele.',''],
    ['edgeshazard','Margens em Brasa','Após aviso de três segundos, as bordas queimam por três segundos.',''],
    ['tide','Maré Gravitacional','A gravidade alterna entre 75% e 120% a cada cinco segundos.','gravity'],
    ['mirrorshield','Escudo Periódico','Nos primeiros dois de cada oito segundos, receba 22% menos dano.',''],
    ['hurtsuper','Determinação','Dano recebido gera Super extra, até 12% por golpe.',''],
    ['guardflow','Guarda Respirante','Um bloqueio real recupera 8 de fôlego e 2% de Super.',''],
    ['overtime','Escalada Final','Depois de 35s, o dano cresce 1% por segundo, até 40%.',''],
    ['closequarters','Círculo de Impacto','Golpes a menos de 170 pixels do rival causam 18% mais dano.','distance'],
    ['longrange','Linha do Horizonte','Golpes a mais de 350 pixels do rival causam 22% mais dano.','distance'],
    ['comebackheal','Segunda Respiração','Uma vez na luta, ao cair abaixo de 25% de vida, recupere 10%.','']
  ];
  const modifiers = definitions.map(([id,name,description,group]) => Object.freeze({id,category:'modifier',name,description,group}));
  const modifierMap = new Map(modifiers.map(m => [m.id,m]));
  const families = [
    {id:'sprint',name:'Contra o Relógio',mods:['haste','heavyhands'],goal:'win',stages:['cidade','dojo'],cpu:'rojo'},
    {id:'bastion',name:'Bastião Intacto',mods:['fortitude','anchor'],goal:'health',stages:['castelo','templo'],cpu:'thuvaa'},
    {id:'aerial',name:'Domínio do Céu',mods:['lowgrav','aerial'],goal:'air',stages:['espaco','geleira'],cpu:'dart'},
    {id:'guard',name:'Leitura da Guarda',mods:['guardflow','precision'],goal:'blocks',stages:['dojo','castelo'],cpu:'vlad'},
    {id:'center',name:'Rei do Círculo',mods:['centerheal','edgeshazard'],goal:'center',stages:['templo','ruinas'],cpu:'knunka'},
    {id:'combo',name:'Corrente Implacável',mods:['combocharge','staminaflow'],goal:'combo',stages:['cidade','dojo'],cpu:'rtess'},
    {id:'recovery',name:'Rota de Resgate',mods:['medkit','laststand'],goal:'pickups',stages:['floresta','geleira'],cpu:'yoi'},
    {id:'endurance',name:'Último de Pé',mods:['staminatax','comebackheal'],goal:'survive',stages:['deserto','vulcao'],cpu:'frogh'},
    {id:'precision',name:'Passos sem Falhas',mods:['glass','movingzone'],goal:'untouched',stages:['geleira','espaco'],cpu:'jetde'},
    {id:'pursuit',name:'Caçador em Movimento',mods:['haste','tailwind'],goal:'moving',stages:['floresta','cidade'],cpu:'nine85'},
    {id:'variety',name:'Repertório do Mestre',mods:['variety','coolant'],goal:'variety',stages:['ruinas','templo'],cpu:'hock'},
    {id:'mastery',name:'Convergência Final',mods:['tide','overtime','energycell'],goal:'mastery',stages:['espaco','vulcao'],cpu:'grizz'}
  ];
  function requirements(goal,tier) {
    switch(goal) {
      case 'health': return {health:.12+tier*.018};
      case 'air': return {airHits:1+Math.floor(tier/3)};
      case 'blocks': return {blocks:1+Math.floor(tier/3)};
      case 'center': return {centerSeconds:3+tier};
      case 'combo': return {combo:2+Math.floor(tier/3)};
      case 'pickups': return {pickups:1+Math.floor(tier/5)};
      case 'untouched': return {maxHitsTaken:22-tier};
      case 'moving': return {movingHits:2+Math.floor(tier/2)};
      case 'variety': return {variety:Math.min(4,2+Math.floor(tier/4))};
      case 'mastery': return {combo:2+Math.floor(tier/4),centerSeconds:2+tier/2};
      default: return {};
    }
  }
  function goalDescription(goal,r) {
    const extra=[];
    if(r.health) extra.push(`termine com pelo menos ${Math.round(r.health*100)}% de vida`);
    if(r.airHits) extra.push(`acerte ${r.airHits} golpes no ar`);
    if(r.blocks) extra.push(`bloqueie ${r.blocks} ataques`);
    if(r.centerSeconds) extra.push(`fique ${r.centerSeconds}s no círculo central`);
    if(r.combo) extra.push(`faça uma sequência de ${r.combo} acertos`);
    if(r.pickups) extra.push(`colete ${r.pickups} cápsula(s)`);
    if(r.maxHitsTaken) extra.push(`receba no máximo ${r.maxHitsTaken} acertos`);
    if(r.movingHits) extra.push(`acerte ${r.movingHits} golpes em movimento`);
    if(r.variety) extra.push(`acerte ${r.variety} famílias de golpe diferentes`);
    return goal==='survive' ? 'Sobreviva até o fim do tempo ou nocauteie o rival.' : `Vença${extra.length?' e '+extra.join('; '):''}. No tempo, vence a maior proporção de vida, desde que tenha causado dano.`;
  }
  const trials=families.flatMap((fam,familyIndex)=>Array.from({length:10},(_,i)=>{
    const tier=i+1, req=requirements(fam.goal,tier), maxSeconds=fam.id==='sprint'?85-tier*3:fam.goal==='survive'?36+tier*4:95+tier*2;
    return Object.freeze({id:`trial-${fam.id}-${String(tier).padStart(2,'0')}`,category:'trial',family:fam.id,familyName:fam.name,tier,name:`${fam.name} · ${tier}/10`,description:`${goalDescription(fam.goal,req)} Limite ${maxSeconds}s.`,goal:fam.goal,requirements:Object.freeze(req),maxSeconds,modifierIds:Object.freeze(fam.mods.slice()),stageId:fam.stages[i%2],opponentId:fam.cpu,difficulty:tier<4?'easy':tier<8?'normal':'hard',cpuHp:.68+tier*.052,cpuDamage:.53+tier*.057,cpuSpeed:.86+tier*.022,seed:familyIndex*101+tier*29});
  }));
  const trialMap=new Map(trials.map(t=>[t.id,t]));
  function ownedCharacters() {
    const ids=new Set(typeof state!=='undefined'&&Array.isArray(state.roster)?state.roster:[]);
    return chars().filter(c=>regular(c)&&ids.has(c.id));
  }
  function validateModifiers(ids) {
    if(!Array.isArray(ids)) return {ok:false,error:'Escolha uma lista de modificadores.'};
    if(ids.length>3) return {ok:false,error:'Escolha no máximo três modificadores.'};
    if(new Set(ids).size!==ids.length) return {ok:false,error:'Não repita modificadores.'};
    const groups=new Map();
    for(const id of ids){const m=modifierMap.get(id);if(!m)return {ok:false,error:'Modificador desconhecido: '+id};if(m.group&&groups.has(m.group))return {ok:false,error:`${m.name} não combina com ${groups.get(m.group)}.`};if(m.group)groups.set(m.group,m.name)}
    return {ok:true,modifierIds:ids.slice()};
  }
  function configure(options={}) {
    if(!options||typeof options!=='object'||Array.isArray(options))return {ok:false,error:'Configuração inválida.'};
    const valid=validateModifiers(options.modifierIds??configured.modifierIds);if(!valid.ok)return valid;
    const maxSeconds=finite(options.maxSeconds??configured.maxSeconds,90);
    if(maxSeconds<30||maxSeconds>180)return {ok:false,error:'O duelo deve durar entre 30 e 180 segundos.'};
    const difficulty=options.difficulty??configured.difficulty;
    if(!['easy','normal','hard'].includes(difficulty))return {ok:false,error:'Dificuldade inválida.'};
    if(options.opponentId&&!chars().some(c=>regular(c)&&c.id===options.opponentId))return {ok:false,error:'Rival inválido para um duelo comum.'};
    if(options.stageId&&!(typeof STAGES!=='undefined'&&STAGES.some(s=>s.id===options.stageId)))return {ok:false,error:'Arena inválida.'};
    configured={...configured,...options,modifierIds:valid.modifierIds,maxSeconds,difficulty};
    return {ok:true,config:{...configured,modifierIds:configured.modifierIds.slice()}};
  }
  function stats(){return {damageDealt:0,damageTaken:0,hits:0,hitsTaken:0,airHits:0,movingHits:0,blocks:0,bestCombo:0,chain:0,lastHitAt:-10,centerSeconds:0,pickups:0,types:new Set()}}
  const owns = (f=game()) => !!active && active.f===f && f?.v32Trial===active;
  const enabled = id => active?.mods.has(id);
  function scaleHp(p,m){p.maxHp=Math.round(p.maxHp*m);p.hp=p.maxHp}
  function charge(p,n){p.superHitsDealt=Math.max(0,finite(p.superHitsDealt)+n*20);p.superHitsTaken=Math.max(0,finite(p.superHitsTaken)+n*15);p.downSuperCharge=clamp(finite(p.downSuperCharge)+n*10,0,10);if(typeof updateSuperMeter==='function')updateSuperMeter(p)}
  function heal(p,n){if(p.hp>0&&p.state!=='ko')p.hp=clamp(p.hp+n,0,p.maxHp)}
  function accelerate(p,n){for(const k of ['attackCd','throwCd','specialCd','extraCd','extra2Cd'])if(Number.isFinite(p[k]))p[k]=Math.max(0,p[k]-n)}
  function cleanupFight() {
    if(!active)return;
    const f=active.f;
    f.paused=true;f.over=true;f.matchOver=true;
    try{if(game()===f)fight=null;if(typeof bestOfThree!=='undefined')bestOfThree={p1Wins:0,p2Wins:0,round:1,active:false};if(typeof keys!=='undefined')for(const k of Object.keys(keys))keys[k]=false;if(typeof justPressed!=='undefined')for(const k of Object.keys(justPressed))delete justPressed[k]}catch(_){}
    active=null;
    document.getElementById('v32-trial-status')?.remove();
  }
  function cancel(options={}) {
    const hadRun=!!active;
    cleanupFight();
    if(hadRun)window.dispatchEvent(new CustomEvent('niak:v32-trial-cancel'));
    if(options.returnMenu!==false&&typeof renderMenu==='function')renderMenu();
    return {ok:true};
  }
  function launch(config,playerId) {
    if(!ownedCharacters().some(c=>c.id===playerId))return {ok:false,error:'Escolha um campeão comum já comprado no seu perfil.'};
    if(game()&&!owns()&&!game().over)return {ok:false,error:'Termine ou saia da partida atual antes de iniciar a prova.'};
    const candidates=chars().filter(c=>regular(c)&&c.id!=='ztaaa');
    const enemy=candidates.find(c=>c.id===config.opponentId&&c.id!==playerId)||candidates.find(c=>c.id!==playerId)||candidates[0];
    if(!enemy||typeof window.startFight!=='function')return {ok:false,error:'O motor de combate ainda não está disponível.'};
    cleanupFight();
    try{window.startFight(playerId,'v32-trial',enemy.id,config.stageId||'dojo')}catch(error){return {ok:false,error:'Não foi possível abrir o duelo: '+error.message}}
    const f=game();if(!f?.p1||!f?.p2)return {ok:false,error:'O duelo não foi criado.'};
    active={f,config,mods:new Set(config.modifierIds),elapsed:0,finished:false,pending:false,stats:stats(),pickups:[],nextDrops:{medkit:2,energycell:5,coolant:7},lastKinds:new Map(),chains:new Map(),comebacks:new Set(),previousGround:new Map(),previousVy:new Map(),hudT:0,damageDepth:0,seed:config.seed||7331};
    f.v32Trial=active;f.v15Awarded=true;f.v8ObjectivePaid=true;f.mutations=[];f.hazardT=Infinity;f.healOrbs=[];f.v15Objective=null;f.v8Objective=null;f.timer=config.maxSeconds;
    const oldDifficulty={easy:{dmg:.78,speed:.90,hp:.92},normal:{dmg:1,speed:1,hp:1},hard:{dmg:1.08,speed:1.07,hp:1.05},insane:{dmg:1.18,speed:1.13,hp:1.10}}[f.megaAiDifficulty]||{dmg:1,speed:1,hp:1};
    if(f.p2.megaDifficultyApplied){f.p2.dmg/=oldDifficulty.dmg;f.p2.speed/=oldDifficulty.speed;scaleHp(f.p2,1/oldDifficulty.hp)}
    f.megaAiDifficulty=config.difficulty;
    scaleHp(f.p2,config.cpuHp||1);f.p2.dmg*=config.cpuDamage||1;f.p2.speed*=config.cpuSpeed||1;
    for(const p of[f.p1,f.p2]){if(enabled('fortitude'))scaleHp(p,1.3);if(enabled('glass'))scaleHp(p,.7);if(enabled('haste'))p.speed*=1.14;if(enabled('heavyboots'))p.speed*=.85;active.previousGround.set(p,!!p.onGround);active.previousVy.set(p,p.vy||0)}
    if(typeof bestOfThree!=='undefined')bestOfThree={p1Wins:0,p2Wins:0,round:1,active:false};
    document.querySelectorAll?.('*')?.forEach(el=>{if(!el.children?.length&&el.textContent?.trim()==='MELHOR DE 3')el.textContent='PROVA · ROUND ÚNICO'});
    const status=document.createElement('div');status.id='v32-trial-status';status.setAttribute('role','status');status.style.cssText='position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:50;max-width:90vw;padding:8px 14px;background:#081323e8;border:1px solid #58d9bb;border-radius:9px;color:#ebfffa;font:600 12px system-ui;text-align:center;pointer-events:none';document.body.appendChild(status);updateStatus();
    window.dispatchEvent(new CustomEvent('niak:v32-trial-start',{detail:snapshot()}));
    return {ok:true,trialId:config.id,custom:!!config.custom};
  }
  function start(id,playerId){const t=trialMap.get(id);return t?launch(t,playerId):{ok:false,error:'Prova desconhecida.'}}
  function startCustom(playerId,modifierIdsOrConfig={},options={}) {
    const input=Array.isArray(modifierIdsOrConfig)?{...options,modifierIds:modifierIdsOrConfig}:modifierIdsOrConfig;
    const valid=configure(input);if(!valid.ok)return valid;
    const c=valid.config, difficultyScale={easy:.78,normal:1,hard:1.12}[c.difficulty];
    return launch({...c,id:'custom',name:'Laboratório de Arena',custom:true,tier:0,goal:'win',requirements:{},cpuHp:1,cpuSpeed:c.difficulty==='hard'?1.06:1,cpuDamage:difficultyScale,description:goalDescription('win',{})},playerId);
  }
  function objectiveStatus(run=active) {
    if(!run)return {complete:false,text:''};const s=run.stats,r=run.config.requirements,checks=[];
    if(r.health)checks.push([run.f.p1.hp/run.f.p1.maxHp>=r.health,`vida ${Math.round(run.f.p1.hp/run.f.p1.maxHp*100)}/${Math.round(r.health*100)}%`]);
    if(r.airHits)checks.push([s.airHits>=r.airHits,`aéreos ${s.airHits}/${r.airHits}`]);
    if(r.blocks)checks.push([s.blocks>=r.blocks,`bloqueios ${s.blocks}/${r.blocks}`]);
    if(r.centerSeconds)checks.push([s.centerSeconds>=r.centerSeconds,`centro ${s.centerSeconds.toFixed(1)}/${r.centerSeconds}s`]);
    if(r.combo)checks.push([s.bestCombo>=r.combo,`sequência ${s.bestCombo}/${r.combo}`]);
    if(r.pickups)checks.push([s.pickups>=r.pickups,`cápsulas ${s.pickups}/${r.pickups}`]);
    if(r.maxHitsTaken)checks.push([s.hitsTaken<=r.maxHitsTaken,`recebidos ${s.hitsTaken}/${r.maxHitsTaken}`]);
    if(r.movingHits)checks.push([s.movingHits>=r.movingHits,`em movimento ${s.movingHits}/${r.movingHits}`]);
    if(r.variety)checks.push([s.types.size>=r.variety,`famílias ${s.types.size}/${r.variety}`]);
    return {complete:checks.every(c=>c[0]),text:checks.map(c=>(c[0]?'✓ ':'')+c[1]).join(' · ')|| (run.config.goal==='survive'?'Sobreviva ou vença por nocaute':'Vença por nocaute ou vantagem de vida'),checks:checks.map(([complete,text])=>({complete,text}))};
  }
  function snapshot() {
    if(!active)return {active:false,lastResult};
    const s=active.stats,c=active.config;
    return {active:!active.finished,finished:active.finished,trialId:c.id,custom:!!c.custom,name:c.name,tier:c.tier,playerId:active.f.p1.id,opponentId:active.f.p2.id,modifierIds:c.modifierIds.slice(),elapsed:active.elapsed,remaining:Math.max(0,c.maxSeconds-active.elapsed),objective:objectiveStatus(),stats:{...s,types:[...s.types]},lastResult};
  }
  function updateStatus(){const el=document.getElementById('v32-trial-status');if(el&&active)el.textContent=`${active.config.name} · ${Math.ceil(Math.max(0,active.config.maxSeconds-active.elapsed))}s · ${objectiveStatus().text}`}
  function finish(won,reason) {
    if(!active||active.pending||active.finished)return;
    const run=active,f=run.f;run.pending=true;f.over=true;f.matchOver=true;f.paused=true;f.v15Awarded=true;f.earned=0;f.announce=won?'PROVA CONCLUÍDA':'PROVA ENCERRADA';
    if(typeof bestOfThree!=='undefined')bestOfThree={p1Wins:won?1:0,p2Wins:won?0:1,round:1,active:false};
    // Damage hooks have not recorded the lethal hit until their inner call returns.
    queueMicrotask(()=>{
      if(active!==run)return;
      run.finished=true;run.pending=false;const objective=objectiveStatus(run),finalWon=!!won&&objective.complete;
      const s=run.stats, health=clamp(f.p1.hp/f.p1.maxHp,0,1),score=Math.max(0,Math.round((finalWon?1000:0)+s.damageDealt*.08+s.bestCombo*40+health*400+(finalWon?(run.config.maxSeconds-run.elapsed)*4:0)+s.blocks*15));
      lastResult={trialId:run.config.id,custom:!!run.config.custom,tier:run.config.tier,won:finalWon,reason:won&&!objective.complete?'objective':reason,score,elapsed:run.elapsed,playerId:f.p1.id,opponentId:f.p2.id,damageDealt:Math.round(s.damageDealt),damageTaken:Math.round(s.damageTaken),hits:s.hits,hitsTaken:s.hitsTaken,bestCombo:s.bestCombo,airHits:s.airHits,movingHits:s.movingHits,blocks:s.blocks,pickups:s.pickups,centerSeconds:s.centerSeconds,types:[...s.types],healthRatio:health,objective,modifierIds:run.config.modifierIds.slice()};
      f.announce=finalWon?'PROVA CONCLUÍDA':'PROVA NÃO CONCLUÍDA';updateStatus();window.dispatchEvent(new CustomEvent('niak:v32-trial-result',{detail:{...lastResult}}));
    });
  }
  const oldEnd=window.endRound;
  if(typeof oldEnd==='function')window.endRound=function(f,winner,loser){if(!owns(f))return oldEnd.apply(this,arguments);if(!active.pending&&!active.finished){const timeout=f.timer<=0;const won=timeout?(active.config.goal==='survive'?f.p1.hp>0:(f.p1.hp/f.p1.maxHp>f.p2.hp/f.p2.maxHp&&active.stats.damageDealt>0)):winner===f.p1;finish(won,timeout?'time':'ko')}};
  function attackKind(src,type){const k=String(src?.proKind||src?.move?.kind||type||'power').toLowerCase();if(k.includes('kick'))return 'chute';if(k.includes('upper')||k.includes('hook'))return 'gancho';if(k.includes('punch')||k==='melee')return 'soco';if(k.includes('super')||k.includes('ultimate')||src?.megaUltimateBoostT>0)return 'super';return 'poder'}
  const oldDamage=window.damage;
  if(typeof oldDamage==='function')window.damage=function(victim,amount,src,dir,type){
    if(!owns()||active.finished||!victim||![active.f.p1,active.f.p2].includes(victim))return oldDamage.apply(this,arguments);
    const run=active,f=run.f,attacker=src?.owner||([f.p1,f.p2].includes(src)?src:null),combat=attacker&&attacker!==victim&&[f.p1,f.p2].includes(attacker)&&type!=='hazard';
    const before=victim.hp,kind=attackKind(src,type),melee=['soco','chute','gancho'].includes(kind),wasDefending=!!victim.defend,air=!!attacker&&!attacker.onGround,moving=!!attacker&&Math.abs(attacker.vx||0)>45,dist=attacker?Math.abs(attacker.x-victim.x):0;
    let dmg=finite(amount);
    if(combat){if(enabled('heavyhands'))dmg*=1.22;if(enabled('precision')&&melee)dmg*=1.2;if(enabled('ranged')&&!melee)dmg*=1.18;if(enabled('laststand')&&attacker.hp/attacker.maxHp<.25)dmg*=1.28;if(enabled('aerial')&&air)dmg*=1.2;if(enabled('grounded')&&!air)dmg*=1.15;if(enabled('variety')&&run.lastKinds.has(attacker)&&run.lastKinds.get(attacker)!==kind)dmg*=1.15;if(enabled('closequarters')&&dist<170)dmg*=1.18;if(enabled('longrange')&&dist>350)dmg*=1.22;if(enabled('overtime'))dmg*=1+clamp((run.elapsed-35)*.01,0,.4);if(enabled('anchor')&&victim.onGround&&Math.abs(victim.vx||0)<20)dmg*=.88;if(enabled('mirrorshield')&&run.elapsed%8<2)dmg*=.78}
    const result=oldDamage.call(this,victim,dmg,src,dir,type);
    const dealt=Math.max(0,before-victim.hp);
    if(combat){
      if(wasDefending&&dealt<=0&&dmg>0){if(victim===f.p1)run.stats.blocks++;if(enabled('guardflow')){victim.proStamina=clamp(finite(victim.proStamina,100)+8,0,100);charge(victim,.02)}}
      if(dealt>0){
        const chain=run.chains.get(attacker)||{n:0,t:-10};chain.n=run.elapsed-chain.t<=1.8?chain.n+1:1;chain.t=run.elapsed;run.chains.set(attacker,chain);run.lastKinds.set(attacker,kind);
        if(attacker===f.p1){const s=run.stats;s.hits++;s.damageDealt+=dealt;s.airHits+=air?1:0;s.movingHits+=moving?1:0;s.types.add(kind);s.bestCombo=Math.max(s.bestCombo,chain.n);s.chain=chain.n;s.lastHitAt=run.elapsed}else{run.stats.hitsTaken++;run.stats.damageTaken+=dealt}
        if(!run.pending){if(enabled('vampire'))heal(attacker,dealt*.05);if(enabled('recoil'))attacker.hp=Math.max(1,attacker.hp-dealt*.06);if(enabled('hurtsuper'))charge(victim,Math.min(.12,dealt/victim.maxHp*.8));if(chain.n%3===0){if(enabled('comboheal'))heal(attacker,attacker.maxHp*.02);if(enabled('combocharge'))charge(attacker,.05)}}
      }
    }
    return result;
  };
  function rng(){active.seed=(Math.imul(active.seed,1664525)+1013904223)>>>0;return active.seed/4294967296}
  function tickPickups(dt){
    const run=active;for(const [id,interval] of [['medkit',8],['energycell',11],['coolant',13]]){if(enabled(id)&&run.elapsed>=run.nextDrops[id]){run.nextDrops[id]+=interval;run.pickups.push({id,x:width()*(.18+rng()*.64),life:12})}}
    for(const drop of run.pickups){drop.life-=dt;for(const p of[run.f.p1,run.f.p2]){if(p.hp>0&&p.onGround&&Math.abs(p.x-drop.x)<46){if(drop.id==='medkit')heal(p,p.maxHp*.09);if(drop.id==='energycell')charge(p,.22);if(drop.id==='coolant')accelerate(p,1.5);if(p===run.f.p1)run.stats.pickups++;drop.life=0;break}}}
    run.pickups=run.pickups.filter(d=>d.life>0).slice(-9);
  }
  function zoneX(){return width()*(.5+Math.sin(active.elapsed*.45)*.27)}
  function tick(dt){
    const run=active,f=run.f;run.elapsed=Math.min(run.config.maxSeconds,run.elapsed+dt);f.timer=Math.max(.001,run.config.maxSeconds-run.elapsed);
    for(const p of[f.p1,f.p2]){
      if(p.hp<=0||p.state==='ko')continue;
      if(enabled('superflow'))charge(p,.02*dt);if(enabled('superleak'))charge(p,-.012*dt);
      if(enabled('staminaflow'))p.proStamina=clamp(finite(p.proStamina,100)+12*dt,0,100);if(enabled('staminatax'))p.proStamina=clamp(finite(p.proStamina,100)-8*dt,0,100);
      if(enabled('rhythm')&&run.elapsed%6<2)accelerate(p,dt*.4);
      if(enabled('tailwind'))p.x=clamp(p.x+(Math.floor(run.elapsed/6)%2?-1:1)*24*dt,28,width()-28);
      if(p.onGround&&Math.abs(p.x-width()/2)<145){if(p===f.p1)run.stats.centerSeconds+=dt;if(enabled('centerheal'))heal(p,p.maxHp*.006*dt)}
      if(enabled('movingzone')&&p.onGround&&Math.abs(p.x-zoneX())<105)p.proStamina=clamp(finite(p.proStamina,100)+24*dt,0,100);
      if(enabled('edgeshazard')&&run.elapsed%6>=3&&p.onGround&&(p.x<150||p.x>width()-150))p.hp=Math.max(1,p.hp-p.maxHp*.015*dt);
      if(enabled('comebackheal')&&!run.comebacks.has(p)&&p.hp/p.maxHp<.25){heal(p,p.maxHp*.1);run.comebacks.add(p)}
      // Compensate the engine's gravity only for ordinary jumps, never flight/traps.
      if(!p.onGround&&!p.kloTrap&&!p.kloSkyFall&&!p.jimmyFlightT&&!p.hockFlightT){let g=enabled('lowgrav')?.70:enabled('heavygrav')?1.23:enabled('tide')?(Math.floor(run.elapsed/5)%2?1.2:.75):1;if(enabled('featherfall')&&p.vy<0)g*=.62;p.vy+=(typeof GRAVITY!=='undefined'?GRAVITY:-1900)*(g-1)*dt;if(enabled('highjump')&&run.previousGround.get(p)&&p.vy>0)p.vy*=1.18}
      run.previousGround.set(p,!!p.onGround);
    }
    tickPickups(dt);run.hudT+=dt;if(run.hudT>.2){run.hudT=0;updateStatus()}
    if(run.elapsed>=run.config.maxSeconds){const won=run.config.goal==='survive'?f.p1.hp>0:f.p1.hp/f.p1.maxHp>f.p2.hp/f.p2.maxHp&&run.stats.damageDealt>0;finish(won,'time')}
  }
  const oldUpdate=window.update;
  if(typeof oldUpdate==='function')window.update=function(f,dt){
    if(!owns(f))return oldUpdate.apply(this,arguments);
    if(active.finished||active.pending||f.over)return;
    const paused=f.paused||f.v5IntroLock;const safeDt=clamp(finite(dt),0,.05);
    // Keep legacy random objectives and reward handlers inactive in explicit trials.
    f.v15Awarded=true;f.v8ObjectivePaid=true;f.hazardT=Infinity;f.v15Objective=null;f.v8Objective=null;
    f.timer=Math.max(.1,active.config.maxSeconds-active.elapsed+.1);
    const result=oldUpdate.call(this,f,safeDt);
    if(owns(f)&&!paused&&!f.paused&&!active.pending&&!active.finished)tick(safeDt);
    return result;
  };
  function drawTrial(f){
    if(!owns(f)||typeof canvas==='undefined')return;
    const c=canvas.getContext('2d'),run=active,y=ground();c.save();
    function floorZone(x,r,color,label){c.fillStyle=color;c.fillRect(x-r,y-5,r*2,7);c.globalAlpha=.12;c.fillRect(x-r,y-70,r*2,65);c.globalAlpha=1;c.font='700 12px system-ui';c.textAlign='center';c.fillStyle=color;c.fillText(label,x,y+20)}
    if(enabled('centerheal')||run.config.requirements.centerSeconds)floorZone(width()/2,145,'#68f5bd','CÍRCULO CENTRAL');
    if(enabled('movingzone'))floorZone(zoneX(),105,'#67d9ff','FÔLEGO');
    if(enabled('edgeshazard')){const hot=run.elapsed%6>=3;floorZone(75,75,hot?'#ff604f':'#f9c96a',hot?'BRASA':'AVISO');floorZone(width()-75,75,hot?'#ff604f':'#f9c96a',hot?'BRASA':'AVISO')}
    for(const d of run.pickups){const color=d.id==='medkit'?'#6dffb0':d.id==='energycell'?'#86dfff':'#c9a4ff',label=d.id==='medkit'?'+VIDA':d.id==='energycell'?'+SUPER':'RECARGA';c.fillStyle='#071b29';c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(d.x,y-33+Math.sin(run.elapsed*3)*4,18,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=color;c.font='900 20px system-ui';c.textAlign='center';c.fillText(d.id==='medkit'?'+':d.id==='energycell'?'S':'R',d.x,y-25+Math.sin(run.elapsed*3)*4);c.font='700 11px system-ui';c.fillText(label,d.x,y-62)}
    c.fillStyle='#071322de';c.fillRect(width()/2-310,165,620,57);c.textAlign='center';c.fillStyle='#71f0ca';c.font='800 17px system-ui';c.fillText(run.config.name.toUpperCase(),width()/2,187);c.fillStyle='#e5f1ff';c.font='12px system-ui';c.fillText(run.config.modifierIds.map(id=>modifierMap.get(id).name).join(' · ')||'REGRAS CLÁSSICAS',width()/2,208);c.restore();
  }
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){const r=oldDraw.apply(this,arguments);drawTrial(f);return r};
  // Starting another game or returning via an existing menu never carries rules over.
  const oldStart=window.startFight;
  if(typeof oldStart==='function')window.startFight=function(){if(active)cleanupFight();return oldStart.apply(this,arguments)};
  for(const name of ['renderMenu','renderModes']){const old=window[name];if(typeof old==='function')window[name]=function(){if(active)cleanupFight();return old.apply(this,arguments)}}
  window.NiakV32Trials=Object.freeze({version:'32.0.0',trials:Object.freeze(trials),modifiers:Object.freeze(modifiers),families:Object.freeze(families),ownedCharacters,validateModifiers,configure,start,startCustom,snapshot,current:snapshot,cancel,returnToMenu:()=>cancel({returnMenu:true})});
})();
