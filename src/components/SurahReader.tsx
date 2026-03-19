import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
// @ts-ignore
import HTMLFlipBookRaw from 'react-pageflip';

const HTMLFlipBook = HTMLFlipBookRaw as any;
import type { GraphNode } from '../types';

interface SurahReaderProps {
    surah: GraphNode;
    onClose: () => void;
}

interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
}

interface FetchedSurahEdition {
    edition: { identifier: string; language: string };
    ayahs: Ayah[];
}

// Group ayahs into readable chunks for pages
const AYAHS_PER_PAGE = 3;

export default function SurahReader({ surah, onClose }: SurahReaderProps) {
    const [loading, setLoading] = useState(true);
    const [arabicAyahs, setArabicAyahs] = useState<Ayah[]>([]);
    const [englishAyahs, setEnglishAyahs] = useState<Ayah[]>([]);
    const [chineseAyahs, setChineseAyahs] = useState<Ayah[]>([]);
    const [error, setError] = useState<string | null>(null);

    const bookRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        fetch(`http://api.alquran.cloud/v1/surah/${surah.id}/editions/quran-uthmani,en.asad,zh.jian`)
            .then(res => res.json())
            .then(data => {
                if (data.code === 200 && isMounted) {
                    // API returns array of editions
                    const ar = data.data.find((e: FetchedSurahEdition) => e.edition.language === 'ar');
                    const en = data.data.find((e: FetchedSurahEdition) => e.edition.language === 'en');
                    const zh = data.data.find((e: FetchedSurahEdition) => e.edition.language === 'zh');
                    setArabicAyahs(ar?.ayahs || []);
                    setEnglishAyahs(en?.ayahs || []);
                    setChineseAyahs(zh?.ayahs || []);
                    setLoading(false);
                } else if (isMounted) {
                    setError('Failed to load Surah text.');
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError('Network error while loading Surah.');
                    setLoading(false);
                }
            });

        return () => { isMounted = false; };
    }, [surah.id]);

    // Create chunks pairs [English Chunk, Arabic Chunk, Chinese Chunk] parallel
    const pages = useMemo(() => {
        if (!arabicAyahs.length || !englishAyahs.length || !chineseAyahs.length) return [];

        const chunks = [];
        for (let i = 0; i < arabicAyahs.length; i += AYAHS_PER_PAGE) {
            chunks.push({
                ar: arabicAyahs.slice(i, i + AYAHS_PER_PAGE),
                en: englishAyahs.slice(i, i + AYAHS_PER_PAGE),
                zh: chineseAyahs.slice(i, i + AYAHS_PER_PAGE)
            });
        }
        return chunks;
    }, [arabicAyahs, englishAyahs, chineseAyahs]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
            >
                {/* Dark overlay backdrop */}
                <div className="absolute inset-0 bg-[#000011]/80 backdrop-blur-md" onClick={onClose} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-white/60 hover:text-amber-400 transition-colors z-50 p-2 rounded-full bg-white/5 hover:bg-white/10"
                >
                    <X size={32} />
                </button>

                {/* Book Container */}
                <div className="relative z-10 drop-shadow-2xl">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center text-amber-500/70 p-20 bg-[#070a1e]/80 rounded-2xl border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                            <Loader2 className="animate-spin mb-4" size={48} />
                            <p className="font-light tracking-widest text-sm text-white/70">CALLING THE SCROLLS...</p>
                        </div>
                    ) : error ? (
                        <div className="text-red-400 p-8 bg-black/50 rounded-lg">{error}</div>
                    ) : (
                        <HTMLFlipBook
                            width={500}
                            height={700}
                            size="fixed"
                            minWidth={315}
                            maxWidth={1000}
                            minHeight={400}
                            maxHeight={1533}
                            maxShadowOpacity={0.5}
                            showCover={true}
                            mobileScrollSupport={true}
                            className="book-theme group"
                            ref={bookRef}
                            usePortrait={false}
                        >
                            {/* Front Cover */}
                            <div className="page page-cover bg-[#2b1f13] border-[8px] border-double border-[#d4a04a] rounded-r-2xl overflow-hidden shadow-[inset_-5px_0_20px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" />
                                <div className="z-10 text-center px-8 relative">
                                    <div className="border-[4px] border-double border-[#d4a04a]/70 p-6 rounded-lg bg-[#241a10]">
                                        <h1 className="text-[#d4a04a] text-6xl font-bold mb-6 drop-shadow-lg" style={{ fontFamily: 'Amiri, serif' }}>
                                            {surah.arabicName}
                                        </h1>
                                        <h2 className="text-[#f4ecd8] text-3xl font-light tracking-wide mb-2" style={{ fontFamily: '"Crimson Pro", serif' }}>
                                            {surah.name}
                                        </h2>
                                        <div className="flex items-center justify-center gap-4 text-[#d4a04a]/80 mt-8 text-sm tracking-widest uppercase" style={{ fontFamily: '"Crimson Pro", serif' }}>
                                            <span>{surah.revelationType}</span>
                                            <span>•</span>
                                            <span>{surah.verseCount} Verses</span>
                                        </div>
                                    </div>
                                    <p className="text-[#d4a04a]/50 text-xs mt-16 tracking-widest animate-pulse font-light" style={{ fontFamily: '"Inter", sans-serif' }}>DRAG PAGE TO OPEN</p>
                                </div>
                            </div>

                            {/* Inside Cover Left (Empty Parchment) */}
                            <div className="page bg-[#f4ecd8] shadow-[inset_10px_0_20px_rgba(0,0,0,0.2)] relative">
                                <div className="absolute inset-5 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                                <div className="absolute inset-6 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                            </div>

                            {/* Inside Cover Right (Bismillah) */}
                            <div className="page bg-[#fdfaf6] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.2)] flex items-center justify-center relative">
                                <div className="absolute inset-5 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                                <div className="absolute inset-6 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                                {surah.id !== 1 && surah.id !== 9 && (
                                    <div className="absolute top-10 bottom-12 left-10 right-10 z-10 flex items-start justify-center pt-16">
                                        <h2 className="text-[#1a1a1a] text-4xl drop-shadow-sm" style={{ fontFamily: 'Amiri, serif' }}>
                                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                        </h2>
                                    </div>
                                )}
                            </div>

                            {/* Content Spreads */}
                            {pages.map((chunk, index) => (
                                [
                                    // LEFT PAGE: Translations (English & Chinese)
                                    <div key={`page-${index}-en-zh`} className="page bg-[#f4ecd8] text-[#2c2c2c] shadow-[inset_10px_0_20px_rgba(0,0,0,0.15)] relative">
                                        <div className="absolute inset-5 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                                        <div className="absolute inset-6 border border-[#d4a04a]/30 pointer-events-none z-0"></div>

                                        <div className="absolute top-10 bottom-12 left-10 right-10 z-10">
                                            <div className="h-full overflow-y-auto pr-6 custom-scrollbar text-justify pb-4">
                                                {chunk.en.map((ayah, i) => (
                                                    <div key={ayah.number} className="mb-8 leading-relaxed">
                                                        <span className="text-[#8b0000] text-sm mr-2 font-bold inline-block align-top mt-1" style={{ fontFamily: '"Crimson Pro", serif' }}>{ayah.numberInSurah}.</span>
                                                        <div className="inline-block" style={{ width: 'calc(100% - 30px)' }}>
                                                            <p className="text-[17px] mb-3" style={{ fontFamily: '"Crimson Pro", serif', lineHeight: '1.6' }}>{ayah.text}</p>
                                                            <p className="font-sans text-[14px] text-[#4a4a4a] tracking-wider leading-relaxed">
                                                                {chunk.zh[i]?.text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-5 left-0 right-0 text-center text-[#d4a04a]/80 text-sm" style={{ fontFamily: '"Crimson Pro", serif' }}>{index * 2 + 1}</div>
                                    </div>,

                                    // RIGHT PAGE: Arabic Quran
                                    <div key={`page-${index}-ar`} className="page bg-[#fdfaf6] text-[#1a1a1a] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.15)] relative">
                                        <div className="absolute inset-5 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                                        <div className="absolute inset-6 border border-[#d4a04a]/30 pointer-events-none z-0"></div>

                                        <div className="absolute top-10 bottom-12 left-10 right-10 z-10">
                                            <div className="h-full overflow-y-auto pl-6 pr-2 custom-scrollbar pb-4" dir="rtl">
                                                <div className="w-full text-justify" style={{ textAlignLast: 'center', lineHeight: '2.4' }}>
                                                    {chunk.ar.map((ayah) => (
                                                        <span key={ayah.number} className="inline font-normal text-[32px] text-[#1a1a1a]" style={{ fontFamily: 'Amiri, serif' }}>
                                                            {ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim()}
                                                            <span className="inline-block mx-2 text-[#d4a04a] text-2xl whitespace-nowrap align-middle" dir="ltr" style={{ fontFamily: 'Amiri, serif' }}>
                                                                ﴾{ayah.numberInSurah.toLocaleString('ar-SA')}﴿
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-5 left-0 right-0 text-center text-[#d4a04a]/80 text-sm" style={{ fontFamily: '"Crimson Pro", serif' }}>{index * 2 + 2}</div>
                                    </div>
                                ]
                            )).flat()}

                            {/* Back Cover Left */}
                            <div className="page bg-[#f4ecd8] shadow-[inset_10px_0_20px_rgba(0,0,0,0.2)] flex items-center justify-center relative">
                                <div className="absolute inset-5 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                                <div className="absolute inset-6 border border-[#d4a04a]/30 pointer-events-none z-0"></div>
                                <p className="text-[#1a1a1a] font-normal text-4xl" style={{ fontFamily: 'Amiri, serif' }}>صَدَقَ اللهُ العَظِيم</p>
                            </div>

                            {/* Back Cover */}
                            <div className="page page-cover bg-[#2b1f13] border-[8px] border-double border-[#d4a04a] rounded-l-2xl shadow-[inset_5px_0_20px_rgba(0,0,0,0.8)] relative">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" />
                            </div>

                        </HTMLFlipBook>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Add CSS for custom scrollbar to global styles or via style tag
<style dangerouslySetInnerHTML={{
    __html: `
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(245, 158, 11, 0.4);
}
`}} />
