import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Confetti } from "@/components/Confetti";
import { Emoji } from "@/components/Emoji";
import { clearProgress, loadProgress, saveProgress } from "@/lib/progress";
import { sfx } from "@/lib/audio";

const TOTAL = 40;
const LIVES = 5;
const PLACE_NAMES = ["Sa", "Puluh", "Ratus", "Ribu"];

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

type Soalan = {
  a: number;
  b: number;
  product: number;
  cols: number;
  /** digit setiap lajur, index 0 = Sa (paling kanan) */
  aDigits: (number | null)[];
  bDigits: (number | null)[];
  answerDigits: number[];
  /** carry masuk ke lajur ini (index 0 = Sa, selalu 0) */
  carries: number[];
  /** Kotak simpan hanya digunakan untuk latihan Tahun 3 */
  showCarry: boolean;
  prompt: string | undefined;
};

const YEAR_2_BANK: { a: number; b: number; prompt?: string }[] = [
  { a: 2, b: 2 }, { a: 3, b: 2 }, { a: 4, b: 2 }, { a: 5, b: 2 },
  { a: 3, b: 3 }, { a: 4, b: 3 }, { a: 5, b: 3 }, { a: 4, b: 4 },
  { a: 5, b: 5 }, { a: 10, b: 2 },
  { a: 11, b: 2 }, { a: 12, b: 2 }, { a: 13, b: 3 }, { a: 14, b: 2 },
  { a: 15, b: 3 }, { a: 16, b: 2 }, { a: 17, b: 4 }, { a: 18, b: 3 },
  { a: 19, b: 5 }, { a: 20, b: 4 },
  { a: 21, b: 3 }, { a: 22, b: 4 }, { a: 23, b: 5 }, { a: 24, b: 3 },
  { a: 25, b: 4 }, { a: 28, b: 5 }, { a: 32, b: 3 }, { a: 36, b: 2 },
  { a: 42, b: 5 }, { a: 47, b: 4 },
  { a: 12, b: 3, prompt: "Siti menyusun 3 bakul. Setiap bakul mempunyai 12 biji epal. Berapakah jumlah epal?" },
  { a: 15, b: 4, prompt: "Ali mempunyai 4 rak. Setiap rak mengandungi 15 buah buku. Berapakah jumlah buku?" },
  { a: 18, b: 2, prompt: "Cikgu Aina menyediakan 2 kotak. Setiap kotak ada 18 batang pensel. Berapakah jumlah pensel?" },
  { a: 21, b: 3, prompt: "Mei Ling membeli 3 pek minuman. Setiap pek mempunyai 21 kotak minuman. Berapakah jumlahnya?" },
  { a: 24, b: 4, prompt: "Harga sebuah buku ialah RM24. Berapakah harga 4 buah buku?" },
  { a: 27, b: 5, prompt: "Kumar mengisi 5 bakul dengan 27 biji epal dalam setiap bakul. Berapakah jumlah epal?" },
  { a: 31, b: 2, prompt: "Dua kelas menerima 31 buah buku setiap kelas. Berapakah jumlah buku?" },
  { a: 34, b: 3, prompt: "Tiga kumpulan menerima 34 batang pensel setiap kumpulan. Berapakah jumlah pensel?" },
  { a: 38, b: 4, prompt: "Empat meja mempunyai 38 kotak minuman setiap meja. Berapakah jumlahnya?" },
  { a: 45, b: 5, prompt: "Lima orang murid menyimpan RM45 setiap seorang. Berapakah jumlah wang mereka?" },
];

