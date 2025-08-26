import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    generatePhaseSet,
    generatePhaseSetFromId,
    parsePhaseSetFromUrl,
    generateShareableUrl
} from '../utils/phaseGenerator'

describe('Phase Generator', () => {
    describe('generatePhaseSet', () => {
        it('should generate exactly 10 phases', () => {
            const phaseSet = generatePhaseSet()
            expect(phaseSet.phases).toHaveLength(10)
        })

        it('should have phases numbered 1 through 10', () => {
            const phaseSet = generatePhaseSet()
            phaseSet.phases.forEach((phase, index) => {
                expect(phase.id).toBe(index + 1)
            })
        })

        it('should have all phases with card count between 6 and 9', () => {
            const phaseSet = generatePhaseSet()
            phaseSet.phases.forEach(phase => {
                expect(phase.cardCount).toBeGreaterThanOrEqual(6)
                expect(phase.cardCount).toBeLessThanOrEqual(9)
            })
        })

        it('should have all phases with difficulty between 1 and 10', () => {
            const phaseSet = generatePhaseSet()
            phaseSet.phases.forEach(phase => {
                expect(phase.difficulty).toBeGreaterThanOrEqual(1)
                expect(phase.difficulty).toBeLessThanOrEqual(10)
            })
        })

        it('should have valid descriptions for all phases', () => {
            const phaseSet = generatePhaseSet()
            phaseSet.phases.forEach(phase => {
                expect(phase.description).toBeDefined()
                expect(phase.description.length).toBeGreaterThan(0)
                expect(typeof phase.description).toBe('string')
            })
        })

        it('should generate unique phase set ID', () => {
            const phaseSet1 = generatePhaseSet()
            const phaseSet2 = generatePhaseSet()
            expect(phaseSet1.id).not.toBe(phaseSet2.id)
        })

        it('should have created date', () => {
            const phaseSet = generatePhaseSet()
            expect(phaseSet.createdAt).toBeInstanceOf(Date)
            expect(phaseSet.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
        })

        it('should generate different phase sets on multiple calls', () => {
            const phaseSet1 = generatePhaseSet()
            const phaseSet2 = generatePhaseSet()

            // At least some phases should be different
            const differentPhases = phaseSet1.phases.some((phase, index) =>
                phase.description !== phaseSet2.phases[index].description
            )
            expect(differentPhases).toBe(true)
        })

        it('should have reasonable difficulty progression', () => {
            const phaseSet = generatePhaseSet()
            const difficulties = phaseSet.phases.map(p => p.difficulty)

            // Early phases should generally be easier than later phases
            const earlyAvg = difficulties.slice(0, 3).reduce((a, b) => a + b) / 3
            const lateAvg = difficulties.slice(-3).reduce((a, b) => a + b) / 3

            // Allow for some variance but late phases should trend higher
            expect(lateAvg).toBeGreaterThanOrEqual(earlyAvg - 1)
        })

        it('should sort phases by difficulty in ascending order', () => {
            // Test multiple phase sets to ensure consistent sorting
            for (let i = 0; i < 5; i++) {
                const phaseSet = generatePhaseSet()
                const difficulties = phaseSet.phases.map(p => p.difficulty)

                // Verify phases are sorted by difficulty (ascending)
                for (let j = 0; j < difficulties.length - 1; j++) {
                    expect(difficulties[j]).toBeLessThanOrEqual(difficulties[j + 1])
                }

                // Verify phase IDs are sequential 1-10 after sorting
                const ids = phaseSet.phases.map(p => p.id)
                expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            }
        })
    })

    describe('generatePhaseSetFromId', () => {
        it('should generate identical phase sets for the same ID', () => {
            const id = 'test123-abc456'
            const phaseSet1 = generatePhaseSetFromId(id)
            const phaseSet2 = generatePhaseSetFromId(id)

            expect(phaseSet1.id).toBe(phaseSet2.id)
            expect(phaseSet1.phases).toHaveLength(phaseSet2.phases.length)

            phaseSet1.phases.forEach((phase, index) => {
                const phase2 = phaseSet2.phases[index]
                expect(phase.id).toBe(phase2.id)
                expect(phase.description).toBe(phase2.description)
                expect(phase.difficulty).toBe(phase2.difficulty)
                expect(phase.cardCount).toBe(phase2.cardCount)
            })
        })

        it('should generate different phase sets for different IDs', () => {
            const phaseSet1 = generatePhaseSetFromId('test1-abc123')
            const phaseSet2 = generatePhaseSetFromId('test2-def456')

            expect(phaseSet1.id).not.toBe(phaseSet2.id)

            // At least some phases should be different
            const differentPhases = phaseSet1.phases.some((phase, index) =>
                phase.description !== phaseSet2.phases[index].description
            )
            expect(differentPhases).toBe(true)
        })

        it('should use provided ID and set name to "Shared Phase Set"', () => {
            const id = 'custom-id-123'
            const phaseSet = generatePhaseSetFromId(id)

            expect(phaseSet.id).toBe(id)
            expect(phaseSet.name).toBe('Shared Phase Set')
        })

        it('should restore Math.random after seeded generation', () => {
            const originalRandom = Math.random
            const firstCall = Math.random()

            generatePhaseSetFromId('test-restore')

            const secondCall = Math.random()
            expect(Math.random).toBe(originalRandom)
            expect(firstCall).not.toBe(secondCall) // Should be different random values
        })
    })

    describe('parsePhaseSetFromUrl', () => {
        beforeEach(() => {
            // Mock window.location
            vi.stubGlobal('window', {
                location: {
                    search: ''
                }
            })
        })

        it('should return null when no URL parameters', () => {
            window.location.search = ''
            const result = parsePhaseSetFromUrl()
            expect(result).toBeNull()
        })

        it('should return null when set parameter is missing', () => {
            window.location.search = '?other=value'
            const result = parsePhaseSetFromUrl()
            expect(result).toBeNull()
        })

        it('should return null when set parameter format is invalid', () => {
            window.location.search = '?set=invalid-format'
            const result = parsePhaseSetFromUrl()
            expect(result).toBeNull()
        })

        it('should return set ID when format is valid', () => {
            const validId = '1m5j9k8l-abc123'
            window.location.search = `?set=${validId}`
            const result = parsePhaseSetFromUrl()
            expect(result).toBe(validId)
        })

        it('should validate set ID format correctly', () => {
            const testCases = [
                { id: '1m5j9k8l-abc123', valid: true },
                { id: 'abcd1234-def567', valid: true },
                { id: 'short-abc123', valid: true },
                { id: 'toolong12345678-abc123', valid: false },
                { id: '1m5j9k8l-short', valid: false },
                { id: '1m5j9k8l-toolong123', valid: false },
                { id: 'no-dash', valid: false },
                { id: '1m5j9k8l-ABC123', valid: false }, // uppercase
                { id: '1m5j9k8l-12ab34', valid: true },
            ]

            testCases.forEach(({ id, valid }) => {
                window.location.search = `?set=${id}`
                const result = parsePhaseSetFromUrl()
                if (valid) {
                    expect(result).toBe(id)
                } else {
                    expect(result).toBeNull()
                }
            })
        })

        it('should return null when window is undefined (SSR)', () => {
            vi.stubGlobal('window', undefined)
            const result = parsePhaseSetFromUrl()
            expect(result).toBeNull()
        })
    })

    describe('generateShareableUrl', () => {
        beforeEach(() => {
            vi.stubGlobal('window', {
                location: {
                    href: 'https://example.com/path'
                }
            })
        })

        it('should generate URL with set parameter', () => {
            const phaseSetId = 'test123-abc456'
            const url = generateShareableUrl(phaseSetId)

            expect(url).toContain('set=test123-abc456')
            expect(url).toContain('https://example.com')
        })

        it('should preserve existing URL structure', () => {
            window.location.href = 'https://example.com/phase-maker?other=value'
            const phaseSetId = 'test123-abc456'
            const url = generateShareableUrl(phaseSetId)

            expect(url).toContain('https://example.com/phase-maker')
            expect(url).toContain('set=test123-abc456')
        })

        it('should return empty string when window is undefined', () => {
            vi.stubGlobal('window', undefined)
            const result = generateShareableUrl('test-id')
            expect(result).toBe('')
        })

        it('should handle special characters in ID', () => {
            const phaseSetId = 'test123-abc456'
            const url = generateShareableUrl(phaseSetId)

            const urlObj = new URL(url)
            expect(urlObj.searchParams.get('set')).toBe(phaseSetId)
        })
    })

    describe('Phase Content Validation', () => {
        it('should generate valid phase types for different phase numbers', () => {
            const phaseSet = generatePhaseSet()

            // Early phases (1-3) should have simpler requirements
            const earlyPhases = phaseSet.phases.slice(0, 3)
            earlyPhases.forEach(phase => {
                // Should not contain the most complex phase types
                expect(phase.description).not.toContain('color run')
                expect(phase.description).not.toContain('even or odd cards of one color')
            })
        })

        it('should not generate duplicate identical phases', () => {
            const phaseSet = generatePhaseSet()
            const descriptions = phaseSet.phases.map(p => p.description)
            const uniqueDescriptions = new Set(descriptions)

            // All phases in a set should be unique
            expect(uniqueDescriptions.size).toBe(descriptions.length)
        })

        it('should enforce strict uniqueness across multiple generations', () => {
            // Test multiple phase sets to ensure duplicates are consistently prevented
            for (let i = 0; i < 10; i++) {
                const phaseSet = generatePhaseSet()
                const phases = phaseSet.phases

                // Check that no two phases are identical within the set
                for (let j = 0; j < phases.length; j++) {
                    for (let k = j + 1; k < phases.length; k++) {
                        const phase1 = phases[j]
                        const phase2 = phases[k]
                        const isIdentical = phase1.description === phase2.description &&
                            phase1.cardCount === phase2.cardCount
                        expect(isIdentical).toBe(false)
                    }
                }

                // Also check that we have 10 unique descriptions
                const descriptions = phases.map(p => p.description)
                const uniqueDescriptions = new Set(descriptions)
                expect(uniqueDescriptions.size).toBe(10)
            }
        })

        it('should generate phases with consistent difficulty for same requirements', () => {
            // Generate multiple phase sets and check consistency
            const phaseSets = Array.from({ length: 10 }, () => generatePhaseSet())
            const phasesByDescription = new Map<string, number[]>()

            phaseSets.forEach(set => {
                set.phases.forEach(phase => {
                    if (!phasesByDescription.has(phase.description)) {
                        phasesByDescription.set(phase.description, [])
                    }
                    phasesByDescription.get(phase.description)!.push(phase.difficulty)
                })
            })

            // Check that identical descriptions have consistent difficulties
            phasesByDescription.forEach((difficulties) => {
                if (difficulties.length > 1) {
                    const uniqueDifficulties = new Set(difficulties)
                    // Should have identical difficulty for identical requirements
                    expect(uniqueDifficulties.size).toBe(1)
                }
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle minimum card count scenarios', () => {
            // Generate many phase sets to test edge cases
            for (let i = 0; i < 20; i++) {
                const phaseSet = generatePhaseSet()
                phaseSet.phases.forEach(phase => {
                    expect(phase.cardCount).toBeGreaterThanOrEqual(6)
                })
            }
        })

        it('should handle maximum card count scenarios', () => {
            for (let i = 0; i < 20; i++) {
                const phaseSet = generatePhaseSet()
                phaseSet.phases.forEach(phase => {
                    expect(phase.cardCount).toBeLessThanOrEqual(9)
                })
            }
        })

        it('should generate valid phase descriptions', () => {
            const phaseSet = generatePhaseSet()
            const validDescriptionPatterns = [
                /^\d+ set of \d+$/,
                /^\d+ sets of \d+$/,
                /^\d+ run of \d+$/,
                /^\d+ runs of \d+$/,
                /^\d+ cards of one color$/,
                /^\d+ even or odd cards$/,
                /^\d+ color run of \d+$/,
                /^\d+ color runs of \d+$/,
                /^\d+ even or odd cards of one color$/,
                /.*\+.*/ // Combined phases with +
            ]

            phaseSet.phases.forEach(phase => {
                const matchesPattern = validDescriptionPatterns.some(pattern =>
                    pattern.test(phase.description)
                )
                expect(matchesPattern).toBe(true)
            })
        })
    })
})
