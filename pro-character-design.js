/* LUTADOR — portrait, motion, attack and guard presentation layer. */
(()=>{
  // All champions have an AI portrait. The five wide files are deliberate three-character atlases:
  // one source image, three independently cropped fighters, keeping loading practical for the browser.
  const atlasSources=Object.freeze({
    ztaaa:{src:'ai-assets/characters/sets/set-01-cosmic-tech.png',slot:0},knunka:{src:'ai-assets/characters/sets/set-01-cosmic-tech.png',slot:1},nine85:{src:'ai-assets/characters/sets/set-01-cosmic-tech.png',slot:2},
    uiye:{src:'ai-assets/characters/sets/set-02-elemental-glitch.png',slot:0},atizz:{src:'ai-assets/characters/sets/set-02-elemental-glitch.png',slot:1},ouip:{src:'ai-assets/characters/sets/set-02-elemental-glitch.png',slot:2},
    jetde:{src:'ai-assets/characters/sets/set-03-sky-lunar.png',slot:0},xillen:{src:'ai-assets/characters/sets/set-03-sky-lunar.png',slot:1},lkugh:{src:'ai-assets/characters/sets/set-03-sky-lunar.png',slot:2},
    verry:{src:'ai-assets/characters/sets/set-04-dark-bruisers.png',slot:0},hock:{src:'ai-assets/characters/sets/set-04-dark-bruisers.png',slot:1},vlad:{src:'ai-assets/characters/sets/set-04-dark-bruisers.png',slot:2},
    klopp:{src:'ai-assets/characters/sets/set-05-trickster-storm.png',slot:0},frogh:{src:'ai-assets/characters/sets/set-05-trickster-storm.png',slot:1},jimmy:{src:'ai-assets/characters/sets/set-05-trickster-storm.png',slot:2}
  });
  const generatedIds=new Set(['ztaaa','knunka','nine85','uiye','rtess','atizz','grizz','ouip','jetde','xillen','thuvaa','ytiri','lkugh','grogh','dart','trefoh','yoi','flame','rojo','perry','verry','hock','vlad','klo','klopp','frogh','jimmy']);
  const portraitImages={};
  const portraitSourceCache={};
  const fallbackImages={};
  const roleMarks={
    ztaaa:'ENTIDADE',knunka:'RAIO',nine85:'CÓDIGO',uiye:'PEDRA',atizz:'GLITCH',ouip:'ÁCIDO',jetde:'BOLHA',lkugh:'LUNAR',xillen:'ALIEN',hock:'MARTELO',vlad:'VAMPIRO',verry:'LAMA',klopp:'MÍMICO',frogh:'MUTA',jimmy:'TROVÃO'
  };
  const isGenerated=id=>generatedIds.has(id);
  const portraitMeta=id=>atlasSources[id]||null;
  const portraitPath=id=>portraitMeta(id)?.src||`ai-assets/characters/${id}.png`;
  const isAtlas=id=>portraitMeta(id)?.slot!==undefined;
  const charById=id=>typeof CHARACTERS!=='undefined'?CHARACTERS.find(c=>c.id===id):null;
  function prefetch(){
    generatedIds.forEach(id=>{
      const src=portraitPath(id);
      let img=portraitSourceCache[src];
      if(!img){img=new Image();img.decoding='async';img.loading='eager';img.src=src;portraitSourceCache[src]=img}
      portraitImages[id]=img;
    });
  }
  prefetch();
  function themeFor(id,color){
    const n=[...id].reduce((sum,c)=>sum+c.charCodeAt(0),0);
    return {n,color:color||'#6ee7ff',accent:['#e9fbff','#ffe29a','#e5bcff','#baffc9'][n%4],shape:n%5};
  }
  function fallbackCanvas(id,color){
    if(fallbackImages[id])return fallbackImages[id];
    const canvas=document.createElement('canvas');canvas.width=420;canvas.height=520;
    const ctx=canvas.getContext('2d'),t=themeFor(id,color),cx=210;
    ctx.clearRect(0,0,420,520);
    const halo=ctx.createRadialGradient(cx,210,15,cx,210,185);halo.addColorStop(0,t.color+'88');halo.addColorStop(.55,t.color+'2b');halo.addColorStop(1,'transparent');ctx.fillStyle=halo;ctx.fillRect(0,0,420,450);
    ctx.save();ctx.translate(cx,420);
    ctx.shadowColor=t.color;ctx.shadowBlur=24;ctx.fillStyle=t.color+'48';ctx.beginPath();ctx.ellipse(0,45,105,18,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    const dark='#101428',mid=t.color,accent=t.accent;
    ctx.fillStyle=dark;ctx.beginPath();ctx.roundRect(-96,-50,48,100,19);ctx.roundRect(48,-50,48,100,19);ctx.fill();
    ctx.fillStyle=mid;ctx.beginPath();ctx.roundRect(-88,-45,34,90,14);ctx.roundRect(54,-45,34,90,14);ctx.fill();
    ctx.fillStyle='#0d1124';ctx.beginPath();ctx.moveTo(-105,-180);ctx.quadraticCurveTo(0,-238,105,-180);ctx.lineTo(78,-45);ctx.lineTo(-78,-45);ctx.closePath();ctx.fill();
    const torso=ctx.createLinearGradient(0,-210,0,-45);torso.addColorStop(0,accent);torso.addColorStop(.12,mid);torso.addColorStop(1,'#12172a');ctx.fillStyle=torso;ctx.beginPath();ctx.roundRect(-82,-194,164,150,27);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.roundRect(-65,-182,17,115,9);ctx.fill();
    ctx.strokeStyle=mid;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-78,-175);ctx.lineTo(-130,-115);ctx.lineTo(-151+(t.shape*7),-75);ctx.moveTo(78,-175);ctx.lineTo(130,-115);ctx.lineTo(151-(t.shape*7),-75);ctx.stroke();
    ctx.fillStyle=dark;ctx.beginPath();ctx.arc(0,-255,78,0,Math.PI*2);ctx.fill();ctx.fillStyle=mid;ctx.beginPath();ctx.arc(0,-255,70,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#090c18';ctx.beginPath();ctx.roundRect(-59,-273,118,39,19);ctx.fill();ctx.fillStyle=accent;ctx.shadowColor=accent;ctx.shadowBlur=18;ctx.beginPath();ctx.roundRect(-41,-262,30,10,5);ctx.roundRect(11,-262,30,10,5);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle=t.color;ctx.beginPath();
    if(t.shape===0){ctx.moveTo(-73,-297);ctx.lineTo(-28,-360);ctx.lineTo(0,-316);ctx.lineTo(31,-364);ctx.lineTo(73,-297);ctx.closePath()}
    else if(t.shape===1){ctx.moveTo(-88,-286);ctx.lineTo(-56,-349);ctx.lineTo(-14,-306);ctx.lineTo(15,-352);ctx.lineTo(54,-307);ctx.lineTo(87,-286);ctx.closePath()}
    else {ctx.arc(0,-286,86,Math.PI,0);ctx.lineTo(70,-252);ctx.lineTo(-70,-252);ctx.closePath()}ctx.fill();
    ctx.strokeStyle=accent;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,-118,43+(t.shape*8),0,Math.PI*2);ctx.stroke();
    ctx.restore();
    const img=new Image();img.src=canvas.toDataURL('image/png');fallbackImages[id]=img;return img;
  }
  function portraitFor(id,color){const img=portraitImages[id];if(img&&img.complete&&img.naturalWidth)return img;return fallbackCanvas(id,color)}
  function artImage(id,label){
    const meta=portraitMeta(id),path=portraitPath(id);
    if(meta)return `<span class="pro-sheet-window"><img alt="Retrato de ${label}" src="${path}" style="--sheet-index:${meta.slot}"></span>`;
    return `<img alt="Retrato de ${label}" src="${path}">`;
  }
  function imageMarkup(id,color){
    const tag=`<span class="pro-portrait-tag"><b>✦</b> ${roleMarks[id]||'CAMPEÃO'}</span>`;
    if(isGenerated(id))return `<div class="pro-character-art generated${isAtlas(id)?' sheet-art':''}" style="--char-color:${color}"><span class="pro-art-floor"></span>${artImage(id,id)}${tag}</div>`;
    return `<div class="pro-fallback-art" style="--char-color:${color}">${tag}</div>`;
  }
  function detailMarkup(id,c){
    if(isGenerated(id))return `<div class="pro-detail-art${isAtlas(id)?' sheet-art':''}">${artImage(id,c.name)}</div>`;
    return '<div class="pro-detail-art"></div>';
  }
  function addFallbackCanvas(host,id,color){if(isGenerated(id)||host.querySelector('canvas'))return;host.appendChild(fallbackCanvas(id,color));}
  function decoratePortraits(){
    document.querySelectorAll('.fighter-card[data-id]').forEach(card=>{
      const id=card.dataset.id,c=charById(id);if(!c)return;
      const slot=card.querySelector('.mk-portrait');if(!slot||slot.dataset.proPortrait)return;slot.dataset.proPortrait='1';slot.insertAdjacentHTML('afterbegin',imageMarkup(id,c.color));
      const fallback=slot.querySelector('.pro-fallback-art');if(fallback)addFallbackCanvas(fallback,id,c.color);
    });
  }
  function decorateShopPortraits(){
    document.querySelectorAll('.shop-card').forEach(card=>{
      const name=card.querySelector('h3')?.textContent?.trim();const c=typeof CHARACTERS!=='undefined'?CHARACTERS.find(x=>x.name===name):null;
      const slot=card.querySelector('.shop-art');if(!c||!slot||slot.dataset.proPortrait)return;
      slot.dataset.proPortrait='1';slot.insertAdjacentHTML('afterbegin',imageMarkup(c.id,c.color));
      const fallback=slot.querySelector('.pro-fallback-art');if(fallback)addFallbackCanvas(fallback,c.id,c.color);
    });
  }
  function decorateDetail(){
    const detail=document.querySelector('.mk-dportrait');if(!detail||detail.dataset.proPortrait)return;
    const current=document.querySelector('.fighter-card:hover')||document.querySelector('.fighter-card[data-id]');
    const id=current?.dataset?.id;const c=charById(id);if(!id||!c)return;
    detail.dataset.proPortrait='1';detail.style.setProperty('--detail-color',c.color);detail.insertAdjacentHTML('afterbegin',detailMarkup(id,c));
    const h=detail.querySelector('.pro-detail-art');if(!isGenerated(id))h.appendChild(fallbackCanvas(id,c.color));
  }
  function decorateAll(){document.body.classList.add('pro-ui');decoratePortraits();decorateShopPortraits();setTimeout(decorateDetail,0)}
  function wrap(name,after){const base=window[name];if(typeof base!=='function'||base.__proWrapped)return;const wrapped=function(...args){const r=base.apply(this,args);after?.(...args);return r};wrapped.__proWrapped=true;window[name]=wrapped}
  wrap('renderMenu',()=>setTimeout(decorateAll,0));wrap('renderModes',()=>setTimeout(decorateAll,0));wrap('renderShop',()=>setTimeout(decorateAll,0));wrap('renderShopChampions',()=>setTimeout(decorateAll,0));wrap('renderSelect',()=>setTimeout(decorateAll,0));
  const nativeDetail=window.renderCharacterDetail;
  if(typeof nativeDetail==='function')window.renderCharacterDetail=function(...args){const r=nativeDetail.apply(this,args);setTimeout(()=>{const id=args[0],c=charById(id),detail=document.querySelector('.mk-dportrait');if(!c||!detail)return;detail.dataset.proPortrait='';detail.querySelectorAll('.pro-detail-art').forEach(n=>n.remove());detail.style.setProperty('--detail-color',c.color);detail.insertAdjacentHTML('afterbegin',detailMarkup(id,c));const h=detail.querySelector('.pro-detail-art');if(!isGenerated(id))h.appendChild(fallbackCanvas(id,c.color));},0);return r};

  // Combat presentation uses a small 2D rig. The portrait is cut into head, torso and legs;
  // the arms are rendered as independent articulated limbs. It deliberately avoids moving a whole PNG.
  const nativeDrawFighter=window.drawFighter;
  const attackState=p=>p.state==='throw'||p.state==='attack';
  function imageArea(id,img){const meta=portraitMeta(id),third=meta?img.naturalWidth/3:img.naturalWidth;return{sx:meta?third*meta.slot:0,sy:0,sw:third,sh:img.naturalHeight}}
  function drawPiece(ctx,img,area,rx,ry,rw,rh,x,y,h,rotation=0,stretch=1){
    const sw=area.sw*rw,sh=area.sh*rh,sx=area.sx+area.sw*rx,sy=area.sy+area.sh*ry,w=h*(sw/sh)*stretch;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(img,sx,sy,sw,sh,-w/2,-h/2,w,h);ctx.restore();
  }
  function limb(ctx,points,color,accent,scale,glow=false){
    const path=()=>{ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1])};
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#050711';ctx.lineWidth=16*scale;path();ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=10*scale;ctx.shadowColor=color;ctx.shadowBlur=glow?15:5;path();ctx.stroke();ctx.strokeStyle=accent;ctx.globalAlpha=.76;ctx.lineWidth=2.5*scale;path();ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;
    points.slice(1).forEach((point,index)=>{ctx.fillStyle=index===points.length-2?accent:color;ctx.beginPath();ctx.arc(point[0],point[1],(index===points.length-1?7:4.5)*scale,0,Math.PI*2);ctx.fill()});ctx.restore();
  }
  function drawGuard(ctx,p,floor,scale){ctx.save();ctx.translate(p.x,floor-73*scale);ctx.scale(p.facing,1);ctx.globalAlpha=.73;ctx.strokeStyle='#d7fbff';ctx.shadowColor='#67e8f9';ctx.shadowBlur=20;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(6,-64*scale);ctx.quadraticCurveTo(70*scale,-39*scale,71*scale,17*scale);ctx.quadraticCurveTo(23*scale,45*scale,-4,24*scale);ctx.closePath();ctx.stroke();ctx.globalAlpha=.15;ctx.fillStyle='#67e8f9';ctx.fill();ctx.restore()}
  function drawActionFx(ctx,p,floor,scale,time){const attack=attackState(p),special=p.state==='special';if(!attack&&!special)return;ctx.save();ctx.translate(p.x,floor-72*scale);ctx.scale(p.facing,1);ctx.globalCompositeOperation='lighter';ctx.strokeStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=special?27:17;ctx.globalAlpha=special?.78:.55;ctx.lineWidth=special?7:4;for(let i=0;i<(special?3:2);i++){ctx.beginPath();ctx.arc(23*scale,-7*scale,(36+i*14+Math.sin(time*18+i)*5)*scale,-1.25,1.04);ctx.stroke()}ctx.restore()}
  function rigPose(p,time,scale){
    const guard=p.defend||p.state==='defend',attack=attackState(p),special=p.state==='special',air=!p.onGround||p.state==='air',walking=p.state==='walk'||Math.abs(p.vx||0)>8;
    const cycle=time*(walking?10:3.25)+(p.x||0)*.017,step=Math.sin(cycle),stateT=p.stateT||0;
    const strike=Math.sin(Math.min(1,stateT/.28)*Math.PI)||.26;
    const crouch=guard?8:0,bodyLean=special?-.14:attack?-.18*strike:guard?.13:walking?step*.035:Math.sin(cycle)*.018;
    const legA=air?-.42:walking?step*.32:guard?.17:step*.03,legB=air?.35:walking?-step*.32:guard?-.18:-step*.03;
    let front=[[18,-96+crouch],[41,-72+crouch+step*2],[48,-48+crouch-step*2]],back=[[-18,-96+crouch],[-39,-70+crouch-step*2],[-47,-47+crouch+step*2]];
    if(guard){front=[[18,-97+crouch],[35,-104+crouch],[5,-111+crouch]];back=[[-18,-97+crouch],[-31,-87+crouch],[13,-91+crouch]]}
    else if(attack){front=[[18,-96],[40+18*strike,-97-10*strike],[60+32*strike,-79-13*strike]];back=[[-18,-96],[-40,-72],[-50,-48]]}
    else if(special){front=[[18,-96],[38,-136],[58,-154+Math.sin(time*16)*5]];back=[[-18,-96],[-36,-131],[-55,-148-Math.sin(time*16)*5]]}
    else if(air){front=[[18,-94],[45,-77],[67,-86]];back=[[-18,-94],[-44,-70],[-62,-57]]}
    return{guard,attack,special,air,walking,step,crouch,bodyLean,legA,legB,front,back,headTilt:attack?-.07*strike:guard?.075:Math.sin(cycle*.8)*.018};
  }
  function drawRig(ctx,p,img,c,time,scale){
    const pose=rigPose(p,time,scale),area=imageArea(p.id,img),accent='#f7fbff';
    if(p.state==='ko'){
      ctx.save();ctx.globalAlpha=.48;ctx.translate(-9,-20);ctx.rotate(-.98);drawPiece(ctx,img,area,.10,.04,.80,.88,0,0,96*scale,0,1.1);ctx.restore();return pose;
    }
    const lift=pose.crouch,legH=62*scale,bodyH=63*scale,headH=49*scale;
    // Back limb first, then two independently rotating legs, torso, head, and foreground limb.
    limb(ctx,pose.back,c.color,accent,scale,pose.special);
    drawPiece(ctx,img,area,.12,.59,.38,.41,-18*scale,-(legH/2)+pose.crouch,legH,pose.legA,.98);
    drawPiece(ctx,img,area,.50,.59,.38,.41,18*scale,-(legH/2)+pose.crouch,legH,pose.legB,.98);
    drawPiece(ctx,img,area,.20,.28,.60,.37,0,-81*scale+lift,bodyH,pose.bodyLean,1.18);
    drawPiece(ctx,img,area,.18,.035,.64,.285,2*scale,-133*scale+lift,headH,pose.headTilt,1.06);
    limb(ctx,pose.front,c.color,accent,scale,pose.attack||pose.special);
    if(pose.special){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=c.color;ctx.shadowColor=c.color;ctx.shadowBlur=22;ctx.globalAlpha=.35+.24*Math.sin(time*18);const hand=pose.front[2];ctx.beginPath();ctx.arc(hand[0],hand[1],17*scale+Math.sin(time*14)*3,0,Math.PI*2);ctx.fill();ctx.restore()}
    return pose;
  }
  window.drawFighter=function(ctx,p){
    if(!p||!p.rect)return nativeDrawFighter.apply(this,arguments);
    const c=charById(p.id);if(!c)return nativeDrawFighter.apply(this,arguments);
    const img=portraitFor(p.id,c.color);if(!img||!img.complete)return nativeDrawFighter.apply(this,arguments);
    const now=performance.now()/1000,floor=typeof groundLevel==='function'?groundLevel(p):496-p.y;
    if(p.proKnockdownT>0&&p.onGround&&p.state!=='ko'){
      const area=imageArea(p.id,img),scale=p.id==='ztaaa'?1.14:1;
      ctx.save();ctx.translate(p.x,floor-12);ctx.scale(p.facing||1,1);ctx.rotate(-Math.PI/2);ctx.translate(0,43*scale);ctx.globalAlpha=.94;drawPiece(ctx,img,area,.10,.04,.80,.88,0,0,96*scale,0,1.1);ctx.restore();
      ctx.save();ctx.textAlign='center';ctx.font='800 12px system-ui';ctx.fillStyle='#ffb4b4';ctx.fillText('NO CHÃO · VULNERÁVEL',p.x,floor-38);ctx.restore();return;
    }
    const guard=p.defend||p.state==='defend',special=p.state==='special',air=!p.onGround||p.state==='air';
    const baseScale=(p.id==='ztaaa'?1.14:1)*(air?1.02:1)*(guard?.93:1)*(special?1.06:1),idleBob=air?0:Math.sin(now*3.2+p.x*.018)*2.2;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.22+.08*Math.sin(now*5);ctx.fillStyle=c.color;ctx.shadowColor=c.color;ctx.shadowBlur=26;ctx.beginPath();ctx.ellipse(p.x,floor-63*baseScale,39*baseScale,69*baseScale,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.globalAlpha=.34;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,floor+2,32*baseScale,7*baseScale,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.globalAlpha=p.state==='ko'?.48:1;ctx.translate(p.x,floor+idleBob);ctx.scale(p.facing,1);ctx.shadowColor='rgba(0,0,0,.82)';ctx.shadowBlur=11;const pose=drawRig(ctx,p,img,c,now,baseScale);ctx.shadowBlur=0;ctx.restore();
    if(guard)drawGuard(ctx,p,floor,baseScale);drawActionFx(ctx,p,floor,baseScale,now);
    if(special){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45+.2*Math.sin(now*18);ctx.strokeStyle=c.color;ctx.shadowColor=c.color;ctx.shadowBlur=22;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,floor-75*baseScale,61*baseScale,0,Math.PI*2);ctx.stroke();ctx.restore()}
  };
  setTimeout(decorateAll,80);
})();
