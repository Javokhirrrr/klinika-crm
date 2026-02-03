import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking, RefreshControl, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../constants/api';
import { User, Phone, Calendar, ArrowLeft, ClipboardList, Info } from 'lucide-react-native';

export default function PatientDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [patientRes, historyRes] = await Promise.all([
                api.get(`/patients/${id}`),
                api.get(`/medical-history/patient/${id}`)
            ]);
            setPatient(patientRes.data.patient);
            setHistory(historyRes.data.history || []);
        } catch (error) {
            console.error('Fetch patient details error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleCall = () => {
        if (patient?.phone) {
            Linking.openURL(`tel:${patient.phone}`);
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bemor Kartochkasi</Text>
                <TouchableOpacity
                    onPress={() => router.push(`/patient/add-history/${id}`)}
                    style={styles.addButton}
                >
                    <ClipboardList size={22} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            >
                {/* Patient Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarLarge}>
                        <User size={40} color="#3b82f6" />
                    </View>
                    <Text style={styles.patientName}>{patient?.firstName} {patient?.lastName}</Text>
                    <Text style={styles.patientSub}>{patient?.gender === 'male' ? 'Erkak' : 'Ayol'}, {patient?.age} yosh</Text>

                    <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                        <Phone size={20} color="#fff" />
                        <Text style={styles.callButtonText}>{patient?.phone || 'Telefon yo\'q'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Info size={20} color="#3b82f6" />
                        <Text style={styles.sectionTitle}>Ma'lumotlar</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Manzil:</Text>
                        <Text style={styles.infoValue}>{patient?.address || 'Kiritilmagan'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Qo'shilgan sana:</Text>
                        <Text style={styles.infoValue}>{new Date(patient?.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* History Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ClipboardList size={20} color="#8b5cf6" />
                        <Text style={styles.sectionTitle}>Tibbiy Tarix</Text>
                    </View>

                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <View key={item._id} style={[styles.historyItem, index === history.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={styles.historyHeader}>
                                    <View style={styles.dateBadge}>
                                        <Calendar size={12} color="#94a3b8" />
                                        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={styles.doctorName}>Dr. {item.doctorId?.name}</Text>
                                </View>
                                <Text style={styles.diagnosisTitle}>Tashxis:</Text>
                                <Text style={styles.diagnosisText}>{item.diagnosis}</Text>
                                {item.notes && (
                                    <>
                                        <Text style={styles.notesTitle}>Izohlar:</Text>
                                        <Text style={styles.notesText}>{item.notes}</Text>
                                    </>
                                )}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyHistory}>
                            <Text style={styles.emptyHistoryText}>Tarix mavjud emas</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        flex: 1,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 24,
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 30,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    patientName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    patientSub: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 20,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    callButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginLeft: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    infoLabel: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
    },
    infoValue: {
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '700',
    },
    historyItem: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    dateText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    doctorName: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '700',
    },
    diagnosisTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    diagnosisText: {
        color: '#0f172a',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
        lineHeight: 22,
    },
    notesTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    notesText: {
        color: '#475569',
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    emptyHistory: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptyHistoryText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
});
