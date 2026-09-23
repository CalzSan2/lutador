/*
 * LUTADOR V47 — ARENA TOTAL
 * Platform fighter P2P host-autoritativo para 2–8 jogadores.
 */
(()=>{
'use strict';
const VERSION='47.0.0',CW=1440,CH=810,WORLD_W=CW,FALL_Y=930;
const NET_SNAPSHOT_DT=1/12, NET_INPUT_HEARTBEAT=50, NET_BACKPRESSURE=32*1024, FAST_BACKPRESSURE=20*1024, CULL_MARGIN=260, NET_EXTRAP_MAX=.12;
const INPUT_ORDER=['left','right','jump','down','guard','punch','kick','hook','power','super','extra','dodge','extra1','extra2'];
const FORMAT={ffa:{id:'ffa',name:'TODOS CONTRA TODOS',short:'FFA',min:2,max:8,teams:0},'2v2':{id:'2v2',name:'2 × 2',short:'2V2',min:4,max:4,teams:2},'3v3':{id:'3v3',name:'3 × 3',short:'3V3',min:6,max:6,teams:2},'4v4':{id:'4v4',name:'4 × 4',short:'4V4',min:8,max:8,teams:2},duo:{id:'duo',name:'TORNEIO EM TRIO',short:'TRIO',min:3,max:3,teams:1}};
const TEAM_COLORS=['#38bdf8','#fb7185','#facc15','#a78bfa','#4ade80','#fb923c','#22d3ee','#f472b6'];
const SPAWN_TEMPLATE=[{x:240,y:505},{x:1200,y:505},{x:700,y:455},{x:820,y:455},{x:355,y:505},{x:1085,y:505},{x:655,y:245},{x:785,y:245}];
// Arena compacta: toda a ação permanece na tela, sem corredores laterais.
const SPAWNS=SPAWN_TEMPLATE.map(s=>({...s}));
const PLATFORM_TEMPLATE=[
  {id:'left',x:70,y:610,w:410,h:36,ground:true},{id:'center',x:580,y:560,w:280,h:35,ground:true},{id:'right',x:960,y:610,w:410,h:36,ground:true},
  {id:'upper-left',x:265,y:430,w:235,h:22},{id:'upper-center',x:602,y:350,w:236,h:22},{id:'upper-right',x:940,y:430,w:235,h:22}
];
const BASE_PLATFORMS=PLATFORM_TEMPLATE.map(p=>({...p,id:`${p.id}-0`}));
function makeBridges(){return[{id:'b1-0',x:480,y:600,w:100,h:18,hp:120,maxHp:120,brokenT:0},{id:'b2-0',x:860,y:600,w:100,h:18,hp:120,maxHp:120,brokenT:0}]}
const COMBAT_SPECS=Object.freeze({
  // Mesmos tempos, alcances, multiplicadores e stamina do ProCombat do modo normal.
  punch:{duration:.29,start:.085,end:.15,range:102,damage:.78,cost:6,height:114},
  kick:{duration:.47,start:.16,end:.26,range:144,damage:1.22,cost:12,height:84},
  doublepunch:{duration:.43,start:.07,end:.28,range:112,damage:1.30,cost:10,height:110},
  strongpunch:{duration:.48,start:.15,end:.27,range:126,damage:1.62,cost:16,height:128},
  doublekick:{duration:.58,start:.12,end:.36,range:155,damage:1.68,cost:18,height:84},
  sweep:{duration:.50,start:.14,end:.28,range:166,damage:1.46,cost:16,height:38},
  flyingkick:{duration:.56,start:.14,end:.34,range:178,damage:1.78,cost:19,height:104},
  airdown:{duration:.52,start:.10,end:.36,range:106,damage:1.58,cost:15,height:32},
  down:{duration:.42,start:.13,end:.20,range:620,damage:1.10,cost:18,height:35},
  forward:{duration:.48,start:.16,end:.29,range:128,damage:1.42,cost:23,height:103},
  diagonal:{duration:.59,start:.20,end:.32,range:116,damage:1.68,cost:29,height:125},
  doubleforward:{duration:.62,start:.18,end:.36,range:178,damage:1.92,cost:34,height:108},
  skyfall:{duration:.68,start:.25,end:.42,range:205,damage:2.05,cost:38,height:118},
  crossrush:{duration:.72,start:.20,end:.43,range:190,damage:2.25,cost:43,height:104},
  corewave:{duration:.76,start:.22,end:.45,range:720,damage:2.32,cost:48,height:42},
  comet:{duration:.78,start:.24,end:.48,range:760,damage:2.48,cost:52,height:112},
  astralrain:{duration:.86,start:.28,end:.56,range:260,damage:2.72,cost:58,height:120},
  uppercut:{duration:.64,start:.18,end:.34,range:126,damage:1.86,cost:32,height:92}
});
// O motor principal carrega depois deste arquivo; durante a luta, leia os dados atuais dele.
function combatSpec(kind){return window.ProCombat?.specs?.[kind]||COMBAT_SPECS[kind]}
const NORMAL_POWER_CD=Object.freeze({verry:.75,perry:.85,uiye:.65,ouip:.80,lkugh:.90,knunka:.90,dart:.65,jimmy:.70,hock:.72,vlad:.75,flame:.75,atizz:.42,klo:.85,nine85:.70,jone:.48,laranja:.46,ktrak:.52});
const NORMAL_SUPER_CD=Object.freeze({jimmy:6,hock:6.2,vlad:5.2,perry:4.8,verry:5.2,ouip:5,lkugh:5,dart:5.5,knunka:5.8,flame:5.5,klo:5.2,atizz:3.8,yoi:3.6,rtess:3.2,nine85:4.5,jone:6.6,laranja:5.8,ktrak:7.2});
function normalPowerCooldown(a,id=a?.charId){
  if(id==='ktrak'){
    const e=a.ktrakElement||'water',av=(a.ktrakAvatarT||0)>0;
    if(av)return({water:.48,earth:.88,fire:.78,air:.72,lightning:.66,lava:.92,heal:.78})[e]??.72;
    return({water:.60,earth:.88,fire:.64,air:.68,lightning:.72,lava:1.08,heal:1.05})[e]??.60;
  }
  if(id==='kain'){const powers=['flight','ice','heal','shock','repel','swap','fire','teleport','drain','gravity'],type=a.kainPower||powers[a.kainPowerIndex||0]||'flight';return({flight:2.4,ice:.88,heal:2.7,shock:1.25,repel:2.2,swap:3.0,fire:.96,teleport:1.65,drain:2.05,gravity:2.0})[type]??1.2}
  return NORMAL_POWER_CD[id]??.45
}
function normalSuperCooldown(a,id=a?.charId){if(id==='kain')return 7.1;return NORMAL_SUPER_CD[id]??4}
function islandMoveDamage(a,mul){const base=a?.normalDmg||Math.max(30,Math.round((charById(a?.charId)?.dmg||30)*1.5));return clamp(base*mul*.14,3,28)}
const PROFILE={
  laranja:['CADEIA RELÂMPAGO','dash','#ff7a35','shock'],jone:['PRAGA TÓXICA','shot','#9bea72','poison'],ktrak:['DOMÍNIO ELEMENTAL','element','#52d7ff','element'],
  knunka:['RAIO AZUL','dash','#60a5fa','burn'],nine85:['LANÇA DE DADOS','beam','#67e8f9','system'],uiye:['ROCHA MÍMICA','shot','#a89682','stone'],rtess:['CAMPO MAGNÉTICO','pull','#fb923c','magnet'],atizz:['CORTE DO GLITCH','dash','#22d3ee','glitch'],grizz:['LASER OCULAR','beam','#f59e0b','laser'],ouip:['CHUVA ÁCIDA','area','#a3e635','poison'],jetde:['BOLHA REPELENTE','shot','#22d3ee','bubble'],xillen:['ENERGIA ALIEN','beam','#72f06a','shock'],thuvaa:['ORBE DE GELO','shot','#4cc9f0','freeze'],ytiri:['CORRENTE ESPECTRAL','pull','#94a3b8','chain'],lkugh:['BOMBA LUNAR','lob','#8b5cf6','bomb'],grogh:['ENERGIA REFLETIDA','beam','#22d3ee','reflect'],dart:['ELEMENTO ALEATÓRIO','element','#a78bfa','element'],trefoh:['FLOR ARCANA','shot','#8b5cf6','nature'],yoi:['ECLIPSE','area','#b86bff','slow'],flame:['BOLA DE FOGO','shot','#ff5a1f','burn'],rojo:['CHUVA DE LÂMINAS','lob','#ef4444','blade'],perry:['TEMPESTADE DE FOLHAS','shot','#84cc16','leaf'],verry:['TERRENO DE LAMA','area','#8b5e34','slow'],hock:['MARTELO QUEBRA-LUAS','smash','#ff9f1c','meteor'],vlad:['SANGUE VAMPÍRICO','shot','#dc2626','drain'],klo:['CARTAS QUÂNTICAS','lob','#39ff88','warp'],klopp:['MÍMICO ALEATÓRIO','copy','#f43f5e','copy'],frogh:['MUTAÇÃO MIMÉTICA','copy','#35e08a','copy'],jimmy:['RAIO CELESTE','beam','#60a5fa','shock'],
  priya:['RIFLE TÁTICO','shot','#ff765e','bullet'],kain:['CAOS ABISSAL','element','#c0c7ff','chaos'],aria:['PRISÃO VERDANTE','area','#82efa5','nature'],leo:['COLAPSO DE PORTAIS','lob','#67f3b8','warp'],tharoth:['AREIA SOMBRIA','area','#ff4d62','slow']
};
const DUMMY_ARRAYS=['knives','swords','orbs','flowers','wands','rays','lightnings','smokeBombs','ytiriCopyFx','ytiriChains','uiyeCopyFx','uiyeCopyT','grizzClones','grizzLaserFx','groghEnergy','groghReflections','dartWinds','dartWalls','dartFires','dartPotions','dartEffects','lkughBombs','lkughMoons','lkughStars','lkughBlackHoles','lkughEffects','fireballs','firewalls','knunkaRays','knunkaFires','knunkaDashTrails','uiyeStones','ouipAcid','ouipMeteors','kloHoles','jimmyRays','hockShards','hockMoonFx','vladBloodSpits','vladSiphons','jetdeShots','wandShots','yoiGas','yoiSand','ktrakShots','ktrakRocks','ktrakBursts','ktrakFx','ktrakTornadoes','ktrakInfernos','ktrakEarthCrushes','ktrakLavaPools','ktrakHealColumns','ktrakLightningCharges','ktrakCracks','joneShots','joneBombs','joneClouds','joneFx','laranjaTrails','laranjaBursts','laranjaImpacts','priyaBullets','priyaBombs','ariaFlowers','ariaGrass','ariaVines','ariaFx','kainIceShots','kainFireShots','kainBolts','kainFx'];
const bg=new Image();bg.decoding='async';bg.src='island-clash-assets/island-arena-v22.png';
const held=new Set();
let staticWorldCache=null;
function packInputBits(v){let m=0;for(let i=0;i<INPUT_ORDER.length;i++)if(v?.[INPUT_ORDER[i]])m|=(1<<i);return m}
function unpackInputBits(m){const o={};m=Number(m)||0;for(let i=0;i<INPUT_ORDER.length;i++)o[INPUT_ORDER[i]]=!!(m&(1<<i));return o}
function visibleWorldX(x,r=0){const cam=game?.cameraX||0;return x+r>=cam-CULL_MARGIN&&x-r<=cam+CW+CULL_MARGIN}
function perfFxCap(){return game?.quality==='low'?24:game?.quality==='medium'?44:80}
function fxShadow(){return game?.quality==='low'?0:game?.quality==='medium'?5:12}

const DEFAULT_RULES=Object.freeze({capacity:8,stocks:3,minutes:5,items:true,bridges:true,theme:'random'});
let selectedFormat='ffa',selectedChar='',net=null,game=null,lastLobby=null,charCache=null,lobbyContext='arena-total',arenaTotalActive=true,selectedRules={...DEFAULT_RULES};
const DUO_EVENT_REWARD=Object.freeze({psy:70,gold:12000,vandais:1000});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const playerName=()=>{try{return String(state?.playerName||'JOGADOR').trim().slice(0,18)||'JOGADOR'}catch(_){return'JOGADOR'}};
const fmtName=id=>FORMAT[id]?.name||FORMAT.ffa.name;
function normalizeRules(raw={}){raw=raw&&typeof raw==='object'?raw:{};const capacity=clamp(Math.round(raw.capacity??8),2,8),stocks=[1,3,5].includes(Number(raw.stocks))?Number(raw.stocks):3,minutes=[0,3,5,8].includes(Number(raw.minutes))?Number(raw.minutes):5,theme=['random','aurora','tempestade','crepusculo'].includes(raw.theme)?raw.theme:'random';return{capacity,stocks,minutes,items:raw.items!==false,bridges:raw.bridges!==false,theme}}
function roomCapacity(mode=selectedFormat,rules=selectedRules){return mode==='ffa'?normalizeRules(rules).capacity:FORMAT[mode]?.max||8}
function rulesSummary(rules=selectedRules){const r=normalizeRules(rules);return`${r.stocks} VIDAS · ${r.minutes?r.minutes+' MIN':'SEM LIMITE'} · ITENS ${r.items?'SIM':'NÃO'} · PONTES ${r.bridges?'QUEBRÁVEIS':'FIXAS'} · ${r.theme==='random'?'CENÁRIO SURPRESA':r.theme.toUpperCase()}`}
function allCharacters(){
  const out=[],seen=new Set(),add=c=>{if(!c?.id||c.ravamOnly||c.ravamLegendExclusive||seen.has(c.id)||(c.id==='ztaaa'&&!(state?.ztaaaUnlocked&&state?.roster?.includes('ztaaa'))))return;seen.add(c.id);out.push(c)};
  try{for(const c of CHARACTERS||[])if(Array.isArray(state?.roster)&&state.roster.includes(c.id)&&(!window.primeCharacterVisible||primeCharacterVisible(c)))add(c)}catch(_){ }
  try{for(const c of Array.from(window.RavamStudios?.allCharacters||window.RavamStudios?.characters||[]))if(window.RavamStudios?.isOwned?.(c.id))add(c)}catch(_){ }
  return out;
}
function charById(id){if(!charCache){charCache=new Map();for(const c of allCharacters())charCache.set(c.id,c);try{for(const c of CHARACTERS||[])if(c?.id&&!charCache.has(c.id))charCache.set(c.id,c)}catch(_){}try{for(const c of Array.from(window.RavamStudios?.allCharacters||window.RavamStudios?.characters||[]))if(c?.id&&!charCache.has(c.id))charCache.set(c.id,c)}catch(_){}}return charCache.get(id)||{id:id||'rojo',name:String(id||'Rojo'),color:'#e63946',dmg:30,speed:70,hp:1890,weapon:'knife',special:'rain'};}
function profileOf(id){return PROFILE[id]||['PODER DE CAMPEÃO','shot',charById(id).color||'#fff','energy']}
function roleOf(c){try{return ABILITIES?.[c.id]?.role||window.RavamV17?.all?.find?.(x=>x.id===c.id)?.name||profileOf(c.id)[0]}catch(_){return profileOf(c.id)[0]}}
function portraitOf(c){return c?.portrait||''}
function playSfx(name,vol=.65){try{SFX?.play?.(name,vol)}catch(_){}}
function toast(text){try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(text,'normal',1900);mixToast?.(text)}catch(_){}}

function injectModeCard(){
  const base=window.renderModes;if(typeof base!=='function'||base.__islandV22)return;
  function patched(){const r=base.apply(this,arguments),grid=document.querySelector('.mode-grid');document.getElementById('mode-duo-event')?.remove();document.getElementById('mode-island')?.remove();if(grid&&!document.getElementById('mode-arena-total')){const b=document.createElement('button');b.id='mode-arena-total';b.className='mode-card mk-mode arena-total-mode-card';b.innerHTML='<div class="mode-icon">✦</div><span class="mode-badge">P2P · 2 A 8 JOGADORES</span><h3>ARENA <span>TOTAL</span></h3><p>Todos contra todos ou equipes 2×2, 3×3 e 4×4. Regras da sala, placar ao vivo e combate original.</p>';b.onclick=()=>{playSfx('menu_confirm');arenaTotalActive=true;selectedFormat='ffa';openSetup()};grid.appendChild(b)}if(grid&&!document.getElementById('mode-trio-event')){const e=document.createElement('button');e.id='mode-trio-event';e.className='mode-card mk-mode duo-event-mode-card';e.innerHTML='<div class="mode-icon">⚔️</div><span class="mode-badge">TORNEIO P2P · TRIO</span><h3>TRIO <span>IMPLACÁVEL</span></h3><p>Três jogadores contra CPUs especialistas. 15 vitórias, no máximo 3 derrotas e eliminação permanente.</p>';e.onclick=()=>{playSfx('menu_confirm');arenaTotalActive=false;openDuoEvent()};grid.appendChild(e)}return r}
  patched.__islandV22=true;window.renderModes=patched;
}
function duoEventState(){
  if(!state.trioTournamentV33||typeof state.trioTournamentV33!=='object')state.trioTournamentV33={wins:0,losses:0,eliminated:false,completed:false};
  const st=state.trioTournamentV33;st.wins=clamp(st.wins||0,0,15);st.losses=clamp(st.losses||0,0,3);st.eliminated=!!st.eliminated;st.completed=!!st.completed;return st;
}
function syncDuoEventState(src){if(!src)return duoEventState();const st=duoEventState();st.wins=clamp(src.wins??st.wins,0,15);st.losses=clamp(src.losses??st.losses,0,3);st.eliminated=!!(src.eliminated??st.eliminated);st.completed=!!(src.completed??st.completed);try{persist()}catch(_){}return st}
function grantDuoEventReward(token){if(!token)return false;if(!Array.isArray(state.duoEventRewardTokens))state.duoEventRewardTokens=[];if(state.duoEventRewardTokens.includes(token))return false;state.duoEventRewardTokens.push(token);state.duoEventRewardTokens=state.duoEventRewardTokens.slice(-20);state.psy=Math.max(0,Number(state.psy)||0)+DUO_EVENT_REWARD.psy;state.coins=Math.max(0,Number(state.coins)||0)+DUO_EVENT_REWARD.gold;state.vandais=Math.max(0,Number(state.vandais)||0)+DUO_EVENT_REWARD.vandais;try{persist()}catch(_){}return true}
function duoEventProgressHtml(st){return`<div class="duo-event-progress"><div><b>${st.wins}/15</b><span>VITÓRIAS</span></div><div><b>${st.losses}/3</b><span>DERROTAS</span></div><div><b>${Math.max(0,15-st.wins)}</b><span>FALTAM</span></div></div>`}
function openDuoEvent(){
  stopGame(false);closeNetwork();arenaTotalActive=false;lobbyContext='duo';selectedFormat='duo';screen='island-duo-event';drawCanvas?.();const st=duoEventState();
  const status=st.completed?'TORNEIO CONCLUÍDO':st.eliminated?'TRIO ELIMINADO':'DESAFIO ATIVO';
  app.innerHTML=`<main class="card island-shell duo-event-shell"><div class="island-kicker">TORNEIO OFICIAL · ILHAS P2P</div><h1 class="island-title">TRIO <span>IMPLACÁVEL</span></h1><p class="island-sub">Três jogadores reais enfrentam equipes de CPU especialistas, com defesa precisa, contra-ataque e pressão de flanco. Vença <b>15 partidas</b>. Na <b>3ª derrota</b>, o trio é eliminado e não pode jogar novamente nesta instalação.</p>${duoEventProgressHtml(st)}<div class="duo-event-rules"><article><b>⚔️ TRIO P2P</b><span>HOST + 2 convidados jogam no mesmo time.</span></article><article><b>🏆 15 VITÓRIAS</b><span>A batalha final traz a equipe de ZTAAA.</span></article><article><b>☠️ 3 DERROTAS</b><span>Eliminação permanente do torneio.</span></article><article><b>🎁 RECOMPENSA</b><span>12.000 GOLD · 70 PSY · 1.000 VANDAIS.</span></article></div><div class="duo-event-state ${st.completed?'complete':st.eliminated?'out':'active'}">${status}</div><div class="island-actions">${(!st.eliminated&&!st.completed)?'<button id="duo-event-host" class="btn big island-online-btn">🌐 CRIAR TRIO P2P</button><button id="duo-event-join" class="btn big island-online-btn">🔗 ENTRAR NO TRIO</button>':''}</div><div class="island-foot"><span>Progresso, derrotas e eliminação ficam salvos.</span><button id="duo-event-back" class="btn">← MODOS</button></div></main>`;
  document.getElementById('duo-event-host')?.addEventListener('click',()=>openDuoEventLobby('host'));document.getElementById('duo-event-join')?.addEventListener('click',()=>openDuoEventLobby('guest'));document.getElementById('duo-event-back').onclick=()=>{lobbyContext='arena-total';selectedFormat='ffa';renderModes()};
}
function openDuoEventLobby(role){
  const st=duoEventState();if(st.eliminated||st.completed)return openDuoEvent();closeNetwork();lobbyContext='duo';selectedFormat='duo';screen='island-duo-lobby';drawCanvas?.();const roster=allCharacters();if(!roster.some(c=>c.id===selectedChar))selectedChar=roster[0]?.id||'rojo';
  app.innerHTML=`<main class="card island-shell duo-event-shell"><div class="island-kicker">TORNEIO EM TRIO · V${VERSION}</div><h1 class="island-title">TRIO <span>P2P</span></h1>${duoEventProgressHtml(st)}<p class="island-sub">Escolha seu lutador, marque PRONTO e aguarde os três jogadores. O trio humano enfrenta uma equipe completa de CPUs especialistas.</p><div class="island-lobby"><section class="island-panel"><h3>${role==='host'?'CRIAR TRIO':'ENTRAR NO TRIO'}</h3><div id="island-connect-panel">${role==='host'?'<p style="color:#91a4ba;font:700 11px Oxanium">Gerando código exclusivo do torneio…</p>':'<input id="island-room-input" class="island-room-code" maxlength="11" placeholder="TRIO-ABC123"><button id="island-connect" class="btn big island-online-btn" style="width:100%;margin-top:10px">CONECTAR</button>'}</div><div id="island-net-status" class="island-lobby-status">${role==='host'?'Preparando a sala…':'Digite o código do trio.'}</div><div class="island-lobby-pick-head"><b>1 · SEU LUTADOR</b><span id="island-lobby-char-name">${esc(charById(selectedChar).name||selectedChar)}</span></div><div id="island-lobby-roster" class="island-lobby-roster">${roster.map(c=>`<button class="island-lobby-fighter ${c.id===selectedChar?'active':''}" data-char="${esc(c.id)}" style="--fc:${c.color||'#67e8f9'}">${portraitOf(c)?`<img src="${esc(portraitOf(c))}" alt="">`:`<span>${esc((c.name||c.id).slice(0,2).toUpperCase())}</span>`}<b>${esc(c.name||c.id)}</b></button>`).join('')}</div><div class="island-lobby-ready-note">2 · Depois da escolha, marque <b>PRONTO</b>.</div></section><section class="island-panel"><div class="island-roster-head"><h3 id="island-lobby-title">TORNEIO EM TRIO</h3><small id="island-capacity">0 / 3</small></div><div id="island-player-list" class="island-player-list"></div><div class="island-lobby-controls"><button id="island-ready" class="btn island-ready-toggle">✓ MARCAR COMO PRONTO</button><button id="island-start" class="btn big" ${role==='host'?'':'hidden'}>AGUARDANDO TRIO</button><button id="island-copy" class="btn" hidden>COPIAR CÓDIGO</button></div></section></div><div class="island-foot"><span>3 JOGADORES · 15 VITÓRIAS · 3 DERROTAS = FORA</span><button id="island-lobby-back" class="btn">← SAIR</button></div></main>`;
  document.getElementById('island-lobby-back').onclick=()=>{closeNetwork();openDuoEvent()};document.getElementById('island-ready').onclick=toggleReady;document.querySelectorAll('.island-lobby-fighter').forEach(b=>b.onclick=()=>selectLobbyCharacter(b.dataset.char));updateLobbyCharacterUI();if(role==='guest'){document.getElementById('island-connect').onclick=connectGuest;document.getElementById('island-room-input').addEventListener('keydown',e=>{if(e.key==='Enter')connectGuest()})}if(role==='host')createHost();
}
function renderExistingDuoEventLobby(message='✓ Próxima partida liberada. O trio deve escolher os lutadores e marcar PRONTO.'){
  if(!net)return openDuoEvent();lobbyContext='duo';selectedFormat='duo';screen='island-duo-lobby';drawCanvas?.();const st=duoEventState(),role=net.role,roster=allCharacters(),me=net.players?.find(p=>p.id===(net.localId||'host'));if(me?.charId)selectedChar=me.charId;if(!roster.some(c=>c.id===selectedChar))selectedChar=roster[0]?.id||'rojo';
  app.innerHTML=`<main class="card island-shell duo-event-shell"><div class="island-kicker">TORNEIO EM TRIO · SALA PRESERVADA</div><h1 class="island-title">PRÓXIMA <span>BATALHA</span></h1>${duoEventProgressHtml(st)}<p class="island-sub">${esc(message)} O código continua <b>${esc(net.room||'')}</b>.</p><div class="island-lobby"><section class="island-panel"><h3>ESCOLHA DE PERSONAGEM</h3><div id="island-connect-panel"><input id="island-room-code" class="island-room-code" readonly value="${esc(net.room||'')}"></div><div id="island-net-status" class="island-lobby-status">✓ Conexão do trio mantida.</div><div class="island-lobby-pick-head"><b>1 · SEU LUTADOR</b><span id="island-lobby-char-name">${esc(charById(selectedChar).name||selectedChar)}</span></div><div id="island-lobby-roster" class="island-lobby-roster">${roster.map(c=>`<button class="island-lobby-fighter ${c.id===selectedChar?'active':''}" data-char="${esc(c.id)}" style="--fc:${c.color||'#67e8f9'}">${portraitOf(c)?`<img src="${esc(portraitOf(c))}" alt="">`:`<span>${esc((c.name||c.id).slice(0,2).toUpperCase())}</span>`}<b>${esc(c.name||c.id)}</b></button>`).join('')}</div></section><section class="island-panel"><div class="island-roster-head"><h3 id="island-lobby-title">TORNEIO EM TRIO</h3><small id="island-capacity">${net.players?.length||0} / 3</small></div><div id="island-player-list" class="island-player-list"></div><div class="island-lobby-controls"><button id="island-ready" class="btn island-ready-toggle">✓ MARCAR COMO PRONTO</button><button id="island-start" class="btn big" ${role==='host'?'':'hidden'}>AGUARDANDO TRIO</button><button id="island-copy" class="btn">COPIAR CÓDIGO</button></div></section></div><div class="island-foot"><span>${st.wins>=14?'PRÓXIMO: EQUIPE ZTAAA · FINAL':'PRÓXIMO: CONFRONTO '+(st.wins+1)+'/15'}</span><button id="island-lobby-back" class="btn">← SAIR DO TORNEIO</button></div></main>`;
  document.getElementById('island-lobby-back').onclick=()=>{closeNetwork();openDuoEvent()};document.getElementById('island-ready').onclick=toggleReady;document.querySelectorAll('.island-lobby-fighter').forEach(b=>b.onclick=()=>selectLobbyCharacter(b.dataset.char));document.getElementById('island-copy').onclick=()=>copyRoom(net.room);const start=document.getElementById('island-start');if(start&&role==='host')start.onclick=hostStart;updateLobbyCharacterUI();renderLobbyState(net.players||[]);
}
function duoEventOpponentPool(){
  const out=[],seen=new Set(),add=c=>{if(!c?.id||c.id==='ztaaa'||seen.has(c.id))return;if(['ktrak','laranja','jone'].includes(c.id)&&window.primeCharacterVisible&&!primeCharacterVisible(c))return;seen.add(c.id);out.push(c)};try{for(const c of CHARACTERS||[])add(c)}catch(_){}try{for(const c of allCharacters())add(c)}catch(_){}return out.length?out:[charById('rojo')]
}
function hostStartDuoEvent(){
  if(net?.role!=='host'||net.mode!=='duo')return;const st=duoEventState();if(st.eliminated||st.completed)return openDuoEvent();if(net.players.length!==3||!net.players.every(p=>p.ready)){netStatus('São necessários os 3 jogadores PRONTOS.');return}
  const humans=net.players.map((p,i)=>({...p,slot:i,team:0,bot:false,ready:true}));let desc,boss=st.wins>=14;const pool=duoEventOpponentPool();
  const rivals=boss?[charById('ztaaa'),pool[(st.wins*3+1)%pool.length],pool[(st.wins*3+2)%pool.length]]:[pool[(st.wins*3)%pool.length],pool[(st.wins*3+1)%pool.length],pool[(st.wins*3+2)%pool.length]];
  desc=[...humans,...rivals.map((c,i)=>({id:`event-bot-${i}`,slot:3+i,name:i===0&&boss?'ZTAAA · CHEFE FINAL':`${c.name||'RIVAL'} · ELITE`,charId:c.id,team:1,ready:true,bot:true,boss:true,eventElite:true}))];
  const ev={wins:st.wins,losses:st.losses,boss,match:st.wins+1};broadcast({type:'start',mode:'3v3',players:desc,event:ev});startGameFromDescriptors(desc,'3v3',{authoritative:true,online:true,event:ev});
}
function showDuoEventConclusion(kind){
  stopGame(false);screen='island-duo-event-result';drawCanvas?.();const st=duoEventState(),complete=kind==='complete';app.innerHTML=`<main class="card island-shell duo-event-shell duo-event-final ${complete?'complete':'out'}"><div class="island-kicker">TORNEIO EM TRIO</div><h1 class="island-title">${complete?'TRIO <span>CAMPEÃO</span>':'TRIO <span>ELIMINADO</span>'}</h1>${duoEventProgressHtml(st)}<p class="island-sub">${complete?'Vocês venceram as 15 partidas. A premiação foi entregue aos três jogadores.':'O trio chegou a 3 derrotas. Este torneio não pode mais ser jogado nesta instalação.'}</p>${complete?'<div class="duo-event-rewards"><b>🪙 12.000 GOLD</b><b>💠 70 PSY</b><b>🟪 1.000 VANDAIS</b></div>':''}<div class="island-actions"><button id="duo-final-modes" class="btn big">⚔️ VOLTAR AOS MODOS</button></div></main>`;document.getElementById('duo-final-modes').onclick=()=>{closeNetwork();lobbyContext='arena-total';selectedFormat='ffa';renderModes()};
}
function handleDuoEventResult(){
  if(!game?.duoEvent||net?.role!=='host')return;const won=Number(game.winner)===0,st=duoEventState();if(won)st.wins=clamp(st.wins+1,0,15);else st.losses=clamp(st.losses+1,0,3);if(st.wins>=15)st.completed=true;if(st.losses>=3&&!st.completed)st.eliminated=true;try{persist()}catch(_){}
  if(st.completed){const token=`duo-v228-${net.room||'room'}-complete`;grantDuoEventReward(token);broadcast({type:'event-complete',state:{...st},token,reward:DUO_EVENT_REWARD});setTimeout(()=>showDuoEventConclusion('complete'),700);return}
  if(st.eliminated){broadcast({type:'event-eliminated',state:{...st}});setTimeout(()=>showDuoEventConclusion('out'),700);return}
  resetRoomReady();const packet={type:'event-room-return',room:net.room,players:(net.players||[]).map(p=>({...p,team:0,ready:false})),state:{...st}};broadcast(packet);setTimeout(()=>{stopGame(false);renderExistingDuoEventLobby(won?'✓ Vitória registrada. Próxima batalha disponível.':'⚠ Derrota registrada. Ainda resta uma chance.');broadcastLobby()},700);
}
function openSetup(){
  stopGame(false);closeNetwork();arenaTotalActive=true;lobbyContext='arena-total';if(selectedFormat==='duo')selectedFormat='ffa';charCache=null;screen='island-select';drawCanvas?.();
  const roster=allCharacters();if(!roster.some(c=>c.id===selectedChar))selectedChar=roster[0]?.id||'rojo';
  app.innerHTML=`<main class="card island-shell arena-total-shell"><div class="island-kicker">ARENA TOTAL · P2P · V${VERSION}</div><h1 class="island-title">ARENA <span>TOTAL</span></h1><p class="island-sub">Todos contra todos de 2 a 8 jogadores ou equipes 2×2, 3×3 e 4×4. Escolha as regras, seu campeão e jogue com os mesmos golpes, poderes, supers e animações.</p><div class="island-setup-grid"><section class="island-panel"><h3>1 · FORMATO DA BATALHA</h3><div class="island-format-grid">${Object.values(FORMAT).filter(f=>f.id!=='duo').map(f=>`<button class="island-format ${f.id===selectedFormat?'active':''}" data-format="${f.id}"><b>${f.short}</b>${f.name}</button>`).join('')}</div><div class="island-rules"><div class="island-rule"><i>💀</i><span><strong>Vidas configuráveis</strong><br>Quanto maior o dano, maior o lançamento.</span></div><div class="island-rule"><i>🌉</i><span><strong>Pontes opcionais</strong><br>Quebram e se reconstroem ou permanecem fixas.</span></div><div class="island-rule"><i>↓</i><span><strong>Ataque aéreo</strong><br>I ou O no ar mergulha para baixo.</span></div><div class="island-rule"><i>⚡</i><span><strong>Controles diretos</strong><br>J poder · K defesa · L super · H alterna poder.</span></div></div></section><section class="island-panel"><div class="island-roster-head"><h3>2 · ESCOLHA SEU CAMPEÃO</h3><small>${roster.length} DISPONÍVEIS</small></div><div class="island-roster">${roster.map(c=>`<button class="island-fighter ${c.id===selectedChar?'active':''}" data-char="${esc(c.id)}" style="--fc:${c.color||'#67e8f9'}">${portraitOf(c)?`<img src="${esc(portraitOf(c))}" alt="">`:`<span class="island-face">${esc((c.name||c.id).slice(0,2).toUpperCase())}</span>`}<b>${esc(c.name||c.id)}</b><small>${esc(c.ravamOnly?'R.A.V.A.M':(['ktrak','laranja','jone'].includes(c.id)?'PRIME':'CAMPEÃO'))}</small></button>`).join('')}</div><div id="island-selected"></div></section></div><div class="island-actions arena-total-actions"><button id="island-host" class="btn big island-online-btn">🌐 CRIAR SALA P2P</button><button id="island-join" class="btn big island-online-btn">🔗 ENTRAR POR CÓDIGO</button></div><div class="island-foot"><span>A/D mover · W pulo 2× · I soco · O chute · J poder · K defesa · L super · H alternar</span><button id="island-back" class="btn">← MODOS</button></div></main>`;
  document.querySelectorAll('.island-format').forEach(b=>b.onclick=()=>{selectedFormat=b.dataset.format;document.querySelectorAll('.island-format').forEach(x=>x.classList.toggle('active',x===b));playSfx('menu_select')});
  document.querySelectorAll('.island-fighter').forEach(b=>b.onclick=()=>{selectedChar=b.dataset.char;document.querySelectorAll('.island-fighter').forEach(x=>x.classList.toggle('active',x===b));updateSelected();playSfx('menu_select')});
  document.getElementById('island-host').onclick=()=>openLobby('host');document.getElementById('island-join').onclick=()=>openLobby('guest');document.getElementById('island-back').onclick=()=>renderModes();updateSelected();
  const grid=app.querySelector('.island-setup-grid');if(grid){grid.insertAdjacentHTML('afterend',`<section class="island-panel arena-rules-panel"><h3>3 · REGRAS DO ANFITRIÃO</h3><div class="arena-rules-grid"><label>VAGAS NO LIVRE-PARA-TODOS<select data-rule="capacity">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${selectedRules.capacity===n?'selected':''}>${n} jogadores</option>`).join('')}</select></label><label>VIDAS POR LUTADOR<select data-rule="stocks">${[1,3,5].map(n=>`<option value="${n}" ${selectedRules.stocks===n?'selected':''}>${n} ${n===1?'vida':'vidas'}</option>`).join('')}</select></label><label>TEMPO DA PARTIDA<select data-rule="minutes">${[3,5,8,0].map(n=>`<option value="${n}" ${selectedRules.minutes===n?'selected':''}>${n?n+' minutos':'sem limite'}</option>`).join('')}</select></label><label>VISUAL DA ARENA<select data-rule="theme">${['random','aurora','tempestade','crepusculo'].map(n=>`<option value="${n}" ${selectedRules.theme===n?'selected':''}>${{random:'surpresa',aurora:'aurora',tempestade:'tempestade',crepusculo:'crepúsculo'}[n]}</option>`).join('')}</select></label><label class="arena-rule-check"><input type="checkbox" data-rule="items" ${selectedRules.items?'checked':''}> ITENS NA ARENA</label><label class="arena-rule-check"><input type="checkbox" data-rule="bridges" ${selectedRules.bridges?'checked':''}> PONTES QUEBRÁVEIS</label></div><p id="arena-rule-preview" class="arena-rule-preview"></p></section>`);const update=()=>{for(const e of grid.parentElement.querySelectorAll('[data-rule]'))selectedRules[e.dataset.rule]=e.type==='checkbox'?e.checked:e.dataset.rule==='theme'?e.value:Number(e.value);selectedRules=normalizeRules(selectedRules);const preview=document.getElementById('arena-rule-preview');if(preview)preview.textContent=rulesSummary(selectedRules);const cap=grid.parentElement.querySelector('[data-rule="capacity"]');if(cap)cap.disabled=selectedFormat!=='ffa'};grid.parentElement.querySelectorAll('[data-rule]').forEach(e=>e.addEventListener('change',update));grid.parentElement.querySelectorAll('.island-format').forEach(e=>e.addEventListener('click',update));update()}
}
function updateSelected(){const c=charById(selectedChar),p=profileOf(c.id),el=document.getElementById('island-selected');if(!el)return;el.innerHTML=`<div class="island-selected" style="--sel:${c.color||p[2]}">${portraitOf(c)?`<img src="${esc(portraitOf(c))}" alt="">`:`<span class="island-face">${esc(c.name?.slice(0,2)||'??')}</span>`}<div><strong>${esc(c.name||c.id)}</strong><span>${esc(roleOf(c))}<br><em>J · ${esc(p[0])}</em></span></div></div>`}
function decorateArenaTotalLobby(){if(!arenaTotalActive)return;const shell=app.querySelector('.island-shell');shell?.classList.add('arena-total-shell');const kicker=shell?.querySelector('.island-kicker'),title=shell?.querySelector('.island-title'),sub=shell?.querySelector('.island-sub'),code=document.getElementById('island-room-input');if(kicker)kicker.textContent='ARENA TOTAL · P2P 2 A 8';if(title)title.innerHTML='ARENA <span>TOTAL</span>';if(sub)sub.textContent='O anfitrião escolhe o formato. Selecione seu campeão e marque PRONTO; nas equipes, escolha também seu time. A sala fica aberta para revanche.';if(code)code.placeholder='ARENA-ABC123'}

function openLobby(role){
  closeNetwork();screen='island-lobby';drawCanvas?.();
  const roster=allCharacters();if(!roster.some(c=>c.id===selectedChar))selectedChar=roster[0]?.id||'rojo';
  app.innerHTML=`<main class="card island-shell arena-total-shell"><div class="island-kicker">ARENA TOTAL · REDE WEBRTC · V${VERSION}</div><h1 class="island-title">ARENA <span>TOTAL</span></h1><p class="island-sub">Escolha seu campeão, confira as regras da sala e marque PRONTO. Nas equipes, você também pode trocar de time.</p><div class="island-lobby"><section class="island-panel"><h3>${role==='host'?'CRIAR SALA':'ENTRAR NA SALA'}</h3><div id="island-connect-panel">${role==='host'?`<p style="color:#91a4ba;font:700 11px Oxanium">Preparando a sala para até ${roomCapacity()} jogadores…</p>`:`<input id="island-room-input" class="island-room-code" maxlength="12" placeholder="ARENA-ABC123"><button id="island-connect" class="btn big island-online-btn" style="width:100%;margin-top:10px">CONECTAR</button>`}</div><div id="island-net-status" class="island-lobby-status">${role==='host'?'Carregando rede online…':'Digite o código da sala.'}</div><div class="island-net-note">Conexão P2P/WebRTC. O formato e as regras escolhidos pelo anfitrião valem para todos.</div><div class="island-lobby-pick-head"><b>1 · ESCOLHA SEU PERSONAGEM</b><span id="island-lobby-char-name">${esc(charById(selectedChar).name||selectedChar)}</span></div><div id="island-lobby-roster" class="island-lobby-roster">${roster.map(c=>`<button class="island-lobby-fighter ${c.id===selectedChar?'active':''}" data-char="${esc(c.id)}" style="--fc:${c.color||'#67e8f9'}">${portraitOf(c)?`<img src="${esc(portraitOf(c))}" alt="">`:`<span>${esc((c.name||c.id).slice(0,2).toUpperCase())}</span>`}<b>${esc(c.name||c.id)}</b></button>`).join('')}</div><div class="island-lobby-ready-note">2 · Depois de escolher, marque <b>PRONTO</b>.</div></section><section class="island-panel"><div class="island-roster-head"><h3 id="island-lobby-title">${fmtName(selectedFormat)}</h3><small id="island-capacity">0 / ${roomCapacity()}</small></div><div id="island-player-list" class="island-player-list"><div class="island-player-row island-empty-slot"><span class="dot"></span><b>AGUARDANDO REDE…</b><em>—</em></div></div><div class="island-lobby-controls"><button id="island-ready" class="btn island-ready-toggle">✓ PRONTO</button><button id="island-start" class="btn big" hidden>⚔️ INICIAR BATALHA</button><button id="island-copy" class="btn" hidden>COPIAR CÓDIGO</button></div></section></div><div class="island-foot"><span id="island-lobby-help">PERSONAGEM → TIME (SE HOUVER) → PRONTO → BATALHA</span><button id="island-lobby-back" class="btn">← VOLTAR</button></div></main>`;
  decorateArenaTotalLobby();
  document.getElementById('island-lobby-back').onclick=openSetup;document.getElementById('island-ready').onclick=toggleReady;
  document.querySelectorAll('.island-lobby-fighter').forEach(b=>b.onclick=()=>selectLobbyCharacter(b.dataset.char));
  updateLobbyCharacterUI();
  if(role==='guest'){document.getElementById('island-connect').onclick=connectGuest;document.getElementById('island-room-input').addEventListener('keydown',e=>{if(e.key==='Enter')connectGuest()})}
  if(role==='host')createHost();
}
function renderExistingLobby(message='✓ Sala mantida. Escolha o personagem e marque PRONTO novamente.'){
  if(!net)return openSetup();
  screen='island-lobby';drawCanvas?.();
  const role=net.role,roster=allCharacters(),me=net.players?.find(p=>p.id===(net.localId||'host'));
  if(me?.charId)selectedChar=me.charId;
  if(net.mode)selectedFormat=net.mode;
  if(!roster.some(c=>c.id===selectedChar))selectedChar=roster[0]?.id||'rojo';
  const room=net.room||'';
  app.innerHTML=`<main class="card island-shell"><div class="island-kicker">REDE WEBRTC · V${VERSION}</div><h1 class="island-title">SALA <span>P2P</span></h1><p class="island-sub">A partida terminou, mas a sala continua aberta. Escolha seu personagem e marque PRONTO para jogar novamente.</p><div class="island-lobby"><section class="island-panel"><h3>${role==='host'?'SALA MANTIDA':'CONECTADO À SALA'}</h3><div id="island-connect-panel"><input id="island-room-code" class="island-room-code" readonly value="${esc(room)}"><p style="color:#91a4ba;font:700 10px/1.5 Oxanium">Mesmo código da partida anterior. Não é necessário reconectar.</p></div><div id="island-net-status" class="island-lobby-status">${esc(message)}</div><div class="island-net-note">A conexão P2P permanece ativa entre as partidas.</div><div class="island-lobby-pick-head"><b>1 · ESCOLHA SEU PERSONAGEM</b><span id="island-lobby-char-name">${esc(charById(selectedChar).name||selectedChar)}</span></div><div id="island-lobby-roster" class="island-lobby-roster">${roster.map(c=>`<button class="island-lobby-fighter ${c.id===selectedChar?'active':''}" data-char="${esc(c.id)}" style="--fc:${c.color||'#67e8f9'}">${portraitOf(c)?`<img src="${esc(portraitOf(c))}" alt="">`:`<span>${esc((c.name||c.id).slice(0,2).toUpperCase())}</span>`}<b>${esc(c.name||c.id)}</b></button>`).join('')}</div><div class="island-lobby-ready-note">2 · Depois de escolher, marque <b>PRONTO</b>.</div></section><section class="island-panel"><div class="island-roster-head"><h3 id="island-lobby-title">${fmtName(selectedFormat)}</h3><small id="island-capacity">${net.players?.length||0} / ${FORMAT[selectedFormat].max}</small></div><div id="island-player-list" class="island-player-list"></div><div class="island-lobby-controls"><button id="island-ready" class="btn island-ready-toggle">✓ MARCAR COMO PRONTO</button><button id="island-start" class="btn big" ${role==='host'?'':'hidden'}>AGUARDANDO JOGADORES</button><button id="island-copy" class="btn">COPIAR CÓDIGO</button></div></section></div><div class="island-foot"><span id="island-lobby-help">MESMO CÓDIGO · ESCOLHA → PRONTO → REVANCHE</span><button id="island-lobby-back" class="btn">← SAIR DA SALA</button></div></main>`;
  decorateArenaTotalLobby();
  document.getElementById('island-lobby-back').onclick=()=>{closeNetwork();openSetup()};
  document.getElementById('island-ready').onclick=toggleReady;
  document.querySelectorAll('.island-lobby-fighter').forEach(b=>b.onclick=()=>selectLobbyCharacter(b.dataset.char));
  const copy=document.getElementById('island-copy');if(copy)copy.onclick=()=>copyRoom(room);
  const start=document.getElementById('island-start');if(start&&role==='host')start.onclick=hostStart;
  updateLobbyCharacterUI();renderLobbyState(net.players||[]);
}
function resetRoomReady(){
  if(!net)return;
  net.ready=false;
  for(const p of net.players||[])p.ready=false;
}
function returnOnlineMatchToRoom(immediate=false){
  if(!net)return openSetup();
  const role=net.role;
  if(role==='host'){
    resetRoomReady();
    const packet={type:'room-return',mode:net.mode,room:net.room,players:(net.players||[]).map(p=>({...p}))};
    broadcast(packet);
    stopGame(false);
    renderExistingLobby(immediate?'✓ Voltamos para a mesma sala.':'✓ Partida encerrada. Sala preservada para a revanche.');
    broadcastLobby();
  }else if(role==='guest'){
    stopGame(false);
    renderExistingLobby('✓ Partida encerrada. Você continua na mesma sala.');
  }
}
function updateLobbyCharacterUI(){
  const c=charById(selectedChar),name=document.getElementById('island-lobby-char-name');if(name)name.textContent=c.name||selectedChar;
  document.querySelectorAll('.island-lobby-fighter').forEach(b=>b.classList.toggle('active',b.dataset.char===selectedChar));
}
function selectLobbyCharacter(id){
  const roster=allCharacters();if(!roster.some(c=>c.id===id))return;
  selectedChar=id;updateLobbyCharacterUI();playSfx('menu_select');
  if(!net)return;
  net.ready=false;
  if(net.role==='host'){
    const me=net.players.find(p=>p.id==='host');if(me){me.charId=id;me.ready=false}broadcastLobby();
  }else if(net.role==='guest'&&net.conn?.open){
    try{net.conn.send({type:'char',charId:id})}catch(_){}
    const me=net.players.find(p=>p.id===net.localId);if(me){me.charId=id;me.ready=false}renderLobbyState(net.players);
  }
}
function netStatus(text,good=false){const e=document.getElementById('island-net-status');if(e){e.textContent=text;e.style.color=good?'#67e8f9':'#facc15'}}
function peerOptions(){return window.LutadorOnlineV16?.peerOptions||{debug:0,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]}}}
function ensurePeer(done){if(typeof Peer!=='undefined')return done();if(window.LutadorOnlineV16?.ensurePeerReady)return window.LutadorOnlineV16.ensurePeerReady(done);netStatus('✕ Módulo P2P indisponível. Recarregue o jogo.')}
function roomCode(){return(lobbyContext==='duo'?'TRIO-':'ARENA-')+Math.random().toString(36).slice(2,8).toUpperCase()}
function basePlayer(id,slot,name,charId,ready=false){return{id,slot,name:String(name||'JOGADOR').slice(0,18),charId:charById(charId).id,ready,team:selectedFormat==='duo'?0:(selectedFormat==='ffa'?slot:slot%2),ping:0}}
function closeNetwork(){if(!net)return;try{net.connections?.forEach(v=>{try{v.fast?.close()}catch(_){} try{v.conn?.close()}catch(_){}})}catch(_){ }try{net.fast?.close()}catch(_){ }try{net.conn?.close()}catch(_){ }try{net.peer?.destroy()}catch(_){ }net=null;lastLobby=null}
function createHost(){ensurePeer(()=>{
  closeNetwork();const code=roomCode(),peer=new Peer(code,peerOptions());net={role:'host',peer,room:code,connections:new Map(),players:[basePlayer('host',0,playerName(),selectedChar,false)],localId:'host',ready:false,mode:selectedFormat,context:lobbyContext,rules:normalizeRules(selectedRules),eventState:lobbyContext==='duo'?{...duoEventState()}:null};
  peer.on('open',()=>{const p=document.getElementById('island-connect-panel');if(p)p.innerHTML=`<input id="island-room-code" class="island-room-code" readonly value="${code}"><p style="color:#91a4ba;font:700 10px/1.5 Oxanium">Envie este código aos jogadores. A sala comporta ${roomCapacity(net.mode,net.rules)} participantes.</p>`;const copy=document.getElementById('island-copy');if(copy){copy.hidden=false;copy.onclick=()=>copyRoom(code)}const start=document.getElementById('island-start');if(start){start.hidden=false;start.onclick=hostStart}netStatus('✓ Sala criada. Aguardando jogadores…',true);renderLobbyState(net.players)});
  peer.on('connection',conn=>bindHostConnection(conn));peer.on('error',e=>{console.warn('Island host',e);netStatus('✕ Falha ao criar/usar a sala. Tente outro código.')});peer.on('disconnected',()=>{try{peer.reconnect()}catch(_){}});
})}
function copyRoom(code){const task=navigator.clipboard?.writeText?.(code);if(!task){netStatus('Código: '+code,true);return}task.then(()=>netStatus('✓ Código copiado.',true)).catch(()=>netStatus('Código: '+code,true))}
function handleHostRealtime(entry,msg){
  if(!net||net.role!=='host'||!entry?.playerId||!msg||typeof msg!=='object')return;
  entry.lastSeen=performance.now();
  if((msg.type==='i'||msg.type==='input')&&game?.authoritative){const a=game.actors.find(x=>x.playerId===entry.playerId);if(a){a.netInput=msg.type==='i'?unpackInputBits(msg.m):sanitizeInput(msg.input);if(['down','up','air'].includes(msg.v)){a.netVariant=msg.v;a.netVariantAt=performance.now()}}return}
  if(msg.type==='action'&&game?.authoritative&&['jump','punch','kick','hook','power','super','extra','dodge','extra1','extra2'].includes(msg.action)){const a=game.actors.find(x=>x.playerId===entry.playerId);if(a){if(msg.action==='extra'){a.pendingExtra=true;return}if(msg.action==='power'){a.pendingPower=true;if(['down','up','air'].includes(msg.variant)){a.netVariant=msg.variant;a.netVariantAt=performance.now()}}a.netInput[msg.action]=true;a.edgeTimers=a.edgeTimers||{};clearTimeout(a.edgeTimers[msg.action]);a.edgeTimers[msg.action]=setTimeout(()=>{if(a?.netInput)a.netInput[msg.action]=false},82)}return}
  if(msg.type==='ping'){try{(entry.fast?.open?entry.fast:entry.conn)?.send({type:'pong',t:msg.t})}catch(_){}return}
}
function openFastStateChannel(entry){
  if(!net?.peer||!entry?.conn?.peer||entry.fast)return;
  try{
    const fast=net.peer.connect(entry.conn.peer,{reliable:false,serialization:'json',metadata:{islandFast:true,version:VERSION,playerId:entry.playerId}});
    entry.fast=fast;
    fast.on('open',()=>{entry.fastReady=true;try{fast.send({type:'fast-ready',version:VERSION})}catch(_){}});
    fast.on('data',msg=>handleHostRealtime(entry,msg));
    fast.on('close',()=>{entry.fastReady=false;entry.fast=null});
    fast.on('error',()=>{entry.fastReady=false;entry.fast=null});
  }catch(_){entry.fast=null;entry.fastReady=false}
}
function queueSnapshot(s){
  if(!s||!net||net.role!=='guest')return;
  const cur=net.pendingState;
  if(!cur||!s.n||!cur.n||s.n>cur.n)net.pendingState=s;
}
function consumePendingSnapshot(){if(net?.role==='guest'&&net.pendingState){const s=net.pendingState;net.pendingState=null;applySnapshot(s)}}
function bindGuestFastConnection(conn){
  if(!net||net.role!=='guest')return;
  net.fast=conn;
  conn.on('open',()=>{net.fast=conn;net.fastReady=true});
  conn.on('data',msg=>{if(!msg||typeof msg!=='object')return;if(msg.type==='s'||msg.type==='state'){queueSnapshot(msg.state);return}if(msg.type==='pong'){net.ping=Math.max(0,performance.now()-Number(msg.t||performance.now()))}});
  const lost=()=>{if(net?.fast===conn){net.fast=null;net.fastReady=false}};conn.on('close',lost);conn.on('error',lost);
}
function bindHostConnection(conn){
  const entry={conn,playerId:null,lastSeen:performance.now()};
  conn.on('open',()=>netStatus('Novo jogador conectado. Confirmando versão…'));
  conn.on('data',msg=>{if(!net||net.role!=='host'||!msg||typeof msg!=='object')return;entry.lastSeen=performance.now();
    if(msg.type==='hello'){
      if(msg.version!==VERSION){conn.send({type:'error',message:'Versão incompatível. Use V'+VERSION});conn.close();return}
      if(net.context==='duo'&&(msg.eventState?.eliminated||msg.eventState?.completed)){conn.send({type:'error',message:msg.eventState?.eliminated?'Este jogador já foi eliminado do Evento em Duplas.':'Este jogador já concluiu o Evento em Duplas.'});conn.close();return}if(game?.online){conn.send({type:'error',message:'Partida em andamento. Entre na próxima revanche.'});conn.close();return}const cap=roomCapacity(net.mode,net.rules);if(net.players.length>=cap){conn.send({type:'error',message:'A sala já está cheia.'});conn.close();return}
      const id='p'+Math.random().toString(36).slice(2,8),slot=net.players.length,p=basePlayer(id,slot,msg.name,msg.charId,false);if(net.mode!=='ffa'&&net.mode!=='duo'){const counts=[0,1].map(t=>net.players.filter(x=>x.team===t).length);p.team=counts[0]<=counts[1]?0:1}entry.playerId=id;net.connections.set(id,entry);net.players.push(p);conn.send({type:'welcome',id,mode:net.mode,version:VERSION,host:playerName(),context:net.context,rules:net.rules,eventState:net.context==='duo'?{...duoEventState()}:null});setTimeout(()=>openFastStateChannel(entry),80);broadcastLobby();netStatus(`✓ ${p.name} entrou na sala.`,true);return;
    }
    if(msg.type==='char'&&entry.playerId){const p=net.players.find(x=>x.id===entry.playerId);let c=null;try{c=(CHARACTERS||[]).find(x=>x.id===msg.charId)||Array.from(window.RavamStudios?.allCharacters||window.RavamStudios?.characters||[]).find(x=>x.id===msg.charId)}catch(_){}if(p&&c?.id){p.charId=c.id;p.ready=false}broadcastLobby();return}
    if(msg.type==='ready'&&entry.playerId){const p=net.players.find(x=>x.id===entry.playerId);if(p)p.ready=!!msg.value;broadcastLobby();return}
    if(msg.type==='team'&&entry.playerId){changeTeam(entry.playerId);return}
    if(['i','input','action','ping'].includes(msg.type)){handleHostRealtime(entry,msg);return}
  });
  const leave=()=>{try{entry.fast?.close()}catch(_){} if(!net||net.role!=='host'||!entry.playerId)return;const p=net.players.find(x=>x.id===entry.playerId);net.connections.delete(entry.playerId);net.players=net.players.filter(x=>x.id!==entry.playerId);net.players.forEach((x,i)=>{x.slot=i;if(net.mode==='duo')x.team=0;else if(net.mode==='ffa')x.team=i});if(game?.authoritative){const a=game.actors.find(x=>x.playerId===entry.playerId);if(a){a.stocks=0;a.eliminated=true}}broadcastLobby();netStatus(`⚠ ${p?.name||'Jogador'} saiu.`)};
  conn.on('close',leave);conn.on('error',leave);
}
function broadcast(msg){if(net?.role!=='host')return;for(const {conn} of net.connections.values())if(conn.open)try{conn.send(msg)}catch(_){}}
function lobbyPacket(){return{type:'lobby',mode:net.mode,room:net.room,context:net.context||lobbyContext,rules:net.rules,eventState:net.mode==='duo'?{...duoEventState()}:null,players:net.players.map(p=>({...p}))}}
function broadcastLobby(){if(net?.role!=='host')return;const msg=lobbyPacket();broadcast(msg);renderLobbyState(msg.players)}
function connectGuest(){
  const code=String(document.getElementById('island-room-input')?.value||'').trim().toUpperCase();if(!/^(TRIO|ARENA)-[A-Z0-9]{6}$/.test(code)){netStatus('✕ Código inválido. Ex.: ARENA-ABC123');return}lobbyContext=code.startsWith('TRIO-')?'duo':'arena-total';arenaTotalActive=lobbyContext==='arena-total';if(lobbyContext==='duo')selectedFormat='duo';
  ensurePeer(()=>{closeNetwork();const peer=new Peer(undefined,peerOptions());net={role:'guest',peer,conn:null,fast:null,fastReady:false,pendingState:null,room:code,localId:null,ready:false,players:[],mode:null,lastSend:0,ping:0,context:lobbyContext};netStatus('Conectando ao HOST…');
    peer.on('connection',incoming=>{if(incoming?.metadata?.islandFast)bindGuestFastConnection(incoming)});
    peer.on('open',()=>{const conn=peer.connect(code,{reliable:true,serialization:'json'});net.conn=conn;bindGuestConnection(conn)});peer.on('error',e=>{console.warn('Island guest',e);netStatus('✕ Sala não encontrada ou conexão bloqueada.')});peer.on('disconnected',()=>{try{peer.reconnect()}catch(_){}});
  })
}
function bindGuestConnection(conn){
  conn.on('open',()=>{conn.send({type:'hello',version:VERSION,name:playerName(),charId:selectedChar,context:lobbyContext,eventState:lobbyContext==='duo'?{...duoEventState()}:null});netStatus('✓ Conectado. Entrando no lobby…',true)});
  conn.on('data',msg=>{if(!net||net.role!=='guest'||!msg||typeof msg!=='object')return;
    if(msg.type==='error'){netStatus('✕ '+msg.message);return}
    if(msg.type==='welcome'){net.localId=msg.id;net.mode=msg.mode;net.context=msg.context||net.context;net.rules=normalizeRules(msg.rules);lobbyContext=net.context==='duo'?'duo':'arena-total';arenaTotalActive=lobbyContext==='arena-total';selectedFormat=msg.mode;if(msg.eventState)syncDuoEventState(msg.eventState);decorateArenaTotalLobby();netStatus(`✓ Conectado ao HOST ${msg.host}.`,true);return}
    if(msg.type==='lobby'){net.players=msg.players||[];net.mode=msg.mode;net.context=msg.context||net.context;net.rules=normalizeRules(msg.rules);if(msg.eventState)syncDuoEventState(msg.eventState);lastLobby=msg;renderLobbyState(net.players);return}
    if(msg.type==='start'){net.rules=normalizeRules(msg.rules);startGameFromDescriptors(msg.players,msg.mode,{authoritative:false,online:true,event:msg.event||null,variant:msg.variant||'aurora',rules:net.rules});return}
    if(msg.type==='state'||msg.type==='s'){queueSnapshot(msg.state);return}
    if(msg.type==='pong'){net.ping=Math.max(0,performance.now()-Number(msg.t||performance.now()));return}
    if(msg.type==='room-return'){net.mode=msg.mode||net.mode;net.room=msg.room||net.room;net.players=(msg.players||net.players||[]).map(p=>({...p,ready:false}));net.ready=false;returnOnlineMatchToRoom();return}
    if(msg.type==='event-room-return'){syncDuoEventState(msg.state);net.mode='duo';net.context='duo';lobbyContext='duo';selectedFormat='duo';net.room=msg.room||net.room;net.players=(msg.players||net.players||[]).map(p=>({...p,team:0,ready:false}));net.ready=false;stopGame(false);renderExistingDuoEventLobby('✓ A dupla continua conectada. Próxima batalha liberada.');return}
    if(msg.type==='event-complete'){syncDuoEventState(msg.state);grantDuoEventReward(msg.token);setTimeout(()=>showDuoEventConclusion('complete'),650);return}
    if(msg.type==='event-eliminated'){syncDuoEventState(msg.state);setTimeout(()=>showDuoEventConclusion('out'),650);return}
    if(msg.type==='event-progress'){syncDuoEventState(msg.state);return}
    if(msg.type==='return'){stopGame(false);closeNetwork();if(lobbyContext==='duo')openDuoEvent();else openSetup();toast('O HOST encerrou a sala.');return}
  });
  conn.on('close',()=>{if(net?.role==='guest'&&net.conn===conn&&screen==='island-play'&&arenaTotalActive){stopGame(false);closeNetwork();openSetup();toast('O anfitrião saiu. A partida foi encerrada.');return}netStatus('⚠ Conexão encerrada pelo HOST.')});conn.on('error',()=>netStatus('✕ Erro na conexão P2P.'));
}
function renderLobbyState(players){
  if(!['island-lobby','island-duo-lobby'].includes(screen))return;const mode=net?.mode||selectedFormat,f=FORMAT[mode],max=roomCapacity(mode,net?.rules),list=document.getElementById('island-player-list'),cap=document.getElementById('island-capacity'),title=document.getElementById('island-lobby-title');if(title)title.textContent=f.name;if(cap)cap.textContent=`${players.length} / ${max}`;
  if(list){const rows=[];for(let i=0;i<max;i++){const p=players[i];if(p){const c=charById(p.charId),tc=TEAM_COLORS[p.team%TEAM_COLORS.length];rows.push(`<div class="island-player-row" style="--pc:${tc}"><span class="dot"></span><div><b>${esc(p.name)}${p.id===(net?.localId||'host')?' · VOCÊ':''}</b><span>${esc(c.name||p.charId)}</span></div><em>${mode==='duo'?'DUPLA':mode==='ffa'?`P${i+1}`:`TIME ${p.team+1}`} · ${p.ready?'PRONTO':'ESCOLHENDO'}</em></div>`)}else rows.push('<div class="island-player-row island-empty-slot" style="--pc:#475569"><span class="dot"></span><div><b>VAGA ABERTA</b><span>aguardando jogador</span></div><em>—</em></div>')}list.innerHTML=rows.join('')}
  if(arenaTotalActive&&mode!=='duo'&&list){let summary=document.getElementById('arena-lobby-summary');if(!summary){list.insertAdjacentHTML('beforebegin','<div id="arena-lobby-summary" class="arena-lobby-summary"></div>');summary=document.getElementById('arena-lobby-summary')}summary.textContent=`${players.filter(p=>p.ready).length}/${players.length} PRONTOS · ${rulesSummary(net?.rules)}`}
  let teamControls=document.getElementById('island-team-controls');if(mode!=='ffa'&&mode!=='duo'){if(!teamControls&&list){list.insertAdjacentHTML('afterend','<div id="island-team-controls" class="island-team-controls"><button id="island-change-team" class="btn">⇄ TROCAR DE TIME</button><small id="island-team-count"></small></div>');teamControls=document.getElementById('island-team-controls');document.getElementById('island-change-team').onclick=requestTeamChange}const counts=[0,1].map(t=>players.filter(p=>p.team===t).length),counter=document.getElementById('island-team-count');if(counter)counter.textContent=`AZUL ${counts[0]}/${f.max/2} · VERMELHO ${counts[1]}/${f.max/2}`;const me=players.find(p=>p.id===(net?.localId||'host')),button=document.getElementById('island-change-team');if(button){button.disabled=!me||counts[1-me.team]>=f.max/2;button.textContent=me?`⇄ TROCAR PARA O TIME ${me.team===0?'VERMELHO':'AZUL'}`:'⇄ TROCAR DE TIME'}}else teamControls?.remove();
  const ready=document.getElementById('island-ready'),me=players.find(p=>p.id===(net?.localId||'host'));if(me&&me.charId&&me.charId!==selectedChar){selectedChar=me.charId;updateLobbyCharacterUI()}if(ready){const connected=net?.role==='host'||!!net?.localId;ready.disabled=!connected||!selectedChar;ready.classList.toggle('active',!!me?.ready);ready.textContent=me?.ready?'✓ PRONTO · ALTERAR':'✓ MARCAR COMO PRONTO'}
  const start=document.getElementById('island-start');if(start){const balanced=mode==='ffa'||mode==='duo'||([0,1].every(t=>players.filter(p=>p.team===t).length===f.max/2)),valid=players.length>=f.min&&players.length<=max&&balanced&&players.every(p=>p.ready);start.disabled=!valid;start.textContent=valid?'⚔️ INICIAR BATALHA':!balanced?'EQUILIBRE OS TIMES':`AGUARDANDO ${f.min} JOGADORES PRONTOS`}
}
function changeTeam(playerId){if(net?.role!=='host'||!FORMAT[net.mode]||['ffa','duo'].includes(net.mode))return;const p=net.players.find(x=>x.id===playerId);if(!p)return;const next=1-p.team,capacity=FORMAT[net.mode].max/2;if(net.players.filter(x=>x.team===next).length>=capacity){netStatus('Este time já está completo.');return}p.team=next;p.ready=false;broadcastLobby()}
function requestTeamChange(){if(!net||['ffa','duo'].includes(net.mode))return;if(net.role==='host')changeTeam('host');else if(net.conn?.open)net.conn.send({type:'team'})}
function toggleReady(){
  if(!net||!selectedChar)return;
  if(net.role==='host'){
    const me=net.players.find(p=>p.id==='host');if(!me)return;me.charId=selectedChar;me.ready=!me.ready;net.ready=me.ready;broadcastLobby();return;
  }
  if(net.role!=='guest'||!net.conn?.open||!net.localId)return;
  net.ready=!net.ready;net.conn.send({type:'ready',value:net.ready});const me=net.players.find(p=>p.id===net.localId);if(me)me.ready=net.ready;renderLobbyState(net.players);
}
function hostStart(){if(net?.role!=='host')return;if(net.mode==='duo')return hostStartDuoEvent();const f=FORMAT[net.mode],max=roomCapacity(net.mode,net.rules);if(net.players.length<f.min||net.players.length>max||!net.players.every(p=>p.ready)||net.mode!=='ffa'&&[0,1].some(t=>net.players.filter(p=>p.team===t).length!==f.max/2)){netStatus(`São necessários ${f.min} jogadores prontos e times equilibrados.`);return}let ordered=net.players;if(net.mode!=='ffa'){const sides=[0,1].map(t=>net.players.filter(p=>p.team===t));ordered=[];for(let i=0;i<f.max/2;i++)ordered.push(sides[0][i],sides[1][i])}const desc=ordered.map((p,i)=>({...p,slot:i,team:net.mode==='ffa'?i:p.team})),rules=normalizeRules(net.rules),variant=rules.theme==='random'?['aurora','tempestade','crepusculo'][Math.floor(Math.random()*3)]:rules.theme;broadcast({type:'start',mode:net.mode,players:desc,variant,rules});startGameFromDescriptors(desc,net.mode,{authoritative:true,online:true,variant,rules})}
function sanitizeInput(v){const o={};for(const k of INPUT_ORDER)o[k]=!!v?.[k];return o}
function localInput(){return{left:held.has('KeyA'),right:held.has('KeyD'),jump:held.has('KeyW'),down:held.has('KeyS'),guard:held.has('KeyK'),punch:held.has('KeyI'),kick:held.has('KeyO'),hook:held.has('KeyG'),power:held.has('KeyJ'),super:held.has('KeyL'),extra:held.has('KeyH'),dodge:held.has('KeyQ'),extra1:held.has('KeyU'),extra2:held.has('KeyP')}}
function startGameFromDescriptors(players,mode,opts){
  stopGame(false);screen='island-play';try{fight=null}catch(_){ }document.body.classList.add('island-playing');app.innerHTML='';const wrap=document.createElement('div');wrap.className='island-game-wrap';wrap.innerHTML='<canvas class="island-game-canvas" width="1440" height="810"></canvas>';document.body.appendChild(wrap);const canvas=wrap.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;
  const localId=opts.online?(net?.localId||'host'):'local',rules=opts.event?normalizeRules(DEFAULT_RULES):normalizeRules(opts.rules||net?.rules||DEFAULT_RULES);game={canvas,ctx,wrap,mode,format:FORMAT[mode],rules,timeRemaining:rules.minutes?rules.minutes*60:0,feed:[],variant:opts.variant||'aurora',arenaTotal:arenaTotalActive,duoEvent:opts.event||null,authoritative:!!opts.authoritative,online:!!opts.online,localId,actors:players.map((p,i)=>makeActor(p,i,localId,opts.event?3:rules.stocks)),bridges:makeBridges(),projectiles:[],areas:[],pickups:[],fx:[],netEvents:[],phase:'countdown',countdown:3.2,time:0,pickupT:3.8,last:performance.now(),lastNet:0,lastInputSend:0,lastInputMask:-1,lastHud:0,winner:null,banner:'PREPARE-SE',bannerT:2.3,shake:0,paused:false,raf:0,cameraX:0,cameraTargetX:0,quality:(opts.online&&!opts.authoritative)?'medium':'high',perfFrames:0,perfTime:0,fps:60,stablePerf:0,predPrevInput:{},snapshotSeq:0,lastSnapshotAt:performance.now(),netGap:0,inputSeq:0};
  buildHud();buildArenaHudExtras();game.raf=requestAnimationFrame(gameLoop);playSfx('menu_confirm');
}
function makeActor(p,i,localId,stocks=3){
  const c=charById(p.charId),sp=SPAWNS[i%SPAWNS.length];
  let baseSpeed=285+clamp(Number(c.speed)||70,40,180)*.45;
  // Laranja conserva a identidade de velocidade ×3 também na Ilha.
  if(c.id==='laranja')baseSpeed*=3;
  if(p.bot)baseSpeed*=p.boss?1.32:1.18;
  return{playerId:p.id,name:p.name,charId:c.id,color:c.color||TEAM_COLORS[i],team:p.team,slot:i,local:p.id===localId,bot:!!p.bot,boss:!!p.boss,eventElite:!!p.eventElite,x:sp.x,y:sp.y-52,w:23,h:52,vx:0,vy:0,face:i%2?-1:1,onGround:false,jumps:2,dropT:0,damage:0,stocks:p.bot?(p.boss?7:6):stocks,meter:0,superHitsDealt:0,superHitsTaken:0,speed:baseSpeed,normalDmg:Math.round((c.dmg||30)*1.5*(p.bot?(p.boss?1.78:1.48):1)),attackCd:0,powerCd:0,specialCd:0,attackT:0,action:'idle',hurtT:0,invuln:p.bot?2.8:1.8,dodgeCd:0,guard:false,freezeT:0,slowT:0,poisonT:0,poisonTick:.5,poisonKind:'',poisonMarks:0,burnT:0,burnTick:.45,eliminated:false,respawnT:0,netInput:{},prevInput:{},aiT:0,aiPlan:null,powerIndex:0,visual:null,lastHitBy:null,kos:0,deaths:0,streak:0,proStamina:100,proMove:null,proDirHistory:[],proKnockdownT:0,proKnockdownLanded:false,ktrakElementIndex:0,ktrakElement:'water',ktrakAvatarT:0,ktrakAvatarIntroT:0,jonePowerIndex:0,signature:null,powerLabel:'',ktrakHealT:0,ktrakHealTick:0,ktrakHealAmount:0,ktrakLightningChargeT:0,attackLockT:0,noJumpT:0,flightT:0,flightStrikeT:0,copiedCharId:null,copiedT:0,absorbT:0,lastDamageTaken:0,lastDamageDealt:0,kloppCopyLockT:0,kainFlightT:0,kainRepelT:0,kainControlSwapT:0,extra1Cd:0,extra2Cd:0}
}
function buildHud(){const h=document.createElement('div');h.className='island-hud';h.innerHTML=`<div class="island-pickup-clock">PRÓXIMO ITEM · <b id="island-item-time">—</b></div><div class="island-topbar"><span class="live">${game.online?'ONLINE P2P':'TREINO'}</span><span>${game.format.name}</span><span>ARENA 3× · PULO 2×</span><span class="net" id="island-net-badge">${game.online?'HOST AUTORITATIVO':'SEM LATÊNCIA'}</span><span class="perf" id="island-perf-badge">AUTO · ${game.quality.toUpperCase()}</span></div><button id="island-exit" class="island-exit">ESC · SAIR</button><div id="island-banner" class="island-banner show">PREPARE-SE<small>3 VIDAS · DERRUBE OS RIVAIS</small></div><div id="island-players-hud" class="island-players-hud"></div><div id="island-pause" class="island-pause"><div class="island-modal"><h2>PAUSADO</h2><p>CONTROLES: A/D · W×2 · S · I/O/G · J · K · L · H · Q · U/P extras</p><button id="island-resume" class="btn big">CONTINUAR</button><button id="island-quit" class="btn">SAIR PARA OS MODOS</button></div></div><div id="island-results" class="island-results"><div class="island-modal"><div class="island-kicker">BATALHA ENCERRADA</div><h2 id="island-winner" class="island-winner">VITÓRIA</h2><p id="island-result-copy"></p><button id="island-rematch" class="btn big">↻ VOLTAR À MESMA SALA</button><button id="island-result-modes" class="btn">⚔️ SAIR DA SALA / MODOS</button></div></div>`;document.body.appendChild(h);game.hud=h;document.getElementById('island-exit').onclick=requestExit;document.getElementById('island-resume').onclick=togglePause;document.getElementById('island-quit').onclick=exitToModes;document.getElementById('island-result-modes').onclick=exitToModes;document.getElementById('island-rematch').onclick=()=>{if(game?.online){if(net?.role==='host')returnOnlineMatchToRoom(true);else toast('Aguardando o HOST voltar para a sala…');}else{stopGame(false);openSetup()}};refreshHud()}
function requestExit(){if(game?.arenaTotal&&game.online){const guide=document.getElementById('arena-controls-modal');if(guide?.classList.contains('show')){guide.classList.remove('show');return}document.getElementById('arena-exit-modal')?.classList.toggle('show');return}if(game?.online)return exitToModes();togglePause()}
function togglePause(){if(!game||game.online||!game.authoritative)return;game.paused=!game.paused;document.getElementById('island-pause')?.classList.toggle('show',game.paused);game.last=performance.now()}
function exitToModes(){if(net?.role==='host')broadcast({type:'return'});stopGame(false);closeNetwork();renderModes()}
function stopGame(toModes=false){if(game?.raf)cancelAnimationFrame(game.raf);if(game?.roomReturnTimer)clearTimeout(game.roomReturnTimer);game?.wrap?.remove();game?.hud?.remove();game=null;document.body.classList.remove('island-playing');held.clear();if(toModes)renderModes()}
function buildArenaHudExtras(){if(!game?.arenaTotal||!game.hud)return;const h=game.hud;h.insertAdjacentHTML('beforeend',`<div id="arena-theme" class="arena-theme">${esc(game.variant.toUpperCase())}</div><div id="arena-match-clock" class="arena-match-clock"></div><div id="arena-leaderboard" class="arena-leaderboard"></div><div id="arena-killfeed" class="arena-killfeed" aria-live="polite"></div><div id="arena-bridge-status" class="arena-bridge-status"></div><div id="arena-net-warning" class="arena-net-warning" hidden>⚠ SINCRONIZANDO COM O ANFITRIÃO…</div><div class="arena-tools"><button id="arena-guide-button" type="button">? CONTROLES</button><button id="arena-fullscreen-button" type="button">⛶ TELA CHEIA</button></div><div id="arena-controls-modal" class="arena-overlay"><div class="arena-overlay-card"><h2>CONTROLES DA ARENA</h2><p><b>A/D</b> andar · <b>W</b> pulo duplo · <b>S</b> abaixar · <b>S + W</b> descer da plataforma · <b>I</b> soco · <b>O</b> chute · <b>J</b> poder · <b>K</b> defesa · <b>L</b> super · <b>H</b> alternar poder · <b>Q</b> esquiva</p><p>Ataques funcionam em movimento. No ar, I/O atacam para baixo. Cada lutador usa seus próprios poderes e animações.</p><button id="arena-guide-close" class="btn">VOLTAR À LUTA</button></div></div><div id="arena-exit-modal" class="arena-overlay"><div class="arena-overlay-card"><h2>SAIR DA PARTIDA?</h2><p>Seu lutador perde a conexão com esta batalha P2P.</p><button id="arena-exit-cancel" class="btn">CONTINUAR JOGANDO</button><button id="arena-exit-confirm" class="btn">SAIR</button></div></div>`);document.getElementById('arena-guide-button').onclick=()=>document.getElementById('arena-controls-modal')?.classList.add('show');document.getElementById('arena-guide-close').onclick=()=>document.getElementById('arena-controls-modal')?.classList.remove('show');document.getElementById('arena-exit-cancel').onclick=()=>document.getElementById('arena-exit-modal')?.classList.remove('show');document.getElementById('arena-exit-confirm').onclick=exitToModes;document.getElementById('arena-fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();document.getElementById('arena-fullscreen-button').textContent=document.fullscreenElement?'⛶ SAIR DA TELA CHEIA':'⛶ TELA CHEIA'}catch(_){toast('Tela cheia indisponível neste navegador.')}};refreshArenaHud()}

function updateCamera(){if(game){game.cameraX=0;game.cameraTargetX=0}}
function gameLoop(t){if(!game)return;const dt=Math.min(.034,Math.max(0,(t-game.last)/1000));game.last=t;if(!game.paused){if(game.authoritative)updateGame(dt);else{consumePendingSnapshot();sendGuestInput(t);clientStep(dt);updateCamera(dt)}updatePerformance(dt);drawGame();if(t-game.lastHud>=120){game.lastHud=t;refreshHud();refreshArenaScore();refreshArenaHud()}}game.raf=requestAnimationFrame(gameLoop)}
function sendGuestInput(t){if(!game?.online||net?.role!=='guest')return;const ch=net.fast?.open?net.fast:net.conn;if(!ch?.open)return;const input=localInput(),mask=packInputBits(input),changed=mask!==game.lastInputMask;if(!changed&&t-game.lastInputSend<NET_INPUT_HEARTBEAT)return;const dc=ch.dataChannel;if(dc&&Number(dc.bufferedAmount||0)>(ch===net.fast?FAST_BACKPRESSURE:NET_BACKPRESSURE))return;game.lastInputSend=t;game.lastInputMask=mask;const local=game.actors.find(a=>a.local),variant=input.power?(input.down?'down':input.jump?'up':local&&!local.onGround?'air':null):null;try{ch.send({type:'i',m:mask,v:variant,s:(game.inputSeq=(game.inputSeq||0)+1)})}catch(_){}}
function updatePerformance(dt){if(!game)return;game.perfFrames++;game.perfTime+=dt;if(game.perfTime<1)return;const fps=game.perfFrames/game.perfTime;game.fps=fps;game.perfFrames=0;game.perfTime=0;if(game.online&&!game.authoritative){if(fps<39){game.quality='low';game.stablePerf=0}else if(fps<52&&game.quality==='high'){game.quality='medium';game.stablePerf=0}else if(fps>57){game.stablePerf=(game.stablePerf||0)+1;if(game.stablePerf>=5&&game.quality==='low')game.quality='medium';else if(game.stablePerf>=9&&game.quality==='medium')game.quality='high'}else game.stablePerf=0}game.canvas.imageSmoothingEnabled=game.quality!=='low';document.body.classList.toggle('island-perf-low',game.quality==='low');document.body.classList.toggle('island-perf-medium',game.quality==='medium')}
function clientStep(dt){
  if(!game||game.authoritative)return;
  game.time+=dt;if(game.bannerT>0)game.bannerT=Math.max(0,game.bannerT-dt);
  const now=performance.now(),inp=localInput();
  for(const a of game.actors){
    if(a.eliminated||a.respawnT>0)continue;
    if(a.local){predictLocalActor(a,inp,dt)}
    else{
      const age=Math.min(NET_EXTRAP_MAX,Math.max(0,(now-(a.netStamp||now))/1000));
      const ex=(a.netX??a.x)+(a.netVx||0)*age;
      const ey=(a.netY??a.y)+(a.onGround?0:(a.netVy||0)*age+920*age*age);
      const k=Math.min(1,dt*(game.quality==='low'?9:12));
      const dx=ex-a.x,dy=ey-a.y;
      if(Math.abs(dx)>300||Math.abs(dy)>220){a.x=ex;a.y=ey}else{a.x+=dx*k;a.y+=dy*k}
      a.vx=a.netVx??a.vx;a.vy=a.netVy??a.vy;
      a.attackT=Math.max(0,(a.attackT||0)-dt);a.hurtT=Math.max(0,(a.hurtT||0)-dt);a.invuln=Math.max(0,(a.invuln||0)-dt);
    }
  }
  for(const q of game.projectiles){
    const age=Math.min(NET_EXTRAP_MAX,Math.max(0,(now-(q.netStamp||now))/1000)),gx=q.gravity||0;
    const tx=(q.netX??q.x)+(q.vx||0)*age,ty=(q.netY??q.y)+(q.vy||0)*age+.5*gx*age*age;
    const k=Math.min(1,dt*13);q.x+=(tx-q.x)*k;q.y+=(ty-q.y)*k;q.life=Math.max(0,(q.life||0)-dt);
  }
  updateFx(dt);game.predPrevInput=inp;
}
function predictLocalActor(a,input,dt){
  if(game.phase!=='fight')return;
  const prev=game.predPrevInput||{},move=(input.left?-1:0)+(input.right?1:0),accel=a.onGround?16:9,max=(a.speed||320)*(a.slowT>0?.62:1)*(input.guard?.35:1);
  a.attackT=Math.max(0,(a.attackT||0)-dt);a.hurtT=Math.max(0,(a.hurtT||0)-dt);a.invuln=Math.max(0,(a.invuln||0)-dt);
  a.vx+=(move*max-a.vx)*Math.min(1,accel*dt);if(move)a.face=move;a.guard=!!input.guard;
  if(input.jump&&!prev.jump&&(a.jumps??2)>0&&!a.guard&&(a.noJumpT||0)<=0){if(input.down&&!input.power&&a.onGround&&canDropThrough(a)){a.dropT=.22;a.onGround=false;a.y+=5;a.action='air'}else if(!input.down){a.vy=-880;a.onGround=false;a.jumps=Math.max(0,(a.jumps??2)-1);a.action='air'}}
  const localEdge=(key,dur,action)=>{if(input[key]&&!prev[key]&&a.attackT<=.02&&!a.guard){a.attackT=dur;a.action=action}};
  localEdge('punch',.29,'punch');localEdge('kick',.47,'kick');localEdge('hook',.64,'hook');localEdge('power',.46,'throw');localEdge('super',.72,'special');
  if(input.dodge&&!prev.dodge){a.action='dodge';a.invuln=Math.max(a.invuln,.18);a.vx=(a.face||1)*(a.speed||320)*1.45}
  a.dropT=Math.max(0,(a.dropT||0)-dt);const prevBottom=a.y+(a.h||104);
  if((a.flightT||0)>0){a.flightT=Math.max(0,a.flightT-dt);a.vy+=(a.y<245?520:-620)*dt;a.vy=clamp(a.vy,-170,170)}else a.vy+=2200*dt;
  a.x=clamp(a.x+a.vx*dt,-80,WORLD_W+80);a.y+=a.vy*dt;a.onGround=false;
  if(a.dropT<=0&&a.vy>=0){let best=null;for(const p of activePlatforms()){const nb=a.y+(a.h||104);if(a.x+(a.w||46)*.38<p.x||a.x-(a.w||46)*.38>p.x+p.w)continue;if(prevBottom<=p.y+8&&nb>=p.y&&nb<=p.y+42){if(!best||p.y<best.y)best=p}}if(best){a.y=best.y-(a.h||104);a.vy=0;a.onGround=true;a.jumps=2;if(a.attackT<=0)a.action=Math.abs(a.vx)>20?'walk':'idle'}}
  a.crouch=!!input.down&&a.onGround;if(a.onGround&&a.attackT<=0&&a.hurtT<=0)a.action=a.crouch?'crouch':Math.abs(a.vx)>20?'walk':'idle';
  if(Number.isFinite(a.serverX)){
    const dx=a.serverX-a.x,dy=a.serverY-a.y,hard=Math.abs(dx)>280||Math.abs(dy)>220;
    if(hard){a.x=a.serverX;a.y=a.serverY;a.vx=a.serverVx||0;a.vy=a.serverVy||0}
    else{a.x+=dx*Math.min(1,dt*3.25);a.y+=dy*Math.min(1,dt*3.0);a.vx+=(Number(a.serverVx||0)-a.vx)*Math.min(1,dt*1.6)}
  }
}
function updateGame(dt){const g=game;g.time+=dt;g.shake=Math.max(0,g.shake-dt*18);if(g.bannerT>0)g.bannerT-=dt;if(g.phase==='countdown'){g.countdown-=dt;if(g.countdown<=0){g.phase='fight';g.banner='LUTEM!';g.bannerT=1.2;playSfx('fight_start')}sendStateIfNeeded();return}if(g.phase!=='fight'){sendStateIfNeeded();return}
  if(g.arenaTotal&&g.rules.minutes){g.timeRemaining=Math.max(0,g.timeRemaining-dt);if(g.timeRemaining<=0){finishByTime();sendStateIfNeeded();return}}
  for(const b of g.bridges){if(b.brokenT>0){b.brokenT-=dt;if(b.brokenT<=0){b.brokenT=0;b.hp=b.maxHp;addFx('bridge',b.x+b.w/2,b.y,'#67e8f9',.7,90)}}}
  if(g.rules.items){g.pickupT-=dt;if(g.pickupT<=0){spawnPickup();g.pickupT=6+Math.random()*2}}
  for(const a of g.actors)updateActor(a,dt);
  updateProjectiles(dt);updateAreas(dt);updatePickups(dt);updateFx(dt);updateCamera(dt);checkWinner();sendStateIfNeeded();
}
function actorInput(a,dt){if(a.bot)return botInput(a,dt);if(a.local)return localInput();return sanitizeInput(a.netInput)}
function pressed(a,input,key){return !!input[key]&&!a.prevInput[key]}

function refreshSuperMeter(a){a.meter=clamp(Math.max((a.superHitsDealt||0)/20,(a.superHitsTaken||0)/15)*100,0,100)}
function extraAction(a){
  // V22.2: mudanças feitas com H são privadas. O estado continua sincronizado para
  // a simulação, mas não gera banner global nem texto flutuando que entregue a escolha.
  if(a.charId==='ktrak'){
    const els=['water','earth','fire','air','lightning','lava','heal'];a.ktrakElementIndex=((a.ktrakElementIndex||0)+1)%els.length;a.ktrakElement=els[a.ktrakElementIndex];
    const names={water:'ÁGUA',earth:'TERRA',fire:'FOGO',air:'AR',lightning:'RAIO AZUL',lava:'LAVA',heal:'CURA'};a.powerLabel='ELEMENTO · '+names[a.ktrakElement];addFx('meter',a.x,a.y+35,'#67e8f9',.22,28);playSfx('menu_select',.32);return;
  }
  if(a.charId==='jone'){
    a.jonePowerIndex=((a.jonePowerIndex||0)+1)%2;a.jonePoisonIndex=a.jonePowerIndex;a.powerLabel=a.jonePowerIndex?'BEIJO DA HERA':'CORTE DA MORTE';addFx('meter',a.x,a.y+24,a.jonePowerIndex?'#7ddc56':'#d7c7ae',.28,34);playSfx('menu_select',.32);return;
  }
  if(a.charId==='uiye'){
    const t=nearestEnemy(a,900);if(t){a.copiedCharId=t.charId;a.copiedT=3;addFx('meter',a.x,a.y+38,'#c8b8a3',.22,28)}return;
  }
  if(a.charId==='klopp'){addFx('meter',a.x,a.y+38,'#f43f5e',.18,24);return;}
  if(a.charId==='kain'){
    const powers=['flight','ice','heal','shock','repel','swap','fire','teleport','drain','gravity'];a.kainPowerIndex=((a.kainPowerIndex??-1)+1)%powers.length;a.kainPower=powers[a.kainPowerIndex];addFx('meter',a.x,a.y+35,'#c7d0df',.22,28);playSfx('menu_select',.28);return;
  }
  if(a.charId==='lkugh'){
    const t=nearestEnemy(a);if(t)addArea({owner:a,x:t.x,y:t.y+45,rx:185,ry:150,life:2.4,damage:1.4,knock:130,effect:'blackhole',color:'#7c3aed',label:'BURACO NEGRO',tick:.24,pull:true,pierce:true});return;
  }
  // H é reservado aos extras reais de personagem. Nos demais, não substitui o poder original.
  addFx('meter',a.x,a.y+32,a.color,.22,28);
}
function beginCombatMove(a,kind){
  const s=combatSpec(kind);if(!s||a.attackCd>0||a.guard||a.freezeT>0||a.hurtT>0||a.proMove)return false;
  if((a.proStamina||0)<s.cost){addFx('meter',a.x,a.y+22,'#facc15',.2,24);return false}
  a.proStamina-=s.cost;a.attackCd=s.duration;a.attackT=s.duration;a.action=kind==='uppercut'?'hook':kind;a.proMove={kind,time:0,duration:s.duration,start:s.start,end:s.end,hit:false,dir:a.face||1};return true;
}
function hitCombatMove(a,m){
  const s=combatSpec(m.kind);if(!s)return;const projectileMove=['down','corewave','comet','astralrain'].includes(m.kind);
  if(projectileMove){
    if(m.kind==='astralrain'){
      const t=nearestEnemy(a);if(t)spawnProjectile(a,{x:t.x,y:55,vx:0,vy:1400,gravity:0,speed:0,damage:islandMoveDamage(a,s.damage),knock:460,r:28,life:1,color:a.color,effect:'astralrain',kind:'astralrain',label:'CHUVA ASTRAL'});
    }else spawnProjectile(a,{speed:m.kind==='comet'?850:600,damage:islandMoveDamage(a,s.damage),knock:m.kind==='comet'?520:360,r:m.kind==='comet'?24:17,life:m.kind==='comet'?1.35:1.1,color:a.color,effect:m.kind,kind:m.kind,label:m.kind.toUpperCase()});
    return;
  }
  let hit=false;for(const b of game.actors){
    if(!validTarget(a,b)||Math.abs(b.x-a.x)>s.range||(b.x-a.x)*m.dir<-26)continue;
    const vertical=Math.abs((b.y+b.h/2)-(a.y+a.h/2));if(vertical>Math.max(82,s.height||82))continue;
    const downed=(b.proKnockdownT||0)>0&&b.onGround;if(downed&&m.kind!=='kick')continue;
    const dmg=islandMoveDamage(a,s.damage);
    if(applyHit(b,a,dmg,m.kind==='uppercut'?390:m.kind==='kick'?315:260,m.kind==='uppercut'?-560:m.kind==='diagonal'?-490:m.kind==='kick'?-245:-145,m.kind)){
      hit=true;
      if(m.kind==='uppercut'&&!b.eliminated){b.proKnockdownT=2.25;b.proKnockdownLanded=false;b.guard=false;b.vy=-650;b.vx=m.dir*210;b.onGround=false;b.action='hurt';b.hurtT=Math.max(b.hurtT,.15)}
      if(['forward','doubleforward','crossrush'].includes(m.kind))b.x=clamp(b.x+m.dir*(m.kind==='crossrush'?68:m.kind==='doubleforward'?45:25),26,WORLD_W-26);
    }
  }
  if(hit)playSfx(m.kind==='punch'?'punch':'kick',.58);damageBridges(a.x+m.dir*55,a.y+a.h,m.kind==='uppercut'?12:m.kind==='kick'?8:4,80);
}
function stepCombatMove(a,dt){
  a.proStamina=clamp((a.proStamina||0)+21*dt,0,100);const m=a.proMove;if(!m)return;m.time+=dt;a.face=m.dir;
  if(m.kind==='forward'&&m.time>=.07&&m.time<.26)a.x=clamp(a.x+m.dir*370*dt,26,WORLD_W-26);
  if(m.kind==='doubleforward'&&m.time>=.06&&m.time<.37)a.x=clamp(a.x+m.dir*610*dt,26,WORLD_W-26);
  if(m.kind==='crossrush'&&m.time>=.08&&m.time<.44)a.x=clamp(a.x+m.dir*530*dt,26,WORLD_W-26);
  if(m.kind==='diagonal'&&m.time>=.06&&m.time<.24){a.vx=m.dir*210;if(a.onGround&&m.time<.09){a.vy=-360;a.onGround=false}}
  if(m.kind==='flyingkick'&&m.time>=.05&&m.time<.30){if(a.onGround){a.vy=-420;a.onGround=false}a.vx=m.dir*Math.max(360,a.speed*.95)}
  if(m.kind==='airdown'&&m.time>=.06&&m.time<.38){a.vy=Math.max(a.vy,980);a.vx=m.dir*Math.max(130,a.speed*.42)}
  if(!m.hit&&m.time>=m.start){m.hit=true;hitCombatMove(a,m)}
  if(m.time>=m.duration){a.proMove=null;if(['punch','kick','hook'].includes(a.action))a.action='idle'}
}
function rememberDirection(a,input){
  const t=performance.now(),prev=a.prevInput||{};const push=dir=>{(a.proDirHistory||(a.proDirHistory=[])).push({dir,t});a.proDirHistory=a.proDirHistory.filter(x=>t-x.t<760).slice(-4)};
  if(input.left&&!prev.left)push('left');if(input.right&&!prev.right)push('right');if(input.jump&&!prev.jump)push('up');if(input.down&&!prev.down)push('down');
}
function requestedTechnique(a,input){
  const h=(a.proDirHistory||[]).filter(x=>performance.now()-x.t<760);a.proDirHistory=h;const forward=a.face===-1?'left':'right',back=forward==='left'?'right':'left';
  if(h.length>=2){const x=h[h.length-2].dir,y=h[h.length-1].dir;if(x===forward&&y===forward){a.proDirHistory=[];return'doubleforward'}if(x==='up'&&y==='down'){a.proDirHistory=[];return'skyfall'}if(x===back&&y===forward){a.proDirHistory=[];return'crossrush'}if(x==='down'&&y==='down'){a.proDirHistory=[];return'corewave'}if(x==='up'&&y==='up'){a.proDirHistory=[];return'astralrain'}}
  if(h.length>=3){const x=h[h.length-3].dir,y=h[h.length-2].dir,z=h[h.length-1].dir;if(x===forward&&y==='down'&&z===forward){a.proDirHistory=[];return'comet'}}
  const lr=!!input.left!==!!input.right;return input.down&&lr?'diagonal':input.down?'down':lr?'forward':null;
}
function signatureStep(a,dt){
  if(a.ktrakAvatarT>0)a.ktrakAvatarT=Math.max(0,a.ktrakAvatarT-dt);a.ktrakAvatarIntroT=Math.max(0,(a.ktrakAvatarIntroT||0)-dt);
  const sig=a.signature;if(!sig)return;sig.t+=dt;const target=game.actors.find(x=>x.playerId===sig.targetId);
  if(sig.type==='ktrakLightning'){
    a.vx*=.70;a.face=sig.dir||a.face;
    if(!sig.fired&&sig.t>=.14){sig.fired=true;spawnProjectile(a,{speed:0,damage:sig.avatar?6.5:11,knock:sig.avatar?260:430,r:sig.avatar?24:20,life:sig.avatar?.64:.23,color:'#5ab7ff',effect:'shock',kind:'lightningBeam',pierce:!!sig.avatar,progressive:!!sig.avatar,tick:.11,label:'RAIO AZUL',fixedToOwner:true,beamLength:sig.avatar?820:610,dir:a.face});game.shake=Math.max(game.shake,sig.avatar?7:4);playSfx('special',.55)}
    if(sig.t>=(sig.avatar?.68:.31)){a.signature=null;a.action='idle'}
  }else if(sig.type==='laranjaCombo'){
    const times=[.065,.125,.195,.285];if(target&&!target.eliminated){a.face=Math.sign(target.x-a.x)||a.face;a.x+=(clamp(target.x-a.face*82,28,WORLD_W-28)-a.x)*Math.min(1,dt*15)}
    times.forEach((tm,i)=>{const bit=1<<i;if(sig.t>=tm&&!(sig.mask&bit)){sig.mask|=bit;if(target&&validTarget(a,target)&&Math.abs(target.x-a.x)<165)applyHit(target,a,i===3?6.2:3.8,i===3?260:120,i===3?-180:-80,'punch')}});
    if(sig.t>=.40){a.signature=null;a.proMove=null;a.action='idle'}
  }else if(sig.type==='laranjaSuper'){
    const times=[.07,.13,.19,.25,.31,.38];times.forEach((tm,i)=>{const bit=1<<i;if(sig.t>=tm&&!(sig.mask&bit)){sig.mask|=bit;if(target&&!target.eliminated){a.face=Math.sign(target.x-a.x)||a.face;a.x=clamp(target.x-a.face*(i%2?95:70),30,WORLD_W-30);applyHit(target,a,i===5?17:7,i===5?690:270,i===5?-520:-160,'special')}}});
    if(sig.t>=.52){a.x=clamp(sig.startX,30,WORLD_W-30);a.signature=null;a.proMove=null;a.action='idle'}
  }
}
function applyJonePoison(t,owner,kind='corrosive'){
  // Mesmas durações, ticks, multiplicadores e Marcas Tóxicas do Jone do modo normal.
  const cfg={corrosive:{duration:4.4,tick:.30,dot:.34,impact:1.00,marks:1},acid:{duration:3.5,tick:.24,dot:.38,impact:1.08,marks:1},deep:{duration:5.4,tick:.36,dot:.28,impact:.88,marks:2},plague:{duration:6.8,tick:.27,dot:.44,impact:1.35,marks:3}}[kind]||{duration:4.4,tick:.30,dot:.34,impact:1,marks:1};
  t.poisonKind=kind;t.poisonT=Math.max(t.poisonT||0,cfg.duration);t.poisonTick=Math.min(Number.isFinite(t.poisonTick)?t.poisonTick:.08,.08);t.poisonMarks=clamp((t.poisonMarks||0)+cfg.marks,1,3);t.poisonOwnerId=owner?.playerId||null;
}
function simpleStrike(a,input,type){
  const now=performance.now();
  if(!a.onGround)return'airdown';
  if(type==='punch'){
    if(input.down)return'uppercut';if(input.jump)return'strongpunch';
    const twice=now-(a.lastPunchAt||0)<360;a.lastPunchAt=now;return twice?'doublepunch':'punch';
  }
  if(input.down)return'sweep';if(input.jump)return'flyingkick';
  const twice=now-(a.lastKickAt||0)<420;a.lastKickAt=now;return twice?'doublekick':'kick';
}
function updateActor(a,dt){
  if(a.eliminated)return;if(a.respawnT>0){a.respawnT-=dt;if(a.respawnT<=0&&a.stocks>0)respawn(a);return}
  a.attackCd=Math.max(0,a.attackCd-dt);a.powerCd=Math.max(0,(a.powerCd||0)-dt);a.specialCd=Math.max(0,(a.specialCd||0)-dt);a.extra1Cd=Math.max(0,(a.extra1Cd||0)-dt);a.extra2Cd=Math.max(0,(a.extra2Cd||0)-dt);a.attackT=Math.max(0,a.attackT-dt);a.hurtT=Math.max(0,a.hurtT-dt);a.invuln=Math.max(0,a.invuln-dt);a.dodgeCd=Math.max(0,a.dodgeCd-dt);a.dropT=Math.max(0,a.dropT-dt);a.freezeT=Math.max(0,a.freezeT-dt);a.slowT=Math.max(0,a.slowT-dt);
  a.extraEdgeLockT=Math.max(0,(a.extraEdgeLockT||0)-dt);
  tickStatus(a,dt);stepCombatMove(a,dt);signatureStep(a,dt);let input=actorInput(a,dt);if((a.kainControlSwapT||0)>0){const v=input;input={...v,left:v.right,right:v.left,jump:v.down,down:v.jump,power:v.super,super:v.power,punch:v.kick,kick:v.hook,hook:v.punch,guard:v.dodge,dodge:v.guard}}rememberDirection(a,input);const kloppK=pressed(a,input,'guard')&&a.charId==='klopp'&&a.copiedT>0&&a.copiedCharId;if(kloppK)kloppCopiedJ(a);a.guard=!kloppK&&!!input.guard&&a.hurtT<=0&&a.freezeT<=0&&a.attackT<=0&&!a.proMove&&(a.kloppCopyLockT||0)<=0;
  a.proKnockdownT=Math.max(0,(a.proKnockdownT||0)-dt);if(a.proKnockdownT>0&&a.onGround){a.guard=false;a.vx=0;a.action='downed';a.hurtT=Math.max(a.hurtT,.04)}else if(a.proKnockdownT<=0&&a.action==='downed')a.action='idle';
  if(a.freezeT<=0&&a.hurtT<=0&&!a.signature){
    const move=(input.left?-1:0)+(input.right?1:0),accel=a.onGround?14:8,max=a.speed*(a.slowT>0?.62:1)*(a.guard?.35:1)*(a.proMove?.72:1);a.vx+=(move*max-a.vx)*Math.min(1,accel*dt);if(move)a.face=move;
    // PULO DUPLO: duas pressões de W antes de tocar novamente no chão.
    if(pressed(a,input,'jump')&&a.jumps>0&&!a.guard&&a.noJumpT<=0){if(input.down&&!input.power&&a.onGround&&canDropThrough(a)){a.dropT=.22;a.onGround=false;a.y+=5}else if(!input.down){a.vy=-880;a.onGround=false;a.jumps--;a.dropT=0;addFx('jump',a.x,a.y+a.h,'#e2e8f0',.22,28);playSfx('jump',.35)}}
    if(pressed(a,input,'dodge'))dodge(a);
    if(a.attackLockT<=0){
      if(pressed(a,input,'punch'))beginCombatMove(a,simpleStrike(a,input,'punch'));
      if(pressed(a,input,'kick'))beginCombatMove(a,simpleStrike(a,input,'kick'));
      if(a.pendingExtra||pressed(a,input,'extra')){a.pendingExtra=false;if(a.extraEdgeLockT<=0){a.extraEdgeLockT=.18;extraAction(a)}}
      if(pressed(a,input,'extra1'))lkughIslandExtra(a,'stars');
      if(pressed(a,input,'extra2'))lkughIslandExtra(a,'blackhole');
      if(a.pendingPower||pressed(a,input,'power')){const variant=a.netVariant&&performance.now()-(a.netVariantAt||0)<250?a.netVariant:(input.down?'down':input.jump?'up':!a.onGround?'air':null);a.pendingPower=false;a.netVariant=null;if(variant)variantPowerAttack(a,variant);else powerAttack(a,false)}
      if(pressed(a,input,'super'))powerAttack(a,true);
    }
  }else if(!a.signature&&!a.proMove)a.vx*=.94;
  const prevBottom=a.y+a.h;if(a.kainFlightT>0){const lift=(input.jump?1:0)-(input.down?1:0);a.vy+=(lift*-205-a.vy)*Math.min(1,dt*8);a.vy=clamp(a.vy,-205,205)}else if(a.flightT>0){a.vy+=(a.y<245?520:-620)*dt;a.vy=clamp(a.vy,-170,170)}else a.vy+=2200*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.onGround=false;
  if(a.dropT<=0&&a.vy>=0){let best=null;for(const p of activePlatforms()){const nextBottom=a.y+a.h;if(a.x+a.w*.38<p.x||a.x-a.w*.38>p.x+p.w)continue;if(prevBottom<=p.y+7&&nextBottom>=p.y&&nextBottom<=p.y+38){if(!best||p.y<best.y)best=p}}if(best){a.y=best.y-a.h;a.vy=0;a.onGround=true;a.jumps=2}}
  a.crouch=!!input.down&&a.onGround;if(a.onGround&&a.attackT<=0&&a.hurtT<=0)a.action=a.crouch?'crouch':Math.abs(a.vx)>20?'walk':'idle';
  if(a.x<-150||a.x>WORLD_W+150||a.y>FALL_Y)loseStock(a);a.prevInput=input;
}
function activePlatforms(){return[...BASE_PLATFORMS,...game.bridges.filter(b=>b.brokenT<=0)]}
function canDropThrough(a){const feet=a.y+a.h,half=a.w*.38;return activePlatforms().some(p=>p.y>feet+8&&p.x<=a.x+half&&p.x+p.w>=a.x-half)}
function tickStatus(a,dt){
  if(a.poisonT>0){a.poisonT-=dt;a.poisonTick-=dt;if(a.poisonTick<=0){const cfg={corrosive:[.30,.34],acid:[.24,.38],deep:[.36,.28],plague:[.27,.44]}[a.poisonKind]||[.30,.34];a.poisonTick=cfg[0];const owner=game.actors.find(x=>x.playerId===a.poisonOwnerId)||null,base=owner?.normalDmg||45;directDamage(a,owner,Math.max(.8,base*cfg[1]*.10)*(1+.14*Math.max(0,(a.poisonMarks||1)-1)),0,0,'poison')}}
  if(a.poisonT<=0){a.poisonMarks=0;a.poisonOwnerId=null}
  if(a.burnT>0){a.burnT-=dt;a.burnTick-=dt;if(a.burnTick<=0){a.burnTick=.42;directDamage(a,null,.75,0,0,'burn')}}
  if(a.ktrakHealT>0){a.ktrakHealT=Math.max(0,a.ktrakHealT-dt);a.ktrakHealTick-=dt;if(a.ktrakHealTick<=0){a.ktrakHealTick=.34;a.damage=Math.max(0,a.damage-(a.ktrakHealAmount||3.2));addFx('heal',a.x,a.y+46,'#7ff0c8',.25,34)}}
  a.ktrakLightningChargeT=Math.max(0,(a.ktrakLightningChargeT||0)-dt);
  a.attackLockT=Math.max(0,(a.attackLockT||0)-dt);a.noJumpT=Math.max(0,(a.noJumpT||0)-dt);a.absorbT=Math.max(0,(a.absorbT||0)-dt);a.kainFlightT=Math.max(0,(a.kainFlightT||0)-dt);a.kainRepelT=Math.max(0,(a.kainRepelT||0)-dt);a.kainControlSwapT=Math.max(0,(a.kainControlSwapT||0)-dt);a.kloppCopyLockT=Math.max(0,(a.kloppCopyLockT||0)-dt);const prevCopied=a.copiedT||0;a.copiedT=Math.max(0,prevCopied-dt);if(a.copiedT<=0){if(prevCopied>0&&a.charId==='frogh'){a.damage=0;addFx('heal',a.x,a.y+45,'#35e08a',.42,58)}a.copiedCharId=null;}
  if(a.flightT>0){a.flightT=Math.max(0,a.flightT-dt);a.flightStrikeT-=dt;if(a.flightStrikeT<=0){a.flightStrikeT=.52;const owner=a,t=nearestEnemy(a);if(t)addArea({owner,x:t.x,y:t.y+40,rx:46,ry:120,life:.12,damage:5.2,knock:250,effect:'shock',color:'#8ed8ff',label:'RAIO CELESTE',tick:.2})}}
}
function dodge(a){if(a.dodgeCd>0||a.attackCd>0)return;a.dodgeCd=1.05;a.invuln=.34;a.vx=a.face*520;a.vy=Math.min(a.vy,-80);a.action='dodge';a.attackT=.3;addFx('dash',a.x,a.y+55,a.color,.28,65);playSfx('dodge',.45)}
function validTarget(a,b){return b!==a&&!b.eliminated&&b.respawnT<=0&&b.stocks>0&&(game.mode==='ffa'||b.team!==a.team)}
function nearestEnemy(a,max=1e9){let best=null,bd=max;for(const b of game.actors){if(!validTarget(a,b))continue;const d=Math.hypot(b.x-a.x,(b.y-a.y)*.8);if(d<bd){bd=d;best=b}}return best}
function meleeAttack(a,kind){return beginCombatMove(a,kind==='kick'?'kick':'punch')}
function invokeIslandKitAs(a,id,superMove){
  if(!a||!id||['klopp','frogh','ztaaa'].includes(id))return false;const save=a.charId;a.charId=id;let handled=false;
  try{if(id==='ktrak'){ktrakIslandPower(a,superMove);handled=true}else if(id==='jone'){joneIslandPower(a,superMove);handled=true}else if(id==='laranja'){laranjaIslandPower(a,superMove);handled=true}else handled=!!classicIslandPower(a,superMove)}finally{a.charId=save}
  return handled
}
function kloppTransformIsland(a){
  const pool=allCharacters().filter(c=>!['klopp','ztaaa','frogh'].includes(c.id));if(!pool.length)return false;let choices=pool.filter(c=>c.id!==a.copiedCharId);if(!choices.length)choices=pool;const c=choices[Math.floor(Math.random()*choices.length)];a.copiedCharId=c.id;a.copiedT=9999;a.attackCd=.35;a.attackT=.35;a.action='special';a.powerLabel=`FORMA · ${c.name}`;addFx('meter',a.x,a.y+38,c.color||'#f43f5e',.34,48);playSfx('special',.46);return true
}
function kloppCopiedJ(a){if(!a?.copiedCharId||a.copiedT<=0||a.attackCd>0||a.hurtT>0)return false;a.kloppCopyLockT=.24;a.powerCd=normalPowerCooldown(a,a.copiedCharId);return invokeIslandKitAs(a,a.copiedCharId,false)}
function lkughIslandExtra(a,kind){if(!a||a.charId!=='lkugh'||a.attackCd>0||a.hurtT>0)return false;const t=nearestEnemy(a,1000);if(kind==='stars'){if((a.extra1Cd||0)>0||!t)return false;a.extra1Cd=3.8;a.attackCd=.55;a.attackT=.55;a.action='special';for(let i=0;i<7;i++){const delay=i*.055;setTimeout(()=>{if(!game||a.eliminated)return;const q=nearestEnemy(a,1000)||t;spawnProjectile(a,{x:q.x+(Math.random()-.5)*150,y:30-Math.random()*110,vx:0,vy:360+Math.random()*180,gravity:0,speed:0,damage:Math.max(3,a.normalDmg*.48*.14),knock:190,r:12,life:1.7,color:'#f5d0fe',effect:'star',kind:'star',label:'CHUVA ESTELAR'})},delay*1000)}addFx('meter',a.x,a.y+35,'#f5d0fe',.45,60);return true}if(kind==='blackhole'){if((a.extra2Cd||0)>0)return false;a.extra2Cd=6.5;a.attackCd=.65;a.attackT=.65;a.action='special';addArea({owner:a,x:a.x+(a.face||1)*150,y:a.y+55,rx:210,ry:155,life:2.8,damage:Math.max(.8,a.normalDmg*.14),knock:80,effect:'blackhole',color:'#c084fc',label:'BURACO NEGRO',tick:.45,pull:true,pierce:true});addFx('meter',a.x,a.y+35,'#c084fc',.55,72);return true}return false}
function powerAttack(a,superMove){
  if(a.attackCd>0||a.guard||a.freezeT>0||a.hurtT>0||a.proMove||a.signature)return;
  if(superMove?(a.specialCd||0)>0:(a.powerCd||0)>0)return;
  if(superMove&&a.meter<100){addFx('meter',a.x,a.y+20,'#facc15',.25,34);return}
  const effectiveId=a.charId==='frogh'&&a.copiedT>0&&a.copiedCharId?a.copiedCharId:a.charId;
  if(superMove)a.specialCd=normalSuperCooldown(a,effectiveId);else a.powerCd=normalPowerCooldown(a,effectiveId);
  if(effectiveId!==a.charId)return invokeIslandKitAs(a,effectiveId,superMove);
  if(a.charId==='ktrak')return ktrakIslandPower(a,superMove);
  if(a.charId==='jone')return joneIslandPower(a,superMove);
  if(a.charId==='laranja')return laranjaIslandPower(a,superMove);
  if(classicIslandPower(a,superMove))return;
  const [label,type,color,effect]=profileOf(a.charId);if(superMove){a.meter=0;a.superHitsDealt=0;a.superHitsTaken=0}a.attackCd=superMove?1.25:.68;a.attackT=superMove?.7:.42;a.action='special';a.powerLabel=label;const scale=superMove?1.8:1;
  if(type==='dash'){a.vx=a.face*(superMove?1050:720);a.invuln=superMove?.38:.12;const end=a.x+a.face*(superMove?260:150);addArea({owner:a,x:(a.x+end)/2,y:a.y+50,rx:superMove?210:120,ry:70,life:.18,damage:superMove?23:11,knock:superMove?650:390,effect,color,label})}
  else if(type==='beam'){spawnProjectile(a,{speed:superMove?980:760,damage:superMove?21:9,knock:superMove?600:330,r:superMove?25:13,life:superMove?1.5:1.15,color,effect,kind:'beam',pierce:superMove,label})}
  else if(type==='area'||type==='pull'||type==='smash'){const t=nearestEnemy(a),x=type==='smash'&&t?t.x:a.x+a.face*(superMove?95:55);addArea({owner:a,x,y:type==='smash'&&t?t.y+55:a.y+55,rx:superMove?230:125,ry:superMove?150:90,life:superMove?2.3:.72,damage:superMove?18:8,knock:superMove?560:300,effect:type==='pull'?'magnet':effect,color,label,tick:superMove?.42:.5,pull:type==='pull'})}
  else if(type==='element'){const elements=['water','stone','shock','burn','heal'],e=elements[a.powerIndex++%elements.length];if(e==='heal'){a.damage=Math.max(0,a.damage-(superMove?34:17));addFx('heal',a.x,a.y+40,'#4ade80',.65,85)}else if(e==='stone')addArea({owner:a,x:a.x+a.face*75,y:a.y+60,rx:superMove?210:105,ry:100,life:.35,damage:superMove?22:10,knock:superMove?620:380,effect:e,color:'#c4a878',label});else spawnProjectile(a,{speed:e==='shock'?920:620,damage:superMove?20:9,knock:superMove?570:320,r:superMove?24:14,life:1.45,color:e==='water'?'#67e8f9':e==='shock'?'#fef08a':'#fb923c',effect:e,kind:e,label,pierce:superMove})}
  else if(type==='copy'){const t=nearestEnemy(a),p=t?profileOf(t.charId):['ENERGIA COPIADA','shot',color,'copy'];spawnProjectile(a,{speed:superMove?850:650,damage:superMove?21:10,knock:superMove?590:340,r:superMove?27:15,life:1.4,color:p[2],effect:p[3],kind:'copy',pierce:superMove,label:`CÓPIA · ${p[0]}`})}
  else{spawnProjectile(a,{speed:type==='lob'?500:680,damage:superMove?22:10,knock:superMove?610:350,r:superMove?28:15,life:type==='lob'?2:1.4,color,effect,kind:type==='lob'?'bomb':effect,pierce:superMove,gravity:type==='lob'?480:0,vy:type==='lob'?-360:0,label})}
  if(superMove){game.banner=`${a.name.toUpperCase()} · ${label}`;game.bannerT=1;game.shake=8;playSfx('super',.7)}else playSfx('special',.5)
}

function variantPowerAttack(a,variant){
  if(!['down','up','air'].includes(variant)||a.attackCd>0||a.powerCd>0||a.guard||a.freezeT>0||a.hurtT>0||a.proMove||a.signature)return false;
  const [base,,baseColor,baseEffect]=profileOf(a.charId),target=nearestEnemy(a),dir=target?Math.sign(target.x-a.x)||a.face:a.face||1;
  const ktrak={water:['#4bdcff','water'],earth:['#d7a85f','stone'],fire:['#ff6a2d','burn'],air:['#d8f7ff','air'],lightning:['#5ab7ff','shock'],lava:['#ff7431','lavaPit'],heal:['#7ff0c8','heal']};
  const kain={flight:['#c7d0ff','air'],ice:['#8fdcff','freeze'],heal:['#9cf6c6','heal'],shock:['#a9b8ff','shock'],repel:['#d7dcff','bubble'],swap:['#c3a1ff','slow'],fire:['#ff765d','burn'],teleport:['#b8a3ff','warp'],drain:['#e893c0','drain'],gravity:['#a5b4fc','gravity']};
  let element=a.charId==='ktrak'?(a.ktrakElement||'water'):a.charId==='kain'?(a.kainPower||'flight'):a.charId==='jone'?((a.jonePowerIndex||0)%2?'hera':'scythe'):base;
  const [color,effect]=a.charId==='ktrak'?(ktrak[element]||ktrak.water):a.charId==='kain'?(kain[element]||kain.flight):a.charId==='jone'?(element==='scythe'?['#d7c7ae','scythe']:['#77e65d','jonePlague']):[baseColor,baseEffect];
  const names={down:'RASTEIRA',up:'ASCENSÃO',air:'MERGULHO'},label=`${element.toUpperCase()} · ${names[variant]}`;a.face=dir;a.attackCd=variant==='up'?.54:.46;a.attackT=.34;a.action='special';a.powerCd=normalPowerCooldown(a)*1.12;a.powerLabel=label;
  if(effect==='heal'){const amount=variant==='down'?14:variant==='up'?11:9;a.damage=Math.max(0,a.damage-amount);if(variant==='up'){a.poisonT=0;a.burnT=0;a.freezeT=0}if(variant==='air')a.vy=Math.min(a.vy,-220);addFx('heal',a.x,a.y+30,color,.48,variant==='down'?105:70);playSfx('special',.45);return true}
  if(a.charId==='jone'&&element==='scythe'){const range=variant==='down'?160:variant==='up'?125:115;for(const b of game.actors){if(!validTarget(a,b)||Math.abs(b.x-a.x)>range)continue;if(variant==='air'&&b.y<a.y-220)continue;if(variant==='up'&&b.y>a.y+48)continue;applyHit(b,a,variant==='up'?15:12,variant==='down'?330:230,variant==='up'?-560:variant==='air'?240:-120,'scythe')}addFx('dash',a.x+dir*65,a.y+25,color,.36,80,dir);playSfx('hit_heavy',.55);return true}
  if(variant==='down'){const poison=effect==='jonePlague',rapid=a.charId==='laranja';addArea({owner:a,x:a.x+dir*85,y:a.y+a.h-10,rx:rapid?155:poison?125:112,ry:poison?48:36,life:poison?2.4:rapid?.38:.26,damage:rapid?3.6:poison?1.4:8.5,knock:rapid?105:poison?55:260,effect:poison?'jonePlague':effect,color,label,tick:rapid?.11:poison?.32:.4,pierce:rapid||poison});addFx('dash',a.x+dir*85,a.y+a.h-10,color,.32,85,dir)}
  else if(variant==='up'){for(const b of game.actors){if(!validTarget(a,b)||Math.abs(b.x-a.x)>125||b.y>a.y+55||b.y<a.y-155)continue;applyHit(b,a,11.5,145,-530,effect)}if(a.charId==='laranja')a.vy=Math.min(a.vy,-520);addFx('hit',a.x+dir*38,a.y-55,color,.38,90,dir)}
  else{spawnProjectile(a,{x:a.x+dir*22,y:a.y+38,vx:dir*235,vy:520,gravity:780,damage:effect==='jonePlague'?7:9.5,knock:310,r:effect==='jonePlague'?20:16,life:1.15,color,effect:effect==='jonePlague'?'jone:acid':effect,kind:effect==='jonePlague'?'poison':'dive',label});addFx('dash',a.x,a.y+45,color,.32,66,dir)}
  playSfx('special',.5);return true
}

function classicIslandPower(a,superMove){
  const id=a.charId,t=nearestEnemy(a),dir=t?Math.sign(t.x-a.x)||a.face:a.face||1;a.face=dir;
  const useSuper=()=>{if(!superMove)return false;a.meter=0;a.superHitsDealt=0;a.superHitsTaken=0;game.bannerT=1;game.shake=Math.max(game.shake,7);playSfx('super',.72);return true};
  const sky=(count,color,damage,effect='energy',spread=70)=>{if(!t)return;for(let i=0;i<count;i++)spawnProjectile(a,{x:t.x+(i-(count-1)/2)*spread,y:55-i*28,vx:0,vy:160+i*25,gravity:1050,speed:0,damage,knock:360,r:16+(i%2)*4,life:1.5,color,effect,kind:effect==='stone'?'rock':'sky',label:'ATAQUE DO CÉU'})};
  const setCast=(cd=.62,tim=.42)=>{a.attackCd=cd;a.attackT=tim;a.action='special'};
  if(id==='flame'){if(useSuper()){setCast(1.05,.65);addArea({owner:a,x:a.x+dir*115,y:a.y+60,rx:42,ry:128,life:3,damage:1.25,knock:130,effect:'firewall',color:'#ff5a1f',label:'PAREDE DE FOGO',tick:.28,pierce:true});game.banner='FLAME · PAREDE DE FOGO'}else{setCast();spawnProjectile(a,{speed:720,damage:9.5,knock:340,r:18,life:1.5,color:'#ff5a1f',effect:'burn',kind:'fire',label:'BOLA DE FOGO'})}return true}
  if(id==='rojo'){if(useSuper()){setCast(1.15,.7);if(t){for(let i=0;i<5;i++)spawnProjectile(a,{x:t.x+(i-2)*58,y:65-i*20,vx:0,vy:250,gravity:950,speed:0,damage:7.2,knock:250,r:13,life:1.45,color:'#ef4444',effect:'blade',kind:'blade',label:'CHUVA DE LÂMINAS'})}game.banner='ROJO · CHUVA DE 5 LÂMINAS'}else{setCast(.48,.34);spawnProjectile(a,{speed:920,damage:8.2,knock:300,r:12,life:1.15,color:'#ef4444',effect:'blade',kind:'blade',label:'FACA'})}return true}
  if(id==='perry'){if(useSuper()){setCast(1.1,.65);sky(3,'#7c5d36',9.5,'stone',78);game.banner='PERRY · QUEDA DAS ÁRVORES'}else{setCast(.58,.38);for(const vy of[-145,0,145])spawnProjectile(a,{speed:650,vy,damage:4.1,knock:205,r:12,life:1.35,color:'#84cc16',effect:'leaf',kind:'leaf',label:'FOLHAS'})}return true}
  if(id==='verry'){if(useSuper()){setCast(1.1,.66);const x=t?t.x:a.x+dir*110;addArea({owner:a,x,y:(t?t.y+t.h:a.y+a.h)-8,rx:185,ry:44,life:4,damage:.65,knock:40,effect:'mudPool',color:'#8b5e34',label:'TERRENO DE LAMA',tick:.34,pierce:true});game.banner='VERRY · TERRENO DE LAMA'}else{setCast(.62,.38);spawnProjectile(a,{speed:610,damage:6.2,knock:210,r:17,life:1.4,color:'#8b5e34',effect:'mudLock',kind:'mud',label:'LAMA'})}return true}
  if(id==='hock'){if(useSuper()){setCast(1.3,.8);sky(5,'#a8a29e',9.2,'stone',86);game.banner='HOCK · QUEBRA-LUAS'}else{setCast(.72,.52);addArea({owner:a,x:a.x+dir*72,y:a.y+55,rx:100,ry:85,life:.15,damage:13.5,knock:590,effect:'hammer',color:'#ff9f1c',label:'MARTELO',tick:.2})}return true}
  if(id==='vlad'){if(useSuper()){setCast(1.05,.65);if(t){applyHit(t,a,10.5,230,-130,'drain');a.damage=Math.max(0,a.damage-10.5);t.slowT=Math.max(t.slowT,2);game.banner='VLAD · DRENO RUBRO'}}else{setCast(.54,.35);spawnProjectile(a,{speed:690,damage:7.2,knock:250,r:13,life:1.4,color:'#dc2626',effect:'drain',kind:'blood',label:'CUSPE DE SANGUE'})}return true}
  if(id==='thuvaa'){if(useSuper()){setCast(1.05,.65);spawnProjectile(a,{speed:650,damage:16,knock:510,r:34,life:2.2,color:'#67e8f9',effect:'freeze',kind:'water',pierce:true,label:'ORBE DE GELO'});game.banner='THUVAA · ORBE GLACIAL'}else{setCast(.5,.34);spawnProjectile(a,{speed:790,damage:6.5,knock:255,r:12,life:1.3,color:'#bae6fd',effect:'freeze',kind:'blade',label:'KUNAI DE GELO'})}return true}
  if(id==='trefoh'){if(useSuper()){setCast(1.05,.65);spawnProjectile(a,{speed:440,damage:14,knock:420,r:22,life:2.5,color:'#c084fc',effect:'nature',kind:'arcane',homing:true,targetId:t?.playerId,label:'CAJADO BUSCADOR'});game.banner='TREFOH · CAJADO BUSCADOR'}else{setCast(.56,.36);spawnProjectile(a,{speed:620,damage:8,knock:270,r:15,life:1.5,color:'#d8b4fe',effect:'nature',kind:'flower',label:'FLOR MÁGICA'})}return true}
  if(id==='xillen'){if(useSuper()){setCast(1.05,.62);if(t)addArea({owner:a,x:t.x,y:t.y+38,rx:48,ry:140,life:.18,damage:17,knock:540,effect:'shock',color:'#72f06a',label:'RAIO DO CÉU',tick:.2});game.banner='XILLEN · RAIO DO CÉU'}else{setCast(.5,.32);spawnProjectile(a,{speed:920,damage:8.2,knock:290,r:14,life:1.2,color:'#72f06a',effect:'shock',kind:'beam',label:'ENERGIA ALIEN'})}return true}
  if(id==='jimmy'){if(useSuper()){setCast(1.0,.55);a.flightT=5;a.flightStrikeT=.08;a.vy=-360;game.banner='JIMMY · VOO DO TROVÃO · 5s'}else{setCast(.58,.36);if(t)addArea({owner:a,x:t.x,y:t.y+35,rx:42,ry:150,life:.15,damage:10.5,knock:380,effect:'shock',color:'#60a5fa',label:'RAIO',tick:.2})}return true}
  if(id==='ytiri'){if(useSuper()){setCast(.95,.5);a.invuln=Math.max(a.invuln,3);if(t){a.copiedCharId=t.charId;a.copiedT=3}game.banner='YTIRI · ESPECTRO INVULNERÁVEL · 3s'}else{setCast(.58,.38);if(t){t.vx+=(a.x-t.x)*2.1;spawnProjectile(a,{speed:750,damage:7.5,knock:270,r:13,life:1.1,color:'#94a3b8',effect:'chain',kind:'chain',label:'CORRENTE'})}}return true}
  if(id==='grizz'){if(useSuper()){setCast(1.15,.65);a.invuln=Math.max(a.invuln,1.6);addArea({owner:a,x:a.x-dir*35,y:a.y+50,rx:75,ry:125,life:3.2,damage:1.1,knock:210,effect:'grizzWall',color:'#f59e0b',label:'PAREDE DO GRIZZ',tick:.6,pierce:true});game.banner='GRIZZ · PAREDE DO GRIZZ'}else{setCast(.58,.38);spawnProjectile(a,{speed:900,damage:9,knock:320,r:12,life:1.25,color:'#f59e0b',effect:'laser',kind:'beam',label:'LASER OCULAR'})}return true}
  if(id==='grogh'){if(useSuper()){setCast(1.0,.6);spawnProjectile(a,{speed:900,damage:18,knock:580,r:26,life:1.5,color:'#22d3ee',effect:'reflect',kind:'beam',pierce:true,label:'ENERGIA REFLETIDA'});game.banner='GROGH · DEVOLUÇÃO DE ENERGIA'}else{setCast(.58,.38);spawnProjectile(a,{speed:700,damage:8,knock:290,r:15,life:1.45,color:'#22d3ee',effect:'energy',kind:'shot',label:'ENERGIA'})}return true}
  if(id==='dart'){const options=['wind','wall','fire','heal'];if(useSuper()){setCast(1.1,.7);spawnProjectile(a,{speed:840,damage:7,knock:460,r:20,life:1.3,color:'#d8f7ff',effect:'air',kind:'wind'});addArea({owner:a,x:a.x+dir*90,y:a.y+55,rx:45,ry:120,life:2.4,damage:1.3,knock:160,effect:'firewall',color:'#fb923c',tick:.34,pierce:true});a.damage=Math.max(0,a.damage-20);game.banner='DART · QUATRO ELEMENTOS'}else{setCast(.55,.36);const pick=options[a.powerIndex++%options.length];if(pick==='wind')spawnProjectile(a,{speed:820,damage:7,knock:480,r:20,life:1.3,color:'#d8f7ff',effect:'air',kind:'wind'});else if(pick==='wall')addArea({owner:a,x:a.x+dir*80,y:a.y+55,rx:36,ry:105,life:2.2,damage:.8,knock:180,effect:'wall',color:'#a78bfa',tick:.55,pierce:true});else if(pick==='fire')spawnProjectile(a,{speed:700,damage:8,knock:280,r:17,life:1.4,color:'#fb923c',effect:'burn',kind:'fire'});else{a.damage=Math.max(0,a.damage-14);addFx('heal',a.x,a.y+45,'#4ade80',.5,60)}}return true}
  if(id==='lkugh'){if(useSuper()){setCast(1.1,.65);spawnProjectile(a,{speed:390,damage:14,knock:510,r:36,life:3,color:'#c4b5fd',effect:'moon',kind:'moon',homing:true,targetId:t?.playerId,label:'LUA PERSEGUIDORA'});game.banner='LKUGH · LUA PERSEGUIDORA'}else{setCast(.55,.36);spawnProjectile(a,{speed:510,vy:-320,gravity:650,damage:10,knock:380,r:18,life:2,color:'#8b5cf6',effect:'bomb',kind:'bomb',explode:{rx:100,ry:90,life:.2,damage:9,knock:420,effect:'bomb',color:'#8b5cf6',tick:.2},label:'BOMBA LUNAR'})}return true}
  if(id==='jetde'){if(useSuper()){setCast(.9,.5);a.absorbT=3;a.invuln=Math.max(a.invuln,.35);game.banner='JETDE · BOLHA ABSORVENTE · 3s'}else{setCast(.6,.38);addArea({owner:a,x:a.x+dir*55,y:a.y+50,rx:92,ry:92,life:1,damage:4,knock:650,effect:'bubble',color:'#22d3ee',label:'BOLHA REPELENTE',tick:.5})}return true}
  if(id==='uiye'){
    const copy=a.copiedT>0&&a.copiedCharId;if(copy&&!['uiye','klopp'].includes(copy)){const save=a.charId;a.charId=copy;const handled=classicIslandPower(a,superMove);a.charId=save;if(handled)return true}
    if(useSuper()){setCast(.9,.5);const tt=nearestEnemy(a);if(tt){a.copiedCharId=tt.charId;a.copiedT=3;game.banner=`UIYE · CÓPIA ${charById(tt.charId).name.toUpperCase()} · 3s`}}else{setCast(.54,.34);spawnProjectile(a,{speed:690,damage:8.5,knock:340,r:18,life:1.5,color:'#a89682',effect:'stone',kind:'rock',label:'PEDRA'})}return true
  }
  if(id==='ouip'){if(useSuper()){setCast(1.15,.7);sky(4,'#fb923c',10.2,'stone',92);game.banner='OUIP · CHUVA DE METEOROS'}else{setCast(.62,.4);if(t){for(let i=0;i<3;i++)spawnProjectile(a,{x:t.x+(i-1)*45,y:80-i*25,vx:0,vy:180,gravity:850,speed:0,damage:4.2,knock:180,r:10,life:1.4,color:'#a3e635',effect:'poison',kind:'poison',label:'CHUVA ÁCIDA'})}}return true}
  if(id==='atizz'){if(useSuper()){setCast(.92,.58);if(t){a.x=clamp(t.x-dir*88,30,WORLD_W-30);a.face=dir;applyHit(t,a,18,620,-360,'glitch');addFx('dash',a.x,a.y+48,'#22d3ee',.4,90)}game.banner='ATIZZ · RASGO TEMPORAL'}else{setCast(.5,.32);a.vx=dir*780;addArea({owner:a,x:a.x+dir*75,y:a.y+50,rx:110,ry:82,life:.14,damage:10,knock:400,effect:'glitch',color:'#22d3ee',label:'CORTE PIXELADO',tick:.2})}return true}
  if(id==='yoi'){if(useSuper()){setCast(1.05,.65);addArea({owner:a,x:t?t.x:a.x,y:t?t.y+45:a.y+45,rx:260,ry:170,life:2.8,damage:2.1,knock:170,effect:'slow',color:'#8b5cf6',label:'ECLIPSE TOTAL',tick:.34,pierce:true});game.banner='YOI · ECLIPSE TOTAL'}else{setCast(.55,.35);for(const vy of[-55,55])spawnProjectile(a,{speed:720,vy,damage:5,knock:240,r:13,life:1.3,color:'#b86bff',effect:'slow',kind:'blade',label:'LEQUE LUNAR'})}return true}
  if(id==='rtess'){if(useSuper()){setCast(1.1,.7);addArea({owner:a,x:a.x,y:a.y+55,rx:330,ry:190,life:3,damage:2.4,knock:180,effect:'magnet',color:'#fb923c',label:'TEMPESTADE DE POLARIDADE',tick:.36,pull:true,pierce:true});game.banner='RTESS · TEMPESTADE DE POLARIDADE'}else{setCast(.62,.42);if(t){t.vx+=(a.x-t.x)*3.2;if(Math.abs(t.x-a.x)<180)applyHit(t,a,10.5,460,-180,'magnet')}}return true}
  if(id==='klo'){if(useSuper()){setCast(1.05,.65);const x=t?t.x:a.x+dir*140;addArea({owner:a,x,y:t?t.y+t.h-8:a.y+a.h-8,rx:120,ry:48,life:3.4,damage:1.6,knock:80,effect:'quantumHole',color:'#39ff88',label:'BURACO QUÂNTICO',tick:.28,pierce:true});game.banner='KLO · BURACO QUÂNTICO'}else{setCast(.55,.35);spawnProjectile(a,{speed:760,damage:9,knock:350,r:14,life:1.45,color:'#39ff88',effect:'warp',kind:'spear',label:'LANÇA QUÂNTICA'})}return true}
  if(id==='klopp'){
    if(!superMove)return kloppTransformIsland(a);
    if(!a.copiedCharId||a.copiedT<=0){addFx('meter',a.x,a.y+25,'#f43f5e',.24,30);return true}
    useSuper();const copied=a.copiedCharId,ok=invokeIslandKitAs(a,copied,true);a.specialCd=Math.max(a.specialCd,4.8);if(ok){game.banner=`KLOPP · SUPER DE ${charById(copied).name.toUpperCase()}`;game.bannerT=.8}return true
  }
  if(id==='knunka'){if(useSuper()){setCast(1.05,.65);const x=t?t.x:a.x+dir*120;addArea({owner:a,x,y:t?t.y+50:a.y+50,rx:160,ry:115,life:5,damage:1.15,knock:110,effect:'blackfire',color:'#111827',label:'FOGO NEGRO',tick:.35,pierce:true});game.banner='KNUNKA · FOGO NEGRO · 5s'}else{setCast(.52,.34);if(t){a.x=clamp(t.x-dir*115,30,WORLD_W-30);a.face=dir}spawnProjectile(a,{speed:1050,damage:10.2,knock:420,r:14,life:.8,color:'#60a5fa',effect:'shock',kind:'lightningBeam',fixedToOwner:true,beamLength:360,life:.22,dir:a.face,label:'RAIO AZUL'})}return true}
  if(id==='nine85'){if(useSuper()){setCast(1.1,.7);addArea({owner:a,x:t?t.x:a.x+dir*100,y:t?t.y+50:a.y+50,rx:210,ry:155,life:1.3,damage:5.2,knock:300,effect:'system',color:'#67e8f9',label:'SYSTEM CRASH',tick:.28,pierce:true});game.banner='985 · SYSTEM CRASH'}else{setCast(.58,.38);spawnProjectile(a,{speed:880,damage:10,knock:380,r:14,life:1.4,color:'#67e8f9',effect:'system',kind:'spear',pierce:true,label:'LANÇA DE DADOS'})}return true}
  if(id==='priya'){
    if(useSuper()){setCast(1.05,.65);for(let i=0;i<6;i++)spawnProjectile(a,{speed:1000+i*25,vy:(i-2.5)*22,damage:i===5?12:5.4,knock:i===5?430:190,r:i===5?15:9,life:1.3,color:i===5?'#ffe06d':'#ffd7a8',effect:'bullet',kind:i===5?'bomb':'bullet',label:'RAJADA TÁTICA'});game.banner='PRIYA · RAJADA TÁTICA'}else{setCast(.38,.27);a.priyaCount=((a.priyaCount||0)%3)+1;const ex=a.priyaCount===3;spawnProjectile(a,{speed:ex?1120:1040,damage:ex?11:7,knock:ex?400:250,r:ex?14:9,life:1.2,color:ex?'#ffe06d':'#ffcf9e',effect:'bullet',kind:ex?'bomb':'bullet',label:ex?'3º TIRO EXPLOSIVO':'RIFLE'})}return true
  }
  if(id==='aria'){
    if(useSuper()){setCast(1.1,.68);const x=t?t.x:a.x+dir*120;addArea({owner:a,x,y:t?t.y+55:a.y+55,rx:175,ry:125,life:3,damage:1.2,knock:100,effect:'ariaGarden',color:'#82efa5',label:'JARDIM VIVO',tick:.38,pierce:true});game.banner='ARIA · PRISÃO VERDANTE'}else{setCast(.48,.32);const m=(a.ariaMode||0)%3;a.ariaMode=m+1;if(m===0){for(const vy of[-90,0,90])spawnProjectile(a,{speed:720,vy,damage:3.8,knock:180,r:10,life:1.25,color:'#82efa5',effect:'leaf',kind:'leaf'})}else if(m===1)spawnProjectile(a,{speed:650,damage:7.5,knock:220,r:15,life:1.4,color:'#b8ff8c',effect:'poison',kind:'poison',label:'SEMENTE VENENOSA'});else spawnProjectile(a,{speed:590,damage:8,knock:260,r:16,life:1.25,color:'#62e879',effect:'slow',kind:'groundwave',label:'RAIZ SELVAGEM'})}return true
  }
  if(id==='leo'){
    if(useSuper()){setCast(1.15,.72);if(t){for(let i=0;i<8;i++)spawnProjectile(a,{x:t.x+((i%4)-1.5)*70,y:50-(i%3)*22,vx:(i%2?1:-1)*80,vy:170,gravity:980,speed:0,damage:5.4,knock:230,r:12+(i%2)*4,life:1.7,color:'#67f3b8',effect:'warp',kind:i%2?'blade':'rock',label:'COLAPSO DE PORTAIS'})}game.banner='LEO · COLAPSO DE PORTAIS'}else{setCast(.5,.34);spawnProjectile(a,{speed:760,damage:7.4,knock:280,r:16,life:1.45,color:'#67f3b8',effect:'stone',kind:'rock',label:'PEDRA'});if(t)spawnProjectile(a,{x:a.x+dir*50,y:a.y+45,speed:600,damage:6.4,knock:260,r:14,life:1.8,color:'#9affd8',effect:'warp',kind:'rock',homing:true,targetId:t.playerId,label:'PEDRA VIA PORTAL'})}return true
  }
  if(id==='tharoth'){
    if(useSuper()){setCast(1.1,.68);if(t){addArea({owner:a,x:t.x-75,y:t.y+45,rx:90,ry:110,life:2.8,damage:1.8,knock:190,effect:'shadowClone',color:'#7f1d4e',label:'ECO DA ESCURIDÃO',tick:.36,pierce:true});addArea({owner:a,x:t.x+75,y:t.y+45,rx:90,ry:110,life:2.8,damage:1.8,knock:190,effect:'shadowClone',color:'#4c1d3f',label:'CLONE DE SOMBRA',tick:.36,pierce:true})}game.banner='THAROTH · CLONE DE SOMBRA'}else{setCast(.52,.35);spawnProjectile(a,{speed:760,damage:8.2,knock:290,r:17,life:1.4,color:'#6b5268',effect:'slow',kind:'shadow',homing:true,targetId:t?.playerId,label:'AREIA SOMBRIA'})}return true
  }
  if(id==='kain'){
    const powers=['flight','ice','heal','shock','repel','swap','fire','teleport','drain','gravity'];let power=a.kainPower||powers[a.kainPowerIndex||0]||'flight';
    if(useSuper()){setCast(1.25,.72);const powers=['flight','ice','heal','shock','repel','swap','fire','teleport','drain','gravity'],oldPower=a.kainPower,oldIndex=a.kainPowerIndex,random=powers[Math.floor(Math.random()*powers.length)];a.kainPower=random;a.kainPowerIndex=powers.indexOf(random);const meterAfter=a.meter;classicIslandPower(a,false);a.kainPower=oldPower;a.kainPowerIndex=oldIndex;a.meter=meterAfter;a.specialCd=7.1;if(t&&t.charId!=='kain'&&!['frogh','klopp','ztaaa'].includes(t.charId)){const hold={meter:a.meter,dealt:a.superHitsDealt,taken:a.superHitsTaken};invokeIslandKitAs(a,t.charId,true);a.meter=hold.meter;a.superHitsDealt=hold.dealt;a.superHitsTaken=hold.taken;a.specialCd=7.1}game.banner=`KAIN · ESPELHO ABISSAL · ${random.toUpperCase()} + SUPER DO RIVAL`;game.bannerT=1.0;return true}
    setCast(.62,.4);
    if(power==='flight'){a.kainFlightT=3.7;a.vy=-180;a.onGround=false;addFx('meter',a.x,a.y+45,'#c7d0df',.5,60)}
    else if(power==='ice')spawnProjectile(a,{speed:820,damage:9,knock:340,r:18,life:1.45,color:'#bdeaff',effect:'freeze',kind:'water'});
    else if(power==='heal'){a.damage=Math.max(0,a.damage-13);addFx('heal',a.x,a.y+45,'#73ffae',.55,70)}
    else if(power==='shock'&&t)addArea({owner:a,x:t.x,y:t.y+40,rx:46,ry:140,life:.15,damage:11,knock:390,effect:'shock',color:'#fff079',tick:.2});
    else if(power==='repel'){a.kainRepelT=1.75;addArea({owner:a,x:a.x,y:a.y+50,rx:130,ry:120,life:1.75,damage:0,knock:720,effect:'bubble',color:'#dce2ff',tick:.5,pierce:true})}
    else if(power==='swap'&&t){t.kainControlSwapT=Math.max(t.kainControlSwapT||0,3.5);addFx('meter',t.x,t.y+40,'#d58cff',.5,65)}
    else if(power==='fire')spawnProjectile(a,{speed:900,damage:9,knock:330,r:18,life:1.45,color:'#ff8a54',effect:'burn',kind:'fire'});
    else if(power==='teleport'&&t){a.x=clamp(t.x-dir*86,30,WORLD_W-30);applyHit(t,a,8,330,-150,'warp')}
    else if(power==='drain'&&t){applyHit(t,a,9,230,-110,'drain');a.damage=Math.max(0,a.damage-7)}
    else if(power==='gravity'&&t)addArea({owner:a,x:t.x,y:t.y+50,rx:180,ry:150,life:1.8,damage:1.5,knock:90,effect:'gravity',color:'#727cff',label:'GRAVIDADE',tick:.3,pull:true,pierce:true});
    game.banner=`KAIN · ${power.toUpperCase()}`;game.bannerT=.55;return true
  }
  if(id==='frogh'){
    if(useSuper()){setCast(1.1,.65);const pool=allCharacters().filter(c=>!['frogh','ztaaa'].includes(c.id));const c=pool[Math.floor(Math.random()*Math.max(1,pool.length))];if(c){a.copiedCharId=c.id;a.copiedT=5;a.damage=0;game.banner=`FROGH · FORMA ${c.name.toUpperCase()} · 5s · CURA TOTAL`;game.bannerT=1}return true}
    if(t&&t.charId!=='frogh'){const copied=t.charId,saved={meter:a.meter,dealt:a.superHitsDealt,taken:a.superHitsTaken,specialCd:a.specialCd,powerCd:a.powerCd};invokeIslandKitAs(a,copied,false);a.attackCd=Math.max(a.attackCd,.75);a.powerCd=.75;const atkCd=a.attackCd;a.attackCd=0;invokeIslandKitAs(a,copied,true);a.meter=saved.meter;a.superHitsDealt=saved.dealt;a.superHitsTaken=saved.taken;a.specialCd=Math.max(saved.specialCd,4.5);a.powerCd=Math.max(a.powerCd,.75);a.attackCd=Math.max(atkCd,a.attackCd);game.banner=`FROGH · ${charById(copied).name.toUpperCase()} · J + L`;game.bannerT=.9;return true}return false
  }
  return false
}
function ktrakIslandPower(a,superMove){
  const els=['water','earth','fire','air','lightning','lava','heal'],element=a.ktrakElement||els[a.ktrakElementIndex||0],target=nearestEnemy(a),dir=target?Math.sign(target.x-a.x)||a.face:a.face||1;a.face=dir;
  if(superMove){a.meter=0;a.superHitsDealt=0;a.superHitsTaken=0;a.ktrakAvatarT=8;a.ktrakAvatarIntroT=.82;a.attackCd=.82;a.attackT=.82;a.action='special';game.banner=`${a.name.toUpperCase()} · MODO AVATAR SUPREMO · 8s`;game.bannerT=1.15;addFx('meter',a.x,a.y+45,'#75e9ff',.82,110);playSfx('super',.85);return}
  const avatar=a.ktrakAvatarT>0,mul=avatar?1.36:1;a.attackCd=(element==='earth'||element==='lava') ? .88 : .52;a.attackT=.42;a.action='special';a.powerLabel=(avatar?'AVATAR · ':'')+element.toUpperCase();
  if(element==='heal'){
    // Cura exatamente o último dano recebido; no Avatar soma 45% do último dano causado e regenera 20% do total.
    const taken=Math.max(.8,a.lastDamageTaken||0),bonus=avatar?Math.max(.4,(a.lastDamageDealt||0)*.45):0,instant=taken+bonus;a.damage=Math.max(0,a.damage-instant);addFx('heal',a.x,a.y+45,'#7ff0c8',.8,95);
    if(avatar){a.ktrakHealT=3.2;a.ktrakHealTick=.34;a.ktrakHealAmount=Math.max(.6,instant*.20);a.burnT=0;game.banner='AVATAR · NASCENTE DE CURA';game.bannerT=.8}
    return
  }
  if(element==='lava'){const x=target?target.x:a.x+dir*150;addArea({owner:a,x,y:target?target.y+target.h-12:a.y+a.h-12,rx:avatar?105:84,ry:34,life:avatar?7:9999,damage:avatar?2.8:2.0,knock:80,effect:'lavaPit',color:'#ff7431',label:'LAVA',tick:avatar?.22:.30});game.banner=avatar?'AVATAR · ABISMO DE LAVA · 7s':'LAVA · FENDA PERSISTENTE';game.bannerT=.8;return}
  if(element==='earth'){
    const tx=target?target.x:a.x+dir*150,ty=target?target.y+target.h-18:a.y+a.h-18;
    spawnProjectile(a,{speed:760,damage:(avatar?18:12)*mul,knock:avatar?620:430,r:avatar?34:27,life:2,color:'#d7a85f',effect:'stone',kind:'rock',label:'TERRA'});
    if(avatar)addArea({owner:a,x:tx,y:ty,rx:150,ry:100,life:.42,damage:12,knock:660,effect:'earthCrush',color:'#c69a5b',label:'AVATAR · ESMAGAMENTO DE TERRA',tick:.45});
    damageBridges(tx,ty,avatar?34:14,avatar?145:90);return
  }
  if(element==='water'){spawnProjectile(a,{speed:avatar?940:810,damage:(avatar?13:8)*mul,knock:avatar?540:320,r:avatar?52:34,life:avatar?2.0:1.62,color:'#4bdcff',effect:avatar?'freeze4':'water',kind:'water',pierce:avatar,label:'ÁGUA'});return}
  if(element==='fire'){
    if(avatar){for(let seg=0;seg<3;seg++)addArea({owner:a,x:seg*CW+CW/2,y:600,rx:CW*.47,ry:125,life:4.8,damage:1.35,knock:0,effect:'avatarFire',color:'#ff5a24',label:'AVATAR · INFERNO',tick:.34,pierce:true});game.banner='AVATAR · INFERNO DA ILHA';game.bannerT=.9;return}
    spawnProjectile(a,{speed:890,damage:5.6*mul,knock:320,r:18,life:1.62,color:'#ff6a2d',effect:'burn',kind:'fire',label:'FOGO'});return
  }
  if(element==='air'){
    if(avatar){const x=target?target.x:a.x+dir*210,y=target?target.y+50:a.y+50;addArea({owner:a,x,y,rx:175,ry:150,life:2.6,damage:2.2,knock:440,effect:'avatarTornado',color:'#d8f7ff',label:'AVATAR · TORNADO',tick:.22,pierce:true});game.banner='AVATAR · TORNADO';game.bannerT=.75;return}
    spawnProjectile(a,{speed:1030,damage:8.2*mul,knock:500,r:34,life:1.62,color:'#d8f7ff',effect:'air',kind:'wind',label:'AR'});return
  }
  if(element==='lightning'){a.attackCd=avatar?.72:.50;a.attackT=avatar?.68:.31;a.ktrakLightningChargeT=.20;a.signature={type:'ktrakLightning',t:0,fired:false,avatar,dir,targetId:target?.playerId||null};a.powerLabel=(avatar?'AVATAR · ':'')+'RAIO AZUL';return}
}
function joneIslandPower(a,superMove){
  const target=nearestEnemy(a),dir=target?Math.sign(target.x-a.x)||a.face:a.face||1;a.face=dir;
  if(superMove){a.meter=0;a.superHitsDealt=0;a.superHitsTaken=0;a.attackCd=1.05;a.attackT=.75;a.action='special';spawnProjectile(a,{speed:420,vy:-360,gravity:900,damage:0,knock:0,r:17,life:.72,color:'#86ff58',effect:'poison',kind:'joneBomb',label:'JARDIM MORTAL',explode:{rx:280,ry:135,life:7.4,damage:Math.max(1,(a.normalDmg||45)*.34*.10),knock:0,effect:'jonePlague',color:'#86ff58',tick:.27}});game.banner='JONE · JARDIM MORTAL · DANO + CURA';game.bannerT=1;playSfx('super',.75);return}
  if((a.jonePowerIndex||0)%2===0){a.attackCd=.54;a.attackT=.42;a.action='special';a.powerLabel='CORTE DA MORTE';let hit=false;for(const b of game.actors){if(validTarget(a,b)&&Math.abs(b.x-a.x)<118&&Math.abs((b.y+b.h/2)-(a.y+a.h/2))<82){hit=applyHit(b,a,Math.max(12,(a.normalDmg||45)*.44),440,-250,'scythe')||hit}}addFx(hit?'hit':'dash',a.x+dir*54,a.y+a.h*.5,'#d7c7ae',.30,58,dir);playSfx('hit_heavy',.62);return}
  const kind='deep',impact=Math.max(7,(a.normalDmg||45)*.23);a.attackCd=.48;a.attackT=.35;a.action='special';spawnProjectile(a,{speed:720,damage:impact,knock:290,r:13,life:1.6,color:'#52e6ad',effect:'jone:'+kind,kind:'poison',label:'BEIJO DA HERA'});a.powerLabel='BEIJO DA HERA';playSfx('special',.5)
}
function laranjaIslandPower(a,superMove){
  const target=nearestEnemy(a,700);if(!target)return;const dir=Math.sign(target.x-a.x)||a.face||1;a.face=dir;
  if(superMove){a.meter=0;a.superHitsDealt=0;a.superHitsTaken=0;a.attackCd=.65;a.attackT=.55;a.action='special';a.signature={type:'laranjaSuper',t:0,mask:0,targetId:target.playerId,startX:a.x,dir};a.proMove={kind:'kick',time:0,duration:.52,start:.05,end:.44,hit:true,dir};game.banner='LARANJA · RUPTURA HIPERSÔNICA ×3';game.bannerT=1;playSfx('super',.8);return}
  a.attackCd=.46;a.attackT=.40;a.action='punch';a.signature={type:'laranjaCombo',t:0,mask:0,targetId:target.playerId};a.proMove={kind:'punch',time:0,duration:.40,start:.04,end:.34,hit:true,dir};playSfx('special',.5)
}
function explodeProjectile(q){if(q.exploded||!q.explode)return;q.exploded=true;const owner=game.actors.find(a=>a.playerId===q.ownerId);if(!owner)return;if(q.kind==='joneBomb'){for(const a of game.actors){if(validTarget(owner,a)&&Math.abs(a.x-q.x)<q.explode.rx*.75&&Math.abs((a.y+a.h/2)-q.y)<q.explode.ry*1.15){applyHit(a,owner,15,390,-220,'jone:plague')}}}addArea({owner,x:q.x,y:q.y,rx:q.explode.rx,ry:q.explode.ry,life:q.explode.life,damage:q.explode.damage,knock:q.explode.knock,effect:q.explode.effect,color:q.explode.color,label:q.label,tick:q.explode.tick});addFx('hit',q.x,q.y,q.explode.color,.42,88)}
function spawnProjectile(owner,cfg){game.projectiles.push({id:Math.random().toString(36).slice(2),ownerId:owner.playerId,team:owner.team,x:cfg.x??(owner.x+owner.face*35),y:cfg.y??(owner.y+45),vx:cfg.vx??(owner.face*(cfg.speed||0)),vy:cfg.vy||0,gravity:cfg.gravity||0,life:cfg.life||1.4,maxLife:cfg.life||1.4,r:cfg.r||14,damage:cfg.damage||9,knock:cfg.knock||320,color:cfg.color||owner.color,effect:cfg.effect||'energy',kind:cfg.kind||'shot',pierce:!!cfg.pierce,progressive:!!cfg.progressive,tick:cfg.tick||.11,tickT:0,explode:cfg.explode||null,exploded:false,hit:[],label:cfg.label||'',fixedToOwner:!!cfg.fixedToOwner,beamLength:cfg.beamLength||0,dir:cfg.dir||owner.face||1,homing:!!cfg.homing,targetId:cfg.targetId||null})}
function addArea(z){game.areas.push({...z,id:Math.random().toString(36).slice(2),maxLife:z.life,tick:z.tick||.22,tickT:0,hit:[]})}
function damageBridges(x,y,amount,range=50){if(game?.rules?.bridges===false)return;for(const b of game.bridges){if(b.brokenT>0)continue;if(Math.abs(x-(b.x+b.w/2))<b.w/2+range&&Math.abs(y-b.y)<80){b.hp-=amount;if(b.hp<=0){b.hp=0;b.brokenT=12;game.banner='PONTE DESTRUÍDA';game.bannerT=.7;game.shake=9;addFx('bridge',b.x+b.w/2,b.y,'#f97316',.8,115);playSfx('hit_heavy',.65);addArenaFeed('Uma ponte foi destruída · volta em 12s')}}}}
function applyHit(target,owner,damage,knockX,knockY,effect){if((target.proKnockdownT||0)>0&&target.onGround&&effect!=='kick')return false;if(target.invuln>0||target.respawnT>0||target.eliminated)return false;if((target.kainRepelT||0)>0&&owner&&owner!==target){owner.vx-=Math.sign(target.x-owner.x||1)*520;owner.vy=Math.min(owner.vy,-180);addFx('meter',target.x,target.y+45,'#dce2ff',.25,54);return false}if(target.absorbT>0&&owner&&owner!==target){target.absorbT=0;directDamage(owner,target,Math.max(3,damage*.72),-Math.sign(owner.x-target.x)*160,-90,'reflect');target.damage=Math.max(0,target.damage-Math.min(4,damage*.25));addFx('meter',target.x,target.y+45,'#67e8f9',.35,56);return false}const dir=Math.sign(target.x-owner.x)||owner.face||1,guard=target.guard?.28:1,avatarMul=owner.charId==='ktrak'&&owner.ktrakAvatarT>0?2:1,bossGuard=target.boss?.62:1,final=damage*guard*avatarMul*bossGuard;target.damage=clamp(target.damage+final,0,999);target.lastDamageTaken=final;if(owner)owner.lastDamageDealt=final;let scale=.72+target.damage/105;if(target.boss)scale*=.62;if(target.guard){knockX*=.28;knockY*=.25}else target.hurtT=Math.max(target.hurtT,.16);target.vx+=dir*knockX*scale;target.vy+=knockY*scale;target.onGround=false;target.lastHitBy=owner.playerId;owner.superHitsDealt=(owner.superHitsDealt||0)+1;target.superHitsTaken=(target.superHitsTaken||0)+1;refreshSuperMeter(owner);refreshSuperMeter(target);applyEffect(target,owner,effect);addFx('hit',target.x,target.y+50,owner.color,.24,35+damage*1.2,dir);game.shake=Math.max(game.shake,damage>16?8:3);return true}
function directDamage(target,owner,damage,kx,ky,effect){const mul=owner?.charId==='ktrak'&&owner.ktrakAvatarT>0?2:1,final=damage*mul;target.damage=clamp(target.damage+final,0,999);target.lastDamageTaken=final;if(owner)owner.lastDamageDealt=final;if(kx||ky){target.vx+=kx;target.vy+=ky}addFx(effect,target.x,target.y+45,effect==='poison'?'#8cff61':'#fb923c',.18,20)}
function applyEffect(t,o,e){if(e==='freeze')t.freezeT=Math.max(t.freezeT,1.05);if(e==='freeze4')t.freezeT=Math.max(t.freezeT,4);if(String(e).startsWith('jone:'))applyJonePoison(t,o,String(e).split(':')[1]);if(e==='poison')t.poisonT=Math.max(t.poisonT,4);if(e==='burn'||e==='blackfire')t.burnT=Math.max(t.burnT,e==='blackfire'?5:3.6);if(e==='slow'||e==='glitch'||e==='system')t.slowT=Math.max(t.slowT,2.4);if(e==='mudLock')t.attackLockT=Math.max(t.attackLockT,.5);if(e==='mudPool'){t.slowT=Math.max(t.slowT,.7);t.noJumpT=Math.max(t.noJumpT,.7)}if(e==='drain'&&o)o.damage=Math.max(0,o.damage-4);if(e==='magnet'&&o)t.vx+=(o.x-t.x)*2.2;if(e==='warp'){t.x=clamp(t.x+(Math.random()-.5)*180,30,WORLD_W-30);t.invuln=.12}if(e==='shock')t.freezeT=Math.max(t.freezeT,.28)}
function updateProjectiles(dt){
  for(const q of game.projectiles){
    q.life-=dt;q.tickT=Math.max(0,(q.tickT||0)-dt);const owner=game.actors.find(a=>a.playerId===q.ownerId);
    if(q.homing&&q.targetId){const ht=game.actors.find(a=>a.playerId===q.targetId&&!a.eliminated);if(ht){const want=Math.sign(ht.x-q.x)||Math.sign(q.vx)||1;q.vx+=(want*Math.max(360,Math.abs(q.vx))-q.vx)*Math.min(1,dt*5.5);q.vy+=((ht.y+45-q.y)*2.4-q.vy)*Math.min(1,dt*3.2)}}
    if(q.fixedToOwner&&owner){q.x=owner.x+(q.dir||owner.face||1)*38;q.y=owner.y+43;q.vx=0;q.vy=0}else{q.vy+=q.gravity*dt;q.x+=q.vx*dt;q.y+=q.vy*dt}
    if(q.kind==='lightningBeam'){
      if(owner){const dir=q.dir||owner.face||1,len=q.beamLength||600;for(const a of game.actors){if(!validTarget(owner,a))continue;if(!q.progressive&&q.hit.includes(a.playerId))continue;if(q.progressive&&q.tickT>0)continue;const dx=(a.x-q.x)*dir;if(dx<0||dx>len||Math.abs((a.y+a.h/2)-q.y)>88)continue;if(applyHit(a,owner,q.damage,q.knock,-90,q.effect)){if(q.progressive)q.tickT=q.tick;else q.hit.push(a.playerId)}}damageBridges(q.x+dir*len*.55,q.y,q.damage*.45,len*.48)}
      continue
    }
    damageBridges(q.x,q.y,q.damage*.3,q.r);
    for(const a of game.actors){if(!owner||!validTarget(owner,a))continue;if(!q.progressive&&q.hit.includes(a.playerId))continue;if(q.progressive&&q.tickT>0)continue;if(Math.abs(a.x-q.x)<a.w/2+q.r&&Math.abs(a.y+a.h/2-q.y)<a.h/2+q.r){if(applyHit(a,owner,q.damage,q.knock,q.kind==='bomb'||q.kind==='joneBomb'?-420:-180,q.effect)){if(q.progressive)q.tickT=q.tick;else q.hit.push(a.playerId);if(!q.pierce&&!q.progressive){if(q.explode)explodeProjectile(q);q.life=0}}}}
    if(q.kind==='joneBomb'&&q.y>=610-q.r){explodeProjectile(q);q.life=0}if(q.life<=0&&q.explode)explodeProjectile(q);if(q.x<-80||q.x>WORLD_W+80||q.y>CH+80)q.life=0
  }
  game.projectiles=game.projectiles.filter(q=>q.life>0)
}
function updateAreas(dt){
  for(const z of game.areas){
    if(z.life<9000)z.life-=dt;z.tickT-=dt;
    if(z.pull){for(const a of game.actors){const o=game.actors.find(x=>x.playerId===z.owner.playerId)||z.owner;if(validTarget(o,a)&&Math.abs(a.x-z.x)<z.rx*1.25&&Math.abs(a.y-z.y)<z.ry*1.3)a.vx+=(z.x-a.x)*dt*5}}
    if(z.tickT<=0){z.tickT=z.tick;const owner=game.actors.find(a=>a.playerId===z.owner.playerId)||z.owner;if(z.effect==='jonePlague'&&owner&&!owner.eliminated&&Math.abs(owner.x-z.x)<z.rx&&Math.abs(owner.y+owner.h/2-z.y)<z.ry){owner.damage=Math.max(0,owner.damage-2.8);addFx('heal',owner.x,owner.y+owner.h*.5,'#caffab',.22,25)}for(const a of game.actors){if(!validTarget(owner,a)||(!z.pierce&&z.hit.includes(a.playerId)&&!['jonePlague','lavaPit','avatarFire','avatarTornado','mudPool','blackfire','quantumHole','grizzWall','firewall','ariaGarden','shadowClone','gravity'].includes(z.effect)))continue;if(Math.abs(a.x-z.x)<z.rx&&Math.abs(a.y+a.h/2-z.y)<z.ry){
      if(z.effect==='jonePlague'){applyJonePoison(a,owner,'plague');directDamage(a,owner,z.damage,0,0,'poison')}
      else if(z.effect==='lavaPit'){directDamage(a,owner,z.damage,0,0,'burn');a.burnT=Math.max(a.burnT,2.1);if(a.onGround&&Math.abs(a.x-z.x)<z.rx*.55){a.dropT=.34;a.onGround=false;a.y+=8;a.vy=110}}
      else if(z.effect==='avatarFire'){directDamage(a,owner,z.damage,0,0,'burn');a.burnT=Math.max(a.burnT,2.4)}
      else if(z.effect==='avatarTornado'){directDamage(a,owner,z.damage,owner.face*95,-210,'air');a.vy=Math.min(a.vy,-360);a.onGround=false}
      else if(z.effect==='mudPool'){directDamage(a,owner,z.damage,0,0,'mud');a.slowT=Math.max(a.slowT,.75);a.noJumpT=Math.max(a.noJumpT,.75)}
      else if(z.effect==='blackfire'){directDamage(a,owner,z.damage,0,0,'burn');a.burnT=Math.max(a.burnT,5)}
      else if(z.effect==='quantumHole'){directDamage(a,owner,z.damage,0,70,'warp');a.vx+=(z.x-a.x)*.9}
      else if(z.effect==='ariaGarden'){directDamage(a,owner,z.damage,0,0,'nature');a.slowT=Math.max(a.slowT,.7);if(Math.random()<.12)a.freezeT=Math.max(a.freezeT,.35)}
      else if(z.effect==='shadowClone'){directDamage(a,owner,z.damage,Math.sign(a.x-z.x)*65,-55,'shadow')}
      else if(z.effect==='gravity'){directDamage(a,owner,z.damage,(z.x-a.x)*.08,55,'gravity');a.vx+=(z.x-a.x)*.05}
      else if(z.effect==='earthCrush'){if(applyHit(a,owner,z.damage,z.knock,-430,'stone'))z.hit.push(a.playerId)}
      else if(applyHit(a,owner,z.damage,z.knock,-280,z.effect))z.hit.push(a.playerId)
    }}damageBridges(z.x,z.y,z.damage*.5,z.rx)}
  }
  game.areas=game.areas.filter(z=>z.life>0)
}
function spawnPickup(){const pads=activePlatforms().filter(p=>!p.id.startsWith('b')),p=pads[Math.floor(Math.random()*pads.length)],type=Math.random()<.63?'health':'freeze';game.pickups.push({id:Math.random().toString(36).slice(2),type,x:p.x+55+Math.random()*Math.max(20,p.w-110),y:p.y-36,life:18,bob:Math.random()*6});game.banner=type==='health'?'✚ CURA NA ARENA':'❄ CONGELAMENTO DISPONÍVEL';game.bannerT=.65;addArenaFeed(type==='health'?'Item de cura apareceu':'Item de congelamento apareceu')}
function updatePickups(dt){for(const it of game.pickups){it.life-=dt;for(const a of game.actors){if(a.eliminated||a.respawnT>0)continue;if(Math.abs(a.x-it.x)<40&&Math.abs(a.y+a.h/2-it.y)<70){it.life=0;if(it.type==='health'){a.damage=Math.max(0,a.damage-28);addFx('heal',a.x,a.y+50,'#4ade80',.65,78);toast(`${a.name} recuperou vida`)}else{for(const e of game.actors)if(validTarget(a,e))e.freezeT=Math.max(e.freezeT,2.35);addFx('freeze',a.x,a.y+50,'#67e8f9',.75,95);game.banner=`${a.name.toUpperCase()} CONGELOU OS RIVAIS`;game.bannerT=.8}break}}}game.pickups=game.pickups.filter(x=>x.life>0)}
function addFx(kind,x,y,color,life,size,dir=1){if(!game)return;const fx={kind,x,y,color,life,maxLife:life,size,dir};game.fx.push(fx);const cap=perfFxCap();if(game.fx.length>cap)game.fx.splice(0,game.fx.length-cap);if(game.online&&game.authoritative&&net?.role==='host'&&['hit','ko','bridge','respawn','heal','freeze','dash','jump','meter'].includes(kind)){game.netEvents.push([kind,Math.round(x),Math.round(y),color,Math.round(life*100)/100,Math.round(size),dir]);if(game.netEvents.length>24)game.netEvents.splice(0,game.netEvents.length-24)}}
function updateFx(dt){for(const f of game.fx)f.life-=dt;game.fx=game.fx.filter(f=>f.life>0)}
function addArenaFeed(message){if(!game?.arenaTotal)return;game.feed.push({text:String(message).slice(0,100),until:game.time+4.5});game.feed=game.feed.slice(-4)}
function loseStock(a){if(a.respawnT>0||a.eliminated)return;a.stocks--;a.deaths++;a.streak=0;const killer=game.actors.find(x=>x.playerId===a.lastHitBy);if(killer&&killer!==a){killer.kos++;killer.streak=(killer.streak||0)+1;addArenaFeed(`${killer.name} derrubou ${a.name}${killer.streak>=2?' · SÉRIE '+killer.streak:''}`)}else addArenaFeed(`${a.name} caiu da arena`);game.shake=12;addFx('ko',clamp(a.x,0,WORLD_W),clamp(a.y,0,CH),'#fff',.8,120);playSfx('ko',.7);if(a.stocks<=0){a.eliminated=true;a.x=-999;a.y=-999;game.banner=`${a.name.toUpperCase()} ELIMINADO`;game.bannerT=.8;addArenaFeed(`${a.name} foi eliminado`)}else{a.respawnT=1.45;a.x=-999;a.y=-999}}
function respawn(a){const s=SPAWNS[a.slot%SPAWNS.length];a.x=s.x;a.y=s.y-52;a.vx=0;a.vy=0;a.damage=0;a.invuln=a.bot?2.8:2;a.freezeT=0;a.poisonT=0;a.poisonMarks=0;a.burnT=0;a.jumps=2;a.onGround=false;a.lastHitBy=null;a.proMove=null;a.signature=null;a.ktrakHealT=0;a.ktrakLightningChargeT=0;a.attackLockT=0;a.noJumpT=0;a.flightT=0;a.absorbT=0;a.copiedT=0;a.copiedCharId=null;addFx('respawn',a.x,a.y+28,a.color,.8,55)}
function checkWinner(){const alive=game.actors.filter(a=>!a.eliminated&&a.stocks>0);let winner=null;if(game.mode==='ffa'){if(alive.length<=1)winner=alive[0]||game.actors.slice().sort((a,b)=>b.kos-a.kos)[0]}else{const teams=[...new Set(alive.map(a=>a.team))];if(teams.length<=1)winner=teams[0]??0}if(winner!=null&&game.phase==='fight'){game.phase='over';game.winner=winner;const label=game.mode==='ffa'?winner.name:`TIME ${Number(winner)+1}`;game.banner=`${label.toUpperCase()} VENCEU`;game.bannerT=99;setTimeout(()=>showResults(label),900)}}
function finishByTime(){if(!game||game.phase!=='fight')return;let label,winner;if(game.mode==='ffa'){const ordered=game.actors.slice().sort((a,b)=>b.stocks-a.stocks||b.kos-a.kos||a.damage-b.damage);const a=ordered[0],b=ordered[1];winner=b&&a.stocks===b.stocks&&a.kos===b.kos&&Math.round(a.damage)===Math.round(b.damage)?'EMPATE':a.name;label=winner}else{const score=[0,1].map(team=>{const actors=game.actors.filter(a=>a.team===team);return[actors.reduce((n,a)=>n+Math.max(0,a.stocks),0),actors.reduce((n,a)=>n+a.kos,0),-actors.reduce((n,a)=>n+a.damage,0)]});const cmp=score[0][0]-score[1][0]||score[0][1]-score[1][1]||score[0][2]-score[1][2];winner=cmp===0?'EMPATE':cmp>0?0:1;label=winner==='EMPATE'?winner:`TIME ${winner+1}`}game.endedByTime=true;game.phase='over';game.winner=winner;game.banner=winner==='EMPATE'?'TEMPO ESGOTADO · EMPATE':`${label.toUpperCase()} VENCEU NO TEMPO`;game.bannerT=99;addArenaFeed('Tempo esgotado · vidas, KOs e dano decidiram');setTimeout(()=>showResults(label),900)}
function refreshArenaScore(){if(!game?.arenaTotal||!game.hud)return;let el=document.getElementById('island-arena-score');if(!el){el=document.createElement('div');el.id='island-arena-score';el.className='island-arena-score';game.hud.appendChild(el)}let value;if(game.mode==='ffa'){const alive=game.actors.filter(a=>!a.eliminated&&a.stocks>0).length;value=`LIVRE-PARA-TODOS · ${alive} DE ${game.actors.length} NO COMBATE`}else{const totals=[0,1].map(t=>game.actors.filter(a=>a.team===t).reduce((n,a)=>n+Math.max(0,a.stocks),0));value=`TIME AZUL ${totals[0]} VIDAS  ·  ${totals[1]} VIDAS TIME VERMELHO`}if(el.textContent!==value)el.textContent=value}
function refreshArenaHud(){if(!game?.arenaTotal)return;const timer=document.getElementById('arena-match-clock');if(timer){const seconds=Math.ceil(game.timeRemaining||0),clock=game.rules.minutes?`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:'∞';timer.textContent=`TEMPO · ${clock}`;timer.classList.toggle('urgent',game.rules.minutes&&seconds<=30)}if(!game.rules.items){const items=document.querySelector('.island-pickup-clock');if(items)items.textContent='ITENS DESATIVADOS'}const hint=document.querySelector('#island-banner small');if(hint)hint.textContent=game.phase==='countdown'?`${game.rules.stocks} VIDAS · PULO DUPLO · ARENA TOTAL`:game.phase==='fight'?`ITENS ${game.rules.items?'ATIVOS':'OFF'} · PONTES ${game.rules.bridges?'QUEBRÁVEIS':'FIXAS'} · ${game.variant.toUpperCase()}`:'FIM DA BATALHA';const leader=document.getElementById('arena-leaderboard');if(leader){const ordered=game.actors.slice().sort((a,b)=>b.stocks-a.stocks||b.kos-a.kos||a.damage-b.damage),html='<b>PLACAR AO VIVO</b>'+ordered.slice(0,4).map((a,i)=>`<span style="--rank:${TEAM_COLORS[a.team%TEAM_COLORS.length]}">${i+1}. ${esc(a.name)} · ${a.kos} KO · ${Math.max(0,a.stocks)} ◆</span>`).join('');if(leader.innerHTML!==html)leader.innerHTML=html}const feed=document.getElementById('arena-killfeed');if(feed){const html=(game.feed||[]).filter(x=>x.until>game.time).slice(-3).reverse().map(x=>`<div>${esc(x.text)}</div>`).join('');if(feed.innerHTML!==html)feed.innerHTML=html}const bridges=document.getElementById('arena-bridge-status');if(bridges){const html=game.bridges.map((b,i)=>`PONTE ${i+1}: ${b.brokenT>0?'VOLTA EM '+Math.ceil(b.brokenT)+'s':game.rules.bridges?Math.max(0,Math.round(b.hp/b.maxHp*100))+'%':'FIXA'}`).join(' · ');if(bridges.textContent!==html)bridges.textContent=html}const warning=document.getElementById('arena-net-warning');if(warning)warning.hidden=!(game.online&&!game.authoritative&&game.phase==='fight'&&(!net?.conn?.open||game.lastSnapshotAt&&performance.now()-game.lastSnapshotAt>2500))}
function showResults(label){
  if(!game)return;const el=document.getElementById('island-results');if(el)el.classList.add('show');const w=document.getElementById('island-winner');if(w)w.textContent=label==='EMPATE'?'EMPATE':`${label} VENCEU${game.endedByTime?' NO TEMPO':''}`;const copy=document.getElementById('island-result-copy');if(copy){const ordered=game.actors.slice().sort((a,b)=>b.stocks-a.stocks||b.kos-a.kos||a.damage-b.damage),ranking=ordered.map((a,i)=>`${i+1}º ${esc(a.name)} · ${a.kos} KOs · ${Math.max(0,a.stocks)} vidas · ${a.deaths} quedas`).join('<br>'),mvp=game.actors.slice().sort((a,b)=>b.kos-a.kos||a.deaths-b.deaths)[0],survivor=game.actors.slice().sort((a,b)=>a.deaths-b.deaths||b.stocks-a.stocks)[0],awards=game.arenaTotal?`<span class="arena-result-awards"><strong>✦ MAIS KOs · ${esc(mvp?.name||'—')} (${mvp?.kos||0})</strong><strong>◆ SOBREVIVENTE · ${esc(survivor?.name||'—')} (${survivor?.deaths||0} quedas)</strong></span>`:'';copy.innerHTML=awards+(game.endedByTime?'<b>Critério: vidas → KOs → menor dano recebido.</b><br><br>':'')+ranking+(game.duoEvent?'<br><br><b>Atualizando o progresso do Torneio em Trio…</b>':game.online?'<br><br><b>Voltando para a mesma sala…</b>':'')}
  playSfx('victory',.75);
  if(game.duoEvent){const rem=document.getElementById('island-rematch');if(rem)rem.hidden=true;if(game.authoritative&&net?.role==='host'){if(game.roomReturnTimer)clearTimeout(game.roomReturnTimer);game.roomReturnTimer=setTimeout(()=>{if(game?.phase==='over'&&net?.role==='host')handleDuoEventResult()},2400)}return}
  if(game.online&&game.authoritative&&net?.role==='host'){if(game.roomReturnTimer)clearTimeout(game.roomReturnTimer);game.roomReturnTimer=setTimeout(()=>{if(game?.phase==='over'&&net?.role==='host')returnOnlineMatchToRoom()},4500)}
}

