/* SORTEP NIAK — V35 ONLINE PRO
 * Ranqueado P2P, classificação local da temporada e torneio online.
 * O servidor PeerJS sinaliza conexões; as lutas são P2P e os resultados ficam
 * no perfil local. Um placar global confiável exigiria backend de contas.
 */
(()=>{
  'use strict';
  if(window.LutadorOnlinePro?.version) return;
  const VERSION='37.0.0';
  const KEY='sortep-v16-online-pro';
  const PEER_OPTIONS={debug:0,host:'0.peerjs.com',port:443,secure:true,path:'/',config:{iceServers:[
    {urls:'stun:stun.l.google.com:19302'},
    {urls:'stun:stun1.l.google.com:19302'},
    {urls:'stun:stun.cloudflare.com:3478'}
  ]}};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString('pt-BR');
  const gstate=()=>{try{return state}catch(_){return null}};
  const chars=()=>{try{return CHARACTERS||[]}catch(_){return []}};
  const stages=()=>{try{return STAGES||[]}catch(_){return []}};
  const lan=()=>window.__lan||null;
  const online=()=>window.LutadorOnlineV16||null;
  const prog=()=>window.ProProgression?.getSnapshot?.()||null;
  const exp=()=>window.LutadorExpansion?.data||null;

  const TIERS=[
    {name:'FERRO',icon:'⬟',min:0,gold:0,psy:0,vandais:0},
    {name:'BRONZE',icon:'◆',min:120,gold:400,psy:3,vandais:2},
    {name:'PRATA',icon:'◇',min:300,gold:700,psy:5,vandais:3},
    {name:'OURO',icon:'✦',min:550,gold:1100,psy:8,vandais:4},
    {name:'PLATINA',icon:'⬢',min:850,gold:1600,psy:12,vandais:6},
    {name:'DIAMANTE',icon:'💎',min:1200,gold:2300,psy:18,vandais:8},
    {name:'MESTRE',icon:'♜',min:1650,gold:3500,psy:25,vandais:12},
    {name:'PRIMORDIAL',icon:'♛',min:2200,gold:5000,psy:40,vandais:18}
  ];
  function defaults(){return{rp:0,best:0,wins:0,losses:0,streak:0,searches:0,disconnects:0,forfeits:0,forfeitWins:0,history:[],claimed:[],season:seasonKey(),tourWins:0,tourMatches:0,lastOpponent:null}}
  function seasonKey(){try{const s=window.ProProgression?.getSeasonInfo?.();return String(s?.number||s?.name||'S1')}catch(_){return'S1'}}
  let data=defaults();
  try{const r=JSON.parse(localStorage.getItem(KEY)||'{}');data={...defaults(),...r,history:Array.isArray(r.history)?r.history:[],claimed:Array.isArray(r.claimed)?r.claimed:[]}}catch(_){data=defaults()}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}}
  function currentTier(rp=data.rp){let t=TIERS[0];for(const x of TIERS)if(rp>=x.min)t=x;return t}
  function nextTier(){const i=TIERS.indexOf(currentTier());return TIERS[i+1]||null}
  function ensureSeason(){const k=seasonKey();if(data.season===k)return;data.season=k;data.rp=Math.floor(data.rp*.62);data.streak=0;data.claimed=[];save()}
  ensureSeason();

  function playerName(){return String(gstate()?.playerName||'JOGADOR').slice(0,18)}
  function title(){return String(prog()?.profile?.displayTitle||exp()?.equipped?.title||'Combatente')}
  function skin(){return String(exp()?.equipped?.skin||'Original')}
  function frame(){return String(exp()?.equipped?.frame||'Padrão')}
  function favorite(){try{const id=window.LutadorV6?.data?.lastSelected||window.LutadorV6?.data?.favorites?.[0]||gstate()?.roster?.[0];return chars().some(c=>c.id===id&&!c.ravamOnly)?id:'rojo'}catch(_){return'rojo'}}
  function profile(){const t=currentTier();return{name:playerName(),title:title(),skin:skin(),frame:frame(),rp:data.rp,tier:t.name,tierIcon:t.icon,wins:data.wins,losses:data.losses,champion:favorite(),version:VERSION}}
  function grantReward(t){
    if(!t||data.claimed.includes(t.name))return;
    data.claimed.push(t.name);const s=gstate();if(s){s.coins=(Number(s.coins)||0)+t.gold;s.psy=(Number(s.psy)||0)+t.psy;s.vandais=(Number(s.vandais)||0)+t.vandais;try{persist()}catch(_){}}
    if(t.name==='PRIMORDIAL'){try{window.ProProgression?.grantTitle?.('Primordial Online')}catch(_){}}
    toast(`PROMOÇÃO · ${t.icon} ${t.name} · +${fmt(t.gold)} GOLD · +${t.psy} PSY · +${t.vandais} VANDAIS`,'reward',3000);save();
  }
  function checkPromotion(oldRp){for(const t of TIERS)if(t.min>oldRp&&t.min<=data.rp)grantReward(t)}
  function addHistory(entry){const full={...entry,at:Date.now(),matchId:'R-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)};data.history.unshift(full);data.history=data.history.slice(0,60);save();return full}
  function settleRanked(won,opponent={},ping=0,reason='PARTIDA'){
    ensureSeason();const before=data.rp;const opp=Number(opponent.rp)||0;let delta;
    if(won){data.wins++;data.streak++;delta=Math.round(30+clamp((opp-before)/65,-9,12)+Math.min(10,data.streak*2));if(reason==='ADVERSÁRIO DESISTIU')data.forfeitWins++;}
    else{data.losses++;data.streak=0;delta=-Math.round((reason==='VOCÊ DESISTIU'?35:20)+clamp((before-opp)/95,-5,9));if(reason==='VOCÊ DESISTIU')data.forfeits++;}
    data.rp=Math.max(0,data.rp+delta);data.best=Math.max(data.best,data.rp);data.lastOpponent=opponent.name||'RIVAL';
    const s=gstate();if(s){s.coins=(Number(s.coins)||0)+(won?90:reason==='VOCÊ DESISTIU'?0:25);s.psy=(Number(s.psy)||0)+(won?2:0);try{persist()}catch(_){}}
    checkPromotion(before);
    const match=addHistory({result:won?'VITÓRIA':'DERROTA',opponent:opponent.name||'RIVAL',opponentRp:opp,delta,rp:data.rp,ping:Math.round(ping||0),reason,champion:favorite(),skin:skin(),title:title(),season:data.season});
    try{window.dispatchEvent(new CustomEvent('niak:ranked-result',{detail:match}))}catch(e){console.warn('[Evento sazonal]',e)}
    save();return delta;
  }

  function toast(text,tone='normal',ms=2200){
    try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(text,tone,ms)}catch(_){ }
    let h=document.getElementById('v16-toast-host');if(!h){h=document.createElement('div');h.id='v16-toast-host';document.body.appendChild(h)}
    const e=document.createElement('div');e.className='v16-toast '+tone;e.textContent=text;h.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.remove('show');setTimeout(()=>e.remove(),180)},ms)
  }
  function appNode(){try{return app}catch(_){return document.getElementById('app')}}
  function setScreen(v){try{screen=v}catch(_){}}
  function drawOff(){try{drawCanvas()}catch(_){}}
  function ensurePeer(cb){
    if(typeof Peer!=='undefined')return cb();
    const o=online();if(o?.ensurePeerReady)return o.ensurePeerReady(cb);
    toast('Módulo online indisponível. Recarregue a página.','danger',3000);
  }
  function disconnectCasual(){try{online()?.close?.()}catch(_){}}

  function historyHtml(){return data.history.length?data.history.slice(0,20).map(h=>`<article class="v16-history-row ${h.result==='VITÓRIA'?'win':'loss'}"><span>${h.result==='VITÓRIA'?'▲':'▼'}</span><div><b>${esc(h.result)} · ${esc(h.opponent)}</b><small>${new Date(h.at).toLocaleString('pt-BR')} · ${esc(h.reason)} · ${h.ping||0} ms</small></div><strong>${h.delta>=0?'+':''}${h.delta} RP</strong><i>${h.rp} RP</i></article>`).join(''):'<div class="v16-empty">Nenhuma batalha online ranqueada registrada.</div>'}
  function recentForm(){const rows=data.history.filter(h=>h.season===data.season).slice(0,5);return`<section class="v16-ranked-form"><div><small>FORMA RECENTE · TEMPORADA ${esc(data.season)}</small><h3>SUAS ÚLTIMAS BATALHAS</h3></div><div class="v16-form-list">${rows.length?rows.map(h=>`<article class="${h.result==='VITÓRIA'?'win':'loss'}"><b>${h.result==='VITÓRIA'?'V':'D'}</b><span>${esc(h.opponent||'RIVAL')}<small>${esc(h.reason||'PARTIDA')}</small></span><strong>${h.delta>=0?'+':''}${h.delta} RP</strong></article>`).join(''):'<p>Sua primeira batalha ranqueada aparecerá aqui.</p>'}</div></section>`}

  function classificationHtml(){
    const rivals=new Map();
    for(const h of data.history){
      if(h.season!==data.season||!h.opponent||rivals.has(h.opponent))continue;
      rivals.set(h.opponent,{name:h.opponent,rp:Math.max(0,Number(h.opponentRp)||0),self:false});
    }
    const table=[{name:playerName(),rp:data.rp,self:true},...rivals.values()].sort((a,b)=>b.rp-a.rp||Number(b.self)-Number(a.self));
    const myPlace=table.findIndex(row=>row.self)+1;
    const visible=table.slice(0,8);if(!visible.some(row=>row.self))visible.push(table[myPlace-1]);
    return`<section class="v16-local-ranking"><div class="v16-local-ranking-head"><div><small>CLASSIFICAÇÃO DA TEMPORADA</small><h3>SUA LIGA P2P</h3></div><strong>#${myPlace} DE ${table.length}</strong></div><div class="v16-local-ranking-list">${visible.map(row=>`<article class="${row.self?'self':''}"><b>${table.indexOf(row)+1}º</b><span>${esc(row.name)}${row.self?' · VOCÊ':''}</span><em>${currentTier(row.rp).icon} ${currentTier(row.rp).name}</em><strong>${fmt(row.rp)} RP</strong></article>`).join('')}</div><small>Rivais exibidos com o RP informado na última partida neste dispositivo. Não é um placar mundial.</small></section>`;
  }

  function renderRanked(){
    ensureSeason();setScreen('v16-ranked');drawOff();const a=appNode(),t=currentTier(),n=nextTier();if(!a)return;
    const pct=n?clamp((data.rp-t.min)/(n.min-t.min)*100,0,100):100;
    a.innerHTML=`<div class="card mk-card mk-arena v16-ranked-screen">
      <header class="v16-pro-head"><div><small>ONLINE COMPETITIVO · V${VERSION}</small><h2>RANQUEADO ONLINE</h2><p>Busca automática por outro jogador conectado ao SORTEP NIAK.</p></div><div class="v16-rank-emblem">${t.icon}<b>${t.name}</b><span>${data.rp} RP</span></div></header>
      <section class="v16-rank-progress"><div><span>${t.name}</span><span>${n?n.name:'RANK MÁXIMO'}</span></div><i><em style="width:${pct}%"></em></i><small>${n?`${n.min-data.rp} RP para ${n.name}`:'Você alcançou a patente máxima.'}</small></section>
      ${classificationHtml()}
      <div class="v16-ranked-stats"><article><small>VITÓRIAS</small><b>${data.wins}</b></article><article><small>DERROTAS</small><b>${data.losses}</b></article><article><small>SEQUÊNCIA</small><b>${data.streak}</b></article><article><small>MELHOR RP</small><b>${data.best}</b></article><article><small>RIVAIS QUE DESISTIRAM</small><b>${data.forfeitWins||0}</b></article><article><small>SUAS DESISTÊNCIAS</small><b>${data.forfeits||0}</b></article></div>
      ${recentForm()}
      <section class="v16-ranked-actions"><button class="btn big" id="v16-find-match">🔎 BUSCAR PARTIDA</button><button class="btn" id="v16-history">📜 REGISTRO DE BATALHAS</button><button class="btn" id="v16-rules">🏅 PATENTES E PRÊMIOS</button><button class="btn" id="v16-ranked-back">← VOLTAR</button></section>
      <section class="v16-ranked-note"><b>APENAS P2P</b><span>${esc(playerName())} · ${esc(title())} · Skin ${esc(skin())}</span><small>Sair de uma luta iniciada registra derrota e retira RP. Se o rival sair, quem permaneceu recebe vitória. Antes da luta, cancelar não altera RP. Resultados e prêmios ficam neste dispositivo; sem servidor, quedas de rede não podem ser diferenciadas com certeza de uma desistência.</small></section>
    </div>`;
    a.querySelector('#v16-find-match').onclick=startRankedSearch;
    a.querySelector('#v16-history').onclick=showHistory;
    a.querySelector('#v16-rules').onclick=showRankRules;
    a.querySelector('#v16-ranked-back').onclick=()=>window.renderModes?.();
  }
  function showHistory(){let d=document.getElementById('v16-history-dialog');if(!d){d=document.createElement('dialog');d.id='v16-history-dialog';d.className='v16-dialog';document.body.appendChild(d)}d.innerHTML=`<header><div><small>CARREIRA ONLINE</small><h2>REGISTRO DE BATALHAS</h2></div><button data-close>×</button></header><div class="v16-history-list">${historyHtml()}</div>`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal()}
  function showRankRules(){let d=document.getElementById('v16-rules-dialog');if(!d){d=document.createElement('dialog');d.id='v16-rules-dialog';d.className='v16-dialog';document.body.appendChild(d)}d.innerHTML=`<header><div><small>PROGRESSÃO P2P</small><h2>PATENTES E PRÊMIOS</h2></div><button data-close>×</button></header><div class="v16-tier-list">${TIERS.map(t=>`<article><span>${t.icon}</span><b>${t.name}</b><small>${t.min} RP</small><i>${t.gold?`+${fmt(t.gold)} Gold · +${t.psy} Psy · +${t.vandais} Vandais`:'Patente inicial'}</i></article>`).join('')}</div><p class="v16-legal-note">Cada vitória P2P dá <b>+90 Gold e +2 Psy</b>; cada derrota dá <b>+25 Gold</b>. As recompensas de promoção são recebidas uma vez por patente em cada temporada. Desistir durante a luta causa derrota, penalidade maior de RP e nenhum Gold; o adversário ganha vitória. Conexões interrompidas podem parecer desistências em P2P. RP, histórico e classificação são locais; um ranking mundial verificável precisa de contas e servidor.</p>`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal()}

  /* ---------- Ranked matchmaking ---------- */
  const ranked={searching:false,peer:null,conn:null,waitTimer:0,attempt:0,remote:null,settled:false,inMatch:false};
  function rankedStatus(text,sub=''){const a=appNode();if(!a)return;a.innerHTML=`<div class="card mk-card mk-arena v16-search-screen"><div class="v16-search-ring"></div><small>MATCHMAKING RANQUEADO</small><h2>${esc(text)}</h2><p>${esc(sub)}</p><div class="v16-search-profile"><b>${currentTier().icon} ${currentTier().name}</b><span>${data.rp} RP · ${esc(playerName())}</span></div><button class="btn" id="v16-cancel-search">CANCELAR BUSCA</button></div>`;a.querySelector('#v16-cancel-search').onclick=cancelRankedSearch}
  function closeRankedPeer(){clearTimeout(ranked.waitTimer);try{ranked.conn?.close()}catch(_){}try{ranked.peer?.destroy()}catch(_){}ranked.peer=null;ranked.conn=null;ranked.searching=false}
  function cancelRankedSearch(){closeRankedPeer();disconnectCasual();renderRanked()}
  function cancelActive(){if(ranked.searching){cancelRankedSearch();return true}if(lan()?.matchType==='ranked'&&!ranked.inMatch){ranked.settled=true;finishRankedView();return true}return false}
  function startRankedSearch(){
    ensureSeason();disconnectCasual();closeRankedPeer();ranked.searching=true;ranked.attempt=0;ranked.settled=false;ranked.inMatch=false;ranked.remote=null;data.searches++;save();rankedStatus('PROCURANDO ADVERSÁRIO…','A fila P2P procura outro jogador com a mesma versão do jogo.');ensurePeer(()=>rankedTryShard());
  }
  function rankedTryShard(){
    if(!ranked.searching)return;
    clearTimeout(ranked.waitTimer);try{ranked.peer?.destroy()}catch(_){ }
    // Uma fila compartilhada evita que dois jogadores fiquem presos em faixas de RP diferentes.
    const id='NIAK-RANKED-P2P-V37';ranked.attempt++;
    let p;try{p=new Peer(id,PEER_OPTIONS)}catch(_){ranked.waitTimer=setTimeout(rankedTryShard,1200);return}ranked.peer=p;
    p.on('open',()=>{
      if(!ranked.searching||ranked.peer!==p){try{p.destroy()}catch(_){ }return}
      rankedStatus('AGUARDANDO RIVAL…','Fila P2P aberta. Continue nesta tela enquanto procuramos um adversário.');
      p.on('connection',c=>{
        if(!ranked.searching||ranked.peer!==p||c.metadata?.v16mode!=='ranked'||c.metadata?.profile?.version!==VERSION){try{c.close()}catch(_){ }return}
        rankedHostMatched(p,c);
      });
      ranked.waitTimer=setTimeout(()=>{if(ranked.searching&&ranked.peer===p)rankedTryShard()},25000);
    });
    p.on('error',err=>{
      if(!ranked.searching||ranked.peer!==p)return;
      const unavailable=err?.type==='unavailable-id'||/unavailable/i.test(String(err?.message||''));
      try{p.destroy()}catch(_){ }
      if(unavailable)rankedJoinShard(id);else{rankedStatus('RECONECTANDO À FILA…','A conexão de busca falhou; tentando novamente.');ranked.waitTimer=setTimeout(rankedTryShard,1200)}
    });
  }
  function rankedJoinShard(id){
    if(!ranked.searching)return;let p;try{p=new Peer(undefined,PEER_OPTIONS)}catch(_){ranked.waitTimer=setTimeout(rankedTryShard,1200);return}ranked.peer=p;
    let done=false;
    const retry=()=>{if(done||!ranked.searching||ranked.peer!==p)return;done=true;clearTimeout(ranked.waitTimer);try{p.destroy()}catch(_){ }ranked.waitTimer=setTimeout(rankedTryShard,700)};
    p.on('open',()=>{
      if(!ranked.searching||ranked.peer!==p){try{p.destroy()}catch(_){ }return}
      rankedStatus('RIVAL ENCONTRADO…','Estabelecendo conexão direta P2P.');
      const c=p.connect(id,{reliable:true,metadata:{v16mode:'ranked',profile:profile()}});
      ranked.waitTimer=setTimeout(retry,8500);
      c.on('open',()=>{if(done)return;done=true;clearTimeout(ranked.waitTimer);rankedGuestMatched(p,c)});
      c.on('error',retry);c.on('close',retry);
    });
    p.on('error',retry);
  }
  function prepareLanForRanked(role,p,c){const l=lan();if(!l)return false;try{online()?.close?.()}catch(_){}l.role=role;l.peer=p;l.conn=null;l.connected=false;l.p1=null;l.p2=null;l.visualFight=null;l.ravamOnly=false;l.matchType='ranked';l.remoteProfile=null;ranked.peer=p;ranked.conn=c;ranked.searching=false;return true}
  function rankedHostMatched(p,c){
    clearTimeout(ranked.waitTimer);if(!prepareLanForRanked('host',p,c))return;
    ranked.remote=c.metadata?.profile||null;lan().remoteProfile=ranked.remote;
    attachRankedData(c,'host');online()?.bindConnection?.(c);
    const timeout=setTimeout(()=>{
      if(c.open||ranked.settled)return;
      try{online()?.close?.()}catch(_){ }ranked.conn=null;ranked.peer=null;ranked.searching=true;
      rankedStatus('RECONECTANDO À FILA…','O primeiro contato P2P falhou. Procurando outro rival.');rankedTryShard();
    },10000);
    c.on('open',()=>{clearTimeout(timeout);setTimeout(()=>{try{p.disconnect()}catch(_){ }},1000)});
  }
  function rankedGuestMatched(p,c){
    if(!prepareLanForRanked('guest',p,c))return;
    attachRankedData(c,'guest');online()?.bindConnection?.(c);
    // O convidado chega aqui depois do evento open; inicializa explicitamente
    // a seleção e o handshake que a sala comum faria nesse evento.
    lan().connected=true;window.renderLanCharacterSelect?.();
    try{c.send({type:'hello',version:online()?.version,name:playerName(),ravamOnly:false})}catch(_){ }
  }
  function attachRankedData(c,role){
    const announce=()=>{try{c.send({type:'v16rank-profile',profile:profile()})}catch(_){ }setTimeout(decorateLanSelect,80)};
    c.on('open',announce);
    c.on('data',m=>{if(!m||typeof m!=='object')return;if(m.type==='v16rank-profile'){ranked.remote=m.profile||{};if(lan())lan().remoteProfile=ranked.remote;decorateLanSelect();if(role==='host')announce();return}if(m.type==='v16rank-result'&&role==='guest'){rankedReceiveResult(m);return}if(m.type==='v16rank-forfeit'){rankedRemoteForfeit();return}});
    c.on('close',()=>{if(lan()?.matchType!=='ranked'||ranked.settled)return;if(ranked.inMatch){rankedRemoteForfeit();return}ranked.settled=true;toast('Rival saiu antes da luta. Nenhum RP foi alterado.','danger',2800);finishRankedView()});
    if(c.open)announce();
  }
  function decorateLanSelect(){if(lan()?.matchType!=='ranked')return;const card=document.querySelector('.card.select');if(!card)return;if(!card.querySelector('.v16-ranked-select-head')){const r=ranked.remote||lan()?.remoteProfile||{};const x=document.createElement('section');x.className='v16-ranked-select-head';x.innerHTML=`<div><small>RANQUEADO ONLINE</small><b>${currentTier().icon} ${currentTier().name} · ${data.rp} RP</b></div><strong>VS</strong><div><small>RIVAL</small><b>${esc(r.name||'CONECTADO')} · ${fmt(r.rp||0)} RP</b></div>`;card.querySelector('.select-title')?.after(x)}const titleEl=card.querySelector('.select-title');if(titleEl&&titleEl.innerHTML!=='ESCOLHA PARA O <span class="mk-accent">RANQUEADO</span>')titleEl.innerHTML='ESCOLHA PARA O <span class="mk-accent">RANQUEADO</span>'}

  function applyOnlineIdentity(f){
    const l=lan();if(!f||!l||l.matchType!=='ranked')return;const local=profile(),remote=ranked.remote||l.remoteProfile||{};
    const p1=l.role==='host'?local:remote,p2=l.role==='host'?remote:local;
    if(f.p1){f.p1.v16OnlineSkin=p1.skin||'Original';f.p1.v16OnlineTitle=p1.title||'';f.p1.v16PlayerName=p1.name||'P1';f.p1.v16Rp=p1.rp||0}
    if(f.p2){f.p2.v16OnlineSkin=p2.skin||'Original';f.p2.v16OnlineTitle=p2.title||'';f.p2.v16PlayerName=p2.name||'P2';f.p2.v16Rp=p2.rp||0}
    f.v16OnlineRanked=true;showOnlineVs(f,p1,p2)
  }
  function showOnlineVs(f,p1,p2){setTimeout(()=>{if(typeof fight==='undefined'||fight!==f)return;let e=document.getElementById('v16-online-vs');e?.remove();e=document.createElement('div');e.id='v16-online-vs';e.className='v16-online-vs';e.innerHTML=`<section><small>${esc(p1.title||'Combatente')}</small><h2>${esc(p1.name||'P1')}</h2><b>${esc(f.p1?.name||'CAMPEÃO')}</b><i>SKIN · ${esc(p1.skin||'Original')}</i></section><strong>ONLINE<br><em>VS</em></strong><section><small>${esc(p2.title||'Combatente')}</small><h2>${esc(p2.name||'P2')}</h2><b>${esc(f.p2?.name||'CAMPEÃO')}</b><i>SKIN · ${esc(p2.skin||'Original')}</i></section>`;document.body.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),320)},1700)},120)}
  function onlineResult(won,delta,opp){let e=document.getElementById('v16-ranked-result');e?.remove();e=document.createElement('div');e.id='v16-ranked-result';e.className='v16-ranked-result '+(won?'win':'loss');e.innerHTML=`<small>RANQUEADO P2P</small><h2>${won?'VITÓRIA':'DERROTA'}</h2><p>contra ${esc(opp?.name||'RIVAL')}</p><b>${delta>=0?'+':''}${delta} RP</b><span>${currentTier().icon} ${currentTier().name} · ${data.rp} RP</span><small>${won?'+90 GOLD · +2 PSY':'+25 GOLD'}</small>`;document.body.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.remove(),3000)}
  function finishRankedView(){
    ranked.inMatch=false;document.getElementById('arena-pause')?.classList.remove('show');
    document.getElementById('v16-online-vs')?.remove();document.getElementById('v16-ranked-result')?.remove();
    try{if(typeof fight!=='undefined'&&fight?.mode==='lan')fight=null}catch(_){ }
    try{online()?.close?.()}catch(_){ }ranked.conn=null;ranked.peer=null;
    window.keys={};window.justPressed={};renderRanked();
  }
  function showForfeitResult(won,delta,opp){
    finishRankedView();document.getElementById('v16-ranked-forfeit')?.remove();
    const el=document.createElement('div');el.id='v16-ranked-forfeit';el.className='v16-ranked-forfeit '+(won?'win':'loss');
    el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',won?'O adversário desistiu':'Você desistiu');
    el.innerHTML=`<section><small>RANQUEADO · RESULTADO OFICIAL LOCAL</small><div class="v16-forfeit-icon">${won?'✦':'×'}</div><h2>${won?'O ADVERSÁRIO DESISTIU':'VOCÊ DESISTIU'}</h2><p>${won?`${esc(opp?.name||'O rival')} saiu durante a luta. A vitória foi registrada para você.`:'Sair de uma partida iniciada conta como derrota e não concede Gold.'}</p><div class="v16-forfeit-score"><b>${won?'VITÓRIA':'DERROTA'}</b><strong>${delta>=0?'+':''}${delta} RP</strong><span>${currentTier().icon} ${currentTier().name} · ${data.rp} RP</span></div><small>${won?'+90 GOLD · +2 PSY':'PENALIDADE DE DESISTÊNCIA · 0 GOLD'}</small><button class="btn big" id="v16-forfeit-done">VER RANQUEADO</button></section>`;
    document.body.appendChild(el);el.querySelector('#v16-forfeit-done').onclick=()=>el.remove();el.querySelector('#v16-forfeit-done').focus();
  }
  function settleForfeit(won){
    if(ranked.settled||!ranked.inMatch)return;
    ranked.settled=true;const opp=ranked.remote||lan()?.remoteProfile||{name:lan()?.remoteName||'RIVAL'};
    const delta=settleRanked(won,opp,lan()?.ping||0,won?'ADVERSÁRIO DESISTIU':'VOCÊ DESISTIU');
    if(won){data.disconnects++;save()}showForfeitResult(won,delta,opp);
  }
  function rankedRemoteForfeit(){if(lan()?.role==='host'&&typeof fight!=='undefined'&&fight?.matchOver){hostSettleRanked();return}settleForfeit(true)}
  function rankedLocalForfeit(){
    if(ranked.settled||!ranked.inMatch)return;
    try{ranked.conn?.send({type:'v16rank-forfeit',name:playerName()})}catch(_){ }
    settleForfeit(false);
  }
  function rankedReceiveResult(m){if(ranked.settled||!ranked.inMatch)return;ranked.settled=true;const won=m.winner==='p2';const opp=m.hostProfile||ranked.remote||{};const delta=settleRanked(won,opp,lan()?.ping||0);onlineResult(won,delta,opp);setTimeout(finishRankedView,3200)}
  function hostSettleRanked(){const l=lan();if(!l||l.matchType!=='ranked'||l.role!=='host'||ranked.settled||!ranked.inMatch||typeof fight==='undefined'||!fight?.matchOver)return;ranked.settled=true;const winner=(bestOfThree?.p1Wins||0)>=(bestOfThree?.p2Wins||0)?'p1':'p2';const won=winner==='p1';const opp=ranked.remote||l.remoteProfile||{};const delta=settleRanked(won,opp,l.ping||0);try{l.conn?.send({type:'v16rank-result',winner,hostProfile:profile(),guestProfile:opp})}catch(_){}onlineResult(won,delta,opp);setTimeout(finishRankedView,3200)}

  /* ---------- Torneio online flexível (2, 4 ou 8 jogadores) ---------- */
  const tour={mode:null,peer:null,hostConn:null,conns:new Map(),players:[],code:'',champion:null,guestActive:false,hostActive:false,current:null,size:4,roundPlayers:[],roundPairs:[],roundWinners:[],matchIndex:0,roundNumber:1,winner:null};
  function tourProfile(champion){return{name:playerName(),title:title(),skin:skin(),frame:frame(),champion:champion||favorite(),version:VERSION,id:'P-'+Math.random().toString(36).slice(2,8).toUpperCase()}}
  function unlockedChars(){const s=gstate();return chars().filter(c=>!c.ravamOnly&&s?.roster?.includes(c.id)&&(c.id!=='ztaaa'||!!s?.ztaaaUnlocked))}
  function charOptions(selected){return unlockedChars().map(c=>`<option value="${c.id}" ${c.id===selected?'selected':''}>${esc(c.name)}</option>`).join('')}
  function renderTournamentHub(){setScreen('v16-tour');drawOff();const a=appNode();if(!a)return;const sel=favorite();a.innerHTML=`<div class="card mk-card mk-arena v16-tour-screen"><header class="v16-pro-head"><div><small>TORNEIO ONLINE · HOST ESCOLHE O TAMANHO</small><h2>COPA NIAK ONLINE</h2><p>Quem cria a sala escolhe uma chave para 2, 4 ou 8 pessoas.</p></div><div class="v16-tour-cup">🏆</div></header><div class="v16-tour-setup"><label>SEU CAMPEÃO<select id="v16-tour-char">${charOptions(sel)}</select></label><label>QUANTIDADE DE PESSOAS<select id="v16-tour-size"><option value="2">2 jogadores</option><option value="4" selected>4 jogadores</option><option value="8">8 jogadores</option></select></label><article><button class="btn big" id="v16-tour-create">CRIAR TORNEIO</button><small>O HOST controla o tamanho e inicia a chave.</small></article><article><input id="v16-tour-code" class="code-input" placeholder="TOUR-ABC123" maxlength="11"><button class="btn" id="v16-tour-join">ENTRAR NO TORNEIO</button></article></div><section class="v16-tour-info"><b>Cosméticos online</b><span>Nome: ${esc(playerName())} · Título: ${esc(title())} · Skin: ${esc(skin())}</span></section><button class="btn" id="v16-tour-back">← VOLTAR</button></div>`;a.querySelector('#v16-tour-create').onclick=()=>createTournament(a.querySelector('#v16-tour-char').value,Number(a.querySelector('#v16-tour-size').value));a.querySelector('#v16-tour-join').onclick=()=>joinTournament(a.querySelector('#v16-tour-code').value,a.querySelector('#v16-tour-char').value);a.querySelector('#v16-tour-back').onclick=()=>window.renderModes?.()}
  function closeTournament(){try{tour.hostConn?.close()}catch(_){}for(const c of tour.conns.values())try{c.close()}catch(_){}try{tour.peer?.destroy()}catch(_){}Object.assign(tour,{mode:null,peer:null,hostConn:null,conns:new Map(),players:[],code:'',champion:null,guestActive:false,hostActive:false,current:null,size:4,roundPlayers:[],roundPairs:[],roundWinners:[],matchIndex:0,roundNumber:1,winner:null});}
  function tourCode(){return'TOUR-'+Math.random().toString(36).slice(2,8).toUpperCase()}
  function createTournament(champion,size=4){closeTournament();tour.size=[2,4,8].includes(size)?size:4;ensurePeer(()=>{tour.mode='host';tour.hostActive=true;tour.code=tourCode();const me=tourProfile(champion);me.isHost=true;tour.players=[me];let p;try{p=new Peer('NIAK-'+tour.code,PEER_OPTIONS)}catch(_){toast('Falha ao abrir torneio','danger');return}tour.peer=p;p.on('open',()=>renderTourLobbyHost());p.on('connection',c=>{if(tour.players.length>=tour.size){try{c.close()}catch(_){};return}const pr=c.metadata?.profile;if(!pr){try{c.close()}catch(_){};return}tour.conns.set(pr.id,c);tour.players.push(pr);bindTourHostConn(c,pr);broadcastTourLobby();renderTourLobbyHost()});p.on('error',()=>{toast('Não foi possível criar este código. Tente novamente.','danger');setTimeout(()=>renderTournamentHub(),900)})})}
  function renderTourLobbyHost(){const a=appNode();if(!a)return;setScreen('v16-tour-lobby');drawOff();a.innerHTML=`<div class="card mk-card mk-arena v16-tour-lobby"><header><div><small>TORNEIO ONLINE · HOST · ${tour.size} PESSOAS</small><h2>${esc(tour.code)}</h2><p>Compartilhe o código. ${tour.players.length}/${tour.size} jogadores conectados.</p></div><button class="btn" id="v16-tour-copy">COPIAR CÓDIGO</button></header><div class="v16-tour-players">${Array.from({length:tour.size},(_,i)=>{const p=tour.players[i];return`<article class="${p?'ready':''}"><span>${p?'✓':'…'}</span><div><b>${esc(p?.name||'AGUARDANDO')}</b><small>${p?`${esc(chars().find(c=>c.id===p.champion)?.name||p.champion)} · ${esc(p.title)}`:'Vaga livre'}</small></div></article>`}).join('')}</div><button class="btn big" id="v16-tour-start" ${tour.players.length===tour.size?'':'disabled'}>🏆 INICIAR CHAVE</button><button class="btn" id="v16-tour-cancel">CANCELAR</button></div>`;a.querySelector('#v16-tour-copy').onclick=async()=>{try{await navigator.clipboard.writeText(tour.code);toast('CÓDIGO COPIADO','reward')}catch(_){toast(tour.code)}};a.querySelector('#v16-tour-start').onclick=startTournamentBracket;a.querySelector('#v16-tour-cancel').onclick=()=>{broadcast({type:'tour-close'});closeTournament();renderTournamentHub()}}
  function broadcastTourLobby(){broadcast({type:'tour-lobby',players:tour.players,code:tour.code,size:tour.size})}
  function broadcast(msg,onlyIds=null){for(const [id,c] of tour.conns){if(onlyIds&&!onlyIds.includes(id))continue;try{if(c.open)c.send(msg)}catch(_){}}}
  function bindTourHostConn(c,pr){c.on('data',m=>{if(!m||typeof m!=='object')return;if(m.type==='tour-key'&&tour.current&&tour.current.ids.includes(pr.id))routeTourKey(pr.id,m.code,m.down);if(m.type==='tour-ping')try{c.send({type:'tour-pong',t:m.t})}catch(_){} });c.on('close',()=>{tour.conns.delete(pr.id);tour.players=tour.players.filter(x=>x.id!==pr.id);if(!tour.current)renderTourLobbyHost()})}
  function joinTournament(code,champion){code=String(code||'').trim().toUpperCase();if(!/^TOUR-[A-Z0-9]{6}$/.test(code)){toast('Código de torneio inválido.','danger');return}closeTournament();ensurePeer(()=>{tour.mode='guest';const me=tourProfile(champion);tour.champion=me;let p=new Peer(undefined,PEER_OPTIONS);tour.peer=p;p.on('open',()=>{const c=p.connect('NIAK-'+code,{reliable:true,metadata:{profile:me,v16mode:'tournament'}});tour.hostConn=c;c.on('open',()=>{renderTourGuestLobby([me],code);try{c.send({type:'tour-ping',t:performance.now()})}catch(_){}});bindTourGuestConn(c,me)});p.on('error',()=>toast('Falha ao conectar ao torneio.','danger'))})}
  function bindTourGuestConn(c,me){c.on('data',m=>{if(!m||typeof m!=='object')return;if(m.type==='tour-lobby'){tour.players=m.players||[];tour.size=Number(m.size)||tour.size;renderTourGuestLobby(tour.players,m.code||'');return}if(m.type==='tour-bracket'){tour.players=m.players||tour.players;renderTourBracket(m.bracket,false);return}if(m.type==='tour-setup'){startTourGuestMatch(m,me);return}if(m.type==='tour-state'){receiveTourState(m);return}if(m.type==='tour-match-result'){tour.guestActive=false;renderTourBracket(m.bracket,false);toast(`VENCEDOR · ${m.winnerName}`,'reward',2200);return}if(m.type==='tour-finish'){tour.guestActive=false;showTourFinish(m.winner,me);return}if(m.type==='tour-close'){closeTournament();renderTournamentHub();return}});c.on('close',()=>{if(tour.mode==='guest'){toast('Torneio encerrado ou conexão perdida.','danger');setTimeout(()=>{closeTournament();renderTournamentHub()},900)}})}
  function renderTourGuestLobby(players,code){const a=appNode();if(!a)return;setScreen('v16-tour-lobby');drawOff();a.innerHTML=`<div class="card mk-card mk-arena v16-tour-lobby"><header><div><small>TORNEIO ONLINE · PARTICIPANTE · ${tour.size} PESSOAS</small><h2>${esc(code)}</h2><p>Aguardando o HOST iniciar a chave.</p></div></header><div class="v16-tour-players">${Array.from({length:tour.size},(_,i)=>{const p=players[i];return`<article class="${p?'ready':''}"><span>${p?'✓':'…'}</span><div><b>${esc(p?.name||'AGUARDANDO')}</b><small>${p?`${esc(chars().find(c=>c.id===p.champion)?.name||p.champion)}`:'Vaga livre'}</small></div></article>`}).join('')}</div><button class="btn" id="v16-tour-leave">SAIR</button></div>`;a.querySelector('#v16-tour-leave').onclick=()=>{closeTournament();renderTournamentHub()}}
  function roundLabel(count){return count<=2?'FINAL':count<=4?'SEMIFINAL':'QUARTAS DE FINAL'}
  function setupTourRound(players){tour.roundPlayers=players.slice();tour.roundPairs=[];tour.roundWinners=[];tour.matchIndex=0;for(let i=0;i<players.length;i+=2)tour.roundPairs.push([players[i],players[i+1]]);const bracket={round:roundLabel(players.length),pairs:tour.roundPairs.map(p=>p.map(x=>x.name)),players:tour.players};broadcast({type:'tour-bracket',players:tour.players,bracket});renderTourBracket(bracket,true);setTimeout(()=>startTourMatch(tour.roundPairs[0],0),1200)}
  function startTournamentBracket(){if(tour.mode!=='host'||tour.players.length!==tour.size)return;tour.roundNumber=1;setupTourRound(tour.players)}
  function renderTourBracket(bracket,isHost){const a=appNode();if(!a)return;setScreen('v16-tour-bracket');drawOff();const pairs=bracket.pairs||[];a.innerHTML=`<div class="card mk-card mk-arena v16-tour-bracket"><header><small>COPA NIAK ONLINE</small><h2>${esc(bracket.round||'CHAVE')}</h2></header><div class="v16-bracket-grid">${pairs.map((p,i)=>`<article><small>CONFRONTO ${i+1}</small><b>${esc(p[0]||'?')}</b><strong>VS</strong><b>${esc(p[1]||'?')}</b></article>`).join('')}</div><p>${isHost?'Você é o coordenador da chave. As lutas começam automaticamente.':'Aguarde sua luta. O HOST coordena a simulação.'}</p></div>`}
  function startTourMatch(pair,index){if(tour.mode!=='host'||!pair)return;const ids=pair.map(x=>x.id);tour.current={pair,index,ids,settled:false};const stage=stages()[Math.floor(Math.random()*Math.max(1,stages().length))]?.id||null;const [a,b]=pair;const host=a.isHost?a:b.isHost?b:null;const p1=host||a;const p2=host?(host===a?b:a):b;tour.current.p1=p1;tour.current.p2=p2;tour.current.ids=[p1.id,p2.id];
    try{startFight(p1.champion,'pvp',p2.champion,stage)}catch(e){console.error('[V16 TOUR start]',e);return}
    try{fight.v16Tournament=true;fight.v16TourP1=p1;fight.v16TourP2=p2;fight.p1.v16OnlineSkin=p1.skin;fight.p1.v16PlayerName=p1.name;fight.p1.v16OnlineTitle=p1.title;fight.p2.v16OnlineSkin=p2.skin;fight.p2.v16PlayerName=p2.name;fight.p2.v16OnlineTitle=p2.title}catch(_){ }
    for(const pl of [p1,p2])if(!pl.isHost){const c=tour.conns.get(pl.id);try{c?.send({type:'tour-setup',p1:p1.champion,p2:p2.champion,stage,side:pl.id===p1.id?'p1':'p2',p1Profile:p1,p2Profile:p2})}catch(_){} }
    showOnlineVs(fight,p1,p2)
  }
  const P2_TO_P1={ArrowLeft:'KeyA',ArrowRight:'KeyD',ArrowUp:'KeyW',ArrowDown:'KeyS',Numpad1:'KeyJ',Numpad2:'KeyK',Numpad3:'KeyL',Numpad5:'KeyI',Numpad6:'KeyO',Numpad4:'KeyG',Numpad0:'KeyQ',Numpad7:'KeyT',Numpad9:'KeyH'};
  function routeTourKey(pid,code,down){if(!tour.current||typeof fight==='undefined'||!fight)return;const side=tour.current.p1.id===pid?'p1':'p2';const out=side==='p1'?(P2_TO_P1[code]||code):code;window.keys=window.keys||{};window.justPressed=window.justPressed||{};if(down&&!window.keys[out])window.justPressed[out]=true;window.keys[out]=!!down}
  function startTourGuestMatch(m,me){tour.guestActive=true;try{startFight(m.p1,'pvp',m.p2,m.stage);fight.v16TournamentGuest=true;fight.p1.v16OnlineSkin=m.p1Profile?.skin;fight.p1.v16PlayerName=m.p1Profile?.name;fight.p1.v16OnlineTitle=m.p1Profile?.title;fight.p2.v16OnlineSkin=m.p2Profile?.skin;fight.p2.v16PlayerName=m.p2Profile?.name;fight.p2.v16OnlineTitle=m.p2Profile?.title}catch(e){console.error('[V16 TOUR guest]',e)};tour.current={side:m.side,p1:m.p1Profile,p2:m.p2Profile};showOnlineVs(fight,m.p1Profile||{},m.p2Profile||{})}
  function receiveTourState(m){if(!tour.guestActive)return;try{fight=m.fight;if(m.bestOfThree)bestOfThree=m.bestOfThree;if(m.sparks)sparks=m.sparks;screen='fight';draw(fight)}catch(_){}}
  function tourMatchSettled(wonP1){if(tour.mode!=='host'||!tour.current||tour.current.settled)return;tour.current.settled=true;const winner=wonP1?tour.current.p1:tour.current.p2;data.tourMatches++;tour.roundWinners.push(winner);save();const bracket={round:roundLabel(tour.roundPlayers.length),pairs:tour.roundPairs.map(p=>p.map(x=>x.name)),winner:winner.name};broadcast({type:'tour-match-result',winnerName:winner.name,bracket});if(tour.roundWinners.length<tour.roundPairs.length){const next=tour.roundWinners.length;setTimeout(()=>startTourMatch(tour.roundPairs[next],next),1800);return}if(tour.roundWinners.length>1){tour.roundNumber++;const nextRound=tour.roundWinners.slice();setTimeout(()=>setupTourRound(nextRound),1800);return}tour.winner=winner;data.tourWins+=winner.isHost?1:0;save();if(winner.isHost)grantTournamentReward();broadcast({type:'tour-finish',winner});showTourFinish(winner,tour.players[0]);tour.current=null}
  function grantTournamentReward(){const s=gstate();if(s){s.coins=(Number(s.coins)||0)+3000;try{persist()}catch(_){}}try{window.ProProgression?.grantTitle?.('Campeão Online')}catch(_){}toast('CAMPEÃO ONLINE · +3.000 GOLD · TÍTULO LIBERADO','reward',3500)}
  function showTourFinish(winner,me){const a=appNode();if(!a)return;setScreen('v16-tour-finish');drawOff();const mine=winner?.id===me?.id;a.innerHTML=`<div class="card mk-card mk-arena v16-tour-finish ${mine?'winner':''}"><div>🏆</div><small>COPA NIAK ONLINE</small><h2>${mine?'VOCÊ É O CAMPEÃO!':'TORNEIO ENCERRADO'}</h2><p>${esc(winner?.name||'???')} venceu a chave.</p>${mine?'<b>+3.000 GOLD · Título Campeão Online</b>':''}<button class="btn big" id="v16-tour-done">VOLTAR AOS MODOS</button></div>`;a.querySelector('#v16-tour-done').onclick=()=>{closeTournament();window.renderModes?.()}}

  /* ---------- final wrappers ---------- */
  const baseStart=window.startFight;
  if(typeof baseStart==='function')window.startFight=function(){const r=baseStart.apply(this,arguments);try{if(arguments[1]==='lan'&&lan()?.matchType==='ranked'&&fight?.mode==='lan'){ranked.inMatch=true;applyOnlineIdentity(fight);const a=document.getElementById('pause-select'),b=document.getElementById('pause-lobby');if(a)a.textContent='DESISTIR E VOLTAR À SELEÇÃO · DERROTA';if(b)b.textContent='DESISTIR E SAIR · DERROTA'}}catch(_){ }return r};

  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('#pause-select,#pause-lobby')||lan()?.matchType!=='ranked'||!ranked.inMatch)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(ranked.settled)finishRankedView();else rankedLocalForfeit();
  },true);
  const forfeitOnUnload=()=>{
    if(ranked.settled||!ranked.inMatch)return;
    ranked.settled=true;try{ranked.conn?.send({type:'v16rank-forfeit',name:playerName()})}catch(_){ }
    settleRanked(false,ranked.remote||lan()?.remoteProfile||{},lan()?.ping||0,'VOCÊ DESISTIU');
  };
  window.addEventListener('pagehide',forfeitOnUnload);
  window.addEventListener('beforeunload',forfeitOnUnload);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('v16-ranked-forfeit')){e.preventDefault();e.stopImmediatePropagation();document.getElementById('v16-forfeit-done')?.click()}},true);

  // Remote skin support: pro-v8-supreme reads this property after the small source patch below.
  const baseRegister=window.registerRoundWin;
  if(typeof baseRegister==='function')window.registerRoundWin=function(winner){const f=typeof fight!=='undefined'?fight:null;const r=baseRegister.apply(this,arguments);try{if(f&&f===fight&&f.matchOver&&lan()?.matchType==='ranked')hostSettleRanked()}catch(e){console.warn('[V16 ranked settle]',e)}return r};

  const baseResult=window.showMatchResult;
  if(typeof baseResult==='function')window.showMatchResult=function(won){if(tour.mode==='host'&&tour.current&&typeof fight!=='undefined'&&fight?.v16Tournament){tourMatchSettled(!!won);return}return baseResult.apply(this,arguments)};

  const baseLoop=window.loop;
  if(typeof baseLoop==='function')window.loop=function(now){
    if(tour.mode==='guest'&&tour.guestActive&&typeof fight!=='undefined'&&fight){try{draw(fight)}catch(_){}requestAnimationFrame(window.loop);return}
    const r=baseLoop(now);
    if(tour.mode==='host'&&tour.current&&typeof fight!=='undefined'&&fight?.v16Tournament&&performance.now()-(tour.current.lastState||0)>40){tour.current.lastState=performance.now();try{const clean=JSON.parse(JSON.stringify(fight,(k,v)=>(k==='owner'||k==='knunkaBurnOwner')?undefined:v));const msg={type:'tour-state',fight:clean,sparks:typeof sparks!=='undefined'?sparks:[],bestOfThree:typeof bestOfThree!=='undefined'?bestOfThree:null};broadcast(msg,tour.current.ids.filter(id=>!tour.players.find(p=>p.id===id)?.isHost))}catch(_){}}
    return r
  };

  const GAME_KEYS=new Set(['KeyA','KeyD','KeyW','KeyS','KeyJ','KeyK','KeyL','KeyI','KeyO','KeyG','KeyQ','KeyT','KeyH']);
  document.addEventListener('keydown',e=>{if(tour.mode==='guest'&&tour.guestActive&&GAME_KEYS.has(e.code)){try{tour.hostConn?.send({type:'tour-key',code:guestToP2(e.code),down:true})}catch(_){}e.preventDefault();e.stopImmediatePropagation()}else if(tour.mode==='host'&&tour.current&&!tour.current.p1?.isHost&&!tour.current.p2?.isHost&&GAME_KEYS.has(e.code)){e.preventDefault();e.stopImmediatePropagation()}},true);
  document.addEventListener('keyup',e=>{if(tour.mode==='guest'&&tour.guestActive&&GAME_KEYS.has(e.code)){try{tour.hostConn?.send({type:'tour-key',code:guestToP2(e.code),down:false})}catch(_){}e.preventDefault();e.stopImmediatePropagation()}},true);
  function guestToP2(code){const map={KeyA:'ArrowLeft',KeyD:'ArrowRight',KeyW:'ArrowUp',KeyS:'ArrowDown',KeyJ:'Numpad1',KeyK:'Numpad2',KeyL:'Numpad3',KeyI:'Numpad5',KeyO:'Numpad6',KeyG:'Numpad4',KeyQ:'Numpad0',KeyT:'Numpad7',KeyH:'Numpad9'};return map[code]||code}

  function cleanModes(){
    ['mode-ranked','mode-online-ranked','mode-chaos','mode-mix','mode-boss','mode-v5-bosses'].forEach(id=>document.getElementById(id)?.remove());
    const grid=document.querySelector('.mode-grid');if(!grid)return;
    if(!document.getElementById('mode-ranked-p2p')){
      grid.insertAdjacentHTML('beforeend',`<button id="mode-ranked-p2p" class="mode-card mk-mode v16-ranked-card"><div class="mode-icon">💎</div><span class="mode-badge">EXCLUSIVO P2P · BUSCA ONLINE</span><h3>RANQUEADO <span class="mk-gold">P2P</span></h3><p>Busque um jogador real, suba de Ferro a Primordial e ganhe Gold, Psy e Vandais.</p></button>`);
      document.getElementById('mode-ranked-p2p').onclick=renderRanked;
    }
    if(!document.getElementById('mode-online-tournament')){
      grid.insertAdjacentHTML('beforeend',`<button id="mode-online-tournament" class="mode-card mk-mode v16-tour-card"><div class="mode-icon">🏆</div><span class="mode-badge">2 / 4 / 8 JOGADORES</span><h3>TORNEIO <span class="mk-gold">ONLINE</span></h3><p>O criador da sala escolhe quantas pessoas entram na chave P2P.</p></button>`);
      document.getElementById('mode-online-tournament').onclick=renderTournamentHub;
    }
  }
  const oldModes=window.renderModes;if(typeof oldModes==='function')window.renderModes=function(){const r=oldModes.apply(this,arguments);setTimeout(cleanModes,0);return r};
  const obs=new MutationObserver(()=>{if(document.querySelector('.mode-grid'))cleanModes();if(lan()?.matchType==='ranked'&&document.querySelector('.card.select'))decorateLanSelect()});obs.observe(document.body,{childList:true,subtree:true});

  // Let the safe loader go even if one optional enhancement failed.
  setTimeout(()=>window.__sortepSafeBoot?.(),80);
  window.LutadorOnlinePro=Object.freeze({version:VERSION,data,save,renderRanked,renderTournamentHub,cancelActive});
})();
