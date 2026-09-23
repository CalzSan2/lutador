/* Manutenção temporária do R.A.V.A.M. Não altera compras nem progresso salvo. */
(()=>{
  'use strict';
  if(window.NiakMaintenanceV36)return;
  const blocked=new Set(['priya','kain','aria','leo','tharoth','aurora','kai_draconis','priya_aranya','nutoa','rifana','petros']);
  const isBlocked=id=>blocked.has(String(id||''));

  // Retira as Lendas apenas do catálogo em memória. O save permanece intacto.
  try{
    if(typeof CHARACTERS!=='undefined')for(let i=CHARACTERS.length-1;i>=0;i--){
      const c=CHARACTERS[i];if(c?.ravamOnly||isBlocked(c?.id))CHARACTERS.splice(i,1);
    }
  }catch(_){ }

  const css=document.createElement('style');
  css.textContent=`#mode-ravam.niak-maintenance{opacity:.63;cursor:not-allowed!important;border-color:#f6bc55!important;filter:saturate(.52)}
    #mode-ravam.niak-maintenance .mode-badge{background:#6b4318!important;color:#ffdc9a!important}
    .niak-maintenance-screen{max-width:700px;margin:7vh auto;text-align:center;border:1px solid #b98546;padding:40px 28px}
    .niak-maintenance-screen .maintenance-icon{font-size:64px;line-height:1}
    .niak-maintenance-screen h2{color:#ffdc9a}
    .niak-maintenance-screen p{line-height:1.6;color:#d5d7df}`;
  document.head.appendChild(css);

  function showMaintenance(){
    try{screen='ravam-maintenance';drawCanvas?.()}catch(_){ }
    const host=document.getElementById('app');if(!host)return;
    host.innerHTML='<div class="card mk-card mk-arena niak-maintenance-screen"><div class="maintenance-icon">🛠️</div><small>R.A.V.A.M STUDIOS</small><h2>EM MANUTENÇÃO</h2><p>Este modo e suas Lendas estão temporariamente indisponíveis. Suas compras e seu progresso foram preservados.</p><button id="ravam-maintenance-back" class="btn big">← VOLTAR AOS MODOS</button></div>';
    document.getElementById('ravam-maintenance-back').onclick=()=>window.renderModes?.();
  }
  function markCard(){
    const card=document.getElementById('mode-ravam');if(!card)return;
    card.disabled=true;card.onclick=null;card.classList.add('niak-maintenance');
    card.setAttribute('aria-label','R.A.V.A.M Studios em manutenção, indisponível');
    const badge=card.querySelector('.mode-badge');if(badge&&badge.textContent!=='EM MANUTENÇÃO')badge.textContent='EM MANUTENÇÃO';
    const title=card.querySelector('h3');if(title&&title.textContent!=='R.A.V.A.M · EM MANUTENÇÃO')title.textContent='R.A.V.A.M · EM MANUTENÇÃO';
    const copy=card.querySelector('p');if(copy&&copy.textContent!=='Modo e personagens temporariamente indisponíveis. Progresso preservado.')copy.textContent='Modo e personagens temporariamente indisponíveis. Progresso preservado.';
  }
  const oldModes=window.renderModes;
  if(typeof oldModes==='function')window.renderModes=function(){const r=oldModes.apply(this,arguments);markCard();setTimeout(markCard,0);return r};
  window.renderRavamMode=showMaintenance;

  const oldLobby=window.renderLanLobby;
  if(typeof oldLobby==='function')window.renderLanLobby=function(scope){if(scope==='ravam'||scope===true)return showMaintenance();return oldLobby.apply(this,arguments)};
  if(window.LutadorOnlineV16)window.LutadorOnlineV16.openRavam=showMaintenance;

  const oldStart=window.startFight;
  if(typeof oldStart==='function')window.startFight=function(playerId,mode,player2Id){
    if(mode==='ravam'||isBlocked(playerId)||isBlocked(player2Id)){showMaintenance();return}
    return oldStart.apply(this,arguments);
  };
  if(window.__lan?.ravamOnly){try{window.LutadorOnlineV16?.close?.()}catch(_){ }window.__lan.ravamOnly=false}
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&typeof screen!=='undefined'&&screen==='ravam-maintenance'){e.preventDefault();e.stopImmediatePropagation();window.renderModes?.()}},true);
  markCard();
  window.NiakMaintenanceV36=Object.freeze({ravam:true,isBlocked});
})();
