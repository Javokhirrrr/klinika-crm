// Test utilities for React components
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

/**
 * Custom render function with providers
 */
export function renderWithProviders(ui, options = {}) {
    const {
        initialAuthState = { user: null, loading: false },
        ...renderOptions
    } = options;

    function Wrapper({ children }) {
        return (
            <BrowserRouter>
                <AuthProvider initialState={initialAuthState}>
                    {children}
                </AuthProvider>
            </BrowserRouter>
        );
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create mock user for testing
 */
export function createMockUser(overrides = {}) {
    return {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        orgId: '456',
        ...overrides,
    };
}

/**
 * Create mock patient for testing
 */
export function createMockPatient(overrides = {}) {
    return {
        _id: '789',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+998901234567',
        gender: 'male',
        cardNo: 'C12345678',
        ...overrides,
    };
}

/**
 * Wait for async operations
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
