import { bmFacts } from "@/data/facts-bm";
import { enFacts } from "@/data/facts-en";
import { snFacts } from "@/data/facts-sn";
import type { SubjectId, YearId } from "@/data/curriculum";

export type Vertical = { a: string; b: string; op: "+" | "-" | "×" | "÷" };

export type Question = {
  id: number;
  prompt: string;
  vertical?: Vertical;
  choices: string[];
  answer: number;
};

export const QUESTIONS_PER_TOPIC = 40;

/* ---------- deterministic random ---------- */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rand: () => number, min: number, max: number) {
  return min + Math.floor(rand() * (max - min + 1));
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function buildChoices(
  correct: string,
  pool: string[],
  rand: () => number,
): { choices: string[]; answer: number } {
  const uniquePool = shuffle(
    [...new Set(pool.filter((p) => p && p !== correct))],
    rand,
  ).slice(0, 3);
  while (uniquePool.length < 3) uniquePool.push(`${correct}${"*".repeat(uniquePool.length + 1)}`);
  const choices = shuffle([correct, ...uniquePool], rand);
  return { choices, answer: choices.indexOf(correct) };
}

/* ---------- language / science facts ---------- */
function misspell(word: string, rand: () => number, variantIndex: number): string {
  const chars = [...word];
  if (chars.length < 4) return `${word}e`;
  if (variantIndex === 0) {
    const i = 1 + Math.floor(rand() * (chars.length - 2));
    [chars[i], chars[i + 1]] = [chars[i + 1]!, chars[i]!];
    return chars.join("");
  }
  if (variantIndex === 1) {
    const vowelIndex = chars.findIndex((c, idx) => idx > 0 && "aeiou".includes(c.toLowerCase()));
    if (vowelIndex > 0) chars.splice(vowelIndex, 1);
    return chars.join("");
  }
  const i = 1 + Math.floor(rand() * (chars.length - 2));
  chars.splice(i, 0, chars[i]!);
  return chars.join("");
}

function maskAnswer(answer: string): string {
  return [...answer]
    .map((c, i) => (i === 0 || i === answer.length - 1 || c === " " ? c : "_"))
    .join(" ");
}

function factQuestions(facts: string[], seed: number, lang: "bm" | "en"): Question[] {
  const rand = rng(seed);
  const pairs = facts.map((line) => {
    const [q, a] = line.split("|");
    return { q: (q ?? "").trim(), a: (a ?? "").trim() };
  });
  const pool = pairs.map((p) => p.a);
  const out: Question[] = [];

  const label = {
    spelling: lang === "bm" ? "Ejaan manakah yang betul?" : "Which spelling is correct?",
    hint: lang === "bm" ? "Petunjuk" : "Hint",
  };

  for (const pair of pairs) {
    const built = buildChoices(pair.a, pool, rand);
    out.push({ id: 0, prompt: pair.q, ...built });
  }

  for (const pair of pairs) {
    const word = pair.a;
    if (/^[A-Za-z]{5,}$/.test(word)) {
      const wrongs = [0, 1, 2].map((i) => misspell(word, rand, i));
      const built = buildChoices(word, wrongs, rand);
      out.push({
        id: 0,
        prompt: `${label.spelling} (${pair.q})`,
        ...built,
      });
    } else {
      const built = buildChoices(pair.a, pool, rand);
      out.push({
        id: 0,
        prompt: `${pair.q} (${label.hint}: ${maskAnswer(word)})`,
        ...built,
      });
    }
  }

  for (const pair of pairs) {
    const built = buildChoices(pair.a, pool, rand);
    out.push({
      id: 0,
      prompt: `${pair.q} (${label.hint}: ${maskAnswer(pair.a)})`,
      ...built,
    });
  }

  const seen = new Set<string>();
  const unique = out.filter((q) => {
    if (seen.has(q.prompt)) return false;
    seen.add(q.prompt);
    return true;
  });

  return unique.slice(0, QUESTIONS_PER_TOPIC).map((q, i) => ({ ...q, id: i + 1 }));
}

/* ---------- mathematics ---------- */
const names = ["Ali", "Siti", "Mei Ling", "Kumar", "Aina", "Ravi"];
const things = ["biji epal", "batang pensel", "buku latihan", "biji guli", "biji rambutan"];

function numQ(prompt: string, correct: number, rand: () => number, suffix = ""): Question {
  const label = (n: number) => `${n}${suffix}`;
  const offsets = shuffle([1, -1, 2, -2, 10, -10, 3, -3], rand);
  const pool: string[] = [];
  for (const off of offsets) {
    const candidate = correct + off;
    if (candidate >= 0 && candidate !== correct) pool.push(label(candidate));
    if (pool.length >= 5) break;
  }
  const built = buildChoices(label(correct), pool, rand);
  return { id: 0, prompt, ...built };
}

function moneyLabel(cents: number) {
  return `RM${(cents / 100).toFixed(2)}`;
}

function mathQuestions(topic: string, year: YearId, seed: number): Question[] {
  const rand = rng(seed);
  const t = topic.toLowerCase();
  const out: Question[] = [];
  const max = year === "1" ? 100 : year === "2" ? 1000 : 10000;

  const addQ = (q: Question) => out.push(q);

  while (out.length < QUESTIONS_PER_TOPIC) {
    const i = out.length;

    if (t.startsWith("nombor")) {
      const kind = i % 4;
      const n = pickInt(rand, Math.floor(max / 10), max - 1);
      if (kind === 0) addQ(numQ(`Apakah nombor selepas ${n}?`, n + 1, rand));
      else if (kind === 1) addQ(numQ(`Apakah nombor sebelum ${n}?`, n - 1, rand));
      else if (kind === 2) {
        const digits = String(n).length;
        const place = pickInt(rand, 1, digits);
        const value = Number(String(n)[digits - place]) * 10 ** (place - 1);
        const placeName = ["sa", "puluh", "ratus", "ribu"][place - 1];
        addQ(numQ(`Apakah nilai digit dalam rumah ${placeName} bagi ${n}?`, value, rand));
      } else {
        const step = 10 ** pickInt(rand, 0, String(max).length - 2);
        addQ(numQ(`${n} + ${step} = ?`, n + step, rand));
      }
      continue;
    }

    if (t === "tambah") {
      const a = year === "1" ? pickInt(rand, 12, 89) : year === "2" ? pickInt(rand, 120, 899) : pickInt(rand, 1200, 8999);
      const b = year === "1" ? pickInt(rand, 11, 99 - 10) : year === "2" ? pickInt(rand, 105, 999) : pickInt(rand, 1005, 9999);
      out.push({
        ...numQ("Kira dalam bentuk lazim:", a + b, rand),
        vertical: { a: String(a), b: String(b), op: "+" },
      });
      continue;
    }

    if (t === "tolak") {
      const a = year === "1" ? pickInt(rand, 30, 99) : year === "2" ? pickInt(rand, 300, 999) : pickInt(rand, 3000, 9999);
      const b = year === "1" ? pickInt(rand, 11, 29) : year === "2" ? pickInt(rand, 105, 299) : pickInt(rand, 1005, 2999);
      out.push({
        ...numQ("Kira dalam bentuk lazim:", a - b, rand),
        vertical: { a: String(a), b: String(b), op: "-" },
      });
      continue;
    }

    if (t === "darab") {
      const a = year === "2" ? pickInt(rand, 12, 49) : pickInt(rand, 112, 499);
      const b = pickInt(rand, 2, 9);
      out.push({
        ...numQ("Kira dalam bentuk lazim:", a * b, rand),
        vertical: { a: String(a), b: String(b), op: "×" },
      });
      continue;
    }

    if (t === "bahagi") {
      const b = pickInt(rand, 2, 9);
      const q = pickInt(rand, 11, 120);
      out.push({
        ...numQ("Kira dalam bentuk lazim:", q, rand),
        vertical: { a: String(q * b), b: String(b), op: "÷" },
      });
      continue;
    }

    if (t === "pecahan") {
      const kind = i % 3;
      const den = pickInt(rand, 2, 10);
      const num = pickInt(rand, 1, den - 1);
      if (kind === 0) {
        const correct = `${num}/${den}`;
        const pool = [`${den}/${num}`, `${num + 1}/${den}`, `${num}/${den + 1}`, `${num}/${den - 1}`];
        const built = buildChoices(correct, pool, rand);
        out.push({
          id: 0,
          prompt: `Sebuah kek dibahagi kepada ${den} bahagian sama. ${num} bahagian dimakan. Apakah pecahan yang dimakan?`,
          ...built,
        });
      } else if (kind === 1) {
        const total = den * pickInt(rand, 2, 6);
        addQ(numQ(`${num}/${den} daripada ${total} ialah?`, (total / den) * num, rand));
      } else {
        const correct = `${den - num}/${den}`;
        const pool = [`${num}/${den}`, `${den}/${den - num}`, `${den - num}/${num}`, `1/${den}`];
        const built = buildChoices(correct, pool, rand);
        out.push({
          id: 0,
          prompt: `Ali makan ${num}/${den} sebiji piza. Berapakah pecahan yang tinggal?`,
          ...built,
        });
      }
      continue;
    }

    if (t === "wang") {
      const kind = i % 3;
      const a = pickInt(rand, 105, year === "1" ? 900 : 4500);
      const b = pickInt(rand, 55, year === "1" ? 400 : 2500);
      if (kind === 0) {
        const built = buildChoices(
          moneyLabel(a + b),
          [moneyLabel(a + b + 10), moneyLabel(a + b - 10), moneyLabel(a + b + 100), moneyLabel(Math.abs(a - b))],
          rand,
        );
        out.push({
          id: 0,
          prompt: `${names[i % names.length]!} membeli buku ${moneyLabel(a)} dan pen ${moneyLabel(b)}. Berapakah jumlahnya?`,
          ...built,
        });
      } else if (kind === 1) {
        const paid = Math.ceil((a + b) / 500) * 500;
        const change = paid - (a + b);
        const built = buildChoices(
          moneyLabel(change),
          [moneyLabel(change + 50), moneyLabel(change + 10), moneyLabel(Math.max(change - 50, 5)), moneyLabel(change + 100)],
          rand,
        );
        out.push({
          id: 0,
          prompt: `Siti membayar ${moneyLabel(paid)} untuk barang berharga ${moneyLabel(a + b)}. Berapakah bakinya?`,
          ...built,
        });
      } else {
        const built = buildChoices(
          moneyLabel(Math.abs(a - b)),
          [moneyLabel(Math.abs(a - b) + 20), moneyLabel(a + b), moneyLabel(Math.abs(a - b) + 100), moneyLabel(Math.abs(a - b) + 5)],
          rand,
        );
        out.push({
          id: 0,
          prompt: `Kumar ada ${moneyLabel(a)}. Dia belanja ${moneyLabel(b)} di kantin. Berapakah wang yang tinggal?`,
          ...built,
        });
      }
      continue;
    }

    if (t.startsWith("masa")) {
      const kind = i % 3;
      const h = pickInt(rand, 1, 12);
      const m = [0, 15, 30, 45][pickInt(rand, 0, 3)];
      if (kind === 0) {
        const correct = `${h}.${String(m).padStart(2, "0")}`;
        const pool = [`${h + 1}.${String(m).padStart(2, "0")}`, `${h}.${String((m + 15) % 60).padStart(2, "0")}`, `${h - 1 || 12}.${String(m).padStart(2, "0")}`, `${h}.05`];
        const built = buildChoices(correct, pool, rand);
        out.push({
          id: 0,
          prompt: `Jam menunjukkan ${h} jam ${m} minit. Bagaimana kita tulis waktu ini?`,
          ...built,
        });
      } else if (kind === 1) {
        addQ(numQ(`Berapakah minit dalam 3 jam? (1 jam = 60 minit)`, 180, rand, " minit"));
      } else {
        const mins = pickInt(rand, 20, 90);
        addQ(numQ(`Kelas bermula pukul 8.00 pagi dan tamat selepas ${mins} minit. Berapakah jumlah minit kelas itu?`, mins, rand, " minit"));
      }
      continue;
    }

    if (t.startsWith("bentuk")) {
      const shapes = [
        "Bentuk dengan 3 sisi ialah?|segi tiga",
        "Bentuk dengan 4 sisi sama ialah?|segi empat sama",
        "Bentuk tanpa bucu ialah?|bulatan",
        "Bentuk bola ialah?|sfera",
        "Bentuk tin susu ialah?|silinder",
        "Bentuk kotak tisu ialah?|kuboid",
        "Bentuk dadu ialah?|kubus",
        "Bentuk topi hari jadi ialah?|kon",
        "Berapa bucu segi tiga?|3",
        "Berapa sisi segi empat tepat?|4",
        "Berapa permukaan rata kubus?|6",
        "Bentuk yang boleh menggolek ialah?|sfera",
        "Bentuk piramid mempunyai tapak?|segi empat",
        "Berapa bucu bulatan?|0",
      ];
      return factQuestions(shapes, seed, "bm");
    }

    if (t === "panjang") {
      const kind = i % 3;
      const cm = pickInt(rand, 20, 400);
      if (kind === 0) addQ(numQ(`${cm} cm + ${pickInt(rand, 10, 90)} cm = ?`, cm + 50, rand, " cm"));
      else if (kind === 1) addQ(numQ(`Berapakah cm dalam ${pickInt(rand, 2, 9)} m? (1 m = 100 cm)`, 300, rand, " cm"));
      else addQ(numQ(`Riben Siti ${cm} cm. Dia potong 30 cm. Berapakah panjang yang tinggal?`, cm - 30, rand, " cm"));
      continue;
    }

    if (t === "jisim") {
      const kind = i % 3;
      const g = pickInt(rand, 150, 900);
      if (kind === 0) addQ(numQ(`${g} g + 100 g = ?`, g + 100, rand, " g"));
      else if (kind === 1) addQ(numQ(`Berapakah gram dalam ${pickInt(rand, 2, 8)} kg? (1 kg = 1000 g)`, 3000, rand, " g"));
      else addQ(numQ(`Beras 2 kg ditolak ${g} g. Berapakah jisim yang tinggal?`, 2000 - g, rand, " g"));
      continue;
    }

    if (t.startsWith("isipadu")) {
      const kind = i % 3;
      const ml = pickInt(rand, 150, 900);
      if (kind === 0) addQ(numQ(`${ml} ml + 250 ml = ?`, ml + 250, rand, " ml"));
      else if (kind === 1) addQ(numQ(`Berapakah ml dalam ${pickInt(rand, 2, 6)} liter? (1 l = 1000 ml)`, 2000, rand, " ml"));
      else addQ(numQ(`Jag berisi 1 liter air. Ali tuang ${ml} ml. Berapakah baki air?`, 1000 - ml, rand, " ml"));
      continue;
    }

    // Penyelesaian Masalah
    const name = names[i % names.length]!;
    const item = things[i % things.length]!;
    const kind = i % 4;
    const a = year === "1" ? pickInt(rand, 12, 60) : year === "2" ? pickInt(rand, 45, 400) : pickInt(rand, 120, 2500);
    const b = year === "1" ? pickInt(rand, 5, 30) : year === "2" ? pickInt(rand, 25, 300) : pickInt(rand, 60, 1200);
    if (kind === 0) {
      addQ(numQ(`${name} ada ${a} ${item}. Emaknya beri ${b} lagi. Berapakah jumlahnya?`, a + b, rand));
    } else if (kind === 1) {
      addQ(numQ(`${name} ada ${a} ${item}. Dia beri ${b} kepada rakannya. Berapakah bakinya?`, a - b, rand));
    } else if (kind === 2) {
      const m = pickInt(rand, 2, 9);
      addQ(numQ(`Satu kotak ada ${a} ${item}. Berapakah jumlah dalam ${m} kotak?`, a * m, rand));
    } else {
      const d = pickInt(rand, 2, 6);
      addQ(numQ(`${a * d} ${item} dibahagi sama rata kepada ${d} orang murid. Berapakah setiap orang dapat?`, a, rand));
    }
  }

  const seen = new Set<string>();
  const unique: Question[] = [];
  for (const q of out) {
    const key = q.prompt + (q.vertical ? `${q.vertical.a}${q.vertical.op}${q.vertical.b}` : "") + q.choices[q.answer];
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }
  let guard = 0;
  while (unique.length < QUESTIONS_PER_TOPIC && guard < 200) {
    const extra = pickInt(rand, 10, max - 1);
    const add = pickInt(rand, 10, 99);
    unique.push(numQ(`${extra} + ${add} = ?`, extra + add, rand));
    guard++;
  }
  return unique.slice(0, QUESTIONS_PER_TOPIC).map((q, i) => ({ ...q, id: i + 1 }));
}

const factBanks: Record<string, Record<YearId, Record<string, string[]>>> = {
  bm: bmFacts,
  en: enFacts,
  sn: snFacts,
};

export function getQuestions(subject: SubjectId, year: YearId, topic: string): Question[] {
  const seed = hash(`${subject}|${year}|${topic}`);
  if (subject === "mt") return mathQuestions(topic, year, seed);
  const facts = factBanks[subject]?.[year]?.[topic];
  if (!facts) return [];
  return factQuestions(facts, seed, subject === "en" ? "en" : "bm");
}
