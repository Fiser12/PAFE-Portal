'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button, Modal, Select, toast, useConfig, useModal } from '@payloadcms/ui'
import { invitar } from '../actions'
import type { EstadoDeInvitacion, ResultadoDeInvitacion } from '../services'
import './InvitarPersonas.css'

const MODAL = 'invitar-personas'

type Opcion = Record<string, unknown> & { value: string; label: string }

const ESTADOS: Record<EstadoDeInvitacion, string> = {
  enviada: 'Enviada',
  'ya-tiene-cuenta': 'Ya tiene cuenta',
  'correo-no-valido': 'No es un correo',
  error: 'No se ha podido enviar',
}

function Resultado({ resultado }: { resultado: ResultadoDeInvitacion }) {
  const copiar = async () => {
    if (!resultado.url) return
    await navigator.clipboard.writeText(resultado.url)
    toast.success('Enlace copiado')
  }

  return (
    <li className={`invitar-personas__resultado invitar-personas__resultado--${resultado.estado}`}>
      <span>{resultado.email}</span>
      <span>
        {ESTADOS[resultado.estado]}
        {resultado.url && (
          <Button buttonStyle="transparent" size="small" onClick={copiar}>
            Copiar enlace
          </Button>
        )}
      </span>
    </li>
  )
}

/**
 * Sustituye al botón «Invite» de payload-auth, que repetía el mismo enlace en
 * todas las invitaciones hasta recargar la página. Aquí cada correo recibe el
 * suyo, generado en el servidor.
 */
export function InvitarPersonas({ roles }: { roles: Opcion[] }) {
  const pathname = usePathname()
  const {
    config: {
      routes: { admin: rutaAdmin },
      admin: { user: coleccionDeUsuarios },
    },
  } = useConfig()
  const { openModal, closeModal } = useModal()
  const [texto, setTexto] = useState('')
  const [rol, setRol] = useState<Opcion | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoDeInvitacion[]>([])

  if (pathname !== `${rutaAdmin}/collections/${coleccionDeUsuarios}`) return null

  const abrir = () => {
    setTexto('')
    setRol(undefined)
    setResultados([])
    openModal(MODAL)
  }

  const enviar = async () => {
    if (!rol) return
    setEnviando(true)
    try {
      const respuesta = await invitar(texto, rol.value)
      if (!respuesta.ok) {
        toast.error('No tienes permiso para invitar con ese rol')
        return
      }
      setResultados(respuesta.resultados)
      const enviadas = respuesta.resultados.filter((r) => r.estado === 'enviada').length
      if (enviadas > 0) setTexto('')
      toast.success(enviadas === 1 ? '1 invitación enviada' : `${enviadas} invitaciones enviadas`)
    } catch {
      toast.error('No se han podido enviar las invitaciones')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Button
        className="invitar-personas__abrir"
        buttonStyle="pill"
        size="small"
        type="button"
        onClick={abrir}
      >
        Invitar personas
      </Button>
      <Modal slug={MODAL} className="invitar-personas" closeOnBlur>
        <div className="invitar-personas__caja">
          <h2>Invitar personas</h2>
          <p>
            Pega los correos, uno por línea o separados por comas, y elige el rol. Cada persona
            recibe su propio enlace para crear la cuenta. Las que aún no lo han usado salen en
            «Invitaciones pendientes».
          </p>
          <Select
            options={roles}
            value={rol}
            placeholder="Rol"
            onChange={(opcion) =>
              setRol(roles.find((r) => !Array.isArray(opcion) && r.value === opcion.value))
            }
          />
          <textarea
            className="invitar-personas__correos"
            aria-label="Correos"
            placeholder={'familia@ejemplo.com\notra@ejemplo.com'}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
          <div className="invitar-personas__botones">
            <Button buttonStyle="secondary" type="button" onClick={() => closeModal(MODAL)}>
              Cerrar
            </Button>
            <Button type="button" onClick={enviar} disabled={enviando || !rol || !texto.trim()}>
              {enviando ? 'Enviando…' : 'Enviar invitaciones'}
            </Button>
          </div>
          {resultados.length > 0 && (
            <ul className="invitar-personas__resultados" aria-live="polite">
              {resultados.map((resultado) => (
                <Resultado key={resultado.email} resultado={resultado} />
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  )
}
