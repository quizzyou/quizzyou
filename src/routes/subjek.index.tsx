import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Emoji } from "@/components/Emoji";
import { SoundToggle } from "@/components/SoundToggle";
import { subjects, topicFromSlug, isYear, type SubjectId } from "@/data/curriculum";
import { listUnfinished, type Unfinished } from "@/lib/progress";
import { getQuestions } from "@/lib/questions";
import { sfx } from "@/lib/audio";
import {
  avatarOptions,
  loadBadges,
  loadProfile,
  loadStreak,
  saveProfile,
  type Profile,
} from "@/lib/profile";
import { Pencil } from "lucide-react";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    setResume(listUnfinished());
    setProfile(loadProfile());
    setStreak(loadStreak());
    setBadgeCount(loadBadges().length);
  }, []);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <div className="flex justify-end pb-2">
        <SoundToggle />
      </div>

      <section className="animate-pop-in rounded-3xl bg-sky p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-card text-3xl">
            <Emoji emoji={profile?.avatar ?? "🐣"} className="inline-block" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate font-display text-lg font-extrabold">
              Hai, {profile?.name ?? "Murid"}!
              <Emoji emoji="👋" className="inline-block" />
            </p>
            <p className="truncate text-xs text-foreground/70">Jom sambung belajar hari ini!</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <p className="flex items-center justify-center gap-1 rounded-2xl bg-card px-3 py-2 font-display text-sm font-bold">
            <Emoji emoji="🔥" className="inline-block" /> {streak} hari
          </p>
          <p className="flex items-center justify-center gap-1 rounded-2xl bg-card px-3 py-2 font-display text-sm font-bold">
            <Emoji emoji="🏅" className="inline-block" /> {badgeCount} badge
          </p>
        </div>
      </section>


      {resume.length > 0 && (
        <section className="mt-5">
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
                  <span className="text-2xl">
                    <Emoji emoji={subject.icon} className="inline-block" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-bold">{topic}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {subject.name} · Tahun {r.year} · Soalan {r.index + 1}/{getQuestions(subject.id, r.year as Parameters<typeof getQuestions>[1], topic).length}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg">▶</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <h2 className="mb-3 mt-6 text-center font-display text-2xl font-extrabold">Pilih Subjek</h2>

      <div className="grid gap-4">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            to="/subjek/$subject"
            params={{ subject: subject.id }}
            onClick={() => sfx.click()}
            className={`tap-pop animate-pop-in flex flex-col items-center justify-center gap-2 rounded-3xl ${subject.color} p-6 text-center shadow-soft`}
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-card text-3xl">
              <Emoji emoji={subject.icon} className="inline-block" />
            </span>
            <span className="block truncate font-display text-xl font-extrabold">
              {subject.name}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
