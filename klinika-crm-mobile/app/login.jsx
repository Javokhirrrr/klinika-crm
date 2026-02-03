import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { User, Lock, ArrowRight, Accessibility } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Xatolik', 'Email va parolni kiriting');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            router.replace('/(tabs)');
        } else {
            Alert.alert('Xatolik', result.message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.logoWrapper}>
                        <View style={styles.iconCircle}>
                            <Accessibility size={40} color="#fff" strokeWidth={2.5} />
                        </View>
                        <View style={styles.logoTextContainer}>
                            <Text style={styles.logoTitle}>Hippo<Text style={styles.logoTitleBold}>CRM</Text></Text>
                            <Text style={styles.logoSubtitle}>Professional Healthcare Management</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.welcomeText}>Xush kelibsiz!</Text>
                    <Text style={styles.instructionText}>Tizimga kirish uchun ma'lumotlaringizni kiriting</Text>

                    <Text style={styles.label}>Login</Text>
                    <View style={styles.inputWrapper}>
                        <User size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="+998 77 123 45 67"
                            placeholderTextColor="#94a3b8"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>Parol</Text>
                    <View style={styles.inputWrapper}>
                        <Lock size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="*****"
                            placeholderTextColor="#94a3b8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Tizimga kirish</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Parolni unutdingizmi?</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoWrapper: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    logoTextContainer: {
        alignItems: 'center',
    },
    logoTitle: {
        fontSize: 32,
        color: '#1e3a8a',
        letterSpacing: -0.5,
    },
    logoTitleBold: {
        fontWeight: 'bold',
        color: '#2563eb',
    },
    logoSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    formContainer: {
        width: '100%',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#0f172a',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#2563eb',
        borderRadius: 16,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    forgotPassword: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
});
