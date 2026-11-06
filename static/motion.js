/* Progressive enhancement: no network requests, no changes to application data. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const header = q('.top');
  let scrollQueued = false;
  const numbers = [];
  const updateScroll = () => {
    header.classList.toggle('compact', scrollY > 40);
    numbers.filter(n => n.isConnected).forEach(n => {
      const y = n.getBoundingClientRect().top;
      n.style.setProperty('--fill', `${Math.max(0, Math.min(100, (innerHeight - y) / (innerHeight * .65) * 100))}%`);
    });
    scrollQueued = false;
  };
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, {passive:true});
  const reveal = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting) { e.target.classList.remove('pending'); reveal.unobserve(e.target); }
  }), {threshold:.08});
  const enhanced = new WeakSet();
  const enhance = () => {
    qa('.service-card,.project-card,.process-card,.article-card,.section-head,.architect-panel,.request-panel').forEach(card => {
      if(enhanced.has(card)) return;
      enhanced.add(card);
      card.classList.add('reveal');
      if(!reduced.matches && card.getBoundingClientRect().top > innerHeight) card.classList.add('pending');
      reveal.observe(card);
      if(card.matches('article,.architect-panel,.request-panel')) {
        card.classList.add('spotlight');
        let frame;
        card.addEventListener('pointermove', e => {
          if(!fine.matches || reduced.matches || frame) return;
          frame = requestAnimationFrame(() => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX-r.left}px`);
            card.style.setProperty('--my', `${e.clientY-r.top}px`);
            frame = null;
          });
        });
      }
    });
    qa('.blueprint-card').forEach((c,i) => c.style.setProperty('--delay', `${Math.min(i,7)*90}ms`));
    qa('.section .eyebrow').forEach(label => {
      if(label.querySelector('.section-number')) return;
      const match = label.textContent.match(/^(0[1-5])\s*\//);
      if(!match) return;
      const number = document.createElement('span');
      number.className='section-number'; number.setAttribute('aria-hidden','true'); number.dataset.number=match[1]; number.textContent=match[1];
      label.textContent=label.textContent.slice(match[0].length).trim();
      const accessible=document.createElement('span'); accessible.className='sr-only'; accessible.textContent=match[1]+' / '; label.prepend(number,accessible); numbers.push(number);
    });
    const title=q('#hero-title');
    if(!title.querySelector('.hero-word')) {
      const lines=title.textContent.split('\n');
      title.replaceChildren();
      let index=0;
      lines.forEach((line,l) => {
        if(l) title.append(document.createElement('br'));
        const words=line.trim().split(/\s+/);
        words.forEach((word,i) => {
          const span=document.createElement('span');
          span.className='hero-word'+(l===lines.length-1 && (lines.length>1 || i>=words.length-Math.min(2,Math.ceil(words.length/2)))?' key':'');
          span.textContent=word;span.style.setProperty('--delay',`${index++*65}ms`);
          title.append(span,document.createTextNode(' '));
        });
      });
    }
    updateScroll();
  };
  let queued=false;
  const observer=new MutationObserver(() => {
    if(queued) return; queued=true;
    requestAnimationFrame(() => {observer.disconnect();enhance();observer.observe(q('main'),{childList:true,subtree:true});queued=false;});
  });
  enhance();observer.observe(q('main'),{childList:true,subtree:true});
  const nav=q('#nav'), indicator=document.createElement('span');
  indicator.className='nav-indicator';indicator.setAttribute('aria-hidden','true');nav.prepend(indicator);
  const moveIndicator=e => {
    const a=e.target.closest('a');if(!a)return;
    const r=a.getBoundingClientRect(),parent=nav.getBoundingClientRect();
    indicator.style.width=`${r.width}px`;indicator.style.height=`${r.height}px`;
    indicator.style.transform=`translate(${r.left-parent.left}px,${r.top-parent.top}px)`;indicator.style.opacity='1';
  };
  nav.addEventListener('pointerover',moveIndicator);nav.addEventListener('focusin',moveIndicator);
  nav.addEventListener('pointerleave',()=>indicator.style.opacity='0');nav.addEventListener('focusout',()=>indicator.style.opacity='0');
  qa('.nav-cta,.hero-actions .btn').forEach(button => {
    button.addEventListener('pointermove',e=>{if(!fine.matches||reduced.matches)return;const r=button.getBoundingClientRect();button.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.09}px,${(e.clientY-r.top-r.height/2)*.12}px)`;});
    button.addEventListener('pointerleave',()=>button.style.transform='');
  });
  // SVG paths are measured against the actual responsive node positions.
  const art=q('.system-art'), ns='http://www.w3.org/2000/svg';
  art.removeAttribute('role');
  const svg=document.createElementNS(ns,'svg');svg.classList.add('data-beams');svg.setAttribute('aria-hidden','true');art.prepend(svg);
  const beams=qa('.node').map(node=>{
    node.tabIndex=0;
    const path=document.createElementNS(ns,'path');path.classList.add('beam-track');svg.append(path);
    const dot=document.createElementNS(ns,'circle');dot.classList.add('beam-dot');dot.setAttribute('r','3');svg.append(dot);
    const beam={node,path,dot,progress:Math.random(),hot:false,length:0};
    ['pointerenter','focus'].forEach(event=>node.addEventListener(event,()=>beam.hot=true));
    ['pointerleave','blur'].forEach(event=>node.addEventListener(event,()=>beam.hot=false));
    return beam;
  });
  const layout=()=>{
    const r=art.getBoundingClientRect(),c=q('.core');
    // offset values are unaffected by the node's hover transform.
    const cx=c.offsetLeft,cy=c.offsetTop;
    svg.setAttribute('viewBox',`0 0 ${art.clientWidth} ${art.clientHeight}`);
    beams.forEach(b=>{
      const x=b.node.offsetLeft+b.node.offsetWidth/2,y=b.node.offsetTop+b.node.offsetHeight/2;
      b.path.setAttribute('d',`M ${cx} ${cy} C ${x} ${cy}, ${cx} ${y}, ${x} ${y}`);
      b.length=b.path.getTotalLength();
    });
  };
  new ResizeObserver(layout).observe(art);document.fonts.ready.then(layout);
  const track=q('.tech-strip>.wrap'), originals=[...track.children];
  const colors=['#f4c64e','#55c5b4','#ff8498','#aa9bff','#f2779a','#60b7fa','#e6cf58'];
  originals.forEach((s,i)=>s.style.setProperty('--brand',colors[i]));
  for(let i=0;i<2;i++) originals.forEach(s=>{const copy=s.cloneNode(true);copy.setAttribute('aria-hidden','true');track.append(copy);});
  let marqueeHot=false, speed=1,position=0,artVisible=true,marqueeVisible=true,last=0,raf=0;
  track.parentElement.addEventListener('pointerenter',()=>marqueeHot=true);track.parentElement.addEventListener('pointerleave',()=>marqueeHot=false);
  new IntersectionObserver(entries=>entries.forEach(e=>{if(e.target===art)artVisible=e.isIntersecting;else marqueeVisible=e.isIntersecting;})).observe(art);
  const marqueeObserver=new IntersectionObserver(entries=>marqueeVisible=entries[0].isIntersecting);marqueeObserver.observe(track.parentElement);
  const tick=now=>{
    const dt=Math.min((now-last)/1000,.05)||0;last=now;
    if(artVisible)beams.forEach(b=>{if(!b.length)return;b.progress=(b.progress+dt*(b.hot?.45:.13))%1;const p=b.path.getPointAtLength(b.progress*b.length);b.dot.style.transform=`translate(${p.x}px,${p.y}px)`;});
    if(marqueeVisible){speed+=(Number(!marqueeHot)-speed)*.06;const width=track.scrollWidth/3;position=(position+dt*27*speed)%width;track.style.transform=`translateX(${-position}px)`;}
    raf=requestAnimationFrame(tick);
  };
  const motionState=()=>{
    cancelAnimationFrame(raf);last=0;
    const stopped=document.hidden||reduced.matches;document.body.classList.toggle('motion-paused',stopped);
    if(!stopped)raf=requestAnimationFrame(tick);
    else if(reduced.matches){track.style.transform='';qa('.reveal.pending').forEach(e=>e.classList.remove('pending'));beams.forEach(b=>b.dot.style.opacity='0');}
    if(!reduced.matches)beams.forEach(b=>b.dot.style.opacity='1');
  };
  reduced.addEventListener('change',motionState);document.addEventListener('visibilitychange',motionState);motionState();
  // Native details semantics remain. Only the inner content is transformed.
  qa('details.playground').forEach(details=>{
    const summary=details.querySelector('summary'),body=document.createElement('div');body.className='accordion-body';
    [...details.children].filter(c=>c!==summary).forEach(c=>body.append(c));details.append(body);
    let running;
    summary.addEventListener('click',e=>{
      if(reduced.matches)return;e.preventDefault();if(running)return;
      const opening=!details.open;if(opening)details.open=true;
      running=body.animate(opening?[{opacity:0,transform:'translateY(-12px) scaleY(.96)'},{opacity:1,transform:'translateY(2px) scaleY(1.005)'},{opacity:1,transform:'none'}]:[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-10px) scaleY(.97)'}],{duration:opening?420:180,easing:'cubic-bezier(.2,.8,.2,1)'});
      running.onfinish=()=>{if(!opening)details.open=false;running=null;};
    });
  });
})();
