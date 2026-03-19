import { useState, useEffect, useRef } from 'react';
import surahs from '../data/surahs.json';
import type { Surah, GraphNode } from '../types';
import SurahInfoPanel from './SurahInfoPanel';
import SurahReader from './SurahReader';
import HadithModal from './HadithModal';

const BG_COLOR = '#000011';
const MECCAN_HEX = '#FFB700';
const MEDINAN_HEX = '#00CFFF';

export default function SiratPath() {
    // Shared State for Modals/Panels
    const [selectedSurah, setSelectedSurah] = useState<GraphNode | null>(null);
    const [readingSurah, setReadingSurah] = useState<GraphNode | null>(null);
    const [viewingHadithSurah, setViewingHadithSurah] = useState<GraphNode | null>(null);

    // Intersection Observer for lighting up nodes as they scroll into the center
    const [activeNodes, setActiveNodes] = useState<Set<number>>(new Set());
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observer.current = new IntersectionObserver((entries) => {
            setActiveNodes(prev => {
                const next = new Set(prev);
                entries.forEach(entry => {
                    const id = Number(entry.target.getAttribute('data-id'));
                    if (entry.isIntersecting) {
                        next.add(id);
                    } else {
                        next.delete(id);
                    }
                });
                return next;
            });
        }, {
            root: null,
            rootMargin: '-35% 0px -35% 0px', // Only trigger when roughly in the middle 30% of the screen
            threshold: 0
        });

        const elements = document.querySelectorAll('.surah-node');
        elements.forEach(el => observer.current?.observe(el));

        return () => observer.current?.disconnect();
    }, []);

    const toGraphNode = (s: Surah): GraphNode => ({
        id: s.id,
        name: s.transliterationName,
        arabicName: s.arabicName,
        revelationType: s.revelationType as 'Meccan' | 'Medinan',
        verseCount: s.verseCount,
    });

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden selection:bg-[#d4a04a]/30" style={{ backgroundColor: BG_COLOR }}>

            {/* Background Stars (CSS-only for pure performance) */}
            <div className="fixed inset-0 pointer-events-none opacity-30 select-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:24px_24px] z-0"></div>

            {/* Title HUD */}
            <div className="fixed top-8 left-8 md:top-12 md:left-12 pointer-events-none select-none z-10 transition-opacity duration-700">
                <h1 className="text-xl md:text-3xl font-light tracking-[0.3em] text-white opacity-90" style={{ textShadow: '0 0 20px rgba(212, 160, 74, 0.4)' }}>
                    NUR OF DUNYA
                </h1>
                <p className="text-gray-400 text-[10px] md:text-xs mt-2 tracking-widest font-light opacity-60 uppercase">
                    The Illuminated Path
                </p>
            </div>

            {/* Legend */}
            <div className="fixed bottom-8 left-8 md:bottom-12 md:left-12 flex flex-col gap-4 text-[10px] md:text-[11px] uppercase tracking-widest text-gray-500 pointer-events-none select-none z-10">
                <div className="flex items-center gap-4">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: MECCAN_HEX, boxShadow: `0 0 12px 2px ${MECCAN_HEX}` }} />
                    <span className="opacity-70">Meccan</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: MEDINAN_HEX, boxShadow: `0 0 12px 2px ${MEDINAN_HEX}` }} />
                    <span className="opacity-70">Medinan</span>
                </div>
            </div>

            {/* The Path (Sirat) Container */}
            <div className="relative w-full max-w-2xl mx-auto px-4 flex flex-col items-center z-10" style={{ paddingTop: '50vh', paddingBottom: '50vh' }}>

                {/* The Central Line of Light */}
                <div className="absolute top-0 bottom-0 w-px left-1/2 -translate-x-1/2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    style={{
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.1) 90%, transparent)'
                    }}
                />

                {/* Nodes rendering sequentially */}
                {surahs.map((surah) => {
                    const isActive = activeNodes.has(surah.id);
                    const color = surah.revelationType === 'Meccan' ? MECCAN_HEX : MEDINAN_HEX;

                    // Alternating left/right layout
                    const isLeft = surah.id % 2 === 1;

                    return (
                        <div
                            key={surah.id}
                            data-id={surah.id}
                            className="surah-node relative flex items-center justify-center w-full h-32 md:h-48 my-4 md:my-8 group cursor-pointer"
                            onClick={() => setSelectedSurah(toGraphNode(surah as Surah))}
                        >
                            {/* The Center Node (Star) */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center">
                                {/* The physical dot */}
                                <div
                                    className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        backgroundColor: isActive ? color : '#334466',
                                        boxShadow: isActive ? `0 0 30px 4px ${color}, 0 0 60px 10px ${color}80, inset 0 0 10px white` : '0 0 0px transparent',
                                        transform: isActive ? 'scale(1.2)' : 'scale(1)',
                                    }}
                                />
                                {/* Soft ambient background glow to mimic WebGL Sprite */}
                                <div
                                    className="absolute w-20 h-20 md:w-32 md:h-32 rounded-full pointer-events-none transition-opacity duration-700 ease-out mix-blend-screen"
                                    style={{
                                        background: `radial-gradient(circle, ${color}40 0%, transparent 60%)`,
                                        opacity: isActive ? 1 : 0
                                    }}
                                />
                            </div>

                            {/* Text Labels - alternating sides on desktop, stacked on mobile */}
                            <div className={`absolute w-[40%] flex flex-col transition-all duration-700 ease-out sm:top-1/2 sm:-translate-y-1/2 text-center items-center ${isLeft ? 'sm:left-0 sm:items-end sm:text-right sm:pr-12' : 'sm:right-0 sm:items-start sm:text-left sm:pl-12'} z-20`}
                                style={{
                                    opacity: isActive ? 1 : 0.15,
                                    transform: `translateY(${isActive ? '0' : '10px'}) translateZ(0)`,
                                    filter: isActive ? 'blur(0px)' : 'blur(2px)' // depth of field effect
                                }}
                            >
                                <span
                                    className="text-2xl md:text-3xl font-serif text-[#fdfaf6] mb-1 group-hover:text-white transition-colors"
                                    style={{ textShadow: isActive ? `0 0 20px ${color}40` : 'none' }}
                                >
                                    {surah.transliterationName}
                                </span>
                                <span className="text-sm md:text-base opacity-50 tracking-widest font-serif" style={{ color }}>
                                    {surah.arabicName}
                                </span>
                                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-30 mt-2 font-sans">
                                    {surah.revelationType} • {surah.verseCount} Verses
                                </span>
                            </div>

                            {/* Horizontal connector line (only visible when focused) */}
                            <div className={`hidden sm:block absolute h-px transition-all duration-700 delay-100 ease-out z-0 top-1/2 -translate-y-1/2 ${isLeft ? 'right-1/2 w-16' : 'left-1/2 w-16'}`}
                                style={{
                                    background: `linear-gradient(to ${isLeft ? 'left' : 'right'}, ${color}80, transparent)`,
                                    opacity: isActive ? 1 : 0,
                                    width: isActive ? '80px' : '0px'
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Overlays */}
            <SurahInfoPanel
                surah={selectedSurah}
                onClose={() => setSelectedSurah(null)}
                onRead={() => setReadingSurah(selectedSurah)}
                onReadHadith={() => setViewingHadithSurah(selectedSurah)}
            />

            {readingSurah && (
                <SurahReader
                    surah={readingSurah}
                    onClose={() => setReadingSurah(null)}
                />
            )}

            {viewingHadithSurah && (
                <HadithModal
                    surah={viewingHadithSurah}
                    onClose={() => setViewingHadithSurah(null)}
                />
            )}
        </div>
    );
}
