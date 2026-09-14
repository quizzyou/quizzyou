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

  const revise = lang === "bm" ? "Ulang kaji" : "Revision";
  const startsWith = lang === "bm" ? "jawapan bermula dengan" : "the answer starts with";
  for (const pair of pairs) {
    const built = buildChoices(pair.a, pool, rand);
    out.push({
      id: 0,
      prompt: `${revise}: ${pair.q} (${startsWith} '${pair.a.charAt(0)}')`,
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

function year2ProblemSolvingQuestions(): Question[] {
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
  return items.map((item, i) => {
    const answer = item.choices.indexOf(item.answer);
    return { id: i + 1, prompt: item.prompt, choices: item.choices, answer };
  });
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
      return year2ProblemSolvingQuestions();
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
