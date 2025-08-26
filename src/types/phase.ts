export interface Phase {
    id: number;
    description: string;
    difficulty: number; // 1-10 scale
    cardCount: number; // Total cards needed for the phase
    rerollId?: string; // Unique ID for rerolled phases
}

export interface PhaseSet {
    id: string;
    name: string;
    phases: Phase[];
    createdAt: Date;
    version: string; // Algorithm version for backward compatibility
    rerolls?: Record<number, string>; // Map of phase IDs to their reroll IDs
}

export type PhaseType =
    | 'set'
    | 'run'
    | 'color'
    | 'evenOdd'
    | 'colorRun'
    | 'colorEvenOdd';

export interface PhaseComponent {
    type: PhaseType;
    count: number;
    size: number;
    description: string;
}