const YEAR_3_BANK: { a: number; b: number; prompt?: string }[] = [
  { a: 123, b: 2 }, { a: 211, b: 3 }, { a: 312, b: 2 }, { a: 412, b: 2 },
  { a: 203, b: 3 }, { a: 321, b: 2 }, { a: 402, b: 2 }, { a: 221, b: 4 },
  { a: 132, b: 3 }, { a: 311, b: 3 },
  { a: 148, b: 2 }, { a: 263, b: 3 }, { a: 374, b: 2 }, { a: 486, b: 2 },
  { a: 527, b: 3 }, { a: 638, b: 2 }, { a: 749, b: 2 }, { a: 854, b: 3 },
  { a: 965, b: 2 }, { a: 576, b: 4 },
  { a: 189, b: 5 }, { a: 278, b: 6 }, { a: 367, b: 7 }, { a: 456, b: 8 },
  { a: 545, b: 9 }, { a: 634, b: 7 }, { a: 723, b: 8 }, { a: 812, b: 9 },
  { a: 907, b: 6 }, { a: 986, b: 9 },
  { a: 124, b: 3, prompt: "Siti membeli 3 kotak pensel. Setiap kotak ada 124 batang pensel. Berapakah jumlah pensel?" },
  { a: 132, b: 4, prompt: "Ali menyusun 4 rak buku. Setiap rak mempunyai 132 buah buku. Berapakah jumlah buku?" },
  { a: 145, b: 6, prompt: "Mei Ling memasukkan 145 biji oren ke dalam setiap 6 bakul. Berapakah jumlah oren?" },
  { a: 158, b: 7, prompt: "Kumar membeli 7 pek pelekat. Setiap pek ada 158 keping. Berapakah jumlah pelekat?" },
  { a: 105, b: 3, prompt: "Cikgu Aina menyediakan 3 kotak. Setiap kotak mengandungi 105 batang pensel. Berapakah jumlah pensel?" },
  { a: 126, b: 4, prompt: "Sebuah sekolah membeli 4 set buku, setiap set mengandungi 126 buah buku. Berapakah jumlah buku?" },
  { a: 215, b: 5, prompt: "Lima kelas mengumpul 215 biji penutup botol setiap kelas. Berapakah jumlah semuanya?" },
  { a: 238, b: 6, prompt: "Harga sebuah kerusi belajar ialah RM238. Berapakah harga 6 buah kerusi?" },
  { a: 347, b: 7, prompt: "Tujuh kedai menerima 347 kotak susu setiap satu. Berapakah jumlah kotak susu?" },
  { a: 468, b: 8, prompt: "Lapan dusun masing-masing menghasilkan 468 biji mangga. Berapakah jumlah mangga?" },
];

function digitsOf(n: number, cols: number): (number | null)[] {
  const s = String(n);
  return Array.from({ length: cols }, (_, i) => {
    const ch = s[s.length - 1 - i];
    return ch === undefined ? null : Number(ch);
  });
}

export function buildSoalanDarab(index: number, year: string = "3"): Soalan {
  const rand = rng(5501 + index * 6151 + Number(year) * 227);
  const pick = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  let a: number;
  let b: number;
  const showCarry = year === "3";
  let prompt: string | undefined;
  if (year === "1") {
    // Tahun 1: sifir 2, 3, 4, 5 — satu digit darab satu digit
    const sifir = [2, 3, 4, 5];
    b = sifir[pick(0, sifir.length - 1)] ?? 2;
    a = pick(2, 9);
  } else if (year === "2") {
    const item = YEAR_2_BANK[index % YEAR_2_BANK.length] ?? YEAR_2_BANK[0];
    if (!item) return buildSoalanDarab(0, "1");
    a = item.a;
    b = item.b;
    prompt = item.prompt;
  } else {
    // Tahun 3: bank tersusun daripada mudah kepada sukar, 1 digit pengganda sahaja.
    const item = YEAR_3_BANK[index % YEAR_3_BANK.length] ?? YEAR_3_BANK[0];
    if (!item) return buildSoalanDarab(0, "2");
    a = item.a;
    b = item.b;
    prompt = item.prompt;
  }
  const product = a * b;
  const cols = year === "3"
    ? Math.max(3, String(product).length, String(a).length)
    : year === "2"
      ? Math.max(2, String(product).length, String(a).length)
      : Math.max(String(product).length, String(a).length);
  const aDigits = digitsOf(a, cols);
  const bDigits = digitsOf(b, cols);
  const answerDigits: number[] = [];
  const carries: number[] = Array(cols).fill(0);
  let incoming = 0;
  for (let i = 0; i < cols; i++) {
    carries[i] = incoming;
    const total = (aDigits[i] ?? 0) * b + incoming;
    answerDigits[i] = total % 10;
    incoming = Math.floor(total / 10);
  }
  return { a, b, product, cols, aDigits, bDigits, answerDigits, carries, showCarry, prompt };
}

type Box = { kind: "answer" | "carry"; col: number };

function boxOrder(s: Soalan): Box[] {
  const order: Box[] = [];
  const answerColumns = String(s.product).length;
  for (let i = 0; i < answerColumns; i++) {
    order.push({ kind: "answer", col: i });
    if (s.showCarry && i + 1 < s.cols && (s.carries[i + 1] ?? 0) > 0) {
      order.push({ kind: "carry", col: i + 1 });
    }
  }
  return order;
}

