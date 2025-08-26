import type { Phase, PhaseComponent, PhaseType, PhaseSet } from '../types/phase';

// Algorithm version - increment this when making breaking changes to phase generation
const ALGORITHM_VERSION = '1.0.0';

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
            maxSize: 4, // Reduced max size - sets of 5+ are extremely difficult
            baseDifficulty: 2, // Increased base difficulty - sets are harder than runs
            description: (count, size) => count === 1 ? `1 set of ${size}` : `${count} sets of ${size}`
        },
        {
            type: 'run',
            minSize: 3,
            maxSize: 8,
            baseDifficulty: 1, // Reduced base difficulty - runs are easier than sets
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
    // Safety check for invalid bounds
    if (min > max) {
        return min;
    }
    if (min === max) {
        return min;
    }

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

        // Sets get much harder with size (exponential difficulty)
        if (comp.type === 'set') {
            componentComplexity += Math.pow(comp.size - 2, 1.8); // Much steeper difficulty curve for sets
        } else {
            // Other types scale more linearly
            componentComplexity += (comp.size - componentType.minSize) * 0.4;
        }

        // Add complexity for multiple components of same type
        if (comp.count > 1) {
            componentComplexity += (comp.count - 1) * 1.2; // Increased multiplier penalty
        }

        totalComplexity += componentComplexity;
        totalCards += comp.count * comp.size;
    });

    // Add bonus for having multiple different component types (combinations are harder)
    if (components.length > 1) {
        totalComplexity += (components.length - 1) * 1.0;
    }

    // Add bonus for total card count
    totalComplexity += Math.max(0, (totalCards - 6) * 0.3);

    // Convert to 1-10 scale with better scaling
    let difficulty = Math.round(Math.min(10, Math.max(1, totalComplexity * 0.8 + 1)));

    return difficulty;
}// Generate a single phase component
function generatePhaseComponent(phaseNumber: number, existingComponents: PhaseComponent[]): PhaseComponent {
    const existingCardCount = existingComponents.reduce((sum, comp) => sum + (comp.count * comp.size), 0);
    const remainingCards = Math.max(2, 9 - existingCardCount); // Max 9 cards total

    // Choose component type based on phase number with more variety in early phases
    const availableTypes = PHASE_COMPONENTS.filter((_, index) => {
        if (phaseNumber <= 3) return index <= 1; // First 3 phases: sets and runs only (like original game)
        if (phaseNumber <= 5) return index <= 2; // Phases 4-5: add colors 
        if (phaseNumber <= 7) return index <= 3; // Phases 6-7: add even/odd
        return true; // Late phases: all types available
    });

    // Ensure variety by avoiding same type as existing components in early phases
    let availableTypesFiltered = availableTypes;
    if (phaseNumber <= 5 && existingComponents.length > 0 && availableTypes.length > 1) {
        const existingTypes = existingComponents.map(comp => comp.type);
        const differentTypes = availableTypes.filter(type => !existingTypes.includes(type.type));
        // Only use filtered types if we have options, otherwise fall back to all available types
        if (differentTypes.length > 0) {
            availableTypesFiltered = differentTypes;
        }
    }

    // Safety check - make sure we have at least one available type
    if (availableTypesFiltered.length === 0) {
        availableTypesFiltered = availableTypes.length > 0 ? availableTypes : PHASE_COMPONENTS.slice(0, 2);
    }

    // Weight selection towards more complex types for later phases
    let componentType;
    if (phaseNumber >= 8 && availableTypesFiltered.length > 3) {
        // Later phases: prefer more complex types
        const complexTypes = availableTypesFiltered.slice(2); // Skip basic sets and runs sometimes
        componentType = Math.random() < 0.6 ?
            complexTypes[Math.floor(Math.random() * complexTypes.length)] :
            availableTypesFiltered[Math.floor(Math.random() * availableTypesFiltered.length)];
    } else {
        componentType = availableTypesFiltered[Math.floor(Math.random() * availableTypesFiltered.length)];
    }

    // Smarter size selection based on component type and difficulty  
    let size;
    if (componentType.type === 'set') {
        // For sets, be very conservative with size - larger sets are exponentially harder
        let maxSetSize;
        if (phaseNumber <= 3) {
            // Early phases: favor smaller sets to allow multiple components
            maxSetSize = Math.min(3, componentType.maxSize, remainingCards);
            // If we're trying to create multiple components, make them smaller
            if (existingComponents.length > 0 || remainingCards < 8) {
                maxSetSize = Math.min(3, maxSetSize);
            }
        } else if (phaseNumber <= 6) {
            maxSetSize = Math.min(4, componentType.maxSize, remainingCards);
        } else {
            maxSetSize = Math.min(componentType.maxSize, remainingCards);
        }

        // Ensure we have valid bounds
        if (maxSetSize < componentType.minSize) {
            maxSetSize = Math.min(componentType.minSize, remainingCards);
        }

        size = getWeightedRandom(componentType.minSize, maxSetSize, phaseNumber);
    } else if (componentType.type === 'run') {
        // For runs, allow larger sizes in later phases including 8+ card runs
        let maxRunSize;
        if (phaseNumber <= 3) {
            maxRunSize = Math.min(5, componentType.maxSize, remainingCards);
            // If we're trying to create multiple components, make them smaller
            if (existingComponents.length > 0 || remainingCards < 8) {
                maxRunSize = Math.min(4, maxRunSize);
            }
        } else if (phaseNumber <= 6) {
            // Mid phases: allow up to 7 card runs
            maxRunSize = Math.min(7, componentType.maxSize, remainingCards);
        } else {
            // Late phases: allow full-size runs up to 8-9 cards for single-component high difficulty
            maxRunSize = Math.min(componentType.maxSize, remainingCards);
        }

        const minRunSize = Math.min(componentType.minSize, remainingCards);

        // Ensure valid bounds
        if (maxRunSize < minRunSize) {
            size = Math.min(minRunSize, remainingCards);
        } else {
            size = getWeightedRandom(minRunSize, maxRunSize, phaseNumber);
        }
    } else {
        // For other types (color, evenOdd, colorRun), allow larger sizes in later phases
        let maxSize;
        if (phaseNumber <= 6) {
            maxSize = Math.min(componentType.maxSize, remainingCards, 7);
        } else {
            // Late phases: allow full-size color/even-odd phases (8-9 cards)
            maxSize = Math.min(componentType.maxSize, remainingCards);
        }

        const minSize = Math.min(componentType.minSize, remainingCards);

        // Ensure valid bounds
        if (maxSize < minSize) {
            size = Math.min(minSize, remainingCards);
        } else {
            size = getWeightedRandom(minSize, maxSize, phaseNumber);
        }
    }

    // Final safety check - ensure size is within bounds
    size = Math.max(componentType.minSize, Math.min(size, remainingCards, componentType.maxSize));

    const maxCount = Math.max(1, Math.floor(remainingCards / size));

    // Later phases more likely to have multiple components, but be smarter about it
    let count;
    if (componentType.type === 'set' && size >= 4) {
        // Large sets should almost never be multiple
        count = 1;
    } else if (phaseNumber <= 3) {
        // Early phases: allow multiples for smaller components (like "2 sets of 3")
        if (size <= 3 && remainingCards >= size * 2) {
            count = Math.random() < 0.6 ? 2 : 1;
        } else {
            count = 1;
        }
    } else if (phaseNumber <= 7) {
        count = getWeightedRandom(1, Math.min(2, maxCount), phaseNumber);
    } else {
        count = getWeightedRandom(1, Math.min(2, maxCount), phaseNumber);
    }

    return {
        type: componentType.type,
        count,
        size,
        description: componentType.description(count, size)
    };
}

