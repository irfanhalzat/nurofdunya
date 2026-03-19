import type { GraphNode } from '../types';
import hadithsData from '../data/hadiths.json';

interface HadithModalProps {
    surah: GraphNode;
    onClose: () => void;
}

const MECCAN_HEX = '#d4a04a'; // Using a muted gold for parchment theme
const MEDINAN_HEX = '#3b82f6';

export default function HadithModal({ surah, onClose }: HadithModalProps) {
    // Find a specific hadith for this Surah, otherwise fallback to the general one (-1)
    const specificHadith = hadithsData.find(h => h.surahId === surah.id);
    const generalHadith = hadithsData.find(h => h.surahId === -1);

    // Fallback text if somehow both are missing
    const hadith = specificHadith || generalHadith || {
        arabicText: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
        englishText: "The best among you (Muslims) are those who learn the Qur'an and teach it.",
        source: "Sahih al-Bukhari 5027"
    };

    const isHoverMeccan = surah.revelationType === 'Meccan';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
            <div
                className="relative max-w-2xl w-full max-h-[85vh] flex flex-col rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#fdfaf6]"
                style={{
                    border: `1px solid ${isHoverMeccan ? MECCAN_HEX : MEDINAN_HEX}40`,
                }}
            >
                {/* Decorative border - remains fixed while content scrolls */}
                <div className="absolute inset-4 md:inset-5 border border-[#d4a04a]/30 pointer-events-none z-0 rounded-2xl"></div>
                <div className="absolute inset-5 md:inset-6 border border-[#d4a04a]/30 pointer-events-none z-0 rounded-xl"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center rounded-full text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors cursor-pointer z-20 hover:bg-black/5"
                >
                    ✕
                </button>

                {/* Scrollable Content Area */}
                <div className="relative z-10 flex flex-col items-center overflow-y-auto custom-scrollbar px-8 py-12 md:px-16 md:py-16">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-sm uppercase tracking-widest mb-2" style={{ color: isHoverMeccan ? MECCAN_HEX : MEDINAN_HEX, fontFamily: '"Crimson Pro", serif' }}>
                            Virtues of {surah.name}
                        </div>
                        <div className="text-[#1a1a1a] text-3xl font-serif">
                            Hadith
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-32 mb-10 bg-gradient-to-r from-transparent via-[#d4a04a]/50 to-transparent flex-shrink-0" />

                    {/* Arabic Text */}
                    <div
                        className="text-center text-3xl md:text-4xl leading-[2.2] mb-10 text-[#1a1a1a] w-full"
                        style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}
                    >
                        {hadith.arabicText}
                    </div>

                    {/* English Translation */}
                    <div
                        className="text-center text-lg md:text-xl leading-relaxed text-[#2c2c2c] mb-10"
                        style={{ fontFamily: '"Crimson Pro", serif' }}
                    >
                        "{hadith.englishText}"
                    </div>

                    {/* Source Tag */}
                    <div
                        className="inline-block px-5 py-2.5 rounded-full text-sm font-medium tracking-wide flex-shrink-0"
                        style={{
                            backgroundColor: `${isHoverMeccan ? MECCAN_HEX : MEDINAN_HEX}15`,
                            color: isHoverMeccan ? '#b27b22' : '#2563eb', // Darker shades for text legibility
                            fontFamily: '"Inter", sans-serif'
                        }}
                    >
                        {hadith.source}
                    </div>

                </div>
            </div>
        </div>
    );
}
