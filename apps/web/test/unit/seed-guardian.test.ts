import { describe, expect, it } from 'vitest'
import { baseDeDatosLocal } from '@/core/entorno'

describe('baseDeDatosLocal — qué base admite la siembra de prueba', () => {
  it('reconoce las bases del devcontainer', () => {
    expect(baseDeDatosLocal('postgres://devuser:x@devcontainer_db:5432/devcontainer_db')).toBe(true)
    expect(baseDeDatosLocal('postgres://u:x@localhost:5432/pafe')).toBe(true)
    expect(baseDeDatosLocal('postgres://u:x@127.0.0.1:55433/pafe')).toBe(true)
    expect(baseDeDatosLocal('postgres://u:x@test_db:5432/test')).toBe(true)
  })

  it('rechaza la de producción, que es la que sembraba usuarios de prueba', () => {
    expect(
      baseDeDatosLocal(
        'postgres://u:x@ep-holy-bird-abg6gugs-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
      ),
    ).toBe(false)
  })

  it('sin cadena de conexión no se siembra', () => {
    expect(baseDeDatosLocal(undefined)).toBe(false)
    expect(baseDeDatosLocal('')).toBe(false)
  })

  it('no se deja engañar por un host remoto que contenga la palabra', () => {
    expect(baseDeDatosLocal('postgres://u:x@localhost.evil.com:5432/pafe')).toBe(false)
    expect(baseDeDatosLocal('postgres://u:x@db.produccion.example/pafe')).toBe(false)
  })
})
