import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, Grid2X2, Info, Search, Sparkles, X } from 'lucide-react';
import surahsData from '../data/surahs.json';
import { JUZ_DATA } from '../data/juzMapping';
import type { GraphNode, Surah } from '../types';
import SurahReader from './SurahReader';
import HadithModal from './HadithModal';
import SacredDialog from './SacredDialog';
import '../sacred.css';

const surahs = surahsData as Surah[];
const TOTAL = surahs.length;
const wrap = (index: number) => ((index % TOTAL) + TOTAL) % TOTAL;
const toNode = (surah: Surah): GraphNode => ({ ...surah, name: surah.transliterationName });
const normalize = (value: string) => value.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '').replace(/ٱ/g, 'ا')
  .replace(/[\s'’-]/g, '').replace(/([aeiou])\1+/g, '$1');
const meanings: Record<number, string> = { 1: 'The Opening', 2: 'The Cow', 3: 'The Family of Imran', 18: 'The Cave', 19: 'Mary', 36: 'Ya-Sin', 55: 'The Most Merciful', 67: 'The Sovereignty', 112: 'The Sincerity', 113: 'The Daybreak', 114: 'Mankind' };

function Ornament({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m20 2 5.3 12.7L38 20l-12.7 5.3L20 38l-5.3-12.7L2 20l12.7-5.3Z" stroke="currentColor" /><path d="m20 9 3.2 7.8L31 20l-7.8 3.2L20 31l-3.2-7.8L9 20l7.8-3.2Z" fill="currentColor" fillOpacity=".18" /><circle cx="20" cy="20" r="2" fill="currentColor" /></svg>;
}

function Halo() {
  return <div className="halo" aria-hidden="true"><div className="halo-glow" /><svg viewBox="0 0 720 720" fill="none">
    <circle cx="360" cy="360" r="314" className="halo-outer" /><circle cx="360" cy="360" r="292" className="halo-inner" /><circle cx="360" cy="360" r="304" strokeDasharray="1 13" className="halo-dots" />
    {Array.from({ length: 12 }, (_, i) => <g key={i} transform={`rotate(${i * 30} 360 360)`}><path d="m360 35 5 11-5 11-5-11Z" className="halo-mark" /><path d="M360 66v11" className="halo-inner" /></g>)}
    <path d="M140 480V360a220 220 0 0 1 440 0v120" className="halo-arch" /><path d="M156 470V360a204 204 0 0 1 408 0v110" className="halo-arch secondary" />
  </svg><span className="light-point point-one" /><span className="light-point point-two" /><span className="light-point point-three" /></div>;
}

export default function SacredExperience() {
  const [selected, setSelected] = useState(0);
  const [reader, setReader] = useState<{ surah: GraphNode; verse?: number } | null>(null);
  const [hadith, setHadith] = useState<GraphNode | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [browseMode, setBrowseMode] = useState<'surahs' | 'juz'>('surahs');
  const [filter, setFilter] = useState<'All' | 'Meccan' | 'Medinan'>('All');
  const [lastRead, setLastRead] = useState<number | null>(() => {
    try { const id = Number(localStorage.getItem('nur-last-surah')); return Number.isInteger(id) && id >= 1 && id <= TOTAL ? id : null; } catch { return null; }
  });
  const gesture = useRef<{ x: number; y: number; moved: boolean; pointerId: number } | null>(null);
  const suppressClick = useRef(false);
  const wheelAt = useRef(0);
  const focusSelectedCard = useRef(false);
  const railRef = useRef<HTMLDivElement>(null);
  const active = surahs[selected];
  const modalOpen = Boolean(reader || hadith || browserOpen || aboutOpen);

  const read = (surah: Surah, verse?: number) => {
    setSelected(surah.id - 1);
    setBrowserOpen(false);
    setReader({ surah: toNode(surah), verse });
    setLastRead(surah.id);
    try { localStorage.setItem('nur-last-surah', String(surah.id)); } catch { /* Reading remains available without storage. */ }
  };
  const browse = () => { setBrowseMode('surahs'); setQuery(''); setBrowserOpen(true); };

  useEffect(() => {
    if (modalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select')) return;
      if (event.key === '/') { event.preventDefault(); setBrowseMode('surahs'); setQuery(''); setBrowserOpen(true); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        focusSelectedCard.current = event.target instanceof HTMLElement && Boolean(event.target.closest('.chapter-card'));
        setSelected(index => wrap(index + (event.key === 'ArrowRight' ? 1 : -1)));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalOpen]);

  useEffect(() => {
    if (focusSelectedCard.current && !modalOpen) {
      railRef.current?.querySelector<HTMLButtonElement>('.is-selected')?.focus({ preventScroll: true });
      focusSelectedCard.current = false;
    }
  }, [selected, modalOpen]);

  const filtered = surahs.filter(surah => (filter === 'All' || surah.revelationType === filter) && normalize(`${surah.id} ${surah.transliterationName} ${surah.arabicName} ${meanings[surah.id] || ''}`).includes(normalize(query)));
  const filteredJuz = JUZ_DATA.filter(juz => normalize(`${juz.juz} ${juz.label}`).includes(normalize(query)));

  return <div className="experience">
    <div className="cosmic-scene" aria-hidden="true">
      <div className="cosmic-nebula cosmic-nebula--far" />
      <div className="cosmic-nebula cosmic-nebula--near" />
      <div className="cosmic-veil" />
      <div className="cosmic-shade" />
      <div className="cosmic-stars cosmic-stars--far" />
      <div className="cosmic-stars cosmic-stars--near" />
    </div>
    <div className="grain" aria-hidden="true" />
    <header className="site-header">
      <a className="brand" href="#" aria-label="Nur of Dunya home" onClick={event => { event.preventDefault(); setSelected(0); }}><Ornament className="brand-mark" /><span><strong>NUR OF DUNYA</strong><small>LIGHT UPON LIGHT</small></span></a>
      <nav aria-label="Main navigation"><button className="nav-active" onClick={() => { setBrowseMode('surahs'); browse(); }}><BookOpen size={15} />The Quran</button><button className="about-button" onClick={() => setAboutOpen(true)}>Our intention</button></nav>
      <button className="header-search" onClick={browse} aria-label="Search all surahs"><Search size={17} /><span>Find a surah</span><kbd>/</kbd></button>
    </header>
    <main id="main-content" className="sanctuary">
      <div className="side-note" aria-hidden="true"><span />A SPACE FOR REFLECTION</div>
      <section className="hero" aria-label="The Holy Quran"><Halo /><div className="hero-content">
        <div className="eyebrow"><span />IN THE NAME OF ALLAH, THE MOST MERCIFUL<span /></div>
        <p className="quran-calligraphy" lang="ar" dir="rtl">القرآن الكريم</p>
        <div className="ornament-divider"><span /><Ornament /><span /></div>
        <h1>Light for the <em>heart.</em></h1>
        <p className="hero-description">A quiet space to read, reflect, and find your way<br className="desktop-break" /> through the words of the Holy Quran.</p>
        <button className="primary-action" onClick={() => read(active)}><BookOpen size={17} />{selected === 0 ? 'Begin reading' : `Read ${active.transliterationName}`}<ArrowRight size={17} /></button>
        <div className="hero-meta"><span>114 SURAHS</span><span className="tiny-star">✦</span><span>30 JUZ</span><span className="tiny-star">✦</span><span>ONE GUIDANCE</span></div>
      </div></section>
      <section className="chapter-explorer" aria-label="Explore surahs">
        <div className="explorer-heading"><span className="eyebrow">YOUR JOURNEY THROUGH THE QURAN</span><button className="text-button" onClick={browse}><Grid2X2 size={14} />View all surahs<ArrowRight size={14} /></button></div>
        <div ref={railRef} className="chapter-rail" aria-label="Surah carousel" onPointerDown={event => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          suppressClick.current = false;
          gesture.current = { x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId };
        }} onPointerMove={event => {
          const start = gesture.current;
          if (!start || event.pointerId !== start.pointerId) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(event.clientY - start.y)) { start.moved = true; suppressClick.current = true; event.currentTarget.setPointerCapture(event.pointerId); }
        }} onPointerUp={event => {
          const start = gesture.current;
          if (start?.moved) { const distance = event.clientX - start.x; if (Math.abs(distance) > 35) setSelected(index => wrap(index + (distance < 0 ? 1 : -1) * Math.min(3, Math.max(1, Math.floor(Math.abs(distance) / 130))))); }
          gesture.current = null;
        }} onPointerCancel={() => { gesture.current = null; }} onClickCapture={event => { if (suppressClick.current) { event.stopPropagation(); event.preventDefault(); suppressClick.current = false; } }} onWheel={event => {
          if (modalOpen || Math.abs(event.deltaX) < 8 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
          if (Date.now() - wheelAt.current < 220) return;
          wheelAt.current = Date.now(); setSelected(index => wrap(index + (event.deltaX > 0 ? 1 : -1)));
        }}><div className="orbit-line" aria-hidden="true" />
          {Array.from({ length: 9 }, (_, i) => i - 4).map(offset => {
            const index = wrap(selected + offset); const surah = surahs[index];
            return <button key={surah.id} className={`chapter-card ${offset === 0 ? 'is-selected' : ''}`} style={{ '--offset': offset, '--distance': Math.abs(offset) } as CSSProperties} aria-label={`Select surah ${surah.id}, ${surah.transliterationName}`} aria-pressed={offset === 0} tabIndex={offset === 0 ? 0 : -1} onClick={() => setSelected(index)}>
              <span className="chapter-number">{String(surah.id).padStart(2, '0')}</span><Ornament className="card-ornament" /><span className="chapter-arabic" lang="ar" dir="rtl">{surah.arabicName}</span><span className="chapter-name">{surah.transliterationName}</span><span className="chapter-verses">{surah.verseCount} ayahs</span>{offset === 0 && <span className="selected-dot" />}
            </button>;
          })}
        </div>
        <div className="selection-bar"><button className="circle-button" aria-label="Previous surah" onClick={() => setSelected(index => wrap(index - 1))}><ArrowLeft size={17} /></button><div className="selected-surah" aria-live="polite" aria-atomic="true"><strong>{active.transliterationName}</strong><span>{active.revelationType} <i /> {active.verseCount} ayahs <i /> {String(active.id).padStart(2, '0')} / 114</span></div><button className="circle-button" aria-label="Next surah" onClick={() => setSelected(index => wrap(index + 1))}><ArrowRight size={17} /></button></div>
      </section>
    </main>
    <footer className="site-footer"><span className="footer-intention"><span className="status-light" />MADE WITH INTENTION. EXPLORED WITH PEACE.</span><span className="gesture-hint">SWIPE OR USE ← → TO EXPLORE</span><button className="text-button" onClick={() => setHadith(toNode(active))}><Sparkles size={14} />A moment of reflection</button></footer>

    {browserOpen && <SacredDialog onClose={() => setBrowserOpen(false)} labelledBy="browse-title" className="browse-dialog">
      <div className="dialog-heading"><div><span className="eyebrow">FIND YOUR NEXT MOMENT</span><h2 id="browse-title">Explore the Quran</h2></div><button className="circle-button" aria-label="Close surah browser" onClick={() => setBrowserOpen(false)}><X size={20} /></button></div>
      <label className="browse-search"><Search size={18} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={browseMode === 'surahs' ? 'Search by name, Arabic, or surah number…' : 'Search by juz name or number…'} aria-label={browseMode === 'surahs' ? 'Search surahs' : 'Search juz'} />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}</label>
      <div className="browse-toolbar"><div className="segmented" role="group" aria-label="Browse by"><button aria-pressed={browseMode === 'surahs'} onClick={() => { setBrowseMode('surahs'); setQuery(''); }}>Surahs <span>114</span></button><button aria-pressed={browseMode === 'juz'} onClick={() => { setBrowseMode('juz'); setQuery(''); }}>Juz <span>30</span></button></div>{browseMode === 'surahs' && <select aria-label="Filter by revelation" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="All">All revelations</option><option value="Meccan">Meccan</option><option value="Medinan">Medinan</option></select>}</div>
      {!query && lastRead && browseMode === 'surahs' && <button className="continue-reading" onClick={() => read(surahs[lastRead - 1])}><BookOpen size={19} /><span><small>LAST OPENED</small>Return to {surahs[lastRead - 1].transliterationName}</span><ArrowRight size={17} /></button>}
      <div className="browse-results">
        {browseMode === 'surahs' ? filtered.map(surah => <button className="surah-row" key={surah.id} onClick={() => read(surah)}><span className="row-number">{String(surah.id).padStart(2, '0')}</span><span className="row-name"><strong>{surah.transliterationName}</strong><small>{surah.revelationType} · {surah.verseCount} ayahs</small></span><span className="row-arabic" lang="ar" dir="rtl">{surah.arabicName}</span>{surah.id === active.id ? <Check size={15} /> : <ArrowRight size={15} />}</button>) : filteredJuz.map(juz => <button className="surah-row" key={juz.juz} onClick={() => read(surahs[juz.startSurah - 1], juz.startVerse)}><span className="row-number">{String(juz.juz).padStart(2, '0')}</span><span className="row-name"><strong>{juz.label}</strong><small>{surahs[juz.startSurah - 1].transliterationName} · Ayah {juz.startVerse}</small></span><ArrowRight size={15} /></button>)}
        {(browseMode === 'surahs' ? filtered : filteredJuz).length === 0 && <div className="empty-state"><Compass size={28} /><p>No {browseMode} found</p><small>Try a different name or number.</small><button className="text-button" onClick={() => { setQuery(''); setFilter('All'); }}>Clear filters</button></div>}
      </div><p className="browse-footnote">Select a chapter to enter the reading space.</p>
    </SacredDialog>}
    {aboutOpen && <SacredDialog onClose={() => setAboutOpen(false)} labelledBy="about-title" className="about-dialog"><button className="circle-button about-close" aria-label="Close our intention" onClick={() => setAboutOpen(false)}><X size={19} /></button><Ornament className="about-ornament" /><span className="eyebrow">OUR INTENTION</span><h2 id="about-title">A little stillness.<br />A little more light.</h2><p>Nur of Dunya is a quiet place to encounter the Holy Quran. Take your time, begin wherever you are, and let each reading be a moment of reflection.</p><div className="about-source"><Info size={17} /><p>Arabic text and English and Chinese translations are provided by <a href="https://alquran.cloud" target="_blank" rel="noreferrer">AlQuran Cloud</a>. Translations are interpretations of meaning. Narrations include their source references.</p></div><button className="primary-action" onClick={() => { setAboutOpen(false); read(active); }}>Enter the reading space<ArrowRight size={16} /></button></SacredDialog>}
    {reader && <SurahReader key={`${reader.surah.id}-${reader.verse || 1}`} surah={reader.surah} initialVerse={reader.verse} onClose={() => { focusSelectedCard.current = true; setReader(null); }} />}
    {hadith && <HadithModal surah={hadith} onClose={() => setHadith(null)} />}
  </div>;
}
