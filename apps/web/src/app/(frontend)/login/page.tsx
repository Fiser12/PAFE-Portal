'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { authClient, signIn } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Escribe tu email arriba para enviarte el enlace')
      return
    }
    setError(null)
    setInfo(null)
    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    })
    if (resetError) {
      setError('No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.')
      return
    }
    setInfo('Si la cuenta existe, te hemos enviado un enlace para establecer la contraseña.')
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
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
    <div className="container flex justify-center py-10 sm:py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={async () => await signIn.social({ provider: 'google', callbackURL: '/' })}
          >
            Entrar con Google
          </Button>

          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            o
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {info && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle className="h-4 w-4 shrink-0" />
                {info}
              </div>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ¿Has olvidado tu contraseña?
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Las cuentas las crea la asociación. Si no tienes acceso, contacta con tu profesional
            de referencia.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
