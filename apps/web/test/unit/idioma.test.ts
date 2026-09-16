import { describe, expect, it } from 'vitest'
import { IDIOMAS, IDIOMA_POR_DEFECTO, idiomaValido, localization } from '@/core/localization'

describe('el idioma elegido', () => {
  it('acepta los idiomas que existen', () => {
    expect(idiomaValido('es')).toBe('es')
    expect(idiomaValido('eu')).toBe('eu')
  })

  it('cae en castellano cuando no hay cookie', () => {
    expect(idiomaValido(undefined)).toBe(IDIOMA_POR_DEFECTO)
    expect(idiomaValido(null)).toBe('es')
    expect(idiomaValido('')).toBe('es')
  })

  it('cae en castellano si alguien manipula la cookie', () => {
    expect(idiomaValido('fr')).toBe('es')
    expect(idiomaValido('../../etc/passwd')).toBe('es')
    expect(idiomaValido(42)).toBe('es')
  })

  it('los idiomas del selector son los mismos que los de Payload', () => {
    expect(localization && 'locales' in localization ? localization.locales : []).toHaveLength(
      IDIOMAS.length,
    )
    const codigosPayload = (localization as { locales: { code: string }[] }).locales.map(
      (l) => l.code,
    )
    expect(codigosPayload).toEqual(IDIOMAS.map((i) => i.code))
  })
})
