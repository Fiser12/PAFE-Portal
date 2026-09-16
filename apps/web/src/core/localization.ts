import type { Config } from 'payload'

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
  locales: [
    { code: 'es', label: 'Castellano' },
    { code: 'eu', label: 'Euskera' },
  ],
  defaultLocale: 'es',
  fallback: true,
}
