import { useEffect, useState } from "react";
import { Emoji } from "@/components/Emoji";
import { Confetti } from "@/components/Confetti";
import { sfx } from "@/lib/audio";
import { loadProfile, recordTopicCompletion, type Badge } from "@/lib/profile";

/** Mount once on a topic result screen: bumps streak, unlocks badges, shows popup. */
export function TopicRewards({ subject }: { subject: string }) {
  const [queue, setQueue] = useState<Badge[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(loadProfile()?.name ?? "");
    const unlocked = recordTopicCompletion(subject);
    if (unlocked.length > 0) {
      setQueue(unlocked);
      window.setTimeout(() => sfx.unlock(), 400);
    }
  }, [subject]);

  const badge = queue[0];
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 px-6">
      <Confetti count={30} seed={3} />
      <div className="animate-pop-in w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-soft">
        <span className="animate-pop-in inline-block text-5xl">
          <Emoji emoji={badge.emoji} className="inline-block" />
        </span>
        <h2 className="mt-3 font-display text-xl font-extrabold">
          🎉 Tahniah{name ? ` ${name}` : ""}!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Anda berjaya membuka badge {badge.name}
        </p>
        <button
          type="button"
          onClick={() => {
            sfx.click();
            setQueue((q) => q.slice(1));
          }}
          className="tap-pop mt-5 w-full rounded-2xl bg-primary px-4 py-3 font-display font-bold text-primary-foreground"
        >
          Yeay!
        </button>
      </div>
    </div>
  );
}
