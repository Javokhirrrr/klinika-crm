// tests/unit/patients.controller.test.js
import { Patient } from '../../src/models/Patient.js';
import { Organization } from '../../src/models/Organization.js';
import {
    listPatients,
    createPatient,
    getPatient,
    updatePatient,
    deletePatient,
} from '../../src/controllers/patients.controller.js';
import { mockRequest, mockResponse } from '../helpers/testHelpers.js';

describe('Patients Controller', () => {
    let testOrg;

    beforeEach(async () => {
        testOrg = await Organization.create({ name: 'Test Clinic', code: '150001' });
    });

    describe('createPatient', () => {
        it('should create a new patient', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                body: {
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '+998901234567',
                    gender: 'male',
                    dob: new Date('1990-01-01'),
                },
            });
            const res = mockResponse();

            await createPatient(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();

            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('patient');
            expect(response.patient.firstName).toBe('John');
            expect(response.patient.lastName).toBe('Doe');
        });

        it('should auto-generate cardNo if not provided', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                body: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                },
            });
            const res = mockResponse();

            await createPatient(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const response = res.json.mock.calls[0][0];
            expect(response.patient.cardNo).toBeTruthy();
            expect(response.patient.cardNo).toMatch(/^C\d{8}$/);
        });

        it('should return 409 for duplicate phone', async () => {
            await Patient.create({
                orgId: testOrg._id,
                firstName: 'Existing',
                lastName: 'Patient',
                phone: '+998901234567',
            });

            const req = mockRequest({
                orgId: testOrg._id,
                body: {
                    firstName: 'New',
                    lastName: 'Patient',
                    phone: '+998901234567',
                },
            });
            const res = mockResponse();

            await createPatient(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('should split fullName into firstName and lastName', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                body: {
                    fullName: 'John Michael Doe',
                },
            });
            const res = mockResponse();

            await createPatient(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const response = res.json.mock.calls[0][0];
            expect(response.patient.firstName).toBe('John');
            expect(response.patient.lastName).toBe('Michael Doe');
        });
    });

    describe('listPatients', () => {
        beforeEach(async () => {
            await Patient.create([
                {
                    orgId: testOrg._id,
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '+998901111111',
                    gender: 'male',
                },
                {
                    orgId: testOrg._id,
                    firstName: 'Jane',
                    lastName: 'Smith',
                    phone: '+998902222222',
                    gender: 'female',
                },
                {
                    orgId: testOrg._id,
                    firstName: 'Bob',
                    lastName: 'Johnson',
                    phone: '+998903333333',
                    gender: 'male',
                },
            ]);
        });

        it('should list all patients for organization', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                query: {},
            });
            const res = mockResponse();

            await listPatients(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.items).toHaveLength(3);
            expect(response.total).toBe(3);
        });

        it('should filter by search query', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                query: { q: 'John' },
            });
            const res = mockResponse();

            await listPatients(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.items.length).toBeGreaterThan(0);
            expect(response.items[0].firstName).toMatch(/John/i);
        });

        it('should filter by gender', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                query: { gender: 'female' },
            });
            const res = mockResponse();

            await listPatients(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.items).toHaveLength(1);
            expect(response.items[0].gender).toBe('female');
        });

        it('should paginate results', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                query: { page: 1, limit: 2 },
            });
            const res = mockResponse();

            await listPatients(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.items).toHaveLength(2);
            expect(response.page).toBe(1);
            expect(response.limit).toBe(2);
        });
    });

    describe('getPatient', () => {
        it('should get patient by id', async () => {
            const patient = await Patient.create({
                orgId: testOrg._id,
                firstName: 'Test',
                lastName: 'Patient',
            });

            const req = mockRequest({
                orgId: testOrg._id,
                params: { id: patient._id.toString() },
            });
            const res = mockResponse();

            await getPatient(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.patient.firstName).toBe('Test');
        });

        it('should return 404 for non-existent patient', async () => {
            const req = mockRequest({
                orgId: testOrg._id,
                params: { id: '507f1f77bcf86cd799439011' },
            });
            const res = mockResponse();

            await getPatient(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updatePatient', () => {
        it('should update patient', async () => {
            const patient = await Patient.create({
                orgId: testOrg._id,
                firstName: 'Old',
                lastName: 'Name',
            });

            const req = mockRequest({
                orgId: testOrg._id,
                params: { id: patient._id.toString() },
                body: {
                    firstName: 'New',
                    lastName: 'Name',
                },
            });
            const res = mockResponse();

            await updatePatient(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.patient.firstName).toBe('New');
        });
    });

    describe('deletePatient', () => {
        it('should soft delete patient', async () => {
            const patient = await Patient.create({
                orgId: testOrg._id,
                firstName: 'To',
                lastName: 'Delete',
            });

            const req = mockRequest({
                orgId: testOrg._id,
                params: { id: patient._id.toString() },
            });
            const res = mockResponse();

            await deletePatient(req, res);

            expect(res.json).toHaveBeenCalledWith({ ok: true });

            // Verify soft delete
            const deleted = await Patient.findById(patient._id);
            expect(deleted.isDeleted).toBe(true);
        });
    });
});
