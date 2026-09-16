import { describe, expect, it } from 'vitest'
import { correoDeNoticia } from '@/modules/tablon/domain/avisos'

describe('correoDeNoticia — el texto que recibe quien está suscrito', () => {
  it('lleva el área, el título y el enlace', () => {
    const correo = correoDeNoticia({
      title: 'Reunión del martes',
      area: 'Avisos generales',
      url: 'https://pafe-formakuntza.com/noticias/7',
    })

    expect(correo.subject).toBe('Avisos generales: Reunión del martes')
    expect(correo.text).toContain('https://pafe-formakuntza.com/noticias/7')
  })

  it('escapa el HTML del título: un & o un < no pueden romper el correo', () => {
    const correo = correoDeNoticia({
      title: 'Padres & madres <urgente>',
      area: 'Avisos',
      url: 'https://pafe-formakuntza.com/noticias/7',
    })

    expect(correo.html).not.toContain('<urgente>')
    expect(correo.html).toContain('Padres &amp; madres &lt;urgente&gt;')
    expect(correo.text).toContain('Padres & madres <urgente>')
  })
})
