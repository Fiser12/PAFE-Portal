import { RichText } from '@payloadcms/richtext-lexical/react'
import { Badge } from '@/components/ui/badge'
import type { CodigoIdioma } from '@/core/localization'
import { textosDe } from '@/core/textos'
import { fechaLarga } from '@/modules/calendario/domain/fechas'
import type { Noticia } from '@/payload-types'
import { nombreDelArea } from '../domain/areas'

type Presentable = Partial<
  Pick<Noticia, 'area' | 'publishedAt' | 'sourceAuthor' | 'archivada' | 'title' | 'body'>
>

export function CabeceraDeNoticia({
  noticia,
  idioma,
}: {
  noticia: Presentable
  idioma: CodigoIdioma
}) {
  const t = textosDe(idioma)
  return (
    <>
      <div className="mt-4 mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {noticia.area && <Badge variant="outline">{nombreDelArea(noticia.area)}</Badge>}
        {noticia.publishedAt && <span>{fechaLarga(new Date(noticia.publishedAt), idioma)}</span>}
        {noticia.sourceAuthor && <span>· {noticia.sourceAuthor}</span>}
        {noticia.archivada && <Badge variant="secondary">{t.foroArchivadaAviso}</Badge>}
      </div>
      <h1 className="mb-4 text-3xl font-semibold">{noticia.title}</h1>
    </>
  )
}

export function CuerpoDeNoticia({ body }: { body?: Noticia['body'] }) {
  if (!body) return null
  return (
    <div className="prose max-w-none">
      <RichText data={body} />
    </div>
  )
}
