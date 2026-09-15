import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Emoji } from "@/components/Emoji";
import { PageHeader } from "@/components/PageHeader";
import { sfx } from "@/lib/audio";
import { clearProgress, loadProgress, saveProgress } from "@/lib/progress";

const TOTAL = 40;
const LIVES = 5;
const PLACE_NAMES = ["Sa", "Puluh", "Ratus", "Ribu"];

type BorrowChange = { col: number; from: number; to: number };
type BorrowStep = { targetCol: number; changes: BorrowChange[] };
type SoalanTolak = {
  a: number;
  b: number;
  difference: number;
  cols: number;
  aDigits: number[];
  bDigits: (number | null)[];
  answerDigits: number[];
  borrowSteps: BorrowStep[];
  prompt: string;
};

type BankItem = [a: number, b: number, prompt?: string];

const BANK: BankItem[] = [
  [694, 228], [87, 35], [76, 24], [98, 47], [65, 32], [543, 221], [786, 354], [975, 432], [864, 243], [759, 418],
  [72, 38], [83, 47], [95, 56], [154, 28], [263, 47], [482, 65], [571, 83], [643, 128], [754, 236], [862, 347],
  [110, 29], [200, 76], [300, 148], [402, 186], [500, 267], [601, 284], [700, 356], [804, 467], [900, 578], [1000, 486],
  [245, 123, "Ali ada 245 biji guli. Dia memberikan 123 biji kepada Raju. Berapa biji guli yang tinggal?"],
  [380, 145, "Perpustakaan mempunyai 380 buah buku. Sebanyak 145 buah dipinjam. Berapa buah buku yang masih ada?"],
  [275, 89, "Cikgu Aina menyediakan 275 batang pensel. Murid menggunakan 89 batang. Berapa batang pensel yang tinggal?"],
  [450, 176, "Sebuah kedai mempunyai 450 biji epal. Sebanyak 176 biji telah dijual. Berapa biji epal yang tinggal?"],
  [625, 238, "Siti mengumpul 625 pelekat. Dia memberikan 238 pelekat kepada kawannya. Berapa pelekat yang tinggal?"],
  [730, 286, "Kantin sekolah menyediakan 730 kotak susu. Sebanyak 286 kotak diminum. Berapa kotak yang tinggal?"],
  [500, 167, "Kumar mempunyai RM500. Dia membelanjakan RM167 untuk barangan sekolah. Berapakah baki wangnya?"],
  [814, 359, "Stor sekolah menyimpan 814 buah buku latihan. Sebanyak 359 buah telah digunakan. Berapa buah yang tinggal?"],
  [960, 485, "Kebun mempunyai 960 biji buah. Sebanyak 485 biji dipetik. Berapa biji buah yang masih ada?"],
  [703, 268, "Mei Ling ada 703 keping kad. Dia memberikan 268 keping kepada rakan. Berapa keping kad yang tinggal?"],
];

function digitsOf(value: number, cols: number, padWithZero: boolean) {
  const text = String(value);
  return Array.from({ length: cols }, (_, col) => {
    const digit = text[text.length - 1 - col];
    return digit === undefined ? (padWithZero ? 0 : null) : Number(digit);
  });
}

export function buildSoalanTolak(index: number): SoalanTolak {
  const item = BANK[index % BANK.length] ?? BANK[0];
  const [a, b, context] = item ?? [694, 228];
  const difference = a - b;
  const cols = Math.max(String(a).length, String(b).length);
  const aDigits = digitsOf(a, cols, true) as number[];
  const bDigits = digitsOf(b, cols, false);
  const answerDigits = digitsOf(difference, cols, true) as number[];
  const working = [...aDigits];
  const borrowSteps: BorrowStep[] = [];

  for (let col = 0; col < cols; col++) {
    const bottom = bDigits[col] ?? 0;
    if ((working[col] ?? 0) >= bottom) continue;
    let donor = col + 1;
    while (donor < cols && (working[donor] ?? 0) === 0) donor++;
    if (donor >= cols) continue;

    const changes: BorrowChange[] = [];
    const donorBefore = working[donor] ?? 0;
    working[donor] = donorBefore - 1;
    changes.push({ col: donor, from: donorBefore, to: donorBefore - 1 });

    for (let middle = donor - 1; middle > col; middle--) {
      const before = working[middle] ?? 0;
      working[middle] = before + 9;
      changes.push({ col: middle, from: before, to: before + 9 });
    }

    const targetBefore = working[col] ?? 0;
    working[col] = targetBefore + 10;
    changes.push({ col, from: targetBefore, to: targetBefore + 10 });
    borrowSteps.push({ targetCol: col, changes });
  }

  return {
    a,
    b,
    difference,
    cols,
    aDigits,
    bDigits,
    answerDigits,
    borrowSteps,
    prompt: context ?? `Kira ${a} − ${b} dalam bentuk lazim.`,
  };
}

