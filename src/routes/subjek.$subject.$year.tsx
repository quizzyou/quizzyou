import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { isYear, slugify, subjectById, topicColors, topicList } from "@/data/curriculum";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/subjek/$subject/$year")({
  head: () => ({
    meta: [
      { title: "Pilih Topik — QUIZZY" },
      { name: "description", content: "Pilih topik KSSR Semakan dan mula jawab kuiz." },
      { property: "og:title", content: "Pilih Topik — QUIZZY" },
      { property: "og:description", content: "Topik mengikut subjek dan tahun untuk murid Tahap 1." },
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
            className={`tap-pop animate-pop-in flex flex-col items-center justify-center gap-2 rounded-3xl ${topicColors[i % topicColors.length]} px-5 py-5 shadow-soft`}
          >
            <Emoji emoji={topicEmoji(topic)} className="text-3xl" />
            <span className="text-center font-display text-lg font-extrabold">{topic}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
