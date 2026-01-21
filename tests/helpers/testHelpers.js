// tests/helpers/testHelpers.js
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

/**
 * Generate a valid JWT token for testing
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
export function generateToken(payload = {}) {
    const defaultPayload = {
        userId: '507f1f77bcf86cd799439011',
        orgId: '507f1f77bcf86cd799439012',
        role: 'admin',
        ...payload,
    };

    return jwt.sign(defaultPayload, env.jwtAccessSecret, {
        expiresIn: '1h',
    });
}

/**
 * Create a mock request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request
 */
export function mockRequest(options = {}) {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        user: null,
        org: null,
        ...options,
    };
}

/**
 * Create a mock response object
 * @returns {Object} Mock response
 */
export function mockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
}

/**
 * Create a mock next function
 * @returns {Function} Mock next
 */
export function mockNext() {
    return jest.fn();
}

/**
 * Create test user data
 * @param {Object} overrides - Override default values
 * @returns {Object} User data
 */
export function createTestUser(overrides = {}) {
    return {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        orgId: '507f1f77bcf86cd799439012',
        ...overrides,
    };
}

/**
 * Create test patient data
 * @param {Object} overrides - Override default values
 * @returns {Object} Patient data
 */
export function createTestPatient(overrides = {}) {
    return {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+998901234567',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        orgId: '507f1f77bcf86cd799439012',
        ...overrides,
    };
}

/**
 * Create test appointment data
 * @param {Object} overrides - Override default values
 * @returns {Object} Appointment data
 */
export function createTestAppointment(overrides = {}) {
    return {
        patientId: '507f1f77bcf86cd799439013',
        doctorId: '507f1f77bcf86cd799439014',
        serviceId: '507f1f77bcf86cd799439015',
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        status: 'scheduled',
        orgId: '507f1f77bcf86cd799439012',
        ...overrides,
    };
}

/**
 * Wait for a specified time (for async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
