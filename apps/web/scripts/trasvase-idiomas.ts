/**
 * Salva el contenido que la migración de idiomas se lleva por delante.
 *
 * Al localizar un campo, Payload lo saca de su tabla a `<tabla>_locales` y
 * **borra la columna original sin copiar nada**: 22 columnas, entre ellas el
 * título de todo el catálogo y el nombre de las categorías. Sin esto, aplicar
 * la migración en producción deja el catálogo mudo.
 *
 * Se ejecuta en dos tiempos, con la migración en medio:
 *
 *   GUARDAR=/ruta/contenido.json  pnpm payload run scripts/trasvase-idiomas.ts
 *   pnpm payload migrate
 *   RESTAURAR=/ruta/contenido.json pnpm payload run scripts/trasvase-idiomas.ts
 *
 * Va con SQL crudo a propósito: en el primer paso el esquema todavía es el
 * viejo y Payload no arrancaría contra él.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { Pool } from 'pg'

/** Qué se salva, y a qué tabla de idioma vuelve */
const TRASVASE: { tabla: string; columnas: string[] }[] = [
  { tabla: 'catalog_item', columnas: ['title', 'content', 'contributions'] },
  { tabla: 'external_resources', columnas: ['title', 'description'] },
  { tabla: 'files', columnas: ['title'] },
  { tabla: 'media', columnas: ['alt', 'caption'] },
  { tabla: 'taxonomy', columnas: ['name'] },
  { tabla: 'pages', columnas: ['meta_title', 'meta_description', 'meta_image_id'] },
  { tabla: 'posts', columnas: ['meta_title', 'meta_description', 'meta_image_id'] },
]

const LOCALE = 'es'

const guardar = process.env.GUARDAR
const restaurar = process.env.RESTAURAR

if (!guardar && !restaurar) {
  console.error('Usa GUARDAR=<fichero> o RESTAURAR=<fichero>')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const existeTabla = async (tabla: string): Promise<boolean> => {
  const { rows } = await pool.query('SELECT to_regclass($1) AS t', [`public.${tabla}`])
  return rows[0]?.t !== null
}

const columnasExistentes = async (tabla: string, columnas: string[]): Promise<string[]> => {
  const { rows } = await pool.query(
    'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
    [tabla],
  )
  const hay = new Set(rows.map((r) => r.column_name))
  return columnas.filter((c) => hay.has(c))
}

if (guardar) {
  const volcado: Record<string, Record<string, unknown>[]> = {}

  for (const { tabla, columnas } of TRASVASE) {
    if (!(await existeTabla(tabla))) {
      console.log(`- ${tabla}: no existe, se salta`)
      continue
    }
    const cols = await columnasExistentes(tabla, columnas)
    if (cols.length === 0) {
      console.log(`- ${tabla}: ya no tiene esas columnas (¿migración aplicada?), se salta`)
      continue
    }
    const { rows } = await pool.query(`SELECT id, ${cols.join(', ')} FROM "${tabla}"`)
    volcado[tabla] = rows
    console.log(`= ${tabla}: ${rows.length} fila(s), columnas ${cols.join(', ')}`)
  }

  writeFileSync(guardar, JSON.stringify(volcado, null, 2))
  console.log(`\nGuardado en ${guardar}. Ahora aplica la migración y vuelve con RESTAURAR.`)
  await pool.end()
  process.exit(0)
}

const volcado = JSON.parse(readFileSync(restaurar!, 'utf8')) as Record<
  string,
  Record<string, unknown>[]
>

for (const [tabla, filas] of Object.entries(volcado)) {
  const destino = `${tabla}_locales`
  if (!(await existeTabla(destino))) {
    console.log(`- ${destino}: no existe, se salta`)
    continue
  }

  let escritas = 0
  for (const fila of filas) {
    const { id, ...valores } = fila
    const cols = await columnasExistentes(destino, Object.keys(valores))
    if (cols.length === 0) continue

    const marcadores = cols.map((_, i) => `$${i + 3}`).join(', ')
    const asignaciones = cols.map((c, i) => `"${c}" = $${i + 3}`).join(', ')

    // Si la migración ya dejó la fila del locale por defecto, se completa
    const { rowCount } = await pool.query(
      `UPDATE "${destino}" SET ${asignaciones} WHERE "_parent_id" = $1 AND "_locale" = $2`,
      [id, LOCALE, ...cols.map((c) => valores[c])],
    )
    if (rowCount === 0) {
      await pool.query(
        `INSERT INTO "${destino}" ("_parent_id", "_locale", ${cols.map((c) => `"${c}"`).join(', ')})
         VALUES ($1, $2, ${marcadores})`,
        [id, LOCALE, ...cols.map((c) => valores[c])],
      )
    }
    escritas++
  }
  console.log(`+ ${destino}: ${escritas} fila(s) en «${LOCALE}»`)
}

console.log('\nContenido devuelto al castellano. El euskera se escribe desde el panel.')
await pool.end()
process.exit(0)
