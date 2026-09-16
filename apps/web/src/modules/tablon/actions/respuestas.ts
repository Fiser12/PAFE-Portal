'use server'

import { revalidatePath } from 'next/cache'
import type { Respuesta } from '@/payload-types'
import { isActiveUser } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import { borrarRespuesta, editarRespuesta, responder, respuestasDe } from '../services'

export interface ResultadoRespuesta {
  ok: boolean
  error?: string
}

export const cargarRespuestas = async (noticiaId: number): Promise<Respuesta[]> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return []
  return respuestasDe({ payload, user, noticiaId })
}

export const enviarRespuesta = async (
  noticiaId: number,
  mensaje: string,
): Promise<ResultadoRespuesta> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return { ok: false, error: 'No tienes acceso al tablón.' }

  try {
    await responder({ payload, user, noticiaId, mensaje })
    revalidatePath(`/noticias/${noticiaId}`)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: textoDelError(error) }
  }
}

export const corregirRespuesta = async (
  respuestaId: number,
  mensaje: string,
): Promise<ResultadoRespuesta> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return { ok: false, error: 'No tienes acceso al tablón.' }

  try {
    await editarRespuesta({ payload, user, respuestaId, mensaje })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: textoDelError(error) }
  }
}

export const retirarRespuesta = async (respuestaId: number): Promise<ResultadoRespuesta> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return { ok: false, error: 'No tienes acceso al tablón.' }

  try {
    await borrarRespuesta({ payload, user, respuestaId })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: textoDelError(error) }
  }
}

const textoDelError = (error: unknown): string => {
  const code = (error as { code?: string })?.code
  if (code === 'mensaje-vacio') return 'Escribe algo antes de enviar.'
  if (code === 'noticia-no-encontrada') return 'Esta noticia ya no está disponible.'
  if (code === 'sin-permiso') return 'No puedes hacer eso.'
  return 'No se pudo guardar. Vuelve a intentarlo.'
}
