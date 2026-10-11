/* Scroll-driven homepage film. The following product sections remain intentionally lightweight. */
function renderHome(){
 const {icon,mark}=NexusUI;
 if(!document.querySelector('link[href="/home-transitions.css"]')){
  const transitions=document.createElement('link');
  transitions.rel='stylesheet';
  transitions.href='/home-transitions.css';
  document.head.append(transitions);
 }
 document.getElementById('app').innerHTML=`<div class="nx-home ds-home nx-film-home">
  <header class="ds-home-nav nx-film-nav"><a class="ds-brand" href="#home" data-scroll="home" aria-label="Nexus homepage">${mark()}<span>Nexus</span></a><nav aria-label="Main navigation"><a href="#home" data-scroll="home">Home</a><a href="#platform-scenes" data-scroll="platform-scenes">Platform</a><a href="#projects-showcase" data-scroll="projects-showcase">Examples</a><a href="#questions" data-scroll="questions">Questions</a></nav><div><button class="btn" data-page="overview">Open workspace</button><button class="ds-mobile-nav" data-home-menu aria-label="Toggle menu">${icon('menu')}</button></div></header>
  <main>
   <section class="nx-film-hero" id="home" data-film-section aria-label="Nexus product film">
    <div class="nx-film-stage">
     <video class="nx-film-video" data-scroll-film muted playsinline preload="metadata" aria-label="Nexus product film"><source src="/media/nexus-hero-scroll.mp4" type="video/mp4"></video>
     <div class="nx-film-shade" aria-hidden="true"></div>
     <a class="nx-film-explore" href="#platform-scenes" data-scroll="platform-scenes">Explore Now <span aria-hidden="true">↘</span></a>
    </div>
   </section>
   <section class="nx-film-chapter nx-film-chapter--continuation" data-film-section aria-label="Nexus in motion">
    <div class="nx-film-stage">
     <video class="nx-film-video" data-scroll-film muted playsinline preload="metadata" aria-label="Nexus brand world film"><source src="/media/nexus-continuation-revised.mp4" type="video/mp4"></video>
     <div class="nx-film-chapter-copy">
      <div class="nx-film-message nx-film-message--creative">
       <p class="eyebrow">Built with intention</p>
       <h2 class="heading">Make the next idea unmistakably yours.</h2>
       <p class="body">A considered system for the work, people, and momentum behind what comes next.</p>
      </div>
      <div class="nx-film-message nx-film-message--forward">
       <p class="eyebrow">Introducing Nexus</p>
       <h2 class="heading">Everything that moves your business forward.</h2>
       <p class="body">One considered workspace for your brand, your customers, and every next move.</p>
      </div>
     </div>
    </div>
   </section>
   <section class="ds-home-proof" aria-label="What belongs together"><div><strong>01</strong><span>Make the first impression</span></div><div><strong>02</strong><span>Understand the person</span></div><div><strong>03</strong><span>Choose the next step</span></div></section>
   <section class="nx-film-chapter nx-film-chapter--title" id="platform-scenes" data-film-section aria-label="Introducing Nexus">
    <div class="nx-film-stage">
     <video class="nx-film-video" data-scroll-film muted playsinline preload="metadata" aria-label="Nexus title film"><source src="/media/nexus-title-film-clean.mp4" type="video/mp4"></video>
     <div class="nx-film-chapter-copy">
      <div class="nx-film-message nx-film-message--thesis">
       <p class="eyebrow">The connected business</p>
       <h2 class="heading">Good decisions start with the whole picture.</h2>
       <p class="body">Each part of Nexus has a distinct role. Together, they give your work continuity.</p>
      </div>
      <div class="nx-film-capabilities" aria-label="Nexus capabilities">
       <p class="eyebrow">One connected system</p>
       <ol>
        <li>${icon('website',24)}<div><h3>Build your presence</h3><p>Start with an editable website foundation that reflects your business.</p></div></li>
        <li>${icon('crm',24)}<div><h3>Know your audience</h3><p>Keep the people and conversations behind growth in view.</p><button class="nx-film-capability-link" data-page="crm">Open demo CRM <span aria-hidden="true">↗</span></button></div></li>
        <li>${icon('campaigns',24)}<div><h3>Find a clearer direction</h3><p>Review public campaign evidence and prepare your next move.</p></div></li>
       </ol>
      </div>
      <div class="nx-film-final-cta">
       <p class="eyebrow">Designed for action</p>
       <h2 class="heading">Bring your next idea into focus.</h2>
       <p class="body">Start with a website. Let the rest of the workspace grow with your business.</p>
       <a class="nx-film-final-link" href="/builder">Start a website <span aria-hidden="true">↗</span></a>
      </div>
     </div>
    </div>
   </section>
   <section class="ds-home-section ds-home-projects" id="projects-showcase"><div class="ds-home-section-head"><span class="ds-overline">Ways to begin</span><h2>A workspace shaped around your ambition.</h2><p>Choose a starting point. Make it entirely yours.</p></div><div class="ds-home-project-grid">${[['saas-modern','Product teams','A product story with a clear path to action.'],['agency-clean','Studios and agencies','Present the work and make inquiries count.'],['event-summit','Events and education','Turn an invitation into an ongoing relationship.']].map(([id,name,description])=>`<a href="/builder?template=${id}"><div class="ds-home-project-art art-${id}"><span>${icon(id==='event-summit'?'webinars':'website',32)}</span><i></i><i></i><i></i></div><span class="ds-overline">Website foundation</span><h3>${name}</h3><p>${description}</p></a>`).join('')}</div></section>
   <section class="ds-home-section ds-home-faq" id="questions"><div><span class="ds-overline">Questions</span><h2>The essentials, clearly answered.</h2></div><div><details open><summary>What is Nexus?</summary><p>A connected business workspace for websites, customers, campaigns, events and analytics.</p></details><details><summary>What can I use locally?</summary><p>You can build and publish website projects locally, manage webinars, and explore the other connected workspaces. Some integrations need local setup.</p></details><details><summary>Can I customize a website?</summary><p>Yes. Start from a foundation and edit the sections, content and visual theme in the builder.</p></details></div></section>
  </main>
  <footer class="ds-home-footer"><div class="ds-brand">${mark()}<span>Nexus</span></div><span>One workspace. A clearer way forward.</span><button data-page="overview">Open workspace</button></footer></div>`;
 requestAnimationFrame(initScrollFilms);
}

