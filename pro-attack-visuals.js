/* Original abilities: one effect pass per frame, independent of fighter artwork. */
(()=>{
  'use strict';
  if(window.ProAttackVisuals)return;
  const TAU=Math.PI*2,MAX_IMPACTS=6;
  const coverage=Object.freeze({
    knives:'drawKnives',swords:'drawSwords',orbs:'drawOrbs',flowers:'drawFlowers',wands:'drawWands',
    rays:'drawRays',lightnings:'drawLightnings',jimmyRays:'drawJimmyRays',
    smokeBombs:'drawYtiriEffects',ytiriChains:'drawYtiriEffects',ytiriCopyFx:'copyEffects',uiyeCopyFx:'copyEffects',
    grizzClones:'drawGrizzEffects',grizzWalls:'drawGrizzEffects',grizzLaserFx:'drawGrizzEffects',
    hockShards:'drawHockVladEffects',hockMoonFx:'drawHockVladEffects',vladBloodSpits:'drawHockVladEffects',vladSiphons:'drawHockVladEffects',
    jetdeShots:'drawJetdeEffects',uiyeStones:'drawNewCharacterAttacks',ouipAcid:'drawNewCharacterAttacks',ouipMeteors:'drawNewCharacterAttacks',
    yoiSand:'drawNewCharacterAttacks',yoiGas:'drawNewCharacterAttacks',kloHoles:'drawKloHoles',
    verryMudShots:'drawVerryEffects',verryMuds:'drawVerryEffects',perryTrees:'drawVerryEffects',
    fireballs:'drawFlameEffects',firewalls:'drawFlameEffects',knunkaRays:'drawFlameEffects',knunkaFires:'drawFlameEffects',
    knunkaDashTrails:'dashTrails',groghEnergy:'drawGroghEffects',groghReflections:'drawGroghEffects',
    dartWinds:'drawDartEffects',dartWalls:'drawDartEffects',dartFires:'drawDartEffects',dartPotions:'drawDartEffects',dartEffects:'drawDartEffects',
    lkughBombs:'drawLkughEffects',lkughMoons:'drawLkughEffects',lkughStars:'drawLkughEffects',lkughBlackHoles:'drawLkughEffects',lkughEffects:'drawLkughEffects',
    healOrbs:'drawArenaFeatures'
  });
  const restoredNames=['drawFlameEffects','drawGroghEffects','drawDartEffects','drawLkughEffects'];
  const stats={frames:0,restoredPasses:0,impactsCreated:0,activeImpacts:0,drawsByFamily:{},coverage};
  let frame=0,inFrame=false,renderFight=null;
  const calledAt=Object.create(null),states=new WeakMap();
  const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
  const ground=()=>typeof GROUND_Y!=='undefined'?GROUND_Y:840;
  const currentFight=()=>typeof fight!=='undefined'?fight:null;
  const body=p=>typeof bodyY==='function'?bodyY(p):ground()-(p.y||0)-45;
  const tick=f=>Number(f.p1?.animT)||0;
  const alive=o=>o&&!o.dead&&o.life!==0;
  function each(f,key,fn){for(const o of f[key]||[])if(alive(o))fn(o)}
  function state(f){let s=states.get(f);if(!s){s={impacts:[],pulls:[]};states.set(f,s)}return s}
  function disk(ctx,x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);ctx.fill()}
  function ring(ctx,x,y,r,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);ctx.stroke()}
  function line(ctx,x,y,x2,y2,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
  function label(ctx,text,x,y,color,alpha=1){ctx.save();ctx.globalAlpha=clamp(alpha);ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#080b17';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore()}
  function star(ctx,x,y,r,color,angle=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();
    for(let i=0;i<4;i++){const a=i*Math.PI/2-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}
    ctx.closePath();ctx.fill();ctx.restore();
  }
  function fire(ctx,o,t,dark=false){
    const dir=Math.sign(o.vx)||o.owner?.facing||1,r=o.radius||14;
    ctx.save();ctx.translate(o.x,o.y);ctx.scale(dir,1);ctx.globalAlpha=clamp(o.life/.14);
    const outer=dark?'#713dc8':'#f24d1b',mid=dark?'#b883ff':'#ffa736',core=dark?'#e6d0ff':'#fff1ad';
    ctx.fillStyle=outer;ctx.beginPath();ctx.moveTo(r+4,0);ctx.quadraticCurveTo(5,-r*1.4,-r*2.2,-r*.75);
    ctx.lineTo(-r*1.6,-3);ctx.lineTo(-r*(3.5+Math.sin(t*21)*.35),2);ctx.lineTo(-r*1.8,r*.6);ctx.quadraticCurveTo(3,r*1.3,r+4,0);ctx.fill();
    disk(ctx,0,0,r,mid);disk(ctx,3,-1,r*.55,core);ctx.restore();
  }
  function flameEffects(ctx,f){
    const t=tick(f);
    each(f,'fireballs',o=>fire(ctx,o,t));
    each(f,'firewalls',o=>{
      ctx.save();ctx.globalAlpha=clamp(o.life/.3);const left=o.x-o.width/2;
      ctx.fillStyle='rgba(228,48,20,.27)';ctx.fillRect(left,ground()-100,o.width,100);
      for(let x=left+7,i=0;x<left+o.width;x+=36,i++){
        const h=76+Math.sin(t*13+i*1.9)*18;
        ctx.fillStyle='#ef4a20';ctx.beginPath();ctx.moveTo(x-11,ground());ctx.quadraticCurveTo(x-15,ground()-h*.6,x+4,ground()-h);ctx.quadraticCurveTo(x+19,ground()-h*.4,x+11,ground());ctx.fill();
        ctx.fillStyle='#ffd16e';ctx.beginPath();ctx.moveTo(x-5,ground());ctx.quadraticCurveTo(x-5,ground()-h*.3,x+2,ground()-h*.58);ctx.lineTo(x+6,ground());ctx.fill();
      }
      line(ctx,left,ground()-2,left+o.width,ground()-2,'#ffe6a1',4);ctx.restore();
    });
    each(f,'knunkaRays',o=>{
      const dir=o.owner?.facing||1,end=o.x+dir*72;ctx.save();ctx.globalAlpha=clamp(o.life/.08);ctx.lineCap='round';
      line(ctx,o.x,o.y,end,o.y,'#258ec4',15);line(ctx,o.x,o.y,end,o.y,'#a9eeff',6);
      for(let i=0;i<3;i++)line(ctx,o.x+dir*i*12,o.y,o.x+dir*(i+1)*12,o.y+Math.sin(t*55+i*3)*12,'#e9fcff',2);
      star(ctx,end,o.y,18,'#f2feff',t*9);ctx.restore();
    });
    each(f,'knunkaFires',o=>fire(ctx,o,t,true));
    for(const p of [f.p1,f.p2])if(p?.knunkaBurnT>0&&p.state!=='ko'){
      ctx.save();ctx.globalAlpha=.8;
      for(let i=0;i<2;i++)fire(ctx,{x:p.x+(i-.5)*20,y:body(p)+Math.sin(t*11+i)*8,life:1,vx:0,radius:8,owner:p},t+i,true);
      ctx.restore();label(ctx,'CHAMA NEGRA '+Math.ceil(p.knunkaBurnT)+'s',p.x,body(p)-40,'#e9caff');
    }
  }
  function energy(ctx,o,t){
    const dir=Math.sign(o.vx)||1,r=o.radius||14,col=o.color||'#67e8f9';ctx.save();ctx.globalAlpha=clamp(o.life/.16);
    ctx.lineCap='round';line(ctx,o.x-dir*44,o.y,o.x,o.y,col,5);line(ctx,o.x-dir*27,o.y-9,o.x-dir*6,o.y-9,col,2);
    disk(ctx,o.x,o.y,r+4,'#16394d');disk(ctx,o.x,o.y,r,col);ring(ctx,o.x,o.y,r+8+Math.sin(t*18)*2,col,2);star(ctx,o.x,o.y,r*.9,'#f3ffff',t*4);
    ctx.restore();
  }
  function groghEffects(ctx,f){for(const key of ['groghEnergy','groghReflections'])each(f,key,o=>energy(ctx,o,tick(f)))}
  function dartEffects(ctx,f){
    const t=tick(f);
    each(f,'dartWinds',o=>{
      ctx.save();ctx.globalAlpha=clamp(o.life/.2);ctx.translate(o.x,o.y);ctx.scale(Math.sign(o.vx)||1,1);ctx.lineCap='round';
      for(let i=0;i<2;i++){ctx.strokeStyle=i%2?'#f0faff':'#8ee1eb';ctx.lineWidth=i%2?2:4;ctx.beginPath();ctx.ellipse(-i*9,(i-1.5)*8,22+i*6,13+i*2,0,-1.35,1.35);ctx.stroke()}
      ctx.restore();
    });
    each(f,'dartWalls',o=>{
      const x=o.x-o.width/2,y=ground()-120;ctx.save();ctx.fillStyle='#665146';ctx.fillRect(x,y,o.width,120);ctx.strokeStyle='#c5b6a2';ctx.lineWidth=2;ctx.strokeRect(x,y,o.width,120);
      for(let row=0;row<5;row++){line(ctx,x,y+row*24,x+o.width,y+row*24,'#312723',3);const sx=x+(row%2?o.width*.3:o.width*.65);line(ctx,sx,y+row*24,sx,y+(row+1)*24,'#312723',3)}
      ctx.restore();label(ctx,String(o.hits)+' RESISTÊNCIA',o.x,y-12,'#f4dec1');
    });
    each(f,'dartFires',o=>fire(ctx,o,t));
    each(f,'dartPotions',o=>{
      ctx.save();ctx.translate(o.x,o.y);ctx.rotate(Math.sin(t*8)*.13);ctx.fillStyle='#ddfff0';ctx.fillRect(-6,-19,12,10);ctx.fillStyle='#277653';ctx.fillRect(-7,-22,14,6);
      disk(ctx,0,0,15,'#bbf7d0');disk(ctx,0,2,11,'#36bc7c');line(ctx,-5,2,5,2,'#f0fff8',3);line(ctx,0,-3,0,7,'#f0fff8',3);ctx.restore();
    });
    each(f,'dartEffects',o=>label(ctx,o.text,o.x,o.y,'#e9fff4',o.life*2));
  }
  function lkughEffects(ctx,f){
    const t=tick(f);
    each(f,'lkughBombs',o=>{ctx.save();disk(ctx,o.x,o.y,15,'#321d67');ring(ctx,o.x,o.y,15,'#bc8dff',3);star(ctx,o.x,o.y,9,'#ecd9ff',t*3);ring(ctx,o.x,o.y,20+Math.sin(t*17)*2,'#8b68d6',1.5);ctx.restore()});
    each(f,'lkughMoons',o=>{
      ctx.save();ctx.translate(o.x,o.y);ctx.rotate((o.phase||0)*.18);ctx.fillStyle='#f1e5ff';ctx.beginPath();ctx.arc(0,0,23,.55,5.72);ctx.quadraticCurveTo(-9,0,Math.cos(.55)*23,Math.sin(.55)*23);ctx.fill();
      star(ctx,-5,0,6,'#b98eff',t);ctx.restore();
    });
    each(f,'lkughStars',o=>{line(ctx,o.x,o.y-33,o.x,o.y-8,'#ad80e3',3);star(ctx,o.x,o.y,13,'#fae9ff',t*5)});
    each(f,'lkughBlackHoles',o=>{
      ctx.save();ctx.globalAlpha=clamp(o.life/.35);ctx.translate(o.x,o.y);ctx.scale(1,.65);disk(ctx,0,0,32,'#070612');
      for(let i=0;i<1;i++){ctx.strokeStyle='#e8c8ff';ctx.lineWidth=3-i*.6;ctx.beginPath();ctx.arc(0,0,37+i*8,t*(i%2?-1:1)*3+i*2,t*(i%2?-1:1)*3+i*2+4.8);ctx.stroke()}
      ctx.restore();
    });
    each(f,'lkughEffects',o=>label(ctx,o.text,o.x,o.y,'#f1d5ff',o.life*2));
  }
  const recovered={drawFlameEffects:flameEffects,drawGroghEffects:groghEffects,drawDartEffects:dartEffects,drawLkughEffects:lkughEffects};
  // Legacy fallback fighters can request these twice. The new pass and the fallback share a frame guard.
  for(const name of restoredNames){
    window[name]=function restoredAbilityEffects(ctx){
      const f=renderFight||currentFight();if(!f||!ctx)return;
      if(inFrame&&calledAt[name]===frame)return;
      if(inFrame)calledAt[name]=frame;
      stats.drawsByFamily[name]=(stats.drawsByFamily[name]||0)+1;
      ctx.save();try{recovered[name](ctx,f)}finally{ctx.restore()}
    };
  }
  function copyEffects(ctx,f){
    const t=tick(f);
    for(const key of ['uiyeCopyFx','ytiriCopyFx'])each(f,key,o=>{
      const p=o.owner,x=p?.x??o.x,y=p?body(p):o.y,col=key==='uiyeCopyFx'?'#dfc7a3':'#d2ebff';
      ctx.save();ctx.globalAlpha=clamp(o.life/.35)*.7;ctx.strokeStyle=col;ctx.lineWidth=2;
      for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(x,y,42+i*12,58+i*9,Math.sin(t*3)*.18,t*(i?-2:2),t*(i?-2:2)+4.5);ctx.stroke()}
      ctx.restore();
    });
    for(const p of [f.p1,f.p2]){
      if(!p||p.state==='ko')continue;
      if(p.id==='nine85'&&(p.nine85Absorb>0||p.nine85Ready)){
        ctx.save();ctx.globalAlpha=.75;ring(ctx,p.x,body(p),46,'#ff4568',2);ctx.restore();
        label(ctx,p.nine85Ready?'CÓPIA PRONTA':'ABSORÇÕES '+p.nine85Absorb,p.x,body(p)-64,'#ffc1d0');
      }
      if(p.froghFxT>0||p.kloppFxT>0){ctx.save();ctx.globalAlpha=.45;ring(ctx,p.x,body(p),52+Math.sin(t*9)*5,p.color||'#94f4b2',2);ctx.restore()}
    }
  }
  function dashTrails(ctx,f){
    each(f,'knunkaDashTrails',o=>{
      const alpha=clamp(o.life/(o.maxLife||.28))*.38;ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';
      const gy=ground()-(o.y||0),dir=o.facing||1;
      for(let i=0;i<2;i++)line(ctx,o.x-dir*(38+i*7),gy-28-i*23,o.x+dir*(9+i*2),gy-28-i*23,i%2?'#a5e8ff':'#48b7ee',i%2?2:4);
      ctx.restore();
    });
  }
  const colorFor=type=>/fire|burn|meteor/.test(type)?'#ffbc68':/ice|freeze/.test(type)?'#b0f4ff':/poison|sand|mud|flower/.test(type)?'#b8eb7f':/crash|985/.test(type)?'#ff7197':/ray|lightning|energy/.test(type)?'#9de5ff':'#fff0c9';
  function emitImpact(f,info){
    if(!f)return;const list=state(f).impacts;
    if(list.length>=MAX_IMPACTS)list.shift();
    list.push({x:info.x,y:info.y,amount:Math.max(0,Math.round(info.amount||0)),color:info.color||colorFor(info.type||''),type:info.type||'hit',age:0,life:.46,blocked:!!info.blocked});
    stats.impactsCreated++;stats.activeImpacts=list.length;
  }
  function impacts(ctx,f){
    const s=state(f);
    for(const o of s.impacts){
      const t=o.age/o.life,spread=9+t*38;ctx.save();ctx.globalAlpha=clamp(1-t);ctx.lineCap='round';
      if(o.blocked){ctx.strokeStyle='#b5e8ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.x,o.y,20+t*26,-1.45,1.45);ctx.stroke()}
      else{
        ring(ctx,o.x,o.y,7+t*29,o.color,2*(1-t)+1);
        for(let i=0;i<2;i++){const a=i*Math.PI+.3;line(ctx,o.x+Math.cos(a)*spread*.6,o.y+Math.sin(a)*spread*.6,o.x+Math.cos(a)*spread,o.y+Math.sin(a)*spread,o.color,3*(1-t)+1)}
        if(t<.35)star(ctx,o.x,o.y,18*(1-t),'#fffef3',.3);
      }
      ctx.restore();if(o.amount>0)label(ctx,String(o.amount),o.x,o.y-33-t*37,o.blocked?'#c4f2ff':o.color,1-t);
    }
    for(const o of s.pulls){
      const t=o.age/o.life;ctx.save();ctx.globalAlpha=clamp(1-t);ctx.strokeStyle='#f5bb61';ctx.lineWidth=3;
      for(let i=0;i<=0;i++){ctx.beginPath();ctx.moveTo(o.x,o.y+i*9);ctx.quadraticCurveTo((o.x+o.target.x)/2,o.y+i*(28+Math.sin(t*12)*9),o.target.x,body(o.target));ctx.stroke()}
      ring(ctx,o.target.x,body(o.target),29+t*15,'#ffe1a1',2);ctx.restore();
    }
  }
  const originalDamage=window.damage;
  if(typeof originalDamage==='function')window.damage=function visibleOriginalDamage(victim,amount,src,dir,type){
    const hp=victim?.hp,guard=victim?.defend,result=originalDamage.apply(this,arguments),dealt=Number(hp)-Number(victim?.hp);
    if(victim&&dealt>0&&!/^pro-/.test(type||''))emitImpact(currentFight(),{x:victim.x,y:body(victim),amount:dealt,type,blocked:guard});
    return result;
  };
  const originalFreeze=window.applyFreeze;
  if(typeof originalFreeze==='function')window.applyFreeze=function visibleFreeze(victim){
    const hp=victim?.hp,f=currentFight(),created=stats.impactsCreated,result=originalFreeze.apply(this,arguments);
    // Defended freeze routes through damage(); avoid recording that hit twice.
    if(f&&victim&&hp>victim.hp&&created===stats.impactsCreated)emitImpact(f,{x:victim.x,y:body(victim),amount:hp-victim.hp,type:'ice'});
    return result;
  };
  const originalPull=window.rtessMagnetPull;
  if(typeof originalPull==='function')window.rtessMagnetPull=function visibleMagnetPull(p){
    const f=currentFight(),target=f&&(p===f.p1?f.p2:f.p1),before=target?.x,result=originalPull.apply(this,arguments);
    if(f&&target&&target.x!==before){const list=state(f).pulls;if(list.length>=8)list.shift();list.push({x:p.x,y:body(p),target,age:0,life:.48})}
    return result;
  };
  const originalUpdate=window.update;
  if(typeof originalUpdate==='function')window.update=function updateOriginalVisuals(f,dt){
    const result=originalUpdate.apply(this,arguments);if(!f||f.paused)return result;
    const elapsed=clamp(Number(dt)||0,0,.1),s=state(f);
    for(const o of s.impacts)o.age+=elapsed;for(const o of s.pulls)o.age+=elapsed;
    s.impacts=s.impacts.filter(o=>o.age<o.life);s.pulls=s.pulls.filter(o=>o.age<o.life);
    stats.activeImpacts=s.impacts.length;
    // UIYE's legacy copy array was only appended, never aged or removed.
    if(f.uiyeCopyFx){for(const o of f.uiyeCopyFx)o.life-=elapsed;f.uiyeCopyFx=f.uiyeCopyFx.filter(o=>o.life>0)}
    return result;
  };
  const originalDraw=window.draw;
  if(typeof originalDraw==='function')window.draw=function drawAllOriginalAbilities(f){
    if(!f)return originalDraw.apply(this,arguments);
    const ctx=typeof canvas!=='undefined'?canvas.getContext('2d'):null;
    if(!ctx)return originalDraw.apply(this,arguments);
    frame++;stats.frames++;inFrame=true;renderFight=f;ctx.save();
    try{
      const result=originalDraw.apply(this,arguments);
      for(const name of restoredNames)if(calledAt[name]!==frame){window[name](ctx);stats.restoredPasses++}
      copyEffects(ctx,f);dashTrails(ctx,f);impacts(ctx,f);return result;
    }finally{ctx.restore();inFrame=false;renderFight=null}
  };
  window.ProAttackVisuals=Object.freeze({version:'2.0.0',coverage,stats,emitImpact,restoredNames:Object.freeze(restoredNames),inspect:f=>{
    const s=f?states.get(f):null;return{impacts:s?.impacts.length||0,pulls:s?.pulls.length||0,coveredArrays:Object.keys(coverage).length};
  }});
})();
