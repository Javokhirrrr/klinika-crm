import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../constants/api';
import { ArrowLeft, Search, User, UserPlus, CheckCircle2, Activity } from 'lucide-react-native';

export default function CreateQueueEntry() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [priority, setPriority] = useState('normal');

    useEffect(() => {
        fetchDoctors();
        fetchServices();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/doctors');
            setDoctors(response.data.items || []);
        } catch (error) {
            console.error('Fetch doctors error:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await api.get('/services');
            setServices(response.data.items || []);
        } catch (error) {
            console.error('Fetch services error:', error);
        }
    };

    const searchPatients = async (query) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setPatients([]);
            return;
        }

        setSearching(true);
        try {
            const response = await api.get(`/patients?search=${query}`);
            setPatients(response.data.items || []);
        } catch (error) {
            console.error('Search patients error:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleCreate = async () => {
        if (!selectedPatient || !selectedDoctor || !selectedService) {
            Alert.alert('Xatolik', 'Iltimos, bemor, shifokor va xizmatni tanlang');
            return;
        }

        setLoading(true);
        try {
            await api.post('/queue/join', {
                patientId: selectedPatient._id,
                doctorId: selectedDoctor._id,
                serviceId: selectedService._id,
                priority
            });

            Alert.alert('Muvaffaqiyat', 'Bemor navbatga qo\'shildi', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Join queue error:', error);
            Alert.alert('Xatolik', error.response?.data?.message || 'Navbatga qo\'shib bo\'lmadi');
        } finally {
            setLoading(false);
        }
    };

    const renderPatientItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.itemCard, selectedPatient?._id === item._id && styles.selectedCard]}
            onPress={() => setSelectedPatient(item)}
        >
            <View style={styles.itemInfo}>
                <View style={[styles.itemAvatar, selectedPatient?._id === item._id && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <User size={20} color={selectedPatient?._id === item._id ? '#fff' : '#3b82f6'} />
                </View>
                <View>
                    <Text style={[styles.itemName, selectedPatient?._id === item._id && styles.selectedText]}>
                        {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[styles.itemSub, selectedPatient?._id === item._id && { color: 'rgba(255,255,255,0.7)' }]}>{item.phone || 'Telefon yo\'q'}</Text>
                </View>
            </View>
            {selectedPatient?._id === item._id && <CheckCircle2 size={20} color="#fff" />}
        </TouchableOpacity>
    );

    const renderDoctorItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.itemCard, selectedDoctor?._id === item._id && styles.selectedCard]}
            onPress={() => setSelectedDoctor(item)}
        >
            <View style={styles.itemInfo}>
                <View style={[styles.itemAvatar, { backgroundColor: selectedDoctor?._id === item._id ? 'rgba(255,255,255,0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
                    <UserPlus size={20} color={selectedDoctor?._id === item._id ? '#fff' : '#8b5cf6'} />
                </View>
                <View>
                    <Text style={[styles.itemName, selectedDoctor?._id === item._id && styles.selectedText]}>
                        Dr. {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[styles.itemSub, selectedDoctor?._id === item._id && { color: 'rgba(255,255,255,0.7)' }]}>{item.spec || 'Mutaxassislik yo\'q'}</Text>
                </View>
            </View>
            {selectedDoctor?._id === item._id && <CheckCircle2 size={20} color="#fff" />}
        </TouchableOpacity>
    );

    const renderServiceItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.itemCard, selectedService?._id === item._id && styles.selectedCard]}
            onPress={() => setSelectedService(item)}
        >
            <View style={styles.itemInfo}>
                <View style={[styles.itemAvatar, { backgroundColor: selectedService?._id === item._id ? 'rgba(255,255,255,0.2)' : 'rgba(16, 185, 129, 0.1)' }]}>
                    <Activity size={20} color={selectedService?._id === item._id ? '#fff' : '#10b981'} />
                </View>
                <View>
                    <Text style={[styles.itemName, selectedService?._id === item._id && styles.selectedText]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.itemSub, selectedService?._id === item._id && { color: 'rgba(255,255,255,0.7)' }]}>{item.price?.toLocaleString()} so'm</Text>
                </View>
            </View>
            {selectedService?._id === item._id && <CheckCircle2 size={20} color="#fff" />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Navbatga Qo'shish</Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {/* Patient Search */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Bemor qidirish</Text>
                    <View style={styles.searchBox}>
                        <Search size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Ism yoki telefon raqami..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={searchPatients}
                        />
                    </View>

                    {searching ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color="#3b82f6" />
                    ) : (
                        searchQuery.length >= 3 && (
                            <View style={styles.listContainer}>
                                {patients.map(item => (
                                    <View key={item._id}>
                                        {renderPatientItem({ item })}
                                    </View>
                                ))}
                                {patients.length === 0 && <Text style={styles.emptySearchText}>Bemor topilmadi</Text>}
                            </View>
                        )
                    )}
                </View>

                {/* Patient Selection Confirmation */}
                {selectedPatient && (
                    <View style={styles.selectionConfirm}>
                        <Text style={styles.confirmLabel}>Tanlangan bemor:</Text>
                        <Text style={styles.confirmValue}>{selectedPatient.firstName} {selectedPatient.lastName}</Text>
                    </View>
                )}

                {/* Doctor Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Shifokorni tanlang</Text>
                    <View style={styles.listContainer}>
                        {doctors.map(item => (
                            <View key={item._id}>
                                {renderDoctorItem({ item })}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Service Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Xizmatni tanlang</Text>
                    <View style={styles.listContainer}>
                        {services.map(item => (
                            <View key={item._id}>
                                {renderServiceItem({ item })}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Priority Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Prioritet</Text>
                    <View style={styles.priorityGrid}>
                        {['normal', 'urgent', 'emergency'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}
                                onPress={() => setPriority(p)}
                            >
                                <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                                    {p === 'normal' ? 'Oddiy' : p === 'urgent' ? 'Tezkor' : ' Shoshilinch'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, (!selectedPatient || !selectedDoctor || !selectedService) && styles.disabledSubmit]}
                    onPress={handleCreate}
                    disabled={loading || !selectedPatient || !selectedDoctor || !selectedService}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Navbatga Qo'shish</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
    },
    content: {
        paddingHorizontal: 16,
    },
    section: {
        marginTop: 20,
        marginBottom: 10,
    },
    sectionLabel: {
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 4,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '600',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    selectedCard: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    selectedText: {
        color: '#2563eb',
    },
    itemSub: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    listContainer: {
        marginTop: 5,
    },
    selectionConfirm: {
        backgroundColor: '#ecfdf5',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    confirmLabel: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '700',
        marginBottom: 2,
    },
    confirmValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#065f46',
    },
    priorityGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    priorityBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    priorityBtnActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    priorityText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '700',
    },
    priorityTextActive: {
        color: '#2563eb',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 60,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    disabledSubmit: {
        opacity: 0.5,
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    emptySearchText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 10,
        fontWeight: '600',
    }
});
