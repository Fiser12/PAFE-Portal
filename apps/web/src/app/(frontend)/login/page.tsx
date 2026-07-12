'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { signIn } from '@/lib/auth/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await signIn.email({
      email,
      password,
      callbackURL: '/',
    })
    setLoading(false)
    if (signInError) {
      setError('Email o contraseña incorrectos')
      return
    }
    router.push('/')
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" component="h1" textAlign="center">
          Iniciar sesión
        </Typography>

        <Button
          variant="outlined"
          onClick={async () => await signIn.social({ provider: 'google', callbackURL: '/' })}
          sx={{ textTransform: 'none' }}
        >
          Entrar con Google
        </Button>

        <Divider>o</Divider>

        <Box component="form" onSubmit={handleEmailLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={loading} sx={{ textTransform: 'none' }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Las cuentas las crea la asociación. Si no tienes acceso, contacta con tu profesional de
          referencia.
        </Typography>
      </Paper>
    </Container>
  )
}
