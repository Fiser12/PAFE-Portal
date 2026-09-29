import { describe, expect, it } from 'vitest'
import { AREAS_DEL_TABLON, aspectoDelArea } from '@/modules/tablon/domain/areas'

describe('cada área del foro se ve como en el foro antiguo', () => {
  it('todas tienen su color y su icono', () => {
    for (const area of AREAS_DEL_TABLON) {
      expect(aspectoDelArea(area.value).color).toMatch(/^#[0-9a-f]{6}$/)
      expect(aspectoDelArea(area.value).icono).toBeTruthy()
    }
  })

  it('las de noticias van en naranja', () => {
    expect(aspectoDelArea('berriak-pafe')).toMatchObject({ color: '#f0a75c', icono: 'megafono' })
    expect(aspectoDelArea('partekatutako-berriak')).toMatchObject({
      color: '#f0a75c',
      icono: 'conversacion',
    })
  })

  it('las de conversación van en verde', () => {
    expect(aspectoDelArea('elkarrizketa-irekiak')).toMatchObject({
      color: '#97ac35',
      icono: 'conversacion',
    })
    expect(aspectoDelArea('pafe-ren-elkarrizketak')).toMatchObject({
      color: '#97ac35',
      icono: 'brujula',
    })
  })

  it('IA lleva el cerebro en marrón y sin fondo', () => {
    expect(aspectoDelArea('ia')).toEqual({ color: '#987230', icono: 'cerebro', relleno: false })
  })

  it('el equipo técnico lleva el logo de PAFE y su azul', () => {
    expect(aspectoDelArea('lantalde-teknikoa')).toMatchObject({ color: '#a3d2f6', icono: 'logo' })
  })

  it('un área desconocida no rompe: sale neutra', () => {
    expect(aspectoDelArea('no-existe')).toEqual({ color: '#64748b', icono: 'conversacion', relleno: true })
  })
})
