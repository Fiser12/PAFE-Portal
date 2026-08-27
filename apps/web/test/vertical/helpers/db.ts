/**
 * La BD de los tests verticales es el servicio `test_db` del devcontainer, que
 * inyecta TEST_DATABASE_URL. La suite no se ejecuta fuera del devcontainer.
 */
const url = process.env.TEST_DATABASE_URL

if (!url) {
  throw new Error(
    'Falta TEST_DATABASE_URL: los tests verticales se ejecutan DENTRO del devcontainer ' +
      '(docker exec pafe-portal_devcontainer-app-1 pnpm test:web)',
  )
}

export const TEST_DATABASE_URL = url
