// src/controllers/departments.controller.js
import mongoose from "mongoose";
import { Department } from "../models/Department.js";
import { Doctor } from "../models/Doctor.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/** GET /api/departments - List all departments */
export async function listDepartments(req, res) {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const { q = "", active = "" } = req.query;

    const filters = { orgId: req.orgId, isDeleted: { $ne: true } };

    if (q && q.trim()) {
        const s = q.trim();
        filters.$or = [
            { name: { $regex: s, $options: "i" } },
            { code: { $regex: s, $options: "i" } },
            { description: { $regex: s, $options: "i" } }
        ];
    }

    if (active === "true") filters.isActive = true;
    if (active === "false") filters.isActive = false;

    const [items, total] = await Promise.all([
        Department.find(filters)
            .populate('headDoctorId', 'firstName lastName spec')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Department.countDocuments(filters)
    ]);

    res.json({ items, total, page, limit });
}

/** POST /api/departments - Create department */
export async function createDepartment(req, res) {
    const {
        name,
        code = "",
        description = "",
        headDoctorId,
        floor = "",
        building = "",
        roomNumbers = [],
        phone = "",
        email = "",
        color = "#3b82f6",
        icon = "",
        note = ""
    } = req.body || {};

    if (!name || !name.trim()) {
        return res.status(400).json({ message: "Department name is required" });
    }

    // Check if code already exists
    if (code && code.trim()) {
        const existing = await Department.findOne({
            orgId: req.orgId,
            code: code.trim().toUpperCase(),
            isDeleted: { $ne: true }
        });
        if (existing) {
            return res.status(400).json({ message: "Department code already exists" });
        }
    }

    const dept = await Department.create({
        orgId: req.orgId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        headDoctorId: headDoctorId && okId(headDoctorId) ? OID(headDoctorId) : null,
        floor: floor.trim(),
        building: building.trim(),
        roomNumbers: Array.isArray(roomNumbers) ? roomNumbers : [],
        phone: phone.trim(),
        email: email.trim(),
        color: color.trim(),
        icon: icon.trim(),
        note: note.trim(),
        isActive: true
    });

    res.status(201).json(dept);
}

/** GET /api/departments/:id - Get department */
export async function getDepartment(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

    const dept = await Department.findOne({
        _id: OID(id),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    })
        .populate('headDoctorId', 'firstName lastName spec phone email')
        .lean();

    if (!dept) return res.status(404).json({ message: "Department not found" });

    // Get doctors count
    const doctorCount = await Doctor.countDocuments({
        orgId: req.orgId,
        departmentId: OID(id),
        isDeleted: { $ne: true }
    });

    res.json({ ...dept, doctorCount });
}

/** PUT /api/departments/:id - Update department */
export async function updateDepartment(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

    const payload = {};
    const fields = ["name", "code", "description", "floor", "building", "phone", "email", "color", "icon", "note"];

    fields.forEach(k => {
        if (typeof req.body?.[k] === "string") {
            payload[k] = k === "code" ? req.body[k].trim().toUpperCase() : req.body[k].trim();
        }
    });

    if (req.body?.roomNumbers !== undefined && Array.isArray(req.body.roomNumbers)) {
        payload.roomNumbers = req.body.roomNumbers;
    }

    if (req.body?.headDoctorId !== undefined) {
        payload.headDoctorId = req.body.headDoctorId && okId(req.body.headDoctorId)
            ? OID(req.body.headDoctorId)
            : null;
    }

    if (req.body?.isActive !== undefined) {
        payload.isActive = !!req.body.isActive;
    }

    // Check code uniqueness if changing
    if (payload.code) {
        const existing = await Department.findOne({
            orgId: req.orgId,
            code: payload.code,
            _id: { $ne: OID(id) },
            isDeleted: { $ne: true }
        });
        if (existing) {
            return res.status(400).json({ message: "Department code already exists" });
        }
    }

    const updated = await Department.findOneAndUpdate(
        { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
        { $set: payload },
        { new: true, lean: true }
    );

    if (!updated) return res.status(404).json({ message: "Department not found" });

    res.json(updated);
}

/** DELETE /api/departments/:id - Soft delete department */
export async function deleteDepartment(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

    // Check if department has doctors
    const doctorCount = await Doctor.countDocuments({
        orgId: req.orgId,
        departmentId: OID(id),
        isDeleted: { $ne: true }
    });

    if (doctorCount > 0) {
        return res.status(400).json({
            message: `Cannot delete department with ${doctorCount} active doctor(s)`
        });
    }

    const updated = await Department.findOneAndUpdate(
        { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, isActive: false } },
        { new: true, lean: true }
    );

    if (!updated) return res.status(404).json({ message: "Department not found" });

    res.json({ ok: true });
}

/** GET /api/departments/:id/doctors - Get department's doctors */
export async function getDepartmentDoctors(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

    const doctors = await Doctor.find({
        orgId: req.orgId,
        departmentId: OID(id),
        isDeleted: { $ne: true }
    })
        .select('firstName lastName spec phone email avatar rating currentStatus isActive')
        .sort({ lastName: 1, firstName: 1 })
        .lean();

    res.json({ items: doctors });
}
