'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { CodigoIdioma } from '@/core/localization'
import type { Noticia } from '@/payload-types'
import { CabeceraDeNoticia, CuerpoDeNoticia } from './PresentacionDeNoticia'

interface Props {
  inicial: Partial<Noticia>
  idioma: CodigoIdioma
  serverURL: string
}

export function VistaPreviaDeNoticia({ inicial, idioma, serverURL }: Props) {
  const { data } = useLivePreview<Partial<Noticia>>({ initialData: inicial, serverURL, depth: 1 })
  return (
    <article className="container mx-auto max-w-3xl px-4 py-8">
      <CabeceraDeNoticia noticia={data} idioma={idioma} />
      <CuerpoDeNoticia body={data.body} />
    </article>
  )
}
