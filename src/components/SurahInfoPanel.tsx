import type { GraphNode } from '../types';

interface SurahInfoPanelProps {
    surah: GraphNode | null;
    onClose: () => void;
    onRead: () => void;
    onReadHadith: () => void;
}

const MECCAN_HEX = '#A6633C';
const MEDINAN_HEX = '#2C5E4B';

export default function SurahInfoPanel({ surah, onClose, onRead, onReadHadith }: SurahInfoPanelProps) {
    if (!surah) return null;

    const accentColor = surah.revelationType === 'Meccan' ? MECCAN_HEX : MEDINAN_HEX;

    return (
        <div
            className="fixed bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 w-80 md:w-96 rounded-2xl p-6 animate-slide-up z-50 text-[#2C2A26]"
            style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 20px 40px rgba(150, 114, 59, 0.15), 0 0 0 1px rgba(255,255,255,0.5)',
            }}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-[#8A8273] hover:text-[#2C2A26] transition-colors cursor-pointer z-50 hover:bg-black/5"
            >
                ✕
            </button>

            {/* Header / Titles */}
            <div className="text-center mb-5 mt-2">
                <div
                    className="text-4xl md:text-5xl mb-3"
                    style={{
                        fontFamily: '"Amiri", serif',
                        color: accentColor,
                        direction: 'rtl'
                    }}
                >
                    {surah.arabicName}
                </div>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-lg font-medium tracking-wide text-[#2C2A26]">
                        {surah.name}
                    </span>
                    <span className="text-[#8A8273] text-sm font-light">
                        #{surah.id}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div
                className="h-px w-full mb-5 opacity-40 mx-auto max-w-[80%]"
                style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
            />

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <InfoCard
                    label="Revelation"
                    value={surah.revelationType}
                    accent={accentColor}
                />
                <InfoCard
                    label="Verses"
                    value={String(surah.verseCount)}
                    accent={accentColor}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
                <button
                    onClick={onRead}
                    className="w-full py-3.5 rounded-xl tracking-widest text-[10px] md:text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 group"
                    style={{
                        color: 'white',
                        background: accentColor,
                        boxShadow: `0 4px 15px ${accentColor}40`
                    }}
                >
                    <span className="opacity-90 group-hover:opacity-100 transition-opacity font-medium">Read Surah</span>
                </button>
                <button
                    onClick={onReadHadith}
                    className="w-full py-3 rounded-xl tracking-widest text-[10px] md:text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 group"
                    style={{
                        color: '#5C574F',
                        background: 'rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.05)',
                    }}
                >
                    <span className="opacity-80 group-hover:opacity-100 transition-opacity font-medium hover:text-[#2C2A26]">Read Hadith</span>
                </button>
            </div>
        </div>
    );
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent: string }) {
    return (
        <div
            className="rounded-xl p-3 text-center transition-colors"
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}
        >
            <div className="text-[9px] uppercase tracking-widest text-[#8A8273] mb-1.5">{label}</div>
            <div className="text-[15px] font-medium" style={{ color: accent }}>{value}</div>
        </div>
    );
}
