import { useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../lib/auth/useAuth'

export default function AuthSuccessPage() {
    const router = useRouter()
    const { token } = useLocalSearchParams<{ token: string }>()
    const { setSession } = useAuth()

    useEffect(() => {
        const handleAuthSuccess = async () => {
            try {
                if (token) {
                    const sessionData = JSON.parse(atob(token))
                    await setSession(sessionData)

                    // Redirigir a la pantalla principal
                    router.replace('/')
                } else {
                    console.error('No se recibió token de autenticación')
                    router.replace('/login')
                }
            } catch (error) {
                console.error('Error procesando autenticación:', error)
                router.replace('/login')
            }
        }

        handleAuthSuccess()
    }, [token, setSession, router])

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.text}>
                Procesando autenticación...
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    text: {
        marginTop: 16,
        fontSize: 18,
        color: '#6B7280',
    },
}) 