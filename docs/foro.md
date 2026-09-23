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

## Importación del histórico de NodeBB

Los scripts de `apps/web/scripts/nodebb/` importan una exportación autenticada
del foro, incluidas las categorías de archivo (13, 14 y 17). `sourceTopicId`,
`sourcePostId` y `sourceKey` evitan duplicados en reintentos. La migración
`20260923_102004_nodebb_import`, generada por Payload, añade estos campos,
la autoría histórica, contenido enriquecido en respuestas y el cierre de temas.

La autoría se conserva como nombre e identificador originales, sin crear
cuentas, asociar personas por un nombre aproximado ni conceder nuevos roles.
Los usuarios eliminados aparecen como «Usuario eliminado». Se conservan
fechas de creación/publicación y edición, fijados, categorías y archivo.
Los temas y publicaciones eliminados permanecen en el respaldo, pero no se
vuelven a publicar. Los temas sin publicaciones conservan su título y una
indicación de que el origen ya estaba vacío.

El texto bilingüe original se mantiene en ambos idiomas, sin traducción
automática. Las imágenes adjuntas se incrustan desde la nueva colección;
documentos y vídeos adjuntos se enlazan a sus nuevas descargas autenticadas.
Las incrustaciones y miniaturas externas se conservan como enlaces a su origen.
Los enlaces a temas y respuestas incluidos en la importación se reescriben.
El dominio del foro antiguo no se redirige automáticamente.

Los permisos de noticias, respuestas y adjuntos se aplican en las colecciones,
además del servicio del frontend. Los adjuntos importados llevan su área;
los del equipo técnico exigen pertenencia al grupo o un rol de gestión.
El almacenamiento de adjuntos conserva el acceso de Payload, sin URL pública.

La importación usa `saltarAvisoDelTablon` y `notifiedAt`, con correo, jobs y seed
desactivados. Carga primero los adjuntos y prepara los temas con fecha futura;
solo publica cada tema cuando su contenido está convertido. El informe
contrasta recuentos y comprueba que no se han creado notificaciones.

Procedimiento desde `apps/web` y dentro del devcontainer:

1. Guardar `source.json` y su `source.sha256` en un directorio privado ignorado
   por Git; respaldar también la base de destino antes de modificarla.
2. `node scripts/nodebb/export-assets.mjs /ruta/al/respaldo` descarga los
   adjuntos y guarda tamaños y hashes en `assets.json`.
3. Crear la base local aislada `pafe_nodebb_import` y ejecutar
   `node scripts/nodebb/run.mjs test /ruta/al/respaldo`.
4. Ejecutar `verify.mjs` con `DATABASE_URL` y `NODEBB_IMPORT_DIR` explícitos;
   comprueba texto, recuentos, fechas y categorías en ambos idiomas.
5. Aplicar la migración con `payload migrate`, push a `main` y esperar a
   que Vercel publique los permisos y campos nuevos.
6. `node scripts/nodebb/run.mjs production /ruta/al/respaldo /ruta/production.env HOST_NEON`
   exige confirmar el hostname de destino. Nunca activar schema push.
7. Ejecutar la verificación de producción y probar el archivo, un tema con
   respuestas y las descargas autenticadas. Mantener el origen disponible.

Las exportaciones, binarios, credenciales e informes contienen datos privados:
no se versionan. El respaldo de 2026-09-23 contiene 276 temas, 301 publicaciones
y 354 archivos. El conjunto publicable es de 266 temas (231 archivados),
23 respuestas y 341 adjuntos utilizados; incluye dos temas ya vacíos en origen.
