'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/utilities/getSessionUser'
import { archivarNoticia, desarchivarNoticia } from '../services'

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