// Generate a complete phase
export function generateSinglePhase(phaseNumber: number): Phase {
    const components: PhaseComponent[] = [];
    let totalCards = 0;
    let attempts = 0;

    // Generate 1-3 components per phase, allowing multiple components in early phases like original Phase 10
    let componentCount;

    if (phaseNumber <= 3) {
        // Early phases: Mix of single and multiple components (like original Phase 10)
        // Original has "2 sets of 3", "1 set of 3 + 1 run of 4", etc.
        const rand = Math.random();
        if (phaseNumber === 1) {
            // Phase 1: Mix of easy single and multi-component phases
            if (rand < 0.3) componentCount = 1;
            else componentCount = 2;
        } else {
            // Phases 2-3: More variety
            if (rand < 0.4) componentCount = 1;
            else if (rand < 0.8) componentCount = 2;
            else componentCount = 1; // Fallback to 1 if we can't fit 2
        }
    } else if (phaseNumber <= 6) {
        componentCount = Math.random() < 0.3 ? 1 : 2; // Mid phases: mostly 2 components
    } else {
        // Later phases (7-10): Favor single large components for high difficulty phases
        // This allows for phases like "1 run of 8", "9 cards of one color", "1 color run of 7"
        const rand = Math.random();
        if (rand < 0.6) componentCount = 1; // Increased preference for single components
        else if (rand < 0.9) componentCount = 2;
        else componentCount = 3;
    }

    for (let i = 0; i < componentCount && attempts < 20; attempts++) {
        const component = generatePhaseComponent(phaseNumber, components);
        const newTotalCards = totalCards + (component.count * component.size);

        // Ensure maximum 9 cards per phase
        if (newTotalCards <= 9) {
            components.push(component);
            totalCards = newTotalCards;
            i++; // Only increment i when we successfully add a component
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
            i++; // Increment i when we add the adjusted component
        }

        // Stop if we have enough cards or enough components
        if (totalCards >= 6 && components.length >= 1) break; // Minimum 6 cards for a reasonable phase
    }

    // Ensure we have at least one component and minimum 6 cards
    if (components.length === 0 || totalCards < 6) {
        if (components.length === 0) {
            // No components at all - create a reasonable fallback
            const fallbackComponent = {
                type: 'run' as PhaseType, // Use run instead of set - easier and more reasonable
                count: 1,
                size: 6,
                description: '1 run of 6'
            };
            components.push(fallbackComponent);
            totalCards = 6;
        } else {
            // Have components but not enough cards - adjust them
            let adjustmentAttempts = 0;
            while (totalCards < 6 && components.length > 0 && adjustmentAttempts < 10) {
                // Find the component we can most easily expand
                const expandableComponent = components.find(comp => comp.count * comp.size < 7) || components[0];
                const maxPossibleSize = Math.min(9, 9 - (totalCards - expandableComponent.count * expandableComponent.size));

                if (maxPossibleSize > expandableComponent.size) {
                    const oldSize = expandableComponent.count * expandableComponent.size;
                    // Be more conservative about expanding sets
                    const maxExpansion = expandableComponent.type === 'set' ?
                        Math.min(4, expandableComponent.size + 1) :
                        Math.min(maxPossibleSize, expandableComponent.size + Math.ceil((6 - totalCards) / expandableComponent.count));
                    expandableComponent.size = maxExpansion;
                    const componentType = PHASE_COMPONENTS.find(pc => pc.type === expandableComponent.type);
                    expandableComponent.description = componentType?.description(expandableComponent.count, expandableComponent.size) || expandableComponent.description;
                    totalCards = totalCards - oldSize + (expandableComponent.count * expandableComponent.size);
                } else {
                    // Can't expand existing components enough, replace with reasonable fallback
                    components.length = 0;
                    totalCards = 0;
                    const fallbackComponent = {
                        type: 'run' as PhaseType, // Use run - more reasonable than large set
                        count: 1,
                        size: 6,
                        description: '1 run of 6'
                    };
                    components.push(fallbackComponent);
                    totalCards = 6;
                    break;
                }
                adjustmentAttempts++;
            }

            // If we still don't have enough cards after adjustment attempts, use fallback
            if (totalCards < 6) {
                components.length = 0;
                const fallbackComponent = {
                    type: 'run' as PhaseType,
                    count: 1,
                    size: 6,
                    description: '1 run of 6'
                };
                components.push(fallbackComponent);
                totalCards = 6;
            }
        }
    }

    // Sort components for consistent descriptions
    // Sort by: 1) type priority, 2) count (descending), 3) size (descending)
    const typeOrder: Record<PhaseType, number> = {
        'set': 1,
        'run': 2,
        'color': 3,
        'evenOdd': 4,
        'colorRun': 5,
        'colorEvenOdd': 6
    };

    components.sort((a, b) => {
        const typeComparison = typeOrder[a.type] - typeOrder[b.type];
        if (typeComparison !== 0) return typeComparison;

        const countComparison = b.count - a.count; // Higher count first
        if (countComparison !== 0) return countComparison;

        return b.size - a.size; // Higher size first
    });

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

// Reroll a single phase while ensuring it doesn't duplicate existing phases
export function rerollSinglePhase(phasePosition: number, existingPhases: Phase[], providedRerollId?: string): Phase {
    // If we have a provided rerollId, generate deterministically
    if (providedRerollId) {
        const originalRandom = Math.random;

        try {
            // Seed with the specific rerollId to ensure deterministic results
            Math.random = seedRandom(providedRerollId);

            // Generate the phase deterministically
            const deterministicPhase = generateSinglePhase(phasePosition);
            deterministicPhase.id = phasePosition;
            deterministicPhase.rerollId = providedRerollId;

            return deterministicPhase;
        } finally {
            // Restore original Math.random
            Math.random = originalRandom;
        }
    }

    // For new rerolls (no providedRerollId), use deterministic approach with duplicate checking
    let attempts = 0;
    let newPhase: Phase | null = null;

    while (attempts < 20 && !newPhase) {
        // Generate a new rerollId for this attempt
        const candidateRerollId = generateRerollId();

        // Generate phase deterministically with this rerollId  
        const originalRandom = Math.random;

        try {
            Math.random = seedRandom(candidateRerollId);
            const candidatePhase = generateSinglePhase(phasePosition);
            candidatePhase.id = phasePosition;
            candidatePhase.rerollId = candidateRerollId;

            // Check for duplicates
            if (!isDuplicatePhase(candidatePhase, existingPhases)) {
                newPhase = candidatePhase;
            }
        } finally {
            Math.random = originalRandom;
        }

        attempts++;
    }

    // If we couldn't find a unique phase after many attempts, create a variation
    if (!newPhase) {
        const finalRerollId = generateRerollId();
        const originalRandom = Math.random;

        try {
            Math.random = seedRandom(finalRerollId);
            const fallbackPhase = generateSinglePhase(phasePosition);
            fallbackPhase.id = phasePosition;
            newPhase = createVariationOfPhase(fallbackPhase, existingPhases);
            newPhase.id = phasePosition;
            newPhase.rerollId = finalRerollId;
        } finally {
            Math.random = originalRandom;
        }
    }

    return newPhase;
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
        createdAt: new Date(),
        version: ALGORITHM_VERSION
    };
}

