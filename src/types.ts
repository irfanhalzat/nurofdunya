export interface Surah {
    id: number;
    transliterationName: string;
    arabicName: string;
    revelationType: 'Meccan' | 'Medinan';
    verseCount: number;
}

export interface GraphNode {
    id: number;
    name: string;
    arabicName: string;
    revelationType: 'Meccan' | 'Medinan';
    verseCount: number;
    // Force-graph computed properties
    x?: number;
    y?: number;
    z?: number;
    neighbors?: GraphNode[];
    links?: GraphLink[];
}

export interface GraphLink {
    source: number;
    target: number;
    type: string;
}
