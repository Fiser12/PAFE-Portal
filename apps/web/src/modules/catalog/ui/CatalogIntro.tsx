import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Card, CardContent } from '@/components/ui/card'
import { getIdioma } from '@/utilities/getIdioma'
import { textoDePresentacion } from '../services/presentacion'

export { PAFE_EMAIL } from '../globals/PresentacionCatalogo/textoInicial'

export async function CatalogIntro() {
  const payload = await getPayload({ config })
  const texto = await textoDePresentacion(payload, await getIdioma())

  if (!texto) return null

  return (
    <Card className="mb-6">
      <CardContent className="prose max-w-none space-y-3 p-6 text-sm leading-relaxed">
        <RichText data={texto} />
      </CardContent>
    </Card>
  )
}
