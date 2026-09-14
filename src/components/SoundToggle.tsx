import { useEffect, useState } from "react";
import { Emoji } from "@/components/Emoji";
import { isSoundOn, setSoundOn, sfx } from "@/lib/audio";

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSoundOn());
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setSoundOn(next);
        setOn(next);
        if (next) sfx.click();
      }}
      aria-label={on ? "Matikan bunyi" : "Hidupkan bunyi"}
      className="tap-pop grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card text-xl shadow-soft"
    >
      <Emoji emoji={on ? "🔊" : "🔇"} className="inline-block" />
    </button>
  );
}
