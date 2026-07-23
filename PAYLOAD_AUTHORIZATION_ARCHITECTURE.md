# Autorización de recursos en Payload CMS

Este documento propone cómo restringir cuestionarios guiados, elementos del catálogo
y futuros recursos de PAFE según el usuario, sus grupos, su misión y el contexto de la
petición. Compara una primera implementación completamente nativa en Payload CMS con
una evolución a SpiceDB.

La decisión recomendada es:

1. Introducir desde el principio un puerto de autorización propio.
2. Implementarlo inicialmente con Access Control y relaciones de Payload.
3. Migrar a SpiceDB solo cuando las relaciones jerárquicas, el número de servicios o
   el volumen de permisos hagan insuficiente el modelo nativo.

OPA no forma parte de esta primera decisión. SpiceDB encaja mejor con el dominio
previsto —usuarios, grupos o unidades, misiones y recursos asignados— porque el
problema principal es relacional. OPA se reservaría para políticas contextuales que
no puedan expresarse de forma mantenible mediante relaciones y caveats de SpiceDB.

## Objetivos y límites

- Autorizar por recurso y acción: `view`, `execute`, `edit`, `assign` y `delete`.
- Filtrar correctamente listados, no solo proteger el acceso por ID.
- Aplicar las mismas reglas en REST, GraphQL, Local API, Admin y rutas de Next.js.
- Rechazar por defecto cuando falte identidad, contexto o el servicio de permisos.
- Mantener `flowgraph-core`, los esquemas FlowGraph y los plugins de preguntas al
  margen de la identidad y la autorización.
- No guardar expresiones ejecutables ni scripts de autorización dentro del JSON del
  cuestionario.
- Distinguir autorización de seguridad de disponibilidad de producto. Por ejemplo,
  que una opción no tenga stock es disponibilidad; que un usuario no pueda conocer
  su existencia es autorización.

## Frontera estable de la aplicación

El resto de PAFE no debería importar directamente un cliente de SpiceDB ni construir
consultas de permisos de Payload. Debe depender de un contrato propio:

```ts
export type ResourceAction =
  | 'view'
  | 'execute'
  | 'edit'
  | 'assign'
  | 'delete'

export type ResourceRef = {
  type: 'guided-questionnaire' | 'catalog-item'
  id: string
}

export type AuthorizationContext = {
  now: string
  missionID?: string
  deviceTrusted?: boolean
  region?: string
}

export interface AuthorizationPort {
  can(input: {
    subjectID: string
    action: ResourceAction
    resource: ResourceRef
    context: AuthorizationContext
  }): Promise<boolean>

  accessibleResourceIDs(input: {
    subjectID: string
    action: ResourceAction
    resourceType: ResourceRef['type']
    context: AuthorizationContext
  }): Promise<string[]>
}
```

Este contrato pertenece a la aplicación, no a FlowGraph. Los loaders reciben un
contexto ya autenticado del host y vuelven a comprobar el permiso sobre cualquier
recurso que consulten.

## Opción A: implementación nativa en Payload CMS

### Modelo de datos

La primera versión debe favorecer campos consultables e indexables en los propios
recursos. Es más sencillo y eficiente que crear desde el principio un intérprete de
políticas genérico.

Se puede reutilizar una factoría de campos `resourceAccessFields()` en
`guided-questionnaires` y en los elementos del catálogo:

```text
accessPolicy.mode
  authenticated | restricted

accessPolicy.allowedUsers
  relationship[] -> users

accessPolicy.allowedGroups
  relationship[] -> groups

accessPolicy.allowedMissions
  relationship[] -> missions

accessPolicy.minimumClearance
  number | null

accessPolicy.validFrom
  date | null

accessPolicy.validUntil
  date | null
```

El usuario necesita los atributos correspondientes, por ejemplo `groups`,
`missions` y `clearance`. Los grupos actuales pueden seguir sin conceder permisos
globales: pertenecer a un grupo solo afecta a un recurso si ese recurso incluye
explícitamente el grupo en `allowedGroups`.

