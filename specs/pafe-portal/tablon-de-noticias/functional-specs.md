# Tablón de noticias — PAFE-Portal

## 1. Summary

El foro (NodeBB en `foro.pafe-formakuntza.com`) se retira y su función pasa al
portal como **tablón de noticias**. Se acordó en la reunión del 14 de septiembre
de 2026: «lo que hacéis ya con el foro se puede hacer con un tablón de noticias,
y además ya tengo programado un sistema para que haga notificaciones».

Lo único que el equipo pidió conservar es **la estructura de áreas** y que el
tablón quede **encima** de los préstamos, en la misma página. El uso real del
foro es publicar avisos: no hay conversación, y ni menciones, ni reacciones, ni
encuestas están en uso, así que no se replican.

El día del cambio se retira el acceso al foro antiguo.

## 2. Actors & Roles

| Actor | Qué puede hacer |
|---|---|
| **Familia** (`familia`) | Leer el tablón, elegir de qué áreas quiere recibir aviso |
| **Staff** (`profesional`, `admin`) | Todo lo anterior, más publicar, editar y fijar noticias |
| **Sin rol** | Nada: no ve el tablón |
| **Sistema** | Avisar a quien esté suscrito al área de cada noticia nueva |

## 3. Goals & User Jobs

- Que el equipo publique un aviso y le llegue a quien le interesa, sin convocar a nadie.
- Que una familia entre a un único sitio y vea las novedades y sus préstamos.
- Que nadie tenga que entrar a un segundo sistema con otra contraseña.

## 4. Entry Points

- **Inicio del portal**: el tablón arriba, los préstamos debajo.
- **Campana de avisos** de la cabecera, que ya existe para el préstamo.
- **Correo**, para quien esté suscrito a un área.

## 5. Workflows

### T1 — Publicar una noticia (staff)
1. Staff redacta título y cuerpo, elige **un área** y publica.
2. La noticia aparece en el tablón, ordenada por fecha; las fijadas van primero.
3. El sistema avisa a quien esté suscrito a esa área (W T3).

### T2 — Leer el tablón (familia)
1. Entra al portal y ve las noticias, con su área.
2. Puede filtrar por área.

### T3 — Aviso de noticia nueva (sistema)
1. Al publicarse una noticia, el sistema busca a los suscritos a su área.
2. A cada uno le deja un aviso en la campana y le envía un correo.
3. Quien la publica no se avisa a sí mismo.
4. Si no hay suscriptores, no se envía nada.

### T4 — Elegir áreas (familia y staff)
1. Cada persona marca las áreas de las que quiere recibir aviso.
2. El cambio es inmediato y afecta solo a lo que se publique después.

### T5 — Retirada del foro
1. El día del cambio se retira el acceso a `foro.pafe-formakuntza.com`.
2. Lo que se quiera conservar del foro se copia a mano al tablón antes de esa fecha.

## 6. Functional Rules & Constraints

- **R1** — Una noticia pertenece a **un área**, obligatoria.
- **R2** — Solo el staff publica, edita o fija. Las familias solo leen.
- **R3** — Un usuario **sin rol** no ve el tablón, igual que no ve el catálogo.
- **R4** — El orden es: fijadas primero, y dentro de cada grupo, la más reciente arriba.
- **R5** — El aviso se manda **una sola vez**, al publicar. Editar una noticia no vuelve a avisar.
- **R6** — Solo se avisa de noticias **publicadas**: una noticia con fecha futura no avisa hasta que llega.
- **R7** — Nadie recibe aviso de su propia noticia.
- **R8** — Un fallo de correo no debe impedir que la noticia se publique ni que el aviso quede en la campana.
- **R9** — A quién avisa lo decide el área, no cada persona: `Berriak PAFE` avisa a las familias y las demás no avisan a nadie, como en el foro.
- **R10** — `LANTALDE TEKNIKOA` exige pertenecer a un grupo con ese nombre: sin él no se ve en el tablón, no se abre por su URL y no llega nada de ella. El staff la ve, que es quien publica.
- **R11** — Se responde solo a lo que se puede ver, y un mensaje vacío no vale.
- **R12** — Las imágenes y documentos van dentro del texto de la noticia, en el punto donde toquen, y se guardan en el S3 del portal.

## 7. Data Concepts

| Concepto | Notas |
|---|---|
| **Noticia** | Título, cuerpo, área, fecha de publicación, autoría, fijada |
| **Área** | Término de taxonomía con faceta `area`, replicando las del foro |
| **Suscripción** | Áreas elegidas por cada usuario |
| **Aviso** | Se reutiliza la colección existente, con un tipo nuevo y relación a la noticia |

## 8. Fuera de alcance

Menciones, reacciones, encuestas, notificaciones push y búsqueda dentro del
tablón: no se usan hoy en el foro.

**Las respuestas entran en alcance por decisión del 16 de septiembre**, después
de haberlas dejado fuera: quien lee una noticia puede contestarla, corregir su
mensaje y retirarlo, y el staff puede retirar el de cualquiera. Retirar una
noticia se lleva sus respuestas. La traducción al
euskera queda aplazada por decisión del 16 de septiembre, con la consecuencia
conocida de que el foro sí estaba traducido y el portal todavía no.