let stopScrollFilms=()=>{};

function initScrollFilms(){
 stopScrollFilms();
 const films=[...document.querySelectorAll('[data-scroll-film]')].map(video=>({
  section:video.closest('[data-film-section]'),video,duration:0,lastTime:-1,targetTime:-1,lastAmount:-1,phase:'',start:0,end:0,span:1,warmed:false,seeking:false
 })).filter(({section})=>section);
 if(!films.length) return;
 const controller=new AbortController();
 const frameStep=1/24;
 const measure=()=>films.forEach(film=>{
  film.start=film.section.offsetTop;
  film.span=Math.max(1,film.section.offsetHeight-innerHeight);
  film.end=film.start+film.span;
 });
 const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.dataset.revealed='true';revealObserver.unobserve(entry.target);}
  });
 },{threshold:.22});
 const warmObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting) return;
   const film=films.find(item=>item.section===entry.target);
   if(film&&!film.warmed){film.warmed=true;film.video.preload='auto';film.video.load();}
   warmObserver.unobserve(entry.target);
  });
 },{rootMargin:'150% 0px'});
 // Browsers cannot cancel an H.264 seek once it has reached the decoder. Keeping
 // one seek in flight prevents the continuation film from building a backlog of
 // obsolete seeks during a trackpad or wheel gesture.
 const seekToTarget=film=>{
  if(!film.duration||film.seeking||film.targetTime<0) return;
  if(Math.abs(film.targetTime-film.video.currentTime)<frameStep*.5){film.lastTime=film.targetTime;return;}
  film.seeking=true;
  film.video.currentTime=film.targetTime;
 };
 let frame=0;
 const update=()=>{
  frame=0;
  const scrollTop=scrollY;
  const film=films.find(item=>scrollTop>=item.start&&scrollTop<=item.end)
   ||films.find(item=>scrollTop<item.start&&item.start-scrollTop<=innerHeight)
   ||[...films].reverse().find(item=>scrollTop>item.end&&scrollTop-item.end<=innerHeight);
  if(!film) return;
  const {section,video}=film;
  const isContinuation=section.classList.contains('nx-film-chapter--continuation');
  const amount=Math.min(1,Math.max(0,(scrollTop-film.start)/film.span));
  if(Math.abs(amount-film.lastAmount)>=.001){
   // The continuation already has a full-frame video and layered copy. Avoiding
   // an extra compositor transform on it leaves decoding capacity for scrubbing.
   if(!isContinuation){
    section.style.setProperty('--film-scale',(1+amount*.035).toFixed(4));
    section.style.setProperty('--film-translate',`${(-amount*.65).toFixed(3)}%`);
    section.style.setProperty('--film-shade',(.06+amount*.34).toFixed(3));
    section.style.setProperty('--film-frame',(.28+amount*.5).toFixed(3));
   }
   film.lastAmount=amount;
  }
  const phase=isContinuation?(amount>=.5?'forward':'creative'):section.classList.contains('nx-film-chapter--title')?(amount>=.76?'cta':amount>=.32?'capabilities':'thesis'):'';
  if(phase&&phase!==film.phase){
   film.phase=phase;
   if(section.classList.contains('nx-film-chapter--continuation')) section.dataset.continuationPhase=phase;
   if(section.classList.contains('nx-film-chapter--title')) section.dataset.titlePhase=phase;
  }
  if(film.duration){
   const raw=Math.min(film.duration-.04,Math.max(0,amount*(film.duration-.04)));
   const next=Math.round(raw/frameStep)*frameStep;
   if(isContinuation){
    if(Math.abs(next-film.targetTime)>=frameStep*.75){film.targetTime=next;seekToTarget(film);}
   }else if(Math.abs(next-film.lastTime)>=frameStep*.75){
    // Keep the hero and title-film cadence exactly as before.
    video.currentTime=next;
    film.lastTime=next;
   }
  }
 };
 const queue=()=>{if(!frame) frame=requestAnimationFrame(update)};
 films.forEach(film=>{
  const ready=()=>{film.duration=Number.isFinite(film.video.duration)?film.video.duration:0;queue();};
  film.video.addEventListener('loadedmetadata',ready,{once:true,signal:controller.signal});
  film.video.addEventListener('durationchange',ready,{once:true,signal:controller.signal});
  film.video.addEventListener('seeked',()=>{
   film.seeking=false;
   film.lastTime=film.video.currentTime;
   seekToTarget(film);
  },{signal:controller.signal});
  if(film.video.readyState>=1) ready();
  if(film.section.classList.contains('nx-film-chapter')) revealObserver.observe(film.section);
  warmObserver.observe(film.section);
 });
 measure();
 addEventListener('scroll',queue,{passive:true,signal:controller.signal});
 addEventListener('resize',()=>{measure();queue();},{passive:true,signal:controller.signal});
 stopScrollFilms=()=>{controller.abort();revealObserver.disconnect();warmObserver.disconnect();if(frame)cancelAnimationFrame(frame);};
 update();
}
