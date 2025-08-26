import { beforeAll, afterEach, afterAll } from 'vitest'

// Extend DOM environment
beforeAll(() => {
    // Global test setup if needed
})

// Cleanup after each test
afterEach(() => {
    // Cleanup DOM if needed
})

// Cleanup after all tests
afterAll(() => {
    // Global test cleanup if needed
})

// Mock localStorage and sessionStorage if needed
const localStorageMock = {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => { },
    removeItem: (_key: string) => { },
    clear: () => { },
    length: 0,
    key: (_index: number) => null,
}

if (typeof global.localStorage === 'undefined') {
    global.localStorage = localStorageMock
}

if (typeof global.sessionStorage === 'undefined') {
    global.sessionStorage = localStorageMock
}
