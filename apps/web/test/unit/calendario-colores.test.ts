import { describe, expect, it } from 'vitest'
import { CALENDARIOS, colorDe, textoSobre } from '@/modules/calendario/domain/calendarios'

describe('los colores de los calendarios', () => {
  it('son los mismos que tenía el calendario de Google incrustado', () => {
    expect(CALENDARIOS.map((c) => c.color)).toEqual([
      '#ad1457',
      '#039be5',
      '#7986cb',
      '#9e69af',
      '#c0ca33',
      '#8e24aa',
      '#795548',
      '#a79b8e',
    ])
  })

  it('cada calendario tiene el suyo y no se repiten', () => {
    expect(new Set(CALENDARIOS.map((c) => colorDe(c.id))).size).toBe(CALENDARIOS.length)
  })

  it('sobre los colores oscuros el texto va en blanco', () => {
    expect(textoSobre('#ad1457')).toBe('#ffffff')
    expect(textoSobre('#8e24aa')).toBe('#ffffff')
    expect(textoSobre('#795548')).toBe('#ffffff')
  })

  it('sobre el lima el texto va oscuro, que en blanco no se lee', () => {
    expect(textoSobre('#c0ca33')).toBe('#1f2937')
  })
})
