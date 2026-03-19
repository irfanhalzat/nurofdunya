// Juz (Part) to starting Surah mapping for the Holy Quran
// Each Juz entry contains the Juz number, its traditional Arabic name,
// and the Surah ID where that Juz begins.

export interface JuzInfo {
    juz: number;
    label: string;
    startSurah: number;
}

export const JUZ_DATA: JuzInfo[] = [
    { juz: 1,  startSurah: 1,   label: "Alif Lam Mim" },
    { juz: 2,  startSurah: 2,   label: "Sayaqul" },
    { juz: 3,  startSurah: 2,   label: "Tilkar Rusul" },
    { juz: 4,  startSurah: 3,   label: "Lan Tanaloo" },
    { juz: 5,  startSurah: 4,   label: "Wal Muhsanat" },
    { juz: 6,  startSurah: 4,   label: "La Yuhibbu" },
    { juz: 7,  startSurah: 5,   label: "Wa Idha Sami'u" },
    { juz: 8,  startSurah: 6,   label: "Wa Law Annana" },
    { juz: 9,  startSurah: 7,   label: "Qalal Mala'u" },
    { juz: 10, startSurah: 8,   label: "Wa A'lamu" },
    { juz: 11, startSurah: 9,   label: "Ya'tadhiruna" },
    { juz: 12, startSurah: 11,  label: "Wa Ma Min Dabbah" },
    { juz: 13, startSurah: 12,  label: "Wa Ma Ubarri'u" },
    { juz: 14, startSurah: 15,  label: "Rubama" },
    { juz: 15, startSurah: 17,  label: "Subhanal Ladhi" },
    { juz: 16, startSurah: 18,  label: "Qal Alam" },
    { juz: 17, startSurah: 21,  label: "Iqtaraba" },
    { juz: 18, startSurah: 23,  label: "Qad Aflaha" },
    { juz: 19, startSurah: 25,  label: "Wa Qalal Ladhina" },
    { juz: 20, startSurah: 27,  label: "Amman Khalaqa" },
    { juz: 21, startSurah: 29,  label: "Utlu Ma Uhiya" },
    { juz: 22, startSurah: 33,  label: "Wa Man Yaqnut" },
    { juz: 23, startSurah: 36,  label: "Wa Mali" },
    { juz: 24, startSurah: 39,  label: "Faman Azlamu" },
    { juz: 25, startSurah: 41,  label: "Ilayhi Yuraddu" },
    { juz: 26, startSurah: 46,  label: "Ha Mim" },
    { juz: 27, startSurah: 51,  label: "Qala Fama" },
    { juz: 28, startSurah: 58,  label: "Qad Sami'a" },
    { juz: 29, startSurah: 67,  label: "Tabarakal Ladhi" },
    { juz: 30, startSurah: 78,  label: "Amma Yatasa'alun" },
];
