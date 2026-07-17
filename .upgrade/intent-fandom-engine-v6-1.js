/* JJK Archive Intent & Fandom Reasoning Engine v6.1
   Resolves community vocabulary, group labels, interaction questions, and domain logic
   before generic subject lookup can collapse the question into a dossier. */
(() => {
  "use strict";
  const VERSION = "6.1.0";
  const previousPerformSearch = performSearch;
  const E = id => typeof getEntry === "function" ? getEntry(id) : null;
  const esc = typeof escapeHtml === "function" ? escapeHtml : value => String(value || "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
  const $q = selector => document.querySelector(selector);
  const normalizeQ = text => String(text || "").toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\-\s?]/g, " ")
    .replace(/\s+/g, " ").trim();

  const unique = list => {
    const seen = new Set();
    return list.filter(item => {
      const key = item?.id || item;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  function answerHtml(title, verdict, factors, status = "Intent-aware answer", note = "The response follows the relationship asked about instead of returning separate topic summaries.") {
    return `<div class="intent-fandom-v61"><div class="intent-kicker">${esc(status)}</div><h2 class="answer-title">${esc(title)}</h2><p class="intent-verdict">${esc(verdict)}</p><div class="intent-factor-grid">${factors.map(([label,text]) => `<div class="intent-factor"><h4>${esc(label)}</h4><p>${esc(text)}</p></div>`).join("")}</div><div class="answer-note"><b>Reasoning check:</b> ${esc(note)}</div></div>`;
  }

  function render(query, primaryId, relatedIds, html, intent, audit) {
    const primary = E(primaryId) || relatedIds.map(E).find(Boolean) || null;
    const related = unique(relatedIds.map(E).filter(Boolean));
    state.currentQuery = query;
    state.currentEntryId = primary?.id || null;
    const input = $q("#searchInput"); if (input) input.value = query;
    const autocomplete = $q("#autocomplete"); if (autocomplete) autocomplete.hidden = true;
    const title = $q("#queryTitle"); if (title) title.textContent = query;
    const type = $q("#answerType"); if (type) type.textContent = `Intent & Fandom Engine v${VERSION}`;
    const breakdown = $q("#queryBreakdown");
    if (breakdown) breakdown.innerHTML = [
      ["Intent", intent],
      ["Community wording", audit.community ? "recognized" : "standard"],
      ["Answer target", audit.target]
    ].map(([label,value]) => `<span class="break-chip">${esc(label)}<b>${esc(value)}</b></span>`).join("");
    const container = $q("#answerContent"); if (container) container.innerHTML = html;
    if (typeof renderRelated === "function") renderRelated(primary, related.map(entry => ({entry, score:1})));
    if (typeof showView === "function") showView("#resultsView");
    state.currentAnswerText = container?.innerText || "";
    if (typeof updateSaveButton === "function") updateSaveButton();
  }

  const GROUPS = [
    {
      test: /\b(disaster curses?|disaster spirits?|disaster squad|disaster crew)\b/,
      title: "The Disaster Curses",
      primary: "jogo",
      ids: ["jogo","hanami","dagon","mahito"],
      verdict: "The fandom term “disaster curses” usually refers to Jogo, Hanami, Dagon, and Mahito—the allied special-grade curses who embody humanity’s fear of natural disasters and of other humans.",
      factors: [
        ["Jogo", "Represents fear of volcanic eruptions, fire, and the earth’s destructive heat."],
        ["Hanami", "Represents fear and hostility connected to forests, nature, and environmental destruction."],
        ["Dagon", "Represents fear of the ocean and sea-related disasters."],
        ["Mahito", "Represents humanity’s fear and hatred of other humans; he is grouped with them socially even though his origin is not a natural disaster."],
        ["Why the name is confusing", "“Disaster curses” is a community label, not the name of Jogo’s Disaster Flames technique. The phrase identifies the group rather than one cursed technique."],
        ["Their alliance", "They worked with Kenjaku because they wanted a world where curses replaced humans, although Kenjaku was exploiting them for his own plan."]
      ]
    },
    {
      test: /\b(heavy hitters?|jjk heavy hitters?|main heavy hitters?)\b/,
      title: "Jujutsu High’s Heavy Hitters",
      primary: "yuta",
      ids: ["yuta","kinji-hakari","maki","yuji"],
      verdict: "In fandom discussion, “the heavy hitters” usually means Yuta Okkotsu, Kinji Hakari, Maki Zenin, and—especially by the final battle—Yuji Itadori: the strongest frontline fighters available after Gojo.",
      factors: [
        ["Unofficial label", "It is a fan shorthand rather than a formal rank recognized by jujutsu society."],
        ["Why these four", "Each can survive top-tier combat and pressure opponents through a different route: immense cursed energy, jackpot immortality, Heavenly Restriction, or Yuji’s physical and soul-targeting growth."],
        ["Context matters", "Some fans use the phrase more narrowly for Yuta, Hakari, and Maki, depending on the chapter or discussion period."],
        ["Not a strict ranking", "Calling them heavy hitters does not establish a fixed strongest-to-weakest order in every matchup."]
      ]
    },
    {
      test: /\b(death paintings?|death painting wombs?|cursed womb brothers?)\b/,
      title: "The Cursed Womb: Death Paintings",
      primary: "choso",
      ids: ["choso","eso","kechizu","noritoshi-kamo"],
      verdict: "The Death Paintings are nine special cursed objects created from human–curse pregnancies manipulated by Noritoshi Kamo—the historical identity used by Kenjaku. Choso, Eso, and Kechizu are the three who fully incarnated in the main story.",
      factors: [
        ["What they are", "They are hybrid existences with both human and cursed-spirit traits rather than ordinary cursed spirits."],
        ["Known incarnations", "Choso is the eldest, followed by Eso and Kechizu; the remaining six existed as preserved cursed objects."],
        ["Shared bond", "Their blood connection gives Choso an unusually strong awareness of his brothers’ condition."],
        ["Yuji connection", "Choso later recognizes Yuji as a brother because Kenjaku is tied to both of their births."]
      ]
    },
    {
      test: /\b(sendai four|sendai four way|sendai deadlock|sendai players)\b/,
      title: "The Sendai Four-Way Deadlock",
      primary: "yuta",
      ids: ["takako-uro","ryu-ishigori","kurourushi","dhruv-lakdawalla","yuta"],
      verdict: "“The Sendai four” refers to Dhruv Lakdawalla, Kurourushi, Takako Uro, and Ryu Ishigori—the four elite players whose abilities kept the Sendai Colony in a deadlock before Yuta disrupted it.",
      factors: [
        ["Dhruv", "Controlled large shikigami whose paths formed domain-like territorial zones."],
        ["Kurourushi", "A special-grade cockroach curse whose swarm and Festering Life Sword threatened the others."],
        ["Uro", "Manipulated the sky as a surface, creating spatial redirection and Thin Ice Breaker."],
        ["Ryu", "Possessed extraordinary cursed-energy output and fired Granite Blast."],
        ["Why it was a deadlock", "Each participant’s position or ability checked another, preventing a clean winner until Yuta entered and defeated them sequentially."]
      ]
    },
    {
      test: /\b(reincarnated sorcerers?|incarnated sorcerers?|ancient players?)\b/,
      title: "Reincarnated Sorcerers",
      primary: "sukuna",
      ids: ["sukuna","hajime-kashimo","ryu-ishigori","takako-uro","angel","vessel-and-incarnation"],
      verdict: "Reincarnated sorcerers are past jujutsu users who returned by incarnating through modern human vessels after their remains or essence were preserved as cursed objects through contracts associated with Kenjaku.",
      factors: [
        ["Process", "A cursed object is ingested by or embedded in a compatible host, allowing the former sorcerer to manifest through that body."],
        ["Culling Game role", "Kenjaku awakened many of them to create high-level conflict across the colonies."],
        ["Vessel outcomes", "Some incarnations suppress or overwrite the host almost completely, while rare vessels can resist or coexist."],
        ["Examples", "Kashimo, Uro, Ryu, and Angel are prominent examples, though their relationships with their vessels differ."]
      ]
    }
  ];

  function groupQuestion(query, q) {
    const group = GROUPS.find(item => item.test.test(q));
    if (!group) return false;
    render(query, group.primary, group.ids, answerHtml(group.title, group.verdict, group.factors, "Fandom group resolved", "The phrase was interpreted as a community group label before individual technique matching."), "Group identification", {community:true,target:"identify and explain the group"});
    return true;
  }

  function bodyFormQuestion(query, q) {
    const forms = [
      [/\bmeguna\b|\bmegumi sukuna\b/, "Meguna", "Sukuna while incarnated in Megumi Fushiguro’s body. The fan name combines Megumi and Sukuna.", ["sukuna","megumi","ten-shadows"]],
      [/\byujikuna\b|\byuji sukuna\b/, "Yujikuna", "Sukuna while incarnated in Yuji Itadori’s body. The label distinguishes this appearance and fighting context from later vessels.", ["sukuna","yuji"]],
      [/\bheiankuna\b|\bheian sukuna\b|\btrue form sukuna\b/, "Heiankuna", "A fandom label for Sukuna’s original Heian-era or fully reincarnated four-armed form.", ["sukuna","heian-era"]]
    ];
    const found = forms.find(([test]) => test.test(q));
    if (!found || !/\b(what|who|meaning|mean|is)\b/.test(q)) return false;
    const [,name,verdict,ids] = found;
    render(query, "sukuna", ids, answerHtml(`What does “${name}” mean?`, verdict, [
      ["Type of term", "This is fandom shorthand, not the official name of a separate character or cursed technique."],
      ["Why fans use it", "Sukuna’s vessel changes his appearance, available techniques, combat options, and the context of matchup discussions."],
      ["Search behavior", "The archive treats the nickname as Sukuna in that specific body rather than searching for an unrelated word fragment."]
    ], "Fandom nickname resolved"), "Nickname definition", {community:true,target:"translate fandom shorthand"});
    return true;
  }

  function malevolentVsVoid(query, q) {
    const hasShrine = /malevolent shrine|sukuna'?s domain|shrine domain/.test(q);
    const hasVoid = /unlimited void|infinite void|gojo'?s domain/.test(q);
    const interaction = /break|destroy|crack|collapse|beat|win|survive|overpower|outside|barrier|clash/.test(q);
    if (!(hasShrine && hasVoid && interaction)) return false;
    const asksFirst = /void.*(?:land|activate|open|hit).*first|if .*void.*first/.test(q);
    const asksDirectBreak = /(?:would|can|could|does).*shrine.*(?:break|destroy|crack|collapse).*void/.test(q) || /void.*(?:broken|destroyed).*shrine/.test(q);
    let verdict = "Yes—under the conditions shown in canon, Malevolent Shrine can destroy Unlimited Void’s barrier from the outside. Their sure-hits first cancel inside the overlapping space, while Shrine’s open range continues beyond Unlimited Void and attacks the closed barrier’s vulnerable exterior.";
    if (asksFirst) verdict = "Unlimited Void landing first can incapacitate Sukuna and prevent him from maintaining Malevolent Shrine, but merely opening a fraction earlier is not automatically enough. If Sukuna remains able to deploy and sustain Shrine, its exterior slashes can still break Unlimited Void’s closed barrier.";
    render(query, "malevolent-shrine", ["unlimited-void","domain-clash","open-barrier-domain","gojo","sukuna"], answerHtml(
      asksDirectBreak ? "Would Malevolent Shrine break Unlimited Void?" : "How do Malevolent Shrine and Unlimited Void interact?",
      verdict,
      [
        ["Inside the overlap", "When both domains are active and similarly refined, their guaranteed-hit effects neutralize each other where the domains overlap."],
        ["The structural advantage", "Unlimited Void normally uses a closed barrier. Malevolent Shrine is open and extends beyond that shell, allowing Shrine to attack the barrier from outside."],
        ["Why the outside matters", "A conventional domain barrier is built to resist intrusion from within more strongly than attacks against its exterior, so repeated slashes can collapse it."],
        ["Not an effortless permanent win", "Gojo altered his barrier’s size and conditions, and both fighters repeatedly changed tactics. Shrine’s structural advantage did not mean every clash ended instantly or identically."],
        ["If Unlimited Void truly lands", "A completed, unopposed sure-hit can overwhelm Sukuna’s processing. The result depends on whether Shrine is already active and whether Sukuna can still maintain it."],
        ["Direct answer", "The relevant mechanism is barrier destruction during a clash—not Malevolent Shrine somehow cutting the information effect itself."]
      ],
      "Canon domain-interaction answer",
      "Both domains, the action verb, barrier structure, timing, and the demonstrated clash result are addressed together."
    ), "Domain interaction", {community:/infinite void/.test(q),target:"resolve which mechanism wins and why"});
    return true;
  }

  function domainDefenseQuestion(query, q) {
    if (/hollow wicker basket/.test(q) && /unlimited void|infinite void/.test(q) && /survive|stop|block|protect|work/.test(q)) {
      render(query, "hollow-wicker-basket", ["unlimited-void","sure-hit-effect","gojo"], answerHtml(
        "Can Hollow Wicker Basket protect someone from Unlimited Void?",
        "Temporarily, yes: Hollow Wicker Basket can neutralize a domain’s sure-hit around the user. It does not erase Unlimited Void, and maintaining the defense can occupy the user’s hands or output while Gojo remains free to attack.",
        [
          ["What it counters", "It interferes with the guaranteed-hit component rather than destroying the domain itself."],
          ["Duration", "The defense lasts only while it is maintained and can be pressured or disrupted."],
          ["Remaining threat", "Unlimited Void still gives Gojo superior terrain and normal combat options even when its sure-hit is being resisted."],
          ["Verdict", "It can prevent immediate information overload, but it is not a comfortable or permanent solution against Gojo."]
        ], "Anti-domain interaction"), "Defensive technique interaction", {community:/infinite void/.test(q),target:"evaluate protection, limits, and duration"});
      return true;
    }
    if (/falling blossom emotion/.test(q) && /malevolent shrine|shrine/.test(q) && /stop|block|survive|protect|work/.test(q)) {
      render(query, "falling-blossom-emotion", ["malevolent-shrine","cleave","dismantle"], answerHtml(
        "Can Falling Blossom Emotion stop Malevolent Shrine?",
        "It can automatically counter incoming sure-hit slashes with cursed energy and reduce the damage, but it does not shut Malevolent Shrine down. The user remains under continuous pressure and can still be overwhelmed.",
        [
          ["Automatic response", "The technique releases cursed energy at the moment a sure-hit makes contact."],
          ["Continuous barrage", "Malevolent Shrine applies repeated slashes across its range, forcing the defense to keep answering instead of solving one attack."],
          ["No domain removal", "Falling Blossom Emotion protects the user; it does not collapse the shrine or remove Sukuna’s technique."],
          ["Practical verdict", "It is a survival tool that buys time, not a complete counter to the entire domain."]
        ], "Anti-domain interaction"), "Defensive technique interaction", {community:false,target:"separate damage reduction from domain cancellation"});
      return true;
    }
    return false;
  }

  function fandomSlangRewrite(query, q) {
    const slang = /\b(cook|cooks|cooked|fold|folds|slam|slams|stomp|stomps|diff|no diff|low diff|mid diff|high diff|wash|washes|body|bodies)\b/.test(q);
    if (!slang) return null;
    let rewritten = query
      .replace(/\b(cook|cooks|fold|folds|slam|slams|stomp|stomps|wash|washes|body|bodies)\b/gi, "beat")
      .replace(/\bno\s*diff\b/gi, "very easily")
      .replace(/\blow\s*diff\b/gi, "with low difficulty")
      .replace(/\bmid\s*diff\b/gi, "with moderate difficulty")
      .replace(/\bhigh\s*diff\b/gi, "with high difficulty");
    if (/^does\b/i.test(rewritten)) rewritten = rewritten.replace(/^does\b/i, "Would");
    return rewritten;
  }

  function installStyles() {
    if (document.querySelector("#intent-fandom-v61-styles")) return;
    const style = document.createElement("style");
    style.id = "intent-fandom-v61-styles";
    style.textContent = `.intent-fandom-v61{min-width:0;max-width:100%}.intent-kicker{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#b27cff;margin-bottom:10px}.intent-verdict{font:500 clamp(20px,3.5vw,30px)/1.42 Georgia,serif;color:#f0eaff;margin:0 0 20px;padding-left:15px;border-left:2px solid #9f66ff;overflow-wrap:anywhere}.intent-factor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.intent-factor{min-width:0;border:1px solid var(--border);border-radius:15px;background:rgba(255,255,255,.018);padding:15px}.intent-factor h4{font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:#b384ff;margin:0 0 8px}.intent-factor p{font-size:12px;line-height:1.72;color:#beb6ca;margin:0;overflow-wrap:anywhere}@media(max-width:700px){.intent-factor-grid{grid-template-columns:1fr}.intent-verdict{font-size:21px}.intent-factor{padding:14px}}`;
    document.head.appendChild(style);
  }

  installStyles();

  window.classifyJJKIntentV61 = function classifyJJKIntentV61(rawQuery) {
    const q = normalizeQ(rawQuery);
    if (GROUPS.some(group => group.test.test(q))) return "group-identification";
    if (/\b(what does|what is|who is)\b/.test(q) && /meguna|yujikuna|heiankuna/.test(q)) return "fandom-definition";
    if (/malevolent shrine|unlimited void|infinite void|domain/.test(q) && /break|destroy|clash|beat|block|protect|survive|overpower/.test(q)) return "mechanical-interaction";
    if (/\bwhat if\b|\bif .* would\b|\bif .* could\b/.test(q)) return "conditional-hypothetical";
    if (/\bwhy\b/.test(q)) return "causal-explanation";
    if (/\bwho would win\b|\bversus\b|\bvs\b|\bbeat\b|\bcook\b|\bfold\b|\bslam\b/.test(q)) return "matchup";
    return "lookup-or-explanation";
  };

  window.auditIntentAnswerV61 = function auditIntentAnswerV61(query, answerText) {
    const q = normalizeQ(query), a = normalizeQ(answerText);
    const flags = [];
    if (/disaster curses?/.test(q) && (!/jogo/.test(a) || !/hanami/.test(a) || !/dagon/.test(a) || !/mahito/.test(a))) flags.push("group-members-missing");
    if (/disaster curses?/.test(q) && /disaster flames is/.test(a)) flags.push("group-collapsed-to-technique");
    if (/malevolent shrine/.test(q) && /unlimited void|infinite void/.test(q) && !/barrier|outside|sure hit|sure-hit|clash/.test(a)) flags.push("domain-interaction-not-explained");
    if (/break|destroy|beat|stop|protect|survive/.test(q) && /is a domain expansion that/.test(a) && !/would|can|cannot|yes|no/.test(a)) flags.push("interaction-collapsed-to-definition");
    if (/infinite void/.test(q) && !/unlimited void/.test(a)) flags.push("fandom-alias-not-normalized");
    return flags;
  };

  performSearch = async function performSearchIntentFandomV61(rawQuery) {
    const query = String(rawQuery || "").trim();
    if (!query) return previousPerformSearch(rawQuery);
    const q = normalizeQ(query);
    if (groupQuestion(query, q)) return;
    if (bodyFormQuestion(query, q)) return;
    if (malevolentVsVoid(query, q)) return;
    if (domainDefenseQuestion(query, q)) return;
    const rewritten = fandomSlangRewrite(query, q);
    if (rewritten && rewritten !== query) {
      await previousPerformSearch(rewritten);
      const title = $q("#queryTitle"); if (title) title.textContent = query;
      const input = $q("#searchInput"); if (input) input.value = query;
      const breakdown = $q("#queryBreakdown");
      if (breakdown) breakdown.insertAdjacentHTML("afterbegin", `<span class="break-chip">Community wording<b>translated to matchup language</b></span>`);
      state.currentQuery = query;
      state.currentAnswerText = $q("#answerContent")?.innerText || state.currentAnswerText;
      return;
    }
    await previousPerformSearch(rawQuery);
  };

  document.documentElement.dataset.intentFandomEngine = VERSION;
  console.info(`[JJK Archive] Intent & Fandom Reasoning Engine v${VERSION} active`);
})();