function botInput(a,dt){a.aiT-=dt;if(a.aiT<=0){a.aiT=.025+Math.random()*.035;const enemies=game.actors.filter(b=>validTarget(a,b));let target=null;if(enemies.length){const allies=game.actors.filter(b=>b!==a&&!b.eliminated&&b.team===a.team),claimed=new Set(allies.map(x=>x.aiPlan?.target).filter(Boolean)),free=enemies.filter(e=>!claimed.has(e.playerId));target=(free.length?free:enemies).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0]}const ally=game.actors.find(b=>b!==a&&!b.eliminated&&b.team===a.team&&Math.abs(b.x-a.x)<62),dx=(target?.x||WORLD_W/2)-a.x,dy=(target?.y||a.y)-a.y,d=Math.abs(dx),incoming=!!target&&(target.attackT>0||target.proMove);const wantsBackstab=!!target&&!incoming&&d<240&&Math.random()<.34,flankX=target?(target.x-(target.face||1)*72):WORLD_W/2,moveDx=wantsBackstab?flankX-a.x:dx;a.aiPlan={target:target?.playerId,left:moveDx<-12,right:moveDx>12,jump:dy<-45||(!platformAhead(a,Math.sign(moveDx))&&d>60),down:dy>70,guard:incoming&&d<190&&Math.random()<.94,punch:!!target&&d<112&&Math.abs(dy)<75&&Math.random()<.78,kick:!!target&&d<158&&Math.abs(dy)<85&&Math.random()<.64,hook:!!target&&d<126&&Math.abs(dy)<80&&Math.random()<.38,power:!!target&&d<720&&Math.random()<.46,super:a.meter>=100&&!!target&&d<760,extra:['ktrak','jone'].includes(a.charId)&&Math.random()<.11,dodge:incoming&&d<230&&Math.random()<.82};if(ally){a.aiPlan.left=a.x>ally.x;a.aiPlan.right=a.x<=ally.x}if(a.x<48){a.aiPlan.left=false;a.aiPlan.right=true;a.aiPlan.jump=true}if(a.x>WORLD_W-48){a.aiPlan.right=false;a.aiPlan.left=true;a.aiPlan.jump=true}}
  const p={...a.aiPlan};for(const k of ['jump','punch','kick','hook','power','super','extra','dodge']){if(p[k]&&a.prevInput[k])p[k]=false}return p}
