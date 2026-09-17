/* LUTADOR — AI artwork with shared articulated movement and cached animation poses. */
(()=>{
  'use strict';
  if(window.ProSpriteAnimator?.version)return;

  const COLS=6,ROWS=3;
  const atlas=Object.freeze({
    ztaaa:['sprites-01-cutout.png',0],knunka:['sprites-01-cutout.png',1],nine85:['sprites-01-cutout.png',2],
    uiye:['sprites-02-cutout.png',0],rtess:['sprites-02-cutout.png',1],atizz:['sprites-02-cutout.png',2],
    grizz:['sprites-03-cutout.png',0],ouip:['sprites-03-cutout.png',1],jetde:['sprites-03-cutout.png',2],
    xillen:['sprites-04-cutout.png',0],thuvaa:['sprites-04-cutout.png',1],ytiri:['sprites-04-cutout.png',2],
    lkugh:['sprites-05-cutout.png',0],grogh:['sprites-05-cutout.png',1],dart:['sprites-05-cutout.png',2],
    trefoh:['sprites-06-cutout.png',0],yoi:['sprites-06-cutout.png',1],flame:['sprites-06-cutout.png',2],
    rojo:['sprites-07-cutout.png',0],perry:['sprites-07-cutout.png',1],verry:['sprites-07-cutout.png',2],
    hock:['sprites-08-cutout.png',0],vlad:['sprites-08-cutout.png',1],klo:['sprites-08-cutout.png',2],
    klopp:['sprites-09-cutout.png',0],frogh:['sprites-09-cutout.png',1],jimmy:['sprites-09-cutout.png',2]
  });
  const imageRoot='ai-assets/sprites-v2/';
  const images=new Map(),failed=new Set();
  const sourceNames=[...new Set(Object.values(atlas).map(value=>value[0]))];
  const heavy=new Set(['ztaaa','uiye','rtess','grogh','verry','hock','frogh']);
  const compact=new Set(['nine85','klo','jetde']);
  let readyCount=0,decorateQueued=false,lastDetailId='rojo';

  function character(id){return typeof CHARACTERS!=='undefined'?CHARACTERS.find(item=>item.id===id):null}
  const loadQueue=[]; let loadBusy=false;
  function pumpLoadQueue(){
    if(loadBusy||!loadQueue.length)return;
    loadBusy=true;
    const {file,image}=loadQueue.shift();
    image.onload=()=>{readyCount++;loadBusy=false;queueDecorate();setTimeout(pumpLoadQueue,45)};
    image.onerror=()=>{failed.add(file);loadBusy=false;setTimeout(pumpLoadQueue,45)};
    image.src=imageRoot+file;
  }
  function ensureImage(file,priority=false){
    let image=images.get(file);
    if(image)return image;
    image=new Image();image.decoding='async';image.loading='lazy';images.set(file,image);
    const job={file,image}; if(priority)loadQueue.unshift(job); else loadQueue.push(job);
    pumpLoadQueue();
    return image;
  }
  function source(id,priority=false){const data=atlas[id];return data?{file:data[0],row:data[1],image:ensureImage(data[0],priority)}:null}
  function cell(sourceInfo,frame){
    const image=sourceInfo.image,cellWidth=image.naturalWidth/COLS,cellHeight=image.naturalHeight/ROWS;
    return{sx:cellWidth*frame,sy:cellHeight*sourceInfo.row,sw:cellWidth,sh:cellHeight};
  }
  function stateFrame(fighter,now=performance.now()/1000){
    if(window.ProMotion)return ProMotion.sourceFrame(ProMotion.motionFor(fighter));
    if(fighter.state==='ko')return 5;
    if(fighter.hitFlash>.035||fighter.state==='hurt'||fighter.freezeT>0)return 3;
    if(fighter.defend||fighter.state==='defend'||fighter.state==='crouch')return 5;
    if(fighter.state==='special')return Math.floor(now*11)%2?3:4;
    if(fighter.state==='throw'||fighter.state==='attack')return (fighter.stateT||0)<.105?3:4;
    if(!fighter.onGround||fighter.state==='air'){
      const phase=Math.max(0,Math.min(1,(fighter.jumpT||0)/.62));
      if((fighter.vy||0)>160)return 1;
      if(phase>.72||(fighter.vy||0)<-240)return 5;
      return Math.floor((fighter.animT||now)*10)%2?1:2;
    }
    if(fighter.state==='walk'||Math.abs(fighter.vx||0)>7){
      const speed=Math.min(12,6+Math.abs(fighter.vx||0)/42);
      return 1+(Math.floor((fighter.walkT||now)*speed)%2+2)%2;
    }
    return 0;
  }
  function visualHeight(id,pose){
    let height=heavy.has(id)?208:compact.has(id)?186:196;
    if(id==='ztaaa')height=224;
    return height;
  }
  function drawGlow(context,fighter,floor,height,now){
    // Ground aura stays cheap: no canvas blur or filter in the fighting loop.
    context.save();context.globalAlpha=.12;context.strokeStyle=fighter.color||'#67e8f9';context.lineWidth=2;context.beginPath();context.ellipse(fighter.x,floor+2,height*.24,height*.042,0,0,Math.PI*2);context.stroke();context.restore();
  }
  function drawShadow(context,fighter,floor,height){
    const lift=Math.min(.6,Math.max(0,fighter.y||0)/450);
    context.save();context.globalAlpha=(fighter.state==='ko'?.2:.38)*(1-lift);context.fillStyle='#02030a';context.beginPath();context.ellipse(fighter.x,floor+3,height*.24*(1-lift*.4),height*.047*(1-lift*.4),0,0,Math.PI*2);context.fill();context.restore();
  }
  function drawCell(context,image,box,height,alpha=1){
    const width=height*(box.sw/box.sh);
    context.globalAlpha*=alpha;context.drawImage(image,box.sx,box.sy,box.sw,box.sh,-width/2,-height,width,height);
    return width;
  }
  function drawGuardEffect(context,fighter,floor,height,now){
    context.save();context.translate(fighter.x,floor-height*.55);context.scale(fighter.facing||1,1);context.strokeStyle='#dffcff';context.fillStyle=fighter.color||'#67e8f9';context.lineWidth=2;context.globalAlpha=.5;context.beginPath();context.moveTo(8,-height*.39);context.quadraticCurveTo(height*.47,-height*.23,height*.42,height*.18);context.quadraticCurveTo(height*.16,height*.34,-5,height*.14);context.closePath();context.stroke();context.globalAlpha=.07;context.fill();context.restore();
  }
  function drawAttackEffect(context,fighter,floor,height,frame,now){
    if(frame!==4)return;
    context.save();context.translate(fighter.x,floor-height*.56);context.scale(fighter.facing||1,1);context.strokeStyle=fighter.color||'#fff';context.lineWidth=3;context.globalAlpha=.4;context.beginPath();context.arc(height*.17,0,height*.37,-1.15,.88);context.stroke();context.restore();
  }

  const previousDraw=window.drawFighter;
  window.drawFighter=function proFrameDraw(context,fighter){
    const sourceInfo=fighter&&source(fighter.id),image=sourceInfo?.image;
    if(!fighter||!image||!image.complete||!image.naturalWidth||failed.has(sourceInfo.file))return previousDraw.apply(this,arguments);
    const now=fighter.animT||0,motion=window.ProMotion?.motionFor(fighter),frame=stateFrame(fighter,now),box=cell(sourceInfo,frame);
    const floor=typeof groundLevel==='function'?groundLevel(fighter):496-(fighter.y||0),height=visualHeight(fighter.id,frame);
    const attacking=fighter.state==='throw'||fighter.state==='attack'||fighter.state==='special';
    const ground=floor+(fighter.y||0);
    const downed=!!(fighter.proKnockdownT>0&&fighter.onGround&&fighter.state!=='ko');
    if(downed){
      const downBox=cell(sourceInfo,5),downHeight=height*.96;
      drawShadow(context,fighter,ground,downHeight);
      context.save();context.translate(fighter.x,floor-12);context.scale(fighter.facing||1,1);context.rotate(-Math.PI/2);context.translate(0,downHeight*.43);context.globalAlpha=.94;context.imageSmoothingEnabled=true;context.imageSmoothingQuality='low';drawCell(context,image,downBox,downHeight,1);context.restore();
      context.save();context.textAlign='center';context.font='800 12px system-ui';context.fillStyle='#ffb4b4';context.shadowColor='#ef3340';context.shadowBlur=10;context.fillText('NO CHÃO · VULNERÁVEL',fighter.x,floor-38);context.restore();
      if(fighter.hitFlash>.035){context.save();context.strokeStyle='#fff';context.lineWidth=3;context.globalAlpha=Math.min(.9,fighter.hitFlash*4);context.beginPath();context.moveTo(fighter.x-38,floor-22);context.lineTo(fighter.x+38,floor-8);context.moveTo(fighter.x+38,floor-22);context.lineTo(fighter.x-38,floor-8);context.stroke();context.restore()}
      return;
    }
    drawShadow(context,fighter,ground,height);drawGlow(context,fighter,ground,height,now);
    context.save();context.translate(fighter.x,floor);context.scale(fighter.facing||1,1);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='low';
    if(fighter.state==='ko'){
      const fall=Math.min(1,(fighter.stateT||0)*3.2);context.translate(-height*.15,-4);context.rotate(-1.12*fall);context.globalAlpha=.42+.4*(1-fall);
    }
    if(motion)ProMotion.paint(context,fighter.id,image,box,motion,height);
    else drawCell(context,image,box,height,1);
    context.restore();
    if(fighter.hitFlash>.035){context.save();context.strokeStyle='#fff';context.lineWidth=2;context.globalAlpha=Math.min(.8,fighter.hitFlash*3);context.beginPath();context.moveTo(fighter.x-16,floor-height*.6-10);context.lineTo(fighter.x+16,floor-height*.6+10);context.moveTo(fighter.x+16,floor-height*.6-10);context.lineTo(fighter.x-16,floor-height*.6+10);context.stroke();context.restore()}
    if(fighter.defend||fighter.state==='defend')drawGuardEffect(context,fighter,floor,height,now);
    if(attacking)drawAttackEffect(context,fighter,floor,height,frame,now);
    if(fighter.state==='special'){
      context.save();context.strokeStyle=fighter.color||'#fff';context.globalAlpha=.48+.2*Math.sin(now*18);context.lineWidth=3;context.beginPath();context.arc(fighter.x,floor-height*.53,height*.44+Math.sin(now*13)*4,0,Math.PI*2);context.stroke();context.restore();
    }
  };

  function paintPortrait(canvas,id,frame=0){
    const sourceInfo=source(id),image=sourceInfo?.image;if(!canvas||!image?.complete||!image.naturalWidth)return false;
    const box=cell(sourceInfo,frame),context=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
    context.clearRect(0,0,width,height);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
    const targetHeight=height*1.03,targetWidth=targetHeight*(box.sw/box.sh),x=(width-targetWidth)/2;
    context.save();context.filter='contrast(1.08) saturate(1.08) drop-shadow(0 18px 12px rgba(0,0,0,.75))';context.drawImage(image,box.sx,box.sy,box.sw,box.sh,x,height-targetHeight,targetWidth,targetHeight);context.restore();
    return true;
  }
  function mountPortrait(host,id,kind='card'){
    if(!host||!atlas[id])return;if(host.dataset.spriteV2Id===id){const current=host.querySelector('.pro-sprite-v2');if(current)paintPortrait(current,id);return}
    host.querySelectorAll('.pro-sprite-v2').forEach(node=>node.remove());
    const canvas=document.createElement('canvas');canvas.className=`pro-sprite-v2 pro-sprite-v2-${kind}`;canvas.width=kind==='detail'?520:kind==='shop'?360:420;canvas.height=kind==='detail'?430:kind==='shop'?330:470;canvas.setAttribute('aria-label',`Sprite animado de ${character(id)?.name||id}`);host.appendChild(canvas);host.classList.add('has-pro-sprite-v2');host.dataset.spriteV2Id=id;paintPortrait(canvas,id);
  }
  function decorateCards(){document.querySelectorAll('.fighter-card[data-id]').forEach(card=>mountPortrait(card.querySelector('.mk-portrait'),card.dataset.id,'card'))}
  function decorateShop(){document.querySelectorAll('.shop-card').forEach(card=>{const name=card.querySelector('h3')?.textContent?.trim(),item=typeof CHARACTERS!=='undefined'?CHARACTERS.find(entry=>entry.name===name):null;if(item)mountPortrait(card.querySelector('.shop-art'),item.id,'shop')})}
  function decorateDetail(){const host=document.querySelector('.mk-dportrait');if(host&&lastDetailId)mountPortrait(host,lastDetailId,'detail')}
  function decorateAll(){decorateQueued=false;decorateCards();decorateShop();decorateDetail();if(readyCount===sourceNames.length)document.body.classList.add('pro-sprites-ready')}
  function queueDecorate(){if(decorateQueued)return;decorateQueued=true;requestAnimationFrame(decorateAll)}
  function warmFighter(id){const info=source(id,true);if(info?.image?.complete&&info.image.naturalWidth)window.ProMotion?.warm(id,info.image,frame=>cell(info,frame))}
  function wrap(name,after){const base=window[name];if(typeof base!=='function'||base.__spriteV2Wrapped)return;const wrapped=function(...args){const result=base.apply(this,args);after(...args);return result};wrapped.__spriteV2Wrapped=true;window[name]=wrapped}
  ['renderMenu','renderModes','renderSelect','renderShop','renderShopChampions'].forEach(name=>wrap(name,queueDecorate));
  wrap('startFight',()=>{if(typeof fight!=='undefined'&&fight){warmFighter(fight.p1.id);warmFighter(fight.p2.id)}});
  const detailBase=window.renderCharacterDetail;
  if(typeof detailBase==='function'&&!detailBase.__spriteV2Wrapped){const wrapped=function(id,...args){lastDetailId=id||lastDetailId;const result=detailBase.call(this,id,...args);queueDecorate();return result};wrapped.__spriteV2Wrapped=true;window.renderCharacterDetail=wrapped}
  const observer=new MutationObserver(queueDecorate);const app=document.getElementById('app');if(app)observer.observe(app,{childList:true,subtree:true});
  // Sem preload global: os atlases de 2–3 MB são carregados apenas quando aparecem
  // na seleção, loja ou luta. Isso evita dezenas de MB no primeiro carregamento.
  queueDecorate();
  window.ProSpriteAnimator=Object.freeze({version:'3.1.0-fastload',fighters:Object.keys(atlas).length,sourceFrames:Object.keys(atlas).length*COLS,ready:()=>readyCount===sourceNames.length,frameFor:stateFrame,refresh:queueDecorate});
})();
