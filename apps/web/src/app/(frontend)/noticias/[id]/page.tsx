import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { isActiveUser } from '@/core/permissions'
import { nombreDelArea } from '@/modules/tablon/domain/areas'
import { noticiaDelTablon } from '@/modules/tablon/services'
import { Respuestas } from '@/modules/tablon/ui/Respuestas'
import type { CodigoIdioma } from '@/core/localization'
import { fechaLarga } from '@/modules/calendario/domain/fechas'
import { getIdioma } from '@/utilities/getIdioma'
import { getSessionUser } from '@/utilities/getSessionUser'
import { textosDe } from '@/core/textos'

interface Props {
  params: Promise<{ id: string }>
}

const fecha = (iso: string | null | undefined, idioma: CodigoIdioma) =>
  iso ? fechaLarga(new Date(iso), idioma) : ''

export default async function NoticiaPage({ params }: Props) {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) redirect('/login')

  const idioma = await getIdioma()
  const t = textosDe(idioma)

  const noticia = await noticiaDelTablon({
    payload,
    user,
    id: (await params).id,
    now: new Date(),
    locale: idioma,
  })

  if (!noticia) return notFound()

  const area = nombreDelArea(noticia.area)

  return (
    <article className="container mx-auto max-w-3xl px-4 py-8">
      <Link className="text-sm text-muted-foreground hover:underline" href={`/foro?area=${noticia.area}${noticia.archivada ? '&archivo=1' : ''}`}>
        ← {t.foroVolver}
      </Link>
      <div className="mt-4 mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {area && <Badge variant="outline">{area}</Badge>}
        <span>{fecha(noticia.publishedAt, idioma)}</span>
      </div>
      <h1 className="mb-6 text-3xl font-semibold">{noticia.title}</h1>
      {noticia.body && (
        <div className="prose max-w-none">
          <RichText data={noticia.body} />
        </div>
      )}
      <Respuestas noticiaId={Number(noticia.id)} usuarioId={Number(user.id)} />
    </article>
  )
}
