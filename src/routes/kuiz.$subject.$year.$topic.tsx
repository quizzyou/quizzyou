import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Confetti } from "@/components/Confetti";
import { isYear, subjectById, topicFromSlug } from "@/data/curriculum";
import { getQuestions, QUESTIONS_PER_TOPIC, type Vertical } from "@/lib/questions";
import { clearProgress, loadProgress, saveProgress } from "@/lib/progress";
import { sfx } from "@/lib/audio";
import { TambahLazim } from "@/components/TambahLazim";
import { TolakLazim } from "@/components/TolakLazim";
import { DarabLazim } from "@/components/DarabLazim";
import { BahagiLazim } from "@/components/BahagiLazim";

export const Route = createFileRoute("/kuiz/$subject/$year/$topic")({
  head: () => ({
    meta: [
      { title: "Kuiz — QUIZZY" },
      { name: "description", content: "Jawab 40 soalan kuiz KSSR dan kumpul bintang." },
      { property: "og:title", content: "Kuiz — QUIZZY" },
      { property: "og:description", content: "40 soalan setiap topik, dengan skor dan bintang." },
    ],
  }),
  component: QuizRoute,
});

function QuizRoute() {
  const { subject, year, topic } = Route.useParams();
  const info = subjectById(subject);
  if (!info || !isYear(year)) throw notFound();
  const topicName = topicFromSlug(info.id, year, topic);
  if (!topicName) throw notFound();

  if (subject === "mt" && topic === "tambah") {
    return (
      <TambahLazim
        subject={subject}
        year={year}
        topic={topic}
        topicName={topicName}
        subjectName={info.name}
      />
    );
  }
  if (subject === "mt" && topic === "tolak") {
    return (
      <TolakLazim
        subject={subject}
        year={year}
        topic={topic}
        topicName={topicName}
        subjectName={info.name}
      />
    );
  }
  if (subject === "mt" && (year === "2" || year === "3") && topic === "darab") {
    return (
      <DarabLazim
        subject={subject}
        year={year}
        topic={topic}
        topicName={topicName}
        subjectName={info.name}
      />
    );
  }
  if (subject === "mt" && year === "3" && topic === "bahagi") {
    return (
      <BahagiLazim
        subject={subject}
        year={year}
        topic={topic}
        topicName={topicName}
        subjectName={info.name}
      />
    );
  }
  return <QuizPage />;
}

