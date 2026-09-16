import { generarIndiceDeFichas } from './wiki-fichas.mjs'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const wikiRoot = join(dirname(webRoot), 'wiki')
const destination = join(webRoot, 'public', 'wiki')

execFileSync('bash', [join(wikiRoot, 'okf', 'build-site.sh')], { stdio: 'inherit' })

const built = join(wikiRoot, 'public')
if (!existsSync(built)) {
  throw new Error(`El build de la wiki no ha dejado nada en ${built}`)
}

rmSync(destination, { recursive: true, force: true })
cpSync(built, destination, { recursive: true })
absolutizarEnlaces(destination)
publicarIndicesDeSeccion(destination)
corregirRutasDeLosScripts(destination)
generarIndiceDeFichas()
console.log(`[wiki] publicada en ${destination}`)

/**
 * Quartz enlaza en relativo y Cloudflare Pages servía cada página con barra
 * final, así que el navegador resolvía bien. Aquí no: /wiki y /wiki/libros se
 * sirven sin barra, y una ruta como ./index.css acaba buscándose en la raíz del
 * portal. Se reescriben a rutas absolutas bajo /wiki al publicar.
 */
function absolutizarEnlaces(raiz) {
  const ficheros = []
  const recorrer = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, entrada.name)
      if (entrada.isDirectory()) recorrer(ruta)
      else if (entrada.name.endsWith('.html')) ficheros.push(ruta)
    }
  }
  recorrer(raiz)

  for (const fichero of ficheros) {
    const carpeta = dirname(fichero).slice(raiz.length).replace(/\\/g, '/')
    const base = new URL(`http://x/wiki${carpeta}/`)
    const html = readFileSync(fichero, 'utf8')
      .replace(
        /(href|src)="(\.\.?\/[^"]*)"/g,
        (_, atributo, valor) => `${atributo}="${new URL(valor, base).pathname}"`,
      )
      // Los scripts inline piden sus datos en relativo: el explorador carga así
      // contentIndex.json y sin esto se queda vacío
      .replace(
        /fetch\((["'])(\.\.?\/[^"']*)\1\)/g,
        (_, comilla, valor) => `fetch(${comilla}${new URL(valor, base).pathname}${comilla})`,
      )
    writeFileSync(fichero, html, 'utf8')
  }
  console.log(`[wiki] enlaces absolutos en ${ficheros.length} páginas`)
}

/**
 * Cada sección es una carpeta con index.html, pero la URL que enlaza Quartz es
 * /wiki/libros, sin barra. Se publica una copia como libros.html para que la
 * reescritura de next.config la encuentre.
 */
function publicarIndicesDeSeccion(raiz) {
  let copiados = 0
  const recorrer = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      if (!entrada.isDirectory()) continue
      const carpeta = join(dir, entrada.name)
      recorrer(carpeta)
      const indice = join(carpeta, 'index.html')
      if (existsSync(indice)) {
        writeFileSync(`${carpeta}.html`, readFileSync(indice, 'utf8'), 'utf8')
        copiados++
      }
    }
  }
  recorrer(raiz)
  console.log(`[wiki] ${copiados} índices de sección publicados`)
}

/**
 * El toolkit okf resuelve sus datos con getBasePath(), que devuelve cadena vacía
 * porque asume que la wiki es la raíz del dominio. Aquí cuelga de /wiki, así que
 * el explorador y el grafo pedían /static/okf-graph.json y recibían un 404.
 * El arreglo de fondo va en quartz-okf; esto es el parche del publicador.
 */
function corregirRutasDeLosScripts(raiz) {
  let parcheados = 0
  const recorrer = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, entrada.name)
      if (entrada.isDirectory()) {
        recorrer(ruta)
        continue
      }
      if (!entrada.name.endsWith('.js') && !entrada.name.endsWith('.html')) continue
      const original = readFileSync(ruta, 'utf8')
      const corregido = original.replaceAll('/static/okf-graph.json', '/wiki/static/okf-graph.json')
      if (corregido !== original) {
        writeFileSync(ruta, corregido, 'utf8')
        parcheados++
      }
    }
  }
  recorrer(raiz)
  console.log(`[wiki] ${parcheados} scripts con la ruta del grafo corregida`)
}
