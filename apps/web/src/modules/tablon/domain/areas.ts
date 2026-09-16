/**
 * Las áreas del tablón, que replican las secciones del foro. Aquí se añaden o
 * se renombran: no hay nada que crear en base de datos.
 */
export const AREAS_DEL_TABLON = [
  { value: 'avisos', label: 'Avisos generales' },
  { value: 'formacion', label: 'Formación' },
  { value: 'actividades', label: 'Actividades' },
  { value: 'recursos', label: 'Recursos' },
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
