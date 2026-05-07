// Pure Pythagorean numerology calculator.
// No AI, no guessing — every output is traceable to a calculation
// or to the fixed interpretation database below.

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

// ─────────────────────────────────────────────────────────────
// Reduction
// ─────────────────────────────────────────────────────────────
function digitSum(n: number): number {
  return String(Math.abs(n))
    .split("")
    .reduce((a, c) => a + Number(c), 0);
}

/** Reduce to a single digit, preserving Master numbers (11, 22, 33). */
function reduceMaster(n: number): number {
  let x = n;
  while (x > 9 && !MASTER.has(x)) x = digitSum(x);
  return x;
}

/** Reduce while flagging Karmic Debt at the last 2-digit step. */
function reduceWithKarmic(n: number): { value: number; karmic?: number } {
  let x = n;
  let karmic: number | undefined;
  while (x > 9 && !MASTER.has(x)) {
    if (KARMIC.has(x)) karmic = x;
    x = digitSum(x);
  }
  return { value: x, karmic };
}

// ─────────────────────────────────────────────────────────────
// Y vowel detection (simple syllable heuristic)
// Y is a vowel only when it acts as the only vowel sound in a syllable.
// Heuristic: in a given word, treat Y as a vowel only if the word
// contains no A/E/I/O/U at all (e.g. LYNN, GYPSY, MYRRH, RHYTHM).
// Otherwise treat Y as a consonant. Rule states: "sometimes Y".
// ─────────────────────────────────────────────────────────────
function classifyLetters(fullName: string): Array<{ ch: string; val: number; isVowel: boolean }> {
  const words = fullName.toUpperCase().split(/\s+/).filter(Boolean);
  const out: Array<{ ch: string; val: number; isVowel: boolean }> = [];
  for (const word of words) {
    const cleanWord = word.replace(/[^A-Z]/g, "");
    const hasRegularVowel = /[AEIOU]/.test(cleanWord);
    for (const ch of cleanWord) {
      const val = LETTER_VALUES[ch];
      if (val == null) continue;
      let isVowel = VOWELS.has(ch);
      if (ch === "Y") isVowel = !hasRegularVowel; // Y is vowel only if no other vowel in word
      out.push({ ch, val, isVowel });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Core calculations
// ─────────────────────────────────────────────────────────────
export interface CoreNumbers {
  lifePath: { value: number; karmic?: number; calc: string };
  destiny: { value: number; karmic?: number; calc: string };
  soulUrge: { value: number; karmic?: number; calc: string };
  personality: { value: number; karmic?: number; calc: string };
  birthday: { value: number; calc: string };
  maturity: { value: number; calc: string };
  personalYear: { value: number; calc: string; year: number };
}

function calcLifePath(dob: string) {
  const [y, m, d] = dob.split("-").map(Number);
  const dayR = reduceMaster(d);
  const monR = reduceMaster(m);
  const yearR = reduceMaster(y);
  const sum = dayR + monR + yearR;
  const r = reduceWithKarmic(sum);
  const calc = `Day ${d} → ${dayR}, Month ${m} → ${monR}, Year ${y} → ${yearR}. Sum = ${dayR}+${monR}+${yearR} = ${sum}${
    r.karmic ? ` → Karmic Debt ${r.karmic}/${r.value}` : sum !== r.value ? ` → ${r.value}` : ""
  }`;
  return { value: r.value, karmic: r.karmic, calc };
}

function sumLetters(letters: Array<{ ch: string; val: number; isVowel: boolean }>) {
  return letters.reduce((a, l) => a + l.val, 0);
}

function calcDestiny(letters: ReturnType<typeof classifyLetters>) {
  const total = sumLetters(letters);
  const r = reduceWithKarmic(total);
  const breakdown = letters.map((l) => `${l.ch}(${l.val})`).join("+");
  const calc = `${breakdown} = ${total}${r.karmic ? ` → Karmic Debt ${r.karmic}/${r.value}` : total !== r.value ? ` → ${r.value}` : ""}`;
  return { value: r.value, karmic: r.karmic, calc };
}

function calcSoulUrge(letters: ReturnType<typeof classifyLetters>) {
  const v = letters.filter((l) => l.isVowel);
  const total = sumLetters(v);
  const r = reduceWithKarmic(total);
  const breakdown = v.map((l) => `${l.ch}(${l.val})`).join("+") || "(no vowels)";
  const calc = `Vowels: ${breakdown} = ${total}${r.karmic ? ` → Karmic Debt ${r.karmic}/${r.value}` : total !== r.value ? ` → ${r.value}` : ""}`;
  return { value: r.value, karmic: r.karmic, calc };
}

function calcPersonality(letters: ReturnType<typeof classifyLetters>) {
  const c = letters.filter((l) => !l.isVowel);
  const total = sumLetters(c);
  const r = reduceWithKarmic(total);
  const breakdown = c.map((l) => `${l.ch}(${l.val})`).join("+") || "(no consonants)";
  const calc = `Consonants: ${breakdown} = ${total}${r.karmic ? ` → Karmic Debt ${r.karmic}/${r.value}` : total !== r.value ? ` → ${r.value}` : ""}`;
  return { value: r.value, karmic: r.karmic, calc };
}

function calcBirthday(dob: string) {
  const d = Number(dob.split("-")[2]);
  // 11 and 22 stay as Master Numbers; otherwise reduce.
  const value = MASTER.has(d) ? d : reduceMaster(d);
  return { value, calc: `Day of birth = ${d}${d !== value ? ` → ${value}` : ""}` };
}

function calcMaturity(lifePath: number, destiny: number) {
  const sum = lifePath + destiny;
  const value = reduceMaster(sum);
  return { value, calc: `Life Path ${lifePath} + Destiny ${destiny} = ${sum}${sum !== value ? ` → ${value}` : ""}` };
}

function calcPersonalYear(dob: string, currentYear: number) {
  const [, m, d] = dob.split("-").map(Number);
  const dayR = reduceMaster(d);
  const monR = reduceMaster(m);
  const yearR = reduceMaster(currentYear);
  const sum = dayR + monR + yearR;
  const value = reduceMaster(sum);
  const note = MASTER.has(sum) && sum !== value ? ` (${sum} undercurrent)` : "";
  return {
    value,
    year: currentYear,
    calc: `Day ${d}→${dayR}, Month ${m}→${monR}, Year ${currentYear}→${yearR}. Sum = ${sum}${sum !== value ? ` → ${value}` : ""}${note}`,
  };
}

export function computeCore(input: ReadingInput): CoreNumbers {
  const year = input.currentYear ?? new Date().getUTCFullYear();
  const letters = classifyLetters(input.fullName);
  const lifePath = calcLifePath(input.dob);
  const destiny = calcDestiny(letters);
  const soulUrge = calcSoulUrge(letters);
  const personality = calcPersonality(letters);
  const birthday = calcBirthday(input.dob);
  const maturity = calcMaturity(lifePath.value, destiny.value);
  const personalYear = calcPersonalYear(input.dob, year);
  return { lifePath, destiny, soulUrge, personality, birthday, maturity, personalYear };
}

// ─────────────────────────────────────────────────────────────
// Interpretation database (verbatim from spec)
// ─────────────────────────────────────────────────────────────
const NUMBER_MEANINGS: Record<number, {
  title: string;
  traits: string;
  shadow: string;
  career: string;
  love: string;
  note?: string;
}> = {
  1: {
    title: "1 — The Leader / Pioneer",
    traits: "Independent, ambitious, original, courageous, self-reliant",
    shadow: "Arrogant, selfish, stubborn, domineering",
    career: "Entrepreneur, CEO, military, inventor, politician",
    love: "Needs an independent partner. Can be self-absorbed.",
  },
  2: {
    title: "2 — The Diplomat / Peacemaker",
    traits: "Cooperative, sensitive, patient, intuitive, harmonious",
    shadow: "Over-sensitive, indecisive, people-pleasing, doormat tendency",
    career: "Counselor, mediator, HR, music, support roles",
    love: "Deeply loving. Needs reassurance. Risk of losing self in relationships.",
  },
  3: {
    title: "3 — The Creator / Communicator",
    traits: "Creative, expressive, social, joyful, inspiring",
    shadow: "Scattered, superficial, gossip, avoids depth",
    career: "Artist, writer, actor, speaker, marketing",
    love: "Fun and romantic but can avoid serious commitment.",
  },
  4: {
    title: "4 — The Builder / Foundation",
    traits: "Disciplined, loyal, practical, hardworking, organized",
    shadow: "Rigid, stubborn, workaholic, fear of change",
    career: "Engineering, architecture, finance, management, law",
    love: "Loyal and stable. Slow to open up. Needs security.",
  },
  5: {
    title: "5 — The Freedom Seeker / Adventurer",
    traits: "Adaptable, curious, magnetic, adventurous, versatile",
    shadow: "Restless, overindulgent, commitment-phobic, scattered",
    career: "Sales, travel, media, marketing, entrepreneurship",
    love: "Exciting partner but fears being trapped. Needs freedom.",
  },
  6: {
    title: "6 — The Nurturer / Protector",
    traits: "Responsible, caring, family-oriented, artistic, healing",
    shadow: "Controlling, martyr tendency, self-sacrificing, interfering",
    career: "Doctor, teacher, counselor, interior design, chef",
    love: "Most marriage-oriented number. Devoted. Can smother.",
  },
  7: {
    title: "7 — The Seeker / Mystic",
    traits: "Analytical, spiritual, introspective, intelligent, private",
    shadow: "Isolated, cynical, cold, overly secretive",
    career: "Research, science, philosophy, spirituality, writing",
    love: "Hard to reach emotionally. Needs a deep intellectual bond.",
  },
  8: {
    title: "8 — The Powerhouse / Achiever",
    traits: "Ambitious, authoritative, business-minded, resilient",
    shadow: "Materialistic, controlling, workaholic, ruthless",
    career: "Business, finance, real estate, law, corporate leadership",
    love: "Devoted when committed. Work can dominate relationships.",
  },
  9: {
    title: "9 — The Old Soul / Humanitarian",
    traits: "Compassionate, wise, generous, creative, idealistic",
    shadow: "Bitter, self-righteous, martyr tendency, difficulty letting go",
    career: "NGO, arts, healing, philosophy, global work",
    love: "Deeply romantic and giving. Can attract people who take advantage.",
  },
  11: {
    title: "11 — Master Number: The Intuitive / Illuminator",
    traits: "Highly intuitive, visionary, inspiring, sensitive, spiritual",
    shadow: "Anxiety-prone, self-doubt, impractical",
    career: "Spiritual teaching, counseling, art, visionary leadership",
    love: "Sensitive and deep. Needs a partner who respects their intuition.",
    note: "Carries the sensitivity of 2 with the ambition of 11.",
  },
  22: {
    title: "22 — Master Number: The Master Builder",
    traits: "Visionary and practical. Can build things that change the world.",
    shadow: "Overwhelmed by potential, self-doubt, pressure",
    career: "Large-scale building — architecture, business empires, global initiatives",
    love: "Needs a steady partner who supports the mission.",
    note: "Most powerful number in numerology.",
  },
  33: {
    title: "33 — Master Number: The Master Teacher",
    traits: "Pure compassion, healing, teaching on a global scale",
    shadow: "Martyrdom, burden of responsibility",
    career: "Teaching, healing, humanitarian leadership",
    love: "Selfless love — must guard against losing self in service.",
    note: "Extremely rare. Usually reduces to 6 in practice.",
  },
};

const KARMIC_MEANINGS: Record<number, {
  title: string;
  pastLife: string;
  lesson: string;
  pattern: string;
  gift: string;
}> = {
  13: {
    title: "13/4 — Laziness and Burden",
    pastLife: "Avoided work, took shortcuts, used others.",
    lesson: "Discipline. Hard work. No shortcuts. Build properly.",
    pattern: "Life keeps collapsing structures until you build them right.",
    gift: "Extraordinary endurance and legacy.",
  },
  14: {
    title: "14/5 — Abuse of Freedom",
    pastLife: "Overindulgence, addiction, manipulation, recklessness.",
    lesson: "Earn freedom through responsibility. Control excess.",
    pattern: "Chaos and overindulgence cycles, scattered life until focused.",
    gift: "True freedom through discipline.",
  },
  16: {
    title: "16/7 — Ego and Destruction",
    pastLife: "Ego-driven love, affairs, self-centered spiritual life.",
    lesson: "Surrender ego. True spiritual humility.",
    pattern: "Sudden collapses in life (relationships, career) to rebuild from scratch.",
    gift: "Deep spiritual wisdom and rebirth.",
  },
  19: {
    title: "19/1 — Misuse of Power",
    pastLife: "Selfish use of power, ignored others' needs.",
    lesson: "Lead with service. Independence through cooperation.",
    pattern: "Must do everything alone (by force or by lesson) until they learn to receive help.",
    gift: "True self-sufficient leadership.",
  },
};

const PERSONAL_YEAR_MEANINGS: Record<number, { title: string; theme: string; focus: string; avoid: string }> = {
  1: { title: "Personal Year 1 — New Beginnings", theme: "Start, launch, plant seeds", focus: "Taking initiative, new projects, independence", avoid: "Being passive, waiting for others" },
  2: { title: "Personal Year 2 — Patience and Partnership", theme: "Relationships, waiting, intuition", focus: "Cooperation, building connections, inner work", avoid: "Forcing outcomes, rushing decisions" },
  3: { title: "Personal Year 3 — Expression and Growth", theme: "Communication, creativity, social expansion", focus: "Self-expression, networking, enjoying life", avoid: "Scattering energy, superficiality" },
  4: { title: "Personal Year 4 — Work and Foundation", theme: "Build, discipline, systems", focus: "Hard work, planning, creating structure", avoid: "Shortcuts, laziness, resisting routine" },
  5: { title: "Personal Year 5 — Change and Freedom", theme: "Movement, risk, change", focus: "Embracing change, travel, new experiences", avoid: "Recklessness, overindulgence, burning bridges" },
  6: { title: "Personal Year 6 — Love and Responsibility", theme: "Family, commitment, healing", focus: "Relationships, home, service to others", avoid: "Controlling behavior, neglecting self" },
  7: { title: "Personal Year 7 — Reflection and Wisdom", theme: "Inner work, study, solitude", focus: "Spiritual growth, analysis, rest", avoid: "Isolation, overthinking, distrust" },
  8: { title: "Personal Year 8 — Power and Achievement", theme: "Career, money, authority", focus: "Business, financial goals, stepping into leadership", avoid: "Ego, workaholism, ignoring relationships" },
  9: { title: "Personal Year 9 — Completion and Release", theme: "Let go, conclude, serve", focus: "Endings, forgiveness, generosity", avoid: "Clinging to the past, starting major new things" },
};

const COMPATIBILITY: Record<number, { best: string; challenging: string }> = {
  1: { best: "3, 5, 6", challenging: "1, 8" },
  2: { best: "4, 6, 8", challenging: "5, 3" },
  3: { best: "1, 5, 9", challenging: "4, 7" },
  4: { best: "2, 6, 8", challenging: "3, 5" },
  5: { best: "1, 3, 7", challenging: "4, 5" },
  6: { best: "2, 4, 9", challenging: "1, 5" },
  7: { best: "5, 7, 9", challenging: "2, 4" },
  8: { best: "2, 4, 6", challenging: "1, 8" },
  9: { best: "3, 6, 9", challenging: "4, 5" },
};

// ─────────────────────────────────────────────────────────────
// Markdown report
// ─────────────────────────────────────────────────────────────
function meaningBlock(n: number, label: string): string {
  const m = NUMBER_MEANINGS[n];
  if (!m) return `**${label}: ${n}** — meaning not in database.`;
  return [
    `**${label}: ${m.title}**`,
    `- Traits: ${m.traits}`,
    `- Shadow: ${m.shadow}`,
    `- Career: ${m.career}`,
    `- Love: ${m.love}`,
    m.note ? `- Note: ${m.note}` : "",
  ].filter(Boolean).join("\n");
}

function formatDob(dob: string) {
  const [y, m, d] = dob.split("-").map(Number);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d} ${months[m - 1]} ${y}`;
}

export function buildReadingMarkdown(input: ReadingInput): string {
  const core = computeCore(input);
  const niceDob = formatDob(input.dob);
  const lines: string[] = [];

  lines.push(`# 🔢 Your Pythagorean Numerology Reading`);
  lines.push(`**${input.fullName}** | ${niceDob} | ${input.gender}`);
  lines.push("");
  lines.push(`> Calculated by hand using the Pythagorean chart. No predictions, no AI — every number below is traceable to its calculation.`);
  lines.push("");

  // Section 1: Core numbers
  lines.push(`## 📊 Section 1 — Your Core Numbers`);
  const list: Array<[string, { value: number; karmic?: number; calc: string }]> = [
    ["Life Path", core.lifePath],
    ["Destiny / Expression", core.destiny],
    ["Soul Urge / Heart's Desire", core.soulUrge],
    ["Personality", core.personality],
    ["Birthday", { ...core.birthday, karmic: undefined }],
    ["Maturity", { ...core.maturity, karmic: undefined }],
  ];
  for (const [label, n] of list) {
    lines.push(`### ${label} — ${n.karmic ? `${n.karmic}/${n.value}` : n.value}`);
    lines.push(`*Calculation:* ${n.calc}`);
    lines.push("");
    lines.push(meaningBlock(n.value, label));
    lines.push("");
  }

  // Section 2: Karmic debts
  const karmics = [core.lifePath, core.destiny, core.soulUrge, core.personality]
    .map((n) => n.karmic)
    .filter((k): k is number => !!k);
  const uniqueK = Array.from(new Set(karmics));
  lines.push(`## ⚠️ Section 2 — Karmic Debts`);
  if (uniqueK.length === 0) {
    lines.push(`No Karmic Debt numbers (13, 14, 16, 19) appear in your core chart.`);
  } else {
    for (const k of uniqueK) {
      const km = KARMIC_MEANINGS[k];
      lines.push(`### ${km.title}`);
      lines.push(`- **Past life:** ${km.pastLife}`);
      lines.push(`- **Lesson:** ${km.lesson}`);
      lines.push(`- **Pattern:** ${km.pattern}`);
      lines.push(`- **Gift when learned:** ${km.gift}`);
      lines.push("");
    }
  }
  lines.push("");

  // Section 3: Personal Year
  const py = core.personalYear;
  const pym = PERSONAL_YEAR_MEANINGS[py.value];
  lines.push(`## 📅 Section 3 — Your Personal Year (${py.year})`);
  lines.push(`*Calculation:* ${py.calc}`);
  lines.push("");
  if (pym) {
    lines.push(`### ${pym.title}`);
    lines.push(`- **Theme:** ${pym.theme}`);
    lines.push(`- **Focus on:** ${pym.focus}`);
    lines.push(`- **Avoid:** ${pym.avoid}`);
  } else {
    lines.push(`Personal Year ${py.value} — meaning not in database.`);
  }
  lines.push("");

  // Section 4: Compatibility (based on Life Path)
  const lpForCompat = reduceMaster(core.lifePath.value); // master numbers fall to single-digit table
  const baseLp = lpForCompat > 9 ? digitSum(lpForCompat) : lpForCompat;
  const comp = COMPATIBILITY[baseLp];
  lines.push(`## ❤️ Section 4 — Compatibility Snapshot`);
  lines.push(`Based on your Life Path **${core.lifePath.value}**${baseLp !== core.lifePath.value ? ` (reduced to ${baseLp} for the table)` : ""}:`);
  if (comp) {
    lines.push(`- **Best matches:** ${comp.best}`);
    lines.push(`- **Challenging matches:** ${comp.challenging}`);
  } else {
    lines.push(`Compatibility for ${baseLp} is not in the database.`);
  }
  lines.push("");

  // Closing
  lines.push(`---`);
  lines.push(`*Sword-honest closing:* The numbers above are facts of your chart. What you do with them is yours alone. Build true. 🗡️`);

  return lines.join("\n");
}
