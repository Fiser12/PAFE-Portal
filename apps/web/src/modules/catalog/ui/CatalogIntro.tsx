import { Card, CardContent } from '@/components/ui/card'

export const PAFE_EMAIL = 'pafe@agintzari.eus'

export function CatalogIntro() {
  return (
    <Card className="mb-6">
      <CardContent className="space-y-3 p-6 text-sm leading-relaxed">
        <p>
          Hola, os presentamos el nuevo programa de préstamos de material de PAFE. Mediante esta
          herramienta tendréis acceso a vídeos, juegos y libros. El préstamo durará un mes, siendo
          de martes de reunión a martes de reunión (aunque podréis hacer la reserva antes para que
          tengáis listo el material en la reunión). Se podrá realizar una prórroga de 2 semanas
          avisando una semana antes de que termine el plazo del préstamo. En caso de devolución
          tardía, tened en cuenta que esto puede afectar a otras personas del equipo que deseen
          hacer uso del mismo. Por otro lado, en caso de ruptura o pérdida, el usuario responsable
          deberá comprar uno similar y entregarlo (en caso de tener cualquier duda, podéis
          contactar con nosotros para que os asesoremos).
        </p>
        <p>
          El catálogo es un material vivo que lo construimos entre todos y todas. Si usáis un
          material y queréis aportar sugerencias sobre cómo usarlo, para qué perfiles de casos y
          familias o con qué objetivos, contádnoslo. Y si queréis añadir algún documento
          descargable, referencia de vídeo o libro en formato electrónico, envíadlo a{' '}
          <a className="font-medium underline" href={`mailto:${PAFE_EMAIL}`}>
            {PAFE_EMAIL}
          </a>
          .
        </p>
      </CardContent>
    </Card>
  )
}
