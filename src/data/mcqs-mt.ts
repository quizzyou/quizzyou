export type MathFixedMCQ = {
  prompt: string;
  choices: string[];
  answer: string;
  subTopic: "Tambah" | "Tolak" | "Pecahan" | "Wang" | "Masa dan Waktu";
};

export const mtYear1ProblemSolving: MathFixedMCQ[] = [
  {
    prompt: "Ali ada 5 biji guli. Abu beri lagi 3 biji guli kepada Ali. Berapakah jumlah guli Ali sekarang?",
    choices: ["8 biji", "7 biji", "6 biji", "9 biji"],
    answer: "8 biji",
    subTopic: "Tambah",
  },
  {
    prompt: "Siti membeli 10 biji karipap. Dia makan 4 biji karipap itu. Berapakah baki karipap Siti?",
    choices: ["6 biji", "5 biji", "7 biji", "4 biji"],
    answer: "6 biji",
    subTopic: "Tolak",
  },
  {
    prompt: "Di dalam sebuah bakul ada 12 biji epal merah dan 6 biji epal hijau. Berapakah jumlah semua epal itu?",
    choices: ["18 biji", "16 biji", "14 biji", "20 biji"],
    answer: "18 biji",
    subTopic: "Tambah",
  },
  {
    prompt: "Raju ada 15 batang pensil. 5 batang pensil telah patah. Berapakah pensil yang elok?",
    choices: ["10 batang", "9 batang", "11 batang", "8 batang"],
    answer: "10 batang",
    subTopic: "Tolak",
  },
  {
    prompt: "Ibu membeli seulas kek. Ibu memotong kek itu kepada dua bahagian yang sama besar. Apakah nama setiap bahagian itu?",
    choices: ["Setengah", "Satu perempat", "Tiga perempat", "Satu"],
    answer: "Setengah",
    subTopic: "Pecahan",
  },
  {
    prompt: "Zaquan ada sekeping wang RM5 dan sekeping wang RM1. Berapakah jumlah wang Zaquan?",
    choices: ["RM6", "RM4", "RM7", "RM5"],
    answer: "RM6",
    subTopic: "Wang",
  },
  {
    prompt: "Harga sebiji pemadam ialah 40 sen. Mei Ling membayar dengan wang 50 sen. Berapakah wang baki Mei Ling?",
    choices: ["10 sen", "20 sen", "5 sen", "15 sen"],
    answer: "10 sen",
    subTopic: "Wang",
  },
  {
    prompt: "Kanesh makan sarapan pagi sebelum pergi ke sekolah. Bilakah waktu Kanesh makan?",
    choices: ["Pagi", "Tengah hari", "Petang", "Malam"],
    answer: "Pagi",
    subTopic: "Masa dan Waktu",
  },
  {
    prompt: "Hari ini ialah hari Selasa. Apakah hari esok?",
    choices: ["Rabu", "Khamis", "Isnin", "Ahad"],
    answer: "Rabu",
    subTopic: "Masa dan Waktu",
  },
  {
    prompt: "Ada 8 ekor burung di atas dahan pohon. 3 ekor burung terbang lari. Berapakah burung yang tinggal?",
    choices: ["5 ekor", "6 ekor", "4 ekor", "7 ekor"],
    answer: "5 ekor",
    subTopic: "Tolak",
  },
  {
    prompt: "Sebuah bas ada 20 orang penumpang. Di perhentian bas, 7 orang penumpang turun. Berapakah penumpang yang tinggal?",
    choices: ["13 orang", "14 orang", "12 orang", "15 orang"],
    answer: "13 orang",
    subTopic: "Tolak",
  },
  {
    prompt: "Hafiz mengumpul 14 keping setem. Abangnya memberi lagi 4 keping setem. Berapakah setem Hafiz semuanya?",
    choices: ["18 keping", "17 keping", "19 keping", "16 keping"],
    answer: "18 keping",
    subTopic: "Tambah",
  },
  {
    prompt: "Fatimah melukis sebuah bulatan. Dia mewarnakan satu daripada empat bahagian bulatan itu. Apakah nilai pecahan kawasan berwarna?",
    choices: ["Satu perempat", "Setengah", "Dua perempat", "Satu"],
    answer: "Satu perempat",
    subTopic: "Pecahan",
  },
  {
    prompt: "Sarah membeli seketul ayam goreng berharga RM3 dan segelas air tebu berharga RM2. Berapakah wang yang perlu dibayar oleh Sarah?",
    choices: ["RM5", "RM6", "RM4", "RM7"],
    answer: "RM5",
    subTopic: "Wang",
  },
  {
    prompt: "Amin ada sehelai wang RM10. Dia membeli sebuah buku cerita berharga RM7. Berapakah baki wang Amin?",
    choices: ["RM3", "RM2", "RM4", "RM5"],
    answer: "RM3",
    subTopic: "Wang",
  },
  {
    prompt: "Selepas tamat waktu persekolahan pada waktu tengah hari, Amin pulang ke rumah. Apakah aktiviti yang sesuai dilakukan pada waktu malam?",
    choices: ["Tidur", "Pergi ke sekolah", "Bermain bola di padang", "Melihat matahari terbit"],
    answer: "Tidur",
    subTopic: "Masa dan Waktu",
  },
  {
    prompt: "Dalam satu kuiz, kumpulan A mendapat 9 markah manakala kumpulan B mendapat 7 markah. Berapakah jumlah markah kedua-dua kumpulan itu?",
    choices: ["16 markah", "15 markah", "17 markah", "14 markah"],
    answer: "16 markah",
    subTopic: "Tambah",
  },
  {
    prompt: "Kamal ada 18 biji rambutan. Dia memberi 9 biji rambutan kepada adiknya. Berapakah rambutan yang Kamal ada sekarang?",
    choices: ["9 biji", "8 biji", "10 biji", "7 biji"],
    answer: "9 biji",
    subTopic: "Tolak",
  },
  {
    prompt: "Yuki memotong sebiji pizza kepada 4 bahagian yang sama besar. Dia makan 3 bahagian daripada pizza itu. Apakah pecahan pizza yang telah dimakan?",
    choices: ["Tiga perempat", "Satu perempat", "Suku", "Separuh"],
    answer: "Tiga perempat",
    subTopic: "Pecahan",
  },
  {
    prompt: "Kila membeli gula-gula menggunakan tiga keping wang 20 sen. Berapakah jumlah harga gula-gula itu?",
    choices: ["60 sen", "50 sen", "40 sen", "30 sen"],
    answer: "60 sen",
    subTopic: "Wang",
  },
  {
    prompt: "Anil mengumpul 11 keping pelekat magnet. Jason pula ada 9 keping pelekat magnet. Berapakah jumlah pelekat mereka?",
    choices: ["20 keping", "19 keping", "21 keping", "18 keping"],
    answer: "20 keping",
    subTopic: "Tambah",
  },
  {
    prompt: "Kakak ada 16 biji telur. Sebanyak 4 biji telur telah pecah. Berapakah telur yang masih elok?",
    choices: ["12 biji", "13 biji", "11 biji", "14 biji"],
    answer: "12 biji",
    subTopic: "Tolak",
  },
  {
    prompt: "Ada 15 orang murid bermain di padang. Kemudian, 5 orang murid pulang ke kelas. Berapakah murid yang tinggal di padang?",
    choices: ["10 orang", "11 orang", "9 orang", "12 orang"],
    answer: "10 orang",
    subTopic: "Tolak",
  },
  {
    prompt: "Di atas meja ada sepotong kek. Abang makan separuh (setengah) daripada kek itu. Berapakah bahagian kek yang tinggal?",
    choices: ["Setengah", "Satu perempat", "Tiga perempat", "Tiada baki"],
    answer: "Setengah",
    subTopic: "Pecahan",
  },
  {
    prompt: "Rina mewarnakan satu daripada empat bahagian corak pada kertas. Apakah nama pecahan bagi kawasan berwarna itu?",
    choices: ["Satu perempat", "Tiga perempat", "Separuh", "Satu"],
    answer: "Satu perempat",
    subTopic: "Pecahan",
  },
  {
    prompt: "Chong simpan sekeping wang RM5, sekeping wang RM2, dan sekeping wang RM1. Berapakah jumlah wang simpanan Chong?",
    choices: ["RM8", "RM7", "RM9", "RM6"],
    answer: "RM8",
    subTopic: "Wang",
  },
  {
    prompt: "Siva ada wang 80 sen. Dia membeli sebatang pensil berharga 60 sen. Berapakah baki wang Siva?",
    choices: ["20 sen", "30 sen", "10 sen", "40 sen"],
    answer: "20 sen",
    subTopic: "Wang",
  },
  {
    prompt: "Harga sebiji biskut ialah 30 sen. Berapakah jumlah harga untuk dua biji biskut yang sama?",
    choices: ["60 sen", "50 sen", "40 sen", "70 sen"],
    answer: "60 sen",
    subTopic: "Wang",
  },
  {
    prompt: "Apakah nama bulan selepas bulan Januari?",
    choices: ["Februari", "Mac", "Disember", "April"],
    answer: "Februari",
    subTopic: "Masa dan Waktu",
  },
  {
    prompt: "Simi tidur pada waktu malam. Antara berikut, jam manakah yang menunjukkan waktu tidur Simi yang sesuai?",
    choices: ["Pukul 9:00 malam", "Pukul 12:00 tengah hari", "Pukul 3:00 petang", "Pukul 8:00 pagi"],
    answer: "Pukul 9:00 malam",
    subTopic: "Masa dan Waktu",
  },
  {
    prompt: "Sekolah Lin mengadakan aktiviti Hari Sukan pada hari Sabtu. Apakah hari sebelum Hari Sukan tersebut?",
    choices: ["Jumaat", "Khamis", "Ahad", "Isnin"],
    answer: "Jumaat",
    subTopic: "Masa dan Waktu",
  },
  {
    prompt: "Mei ada 7 batang krayon. Gopal ada 7 batang krayon juga. Berapakah jumlah krayon mereka semuanya?",
    choices: ["14 batang", "13 batang", "15 batang", "12 batang"],
    answer: "14 batang",
    subTopic: "Tambah",
  },
  {
    prompt: "Sebuah kedai ada 13 buah basikal. 4 buah basikal telah dijual. Berapakah basikal yang belum dijual?",
    choices: ["9 buah", "8 buah", "10 buah", "7 buah"],
    answer: "9 buah",
    subTopic: "Tolak",
  },
  {
    prompt: "Hana susun 12 biji blok mainan. Adiknya datang menambah 5 biji blok lagi. Berapakah jumlah blok sekarang?",
    choices: ["17 biji", "16 biji", "18 biji", "15 biji"],
    answer: "17 biji",
    subTopic: "Tambah",
  },
  {
    prompt: "Ibu membakar sebiji tat berbentuk bulatan. Ibu memotong tat itu kepada 4 bahagian sama besar. Apakah nama bagi 1 bahagian tat itu?",
    choices: ["Satu perempat", "Setengah", "Tiga perempat", "Dua perempat"],
    answer: "Satu perempat",
    subTopic: "Pecahan",
  },
  {
    prompt: "Zali membeli sebiji pemadam dengan harga 45 sen. Dia membayar dengan lima keping wang 10 sen. Berapakah wang baki Zali?",
    choices: ["5 sen", "10 sen", "15 sen", "20 sen"],
    answer: "5 sen",
    subTopic: "Wang",
  },
  {
    prompt: "Di dalam sebuah kotak ada 14 biji guli putih dan 5 biji guli hitam. Berapakah jumlah guli di dalam kotak itu?",
    choices: ["19 biji", "18 biji", "17 biji", "20 biji"],
    answer: "19 biji",
    subTopic: "Tambah",
  },
  {
    prompt: "Dina ada 20 keping biskut. Dia beri 8 keping biskut kepada kawannya. Berapakah biskut Dina yang tinggal?",
    choices: ["12 keping", "13 keping", "11 keping", "14 keping"],
    answer: "12 keping",
    subTopic: "Tolak",
  },
  {
    prompt: "Setiap tahun, kita menyambut Hari Kebangsaan pada bulan Ogos. Apakah bulan yang menyusul selepas bulan Ogos?",
    choices: ["September", "Julai", "Oktober", "November"],
    answer: "September",
    subTopic: "Masa dan Waktu",
  },
  {
    prompt: "Bapa ada wang RM10. Bapa memberi RM5 kepada abang untuk belanja sekolah. Berapakah baki wang bapa?",
    choices: ["RM5", "RM4", "RM6", "RM3"],
    answer: "RM5",
    subTopic: "Wang",
  },
];