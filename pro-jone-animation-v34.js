/* Jone Pikes V35 — animação de combate e passos alternados. */
(()=>{
  'use strict';
  if(window.JoneAnimationV34)return;
  const root='ai-assets/characters/jone/poses/';
  const sources={idle:'jone-v34-idle.png',run:'jone-v34-run.png',stepB:'jone-v35-step-b.png',guard:'jone-v34-guard.png',scythe:'jone-v34-scythe.png',hera:'jone-v34-hera.png'};
  const images=Object.fromEntries(Object.entries(sources).map(([key,name])=>{
    const img=new Image();img.decoding='async';img.src=root+name;return[key,img];
  }));
  const ready=key=>images[key]?.complete&&images[key].naturalWidth>0;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const base=window.drawFighter;
  if(typeof base!=='function')return;

  function pose(ctx,key,height=242,alpha=1,dx=0,dy=0,rotation=0){
    const img=images[ready(key)?key:'idle'];if(!img?.naturalWidth)return;
    const width=height*img.naturalWidth/img.naturalHeight;
    ctx.save();ctx.globalAlpha*=alpha;ctx.translate(dx,dy);ctx.rotate(rotation);
    ctx.drawImage(img,-width/2,-height,width,height);ctx.restore();
  }
  function floorOf(p){
    try{if(typeof groundLevel==='function')return groundLevel(p)}catch(_){ }
    return(typeof GROUND_Y!=='undefined'?GROUND_Y:840)-(p.y||0);
  }
  function glow(ctx,time,mode,intensity){
    const green=mode==='hera'?'#75ff69':'#a8ff62';
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.10+intensity*.12;
    const r=30+intensity*18+Math.sin(time*8)*3;
    const g=ctx.createRadialGradient(36,-114,4,36,-114,r);
    g.addColorStop(0,'#caff9b');g.addColorStop(.35,green);g.addColorStop(1,'rgba(95,255,75,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(36,-114,r,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function slash(ctx,time,progress,kind){
    const amount=Math.sin(Math.PI*clamp(progress,0,1));if(amount<=.05)return;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    ctx.strokeStyle=kind==='kick'?'#caff94':'#79ff52';ctx.shadowColor='#6dff48';ctx.shadowBlur=18;
    for(let i=0;i<3;i++){
      ctx.globalAlpha=(.56-i*.13)*amount;ctx.lineWidth=7-i*2;
      ctx.beginPath();
      if(kind==='kick'){
        ctx.moveTo(5,-92+i*5);ctx.quadraticCurveTo(69,-116-i*7,104,-79+i*5);
      }else{
        ctx.moveTo(-53,-191+i*5);ctx.quadraticCurveTo(63,-262-i*9,119,-132+i*9);
      }
      ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.fillStyle='#aaff68';
    for(let i=0;i<4;i++){
      const x=(kind==='kick'?55:76)+i*12,y=(kind==='kick'?-100:-180)+Math.sin(time*11+i)*15;
      ctx.globalAlpha=.25*amount;ctx.beginPath();ctx.arc(x,y,3+i%2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function render(ctx,p){
    if(!ready('idle'))return false;
    const time=performance.now()/1000,dir=p.facing||1,move=p.proMove,kind=move?.kind||'',duration=Math.max(.1,Number(move?.duration)||.48);
    const progress=move?clamp((move.time||0)/duration,0,1):clamp((p.stateT||0)/.50,0,1);
    const attacking=!!move||p.state==='throw'||p.state==='special';
    const guard=p.defend||p.state==='defend';
    const air=!p.onGround||p.state==='air';
    const fast=Math.abs(p.vx||0)>8;
    const power=(p.jonePowerIndex||0)%2===0?'scythe':'hera';
    const island=!!p.__islandDummyFight;
    ctx.save();ctx.translate(p.x||0,floorOf(p)-3);
    // O renderizador da Ilha usa a mesma arte, com metade da escala do confronto normal.
    if(island)ctx.scale(.5,.5);
    ctx.scale(dir,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(p.state==='ko'||((p.proKnockdownT||0)>0&&p.onGround)){
      ctx.save();ctx.translate(-16,-10);ctx.rotate(-1.18);pose(ctx,'guard',220,p.state==='ko'?.70:.90,0,42);ctx.restore();
    }else if(p.state==='hurt'){
      ctx.save();ctx.translate(-7,0);ctx.rotate(-.08);pose(ctx,'guard',238,.85);ctx.restore();
    }else if(guard){
      const sway=Math.sin(time*5)*1.2;pose(ctx,'guard',242,1,0,sway,.015);
      glow(ctx,time,'scythe',.45);
    }else if(p.state==='crouch'){
      ctx.save();ctx.scale(1,.73);pose(ctx,'guard',242,1,0,0,.045);ctx.restore();
    }else if(attacking){
      const isKick=/kick|sweep|flyingkick|airdown/.test(kind);
      const isPunch=/punch|uppercut|hook/.test(kind);
      const isSuper=p.state==='special';
      if(isKick){
        const surge=Math.sin(Math.PI*progress);
        ctx.save();ctx.translate(surge*17,-surge*8);ctx.rotate(-surge*.10);
        pose(ctx,'run',237);ctx.restore();slash(ctx,time,progress,'kick');
      }else if(isSuper||power==='hera'||isPunch){
        const cast=Math.sin(Math.PI*progress);
        pose(ctx,'hera',242,1,cast*8,-cast*3,cast*.03);
        glow(ctx,time,'hera',isSuper?1.6:1);
      }else{
        const wind=progress<.28?ease(progress/.28):1;
        const release=progress<.28?0:ease((progress-.28)/.35);
        pose(ctx,'scythe',242,1,-8*wind+19*release,-5*Math.sin(Math.PI*progress),.10*wind-.20*release);
        slash(ctx,time,progress,'scythe');
      }
    }else if(air){
      const rising=(p.vy||0)>80,falling=(p.vy||0)<-80;
      ctx.save();ctx.rotate(rising?-.07:falling?.09:0);pose(ctx,'run',238,1,0,-6);ctx.restore();
    }else if(fast){
      const speed=clamp(Math.abs(p.vx||0)/250,.24,1.6);
      const elapsed=clamp(time-(p.joneGaitAt??time),0,.05);
      p.joneGaitAt=time;
      p.joneGaitPhase=((p.joneGaitPhase||0)+elapsed*(1.18+speed*.72))%1;
      const phase=p.joneGaitPhase;
      const lift=Math.sin(phase*Math.PI*2)**2;
      const bodyLean=.017+Math.sin(phase*Math.PI*2)*.025*speed;
      const bodyShift=Math.sin(phase*Math.PI*2)*2.8*speed;
      const contactA=phase<.5;
      const blend=contactA?clamp((phase-.45)/.05,0,1):clamp((phase-.95)/.05,0,1);
      ctx.save();ctx.translate(bodyShift,-lift*(2.5+speed*1.8));ctx.rotate(bodyLean);
      if(blend>0&&ready('stepB')){
        pose(ctx,contactA?'run':'stepB',242,1-blend);
        pose(ctx,contactA?'stepB':'run',242,blend);
      }else pose(ctx,contactA||!ready('stepB')?'run':'stepB',242);
      ctx.restore();
      // O brilho toca o chão nos dois apoios; no intervalo o corpo sobe.
      const contact=Math.max(0,1-lift*3.5);
      if(contact>.05){
        ctx.save();ctx.globalAlpha=.13*contact;ctx.fillStyle='#a5ff72';
        ctx.beginPath();ctx.ellipse(contactA?31:-20,-1,24,3.5,0,0,Math.PI*2);ctx.fill();ctx.restore();
      }
    }else{
      p.joneGaitAt=time;p.joneGaitPhase=0;
      const breathe=Math.sin(time*2.5+(p.x||0)*.01),sway=Math.sin(time*1.3)*.012;
      ctx.save();ctx.translate(0,-breathe*1.6);ctx.rotate(sway);pose(ctx,'idle',242);ctx.restore();
      glow(ctx,time,power,.55);
    }
    if((p.joneFlashT||0)>0)glow(ctx,time,power,1.3);
    ctx.restore();return true;
  }
  window.drawFighter=function(ctx,p){
    if(p?.id==='jone'&&render(ctx,p))return;
    return base.apply(this,arguments);
  };
  window.JoneAnimationV34=Object.freeze({version:'35.0.0',poses:Object.keys(sources)});
})();
