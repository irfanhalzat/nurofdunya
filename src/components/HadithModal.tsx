import { useId } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { GraphNode } from '../types';
import hadithsData from '../data/hadiths.json';
import SacredDialog from './SacredDialog';
import './reader.css';

interface HadithModalProps {
    surah: GraphNode;
    onClose: () => void;
}

export default function HadithModal({ surah, onClose }: HadithModalProps) {
    const titleId = useId();
    const specific = hadithsData.find((hadith) => hadith.surahId === surah.id);
    const general = hadithsData.find((hadith) => hadith.source.includes('General Virtue')) ?? {
        arabicText: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
        englishText: "The best among you (Muslims) are those who learn the Qur'an and teach it.",
        source: 'Sahih al-Bukhari 5027 (General Virtue)',
    };
    // Legacy Quran quotations remain in the source collection, but are not presented as hadith.
    const isQuranQuotation = !!specific && /Quran\s+\d+:\d+/i.test(`${specific.source} ${specific.englishText}`);
    const hadith = specific && !isQuranQuotation ? specific : general;
    const isGeneral = hadith.source.includes('General Virtue') || hadith === general;
    const isThematic = hadith.source.includes('Thematic:');

    return (
        <SacredDialog onClose={onClose} labelledBy={titleId} className="hadith-dialog">
            <div className="hadith-shell">
                <header className="hadith-header">
                    <div className="hadith-header-icon"><BookOpen size={18} /></div>
                    <p className="reader-eyebrow">A MOMENT OF REFLECTION</p>
                    <button className="reader-close" onClick={onClose} aria-label="Close hadith" autoFocus><X size={20} /></button>
                </header>
                <div className="hadith-content" tabIndex={0}>
                    <p className="hadith-category">{isGeneral ? 'On learning the Quran' : isThematic ? `Related reading · ${surah.name}` : `Hadith · ${surah.name}`}</p>
                    <h2 id={titleId} className="hadith-title">{isGeneral ? 'The virtue of learning' : 'Words to reflect upon'}</h2>
                    <div className="hadith-ornament" aria-hidden="true"><span />✦<span /></div>
                    <p className="hadith-arabic" lang="ar" dir="rtl">{hadith.arabicText}</p>
                    <blockquote className="hadith-english" lang="en">“{hadith.englishText}”</blockquote>
                    <p className="hadith-source">{hadith.source}</p>
                    {isGeneral && <p className="hadith-context">A general narration about learning and teaching the Quran.</p>}
                    {isThematic && <p className="hadith-context">A thematic reading paired with this surah.</p>}
                </div>
                <footer className="hadith-footer">Read slowly. Reflect deeply.</footer>
            </div>
        </SacredDialog>
    );
}
