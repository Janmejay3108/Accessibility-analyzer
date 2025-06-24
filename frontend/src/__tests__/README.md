# Testing Suite Documentation

This directory contains comprehensive tests for the Accessibility Analyzer frontend application.

## Test Structure

### Unit Tests
- **Component Tests**: Located in `components/*/tests/` directories
  - `UrlInputForm.test.js` - Tests for the URL input form component
  - `AnalysisResults.test.js` - Tests for the analysis results display component

- **Context Tests**: Located in `contexts/__tests__/`
  - `AuthContext.test.js` - Tests for authentication context and state management

- **Service Tests**: Located in `services/*/tests/` directories
  - `analysisService.test.js` - Tests for API service methods and error handling

### Integration Tests
- **App Integration Tests**: Located in `__tests__/`
  - `App.integration.test.js` - End-to-end user workflow tests

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode (for automated testing)
```bash
npm run test:ci
```

### Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

## Test Coverage Goals

We aim for the following coverage targets:
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

## Testing Utilities

### Global Test Utilities
Available via `global.testUtils`:

```javascript
// Create mock user object
const mockUser = global.testUtils.createMockUser({
  email: 'custom@example.com'
});

// Create mock analysis data
const mockAnalysis = global.testUtils.createMockAnalysis({
  url: 'https://custom-site.com'
});

// Create mock analysis results
const mockResult = global.testUtils.createMockResult({
  complianceScore: 95
});
```

### Mocked Services
The following services are automatically mocked in tests:
- Firebase Authentication (`authService`)
- Analysis API (`analysisService`)
- React Router hooks

### Test Environment Setup
- **DOM Testing**: Uses `@testing-library/react` and `@testing-library/jest-dom`
- **User Interactions**: Uses `@testing-library/user-event`
- **Mocking**: Uses Jest mocks for external dependencies
- **Environment Variables**: Mocked for consistent test environment

## Writing New Tests

### Component Tests
```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  test('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### Service Tests
```javascript
import { yourService } from '../yourService';

jest.mock('axios');

describe('yourService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('makes correct API call', async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    const result = await yourService.someMethod();

    expect(axios.post).toHaveBeenCalledWith('/expected-endpoint', expectedData);
    expect(result).toEqual(mockResponse);
  });
});
```

### Integration Tests
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('Feature Integration', () => {
  test('complete user workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Test complete user workflow
    // ... test steps
  });
});
```

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain what is being tested
- Group related tests using `describe` blocks
- Use `test` or `it` for individual test cases

### 2. Test Structure
- **Arrange**: Set up test data and mocks
- **Act**: Perform the action being tested
- **Assert**: Verify the expected outcome

### 3. Mocking
- Mock external dependencies (APIs, Firebase, etc.)
- Use `jest.clearAllMocks()` in `beforeEach` to reset mocks
- Mock only what's necessary for the test

### 4. Async Testing
- Use `waitFor` for async operations
- Use `userEvent` for user interactions
- Handle promises properly with `async/await`

### 5. Accessibility Testing
- Test for proper ARIA labels and roles
- Verify keyboard navigation
- Check for semantic HTML structure

## Continuous Integration

Tests are configured to run in CI environments with:
- Coverage reporting
- Fail on coverage below thresholds
- Parallel test execution
- Proper exit codes for CI systems

## Debugging Tests

### Running Single Test File
```bash
npm test -- YourComponent.test.js
```

### Running Tests in Debug Mode
```bash
npm test -- --verbose
```

### Coverage for Specific Files
```bash
npm test -- --coverage --collectCoverageFrom="src/components/YourComponent.js"
```

## Common Issues and Solutions

### 1. Tests Timing Out
- Increase timeout for async operations
- Ensure all promises are properly awaited
- Check for infinite loops in components

### 2. Mock Issues
- Verify mocks are properly reset between tests
- Check mock implementation matches expected interface
- Ensure mocks are imported before the tested module

### 3. DOM Queries Failing
- Use `screen.debug()` to see current DOM state
- Check for proper test IDs and accessibility attributes
- Verify component is fully rendered before querying

### 4. React Router Issues
- Wrap components with `MemoryRouter` for testing
- Mock `useNavigate`, `useParams`, etc. when needed
- Test navigation behavior separately from component logic
