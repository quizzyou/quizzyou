export type SubjectId = "bm" | "en" | "mt" | "sn";
export type YearId = "1" | "2" | "3";

export type Subject = {
  id: SubjectId;
  name: string;
  icon: string;
  color: string;
};

export const subjects: Subject[] = [
  { id: "bm", name: "Bahasa Melayu", icon: "📖", color: "bg-sky" },
  { id: "en", name: "English", icon: "🔤", color: "bg-peach" },
  { id: "mt", name: "Matematik", icon: "➕", color: "bg-lemon" },
  { id: "sn", name: "Sains", icon: "🔬", color: "bg-lavender" },
];

export const years: { id: YearId; name: string; color: string }[] = [
  { id: "1", name: "Tahun 1", color: "bg-sky" },
  { id: "2", name: "Tahun 2", color: "bg-peach" },
  { id: "3", name: "Tahun 3", color: "bg-mint" },
];

export const topics: Record<SubjectId, Record<YearId, string[]>> = {
  bm: {
    "1": [
      "Huruf",
      "Suku Kata",
      "Perkataan",
      "Frasa dan Ayat Mudah",
      "Kata Nama Am",
      "Kata Kerja",
    ],
    "2": [
      "Kata Nama",
      "Kata Kerja",
      "Kata Adjektif",
      "Kata Sendi Nama",
      "Kata Hubung",
      "Ayat Tanya",
      "Ayat Perintah",
      "Pemahaman",
    ],
    "3": [
      "Kata Ganti Nama",
      "Kata Arah",
      "Kata Seru",
      "Simpulan Bahasa",
      "Peribahasa Mudah",
      "Pemahaman",
    ],
  },
  en: {
    "1": [
      "Alphabet",
      "Phonics",
      "Numbers",
      "Colours",
      "Family",
      "My Classroom",
      "Reading",
      "Writing",
    ],
    "2": [
      "Grammar in Context",
      "Food & Drinks",
      "Animals",
      "Daily Activities",
      "Places",
      "Reading",
      "Writing",
    ],
    "3": [
      "Grammar in Context",
      "Verbs",
      "Adjectives",
      "Weather",
      "Hobbies",
      "Health",
      "Stories",
      "Comprehension",
    ],
  },
  mt: {
    "1": [
      "Nombor hingga 100",
      "Tambah",
      "Tolak",
      "Wang",
      "Masa dan Waktu",
      "Bentuk Asas",
      "Penyelesaian Masalah",
    ],
    "2": [
      "Nombor hingga 1000",
      "Tambah",
      "Tolak",
      "Darab",
      "Wang",
      "Masa dan Waktu",
      "Panjang",
      "Penyelesaian Masalah",
    ],
    "3": [
      "Nombor hingga 10,000",
      "Tambah",
      "Tolak",
      "Darab",
      "Bahagi",
      "Pecahan",
      "Wang",
      "Jisim",
      "Isipadu Cecair",
      "Penyelesaian Masalah",
    ],
  },
  sn: {
    "1": [
      "Kemahiran Saintifik",
      "Bahagian Badan Manusia",
      "Deria Manusia",
      "Haiwan",
      "Tumbuhan",
      "Cahaya dan Gelap",
    ],
    "2": [
      "Keperluan Asas Haiwan",
      "Keperluan Asas Tumbuhan",
      "Makanan Sihat",
      "Air",
      "Bunyi",
      "Magnet",
      "Bumi",
    ],
    "3": ["Sistem Pernafasan", "Gigi", "Tumbuhan Membiak", "Bahan", "Cuaca", "Kitaran Air"],
  },
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function subjectById(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function isYear(value: string): value is YearId {
  return value === "1" || value === "2" || value === "3";
}

export function topicList(subject: SubjectId, year: YearId): string[] {
  return topics[subject][year];
}

export function topicFromSlug(
  subject: SubjectId,
  year: YearId,
  slug: string,
): string | undefined {
  return topicList(subject, year).find((t) => slugify(t) === slug);
}

export const topicColors = ["bg-sky", "bg-peach", "bg-lavender", "bg-lemon", "bg-mint"];

const topicEmojis: Record<string, string> = {
  // Bahasa Melayu
  Huruf: "🔠",
  "Suku Kata": "🧩",
  Perkataan: "📝",
  "Frasa dan Ayat Mudah": "💬",
  "Kata Nama Am": "🏷️",
  "Kata Nama": "🏷️",
  "Kata Kerja": "🏃",
  "Kata Adjektif": "🌈",
  "Kata Sendi Nama": "🔗",
  "Kata Hubung": "🪢",
  "Ayat Tanya": "❓",
  "Ayat Perintah": "❗",
  Pemahaman: "📖",
  "Kata Ganti Nama": "👥",
  "Kata Arah": "🧭",
  "Kata Seru": "😲",
  "Simpulan Bahasa": "🪷",
  "Peribahasa Mudah": "🗣️",
  // English
  Alphabet: "🔤",
  Phonics: "🔊",
  Numbers: "🔢",
  Colours: "🎨",
  Family: "👨‍👩‍👧",
  "My Classroom": "🏫",
  Reading: "📚",
  Writing: "✍️",
  "Grammar in Context": "📘",
  "Food & Drinks": "🍜",
  Animals: "🐘",
  "Daily Activities": "⏰",
  Places: "🗺️",
  Verbs: "🏃",
  Adjectives: "🌈",
  Weather: "🌤️",
  Hobbies: "⚽",
  Health: "🩺",
  Stories: "📕",
  Comprehension: "🔍",
  // Matematik
  "Nombor hingga 100": "💯",
  "Nombor hingga 1000": "🔢",
  "Nombor hingga 10,000": "🧮",
  Tambah: "➕",
  Tolak: "➖",
  Darab: "✖️",
  Bahagi: "➗",
  Pecahan: "🍕",
  Wang: "💰",
  "Masa dan Waktu": "🕐",
  "Bentuk Asas": "🔷",
  Panjang: "📏",
  Jisim: "⚖️",
  "Isipadu Cecair": "🥤",
  "Penyelesaian Masalah": "🧠",
  // Sains
  "Kemahiran Saintifik": "🔬",
  "Bahagian Badan Manusia": "🧍",
  "Deria Manusia": "👀",
  Haiwan: "🐢",
  Tumbuhan: "🌱",
  "Cahaya dan Gelap": "💡",
  "Keperluan Asas Haiwan": "🐾",
  "Keperluan Asas Tumbuhan": "🌻",
  "Makanan Sihat": "🥗",
  Air: "💧",
  Bunyi: "🔔",
  Magnet: "🧲",
  Bumi: "🌍",
  "Sistem Pernafasan": "🫁",
  Gigi: "🦷",
  "Tumbuhan Membiak": "🌼",
  Bahan: "🧱",
  Cuaca: "⛅",
  "Kitaran Air": "🌧️",
};

export function topicEmoji(topic: string): string {
  return topicEmojis[topic] ?? "⭐";
}
