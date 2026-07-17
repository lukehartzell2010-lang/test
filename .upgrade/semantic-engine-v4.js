/* JJK Archive Semantic Question Engine v4
   Clause-aware, pronoun-aware, token-weighted question understanding. */
(() => {
  "use strict";

  const VERSION = "4.0.0";
  const previousPerformSearch = performSearch;

  const QUESTION_WORDS = new Set(["who","what","where","when","why","how","which"]);
  const AUXILIARIES = new Set(["can","could","does","do","did","is","are","was","were","has","have","will","would","should"]);
  const CONNECTORS = new Set(["and","but","also","plus","then","while","although"]);
  const PERSON_PRONOUNS = new Set(["he","him","his","she","her","hers","they","them","their","theirs"]);
  const THING_PRONOUNS = new Set(["it","its","this","that","these","those"]);
  const GRAMMAR_WORDS = new Set([
    "a","an","the","to","of","for","from","in","on","at","by","with","about","as","than",
    "be","been","being","am","i","me","my","you","your","we","our","please","tell","explain",
    "jjk","jujutsu","kaisen","question","answer"
  ]);

  const SEMANTIC_GROUPS = {
    strength: ["strong","stronger","strongest","strength","powerful","power","overpowered","op","might"],
    speed: ["fast","faster","fastest","speed","quick","agile","reflex","reaction"],
    durability: ["durable","durability","tough","toughness","endurance","stamina","survive","survival"],
    intelligence: ["smart","intelligent","intelligence","tactical","strategy","strategic","battle iq","clever"],
    reputation: ["considered","called","known","regarded","recognized","title","reputation"],
    mechanism: ["work","works","working","mechanism","function","operate","happen","activate","activation"],
    cause: ["why","because","reason","cause","causes","makes","made","allow","allows","due"],
    identity: ["who","identity","person","character","role"],
    technique: ["technique","ability","abilities","power","powers","arsenal","moves","skill","skills"],
    domain: ["domain","sure hit","barrier"],
    location: ["where","location","place","school","colony","city"],
    timeline: ["when","episode","chapter","arc","time","timeline"],
    relationship: ["father","mother","parent","brother","sister","son","daughter","friend","teacher","student","relationship"],
    importance: ["important","importance","significant","significance","matter","matters","impact"],
    comparison: ["versus","vs","compare","comparison","beat","wins","win"]
  };

  const FACTOR_GROUPS = [
    { id: "physical", label: "Physical foundation", terms: ["physical","athletic","body","close range","close-range","strength","speed","senses","reflex","durable","endurance","stamina"] },
    { id: "energy", label: "Cursed-energy foundation", terms: ["cursed energy","reinforcement","reserves","output","efficiency","control","manipulation"] },
    { id: "technique", label: "Technique and arsenal", terms: ["technique","ability","limitless","shrine","shikigami","blue","red","purple","cleave","dismantle","divergent fist","black flash"] },
    { id: "defense", label: "Defense and recovery", terms: ["reverse cursed technique","healing","heal","regeneration","infinity","defense","prevent","survive"] },
    { id: "domain", label: "Domain-level threat", terms: ["domain expansion","domain","sure hit","sure-hit","barrier"] },
    { id: "skill", label: "Combat skill and adaptation", terms: ["analysis","tactical","strategy","adapts","adapt","instinct","experience","precision","pressure","combat style"] },
    { id: "special", label: "Unique traits", terms: ["six eyes","vessel","soul","heavenly restriction","black flash","special grade","restriction","suppress"] }
  ];

  const CURATED_STRENGTH_FACTS = {
    yuji: [
      ["Physical foundation", "Yuji possesses exceptional athletic and close-range ability even before relying on a conventional innate technique."],
      ["Cursed-energy reinforcement", "He layers cursed energy onto that already powerful body, turning ordinary strikes into sorcerer-level attacks."],
      ["Black Flash aptitude", "His extraordinary instinct for Black Flash repeatedly sharpens his cursed-energy understanding and raises his combat performance."],
      ["Rapid adaptation", "The archive records that his close-range combat adapts quickly under pressure, allowing him to improve during difficult fights."],
      ["Unusual vessel traits", "His ability to contain and normally suppress Sukuna makes his body and soul situation highly unusual, though that is not the same thing as Sukuna simply lending him power." ]
    ],
    gojo: [
      ["Limitless plus the Six Eyes", "Gojo combines an elite inherited spatial technique with the perception and efficiency needed to use it at an exceptional level."],
      ["Near-perfect efficiency", "The Six Eyes reduce waste and support extremely precise cursed-energy control, letting him sustain techniques that would exhaust most sorcerers."],
      ["Layered offense and defense", "Infinity protects him, Blue attracts, Red repels, and Hollow Purple combines opposing applications into a devastating attack."],
      ["Recovery and analysis", "Reverse Cursed Technique, high-speed perception, and rapid analysis make him extremely difficult to wear down or surprise."],
      ["Unlimited Void", "His Domain Expansion overwhelms targets with boundless information, giving him a top-tier fight-ending option." ]
    ],
    sukuna: [
      ["Cursed-energy scale", "Sukuna combines immense cursed-energy reserves, output, control, and efficiency at the highest level of the setting."],
      ["Shrine", "Cleave and Dismantle give him adaptable cutting attacks, while his broader arsenal makes his offense difficult to fully prepare for."],
      ["Malevolent Shrine", "His open-barrier Domain Expansion pressures an enormous area without enclosing it in a normal shell."],
      ["Combat intelligence", "He reads techniques, experiments during battle, and exploits binding vows and jujutsu rules with exceptional speed."],
      ["Experience and mentality", "His knowledge, confidence, and willingness to choose ruthless solutions let him turn small openings into decisive advantages." ]
    ],
    yuta: [
      ["Enormous cursed energy", "Yuta's immense reserves allow prolonged reinforcement, repeated high-output attacks, and heavy use of Reverse Cursed Technique."],
      ["Rika", "Rika expands his storage, support, and combat options, making his effective arsenal far broader than his body alone suggests."],
      ["Copy", "Copied techniques let him change answers during a fight instead of depending on one fixed ability."],
      ["Reverse Cursed Technique", "He can heal severe damage and is among the rare users capable of outputting positive energy to others."],
      ["Special-grade versatility", "His strength comes from the combination of reserves, technique variety, swordsmanship, domain ability, and adaptation." ]
    ],
    maki: [
      ["Completed Heavenly Restriction", "Maki's cursed energy is removed in exchange for a physically perfected body and extraordinary senses."],
      ["Physical speed and power", "Her body can pressure high-level opponents without conventional cursed-energy reinforcement."],
      ["Enhanced perception", "Her senses let her read the environment and perceive threats in ways ordinary sorcerers cannot."],
      ["Cursed-tool mastery", "She converts physical ability into lethal force through elite weapon skill."],
      ["Freedom from normal detection", "Having no cursed energy changes how barriers, tracking, and some jujutsu assumptions interact with her." ]
    ],
    toji: [
      ["Heavenly Restriction", "Toji has zero cursed energy in exchange for a physically perfected body and extraordinary senses."],
      ["Stealth against sorcerers", "The absence of cursed energy makes him difficult to detect through normal jujutsu perception."],
      ["Speed and precision", "His physical performance lets him close distance and exploit tiny openings before technique users can stabilize."],
      ["Cursed-tool planning", "He pairs specialized tools with preparation rather than trying to overpower every technique directly."],
      ["Combat experience", "His threat comes from the stack of physical ability, information, timing, and ruthless tactical choices." ]
    ]
  };

  function qnorm(text) {
    return normalize(String(text || "").replace(/[’‘]/g, "'"))
      .replace(/\bcan t\b/g, "cannot")
      .replace(/\bdoesn t\b/g, "does not")
      .replace(/\bdidn t\b/g, "did not")
      .replace(/\bisn t\b/g, "is not")
      .replace(/\baren t\b/g, "are not")
      .replace(/\b([a-z0-9-]+) s\b/g, "$1");
  }

  function unique(list, key = item => item) {
    const seen = new Set();
    return list.filter(item => {
      const value = key(item);
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function visible(entry) {
    return !!entry && (state.spoiler === "manga" || entry.spoiler === "anime");
  }

  function linked(entry, categories = null) {
    if (!entry) return [];
    const direct = (entry.related || []).map(getEntry).filter(Boolean);
    const reverse = entries.filter(candidate => (candidate.related || []).includes(entry.id));
    let result = unique([...direct, ...reverse], item => item.id).filter(visible);
    if (categories?.length) result = result.filter(item => categories.includes(item.category));
    return result;
  }

  function tokenizeQuestion(raw) {
    const normalized = qnorm(raw);
    return normalized.split(" ").filter(Boolean).map((word, index) => {
      let role = "content";
      if (QUESTION_WORDS.has(word)) role = "question";
      else if (AUXILIARIES.has(word)) role = "auxiliary";
      else if (CONNECTORS.has(word)) role = "connector";
      else if (PERSON_PRONOUNS.has(word)) role = "person-pronoun";
      else if (THING_PRONOUNS.has(word)) role = "thing-pronoun";
      else if (["not","never","without","cannot"].includes(word)) role = "negation";
      else if (["so","very","extremely","really","most","more","less","exactly","specifically","overall","generally"].includes(word)) role = "modifier";
      else if (GRAMMAR_WORDS.has(word)) role = "grammar";
      return { word, index, role };
    });
  }

  function semanticTags(tokens) {
    const tokenText = tokens.map(token => token.word).join(" ");
    const tags = [];
    for (const [tag, terms] of Object.entries(SEMANTIC_GROUPS)) {
      if (terms.some(term => tokenText.includes(term))) tags.push(tag);
    }
    return tags;
  }

  function splitClauses(raw) {
    let text = String(raw || "").trim();
    text = text.replace(/[;]+/g, " | ");
    text = text.replace(/\?\s*(?=\S)/g, " | ");
    text = text.replace(/,\s*(?=(?:who|what|where|when|why|how|which|can|could|does|do|did|is|are|was|were|has|have|will|would)\b)/gi, " | ");
    text = text.replace(/\b(?:and|but|also|plus|then)\s+(?=(?:who|what|where|when|why|how|which|can|could|does|do|did|is|are|was|were|has|have|will|would)\b)/gi, " | ");
    return text.split("|").map(part => part.replace(/^[,\s]+|[,?\s]+$/g, "").trim()).filter(Boolean);
  }

  function allEntryMentions(text, pool = allowedEntries()) {
    const q = qnorm(text);
    const matches = [];
    for (const entry of pool) {
      const names = entryNames(entry).sort((a, b) => b.length - a.length);
      const name = names.find(candidate => q.includes(candidate));
      if (name) matches.push({ entry, name, length: name.length });
    }
    matches.sort((a, b) => b.length - a.length);
    const result = [];
    for (const match of matches) {
      if (!result.some(item => item.entry.id === match.entry.id)) result.push(match);
    }
    return result;
  }

  function detectIntent(clause) {
    const q = qnorm(clause);
    if (/\b(vs|versus|compare|stronger|who wins|would .* beat|can .* beat)\b/.test(q)) return "comparison";
    if (/^(?:list|name|show)\b|\b(all|every|which characters|which techniques|which domains)\b/.test(q)) return "list";
    if (/^who\b/.test(q)) return /\buses|has|owns|wields\b/.test(q) ? "owner" : "identity";
    if (/^where\b/.test(q)) return "location";
    if (/^when\b|\bwhat (?:episode|chapter|arc|time)\b/.test(q)) return "timeline";
    if (/^why\b/.test(q)) return "reasoning";
    if (/^how\b/.test(q)) return "mechanics";
    if (/^(?:can|could|does|do|did|is|are|was|were|has|have)\b/.test(q)) return "yesno";
    if (/^what\b/.test(q)) return "definition";
    return "explanation";
  }

  function detectDimensions(clause, tags) {
    const q = qnorm(clause);
    const dimensions = [];
    ["strength","speed","durability","intelligence","importance"].forEach(tag => { if (tags.includes(tag)) dimensions.push(tag); });
    if (tags.includes("domain")) dimensions.push("domain");
    if (tags.includes("technique")) dimensions.push("technique");
    if (tags.includes("relationship")) dimensions.push("relationship");
    if (/\bgrade|rank|classification\b/.test(q)) dimensions.push("grade");
    if (/\bage|old\b/.test(q)) dimensions.push("age");
    if (/\bheight|tall\b/.test(q)) dimensions.push("height");
    return unique(dimensions);
  }

  function detectDimension(clause, tags) {
    return detectDimensions(clause, tags)[0] || null;
  }

  function propertyFromClause(clause) {
    const q = qnorm(clause);
    if (/\bdomain(?: expansion)?\b|\bsure hit\b/.test(q)) return "domain";
    if (/\bcursed technique\b|\binnate technique\b|\btechnique\b|\bability\b|\bpowers?\b/.test(q)) return "technique";
    if (/\bweapon\b|\bcursed tool\b|\btool\b|\bsword\b/.test(q)) return "tool";
    if (/\bclan\b|\bfamily\b/.test(q)) return "clan";
    if (/\bgrade\b|\brank\b/.test(q)) return "grade";
    if (/\bfather\b|\bmother\b|\bbrother\b|\bsister\b|\bparent\b|\brelationship\b/.test(q)) return "relationship";
    return null;
  }

  function resolveProperty(subject, property) {
    if (!subject || !property) return null;
    const categoryMap = { domain: ["domain"], technique: ["technique"], tool: ["tool"], clan: ["clan"] };
    const candidates = linked(subject, categoryMap[property] || []);
    if (!candidates.length) return null;
    const subjectText = qnorm([subject.summary, subject.details, ...(subject.points || [])].join(" "));
    return [...candidates].sort((a, b) => {
      const aNamed = subjectText.includes(qnorm(a.title)) ? 1 : 0;
      const bNamed = subjectText.includes(qnorm(b.title)) ? 1 : 0;
      return bNamed - aNamed;
    })[0];
  }

  function parseQuestionV4(raw) {
    const tokens = tokenizeQuestion(raw);
    const globalMentions = allEntryMentions(raw);
    const rawClauses = splitClauses(raw);
    const clauses = [];
    let subject = globalMentions.find(match => ["character","curse"].includes(match.entry.category))?.entry || globalMentions[0]?.entry || null;
    let focus = subject;

    rawClauses.forEach((text, index) => {
      const clauseTokens = tokenizeQuestion(text);
      const mentions = allEntryMentions(text);
      const hasPersonPronoun = clauseTokens.some(token => token.role === "person-pronoun");
      const hasThingPronoun = clauseTokens.some(token => token.role === "thing-pronoun");
      const priorFocus = focus;
      let target = mentions[0]?.entry || null;
      if (!target && hasThingPronoun && focus) target = focus;
      if (!target && hasPersonPronoun && subject) target = subject;
      if (!target) target = subject || focus;
      if (target && ["character","curse"].includes(target.category)) subject = target;

      const tags = semanticTags(clauseTokens);
      const intent = detectIntent(text);
      const dimensions = detectDimensions(text, tags);
      const dimension = dimensions[0] || null;
      const property = propertyFromClause(text);
      let resolvedFocus = target;
      if (["definition","explanation","yesno"].includes(intent) && property && target && ["character","curse"].includes(target.category)) {
        resolvedFocus = resolveProperty(target, property) || target;
      }
      if (intent === "mechanics" && hasThingPronoun && focus) resolvedFocus = focus;
      if (resolvedFocus) focus = resolvedFocus;

      const referent = hasThingPronoun && priorFocus && priorFocus.id !== resolvedFocus?.id ? priorFocus : null;
      clauses.push({ index, text, tokens: clauseTokens, tags, intent, dimension, dimensions, property, target, focus: resolvedFocus, referent, mentions: mentions.map(item => item.entry) });
    });

    return {
      raw: String(raw || "").trim(),
      normalized: qnorm(raw),
      tokens,
      tags: semanticTags(tokens),
      clauses,
      entities: globalMentions.map(item => item.entry),
      primary: subject || globalMentions[0]?.entry || null,
      multiPart: clauses.length > 1
    };
  }

  function sentenceFragments(entry) {
    if (!entry) return [];
    const source = [entry.summary, entry.details, ...(entry.points || [])].filter(Boolean);
    const fragments = [];
    source.forEach((text, sourceIndex) => {
      String(text).split(/(?<=[.!?])\s+/).forEach(sentence => {
        const clean = sentence.trim();
        if (clean) fragments.push({ entry, text: clean, sourceIndex, kind: sourceIndex === 0 ? "summary" : sourceIndex === 1 ? "details" : "point" });
        if (clean.includes(",")) {
          clean.split(/,\s+(?=[a-zA-Z])/).forEach(part => {
            const trimmed = part.trim();
            if (trimmed.length > 28) fragments.push({ entry, text: trimmed.replace(/^[Aa]nd\s+/, ""), sourceIndex, kind: "fragment" });
          });
        }
      });
    });
    return fragments;
  }

  function buildCorpus(subject) {
    if (!subject) return [];
    const first = linked(subject);
    const second = unique(first.flatMap(item => linked(item)), item => item.id)
      .filter(item => item.id !== subject.id && !first.some(firstItem => firstItem.id === item.id))
      .slice(0, 10);
    return [
      ...sentenceFragments(subject).map(item => ({ ...item, distance: 0 })),
      ...first.flatMap(entry => sentenceFragments(entry).map(item => ({ ...item, distance: 1 }))),
      ...second.flatMap(entry => sentenceFragments(entry).map(item => ({ ...item, distance: 2 })))
    ];
  }

  function contentTokens(tokens) {
    return tokens.filter(token => !["grammar","connector","auxiliary","person-pronoun","thing-pronoun"].includes(token.role))
      .map(token => token.word)
      .filter(word => word.length > 1);
  }

  function expandedTerms(tokens, tags) {
    const terms = new Set(contentTokens(tokens));
    tags.forEach(tag => (SEMANTIC_GROUPS[tag] || []).forEach(term => terms.add(term)));
    return [...terms];
  }

  function evidenceScore(item, clause) {
    const text = qnorm(item.text);
    const exact = contentTokens(clause.tokens);
    const expanded = expandedTerms(clause.tokens, clause.tags);
    let score = item.distance === 0 ? 18 : item.distance === 1 ? 8 : 2;
    exact.forEach(term => { if (text.includes(term)) score += term.length > 5 ? 8 : 5; });
    expanded.forEach(term => { if (text.includes(term)) score += 2; });
    if (clause.intent === "reasoning" && /because|allows|makes|means|exchange|combines|relies|through|in order|prevent|support/.test(text)) score += 7;
    if (clause.intent === "mechanics" && /works|creates|uses|allows|causes|requires|turns|manipulates|summons|applies/.test(text)) score += 7;
    if (clause.dimension === "strength" && /physical|cursed energy|technique|domain|reverse cursed|efficiency|output|black flash|combat|analysis|adapt/.test(text)) score += 9;
    if (clause.dimension === "speed" && /speed|fast|quick|movement|reflex|reaction|close distance/.test(text)) score += 10;
    if (clause.dimension === "durability" && /durable|survive|endurance|stamina|heal|reverse cursed|body|reinforcement/.test(text)) score += 10;
    if (clause.dimension === "intelligence" && /analysis|tactical|strategy|intelligence|reads|adapts|planning/.test(text)) score += 10;
    if (item.kind === "summary" && clause.intent === "identity") score += 12;
    if (item.kind === "summary" && clause.intent === "reasoning" && !clause.dimension) score -= 2;
    return score;
  }

  function rankedEvidence(subject, clause, limit = 6) {
    const base = buildCorpus(subject);
    const referent = clause.referent && clause.referent.id !== subject?.id
      ? buildCorpus(clause.referent).map(item => ({ ...item, distance: Math.min(item.distance + 0.25, 2) }))
      : [];
    const ranked = [...base, ...referent]
      .map(item => ({ ...item, score: evidenceScore(item, clause) }))
      .sort((a, b) => b.score - a.score)
      .filter(item => item.score > 4);
    const picked = [];
    for (const item of ranked) {
      const text = qnorm(item.text);
      const overlaps = picked.some(existing => {
        const prior = qnorm(existing.text);
        return text === prior || (item.entry.id === existing.entry.id && (text.includes(prior) || prior.includes(text)));
      });
      if (!overlaps) picked.push(item);
      if (picked.length >= limit) break;
    }
    return picked;
  }

  function factorMatches(text, group) {
    const q = qnorm(text);
    return group.terms.some(term => q.includes(term));
  }

  function strengthFactors(subject, clause) {
    const curated = CURATED_STRENGTH_FACTS[subject?.id];
    if (curated) return curated.map(([label, text]) => ({ label, text, entry: subject }));

    const corpus = rankedEvidence(subject, clause, 24);
    const factors = [];
    for (const group of FACTOR_GROUPS) {
      const best = corpus.filter(item => factorMatches(item.text, group)).sort((a, b) => b.score - a.score)[0];
      if (best) factors.push({ label: group.label, text: best.text, entry: best.entry });
    }
    if (factors.length < 3) {
      corpus.forEach(item => {
        if (factors.length >= 5) return;
        if (!factors.some(factor => qnorm(factor.text) === qnorm(item.text))) {
          factors.push({ label: formatCategory(item.entry.category), text: item.text, entry: item.entry });
        }
      });
    }
    return factors.slice(0, 6);
  }

  function partShell(number, title, lede, body, label) {
    return `<section class="semantic-part" data-part="${number}">
      <div class="semantic-part-label"><span>Part ${number}</span>${label ? `<b>${escapeHtml(label)}</b>` : ""}</div>
      <h3>${escapeHtml(title)}</h3>
      ${lede ? `<p class="semantic-part-lede">${escapeHtml(lede)}</p>` : ""}
      ${body || ""}
    </section>`;
  }

  function identityPart(clause, target, number) {
    if (!target) return partShell(number, "Identity", "No clear subject was found in this part of the question.", "", "Who");
    const body = `<div class="semantic-evidence"><h4>Role and significance</h4><p>${escapeHtml(target.details || target.summary)}</p></div>
      ${(target.points || []).length ? `<ul>${target.points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : ""}`;
    return partShell(number, `Who is ${target.title}?`, target.summary, body, "Identity");
  }

  function strengthPart(clause, target, number) {
    const factors = strengthFactors(target, clause);
    const reputation = clause.tags.includes("reputation") || /considered|called|known|regarded/.test(qnorm(clause.text));
    const lede = reputation
      ? `${target.title} is considered exceptionally strong because several confirmed advantages stack together; the title is not based on one statistic alone.`
      : `${target.title}'s strength comes from several advantages working together rather than from a single unexplained power boost.`;
    const body = factors.length ? `<div class="semantic-factor-grid">${factors.map(factor => `
      <div class="semantic-factor"><h4>${escapeHtml(factor.label)}</h4><p>${escapeHtml(factor.text)}</p>${factor.entry?.id !== target.id ? `<span>Connected record: ${escapeHtml(factor.entry.title)}</span>` : ""}</div>`).join("")}</div>
      <div class="semantic-bottom-line"><b>Bottom line:</b> ${escapeHtml(target.title)} is dangerous because these layers reinforce one another. Removing one factor would still leave the others; overcoming the entire stack is what makes the matchup difficult.</div>` : `<p>The current curated record does not contain enough confirmed detail to build a responsible strength breakdown.</p>`;
    return partShell(number, `Why is ${target.title} so strong?`, lede, body, reputation ? "Reason + reputation" : "Reason");
  }

  function focusedReasonPart(clause, target, number) {
    const evidence = rankedEvidence(target, clause, 6);
    const lede = evidence[0]?.text || target.details || target.summary;
    const about = clause.referent && clause.referent.id !== target.id ? clause.referent : null;
    const title = about ? `Why ${target.title} connects to ${about.title}` : `Why — ${target.title}`;
    const body = evidence.length ? `<div class="semantic-evidence-list">${evidence.slice(1).map(item => `
      <div class="semantic-evidence"><h4>${escapeHtml(item.entry.title)}</h4><p>${escapeHtml(item.text)}</p></div>`).join("")}</div>` : "";
    return partShell(number, title, lede, body, about ? "Relationship reasoning" : "Reasoning");
  }

  function qualityPart(clause, target, number) {
    const labels = { speed: "fast", durability: "durable", intelligence: "tactically capable", importance: "important" };
    const dimensions = (clause.dimensions || [clause.dimension]).filter(item => labels[item]);
    const label = dimensions.map(item => labels[item]).join(" and ") || labels[clause.dimension] || clause.dimension;
    const curated = CURATED_STRENGTH_FACTS[target.id] || [];
    const relevantCurated = curated.filter(([heading, text]) => {
      const haystack = qnorm(`${heading} ${text}`);
      return dimensions.some(dimension => {
        if (dimension === "speed") return /speed|fast|reflex|senses|physical/.test(haystack);
        if (dimension === "durability") return /body|physical|durab|endurance|survive|healing|restriction/.test(haystack);
        if (dimension === "intelligence") return /combat|planning|tactical|analysis|strategy|experience/.test(haystack);
        return false;
      });
    }).slice(0, 5);
    const evidence = rankedEvidence(target, clause, 10).filter(item => item.distance <= 1).slice(0, 7);
    const lede = relevantCurated[0]?.[1] || evidence[0]?.text || target.details || target.summary;
    const curatedBody = relevantCurated.length ? `<div class="semantic-factor-grid">${relevantCurated.map(([heading, text]) => `<div class="semantic-factor"><h4>${escapeHtml(heading)}</h4><p>${escapeHtml(text)}</p></div>`).join("")}</div>` : "";
    const evidenceBody = !relevantCurated.length && evidence.length > 1 ? `<div class="semantic-evidence-list">${evidence.slice(1).map(item => `
      <div class="semantic-evidence"><h4>${escapeHtml(item.entry.title)}</h4><p>${escapeHtml(item.text)}</p></div>`).join("")}</div>` : "";
    return partShell(number, `Why is ${target.title} ${label}?`, lede, curatedBody || evidenceBody, dimensions.includes("importance") ? "Story significance" : "Focused traits");
  }

  function mechanicsPart(clause, target, number) {
    const evidence = rankedEvidence(target, clause, 6);
    const lede = evidence[0]?.text || target.details || target.summary;
    const body = `<div class="semantic-evidence-list">${evidence.slice(1).map(item => `
      <div class="semantic-evidence"><h4>${escapeHtml(item.entry.title)}</h4><p>${escapeHtml(item.text)}</p></div>`).join("")}</div>`;
    return partShell(number, `How ${target.title} works`, lede, body, "Mechanics");
  }

  function propertyPart(clause, subject, number) {
    const property = clause.property || clause.dimension;
    const focus = resolveProperty(subject, property) || clause.focus;
    if (!focus || focus.id === subject?.id) {
      return partShell(number, `${subject?.title || "Subject"} — ${property || "requested property"}`, `No separate confirmed ${property || "property"} record is directly linked in the curated archive.`, "", "Property");
    }
    const label = property === "domain" ? "Domain Expansion" : property === "technique" ? "Cursed technique" : formatCategory(focus.category);
    const body = `<div class="semantic-evidence"><h4>What it does</h4><p>${escapeHtml(focus.details)}</p></div>
      ${(focus.points || []).length ? `<ul>${focus.points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : ""}`;
    return partShell(number, `${subject.title}'s ${label}: ${focus.title}`, focus.summary, body, label);
  }

  function genericPart(clause, target, number) {
    const evidence = rankedEvidence(target, clause, 6);
    const lede = evidence[0]?.text || target?.summary || "The archive could not confidently resolve this part.";
    const body = evidence.length > 1 ? `<div class="semantic-evidence-list">${evidence.slice(1).map(item => `<div class="semantic-evidence"><h4>${escapeHtml(item.entry.title)}</h4><p>${escapeHtml(item.text)}</p></div>`).join("")}</div>` : "";
    return partShell(number, clause.text, lede, body, clause.intent);
  }

  function answerClause(clause, context, number) {
    let target = clause.focus || clause.target || context.subject;
    if (!target) return genericPart(clause, null, number);

    if (["character","curse"].includes(target.category)) context.subject = target;
    if (clause.intent === "identity") {
      context.focus = target;
      return identityPart(clause, target, number);
    }
    if (clause.dimension === "strength" && clause.intent === "reasoning") {
      context.focus = target;
      return strengthPart(clause, target, number);
    }
    if ((clause.dimensions || []).some(item => ["speed","durability","intelligence","importance"].includes(item)) && clause.intent === "reasoning") {
      context.focus = target;
      return qualityPart(clause, target, number);
    }
    if (clause.intent === "reasoning") {
      context.focus = target;
      return focusedReasonPart(clause, target, number);
    }
    if (clause.intent === "mechanics") {
      context.focus = target;
      return mechanicsPart(clause, target, number);
    }
    if (["definition","explanation","yesno"].includes(clause.intent) && clause.property && context.subject) {
      const resolved = resolveProperty(context.subject, clause.property);
      if (resolved) context.focus = resolved;
      return propertyPart(clause, context.subject, number);
    }
    if (clause.intent === "definition" && target) {
      context.focus = target;
      return partShell(number, `What is ${target.title}?`, target.summary, `<div class="semantic-evidence"><h4>Detailed explanation</h4><p>${escapeHtml(target.details)}</p></div>`, "Definition");
    }
    context.focus = target;
    return genericPart(clause, target, number);
  }

  function shouldUseSemantic(parsed) {
    if (!parsed.primary) return false;
    if (parsed.multiPart) return true;
    const clause = parsed.clauses[0];
    if (!clause) return false;
    if (clause.intent === "reasoning" || clause.intent === "mechanics") return true;
    if (clause.tags.includes("strength") || clause.tags.includes("speed") || clause.tags.includes("durability") || clause.tags.includes("intelligence") || clause.tags.includes("importance")) return true;
    if (/\bconsidered|overall|specifically|exactly|in detail|detailed\b/.test(parsed.normalized)) return true;
    return false;
  }

  function breakdown(parsed) {
    const content = contentTokens(parsed.tokens);
    const topics = unique(parsed.clauses.flatMap(clause => clause.tags)).slice(0, 5);
    const subjects = unique(parsed.clauses.map(clause => clause.target || clause.focus).filter(Boolean), item => item.id);
    const chips = [
      ["Understanding", parsed.multiPart ? `${parsed.clauses.length}-part question` : "Whole-question analysis"],
      ["Subjects", subjects.map(entry => entry.title).join(" + ") || parsed.primary?.title || "Unresolved"],
      ["Intent", unique(parsed.clauses.map(clause => clause.intent)).join(" + ")],
      ...(topics.length ? [["Meaning", topics.join(", ")]] : []),
      ...(content.length ? [["Key words used", content.slice(0, 9).join(", ")]] : [])
    ];
    $("#queryBreakdown").innerHTML = chips.map(([label, value]) => `<span class="break-chip">${escapeHtml(label)}<b>${escapeHtml(value)}</b></span>`).join("");
  }

  function renderSemanticAnswer(parsed) {
    const context = { subject: parsed.primary, focus: parsed.primary };
    const parts = parsed.clauses.map((clause, index) => answerClause(clause, context, index + 1));
    const title = parsed.multiPart
      ? `One question, ${parsed.clauses.length} answers`
      : parsed.clauses[0]?.dimension === "strength" ? `${parsed.primary.title} — strength explained` : `Answering what you actually asked`;
    const lede = parsed.multiPart
      ? "The question contains separate requests, so the archive answered each one directly and kept their evidence distinct."
      : "The engine prioritized the requested reason, mechanism, or quality instead of falling back to a general biography.";
    return `<div class="semantic-answer-v4">
      <h2 class="answer-title">${escapeHtml(title)}</h2>
      <p class="answer-lede">${escapeHtml(lede)}</p>
      ${parts.join("")}
      <div class="answer-note"><b>Canon handling:</b> Each section is assembled from the subject's curated record and directly connected records. Missing information is not silently replaced with fan theory.</div>
    </div>`;
  }

  function installStyles() {
    if (document.querySelector("#semantic-engine-v4-styles")) return;
    const style = document.createElement("style");
    style.id = "semantic-engine-v4-styles";
    style.textContent = `
      .semantic-answer-v4{min-width:0;max-width:100%}
      .semantic-part{min-width:0;margin-top:20px;padding:20px;border:1px solid rgba(159,102,255,.18);border-radius:17px;background:linear-gradient(145deg,rgba(159,102,255,.055),rgba(255,255,255,.012));overflow:hidden}
      .semantic-part-label{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}.semantic-part-label span,.semantic-part-label b{font-size:9px;letter-spacing:.12em;text-transform:uppercase}.semantic-part-label span{color:#b98cff}.semantic-part-label b{font-weight:500;color:#8f879c;border:1px solid var(--border);border-radius:999px;padding:5px 8px}
      .semantic-part h3{font:500 clamp(22px,4vw,31px)/1.16 Georgia,serif;margin:0 0 10px;color:#f5efff}.semantic-part-lede{font-size:14px;line-height:1.75;color:#d4cddd;margin:0 0 16px}
      .semantic-factor-grid,.semantic-evidence-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.semantic-factor,.semantic-evidence{min-width:0;border:1px solid var(--border);border-radius:13px;padding:14px;background:rgba(0,0,0,.11)}
      .semantic-factor h4,.semantic-evidence h4{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#ad7cff;margin:0 0 8px}.semantic-factor p,.semantic-evidence p{font-size:12px;line-height:1.67;color:#bdb5c8;margin:0;overflow-wrap:anywhere}.semantic-factor span{display:block;margin-top:9px;font-size:9px;color:#797181}
      .semantic-bottom-line{margin-top:13px;padding:14px;border-left:2px solid #9f66ff;background:rgba(159,102,255,.045);border-radius:0 11px 11px 0;color:#bfb7cb;font-size:12px;line-height:1.7}.semantic-bottom-line b{color:#eee6ff}
      .semantic-part ul{margin:14px 0 0;padding-left:19px;display:grid;gap:8px}.semantic-part li{font-size:12px;line-height:1.65;color:#bdb5c8}
      @media(max-width:700px){.semantic-part{padding:16px}.semantic-factor-grid,.semantic-evidence-list{grid-template-columns:1fr}.semantic-part h3{font-size:23px}}
    `;
    document.head.appendChild(style);
  }

  installStyles();

  performSearch = async function performSearchSemanticV4(rawQuery) {
    const query = String(rawQuery || "").trim();
    if (!query) { toast("Type a JJK question first."); return; }
    const parsed = parseQuestionV4(query);
    if (!shouldUseSemantic(parsed)) return previousPerformSearch(rawQuery);

    state.currentQuery = query;
    state.currentEntryId = parsed.primary?.id || null;
    $("#searchInput").value = query;
    $("#autocomplete").hidden = true;
    $("#queryTitle").textContent = query;
    $("#answerType").textContent = parsed.multiPart ? "Semantic Question Engine v4 · multi-part" : "Semantic Question Engine v4";
    breakdown(parsed);
    $("#answerContent").innerHTML = renderSemanticAnswer(parsed);
    const relatedPool = unique(parsed.clauses.flatMap(clause => linked(clause.focus || clause.target || parsed.primary)), item => item.id);
    renderRelated(parsed.primary, relatedPool.map(entry => ({ entry, score: 1 })));
    showView("#resultsView");
    state.currentAnswerText = $("#answerContent").innerText;
    updateSaveButton();
  };

  const promptRow = document.querySelector(".prompt-row");
  if (promptRow) {
    promptRow.innerHTML = `<span>Try asking</span>
      <button class="prompt-chip">Who is Gojo and why is he considered the strongest?</button>
      <button class="prompt-chip">Why is Yuji so strong?</button>
      <button class="prompt-chip">What is Unlimited Void and how does it work?</button>`;
  }

  document.documentElement.dataset.semanticEngine = VERSION;
  console.info(`[JJK Archive] Semantic Question Engine v${VERSION} active`);
})();
