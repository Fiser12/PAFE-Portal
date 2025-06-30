import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth/useAuth';
import { authService } from '../lib/auth/auth.service';

export default function LoginScreen() {
    const router = useRouter();
    const { signInWithGoogle, loading, error, signOut } = useAuth();

    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            const stored = await authService.getToken();
            setToken(stored);
        };
        checkToken();

        const handleTokenSet = () => checkToken();
        window.addEventListener('auth-token-set', handleTokenSet);
        return () => window.removeEventListener('auth-token-set', handleTokenSet);
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Error');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            setToken(null);
        } catch (err) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
        }
    };

    if (token) {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Token guardado</Text>
                    <View style={styles.tokenContainer}>
                        <Text selectable style={styles.tokenText}>{token}</Text>
                    </View>

                    <TouchableOpacity onPress={handleLogout} style={[styles.button, { backgroundColor: '#EF4444', borderColor: '#EF4444', marginTop: 24 }]}>
                        <Text style={[styles.buttonText, { color: 'white' }]}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Bienvenido</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    style={[styles.button, loading && styles.buttonDisabled]}
                >
                    <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>{loading ? 'Iniciando sesión...' : 'Continuar con Google'}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 24,
    },
    content: {
        width: '100%',
        maxWidth: 384,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#111827',
        marginBottom: 32,
    },
    subtitle: {
        textAlign: 'center',
        color: '#6B7280',
        marginBottom: 32,
    },
    errorContainer: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    errorText: {
        color: '#B91C1C',
        textAlign: 'center',
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: 'white',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#374151',
        fontWeight: '500',
        marginLeft: 8,
    },
    tokenContainer: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    tokenText: {
        fontSize: 12,
        color: '#111827',
    },
});

