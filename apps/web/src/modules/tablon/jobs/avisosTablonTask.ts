import type { TaskConfig } from 'payload'
import { avisarDeNoticiasPendientes } from '../services'

export const AVISOS_TABLON_TASK = 'avisosTablon'

/**
 * Las noticias programadas avisan cuando llega su fecha. Comparte la cola de
 * los recordatorios del préstamo: el mismo cron ya la dispara en los dos
 * entornos (jobs.autoRun en Docker y el cron de Vercel).
 */
export const avisosTablonTask: TaskConfig<'avisosTablon'> = {
  slug: AVISOS_TABLON_TASK,
  label: 'Avisos del tablón',
  schedule: [
    {
      cron: '0 6 * * *',
      queue: 'recordatorios',
    },
  ],
  handler: async ({ req }) => {
    const { avisadas } = await avisarDeNoticiasPendientes({
      payload: req.payload,
      now: new Date(),
    })
    req.payload.logger.info(`[tablon] ${avisadas} noticia(s) programadas avisadas`)
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
