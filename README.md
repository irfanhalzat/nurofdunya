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
- Arabic recitation with per-verse playback, continuous play within the current surah, pause/resume, verse navigation, seeking, and optional verse following.
- Native dialogs support Escape, focus containment, and return focus to the opening control.
- Reduced-motion preferences are respected; no continuously running carousel render loop.
- Last opened chapter is stored on this device; successful texts are cached for the current session.

## Text sources

Arabic (`quran-uthmani`), Muhammad Asad English (`en.asad`), and Ma Jian Chinese (`zh.jian`) are loaded from [AlQuran Cloud](https://alquran.cloud). The reader preserves returned Arabic text and validates edition completeness and verse numbering before display. A 15-second timeout and retry state handle unavailable text services. Translations are interpretations of meaning.

Juz starting surah and verse are aligned to the AlQuran Cloud API boundaries. Traditional juz names may reflect a different boundary convention. Existing thematic hadith records remain in `src/data/hadiths.json`; Quran quotations are not presented as hadith.

## Recitation sources

Original recordings are streamed on user request from the [AlQuran Cloud audio CDN](https://alquran.cloud/cdn): Mishary Rashid Alafasy (`ar.alafasy`, 128 kbps), Mahmoud Khalil Al-Husary (`ar.husary`, 64 kbps), and Abdurrahmaan As-Sudais (`ar.abdurrahmaansudais`, 192 kbps). URLs use the Arabic edition's global ayah number, not its surah-local verse number. Recitation remains in Arabic when the displayed translation changes.

The [provider's terms](https://alquran.cloud/terms-and-conditions) permit streaming and embedding for personal and educational use. Recording copyrights remain with the reciters or their estates; these recordings are not claimed to be under an open-source software license. Attribution is visible in the player. The app neither bundles the audio corpus nor offers an offline download. Native audio playback starts only after an explicit action and stops when the reader closes. Audio failure leaves the text available, with a separate retry control. Availability depends on the external CDN.

The previous carousel import path remains available through `QuranCarousel.tsx`. Production publishing is a separate step from local preview.
