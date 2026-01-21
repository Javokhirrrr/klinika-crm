import { QueueEntry } from '../models/QueueEntry.js';
import { Patient } from '../models/Patient.js';
import { StatusCodes } from 'http-status-codes';
import { emitQueueUpdate, emitPatientCalled, emitNewPatient } from '../socket/index.js';
import { sendQueueNotification } from '../services/telegram.service.js';

/**
 * Add patient to queue
 */
export const joinQueue = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentId, priority, notes } = req.body;

        // Check if patient already in queue
        const existing = await QueueEntry.findOne({
            orgId: req.user.orgId,
            patientId,
            status: { $in: ['waiting', 'called', 'in_service'] }
        });

        if (existing) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Bemor allaqachon navbatda'
            });
        }

        const queueEntry = await QueueEntry.create({
            orgId: req.user.orgId,
            patientId,
            doctorId,
            appointmentId,
            priority: priority || 'normal',
            notes
        });

        await queueEntry.populate([
            { path: 'patientId', select: 'firstName lastName phone telegramChatId' },
            { path: 'doctorId', select: 'firstName lastName spec' }
        ]);

        // Emit WebSocket event
        emitNewPatient(req.user.orgId, queueEntry);
        emitQueueUpdate(req.user.orgId, { action: 'patient_joined' });

        // Send Telegram notification
        if (queueEntry.patientId.telegramChatId) {
            const avgServiceTime = 20; // minutes
            const position = await QueueEntry.countDocuments({
                orgId: req.user.orgId,
                doctorId,
                status: 'waiting',
                joinedAt: { $lt: queueEntry.joinedAt }
            });

            const waitTime = position * avgServiceTime;
            const estimatedTime = new Date(Date.now() + waitTime * 60000)
                .toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

            await sendQueueNotification(req.user.orgId, queueEntry.patientId.telegramChatId, {
                type: 'added',
                queueNumber: queueEntry.queueNumber,
                doctorName: `${queueEntry.doctorId.firstName} ${queueEntry.doctorId.lastName}`,
                estimatedTime,
                waitTime
            });
        }

        res.status(StatusCodes.CREATED).json({
            message: 'Bemor navbatga qo\'shildi',
            queueEntry
        });
    } catch (error) {
        console.error('Join queue error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get current queue
 */
export const getCurrentQueue = async (req, res) => {
    try {
        const { doctorId, status } = req.query;

        const query = {
            orgId: req.user.orgId,
            status: status || { $in: ['waiting', 'called', 'in_service'] }
        };

        if (doctorId) query.doctorId = doctorId;

        const queue = await QueueEntry.find(query)
            .sort({ priority: -1, joinedAt: 1 })  // Emergency first, then by join time
            .populate([
                { path: 'patientId', select: 'firstName lastName phone' },
                { path: 'doctorId', select: 'firstName lastName spec' },
                { path: 'appointmentId', select: 'startAt endAt' }
            ]);

        // Calculate estimated wait times
        const avgServiceTime = 20; // minutes (can be made configurable)
        queue.forEach((entry, index) => {
            if (entry.status === 'waiting') {
                entry.estimatedWaitTime = index * avgServiceTime;
            }
        });

        res.json({ queue });
    } catch (error) {
        console.error('Get current queue error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get my position in queue (for patients)
 */
export const getMyPosition = async (req, res) => {
    try {
        const { patientId } = req.query;

        if (!patientId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Bemor ID kerak'
            });
        }

        const myEntry = await QueueEntry.findOne({
            orgId: req.user.orgId,
            patientId,
            status: { $in: ['waiting', 'called'] }
        }).populate('doctorId', 'firstName lastName spec');

        if (!myEntry) {
            return res.json({
                inQueue: false,
                message: 'Siz navbatda emassiz'
            });
        }

        // Count how many are ahead
        const ahead = await QueueEntry.countDocuments({
            orgId: req.user.orgId,
            status: 'waiting',
            joinedAt: { $lt: myEntry.joinedAt }
        });

        res.json({
            inQueue: true,
            position: ahead + 1,
            queueNumber: myEntry.queueNumber,
            status: myEntry.status,
            estimatedWaitTime: ahead * 20, // minutes
            doctor: myEntry.doctorId
        });
    } catch (error) {
        console.error('Get my position error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Call next patient
 */
export const callPatient = async (req, res) => {
    try {
        const { id } = req.params;

        const queueEntry = await QueueEntry.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: 'waiting'
        });

        if (!queueEntry) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Navbat topilmadi'
            });
        }

        queueEntry.status = 'called';
        queueEntry.calledAt = new Date();
        queueEntry.calledBy = req.user._id;

        await queueEntry.save();
        await queueEntry.populate([
            { path: 'patientId', select: 'firstName lastName phone telegramChatId' },
            { path: 'doctorId', select: 'firstName lastName spec roomNumber' }
        ]);

        // Emit WebSocket event
        emitPatientCalled(req.user.orgId, queueEntry);
        emitQueueUpdate(req.user.orgId, { action: 'patient_called' });

        // Send Telegram notification
        if (queueEntry.patientId.telegramChatId) {
            await sendQueueNotification(req.user.orgId, queueEntry.patientId.telegramChatId, {
                type: 'called',
                queueNumber: queueEntry.queueNumber,
                doctorName: `${queueEntry.doctorId.firstName} ${queueEntry.doctorId.lastName}`,
                roomNumber: queueEntry.doctorId.roomNumber || '205'
            });
        }

        res.json({
            message: 'Bemor chaqirildi',
            queueEntry
        });
    } catch (error) {
        console.error('Call patient error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Start service
 */
export const startService = async (req, res) => {
    try {
        const { id } = req.params;

        const queueEntry = await QueueEntry.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: { $in: ['waiting', 'called'] }
        });

        if (!queueEntry) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Navbat topilmadi'
            });
        }

        queueEntry.status = 'in_service';
        queueEntry.serviceStartedAt = new Date();
        queueEntry.servedBy = req.user._id;

        await queueEntry.save();
        await queueEntry.populate([
            { path: 'patientId', select: 'firstName lastName phone' },
            { path: 'doctorId', select: 'firstName lastName specialization roomNumber' }
        ]);

        // Emit WebSocket events
        emitQueueUpdate(req.user.orgId, { action: 'service_started' });

        // Emit specific event for queue display to hide alert
        const io = req.app.get('io');
        if (io) {
            io.to(`org:${req.user.orgId}`).emit('queue:service-started', {
                queueEntryId: queueEntry._id,
                doctorId: queueEntry.doctorId._id,
                queueNumber: queueEntry.queueNumber
            });
        }

        res.json({
            message: 'Xizmat boshlandi',
            queueEntry
        });
    } catch (error) {
        console.error('Start service error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Complete service
 */
export const completeService = async (req, res) => {
    try {
        const { id } = req.params;

        const queueEntry = await QueueEntry.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: 'in_service'
        });

        if (!queueEntry) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Navbat topilmadi'
            });
        }

        queueEntry.status = 'completed';
        queueEntry.completedAt = new Date();

        await queueEntry.save();

        // 🎯 AVTOMATIK KEYINGI BEMORNI CHAQIRISH
        // Xizmat tugagandan keyin shu shifokor uchun keyingi bemorni avtomatik chaqiramiz
        try {
            const nextPatient = await QueueEntry.findOne({
                orgId: req.user.orgId,
                doctorId: queueEntry.doctorId,
                status: 'waiting'
            })
                .sort({ priority: -1, joinedAt: 1 }) // Priority yuqori bo'lsa birinchi, keyin vaqt bo'yicha
                .populate([
                    { path: 'patientId', select: 'firstName lastName phone' },
                    { path: 'doctorId', select: 'firstName lastName spec' }
                ]);

            if (nextPatient) {
                // Keyingi bemorni chaqirish
                nextPatient.status = 'called';
                nextPatient.calledAt = new Date();
                await nextPatient.save();

                // WebSocket orqali xabar yuborish
                emitPatientCalled(req.user.orgId, nextPatient);

                console.log(`✅ Keyingi bemor avtomatik chaqirildi: №${nextPatient.queueNumber}`);
            } else {
                console.log(`ℹ️ Shifokor uchun navbatda boshqa bemor yo'q`);
            }
        } catch (err) {
            console.error('❌ Keyingi bemorni chaqirishda xatolik:', err);
            // Xatolikni yutamiz - asosiy xizmat yakunlangan
        }

        // Emit WebSocket event
        emitQueueUpdate(req.user.orgId, { action: 'service_completed' });

        res.json({
            message: 'Xizmat yakunlandi',
            queueEntry
        });
    } catch (error) {
        console.error('Complete service error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Cancel/Remove from queue
 */
export const cancelQueue = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const queueEntry = await QueueEntry.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: { $in: ['waiting', 'called'] }
        });

        if (!queueEntry) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Navbat topilmadi'
            });
        }

        queueEntry.status = 'cancelled';
        queueEntry.cancelledBy = req.user._id;
        queueEntry.cancellationReason = reason || 'Bekor qilindi';

        await queueEntry.save();

        res.json({
            message: 'Navbatdan o\'chirildi',
            queueEntry
        });
    } catch (error) {
        console.error('Cancel queue error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Change priority
 */
export const changePriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;

        if (!['normal', 'urgent', 'emergency'].includes(priority)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Noto\'g\'ri prioritet'
            });
        }

        const queueEntry = await QueueEntry.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: { $in: ['waiting', 'called'] }
        });

        if (!queueEntry) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Navbat topilmadi'
            });
        }

        queueEntry.priority = priority;
        await queueEntry.save();
        await queueEntry.populate('patientId', 'firstName lastName');

        res.json({
            message: 'Prioritet o\'zgartirildi',
            queueEntry
        });
    } catch (error) {
        console.error('Change priority error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [waiting, served, avgWaitTime] = await Promise.all([
            QueueEntry.countDocuments({
                orgId: req.user.orgId,
                status: { $in: ['waiting', 'called'] }
            }),
            QueueEntry.countDocuments({
                orgId: req.user.orgId,
                status: 'completed',
                createdAt: { $gte: today }
            }),
            QueueEntry.aggregate([
                {
                    $match: {
                        orgId: req.user.orgId,
                        status: 'completed',
                        calledAt: { $exists: true },
                        serviceStartedAt: { $exists: true }
                    }
                },
                {
                    $project: {
                        waitTime: {
                            $divide: [
                                { $subtract: ['$serviceStartedAt', '$calledAt'] },
                                1000 * 60  // Convert to minutes
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgWaitTime: { $avg: '$waitTime' }
                    }
                }
            ])
        ]);

        res.json({
            stats: {
                currentlyWaiting: waiting,
                servedToday: served,
                avgWaitTime: Math.round(avgWaitTime[0]?.avgWaitTime || 0)
            }
        });
    } catch (error) {
        console.error('Get queue stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Clear old queue entries (Admin only)
 */
export const clearOldEntries = async (req, res) => {
    try {
        const daysAgo = parseInt(req.query.days) || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

        const result = await QueueEntry.deleteMany({
            orgId: req.user.orgId,
            status: { $in: ['completed', 'cancelled', 'no_show'] },
            createdAt: { $lt: cutoffDate }
        });

        res.json({
            message: `${result.deletedCount} ta eski navbat o'chirildi`
        });
    } catch (error) {
        console.error('Clear old entries error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * PUBLIC: Get queue display data (no auth required)
 * Returns queue grouped by doctor/service with patient initials only
 */
export const getPublicDisplay = async (req, res) => {
    try {
        const { orgId } = req.query;

        if (!orgId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Organization ID required'
            });
        }

        // Get all active queue entries
        const queue = await QueueEntry.find({
            orgId,
            status: { $in: ['waiting', 'called', 'in_service'] }
        })
            .sort({ priority: -1, joinedAt: 1 })
            .populate([
                { path: 'patientId', select: 'firstName lastName' },
                { path: 'doctorId', select: 'firstName lastName specialization roomNumber' }
            ])
            .lean();

        // Group by doctor and format data
        const groupedByDoctor = {};

        queue.forEach(entry => {
            const doctorId = entry.doctorId?._id?.toString() || 'general';
            const doctorName = entry.doctorId
                ? `${entry.doctorId.firstName} ${entry.doctorId.lastName}`
                : 'Umumiy navbat';
            const specialization = entry.doctorId?.specialization || '';

            if (!groupedByDoctor[doctorId]) {
                groupedByDoctor[doctorId] = {
                    doctorId,
                    doctorName,
                    specialization,
                    currentPatient: null,
                    waitingQueue: []
                };
            }

            // Get patient initials (first letter of first and last name)
            const firstName = entry.patientId?.firstName || '?';
            const lastName = entry.patientId?.lastName || '';
            const initials = `${firstName.charAt(0).toUpperCase()}. ${lastName.charAt(0).toUpperCase()}.`;

            const patientData = {
                queueNumber: entry.queueNumber,
                initials,
                status: entry.status,
                priority: entry.priority,
                joinedAt: entry.joinedAt
            };

            // Separate current patient from waiting
            if (entry.status === 'in_service' || entry.status === 'called') {
                groupedByDoctor[doctorId].currentPatient = patientData;
            } else {
                groupedByDoctor[doctorId].waitingQueue.push(patientData);
            }
        });

        // Convert to array
        const displayData = Object.values(groupedByDoctor);

        res.json({
            departments: displayData,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get public display error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
/**
 * Get doctor statistics
 */
export const getDoctorStats = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Oxirgi 30 kun ichidagi tugallangan xizmatlar
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const completedServices = await QueueEntry.find({
            orgId: req.user.orgId,
            doctorId,
            status: 'completed',
            completedAt: { $gte: thirtyDaysAgo }
        });

        // O'rtacha xizmat vaqtini hisoblash
        let totalServiceTime = 0;
        let validCount = 0;

        completedServices.forEach(entry => {
            if (entry.serviceStartedAt && entry.completedAt) {
                const duration = (new Date(entry.completedAt) - new Date(entry.serviceStartedAt)) / 60000; // daqiqa
                if (duration > 0 && duration < 300) { // 5 soatdan kam
                    totalServiceTime += duration;
                    validCount++;
                }
            }
        });

        const avgServiceTime = validCount > 0
            ? Math.round(totalServiceTime / validCount)
            : 15; // default 15 daq

        res.json({
            doctorId,
            totalPatients: completedServices.length,
            avgServiceTime,
            period: '30 kun',
            validCount
        });
    } catch (error) {
        console.error('Get doctor stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
