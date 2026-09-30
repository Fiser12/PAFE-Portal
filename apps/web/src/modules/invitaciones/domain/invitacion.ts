import type { AdminInvitation } from '@/payload-types'
import { ALL_ROLES, ROLE_IMPERSONAR, isAdmin } from '@/core/permissions'

type RolInvitable = AdminInvitation['role']

export const ROLES_INVITABLES = ALL_ROLES.filter((rol) => rol !== ROLE_IMPERSONAR)

export const esRolInvitable = (rol: string): rol is RolInvitable => ROLES_INVITABLES.includes(rol)

export const puedeInvitar = (user: Parameters<typeof isAdmin>[0], rol: string): boolean =>
  isAdmin(user) && esRolInvitable(rol)

export interface CorreosLeidos {
  validos: string[]
  invalidos: string[]
}

const CORREO = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

/** «Nombre <correo>» es como sale una dirección copiada de una libreta */
const trozos = (texto: string): string[] =>
  texto
    .split(/[,;\n]+/)
    .flatMap((trozo) => {
      const entre = trozo.match(/<([^>]+)>/)
      return entre?.[1] ? [entre[1]] : trozo.split(/\s+/)
    })
    .map((trozo) => trozo.trim())
    .filter(Boolean)

export const leerCorreos = (texto: string): CorreosLeidos => {
  const validos: string[] = []
  const invalidos: string[] = []
  for (const trozo of trozos(texto)) {
    const normal = trozo.toLowerCase()
    if (!CORREO.test(normal)) {
      if (!invalidos.includes(trozo)) invalidos.push(trozo)
    } else if (!validos.includes(normal)) {
      validos.push(normal)
    }
  }
  return { validos, invalidos }
}

export const urlDeInvitacion = (base: string, token: string) =>
  `${base}/admin/signup?token=${token}&redirect=%2Fforo`

export const correoDeInvitacion = (url: string) => ({
  subject: 'Invitación al portal de PAFE',
  html: `<p>Hola,</p>
   <p>Has recibido una invitación para unirte al portal de PAFE. Pulsa el siguiente enlace para crear tu cuenta:</p>
   <p><a href="${url}">Aceptar invitación</a></p>
   <p>Si no esperabas este correo, puedes ignorarlo.</p>`,
})
