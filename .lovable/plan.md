# Interactive Bentuk Lazim for Tambah Tahun 2

## Scope
Only change **Matematik → Tahun 2 → Tambah**. Every other subject, year, topic, and quiz format remains unchanged.

## Implementation
- Replace the generated Tahun 2 Tambah bank with 40 deterministic KSSR-aligned addition questions covering:
  - addition without carrying
  - one carry
  - multiple carries
  - three-digit addition
  - Malaysian word-problem contexts involving RM, books, pencils, fruit, and school items
- Mark these questions for a dedicated interactive Bentuk Lazim presentation while preserving the shared question model for all other quizzes.
- Add a Tahun 2 Tambah-only answer screen that:
  - labels columns as `Ribu | Ratus | Puluh | Sa` when needed, otherwise shows the required place-value columns
  - aligns both addends vertically
  - provides one tappable answer box per digit
  - uses a pastel on-screen keypad with digits and a delete key
  - advances focus automatically after each entered digit
  - checks the completed answer, then uses the existing correct/wrong sounds, scoring, progress advance, and confetti behavior
- Reveal carry digits above the next column after the student completes the relevant source column, using a soft entrance animation. Carry values are calculated from right to left, including chained carries.
- Keep saved quiz progress compatible with the existing local storage structure so leaving and resuming returns to the exact question and score.

## Validation
- Verify all 40 Tahun 2 Tambah questions are unique and include the required carrying/content mix.
- Verify keypad entry, deletion, box selection, carry reveals, correct/wrong feedback, question advance, save-and-exit, and resume on a phone-sized screen.
- Confirm another quiz topic still uses the existing four-choice format unchanged.
- Confirm the project builds without errors.

## Technical details
- Extend the question type with an optional mode/context field rather than changing the behavior of ordinary questions.
- Keep the existing persisted `answers` array numeric by recording the entered total for this topic.
- Derive place-value columns and carries from the two addends, so three- and four-column layouts stay aligned on small screens.
