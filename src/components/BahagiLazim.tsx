import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Confetti } from "@/components/Confetti";
import { Emoji } from "@/components/Emoji";
import { clearProgress, loadProgress, saveProgress } from "@/lib/progress";
import { sfx } from "@/lib/audio";

const TOTAL = 40;
const LIVES = 5;

type BankItem = { dividend: number; divisor: number; prompt?: string };
type DivisionStep = {
  chunk: number;
  quotientDigit: number;
  product: number;
  remainder: number;
  endColumn: number;
  nextDigit: number | null;
};
type SoalanBahagi = BankItem & {
  quotient: number;
  remainder: number;
  dividendDigits: number[];
  quotientDigits: number[];
  quotientOffset: number;
  steps: DivisionStep[];
};
type Box = { kind: "quotient" | "remainder"; index: number };

const BANK: BankItem[] = [
  // 20 soalan 2-digit ÷ 1-digit (pelbagai, bukan pola sama)
  { dividend: 12, divisor: 2 }, { dividend: 15, divisor: 3 },
  { dividend: 21, divisor: 3 }, { dividend: 28, divisor: 4 },
  { dividend: 35, divisor: 5 }, { dividend: 42, divisor: 6 },
  { dividend: 49, divisor: 7 }, { dividend: 56, divisor: 8 },
  { dividend: 18, divisor: 2 }, { dividend: 24, divisor: 3 },
  { dividend: 32, divisor: 4 }, { dividend: 45, divisor: 5 },
  { dividend: 54, divisor: 6 }, { dividend: 48, divisor: 8 },
  { dividend: 72, divisor: 9 }, { dividend: 17, divisor: 2 },
  { dividend: 23, divisor: 4 }, { dividend: 31, divisor: 5 },
  { dividend: 37, divisor: 6 }, { dividend: 59, divisor: 7 },
  // 20 soalan 3-digit ÷ 1-digit (pelbagai, bukan pola sama)
  { dividend: 123, divisor: 3 }, { dividend: 145, divisor: 5 },
  { dividend: 168, divisor: 4 }, { dividend: 224, divisor: 7 },
  { dividend: 315, divisor: 9 }, { dividend: 408, divisor: 6 },
  { dividend: 504, divisor: 8 }, { dividend: 612, divisor: 9 },
  { dividend: 132, divisor: 4 }, { dividend: 175, divisor: 5 },
  { dividend: 216, divisor: 6 }, { dividend: 261, divisor: 3 },
  { dividend: 348, divisor: 4 }, { dividend: 432, divisor: 6 },
  { dividend: 567, divisor: 7 }, { dividend: 648, divisor: 8 },
  { dividend: 729, divisor: 9 }, { dividend: 137, divisor: 2 },
  { dividend: 253, divisor: 5 }, { dividend: 389, divisor: 4 },
];

function buildSteps(dividend: number, divisor: number): DivisionStep[] {
  const digits = String(dividend).split("").map(Number);
  const steps: DivisionStep[] = [];
  let chunk = 0;
  let started = false;
  for (let column = 0; column < digits.length; column++) {
    chunk = chunk * 10 + (digits[column] ?? 0);
    if (!started && chunk < divisor && column < digits.length - 1) continue;
    started = true;
    const quotientDigit = Math.floor(chunk / divisor);
    const product = quotientDigit * divisor;
    const remainder = chunk - product;
    steps.push({
      chunk,
      quotientDigit,
      product,
      remainder,
      endColumn: column,
      nextDigit: digits[column + 1] ?? null,
    });
    chunk = remainder;
  }
  return steps;
}

export function buildSoalanBahagi(index: number): SoalanBahagi {
  const item = BANK[index % BANK.length] ?? BANK[0];
  if (!item) throw new Error("Bank soalan Bahagi kosong");
  const quotient = Math.floor(item.dividend / item.divisor);
  const remainder = item.dividend % item.divisor;
  const dividendDigits = String(item.dividend).split("").map(Number);
  const quotientDigits = String(quotient).split("").map(Number);
  return {
    ...item,
    quotient,
    remainder,
    dividendDigits,
    quotientDigits,
    quotientOffset: dividendDigits.length - quotientDigits.length,
    steps: buildSteps(item.dividend, item.divisor),
  };
}

const boxKey = (box: Box) => `${box.kind}-${box.index}`;

