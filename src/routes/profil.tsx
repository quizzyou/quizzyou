import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Emoji } from "@/components/Emoji";
import { SoundToggle } from "@/components/SoundToggle";
import { sfx } from "@/lib/audio";
import { avatarOptions, loadProfile, saveProfile } from "@/lib/profile";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Jom Kenalkan Diri — QUIZZY" },
      {
        name: "description",
        content: "Masukkan nama dan pilih avatar emoji untuk mula belajar dengan QUIZZY.",
      },
      { property: "og:title", content: "Jom Kenalkan Diri — QUIZZY" },
      {
        property: "og:description",
        content: "Tetapkan nama dan avatar murid sebelum mula kuiz KSSR Tahap 1.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loadProfile()) {
      void navigate({ to: "/subjek", replace: true });
      return;
    }
    setChecked(true);
  }, [navigate]);

  if (!checked) return <main className="min-h-screen" />;

  const ready = name.trim().length > 0 && avatar !== null;

  const submit = () => {
    if (!ready || !avatar) return;
    sfx.unlock();
    saveProfile({ name: name.trim(), avatar });
    void navigate({ to: "/subjek", replace: true });
  };

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <div className="flex items-center justify-between pb-2">
        <span className="h-11 w-11" />
        <h1 className="font-display text-2xl font-extrabold">Jom Kenalkan Diri! ✨</h1>
        <SoundToggle />
      </div>

      <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
        <label htmlFor="nama" className="block font-display font-bold">
          Nama Murid
        </label>
        <input
          id="nama"
          value={name}
          maxLength={15}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masukkan nama anda"
          className="mt-2 w-full rounded-2xl bg-background px-4 py-3 text-center font-display text-lg font-bold outline-none ring-2 ring-transparent focus:ring-primary"
        />
        <p className="mt-1 text-center text-xs text-muted-foreground">{name.length}/15</p>
      </section>

      <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
        <p className="font-display font-bold">Pilih Avatar</p>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {avatarOptions.map((emoji) => {
            const active = avatar === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  sfx.click();
                  setAvatar(emoji);
                }}
                aria-label={`Pilih avatar ${emoji}`}
                aria-pressed={active}
                className={`grid h-16 place-items-center rounded-3xl text-3xl transition-transform ${
                  active
                    ? "animate-pop-in scale-105 bg-lemon ring-4 ring-lavender"
                    : "tap-pop bg-background"
                }`}
              >
                <Emoji emoji={emoji} className="inline-block" />
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={submit}
        disabled={!ready}
        className="tap-pop mt-6 w-full rounded-3xl bg-primary px-4 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft disabled:opacity-50"
      >
        Seterusnya
      </button>
    </main>
  );
}
