import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../constants/api';
import { ArrowLeft, Save, Activity, Pill, FileText } from 'lucide-react-native';

export default function AddMedicalHistory() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'checkup',
        medications: '',
    });

    const handleSave = async () => {
        if (!form.title || !form.description) {
            Alert.alert('Xatolik', 'Iltimos, tashxis va tavsifni kiriting');
            return;
        }

        setLoading(true);
        try {
            await api.post('/medical-history', {
                patientId: id,
                title: form.title,
                description: form.description,
                type: form.type,
                medications: form.medications ? form.medications.split(',').map(m => ({ name: m.trim() })) : [],
            });

            Alert.alert('Muvaffaqiyat', 'Tibbiy tarix saqlandi', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Save medical history error:', error);
            Alert.alert('Xatolik', 'Saqlashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tashxis Qo'shish</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.inputGroup}>
                    <View style={styles.labelContainer}>
                        <Activity size={18} color="#3b82f6" />
                        <Text style={styles.label}>Tashxis (Asosiy)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Masalan: O'tkir respirator kasallik"
                        placeholderTextColor="#94a3b8"
                        value={form.title}
                        onChangeText={(text) => setForm({ ...form, title: text })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelContainer}>
                        <FileText size={18} color="#3b82f6" />
                        <Text style={styles.label}>Tavsif va Izohlar</Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Bemor shikoyatlari va ko'rik natijalari..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        value={form.description}
                        onChangeText={(text) => setForm({ ...form, description: text })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelContainer}>
                        <Pill size={18} color="#3b82f6" />
                        <Text style={styles.label}>Dorilar (vergul bilan ajrating)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Paratsetamol, Analgin..."
                        placeholderTextColor="#94a3b8"
                        value={form.medications}
                        onChangeText={(text) => setForm({ ...form, medications: text })}
                    />
                </View>

                <View style={styles.typeSection}>
                    <Text style={styles.label}>Ko'rik turi</Text>
                    <View style={styles.typeGrid}>
                        {['checkup', 'surgery', 'lab', 'consultation'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeButton, form.type === type && styles.typeButtonActive]}
                                onPress={() => setForm({ ...form, type })}
                            >
                                <Text style={[styles.typeText, form.type === type && styles.typeTextActive]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Save size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>Saqlash</Text>
                        </>
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
    inputGroup: {
        marginTop: 20,
        marginBottom: 10,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginLeft: 4,
    },
    label: {
        fontSize: 14,
        color: '#0f172a',
        marginLeft: 8,
        fontWeight: '700',
    },
    input: {
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 16,
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '500',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    textArea: {
        height: 140,
    },
    typeSection: {
        marginTop: 10,
        marginBottom: 30,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 10,
    },
    typeButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    typeButtonActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    typeText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    typeTextActive: {
        color: '#2563eb',
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 10,
    },
});
