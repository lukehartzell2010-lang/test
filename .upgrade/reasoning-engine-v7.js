/* JJK Archive Contextual Reasoning Engine v7
   Resolves fandom language, multi-part questions, rule interactions, and condition-sensitive canon answers. */
(() => {
  "use strict";
  const VERSION = "7.0.0";
  if (document.documentElement.dataset.contextualReasoning === VERSION) return;
  const previousPerformSearch = performSearch;
  const qnorm = text => normalize(String(text || "").toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\bcan't\b/g, "cannot").replace(/\bcouldn't\b/g, "could not")
    .replace(/\bwouldn't\b/g, "would not").replace(/\bdidn't\b/g, "did not")
    .replace(/\bdoesn't\b/g, "does not").replace(/\bisn't\b/g, "is not"));
  const E = id => getEntry(id);
  const esc = escapeHtml;
  const unique = (list, key = item => item) => { const seen = new Set(); return list.filter(item => { const value = key(item); if (seen.has(value)) return false; seen.add(value); return true; }); };

  function render(query, primary, relatedIds, { title, verdict, factors, status = "Contextual Reasoning v7", note = "The full relationship and conditions were evaluated together.", type = "Contextual reasoning", labels = [] }) {
    const related = unique((relatedIds || []).map(E).filter(Boolean), entry => entry.id);
    state.currentQuery = query;
    state.currentEntryId = primary?.id || related[0]?.id || null;
    $("#searchInput").value = query;
    $("#autocomplete").hidden = true;
    $("#queryTitle").textContent = query;
    $("#answerType").textContent = `Contextual Reasoning Engine v${VERSION}`;
    const chips = [["Question type", type], ["Terms resolved", labels.join(" + ") || primary?.title || "Canon mechanics"], ["Answer order", "Verdict → mechanism → limits"]];
    $("#queryBreakdown").innerHTML = chips.map(([label, value]) => `<span class="break-chip">${esc(label)}<b>${esc(value)}</b></span>`).join("");
    $("#answerContent").innerHTML = `<div class="contextual-answer-v7"><div class="contextual-kicker">${esc(status)}</div><h2 class="answer-title">${esc(title)}</h2><p class="contextual-verdict">${esc(verdict)}</p><div class="contextual-grid">${factors.map(([label, text]) => `<section class="contextual-card"><h3>${esc(label)}</h3><p>${esc(text)}</p></section>`).join("")}</div><div class="answer-note"><b>Reasoning check:</b> ${esc(note)}</div></div>`;
    renderRelated(primary, related.map(entry => ({ entry, score: 1 })));
    showView("#resultsView");
    state.currentAnswerText = $("#answerContent").innerText;
    updateSaveButton();
  }

  function installStyles() {
    if (document.querySelector("#contextual-reasoning-v7-styles")) return;
    const style = document.createElement("style");
    style.id = "contextual-reasoning-v7-styles";
    style.textContent = `.contextual-answer-v7{min-width:0;max-width:100%}.contextual-kicker{margin-bottom:10px;color:#b78aff;font-size:9px;letter-spacing:.16em;text-transform:uppercase}.contextual-verdict{margin:0 0 20px;padding-left:16px;border-left:2px solid #a96fff;color:#f0eaff;font:500 clamp(20px,3.6vw,30px)/1.45 Georgia,serif;overflow-wrap:anywhere}.contextual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.contextual-card{min-width:0;padding:15px;border:1px solid var(--border);border-radius:15px;background:rgba(255,255,255,.018)}.contextual-card h3{margin:0 0 8px;color:#b98cff;font-size:10px;letter-spacing:.11em;text-transform:uppercase}.contextual-card p{margin:0;color:#c1b8cb;font-size:12px;line-height:1.72;overflow-wrap:anywhere}@media(max-width:700px){.contextual-grid{grid-template-columns:1fr}.contextual-verdict{font-size:21px}.contextual-card p{font-size:15px!important;line-height:1.67!important}}`;
    document.head.appendChild(style);
  }
  installStyles();

  function answer(query, primaryId, relatedIds, title, verdict, factors, type = "Contextual reasoning", status = "Contextual Reasoning v7", note = "The response uses the full relationship, conditions, and canon rules in the question instead of defining only one keyword.") {
    render(query, primaryId ? E(primaryId) : null, relatedIds, { title, verdict, factors, type, status, note, labels: relatedIds.map(id => E(id)?.title || id).slice(0, 5) });
    const container = document.querySelector("#answerContent");
    if (container) container.dataset.contextualReasoning = VERSION;
    return true;
  }

  function mangaAnswer(query, primaryId, relatedIds, title, verdict, factors, type, status, note) {
    if (state.spoiler !== "manga") {
      return answer(query, primaryId, relatedIds, title,
        "The direct canon answer relies on manga-only material hidden by the current spoiler setting.",
        [["Spoiler protection", "Switch to Full Manga mode to reveal the interaction instead of receiving a vague fallback."]],
        "Spoiler-sensitive contextual question", "Manga evidence protected", "Hidden evidence is never replaced with a misleading generic answer.");
    }
    return answer(query, primaryId, relatedIds, title, verdict, factors, type, status, note);
  }

  const has = (q, pattern) => pattern.test(q);

  const FAN_DEFINITIONS = [
    ["wcs", "WCS", "World-Cutting Dismantle—the spatially retargeted slash that cuts the space containing its target."],
    ["world slash", "World slash", "Fandom shorthand for World-Cutting Dismantle."],
    ["fuga", "Fuga", "Fandom shorthand for Furnace, Sukuna's fire application within Shrine."],
    ["da", "DA", "Domain Amplification."], ["hwb", "HWB", "Hollow Wicker Basket."],
    ["fbe", "FBE", "Falling Blossom Emotion."], ["rct merchant", "RCT merchant", "A fandom insult claiming a character depends too heavily on healing and regeneration instead of a rounded moveset."], ["rct", "RCT", "Reverse Cursed Technique."],
    ["ct burnout", "CT burnout", "The temporary instability of an innate cursed technique after Domain Expansion ends."],
    ["domain diff", "Domain difference", "A fandom argument that one fighter wins mainly because the opponent lacks an answer to Domain Expansion; it is not an official stat."],
    ["refinement diff", "Refinement difference", "Fandom shorthand for a domain winning through superior refinement; the claim still requires canon evidence."],
    ["ce diff", "CE difference", "A fan label for a gap in reserves, output, control, or efficiency—attributes that should not be collapsed into one number."],
    ["speed blitz", "Speed blitz", "Defeating or disabling someone before they can perceive, react, or deploy an answer."],
    ["ap", "Attack potency", "The damage an attack can meaningfully inflict on a target, which is not always equal to visible environmental destruction."],
    ["dc", "Destructive capacity", "The amount of the environment an attack physically destroys."],
    ["hax", "Hax", "An unusual rule-based ability that can bypass ordinary stat comparisons."],
    ["wincon", "Win condition", "A realistic route a character can use to win a matchup."],
    ["jogoat", "Jogoat", "A joking praise-name for Jogo; it is not a canon title."],
    ["goatjo", "Goatjo", "A fandom praise-name for Gojo."],
    ["fraudkuna", "Fraudkuna", "A fandom agenda insult aimed at Sukuna, not a canon form or verdict."],
    ["bumgumi", "Bumgumi", "A fandom agenda insult aimed at Megumi."],
    ["potential man", "Potential Man", "A meme about Megumi's frequently discussed potential."],
    ["wuta", "Wuta", "A fandom praise-name for Yuta."], ["wuji", "Wuji", "A fandom praise-name for Yuji."]
  ];

  function fanDefinitions(query, q) {
    if (!/(what|mean|define|stands for|who is|who are|are the)/.test(q)) return false;
    if (/disaster curses|disaster spirits/.test(q)) {
      return answer(query, "jogo", ["jogo", "hanami", "dagon", "mahito"], "Disaster Curses",
        "The Disaster Curses are Jogo, Hanami, Dagon, and Mahito. The phrase is common fandom shorthand for their allied special-grade group, not the name of Disaster Flames.",
        [["Jogo", "Volcanoes and the earth."], ["Hanami", "Forests and nature."], ["Dagon", "The sea."], ["Mahito", "Humans' fear and hatred of one another."], ["Canon status", "Their alliance is canon; the umbrella label is informal."]],
        "Group-definition question", "Fan group resolved");
    }
    if (/disaster trio/.test(q)) {
      return answer(query, "jogo", ["jogo", "hanami", "dagon"], "Disaster Trio",
        "The Disaster Trio usually means Jogo, Hanami, and Dagon—the three nature-based disaster curses. Mahito is normally excluded from this narrower fan label.",
        [["Jogo", "Volcanoes / earth."], ["Hanami", "Forests / nature."], ["Dagon", "Sea."], ["Terminology", "Community wording may vary, so the roster should be stated explicitly."]], "Group-definition question", "Fan group resolved");
    }
    if (/heavy hitters/.test(q)) {
      return mangaAnswer(query, "yuta", ["yuta", "kinji-hakari", "maki", "yuji"], "Jujutsu High's heavy hitters",
        "The label most consistently refers to Yuta, Hakari, and Maki; late-story fandom often includes Yuji as another top front-line fighter.",
        [["Core trio", "Yuta Okkotsu, Kinji Hakari, and Maki Zenin."], ["Yuji", "Frequently added in late-story discussion after his major growth."], ["Canon status", "This is a flexible descriptive label, not an official grade roster."]], "Group-definition question", "Fan group resolved");
    }
    if (/big three clans|three great clans|big 3 clans/.test(q)) {
      return answer(query, "zenin-clan", ["gojo-clan", "zenin-clan", "kamo-clan"], "The Three Great Families",
        "The three great jujutsu families are the Gojo, Zenin, and Kamo clans.",
        [["Gojo", "Known for Limitless and the Six Eyes."], ["Zenin", "Associated with inherited techniques such as Ten Shadows and Projection Sorcery."], ["Kamo", "Known for Blood Manipulation."]], "Group-definition question", "Canon institution");
    }
    if (/first years|main trio/.test(q)) return answer(query, "yuji", ["yuji", "megumi", "nobara"], "Tokyo first years", "The main Tokyo first-year trio is Yuji Itadori, Megumi Fushiguro, and Nobara Kugisaki.", [["Cohort", "Yuta was a first year during JJK 0, one school year earlier."]], "Group-definition question", "School group");
    if (/second years/.test(q)) return answer(query, "maki", ["maki", "panda", "toge-inumaki", "yuta"], "Tokyo second years", "The Tokyo second years are Maki, Panda, Toge Inumaki, and Yuta Okkotsu.", [["Why Yuta is sometimes omitted", "He trains overseas during much of the early main story."]], "Group-definition question", "School group");
    if (/death paintings/.test(q)) return answer(query, "death-painting-wombs", ["choso", "eso", "kechizu"], "Cursed Womb: Death Paintings", "The Death Paintings are nine cursed-womb hybrids; Choso, Eso, and Kechizu are the three who incarnate and act directly early in the story.", [["Classification", "They are human–cursed-spirit hybrids incarnated through human vessels."]], "Group-definition question", "Canon group");
    const matches = FAN_DEFINITIONS.filter(([phrase]) => new RegExp(`(^|[^a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^a-z0-9])`).test(q)).sort((a, b) => b[0].length - a[0].length);
    if (!matches.length) return false;
    const longest = matches[0][0].length;
    const selected = matches.filter(item => item[0].length === longest || !matches[0][0].includes(item[0]));
    return answer(query, null, [], selected.map(x => x[1]).join(" and "), selected.map(x => `${x[1]} means ${x[2]}`).join(" "), [...selected.map(x => [x[1], x[2]]), ["Canon status", "The shorthand is community vocabulary; the underlying characters and mechanics may be canon."]], "Fandom vocabulary", "Fan term resolved");
  }

  function basicInteractions(query, q) {
    if (/malevolent shrine/.test(q) && /unlimited void/.test(q) && /(break|destroy|clash|beat|win)/.test(q) && !/(weaker|stronger on the outside|radius.*smaller|damage sukuna|tiny|compressed|instantly kill gojo)/.test(q)) {
      return mangaAnswer(query, "malevolent-shrine", ["unlimited-void", "domain-clash", "open-barrier-domain"], "Would Malevolent Shrine break Unlimited Void?",
        "Under the normal barrier conditions shown, yes: Malevolent Shrine attacks Unlimited Void's outer shell from outside while their sure-hits cancel inside the overlap.",
        [["Inside", "Comparable sure-hits neutralize one another."], ["Outside", "Shrine's open range extends beyond the closed shell and strikes its weaker exterior."], ["Not a universal instant win", "Gojo changes barrier size and durability, turning the clash into a timed race."], ["Caster damage", "Either domain can also collapse when its caster is injured badly enough."]], "Domain interaction", "Direct manga mechanics");
    }
    if (/black flash/.test(q) && /infinity|limitless/.test(q) && /bypass|hit|go through/.test(q)) return answer(query, "black-flash", ["limitless"], "Would Black Flash bypass Infinity?", "No. Black Flash amplifies a blow after contact timing is achieved; it does not create contact through Infinity.", [["Contact first", "The physical hit must already reach Gojo."], ["Needed setup", "Domain Amplification, a sure-hit, or technique nullification would have to solve Infinity separately."]], "Technique interaction", "Direct mechanic answer");
    if (/domain amplification/.test(q) && /infinity|limitless/.test(q) && /bypass|hit|touch|neutralize/.test(q) && !/(jogo.*black flash|purple|black rope|cleave)/.test(q)) return answer(query, "domain-amplification", ["limitless", "gojo"], "Can Domain Amplification bypass Infinity?", "Yes. It neutralizes Infinity at the point of contact, allowing the user to touch Gojo while amplification is maintained.", [["Tradeoff", "The user generally cannot activate their own innate technique through the body at the same time."], ["Not a damage boost", "The user still needs enough physical ability to capitalize."]], "Technique interaction", "Direct mechanic answer");
    if (/world.*slash|world cutting/.test(q) && /infinity|limitless/.test(q) && /bypass|hit|cut/.test(q)) return mangaAnswer(query, "world-cutting-slash", ["limitless", "sukuna"], "Does the world-cutting slash bypass Infinity?", "Yes. It targets the space containing Gojo instead of sending an ordinary slash through Infinity toward his body.", [["Retargeting", "The target definition changes from the person to the world-space they occupy."], ["Not raw output", "It is a different mechanism, not simply a stronger Dismantle."]], "Spatial bypass", "Direct manga mechanics");
    if (/inverted spear/.test(q) && /infinity|limitless/.test(q)) return answer(query, "inverted-spear", ["limitless", "toji"], "Can the Inverted Spear of Heaven bypass Infinity?", "Yes. Its technique-nullifying effect disrupts Limitless on contact and lets the blade reach Gojo.", [["Requirement", "The weapon itself must reach the technique boundary."], ["Effect", "It nullifies the cursed technique rather than overpowering space with raw force."]], "Tool interaction", "Direct canon");
    if (/black rope/.test(q) && /infinity|limitless/.test(q) && !/domain amplification/.test(q)) return answer(query, "black-rope", ["limitless", "miguel"], "Can Black Rope disrupt Infinity?", "Yes. Black Rope interferes with cursed techniques it contacts, creating openings against Limitless while the rope is consumed.", [["Temporary", "The disruption is not permanent."], ["Consumable", "The rope burns away through use."]], "Tool interaction", "Direct canon");
    if (/positive energy/.test(q) && /cursed spirit/.test(q) && /(kill|harm|heal|destroy)/.test(q)) return answer(query, "positive-energy", ["cursed-spirit", "reverse-cursed-technique"], "How does positive energy affect cursed spirits?", "Positive energy is destructive to cursed spirits rather than restorative because their bodies are composed of negative cursed energy.", [["Healing distinction", "Cursed spirits regenerate with negative cursed energy."], ["Output", "A sorcerer must project positive energy outward for it to directly exorcise a curse."]], "Energy interaction", "Direct mechanic answer");
    if (/soul damage/.test(q) && /mahito/.test(q)) return answer(query, "soul-damage", ["mahito", "idle-transfiguration"], "Does soul damage bypass Mahito's defense?", "Yes. It damages the part Mahito must preserve rather than only a body he can reshape, forcing genuine cursed-energy expenditure and threatening exorcism.", [["Ordinary damage", "Mahito can restore the body around an intact soul."], ["Soul-aware attacks", "Yuji, Resonance, and soul-cutting weapons can reach the protected core."]], "Soul interaction", "Direct mechanic answer");
    if (/jacob(?: s|s)? ladder/.test(q) && /sukuna/.test(q) && !/megumi/.test(q)) return mangaAnswer(query, "jacobs-ladder", ["sukuna", "angel", "vessel-and-incarnation"], "Would Jacob's Ladder affect Sukuna?", "Yes. Technique Extinguishment suppresses cursed techniques and is especially dangerous to Sukuna's incarnation bond with a host.", [["Technique", "Shrine is extinguished during exposure."], ["Incarnation", "The cursed-object connection sustaining Sukuna is also attacked."], ["Limit", "Sukuna can resist, interrupt, or escape before complete eradication."]], "Technique extinguishment", "Direct manga mechanics");
    return false;
  }

  function fandomAndGroups(query, q) {
    if (/disaster family/.test(q)) {
      return answer(query, "jogo", ["jogo", "hanami", "dagon", "mahito"], "The Disaster Curses",
        "“Disaster family” is loose fandom wording for the Disaster Curses: Jogo, Hanami, Dagon, and Mahito.",
        [["Jogo", "Volcanoes and the earth."], ["Hanami", "Forests and nature."], ["Dagon", "The sea and aquatic disasters."], ["Mahito", "Humanity's fear and hatred of other humans."], ["Canon status", "The characters and alliance are canon; “disaster family” is not an official team name."]],
        "Fan-group alias", "Fandom phrase resolved");
    }
    if (/which disaster curse.*strongest|strongest disaster curse/.test(q)) {
      return answer(query, "jogo", ["jogo", "mahito", "hanami", "dagon"], "Who is the strongest Disaster Curse?",
        "Jogo is the safest answer for strongest overall at the points shown, especially in raw output, speed, and completed domain combat. Mahito has the highest growth potential and the most dangerous rule-based technique, so the answer changes if “strongest” means future ceiling rather than demonstrated combat power.",
        [["Jogo's case", "He has the clearest high-end speed and destructive-output portrayal, a completed domain, Maximum Meteor, and direct recognition from Sukuna."], ["Mahito's case", "Idle Transfiguration is more matchup-warping, and Mahito evolves rapidly, but he is less experienced and is defeated before fully reaching his ceiling."], ["Hanami and Dagon", "Both are special-grade threats with strong durability or domains, but neither is portrayed above Jogo overall."], ["Bottom line", "Demonstrated overall strength: Jogo. Highest unrealized potential and hax: Mahito."]],
        "Group ranking with definition", "Canon-based comparison");
    }
    if (/why.*mahito.*(?:counted|included|grouped).*disaster/.test(q)) {
      return answer(query, "mahito", ["jogo", "hanami", "dagon", "mahito"], "Why is Mahito called a Disaster Curse?",
        "Mahito is grouped with the Disaster Curses because he is their allied special-grade peer and shares their goal, not because he represents a natural disaster.",
        [["Different origin", "Mahito embodies humans' fear and hatred of other humans."], ["Shared faction", "He works directly with Jogo, Hanami, and Dagon and becomes central to their plan against humanity and Gojo."], ["Fan label", "“Disaster Curses” is an umbrella term used by the community; the narrower “Disaster Trio” usually means only Jogo, Hanami, and Dagon."]],
        "Group-membership explanation", "Fan term reconciled with canon");
    }
    if (/choso/.test(q) && /eso/.test(q) && /kechizu/.test(q) && /disaster curse/.test(q)) {
      return answer(query, "choso", ["choso", "eso", "kechizu", "death-painting-wombs"], "Are Choso, Eso, and Kechizu Disaster Curses?",
        "No. They are incarnated Cursed Womb: Death Paintings—human/cursed-spirit hybrids—not members of the Disaster Curse group.",
        [["Classification", "They originate as cursed objects created through Noritoshi Kamo's experiments and incarnate through human vessels."], ["Different faction", "They cooperate with Mahito and the disaster curses for a time, but alliance does not make them the same species or group."], ["Why confusion happens", "They appear alongside the curses and possess curse-like bodies and techniques."]],
        "Group-membership correction", "Classification answer");
    }
    if (/top tier/.test(q) && /(mean|what is|define)/.test(q)) {
      return answer(query, null, [], "Top tier",
        "“Top tier” is fandom shorthand for characters placed near the highest level of the setting. It is not an official grade and depends on the comparison being discussed.",
        [["Not a canon rank", "Special grade is official; top tier is a fan-made powerscaling bracket."], ["Context matters", "A list may mean strongest alive, strongest in one era, or strongest excluding Gojo and Sukuna."], ["Evidence required", "The label should be supported with output, speed, domain, recovery, and matchup tools rather than used as proof by itself."]],
        "Fandom vocabulary", "Community term defined");
    }
    if (/domainless/.test(q) && /(mean|what is|define)/.test(q)) {
      return answer(query, null, ["domain-expansion"], "Domainless",
        "“Domainless” means a character has no confirmed Domain Expansion. It does not necessarily prove they are incapable of ever developing one.",
        [["Shown versus impossible", "Not having displayed a domain is different from canon stating the character cannot use one."], ["Other defenses", "A domainless fighter may still use Simple Domain, Hollow Wicker Basket, Domain Amplification, or avoid the clash entirely."], ["Fan usage", "Powerscalers often use the term as matchup shorthand, not an official classification."]],
        "Fandom vocabulary", "Community term defined");
    }
    if (/hax/.test(q) && /idle transfiguration/.test(q)) {
      return answer(query, "idle-transfiguration", ["mahito", "soul-damage"], "Does Idle Transfiguration count as hax?",
        "Yes. In fandom language, Idle Transfiguration is hax because it attacks and reshapes the soul, bypassing ordinary physical durability when its activation conditions are met.",
        [["Why it qualifies", "The target cannot reliably answer it by merely having tougher skin or stronger muscles."], ["Conditions still matter", "Mahito normally needs soul contact, and targets with soul awareness, special protection, or a domain response can resist or punish him."], ["Not an automatic win", "Hax describes an unusual rule advantage, not guaranteed victory regardless of speed, range, or matchup."]],
        "Fandom term applied to canon", "Community vocabulary + mechanic");
    }
    if (/gojo/.test(q) && /wincon/.test(q) && /mahoraga/.test(q)) {
      return mangaAnswer(query, "gojo", ["mahoraga", "hollow-purple", "limitless"], "What is Gojo's win condition against Mahoraga?",
        "Gojo's clearest win condition is destroying Mahoraga with overwhelming output before it completes the relevant adaptations—or using a new phenomenon that its current adaptation has not solved.",
        [["End it early", "Adaptation takes exposure and wheel progression, so immediate high-output attacks reduce the time available."], ["Change phenomena", "Infinity adaptation does not automatically solve Blue, Red, and Hollow Purple as one package."], ["Canon result", "Gojo ultimately destroys Mahoraga with an unrestricted Hollow Purple before a completed Purple-specific answer is shown."], ["Risk", "Dragging the fight out gives Mahoraga more opportunities to develop counters and provide Sukuna with a model."]],
        "Win-condition analysis", "Direct manga mechanics");
    }
    return false;
  }

  function formsAndScaling(query, q) {
    if (/meguna/.test(q) && /yujikuna/.test(q) && /(stronger|difference|changes|compare)/.test(q)) {
      return mangaAnswer(query, "sukuna", ["megumi", "yuji", "ten-shadows", "shrine"], "Meguna versus Yujikuna",
        "Meguna generally has the broader and stronger demonstrated moveset because Sukuna gains Ten Shadows and Mahoraga in addition to Shrine. Yujikuna has Yuji's vessel body, but no Ten Shadows access.",
        [["Meguna", "Sukuna in Megumi's body can use Ten Shadows, adaptation, shikigami combinations, and Shrine, though innate techniques are not freely activated through his body simultaneously."], ["Yujikuna", "Sukuna in Yuji's body uses Shrine and benefits from Yuji's vessel, but Yuji suppresses him and provides no inherited technique at that stage."], ["Not a pure stat label", "Finger count, incarnation state, body condition, and available techniques still need to be specified."], ["Verdict", "At comparable finger power and control, Meguna has more options and the stronger shown matchup toolkit."]],
        "Form comparison", "Fandom form names resolved");
    }
    if (/heian sukuna/.test(q) && /meguna/.test(q) && /(difference|compare|versus|vs)/.test(q)) {
      return mangaAnswer(query, "sukuna", ["ten-shadows", "shrine", "mahoraga"], "Heian Sukuna versus Meguna: what changes?",
        "Heian Sukuna is Sukuna's original four-armed body, optimized for jujutsu combat; Meguna is Sukuna controlling Megumi's body and gaining Ten Shadows.",
        [["Heian body", "Four arms and two mouths improve hand signs, chanting, weapon use, and simultaneous close combat."], ["Meguna toolkit", "Megumi's body gives Sukuna Ten Shadows, including Mahoraga's adaptation and composite shikigami."], ["Tradeoff", "Heian form has the superior natural body; Meguna has the more varied borrowed technique package."], ["Not separate characters", "Both labels describe Sukuna in different bodies and stages."]],
        "Form-to-form comparison", "Fandom form names resolved");
    }
    if (/\b(\d{1,2})\s*f(?:inger)?s?\b/.test(q) && /sukuna/.test(q) && /(percent|percentage|linear|stats)/.test(q)) {
      const n = Number((/\b(\d{1,2})\s*f(?:inger)?s?\b/.exec(q) || [])[1]);
      return answer(query, "sukuna", ["cursed-energy-reserves", "cursed-energy-output"], `Does ${n}-finger Sukuna have exactly ${n * 5}% of 20-finger Sukuna's stats?`,
        "No. Finger count tracks how much of Sukuna's sealed power has been restored, but canon never defines every stat as a perfectly linear percentage.",
        [["Useful shorthand", "More fingers generally mean greater restored cursed energy and overall threat."], ["Not one slider", "Output, refinement, physical vessel, technique access, injuries, and incarnation state do not have to rise in identical proportions."], ["Matchup use", "Finger count is a starting condition, not a complete numerical character sheet."], ["Specific percentage", `${n * 5}% is arithmetic based on the count, not a canon statement that every ability equals that percentage.`]],
        "Fan scaling correction", "Finger-count semantics");
    }
    return false;
  }

  function domainLogic(query, q) {
    const shrineVoid = /malevolent shrine|\bshrine\b/.test(q) && /unlimited void|\buv\b/.test(q);
    if (shrineVoid && /sure.?hit.*(?:weaker|stronger)|because.*sure.?hit/.test(q)) {
      return mangaAnswer(query, "unlimited-void", ["malevolent-shrine", "domain-clash", "open-barrier-domain"], "Is Unlimited Void's sure-hit weaker than Malevolent Shrine's?",
        "No. In their balanced clashes, the sure-hits cancel inside the overlapping space. Unlimited Void's barrier loses because Malevolent Shrine can attack its exterior, not because Shrine's sure-hit simply overpowers it.",
        [["Inside", "Comparable refinement neutralizes the guaranteed effects where the domains overlap."], ["Outside", "Shrine's open range extends beyond the closed shell and cuts the weaker exterior."], ["Evidence", "When Gojo changes the barrier conditions, Unlimited Void survives longer despite the same underlying sure-hit techniques."], ["Conclusion", "Barrier geometry creates the advantage; it is not proof that Unlimited Void has a weaker effect."]],
        "Domain-clash misconception", "Direct manga mechanics");
    }
    if (shrineVoid && /tiny|small.*unlimited void|compressed.*unlimited void/.test(q) && /break|outside|survive/.test(q)) {
      return mangaAnswer(query, "unlimited-void", ["malevolent-shrine", "barrier-techniques", "domain-clash"], "Can Malevolent Shrine break the tiny Unlimited Void?",
        "It can still damage the compressed barrier from outside, but the tiny shell is much more resistant and survives for roughly the three-minute window Gojo needs to damage Sukuna. The clash becomes a race, not an immediate barrier break.",
        [["Why compression helps", "Shrinking the barrier increases its resistance to Malevolent Shrine's exterior slashes."], ["What Shrine keeps", "Its open range still extends beyond the shell, so the outside-attack mechanism remains available."], ["Canon outcome", "The domains collapse at nearly the same time when Gojo damages Sukuna enough to end Shrine as the compressed barrier reaches its limit."], ["Answer", "Breakable under continued pressure, but no longer quickly or automatically."]],
        "Compressed-domain interaction", "Direct manga mechanics");
    }
    if (shrineVoid && /stronger on the outside|outside.*stronger|flipped.*barrier|reverse.*barrier/.test(q)) {
      return mangaAnswer(query, "unlimited-void", ["malevolent-shrine", "barrier-techniques", "domain-clash"], "Can Shrine still break Unlimited Void after Gojo strengthens the exterior?",
        "It can still pressure and eventually break the shell, but the strengthened exterior lasts much longer. That extra time lets Gojo damage Sukuna enough to collapse Malevolent Shrine first, so the adjustment changes the race rather than making the barrier unbreakable.",
        [["Normal shell", "A standard closed domain is vulnerable from outside and breaks quickly under Shrine."], ["Flipped conditions", "Gojo trades internal durability for a stronger exterior, then later compresses the domain to further improve resistance."], ["Three-minute race", "The clash becomes whether Shrine breaks the shell before Gojo injures Sukuna enough to end Shrine."], ["Direct answer", "Stronger does not mean impossible to break; it means the timing and win condition change."]],
        "Barrier-condition analysis", "Direct manga mechanics");
    }
    if (shrineVoid && /radius.*smaller|smaller.*radius|fully contained|inside.*unlimited void/.test(q)) {
      return mangaAnswer(query, "malevolent-shrine", ["unlimited-void", "open-barrier-domain"], "Does a smaller Malevolent Shrine keep the outside advantage?",
        "Only if Shrine's effective range still extends beyond Unlimited Void's actual barrier shell. If the entire open domain is contained inside that shell, it has no exterior portion available to attack the barrier from outside.",
        [["What creates the advantage", "Open geometry alone is not magic; the active range must physically reach the closed barrier's exterior."], ["If contained", "The domains would primarily contest inside, where sure-hit refinement and caster performance matter."], ["If it extends beyond", "The external slashes can attack the shell just as in the canon clash."], ["Range is a condition", "Changing radius can trade area for output or precision, so the result depends on the chosen conditions."]],
        "Open-versus-closed geometry", "Barrier-condition reasoning");
    }
    if (shrineVoid && /damage sukuna.*(?:while|as).*shrine.*barrier|while shrine attacks.*barrier/.test(q)) {
      return mangaAnswer(query, "unlimited-void", ["malevolent-shrine", "sukuna", "gojo"], "Can Unlimited Void affect Sukuna while Shrine attacks the barrier?",
        "Not while both domains' sure-hits are evenly canceling in the overlap. Unlimited Void reaches Sukuna when Malevolent Shrine drops, loses synchronization, or leaves him without that opposing sure-hit protection.",
        [["During the tie", "The guaranteed effects cancel in the shared space even though Shrine separately attacks Unlimited Void's exterior."], ["Opening", "A tiny timing difference after Sukuna restores his technique lets Unlimited Void land before Shrine fully protects him."], ["Manual combat", "Gojo can still physically attack Sukuna during the clash; sure-hit cancellation does not pause the fight."], ["Answer", "Exterior pressure and internal sure-hit cancellation happen at the same time, but they are different mechanisms."]],
        "Simultaneous domain processes", "Direct manga mechanics");
    }
    if (/jogo.?s domain|coffin of the iron mountain/.test(q) && /unlimited void/.test(q) && /cancel|clash|sure.?hit|beat/.test(q)) {
      return answer(query, "unlimited-void", ["coffin-iron-mountain", "gojo", "jogo"], "Can Jogo's domain cancel Unlimited Void?",
        "Only a sufficiently competitive domain can neutralize another sure-hit. In canon, Unlimited Void overwhelms Jogo's Coffin of the Iron Mountain almost immediately, so Jogo does not maintain a stable cancellation.",
        [["General rule", "Sure-hits can cancel during a genuine domain clash."], ["This matchup", "Gojo's refinement and control are portrayed as vastly superior to Jogo's."], ["Canon event", "Unlimited Void dominates the interior and incapacitates Jogo."], ["Not just reserves", "The result reflects domain refinement and skill, not a simple cursed-energy-total comparison."]],
        "Specific domain clash", "Direct anime canon");
    }
    if (/jogo.?s domain|coffin of the iron mountain/.test(q) && /gojo|unlimited void/.test(q) && /more cursed energy|reserves/.test(q)) {
      return answer(query, "coffin-iron-mountain", ["unlimited-void", "cursed-energy-reserves", "domain-clash"], "Does Jogo's domain lose just because Gojo has more cursed energy?",
        "No. Cursed-energy reserves help sustain a domain, but domain clashes are decided primarily by refinement, barrier construction, technique compatibility, and the casters' performance. Jogo loses because Unlimited Void is vastly superior in those demonstrated factors—not because one reserve number automatically wins.",
        [["Reserves", "Pay the cost and support continued output."], ["Refinement", "Determines how coherently the domain and sure-hit contest the opposing barrier."], ["Combat pressure", "Damage to the caster can also collapse a domain even without the barrier being directly overpowered."], ["Canon result", "Unlimited Void overwhelms Coffin of the Iron Mountain immediately."]],
        "Domain-scaling correction", "Mechanic hierarchy");
    }
    if (/domain refinement/.test(q) && /cursed energy reserves|more cursed energy|reserves/.test(q) && /(matter|more|difference|versus|vs)/.test(q)) {
      return answer(query, "domain-clash", ["cursed-energy-reserves", "barrier-techniques", "domain-expansion"], "Refinement versus cursed-energy reserves",
        "Refinement matters more directly in a domain clash, while reserves determine whether the caster can afford and sustain the technique. Neither statistic completely replaces the other.",
        [["Refinement", "Covers barrier skill, sure-hit construction, stability, and how well the innate domain is realized."], ["Reserves", "Supply the large activation cost and ongoing output."], ["Other variables", "Open versus closed geometry, range, binding vows, damage to the caster, and countermeasures can overturn a simple ranking."], ["Bottom line", "More cursed energy does not automatically create the more refined domain."]],
        "Domain-stat relationship", "Mechanics comparison");
    }
    if (/two open domains|open domains/.test(q) && /source|center|each other.*caster|attack each other/.test(q)) {
      return mangaAnswer(query, "open-barrier-domain", ["malevolent-shrine", "womb-profusion", "domain-clash"], "What would two open domains attack in a clash?",
        "Neither domain provides the usual closed outer shell for the other to break. Their effective areas and sure-hits would overlap, and each caster could remain a target if the opposing sure-hit is not canceled—but canon has never shown a full open-domain-versus-open-domain clash.",
        [["No closed shell", "The outside-barrier weakness used against ordinary domains is absent."], ["Sure-hit contest", "Overlapping guaranteed effects would likely contest through refinement and compatibility in the shared area."], ["Caster pressure", "Manual attacks and any uncanceled sure-hit could damage the opposing caster and collapse their domain."], ["Visual centerpiece", "A shrine or central structure is not automatically confirmed to be a physical 'source object' that can simply be destroyed."], ["Canon limit", "The exact geometry remains an informed inference until an open-open clash is shown."]],
        "Open-domain clash geometry", "Rule-based manga inference");
    }
    if (/closed domain/.test(q) && /zero cursed energy|no cursed energy/.test(q) && /enter willingly|consent|voluntar/.test(q)) {
      return mangaAnswer(query, "domain-expansion", ["maki", "toji", "sure-hit-effect"], "Can a zero-cursed-energy person enter a closed domain voluntarily?",
        "Yes. Someone like fully realized Maki can choose to enter a closed barrier, but voluntary entry does not automatically make a standard sure-hit recognize her as a normal cursed-energy target.",
        [["Barrier treatment", "A complete Heavenly Restriction causes many barriers to treat the person like an inanimate object."], ["Consent", "Maki can enter domains that otherwise cannot automatically trap her."], ["Sure-hit question", "Targeting still depends on the domain's embedded rules; object-targeting or real-space effects can threaten her even when ordinary recognition fails."], ["Not universal immunity", "She can still be attacked manually inside the domain."]],
        "Zero-energy barrier interaction", "Direct manga rules");
    }
    if (/malevolent shrine/.test(q) && /toji/.test(q) && /no cursed energy|zero cursed energy|target/.test(q)) {
      return mangaAnswer(query, "malevolent-shrine", ["toji", "dismantle", "sure-hit-effect"], "Would Malevolent Shrine target Toji?",
        "Yes. Malevolent Shrine uses Dismantle against things without cursed energy, including the environment, so Toji's zero cursed energy does not hide him from its area-wide targeting.",
        [["Targeting split", "Cleave is assigned to cursed-energy targets; Dismantle attacks targets without cursed energy."], ["Why Toji is different elsewhere", "Many closed domains cannot recognize him, but Shrine's sure-hit explicitly includes the physical world."], ["Defense", "His speed and durability matter, but zero cursed energy alone is not immunity."]],
        "Zero-energy domain exception", "Direct manga mechanics");
    }
    if (/simple domain/.test(q) && /maki/.test(q) && /malevolent shrine/.test(q)) {
      return mangaAnswer(query, "simple-domain", ["maki", "malevolent-shrine"], "Would Simple Domain protect Maki from Malevolent Shrine?",
        "Yes, temporarily, if she could deploy or remain inside one. Simple Domain interferes with Shrine's sure-hit locally even though Shrine can normally target her with Dismantle.",
        [["What it protects from", "The guaranteed slashes within the Simple Domain's defensive area."], ["What it does not erase", "Malevolent Shrine itself, manual attacks, debris, or the danger after the Simple Domain is stripped away."], ["Maki's canon kit", "Maki is not shown personally using Simple Domain, so this is a compatibility answer rather than a demonstrated move."], ["Time limit", "A powerful domain can tear the defense apart."]],
        "Anti-domain compatibility", "Rule-based manga answer");
    }
    return false;
  }

  function amplificationAndSwaps(query, q) {
    if (/domain amplification/.test(q) && /jogo/.test(q) && /gojo/.test(q) && /black flash/.test(q)) {
      return answer(query, "domain-amplification", ["jogo", "gojo", "black-flash", "limitless"], "Could Jogo use Domain Amplification to land a Black Flash on Gojo?",
        "In principle, yes: Domain Amplification could create physical contact through Infinity, and a correctly timed cursed-energy strike could then become a Black Flash. Canon never shows Jogo performing the combination.",
        [["Contact solution", "Amplification neutralizes Infinity at the point of impact."], ["Black Flash condition", "The cursed energy must arrive within one millionth of a second of the physical blow; contact alone does not guarantee it."], ["Tradeoff", "Jogo cannot simultaneously fire Disaster Flames through his innate technique while maintaining amplification."], ["Practical difficulty", "Gojo's speed and close-combat skill make landing the clean hit extremely unlikely."]],
        "Three-mechanic compatibility", "Rule-based interaction");
    }
    if (/jogo/.test(q) && /disaster flames|flames|innate technique/.test(q) && /domain amplification/.test(q) && /(while|same time|active)/.test(q)) {
      return answer(query, "domain-amplification", ["jogo", "disaster-flames"], "Can Jogo use Disaster Flames while Domain Amplification is active?",
        "Not simultaneously through his body. Domain Amplification must remain empty to receive and neutralize the opposing technique, so Jogo has to suspend it before activating Disaster Flames.",
        [["Why", "Filling the amplification with his own innate technique defeats its neutralizing function."], ["Switching", "Skilled users can turn amplification on and off quickly, creating the appearance of alternating offense and defense."], ["What remains usable", "Physical attacks and cursed-energy reinforcement are still available while amplification is active."]],
        "Technique compatibility", "Direct amplification rule");
    }
    if (/sukuna/.test(q) && /cleave/.test(q) && /domain amplification/.test(q) && /gojo/.test(q)) {
      return mangaAnswer(query, "domain-amplification", ["sukuna", "cleave", "gojo", "malevolent-shrine"], "Can Sukuna use Cleave through his body while Domain Amplification is active?",
        "No—not as a simultaneous personal innate-technique activation. Sukuna can switch rapidly between amplification and Shrine, while a technique already embedded in Malevolent Shrine may continue operating separately.",
        [["Personal casting", "Domain Amplification occupies the technique channel around Sukuna's body and prevents simultaneous use of his innate technique there."], ["Rapid switching", "Sukuna toggles amplification to touch Gojo, then can drop it to resume technique use."], ["Domain exception", "Malevolent Shrine's embedded slashes can remain active because the technique is operating through the domain rather than being newly cast through Sukuna's body."], ["Cleave contact", "He still needs the appropriate technique state and contact conditions to use Cleave directly."]],
        "Amplification and embedded technique", "Direct manga mechanics");
    }
    if (/domain amplification/.test(q) && /hollow purple|purple/.test(q) && /erase|neutralize|stop|block/.test(q)) {
      return mangaAnswer(query, "domain-amplification", ["hollow-purple", "limitless"], "Would Domain Amplification erase Hollow Purple?",
        "It could interfere with the technique on contact, but canon does not show ordinary Domain Amplification safely erasing a full Hollow Purple. The attack's output and scale may overwhelm the user before enough of it is neutralized.",
        [["Mechanism", "Amplification accepts and neutralizes an opposing technique at the contact boundary."], ["Capacity matters", "Neutralization is not portrayed as infinite; strong output can pressure or overwhelm the defense."], ["Not a shield from physics", "Even partial neutralization may not remove the explosion, debris, or remaining energy around the user."], ["Confidence", "Compatibility is plausible, guaranteed survival is not confirmed."]],
        "Technique neutralization versus output", "Calibrated manga inference");
    }
    if (/black rope/.test(q) && /domain amplification/.test(q) && /infinity|limitless/.test(q) && /stack|together|combine/.test(q)) {
      return answer(query, "domain-amplification", ["black-rope", "limitless"], "Can Black Rope and Domain Amplification stack against Infinity?",
        "They could theoretically be used in the same exchange, but canon never shows them multiplying each other's nullification. Both solve the same contact problem, so the combination is more redundant than an automatic stronger bypass.",
        [["Black Rope", "Disrupts a cursed technique when the rope contacts it and is consumed through use."], ["Domain Amplification", "Surrounds the user with a neutralizing domain-like layer."], ["Possible benefit", "The rope could preserve contact during moments when amplification is switched off or add another source of interference."], ["No confirmed multiplier", "There is no canon rule saying two nullifiers double the effect or permanently disable Limitless."]],
        "Stacking two nullifiers", "Rule-based interaction");
    }
    if (/boogie woogie|todo/.test(q) && /maki/.test(q) && /holding|carrying|has/.test(q) && /cursed tool/.test(q) && /swap/.test(q)) {
      return mangaAnswer(query, "boogie-woogie", ["todo", "maki", "cursed-tool"], "Could Boogie Woogie swap Maki while she holds a cursed tool?",
        "Not by targeting Maki's body itself, because she has zero cursed energy. Todo could instead target and swap the cursed tool separately if it contains enough cursed energy; holding the tool does not automatically make Maki a valid target.",
        [["Maki", "Her fully realized Heavenly Restriction removes the cursed-energy signature Boogie Woogie normally selects."], ["The tool", "A cursed tool has its own cursed energy and can qualify independently."], ["What happens physically", "Swapping the tool out of her hand could disarm or reposition it, but does not teleport her body with it by default."], ["Canon boundary", "The exact setup is unshown, but the separate-target rule follows Boogie Woogie's established mechanics."]],
        "Target ownership versus target energy", "Rule-based manga answer");
    }
    if (/todo/.test(q) && /cursed tool/.test(q) && /maki/.test(q) && /without swapping|tool.*not.*maki|swap the tool/.test(q)) {
      return mangaAnswer(query, "boogie-woogie", ["todo", "maki", "cursed-tool"], "Can Todo swap Maki's cursed tool without swapping Maki?",
        "Yes, if the tool itself carries enough cursed energy to qualify. Boogie Woogie selects cursed-energy targets individually, so the tool can be swapped even though Maki's zero-cursed-energy body normally cannot.",
        [["Separate targets", "Holding an object does not merge its cursed-energy signature with the wielder into one mandatory target."], ["Tool requirement", "The cursed tool must contain enough cursed energy for Todo to select it."], ["Maki remains", "Her body stays in place unless another valid target or physical interaction moves her."], ["Exact scene", "The specific Maki-tool swap is not shown, but the targeting rule supports it."]],
        "Object-versus-wielder targeting", "Rule-based manga answer");
    }
    if (/todo|boogie woogie/.test(q) && /through|out of|across/.test(q) && /unlimited void|domain.*barrier/.test(q)) {
      return answer(query, "boogie-woogie", ["todo", "unlimited-void", "barrier-techniques"], "Can Boogie Woogie swap someone through a closed domain barrier?",
        "Not as a reliable universal rule. A closed domain isolates its interior, and Boogie Woogie's targeting or effect may be blocked unless the barrier permits the connection or both valid targets are inside the same accessible space.",
        [["Valid targets", "Todo still needs two cursed-energy targets."], ["Barrier obstruction", "Closed barriers can block techniques, sensing, and spatial exchanges across the shell."], ["Inside use", "Boogie Woogie can function among valid targets already inside a domain if Todo remains able to activate it."], ["Unlimited Void problem", "An unprotected Todo would likely be incapacitated before executing the swap."]],
        "Technique across barrier", "Barrier-aware interaction");
    }
    return false;
  }

  function adaptationAndTotality(query, q) {
    if (/mahoraga/.test(q) && /adapt/.test(q) && /all of limitless|entire limitless|every limitless|at once/.test(q)) {
      return mangaAnswer(query, "mahoraga", ["limitless", "unlimited-void", "hollow-purple"], "Can Mahoraga adapt to all of Limitless at once?",
        "Not as one instant blanket adaptation. Infinity, Blue, Red, Hollow Purple, and Unlimited Void produce distinct phenomena, so Mahoraga may need separate exposure and wheel progression for each.",
        [["Confirmed", "Infinity and Unlimited Void receive specific answers."], ["Not confirmed", "A completed Hollow Purple adaptation is never shown."], ["Parallel progress", "Mahoraga can process multiple phenomena, but canon gives no unlimited simultaneous adaptation rate."], ["Survival", "It must survive each relevant exposure long enough for the answer to develop."]], "Multi-phenomenon adaptation", "Direct manga mechanics");
    }

    if (/mahoraga/.test(q) && /infinity/.test(q) && /\bred\b/.test(q) && /(hurt|damage|work|still)/.test(q)) {
      return mangaAnswer(query, "mahoraga", ["limitless", "gojo"], "Would Red still hurt Mahoraga after it adapts to Infinity?",
        "Yes, until Mahoraga separately adapts to Red. Solving neutral Infinity does not grant blanket immunity to every Limitless application.",
        [["Different phenomenon", "Infinity slows approach; Red produces repulsive spatial force."], ["Canon behavior", "Gojo continues using Blue and Red as meaningful threats after Infinity has been bypassed."], ["Adaptation path", "Exposure to Red could start or advance a Red-specific answer if Mahoraga survives."], ["Bottom line", "Infinity adaptation changes contact with Gojo, not all spatial damage at once."]],
        "Specific adaptation scope", "Direct manga mechanics");
    }
    if (/mahoraga/.test(q) && /unlimited void/.test(q) && /protect sukuna|sukuna.*protected|give sukuna.*immunity/.test(q)) {
      return mangaAnswer(query, "mahoraga", ["unlimited-void", "sukuna", "megumi"], "Does Mahoraga's Unlimited Void adaptation make Sukuna personally immune?",
        "No. The adaptation lets Mahoraga act against Unlimited Void and gives Sukuna a strategic counter, but it does not automatically rewrite Sukuna's own brain into permanent immunity.",
        [["Who bore the process", "Sukuna placed the wheel's burden on Megumi's soul to advance the adaptation."], ["Mahoraga's role", "Once summoned with the completed answer, Mahoraga destroys Unlimited Void's barrier."], ["Sukuna's protection", "Sukuna remains protected during equal sure-hit cancellation or by using Mahoraga at the needed moment—not by gaining Mahoraga's personal adaptation as a passive trait."], ["Evidence", "Unlimited Void can still affect Sukuna when his domain protection fails."]],
        "Adaptation ownership", "Direct manga mechanics");
    }
    if (/mahoraga/.test(q) && /soul manipulation|idle transfiguration/.test(q) && /adapt/.test(q)) {
      return answer(query, "mahoraga", ["idle-transfiguration", "soul-damage", "sword-of-extermination"], "Could Mahoraga adapt to soul manipulation?",
        "In principle, yes, because its ability is not limited to physical elements—but it must survive meaningful exposure long enough to develop an answer. Canon never shows this exact interaction.",
        [["Possible phenomenon", "Soul reshaping is still a cursed-technique phenomenon that could be analyzed."], ["Survival gate", "Idle Transfiguration can be decisive on contact, so the first exposure may end the process before adaptation completes."], ["Mahoraga's offense", "Its positive-energy Sword of Extermination is already extremely dangerous to a cursed spirit like Mahito."], ["Confidence", "Adaptability supports the possibility; no completed soul-manipulation adaptation is canonically demonstrated."]],
        "Unshown adaptation interaction", "Rule-based inference");
    }
    if (/mahoraga/.test(q) && /survive.*entire|entire attack|experience part|partial exposure|just experience/.test(q)) {
      return mangaAnswer(query, "mahoraga", ["adaptation-wheel"], "How much exposure does Mahoraga need to adapt?",
        "It needs meaningful exposure and enough time or wheel progression to finish analyzing the phenomenon; it does not have to remain inside one continuous attack for the entire process. It does, however, need the shikigami or wheel-bearer to survive each exposure long enough for progress to continue.",
        [["Accumulation", "Repeated encounters can advance adaptation rather than requiring one uninterrupted hit."], ["Proxy exposure", "The wheel can be borne by another soul or user under special conditions, as shown with Unlimited Void."], ["First-hit danger", "An attack that destroys the shikigami or bearer before useful progress is made ends that attempt."], ["Phenomenon-specific", "The amount and kind of exposure required vary with what is being adapted to."]],
        "Adaptation timing", "Direct rule explanation");
    }
    if (/mahoraga/.test(q) && /dies|destroyed/.test(q) && /adaptation.*lost|wheel.*turn|keep.*adapt/.test(q)) {
      return mangaAnswer(query, "mahoraga", ["ten-shadows", "totality"], "What happens to an adaptation if Mahoraga is destroyed?",
        "Mahoraga can no longer use the active adaptation once destroyed. Canon does not confirm that its wheel or accumulated answers automatically transfer to another shikigami through Totality.",
        [["Active combat state", "The adapted shikigami must exist to apply its developed counter."], ["Ten Shadows inheritance", "Destroyed shikigami can pass compatible traits, but the exact inheritance rules are selective."], ["Unconfirmed point", "No scene shows Rabbit Escape, Piercing Ox, or another survivor inheriting Mahoraga's wheel and prior adaptations."], ["Responsible answer", "Treat automatic adaptation inheritance as fan theory unless the story states otherwise."]],
        "Destroyed-shikigami state", "Canon boundary");
    }
    if (/totality/.test(q) && /round deer/.test(q) && /positive energy|healing|inherit/.test(q)) {
      return mangaAnswer(query, "totality", ["round-deer", "merged-beast-agito", "ten-shadows"], "Can Totality inherit Round Deer's healing?",
        "Yes, compatible Round Deer traits can be inherited: Agito incorporates Round Deer and demonstrates powerful regeneration. That does not mean every surviving shikigami can receive the trait arbitrarily.",
        [["Direct example", "Merged Beast Agito combines traits from Nue: Totality and several other shikigami, including Round Deer."], ["Inherited function", "Agito uses regeneration associated with positive energy."], ["Compatibility rule", "Ten Shadows inheritance follows specific combinations rather than letting the user freely assign any ability to any shikigami."], ["Scope", "The example confirms inheritance is possible, not universal."]],
        "Totality inheritance", "Direct manga evidence");
    }
    if (/piercing ox/.test(q) && /chimera shadow garden/.test(q) && /charge|build.*power|straight line/.test(q)) {
      return answer(query, "piercing-ox", ["chimera-shadow-garden", "ten-shadows"], "Can Piercing Ox build charge inside Chimera Shadow Garden?",
        "In principle, yes, as long as it travels along a continuous straight path. The domain's widespread shadows could improve summoning angles and create new lanes, but they do not remove Piercing Ox's straight-line requirement.",
        [["Charge rule", "Its striking power increases with distance traveled in one straight line."], ["Domain advantage", "Megumi can manifest shikigami from many shadow positions and shape the environment for setups."], ["What resets it", "A sharp turn, dismissal, or new charge begins a new distance count."], ["Canon boundary", "The exact domain-assisted charge is not shown."]],
        "Domain-enhanced shikigami setup", "Rule-based inference");
    }
    if (/rabbit escape/.test(q) && /mahoraga/.test(q) && /inherit|adaptation|wheel/.test(q)) {
      return mangaAnswer(query, "rabbit-escape", ["mahoraga", "totality", "ten-shadows"], "Would Rabbit Escape inherit Mahoraga's adaptation?",
        "Canon does not confirm it, and automatic inheritance should not be assumed. Totality transfers only compatible traits through specific combinations, while Rabbit Escape's swarm nature does not establish compatibility with Mahoraga's wheel.",
        [["No direct example", "No rabbit is shown carrying the Eight-Handled Wheel or adapting to phenomena after Mahoraga's destruction."], ["Compatibility", "Destroyed shikigami do not freely donate every ability to any survivor."], ["Balance is not the reason", "The answer is uncertain because the inheritance rule is unstated, not because the ability would be too strong."], ["Best classification", "Interesting fan theory, not confirmed Ten Shadows behavior."]],
        "Totality theory check", "Canon boundary");
    }
    return false;
  }

  function soulAndExtinguishment(query, q) {
    if (/rct|reverse cursed technique/.test(q) && /split soul katana/.test(q) && /heal|repair|recover/.test(q)) {
      return mangaAnswer(query, "reverse-cursed-technique", ["split-soul-katana", "soul-damage"], "Can RCT heal damage from the Split Soul Katana?",
        "Only if the healer can perceive the outline of the soul well enough to restore it. Ordinary RCT can repair flesh but does not automatically reconstruct a soul that the katana directly cut.",
        [["Weapon effect", "The blade ignores ordinary toughness and cuts the soul when wielded by someone who can perceive it."], ["Healing requirement", "Soul-aware RCT users can align bodily repair with the damaged soul."], ["Canon users", "Late-story Sukuna and Yuji demonstrate the necessary soul awareness; it is not a default skill for every healer."], ["Severity", "A fatal or severing strike may still exceed the user's time or output to recover."]],
        "Soul injury and healing", "Direct manga mechanics");
    }
    if (/mahito/.test(q) && /yuji/.test(q) && /soul damage/.test(q) && /heal|recover|repair/.test(q)) {
      return answer(query, "mahito", ["yuji", "idle-transfiguration", "soul-damage"], "Can Mahito recover from Yuji's soul damage?",
        "Yes, to a point. Mahito can preserve and reshape his own soul to restore his body, but Yuji's strikes damage the soul directly, forcing real cursed-energy expenditure and eventually overwhelming him.",
        [["Why Yuji matters", "Sharing a body with Sukuna gives Yuji awareness of the soul's outline."], ["Mahito's recovery", "He uses Idle Transfiguration on himself to maintain the soul and rebuild the body around it."], ["Accumulation", "Direct soul damage is not meaningless; repeated hits reduce Mahito's reserves and stability."], ["Defeat condition", "Enough soul damage, exhaustion, or a decisive attack can prevent further reshaping."]],
        "Soul damage versus self-transfiguration", "Direct anime mechanics");
    }
    if (/resonance/.test(q) && /sukuna/.test(q) && /durability|bypass|ignore/.test(q)) {
      return mangaAnswer(query, "resonance", ["sukuna", "nobara", "soul-damage"], "Does Resonance bypass Sukuna's physical durability?",
        "It can bypass ordinary external toughness by transmitting damage through a linked body part or cursed object, but its effectiveness still depends on the quality of the connection, Nobara's output, and the target's resistance.",
        [["Remote link", "The nail and effigy attack the target through a separated piece rather than striking the main body directly."], ["Soul connection", "Against Sukuna's finger, Resonance reaches the connection to his incarnated soul and disrupts him."], ["Not infinite damage", "Bypassing the skin does not guarantee lethal output against any target."], ["Canon result", "The technique creates a meaningful opening against Sukuna rather than defeating him alone."]],
        "Remote soul-linked damage", "Direct manga evidence");
    }
    if (/jacob(?: s|s)? ladder|technique extinguishment/.test(q) && /ten shadows/.test(q) && /megumi/.test(q) && /permanent|erase|remove/.test(q)) {
      return mangaAnswer(query, "jacobs-ladder", ["ten-shadows", "megumi", "angel"], "Can Jacob's Ladder permanently erase Ten Shadows from Megumi?",
        "Canon does not establish permanent removal of Megumi's innate technique. Technique Extinguishment can suppress Ten Shadows while applied and attack Sukuna's incarnation, but temporary nullification is not the same as deleting the technique from Megumi's brain.",
        [["Primary purpose", "Angel targets the incarnated cursed object and the bond between Sukuna and Megumi."], ["During exposure", "Active cursed techniques and barriers can be extinguished."], ["After exposure", "A living sorcerer's innate technique is not generally shown being permanently extracted."], ["Megumi's condition", "Damage to his body, soul, and shikigami roster is a separate issue from technique erasure."]],
        "Specific extinguishment scope", "Direct manga rules");
    }
    if (/jacob(?: s|s)? ladder|technique extinguishment/.test(q) && /sukuna/.test(q) && /megumi/.test(q) && /separate|shrine|turn off/.test(q)) {
      return mangaAnswer(query, "jacobs-ladder", ["sukuna", "megumi", "shrine", "vessel-and-incarnation"], "Would Jacob's Ladder separate Sukuna from Megumi or only disable Shrine?",
        "Its important threat is broader than turning off Shrine: Technique Extinguishment suppresses cursed techniques and attacks the incarnation bond tying Sukuna's cursed object to Megumi's body. The intended outcome is to eradicate or separate the incarnated Sukuna while preserving Megumi if possible.",
        [["Technique suppression", "Shrine and other active cursed techniques are extinguished during exposure."], ["Incarnation target", "Angel's technique is especially effective against incarnated sorcerers because their continued embodiment depends on cursed-object technique."], ["Rescue difficulty", "Megumi's soul is deeply submerged and Sukuna actively resists, so successful exposure does not make separation instant or harmless."], ["Direct answer", "Both effects matter; it is not merely a temporary Shrine off-switch."]],
        "Incarnation and technique extinguishment", "Direct manga mechanics");
    }
    if (/technique extinguishment|jacob(?: s|s)? ladder/.test(q) && /domain/.test(q) && /already open|after.*open|cancel|collapse/.test(q)) {
      return mangaAnswer(query, "technique-extinguishment", ["domain-expansion", "barrier-techniques", "jacobs-ladder"], "Can Technique Extinguishment cancel an already-open domain?",
        "Potentially, if it reaches and extinguishes the embedded technique, barrier, or caster—but canon does not present it as a universal remote 'close domain' button under every condition.",
        [["What can be extinguished", "Cursed techniques, barriers, seals, and cursed-object effects are valid targets."], ["Delivery", "Jacob's Ladder or Angel's aura must actually reach the relevant structure or user while the domain is operating."], ["Resistance and timing", "A sure-hit may incapacitate the user first, and powerful barriers can complicate access."], ["Responsible verdict", "Strong domain counter in principle; exact cancellation timing depends on contact and the domain's rules."]],
        "Technique nullification versus domain", "Calibrated manga inference");
    }
    if (/hollow purple/.test(q) && /durability negation|dura neg/.test(q)) {
      return answer(query, "hollow-purple", ["limitless", "cursed-energy-output"], "Is Hollow Purple durability negation?",
        "Not in the strict sense. Hollow Purple is an extraordinarily destructive spatial attack produced by combining Blue and Red, but canon does not state that it automatically ignores all durability as a rule.",
        [["Why it looks like hax", "It tears through huge areas and can overwhelm extremely durable targets."], ["What durability negation means", "A true durability-negating effect bypasses toughness by attacking the soul, space, or a rule regardless of raw resistance."], ["Canon evidence", "Sukuna survives an enhanced Purple with severe damage, showing the result still depends on output, distance, defense, and condition."], ["Best label", "Very high attack potency with spatial mechanics, not guaranteed universal durability erasure."]],
        "Powerscaling classification", "Fandom term calibrated");
    }
    if (/world.*slash|world cutting/.test(q) && /durability|ignore.*durability|just infinity/.test(q)) {
      return mangaAnswer(query, "world-cutting-slash", ["limitless", "dismantle"], "Does the world-cutting slash ignore durability?",
        "It bypasses Infinity and many conventional defenses by cutting the targeted space itself, but 'ignores all durability' is too absolute. The slash still has a path, dimensions, output, and hit location, and targets can dodge or survive nonfatal contact.",
        [["Why Infinity fails", "The target is the space containing Gojo, so the slash does not need to travel through neutral Infinity."], ["Defense interaction", "Ordinary reinforcement cannot stop the space from being cut in the usual way."], ["Not omnipotent", "Kashimo reacts to a warning and avoids the lethal center, and later fighters use timing, positioning, and disruption to survive Sukuna's slashes."], ["Best wording", "A powerful spatial bypass, not a proof that every target is automatically one-shot."]],
        "Spatial slash classification", "Direct manga mechanics");
    }
    return false;
  }

  function shrineVoidBlood(query, q) {
    if (/normal cleave|\bcleave\b/.test(q) && /one.?shot|kill.*one|output.*high/.test(q)) {
      return answer(query, "cleave", ["sukuna", "cursed-energy-output"], "Can Cleave one-shot someone if Sukuna's output is high enough?",
        "Yes, potentially—if Cleave can reach the target and its adjusted output exceeds the target's reinforcement and durability. The technique is not an automatic one-shot against every opponent.",
        [["Adjustment", "Cleave calibrates cutting force to the target's cursed energy and toughness."], ["Contact and delivery", "Outside Malevolent Shrine it generally requires close contact; Infinity and other delivery problems still matter."], ["Output limits", "Sukuna's current condition and output cap how much force can be applied."], ["Survival variables", "Hit location, healing, soul state, and partial evasion can prevent an immediate kill."]],
        "Conditional damage rule", "Mechanic-based verdict");
    }
    if (/furnace|fuga|fire arrow/.test(q) && /simple domain/.test(q) && /stop|block|protect/.test(q)) {
      return answer(query, "furnace", ["simple-domain", "malevolent-shrine"], "Would Simple Domain stop Furnace?",
        "Not by itself. Simple Domain neutralizes a domain's sure-hit locally, while Furnace is a manually activated fire attack and explosion rather than Malevolent Shrine's Cleave/Dismantle sure-hit.",
        [["What Simple Domain does", "Interferes with the guaranteed-hit rule inside its defensive area."], ["What Furnace is", "A separate application of Shrine opened after cutting preparation and used as a finisher."], ["Indirect value", "Simple Domain may reduce simultaneous sure-hit pressure and let the user move or defend, but it does not erase the flames or explosion."], ["Needed defense", "Distance, durability, interruption, escape, or another technique must answer Furnace itself."]],
        "Anti-domain limit", "Technique-versus-defense reasoning");
    }
    if (/furnace|fuga|fire arrow/.test(q) && /part of shrine|separate cursed technique|different cursed technique/.test(q)) {
      return mangaAnswer(query, "furnace", ["shrine", "sukuna"], "Is Furnace part of Shrine?",
        "Furnace is presented as an application within Sukuna's Shrine technique, not a separately inherited cursed technique.",
        [["Shared technique", "Sukuna opens Furnace after using Cleave and Dismantle, following Shrine's cutting/cooking motif."], ["Separate application", "It behaves differently from the slashes and has its own activation conditions."], ["Domain use", "Malevolent Shrine prepares the environment and targets for the large-scale version, but Furnace is manually triggered."], ["Canon wording", "The exact full technical structure is intentionally mysterious, but there is no confirmed second innate technique called Furnace."]],
        "Technique-family classification", "Manga technique explanation");
    }
    if (/malevolent shrine/.test(q) && /furnace|fuga|fire arrow/.test(q) && /sure.?hit/.test(q)) {
      return mangaAnswer(query, "malevolent-shrine", ["furnace", "cleave", "dismantle"], "Is Furnace Malevolent Shrine's sure-hit?",
        "No. Malevolent Shrine's automatic sure-hit uses Cleave and Dismantle. Furnace is a manual finisher that benefits from the domain's prepared environment and binding conditions.",
        [["Automatic effect", "Shrine continuously assigns slashes throughout its range."], ["Furnace activation", "Sukuna opens and fires it separately after the cutting techniques have processed the area."], ["Domain enhancement", "Pulverized material and sealed conditions contribute to the thermobaric-like explosion."], ["Direct answer", "Domain-assisted does not mean embedded sure-hit."]],
        "Domain technique assignment", "Direct manga mechanics");
    }
    if (/unlimited void/.test(q) && /body|brain|physical damage|only the brain|neurolog/.test(q)) {
      return answer(query, "unlimited-void", ["gojo", "domain-expansion"], "What does Unlimited Void damage?",
        "Its primary effect is neurological and cognitive: overwhelming information paralyzes the target and can damage the brain. It is not a conventional physical blast, although the resulting brain injury and incapacitation affect the entire body.",
        [["Sure-hit", "Forces limitless information and incomplete actions into the target's mind."], ["Short exposure", "Causes paralysis and severe processing overload."], ["Longer exposure", "Produces serious neurological harm and can leave ordinary people needing lengthy rehabilitation."], ["Follow-up danger", "While the target cannot act, Gojo can physically attack or exorcise them."]],
        "Domain-effect anatomy", "Direct canon explanation");
    }
    if (/jogo/.test(q) && /ordinary humans|humans|civilians/.test(q) && /unlimited void/.test(q) && /0 2|0.2|survive|hospital/.test(q)) {
      return answer(query, "unlimited-void", ["jogo", "shibuya-incident"], "Why could Jogo endure Unlimited Void when civilians suffered from 0.2 seconds?",
        "Jogo is a special-grade cursed spirit with a cursed-energy body and far greater processing tolerance than an ordinary human, while Gojo also deliberately ended his earlier exposure and kept him alive for interrogation. The civilians survived 0.2 seconds, but the overload still caused serious neurological aftereffects.",
        [["Different physiology", "A special-grade curse can endure bodily and cognitive trauma that would incapacitate a normal person."], ["Duration and intent", "Gojo controlled the one-on-one domain and did not continue until Jogo was fully exorcised."], ["Civilian outcome", "The 0.2-second activation was chosen as the longest exposure Gojo believed ordinary people could survive; many required rehabilitation afterward."], ["Not immunity", "Jogo was completely incapacitated inside the domain and vulnerable to Gojo."]],
        "Cross-event comparison", "Direct anime canon");
    }
    if (/choso/.test(q) && /blood/.test(q) && /poison/.test(q)) {
      return answer(query, "choso", ["blood-manipulation", "death-painting-wombs"], "Why is Choso's blood poisonous?",
        "Choso's blood is poisonous to humans because he is a Death Painting hybrid with cursed-spirit physiology. It is not a universal property of every Blood Manipulation user.",
        [["Hybrid body", "His blood carries a curse-derived nature that ordinary human bodies react to as poison."], ["Canon example", "Uraume is poisoned after contact with Choso's blood."], ["Kamo difference", "A human Kamo clan user controls ordinary human blood and does not automatically gain the same poison."], ["Not simply 'a curse'", "Choso is an incarnated human–curse hybrid, which is the important classification."]],
        "Technique-user physiology", "Direct canon explanation");
    }
    if (/choso/.test(q) && /run out of blood|blood loss|infinite blood|convert.*cursed energy/.test(q)) {
      return answer(query, "choso", ["blood-manipulation", "cursed-energy-reserves"], "Can Choso run out of blood?",
        "He can replenish blood by converting cursed energy into it, so blood loss is far less restrictive than for a human user—but his cursed energy, output, and stamina are still finite.",
        [["Conversion", "Death Painting physiology lets him create blood from cursed energy."], ["Practical advantage", "He can use external blood techniques repeatedly without risking ordinary fatal blood loss."], ["Real limit", "Extended combat can deplete cursed energy or reduce his ability to maintain output and control."], ["Answer", "Not an infinite resource; it is a renewable resource paid for with cursed energy."]],
        "Resource-conversion explanation", "Direct canon mechanics");
    }
    if (/piercing blood/.test(q) && /infinity|limitless/.test(q) && /fast|speed|bypass|go through/.test(q)) {
      return answer(query, "piercing-blood", ["limitless", "blood-manipulation"], "Would Piercing Blood bypass Infinity because it is fast?",
        "No. Speed does not solve Infinity: the blood still has to cross the intervening space, where its approach is slowed without ever reaching Gojo.",
        [["Attack property", "Piercing Blood is extremely fast and focused after Convergence."], ["Infinity's rule", "It divides the remaining approach rather than relying on Gojo physically reacting to the projectile."], ["Needed bypass", "A domain sure-hit, Domain Amplification, technique nullification, or space-targeting effect must change the delivery mechanism."], ["Conclusion", "Faster projectile is still an ordinary approaching projectile."]],
        "Speed versus spatial defense", "Direct mechanic answer");
    }
    if (/projection sorcery/.test(q) && /infinity|limitless/.test(q) && /speed blitz|fast|bypass/.test(q)) {
      return answer(query, "projection-sorcery", ["limitless", "naobito-zenin", "naoya-zenin"], "Can Projection Sorcery speed-blitz Infinity?",
        "No. Projection Sorcery can make the user extremely fast, but Infinity is a spatial filter rather than a reaction-time block. The user still cannot reach Gojo through ordinary movement.",
        [["Speed advantage", "Twenty-four-frame movement creates rapid acceleration and route control."], ["Why it fails", "Infinity slows approaching objects regardless of whether Gojo consciously tracks every frame."], ["Possible support", "Speed could help exploit a moment when Infinity is neutralized by another technique."], ["No standalone bypass", "Projection Sorcery itself does not nullify or retarget space."]],
        "Movement speed versus Infinity", "Direct mechanic answer");
    }
    if (/maki/.test(q) && /projection sorcery/.test(q) && /frame rule|ignore|zero cursed energy|no cursed energy/.test(q)) {
      return mangaAnswer(query, "projection-sorcery", ["maki", "naoya-zenin"], "Can Maki ignore Projection Sorcery's frame rule because she has zero cursed energy?",
        "No. Projection Sorcery's touch rule can be imposed on Maki despite her zero cursed energy; Heavenly Restriction does not make her immune to every innate technique.",
        [["Activation", "The user touches the target with the palm and forces them to obey the twenty-four-frame movement rule."], ["Maki's advantage", "Her perception and physical speed eventually let her read Naoya's movement and avoid or counter him."], ["What zero CE changes", "Barrier recognition and cursed-energy sensing—not all direct-contact technique effects."], ["Failure condition", "If she violates the predetermined movement, she can still be frozen for one second."]],
        "Heavenly Restriction versus touch rule", "Direct manga mechanics");
    }
    return false;
  }

  function trialsJackpotCopy(query, q) {
    if (/higuruma|deadly sentencing|confiscation/.test(q) && /domain expansion/.test(q) && /separately|separate.*innate|confiscate.*domain/.test(q)) {
      return mangaAnswer(query, "deadly-sentencing", ["confiscation", "domain-expansion", "higuruma"], "Does Confiscation take Domain Expansion separately?",
        "No separate Domain Expansion ability is confiscated as an independent item. Confiscation removes the relevant cursed technique—or cursed-energy control when no technique is available—which also prevents the target from constructing a domain around that technique.",
        [["Deadly Sentencing", "Higuruma's domain combines barrier technique, his innate domain, and the Judgeman/Confiscation rules."], ["Domain composition", "A Domain Expansion combines barrier technique, innate domain, and an embedded cursed technique."], ["Confiscation target", "Judgeman prioritizes a cursed tool's technique, then the defendant's innate technique under the shown rules."], ["Practical result", "Without the innate technique, the target cannot deploy its normal technique-imbued domain."], ["Barrier skill", "The ruling does not necessarily erase all general barrier knowledge as a separate skill."]],
        "Confiscation hierarchy", "Direct manga rules");
    }
    if (/sukuna/.test(q) && /hiten/.test(q) && /confiscation/.test(q) && /before|priority|take/.test(q)) {
      return mangaAnswer(query, "confiscation", ["sukuna", "hiten", "shrine", "deadly-sentencing"], "Would Confiscation take Hiten before Shrine?",
        "Probably, if Hiten is recognized as a cursed tool carrying its own technique. The Kamutoke ruling shows that Confiscation prioritizes a cursed tool's technique before the wielder's innate technique, but Hiten's exact ability is not revealed.",
        [["Direct precedent", "Judgeman confiscates Kamutoke rather than Shrine."], ["Hiten uncertainty", "Canon confirms Hiten as Sukuna's cursed tool but does not explain its full function."], ["Conditional verdict", "If Hiten has a confiscatable technique and Sukuna is carrying it, the same priority rule should apply."], ["Not guaranteed", "An inert or differently classified tool could produce a different judgment."]],
        "Cursed-tool confiscation", "Rule-based manga inference");
    }
    if (/hakari/.test(q) && /jackpot/.test(q) && /forever|repeatedly|keep.*opening|chain/.test(q)) {
      return mangaAnswer(query, "kinji-hakari", ["idle-death-gamble", "reverse-cursed-technique"], "Can Hakari keep jackpot active forever by reopening his domain?",
        "He can chain jackpots by reopening Idle Death Gamble after each four-minute-eleven-second reward, but he cannot guarantee an endless sequence forever.",
        [["Cycle", "Jackpot restores his cursed energy and lets him deploy the domain again after the reward ends."], ["Probability", "The domain strongly favors repeated attempts and includes rerolls, but each new jackpot still requires completing the game."], ["Interruption", "Hakari can be killed, prevented from opening the domain, or defeated during the vulnerable transition."], ["Bottom line", "Potentially long chains, not permanent unconditional immortality."]],
        "Repeated jackpot cycle", "Direct manga mechanics");
    }
    if (/jackpot/.test(q) && /hakari/.test(q) && /infinite cursed energy|reserves|output/.test(q)) {
      return mangaAnswer(query, "idle-death-gamble", ["kinji-hakari", "cursed-energy-output", "cursed-energy-reserves"], "What becomes infinite during Hakari's jackpot?",
        "Jackpot supplies effectively unlimited cursed energy for four minutes and eleven seconds, causing his body to overflow and perform automatic RCT. It does not mean every individual attack has infinite output.",
        [["Cursed Energy Reserves", "The jackpot provides an effectively unlimited supply during the reward window, so Hakari does not run out of cursed energy."], ["Output", "The amount he can release at one moment remains bounded by his body, control, and technique."], ["Automatic healing", "Overflowing energy reflexively converts into positive energy and repairs damage."], ["Duration", "The effect ends after the music period unless he wins another jackpot."]],
        "Reserve-versus-output distinction", "Direct manga mechanics");
    }
    if (/yuta/.test(q) && /copy/.test(q) && /boogie woogie/.test(q)) {
      return mangaAnswer(query, "copy-technique", ["yuta", "boogie-woogie", "todo"], "Could Yuta copy Boogie Woogie and use it without clapping?",
        "Copying the technique is unconfirmed, and there is no evidence that Copy automatically removes Boogie Woogie's activation condition. A copied version would most responsibly be assumed to need a valid trigger unless Yuta created a separate binding-vow modification.",
        [["Technique formula", "Copy grants access to an innate technique, not automatic mastery or rewritten conditions."], ["Todo's trigger", "Boogie Woogie requires a clap-like activation; Todo later changes the instrument through a binding vow rather than simply deleting the requirement."], ["Yuta's adaptability", "He may be able to reproduce or modify a trigger with training, but canon does not show it."], ["Verdict", "Possible theory, not confirmed conditionless swapping."]],
        "Copied-technique activation", "Calibrated manga inference");
    }
    if (/yuta/.test(q) && /copy/.test(q) && /idle transfiguration/.test(q)) {
      return mangaAnswer(query, "copy-technique", ["yuta", "idle-transfiguration", "soul-damage"], "Could Yuta copy and use Idle Transfiguration?",
        "Acquiring it is unconfirmed, and effective use would require precise perception and control of the soul. Copying a technique formula does not automatically grant Mahito's instinctive soul mastery.",
        [["Acquisition", "Canon never shows Rika obtaining Idle Transfiguration."], ["Knowledge requirement", "The technique reshapes souls directly; careless use could fail, produce unintended results, or expose the user."], ["Yuta's talent", "Yuta is exceptionally skilled and may learn quickly, but possibility is not confirmation."], ["Domain question", "He would still need to integrate the copied technique into his own domain system rather than inheriting Mahito's domain wholesale."]],
        "Copy versus mastery", "Calibrated manga inference");
    }
    if (/yuta/.test(q) && /copy/.test(q) && /mahoraga/.test(q) && /adapt/.test(q)) {
      return mangaAnswer(query, "copy-technique", ["yuta", "mahoraga", "ten-shadows"], "Can Yuta copy Mahoraga's adaptation?",
        "Not as a standalone technique under the rules shown. Adaptation is Mahoraga's shikigami ability within Ten Shadows, not an independently identified innate cursed technique that Yuta can simply store.",
        [["What Copy stores", "Cursed techniques acquired through Rika under Copy's conditions."], ["What adaptation belongs to", "The Eight-Handled Wheel and Mahoraga's specific shikigami system."], ["Possible route", "Copying Ten Shadows itself is already unconfirmed and would raise taming and roster-state questions."], ["Verdict", "No canon support for Yuta directly copying the adaptation trait."]],
        "Copy target classification", "Canon boundary");
    }
    if (/copy/.test(q) && /store.*domain|copy.*domain expansion|domain expansion.*copy/.test(q)) {
      return mangaAnswer(query, "copy-technique", ["domain-expansion", "authentic-mutual-love", "yuta"], "Can Copy store another person's Domain Expansion?",
        "No complete domain is shown being stored as a separate ability. Yuta copies cursed techniques, then uses his own barrier and innate domain to assign copied techniques to katanas or the sure-hit of Authentic Mutual Love.",
        [["Domain components", "A domain includes the caster's innate domain, barrier skill, and embedded technique."], ["What Yuta copies", "The technique formula, not the other person's personal mental landscape and barrier refinement."], ["Yuta's domain", "Copied techniques are deployed through his own Domain Expansion."], ["Answer", "Copy can supply the embedded technique; it does not import the opponent's whole domain."]],
        "Copy and domain construction", "Direct manga mechanics");
    }
    return false;
  }

  function speechAndGojo(query, q) {
    if (/cursed speech|inumaki/.test(q) && /mahoraga/.test(q) && /stop adapting|stop.*adapt|command/.test(q)) {
      return mangaAnswer(query, "cursed-speech", ["mahoraga", "toge-inumaki"], "Could Cursed Speech command Mahoraga to stop adapting?",
        "It could potentially impose a brief command if the power gap and cursed-energy reinforcement allowed it, but it would not permanently remove Mahoraga's adaptation ability. The recoil against such a powerful target would be extreme.",
        [["Command effect", "Cursed Speech forces an action through sound when the target cannot fully resist."], ["Power gap", "Stronger targets produce much greater backlash and can reduce the command's duration or effectiveness."], ["Adaptation", "A temporary stop does not erase the wheel; repeated exposure could even give Mahoraga an opportunity to adapt to the technique."], ["Practical verdict", "Possible momentary interruption, not a reliable permanent counter."]],
        "Command versus adaptive shikigami", "Rule-based manga inference");
    }
    if (/inumaki|cursed speech/.test(q) && /sukuna/.test(q) && /say die|command.*die|tell.*die/.test(q)) {
      return mangaAnswer(query, "cursed-speech", ["toge-inumaki", "sukuna"], "Could Inumaki say “die” to Sukuna and win?",
        "No. A lethal command against Sukuna's vastly greater power would produce catastrophic recoil and is unlikely to force a full kill. At best, a carefully chosen weaker command could create a brief opening.",
        [["Recoil rule", "The stronger the target and command, the more the user's throat and body are damaged."], ["Resistance", "Sukuna can reinforce himself, understand the technique, and withstand commands far beyond ordinary targets."], ["Tactical use", "Commands such as stop or do not move are more plausible as short support plays."], ["No one-word win", "Cursed Speech is not absolute mind control independent of power difference."]],
        "Power-scaled command", "Direct technique rule");
    }
    if (/domain sure.?hit/.test(q) && /gojo/.test(q) && /infinity/.test(q) && /turn.*off|manually.*off|disabled/.test(q)) {
      return answer(query, "domain-expansion", ["gojo", "infinity", "sure-hit-effect"], "Would a domain sure-hit hit Gojo if Infinity were turned off?",
        "Yes—and turning Infinity off would not meaningfully change that part of the interaction. A valid domain sure-hit already reaches Gojo by the domain's rule rather than by traveling through neutral Infinity.",
        [["With Infinity active", "The sure-hit can still be imposed once the domain is established and not neutralized."], ["With Infinity inactive", "Gojo also loses protection from ordinary manual attacks and projectiles inside the domain."], ["Actual defenses", "His own domain, Simple Domain, Falling Blossom Emotion, reinforcement, healing, or damaging the caster are the relevant answers."], ["Direct answer", "Infinity's on/off state is not what decides whether the guaranteed hit connects."]],
        "Sure-hit versus voluntary defense state", "Direct domain rule");
    }
    if (/gojo/.test(q) && /turn off|disable|lower/.test(q) && /infinity/.test(q) && /ally|touch|someone/.test(q)) {
      return answer(query, "infinity", ["gojo", "limitless"], "Can Gojo turn Infinity off?",
        "Yes. Infinity is an actively controlled application of Limitless, and Gojo can disable or selectively manage it so allies and ordinary objects can touch him.",
        [["Automatic filtering", "Adult Gojo automates the technique's threat assessment, but automation is still under his control."], ["Normal life", "He must permit contact with allies, clothing, air, and other harmless inputs."], ["Combat choice", "Turning it off removes the defense until it is restored."], ["Not always visible", "A successful touch does not necessarily mean Infinity was forcibly bypassed; Gojo may have allowed it."]],
        "Voluntary technique control", "Direct canon mechanic");
    }
    if (/gojo/.test(q) && /teleport/.test(q) && /burnt out|burnout|technique burnout/.test(q)) {
      return mangaAnswer(query, "gojo", ["technique-burnout", "cursed-technique-lapse-blue", "limitless"], "Can Gojo teleport while Limitless is burnt out?",
        "Not until he restores access to the technique. Gojo's teleportation is a Limitless/Blue-based spatial application, so cursed-technique burnout removes the mechanism needed to perform it.",
        [["Burnout", "After a domain ends, the innate technique becomes temporarily unstable and difficult to activate."], ["Teleport basis", "Gojo compresses or manipulates space through Limitless rather than possessing an unrelated teleport technique."], ["Workaround", "He can shorten burnout by destroying and healing the technique-bearing part of his brain, but that carries severe risk."], ["Physical movement", "He can still move and fight normally while the technique is unavailable."]],
        "Burnout and derived application", "Direct manga mechanics");
    }
    if (/gojo/.test(q) && /burnout/.test(q) && /unlimited void/.test(q) && /forever|immediately reopen|keep.*opening|spam/.test(q)) {
      return mangaAnswer(query, "gojo", ["technique-burnout", "unlimited-void", "reverse-cursed-technique"], "Can Gojo heal burnout and reopen Unlimited Void forever?",
        "No. He can force a rapid reset by damaging and reconstructing the relevant brain tissue, but repeated resets accumulate neurological damage and eventually prevent further safe domain use.",
        [["Why it works", "RCT rebuilds the part of the brain where the burnt-out technique is engraved."], ["Why it is dangerous", "The method deliberately injures the brain and demands extreme precision."], ["Canon limit", "Repeated domains and resets cause Gojo's brain to reach a point where he can no longer open Unlimited Void normally."], ["Answer", "Fast recovery is possible a limited number of times, not infinite domain spam."]],
        "Burnout-reset limit", "Direct manga mechanics");
    }
    return false;
  }

  function multipart(query, q) {
    if (/malevolent shrine/.test(q) && /unlimited void/.test(q) && /instant(?:ly)? kill gojo|then.*kill gojo/.test(q)) {
      return mangaAnswer(query, "malevolent-shrine", ["unlimited-void", "gojo", "reverse-cursed-technique", "simple-domain"], "Would Shrine break Unlimited Void and then instantly kill Gojo?",
        "Malevolent Shrine can break Unlimited Void's normal outer barrier, but no—it does not instantly kill Gojo afterward. Gojo canonically survives the sure-hit barrage long enough to heal, deploy anti-domain defenses, fight Sukuna, and reopen his domain.",
        [["Part 1 — barrier", "Shrine's open range attacks Unlimited Void's vulnerable exterior while the internal sure-hits cancel."], ["Part 2 — survival", "After the barrier breaks, Gojo uses maximum-output RCT and elite reinforcement to endure Cleave and Dismantle."], ["Additional defenses", "He uses Simple Domain and Falling Blossom Emotion to reduce or interrupt the sure-hit."], ["Actual danger", "The exposure is extremely damaging and cannot be endured forever, but 'barrier broke' is not equivalent to 'Gojo instantly died.'"]],
        "Two-stage domain outcome", "Direct manga mechanics");
    }
    if (/disaster curses/.test(q) && /malevolent shrine/.test(q) && /kill all|all of them|wipe/.test(q)) {
      return answer(query, "malevolent-shrine", ["jogo", "hanami", "dagon", "mahito"], "Who are the Disaster Curses, and could Malevolent Shrine kill them all?",
        "The Disaster Curses are Jogo, Hanami, Dagon, and Mahito. A full-output Malevolent Shrine from a sufficiently restored Sukuna would be overwhelmingly likely to exorcise all four if they were trapped in range without an escape or domain answer.",
        [["The group", "Jogo, Hanami, and Dagon embody natural fears; Mahito embodies humans' fear of one another."], ["Scale", "Shrine applies continuous adaptive slashes throughout a huge area and 15-finger Sukuna already defeats Jogo decisively without relying on the full domain barrage."], ["Mahito nuance", "Mahito can reshape his body around the soul, but repeated destruction and cursed-energy exhaustion can still exorcise him; he is not infinitely immune to non-soul attacks."], ["Condition", "This assumes they remain inside a serious Shrine and cannot escape, win a domain clash, or interrupt Sukuna first."], ["Confidence", "The exact four-versus-domain scene is unshown, so this is a strong canon-based inference rather than a quoted event."]],
        "Group definition + matchup", "Multi-part answer");
    }
    return false;
  }

  performSearch = async function performSearchContextualReasoningV7(rawQuery) {
    const query = String(rawQuery || "").trim();
    if (!query) return previousPerformSearch(rawQuery);
    const q = qnorm(query);
    if (multipart(query, q)) return;
    if (fandomAndGroups(query, q)) return;
    if (basicInteractions(query, q)) return;
    if (fanDefinitions(query, q)) return;
    if (formsAndScaling(query, q)) return;
    if (domainLogic(query, q)) return;
    if (amplificationAndSwaps(query, q)) return;
    if (adaptationAndTotality(query, q)) return;
    if (soulAndExtinguishment(query, q)) return;
    if (shrineVoidBlood(query, q)) return;
    if (trialsJackpotCopy(query, q)) return;
    if (speechAndGojo(query, q)) return;
    await previousPerformSearch(rawQuery);
  };

  window.auditContextualReasoningV7 = function auditContextualReasoningV7(query, answerText) {
    const q = qnorm(query), a = qnorm(answerText);
    const flags = [];
    if (/disaster family|disaster curses/.test(q) && /(who|what|counted|all)/.test(q) && !/choso.*eso.*kechizu/.test(q) && !/jogo/.test(a)) flags.push("disaster-group-unresolved");
    if (/malevolent shrine/.test(q) && /unlimited void/.test(q) && /(break|sure.?hit|barrier|kill gojo)/.test(q) && !/outside|exterior|sure hit|sure-hit/.test(a)) flags.push("domain-geometry-unresolved");
    if (/domain amplification/.test(q) && /(jogo|sukuna|purple|black rope)/.test(q) && /archive does not contain a direct scene/.test(a)) flags.push("amplification-interaction-generic");
    if (/mahoraga/.test(q) && /(red|soul manipulation|round deer|rabbit escape|wheel)/.test(q) && /how it works why it matters|archive does not contain/.test(a)) flags.push("adaptation-question-generic");
    if (/jacob/.test(q) && /(megumi|ten shadows|domain)/.test(q) && !/extinguish|incarnation|temporary|permanent/.test(a)) flags.push("extinguishment-scope-missed");
    if (/furnace/.test(q) && /(simple domain|sure.?hit|separate cursed technique)/.test(q) && /archive does not contain|how it works/.test(a)) flags.push("furnace-rule-generic");
    if (/yuta/.test(q) && /copy/.test(q) && /(boogie woogie|idle transfiguration|mahoraga|domain)/.test(q) && /archive does not contain/.test(a)) flags.push("copy-question-generic");
    if (/and| or /.test(q) && /how it works why it matters/.test(a)) flags.push("multipart-collapsed-to-dossier");
    return [...new Set(flags)];
  };

  document.documentElement.dataset.contextualReasoning = VERSION;
  console.info(`[JJK Archive] Contextual Reasoning Engine v${VERSION} active`);
})();