const boxKey = (b: Box) => `${b.kind}-${b.col}`;

export function DarabLazim({
  subject,
  year,
  topic,
  topicName,
  subjectName,
}: {
  subject: string;
  year: string;
  topic: string;
  topicName: string;
  subjectName: string;
}) {
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(TOTAL).fill(null));
  const [values, setValues] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);

  useEffect(() => {
    const saved = loadProgress(subject, year, topic);
    if (saved && saved.index > 0 && saved.index < TOTAL) {
      setIndex(saved.index);
      setScore(saved.score);
      setAnswers(saved.answers ?? Array(TOTAL).fill(null));
    }
  }, [subject, year, topic]);

  const soalan = useMemo(() => buildSoalanDarab(index, year), [index, year]);
  const order = useMemo(() => boxOrder(soalan), [soalan]);

  const resetBoxes = () => {
    setValues({});
    setActive(null);
    setChecked(false);
    setAllCorrect(false);
  };

  const begin = () => {
    sfx.click();
    setActive(null);
    setPhase("play");
  };

  const expected = (b: Box) =>
    b.kind === "answer" ? String(soalan.answerDigits[b.col] ?? 0) : String(soalan.carries[b.col] ?? 0);

  const filled = order.every((b) => values[boxKey(b)]);

  const enter = (digit: string) => {
    if (checked || !active) return;
    sfx.tap();
    setValues((current) => ({ ...current, [active]: digit }));
    const pos = order.findIndex((b) => boxKey(b) === active);
    const next = order[pos + 1];
    setActive(next ? boxKey(next) : null);
  };

  const backspace = () => {
    if (checked) return;
    sfx.tap();
    if (active && values[active]) {
      setValues((current) => ({ ...current, [active]: "" }));
      return;
    }
    const pos = active ? order.findIndex((b) => boxKey(b) === active) : order.length;
    const prev = order[pos - 1];
    if (!prev) return;
    setActive(boxKey(prev));
    setValues((current) => ({ ...current, [boxKey(prev)]: "" }));
  };

  const check = () => {
    if (checked || !filled) return;
    const ok = order.every((b) => values[boxKey(b)] === expected(b));
    setChecked(true);
    setAllCorrect(ok);
    if (ok) sfx.correct();
    else sfx.wrong();

    const nextAnswers = [...answers];
    nextAnswers[index] = ok ? 1 : 0;
    const nextScore = score + (ok ? 1 : 0);
    const nextLives = ok ? lives : lives - 1;
    setAnswers(nextAnswers);
    setScore(nextScore);
    setLives(nextLives);
    saveProgress(subject, year, topic, { index, score: nextScore, answers: nextAnswers });
  };

  const nextQuestion = () => {
    sfx.click();
    const nextIndex = index + 1;
    if (lives <= 0 || nextIndex >= TOTAL) {
      clearProgress(subject, year, topic);
      setPhase("done");
      sfx.celebrate();
      return;
    }
    setIndex(nextIndex);
    saveProgress(subject, year, topic, { index: nextIndex, score, answers });
    resetBoxes();
  };

  const restart = () => {
    sfx.click();
    clearProgress(subject, year, topic);
    setIndex(0);
    setScore(0);
    setLives(LIVES);
    setAnswers(Array(TOTAL).fill(null));
    resetBoxes();
    setPhase("play");
  };

  const header = (
    <PageHeader
      title={topicName}
      subtitle={`${subjectName} · Tahun ${year} · Bentuk Lazim`}
      backTo="/subjek/$subject/$year"
      backParams={{ subject, year }}
    />
  );

  if (phase === "intro") {
    const contoh = buildSoalanDarab(0, year);
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        {header}
        <section className="card-soft animate-pop-in p-5 text-center">
          <p className="font-display text-xl font-extrabold">Cara Lazim Darab</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {soalan.showCarry
              ? "Darab dari lajur Sa. Jika hasil lebih daripada 9, tulis nombor simpan di kotak oren di atas lajur seterusnya."
              : "Darab nombor di bawah dengan nombor di atas, kemudian tulis jawapan dalam kotak."}
          </p>
          <div className="mt-4">
            <DarabPapan
              soalan={contoh}
              values={Object.fromEntries([
                ...contoh.answerDigits.map((d, i) => [`answer-${i}`, String(d)]),
                ...contoh.carries.map((c, i) => [`carry-${i}`, c ? String(c) : ""]),
              ])}
              order={boxOrder(contoh)}
              active={null}
              checked
              expected={() => ""}
              onSelect={() => {}}
              demo
            />
          </div>
          <p className="mt-4 text-sm font-bold">
            40 soalan · 5 nyawa <Emoji emoji="❤️" /> · kumpul bintang!
          </p>
          <button
            type="button"
            onClick={begin}
            className="tap-pop mt-4 w-full rounded-3xl bg-mint py-4 font-display text-lg font-extrabold shadow-soft"
          >
            Mula
          </button>
        </section>
      </main>
    );
  }

  if (phase === "done") {
    const attempted = Math.max(1, answers.filter((a) => a !== null).length);
    const percent = Math.round((score / attempted) * 100);
    const stars = percent >= 80 ? 3 : percent >= 50 ? 2 : 1;
    const message =
      stars === 3
        ? "Tepat sekali! Kamu hebat dalam darab bentuk lazim!"
        : stars === 2
          ? "Bagus! Sedikit lagi untuk 3 bintang!"
          : "Jangan putus asa. Cuba lagi, kamu pasti boleh!";
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        <Confetti count={50} />
        {header}
        <section className="card-soft animate-pop-in p-7 text-center">
          <p className="font-display text-5xl font-extrabold">
            {score}
            <span className="text-2xl text-muted-foreground"> / {attempted}</span>
          </p>
          <p className="mt-1 text-lg font-bold text-muted-foreground">{percent}% betul</p>
          <p className="mt-3 text-3xl">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={`star-${i}`} className={i < stars ? "" : "opacity-20"}>
                <Emoji emoji="⭐" />
              </span>
            ))}
          </p>
          <p className="mt-3 font-display text-lg font-bold">{message}</p>
        </section>
        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={restart}
            className="tap-pop rounded-3xl bg-sky py-4 font-display text-lg font-extrabold shadow-soft"
          >
            Cuba Lagi
          </button>
          <Link
            to="/subjek/$subject/$year"
            params={{ subject, year }}
            onClick={() => sfx.click()}
            className="tap-pop rounded-3xl bg-lavender py-4 text-center font-display text-lg font-extrabold shadow-soft"
          >
            Kembali ke Topik
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      {header}

      <div className="mb-1 flex items-center justify-between text-sm font-bold text-muted-foreground">
        <span>
          Soalan {index + 1} / {TOTAL}
        </span>
        <span aria-label={`${lives} nyawa`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <span key={`life-${i}`} className={i < lives ? "" : "opacity-20"}>
              <Emoji emoji="❤️" />
            </span>
          ))}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-card shadow-soft">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((index + 1) / TOTAL) * 100}%` }}
        />
      </div>

      <p className="mt-4 text-center font-display text-lg font-extrabold">
        {soalan.prompt ?? "Darab dalam bentuk lazim"}
      </p>

      <DarabPapan
        soalan={soalan}
        values={values}
        order={order}
        active={active}
        checked={checked}
        expected={(b) => expected(b)}
        onSelect={(k) => {
          if (checked) return;
          sfx.tap();
          setActive(k);
        }}
      />

      {checked && (
        <p
          className={`mt-3 text-center font-display text-base font-extrabold ${
            allCorrect ? "text-foreground" : "text-destructive-foreground"
          }`}
        >
          {allCorrect ? "Tepat sekali!" : "Belum tepat, lihat kotak merah."}
        </p>
      )}
      {checked && allCorrect && <Confetti count={26} seed={index + 1} />}

      {!checked ? (
        <>
          <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2" aria-label="Papan nombor">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit, i) => (
              <button
                key={digit}
                type="button"
                onClick={() => enter(digit)}
                className={`tap-pop h-12 rounded-2xl font-display text-xl font-extrabold shadow-soft ${
                  ["bg-sky", "bg-peach", "bg-lavender", "bg-lemon"][i % 4]
                }`}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={backspace}
              aria-label="Backspace"
              className="tap-pop h-12 rounded-2xl bg-peach font-display text-xl font-extrabold shadow-soft"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => enter("0")}
              className="tap-pop h-12 rounded-2xl bg-sky font-display text-xl font-extrabold shadow-soft"
            >
              0
            </button>
            <button
              type="button"
              onClick={backspace}
              className="tap-pop h-12 rounded-2xl bg-lavender px-2 font-display text-sm font-extrabold shadow-soft"
            >
              Padam
            </button>
          </div>
          <button
            type="button"
            onClick={check}
            disabled={!filled}
            className="tap-pop mt-4 w-full rounded-3xl bg-mint py-4 font-display text-lg font-extrabold shadow-soft disabled:opacity-40"
          >
            Semak Jawapan
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={nextQuestion}
          className="tap-pop mt-4 w-full rounded-3xl bg-sky py-4 font-display text-lg font-extrabold shadow-soft"
        >
          {lives <= 0 || index + 1 >= TOTAL ? "Lihat Keputusan" : "Soalan Seterusnya"}
        </button>
      )}

      <Link
        to="/subjek/$subject/$year"
        params={{ subject, year }}
        onClick={() => sfx.tap()}
        className="mt-6 block text-center text-sm font-bold text-muted-foreground"
      >
        Simpan &amp; keluar
      </Link>
    </main>
  );
}

