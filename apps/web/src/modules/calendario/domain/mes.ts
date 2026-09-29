import { semanaDe } from './agrupar'
import { diasQueOcupa, sieteDias, tieneFranja, type DiaDeAgenda, type Entrada } from './entradas'

export function diasDelMes(entradas: Entrada[], mes: Date, ahora = new Date()) {
  const primero = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), 1))
  const ultimo = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 0))
  const desde = semanaDe(primero, 'UTC').desde
  const hasta = semanaDe(ultimo, 'UTC').hasta
  const dias = []
  for (let inicio = desde; inicio <= hasta; inicio = new Date(inicio.getTime() + 7 * 86400000)) {
    dias.push(...sieteDias(entradas, inicio, ahora))
  }
  return dias
}

/** Lo que dura el día entero o varios días se pinta como una barra que cruza casillas */
export interface Barra {
  entrada: Entrada
  /** Columna donde empieza dentro de la semana, de 0 (lunes) a 6 */
  desde: number
  /** Columna donde acaba, incluida */
  hasta: number
  /** Fila que ocupa, para que las que se pisan no se tapen */
  carril: number
  empiezaAntes: boolean
  acabaDespues: boolean
}

export interface SemanaDelMes {
  /** Los siete días, con lo que va suelto en su casilla */
  dias: DiaDeAgenda[]
  barras: Barra[]
  carriles: number
}

const clave = (dia: Date) => dia.toISOString().slice(0, 10)

const barrasDeLaSemana = (entradas: Entrada[], claves: string[], zona: string): Barra[] => {
  const primera = claves[0]!
  const ultima = claves.at(-1)!

  const tramos = entradas
    .filter((entrada) => !tieneFranja(entrada, zona))
    .flatMap((entrada) => {
      const dias = diasQueOcupa(entrada, zona)
      const dentro = claves.filter((c) => dias.includes(c))
      if (dentro.length === 0) return []
      return [
        {
          entrada,
          desde: claves.indexOf(dentro[0]!),
          hasta: claves.indexOf(dentro.at(-1)!),
          carril: 0,
          empiezaAntes: dias[0]! < primera,
          acabaDespues: dias.at(-1)! > ultima,
        },
      ]
    })
    .sort(
      (a, b) =>
        a.desde - b.desde ||
        b.hasta - b.desde - (a.hasta - a.desde) ||
        a.entrada.fecha.getTime() - b.entrada.fecha.getTime(),
    )

  const colocadas: Barra[] = []
  for (const tramo of tramos) {
    const ocupados = new Set(
      colocadas
        .filter((otra) => otra.desde <= tramo.hasta && tramo.desde <= otra.hasta)
        .map((otra) => otra.carril),
    )
    let carril = 0
    while (ocupados.has(carril)) carril++
    colocadas.push({ ...tramo, carril })
  }
  return colocadas
}

/**
 * El mes como lo pinta Google: semana a semana, lo de todo el día y lo de
 * varios días en barras continuas arriba, y lo que tiene hora en su casilla.
 */
export function semanasDelMes(
  entradas: Entrada[],
  mes: Date,
  ahora = new Date(),
  zona = 'Europe/Madrid',
): SemanaDelMes[] {
  const conFranja = entradas.filter((entrada) => tieneFranja(entrada, zona))
  const dias = diasDelMes(conFranja, mes, ahora)

  return Array.from({ length: dias.length / 7 }, (_, indice) => {
    const semana = dias.slice(indice * 7, indice * 7 + 7)
    const barras = barrasDeLaSemana(entradas, semana.map((d) => clave(d.dia)), zona)
    return {
      dias: semana,
      barras,
      carriles: barras.length === 0 ? 0 : Math.max(...barras.map((b) => b.carril)) + 1,
    }
  })
}
