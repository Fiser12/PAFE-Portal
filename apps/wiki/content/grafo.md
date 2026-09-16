---
type: report
title: Grafo de conocimiento
description: Visor del grafo de la wiki con cuatro modos — completo, fundamentación, tesis y catálogo — que responden preguntas que el grafo genérico no permite
tags: [okf, documentation]
---

<a href="/static/explorer" data-router-ignore><strong>Abrir el grafo →</strong></a>

<small>Se abre a pantalla completa sobre la wiki; `Esc` o el botón atrás del navegador devuelven la página. El panel derecho de cada nota lleva el mismo acceso, y desde ahí el grafo se abre centrado en esa nota.</small>

El panel derecho de cada nota muestra el grafo de Quartz: útil para ver la vecindad inmediata, y ciego a dos cosas que en esta wiki importan. No distingue los **nueve tipos** de nota del set cerrado —libro, autor, concepto, protocolo, tema, tesis, ruta, instrumento, informe— ni los **siete edges** de la topología, y los 195 nodos de libro y autor sepultan por volumen a las 120 notas de conocimiento, que son el valor.

Este visor conserva ambos ejes y por eso puede responder preguntas concretas. Abre en el **grafo completo**, con toda la topología tipada a la vista; los tres modos siguientes la recortan para aislar una pregunta.

## Fundamentación

Cada nota de conocimiento coloreada por el número de obras que cita: **rojo si se apoya en tres o menos, verde si en siete o más**. Es el mapa de fragilidad del corpus.

Hoy dice esto: **22 notas se sostienen con tres obras o menos** y solo 7 con siete o más. Las más expuestas son las que sintetizan un campo entero desde poco material —[[conceptos/cibernetica|cibernética]], [[conceptos/doble-vinculo|doble vínculo]], [[temas/migracion|migración]], [[temas/envejecimiento|envejecimiento]]—. Sirve para decidir dónde hace falta **más biblioteca** antes que más síntesis.

## Tesis

Las 16 afirmaciones transversales y las notas que las declaran aplicables: 107 nodos y 175 aristas.

Una tesis con muchas notas alrededor es una cautela que atraviesa el campo —«un manual de técnica no es un tratamiento validado» llega a 37 notas, «la circularidad no reparte responsabilidad» a 36—. Una con pocas, o es específica o está poco enlazada, y eso también se ve.

Este modo nació de un fallo que el propio grafo hizo evidente: las tesis se escribieron apuntando a las notas donde se aplican, pero **ninguna nota las enlazaba de vuelta**. Se corrigió con `wiki/scripts/link-claims.py`.

## Catálogo

Autores, obras y las notas que las citan. El tamaño de cada autor es su número de obras en la biblioteca, y eso hace visible el escoramiento del catálogo: **Nardone firma 16 de las 95 obras digitales y Watzlawick 11**. Casi un tercio del corpus digital viene de Arezzo y del MRI, lo que explica por qué tantas notas repiten las mismas cautelas sobre técnicas paradójicas y por qué otras tradiciones —cognitivo-conductual, terapia centrada en emociones— solo aparecen como contraste en las secciones de evidencia.

## Cómo se usa

- **Pasar el ratón** sobre un nodo muestra su ficha: tipo, obras que lo sostienen y enlaces entrantes.
- **Clic** abre la nota en un panel de lectura sin salir del grafo; **doble clic** la deja fijada como pestaña en la barra superior; **⌘/Ctrl + clic** la abre en otra pestaña del navegador.
- **Clic derecho** sobre un nodo o sobre el fondo despliega el menú: abrir, fijar, encuadrar, copiar el enlace a esa vista.
- Las **vistas** (los cuatro modos) y los **filtros** por tipo de nota y de relación viven abajo a la izquierda, con el recuento del modo activo.
- El **buscador** (`/`) lista las notas que casan y centra la vista en la elegida; con `>` delante ofrece los comandos.
- La URL recoge la vista abierta (`?explorer&focus=<nota>`): un enlace copiado reabre el grafo en el mismo punto.

## Cómo se genera

El grafo no lo genera esta wiki: lo emite `@zetesis/quartz-okf`, el motor del toolkit [quartz-okf](https://github.com/Zetesis-Labs/quartz-okf) que también usa Singular Solving. Lee la sección `# Topology` de las notas —ya validada por los dos gates—, resuelve alias y relaciones inversas, y escribe `static/okf-graph.json`. El visor es `@zetesis/quartz-okf-explorer`, un componente de Quartz que va en el panel derecho de cada nota y despliega el grafo sobre la página; lleva d3 empaquetado dentro, sin dependencias externas ni llamadas a terceros. La antigua dirección `/static/explorer` sigue existiendo y redirige.

Lo que esta wiki aporta es su **vocabulario**, no el código: `okf.config.mjs` declara los nueve tipos, las siete relaciones y los cuatro modos de vista. El motor no sabe nada de psicología clínica; renderiza lo que ese fichero le diga. Todo se regenera en el despliegue, de modo que el grafo no puede quedar desfasado respecto al contenido.
