// tests/unit/auth.controller.test.js
import bcrypt from 'bcryptjs';
import { User } from '../../src/models/User.js';
import { Organization } from '../../src/models/Organization.js';
import { login, registerSelf, me, logout } from '../../src/controllers/auth.controller.js';
import { mockRequest, mockResponse, mockNext } from '../helpers/testHelpers.js';
import { signAccess } from '../../src/utils/jwt.js';

describe('Auth Controller', () => {
    describe('registerSelf', () => {
        it('should register a new user and organization', async () => {
            const req = mockRequest({
                body: {
                    name: 'Test User',
                    clinicName: 'Test Clinic',
                    email: 'test@example.com',
                    password: 'Test123!',
                    confirm: 'Test123!',
                },
            });
            const res = mockResponse();

            await registerSelf(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();

            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('accessToken');
            expect(response).toHaveProperty('refreshToken');
            expect(response).toHaveProperty('user');
            expect(response).toHaveProperty('org');
            expect(response.user.email).toBe('test@example.com');
        });

        it('should return 409 if email already exists', async () => {
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

            const req = mockRequest({
                body: {
                    name: 'New User',
                    clinicName: 'New Clinic',
                    email: 'existing@example.com',
                    password: 'Test123!',
                    confirm: 'Test123!',
                },
            });
            const res = mockResponse();

            await registerSelf(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
        });

        it('should return 400 for invalid input', async () => {
            const req = mockRequest({
                body: {
                    name: 'Test',
                    // Missing required fields
                },
            });
            const res = mockResponse();

            await registerSelf(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('login', () => {
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
            const req = mockRequest({
                body: {
                    email: 'test@example.com',
                    password: 'password123',
                },
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('accessToken');
            expect(response).toHaveProperty('user');
            expect(response.user.email).toBe('test@example.com');
        });

        it('should return 401 for invalid password', async () => {
            const req = mockRequest({
                body: {
                    email: 'test@example.com',
                    password: 'wrongpassword',
                },
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should return 401 for non-existent user', async () => {
            const req = mockRequest({
                body: {
                    email: 'nonexistent@example.com',
                    password: 'password123',
                },
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 403 for inactive user', async () => {
            await User.findByIdAndUpdate(testUser._id, { isActive: false });

            const req = mockRequest({
                body: {
                    email: 'test@example.com',
                    password: 'password123',
                },
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'User is inactive' });
        });
    });

    describe('me', () => {
        it('should return user info with valid token', async () => {
            const org = await Organization.create({ name: 'Test Org', code: '150001' });
            const user = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                orgId: org._id,
                passwordHash: 'hash',
                role: 'admin',
            });

            const token = signAccess({
                uid: String(user._id),
                role: user.role,
                email: user.email,
                orgId: String(org._id),
            });

            const req = mockRequest({
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });
            const res = mockResponse();

            await me(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('user');
            expect(response.user.email).toBe('test@example.com');
        });

        it('should return 401 for missing token', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await me(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('logout', () => {
        it('should clear cookies and return success', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await logout(req, res);

            expect(res.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
            expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
            expect(res.json).toHaveBeenCalledWith({ ok: true });
        });
    });
});
