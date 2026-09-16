/**
 * Quién tiene que volver a hacer una tarea recurrente. El estado es por
 * persona: una familia puede haberla completado y otra no.
 */
export const tocaOtraVez = ({
  vencimiento,
  ultimoAviso,
  now,
}: {
  /** Cuándo vuelve a tocar, según la recurrencia y la última vez que se hizo */
  vencimiento: Date | null
  /** Cuándo se avisó por última vez de esta tarea a esta persona */
  ultimoAviso: Date | null
  now: Date
}): boolean => {
  if (!vencimiento) return false
  if (now < vencimiento) return false
  return !ultimoAviso || ultimoAviso < vencimiento
}
