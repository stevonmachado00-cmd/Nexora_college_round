/* Applies viewport-safe entry motion after each single-page workspace render. */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const selector='.pagehead,.metrics,.card,.ds-section,.board,.workflow-grid,.sites-grid,.agent-page,.integration-panel,.competitive-analysis-head,.analysis-columns';
 let observer;
 const reveal=scope=>{
  if(reduce.matches||!document.body.classList.contains('workspace-page'))return;
  observer?.disconnect();
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('nx-motion-visible');observer.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -4%'});
  [...scope.querySelectorAll(selector)].forEach((item,index)=>{if(item.dataset.nxMotionBound)return;item.dataset.nxMotionBound='true';item.style.setProperty('--nx-motion-index',String(index));observer.observe(item);});
 };
 const schedule=()=>requestAnimationFrame(()=>reveal(document));
 document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('nx-motion-ready');new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:true});schedule();});
 reduce.addEventListener?.('change',schedule);
})();