function platformAhead(a,dir){const x=a.x+dir*60,bottom=a.y+a.h;return activePlatforms().some(p=>x>=p.x&&x<=p.x+p.w&&p.y>=bottom-20&&p.y<=bottom+130)}

function stateChannel(entry){return entry?.fast?.open?entry.fast:entry?.conn}
function channelBuffered(ch){try{return Number(ch?.dataChannel?.bufferedAmount||0)}catch(_){return 0}}
function sendStateIfNeeded(){
  if(!game?.online||net?.role!=='host'||game.time-game.lastNet<NET_SNAPSHOT_DT)return;
  game.lastNet=game.time;const seq=++game.snapshotSeq;
  for(const [playerId,entry] of net.connections.entries()){
    const ch=stateChannel(entry);if(!ch?.open)continue;
    const limit=ch===entry.fast?FAST_BACKPRESSURE:NET_BACKPRESSURE;if(channelBuffered(ch)>limit)continue;
    const a=game.actors.find(x=>x.playerId===playerId),center=a?.x??(game.cameraX+CW/2),state=makeSnapshot(center,seq);
    try{ch.send({type:'s',state})}catch(_){}
  }
  game.netEvents.length=0;
}
function packActor(a){return[a.playerId,a.name,a.charId,a.color,a.team,a.slot,Math.round(a.x),Math.round(a.y),Math.round(a.vx),Math.round(a.vy),a.face,a.onGround?1:0,a.jumps,Math.round(a.damage*10)/10,a.stocks,Math.round(a.meter),Math.round(a.attackT*100)/100,a.action,Math.round(a.hurtT*100)/100,Math.round(a.invuln*100)/100,a.guard?1:0,Math.round(a.freezeT*100)/100,Math.round(a.slowT*100)/100,Math.round(a.poisonT*100)/100,a.poisonKind||'',a.poisonMarks||0,Math.round(a.burnT*100)/100,a.eliminated?1:0,Math.round(a.respawnT*100)/100,a.kos||0,a.deaths||0,Math.round(a.speed||320),a.ktrakElementIndex||0,a.ktrakElement||'water',Math.round((a.ktrakAvatarT||0)*100)/100,Math.round((a.ktrakAvatarIntroT||0)*100)/100,Math.round((a.ktrakLightningChargeT||0)*100)/100,a.jonePoisonIndex||0,a.signature?{type:a.signature.type,t:Math.round((a.signature.t||0)*100)/100,mask:a.signature.mask||0,startX:a.signature.startX,targetId:a.signature.targetId,avatar:a.signature.avatar,dir:a.signature.dir,fired:a.signature.fired}:null,a.proMove?{kind:a.proMove.kind,time:Math.round((a.proMove.time||0)*100)/100,duration:a.proMove.duration,start:a.proMove.start,end:a.proMove.end,hit:a.proMove.hit,dir:a.proMove.dir}:null,a.powerLabel||'',a.copiedCharId||null,Math.round((a.copiedT||0)*100)/100,a.kainPower||null,Math.round((a.flightT||0)*100)/100,Math.round((a.attackLockT||0)*100)/100,Math.round((a.noJumpT||0)*100)/100,Math.round((a.kainFlightT||0)*100)/100,Math.round((a.kainRepelT||0)*100)/100,Math.round((a.kainControlSwapT||0)*100)/100,a.boss?1:0]}
function unpackActor(v,old){const now=performance.now(),a={playerId:v[0],name:v[1],charId:v[2],color:v[3],team:v[4],slot:v[5],x:v[6],y:v[7],vx:v[8],vy:v[9],face:v[10],onGround:!!v[11],jumps:v[12],damage:v[13],stocks:v[14],meter:v[15],attackT:v[16],action:v[17],hurtT:v[18],invuln:v[19],guard:!!v[20],freezeT:v[21],slowT:v[22],poisonT:v[23],poisonKind:v[24],poisonMarks:v[25],burnT:v[26],eliminated:!!v[27],respawnT:v[28],kos:v[29],deaths:v[30],speed:v[31],ktrakElementIndex:v[32],ktrakElement:v[33],ktrakAvatarT:v[34],ktrakAvatarIntroT:v[35],ktrakLightningChargeT:v[36],jonePoisonIndex:v[37],signature:v[38],proMove:v[39],powerLabel:v[40],copiedCharId:v[41],copiedT:v[42],kainPower:v[43],flightT:v[44]||0,attackLockT:v[45]||0,noJumpT:v[46]||0,kainFlightT:v[47]||0,kainRepelT:v[48]||0,kainControlSwapT:v[49]||0,boss:!!v[50]};a.dropT=old?.dropT||0;a.w=old?.w||23;a.h=old?.h||52;a.visual=old?.visual||null;a.prevInput=old?.prevInput||{};a.netInput={};a.local=a.playerId===game.localId;a.netX=v[6];a.netY=v[7];a.netVx=v[8];a.netVy=v[9];a.netStamp=now;if(old){if(a.local){a.serverX=v[6];a.serverY=v[7];a.serverVx=v[8];a.serverVy=v[9];const far=Math.abs(old.x-v[6])>280||Math.abs(old.y-v[7])>220;if(!far){a.x=old.x;a.y=old.y;a.vx=old.vx;a.vy=old.vy;a.onGround=old.onGround;a.jumps=old.jumps;if(old.attackT>a.attackT){a.attackT=old.attackT;a.action=old.action}}}else{a.x=old.x;a.y=old.y;a.vx=old.vx;a.vy=old.vy}}return a}
function packProjectile(q){return[q.id,q.ownerId,q.team,Math.round(q.x),Math.round(q.y),Math.round(q.vx),Math.round(q.vy),Math.round(q.life*100)/100,q.maxLife,q.r,q.color,q.effect,q.kind,q.label,q.fixedToOwner?1:0,q.beamLength||0,q.dir||1,Math.round(q.gravity||0)]}
function unpackProjectile(v,old){const q={id:v[0],ownerId:v[1],team:v[2],x:v[3],y:v[4],vx:v[5],vy:v[6],life:v[7],maxLife:v[8],r:v[9],color:v[10],effect:v[11],kind:v[12],label:v[13],fixedToOwner:!!v[14],beamLength:v[15],dir:v[16],gravity:v[17]||0};q.netX=v[3];q.netY=v[4];q.netStamp=performance.now();if(old){q.x=old.x;q.y=old.y}return q}
function inViewX(x,r,center){return x+r>=center-CW*.72-CULL_MARGIN&&x-r<=center+CW*.72+CULL_MARGIN}
function projectileInView(q,center){const len=Math.abs(q.beamLength||0),end=q.x+(q.dir||1)*len,min=Math.min(q.x,end),max=Math.max(q.x,end);return max+(q.r||20)>=center-CW*.72-CULL_MARGIN&&min-(q.r||20)<=center+CW*.72+CULL_MARGIN}
function makeSnapshot(centerX,seq){
  const center=Number.isFinite(centerX)?centerX:(game.cameraX+CW/2);
  return{m:game.mode,p:game.phase,t:Math.round(game.time*100)/100,u:Math.round(game.pickupT*10)/10,tr:Math.round((game.timeRemaining||0)*10)/10,fe:game.feed.filter(x=>x.until>game.time),ot:!!game.endedByTime,b:game.banner,bt:Math.round(game.bannerT*10)/10,w:typeof game.winner==='object'?game.winner?.name:game.winner,n:seq,
    br:game.bridges.filter(b=>inViewX(b.x+b.w/2,b.w/2,center)).map(b=>[b.id,b.x,b.y,b.w,b.h,Math.round(b.hp),b.maxHp,Math.round(b.brokenT*10)/10]),
    a:game.actors.map(packActor),q:game.projectiles.filter(q=>projectileInView(q,center)).map(packProjectile),
    z:game.areas.filter(z=>inViewX(z.x,z.rx||100,center)).map(z=>[z.id,z.owner?.playerId||z.ownerId,Math.round(z.x),Math.round(z.y),Math.round(z.rx),Math.round(z.ry),Math.round(z.life*100)/100,z.maxLife,z.effect,z.color,z.label||'']),
    k:game.pickups.filter(x=>inViewX(x.x,80,center)).map(x=>[x.id,x.type,Math.round(x.x),Math.round(x.y),Math.round(x.life*10)/10,x.bob]),
    e:game.netEvents.filter(e=>inViewX(e[1],140,center)).slice(-10)}
}
function applySnapshot(s){
  if(!game||game.authoritative||!s)return;if(s.n&&s.n<=(game.lastSnapshotSeq||0))return;
  const now=performance.now();game.netGap=game.lastSnapshotAt?now-game.lastSnapshotAt:0;game.lastSnapshotAt=now;game.lastSnapshotSeq=s.n||((game.lastSnapshotSeq||0)+1);
  game.mode=s.m??s.mode;game.phase=s.p??s.phase;const serverTime=s.t??s.time;if(Number.isFinite(serverTime)){if(!Number.isFinite(game.time)||Math.abs(serverTime-game.time)>.55)game.time=serverTime;else game.time+=(serverTime-game.time)*.10}game.pickupT=s.u??s.pickupT;game.timeRemaining=s.tr??game.timeRemaining;game.feed=s.fe||game.feed;game.endedByTime=!!s.ot;game.banner=s.b??s.banner;game.bannerT=s.bt??s.bannerT;game.winner=s.w??s.winner;
  if(s.br){const incoming=new Map(s.br.map(v=>[v[0],v]));for(const b of game.bridges){const v=incoming.get(b.id);if(v){b.x=v[1];b.y=v[2];b.w=v[3];b.h=v[4];b.hp=v[5];b.maxHp=v[6];b.brokenT=v[7]}}}
  const oldA=new Map(game.actors.map(a=>[a.playerId,a]));game.actors=(s.a||s.actors||[]).map(v=>Array.isArray(v)?unpackActor(v,oldA.get(v[0])):{...v,local:v.playerId===game.localId,visual:oldA.get(v.playerId)?.visual||null,prevInput:oldA.get(v.playerId)?.prevInput||{},netInput:{},netX:v.x,netY:v.y,netVx:v.vx,netVy:v.vy,netStamp:now});
  const oldQ=new Map(game.projectiles.map(q=>[q.id,q]));game.projectiles=(s.q||s.projectiles||[]).map(v=>Array.isArray(v)?unpackProjectile(v,oldQ.get(v[0])):{...v,netX:v.x,netY:v.y,netStamp:now});
  game.areas=(s.z||s.areas||[]).map(v=>Array.isArray(v)?{id:v[0],ownerId:v[1],owner:game.actors.find(a=>a.playerId===v[1]),x:v[2],y:v[3],rx:v[4],ry:v[5],life:v[6],maxLife:v[7],effect:v[8],color:v[9],label:v[10]}:{...v,owner:game.actors.find(a=>a.playerId===v.ownerId)});
  game.pickups=(s.k||s.pickups||[]).map(v=>Array.isArray(v)?{id:v[0],type:v[1],x:v[2],y:v[3],life:v[4],bob:v[5]}:v);
  for(const ev of s.e||[]){const [kind,x,y,color,life,size,dir]=ev;game.fx.push({kind,x,y,color,life,maxLife:life,size,dir});const cap=perfFxCap();if(game.fx.length>cap)game.fx.splice(0,game.fx.length-cap)}
  if(game.phase==='over'&&!document.getElementById('island-results')?.classList.contains('show'))setTimeout(()=>showResults(typeof game.winner==='string'?game.winner:'TIME '+(Number(game.winner)+1)),300)
}

