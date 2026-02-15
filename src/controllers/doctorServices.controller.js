// src/controllers/doctorServices.controller.js
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { Service } from "../models/Service.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/** GET /api/doctors/:id/services - Get doctor's services */
export async function getDoctorServices(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const doctor = await Doctor.findOne({
        _id: OID(id),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    })
        .populate('services.serviceId', 'name price category description')
        .lean();

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({ items: doctor.services || [] });
}

/** POST /api/doctors/:id/services - Add service to doctor */
export async function addServiceToDoctor(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const { serviceId, customPrice } = req.body;

    if (!serviceId || !okId(serviceId)) {
        return res.status(400).json({ message: "Invalid service id" });
    }

    // Verify service exists
    const service = await Service.findOne({
        _id: OID(serviceId),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    });

    if (!service) return res.status(404).json({ message: "Service not found" });

    const doctor = await Doctor.findOne({
        _id: OID(id),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Check if service already added
    const existingIndex = doctor.services.findIndex(
        s => s.serviceId && s.serviceId.toString() === serviceId
    );

    if (existingIndex >= 0) {
        // Update existing
        doctor.services[existingIndex].customPrice = customPrice || service.price;
        doctor.services[existingIndex].isActive = true;
    } else {
        // Add new
        doctor.services.push({
            serviceId: OID(serviceId),
            customPrice: customPrice || service.price,
            isActive: true,
            addedAt: new Date()
        });
    }

    await doctor.save();

    // Populate and return
    const updated = await Doctor.findById(doctor._id)
        .populate('services.serviceId', 'name price category description')
        .lean();

    res.json({ ok: true, services: updated.services });
}

/** DELETE /api/doctors/:id/services/:serviceId - Remove service from doctor */
export async function removeServiceFromDoctor(req, res) {
    const { id, serviceId } = req.params;

    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });
    if (!okId(serviceId)) return res.status(400).json({ message: "Invalid service id" });

    const doctor = await Doctor.findOne({
        _id: OID(id),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Remove service
    doctor.services = doctor.services.filter(
        s => s.serviceId && s.serviceId.toString() !== serviceId
    );

    await doctor.save();

    res.json({ ok: true });
}

/** PATCH /api/doctors/:id/services/:serviceId - Update service settings */
export async function updateDoctorService(req, res) {
    const { id, serviceId } = req.params;

    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });
    if (!okId(serviceId)) return res.status(400).json({ message: "Invalid service id" });

    const { customPrice, isActive } = req.body;

    const doctor = await Doctor.findOne({
        _id: OID(id),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const serviceIndex = doctor.services.findIndex(
        s => s.serviceId && s.serviceId.toString() === serviceId
    );

    if (serviceIndex < 0) {
        return res.status(404).json({ message: "Service not assigned to this doctor" });
    }

    // Update
    if (customPrice !== undefined) {
        doctor.services[serviceIndex].customPrice = Number(customPrice);
    }
    if (isActive !== undefined) {
        doctor.services[serviceIndex].isActive = !!isActive;
    }

    await doctor.save();

    // Populate and return
    const updated = await Doctor.findById(doctor._id)
        .populate('services.serviceId', 'name price category description')
        .lean();

    res.json({ ok: true, services: updated.services });
}

/** GET /api/services/:serviceId/doctors - Get all doctors providing a service */
export async function getDoctorsByService(req, res) {
    const { serviceId } = req.params;
    if (!okId(serviceId)) return res.status(400).json({ message: "Invalid service id" });

    const doctors = await Doctor.find({
        orgId: req.orgId,
        isDeleted: { $ne: true },
        isActive: true,
        'services.serviceId': OID(serviceId),
        'services.isActive': true
    })
        .select('firstName lastName spec services avatar rating currentStatus')
        .lean();

    // Filter and format
    const result = doctors.map(doc => {
        const service = doc.services.find(s => s.serviceId.toString() === serviceId);
        return {
            ...doc,
            servicePrice: service ? service.customPrice : null
        };
    });

    res.json({ items: result });
}
