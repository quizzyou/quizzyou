import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Emoji } from "@/components/Emoji";
import { PageHeader } from "@/components/PageHeader";
import { subjectById, years } from "@/data/curriculum";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/subjek/$subject/")({
  head: () => ({
    meta: [
      { title: "Pilih Tahun — QUIZZY" },
      { name: "description", content: "Pilih Tahun 1, Tahun 2 atau Tahun 3 untuk kuiz KSSR." },
      { property: "og:title", content: "Pilih Tahun — QUIZZY" },
      { property: "og:description", content: "Kuiz mengikut tahun persekolahan Tahap 1." },
    ],
  }),
  component: YearPage,
});

function YearPage() {
  const { subject } = Route.useParams();
  const info = subjectById(subject);
  if (!info) throw notFound();

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <PageHeader
        title="Pilih Tahun"
        subtitle={
          <>
            <Emoji emoji={info.icon} className="inline-block" /> {info.name}
          </>
        }
        backTo="/subjek"
      />
      <div className="grid gap-4">
        {years.map((year) => (
          <Link
            key={year.id}
            to="/subjek/$subject/$year"
            params={{ subject, year: year.id }}
            onClick={() => sfx.click()}
            className={`tap-pop animate-pop-in grid h-24 place-items-center rounded-3xl ${year.color} font-display text-2xl font-extrabold shadow-soft`}
          >
            {year.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
