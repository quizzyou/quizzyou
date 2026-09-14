import { useEffect, useRef } from "react";
import twemoji from "twemoji";

type EmojiProps = {
  emoji: string;
  className?: string;
};

export function Emoji({ emoji, className }: EmojiProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    twemoji.parse(ref.current, {
      folder: "svg",
      ext: ".svg",
      base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
    });
  }, [emoji]);

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {emoji}
    </span>
  );
}
