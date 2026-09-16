import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { isActiveUser } from '@/core/permissions'
import { nombreDelArea } from '@/modules/tablon/domain/areas'
import { noticiaDelTablon } from '@/modules/tablon/services'
import { Respuestas } from '@/modules/tablon/ui/Respuestas'
import { getSessionUser } from '@/utilities/getSessionUser'

interface Props {
  params: Promise<{ id: string }>
}

const fecha = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

export default async function NoticiaPage({ params }: Props) {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) redirect('/login')

  const noticia = await noticiaDelTablon({
    payload,
    user,
    id: (await params).id,
    now: new Date(),
  })

  if (!noticia) return notFound()

  const area = nombreDelArea(noticia.area)

  return (
    <article className="container mx-auto max-w-3xl px-4 py-8">
      <Link className="text-sm text-muted-foreground hover:underline" href="/">
        ← Volver al tablón
      </Link>
      <div className="mt-4 mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {area && <Badge variant="outline">{area}</Badge>}
        <span>{fecha(noticia.publishedAt)}</span>
      </div>
      <h1 className="mb-6 text-3xl font-bold">{noticia.title}</h1>
      {noticia.body && (
        <div className="prose max-w-none">
          <RichText data={noticia.body} />
        </div>
      )}
      <Respuestas noticiaId={Number(noticia.id)} usuarioId={Number(user.id)} />
    </article>
  )
}
