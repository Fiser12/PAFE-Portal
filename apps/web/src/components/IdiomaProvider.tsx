'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { IDIOMA_POR_DEFECTO, type CodigoIdioma } from '@/core/localization'
import { textosDe, type Textos } from '@/core/textos'

interface Valor {
  idioma: CodigoIdioma
  t: Textos
}

const Contexto = createContext<Valor>({
  idioma: IDIOMA_POR_DEFECTO,
  t: textosDe(IDIOMA_POR_DEFECTO),
})

/**
 * Baja el idioma elegido a los componentes de cliente. El servidor lo resuelve
 * desde la cookie una vez por render y lo entrega aquí; así no hay dos fuentes
 * de verdad ni parpadeo al hidratar.
 */
export function IdiomaProvider({ idioma, children }: { idioma: CodigoIdioma; children: ReactNode }) {
  const valor = useMemo(() => ({ idioma, t: textosDe(idioma) }), [idioma])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export const useIdioma = () => useContext(Contexto)

/** Los textos de la interfaz en el idioma elegido */
export const useTextos = (): Textos => useContext(Contexto).t
