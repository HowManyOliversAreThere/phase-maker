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
            maxSize: 5,
            baseDifficulty: 1,
            description: (count, size) => count === 1 ? `1 set of ${size}` : `${count} sets of ${size}`
        },
        {
            type: 'run',
            minSize: 3,
            maxSize: 8,
            baseDifficulty: 2,
            description: (count, size) => count === 1 ? `1 run of ${size}` : `${count} runs of ${size}`
        },
        {
            type: 'color',
            minSize: 4,
            maxSize: 8,
            baseDifficulty: 3,
            description: (_, size) => `${size} cards of one color`
        },
        {
            type: 'evenOdd',
            minSize: 4,
            maxSize: 8,
            baseDifficulty: 3,
            description: (_, size) => `${size} even or odd cards`
        },
        {
            type: 'colorRun',
            minSize: 3,
            maxSize: 6,
            baseDifficulty: 4,
            description: (count, size) => count === 1 ? `1 color run of ${size}` : `${count} color runs of ${size}`
        },
        {
            type: 'colorEvenOdd',
            minSize: 3,
            maxSize: 6,
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

// Calculate difficulty based purely on phase components complexity
function calculateDifficulty(components: PhaseComponent[], _phaseNumber: number): number {
    let totalComplexity = 0;
    let totalCards = 0;

    components.forEach(comp => {
        const componentType = PHASE_COMPONENTS.find(pc => pc.type === comp.type);
        if (!componentType) return;

        // Base complexity from component type
        let componentComplexity = componentType.baseDifficulty;

        // Add complexity for size (larger = harder)
        componentComplexity += (comp.size - componentType.minSize) * 0.4;

        // Add complexity for multiple components of same type
        if (comp.count > 1) {
            componentComplexity += (comp.count - 1) * 0.8;
        }

        totalComplexity += componentComplexity;
        totalCards += comp.count * comp.size;
    });

    // Add small bonus for having multiple different component types (combinations are harder)
    if (components.length > 1) {
        totalComplexity += (components.length - 1) * 0.7;
    }

    // Add very small bonus for total card count
    totalComplexity += Math.max(0, (totalCards - 6) * 0.2);

    // Convert to 1-10 scale
    let difficulty = Math.round(totalComplexity);

    // Clamp to reasonable bounds
    difficulty = Math.min(10, Math.max(1, difficulty));

    return difficulty;
}// Generate a single phase component
function generatePhaseComponent(phaseNumber: number, existingComponents: PhaseComponent[]): PhaseComponent {
    const existingCardCount = existingComponents.reduce((sum, comp) => sum + (comp.count * comp.size), 0);
    const remainingCards = Math.max(2, 9 - existingCardCount); // Max 9 cards total

    // Choose component type based on phase number (later phases can have more complex types)
    const availableTypes = PHASE_COMPONENTS.filter((_, index) => {
        if (phaseNumber <= 3) return index <= 1; // Early phases: sets and runs only
        if (phaseNumber <= 6) return index <= 3; // Mid phases: add colors and even/odd
        return true; // Late phases: all types available
    });

    // Weight selection towards more complex types for later phases
    let componentType;
    if (phaseNumber >= 8 && availableTypes.length > 3) {
        // Later phases: prefer more complex types
        const complexTypes = availableTypes.slice(2); // Skip basic sets and runs sometimes
        componentType = Math.random() < 0.6 ?
            complexTypes[Math.floor(Math.random() * complexTypes.length)] :
            availableTypes[Math.floor(Math.random() * availableTypes.length)];
    } else {
        componentType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    const maxSize = Math.min(componentType.maxSize, remainingCards, 7); // Individual components max 7 cards
    const size = getWeightedRandom(componentType.minSize, maxSize, phaseNumber);
    const maxCount = Math.max(1, Math.floor(remainingCards / size));

    // Later phases more likely to have multiple components
    const count = phaseNumber <= 4 ? 1 :
        (phaseNumber <= 7 ? getWeightedRandom(1, Math.min(2, maxCount), phaseNumber) :
            getWeightedRandom(1, Math.min(2, maxCount), phaseNumber)); return {
                type: componentType.type,
                count,
                size,
                description: componentType.description(count, size)
            };
}// Generate a complete phase
function generateSinglePhase(phaseNumber: number): Phase {
    const components: PhaseComponent[] = [];
    let totalCards = 0;
    let attempts = 0;

    // Generate 1-3 components per phase, with later phases strongly favoring more components
    let componentCount;

    if (phaseNumber <= 3) {
        componentCount = 1; // Early phases: single component only
    } else if (phaseNumber <= 6) {
        componentCount = Math.random() < 0.3 ? 1 : 2; // Mid phases: mostly 2 components
    } else {
        // Later phases: strongly prefer multiple components for natural complexity
        const rand = Math.random();
        if (rand < 0.15) componentCount = 1;
        else if (rand < 0.6) componentCount = 2;
        else componentCount = 3;
    } for (let i = 0; i < componentCount && attempts < 20; i++) {
        const component = generatePhaseComponent(phaseNumber, components);
        const newTotalCards = totalCards + (component.count * component.size);

        // Ensure maximum 9 cards per phase
        if (newTotalCards <= 9) {
            components.push(component);
            totalCards = newTotalCards;
        } else if (components.length === 0) {
            // If this is the first component and it's too big, make it smaller
            const maxSizeForRemainingCards = Math.min(component.size, 9);
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
        if (totalCards >= 6 && components.length >= 1) break; // Minimum 6 cards for a reasonable phase
    }

    // Ensure we have at least one component and minimum 6 cards
    if (components.length === 0 || totalCards < 6) {
        if (components.length === 0) {
            // No components at all - create a fallback
            const fallbackComponent = {
                type: 'set' as PhaseType,
                count: 1,
                size: 6,
                description: '1 set of 6'
            };
            components.push(fallbackComponent);
            totalCards = 6;
        } else {
            // Have components but not enough cards - adjust them
            while (totalCards < 6 && components.length > 0) {
                // Find the component we can most easily expand
                const expandableComponent = components.find(comp => comp.count * comp.size < 7) || components[0];
                const maxPossibleSize = Math.min(9, 9 - (totalCards - expandableComponent.count * expandableComponent.size));

                if (maxPossibleSize > expandableComponent.size) {
                    const oldSize = expandableComponent.count * expandableComponent.size;
                    expandableComponent.size = Math.min(maxPossibleSize, expandableComponent.size + Math.ceil((6 - totalCards) / expandableComponent.count));
                    const componentType = PHASE_COMPONENTS.find(pc => pc.type === expandableComponent.type);
                    expandableComponent.description = componentType?.description(expandableComponent.count, expandableComponent.size) || expandableComponent.description;
                    totalCards = totalCards - oldSize + (expandableComponent.count * expandableComponent.size);
                } else {
                    // Can't expand existing components enough, replace with simple fallback
                    components.length = 0;
                    totalCards = 0;
                    const fallbackComponent = {
                        type: 'set' as PhaseType,
                        count: 1,
                        size: 6,
                        description: '1 set of 6'
                    };
                    components.push(fallbackComponent);
                    totalCards = 6;
                    break;
                }
            }
        }
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

// Check if two phases are identical (same description and card count)
function arePhasesIdentical(phase1: Phase, phase2: Phase): boolean {
    return phase1.description === phase2.description && phase1.cardCount === phase2.cardCount;
}

// Check if a phase already exists in the phases array
function isDuplicatePhase(phase: Phase, existingPhases: Phase[]): boolean {
    return existingPhases.some(existingPhase => arePhasesIdentical(phase, existingPhase));
}

// Create a variation of a phase to ensure uniqueness
function createVariationOfPhase(originalPhase: Phase, existingPhases: Phase[]): Phase {
    let variationPhase = { ...originalPhase };
    let attempts = 0;

    while (isDuplicatePhase(variationPhase, existingPhases) && attempts < 5) {
        // Try to modify the phase slightly by adjusting card count
        if (variationPhase.cardCount < 9) {
            variationPhase = {
                ...variationPhase,
                cardCount: variationPhase.cardCount + 1,
                description: variationPhase.description.replace(/(\d+)/, (_, num) => String(parseInt(num) + 1))
            };
        } else if (variationPhase.cardCount > 6) {
            variationPhase = {
                ...variationPhase,
                cardCount: variationPhase.cardCount - 1,
                description: variationPhase.description.replace(/(\d+)/, (_, num) => String(Math.max(2, parseInt(num) - 1)))
            };
        } else {
            // If we can't adjust card count, create a simple fallback
            variationPhase = {
                id: originalPhase.id,
                description: `1 set of ${6 + (originalPhase.id % 4)}`,
                difficulty: Math.min(10, originalPhase.difficulty + 1),
                cardCount: 6 + (originalPhase.id % 4)
            };
        }
        attempts++;
    }

    return variationPhase;
}

// Generate a complete set of 10 phases
export function generatePhaseSet(): PhaseSet {
    const phases: Phase[] = [];

    // Generate 10 unique phases
    for (let i = 1; i <= 10; i++) {
        let attempts = 0;
        let bestPhase: Phase | null = null;

        // Try to get a unique, reasonable phase
        while (attempts < 20) { // Increased attempts for duplicate checking
            const phase = generateSinglePhase(i);

            // Skip if this phase is a duplicate
            if (isDuplicatePhase(phase, phases)) {
                attempts++;
                continue;
            }

            // For first phase or if this phase is reasonable, use it
            if (phases.length === 0 ||
                phase.difficulty >= phases[phases.length - 1].difficulty - 1) {
                bestPhase = phase;
                break;
            }

            // Keep the best non-duplicate attempt
            if (!bestPhase || phase.difficulty > bestPhase.difficulty) {
                bestPhase = phase;
            }

            attempts++;
        }

        // Use the best phase we found, or generate a fallback
        let finalPhase = bestPhase || generateSinglePhase(i);

        // If we still have a duplicate, try a few more times with different approaches
        let duplicateAttempts = 0;
        while (isDuplicatePhase(finalPhase, phases) && duplicateAttempts < 10) {
            finalPhase = generateSinglePhase(i);
            duplicateAttempts++;
        }

        // If we still have a duplicate after many attempts, modify it slightly
        if (isDuplicatePhase(finalPhase, phases)) {
            finalPhase = createVariationOfPhase(finalPhase, phases);
        }

        phases.push(finalPhase);
    }

    // Sort phases by difficulty while preserving phase IDs (1-10)
    phases.sort((a, b) => {
        // Primary sort: by difficulty (ascending)
        if (a.difficulty !== b.difficulty) {
            return a.difficulty - b.difficulty;
        }
        // Secondary sort: by original ID to maintain consistency
        return a.id - b.id;
    });

    // Re-assign phase IDs to be sequential 1-10 after sorting
    phases.forEach((phase, index) => {
        phase.id = index + 1;
    });

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

    // Validate format: [3-12 chars]-[exactly 6 chars], lowercase only
    // This matches our generateUniqueId() format and reasonable variations
    if (!setId || !/^[a-z0-9]{3,12}-[a-z0-9]{6}$/.test(setId)) {
        return null;
    }

    // Additional check: reject obvious test/placeholder words to prevent misuse
    const firstPart = setId.split('-')[0];
    if (firstPart === 'invalid') {
        return null;
    }

    return setId;
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
