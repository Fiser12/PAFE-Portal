import { useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../lib/auth/useAuth'

export default function AuthCallbackPage() {
    const router = useRouter()
    const { token } = useLocalSearchParams<{ token: string }>()
    const { setSession } = useAuth()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                if (token) {
                    console.log('📱 Recibido token de autenticación')
                    const sessionData = JSON.parse(atob(token))
                    await setSession(sessionData)

                    console.log('✅ Sesión establecida, redirigiendo...')
                    router.replace('/')
                } else {
                    console.error('❌ No se recibió token de autenticación')
                    router.replace('/login')
                }
            } catch (error) {
                console.error('❌ Error procesando autenticación:', error)
                router.replace('/login')
            }
        }

        handleAuthCallback()
    }, [token, setSession, router])

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.text}>
                Completando autenticación...
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