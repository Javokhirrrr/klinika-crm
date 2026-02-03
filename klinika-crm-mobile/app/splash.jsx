import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing
} from 'react-native-reanimated';
import { Accessibility } from 'lucide-react-native'; // Using Accessibility as a placeholder for the hippo-like icon

export default function SplashScreen() {
    const router = useRouter();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        // Animation
        opacity.value = withTiming(1, { duration: 1000 });
        scale.value = withTiming(1, {
            duration: 1000,
            easing: Easing.out(Easing.back(1.5))
        });

        // Redirect after delay
        const timer = setTimeout(() => {
            router.replace('/login');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, animatedStyle]}>
                <View style={styles.iconCircle}>
                    <Accessibility size={50} color="#fff" strokeWidth={2.5} />
                </View>
                <Text style={styles.logoText}>Klinika<Text style={styles.logoTextBold}>CRM</Text></Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    logoText: {
        fontSize: 32,
        color: '#1e3a8a',
        letterSpacing: -0.5,
    },
    logoTextBold: {
        fontWeight: 'bold',
        color: '#2563eb',
    },
});
