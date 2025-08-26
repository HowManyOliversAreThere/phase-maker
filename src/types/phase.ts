export interface Phase {
    id: number;
    description: string;
    difficulty: number; // 1-10 scale
    cardCount: number; // Total cards needed for the phase
}

export interface PhaseSet {
    id: string;
    name: string;
    phases: Phase[];
    createdAt: Date;
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
