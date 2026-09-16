# Despliegue en Cloudflare Pages

La wiki se publica con el mismo patrón que `singular-solving-propuesta`: build de Quartz en
GitHub Actions y `wrangler pages deploy`, con el sitio entero detrás de Basic Auth.

- Workflow: `.github/workflows/deploy-pafe-wiki.yaml` (push a `destilado` o manual).
- Proyecto de Pages: `pafe-wiki`, rama de producción `destilado`.
- URL: `https://pafe-wiki.pages.dev`.
- Protección: `functions/_middleware.js` exige contraseña y marca las respuestas
  `noindex, nofollow` y `private, no-store`.

## Por qué va protegida

Las notas son destilados de obras con copyright y material de trabajo interno de PAFE. Si
`SITE_PASSWORD` no está configurado, el middleware responde **503** en lugar de servir el
sitio en abierto: es un fallo cerrado deliberado, para que un despliegue a medio configurar
no acabe indexado.

## Estado

Ya está en marcha: el proyecto `pafe-wiki` existe, tiene `SITE_PASSWORD` configurado y los
tres secrets están puestos en el repositorio, así que tanto el CI como el despliegue manual
funcionan sin más preparación. Las credenciales de Cloudflare son las mismas que usa
`singular-solving-propuesta` (`~/.cloudflare/ss-propuesta.env`), igual que la contraseña de
lectura.

Si hubiera que rehacerlo en otra cuenta o repositorio:

```bash
gh secret set CLOUDFLARE_API_TOKEN  --repo Fiser12/PAFE-Wiki   # token con permiso Pages:Edit
gh secret set CLOUDFLARE_ACCOUNT_ID --repo Fiser12/PAFE-Wiki
gh secret set SITE_PASSWORD         --repo Fiser12/PAFE-Wiki   # contraseña de lectura
```

El workflow crea el proyecto de Pages si no existe y propaga `SITE_PASSWORD`, así que no hay
que tocar el dashboard de Cloudflare.

## Despliegue

Automático en cada push a `destilado`. A mano, con el mismo patrón que el `deploy-cf.sh` de
singular:

```bash
bash scripts/deploy-cf.sh
```

Para lanzar el workflow sin esperar a un push:

```bash
gh workflow run deploy-pafe-wiki.yaml --repo Fiser12/PAFE-Wiki --ref destilado
gh run watch --repo Fiser12/PAFE-Wiki
```

## Acceso

Usuario: cualquiera. Contraseña: el valor de `SITE_PASSWORD`. Para cambiarla basta
reasignar el secret y volver a lanzar el workflow.

## Build en local

```bash
npm ci
npx quartz build          # genera public/
npx quartz build --serve  # con recarga en caliente
```

`public/` está en `.gitignore`: el sitio se construye en cada despliegue, nunca se commitea.

## Detalles a tener en cuenta

- **`baseUrl`** en `quartz.config.yaml` es `pafe-wiki.pages.dev`. De él dependen los enlaces
  absolutos, el sitemap y el RSS: hay que cambiarlo si se pone un dominio propio.
- **Sin telemetría**: `analytics: null`. El sitio es interno y no envía las URL de las notas
  a terceros.
- **`fetch-depth: 0`** en el checkout no es opcional: el plugin de fechas usa el historial de
  git para datar cada nota.
- El workflow verifica que el build publica 95 notas de libro o más antes de desplegar, para
  no subir un sitio vacío si el build se degrada.
- Los workflows heredados del upstream de Quartz (`ci.yaml`, `deploy-v5.yaml`, …) están
  limitados a `jackyzha0/quartz` y no se ejecutan aquí.
