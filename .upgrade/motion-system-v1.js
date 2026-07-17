/* JJK Archive Motion System v1
   Mobile-safe transitions, search choreography, press feedback, and staggered reveals. */
(() => {
  "use strict";
  if (document.documentElement.dataset.motionSystem === "1.0.0") return;

  const VERSION = "1.0.0";
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const supportsWAAPI = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  const $m = selector => document.querySelector(selector);
  const $$m = selector => [...document.querySelectorAll(selector)];

  const style = document.createElement("style");
  style.id = "motion-system-v1-styles";
  style.textContent = `
    :root{--motion-spring:cubic-bezier(.2,.82,.2,1);--motion-fast:150ms}
    html{scroll-behavior:smooth}body{overflow-x:hidden}body.motion-searching{cursor:progress}
    .view.active.motion-view-enter{animation:motionViewEnter .46s var(--motion-spring) both}
    @keyframes motionViewEnter{0%{opacity:0;transform:translate3d(0,14px,0) scale(.992);filter:blur(5px)}55%{filter:blur(0)}100%{opacity:1;transform:none;filter:none}}
    .search-box,.answer-panel,.related-panel,.category-card,.browse-card,.related-card,.dossier-card,.prompt-chip,.nav-item,.segment,.random-button,.notebook-button,.icon-button,.back-button,.text-button,.source-link,.auto-item,.dossier-nav a{-webkit-tap-highlight-color:transparent;transform:translateZ(0)}
    button,.source-link,.dossier-nav a{position:relative}button:not(:disabled),.source-link,.dossier-nav a{transition:transform var(--motion-fast) var(--motion-spring),border-color .2s ease,background-color .2s ease,box-shadow .25s ease,filter .2s ease,color .2s ease}button:not(:disabled):active,.source-link:active,.dossier-nav a:active{transform:scale(.975)}
    .category-card,.browse-card,.related-card,.dossier-card{transition:transform .28s var(--motion-spring),border-color .25s ease,background-color .25s ease,box-shadow .3s ease,opacity .25s ease;will-change:transform}
    @media(hover:hover){.category-card:hover,.browse-card:hover,.related-card:hover,.dossier-card:hover{transform:translateY(-3px);box-shadow:0 16px 38px rgba(0,0,0,.22),0 0 0 1px rgba(159,102,255,.08)}}
    .motion-ripple{position:absolute;border-radius:999px;pointer-events:none;z-index:8;width:18px;height:18px;margin:-9px 0 0 -9px;background:radial-gradient(circle,rgba(220,198,255,.42) 0,rgba(159,102,255,.18) 42%,transparent 72%);animation:motionRipple .54s ease-out forwards;mix-blend-mode:screen}@keyframes motionRipple{to{opacity:0;transform:scale(8)}}
    .search-box.motion-focus-flare{animation:motionFocusFlare .55s var(--motion-spring) both}@keyframes motionFocusFlare{0%{box-shadow:0 0 0 0 rgba(159,102,255,0)}40%{box-shadow:0 0 0 5px rgba(159,102,255,.10),0 18px 65px rgba(0,0,0,.32)}100%{box-shadow:0 0 0 4px rgba(159,102,255,.04),0 18px 65px rgba(0,0,0,.32)}}
    .answer-panel{isolation:isolate}.answer-panel:before{content:"";position:absolute;inset:0 auto 0 0;width:2px;opacity:0;pointer-events:none;z-index:4;background:linear-gradient(180deg,transparent,#ae7cff 26%,#e0caff 50%,#7e43e8 74%,transparent);filter:drop-shadow(0 0 7px rgba(159,102,255,.8))}body.motion-searching .answer-panel:before{animation:motionScan 1.15s ease-in-out infinite}@keyframes motionScan{0%{left:0;opacity:0}12%{opacity:.9}88%{opacity:.9}100%{left:calc(100% - 2px);opacity:0}}
    body.motion-searching .search-box{border-color:rgba(190,155,255,.86);box-shadow:0 0 0 4px rgba(159,102,255,.09),0 20px 72px rgba(0,0,0,.38)}body.motion-searching .search-box>button{animation:motionSearchButton 1s ease-in-out infinite}@keyframes motionSearchButton{50%{filter:brightness(1.2);transform:translateY(-1px) scale(1.035)}}
    .loading-orb{position:relative;isolation:isolate;box-shadow:0 0 0 1px rgba(159,102,255,.13),0 0 28px rgba(159,102,255,.15)}.loading-orb:before,.loading-orb:after{content:"";position:absolute;inset:-9px;border-radius:50%;border:1px solid transparent;border-top-color:rgba(183,139,255,.75);border-right-color:rgba(183,139,255,.22);animation:motionOrbit 1.1s linear infinite}.loading-orb:after{inset:-17px;animation-duration:1.7s;animation-direction:reverse;border-top-color:rgba(224,202,255,.42)}@keyframes motionOrbit{to{transform:rotate(360deg)}}
    .motion-answer-out{pointer-events:none}.motion-answer-ready{animation:motionPanelSettle .42s var(--motion-spring) both}@keyframes motionPanelSettle{0%{opacity:.35;transform:translateY(10px);filter:blur(4px)}100%{opacity:1;transform:none;filter:none}}
    .motion-reveal-item{opacity:0;transform:translateY(12px)}.motion-reveal-item.motion-revealed{animation:motionReveal .46s var(--motion-spring) both}@keyframes motionReveal{to{opacity:1;transform:none}}
    .deep-dive-v4{transform-origin:50% 0}.deep-dive-v4.motion-dossier-enter{animation:motionDossierEnter .58s var(--motion-spring) both}@keyframes motionDossierEnter{0%{opacity:0;transform:translateY(18px) scale(.988);clip-path:inset(0 0 96% 0 round 20px)}58%{clip-path:inset(0 0 0 0 round 20px)}100%{opacity:1;transform:none;clip-path:inset(0 0 0 0 round 20px)}}
    .dossier-nav a.motion-active-section{color:white;border-color:rgba(181,138,255,.58);background:rgba(159,102,255,.12);box-shadow:0 0 18px rgba(159,102,255,.10)}
    .icon-button.motion-pop{animation:motionIconPop .46s var(--motion-spring)}@keyframes motionIconPop{35%{transform:scale(1.18) rotate(-7deg)}70%{transform:scale(.96) rotate(2deg)}100%{transform:none}}
    .sidebar{transition:transform .34s var(--motion-spring),box-shadow .34s ease}body.menu-open .sidebar{box-shadow:22px 0 70px rgba(0,0,0,.45)}.ambient-one{animation:motionAmbientOne 15s ease-in-out infinite alternate}.ambient-two{animation:motionAmbientTwo 18s ease-in-out infinite alternate}@keyframes motionAmbientOne{to{transform:translate3d(-24px,20px,0) scale(1.08)}}@keyframes motionAmbientTwo{to{transform:translate3d(22px,-18px,0) scale(.94)}}
    #toast.show{animation:motionToast .38s var(--motion-spring) both}@keyframes motionToast{0%{opacity:0;transform:translate(-50%,12px) scale(.96)}100%{opacity:1;transform:translate(-50%,0) scale(1)}}
    @media(max-width:740px){.view.active.motion-view-enter{animation-duration:.38s}.deep-dive-v4.motion-dossier-enter{animation-duration:.48s}.ambient{animation:none}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}.motion-reveal-item{opacity:1!important;transform:none!important}}
  `;
  document.head.appendChild(style);

  function animateElement(element, keyframes, options) {
    if (!element || reducedMotion || !supportsWAAPI) return Promise.resolve();
    try { return element.animate(keyframes, options).finished.catch(() => undefined); }
    catch { return Promise.resolve(); }
  }

  function restartClass(element, className, duration = 700) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function revealResults() {
    const answerPanel = $m(".answer-panel");
    const relatedPanel = $m(".related-panel");
    restartClass(answerPanel, "motion-answer-ready", 650);
    if (relatedPanel) restartClass(relatedPanel, "motion-answer-ready", 650);
    const elements = [...$$m("#queryBreakdown .break-chip"),...$$m("#answerContent > :not(.deep-dive-v4)"),...$$m("#answerContent .answer-section"),...$$m("#relatedResults > *")].filter((element,index,array)=>array.indexOf(element)===index).slice(0,28);
    elements.forEach((element,index)=>{element.classList.remove("motion-revealed");element.classList.add("motion-reveal-item");element.style.animationDelay=`${Math.min(index*38,420)}ms`;requestAnimationFrame(()=>element.classList.add("motion-revealed"));});
    const dossier=$m("#answerContent .deep-dive-v4");
    if(dossier)restartClass(dossier,"motion-dossier-enter",900);
  }

  const previousShowView=typeof showView==="function"?showView:null;
  if(previousShowView){showView=function motionShowView(viewId){previousShowView(viewId);restartClass($m(viewId),"motion-view-enter",700);};}

  const previousPerformSearch=typeof performSearch==="function"?performSearch:null;
  let searchSequence=0;
  if(previousPerformSearch){performSearch=async function motionPerformSearch(rawQuery){
    const sequence=++searchSequence;
    const query=String(rawQuery||"").trim();
    const alreadyResults=$m("#resultsView")?.classList.contains("active");
    const answerContent=$m("#answerContent");
    if(query&&alreadyResults&&answerContent&&!reducedMotion){
      answerContent.classList.add("motion-answer-out");
      await animateElement(answerContent,[{opacity:1,transform:"translateY(0)",filter:"blur(0)"},{opacity:0,transform:"translateY(-8px)",filter:"blur(3px)"}],{duration:130,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"});
      answerContent.style.opacity="";answerContent.style.transform="";answerContent.style.filter="";answerContent.classList.remove("motion-answer-out");
    }
    document.body.classList.add("motion-searching");restartClass($m(".search-box"),"motion-focus-flare",700);
    try{await previousPerformSearch(rawQuery);}finally{if(sequence===searchSequence){document.body.classList.remove("motion-searching");requestAnimationFrame(()=>requestAnimationFrame(revealResults));}}
  };}

  document.addEventListener("pointerdown",event=>{
    if(reducedMotion)return;
    const target=event.target.closest("button,.source-link,.dossier-nav a");
    if(!target||target.disabled)return;
    const rect=target.getBoundingClientRect();
    const ripple=document.createElement("span");
    ripple.className="motion-ripple";ripple.style.left=`${event.clientX-rect.left}px`;ripple.style.top=`${event.clientY-rect.top}px`;target.appendChild(ripple);ripple.addEventListener("animationend",()=>ripple.remove(),{once:true});
  },{passive:true});

  document.addEventListener("click",event=>{
    const icon=event.target.closest(".icon-button");if(icon)restartClass(icon,"motion-pop",600);
    const navLink=event.target.closest(".dossier-nav a");
    if(navLink){const dossier=navLink.closest(".deep-dive-v4");const href=navLink.getAttribute("href")||"";const target=href.startsWith("#")?dossier?.querySelector(href):null;if(target){event.preventDefault();dossier.querySelectorAll(".dossier-nav a").forEach(link=>link.classList.remove("motion-active-section"));navLink.classList.add("motion-active-section");target.scrollIntoView({behavior:reducedMotion?"auto":"smooth",block:"start"});restartClass(target,"motion-answer-ready",650);}}
  });

  const observer=new MutationObserver(mutations=>{
    if(reducedMotion)return;
    const added=mutations.flatMap(mutation=>[...mutation.addedNodes]).filter(node=>node.nodeType===1);const cards=[];
    for(const node of added){if(node.matches?.(".category-card,.browse-card,.related-card,.dossier-card,.auto-item"))cards.push(node);cards.push(...(node.querySelectorAll?.(".category-card,.browse-card,.related-card,.dossier-card,.auto-item")||[]));}
    cards.slice(0,30).forEach((card,index)=>animateElement(card,[{opacity:0,transform:"translateY(10px) scale(.985)"},{opacity:1,transform:"none"}],{duration:380,delay:Math.min(index*34,300),easing:"cubic-bezier(.2,.82,.2,1)",fill:"both"}));
  });
  observer.observe(document.body,{childList:true,subtree:true});

  document.documentElement.dataset.motionSystem=VERSION;
  document.body.classList.add("motion-ready");
  console.info(`[JJK Archive] Motion System v${VERSION} active`);
})();
