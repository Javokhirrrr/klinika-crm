import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    SafeAreaView,
    Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
    User,
    Info,
    Shield,
    FileText,
    ChevronRight,
    LogOut,
    Smartphone
} from 'lucide-react-native';

export default function Profile() {
    const { user, logout } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);

    const handleLogout = () => {
        setModalVisible(true);
    };

    const confirmLogout = () => {
        setModalVisible(false);
        logout();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* User Section */}
                <View style={styles.userCard}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarCircle}>
                            <User size={35} color="#64748b" />
                        </View>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || 'Hippo User'}</Text>
                        <View style={styles.phoneWrapper}>
                            <Smartphone size={14} color="#64748b" style={{ marginRight: 4 }} />
                            <Text style={styles.userPhone}>{user?.phone || '+998 71 200 63 63'}</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Section */}
                <View style={styles.menuCard}>
                    <MenuItem
                        icon={<Info size={20} color="#0f172a" />}
                        label="Ilova haqida"
                        onPress={() => { }}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Shield size={20} color="#0f172a" />}
                        label="Maxfiylik siyosati"
                        onPress={() => { }}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<FileText size={20} color="#0f172a" />}
                        label="Foydalanish shartlari"
                        onPress={() => { }}
                        isLast
                    />
                </View>

                {/* Footer Section */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Chiqish</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Versiya 1.0.0</Text>
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Haqiqatan ham profilingizdan chiqmoqchimisiz?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Ortga</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmLogout}
                            >
                                <Text style={styles.confirmButtonText}>Xa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function MenuItem({ icon, label, onPress, isLast }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrapper}>{icon}</View>
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarWrapper: {
        marginRight: 16,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    phoneWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userPhone: {
        fontSize: 14,
        color: '#64748b',
    },
    menuCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#0f172a',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 64,
    },
    logoutButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94a3b8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 30,
        padding: 24,
        width: '100%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 26,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
        marginRight: 12,
    },
    confirmButton: {
        backgroundColor: '#fee2e2',
        marginLeft: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
});
