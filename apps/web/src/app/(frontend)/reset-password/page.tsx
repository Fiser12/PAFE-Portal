'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { motivoDelFallo } from '@/lib/auth/nuevaClave'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTextos } from '@/components/IdiomaProvider'

function Aviso({ tipo, children }: { tipo: 'error' | 'ok'; children: React.ReactNode }) {
  const Icono = tipo === 'error' ? AlertCircle : CheckCircle
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={
        tipo === 'error'
          ? 'flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          : 'flex items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400'
      }
    >
      <Icono className="h-4 w-4 shrink-0" />
      {children}
    </div>
  )
}

function PedirOtroEnlace() {
  const t = useTextos()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [fallo, setFallo] = useState(false)

  const pedir = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try {
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })
      setFallo(Boolean(error))
      setEnviado(!error)
    } catch {
      setFallo(true)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) return <Aviso tipo="ok">{t.claveOtroEnviado}</Aviso>

  return (
    <form onSubmit={pedir} className="flex flex-col gap-3">
      <Label htmlFor="email">{t.claveOtroEnlace}</Label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      {fallo && <Aviso tipo="error">{t.loginCorreoFallo}</Aviso>}
      <Button type="submit" disabled={enviando}>
        {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t.claveMandarOtro}
      </Button>
    </form>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const t = useTextos()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [enlaceGastado, setEnlaceGastado] = useState(false)
  // better-auth redirige aquí con ?error=INVALID_TOKEN si el enlace no vale
  const enlaceRoto = !token || Boolean(searchParams.get('error')) || enlaceGastado

  const mensajes = {
    corta: t.claveCorta,
    larga: t.claveLarga,
    otro: t.claveErrorGuardar,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t.claveNoCoinciden)
      return
    }
    setLoading(true)
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: token ?? undefined,
      })
      if (resetError) {
        const motivo = motivoDelFallo(resetError)
        if (motivo === 'enlace') setEnlaceGastado(true)
        else setError(mensajes[motivo])
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError(mensajes.otro)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex justify-center py-12 sm:py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-xl">{t.claveEstablecer}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {enlaceRoto ? (
            <>
              <Aviso tipo="error">{t.claveEnlaceCaducado}</Aviso>
              <PedirOtroEnlace />
              <Button variant="outline" onClick={() => router.push('/login')}>
                {t.claveVolver}
              </Button>
            </>
          ) : done ? (
            <Aviso tipo="ok">{t.claveGuardada}</Aviso>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">{t.claveNueva}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">{t.claveRepite}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {error && <Aviso tipo="error">{error}</Aviso>}
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t.claveGuardando : t.claveGuardar}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
