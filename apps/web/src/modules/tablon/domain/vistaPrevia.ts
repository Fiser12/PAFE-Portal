/** Dónde se ve, al lado del editor del panel, la noticia que se está escribiendo */
export const urlDeVistaPrevia = ({ id, locale }: { id?: unknown; locale: string }): string => {
  const query = new URLSearchParams()
  if (typeof id === 'number' || typeof id === 'string') query.set('id', String(id))
  query.set('locale', locale)
  return `/noticias/vista-previa?${query}`
}