export function TolakLazim({
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
  const [values, setValues] = useState<Record<number, string>>({});
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);
  const [revealedBorrows, setRevealedBorrows] = useState<number[]>([]);

  useEffect(() => {
    const saved = loadProgress(subject, year, topic);
    if (saved && saved.index > 0 && saved.index < TOTAL) {
      setIndex(saved.index);
      setScore(saved.score);
      setAnswers(saved.answers ?? Array(TOTAL).fill(null));
    }
  }, [subject, year, topic]);

  const soalan = useMemo(() => buildSoalanTolak(index), [index]);
  const order = useMemo(() => Array.from({ length: soalan.cols }, (_, col) => col), [soalan.cols]);
  const filled = order.every((col) => values[col] !== undefined && values[col] !== "");

  const resetBoard = () => {
    setValues({});
    setActive(0);
    setChecked(false);
    setAllCorrect(false);
    setRevealedBorrows([]);
  };

  const enter = (digit: string) => {
    if (checked) return;
    sfx.tap();
    setValues((current) => ({ ...current, [active]: digit }));
    if (soalan.borrowSteps.some((step) => step.targetCol === active)) {
      setRevealedBorrows((current) => (current.includes(active) ? current : [...current, active]));
    }
    setActive(Math.min(active + 1, soalan.cols - 1));
  };

  const backspace = () => {
    if (checked) return;
    sfx.tap();
    if (values[active]) {
      setValues((current) => ({ ...current, [active]: "" }));
      setRevealedBorrows((current) => current.filter((col) => col !== active));
      return;
    }
    const previous = Math.max(0, active - 1);
    setActive(previous);
    setValues((current) => ({ ...current, [previous]: "" }));
    setRevealedBorrows((current) => current.filter((col) => col !== previous));
  };

  const clearAll = () => {
    if (checked) return;
    sfx.tap();
    resetBoard();
  };

  const check = () => {
    if (checked || !filled) return;
    const ok = order.every((col) => values[col] === String(soalan.answerDigits[col] ?? 0));
    setChecked(true);
    setAllCorrect(ok);
    setRevealedBorrows(soalan.borrowSteps.map((step) => step.targetCol));
    ok ? sfx.correct() : sfx.wrong();

    const nextAnswers = [...answers];
    nextAnswers[index] = ok ? 1 : 0;
    const nextScore = score + (ok ? 1 : 0);
    setAnswers(nextAnswers);
    setScore(nextScore);
    setLives((current) => (ok ? current : current - 1));
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
    resetBoard();
  };

  const restart = () => {
    sfx.click();
    clearProgress(subject, year, topic);
    setIndex(0);
    setScore(0);
    setLives(LIVES);
    setAnswers(Array(TOTAL).fill(null));
    resetBoard();
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
    const example = buildSoalanTolak(0);
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        {header}
        <section className="card-soft animate-pop-in p-5 text-center">
          <p className="font-display text-xl font-extrabold">Cara Lazim Tolak</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Kira dari lajur Sa. Jika digit di atas lebih kecil, pinjam daripada lajur di sebelah kiri.
          </p>
          <TolakBoard
            soalan={example}
            values={Object.fromEntries(example.answerDigits.map((digit, col) => [col, String(digit)]))}
            active={null}
            checked={false}
            revealedBorrows={example.borrowSteps.map((step) => step.targetCol)}
            onSelect={() => {}}
            demo
          />
          <p className="mt-4 text-sm font-bold">40 soalan · 5 nyawa <Emoji emoji="❤️" /> · kumpul bintang!</p>
          <button type="button" onClick={() => { sfx.click(); setPhase("play"); }} className="tap-pop mt-4 w-full rounded-3xl bg-mint py-4 font-display text-lg font-extrabold shadow-soft">
            Mula
          </button>
        </section>
      </main>
    );
  }

  if (phase === "done") {
    const attempted = Math.max(1, answers.filter((answer) => answer !== null).length);
    const percent = Math.round((score / attempted) * 100);
    const stars = percent >= 80 ? 3 : percent >= 50 ? 2 : 1;
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        <Confetti count={50} />
        {header}
        <section className="card-soft animate-pop-in p-7 text-center">
          <p className="font-display text-5xl font-extrabold">{score}<span className="text-2xl text-muted-foreground"> / {attempted}</span></p>
          <p className="mt-1 text-lg font-bold text-muted-foreground">{percent}%</p>
          <p className="mt-3 text-3xl" aria-label={`${stars} bintang`}>
            {Array.from({ length: 3 }, (_, i) => <span key={i} className={i < stars ? "" : "opacity-25"}><Emoji emoji="⭐" /></span>)}
          </p>
          <p className="mt-3 font-display text-lg font-bold">{stars === 3 ? "Hebat! Kamu mahir menolak!" : stars === 2 ? "Bagus! Teruskan berlatih!" : "Jangan putus asa. Kamu pasti boleh!"}</p>
        </section>
        <div className="mt-5 grid gap-3">
          <button type="button" onClick={restart} className="tap-pop rounded-3xl bg-sky py-4 font-display text-lg font-extrabold shadow-soft">Cuba Lagi</button>
          <Link to="/subjek/$subject/$year" params={{ subject, year }} onClick={() => sfx.click()} className="tap-pop rounded-3xl bg-lavender py-4 text-center font-display text-lg font-extrabold shadow-soft">Kembali ke Topik</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      {header}
      <div className="mb-1 flex items-center justify-between text-sm font-bold text-muted-foreground">
        <span>{index + 1} / {TOTAL}</span>
        <span aria-label={`${lives} nyawa`}>{Array.from({ length: LIVES }, (_, i) => <span key={i} className={i < lives ? "" : "opacity-20"}><Emoji emoji="❤️" /></span>)}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-card shadow-soft">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((index + 1) / TOTAL) * 100}%` }} />
      </div>
      <p className="mt-4 text-center font-display text-base font-extrabold">{soalan.prompt}</p>
      <TolakBoard soalan={soalan} values={values} active={active} checked={checked} revealedBorrows={revealedBorrows} onSelect={(col) => { if (!checked) { sfx.tap(); setActive(col); } }} />

      {checked && <p className={`mt-3 text-center font-display text-base font-extrabold ${allCorrect ? "text-foreground" : "text-destructive-foreground"}`}>{allCorrect ? "Tepat sekali!" : "Belum tepat, lihat kotak merah."}</p>}
      {checked && allCorrect && <Confetti count={26} seed={index + 1} />}

      {!checked ? (
        <>
          <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2" aria-label="Papan nombor">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit, i) => <button key={digit} type="button" onClick={() => enter(digit)} className={`tap-pop h-12 rounded-2xl font-display text-xl font-extrabold shadow-soft ${["bg-sky", "bg-peach", "bg-lavender", "bg-lemon"][i % 4]}`}>{digit}</button>)}
            <button type="button" onClick={backspace} aria-label="Backspace" className="tap-pop h-12 rounded-2xl bg-peach font-display text-xl font-extrabold shadow-soft">⌫</button>
            <button type="button" onClick={() => enter("0")} className="tap-pop h-12 rounded-2xl bg-sky font-display text-xl font-extrabold shadow-soft">0</button>
            <button type="button" onClick={clearAll} className="tap-pop h-12 rounded-2xl bg-lavender px-2 font-display text-sm font-extrabold shadow-soft">Padam</button>
          </div>
          <button type="button" onClick={check} disabled={!filled} className="tap-pop mt-4 w-full rounded-3xl bg-mint py-4 font-display text-lg font-extrabold shadow-soft disabled:opacity-40">Semak Jawapan</button>
        </>
      ) : (
        <button type="button" onClick={nextQuestion} className="tap-pop mt-4 w-full rounded-3xl bg-sky py-4 font-display text-lg font-extrabold shadow-soft">{lives <= 0 || index + 1 >= TOTAL ? "Lihat Keputusan" : "Soalan Seterusnya"}</button>
      )}
      <Link to="/subjek/$subject/$year" params={{ subject, year }} onClick={() => sfx.tap()} className="mt-6 block text-center text-sm font-bold text-muted-foreground">Simpan &amp; keluar</Link>
    </main>
  );
}

