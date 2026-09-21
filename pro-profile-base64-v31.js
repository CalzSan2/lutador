/* SORTEP NIAK — PERFIL / LOGIN + CÓDIGO BASE64 V31
 * Conta local com usuário/senha e código de transferência do progresso.
 * Não envia senha nem dados para servidor: o código transporta o save para outra instalação/navegador.
 */
(()=>{
  'use strict';
  if(window.LutadorProfileV31)return;
  const ACTIVE='lutador-profile-v31-active';
  const PREFIX='lutador-profile-v31-account:';
  const ITER=120000;
  const enc=new TextEncoder(), dec=new TextDecoder();
  const $=(s,r=document)=>r.querySelector(s);
  const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const bytesToB64u=bytes=>{let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  const b64uToBytes=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out};
  const jsonToCode=o=>bytesToB64u(enc.encode(JSON.stringify(o)));
  const codeToJson=s=>JSON.parse(dec.decode(b64uToBytes(String(s||'').replace(/\s+/g,''))));
  const randomSalt=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return bytesToB64u(b)};
  async function passHash(password,salt){
    if(crypto?.subtle){
      const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
      const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:b64uToBytes(salt),iterations:ITER,hash:'SHA-256'},key,256);
      return bytesToB64u(new Uint8Array(bits));
    }
    // fallback only for older/local browsers
    let h=2166136261;const str=salt+'|'+password;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36);
  }
  function isProfileKey(k){return k===ACTIVE||String(k).startsWith(PREFIX)}
  function collect(){
    const items={};
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||isProfileKey(k))continue;const v=localStorage.getItem(k);if(v!=null)items[k]=v}}catch(_){ }
    return items;
  }
  function saveAccount(acc){localStorage.setItem(PREFIX+acc.user.toLowerCase(),JSON.stringify(acc));localStorage.setItem(ACTIVE,acc.user)}
  function readAccount(user){try{return JSON.parse(localStorage.getItem(PREFIX+String(user).trim().toLowerCase())||'null')}catch(_){return null}}
  function clearGameKeys(){
    const keys=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&!isProfileKey(k)&&/^(lutador|sortep|pro[-_.]|v\d|ravam|mk[-_.]|fighter|arena)/i.test(k))keys.push(k)}}catch(_){ }
    keys.forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
  }
  function applyItems(items){clearGameKeys();for(const [k,v] of Object.entries(items||{})){if(!isProfileKey(k))try{localStorage.setItem(k,String(v))}catch(_){}}}
  function css(){
    if($('#profile-v31-style'))return;
    const s=document.createElement('style');s.id='profile-v31-style';s.textContent=`
    #profile-v31-overlay{position:fixed;inset:0;z-index:100500;display:grid;place-items:center;padding:18px;background:rgba(2,5,14,.82);backdrop-filter:blur(8px);font-family:Oxanium,system-ui,sans-serif;color:#eaf4ff}
    #profile-v31-overlay *{box-sizing:border-box}.profile-v31-card{width:min(720px,96vw);max-height:92vh;overflow:auto;border:1px solid #2d5c78;border-radius:22px;padding:22px;background:linear-gradient(145deg,#07111d,#0c1728 58%,#090b14);box-shadow:0 35px 100px #000c,inset 0 1px #ffffff12}
    .profile-v31-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.profile-v31-head small{color:#5eead4;font-weight:900;letter-spacing:2px}.profile-v31-head h2{margin:4px 0;font-size:30px}.profile-v31-head p{margin:5px 0 15px;color:#90a4bd;font-size:12px;line-height:1.5}.profile-v31-close{border:0;background:#ffffff10;color:#fff;width:40px;height:40px;border-radius:12px;cursor:pointer;font-size:20px}
    .profile-v31-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.profile-v31-field{display:grid;gap:6px}.profile-v31-field label{font-size:10px;color:#8aa0b8;font-weight:900;letter-spacing:1px}.profile-v31-field input,.profile-v31-field textarea{width:100%;border:1px solid #27435e;border-radius:12px;background:#030914;color:#eaf4ff;padding:12px;font:700 13px Oxanium,monospace;outline:none}.profile-v31-field input:focus,.profile-v31-field textarea:focus{border-color:#5eead4;box-shadow:0 0 0 2px #5eead422}.profile-v31-field textarea{min-height:125px;resize:vertical;word-break:break-all}
    .profile-v31-actions{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0}.profile-v31-btn{border:1px solid #315675;border-radius:12px;padding:11px 14px;background:linear-gradient(180deg,#12304a,#0b1b2c);color:#eff8ff;font:900 11px Oxanium;cursor:pointer}.profile-v31-btn.primary{border-color:#5eead4;background:linear-gradient(135deg,#0f766e,#0891b2)}.profile-v31-btn.gold{border-color:#d6a84d;background:linear-gradient(135deg,#7c5617,#b7791f)}.profile-v31-status{min-height:22px;padding:8px 10px;border-radius:10px;background:#ffffff08;color:#9cc3d7;font-size:11px}.profile-v31-account{margin:10px 0;padding:10px 12px;border:1px solid #ffffff12;border-radius:12px;background:#ffffff06;color:#aab9ca;font-size:11px}.profile-v31-account b{color:#fff}.profile-v31-note{margin-top:12px;color:#7389a1;font-size:10px;line-height:1.5}.profile-v31-sep{height:1px;background:#ffffff12;margin:18px 0}
    @media(max-width:650px){.profile-v31-grid{grid-template-columns:1fr}.profile-v31-card{padding:16px}.profile-v31-head h2{font-size:24px}}
    `;document.head.appendChild(s);
  }
  function decorateMenu(){
    const actions=document.querySelector('.lobby-actions');if(!actions||$('#btn-profile'))return;
    const b=document.createElement('button');b.id='btn-profile';b.className='btn';b.textContent='👤 PERFIL / LOGIN';b.onclick=()=>{try{window.SFX?.play?.('menu_select')}catch(_){ }openProfile()};
    const settings=$('#btn-settings');if(settings)actions.insertBefore(b,settings);else actions.appendChild(b);
  }
  function activeName(){return localStorage.getItem(ACTIVE)||''}
  async function makeCode(acc){
    const payload={v:31,kind:'LUTADOR_PROFILE',user:acc.user,salt:acc.salt,passHash:acc.passHash,at:Date.now(),items:collect()};
    return jsonToCode(payload);
  }
  function openProfile(){
    css();document.getElementById('profile-v31-overlay')?.remove();
    const active=activeName();
    const root=document.createElement('div');root.id='profile-v31-overlay';
    root.innerHTML=`<section class="profile-v31-card"><div class="profile-v31-head"><div><small>LUTADOR • CONTA</small><h2>PERFIL / LOGIN</h2><p>Crie um perfil local e gere automaticamente um código Base64 para levar seu progresso para outro navegador ou PC.</p></div><button class="profile-v31-close" aria-label="Fechar">×</button></div>
      <div class="profile-v31-account">Perfil ativo: <b>${escapeHtml(active||'nenhum')}</b></div>
      <div class="profile-v31-grid"><div class="profile-v31-field"><label>USUÁRIO</label><input id="profile-v31-user" autocomplete="username" maxlength="32" placeholder="Seu usuário"></div><div class="profile-v31-field"><label>SENHA</label><input id="profile-v31-pass" type="password" autocomplete="current-password" maxlength="64" placeholder="Sua senha"></div></div>
      <div class="profile-v31-actions"><button class="profile-v31-btn primary" id="profile-v31-login">ENTRAR / CRIAR PERFIL</button><button class="profile-v31-btn" id="profile-v31-save">SALVAR PROGRESSO + GERAR CÓDIGO</button><button class="profile-v31-btn" id="profile-v31-logout">SAIR DO PERFIL</button></div>
      <div class="profile-v31-status" id="profile-v31-status">Digite usuário e senha. Se o usuário não existir neste navegador, ele será criado.</div>
      <div class="profile-v31-sep"></div>
      <div class="profile-v31-field"><label>CÓDIGO AUTOMÁTICO DA CONTA (BASE64)</label><textarea id="profile-v31-code" spellcheck="false" placeholder="O código aparece após entrar/salvar. Para transferir, cole aqui no outro jogo."></textarea></div>
      <div class="profile-v31-actions"><button class="profile-v31-btn gold" id="profile-v31-copy">COPIAR CÓDIGO</button><button class="profile-v31-btn primary" id="profile-v31-import">IMPORTAR CÓDIGO E ENTRAR</button></div>
      <div class="profile-v31-note">O código contém o progresso salvo do jogo. A senha não é gravada em texto puro; ela é verificada por derivação criptográfica. Para sincronização automática pela internet seria necessário conectar um backend/serviço de contas.</div></section>`;
    document.body.appendChild(root);
    const user=$('#profile-v31-user',root),pass=$('#profile-v31-pass',root),code=$('#profile-v31-code',root),status=$('#profile-v31-status',root);
    if(active)user.value=active;
    const msg=(t,ok=true)=>{status.textContent=t;status.style.color=ok?'#86efac':'#fca5a5'};
    $('.profile-v31-close',root).onclick=()=>root.remove();
    root.addEventListener('click',e=>{if(e.target===root)root.remove()});
    $('#profile-v31-login',root).onclick=async()=>{
      try{
        const u=user.value.trim(),p=pass.value;if(u.length<3||p.length<4)return msg('Use pelo menos 3 caracteres no usuário e 4 na senha.',false);
        let acc=readAccount(u);
        if(acc){const h=await passHash(p,acc.salt);if(h!==acc.passHash)return msg('Senha incorreta para este perfil.',false);if(acc.items&&Object.keys(acc.items).length){applyItems(acc.items)} }
        else{const salt=randomSalt();acc={user:u,salt,passHash:await passHash(p,salt),items:collect(),createdAt:Date.now()}}
        acc.items=collect();acc.updatedAt=Date.now();saveAccount(acc);code.value=await makeCode(acc);msg('Perfil ativo. Código de transferência gerado automaticamente.');
      }catch(e){msg('Não foi possível abrir/criar o perfil: '+(e?.message||e),false)}
    };
    $('#profile-v31-save',root).onclick=async()=>{
      try{const u=(user.value.trim()||activeName()),p=pass.value;if(!u||!p)return msg('Informe o usuário e a senha para salvar.',false);const acc=readAccount(u);if(!acc)return msg('Entre/crie o perfil primeiro.',false);if(await passHash(p,acc.salt)!==acc.passHash)return msg('Senha incorreta.',false);acc.items=collect();acc.updatedAt=Date.now();saveAccount(acc);code.value=await makeCode(acc);msg('Progresso salvo no perfil e código atualizado.')}catch(e){msg('Erro ao salvar: '+(e?.message||e),false)}
    };
    $('#profile-v31-copy',root).onclick=async()=>{if(!code.value.trim())return msg('Gere um código primeiro.',false);try{await navigator.clipboard.writeText(code.value.trim());msg('Código copiado.')}catch(_){code.select();document.execCommand?.('copy');msg('Código selecionado para copiar.')}};
    $('#profile-v31-import',root).onclick=async()=>{
      try{
        const payload=codeToJson(code.value);if(payload?.kind!=='LUTADOR_PROFILE'||!payload.user||!payload.salt||!payload.passHash||!payload.items)throw new Error('código inválido');
        const u=user.value.trim()||payload.user,p=pass.value;if(u.toLowerCase()!==String(payload.user).toLowerCase())return msg('O usuário digitado não corresponde ao código.',false);if(!p)return msg('Digite a senha da conta para importar.',false);
        const h=await passHash(p,payload.salt);if(h!==payload.passHash)return msg('Senha incorreta para esse código.',false);
        applyItems(payload.items);const acc={user:payload.user,salt:payload.salt,passHash:payload.passHash,items:payload.items,createdAt:payload.at||Date.now(),updatedAt:Date.now()};saveAccount(acc);msg('Progresso importado. Reiniciando o jogo...');setTimeout(()=>location.reload(),650);
      }catch(e){msg('Não foi possível importar: '+(e?.message||e),false)}
    };
    $('#profile-v31-logout',root).onclick=()=>{localStorage.removeItem(ACTIVE);msg('Perfil desconectado. O progresso local não foi apagado.');$('.profile-v31-account',root).innerHTML='Perfil ativo: <b>nenhum</b>'};
  }
  const oldRender=window.renderMenu;
  if(typeof oldRender==='function'&&!oldRender.__profileV31){const wrapped=function(){const r=oldRender.apply(this,arguments);setTimeout(decorateMenu,0);return r};wrapped.__profileV31=true;window.renderMenu=wrapped}
  const obs=new MutationObserver(()=>decorateMenu());const app=document.getElementById('app');if(app)obs.observe(app,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateMenu,{once:true});else decorateMenu();
  window.LutadorProfileV31=Object.freeze({version:'31.0.0',open:openProfile,collect});
})();
