import { semanaDe } from './agrupar'
import { sieteDias, type Entrada } from './entradas'

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