La semántica inicial debe ser pequeña y explícita:

- El estado y la ventana temporal se combinan con `AND`.
- En modo `restricted`, usuarios, grupos y misiones permitidos se combinan con `OR`.
- El nivel del usuario debe satisfacer `minimumClearance` cuando esté configurado.
- Staff puede administrar todos los recursos, pero ejecutar como usuario debe poder
  comprobarse separadamente para evitar que el privilegio editorial altere pruebas
  funcionales.

### Access Control de las colecciones

Las funciones `access.read` y `access.update` deberían devolver restricciones
`Where` siempre que sea posible. Así Payload combina el permiso con la consulta y
PostgreSQL solo devuelve documentos autorizados.

Ejemplo orientativo:

```ts
export const canReadRestrictedResource: Access = ({ req }) => {
  const user = req.user
  if (!user || !isActiveUser(user)) return false
  if (isStaff(user)) return true

  const now = new Date().toISOString()
  const userIDs = [user.id]
  const groupIDs = relationshipIDs(user.groups)
  const missionIDs = relationshipIDs(user.missions)

  return {
    and: [
      {
        or: [
          { 'accessPolicy.validFrom': { exists: false } },
          { 'accessPolicy.validFrom': { less_than_equal: now } },
        ],
      },
      {
        or: [
          { 'accessPolicy.validUntil': { exists: false } },
          { 'accessPolicy.validUntil': { greater_than_equal: now } },
        ],
      },
      {
        or: [
          { 'accessPolicy.mode': { equals: 'authenticated' } },
          { 'accessPolicy.allowedUsers': { in: userIDs } },
          { 'accessPolicy.allowedGroups': { in: groupIDs } },
          { 'accessPolicy.allowedMissions': { in: missionIDs } },
        ],
      },
      {
        or: [
          { 'accessPolicy.minimumClearance': { exists: false } },
          {
            'accessPolicy.minimumClearance': {
              less_than_equal: user.clearance,
            },
          },
        ],
      },
    ],
  }
}
```

El ejemplo deberá ajustarse a los tipos generados y a la semántica exacta del
adaptador PostgreSQL de la versión de Payload instalada. Las funciones auxiliares
deben devolver `false` cuando una lista de relaciones requerida esté vacía; no deben
generar filtros abiertos accidentalmente.

`create`, `delete` y los cambios en `accessPolicy` se reservan inicialmente a staff.
Los campos sensibles también pueden tener Field Access Control para impedir que un
usuario vea metadatos como clasificación, reglas internas o asignaciones aunque
pueda leer parte del documento.

### Puntos de aplicación obligatorios

1. `guided-questionnaires.access.read` controla listados y lecturas por ID.
2. La colección de elementos del catálogo aplica la misma factoría y regla base.
3. Las ejecuciones de cuestionarios comprueban `execute`, no solamente `view`, al
   crear, reanudar y completar una ejecución.
4. Cada loader vuelve a autorizar los recursos que vaya a leer.
5. Las Server Actions y rutas de Next.js pasan la petición autenticada a Payload.
6. El Admin usa Access Control real; ocultar componentes es solo presentación.

La Local API de Payload usa `overrideAccess: true` por defecto. Toda operación hecha
en nombre de un usuario debe pasar `req` o `user` y establecer explícitamente
`overrideAccess: false`. Las operaciones privilegiadas deben estar aisladas, tener
un nombre que las identifique como internas y no reutilizarse desde rutas de usuario.

En particular, la ruta actual de cuestionarios usa `overrideAccess: true` y realiza
una comprobación de usuario activo por separado. Al introducir autorización por
recurso deberá cambiarse para que la lectura del documento respete el Access Control
de Payload; de lo contrario el nuevo filtro de colección quedaría anulado.

### Implementación del puerto nativo

