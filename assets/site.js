/* Juice Luxury Rentals — shared behaviors v4. Zero dependencies. Every effect degrades to static content. */
(function(){
  const d=document, html=d.documentElement; html.classList.add('js');
  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CONFIG=window.JLR_CONFIG||{phone:"13019807994",phoneDisplay:"(301) 980-7994",instagram:"https://www.instagram.com/juiceluxuryrentals"};
  const sms=body=>`sms:+${CONFIG.phone}?&body=${encodeURIComponent(body)}`;
  window.JLR={sms,CONFIG};
  /* wiring: [data-sms] → prefilled sms link · [data-ig] → instagram · .phone-display → number */
  d.querySelectorAll('[data-sms]').forEach(a=>a.href=sms(a.dataset.sms||"Hi! Planning a trip — saw your site. Dates, group size + what I need:"));
  d.querySelectorAll('[data-ig]').forEach(a=>{a.href=CONFIG.instagram;a.target="_blank";a.rel="noopener"});
  d.querySelectorAll('.phone-display').forEach(e=>e.textContent=CONFIG.phoneDisplay);
  d.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
  /* nav */
  const nav=d.querySelector('.nav'), tog=d.querySelector('.nav-toggle'), menu=d.querySelector('.menu');
  const onScroll=()=>{ if(nav && !nav.hasAttribute('data-solid')) nav.classList.toggle('solid', scrollY>24); };
  addEventListener('scroll',onScroll,{passive:true}); onScroll();
  if(tog&&menu){ tog.addEventListener('click',()=>{const o=menu.classList.toggle('open');tog.setAttribute('aria-expanded',o);d.body.style.overflow=o?'hidden':''}); menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');tog.setAttribute('aria-expanded','false');d.body.style.overflow=''})); }
  /* hero title words */
  d.querySelectorAll('.hero-title[data-words]').forEach(h=>{ const nodes=[...h.childNodes]; h.innerHTML=''; nodes.forEach(n=>{ if(n.nodeType===3){ n.textContent.split(/(\s+)/).forEach(t=>{ if(!t)return; if(/^\s+$/.test(t)){h.appendChild(d.createTextNode(' '));return;} const w=d.createElement('span');w.className='word';const i=d.createElement('span');i.textContent=t;w.appendChild(i);h.appendChild(w); }); } else { const w=d.createElement('span');w.className='word';const i=d.createElement('span');i.appendChild(n);w.appendChild(i);h.appendChild(w);} }); });
  /* reveal + counters + itinerary steps */
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting)return; e.target.classList.add('in'); io.unobserve(e.target);
    e.target.querySelectorAll('[data-count]').forEach(c=>{ const t=parseFloat(c.dataset.count), suf=c.dataset.suffix||''; if(RM){c.textContent=t+suf;return;} const s=performance.now(); const f=n=>{const p=Math.min(1,(n-s)/1400);c.textContent=Math.round(t*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(f)}; requestAnimationFrame(f); });
  }),{threshold:.18});
  d.querySelectorAll('.reveal,.hero,.itin-step').forEach(el=>io.observe(el));
  /* parallax planes: [data-plane="0.2"] moves at 20% of scroll; hero only, transform-only */
  if(!RM){ const planes=[...d.querySelectorAll('[data-plane]')]; if(planes.length){ let tick=false; const upd=()=>{ tick=false; const y=scrollY; if(y>innerHeight*1.2)return; planes.forEach(p=>{p.style.transform=`translate3d(0,${(y*parseFloat(p.dataset.plane)).toFixed(1)}px,0)`}); }; addEventListener('scroll',()=>{ if(!tick){tick=true;requestAnimationFrame(upd)} },{passive:true}); upd(); } }
  /* itinerary progress line */
  const line=d.querySelector('.itin-line'), list=d.querySelector('.itin-list');
  if(line&&list){ const upd=()=>{ const r=list.getBoundingClientRect(); const p=Math.min(1,Math.max(0,(innerHeight*0.7-r.top)/r.height)); line.style.setProperty('--p',RM?1:p.toFixed(3)); }; addEventListener('scroll',upd,{passive:true}); upd(); }
  /* tabs */
  d.querySelectorAll('[role=tablist]').forEach(tl=>{ const tabs=[...tl.querySelectorAll('[role=tab]')]; const sel=t=>{ tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;const p=d.getElementById(x.getAttribute('aria-controls'));if(p)p.classList.toggle('on',on);}); }; tabs.forEach((t,i)=>{ t.addEventListener('click',()=>sel(t)); t.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){tabs[(i+1)%tabs.length].focus();sel(tabs[(i+1)%tabs.length])} if(e.key==='ArrowLeft'){tabs[(i-1+tabs.length)%tabs.length].focus();sel(tabs[(i-1+tabs.length)%tabs.length])} }); }); const h=location.hash.replace('#',''); const pre=tabs.find(t=>t.getAttribute('aria-controls')===h); sel(pre||tabs.find(t=>t.getAttribute('aria-selected')==='true')||tabs[0]); });
  const gotoTab=(id,scroll)=>{ const t=d.querySelector(`[role=tab][aria-controls="${id}"]`); if(!t) return false; t.click(); if(scroll){ const tl=t.closest('[role=tablist]'); tl&&tl.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'}); } return true; };
  d.querySelectorAll('a[data-tab]').forEach(a=>a.addEventListener('click',e=>{ if(gotoTab(a.dataset.tab,true)) e.preventDefault(); }));
  if(/^#tab-/.test(location.hash)){ setTimeout(()=>gotoTab(location.hash.slice(1),true),50); }
  addEventListener('hashchange',()=>{ if(/^#tab-/.test(location.hash)) gotoTab(location.hash.slice(1),true); });
  /* rails */
  d.querySelectorAll('.rail-wrap').forEach(w=>{ const r=w.querySelector('.rail'), cnt=w.querySelector('.rail-count'); const step=()=>{const card=r.firstElementChild; return (card?card.getBoundingClientRect().width:320)+18}; w.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>{ r.scrollBy({left:step()*parseInt(b.dataset.dir),behavior:RM?'auto':'smooth'}); }));
    const upd=()=>{ if(!cnt) return; const n=r.children.length; const i=Math.min(n,Math.round(r.scrollLeft/step())+1); cnt.textContent=`${String(i).padStart(2,'0')} / ${String(n).padStart(2,'0')}`; }; r.addEventListener('scroll',upd,{passive:true}); upd(); });
  /* hide the sticky bar while the hero CTAs are on screen (no double primary) */
  const hc=d.querySelector('.hero-ctas'); if(hc){ new IntersectionObserver(es=>es.forEach(e=>d.body.classList.toggle('hero-ctas-visible',e.isIntersecting)),{threshold:.4}).observe(hc); }
  /* finder → sms */
  const finder=d.querySelector('.finder');
  const fOut=finder&&finder.querySelector('pre'), fGo=finder&&finder.querySelector('[data-finder-go]');
  if(finder&&fOut&&fGo){ const state={city:'Miami',what:new Set(),group:'',dates:''}; const out=fOut, go=fGo;
    const render=()=>{ const what=[...state.what].join(', '); const lines=[`Hi! Building a weekend from your site.`,`City: ${state.city}`]; if(state.dates)lines.push(`Dates: ${state.dates}`); if(state.group)lines.push(`Group: ${state.group}`); if(what)lines.push(`Need: ${what}`); if(!state.dates||!state.group)lines.push(`${!state.dates?'My dates':''}${!state.dates&&!state.group?' + ':''}${!state.group?'group size':''}:`); const msg=lines.join('\n'); out.textContent=msg; go.href=sms(msg); };
    finder.querySelectorAll('[data-city]').forEach(b=>b.addEventListener('click',()=>{finder.querySelectorAll('[data-city]').forEach(x=>x.setAttribute('aria-pressed',x===b));state.city=b.dataset.city;render()}));
    finder.querySelectorAll('[data-what]').forEach(b=>b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);on?state.what.add(b.dataset.what):state.what.delete(b.dataset.what);render()}));
    finder.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{finder.querySelectorAll('[data-group]').forEach(x=>x.setAttribute('aria-pressed',x===b));state.group=b.dataset.group;render()}));
    const dt=finder.querySelector('#fDates'); if(dt) dt.addEventListener('input',()=>{state.dates=dt.value.trim();render()});
    render(); }
  /* lightbox: any .grid a[href$=.jpg] inside [data-lb] container, grouped per container */
  const lb=d.querySelector('.lb'); if(lb){ const im=lb.querySelector('img'), cnt=lb.querySelector('.c'); let set=[],i=0,last=null;
    const show=k=>{ i=(k+set.length)%set.length; im.src=set[i].href; im.alt=set[i].querySelector('img')?.alt||''; cnt.textContent=`${i+1} / ${set.length}`; lb.classList.add('on'); lb.querySelector('.x').focus(); };
    const close=()=>{ lb.classList.remove('on'); if(last) last.focus(); };
    d.querySelectorAll('[data-lb]').forEach(c=>{ const links=[...c.querySelectorAll('a[href$=".jpg"],a[href$=".webp"],a[href$=".avif"]')]; links.forEach((a,k)=>a.addEventListener('click',e=>{e.preventDefault();set=links;last=a;show(k)})); });
    lb.querySelector('.x').addEventListener('click',close); lb.querySelector('.p').addEventListener('click',()=>show(i-1)); lb.querySelector('.n').addEventListener('click',()=>show(i+1));
    lb.addEventListener('click',e=>{if(e.target===lb)close()});
    d.addEventListener('keydown',e=>{ if(!lb.classList.contains('on'))return; if(e.key==='Escape')close(); if(e.key==='ArrowRight')show(i+1); if(e.key==='ArrowLeft')show(i-1); if(e.key==='Tab'){ const f=[...lb.querySelectorAll('button')]; const a=d.activeElement; const n=f.indexOf(a); e.preventDefault(); f[(n+(e.shiftKey?-1:1)+f.length)%f.length].focus(); } });
    let tx=0; lb.addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true}); lb.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>40)show(dx<0?i+1:i-1)}); }
})();
