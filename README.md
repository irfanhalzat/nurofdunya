# Nur of Dunya

A quiet, responsive Quran reading experience built with React, TypeScript, and Vite.

## Run locally

```sh
npm ci
npm run dev
```

`npm run build` creates the production bundle in `dist`. `npm run lint` checks the source.

## Experience

- Emerald and gold sanctuary with an accessible chapter carousel.
- Swipe, horizontal trackpad, arrow keys, or arrow buttons to explore; `/` opens search.
- Search 114 surahs by number, Arabic name, or transliteration, or browse 30 juz.
- Responsive reading dialog with original Arabic and English, Chinese, or Arabic-only display.
- Native dialogs support Escape, focus containment, and return focus to the opening control.
- Reduced-motion preferences are respected; no continuously running carousel render loop.
- Last opened chapter is stored on this device; successful texts are cached for the current session.

## Text sources

Arabic (`quran-uthmani`), Muhammad Asad English (`en.asad`), and Ma Jian Chinese (`zh.jian`) are loaded from [AlQuran Cloud](https://alquran.cloud). The reader preserves returned Arabic text and validates edition completeness and verse numbering before display. A 15-second timeout and retry state handle unavailable text services. Translations are interpretations of meaning.

Juz starting surah and verse are aligned to the AlQuran Cloud API boundaries. Traditional juz names may reflect a different boundary convention. Existing thematic hadith records remain in `src/data/hadiths.json`; Quran quotations are not presented as hadith.

The previous carousel import path remains available through `QuranCarousel.tsx`. Production publishing is a separate step from local preview.
