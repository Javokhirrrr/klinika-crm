import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

function InitialLayout() {
    const { user, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const isSplash = segments[0] === 'splash';
        if (isSplash) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!user && inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/login');
        } else if (user && segments[0] === 'login') {
            // Redirect to dashboard if already authenticated
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="splash" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="light" />
            <InitialLayout />
        </AuthProvider>
    );
}
