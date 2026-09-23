/* COROA DOS DEZ — torneio sazonal em sequência, exclusivamente em partidas ranqueadas P2P. */
(()=>{
  'use strict';
  if(window.NiakSeasonEvent)return;
  const VERSION='43.0.0',KEY='niak-season-event-v43',GOAL=10,MAX_LOSSES=3;
  const REWARD={coins:100000,psy:500,vandais:5000};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const season=()=>window.ProProgression?.getSeasonInfo?.()||{number:1,name:'TEMPORADA 01',remainingLabel:'--',endDate:'--'};
  const gameState=()=>{try{return state}catch(_){return null}};
  const appNode=()=>{try{return app}catch(_){return document.getElementById('app')}};
  const empty=number=>({season:String(number),status:'ready',wins:0,losses:0,startedAt:0,seen:[],matches:[],claimed:false});
  let record;
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');record=saved&&typeof saved==='object'?saved:empty(season().number)}catch(_){record=empty(season().number)}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(record));return true}catch(_){return false}}
  function ensureSeason(){
    const current=String(season().number);
    if(record.season!==current){record=empty(current);save()}
    record.wins=Math.max(0,Math.min(GOAL,Math.floor(Number(record.wins)||0)));
    record.losses=Math.max(0,Math.min(MAX_LOSSES,Math.floor(Number(record.losses)||0)));
    if(!Array.isArray(record.seen))record.seen=[];
    if(!Array.isArray(record.matches))record.matches=[];
    if(!['ready','active','eliminated','complete'].includes(record.status))record.status='ready';
    if(record.status==='active'&&record.wins>=GOAL)record.status='complete';
    if(record.status==='active'&&record.losses>=MAX_LOSSES)record.status='eliminated';
  }
  function notify(message,tone='reward'){
    try{if(window.LutadorV6?.toast){window.LutadorV6.toast(message,tone,3600);return}}catch(_){}
    const notice=document.createElement('div');notice.className='season-event-notice';notice.textContent=message;document.body.appendChild(notice);setTimeout(()=>notice.remove(),3700);
  }
  function grantPrize(){
    if(record.status!=='complete')return false;
    const s=gameState();if(!s)return false;
    const receipts=Array.isArray(s.seasonEventRewards)?s.seasonEventRewards:[];
    if(!receipts.includes(record.season)){
      s.coins=Math.max(0,Number(s.coins)||0)+REWARD.coins;
      s.psy=Math.max(0,Math.floor(Number(s.psy)||0))+REWARD.psy;
      s.vandais=Math.max(0,Math.floor(Number(s.vandais)||0))+REWARD.vandais;
      s.seasonEventRewards=[...receipts,record.season];
      try{persist()}catch(_){return false}
      notify('CAMPEÃO DA TEMPORADA! +100.000 GOLD · +500 PSY · +5.000 VANDAIS');
    }
    record.claimed=true;save();return true;
  }
  function processMatch(match,silent=false){
    ensureSeason();
    if(record.status!=='active'||!match||String(match.season)!==record.season)return false;
    const id=String(match.matchId||'');
    if(!id||record.seen.includes(id)||!Number.isFinite(Number(match.at))||Number(match.at)<record.startedAt)return false;
    if(match.result!=='VITÓRIA'&&match.result!=='DERROTA')return false;
    record.seen.push(id);record.seen=record.seen.slice(-32);
    record.matches.unshift({id,result:match.result,opponent:String(match.opponent||'RIVAL').slice(0,24),reason:String(match.reason||'PARTIDA').slice(0,34),at:Number(match.at)});
    record.matches=record.matches.slice(0,12);
    if(match.result==='VITÓRIA')record.wins++;else record.losses++;
    if(record.wins>=GOAL)record.status='complete';
    else if(record.losses>=MAX_LOSSES)record.status='eliminated';
    save();
    if(record.status==='complete')grantPrize();
    if(!silent){
      const message=record.status==='eliminated'?'EVENTO ENCERRADO · 3 DERROTAS':record.status==='complete'?'COROA DOS DEZ CONQUISTADA!':`EVENTO · ${record.wins}/10 VITÓRIAS · ${record.losses}/3 DERROTAS`;
      notify(message,record.status==='eliminated'?'danger':'reward');
      if(document.getElementById('season-event-screen'))render();
    }
    return true;
  }
  function reconcile(){
    ensureSeason();
    if(record.status==='active'){
      const history=window.LutadorOnlinePro?.data?.history||[];
      for(const match of [...history].reverse())processMatch(match,true);
    }
    if(record.status==='complete'&&!record.claimed)grantPrize();
  }
  function start(){
    ensureSeason();if(record.status!=='ready')return;
    record.status='active';record.startedAt=Date.now();record.wins=0;record.losses=0;record.seen=[];record.matches=[];
    save();render();
  }
  function search(){
    reconcile();if(record.status!=='active')return;
    if(!window.LutadorOnlinePro?.renderRanked){notify('Ranqueado P2P indisponível. Recarregue o jogo.','danger');return}
    window.LutadorOnlinePro.renderRanked();
    const button=document.getElementById('v16-find-match');
    if(button)button.click();else notify('Não foi possível iniciar a busca P2P.','danger');
  }
  function render(){
    reconcile();const s=season(),a=appNode();if(!a)return;
    try{screen='season-event';drawCanvas()}catch(_){}
    const status=record.status;
    const header=status==='ready'?'O DESAFIO AINDA NÃO COMEÇOU':status==='active'?'SUA COROA ESTÁ EM DISPUTA':status==='complete'?'VOCÊ É O CAMPEÃO DA TEMPORADA':'ELIMINADO DESTA TEMPORADA';
    const ladder=Array.from({length:GOAL},(_,i)=>`<div class="season-event-step ${i<record.wins?'done':i===record.wins&&status==='active'?'next':''}"><b>${i<record.wins?'✓':i+1}</b><span>${i+1}ª VITÓRIA</span></div>`).join('');
    const losses=Array.from({length:MAX_LOSSES},(_,i)=>`<span class="${i<record.losses?'lost':''}">${i<record.losses?'✕':'◇'} DERROTA ${i+1}</span>`).join('');
    const log=record.matches.length?record.matches.map(m=>`<div class="season-event-log ${m.result==='VITÓRIA'?'win':'loss'}"><b>${m.result==='VITÓRIA'?'▲':'▼'} ${esc(m.result)}</b><span>${esc(m.opponent)} · ${esc(m.reason)}</span><small>${new Date(m.at).toLocaleDateString('pt-BR')}</small></div>`).join(''):'<p>Suas partidas do evento aparecerão aqui.</p>';
    a.innerHTML=`<section id="season-event-screen" class="season-event-screen">
      <header class="season-event-head"><div><small>EVENTO PRINCIPAL · ${esc(s.name)}</small><h1>COROA <em>DOS DEZ</em></h1><p>Torneio de resistência P2P. Vença dez partidas ranqueadas antes da terceira derrota. Cada confronto usa a melhor de três e os golpes normais do jogo.</p></div><div class="season-event-clock"><small>FIM DA TEMPORADA</small><b>${esc(s.remainingLabel)}</b><span>${esc(s.endDate)}</span></div></header>
      <div class="season-event-status"><strong>${header}</strong><span>${record.wins}/10 VITÓRIAS · ${record.losses}/3 DERROTAS</span></div>
      <div class="season-event-prizes"><article><small>GOLD</small><b>100.000</b></article><article><small>PSY</small><b>500</b></article><article><small>VANDAIS</small><b>5.000</b></article></div>
      <section class="season-event-panel"><div class="season-event-section-title"><h2>CAMINHO DA COROA</h2><small>10 vitórias para conquistar a recompensa</small></div><div class="season-event-ladder">${ladder}</div><div class="season-event-losses">${losses}</div></section>
      <div class="season-event-bottom"><section class="season-event-panel"><h2>REGRAS DO DESAFIO</h2><p>Inscreva-se uma vez nesta temporada. Após isso, <b>todas as partidas ranqueadas P2P</b> contam aqui: vitória avança um passo; derrota, inclusive desistência, consome uma das três chances. Na 3ª derrota, o evento fica indisponível até a próxima temporada.</p><p>Se o adversário desistir durante a luta, vale a vitória registrada pelo ranqueado. Cancelar a busca antes da partida não conta. Não há derrotas sorteadas: a dificuldade vem de vencer jogadores reais.</p><small>Resultado e prêmios ficam salvos neste dispositivo. Sem contas e servidor de validação, não existe classificação mundial nem proteção antifraude global.</small></section><section class="season-event-panel"><h2>ÚLTIMAS BATALHAS</h2><div class="season-event-history">${log}</div></section></div>
      <div class="season-event-actions">${status==='ready'?'<button class="btn big" id="season-event-start">INICIAR DESAFIO DA TEMPORADA</button>':''}${status==='active'?'<button class="btn big" id="season-event-search">BUSCAR PARTIDA P2P</button>':''}<button class="btn" id="season-event-back">VOLTAR AOS MODOS</button></div>
    </section>`;
    a.querySelector('#season-event-start')?.addEventListener('click',start);
    a.querySelector('#season-event-search')?.addEventListener('click',search);
    a.querySelector('#season-event-back')?.addEventListener('click',()=>window.renderModes?.());
  }
  function addCard(){
    const grid=document.querySelector('.mk-modes');if(!grid||document.getElementById('mode-season-event'))return;
    const button=document.createElement('button');button.id='mode-season-event';button.className='mode-card mk-mode season-event-card';
    button.innerHTML='<div class="mode-icon">♛</div><span class="mode-badge">EVENTO DA TEMPORADA · P2P</span><h3>COROA <span class="mk-gold">DOS DEZ</span></h3><p>10 vitórias antes de 3 derrotas. Prêmio: 100.000 Gold, 500 Psy e 5.000 Vandais.</p>';
    button.onclick=render;grid.appendChild(button);
  }
  const oldModes=window.renderModes;
  if(typeof oldModes==='function')window.renderModes=function(...args){const result=oldModes.apply(this,args);addCard();return result};
  window.addEventListener('niak:ranked-result',event=>processMatch(event.detail));
  const observer=new MutationObserver(()=>{
    if(record.status!=='active'||document.getElementById('season-event-return'))return;
    const actions=document.querySelector('.v16-ranked-actions');if(!actions)return;
    const button=document.createElement('button');button.id='season-event-return';button.className='btn';button.textContent=`♛ EVENTO ${record.wins}/10 · ${record.losses}/3`;
    button.onclick=render;actions.appendChild(button);
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{
    if(!document.getElementById('season-event-screen'))return;
    const before=record.season;ensureSeason();
    if(before!==record.season){render();return}
    const timer=document.querySelector('.season-event-clock b');if(timer)timer.textContent=season().remainingLabel;
  },30000);
  ensureSeason();reconcile();
  window.NiakSeasonEvent=Object.freeze({version:VERSION,open:render,getProgress:()=>({...record})});
})();
