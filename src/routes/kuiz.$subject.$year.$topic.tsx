import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Confetti } from "@/components/Confetti";
import { isYear, subjectById, topicFromSlug } from "@/data/curriculum";
import { getQuestions, QUESTIONS_PER_TOPIC, type Vertical } from "@/lib/questions";
import { clearProgress, loadProgress, saveProgress } from "@/lib/progress";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/kuiz/$subject/$year/$topic")({
  head: () => ({
    meta: [
      { title: "Kuiz — QUIZZY" },
      { name: "description", content: "Jawab 40 soalan kuiz KSSR dan kumpul bintang." },
      { property: "og:title", content: "Kuiz — QUIZZY" },
      { property: "og:description", content: "40 soalan setiap topik, dengan skor dan bintang." },
    ],
  }),
  component: QuizPage,
});

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

  const choose = (choiceIndex: number) => {
    if (picked !== null || !question) return;
    const correct = choiceIndex === question.answer;
    setPicked(choiceIndex);
    if (correct) sfx.correct();
    else sfx.wrong();

    const nextAnswers = [...answers];
    nextAnswers[index] = choiceIndex;
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
        key={question.id}
        className="card-soft animate-pop-in mt-5 px-5 py-6 text-center"
      >
        <p className="font-display text-xl font-extrabold leading-snug">{question.prompt}</p>
        {question.vertical && <VerticalSum vertical={question.vertical} />}
      </section>

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

      {picked !== null && picked === question.answer && <Confetti count={26} seed={question.id} />}

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
