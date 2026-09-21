/* Ultimate systems layered over the original LUTADOR game without replacing its combat. */
(()=>{'use strict';
  const KEY='lutador-ultimate-v2', clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const palettes={original:'none',carmesim:'hue-rotate(335deg) saturate(1.18)',neon:'hue-rotate(115deg) saturate(1.25)',gelo:'hue-rotate(170deg) saturate(1.15) brightness(1.12)',ouro:'sepia(.7) saturate(1.8) hue-rotate(340deg) brightness(1.08)'};
  const defaultData=()=>({cosmetics:{},settings:{blood:false,shake:true,graphics:'balanced',scale:'100',fps:false},records:{finishers:0,bestDamage:0,fighterWins:{},storySeen:{}}});
  let data;try{data={...defaultData(),...JSON.parse(localStorage.getItem(KEY)||'{}')};data.settings={...defaultData().settings,...data.settings};data.records={...defaultData().records,...data.records}}catch(e){data=defaultData()}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
  const fgame=()=>typeof fight!=='undefined'?fight:null;
  // Sem customização visual: todos os lutadores usam o design oficial.
  function cosmetic(id){return {skin:'original',accessory:'none'}}
  function addStage(id,name,icon,desc,colors,path,hazard){
    if(typeof STAGES!=='undefined'&&!STAGES.some(s=>s.id===id))STAGES.push({id,name,icon,desc,...colors});
    if(typeof HAZARD_BY_STAGE!=='undefined')HAZARD_BY_STAGE[id]=hazard;
    // As arenas usam a direção de arte nativa do jogo, sem selo ou imagem de IA.
  }
  addStage('tempestade','Cobertura Tempestade','🌧️','Chuva elétrica e correntes de vento.',{top:'#071126',bottom:'#1c2557',floor:'#26345d',accent:'#41d9ff'},'lutador-assets/cobertura-tempestade-ai.png',{name:'RAIOS',icon:'⚡',color:'#66e9ff'});
  addStage('coliseu','Coliseu de Obsidiana','💎','Cristais arcanos e lava nas bordas.',{top:'#130c23',bottom:'#47204b',floor:'#462c45',accent:'#c38cff'},'lutador-assets/coliseu-obisidiana-ai.png',{name:'LAVA ARCANA',icon:'🔥',color:'#c68aff'});
  const oldStage=window.renderStageSelect;
  function stageSpin(playerId,mode,player2Id){const overlay=document.createElement('div');overlay.className='stage-spin';overlay.innerHTML='<div class="stage-spin-card"><small>DESTINO DA ARENA</small><div class="stage-spin-icons">🏯 🌋 ❄️ ⚡ 💎</div><h2>SORTEANDO FASE...</h2><p>Os perigos da arena também entram no combate.</p></div>';document.body.appendChild(overlay);const title=overlay.querySelector('h2'),pool=STAGES.slice();let n=0;const ticker=setInterval(()=>{const st=pool[n++%pool.length];title.textContent=st.icon+' '+st.name},105);setTimeout(()=>{clearInterval(ticker);const chosen=pool[Math.floor(Math.random()*pool.length)];title.textContent=chosen.icon+' '+chosen.name;overlay.querySelector('.stage-spin-icons').style.animation='none';setTimeout(()=>{overlay.remove();if(mode==='chaos')renderChaosRoulette(playerId,player2Id,chosen.id);else startFight(playerId,mode,player2Id,chosen.id)},620)},1850)}
  if(oldStage)window.renderStageSelect=function(...args){const r=oldStage.apply(this,args);const subtitle=document.querySelector('.stage-screen .select-subtitle');if(subtitle)subtitle.textContent='Escolha uma das '+STAGES.length+' arenas, cada uma com seu perigo exclusivo.';const random=document.querySelector('#stage-random');if(random){random.onclick=()=>stageSpin(args[0],args[1]||'cpu',args[2]||null);random.querySelector('p').textContent='Gira entre todas as arenas e revela uma fase.'}return r};

  function createDialog(kind,title){let d=document.querySelector('.ultimate-dialog[data-kind="'+kind+'"]');if(!d){d=document.createElement('dialog');d.className='ultimate-dialog';d.dataset.kind=kind;document.body.appendChild(d)}d.innerHTML=`<header><h2>${title}</h2><button class="ultimate-close" aria-label="Fechar">×</button></header><div class="ultimate-body"></div>`;d.querySelector('.ultimate-close').onclick=()=>d.close();return d}
  function showCosmetics(){const d=createDialog('cosmetics','PERSONALIZAR LUTADORES');const body=d.querySelector('.ultimate-body');let selected=CHARACTERS[0]?.id||'rojo';const render=()=>{const c=cosmetic(selected);body.innerHTML=`<p>Escolha um lutador, aplique uma cor e um acessório. A aparência entra diretamente na luta.</p><div class="ultimate-grid">${CHARACTERS.map(x=>`<button class="ultimate-fighter ${x.id===selected?'selected':''}" data-id="${x.id}"><span>${letterFace(x)}</span><b>${x.name}</b></button>`).join('')}</div><h3>SKIN / COR</h3><div class="ultimate-swatches">${Object.keys(palettes).map(k=>`<button title="${k}" data-skin="${k}" class="ultimate-swatch ${c.skin===k?'active':''}" style="background:${k==='original'?'linear-gradient(135deg,#edf3ff,#486898)':k==='carmesim'?'#e74864':k==='neon'?'#42d98c':k==='gelo'?'#5cccf3':'#e9bd49'}"></button>`).join('')}</div><h3>ACESSÓRIO</h3><div class="ultimate-accessories">${[['none','Sem acessório'],['crown','👑 Coroa'],['visor','🕶️ Visor'],['flames','🔥 Aura de chamas']].map(a=>`<button class="ultimate-accessory ${c.accessory===a[0]?'active':''}" data-accessory="${a[0]}">${a[1]}</button>`).join('')}</div><button class="btn big ultimate-save" id="ultimate-save">✓ SALVAR VISUAL</button>`;body.querySelectorAll('.ultimate-fighter').forEach(b=>b.onclick=()=>{selected=b.dataset.id;render()});body.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{data.cosmetics[selected]={...cosmetic(selected),skin:b.dataset.skin};save();render()});body.querySelectorAll('[data-accessory]').forEach(b=>b.onclick=()=>{data.cosmetics[selected]={...cosmetic(selected),accessory:b.dataset.accessory};save();render()});body.querySelector('#ultimate-save').onclick=()=>d.close()};render();d.showModal()}
  let fpsNode=null,fpsHandle=0,fpsFrames=0,fpsSince=performance.now();
  function fpsCounterNode(){
    if(fpsNode&&document.body.contains(fpsNode)) return fpsNode;
    fpsNode=document.createElement('div');
    fpsNode.className='ultimate-fps-counter';
    fpsNode.innerHTML='<span>FPS</span><b>--</b><i>DESEMPENHO</i>';
    document.body.appendChild(fpsNode);
    return fpsNode;
  }
  function runFpsCounter(){
    if(fpsHandle||!data.settings.fps) return;
    const node=fpsCounterNode();
    fpsFrames=0;fpsSince=performance.now();
    const tick=(now)=>{
      fpsFrames++;
      const elapsed=now-fpsSince;
      if(elapsed>=500){
        const value=Math.max(0,Math.round((fpsFrames*1000)/elapsed));
        node.querySelector('b').textContent=String(value);
        node.dataset.level=value>=55?'good':value>=35?'mid':'low';
        fpsFrames=0;fpsSince=now;
      }
      if(data.settings.fps) fpsHandle=requestAnimationFrame(tick); else fpsHandle=0;
    };
    fpsHandle=requestAnimationFrame(tick);
  }
  function setFpsEnabled(enabled){
    data.settings.fps=!!enabled;
    const node=fpsCounterNode();
    node.classList.toggle('visible',data.settings.fps);
    if(data.settings.fps) runFpsCounter();
    save();
  }
  setTimeout(()=>{
    document.documentElement.style.setProperty('--ultimate-scale',(data.settings.scale||'100')+'%');
    document.documentElement.dataset.graphics=data.settings.graphics||'balanced';
    setFpsEnabled(!!data.settings.fps);
  },0);
  function showSettings(){
    const d=createDialog('settings','CONFIGURAÇÕES');
    const s=data.settings,b=d.querySelector('.ultimate-body');
    const audio=window.ProAudio?.getSettings?.()||{master:.9,effects:.9,music:.55,ambience:false,muted:false};
    b.innerHTML=`
      <div class="settings-hero"><span class="settings-kicker">SISTEMA / PREFERÊNCIAS</span><h3>Personalize sua arena</h3><p>Vídeo, HUD, combate e áudio em um painel mais rápido. As alterações ficam salvas neste navegador.</p></div>
      <div class="ultimate-settings settings-grid">
        <section class="ultimate-setting settings-panel settings-video">
          <div class="settings-panel-head"><span class="settings-panel-icon">◫</span><div><h3>VÍDEO & HUD</h3><p>Exibição, qualidade e monitor de FPS.</p></div></div>
          <label class="settings-select-row"><span><b>Escala de exibição</b><small>Ajuste o tamanho da interface</small></span><select id="ult-scale"><option value="100">100% · recomendado</option><option value="90">90% · mais espaço</option><option value="80">80% · desempenho</option></select></label>
          <label class="settings-select-row"><span><b>Qualidade gráfica</b><small>Priorize visual ou desempenho</small></span><select id="ult-graphics"><option value="high">Alto</option><option value="balanced">Equilibrado</option><option value="performance">Desempenho</option></select></label>
          <label class="settings-switch-row settings-fps-row"><span><b>Ativar FPS</b><small>Mostra o contador de quadros por segundo na tela</small></span><span class="settings-toggle"><input id="ult-fps" type="checkbox"><i></i></span></label>
          <button class="btn settings-fullscreen" id="ult-fullscreen">⛶ ATIVAR TELA CHEIA</button>
        </section>
        <section class="ultimate-setting settings-panel settings-audio">
          <div class="settings-panel-head"><span class="settings-panel-icon">♫</span><div><h3>ÁUDIO</h3><p>Controle cada camada do som.</p></div></div>
          <label class="settings-audio-row"><span><b>Volume geral</b></span><input id="ult-master" type="range" min="0" max="100" value="${Math.round(audio.master*100)}"><b class="settings-audio-value" id="ult-master-value">${Math.round(audio.master*100)}%</b></label>
          <label class="settings-audio-row"><span><b>Efeitos de combate</b></span><input id="ult-effects" type="range" min="0" max="100" value="${Math.round(audio.effects*100)}"><b class="settings-audio-value" id="ult-effects-value">${Math.round(audio.effects*100)}%</b></label>
          <label class="settings-audio-row"><span><b>Música e ambiente</b></span><input id="ult-music" type="range" min="0" max="100" value="${Math.round(audio.music*100)}"><b class="settings-audio-value" id="ult-music-value">${Math.round(audio.music*100)}%</b></label>
          <label class="settings-switch-row"><span><b>Ambiente musical</b><small>Ativa a trilha e a ambiência do jogo</small></span><span class="settings-toggle"><input id="ult-ambience" type="checkbox" ${audio.ambience?'checked':''}><i></i></span></label>
          <label class="settings-switch-row"><span><b>Silenciar tudo</b><small>Desliga todos os canais de áudio</small></span><span class="settings-toggle danger"><input id="ult-muted" type="checkbox" ${audio.muted?'checked':''}><i></i></span></label>
        </section>
        <section class="ultimate-setting settings-panel settings-combat">
          <div class="settings-panel-head"><span class="settings-panel-icon">⚔</span><div><h3>COMBATE</h3><p>Efeitos visuais durante as lutas.</p></div></div>
          <label class="settings-switch-row"><span><b>Tremor de câmera</b><small>Impacto extra em golpes fortes</small></span><span class="settings-toggle"><input id="ult-shake" type="checkbox"><i></i></span></label>
          <label class="settings-switch-row"><span><b>Sangue estilizado</b><small>Partículas visuais de impacto</small></span><span class="settings-toggle"><input id="ult-blood" type="checkbox"><i></i></span></label>
          <div class="settings-performance-note"><span>●</span><div><b>DICA DE DESEMPENHO</b><small>Use 80% + modo Desempenho se o FPS ficar abaixo de 35.</small></div></div>
        </section>
      </div>
      <div class="ultimate-controls settings-controls"><div><b>CONTROLES P1</b><span>A/D mover · W pular · Q esquiva · J poder · I soco · O chute · G gancho · K defesa · L ultimate</span></div><div><b>CONTROLES P2</b><span>Setas mover/pular · Num 0 esquiva · Num 1 poder · Num 5 soco · Num 6 chute · Num 4 gancho · Num 2 defesa · Num 3 ultimate</span></div></div>`;
    b.querySelector('#ult-scale').value=s.scale;
    b.querySelector('#ult-graphics').value=s.graphics;
    b.querySelector('#ult-shake').checked=s.shake;
    b.querySelector('#ult-blood').checked=s.blood;
    b.querySelector('#ult-fps').checked=!!s.fps;
    const commit=()=>{
      s.scale=b.querySelector('#ult-scale').value;
      s.graphics=b.querySelector('#ult-graphics').value;
      s.shake=b.querySelector('#ult-shake').checked;
      s.blood=b.querySelector('#ult-blood').checked;
      s.fps=b.querySelector('#ult-fps').checked;
      document.documentElement.style.setProperty('--ultimate-scale',s.scale+'%');
      document.documentElement.dataset.graphics=s.graphics;
      setFpsEnabled(s.fps);
      save();
    };
    const syncAudio=(key,id)=>{const input=b.querySelector(id),value=b.querySelector(id+'-value');input.addEventListener('input',()=>{const v=Number(input.value)/100;window.ProAudio?.setSettings?.({[key]:v});if(value)value.textContent=input.value+'%'})};
    syncAudio('master','#ult-master');syncAudio('effects','#ult-effects');syncAudio('music','#ult-music');
    b.querySelector('#ult-ambience').onchange=e=>window.ProAudio?.setSettings?.({ambience:e.target.checked});
    b.querySelector('#ult-muted').onchange=e=>window.ProAudio?.setSettings?.({muted:e.target.checked});
    b.querySelectorAll('#ult-scale,#ult-graphics,#ult-shake,#ult-blood,#ult-fps').forEach(x=>x.onchange=commit);
    b.querySelector('#ult-fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.()}catch(_){}};
    commit();
    d.showModal();
  }
  function addActions(){}
  const observer=new MutationObserver(()=>addActions());observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(addActions,100);

  const oldFighter=window.drawFighter;
  if(oldFighter)window.drawFighter=function(ctx,p){const c=cosmetic(p.id);ctx.save();if(c.skin!=='original')ctx.filter=palettes[c.skin];const r=oldFighter.apply(this,arguments);ctx.restore();const y=typeof GROUND_Y!=='undefined'?GROUND_Y-(p.y||0)-175:600;if(c.accessory==='crown'){ctx.save();ctx.translate(p.x,y);ctx.scale(p.facing||1,1);ctx.fillStyle='#f8cf4d';ctx.strokeStyle='#fff0a1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-22,10);ctx.lineTo(-20,-10);ctx.lineTo(-8,0);ctx.lineTo(0,-17);ctx.lineTo(10,0);ctx.lineTo(22,-10);ctx.lineTo(20,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}else if(c.accessory==='visor'){ctx.save();ctx.translate(p.x,y+30);ctx.fillStyle='#42e8ffcc';ctx.fillRect(-29,-6,58,12);ctx.strokeStyle='#fff';ctx.strokeRect(-29,-6,58,12);ctx.restore()}else if(c.accessory==='flames'){ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle='#ff7038';ctx.lineWidth=4;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(p.x,y+80,65+Math.sin(performance.now()/75)*8,0,Math.PI*2);ctx.stroke();ctx.restore()}return r};
  let shake=0,particles=[];
  const oldDamage=window.damage;
  if(oldDamage)window.damage=function(victim,amount,src,dir,type){const hp=victim?.hp||0,r=oldDamage.apply(this,arguments),dealt=Math.max(0,hp-(victim?.hp||0)),f=fgame();if(dealt>0&&f){data.records.bestDamage=Math.max(data.records.bestDamage,dealt);if(data.settings.shake)shake=Math.min(13,shake+Math.min(8,2+dealt*.12));if(data.settings.blood&&type!=='hazard'){for(let i=0;i<Math.min(12,3+Math.round(dealt));i++)particles.push({x:victim.x,y:(typeof bodyY==='function'?bodyY(victim):650),vx:(Math.random()-.5)*260,vy:-Math.random()*210,life:.35+Math.random()*.35})}if(victim.hp<=0&&src){data.records.finishers++;save()}}return r};
  const oldUpdate=window.update;
  if(oldUpdate)window.update=function(f,dt){const r=oldUpdate.apply(this,arguments);const time=Math.min(.08,Math.max(0,dt||0));shake=Math.max(0,shake-time*35);particles.forEach(p=>{p.life-=time;p.x+=p.vx*time;p.y+=p.vy*time;p.vy+=550*time});particles=particles.filter(p=>p.life>0);if(f){for(const p of [f.p1,f.p2]){p.victoryPoseT=Math.max(0,(p.victoryPoseT||0)-time);p.defeatPoseT=Math.max(0,(p.defeatPoseT||0)-time)}}if(f?.p2&&f.mode!=='pvp'&&!f.proTraining){const style=({rojo:'aggressive',knunka:'zoner',nine85:'trickster',rtess:'defensive',vlad:'aggressive',dart:'zoner',frogh:'aggressive',ztaaa:'boss'})[f.p2.id]||'balanced',p=f.p2,opp=f.p1,dist=Math.abs(p.x-opp.x);p.aiStyle=style;if(style==='zoner'&&dist<190&&p.state==='idle')p.vx=-p.facing*p.speed*.65;if(style==='defensive'&&opp.state==='throw'&&dist<220){p.defend=true;p.state='defend'}if(style==='aggressive'&&dist>240&&p.state==='idle')p.vx=p.facing*p.speed*1.25}return r};
  const oldDraw=window.draw;
  if(oldDraw)window.draw=function(f){const r=oldDraw.apply(this,arguments),ctx=canvas?.getContext('2d');if(ctx){if(shake&&data.settings.shake){canvas.style.transform=`translate(${(Math.random()-.5)*shake}px,${(Math.random()-.5)*shake}px)`}else canvas.style.transform='';ctx.save();for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle='#d9253f';ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill()}ctx.restore()}return r};
  const oldEnd=window.endRound;
  if(oldEnd)window.endRound=function(f,winner,loser){if(f&&winner===f.p1){data.records.fighterWins[winner.id]=(data.records.fighterWins[winner.id]||0)+1;save();winner.victoryPoseT=1.8}if(loser)loser.defeatPoseT=1.8;return oldEnd.apply(this,arguments)};
  const storyScenes=[['O REFÚGIO VERMELHO','Rojo desperta sob as ruínas de um abrigo queimado. A marca em sua lâmina reage quando Nine85 invade os arquivos do Refúgio.','Nine85','Se quer respostas, terá de sobreviver ao primeiro guardião.'],['SINAL NO ESCURO','O ataque deixou um rastro elétrico. Knunka afirma que alguém está usando os refúgios como laboratórios.','Knunka','Eu não confio em você, Rojo. Mas o inimigo também quer me silenciar.'],['A PEDRA LEMBRA','Uiye protege uma passagem subterrânea. Ele sabe que a energia de Rojo foi criada para fechar, não abrir, portais.','Uiye','Mostre que controla essa força antes que ela controle você.'],['O CÓDIGO PARTIDO','Rtess decifra um mapa para o próximo abrigo, mas Atizz corrompe o sinal e transforma aliados em rivais.','Atizz','A verdade não está no mapa. Está no que Rojo esqueceu.'],['SENTINELA','Grizz guarda o portão do segundo Refúgio e só entrega a chave a quem luta por pessoas, não por poder.','Grizz','A Arena não precisa de outro tirano. Prove seu propósito.'],['MARÉ ÁCIDA','Ouip encontra sobreviventes presos. O resgate falha quando a contaminação toma o corredor de saída.','Ouip','Eu seguro a maré. Você abre o caminho.'],['CÉU QUEBRADO','Jetde vê a tempestade sobre a cidade e revela que os portais drenam a energia dos Refúgios.','Jetde','Se o núcleo cair, não haverá lugar para voltar.'],['A PORTA ASTRAL','Xillen bloqueia a rota final para impedir que Rojo repita um erro que ninguém consegue explicar.','Xillen','Você já atravessou esta porta uma vez. E o mundo quase acabou.'],['A LUA SILENCIOSA','Lkugh conduz Rojo por túneis antigos. Uma voz chama pelo nome de Rojo do outro lado da pedra.','Lkugh','Não responda à voz. Ela sabe usar suas memórias contra você.'],['O PESO DO PASSADO','Grogh encontra registros: Rojo foi criado para carregar a Chave Rubra, capaz de selar o portal central.','Grogh','Carregar a chave não faz de você um herói. Escolher usá-la, sim.'],['VENTO DE CINZAS','Dart protege civis no deserto. O núcleo inimigo envia caçadores para apagar qualquer testemunha.','Dart','Corra comigo ou lute comigo. Só não deixe ninguém para trás.'],['AREIA E MEMÓRIA','Yoi mostra a entrada do último Refúgio. Lá dentro, Rojo encontra uma mensagem deixada por si mesmo.','Yoi','A mensagem diz: não confie na vitória fácil.'],['A CHAVE QUÂNTICA','Klo segura a porta do núcleo. Para ativá-la, Rojo precisa aceitar que seus poderes têm um preço.','Kl,o','Toda chave abre algo. A questão é o que você vai deixar entrar.'],['QUEBRA-LUAS','Hock vigia a câmara lunar. Ele luta para testar se Rojo merece carregar a decisão final.','Hock','Se sua vontade quebrar, o Refúgio quebra junto.'],['SANGUE DO REFÚGIO','Vlad revela que a energia roubada corre como sangue pelos portais. Ele oferece uma aliança perigosa.','Vlad','Eu conheço monstros, Rojo. Não se torne um para me vencer.'],['O ESPELHO','Klopp imita os poderes de Rojo e mostra a visão de uma Arena dominada pela Chave Rubra.','Klopp','Não sou seu inimigo. Sou o resultado da sua pior escolha.'],['O ARQUITETO','Ztaaa assume o controle dos portais: ele criou a crise para forçar Rojo a abrir o núcleo.','Ztaaa','Abra a porta, Rojo. Ou veja cada Refúgio desaparecer.'],['ÚLTIMO REFÚGIO','Frogh guarda a fonte viva do mundo. A luta final decide se a energia será selada ou explorada.','Frogh','A força que protege também pode destruir. Escolha quem você será.'],['SEGREDOS DE ROJO','Com os Refúgios seguros, Rojo sela a Chave Rubra. A Arena sobrevive — mas uma luz nova aparece no horizonte.','Rojo','A história não acabou. Ela só encontrou um novo começo.']];
  const oldStory=window.startStory;
  if(oldStory)window.startStory=function(id){const index=(typeof state!=='undefined'?(state.storyProgress||0):0),scene=storyScenes[index]||storyScenes[storyScenes.length-1],enemy=CHARACTERS.find(x=>x.name===scene[2]);const d=createDialog('story','MODO HISTÓRIA · '+(index+1)+' / '+STORY_SEQUENCE.length);d.classList.add('ultimate-story-dialog');d.querySelector('.ultimate-body').innerHTML=`<span class="story-speaker">${scene[0]}</span><div class="story-line">${scene[1]}</div><div class="story-line"><b>${scene[2]}:</b> “${scene[3]}”</div><button class="btn big" id="story-enter">⚔ ENTRAR NA LUTA</button>`;d.querySelector('#story-enter').onclick=()=>{d.close();showCinematic('CAPÍTULO '+(index+1),enemy?enemy.name+' aceita o desafio.':'O desafio começa.',!!enemy?.boss);oldStory.call(this,id)};d.showModal()};
  function showCinematic(kicker,title,boss){const el=document.createElement('div');el.className='ultimate-cinematic'+(boss?' boss':'');el.innerHTML=`<div class="ultimate-cinematic-card"><small>${kicker}</small><h1>${title}</h1><p>Uma nova rivalidade começa agora.</p><i>Prepare-se para lutar</i></div>`;document.body.appendChild(el);setTimeout(()=>el.remove(),1800)}
  const oldRank=window.renderRanking;
  if(oldRank)window.renderRanking=function(){const r=oldRank.apply(this,arguments),card=document.querySelector('.card');if(card){const rec=data.records,top=Object.entries(rec.fighterWins).sort((a,b)=>b[1]-a[1])[0],name=CHARACTERS.find(c=>c.id===top?.[0])?.name||'—';const extra=document.createElement('section');extra.innerHTML=`<div class="ultimate-rank-grid"><div><b>FINALIZAÇÕES</b><strong>${rec.finishers||0}</strong></div><div><b>MAIOR DANO</b><strong>${Math.round(rec.bestDamage||0)}</strong></div><div><b>LUTADOR FAVORITO</b><strong>${name}</strong></div><div><b>VITÓRIAS FAVORITAS</b><strong>${top?.[1]||0}</strong></div></div><div class="ultimate-records"><b>RECORDES LOCAIS</b><br>Seu ranking, histórico de finalizações e vitórias por personagem ficam salvos apenas neste navegador.</div>`;card.insertBefore(extra,card.querySelector('#rank-reset')?.parentElement||null)}return r};
  const oldTournament=window.renderTournamentSelect;
  if(oldTournament)window.renderTournamentSelect=function(){const r=oldTournament.apply(this,arguments);const card=document.querySelector('.tournament-screen');if(card&&!card.querySelector('.ultimate-tournament')){const e=document.createElement('div');e.className='ultimate-tournament';e.innerHTML='⚔ <b>TORNEIO PLUS</b> · Chave de 8 lutadores, adversários sem repetição e recompensa de campeão.<button class="btn" id="ult-turbo-tour">FORMATO RÁPIDO</button>';card.querySelector('.tournament-grid')?.after(e);e.querySelector('#ult-turbo-tour').onclick=()=>{e.innerHTML='⚡ FORMATO RÁPIDO ATIVO · lutas com ritmo acelerado e chave aleatória.';window.ultimateTournamentTurbo=true}}return r};
  const titleShop=[['Novato da Arena',450,'bronze'],['Punho de Ferro',650,'bronze'],['Caçador de Vitórias',800,'bronze'],['Guardião Carmesim',900,'bronze'],['Lâmina Veloz',1100,'prata'],['Senhor do Dojo',1250,'prata'],['Tempestade Neon',1400,'prata'],['Lenda da Cobertura',1450,'prata'],['Mestre do Gelo',1600,'prata'],['Viajante Cósmico',1800,'prata'],['Mestre da Obsidiana',2100,'ouro'],['Rei da Roleta',2800,'ouro'],['Quebra-Luas',3000,'ouro'],['Vampiro Rubro',3300,'ouro'],['Campeão da Arena',3600,'ouro'],['Soberano dos Refúgios',4200,'platina'],['Lenda Imortal',4800,'platina'],['Guardião Supremo',5400,'platina'],['Mito do Kombate',6200,'platina'],['Rei dos Lutadores',7500,'platina']];
  function openTitleShop(){const d=createDialog('titles','COLEÇÃO DE 20 TÍTULOS');const b=d.querySelector('.ultimate-body'),snap=window.ProProgression?.getSnapshot?.(),owned=snap?.data?.titles||[];b.innerHTML=`<p>Compre títulos com Gold e equipe-os no Passe. Títulos de temporada e do fim da campanha são ganhos jogando.</p><div class="ultimate-title-grid">${titleShop.map(([name,cost,rarity],i)=>`<article class="ultimate-title-card ${rarity} ${owned.includes(name)?'owned':''}"><i>${['✦','◆','♛','✹'][i%4]}</i><small>${rarity.toUpperCase()}</small><b>${name}</b><span>${owned.includes(name)?'✓ ADQUIRIDO':`◈ ${cost.toLocaleString('pt-BR')} GOLD`}</span><button class="btn" data-title="${name}" data-cost="${cost}" ${owned.includes(name)?'disabled':''}>${owned.includes(name)?'NA COLEÇÃO':'COMPRAR'}</button></article>`).join('')}</div>`;b.querySelectorAll('[data-title]').forEach(btn=>btn.onclick=()=>{if(window.ProProgression?.buyTitle(btn.dataset.title,Number(btn.dataset.cost))){d.close();setTimeout(openTitleShop,0)}else{btn.textContent='GOLD INSUFICIENTE'}});d.showModal()}
  const baseShop=window.renderShop;
  if(baseShop)window.renderShop=function(){const r=baseShop.apply(this,arguments);const actions=document.querySelector('.shop .lobby-actions');if(actions&&!actions.querySelector('#ultimate-title-shop')){const b=document.createElement('button');b.className='btn big';b.id='ultimate-title-shop';b.textContent='🏷️ TÍTULOS';actions.appendChild(b);b.onclick=openTitleShop}return r};
  const baseAdvance=window.advanceStoryAfterWin;
  if(baseAdvance)window.advanceStoryAfterWin=function(){const r=baseAdvance.apply(this,arguments);setTimeout(()=>{if(typeof state!=='undefined'&&state.storyComplete)window.ProProgression?.grantTitle?.('Guardião dos Refúgios')},850);return r};
  // Todo capítulo abre seu roteiro antes do combate.
  window.startStory=function(id){const index=(typeof state!=='undefined'?(state.storyProgress||0):0),scene=storyScenes[index]||storyScenes[storyScenes.length-1],enemy=CHARACTERS.find(x=>x.name===scene[2]);const d=createDialog('story','MODO HISTÓRIA · CAPÍTULO '+(index+1)+' / '+STORY_SEQUENCE.length);d.classList.add('ultimate-story-dialog');d.querySelector('.ultimate-body').innerHTML=`<span class="story-speaker">${scene[0]}</span><div class="story-line">${scene[1]}</div><div class="story-line"><b>${scene[2]}:</b> “${scene[3]}”</div><button class="btn big" id="story-enter">⚔ ENTRAR NA LUTA</button>`;d.querySelector('#story-enter').onclick=()=>{d.close();showCinematic('CAPÍTULO '+(index+1),enemy?enemy.name+' aceita o desafio.':'O desafio começa.',!!enemy?.boss);oldStory.call(this,id)};d.showModal()};
  window.renderStageSelect=function(...args){const result=oldStage.apply(this,args);const subtitle=document.querySelector('.stage-screen .select-subtitle');if(subtitle)subtitle.textContent='Escolha uma das '+STAGES.length+' arenas, cada uma com seu perigo exclusivo.';return result};
  window.LutadorUltimate=Object.freeze({version:'3.3-stable',data,openSettings:showSettings,openTitleShop});
})();
