# Development Rules and Guidelines

## Testing Guidelines

### **RULE: Always use unit tests instead of separate test files**
- When adding new functionality or testing behavior, always add tests to the existing unit test suite
- Do NOT create separate individual test files (like `test-reroll-states.js`, `debug-test.js`, `quick-id-test.js`, etc.)
- **NEVER** create standalone test scripts even for "quick verification" - use the unit test suite instead
- This ensures tests are:
  - Reusable and maintainable
  - Run as part of the CI/CD pipeline
  - Discoverable by other developers
  - Following the established testing patterns

**Note**: This rule was violated during development and had to be corrected - always check yourself before creating any `.js` test files.

### Test File Locations
- Unit tests: `src/__tests__/`
- Component tests should be added to existing test files or follow the naming pattern: `[componentName].test.ts`

### Example
❌ **Don't do this:**
```bash
# Creating standalone test files
touch debug-test.js
touch test-reroll-states.js  
```

✅ **Do this instead:**
```typescript
// Add to src/__tests__/phaseGenerator.test.ts or create src/__tests__/PhaseGenerator.test.ts
describe('PhaseGenerator Component', () => {
  describe('Reroll Button States', () => {
    // Add comprehensive tests here
  });
});
```

## Other Development Guidelines
- Always check existing file structure before creating new files
- Prefer extending existing functionality over creating duplicates
- Follow established naming conventions and patterns
