const $=s=>document.querySelector(s);
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const DAY=864e5, parse=d=>new Date(d+'T12:00:00');
const fmtD=d=>parse(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
const LS='babymoon-state-v1';
let state=JSON.parse(localStorage.getItem(LS)||'{"fav":[],"disc":[]}');
const save=()=>localStorage.setItem(LS,JSON.stringify(state));
let D, track='todos', sortK='preco', sortDir=1;

function weekAt(date){const g=D.gestacao;const days=(parse(date)-parse(g.dataReferencia))/DAY;const t=g.semanasNaReferencia*7+days;return {w:Math.floor(t/7),d:Math.round(t%7),t}}
const wtxt=x=>`${x.w}s${x.d?' '+x.d+'d':''}`;
function wbadge(date){const x=weekAt(date);const lim=D.gestacao.limiteSemanas*7;const cls=x.t>=lim?'bad':x.t>=lim-7?'warn':'ok';return `<span class="badge ${cls}">${wtxt(x)}</span>`}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const plural=(n,s,p)=>`${n} ${n===1?s:p}`;
function renderPreg(){
  const g=D.gestacao, today=new Date().toISOString().slice(0,10);
  const now=weekAt(today), lim=g.limiteSemanas, S0=20, S1=30, pos=w=>Math.max(0,Math.min(100,(w-S0)/(S1-S0)*100));
  const left=Math.ceil((parse(g.dataLimite)-parse(today))/DAY);
  const trips=D.destinos.filter(x=>x.datas).map(x=>({n:x.nome,w:weekAt(x.datas.ida).t/7}));
  $('#preg').innerHTML=`<h2>🤰 Contador da gestação</h2>
  <div class="weeks"><b>${now.w}</b><span>semanas${now.d?' e '+plural(now.d,'dia','dias'):''} hoje</span></div>
  <div class="zbar">
    <div class="ztrack"><span class="z green" style="width:${pos(lim-1)}%"></span><span class="z yellow" style="left:${pos(lim-1)}%;width:${pos(lim)-pos(lim-1)}%"></span><span class="z red" style="left:${pos(lim)}%;right:0"></span>
      ${trips.map(t=>`<i class="trip" style="left:${pos(t.w)}%" title="Ida: ${esc(t.n)}"></i>`).join('')}
      <span class="today" style="left:${pos(now.t/7)}%"><em>Hoje</em></span></div>
    <div class="ticks">${[20,22,24,26,27,30].map(w=>`<span style="left:${pos(w)}%">${w}</span>`).join('')}</div>
  </div>
  <p class="small muted">Referência: ${g.semanasNaReferencia} semanas em ${fmtD(g.dataReferencia)}/2026. Limite que definimos para voar: <strong>${lim} semanas (~${fmtD(g.dataLimite)})</strong>${left>0?` — falta${left===1?'':'m'} <strong>${plural(left,'dia','dias')}</strong>`:' — limite atingido'}.</p>
  <p class="small"><span class="chip green"></span> folga (até ${lim-1} sem.) · <span class="chip yellow"></span> última semana antes do limite (${lim-1}–${lim}) · <span class="chip red"></span> passou do limite (${lim}+) · <span class="chip tripc"></span> ida sugerida de cada destino</p>`;
  const dl=Math.ceil((parse(g.previsaoParto)-parse(today))/DAY);
  if($('#dppLeft')){$('#dpp').textContent='~'+parse(g.previsaoParto).toLocaleDateString('pt-BR');$('#dppLeft').textContent=dl>0?plural(dl,'dia','dias'):'chegou a hora 💕'}
}
function card(x){
  const t=D.trilhas.find(t=>t.id===x.trilha), b=t.orcamento, c=x.custos;
  const fav=state.fav.includes(x.id), disc=state.disc.includes(x.id);
  const dates=x.datas?`<div class="datebox">📅 Sugestão: ida ${fmtD(x.datas.ida)} ${wbadge(x.datas.ida)} · volta ${fmtD(x.datas.volta)} ${wbadge(x.datas.volta)}</div>`:`<div class="datebox">📅 Datas ainda a definir — sem ida e volta boa na janela</div>`;
  const pMin=Math.min(100,c.totalMin/b*100), pMax=Math.min(100,c.totalMax/b*100);
  return `<article class="dest ${fav?'fav':''} ${disc?'discarded':''}" id="d-${x.id}">
  <div class="photo"><img src="${x.img}" alt="${esc(x.nome)}" loading="lazy">
   <a class="credit" href="${x.imgFonte}" target="_blank" rel="noopener">📷 ${esc(x.imgCredito)}</a>
   <div class="actions"><button title="Favoritar" class="${fav?'on':''}" onclick="toggle('fav','${x.id}')">💖</button><button title="Descartar" class="${disc?'on':''}" onclick="toggle('disc','${x.id}')">✖️</button></div></div>
  <div class="body">
   <div><span class="muted small">${esc(x.regiao)} · ${esc(x.aeroporto)}</span><h3>${esc(x.nome)}</h3></div>
   ${dates}
   <div class="sec"><h4>✈️ Voos <span class="badge warn">estimativa</span></h4><ul>${x.voos.map(v=>`<li>${esc(v.texto)} <span class="badge">${esc(v.tipo)}</span></li>`).join('')}</ul>
    <p class="small">Fonte: ${x.fontesVoo.map((u,i)=>`<a href="${u}" target="_blank" rel="noopener">${new URL(u).hostname}</a>`).join(' · ')}</p></div>
   <div class="sec"><h4>🏨 Hospedagem</h4><ul>${x.hoteis.map(h=>`<li>${h.url?`<a href="${h.url}" target="_blank" rel="noopener">${esc(h.nome)}</a>`:esc(h.nome)} — ${esc(h.preco)}</li>`).join('')}</ul></div>
   <div class="sec"><h4>🌤️ Clima</h4><p class="small" style="margin:0">${esc(x.clima)}</p></div>
   <div class="sec"><h4>💚 Prós</h4><ul>${x.pros.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div>
   <div class="sec"><h4>🤰 Cuidados na gestação</h4><ul>${x.cuidados.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div>
   <div class="sec"><h4>💰 Custos <span class="badge warn">estimativa</span></h4><p class="small muted" style="margin:0">${esc(c.nota)}</p>
    <table class="costs">${c.itens.map(i=>`<tr><td>${esc(i.item)}</td><td>${i.min===i.max?brl(i.min):brl(i.min)+'–'+brl(i.max)}</td></tr>`).join('')}
    <tr class="total"><td>Total estimado</td><td>${brl(c.totalMin)}–${brl(c.totalMax)}</td></tr></table></div>
   <div class="sec"><h4>Orçamento ${esc(t.nome)} (${brl(b)})</h4>
    <div class="bbar ${c.totalMax>b?'over':''}"><span class="min" style="width:${pMin}%"></span><span class="rng" style="left:${pMin}%;width:${pMax-pMin}%"></span></div>
    <p class="small muted" style="margin:4px 0 0">${Math.round(c.totalMin/b*100)}–${Math.round(c.totalMax/b*100)}% do orçamento · sobra ${brl(b-c.totalMax)} a ${brl(b-c.totalMin)}</p></div>
   ${guia(x)}
   <div class="small">Conforto para ela: <span class="stars">${'★'.repeat(x.conforto)}${'☆'.repeat(5-x.conforto)}</span></div>
  </div></article>`;
}


const lnk=u=>`<a href="${u}" target="_blank" rel="noopener">${new URL(u).hostname.replace('www.','')}</a>`;
function guia(x){ if(!x.roteiro) return '';
  return `<details class="more"><summary>🗓️ Roteiro sugerido</summary><ol>${x.roteiro.map(r=>`<li>${esc(r)}</li>`).join('')}</ol><p class="src">Ritmo leve pensado para a gestação — ajuste com o obstetra.</p></details>
  <details class="more"><summary>🍽️ Restaurantes</summary><ul>${x.restaurantes.map(r=>`<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.nome)}</a> — ${esc(r.nota)}</li>`).join('')}</ul><p class="src">Sempre avisar a alergia (veja a seção Alimentação). Fontes: ${x.fontesGuia.map(lnk).join(' · ')}</p></details>
  <details class="more"><summary>📍 Passeios e pontos turísticos</summary><ul>${x.passeios.map(r=>`<li><strong>${esc(r.nome)}</strong> — ${esc(r.nota)}</li>`).join('')}</ul></details>`;
}
function renderSeguro(){const s=D.seguro;if(!s)return;
  const CK='babymoon-check-v1';let ck=JSON.parse(localStorage.getItem(CK)||'[]');
  $('#seguro').innerHTML=`<h2>🛡️ Seguro e benefícios</h2><p class="small">${esc(s.intro)}</p>
  <div class="alert"><h3>${esc(s.alertaGestacao.titulo)} <span class="badge bad">${esc(s.alertaGestacao.status)}</span></h3><ul>${s.alertaGestacao.texto.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="src">Fontes: ${s.alertaGestacao.fontes.map(lnk).join(' · ')}</p></div>
  <h3>✅ Checklist antes de viajar</h3><ul class="check">${s.checklist.map((c,i)=>`<li><label><input type="checkbox" data-i="${i}" ${ck.includes(i)?'checked':''}>${esc(c)}</label></li>`).join('')}</ul>
  <p class="small">Emitir bilhete: <a href="${s.aigUrl}" target="_blank" rel="noopener">aig.com/Mastercard/pt</a></p>
  <h3>Mastercard Black <span class="badge warn">confirmar com o banco</span></h3>
  <div class="blist">${s.beneficios.map(b=>`<div class="bitem"><b>${esc(b.nome)}</b>${esc(b.detalhe)}<div class="src">Fonte: ${lnk(b.fonte)}${b.fonte2?' · '+lnk(b.fonte2):''}</div></div>`).join('')}</div>
  <h3>✈️ LATAM Pass Gold <span class="badge warn">${esc(s.latamGold.status)}</span></h3><ul class="small">${s.latamGold.texto.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="src">Fonte: ${lnk(s.latamGold.fonte)}</p>`;
  $('#seguro').querySelectorAll('input').forEach(b=>b.onchange=()=>{const i=+b.dataset.i;ck=b.checked?[...ck,i]:ck.filter(x=>x!==i);localStorage.setItem(CK,JSON.stringify(ck))});
}
function renderMilhas(){const m=D.milhas;if(!m)return;const n=v=>v.toLocaleString('pt-BR');
  const L=m.saldos[0].valor, lv=m.saldos[1].valor, it=m.saldos[2].valor, pot=L+lv+Math.floor(it*0.4);
  $('#milhas').innerHTML=`<h2>💳 Milhas e pontos <span class="muted small">(em ${m.data})</span></h2>
  <div class="stats">${m.saldos.map(s=>`<div class="stat"><b>${n(s.valor)}</b>${esc(s.programa)}<br><span class="small muted">${s.unidade}</span></div>`).join('')}
  <div class="stat"><b>~${n(pot)}</b>potencial em milhas aéreas<br><span class="small muted">sem bônus (Livelo 1:1, Itaú ~2,5:1) — estimativa</span></div></div>
  <h3>Transferências</h3><ul class="small">${m.transferencias.map(t=>`<li><strong>${esc(t.de)} → ${esc(t.para)}:</strong> ${esc(t.taxa)} <span class="src">(${lnk(t.fonte)})</span></li>`).join('')}</ul>
  <h3>Estratégia</h3><ul class="small">${m.estrategia.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
  <h3>Por destino <span class="badge warn">preços em milhas a verificar</span></h3><ul class="small">${m.porDestino.map(p=>`<li><strong>${esc(D.destinos.find(x=>x.id===p.id).nome)}:</strong> ${esc(p.programa)} — ${esc(p.nota)}</li>`).join('')}</ul>`;
}
function renderAlim(){const a=D.alimentacao;if(!a)return;
  $('#alimentacao').innerHTML=`<h2>🥗 Alimentação</h2>
  <div class="alert"><h3>🦐🚫 ${esc(a.alergias)}</h3><p class="small" style="margin:0">Atenção à contaminação cruzada: mesma chapa, óleo de fritura, caldos e molhos.</p></div>
  <h3>🤰 Restrições da gestação</h3><ul class="small">${a.gestante.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="src">Fontes: ${a.fontes.map(lnk).join(' · ')}</p>
  <h3>🗣️ Cartão para o restaurante</h3>${a.frases.map(f=>`<div class="phrase"><button class="link" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.parentNode.querySelector('span').textContent)">copiar</button><strong>${esc(f.lang)}</strong><br><span>${esc(f.txt)}</span></div>`).join('')}
  <h3>📍 Avisos por destino</h3><ul class="small">${a.avisos.map(v=>`<li><strong>${esc(v.onde)}:</strong> ${esc(v.txt)}</li>`).join('')}</ul>`;
}

function renderDed(){const t=D.dedicatoria;if(!t)return;const el=$('#dedicatoria');
  el.innerHTML=`<figcaption>${esc(t.titulo)}</figcaption>`+t.texto.split(/\n\s*\n/).map(p=>`<p>${p.split('\n').map(esc).join('<br>')}</p>`).join('');el.hidden=false}
function renderTracks(){
  let html='';
  for(const t of D.trilhas){
    let list=D.destinos.filter(x=>x.trilha===t.id);
    if(track==='favoritos') list=list.filter(x=>state.fav.includes(x.id));
    else if(track!=='todos'&&track!==t.id) continue;
    if(!list.length&&track==='favoritos') continue;
    html+=`<section><div class="track-head"><h2>${t.id==='brasil'?'🇧🇷':'✈️'} ${t.nome}</h2><span class="muted">Orçamento: <strong>${brl(t.orcamento)}</strong></span></div><div class="grid">${list.map(card).join('')}</div></section>`;
  }
  $('#tracks').innerHTML=html||'<p class="empty">Nenhum favorito ainda — toque no 💖 de um destino.</p>';
}

function renderTable(){
  const val={nome:x=>x.nome,preco:x=>(x.custos.totalMin+x.custos.totalMax)/2,voo:x=>x.tempoVooMin,conforto:x=>-x.conforto};
  const rows=[...D.destinos].sort((a,b)=>{const A=val[sortK](a),B=val[sortK](b);return (A>B?1:A<B?-1:0)*sortDir});
  document.querySelectorAll('#cmp th').forEach(th=>th.className=th.dataset.k===sortK?(sortDir>0?'asc':'desc'):'');
  $('#cmp tbody').innerHTML=rows.map(x=>`<tr class="${state.disc.includes(x.id)?'discarded':''}">
   <td>${state.fav.includes(x.id)?'💖 ':''}<a href="#d-${x.id}" style="color:inherit">${esc(x.nome)}</a><br><span class="badge">${x.trilha==='brasil'?'Brasil':'Internacional'}</span></td>
   <td>${brl(x.custos.totalMin)}–${brl(x.custos.totalMax)}</td><td>${esc(x.tempoVooTexto)}</td>
   <td class="stars">${'★'.repeat(x.conforto)}${'☆'.repeat(5-x.conforto)}</td></tr>`).join('');
}

function toggle(k,id){const o=k==='fav'?'disc':'fav';state[k]=state[k].includes(id)?state[k].filter(i=>i!==id):[...state[k],id];state[o]=state[o].filter(i=>i!==id);save();renderTracks();renderTable()}
window.toggle=toggle;

fetch('data.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
  D=d; $('#updated').textContent=d.ultimaAtualizacao;
  $('#notas').innerHTML=d.notasGerais.map(n=>`<li>${esc(n)}</li>`).join('');
  renderDed(); renderPreg(); renderSeguro(); renderMilhas(); renderAlim(); renderTracks(); renderTable();
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');track=b.dataset.track;renderTracks()});
  document.querySelectorAll('#cmp th').forEach(th=>th.onclick=()=>{if(sortK===th.dataset.k)sortDir*=-1;else{sortK=th.dataset.k;sortDir=1}renderTable()});
  $('#reset').onclick=()=>{state={fav:[],disc:[]};save();renderTracks();renderTable()};
}).catch(e=>{$('#tracks').innerHTML='<p class="empty">Não foi possível carregar data.json. Abra via servidor (GitHub Pages ou python -m http.server).</p>';console.error(e)});

// Galeria lua de mel + lightbox
(function(){
  let P=[],i=0;const G={};const lb=$('#lb'),im=lb.querySelector('img');
  const show=n=>{i=(n+P.length)%P.length;im.src=P[i].src;lb.querySelector('.lb-cap').textContent=`${P[i].legenda||parse(P[i].data).toLocaleDateString('pt-BR')} · ${i+1}/${P.length}`};
  const open=(set,n)=>{P=G[set];show(n);lb.hidden=false;document.body.style.overflow='hidden'};
  const close=()=>{lb.hidden=true;im.src='';document.body.style.overflow=''};
  lb.querySelector('.lb-x').onclick=close;
  lb.querySelector('.lb-prev').onclick=e=>{e.stopPropagation();show(i-1)};
  lb.querySelector('.lb-next').onclick=e=>{e.stopPropagation();show(i+1)};
  lb.onclick=e=>{if(e.target===lb)close()};
  document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(i-1);if(e.key==='ArrowRight')show(i+1)});
  let x0=null;lb.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
  lb.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)show(i+(dx<0?1:-1));x0=null});
  fetch('data.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
    G.lua=d.luaDeMel||[];G.helena=d.helena||[];
    const build=(id,set,alt)=>{$(id).innerHTML=G[set].map((p,n)=>`<button class="${p.formato==='vertical'?'vertical':''}" data-n="${n}" aria-label="Foto ${n+1}"><img src="${p.src}" alt="${esc(alt(p))}" loading="lazy" decoding="async"></button>`).join('');
      $(id).querySelectorAll('button').forEach(b=>b.onclick=()=>open(set,+b.dataset.n))};
    build('#gallery','lua',p=>(p.legenda?'Casamento':'Lua de mel')+', '+parse(p.data).toLocaleDateString('pt-BR'));
    if(d.legendaPostCasamento){const n=$('#postNote');n.innerHTML='“'+esc(d.legendaPostCasamento.texto).replace(/\n/g,'<br>')+'” <a href="'+d.legendaPostCasamento.fonte+'" target="_blank" rel="noopener">— post de 1 ano de casados</a>';n.hidden=false}
    build('#helenaGallery','helena',p=>'Helena — '+p.legenda);
  });
})();
