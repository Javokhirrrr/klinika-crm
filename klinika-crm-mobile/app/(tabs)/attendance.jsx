import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api from '../../constants/api';
import { Clock, LogIn, LogOut, MapPin, Calendar as CalendarIcon } from 'lucide-react-native';

export default function Attendance() {
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchTodayAttendance = async () => {
        try {
            const response = await api.get('/attendance/my-today');
            setAttendance(response.data.attendance);
        } catch (error) {
            console.error('Fetch attendance error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayAttendance();
    }, []);

    const handleClockIn = async () => {
        setActionLoading(true);
        try {
            const response = await api.post('/attendance/clock-in', {
                location: { address: 'Mobile App' }
            });
            setAttendance(response.data.attendance);
            Alert.alert('Muvaffaqiyat', response.data.message);
        } catch (error) {
            Alert.alert('Xatolik', error.response?.data?.message || 'Amalni bajarib bo\'lmadi');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setActionLoading(true);
        try {
            const response = await api.post('/attendance/clock-out', {
                location: { address: 'Mobile App' }
            });
            setAttendance(response.data.attendance);
            Alert.alert('Muvaffaqiyat', response.data.message);
        } catch (error) {
            Alert.alert('Xatolik', error.response?.data?.message || 'Amalni bajarib bo\'lmadi');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const isClockedIn = !!attendance;
    const isClockedOut = !!attendance?.clockOut;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <View style={[styles.statusIndicator, { backgroundColor: isClockedIn ? (isClockedOut ? '#64748b' : '#10b981') : '#f59e0b' }]} />
                <Text style={styles.statusTitle}>
                    {isClockedOut ? 'Ish kuni yakunlandi' : isClockedIn ? 'Hozir ishdasiz' : 'Hali ish boshlanmadi'}
                </Text>
                <Text style={styles.todayDate}>
                    {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
            </View>

            <View style={styles.timeSection}>
                <TimeBox
                    label="Kelgan vaqtingiz"
                    time={attendance?.clockIn ? new Date(attendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    icon={<LogIn size={20} color="#10b981" />}
                />
                <TimeBox
                    label="Ketgan vaqtingiz"
                    time={attendance?.clockOut ? new Date(attendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    icon={<LogOut size={20} color="#ef4444" />}
                />
            </View>

            {!!attendance?.workHours && (
                <View style={styles.workHoursCard}>
                    <Clock size={24} color="#3b82f6" />
                    <View style={styles.workHoursDetail}>
                        <Text style={styles.workHoursLabel}>Umumiy ish vaqti</Text>
                        <Text style={styles.workHoursValue}>{attendance.workHours} soat</Text>
                    </View>
                </View>
            )}

            {!isClockedIn ? (
                <TouchableOpacity
                    style={[styles.mainButton, styles.clockInButton]}
                    onPress={handleClockIn}
                    disabled={actionLoading}
                >
                    {actionLoading ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <LogIn size={24} color="#fff" />
                            <Text style={styles.buttonText}>Ishni boshlash</Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : !isClockedOut ? (
                <TouchableOpacity
                    style={[styles.mainButton, styles.clockOutButton]}
                    onPress={handleClockOut}
                    disabled={actionLoading}
                >
                    {actionLoading ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <LogOut size={24} color="#fff" />
                            <Text style={styles.buttonText}>Ishni tugatish</Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : (
                <View style={styles.doneCard}>
                    <Text style={styles.doneText}>Bugun uchun davomat yakunlandi. Erta ko'rishguncha! 👋</Text>
                </View>
            )}
        </ScrollView>
    );
}

function TimeBox({ label, time, icon }) {
    return (
        <View style={styles.timeBox}>
            <View style={styles.timeBoxHeader}>
                {icon}
                <Text style={styles.timeBoxLabel}>{label}</Text>
            </View>
            <Text style={styles.timeBoxValue}>{time}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    center: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    todayDate: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    timeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    timeBox: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    timeBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeBoxLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
    },
    timeBoxValue: {
        color: '#0f172a',
        fontSize: 24,
        fontWeight: '800',
    },
    workHoursCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
    },
    workHoursDetail: {
        marginLeft: 16,
    },
    workHoursLabel: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    workHoursValue: {
        color: '#0f172a',
        fontSize: 18,
        fontWeight: '800',
    },
    mainButton: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    clockInButton: {
        backgroundColor: '#2563eb',
    },
    clockOutButton: {
        backgroundColor: '#ef4444',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
    },
    doneCard: {
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    doneText: {
        color: '#64748b',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
});
