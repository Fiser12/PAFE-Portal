import { flowGraphRuntime } from './runtime'

export const createDefaultFlowSchema = () => ({
  id: 'cuestionario-pafe',
  version: '1',
  questionPlugins: flowGraphRuntime.questionPluginManifest,
  entry: 'inicio',
  nodes: {
    inicio: {
      kind: 'page' as const,
      title: {
        key: 'page.inicio.title',
        fallback: 'Cuestionario de prueba',
      },
      questions: [
        {
          id: 'nombre',
          kind: 'text' as const,
          text: {
            key: 'question.nombre',
            fallback: '¿Cómo quieres que te llamemos?',
          },
          required: true,
          maxLength: 120,
        },
        {
          id: 'necesita_apoyo',
          kind: 'select' as const,
          text: {
            key: 'question.necesita_apoyo',
            fallback: '¿Necesitas que un profesional contacte contigo?',
          },
          required: true,
          options: [
            {
              id: 'si',
              text: { key: 'option.si', fallback: 'Sí' },
              weight: 1,
            },
            {
              id: 'no',
              text: { key: 'option.no', fallback: 'No' },
              weight: 0,
            },
          ],
        },
      ],
      edges: [
        {
          to: 'contacto',
          when: { kind: 'selected' as const, q: 'necesita_apoyo', option: 'si' },
        },
        {
          to: 'final',
          when: { kind: 'always' as const },
        },
      ],
    },
    contacto: {
      kind: 'page' as const,
      title: {
        key: 'page.contacto.title',
        fallback: 'Datos de contacto',
      },
      questions: [
        {
          id: 'telefono',
          kind: 'text' as const,
          text: {
            key: 'question.telefono',
            fallback: 'Indica un teléfono de contacto',
          },
          required: true,
          maxLength: 40,
        },
      ],
      edges: [{ to: 'final', when: { kind: 'always' as const } }],
    },
    final: {
      kind: 'terminal' as const,
      outcome: 'completado',
    },
  },
})
