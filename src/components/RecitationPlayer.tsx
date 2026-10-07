import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { Headphones, LoaderCircle, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import './recitation.css';

export type RecitationPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface RecitationPlayerHandle {
    playVerse: (verse: number) => void;
}

interface RecitationAyah {
    number: number;
    numberInSurah: number;
}

export interface RecitationPlayerProps {
    surahId: number;
    surahName: string;
    ayahs: RecitationAyah[];
    initialVerse: number;
    onActiveVerseChange: (verse: number | null) => void;
    onFollowVerse: (verse: number) => void;
    onPlaybackStateChange?: (state: RecitationPlaybackState) => void;
}

const RECITERS = [
    { identifier: 'ar.alafasy', name: 'Mishary Rashid Alafasy', bitrate: 128 },
    { identifier: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', bitrate: 64 },
    { identifier: 'ar.abdurrahmaansudais', name: 'Abdurrahmaan As-Sudais', bitrate: 192 },
];

interface PlayerSnapshot {
    verse: number;
    reciter: string;
    status: RecitationPlaybackState;
    currentTime: number;
    duration: number;
    error: string | null;
}

interface PlaybackRuntime {
    generation: number;
    playRequest: number;
    intent: boolean;
    verse: number;
    reciter: string;
    status: RecitationPlaybackState;
    source: string | null;
    timeout: number | null;
    removeListeners: (() => void) | null;
}

function timestamp(seconds: number) {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

const RecitationSession = forwardRef<RecitationPlayerHandle, RecitationPlayerProps>(function RecitationSession({
    surahId, surahName, ayahs, initialVerse, onActiveVerseChange, onFollowVerse, onPlaybackStateChange,
}, forwardedRef) {
    const firstVerse = ayahs.find((ayah) => ayah.numberInSurah === initialVerse)?.numberInSurah ?? ayahs[0]?.numberInSurah ?? 1;
    const audioRef = useRef<HTMLAudioElement>(null);
    const callbacksRef = useRef({ onActiveVerseChange, onFollowVerse, onPlaybackStateChange });
    const followRef = useRef(true);
    const [follow, setFollow] = useState(true);
    const reciterId = useId();
    const progressId = useId();
    const statusId = useId();
    const [snapshot, setSnapshot] = useState<PlayerSnapshot>({
        verse: firstVerse, reciter: RECITERS[0].identifier, status: 'idle', currentTime: 0, duration: 0, error: null,
    });
    const runtimeRef = useRef<PlaybackRuntime>({
        generation: 0, playRequest: 0, intent: false, verse: firstVerse, reciter: RECITERS[0].identifier,
        status: 'idle', source: null, timeout: null, removeListeners: null,
    });

    useEffect(() => {
        callbacksRef.current = { onActiveVerseChange, onFollowVerse, onPlaybackStateChange };
    }, [onActiveVerseChange, onFollowVerse, onPlaybackStateChange]);

    const clearTimeoutForAudio = useCallback(() => {
        const runtime = runtimeRef.current;
        if (runtime.timeout !== null) window.clearTimeout(runtime.timeout);
        runtime.timeout = null;
    }, []);

    const commitStatus = useCallback((status: RecitationPlaybackState, error: string | null = null) => {
        const runtime = runtimeRef.current;
        const changed = runtime.status !== status;
        runtime.status = status;
        setSnapshot((current) => ({ ...current, status, error }));
        if (changed) callbacksRef.current.onPlaybackStateChange?.(status);
    }, []);

    const failAudio = useCallback((message: string) => {
        const runtime = runtimeRef.current;
        runtime.intent = false;
        runtime.playRequest += 1;
        clearTimeoutForAudio();
        audioRef.current?.pause();
        commitStatus('error', message);
    }, [clearTimeoutForAudio, commitStatus]);

    const armLoadingTimeout = useCallback((generation: number) => {
        // Repeated waiting/stalled events must not extend a stalled request forever.
        if (runtimeRef.current.timeout !== null) return;
        runtimeRef.current.timeout = window.setTimeout(() => {
            const runtime = runtimeRef.current;
            runtime.timeout = null;
            if (runtime.generation === generation && runtime.intent && runtime.status === 'loading') {
                failAudio('The audio took too long to load. Check your connection and try again.');
            }
        }, 20_000);
    }, [failAudio]);

    const requestPlay = useCallback(() => {
        const audio = audioRef.current;
        const runtime = runtimeRef.current;
        if (!audio || !runtime.source) return;
        runtime.intent = true;
        const generation = runtime.generation;
        const request = ++runtime.playRequest;
        if (audio.ended) {
            audio.currentTime = 0;
            setSnapshot((current) => ({ ...current, currentTime: 0 }));
        }
        commitStatus('loading');
        armLoadingTimeout(generation);
        void audio.play().then(() => {
            const current = runtimeRef.current;
            if (current.generation !== generation || current.playRequest !== request) return;
            if (!current.intent) { audio.pause(); return; }
            if (!audio.paused) {
                clearTimeoutForAudio();
                commitStatus('playing');
            }
        }).catch((failure: unknown) => {
            const current = runtimeRef.current;
            if (current.generation !== generation || current.playRequest !== request || !current.intent) return;
            const name = failure instanceof Error ? failure.name : '';
            failAudio(name === 'NotAllowedError'
                ? 'Your browser paused the audio. Tap Play to listen.'
                : 'This verse could not be played. Please try again or choose another reciter.');
        });
    }, [armLoadingTimeout, clearTimeoutForAudio, commitStatus, failAudio]);

    const pauseAudio = useCallback(() => {
        const runtime = runtimeRef.current;
        runtime.intent = false;
        runtime.playRequest += 1;
        clearTimeoutForAudio();
        audioRef.current?.pause();
        commitStatus('paused');
    }, [clearTimeoutForAudio, commitStatus]);

    const selectVerse = useCallback(function loadVerse(verse: number, shouldPlay: boolean, reciter?: string) {
        const audio = audioRef.current;
        const ayah = ayahs.find((item) => item.numberInSurah === verse);
        if (!audio || !ayah) return;
        const runtime = runtimeRef.current;
        const edition = reciter ?? runtime.reciter;
        const reciterOption = RECITERS.find((option) => option.identifier === edition);
        if (!reciterOption) return;
        const source = `https://cdn.islamic.network/quran/audio/${reciterOption.bitrate}/${edition}/${ayah.number}.mp3`;
        runtime.generation += 1;
        runtime.playRequest += 1;
        runtime.intent = false;
        clearTimeoutForAudio();
        runtime.removeListeners?.();
        audio.pause();
        runtime.source = source;
        runtime.verse = verse;
        runtime.reciter = edition;
        const generation = runtime.generation;
        const status = shouldPlay ? 'loading' : 'paused';
        const statusChanged = runtime.status !== status;
        runtime.status = status;
        setSnapshot({ verse, reciter: edition, status, currentTime: 0, duration: 0, error: null });
        callbacksRef.current.onActiveVerseChange(verse);
        if (statusChanged) callbacksRef.current.onPlaybackStateChange?.(status);
        if (followRef.current) callbacksRef.current.onFollowVerse(verse);

        const isCurrent = () => runtimeRef.current.generation === generation
            && runtimeRef.current.source === source && audio.currentSrc === source;
        const events: [keyof HTMLMediaElementEventMap, EventListener][] = [];
        const listen = (event: keyof HTMLMediaElementEventMap, callback: () => void) => {
            const listener: EventListener = () => { if (isCurrent()) callback(); };
            events.push([event, listener]);
            audio.addEventListener(event, listener);
        };
        const updateDuration = () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                setSnapshot((current) => ({ ...current, duration: audio.duration }));
            }
        };
        listen('loadedmetadata', updateDuration);
        listen('durationchange', updateDuration);
        listen('timeupdate', () => {
            if (Number.isFinite(audio.currentTime)) setSnapshot((current) => ({ ...current, currentTime: audio.currentTime }));
        });
        listen('playing', () => {
            if (!runtimeRef.current.intent) { audio.pause(); return; }
            if (!audio.paused) { clearTimeoutForAudio(); commitStatus('playing'); }
        });
        const buffering = () => {
            if (runtimeRef.current.intent && !audio.ended) { commitStatus('loading'); armLoadingTimeout(generation); }
        };
        listen('waiting', buffering);
        listen('stalled', () => {
            // Network stalls can occur while buffered audio still plays normally.
            if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) buffering();
        });
        listen('pause', () => {
            // Browser/media-key pauses also cancel the outstanding play request.
            if (runtimeRef.current.intent && audio.paused && !audio.ended && audio.readyState >= 2) pauseAudio();
        });
        listen('error', () => {
            if (audio.error) failAudio('This verse audio is unavailable. Try again or choose another reciter.');
        });
        listen('ended', () => {
            if (!audio.ended || !runtimeRef.current.intent) return;
            clearTimeoutForAudio();
            const index = ayahs.findIndex((item) => item.numberInSurah === verse);
            const next = ayahs[index + 1];
            if (next) loadVerse(next.numberInSurah, true, edition);
            else {
                runtimeRef.current.intent = false;
                runtimeRef.current.playRequest += 1;
                commitStatus('ended');
            }
        });
        runtime.removeListeners = () => events.forEach(([event, listener]) => audio.removeEventListener(event, listener));
        audio.src = source;
        audio.load();
        if (shouldPlay) requestPlay();
    }, [ayahs, armLoadingTimeout, clearTimeoutForAudio, commitStatus, failAudio, pauseAudio, requestPlay]);

    const playVerse = useCallback((verse: number) => {
        const runtime = runtimeRef.current;
        if (runtime.source && runtime.verse === verse && runtime.status !== 'error') {
            if (runtime.intent) pauseAudio();
            else {
                callbacksRef.current.onActiveVerseChange(verse);
                if (followRef.current) callbacksRef.current.onFollowVerse(verse);
                requestPlay();
            }
        } else selectVerse(verse, true);
    }, [pauseAudio, requestPlay, selectVerse]);

    useImperativeHandle(forwardedRef, () => ({ playVerse }), [playVerse]);

    useEffect(() => {
        const audio = audioRef.current;
        const runtime = runtimeRef.current;
        callbacksRef.current.onPlaybackStateChange?.('idle');
        return () => {
            runtime.generation += 1;
            runtime.playRequest += 1;
            runtime.intent = false;
            if (runtime.timeout !== null) window.clearTimeout(runtime.timeout);
            runtime.removeListeners?.();
            if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
        };
    }, []);

    const togglePlayback = () => {
        const runtime = runtimeRef.current;
        if (runtime.intent) pauseAudio();
        else if (runtime.status === 'ended') selectVerse(firstVerse, true);
        else playVerse(runtime.verse);
    };
    const skip = (direction: -1 | 1) => {
        const runtime = runtimeRef.current;
        const index = ayahs.findIndex((ayah) => ayah.numberInSurah === runtime.verse);
        const next = ayahs[index + direction];
        if (next) selectVerse(next.numberInSurah, runtime.intent);
    };
    const changeReciter = (identifier: string) => {
        if (!RECITERS.some((reciter) => reciter.identifier === identifier)) return;
        const runtime = runtimeRef.current;
        if (runtime.source) selectVerse(runtime.verse, runtime.intent, identifier);
        else {
            runtime.reciter = identifier;
            setSnapshot((current) => ({ ...current, reciter: identifier }));
        }
    };
    const seek = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
        const currentTime = Math.max(0, Math.min(seconds, audio.duration));
        audio.currentTime = currentTime;
        setSnapshot((current) => ({ ...current, currentTime }));
        if (runtimeRef.current.status === 'ended') commitStatus('paused');
    };
    const currentIndex = ayahs.findIndex((ayah) => ayah.numberInSurah === snapshot.verse);
    const canPause = snapshot.status === 'playing' || snapshot.status === 'loading';
    const statusLabel: Record<RecitationPlaybackState, string> = {
        idle: 'Ready to listen', loading: 'Loading audio…', playing: 'Playing', paused: 'Paused', ended: 'Surah complete', error: 'Audio unavailable',
    };
    const buttonLabel = canPause ? 'Pause recitation' : snapshot.status === 'ended' ? 'Replay surah' : 'Play recitation';
    const duration = Number.isFinite(snapshot.duration) ? snapshot.duration : 0;
    const time = Math.min(snapshot.currentTime, duration || snapshot.currentTime);

    return (
        <section className="recitation-player" aria-label={`Quran recitation for ${surahName}`}>
            <audio ref={audioRef} preload="metadata" className="recitation-audio" />
            <div className="recitation-heading">
                <div className="recitation-intro"><Headphones size={15} aria-hidden="true" /><span>Listen with presence</span></div>
                <div className="recitation-reciter">
                    <label htmlFor={reciterId}>Reciter</label>
                    <select id={reciterId} value={snapshot.reciter} onChange={(event) => changeReciter(event.target.value)}>
                        {RECITERS.map((reciter) => <option key={reciter.identifier} value={reciter.identifier}>{reciter.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="recitation-transport">
                <div className="recitation-buttons">
                    <button type="button" onClick={() => skip(-1)} disabled={currentIndex <= 0} aria-label="Previous verse"><SkipBack size={17} aria-hidden="true" /></button>
                    <button type="button" className="recitation-play" onClick={togglePlayback} disabled={!ayahs.length} aria-label={buttonLabel} title={buttonLabel}>
                        {snapshot.status === 'loading' ? <LoaderCircle className="recitation-spinner" size={19} aria-hidden="true" /> : canPause ? <Pause size={19} aria-hidden="true" /> : <Play size={19} aria-hidden="true" />}
                    </button>
                    <button type="button" onClick={() => skip(1)} disabled={currentIndex < 0 || currentIndex >= ayahs.length - 1} aria-label="Next verse"><SkipForward size={17} aria-hidden="true" /></button>
                </div>
                <div className="recitation-now">
                    <p className="recitation-verse">Verse {surahId}:{snapshot.verse}<span> / {ayahs.length}</span></p>
                    <p id={statusId} className="recitation-status" role="status" aria-live="polite">{statusLabel[snapshot.status]}</p>
                </div>
            </div>
            <div className="recitation-progress">
                <span className="recitation-time" aria-hidden="true">{timestamp(time)}</span>
                <label className="recitation-sr-only" htmlFor={progressId}>Playback position for verse {surahId}:{snapshot.verse}</label>
                <input id={progressId} type="range" min={0} max={duration || 1} step={0.1} value={Math.min(time, duration || 1)} disabled={!duration || snapshot.status === 'error'} onChange={(event) => seek(Number(event.target.value))} aria-valuetext={`${timestamp(time)} of ${timestamp(duration)}`} />
                <span className="recitation-time" aria-hidden="true">{timestamp(duration)}</span>
            </div>
            {snapshot.error && <div className="recitation-error" role="alert"><p>{snapshot.error}</p><button type="button" onClick={() => selectVerse(snapshot.verse, true)}><RotateCcw size={14} aria-hidden="true" />Retry</button></div>}
            <div className="recitation-options">
                <label className="recitation-follow"><input type="checkbox" checked={follow} onChange={(event) => {
                    const enabled = event.target.checked;
                    followRef.current = enabled;
                    setFollow(enabled);
                    if (enabled && runtimeRef.current.source) callbacksRef.current.onFollowVerse(runtimeRef.current.verse);
                }} /><span>Follow verse</span></label>
                <a href="https://alquran.cloud/cdn" target="_blank" rel="noreferrer">Audio · AlQuran Cloud</a>
            </div>
        </section>
    );
});

const RecitationPlayer = forwardRef<RecitationPlayerHandle, RecitationPlayerProps>(function RecitationPlayer(props, ref) {
    // A new surah tears down the previous audio session before the new one mounts.
    return <RecitationSession key={props.surahId} {...props} ref={ref} />;
});

export default RecitationPlayer;
