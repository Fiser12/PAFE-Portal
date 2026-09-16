import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { isActiveUser } from '@/core/permissions'
import type { Taxonomy } from '@/payload-types'
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
  if (!isActiveUser(user)) redirect('/login')

  const id = (await params).id
  const noticia = await payload
    .findByID({ collection: 'noticia', id, depth: 1, overrideAccess: true })
    .catch((error) => {
      payload.logger.error(`[tablon] no se pudo leer la noticia ${id}: ${error}`)
      return null
    })

  if (!noticia) return notFound()

  const area = typeof noticia.area === 'object' ? (noticia.area as Taxonomy).name : ''

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
    </article>
  )
}
