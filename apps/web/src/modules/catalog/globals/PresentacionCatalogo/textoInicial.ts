const parrafo = (children: unknown[]) => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  children,
})

const texto = (text: string) => ({
  type: 'text',
  version: 1,
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
})

export const PAFE_EMAIL = 'pafe@agintzari.eus'

const enlaceAlCorreo = {
  type: 'link',
  version: 3,
  direction: 'ltr',
  format: '',
  indent: 0,
  fields: { linkType: 'custom', newTab: false, url: `mailto:${PAFE_EMAIL}` },
  children: [texto(PAFE_EMAIL)],
}

/**
 * Lo que se ve mientras nadie lo cambie. Va como valor por defecto y no como
 * semilla para que al desplegar la presentación siga ahí sin tener que
 * ejecutar nada.
 */
export const TEXTO_INICIAL = {
  root: {
    type: 'root',
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: [
      parrafo([
        texto(
          'Hola, os presentamos el nuevo programa de préstamos de material de PAFE. Mediante esta herramienta tendréis acceso a vídeos, juegos y libros. El préstamo durará un mes, siendo de martes de reunión a martes de reunión (aunque podréis hacer la reserva antes para que tengáis listo el material en la reunión). Se podrá realizar una prórroga de 2 semanas avisando una semana antes de que termine el plazo del préstamo. En caso de devolución tardía, tened en cuenta que esto puede afectar a otras personas del equipo que deseen hacer uso del mismo. Por otro lado, en caso de ruptura o pérdida, el usuario responsable deberá comprar uno similar y entregarlo (en caso de tener cualquier duda, podéis contactar con nosotros para que os asesoremos).',
        ),
      ]),
      parrafo([
        texto(
          'El catálogo es un material vivo que lo construimos entre todos y todas. Si usáis un material y queréis aportar sugerencias sobre cómo usarlo, para qué perfiles de casos y familias o con qué objetivos, contádnoslo. Y si queréis añadir algún documento descargable, referencia de vídeo o libro en formato electrónico, envíadlo a ',
        ),
        enlaceAlCorreo,
        texto('.'),
      ]),
    ],
  },
}
