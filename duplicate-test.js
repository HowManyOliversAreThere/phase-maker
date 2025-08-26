// Quick verification script for duplicate prevention
import { generatePhaseSet } from './dist/assets/index-BK-3rz0W.js';

console.log('Testing duplicate prevention:');

// Generate multiple phase sets to test
for (let setNum = 1; setNum <= 3; setNum++) {
    console.log(`\n--- Phase Set ${setNum} ---`);

    const phaseSet = generatePhaseSet();
    const descriptions = phaseSet.phases.map(p => p.description);
    const uniqueDescriptions = new Set(descriptions);

    phaseSet.phases.forEach((phase, i) => {
        console.log(`Phase ${i + 1}: ${phase.description} (${phase.cardCount} cards)`);
    });

    console.log(`\nUnique phases: ${uniqueDescriptions.size}/10`);
    console.log(`Duplicates prevented: ${uniqueDescriptions.size === 10 ? '✅ YES' : '❌ NO'}`);
}