// Generate a unique ID based on random elements only
function generateUniqueId(): string {
    // Generate two random strings for better uniqueness
    const randomPart1 = Math.random().toString(36).substring(2, 8);
    const randomPart2 = Math.random().toString(36).substring(2, 8);
    return `${randomPart1}-${randomPart2}`;
}

// Generate a shorter unique ID for rerolls
function generateRerollId(): string {
    return Math.random().toString(36).substring(2, 8);
}

// Parse phase set ID and reroll information from URL
export function parsePhaseSetFromUrl(): { setId: string; rerolls: Record<number, string> } | null {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const setId = urlParams.get('set');

    // Validate format: [6 chars]-[6 chars] for new IDs, but allow [3-12 chars]-[6 chars] for backward compatibility
    // This matches our new generateUniqueId() format but accepts legacy timestamp-based IDs
    if (!setId || !/^[a-z0-9]{3,12}-[a-z0-9]{6}$/.test(setId)) {
        return null;
    }

    // Additional check: reject obvious test/placeholder words to prevent misuse
    const firstPart = setId.split('-')[0];
    if (firstPart === 'invalid') {
        return null;
    }

    // Parse reroll information
    const rerolls: Record<number, string> = {};
    urlParams.forEach((value, key) => {
        const match = key.match(/^r(\d+)$/); // Match parameters like r1, r2, etc.
        if (match) {
            const phaseId = parseInt(match[1]);
            if (phaseId >= 1 && phaseId <= 10 && /^[a-z0-9]{3,8}$/.test(value)) {
                rerolls[phaseId] = value;
            }
        }
    });

    return { setId, rerolls };
}

