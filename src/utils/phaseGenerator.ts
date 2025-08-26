import type { Phase, PhaseComponent, PhaseType, PhaseSet } from '../types/phase';

// Base phase components used in traditional Phase 10
const PHASE_COMPONENTS: Array<{
    type: PhaseType;
    minSize: number;
    maxSize: number;
    baseDifficulty: number;
    description: (count: number, size: number) => string;
}> = [
        {
            type: 'set',
            minSize: 2,
            maxSize: 6,
            baseDifficulty: 1,
            description: (count, size) => count === 1 ? `1 set of ${size}` : `${count} sets of ${size}`
        },
        {
            type: 'run',
            minSize: 3,
            maxSize: 10,
            baseDifficulty: 2,
            description: (count, size) => count === 1 ? `1 run of ${size}` : `${count} runs of ${size}`
        },
        {
            type: 'color',
            minSize: 4,
            maxSize: 10,
            baseDifficulty: 3,
            description: (_, size) => `${size} cards of one color`
        },
        {
            type: 'evenOdd',
            minSize: 4,
            maxSize: 10,
            baseDifficulty: 3,
            description: (_, size) => `${size} even or odd cards`
        },
        {
            type: 'colorRun',
            minSize: 3,
            maxSize: 8,
            baseDifficulty: 4,
            description: (count, size) => count === 1 ? `1 color run of ${size}` : `${count} color runs of ${size}`
        },
        {
            type: 'colorEvenOdd',
            minSize: 3,
            maxSize: 7,
            baseDifficulty: 5,
            description: (_, size) => `${size} even or odd cards of one color`
        }
    ];

// Generate a random number with weighted probability towards lower values for early phases
function getWeightedRandom(min: number, max: number, phase: number): number {
    const range = max - min + 1;
    const weight = Math.max(0.3, 1 - (phase - 1) * 0.1); // Early phases favor smaller numbers
    const random = Math.pow(Math.random(), weight);
    return min + Math.floor(random * range);
}

// Calculate difficulty based on phase components
function calculateDifficulty(components: PhaseComponent[], phaseNumber: number): number {
    let totalDifficulty = 0;
    let totalCards = 0;

    components.forEach(comp => {
        const baseDiff = PHASE_COMPONENTS.find(pc => pc.type === comp.type)?.baseDifficulty || 1;
        totalDifficulty += baseDiff * comp.count * (comp.size / 3);
        totalCards += comp.count * comp.size;
    });

    // Adjust difficulty based on phase number and total cards
    const phaseBonusDifficulty = Math.max(1, phaseNumber * 0.5);
    const cardCountDifficulty = Math.max(1, totalCards / 8);

    return Math.min(10, Math.max(1, Math.round(totalDifficulty + phaseBonusDifficulty + cardCountDifficulty)));
}

// Generate a single phase component
function generatePhaseComponent(phaseNumber: number, existingComponents: PhaseComponent[]): PhaseComponent {
    const existingCardCount = existingComponents.reduce((sum, comp) => sum + (comp.count * comp.size), 0);
    const remainingCards = Math.max(3, 12 - existingCardCount); // Keep reasonable card count

    // Choose component type based on phase number (later phases can have more complex types)
    const availableTypes = PHASE_COMPONENTS.filter((_, index) => {
        if (phaseNumber <= 3) return index <= 1; // Early phases: sets and runs only
        if (phaseNumber <= 6) return index <= 3; // Mid phases: add colors and even/odd
        return true; // Late phases: all types available
    });

    const componentType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const maxSize = Math.min(componentType.maxSize, remainingCards);
    const size = getWeightedRandom(componentType.minSize, maxSize, phaseNumber);
    const maxCount = Math.max(1, Math.floor(remainingCards / size));
    const count = phaseNumber <= 5 ? 1 : getWeightedRandom(1, Math.min(3, maxCount), phaseNumber);

    return {
        type: componentType.type,
        count,
        size,
        description: componentType.description(count, size)
    };
}

