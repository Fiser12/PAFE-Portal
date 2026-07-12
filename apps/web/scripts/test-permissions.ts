/**
 * Test e2e del sistema de permisos contra la API REST.
 *
 * Requisitos:
 *  - servidor en marcha (pnpm dev o pnpm start)
 *  - usuarios de prueba creados: pnpm payload run scripts/seed-test-users.ts
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm test:permissions
 *
 * Sale con código 1 si cualquier comprobación falla.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const PASSWORD = 'test1234!'

// Limpia locks de documentos de sesiones anteriores (provocan 423 en PATCH)
{
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'payload-locked-documents',
    where: { id: { exists: true } },
  })
}

let failures = 0
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${ok || !detail ? '' : ` — ${detail}`}`)
  if (!ok) failures++
}

const getCookies = (res: Response): string =>
  (res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''])
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ')

const api = async (
  cookie: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: any }> => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // better-auth valida Origin contra trustedOrigins
      origin: BASE,
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let json: any = null
  try {
    json = await res.json()
  } catch {
    /* respuestas sin cuerpo */
  }
  return { status: res.status, json }
}

const login = async (email: string): Promise<{ cookie: string; id: string | number }> => {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: BASE },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const cookie = getCookies(res)
  const json = (await res.json()) as { user?: { id: string | number } }
  if (!res.ok || !json.user?.id) throw new Error(`login falló para ${email} (${res.status})`)
  return { cookie, id: json.user.id }
}

// --- 1. Registro deshabilitado -------------------------------------------
{
  const { json } = await api('', 'POST', '/api/auth/sign-up/email', {
    email: 'intruso@test.local',
    password: PASSWORD,
    name: 'Intruso',
  })
  check(
    'registro email/password deshabilitado',
    json?.code === 'EMAIL_PASSWORD_SIGN_UP_DISABLED',
    JSON.stringify(json),
  )
}

// --- 2. Logins por rol -----------------------------------------------------
const admin = await login('admin@test.local')
const prof = await login('prof@test.local')
const familia = await login('familia@test.local')
const sinRol = await login('sinrol@test.local')
check('login email/password de los 4 usuarios de prueba', true)

// --- 3. Visibilidad de usuarios -------------------------------------------
{
  const { json } = await api(familia.cookie, 'GET', '/api/users')
  check(
    'familia solo se ve a sí misma en /api/users',
    json?.totalDocs === 1 && json?.docs?.[0]?.email === 'familia@test.local',
    `totalDocs=${json?.totalDocs}`,
  )
}
{
  const { json } = await api(prof.cookie, 'GET', '/api/users')
  check('profesional ve todos los usuarios', (json?.totalDocs ?? 0) >= 4, `totalDocs=${json?.totalDocs}`)
}

// --- 4. Grupos: solo staff escribe -----------------------------------------
{
  const { status } = await api(familia.cookie, 'POST', '/api/groups', { name: 'grupo-ilegal' })
  check('familia NO puede crear grupos', status === 403, `status=${status}`)
}
{
  const { status, json } = await api(prof.cookie, 'POST', '/api/groups', { name: 'grupo-test-permisos' })
  check('profesional puede crear grupos', status === 201, `status=${status}`)
  if (status === 201 && json?.doc?.id) {
    const del = await api(prof.cookie, 'DELETE', `/api/groups/${json.doc.id}`)
    check('profesional puede borrar grupos (limpieza)', del.status === 200, `status=${del.status}`)
  }
}

// --- 5. Anti-escalada de roles ---------------------------------------------
{
  const { status } = await api(familia.cookie, 'PATCH', `/api/users/${familia.id}`, {
    role: ['admin'],
  })
  check('familia NO puede autopromoverse a admin', status === 403, `status=${status}`)
}
{
  const { status } = await api(prof.cookie, 'PATCH', `/api/users/${familia.id}`, {
    role: [],
  })
  check('profesional puede quitar el rol a una familia', status === 200, `status=${status}`)
  const restore = await api(prof.cookie, 'PATCH', `/api/users/${familia.id}`, {
    role: ['familia'],
  })
  check('profesional puede asignar el rol familia', restore.status === 200, `status=${restore.status}`)
}
{
  const { status } = await api(prof.cookie, 'PATCH', `/api/users/${familia.id}`, {
    role: ['admin'],
  })
  check('profesional NO puede promover a admin', status === 403, `status=${status}`)
}
{
  const { status } = await api(prof.cookie, 'PATCH', `/api/users/${admin.id}`, {
    name: 'Hackeado',
  })
  check('profesional NO puede editar a un admin', status === 403, `status=${status}`)
}

// --- 6. Usuario sin rol (recién registrado): sin acceso ---------------------
{
  const { status } = await api(sinRol.cookie, 'POST', '/api/reservation', {
    item: 1,
    user: sinRol.id,
    reservationDate: new Date().toISOString(),
  })
  check('usuario sin rol NO puede reservar', status === 403, `status=${status}`)
}
{
  const { status } = await api(sinRol.cookie, 'GET', '/api/cases')
  check('usuario sin rol NO puede listar casos', status === 403, `status=${status}`)
}

// --- 7. Catálogo: lectura pública, escritura staff --------------------------
{
  const { status } = await api('', 'GET', '/api/catalog-item')
  check('catálogo legible sin sesión', status === 200, `status=${status}`)
}
{
  const { status } = await api('', 'POST', '/api/catalog-item', { title: 'x' })
  check('anónimo NO puede crear items de catálogo', status === 403, `status=${status}`)
}
{
  const { status } = await api(familia.cookie, 'POST', '/api/catalog-item', { title: 'x' })
  check('familia NO puede crear items de catálogo', status === 403, `status=${status}`)
}

// ---------------------------------------------------------------------------
console.log(failures === 0 ? '\nTODO OK' : `\n${failures} comprobaciones fallidas`)
process.exit(failures === 0 ? 0 : 1)
