'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { COOKIE_IDIOMA, IDIOMAS, type CodigoIdioma } from '@/core/localization'
import { cn } from '@/utilities/ui'

const UN_ANO = 60 * 60 * 24 * 365

interface Props {
  idioma: CodigoIdioma
}

export function SelectorIdioma({ idioma }: Props) {
  const router = useRouter()
  const [elegido, setElegido] = useState(idioma)
  const [, startTransition] = useTransition()

  const cambiar = (code: CodigoIdioma) => {
    if (code === elegido) return
    // La cookie no es httpOnly a propósito: la escribe el navegador y la lee el
    // servidor en el siguiente render. No guarda nada sensible.
    document.cookie = `${COOKIE_IDIOMA}=${code}; path=/; max-age=${UN_ANO}; samesite=lax`
    setElegido(code)
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-0.5 rounded-md border p-0.5" role="group">
      {IDIOMAS.map(({ code, label, corto }) => (
        <button
          key={code}
          type="button"
          onClick={() => cambiar(code)}
          aria-label={label}
          aria-pressed={elegido === code}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            elegido === code
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {corto}
        </button>
      ))}
    </div>
  )
}
