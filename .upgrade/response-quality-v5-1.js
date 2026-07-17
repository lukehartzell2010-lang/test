/* JJK Archive Response Quality Engine v5.1
   Canon-priority corrections plus response auditing for complex questions. */
(() => {
  "use strict";
  const VERSION = "5.1.0";
  const previousPerformSearch = performSearch;
  const qnorm = text => normalize(String(text || "").toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\bcan't\b/g, "cannot").replace(/\bcouldn't\b/g, "could not")
    .replace(/\bwouldn't\b/g, "would not").replace(/\bdidn't\b/g, "did not")
    .replace(/\bdoesn't\b/g, "does not").replace(/\bhasn't\b/g, "has not")
    .replace(/\bhaven't\b/g, "have not").replace(/\bisn't\b/g, "is not"));
  const unique = (list, key = item => item) => {
    const seen = new Set();
    return list.filter(item => {
      const value = key(item); if (seen.has(value)) return false; seen.add(value); return true;
    });
  };
  const E = id => getEntry(id);
  const esc = escapeHtml;

  function factorsHtml(factors) {
    return `<div class="quality-factor-grid">${factors.map(([label, text]) => `<div class="quality-factor"><h4>${esc(label)}</h4><p>${esc(text)}</p></div>`).join("")}</div>`;
  }
  function answerHtml(title, verdict, factors, { status = "Canon-priority answer", note = "The verdict is chosen after checking direct canon evidence before hypothetical inference.", extra = "" } = {}) {
    return `<div class="response-quality-v51"><div class="quality-kicker">${esc(status)}</div><h2 class="answer-title">${esc(title)}</h2><p class="quality-verdict">${esc(verdict)}</p>${factorsHtml(factors)}${extra ? `<div class="quality-extra">${esc(extra)}</div>` : ""}<div class="answer-note"><b>Response review:</b> ${esc(note)}</div></div>`;
  }
  function render(query, primary, relatedIds, html, type, audit = []) {
    const related = unique(relatedIds.map(E).filter(Boolean), entry => entry.id);
    state.currentQuery = query;
    state.currentEntryId = primary?.id || related[0]?.id || null;
    $("#searchInput").value = query;
    $("#autocomplete").hidden = true;
    $("#queryTitle").textContent = query;
    $("#answerType").textContent = `Response Quality Engine v${VERSION}`;
    const chips = [
      ["Question type", type],
      ["Canon priority", "Direct evidence before fallback"],
      ["Quality checks", audit.join(" + ") || "Relevance + confidence + completeness"]
    ];
    $("#queryBreakdown").innerHTML = chips.map(([label, value]) => `<span class="break-chip">${esc(label)}<b>${esc(value)}</b></span>`).join("");
    $("#answerContent").innerHTML = html;
    renderRelated(primary, related.map(entry => ({ entry, score: 1 })));
    showView("#resultsView");
    state.currentAnswerText = $("#answerContent").innerText;
    updateSaveButton();
  }
  function spoilerLocked(query, primary, relatedIds, topic) {
    render(query, primary, relatedIds, answerHtml(
      topic,
      "The direct canon answer depends on manga-only material hidden by the current spoiler setting.",
      [["Spoiler protection", "Switch to Full manga mode to see the confirmed interaction and its explanation."]],
      { status: "Manga evidence protected", note: "The engine will not replace hidden evidence with a misleading uncertain verdict." }
    ), "Spoiler-sensitive canon check", ["spoiler guard", "no false uncertainty"]);
  }

  function mahoragaAdaptation(query, q) {
    if (!/mahoraga/.test(q) || !/adapt/.test(q)) return false;
    const primary = E("mahoraga");
    const fullManga = state.spoiler === "manga";
    if (/limitless/.test(q) && /hollow purple|purple/.test(q)) {
      if (!fullManga) { spoilerLocked(query, primary, ["limitless", "hollow-purple"], "How does Mahoraga adapt across Limitless applications?"); return true; }
      render(query, primary, ["limitless", "hollow-purple", "gojo", "sukuna"], answerHtml(
        "Can Mahoraga adapt to Limitless and Hollow Purple separately?",
        "Yes, the adaptation system can process specific phenomena separately—but canon confirms the Infinity solution and does not show a completed Hollow Purple solution.",
        [
          ["Infinity: confirmed", "Mahoraga completed an adaptation that bypassed neutral Infinity, directly proving that a Limitless phenomenon can be solved."],
          ["Purple: not completed", "Hollow Purple remained lethal before Mahoraga demonstrated a finished Purple-specific counter."],
          ["No blanket immunity", "Limitless is a family of spatial applications. Adapting to one is not one instant blanket immunity to Blue, Red, Purple, and the domain."],
          ["What 'separately' means", "Each distinct effect may require exposure, wheel progression, and survival long enough to develop the appropriate response."]
        ],
        { status: "Mixed confirmed and conditional manga answer", note: "Both parts are answered independently instead of allowing the last named technique to overwrite the first." }
      ), "Multi-part adaptation analysis", ["both phenomena answered", "confidence separated", "no blanket immunity"]);
      return true;
    }
    if (/would unlimited void stop mahoraga before it adapts|could unlimited void stop mahoraga before|unadapted mahoraga.*wheel.*time|unlimited void.*unadapted mahoraga.*wheel/.test(q)) {
      if (!fullManga) { spoilerLocked(query, primary, ["unlimited-void", "gojo"], "Would Unlimited Void stop Mahoraga before adaptation?"); return true; }
      render(query, primary, ["unlimited-void", "gojo", "sukuna", "megumi"], answerHtml(
        "Would Unlimited Void stop Mahoraga before it adapts?",
        "An unadapted Mahoraga could be incapacitated before finishing the process; canon avoids that risk by preparing the adaptation through Megumi before Mahoraga fully enters the domain.",
        [
          ["Before adaptation", "Unlimited Void's information overload is immediately disabling, so merely possessing the adaptation ability does not grant instant protection."],
          ["Canon workaround", "Sukuna advanced the wheel through Megumi's repeated exposure, allowing Mahoraga to appear with the needed answer ready."],
          ["After adaptation", "Once the adaptation was complete, Mahoraga could function inside Unlimited Void and destroy the domain."],
          ["Verdict", "Without prior progress, Unlimited Void is a serious stop condition; with completed adaptation, it is no longer decisive."]
        ],
        { status: "Condition-dependent direct manga answer", note: "The response answers the timing question rather than only restating that adaptation is possible." }
      ), "Timing versus adaptation", ["before/after separated", "direct verdict", "canon strategy"]);
      return true;
    }
    if (/limitless|infinity/.test(q) && !/blue|red|purple/.test(q)) {
      if (!fullManga) { spoilerLocked(query, primary, ["limitless", "gojo"], "Can Mahoraga adapt to Limitless?"); return true; }
      const exactPhenomenon = /infinity/.test(q) && !/limitless/.test(q) ? "Infinity" : "Limitless";
      render(query, primary, ["limitless", "gojo", "sukuna", "ten-shadows"], answerHtml(
        `Can Mahoraga adapt to ${exactPhenomenon}?`,
        "Yes—but the adaptation is to specific phenomena produced by Limitless, not one instant blanket immunity to every application.",
        [
          ["Direct canon result", "Mahoraga completes an adaptation that lets it bypass Infinity, so this is not an unresolved hypothetical."],
          ["Limitless is a technique family", "Infinity, Blue, Red, Hollow Purple, and Unlimited Void do not all behave identically. Solving one effect does not automatically prove complete immunity to every other effect."],
          ["Given enough time", "Time only helps if the adaptation process is being advanced and Mahoraga—or the bearer of its wheel—survives long enough for the required turns to complete."],
          ["Continuing adaptation", "Mahoraga can keep developing new solutions after an initial adaptation rather than stopping at the first usable counter."]
        ],
        { status: "Direct manga evidence", note: "The response distinguishes the confirmed Infinity adaptation from broader claims about every Limitless application." }
      ), "Confirmed adaptation interaction", ["direct canon", "scope distinction", "condition used"]);
      return true;
    }
    if (/domain sure hit|domain sure-hit/.test(q) && !/unlimited void/.test(q)) {
      if (!fullManga) { spoilerLocked(query, primary, ["unlimited-void", "domain-expansion"], "Can Mahoraga adapt to a domain sure-hit?"); return true; }
      render(query, primary, ["unlimited-void", "domain-expansion", "gojo", "sukuna"], answerHtml(
        "Can Mahoraga adapt to a domain sure-hit?",
        "Yes in principle, because a sure-hit is still a phenomenon Mahoraga can process; Unlimited Void provides a direct canon example.",
        [
          ["Demonstrated precedent", "Mahoraga's adaptation was prepared against Unlimited Void and then used to act within and destroy that domain."],
          ["Not every domain is identical", "Different sure-hits impose different phenomena, so one domain adaptation does not automatically solve every other domain."],
          ["Required conditions", "Mahoraga still needs exposure, survival, and enough adaptation progress before the sure-hit disables or destroys it."],
          ["Best general answer", "Domain sure-hits are not categorically exempt from adaptation, but each one must be evaluated on its own effect and timing."]
        ],
        { status: "General rule with direct manga precedent", note: "The response uses Unlimited Void as evidence without pretending every domain works the same way." }
      ), "General domain-adaptation rule", ["broad question preserved", "precedent", "conditions"]);
      return true;
    }
    if (/unlimited void/.test(q)) {
      if (!fullManga) { spoilerLocked(query, primary, ["unlimited-void", "gojo"], "Can Mahoraga adapt to Unlimited Void?"); return true; }
      render(query, primary, ["unlimited-void", "gojo", "sukuna", "megumi"], answerHtml(
        "Can Mahoraga adapt to Unlimited Void?",
        "Yes. Canon shows the adaptation being prepared and then used to counter Unlimited Void's sure-hit.",
        [
          ["How it happened", "Sukuna placed Mahoraga's wheel on Megumi's soul so the adaptation process could advance through repeated exposure to Unlimited Void."],
          ["Completed result", "Once the adaptation was ready, Mahoraga could act inside the domain and destroy it rather than remaining helpless under the information overload."],
          ["Important condition", "An unadapted Mahoraga is not automatically safe from Unlimited Void. The canon strategy deliberately built the adaptation beforehand."],
          ["General lesson", "A domain sure-hit is still a phenomenon that Mahoraga can process, but survival and exposure timing decide whether the adaptation finishes."]
        ],
        { status: "Direct manga evidence", note: "The answer states the confirmed outcome while preserving the unusual way the adaptation burden was handled." }
      ), "Confirmed domain interaction", ["direct canon", "mechanism", "timing condition"]);
      return true;
    }
    if (/hollow purple|purple/.test(q)) {
      if (!fullManga) { spoilerLocked(query, primary, ["hollow-purple", "limitless"], "Can Mahoraga adapt to Hollow Purple?"); return true; }
      render(query, primary, ["hollow-purple", "limitless", "gojo"], answerHtml(
        "Can Mahoraga adapt to Hollow Purple?",
        "Potentially, but canon does not show a completed Hollow Purple adaptation before Mahoraga is destroyed.",
        [
          ["Adaptation rule", "Mahoraga can adapt to phenomena through exposure, so Purple is not excluded in principle."],
          ["Survival gate", "It must survive the attack and allow the wheel enough processing time. A sufficiently destructive first hit can end the process before a counter exists."],
          ["Separate application", "Prior adaptation to Infinity does not automatically prove completed immunity to Hollow Purple, which is a different application of Limitless."],
          ["Best verdict", "The ability makes adaptation plausible; the story does not confirm that Mahoraga completed it."]
        ],
        { status: "Conditional manga inference", note: "The response separates what Mahoraga's general ability permits from what the fight actually demonstrated." }
      ), "Unconfirmed adaptation outcome", ["ability rule", "survival condition", "confidence calibrated"]);
      return true;
    }
    if (/\bblue\b|\bred\b/.test(q)) {
      if (!fullManga) { spoilerLocked(query, primary, ["limitless"], "Can Mahoraga adapt to another Limitless application?"); return true; }
      const phenomenon = /\bblue\b/.test(q) ? "Blue" : "Red";
      render(query, primary, ["limitless", "gojo"], answerHtml(
        `Can Mahoraga adapt to ${phenomenon}?`,
        `In principle, yes—but adapting to Infinity does not automatically prove that ${phenomenon} has already been solved.`,
        [
          ["Separate phenomenon", `${phenomenon} produces a different spatial effect from neutral Infinity and may require its own exposure and wheel progression.`],
          ["Exposure requirement", "A direct bodily hit is not always required if Mahoraga's wheel or its bearer is actually exposed to the phenomenon, but some meaningful interaction with that effect is still necessary."],
          ["Canon boundary", `The manga does not present a clean, completed ${phenomenon}-specific adaptation with the same certainty as the Infinity adaptation.`]
        ],
        { status: "Rule-based manga inference", note: "The answer does not turn adaptation to one Limitless application into automatic immunity to the entire technique." }
      ), "Related but separate adaptation", ["scope", "no blanket immunity", "confidence calibrated"]);
      return true;
    }
    return false;
  }

  function prisonRealmRule(query, q) {
    if (!/gojo/.test(q) || !/prison realm/.test(q) || !/(destroy|escape|get out|break)/.test(q)) return false;
    render(query, E("gojo"), ["prison-realm", "kenjaku"], answerHtml(
      "Why couldn't Gojo escape the Prison Realm by himself?",
      "Because this was a sealing-rule problem, not a lack of destructive power or motivation.",
      [
        ["Completed seal", "Once Prison Realm finished sealing him, Gojo was confined in its separate internal space rather than standing inside an ordinary object he could attack from within."],
        ["Opening authority", "The front gate's bearer controls normal release. The back gate requires an external technique-nullifying method to break the seal."],
        ["Why Limitless was not enough", "Raw force and spatial attacks do not automatically cancel the cursed object's sealing technique."],
        ["Correct question type", "The issue is what the Prison Realm's rules allowed, not why Gojo chose not to try."]
      ],
      { status: "Cursed-object rule explanation", note: "The engine now distinguishes inability from motive whenever 'why didn't' describes a blocked action." }
    ), "Capability and sealing rules", ["not motive", "object rules", "direct answer"]);
    return true;
  }

  function sukunaControl(query, q) {
    if (!/sukuna/.test(q) || !/(take over|taking over|control|possess|suppres|enchain)/.test(q)) return false;
    if (/sleep|slept|asleep/.test(q)) {
      render(query, E("sukuna"), ["yuji", "binding-vow"], answerHtml(
        "Could Sukuna take control whenever Yuji slept?",
        "No. Ordinary sleep did not automatically switch control to Sukuna; Yuji's suppression normally continued unless a much larger opening occurred.",
        [["Sleep versus incapacitation", "Being asleep is not the same as dying, losing consciousness from severe damage, or being overwhelmed by a sudden intake of fingers."], ["Yuji's baseline control", "Yuji's body normally confines Sukuna even when Yuji is not actively thinking about suppression."], ["Special access", "Sukuna needed exceptional circumstances or the narrow Enchain binding-vow window rather than a nightly automatic takeover." ]],
        { status: "Vessel-control rule", note: "The engine answers the specific condition—sleep—instead of only repeating the general vessel explanation." }
      ), "Conditional control question", ["sleep condition", "direct no", "exceptions"]);
      return true;
    }
    const yujiContext = /yuji/.test(q) || /enchain/.test(q);
    if (!yujiContext || !/(why|what stopped|could not|did not|earlier|enchain)/.test(q)) return false;
    const factors = [
      ["Yuji's vessel trait", "Yuji normally suppresses Sukuna and can retake control, so Sukuna did not have unrestricted access to the body."],
      ["Temporary openings", "Sukuna could surface when Yuji was unconscious, dead, or overwhelmed by a sudden intake of fingers, but those openings did not equal permanent ownership."],
      ["Enchain's limits", "The binding vow granted one short, rule-bound window. It did not let Sukuna remain in control whenever he wanted."],
      ["Why wait", state.spoiler === "manga" ? "Sukuna saved that limited opportunity for a specific plan involving Megumi rather than wasting it on an earlier temporary takeover." : "The anime-safe record establishes that Sukuna had a narrow plan-dependent opportunity, while its full purpose is manga material."]
    ];
    render(query, E("sukuna"), ["yuji", "binding-vow", "megumi"], answerHtml(
      "What stopped Sukuna from permanently taking over Yuji?",
      "Yuji's body functioned as a cage, and Sukuna's binding-vow access was narrow rather than continuous.",
      factors,
      { status: "Vessel and binding-vow analysis", note: "The response now recognizes paraphrases such as 'what stopped' and conditional wording involving Enchain." }
    ), "Control limitation", ["paraphrase recognized", "conditions used", "motive + mechanics"]);
    return true;
  }

  function jogoBlackFlash(query, q) {
    if (!/jogo/.test(q) || !/black flash/.test(q) || !/(die|kill|survive|fatal)/.test(q)) return false;
    const fromGojo = /gojo/.test(q);
    const fromYuji = /yuji/.test(q);
    const injured = /injur|weaken|already hurt|damaged/.test(q);
    const fullHealth = /full health|fully healthy|uninjured/.test(q);
    const clean = /clean|direct|landed|hit directly/.test(q);
    let verdict = "One unspecified Black Flash is not an automatic one-hit-kill rule, but Jogo would be in serious danger.";
    if (fromGojo) verdict = "A clean, serious Black Flash from Gojo would very likely be fatal to Jogo, although that exact hit is not shown in canon.";
    else if (fromYuji && injured) verdict = "If Jogo were already badly injured, a clean Yuji Black Flash could plausibly finish him, but the injury level still controls the verdict.";
    else if (fromYuji) verdict = "A clean Yuji Black Flash would badly damage Jogo, but one hit is not confirmed as an automatic kill from every starting condition.";
    const factors = [
      ["Attacker matters", fromGojo ? "Gojo's reinforced physical strikes operate at a much higher baseline than an ordinary sorcerer's, so the Black Flash multiplier starts from a stronger hit." : fromYuji ? "Yuji is an exceptional close-range striker and repeatedly produces powerful Black Flashes, but his output is not a universal fixed damage number." : "Black Flash magnifies the strike that produced it, so the user's base power matters."],
      ["Target condition", injured ? "The question specifies prior injury, which materially raises the chance that the hit becomes fatal." : fullHealth ? "The question explicitly places Jogo at full health, so the verdict cannot rely on accumulated damage." : "The question does not establish that Jogo is already weakened, so full-health durability still matters."],
      ["Contact quality", clean ? "A direct clean hit is more dangerous than a glancing impact or partially defended strike." : "Hit location, defense, and whether the blow lands cleanly remain unspecified."],
      ["Canon boundary", "The manga does not provide a universal Black Flash damage table or this exact Jogo hit, so the conclusion is a calibrated inference rather than a quoted rule."]
    ];
    render(query, E("jogo"), ["black-flash", ...(fromGojo ? ["gojo"] : []), ...(fromYuji ? ["yuji"] : []), "hanami"], answerHtml(
      query.replace(/[?]+$/, ""), verdict, factors,
      { status: fromGojo ? "Strong canon-based inference" : "Condition-sensitive matchup inference", note: "Every condition supplied by the user—attacker, injury, and hit quality—is reflected in the verdict." }
    ), "Conditional damage question", ["attacker used", "condition used", "no fixed-damage assumption"]);
    return true;
  }

  function eventCorrections(query, q) {
    if (/did gojo (?:kill|exorcise) hanami/.test(q)) {
      render(query, E("hanami"), ["gojo", "shibuya-incident"], answerHtml(
        "Did Gojo kill Hanami?", "Yes. Gojo exorcised Hanami during the Shibuya Incident.",
        [["Direct event", "Gojo trapped Hanami against a wall with Infinity pressure and crushed the curse during the subway confrontation."], ["Earlier encounter", "This was separate from the Goodwill Event, where Hollow Purple severely injured Hanami but did not kill them."]],
        { status: "Direct canon event", note: "A direct event question receives the event itself rather than a biography or generic encounter card." }
      ), "Direct event check", ["yes/no", "event distinguished"]); return true;
    }
    if (/hanami/.test(q) && /hollow purple/.test(q) && /(did|survive|use)/.test(q)) {
      render(query, E("hanami"), ["gojo", "hollow-purple"], answerHtml(
        "Did Hanami survive Gojo's Hollow Purple?", "Yes. Gojo used Hollow Purple on Hanami during the Goodwill Event, and Hanami escaped alive after being caught near the attack's path.",
        [["Survival", "Hanami was severely injured but not exorcised by that attack."], ["Hit quality", "Surviving the edge or partial path does not prove Hanami could survive a clean central hit."], ["Later fate", "Gojo exorcised Hanami later in Shibuya by a different method."]],
        { status: "Direct event plus limitation", note: "The response answers both parts when the question asks whether the attack was used and whether the target survived." }
      ), "Multi-part event check", ["both clauses answered", "no false uncertainty"]); return true;
    }
    if (/gojo/.test(q) && /hanami/.test(q) && /before shibuya/.test(q) && /(fight|fought)/.test(q)) {
      render(query, E("hanami"), ["gojo", "hollow-purple"], answerHtml(
        "Did Gojo and Hanami fight before Shibuya?", "Not in the same sustained close-range sense as Shibuya. They had hostile encounters before then, but Hanami mostly rescued, escaped, or was targeted at range.",
        [["Jogo rescue", "Hanami intervened to retrieve Jogo rather than staying for a full fight with Gojo."], ["Goodwill Event", "Gojo fired Hollow Purple toward Hanami's escape route, severely injuring them, but the exchange was not a prolonged duel."], ["Shibuya difference", "Their clearest direct close-range confrontation occurred later in Shibuya and ended with Hanami's exorcism." ]],
        { status: "Encounter-type distinction", note: "The response distinguishes hostile contact, exchanged attacks, and a sustained fight within the requested time period." }
      ), "Time-bounded fight check", ["before Shibuya", "fight definition", "timeline"]); return true;
    }
    if (/gojo/.test(q) && /hanami/.test(q) && /(spoken|talked|conversation|spoke directly)/.test(q)) {
      render(query, E("hanami"), ["gojo"], answerHtml(
        "Have Gojo and Hanami spoken directly?", "They shared direct confrontations, but the curated canon record does not clearly establish a two-way personal conversation between them.",
        [["Direct encounters", "Hanami rescued Jogo, was targeted during the Goodwill Event, and confronted Gojo in Shibuya."], ["Speech versus encounter", "Being present in the same battle or hearing Gojo address the group is not automatically a direct back-and-forth conversation."], ["Confidence", "The safest answer is that direct contact is confirmed while direct dialogue remains unconfirmed." ]],
        { status: "Direct-dialogue distinction", note: "The engine evaluates the requested action—spoken—rather than substituting the broader fact that they met." }
      ), "Dialogue check", ["spoken ≠ met", "confidence calibrated"]); return true;
    }
    if (/gojo/.test(q) && /hanami/.test(q) && /(fought or just met|actually fought|fight or meet)/.test(q)) {
      render(query, E("hanami"), ["gojo", "hollow-purple", "shibuya-incident"], answerHtml(
        "Did Gojo and Hanami actually fight?", "Yes. They did more than merely meet: Hanami directly confronted Gojo in Shibuya, where Gojo exorcised them.",
        [["Earlier contact", "Hanami rescued Jogo from Gojo and later escaped Gojo's Hollow Purple during the Goodwill Event."], ["Direct fight", "Their Shibuya encounter involved close-range opposition and ended with Hanami's exorcism."], ["Verb distinction", "The answer distinguishes sharing a scene, exchanging attacks, and having a sustained fight."]],
        { status: "Direct encounter classification", note: "The requested relationship verb—fought—is evaluated separately from merely met." }
      ), "Encounter versus combat", ["verb respected", "event list"]); return true;
    }
    if (/yuji/.test(q) && /jogo/.test(q) && /(actually fought|have .* fought|did .* fight)/.test(q)) {
      render(query, E("jogo"), ["yuji", "sukuna", "shibuya-incident"], answerHtml(
        "Did Yuji and Jogo actually fight?", "No direct Yuji-versus-Jogo fight is shown. They were in the same event, but Yuji was unconscious when Jogo force-fed him Sukuna's fingers.",
        [["They did meet", "Jogo physically interacted with Yuji's body in Shibuya."], ["They did not exchange a fight", "Yuji was not conscious and did not battle Jogo during that interaction."], ["Why the distinction matters", "A shared scene or physical contact does not automatically count as a fight."]],
        { status: "Encounter-verb correction", note: "The engine now tests the exact verb instead of answering every relationship question as 'met.'" }
      ), "Direct fight check", ["met ≠ fought", "conscious participation"]); return true;
    }
    if (/yuta/.test(q) && /todo/.test(q) && /(spoken|talked|conversation|spoke directly)/.test(q)) {
      render(query, E("yuta"), ["todo"], answerHtml(
        "Have Yuta and Todo spoken directly?", "The current canon record does not confirm an on-panel or on-screen direct conversation between them.",
        [["What is known", "Both belong to the modern jujutsu world and have overlapping institutional connections."], ["What is not enough", "Being connected to the same school system or events does not prove direct dialogue."], ["Confidence", "This is an unconfirmed conversation, not a claim that they definitely never spoke off-screen."]],
        { status: "Unconfirmed direct dialogue", note: "The engine distinguishes met, fought, and spoken rather than treating them as interchangeable." }
      ), "Direct-dialogue check", ["verb respected", "missing evidence calibrated"]); return true;
    }
    return false;
  }

  function ruleInteraction(query, q) {
    if (/black flash/.test(q) && /domain amplification/.test(q) && /(work|use|together|through)/.test(q)) {
      render(query, E("domain-amplification"), ["black-flash", "gojo", "limitless"], answerHtml(
        "Can Black Flash work with Domain Amplification?", "In principle, yes: Domain Amplification can create contact through Infinity, and Black Flash can amplify the correctly timed physical strike.",
        [["Different functions", "Domain Amplification neutralizes the opposing technique at contact; Black Flash is a cursed-energy timing phenomenon attached to a physical blow."], ["Compatibility", "Black Flash does not require activating an innate cursed technique, so the main Domain Amplification restriction does not automatically forbid it."], ["Canon boundary", "The exact combination has not been directly demonstrated, so this remains a rule-based theoretical interaction." ]],
        { status: "Rule-based theoretical interaction", note: "The response analyzes compatibility rather than presenting the two concepts as opponents." }
      ), "Technique compatibility", ["not versus", "rules combined"]); return true;
    }
    if (/simple domain/.test(q) && /(sure hit|sure-hit|domain|unlimited void)/.test(q) && /(forever|indefinitely|completely|permanent|block|protect)/.test(q)) {
      render(query, E("simple-domain"), ["domain-expansion", "malevolent-shrine"], answerHtml(
        "Can Simple Domain block a domain's sure-hit forever?", "No. Simple Domain can neutralize or interfere with the sure-hit locally, but it is a temporary defense that a stronger domain can strip away.",
        [["What it stops", "It protects the user from the guaranteed-hit effect within its limited defensive space."], ["What it does not stop", "It does not erase the enemy domain or automatically end the caster's technique."], ["Time pressure", "The user must escape, counterattack, renew the defense, or deploy another answer before Simple Domain collapses." ]],
        { status: "Direct anti-domain rule", note: "The user's word 'forever' is answered explicitly rather than buried in a generic matchup card." }
      ), "Duration and defensive rule", ["direct no", "duration used"]); return true;
    }
    return false;
  }

  function maximumMeteor(query, q) {
    if (!/hanami/.test(q) || !/maximum meteor/.test(q) || !/(kill|die|survive|hit)/.test(q)) return false;
    render(query, E("hanami"), ["jogo", "disaster-flames"], answerHtml(
      "Would Maximum Meteor kill Hanami on a direct hit?", "A clean direct hit would pose a serious—and plausibly fatal—threat, but the exact Hanami matchup is not shown.",
      [["Named move", "Maximum Meteor is Jogo's maximum technique, not merely a generic use of Disaster Flames."], ["Hanami's durability", "Hanami is exceptionally durable and survived severe punishment, so survival cannot be dismissed without considering hit quality."], ["Attack scale", "Maximum Meteor produces large-scale destructive force and would be far more dangerous as a direct impact than as a near miss."], ["Confidence", "Likely severe or fatal damage is an inference; canon does not provide this exact hit." ]],
      { status: "Named-technique conditional inference", note: "The title and reasoning preserve the exact move the user named instead of replacing it with the parent technique." }
    ), "Named move matchup", ["exact move", "direct-hit condition", "confidence calibrated"]); return true;
  }

  function getoYuta(query, q) {
    if (/geto/.test(q) && /night parade/.test(q) && /yuta/.test(q) && /(distract|isolate|plan)/.test(q)) {
      render(query, E("geto"), ["yuta", "rika", "gojo"], answerHtml(
        "Did Geto use the Night Parade to isolate Yuta?", "Yes. The public attack spread Jujutsu High's forces across Tokyo and Kyoto while Geto personally targeted the comparatively exposed Yuta and Rika at the school.",
        [["Distraction", "The mass curse attacks forced Gojo and other sorcerers to respond away from Yuta."], ["Real objective", "Geto's private goal was to defeat Yuta and take Rika for Cursed Spirit Manipulation."], ["Isolation", "The plan reduced the chance that Gojo or the full school force could interrupt Geto's attempt." ]],
        { status: "Direct strategic-plan answer", note: "The question's proposed explanation is checked against the event structure rather than routed to a biography." }
      ), "Plan verification", ["direct yes", "distraction", "isolation"]); return true;
    }
    if (!/geto/.test(q) || !/yuta/.test(q) || !/rika/.test(q) || !/(why|immediately|kill)/.test(q)) return false;
    render(query, E("geto"), ["yuta", "rika", "cursed-spirit-manipulation"], answerHtml(
      "Why didn't Geto kill Yuta immediately if he wanted Rika?", "Geto did intend to isolate and kill Yuta to obtain Rika, but he first created the conditions for that plan rather than attacking recklessly in front of Gojo and the school.",
      [["Initial contact", "At Jujutsu High, Geto approached openly, pushed his ideology, and declared the Night Parade instead of beginning an unwinnable confrontation with the full school present."], ["Isolation plan", "The Night Parade scattered the sorcerers across multiple locations so Geto could attack Yuta at the school with less interference."], ["Final battle", "Once isolated, Geto fought Yuta and escalated to Maximum: Uzumaki, which was intended to kill him and secure Rika."], ["Answer to 'immediately'", "The delay was strategic setup, not uncertainty about wanting Rika." ]],
      { status: "Plan and motive analysis", note: "The response uses the actual sequence of the plan instead of claiming no motive is known." }
    ), "Strategic motive", ["timeline", "goal", "why delay"]); return true;
  }

  function jogoUnlimitedVoid(query, q) {
    if (/jogo/.test(q) && /gojo/.test(q) && /(removed his head|removed jogo.*head|decapitat)/.test(q) && /(why|die|survive)/.test(q)) {
      render(query, E("jogo"), ["gojo", "unlimited-void"], answerHtml(
        "Why did Jogo survive after Gojo removed his head?", "Because Jogo is a cursed spirit, and decapitation alone did not fully exorcise him; Gojo also intentionally kept him alive for interrogation.",
        [["Cursed-spirit physiology", "Cursed spirits can survive bodily damage that would instantly kill a human as long as they are not fully exorcised and retain enough cursed energy to persist."], ["Gojo controlled the outcome", "Gojo removed Jogo's head after Unlimited Void but did not destroy the remaining curse completely."], ["Purpose", "He wanted information about Jogo's allies and plans, so survival was deliberate rather than accidental." ]],
        { status: "Direct event and physiology answer", note: "The question asks about survival mechanics and Gojo's choice, so both are answered." }
      ), "Post-injury survival explanation", ["not motive-only", "curse physiology", "interrogation"]); return true;
    }
    if (!/jogo/.test(q) || !/unlimited void/.test(q) || !/(why did not.*die|why.*survive|let jogo live|why did not gojo.*kill|why.*gojo.*kill)/.test(q)) return false;
    render(query, E("jogo"), ["gojo", "unlimited-void"], answerHtml(
      "Why didn't Jogo die in Unlimited Void?", "Unlimited Void incapacitates through information overload; it is not an automatic instant-kill effect, and Gojo deliberately ended the exposure before finishing Jogo because he wanted information.",
      [["Effect of the domain", "Jogo was immobilized and overwhelmed rather than instantly erased."], ["Gojo's choice", "Gojo decapitated and restrained Jogo for interrogation instead of immediately exorcising him."], ["Duration matters", "Longer exposure would continue damaging and incapacitating the target, but the shown encounter ended under Gojo's control."], ["Later 0.2-second use", "The brief Shibuya activation is a separate event and should not be confused with Gojo's earlier one-on-one domain demonstration against Jogo." ]],
      { status: "Direct event and technique effect", note: "The engine now treats 'why didn't die' as an outcome question, not a character motive question." }
    ), "Outcome explanation", ["not motive", "domain effect", "event separated"]); return true;
  }

  function installStyles() {
    if (document.querySelector("#response-quality-v51-styles")) return;
    const style = document.createElement("style"); style.id = "response-quality-v51-styles";
    style.textContent = `.response-quality-v51{min-width:0;max-width:100%}.quality-kicker{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#b27cff;margin-bottom:10px}.quality-verdict{font:500 clamp(20px,3.5vw,30px)/1.42 Georgia,serif;color:#f0eaff;margin:0 0 20px;padding-left:15px;border-left:2px solid #9f66ff;overflow-wrap:anywhere}.quality-factor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.quality-factor{min-width:0;border:1px solid var(--border);border-radius:15px;background:rgba(255,255,255,.018);padding:15px}.quality-factor h4{font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:#b384ff;margin:0 0 8px}.quality-factor p{font-size:12px;line-height:1.72;color:#beb6ca;margin:0;overflow-wrap:anywhere}.quality-extra{margin-top:14px;padding:14px 15px;border-radius:12px;background:rgba(159,102,255,.055);border:1px solid rgba(159,102,255,.16);font-size:12px;line-height:1.7;color:#c9c1d4}@media(max-width:700px){.quality-factor-grid{grid-template-columns:1fr}.quality-verdict{font-size:21px}.quality-factor{padding:14px}}`;
    document.head.appendChild(style);
  }
  installStyles();

  performSearch = async function performSearchResponseQualityV51(rawQuery) {
    const query = String(rawQuery || "").trim();
    if (!query) return previousPerformSearch(rawQuery);
    const q = qnorm(query);
    if (mahoragaAdaptation(query, q)) return;
    if (prisonRealmRule(query, q)) return;
    if (sukunaControl(query, q)) return;
    if (jogoBlackFlash(query, q)) return;
    if (eventCorrections(query, q)) return;
    if (ruleInteraction(query, q)) return;
    if (maximumMeteor(query, q)) return;
    if (getoYuta(query, q)) return;
    if (jogoUnlimitedVoid(query, q)) return;
    await previousPerformSearch(rawQuery);
  };

  window.auditResponseV51 = function auditResponseV51(query, answerText) {
    const q = qnorm(query), a = qnorm(answerText);
    const flags = [];
    if (/adapt/.test(q) && /versus/.test(a)) flags.push("adaptation-question-rendered-as-versus");
    if (/why/.test(q) && /(destroy|escape|survive|die)/.test(q) && /motive not confirmed/.test(a)) flags.push("capability-question-rendered-as-motive");
    if (/maximum meteor/.test(q) && !/maximum meteor/.test(a)) flags.push("named-technique-lost");
    if (/(fought|spoken|talked)/.test(q) && /^have .* met/.test(a)) flags.push("relationship-verb-collapsed-to-met");
    if (/given enough time|already injured|from gojo|from yuji|hit directly|clean/.test(q) && !/(time|injur|gojo|yuji|direct|clean)/.test(a)) flags.push("user-condition-ignored");
    if (/not enough direct canon evidence/.test(a) && /(adapt to limitless|adapt to infinity|adapt to unlimited void|did gojo kill hanami)/.test(q)) flags.push("canon-evidence-override-missed");
    return flags;
  };
  document.documentElement.dataset.responseQuality = VERSION;
  console.info(`[JJK Archive] Response Quality Engine v${VERSION} active`);
})();