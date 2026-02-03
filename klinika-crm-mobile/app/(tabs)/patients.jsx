import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../../constants/api';
import { Search, User, Phone, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function Patients() {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchPatients = async (searchTerm = '') => {
        try {
            const response = await api.get(`/patients?search=${searchTerm}`);
            setPatients(response.data.items || []);
        } catch (error) {
            console.error('Fetch patients error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPatients(search);
    };

    const handleSearch = (text) => {
        setSearch(text);
        // Debounce search could be better, but for now:
        const timeoutId = setTimeout(() => fetchPatients(text), 500);
        return () => clearTimeout(timeoutId);
    };

    const PatientItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/patient/${item._id}`)}
        >
            <View style={styles.patientInfo}>
                <View style={styles.avatar}>
                    <User size={24} color="#3b82f6" />
                </View>
                <View style={styles.details}>
                    <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                    <View style={styles.phoneRow}>
                        <Phone size={14} color="#64748b" />
                        <Text style={styles.phoneText}>{item.phone || 'Telefon kiritilmagan'}</Text>
                    </View>
                </View>
            </View>
            <ChevronRight size={20} color="#334155" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchWrapper}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Bemorlarni qidirish..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={patients}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <PatientItem item={item} />}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <User size={48} color="#1e293b" />
                            <Text style={styles.emptyText}>Bemorlar topilmadi</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    searchSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '500',
    },
    list: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    details: {
        justifyContent: 'center',
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    phoneText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginLeft: 6,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '600',
    },
});
