import type { TaskConfig } from 'payload'

export const AVISOS_TAREAS_TASK = 'avisosTareas'

/**
 * Las tareas recurrentes avisan cuando vuelven a tocar. Comparte la cola de los
 * recordatorios del préstamo, que ya se dispara en los dos entornos.
 */
export const avisosTareasTask: TaskConfig<'avisosTareas'> = {
  slug: AVISOS_TAREAS_TASK,
  label: 'Avisos de tareas recurrentes',
  schedule: [
    {
      cron: '0 6 * * *',
      queue: 'recordatorios',
    },
  ],
  handler: async ({ req }) => {
    // Dinámico a propósito: el servicio arrastra `rrule`, que es CommonJS y no
    // resuelve cuando el CLI de Payload carga este config para migrar
    const { avisarDeTareasQueTocan } = await import('../services')
    const { avisadas } = await avisarDeTareasQueTocan({
      payload: req.payload,
      now: new Date(),
    })
    req.payload.logger.info(`[tareas] ${avisadas} aviso(s) de tareas que vuelven a tocar`)
    return { output: { avisadas } }
  },
  outputSchema: [
    {
      name: 'avisadas',
      type: 'number',
      required: true,
    },
  ],
}
