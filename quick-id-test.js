// Quick test to show the new ID generation creates varying prefixes
import { generatePhaseSet } from './src/utils/phaseGenerator.ts';

console.log('Testing new ID generation...\n');

console.log('Generated IDs:');
for (let i = 0; i < 10; i++) {
    const phaseSet = generatePhaseSet();
    console.log(`${i + 1}: ${phaseSet.id}`);
}

// Test prefixes
console.log('\nPrefix analysis:');
const ids = Array.from({ length: 20 }, () => generatePhaseSet().id);
const prefixes = ids.map(id => id.split('-')[0]);
const uniquePrefixes = new Set(prefixes);

console.log(`Generated ${ids.length} IDs`);
console.log(`Unique prefixes: ${uniquePrefixes.size}`);
console.log(`Sample prefixes: ${Array.from(uniquePrefixes).slice(0, 5).join(', ')}`);

if (uniquePrefixes.size > 1) {
    console.log('\n✅ SUCCESS: IDs now have varying prefixes (not timestamp-based)');
} else {
    console.log('\n❌ ISSUE: All IDs still have the same prefix');
}
