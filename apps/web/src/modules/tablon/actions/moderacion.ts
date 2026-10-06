'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/utilities/getSessionUser'
import type { AccionEnBloque } from '../domain/moderacion'
import { archivarNoticia, desarchivarNoticia, moderarNoticias } from '../services'

export const cambiarArchivoDeNoticia = async (
  noticiaId: number,
  archivada: boolean,
): Promise<{ ok: boolean }> => {
  const { payload, user } = await getSessionUser()
  if (!user) return { ok: false }
  try {
    const args = { payload, user, noticiaId }
    await (archivada ? archivarNoticia(args) : desarchivarNoticia(args))
    revalidatePath(`/noticias/${noticiaId}`)
    revalidatePath('/foro')
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export const moderarEnBloque = async (
  ids: number[],
  accion: AccionEnBloque,
): Promise<{ ok: boolean }> => {
  const { payload, user } = await getSessionUser()
  if (!user) return { ok: false }
  try {
    await moderarNoticias({ payload, user, ids, accion })
    return { ok: true }
  } catch (error) {
    console.error('[foro] No se pudo moderar en bloque', error)
    return { ok: false }
  } finally {
    revalidatePath('/foro')
  }
}
