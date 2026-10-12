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
function wbadge(date){const x=weekAt(date);const lim=D.gestacao.limiteSemanas*7;const cls=x.t>lim?'bad':x.t>lim-7?'warn':'ok';return `<span class="badge ${cls}">${wtxt(x)}</span>`}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function renderPreg(){
  const g=D.gestacao, today=new Date().toISOString().slice(0,10);
  const now=weekAt(today), pct=Math.min(100,now.t/(40*7)*100), lim=g.limiteSemanas/40*100;
  const left=Math.ceil((parse(g.dataLimite)-parse(today))/DAY);
  $('#preg').innerHTML=`<h2>🤰 Contador da gestação</h2>
  <div class="weeks"><b>${now.w}</b><span>semanas ${now.d?'e '+now.d+' dias':''} hoje</span></div>
  <div class="prog"><span style="width:${pct}%"></span><i style="position:absolute;left:${lim}%;top:0;bottom:0;width:2px;background:var(--rose-d)"></i></div>
  <p class="small muted">Referência: ${g.semanasNaReferencia} semanas em ${fmtD(g.dataReferencia)}/2026. Limite que definimos para voar: <strong>${g.limiteSemanas} semanas (~${fmtD(g.dataLimite)})</strong>${left>0?` — faltam <strong>${left} dias</strong>`:' — limite atingido'}.</p>
  <p class="small"><span class="badge ok">verde</span> folga · <span class="badge warn">amarelo</span> última semana antes do limite · <span class="badge bad">vermelho</span> passou do limite</p>`;
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
   <div class="small">Conforto para ela: <span class="stars">${'★'.repeat(x.conforto)}${'☆'.repeat(5-x.conforto)}</span></div>
  </div></article>`;
}

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
  renderPreg(); renderTracks(); renderTable();
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');track=b.dataset.track;renderTracks()});
  document.querySelectorAll('#cmp th').forEach(th=>th.onclick=()=>{if(sortK===th.dataset.k)sortDir*=-1;else{sortK=th.dataset.k;sortDir=1}renderTable()});
  $('#reset').onclick=()=>{state={fav:[],disc:[]};save();renderTracks();renderTable()};
}).catch(e=>{$('#tracks').innerHTML='<p class="empty">Não foi possível carregar data.json. Abra via servidor (GitHub Pages ou python -m http.server).</p>';console.error(e)});

// Galeria lua de mel + lightbox
(function(){
  let P=[],i=0;const lb=$('#lb'),im=lb.querySelector('img');
  const show=n=>{i=(n+P.length)%P.length;im.src=P[i].src;lb.querySelector('.lb-cap').textContent=`${parse(P[i].data).toLocaleDateString('pt-BR')} · ${i+1}/${P.length}`};
  const open=n=>{show(n);lb.hidden=false;document.body.style.overflow='hidden'};
  const close=()=>{lb.hidden=true;im.src='';document.body.style.overflow=''};
  lb.querySelector('.lb-x').onclick=close;
  lb.querySelector('.lb-prev').onclick=e=>{e.stopPropagation();show(i-1)};
  lb.querySelector('.lb-next').onclick=e=>{e.stopPropagation();show(i+1)};
  lb.onclick=e=>{if(e.target===lb)close()};
  document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(i-1);if(e.key==='ArrowRight')show(i+1)});
  let x0=null;lb.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
  lb.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)show(i+(dx<0?1:-1));x0=null});
  fetch('data.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
    P=d.luaDeMel||[];
    $('#gallery').innerHTML=P.map((p,n)=>`<button class="${p.formato==='vertical'?'vertical':''}" data-n="${n}" aria-label="Foto ${n+1}"><img src="${p.src}" alt="Lua de mel, ${parse(p.data).toLocaleDateString('pt-BR')}" loading="lazy" decoding="async"></button>`).join('');
    $('#gallery').querySelectorAll('button').forEach(b=>b.onclick=()=>open(+b.dataset.n));
  });
})();
