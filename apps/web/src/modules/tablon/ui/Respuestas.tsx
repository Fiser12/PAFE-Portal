'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Respuesta, User } from '@/payload-types'
import { cargarRespuestas, enviarRespuesta, retirarRespuesta } from '../actions/respuestas'

const fecha = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : ''

const quien = (autor: Respuesta['author']): string =>
  typeof autor === 'object' && autor !== null ? ((autor as User).name ?? 'Alguien') : 'Alguien'

export function Respuestas({ noticiaId, usuarioId }: { noticiaId: number; usuarioId: number }) {
  const { data, isLoading, mutate } = useSWR(['respuestas', noticiaId], () =>
    cargarRespuestas(noticiaId),
  )
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const respuestas = data ?? []

  const enviar = async () => {
    setEnviando(true)
    setError(null)
    const resultado = await enviarRespuesta(noticiaId, mensaje)
    setEnviando(false)

    if (!resultado.ok) {
      setError(resultado.error ?? 'No se pudo enviar.')
      return
    }
    setMensaje('')
    void mutate()
  }

  const retirar = async (id: number) => {
    const resultado = await retirarRespuesta(id)
    if (resultado.ok) void mutate()
    else setError(resultado.error ?? 'No se pudo retirar.')
  }

  return (
    <section className="mt-10 border-t pt-6">
      <h2 className="mb-4 text-lg font-semibold">
        Respuestas{respuestas.length > 0 && ` (${respuestas.length})`}
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : respuestas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no ha respondido nadie.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {respuestas.map((respuesta) => (
            <li key={respuesta.id} className="rounded-md border p-4">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {quien(respuesta.author)} · {fecha(respuesta.createdAt)}
                </span>
                {Number(
                  typeof respuesta.author === 'object' && respuesta.author !== null
                    ? respuesta.author.id
                    : respuesta.author,
                ) === usuarioId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => retirar(Number(respuesta.id))}
                    title="Retirar mi respuesta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Retirar</span>
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm">{respuesta.mensaje}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <Textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe tu respuesta…"
          rows={3}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="self-end" onClick={enviar} disabled={enviando || !mensaje.trim()}>
          {enviando ? 'Enviando…' : 'Responder'}
        </Button>
      </div>
    </section>
  )
}
