# Foro del portal

`/foro` ofrece una vista amplia del tablón, accesible desde el menú principal
y desde la portada. Usa las noticias y respuestas existentes: no importa por
sí sola los datos de NodeBB.

Permite filtrar por área, consultar el archivo y buscar por título en el idioma
seleccionado. Cada página muestra 20 temas, con las noticias fijadas primero,
seguidas de las más recientes. Los filtros se conservan en la URL.

Solo acceden usuarios con rol activo. El listado, sus recuentos y las áreas
disponibles respetan la pertenencia al equipo técnico; las fechas futuras no
aparecen. Cada tema abre su noticia con las respuestas existentes y un enlace
de vuelta al área y al archivo correspondiente.

Pruebas de permisos, búsqueda, idiomas y paginación:
`apps/web/test/vertical/foro.test.ts`.
