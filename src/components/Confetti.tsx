const COLORS = ["bg-sky", "bg-peach", "bg-lavender", "bg-lemon", "bg-mint"];

export function Confetti({ count = 40, seed = 1 }: { count?: number; seed?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = ((i * 37 + seed * 13) % 100) + Math.random() * 2;
    const delay = ((i * 17 + seed * 7) % 60) / 100;
    const duration = 1.4 + (((i * 11) % 8) / 10);
    const size = 6 + ((i * 5) % 8);
    return { left, delay, duration, size, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`animate-confetti absolute top-0 rounded-sm ${p.color}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
