type EmojiProps = {
  emoji: string;
  className?: string;
};

export function Emoji({ emoji, className }: EmojiProps) {
  return (
    <span className={className} aria-hidden="true">
      <img
        src={`https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=apple`}
        alt={emoji}
        className="emoji"
        draggable={false}
      />
    </span>
  );
}
