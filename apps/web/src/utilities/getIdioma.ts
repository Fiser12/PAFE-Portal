import { cookies } from 'next/headers'
import { COOKIE_IDIOMA, idiomaValido, type CodigoIdioma } from '@/core/localization'

/**
 * El idioma en el que se sirve la página. Lo elige quien navega con el
 * selector de la cabecera; sin elección, castellano.
 */
export const getIdioma = async (): Promise<CodigoIdioma> =>
  idiomaValido((await cookies()).get(COOKIE_IDIOMA)?.value)
