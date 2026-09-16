import type { Payload, PayloadRequest } from 'payload'

export interface Correo {
  subject: string
  text: string
  html: string
}

export const escaparHtml = (texto: string): string =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Un correo bilingüe: el euskera primero, como en el resto de los avisos */
export const correoBilingue = ({
  subject,
  eu,
  es,
}: {
  subject: string
  eu: string
  es: string
}): Correo => ({
  subject,
  text: `${eu}\n\n${es}`,
  html: `<p>${escaparHtml(eu)}</p><p>${escaparHtml(es)}</p>`,
})

/**
 * El aviso ya está guardado cuando se manda el correo: que falle el envío no
 * puede tumbar lo que lo provocó ni borrar lo que la persona ve en la campana.
 */
export const enviarCorreoSinRomper = async (
  payload: Payload,
  message: Correo & { to: string },
): Promise<void> => {
  try {
    await payload.sendEmail(message)
  } catch (error) {
    payload.logger.error(
      `[avisos] fallo enviando "${message.subject}" a ${message.to}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

export const idDe = (valor: number | { id: number } | null | undefined): number =>
  typeof valor === 'object' && valor !== null ? valor.id : (valor as number)

/**
 * Deja el aviso en la campana y manda el correo, uno a uno. Un destinatario que
 * falle no se lleva a los demás: queda sin aviso, y por eso el reintento lo
 * vuelve a encontrar.
 */
export const avisarA = async ({
  payload,
  destinatarios,
  aviso,
  correo,
  req,
}: {
  payload: Payload
  destinatarios: { id: number; email?: string | null }[]
  aviso: (userId: number) => Record<string, unknown>
  correo: Correo
  /** Dentro de un hook hay transacción abierta: sin `req` nada de esto se ve */
  req?: PayloadRequest
}): Promise<number> => {
  for (const destinatario of destinatarios) {
    await payload.create({
      collection: 'notification',
      data: aviso(destinatario.id) as never,
      overrideAccess: true,
      req,
    })
    if (destinatario.email) {
      await enviarCorreoSinRomper(payload, { to: destinatario.email, ...correo })
    }
  }
  return destinatarios.length
}