function DarabPapan({
  soalan,
  values,
  order,
  active,
  checked,
  expected,
  onSelect,
  demo = false,
}: {
  soalan: Soalan;
  values: Record<string, string>;
  order: Box[];
  active: string | null;
  checked: boolean;
  expected: (b: Box) => string;
  onSelect: (key: string) => void;
  demo?: boolean;
}) {
  const cols = soalan.cols;
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
  const leftToRight = Array.from({ length: cols }, (_, i) => cols - 1 - i);
  const needsCarry = (col: number) => order.some((b) => b.kind === "carry" && b.col === col);

  const stateClass = (key: string, value: string, exp: string) => {
    if (checked && !demo) {
      return value === exp
        ? "border-answer-active bg-mint"
        : "border-destructive bg-destructive text-destructive-foreground";
    }
    return active === key
      ? "border-answer-active ring-2 ring-answer-active/30 bg-card"
      : "border-border bg-card";
  };

  return (
    <section className="card-soft mt-4 px-3 py-5" aria-label="Bentuk lazim darab">
      <div
        className="ml-7 grid gap-1 text-center text-[11px] text-muted-foreground sm:text-xs"
        style={gridStyle}
      >
        {leftToRight.map((col) => (
          <span key={`place-${col}`}>{PLACE_NAMES[col] ?? ""}</span>
        ))}
      </div>

      {soalan.showCarry && (
        <div className="ml-7 grid gap-2 py-2" style={gridStyle} aria-label="Kotak simpan">
          {leftToRight.map((col) => {
            const key = `carry-${col}`;
            const required = needsCarry(col);
            if (col === 0 || !required) {
              return <span key={key} className="mx-auto h-8 w-8" aria-hidden="true" />;
            }
            const value = values[key] ?? "";
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                aria-label={`Kotak simpan ${PLACE_NAMES[col] ?? ""}`}
                className={`tap-pop mx-auto flex h-8 w-8 items-center justify-center rounded-md border-2 border-carry-border bg-carry font-display text-base font-extrabold ${
                  checked && !demo
                    ? values[key] === expected({ kind: "carry", col })
                      ? "border-answer-active"
                      : "border-destructive"
                    : active === key
                      ? "ring-2 ring-answer-active/40"
                      : ""
                }`}
              >
                <span className={value ? "animate-carry-in" : ""}>{value}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-[1.75rem_1fr] items-center text-center font-display text-3xl font-extrabold">
        <span aria-hidden="true" />
        <div className="grid" style={gridStyle}>
          {leftToRight.map((col) => (
            <span key={`top-${col}`} className="flex min-h-12 items-center justify-center">
              {soalan.aDigits[col] ?? ""}
            </span>
          ))}
        </div>
        <span aria-hidden="true" className="flex min-h-12 items-center justify-center">
          ×
        </span>
        <div className="grid" style={gridStyle}>
          {leftToRight.map((col) => (
            <span key={`bottom-${col}`} className="flex min-h-12 items-center justify-center">
              {soalan.bDigits[col] ?? ""}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 border-t-4 border-foreground/60 pt-3">
        <div className="ml-7 grid gap-2" style={gridStyle}>
          {leftToRight.map((col) => {
            const key = `answer-${col}`;
            if (col >= String(soalan.product).length) {
              return <span key={key} className="aspect-square min-w-0" aria-hidden="true" />;
            }
            const value = values[key] ?? "";
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                aria-label={`Jawapan ${PLACE_NAMES[col] ?? ""}`}
                className={`tap-pop flex aspect-square min-w-0 items-center justify-center rounded-xl border-2 font-display text-2xl font-extrabold shadow-soft ${stateClass(
                  key,
                  value,
                  expected({ kind: "answer", col }),
                )}`}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