`PayloadAuthorizationAdapter.can()` puede realizar una lectura con
`overrideAccess: false` y considerar autorizado únicamente un documento recuperable.
Para listados normales, es preferible consultar directamente la colección con Access
Control, ya que preserva filtros, ordenación y paginación sin crear una lista previa
de IDs.

`accessibleResourceIDs()` se reserva para consumidores que realmente necesiten IDs.
No debería utilizarse como paso previo universal a todas las consultas.

### Auditoría y pruebas

- Registrar cambios de política y asignaciones con actor, recurso y fecha.
- Auditar decisiones sensibles como `execute`, `assign` y exportaciones, evitando
  almacenar contexto personal innecesario.
- Probar acceso por ID y por listado para cada acción.
- Probar usuarios sin rol, relaciones vacías, documentos inexistentes y ventanas
  temporales en sus límites.
- Probar que REST, GraphQL, Server Actions y Local API obtienen el mismo resultado.
- Añadir una prueba específica que falle si una ruta de usuario usa
  `overrideAccess: true` para estas colecciones.

### Cuándo deja de ser suficiente

El modelo nativo debe revisarse si aparece alguno de estos síntomas:

- Jerarquías de unidades o grupos con varios niveles y herencia.
- Delegaciones temporales y revocaciones frecuentes.
- Permisos compartidos entre varios servicios, no solo Payload.
- Necesidad de explicar por qué existe un permiso recorriendo relaciones.
- Demasiadas consultas auxiliares dentro de Access Control.
- Duplicación de reglas o relaciones en varios tipos de recurso.
- Dificultad para listar recursos autorizados sin posfiltrado o problemas de
  paginación.

## Opción B: Payload CMS con SpiceDB

### Responsabilidades

Payload continúa siendo la fuente de verdad del contenido:

- Cuestionarios, elementos, metadatos y borradores.
- Usuarios y los datos editoriales de grupos, unidades y misiones.
- Interfaz de administración de asignaciones.

SpiceDB se convierte en la fuente de verdad para las relaciones de autorización:

- Quién pertenece a un grupo o unidad.
- Qué unidad participa en una misión.
- Qué cuestionario o elemento está asignado a una misión.
- Quién puede ver, ejecutar, editar o delegar un recurso.

FlowGraph no conoce ninguna de las dos fuentes.

### Esquema orientativo de SpiceDB

```zed
definition user {}

definition group {
  relation member: user
}

definition mission {
  relation participant: user | group#member
}

definition questionnaire {
  relation owner: user
  relation editor: user | group#member
  relation viewer: user | group#member
  relation executor: user | group#member
  relation assigned_mission: mission

  permission edit = owner + editor
  permission view = edit + viewer + assigned_mission->participant
  permission execute = executor + assigned_mission->participant
}

definition item {
  relation owner: user
  relation editor: user | group#member
  relation viewer: user | group#member
  relation assigned_mission: mission

  permission edit = owner + editor
  permission view = edit + viewer + assigned_mission->participant
}
```

El esquema definitivo debe modelar los nombres del dominio, no copiar literalmente
este ejemplo. Las relaciones estables pertenecen al grafo de SpiceDB. El contexto
de petición —por ejemplo dispositivo confiable o región actual— puede entrar mediante
caveats. Una condición de seguridad no debe depender de campos editables por autores
de cuestionarios sin privilegios de administración.

### Integración con Access Control de Payload

Para una lectura por ID:

1. Payload obtiene el usuario autenticado.
2. `SpiceDBAuthorizationAdapter.can()` ejecuta `CheckPermission`.
3. Access Control devuelve `true` o `false`.

Para un listado:

1. El adaptador ejecuta `LookupResources` para `view`.
2. Access Control devuelve `{ id: { in: authorizedIDs } }`.
3. Payload combina ese filtro con la búsqueda y la paginación solicitadas.

Para tablas o pantallas con varias acciones por recurso se usa una comprobación
masiva, evitando una llamada remota por celda. `LookupResources` no debe tratarse
como una solución ilimitada: si el conjunto autorizado supera el tamaño práctico de
un filtro `IN`, habrá que diseñar paginación coordinada o un índice de autorización
materializado.

