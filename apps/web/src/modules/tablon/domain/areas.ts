/** Nombre del grupo que da acceso al área del equipo técnico */
export const GRUPO_LANTALDE = 'lantalde-teknikoa'

/**
 * Las áreas del tablón son las categorías del foro, con su nombre tal cual.
 * Aquí se añaden o se renombran: no hay nada que crear en base de datos.
 *
 * `grupo` reproduce el permiso del foro: allí LANTALDE TEKNIKOA solo la leen
 * los del equipo técnico, no las familias.
 */
interface AreaDeclarada {
  readonly value: string
  readonly label: string
  /** Sin grupo, el área la ve cualquiera con rol */
  readonly grupo?: string
  /**
   * A quién se avisa cuando se publica aquí. Sin esto, el área no avisa a
   * nadie: es lo que hacía el foro, donde solo Berriak PAFE tenía aviso.
   */
  readonly avisaA?: 'familias'
  /** Cómo se veía en el foro antiguo, para que se distingan igual que allí */
  readonly aspecto: AspectoDelArea
}

export type IconoDelArea = 'megafono' | 'conversacion' | 'cerebro' | 'brujula' | 'logo'

export interface AspectoDelArea {
  color: string
  icono: IconoDelArea
  /** Sin relleno, el icono va del color sobre blanco, como IA en el foro antiguo */
  relleno: boolean
}

const NARANJA = '#f0a75c'
const VERDE = '#97ac35'

export const AREAS_DEL_TABLON = [
  {
    value: 'berriak-pafe',
    label: 'Berriak PAFE',
    avisaA: 'familias',
    aspecto: { color: NARANJA, icono: 'megafono', relleno: true },
  },
  {
    value: 'partekatutako-berriak',
    label: 'Partekatutako Berriak',
    aspecto: { color: NARANJA, icono: 'conversacion', relleno: true },
  },
  { value: 'ia', label: 'IA', aspecto: { color: '#987230', icono: 'cerebro', relleno: false } },
  {
    value: 'elkarrizketa-irekiak',
    label: 'Elkarrizketa Irekiak',
    aspecto: { color: VERDE, icono: 'conversacion', relleno: true },
  },
  {
    value: 'pafe-ren-elkarrizketak',
    label: 'PAFE-ren Elkarrizketak',
    aspecto: { color: VERDE, icono: 'brujula', relleno: true },
  },
  {
    value: 'lantalde-teknikoa',
    label: 'LANTALDE TEKNIKOA',
    grupo: GRUPO_LANTALDE,
    aspecto: { color: '#a3d2f6', icono: 'logo', relleno: false },
  },
] as const satisfies readonly AreaDeclarada[]

const NEUTRO: AspectoDelArea = { color: '#64748b', icono: 'conversacion', relleno: true }

export const aspectoDelArea = (valor?: string | null): AspectoDelArea => {
  const area = (AREAS_DEL_TABLON as readonly AreaDeclarada[]).find((a) => a.value === valor)
  return area ? { ...area.aspecto } : NEUTRO
}

export type AreaDelTablon = (typeof AREAS_DEL_TABLON)[number]['value']

const VALORES: readonly string[] = AREAS_DEL_TABLON.map((area) => area.value)

export const esArea = (valor: unknown): valor is AreaDelTablon =>
  typeof valor === 'string' && VALORES.includes(valor)

export const nombreDelArea = (valor?: string | null): string =>
  AREAS_DEL_TABLON.find((area) => area.value === valor)?.label ?? 'el tablón'


/** El grupo que hace falta para llegar a un área, si es que hace falta alguno */
export const grupoDelArea = (valor?: string | null): string | null => {
  const area = (AREAS_DEL_TABLON as readonly AreaDeclarada[]).find((a) => a.value === valor)
  return area?.grupo ?? null
}

/**
 * Las áreas que esta persona puede ver. El staff las ve todas: es quien
 * publica, y no tendría sentido que no viera lo que acaba de escribir.
 */
export const areasVisiblesPara = ({
  grupos,
  esStaff,
}: {
  grupos: string[]
  esStaff: boolean
}): AreaDelTablon[] =>
  AREAS_DEL_TABLON.filter(
    (area) => !grupoDelArea(area.value) || esStaff || grupos.includes(grupoDelArea(area.value)!),
  ).map((area) => area.value)

/** A quién avisa un área, o null si no avisa a nadie */
export const destinatarioDelArea = (valor?: string | null): 'familias' | null => {
  const area = (AREAS_DEL_TABLON as readonly AreaDeclarada[]).find((a) => a.value === valor)
  return area?.avisaA ?? null
}

export const puedeVerArea = (args: {
  area?: string | null
  grupos: string[]
  esStaff: boolean
}): boolean => {
  const grupo = grupoDelArea(args.area)
  return !grupo || args.esStaff || args.grupos.includes(grupo)
}
