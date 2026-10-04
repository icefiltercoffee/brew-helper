"use strict";
(() => {
  // data/principles.json
  var principles_default = [
    {
      id: "PRN-0001",
      statement: "A valve-controlled two-stage brew (percolation then immersion) lets you develop acidity/florals and sweetness/body on separate clocks.",
      domain: "pour",
      mechanism: "Percolation with the valve open extracts the fast-dissolving acids and aromatics with fresh, moving water (clarity + brightness). Closing the valve switches to immersion, where extraction is driven by contact time \u2014 reaching the mid-curve sugars for sweetness and body without more turbulence. Splitting the brew decouples two goals that a single continuous pour forces you to trade off.\n",
      appliesWhen: [
        "Hario Switch / valve brewers",
        "coffees where you want both high clarity AND developed sweetness"
      ],
      levers: [
        "time",
        "pour",
        "agitation"
      ],
      strategyImplication: "When the radar asks for clarity AND sweetness together (usually a conflict), reach for a staged percolation\u2192immersion method instead of compromising in the middle.",
      confidence: 0.68,
      evidence: {
        sources: [
          "SRC-0001",
          "SRC-0002"
        ],
        recipes: [
          "RCP-0001",
          "RCP-0002"
        ],
        independentCount: 2
      },
      status: "active",
      version: 3
    },
    {
      id: "PRN-0002",
      statement: "Outflow resistance (holding water in immersion) builds sweetness and body through contact time, not agitation.",
      domain: "time",
      mechanism: "Closing the valve stops percolation and lets the slurry steep. Extraction continues via time and diffusion rather than turbulence, so you reach the mid-curve sugars (sweetness) and pull more dissolved solids (body) without the fines migration that agitation causes \u2014 avoiding astringency. Time is the gentle sweetness lever.\n",
      appliesWhen: [
        "immersion or valve-hold stages",
        "delicate/aromatic coffees where agitation risks astringency"
      ],
      levers: [
        "time",
        "agitation"
      ],
      strategyImplication: "To add sweetness/body while protecting a fragile cup, extend contact time instead of pouring harder or grinding much finer.",
      confidence: 0.6,
      evidence: {
        sources: [
          "SRC-0001"
        ],
        recipes: [
          "RCP-0001"
        ],
        independentCount: 1
      },
      status: "active",
      version: 2
    },
    {
      id: "PRN-0003",
      statement: "With an immersion stage carrying the extraction, you can grind coarser on a dense, aromatic coffee to protect clarity and florals.",
      domain: "grind",
      mechanism: "Coarse grind (~700\xB5m here) lowers percolation resistance and produces fewer fines, which is where astringency and muddiness come from in fragile high-value coffees. Extraction that a finer grind would normally supply is instead provided by the immersion stage's contact time. You get enough extraction without the fines penalty \u2014 clarity and aromatics survive.\n",
      appliesWhen: [
        "hybrid/immersion methods",
        "dense anaerobic naturals / Geisha / delicate florals"
      ],
      levers: [
        "grind",
        "time"
      ],
      strategyImplication: "Pair a coarser grind with an immersion/hold when clarity+florals are the priority on a premium coffee; let time, not fineness, do the extracting.",
      confidence: 0.58,
      evidence: {
        sources: [
          "SRC-0001"
        ],
        recipes: [
          "RCP-0001"
        ],
        independentCount: 1
      },
      status: "active",
      version: 2
    },
    {
      id: "PRN-0004",
      statement: "Low-TDS, balanced Mg/Ca water (~50 ppm) gives enough extraction power for clarity and vibrant acidity without the harshness higher mineral/alkalinity adds.",
      domain: "water",
      mechanism: "Magnesium and calcium are the ions that actively pull flavour; a modest, balanced ~50 ppm gives real extraction power while keeping total dissolved content low, so acids stay bright and the cup stays transparent. Higher GH/alkalinity would raise extraction but buffer acidity and risk a heavier, duller, harsher cup.\n",
      appliesWhen: [
        "clarity/acidity-forward goals",
        "delicate aromatic coffees"
      ],
      levers: [
        "water"
      ],
      strategyImplication: "For clarity + vibrant acidity, spec low-TDS balanced-mineral water; don't reach for high-hardness or high-buffer water.",
      confidence: 0.62,
      evidence: {
        sources: [
          "SRC-0001",
          "SRC-0003"
        ],
        recipes: [
          "RCP-0001",
          "RCP-0005"
        ],
        independentCount: 2
      },
      status: "active",
      version: 2
    },
    {
      id: "PRN-0005",
      statement: "Moderate brew temperature (~92\xB0C) on a fragile anaerobic natural preserves volatile florals while still extracting sugars.",
      domain: "temp",
      mechanism: "Volatile aromatic compounds (hibiscus, red florals) are heat-sensitive; near-boiling water can blow past them and pull harsher solubles from an already-intense ferment. ~92\xB0C is hot enough to extract a light roast's sugars but cool enough to keep the delicate top notes intact and the cup clean rather than boozy.\n",
      appliesWhen: [
        "anaerobic / carbonic / high-ferment naturals",
        "floral-forward light roasts"
      ],
      levers: [
        "temp"
      ],
      strategyImplication: "Protect aromatics on fragile ferments with a moderate temp; reserve hotter water for dense, under-developed light roasts that need the energy.",
      confidence: 0.58,
      evidence: {
        sources: [
          "SRC-0001"
        ],
        recipes: [
          "RCP-0001"
        ],
        independentCount: 1
      },
      status: "active",
      version: 2
    },
    {
      id: "PRN-0009",
      statement: "Cooler water + a coarser grind + minimal agitation biases a brew toward sweetness and balance, suppressing bitterness.",
      domain: "temp",
      mechanism: "Lower temperature limits extraction of the late, bitter/phenolic compounds; a coarser grind keeps flow efficient so the cup isn't under-extracted despite the cooler water; few, gentle pours reduce fines migration and astringency. Together they land mid-curve \u2014 sweet and rounded \u2014 rather than pushing extraction into harshness.\n",
      appliesWhen: [
        "washed/medium coffees where sweetness+approachability is the goal",
        "not ideal for dense, very light roasts (risk under-extraction)"
      ],
      levers: [
        "temp",
        "grind",
        "agitation"
      ],
      strategyImplication: "When the goal is sweetness/balance over intensity, drop temp (~90\u201392\xB0C), coarsen grind, and minimise agitation.",
      confidence: 0.6,
      evidence: {
        sources: [
          "SRC-0003"
        ],
        recipes: [
          "RCP-0006",
          "RCP-0007"
        ],
        independentCount: 2
      },
      status: "active",
      version: 2
    },
    {
      id: "PRN-0010",
      statement: "Brew ratio trades concentration for clarity: tighter (~1:15) builds sweetness and body; wider (~1:17) increases flavour separation.",
      domain: "ratio",
      mechanism: "A tighter ratio raises beverage TDS (strength), so sweetness and body read louder. A wider ratio dilutes the cup, spreading the same solubles thinner so subtle, distinct notes become individually perceptible \u2014 clarity and separation at the cost of intensity.\n",
      appliesWhen: [
        "choosing target strength vs transparency"
      ],
      levers: [
        "ratio"
      ],
      strategyImplication: "Pick ratio by intent: ~1:15 when Sweetness/Body lead; ~1:17 when Clarity/separation leads.",
      confidence: 0.6,
      evidence: {
        sources: [
          "SRC-0003"
        ],
        recipes: [
          "RCP-0003",
          "RCP-0005"
        ],
        independentCount: 2
      },
      status: "active",
      version: 2
    },
    {
      id: "PRN-0011",
      statement: "A large bloom (3\u20134\xD7 the dose) degasses fresh/light roasts thoroughly, giving a more uniform extraction bed.",
      domain: "bloom",
      mechanism: "CO\u2082 trapped in fresh, lightly-roasted coffee repels water and causes uneven extraction. A generous bloom (3\u20134\xD7 dose) saturates fully and releases that gas before the main pours, so subsequent water contacts the grounds evenly \u2014 raising extraction uniformity and sweetness.\n",
      appliesWhen: [
        "fresh coffees (<2\u20133 weeks)",
        "light roasts",
        "deep beds / higher doses"
      ],
      levers: [
        "bloom"
      ],
      strategyImplication: "For fresh/light coffees, bloom at 3\u20134\xD7 dose (not the usual 2\xD7) to degas before extracting.",
      confidence: 0.62,
      evidence: {
        sources: [
          "SRC-0003"
        ],
        recipes: [
          "RCP-0003",
          "RCP-0005",
          "RCP-0008"
        ],
        independentCount: 3
      },
      status: "active",
      version: 2
    }
  ];

  // packages/memory/static.ts
  function createStaticMemoryManager(principles) {
    return {
      async retrieve(_o) {
        const history = [];
        const familiarity = Math.min(1, principles.reduce((s, p) => s + p.confidence, 0) / 4);
        return { principles, history, familiarity };
      },
      async learn(_u) {
      }
    };
  }

  // packages/research/adapter.ts
  function kindFor(category) {
    if (!category) return "community";
    if (/Research|Journal|Academic/i.test(category)) return "science";
    if (/Roaster/i.test(category)) return "roaster";
    if (/Champion|Brewer|Education/i.test(category)) return "competition";
    return "community";
  }
  function guessDomain(text) {
    const t = text.toLowerCase();
    for (const d of ["grind", "temp", "agitation", "ratio", "water", "pour", "bloom", "process", "roast"])
      if (t.includes(d)) return d;
    return "general";
  }
  function extractClaims(doc, tier, registry) {
    const meta = registry.meta(doc.url);
    const statement = (doc.title || doc.text.split(".")[0] || "").trim();
    if (!statement) return [];
    return [{
      statement,
      source: { id: doc.domain, title: meta?.name, tier },
      tier,
      kind: kindFor(meta?.category),
      weight: (meta?.credibility ?? 60) / 100,
      domain: guessDomain(doc.text),
      independentCount: 1
    }];
  }

  // packages/research/router.ts
  var HIGH = 0.75;
  function createFamiliarityRouter() {
    return {
      score(_o, principles) {
        return Math.min(1, principles.reduce((s, p) => s + p.confidence, 0) / 4);
      },
      needsResearch(score2) {
        return score2 < HIGH;
      }
    };
  }
  function createResearchManager(opts = {}) {
    return {
      async maybeResearch(o, _familiarity) {
        if (!opts.provider || !opts.registry) return [];
        const query = [o.coffee.origin, o.coffee.process, o.coffee.variety, "brewing"].filter(Boolean).join(" ");
        const docs = await opts.provider.search(query);
        const budget = opts.budget ?? 5;
        const out = [];
        const seen = /* @__PURE__ */ new Set();
        for (const d of docs) {
          if (out.length >= budget) break;
          if (!opts.registry.isTrusted(d.url)) continue;
          if (seen.has(d.url)) continue;
          seen.add(d.url);
          const tier = opts.registry.tierOf(d.url);
          out.push({ url: d.url, tier, claims: extractClaims(d, tier, opts.registry), fetchedAt: (/* @__PURE__ */ new Date()).toISOString() });
        }
        return out;
      }
    };
  }

  // packages/science/validate.ts
  var num = (v) => {
    const m = (v ?? "").match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  };
  function ratioDenom(v) {
    const m = (v ?? "").match(/1\s*:\s*(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : NaN;
  }
  function timeSeconds(v) {
    const m = (v ?? "").match(/(\d+):(\d{2})/);
    if (m) return +m[1] * 60 + +m[2];
    const s = (v ?? "").match(/(\d+)\s*s/);
    return s ? +s[1] : NaN;
  }
  function grindScale(v) {
    const g = (v ?? "").toLowerCase();
    if (g.includes("extra") && g.includes("fine")) return 0.05;
    if (g.includes("medium-fine") || g.includes("medium fine")) return 0.4;
    if (g.includes("medium-coarse") || g.includes("medium coarse")) return 0.75;
    if (g.includes("coarse")) return 0.9;
    if (g.includes("fine")) return 0.2;
    if (g.includes("immersion") || g.includes("medium")) return 0.6;
    return 0.5;
  }
  var has = (s, ...w) => w.some((x) => (s ?? "").toLowerCase().includes(x));
  function createScienceEngine() {
    return {
      validateStrategy(s, o) {
        const flags = [];
        const roast = (o.coffee.roastLevel ?? "").toLowerCase();
        if (roast.includes("dark") && has(s.extractionTarget.position, "upper", "high")) {
          flags.push({ severity: "warn", message: "Dark roast aimed at high extraction \u2014 the curve turns bitter early here; keep it gentle." });
        }
        if (s.primary === "clarity" && has(s.extractionTarget.approach, "upper", "aggress")) {
          flags.push({ severity: "warn", message: "Clarity comes from evenness, not more extraction \u2014 ease the energy, not add to it." });
        }
        return { ok: true, flags };
      },
      validateRecipe(r, o) {
        const flags = [];
        const roast = (o.coffee.roastLevel ?? "").toLowerCase();
        const process = (o.coffee.process ?? "").toLowerCase();
        const altitude2 = num(o.coffee.altitude);
        const p = (name) => r.params.find((x) => x.name === name)?.value;
        const temp = num(p("temp"));
        const grind = grindScale(p("grind"));
        const ratio = ratioDenom(p("ratio"));
        const time = timeSeconds(p("total time"));
        const agitation = p("agitation");
        if (!Number.isNaN(temp)) {
          if (temp > 96) flags.push({ severity: "veto", message: `${temp}\xB0C scorches most filter coffee \u2014 stay \u2264 96\xB0C.` });
          if (roast.includes("dark") && temp >= 94) flags.push({ severity: "veto", message: `${temp}\xB0C on a dark roast over-extracts (bitter/ashy) \u2014 drop to \u2264 90\xB0C.` });
          else if (roast.includes("dark") && temp >= 92) flags.push({ severity: "warn", message: "Dark roast near 92\xB0C \u2014 watch for bitterness; 88\u201390\xB0C is safer." });
          if (roast.includes("light") && temp < 90) flags.push({ severity: "warn", message: "Cool water on a light roast risks under-extraction (sour/hollow)." });
          if (roast.includes("light") && altitude2 >= 1700 && temp < 92) flags.push({ severity: "warn", message: "Dense high-grown light roast wants more energy \u2014 consider 92\u201394\xB0C." });
        }
        if (roast.includes("dark") && grind < 0.35) flags.push({ severity: "warn", message: "Fine grind on a dark roast accelerates over-extraction \u2014 go coarser." });
        if (roast.includes("light") && altitude2 >= 1700 && grind > 0.8 && (Number.isNaN(temp) || temp < 92))
          flags.push({ severity: "warn", message: "Coarse grind + cool water on a dense light roast is an under-extraction combo (sour/thin)." });
        if ((has(process, "washed") || process === "") && has(agitation, "strong"))
          flags.push({ severity: "warn", message: "Strong agitation on a washed coffee invites astringency \u2014 soften the pours." });
        if (has(process, "natural", "anaerobic") && has(agitation, "strong"))
          flags.push({ severity: "warn", message: "Strong agitation on a natural/anaerobic can turn muddy \u2014 keep it even and gentle." });
        if (!Number.isNaN(ratio)) {
          if (ratio < 13) flags.push({ severity: "warn", message: `1:${ratio} is very strong \u2014 fine for intensity, but easy to under-dilute.` });
          if (ratio > 18) flags.push({ severity: "warn", message: `1:${ratio} is very dilute \u2014 the cup may read thin.` });
        }
        if (!Number.isNaN(time)) {
          if (roast.includes("dark") && time > 210) flags.push({ severity: "warn", message: "Long contact on a dark roast pulls the bitter tail \u2014 shorten it." });
          if (grind < 0.3 && time > 240) flags.push({ severity: "warn", message: "Fine grind + long time risks over-extraction (drying finish)." });
        }
        return { ok: !flags.some((f) => f.severity === "veto"), flags };
      },
      correctRecipe(r, o) {
        const roast = (o.coffee.roastLevel ?? "").toLowerCase();
        const revised = r.params.map((param) => ({ ...param }));
        const change = (name, value, because) => {
          const target = revised.find((p) => p.name === name);
          if (target) {
            target.value = value;
            target.because = `${target.because}; ${because}`;
          }
        };
        const temp = num(revised.find((p) => p.name === "temp")?.value);
        if (temp > 96) change("temp", "96\xB0C", "science gate capped water temperature");
        if (roast.includes("dark") && temp >= 94) change("temp", "90\xB0C", "science gate protects a dark roast from the bitter tail");
        return { ...r, params: revised };
      }
    };
  }

  // packages/evidence/synthesise.ts
  var OPPOSING = [
    ["finer", "coarser"],
    ["hotter", "cooler"],
    ["higher", "lower"],
    ["more", "less"],
    ["increase", "reduce"],
    ["tighter", "wider"]
  ];
  function contextRelevance(c, observation) {
    if (!observation) return 0.6;
    const text = `${c.statement ?? ""} ${(c.appliesWhen ?? []).join(" ")}`.toLowerCase();
    const process = (observation.coffee.process ?? "").toLowerCase();
    const roast = (observation.coffee.roastLevel ?? "").toLowerCase();
    const brewer = (observation.setup.brewer ?? "").toLowerCase();
    let relevance = 0.55;
    if (process && text.includes(process)) relevance += 0.18;
    if (roast && text.includes(roast)) relevance += 0.12;
    if (brewer && text.includes(brewer)) relevance += 0.15;
    if (/any coffee|filter coffee|general/.test(text)) relevance = Math.max(relevance, 0.65);
    return Math.min(1, relevance);
  }
  function scoreOf(c, observation) {
    const tierW = c.tier === "A" ? 1 : c.tier === "B" ? 0.8 : 0.6;
    const conv = 1 + Math.min(0.3, ((c.independentCount ?? 1) - 1) * 0.1);
    const credibility = Math.min(1, c.weight * tierW * conv);
    const completeness = c.completeness ?? 0.6;
    const relevance = contextRelevance(c, observation);
    return 0.4 * credibility + 0.3 * completeness + 0.3 * relevance;
  }
  function detectConflicts(claims) {
    const byDomain = /* @__PURE__ */ new Map();
    for (const c of claims) {
      const d = c.domain ?? "general";
      (byDomain.get(d) ?? byDomain.set(d, []).get(d)).push(c);
    }
    const conflicts = [];
    for (const [domain, cs] of byDomain) {
      if (cs.length < 2) continue;
      const text = cs.map((c) => c.statement.toLowerCase());
      for (const [a, b] of OPPOSING) {
        const hasA = text.some((t) => t.includes(a)), hasB = text.some((t) => t.includes(b));
        if (hasA && hasB) {
          conflicts.push({ on: domain, note: `Sources differ on ${domain} \u2014 kept the higher-confidence, context-matched call.` });
          break;
        }
      }
    }
    return conflicts;
  }
  function createEvidenceSynth() {
    return {
      synthesise(claims, ctx) {
        const applied = new Set(ctx?.appliedIds ?? []);
        const anecdote = claims.filter((c) => c.kind !== "science");
        const science = claims.filter((c) => c.kind === "science");
        const ranked2 = anecdote.map((c) => ({ c, s: scoreOf(c, ctx?.observation) + (applied.has(c.principleId ?? "") ? 0.25 : 0) })).sort((a, b) => b.s - a.s);
        const decisionInput = ranked2.map((r) => r.c);
        const conflicts = detectConflicts(ranked2.slice(0, 6).map((r) => r.c));
        const items = ranked2.slice(0, 5).map(({ c }) => ({
          label: c.statement,
          kind: c.kind,
          theme: c.domain,
          strength: applied.has(c.principleId ?? "") || c.weight >= 0.62 ? "strong" : "moderate"
        }));
        const appliedCount = ranked2.filter((r) => applied.has(r.c.principleId ?? "")).length;
        const note = !claims.length ? "Starting from coffee-science fundamentals (principle library still small)." : conflicts.length ? "Weighed differing sources; led with the strongest, context-matched guidance." : appliedCount ? `${appliedCount} principle(s) drove this call${science.length ? "; consistent with the extraction curve" : ""}.` : "Drawn from your principle library; consistent with the extraction curve.";
        const evidence = { items, note, conflicts };
        return { decisionInput, evidence, conflicts };
      }
    };
  }

  // packages/strategy/strategy-generator.ts
  var APPROACH = {
    clarity: "even, controlled extraction \u2014 moderate agitation, protect against fines",
    sweetness: "reach the mid-curve \u2014 a slightly finer grind and adequate contact time",
    body: "a fuller extraction \u2014 finer or immersion, more contact",
    acidity: "preserve the acids \u2014 cooler water, a brighter and faster brew",
    floral: "protect the aromatics \u2014 cooler water and gentle handling",
    juiciness: "balance sweetness and acidity \u2014 a higher dose and an even bed"
  };
  function ranked(intent) {
    return Object.keys(intent).sort((a, b) => intent[b] - intent[a]);
  }
  function createStrategyGenerator(principles = []) {
    return {
      generate({ intent, interpretation, observation }) {
        const order = ranked(intent);
        const primary = order[0], secondary = order[1], tradeoff = order[order.length - 1];
        const AXES2 = Object.keys(intent);
        const axisMentions = (p) => {
          const hay = p.appliesWhen.join(" ").toLowerCase();
          return AXES2.filter((a) => hay.includes(a));
        };
        const applied = principles.filter((p) => {
          const named = axisMentions(p);
          return named.length > 0 && named.every((a) => intent[a] >= 0.55);
        });
        const methodPrinciple = applied.find(
          (p) => /immersion|percolation|staged|switch/i.test(p.statement + p.strategyImplication)
        );
        const hasSwitch = /switch/i.test(observation.setup.brewer ?? "");
        const methodHint = methodPrinciple && hasSwitch ? "staged percolation\u2192immersion (Switch) \u2014 develop acidity/florals, then sweetness/body on separate clocks" : void 0;
        const difficult = interpretation.inferences.some((i) => i.property === "extractionDifficulty" && i.value === "higher");
        const delicate = /washed|anaerobic/.test(observation.coffee.process?.toLowerCase() ?? "") || primary === "floral";
        const position = primary === "clarity" || primary === "floral" || primary === "acidity" ? "mid, reached via evenness rather than aggression" : "mid-to-upper, for sweetness support";
        const rationaleBits = [
          `You're asking most for ${primary} and ${secondary}; ${APPROACH[primary]}.`,
          `Accepting less ${tradeoff} is the trade.`
        ];
        if (difficult) rationaleBits.push("This coffee needs enough energy to reach sweetness, but that energy should come from grind and contact before heat.");
        if (delicate) rationaleBits.push("Keep the delivery gentle so the cup stays articulate rather than drying.");
        if (methodPrinciple) rationaleBits.push(`Applies ${methodPrinciple.id}: ${methodPrinciple.strategyImplication}`);
        if (methodPrinciple && !hasSwitch) rationaleBits.push("The staged Switch method is compatible with a valve brewer only, so this plan keeps the same clarity-and-sweetness intent within your current setup.");
        return {
          id: `str_${Date.now().toString(36)}`,
          primary,
          secondary,
          tradeoffs: [`accept less ${tradeoff}`],
          extractionTarget: { position: difficult && position === "mid, reached via evenness rather than aggression" ? "mid-to-upper, reached via evenness rather than aggression" : position, approach: `${APPROACH[primary]}${difficult ? "; add energy through grind/contact" : ""}${delicate ? "; keep the delivery gentle" : ""}` },
          constraintsFromIntent: order.filter((a) => intent[a] >= 0.6).map((a) => `${a} high`),
          rationale: rationaleBits.join(" "),
          methodHint,
          appliedPrincipleIds: applied.map((p) => p.id)
        };
      }
    };
  }

  // packages/recipe/recipe-generator.ts
  var GRIND_ORDER = ["extra fine", "fine", "medium-fine", "medium", "medium-coarse", "coarse"];
  function shiftGrind(label, bias) {
    const l = label.toLowerCase();
    let i = 2, bestLen = 0;
    GRIND_ORDER.forEach((g, idx) => {
      if (l.includes(g) && g.length > bestLen) {
        i = idx;
        bestLen = g.length;
      }
    });
    const ni = Math.max(0, Math.min(GRIND_ORDER.length - 1, i + (bias === "finer" ? -1 : 1)));
    return `${GRIND_ORDER[ni]} (calibrated ${bias})`;
  }
  function createRecipeGenerator() {
    return {
      generate(s, _gear, obs) {
        const primary = s.primary;
        const roast = (obs?.coffee.roastLevel ?? "").toLowerCase();
        let temp = 93;
        if (primary === "floral" || primary === "acidity") temp = 92;
        else if (primary === "body" || primary === "sweetness") temp = 94;
        if (roast.includes("dark")) temp = Math.min(temp, 90);
        if (roast.includes("light")) temp = Math.max(temp, 93);
        let grind = primary === "body" ? "medium (or immersion)" : primary === "sweetness" ? "medium-fine (a touch finer)" : "medium-fine";
        const bias = _gear?.calibration?.grindBias;
        if (bias === "finer" || bias === "coarser") grind = shiftGrind(grind, bias);
        const agitation = primary === "clarity" || primary === "floral" ? "gentle, even pours \u2014 minimal agitation" : "moderate, even agitation";
        const params = [
          { name: "dose", value: "15 g", because: "a standard single-cup dose to anchor the ratio", serves: s.id, lever: "ratio" },
          { name: "ratio", value: primary === "body" ? "1:15" : "1:16.5", because: `${primary}-forward: ${s.extractionTarget.approach}`, serves: s.id, lever: "ratio" },
          { name: "grind", value: grind, because: `add energy via surface area to serve ${primary}, not via heat`, serves: s.id, lever: "grind" },
          { name: "temp", value: `${temp}\xB0C`, because: roast.includes("light") ? "enough to extract a dense light roast without scorching aromatics" : `tuned to ${primary}`, serves: s.id, lever: "temp" },
          { name: "agitation", value: agitation, because: "agitation is where a delicate cup turns astringent", serves: s.id, lever: "agitation" },
          { name: "total time", value: primary === "body" ? "~3:00" : "~2:30", because: `${primary === "clarity" || primary === "floral" ? "keep it bright" : "build sweetness"} \u2014 control the finish`, serves: s.id, lever: "time" }
        ];
        if (s.methodHint) {
          params.unshift({
            name: "method",
            value: s.methodHint,
            because: `applies ${(s.appliedPrincipleIds ?? []).join(", ")} to develop your top two priorities on separate clocks`,
            serves: s.id,
            lever: "pour"
          });
        }
        const predictedCup = { sweetness: 0.6, clarity: 0.7, body: 0.5, acidity: 0.6, floral: 0.55, juiciness: 0.6 };
        return { strategyRef: s.id, params, predictedCup, scienceFlags: [] };
      }
    };
  }

  // packages/engine/compose-static.ts
  function composeEngineStatic(principles) {
    return {
      memory: createStaticMemoryManager(principles),
      router: createFamiliarityRouter(),
      research: createResearchManager(),
      science: createScienceEngine(),
      evidence: createEvidenceSynth(),
      makeStrategy: (ps) => createStrategyGenerator(ps),
      recipe: createRecipeGenerator()
    };
  }

  // packages/evidence/profile.ts
  var score = (l) => l === "High" ? 2 : l === "Moderate" ? 1 : 0;
  var byCount = (n, hi, mod) => n >= hi ? "High" : n >= mod ? "Moderate" : n > 0 ? "Limited" : "None";
  function computeProfile(inp) {
    const applied = inp.appliedIds.length;
    const distinctSources = new Set(inp.claims.map((c) => c.source.id)).size;
    const science = inp.claims.filter((c) => c.kind === "science");
    const hasConflict = inp.conflicts.length > 0;
    const scientificSupport = science.some((c) => c.tier === "A") ? "High" : science.length ? "Moderate" : "Limited";
    let expertConsensus = applied >= 3 ? "High" : applied >= 2 ? "Moderate" : applied >= 1 ? "Limited" : "None";
    if (hasConflict && expertConsensus === "High") expertConsensus = "Moderate";
    const coffeeSimilarity = inp.familiarity >= 0.75 ? "Moderate" : "Limited";
    const evidenceFreshness = applied > 0 ? "High" : inp.claims.length ? "Moderate" : "None";
    const researchCoverage = byCount(applied, 3, 2);
    const sourceDiversity = byCount(distinctSources, 3, 2);
    const stab = Math.min(score(researchCoverage), score(sourceDiversity));
    const recommendationStability = stab >= 2 ? "High" : stab >= 1 ? "Moderate" : "Limited";
    const palateCalibration = inp.palate?.reliability.level ?? "None";
    return {
      scientificSupport,
      expertConsensus,
      coffeeSimilarity,
      evidenceFreshness,
      researchCoverage,
      sourceDiversity,
      recommendationStability,
      palateCalibration
    };
  }
  function deriveState(p, familiarity, applied) {
    if (applied === 0 || familiarity < 0.3) return "Experimental";
    if (p.coffeeSimilarity !== "Limited" && p.palateCalibration === "None") {
      return score(p.expertConsensus) >= 1 && score(p.sourceDiversity) >= 1 ? "Well Supported" : "Exploratory";
    }
    if (score(p.scientificSupport) >= 1 && p.expertConsensus === "High" && score(p.sourceDiversity) >= 1) return "Highly Supported";
    if (score(p.expertConsensus) >= 1 && score(p.sourceDiversity) >= 1) return "Well Supported";
    return "Exploratory";
  }
  function buildEvidenceBundle(inp) {
    const profile = computeProfile(inp);
    const applied = inp.appliedIds.length;
    const state = deriveState(profile, inp.familiarity, applied);
    const appliedClaims = inp.claims.filter((c) => c.principleId && inp.appliedIds.includes(c.principleId));
    const domains = [...new Set(appliedClaims.map((c) => c.domain).filter(Boolean))];
    const science = inp.claims.filter((c) => c.kind === "science");
    const distinctSources = new Set(inp.claims.map((c) => c.source.id)).size;
    const consensus = domains.length ? domains.map((d) => `Practitioners align on ${d}`) : [];
    const assumptions = [];
    if (profile.coffeeSimilarity !== "High") {
      const desc = [inp.coffee.roastLevel, inp.coffee.process, inp.coffee.origin].filter(Boolean).join(" ") || "this style of";
      assumptions.push(`Extrapolates from similar ${desc} coffees \u2014 limited direct data on this exact coffee.`);
    }
    const limitations = [];
    if (!science.length) limitations.push("No peer-reviewed source directly validates this \u2014 it rests on practitioner principles.");
    if (inp.unknowns.includes("waterProfile")) limitations.push("Water profile unspecified \u2014 flavour may shift with your water.");
    limitations.push("No brew history for this coffee yet \u2014 the first cup calibrates it.");
    const rel = inp.palate?.reliability;
    if (!rel || rel.level === "None") {
      limitations.push(`Palate not calibrated against the panel${rel ? ` (${rel.sessions}/3 blind sessions logged)` : ""} \u2014 your tasting notes are taken at face value.`);
    } else {
      const weak = Object.keys(rel.perAxis).filter((a) => rel.perAxis[a].level === "Limited");
      if (weak.length) limitations.push(`Your readings on ${weak.join(", ")} track the panel loosely \u2014 feedback on those axes is discounted.`);
    }
    if (inp.conflicts.length) limitations.push(`Sources differ on ${inp.conflicts.map((c) => c.on).join(", ")}.`);
    const sci = science.length ? ", with scientific backing" : ", with no direct scientific citation";
    const div = distinctSources >= 3 ? "; convergent across independent sources" : distinctSources <= 1 ? "; from a single source" : "";
    const narrative = `Primarily supported by ${applied || "no directly-applicable"} practitioner principle(s)${domains.length ? ` (${domains.join(", ")})` : ""}${sci}${div}.`;
    return {
      coffee: inp.coffee,
      scientificPrinciples: science,
      expertOpinions: inp.claims.filter((c) => c.kind !== "science"),
      consensus,
      conflicts: inp.conflicts,
      keySupporting: inp.evidenceItems,
      freshness: profile.evidenceFreshness,
      assumptions,
      limitations,
      profile,
      state,
      narrative,
      reviewedCount: inp.claims.length
    };
  }

  // packages/interpret/interpretation-engine.ts
  var altitude = (value) => {
    const match = value?.match(/\d[\d,]*/);
    return match ? Number(match[0].replace(",", "")) : void 0;
  };
  function interpret(observation) {
    const inferences = [];
    const risks = [];
    const roast = observation.coffee.roastLevel?.toLowerCase() ?? "";
    const process = observation.coffee.process?.toLowerCase() ?? "";
    const elevation = altitude(observation.coffee.altitude);
    if (elevation !== void 0 && elevation >= 1700) {
      inferences.push({
        property: "density",
        value: "high",
        confidence: 0.75,
        because: `${observation.coffee.altitude} suggests slower maturation and denser bean structure.`,
        rule: "heuristics#altitude-density"
      });
      inferences.push({
        property: "extractionDifficulty",
        value: "higher",
        confidence: 0.75,
        because: "Dense beans dissolve more slowly, so sweetness needs deliberate extraction energy.",
        rule: "heuristics#altitude-density"
      });
      risks.push({ risk: "under-extraction \u2192 hollow or sour", likelihood: "high", because: "High-grown coffees commonly need more energy to reach sweetness." });
    }
    if (roast.includes("light")) {
      inferences.push({
        property: "solubility",
        value: "low",
        confidence: 0.8,
        because: "Light roasting leaves the bean less porous and harder to dissolve evenly.",
        rule: "heuristics#roast-level"
      });
      inferences.push({
        property: "roastDevelopment",
        value: "light",
        confidence: 0.95,
        because: "Reported roast level is light.",
        rule: "observation#roast-level"
      });
      risks.push({ risk: "under-extraction \u2192 hollow or sour", likelihood: "high", because: "Light roasts generally need more extraction energy before sweetness develops." });
    } else if (roast.includes("dark")) {
      inferences.push({
        property: "solubility",
        value: "high",
        confidence: 0.8,
        because: "Dark roasting makes beans more porous and quick to dissolve.",
        rule: "heuristics#roast-level"
      });
      risks.push({ risk: "over-extraction \u2192 bitter or ashy", likelihood: "high", because: "Dark roasts reach the bitter tail earlier." });
    }
    if (process.includes("washed")) {
      inferences.push({
        property: "acidityStructure",
        value: "clean and articulated",
        confidence: 0.7,
        because: "Washed processing tends to preserve transparent acidity and a higher clarity ceiling.",
        rule: "heuristics#process"
      });
      risks.push({ risk: "astringency from aggressive agitation", likelihood: "moderate", because: "A washed coffee can lose clarity when fines are over-agitated." });
    } else if (process.includes("natural") || process.includes("anaerobic")) {
      inferences.push({
        property: "bodyPotential",
        value: "higher",
        confidence: 0.65,
        because: "Fruit-forward processing commonly contributes more perceived sweetness and body.",
        rule: "heuristics#process"
      });
      risks.push({ risk: "muddiness from excessive agitation", likelihood: "moderate", because: "Heavy agitation can blur a natural or anaerobic coffee." });
    }
    if (observation.setup.waterProfile === void 0 || observation.unknowns.includes("waterProfile")) {
      risks.push({ risk: "water may cap clarity or sweetness", likelihood: "unknown", because: "Water composition is unspecified, so it remains an explicit assumption." });
    }
    return { inferences, risks };
  }

  // packages/engine/orchestrator.ts
  function toClaim(p) {
    const tier = p.confidence >= 0.6 ? "A" : "B";
    return {
      statement: p.statement,
      source: { id: p.evidence.sources[0] ?? p.id, tier },
      tier,
      kind: "competition",
      weight: p.confidence,
      principleId: p.id,
      domain: p.domain,
      independentCount: p.evidence.independentCount
    };
  }
  function topAxes(cup) {
    const order = Object.keys(cup).sort((a, b) => cup[b] - cup[a]);
    return { hi1: order[0], hi2: order[1], lo: order[order.length - 1] };
  }
  async function recommend(o, deps2, ctx) {
    const { principles } = await deps2.memory.retrieve(o);
    const familiarity = deps2.router.score(o, principles);
    const research = deps2.router.needsResearch(familiarity) ? await deps2.research.maybeResearch(o, familiarity) : [];
    const researchClaims = research.flatMap((r) => r.claims);
    const claims = principles.map(toClaim).concat(researchClaims);
    const { decisionInput } = deps2.evidence.synthesise(claims);
    const interpretation = interpret(o);
    const strategy = deps2.makeStrategy(principles).generate({ claims: decisionInput, intent: o.intent, interpretation, observation: o });
    const { evidence, conflicts } = deps2.evidence.synthesise(claims, { appliedIds: strategy.appliedPrincipleIds });
    const sv = deps2.science.validateStrategy(strategy, o);
    const recipe = deps2.recipe.generate(strategy, ctx?.equipment ?? {}, o);
    let rv = deps2.science.validateRecipe(recipe, o);
    if (!rv.ok) {
      const corrected = deps2.science.correctRecipe(recipe, o);
      const correctedVerdict = deps2.science.validateRecipe(corrected, o);
      if (!correctedVerdict.ok) throw new Error(`recipe vetoed: ${correctedVerdict.flags.filter((f) => f.severity === "veto").map((f) => f.message).join("; ")}`);
      recipe.params = corrected.params;
      rv = { ok: true, flags: [...rv.flags, { severity: "warn", message: "Safety correction applied before this recipe was shown." }, ...correctedVerdict.flags] };
    }
    recipe.scienceFlags = [...sv.flags, ...rv.flags];
    const appliedIds = strategy.appliedPrincipleIds ?? [];
    const bundle = buildEvidenceBundle({
      claims,
      appliedIds,
      familiarity,
      conflicts,
      evidenceItems: evidence.items,
      coffee: o.coffee,
      unknowns: o.unknowns,
      scienceFlags: recipe.scienceFlags,
      palate: ctx?.palate
    });
    const t = topAxes(recipe.predictedCup);
    const narrative = {
      judgement: `My read: this coffee wants ${strategy.primary} over ${strategy.tradeoffs[0]?.replace("accept less ", "") ?? "the rest"} \u2014 ${strategy.methodHint ? `use a ${strategy.methodHint.split("\u2014")[0].trim()}` : strategy.extractionTarget.approach}.`,
      strategyLine: `We're optimising ${strategy.primary}${strategy.secondary ? ` and ${strategy.secondary}` : ""} \u2014 ${strategy.extractionTarget.approach}.`,
      evidenceSummary: bundle.narrative,
      tradeoffs: strategy.tradeoffs.length ? `Intentionally giving up: ${strategy.tradeoffs.join("; ")}.` : "No major trade-off here.",
      expectedCup: `Expect a ${t.hi1}, ${t.hi2} cup \u2014 lighter on ${t.lo}.`,
      adjustment: "If it reads hollow or sour, grind a step finer. If it turns bitter or drying, ease the water temperature or coarsen slightly."
    };
    return {
      narrative,
      strategy,
      recipe,
      evidence,
      bundle,
      meta: {
        familiarity,
        researchFired: research.length > 0,
        principlesUsed: appliedIds.map((id) => {
          const p = principles.find((x) => x.id === id);
          return { id, version: p?.version ?? 1 };
        }),
        scienceFlags: recipe.scienceFlags.length,
        state: bundle.state
      }
    };
  }

  // packages/palate/palate-engine.ts
  var AXES = ["sweetness", "clarity", "body", "acidity", "floral", "juiciness"];
  var MIN_SESSIONS = 3;
  var MATURE_SESSIONS = 8;
  var clamp01 = (n) => Math.max(0, Math.min(1, n));
  var mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  function levelOf(r) {
    return r >= 0.8 ? "High" : r >= 0.65 ? "Moderate" : r > 0 ? "Limited" : "None";
  }
  function panelValue(recs, cal, axis) {
    const cs = recs.filter((r) => cal.get(r.taster)?.role === "calibrator");
    if (!cs.length) return null;
    const wsum = cs.reduce((s, r) => s + (cal.get(r.taster).panelWeight || 1), 0);
    return cs.reduce((s, r) => s + r.radar[axis] * (cal.get(r.taster).panelWeight || 1), 0) / wsum;
  }
  function spread(recs, cal, axis) {
    const vs = recs.filter((r) => cal.get(r.taster)?.role === "calibrator").map((r) => r.radar[axis]);
    return vs.length < 2 ? 0 : Math.max(...vs) - Math.min(...vs);
  }
  function computeReliability(sessions, owner, cal) {
    const perAxis = {};
    const admissible = sessions.filter((s) => s.blind === true);
    for (const axis of AXES) {
      const errs = [];
      const biases = [];
      const spreads = [];
      for (const s of admissible) {
        const own = s.records.find((r) => r.taster === owner);
        const ref = panelValue(s.records, cal, axis);
        if (!own || ref === null) continue;
        const sp = spread(s.records, cal, axis);
        const raw = own.radar[axis] - ref;
        const adj = Math.max(0, Math.abs(raw) - sp / 2);
        errs.push(adj);
        biases.push(raw);
        spreads.push(sp);
      }
      const n = errs.length;
      const reliability = n ? clamp01(1 - mean(errs)) : 0;
      perAxis[axis] = {
        reliability: n ? Number(reliability.toFixed(3)) : 0,
        bias: n ? Number(mean(biases).toFixed(3)) : 0,
        panelSpread: n ? Number(mean(spreads).toFixed(3)) : 0,
        n,
        level: n >= MIN_SESSIONS ? levelOf(reliability) : "None"
      };
    }
    const sessionCount = admissible.length;
    const maturity = clamp01(sessionCount / MATURE_SESSIONS);
    const overall = Number(mean(AXES.map((a) => perAxis[a].reliability)).toFixed(3));
    const level = sessionCount < MIN_SESSIONS ? "None" : levelOf(overall * (0.7 + 0.3 * maturity));
    return { perAxis, overall, sessions: sessionCount, maturity: Number(maturity.toFixed(2)), level };
  }
  function computeLexicon(sessions, owner, cal) {
    const pair = /* @__PURE__ */ new Map();
    const ownTotal = /* @__PURE__ */ new Map();
    for (const s of sessions.filter((x) => x.blind === true)) {
      const own = s.records.find((r) => r.taster === owner);
      if (!own) continue;
      const panelTerms = new Set(
        s.records.filter((r) => cal.get(r.taster)?.role === "calibrator").flatMap((r) => r.descriptors.map((d) => d.toLowerCase().trim()))
      );
      for (const ut of new Set(own.descriptors.map((d) => d.toLowerCase().trim()))) {
        ownTotal.set(ut, (ownTotal.get(ut) ?? 0) + 1);
        if (panelTerms.has(ut)) continue;
        for (const pt of panelTerms) pair.set(`${ut}|${pt}`, (pair.get(`${ut}|${pt}`) ?? 0) + 1);
      }
    }
    const out = [];
    for (const [k, count] of pair) {
      const [userTerm, panelTerm] = k.split("|");
      if (count < 2) continue;
      const confidence = clamp01(count / (ownTotal.get(userTerm) || count));
      if (confidence < 0.6) continue;
      out.push({ userTerm, panelTerm, count, confidence: Number(confidence.toFixed(2)) });
    }
    const best = /* @__PURE__ */ new Map();
    for (const m of out.sort((a, b) => b.confidence - a.confidence || b.count - a.count)) {
      if (!best.has(m.userTerm)) best.set(m.userTerm, m);
    }
    return [...best.values()];
  }
  function createPalateEngine() {
    return {
      calibrate(sessions, owner, calibrators) {
        const map = new Map(calibrators.map((c) => [c.id, c]));
        return {
          owner,
          calibrators,
          sessions,
          reliability: computeReliability(sessions, owner, map),
          lexicon: computeLexicon(sessions, owner, map)
        };
      },
      translate(descriptors, cal) {
        const used = [];
        const terms = descriptors.map((d) => {
          const hit = cal.lexicon.find((m) => m.userTerm === d.toLowerCase().trim());
          if (hit) {
            used.push(hit);
            return hit.panelTerm;
          }
          return d;
        });
        return { terms, used };
      },
      resolve(outcome, cal) {
        const map = new Map(cal.calibrators.map((c) => [c.id, c]));
        const radar = { ...outcome.observed };
        const overridden = [];
        const notes = [];
        const panelPresent = (outcome.panel ?? []).some((r) => map.get(r.taster)?.role === "calibrator");
        for (const axis of AXES) {
          const stats = cal.reliability.perAxis[axis];
          if (panelPresent) {
            const ref = panelValue(outcome.panel, map, axis);
            if (ref !== null) {
              if (Math.abs(ref - outcome.observed[axis]) > 0.15) overridden.push(axis);
              radar[axis] = ref;
            }
          } else if (stats && stats.n >= MIN_SESSIONS && Math.abs(stats.bias) >= 0.08) {
            radar[axis] = clamp01(outcome.observed[axis] - stats.bias * cal.reliability.maturity);
          }
        }
        if (panelPresent) {
          notes.push(overridden.length ? `Calibrator present \u2014 their read overrode yours on ${overridden.join(", ")}; your reading logged for calibration.` : "Calibrator present and your read agreed across the board.");
        } else if (cal.reliability.sessions < MIN_SESSIONS) {
          notes.push(`Palate not yet calibrated (${cal.reliability.sessions}/${MIN_SESSIONS} blind sessions) \u2014 diagnosis treats your notes at face value.`);
        } else {
          const corrected = AXES.filter((a) => Math.abs(cal.reliability.perAxis[a].bias) >= 0.08);
          notes.push(corrected.length ? `Bias-corrected against panel on ${corrected.join(", ")} (calibration maturity ${Math.round(cal.reliability.maturity * 100)}%).` : "Your palate tracks the panel closely \u2014 no correction needed.");
        }
        const { terms, used } = this.translate(outcome.descriptors ?? outcome.notes ?? [], cal);
        if (used.length) notes.push(`Translated: ${used.map((m) => `"${m.userTerm}" \u2192 ${m.panelTerm}`).join(", ")}.`);
        const sensoryConfidence = panelPresent ? "High" : cal.reliability.sessions < MIN_SESSIONS ? "None" : levelOf(cal.reliability.overall * (0.7 + 0.3 * cal.reliability.maturity));
        return { radar, descriptors: terms, sensoryConfidence, note: notes.join(" "), overridden, used };
      }
    };
  }

  // packages/diagnosis/diagnosis-engine.ts
  var has2 = (s, ...w) => w.some((x) => s.includes(x));
  function createDiagnosisEngine() {
    return {
      diagnose(expected, outcome, s, cal) {
        let sensoryConfidence;
        let calibrationNote;
        let translated;
        let obs = outcome.observed;
        let noteTerms = outcome.descriptors ?? outcome.notes ?? [];
        if (cal) {
          const r = createPalateEngine().resolve(outcome, cal);
          obs = r.radar;
          noteTerms = r.descriptors;
          sensoryConfidence = r.sensoryConfidence;
          calibrationNote = r.note;
          translated = r.used;
        }
        const notes = noteTerms.join(" ").toLowerCase();
        const gap = (a) => (obs[a] ?? expected[a]) - expected[a];
        let cause = "", because = "";
        const adjustments = [];
        const loop = s.id;
        if (has2(notes, "bitter", "harsh", "ashy")) {
          cause = "over-extraction";
          because = "the bitter, drying compounds dissolve last \u2014 you've gone past sweetness into the harsh tail.";
          adjustments.push({ lever: "grind", move: "grind 1\u20132 steps coarser", loopsTo: loop });
          adjustments.push({ lever: "temp", move: "drop water 1\u20132\xB0C", loopsTo: loop });
        } else if (has2(notes, "astringent", "drying")) {
          cause = "over-agitation (fines)";
          because = "too much agitation or too many fines pulls a drying, astringent edge.";
          adjustments.push({ lever: "agitation", move: "pour more gently, fewer agitations", loopsTo: loop });
          adjustments.push({ lever: "grind", move: "a touch coarser", loopsTo: loop });
        } else if (has2(notes, "muddy", "unclear", "silty") || gap("clarity") < -0.2) {
          cause = "unclear extraction (fines / uneven bed)";
          because = "fines and an uneven bed blur flavour separation.";
          adjustments.push({ lever: "grind", move: "grind slightly coarser", loopsTo: loop });
          adjustments.push({ lever: "pour", move: "steadier, centred pours", loopsTo: loop });
        } else if (has2(notes, "sour", "sharp", "hollow", "empty", "thin") || gap("sweetness") < -0.15) {
          cause = "under-extraction";
          because = "the sweetness hasn't developed yet \u2014 that hollow/sour edge means you stopped short of the mid-curve.";
          adjustments.push({ lever: "grind", move: "grind 1\u20132 steps finer", loopsTo: loop });
          adjustments.push({ lever: "temp", move: "nudge water +1\u20132\xB0C", loopsTo: loop });
        } else if (has2(notes, "weak", "watery")) {
          cause = "low strength (fine, but dilute)";
          because = "extraction is roughly right; the cup is just thin \u2014 concentration, not extraction.";
          adjustments.push({ lever: "ratio", move: "tighten the ratio (a little less water)", loopsTo: loop });
        } else if (has2(notes, "flat", "dull", "lifeless")) {
          cause = "muted (water or stale coffee)";
          because = "flatness usually points to over-buffered water or aged coffee, not technique.";
          adjustments.push({ lever: "water", move: "try lower-alkalinity water; check roast age", loopsTo: loop });
        } else {
          cause = "on target";
          because = "the cup matched the plan \u2014 no correction needed. Lock this in.";
        }
        if (sensoryConfidence === "None" || sensoryConfidence === "Limited") {
          if (adjustments.length > 1) adjustments.length = 1;
          because += sensoryConfidence === "None" ? " Treat this as provisional \u2014 your palate is not yet calibrated against the panel." : " Your palate tracks the panel loosely on this kind of cup, so this is a probe, not a verdict.";
        }
        return { cause, because, adjustments, sensoryConfidence, calibrationNote, translated };
      }
    };
  }

  // packages/learning/learning-engine.ts
  function createLearningEngine() {
    return {
      apply(d, _outcome) {
        const grindAdj = d.adjustments.find((a) => a.lever === "grind");
        if (grindAdj && d.cause === "under-extraction") {
          return { scope: "equipment", note: "Your setup ran a little coarse for this \u2014 starting finer next time.", data: { grindBias: "finer" } };
        }
        if (grindAdj && (d.cause === "over-extraction" || d.cause.startsWith("unclear"))) {
          return { scope: "equipment", note: "Your setup ran a little fine for this \u2014 starting coarser next time.", data: { grindBias: "coarser" } };
        }
        if (d.cause === "on target") {
          return { scope: "user", note: "Logged as a cup you liked \u2014 this becomes reference for next time.", data: {} };
        }
        return { scope: "user", note: `Noted: ${d.cause}. One more brew will confirm the pattern before I adjust.`, data: {} };
      }
    };
  }

  // services/web/entry.ts
  var deps = composeEngineStatic(principles_default);
  var diagnosisEngine = createDiagnosisEngine();
  var learningEngine = createLearningEngine();
  var session = { equipment: {} };
  function buildObservation(input) {
    return {
      coffee: input.coffee,
      setup: input.setup ?? {},
      intent: input.intent,
      unknowns: input.unknowns ?? [],
      fingerprint: input.fingerprint ?? `${input.coffee.origin ?? ""}-${input.coffee.process ?? ""}-${input.coffee.roastLevel ?? ""}`.toLowerCase()
    };
  }
  globalThis.BrewEngine = {
    async recommend(input) {
      const r = await recommend(buildObservation(input), deps, { equipment: session.equipment });
      session.last = r;
      return r;
    },
    diagnose(observed, notes) {
      if (!session.last) return null;
      const outcome = { recipeRef: session.last.strategy.id, observed, notes };
      return diagnosisEngine.diagnose(session.last.recipe.predictedCup, outcome, session.last.strategy);
    },
    applyLearning(d) {
      const update = learningEngine.apply(d, { recipeRef: "", observed: {}, notes: [] });
      if (update.scope === "equipment" && update.data && update.data.grindBias) {
        session.equipment.calibration = { ...session.equipment.calibration ?? {}, grindBias: update.data.grindBias };
      }
      return update;
    },
    predictedCup: () => session.last?.recipe.predictedCup ?? null,
    equipment: () => session.equipment,
    principleCount: principles_default.length
  };
})();