// Generate URL for sharing phase set with reroll information
export function generateShareableUrl(phaseSet: PhaseSet): string {
    if (typeof window === 'undefined') return '';

    const url = new URL(window.location.href);
    url.searchParams.set('set', phaseSet.id);

    // Clear any existing reroll parameters
    Array.from(url.searchParams.keys()).forEach(key => {
        if (key.match(/^r\d+$/)) {
            url.searchParams.delete(key);
        }
    });

    // Add reroll information
    if (phaseSet.rerolls) {
        Object.entries(phaseSet.rerolls).forEach(([phaseId, rerollId]) => {
            url.searchParams.set(`r${phaseId}`, rerollId);
        });
    }

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
export function generatePhaseSetFromId(id: string, rerolls?: Record<number, string>): PhaseSet {
    const originalRandom = Math.random;
    Math.random = seedRandom(id);

    try {
        const phaseSet = generatePhaseSet();

        // Apply rerolls if provided
        if (rerolls) {
            Object.entries(rerolls).forEach(([phaseIdStr, rerollId]) => {
                const phaseId = parseInt(phaseIdStr);
                const phaseIndex = phaseSet.phases.findIndex(p => p.id === phaseId);

                if (phaseIndex !== -1) {
                    // Generate rerolled phase - rerollSinglePhase handles its own seeding for consistency
                    const otherPhases = phaseSet.phases.filter(p => p.id !== phaseId);
                    const rerolledPhase = rerollSinglePhase(phaseId, otherPhases, rerollId);
                    phaseSet.phases[phaseIndex] = rerolledPhase;
                }
            });
        }

        return {
            ...phaseSet,
            id,
            name: `Shared Phase Set`,
            rerolls
        };
    } finally {
        Math.random = originalRandom;
    }
}
