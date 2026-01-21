// tests/integration/auth.api.test.js
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Organization } from '../../src/models/Organization.js';
import bcrypt from 'bcryptjs';

describe('Auth API Integration Tests', () => {
    describe('POST /api/auth/register', () => {
        it('should register new user and organization', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    clinicName: 'Test Clinic',
                    email: 'test@example.com',
                    password: 'Test123!',
                    confirm: 'Test123!',
                })
                .expect(201);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('org');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.role).toBe('owner');

            // Verify cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies.some(c => c.includes('access_token'))).toBe(true);
            expect(cookies.some(c => c.includes('refresh_token'))).toBe(true);
        });

        it('should return 409 for duplicate email', async () => {
            // Create existing user
            const org = await Organization.create({ name: 'Existing Org', code: '150001' });
            const passwordHash = await bcrypt.hash('password123', 10);
            await User.create({
                name: 'Existing User',
                email: 'existing@example.com',
                orgId: org._id,
                passwordHash,
                role: 'admin',
            });

            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New User',
                    clinicName: 'New Clinic',
                    email: 'existing@example.com',
                    password: 'Test123!',
                    confirm: 'Test123!',
                })
                .expect(409);
        });

        it('should return 400 for password mismatch', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    clinicName: 'Test Clinic',
                    email: 'test@example.com',
                    password: 'Test123!',
                    confirm: 'Different123!',
                })
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser;
        let testOrg;

        beforeEach(async () => {
            testOrg = await Organization.create({ name: 'Test Org', code: '150001' });
            const passwordHash = await bcrypt.hash('password123', 10);
            testUser = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                orgId: testOrg._id,
                passwordHash,
                role: 'admin',
                isActive: true,
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('should return 401 for invalid password', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                })
                .expect(401);
        });

        it('should return 401 for non-existent user', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
                .expect(401);
        });

        it('should return 403 for inactive user', async () => {
            await User.findByIdAndUpdate(testUser._id, { isActive: false });

            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                })
                .expect(403);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user info with valid token', async () => {
            // Register first
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    clinicName: 'Test Clinic',
                    email: 'test@example.com',
                    password: 'Test123!',
                    confirm: 'Test123!',
                });

            const token = registerResponse.body.accessToken;

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('should return 401 without token', async () => {
            await request(app)
                .get('/api/auth/me')
                .expect(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout and clear cookies', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            expect(response.body).toEqual({ ok: true });
        });
    });
});
