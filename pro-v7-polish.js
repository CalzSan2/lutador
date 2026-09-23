/* SORTEP NIAK — POLISH PACK 7.0
 * Correções de layout + 20+ melhorias de qualidade sem trocar as regras principais do combate.
 */
(()=>{
  'use strict';
  if(window.LutadorV7?.version)return;
  const VERSION='7.0.0';
  const KEY='lutador-v7-polish';
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gs=()=>{try{return typeof state!=='undefined'&&state?state:null}catch(_){return null}};
  const game=()=>{try{return typeof fight!=='undefined'&&fight?fight:null}catch(_){return null}};
  const chars=()=>{try{return typeof CHARACTERS!=='undefined'?CHARACTERS:[]}catch(_){return []}};
  const byId=id=>chars().find(c=>c.id===id);
  const defaults=()=>({daily:{day:'',streak:0,claimed:false},sessionStarts:Date.now(),lastTip:0,lowFps:false,quickHubOpens:0});
  let data=defaults();try{data={...defaults(),...JSON.parse(localStorage.getItem(KEY)||'{}')};data.daily={...defaults().daily,...(data.daily||{})}}catch(_){data=defaults()}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}};
  const today=()=>new Date().toISOString().slice(0,10);
  const dayNumber=s=>{const d=new Date((s||today())+'T12:00:00');return Math.floor(d.getTime()/86400000)};
  const safePersist=()=>{try{if(typeof persist==='function')persist()}catch(_){};try{window.LutadorExpansion?.save?.()}catch(_){};try{window.LutadorComplete?.save?.()}catch(_){}};
  const toast=(text,tone='normal')=>{try{window.LutadorV6?.toast?.(text,tone)}catch(_){};let h=document.querySelector('.v5-toast-host');if(!h){h=document.createElement('div');h.className='v5-toast-host';document.body.appendChild(h)}const e=document.createElement('div');e.className='v5-toast '+tone;e.textContent=text;h.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.remove('show');setTimeout(()=>e.remove(),180)},1800)};

  const TIPS=[
    'Gancho derruba. No chão, apenas chute causa dano.',
    'Esquive no tempo certo para abrir uma janela de contra-ataque.',
    'Stamina baixa reduz sua capacidade de pressionar e defender.',
    'F1 abre a lista completa de golpes e o laboratório de combate.',
    'Rojo domina pressão e sangramento; Thuvaa controla espaço com gelo.',
    'Use o Treino para conferir hitbox, dano, recuperação e frame advantage.',
    'Preservar stamina no fim do round vale mais que atacar sem parar.',
    'O Super só causa efeito depois que a apresentação da Ultimate termina.'
  ];

  function favoriteId(){
    const v6=window.LutadorV6?.data;return v6?.lastSelected||v6?.favorites?.[0]||'rojo';
  }
  function recent(){return window.LutadorV6?.data?.recent?.[0]||null}
  function rankName(){try{const d=window.LutadorComplete?.division?.();return d?`${d.icon||'⬟'} ${d.name}`:'⬟ FERRO'}catch(_){return '⬟ FERRO'}}
  function inputName(){const gp=window.LutadorExpansion?.data?.gamepad;const pads=navigator.getGamepads?.()||[];return gp?.enabled!==false&&[...pads].some(Boolean)?'GAMEPAD':'TECLADO'}
  function sessionText(){const s=Math.max(0,Math.floor((Date.now()-data.sessionStarts)/1000)),m=Math.floor(s/60),h=Math.floor(m/60);return h?`${h}h ${m%60}m`:`${m} min`}
  function aiDifficulty(){return String(window.LutadorComplete?.meta?.aiDifficulty||'normal')}

  /* Daily reward + streak. */
  function syncDaily(){
    const t=today();if(data.daily.day===t)return;
    const prev=data.daily.day,delta=prev?dayNumber(t)-dayNumber(prev):99;
    data.daily={day:t,streak:delta===1?Math.min(30,(Number(data.daily.streak)||0)+1):1,claimed:false};save();
  }
  function claimDaily(){
    syncDaily();if(data.daily.claimed){toast('RECOMPENSA DIÁRIA JÁ RESGATADA','speed');return false}
    const s=gs();if(!s)return false;const streak=Math.max(1,data.daily.streak),gold=250+Math.min(750,(streak-1)*50),vand=streak%7===0?10:3;
    s.coins=(Number(s.coins)||0)+gold;s.vandais=(Number(s.vandais)||0)+vand;data.daily.claimed=true;save();safePersist();toast(`DIA ${streak} · +${gold} GOLD · +${vand} VANDAIS`,'reward');return true;
  }

  /* Central rápida em diálogo — muitas funções sem poluir o lobby. */
  function ensureHub(){
    let d=document.getElementById('v7-quick-hub');if(d)return d;
    d=document.createElement('dialog');d.id='v7-quick-hub';d.className='v7-hub';document.body.appendChild(d);
    d.addEventListener('click',e=>{if(e.target===d)d.close()});return d;
  }
  function action(id){
    const close=()=>document.getElementById('v7-quick-hub')?.close();
    if(id==='play'){close();window.renderModes?.();return}
    if(id==='training'){close();window.LutadorV5?.renderTrainingSelect?.();return}
    if(id==='story'){close();window.renderStorySelect?.();return}
    if(id==='tournament'){close();window.renderTournamentSelect?.();return}
    if(id==='profile'){close();window.LutadorV6?.openProfile?.();return}
    if(id==='wardrobe'){close();window.LutadorV6?.openWardrobe?.();return}
    if(id==='events'){close();window.LutadorV6?.openEvents?.();return}
    if(id==='ach'){close();window.LutadorExpansion?.openAchievements?.();return}
    if(id==='controls'){close();window.LutadorExpansion?.openControls?.();return}
    if(id==='settings'){close();window.LutadorUltimate?.openSettings?.();return}
    if(id==='save'){safePersist();try{window.LutadorExpansion?.safeBackup?.(false)}catch(_){}toast('PROGRESSO SALVO','reward');openHub();return}
    if(id==='daily'){if(claimDaily())openHub();return}
  }
  function openHub(){
    syncDaily();data.quickHubOpens++;save();const d=ensureHub(),fav=byId(favoriteId()),r=recent(),st=gs();
    d.innerHTML=`<div class="v7-hub-head"><div><small>SORTEP NIAK · POLISH ${VERSION}</small><h2>CENTRAL RÁPIDA</h2></div><button class="v7-hub-close" aria-label="Fechar">×</button></div><div class="v7-hub-body">
      <div class="v7-hub-grid">
        <button class="v7-hub-action" data-v7="play"><b>⚔ JOGAR</b><span>Abra os modos de jogo.</span></button>
        <button class="v7-hub-action" data-v7="training"><b>🥊 TREINO</b><span>Hitbox, frame data e dummy.</span></button>
        <button class="v7-hub-action" data-v7="story"><b>📖 HISTÓRIA</b><span>Continue a campanha narrativa.</span></button>
        <button class="v7-hub-action" data-v7="tournament"><b>🏆 TORNEIO</b><span>Entre direto na chave.</span></button>
        <button class="v7-hub-action" data-v7="profile"><b>👤 PERFIL</b><span>Histórico e estatísticas.</span></button>
        <button class="v7-hub-action" data-v7="wardrobe"><b>🎨 VESTIÁRIO</b><span>Skins, molduras e poses.</span></button>
        <button class="v7-hub-action" data-v7="events"><b>⚡ EVENTOS</b><span>Desafios temporários.</span></button>
        <button class="v7-hub-action" data-v7="ach"><b>🏅 CONQUISTAS</b><span>Metas e recompensas.</span></button>
        <button class="v7-hub-action" data-v7="controls"><b>⌨ CONTROLES</b><span>Teclado e gamepad.</span></button>
        <button class="v7-hub-action" data-v7="settings"><b>⚙ CONFIGURAÇÕES</b><span>Vídeo, áudio e acessibilidade.</span></button>
        <button class="v7-hub-action" data-v7="save"><b>💾 SALVAR</b><span>Força salvamento e backup local.</span></button>
        <button class="v7-hub-action gold" data-v7="daily"><b>🎁 RECOMPENSA DIÁRIA</b><span>${data.daily.claimed?'Resgatada hoje':`Dia ${data.daily.streak} · disponível agora`}</span></button>
      </div>
      <section class="v7-hub-section"><h3>STATUS DA SESSÃO</h3><div class="v7-hub-row"><div class="v7-hub-stat"><small>CAMPEÃO FAVORITO</small><b>${esc(fav?.name||'ROJO')}</b></div><div class="v7-hub-stat"><small>STATUS</small><b>ARENA</b></div><div class="v7-hub-stat"><small>ENTRADA</small><b>${inputName()}</b></div><div class="v7-hub-stat"><small>SESSÃO</small><b>${sessionText()}</b></div></div></section>
      <section class="v7-hub-section"><h3>IA RÁPIDA</h3><div class="v7-difficulty">${[['facil','FÁCIL'],['normal','NORMAL'],['dificil','DIFÍCIL'],['insano','INSANO']].map(([k,n])=>`<button data-v7-ai="${k}" class="${aiDifficulty()===k?'active':''}">${n}</button>`).join('')}</div></section>
      <section class="v7-hub-section"><h3>ÚLTIMA PARTIDA</h3><div class="v7-hub-row"><div class="v7-hub-stat"><small>RESULTADO</small><b>${r?(r.won?'VITÓRIA':'DERROTA'):'—'}</b></div><div class="v7-hub-stat"><small>CONFRONTO</small><b>${r?`${esc(r.p1n)} × ${esc(r.p2n)}`:'SEM PARTIDA'}</b></div><div class="v7-hub-stat"><small>DANO</small><b>${fmt(r?.damage||0)}</b></div><div class="v7-hub-stat"><small>COMBO</small><b>${fmt(r?.combo||0)}x</b></div></div></section>
      <section class="v7-hub-section"><h3>DICA DA ARENA</h3><div class="v7-hub-stat"><b>${esc(TIPS[Math.floor(Date.now()/12000)%TIPS.length])}</b></div></section>
    </div>`;
    d.querySelector('.v7-hub-close').onclick=()=>d.close();d.querySelectorAll('[data-v7]').forEach(b=>b.onclick=()=>action(b.dataset.v7));d.querySelectorAll('[data-v7-ai]').forEach(b=>b.onclick=()=>{const c=window.LutadorComplete;if(c?.meta){c.meta.aiDifficulty=b.dataset.v7Ai;c.save?.();d.querySelectorAll('[data-v7-ai]').forEach(x=>x.classList.toggle('active',x===b));toast('IA · '+b.textContent,'speed')}});if(!d.open)d.showModal();
  }

  /* Lobby polish + anti-overlap. */
  function decorateLobby(){
    const menu=document.querySelector('.menu.pro-lobby-ready');if(!menu)return;
    menu.classList.add('v7-lobby');
    menu.querySelectorAll('.v6-live-strip').forEach((x,i)=>{if(i)x.remove()});menu.querySelectorAll('.v6-lobby-actions').forEach((x,i)=>{if(i)x.remove()});
    if(!menu.querySelector('.v7-hub-button')){const b=document.createElement('button');b.className='v7-hub-button';b.textContent='☰ CENTRAL RÁPIDA';b.onclick=openHub;menu.appendChild(b)}
    const hero=menu.querySelector('.pro-lobby-hero');if(hero&&!hero.querySelector('.v7-hero-status')){const s=document.createElement('section');s.className='v7-hero-status';s.innerHTML='<div class="v7-status-chip good"><small>SALVAMENTO</small><b data-v7-save>AUTOMÁTICO</b></div><div class="v7-status-chip cyan"><small>ENTRADA</small><b data-v7-input>TECLADO</b></div><div class="v7-status-chip"><small>DESEMPENHO</small><b data-v7-fps>60 FPS</b></div><div class="v7-status-chip gold"><small>SESSÃO</small><b data-v7-session>0 min</b></div>';hero.appendChild(s)}
  }

  /* Seleção: reordena visualmente e adiciona navegação por teclado. */
  let focusIndex=0;
  function decorateSelect(){
    const root=document.querySelector('.select.v6-select');if(!root)return;root.classList.add('v7-select');
    const roster=root.querySelector('.mk-roster');if(!roster)return;
    if(!root.querySelector('.v7-select-count')){const n=document.createElement('span');n.className='v7-select-count';root.querySelector('.pick-status')?.appendChild(n)}
    updateSelectCount(root);
  }
  function visibleCards(root=document.querySelector('.v7-select')){return root?[...root.querySelectorAll('.mk-fighter[data-id]:not(.v6-hidden)')]:[]}
  function updateSelectCount(root=document.querySelector('.v7-select')){if(!root)return;const n=root.querySelector('.v7-select-count'),cards=visibleCards(root);if(n)n.textContent=`${cards.length} CAMPEÕES`;focusIndex=Math.min(focusIndex,Math.max(0,cards.length-1))}
  function focusCard(delta=0,activate=false){const root=document.querySelector('.v7-select');if(!root)return false;const cards=visibleCards(root);if(!cards.length)return false;focusIndex=(focusIndex+delta+cards.length)%cards.length;cards.forEach((c,i)=>c.classList.toggle('v7-keyfocus',i===focusIndex));const c=cards[focusIndex];c.scrollIntoView({block:'nearest'});c.dispatchEvent(new Event('mouseenter'));if(activate)c.click();return true}

  /* Resultado: atalhos e limpeza visual. */
  function decorateResult(){const card=document.querySelector('#match-result-overlay .match-result-card');if(!card||card.querySelector('.v7-result-hint'))return;const p=document.createElement('p');p.className='v7-result-hint';p.textContent='ATALHOS · R = jogar novamente · ESC = lobby';card.appendChild(p)}

  /* Auto-pause ao perder foco evita inputs presos / luta correndo em segundo plano. */
  document.addEventListener('visibilitychange',()=>{const f=game();if(document.hidden&&f&&!f.over&&!f.matchOver){f.paused=true;toast('JOGO PAUSADO · JANELA SEM FOCO','speed')}});

  /* FPS monitor leve + modo baixo FPS visual. */
  let fps=60,frames=0,last=performance.now();function perfLoop(t){frames++;if(t-last>=1000){fps=Math.round(frames*1000/(t-last));frames=0;last=t;const low=fps<35;data.lowFps=low;document.body.classList.toggle('v7-low-fps',low);document.querySelectorAll('[data-v7-fps]').forEach(x=>{x.textContent=`${fps} FPS`;x.parentElement?.classList.toggle('gold',low)})}requestAnimationFrame(perfLoop)}requestAnimationFrame(perfLoop);
  setInterval(()=>{document.querySelectorAll('[data-v7-session]').forEach(x=>x.textContent=sessionText());document.querySelectorAll('[data-v7-input]').forEach(x=>x.textContent=inputName())},1000);

  /* Auto-save periódico e indicador. */
  setInterval(()=>{safePersist();const t=new Date();document.querySelectorAll('[data-v7-save]').forEach(x=>x.textContent=`SALVO ${t.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`)},45000);

  /* Atalhos sem interferir na luta / inputs. */
  document.addEventListener('keydown',e=>{
    const tag=e.target?.tagName;if(/INPUT|TEXTAREA|SELECT/.test(tag)||e.target?.isContentEditable)return;
    const result=document.querySelector('#match-result-overlay');
    if(result){if(e.code==='KeyR'){document.getElementById('result-replay')?.click();e.preventDefault();return}if(e.code==='Escape'){document.getElementById('result-lobby')?.click();e.preventDefault();return}}
    if(document.querySelector('.v7-select')){if(e.code==='ArrowRight'){if(focusCard(1))e.preventDefault()}else if(e.code==='ArrowLeft'){if(focusCard(-1))e.preventDefault()}else if(e.code==='ArrowDown'){if(focusCard(4))e.preventDefault()}else if(e.code==='ArrowUp'){if(focusCard(-4))e.preventDefault()}else if(e.code==='Enter'){if(focusCard(0,true))e.preventDefault()}}
    if(!game()&&e.code==='F2'){e.preventDefault();openHub()}
  },true);

  /* Watchdog de UI: limpa duplicados e reaplica patches sem recriar elementos. */
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorateLobby();decorateSelect();decorateResult();document.querySelectorAll('#v6-fight-hud').forEach(x=>x.remove());const root=document.querySelector('.v7-select');if(root)updateSelectCount(root)})});observer.observe(document.body,{childList:true,subtree:true});

  syncDaily();decorateLobby();decorateSelect();decorateResult();
  window.LutadorV7=Object.freeze({version:VERSION,data,save,openHub,claimDaily,decorateLobby,decorateSelect});
})();
