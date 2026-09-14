import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Emoji } from "@/components/Emoji";
import { PageHeader } from "@/components/PageHeader";
import { subjects, slugify, topicFromSlug, isYear, type SubjectId } from "@/data/curriculum";
import { listUnfinished, type Unfinished } from "@/lib/progress";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/subjek/")({
  head: () => ({
    meta: [
      { title: "Pilih Subjek — QUIZZY" },
      {
        name: "description",
        content: "Pilih subjek Bahasa Melayu, English, Matematik atau Sains untuk mula kuiz KSSR.",
      },
      { property: "og:title", content: "Pilih Subjek — QUIZZY" },
      { property: "og:description", content: "Empat subjek KSSR Tahap 1 untuk murid Tahun 1-3." },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const [resume, setResume] = useState<Unfinished[]>([]);

  useEffect(() => {
    setResume(listUnfinished());
  }, []);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <PageHeader title="Pilih Subjek" subtitle="Kuiz KSSR Tahap 1" />

      {resume.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 font-display text-lg font-bold">Sambung Kuiz</h2>
          <div className="space-y-2">
            {resume.map((r) => {
              const subject = subjects.find((s) => s.id === (r.subject as SubjectId));
              const topic =
                subject && isYear(r.year)
                  ? topicFromSlug(subject.id, r.year, r.topic)
                  : undefined;
              if (!subject || !topic) return null;
              return (
                <Link
                  key={`${r.subject}${r.year}${r.topic}`}
                  to="/kuiz/$subject/$year/$topic"
                  params={{ subject: r.subject, year: r.year, topic: r.topic }}
                  onClick={() => sfx.click()}
                  className="tap-pop flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft"
                >
                  <span className="text-2xl">{subject.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-bold">{topic}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {subject.name} · Tahun {r.year} · Soalan {r.index + 1}/40
                    </span>
                  </span>
                  <span className="shrink-0 text-lg">▶</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-4">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            to="/subjek/$subject"
            params={{ subject: subject.id }}
            onClick={() => sfx.click()}
            className={`tap-pop animate-pop-in flex items-center gap-4 rounded-3xl ${subject.color} p-6 shadow-soft`}
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-card text-3xl">
              {subject.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-xl font-extrabold">
                {subject.name}
              </span>
              <span className="block text-xs text-foreground/70">
                {slugify(subject.name).length > 0 ? "40 soalan setiap topik" : ""}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
