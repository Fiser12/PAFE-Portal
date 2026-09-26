# Foro del portal

`/foro` ofrece una vista amplia del tablón, accesible desde el menú principal
y desde la portada. Usa las noticias y respuestas existentes: no importa por
sí sola los datos de NodeBB.

Permite filtrar por área, consultar el archivo y buscar por título en el idioma
seleccionado. Cada página muestra 20 temas, con las noticias fijadas primero,
seguidas de las más recientes. Los filtros se conservan en la URL. La entrada abre Berriak PAFE y el selector
no ofrece «Todas». Administración dispone de un botón Crear noticia.

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

## Organización y altas

El menú se ordena como Calendario, Foro, Catálogo, Moodle, Wiki, Área personal
y Administración, mostrando solo los accesos permitidos. Catálogo y Wiki
quedan reservados a los psicólogos y a Administración. El rol `profesional`
identifica a los psicólogos; la pertenencia histórica al grupo
`lantalde-teknikoa` también da acceso a una cuenta con rol activo. Las familias
no deben pertenecer a ese grupo. El resto de roles de gestión no concede por
sí solo acceso al Catálogo o Wiki.

Administración requiere `admin`; debe asignarse únicamente a Alberto y Rubén.
El código no modifica las cuentas existentes: antes de publicar hay que
comprobar quién tiene ese rol y completar la pertenencia de los psicólogos.
No ejecutar `scripts/migrar-roles.ts`: convertía `profesional` a gestión de
catálogo, mientras que ahora se conserva para identificar a los psicólogos.

El inicio contiene Calendario, con Agenda, Semana y Mes; al navegar se cargan
los eventos del periodo elegido. Área personal contiene el acceso al Tablón y
Mis préstamos. Moodle conserva su enlace y autenticación.

Para las altas, abrir Administración → Usuarios → **Invite User**. Elegir
**Familia** o **Profesional**, escribir el correo y pulsar **Send Email**.
Cada invitación sirve para una sola alta: volver al listado antes de preparar
la siguiente. El enlace abre el registro y después lleva al Foro. Para una
cuenta existente, editar su rol en Usuarios. Quien entra por Google sin
invitación queda sin rol hasta que Administración lo activa.

Los grupos se gestionan en Grupos de usuarios y se asignan desde la ficha de
cada usuario. No se importaron cuentas ni contraseñas de NodeBB: revisar las
altas con el listado del foro antiguo. El propio panel incluye estas
instrucciones y un enlace para crear noticias. Guardar una noticia en Berriak
PAFE con fecha ya alcanzada envía el aviso configurado a las familias.

La protección de Wiki verifica la sesión y el permiso también para sus HTML,
JSON y archivos estáticos. El catálogo comprueba acceso en sus páginas,
colecciones e índice de búsqueda. Las nuevas reservas y la consulta de
existencias también requieren pertenecer al equipo técnico.

Para validar con un servidor de desarrollo ya arrancado, usar
`NEXT_DIST_DIR=.next-validation pnpm exec next build` dentro del devcontainer.
Así el build no sobrescribe la carpeta `.next` que está usando `next dev`.

Si se cambia el puerto local, reiniciar también el proceso Next con
`NEXT_PUBLIC_SERVER_URL` igual a la URL del navegador. Cambiar únicamente
el reenvío de Docker deja obsoleto el origen permitido y el callback de Google.
Comprobar con `node scripts/check-local-auth.mjs` desde `apps/web` dentro del
devcontainer; `TEST_BASE_URL` permite indicar otra URL local. Esta comprobación
no inicia sesión ni valida el intercambio final de Google.
