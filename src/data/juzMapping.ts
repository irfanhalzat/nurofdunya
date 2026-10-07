// Juz (Part) starting positions for the Holy Quran.
// Boundaries follow AlQuran Cloud quran-uthmani Juz metadata:
// https://api.alquran.cloud/v1/juz/{juz}/quran-uthmani?offset=0&limit=1
// Traditional labels are retained; their opening words can follow another
// division convention and do not determine the starting verse.

export interface JuzInfo {
    juz: number;
    label: string;
    startSurah: number;
    startVerse: number;
}

export const JUZ_DATA: JuzInfo[] = [
    { juz: 1,  startSurah:  1, startVerse:   1, label: "Alif Lam Mim" },
    { juz: 2,  startSurah:  2, startVerse: 142, label: "Sayaqul" },
    { juz: 3,  startSurah:  2, startVerse: 253, label: "Tilkar Rusul" },
    { juz: 4,  startSurah:  3, startVerse:  93, label: "Lan Tanaloo" },
    { juz: 5,  startSurah:  4, startVerse:  24, label: "Wal Muhsanat" },
    { juz: 6,  startSurah:  4, startVerse: 148, label: "La Yuhibbu" },
    { juz: 7,  startSurah:  5, startVerse:  82, label: "Wa Idha Sami'u" },
    { juz: 8,  startSurah:  6, startVerse: 111, label: "Wa Law Annana" },
    { juz: 9,  startSurah:  7, startVerse:  88, label: "Qalal Mala'u" },
    { juz: 10, startSurah:  8, startVerse:  41, label: "Wa A'lamu" },
    { juz: 11, startSurah:  9, startVerse:  93, label: "Ya'tadhiruna" },
    { juz: 12, startSurah: 11, startVerse:   6, label: "Wa Ma Min Dabbah" },
    { juz: 13, startSurah: 12, startVerse:  53, label: "Wa Ma Ubarri'u" },
    { juz: 14, startSurah: 15, startVerse:   1, label: "Rubama" },
    { juz: 15, startSurah: 17, startVerse:   1, label: "Subhanal Ladhi" },
    { juz: 16, startSurah: 18, startVerse:  75, label: "Qal Alam" },
    { juz: 17, startSurah: 21, startVerse:   1, label: "Iqtaraba" },
    { juz: 18, startSurah: 23, startVerse:   1, label: "Qad Aflaha" },
    { juz: 19, startSurah: 25, startVerse:  21, label: "Wa Qalal Ladhina" },
    { juz: 20, startSurah: 27, startVerse:  56, label: "Amman Khalaqa" },
    { juz: 21, startSurah: 29, startVerse:  46, label: "Utlu Ma Uhiya" },
    { juz: 22, startSurah: 33, startVerse:  31, label: "Wa Man Yaqnut" },
    { juz: 23, startSurah: 36, startVerse:  28, label: "Wa Mali" },
    { juz: 24, startSurah: 39, startVerse:  32, label: "Faman Azlamu" },
    { juz: 25, startSurah: 41, startVerse:  47, label: "Ilayhi Yuraddu" },
    { juz: 26, startSurah: 46, startVerse:   1, label: "Ha Mim" },
    { juz: 27, startSurah: 51, startVerse:  31, label: "Qala Fama" },
    { juz: 28, startSurah: 58, startVerse:   1, label: "Qad Sami'a" },
    { juz: 29, startSurah: 67, startVerse:   1, label: "Tabarakal Ladhi" },
    { juz: 30, startSurah: 78, startVerse:   1, label: "Amma Yatasa'alun" },
];
