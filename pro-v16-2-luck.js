/* SORTEP NIAK — V16.2 SEM RANQUEADO + TESTE DE SORTE */
(()=>{
  'use strict';
  if(window.LutadorLuckV162?.version)return;
  const VERSION='16.2.0';
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');
  const gs=()=>{try{return state}catch(_){return null}};
  const saveGame=()=>{try{persist()}catch(_){try{saveState(state)}catch(__){}}};
  const symbols=['🍒','🔔','⭐','🪙','💠','🟪','💎','7'];

  function cleanRankData(){
    try{
      const c=window.LutadorComplete?.meta;
      if(c){c.rank={rp:0,wins:0,losses:0,streak:0,best:0};c.rankedMatches=0;window.LutadorComplete?.save?.()}
    }catch(_){}
    try{
      const o=window.LutadorOnlinePro?.data;
      if(o){o.rp=0;o.best=0;o.wins=0;o.losses=0;o.streak=0;o.searches=0;o.disconnects=0;o.history=[];o.claimed=[];o.lastOpponent=null;window.LutadorOnlinePro?.save?.()}
    }catch(_){}
    try{
      const raw=JSON.parse(localStorage.getItem('lutador-complete-15-v1')||'null');
      if(raw){raw.rank={rp:0,wins:0,losses:0,streak:0,best:0};raw.rankedMatches=0;localStorage.setItem('lutador-complete-15-v1',JSON.stringify(raw))}
    }catch(_){}
    try{
      const raw=JSON.parse(localStorage.getItem('sortep-v16-online-pro')||'null');
      if(raw){const keep={tourWins:Number(raw.tourWins)||0,tourMatches:Number(raw.tourMatches)||0};localStorage.setItem('sortep-v16-online-pro',JSON.stringify(keep))}
    }catch(_){}
  }

  function cleanRankUI(){
    ['mode-ranked','mode-online-ranked','btn-ranking','v16-ranked-result','v16-history-dialog','v16-rules-dialog'].forEach(id=>document.getElementById(id)?.remove());
    document.querySelectorAll('[data-v84="ranking"],[data-v83="ranking"],[data-v82-go="ranking"],[data-v8-go="ranking"],.mega-rank-panel,.v11-ranked-season,.mega-ranked-mode,.v16-ranked-card').forEach(e=>e.remove());
    document.querySelectorAll('.v84-menu-grid small,.v83-action-grid small,.v82-card small,.v8-quick-grid small').forEach(e=>{const old=e.textContent,next=old.replace(/Ranked/gi,'partidas').replace(/Ranqueado/gi,'partidas');if(next!==old)e.textContent=next});
    document.querySelectorAll('.v11-result span').forEach(e=>{if(/^RANK\b/i.test((e.firstChild?.textContent||e.textContent).trim()))e.remove()});
    document.querySelectorAll('.v11-profile-banner small,.exp-profile-hero span,.v8-hero-badge span').forEach(e=>{
      if(/\b(FERRO|BRONZE|PRATA|OURO|PLATINA|DIAMANTE|MESTRE|PRIMORDIAL)\b|\bRP\b/i.test(e.textContent)){
        e.textContent=e.textContent.replace(/\s*[·|]\s*[⬟◆◇✦⬢💎♜♛✹]?\s*(FERRO|BRONZE|PRATA|OURO|PLATINA|DIAMANTE|MESTRE|PRIMORDIAL)(\s*·\s*\d+\s*RP)?/gi,'').replace(/\b\d+\s*RP\b/gi,'').trim();
      }
    });
  }

  function renderLuck(){
    const s=gs();if(!s)return;
    try{screen='shop';drawCanvas()}catch(_){}
    const stats=s.luckTestStats||{spins:0,wins:0,jackpots:0};
    app.innerHTML=`<div class="card mk-card mk-arena luck-casino">
      <header class="luck-head">
        <div><small>SORTEP NIAK · LOJA</small><h2>TESTE DE <span>SORTE</span></h2><p>Caça-níquel de alto risco. Cada tentativa custa <b>2 PSY</b>.</p></div>
        <div class="luck-wallet"><span>💰 <b>${fmt(s.coins)}</b> GOLD</span><span>💠 <b>${fmt(s.psy)}</b> PSY</span><span>🟪 <b>${fmt(s.vandais)}</b> VANDAIS</span></div>
      </header>
      <section class="luck-machine">
        <div class="luck-toplight"><i></i><i></i><i></i><strong>NIAK JACKPOT</strong><i></i><i></i><i></i></div>
        <div class="luck-reels" id="luck-reels">
          ${[0,1,2].map(i=>`<div class="luck-reel"><div class="luck-glass"></div><span class="luck-reel-symbol" data-reel="${i}">7</span></div>`).join('')}
        </div>
        <div class="luck-payline"></div>
        <div class="luck-status" id="luck-status"><b>PRONTO PARA JOGAR</b><span>90% das tentativas não entregam prêmio. Quando a rodada entra nos 10% premiados, as chances abaixo são testadas.</span></div>
        <button id="luck-spin" class="luck-spin" ${Number(s.psy||0)<2?'disabled':''}><span>🎰 JOGAR</span><small>2 PSY POR TENTATIVA</small></button>
      </section>
      <section class="luck-chances">
        <article class="jack"><i>👑</i><div><b>MEGA JACKPOT</b><span>50.000 Gold + 20.000 Vandais + 170 PSY</span></div><strong>10%</strong><small>dos giros premiados</small></article>
        <article><i>🪙</i><div><b>GOLD</b><span>100 a 300 Gold</span></div><strong>80%</strong><small>dos giros premiados</small></article>
        <article><i>💠</i><div><b>BÔNUS</b><span>20 Vandais ou 2 PSY</span></div><strong>50%</strong><small>dos giros premiados</small></article>
        <article class="empty"><i>☠</i><div><b>SEM PRÊMIO</b><span>A casa venceu esta tentativa</span></div><strong>90%</strong><small>chance total</small></article>
      </section>
      <footer class="luck-foot"><div><span>TENTATIVAS</span><b>${fmt(stats.spins)}</b></div><div><span>VITÓRIAS</span><b>${fmt(stats.wins)}</b></div><div><span>JACKPOTS</span><b>${fmt(stats.jackpots)}</b></div><button id="luck-back" class="btn">← VOLTAR À LOJA</button></footer>
    </div>`;
    document.getElementById('luck-back').onclick=()=>window.renderShop?.();
    const btn=document.getElementById('luck-spin');if(btn&&!btn.disabled)btn.onclick=spinLuck;
  }

  function chooseOutcome(){
    // Probabilidades solicitadas são conflitantes se tratadas como quatro resultados exclusivos.
    // Modelo funcional: 90% sem prêmio; nos 10% premiados, Jackpot/Gold/Bônus são testes independentes.
    if(Math.random()<0.90)return{kind:'none',gold:0,vandais:0,psy:0,symbols:['🍒','🔔','⭐'],text:'SEM PRÊMIO DESTA VEZ'};
    let gold=0,vandais=0,psy=0,jack=false,parts=[];
    if(Math.random()<0.10){gold+=50000;vandais+=20000;psy+=170;jack=true;parts.push('👑 MEGA JACKPOT')}
    if(Math.random()<0.80){const g=100+Math.floor(Math.random()*201);gold+=g;parts.push(`🪙 ${fmt(g)} GOLD`)}
    if(Math.random()<0.50){if(Math.random()<0.5){vandais+=20;parts.push('🟪 20 VANDAIS')}else{psy+=2;parts.push('💠 2 PSY')}}
    if(!gold&&!vandais&&!psy){gold=100;parts.push('🪙 100 GOLD')}
    const symbols=jack?['💎','💎','💎']:vandais>0?['🟪','🟪','⭐']:psy>0?['💠','💠','⭐']:['🪙','🪙','⭐'];
    return{kind:jack?'jackpot':'win',gold,vandais,psy,symbols,text:parts.join(' · ')};
  }

  function spinLuck(){
    const s=gs();const btn=document.getElementById('luck-spin');const status=document.getElementById('luck-status');const reels=[...document.querySelectorAll('.luck-reel-symbol')];
    if(!s||!btn||reels.length!==3)return;
    if(Number(s.psy||0)<2){status.innerHTML='<b>PSY INSUFICIENTE</b><span>Você precisa de 2 PSY para tentar.</span>';btn.disabled=true;return}
    s.psy=Math.max(0,Number(s.psy||0)-2);s.luckTestStats=s.luckTestStats||{spins:0,wins:0,jackpots:0};s.luckTestStats.spins++;saveGame();
    btn.disabled=true;btn.classList.add('spinning');status.innerHTML='<b>GIRANDO…</b><span>A sorte está decidindo seu resultado.</span>';
    try{SFX?.play?.('menu_confirm')}catch(_){}
    const outcome=chooseOutcome();
    const timers=[];
    reels.forEach((r,i)=>{r.parentElement.classList.add('active');let ticks=0;const t=setInterval(()=>{r.textContent=symbols[(Math.floor(Math.random()*symbols.length)+ticks+i)%symbols.length];ticks++},65+i*12);timers.push(t);setTimeout(()=>{clearInterval(t);r.textContent=outcome.symbols[i];r.parentElement.classList.remove('active');r.parentElement.classList.add('stopped')},1250+i*320)});
    setTimeout(()=>{
      s.coins=Math.max(0,Number(s.coins||0)+outcome.gold);s.vandais=Math.max(0,Number(s.vandais||0)+outcome.vandais);s.psy=Math.max(0,Number(s.psy||0)+outcome.psy);
      if(outcome.kind!=='none')s.luckTestStats.wins++;if(outcome.kind==='jackpot')s.luckTestStats.jackpots++;
      s.lastLuckReward={...outcome,at:Date.now()};saveGame();
      status.className='luck-status '+outcome.kind;
      status.innerHTML=outcome.kind==='none'?'<b>☠ NÃO FOI DESTA VEZ</b><span>Nenhuma recompensa. Tente novamente se tiver PSY.</span>':`<b>${outcome.kind==='jackpot'?'👑 JACKPOT SUPREMO!':'✨ VOCÊ GANHOU!'}</b><span>${outcome.text}</span>`;
      btn.classList.remove('spinning');btn.disabled=Number(s.psy||0)<2;btn.innerHTML='<span>🎰 JOGAR NOVAMENTE</span><small>2 PSY POR TENTATIVA</small>';
      const wallet=document.querySelector('.luck-wallet');if(wallet)wallet.innerHTML=`<span>💰 <b>${fmt(s.coins)}</b> GOLD</span><span>💠 <b>${fmt(s.psy)}</b> PSY</span><span>🟪 <b>${fmt(s.vandais)}</b> VANDAIS</span>`;
      const foot=document.querySelector('.luck-foot');if(foot){const b=foot.querySelectorAll('div b');if(b[0])b[0].textContent=fmt(s.luckTestStats.spins);if(b[1])b[1].textContent=fmt(s.luckTestStats.wins);if(b[2])b[2].textContent=fmt(s.luckTestStats.jackpots)}
      try{SFX?.play?.(outcome.kind==='none'?'menu_back':'menu_confirm')}catch(_){}
    },2150);
  }

  const oldShop=window.renderShop;
  if(typeof oldShop==='function')window.renderShop=function(){const r=oldShop.apply(this,arguments);setTimeout(()=>{const b=document.getElementById('shop-roulette');if(b){b.innerHTML=b.classList.contains('v85-shop-card')?'<i>🎰</i><b>TESTE DE SORTE</b><small>Caça-níquel por 2 PSY com recompensas raras.</small><em>JOGAR →</em>':'🎰 TESTE DE SORTE';b.onclick=renderLuck}},0);return r};
  window.renderShopRoulette=renderLuck;
  window.spinDailyRoulette=spinLuck;
  window.renderRanking=()=>window.renderMenu?.();

  cleanRankData();
  const observer=new MutationObserver(()=>cleanRankUI());observer.observe(document.body,{childList:true,subtree:true});
  cleanRankUI();setTimeout(cleanRankUI,80);
  try{if(gs()){delete gs().rouletteLastDay;saveGame()}}catch(_){}
  window.LutadorLuckV162=Object.freeze({version:VERSION,render:renderLuck});
})();
