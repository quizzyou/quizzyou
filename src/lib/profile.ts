export type Badge = { id: string; emoji: string; name: string };

export const badges: Badge[] = [
  { id: "first", emoji: "🌟", name: "Topik Pertama Selesai" },
  { id: "bm", emoji: "📚", name: "Bahasa Melayu Champion" },
  { id: "mt", emoji: "➕", name: "Matematik Hero" },
  { id: "sn", emoji: "🔬", name: "Sains Explorer" },
  { id: "en", emoji: "🔤", name: "English Star" },
];

const NAME_KEY = "userName";
const AVATAR_KEY = "userAvatar";
const BADGE_KEY = "quizzy.badges";
const STREAK_KEY = "quizzy.streak";
const STREAK_DAY_KEY = "quizzy.streakDay";

export const avatarOptions = ["🦁", "🐯", "🐺", "🐰", "🦄", "🐸", "🐣", "🦉"];

export type Profile = { name: string; avatar: string };

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const name = window.localStorage.getItem(NAME_KEY);
  const avatar = window.localStorage.getItem(AVATAR_KEY);
  if (!name || !avatar) return null;
  return { name, avatar };
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, profile.name);
  window.localStorage.setItem(AVATAR_KEY, profile.avatar);
}

export function loadBadges(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BADGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 99;
  return Math.round((b - a) / 86_400_000);
}

export function loadStreak(): number {
  if (typeof window === "undefined") return 0;
  const last = window.localStorage.getItem(STREAK_DAY_KEY);
  const value = Number(window.localStorage.getItem(STREAK_KEY) ?? "0") || 0;
  if (!last) return 0;
  const diff = dayDiff(last, todayKey());
  return diff <= 1 ? value : 0;
}

/** Records a completed topic: bumps the daily streak and unlocks badges. */
export function recordTopicCompletion(subject: string): Badge[] {
  if (typeof window === "undefined") return [];

  // Streak
  const today = todayKey();
  const last = window.localStorage.getItem(STREAK_DAY_KEY);
  const current = Number(window.localStorage.getItem(STREAK_KEY) ?? "0") || 0;
  if (last !== today) {
    const next = last && dayDiff(last, today) === 1 ? current + 1 : 1;
    window.localStorage.setItem(STREAK_KEY, String(next));
    window.localStorage.setItem(STREAK_DAY_KEY, today);
  }

  // Badges
  const owned = new Set(loadBadges());
  const unlocked: Badge[] = [];
  for (const id of ["first", subject]) {
    const badge = badges.find((b) => b.id === id);
    if (badge && !owned.has(badge.id)) {
      owned.add(badge.id);
      unlocked.push(badge);
    }
  }
  if (unlocked.length > 0) {
    window.localStorage.setItem(BADGE_KEY, JSON.stringify([...owned]));
  }
  return unlocked;
}
