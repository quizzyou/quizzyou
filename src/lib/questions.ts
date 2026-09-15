import { bmFacts } from "@/data/facts-bm";
import { enFacts } from "@/data/facts-en";
import { snFacts } from "@/data/facts-sn";
import { mtYear1ProblemSolving, mtYear3ProblemSolving } from "@/data/mcqs-mt";
import {
  snYear1KemahiranSaintifik,
  snYear1BahagianBadan,
  snYear1DeriaManusia,
  snYear1Haiwan,
  snYear1Tumbuhan,
  snYear1CahayaGelap,
} from "@/data/mcqs-sn";
import {
  bmYear1Huruf,
  bmYear1SukuKata,
  bmYear1FrasaAyat,
  bmYear1KataNamaAm,
  bmYear1KataKerja,
  bmYear2KataNama,
  bmYear2KataKerja,
  bmYear2KataAdjektif,
  bmYear2KataSendiNama,
  bmYear2KataHubung,
  bmYear2AyatTanya,
  bmYear2AyatPerintah,
  bmYear2Pemahaman,
  bmYear3KataGantiNama,
  bmYear3KataArah,
  bmYear3KataSeru,
  bmYear3SimpulanBahasa,
  bmYear3Peribahasa,
  bmYear3Pemahaman,
} from "@/data/mcqs-bm";
import {
  enYear1Alphabet,
  enYear1Phonics,
  enYear1Numbers,
  enYear1Colours,
  enYear1Family,
  enYear1Classroom,
  enYear2Grammar,
  enYear2FoodDrinks,
  enYear2Animals,
  enYear2DailyActivities,
  enYear2Places,
  enYear3Grammar,
  enYear3Verbs,
  enYear3Adjectives,
  enYear3Weather,
  enYear3Hobbies,
  enYear3Health,
  enYear3Comprehension,
} from "@/data/mcqs-en";
import type { SubjectId, YearId } from "@/data/curriculum";

export type Vertical = { a: string; b: string; op: "+" | "-" | "×" | "÷" };

