export type SentEmail = {
  to: unknown
  subject?: string
  text?: string
  html?: string
}

export const sentEmails: SentEmail[] = []

export const emailFailures = { failNextSend: false }

export const resetEmails = () => {
  sentEmails.length = 0
  emailFailures.failNextSend = false
}

/** Emails enviados a una dirección concreta */
export const emailsTo = (address: string) =>
  sentEmails.filter((m) => String(m.to).includes(address))

/** Cuerpo completo (text + html) de un email, para asserts de literales */
export const bodyOf = (m: SentEmail) => `${m.text ?? ''}\n${m.html ?? ''}`

export const testEmailAdapter = () => ({
  name: 'test-capture',
  defaultFromAddress: 'test@pafe.local',
  defaultFromName: 'PAFE Test',
  sendEmail: async (message: SentEmail) => {
    if (emailFailures.failNextSend) {
      emailFailures.failNextSend = false
      throw new Error('fallo simulado de envío')
    }
    sentEmails.push(message)
    return {}
  },
})
