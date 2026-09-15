/* SORTEP NIAK — R.A.V.A.M STUDIOS / PRIYA ARANYA
 * Modo premium adquirido com Vandais. Priya é a Lenda inicial.
 */
(()=>{
  'use strict';
  if(window.RavamStudios?.version)return;
  const VERSION='1.1.0';
  const ACCESS_COST=2500;
  const PRIYA=Object.freeze({
    id:'priya',name:'Priya Aranya',color:'#d85b42',hp:1940,dmg:32,speed:82,price:0,
    weapon:'ravamRifle',special:'tripleBombRavam',secret:true,ravamOnly:true
  });
  const ABILITY=Object.freeze({flag:'RAVAM',role:'Atiradora Tática',tag:'PRECISÃO',desc:'J dispara tiros rápidos com o rifle. O executa o Chute Tático. L ativa o super TRÍADE DEMOLIDORA e lança 3 bombas guiadas exatamente sobre a posição do rival.'});
  const PORTRAIT='ai-assets/characters/priya.png';
  const PREVIEW_SHEET='ai-assets/ravam/priya-animation-sheet-v2.png';
  const POSE_PATHS=Array.from({length:6},(_,i)=>`ai-assets/ravam/poses/priya-${i}.png`);
  const poseImages=POSE_PATHS.map(src=>{const im=new Image();im.decoding='async';im.src=src;return im;});
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('pt-BR');
  const save=()=>{try{typeof persist==='function'?persist():saveState?.(state)}catch(_){}};
  const hasAccess=()=>!!(typeof state!=='undefined'&&state?.ravamModeUnlocked);
  const ensureState=()=>{
    if(typeof state==='undefined')return;
    if(!Array.isArray(state.ravamRoster))state.ravamRoster=[];
    if(state.ravamModeUnlocked&&!state.ravamRoster.includes('priya'))state.ravamRoster.unshift('priya');
  };
  ensureState();

  function toast(msg,tone='normal'){
    try{if(window.LutadorV6?.toast)return window.LutadorV6.toast(msg,tone,1900)}catch(_){}
    try{typeof mixToast==='function'&&mixToast(msg)}catch(_){}
  }
  function temporarilyRegister(fn){
    let added=false;
    try{
      if(typeof CHARACTERS!=='undefined'&&!CHARACTERS.some(c=>c.id==='priya')){CHARACTERS.push(PRIYA);added=true;}
      if(typeof ABILITIES!=='undefined'&&!ABILITIES.priya)ABILITIES.priya=ABILITY;
      if(typeof MOVES!=='undefined'&&!MOVES.priya)MOVES.priya=[['J','Tiro de precisão com rifle'],['O','Chute Tático'],['L','TRÍADE DEMOLIDORA · 3 bombas guiadas no rival']];
      return fn();
    }finally{
      if(added&&typeof CHARACTERS!=='undefined'){
        const i=CHARACTERS.findIndex(c=>c.id==='priya');if(i>=0)CHARACTERS.splice(i,1);
      }
    }
  }

  const baseStartFight=window.startFight;
  if(typeof baseStartFight==='function')window.startFight=function(playerId,mode,player2Id,stageId,chaos){
    if(playerId==='priya'||player2Id==='priya'){
      return temporarilyRegister(()=>{
        const r=baseStartFight.call(this,playerId,mode,player2Id,stageId,chaos);
        try{
          if(typeof fight!=='undefined'&&fight){
            fight.ravamStudios=true;fight.priyaBullets=[];fight.priyaBombs=[];fight.ravamVersion=VERSION;
          }
        }catch(_){}
        return r;
      });
    }
    return baseStartFight.apply(this,arguments);
  };

  function renderLocked(){
    const can=(Number(state.vandais)||0)>=ACCESS_COST;
    app.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen">
      <section class="ravam-pro-hero locked">
        <div class="ravam-copy"><small>UNIVERSO PREMIUM</small><h2>R.A.V.A.M <span>STUDIOS</span></h2><p>Um elenco separado dos campeões tradicionais, com identidade e progressão próprias. O acesso é permanente depois da compra.</p><div class="ravam-price">🟪 ${fmt(ACCESS_COST)} VANDAIS</div><div class="ravam-wallet-line">SALDO ATUAL · 🟪 ${fmt(state.vandais||0)} VANDAIS</div></div>
        <img src="${PORTRAIT}" alt="Priya Aranya">
      </section>
      <section class="ravam-unlock-card"><div><small>LENDA INICIAL INCLUÍDA</small><h3>PRIYA ARANYA</h3><p>Atiradora tática da R.A.V.A.M. J dispara com o rifle, O usa o Chute Tático e L lança 3 bombas guiadas sobre o rival com a Ultimate <b>TRÍADE DEMOLIDORA</b>.</p></div><button id="ravam-buy-access" class="btn big" ${can?'':'disabled'}>${can?'🟪 ADQUIRIR MODO R.A.V.A.M':'VANDAIS INSUFICIENTES'}</button></section>
      <button id="ravam-back" class="btn">← VOLTAR AOS MODOS</button>
    </div>`;
    const buy=document.getElementById('ravam-buy-access');
    if(buy&&can)buy.onclick=()=>{
      state.vandais=Math.max(0,(Number(state.vandais)||0)-ACCESS_COST);
      state.ravamModeUnlocked=true;state.ravamRoster=['priya'];state.ravamPurchasedAt=Date.now();save();
      toast('R.A.V.A.M STUDIOS DESBLOQUEADO · PRIYA INCLUÍDA','reward');renderRavamMode();
    };
    document.getElementById('ravam-back').onclick=()=>window.renderModes?.();
  }

  function renderUnlocked(){
    ensureState();
    app.innerHTML=`<div class="card mk-card mk-arena ravam-pro-screen">
      <section class="ravam-pro-hero">
        <div class="ravam-copy"><small>R.A.V.A.M STUDIOS · ACESSO ATIVO</small><h2>ARENA DAS <span>LENDAS</span></h2><p>Priya Aranya é a primeira personagem do universo R.A.V.A.M. Seu rifle domina a distância e a Ultimate cobre a arena com três explosivos.</p><div class="ravam-wallet-line">🟪 ${fmt(state.vandais||0)} VANDAIS · PRIYA DESBLOQUEADA</div></div>
        <img src="${PORTRAIT}" alt="Priya Aranya">
      </section>
      <section class="ravam-character-card">
        <div class="ravam-priya-art"><img src="${PORTRAIT}" alt="Priya Aranya"></div>
        <div class="ravam-priya-info"><small>LENDA INICIAL · R.A.V.A.M</small><h3>PRIYA ARANYA</h3><p>${ABILITY.desc}</p><div class="ravam-stats"><span><b>32</b>DANO</span><span><b>82</b>AGILIDADE</span><span><b>1940</b>VIDA</span></div><div class="ravam-moves"><span><kbd>J</kbd> TIRO DE RIFLE</span><span><kbd>O</kbd> CHUTE TÁTICO</span><span><kbd>L</kbd> 3 BOMBAS · SUPER</span></div></div>
      </section>
      <section class="ravam-actions">
        <button id="ravam-cpu" class="btn big">🤖 PRIYA × CPU PRIYA</button>
        <button id="ravam-pvp" class="btn big">⚔️ DUELO LOCAL ESPELHO</button>
        <button id="ravam-preview" class="btn">🎞️ VER ANIMAÇÕES</button>
      </section>
      <div class="ravam-note"><b>R.A.V.A.M STUDIOS</b><span>Priya é a personagem inicial gratuita deste modo. Novas Lendas poderão ser adicionadas depois sem misturar o elenco principal.</span></div>
      <button id="ravam-back" class="btn">← VOLTAR AOS MODOS</button>
    </div>`;
    document.getElementById('ravam-cpu').onclick=()=>{SFX?.play?.('menu_confirm');window.startFight('priya','ravam','priya');};
    document.getElementById('ravam-pvp').onclick=()=>{SFX?.play?.('menu_confirm');window.startFight('priya','pvp','priya');try{if(typeof fight!=='undefined'&&fight)fight.ravamStudios=true}catch(_){}};
    document.getElementById('ravam-preview').onclick=()=>openAnimationPreview();
    document.getElementById('ravam-back').onclick=()=>window.renderModes?.();
  }

  window.renderRavamMode=function(){
    screen='ravam';drawCanvas();ensureState();
    if(!hasAccess())renderLocked();else renderUnlocked();
  };

  function openAnimationPreview(){
    let d=document.getElementById('ravam-animation-dialog');
    if(!d){d=document.createElement('dialog');d.id='ravam-animation-dialog';d.className='ravam-animation-dialog';document.body.appendChild(d)}
    d.innerHTML=`<header><div><small>PRIYA ARANYA</small><h2>ANIMAÇÕES DE COMBATE</h2></div><button>×</button></header><img src="${PREVIEW_SHEET}" alt="Poses de Priya Aranya"><p>Idle · caminhada · preparação · tiro · guarda · chute procedural. Os recortes agora usam PNGs separados para não cortar arma, pés ou silhueta.</p>`;
    d.querySelector('button').onclick=()=>d.close();d.showModal();
  }

  const baseModes=window.renderModes;
  if(typeof baseModes==='function')window.renderModes=function(){
    const r=baseModes.apply(this,arguments);
    setTimeout(()=>{
      const card=document.getElementById('mode-ravam');if(!card)return;
      const active=hasAccess();card.classList.toggle('ravam-owned',active);
      const badge=card.querySelector('.mode-badge');if(badge)badge.textContent=active?'R.A.V.A.M · ADQUIRIDO':`🟪 ${fmt(ACCESS_COST)} VANDAIS`;
      const h=card.querySelector('h3');if(h)h.innerHTML=active?'R.A.V.A.M <span class="mk-gold">STUDIOS</span>':'R.A.V.A.M <span class="mode-danger">STUDIOS</span>';
      const p=card.querySelector('p');if(p)p.textContent=active?'Priya Aranya disponível. Entre na Arena das Lendas.':'Adquira o modo com Vandais. Priya Aranya vem desbloqueada como a primeira Lenda.';
    },0);
    return r;
  };

  function priyaShoot(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;
    if(!Array.isArray(f.priyaBullets))f.priyaBullets=[];
    const y=(typeof bodyY==='function'?bodyY(p):GROUND_Y-p.y-82)-18;
    f.priyaBullets.push({x:p.x+p.facing*56,y,vx:p.facing*1180,owner:p,life:1.35,dead:false,dmg:p.dmg*1.22});
    p.throwCd=p.human?.34:.48;setState(p,'throw');
    try{spark(p.x+p.facing*58,y,'#ffd49b',13)}catch(_){}
    try{SFX?.play?.('attack_light',.7)}catch(_){}
  }
  function priyaTripleBomb(p){
    const f=typeof fight!=='undefined'?fight:null;if(!f||!p)return;
    if(!Array.isArray(f.priyaBombs))f.priyaBombs=[];
    const target=p===f.p1?f.p2:f.p1;
    const baseX=p.x+p.facing*38,baseY=GROUND_Y-p.y-100;
    // As três bombas seguem uma trajetória paramétrica e recalculam o ponto final
    // a cada frame. Assim o L realmente cai em cima de onde o rival está.
    const offsets=[0,-42,42];
    for(let i=0;i<3;i++){
      f.priyaBombs.push({
        x:baseX,y:baseY,startX:baseX,startY:baseY,owner:p,target,offset:offsets[i],
        elapsed:-i*.11,duration:.72+i*.06,arc:230+28*i,life:2.4,dead:false,exploded:false,
        r:12,dmg:p.dmg*1.82,serial:i
      });
    }
    p.specialCd=5.1;setState(p,'special');
    p.ravamBombCastT=.62;
    try{spark(baseX,baseY,'#ff6b45',25)}catch(_){}
  }

  const baseThrow=window.throwProjectile;
  if(typeof baseThrow==='function')window.throwProjectile=function(p){if(p?.id==='priya'){priyaShoot(p);return;}return baseThrow.apply(this,arguments)};
  const baseSpecial=window.castSpecial;
  if(typeof baseSpecial==='function')window.castSpecial=function(p){if(p?.id==='priya'){priyaTripleBomb(p);return;}return baseSpecial.apply(this,arguments)};

  function damageTarget(victim,amount,src,dir,type){
    try{return typeof damage==='function'?damage(victim,amount,src,dir,type):undefined}catch(_){}
  }
  function updateRavam(f,dt){
    if(!f?.ravamStudios&&!f?.p1?.id?.includes?.('priya')&&!f?.p2?.id?.includes?.('priya'))return;
    if(!Array.isArray(f.priyaBullets))f.priyaBullets=[];
    if(!Array.isArray(f.priyaBombs))f.priyaBombs=[];
    for(const q of [f.p1,f.p2])if(q?.id==='priya'&&q.ravamBombCastT>0)q.ravamBombCastT=Math.max(0,q.ravamBombCastT-dt);
    for(const b of f.priyaBullets){
      if(b.dead)continue;b.x+=b.vx*dt;b.life-=dt;
      const enemy=b.owner===f.p1?f.p2:f.p1;
      if(enemy&&enemy.state!=='ko'&&Math.abs(b.x-enemy.x)<44&&hitboxY(enemy,b.y,14)){
        damageTarget(enemy,b.dmg,b,b.vx>0?1:-1,'rifle');b.dead=true;
        try{spark(b.x,b.y,'#ffd49b',16)}catch(_){}
      }
      if(b.life<=0||b.x<-80||b.x>W+80)b.dead=true;
    }
    f.priyaBullets=f.priyaBullets.filter(b=>!b.dead);
    for(const b of f.priyaBombs){
      if(b.dead)continue;
      b.life-=dt;b.elapsed+=dt;
      if(b.elapsed<0)continue;
      const enemy=b.target&&b.target.state!=='ko'?b.target:(b.owner===f.p1?f.p2:f.p1);
      const liveTargetX=enemy?enemy.x:(b.startX+(b.owner?.facing||1)*360);
      const endX=clamp(liveTargetX+(b.offset||0),28,W-28),endY=GROUND_Y-14;
      const u=clamp(b.elapsed/b.duration,0,1);
      const smooth=u*u*(3-2*u);
      b.x=b.startX+(endX-b.startX)*smooth;
      b.y=b.startY+(endY-b.startY)*u-Math.sin(Math.PI*u)*b.arc;
      b.lockX=endX;
      if(u>=1){
        b.x=endX;b.y=endY;b.dead=true;b.exploded=true;
        const victim=b.owner===f.p1?f.p2:f.p1;
        if(victim&&victim.state!=='ko'){
          const dx=victim.x-b.x,dy=(typeof bodyY==='function'?bodyY(victim):GROUND_Y-80)-b.y;
          if(Math.abs(dx)<138)damageTarget(victim,b.dmg,b,dx>=0?1:-1,'bomb');
        }
        try{spark(b.x,b.y,'#ff5c3c',48)}catch(_){}
        f.megaHitStop=Math.max(f.megaHitStop||0,.065);
      }
      if(b.life<=0)b.dead=true;
    }
    f.priyaBombs=f.priyaBombs.filter(b=>!b.dead);
  }
  const baseUpdate=window.update;
  if(typeof baseUpdate==='function')window.update=function(f,dt){const r=baseUpdate.apply(this,arguments);updateRavam(f,dt);return r};

  function drawRavamFx(ctx,f){
    if(!f)return;
    for(const b of (f.priyaBullets||[])){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffd59b';ctx.lineWidth=3;ctx.shadowBlur=16;ctx.shadowColor='#ff9e62';ctx.beginPath();ctx.moveTo(b.x-b.vx*.018,b.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle='#fff7dd';ctx.beginPath();ctx.arc(b.x,b.y,3.2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(const b of (f.priyaBombs||[])){
      if(b.elapsed>=0&&Number.isFinite(b.lockX)){
        ctx.save();ctx.globalAlpha=.26+.14*Math.sin(performance.now()/120+b.serial);ctx.strokeStyle='#ff745e';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.lockX,GROUND_Y-4,28,8,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(b.lockX-8,GROUND_Y-4);ctx.lineTo(b.lockX+8,GROUND_Y-4);ctx.stroke();ctx.restore();
      }
      if(b.elapsed<0)continue;
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate((performance.now()/110)+(b.x*.01));ctx.fillStyle='#171b22';ctx.strokeStyle='#ff664a';ctx.lineWidth=3;ctx.shadowBlur=13;ctx.shadowColor='#ff3f2f';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ff6b45';ctx.fillRect(-10,-2,20,4);ctx.strokeStyle='#c9d1de';ctx.lineWidth=2;ctx.beginPath();ctx.arc(7,-11,6,0,Math.PI*1.4);ctx.stroke();ctx.restore();
    }
  }
  const baseDraw=window.draw;
  if(typeof baseDraw==='function')window.draw=function(f){const r=baseDraw.apply(this,arguments);try{drawRavamFx(canvas.getContext('2d'),f)}catch(_){}return r};

  function priyaPose(p){
    const move=p?.proMove?.kind;
    if(move==='kick'){
      const t=p.proMove?.time||0;
      if(t<.11)return {frame:5,kick:'windup'};
      if(t<.31)return {frame:2,kick:'impact'};
      return {frame:5,kick:'recover'};
    }
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround))return {frame:5};
    if(p.defend||p.state==='defend'||p.state==='crouch')return {frame:5};
    if(p.state==='special'||p.ravamBombCastT>0)return {frame:(p.stateT||0)<.18?1:2,bomb:true};
    if(p.state==='throw'||p.state==='attack'||p.proMove)return {frame:(p.stateT||0)<.10?3:4,shot:true};
    if(p.state==='hurt'||p.hitFlash>.035)return {frame:0};
    if(Math.abs(p.vx||0)>7){const phase=((p.walkT||performance.now()/1000)*7)%2;const a=phase<1?phase:2-phase;return {frame:phase<1?1:2,blendFrame:phase<1?2:1,blend:a*.22,walk:true};}
    return {frame:0};
  }
  function drawPoseImage(ctx,img,height){
    if(!img?.complete||!img.naturalWidth)return false;
    const width=height*(img.naturalWidth/img.naturalHeight);
    ctx.drawImage(img,-width/2,-height,width,height);
    return true;
  }
  function drawPriyaKickFx(ctx,p,floor,height,phase){
    if(!phase)return;
    const dir=p.facing||1;
    ctx.save();ctx.translate(p.x,floor-height*.38);ctx.scale(dir,1);ctx.globalCompositeOperation='lighter';
    const power=phase==='impact'?1:.5;
    ctx.strokeStyle='rgba(255,190,120,.92)';ctx.shadowColor='#ff6b45';ctx.shadowBlur=18;ctx.lineWidth=5*power;ctx.globalAlpha=.72*power;
    ctx.beginPath();ctx.arc(22,18,height*.44,-.7,.45);ctx.stroke();
    if(phase==='impact'){ctx.fillStyle='#fff2c2';ctx.globalAlpha=.88;ctx.beginPath();ctx.ellipse(height*.47,22,10,5,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawPriya(ctx,p){
    const pose=priyaPose(p),img=poseImages[pose.frame];
    if(!img?.complete||!img.naturalWidth)return false;
    const floor=typeof groundLevel==='function'?groundLevel(p):GROUND_Y-(p.y||0),height=218;
    ctx.save();ctx.globalAlpha=.34;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,floor+4,39,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(p.x,floor);ctx.scale(p.facing||1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(pose.kick==='windup'){ctx.translate(-10,-3);ctx.rotate(-.045);}
    if(pose.kick==='impact'){ctx.translate(13,-7);ctx.rotate(-.075);ctx.scale(1.055,.985);}
    if(pose.kick==='recover'){ctx.translate(-3,-2);}
    if(pose.shot&&pose.frame===4){ctx.translate(-6,0);}
    if(p.state==='ko'||(p.proKnockdownT>0&&p.onGround)){ctx.translate(-14,-10);ctx.rotate(-Math.PI/2);ctx.translate(0,height*.38)}
    if(pose.blendFrame!==undefined&&pose.blend>0){const other=poseImages[pose.blendFrame];ctx.save();ctx.globalAlpha=pose.blend;drawPoseImage(ctx,other,height);ctx.restore();ctx.globalAlpha=1;}
    drawPoseImage(ctx,img,height);
    ctx.restore();
    drawPriyaKickFx(ctx,p,floor,height,pose.kick);
    if(pose.shot&&pose.frame===4){
      ctx.save();ctx.translate(p.x+(p.facing||1)*96,floor-height*.66);ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffd69f';ctx.shadowColor='#ff9a55';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(0,0,5.5,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if(p.hitFlash>.035){ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha=.75;ctx.beginPath();ctx.moveTo(p.x-22,floor-height*.6-12);ctx.lineTo(p.x+22,floor-height*.6+12);ctx.stroke();ctx.restore()}
    return true;
  }
  const baseDrawFighter=window.drawFighter;
  if(typeof baseDrawFighter==='function')window.drawFighter=function(ctx,p){if(p?.id==='priya'&&drawPriya(ctx,p))return;return baseDrawFighter.apply(this,arguments)};

  window.RavamStudios=Object.freeze({version:VERSION,cost:ACCESS_COST,priya:PRIYA,ability:ABILITY,render:()=>window.renderRavamMode?.()});
})();
