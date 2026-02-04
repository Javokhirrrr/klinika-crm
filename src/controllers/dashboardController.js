import { Appointment } from '../models/Appointment.js';
import { Payment } from '../models/Payment.js';
import { Patient } from '../models/Patient.js';

// Get dashboard metrics
export const getMetrics = async (req, res) => {
    try {
        const { date = 'today', doctor, department } = req.query;

        // Calculate date range
        let startDate, endDate;
        const now = new Date();

        switch (date) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = new Date(yesterday.setHours(0, 0, 0, 0));
                endDate = new Date(yesterday.setHours(23, 59, 59, 999));
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                endDate = new Date();
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setDate(1);
                endDate = new Date();
                break;
            default:
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
        }

        // Build query filters
        const appointmentQuery = {
            appointmentDate: { $gte: startDate, $lte: endDate }
        };

        if (doctor && doctor !== 'all') {
            appointmentQuery.doctor = doctor;
        }

        if (department && department !== 'all') {
            appointmentQuery.department = department;
        }

        // Get appointments count
        const appointmentsCount = await Appointment.countDocuments(appointmentQuery);

        // Get unique patients count
        const appointments = await Appointment.find(appointmentQuery).select('patient');
        const uniquePatients = new Set(appointments.map(a => a.patient?.toString())).size;

        // Get revenue
        const paymentQuery = {
            createdAt: { $gte: startDate, $lte: endDate }
        };

        const payments = await Payment.find(paymentQuery);
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Get waiting queue (appointments with status 'waiting' or 'scheduled')
        const waitingCount = await Appointment.countDocuments({
            status: { $in: ['waiting', 'scheduled'] },
            appointmentDate: { $gte: new Date() }
        });

        // Calculate trends (compare with previous period)
        const previousStartDate = new Date(startDate);
        const previousEndDate = new Date(endDate);
        const diff = endDate - startDate;
        previousStartDate.setTime(previousStartDate.getTime() - diff);
        previousEndDate.setTime(previousEndDate.getTime() - diff);

        const previousAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            appointmentDate: { $gte: previousStartDate, $lte: previousEndDate }
        });

        const previousPayments = await Payment.find({
            createdAt: { $gte: previousStartDate, $lte: previousEndDate }
        });
        const previousRevenue = previousPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Calculate trend percentages
        const appointmentsTrend = previousAppointments > 0
            ? ((appointmentsCount - previousAppointments) / previousAppointments * 100).toFixed(0)
            : 0;

        const revenueTrend = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(0)
            : 0;

        const patientsTrend = appointmentsTrend; // Approximate

        res.json({
            patients: uniquePatients,
            appointments: appointmentsCount,
            revenue: totalRevenue,
            waiting: waitingCount,
            patientsTrend: `${appointmentsTrend >= 0 ? '+' : ''}${appointmentsTrend}%`,
            appointmentsTrend: `${appointmentsTrend >= 0 ? '+' : ''}${appointmentsTrend}%`,
            revenueTrend: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}%`,
            waitingTrend: '-3%', // Placeholder
            period: date,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Error getting dashboard metrics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get revenue by period
export const getRevenue = async (req, res) => {
    try {
        const { period = 'today' } = req.query;

        let startDate, endDate;
        const now = new Date();

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = new Date(yesterday.setHours(0, 0, 0, 0));
                endDate = new Date(yesterday.setHours(23, 59, 59, 999));
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                endDate = new Date();
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setDate(1);
                endDate = new Date();
                break;
            default:
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
        }

        const payments = await Payment.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        res.json({
            total,
            count: payments.length,
            period,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Error getting revenue:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
