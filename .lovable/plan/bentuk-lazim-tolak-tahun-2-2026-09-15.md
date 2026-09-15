# Bentuk Lazim Tolak Tahun 2

## Scope
Only change **Matematik → Tahun 2 → Tolak**. All other subjects, years, topics, and quiz formats remain unchanged.

## Implementation
- Add a dedicated 40-question subtraction experience using KSSR Year 2 ranges, including no borrowing, one borrow, chained borrowing, three-digit subtraction, and Malaysian word-problem contexts.
- Render each question as a worksheet-style vertical subtraction board with `Ratus | Puluh | Sa` and automatic `Ribu` support, aligned digits, a minus sign, a strong answer line, and one tappable answer box per result digit.
- Use the existing pastel keypad layout with digit entry, active-box highlighting, backspace, clear-all, automatic movement, and an explicit answer check.
- Model borrowing right-to-left. When needed, animate the crossed-out source digit, its reduced replacement above, and the expanded receiving value such as `14`; reveal each borrowing step as the child completes the relevant answer column.
- Preserve the existing 40-question progress, saved resume position, score, sounds, correct-answer confetti, five lives, result stars, and motivational ending.
- Route only `/kuiz/mt/2/tolak` to this dedicated experience; all other routes keep their current behavior.

## Validation
- Verify representative no-borrow, one-borrow, and chained-borrow calculations, including `694 − 228 = 466`.
- Verify keypad entry, active-box movement, backspace, clear-all, per-box green/red feedback, next-question flow, save-and-exit, and resume on a phone viewport.
- Confirm Matematik Tahun 2 Tambah and another ordinary quiz remain unchanged.
- Confirm the project builds without errors.

## Technical details
- Keep question generation deterministic by question index so resumed sessions display the same operands.
- Derive display columns, result digits, and each borrowing transformation from the minuend and subtrahend rather than hard-coding visual states.
- Continue storing one numeric correctness value per completed question in the existing progress structure.
