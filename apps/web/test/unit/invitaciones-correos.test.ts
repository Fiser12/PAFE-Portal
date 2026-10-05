import { describe, expect, it } from 'vitest'
import {
  leerCorreos,
  puedeInvitar,
  valeParaElCorreo,
} from '@/modules/invitaciones/domain/invitacion'

describe('la lista de correos que se pega', () => {
  it('acepta uno por línea, separados por comas, por punto y coma o por espacios', () => {
    expect(leerCorreos('a@pafe.eus\nb@pafe.eus, c@pafe.eus; d@pafe.eus e@pafe.eus').validos).toEqual([
      'a@pafe.eus',
      'b@pafe.eus',
      'c@pafe.eus',
      'd@pafe.eus',
      'e@pafe.eus',
    ])
  })

  it('quita espacios y mayúsculas, que es como se guarda la cuenta', () => {
    expect(leerCorreos('  Maider.Susperregui@Gmail.COM  ').validos).toEqual([
      'maider.susperregui@gmail.com',
    ])
  })

  it('no repite a nadie aunque venga dos veces', () => {
    expect(leerCorreos('a@pafe.eus\nA@pafe.eus\na@pafe.eus').validos).toEqual(['a@pafe.eus'])
  })

  it('separa lo que no es un correo para poder avisar', () => {
    expect(leerCorreos('a@pafe.eus, Maider, b@pafe, @pafe.eus')).toEqual({
      validos: ['a@pafe.eus'],
      invalidos: ['Maider', 'b@pafe', '@pafe.eus'],
    })
  })

  it('acepta el formato de una libreta de direcciones: «Nombre <correo>»', () => {
    expect(leerCorreos('Maider <maider@pafe.eus>, Rocío <rocio@pafe.eus>')).toEqual({
      validos: ['maider@pafe.eus', 'rocio@pafe.eus'],
      invalidos: [],
    })
  })

  it('una lista vacía no da nada', () => {
    expect(leerCorreos('  \n , ')).toEqual({ validos: [], invalidos: [] })
  })
})

describe('quién invita y con qué rol', () => {
  const admin = { email: 'a@pafe.test', role: ['admin'] }

  it('un admin invita con cualquier rol del portal', () => {
    for (const rol of ['familia', 'profesional', 'admin-news', 'admin']) {
      expect(puedeInvitar(admin, rol)).toBe(true)
    }
  })

  it('nadie invita con el rol de impersonar', () => {
    expect(puedeInvitar(admin, 'impersonar')).toBe(false)
  })

  it('un rol que no existe no vale', () => {
    expect(puedeInvitar(admin, 'jefe')).toBe(false)
  })

  it('quien no es admin no invita', () => {
    expect(puedeInvitar({ email: 'f@pafe.test', role: ['familia'] }, 'familia')).toBe(false)
    expect(puedeInvitar({ email: 'u@pafe.test', role: ['admin-users'] }, 'familia')).toBe(false)
    expect(puedeInvitar(null, 'familia')).toBe(false)
  })
})

describe('para qué correo vale una invitación', () => {
  const para = (email: string | null) => ({ email })

  it('para el correo al que se mandó', () => {
    expect(valeParaElCorreo(para('maider@pafe.eus'), 'maider@pafe.eus')).toBe(true)
  })

  it('aunque se escriba con mayúsculas o espacios', () => {
    expect(valeParaElCorreo(para('maider@pafe.eus'), '  Maider@PAFE.eus ')).toBe(true)
  })

  it('no para otro, por ejemplo con una errata', () => {
    expect(valeParaElCorreo(para('m.cardenas.pafp@gmail.com'), 'm.cardenas.pafp@fmail.com')).toBe(
      false,
    )
  })

  it('una invitación antigua, sin correo, vale para cualquiera', () => {
    expect(valeParaElCorreo(para(null), 'quien-sea@pafe.eus')).toBe(true)
  })
})
