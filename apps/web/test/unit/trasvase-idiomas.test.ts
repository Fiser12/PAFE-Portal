/**
 * Guardián: la lista del script de trasvase tiene que cubrir todos los campos
 * localizados. Si alguien marca uno nuevo y se olvida de añadirlo aquí, su
 * contenido se pierde en el despliegue sin que nada avise.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { collections } from '@/payload/collections'
import type { Field } from 'payload'

const camposLocalizados = (fields: Field[]): string[] =>
  fields.flatMap((field) => {
    const propios = 'name' in field && (field as { localized?: boolean }).localized
      ? [field.name as string]
      : []
    const hijos = 'fields' in field && Array.isArray(field.fields)
      ? camposLocalizados(field.fields as Field[])
      : []
    return [...propios, ...hijos]
  })

/** Lo que el script dice que salva, leído de su propia lista */
const loQueSalvaElScript = (): Map<string, string[]> => {
  const fuente = readFileSync(new URL('../../scripts/trasvase-idiomas.ts', import.meta.url), 'utf8')
  const bloque = fuente.split('const TRASVASE')[1]?.split('\n]')[0] ?? ''
  const salvado = new Map<string, string[]>()
  for (const linea of bloque.matchAll(/tabla: '([^']+)', columnas: \[([^\]]*)\]/g)) {
    salvado.set(
      linea[1]!,
      [...linea[2]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!),
    )
  }
  return salvado
}

/** De slug de colección a nombre de tabla, como lo hace Payload */
const tablaDe = (slug: string) => slug.replace(/-/g, '_')

describe('el trasvase cubre todo lo que se traduce', () => {
  it('ningún campo localizado se queda fuera del script', () => {
    const salvado = loQueSalvaElScript()
    const olvidados: string[] = []

    for (const coleccion of collections) {
      const localizados = camposLocalizados(coleccion.fields as Field[])
      if (localizados.length === 0) continue

      const tabla = tablaDe(coleccion.slug)
      const cubiertos = salvado.get(tabla) ?? []
      for (const campo of localizados) {
        // `_locales` guarda los nombres con guion bajo, como las columnas
        const columna = campo.replace(/([A-Z])/g, '_$1').toLowerCase()
        if (!cubiertos.includes(columna) && !cubiertos.includes(campo)) {
          olvidados.push(`${tabla}.${campo}`)
        }
      }
    }

    expect(olvidados).toEqual([])
  })
})
