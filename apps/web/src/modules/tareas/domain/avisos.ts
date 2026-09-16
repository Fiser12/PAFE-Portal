import { correoBilingue, type Correo } from '@/modules/avisos'

export const TAREA_NOTIFICATION_TYPES = ['tarea-asignada', 'tarea-toca'] as const

export type TareaNotificationType = (typeof TAREA_NOTIFICATION_TYPES)[number]

export const avisoDeTareaAsignada = (
  title: string,
): { type: TareaNotificationType; message: string } => ({
  type: 'tarea-asignada',
  message: `Tienes una tarea nueva: ${title}`,
})

export const avisoDeTareaQueToca = (
  title: string,
): { type: TareaNotificationType; message: string } => ({
  type: 'tarea-toca',
  message: `Vuelve a tocar: ${title}`,
})

export const correoDeTareaAsignada = ({ title, url }: { title: string; url: string }): Correo =>
  correoBilingue({
    subject: `Zeregin berria: ${title}`,
    eu: `Zeregin berri bat duzu: ${title}. Ikusi hemen: ${url}`,
    es: `Tienes una tarea nueva: ${title}. Puedes verla en ${url}`,
  })

export const correoDeTareaQueToca = ({
  title,
  cadencia,
  url,
}: {
  title: string
  cadencia: string
  url: string
}): Correo =>
  correoBilingue({
    subject: `${title}: berriro egiteko garaia`,
    eu: `${title} berriro egiteko garaia da (${cadencia}). Ikusi hemen: ${url}`,
    es: `Vuelve a tocar ${title} (${cadencia}). Puedes verla en ${url}`,
  })
