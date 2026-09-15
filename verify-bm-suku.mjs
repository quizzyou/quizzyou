import { getQuestions } from "./src/lib/questions.ts";
const qs = getQuestions("bm", "1", "Suku Kata");
console.log("count:", qs.length);
let bad = 0;
qs.forEach((q, i) => {
  if (!q.choices.includes(q.choices[q.answer])) {
    console.log("bad answer index", i, q.prompt, q.answer, q.choices);
    bad++;
  }
  const set = new Set(q.choices.map(c => c.toLowerCase().trim()));
  if (set.size !== q.choices.length) {
    console.log("dup choices", i, q.prompt, q.choices);
    bad++;
  }
});
console.log("bad:", bad);
console.log("first:", qs[0]?.prompt, "->", qs[0]?.choices[qs[0]?.answer]);
console.log("last:", qs[qs.length - 1]?.prompt, "->", qs[qs.length - 1]?.choices[qs[qs.length - 1]?.answer]);
