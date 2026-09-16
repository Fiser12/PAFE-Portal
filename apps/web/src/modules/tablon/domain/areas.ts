/**
 * Las áreas del tablón son las categorías del foro, con su nombre tal cual.
 * Aquí se añaden o se renombran: no hay nada que crear en base de datos.
 */
export const AREAS_DEL_TABLON = [
  { value: 'berriak-pafe', label: 'Berriak PAFE' },
  { value: 'partekatutako-berriak', label: 'Partekatutako Berriak' },
  { value: 'ia', label: 'IA' },
  { value: 'elkarrizketa-irekiak', label: 'Elkarrizketa Irekiak' },
  { value: 'pafe-ren-elkarrizketak', label: 'PAFE-ren Elkarrizketak' },
  { value: 'lantalde-teknikoa', label: 'LANTALDE TEKNIKOA' },
] as const

export type AreaDelTablon = (typeof AREAS_DEL_TABLON)[number]['value']

const VALORES: readonly string[] = AREAS_DEL_TABLON.map((area) => area.value)

export const esArea = (valor: unknown): valor is AreaDelTablon =>
  typeof valor === 'string' && VALORES.includes(valor)

export const nombreDelArea = (valor?: string | null): string =>
  AREAS_DEL_TABLON.find((area) => area.value === valor)?.label ?? 'el tablón'

/** Solo se sigue lo que es un área del tablón, aunque pidan seguir otra cosa */
export const soloAreas = (pedidas: string[]): AreaDelTablon[] =>
  [...new Set(pedidas)].filter(esArea)