function drawGame(){const g=game,c=g.ctx;c.save();if(g.shake>0)c.translate((Math.random()-.5)*g.shake,(Math.random()-.5)*g.shake);drawBackdrop(c);drawArenaAtmosphere(c);c.save();c.translate(-g.cameraX,0);drawIslands(c);for(const z of g.areas)if(visibleWorldX(z.x,z.rx||100))drawArea(c,z);for(const it of g.pickups)if(visibleWorldX(it.x,80))drawPickup(c,it);for(const q of g.projectiles)if(visibleWorldX(q.x,Math.max(80,q.beamLength||0)))drawProjectile(c,q);for(const a of g.actors)if(!a.eliminated&&a.respawnT<=0&&visibleWorldX(a.x,120))drawActor(c,a);const cap=g.quality==='low'?24:g.quality==='medium'?42:80;for(const f of g.fx.slice(-cap))if(visibleWorldX(f.x,120))drawFx(c,f);c.restore();c.restore();if(g.phase==='countdown')drawCountdown(c)}
function drawArenaAtmosphere(c){if(!game?.arenaTotal)return;const theme=game.variant||'aurora';c.save();const tint=c.createLinearGradient(0,0,0,CH);if(theme==='tempestade'){tint.addColorStop(0,'rgba(28,48,94,.38)');tint.addColorStop(1,'rgba(6,16,38,.12)')}else if(theme==='crepusculo'){tint.addColorStop(0,'rgba(157,67,73,.29)');tint.addColorStop(1,'rgba(54,13,50,.12)')}else{tint.addColorStop(0,'rgba(27,128,125,.25)');tint.addColorStop(1,'rgba(7,38,75,.08)')}c.fillStyle=tint;c.fillRect(0,0,CW,CH);if(game.quality!=='low'){const count=theme==='tempestade'?32:16;c.fillStyle=theme==='tempestade'?'rgba(211,234,255,.26)':theme==='crepusculo'?'rgba(255,194,145,.23)':'rgba(148,252,225,.22)';for(let i=0;i<count;i++){const x=(i*173+game.time*(theme==='tempestade'?220:35))%CW,y=(i*97+game.time*(theme==='tempestade'?340:22))%620+55;c.fillRect(x,y,theme==='tempestade'?2:4,theme==='tempestade'?25:4)}}c.restore()}
function drawBackdrop(c){const cam=game?.cameraX||0,par=cam*.16;if(bg.complete&&bg.naturalWidth){let off=-(par%CW)-CW;for(let x=off;x<CW*2;x+=CW)c.drawImage(bg,x,0,CW,CH)}else{const gr=c.createLinearGradient(0,0,0,CH);gr.addColorStop(0,'#123b68');gr.addColorStop(.62,'#287da0');gr.addColorStop(1,'#07192a');c.fillStyle=gr;c.fillRect(0,0,CW,CH)}const haze=c.createLinearGradient(0,0,0,CH);haze.addColorStop(0,'rgba(2,8,23,.08)');haze.addColorStop(.72,'rgba(2,8,23,.03)');haze.addColorStop(1,'rgba(2,8,23,.35)');c.fillStyle=haze;c.fillRect(0,0,CW,CH);if(game?.quality!=='low'){c.fillStyle='rgba(56,189,248,.13)';const n=game?.quality==='medium'?3:5;for(let i=0;i<n;i++){c.beginPath();c.ellipse(130+i*(game?.quality==='medium'?520:330),748+Math.sin(game.time+i)*8,250,35,0,0,Math.PI*2);c.fill()}}}
function ensureStaticWorldCache(){if(staticWorldCache)return staticWorldCache;const cv=document.createElement('canvas');cv.width=WORLD_W;cv.height=CH;const cc=cv.getContext('2d',{alpha:true});for(const p of BASE_PLATFORMS){if(p.ground)drawGroundIsland(cc,p);else drawStonePlatform(cc,p)}cc.fillStyle='rgba(1,5,14,.83)';for(let seg=0;seg<3;seg++){cc.beginPath();cc.ellipse(530+seg*CW,690,55,120,0,0,Math.PI*2);cc.ellipse(910+seg*CW,690,55,120,0,0,Math.PI*2);cc.fill()}staticWorldCache=cv;return cv}
function drawIslands(c){const cv=ensureStaticWorldCache(),sx=Math.max(0,Math.min(WORLD_W-CW,Math.floor(game.cameraX)));c.drawImage(cv,sx,0,CW,CH,sx,0,CW,CH);for(const b of game.bridges)if(visibleWorldX(b.x+b.w/2,b.w/2+80))drawBridge(c,b)}
function drawGroundIsland(c,p){c.save();const g=c.createLinearGradient(0,p.y,0,p.y+165);g.addColorStop(0,'#6f7848');g.addColorStop(.16,'#475333');g.addColorStop(1,'#172132');c.fillStyle=g;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+p.w,p.y);c.lineTo(p.x+p.w-55,p.y+145);c.lineTo(p.x+65,p.y+155);c.closePath();c.fill();c.fillStyle='#88a850';c.fillRect(p.x,p.y-8,p.w,13);c.fillStyle='#b6d86d';for(let x=p.x+8;x<p.x+p.w;x+=34)c.fillRect(x,p.y-12,19,5);c.strokeStyle='rgba(216,190,135,.35)';c.lineWidth=3;for(let x=p.x+45;x<p.x+p.w-25;x+=75){c.beginPath();c.moveTo(x,p.y+22);c.lineTo(x-15,p.y+105);c.stroke()}c.restore()}
function drawStonePlatform(c,p){c.save();c.shadowBlur=14;c.shadowColor='rgba(0,0,0,.5)';c.fillStyle='#546071';c.beginPath();c.roundRect(p.x,p.y,p.w,p.h,8);c.fill();c.fillStyle='#94a65b';c.fillRect(p.x+4,p.y-6,p.w-8,9);c.strokeStyle='rgba(220,230,240,.22)';c.lineWidth=2;for(let x=p.x+25;x<p.x+p.w;x+=55){c.beginPath();c.moveTo(x,p.y+3);c.lineTo(x-13,p.y+p.h-2);c.stroke()}c.restore()}
function drawBridge(c,b){c.save();if(b.brokenT>0){c.globalAlpha=.75;const n=clamp(b.brokenT/12,0,1);c.strokeStyle='#67e8f9';c.setLineDash([7,10]);c.lineWidth=2;c.strokeRect(b.x,b.y,b.w,b.h);c.setLineDash([]);c.fillStyle='#67e8f9';c.font='900 9px Oxanium';c.textAlign='center';c.fillText(`RECONSTRUÇÃO ${Math.ceil(b.brokenT)}s`,b.x+b.w/2,b.y-9);c.restore();return}c.strokeStyle='#402b20';c.lineWidth=5;c.beginPath();c.moveTo(b.x,b.y+7);c.quadraticCurveTo(b.x+b.w/2,b.y+21,b.x+b.w,b.y+7);c.stroke();for(let x=b.x+4;x<b.x+b.w;x+=15){c.fillStyle=b.hp<b.maxHp*.4?'#6b3b2b':'#9a7046';c.save();c.translate(x,b.y+8+Math.sin(x)*3);c.rotate((x%3-1)*.06);c.fillRect(-6,-8,13,18);c.restore()}if(b.hp<b.maxHp){c.fillStyle='rgba(0,0,0,.65)';c.fillRect(b.x,b.y-13,b.w,4);c.fillStyle=b.hp<b.maxHp*.35?'#ef4444':'#f59e0b';c.fillRect(b.x,b.y-13,b.w*b.hp/b.maxHp,4)}c.restore()}
function dummyFight(v){let d=v.__islandDummyFight;if(!d){d={p1:v,p2:null,paused:true,over:false};for(const k of DUMMY_ARRAYS)d[k]=[];Object.defineProperty(v,'__islandDummyFight',{value:d,writable:true,configurable:true,enumerable:false})}d.p1=v;d.p2=null;d.paused=true;d.over=false;return d}
function drawActor(c,a){c.save();c.fillStyle='rgba(0,0,0,.30)';c.beginPath();c.ellipse(a.x,a.y+a.h+5,34,9,0,0,Math.PI*2);c.fill();if(a.charId==='ktrak'&&(a.ktrakAvatarT>0||a.ktrakAvatarIntroT>0||a.ktrakLightningChargeT>0)){const rr=46+(a.ktrakAvatarIntroT>0?Math.sin(game.time*18)*9:0);c.globalAlpha=a.ktrakLightningChargeT>0?.72:.38;c.strokeStyle=a.ktrakLightningChargeT>0?'#73c8ff':'#a7f3d0';c.lineWidth=a.ktrakLightningChargeT>0?4:3;c.beginPath();c.arc(a.x,a.y+50,rr,0,Math.PI*2);c.stroke();c.globalAlpha=1}const renderId=((a.charId==='klopp'||a.charId==='frogh')&&a.copiedT>0&&a.copiedCharId)?a.copiedCharId:a.charId,ch=charById(renderId);if(!a.visual){try{a.visual=makeFighter(ch,0,true,'p1')}catch(_){a.visual=null}}if(a.visual){const v=a.visual;v.id=renderId;v.name=ch.name;v.color=ch.color;v.weapon=ch.weapon||v.weapon;v.special=ch.special||v.special;v.x=0;v.y=0;v.vy=-a.vy;v.facing=a.face;v.onGround=a.onGround;v.defend=a.guard;v.freezeT=a.freezeT;v.hitFlash=a.hurtT;v.proMove=a.proMove?{...a.proMove}:null;v.ktrakElement=a.ktrakElement;v.ktrakElementIndex=a.ktrakElementIndex;v.ktrakAvatarT=a.ktrakAvatarT;v.ktrakAvatarIntroT=a.ktrakAvatarIntroT;v.jonePoisonIndex=a.jonePoisonIndex;if(a.signature?.type==='laranjaCombo')v.laranjaCombo={t:a.signature.t,duration:.40};else v.laranjaCombo=null;if(a.signature?.type==='laranjaSuper')v.laranjaFlash={phase:Math.min(6,Math.floor(a.signature.t/.075)),time:a.signature.t};else v.laranjaFlash=null;v.state=a.hurtT>0?'hurt':a.guard?'defend':a.attackT>0?(a.action==='special'?'special':'throw'):!a.onGround?'air':a.action==='crouch'?'crouch':Math.abs(a.vx)>20?'walk':'idle';v.stateT=a.proMove?.time??((v.stateT||0)+.016);v.animT=(v.animT||0)+.016;v.walkT=(v.walkT||0)+Math.abs(a.vx)*.0007;v.vx=a.vx;let saved=null;c.save();c.translate(a.x,a.y+a.h-GROUND_Y);if(a.invuln>0)c.globalAlpha=.55+.35*Math.sin(game.time*22);try{saved=fight;fight=dummyFight(v);drawFighter(c,v)}catch(_){drawFallback(c,a)}finally{try{fight=saved}catch(_){ }c.restore()}}else drawFallback(c,a);if(a.freezeT>0){c.fillStyle='rgba(103,232,249,.25)';c.strokeStyle='#bae6fd';c.lineWidth=3;c.beginPath();c.roundRect(a.x-31,a.y-5,62,a.h+10,22);c.fill();c.stroke()}if(a.poisonT>0){c.strokeStyle='#86ff58';c.lineWidth=2;c.globalAlpha=.65;c.beginPath();c.arc(a.x,a.y+a.h*.55,34+Math.sin(game.time*6)*3,0,Math.PI*2);c.stroke();c.globalAlpha=1}c.textAlign='center';c.font='900 10px Oxanium';c.fillStyle=TEAM_COLORS[a.team%TEAM_COLORS.length];c.shadowColor='#000';c.shadowBlur=4;c.fillText(`${a.name} · ${Math.round(a.damage)}%`,a.x,a.y-12);c.shadowBlur=0;c.restore()}
function drawFallback(c,a){c.fillStyle=a.color;c.fillRect(a.x-20,a.y+28,40,52);c.fillStyle='#e8b98f';c.beginPath();c.arc(a.x,a.y+18,18,0,Math.PI*2);c.fill();c.fillStyle='#111827';c.fillRect(a.x-17,a.y+80,12,24);c.fillRect(a.x+5,a.y+80,12,24)}
function drawProjectile(c,q){
  c.save();c.translate(q.x,q.y);c.shadowBlur=fxShadow();c.shadowColor=q.color;c.fillStyle=q.color;c.strokeStyle=q.color;
  if(q.kind==='lightningBeam'){
    const dir=q.dir||1,len=q.beamLength||600;c.scale(dir,1);const seed=Math.floor((game.time*28)%7);c.lineJoin='round';
    const bolt=(width,color,alpha)=>{c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(0,0);for(let i=1;i<=9;i++){const x=len*i/9,y=(i===9?0:(((i*37+seed*19)%31)-15));c.lineTo(x,y)}c.stroke()};
    bolt(13,'rgba(37,99,235,.34)',1);bolt(7,'#38bdf8',1);bolt(2.6,'#effaff',1);
    c.lineWidth=2;c.strokeStyle='#93c5fd';for(let i=2;i<9;i+=3){const x=len*i/9,y=((i*37+seed*19)%31)-15;c.beginPath();c.moveTo(x,y);c.lineTo(x+42, y+(i%2?32:-30));c.stroke()}
  }else if(q.kind==='water'){
    c.globalAlpha=.86;c.lineWidth=5;c.strokeStyle='#b9f4ff';for(let i=0;i<3;i++){c.beginPath();c.arc(-q.r*.4+i*8,0,q.r*(.65+i*.16),-1.15,1.15);c.stroke()}c.fillStyle='rgba(75,220,255,.42)';c.beginPath();c.ellipse(0,6,q.r*1.2,q.r*.7,0,0,Math.PI*2);c.fill()
  }else if(q.kind==='rock'){
    c.rotate(game.time*4);c.fillStyle='#9b7444';c.strokeStyle='#e0b778';c.lineWidth=3;c.beginPath();for(let i=0;i<8;i++){const ang=Math.PI*2*i/8,r=q.r*(i%2?1:.78);const x=Math.cos(ang)*r,y=Math.sin(ang)*r;(i?c.lineTo(x,y):c.moveTo(x,y))}c.closePath();c.fill();c.stroke()
  }else if(q.kind==='fire'){
    c.fillStyle='#ff5a24';c.beginPath();c.moveTo(-q.r,8);c.quadraticCurveTo(0,-q.r*1.8,q.r,6);c.quadraticCurveTo(0,q.r*1.1,-q.r,8);c.fill();c.fillStyle='#ffe46b';c.beginPath();c.ellipse(2,2,q.r*.42,q.r*.72,0,0,Math.PI*2);c.fill()
  }else if(q.kind==='wind'){
    c.shadowBlur=5;c.lineWidth=4;c.strokeStyle='rgba(225,250,255,.9)';for(let i=-1;i<=1;i++){c.beginPath();c.arc(-5,i*9,q.r*(.8+Math.abs(i)*.16),-1.2,1.1);c.stroke()}
  }else if(q.kind==='poison'||q.kind==='joneBomb'){
    c.fillStyle=q.kind==='joneBomb'?'#254b1d':q.color;c.beginPath();c.arc(0,0,q.r,0,Math.PI*2);c.fill();c.strokeStyle='#b8ff8b';c.lineWidth=2;c.stroke();c.fillStyle='rgba(221,255,187,.82)';for(let i=0;i<3;i++){c.beginPath();c.arc(-q.r*.35+i*q.r*.32,-q.r*.2+(i%2)*7,Math.max(2,q.r*.16),0,Math.PI*2);c.fill()}
  }else if(q.kind==='beam'){c.lineWidth=7;c.beginPath();c.moveTo(-24,0);c.lineTo(24,0);c.stroke()}
  else if(q.kind==='bomb'){c.beginPath();c.arc(0,0,q.r,0,Math.PI*2);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke()}
  else if(q.kind==='blade'){c.rotate(game.time*9);c.fillRect(-q.r,-3,q.r*2,6)}
  else{c.beginPath();c.arc(0,0,q.r,0,Math.PI*2);c.fill();c.fillStyle='rgba(255,255,255,.65)';c.beginPath();c.arc(-q.r*.25,-q.r*.25,Math.max(3,q.r*.28),0,Math.PI*2);c.fill()}
  c.restore()
}
function drawArea(c,z){
  const n=clamp(z.life/z.maxLife,0,1);c.save();
  if(z.effect==='lavaPit'){
    const pulse=1+Math.sin(game.time*9)*.035;c.globalAlpha=.92;c.fillStyle='#050303';c.beginPath();c.ellipse(z.x,z.y,z.rx*pulse,z.ry,0,0,Math.PI*2);c.fill();c.strokeStyle='#ff6a24';c.lineWidth=5;c.stroke();
    c.globalAlpha=.82;c.fillStyle='#ff3b16';c.beginPath();c.ellipse(z.x,z.y+2,z.rx*.58,z.ry*.46,0,0,Math.PI*2);c.fill();c.strokeStyle='#ffbb38';c.lineWidth=3;c.stroke();
    c.globalAlpha=.72;c.strokeStyle='#ff6a24';c.lineWidth=3;for(let i=0;i<7;i++){const a=i*Math.PI*2/7,x1=z.x+Math.cos(a)*z.rx*.9,y1=z.y+Math.sin(a)*z.ry*.8;c.beginPath();c.moveTo(x1,y1);c.lineTo(x1+Math.cos(a)*(28+(i%3)*12),y1+Math.sin(a)*(12+(i%2)*9));c.stroke()}
  }else if(z.effect==='jonePlague'){
    c.globalAlpha=.18+.18*n;c.fillStyle='#2fbf56';c.beginPath();c.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);c.fill();
    c.globalAlpha=.42*n;for(let i=0;i<7;i++){const ox=Math.sin(game.time*1.7+i*2.1)*z.rx*.56,oy=Math.cos(game.time*1.3+i)*z.ry*.34-(i%3)*13;c.fillStyle=i%2?'#79e45e':'#b2ff72';c.beginPath();c.arc(z.x+ox,z.y+oy,12+(i%3)*5,0,Math.PI*2);c.fill()}
    c.strokeStyle='#b9ff82';c.lineWidth=3;c.globalAlpha=.55*n;c.beginPath();c.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);c.stroke()
  }else if(z.effect==='avatarFire'){
    c.globalAlpha=.18+.22*n;c.fillStyle='#ff5722';c.beginPath();c.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);c.fill();c.globalAlpha=.68*n;c.strokeStyle='#ffb12f';c.lineWidth=5;for(let i=-4;i<=4;i++){const x=z.x+i*z.rx/5;c.beginPath();c.moveTo(x,z.y+25);c.quadraticCurveTo(x+16,z.y-55-Math.sin(game.time*8+i)*22,x+30,z.y+10);c.stroke()}
  }else if(z.effect==='avatarTornado'){
    c.globalAlpha=.55*n;c.strokeStyle='#e6fbff';c.lineWidth=5;for(let i=0;i<5;i++){const yy=z.y+z.ry*.65-i*z.ry*.34,rx=z.rx*(.95-i*.13);c.beginPath();c.ellipse(z.x,yy,rx,18+i*2,0,0,Math.PI*2);c.stroke()}
  }else if(z.effect==='earthCrush'){
    c.globalAlpha=.8*n;c.fillStyle='#8b6b43';for(let i=0;i<6;i++){const ox=(i-2.5)*28,h=35+(i%3)*22;c.beginPath();c.moveTo(z.x+ox-15,z.y+25);c.lineTo(z.x+ox,z.y-h);c.lineTo(z.x+ox+18,z.y+25);c.closePath();c.fill()}
  }else{
    c.globalAlpha=.16+.24*n;c.fillStyle=z.color;c.strokeStyle=z.color;c.lineWidth=4;c.beginPath();c.ellipse(z.x,z.y,z.rx*(1.02+.05*Math.sin(game.time*8)),z.ry,0,0,Math.PI*2);c.fill();c.globalAlpha=.6*n;c.stroke()
  }
  c.restore()
}
function drawPickup(c,it){const bob=Math.sin(game.time*4+it.bob)*7,col=it.type==='health'?'#4ade80':'#67e8f9';c.save();c.translate(it.x,it.y+bob);c.shadowBlur=game?.quality==='low'?0:game?.quality==='medium'?8:20;c.shadowColor=col;c.fillStyle='rgba(2,8,23,.88)';c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.arc(0,0,23,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#fff';c.font='900 21px Arial';c.textAlign='center';c.fillText(it.type==='health'?'✚':'❄',0,7);c.fillStyle=col;c.font='900 8px Oxanium';c.fillText(it.type==='health'?'VIDA':'CONGELAR',0,39);c.restore()}
function drawFx(c,f){const n=clamp(f.life/f.maxLife,0,1),r=f.size*(1+(1-n)*.55);c.save();c.translate(f.x,f.y);c.globalAlpha=n;c.strokeStyle=f.color;c.fillStyle=f.color;c.lineWidth=f.kind==='ko'?8:4;c.shadowBlur=fxShadow();c.shadowColor=f.color;if(['hit','ko','bridge','respawn','heal','freeze','meter'].includes(f.kind)){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();if(f.kind==='heal'||f.kind==='freeze'){c.globalAlpha=n*.13;c.fill()}}else{c.scale(f.dir||1,1);for(let i=0;i<3;i++){c.beginPath();c.moveTo(-r*.6-i*10,-18+i*18);c.lineTo(r*.45,-18+i*18);c.stroke()}}c.restore()}
function drawCountdown(c){const n=Math.max(1,Math.ceil(game.countdown));c.save();c.textAlign='center';c.fillStyle='#fff';c.font='900 120px Anton';c.shadowColor='#38bdf8';c.shadowBlur=35;c.fillText(n,CW/2,CH*.46);c.restore()}
function privatePowerInfo(a){
  if(!a?.local)return'';
  if(a.charId==='ktrak'){
    const names={water:'ÁGUA',earth:'TERRA',fire:'FOGO',air:'AR',lightning:'RAIO',lava:'LAVA',heal:'CURA'};
    return`H · ${names[a.ktrakElement||'water']||'ÁGUA'}${a.ktrakAvatarT>0?' · AVATAR':''}`;
  }
  if(a.charId==='jone')return`H · ${((a.jonePowerIndex??a.jonePoisonIndex)||0)%2?'BEIJO DA HERA':'CORTE DA MORTE'}`;
  if(a.charId==='kain'){
    const labels={flight:'VOO',ice:'GELO',heal:'CURA',shock:'CHOQUE',repel:'REPULSÃO',swap:'TROCA',fire:'FOGO',teleport:'TELEPORTE',drain:'ROUBO DE VIDA',gravity:'GRAVIDADE'};
    return`H · ${labels[a.kainPower||'flight']||'VOO'}`;
  }
  if(a.charId==='uiye'&&a.copiedT>0&&a.copiedCharId)return`H · CÓPIA ${charById(a.copiedCharId).name}`;
  if(a.charId==='klopp'&&a.copiedT>0&&a.copiedCharId)return`K · J DE ${charById(a.copiedCharId).name} · L SUPER`;
  return'';
}
function refreshHud(){if(!game)return;const box=document.getElementById('island-players-hud');if(box)box.innerHTML=game.actors.map(a=>{const priv=privatePowerInfo(a);return`<div class="island-hud-card ${a.local?'local':''} ${a.eliminated?'ko':''}" style="--hc:${TEAM_COLORS[a.team%TEAM_COLORS.length]};--meter:${Math.round(a.meter)}%"><b>${esc(a.name)} · ${esc(charById(a.charId).name)}</b><span class="pct">${Math.round(a.damage)}%</span><span class="stocks">${'◆'.repeat(Math.max(0,a.stocks))||'KO'}</span>${priv?`<span class="island-private-power">${esc(priv)}</span>`:''}<span class="meter"><i></i></span></div>`}).join('');const banner=document.getElementById('island-banner');if(banner){banner.classList.toggle('show',game.bannerT>0||game.phase==='over');banner.innerHTML=`${esc(game.banner||'')}<small>${game.phase==='countdown'?'3 VIDAS · PULO DUPLO · ARENA 3×':game.phase==='over'?'FIM DA BATALHA':'COMBATE NORMAL · PONTES QUEBRÁVEIS · CÂMERA DINÂMICA'}</small>`}const clock=document.getElementById('island-item-time');if(clock)clock.textContent=Math.max(0,game.pickupT).toFixed(1)+'s';const nb=document.getElementById('island-net-badge');if(nb&&net?.role==='guest'){const gap=Math.round(game.netGap||0);nb.textContent=net.fast?.open?`P2P RÁPIDO · ${gap||'—'} ms`:`P2P RESERVA · ${gap||'—'} ms`;}const pb=document.getElementById('island-perf-badge');if(pb)pb.textContent=`AUTO · ${String(game.quality||'high').toUpperCase()} · ${Math.round(game.fps||60)} FPS`}

window.addEventListener('keydown',e=>{if(screen!=='island-play')return;if(['KeyA','KeyD','KeyW','KeyS','KeyI','KeyO','KeyG','KeyJ','KeyK','KeyL','KeyH','KeyQ','KeyU','KeyP','Escape'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}if(e.code==='Escape'&&!e.repeat){requestExit();return}held.add(e.code);if(!e.repeat&&net?.role==='guest'){const ch=net.fast?.open?net.fast:net.conn,action={KeyW:'jump',KeyI:'punch',KeyO:'kick',KeyG:'hook',KeyJ:'power',KeyL:'super',KeyH:'extra',KeyQ:'dodge',KeyU:'extra1',KeyP:'extra2'}[e.code];if(action&&ch?.open&&channelBuffered(ch)<(ch===net.fast?FAST_BACKPRESSURE:NET_BACKPRESSURE))try{const variant=action==='power'?(held.has('KeyS')?'down':held.has('KeyW')?'up':!game?.actors?.find(a=>a.local)?.onGround?'air':null):null;ch.send({type:'action',action,variant})}catch(_){}}},true);
window.addEventListener('keyup',e=>{if(screen==='island-play'){held.delete(e.code);if(['KeyA','KeyD','KeyW','KeyS','KeyI','KeyO','KeyG','KeyJ','KeyK','KeyL','KeyH','KeyQ','KeyU','KeyP'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}}},true);
window.addEventListener('blur',()=>{held.clear();if(game&&!game.online&&game.authoritative&&!game.paused)togglePause()},true);
window.addEventListener('beforeunload',()=>closeNetwork());
injectModeCard();window.IslandClashV22=Object.freeze({version:VERSION,open:openSetup,openArenaTotal:()=>{arenaTotalActive=true;selectedFormat='ffa';openSetup()},openDuoEvent,stop:stopGame,formats:FORMAT,characters:allCharacters});
})();
