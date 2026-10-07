import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUp, BookOpen, LoaderCircle, RotateCcw, X } from 'lucide-react';
import type { GraphNode } from '../types';
import SacredDialog from './SacredDialog';
import './reader.css';

interface SurahReaderProps {
    surah: GraphNode;
    onClose: () => void;
    initialVerse?: number;
}

interface Ayah {
    number: number;
    numberInSurah: number;
    text: string;
}

interface SurahText {
    arabic: Ayah[];
    english: Map<number, Ayah>;
    chinese: Map<number, Ayah>;
}

interface RequestResult {
    key: string;
    data: SurahText | null;
    error: string | null;
}

type Translation = 'english' | 'chinese' | 'none';
const textCache = new Map<number, SurahText>();

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function readEdition(editions: unknown[], identifier: string, expectedCount: number): Ayah[] {
    const edition = editions.find((item) => isRecord(item) && isRecord(item.edition) && item.edition.identifier === identifier);
    if (!isRecord(edition) || !Array.isArray(edition.ayahs) || edition.ayahs.length !== expectedCount) {
        throw new Error('A complete text edition could not be loaded. Please try again.');
    }
    const ayahs = edition.ayahs.map((value: unknown): Ayah => {
        if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim()
            || typeof value.number !== 'number' || !Number.isInteger(value.number)
            || typeof value.numberInSurah !== 'number' || !Number.isInteger(value.numberInSurah)) {
            throw new Error('The text service returned an incomplete verse. Please try again.');
        }
        return { number: value.number, numberInSurah: value.numberInSurah, text: value.text };
    }).sort((a, b) => a.numberInSurah - b.numberInSurah);
    if (ayahs.some((ayah, index) => ayah.numberInSurah !== index + 1)) {
        throw new Error('The verse numbers could not be aligned. Please try again.');
    }
    return ayahs;
}

