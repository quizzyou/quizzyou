import { getQuestions } from "./src/lib/questions";
const topics: [string, string, number][] = [
  ["Weather", "Weather", 15],
  ["Hobbies", "Hobbies", 15],
  ["Health", "Health", 10],
  ["Comprehension", "Comprehension", 15],
];
let bad = 0;
for (const [slug, topic, want] of topics) {
  const qs = getQuestions("en", "3", topic);
  const issues: string[] = [];
  if (qs.length !== want) issues.push(`count ${qs.length} != ${want}`);
  qs.forEach((q, i) => {
    if (new Set(q.choices).size !== q.choices.length) issues.push(`q${i + 1} dup choices`);
    if (q.answer < 0 || q.answer >= q.choices.length) issues.push(`q${i + 1} bad index`);
    if (!q.choices[q.answer]) issues.push(`q${i + 1} missing answer`);
  });
  console.log(topic, qs.length, issues.length ? "BAD: " + issues.join("; ") : "ok");
  if (issues.length) bad++;
}
console.log(bad === 0 ? "ALL OK" : `${bad} bad`);
