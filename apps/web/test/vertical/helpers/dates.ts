/** 'YYYY-MM-DD' de un ISO datetime almacenado por Payload */
export const day = (iso: string | null | undefined): string | undefined =>
  iso ? iso.slice(0, 10) : undefined

/**
 * Instante de un día concreto: 10:00Z = 12:00 en Madrid (verano) / 11:00
 * (invierno) — siempre el mismo día de calendario en Europe/Madrid.
 */
export const at = (dateISO: string) => new Date(`${dateISO}T10:00:00Z`)
