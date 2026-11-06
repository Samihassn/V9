/* Semantic node controls and service-specific diagrams. No fabricated portfolio data. */
(() => {
  const ns='http://www.w3.org/2000/svg';
  const art=document.querySelector('.system-art');
  const info=document.createElement('div');info.className='node-info';info.id='node-explanation';info.setAttribute('role','status');info.setAttribute('aria-live','polite');info.hidden=true;art.append(info);
  const descriptions=[
    ['يربط التطبيقات وينسّق خطوات العمل تلقائيًا، من استقبال الطلب إلى إرسال النتيجة.','Connects applications and orchestrates each step, from receiving a request to delivering the result.'],
    ['يفهم السؤال ويحلّل السياق ليولّد إجابة مناسبة اعتمادًا على المعلومات المتاحة.','Understands the question and its context to generate an answer from the available information.'],
    ['يسترجع المعرفة الأقرب لسؤالك من قاعدة المتجهات لتوفير سياق ذي صلة.','Retrieves relevant knowledge from the vector database to provide useful context.'],
    ['يربط الواجهة بالخدمات، ويتحقق من البيانات ويدير الطلبات عبر واجهات API.','Connects the interface to services, validates data and handles requests through APIs.']
  ];
  let selected=-1;
  const nodes=[...art.querySelectorAll('.node')];
  function show(i){
    selected=i;const ar=document.documentElement.lang==='ar';info.dir=ar?'rtl':'ltr';info.hidden=false;
    const name=document.createElement('strong');name.textContent=nodes[i].querySelector('strong').textContent;
    info.replaceChildren(name,document.createTextNode(descriptions[i][ar?0:1]));
    nodes.forEach((n,j)=>n.setAttribute('aria-pressed',String(j===i)));
    art.querySelectorAll('.beam-track').forEach((p,j)=>p.classList.toggle('selected',j===i));
  }
  nodes.forEach((n,i)=>{
    n.setAttribute('role','button');n.setAttribute('aria-pressed','false');n.setAttribute('aria-controls','node-explanation');
    n.addEventListener('click',()=>show(i));
    n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(i);}});
  });
  new MutationObserver(()=>{if(selected>=0)show(selected);}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  const drawings=[
    '<path class="wire" d="M35 45H110V22H210M110 45V72H210"/><rect class="block" x="10" y="27" width="40" height="36" rx="10"/><rect class="block" x="92" y="29" width="36" height="32" rx="8"/><rect class="block" x="190" y="8" width="40" height="28" rx="7"/><rect class="block" x="190" y="58" width="40" height="28" rx="7"/><circle class="ink" cx="30" cy="45" r="5"/><circle class="ink" cx="110" cy="45" r="4"/>',
    '<rect class="block" x="15" y="8" width="155" height="43" rx="13"/><path class="wire" d="M35 24H145M35 35H115"/><rect class="block" x="90" y="49" width="140" height="35" rx="12"/><circle class="ink" cx="118" cy="66" r="3"/><circle class="ink" cx="132" cy="66" r="3"/><circle class="ink" cx="146" cy="66" r="3"/>',
    '<path class="wire" d="M45 20L125 45L210 16M45 72L125 45L210 75"/><rect class="block" x="18" y="6" width="44" height="29" rx="6"/><rect class="block" x="18" y="58" width="44" height="29" rx="6"/><circle class="block" cx="125" cy="45" r="22"/><circle class="ink" cx="125" cy="45" r="7"/><rect class="block" x="190" y="3" width="40" height="26" rx="6"/><rect class="block" x="190" y="62" width="40" height="26" rx="6"/>',
    '<rect class="block" x="12" y="10" width="100" height="72" rx="10"/><path class="wire" d="M12 29H112M30 46H70M30 58H88M112 46H175"/><rect class="block" x="175" y="26" width="62" height="40" rx="9"/><path class="wire" d="M195 37L187 46L195 55M217 37L225 46L217 55"/>'
  ];
  function illustrate(){document.querySelectorAll('.service-card').forEach((card,i)=>{
    if(card.querySelector('.service-illustration'))return;
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 250 95');svg.classList.add('service-illustration');svg.setAttribute('aria-hidden','true');
    // Only hard-coded, trusted SVG drawings; no CMS input is interpreted as HTML.
    svg.innerHTML=drawings[i%drawings.length];card.prepend(svg);
  });}
  const grid=document.querySelector('#service-grid');
  const observer=new MutationObserver(()=>{observer.disconnect();illustrate();observer.observe(grid,{childList:true});});
  illustrate();observer.observe(grid,{childList:true});
})();
