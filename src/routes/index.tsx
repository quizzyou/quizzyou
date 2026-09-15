import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/audio";
import { Confetti } from "@/components/Confetti";
import { Emoji } from "@/components/Emoji";
import { SoundToggle } from "@/components/SoundToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QUIZZY — Kuiz KSSR Tahap 1 untuk Murid Sekolah Rendah" },
      {
        name: "description",
        content:
          "QUIZZY: kuiz Bahasa Melayu, English, Matematik dan Sains KSSR Semakan untuk murid Tahun 1, 2 dan 3.",
      },
      { property: "og:title", content: "QUIZZY — Kuiz KSSR Tahap 1" },
      {
        property: "og:description",
        content: "Kuiz mesra kanak-kanak untuk Tahun 1 hingga Tahun 3 mengikut KSSR Semakan.",
      },
    ],
  }),
  component: AccessCodePage,
});

const CODE = "456123";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];

function AccessCodePage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");
  const digitsRef = useRef("");
  const [state, setState] = useState<"idle" | "wrong" | "opening">("idle");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("accessGranted") === "true") {
      void navigate({ to: "/subjek", replace: true });
      return;
    }
    setChecked(true);
  }, [navigate]);

  if (!checked) {
    return <main className="min-h-screen" />;
  }

  const press = (key: string) => {
    if (state === "opening") return;
    if (key === "clear") {
      sfx.tap();
      digitsRef.current = "";
      setDigits("");
      return;
    }
    if (key === "del") {
      sfx.tap();
      digitsRef.current = digitsRef.current.slice(0, -1);
      setDigits(digitsRef.current);
      return;
    }
    if (digitsRef.current.length >= 6) return;
    sfx.click();
    const next = digitsRef.current + key;
    digitsRef.current = next;
    setDigits(next);
    if (next.length === 6) {
      if (next === CODE) {
        sfx.unlock();
        setState("opening");
        window.localStorage.setItem("accessGranted", "true");
        window.setTimeout(() => void navigate({ to: "/subjek", replace: true }), 2200);
      } else {
        sfx.wrong();
        setState("wrong");
        window.setTimeout(() => {
          digitsRef.current = "";
          setDigits("");
          setState("idle");
        }, 600);
      }
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-6">
      <div className="absolute right-5 top-6">
        <SoundToggle />
      </div>

      <div className="text-center">
        <p className="text-base text-muted-foreground">Masukkan Kod Akses</p>
      </div>

      <div className={`mt-8 flex justify-center gap-3 ${state === "wrong" ? "animate-shake" : ""}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full transition-all ${
              i < digits.length ? "scale-110 bg-primary" : "bg-card shadow-soft"
            }`}
          />
        ))}
      </div>

      <div className="mt-8 grid w-full max-w-xs grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className="tap-pop grid h-16 place-items-center rounded-3xl bg-card font-display text-2xl font-bold text-foreground shadow-soft"
          >
            {key === "clear" ? "✕" : key === "del" ? "⌫" : key}
          </button>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Kod akses hanya diminta sekali pada peranti ini.
      </p>

      {state === "opening" && <Confetti count={30} />}
    </main>
  );
}
