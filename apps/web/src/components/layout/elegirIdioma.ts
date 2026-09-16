'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { COOKIE_IDIOMA, idiomaValido } from '@/core/localization'

const UN_ANO = 60 * 60 * 24 * 365

/**
 * Fija el idioma y tira el caché de rutas. Escribir la cookie desde el
 * navegador no basta: Next sirve la página desde su caché de ruta y el
 * servidor no vuelve a leerla.
 */
export async function elegirIdioma(code: string): Promise<void> {
  const idioma = idiomaValido(code)
  const almacen = await cookies()
  almacen.set(COOKIE_IDIOMA, idioma, {
    path: '/',
    maxAge: UN_ANO,
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
