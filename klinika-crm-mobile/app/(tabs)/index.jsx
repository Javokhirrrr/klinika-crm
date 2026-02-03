import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import api from '../../constants/api';
import {
    Wallet, Users, Clock, TrendingUp, Calendar, DollarSign,
    Activity, UserPlus, FileText, Settings, BarChart3, ChevronRight
} from 'lucide-react-native';

export default function Dashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const userRole = user?.role || 'reception';

    // Route to appropriate dashboard based on role
    if (userRole === 'owner' || userRole === 'admin') {
        return <DirectorDashboard />;
    } else if (userRole === 'doctor') {
        return <DoctorDashboard />;
    } else {
        return <ReceptionDashboard />;
    }
}

// Reception Dashboard
function ReceptionDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

            const [appointmentsRes, queueRes, paymentsRes] = await Promise.all([
                api.get('/appointments', { params: { from: startOfDay } }),
                api.get('/queue/current'),
                api.get('/payments', { params: { from: startOfDay } }),
            ]);

            const appointments = appointmentsRes.data.items || [];
            const queue = queueRes.data.queue || [];
            const payments = paymentsRes.data.items || [];

            setStats({
                todayAppointments: appointments.length,
                waitingPatients: queue.filter(q => q.status === 'waiting').length,
                todayPayments: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                newPatients: appointments.filter(a => a.isNewPatient).length,
            });
        } catch (error) {
            console.error('Fetch stats error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Xush kelibsiz,</Text>
                    <Text style={styles.userName}>{user?.name || 'Foydalanuvchi'}</Text>
                </View>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Bugungi Qabullar"
                    value={stats?.todayAppointments || 0}
                    icon={<Calendar size={22} color="#0EA5E9" />}
                    color="#E0F2FE"
                    textColor="#0EA5E9"
                />
                <StatCard
                    title="Navbatda"
                    value={stats?.waitingPatients || 0}
                    icon={<Clock size={22} color="#F59E0B" />}
                    color="#FEF3C7"
                    textColor="#F59E0B"
                />
                <StatCard
                    title="Bugungi To'lovlar"
                    value={`${(stats?.todayPayments || 0).toLocaleString()}`}
                    subtitle="so'm"
                    icon={<DollarSign size={22} color="#10B981" />}
                    color="#D1FAE5"
                    textColor="#10B981"
                />
                <StatCard
                    title="Yangi Bemorlar"
                    value={stats?.newPatients || 0}
                    icon={<UserPlus size={22} color="#8B5CF6" />}
                    color="#EDE9FE"
                    textColor="#8B5CF6"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tezkor Harakatlar</Text>
                <View style={styles.actionList}>
                    <ActionButton
                        icon={<UserPlus size={24} color="#0EA5E9" />}
                        label="Yangi Bemor"
                        onPress={() => router.push('/patients')}
                    />
                    <ActionButton
                        icon={<Calendar size={24} color="#10B981" />}
                        label="Yangi Qabul"
                        onPress={() => router.push('/queue/create')}
                    />
                    <ActionButton
                        icon={<DollarSign size={24} color="#F59E0B" />}
                        label="To'lov Qabul"
                        onPress={() => router.push('/patients')}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

// Director Dashboard
function DirectorDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            const [paymentsRes, appointmentsRes, patientsRes] = await Promise.all([
                api.get('/payments', { params: { from: thirtyDaysAgo.toISOString() } }),
                api.get('/appointments', { params: { from: thirtyDaysAgo.toISOString() } }),
                api.get('/patients'),
            ]);

            const payments = paymentsRes.data.items || [];
            const appointments = appointmentsRes.data.items || [];
            const patients = patientsRes.data.items || [];

            const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

            setStats({
                totalRevenue,
                profit: totalRevenue * 0.7,
                totalPatients: patients.length,
                totalAppointments: appointments.length,
            });
        } catch (error) {
            console.error('Fetch stats error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Direktor Paneli</Text>
                    <Text style={styles.subtitle}>Moliyaviy ko'rsatkichlar</Text>
                </View>
            </View>

            <View style={styles.financialSection}>
                <FinancialCard
                    title="Jami Daromad"
                    value={`${(stats?.totalRevenue || 0).toLocaleString()} so'm`}
                    icon={<TrendingUp size={28} color="#0EA5E9" />}
                    color="#E0F2FE"
                />
                <FinancialCard
                    title="Foyda"
                    value={`${(stats?.profit || 0).toLocaleString()} so'm`}
                    icon={<BarChart3 size={28} color="#10B981" />}
                    color="#D1FAE5"
                />
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Jami Bemorlar"
                    value={stats?.totalPatients || 0}
                    icon={<Users size={22} color="#0EA5E9" />}
                    color="#E0F2FE"
                    textColor="#0EA5E9"
                />
                <StatCard
                    title="Qabullar (30 kun)"
                    value={stats?.totalAppointments || 0}
                    icon={<Calendar size={22} color="#8B5CF6" />}
                    color="#EDE9FE"
                    textColor="#8B5CF6"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Boshqaruv</Text>
                <View style={styles.actionList}>
                    <ActionButton
                        icon={<FileText size={24} color="#0EA5E9" />}
                        label="Hisobotlar"
                        onPress={() => { }}
                    />
                    <ActionButton
                        icon={<Users size={24} color="#10B981" />}
                        label="Xodimlar"
                        onPress={() => { }}
                    />
                    <ActionButton
                        icon={<Settings size={24} color="#8B5CF6" />}
                        label="Sozlamalar"
                        onPress={() => { }}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

// Doctor Dashboard
function DoctorDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

            const [appointmentsRes, queueRes] = await Promise.all([
                api.get('/appointments', { params: { from: startOfDay, doctorId: user._id } }),
                api.get('/queue/current'),
            ]);

            const appointments = appointmentsRes.data.items || [];
            const allQueue = queueRes.data.queue || [];
            const completed = allQueue.filter(q => q.status === 'completed');

            setStats({
                todayPatients: appointments.length,
                waitingPatients: allQueue.filter(q => q.status === 'waiting').length,
                completedToday: completed.length,
                avgServiceTime: completed.length > 0
                    ? Math.round(completed.reduce((sum, q) => sum + (q.serviceTime || 0), 0) / completed.length)
                    : 0,
            });
        } catch (error) {
            console.error('Fetch stats error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Shifokor Paneli</Text>
                    <Text style={styles.subtitle}>Bugungi statistika</Text>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Bugungi Bemorlar"
                    value={stats?.todayPatients || 0}
                    icon={<Users size={22} color="#0EA5E9" />}
                    color="#E0F2FE"
                    textColor="#0EA5E9"
                />
                <StatCard
                    title="Navbatda"
                    value={stats?.waitingPatients || 0}
                    icon={<Clock size={22} color="#F59E0B" />}
                    color="#FEF3C7"
                    textColor="#F59E0B"
                />
                <StatCard
                    title="Tugallangan"
                    value={stats?.completedToday || 0}
                    icon={<Activity size={22} color="#10B981" />}
                    color="#D1FAE5"
                    textColor="#10B981"
                />
                <StatCard
                    title="O'rtacha Vaqt"
                    value={`${stats?.avgServiceTime || 0}`}
                    subtitle="daqiqa"
                    icon={<TrendingUp size={22} color="#8B5CF6" />}
                    color="#EDE9FE"
                    textColor="#8B5CF6"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tezkor Kirish</Text>
                <View style={styles.actionList}>
                    <ActionButton
                        icon={<Activity size={24} color="#0EA5E9" />}
                        label="Mening Navbatim"
                        onPress={() => router.push('/appointments')}
                    />
                    <ActionButton
                        icon={<Calendar size={24} color="#10B981" />}
                        label="Jadval"
                        onPress={() => router.push('/appointments')}
                    />
                    <ActionButton
                        icon={<Users size={24} color="#8B5CF6" />}
                        label="Bemorlar"
                        onPress={() => router.push('/patients')}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon, color, textColor }) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color }]}>{icon}</View>
            <View style={styles.statContent}>
                <Text style={styles.statTitle}>{title}</Text>
                <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
                    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
                </View>
            </View>
        </View>
    );
}

// Financial Card Component
function FinancialCard({ title, value, icon, color }) {
    return (
        <View style={styles.financialCard}>
            <View style={[styles.financialIcon, { backgroundColor: color }]}>{icon}</View>
            <View style={styles.financialContent}>
                <Text style={styles.financialTitle}>{title}</Text>
                <Text style={styles.financialValue}>{value}</Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
        </View>
    );
}

// Action Button Component
function ActionButton({ icon, label, onPress }) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <View style={styles.actionIconContainer}>{icon}</View>
            <Text style={styles.actionLabel}>{label}</Text>
            <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    center: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 24,
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 4,
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 4,
    },
    dateContainer: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2563eb',
    },
    statsGrid: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statContent: {
        width: '100%',
    },
    statTitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 6,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
    },
    statSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    financialSection: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    financialCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    financialIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    financialContent: {
        flex: 1,
    },
    financialTitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 4,
    },
    financialValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    actionList: {
        gap: 12,
    },
    actionButton: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    actionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
});
