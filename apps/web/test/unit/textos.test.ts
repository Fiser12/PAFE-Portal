import { describe, expect, it } from 'vitest'
import { IDIOMAS } from '@/core/localization'
import { textosDe } from '@/core/textos'

describe('los textos de la interfaz', () => {
  it('cada idioma tiene exactamente las mismas claves', () => {
    const claves = IDIOMAS.map(({ code }) => Object.keys(textosDe(code)).sort())
    for (const otras of claves.slice(1)) expect(otras).toEqual(claves[0])
  })

  it('ninguna cadena se queda vacía', () => {
    for (const { code } of IDIOMAS) {
      for (const [clave, valor] of Object.entries(textosDe(code))) {
        expect(valor.trim(), `${code}.${clave}`).not.toBe('')
      }
    }
  })

  // Palabras que se escriben igual en los dos idiomas: que coincidan no
  // significa que estén sin traducir.
  const IGUALES_A_PROPOSITO = new Set(['tipoPrograma', 'navMoodle', 'catalogoMaterialUno', 'catalogoMaterialVarios'])

  it('el euskera no es una copia del castellano', () => {
    const es = textosDe('es')
    const eu = textosDe('eu')
    const iguales = Object.keys(es).filter(
      (k) =>
        !IGUALES_A_PROPOSITO.has(k) &&
        es[k as keyof typeof es] === eu[k as keyof typeof eu],
    )
    expect(iguales, `sin traducir: ${iguales.join(', ')}`).toHaveLength(0)
  })
})
