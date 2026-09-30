import { isAdmin, isStaff } from '@/core/permissions'

/**
 * Lo que se ofrece en el foro sobre una noticia. Archivar es del equipo (R14);
 * editar lleva al panel, que solo abre administración.
 */
export const moderacionPara = (user: Parameters<typeof isStaff>[0]) => ({
  archivar: isStaff(user),
  editar: isAdmin(user),
})
