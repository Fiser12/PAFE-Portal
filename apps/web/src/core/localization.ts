import type { Config } from 'payload'

/** Cookie donde se guarda el idioma elegido. La lee el servidor en cada página. */
export const COOKIE_IDIOMA = 'pafe-idioma'

export type CodigoIdioma = 'es' | 'eu'

export const IDIOMAS = [
  { code: 'es', label: 'Castellano', corto: 'ES' },
  { code: 'eu', label: 'Euskera', corto: 'EU' },
] as const satisfies readonly { code: CodigoIdioma; label: string; corto: string }[]

export const IDIOMA_POR_DEFECTO: CodigoIdioma = 'es'

/**
 * Traduce lo que venga de la cookie a un idioma que exista. Cualquier cosa
 * rara (vacío, otro idioma, basura) cae en castellano: es preferible a que la
 * página reviente porque alguien editó la cookie.
 */
export const idiomaValido = (valor: unknown): CodigoIdioma =>
  IDIOMAS.some((idioma) => idioma.code === valor) ? (valor as CodigoIdioma) : IDIOMA_POR_DEFECTO

/**
 * El contenido se escribe en castellano y en euskera. Lo que falte en euskera
 * se ve en castellano: sin esto el catálogo aparecería medio vacío desde el
 * primer día.
 *
 * Vive aquí y no dentro de payload.config porque el arnés de tests construye
 * su propia config: si no lo comparten, los tests corren sin idiomas y no se
 * prueba nada.
 */
export const localization: Config['localization'] = {
  locales: IDIOMAS.map(({ code, label }) => ({ code, label })),
  defaultLocale: IDIOMA_POR_DEFECTO,
  fallback: true,
}