export default function SurahReader({ surah, onClose, initialVerse = 1 }: SurahReaderProps) {
    const titleId = useId();
    const translationId = useId();
    const contentRef = useRef<HTMLDivElement>(null);
    const [translation, setTranslation] = useState<Translation>('english');
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<RequestResult>({ key: '', data: null, error: null });
    const requestKey = `${surah.id}:${attempt}`;
    const text = textCache.get(surah.id) ?? (result.key === requestKey ? result.data : null);
    const error = result.key === requestKey ? result.error : null;
    const loading = !text && !error;

    useEffect(() => {
        if (textCache.has(surah.id)) return;
        const controller = new AbortController();
        let active = true;
        let timedOut = false;
        const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);

        async function loadText() {
            try {
                const response = await fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/editions/quran-uthmani,en.asad,zh.jian`, {
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error('The text service is unavailable. Please try again.');
                const payload: unknown = await response.json();
                if (!isRecord(payload) || payload.code !== 200 || !Array.isArray(payload.data)) {
                    throw new Error('The text service could not return this surah. Please try again.');
                }
                const arabic = readEdition(payload.data, 'quran-uthmani', surah.verseCount);
                const english = readEdition(payload.data, 'en.asad', surah.verseCount);
                const chinese = readEdition(payload.data, 'zh.jian', surah.verseCount);
                const data: SurahText = {
                    arabic,
                    english: new Map(english.map((ayah) => [ayah.numberInSurah, ayah])),
                    chinese: new Map(chinese.map((ayah) => [ayah.numberInSurah, ayah])),
                };
                if (active) {
                    textCache.set(surah.id, data);
                    setResult({ key: requestKey, data, error: null });
                }
            } catch (failure) {
                if (!active) return;
                const message = timedOut
                    ? 'The text service took too long to respond. Please try again.'
                    : failure instanceof Error && failure.name !== 'AbortError'
                        ? failure.message
                        : 'A connection could not be established. Please try again.';
                setResult({ key: requestKey, data: null, error: message });
            } finally {
                window.clearTimeout(timeout);
            }
        }
        void loadText();
        return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
    }, [surah.id, surah.verseCount, requestKey]);

    useEffect(() => {
        if (!text) return;
        const verse = Math.min(Math.max(1, initialVerse), text.arabic.length);
        const frame = requestAnimationFrame(() => {
            const content = contentRef.current;
            const target = content?.querySelector<HTMLElement>(`[data-verse="${verse}"]`);
            if (content && target) {
                const top = target.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 24;
                content.scrollTo({ top, behavior: 'instant' });
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [text, initialVerse]);

    return (
        <SacredDialog onClose={onClose} labelledBy={titleId} className="reader-dialog">
            <div className="reader-shell">
                <header className="reader-header">
                    <div className="reader-header-topline">
                        <p className="reader-eyebrow">THE HOLY QURAN / SURAH {String(surah.id).padStart(3, '0')}</p>
                        <button className="reader-close" onClick={onClose} aria-label="Close reader" autoFocus><X size={20} /></button>
                    </div>
                    <div className="reader-heading-layout">
                        <div className="reader-heading-text">
                            <h2 id={titleId} className="reader-title">{surah.name}</h2>
                            <p className="reader-meta">{surah.revelationType} · {surah.verseCount} verses</p>
                        </div>
                        <div className="reader-arabic-title" dir="rtl" lang="ar">{surah.arabicName}</div>
                    </div>
                </header>
                <div className="reader-toolbar">
                    <div className="reader-toolbar-label"><BookOpen size={15} /><span>Read with presence</span></div>
                    <div className="reader-translation-control">
                        <label htmlFor={translationId}>Translation</label>
                        <select id={translationId} value={translation} onChange={(event) => setTranslation(event.target.value as Translation)}>
                            <option value="english">English · Asad</option>
                            <option value="chinese">中文 · 马坚</option>
                            <option value="none">Arabic only</option>
                        </select>
                    </div>
                </div>
                <div ref={contentRef} className="reader-content" tabIndex={0} aria-label="Surah verses" aria-busy={loading}>
                    {loading && (
                        <div className="reader-state" role="status">
                            <LoaderCircle className="reader-spinner" size={28} />
                            <h3>Opening the surah</h3>
                            <p>Preparing the Arabic text and translations.</p>
                        </div>
                    )}
                    {error && (
                        <div className="reader-state" role="alert">
                            <BookOpen size={28} />
                            <h3>The text could not be loaded</h3>
                            <p>{error}</p>
                            <button className="reader-retry" onClick={() => setAttempt((value) => value + 1)}><RotateCcw size={15} />Try again</button>
                        </div>
                    )}
                    {text && (
                        <div className="reader-verses">
                            {text.arabic.map((ayah) => (
                                <article className="reader-verse" data-verse={ayah.numberInSurah} key={ayah.number}>
                                    <div className="reader-verse-number" aria-label={`Verse ${surah.id}:${ayah.numberInSurah}`}>{surah.id}:{ayah.numberInSurah}</div>
                                    <p className="reader-arabic" dir="rtl" lang="ar">{ayah.text} <span className="reader-ayah-marker">﴿{ayah.numberInSurah.toLocaleString('ar-SA')}﴾</span></p>
                                    {translation !== 'none' && (
                                        <p className={`reader-translation ${translation === 'chinese' ? 'reader-translation-chinese' : ''}`} lang={translation === 'chinese' ? 'zh' : 'en'}>
                                            {text[translation].get(ayah.numberInSurah)?.text}
                                        </p>
                                    )}
                                </article>
                            ))}
                            <div className="reader-end">End of {surah.name}<span>✦</span></div>
                        </div>
                    )}
                </div>
                <footer className="reader-footer">
                    <span>Arabic: Uthmani · {translation === 'chinese' ? 'Translation: Ma Jian' : translation === 'english' ? 'Translation: Muhammad Asad' : 'Original Arabic'}<span className="reader-source"> · AlQuran Cloud</span></span>
                    {text && <button onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })} aria-label="Return to the first verse"><ArrowUp size={14} /><span>Top</span></button>}
                </footer>
            </div>
        </SacredDialog>
    );
}
