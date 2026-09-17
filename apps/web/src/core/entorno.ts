/**
 * Los scripts que apuntan a producción se lanzan desde el devcontainer y heredan
 * su `.env.local`, donde `SEED_MOCK_DATA` está a true: sin esta comprobación, el
 * arranque sembraba usuarios de prueba con contraseña conocida en la base real.
 */
export const baseDeDatosLocal = (cadena: string | undefined): boolean => {
  if (!cadena) return false
  const anfitrion = cadena.match(/@([^:/?]+)/)?.[1]
  return ['localhost', '127.0.0.1', 'db', 'devcontainer_db', 'test_db'].includes(anfitrion ?? '')
}
