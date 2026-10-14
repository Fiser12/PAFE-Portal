/** Lo que dura el enlace para poner una contraseña nueva */
export const HORAS_DEL_ENLACE = 24

export const correoDeNuevaClave = ({
  nombre,
  url,
  conGoogle,
}: {
  nombre?: string | null
  url: string
  conGoogle: boolean
}) => ({
  subject: 'Establece tu contraseña — PAFE',
  html: `<p>Hola${nombre ? ` ${nombre}` : ''},</p>
   <p>Pulsa el siguiente enlace para establecer tu contraseña en el portal de PAFE:</p>
   <p><a href="${url}">Establecer contraseña</a></p>
   <p>El enlace vale durante ${HORAS_DEL_ENLACE} horas y solo una vez. Si caduca, pide otro desde «Entrar».</p>${
     conGoogle
       ? `
   <p>Esta cuenta también puede entrar con Google: en «Entrar», pulsa «Entrar con Google» y no necesitarás contraseña.</p>`
       : ''
   }
   <p>Si no has pedido este correo, puedes ignorarlo.</p>`,
})

export type MotivoDelFallo = 'enlace' | 'corta' | 'larga' | 'otro'

/** Por qué no se pudo guardar, a partir del error que devuelve better-auth */
export const motivoDelFallo = (error: { code?: string } | null | undefined): MotivoDelFallo => {
  switch (error?.code) {
    case 'INVALID_TOKEN':
      return 'enlace'
    case 'PASSWORD_TOO_SHORT':
      return 'corta'
    case 'PASSWORD_TOO_LONG':
      return 'larga'
    default:
      return 'otro'
  }
}
