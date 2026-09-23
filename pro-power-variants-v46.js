/* Três extensões do poder J: baixo+J, cima+J e J no ar. J neutro permanece intacto. */
(()=>{
  'use strict';
  if(window.PowerVariantsV46)return;
  const FAMILY={
    rojo:'blade',perry:'nature',verry:'mud',uiye:'stone',ouip:'poison',lkugh:'moon',knunka:'lightning',dart:'element',jimmy:'lightning',hock:'meteor',vlad:'blood',flame:'fire',atizz:'glitch',klo:'quantum',nine85:'data',laranja:'speed',
    jetde:'repel',xillen:'alien',thuvaa:'ice',ytiri:'chain',grogh:'reflect',trefoh:'nature',yoi:'shadow',grizz:'laser',klopp:'copy',frogh:'copy',
    priya:'bullet',aria:'nature',leo:'portal',tharoth:'shadow',ztaaa:'dark',petros:'stone',kai:'energy',rtess:'magnet'
  };
  const COLORS={blade:'#f87171',nature:'#84ed91',mud:'#a97d58',stone:'#d7a85f',poison:'#85e65f',moon:'#bfa5ff',lightning:'#72bdff',element:'#a9d7ff',meteor:'#ffa44e',blood:'#ed6478',fire:'#ff6b3d',glitch:'#64e5f0',quantum:'#6dffaa',data:'#67e8f9',speed:'#ffab4f',repel:'#7be7ff',alien:'#99f973',ice:'#8cdcff',chain:'#cbd5e1',reflect:'#75d9e6',shadow:'#b086d9',laser:'#ffc75b',copy:'#f29abe',bullet:'#f4d49f',portal:'#73ebc9',dark:'#b579e6',energy:'#a2ddff',scythe:'#ded1bd',hera:'#7ee863',water:'#50cfff',earth:'#d7a85f',air:'#d6f7ff',lava:'#ff8245',heal:'#99f6bc',flight:'#c7d2fe',shock:'#9bbdff',swap:'#c4a8ff',teleport:'#bdacff',drain:'#ef9bbc',gravity:'#a5adfb',magnet:'#ffad65'};
  const LABEL={down:'ONDA RASTEIRA',up:'ASCENSÃO',air:'MERGULHO'};
  const currentFight=()=>{try{return typeof fight!=='undefined'?fight:null}catch(_){return null}};
  const keyDown=(p,code)=>{try{return typeof controlDown==='function'?!!controlDown(p,code):!!window.keys?.[code]}catch(_){return!!window.keys?.[code]}};
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));
  function identity(p){
    if(p.id==='ktrak')return p.ktrakElement||['water','earth','fire','air','lightning','lava','heal'][p.ktrakElementIndex||0]||'water';
    if(p.id==='kain')return p.kainSelectedPower||['flight','ice','heal','shock','repel','swap','fire','teleport','drain','gravity'][p.kainPowerIndex||0]||'flight';
    if(p.id==='jone')return(p.jonePowerIndex||0)%2?'hera':'scythe';
    return FAMILY[p.id]||'energy';
  }
  function mark(target,owner,family,variant){
    if(family==='hera'||family==='poison'){
      if(owner.id==='jone'){target.jonePoisonKind=variant==='down'?'acid':variant==='up'?'corrosive':'deep';target.jonePoisonT=Math.max(target.jonePoisonT||0,variant==='down'?4.2:3.2);target.jonePoisonTick=.08;target.jonePoisonOwner=owner;target.jonePoisonDir=owner.facing||1;target.joneMarkStacks=clamp((target.joneMarkStacks||0)+1,1,3);target.joneMarkT=8}
      else target.poisonT=Math.max(target.poisonT||0,3);
    }
    if(['ice','water'].includes(family))target.freezeT=Math.max(target.freezeT||0,family==='ice'?1.1:.3);
    if(['fire','lava'].includes(family))target.burnT=Math.max(target.burnT||0,2.4);
    if(['mud','nature','shadow','moon','gravity','chain','magnet'].includes(family))target.slowT=Math.max(target.slowT||0,1.3);
    if(['shock','lightning','data','glitch'].includes(family))target.freezeT=Math.max(target.freezeT||0,.32);
    if(family==='swap')target.kainControlSwapT=Math.max(target.kainControlSwapT||0,1.2);
    if(['drain','blood'].includes(family))owner.hp=Math.min(owner.maxHp||owner.hp,owner.hp+(owner.dmg||30)*.14);
  }
  function cast(p,variant,f){
    const family=identity(p),color=COLORS[family]||p.color||COLORS.energy,other=p===f.p1?f.p2:f.p1,dir=p.facing||1;
    p.throwCd=Math.max(p.throwCd||0,variant==='up'?.64:.55);
    p.proStamina=Math.max(0,(p.proStamina??100)-10);
    if(!Array.isArray(f.proVariantFx))f.proVariantFx=[];
    const visual={x:p.x+dir*(variant==='down'?92:variant==='up'?42:60),y:(typeof GROUND_Y!=='undefined'?GROUND_Y:840)-(p.y||0)-(variant==='down'?22:variant==='up'?160:105),r:variant==='down'?110:variant==='up'?85:95,life:.38,maxLife:.38,color,variant,family,label:`${family.toUpperCase()} · ${LABEL[variant]}`,dir};
    f.proVariantFx.push(visual);f.proVariantFx=f.proVariantFx.slice(-12);
    if(family==='heal'){const amount=(p.maxHp||1000)*(variant==='down'?.025:variant==='up'?.018:.012);p.hp=Math.min(p.maxHp||p.hp,p.hp+amount);if(variant==='up'){p.poisonT=0;p.burnT=0;p.freezeT=0}if(variant==='air')p.vy=Math.max(p.vy||0,230);return true}
    if(family==='teleport'&&other?.state!=='ko')p.x=clamp(p.x+dir*(variant==='down'?90:variant==='up'?125:145),35,(typeof W!=='undefined'?W:1600)-35);
    if(family==='flight'&&variant!=='down')p.vy=Math.max(p.vy||0,variant==='up'?500:260);
    if(!other||other.state==='ko')return true;
    const dx=other.x-p.x,dy=(other.y||0)-(p.y||0),reach=variant==='down'?185:variant==='up'?145:185;
    const inFront=dx*dir>=-35,vertical=variant==='down'?Math.abs(dy)<115:variant==='up'?dy>-45&&dy<250:dy<80&&dy>-300;
    if(Math.abs(dx)>reach||!inFront||!vertical)return true;
    const count=p.id==='laranja'&&variant==='down'?3:p.id==='laranja'&&variant==='air'?2:1,scale=variant==='down'?.62:variant==='up'?.88:.76;
    for(let i=0;i<count;i++){try{damage(other,(p.dmg||30)*scale/count,{owner:p,color,proKind:'variant-'+variant},dir,'pro-variant-'+family)}catch(err){console.warn('[VARIANTE J]',err);break}}
    mark(other,p,family,variant);
    if(variant==='up')other.vy=Math.max(other.vy||0,430);
    else if(variant==='air')other.vy=Math.min(other.vy||0,-240);
    else other.x=clamp(other.x+dir*45,20,(typeof W!=='undefined'?W:1600)-20);
    try{SFX?.play?.(p.id==='laranja'?'attack_light':'attack_heavy',.42)}catch(_){}
    return true;
  }
  const previousInput=window.playerInput;
  if(typeof previousInput==='function')window.playerInput=function(p){
    const f=currentFight();if(f&&p?.human&&!f.paused&&!f.over&&!(f.mode==='lan'&&window.__lan?.role==='guest')){
      const p2=p.playerSlot==='p2',attack=p2?'Numpad1':'KeyJ',down=p2?'ArrowDown':'KeyS',up=p2?'ArrowUp':'KeyW';
      if(window.justPressed?.[attack]){const variant=keyDown(p,down)?'down':keyDown(p,up)?'up':!p.onGround?'air':null;
        if(variant&&p.state!=='ko'&&p.state!=='hurt'&&p.state!=='special'&&p.state!=='throw'&&(p.throwCd||0)<=0&&(p.attackDisabledT||0)<=0&&!p.proMove&&!p.laranjaCombo&&!p.laranjaFlash){window.justPressed[attack]=false;cast(p,variant,f)}
      }
    }
    return previousInput.apply(this,arguments);
  };
  const previousUpdate=window.update;
  if(typeof previousUpdate==='function')window.update=function(f,dt){const r=previousUpdate.apply(this,arguments);if(f?.proVariantFx&&!f.paused){for(const v of f.proVariantFx)v.life-=Math.max(0,Number(dt)||0);f.proVariantFx=f.proVariantFx.filter(v=>v.life>0)}return r};
  const previousDraw=window.draw;
  if(typeof previousDraw==='function')window.draw=function(f){const r=previousDraw.apply(this,arguments);if(!f?.proVariantFx?.length)return r;const c=canvas.getContext('2d');for(const v of f.proVariantFx){const alpha=clamp(v.life/(v.maxLife||.38),0,1);c.save();c.globalAlpha=alpha*.7;c.strokeStyle=v.color;c.fillStyle=v.color;c.lineWidth=v.family==='scythe'?8:5;c.shadowBlur=16;c.shadowColor=v.color;c.translate(v.x,v.y);if(v.family==='scythe'){c.beginPath();c.arc(0,0,v.r,-1.2,1.4,v.dir<0);c.stroke()}else if(v.variant==='down'){c.beginPath();c.ellipse(0,0,v.r,24,0,0,Math.PI*2);c.stroke();c.globalAlpha=alpha*.12;c.fill()}else if(v.variant==='up'){for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*30,45);c.quadraticCurveTo(i*18,-50,i*25,-v.r);c.stroke()}}else{c.beginPath();c.moveTo(-v.r*.6,-v.r*.6);c.lineTo(0,v.r*.7);c.lineTo(v.r*.6,-v.r*.6);c.stroke()}c.restore()}return r};
  window.PowerVariantsV46=Object.freeze({version:'46.0.0',identity});
})();
