# KSSR Quizzes Fun

🌈 QUIZZY – Build a Complete Quiz Web App for Malaysian Primary School (Tahap 1)



Build a mobile-first responsive web app called QUIZZY for Malaysian primary school students (Tahap 1: Tahun 1, Tahun 2, Tahun 3).



The app is specifically designed for Malaysian children aged 7–9 and must follow the latest KSSR Semakan syllabus.



---



🎨 Theme & Style



- Cute, simple, colourful and creative.

- Pastel colours only (soft blue, soft peach, soft lavender, pale yellow).

- Minimalist UI, clean and not messy.

- Rounded buttons and cards.

- Big, child-friendly fonts.

- School-themed icons and illustrations

- No cartoon characters or wavy backgrounds.

- Smooth animations, click effects and sound effects.

- Fit perfectly on all phone screens.



---



🔐 Page 1 — Access Code



Create a beautiful access code page with:



- Title: QUIZZY

- Subtitle: Masukkan Kod Akses.

- Cute white color numeric keypad.

- Six circles showing entered digits.

- Access code: 456123.



Animation



When the code is correct:



- Play a success sound.

- A wooden classroom door appears.

- The wooden door slowly opens.

- Sparkles appear.

- Transition to the next page.



If the code is wrong:



- Door shakes gently.

- Play a soft error sound.

- Reset the input.



First-Time Access (IMPORTANT)



The Access Code page appears only once on a device.



Use localStorage ("accessGranted = true") so students never need to enter the code again unless local storage is cleared.



---



📚 Page 2 — Pilih Subjek



Create four large colourful pastel subject cards with click animations and sound effects.



- 📖 Bahasa Melayu

- 🔤 English

- ➕ Matematik

- 🔬 Sains



Each card should:



- Have a cute icon.

- Bounce slightly when tapped.

- Play a soft click sound.



---



🌼 Page 3 — Pilih Tahun



Create three rounded pastel buttons:



- Tahun 1

- Tahun 2

- Tahun 3



Save the selected year.



---



📖 Page 4 — Pilih Topik



Show the correct topics based on the selected Subject + Year.



Each topic is displayed as a colourful rounded pastel card.



Bahasa Melayu



Tahun 1



- Huruf

- Suku Kata

- Perkataan

- Frasa dan Ayat Mudah

- Kata Nama Am

- Kata Kerja



Tahun 2



- Kata Nama

- Kata Kerja

- Kata Adjektif

- Kata Sendi Nama

- Kata Hubung

- Ayat Tanya

- Ayat Perintah

- Pemahaman



Tahun 3



- Kata Ganti Nama

- Kata Arah

- Kata Seru

- Simpulan Bahasa

- Peribahasa Mudah

- Pemahaman



English



Tahun 1



- Alphabet

- Phonics

- Numbers

- Colours

- Family

- My Classroom

- Reading

- Writing



Tahun 2



- Grammar in Context

- Food & Drinks

- Animals

- Daily Activities

- Places

- Reading

- Writing



Tahun 3



- Grammar in Context

- Verbs

- Adjectives

- Weather

- Hobbies

- Health

- Stories

- Comprehension



Matematik



Tahun 1



- Nombor hingga 100

- Tambah

- Tolak

- Wang

- Masa dan Waktu

- Bentuk Asas

- Penyelesaian Masalah



Tahun 2



- Nombor hingga 1000

- Tambah

- Tolak

- Darab

- Wang

- Masa dan Waktu

- Panjang

- Penyelesaian Masalah



Tahun 3



- Nombor hingga 10,000

- Darab

- Bahagi

- Pecahan

- Wang

- Jisim

- Isipadu Cecair

- Penyelesaian Masalah



Sains



Tahun 1



- Kemahiran Saintifik

- Bahagian Badan Manusia

- Deria Manusia

- Haiwan

- Tumbuhan

- Cahaya dan Gelap



Tahun 2



- Keperluan Asas Haiwan

- Keperluan Asas Tumbuhan

- Makanan Sihat

- Air

- Bunyi

- Magnet

- Bumi



Tahun 3



- Sistem Pernafasan

- Gigi

- Tumbuhan Membiak

- Bahan

- Cuaca

- Kitaran Air



---



📝 Quiz Features



Each topic contains exactly 40 unique questions.



Quiz UI



- One question per screen.

- Progress bar (Example: 12 / 40).

- Four answer choices.

- Large colourful buttons.

- Button click animation.

- Correct/Wrong sound effects.

- Confetti when correct.

- Gentle shake when wrong.



---



🔢 Mathematics Requirement (VERY IMPORTANT)



Mathematics questions must support bentuk lazim exactly like Malaysian primary school worksheets.



Include:



- Tambah bentuk lazim.

- Tolak bentuk lazim.

- Darab bentuk lazim.

- Carrying and borrowing.

- Proper vertical number alignment.

- Word problems using Malaysian contexts (RM, fruits, school items, time, money).



---



💾 Continue Progress (VERY IMPORTANT)



Automatically save quiz progress using localStorage.



Save separately for every:



- Subject.

- Year.

- Topic.



Save:



- Current question number.

- Selected answers.

- Current score.



If students leave the app before finishing:



- Show Continue Quiz on the dashboard.

- Continue from the exact question they stopped at.

- Never restart from Question 1.



---



🎉 Score Page



After completing 40 questions, display:



- Score out of 40.

- Percentage.

- ⭐ 1–5 star rating.

- Encouraging message.

- Confetti celebration.

- Celebration sound.



Buttons:



- Cuba Lagi.

- Teruskan Belajar.

- Kembali ke Topik.



---



🔊 Sound Effects



Add fun sound effects throughout the app.



- Soft click sound for every button.

- Success sound for correct answers.

- Soft error sound for wrong answers.

- Magical unlock sound for access code.

- Celebration sound after quiz completion.



Include a Sound ON/OFF setting.



---



⚙️ Technical Requirements



Build the project from scratch using React (preferred).



Requirements:



- Reusable React components.

- Responsive layout.

- Smooth page transitions.

- LocalStorage for saving progress.

- Clean folder structure.

- Fast loading.



---



🇲🇾 KSSR Malaysia Requirement



This app is specifically for Malaysian primary school students following the latest KSSR Semakan Tahap 1 syllabus.



Generate quiz questions using:



- Bahasa Melayu Malaysia.

- Malaysian English.

- Malaysian names (Ali, Siti, Mei Ling, Kumar).

- Malaysian Ringgit (RM) where relevant.

- Vocabulary suitable for Year 1–3 students.



Do not use foreign curriculum content.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quizzyou.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2fe41f3b-df11-4264-9407-efa6946b07b8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
