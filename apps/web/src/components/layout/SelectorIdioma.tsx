'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { IDIOMAS, type CodigoIdioma } from '@/core/localization'
import { cn } from '@/utilities/ui'
import { elegirIdioma } from './elegirIdioma'

interface Props {
  idioma: CodigoIdioma
}

export function SelectorIdioma({ idioma }: Props) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()

  const cambiar = (code: CodigoIdioma) => {
    if (code === idioma) return
    startTransition(async () => {
      await elegirIdioma(code)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-0.5 rounded-md border p-0.5" role="group">
      {IDIOMAS.map(({ code, label, corto }) => (
        <button
          key={code}
          type="button"
          onClick={() => cambiar(code)}
          disabled={pendiente}
          aria-label={label}
          aria-pressed={idioma === code}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-60',
            idioma === code
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
