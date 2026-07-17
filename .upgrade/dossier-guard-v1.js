/* JJK Archive Dossier Context Guard v1
   Prevents a single-character dossier from distorting answers about a whole fandom-defined group. */
(() => {
  "use strict";
  const VERSION = "1.0.0";
  const previousPerformSearch = performSearch;

  function questionType() {
    const chips = [...document.querySelectorAll("#queryBreakdown .break-chip")];
    const chip = chips.find(node => /^question type$/i.test(node.childNodes[0]?.textContent?.trim() || ""));
    return chip?.querySelector("b")?.textContent?.trim() || "";
  }

  function removeMisleadingSingleDossier() {
    if (!/group-definition question/i.test(questionType())) return;
    const container = document.querySelector("#answerContent");
    if (!container?.querySelector(".contextual-answer-v7,.reasoning-answer-v6")) return;
    container.querySelectorAll(".deep-dive-v4,.deep-dossier-divider").forEach(node => node.remove());
    state.currentAnswerText = container.innerText;
  }

  performSearch = async function performSearchDossierGuardV1(rawQuery) {
    await previousPerformSearch(rawQuery);
    removeMisleadingSingleDossier();
  };

  window.applyDossierContextGuardV1 = removeMisleadingSingleDossier;
  document.documentElement.dataset.dossierGuard = VERSION;
  console.info(`[JJK Archive] Dossier Context Guard v${VERSION} active`);
})();
