import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { authService } from './auth.service'

interface AuthSession {
    user: {
        id: string
        name: string
        email: string
        image?: string
    }
    expires: string
}

interface AuthContextType {
    session: AuthSession | null
    loading: boolean
    error: string | null
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
    setSession: (session: AuthSession | null) => Promise<void>
    isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSessionState] = useState<AuthSession | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasToken, setHasToken] = useState(false)

    useEffect(() => {
        loadSession()

        const handleTokenSet = () => {
            setHasToken(true)
        }

        window.addEventListener('auth-token-set', handleTokenSet)

        return () => {
            window.removeEventListener('auth-token-set', handleTokenSet)
        }
    }, [])

    const loadSession = async () => {
        try {
            setLoading(true)
            setError(null)
            const currentSession = await authService.getSession()
            const storedToken = await authService.getToken()
            setSessionState(currentSession)
            setHasToken(!!storedToken)
        } catch (err) {
            console.error('Error cargando sesión:', err)
            setError('Error al cargar la sesión')
        } finally {
            setLoading(false)
        }
    }

    const signInWithGoogle = async () => {
        try {
            setLoading(true)
            setError(null)
            await authService.signInWithGoogle()
        } catch (err) {
            console.error('Error en autenticación:', err)
            setError(err instanceof Error ? err.message : 'Error de autenticación')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        try {
            setLoading(true)
            setError(null)
            await authService.signOut()
            setSessionState(null)
            setHasToken(false)
        } catch (err) {
            console.error('Error cerrando sesión:', err)
            setError('Error al cerrar sesión')
        } finally {
            setLoading(false)
        }
    }

    const setSession = async (newSession: AuthSession | null) => {
        try {
            setSessionState(newSession)
            if (newSession) {
                // La sesión ya está guardada por el servicio en signInWithGoogle
                // Solo actualizamos el estado local
            }
        } catch (err) {
            console.error('Error estableciendo sesión:', err)
            setError('Error al establecer la sesión')
        }
    }

    const value: AuthContextType = {
        session,
        loading,
        error,
        signInWithGoogle,
        signOut,
        setSession,
        isAuthenticated: hasToken,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

