/* Duelo do Núcleo: variante 1v1 P2P do combate original. O host decide a pontuação. */
(()=>{
  'use strict';
  if(window.LutadorNucleoP2P)return;
  const POSITIONS=[.5,.27,.73,.4,.62], TARGET=100, RADIUS=135;
  const online=()=>window.LutadorOnlineV16;
  const active=()=>window.__lan?.matchType==='nucleo';

  function addCard(){
    const grid=document.querySelector('.mk-modes');
    if(!grid||document.getElementById('mode-nucleo-p2p'))return;
    const button=document.createElement('button');
    button.id='mode-nucleo-p2p';
    button.className='mode-card mk-mode nucleo-p2p-card';
    button.innerHTML='<div class="mode-icon">◉</div><span class="mode-badge">2 JOGADORES · P2P</span><h3>DUELO DO <span class="mk-gold">NÚCLEO</span></h3><p>Controle a zona móvel para vencer por pontos — ou derrube o rival. Melhor de três.</p>';
    button.onclick=()=>{try{SFX.play('menu_confirm')}catch(_){}online()?.openNucleo?.()};
    grid.appendChild(button);
  }
  const oldModes=window.renderModes;
  if(typeof oldModes==='function')window.renderModes=function(...args){const result=oldModes.apply(this,args);addCard();return result};

  function init(f){
    if(!f||f.mode!=='lan'||!active())return;
    f.nucleo={scores:[0,0],position:0,x:W*POSITIONS[0],radius:RADIUS,changeIn:12,round:1,contested:false,owner:-1,lastTick:performance.now()};
  }
  const oldStart=window.startFight;
  if(typeof oldStart==='function')window.startFight=function(...args){const result=oldStart.apply(this,args);if(args[1]==='lan'&&typeof fight!=='undefined')init(fight);return result};

  function step(now){
    if(!active()||window.__lan?.role!=='host'||typeof fight==='undefined')return;
    const f=fight,n=f?.nucleo;
    if(!n||f.mode!=='lan')return;
    const dt=Math.max(0,Math.min(.05,(now-n.lastTick)/1000));n.lastTick=now;
    if(f.paused||f.over||f.matchOver)return;
    const round=(bestOfThree?.p1Wins||0)+(bestOfThree?.p2Wins||0)+1;
    if(n.round!==round){n.round=round;n.scores=[0,0];n.position=0;n.x=W*POSITIONS[0];n.changeIn=12;n.owner=-1;n.contested=false}
    n.changeIn-=dt;
    if(n.changeIn<=0){n.position=(n.position+1)%POSITIONS.length;n.x=W*POSITIONS[n.position];n.changeIn=12;try{SFX.play('menu_confirm')}catch(_){}}
    const inside=[f.p1,f.p2].map(p=>p&&p.state!=='ko'&&Math.abs(p.x-n.x)<n.radius&&p.onGround);
    n.contested=inside[0]&&inside[1];n.owner=n.contested?-1:inside[0]?0:inside[1]?1:-1;
    if(n.owner>=0){n.scores[n.owner]=Math.min(TARGET,n.scores[n.owner]+dt*9);if(n.scores[n.owner]>=TARGET){const winner=n.owner===0?f.p1:f.p2;endRound(f,winner,n.owner===0?f.p2:f.p1);f.announce='NÚCLEO DOMINADO!'}}
  }
  const oldLoop=window.loop;
  if(typeof oldLoop==='function')window.loop=function(now){const result=oldLoop(now);step(now);return result};

  function drawMarker(f){
    const n=f?.nucleo;if(!n)return;
    const c=canvas.getContext('2d'),y=GROUND_Y-8,pulse=1+Math.sin(performance.now()/180)*.07;
    c.save();
    c.globalAlpha=.21;c.fillStyle=n.contested?'#fff1a8':n.owner===0?'#73dfff':n.owner===1?'#ff97a4':'#b78dff';
    c.beginPath();c.ellipse(n.x,y,n.radius*pulse,25,0,0,Math.PI*2);c.fill();
    c.globalAlpha=.95;c.strokeStyle=n.contested?'#fff1a8':'#a985ff';c.lineWidth=5;c.shadowColor=c.strokeStyle;c.shadowBlur=25;
    c.beginPath();c.ellipse(n.x,y,n.radius*pulse,25,0,0,Math.PI*2);c.stroke();
    c.shadowBlur=0;c.textAlign='center';c.font='900 18px Oxanium,system-ui';c.fillStyle='#fff';
    c.fillText(n.contested?'DISPUTADO':n.owner<0?'OCUPE O NÚCLEO':n.owner===0?'P1 CONTROLA':'P2 CONTROLA',n.x,GROUND_Y-72);
    const boxW=430,boxX=(W-boxW)/2;c.fillStyle='#081425dc';c.fillRect(boxX,132,boxW,78);c.strokeStyle='#9c8bff';c.lineWidth=2;c.strokeRect(boxX,132,boxW,78);
    c.font='900 15px Oxanium,system-ui';c.fillStyle='#d9ccff';c.fillText('DUELO DO NÚCLEO · 100 PONTOS OU NOCAUTE',W/2,154);
    c.font='900 21px Oxanium,system-ui';c.fillStyle='#75e1ff';c.fillText('P1 '+Math.floor(n.scores[0]),W/2-96,183);
    c.fillStyle='#fff';c.fillText('×',W/2,183);
    c.fillStyle='#ff9eab';c.fillText(Math.floor(n.scores[1])+' P2',W/2+96,183);
    c.font='700 11px Oxanium,system-ui';c.fillStyle='#d5c9ff';c.fillText('MUDANÇA EM '+Math.ceil(n.changeIn)+'s',W/2,201);
    c.restore();
  }
  const oldDraw=window.draw;
  if(typeof oldDraw==='function')window.draw=function(f){const result=oldDraw.apply(this,arguments);drawMarker(f);return result};

  window.LutadorNucleoP2P=Object.freeze({version:'42.0.0',open:()=>online()?.openNucleo?.()});
})();
