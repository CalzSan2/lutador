/* NIAK V32 — Jornada: catálogo, contratos, medalhas e progressão local. */
(()=>{
  'use strict';
  if(window.NiakV32)return;
  const VERSION='32.0.0',PAGE_SIZE=18;
  const $=(s,r=document)=>r.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Math.max(0,Number(v)||0),fmt=v=>Math.floor(num(v)).toLocaleString('pt-BR');
  const core=()=>typeof state!=='undefined'?state:null,game=()=>typeof fight!=='undefined'?fight:null;
  const catalog=()=>window.NiakV32Catalog,trialAPI=()=>window.NiakV32Trials;
  const defs=()=>catalog()?.metricDefinitions||{};
  const empty=()=>({version:VERSION,xp:0,metrics:{},stages:[],characters:[],active:{},claimed:{},medals:{},trials:{},title:'',history:[],lastResult:null});
  function data(){
    const s=core();if(!s)return empty();
    if(!s.niakV32||typeof s.niakV32!=='object')s.niakV32=empty();
    const d=s.niakV32,base=empty();for(const k of Object.keys(base))if(d[k]===undefined)d[k]=base[k];
    for(const k of ['active','claimed','medals','trials','metrics'])if(!d[k]||typeof d[k]!=='object'||Array.isArray(d[k]))d[k]={};
    for(const k of ['history','stages','characters'])if(!Array.isArray(d[k]))d[k]=[];
    d.xp=num(d.xp);return d;
  }
  function save(){try{if(typeof saveState==='function')return saveState(core())!==false;if(typeof persist==='function'){persist();return true}}catch(_){}return false}
  function notify(message){let el=$('#n32-toast');if(!el){el=document.createElement('div');el.id='n32-toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=message;el.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),3400)}
  function entries(){return [...(catalog()?.contracts||[]),...(trialAPI()?.trials||[]),...(catalog()?.medals||[]),...(catalog()?.titles||[]),...(trialAPI()?.modifiers||[]),...(window.NiakV32Combat?.features||[]).map(x=>({...x,category:'mechanic'}))]}
  function metricValue(key){return key==='stages'?data().stages.length:key==='characters'?data().characters.length:num(data().metrics[key])}
  function progress(item){const d=data();if(item.category==='contract')return Math.min(item.target,num(d.active[item.id]?.progress));if(item.category==='medal')return Math.min(item.target,metricValue(item.metric));if(item.category==='title')return Math.min(item.requirement.target,metricValue(item.requirement.metric));return 0}
  function unlockedTitle(t){return progress(t)>=t.requirement.target}
  function ownCharacters(){return trialAPI()?.ownedCharacters?.()||[]}
  function activate(id){
    const c=catalog()?.contracts.find(x=>x.id===id),d=data();if(!c||d.claimed[id]||d.active[id])return false;
    if(Object.keys(d.active).length>=3){notify('Você pode acompanhar até 3 contratos. Conclua ou retire um deles.');return false}
    d.active[id]={progress:0,keys:[],at:Date.now()};save();notify('Contrato acompanhado. O progresso começa na próxima partida concluída.');render();return true;
  }
  function claim(id){
    const d=data(),item=catalog()?.contracts.find(x=>x.id===id)||catalog()?.medals.find(x=>x.id===id);if(!item)return false;
    const bag=item.category==='contract'?d.claimed:d.medals;if(bag[id]||progress(item)<item.target)return false;
    // Moeda e marca de resgate são gravadas na mesma transação do save principal.
    bag[id]=Date.now();if(item.category==='contract')delete d.active[id];
    const gold=num(item.reward?.gold),xp=num(item.reward?.xp);core().coins=num(core().coins)+gold;d.xp+=xp;
    if(!save())notify('Recompensa recebida nesta sessão. Armazenamento indisponível: exporte seu perfil antes de sair.');else notify(`Resgatado: ${gold?fmt(gold)+' Gold · ':''}${fmt(xp)} XP de Jornada`);
    render();return true;
  }
  function eligible(f){return !!(f?.p1&&f.p2&&!f.p2.human&&!f.v32Trial&&!f.training&&!/lan|online|training|island|ruins|boss/i.test(f.mode||'')&&['cpu','ravam','story','tournament'].includes(f.mode))}
  function initStats(f){
    if(!eligible(f)||f.n32Stats)return;f.n32Stats={damage:0,hits:0,punches:0,kicks:0,powers:0,supers:0,blocks:0,dodges:0,jumps:0,airHits:0,combo:0,seconds:0,rounds:0,damageTaken:0,minHp:1,hadComebackWindow:false,lastGround:!!f.p1.onGround,lastDodge:false};
  }
  function addMatch(winner,f){
    if(!eligible(f)||f.n32Recorded||!f.n32Stats)return;
    f.n32Recorded=true;const st=f.n32Stats,d=data(),won=winner===f.p1;
    const sample={...st,matches:1,wins:won?1:0,losses:won?0:1,flawless:won&&st.damageTaken===0?1:0,comebacks:won&&st.hadComebackWindow?1:0};
    for(const key of Object.keys(defs()))if(!['stages','characters'].includes(key))d.metrics[key]=key==='combo'?Math.max(num(d.metrics[key]),num(sample[key])):num(d.metrics[key])+num(sample[key]);
    const stageId=f.stage?.id||'arena',characterId=f.p1.id;
    if(!d.stages.includes(stageId))d.stages.push(stageId);if(!d.characters.includes(characterId))d.characters.push(characterId);
    for(const [id,p] of Object.entries(d.active)){
      const c=catalog().contracts.find(x=>x.id===id);if(!c)continue;
      if(c.metric==='stages'||c.metric==='characters'){if(!Array.isArray(p.keys))p.keys=[];const key=c.metric==='stages'?stageId:characterId;if(!p.keys.includes(key))p.keys.push(key);p.progress=p.keys.length}
      else if(c.metric==='combo')p.progress=Math.max(num(p.progress),num(sample.combo));
      else p.progress=num(p.progress)+num(sample[c.metric]);
    }
    const record={at:Date.now(),won,player:f.p1.name,opponent:f.p2.name,stage:f.stage?.name||stageId,damage:Math.round(st.damage),combo:st.combo,seconds:Math.round(st.seconds),mode:f.ravamStudios?'R.A.V.A.M':f.mode};
    d.history.unshift(record);d.history=d.history.slice(0,30);d.lastResult=record;save();
    const completed=Object.keys(d.active).filter(id=>{const c=catalog().contracts.find(x=>x.id===id);return c&&progress(c)>=c.target});
    if(completed.length)notify(`${completed.length} contrato(s) concluído(s)! Resgate na Jornada.`);
  }
  const baseStart=window.startFight;
  if(typeof baseStart==='function')window.startFight=function(){const r=baseStart.apply(this,arguments);initStats(game());return r};
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){
    initStats(f);const active=eligible(f)&&!f.over&&!f.paused;
    if(active){const st=f.n32Stats,p=f.p1,enemy=f.p2;st.seconds+=Math.min(.05,Math.max(0,Number(dt)||0));const hpRatio=p.hp/Math.max(1,p.maxHp),enemyRatio=enemy.hp/Math.max(1,enemy.maxHp);st.minHp=Math.min(st.minHp,hpRatio);if(hpRatio<=.25&&hpRatio<enemyRatio)st.hadComebackWindow=true;if(st.lastGround&&!p.onGround&&p.vy>0)st.jumps++;st.lastGround=!!p.onGround;const dodge=(p.megaDodgeT||0)>0||p.state==='dodge';if(dodge&&!st.lastDodge)st.dodges++;st.lastDodge=dodge;st.combo=Math.max(st.combo,num(p.combo))}
    return baseUpdate.apply(this,arguments);
  };
  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){
    const f=game();initStats(f);const st=eligible(f)&&!f.over?f.n32Stats:null,attacker=src?.owner||((src?.id&&src!==victim)?src:null);
    const hp=num(victim?.hp),guard=num(victim?.guardHits),wasDefending=!!victim?.defend,kind=String(src?.proKind||src?.move?.kind||type||'');
    // endRound may finish the match within damage. Defer career commit until this damage returns.
    if(st)f.n32DamageDepth=(f.n32DamageDepth||0)+1;
    let r;try{r=baseDamage.apply(this,arguments)}finally{
      if(st){const dealt=Math.max(0,hp-num(victim?.hp));if(attacker===f.p1&&victim===f.p2&&dealt>0){st.damage+=dealt;st.hits++;if(/punch/.test(kind))st.punches++;if(/kick/.test(kind))st.kicks++;if(!f.p1.onGround)st.airHits++;st.combo=Math.max(st.combo,num(f.p1.combo))}
        if(victim===f.p1){st.damageTaken+=dealt;const ratio=victim.hp/Math.max(1,victim.maxHp),enemyRatio=f.p2.hp/Math.max(1,f.p2.maxHp);st.minHp=Math.min(st.minHp,ratio);if(ratio<=.25&&ratio<enemyRatio)st.hadComebackWindow=true;if(attacker===f.p2&&wasDefending&&num(victim.guardHits)>guard)st.blocks++}
        f.n32DamageDepth--;if(!f.n32DamageDepth&&!f.n32PowerDepth&&f.n32PendingWinner){const winner=f.n32PendingWinner;f.n32PendingWinner=null;addMatch(winner,f)}
      }
    }return r;
  };
  const basePower=window.throwProjectile;
  if(typeof basePower==='function')window.throwProjectile=function(p){
    const f=game(),tracked=eligible(f)&&f.n32Stats&&p===f.p1,fingerprint=target=>Object.keys(target||{}).sort().filter(k=>{const v=target[k];return v==null||['number','string','boolean'].includes(typeof v)}).map(k=>`${k}:${String(target[k])}`).join('|'),arrays=target=>Object.values(target||{}).filter(Array.isArray).reduce((n,a)=>n+a.length,0),before=fingerprint(p)+'#'+arrays(f);
    if(tracked)f.n32PowerDepth=(f.n32PowerDepth||0)+1;
    let r;try{r=basePower.apply(this,arguments)}finally{
      const changed=before!==fingerprint(p)+'#'+arrays(f);if(changed&&tracked)f.n32Stats.powers++;
      if(tracked){f.n32PowerDepth--;if(!f.n32PowerDepth&&!f.n32DamageDepth&&f.n32PendingWinner){const winner=f.n32PendingWinner;f.n32PendingWinner=null;addMatch(winner,f)}}
    }return r;
  };
  const baseConsume=window.consumeSuper;
  if(typeof baseConsume==='function')window.consumeSuper=function(p){const r=baseConsume.apply(this,arguments),f=game();if(r&&eligible(f)&&f.n32Stats&&p===f.p1)f.n32Stats.supers++;return r};
  const baseEnd=window.endRound;
  if(typeof baseEnd==='function')window.endRound=function(f,winner){if(eligible(f)&&f.n32Stats&&!f.over)f.n32Stats.rounds++;return baseEnd.apply(this,arguments)};
  const baseRecord=window.recordFeatureMatch;
  if(typeof baseRecord==='function')window.recordFeatureMatch=function(winner,f){const r=baseRecord.apply(this,arguments);if(f?.n32DamageDepth)f.n32PendingWinner=winner;else addMatch(winner,f);return r};

  const labels={home:'Visão geral',contract:'Contratos',trial:'Provas',medal:'Medalhas',title:'Títulos',modifier:'Arena livre',mechanic:'Combate & treino',history:'Histórico'};
  const icons={home:'◈',contract:'▤',trial:'⚔',medal:'◎',title:'♛',modifier:'◇',mechanic:'⌘',history:'◷'};
  const ui={tab:'home',query:'',filter:'all',page:0,selectedMods:[],fighter:'',notice:''};
  let resultTimer;
  function open(tab='home'){
    const f=game();if(f&&!f.over&&typeof screen!=='undefined'&&screen==='fight'){notify('Termine ou saia da luta para abrir a Jornada.');return}
    document.querySelectorAll('#n32-result,#match-result-overlay').forEach(el=>el.remove());
    if(f?.v32Trial)trialAPI()?.cancel?.({returnMenu:false});
    ui.tab=labels[tab]?tab:'home';ui.page=0;ui.query='';ui.filter='all';window.scrollTo?.(0,0);render();
  }
  function fighterSelect(){const list=ownCharacters();if(!list.some(c=>c.id===ui.fighter))ui.fighter=list[0]?.id||'rojo';return `<label class="n32-fighter">SEU LUTADOR<select id="n32-fighter" aria-label="Lutador para as provas">${list.map(c=>`<option value="${esc(c.id)}" ${c.id===ui.fighter?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>`}
  function nav(){const all=entries();return Object.entries(labels).map(([key,name])=>`<button data-tab="${key}" class="${ui.tab===key?'active':''}" ${ui.tab===key?'aria-current="page"':''}><span>${icons[key]}</span>${name}${['home','history'].includes(key)?'':`<small>${all.filter(e=>e.category===key).length}</small>`}</button>`).join('')}
  function hero(){const d=data(),level=1+Math.floor(d.xp/400),title=catalog()?.titles.find(t=>t.id===d.title);return `<header class="n32-hero"><div><span class="n32-eyebrow">A JORNADA CONTINUA</span><h1>DOMINE<br>A PRÓXIMA <em>ERA.</em></h1><p>Novas provas, escolhas de arena e conquistas para cada estilo de luta.</p><div class="n32-hero-actions"><button class="n32-primary" data-tab="trial">ENTRAR NAS PROVAS <span>↗</span></button><button data-tab="contract">ESCOLHER CONTRATOS</button></div></div><aside class="n32-profile"><small>SUA JORNADA</small><strong>NÍVEL ${level}</strong><progress max="400" value="${d.xp%400}" aria-label="Progresso do nível de Jornada"></progress><span>${fmt(d.xp%400)} / 400 XP</span><b style="color:${esc(title?.color||'#7eead3')}">${esc(title?.name||'UMA NOVA LENDA COMEÇA')}</b></aside></header>`}
  function home(){const d=data(),all=entries();return `${hero()}<div class="n32-stats"><article><strong>${all.length}</strong><span>ENTRADAS NA EXPANSÃO</span></article><article><strong>${Object.keys(d.trials).length}<i>/120</i></strong><span>PROVAS CONCLUÍDAS</span></article><article><strong>${Object.keys(d.medals).length}<i>/120</i></strong><span>MEDALHAS RESGATADAS</span></article><article><strong>${fmt(d.metrics.wins)}</strong><span>VITÓRIAS NA JORNADA</span></article></div><div class="n32-section-heading"><div><span class="n32-eyebrow">SEU PRÓXIMO OBJETIVO</span><h2>CONTRATOS EM ANDAMENTO</h2></div><button data-tab="contract">VER TODOS →</button></div><div class="n32-grid">${Object.keys(d.active).map(id=>catalog()?.contracts.find(c=>c.id===id)).filter(Boolean).map(card).join('')||`<article class="n32-empty"><h3>Escolha sua primeira missão</h3><p>Acompanhe até três contratos. As ações contam após concluir partidas contra a CPU, incluindo R.A.V.A.M.</p><button class="n32-primary" data-tab="contract">ENCONTRAR UM CONTRATO</button></article>`}</div><div class="n32-two"><article class="n32-feature"><span>01 / COMBATE</span><h2>O seu poder.<br>Novas decisões.</h2><p>Regras opcionais mudam o ritmo das provas. Combine até três na Arena Livre e escolha um lutador que você já possui.</p><button data-tab="modifier">MONTAR UMA ARENA →</button></article><article class="n32-feature teal"><span>02 / EVOLUÇÃO</span><h2>Uma carreira<br>que acompanha você.</h2><p>Medalhas acompanham 20 estatísticas. Títulos são cosméticos, e contratos recompensam objetivos concluídos uma única vez.</p><button data-tab="medal">MINHAS CONQUISTAS →</button></article></div><p class="n32-note">O catálogo reúne 20 melhorias de combate, 40 regras e 440 conteúdos em famílias e patamares. Provas e Arena Livre são modos solo locais; as partidas online continuam usando as regras originais.</p>`}
  function status(item){const d=data();if(item.category==='contract')return d.claimed[item.id]?'claimed':d.active[item.id]?(progress(item)>=item.target?'ready':'active'):'available';if(item.category==='medal')return d.medals[item.id]?'claimed':progress(item)>=item.target?'ready':'locked';if(item.category==='title')return d.title===item.id?'equipped':unlockedTitle(item)?'ready':'locked';if(item.category==='trial')return d.trials[item.id]?'claimed':'available';return 'available'}
  function card(item){
    const state=status(item),badge={claimed:'CONCLUÍDO',ready:'DISPONÍVEL',active:'ACOMPANHANDO',locked:'EM PROGRESSO',available:'DISPONÍVEL',equipped:'EQUIPADO'}[state];
    let action='',meter='',extra='';
    if(item.category==='contract'||item.category==='medal'){
      const value=progress(item);if(item.category==='medal'||data().active[item.id])meter=`<div class="n32-progress"><progress max="${item.target}" value="${value}" aria-label="Progresso de ${esc(item.name)}"></progress><span>${fmt(value)} / ${fmt(item.target)}</span></div>`;
      if(item.reward)extra=`<small class="n32-reward">${item.reward.gold?fmt(item.reward.gold)+' GOLD · ':''}${fmt(item.reward.xp)} XP JORNADA</small>`;
      if(state==='ready')action=`<button class="n32-primary" data-claim="${item.id}">RESGATAR</button>`;
      else if(state==='claimed')action='<button disabled>✓ RESGATADO</button>';
      else if(item.category==='contract')action=state==='active'?`<button data-drop="${item.id}">RETIRAR CONTRATO</button>`:`<button data-activate="${item.id}">ACOMPANHAR</button>`;
    }else if(item.category==='title'){
      meter=`<div class="n32-title-preview" style="--title-color:${esc(item.color)}">${esc(item.name)}</div><small>${fmt(progress(item))} / ${fmt(item.requirement.target)}</small>`;
      action=state==='equipped'?'<button disabled>✓ EQUIPADO</button>':`<button data-equip="${item.id}" ${state==='locked'?'disabled':''}>${state==='locked'?'CONQUISTE PARA EQUIPAR':'EQUIPAR TÍTULO'}</button>`;
    }else if(item.category==='trial'){
      const record=data().trials[item.id];extra=record?`<small class="n32-reward">MELHOR PONTUAÇÃO · ${fmt(record.score)}</small>`:'<small class="n32-reward">BÔNUS ÚNICO NA PRIMEIRA CONCLUSÃO</small>';
      action=`<button class="n32-primary" data-trial="${item.id}">${record?'REPETIR PROVA':'INICIAR PROVA'} ↗</button>`;
    }else if(item.category==='modifier')action=`<button data-mod="${item.id}" aria-pressed="${ui.selectedMods.includes(item.id)}" class="${ui.selectedMods.includes(item.id)?'n32-primary':''}">${ui.selectedMods.includes(item.id)?'✓ SELECIONADA':'+ SELECIONAR REGRA'}</button>`;
    return `<article class="n32-card ${state}" data-entry="${esc(item.id)}"><div class="n32-card-top"><span>${icons[item.category]||'◇'} ${esc(item.id).toUpperCase()}</span><small>${badge}</small></div><h3>${esc(item.name)}</h3><p>${esc(item.description||item.desc||'')}</p>${meter}${extra}<footer>${action}</footer></article>`;
  }
  function listing(){
    const desc={contract:'Ative até 3 contratos. O progresso é contado nas partidas contra a CPU concluídas depois da ativação. Retirar apaga somente o progresso daquele contrato.',trial:'120 provas solo com objetivos, regras e dificuldade em patamares. Use um campeão normal já desbloqueado. As Lendas R.A.V.A.M continuam exclusivas do seu modo.',medal:'Conquistas permanentes da Jornada. Suas estatísticas contam ao concluir partidas contra a CPU, e cada recompensa pode ser resgatada uma vez.',title:'80 títulos cosméticos com requisitos próprios. O título equipado aparece na Jornada e na sua identificação de combate.',modifier:'Combine até três regras para criar uma luta solo. A Arena Livre não concede progresso ou recompensas da Jornada.',mechanic:'20 melhorias implementadas no combate local e ferramentas para entender golpes, alcance e recuperação.'};
    const all=entries().filter(e=>e.category===ui.tab);const filtered=all.filter(e=>(!ui.query||`${e.id} ${e.name} ${e.description||''}`.toLocaleLowerCase('pt-BR').includes(ui.query.toLocaleLowerCase('pt-BR')))&&(ui.filter==='all'||(ui.filter==='ready'?status(e)==='ready':['claimed','equipped'].includes(status(e)))));
    const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));ui.page=Math.min(ui.page,pages-1);
    const arena=ui.tab==='modifier'?`<div class="n32-arena-config"><b>${ui.selectedMods.length} / 3 REGRAS</b><span>${ui.selectedMods.map(id=>trialAPI()?.modifiers.find(m=>m.id===id)?.name).filter(Boolean).map(esc).join(' · ')||'Escolha regras abaixo.'}</span><button class="n32-primary" data-custom>COMEÇAR ARENA LIVRE ↗</button><button data-clear-mods>LIMPAR</button></div>`:'';
    const lab=ui.tab==='mechanic'?`<div class="n32-arena-config"><b>LABORATÓRIO DE COMBATE</b><span>Escolha seu campeão e experimente alcance, defesa e recuperação. Sem recompensas de carreira.</span><button class="n32-primary" data-training>ABRIR TREINO</button></div>`:'';
    return `<header class="n32-page-heading"><span class="n32-eyebrow">JORNADA / ${all.length} ENTRADAS</span><h1>${labels[ui.tab].toUpperCase()}</h1><p>${desc[ui.tab]}</p></header>${arena}${lab}<div class="n32-toolbar"><label>BUSCAR<input id="n32-search" type="search" placeholder="Nome, objetivo ou código..." value="${esc(ui.query)}"></label><label>EXIBIR<select id="n32-filter"><option value="all" ${ui.filter==='all'?'selected':''}>Todos</option><option value="ready" ${ui.filter==='ready'?'selected':''}>Prontos para resgatar / equipar</option><option value="done" ${ui.filter==='done'?'selected':''}>Concluídos</option></select></label>${['trial','modifier','mechanic'].includes(ui.tab)?fighterSelect():''}</div><p class="n32-count">${filtered.length} resultado(s) · Página ${ui.page+1} de ${pages}</p><div class="n32-grid">${filtered.slice(ui.page*PAGE_SIZE,(ui.page+1)*PAGE_SIZE).map(card).join('')||'<article class="n32-empty"><h3>Nenhum resultado</h3><p>Tente outro termo ou escolha “Todos”.</p></article>'}</div><nav class="n32-pagination" aria-label="Páginas do catálogo"><button data-prev ${ui.page===0?'disabled':''}>← ANTERIOR</button><span>${ui.page+1} / ${pages}</span><button data-next ${ui.page>=pages-1?'disabled':''}>PRÓXIMA →</button></nav>`;
  }
  function history(){return `<header class="n32-page-heading"><span class="n32-eyebrow">ÚLTIMAS 30 PARTIDAS CONCLUÍDAS</span><h1>SUA TRAJETÓRIA</h1><p>Os resultados são registrados ao terminar a partida inteira. Treino, Arena Livre, provas e partidas online não alimentam estas estatísticas.</p></header><div class="n32-stats">${[['matches','PARTIDAS'],['damage','DANO CAUSADO'],['combo','MELHOR COMBO'],['supers','SUPERS USADOS']].map(([id,label])=>`<article><strong>${fmt(metricValue(id))}</strong><span>${label}</span></article>`).join('')}</div><div class="n32-history">${data().history.map(r=>`<article><b class="${r.won?'n32-win':'n32-loss'}">${r.won?'VITÓRIA':'DERROTA'}</b><div><strong>${esc(r.player)} × ${esc(r.opponent)}</strong><small>${esc(r.stage)} · ${esc(r.mode)}</small></div><span>${fmt(r.damage)} dano · ${fmt(r.combo)} hits<br>${fmt(r.seconds)}s · ${new Date(r.at).toLocaleDateString('pt-BR')}</span></article>`).join('')||'<article class="n32-empty"><h3>A primeira página é sua</h3><p>Conclua uma partida contra a CPU para começar seu histórico.</p></article>'}</div>`}
  function render(){
    const root=typeof app!=='undefined'?app:$('#app');if(!root)return;
    if(typeof screen!=='undefined')screen='v32-journey';window.drawCanvas?.();document.body.classList.add('n32-open');
    root.innerHTML=`<section class="n32-shell"><aside class="n32-sidebar"><a class="n32-brand" href="#" data-home>NIAK<span>JORNADA</span></a><nav aria-label="Navegação da Jornada">${nav()}</nav><div class="n32-sidebar-bottom"><span>CARTEIRA SALVA LOCALMENTE</span><button data-exit>← VOLTAR AO JOGO</button></div></aside><main class="n32-main"><div class="n32-topline"><span>R.A.V.A.M STUDIOS <i>×</i> SORTEP NIAK</span><b>◈ ${fmt(core()?.coins)} GOLD</b></div>${ui.tab==='home'?home():ui.tab==='history'?history():listing()}<footer class="n32-footer">SEUS PERSONAGENS. SEUS PODERES. UMA NOVA JORNADA.<span>JORNADA · ${entries().length} ENTRADAS</span></footer></main></section>`;
    bind(root);
  }
  function launch(id){const r=trialAPI()?.start?.(id,ui.fighter);if(r?.ok){document.body.classList.remove('n32-open');$('#n32-result')?.remove()}else notify(r?.error||'Não foi possível iniciar a prova.')}
  function bind(root){
    root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ui.tab=b.dataset.tab;ui.page=0;ui.query='';ui.filter='all';render()});
    root.querySelector('[data-home]').onclick=e=>{e.preventDefault();open()};
    root.querySelector('[data-exit]').onclick=()=>{document.body.classList.remove('n32-open');window.renderMenu?.()};
    root.querySelectorAll('[data-activate]').forEach(b=>b.onclick=()=>activate(b.dataset.activate));
    root.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>{delete data().active[b.dataset.drop];save();render()});
    root.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>claim(b.dataset.claim));
    root.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{const title=catalog()?.titles.find(t=>t.id===b.dataset.equip);if(title&&unlockedTitle(title)){data().title=title.id;save();render()}});
    root.querySelectorAll('[data-trial]').forEach(b=>b.onclick=()=>launch(b.dataset.trial));
    root.querySelectorAll('[data-mod]').forEach(b=>b.onclick=()=>{const id=b.dataset.mod;if(ui.selectedMods.includes(id))ui.selectedMods=ui.selectedMods.filter(x=>x!==id);else{const next=[...ui.selectedMods,id],validation=trialAPI()?.validateModifiers?.(next);if(validation&&!validation.ok){notify(validation.error);return}ui.selectedMods=next}render()});
    const fighter=root.querySelector('#n32-fighter');if(fighter)fighter.onchange=e=>ui.fighter=e.target.value;
    const filter=root.querySelector('#n32-filter');if(filter)filter.onchange=e=>{ui.filter=e.target.value;ui.page=0;render()};
    const search=root.querySelector('#n32-search');if(search)search.oninput=e=>{const cursor=e.target.selectionStart;ui.query=e.target.value;ui.page=0;render();const next=$('#n32-search');next.focus();try{next.setSelectionRange(cursor,cursor)}catch(_){}};
    const prev=root.querySelector('[data-prev]');if(prev)prev.onclick=()=>{ui.page--;render();$('.n32-main')?.scrollTo?.(0,0)};
    const next=root.querySelector('[data-next]');if(next)next.onclick=()=>{ui.page++;render();$('.n32-main')?.scrollTo?.(0,0)};
    const clear=root.querySelector('[data-clear-mods]');if(clear)clear.onclick=()=>{ui.selectedMods=[];render()};
    const custom=root.querySelector('[data-custom]');if(custom)custom.onclick=()=>{const r=trialAPI()?.startCustom?.(ui.fighter,ui.selectedMods.slice());if(r?.ok)document.body.classList.remove('n32-open');else notify(r?.error||'Não foi possível iniciar a arena.')};
    const train=root.querySelector('[data-training]');if(train)train.onclick=()=>{if(!ownCharacters().some(c=>c.id===ui.fighter))return;document.body.classList.remove('n32-open');window.ProCombat?.startTraining?.(ui.fighter)};
  }
  window.addEventListener('niak:v32-trial-result',event=>{
    const result=event.detail||{},d=data();let first=false;
    if(result.won&&result.trialId&&!result.custom){const previous=d.trials[result.trialId];first=!previous;d.trials[result.trialId]={at:Date.now(),score:Math.max(num(previous?.score),num(result.score)),elapsed:previous?Math.min(num(previous.elapsed)||Infinity,num(result.elapsed)):num(result.elapsed)};if(first){core().coins=num(core().coins)+60+num(result.tier)*15;d.xp+=40+num(result.tier)*10}save()}
    clearTimeout(resultTimer);resultTimer=setTimeout(()=>showTrialResult(result,first),80);
  });
  function showTrialResult(result,first){
    $('#n32-result')?.remove();const el=document.createElement('div');el.id='n32-result';el.className='n32-result';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Resultado da prova');
    const trial=trialAPI()?.trials.find(x=>x.id===result.trialId);
    el.innerHTML=`<section><span class="n32-eyebrow">${result.custom?'ARENA LIVRE':'PROVA DA JORNADA'}</span><h1>${result.won?'DESAFIO<br><em>SUPERADO.</em>':'CADA LUTA<br><em>ENSINA.</em>'}</h1><h2>${esc(trial?.name||'Confronto personalizado')}</h2><p>${esc(result.objective||'A luta terminou.')}</p><div class="n32-result-stats"><b>${fmt(result.score)}<small>PONTOS</small></b><b>${fmt(result.elapsed)}s<small>TEMPO</small></b><b>${fmt(result.bestCombo)}<small>COMBO</small></b></div><p>${first?`Primeira conclusão: +${60+num(result.tier)*15} Gold · +${40+num(result.tier)*10} XP Jornada`:result.custom?'A Arena Livre não concede recompensas de Jornada.':result.won?'Prova já concluída. Tente superar sua pontuação!':'Ajuste sua estratégia e tente novamente.'}</p><div><button class="n32-primary" data-retry>TENTAR NOVAMENTE</button><button data-journey>VOLTAR À JORNADA</button></div></section>`;
    document.body.appendChild(el);$('[data-retry]',el).onclick=()=>{el.remove();if(result.custom){const r=trialAPI()?.startCustom?.(result.playerId,result.modifierIds||[]);if(!r?.ok){notify(r?.error||'Arena indisponível');open('modifier')}}else{ui.fighter=result.playerId;launch(result.trialId)}};$('[data-journey]',el).onclick=()=>{el.remove();open(result.custom?'modifier':'trial')};$('[data-retry]',el).focus();
  }
  function decorate(){
    const isHub=typeof screen!=='undefined'&&screen==='v32-journey';if(!isHub)document.body.classList.remove('n32-open');

    // A Jornada tem uma única entrada: o Lobby. Nunca injeta cartão na tela de Modos/Jogar.
    const oldEntry=document.getElementById('n32-entry');
    const oldWrap=document.querySelector('.n32-lobby-entry-wrap');
    const lobby=typeof screen!=='undefined'&&screen==='menu'?document.querySelector('.menu'):null;
    if(!lobby){
      oldWrap?.remove();
      if(oldEntry&&!oldEntry.closest('.n32-lobby-entry-wrap'))oldEntry.remove();
    }else{
      let wrap=oldWrap;
      if(!wrap){wrap=document.createElement('div');wrap.className='n32-lobby-entry-wrap'}
      let b=document.getElementById('n32-entry');
      if(!b){
        b=document.createElement('button');b.id='n32-entry';b.type='button';b.className='n32-entry';
        b.innerHTML='<span class="n32-entry-icon">◈</span><span class="n32-entry-copy"><b>JORNADA</b><small>Provas · contratos · conquistas</small></span><span class="n32-entry-arrow">↗</span>';
        b.onclick=()=>open();
      }
      if(b.parentElement!==wrap)wrap.appendChild(b);
      const center=lobby.querySelector('.v84-center,.v8-command-center');
      const grid=center?.querySelector('.v84-menu-grid,.v8-menu-grid');
      if(center){
        if(wrap.parentElement!==center)center.insertBefore(wrap,grid||center.firstChild);
        else if(grid&&wrap.nextElementSibling!==grid)center.insertBefore(wrap,grid);
      }else{
        const actions=lobby.querySelector('.lobby-actions,.pro-legacy-actions');
        if(actions&&wrap.parentElement!==actions.parentElement)actions.parentElement.insertBefore(wrap,actions);
      }
    }

    const title=catalog()?.titles.find(t=>t.id===data().title);let tag=$('#n32-title-tag');if(title&&typeof screen!=='undefined'&&screen==='fight'&&!game()?.mode?.includes('lan')){if(!tag){tag=document.createElement('div');tag.id='n32-title-tag';document.body.appendChild(tag)}tag.textContent=title.name;tag.style.color=title.color}else tag?.remove();
  }
  const baseMenu=window.renderMenu;if(typeof baseMenu==='function')window.renderMenu=function(){document.body.classList.remove('n32-open');const r=baseMenu.apply(this,arguments);queueMicrotask(decorate);return r};
  const root=document.getElementById('app');let queued=false;if(root)new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate()})}).observe(root,{childList:true,subtree:true});
  window.NiakV32=Object.freeze({version:VERSION,open,entries,snapshot:()=>JSON.parse(JSON.stringify(data())),activate,claim,progress});
  decorate();
})();
