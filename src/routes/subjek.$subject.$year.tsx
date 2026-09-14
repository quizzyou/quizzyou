import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { isYear, slugify, subjectById, topicColors, topicList } from "@/data/curriculum";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/subjek/$subject/$year")({
  head: () => ({
    meta: [
      { title: "Pilih Topik — QUIZZY" },
      { name: "description", content: "Pilih topik KSSR Semakan dan jawab 40 soalan kuiz." },
      { property: "og:title", content: "Pilih Topik — QUIZZY" },
      { property: "og:description", content: "Topik mengikut subjek dan tahun, 40 soalan setiap topik." },
    ],
  }),
  component: TopicPage,
});

function TopicPage() {
  const { subject, year } = Route.useParams();
  const info = subjectById(subject);
  if (!info || !isYear(year)) throw notFound();

  const list = topicList(info.id, year);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <PageHeader
        title="Pilih Topik"
        subtitle={`${info.name} · Tahun ${year}`}
        backTo="/subjek/$subject"
        backParams={{ subject }}
      />
      <div className="grid gap-3">
        {list.map((topic, i) => (
          <Link
            key={topic}
            to="/kuiz/$subject/$year/$topic"
            params={{ subject, year, topic: slugify(topic) }}
            onClick={() => sfx.click()}
            className={`tap-pop animate-pop-in flex items-center justify-between gap-3 rounded-3xl ${topicColors[i % topicColors.length]} px-5 py-5 shadow-soft`}
          >
            <span className="min-w-0 font-display text-lg font-extrabold">{topic}</span>
            <span className="shrink-0 rounded-full bg-card px-3 py-1 text-xs font-bold">
              40 soalan
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
