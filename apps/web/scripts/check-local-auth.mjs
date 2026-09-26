import assert from 'node:assert/strict'

const base = new URL(process.env.TEST_BASE_URL || 'http://localhost:3000')
assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Solo se comprueba el entorno local')
const response = await fetch(new URL('/api/auth/sign-in/social', base), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base.origin },
  body: JSON.stringify({ provider: 'google', callbackURL: '/', disableRedirect: true }),
  signal: AbortSignal.timeout(15000),
})
assert.equal(response.status, 200, `El inicio de Google responde ${response.status}`)
const { url } = await response.json()
const callback = new URL(url).searchParams.get('redirect_uri')
const expected = new URL('/api/auth/callback/google', base).href
assert.equal(
  callback,
  expected,
  'El proceso de Next está usando una URL de retorno distinta del puerto local',
)
console.log(`PASS: Google devuelve a ${callback}`)
