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

/* ---------- deterministic soalan ---------- */
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
  sum: number;
  cols: number;
  /** digit setiap lajur, index 0 = Sa (paling kanan) */
  aDigits: (number | null)[];
  bDigits: (number | null)[];
  answerDigits: number[];
  /** carry masuk ke lajur ini (index 0 = Sa, selalu 0) */
  carries: number[];
};

function digitsOf(n: number, cols: number): (number | null)[] {
  const s = String(n);
  return Array.from({ length: cols }, (_, i) => {
    const ch = s[s.length - 1 - i];
    return ch === undefined ? null : Number(ch);
  });
}

export function buildSoalan(index: number, year: string = "2"): Soalan {
  const rand = rng(9187 + index * 7919 + Number(year) * 131);
  const pick = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  let a: number;
  let b: number;
  if (year === "1") {
    // Tahun 1: tambah dalam lingkungan 100
    a = pick(5, 89);
    b = pick(2, 99 - a);
    if (b < 2) b = 2;
  } else if (year === "3") {
    // Tahun 3: nombor 3-4 digit
    const size = () => (rand() < 0.4 ? pick(105, 899) : pick(1005, 6999));
    a = size();
    b = size();
    if (a + b > 9999) b = pick(105, 899);
  } else {
    const size = () => (rand() < 0.45 ? pick(12, 99) : pick(105, 899));
    a = size();
    b = size();
    if (a + b > 9999) b = pick(12, 99);
  }
  const sum = a + b;
  const cols = Math.max(String(sum).length, String(a).length, String(b).length);
  const aDigits = digitsOf(a, cols);
  const bDigits = digitsOf(b, cols);
  const answerDigits: number[] = [];
  const carries: number[] = Array(cols).fill(0);
  let incoming = 0;
  for (let i = 0; i < cols; i++) {
    carries[i] = incoming;
    const total = (aDigits[i] ?? 0) + (bDigits[i] ?? 0) + incoming;
    answerDigits[i] = total % 10;
    incoming = Math.floor(total / 10);
  }
  return { a, b, sum, cols, aDigits, bDigits, answerDigits, carries };
}

type Box = { kind: "answer" | "carry"; col: number };

function boxOrder(s: Soalan): Box[] {
  const order: Box[] = [];
  for (let i = 0; i < s.cols; i++) {
    order.push({ kind: "answer", col: i });
    if (i + 1 < s.cols && (s.carries[i + 1] ?? 0) > 0) order.push({ kind: "carry", col: i + 1 });
  }
  return order;
}

const boxKey = (b: Box) => `${b.kind}-${b.col}`;

/* ---------- komponen utama ---------- */
export function TambahLazim({
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

  const soalan = useMemo(() => buildSoalan(index, year), [index, year]);
  const order = useMemo(() => boxOrder(soalan), [soalan]);

  const startBox = order[0] ? boxKey(order[0]) : null;

  const resetBoxes = () => {
    setValues({});
    setActive(startBox);
    setChecked(false);
    setAllCorrect(false);
  };

  const begin = () => {
    sfx.click();
    setActive(startBox);
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

  const clearAll = () => {
    if (checked) return;
    sfx.tap();
    setValues({});
    setActive(startBox);
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
    const contoh = buildSoalan(0, year);
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        {header}
        <section className="card-soft animate-pop-in p-5 text-center">
          <p className="font-display text-xl font-extrabold">Cara Lazim Tambah</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Kira dari lajur Sa. Jika jumlah lebih daripada 9, tulis nombor simpan di kotak oren di
            atas lajur seterusnya.
          </p>
          <div className="mt-4">
            <SoalanPapan
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
        ? "Tepat sekali! Kamu hebat dalam bentuk lazim!"
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
          <p className="mt-1 text-lg font-bold text-muted-foreground">{percent}%</p>
          <p className="mt-3 text-3xl">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={`star-${i}`} className={i < stars ? "" : "opacity-25"}>
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
          {index + 1} / {TOTAL}
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
        Tambah dalam bentuk lazim
      </p>

      <SoalanPapan
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
              onClick={clearAll}
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

/* ---------- papan bentuk lazim ---------- */
function SoalanPapan({
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
  const leftToRight = Array.from({ length: cols }, (_, i) => cols - 1 - i); // index lajur (0 = Sa)
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
    <section className="card-soft mt-4 px-3 py-5" aria-label="Bentuk lazim tambah">
      <div
        className="ml-7 grid gap-1 text-center text-[11px] text-muted-foreground sm:text-xs"
        style={gridStyle}
      >
        {leftToRight.map((col) => (
          <span key={`place-${col}`}>{PLACE_NAMES[col] ?? ""}</span>
        ))}
      </div>

      <div className="ml-7 grid gap-2 py-2" style={gridStyle} aria-label="Kotak simpan">
        {leftToRight.map((col) => {
          const key = `carry-${col}`;
          if (col === 0) {
            return <span key={key} className="mx-auto h-8 w-8" aria-hidden="true" />;
          }
          if (!needsCarry(col)) {
            return (
              <span
                key={key}
                className="mx-auto h-8 w-8 rounded-md border-2 border-dashed border-border/60"
              />
            );
          }
          const value = values[key] ?? "";
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={`Kotak simpan ${PLACE_NAMES[col] ?? ""}`}
              className={`tap-pop mx-auto grid h-8 w-8 place-items-center rounded-md border-2 border-carry-border bg-carry font-display text-base font-extrabold ${
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

      <div className="grid grid-cols-[1.75rem_1fr] items-center text-center font-display text-3xl font-extrabold">
        <span aria-hidden="true" />
        <div className="grid" style={gridStyle}>
          {leftToRight.map((col) => (
            <span key={`top-${col}`}>{soalan.aDigits[col] ?? ""}</span>
          ))}
        </div>
        <span aria-hidden="true">+</span>
        <div className="grid" style={gridStyle}>
          {leftToRight.map((col) => (
            <span key={`bottom-${col}`}>{soalan.bDigits[col] ?? ""}</span>
          ))}
        </div>
      </div>

      <div className="mt-2 border-t-4 border-foreground/60 pt-3">
        <div className="ml-7 grid gap-2" style={gridStyle}>
          {leftToRight.map((col) => {
            const key = `answer-${col}`;
            const value = values[key] ?? "";
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                aria-label={`Jawapan ${PLACE_NAMES[col] ?? ""}`}
                className={`tap-pop aspect-square min-w-0 rounded-xl border-2 font-display text-2xl font-extrabold shadow-soft ${stateClass(
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
