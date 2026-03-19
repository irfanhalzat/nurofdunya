import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/all';
import surahs from '../data/surahs.json';
import { JUZ_DATA } from '../data/juzMapping';
import type { Surah, GraphNode } from '../types';
import SurahReader from './SurahReader';
import HadithModal from './HadithModal';

gsap.registerPlugin(Observer);

// ── Design tokens ─────────────────────────────────────────
const BG = '#FCFaF5';
const MECCAN_HEX = '#A6633C';
const MEDINAN_HEX = '#2C5E4B';
const TOTAL = surahs.length; // 114
const ANGLE_PER_CARD = 360 / TOTAL; // ~3.158°

// ── Helpers ───────────────────────────────────────────────
const toRad = (deg: number) => (deg * Math.PI) / 180;

const toGraphNode = (s: Surah): GraphNode => ({
    id: s.id,
    name: s.transliterationName,
    arabicName: s.arabicName,
    revelationType: s.revelationType as 'Meccan' | 'Medinan',
    verseCount: s.verseCount,
});

// ══════════════════════════════════════════════════════════
//  QuranCarousel – The 3D Ring
// ══════════════════════════════════════════════════════════
export default function QuranCarousel() {
    // ── Modal state (shared with existing panels) ─────────
    const [readingSurah, setReadingSurah] = useState<GraphNode | null>(null);
    const [viewingHadithSurah, setViewingHadithSurah] = useState<GraphNode | null>(null);

    // ── Carousel state ────────────────────────────────────
    const [hoveredSurah, setHoveredSurah] = useState<Surah | null>(null);
    const [activeSurah, setActiveSurah] = useState<Surah | null>(null); // State for Center Stage, doesn't immediately clear on mouseLeave
    const [hoveredJuz, setHoveredJuz] = useState<number | null>(null);

    // ── Refs ──────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null);
    const rotationRef = useRef({ value: 0 }); // single animated value
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rafId = useRef<number>(0);
    const isDragging = useRef(false);
    const hoveredIndexRef = useRef<number>(-1); // tracked in RAF for smooth scale

    // ── Compute radius from viewport ─────────────────────
    const getRadius = useCallback(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return Math.min(w, h) * 0.52;
    }, []);

    // ── Render loop: update card transforms every frame ──
    const updateCards = useCallback(() => {
        const R = getRadius();
        const rot = rotationRef.current.value;
        const hIdx = hoveredIndexRef.current;

        cardRefs.current.forEach((el, i) => {
            if (!el) return;

            const angle = i * ANGLE_PER_CARD + rot;
            const angleRad = toRad(angle);

            const x = R * Math.sin(angleRad);
            const z = R * Math.cos(angleRad);

            // Depth factor: 0 = far back, 1 = front center
            const depth = (z + R) / (2 * R);
            const opacity = 0.12 + depth * 0.88;
            let scale = 0.55 + depth * 0.45;
            const zIndex = Math.round(depth * 1000);

            // Hover scale-up: lift the hovered card out of the ring
            const isHov = i === hIdx;
            if (isHov) scale *= 1.45;

            el.style.transform = `translate(-50%, -50%) translateX(${x}px) translateZ(${z + (isHov ? 40 : 0)}px) rotateY(${angle}deg) scale(${scale})`;
            el.style.opacity = String(isHov ? 1 : opacity);
            el.style.zIndex = String(isHov ? 2000 : zIndex);
            el.style.filter = 'none';
        });

        rafId.current = requestAnimationFrame(updateCards);
    }, [getRadius]);

    // ── Setup GSAP Observer + render loop ─────────────────
    useEffect(() => {
        // Start render loop
        rafId.current = requestAnimationFrame(updateCards);

        // GSAP Observer for drag + wheel
        const obs = Observer.create({
            target: containerRef.current!,
            type: 'pointer,touch,wheel',
            onPress: () => { isDragging.current = true; },
            onRelease: () => { isDragging.current = false; },
            onDrag: (self) => {
                // Horizontal drag → rotate
                setActiveSurah(null); // Clear center stage when actively navigating
                const delta = (self.deltaX || 0) * 0.3;
                gsap.to(rotationRef.current, {
                    value: rotationRef.current.value + delta,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            },
            onWheel: (self) => {
                // Wheel → rotate by card increments
                setActiveSurah(null); // Clear center stage when navigating
                const delta = self.deltaY > 0 ? -ANGLE_PER_CARD * 2 : ANGLE_PER_CARD * 2;
                gsap.to(rotationRef.current, {
                    value: rotationRef.current.value + delta,
                    duration: 0.8,
                    ease: 'power3.out',
                    overwrite: 'auto',
                });
            },
            // Inertia on release
            dragMinimum: 3,
            tolerance: 10,
        });

        return () => {
            cancelAnimationFrame(rafId.current);
            obs.kill();
        };
    }, [updateCards]);

    // ── Juz label hover → auto-rotate ────────────────────
    const rotateToJuz = useCallback((juzNum: number) => {
        setActiveSurah(null); // clear center stage
        const juz = JUZ_DATA.find(j => j.juz === juzNum);
        if (!juz) return;

        // Find the index of the starting surah (0-indexed)
        const surahIndex = surahs.findIndex(s => s.id === juz.startSurah);
        if (surahIndex === -1) return;

        // Target angle: bring that card to front (angle = 0 means front)
        const targetAngle = -surahIndex * ANGLE_PER_CARD;

        // Find shortest rotation path
        const current = rotationRef.current.value % 360;
        let diff = (targetAngle % 360) - current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        gsap.to(rotationRef.current, {
            value: rotationRef.current.value + diff,
            duration: 1.4,
            ease: 'power3.inOut',
            overwrite: 'auto',
        });
    }, []);

    // ── Card click handler ───────────────────────────────
    const handleCardClick = useCallback((surah: Surah) => {
        setReadingSurah(toGraphNode(surah));
    }, []);

    // ── Juz label positions (outer ellipse) ──────────────
    const getJuzPosition = useCallback((index: number, total: number) => {
        const angle = (index / total) * 360 - 90; // start from top
        const rx = 46; // % of viewport width
        const ry = 44; // % of viewport height
        return {
            left: `${50 + rx * Math.cos(toRad(angle))}%`,
            top: `${50 + ry * Math.sin(toRad(angle))}%`,
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 overflow-hidden select-none"
            style={{
                backgroundColor: BG,
                perspective: '1800px',
                perspectiveOrigin: '50% 42%',
                cursor: isDragging.current ? 'grabbing' : 'grab',
            }}
        >
            {/* ── Radial vignette overlay ─────────────────── */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(200, 190, 175, 0.4) 100%)',
                }}
            />

            {/* ── Subtle paper texture background ───────────── */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                }}
            />

            {/* ── Center Stage ────────────────────────────── */}
            <div className="absolute left-0 right-0 flex justify-center pointer-events-none z-10" style={{ top: '15%' }}>
                <div className="text-center transition-all duration-500 ease-out">
                    {activeSurah ? (
                        <div key={activeSurah.id} className="animate-fade-in pointer-events-auto">
                            {/* Arabic calligraphy name */}
                            <div
                                className="text-6xl md:text-8xl opacity-90 leading-none pb-10 md:pb-16"
                                style={{
                                    fontFamily: '"Amiri", serif',
                                    color: activeSurah.revelationType === 'Meccan' ? MECCAN_HEX : MEDINAN_HEX,
                                    direction: 'rtl',
                                }}
                            >
                                {activeSurah.arabicName}
                            </div>

                            {/* Transliteration + number */}
                            <div className="text-2xl md:text-3xl text-[#5C574F] font-light tracking-widest pb-6 md:pb-10"
                                style={{ 
                                    fontFamily: '"Inter", sans-serif',
                                }}>
                                {activeSurah.transliterationName}
                            </div>

                            {/* Meta line */}
                            <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#8A8273] pb-8 md:pb-14">
                                Surah {activeSurah.id} • {activeSurah.revelationType} • {activeSurah.verseCount} Verses
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-center gap-6 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                                <button
                                    onClick={() => setReadingSurah(toGraphNode(activeSurah))}
                                    className="px-8 py-3 rounded-full text-[10px] md:text-xs tracking-[0.2em] font-medium uppercase transition-all hover:scale-105 cursor-pointer"
                                    style={{
                                        color: 'white',
                                        background: activeSurah.revelationType === 'Meccan' ? MECCAN_HEX : MEDINAN_HEX,
                                        boxShadow: `0 4px 15px ${activeSurah.revelationType === 'Meccan' ? MECCAN_HEX : MEDINAN_HEX}40`
                                    }}
                                >
                                    Read Surah
                                </button>
                                <button
                                    onClick={() => setViewingHadithSurah(toGraphNode(activeSurah))}
                                    className="px-8 py-3 rounded-full text-[10px] md:text-xs tracking-[0.2em] font-medium uppercase transition-all hover:scale-105 cursor-pointer hover:text-[#2C2A26]"
                                    style={{
                                        color: '#5C574F',
                                        background: 'rgba(0,0,0,0.02)',
                                        border: '1px solid rgba(0,0,0,0.06)',
                                    }}
                                >
                                    Read Hadith
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Default title */}
                            <div
                                className="text-5xl md:text-7xl opacity-80 leading-none pb-10 md:pb-16"
                                style={{
                                    fontFamily: '"Amiri", serif',
                                    color: '#96723B',
                                    direction: 'rtl',
                                }}
                            >
                                القرآن الكريم
                            </div>
                            <div className="text-xl md:text-2xl text-[#5C574F] font-light tracking-[0.4em] uppercase pb-8 md:pb-12"
                                style={{
                                }}>
                                The Holy Quran
                            </div>
                            <div className="text-xs text-[#8A8273] tracking-[0.2em]">
                                114 SURAHS • 30 JUZ
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── The 3D Card Ring ────────────────────────── */}
            <div
                className="absolute flex items-center justify-center"
                style={{
                    left: 0, right: 0, top: '38%', bottom: 0,
                    transformStyle: 'preserve-3d',
                    transform: 'rotateX(18deg)',
                }}
            >
                {surahs.map((surah, i) => {
                    const isMeccan = surah.revelationType === 'Meccan';
                    const color = isMeccan ? MECCAN_HEX : MEDINAN_HEX;
                    const isHovered = hoveredSurah?.id === surah.id;
                    const rColor = isMeccan ? '150, 114, 59' : '100, 120, 150'; // RGB for boxShadow

                    return (
                        <div
                            key={surah.id}
                            ref={(el) => { cardRefs.current[i] = el; }}
                            className="absolute cursor-pointer transition-shadow duration-200"
                            style={{
                                width: '80px',
                                height: '120px',
                                left: '50%',
                                top: '50%',
                                transformStyle: 'preserve-3d',
                                backfaceVisibility: 'hidden',
                                borderRadius: '4px',
                                background: isHovered
                                    ? `rgba(255, 255, 255, 0.95)`
                                    : `rgba(255, 255, 255, 0.65)`,
                                border: `1px solid ${isHovered ? color : 'rgba(0,0,0,0.06)'}`,
                                boxShadow: isHovered
                                    ? `0 20px 40px rgba(${rColor}, 0.15), 0 0 0 1px ${color}`
                                    : `0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)`,
                                transition: 'box-shadow 0.3s, background 0.3s, border 0.3s, transform 0.3s'
                            }}
                            onMouseEnter={() => { hoveredIndexRef.current = i; setHoveredSurah(surah as Surah); setActiveSurah(surah as Surah); }}
                            onMouseLeave={() => { hoveredIndexRef.current = -1; setHoveredSurah(null); }}
                            onClick={() => handleCardClick(surah as Surah)}
                        >
                            {/* Card inner content */}
                            <div className="w-full h-full flex flex-col items-center justify-center p-1 relative overflow-hidden">
                                {/* Surah number */}
                                <span className="text-[9px] font-bold opacity-60 absolute top-1.5 left-2" style={{ color: isHovered ? color : '#8A8273' }}>
                                    {surah.id}
                                </span>

                                {/* Arabic name */}
                                <span
                                    className="text-sm leading-tight text-center"
                                    style={{
                                        fontFamily: '"Amiri", serif',
                                        color: isHovered ? color : '#2C2A26',
                                        direction: 'rtl',
                                    }}
                                >
                                    {surah.arabicName}
                                </span>

                                {/* English name (only on hover via opacity) */}
                                <span
                                    className="text-[7px] mt-1 text-center tracking-wider uppercase truncate w-full px-0.5 transition-opacity duration-300"
                                    style={{
                                        color: '#5C574F',
                                        opacity: isHovered ? 1 : 0.4,
                                    }}
                                >
                                    {surah.transliterationName}
                                </span>

                                {/* Color accent bar at bottom */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300"
                                    style={{
                                        background: isHovered ? color : 'transparent',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Juz Labels (outer ellipse) ─────────────── */}
            <div className="absolute inset-0 pointer-events-none z-20">
                {JUZ_DATA.map((juz, i) => {
                    const pos = getJuzPosition(i, JUZ_DATA.length);
                    const isActive = hoveredJuz === juz.juz;

                    return (
                        <div
                            key={juz.juz}
                            className="hidden lg:flex absolute -translate-x-1/2 -translate-y-1/2 text-xs tracking-[0.2em] transition-all duration-300 font-medium cursor-pointer flex-col items-center gap-1 group"
                            style={{
                                left: pos.left,
                                top: pos.top,
                            }}
                            onMouseEnter={() => {
                                setHoveredJuz(juz.juz);
                                rotateToJuz(juz.juz);
                            }}
                            onMouseLeave={() => setHoveredJuz(null)}
                        >
                            <div className={`text-center whitespace-nowrap transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                                <div
                                    className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-medium"
                                    style={{
                                        color: isActive ? '#96723B' : 'rgba(0,0,0,0.3)',
                                    }}
                                >
                                    Juz {juz.juz}
                                </div>
                                <div
                                    className="text-[7px] md:text-[8px] tracking-wider mt-0.5 transition-opacity duration-300"
                                    style={{
                                        color: isActive ? '#5C574F' : 'rgba(0,0,0,0.2)',
                                    }}
                                >
                                    {juz.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Title HUD ──────────────────────────────── */}
            <div className="fixed top-8 left-8 md:top-10 md:left-10 pointer-events-none select-none z-30">
                <h1
                    className="text-lg md:text-xl font-light tracking-[0.3em] text-[#2C2A26] opacity-90"
                >
                    NUR OF DUNYA
                </h1>
                <p className="text-[#8A8273] text-[9px] mt-1 tracking-widest font-light opacity-80 uppercase">
                    The Holy Quran • Interactive Explorer
                </p>
            </div>

            {/* ── Legend ──────────────────────────────────── */}
            <div className="fixed bottom-6 left-8 md:bottom-8 md:left-10 flex flex-col gap-2 text-[9px] uppercase tracking-widest text-[#5C574F] pointer-events-none select-none z-30 opacity-80">
                <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: MECCAN_HEX }} />
                    <span>Meccan</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: MEDINAN_HEX }} />
                    <span>Medinan</span>
                </div>
            </div>

            {/* ── Interaction hint ────────────────────────── */}
            <div className="fixed bottom-6 right-8 md:bottom-8 md:right-10 text-[9px] text-[#8A8273] tracking-widest uppercase pointer-events-none select-none z-30 opacity-70">
                Drag to rotate • Scroll to browse
            </div>

            {/* ── Overlays (reused from SiratPath) ────────── */}

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
