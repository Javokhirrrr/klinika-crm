// Toast Notification Component for Mobile
import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react-native';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    const opacity = React.useRef(new Animated.Value(0)).current;
    const translateY = React.useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        // Slide in animation
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto dismiss
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -20,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle2 size={24} color="#10b981" />,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: '#10b981',
                };
            case 'error':
                return {
                    icon: <XCircle size={24} color="#ef4444" />,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderColor: '#ef4444',
                };
            case 'warning':
                return {
                    icon: <AlertCircle size={24} color="#f59e0b" />,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderColor: '#f59e0b',
                };
            case 'info':
                return {
                    icon: <Info size={24} color="#3b82f6" />,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderColor: '#3b82f6',
                };
            default:
                return {
                    icon: <Info size={24} color="#3b82f6" />,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderColor: '#3b82f6',
                };
        }
    };

    const config = getConfig();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: config.backgroundColor,
                    borderColor: config.borderColor,
                },
            ]}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>{config.icon}</View>
                <Text style={styles.message}>{message}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <X size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// Toast Container to manage multiple toasts
export function ToastContainer({ toasts, onRemove }) {
    return (
        <View style={styles.toastContainer}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </View>
    );
}

// Hook to use toasts
export function useToast() {
    const [toasts, setToasts] = React.useState([]);

    const addToast = React.useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = React.useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        gap: 12,
    },
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    closeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