function TolakBoard({
  soalan,
  values,
  active,
  checked,
  revealedBorrows,
  onSelect,
  demo = false,
}: {
  soalan: SoalanTolak;
  values: Record<number, string>;
  active: number | null;
  checked: boolean;
  revealedBorrows: number[];
  onSelect: (col: number) => void;
  demo?: boolean;
}) {
  const gridStyle = { gridTemplateColumns: `repeat(${soalan.cols}, minmax(0, 1fr))` };
  const leftToRight = Array.from({ length: soalan.cols }, (_, index) => soalan.cols - 1 - index);
  const visibleChange = (col: number) => {
    const steps = soalan.borrowSteps.filter((step) => revealedBorrows.includes(step.targetCol));
    for (let index = steps.length - 1; index >= 0; index--) {
      const change = steps[index]?.changes.find((item) => item.col === col);
      if (change) return change;
    }
    return undefined;
  };

  return (
    <section className="card-soft mt-4 px-3 py-5" aria-label="Bentuk lazim tolak">
      <div className="ml-7 grid gap-1 text-center text-[11px] text-muted-foreground sm:text-xs" style={gridStyle}>
        {leftToRight.map((col) => <span key={col}>{PLACE_NAMES[col] ?? ""}</span>)}
      </div>
      <div className="mt-3 grid grid-cols-[1.75rem_1fr] items-end text-center font-display text-3xl font-extrabold">
        <span aria-hidden="true" />
        <div className="grid min-h-14 items-end" style={gridStyle}>
          {leftToRight.map((col) => {
            const change = visibleChange(col);
            const original = change?.from ?? soalan.aDigits[col];
            return (
              <span key={`top-${col}`} className="relative inline-grid min-h-14 place-items-end center">
                {change && <span className="animate-carry-in absolute top-0 text-base text-destructive-foreground">{change.to}</span>}
                <span className="relative">
                  {original}
                  {change && <span className="absolute left-1/2 top-1/2 h-0.5 w-7 -translate-x-1/2 -translate-y-1/2 -rotate-[25deg] bg-destructive" aria-hidden="true" />}
                </span>
              </span>
            );
          })}
        </div>
        <span aria-hidden="true">−</span>
        <div className="grid" style={gridStyle}>{leftToRight.map((col) => <span key={`bottom-${col}`}>{soalan.bDigits[col] ?? ""}</span>)}</div>
      </div>
      <div className="mt-2 border-t-4 border-foreground/60 pt-3">
        <div className="ml-7 grid gap-2" style={gridStyle}>
          {leftToRight.map((col) => {
            const value = values[col] ?? "";
            const correct = value === String(soalan.answerDigits[col] ?? 0);
            const state = checked && !demo
              ? correct ? "border-answer-active bg-mint" : "border-destructive bg-destructive text-destructive-foreground"
              : active === col ? "border-answer-active ring-2 ring-answer-active/30 bg-card" : "border-border bg-card";
            return <button key={col} type="button" onClick={() => onSelect(col)} aria-label={`Jawapan ${PLACE_NAMES[col] ?? ""}`} className={`tap-pop aspect-square min-w-0 rounded-xl border-2 font-display text-2xl font-extrabold shadow-soft ${state}`}>{value}</button>;
          })}
        </div>
      </div>
    </section>
  );
}