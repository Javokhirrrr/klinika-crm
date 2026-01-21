// src/socket/index.js
import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('✅ Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
        });
    });

    return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

/**
 * Emit queue update event
 */
export function emitQueueUpdate(orgId, data) {
    if (io) {
        io.emit('queue:updated', { orgId, ...data });
        console.log('📡 Queue updated event emitted for org:', orgId);
    }
}

/**
 * Emit patient called event
 */
export function emitPatientCalled(orgId, queueEntry) {
    if (io) {
        const patient = queueEntry.patientId;
        const doctor = queueEntry.doctorId;

        // Send to specific org room
        io.to(`org:${orgId}`).emit('queue:patient-called', {
            queueNumber: queueEntry.queueNumber,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Bemor',
            initials: patient ? `${patient.firstName.charAt(0)}. ${patient.lastName.charAt(0)}.` : 'B.',
            doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Shifokor',
            doctorId: queueEntry.doctorId._id || queueEntry.doctorId,
            roomNumber: doctor?.roomNumber || '205'
        });

        console.log('📡 Patient called event emitted:', queueEntry.queueNumber);
    }
}

/**
 * Emit new patient joined event
 */
export function emitNewPatient(orgId, queueEntry) {
    if (io) {
        io.emit('queue:new-patient', { orgId, queueEntry });
        console.log('📡 New patient event emitted:', queueEntry.queueNumber);
    }
}
