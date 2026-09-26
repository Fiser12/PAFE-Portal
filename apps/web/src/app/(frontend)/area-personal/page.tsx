import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReservationsTable } from '@/modules/catalog/ui/ReservationsTable'
import { getSessionUser } from '@/utilities/getSessionUser'
import { getIdioma } from '@/utilities/getIdioma'
import { textosDe } from '@/core/textos'
import { isActiveUser } from '@/core/permissions'

export default async function AreaPersonal() {
  const { user } = await getSessionUser()
  if (!user || !isActiveUser(user)) redirect('/login')
  const t = textosDe(await getIdioma())
  return (
    <div className="container space-y-8 py-8">
      <h1 className="text-3xl font-semibold">{t.navAreaPersonal}</h1>
      <section className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-5">
        <MessageSquare className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1 basis-56">
          <h2 className="font-semibold">{t.tablon}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.foroDescripcion}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/foro">{t.foroVer} →</Link>
        </Button>
      </section>
      <ReservationsTable />
    </div>
  )
}