function QuizPage() {
  const { subject, year, topic } = Route.useParams();
  const navigate = useNavigate();
  const info = subjectById(subject);
  if (!info || !isYear(year)) throw notFound();
  const topicName = topicFromSlug(info.id, year, topic);
  if (!topicName) throw notFound();


  const questions = useMemo(
    () => getQuestions(info.id, year, topicName),
    [info.id, year, topicName],
  );

  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUESTIONS_PER_TOPIC).fill(null),
  );
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const saved = loadProgress(subject, year, topic);
    if (saved && saved.index < QUESTIONS_PER_TOPIC) {
      setIndex(saved.index);
      setScore(saved.score);
      setAnswers(saved.answers ?? Array(QUESTIONS_PER_TOPIC).fill(null));
    }
    setReady(true);
  }, [subject, year, topic]);

  const question = questions[index];

  const completeAnswer = (submittedAnswer: number, correct: boolean) => {
    if (picked !== null || !question) return;
    setPicked(submittedAnswer);
    if (correct) sfx.correct();
    else sfx.wrong();

    const nextAnswers = [...answers];
    nextAnswers[index] = submittedAnswer;
    const nextScore = score + (correct ? 1 : 0);
    setAnswers(nextAnswers);
    setScore(nextScore);

    window.setTimeout(() => {
      const nextIndex = index + 1;
      setPicked(null);
      if (nextIndex >= QUESTIONS_PER_TOPIC) {
        saveProgress(subject, year, topic, {
          index: QUESTIONS_PER_TOPIC,
          score: nextScore,
          answers: nextAnswers,
        });
        clearProgress(subject, year, topic);
        setFinished(true);
        sfx.celebrate();
      } else {
        setIndex(nextIndex);
        saveProgress(subject, year, topic, {
          index: nextIndex,
          score: nextScore,
          answers: nextAnswers,
        });
      }
    }, 900);
  };

  const choose = (choiceIndex: number) => {
    if (!question) return;
    completeAnswer(choiceIndex, choiceIndex === question.answer);
  };

  const restart = () => {
    sfx.click();
    clearProgress(subject, year, topic);
    setIndex(0);
    setScore(0);
    setAnswers(Array(QUESTIONS_PER_TOPIC).fill(null));
    setPicked(null);
    setFinished(false);
  };

  if (!ready || !questions.length) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        <PageHeader
          title={topicName}
          subtitle={`${info.name} · Tahun ${year}`}
          backTo="/subjek/$subject/$year"
          backParams={{ subject, year }}
        />
        <p className="text-center text-muted-foreground">Memuatkan soalan…</p>
      </main>
    );
  }

  if (!question) return null;

  if (finished) {
    const percent = Math.round((score / QUESTIONS_PER_TOPIC) * 100);
    const stars = percent >= 90 ? 5 : percent >= 75 ? 4 : percent >= 60 ? 3 : percent >= 40 ? 2 : 1;
    const message =
      stars >= 5
        ? "Cemerlang! Kamu hebat!"
        : stars === 4
          ? "Bagus sekali! Teruskan usaha!"
          : stars === 3
            ? "Baik! Cuba lagi untuk lebih bintang!"
            : "Jangan putus asa. Kamu boleh buat!";

    return (
      <main className="mx-auto w-full max-w-md px-5 py-6">
        <Confetti count={50} />
        <PageHeader
          title="Keputusan"
          subtitle={topicName}
          backTo="/subjek/$subject/$year"
          backParams={{ subject, year }}
        />
        <section className="card-soft animate-pop-in p-7 text-center">
          <p className="font-display text-5xl font-extrabold">
            {score}
            <span className="text-2xl text-muted-foreground"> / {QUESTIONS_PER_TOPIC}</span>
          </p>
          <p className="mt-1 text-lg font-bold text-muted-foreground">{percent}%</p>
          <p className="mt-3 text-3xl" aria-label={`${stars} bintang`}>
            {"⭐".repeat(stars)}
            <span className="opacity-25">{"⭐".repeat(5 - stars)}</span>
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
            to="/subjek"
            onClick={() => sfx.click()}
            className="tap-pop rounded-3xl bg-peach py-4 text-center font-display text-lg font-extrabold shadow-soft"
          >
            Teruskan Belajar
          </Link>
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
      <PageHeader
        title={topicName}
        subtitle={`${info.name} · Tahun ${year}`}
        backTo="/subjek/$subject/$year"
        backParams={{ subject, year }}
      />

      <div className="mb-1 flex items-center justify-between text-sm font-bold text-muted-foreground">
        <span>
          {index + 1} / {QUESTIONS_PER_TOPIC}
        </span>
        <span>Skor: {score}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-card shadow-soft">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((index + 1) / QUESTIONS_PER_TOPIC) * 100}%` }}
        />
      </div>

      <section
        className="card-soft animate-pop-in mt-5 px-5 py-6 text-center"
      >
        <p className="font-display text-xl font-extrabold leading-snug">{question.prompt}</p>
        {question.vertical && question.answerMode !== "column-input" && (
          <VerticalSum vertical={question.vertical} />
        )}
      </section>

      {question.answerMode === "column-input" && question.vertical ? (
        <ColumnAddition
          key={question.id}
          vertical={question.vertical}
          correctAnswer={question.choices[question.answer] ?? ""}
          disabled={picked !== null}
          result={picked === null ? null : picked === Number(question.choices[question.answer])}
          onComplete={(value) => completeAnswer(value, value === Number(question.choices[question.answer]))}
        />
      ) : (
        <div className="mt-5 grid gap-3">
          {question.choices.map((choice, i) => {
            const isPicked = picked === i;
            const isCorrect = i === question.answer;
            const bg =
              picked === null
                ? ["bg-sky", "bg-peach", "bg-lavender", "bg-lemon"][i % 4]
                : isCorrect
                  ? "bg-mint"
                  : isPicked
                    ? "bg-destructive"
                    : "bg-card";
            return (
              <button
                key={`${question.id}-${i}`}
                type="button"
                disabled={picked !== null}
                onClick={() => choose(i)}
                className={`tap-pop rounded-3xl ${bg} px-4 py-4 font-display text-lg font-extrabold shadow-soft ${
                  isPicked && !isCorrect ? "animate-shake" : ""
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {picked !== null &&
        (question.answerMode === "column-input"
          ? picked === Number(question.choices[question.answer])
          : picked === question.answer) && <Confetti count={26} seed={question.id} />}

      <button
        type="button"
        onClick={() => {
          sfx.tap();
          void navigate({ to: "/subjek/$subject/$year", params: { subject, year } });
        }}
        className="mt-6 w-full text-center text-sm font-bold text-muted-foreground"
      >
        Simpan &amp; keluar
      </button>
    </main>
  );
}

const PLACE_NAMES = ["Sa", "Puluh", "Ratus", "Ribu"];

function ColumnAddition({
  vertical,
  correctAnswer,
  disabled,
  result,
  onComplete,
}: {
  vertical: Vertical;
  correctAnswer: string;
  disabled: boolean;
  result: boolean | null;
  onComplete: (value: number) => void;
}) {
  const columnCount = Math.max(3, vertical.a.length, vertical.b.length, correctAnswer.length);
  const [digits, setDigits] = useState<string[]>(Array(columnCount).fill(""));
  const [active, setActive] = useState<number | null>(null);
  const [inputOrder, setInputOrder] = useState<number[]>([]);
  const [revealedCarries, setRevealedCarries] = useState<boolean[]>(Array(columnCount).fill(false));
  const aDigits = vertical.a.padStart(columnCount, " ").split("");
  const bDigits = vertical.b.padStart(columnCount, " ").split("");
  const names = Array.from({ length: columnCount }, (_, i) => PLACE_NAMES[columnCount - i - 1] ?? "");

  const carries = Array(columnCount).fill(0) as number[];
  let incoming = 0;
  for (let i = columnCount - 1; i > 0; i--) {
    const total = Number(aDigits[i] || 0) + Number(bDigits[i] || 0) + incoming;
    carries[i - 1] = Math.floor(total / 10);
    incoming = carries[i - 1] ?? 0;
  }

  const enterDigit = (digit: string) => {
    if (disabled || active === null) return;
    sfx.tap();
    const next = [...digits];
    next[active] = digit;
    setDigits(next);
    setInputOrder((current) => [...current.filter((index) => index !== active), active]);

    const carryTarget = active - 1;
    if (carryTarget >= 0 && (carries[carryTarget] ?? 0) > 0) {
      setRevealedCarries((current) => current.map((shown, i) => shown || i === carryTarget));
    }

    const nextEmptyToLeft = next.slice(0, active).lastIndexOf("");
    const nextEmptyToRight = next.findIndex((value, i) => i > active && value === "");
    const nextActive = nextEmptyToLeft >= 0 ? nextEmptyToLeft : nextEmptyToRight;
    setActive(nextActive >= 0 ? nextActive : null);

    if (next.every(Boolean)) onComplete(Number(next.join("")));
  };

  const removeDigit = () => {
    if (disabled) return;
    sfx.tap();
    const target = inputOrder.at(-1);
    if (target === undefined) return;
    const next = [...digits];
    next[target] = "";
    setDigits(next);
    setInputOrder((current) => current.slice(0, -1));
    setActive(target);
  };

  const gridStyle = { gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` };
  const feedbackClass = result === null ? "" : result ? "bg-mint" : "bg-destructive animate-shake";

  return (
    <div className="mt-5">
      <section className={`card-soft px-3 py-5 transition-colors ${feedbackClass}`} aria-label="Bentuk lazim tambah">
        <div className="ml-7 grid gap-1 text-center text-[11px] text-muted-foreground sm:text-xs" style={gridStyle}>
          {names.map((name, i) => <span key={`place-${i}-${name}`}>{name}</span>)}
        </div>
        <div className="ml-7 grid gap-2 py-2 text-center text-sm text-foreground" style={gridStyle} aria-label="Nombor simpan">
          {carries.map((carry, i) => (
            <span
              key={`carry-${i}`}
              className="mx-auto grid h-8 w-8 place-items-center rounded-md border-2 border-carry-border bg-carry font-display font-extrabold"
            >
              <span className={revealedCarries[i] && carry ? "animate-carry-in" : "opacity-0"}>
                {carry || ""}
              </span>
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[1.75rem_1fr] items-center text-center font-display text-3xl font-extrabold">
          <span aria-hidden="true" />
          <div className="grid" style={gridStyle}>{aDigits.map((digit, i) => <span key={`top-${i}`}>{digit}</span>)}</div>
          <span aria-hidden="true">+</span>
          <div className="grid" style={gridStyle}>{bDigits.map((digit, i) => <span key={`bottom-${i}`}>{digit}</span>)}</div>
        </div>
        <div className="mt-2 border-t-4 border-foreground/60 pt-3">
          <div className="ml-7 grid gap-2" style={gridStyle}>
            {digits.map((digit, i) => (
              <button
                key={`answer-${i}`}
                type="button"
                disabled={disabled}
                onClick={() => { sfx.tap(); setActive(i); }}
                className={`tap-pop aspect-square min-w-0 rounded-xl border-2 bg-card font-display text-2xl font-extrabold shadow-soft ${active === i ? "border-answer-active ring-2 ring-answer-active/30" : "border-border"}`}
                aria-label={`Jawapan rumah ${names[i]}`}
              >
                {digit}
              </button>
            ))}
          </div>
        </div>
      </section>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        {result === null ? "Tekan kotak jawapan, kemudian masukkan nombor." : result ? "Betul!" : "Cuba soalan seterusnya."}
      </p>
      <div className="mx-auto mt-3 grid max-w-xs grid-cols-3 gap-2" aria-label="Papan kekunci nombor">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit, i) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => enterDigit(digit)}
            className={`tap-pop h-12 rounded-2xl font-display text-xl font-extrabold shadow-soft ${["bg-sky", "bg-peach", "bg-lavender", "bg-lemon"][i % 4]}`}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={removeDigit}
          className="tap-pop h-12 rounded-2xl bg-peach font-display text-xl font-extrabold shadow-soft"
          aria-label="Padam digit terakhir"
        >
          ⌫
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => enterDigit("0")}
          className="tap-pop h-12 rounded-2xl bg-sky font-display text-xl font-extrabold shadow-soft"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={removeDigit}
          className="tap-pop h-12 rounded-2xl bg-lavender px-2 font-display text-sm font-extrabold shadow-soft"
        >
          Padam
        </button>
      </div>
    </div>
  );
}

function VerticalSum({ vertical }: { vertical: Vertical }) {
  const width = Math.max(vertical.a.length, vertical.b.length) + 1;
  const pad = (value: string) => value.padStart(width, " ");
  return (
    <div className="mt-4 inline-block rounded-2xl bg-muted px-6 py-4 text-right font-mono text-2xl font-bold leading-tight tracking-[0.35em]">
      <div className="whitespace-pre">{pad(vertical.a)}</div>
      <div className="whitespace-pre border-b-4 border-foreground/60 pb-1">
        {vertical.op}
        {pad(vertical.b).slice(1)}
      </div>
      <div className="whitespace-pre pt-1 text-muted-foreground">{" ?".padStart(width, " ")}</div>
    </div>
  );
}
