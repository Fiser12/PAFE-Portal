/** T6: a quién avisa una tarea, al asignarla y cuando vuelve a tocar */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import {
  asignarCaso,
  completarTarea,
  createCase,
  createFamilia,
  createTask,
} from './helpers/factory'
import { at } from './helpers/dates'
import { emailsTo, resetEmails } from './helpers/email'
import { userNotifications } from '@/modules/catalog/services'
import { avisarDeTareasQueTocan } from '@/modules/tareas/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(resetEmails)

const avisos = async (userId: number) =>
  (await userNotifications({ payload, userId })).filter((n) => n.type.startsWith('tarea'))

describe('avisos al asignar una tarea', () => {
  it('avisa a la familia del caso, en la campana y por correo', async () => {
    const familia = await createFamilia(payload)
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)

    await createTask(payload, [caso.id], { title: 'Traer el informe' })

    const recibidos = await avisos(Number(familia.id))
    expect(recibidos).toHaveLength(1)
    expect(recibidos[0]!.message).toContain('Traer el informe')
    expect(emailsTo(familia.email)).toHaveLength(1)
  })

  it('no avisa a quien no tiene ese caso', async () => {
    const familia = await createFamilia(payload)
    const ajena = await createFamilia(payload)
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)

    await createTask(payload, [caso.id])

    expect(await avisos(Number(ajena.id))).toHaveLength(0)
  })

  it('editar una tarea no vuelve a avisar', async () => {
    const familia = await createFamilia(payload)
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)

    const tarea = await createTask(payload, [caso.id], { title: 'Con erratas' })
    await payload.update({
      collection: 'tasks',
      id: tarea.id,
      data: { title: 'Sin erratas' },
      overrideAccess: true,
    })

    expect(await avisos(Number(familia.id))).toHaveLength(1)
  })
})

describe('avisos de una tarea que vuelve a tocar', () => {
  it('una tarea semanal completada hace ocho días vuelve a avisar', async () => {
    const familia = await createFamilia(payload)
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)
    const tarea = await createTask(payload, [caso.id], {
      title: 'Registro semanal',
      rrule: 'FREQ=WEEKLY;INTERVAL=1',
    })
    await completarTarea(payload, tarea.id, familia.id, at('2026-09-08').toISOString())

    await avisarDeTareasQueTocan({ payload, now: at('2026-09-16') })

    const recibidos = await avisos(Number(familia.id))
    expect(recibidos.some((a) => a.type === 'tarea-toca')).toBe(true)
  })

  it('no avisa dos veces de la misma vuelta', async () => {
    const familia = await createFamilia(payload)
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)
    const tarea = await createTask(payload, [caso.id], { rrule: 'FREQ=WEEKLY;INTERVAL=1' })
    await completarTarea(payload, tarea.id, familia.id, at('2026-09-08').toISOString())

    await avisarDeTareasQueTocan({ payload, now: at('2026-09-16') })
    await avisarDeTareasQueTocan({ payload, now: at('2026-09-17') })

    const tocan = (await avisos(Number(familia.id))).filter((a) => a.type === 'tarea-toca')
    expect(tocan).toHaveLength(1)
  })

  it('una tarea completada que todavía no toca no avisa', async () => {
    const familia = await createFamilia(payload)
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)
    const tarea = await createTask(payload, [caso.id], { rrule: 'FREQ=WEEKLY;INTERVAL=1' })
    await completarTarea(payload, tarea.id, familia.id, at('2026-09-15').toISOString())

    await avisarDeTareasQueTocan({ payload, now: at('2026-09-16') })

    expect((await avisos(Number(familia.id))).filter((a) => a.type === 'tarea-toca')).toHaveLength(0)
  })

  it('una tarea sin recurrencia no vuelve a avisar nunca', async () => {
    const familia = await createFamilia(payload)
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)
    const tarea = await createTask(payload, [caso.id])
    await completarTarea(payload, tarea.id, familia.id, at('2026-01-01').toISOString())

    await avisarDeTareasQueTocan({ payload, now: at('2026-09-16') })

    expect((await avisos(Number(familia.id))).filter((a) => a.type === 'tarea-toca')).toHaveLength(0)
  })
})
