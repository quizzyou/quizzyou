export type Progress = {
  index: number;
  score: number;
  answers: (number | null)[];
  updatedAt: number;
};

const key = (subject: string, year: string, topic: string) =>
  `quizzy.progress.${subject}.${year}.${topic}`;

export function loadProgress(subject: string, year: string, topic: string): Progress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(subject, year, topic));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Progress;
    if (typeof parsed.index !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(
  subject: string,
  year: string,
  topic: string,
  progress: Omit<Progress, "updatedAt">,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    key(subject, year, topic),
    JSON.stringify({ ...progress, updatedAt: Date.now() }),
  );
}

export function clearProgress(subject: string, year: string, topic: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(subject, year, topic));
}

export type Unfinished = {
  subject: string;
  year: string;
  topic: string;
  index: number;
  updatedAt: number;
};

export function listUnfinished(): Unfinished[] {
  if (typeof window === "undefined") return [];
  const out: Unfinished[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k?.startsWith("quizzy.progress.")) continue;
    const [, , subject, year, topic] = k.split(".");
    if (!subject || !year || !topic) continue;
    try {
      const p = JSON.parse(window.localStorage.getItem(k) ?? "") as Progress;
      const total = getQuestions(
        subject as Parameters<typeof getQuestions>[0],
        year as Parameters<typeof getQuestions>[1],
        topic,
      ).length || 40;
      if (p.index > 0 && p.index < total) {
        out.push({ subject, year, topic, index: p.index, updatedAt: p.updatedAt ?? 0 });
      }
    } catch {
      /* ignore */
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
}
