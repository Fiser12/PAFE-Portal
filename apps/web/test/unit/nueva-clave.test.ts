import { describe, expect, it } from 'vitest'
import { motivoDelFallo } from '@/lib/auth/nuevaClave'

describe('por qué no se ha podido guardar la contraseña', () => {
  it('solo es «enlace caducado» cuando el enlace ya no vale', () => {
    expect(motivoDelFallo({ code: 'INVALID_TOKEN' })).toBe('enlace')
  })

  it('una contraseña corta o larga se dice tal cual', () => {
    expect(motivoDelFallo({ code: 'PASSWORD_TOO_SHORT' })).toBe('corta')
    expect(motivoDelFallo({ code: 'PASSWORD_TOO_LONG' })).toBe('larga')
  })

  it('cualquier otro fallo no se hace pasar por un enlace caducado', () => {
    expect(motivoDelFallo({ code: 'INVALID_ORIGIN' })).toBe('otro')
    expect(motivoDelFallo({})).toBe('otro')
    expect(motivoDelFallo(null)).toBe('otro')
  })
})
