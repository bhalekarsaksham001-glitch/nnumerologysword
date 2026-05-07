// Pure Pythagorean numerology calculator.
// Deterministic — every output traces to a calculation or a fixed
// interpretation entry in the database below. No AI, no guessing.

export type Gender = "Male" | "Female" | "Other";

export interface ReadingInput {
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  currentYear?: number;
}

// ─────────────────────────────────────────────────────────────
// Pythagorean chart
// ─────────────────────────────────────────────────────────────
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const MASTER = new Set([11, 22, 33]);
const KARMIC = new Set([13, 14, 16, 19]);

function digitSum(n: number): number {
  return String(Math.abs(n)).split("").reduce((a, c) => a + Number(c), 0);
}
function reduceMaster(n: number): number {
  let x = n;
  while (x > 9 && !MASTER.has(x)) x = digitSum(x);
  return x;
}
function reduceWithKarmic(n: number): { value: number; karmic?: number } {
  let x = n;
  let karmic: number | undefined;
  while (x > 9 && !MASTER.has(x)) {
    if (KARMIC.has(x)) karmic = x;
    x = digitSum(x);
  }
  return { value: x, karmic };
}

function classifyLetters(fullName: string) {
  const words = fullName.toUpperCase().split(/\s+/).filter(Boolean);
  const out: Array<{ ch: string; val: number; isVowel: boolean; word: string }> = [];
  for (const word of words) {
    const cleanWord = word.replace(/[^A-Z]/g, "");
    const hasRegularVowel = /[AEIOU]/.test(cleanWord);
    for (const ch of cleanWord) {
      const val = LETTER_VALUES[ch];
      if (val == null) continue;
      let isVowel = VOWELS.has(ch);
      if (ch === "Y") isVowel = !hasRegularVowel;
      out.push({ ch, val, isVowel, word: cleanWord });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Calculations
// ─────────────────────────────────────────────────────────────
export interface NumValue { value: number; karmic?: number; calc: string }

function calcLifePath(dob: string): NumValue {
  const [y, m, d] = dob.split("-").map(Number);
  const dayR = reduceMaster(d), monR = reduceMaster(m), yearR = reduceMaster(y);
  const sum = dayR + monR + yearR;
  const r = reduceWithKarmic(sum);
  const calc = `Day ${d} → ${dayR}, Month ${m} → ${monR}, Year ${y} → ${yearR}. ${dayR}+${monR}+${yearR} = ${sum}${r.karmic ? ` → Karmic Debt ${r.karmic}/${r.value}` : sum !== r.value ? ` → ${r.value}` : ""}`;
  return { value: r.value, karmic: r.karmic, calc };
}

function wordBreakdown(letters: ReturnType<typeof classifyLetters>, filter: (l: { isVowel: boolean }) => boolean) {
  const byWord = new Map<string, Array<{ ch: string; val: number }>>();
  for (const l of letters) {
    if (!filter(l)) continue;
    if (!byWord.has(l.word)) byWord.set(l.word, []);
    byWord.get(l.word)!.push({ ch: l.ch, val: l.val });
  }
  const rows: Array<{ word: string; expr: string; sum: number; reduced: number; master?: number }> = [];
  let total = 0;
  for (const [word, items] of byWord) {
    const sum = items.reduce((a, b) => a + b.val, 0);
    const reduced = reduceMaster(sum);
    rows.push({
      word,
      expr: items.map((i) => `${i.ch}(${i.val})`).join("+"),
      sum,
      reduced,
      master: MASTER.has(sum) ? sum : undefined,
    });
    total += reduced;
  }
  return { rows, total };
}

function calcFromBreakdown(letters: ReturnType<typeof classifyLetters>, filter: (l: { isVowel: boolean }) => boolean, label: string): NumValue & { rows: ReturnType<typeof wordBreakdown>["rows"] } {
  const { rows, total } = wordBreakdown(letters, filter);
  const r = reduceWithKarmic(total);
  const sumExpr = rows.map((x) => x.reduced).join(" + ");
  const calc = `${label}: ${sumExpr} = ${total}${r.karmic ? ` → Karmic Debt ${r.karmic}/${r.value}` : total !== r.value ? ` → ${r.value}` : ""}`;
  return { value: r.value, karmic: r.karmic, calc, rows };
}

function calcBirthday(dob: string): NumValue {
  const d = Number(dob.split("-")[2]);
  const isKarmic = KARMIC.has(d);
  const value = MASTER.has(d) ? d : reduceMaster(d);
  return {
    value,
    karmic: isKarmic ? d : undefined,
    calc: `Born on the ${d}${d !== value ? `th → ${String(d).split("").join("+")} = ${value}` : "th"}${isKarmic ? ` (Karmic Debt ${d} active)` : ""}`,
  };
}

function calcMaturity(lp: number, dest: number): NumValue {
  const sum = lp + dest;
  const value = reduceMaster(sum);
  return { value, calc: `Life Path (${lp}) + Destiny (${dest}) = ${sum}${sum !== value ? ` → ${value}` : ""}` };
}

function calcPersonalYear(dob: string, currentYear: number) {
  const [, m, d] = dob.split("-").map(Number);
  const dayR = reduceMaster(d), monR = reduceMaster(m), yearR = reduceMaster(currentYear);
  const sum = dayR + monR + yearR;
  const value = reduceMaster(sum);
  return {
    value, year: currentYear,
    calc: `Birth Month (${m}→${monR}) + Birth Day (${d}→${dayR}) + ${currentYear} (→${yearR}) = ${monR}+${dayR}+${yearR} = ${sum}${sum !== value ? ` → ${value}` : ""}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Rich interpretation database
// ─────────────────────────────────────────────────────────────
interface NumberProfile {
  title: string;            // e.g. "The Creative Communicator"
  essence: string;          // who you are at core
  purpose: string;          // life purpose / repeating themes
  strengths: string[];      // 5–7 bullets
  weaknesses: string[];     // 3–5 bullets
  love: string;             // love/friendship/family
  partnerGood: string[];
  partnerRisky: string[];
  careerSuits: string[];
  careerAvoid: string[];
  mental: string;           // stress / failure / conflict
}

const N: Record<number, NumberProfile> = {
  1: {
    title: "The Independent Pioneer",
    essence: "You are wired to lead, not follow. There is a quiet fire in you that refuses to be told what to think. You think originally, move decisively, and feel most alive when you are the one carving the path.",
    purpose: "To become a confident original — to build something that bears your own signature and to teach others, by example, what self-trust looks like.",
    strengths: [
      "Strong willpower — you can push through what breaks others",
      "Original thinking — you see angles others miss",
      "Natural leadership — people instinctively look to you for direction",
      "Self-reliance — you can build alone when needed",
      "Courage under pressure — you act while others freeze",
      "High drive and ambition — you set the tempo",
    ],
    weaknesses: [
      "Stubbornness — you mistake being right for being effective",
      "Ego inflation — quick to take credit, slow to share it",
      "Impatience with slower people — burns relationships",
      "Loneliness from over-independence",
    ],
    love: "You are loyal but headstrong. You love deeply but on your own terms — and you will resent any partner who tries to mould you. With family and friends, you protect fiercely but show affection through action, not words.",
    partnerGood: [
      "Partners with their own ambition and inner world",
      "Someone who can challenge you without trying to control you",
      "People with 3, 5 or 6 energy — they soften without diluting",
    ],
    partnerRisky: [
      "Two 1s competing for dominance",
      "8s — both want the throne",
      "Highly dependent partners who drain your fuel",
    ],
    careerSuits: ["Founder / entrepreneur", "Executive leadership", "Inventor, designer, original creator", "Politics, military, command roles"],
    careerAvoid: ["Pure follower roles", "Group-by-committee bureaucracies", "Anything that punishes initiative"],
    mental: "Under stress you push harder instead of pausing. After failure you blame yourself privately and double down publicly. In conflict you go direct and firm — sometimes too firm.",
  },
  2: {
    title: "The Diplomat",
    essence: "You are sensitive, tuned-in, and built for connection. You feel the room before you read it. Your gift is harmony — you can hold space for opposites and find the bridge.",
    purpose: "To master partnership and patience — to lead through cooperation, not force, and to learn that your softness is strategic strength.",
    strengths: [
      "Deep emotional intelligence",
      "Natural mediator and peacemaker",
      "Patience that outlasts most people",
      "Strong intuition — you 'just know' things",
      "Loyalty that builds long, deep bonds",
      "Quiet influence — you shape outcomes without needing the spotlight",
    ],
    weaknesses: [
      "Over-sensitivity — you take things personally that weren't",
      "Indecision when the cost is yours alone",
      "People-pleasing that erodes your own boundaries",
      "Avoiding conflict until it explodes",
    ],
    love: "You love deeply and need reassurance. You can lose yourself in a partner if you don't keep a separate centre. In friendship you are the safe one; in family you often hold everyone together quietly.",
    partnerGood: ["Steady, kind 4 or 6 energy", "Someone who values emotional depth", "Partners who reciprocate effort"],
    partnerRisky: ["Cold or dismissive personalities", "5s who treat commitment as a cage", "Partners who confuse your kindness for weakness"],
    careerSuits: ["Counselling, therapy, HR", "Mediation, diplomacy, negotiation", "Music, design, supportive creative work", "Healthcare and care professions"],
    careerAvoid: ["High-aggression sales floors", "Cut-throat competitive environments", "Roles with no human contact"],
    mental: "Under stress you absorb others' emotions and forget your own. After failure you over-apologise. In conflict you tend to retreat first, then resent later — name it earlier.",
  },
  3: {
    title: "The Creative Communicator",
    essence: "You radiate warmth, wit, and creative energy. You can charm a room without trying. Words come naturally — whether spoken, written, or shaped into ideas — and people are drawn to your brightness.",
    purpose: "To express. Every year you stay silent about your ideas, creativity, or truth, something in you quietly dims. Your purpose is to communicate meaning in a way that lifts others.",
    strengths: [
      "Natural communicator — you make complex things simple",
      "Creative intelligence — inventive, not just artistic",
      "Magnetic social presence — people want to be near your energy",
      "Optimism that survives setbacks",
      "Quick learner — you absorb through expression",
      "Storyteller's memory for people and detail",
      "Resilient cheer — you can lift a room you're losing in",
    ],
    weaknesses: [
      "Scattered energy — brilliant at ten things, master of none",
      "Avoids depth when feelings get heavy",
      "Overshares to manage anxiety",
      "Procrastinates by 'preparing' instead of finishing",
      "Sensitive to criticism more than you let on",
    ],
    love: "You are warm and playful on the surface. You long for connection but can confuse intellectual closeness with emotional intimacy. In friendship you have many acquaintances and a small handful who truly know you. In family you carry the mood — for better and worse.",
    partnerGood: ["Curious, expressive partners who can keep up with you", "People who make you laugh AND make you think", "Partners with 1, 5, or 7 energy"],
    partnerRisky: ["Critical partners who shrink your voice", "People who need constant emotional caretaking from you", "Anyone who treats your joy as immaturity"],
    careerSuits: ["Writing, content, media, marketing", "Speaking, teaching, performing", "Design and creative direction", "Anything that pays you to think and express"],
    careerAvoid: ["Repetitive routine work with no creative input", "Roles that punish self-expression", "Pure backroom data entry"],
    mental: "Under stress you go quiet then over-talk to discharge. After failure you reframe quickly — sometimes too quickly, before truly feeling it. In conflict you joke first; if pushed, you cut sharp with words.",
  },
  4: {
    title: "The Builder",
    essence: "You are the one who actually finishes things. Disciplined, loyal, grounded — when others promise, you deliver. You build slowly, but what you build lasts.",
    purpose: "To build foundations — careers, families, systems, legacies — that outlive the moment. Your life is a long, deliberate construction project.",
    strengths: [
      "Discipline and follow-through",
      "Practical problem-solving",
      "Loyal to a fault",
      "Reliable under pressure",
      "Strong work ethic — you outlast most",
      "Organised mind that can hold complex systems",
    ],
    weaknesses: [
      "Rigidity — you mistake routine for safety",
      "Slow to forgive change you didn't choose",
      "Workaholism that quietly costs relationships",
      "Stubbornness disguised as 'being principled'",
    ],
    love: "You love through stability and provision. You don't say it loudly — you show it by being there, every day, no matter what. You need a partner who can read steadiness as love.",
    partnerGood: ["2 or 6 energy — they bring softness and warmth", "Partners who value building a life together", "Calm, consistent personalities"],
    partnerRisky: ["Highly chaotic 5s", "Partners who need constant novelty", "People who confuse your steadiness for boredom"],
    careerSuits: ["Engineering, architecture, construction", "Finance, accounting, operations", "Law, project management", "Skilled trades and craftsmanship"],
    careerAvoid: ["Highly improvisational creative chaos", "Roles with no structure or measurable output"],
    mental: "Under stress you grip tighter and work more. After failure you rebuild silently. In conflict you go cold and immovable — practise softening, not surrendering.",
  },
  5: {
    title: "The Catalyst",
    essence: "You are built for change. Curious, magnetic, restless — freedom is not optional for you, it is oxygen. You are meant to taste a wide range of life and translate that experience into wisdom.",
    purpose: "To experience life in full range — and to use what you learn to wake others up. You are a catalyst: things move because you arrive.",
    strengths: [
      "Adaptable — you thrive in change that breaks others",
      "Magnetic charm and quick rapport",
      "Versatile skill set — you can do many things well",
      "Courageous risk-taker",
      "Sharp instincts in fast-moving situations",
      "Resilience through reinvention",
    ],
    weaknesses: [
      "Restlessness that abandons good things prematurely",
      "Overindulgence — food, spending, relationships, stimulation",
      "Commitment-phobia dressed up as 'keeping options open'",
      "Scattered focus — many starts, few finishes",
      "Impulsive decisions you later have to clean up",
    ],
    love: "You are exciting to be with but quick to feel caged. You need a partner who has their own world. In friendship you are the one who knows everyone; in family you may have always felt slightly different.",
    partnerGood: ["Independent, secure partners", "1 or 7 energy — they don't try to tame you", "People who travel, learn, change with you"],
    partnerRisky: ["Highly possessive partners", "Two restless 5s burning each other out", "Anyone who confuses freedom with neglect"],
    careerSuits: ["Sales, marketing, media", "Travel, hospitality, journalism", "Entrepreneurship and consulting", "Anything with variety and autonomy"],
    careerAvoid: ["Cubicle routine without movement", "Heavy bureaucracy", "Roles with no chance to influence outcomes"],
    mental: "Under stress you escape — into stimulation, novelty, distraction. After failure you move on too fast and miss the lesson. In conflict you may walk away physically before you've worked it out emotionally.",
  },
  6: {
    title: "The Nurturer",
    essence: "You are the protector. Responsible, caring, deeply tuned to family, beauty and harmony. You feel responsible for the wellbeing of the people around you — sometimes more than you should.",
    purpose: "To love, protect and heal — without losing yourself in the role. To learn that self-care is part of the service, not the opposite of it.",
    strengths: [
      "Deeply responsible and trustworthy",
      "Natural caregiver and healer",
      "Strong sense of beauty and home",
      "Loyal in love and friendship",
      "Mediator who restores harmony",
      "Patient teacher and mentor",
    ],
    weaknesses: [
      "Self-sacrificing to the point of resentment",
      "Controlling 'for their own good'",
      "Difficulty receiving help",
      "Martyr narrative when unappreciated",
    ],
    love: "You are the most marriage-oriented number. Devoted, protective, sometimes smothering. You need a partner who appreciates and matches your effort — anything less drains you.",
    partnerGood: ["2 or 4 energy", "Grateful, present partners", "Someone who shares responsibility, not just receives it"],
    partnerRisky: ["Takers who weaponise your kindness", "5s who resist commitment", "Highly self-absorbed personalities"],
    careerSuits: ["Medicine, nursing, teaching", "Counselling, social work", "Interior design, hospitality, culinary arts", "Family law, paediatrics"],
    careerAvoid: ["Coldly transactional environments", "Roles that require regularly hurting people"],
    mental: "Under stress you take on more, not less. After failure you blame yourself for everyone affected. In conflict you over-explain to repair — practise saying less and waiting longer.",
  },
  7: {
    title: "The Seeker",
    essence: "You are the analyst, the mystic, the quiet observer. You crave silence. You hunger for truth — not surface-level answers but understanding that cuts to the bone. You have a rich inner world almost no one truly sees.",
    purpose: "To pursue truth — intellectual, spiritual, scientific — and to bring back what you learn for others. Your solitude is a workshop, not an exile.",
    strengths: [
      "Deep analytical mind — you see through things",
      "Strong intuition combined with logic",
      "Quiet magnetism — people find you intriguing",
      "Independence — you do not need crowd approval",
      "Patient, focused researcher",
      "Spiritual depth without needing to perform it",
    ],
    weaknesses: [
      "Emotional avoidance — you intellectualise feelings",
      "Isolation that tips into loneliness",
      "Cynicism when disappointed",
      "Over-secrecy that confuses people who love you",
      "Perfectionism that delays sharing your work",
    ],
    love: "You are hard to reach emotionally. You long for soul-deep connection, then retreat when someone gets close. You need someone who respects your space without taking it personally.",
    partnerGood: ["Intellectually curious partners with their own depth", "5 or 7 energy", "People who can sit in silence with you"],
    partnerRisky: ["Highly demanding emotional partners", "Surface-level personalities", "Anyone who needs constant verbal reassurance"],
    careerSuits: ["Research, science, data, philosophy", "Writing, analysis, strategy", "Spirituality, psychology, investigation", "Specialist technical roles"],
    careerAvoid: ["High-volume social sales", "Shallow content factories", "Roles with no thinking time"],
    mental: "Under stress you withdraw and overthink in silence. After failure you analyse it obsessively and shame yourself privately. In conflict you go quiet and cold — practise speaking before you've solved it perfectly in your head.",
  },
  8: {
    title: "The Power Builder",
    essence: "You are built for authority — money, leadership, structure, scale. You think in systems and outcomes. You are not afraid of power; you are afraid of wasting it.",
    purpose: "To master the material world without losing your soul to it. To build wealth, authority and impact, then use them with integrity.",
    strengths: [
      "Strategic, big-picture mind",
      "Strong drive and resilience",
      "Natural authority — people follow your decisions",
      "Financial intelligence",
      "Comfort with risk and responsibility",
      "Ability to recover from major loss",
    ],
    weaknesses: [
      "Workaholism that costs relationships",
      "Materialism — measuring self by net worth",
      "Controlling tendencies",
      "Ruthlessness when threatened",
    ],
    love: "When committed, you are loyal and protective. But work can quietly eat the relationship if you don't guard your time. You need a partner who respects ambition and won't compete for it.",
    partnerGood: ["2, 4 or 6 energy", "Partners who value your ambition AND demand your presence", "Emotionally secure people"],
    partnerRisky: ["Two 8s in a power struggle", "Partners who want you small", "People who only love the lifestyle"],
    careerSuits: ["Business, finance, real estate", "Executive leadership, law", "Large-scale operations and strategy", "Anything that scales"],
    careerAvoid: ["Pure follower roles with no upside", "Highly artistic ventures with no business case", "Environments that punish ambition"],
    mental: "Under stress you work harder and isolate. After failure you rebuild bigger — but skip the grief. In conflict you go strategic and direct; remember relationships aren't deals.",
  },
  9: {
    title: "The Old Soul",
    essence: "You are wise, compassionate, and old in the soul. You feel for the world. You carry an instinct for justice and a creative depth that wants to serve something larger than yourself.",
    purpose: "To serve, to create, to release. Your life is shaped by endings and renewals. You are here to give — and to learn that giving without boundaries is not generosity, it is depletion.",
    strengths: [
      "Deep compassion and empathy",
      "Creative and artistic depth",
      "Wisdom beyond your age",
      "Generosity that uplifts others",
      "Idealism that inspires people",
      "Ability to see the big picture and the human cost",
    ],
    weaknesses: [
      "Difficulty letting go of people and chapters",
      "Martyr tendency — over-giving until empty",
      "Bitterness when goodness goes unrewarded",
      "Avoidance of personal needs in service of bigger causes",
    ],
    love: "You love deeply, romantically, almost cinematically. You can attract takers because you give so freely. Learn to recognise reciprocity early.",
    partnerGood: ["3, 6 or 9 energy", "Mature partners who can match your depth", "Someone with their own purpose"],
    partnerRisky: ["Emotionally unavailable people", "Partners who treat your generosity as the baseline", "Highly materialistic personalities"],
    careerSuits: ["Humanitarian work, NGOs, advocacy", "Arts, film, writing, philosophy", "Healing, teaching, counselling", "Global or cross-cultural work"],
    careerAvoid: ["Soul-less corporate roles", "Work that conflicts with your values"],
    mental: "Under stress you carry everyone's weight silently. After failure you spiritualise too quickly and skip the anger. In conflict you withdraw into 'understanding' — sometimes you need to fight for yourself first.",
  },
  11: {
    title: "The Intuitive (Master Number)",
    essence: "You are a 2 amplified into vision. Highly intuitive, sensitive, often picking up signals long before others. You are here to inspire — and your nervous system pays the price for the antenna you carry.",
    purpose: "To translate intuition and inspiration into something the world can use — teaching, art, leadership, healing.",
    strengths: ["Powerful intuition", "Visionary thinking", "Inspiring presence", "Deep spiritual sensitivity", "Empathy that moves people", "Creative originality"],
    weaknesses: ["Anxiety and nervous overload", "Self-doubt that delays your gifts", "Impracticality without grounding", "Burnout from over-feeling"],
    love: "You need a grounded, kind partner who respects your sensitivity instead of mocking it. Avoid relationships that constantly destabilise you.",
    partnerGood: ["Stable 4 or 6 energy", "Partners who calm your system", "People who believe in your vision"],
    partnerRisky: ["Chaotic, unpredictable partners", "Cynics who dismiss intuition", "People who drain your energy"],
    careerSuits: ["Teaching, coaching, counselling", "Spiritual or visionary work", "Art, music, writing", "Inspirational leadership"],
    careerAvoid: ["Hyper-aggressive corporate floors", "Soul-numbing routine"],
    mental: "Under stress your nervous system spikes — protect it. After failure you spiral into self-doubt; ground in routine. In conflict you absorb too much; step back before responding.",
  },
  22: {
    title: "The Master Builder (Master Number)",
    essence: "You carry rare power: the vision of an 11 fused with the discipline of a 4. You can build things that change systems, communities, even industries — if you don't run from the size of your own potential.",
    purpose: "To build something big, real and useful. Your life is meant to leave structures behind — businesses, institutions, movements, works.",
    strengths: ["Visionary AND practical", "Capacity for very large projects", "Resilience under enormous load", "Strategic mind", "Inspires teams", "Disciplined creativity"],
    weaknesses: ["Crushed by the weight of your own potential", "Self-doubt at the threshold of big leaps", "Workaholism", "Difficulty delegating"],
    love: "You need a steady partner who supports the mission without competing with it. Beware of partners who feel threatened by your scale.",
    partnerGood: ["Grounded, supportive partners", "People who share long-term vision", "Calm 4 or 6 energy"],
    partnerRisky: ["Partners who demand you stay small", "Highly chaotic personalities"],
    careerSuits: ["Architecture, large-scale building", "Founding businesses or institutions", "Global initiatives", "Engineering at scale"],
    careerAvoid: ["Roles with no room to build"],
    mental: "Under stress you over-function. After failure you go quiet and rebuild without telling anyone. In conflict you keep moving — practise pausing.",
  },
  33: {
    title: "The Master Teacher (Master Number)",
    essence: "Pure compassion in human form. You are here to teach, heal and uplift on a wide scale. The cost is real — selfless service can become self-erasure if you're not careful.",
    purpose: "To teach by living example. Your life will keep placing you in positions where you have to choose: serve from fullness, or burn out trying to save everyone.",
    strengths: ["Profound compassion", "Healing presence", "Inspirational teacher", "Sees the divine in people", "Patient mentor", "Creative wisdom"],
    weaknesses: ["Martyrdom", "Burden of constant responsibility", "Neglecting personal needs", "Difficulty saying no"],
    love: "Selfless love is your gift and your trap. Choose partners who give back, not just receive.",
    partnerGood: ["Generous, mature partners", "People with strong personal centre", "6 or 9 energy"],
    partnerRisky: ["Highly needy or extractive partners"],
    careerSuits: ["Teaching, healing, ministry", "Humanitarian leadership", "Therapy, counselling", "Creative work that uplifts"],
    careerAvoid: ["Roles that require harming people"],
    mental: "Under stress you over-give. After failure you carry guilt for those you couldn't save. In conflict you absorb — protect your boundaries fiercely.",
  },
};

const KARMIC_PROFILES: Record<number, { title: string; lesson: string; pattern: string; trap: string; breakthrough: string }> = {
  13: {
    title: "Karmic Debt 13/4 — Laziness & Burden",
    lesson: "Discipline. Hard work. No shortcuts. Build properly.",
    pattern: "Life keeps collapsing structures you tried to take a shortcut through, until you build them right.",
    trap: "Resenting the workload and looking for the back door.",
    breakthrough: "Extraordinary endurance and lasting legacy when you accept the slow build.",
  },
  14: {
    title: "Karmic Debt 14/5 — Abuse of Freedom",
    lesson: "Earn freedom through responsibility. Control excess.",
    pattern: "Cycles of overindulgence and chaos until you put your freedom in service of something.",
    trap: "Mistaking impulse for liberty.",
    breakthrough: "True freedom — chosen, focused, powerful.",
  },
  16: {
    title: "Karmic Debt 16/7 — Ego & Destruction",
    lesson: "Surrender ego. The tower must fall before the temple can be built.",
    pattern: "Sudden collapses — relationships, plans, identities — to clear space for what is genuinely yours. Each collapse is your soul's curriculum.",
    trap: "Clinging to what is collapsing out of fear.",
    breakthrough: "Hard-earned spiritual wisdom and a self that is finally true, not borrowed.",
  },
  19: {
    title: "Karmic Debt 19/1 — Misuse of Power / Lone Wolf",
    lesson: "Lead with service. Strength includes vulnerability. Independence is completed by interdependence.",
    pattern: "Life keeps placing you in situations where you must accept help, collaboration or support. The more you resist, the harder it bites.",
    trap: "Pride dressed as strength. Doing it all alone.",
    breakthrough: "The moment you ask for help genuinely, something in your life unlocks.",
  },
};

const PERSONAL_YEAR: Record<number, {
  title: string; theme: string; opportunities: string[]; warnings: string[]; focus: string; avoid: string;
}> = {
  1: { title: "Year 1 — New Beginnings", theme: "Plant seeds. New cycle. Take initiative.",
    opportunities: ["Launching projects, businesses or chapters", "Stepping into leadership", "Defining a new identity"],
    warnings: ["Acting on old patterns instead of new vision", "Waiting passively for someone else to start"],
    focus: "Initiative, independence, courageous first moves.", avoid: "Passivity, dependence, replaying the past." },
  2: { title: "Year 2 — Patience & Partnership", theme: "Slow down. Build relationships. Listen.",
    opportunities: ["Deepening key relationships", "Quiet inner growth", "Intuitive breakthroughs"],
    warnings: ["Forcing outcomes that need to ripen", "Taking small slights too personally"],
    focus: "Cooperation, patience, intuition.", avoid: "Force, impatience, isolation." },
  3: { title: "Year 3 — Expression & Growth", theme: "Your voice is being amplified. Use it.",
    opportunities: ["New connections that matter", "Creative projects gaining traction", "Being seen, heard, recognised", "Allowing yourself to actually enjoy life"],
    warnings: ["Scattering across too many interests", "Emotional superficiality", "Overspending on experiences"],
    focus: "Voice, creative output, meaningful visibility.", avoid: "Starting 10 projects instead of finishing 1; isolating; performing happiness instead of feeling it." },
  4: { title: "Year 4 — Work & Foundation", theme: "Get serious. Build the structure your future needs.",
    opportunities: ["Building durable systems — health, finance, study, work", "Long-term planning paying off", "Earning trust through reliability"],
    warnings: ["Taking shortcuts you'll pay for later", "Burnout from over-work", "Resenting routine"],
    focus: "Discipline, planning, structure.", avoid: "Shortcuts, impulsive change, laziness." },
  5: { title: "Year 5 — Change & Freedom", theme: "Move. Risk. Rearrange.",
    opportunities: ["Travel, new environments, fresh chapters", "Bold pivots that finally fit", "Meeting people who unlock new versions of you"],
    warnings: ["Reckless decisions", "Burning bridges you'll want later", "Overindulgence"],
    focus: "Embracing change, flexibility, courage.", avoid: "Recklessness, addiction, shutting doors permanently." },
  6: { title: "Year 6 — Love & Responsibility", theme: "Family, commitment, healing.",
    opportunities: ["Deepening love and home life", "Healing family wounds", "Service that fulfils you"],
    warnings: ["Controlling those you love", "Neglecting your own needs", "Carrying others' burdens"],
    focus: "Relationships, home, balanced service.", avoid: "Martyrdom, control, self-neglect." },
  7: { title: "Year 7 — Reflection & Wisdom", theme: "Inner work. Study. Solitude.",
    opportunities: ["Spiritual or intellectual breakthroughs", "Specialised expertise", "Restorative rest"],
    warnings: ["Over-isolating", "Cynicism", "Over-thinking instead of acting"],
    focus: "Study, reflection, depth.", avoid: "Forcing big external moves; distrust without evidence." },
  8: { title: "Year 8 — Power & Achievement", theme: "Career, money, authority.",
    opportunities: ["Major financial moves", "Stepping into leadership", "Public success"],
    warnings: ["Ego inflation", "Workaholism eating relationships", "Cutting corners ethically"],
    focus: "Business, money, leadership with integrity.", avoid: "Greed, neglect of loved ones, ego-driven decisions." },
  9: { title: "Year 9 — Completion & Release", theme: "Let go. Conclude. Serve.",
    opportunities: ["Closing chapters cleanly", "Generosity and service", "Forgiveness — given and received"],
    warnings: ["Clinging to what is ending", "Starting major new things prematurely", "Bitterness about endings"],
    focus: "Endings, forgiveness, generosity.", avoid: "Major launches; clinging to the past." },
};

// ─────────────────────────────────────────────────────────────
// Compose
// ─────────────────────────────────────────────────────────────
export interface CoreNumbers {
  lifePath: NumValue;
  destiny: NumValue & { rows: ReturnType<typeof wordBreakdown>["rows"] };
  soulUrge: NumValue & { rows: ReturnType<typeof wordBreakdown>["rows"] };
  personality: NumValue & { rows: ReturnType<typeof wordBreakdown>["rows"] };
  birthday: NumValue;
  maturity: NumValue;
  personalYear: { value: number; year: number; calc: string };
  nextYear: { value: number; year: number; calc: string };
}

export function computeCore(input: ReadingInput): CoreNumbers {
  const year = input.currentYear ?? new Date().getUTCFullYear();
  const letters = classifyLetters(input.fullName);
  const lifePath = calcLifePath(input.dob);
  const destiny = calcFromBreakdown(letters, () => true, "All letters");
  const soulUrge = calcFromBreakdown(letters, (l) => l.isVowel, "Vowels");
  const personality = calcFromBreakdown(letters, (l) => !l.isVowel, "Consonants");
  const birthday = calcBirthday(input.dob);
  const maturity = calcMaturity(lifePath.value, destiny.value);
  const personalYear = calcPersonalYear(input.dob, year);
  const nextYear = calcPersonalYear(input.dob, year + 1);
  return { lifePath, destiny, soulUrge, personality, birthday, maturity, personalYear, nextYear };
}

function formatDob(dob: string) {
  const [y, m, d] = dob.split("-").map(Number);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d} ${months[m - 1]} ${y}`;
}

function emojiFor(label: string) {
  switch (label) {
    case "Life Path": return "🔵";
    case "Destiny": return "🟣";
    case "Soul Urge": return "🔴";
    case "Personality": return "🟠";
    case "Birthday": return "🟡";
    case "Maturity": return "🟢";
    default: return "🔹";
  }
}

function profileFor(n: number): NumberProfile | undefined {
  return N[n];
}

function bullets(items: string[]) {
  return items.map((s) => `- ${s}`).join("\n");
}

function tableForBreakdown(rows: ReturnType<typeof wordBreakdown>["rows"]) {
  const header = `| Name | Letters | Sum |\n|---|---|---|`;
  const body = rows.map((r) => `| ${r.word} | ${r.expr} | ${r.sum}${r.sum > 9 && !MASTER.has(r.sum) ? ` → ${r.reduced}` : ""}${r.master ? ` (Master ${r.master})` : ""} |`).join("\n");
  return `${header}\n${body}`;
}

function numHeading(label: string, n: NumValue) {
  const profile = profileFor(n.value);
  const titleSuffix = profile ? ` | ${profile.title}` : "";
  const display = n.karmic ? `${n.karmic}/${n.value}` : `${n.value}`;
  const karmicBadge = n.karmic ? " ⚠️ Karmic Debt" : "";
  return `### ${emojiFor(label)} ${label} Number — ${display}${titleSuffix}${karmicBadge}`;
}

function deepDiveForNumber(n: NumValue, label: string, firstName: string): string {
  const p = profileFor(n.value);
  if (!p) return `*Number ${n.value} — meaning not in database.*`;
  const lines: string[] = [];
  lines.push(`**Who you are at the core**`);
  lines.push(`${firstName}, ${p.essence}`);
  lines.push("");
  lines.push(`**Life purpose & repeating themes**`);
  lines.push(p.purpose);
  lines.push("");
  lines.push(`**⚡ Strengths & superpowers**`);
  lines.push(bullets(p.strengths));
  lines.push("");
  lines.push(`**🪤 Weaknesses & self-sabotage**`);
  lines.push(bullets(p.weaknesses));
  lines.push("");
  lines.push(`**💞 Love, friendship & family**`);
  lines.push(p.love);
  lines.push("");
  lines.push(`**💑 Partner dynamics**`);
  lines.push(`*Good for you:*`);
  lines.push(bullets(p.partnerGood));
  lines.push("");
  lines.push(`*Risky dynamics:*`);
  lines.push(bullets(p.partnerRisky));
  lines.push("");
  lines.push(`**💰 Career & success potential**`);
  lines.push(`*What suits you:*`);
  lines.push(bullets(p.careerSuits));
  lines.push("");
  lines.push(`*What doesn't:*`);
  lines.push(bullets(p.careerAvoid));
  lines.push("");
  lines.push(`**🧠 Mental & emotional patterns**`);
  lines.push(p.mental);
  return lines.join("\n");
}

export function buildReadingMarkdown(input: ReadingInput): string {
  const core = computeCore(input);
  const niceDob = formatDob(input.dob);
  const firstName = input.fullName.trim().split(/\s+/)[0] || "Friend";
  const lines: string[] = [];

  lines.push(`# 🔢 Your Complete Numerology SWOT Analysis`);
  lines.push(`**${input.fullName}** | ${niceDob} | ${input.gender}`);
  lines.push("");
  lines.push(`> Calculated by hand using the Pythagorean chart. Every number below is traceable to its calculation — no AI predictions, no guessing.`);
  lines.push("");

  // ── SECTION 1: Core numbers (calculations + short titles) ───────────────
  lines.push(`## 📊 SECTION 1 — YOUR CORE NUMBERS`);
  lines.push("");

  // Life Path
  lines.push(numHeading("Life Path", core.lifePath));
  lines.push(`**Calculation:**`);
  lines.push(core.lifePath.calc);
  if (KARMIC.has(Number(input.dob.split("-")[2]))) {
    lines.push("");
    lines.push(`⚠️ Note: Your day of birth is ${input.dob.split("-")[2]} — a Karmic Debt number. More on this in Section 3.`);
  }
  lines.push("");

  // Destiny
  lines.push(numHeading("Destiny", core.destiny));
  lines.push(`**Calculation (Pythagorean):**`);
  lines.push(tableForBreakdown(core.destiny.rows));
  lines.push("");
  lines.push(core.destiny.calc);
  const masterWord = core.destiny.rows.find((r) => r.master);
  if (masterWord) {
    lines.push("");
    lines.push(`✨ Your name **${masterWord.word}** carries the Master Number ${masterWord.master} vibration — a rare and powerful hidden energy in your chart.`);
  }
  lines.push("");

  // Soul Urge
  lines.push(numHeading("Soul Urge", core.soulUrge));
  lines.push(`**Calculation (Vowels only — A, E, I, O, U):**`);
  lines.push(tableForBreakdown(core.soulUrge.rows));
  lines.push("");
  lines.push(core.soulUrge.calc);
  lines.push("");

  // Personality
  lines.push(numHeading("Personality", core.personality));
  lines.push(`**Calculation (Consonants only):**`);
  lines.push(tableForBreakdown(core.personality.rows));
  lines.push("");
  lines.push(core.personality.calc);
  lines.push("");

  // Birthday
  lines.push(numHeading("Birthday", core.birthday));
  lines.push(`**Calculation:** ${core.birthday.calc}`);
  lines.push("");

  // Maturity
  lines.push(numHeading("Maturity", core.maturity));
  lines.push(`**Calculation:** ${core.maturity.calc}`);
  lines.push("");
  lines.push(`This number activates fully around age 35–40 — your life is literally building toward this energy.`);
  lines.push("");

  // ── SECTION 2: Deep dive ───────────────────────────────────────────────
  lines.push(`## 🗡️ SECTION 2 — DEEP DIVE INTO WHO YOU ARE`);
  lines.push("");

  // Core essence synthesis
  lines.push(`### 🧬 Your Core Essence`);
  const lpP = profileFor(core.lifePath.value);
  const suP = profileFor(core.soulUrge.value);
  const peP = profileFor(core.personality.value);
  const deP = profileFor(core.destiny.value);
  if (lpP && suP && peP && deP) {
    lines.push(`${firstName}, your chart is layered.`);
    lines.push("");
    lines.push(`On the **outside (Life Path ${core.lifePath.value} — ${lpP.title})**, ${lpP.essence.toLowerCase()}`);
    lines.push("");
    if (core.soulUrge.value === core.personality.value) {
      lines.push(`But inside, both your **Soul Urge and Personality carry the same number: ${core.soulUrge.value}** (${suP.title}). ${suP.essence}`);
      lines.push("");
      lines.push(`This creates a specific tension: the world meets the ${core.lifePath.value} in you, but the ${core.soulUrge.value} runs the inner show. Learning to honour both is your lifelong dance.`);
    } else {
      lines.push(`Your **Soul Urge ${core.soulUrge.value}** (${suP.title}) is what your heart secretly wants: ${suP.essence.toLowerCase()}`);
      lines.push("");
      lines.push(`Your **Personality ${core.personality.value}** (${peP.title}) is the version of you the world meets first — ${peP.essence.toLowerCase()}`);
    }
    lines.push("");
    lines.push(`Your **Destiny ${core.destiny.value}** (${deP.title}) adds a third layer — ${deP.purpose.toLowerCase()}`);
  }
  lines.push("");

  // Per-number deep dives
  const numbersForDive: Array<[string, NumValue]> = [
    ["Life Path", core.lifePath],
    ["Destiny", core.destiny],
    ["Soul Urge", core.soulUrge],
    ["Personality", core.personality],
    ["Birthday", core.birthday],
    ["Maturity", core.maturity],
  ];
  for (const [label, n] of numbersForDive) {
    const p = profileFor(n.value);
    if (!p) continue;
    lines.push(`### ${emojiFor(label)} ${label} ${n.value} — ${p.title}`);
    lines.push(deepDiveForNumber(n, label, firstName));
    lines.push("");
  }

  // ── SECTION 3: Karmic debts ───────────────────────────────────────────
  const karmicHits: Array<{ k: number; where: string }> = [];
  if (core.lifePath.karmic) karmicHits.push({ k: core.lifePath.karmic, where: "Life Path" });
  if (core.destiny.karmic) karmicHits.push({ k: core.destiny.karmic, where: "Destiny" });
  if (core.soulUrge.karmic) karmicHits.push({ k: core.soulUrge.karmic, where: "Soul Urge" });
  if (core.personality.karmic) karmicHits.push({ k: core.personality.karmic, where: "Personality" });
  if (core.birthday.karmic) karmicHits.push({ k: core.birthday.karmic, where: "Birthday" });

  lines.push(`## ⚠️ SECTION 3 — YOUR KARMIC DEBTS`);
  lines.push("");
  if (karmicHits.length === 0) {
    lines.push(`No Karmic Debt numbers (13, 14, 16, 19) appear in your core chart. This is uncommon and means this lifetime is freer of inherited soul-debt patterns. Use that lightness — it is a privilege.`);
  } else {
    const grouped = new Map<number, string[]>();
    for (const h of karmicHits) {
      if (!grouped.has(h.k)) grouped.set(h.k, []);
      grouped.get(h.k)!.push(h.where);
    }
    if (grouped.size >= 2) {
      lines.push(`You carry **${grouped.size} karmic debt${grouped.size > 1 ? "s" : ""}** in your chart. This does not mean you are cursed — it means this lifetime is a heavy-duty lesson lifetime. You are here to clear something deep.`);
      lines.push("");
    }
    for (const [k, where] of grouped) {
      const km = KARMIC_PROFILES[k];
      if (!km) continue;
      lines.push(`### 💀 ${km.title}`);
      lines.push(`Appears in: **${where.join(", ")}**${where.length > 1 ? " — appearing more than once amplifies this lesson significantly." : ""}`);
      lines.push("");
      lines.push(`- **Lesson:** ${km.lesson}`);
      lines.push(`- **Pattern:** ${km.pattern}`);
      lines.push(`- **Trap:** ${km.trap}`);
      lines.push(`- **Breakthrough:** ${km.breakthrough}`);
      lines.push("");
    }
  }
  lines.push("");

  // ── SECTION 4: Time energy ───────────────────────────────────────────
  const py = core.personalYear;
  const ny = core.nextYear;
  const pym = PERSONAL_YEAR[py.value];
  const nym = PERSONAL_YEAR[ny.value];

  lines.push(`## 📅 SECTION 4 — YOUR TIME ENERGY`);
  lines.push("");
  lines.push(`### 🗓️ Personal Year ${py.year} — ${pym ? pym.title : `Year ${py.value}`}`);
  lines.push(`**Calculation:** ${py.calc}`);
  lines.push("");
  if (pym) {
    lines.push(`**Theme:** ${pym.theme}`);
    lines.push("");
    lines.push(`**Opportunities this year:**`);
    lines.push(bullets(pym.opportunities));
    lines.push("");
    lines.push(`**Warnings this year:**`);
    lines.push(bullets(pym.warnings));
    lines.push("");
    lines.push(`**Focus on:** ${pym.focus}`);
    lines.push("");
    lines.push(`**Avoid:** ${pym.avoid}`);
  }
  lines.push("");
  lines.push(`### 🔮 Coming Year ${ny.year} — ${nym ? nym.title : `Year ${ny.value}`}`);
  lines.push(`**Calculation:** ${ny.calc}`);
  lines.push("");
  if (nym) {
    lines.push(`Next year's energy shifts into **${ny.value}** — ${nym.theme}`);
    lines.push("");
    lines.push(`**Prepare by:** Using ${py.year} to clarify what you are building toward, so when ${ny.year}'s energy arrives, you have direction. Don't enter it empty-handed.`);
  }
  lines.push("");

  // ── SECTION 5: Action plan ───────────────────────────────────────────
  lines.push(`## 🗺️ SECTION 5 — YOUR PRACTICAL ACTION PLAN`);
  lines.push("");
  lines.push(`### ⚔️ 3 Powerful Life Rules For You`);
  lines.push("");

  const lpProfile = profileFor(core.lifePath.value);
  const destProfile = profileFor(core.destiny.value);

  lines.push(`**Rule 1: Honour your Life Path ${core.lifePath.value}.**`);
  if (lpProfile) {
    lines.push(`${lpProfile.purpose} Build your week, your work, and your relationships around this — not against it.`);
  }
  lines.push("");

  lines.push(`**Rule 2: Run your Destiny ${core.destiny.value} on purpose, not by accident.**`);
  if (destProfile) {
    lines.push(`Your Destiny ${core.destiny.value} (${destProfile.title}) is the road you walk. ${destProfile.purpose}`);
  }
  lines.push("");

  if (karmicHits.length > 0) {
    const firstK = KARMIC_PROFILES[karmicHits[0].k];
    lines.push(`**Rule 3: Work your karmic lesson — ${firstK.title}.**`);
    lines.push(`${firstK.lesson} This is your antidote — return to it whenever life feels heavy.`);
  } else {
    lines.push(`**Rule 3: Activate your Maturity ${core.maturity.value} early.**`);
    const mp = profileFor(core.maturity.value);
    if (mp) lines.push(`Don't wait until 35 to embody it. ${mp.purpose}`);
  }
  lines.push("");

  // Weekly reset ritual
  lines.push(`### 🔁 Simple Weekly Reset Ritual`);
  lines.push(`Every Sunday evening, 15 minutes:`);
  lines.push(`1. **Review** — what did I express, build, or learn this week aligned with my Life Path ${core.lifePath.value}?`);
  lines.push(`2. **Release** — name one thing to let go of (a worry, grudge, or unfinished idea taking energy).`);
  lines.push(`3. **Refocus** — pick ONE priority for the coming week that serves your Personal Year ${py.value} theme.`);
  lines.push(`4. **Ritual** — light a candle, write it down, or speak it aloud. Make it real.`);
  lines.push("");

  // DO / DON'T list
  lines.push(`### 📋 DO & DON'T List`);
  lines.push("");
  lines.push(`**✅ DO:**`);
  const doList: string[] = [];
  if (lpProfile) doList.push(...lpProfile.strengths.slice(0, 3).map((s) => `Lean into: ${s.toLowerCase()}`));
  if (destProfile) doList.push(`Pursue work that lets you express your Destiny ${core.destiny.value}: ${destProfile.careerSuits[0]}`);
  doList.push(`Run the weekly reset above — consistency beats intensity`);
  doList.push(`Protect time for what your Soul Urge ${core.soulUrge.value} actually needs`);
  lines.push(bullets(doList));
  lines.push("");
  lines.push(`**❌ DON'T:**`);
  const dontList: string[] = [];
  if (lpProfile) dontList.push(...lpProfile.weaknesses.slice(0, 3).map((s) => `Fall into: ${s.toLowerCase()}`));
  if (karmicHits.length > 0) dontList.push(`Repeat the trap of ${KARMIC_PROFILES[karmicHits[0].k].title}: ${KARMIC_PROFILES[karmicHits[0].k].trap.toLowerCase()}`);
  dontList.push(`Compare your timeline to people with completely different charts`);
  lines.push(bullets(dontList));
  lines.push("");

  // Closing
  lines.push(`---`);
  lines.push(`### 🔚 Closing Word`);
  const summary = `${firstName}, your chart shows a Life Path ${core.lifePath.value}, Destiny ${core.destiny.value}, Soul Urge ${core.soulUrge.value}, Personality ${core.personality.value}, Birthday ${core.birthday.value}, and Maturity ${core.maturity.value}${karmicHits.length ? `, with ${karmicHits.length} karmic debt${karmicHits.length > 1 ? "s" : ""} active` : ""}.`;
  lines.push(summary);
  lines.push("");
  lines.push(`The numbers above are facts of your chart. What you do with them is yours alone. Trust the process. Use your voice. Build true. 🗡️`);

  return lines.join("\n");
}
