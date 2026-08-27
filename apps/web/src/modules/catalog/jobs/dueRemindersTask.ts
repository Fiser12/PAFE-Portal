import type { TaskConfig } from 'payload'
import { runDueReminders } from '../services'

export const DUE_REMINDERS_TASK = 'dueReminders'
export const DUE_REMINDERS_QUEUE = 'recordatorios'

export const dueRemindersTask: TaskConfig<'dueReminders'> = {
  slug: DUE_REMINDERS_TASK,
  label: 'Avisos de devolución',
  // Se encola solo cada día. Quien dispara la cola depende del entorno:
  // `jobs.autoRun` (Docker, proceso vivo) o el cron de Vercel contra
  // /api/payload-jobs/run, que también evalúa este schedule.
  schedule: [
    {
      cron: '0 6 * * *',
      queue: DUE_REMINDERS_QUEUE,
    },
  ],
  handler: async ({ req }) => {
    const { sent } = await runDueReminders({ payload: req.payload, now: new Date() })
    req.payload.logger.info(`[recordatorios] ${sent} aviso(s) de devolución enviados`)
    return { output: { sent } }
  },
  outputSchema: [
    {
      name: 'sent',
      type: 'number',
      required: true,
    },
  ],
}