// Generate a complete phase
function generateSinglePhase(phaseNumber: number): Phase {
    const components: PhaseComponent[] = [];
    let totalCards = 0;
    let attempts = 0;

    // Generate 1-3 components per phase, with later phases having more components
    const maxComponents = phaseNumber <= 4 ? 2 : (phaseNumber <= 7 ? 3 : 3);
    const componentCount = Math.max(1, Math.min(maxComponents, getWeightedRandom(1, maxComponents, phaseNumber)));

    for (let i = 0; i < componentCount && attempts < 20; i++) {
        const component = generatePhaseComponent(phaseNumber, components);
        const newTotalCards = totalCards + (component.count * component.size);

        // Ensure reasonable card count (Phase 10 typically uses 7-12 cards)
        if (newTotalCards <= 12) {
            components.push(component);
            totalCards = newTotalCards;
        } else if (components.length === 0) {
            // If this is the first component and it's too big, make it smaller
            const maxSizeForRemainingCards = Math.min(component.size, 10);
            const adjustedComponent = {
                ...component,
                size: maxSizeForRemainingCards,
                description: PHASE_COMPONENTS.find(pc => pc.type === component.type)?.description(component.count, maxSizeForRemainingCards) || component.description
            };
            components.push(adjustedComponent);
            totalCards = adjustedComponent.count * adjustedComponent.size;
        }

        attempts++;
        // Stop if we have enough cards or enough components
        if (totalCards >= 7 && components.length >= 1) break;
    }

    // Ensure we have at least one component
    if (components.length === 0) {
        const fallbackComponent = generatePhaseComponent(phaseNumber, []);
        components.push(fallbackComponent);
        totalCards = fallbackComponent.count * fallbackComponent.size;
    }

    const description = components.map(comp => comp.description).join(' + ');
    const difficulty = calculateDifficulty(components, phaseNumber);

    return {
        id: phaseNumber,
        description,
        difficulty,
        cardCount: totalCards
    };
}

// Generate a complete set of 10 phases
export function generatePhaseSet(): PhaseSet {
    const phases: Phase[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    while (phases.length < 10 && attempts < maxAttempts) {
        const phaseNumber = phases.length + 1;
        let phase: Phase;
        let phaseAttempts = 0;

        // Generate phases with progressive difficulty, retry if difficulty doesn't increase appropriately
        do {
            phase = generateSinglePhase(phaseNumber);
            phaseAttempts++;
        } while (
            phaseAttempts < 15 &&
            phases.length > 0 &&
            (
                phase.difficulty < phases[phases.length - 1].difficulty - 2 || // Allow some flexibility
                (phaseNumber > 5 && phase.difficulty < phaseNumber - 3) // But ensure later phases are reasonably difficult
            )
        );

        // Ensure minimum difficulty progression
        if (phases.length > 0 && phase.difficulty < phases[phases.length - 1].difficulty) {
            phase.difficulty = Math.min(10, phases[phases.length - 1].difficulty + Math.floor(Math.random() * 2));
        }

        phases.push(phase);
        attempts++;
    }

    // Fill any missing phases if we hit max attempts
    while (phases.length < 10) {
        const phaseNumber = phases.length + 1;
        const phase = generateSinglePhase(phaseNumber);
        // Ensure difficulty is at least the phase number
        phase.difficulty = Math.max(phase.difficulty, Math.min(10, phaseNumber));
        phases.push(phase);
    }

    // Generate unique ID for the set
    const id = generateUniqueId();

    return {
        id,
        name: `Phase Set ${id}`,
        phases,
        createdAt: new Date()
    };
}

// Generate a unique ID based on timestamp and random elements
function generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
}

// Parse phase set ID from URL and validate
export function parsePhaseSetFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const setId = urlParams.get('set');

    return setId && /^[a-z0-9]+-[a-z0-9]{6}$/.test(setId) ? setId : null;
}

// Generate URL for sharing phase set
export function generateShareableUrl(phaseSetId: string): string {
    if (typeof window === 'undefined') return '';

    const url = new URL(window.location.href);
    url.searchParams.set('set', phaseSetId);
    return url.toString();
}

// Seed the random number generator with phase set ID for consistent results
function seedRandom(seed: string) {
    let seedNumber = 0;
    for (let i = 0; i < seed.length; i++) {
        seedNumber += seed.charCodeAt(i);
    }

    // Simple seeded random number generator
    return function () {
        seedNumber = (seedNumber * 9301 + 49297) % 233280;
        return seedNumber / 233280;
    };
}

// Generate deterministic phase set from ID
export function generatePhaseSetFromId(id: string): PhaseSet {
    const originalRandom = Math.random;
    Math.random = seedRandom(id);

    try {
        const phaseSet = generatePhaseSet();
        return {
            ...phaseSet,
            id,
            name: `Shared Phase Set`
        };
    } finally {
        Math.random = originalRandom;
    }
}