export function BahagiLazim({
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

  const soalan = useMemo(() => buildSoalanBahagi(index), [index]);
  const order = useMemo<Box[]>(() => [
    ...soalan.quotientDigits.map((_, i) => ({ kind: "quotient" as const, index: i })),
    ...(soalan.remainder > 0 ? [{ kind: "remainder" as const, index: 0 }] : []),
  ], [soalan]);

  const expected = (box: Box) => box.kind === "quotient"
    ? String(soalan.quotientDigits[box.index] ?? 0)
    : String(soalan.remainder);
  const filled = order.every((box) => Boolean(values[boxKey(box)]));
  // Dedahkan langkah kerja hanya apabila digit hasil bahagi yang dimasukkan BETUL,
  // mengikut urutan dari kiri. Digit salah tidak mendedahkan langkah.
  const revealedSteps = soalan.quotientDigits.reduce(
    (count, digit, i) =>
      count === i && values[`quotient-${i}`] === String(digit) ? count + 1 : count,
    0,
  );

  const resetBoard = () => {
    setValues({});
    setActive(null);
    setChecked(false);
    setAllCorrect(false);
  };

  const enter = (digit: string) => {
    if (checked || !active) return;
    sfx.tap();
    setValues((current) => ({ ...current, [active]: digit }));
    const position = order.findIndex((box) => boxKey(box) === active);
    const next = order[position + 1];
    setActive(next ? boxKey(next) : null);
  };

  const backspace = () => {
    if (checked) return;
    sfx.tap();
    if (active && values[active]) {
      setValues((current) => ({ ...current, [active]: "" }));
      return;
    }
    const position = active ? order.findIndex((box) => boxKey(box) === active) : order.length;
    const previous = order[position - 1];
    if (!previous) return;
    const key = boxKey(previous);
    setActive(key);
    setValues((current) => ({ ...current, [key]: "" }));
  };

  const check = () => {
    if (checked || !filled) return;
    const correct = order.every((box) => values[boxKey(box)] === expected(box));
    setChecked(true);
    setAllCorrect(correct);
    if (correct) sfx.correct();
    else sfx.wrong();

    const nextAnswers = [...answers];
    nextAnswers[index] = correct ? 1 : 0;
    const nextScore = score + (correct ? 1 : 0);
    const nextLives = correct ? lives : lives - 1;
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
    const example = buildSoalanBahagi(8);
    const demoValues = Object.fromEntries([
      ...example.quotientDigits.map((digit, i) => [`quotient-${i}`, String(digit)]),
      ...(example.remainder > 0 ? [["remainder-0", String(example.remainder)]] : []),
    ]);
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        {header}
        <section className="card-soft animate-pop-in p-5 text-center">
          <p className="font-display text-xl font-extrabold">Cara Lazim Bahagi</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bahagi, darab, tolak, kemudian turunkan digit seterusnya.
          </p>
          <BahagiPapan
            soalan={example}
            values={demoValues}
            active={null}
            checked
            expected={() => ""}
            revealedSteps={example.steps.length}
            onSelect={() => {}}
            demo
          />
          <p className="mt-4 text-sm font-bold">
            40 soalan · 5 nyawa <Emoji emoji="❤️" /> · kumpul bintang!
          </p>
          <Button
            type="button"
            onClick={() => { sfx.click(); setPhase("play"); }}
            className="tap-pop mt-4 h-auto w-full rounded-3xl bg-mint py-4 font-display text-lg font-extrabold text-foreground shadow-soft hover:bg-mint/90"
          >
            Mula
          </Button>
        </section>
      </main>
    );
  }

  if (phase === "done") {
    const attempted = Math.max(1, answers.filter((answer) => answer !== null).length);
    const percent = Math.round((score / attempted) * 100);
    const stars = percent >= 80 ? 3 : percent >= 50 ? 2 : 1;
    const message = stars === 3
      ? "Hebat! Kamu mahir bahagi bentuk lazim!"
      : stars === 2
        ? "Bagus! Sedikit lagi untuk 3 bintang!"
        : "Jangan putus asa. Cuba lagi, kamu pasti boleh!";
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        <Confetti count={50} />
        {header}
        <section className="card-soft animate-pop-in p-7 text-center">
          <p className="font-display text-5xl font-extrabold">
            {score}<span className="text-2xl text-muted-foreground"> / {attempted}</span>
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
          <Button type="button" onClick={restart} className="tap-pop h-auto rounded-3xl bg-sky py-4 font-display text-lg font-extrabold text-foreground shadow-soft hover:bg-sky/90">
            Cuba Lagi
          </Button>
          <Link to="/subjek/$subject/$year" params={{ subject, year }} onClick={() => sfx.click()} className="tap-pop rounded-3xl bg-lavender py-4 text-center font-display text-lg font-extrabold shadow-soft">
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
        <span>Soalan {index + 1} / {TOTAL}</span>
        <span aria-label={`${lives} nyawa`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <span key={`life-${i}`} className={i < lives ? "" : "opacity-20"}><Emoji emoji="❤️" /></span>
          ))}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-card shadow-soft">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((index + 1) / TOTAL) * 100}%` }} />
      </div>
      <p className="mt-4 text-center font-display text-lg font-extrabold">
        {soalan.prompt ?? "Bahagi dalam bentuk lazim"}
      </p>

      <BahagiPapan
        soalan={soalan}
        values={values}
        active={active}
        checked={checked}
        expected={expected}
        revealedSteps={revealedSteps}
        onSelect={(key) => {
          if (checked) return;
          sfx.tap();
          setActive(key);
        }}
      />

      {checked && (
        <p className={`mt-3 text-center font-display text-base font-extrabold ${allCorrect ? "text-foreground" : "text-destructive-foreground"}`}>
          {allCorrect ? "Tepat sekali!" : "Belum tepat, lihat kotak merah."}
        </p>
      )}
      {checked && allCorrect && <Confetti count={26} seed={index + 1} />}

      {!checked ? (
        <>
          <Numpad onDigit={enter} onDelete={backspace} />
          <Button
            type="button"
            onClick={check}
            disabled={!filled}
            className="tap-pop mt-4 h-auto w-full rounded-3xl bg-mint py-4 font-display text-lg font-extrabold text-foreground shadow-soft hover:bg-mint/90 disabled:opacity-40"
          >
            Semak Jawapan
          </Button>
        </>
      ) : (
        <Button type="button" onClick={nextQuestion} className="tap-pop mt-4 h-auto w-full rounded-3xl bg-sky py-4 font-display text-lg font-extrabold text-foreground shadow-soft hover:bg-sky/90">
          {lives <= 0 || index + 1 >= TOTAL ? "Lihat Keputusan" : "Soalan Seterusnya"}
        </Button>
      )}

      <Link to="/subjek/$subject/$year" params={{ subject, year }} onClick={() => sfx.tap()} className="mt-6 block text-center text-sm font-bold text-muted-foreground">
        Simpan &amp; keluar
      </Link>
    </main>
  );
}

