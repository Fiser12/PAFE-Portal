// Overlay OKF de la wiki PAFE. El toolkit quartz-okf lo fusiona sobre su perfil base
// Typed Topology para validar, exportar el bundle y construir el sitio.
// El vocabulario de dominio vive aquí, no en el motor.
export const branding = {
  site: "Wiki PAFE",
  bundleTitle: "Conocimiento para psicólogos — PAFE",
  indexTitle: "PAFE knowledge bundle",
}

export const profile = {
  // Los nueve tipos de la convención (wiki/content/okf-convention.md). No hay
  // inventario de infraestructura: este corpus es una biblioteca profesional.
  types: [
    "book",        // una obra de la biblioteca, con su destilado
    "author",      // derivada de los `Authored by` de las notas de libro
    "concept",     // modelo, teoría o constructo
    "protocol",    // técnica o procedimiento clínico
    "instrument",  // test, escala o instrumento de evaluación
    "topic",       // síntesis transversal
    "claim",       // una sola afirmación transversal, con su fundamento
    "guide",       // ruta de entrada por situación práctica
    "report",      // índices y estado de la wiki
  ],
  edgeLabels: [
    "Part of",
    "Contains",
    "Uses",
    "Depends on",
    "About",
    "Cites",
    "Authored by",
  ],
  // La convención declara cada relación una sola vez y deriva la inversa.
  inverseLabels: {
    "Part of": "Contains",
    "Contains": "Part of",
  },
  propertyGroups: [],
  ruleLevels: {},
}

// Modos del explorador: cada uno responde una pregunta sobre este corpus.
export const explorer = {
  title: "Grafo de conocimiento",
  knowledgeTypes: ["topic", "protocol", "concept", "claim", "guide", "instrument"],
  typeColors: {
    book: "#8a8a8a", author: "#b58b6a", concept: "#4c7ecf", protocol: "#4caf7c",
    topic: "#e08a3c", claim: "#c2544d", guide: "#9a6fbf", instrument: "#3fa3a3",
    report: "#7f93ad",
  },
  typeLabels: {
    book: "libro", author: "autor", concept: "concepto", protocol: "protocolo",
    topic: "tema", claim: "tesis", guide: "ruta", instrument: "instrumento",
    report: "índice",
  },
  edgeColors: {
    "About": "#7f93ad", "Part of": "#9a6fbf", "Contains": "#9a6fbf", "Uses": "#4caf7c",
    "Depends on": "#c2544d", "Cites": "#8a8a8a", "Authored by": "#b58b6a",
  },
  // Reparto radial: cada tipo en su anillo, del centro al borde. En una sola bola los
  // 100 autores y las 95 obras sepultan por volumen a las 120 notas de conocimiento, que
  // son el valor; en anillos se lee de dentro afuera —la tesis, la ruta, el tema, la
  // técnica, la obra que lo sostiene y quién la firma—.
  layout: {
    charge: -45,
    gravity: 0.02,
    link: {
      "*": { distance: 28, strength: 0.12 },
      // Las citas cruzan varias capas: largas y flojas, o tirarían de las obras al centro.
      Cites: { distance: 70, strength: 0.03 },
      // Esta sí tira: mantiene a cada autor en el ángulo de sus obras.
      "Authored by": { distance: 30, strength: 0.25 },
    },
    radial: {
      strength: 0.9,
      byType: {
        claim: 0,
        guide: 0.15,
        topic: 0.3,
        concept: 0.44,
        protocol: 0.44,
        instrument: 0.44,
        book: 0.74,
        author: 0.98,
        report: 0.98,
      },
    },
  },
  // Qué se cuenta al pasar el ratón. De una nota de conocimiento importa en cuántas obras
  // se apoya; de una obra o un autor, quién los cita.
  tooltip: {
    book: "{indeg|nota lo cita|notas lo citan}",
    author: "{indeg|obra|obras}",
    "*": "{counts.Cites|obra|obras} · {indeg|entrante|entrantes}",
  },
  // El orden en que salen los resultados de búsqueda: antes la síntesis que la ficha.
  typeOrder: ["guide", "claim", "topic", "concept", "protocol", "instrument", "book", "author"],
  modes: [
    {
      id: "full",
      label: "Grafo completo",
      desc: "<b>El grafo entero, con sus relaciones tipadas.</b> Todas las notas y las aristas de la sección <code>Topology</code>, cada relación con su color. Filtra por tipo de nota y por tipo de relación para aislar una capa — quita «libro» y «autor» y queda el grafo de conocimiento puro.",
      edges: "*",
    },
    {
      id: "grounding",
      label: "Fundamentación",
      legendTitle: "Obras que la sostienen",
      desc: "<b>Cuántas obras sostienen cada nota.</b> Coloreada por el número de libros que cita: rojo = tres o menos, verde = siete o más. Es el mapa de fragilidad del corpus — dice dónde hace falta más biblioteca antes que más síntesis.",
      edges: ["Cites"],
      colorBy: {
        countEdge: "Cites",
        scale: [
          { max: 3, color: "#c2544d", label: "3 obras o menos" },
          { max: 4, color: "#d98b45", label: "4 obras" },
          { max: 6, color: "#c9b04a", label: "5-6 obras" },
          { max: 99, color: "#3fa34d", label: "7 o más" },
        ],
      },
    },
    {
      id: "claims",
      label: "Tesis",
      desc: "<b>Qué notas aplican cada afirmación transversal.</b> Las tesis y las notas que las declaran aplicables. Una tesis con muchas notas alrededor es una cautela que atraviesa el campo; una con pocas, o es específica o está poco enlazada.",
      edges: ["Depends on"],
      targetType: "claim",
      sizeBy: { indegree: true },
    },
    {
      id: "catalogue",
      label: "Catálogo",
      desc: "<b>Quién sostiene el corpus.</b> Autores, sus obras y las notas que las citan. El tamaño del autor es su número de obras: hace visible el escoramiento del catálogo hacia unas pocas escuelas.",
      edges: ["Authored by", "Cites"],
      sizeBy: { countEdge: "Authored by" },
    },
  ],
}

// La mitad del build que es de esta wiki: el resto lo pone el toolkit (`okf build`).
export const build = {
  hooks: {
    // Los índices y las notas de autor se regeneran antes de montar el corpus.
    prepare: [
      "python3 scripts/generate-topology-index.py",
      "python3 scripts/generate-author-notes.py",
    ],
  },
  // Suelos que separan un sitio completo de uno degradado, no marcas de crecimiento.
  verify: { minNodes: 300, minEdges: 1500, pages: [{ glob: "libros/*.html", min: 95 }] },
}