Las operaciones `create` que todavía no tienen ID de recurso pueden comprobar un
permiso sobre su contenedor, por ejemplo `mission:123#create_questionnaire` o
`organization:456#create_item`.

### Sincronización entre Payload y SpiceDB

No existe una transacción atómica entre PostgreSQL y SpiceDB. La sincronización debe
diseñarse explícitamente:

1. Los cambios editoriales de relaciones generan un evento idempotente en una
   colección `authorization-outbox`.
2. Un worker escribe o elimina relaciones en SpiceDB y registra la revisión devuelta.
3. Los reintentos conservan la misma clave de idempotencia.
4. Un reconciliador periódico compara Payload y SpiceDB para reparar divergencias.
5. Un recurso nuevo o con permisos modificados permanece no publicado o no
   ejecutable hasta confirmar la sincronización.

Las revocaciones son especialmente sensibles: ante una divergencia se debe fallar de
forma cerrada. Si SpiceDB no está disponible, PAFE no concede un permiso que no pueda
demostrar. Los caches de decisiones deben ser breves y tener una estrategia explícita
para revocaciones.

Los IDs enviados a SpiceDB deben ser estables, opacos y convertidos siempre con la
misma función. No se envían títulos, respuestas del cuestionario ni contenido Lexical.

### Operación y seguridad

- Autenticar y cifrar la comunicación con SpiceDB.
- Separar credenciales de escritura, comprobación y migración cuando sea viable.
- Versionar y probar el esquema de SpiceDB antes de desplegarlo.
- Correlacionar decisiones con un request ID sin registrar respuestas sensibles.
- Usar la revisión devuelta por SpiceDB cuando una operación necesite consistencia
  read-after-write.
- Mantener una ruta administrativa de diagnóstico y reconciliación, no un bypass de
  autorización.

## Migración sin ruptura

1. Extraer las reglas actuales de `src/core/permissions.ts` detrás de utilidades y
   del `AuthorizationPort`, conservando su comportamiento.
2. Añadir los campos de política y Access Control nativo a cuestionarios y elementos.
3. Corregir todas las llamadas Local API de usuario para respetar Access Control.
4. Añadir SpiceDB en modo sombra: sincronizar relaciones y comparar decisiones sin
   usarlas todavía para permitir accesos.
5. Medir divergencias y completar pruebas de listados, revocación y fallos de red.
6. Cambiar el adaptador a SpiceDB por tipo de recurso mediante una feature flag.
7. Retirar campos nativos redundantes únicamente después de estabilizar la nueva
   fuente de verdad. Los campos editoriales que originan relaciones pueden permanecer
   en Payload.

## Decisión de largo plazo

- **Ahora:** Access Control nativo de Payload, sin servicios ni dependencias nuevas.
- **Preparación obligatoria:** `AuthorizationPort`, reglas reutilizables, deny by
  default, auditoría y ausencia de bypasses en la Local API.
- **Cuando el dominio sea realmente relacional y compartido:** SpiceDB.
- **Solo si aparecen políticas contextuales generales que SpiceDB y sus caveats no
  expresen limpiamente:** evaluar OPA como segundo punto de decisión, no introducirlo
  por anticipado.

## Referencias

- [Payload CMS: Access Control](https://payloadcms.com/docs/access-control/overview)
- [Payload CMS: Collection Access Control](https://payloadcms.com/docs/access-control/collections)
- [Payload CMS: Local API Access Control](https://payloadcms.com/docs/local-api/access-control)
- [SpiceDB: schema y relaciones](https://authzed.com/docs/spicedb/concepts/schema)
- [SpiceDB: consulta de permisos](https://authzed.com/docs/spicedb/concepts/querying-data)
- [SpiceDB: caveats](https://authzed.com/docs/spicedb/concepts/caveats)
