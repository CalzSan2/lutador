/* SORTEP NIAK — Expansion Pack base + Quality 6.0
 * Tutorial, loja cosmética, perfil, maestria, animações, áudio de impacto,
 * balanceamento, conquistas, torneio em chave, campanha dupla, novas arenas,
 * gamepad, teclas configuráveis, backup seguro e lobby premium.
 */
(()=>{
  'use strict';
  if(window.LutadorExpansion?.version) return;

  const VERSION='6.0.0';
  const KEY='lutador-expansion-v4';
  const BACKUP_KEY='lutador-expansion-v4-backup';
  const SAFETY_KEY='lutador-unified-backup-v1';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const game=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const gameState=()=>{try{return typeof state!=='undefined'?state:null}catch(_){return null}};
  const appNode=()=>document.getElementById('app');
  const chars=()=>{try{return typeof CHARACTERS!=='undefined'?CHARACTERS:[]}catch(_){return []}};
  const charBy=id=>chars().find(c=>c.id===id);
  const play=(kind,opts)=>{try{return window.ProAudio?.play?.(kind,opts)||window.SFX?.play?.(kind)}catch(_){return false}};
  const tone=(f,d=.08,t='sine',v=.03,delay=0)=>{try{return window.ProAudio?.tone?.(f,d,t,v,delay)}catch(_){return false}};
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');

  const DEFAULT_KEYS={
    p1:{left:'KeyA',right:'KeyD',jump:'KeyW',crouch:'KeyS',power:'KeyJ',punch:'KeyI',kick:'KeyO',hook:'KeyG',guard:'KeyK',ultimate:'KeyL',dodge:'KeyQ',taunt:'KeyT'},
    p2:{left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',crouch:'ArrowDown',power:'Numpad1',punch:'Numpad5',kick:'Numpad6',hook:'Numpad4',guard:'Numpad2',ultimate:'Numpad3',dodge:'Numpad0',taunt:'Numpad7'}
  };
  const CANON={...DEFAULT_KEYS};
  const DEFAULT_PAD={
    p1:{jump:0,kick:1,punch:2,power:3,guard:4,dodge:5,hook:6,ultimate:7,taunt:10},
    p2:{jump:0,kick:1,punch:2,power:3,guard:4,dodge:5,hook:6,ultimate:7,taunt:10}
  };
  const defaults=()=>({
    tutorialDone:false,
    stats:{matches:0,wins:0,losses:0,maxCombo:0,totalDamage:0,groundKOs:0,ultimates:0,tournamentWins:0,storyWins:0,byFighter:{}},
    mastery:{}, achievements:{}, campaign:{rojo:0,thuvaa:0},
    owned:{skins:['original'],titles:[],frames:['Padrão'],entrances:['Padrão'],victories:['Padrão'],finishers:['Padrão'],trails:['Padrão']},
    equipped:{skin:'original',frame:'Padrão',entrance:'Padrão',victory:'Padrão',finisher:'Padrão',trail:'Padrão'},
    keybinds:JSON.parse(JSON.stringify(DEFAULT_KEYS)),
    gamepad:{enabled:true,deadzone:.32,p1:{...DEFAULT_PAD.p1},p2:{...DEFAULT_PAD.p2}},
    lastBackupAt:0, newsSeen:0
  });

  function deepMerge(base,raw){
    const out={...base,...(raw||{})};
    out.stats={...base.stats,...(raw?.stats||{}),byFighter:{...base.stats.byFighter,...(raw?.stats?.byFighter||{})}};
    out.mastery={...(raw?.mastery||{})}; out.achievements={...(raw?.achievements||{})}; out.campaign={...base.campaign,...(raw?.campaign||{})};
    out.owned={...base.owned,...(raw?.owned||{})};
    for(const k of Object.keys(base.owned)) out.owned[k]=Array.from(new Set(Array.isArray(out.owned[k])?out.owned[k]:base.owned[k]));
    out.equipped={...base.equipped,...(raw?.equipped||{})};
    out.keybinds={p1:{...base.keybinds.p1,...(raw?.keybinds?.p1||{})},p2:{...base.keybinds.p2,...(raw?.keybinds?.p2||{})}};
    out.gamepad={...base.gamepad,...(raw?.gamepad||{}),p1:{...base.gamepad.p1,...(raw?.gamepad?.p1||{})},p2:{...base.gamepad.p2,...(raw?.gamepad?.p2||{})}};
    return out;
  }
  let data;
  try{data=deepMerge(defaults(),JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){
    try{data=deepMerge(defaults(),JSON.parse(localStorage.getItem(BACKUP_KEY)||'null'));}catch(__){data=defaults()}
  }
  function save(){
    try{const payload=JSON.stringify(data);localStorage.setItem(KEY,payload);localStorage.setItem(BACKUP_KEY,payload);return true}catch(_){return false}
  }

  function toast(text,toneName='normal',duration=1900){
    let host=document.querySelector('.exp-toast-host'); if(!host){host=document.createElement('div');host.className='exp-toast-host';document.body.appendChild(host)}
    const el=document.createElement('div');el.className='exp-toast '+toneName;el.textContent=text;host.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),240)},duration);
  }
  function dialog(id,title,html){
    let d=document.getElementById(id);if(!d){d=document.createElement('dialog');d.id=id;d.className='exp-dialog';document.body.appendChild(d)}
    d.innerHTML=`<div class="exp-dialog-shell"><header><div><small>SORTEP NIAK · ${VERSION}</small><h2>${title}</h2></div><button class="exp-close" aria-label="Fechar">×</button></header><div class="exp-dialog-body">${html}</div></div>`;
    d.querySelector('.exp-close').onclick=()=>d.close();d.onclick=e=>{if(e.target===d)d.close()};return d;
  }

  /* ---------- 7. BALANCEAMENTO GLOBAL ---------- */
  function applyBalance(){
    const roster=chars(); if(!roster.length)return;
    const specialBoss=new Set(['ztaaa']);
    for(const c of roster){
      if(specialBoss.has(c.id))continue;
      let hp=Number(c.hp)||1900, dmg=Number(c.dmg)||30, speed=Number(c.speed)||75;
      if(hp<1200) hp=1880;
      c.hp=Math.round(clamp(hp,1760,2110));
      c.dmg=Math.round(clamp(dmg,27,40));
      c.speed=Math.round(clamp(speed,64,92));
    }
    const overrides={
      rojo:{hp:1890,dmg:31,speed:86}, thuvaa:{hp:2020,dmg:29,speed:72}, flame:{hp:1885,dmg:33,speed:76}, trefoh:{hp:1900,dmg:31,speed:77},
      nine85:{hp:1860,dmg:39,speed:80}, hock:{hp:2080,dmg:39,speed:68}, klo:{hp:1780,dmg:27,speed:92}, vlad:{hp:1980,dmg:36,speed:79}
    };
    for(const [id,v] of Object.entries(overrides)){const c=charBy(id);if(c)Object.assign(c,v)}
  }
  applyBalance();

  /* ---------- 11. ARENAS ---------- */
  function addArenas(){
    try{
      if(typeof STAGES==='undefined')return;
      const list=[
        {id:'ruas',name:'Ruas da Meia-Noite',icon:'🏙️',desc:'Asfalto molhado, letreiros e torcida colada na luta.',top:'#050812',bottom:'#17182d',floor:'#23263b',accent:'#ff3b81'},
        {id:'primordial',name:'Arena Primordial',icon:'✹',desc:'O palco final: runas antigas, energia dourada e arquibancadas monumentais.',top:'#0b0713',bottom:'#3a1531',floor:'#38243d',accent:'#ffd56a'}
      ];
      list.forEach(s=>{if(!STAGES.some(x=>x.id===s.id))STAGES.push(s)});
      if(typeof HAZARD_BY_STAGE!=='undefined'){
        HAZARD_BY_STAGE.ruas={name:'ALTA TENSÃO',icon:'⚡',color:'#ff3b81'};
        HAZARD_BY_STAGE.primordial={name:'PULSO PRIMORDIAL',icon:'✹',color:'#ffd56a'};
      }
    }catch(_){ }
  }
  addArenas();

  /* ---------- 2. LOJA COSMÉTICA ---------- */
  const SHOP=[
    {id:'skin-carmim',cat:'skins',name:'Skin · Aura Carmesim',currency:'coins',cost:1500,icon:'🔥',value:'Aura Carmesim'},
    {id:'skin-gelo',cat:'skins',name:'Skin · Gelo Espectral',currency:'coins',cost:1800,icon:'❄️',value:'Gelo Espectral'},
    {id:'skin-primordial',cat:'skins',name:'Skin · Neon Primordial',currency:'vandais',cost:40,icon:'✹',value:'Neon Primordial'},
    {id:'skin-ouro',cat:'skins',name:'Skin · Ouro do Campeão',currency:'vandais',cost:60,icon:'♛',value:'Ouro do Campeão'},
    {id:'title-combo',cat:'titles',name:'Título · Mestre do Ataque',currency:'coins',cost:900,icon:'🏷️',value:'Mestre do Ataque'},
    {id:'title-duelista',cat:'titles',name:'Título · Duelista Primordial',currency:'vandais',cost:25,icon:'🏷️',value:'Duelista Primordial'},
    {id:'frame-neon',cat:'frames',name:'Moldura · Pulso Neon',currency:'coins',cost:800,icon:'▣',value:'Pulso Neon'},
    {id:'frame-prime',cat:'frames',name:'Moldura · Primordial',currency:'vandais',cost:30,icon:'▣',value:'Primordial'},
    {id:'entry-red',cat:'entrances',name:'Entrada · Chuva Rubra',currency:'coins',cost:1400,icon:'✦',value:'Chuva Rubra'},
    {id:'entry-ice',cat:'entrances',name:'Entrada · Portal Glacial',currency:'coins',cost:1500,icon:'✦',value:'Portal Glacial'},
    {id:'entry-prime',cat:'entrances',name:'Entrada · Ruptura Primordial',currency:'vandais',cost:45,icon:'✦',value:'Ruptura Primordial'},
    {id:'victory-fist',cat:'victories',name:'Pose · Punho Erguido',currency:'coins',cost:900,icon:'🏆',value:'Punho Erguido'},
    {id:'victory-ice',cat:'victories',name:'Pose · Trono Glacial',currency:'coins',cost:1600,icon:'🏆',value:'Trono Glacial'},
    {id:'victory-prime',cat:'victories',name:'Pose · Coroa Primordial',currency:'vandais',cost:50,icon:'🏆',value:'Coroa Primordial'},
    {id:'finish-red',cat:'finishers',name:'Finalização · Golpe Final Rubro',currency:'coins',cost:1800,icon:'☠',value:'Golpe Final Rubro'},
    {id:'finish-ice',cat:'finishers',name:'Finalização · Prisão de Gelo',currency:'coins',cost:1800,icon:'☠',value:'Prisão de Gelo'},
    {id:'finish-prime',cat:'finishers',name:'Finalização · Eclipse Primordial',currency:'vandais',cost:65,icon:'☠',value:'Eclipse Primordial'},
    /* V8.3 — 20 cosméticos novos e equipáveis */
    {id:'skin-eclipse',cat:'skins',name:'Skin · Eclipse Rubro',currency:'coins',cost:2100,icon:'🌑',value:'Eclipse Rubro'},
    {id:'skin-aurora',cat:'skins',name:'Skin · Aurora Glacial',currency:'coins',cost:2200,icon:'🌌',value:'Aurora Glacial'},
    {id:'skin-shadow',cat:'skins',name:'Skin · Sombra Violeta',currency:'vandais',cost:38,icon:'🟣',value:'Sombra Violeta'},
    {id:'skin-toxic',cat:'skins',name:'Skin · Toxic Neon',currency:'coins',cost:2400,icon:'☣',value:'Toxic Neon'},
    {id:'skin-plasma',cat:'skins',name:'Skin · Plasma Azul',currency:'coins',cost:2350,icon:'🔷',value:'Plasma Azul'},
    {id:'skin-obsidian',cat:'skins',name:'Skin · Obsidiana',currency:'vandais',cost:42,icon:'⬛',value:'Obsidiana'},
    {id:'skin-solar',cat:'skins',name:'Skin · Solar Dourado',currency:'vandais',cost:55,icon:'☀',value:'Solar Dourado'},
    {id:'skin-ghost',cat:'skins',name:'Skin · Fantasma Branco',currency:'coins',cost:2600,icon:'👻',value:'Fantasma Branco'},
    {id:'skin-matrix',cat:'skins',name:'Skin · Matrix Esmeralda',currency:'vandais',cost:48,icon:'💚',value:'Matrix Esmeralda'},
    {id:'skin-magenta',cat:'skins',name:'Skin · Inferno Magenta',currency:'vandais',cost:58,icon:'💗',value:'Inferno Magenta'},
    {id:'entry-thunder',cat:'entrances',name:'Entrada · Tempestade Elétrica',currency:'coins',cost:1800,icon:'⚡',value:'Tempestade Elétrica'},
    {id:'entry-shadow',cat:'entrances',name:'Entrada · Portal Sombrio',currency:'coins',cost:1850,icon:'◉',value:'Portal Sombrio'},
    {id:'entry-fire',cat:'entrances',name:'Entrada · Chamas do Coliseu',currency:'vandais',cost:34,icon:'🔥',value:'Chamas do Coliseu'},
    {id:'entry-star',cat:'entrances',name:'Entrada · Queda Estelar',currency:'vandais',cost:40,icon:'🌠',value:'Queda Estelar'},
    {id:'victory-king',cat:'victories',name:'Pose · Rei da Arena',currency:'coins',cost:1500,icon:'👑',value:'Rei da Arena'},
    {id:'victory-silent',cat:'victories',name:'Pose · Silêncio do Campeão',currency:'coins',cost:1450,icon:'🏆',value:'Silêncio do Campeão'},
    {id:'victory-supreme',cat:'victories',name:'Pose · Desafio Supremo',currency:'vandais',cost:36,icon:'✦',value:'Desafio Supremo'},
    {id:'finish-cosmic',cat:'finishers',name:'Finalização · Impacto Cósmico',currency:'coins',cost:2600,icon:'☄',value:'Impacto Cósmico'},
    {id:'finish-neon',cat:'finishers',name:'Finalização · Ruptura Neon',currency:'vandais',cost:52,icon:'⚡',value:'Ruptura Neon'},
    {id:'finish-judgement',cat:'finishers',name:'Finalização · Julgamento Primordial',currency:'vandais',cost:72,icon:'♛',value:'Julgamento Primordial'},
    /* V33 — mais 20 skins reais: todas alteram cor e aura durante a luta */
    {id:'skin-v33-01',cat:'skins',name:'Skin · Safira Elétrica',currency:'coins',cost:1800,icon:'💎',value:'Safira Elétrica'},
    {id:'skin-v33-02',cat:'skins',name:'Skin · Rubi Vulcânico',currency:'coins',cost:1850,icon:'🔴',value:'Rubi Vulcânico'},
    {id:'skin-v33-03',cat:'skins',name:'Skin · Jade Tóxico',currency:'coins',cost:1900,icon:'🟢',value:'Jade Tóxico'},
    {id:'skin-v33-04',cat:'skins',name:'Skin · Ametista Real',currency:'coins',cost:1950,icon:'🟣',value:'Ametista Real'},
    {id:'skin-v33-05',cat:'skins',name:'Skin · Bronze de Guerra',currency:'coins',cost:2000,icon:'🛡️',value:'Bronze de Guerra'},
    {id:'skin-v33-06',cat:'skins',name:'Skin · Ciano Holográfico',currency:'coins',cost:2050,icon:'🪩',value:'Ciano Holográfico'},
    {id:'skin-v33-07',cat:'skins',name:'Skin · Rosa Quântico',currency:'coins',cost:2100,icon:'🌸',value:'Rosa Quântico'},
    {id:'skin-v33-08',cat:'skins',name:'Skin · Tempestade Cinza',currency:'coins',cost:2150,icon:'🌩️',value:'Tempestade Cinza'},
    {id:'skin-v33-09',cat:'skins',name:'Skin · Sol Branco',currency:'coins',cost:2200,icon:'☀️',value:'Sol Branco'},
    {id:'skin-v33-10',cat:'skins',name:'Skin · Abismo Azul',currency:'coins',cost:2250,icon:'🌊',value:'Abismo Azul'},
    {id:'skin-v33-11',cat:'skins',name:'Skin · Hera Venenosa',currency:'vandais',cost:36,icon:'🌿',value:'Hera Venenosa'},
    {id:'skin-v33-12',cat:'skins',name:'Skin · Foice Lunar',currency:'vandais',cost:38,icon:'🌙',value:'Foice Lunar'},
    {id:'skin-v33-13',cat:'skins',name:'Skin · Chama Azul',currency:'vandais',cost:40,icon:'🔥',value:'Chama Azul'},
    {id:'skin-v33-14',cat:'skins',name:'Skin · Sangue Neon',currency:'vandais',cost:42,icon:'🩸',value:'Sangue Neon'},
    {id:'skin-v33-15',cat:'skins',name:'Skin · Gelo Negro',currency:'vandais',cost:44,icon:'❄️',value:'Gelo Negro'},
    {id:'skin-v33-16',cat:'skins',name:'Skin · Radioativo',currency:'vandais',cost:46,icon:'☢️',value:'Radioativo'},
    {id:'skin-v33-17',cat:'skins',name:'Skin · Cobre Solar',currency:'vandais',cost:48,icon:'🌞',value:'Cobre Solar'},
    {id:'skin-v33-18',cat:'skins',name:'Skin · Prisma Vivo',currency:'vandais',cost:52,icon:'🌈',value:'Prisma Vivo'},
    {id:'skin-v33-19',cat:'skins',name:'Skin · Espectro Carmesim',currency:'vandais',cost:56,icon:'👻',value:'Espectro Carmesim'},
    {id:'skin-v33-20',cat:'skins',name:'Skin · Campeão Celestial',currency:'vandais',cost:65,icon:'🌌',value:'Campeão Celestial'}
  ];
  function equippedKey(cat){return cat==='skins'?'skin':cat==='frames'?'frame':cat==='entrances'?'entrance':cat==='victories'?'victory':cat==='finishers'?'finisher':cat==='trails'?'trail':'title'}
  function own(cat,value){return data.owned[cat]?.includes(value)}
  function buyItem(item){
    const gs=gameState();if(!gs||!item)return false;if(own(item.cat,item.value))return true;
    const cur=item.currency==='vandais'?'vandais':'coins';const have=Math.max(0,Number(gs[cur])||0);
    if(have<item.cost){toast(`${cur==='vandais'?'VANDAIS':'GOLD'} INSUFICIENTE`,'danger');return false}
    gs[cur]=have-item.cost;data.owned[item.cat].push(item.value);data.equipped[equippedKey(item.cat)]=item.value;
    if(item.cat==='titles'){try{window.ProProgression?.grantTitle?.(item.value);window.ProProgression?.equipTitle?.(item.value)}catch(_){}}
    try{typeof persist==='function'&&persist()}catch(_){ } save();safeBackup(true);play('confirm');toast(`ADQUIRIDO · ${item.value}`,'reward');return true;
  }
  function equip(cat,value){
    if(!own(cat,value))return;const key=equippedKey(cat);data.equipped[key]=value;
    if(cat==='titles')try{window.ProProgression?.equipTitle?.(value)}catch(_){ }save();toast(`EQUIPADO · ${value}`,'premium');
  }
  function openCosmeticShop(){
    const gs=gameState()||{coins:0,vandais:0};const cats=[['skins','SKINS'],['titles','TÍTULOS'],['frames','MOLDURAS'],['entrances','ENTRADAS'],['victories','POSES'],['finishers','FINALIZAÇÕES']];
    cats.push(['trails','RASTROS']);
    const d=dialog('exp-shop','LOJA & COLEÇÃO DE COSMÉTICOS',`<div class="exp-wallet"><b>🪙 ${fmt(gs.coins)} GOLD</b><b>🟪 ${fmt(gs.vandais)} VANDAIS</b></div><div class="exp-shop-tabs">${cats.map(([k,n],i)=>`<button data-exp-tab="${k}" class="${i===0?'active':''}">${n}</button>`).join('')}</div><div id="exp-shop-grid" class="exp-shop-grid"></div>`);
    const render=cat=>{
      d.querySelectorAll('[data-exp-tab]').forEach(b=>b.classList.toggle('active',b.dataset.expTab===cat));const grid=d.querySelector('#exp-shop-grid');
      const items=cat==='trails'?data.owned.trails.filter(v=>v!=='Padrão').map((value,i)=>({id:'owned-trail-'+i,cat:'trails',name:'Rastro · '+value,currency:'coins',cost:0,icon:'〰',value,ownedOnly:true})):SHOP.filter(x=>x.cat===cat);
      grid.innerHTML=items.length?items.map(item=>{const owned=item.ownedOnly||own(cat,item.value),key=equippedKey(cat),equipped=data.equipped[key]===item.value;return `<article class="exp-shop-card ${owned?'owned':''} ${equipped?'equipped':''}"><i>${item.icon}</i><small>${cat.toUpperCase()}</small><h3>${esc(item.name)}</h3><span>${owned?(equipped?'✓ EQUIPADO':'✓ ADQUIRIDO'):`${item.currency==='vandais'?'🟪':'🪙'} ${fmt(item.cost)}`}</span><button class="btn" data-buy="${item.id}">${owned?(equipped?'ATIVO':'EQUIPAR'):'COMPRAR'}</button></article>`}).join(''):'<div class="exp-empty">Desbloqueie rastros nas trilhas de Maestria de Rojo, Thuvaa e outros campeões.</div>';
      grid.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{let item=SHOP.find(x=>x.id===b.dataset.buy);if(!item&&b.dataset.buy.startsWith('owned-trail-')){const idx=Number(b.dataset.buy.split('-').pop());const value=data.owned.trails.filter(v=>v!=='Padrão')[idx];item={cat:'trails',value,ownedOnly:true}}if(!item)return;if(item.ownedOnly||own(item.cat,item.value))equip(item.cat,item.value);else buyItem(item);render(cat)});
    };
    d.querySelectorAll('[data-exp-tab]').forEach(b=>b.onclick=()=>render(b.dataset.expTab));render('skins');if(!d.open)d.showModal();
  }

  /* ---------- 4. MAESTRIA ---------- */
  function masteryOf(id){
    const m=data.mastery[id]||(data.mastery[id]={xp:0,matches:0,wins:0,maxCombo:0,damage:0,ultimates:0,claimed:[]});
    m.claimed=Array.isArray(m.claimed)?m.claimed:[];return m;
  }
  const masteryLevel=xp=>clamp(1+Math.floor((Number(xp)||0)/260),1,20);
  const masteryThreshold=lvl=>(lvl-1)*260;
  function masteryRewards(id){
    const c=charBy(id),name=c?.name||id;
    const unique=id==='rojo'?{trail:'Rastro Rubro',title:'Herança Rubra'}:id==='thuvaa'?{trail:'Rastro Glacial',title:'Coração Glacial'}:{trail:`Rastro de ${name}`,title:`Mestre de ${name}`};
    return [
      {lvl:3,label:'300 GOLD',coins:300},{lvl:5,label:`Moldura ${name}`,frame:`Moldura ${name}`},{lvl:8,label:'8 VANDAIS',vandais:8},
      {lvl:10,label:unique.title,title:unique.title},{lvl:15,label:unique.trail,trail:unique.trail},{lvl:20,label:`Lenda de ${name} + 25 VANDAIS`,title:`Lenda de ${name}`,vandais:25}
    ];
  }
  function awardMastery(id){
    const m=masteryOf(id),lvl=masteryLevel(m.xp),gs=gameState();
    for(const r of masteryRewards(id)){
      const key=`${r.lvl}`;if(lvl<r.lvl||m.claimed.includes(key))continue;m.claimed.push(key);
      if(gs){if(r.coins)gs.coins=(Number(gs.coins)||0)+r.coins;if(r.vandais)gs.vandais=(Number(gs.vandais)||0)+r.vandais}
      if(r.frame&&!data.owned.frames.includes(r.frame))data.owned.frames.push(r.frame);
      if(r.trail&&!data.owned.trails.includes(r.trail))data.owned.trails.push(r.trail);
      if(r.title){if(!data.owned.titles.includes(r.title))data.owned.titles.push(r.title);try{window.ProProgression?.grantTitle?.(r.title)}catch(_){}}
      toast(`MAESTRIA ${r.lvl} · ${r.label}`,'reward',2600);play('confirm');
    }
    try{typeof persist==='function'&&persist()}catch(_){ }save();
  }
  function masteryChallenges(id,m){
    if(id==='rojo')return [[m.wins,10,'10 vitórias com Rojo'],[m.damage,5000,'5.000 de dano acumulado'],[m.ultimates,8,'8 Supers usados']];
    if(id==='thuvaa')return [[m.wins,10,'10 vitórias com Thuvaa'],[m.ultimates,12,'12 Supers glaciais'],[m.damage,7000,'7.000 de dano acumulado']];
    return [[m.wins,5,'5 vitórias'],[m.ultimates,5,'5 Supers'],[m.damage,6000,'6.000 de dano acumulado']];
  }
  function openMastery(selected='rojo'){
    if(!charBy(selected))selected=chars()[0]?.id||'rojo';const d=dialog('exp-mastery','MAESTRIA DE CAMPEÕES','<div id="exp-mastery-root"></div>');
    const render=id=>{const m=masteryOf(id),c=charBy(id),lvl=masteryLevel(m.xp),next=lvl>=20?m.xp:masteryThreshold(lvl+1),base=masteryThreshold(lvl),pct=lvl>=20?100:clamp((m.xp-base)/(next-base)*100,0,100);const challenges=masteryChallenges(id,m);
      d.querySelector('#exp-mastery-root').innerHTML=`<div class="exp-mastery-layout"><aside>${chars().map(x=>`<button data-mid="${x.id}" class="${x.id===id?'active':''}"><img src="ai-assets/characters/${x.id}.png" alt=""><span>${esc(x.name)}</span><b>Nv. ${masteryLevel(masteryOf(x.id).xp)}</b></button>`).join('')}</aside><main><div class="exp-mastery-hero"><img src="ai-assets/characters/${id}.png" alt="${esc(c?.name)}"><div><small>TRILHA DE MAESTRIA</small><h2>${esc(c?.name||id)}</h2><strong>NÍVEL ${lvl} / 20</strong><div class="exp-progress"><i style="width:${pct}%"></i></div><span>${fmt(m.xp)} XP DE MAESTRIA</span></div></div><section><h3>DESAFIOS EXCLUSIVOS</h3><div class="exp-challenges">${challenges.map(([v,t,label])=>`<div class="${v>=t?'done':''}"><b>${esc(label)}</b><span>${fmt(Math.min(v,t))}/${fmt(t)}</span></div>`).join('')}</div></section><section><h3>RECOMPENSAS</h3><div class="exp-reward-track">${masteryRewards(id).map(r=>`<div class="${lvl>=r.lvl?'ready':''} ${m.claimed.includes(String(r.lvl))?'claimed':''}"><b>Nv. ${r.lvl}</b><span>${esc(r.label)}</span><i>${m.claimed.includes(String(r.lvl))?'✓':lvl>=r.lvl?'LIBERADO':'🔒'}</i></div>`).join('')}</div></section></main></div>`;
      d.querySelectorAll('[data-mid]').forEach(b=>b.onclick=()=>render(b.dataset.mid));
    };render(selected);if(!d.open)d.showModal();
  }

  /* ---------- 8. CONQUISTAS ---------- */
  const ACH=[
    {id:'firstwin',name:'Primeiro Sangue',desc:'Vença sua primeira partida.',test:()=>data.stats.wins>=1,reward:{coins:200}},
    {id:'wins10',name:'Veterano',desc:'Vença 10 partidas.',test:()=>data.stats.wins>=10,reward:{coins:700}},
    {id:'wins50',name:'Lenda da Arena',desc:'Vença 50 partidas.',test:()=>data.stats.wins>=50,reward:{vandais:25,title:'Lenda da Arena'}},
    {id:'combo10',name:'Sem Respirar',desc:'Cause 10.000 de dano acumulado.',test:()=>data.stats.totalDamage>=10000,reward:{coins:600}},
    {id:'noUlt',name:'Punhos Puros',desc:'Vença uma luta sem usar Ultimate.',event:true,reward:{coins:450}},
    {id:'combo15',name:'Ataque Supremo',desc:'Use 15 Supers.',test:()=>data.stats.ultimates>=15,reward:{vandais:50,title:'Mestre do Ataque'}},
    {id:'groundKO',name:'Sem Escapatória',desc:'Finalize um rival com chute no chão.',test:()=>data.stats.groundKOs>=1,reward:{coins:800}},
    {id:'story',name:'Duas Lendas',desc:'Conclua uma campanha de Rojo ou Thuvaa.',test:()=>data.campaign.rojo>=CAMPAIGNS.rojo.length||data.campaign.thuvaa>=CAMPAIGNS.thuvaa.length,reward:{vandais:20}},
    {id:'tourney',name:'Dono da Chave',desc:'Seja campeão de um torneio.',test:()=>data.stats.tournamentWins>=1,reward:{coins:1200,title:'Campeão da Chave'}},
    {id:'master10',name:'Especialista',desc:'Chegue ao nível 10 de maestria com qualquer campeão.',test:()=>Object.values(data.mastery).some(m=>masteryLevel(m.xp)>=10),reward:{vandais:15}}
  ];
  function grantAchievement(a){
    if(!a||data.achievements[a.id])return;data.achievements[a.id]={at:Date.now()};const gs=gameState(),r=a.reward||{};
    if(gs){if(r.coins)gs.coins=(Number(gs.coins)||0)+r.coins;if(r.vandais)gs.vandais=(Number(gs.vandais)||0)+r.vandais}
    if(r.title){if(!data.owned.titles.includes(r.title))data.owned.titles.push(r.title);try{window.ProProgression?.grantTitle?.(r.title)}catch(_){}}
    try{typeof persist==='function'&&persist()}catch(_){ }save();toast(`CONQUISTA · ${a.name}`,'achievement',2800);play('win');
  }
  function checkAchievements(event){for(const a of ACH){if(data.achievements[a.id])continue;if(a.event){if(event?.[a.id])grantAchievement(a)}else{try{if(a.test())grantAchievement(a)}catch(_){}}}}
  function openAchievements(){
    checkAchievements();const count=Object.keys(data.achievements).length;const d=dialog('exp-achievements',`CONQUISTAS · ${count}/${ACH.length}`,`<div class="exp-ach-grid">${ACH.map(a=>{const got=!!data.achievements[a.id],r=a.reward||{};return `<article class="${got?'done':''}"><i>${got?'🏆':'◇'}</i><div><small>${got?'CONCLUÍDA':'DESAFIO'}</small><h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p><span>${r.coins?`🪙 ${fmt(r.coins)} `:''}${r.vandais?`🟪 ${fmt(r.vandais)} `:''}${r.title?`🏷️ ${esc(r.title)}`:''}</span></div></article>`}).join('')}</div>`);if(!d.open)d.showModal();
  }

  /* ---------- 3. PERFIL ---------- */
  function profileSnapshot(){
    const pp=window.ProProgression?.getSnapshot?.();let fav='—',best=-1;
    for(const [id,s] of Object.entries(data.stats.byFighter)){if((s.matches||0)>best){best=s.matches||0;fav=charBy(id)?.name||id}}
    return {level:pp?.profile?.level||1,xp:pp?.data?.totalXp||0,title:pp?.profile?.displayTitle||'NOVO DESAFIANTE',fav};
  }
  function openProfile(){
    const p=profileSnapshot(),aCount=Object.keys(data.achievements).length,gs=gameState()||{};const wr=data.stats.matches?Math.round(data.stats.wins/data.stats.matches*100):0;
    const masteryLevels=Object.values(data.mastery).map(m=>masteryLevel(m.xp)),masteryTotal=masteryLevels.reduce((a,b)=>a+b,0),cosmetics=Object.values(data.owned).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0),rating=Math.max(0,1000+data.stats.wins*28-data.stats.losses*16);
    const d=dialog('exp-profile','PERFIL & EVOLUÇÃO',`<section class="exp-profile-hero ${data.equipped.frame.toLowerCase().includes('primordial')?'prime':''}"><div class="exp-profile-seal">${p.level}</div><div><small>${esc(p.title)}</small><h2>${esc(gs.playerName||'JOGADOR 1')}</h2><span>${wr}% DE VITÓRIAS · RATING ${fmt(rating)}</span></div></section><div class="exp-stat-grid"><div><span>PARTIDAS</span><b>${fmt(data.stats.matches)}</b></div><div><span>VITÓRIAS</span><b>${fmt(data.stats.wins)}</b></div><div><span>DERROTAS</span><b>${fmt(data.stats.losses)}</b></div><div><span>DANO TOTAL</span><b>${fmt(data.stats.totalDamage)}</b></div><div><span>CAMPEÃO FAVORITO</span><b>${esc(p.fav)}</b></div><div><span>MAESTRIA TOTAL</span><b>${fmt(masteryTotal)}</b></div><div><span>CONQUISTAS</span><b>${aCount}/${ACH.length}</b></div><div><span>COSMÉTICOS</span><b>${fmt(cosmetics)}</b></div><div><span>TORNEIOS</span><b>${fmt(data.stats.tournamentWins)}</b></div><div><span>GOLD</span><b>${fmt(gs.coins)}</b></div><div><span>PSY</span><b>${fmt(gs.psy)}</b></div><div><span>VANDAIS</span><b>${fmt(gs.vandais)}</b></div></div><section class="exp-profile-systems"><h3>SISTEMAS DE MELHORIA</h3><p>Suba a maestria de cada campeão, conclua conquistas, personalize a identidade e proteja o progresso com backup local.</p></section><div class="exp-profile-actions"><button class="btn" id="exp-prof-mastery">★ MAESTRIA & RECOMPENSAS</button><button class="btn" id="exp-prof-ach">🏆 CONQUISTAS</button><button class="btn" id="exp-prof-shop">🎨 40+ COSMÉTICOS</button><button class="btn" id="exp-prof-backup">💾 BACKUP AGORA</button></div><footer class="exp-save-status">Último backup: ${data.lastBackupAt?new Date(data.lastBackupAt).toLocaleString('pt-BR'):'ainda não criado'} · XP total: ${fmt(p.xp)} · Nível ${p.level}</footer>`);
    d.querySelector('#exp-prof-mastery').onclick=()=>{d.close();openMastery()};d.querySelector('#exp-prof-ach').onclick=()=>{d.close();openAchievements()};d.querySelector('#exp-prof-shop').onclick=()=>{d.close();openCosmeticShop()};d.querySelector('#exp-prof-backup').onclick=()=>{safeBackup(false);d.close();setTimeout(openProfile,0)};if(!d.open)d.showModal();
  }

  /* ---------- 1. TUTORIAL INTERATIVO ---------- */
  let tutorial=null;
  const tutorialSteps=[
    {id:'punch',title:'SOCO',text:'Acerte Thuvaa com seu soco. Você pode continuar andando durante o golpe.',action:'punch'},
    {id:'kick',title:'CHUTE',text:'Use o chute para causar impacto e preparar finalizações.',action:'kick'},
    {id:'hook',title:'GANCHO',text:'Use o Gancho Demolidor. Ele causa dano e derruba o inimigo.',action:'uppercut'},
    {id:'ground',title:'CHUTE NO CHÃO',text:'Com o rival derrubado, só o chute causa dano. Finalize a sequência.',action:'groundKick'},
    {id:'dodge',title:'ESQUIVA',text:'Use a esquiva. Uma esquiva perfeita abre uma janela de contra-ataque.',action:'dodge'},
    {id:'stamina',title:'STAMINA',text:'Segure a defesa por um instante. Defender, correr, esquivar e golpes fortes gastam stamina.',action:'stamina'},
    {id:'ultimate',title:'ULTIMATE',text:'Sua barra foi carregada. Use a Ultimate cinematográfica para concluir o treino.',action:'ultimate'}
  ];
  function tutorialKey(action){const k=data.keybinds.p1;return {punch:k.punch,kick:k.kick,uppercut:k.hook,groundKick:k.kick,dodge:k.dodge,stamina:k.guard,combo:`${k.punch} · ${k.punch} · ${k.kick}`,ultimate:k.ultimate}[action]||''}
  function tutorialOverlay(){
    let el=document.getElementById('exp-tutorial-hud');if(!el){el=document.createElement('div');el.id='exp-tutorial-hud';document.body.appendChild(el)}
    const step=tutorialSteps[tutorial?.index||0];if(!step)return;el.innerHTML=`<small>ACADEMIA · PASSO ${(tutorial.index+1)}/${tutorialSteps.length}</small><h2>${step.title}</h2><p>${step.text}</p><div><kbd>${esc(tutorialKey(step.action))}</kbd><span>${tutorial.done?'✓ CONCLUÍDO':'AGUARDANDO...'}</span></div><button id="exp-tutorial-exit">SAIR DO TREINO</button>`;el.querySelector('#exp-tutorial-exit').onclick=endTutorial;
  }
  function advanceTutorial(){
    if(!tutorial)return;tutorial.done=true;tutorialOverlay();play('confirm');setTimeout(()=>{
      if(!tutorial)return;tutorial.index++;tutorial.done=false;
      if(tutorial.index>=tutorialSteps.length){completeTutorial();return}
      const f=game();if(f){const s=tutorialSteps[tutorial.index];f.p1.proStamina=100;f.p2.hp=f.p2.maxHp=99999;f.p2.x=Math.min(W-260,f.p1.x+115);f.p2.vx=0;f.p2.freezeT=0;f.p2.attackDisabledT=0;
        if(s.action==='groundKick'){f.p2.proKnockdownT=4;f.p2.proKnockdownLanded=true;f.p2.onGround=true;f.p2.y=0;f.p2.state='hurt'}else if(s.action==='combo'){f.p2.proKnockdownT=0;f.p2.onGround=true;f.p2.state='idle';f.p1.megaSequence=[];f.p1.megaCombo=0}else if(s.action==='ultimate'){f.p2.proKnockdownT=0;f.p2.state='idle';f.p1.superMeter=1;f.p1.superReady=true;f.p1.specialCd=0;f.p1.proStamina=100}}
      tutorialOverlay();
    },520);
  }
  function tutorialHit(attacker,victim,kind,before,after){
    if(!tutorial||attacker!==game()?.p1||victim!==game()?.p2||after>=before)return;const step=tutorialSteps[tutorial.index];if(!step)return;
    if(step.action==='punch'&&kind==='punch')advanceTutorial();else if(step.action==='kick'&&kind==='kick'&&!(victim.proKnockdownT>0&&victim.onGround))advanceTutorial();else if(step.action==='uppercut'&&kind==='uppercut')advanceTutorial();else if(step.action==='groundKick'&&kind==='kick'&&(victim.proKnockdownT>0&&victim.onGround))advanceTutorial();
  }
  function startTutorial(){
    const base=charBy('rojo'),enemy=charBy('thuvaa')||chars().find(c=>c.id!=='rojo');if(!base||!enemy)return;try{document.querySelectorAll('dialog[open]').forEach(d=>d.close())}catch(_){ }
    tutorial={index:0,done:false,lastStamina:100,lastCombo:0,lastUlts:0};startFight(base.id,'tutorial',enemy.id,'dojo');document.querySelector('.mega-vs')?.remove();const f=game();if(f){f.timer=99999;f.megaAiDifficulty='easy';f.p2.maxHp=f.p2.hp=99999;f.p2.attackDisabledT=99999;f.p2.x=Math.min(W-250,f.p1.x+115);f.paused=false}
    tutorialOverlay();toast('ACADEMIA INICIADA','premium');
  }
  function endTutorial(){tutorial=null;document.getElementById('exp-tutorial-hud')?.remove();try{fight=null;bestOfThree={p1Wins:0,p2Wins:0,round:1,active:false};renderMenu()}catch(_){location.reload()}}
  function completeTutorial(){
    data.tutorialDone=true;const gs=gameState();if(gs)gs.coins=(Number(gs.coins)||0)+500;try{window.ProProgression?.grantTitle?.('Discípulo da Arena');typeof persist==='function'&&persist()}catch(_){ }save();play('win');toast('TUTORIAL CONCLUÍDO · +500 GOLD','achievement',3200);endTutorial();
  }

  /* ---------- 9. TORNEIO EM CHAVE 8/16 ---------- */
  let bracket=null;
  function resetFightState(){try{document.getElementById('match-result-overlay')?.remove();fight=null;bestOfThree={p1Wins:0,p2Wins:0,round:1,active:false};window.keys={};window.justPressed={}}catch(_){}}
  function roundNames(size){return size===16?['OITAVAS','QUARTAS','SEMIFINAL','FINAL']:['QUARTAS','SEMIFINAL','FINAL']}
  function renderTournamentPro(){
    try{screen='tournament-select';drawCanvas()}catch(_){ } const unlocked=chars().filter(c=>gameState()?.roster?.includes(c.id));
    appNode().innerHTML=`<div class="card mk-card mk-arena exp-tournament"><h2 class="select-title mk-title">🏆 TORNEIO <span class="mk-accent">EM CHAVE</span></h2><p class="select-subtitle">Escolha formato e campeão. Agora são quartas/oitavas, semifinal e final de verdade.</p><div class="exp-tour-size"><button data-size="8" class="active">8 LUTADORES</button><button data-size="16">16 LUTADORES</button></div><div class="exp-tour-bracket" id="exp-tour-preview"><span>QUARTAS</span><i>→</i><span>SEMIFINAL</span><i>→</i><span>FINAL</span></div><div class="tour-pick">${unlocked.map(c=>`<button class="tour-fighter" data-id="${c.id}"><img src="ai-assets/characters/${c.id}.png" alt=""><b>${esc(c.name)}</b></button>`).join('')}</div><button id="exp-tour-start" class="btn big" disabled>COMEÇAR CHAVE</button> <button id="exp-tour-back" class="btn">VOLTAR</button></div>`;
    let size=8,pick='';const refresh=()=>{appNode().querySelector('#exp-tour-preview').innerHTML=roundNames(size).map((n,i)=>`${i?'<i>→</i>':''}<span>${n}</span>`).join('')};
    appNode().querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{size=Number(b.dataset.size);appNode().querySelectorAll('[data-size]').forEach(x=>x.classList.toggle('active',x===b));refresh()});
    appNode().querySelectorAll('.tour-fighter').forEach(b=>b.onclick=()=>{pick=b.dataset.id;appNode().querySelectorAll('.tour-fighter').forEach(x=>x.classList.toggle('selected',x===b));appNode().querySelector('#exp-tour-start').disabled=false});
    appNode().querySelector('#exp-tour-start').onclick=()=>startBracket(pick,size);appNode().querySelector('#exp-tour-back').onclick=()=>renderModes();
  }
  function startBracket(hero,size){
    const rounds=roundNames(size),pool=chars().filter(c=>c.id!==hero).map(c=>c.id).sort(()=>Math.random()-.5);bracket={active:true,hero,size,round:0,rounds,path:pool.slice(0,rounds.length),started:Date.now()};showBracketIntermission();
  }
  function showBracketIntermission(){
    if(!bracket?.active)return;const opp=charBy(bracket.path[bracket.round]),name=bracket.rounds[bracket.round];
    const d=dialog('exp-bracket','CHAVE DO TORNEIO',`<div class="exp-bracket-round"><small>${name} · ${bracket.round+1}/${bracket.rounds.length}</small><div><article><img src="ai-assets/characters/${bracket.hero}.png" alt=""><b>${esc(charBy(bracket.hero)?.name)}</b><span>VOCÊ</span></article><strong>VS</strong><article><img src="ai-assets/characters/${opp?.id}.png" alt=""><b>${esc(opp?.name||'???')}</b><span>ADVERSÁRIO</span></article></div><button class="btn big" id="exp-bracket-fight">⚔ ENTRAR NA LUTA</button></div>`);
    d.querySelector('#exp-bracket-fight').onclick=()=>{d.close();const stage=typeof STAGES!=='undefined'?STAGES[Math.floor(Math.random()*STAGES.length)]?.id:null;startFight(bracket.hero,'bracket',opp.id,stage)};if(!d.open)d.showModal();
  }
  function finishBracket(won,f){
    recordMatchStats(f,won);resetFightState();if(!bracket?.active)return;
    if(!won){const d=dialog('exp-bracket-end','TORNEIO ENCERRADO',`<div class="exp-end-card loss"><i>✕</i><h2>ELIMINADO</h2><p>Você chegou até ${bracket.rounds[bracket.round]}.</p><button class="btn big" id="exp-tour-again">TENTAR NOVAMENTE</button><button class="btn" id="exp-tour-menu">MODOS</button></div>`);d.querySelector('#exp-tour-again').onclick=()=>{d.close();renderTournamentPro()};d.querySelector('#exp-tour-menu').onclick=()=>{d.close();renderModes()};bracket=null;if(!d.open)d.showModal();return}
    bracket.round++;
    if(bracket.round>=bracket.rounds.length){const gs=gameState(),reward=bracket.size===16?3000:1600;if(gs){gs.coins=(Number(gs.coins)||0)+reward;try{persist()}catch(_){}}data.stats.tournamentWins++;save();checkAchievements();play('win');const d=dialog('exp-bracket-end','CAMPEÃO DO TORNEIO',`<div class="exp-end-card win"><i>🏆</i><h2>CAMPEÃO!</h2><p>Você venceu a chave completa de ${bracket.size} lutadores.</p><strong>+${fmt(reward)} GOLD</strong><button class="btn big" id="exp-tour-menu">VOLTAR AOS MODOS</button></div>`);d.querySelector('#exp-tour-menu').onclick=()=>{d.close();bracket=null;renderModes()};if(!d.open)d.showModal();return}
    setTimeout(showBracketIntermission,300);
  }

  /* ---------- 10. CAMPANHA DUPLA ---------- */
  const CAMPAIGNS={
    rojo:[
      {title:'SANGUE NA CHUVA',enemy:'knunka',stage:'ruas',line:'Knunka encontra Rojo no distrito interditado. A Chave Rubra voltou a pulsar.',speaker:'Knunka',quote:'Se essa energia acordou de novo, alguém abriu a porta errada.',reward:250},
      {title:'FALHA NO TEMPO',enemy:'atizz',stage:'cidade',line:'Atizz corta o sinal da cidade e prende Rojo entre quadros do tempo.',speaker:'Atizz',quote:'Você corre rápido. Vamos ver se corre mais rápido que um segundo quebrado.',reward:300},
      {title:'PACTO RUBRO',enemy:'vlad',stage:'castelo',line:'Vlad reconhece a energia no sangue de Rojo e exige um duelo.',speaker:'Vlad',quote:'Seu poder tem fome. Mostre que você ainda manda nele.',reward:350},
      {title:'O ESPELHO',enemy:'klopp',stage:'templo',line:'Klopp assume rostos conhecidos e força Rojo a enfrentar suas próprias escolhas.',speaker:'Klopp',quote:'Eu sou o que sobra quando você escolhe só vencer.',reward:450},
      {title:'ARQUITETO',enemy:'ztaaa',stage:'coliseu',line:'Ztaaa revela que a Arena Primordial foi construída sobre o núcleo dos Refúgios.',speaker:'ZTAAA',quote:'Traga a chave. Eu cuido do resto do mundo.',reward:700,boss:true},
      {title:'COROA PRIMORDIAL',enemy:'frogh',stage:'primordial',line:'No núcleo, Frogh exige a última prova antes de Rojo selar a Chave Rubra.',speaker:'Frogh',quote:'Proteção sem controle vira destruição. Escolha agora.',reward:1200,boss:true}
    ],
    thuvaa:[
      {title:'GELO E CINZAS',enemy:'flame',stage:'vulcao',line:'Thuvaa persegue uma tempestade térmica até o Vulcão Infernal.',speaker:'Flame',quote:'Seu inverno termina aqui.',reward:250},
      {title:'RAÍZES CONGELADAS',enemy:'perry',stage:'floresta',line:'A floresta reage ao frio. Perry desafia Thuvaa a salvar as raízes sem destruir o vale.',speaker:'Perry',quote:'Controle não é congelar tudo. É saber o que deve continuar vivo.',reward:300},
      {title:'REFLEXO DE GELO',enemy:'grogh',stage:'geleira',line:'Grogh devolve cada disparo de gelo e obriga Thuvaa a lutar de perto.',speaker:'Grogh',quote:'Seu próprio poder pode ser seu pior adversário.',reward:350},
      {title:'ECLIPSE POLAR',enemy:'yoi',stage:'santuariolunar',line:'Yoi apaga a lua sobre a geleira e esconde o caminho para o núcleo.',speaker:'Yoi',quote:'Nem todo gelo brilha no escuro.',reward:450},
      {title:'QUEBRA-LUAS',enemy:'hock',stage:'tempestade',line:'Hock guarda o último portal e testa a resistência do Mago Glacial.',speaker:'Hock',quote:'Se aguenta o céu caindo, talvez aguente o que existe depois dele.',reward:700,boss:true},
      {title:'ZERO PRIMORDIAL',enemy:'ztaaa',stage:'primordial',line:'Thuvaa alcança o núcleo e tenta congelar a instabilidade antes que a Arena colapse.',speaker:'ZTAAA',quote:'Congele o mundo. Eu só preciso que a porta continue aberta.',reward:1200,boss:true}
    ]
  };
  function renderCampaignHub(){
    const d=dialog('exp-campaign','CAMPANHAS · ROJO & THUVAA',`<div class="exp-campaign-grid">${['rojo','thuvaa'].map(id=>{const prog=clamp(Number(data.campaign[id])||0,0,CAMPAIGNS[id].length),c=charBy(id);return `<article class="${id}"><img src="ai-assets/characters/${id}.png" alt=""><small>CAMPANHA ${id.toUpperCase()}</small><h2>${esc(c?.name||id)}</h2><p>${id==='rojo'?'Descubra o segredo da Chave Rubra e alcance a Arena Primordial.':'Impeça o colapso climático e domine o Zero Primordial.'}</p><div class="exp-progress"><i style="width:${prog/CAMPAIGNS[id].length*100}%"></i></div><span>${prog}/${CAMPAIGNS[id].length} CAPÍTULOS</span><button class="btn big" data-campaign="${id}">${prog>=CAMPAIGNS[id].length?'REJOGAR CAMPANHA':'CONTINUAR'}</button></article>`}).join('')}</div>`);
    d.querySelectorAll('[data-campaign]').forEach(b=>b.onclick=()=>{d.close();startCampaignChapter(b.dataset.campaign)});if(!d.open)d.showModal();
  }
  function startCampaignChapter(hero){
    const arr=CAMPAIGNS[hero];if(!arr)return;let idx=clamp(Number(data.campaign[hero])||0,0,arr.length);if(idx>=arr.length)idx=0;const ch=arr[idx],enemy=charBy(ch.enemy);const d=dialog('exp-story-scene',`${hero.toUpperCase()} · CAPÍTULO ${idx+1}/${arr.length}`,`<div class="exp-story-scene"><small>${esc(ch.title)}</small><p>${esc(ch.line)}</p><blockquote><b>${esc(ch.speaker)}:</b> “${esc(ch.quote)}”</blockquote><div class="exp-story-vs"><img src="ai-assets/characters/${hero}.png" alt=""><strong>VS</strong><img src="ai-assets/characters/${ch.enemy}.png" alt=""></div><button class="btn big" id="exp-story-fight">⚔ LUTAR</button></div>`);
    d.querySelector('#exp-story-fight').onclick=()=>{d.close();window.__expStory={hero,index:idx,chapter:ch};startFight(hero,'storyx',enemy.id,ch.stage)};if(!d.open)d.showModal();
  }
  function finishCampaignFight(won,f){
    const s=window.__expStory;if(!s)return;recordMatchStats(f,won);resetFightState();const hero=s.hero,ch=s.chapter;window.__expStory=null;
    if(!won){const d=dialog('exp-story-end','CAPÍTULO INTERROMPIDO',`<div class="exp-end-card loss"><i>✕</i><h2>DERROTA</h2><p>${esc(ch.title)} ainda espera por você.</p><button class="btn big" id="exp-story-retry">TENTAR DE NOVO</button><button class="btn" id="exp-story-hub">CAMPANHAS</button></div>`);d.querySelector('#exp-story-retry').onclick=()=>{d.close();startCampaignChapter(hero)};d.querySelector('#exp-story-hub').onclick=()=>{d.close();renderCampaignHub()};if(!d.open)d.showModal();return}
    const gs=gameState();if(gs){gs.coins=(Number(gs.coins)||0)+(ch.reward||0);data.stats.storyWins++;data.campaign[hero]=Math.max(Number(data.campaign[hero])||0,s.index+1);
      if(data.campaign[hero]===3){const val=hero==='rojo'?'Rastro Rubro':'Rastro Glacial';if(!data.owned.trails.includes(val))data.owned.trails.push(val)}
      if(data.campaign[hero]>=CAMPAIGNS[hero].length){const title=hero==='rojo'?'Guardião da Chave Rubra':'Zero Primordial';if(!data.owned.titles.includes(title))data.owned.titles.push(title);try{window.ProProgression?.grantTitle?.(title)}catch(_){ }if(hero==='thuvaa'&&!gs.roster?.includes('thuvaa'))gs.roster.push('thuvaa')}
      try{persist()}catch(_){}}
    save();checkAchievements();play('win');const done=data.campaign[hero]>=CAMPAIGNS[hero].length;const d=dialog('exp-story-end',done?'CAMPANHA CONCLUÍDA':'CAPÍTULO CONCLUÍDO',`<div class="exp-end-card win"><i>${done?'♛':'✓'}</i><h2>${done?'LENDA COMPLETA':esc(ch.title)}</h2><p>${done?'A trilha final foi desbloqueada e seu título exclusivo está na coleção.':'O próximo capítulo foi desbloqueado.'}</p><strong>+${fmt(ch.reward||0)} GOLD</strong><button class="btn big" id="exp-story-next">${done?'CAMPANHAS':'PRÓXIMO CAPÍTULO'}</button></div>`);d.querySelector('#exp-story-next').onclick=()=>{d.close();done?renderCampaignHub():startCampaignChapter(hero)};if(!d.open)d.showModal();
  }

  /* ---------- 12/13. GAMEPAD + TECLAS CONFIGURÁVEIS ---------- */
  const ACTION_LABEL={left:'Mover esquerda',right:'Mover direita',jump:'Pular',crouch:'Abaixar / carregar Super',power:'Poder',punch:'Soco',kick:'Chute',hook:'Gancho',guard:'Defesa',ultimate:'Ultimate',dodge:'Esquiva',taunt:'Provocação'};
  const physicalDown=new Set();let bindTarget=null,padBindTarget=null;
  function keyName(code){return String(code||'').replace(/^Key/,'').replace(/^Digit/,'').replace('Arrow','').replace('Numpad','NUM ')}
  function openControls(){
    const d=dialog('exp-controls','CONTROLES CONFIGURÁVEIS','<div id="exp-controls-root"></div>');
    const render=()=>{const root=d.querySelector('#exp-controls-root');root.innerHTML=`<div class="exp-control-head"><div><b>⌨ TECLADO</b><span>Clique em uma ação e pressione a nova tecla.</span></div><label><input id="exp-pad-enabled" type="checkbox" ${data.gamepad.enabled?'checked':''}> GAMEPAD ATIVO</label></div><div class="exp-control-columns">${['p1','p2'].map(slot=>`<section><h3>${slot.toUpperCase()}</h3>${Object.keys(ACTION_LABEL).map(a=>`<button data-bind="${slot}:${a}"><span>${ACTION_LABEL[a]}</span><kbd>${esc(keyName(data.keybinds[slot][a]))}</kbd></button>`).join('')}</section>`).join('')}</div><div class="exp-pad-config"><h3>🎮 GAMEPAD XBOX / PLAYSTATION</h3><p>Analógico/D-pad move. Clique em “CAPTURAR” e pressione um botão do controle para trocar o comando.</p>${['p1','p2'].map(slot=>`<section><b>${slot.toUpperCase()} · CONTROLE ${slot==='p1'?'1':'2'}</b>${['jump','punch','kick','power','guard','dodge','hook','ultimate','taunt'].map(a=>`<button data-padbind="${slot}:${a}">${ACTION_LABEL[a]} <kbd>BOTÃO ${data.gamepad[slot][a]}</kbd></button>`).join('')}</section>`).join('')}</div><footer><button class="btn" id="exp-reset-controls">RESTAURAR PADRÃO</button><button class="btn" id="exp-close-controls">CONCLUÍDO</button></footer>`;
      root.querySelectorAll('[data-bind]').forEach(b=>b.onclick=()=>{bindTarget=b.dataset.bind;b.classList.add('waiting');b.querySelector('kbd').textContent='PRESSIONE UMA TECLA…'});
      root.querySelectorAll('[data-padbind]').forEach(b=>b.onclick=()=>{padBindTarget=b.dataset.padbind;b.classList.add('waiting');b.querySelector('kbd').textContent='PRESSIONE NO CONTROLE…'});
      root.querySelector('#exp-pad-enabled').onchange=e=>{data.gamepad.enabled=e.target.checked;if(!data.gamepad.enabled)releaseAllPadInputs();save()};root.querySelector('#exp-reset-controls').onclick=()=>{data.keybinds=JSON.parse(JSON.stringify(DEFAULT_KEYS));data.gamepad.p1={...DEFAULT_PAD.p1};data.gamepad.p2={...DEFAULT_PAD.p2};save();render()};root.querySelector('#exp-close-controls').onclick=()=>d.close();
    };render();if(!d.open)d.showModal();
  }
  function setKeyBinding(code){
    if(!bindTarget)return false;const [slot,action]=bindTarget;for(const a of Object.keys(data.keybinds[slot]))if(data.keybinds[slot][a]===code)data.keybinds[slot][a]=DEFAULT_KEYS[slot][a];data.keybinds[slot][action]=code;bindTarget=null;save();setTimeout(()=>{if(document.getElementById('exp-controls')?.open)openControls()},0);return true;
  }
  function dispatchMapped(type,code,repeat=false){
    const ev=new KeyboardEvent(type,{code,key:code,bubbles:true,cancelable:true,repeat});try{Object.defineProperty(ev,'__expMapped',{value:true})}catch(_){ }window.dispatchEvent(ev);
  }
  function physicalToCanonical(code){
    for(const slot of ['p1','p2'])for(const [a,physical] of Object.entries(data.keybinds[slot]))if(physical===code)return CANON[slot][a];return null;
  }
  document.addEventListener('keydown',e=>{
    if(e.__expMapped)return;
    if(bindTarget){e.preventDefault();e.stopImmediatePropagation();setKeyBinding(e.code);return}
    physicalDown.add(e.code);const canonical=physicalToCanonical(e.code);if(canonical&&canonical!==e.code&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'')){e.preventDefault();e.stopImmediatePropagation();dispatchMapped('keydown',canonical,e.repeat)}
  },true);
  document.addEventListener('keyup',e=>{
    if(e.__expMapped)return;physicalDown.delete(e.code);const canonical=physicalToCanonical(e.code);if(canonical&&canonical!==e.code&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'')){e.preventDefault();e.stopImmediatePropagation();dispatchMapped('keyup',canonical,false)}
  },true);

  const padPrev=[{},{}];
  function keyboardHoldsCanonical(slot,action){const physical=data.keybinds[slot][action];return physicalDown.has(physical)}
  function releaseAllPadInputs(){
    for(const [idx,slot] of [[0,'p1'],[1,'p2']]){
      for(const action of Object.keys(CANON[slot]||{})){
        if(action==='crouch')continue;
        if(padPrev[idx][action])applyPadKey(slot,action,false);
      }
      for(const key of Object.keys(padPrev[idx]))padPrev[idx][key]=false;
    }
  }
  function applyPadKey(slot,action,pressed){
    const code=CANON[slot][action],idx=slot==='p1'?0:1,key=action;const prev=!!padPrev[idx][key];if(pressed&&!prev){window.justPressed=window.justPressed||{};window.keys=window.keys||{};window.justPressed[code]=true;window.keys[code]=true;const f=game();if(action==='taunt'&&f){const p=slot==='p1'?f.p1:f.p2;if(p?.human)taunt(p)}if(tutorial&&slot==='p1'&&action==='dodge'&&tutorialSteps[tutorial.index]?.action==='dodge')advanceTutorial()}else if(!pressed&&prev){window.keys=window.keys||{};if(!keyboardHoldsCanonical(slot,action))window.keys[code]=false}padPrev[idx][key]=pressed;
  }
  function pollGamepads(){
    try{
      if(!data.gamepad.enabled){
        if(Object.values(padPrev[0]).some(Boolean)||Object.values(padPrev[1]).some(Boolean))releaseAllPadInputs();
      } else if(navigator.getGamepads){const pads=navigator.getGamepads();for(let i=0;i<2;i++){const pad=pads?.[i];if(!pad)continue;const slot=i===0?'p1':'p2';if(padBindTarget&&padBindTarget.startsWith(slot+':')){for(let b=0;b<pad.buttons.length;b++){if(pad.buttons[b]?.pressed&&!padPrev[i]['bind'+b]){const action=padBindTarget.split(':')[1];data.gamepad[slot][action]=b;padBindTarget=null;save();toast(`GAMEPAD ${slot.toUpperCase()} · ${ACTION_LABEL[action]} = BOTÃO ${b}`,'premium');document.getElementById('exp-controls')?.close();setTimeout(openControls,50)}padPrev[i]['bind'+b]=!!pad.buttons[b]?.pressed}}
        const dz=Number(data.gamepad.deadzone)||.32,x=Number(pad.axes?.[0]||0);applyPadKey(slot,'left',x<-dz||!!pad.buttons?.[14]?.pressed);applyPadKey(slot,'right',x>dz||!!pad.buttons?.[15]?.pressed);for(const a of ['jump','punch','kick','power','guard','dodge','hook','ultimate','taunt']){const bi=Number(data.gamepad[slot][a]);applyPadKey(slot,a,!!pad.buttons?.[bi]?.pressed)}
      }}
    }catch(_){ }
    requestAnimationFrame(pollGamepads);
  }
  requestAnimationFrame(pollGamepads);

  /* ---------- 5. ANIMAÇÕES DE LUTA ---------- */
  function taunt(p){if(!p||p.expTauntT>0||(p.proKnockdownT||0)>0||p.state==='ko')return;p.expTauntT=.9;p.attackDisabledT=Math.max(p.attackDisabledT||0,.38);play('confirm',{character:p.id});toast(`${p.name} · PROVOCAÇÃO`,'combo',900)}
  document.addEventListener('keydown',e=>{
    const f=game();if(!f||f.paused||f.over||e.repeat)return;const p1=data.keybinds.p1.taunt,p2=data.keybinds.p2.taunt;if((e.code===p1||e.code===CANON.p1.taunt)&&f.p1?.human)taunt(f.p1);if((e.code===p2||e.code===CANON.p2.taunt)&&f.p2?.human)taunt(f.p2);
    if(tutorial){const step=tutorialSteps[tutorial.index];if(step?.action==='dodge'&&(e.code===data.keybinds.p1.dodge||e.code===CANON.p1.dodge))advanceTutorial()}
  },false);
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){const r=baseUpdate.apply(this,arguments);if(!f)return r;for(const p of [f.p1,f.p2]){const was=!!p.expWasDown,down=(p.proKnockdownT||0)>0&&p.onGround;p.expWasDown=down;if(was&&!down)p.expRecoveryT=.55;p.expRecoveryT=Math.max(0,(p.expRecoveryT||0)-dt);p.expTauntT=Math.max(0,(p.expTauntT||0)-dt)}
    if(tutorial&&f.mode==='tutorial'){f.timer=99999;f.p2.vx=0;f.p2.attackDisabledT=99999;const step=tutorialSteps[tutorial.index];if(step?.action==='stamina'&&(f.p1.proStamina??100)<88)advanceTutorial();if(step?.action==='combo'&&(f.p1.megaCombo||0)>=3)advanceTutorial();const ults=f.megaStats?.p1?.ultimates||0;if(step?.action==='ultimate'&&ults>(tutorial.lastUlts||0)){tutorial.lastUlts=ults;advanceTutorial()}}
    return r};

  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){
    if(!p)return baseDrawFighter.apply(this,arguments);ctx.save();if(p===game()?.p1){const skin=data.equipped.skin;if(skin==='Aura Carmesim')ctx.filter='saturate(1.35) hue-rotate(340deg)';else if(skin==='Gelo Espectral')ctx.filter='hue-rotate(165deg) saturate(1.25) brightness(1.08)';else if(skin==='Neon Primordial')ctx.filter='hue-rotate(285deg) saturate(1.45) brightness(1.12)';else if(skin==='Ouro do Campeão')ctx.filter='sepia(.65) saturate(1.8) brightness(1.12)'}
    const r=baseDrawFighter.apply(this,arguments);ctx.restore();const gy=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-p.y;
    ctx.save();if(p.expTauntT>0){ctx.globalAlpha=clamp(p.expTauntT*1.3,0,1);ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff3a8';ctx.shadowColor=p.color;ctx.shadowBlur=16;ctx.fillText('✦ PROVOCAÇÃO ✦',p.x,gy-205)}if(p.expRecoveryT>0){ctx.globalAlpha=p.expRecoveryT/.55;ctx.strokeStyle='#8fffe3';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,gy-72,55+(1-p.expRecoveryT/.55)*35,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d8fff7';ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.fillText('RECUPERAÇÃO',p.x,gy-145)}if(p.defend){ctx.globalAlpha=.35;ctx.strokeStyle='#9ae6ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,gy-76,46,-1.2,1.2);ctx.stroke()}if((p.megaDodgeT||0)>0){ctx.globalAlpha=.28;ctx.fillStyle=p.color;for(let i=1;i<=3;i++)ctx.fillRect(p.x-p.facing*i*24,gy-145,5,110)}
    if(p===game()?.p1&&data.equipped.trail!=='Padrão'&&Math.abs(p.vx||0)>30){ctx.globalAlpha=.22;ctx.strokeStyle=data.equipped.trail.includes('Glacial')?'#80e7ff':data.equipped.trail.includes('Rubro')?'#ff3455':p.color;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(p.x-p.facing*20,gy-90);ctx.lineTo(p.x-p.facing*90,gy-65);ctx.stroke()}ctx.restore();return r};

  /* arena-specific lightweight effects */
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const r=baseDraw.apply(this,arguments);if(!f)return r;const ctx=canvas.getContext('2d'),id=f.stage?.id,t=performance.now()/1000;ctx.save();ctx.globalAlpha=.22;
    if(id==='geleira'){ctx.fillStyle='#bdf3ff';for(let i=0;i<12;i++){const x=(i*149+t*18)%W,y=120+(i*71)%650;ctx.fillRect(x,y,2,12)}}
    if(id==='vulcao'){ctx.fillStyle='#ff8a3d';for(let i=0;i<14;i++){const x=(i*131+t*25)%W,y=GROUND_Y-((i*53+t*42)%320);ctx.beginPath();ctx.arc(x,y,2+(i%3),0,6.28);ctx.fill()}}
    if(id==='cidade'||id==='ruas'){ctx.strokeStyle=id==='ruas'?'#ff3b81':'#7df9ff';ctx.lineWidth=1;for(let i=0;i<9;i++){const x=(i*183+t*90)%W;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-28,170);ctx.stroke()}}
    if(id==='templo'||id==='santuariolunar'){ctx.fillStyle='#ffd18a';for(let i=0;i<10;i++){ctx.beginPath();ctx.arc((i*173)%W,100+Math.sin(t+i)*35+(i%4)*120,2,0,6.28);ctx.fill()}}
    if(id==='primordial'){ctx.strokeStyle='#ffd56a';ctx.lineWidth=2;ctx.globalAlpha=.18+.08*Math.sin(t*2);for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(W/2,GROUND_Y-220,90+i*42,0,6.28);ctx.stroke()}}
    ctx.restore();return r};

  /* ---------- 6. SOM / IMPACTO + TRILHAS DINÂMICAS ---------- */
  let lastMusicScreen='',musicTimer=0;
  function musicMotif(){
    let s='';try{s=typeof screen!=='undefined'?String(screen):''}catch(_){s=''}const audio=window.ProAudio?.getSettings?.();if(!audio?.ambience||audio.muted)return;if(s!==lastMusicScreen){lastMusicScreen=s;musicTimer=0}
    const now=performance.now();if(now-musicTimer<4200)return;musicTimer=now;
    if(s==='fight'){tone(82,.35,'triangle',.025);tone(123,.25,'sine',.018,.16);tone(164,.22,'triangle',.014,.34)}
    else if(s.includes('select')||s.includes('stage')){tone(220,.25,'sine',.02);tone(330,.2,'triangle',.014,.18)}
    else{tone(110,.32,'sine',.018);tone(165,.25,'triangle',.012,.2)}
  }
  setInterval(musicMotif,950);

  /* ---------- 14. BACKUP SEGURO ---------- */
  function checksum(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
  function safeBackup(silent=true){
    const keys=new Set(['lutador-state','lutador-state-backup','lutador-save-v2','lutador-progression-v1','lutador-progression-v1-backup','lutador-ultimate-v2','lutador-complete-15-v1',KEY,'lutador-audio-v1','lutador_arena_stats']);
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&/^lutador[-_]/i.test(k)&&k!==SAFETY_KEY)keys.add(k)}}catch(_){ }
    const payload={version:1,at:Date.now(),items:{}};
    for(const k of keys){const v=localStorage.getItem(k);if(v!=null)payload.items[k]=v}const body=JSON.stringify(payload);const wrapped=JSON.stringify({checksum:checksum(body),body});try{localStorage.setItem(SAFETY_KEY,wrapped);data.lastBackupAt=payload.at;save();if(!silent)toast('BACKUP DO PROGRESSO CRIADO','reward');return true}catch(_){if(!silent)toast('NÃO FOI POSSÍVEL CRIAR O BACKUP','danger');return false}
  }
  function restoreBackup(){
    try{const wrap=JSON.parse(localStorage.getItem(SAFETY_KEY)||'null');if(!wrap?.body||checksum(wrap.body)!==wrap.checksum)throw new Error('checksum');const payload=JSON.parse(wrap.body);if(!confirm('Restaurar o último backup? O progresso atual será substituído.'))return;for(const [k,v] of Object.entries(payload.items||{}))localStorage.setItem(k,v);location.reload()}catch(_){toast('BACKUP INVÁLIDO OU INEXISTENTE','danger')}
  }
  setInterval(()=>safeBackup(true),30000);window.addEventListener('pagehide',()=>safeBackup(true));

  /* ---------- 15. LOBBY PREMIUM ---------- */
  function injectPremiumHome(){
    const menu=appNode()?.querySelector('.menu');if(!menu||menu.querySelector('.exp-premium-home'))return;const actions=menu.querySelector('.lobby-actions');
    const hero=document.createElement('section');hero.className='exp-premium-home';hero.innerHTML=`<div class="exp-premium-copy"><small>${esc(window.ProProgression?.getSnapshot?.()?.pass?.seasonName||'TEMPORADA ATUAL')}</small><h2>SORTEP <em>NIAK</em></h2><p>Domine combos, evolua a maestria e escreva sua lenda.</p><div><button class="btn big" id="exp-play-now">⚔ JOGAR AGORA</button><button class="btn" id="exp-profile-open">◈ PERFIL</button><button class="btn" id="exp-tutorial-open">🎓 ACADEMIA</button></div></div><div class="exp-featured"><img src="ai-assets/characters/rojo.png" alt="Rojo"><span>CAMPEÃO EM DESTAQUE</span><b>ROJO</b><small>Pressão Rubra · domínio de combos</small></div><footer><span>v${VERSION}</span><b>EVENTO ATIVO · CAMINHO PRIMORDIAL</b><button id="exp-news-open">VER CARREIRA</button></footer>`;
    const tagline=menu.querySelector('.mk-tagline');(tagline||menu.firstElementChild)?.after(hero);hero.querySelector('#exp-play-now').onclick=()=>renderModes();hero.querySelector('#exp-profile-open').onclick=openProfile;hero.querySelector('#exp-tutorial-open').onclick=startTutorial;hero.querySelector('#exp-news-open').onclick=openAchievements;
    if(actions&&!actions.querySelector('#exp-career-btn')){const b=document.createElement('button');b.id='exp-career-btn';b.className='btn';b.textContent='★ CARREIRA & MAESTRIA';b.onclick=openMastery;actions.appendChild(b)}
    applyLobbyCosmetics(menu);
  }
  function applyLobbyCosmetics(menu){menu=menu||appNode()?.querySelector('.menu');if(!menu)return;menu.dataset.expFrame=data.equipped.frame;menu.classList.toggle('exp-frame-prime',data.equipped.frame.toLowerCase().includes('primordial'));menu.classList.toggle('exp-frame-neon',data.equipped.frame.toLowerCase().includes('neon'))}
  function injectShopButton(){const root=appNode()?.querySelector('.shop');if(!root||root.querySelector('#exp-cosmetic-shop-btn'))return;const actions=root.querySelector('.lobby-actions');if(actions){const b=document.createElement('button');b.id='exp-cosmetic-shop-btn';b.className='btn big exp-shop-main';b.textContent='✨ COSMÉTICOS · SKINS · FINALIZAÇÕES';b.onclick=openCosmeticShop;actions.prepend(b)}}
  function injectStoryCampaign(){return}
  function enhanceSettings(){
    const body=document.querySelector('.ultimate-dialog[data-kind="settings"] .ultimate-body');if(!body||body.querySelector('.exp-settings-extra'))return;const sec=document.createElement('section');sec.className='exp-settings-extra';sec.innerHTML=`<div><span class="settings-panel-icon">⌨</span><div><h3>CONTROLES & SEGURANÇA</h3><p>Teclas, gamepad e backup do progresso.</p></div></div><div class="exp-settings-actions"><button class="btn" id="exp-open-controls">⌨ CONFIGURAR TECLAS / GAMEPAD</button><button class="btn" id="exp-backup-now">💾 CRIAR BACKUP</button><button class="btn" id="exp-backup-restore">↺ RESTAURAR BACKUP</button></div>`;body.appendChild(sec);sec.querySelector('#exp-open-controls').onclick=openControls;sec.querySelector('#exp-backup-now').onclick=()=>safeBackup(false);sec.querySelector('#exp-backup-restore').onclick=restoreBackup;
  }

  /* ---------- GAMEPLAY HOOKS ---------- */
  function kindOf(src,type){const raw=String(src?.proKind||src?.move?.kind||type||'special').toLowerCase();if(raw.includes('punch'))return'punch';if(raw.includes('kick'))return'kick';if(raw.includes('uppercut'))return'uppercut';return raw}
  const baseDamage=window.damage;
  if(typeof baseDamage==='function')window.damage=function(victim,amount,src,dir,type){const f=game(),attacker=src?.owner||(src?.id&&src!==victim?src:null),before=Number(victim?.hp||0),kind=kindOf(src,type),grounded=!!(victim?.proKnockdownT>0&&victim?.onGround);const r=baseDamage.apply(this,arguments),after=Number(victim?.hp||0),dealt=Math.max(0,before-after);
    if(dealt>0){if(kind==='punch')play('punch',{character:attacker?.id});else if(kind==='kick')play('kick',{character:attacker?.id});else if(kind==='uppercut'){play('kick',{character:attacker?.id});play('hit',{character:attacker?.id,delay:.04})}else play('hit',{character:attacker?.id});if(amount>55){play('special',{character:attacker?.id});tone(55,.16,'sine',.04)}if(grounded&&kind==='kick'&&after<=0&&attacker===f?.p1)data.stats.groundKOs++}
    tutorialHit(attacker,victim,kind,before,after);return r};

  function recordMatchStats(f,won){
    if(!f||f.expansionRecorded||f.mode==='tutorial')return;f.expansionRecorded=true;const s=f.megaStats?.p1||{};data.stats.matches++;won?data.stats.wins++:data.stats.losses++;data.stats.maxCombo=Math.max(data.stats.maxCombo,Number(s.maxCombo)||0);data.stats.totalDamage+=Math.round(Number(s.damage)||0);data.stats.ultimates+=Number(s.ultimates)||0;
    const id=f.p1?.id||'rojo',by=data.stats.byFighter[id]||(data.stats.byFighter[id]={matches:0,wins:0});by.matches++;if(won)by.wins++;
    const m=masteryOf(id);m.matches++;if(won)m.wins++;m.maxCombo=Math.max(m.maxCombo,Number(s.maxCombo)||0);m.damage+=Math.round(Number(s.damage)||0);m.ultimates+=Number(s.ultimates)||0;m.xp+=Math.round((won?120:70)+Math.min(120,(Number(s.damage)||0)/35)+(Number(s.maxCombo)||0)*6+(Number(s.ultimates)||0)*18);awardMastery(id);
    checkAchievements({noUlt:won&&(Number(s.ultimates)||0)===0});save();safeBackup(true);
  }

  const baseResult=window.showMatchResult;
  if(typeof baseResult==='function')window.showMatchResult=function(playerWon,options={}){const f=game();if(f?.mode==='bracket'&&bracket?.active){finishBracket(!!playerWon,f);return}if(f?.mode==='storyx'&&window.__expStory){finishCampaignFight(!!playerWon,f);return}if(f?.mode==='tutorial')return;recordMatchStats(f,!!playerWon);const r=baseResult.apply(this,arguments);setTimeout(()=>{
      const card=document.querySelector('#match-result-overlay .match-result-card');if(!card||card.querySelector('.exp-victory-pose')||!f)return;const pose=data.equipped.victory,fin=data.equipped.finisher;const panel=document.createElement('section');panel.className='exp-victory-pose';panel.innerHTML=`<img src="ai-assets/characters/${f.p1.id}.png" alt=""><div><small>${playerWon?'POSE DE VITÓRIA':'RESUMO DO CAMPEÃO'}</small><h3>${playerWon?esc(pose):'VOLTE MAIS FORTE'}</h3><span>${playerWon&&fin!=='Padrão'?`FINALIZAÇÃO EQUIPADA · ${esc(fin)}`:`MAESTRIA · NÍVEL ${masteryLevel(masteryOf(f.p1.id).xp)}`}</span></div>`;card.querySelector('.match-result-actions')?.before(panel);if(playerWon){play('win');tone(440,.16,'triangle',.03);tone(660,.22,'triangle',.025,.13)}} ,20);return r};

  const baseStartFight=window.startFight;
  if(typeof baseStartFight==='function')window.startFight=function(){const r=baseStartFight.apply(this,arguments);const f=game();if(f){f.expansionStartedAt=Date.now();f.p1.expEntry=data.equipped.entrance;setTimeout(()=>showEntranceCue(f),80)}return r};
  function showEntranceCue(f){if(!f||game()!==f||f.mode==='tutorial')return;const entry=data.equipped.entrance;if(!entry||entry==='Padrão')return;const el=document.createElement('div');el.className='exp-entry-cue '+(entry.includes('Glacial')?'ice':entry.includes('Primordial')?'prime':'red');el.innerHTML=`<small>ENTRADA EQUIPADA</small><b>${esc(entry)}</b>`;document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},1150)}

  const baseAi=window.aiInput;
  if(typeof baseAi==='function')window.aiInput=function(p,f,dt){if(f?.mode==='tutorial'){p.vx=0;p.defend=false;return}return baseAi.apply(this,arguments)};

  /* tournament screen replacement — installed last */
  window.renderTournamentSelect=renderTournamentPro;

  /* ---------- DOM INJECTION ---------- */
  let observerQueued=false;
  const observer=new MutationObserver(()=>{if(observerQueued)return;observerQueued=true;queueMicrotask(()=>{observerQueued=false;injectPremiumHome();injectShopButton();injectStoryCampaign();enhanceSettings()})});
  observer.observe(document.body,{childList:true,subtree:true});

  /* startup */
  injectPremiumHome();injectShopButton();injectStoryCampaign();enhanceSettings();checkAchievements();safeBackup(true);

  window.LutadorExpansion=Object.freeze({
    version:VERSION,data,save,openProfile,openMastery,openAchievements,openCosmeticShop,openControls,startTutorial,renderCampaignHub,renderTournament:renderTournamentPro,safeBackup,restoreBackup
  });
})();
