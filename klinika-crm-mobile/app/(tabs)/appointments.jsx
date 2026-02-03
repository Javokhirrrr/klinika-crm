import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import api from '../../constants/api';
import { Calendar, Clock, User, DollarSign, CheckCircle2, XCircle, AlertCircle, Plus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const fetchAppointments = async () => {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            // For doctors, only show their appointments for today
            // For reception/admin, show all appointments
            const params = user?.role === 'doctor'
                ? { from: startOfDay, to: endOfDay, doctorId: user._id }
                : { from: startOfDay, to: endOfDay };

            const response = await api.get('/appointments', { params });
            const data = response.data.items || response.data || [];

            // Sort by scheduled time
            const sorted = data.sort((a, b) =>
                new Date(a.scheduledAt) - new Date(b.scheduledAt)
            );

            setAppointments(sorted);
        } catch (error) {
            console.error('Fetch appointments error:', error);
            Alert.alert('Xatolik', 'Qabullarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAppointments();
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.patch(`/appointments/${id}`, { status: newStatus });
            await fetchAppointments();
            Alert.alert('Muvaffaqiyat', 'Holat yangilandi');
        } catch (error) {
            Alert.alert('Xatolik', error.response?.data?.message || 'Holatni yangilashda xatolik');
        }
    };

    const AppointmentItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.timeContainer}>
                    <Clock size={16} color="#2563eb" />
                    <Text style={styles.time}>
                        {new Date(item.scheduledAt).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.patientInfo}>
                <View style={styles.avatar}>
                    <User size={24} color="#64748b" />
                </View>
                <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>
                        {item.patient?.firstName || item.patientId?.firstName} {item.patient?.lastName || item.patientId?.lastName}
                    </Text>
                    <Text style={styles.phone}>
                        {item.patient?.phone || item.patientId?.phone || 'Telefon yo\'q'}
                    </Text>
                </View>
            </View>

            {item.service && (
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceLabel}>Xizmat</Text>
                    <Text style={styles.serviceName}>{item.service.name || item.serviceId?.name}</Text>
                </View>
            )}

            {item.doctor && user?.role !== 'doctor' && (
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorLabel}>Shifokor</Text>
                    <Text style={styles.doctorName}>
                        Dr. {item.doctor.firstName || item.doctorId?.firstName} {item.doctor.lastName || item.doctorId?.lastName}
                    </Text>
                </View>
            )}

            {item.price && (
                <View style={styles.priceInfo}>
                    <Text style={styles.priceLabel}>Summa</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{item.price.toLocaleString()} UZS</Text>
                    </View>
                </View>
            )}

            {user?.role === 'doctor' && item.status === 'scheduled' && (
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.startButton]}
                        onPress={() => handleStatusUpdate(item._id, 'in_progress')}
                    >
                        <CheckCircle2 size={18} color="#fff" />
                        <Text style={styles.actionText}>Boshlash</Text>
                    </TouchableOpacity>
                </View>
            )}

            {user?.role === 'doctor' && item.status === 'in_progress' && (
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => handleStatusUpdate(item._id, 'completed')}
                    >
                        <CheckCircle2 size={18} color="#fff" />
                        <Text style={styles.actionText}>Tugatish</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const getStatusBg = (status) => {
        switch (status) {
            case 'scheduled': return '#eff6ff';
            case 'in_progress': return '#f5f3ff';
            case 'completed': return '#ecfdf5';
            case 'cancelled': return '#fef2f2';
            default: return '#f1f5f9';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return '#2563eb';
            case 'in_progress': return '#8b5cf6';
            case 'completed': return '#059669';
            case 'cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'scheduled': return 'Rejalashtirilgan';
            case 'in_progress': return 'Jarayonda';
            case 'completed': return 'Tugallangan';
            case 'cancelled': return 'Bekor qilingan';
            default: return status;
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {(user?.role === 'reception' || user?.role === 'admin' || user?.role === 'owner') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/queue/create')}
                >
                    <Plus size={30} color="#fff" />
                </TouchableOpacity>
            )}

            <FlatList
                data={appointments}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <AppointmentItem item={item} />}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Calendar size={48} color="#64748b" />
                        <Text style={styles.emptyText}>Bugun qabullar yo'q</Text>
                        <Text style={styles.emptySubtext}>
                            {user?.role === 'doctor'
                                ? 'Sizning bugungi jadvalingiz bo\'sh'
                                : 'Hozircha rejalashtirilgan qabullar yo\'q'}
                        </Text>
                    </View>
                }
            />
        </View>
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
    list: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    time: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    patientDetails: {
        flex: 1,
    },
    patientName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 2,
    },
    phone: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    serviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    serviceLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    doctorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
    },
    doctorLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    doctorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
    },
    priceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    priceLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
        color: '#059669',
        marginLeft: 4,
    },
    actionsContainer: {
        marginTop: 16,
    },
    actionButton: {
        flexDirection: 'row',
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    startButton: {
        backgroundColor: '#2563eb',
    },
    completeButton: {
        backgroundColor: '#059669',
    },
    actionText: {
        color: '#fff',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 16,
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 20,
        color: '#0f172a',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 10,
        color: '#64748b',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        zIndex: 100,
    },
});