export type Question = {
  id: number;
  prompt: string;
  vertical?: Vertical;
  answerMode?: "column-input";
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

function normaliseChoice(value: string): string {
  return value.trim().toLocaleLowerCase();
}

const relatedAnswerGroups = [
  ["gigi kacip", "gigi geraham", "gigi taring", "gigi bongsu"],
  ["mata", "telinga", "hidung", "lidah", "kulit"],
  ["penglihatan", "pendengaran", "bau", "rasa", "sentuh"],
  ["akar", "batang", "daun", "bunga", "buah", "biji benih"],
  ["herbivor", "karnivor", "omnivor"],
  ["penyejatan", "kondensasi", "presipitasi", "transpirasi"],
  ["peparu", "jantung", "hidung", "trakea", "diafragma", "insang"],
  ["kaca", "kertas", "kain", "logam", "getah", "plastik", "kayu", "kapas"],
  ["termometer", "tolok hujan", "vane angin", "kompas"],
  ["segi tiga", "segi empat sama", "segi empat tepat", "bulatan"],
  ["sfera", "silinder", "kuboid", "kubus", "kon", "piramid"],
  ["kata nama", "kata kerja", "kata adjektif", "kata sendi nama", "kata hubung"],
  ["noktah", "koma", "tanda soal", "tanda seru"],
  ["mother", "father", "brother", "sister", "grandmother", "grandfather", "uncle", "aunt", "cousin"],
  ["breakfast", "lunch", "dinner"],
  ["library", "market", "school", "clinic", "hospital", "post office", "bank", "cinema", "canteen"],
  ["sun", "rain", "wind", "thunder", "lightning", "clouds", "rainbow", "fog"],
  ["reading", "drawing", "singing", "swimming", "gardening", "cooking", "cycling", "dancing"],
];

function relatedAnswers(answer: string): string[] {
  const normalised = normaliseChoice(answer);
  const group = relatedAnswerGroups.find((items) =>
    items.some((item) => normaliseChoice(item) === normalised),
  );
  return group ?? [];
}

const promptStopWords = new Set([
  "yang", "ialah", "untuk", "apakah", "berapa", "dengan", "dalam", "daripada", "kepada",
  "which", "what", "where", "when", "does", "with", "from", "your", "the", "is", "are", "a",
]);

function promptTokens(prompt: string): Set<string> {
  return new Set(
    prompt
      .toLocaleLowerCase()
      .replace(/[^a-z0-9\p{L}]+/gu, " ")
      .split(" ")
      .filter((word) => word.length > 2 && !promptStopWords.has(word)),
  );
}

function answerKind(answer: string): string {
  if (/^rm\s?\d/i.test(answer)) return "money";
  if (/^\d+(?:[.:/]\d+)?(?:\s|$)/.test(answer)) return "number";
  if (/^[a-z]$/i.test(answer)) return "letter";
  if (/^[!?.,]$/.test(answer)) return "punctuation";
  return answer.includes(" ") ? "phrase" : "word";
}

function rankFactDistractors(
  correctPair: { q: string; a: string },
  pairs: { q: string; a: string }[],
  rand: () => number,
): string[] {
  const correct = normaliseChoice(correctPair.a);
  const targetTokens = promptTokens(correctPair.q);
  const targetKind = answerKind(correctPair.a);
  const explicitRelated = relatedAnswers(correctPair.a);
  const tieBreakers = new Map<string, number>();

  return [...pairs, ...explicitRelated.map((a) => ({ q: correctPair.q, a }))]
    .filter((candidate) => normaliseChoice(candidate.a) !== correct)
    .filter((candidate, index, all) =>
      all.findIndex((item) => normaliseChoice(item.a) === normaliseChoice(candidate.a)) === index,
    )
    .map((candidate) => {
      const key = normaliseChoice(candidate.a);
      if (!tieBreakers.has(key)) tieBreakers.set(key, rand());
      const candidateTokens = promptTokens(candidate.q);
      let sharedPromptWords = 0;
      targetTokens.forEach((word) => {
        if (candidateTokens.has(word)) sharedPromptWords += 1;
      });
      const inRelatedGroup = explicitRelated.some((item) => normaliseChoice(item) === key);
      const sameKind = answerKind(candidate.a) === targetKind;
      const lengthGap = Math.abs(candidate.a.length - correctPair.a.length);
      return {
        answer: candidate.a,
        score: (inRelatedGroup ? 100 : 0) + sharedPromptWords * 12 + (sameKind ? 5 : 0) - Math.min(lengthGap, 8),
        tie: tieBreakers.get(key) ?? 0,
      };
    })
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .map((candidate) => candidate.answer);
}

function buildChoices(
  correct: string,
  pool: string[],
  rand: () => number,
): { choices: string[]; answer: number } {
  const uniquePool = pool.filter(
    (candidate, index) =>
      candidate &&
      normaliseChoice(candidate) !== normaliseChoice(correct) &&
      pool.findIndex((item) => normaliseChoice(item) === normaliseChoice(candidate)) === index,
  ).slice(0, 3);
  const fallback = relatedAnswerGroups.flat().filter(
    (candidate) =>
      normaliseChoice(candidate) !== normaliseChoice(correct) &&
      !uniquePool.some((item) => normaliseChoice(item) === normaliseChoice(candidate)),
  );
  while (uniquePool.length < 3 && fallback.length > 0) {
    const candidate = fallback.shift();
    if (candidate) uniquePool.push(candidate);
  }
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

function fixedMCQQuestions(
  items: { prompt: string; choices: string[]; answer: string }[],
  seed: number,
): Question[] {
  const rand = rng(seed);
  const out = items.map((item) => {
    const choices = shuffle(item.choices, rand);
    const answer = choices.indexOf(item.answer);
    return { id: 0, prompt: item.prompt, choices, answer };
  });
  const seen = new Set<string>();
  const unique = out.filter((q) => {
    const key = `${q.prompt}|${q.choices[q.answer] ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.slice(0, QUESTIONS_PER_TOPIC).map((q, i) => ({ ...q, id: i + 1 }));
}

function factQuestions(facts: string[], seed: number, lang: "bm" | "en"): Question[] {
  const rand = rng(seed);
  const pairs = facts.map((line) => {
    const [q, a] = line.split("|");
    return { q: (q ?? "").trim(), a: (a ?? "").trim() };
  });
  const out: Question[] = [];

  const label = {
    spelling: lang === "bm" ? "Ejaan manakah yang betul?" : "Which spelling is correct?",
    hint: lang === "bm" ? "Petunjuk" : "Hint",
  };

  for (const pair of pairs) {
    const built = buildChoices(pair.a, rankFactDistractors(pair, pairs, rand), rand);
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
      const built = buildChoices(pair.a, rankFactDistractors(pair, pairs, rand), rand);
      out.push({
        id: 0,
        prompt: `${pair.q} (${label.hint}: ${maskAnswer(word)})`,
        ...built,
      });
    }
  }

  const revise = lang === "bm" ? "Ulang kaji" : "Revision";
  const startsWith = lang === "bm" ? "jawapan bermula dengan" : "the answer starts with";
  for (const pair of pairs) {
    const built = buildChoices(pair.a, rankFactDistractors(pair, pairs, rand), rand);
    out.push({
      id: 0,
      prompt: `${revise}: ${pair.q} (${startsWith} '${pair.a.charAt(0)}')`,
      ...built,
    });
  }

  const seen = new Set<string>();
  const unique = out.filter((q) => {
    const key = `${q.prompt}|${q.choices[q.answer] ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
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

function year2ColumnAdditionQuestions(): Question[] {
  const exercises: { a: number; b: number; prompt?: string }[] = [
    // 2 digit + 2 digit
    { a: 23, b: 14 },
    { a: 41, b: 36 },
    { a: 52, b: 27 },
    { a: 34, b: 45 },
    { a: 46, b: 17 },
    { a: 58, b: 26 },
    { a: 67, b: 18 },
    { a: 39, b: 44 },
    { a: 75, b: 16 },
    { a: 48, b: 37 },
    // 3 digit + 2 digit
    { a: 123, b: 45 },
    { a: 214, b: 32 },
    { a: 341, b: 28 },
    { a: 432, b: 56 },
    { a: 205, b: 74 },
    { a: 287, b: 59 },
    { a: 468, b: 25 },
    { a: 596, b: 87 },
    { a: 378, b: 65 },
    { a: 694, b: 29 },
    // 3 digit + 3 digit
    { a: 513, b: 264 },
    { a: 620, b: 179 },
    { a: 142, b: 637 },
    { a: 303, b: 486 },
    { a: 251, b: 438 },
    { a: 287, b: 159 },
    { a: 468, b: 275 },
    { a: 596, b: 187 },
    { a: 649, b: 286 },
    { a: 675, b: 325 },
    // Situasi harian Malaysia
    { a: 145, b: 230, prompt: "Ali ada 145 biji guli. Raju ada 230 biji guli. Berapakah jumlah guli mereka?" },
    { a: 268, b: 157, prompt: "Perpustakaan sekolah mempunyai 268 buah buku cerita dan menerima 157 buah lagi. Berapakah jumlah buku cerita sekarang?" },
    { a: 186, b: 249, prompt: "Cikgu Aina menyediakan 186 batang pensel. Cikgu Kumar membawa 249 batang lagi. Berapakah jumlah pensel semuanya?" },
    { a: 327, b: 186, prompt: "Siti mengumpul 327 biji rambutan dan Mei Ling mengumpul 186 biji. Berapakah jumlah rambutan mereka?" },
    { a: 475, b: 248, prompt: "Sebuah kantin menjual 475 kuih pada waktu pagi dan 248 kuih pada waktu rehat. Berapakah jumlah kuih yang dijual?" },
    { a: 189, b: 376, prompt: "Kedai sekolah mempunyai 189 batang pembaris dan menerima 376 batang lagi. Berapakah jumlah pembaris itu?" },
    { a: 295, b: 408, prompt: "Ravi mengutip 295 biji mangga dan ayahnya mengutip 408 biji lagi. Berapakah jumlah mangga mereka?" },
    { a: 456, b: 329, prompt: "Tabung kelas mengandungi RM456. Murid-murid menambah RM329. Berapakah jumlah wang di dalam tabung?" },
    { a: 638, b: 247, prompt: "Sekolah membeli 638 buah buku latihan dan 247 buah buku nota. Berapakah jumlah buku yang dibeli?" },
    { a: 574, b: 426, prompt: "Sebuah koperasi menerima 574 batang pen biru dan 426 batang pen hitam. Berapakah jumlah pen semuanya?" },
  ];

  return exercises.map(({ a, b, prompt }, i) => {
    const correct = String(a + b);
    return {
      id: i + 1,
      prompt: prompt ?? "Tambah nombor berikut dalam bentuk lazim.",
      vertical: { a: String(a), b: String(b), op: "+" },
      answerMode: "column-input",
      choices: [correct],
      answer: 0,
    };
  });
}

function year2ProblemSolvingQuestions(seed: number): Question[] {
  const items: { prompt: string; choices: string[]; answer: string }[] = [
    { prompt: "Ali ada 145 biji guli. Raju ada 230 biji guli. Berapakah jumlah guli mereka?", choices: ["375", "385", "365", "400"], answer: "375" },
    { prompt: "Sebuah kedai ada 500 buah buku latihan. 125 buah buku telah dijual. Berapakah baki buku yang tinggal?", choices: ["375", "425", "385", "475"], answer: "375" },
    { prompt: "Siti mengumpul 342 keping poskad. Hana mengumpul 158 keping poskad lebih daripada Siti. Berapakah bilangan poskad Hana?", choices: ["500", "490", "480", "510"], answer: "500" },
    { prompt: "Di dalam sebuah bakul ada 670 biji rambutan. 45 biji rambutan telah busuk. Berapakah rambutan yang elok?", choices: ["625", "635", "615", "645"], answer: "625" },
    { prompt: "Pak Mat memetik 215 biji mangga pada hari Isnin dan 189 biji pada hari Selasa. Berapakah jumlah mangga yang dipetik?", choices: ["404", "394", "414", "304"], answer: "404" },
    { prompt: "Sebuah kilang menghasilkan 890 buah kerusi. 320 buah kerusi dihantar ke Sekolah A dan 250 buah ke Sekolah B. Berapakah baki kerusi?", choices: ["320", "420", "570", "300"], answer: "320" },
    { prompt: "Klinik Kesihatan menerima 412 orang pesakit pada bulan Januari dan 398 orang pesakit pada bulan Februari. Berapakah jumlah pesakit untuk dua bulan itu?", choices: ["810", "800", "820", "790"], answer: "810" },
    { prompt: "Sebuah album boleh memuatkan 400 keping gambar. Muaz telah memasukkan 267 keping gambar. Berapakah ruang gambar yang tinggal?", choices: ["133", "233", "143", "123"], answer: "133" },
    { prompt: "Ada 5 buah meja di dalam sebuah bilik. Setiap meja ada 4 buah kerusi. Berapakah jumlah kerusi semuanya?", choices: ["20", "25", "15", "16"], answer: "20" },
    { prompt: "Ibu membeli 6 kotak kek cawan. Setiap kotak mengandungi 3 biji kek cawan. Berapakah jumlah kek cawan yang dibeli ibu?", choices: ["18", "15", "21", "24"], answer: "18" },
    { prompt: "Sebuah basikal mempunyai 2 roda. Berapakah jumlah roda bagi 9 buah basikal yang sama?", choices: ["18", "16", "20", "14"], answer: "18" },
    { prompt: "Di dalam sebuah kedai ada 7 buah rak baju. Setiap rak digantung dengan 5 helai baju. Berapakah jumlah baju di kedai itu?", choices: ["35", "30", "40", "45"], answer: "35" },
    { prompt: "Sani menyusun guli ke dalam 8 buah bekas. Setiap bekas dimasukkan 10 biji guli. Berapakah jumlah guli Sani?", choices: ["80", "70", "90", "85"], answer: "80" },
    { prompt: "Cikgu Aminah ada 20 batang pensel. Dia membahagikan pensel itu sama banyak kepada 4 orang murid. Berapakah pensel yang diterima oleh setiap murid?", choices: ["5", "4", "6", "10"], answer: "5" },
    { prompt: "Bapa memetik 24 biji manggis. Manggis itu dikongsi sama banyak antara 3 orang anaknya. Berapakah biji manggis seorang anak dapat?", choices: ["8", "6", "7", "9"], answer: "8" },
    { prompt: "Sebuah kotak mengandungi 30 biji pemadam. Pemadam itu dibahagikan kepada kumpulan yang terdiri daripada 5 biji. Berapakah jumlah kumpulan pemadam yang ada?", choices: ["6", "5", "7", "8"], answer: "6" },
    { prompt: "Kamal ada 45 biji biskut. Dia memasukkan biskut itu secara sama rata ke dalam 9 buah balang. Berapakah biji biskut di dalam setiap balang?", choices: ["5", "6", "4", "7"], answer: "5" },
    { prompt: "Ada 18 biji bola. Bola-bola itu disimpan ke dalam 2 buah bakul secara sama banyak. Berapakah bilangan bola di dalam setiap bakul?", choices: ["9", "8", "10", "7"], answer: "9" },
    { prompt: "Sebuah kek dipotong kepada 4 bahagian yang sama besar. Abang makan 1 bahagian. Berapakah pecahan kek yang telah dimakan oleh abang?", choices: ["Satu perdua", "Satu perempat", "Tiga perempat", "Dua perempat"], answer: "Satu perempat" },
    { prompt: "Ibu membahagikan sebiji tembikai kepada 10 bahagian yang sama besar. Kakak makan 3 bahagian. Nyatakan bahagian yang dimakan oleh kakak dalam perpuluhan.", choices: ["0.3", "0.1", "0.4", "0.2"], answer: "0.3" },
    { prompt: "Sebuah rajah dibahagikan kepada 5 bahagian yang sama. 2 bahagian telah diwarnakan. Berapakah pecahan rajah yang belum diwarnakan?", choices: ["Tiga perlima", "Dua perlima", "Satu perlima", "Empat perlima"], answer: "Tiga perlima" },
    { prompt: "Zaki menulis perpuluhan sifar perpuluhan enam pada papan hitam. Bagaimanakah angka bagi perpuluhan tersebut?", choices: ["0.6", "0.06", "6.0", "0.5"], answer: "0.6" },
    { prompt: "Aimi ada RM45. Ayah memberinya lagi RM20. Berapakah jumlah wang Aimi sekarang?", choices: ["RM65", "RM55", "RM75", "RM60"], answer: "RM65" },
    { prompt: "Haziq membeli sebuah buku cerita berharga RM18. Dia membayar dengan sekeping wang RM50. Berapakah baki wang yang diterimanya?", choices: ["RM32", "RM42", "RM22", "RM38"], answer: "RM32" },
    { prompt: "Harga sebatang pensel ialah 80 sen. Sarah membeli 3 batang pensel yang sama. Berapakah jumlah wang yang perlu dibayar oleh Sarah?", choices: ["RM2.40", "RM1.80", "RM2.00", "RM2.60"], answer: "RM2.40" },
    { prompt: "Simpanan Mei Ling ialah RM85. Dia menderma RM15 kepada tabung kebajikan. Berapakah baki wang simpanan Mei Ling?", choices: ["RM70", "RM60", "RM75", "RM80"], answer: "RM70" },
    { prompt: "Amir ada RM30. Dia mahu membeli sebuah beg sukan berharga RM48. Berapakah lagi wang yang diperlukan oleh Amir?", choices: ["RM18", "RM28", "RM8", "RM20"], answer: "RM18" },
    { prompt: "Sebuah jam menunjukkan jarum pendek di antara nombor 2 dan 3, manakala jarum panjang menunjuk tepat pada nombor 6. Pukul berapakah itu?", choices: ["Pukul 2:30", "Pukul 3:30", "Pukul 6:15", "Pukul 2:06"], answer: "Pukul 2:30" },
    { prompt: "Majlis hari jadi Danial bermula pada pukul 3:00 petang dan tamat selepas 2 jam. Pukul berapakah majlis itu tamat?", choices: ["Pukul 5:00 petang", "Pukul 4:00 petang", "Pukul 6:00 petang", "Pukul 1:00 petang"], answer: "Pukul 5:00 petang" },
    { prompt: "Fatin mengambil masa 45 minit untuk mengulang kaji pelajaran Matematik dan 15 minit untuk subjek Sains. Berapakah jumlah masa (dalam jam) yang digunakan oleh Fatin?", choices: ["1 jam", "2 jam", "30 minit", "1 jam 30 minit"], answer: "1 jam" },
    { prompt: "Panjang seutas tali A ialah 45 cm. Tali B pula panjangnya 35 cm. Berapakah jumlah panjang kedua-dua tali itu?", choices: ["80 cm", "70 cm", "90 cm", "75 cm"], answer: "80 cm" },
    { prompt: "Jisim sebuah tembikai ialah 3 kg. Jisim sebuah betik ialah 1 kg kurang daripada tembikai itu. Berapakah jisim betik?", choices: ["2 kg", "4 kg", "1 kg", "1.5 kg"], answer: "2 kg" },
    { prompt: "Sebuah botol mengandungi 500 mL air mineral. Ibu menuang lagi 450 mL air ke dalam botol itu. Berapakah jumlah isi padu air di dalam botol sekarang?", choices: ["950 mL", "850 mL", "1000 mL", "900 mL"], answer: "950 mL" },
    { prompt: "Tinggi sebuah kotak A ialah 60 cm. Kotak B adalah 15 cm lebih rendah daripada kotak A. Berapakah tinggi kotak B?", choices: ["45 cm", "55 cm", "75 cm", "50 cm"], answer: "45 cm" },
    { prompt: "Sebuah lori membawa 250 kg beras. Selepas menurunkan sebahagian beras di Kedai Runcit X, baki beras ialah 120 kg. Berapakah jisim beras yang diturunkan?", choices: ["130 kg", "120 kg", "140 kg", "370 kg"], answer: "130 kg" },
    { prompt: "Sebuah baldi ada 8 L air. Ayah menggunakan 3 L air untuk menyiram pokok bunga. Berapakah baki air di dalam baldi?", choices: ["5 L", "4 L", "6 L", "11 L"], answer: "5 L" },
    { prompt: "Raju sedang memegang satu bentuk 3D yang mempunyai 6 permukaan rata yang sama saiz, 8 bucu dan 12 sisi. Apakah bentuk itu?", choices: ["Kubus", "Kuboid", "Piramid", "Silinder"], answer: "Kubus" },
    { prompt: "Siti melukis satu bentuk 2D yang mempunyai 3 sisi lurus dan 3 bucu. Apakah nama bentuk 2D tersebut?", choices: ["Segi tiga", "Segi empat tepat", "Segi empat sama", "Bulatan"], answer: "Segi tiga" },
    { prompt: "Apakah bentuk 3D yang mempunyai 1 permukaan melengkung dan 2 permukaan rata berbentuk bulatan?", choices: ["Silinder", "Kon", "Sfera", "Kubus"], answer: "Silinder" },
    { prompt: "Sebuah kotak kasut mempunyai bentuk yang serupa dengan pepejal geometri yang mempunyai 6 permukaan rata (bukan semua sama saiz), 8 bucu dan 12 tepi. Apakah pepejal geometri ini?", choices: ["Kuboid", "Kubus", "Piramid", "Kon"], answer: "Kuboid" },
  ];
  const rand = rng(seed);
  return items.map((item, i) => {
    const choices = shuffle(item.choices, rand);
    const answer = choices.indexOf(item.answer);
    return { id: i + 1, prompt: item.prompt, choices, answer };
  });
}

function mathQuestions(topic: string, year: YearId, seed: number): Question[] {
  const rand = rng(seed);
  const t = topic.toLowerCase();
  const out: Question[] = [];
  const max = year === "1" ? 100 : year === "2" ? 1000 : 10000;

  if (year === "1" && t === "penyelesaian masalah") {
    return fixedMCQQuestions(mtYear1ProblemSolving, seed);
  }
  if (year === "3" && t === "penyelesaian masalah") {
    return fixedMCQQuestions(mtYear3ProblemSolving, seed);
  }
  if (year === "2" && t === "tambah") return year2ColumnAdditionQuestions();

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
      const m = [0, 15, 30, 45][pickInt(rand, 0, 3)]!;
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

    if (year === "2" && t === "penyelesaian masalah") {
      return year2ProblemSolvingQuestions(seed);
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
  if (subject === "sn" && year === "1" && topic === "Kemahiran Saintifik") {
    return fixedMCQQuestions(snYear1KemahiranSaintifik, seed);
  }
  if (subject === "sn" && year === "1" && topic === "Bahagian Badan Manusia") {
    return fixedMCQQuestions(snYear1BahagianBadan, seed);
  }
  if (subject === "sn" && year === "1" && topic === "Deria Manusia") {
    return fixedMCQQuestions(snYear1DeriaManusia, seed);
  }
  if (subject === "sn" && year === "1" && topic === "Haiwan") {
    return fixedMCQQuestions(snYear1Haiwan, seed);
  }
  if (subject === "sn" && year === "1" && topic === "Tumbuhan") {
    return fixedMCQQuestions(snYear1Tumbuhan, seed);
  }
  if (subject === "sn" && year === "1" && topic === "Cahaya dan Gelap") {
    return fixedMCQQuestions(snYear1CahayaGelap, seed);
  }

  if (subject === "bm" && year === "1" && topic === "Huruf") {
    return fixedMCQQuestions(bmYear1Huruf, seed);
  }
  if (subject === "bm" && year === "1" && topic === "Suku Kata") {
    return fixedMCQQuestions(bmYear1SukuKata, seed);
  }
  if (subject === "bm" && year === "1" && topic === "Frasa dan Ayat Mudah") {
    return fixedMCQQuestions(bmYear1FrasaAyat, seed);
  }
  if (subject === "bm" && year === "1" && topic === "Kata Nama Am") {
    return fixedMCQQuestions(bmYear1KataNamaAm, seed);
  }
  if (subject === "bm" && year === "1" && topic === "Kata Kerja") {
    return fixedMCQQuestions(bmYear1KataKerja, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Kata Nama") {
    return fixedMCQQuestions(bmYear2KataNama, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Kata Kerja") {
    return fixedMCQQuestions(bmYear2KataKerja, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Kata Adjektif") {
    return fixedMCQQuestions(bmYear2KataAdjektif, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Kata Sendi Nama") {
    return fixedMCQQuestions(bmYear2KataSendiNama, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Kata Hubung") {
    return fixedMCQQuestions(bmYear2KataHubung, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Ayat Tanya") {
    return fixedMCQQuestions(bmYear2AyatTanya, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Ayat Perintah") {
    return fixedMCQQuestions(bmYear2AyatPerintah, seed);
  }
  if (subject === "bm" && year === "2" && topic === "Pemahaman") {
    return fixedMCQQuestions(bmYear2Pemahaman, seed);
  }
  if (subject === "bm" && year === "3" && topic === "Kata Ganti Nama") {
    return fixedMCQQuestions(bmYear3KataGantiNama, seed);
  }
  if (subject === "bm" && year === "3" && topic === "Kata Arah") {
    return fixedMCQQuestions(bmYear3KataArah, seed);
  }
  if (subject === "bm" && year === "3" && topic === "Kata Seru") {
    return fixedMCQQuestions(bmYear3KataSeru, seed);
  }
  if (subject === "bm" && year === "3" && topic === "Simpulan Bahasa") {
    return fixedMCQQuestions(bmYear3SimpulanBahasa, seed);
  }
  if (subject === "bm" && year === "3" && topic === "Peribahasa Mudah") {
    return fixedMCQQuestions(bmYear3Peribahasa, seed);
  }
  if (subject === "bm" && year === "3" && topic === "Pemahaman") {
    return fixedMCQQuestions(bmYear3Pemahaman, seed);
  }
  if (subject === "en" && year === "1" && topic === "Alphabet") {
    return fixedMCQQuestions(enYear1Alphabet, seed);
  }
  if (subject === "en" && year === "1" && topic === "Phonics") {
    return fixedMCQQuestions(enYear1Phonics, seed);
  }
  if (subject === "en" && year === "1" && topic === "Numbers") {
    return fixedMCQQuestions(enYear1Numbers, seed);
  }
  if (subject === "en" && year === "1" && topic === "Colours") {
    return fixedMCQQuestions(enYear1Colours, seed);
  }
  if (subject === "en" && year === "1" && topic === "Family") {
    return fixedMCQQuestions(enYear1Family, seed);
  }
  if (subject === "en" && year === "1" && topic === "My Classroom") {
    return fixedMCQQuestions(enYear1Classroom, seed);
  }
  if (subject === "en" && year === "2" && topic === "Grammar in Context") {
    return fixedMCQQuestions(enYear2Grammar, seed);
  }
  if (subject === "en" && year === "2" && topic === "Food & Drinks") {
    return fixedMCQQuestions(enYear2FoodDrinks, seed);
  }
  if (subject === "en" && year === "2" && topic === "Animals") {
    return fixedMCQQuestions(enYear2Animals, seed);
  }
  if (subject === "en" && year === "2" && topic === "Daily Activities") {
    return fixedMCQQuestions(enYear2DailyActivities, seed);
  }
  if (subject === "en" && year === "2" && topic === "Places") {
    return fixedMCQQuestions(enYear2Places, seed);
  }
  if (subject === "en" && year === "3" && topic === "Grammar in Context") {
    return fixedMCQQuestions(enYear3Grammar, seed);
  }
  if (subject === "en" && year === "3" && topic === "Verbs") {
    return fixedMCQQuestions(enYear3Verbs, seed);
  }
  if (subject === "en" && year === "3" && topic === "Adjectives") {
    return fixedMCQQuestions(enYear3Adjectives, seed);
  }
  if (subject === "en" && year === "3" && topic === "Weather") {
    return fixedMCQQuestions(enYear3Weather, seed);
  }
  if (subject === "en" && year === "3" && topic === "Hobbies") {
    return fixedMCQQuestions(enYear3Hobbies, seed);
  }
  if (subject === "en" && year === "3" && topic === "Health") {
    return fixedMCQQuestions(enYear3Health, seed);
  }
  if (subject === "en" && year === "3" && topic === "Comprehension") {
    return fixedMCQQuestions(enYear3Comprehension, seed);
  }
  const facts = factBanks[subject]?.[year]?.[topic];
  if (!facts) return [];
  return factQuestions(facts, seed, subject === "en" ? "en" : "bm");
}
