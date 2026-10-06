import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { administraTablon } from '@/core/permissions'
import { idiomaValido } from '@/core/localization'
import { VistaPreviaDeNoticia } from '@/modules/tablon/ui/VistaPreviaDeNoticia'
import { getServerSideURL } from '@/utilities/getURL'
import { getSessionUser } from '@/utilities/getSessionUser'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface Props {
  searchParams: Promise<{ id?: string; locale?: string }>
}

export default async function VistaPreviaPage({ searchParams }: Props) {
  const { payload, user } = await getSessionUser()
  if (!user || !administraTablon(user)) redirect('/login')

  const { id, locale } = await searchParams
  const idioma = idiomaValido(locale)
  const guardada = id
    ? await payload.findByID({
        collection: 'noticia',
        id,
        depth: 1,
        locale: idioma,
        user,
        overrideAccess: false,
        disableErrors: true,
      })
    : null

  return (
    <VistaPreviaDeNoticia inicial={guardada ?? {}} idioma={idioma} serverURL={getServerSideURL()} />
  )
}
