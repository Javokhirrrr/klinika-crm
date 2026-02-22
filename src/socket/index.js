// src/socket/index.js
import { Server } from 'socket.io';

let io = null;

// ─── Ruxsat etilgan originlar ─────────────────────────────────────────────────
function getAllowedOrigins() {
    const fromEnv = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
        .split(',').map(s => s.trim()).filter(Boolean);

    const defaults = [
        // Local development
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        // Production
        'https://zyra.uz',
        'https://www.zyra.uz',
        'https://app.zyra.uz',
    ];

    return [...new Set([...defaults, ...fromEnv])];
}

/**
 * Originni tekshirish (vercel.app, railway.app ham ruxsat)
 */
function isOriginAllowed(origin) {
    if (!origin) return true; // server-to-server yoki postman
    const allowed = getAllowedOrigins();
    if (allowed.includes('*') || allowed.includes(origin)) return true;
    if (origin.endsWith('.vercel.app')) return true;
    if (origin.endsWith('.railway.app')) return true;
    if (origin.endsWith('.zyra.uz')) return true;
    return false;
}

/**
 * Socket.IO serverni ishga tushirish
 */
export function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (isOriginAllowed(origin)) {
                    callback(null, true);
                } else {
                    console.warn('⚠️ Socket.IO CORS rejected:', origin);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST'],
        },
        // WebSocket + polling fallback
        transports: ['websocket', 'polling'],
        // Ping/pong sozlamalari
        pingTimeout: 60000,
        pingInterval: 25000,
        // Katta ma'lumotlar uchun
        maxHttpBufferSize: 1e6,
    });

    io.on('connection', (socket) => {
        const origin = socket.handshake.headers.origin || 'unknown';
        console.log(`✅ Socket connected: ${socket.id} | origin: ${origin}`);

        // Foydalanuvchi orgId bo'yicha xonaga qo'shiladi
        socket.on('join:org', (orgId) => {
            if (orgId) {
                socket.join(`org:${orgId}`);
                console.log(`📌 Socket ${socket.id} joined org room: ${orgId}`);
            }
        });

        // Shifokor xonasiga qo'shilish
        socket.on('join:doctor', (doctorId) => {
            if (doctorId) {
                socket.join(`doctor:${doctorId}`);
                console.log(`📌 Socket ${socket.id} joined doctor room: ${doctorId}`);
            }
        });

        // Navbat tablo (display screen)
        socket.on('join:display', (orgId) => {
            if (orgId) {
                socket.join(`display:${orgId}`);
                console.log(`📺 Display screen joined: org ${orgId}`);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`❌ Socket disconnected: ${socket.id} | reason: ${reason}`);
        });

        socket.on('error', (err) => {
            console.error(`🔴 Socket error [${socket.id}]:`, err.message);
        });
    });

    console.log('🚀 Socket.IO initialized');
    return io;
}

/**
 * Socket.IO instance'ni qaytarish
 */
export function getIO() {
    if (!io) {
        console.warn('⚠️ Socket.IO not initialized yet');
        return null;
    }
    return io;
}

// ─── NAVBAT VOQEALARI ─────────────────────────────────────────────────────────

/**
 * Navbat yangilandi (barcha foydalanuvchilar + display)
 */
export function emitQueueUpdate(orgId, data) {
    if (!io) return;
    const payload = { orgId, ...data, timestamp: new Date().toISOString() };
    io.to(`org:${orgId}`).emit('queue:updated', payload);
    io.to(`display:${orgId}`).emit('queue:updated', payload);
    console.log('📡 queue:updated emitted for org:', orgId);
}

/**
 * Bemor chaqirildi (navbat tablo uchun)
 */
export function emitPatientCalled(orgId, queueEntry) {
    if (!io) return;

    const patient = queueEntry.patientId;
    const doctor = queueEntry.doctorId;

    const payload = {
        queueNumber: queueEntry.queueNumber,
        patientName: patient
            ? `${patient.firstName} ${patient.lastName || ''}`.trim()
            : 'Bemor',
        initials: patient
            ? `${patient.firstName?.charAt(0)?.toUpperCase() || ''}.${patient.lastName?.charAt(0)?.toUpperCase() || ''}.`
            : 'B.',
        doctorName: doctor
            ? `${doctor.firstName} ${doctor.lastName || ''}`.trim()
            : 'Shifokor',
        doctorId: queueEntry.doctorId?._id || queueEntry.doctorId,
        roomNumber: doctor?.room || doctor?.roomNumber || '—',
        calledAt: new Date().toISOString(),
    };

    // Org odatdagi foydalanuvchilarga
    io.to(`org:${orgId}`).emit('queue:patient-called', payload);
    // Display (tablo) ekraniga
    io.to(`display:${orgId}`).emit('queue:patient-called', payload);

    console.log('📡 queue:patient-called emitted:', queueEntry.queueNumber);
}

/**
 * Yangi bemor navbatga qo'shildi
 */
export function emitNewPatient(orgId, queueEntry) {
    if (!io) return;
    const payload = { orgId, queueEntry, timestamp: new Date().toISOString() };
    io.to(`org:${orgId}`).emit('queue:new-patient', payload);
    io.to(`display:${orgId}`).emit('queue:new-patient', payload);
    console.log('📡 queue:new-patient emitted:', queueEntry.queueNumber);
}

/**
 * Navbat holati o'zgartirildi (masalan: cancelled, completed)
 */
export function emitQueueStatusChange(orgId, queueEntry) {
    if (!io) return;
    const payload = {
        orgId,
        queueEntryId: queueEntry._id,
        queueNumber: queueEntry.queueNumber,
        status: queueEntry.status,
        timestamp: new Date().toISOString(),
    };
    io.to(`org:${orgId}`).emit('queue:status-changed', payload);
    io.to(`display:${orgId}`).emit('queue:status-changed', payload);
    console.log('📡 queue:status-changed emitted:', queueEntry.status);
}

// ─── REAL-TIME YANGILASHLAR ───────────────────────────────────────────────────

/**
 * Yangi qabul yaratildi
 */
export function emitNewAppointment(orgId, appointment) {
    if (!io) return;
    io.to(`org:${orgId}`).emit('appointment:created', {
        orgId, appointment, timestamp: new Date().toISOString()
    });
}

/**
 * To'lov amalga oshirildi
 */
export function emitPaymentDone(orgId, payment) {
    if (!io) return;
    io.to(`org:${orgId}`).emit('payment:done', {
        orgId, payment, timestamp: new Date().toISOString()
    });
}

/**
 * Dashboard statistikasini yangilash signali
 */
export function emitDashboardRefresh(orgId) {
    if (!io) return;
    io.to(`org:${orgId}`).emit('dashboard:refresh', {
        orgId, timestamp: new Date().toISOString()
    });
}
