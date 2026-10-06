import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { isActiveUser } from '@/core/permissions'
import { moderacionPara } from '@/modules/tablon/domain/moderacion'
import { noticiaDelTablon } from '@/modules/tablon/services'
import { ModeracionDeNoticia } from '@/modules/tablon/ui/ModeracionDeNoticia'
import { CabeceraDeNoticia, CuerpoDeNoticia } from '@/modules/tablon/ui/PresentacionDeNoticia'
import { Respuestas } from '@/modules/tablon/ui/Respuestas'
import { getIdioma } from '@/utilities/getIdioma'
import { getSessionUser } from '@/utilities/getSessionUser'
import { textosDe } from '@/core/textos'

interface Props {
  params: Promise<{ id: string }>
}

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

  return (
    <article className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        className="text-sm text-muted-foreground hover:underline"
        href={`/foro?area=${noticia.area}${noticia.archivada ? '&archivo=1' : ''}`}
      >
        ← {t.foroVolver}
      </Link>
      <CabeceraDeNoticia noticia={noticia} idioma={idioma} />
      <ModeracionDeNoticia
        noticiaId={Number(noticia.id)}
        area={noticia.area}
        archivada={Boolean(noticia.archivada)}
        puede={moderacionPara(user)}
      />
      <CuerpoDeNoticia body={noticia.body} />
      <Respuestas
        noticiaId={Number(noticia.id)}
        usuarioId={Number(user.id)}
        cerrada={Boolean(noticia.cerrada)}
      />
    </article>
  )
}
