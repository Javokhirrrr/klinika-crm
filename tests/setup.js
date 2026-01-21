// tests/setup.js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
    // Disconnect and stop MongoDB
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Clear all collections after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Suppress console errors during tests (optional)
global.console = {
    ...console,
    error: jest.fn(), // Mock console.error
    warn: jest.fn(),  // Mock console.warn
};
