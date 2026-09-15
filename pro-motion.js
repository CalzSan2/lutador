/* Shared, texture-skinned 2D animation for the existing fighter artwork.
   Motion is authored in joint space; rasterized poses are cached, never filtered per frame. */
(()=>{
  'use strict';
  const TAU=Math.PI*2, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
  const cache=new Map(), MAX_FIGHTERS=4, HEIGHT=240, PAD=30;
  const counts={idle:12,walk:24,jump:16,land:8,attack:10,special:12,guard:6,hurt:6,ko:8,punch:12,kick:16,low:12,rush:14,uppercut:16};

  function motionFor(p){
    let kind='idle',phase=0;
    if((p.defeatPoseT||0)>0){kind='ko';phase=.88}
    else if((p.victoryPoseT||0)>0){kind='special';phase=.76}
    else if(p.state==='ko'){kind='ko';phase=clamp((p.stateT||0)/.5)}
    else if(p.state==='hurt'||p.freezeT>0){kind='hurt';phase=clamp((p.stateT||0)/.28)}
    else if(p.proMove){kind=({punch:'punch',kick:'kick',down:'low',forward:'rush',diagonal:'uppercut'})[p.proMove.kind]||'attack';phase=clamp(p.proMove.time/p.proMove.duration)}
    else if(p.state==='throw'||p.state==='attack'){kind='attack';phase=clamp((p.stateT||0)/.32)}
    else if(p.state==='special'){kind='special';phase=clamp((p.stateT||0)/.55)}
    else if(!p.onGround){
      kind='jump';
      // Positive vy rises; negative vy falls. Fixed authored poses, no random alternation.
      phase=clamp((860-(p.vy||0))/1720);
    }
    else if((p.landT||0)>0){kind='land';phase=1-clamp(p.landT/.14)}
    else if(p.defend||p.state==='defend'||p.state==='crouch'){kind='guard';phase=((p.animT||0)*.7)%1}
    else if(Math.abs(p.vx||0)>5){kind='walk';phase=((p.walkDistance||0)/145)%1}
    else phase=((p.animT||0)*.55)%1;
    const count=counts[kind],looping=['idle','walk','guard'].includes(kind);
    const frame=Math.min(count-1,Math.floor(phase*(looping?count:count-1)));
    return{kind,frame,phase:frame/(looping?count:count-1)};
  }

  function sourceFrame(m){
    if(m.kind==='kick')return 1;
    if(m.kind==='low')return 5;
    if(m.kind==='uppercut')return m.phase<.30?5:3;
    if(m.kind==='walk')return 1;
    if(m.kind==='jump'||m.kind==='land'||m.kind==='guard'||m.kind==='ko')return 5;
    if(m.kind==='hurt')return 0;
    if(['attack','special','punch','rush'].includes(m.kind)){
      if(m.phase<.1)return 0;
      if(m.phase<.33)return 3;
      if(m.phase<.72)return 4;
      return 5;
    }
    return 0;
  }

  function deform(x,y,m,weight=1){
    let dx=0,dy=0;
    const upper=1-smooth(.50,.68,y),leg=smooth(.53,.95,y);
    // Soft weights across the hip keep the torso seam closed as each knee bends.
    const side=smooth(.43,.57,x),left=1-side;
    const extremity=smooth(.09,.26,Math.abs(x-.5));
    const arm=extremity*smooth(.18,.35,y)*(1-smooth(.52,.64,y));
    const t=m.phase;
    if(m.kind==='kick'){
      const extension=smooth(.1,.4,t)*(1-smooth(.58,1,t));
      const theta=-1.32*extension,px=.53,py=.56;
      const influence=smooth(.45,.61,x)*smooth(.51,.65,y);
      dx+=((x-px)*Math.cos(theta)-(y-py)*Math.sin(theta)+px-x)*influence;
      dy+=((x-px)*Math.sin(theta)+(y-py)*Math.cos(theta)+py-y)*influence;
      dx-=upper*.037*extension;dy-=upper*.012*extension;
      dx+=arm*(x-.5)*.1*extension;
    }else if(m.kind==='uppercut'){
      const rise=smooth(.15,.48,t)*(1-smooth(.65,1,t));
      dy+=upper*.06*(1-rise)*Math.sin(t*Math.PI);
      dy-=arm*.15*rise;dx+=upper*.044*rise;
      dx+=arm*(x>.5?.075:-.022)*rise;
    }else if(m.kind==='low'){
      const bend=Math.sin(t*Math.PI);
      dy+=(1-y)*.10*bend;dx+=arm*.075*bend;
      dx+=leg*(x-.5)*.08*bend;
    }else if(m.kind==='walk'){
      const a=t*TAU,b=a+Math.PI;
      const lf=Math.sin(a),rf=Math.sin(b),liftL=Math.pow(Math.max(0,Math.cos(a)),2);
      const liftR=Math.pow(Math.max(0,Math.cos(b)),2);
      const bend=Math.sin(clamp((y-.52)/.43)*Math.PI);
      dx+=leg*(left*lf+side*rf)*.092;
      dx+=bend*(left*liftL+side*liftR)*.048;
      dy-=leg*(left*liftL+side*liftR)*.064;
      dy-=upper*(1-Math.cos(a*2))*.006;
      dx+=arm*(side-left)*lf*.04;
      dy+=arm*(side-left)*Math.cos(a)*.022;
      dx+=upper*.009;
    }else if(m.kind==='jump'){
      const tuck=Math.sin(t*Math.PI),rise=1-smooth(.05,.28,t),fall=smooth(.7,1,t);
      dx+=leg*(.5-x)*tuck*.32;
      dx+=Math.sin(clamp((y-.52)/.43)*Math.PI)*.038*tuck;
      dy-=leg*.13*tuck;
      dy+=upper*.022*rise;
      dx+=arm*(x-.5)*.09*tuck;
      dy-=arm*(.032*tuck+.02*fall);
      dx+=upper*.025*(.5-t);
    }else if(m.kind==='land'){
      const compression=Math.sin(t*Math.PI);
      dy+=(1-y)*.065*compression;
      dx+=leg*(x-.5)*.09*compression;
      dx+=upper*.017*compression;
    }else if(['attack','special','punch','rush'].includes(m.kind)){
      const anticipation=t<.33?Math.sin(t/.33*Math.PI):0;
      const strike=t>=.33?Math.sin(clamp((t-.33)/.67)*Math.PI):0;
      dx+=upper*(-.018*anticipation+.034*strike);
      dx+=arm*(x>.5?.034:-.013)*strike;
      dy+=upper*.013*anticipation;
      dy-=arm*.012*strike;
      dx+=leg*(x-.5)*.016*strike;
      if(m.kind==='punch'){dx+=arm*.038*strike;dy-=arm*.014*strike}
      if(m.kind==='rush'){dx+=upper*.042*strike;dy+=upper*.019*strike}
    }else if(m.kind==='guard'){
      const breath=Math.sin(t*TAU);
      dy+=upper*(.014+.003*breath);
      dx-=upper*.009;
      dx+=arm*(.5-x)*.018;
    }else if(m.kind==='hurt'){
      const impact=Math.sin(t*Math.PI);
      dx-=upper*.04*impact;
      dy+=upper*.019*impact;
    }else if(m.kind==='idle'){
      const breath=Math.sin(t*TAU);
      dy-=upper*.005*breath;
      dx+=arm*(x-.5)*.012*breath;
    }
    return{x:x+dx*weight,y:y+dy*weight};
  }

  function triangle(ctx,texture,a,b,c,A,B,C){
    const det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
    if(Math.abs(det)<.00001)return;
    const u=((B.x-A.x)*(c.y-a.y)-(C.x-A.x)*(b.y-a.y))/det;
    const v=((B.y-A.y)*(c.y-a.y)-(C.y-A.y)*(b.y-a.y))/det;
    const s=((C.x-A.x)*(b.x-a.x)-(B.x-A.x)*(c.x-a.x))/det;
    const t=((C.y-A.y)*(b.x-a.x)-(B.y-A.y)*(c.x-a.x))/det;
    ctx.save();ctx.beginPath();
    // Tiny overlap seals antialiased edges between adjacent textured triangles.
    const cx=(A.x+B.x+C.x)/3,cy=(A.y+B.y+C.y)/3;
    for(const [i,p] of [A,B,C].entries()){
      const vx=p.x-cx,vy=p.y-cy,length=Math.hypot(vx,vy)||1;
      const px=p.x+vx/length*.22,py=p.y+vy/length*.22;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.clip();
    ctx.setTransform(u,v,s,t,A.x-u*a.x-s*a.y,A.y-v*a.x-t*a.y);
    ctx.drawImage(texture,0,0);ctx.restore();
  }

  function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
  function fighterCache(id){
    let entry=cache.get(id);
    if(entry){cache.delete(id);cache.set(id,entry);return entry}
    entry={textures:new Map(),poses:new Map()};cache.set(id,entry);
    if(cache.size>MAX_FIGHTERS){
      const oldest=cache.keys().next().value,removed=cache.get(oldest);
      for(const c of [...removed.poses.values(),...removed.textures.values()]){c.width=1;c.height=1}
      cache.delete(oldest);
    }
    return entry;
  }
  function bake(image,box,m,entry){
    const frame=sourceFrame(m),key=m.kind+':'+m.frame;
    if(entry.poses.has(key))return entry.poses.get(key);
    let texture=entry.textures.get(frame);
    if(!texture){
      const w=Math.round(HEIGHT*box.sw/box.sh);
      texture=makeCanvas(w,HEIGHT);const c=texture.getContext('2d');
      c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      c.drawImage(image,box.sx+2,box.sy+2,box.sw-4,box.sh-4,0,0,w,HEIGHT);
      entry.textures.set(frame,texture);
    }
    const w=texture.width,h=texture.height,out=makeCanvas(w+PAD*2,h+PAD*2);
    const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=true;
    const cols=10,rows=18,grid=[];
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const nx=x/cols,ny=y/rows,p=deform(nx,ny,m);
      grid.push({src:{x:nx*w,y:ny*h},dst:{x:p.x*w+PAD,y:p.y*h+PAD}});
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=grid[y*(cols+1)+x],b=grid[y*(cols+1)+x+1],c=grid[(y+1)*(cols+1)+x],d=grid[(y+1)*(cols+1)+x+1];
      triangle(ctx,texture,a.src,b.src,c.src,a.dst,b.dst,c.dst);
      triangle(ctx,texture,b.src,d.src,c.src,b.dst,d.dst,c.dst);
    }
    entry.poses.set(key,out);
    if(entry.poses.size>100){const first=entry.poses.keys().next().value,old=entry.poses.get(first);old.width=old.height=1;entry.poses.delete(first)}
    return out;
  }
  function paint(ctx,id,image,box,m,height){
    const raster=bake(image,box,m,fighterCache(id));
    const ratio=height/HEIGHT;
    ctx.drawImage(raster,-raster.width*ratio/2,-height-PAD*ratio,raster.width*ratio,raster.height*ratio);
  }
  function warm(id,image,getBox){
    const entry=fighterCache(id);
    const jobs=[];
    for(const kind of ['idle','walk','jump','punch','kick']){
      for(let i=0;i<counts[kind];i++){
        const looping=['idle','walk','guard'].includes(kind);
        const m={kind,frame:i,phase:i/(looping?counts[kind]:counts[kind]-1)};
        jobs.push(m);
      }
    }
    let index=0;
    const schedule=callback=>typeof requestIdleCallback==='function'?requestIdleCallback(callback,{timeout:700}):setTimeout(()=>callback({timeRemaining:()=>3}),24);
    function chunk(deadline){
      if(cache.get(id)!==entry)return;
      const start=performance.now();
      while(index<jobs.length){
        const m=jobs[index++];bake(image,getBox(sourceFrame(m)),m,entry);
        if(performance.now()-start>3||deadline.timeRemaining()<2)break;
      }
      if(index<jobs.length)schedule(chunk);
    }
    if(!entry.warming){entry.warming=true;schedule(chunk)}
  }
  window.ProMotion=Object.freeze({motionFor,sourceFrame,paint,warm,deform,
    stats:()=>({fighters:cache.size,poses:[...cache.values()].reduce((n,v)=>n+v.poses.size,0),maxFighters:MAX_FIGHTERS}),
    cycles:Object.freeze({...counts})});
})();
