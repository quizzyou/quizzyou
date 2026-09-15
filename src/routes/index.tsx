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

  useEffect(() => {
    if (window.localStorage.getItem("accessGranted") === "true") {
      void navigate({ to: "/subjek", replace: true });
    }
  }, [navigate]);

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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <div className="flex justify-end">
        <SoundToggle />
      </div>

      <div className="mt-2 text-center">
        <h1 className="font-title text-5xl font-bold tracking-tight text-title drop-shadow-sm">
          QUIZZY
        </h1>
        <p className="mt-2 text-base text-muted-foreground">Masukkan Kod Akses</p>
      </div>

      <div
        className={`relative mx-auto mt-6 w-full max-w-xs ${state === "wrong" ? "animate-shake" : ""}`}
      >
        <DoorFrame open={state === "opening"} />
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full transition-all ${
              i < digits.length ? "scale-110 bg-primary" : "bg-card shadow-soft"
            }`}
          />
        ))}
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3">
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

function DoorFrame({ open }: { open: boolean }) {
  return (
    <div className="relative mx-auto aspect-[3/4] w-56 overflow-hidden rounded-t-[5rem] border-4 border-wood-dark bg-muted shadow-soft">
      <div className="absolute inset-0 grid place-items-center bg-lemon">
        <span className="font-display text-3xl font-extrabold text-foreground">
          <Emoji emoji="🎒" className="inline-block" />{" "}
          <Emoji emoji="✏️" className="inline-block" />{" "}
          <Emoji emoji="📚" className="inline-block" />
        </span>
      </div>
      <div
        className="absolute inset-0 rounded-t-[4.5rem] border-4 border-wood-dark bg-gradient-to-b from-wood via-wood to-wood-dark/80 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.12)] transition-transform duration-[1800ms] will-change-transform transform-gpu"
        style={{
          transformOrigin: "left center",
          transform: open ? "perspective(800px) rotateY(-95deg)" : "perspective(800px) rotateY(0deg)",
          transitionTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        <div className="absolute inset-3 rounded-t-[3.5rem] border-2 border-wood-dark/30" />
        <div className="absolute right-3 top-1/2 h-3 w-3 rounded-full bg-lemon shadow-sm" />
      </div>
      {open && (
        <>
          <span className="animate-sparkle absolute left-6 top-10 text-2xl">
            <Emoji emoji="✨" className="inline-block" />
          </span>
          <span
            className="animate-sparkle absolute right-8 top-24 text-xl"
            style={{ animationDelay: "0.3s" }}
          >
            <Emoji emoji="✨" className="inline-block" />
          </span>
          <span
            className="animate-sparkle absolute bottom-12 left-1/2 text-2xl"
            style={{ animationDelay: "0.6s" }}
          >
            <Emoji emoji="✨" className="inline-block" />
          </span>
        </>
      )}
    </div>
  );
}
