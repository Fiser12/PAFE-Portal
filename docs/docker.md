# Despliegue Docker fuera de Vercel

Requiere Docker con Compose 2.20 o posterior, acceso a los registros de imágenes,
npm y GitHub durante la compilación, PostgreSQL 17 y un bucket S3 compatible.
La web no depende de Vercel: puede conservar Neon y R2 o usar otros proveedores.
La wiki se construye dentro de la imagen desde `apps/wiki`, con el toolkit fijado
en `apps/wiki/okf/quartz-okf.ref`; no se copia la wiki generada en el equipo local.

## Configuración

Desde la raíz del repositorio:

```bash
cp .example.docker.env .docker.env
chmod 600 .docker.env
openssl rand -hex 32
```

Completar `.docker.env`. Generar un valor distinto para `PAYLOAD_SECRET`,
`AUTH_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET` y `POSTGRES_PASSWORD`. No utilizar
secretos de producción en pruebas locales. No cambiar los secretos de una
instalación existente durante una actualización.

- `NEXT_PUBLIC_SERVER_URL`: URL pública completa, sin barra final. Compose la
  pasa al build y al runtime. Cambiar dominio requiere reconstruir la imagen.
- `DATABASE_URL`: para PostgreSQL local usa `db:5432/db`, nunca `localhost`
  dentro del contenedor. El ejemplo interpola usuario, contraseña y base.
  Para Neon sustituir la URL completa, conservando sus parámetros SSL.
- `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID` y
  `S3_SECRET_ACCESS_KEY`: bucket ya creado, privado y con permisos limitados.
  R2 usa región `auto`. No se almacenan uploads en el sistema de archivos de la
  aplicación. Migrar a otro bucket requiere copiar también los objetos.
- `S3_PUBLIC_URL`: opcional, solo para portadas públicas; también afecta al build.
  Los adjuntos del foro siguen pasando por el control de acceso de Payload.
- `AUTH_CLIENT_ID` y `AUTH_CLIENT_SECRET`: Google OAuth. Autorizar el origen y
  la URI exacta `https://TU-DOMINIO/api/auth/callback/google`; para probar Google
  en local, registrar también `http://localhost:3000/api/auth/callback/google`.
- `RESEND_API_KEY` y `EMAIL_FROM`: necesarios para entregar correos reales.
  Sin API key, los correos se escriben en consola; no es entrega de correo.

Usar **siempre** `--env-file .docker.env`: `env_file` del servicio por sí solo
no alimenta la interpolación de Compose ni los argumentos de compilación.
Si se usa otro fichero, pasar además `PAFE_ENV_FILE=/ruta/al/fichero` en el entorno.

## PostgreSQL local

```bash
docker compose --env-file .docker.env --profile local-db up -d --wait db
docker compose --env-file .docker.env --profile tools build pafe-portal migrate
docker compose --env-file .docker.env --profile local-db --profile tools run --rm migrate
docker compose --env-file .docker.env --profile local-db up -d --wait pafe-portal
```

El perfil `local-db` mantiene los datos en `./.docker/postgres`, como el Compose
anterior. `PAFE_POSTGRES_DIR` permite otra ruta. No cambiarla para actualizar una
instalación existente. PostgreSQL no publica ningún puerto en el host.

Las variables `POSTGRES_*` inicializan una base **vacía**; cambiarlas no renombra
ni modifica usuarios de una base ya existente. Usar los valores actuales.

## Neon u otro PostgreSQL externo

Configurar `DATABASE_URL` y omitir el perfil `local-db`:

```bash
docker compose --env-file .docker.env --profile tools build pafe-portal migrate
docker compose --env-file .docker.env --profile tools run --rm migrate
docker compose --env-file .docker.env up -d --wait pafe-portal
```

No se crea un PostgreSQL local. `POSTGRES_*` no se usa en este modo.

## Migraciones y actualizaciones

Hacer y comprobar un respaldo antes de migrar una base existente. El servicio
`migrate` ejecuta exclusivamente las migraciones versionadas de Payload y sale.
Rechaza una marca `dev`/batch -1 sin borrarla ni aceptar prompts destructivos.
Mantiene un lock de PostgreSQL para evitar dos invocaciones simultáneas de este
servicio. No ejecutar migradores externos en paralelo.

El servidor normal impone `PAYLOAD_RUN_MIGRATIONS=false`,
`PAYLOAD_DISABLE_PUSH=true` y `SEED_MOCK_DATA=false`. No modifica el esquema al
arrancar y no siembra cuentas de prueba. Las migraciones nuevas se generan con
`payload migrate:create`, nunca editando SQL a mano.

Para actualizar: respaldar, construir ambas imágenes, ejecutar `migrate` y
recrear `pafe-portal` con los mismos comandos anteriores. Si una migración falla,
no continuar con el arranque. No hay volúmenes sobre `node_modules` ni `.next`:
recrear el contenedor publica exactamente el código de la imagen nueva.

## Red y trabajos programados

Por defecto la web escucha solo en `127.0.0.1:3000` del host. Poner delante un
proxy inverso con TLS que preserve Host y cabeceras forwarded. `PAFE_PORT` cambia
el puerto del host; si cambia la URL visible, actualizar `NEXT_PUBLIC_SERVER_URL`
y reconstruir. `PAFE_BIND_ADDRESS` permite otra interfaz cuando sea necesario.
No publicar PostgreSQL ni el bucket privado. Para un dominio propio, seguir
también el runbook de DNS/proxy de infraestructura del equipo.

En un proceso persistente, Payload tiene `jobs.autoRun` para la cola
`recordatorios` a las 06:15 (UTC por defecto), incluyendo los avisos programados
del tablón y tareas. `DISABLE_JOBS_AUTORUN=true` los desactiva. Con varias réplicas,
usar un solo ejecutor/scheduler; no duplicar además el cron de Vercel. El health
check inicializa la aplicación, pero no prueba un envío de correo.

## Verificación

```bash
docker compose --env-file .docker.env ps
docker compose --env-file .docker.env logs --tail=100 pafe-portal
bash scripts/test-docker.sh pafe-portal:local pafe-portal-migrator:local http://localhost:3000
```

La prueba comprueba wiki incluida, ausencia de respaldos/secretos locales en la
imagen de migración, rutas HTTP, consulta PostgreSQL y bloqueo del foro sin sesión.
Adaptar los nombres si se configura `PAFE_IMAGE` o `PAFE_MIGRATOR_IMAGE`.
Verificar además con una cuenta autorizada: login Google, foro, archivo, wiki,
descarga/subida de adjuntos y correo real. La prueba automática no utiliza
credenciales reales ni envía correos.