function Numpad({ onDigit, onDelete }: { onDigit: (digit: string) => void; onDelete: () => void }) {
  return (
    <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2" aria-label="Papan nombor">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit, i) => (
        <Button key={digit} type="button" onClick={() => onDigit(digit)} className={`tap-pop h-12 rounded-2xl font-display text-xl font-extrabold text-foreground shadow-soft hover:opacity-90 ${["bg-sky", "bg-peach", "bg-lavender", "bg-lemon"][i % 4]}`}>
          {digit}
        </Button>
      ))}
      <Button type="button" onClick={onDelete} aria-label="Backspace" className="tap-pop h-12 rounded-2xl bg-peach font-display text-xl font-extrabold text-foreground shadow-soft hover:bg-peach/90">⌫</Button>
      <Button type="button" onClick={() => onDigit("0")} className="tap-pop h-12 rounded-2xl bg-sky font-display text-xl font-extrabold text-foreground shadow-soft hover:bg-sky/90">0</Button>
      <Button type="button" onClick={onDelete} className="tap-pop h-12 rounded-2xl bg-lavender px-2 font-display text-sm font-extrabold text-foreground shadow-soft hover:bg-lavender/90">Padam</Button>
    </div>
  );
}

function BahagiPapan({
  soalan,
  values,
  active,
  checked,
  expected,
  revealedSteps,
  onSelect,
  demo = false,
}: {
  soalan: SoalanBahagi;
  values: Record<string, string>;
  active: string | null;
  checked: boolean;
  expected: (box: Box) => string;
  revealedSteps: number;
  onSelect: (key: string) => void;
  demo?: boolean;
}) {
  const columnCount = soalan.dividendDigits.length;
  const gridStyle = { gridTemplateColumns: `repeat(${columnCount}, 2.75rem)` };
  const boardCorrect = soalan.quotientDigits.every(
    (digit, i) => values[`quotient-${i}`] === String(digit),
  ) && (soalan.remainder === 0 || values["remainder-0"] === String(soalan.remainder));
  const boxState = (box: Box) => {
    const key = boxKey(box);
    if (checked && !demo) return values[key] === expected(box)
      ? "border-answer-active bg-mint"
      : "border-destructive bg-destructive text-destructive-foreground";
    return active === key ? "border-answer-active bg-card ring-2 ring-answer-active/30" : "border-border bg-card";
  };

  return (
    <section className={`card-soft mt-4 overflow-hidden px-3 py-5 ${checked && !demo && !boardCorrect ? "animate-shake" : ""}`} aria-label="Bentuk lazim bahagi">
      <div className="mx-auto w-fit">
        <div className="grid gap-1 pl-12" style={gridStyle} aria-label="Kotak hasil bahagi">
          {soalan.dividendDigits.map((_, column) => {
            const quotientIndex = column - soalan.quotientOffset;
            if (quotientIndex < 0) return <span key={`empty-q-${column}`} className="h-10 w-10" aria-hidden="true" />;
            const box: Box = { kind: "quotient", index: quotientIndex };
            const key = boxKey(box);
            return (
              <Button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={`tap-pop h-10 w-10 rounded-lg border-2 p-0 font-display text-xl font-extrabold text-foreground shadow-soft hover:bg-card ${boxState(box)}`}
                aria-label={`Hasil bahagi digit ${quotientIndex + 1}`}
              >
                {values[key] ?? ""}
              </Button>
            );
          })}
        </div>

        <div className="mt-1 grid grid-cols-[3rem_auto] items-center font-display text-3xl font-extrabold">
          <span className="pr-2 text-right">{soalan.divisor}</span>
          <div className="rounded-tl-xl border-l-4 border-t-4 border-foreground/70 px-1 pt-2">
            <div className="grid" style={gridStyle}>
              {soalan.dividendDigits.map((digit, i) => (
                <span key={`dividend-${i}`} className={`flex h-11 items-center justify-center rounded-lg ${i === (soalan.steps[Math.min(revealedSteps, soalan.steps.length - 1)]?.endColumn ?? -1) && !checked ? "bg-lemon" : ""}`}>
                  {digit}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="ml-12 mt-1 space-y-1" aria-label="Ruang kerja bahagi">
          {soalan.steps.map((step, stepIndex) => {
            if (stepIndex >= revealedSteps) return null;
            const productDigits = String(step.product).split("");
            const productStart = step.endColumn - productDigits.length + 1;
            const result = step.nextDigit === null ? String(step.remainder) : `${step.remainder || ""}${step.nextDigit}`;
            const resultDigits = result.split("");
            const resultEnd = step.nextDigit === null ? step.endColumn : step.endColumn + 1;
            const resultStart = resultEnd - resultDigits.length + 1;
            return (
              <div key={`step-${stepIndex}`} className="animate-pop-in">
                <div className="grid" style={gridStyle}>
                  {soalan.dividendDigits.map((_, column) => (
                    <span key={`product-${stepIndex}-${column}`} className="flex h-8 items-center justify-center font-display text-xl font-extrabold">
                      {column >= productStart && column <= step.endColumn ? productDigits[column - productStart] : ""}
                    </span>
                  ))}
                </div>
                <div className="relative h-1">
                  <span className="absolute right-0 top-0 h-0.5 rounded-full bg-foreground/60 animate-pop-in" style={{ width: `${Math.max(1, productDigits.length) * 2.75}rem` }} />
                  <span className="absolute -left-4 -top-5 font-display text-lg font-extrabold">−</span>
                </div>
                <div className="grid" style={gridStyle}>
                  {soalan.dividendDigits.map((_, column) => {
                    const content = column >= resultStart && column <= resultEnd ? resultDigits[column - resultStart] : "";
                    const isBroughtDown = step.nextDigit !== null && column === resultEnd;
                    return (
                      <span key={`result-${stepIndex}-${column}`} className={`flex h-8 items-center justify-center rounded-md font-display text-xl font-extrabold ${isBroughtDown ? "animate-bring-down bg-sky" : ""}`}>
                        {content}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {soalan.remainder > 0 && (
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="text-sm font-extrabold text-muted-foreground">Baki:</span>
            {(() => {
              const box: Box = { kind: "remainder", index: 0 };
              const key = boxKey(box);
              return (
                <Button type="button" onClick={() => onSelect(key)} className={`tap-pop h-10 w-10 rounded-lg border-2 p-0 font-display text-xl font-extrabold text-foreground shadow-soft hover:bg-card ${boxState(box)}`} aria-label="Baki">
                  {values[key] ?? ""}
                </Button>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
