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

## Despliegue en Vercel

El despliegue de producción se dispara mediante commit y push a `main`.
`PAYLOAD_RUN_MIGRATIONS=false` evita ejecutar migraciones durante el build
y el arranque de las funciones. Las nuevas migraciones deben ejecutarse
explícitamente antes de desplegar código que necesite sus cambios de esquema.
En producción no debe usarse la sincronización de esquema de desarrollo;
`PAYLOAD_DISABLE_PUSH=true` la desactiva explícitamente y `payload.config.ts`
también la impide cuando `NODE_ENV=production`.

El 23 de septiembre de 2026 se respaldó el historial de migraciones de Neon
y se retiró únicamente la fila `name=dev, batch=-1`. Las 14 migraciones
versionadas ya estaban registradas y se conservaron. Esta limpieza de
metadatos no importa el histórico de NodeBB ni modifica su contenido.
