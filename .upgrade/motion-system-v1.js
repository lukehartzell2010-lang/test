/* JJK Archive Motion System v1.1
   Fail-safe mobile motion: content is never hidden and every transition cleans itself up. */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const supportsWAAPI = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  const $m = selector => document.querySelector(selector);
  const $$m = selector => [...document.querySelectorAll(selector)];

  // Remove v1 CSS and undo any state it may have left behind.
  document.querySelector("#motion-system-v1-styles")?.remove();
  document.querySelector("#motion-system-v1-1-styles")?.remove();

  function forceVisible(root = document) {
    const selectors = [
      "#answerContent", "#answerContent > *", "#answerContent .answer-section",
      "#queryBreakdown", "#queryBreakdown > *", "#relatedResults", "#relatedResults > *",
      ".answer-panel", ".related-panel", ".deep-dive-v4", ".dossier-head",
      ".dossier-body", ".dossier-section", ".dossier-card"
    ].join(",");
    root.querySelectorAll?.(selectors).forEach(element => {
      element.classList.remove("motion-answer-out", "motion-reveal-item", "motion-revealed", "motion-dossier-enter");
      element.style.removeProperty("opacity");
      element.style.removeProperty("filter");
      element.style.removeProperty("visibility");
      element.style.removeProperty("clip-path");
      element.style.removeProperty("transform");
      element.style.removeProperty("animation-delay");
    });
  }
  forceVisible();

  const style = document.createElement("style");
  style.id = "motion-system-v1-1-styles";
  style.textContent = `
    :root{--motion-spring:cubic-bezier(.2,.82,.2,1);--motion-fast:145ms}
    html{scroll-behavior:smooth}body{overflow-x:hidden}body.motion-searching{cursor:progress}

    /* Permanent safety net: motion may move content, but may never hide it. */
    #answerContent,#answerContent *,#queryBreakdown,#queryBreakdown *,#relatedResults,#relatedResults *,
    .answer-panel,.related-panel,.deep-dive-v4,.deep-dive-v4 *{
      visibility:visible;
    }
    .motion-answer-out,.motion-reveal-item,.motion-revealed,.motion-dossier-enter{
      opacity:1!important;visibility:visible!important;filter:none!important;clip-path:none!important;
    }

    .view.active.motion-view-enter{animation:motionSafeView .36s var(--motion-spring)}
    @keyframes motionSafeView{from{opacity:.82;transform:translate3d(0,8px,0) scale(.997)}to{opacity:1;transform:none}}

    .search-box,.answer-panel,.related-panel,.category-card,.browse-card,.related-card,.dossier-card,
    .prompt-chip,.nav-item,.segment,.random-button,.notebook-button,.icon-button,.back-button,
    .text-button,.source-link,.auto-item,.dossier-nav a{
      -webkit-tap-highlight-color:transparent;transform:translateZ(0)
    }
    button,.source-link,.dossier-nav a{position:relative}
    button:not(:disabled),.source-link,.dossier-nav a{
      transition:transform var(--motion-fast) var(--motion-spring),border-color .2s ease,
      background-color .2s ease,box-shadow .24s ease,filter .2s ease,color .2s ease
    }
    button:not(:disabled):active,.source-link:active,.dossier-nav a:active{transform:scale(.978)}

    .category-card,.browse-card,.related-card,.dossier-card{
      transition:transform .26s var(--motion-spring),border-color .24s ease,
      background-color .24s ease,box-shadow .28s ease
    }
    @media(hover:hover){.category-card:hover,.browse-card:hover,.related-card:hover,.dossier-card:hover{
      transform:translateY(-3px);box-shadow:0 15px 34px rgba(0,0,0,.2),0 0 0 1px rgba(159,102,255,.08)
    }}

    .motion-ripple{position:absolute;border-radius:999px;pointer-events:none;z-index:8;width:18px;height:18px;
      margin:-9px 0 0 -9px;background:radial-gradient(circle,rgba(220,198,255,.4) 0,
      rgba(159,102,255,.16) 42%,transparent 72%);animation:motionSafeRipple .46s ease-out forwards;mix-blend-mode:screen}
    @keyframes motionSafeRipple{to{opacity:0;transform:scale(7)}}

    .search-box.motion-focus-flare{animation:motionSafeFocus .48s var(--motion-spring)}
    @keyframes motionSafeFocus{40%{box-shadow:0 0 0 5px rgba(159,102,255,.09),0 18px 58px rgba(0,0,0,.3)}}

    .answer-panel{isolation:isolate}.answer-panel:before{content:"";position:absolute;top:0;bottom:0;left:0;width:2px;
      opacity:0;pointer-events:none;z-index:4;background:linear-gradient(180deg,transparent,#ae7cff 26%,#e0caff 50%,#7e43e8 74%,transparent);
      filter:drop-shadow(0 0 7px rgba(159,102,255,.7))}
    body.motion-searching .answer-panel:before{animation:motionSafeScan 1.05s ease-in-out infinite}
    @keyframes motionSafeScan{0%{left:0;opacity:0}15%{opacity:.75}85%{opacity:.75}100%{left:calc(100% - 2px);opacity:0}}
    body.motion-searching .search-box{border-color:rgba(190,155,255,.8);box-shadow:0 0 0 4px rgba(159,102,255,.08),0 18px 62px rgba(0,0,0,.34)}
    body.motion-searching .search-box>button{animation:motionSafeSearchButton .9s ease-in-out infinite}
    @keyframes motionSafeSearchButton{50%{filter:brightness(1.16);transform:translateY(-1px) scale(1.025)}}

    .loading-orb{position:relative;isolation:isolate;box-shadow:0 0 0 1px rgba(159,102,255,.13),0 0 25px rgba(159,102,255,.13)}
    .loading-orb:before,.loading-orb:after{content:"";position:absolute;inset:-9px;border-radius:50%;border:1px solid transparent;
      border-top-color:rgba(183,139,255,.7);border-right-color:rgba(183,139,255,.2);animation:motionSafeOrbit 1.1s linear infinite}
    .loading-orb:after{inset:-17px;animation-duration:1.7s;animation-direction:reverse;border-top-color:rgba(224,202,255,.38)}
    @keyframes motionSafeOrbit{to{transform:rotate(360deg)}}

    .motion-answer-ready{animation:motionSafeSettle .34s var(--motion-spring)}
    @keyframes motionSafeSettle{from{opacity:.76;transform:translateY(7px)}to{opacity:1;transform:none}}
    .motion-safe-reveal{animation:motionSafeReveal .34s var(--motion-spring)}
    @keyframes motionSafeReveal{from{opacity:.72;transform:translateY(7px)}to{opacity:1;transform:none}}
    .deep-dive-v4.motion-safe-dossier{animation:motionSafeDossier .46s var(--motion-spring)}
    @keyframes motionSafeDossier{from{opacity:.74;transform:translateY(11px) scale(.995)}to{opacity:1;transform:none}}

    .dossier-nav a.motion-active-section{color:white;border-color:rgba(181,138,255,.58);background:rgba(159,102,255,.12);box-shadow:0 0 18px rgba(159,102,255,.1)}
    .icon-button.motion-pop{animation:motionSafePop .4s var(--motion-spring)}
    @keyframes motionSafePop{35%{transform:scale(1.14) rotate(-5deg)}70%{transform:scale(.98) rotate(1deg)}100%{transform:none}}
    .sidebar{transition:transform .32s var(--motion-spring),box-shadow .32s ease}
    body.menu-open .sidebar{box-shadow:22px 0 66px rgba(0,0,0,.42)}
    #toast.show{animation:motionSafeToast .32s var(--motion-spring)}
    @keyframes motionSafeToast{from{opacity:.55;transform:translate(-50%,8px) scale(.98)}to{opacity:1;transform:translate(-50%,0) scale(1)}}

    @media(max-width:740px){.view.active.motion-view-enter{animation-duration:.3s}.deep-dive-v4.motion-safe-dossier{animation-duration:.38s}.ambient{animation:none}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
  `;
  document.head.appendChild(style);

  function restartClass(element, className, duration = 600) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function animateSafe(element, keyframes, options) {
    if (!element || reducedMotion || !supportsWAAPI) return;
    try {
      const animation = element.animate(keyframes, { ...options, fill: "none" });
      const cleanup = () => {
        element.style.removeProperty("opacity");
        element.style.removeProperty("filter");
        element.style.removeProperty("transform");
        element.style.removeProperty("visibility");
      };
      animation.finished.then(cleanup, cleanup);
      window.setTimeout(cleanup, (options?.delay || 0) + (options?.duration || 0) + 120);
    } catch { forceVisible(); }
  }

  function revealResults() {
    forceVisible();
    restartClass($m(".answer-panel"), "motion-answer-ready", 520);
    restartClass($m(".related-panel"), "motion-answer-ready", 520);

    const elements = [
      ...$$m("#queryBreakdown .break-chip"),
      ...$$m("#answerContent > :not(.deep-dive-v4)"),
      ...$$m("#answerContent .answer-section"),
      ...$$m("#relatedResults > *")
    ].filter((element, index, array) => array.indexOf(element) === index).slice(0, 28);

    elements.forEach((element, index) => {
      element.style.animationDelay = `${Math.min(index * 28, 280)}ms`;
      restartClass(element, "motion-safe-reveal", 760);
    });
    const dossier = $m("#answerContent .deep-dive-v4");
    if (dossier) restartClass(dossier, "motion-safe-dossier", 720);

    // Safari can interrupt CSS animations during layout. Reassert visibility twice.
    window.setTimeout(() => forceVisible(), 180);
    window.setTimeout(() => forceVisible(), 900);
  }

  const previousShowView = typeof showView === "function" ? showView : null;
  if (previousShowView) {
    showView = function motionShowViewSafe(viewId) {
      previousShowView(viewId);
      forceVisible();
      restartClass($m(viewId), "motion-view-enter", 520);
    };
  }

  const previousPerformSearch = typeof performSearch === "function" ? performSearch : null;
  let searchSequence = 0;
  if (previousPerformSearch) {
    performSearch = async function motionPerformSearchSafe(rawQuery) {
      const sequence = ++searchSequence;
      document.body.classList.add("motion-searching");
      restartClass($m(".search-box"), "motion-focus-flare", 600);

      // Existing answer remains visible while the next one is prepared.
      const current = $m("#answerContent");
      animateSafe(current,
        [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-2px)", opacity: .82 }, { transform: "translateY(0)", opacity: 1 }],
        { duration: 180, easing: "ease-out" }
      );

      try {
        await previousPerformSearch(rawQuery);
      } finally {
        if (sequence === searchSequence) {
          document.body.classList.remove("motion-searching");
          forceVisible();
          requestAnimationFrame(() => requestAnimationFrame(revealResults));
        }
      }
    };
  }

  document.addEventListener("pointerdown", event => {
    if (reducedMotion) return;
    const target = event.target.closest("button,.source-link,.dossier-nav a");
    if (!target || target.disabled) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "motion-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    window.setTimeout(() => ripple.remove(), 700);
  }, { passive: true });

  document.addEventListener("click", event => {
    const icon = event.target.closest(".icon-button");
    if (icon) restartClass(icon, "motion-pop", 520);

    const navLink = event.target.closest(".dossier-nav a");
    if (navLink) {
      const dossier = navLink.closest(".deep-dive-v4");
      const href = navLink.getAttribute("href") || "";
      const target = href.startsWith("#") ? dossier?.querySelector(href) : null;
      if (target) {
        event.preventDefault();
        dossier.querySelectorAll(".dossier-nav a").forEach(link => link.classList.remove("motion-active-section"));
        navLink.classList.add("motion-active-section");
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        restartClass(target, "motion-answer-ready", 520);
        window.setTimeout(() => forceVisible(target), 600);
      }
    }
  });

  const observer = new MutationObserver(mutations => {
    forceVisible();
    if (reducedMotion) return;
    const added = mutations.flatMap(mutation => [...mutation.addedNodes]).filter(node => node.nodeType === 1);
    const cards = [];
    for (const node of added) {
      if (node.matches?.(".category-card,.browse-card,.related-card,.dossier-card,.auto-item")) cards.push(node);
      cards.push(...(node.querySelectorAll?.(".category-card,.browse-card,.related-card,.dossier-card,.auto-item") || []));
    }
    cards.slice(0, 24).forEach((card, index) => animateSafe(card,
      [{ opacity: .78, transform: "translateY(7px) scale(.992)" }, { opacity: 1, transform: "none" }],
      { duration: 300, delay: Math.min(index * 25, 220), easing: "cubic-bezier(.2,.82,.2,1)" }
    ));
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Global watchdog: no motion state is allowed to hide content for more than a moment.
  window.setInterval(forceVisible, 1500);
  window.addEventListener("pageshow", () => forceVisible());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) forceVisible(); });

  document.documentElement.dataset.motionSystem = VERSION;
  document.body.classList.add("motion-ready");
  forceVisible();
  console.info(`[JJK Archive] Motion System v${VERSION} active`);
})();
